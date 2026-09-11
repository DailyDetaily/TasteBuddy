import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTasteAnalysisEngine, PALATE_STYLES } from './index.mjs';
import { LEXICON_VERSION, parseByRules } from '../tba-platform-pilot/rules.mjs';
import { buildNarrativePacket, generateNarrative, validateNarrative } from './narrative.mjs';
import { analyzeInput } from './run.mjs';

let engine;
let serial = 0;
const time = '2026-09-06T01:00:00.000Z';
const foods = [
  { id: 'cake', name: '검증용 케이크', claims: [] },
  { id: 'drink', name: '검증용 음료', claims: [] },
  { id: 'rice', name: '검증용 곡물 요리', claims: [] },
];
const answer = (value, extra = {}) => ({ question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, target: 'whole_dish', phase: 'unspecified', value, ...extra });
const event = (id, revision, input, extra = {}) => ({ experienceId: id, mutationId: `mutation-${++serial}`, baseRevision: revision, operation: 'set', answer: input, recordedAt: time, ...extra });
async function user(name, runtime = engine) { await runtime.createUser(name); return name; }
async function record(owner, value, { id = `${owner}-${++serial}`, foodId = 'cake', mealId = id, runtime = engine, input = answer(value) } = {}) {
  await runtime.createExperience({ owner, id, mealId, foodId });
  await runtime.mutate(owner, event(id, 0, input));
  return id;
}
before(async () => {
  engine = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture' });
  await engine.importFoods({ sources: [], foods });
});
after(async () => engine?.close());

test('아홉 타입 모두 직접 호감 기록에서 도달하며 첫 경험은 메인으로 확정하지 않는다', async () => {
  const examples = {
    purist: '재료 본연의 맛이 좋았어요.', maximalist: '매운맛이 강했어요. 매운맛이 좋았어요.',
    alchemist: '발효 풍미가 좋았어요.', roaster: '고소한 맛이 좋았어요.', romantic: '단맛이 좋았어요.',
    texturalist: '바삭함이 좋았어요.', epicure: '감칠맛이 좋았어요.', refresher: '산뜻한 맛이 좋았어요.',
    harmonist: '맛의 균형이 좋았어요.',
  };
  assert.equal(PALATE_STYLES.length, 9);
  for (const style of PALATE_STYLES) {
    const owner = await user(`style-${style.id}`);
    await record(owner, examples[style.id]);
    const first = await engine.analyze(owner);
    assert.equal(first.profile.main, null, style.id);
    assert.equal(first.profile.candidates.find(item => item.id === style.id).status, 'first_signal', style.id);
    await record(owner, examples[style.id]);
    const repeated = await engine.analyze(owner);
    assert.equal(repeated.profile.main?.id, style.id);
    assert.equal(repeated.profile.wing, null);
    assert.equal(repeated.profile.main.supportCoverage.meals, 2);
    assert.equal(repeated.profile.main.probability, null);
  }
});

test('감각의 존재·강함·전체 호감은 감각 선호나 강렬형의 근거가 되지 않는다', async () => {
  const owner = await user('no-inferred-liking');
  for (let i = 0; i < 3; i++) await record(owner, '단맛이 강했어요. 전체적으로 좋았어요.');
  const report = await engine.analyze(owner);
  assert.equal(report.profile.main, null);
  assert.ok(report.profile.candidates.every(item => item.supportRefs.length === 0));
  assert.equal(report.insights.findings.length, 0);
  const mild = await user('spice-not-intensity');
  for (let i = 0; i < 2; i++) await record(mild, '매운맛이 좋았어요.');
  assert.equal((await engine.analyze(mild)).profile.candidates.find(item => item.id === 'maximalist').supportRefs.length, 0);
});

