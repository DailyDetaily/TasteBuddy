import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTasteAnalysisEngine } from './index.mjs';
import { LEXICON_VERSION } from '../tba-platform-pilot/rules.mjs';
import { buildNarrativePacket } from './narrative.mjs';
import { digest } from './evidence.mjs';
import { VALIDATION_CASES, VALIDATION_CASES_VERSION } from './validation-cases.mjs';

export function checkScenario(fixture, report) {
  const checks = [];
  const add = (name, passed, expected, actual) => checks.push({ name, passed, expected, actual });
  const records = report.provenance.records;
  const matches = (record, pattern) => Object.entries(pattern).every(([field, value]) => field === 'record'
    ? record.experienceId === `${fixture.id}-experience-${value}` : record[field] === value);
  for (const field of ['main', 'wing']) add(field, (report.profile[field]?.id ?? null) === fixture.expected[field], fixture.expected[field], report.profile[field]?.id ?? null);
  for (const [index, pattern] of (fixture.expected.required ?? []).entries()) add(`required-${index}`, records.some(record => matches(record, pattern)), pattern, records.filter(record => matches(record, pattern)).map(record => record.observationId));
  for (const [index, pattern] of (fixture.expected.forbidden ?? []).entries()) add(`forbidden-${index}`, !records.some(record => matches(record, pattern)), { absent: pattern }, records.filter(record => matches(record, pattern)).map(record => record.observationId));
  for (const style of fixture.expected.unsupportedStyles ?? []) {
    const candidate = report.profile.candidates.find(item => item.id === style);
    add(`no-support-${style}`, candidate?.supportRefs.length === 0, 0, candidate?.supportRefs.length ?? null);
  }
  if (fixture.expected.meals !== undefined) add('meal-count', report.coverage.meals === fixture.expected.meals, fixture.expected.meals, report.coverage.meals);
  if (fixture.expected.unresolvedMinimum !== undefined) add('unresolved-retained', report.provenance.unresolvedRecords.length >= fixture.expected.unresolvedMinimum, fixture.expected.unresolvedMinimum, report.provenance.unresolvedRecords.length);
  add('zero-api-calls', report.execution.actualApiCalls === 0, 0, report.execution.actualApiCalls);
  add('no-model-confirmation', records.every(record => record.confirmationStatus !== 'model_extracted_unconfirmed'), true, records.every(record => record.confirmationStatus !== 'model_extracted_unconfirmed'));
  return { passed: checks.every(check => check.passed), checks };
}

