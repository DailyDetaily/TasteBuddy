import catalog from '../constants/preferenceIntakeCatalog.json' with { type: 'json' };

export const PREFERENCE_INTAKE_EVIDENCE_VERSION = 'tba-preference-intake/1';
export const PREFERENCE_INTAKE_MEANINGS = {
  allergies: ['self_reported_food_restriction', '피해야 할 재료'],
  dietaryRestrictions: ['dietary_practice', '식사 원칙'],
  preferredCuisineTypes: ['cuisine_preference', '편안하게 즐기는 요리'],
  avoidedSignals: ['stated_avoidance', '자주 피하는 요소'],
  flavorIntensityPreference: ['preferred_flavor_intensity', '편안한 풍미 강도'],
  explorationStyle: ['exploration_preference', '새로운 음식에 대한 선호'],
  sharePreferenceWithRestaurant: ['sharing_preference', '정보 공유에 대한 선호'],
};
const questions = new Map(catalog.questions.map(question => [question.id, question]));
const nonempty = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 2000;
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const idsFor = value => Array.isArray(value) ? value : value == null ? [] : [value];

function validSelection(question, ids) {
  return ids.every(id => question.options.some(option => option.id === id))
    && new Set(ids).size === ids.length
    && (question.selectionMode !== 'single' || ids.length <= 1)
    && ids.length <= (question.maxSelections ?? question.options.length)
    && (!question.noneOptionId || !ids.includes(question.noneOptionId) || ids.length === 1);
}

/** Copies the question and chosen wording before any legacy profile sanitization. */
export function createPreferenceIntakeSubmission(responses, {
  id = globalThis.crypto.randomUUID(), userID = 'local-owner', recordedAt = new Date().toISOString(),
  knownAt = recordedAt, platform = 'web',
} = {}) {
  const submission = {
    schemaVersion: PREFERENCE_INTAKE_EVIDENCE_VERSION, instrumentVersion: catalog.version,
    id, userID, recordedAt, knownAt, source: { kind: 'preference_intake', platform },
    responses: catalog.questions.map(question => {
      const ids = idsFor(responses[question.id]);
      if (!validSelection(question, ids)) throw new Error('선택한 응답을 다시 확인해 주세요.');
      return {
        questionID: question.id, questionText: question.title, questionDescription: question.description,
        state: ids.length ? 'answered' : 'unanswered',
        selectedOptions: ids.map(id => ({ ...question.options.find(option => option.id === id) })),
      };
    }),
  };
  if (!isPreferenceIntakeSubmission(submission)) throw new Error('응답의 출처와 저장 시점을 확인하지 못했어요.');
  return submission;
}

export function isPreferenceIntakeSubmission(value) {
  if (!value || value.schemaVersion !== PREFERENCE_INTAKE_EVIDENCE_VERSION || value.instrumentVersion !== catalog.version
    || !nonempty(value.id) || !nonempty(value.userID) || !validTime(value.recordedAt) || !validTime(value.knownAt)
    || Date.parse(value.knownAt) < Date.parse(value.recordedAt)
    || value.source?.kind !== 'preference_intake' || !['web', 'ios', 'android'].includes(value.source?.platform)
    || !Array.isArray(value.responses) || value.responses.length !== questions.size) return false;
  const seen = new Set();
  return value.responses.every(response => {
    const question = questions.get(response?.questionID);
    if (!question || seen.has(question.id) || response.questionText !== question.title || response.questionDescription !== question.description
      || !Array.isArray(response.selectedOptions)) return false;
    seen.add(question.id);
    return response.selectedOptions.every(option => option && question.options.some(known => known.id === option.id && known.label === option.label && known.description === option.description))
      && validSelection(question, response.selectedOptions.map(option => option.id))
      && response.state === (response.selectedOptions.length ? 'answered' : 'unanswered');
  });
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** A self-report channel. It never produces sensory observations, meal votes, or sharing consent. */
export function buildPreferenceIntakeEvidence(submissions = [], { userID = 'local-owner', asOf = null } = {}) {
  const result = {
    version: PREFERENCE_INTAKE_EVIDENCE_VERSION, source: 'self_report', submissionID: null, recordedAt: null,
    answeredQuestionCount: 0, records: [], excludedSubmissions: [],
    limits: ['직접 알려준 선호이며 실제 식사에서 확인한 반응과 구분해요.',
      '풍미 강도 선호를 개별 맛의 감각 강도나 민감도로 바꾸지 않아요.',
      '피해야 할 재료에 대한 자기 보고이며 의학적 진단을 뜻하지 않아요.',
      '공유 선호를 기록해도 정보가 전송되거나 공유 권한이 생기지 않아요.'],
  };
  const cutoff = asOf == null ? Infinity : Date.parse(asOf);
  if (!userID || Number.isNaN(cutoff)) return result;
  const groups = new Map();
  for (const submission of Array.isArray(submissions) ? submissions : []) {
    const id = submission?.id ?? 'unknown';
    groups.set(id, [...(groups.get(id) ?? []), submission]);
  }
  const valid = [];
  for (const [id, copies] of groups) {
    const submission = copies[0];
    let reason = null;
    if (copies.some(copy => canonical(copy) !== canonical(submission))) reason = 'conflicting_submission_identity';
    else if (!isPreferenceIntakeSubmission(submission)) reason = 'invalid_submission';
    else if (submission.userID !== userID) reason = 'different_user';
    else if (Date.parse(submission.recordedAt) > cutoff || Date.parse(submission.knownAt) > cutoff) reason = 'after_cutoff';
    if (reason) result.excludedSubmissions.push({ id, reason });
    else valid.push(submission);
  }
  valid.sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || Date.parse(a.knownAt) - Date.parse(b.knownAt) || a.id.localeCompare(b.id));
  const latest = valid.at(-1);
  if (!latest) return result;
  result.submissionID = latest.id;
  result.recordedAt = latest.recordedAt;
  result.records = catalog.questions.map(question => {
    const response = latest.responses.find(row => row.questionID === question.id);
    const [kind, label] = PREFERENCE_INTAKE_MEANINGS[question.id];
    const state = response.state === 'unanswered' ? 'unanswered'
      : response.selectedOptions.some(option => option.id === question.noneOptionId) ? 'declared_none' : 'answered';
    return { ...response, id: `${latest.id}:${question.id}`, sourceSubmissionID: latest.id, kind, label, state,
      recordedAt: latest.recordedAt, knownAt: latest.knownAt,
      summary: state === 'unanswered' ? '아직 답하지 않았어요' : response.selectedOptions.map(option => option.label).join(' · ') };
  });
  result.answeredQuestionCount = result.records.filter(row => row.state !== 'unanswered').length;
  return result;
}

/** Missing legacy values remain unanswered; sanitized [] cannot establish a historical 'none' answer. */
export function preferenceIntakeResponsesFromEvidence(submissions, userID = 'local-owner') {
  const evidence = buildPreferenceIntakeEvidence(submissions, { userID });
  if (!evidence.submissionID) return null;
  return Object.fromEntries(evidence.records.map(record => [record.questionID,
    questions.get(record.questionID).selectionMode === 'single' ? record.selectedOptions[0]?.id ?? null : record.selectedOptions.map(option => option.id)]));
}