test('여러 구절의 동일 감각을 한 관찰로 합쳐도 각각의 원문 출처를 검증한다', async () => {
  const owner = await user('multiple-source-phrases');
  await record(owner, '단맛이 강했어요. 단맛이 좋았어요.');
  const report = await engine.analyze(owner);
  const presence = report.provenance.records.find(item => item.kind === 'sensory_presence');
  assert.equal(presence.sourceAnswerRefs.length, 2);
  assert.equal(report.coverage.observations, 3);
  assert.deepEqual(new Set(presence.sourceAnswerRefs.map(item => item.phrase)), new Set(['단맛이 강했어요.', '단맛이 좋았어요.']));
  const mixed = await user('conflicting-intensity');
  for (let i = 0; i < 2; i++) await record(mixed, '매운맛이 강했어요. 매운맛이 약했어요. 매운맛이 좋았어요.');
  assert.equal((await engine.analyze(mixed)).profile.candidates.find(item => item.id === 'maximalist').supportRefs.length, 0);
});

test('같은 식사의 여러 접시·중복 답변으로 메인이나 날개를 만들지 않는다', async () => {
  const owner = await user('meal-cluster');
  const ids = [];
  for (let i = 0; i < 4; i++) ids.push(await record(owner, '단맛이 좋았어요.', { mealId: 'one-meal' }));
  await engine.mutate(owner, event(ids[0], 1, answer('단맛이 좋았어요.'), { answerKey: 'another-answer' }));
  const report = await engine.analyze(owner);
  assert.equal(report.profile.main, null);
  assert.equal(report.profile.candidates.find(item => item.id === 'romantic').supportCoverage.meals, 1);
  assert.equal(report.coverage.meals, 1);
});

test('메인과 날개는 모든 타입 조합에 열려 있고 동률은 억지로 정렬하지 않는다', async () => {
  const owner = await user('main-wing');
  await record(owner, '단맛이 좋았어요. 고소한 맛이 좋았어요.');
  await record(owner, '단맛이 좋았어요. 고소한 맛이 좋았어요.');
  let report = await engine.analyze(owner);
  assert.equal(report.profile.status, 'ambiguous_main');
  assert.deepEqual(report.profile.mainCandidates.sort(), ['roaster', 'romantic']);
  await record(owner, '단맛이 좋았어요.');
  report = await engine.analyze(owner);
  assert.equal(report.profile.main.id, 'romantic');
  assert.equal(report.profile.wing.id, 'roaster');
  assert.ok(report.profile.wing.supportRefs.every(id => !report.profile.main.supportRefs.includes(id)));
});

test('상반된 경험·감각 부재·조건을 지워서 취향을 확정하지 않는다', async () => {
  const owner = await user('mixed-conditions');
  await record(owner, '단맛이 좋았어요.', { foodId: 'cake' });
  await record(owner, '단맛이 좋았어요.', { foodId: 'cake' });
  await record(owner, '단맛이 싫었어요.', { foodId: 'drink' });
  let report = await engine.analyze(owner);
  assert.equal(report.profile.main.status, 'mixed');
  assert.equal(report.profile.main.counterCoverage.meals, 1);
  assert.ok(report.insights.findings.some(item => item.kind === 'contextual_preference' && item.negativeRefs.length));
  const absenceOwner = await user('absent-sweet');
  for (let i = 0; i < 2; i++) await record(absenceOwner, '단맛이 없어서 좋았어요.');
  report = await engine.analyze(absenceOwner);
  assert.equal(report.profile.main, null);
  assert.ok(report.insights.findings.every(item => item.kind === 'qualified_preference'));
});

test('같은 메인·날개여도 기록과 반응이 다르면 발견과 설명이 달라진다', async () => {
  const a = await user('same-type-a'), b = await user('same-type-b');
  for (const owner of [a, b]) {
    for (let i = 0; i < 3; i++) await record(owner, '단맛이 좋았어요.', { foodId: 'cake' });
    for (let i = 0; i < 2; i++) await record(owner, owner === a ? '구운 향이 좋았어요.' : '구수한 맛이 좋았어요.', { foodId: 'rice' });
  }
  await record(b, '단맛이 너무 강했어요. 단맛이 싫었어요.', { foodId: 'drink' });
  // 중심을 분명히 유지할 추가 직접 경험. 불호는 그대로 남는다.
  await record(b, '단맛이 좋았어요.', { foodId: 'cake' });
  const ar = await engine.analyze(a), br = await engine.analyze(b);
  assert.equal(ar.profile.label, br.profile.label);
  assert.notDeepEqual(ar.insights.highlights.map(item => item.text), br.insights.highlights.map(item => item.text));
  assert.ok(br.insights.findings.some(item => item.kind === 'contextual_preference'));
  assert.equal(br.insights.highlights.filter(item => item.evidence.some(source => source.attribute === 'taste.sweet')).length, 1);
  assert.ok(br.insights.highlights.some(item => item.evidence.some(source => source.attribute === 'flavor.cereal_savory')));
  const packet = buildNarrativePacket(br.insights);
  assert.ok(!JSON.stringify(packet).includes('로맨틱'));
  assert.ok(!JSON.stringify(packet).includes('로스터'));
  for (const finding of br.insights.findings) {
    assert.ok(finding.observationRefs.every(id => br.provenance.records.some(record => record.observationId === id)));
    assert.equal(finding.causalClaim, null);
  }
});