export async function evaluateEngine({ cases = VALIDATION_CASES, fetchImpl = async () => { throw new Error('OFFLINE_EVALUATION_NETWORK_FORBIDDEN'); } } = {}) {
  // 키 환경변수를 읽지 않고 평가 중 네트워크 호출 자체를 센다.
  let networkCalls = 0;
  const engine = await createTasteAnalysisEngine({ evidenceClass: 'synthetic_fixture', fetchImpl: (...args) => { networkCalls++; return fetchImpl(...args); } });
  const results = [];
  try {
    await engine.importFoods({ sources: [], foods: cases.flatMap(fixture => fixture.records.map((record, index) => ({ id: `${fixture.id}-food-${index}`, name: record.food ?? `가상 검증 음식 ${index + 1}`, claims: [] }))) });
    for (const fixture of cases) {
      await engine.createUser(fixture.id);
      const routing = [];
      for (const [index, record] of fixture.records.entries()) {
        const id = `${fixture.id}-experience-${index}`;
        const answer = { question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, target: 'whole_dish', phase: 'unspecified', value: record.text };
        const prepared = engine.prepareAnswer(answer);
        routing.push({ record: index, needsAI: prepared.needsAI, unresolvedCount: prepared.unresolved.length, actualModelEvaluated: false });
        await engine.createExperience({ owner: fixture.id, id, mealId: `${fixture.id}-meal-${record.meal ?? index}`, foodId: `${fixture.id}-food-${index}` });
        await engine.saveAnswer(fixture.id, { experienceId: id, mutationId: `${id}-set`, baseRevision: 0, operation: 'set', answerKey: 'review', answer, recordedAt: '2026-09-06T01:00:00.000Z' });
      }
      const report = await engine.analyze(fixture.id);
      report.execution = { actualApiCalls: networkCalls };
      results.push({ id: fixture.id, title: fixture.title, input: fixture.records, expected: fixture.expected, ...checkScenario(fixture, report), routing,
        actual: { coverage: report.coverage, profile: { main: report.profile.main?.id ?? null, wing: report.profile.wing?.id ?? null, status: report.profile.status },
          observations: report.provenance.records.map(({ observationId, experienceId, kind, attribute, value, target, phase, phrase, confirmationStatus }) => ({ observationId, experienceId, kind, attribute, value, target, phase, phrase, confirmationStatus })),
          narrative: report.narrative, narrativePacket: buildNarrativePacket(report.insights) },
        manualReview: { status: 'pending', focus: fixture.review, meaningFaithful: null, useful: null, natural: null, respectsScope: null, notes: null },
      });
    }
  } finally { await engine.close(); }
  const comparisonCases = cases.filter(fixture => fixture.compareGroup === 'same-profile-different-evidence');
  const comparisons = comparisonCases.length === 2 ? (() => {
    const [a, b] = comparisonCases.map(fixture => results.find(result => result.id === fixture.id));
    return [{ cases: [a.id, b.id], sameProfile: JSON.stringify(a.actual.profile) === JSON.stringify(b.actual.profile),
      differentEvidenceAttributes: JSON.stringify(a.actual.narrativePacket.findings.flatMap(finding => finding.evidence.map(item => item.attribute))) !== JSON.stringify(b.actual.narrativePacket.findings.flatMap(finding => finding.evidence.map(item => item.attribute))),
      differentSourceSummaries: JSON.stringify(a.actual.narrative.paragraphs.map(item => item.text)) !== JSON.stringify(b.actual.narrative.paragraphs.map(item => item.text)) }];
  })() : [];
  const comparisonPassed = comparisons.every(item => item.sameProfile && item.differentEvidenceAttributes && item.differentSourceSummaries);
  return { version: 'tba-engine-evaluation/1', fixtureVersion: VALIDATION_CASES_VERSION, fixtureHash: digest(cases), evidenceClass: 'synthetic_fixture', mode: 'offline_contract_evaluation',
    passed: results.every(result => result.passed) && comparisonPassed && networkCalls === 0, actualApiCalls: networkCalls,
    summary: { scenarios: results.length, passedScenarios: results.filter(result => result.passed).length, failedScenarios: results.filter(result => !result.passed).length,
      pendingAIRecords: results.flatMap(result => result.routing).filter(record => record.needsAI).length, manualReviewsCompleted: 0 },
    modelQuality: { status: 'not_run_api_deferred', extractionAccuracy: null, narrativeQuality: null, userProfileFit: null },
    limitations: ['수작업으로 추가한 공개 가상 사례의 계약 검사이며 미공개 홀드아웃이나 실사용자 정확도 평가가 아니다.', '유보 상태 보존의 통과는 미해석 내용의 추출 성공을 뜻하지 않는다.', '개인별 자료와 근거 요약의 차이를 검사하며 모델 설명의 의미·자연스러움을 평가하지 않는다.'],
    comparisons, cases: results };
}

async function main() {
  const args = process.argv.slice(2);
  let output;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--output' && args[index + 1] && !args[index + 1].startsWith('--')) output = resolve(args[++index]);
    else if (args[index] === '--help') { console.log('사용법: node scripts/tba-engine/evaluate.mjs [--output 결과.json] (항상 오프라인)'); return; }
    else throw new Error('UNKNOWN_OR_MISSING_ARGUMENT');
  }
  const report = await evaluateEngine();
  if (output) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 }); }
  console.log(JSON.stringify({ ...(output ? { output } : {}), passed: report.passed, ...report.summary, actualApiCalls: report.actualApiCalls, comparisons: report.comparisons,
    failures: report.cases.filter(result => !result.passed).map(result => ({ id: result.id, checks: result.checks.filter(check => !check.passed) })) }, null, 2));
  if (!report.passed) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('TBA 평가 실행 실패'); process.exitCode = 1; });
