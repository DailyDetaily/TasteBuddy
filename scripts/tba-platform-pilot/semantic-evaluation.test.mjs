import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { caseHash, evaluateCase, evaluateSuite, loadCases, routeOf } from './semantic-evaluation.mjs';
const data = await loadCases();

test('고정 기준은 synthetic 120개, 43맵별 선택과 자유문장, 8감각영역을 포함한다', async () => {
  const atlas = JSON.parse(await readFile(new URL('../../docs/product/tba-bubble-atlas.json', import.meta.url), 'utf8'));
  assert.equal(data.cases.length, 120);
  assert.equal(new Set(data.cases.map(item => item.id)).size, 120);
  assert.equal(caseHash(data.cases), data.casesSha256);
  assert.equal(data.cases.filter(item => item.answer.question === 'sensory').length, 43);
  assert.equal(data.cases.filter(item => item.answer.question === 'free_text').length, 77);
  for (const map of atlas.maps) {
    const fixtures = data.cases.filter(item => item.foodMapId === map.id && item.category === 'food_map');
    assert.equal(fixtures.length, 2, map.id);
    assert.deepEqual(fixtures.map(item => item.answer.question).sort(), ['free_text','sensory']);
    for (const fixture of fixtures.filter(item => item.answer.question === 'sensory')) for (const choice of fixture.answer.value) assert.ok(map.node_ids.includes(choice.id));
  }
  const domains = new Set(data.cases.flatMap(item => item.domains));
  for (const domain of ['taste','aroma','texture','mouthfeel','temperature','trigeminal','multisensory','temporal']) assert.ok(domains.has(domain));
  for (const fixture of data.cases) assert.equal(fixture.dataOrigin, 'synthetic_fixture');
});

test('평가기 자체는 대상과 시점 오류, 금지 추론, 잘못된 원문 좌표를 탐지한다', () => {
  const fixture = data.cases.find(item => item.answer.value === '튀김옷이 바삭했어요.');
  const parser = () => ({ observations: [{ ...fixture.expected.required[0], target: 'whole_dish', phase: 'late_meal', sourceSpans: [{ start: 0, end: 2, quote: '가짜' }], ruleIds: ['test'] }, { kind: 'ingredient', attribute: 'wheat', value: true, target: 'whole_dish', phase: 'unspecified', sourceSpans: [], ruleIds: [] }], unresolved: [], needsAI: false });
  const result = evaluateCase(fixture, parser);
  assert.equal(result.truePositive, 0);
  assert.equal(result.falseNegative, 1);
  assert.equal(result.falsePositive, 2);
  assert.equal(result.forbiddenViolations.length, 1);
  assert.ok(result.groundingViolations.length >= 2);
});

test('라우팅은 문장 연결 후보와 정보 부족 및 제외 사유를 구분한다', () => {
  assert.equal(routeOf({needsAI: true}), 'ai_candidate');
  assert.equal(routeOf({needsAI: false, unresolved: [{reason:'insufficient_semantic_information'}]}), 'information_insufficient');
  assert.equal(routeOf({needsAI: false, unresolved: [{reason:'not_direct_self_experience'}]}), 'excluded');
  assert.equal(routeOf({needsAI: false, unresolved: []}), 'rules_complete');
  assert.equal(routeOf({needsAI: false, observations: [{kind:'sensory_presence'}], unresolved: [{reason:'liking_undetermined'}]}), 'partial_rules_with_unresolved');
});

test('규칙 실행의 실제 지표는 목표와 근거·금지·API0·결정론 계약을 충족한다', () => {
  const report = evaluateSuite(data);
  assert.equal(report.actualApiCalls, 0);
  assert.equal(report.actualModelAccuracy, null);
  assert.equal(report.byFormat.free_text.caseCount, 77);
  assert.ok(Object.values(report.gates).every(Boolean), JSON.stringify({gates:report.gates, overall:report.overall, failures:report.failures.map(item=>item.id)}));
});
