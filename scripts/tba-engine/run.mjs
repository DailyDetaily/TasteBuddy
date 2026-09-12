import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTasteAnalysisEngine } from './index.mjs';
import { LEXICON_VERSION } from '../tba-platform-pilot/rules.mjs';

export async function analyzeInput(input, { aiConfig = {}, narrate = false, fetchImpl = globalThis.fetch } = {}) {
  if (!input || !['user_report', 'synthetic_fixture'].includes(input.evidenceClass)
    || typeof input.userId !== 'string' || !input.userId.trim() || !Array.isArray(input.foods) || !Array.isArray(input.experiences)) throw new Error('INVALID_INPUT_CONTRACT');
  const engine = await createTasteAnalysisEngine({ evidenceClass: input.evidenceClass, aiConfig, fetchImpl });
  const extractionRuns = [];
  try {
    await engine.importFoods({ sources: [], foods: input.foods.map(food => ({ id: food.id, name: food.name, claims: [] })) });
    await engine.createUser(input.userId);
    for (const experience of input.experiences) {
      if (!Array.isArray(experience.answers) || !Number.isFinite(Date.parse(experience.recordedAt))) throw new Error('INVALID_EXPERIENCE_INPUT');
      await engine.createExperience({ owner: input.userId, id: experience.id, foodId: experience.foodId, mealId: experience.mealId, observedAt: experience.observedAt ?? null, dishKindIDs: experience.dishKindIDs ?? [], restaurantID: experience.restaurantID ?? null, menuItemID: experience.menuItemID ?? null });
      let revision = 0;
      const keys = new Set();
      for (const raw of experience.answers) {
        const { answerKey = raw.question, ...fields } = raw;
        if (keys.has(answerKey)) throw new Error('DUPLICATE_ANSWER_KEY');
        keys.add(answerKey);
        const answer = { questionVersion: '2', choiceVersion: LEXICON_VERSION, target: 'whole_dish', phase: 'unspecified', ...fields };
        const event = {
          experienceId: experience.id, mutationId: `${experience.id}:${revision}`, baseRevision: revision,
          operation: 'set', answerKey, answer, recordedAt: experience.recordedAt,
        };
        const saved = await engine.mutate(input.userId, event);
        revision = saved.revision;
        if (engine.prepareAnswer(answer).needsAI) {
          const result = await engine.processAnswerAI(input.userId, { experienceId: experience.id, answerKey, baseRevision: revision }, { recordedAt: experience.recordedAt });
          extractionRuns.push({ experienceId: experience.id, answerKey, status: result.status, calls: result.artifact.attempts, usage: result.usage });
        }
      }
    }
    const report = await engine.analyze(input.userId, { narrate });
    return {
      ...report,
      execution: { inputClass: input.evidenceClass, extractionRuns, actualApiCalls: extractionRuns.reduce((sum, run) => sum + run.calls, 0) + report.narrative.generation.actualApiCalls },
    };
  } finally { await engine.close(); }
}

export function summarizeReport(report) {
  return {
    version: report.version, evidenceClass: report.evidenceClass, userId: report.userId,
    evidenceSetHash: report.evidenceSetHash, coverage: report.coverage, versions: report.versions,
    profile: report.profile,
    sensoryUnderstanding: report.sensoryUnderstanding,
    insights: report.insights.highlights.map(({ evidence, ...finding }) => ({
      ...finding, evidence: evidence.map(({ sourceAnswerRefs, ...source }) => source),
    })),
    narrative: report.narrative,
    followUp: report.insights.followUp,
    unresolved: report.provenance.unresolvedRecords.map(({ unresolvedId, phrase, foodName, unresolvedReason }) => ({ unresolvedId, phrase, foodName, unresolvedReason })),
    limits: report.limits, execution: report.execution,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (['--live', '--full', '--help'].includes(args[i])) options[args[i].slice(2)] = true;
    else if (['--input', '--output'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) options[args[i].slice(2)] = args[++i];
    else throw new Error('UNKNOWN_OR_MISSING_ARGUMENT');
  }
  if (options.help) {
    console.log('사용법: node scripts/tba-engine/run.mjs [--input 입력.json] [--output 결과.json] [--full] [--live]');
    console.log('기본 입력은 가상 기록입니다. --live는 OPENAI_API_KEY를 사용해 실제 모델 추출·서술을 요청합니다.');
    return;
  }
  if (options.live && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY_REQUIRED_FOR_LIVE');
  const inputPath = options.input ? resolve(options.input) : new URL('./example-input.json', import.meta.url);
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  const report = await analyzeInput(input, {
    narrate: Boolean(options.live),
    aiConfig: options.live ? { apiKey: process.env.OPENAI_API_KEY, ...(process.env.TBA_AI_MODEL ? { model: process.env.TBA_AI_MODEL } : {}), budget: { limit: 20, attempts: 0 } } : {},
  });
  const output = JSON.stringify(options.full ? report : summarizeReport(report), null, 2) + '\n';
  if (options.output) {
    const path = resolve(options.output);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, output, { mode: 0o600 });
    console.log(JSON.stringify({ output: path, profile: report.profile.label, coverage: report.coverage, findings: report.insights.findings.length, actualApiCalls: report.execution.actualApiCalls }, null, 2));
  } else process.stdout.write(output);
  if (options.live && report.narrative.source !== 'model') process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    const code = /^[A-Z_]+$/.test(error.message) ? error.message : 'ENGINE_EXECUTION_FAILED';
    console.error(`TBA 실행 실패: ${code}`);
    process.exitCode = 1;
  });
}
