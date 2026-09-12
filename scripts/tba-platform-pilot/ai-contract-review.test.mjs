import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseByRules } from './rules.mjs';
import { resolveWithAI, validateAIProposal, rawAnswerHash } from './ai-extraction.mjs';
import { createExperiencePilot, FIXTURE_TIME } from './experience-evidence.mjs';
import { normalizeEvidence, buildInsightViews } from './insight-views.mjs';

// 원문별로 수작업 작성한 응답 계약 검사다. 기준 expected를 복사하지 않으며 모델 정확도를 측정하지 않는다.
const originals = {
  S092: '안 맵다는 건 아니에요.',
  S093: '달지 않은 건 아니지만 단맛이 싫다는 뜻은 아니에요.',
  S117: '소스의 단맛과 튀김옷의 바삭함이 함께 있어서 좋았어요.',
  S118: '불향은 처음엔 좋았는데 나중에는 그 향이 부담스러웠어요.',
};
const input = id => ({ question: 'free_text', questionVersion: '2', choiceVersion: 'tba-semantic-lexicon/2', value: originals[id] });
function span(id, quote) {
  const start = originals[id].indexOf(quote);
  assert.ok(start >= 0, `수작업 인용이 ${id} 원문에 있어야 한다: ${quote}`);
  return { start, end: start + quote.length, quote };
}
const scales = { sensory_presence: 'presence-v1', attribute_liking: 'attribute-three-category-v1', combination_liking: 'combination-three-category-v1' };
function atom(id, kind, attribute, value, target, phase, quote, supportingQuotes = [], components = []) {
  return { kind, attribute, value, scale: scales[kind], target, phase, phrase: quote, reference: null, combinationComponents: components, sourceSpans: [span(id, quote), ...supportingQuotes.map(q => span(id, q))] };
}
function handcraftedResponse(id) {
  if (id === 'S092') return { observations: [atom(id, 'sensory_presence', 'trigeminal.spicy', true, 'whole_dish', 'unspecified', '안 맵다는 건 아니에요.')], unresolved: [] };
  if (id === 'S093') return { observations: [atom(id, 'sensory_presence', 'taste.sweet', true, 'whole_dish', 'unspecified', '달지 않은 건 아니지만')], unresolved: [{ phrase: '단맛이 싫다는 뜻은 아니에요.', reason: '싫다는 뜻을 부정했지만 긍정 또는 중립 호감은 명시하지 않았다.', sourceSpans: [span(id, '단맛이 싫다는 뜻은 아니에요.')] }] };
  if (id === 'S117') {
    const components = [
      { attribute: 'taste.sweet', target: 'sauce', reference: null, sourceSpans: [span(id, '소스의 단맛')] },
      { attribute: 'texture.crisp', target: 'coating', reference: null, sourceSpans: [span(id, '튀김옷의 바삭함')] },
    ];
    return { observations: [
      atom(id, 'sensory_presence', 'taste.sweet', true, 'sauce', 'unspecified', '소스의 단맛'),
      atom(id, 'sensory_presence', 'texture.crisp', true, 'coating', 'unspecified', '튀김옷의 바삭함'),
      atom(id, 'combination_liking', null, 'positive', 'combination', 'unspecified', originals[id], [], components),
    ], unresolved: [] };
  }
  if (id === 'S118') return { observations: [
    atom(id, 'sensory_presence', 'aroma.smoky', true, 'whole_dish', 'early_meal', '불향은 처음엔 좋았는데'),
    atom(id, 'attribute_liking', 'aroma.smoky', 'positive', 'whole_dish', 'early_meal', '불향은 처음엔 좋았는데'),
    // 후반의 평가와 시점은 primary quote에 있고, "그 향"의 대상은 별도 원문 인용으로 연결한다.
    atom(id, 'sensory_presence', 'aroma.smoky', true, 'whole_dish', 'late_meal', '나중에는 그 향이 부담스러웠어요.', ['불향']),
    atom(id, 'attribute_liking', 'aroma.smoky', 'negative', 'whole_dish', 'late_meal', '나중에는 그 향이 부담스러웠어요.', ['불향']),
  ], unresolved: [] };
  throw new Error('UNKNOWN_HANDCRAFTED_CASE');
}
const context = (id, answer = input(id)) => ({ owner: 'contract-user', experienceId: id, answerKey: 'review', revision: 1, answerId: `${id}:answer`, eventId: `${id}:event`, rawHash: rawAnswerHash(answer) });
function offlineTransport(proposal) {
  let calls = 0;
  return { count: () => calls, fetchImpl: async (_url, request) => {
    calls++;
    const body = JSON.parse(request.body);
    assert.equal(body.model, 'gpt-6-astra');
    assert.equal(body.reasoning.effort, 'medium');
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    return { ok: true, status: 200, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(proposal) }] }], usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } }) };
  } };
}
const config = { apiKey: 'offline-contract-key', provider: 'offline_fixture', maxAttempts: 1 };
const semanticKey = item => JSON.stringify([item.kind, item.attribute, item.value, item.target, item.phase]);