test('수정·선택 취소·경험 삭제는 타입·개인 해석·서술의 모든 근거에 반영된다', async () => {
  const owner = await user('lifecycle');
  const first = await record(owner, '단맛이 좋았어요.'), second = await record(owner, '단맛이 좋았어요.');
  const before = await engine.analyze(owner);
  assert.equal(before.profile.main.id, 'romantic');
  const removedRefs = before.provenance.records.filter(item => item.experienceId === second).map(item => item.observationId);
  await engine.mutate(owner, event(second, 1, answer('단맛이 싫었어요.')));
  const edited = await engine.analyze(owner);
  assert.equal(edited.profile.main, null);
  assert.ok(removedRefs.every(id => !JSON.stringify(edited).includes(`"${id}"`)));
  await engine.mutate(owner, { experienceId: second, mutationId: 'remove-second', baseRevision: 2, operation: 'remove', question: 'free_text', recordedAt: time });
  const cleared = await engine.analyze(owner);
  assert.equal(cleared.insights.findings.filter(item => item.negativeRefs?.length).length, 0);
  await engine.mutate(owner, { experienceId: first, mutationId: 'delete-first', baseRevision: 1, operation: 'delete', recordedAt: time });
  const empty = await engine.analyze(owner, { narrate: true });
  assert.equal(empty.userId, owner);
  assert.equal(empty.coverage.observations, 0);
  assert.equal(empty.profile.status, 'learning');
  assert.deepEqual(empty.narrative.paragraphs, []);
  await assert.rejects(engine.createExperience({ owner, id: first, mealId: 'revive', foodId: 'cake' }), /EXPERIENCE_DELETED/);
});

test('사용자 간 근거를 섞지 않고 다른 사용자의 기록 수정은 거부한다', async () => {
  const owner = await user('owner-a'), other = await user('owner-b');
  const id = await record(owner, '단맛이 좋았어요.');
  await assert.rejects(engine.mutate(other, event(id, 1, answer('단맛이 싫었어요.'))), /OWNER_MISMATCH/);
  assert.equal((await engine.analyze(other)).coverage.observations, 0);
  await assert.rejects(engine.analyze('missing-user'), /USER_NOT_FOUND/);
});

test('넓은 감각은 원문 의미로만 보존하고 재료·조리·과학 속성으로 치환하지 않는다', () => {
  for (const [value, attribute] of [
    ['고소한 맛이 좋았어요.', 'flavor.nutty_savory'], ['구수한 맛이 좋았어요.', 'flavor.cereal_savory'],
    ['재료 본연의 맛이 좋았어요.', 'flavor.ingredient_character'], ['맛의 균형이 좋았어요.', 'flavor.balance'],
  ]) {
    const parsed = parseByRules(answer(value));
    assert.equal(parsed.needsAI, false);
    assert.ok(parsed.observations.some(item => item.kind === 'attribute_liking' && item.attribute === attribute));
    assert.ok(parsed.observations.every(item => item.attribute === attribute));
  }
  assert.equal(parseByRules(answer('고소했어요.')).observations.length, 0);
  assert.equal(parseByRules(answer('고소한 맛이 좋았어요.')).unresolved.length, 0);
  assert.ok(parseByRules(answer('단맛이 적당해서 좋았어요.')).observations.some(item => item.kind === 'preference_fit' && item.value === 'just_right'));
});

