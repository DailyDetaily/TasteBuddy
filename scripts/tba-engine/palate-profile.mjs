import { confirmed, coverage, refs, scope, scopeKey, unique, clone, qualifiedLiking } from './evidence.mjs';

export const PALATE_PROFILE_VERSION = 'tba-palate-profile/1';
export const PALATE_STYLES = Object.freeze([
  { id: 'purist', name: '퓨어리스트', label: '본연형', attributes: ['flavor.ingredient_character'] },
  { id: 'maximalist', name: '맥시멀리스트', label: '강렬형', attributes: [] },
  { id: 'alchemist', name: '알키미스트', label: '발효형', attributes: ['aroma.fermented', 'flavor.fermented'] },
  { id: 'roaster', name: '로스터', label: '고소형', attributes: ['aroma.roasted', 'aroma.smoky', 'aroma.nutty', 'flavor.nutty_savory', 'flavor.cereal_savory'] },
  { id: 'romantic', name: '로맨틱', label: '달콤형', attributes: ['taste.sweet'] },
  { id: 'texturalist', name: '텍스처리스트', label: '식감형', attributes: [] },
  { id: 'epicure', name: '에피큐어', label: '농밀형', attributes: ['taste.umami', 'mouthfeel.fatty', 'flavor.rich'] },
  { id: 'refresher', name: '리프레셔', label: '산뜻형', attributes: ['taste.sour', 'trigeminal.fizzy', 'flavor.fresh'] },
  { id: 'harmonist', name: '하모니스트', label: '조화형', attributes: ['flavor.balance'] },
].map(item => Object.freeze({ ...item, attributes: Object.freeze(item.attributes) })));

// 통계적으로 학습한 임계값이 아닌, 첫 단서와 반복 기록을 구분하는 버전 있는 표시 정책이다.
export const DEFAULT_PROFILE_POLICY = Object.freeze({ minDistinctMeals: 2 });
function policyFor(input) {
  const policy = { ...DEFAULT_PROFILE_POLICY, ...input };
  if (!Number.isInteger(policy.minDistinctMeals) || policy.minDistinctMeals < 2) throw new Error('INVALID_PROFILE_POLICY');
  return policy;
}
function matches(style, record, records) {
  if (style.id === 'harmonist' && record.kind === 'combination_liking') return true;
  if (record.kind !== 'attribute_liking') return false;
  if (style.id === 'texturalist') return record.attribute.startsWith('texture.');
  if (style.id === 'maximalist') {
    if (!/^(taste\.|aroma\.|trigeminal\.)/.test(record.attribute)) return false;
    const levels = unique(records.filter(other => confirmed(other) && other.kind === 'sensory_intensity'
      && scopeKey(other) === scopeKey(record)).map(other => other.value));
    return levels.length === 1 && levels[0] === 'strong';
  }
  return style.attributes.includes(record.attribute);
}
const strength = candidate => [candidate.supportCoverage.meals - candidate.counterCoverage.meals, candidate.supportCoverage.meals];
function compareStrength(a, b) {
  const left = strength(a), right = strength(b);
  return right[0] - left[0] || right[1] - left[1];
}

export function buildPalateProfile(normalized, { policy: inputPolicy = {} } = {}) {
  const policy = policyFor(inputPolicy);
  const records = normalized.records;
  const usable = records.filter(record => confirmed(record) && !qualifiedLiking(record, records));
  const candidates = PALATE_STYLES.map(style => {
    const relevant = usable.filter(record => matches(style, record, usable));
    const support = relevant.filter(record => record.value === 'positive');
    const counter = relevant.filter(record => record.value === 'negative');
    const neutral = relevant.filter(record => record.value === 'neutral');
    const model = records.filter(record => !confirmed(record) && matches(style, record, records));
    const context = style.id === 'maximalist' ? usable.filter(record => record.kind === 'sensory_intensity'
      && record.value === 'strong' && relevant.some(liking => scopeKey(liking) === scopeKey(record))) : [];
    const supportCoverage = coverage(support), counterCoverage = coverage(counter);
    const status = support.length && counter.length ? 'mixed'
      : supportCoverage.meals >= policy.minDistinctMeals ? 'repeated_support'
      : support.length ? 'first_signal' : counter.length ? 'scoped_dislike'
      : model.length ? 'unconfirmed_only' : 'unknown';
    return {
      id: style.id, name: style.name, label: style.label, status,
      eligible: supportCoverage.meals >= policy.minDistinctMeals && supportCoverage.meals > counterCoverage.meals,
      supportRefs: refs(support), counterRefs: refs(counter), neutralRefs: refs(neutral),
      contextRefs: refs(context), modelCandidateRefs: refs(model),
      supportCoverage, counterCoverage, scope: scope([...support, ...counter, ...context]),
      supportingAttributes: unique(support.map(record => record.attribute).filter(Boolean)),
      probability: null,
    };
  });
  const eligible = candidates.filter(candidate => candidate.eligible).sort(compareStrength);
  const leaders = eligible.filter(candidate => compareStrength(candidate, eligible[0]) === 0);
  const main = leaders.length === 1 ? leaders[0] : null;
  // 동일 관찰로 두 번째 이름을 만들지 않는다. 같은 식사의 서로 다른 직접 평가는 사용할 수 있다.
  const wingOptions = main ? eligible.filter(candidate => candidate.id !== main.id
    && coverage(records.filter(record => candidate.supportRefs.includes(record.observationId)
      && !main.supportRefs.includes(record.observationId))).meals >= policy.minDistinctMeals) : [];
  const wingLeaders = wingOptions.filter(candidate => compareStrength(candidate, wingOptions[0]) === 0);
  const wing = wingLeaders.length === 1 ? wingLeaders[0] : null;
  return {
    version: PALATE_PROFILE_VERSION, userId: normalized.userId, evidenceSetHash: normalized.evidenceSetHash,
    evidenceClass: normalized.evidenceClass,
    status: main ? 'provisional_profile' : leaders.length ? 'ambiguous_main' : 'learning',
    main: main ? clone(main) : null, wing: wing ? clone(wing) : null,
    mainCandidates: main ? [] : leaders.map(candidate => candidate.id),
    wingCandidates: wing ? [] : wingLeaders.map(candidate => candidate.id),
    candidates,
    policy: { ...policy, basis: 'versioned_product_policy_not_empirically_validated', adjacentOnly: false, forceWing: false },
    coverage: clone(normalized.coverage),
    label: main ? `${main.name}${wing ? ` · ${wing.name} 윙` : ''}` : leaders.length ? '여러 취향이 함께 보여요' : '입맛을 알아가는 중이에요',
  };
}