let pilot;
before(async () => {
  pilot = await createExperiencePilot();
  const ref = { sourceId: 'contract-food-source', recordHash: 'synthetic-contract-hash', recordPointer: '/0', pointer: '/0/name', field: 'name', quote: '가상 계약검사용 음식' };
  await pilot.importFoods({ sources: [{ id: ref.sourceId }], foods: [{ id: 'contract-food', name: ref.quote, claims: [{ id: 'name', predicate: 'name', value: ref.quote, sourceRefs: [ref] }] }] });
  await pilot.createUser('contract-user');
});
after(async () => pilot?.close());

test('수작업 AI 응답의 원문은 고정 120기준 입력과 일치하며 정답 데이터에 의존하지 않는다', async () => {
  const fixtures = JSON.parse(await readFile(new URL('./semantic-review-cases.json', import.meta.url), 'utf8'));
  for (const [id, text] of Object.entries(originals)) assert.equal(fixtures.cases.find(item => item.id === id).answer.value, text);
});

for (const id of Object.keys(originals)) {
  test(`${id}: 올바른 수작업 AI 응답을 거부하지 않고 검증한다 (실제 네트워크 0)`, async () => {
    const answer = input(id), ruleResult = parseByRules(answer), proposal = handcraftedResponse(id);
    assert.equal(ruleResult.needsAI, true);
    const mock = offlineTransport(proposal);
    const result = await resolveWithAI({ answer, ruleResult, context: context(id), config, fetchImpl: mock.fetchImpl });
    assert.equal(mock.count(), 1);
    assert.deepEqual(result.artifact.rejections, [], `${id}: ${result.artifact.rejections.join(', ')}`);
    assert.deepEqual(result.observations.map(semanticKey).sort(), proposal.observations.map(semanticKey).sort());
    assert.equal(result.artifact.provider, 'offline_fixture');
    assert.ok(result.observations.every(item => item.confirmationStatus === 'model_extracted_unconfirmed'));
    assert.equal(result.usage.totalTokens, 0);
    if (id === 'S117') {
      assert.equal(result.observations.filter(item => item.kind === 'attribute_liking').length, 0);
      assert.deepEqual(result.observations.find(item => item.kind === 'combination_liking').combinationComponents, proposal.observations[2].combinationComponents);
    }
  });
  test(`${id}: 수작업 응답을 PGlite 저장 후 정제와 뷰까지 재검증한다`, async () => {
    const answer = input(id), proposal = handcraftedResponse(id), mock = offlineTransport(proposal);
    await pilot.createExperience({ owner: 'contract-user', id, mealId: `meal-${id}`, foodId: 'contract-food' });
    await pilot.mutate('contract-user', { experienceId: id, mutationId: `input-${id}`, baseRevision: 0, operation: 'set', answerKey: 'review', recordedAt: FIXTURE_TIME, answer });
    const result = await pilot.processAnswerAI('contract-user', { experienceId: id, answerKey: 'review', baseRevision: 1 }, { fetchImpl: mock.fetchImpl, config, recordedAt: FIXTURE_TIME });
    assert.deepEqual(result.artifact.rejections, [], `${id}: ${result.artifact.rejections.join(', ')}`);
    assert.equal(result.applied, true);
    const rows = (await pilot.currentEvidenceRows('contract-user')).filter(row => row.experience_id === id);
    assert.deepEqual(rows.map(row => semanticKey(row.payload)).sort(), proposal.observations.map(semanticKey).sort());
    const unresolvedRows = (await pilot.currentUnresolvedRows('contract-user')).filter(row => row.experience_id === id);
    const normalized = normalizeEvidence(rows, { unresolvedRows });
    assert.equal(normalized.records.length, proposal.observations.length);
    assert.ok(normalized.records.every(record => record.confirmationStatus === 'model_extracted_unconfirmed'));
    if (id === 'S093') assert.ok(normalized.unresolvedRecords.some(record => record.phrase === '단맛이 싫다는 뜻은 아니에요.'));
    const views = buildInsightViews(normalized);
    assert.equal(views.coverage.experiences, 1);
    assert.equal(views.coverage.observations, proposal.observations.length);
    assert.equal(views.groupComparisonPreparation.actualGroups, null);
    const allRefs = views.experienceSummaries.flatMap(summary => summary.observationRefs);
    assert.deepEqual([...new Set(allRefs)].sort(), rows.map(row => row.id).sort());
    if (id === 'S118') assert.deepEqual(normalized.records.filter(item => item.kind === 'attribute_liking').map(item => [item.phase, item.value]).sort(), [['early_meal', 'positive'], ['late_meal', 'negative']]);
    if (id === 'S117') {
      assert.equal(normalized.records.filter(item => item.kind === 'attribute_liking').length, 0);
      assert.deepEqual(normalized.records.find(item => item.kind === 'combination_liking').combinationComponents, proposal.observations[2].combinationComponents);
    }
    if (id === 'S093') assert.ok(views.experienceSummaries[0].unresolvedRefs.length > 0);
  });
}

