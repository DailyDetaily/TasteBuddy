// 세 플랫폼 계약: 강도 범주의 순서만 사용한다. 호감·알맞음·회상 응답은 식사 관찰이 아니다.
export const PERCEPTION_VERSION = 'taste-perception/1';
export const PERCEPTION_AXES = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'];
export const INTENSITY_LEVELS = ['weak', 'medium', 'strong'];
export const INTENSITY_LABELS = ['약하게', '중간 정도로', '강하게'];
export const MIN_PERCEPTION_MEALS = 3;
const unique = values => [...new Set(values)].sort();
const key = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : 1)) : item);
export const PERCEPTION_TARGET_LABELS = { whole_dish: '음식 전체', sauce: '소스', surface: '겉', inside: '속', broth: '국물', noodles: '면', meat: '고기', coating: '튀김옷', skin: '껍질', filling: '소', flesh: '속살', cream: '크림' };
export const PERCEPTION_PHASE_LABELS = { first_bite: '첫입', early_meal: '식사 초반', during_meal: '먹는 동안', late_meal: '식사 후반', after_swallow: '삼킨 뒤', after_meal: '식사 후' };
const groups = (rows, identity) => {
  const result = new Map();
  for (const row of rows) {
    const id = identity(row);
    if (!result.has(id)) result.set(id, []);
    result.get(id).push(row);
  }
  return [...result].sort(([a], [b]) => a.localeCompare(b, 'en'));
};
const known = value => typeof value === 'string' && value.trim() && value !== 'unspecified';
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const refs = rows => ({
  evidenceIDs: unique(rows.flatMap(row => row.evidenceIDs)),
  experienceIDs: unique(rows.flatMap(row => row.experienceIDs)),
  mealIDs: unique(rows.map(row => row.mealID)),
});
const median = units => units.length >= MIN_PERCEPTION_MEALS && units.every(unit => unit.level !== null)
  ? units.map(unit => unit.level).sort((a, b) => a - b)[Math.floor(units.length / 2)] : null;

