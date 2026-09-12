import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTasteAnalysisEngine } from './index.mjs';
import { LEXICON_VERSION } from '../tba-platform-pilot/rules.mjs';

let engine;
let count = 0;
const recordedAt = '2026-09-06T07:00:00.000Z';
before(async () => {
  engine = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture' });
  await engine.importFoods({ sources: [], foods: [{ id: 'sensory-dish', name: '검증용 음식', claims: [] }] });
});
after(async () => engine?.close());
async function read(text) {
  const owner = `sensory-review-${++count}`;
  await engine.createUser(owner);
  await engine.createExperience({ owner, id: owner, mealId: owner, foodId: 'sensory-dish' });
  await engine.mutate(owner, {
    experienceId: owner, mutationId: owner, baseRevision: 0, operation: 'set', recordedAt,
    answer: { question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, value: text, target: 'whole_dish', phase: 'unspecified' },
  });
  return { owner, report: await engine.analyze(owner) };
}

test('구체 묘사는 부위·원문을 유지하고 감각 존재와 호감을 구분한다', async () => {
  const { report } = await read('겉은 가볍게 부서지고 속은 촉촉했다.');
  const understanding = report.sensoryUnderstanding;
  assert.deepEqual(new Set(understanding.retainedDescriptions.map(item => item.target)), new Set(['surface', 'inside']));
  assert.equal(understanding.preferences.length, 0);
  assert.ok(understanding.retainedDescriptions.every(item => item.quote && item.meaningStatus === 'source_description'));
  assert.ok(understanding.frames.every(item => item.liking.length === 0 && item.causalExplanation === null));
  assert.equal(understanding.processing.verifiedSemanticAccuracy, null);
});

test('감각 강도와 직접 평가는 같은 범위 안에서만 연결하고 상충한 강도는 보류한다', async () => {
  const { report } = await read('단맛이 강했어요. 단맛이 좋았어요. 소스는 단맛이 약했어요.');
  const taste = report.sensoryUnderstanding.preferences.find(item => item.attribute === 'taste.sweet');
  assert.equal(taste.intensityAssociations.length, 1);
  assert.deepEqual(taste.intensityAssociations[0].scope.targets, ['whole_dish']);
  assert.deepEqual(taste.intensityAssociations[0].reportedIntensity, ['strong']);
  assert.equal(taste.optimalIntensity, null);
  const mixed = await read('단맛이 강했어요. 단맛이 약했어요. 단맛이 좋았어요.');
  assert.equal(mixed.report.sensoryUnderstanding.frames[0].intensityStatus, 'conflicting_reports');
  assert.equal(mixed.report.sensoryUnderstanding.preferences[0].intensityAssociations.length, 0);
});

test('감각 부재 조건과 미분류 묘사는 일반 선호로 합치지 않고 수정·삭제에 함께 갱신한다', async () => {
  const { owner, report } = await read('단맛이 없어서 좋았어요. 향이 종이처럼 납작해서 좋았습니다.');
  const understanding = report.sensoryUnderstanding;
  assert.equal(understanding.preferences.length, 0);
  assert.ok(understanding.frames.some(item => item.qualifiedLiking.length > 0));
  assert.ok(understanding.retainedDescriptions.some(item => item.meaningStatus === 'unresolved'));
  assert.ok(understanding.clarificationCandidates.every(item => item.optional && item.createsEvidence === false));
  assert.equal(understanding.processing.status, 'partial_meaning_retained');
  const old = new Set(understanding.frames.flatMap(item => item.observationRefs));
  await engine.mutate(owner, {
    experienceId: owner, mutationId: `${owner}-edit`, baseRevision: 1, operation: 'set', recordedAt,
    answer: { question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, value: '바삭함이 좋았어요.', target: 'whole_dish', phase: 'unspecified' },
  });
  const edited = (await engine.analyze(owner)).sensoryUnderstanding;
  assert.ok(edited.frames.every(item => item.observationRefs.every(id => !old.has(id))));
  assert.equal(edited.retainedDescriptions.length, 0);
  await engine.mutate(owner, { experienceId: owner, mutationId: `${owner}-delete`, baseRevision: 2, operation: 'delete', recordedAt });
  const cleared = (await engine.analyze(owner)).sensoryUnderstanding;
  assert.deepEqual(cleared.frames, []);
  assert.deepEqual(cleared.preferences, []);
  assert.deepEqual(cleared.clarificationCandidates, []);
});
