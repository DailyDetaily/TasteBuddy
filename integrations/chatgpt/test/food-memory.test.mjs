import test from 'node:test';
import assert from 'node:assert/strict';
import { exportSchema } from '../app.mjs';

const id = '11111111-1111-4111-8111-111111111111';
const payload = {
  schemaVersion: 2, engineVersion: 'synthetic', generatedAt: '2026-09-13T00:00:00Z',
  sourceFingerprint: 'a'.repeat(64), totalExperienceCount: 2, totalLocalExperienceCount: 3,
  includedExperienceCount: 1, excludedCapturedCount: 1, excludedWithoutInterpretedSourceCount: 1, excludedByLimitCount: 0,
  experiences: [{ experienceID: id, mealID: id, sourceRevision: 1, storedDate: '2026-07-01T00:00:00Z', latestCorrectionAt: '2026-08-10T00:00:00Z' }],
  observations: [{ id: 'synthetic-observation', experienceID: id, mealID: id, sourceRevision: 1,
    foodName: '합성 세비체', recordedAt: '2026-07-01T00:00:00Z', kind: 'attribute_liking', attribute: 'taste.sour',
    value: 'positive', scale: 'expression', target: 'whole_dish', phase: 'unspecified', sourceField: 'note',
    phrase: '산미는 좋았다.', sourceSpans: [], combinationComponents: [], knownAt: '2026-08-10T00:00:00Z' }],
  unresolved: [], limits: ['현재 원문 기준. 이전 전체 상태 복원 아님.'],
};
test('v2 preserves revision and uncertain meal time without inventing observedAt', () => {
  const parsed = exportSchema.parse(payload);
  assert.equal(parsed.observations[0].observedAt, undefined);
  assert.equal(parsed.experiences[0].sourceRevision, 1);
});
test('v2 rejects source mismatch, duplicate experience, incomplete scope, and undeclared private data', () => {
  for (const mutate of [
    p => { p.observations[0].sourceRevision = 2; },
    p => { p.observations[0].mealID = '22222222-2222-4222-8222-222222222222'; },
    p => { p.experiences.push(p.experiences[0]); },
    p => { p.totalLocalExperienceCount = 100; },
    p => { p.photo = 'private'; },
  ]) {
    const copy = structuredClone(payload); mutate(copy);
    assert.equal(exportSchema.safeParse(copy).success, false);
  }
});
