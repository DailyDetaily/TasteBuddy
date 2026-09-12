import {
  attributeLabel, canonical, confirmed, coverage, digest, evidenceQuotes, groupBy, qualifiedLiking,
  refs, scope, scopeKey, unique,
} from './evidence.mjs';

export const PERSONAL_INSIGHT_VERSION = 'tba-personal-insights/1';
const phaseLabels = {
  first_bite: '첫입', early_meal: '초반', during_meal: '먹는 동안', late_meal: '나중',
  after_swallow: '삼킨 뒤', after_meal: '식사 후', unspecified: '시점 미기록',
};
const foodNames = records => unique(records.map(record => record.foodName)).join(', ');
const labelFor = record => record.reference ?? attributeLabel(record.attribute);

export function buildPersonalInsights(normalized) {
  const records = normalized.records.filter(confirmed);
  const findings = [];
  function add(kind, key, support, { title, text, priority, ...content }) {
    const uniqueRecords = [...new Map(support.map(record => [record.observationId, record])).values()];
    const supportCoverage = coverage(uniqueRecords);
    findings.push({
      id: `finding:${digest([normalized.userId, kind, key]).slice(0, 20)}`,
      version: PERSONAL_INSIGHT_VERSION, kind, title, text, priority,
      topicKey: canonical(unique(uniqueRecords.map(record => canonical([record.attribute, record.reference])))),
      status: supportCoverage.meals > 1 ? 'observed_across_meals' : 'observed_in_experience',
      userId: normalized.userId, evidenceClass: normalized.evidenceClass,
      evidenceSetHash: normalized.evidenceSetHash, observationRefs: refs(uniqueRecords),
      scope: scope(uniqueRecords), coverage: supportCoverage, evidence: evidenceQuotes(uniqueRecords),
      causalClaim: null, populationClaim: null, ...content,
    });
  }
  const direct = records.filter(record => record.kind === 'attribute_liking' && !qualifiedLiking(record, records));
  for (const [key, items] of groupBy(direct, record => canonical([record.attribute, record.reference, record.scale]))) {
    const positive = items.filter(record => record.value === 'positive');
    const negative = items.filter(record => record.value === 'negative');
    const label = labelFor(items[0]);
    const contexts = groupBy(items, record => canonical([record.foodId, record.target, record.phase]));
    const contextPolarities = contexts.map(([id, rows]) => ({ id, rows, values: unique(rows.map(record => record.value)) }));
    const positiveContexts = contextPolarities.filter(context => context.values.length === 1 && context.values[0] === 'positive');
    const negativeContexts = contextPolarities.filter(context => context.values.length === 1 && context.values[0] === 'negative');
    if (positive.length && negative.length) {
      const contextual = positiveContexts.length && negativeContexts.length;
      add(contextual ? 'contextual_preference' : 'variable_preference', key, items, {
        title: contextual ? `${label}, 즐거웠던 경우와 아쉬웠던 경우` : `${label}에 대한 반응이 달랐어요`,
        text: `${foodNames(positive)}에서는 “${positive[0].phrase}”, ${foodNames(negative)}에서는 “${negative[0].phrase}”라고 남겼어요.`,
        priority: contextual ? 100 : 88,
        positiveRefs: refs(positive), negativeRefs: refs(negative),
        comparisonDimensions: ['foodId', 'target', 'phase'].filter(field => unique(items.map(record => record[field])).length > 1),
        contexts: contextPolarities.map(context => ({ scope: scope(context.rows), values: context.values, observationRefs: refs(context.rows) })),
        allowedClaim: '보고된 평가의 차이만 설명한다. 음식·부위·시점 차이를 원인으로 확정하지 않는다.',
      });
    } else if (positive.length || negative.length) {
      const selected = positive.length ? positive : negative;
      const repeated = coverage(selected).meals > 1;
      add(repeated ? 'repeated_preference' : 'scoped_preference', key, items, {
        title: positive.length ? `${label}에서 찾은 즐거움` : `${label}이 아쉬웠던 기록`,
        text: repeated ? `${foodNames(selected)}의 기록에 ${label}에 대한 ${positive.length ? '호감' : '아쉬움'}이 반복돼요.`
          : `${selected[0].foodName}에서 “${selected[0].phrase}”라고 남겼어요.`,
        priority: repeated ? 70 : 30,
        polarity: positive.length ? 'positive' : 'negative',
        positiveRefs: refs(positive), negativeRefs: refs(negative),
        allowedClaim: '기록한 음식과 조건에서 반복된 평가다. 먹어보지 않은 음식의 취향을 예측하지 않는다.',
      });
    }
  }
  for (const record of records.filter(record => record.kind === 'combination_liking')) {
    add('enjoyed_combination', record.observationId, [record], {
      title: record.value === 'positive' ? '함께 먹을 때 좋았던 조합' : '조합에 대해 남긴 느낌',
      text: `${record.foodName}: “${record.phrase}”`, priority: 95,
      components: record.combinationComponents,
      polarity: record.value,
      allowedClaim: '사용자가 직접 평가한 조합만 설명한다. 각 구성 감각의 개별 호감으로 나누지 않는다.',
    });
  }
  for (const [key, liking] of groupBy(direct, scopeKey)) {
    const intensity = records.filter(record => record.kind === 'sensory_intensity' && scopeKey(record) === key);
    if (!intensity.length) continue;
    // 한 범위에 서로 다른 강도가 기록되면 하나를 임의로 골라 관계를 만들지 않는다.
    if (unique(intensity.map(record => record.value)).length !== 1 || unique(liking.map(record => record.value)).length !== 1) continue;
    const descriptor = { strong: '강하게', weak: '은은하게', medium: '중간 정도로' }[intensity[0].value];
    add('intensity_and_liking', key, [...liking, ...intensity], {
      title: `${descriptor} 느낀 ${labelFor(liking[0])}의 평가`,
      text: `${liking[0].foodName}에서 ${descriptor} 느꼈다는 기록과 “${liking[0].phrase}”라는 평가가 함께 있어요.`,
      priority: 80, intensity: intensity[0].value, liking: liking[0].value,
      allowedClaim: '같은 대상·시점의 강도와 호감이다. 강해서 좋아했다는 인과나 개인 최적 강도를 확정하지 않는다.',
    });
  }
  for (const record of records.filter(record => record.kind === 'preference_fit')) {
    add('preferred_level', record.observationId, [record], {
      title: `${labelFor(record)}, ${record.value === 'above_preferred' ? '부담스러웠던 정도' : record.value === 'below_preferred' ? '아쉬웠던 정도' : '잘 맞았던 정도'}`,
      text: `${record.foodName}: “${record.phrase}”`, priority: 85,
      preferenceFit: record.value,
      allowedClaim: '이 음식과 시점에서 표현한 적정 수준이다. 모든 음식에서 이 감각을 싫어한다고 넓히지 않는다.',
    });
  }
  for (const [key, items] of groupBy(direct, record => canonical([record.experienceId, record.attribute, record.reference, record.target, record.scale]))) {
    const known = items.filter(record => record.phase !== 'unspecified');
    if (unique(known.map(record => record.phase)).length < 2 || unique(known.map(record => record.value)).length < 2) continue;
    add('within_meal_difference', key, known, {
      title: `${labelFor(known[0])}, 먹는 동안 달라진 평가`,
      text: known.map(record => `${phaseLabels[record.phase]}에는 “${record.phrase}”`).join(' / '),
      priority: 105,
      allowedClaim: '한 경험의 명시된 시점별 평가다. 초반을 첫입으로 바꾸거나 장기 취향 변화로 해석하지 않는다.',
    });
  }
  for (const record of records.filter(record => record.kind === 'attribute_liking' && qualifiedLiking(record, records))) {
    const absence = records.filter(other => other.kind === 'sensory_presence' && other.value === false && scopeKey(other) === scopeKey(record));
    add('qualified_preference', record.observationId, [record, ...absence], {
      title: '감각이 없었던 경험의 평가', text: `${record.foodName}: “${record.phrase}”`, priority: 82,
      allowedClaim: '감각 부재가 포함된 평가다. 그 감각 자체를 좋아하거나 싫어한다고 분리하지 않는다.',
    });
  }
  findings.sort((a, b) => b.priority - a.priority || b.coverage.meals - a.coverage.meals || a.id.localeCompare(b.id));
  // 같은 발견을 중복 카드로 채우지 않는다. 자세한 근거에는 모든 관점을 보존한다.
  const highlights = [];
  for (const finding of findings) {
    if (highlights.some(other => other.topicKey === finding.topicKey)) continue;
    if (highlights.some(other => finding.observationRefs.every(id => other.observationRefs.includes(id)))) continue;
    highlights.push(finding);
    if (highlights.length === 6) break;
  }
  return {
    version: PERSONAL_INSIGHT_VERSION, userId: normalized.userId,
    evidenceSetHash: normalized.evidenceSetHash, evidenceClass: normalized.evidenceClass,
    coverage: normalized.coverage, findings, highlights,
    status: findings.length ? 'evidence_available' : normalized.records.length ? 'liking_not_yet_known' : 'no_evidence',
    unconfirmedObservationRefs: refs(normalized.records.filter(record => !confirmed(record))),
    followUp: normalized.unresolvedRecords.length ? {
      optional: true, unresolvedRefs: [normalized.unresolvedRecords[0].unresolvedId],
      question: `“${normalized.unresolvedRecords[0].phrase}”에서 어떤 느낌이 특히 좋거나 아쉬웠나요?`,
    } : null,
  };
}