/** 완료된 식사의 출처 검증을 마친 관찰만 전달한다. 같은 식사·감각·음식·조건은 한 표다. */
export function buildTastePerception(records, { asOf = null, userID = null } = {}) {
  const cutoff = asOf === null ? Infinity : date(asOf);
  const owners = unique(records.map(row => row.userId).filter(Boolean));
  const owner = userID ?? (owners.length === 1 ? owners[0] : null);
  const foodIdentity = row => key([row.restaurantID ?? row.restaurantName?.trim() ?? '', row.menuItemID ?? '', row.foodName?.trim() ?? '', unique(row.dishKindIDs ?? [])]);
  const contextIdentity = row => key([row.attribute, foodIdentity(row), row.target ?? 'unspecified', row.phase ?? 'unspecified']);
  const recordIdentity = row => key([row.userId, row.experienceId, row.mealId, contextIdentity(row), row.kind, row.scale, row.value, row.observedAt, row.knownAt]);
  const conflicts = new Set(groups(records, row => row.observationId).filter(([, rows]) => unique(rows.map(recordIdentity)).length > 1).map(([id]) => id));
  const valid = records.filter(row => row.feedbackCompleted === true
    && owner !== null && row.userId === owner && !conflicts.has(row.observationId)
    && ['explicit_user_choice', 'rule_extracted_statement'].includes(row.confirmationStatus)
    && row.observationId && row.experienceId && row.mealId
    && row.kind === 'sensory_intensity' && row.scale === 'expression-strength-v1'
    && PERCEPTION_AXES.includes(row.attribute?.replace(/^taste\./, '')) && row.attribute?.startsWith('taste.')
    && INTENSITY_LEVELS.includes(row.value) && !row.reference
    && date(row.observedAt) !== null && date(row.knownAt) !== null && cutoff !== null
    && date(row.observedAt) <= cutoff && date(row.knownAt) <= cutoff);
  const absent = new Set(records.filter(row => row.userId === owner && row.feedbackCompleted === true
    && row.kind === 'sensory_presence' && row.value === false
    && ['explicit_user_choice', 'rule_extracted_statement'].includes(row.confirmationStatus)
    && date(row.observedAt) !== null && date(row.knownAt) !== null
    && date(row.observedAt) <= cutoff && date(row.knownAt) <= cutoff)
    .map(row => key([row.mealId, contextIdentity(row)])));
  const units = groups(valid, row => key([row.mealId, contextIdentity(row)])).map(([id, rows]) => {
    const first = rows[0], levels = unique(rows.map(row => row.value));
    return { id, axis: first.attribute.slice(6), foodKey: foodIdentity(first), foodName: first.foodName?.trim() ?? '', restaurantName: first.restaurantName?.trim() ?? '',
      hasFoodContext: Boolean(known(first.restaurantID) || known(first.restaurantName) || known(first.menuItemID)),
      target: first.target ?? 'unspecified', phase: first.phase ?? 'unspecified', mealID: first.mealId,
      date: Math.max(...rows.map(row => date(row.observedAt))),
      level: levels.length === 1 && !absent.has(id) ? INTENSITY_LEVELS.indexOf(levels[0]) : null,
      evidenceIDs: unique(rows.map(row => row.observationId)), experienceIDs: unique(rows.map(row => row.experienceId)) };
  });
  const patterns = groups(units, row => key([row.axis, row.foodKey, row.target, row.phase])).map(([id, rows]) => {
    rows.sort((a, b) => a.date - b.date || a.mealID.localeCompare(b.mealID, 'en'));
    const first = rows[0], recent = rows.slice(-MIN_PERCEPTION_MEALS);
    const previous = rows.slice(-MIN_PERCEPTION_MEALS * 2, -MIN_PERCEPTION_MEALS);
    const comparable = Boolean(first.hasFoodContext && known(first.foodName) && PERCEPTION_TARGET_LABELS[first.target] && PERCEPTION_PHASE_LABELS[first.phase]);
    const currentLevel = comparable ? median(recent) : null;
    const previousLevel = comparable && previous.length === MIN_PERCEPTION_MEALS
      && previous.at(-1).date < recent[0].date ? median(previous) : null;
    return { id, axis: first.axis, foodKey: first.foodKey, foodName: first.foodName, restaurantName: first.restaurantName, target: first.target, phase: first.phase,
      currentLevel, previousLevel, status: currentLevel === null ? 'checking' : 'repeated_scoped_intensity',
      counts: INTENSITY_LEVELS.map((_, level) => recent.filter(unit => unit.level === level).length),
      conflictCount: recent.filter(unit => unit.level === null).length,
      recent: { ...refs(recent), start: recent[0].date, end: recent.at(-1).date },
      previous: { ...refs(previous), start: previous[0]?.date ?? null, end: previous.at(-1)?.date ?? null },
      ...refs(rows) };
  });
  const changes = patterns.filter(pattern => pattern.currentLevel !== null && pattern.previousLevel !== null
    && pattern.currentLevel !== pattern.previousLevel);
  const contrasts = [];
  // ponytail: 조건 쌍의 제곱 비교. 조건 수가 커지면 음식별 인덱스로 나눈다.
  for (let i = 0; i < patterns.length; i++) for (let j = i + 1; j < patterns.length; j++) {
    const a = patterns[i], b = patterns[j];
    if (a.axis !== b.axis || a.foodKey !== b.foodKey || a.currentLevel === null || b.currentLevel === null
      || a.currentLevel === b.currentLevel || Number(a.target !== b.target) + Number(a.phase !== b.phase) !== 1
      || Math.max(a.recent.start, b.recent.start) > Math.min(a.recent.end, b.recent.end)) continue;
    contrasts.push({ id: key([a.id, b.id]), axis: a.axis, first: a, second: b,
      evidenceIDs: unique([...a.recent.evidenceIDs, ...b.recent.evidenceIDs]),
      experienceIDs: unique([...a.recent.experienceIDs, ...b.recent.experienceIDs]),
      mealIDs: unique([...a.recent.mealIDs, ...b.recent.mealIDs]) });
  }
  const axes = PERCEPTION_AXES.map(axis => ({ axis, current: patterns.filter(pattern => pattern.axis === axis)
    .sort((a, b) => b.recent.end - a.recent.end || a.id.localeCompare(b.id, 'en'))[0] ?? null }));
  return { version: PERCEPTION_VERSION, axes, patterns, changes, contrasts,
    evidenceCount: unique(units.map(unit => unit.mealID)).length };
}

