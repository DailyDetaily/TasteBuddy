import { createPreferenceIntakeSubmission, buildPreferenceIntakeEvidence } from '../../src/lib/preferenceIntakeEvidence.mjs';

export const PREFERENCE_REFERENCE = {
  allergies: ['allergies-none'], dietaryRestrictions: ['dietary-restrictions-none'], preferredCuisineTypes: ['korean-course', 'italian'],
  avoidedSignals: ['high-acidity'], flavorIntensityPreference: 'light', explorationStyle: 'adventurous', sharePreferenceWithRestaurant: 'preview-first',
};
const create = (id, responses = PREFERENCE_REFERENCE, recordedAt = '2026-09-01T00:00:00.000Z') => createPreferenceIntakeSubmission(responses, { id, userID: 'fixture-user', recordedAt });
const first = create('first');
const later = create('later', { ...PREFERENCE_REFERENCE, allergies: ['shellfish'], flavorIntensityPreference: 'rich' }, '2026-09-02T00:00:00.000Z');
const change = (submission, transform) => { const value = structuredClone(submission); transform(value); return value; };
const cases = [
  { id: 'empty', submissions: [] },
  { id: 'complete', submissions: [first] },
  { id: 'duplicate-is-one-source', submissions: [first, first] },
  { id: 'latest-replaces-earlier', submissions: [later, first] },
  { id: 'missing-is-not-none', submissions: [create('partial', {})] },
  { id: 'later-unanswered-does-not-reuse-earlier', submissions: [first, create('withdrawn', {}, '2026-09-03T00:00:00.000Z')] },
  { id: 'different-user', submissions: [{ ...first, userID: 'someone-else' }] },
  { id: 'future-record', submissions: [first, later], asOf: '2026-09-01T12:00:00.000Z' },
  { id: 'future-known', submissions: [{ ...first, knownAt: '2026-09-05T00:00:00.000Z' }], asOf: '2026-09-03T00:00:00.000Z' },
  { id: 'unknown-time', submissions: [{ ...first, recordedAt: '' }] },
  { id: 'invalid-option', submissions: [change(first, value => { value.responses[0].selectedOptions[0].id = 'unknown'; })] },
  { id: 'altered-source-label', submissions: [change(first, value => { value.responses[0].selectedOptions[0].label = '진단된 알레르기 없음'; })] },
  { id: 'duplicate-question', submissions: [change(first, value => { value.responses[1] = value.responses[0]; })] },
  { id: 'conflicting-identity', submissions: [first, { ...later, id: first.id }] },
  { id: 'unsupported-instrument', submissions: [{ ...first, instrumentVersion: 'future-version' }] },
];
export const PREFERENCE_EVIDENCE_CASES = cases.map(value => {
  const result = buildPreferenceIntakeEvidence(value.submissions, { userID: 'fixture-user', asOf: value.asOf ?? null });
  return { ...value, expected: { submissionID: result.submissionID, answeredQuestionCount: result.answeredQuestionCount,
    records: result.records.map(row => ({ questionID: row.questionID, kind: row.kind, state: row.state, summary: row.summary, selectedIDs: row.selectedOptions.map(option => option.id) })),
    excludedSubmissions: result.excludedSubmissions } };
});