test('API 키가 없거나 서술을 요청하지 않으면 네트워크 없이 정제·해석이 완료된다', async () => {
  let calls = 0;
  const runtime = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture', fetchImpl: async () => { calls++; throw new Error('호출되면 안 됨'); } });
  try {
    await runtime.importFoods({ sources: [], foods });
    await user('offline', runtime);
    const id = await record('offline', '단맛이 좋았어요.', { runtime });
    const report = await runtime.analyze('offline', { narrate: true });
    assert.equal(report.narrative.status, 'missing_api_key');
    const saved = await runtime.saveAnswer('offline', event(id, 1, answer('그 향이 좋았어요.')));
    assert.equal(saved.extraction.status, 'unverified_missing_key');
    assert.ok(saved.analysis.provenance.unresolvedRecords.length);
    assert.equal(calls, 0);
  } finally { await runtime.close(); }
});

test('서술 응답은 인용·발견 ID·과장 표현을 검사하고 실패하면 근거 요약을 유지한다', async () => {
  const report = await engine.analyze('main-wing');
  const packet = buildNarrativePacket(report.insights);
  const finding = packet.findings[0], source = finding.evidence[0];
  const proposal = { paragraphs: [{ text: '기록한 디저트에서는 단맛에 대한 호감이 반복됐어요.', findingIds: [finding.id], quotes: [{ observationId: source.observationId, quote: source.quote }] }] };
  assert.equal(validateNarrative(proposal, packet).valid, true);
  const forged = structuredClone(proposal);
  forged.paragraphs[0].quotes[0].quote = '원문에 없는 문장';
  assert.equal(validateNarrative(forged, packet).valid, false);
  const unknown = structuredClone(proposal);
  unknown.paragraphs[0].findingIds = ['다른 사용자의 발견'];
  assert.equal(validateNarrative(unknown, packet).valid, false);
  const exaggerated = structuredClone(proposal);
  exaggerated.paragraphs[0].text = '달콤한 성격이며 정확도 99%입니다.';
  assert.equal(validateNarrative(exaggerated, packet).valid, false);
  const response = output => async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(output) }] }] }) });
  const invalid = await generateNarrative(report.insights, { config: { apiKey: 'test-only' }, fetchImpl: response(forged) });
  assert.equal(invalid.status, 'invalid_grounding');
  assert.equal(invalid.source, 'evidence_summary');
  const cache = new Map();
  const accepted = await generateNarrative(report.insights, { config: { apiKey: 'test-only' }, fetchImpl: response(proposal), cache });
  assert.equal(accepted.status, 'model_draft');
  assert.equal(accepted.generation.semanticValidation, 'references_checked_meaning_requires_review');
  const again = await generateNarrative(report.insights, { config: { apiKey: 'test-only' }, fetchImpl: () => { throw new Error('캐시를 사용해야 함'); }, cache });
  assert.equal(again.generation.actualApiCalls, 0);
});

test('서술 도중 기록을 삭제하면 늦게 도착한 설명을 폐기하고 최신 결과를 반환한다', async () => {
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const waiting = new Promise(resolve => { release = resolve; });
  const runtime = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture', narrativeConfig: { apiKey: 'test-only' }, fetchImpl: async (_url, init) => {
    const packet = JSON.parse(JSON.parse(init.body).input), finding = packet.findings[0];
    entered(); await waiting;
    return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ paragraphs: [{ text: '이 음식의 단맛을 좋게 기록했어요.', findingIds: [finding.id], quotes: [{ observationId: finding.evidence[0].observationId, quote: finding.evidence[0].quote }] }] }) }] }] }) };
  } });
  try {
    await runtime.importFoods({ sources: [], foods }); await user('late', runtime);
    const id = await record('late', '단맛이 좋았어요.', { runtime });
    const pending = runtime.analyze('late', { narrate: true });
    await started;
    await runtime.mutate('late', { experienceId: id, mutationId: 'delete-late', baseRevision: 1, operation: 'delete', recordedAt: time });
    release();
    const result = await pending;
    assert.equal(result.narrative.status, 'stale_generation_discarded');
    assert.deepEqual(result.narrative.paragraphs, []);
    assert.equal(result.coverage.observations, 0);
  } finally { release(); await runtime.close(); }
});