test('올바른 인용이라도 다른 대상·다른 시점·다른 호감으로 바꾸면 거부한다', () => {
  const checks = [
    ['S117', 0, { target: 'coating' }],
    ['S118', 1, { phase: 'late_meal' }],
    ['S118', 1, { value: 'negative' }],
  ];
  for (const [id, index, change] of checks) {
    const candidate = { ...handcraftedResponse(id).observations[index], ...change };
    const result = validateAIProposal({ observations: [candidate], unresolved: [] }, { answer: input(id), ruleResult: parseByRules(input(id)), context: context(id) });
    assert.equal(result.observations.length, 0, `${id} 잘못된 변경 ${JSON.stringify(change)}`);
    assert.ok(result.rejections.length > 0);
  }
});

test('없는 원문·UTF16 좌표 오류·필수 필드 누락·규칙 충돌은 저장 후보에서 제외한다', () => {
  const answer = input('S092'), proposal = handcraftedResponse('S092'), original = proposal.observations[0];
  const malformed = [
    { ...original, phrase: '엄청 매웠어요.', sourceSpans: [{ start: 0, end: 7, quote: '엄청 매웠어요.' }] },
    { ...original, sourceSpans: [{ ...original.sourceSpans[0], start: 1 }] },
    Object.fromEntries(Object.entries(original).filter(([key]) => key !== 'reference')),
  ];
  for (const candidate of malformed) {
    const result = validateAIProposal({ observations: [candidate], unresolved: [] }, { answer, ruleResult: parseByRules(answer), context: context('S092') });
    assert.equal(result.observations.length, 0);
    assert.ok(result.rejections.length > 0);
  }
  const contradiction = { ...parseByRules(answer), observations: [{ ...original, value: false }] };
  const result = validateAIProposal(proposal, { answer, ruleResult: contradiction, context: context('S092') });
  assert.equal(result.observations.length, 0);
  assert.ok(result.rejections.includes('RULE_CONFLICT'));
});

test('이모지 앞부분이 있는 원문은 UTF16 단위 좌표를 사용하며 범위 초과 인용은 거부한다', () => {
  const prefix = '🍽️ ';
  assert.equal(prefix.length, 4);
  const answer = { ...input('S092'), value: `${prefix}${originals.S092}` };
  const original = handcraftedResponse('S092').observations[0];
  const correct = { ...original, sourceSpans: original.sourceSpans.map(s => ({ ...s, start: s.start + prefix.length, end: s.end + prefix.length })) };
  const args = { answer, ruleResult: parseByRules(answer), context: context('S092', answer) };
  assert.equal(validateAIProposal({ observations: [correct], unresolved: [] }, args).observations.length, 1);
  for (const wrongSpan of [{ ...correct.sourceSpans[0], start: 3 }, { ...correct.sourceSpans[0], end: answer.value.length + 1 }]) {
    const result = validateAIProposal({ observations: [{ ...correct, sourceSpans: [wrongSpan] }], unresolved: [] }, args);
    assert.equal(result.observations.length, 0, `잘못된 UTF16 범위 ${JSON.stringify(wrongSpan)}`);
  }
});

test('조합의 전체 문장이 맞아도 구성 속성과 대상 연결을 뒤바꾸면 거부한다', () => {
  const id = 'S117', answer = input(id);
  const combination = handcraftedResponse(id).observations[2];
  const candidate = { ...combination, combinationComponents: combination.combinationComponents.map(c => ({ ...c, target: c.target === 'sauce' ? 'coating' : 'sauce' })) };
  const result = validateAIProposal({ observations: [candidate], unresolved: [] }, { answer, ruleResult: parseByRules(answer), context: context(id) });
  assert.equal(result.observations.length, 0);
  assert.ok(result.rejections.includes('TARGET_NOT_IN_SOURCE'));
});
