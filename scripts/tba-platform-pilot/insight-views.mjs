import { DINING_SELECTION_LABELS } from './dining-selection-catalog.mjs';
import { createHash } from 'node:crypto';
import { validateStoredRuleArtifact } from './experience-evidence.mjs';
import { rawAnswerHash, atomKey, validateSourceSpans, validateStoredAIArtifact } from './ai-extraction.mjs';

export const NORMALIZATION_VERSION = 'tba-evidence-normalization-v3';
export const INSIGHT_RULE_VERSION = 'tba-insight-views-v3';
const compare=(a,b)=>a<b?-1:a>b?1:0;
const unique=values=>[...new Set(values)].sort(compare);
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>compare(a,b))):v);
const clone=value=>JSON.parse(JSON.stringify(value));
const digest=value=>createHash('sha256').update(canonical(value)).digest('hex');
const supportedKinds=['overall_liking','attribute_liking','sensory_detail','sensory_presence','sensory_intensity','preference_fit','combination_liking','unresolved'];
const coverage=records=>({experiences:new Set(records.map(r=>r.experienceId)).size,meals:new Set(records.map(r=>r.mealId)).size,observations:new Set(records.map(r=>r.observationId).filter(Boolean)).size,unresolvedSignals:new Set(records.map(r=>r.unresolvedId).filter(Boolean)).size,independentSamples:null});
const scope=records=>({userIds:unique(records.map(r=>r.userId)),experienceIds:unique(records.map(r=>r.experienceId)),mealIds:unique(records.map(r=>r.mealId)),foodIds:unique(records.map(r=>r.foodId)),targets:unique(records.map(r=>r.target)),phases:unique(records.map(r=>r.phase))});
const groupBy=(records,key)=>{
  const groups=new Map();
  for(const r of records) { const k=key(r); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(r); }
  return [...groups.entries()].sort(([a],[b])=>compare(a,b));
};