/** 같은 문항·음식·조건·척도로 남긴 회상 응답만 비교한다. 식사 강도와 합산하지 않는다. */
export function buildSurveyPerception(submissions) {
  const history = [...new Map(submissions.filter(submission => submission?.schemaVersion === 2
    && submission.source === 'reference-food-recall' && date(submission.recordedAt) !== null)
    .map(submission => [date(submission.recordedAt), submission])).values()]
    .sort((a, b) => date(b.recordedAt) - date(a.recordedAt));
  const current = history[0] ?? null;
  const answered = (submission, item) => {
    const response = submission.responses.filter(row => row.itemId === item.id).at(-1);
    return response && !response.uncertain && !response.uncertaintyReason && Number.isInteger(response.selectedValue)
      && response.selectedValue >= 0 && response.selectedValue <= 4 ? response.selectedValue : null;
  };
  const signature = (submission, item) => key([submission.instrument,
    submission.scale, item, submission.recallWindow]);
  const points = PERCEPTION_AXES.map(axis => {
    const item = current?.items.find(item => item.tasteId === axis);
    if (!current || !item) return { axis, value: null, item: null, submission: current, previous: null };
    const previousSubmission = history.slice(1).find(submission => submission.items.some(previous => previous.id === item.id
      && signature(submission, previous) === signature(current, item)));
    const previousItem = previousSubmission?.items.find(previous => previous.id === item.id);
    return { axis, value: answered(current, item), item, submission: current,
      previous: previousItem ? { value: answered(previousSubmission, previousItem), submission: previousSubmission } : null };
  });
  return { current, points, changes: points.filter(point => point.value !== null && point.previous?.value != null
    && point.value !== point.previous.value) };
}

/** 기존 미각변화 화면의 선과 요약에 같은 조건의 유효한 두 기간만 전달한다. */
export function buildTasteChangeSeries(model, survey) {
  const meals = model.patterns.map(pattern => ({
    id: pattern.id, axis: pattern.axis, source: '식사 기록', maximum: 2,
    condition: [pattern.restaurantName, pattern.foodName, PERCEPTION_TARGET_LABELS[pattern.target], PERCEPTION_PHASE_LABELS[pattern.phase]].filter(Boolean).join(' · '),
    points: [['이전', pattern.previousLevel, pattern.previous], ['최근', pattern.currentLevel, pattern.recent]]
      .filter(([, value, period]) => value != null && period.start != null && period.end != null)
      .map(([id, value, period]) => ({ id, value, date: period.end, start: period.start, label: INTENSITY_LABELS[value],
        evidenceIDs: period.evidenceIDs, experienceIDs: period.experienceIDs, count: period.mealIDs.length })),
    details: ['같은 음식·부위·시점의 이전 3번과 최근 3번 식사를 비교해요.', '기록하지 않은 조리 상태·온도나 변화의 원인은 알 수 없어요.'],
  }));
  const recalled = survey.points.filter(point => point.item).map(point => ({
    id: `survey:${point.axis}`, axis: point.axis, source: '기준 음식 회상', maximum: 4, condition: point.item.anchor.label,
    points: [['이전', point.previous?.value, point.previous?.submission], ['최근', point.value, point.submission]]
      .filter(([, value, submission]) => value != null && date(submission?.recordedAt) != null)
      .map(([id, value, submission]) => ({ id, value, date: date(submission.recordedAt), start: date(submission.recordedAt),
        label: submission.scale.labels[value], evidenceIDs: [], experienceIDs: [], count: 1 })),
    details: [point.item.prompt, ...point.item.anchor.conditions, '회상 응답은 실제 식사 횟수에 포함하지 않아요.'],
  }));
  return [...meals, ...recalled].filter(series => series.points.length > 0);
}

export function tasteChangeLabel(points) {
  const previous = points.find(point => point.id === '이전'), recent = points.find(point => point.id === '최근');
  if (!previous || !recent) return '비교 부족';
  return previous.value === recent.value ? '같은 강도' : recent.value > previous.value ? '더 강하게' : '더 약하게';
}
