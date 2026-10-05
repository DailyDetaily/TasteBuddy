// Independently specified development criteria, not generated from parser outputs.
// Only these explicit scopes are assessed; the remaining frozen review cases need
// separate relation rubrics and human review before a semantic-success claim.
export const RELATION_RUBRIC_VERSION = 'sensory-review-relations/1';
const criterion = (text, attribute, target, phase, fragment, liking) => {
  const scope = { attribute, target, phase, reference: null };
  const detail = { ...scope, kind: 'sensory_detail', scale: 'sensory-detail-v1', fragment };
  const presence = { ...scope, kind: 'sensory_presence', scale: 'presence-v1', value: true };
  const rating = { ...scope, kind: 'attribute_liking', scale: 'attribute-three-category-v1', value: liking };
  return { text, scope, allowed: [detail, presence, ...(liking ? [rating] : [])], required: [[detail, presence], ...(liking ? [[rating]] : [])] };
};
export const REVIEW_RELATION_RUBRICS = Object.freeze({
  'SR-001': criterion('토마토 수프에서 새콤한 맛이 둥글게 퍼졌다.', 'taste.sour', 'whole_dish', 'unspecified', '새콤한 맛'),
  'SR-003': criterion('자몽 속껍질 같은 쓴맛이 꽤 좋았습니다.', 'taste.bitter', 'whole_dish', 'unspecified', '자몽 속껍질 같은 쓴맛', 'positive'),
  'SR-015': criterion('생선 살이 결마다 촉촉하게 벌어졌다.', 'texture.moist', 'flesh', 'unspecified', '촉촉하게'),
  'SR-030': criterion('장어 소스의 단맛은 삼킨 뒤에도 입가에 매달렸다.', 'taste.sweet', 'sauce', 'after_swallow', '단맛'),
});

function matches(atom, expected, text) {
  if (!['kind', 'attribute', 'scale', 'target', 'phase', 'reference'].every(key => (atom[key] ?? null) === (expected[key] ?? null))) return false;
  return expected.fragment !== undefined
    ? typeof atom.value === 'string' && text.includes(atom.value) && atom.value.includes(expected.fragment)
    : atom.value === expected.value;
}

export function scoreReviewRelations(fixture, atoms) {
  const rubric = REVIEW_RELATION_RUBRICS[fixture.id];
  if (!rubric || rubric.text !== fixture.text) return { version: RELATION_RUBRIC_VERSION, assessed: false, passed: false, failures: [] };
  const failures = [];
  rubric.required.forEach((alternatives, index) => {
    if (!atoms.some(atom => alternatives.some(expected => matches(atom, expected, fixture.text)))) failures.push(`required_relation_missing:${index}`);
  });
  atoms.forEach((atom, index) => {
    if (!rubric.allowed.some(expected => matches(atom, expected, fixture.text))) failures.push(`unsupported_relation:${index}`);
  });
  return { version: RELATION_RUBRIC_VERSION, assessed: true, passed: failures.length === 0, failures };
}
