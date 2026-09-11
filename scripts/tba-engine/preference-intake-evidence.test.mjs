import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPreferenceIntakeSubmission, buildPreferenceIntakeEvidence, preferenceIntakeResponsesFromEvidence } from '../../src/lib/preferenceIntakeEvidence.mjs';
import { analyzeEvidence } from './index.mjs';
import { PREFERENCE_REFERENCE, PREFERENCE_EVIDENCE_CASES } from './preference-intake-fixtures.mjs';
import catalog from '../../src/constants/preferenceIntakeCatalog.json' with { type: 'json' };

test('source wording, none, missing, and revisions survive JSON without invented meals', () => {
  const first = createPreferenceIntakeSubmission(PREFERENCE_REFERENCE, { id: 'first', userID: 'owner', recordedAt: '2026-09-01T00:00:00.000Z' });
  const restored = JSON.parse(JSON.stringify(first));
  assert.deepEqual(restored, first);
  assert.deepEqual(restored.responses[0].selectedOptions, [catalog.questions[0].options[0]]);
  const evidence = buildPreferenceIntakeEvidence([restored, restored], { userID: 'owner' });
  assert.equal(evidence.answeredQuestionCount, 7);
  assert.equal(evidence.records[0].state, 'declared_none');
  assert.equal(evidence.records[4].kind, 'preferred_flavor_intensity');
  assert.equal(evidence.records[6].kind, 'sharing_preference');
  assert.equal(evidence.sharingConsent, undefined);
  const later = createPreferenceIntakeSubmission({}, { id: 'later', userID: 'owner', recordedAt: '2026-09-02T00:00:00.000Z' });
  assert.equal(buildPreferenceIntakeEvidence([restored, later], { userID: 'owner' }).answeredQuestionCount, 0);
  assert.equal(buildPreferenceIntakeEvidence([restored, later], { userID: 'owner', asOf: '2026-09-01T12:00:00.000Z' }).answeredQuestionCount, 7);
  assert.deepEqual(preferenceIntakeResponsesFromEvidence([restored], 'owner'), PREFERENCE_REFERENCE);
  assert.equal(preferenceIntakeResponsesFromEvidence([restored], 'other'), null);
  const baseline = analyzeEvidence([], { userId: 'owner' });
  const integrated = analyzeEvidence([], { userId: 'owner', preferenceSubmissions: [restored] });
  for (const field of ['coverage', 'personalModel', 'perception', 'profile', 'insights']) assert.deepEqual(integrated[field], baseline[field], field);
  assert.equal(integrated.statedPreferences.answeredQuestionCount, 7);
});

test('invalid selections and contradictory none choices cannot enter storage', () => {
  for (const response of [{ allergies: ['allergies-none', 'shellfish'] }, { allergies: ['unknown'] },
    { allergies: ['shellfish', 'shellfish'] }, { flavorIntensityPreference: ['light', 'rich'] },
    { preferredCuisineTypes: catalog.questions[2].options.slice(0, 6).map(option => option.id) }]) {
    assert.throws(() => createPreferenceIntakeSubmission(response));
  }
});

test('frozen native fixtures match the current contract and source catalog', () => {
  for (const url of ['../../ios/TasteBuddy/Resources/Fixtures/preference-intake.json', '../../android/app/src/main/assets/fixtures/preference-intake.json']) {
    const fixture = JSON.parse(readFileSync(new URL(url, import.meta.url), 'utf8'));
    assert.deepEqual(fixture.questions, catalog.questions);
    assert.deepEqual(fixture.evidenceCases, PREFERENCE_EVIDENCE_CASES);
  }
});
