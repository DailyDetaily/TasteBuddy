import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseByRules } from './rules.mjs';

export const CASES_URL = new URL('./semantic-review-cases.json', import.meta.url);
export const tuple = atom => [atom.kind, atom.attribute ?? null, atom.value, atom.target, atom.phase];
const key = atom => JSON.stringify(tuple(atom));
const matches = (atom, pattern) => Object.entries(pattern).every(([field, value]) => JSON.stringify(atom[field]) === JSON.stringify(value));
const ratio = (n, d) => d ? n / d : null;
const countBy = (items, getter) => items.reduce((result, item) => { const k = getter(item); result[k] = (result[k] ?? 0) + 1; return result; }, {});
export function caseHash(cases) { return createHash('sha256').update(JSON.stringify(cases)).digest('hex'); }
export async function loadCases() { return JSON.parse(await readFile(CASES_URL, 'utf8')); }

export function routeOf(result) {
  if (result.needsAI) return 'ai_candidate';
  if (result.unresolved?.length) {
    const reasons = result.unresolved.map(item => item.reason ?? item.reasonCode ?? '').join(' ');
    if (/not_direct_self|unrelated|non_experiential|excluded|irrelevant/.test(reasons)) return 'excluded';
    return result.observations?.length ? 'partial_rules_with_unresolved' : 'information_insufficient';
  }
  return 'rules_complete';
}

export function evaluateCase(fixture, parser = parseByRules) {
  let actual;
  try { actual = parser(fixture.answer, { source: { dataOrigin: 'synthetic_fixture', answerId: fixture.id } }); }
  catch (error) { return { id: fixture.id, format: fixture.answer.question, category: fixture.category, expectedRouting: fixture.expected.routing, actualRouting: 'error', error: error.message, truePositive: 0, falsePositive: 0, falseNegative: fixture.expected.required.length, missing: fixture.expected.required.map(tuple), unexpected: [], forbiddenViolations: [], groundingViolations: [], deterministic: false, routeCorrect: false, exact: false }; }
  const observations = actual.observations ?? [];
  const required = new Map(fixture.expected.required.map(atom => [key(atom), atom]));
  const allowed = new Set((fixture.expected.allowed ?? []).map(key));
  const seen = new Map(observations.map(atom => [key(atom), atom]));
  const missing = [...required.keys()].filter(k => !seen.has(k));
  const unexpected = [...seen.keys()].filter(k => !required.has(k) && !allowed.has(k));
  const forbiddenViolations = observations.flatMap(atom => (fixture.expected.forbidden ?? []).filter(pattern => matches(atom, pattern)).map(pattern => ({ tuple: tuple(atom), pattern })));
  const groundingViolations = observations.flatMap((atom, index) => {
    const errors = [];
    if (!Array.isArray(atom.sourceSpans) || !atom.sourceSpans.length) errors.push('missing_source_spans');
    for (const span of atom.sourceSpans ?? []) {
      const source = typeof fixture.answer.value === 'string' ? fixture.answer.value : fixture.answer.value.find(choice => choice.id === span.choiceId)?.label;
      if (typeof source !== 'string' || !Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > source.length || source.slice(span.start, span.end) !== span.quote) errors.push('invalid_utf16_source_span');
    }
    if (!atom.ruleIds?.length) errors.push('missing_rule_ids');
    return errors.map(error => ({ index, error }));
  });
  for (const [index, item] of (actual.unresolved ?? []).entries()) {
    if (!item.sourceSpans?.length) groundingViolations.push({ index: `unresolved-${index}`, error: 'missing_source_spans' });
    for (const span of item.sourceSpans ?? []) {
      const source = typeof fixture.answer.value === 'string' ? fixture.answer.value : fixture.answer.value.find(choice => choice.id === (span.choiceId ?? item.choiceId))?.label;
      if (typeof source !== 'string' || !Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > source.length || source.slice(span.start, span.end) !== span.quote) groundingViolations.push({ index: `unresolved-${index}`, error: 'invalid_utf16_source_span' });
    }
  }
  for (const expected of fixture.expected.required) {
    if (expected.reference && seen.get(key(expected))?.reference !== expected.reference) groundingViolations.push({ error: 'missing_metaphor_reference', expected: expected.reference });
  }
  const deterministic = JSON.stringify(actual) === JSON.stringify(parser(fixture.answer, { source: { dataOrigin: 'synthetic_fixture', answerId: fixture.id } }));
  const actualRouting = routeOf(actual);
  return { id: fixture.id, format: fixture.answer.question, category: fixture.category, expectedRouting: fixture.expected.routing, actualRouting, truePositive: required.size - missing.length, falsePositive: unexpected.length, falseNegative: missing.length, missing: missing.map(JSON.parse), unexpected: unexpected.map(JSON.parse), forbiddenViolations, groundingViolations, deterministic, routeCorrect: fixture.expected.routing === actualRouting, exact: !missing.length && !unexpected.length && !forbiddenViolations.length && !groundingViolations.length, decisionReasons: actual.decisionReasons, unresolved: actual.unresolved };
}

