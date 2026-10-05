import test from 'node:test';
import assert from 'node:assert/strict';
import { parseByRules, LEXICON_VERSION } from '../tba-platform-pilot/rules.mjs';
import { buildPersonalTasteModel } from './personal-taste-model.mjs';
import { modelRecord } from '../build-personal-taste-model-contract.mjs';
import { createTasteAnalysisEngine } from './index.mjs';

const parse = value => parseByRules({ question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, value });
test('소실·변화·음식 적용 조건의 평가는 원문을 보존하며 감각 불호로 만들지 않는다', () => {
  for (const text of [
    '처음엔 좋았는데 소스를 묻히니 바삭함이 죽어서 아쉬웠다.',
    '바삭함이 사라져서 아쉬웠어요.', '바삭함이 줄었고 아쉬웠어요.',
    '바삭함이 덜해져서 아쉬웠어요.', '소스를 찍으니 바삭함이 좋았어요.',
    '소스를 찍어 먹으니 바삭함이 좋았어요.', '소스를 묻힌 뒤 바삭함이 좋았어요.',
  ]) {
    const result = parse(text);
    assert.equal(result.observations.length, 0, text);
    assert.equal(result.needsAI, true, text);
    assert.ok(result.unresolved.some(u => u.reason === 'unresolved_sensory_change_or_condition' && u.phrase === text), text);
  }
  const contrast = parse('바삭함이 줄어서 아쉬웠어요. 소스의 단맛은 좋았어요.');
  assert.ok(contrast.observations.some(a => a.attribute === 'taste.sweet' && a.kind === 'attribute_liking' && a.value === 'positive' && a.target === 'sauce'));
  assert.equal(contrast.observations.some(a => a.attribute === 'texture.crisp'), false);
  assert.ok(parse('소스의 바삭함이 싫었어요.').observations.some(a => a.attribute === 'texture.crisp' && a.kind === 'attribute_liking' && a.value === 'negative'));
});

test('중립을 포함한 전체 식사 수와 실제 방향 지지 수를 구분한다', () => {
  for (const direction of ['positive', 'negative']) {
    const records = [1,2,3].map(i => modelRecord(`same-${i}`, direction)).concat(modelRecord('neutral', 'neutral'));
    const candidate = buildPersonalTasteModel({ userId: 'fixture-user', records }).candidates.find(c => c.conditions.length === 0);
    assert.equal(candidate.direction, direction);
    assert.equal(candidate.distribution.mealCount, 4);
    assert.equal(candidate.supportMealIDs.length, 3);
    assert.match(candidate.body, /4번의 식사 중 3번에서/);
  }
});

test('검증된 부모 강도 연결은 호감과 알맞음 집계에 동일하게 전달된다', () => {
  const evidence = id => ({ selectionID: id, type: 'bubble', catalogVersion: 'v2', relatedBubbleID: null, selectionInstanceID: id });
  const rating = modelRecord('liking', 'positive', { selectionEvidence: evidence('detail') });
  const fit = { ...rating, observationId: 'fit', kind: 'preference_fit', scale: 'preference-fit-v1', value: 'just_right' };
  const intensity = { ...rating, observationId: 'parent-intensity', kind: 'sensory_intensity', scale: 'expression-strength-v1', value: 'strong', selectionEvidence: evidence('parent') };
  const input = { userId: 'fixture-user', records: [rating, fit, intensity] };
  const without = buildPersonalTasteModel(input);
  assert.equal(without.units[0].intensity, null);
  assert.equal(without.fitPatterns.some(p => p.conditions.some(c => c.dimension === 'intensity')), false);
  const linked = buildPersonalTasteModel(input, { validatedIntensityLinks: { liking: ['parent-intensity'], fit: ['parent-intensity'] } });
  assert.equal(linked.units[0].intensity, 'strong');
  assert.ok(linked.fitPatterns.some(p => p.conditions.some(c => c.dimension === 'intensity' && c.value === 'strong')));
});

test('변화에 대한 아쉬움이 실제 저장을 반복해도 감각 불호로 누적되지 않는다', async () => {
  const engine = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture' });
  try {
    await engine.importFoods({ sources: [], foods: [{ id: 'audit-food', name: '검증 음식', claims: [] }] });
    await engine.createUser('audit-user');
    for (let i = 0; i < 3; i++) {
      await engine.createExperience({ owner: 'audit-user', id: `e${i}`, mealId: `m${i}`, foodId: 'audit-food' });
      await engine.mutate('audit-user', { experienceId: `e${i}`, mutationId: `mutation${i}`, baseRevision: 0, operation: 'set', recordedAt: '2026-10-02T00:00:00.000Z', answer: { question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, value: '소스를 묻히니 바삭함이 죽어서 아쉬웠다.' } });
    }
    const report = await engine.analyze('audit-user');
    assert.equal(report.personalModel.units.length, 0);
    assert.equal(report.personalModel.candidates.length, 0);
    assert.equal(report.provenance.unresolvedRecords.length, 3);
  } finally { await engine.close(); }
});
