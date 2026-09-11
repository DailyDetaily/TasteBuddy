import test from 'node:test';
import assert from 'node:assert/strict';
import { checkScenario, evaluateEngine } from './evaluate.mjs';
import { VALIDATION_CASES } from './validation-cases.mjs';

test('추가 가상 사례는 실제 저장·정제·분석을 통과하며 모델 미검증 상태를 유지한다', async () => {
  let calls = 0;
  const report = await evaluateEngine({ fetchImpl: async () => { calls++; throw new Error('실제 호출 금지'); } });
  assert.equal(report.passed, true);
  assert.equal(report.summary.scenarios, 12);
  assert.equal(report.summary.passedScenarios, 12);
  assert.equal(report.actualApiCalls, 0);
  assert.equal(calls, 0);
  assert.equal(report.summary.pendingAIRecords, 2);
  assert.equal(report.modelQuality.extractionAccuracy, null);
  assert.equal(report.modelQuality.narrativeQuality, null);
  assert.ok(report.cases.every(item => item.manualReview.status === 'pending'));
  assert.deepEqual(report.comparisons, [{ cases: ['V08', 'V09'], sameProfile: true, differentEvidenceAttributes: true, differentSourceSummaries: true }]);
});

test('평가기는 비어 있는 출력이나 다른 부위·시점의 관찰을 정답으로 세지 않는다', () => {
  const fixture = VALIDATION_CASES.find(item => item.id === 'V05');
  const base = { profile: { main: null, wing: null, candidates: [] }, provenance: { records: [], unresolvedRecords: [] }, execution: { actualApiCalls: 0 } };
  assert.equal(checkScenario(fixture, base).passed, false);
  const wrongScope = structuredClone(base);
  wrongScope.provenance.records = fixture.expected.required.map(({ record, ...atom }) => ({ ...atom, experienceId: `${fixture.id}-experience-${record}`, target: 'whole_dish' }));
  const result = checkScenario(fixture, wrongScope);
  assert.equal(result.passed, false);
  assert.ok(result.checks.some(check => check.name.startsWith('forbidden') && !check.passed));
  const temporal = VALIDATION_CASES.find(item => item.id === 'V06');
  const wrongPhase = structuredClone(base);
  wrongPhase.provenance.records = temporal.expected.required.map(({ record, ...atom }) => ({ ...atom, experienceId: `${temporal.id}-experience-${record}`, phase: atom.phase === 'early_meal' ? 'first_bite' : atom.phase }));
  assert.equal(checkScenario(temporal, wrongPhase).passed, false);
});

test('평가기는 원문에 없는 호감·메인 타입 또는 네트워크 호출을 검출한다', () => {
  const fixture = VALIDATION_CASES[0];
  const report = { profile: { main: { id: 'epicure' }, wing: null }, execution: { actualApiCalls: 1 }, provenance: { records: [{ kind: 'attribute_liking', attribute: 'taste.umami', value: 'positive' }] } };
  const checked = checkScenario(fixture, report);
  assert.equal(checked.passed, false);
  for (const name of ['main', 'zero-api-calls', 'forbidden-0']) assert.ok(checked.checks.some(check => check.name === name && !check.passed));
});