function aggregate(results) {
  const sum = field => results.reduce((n, item) => n + item[field], 0);
  const tp = sum('truePositive'), fp = sum('falsePositive'), fn = sum('falseNegative');
  return { caseCount: results.length, truePositive: tp, falsePositive: fp, falseNegative: fn, precision: ratio(tp, tp + fp), recall: ratio(tp, tp + fn), exactCases: results.filter(item => item.exact).length, exactCaseRate: ratio(results.filter(item => item.exact).length, results.length), routingCorrect: results.filter(item => item.routeCorrect).length, routingAccuracy: ratio(results.filter(item => item.routeCorrect).length, results.length), forbiddenViolationCount: results.reduce((n,item) => n + item.forbiddenViolations.length, 0), groundingViolationCount: results.reduce((n,item) => n + item.groundingViolations.length, 0), errors: results.filter(item => item.error).length };
}

export function evaluateSuite(data, parser = parseByRules) {
  const results = data.cases.map(fixture => evaluateCase(fixture, parser));
  const overall = aggregate(results);
  const aiCandidates = results.filter(item => item.expectedRouting === 'ai_candidate');
  const noApiExpected = results.filter(item => item.expectedRouting !== 'ai_candidate');
  const byFormat = Object.fromEntries(['sensory','free_text'].map(format => [format, aggregate(results.filter(item => item.format === format))]));
  const routingMatrix = countBy(results, item => `${item.expectedRouting}→${item.actualRouting}`);
  return { schemaVersion: 'tba-semantic-evaluation/1', dataOrigin: 'synthetic_fixture', fixtureHash: caseHash(data.cases), frozenHashMatches: caseHash(data.cases) === data.casesSha256, mode: 'rules_only', actualApiCalls: 0, actualModelAccuracy: null, actualModelStatus: 'not_evaluated_no_api_calls', notes: ['선택형과 자유문장 지표를 분리한다.', 'AI 후보 정답도 전체 recall 분모에 포함한다. 모델 실행 없이 해당 누락을 성공으로 세지 않는다.', '규칙에 보류된 AI 후보는 실제 모델 검증이 필요한 별도 집계이다.', '이 평가기는 AI 정답 응답을 mocking하지 않는다.', '기준 예문을 보고 규칙을 보완한 회귀평가이다. 미공개 홀드아웃이나 일반 사용자 문장으로의 일반화 성능 추정이 아니다.'], coverage: { cases: results.length, distinctSelectedLabels: new Set(data.cases.filter(item => item.answer.question === 'sensory').flatMap(item => item.answer.value.map(choice => choice.id))).size, formats: countBy(results, item => item.format), foodMaps: countBy(data.cases, item => item.foodMapId), domains: countBy(data.cases.flatMap(item => item.domains), item => item), categories: countBy(results, item => item.category) }, overall, byFormat, rulesExpected: aggregate(results.filter(item => item.expectedRouting === 'rules_complete')), routing: { matrix: routingMatrix, accuracy: overall.routingAccuracy, noApiExpectedCases: noApiExpected.length, inappropriateAiCandidates: noApiExpected.filter(item => item.actualRouting === 'ai_candidate').map(item => item.id), aiCandidateCount: aiCandidates.length, aiCandidates: aiCandidates.map(item => ({ id: item.id, correctlyRouted: item.actualRouting === 'ai_candidate', actualModelEvaluated: false })) }, gates: { precision95: overall.precision >= 0.95, recall85: overall.recall >= 0.85, forbiddenInferences: overall.forbiddenViolationCount === 0, groundedSpans: overall.groundingViolationCount === 0, deterministic: results.every(item => item.deterministic), noUnnecessaryAi: noApiExpected.every(item => item.actualRouting !== 'ai_candidate'), fixtureFrozen: caseHash(data.cases) === data.casesSha256 }, failures: results.filter(item => !item.exact || !item.routeCorrect || !item.deterministic), cases: results };
}

async function main() {
  const data = await loadCases();
  const report = evaluateSuite(data);
  const output = process.argv.indexOf('--output');
  if (output >= 0) await writeFile(process.argv[output + 1], `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ overall: report.overall, byFormat: report.byFormat, gates: report.gates, routing: report.routing, failures: report.failures.map(({ id, missing, unexpected, error, expectedRouting, actualRouting }) => ({ id, missing, unexpected, error, expectedRouting, actualRouting })) }, null, 2));
  if (process.argv.includes('--check') && Object.values(report.gates).some(value => !value)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
