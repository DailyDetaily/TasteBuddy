import { attributeLabel, canonical, confirmed, coverage, digest, evidenceQuotes, groupBy, qualifiedLiking, refs, scope, scopeKey, unique } from './evidence.mjs';

export const SENSORY_UNDERSTANDING_VERSION = 'tba-sensory-understanding/1';
const sensoryKinds = new Set(['sensory_presence', 'sensory_intensity', 'sensory_detail', 'attribute_liking', 'preference_fit']);
const unspecified = record => record.attribute?.endsWith('.unspecified');
const contextKey = record => canonical([record.foodId, record.target, record.phase]);
const evidence = records => ({ observationRefs: refs(records), coverage: coverage(records), scope: scope(records), evidence: evidenceQuotes(records) });
const assertion = record => ({ observationId: record.observationId, value: record.value, quote: record.phrase, confirmationStatus: record.confirmationStatus });

// 감각의 존재·강도·평가·자유 묘사는 각각 보존한다. 알지 못하는 묘사에 선호값을 채우지 않는다.
export function buildSensoryUnderstanding(normalized) {
  const source = normalized.records;
  const direct = source.filter(record => confirmed(record) && sensoryKinds.has(record.kind) && record.attribute);
  const frames = groupBy(direct, record => canonical([scopeKey(record), unspecified(record) ? record.phrase : null])).map(([key, records]) => {
    const first = records[0];
    const levels = records.filter(record => record.kind === 'sensory_intensity');
    const ratings = records.filter(record => record.kind === 'attribute_liking');
    const qualified = ratings.filter(record => qualifiedLiking(record, direct));
    const openDescription = records.some(unspecified);
    return {
      id: `sensory-frame:${digest([normalized.userId, key]).slice(0, 20)}`,
      attribute: first.attribute, reference: first.reference, label: first.reference ?? attributeLabel(first.attribute),
      experienceId: first.experienceId, foodId: first.foodId, foodName: first.foodName, target: first.target, phase: first.phase,
      status: openDescription ? 'description_meaning_unresolved' : 'reported_in_scope',
      sensations: records.filter(record => record.kind === 'sensory_presence').map(assertion),
      intensity: levels.map(assertion),
      intensityStatus: unique(levels.map(record => record.value)).length > 1 ? 'conflicting_reports' : levels.length ? 'reported_level' : 'not_reported',
      descriptions: records.filter(record => record.kind === 'sensory_detail').map(record => ({ ...assertion(record), meaningStatus: unspecified(record) ? 'unresolved' : 'source_description' })),
      liking: ratings.filter(record => !qualified.includes(record) && !openDescription).map(assertion),
      qualifiedLiking: qualified.map(assertion),
      preferredLevel: records.filter(record => record.kind === 'preference_fit').map(assertion),
      ...evidence(records),
      causalExplanation: null,
    };
  });

  const preferences = groupBy(direct.filter(record => record.kind === 'attribute_liking' && !unspecified(record) && !qualifiedLiking(record, direct)),
    record => canonical([record.attribute, record.reference, record.scale])).map(([key, records]) => {
    const positive = records.filter(record => record.value === 'positive');
    const negative = records.filter(record => record.value === 'negative');
    const contexts = groupBy(records, contextKey).map(([id, rows]) => {
      const values = unique(rows.map(record => record.value));
      const meals = coverage(rows).meals;
      return {
        id: `preference-context:${digest([normalized.userId, key, id]).slice(0, 20)}`,
        status: values.length > 1 ? 'mixed_reports_in_context' : meals > 1 ? 'repeated_report_in_context' : 'single_report_in_context',
        values, ...evidence(rows),
      };
    });
    const knownLevels = frames.filter(frame => frame.attribute === records[0].attribute && frame.reference === records[0].reference
      && frame.intensityStatus === 'reported_level' && frame.liking.length && unique(frame.liking.map(item => item.value)).length === 1);
    return {
      id: `sensory-preference:${digest([normalized.userId, key]).slice(0, 20)}`,
      attribute: records[0].attribute, reference: records[0].reference, label: records[0].reference ?? attributeLabel(records[0].attribute),
      status: positive.length && negative.length ? 'context_or_experience_dependent' : coverage(records).meals > 1 ? 'repeated_scoped_report' : 'first_scoped_report',
      positiveRefs: refs(positive), negativeRefs: refs(negative), neutralRefs: refs(records.filter(record => record.value === 'neutral')),
      contexts,
      intensityAssociations: knownLevels.map(frame => ({ frameId: frame.id, reportedIntensity: unique(frame.intensity.map(item => item.value)), liking: unique(frame.liking.map(item => item.value)),
        observationRefs: unique([...frame.intensity, ...frame.liking].map(item => item.observationId)), scope: frame.scope, causalClaim: null })),
      ...evidence(records), predictedLiking: null, optimalIntensity: null, populationConfidence: null,
    };
  });

  const relationships = [];
  // 같은 감각·경험의 부위 또는 시점을 비교한다. 서로 다른 속성의 평가를 상쇄하지 않는다.
  for (const [key, records] of groupBy(direct.filter(record => record.kind === 'attribute_liking' && !unspecified(record)
    && !qualifiedLiking(record, direct)), record => canonical([record.experienceId, record.attribute, record.reference, record.scale]))) {
    const dimensions = ['target', 'phase'].filter(field => unique(records.map(record => record[field])).length > 1);
    if (!dimensions.length || unique(records.map(record => record.value)).length < 2) continue;
    relationships.push({ id: `sensory-relation:${digest([normalized.userId, key]).slice(0, 20)}`, kind: 'within_experience_evaluation_difference',
      attribute: records[0].attribute, dimensions, ...evidence(records), explanation: '명시한 부위·시점에서 서로 다른 평가가 함께 기록되어 있어요.', causalClaim: null });
  }
  for (const record of source.filter(record => confirmed(record) && record.kind === 'combination_liking')) {
    relationships.push({ id: `sensory-relation:${record.observationId}`, kind: 'explicit_combination_evaluation', value: record.value,
      components: record.combinationComponents, ...evidence([record]), explanation: record.phrase, individualComponentPreferences: null, causalClaim: null });
  }

  const unresolved = normalized.unresolvedRecords;
  const excluded = /not_direct_self|unrelated|non_experiential|excluded|irrelevant/u;
  const meaningQuestions = unresolved.filter(record => !excluded.test(record.unresolvedReason ?? '')).map(record => ({
    id: `sensory-question:${record.unresolvedId}`, reason: record.unresolvedReason, optional: true,
    question: `“${record.phrase}”에서 어떤 느낌이나 평가를 뜻했는지 조금 더 알려주실 수 있나요?`,
    phrase: record.phrase, unresolvedRefs: [record.unresolvedId], observationRefs: [], createsEvidence: false,
  }));
  const missingLiking = frames.filter(frame => frame.status !== 'description_meaning_unresolved' && !frame.liking.length && !frame.qualifiedLiking.length
    && !frame.preferredLevel.length && frame.sensations.some(item => item.value === true)).map(frame => ({
    id: `sensory-question:${frame.id}`, reason: 'liking_not_reported', optional: true,
    question: `${frame.foodName}에서 느낀 ${frame.label} 자체는 좋았나요, 아쉬웠나요?`,
    phrase: frame.evidence[0]?.quote ?? '', observationRefs: frame.observationRefs, unresolvedRefs: [], createsEvidence: false,
  }));
  const answerRefs = unique([...source, ...unresolved].flatMap(record => record.sourceAnswerRefs.map(ref => ref.answerId)));
  const unresolvedAnswerRefs = unique(unresolved.filter(record => !excluded.test(record.unresolvedReason ?? '')).flatMap(record => record.sourceAnswerRefs.map(ref => ref.answerId)));
  return {
    version: SENSORY_UNDERSTANDING_VERSION, userId: normalized.userId, evidenceClass: normalized.evidenceClass, evidenceSetHash: normalized.evidenceSetHash,
    frames, preferences, relationships,
    retainedDescriptions: frames.flatMap(frame => frame.descriptions.map(description => ({ frameId: frame.id, attribute: frame.attribute, target: frame.target, phase: frame.phase, ...description }))),
    modelCandidates: source.filter(record => !confirmed(record)).map(record => ({ observationId: record.observationId, kind: record.kind, phrase: record.phrase, status: 'requires_confirmation' })),
    clarificationCandidates: [...meaningQuestions, ...missingLiking],
    processing: { status: unresolvedAnswerRefs.length ? 'partial_meaning_retained' : frames.length ? 'scoped_evidence_available' : 'sensory_evidence_missing',
      sourceAnswerCount: answerRefs.length, unresolvedAnswerCount: unresolvedAnswerRefs.length, excludedSignalCount: unresolved.filter(record => excluded.test(record.unresolvedReason ?? '')).length,
      verifiedSemanticAccuracy: null, meaningComplete: null },
    limits: ['감각 묘사와 감각의 호감을 구분합니다.', '음식·부위·시점의 관찰 범위를 유지하며 물리적 강도나 원인을 추정하지 않습니다.', '분류하지 못한 표현은 원문으로 남으며 같은 의미라고 임의로 합치지 않습니다.'],
  };
}
