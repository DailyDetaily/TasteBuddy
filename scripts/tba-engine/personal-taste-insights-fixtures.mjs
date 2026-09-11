export const insightRecord = (id, value = 'positive', extra = {}) => ({
  observationId: id, userId: 'fixture-user', experienceId: `e-${id}`, mealId: `m-${id}`,
  kind: 'attribute_liking', attribute: 'taste.sour', attributeLabel: null, reference: null,
  value, scale: 'attribute-three-category-v1', target: 'whole_dish', phase: 'during_meal',
  observedAt: '2026-09-01T12:00:00.000Z', knownAt: '2026-09-01T12:01:00.000Z',
  dishKindIDs: [], phrase: '사용자 평가', sourceSpans: [], confirmationStatus: 'explicit_user_choice',
  selectionEvidence: null, conditionSources: [], ...extra,
});
export const withIntensity = (row, intensity) => [row, { ...row, observationId: row.observationId + '-intensity',
  kind: 'sensory_intensity', scale: 'expression-strength-v1', value: intensity }];
export const withOverall = (row, overall) => [row, { ...row, observationId: row.observationId + '-overall',
  kind: 'overall_liking', attribute: null, scale: 'overall-five-category-v1', value: overall }];
export const fitRecords = ['medium', 'strong'].flatMap(intensity => [1, 2, 3].flatMap(i =>
  withIntensity(insightRecord(`fit-${intensity}-${i}`, intensity === 'medium' ? 'just_right' : 'above_preferred',
    { kind: 'preference_fit', scale: 'preference-fit-v1', target: 'broth', dishKindIDs: ['soup'] }), intensity)));
export const impactRecords = [
  ...[1, 2, 3].flatMap(i => withIntensity(insightRecord(`weak-${i}`), 'weak')),
  ...[1, 2, 3].flatMap(i => withIntensity(insightRecord(`strong-${i}`, 'negative'), 'strong')),
  insightRecord('question-source', 'negative'),
  insightRecord('unrelated', true, { attribute: 'aroma.roasted', kind: 'sensory_presence', scale: 'presence-v1' }),
];
export const ENGINE_V2_FIXTURES = [
  { id: 'v2-fit-conditional', records: fitRecords },
  { id: 'v2-fit-same-meal-mixed', records: [
    insightRecord('fit-a', 'just_right', { kind: 'preference_fit', scale: 'preference-fit-v1', mealId: 'one' }),
    insightRecord('fit-b', 'above_preferred', { kind: 'preference_fit', scale: 'preference-fit-v1', mealId: 'one' }),
  ] },
  { id: 'v2-overall-all-categories', records: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative']
    .flatMap(overall => ['positive', 'neutral', 'negative'].flatMap(liking => withOverall(insightRecord(`${overall}-${liking}`, liking), overall))) },
  { id: 'v2-overall-different-dishes', records: [
    ...withOverall(insightRecord('dish-a', 'negative', { mealId: 'one' }), 'very_positive'),
    ...withOverall(insightRecord('dish-b', 'positive', { mealId: 'one' }), 'very_negative'),
  ] },
  { id: 'v2-question-impact', records: impactRecords },
];
