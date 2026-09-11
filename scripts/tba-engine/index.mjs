import { buildPersonalTasteModel } from './personal-taste-model.mjs';
import { buildTastePerception } from '../../src/lib/tastePerception.mjs';
import { buildPreferenceIntakeEvidence } from '../../src/lib/preferenceIntakeEvidence.mjs';
import { digest, coverage as modelCoverage } from './evidence.mjs';
import { createExperiencePilot } from '../tba-platform-pilot/experience-evidence.mjs';
import { normalizeEvidence, buildInsightViews } from '../tba-platform-pilot/insight-views.mjs';
import { parseByRules, LEXICON_VERSION, RULE_VERSION } from '../tba-platform-pilot/rules.mjs';
import { buildPalateProfile, PALATE_STYLES } from './palate-profile.mjs';
import { buildPersonalInsights } from './personal-insights.mjs';
import { extractiveNarrative, generateNarrative } from './narrative.mjs';
import { buildSensoryUnderstanding } from './sensory-understanding.mjs';

export const ENGINE_VERSION = 'tba-personal-engine/3';
export { PALATE_STYLES };

export function analyzeEvidence(rows, { unresolvedRows = [], userId = null, evidenceClass = 'user_report', policy = {}, personalModelPolicy = {}, asOf = null, suppressedQuestionIDs = [], preferenceSubmissions = [] } = {}) {
  let normalized = normalizeEvidence(rows, { unresolvedRows, userId, evidenceClass });
  const personalModel = buildPersonalTasteModel(normalized, {asOf,policy:personalModelPolicy,suppressedQuestionIDs});
  if(asOf!==null){
    const cutoff=Date.parse(asOf);const visible=record=>record.observedAt&&record.knownAt&&Date.parse(record.observedAt)<=cutoff&&Date.parse(record.knownAt)<=cutoff;
    const records=normalized.records.filter(visible),unresolvedRecords=normalized.unresolvedRecords.filter(visible);
    normalized={...normalized,records,unresolvedRecords,coverage:{...modelCoverage(records),unresolvedSignals:unresolvedRecords.length},evidenceSetHash:digest({records,unresolvedRecords})};
  }
  const views = buildInsightViews(normalized);
  const profile = buildPalateProfile(normalized, { policy });
  const insights = buildPersonalInsights(normalized);
  const sensoryUnderstanding = buildSensoryUnderstanding(normalized);
  const statedPreferences = buildPreferenceIntakeEvidence(preferenceSubmissions, { userID: normalized.userId, asOf });
  return {
    version: ENGINE_VERSION, userId: normalized.userId, evidenceClass: normalized.evidenceClass,
    evidenceSetHash: normalized.evidenceSetHash, coverage: normalized.coverage,
    versions: { personalModel: personalModel.version, rules: RULE_VERSION, lexicon: LEXICON_VERSION, profile: profile.version, insights: insights.version, sensoryUnderstanding: sensoryUnderstanding.version },
    personalModel, statedPreferences, perception: buildTastePerception(normalized.records, { asOf, userID: normalized.userId }), profile, insights, sensoryUnderstanding, narrative: extractiveNarrative(insights), views,
    provenance: normalized,
    limits: { populationValidated: false, classificationProbability: null, groups: 'out_of_scope', recommendations: 'out_of_scope' },
  };
}

// 신뢰된 서버/로컬 호출자를 위한 엔진이다. owner는 호출 애플리케이션이 인증한 사용자로 전달한다.
// 네트워크 인증·앱 연결은 이 라이브러리의 범위에 포함하지 않는다.
export async function createTasteAnalysisEngine({
  dataDir, evidenceClass = 'user_report', aiConfig = {}, narrativeConfig = {}, fetchImpl = globalThis.fetch, policy = {}, personalModelPolicy = {},
} = {}) {
  const store = await createExperiencePilot({ dataDir, evidenceClass, aiConfig, aiFetch: fetchImpl });
  const narrativeCaches = new Map();
  let closed = false;
  const ensureOpen = () => { if (closed) throw new Error('ENGINE_CLOSED'); };
  const invalidate = owner => narrativeCaches.delete(owner);
  const snapshot = async (owner, options = {}) => {
    ensureOpen();
    const source = await store.currentEvidenceSnapshot(owner);
    return analyzeEvidence(source.rows, { ...source, policy, personalModelPolicy, ...options });
  };
  const engine = {
    version: ENGINE_VERSION,
    prepareAnswer: answer => parseByRules(answer),
    async importFoods(bundle) { ensureOpen(); return store.importFoods(bundle); },
    async createUser(owner) { ensureOpen(); return store.createUser(owner); },
    async createExperience(input) { ensureOpen(); return store.createExperience(input); },
    async mutate(owner, event) {
      ensureOpen();
      const result = await store.mutate(owner, event);
      invalidate(owner);
      return result;
    },
    async processAnswerAI(owner, input, options = {}) {
      ensureOpen();
      const result = await store.processAnswerAI(owner, input, options);
      if (result.applied) invalidate(owner);
      return result;
    },
    async saveAnswer(owner, event, { resolveAI = true } = {}) {
      if (event.operation !== 'set') throw new Error('SET_ANSWER_REQUIRED');
      const saved = await engine.mutate(owner, event);
      const parsed = parseByRules(event.answer);
      let extraction = { status: parsed.needsAI ? 'awaiting_extraction' : 'rules_complete', applied: false };
      if (resolveAI && parsed.needsAI) {
        try {
          extraction = await engine.processAnswerAI(owner, {
            experienceId: event.experienceId, answerKey: event.answerKey ?? event.answer.answerKey ?? event.answer.question,
            baseRevision: saved.revision,
          });
        } catch (error) {
          // 원문 저장 성공을 비동기 추출 실패로 되돌리지 않는다.
          extraction = { status: ['STALE_ANALYSIS', 'STALE_ANSWER_ANALYSIS', 'EXPERIENCE_DELETED'].includes(error.message)
            ? 'stale_discarded' : 'extraction_failed', applied: false };
        }
      }
      return { ...saved, extraction, analysis: await engine.analyze(owner) };
    },
    async analyze(owner, { narrate = false, asOf = null, suppressedQuestionIDs = [], preferenceSubmissions = [] } = {}) {
      const analysis = await snapshot(owner, {asOf,suppressedQuestionIDs,preferenceSubmissions});
      if (!narrate) return analysis;
      if (!narrativeCaches.has(owner)) narrativeCaches.set(owner, new Map());
      const cache = narrativeCaches.get(owner);
      const narrative = await generateNarrative(analysis.insights, {
        config: { ...aiConfig, ...narrativeConfig }, fetchImpl, cache,
      });
      ensureOpen();
      const current = await snapshot(owner, {asOf,suppressedQuestionIDs,preferenceSubmissions});
      if (current.evidenceSetHash !== analysis.evidenceSetHash) {
        invalidate(owner);
        current.narrative.status = 'stale_generation_discarded';
        current.narrative.discardedGeneration = narrative.generation;
        return current;
      }
      return { ...current, narrative };
    },
    async close() {
      if (closed) return;
      closed = true;
      narrativeCaches.clear();
      await store.close();
    },
  };
  return engine;
}