// 원문·저장된 추출 artifact를 확인할 뿐 AI를 호출하지 않는다.
function normalizeRow(row,{unresolved=false}={}) {
  if(row.active!==true) throw new Error('ACTIVE_EVIDENCE_REQUIRED');
  const atom=row.payload;
  if(!['synthetic_fixture','user_report'].includes(atom?.evidenceClass)||(!unresolved&&!supportedKinds.includes(atom.kind))) throw new Error('UNSUPPORTED_EVIDENCE');
  if(row.evidence_class!==undefined&&row.evidence_class!==atom.evidenceClass) throw new Error('EVIDENCE_CLASS_MISMATCH');
  if(!row.id||!row.experience_id||!row.meal_id||!row.food_id||!row.answer_id||!row.event_id||!row.original_answer||!Array.isArray(row.source_answers)) throw new Error('MISSING_LINEAGE');
  const sources=new Map(row.source_answers.map(source=>[source?.answerId,source]));
  const anchor=sources.get(row.answer_id);
  if(!anchor||anchor.eventId!==row.event_id||canonical(anchor.originalAnswer)!==canonical(row.original_answer)) throw new Error('SOURCE_ANSWER_MISMATCH');
  if(!atom.sourceAnswerRefs?.length) throw new Error('SOURCE_ANSWER_MISMATCH');
  if(!atom.sourceAnswerRefs.some(ref=>ref.answerId===row.answer_id&&ref.phrase===atom.phrase)) throw new Error('RAW_ANSWER_SCOPE_MISMATCH');
  for(const ref of atom.sourceAnswerRefs) {
    const source=sources.get(ref.answerId);
    if(!source||source.eventId!==ref.eventId) throw new Error('SOURCE_ANSWER_MISMATCH');
    if(source.owner!==row.owner||source.experienceId!==row.experience_id) throw new Error('SOURCE_OWNER_MISMATCH');
    const raw=source.originalAnswer;
    if(ref.question!==raw.question||ref.questionVersion!==raw.questionVersion||ref.choiceVersion!==raw.choiceVersion||source.rawHash!==rawAnswerHash(raw)) throw new Error('RAW_ANSWER_SCOPE_MISMATCH');
    if(validateSourceSpans(raw,{phrase:ref.phrase,sourceSpans:ref.sourceSpans}).length) throw new Error('RAW_ANSWER_SCOPE_MISMATCH');
    const context={owner:row.owner,experienceId:row.experience_id,answerId:source.answerId,eventId:source.eventId,answerKey:source.answerKey,rawHash:source.rawHash};
    const rulesArtifact=source.artifacts.find(artifact=>artifact.origin==='rules');
    if(!rulesArtifact) throw new Error('MISSING_RULE_ARTIFACT');
    const ruleResult=validateStoredRuleArtifact(rulesArtifact.payload,{answer:raw,context});
    if((rulesArtifact.payload.evidenceClass??'synthetic_fixture')!==atom.evidenceClass) throw new Error('EVIDENCE_CLASS_MISMATCH');
    const artifact=source.artifacts.find(artifact=>artifact.id===ref.artifactId);
    if(!artifact||artifact.owner!==row.owner||artifact.experience_id!==row.experience_id||artifact.answer_id!==source.answerId) throw new Error('SOURCE_ARTIFACT_MISMATCH');
    const extracted=artifact.origin==='rules'?ruleResult:validateStoredAIArtifact(artifact.payload,{answer:raw,ruleResult,context});
    const candidates=unresolved?extracted.unresolved:extracted.observations;
    const found=candidates.find(expected=>expected.phrase===ref.phrase&&canonical(expected.sourceSpans)===canonical(ref.sourceSpans)&&(unresolved?expected.reason===atom.reason&&canonical(expected.selectionEvidence??null)===canonical(atom.selectionEvidence??null):atomKey(expected)===atomKey(atom)));
    if(!found) throw new Error('SEMANTIC_MAPPING_MISMATCH');
    if(!unresolved&&ref.confirmationStatus!==found.confirmationStatus) throw new Error('SOURCE_CONFIRMATION_MISMATCH');
    if(ref.extractionMethod!==undefined&&ref.extractionMethod!==artifact.origin) throw new Error('SOURCE_EXTRACTION_METHOD_MISMATCH');
  }
  if(!Number.isFinite(Date.parse(row.recorded_at))) throw new Error('INVALID_RECORDED_AT');
  const methods=unique(atom.sourceAnswerRefs.map(ref=>ref.extractionMethod??(unresolved?'unresolved':'rules')));
  const statuses=unique(atom.sourceAnswerRefs.map(ref=>ref.confirmationStatus??'unresolved'));
  const confirmationStatus=statuses.includes('explicit_user_choice')?'explicit_user_choice':statuses.includes('rule_extracted_statement')?'rule_extracted_statement':statuses.includes('model_extracted_unconfirmed')?'model_extracted_unconfirmed':'unresolved';
  const sourceTimes=atom.sourceAnswerRefs.flatMap(ref=>{const source=sources.get(ref.answerId);const artifact=source?.artifacts.find(item=>item.id===ref.artifactId);return [source?.recordedAt,artifact?.recorded_at].filter(Boolean).map(value=>Date.parse(value));});
  const knownAt=sourceTimes.length&&sourceTimes.every(Number.isFinite)?new Date(Math.max(...sourceTimes)).toISOString():null;
  const context=row.experience_context??{};
  const observedAt=context.observedAt&&Number.isFinite(Date.parse(context.observedAt))?new Date(context.observedAt).toISOString():null;
  const conditionSources=(Array.isArray(context.dishKindIDs)?context.dishKindIDs:[]).map(value=>({dimension:'dishKind',value,sourceField:`experience.context.dishKindIDs:${value}`,labelSnapshot:null}));
  for(const dimension of ['target','phase'])if(atom[dimension]&&atom[dimension]!=='unspecified'){
    let sourceField=unresolved?'unresolved':'answer.value',labelSnapshot=atom.phrase;
    if(atom.selectionEvidence?.type!=='overallEvaluation'&&atom.selectionEvidence){
      const choices=[...sources.values()].flatMap(source=>Array.isArray(source.originalAnswer?.value)?source.originalAnswer.value:[]);
      const e=atom.selectionEvidence,selected=choices.find(c=>c.id===e.selectionID&&c.type===e.type),parent=choices.find(c=>c.type==='bubble'&&c.id===e.relatedBubbleID);
      const selectedSource=selected?.[dimension]===atom[dimension]?selected:parent?.[dimension]===atom[dimension]?parent:null;
      sourceField=selectedSource?`sensorySelections:${selectedSource.type}:${selectedSource.id}:${dimension}`:`sensorySelections:${e.type}:${e.selectionID}:selection`;
      labelSnapshot=selectedSource?DINING_SELECTION_LABELS[dimension]?.[selectedSource[dimension]]??selectedSource[dimension]:e.labelSnapshot;
    }
    conditionSources.push({dimension,value:atom[dimension],sourceField,labelSnapshot});
  }
  if(atom.kind==='sensory_intensity')conditionSources.push({dimension:'intensity',value:atom.value,sourceField:atom.selectionEvidence?`sensorySelections:${atom.selectionEvidence.type}:${atom.selectionEvidence.selectionID}:${atom.selectionEvidence.facet}`:'answer.value',labelSnapshot:atom.selectionEvidence?.labelValue??atom.phrase});
  return {
    ...(unresolved?{unresolvedId:row.id}:{observationId:row.id}),userId:row.owner,experienceId:row.experience_id,mealId:row.meal_id,foodId:row.food_id,foodName:row.food_name,
    evidenceClass:atom.evidenceClass,kind:unresolved?'unresolved':atom.kind,attribute:atom.attribute??null,value:clone(unresolved?atom.phrase:atom.value),scale:unresolved?'unresolved-v1':atom.scale,
    conditionSources,observedAt,knownAt,feedbackCompleted:context.feedbackCompleted===true,dishKindIDs:Array.isArray(context.dishKindIDs)?unique(context.dishKindIDs):[],restaurantID:context.restaurantID??null,menuItemID:context.menuItemID??null,sourceSpans:clone(atom.sourceSpans??[]),
    restaurantName:context.restaurantName??null,target:atom.target,phase:atom.phase,recordedAt:new Date(row.recorded_at).toISOString(),phrase:atom.phrase,reference:atom.reference??null,combinationComponents:clone(atom.combinationComponents??[]),
    ...(atom.selectionEvidence?{selectionEvidence:clone(atom.selectionEvidence)}:{}),
    explicitLiking:!unresolved&&['overall_liking','attribute_liking','combination_liking'].includes(atom.kind)?{kind:atom.kind,value:clone(atom.value),scale:atom.scale,confirmationStatus}:null,
    resolution:unresolved||atom.kind==='unresolved'?'unresolved':confirmationStatus==='model_extracted_unconfirmed'?'model_extracted_unconfirmed':atom.kind==='sensory_detail'&&atom.attribute?.endsWith('.unspecified')?'retained_unclassified_sensory_description':atom.kind==='sensory_detail'?'retained_sensory_description':'explicit_scoped_observation',
    unresolvedReason:unresolved?atom.reason:null,sourceAnswerRefs:clone(atom.sourceAnswerRefs),originalAnswer:clone(row.original_answer),sourceEventId:row.event_id,
    originalAnswers:[...sources.values()].sort((a,b)=>compare(a.answerId,b.answerId)).map(source=>({answerId:source.answerId,eventId:source.eventId,answerKey:source.answerKey,rawHash:source.rawHash,answer:clone(source.originalAnswer)})),
    questionVersion:row.original_answer.questionVersion,choiceVersion:row.original_answer.choiceVersion,extractionMethods:methods,confirmationStatus,
    extractionVersion:atom.extraction??null,normalizationVersion:NORMALIZATION_VERSION
  };
}
export function normalizeEvidence(rows,{unresolvedRows=[],userId=null,evidenceClass='synthetic_fixture'}={}) {
  const owners=unique([...rows,...unresolvedRows].map(row=>row.owner));
  if(owners.some(owner=>typeof owner!=='string'||!owner)) throw new Error('MISSING_OWNER');
  if(owners.length>1) throw new Error('MIXED_USER_EVIDENCE');
  if(userId!==null&&owners.length&&owners[0]!==userId) throw new Error('MIXED_USER_EVIDENCE');
  const deduplicate=(items,unresolved)=>{
    const byId=new Map();
    for(const row of items) {
      const record=normalizeRow(row,{unresolved}),id=record.observationId??record.unresolvedId;
      if(byId.has(id)&&canonical(byId.get(id))!==canonical(record)) throw new Error('CONFLICTING_OBSERVATION_ID');
      byId.set(id,record);
    }
    return [...byId.values()].sort((a,b)=>compare(a.observationId??a.unresolvedId,b.observationId??b.unresolvedId));
  };
  const records=deduplicate(rows,false),unresolvedRecords=deduplicate(unresolvedRows,true);
  const classes=unique([...records,...unresolvedRecords].map(r=>r.evidenceClass));
  if(classes.length>1) throw new Error('MIXED_EVIDENCE_CLASSES');
  return {normalizationVersion:NORMALIZATION_VERSION,userId:owners[0]??userId,evidenceClass:classes[0]??evidenceClass,evidenceSetHash:digest({records,unresolvedRecords}),coverage:coverage([...records,...unresolvedRecords]),records,unresolvedRecords};
}