test('모델 추출은 확인 전에는 메인·날개에 기여하지 않고 명시 답변이 추가되면 근거가 된다', async () => {
  const text = '불향은 처음엔 좋았는데 나중에는 그 향이 부담스러웠어요.';
  const quote = '불향은 처음엔 좋았는데';
  const proposal = { observations: [{ kind: 'attribute_liking', attribute: 'aroma.smoky', value: 'positive', scale: 'attribute-three-category-v1', target: 'whole_dish', phase: 'early_meal', phrase: quote, reference: null, combinationComponents: [], sourceSpans: [{ start: 0, end: quote.length, quote }] }], unresolved: [] };
  const runtime = await createTasteAnalysisEngine({ aiConfig: { apiKey: 'test-only', provider: 'offline_fixture' }, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(proposal) }] }] }) }) });
  try {
    await runtime.importFoods({ sources: [], foods }); await user('model-origin', runtime);
    const ids = [];
    for (let i = 0; i < 2; i++) {
      const id = await record('model-origin', text, { runtime, input: answer(text, { phase: undefined }) });
      ids.push(id);
      const extraction = await runtime.processAnswerAI('model-origin', { experienceId: id, answerKey: 'free_text', baseRevision: 1 });
      assert.equal(extraction.observations[0].evidenceClass, 'user_report');
    }
    const unconfirmed = await runtime.analyze('model-origin');
    assert.equal(unconfirmed.profile.main, null);
    assert.equal(unconfirmed.profile.candidates.find(item => item.id === 'roaster').status, 'unconfirmed_only');
    for (const id of ids) await runtime.mutate('model-origin', event(id, 1, answer('좋았어요', { question: 'attribute_liking', attribute: 'aroma.smoky', phase: 'early_meal' }), { answerKey: 'explicit-confirmation' }));
    const confirmedReport = await runtime.analyze('model-origin');
    assert.equal(confirmedReport.profile.main.id, 'roaster');
    assert.ok(confirmedReport.provenance.records.every(item => item.evidenceClass === 'user_report'));
  } finally { await runtime.close(); }
});

test('배치 실행은 음식명에서 감각을 만들지 않고 같은 답변 키의 조용한 덮어쓰기를 거부한다', async () => {
  const input = { evidenceClass: 'synthetic_fixture', userId: 'batch', foods: [{ id: 'named-food', name: '달콤하고 바삭한 음식이라는 이름' }], experiences: [{ id: 'batch-e', mealId: 'batch-m', foodId: 'named-food', recordedAt: time, answers: [{ question: 'overall', value: '좋았어요' }] }] };
  const result = await analyzeInput(input);
  assert.equal(result.profile.main, null);
  assert.ok(result.profile.candidates.every(item => item.supportRefs.length === 0));
  const duplicate = structuredClone(input);
  duplicate.experiences[0].answers.push({ question: 'overall', value: '아쉬웠어요' });
  await assert.rejects(analyzeInput(duplicate), /DUPLICATE_ANSWER_KEY/);
});

test('실사용 입력은 user_report로 끝까지 유지하며 디스크 재개 후에도 동일하게 분석한다', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tba-engine-test-'));
  let runtime;
  try {
    runtime = await createTasteAnalysisEngine({ dataDir: directory });
    await runtime.importFoods({ sources: [], foods }); await user('persisted', runtime);
    await record('persisted', '단맛이 좋았어요.', { runtime });
    const original = await runtime.analyze('persisted');
    assert.equal(original.evidenceClass, 'user_report');
    assert.ok(original.provenance.records.every(record => record.evidenceClass === 'user_report'));
    await runtime.close();
    runtime = await createTasteAnalysisEngine({ dataDir: directory });
    const resumed = await runtime.analyze('persisted');
    assert.deepEqual(resumed, original);
    await runtime.close(); runtime = null;
    await assert.rejects(createTasteAnalysisEngine({ dataDir: directory, evidenceClass: 'synthetic_fixture' }), /STORAGE_EVIDENCE_CLASS_MISMATCH/);
  } finally { await runtime?.close(); await rm(directory, { recursive: true, force: true }); }
});
