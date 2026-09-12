import { createHash } from 'node:crypto';

export const FIT_VALUES = ['below_preferred', 'just_right', 'above_preferred'];
export const LIKING_VALUES = ['positive', 'neutral', 'negative'];
export const OVERALL_VALUES = ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'];
export const unique = values => [...new Set(values)].sort();
export const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : item);
export const modelIdentifier = (kind, parts) => `${kind}:${createHash('sha256').update(canonical(parts)).digest('hex').slice(0, 20)}`;
export const recordScope = record => canonical([record.experienceId, record.attribute, record.reference ?? null, record.target, record.phase]);
export function sameSelection(left, right) {
  const a = left.selectionEvidence, b = right.selectionEvidence;
  if (!a || !b) return !a && !b;
  return ['selectionID', 'type', 'catalogVersion', 'relatedBubbleID'].every(key => (a[key] ?? null) === (b[key] ?? null));
}
export const attributeIdentity = row => canonical([row.attribute, row.reference ?? null]);
export const modelLabel = row => row.reference ?? row.attributeLabel ?? ({
  'taste.sweet': '단맛', 'taste.sour': '산미', 'taste.salty': '짠맛', 'taste.bitter': '쓴맛',
  'taste.umami': '감칠맛', 'texture.crisp': '바삭함', 'texture.soft': '부드러운 식감', 'aroma.roasted': '구운 향',
}[row.attribute] ?? row.attribute);
export function grouped(rows, key) {
  const groups = new Map();
  for (const row of rows) { const id = key(row); if (!groups.has(id)) groups.set(id, []); groups.get(id).push(row); }
  return [...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
}
export function modelEvidence(rows) {
  return [...new Map(rows.map(row => [row.observationId, {
    id: row.observationId, mealID: row.mealId, phrase: row.phrase ?? '',
    sourceSpans: row.sourceSpans ?? row.sourceAnswerRefs?.flatMap(ref => ref.sourceSpans ?? []) ?? [],
    selectionEvidence: row.selectionEvidence ?? null, conditionSources: row.conditionSources ?? [],
  }])).values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export function conditionSets(rows) {
  const sets = new Map([['[]', []]]), seen = new Set();
  for (const row of rows) {
    const available = ['target', 'phase', 'intensity'].flatMap(dimension => row[dimension] && row[dimension] !== 'unspecified'
      ? [{ dimension, value: row[dimension] }] : []).concat(row.dishKindIDs.map(value => ({ dimension: 'dishKind', value })));
    const signature = canonical(available); if (seen.has(signature)) continue; seen.add(signature);
    available.sort((a, b) => canonical(a) < canonical(b) ? -1 : 1);
    for (let i = 0; i < available.length; i++) {
      sets.set(canonical([available[i]]), [available[i]]);
      for (let j = i + 1; j < available.length; j++) {
        if (available[i].dimension !== available[j].dimension) {
          const pair = [available[i], available[j]]; sets.set(canonical(pair), pair);
        }
      }
    }
  }
  return [...sets].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
}
export const matchesConditions = (row, conditions) => conditions.every(c => c.dimension === 'dishKind'
  ? row.dishKindIDs.includes(c.value) : row[c.dimension] === c.value);

// 이 함수에는 소유자·시점·중복 ID 검사를 통과한 현재 유효 관찰만 전달한다.
export function scopedRatings(records, kind, scale, values) {
  const scopes = new Map(grouped(records, recordScope));
  return records.filter(row => row.kind === kind && row.scale === scale && values.includes(row.value)
    && row.attribute && !row.attribute.endsWith('.unspecified')).flatMap(row => {
    const related = (scopes.get(recordScope(row)) ?? []).filter(other => sameSelection(row, other));
    if (related.some(other => other.kind === 'sensory_presence' && other.value === false)) return [];
    const intensities = related.filter(other => other.kind === 'sensory_intensity' && other.scale === 'expression-strength-v1');
    const levels = unique(intensities.map(other => other.value));
    return [{ ...row, intensity: levels.length === 1 && ['weak', 'medium', 'strong'].includes(levels[0]) ? levels[0] : null,
      intensityConflict: levels.length > 1, evidenceRows: [row, ...intensities] }];
  });
}

export function buildFitPatterns(records, userID, policy, { includeEvidence = true } = {}) {
  const ratings = scopedRatings(records, 'preference_fit', 'preference-fit-v1', FIT_VALUES);
  const patterns = [];
  for (const [key, rows] of grouped(ratings, attributeIdentity)) {
    for (const [conditionKey, conditions] of conditionSets(rows)) {
      const selected = rows.filter(row => matchesConditions(row, conditions));
      const meals = grouped(selected, row => row.mealId).map(([mealID, items]) => {
        const values = unique(items.map(row => row.value));
        return { mealID, value: values.length === 1 ? values[0] : 'mixed' };
      });
      const distribution = { belowPreferred: 0, justRight: 0, abovePreferred: 0, mixed: 0, mealCount: meals.length };
      const fields = { below_preferred: 'belowPreferred', just_right: 'justRight', above_preferred: 'abovePreferred', mixed: 'mixed' };
      for (const meal of meals) distribution[fields[meal.value]]++;
      const values = unique(meals.map(meal => meal.value));
      const minimum = conditions.length ? policy.minConditionMeals : policy.minMeals;
      const repeatedValue = meals.length >= minimum && values.length === 1 && values[0] !== 'mixed' ? values[0] : null;
      const status = values.includes('mixed') || values.length > 1 ? 'mixed_fit'
        : repeatedValue ? 'repeated_fit' : meals.length === 1 ? 'observed_once' : 'limited_observations';
      const evidence = includeEvidence ? modelEvidence(selected.flatMap(row => row.evidenceRows)) : [];
      patterns.push({ id: modelIdentifier('fit-pattern', [userID, key, conditionKey]), attribute: rows[0].attribute,
        reference: rows[0].reference ?? null, label: modelLabel(rows[0]), conditions, distribution, status, repeatedValue,
        mealIDs: meals.map(meal => meal.mealID), evidenceIDs: evidence.map(item => item.id), evidence });
    }
  }
  return patterns.sort((a, b) => a.id < b.id ? -1 : 1);
}

export function buildOverallPatterns(records, userID, { includeEvidence = true } = {}) {
  const ratings = scopedRatings(records, 'attribute_liking', 'attribute-three-category-v1', LIKING_VALUES);
  const overallByExperience = new Map(grouped(records.filter(row => row.kind === 'overall_liking'
    && row.scale === 'overall-five-category-v1' && OVERALL_VALUES.includes(row.value)), row => row.experienceId));
  // 연결의 기본 단위는 식사 전체가 아닌 실제로 평가한 디시다. 다른 디시의 전체 평가를 붙이지 않는다.
  const pairs = ratings.flatMap(row => (overallByExperience.get(row.experienceId) ?? [])
    .filter(overall => overall.mealId === row.mealId)
    .map(overall => ({ ...row, overallValue: overall.value, evidenceRows: [...row.evidenceRows, overall] })));
  const patterns = [];
  for (const [key, rows] of grouped(pairs, attributeIdentity)) {
    for (const [conditionKey, conditions] of conditionSets(rows)) {
      const selected = rows.filter(row => matchesConditions(row, conditions));
      const cells = new Map(), mixedMealIDs = [];
      for (const [mealID, items] of grouped(selected, row => row.mealId)) {
        const combinations = unique(items.map(row => canonical([row.overallValue, row.value])));
        // 한 식사에 서로 다른 평가 쌍이 있으면 어느 쌍도 반복 한 표로 승격하지 않는다.
        if (combinations.length !== 1) { mixedMealIDs.push(mealID); continue; }
        const cellKey = combinations[0], first = items[0];
        const cell = cells.get(cellKey) ?? { overallValue: first.overallValue, attributeValue: first.value, mealIDs: [], evidenceIDs: [] };
        cell.mealIDs.push(mealID); if (includeEvidence) cell.evidenceIDs.push(...items.flatMap(row => row.evidenceRows.map(r => r.observationId)));
        cells.set(cellKey, cell);
      }
      const evidence = includeEvidence ? modelEvidence(selected.flatMap(row => row.evidenceRows)) : [];
      patterns.push({ id: modelIdentifier('overall-pattern', [userID, key, conditionKey]), attribute: rows[0].attribute,
        reference: rows[0].reference ?? null, label: modelLabel(rows[0]), conditions,
        cells: [...cells.values()].map(cell => ({ ...cell, evidenceIDs: unique(cell.evidenceIDs) })).sort((a, b) => OVERALL_VALUES.indexOf(a.overallValue) - OVERALL_VALUES.indexOf(b.overallValue)
          || LIKING_VALUES.indexOf(a.attributeValue) - LIKING_VALUES.indexOf(b.attributeValue)),
        mealIDs: unique(selected.map(row => row.mealId)), mixedMealIDs,
        evidenceIDs: evidence.map(item => item.id), evidence, causalClaim: null });
    }
  }
  return patterns.sort((a, b) => a.id < b.id ? -1 : 1);
}