export function buildInsightViews(normalized) {
  if(normalized.normalizationVersion!==NORMALIZATION_VERSION || digest({records:normalized.records,unresolvedRecords:normalized.unresolvedRecords})!==normalized.evidenceSetHash) throw new Error('NORMALIZED_EVIDENCE_CHANGED');
  const owners=unique([...normalized.records,...normalized.unresolvedRecords].map(record=>record.userId));
  if(owners.length>1 || (owners.length&&owners[0]!==normalized.userId)) throw new Error('NORMALIZED_OWNER_MISMATCH');
  if(!['synthetic_fixture','user_report'].includes(normalized.evidenceClass)||[...normalized.records,...normalized.unresolvedRecords].some(r=>r.evidenceClass!==normalized.evidenceClass)) throw new Error('NORMALIZED_EVIDENCE_CLASS_MISMATCH');
  const records=clone(normalized.records),unresolvedRecords=clone(normalized.unresolvedRecords),allSources=[...records,...unresolvedRecords];
  const wrap=(type,key,rs,content)=>({id:`${type}:${digest([normalized.userId,key]).slice(0,16)}`,type,ruleVersion:INSIGHT_RULE_VERSION,evidenceSetHash:normalized.evidenceSetHash,evidenceClass:normalized.evidenceClass,confirmationStatuses:unique(rs.map(r=>r.confirmationStatus)),observationRefs:unique(rs.map(r=>r.observationId).filter(Boolean)),unresolvedRefs:unique(rs.map(r=>r.unresolvedId).filter(Boolean)),sourceAnswerRefs:[...new Map(rs.flatMap(r=>r.sourceAnswerRefs).map(ref=>[canonical(ref),ref])).values()],scope:scope(rs),coverage:coverage(rs),...content});
  const fact=r=>wrap(r.unresolvedId?'unresolved_source':'scoped_fact',r.observationId??r.unresolvedId,[r],{kind:r.kind,attribute:r.attribute,value:r.value,scale:r.scale,phrase:r.phrase,reference:r.reference,combinationComponents:r.combinationComponents,resolution:r.resolution,confirmationStatus:r.confirmationStatus});
  const experienceSummaries=groupBy(allSources,r=>r.experienceId).map(([id,rs])=>wrap('experience_summary',id,rs,{
    foodName:rs[0].foodName,status:rs.some(r=>r.confirmationStatus==='model_extracted_unconfirmed')?'unconfirmed_extraction_present':rs.some(r=>r.kind==='unresolved'||r.resolution==='retained_unclassified_sensory_description')?'retained_with_unresolved_meaning':'scoped_facts_only',facts:rs.map(fact),
    text:rs.map(r=>r.confirmationStatus==='model_extracted_unconfirmed'?`원문 해석 후보: “${r.phrase}” (${r.kind}, 사용자 확인 전).`:r.kind==='sensory_detail'&&r.attribute?.endsWith('.unspecified')?`감각 영역만 확인된 원문 “${r.phrase}”의 뜻은 미확정입니다.`:r.kind==='sensory_detail'?`감각 세부 원문: “${r.value}”.`:r.kind==='overall_liking'?`음식 전체: ${r.phrase}.`:r.kind==='attribute_liking'?`${r.attribute} 직접 호감: ${r.phrase}.`:r.kind==='unresolved'?`“${r.phrase}”의 뜻은 미확정입니다.`:`“${r.phrase}” 보고 (${r.kind}).`).join(' ')
  }));
  const attributeProfiles=groupBy(records.filter(r=>r.attribute!==null),r=>canonical([r.attribute,r.reference])).map(([profileKey,rs])=>{
    const attribute=rs[0].attribute;
    const liking=rs.filter(r=>r.kind==='attribute_liking');
    return wrap('attribute_profile',profileKey,rs,{attribute,reference:rs[0].reference,status:liking.some(r=>r.confirmationStatus!=='model_extracted_unconfirmed')?'scoped_direct_liking_available':liking.length?'unconfirmed_extraction_available':'preference_unknown',
      sensoryPresence:rs.filter(r=>r.kind==='sensory_presence').map(fact),
      sensoryDetails:rs.filter(r=>r.kind==='sensory_detail').map(fact),
      reportedIntensity:rs.filter(r=>r.kind==='sensory_intensity').map(fact),
      directLiking:liking.map(fact),preferenceFit:rs.filter(r=>r.kind==='preference_fit').map(fact),generalizedPreference:null,
      limits:['보고된 감각과 그 감각의 호감은 별개입니다.','경험 범위를 넘는 개인 선호나 강도 곡선은 추정하지 않습니다.']});
  });
  const contextInsights=[];
  for(const [id,rs] of groupBy(records,r=>r.experienceId)) {
    const overall=rs.filter(r=>r.kind==='overall_liking'),sensory=rs.filter(r=>r.attribute!==null);
    if(overall.length && sensory.length) {
      const direct=sensory.filter(r=>r.kind==='attribute_liking');
      const mixed=direct.some(a=>overall.some(o=>o.value!==a.value));
      contextInsights.push(wrap('evaluation_coexistence',id,[...overall,...sensory],{
        status:mixed?'different_scoped_evaluations':'co_reported_facts',overallEvaluations:overall.map(fact),sensoryObservations:sensory.map(fact),
        text:mixed?'음식 전체 평가와 특정 감각의 직접 호감이 다르게 기록되었습니다. 각각의 평가를 함께 유지합니다.':'음식 전체 평가와 감각 보고가 함께 있습니다. 그 감각 때문에 해당 평가를 했는지는 알 수 없습니다.',causalExplanation:null}));
    }
  }
  for(const [comparisonKey,rs] of groupBy(records.filter(r=>r.attribute!==null),r=>canonical([r.kind,r.attribute,r.scale,r.reference]))) {
    const contexts=groupBy(rs,r=>canonical([r.foodId,r.target,r.phase]));
    if(contexts.length>1) contextInsights.push(wrap('context_comparison',comparisonKey,rs,{
      attribute:rs[0].attribute,reference:rs[0].reference,kind:rs[0].kind,scale:rs[0].scale,status:new Set(rs.map(r=>r.value)).size>1?'reported_context_difference':'same_reported_value_across_contexts',
      comparisonDimensions:['foodId','target','phase'].filter(key=>new Set(rs.map(r=>r[key])).size>1),
      contexts:contexts.map(([key,items])=>wrap('context_facts',key,items,{observedValues:items.map(fact)})),
      text:'음식·대상·시점별 같은 종류·척도의 응답을 나란히 보존합니다. 차이의 원인과 장기 추세는 미확정입니다.',causalExplanation:null,temporalTrend:null
    }));
  }
  const phaseOrder=['first_bite','early_meal','during_meal','late_meal','after_swallow','after_meal','unspecified'];
  const scopedRecords=records.filter(r=>r.kind!=='unresolved');
  const temporalInsights=[];
  for(const [key,rs] of groupBy(scopedRecords,r=>canonical([r.experienceId,r.foodId,r.kind,r.attribute,r.scale,r.target,r.reference]))) {
    const known=rs.filter(r=>r.phase!=='unspecified'),phases=groupBy(known,r=>r.phase);
    if(phases.length>1) temporalInsights.push(wrap('temporal_comparison',key,known,{kind:rs[0].kind,attribute:rs[0].attribute,reference:rs[0].reference,
      status:new Set(known.map(r=>canonical(r.value))).size>1?'different_reported_values_by_phase':'same_reported_value_by_phase',
      phases:phases.sort(([a],[b])=>phaseOrder.indexOf(a)-phaseOrder.indexOf(b)).map(([phase,items])=>wrap('phase_facts',[key,phase],items,{phase,facts:items.map(fact)})),
      phaseOrdering:'display_order_only; after_swallow may occur after any bite',temporalTrend:null,
      text:'한 경험에서 명시한 시점별 응답을 보존합니다. 초반을 첫입으로 바꾸거나 장기 변화로 해석하지 않습니다.'}));
  }
  const targetInsights=[];
  for(const [key,rs] of groupBy(scopedRecords,r=>canonical([r.experienceId,r.kind,r.attribute,r.scale,r.phase,r.reference]))) {
    const targets=groupBy(rs.filter(r=>r.target!=='unspecified'),r=>r.target);
    if(targets.length>1) targetInsights.push(wrap('target_comparison',key,rs,{kind:rs[0].kind,attribute:rs[0].attribute,reference:rs[0].reference,
      targets:targets.map(([target,items])=>wrap('target_facts',[key,target],items,{target,facts:items.map(fact)})),
      text:'소스·튀김옷·속살 등 실제 언급된 대상의 같은 종류·척도 응답을 나란히 봅니다.',causalExplanation:null}));
  }
  const repeatedExperienceInsights=[];
  for(const [key,rs] of groupBy(scopedRecords.filter(r=>['attribute_liking','overall_liking','combination_liking'].includes(r.kind)&&r.confirmationStatus!=='model_extracted_unconfirmed'),r=>canonical([r.foodId,r.kind,r.attribute,r.scale,r.target,r.phase,r.reference,r.kind==='combination_liking'?r.combinationComponents:null]))) {
    if(new Set(rs.map(r=>r.experienceId)).size>1) repeatedExperienceInsights.push(wrap('repeated_experience_comparison',key,rs,{kind:rs[0].kind,attribute:rs[0].attribute,reference:rs[0].reference,
      status:new Set(rs.map(r=>canonical(r.value))).size>1?'different_reports_in_comparable_scope':'repeated_reports_in_comparable_scope',facts:rs.map(fact),
      text:'같은 음식·속성·대상·시점·척도의 여러 경험 기록입니다. 같은 식사의 여러 기록을 독립 식사로 세지 않습니다.',generalizedPreference:null,temporalTrend:null}));
  }
  const combinationInsights=records.filter(r=>r.kind==='combination_liking').map(r=>wrap('combination_report',r.observationId,[r],{
    value:r.value,scale:r.scale,phrase:r.phrase,components:r.combinationComponents,confirmationStatus:r.confirmationStatus,
    componentCoverage:r.combinationComponents.length?'explicit_components_only':'components_unresolved',
    text:'원문에 명시한 조합의 평가입니다. 각 구성 감각을 따로 좋아한다는 뜻으로 나누지 않습니다.',individualComponentPreferences:null}));
  const preferenceFitInsights=records.filter(r=>r.kind==='preference_fit').map(r=>wrap('preference_fit_report',r.observationId,[r],{
    attribute:r.attribute,value:r.value,scale:r.scale,phrase:r.phrase,confirmationStatus:r.confirmationStatus,
    absoluteIntensity:null,preferredOptimum:null,text:'이번 대상·시점에서 표현한 선호 수준과의 관계를 보존합니다. 실제 농도나 개인 최적점을 계산하지 않습니다.'}));
  const clarificationCandidates=[];
  for(const r of allSources.filter(r=>r.kind==='unresolved')) clarificationCandidates.push(wrap('clarify_expression',r.observationId??r.unresolvedId,[r],{
    status:'optional_confirmation',phrase:r.phrase,question:`“${r.phrase}”은 이번 음식의 어떤 느낌을 뜻하나요?`,missing:'resolved_meaning',createsEvidence:false
  }));
  for(const [key,rs] of groupBy(records.filter(r=>r.attribute!==null),r=>canonical([r.experienceId,r.attribute,r.target,r.phase]))) {
    if(!rs.some(r=>r.kind==='attribute_liking')) clarificationCandidates.push(wrap('clarify_attribute_liking',key,rs,{
      status:'optional_confirmation',attribute:rs[0].attribute,question:`이번 음식에서 보고한 ${rs[0].attribute} 느낌 자체는 어땠나요?`,missing:'direct_attribute_liking',createsEvidence:false
    }));
  }
  for(const insight of contextInsights.filter(i=>i.status==='different_scoped_evaluations')) {
    const rs=records.filter(r=>insight.observationRefs.includes(r.observationId));
    clarificationCandidates.push(wrap('clarify_overall_context',insight.id,rs,{status:'optional_confirmation',question:'음식 전체 평가에는 어떤 점이 영향을 주었나요?',missing:'reason_for_overall_evaluation',createsEvidence:false}));
  }
  for(const r of records.filter(r=>r.confirmationStatus==='model_extracted_unconfirmed')) clarificationCandidates.push(wrap('confirm_model_extraction',r.observationId,[r],{status:'optional_confirmation',question:`“${r.phrase}”을 ${r.kind}=${String(r.value)}로 이해한 것이 맞나요?`,missing:'user_confirmation_of_extraction',createsEvidence:false}));
  const groupFeatures=records.filter(r=>r.kind!=='unresolved').map(r=>wrap('group_comparison_feature',r.observationId,[r],{
    role:r.kind==='attribute_liking'?'explicit_attribute_preference':r.kind==='overall_liking'?'whole_food_evaluation':r.kind==='combination_liking'?'combination_evaluation':r.kind==='preference_fit'?'expressed_preference_fit':'reported_sensation_context',
    attribute:r.attribute,kind:r.kind,value:r.value,scale:r.scale,reference:r.reference,combinationComponents:r.combinationComponents,confirmationStatus:r.confirmationStatus,
    preferenceValue:r.kind==='attribute_liking'?r.value:null,missingAttributePreference:r.kind!=='attribute_liking',
    useStatus:r.confirmationStatus==='model_extracted_unconfirmed'?'requires_user_confirmation':'preparation_only',numericVector:null
  }));
  const groupComparisonPreparation=wrap('group_comparison_preparation','current',records,{status:records.length?'prepared_not_matched':'no_evidence',features:groupFeatures,
    actualGroups:null,recommendations:null,similarityScores:null,
    policy:['감각 존재·강도는 선호값이 아닌 관찰 맥락입니다.','결측은 unknown으로 남기며 싫어함이나 0으로 바꾸지 않습니다.','척도·대상·시점이 다른 특징은 직접 평균내지 않습니다.','여러 출력은 동일 근거의 재표현이며 새 경험으로 세지 않습니다.']});
  const outputCounts={experienceSummaries:experienceSummaries.length,attributeProfiles:attributeProfiles.length,contextInsights:contextInsights.length,temporalInsights:temporalInsights.length,targetInsights:targetInsights.length,repeatedExperienceInsights:repeatedExperienceInsights.length,combinationInsights:combinationInsights.length,preferenceFitInsights:preferenceFitInsights.length,clarificationCandidates:clarificationCandidates.length,groupComparisonFeatures:groupFeatures.length};
  return {ruleVersion:INSIGHT_RULE_VERSION,userId:normalized.userId,evidenceClass:normalized.evidenceClass,evidenceSetHash:normalized.evidenceSetHash,coverage:coverage(allSources),outputCounts,totalOutputs:Object.values(outputCounts).reduce((a,b)=>a+b,0),
    experienceSummaries,attributeProfiles,contextInsights,temporalInsights,targetInsights,repeatedExperienceInsights,combinationInsights,preferenceFitInsights,clarificationCandidates,groupComparisonPreparation,
    outputCountingPolicy:'Top-level view items plus group features; nested facts are not additional evidence or independent samples',
    availability:{crossContextComparisons:contextInsights.some(i=>i.type==='context_comparison')?'observed_contexts_available':'insufficient_comparable_contexts',generalizedAttributePreference:'not_estimated',similarTasteGroups:'not_computed',restaurantAndMenuRecommendations:'not_computed'},
    unsupported:['generalized_personal_preference','personality','causal_explanations','preference_probability','long_term_trend','actual_similar_taste_groups','restaurant_or_menu_recommendations']};
}
