import { createHash } from 'node:crypto';
import { buildFitPatterns, buildOverallPatterns, sameSelection, scopedRatings, FIT_VALUES } from './personal-taste-insights.mjs';
import { assessQuestion, questionPrecedes } from './personal-taste-questions.mjs';

export const PERSONAL_TASTE_MODEL_VERSION = 'tba-personal-taste-model/2';
export const PERSONAL_TASTE_POLICY = Object.freeze({minMeals:3,minConditionMeals:3,maxConditionDimensions:2});
const sorted=values=>[...new Set(values)].sort();
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a<b?-1:a>b?1:0)):x);
const identifier=(type,parts)=>`${type}:${createHash('sha256').update(canonical(parts)).digest('hex').slice(0,20)}`;
const confirmed=r=>['explicit_user_choice','rule_extracted_statement'].includes(r.confirmationStatus);
const own=(r,key,fallback)=>r[key]??fallback;
const semanticScope=r=>canonical([r.experienceId,r.attribute,r.reference??null,r.target??'unspecified',r.phase??'unspecified']);
const attributeKey=r=>canonical([r.attribute,r.reference??null]);
const outcomeValues=['positive','neutral','negative'];
const conditionLabel=c=>({target:{sauce:'소스',surface:'겉',inside:'속',whole_dish:'음식 전체',broth:'국물'},phase:{first_bite:'첫입',early_meal:'초반',during_meal:'먹는 동안',late_meal:'나중',after_swallow:'삼킨 뒤',after_meal:'식사 후'},intensity:{weak:'약한 강도',medium:'중간 강도',strong:'강한 강도'}}[c.dimension]?.[c.value]??c.value);
const labelFor=r=>r.reference??r.attributeLabel??({'taste.sweet':'단맛','taste.sour':'산미','taste.salty':'짠맛','taste.bitter':'쓴맛','taste.umami':'감칠맛','texture.crisp':'바삭함','texture.soft':'부드러운 식감','aroma.roasted':'구운 향'}[r.attribute]??r.attribute);
function vote(units){
 const groups=new Map();for(const u of units)groups.set(u.mealID,[...(groups.get(u.mealID)??[]),u]);
 const meals=[...groups].sort(([a],[b])=>a<b?-1:1).map(([mealID,rows])=>{const values=sorted(rows.map(r=>r.liking));return {mealID,value:values.length===1?values[0]:'mixed'};});
 const distribution={positive:0,neutral:0,negative:0,mixed:0,mealCount:meals.length};for(const m of meals)distribution[m.value]++;
 return {meals,distribution};
}
function leader(distribution){const maximum=Math.max(...outcomeValues.map(k=>distribution[k]));const winners=outcomeValues.filter(k=>distribution[k]===maximum);return maximum>0&&winners.length===1?winners[0]:null;}
function matches(unit,conditions){return conditions.every(c=>c.dimension==='dishKind'?unit.dishKindIDs.includes(c.value):unit[c.dimension]===c.value);}
function conditionList(unit){return ['target','phase','intensity'].flatMap(d=>unit[d]&&unit[d]!=='unspecified'?[{dimension:d,value:unit[d]}]:[]).concat(unit.dishKindIDs.map(value=>({dimension:'dishKind',value})));}
function sourceEvidence(rows){return [...new Map(rows.map(r=>[r.observationId,{id:r.observationId,mealID:r.mealId??r.experienceId,phrase:r.phrase??'',sourceSpans:r.sourceSpans??r.sourceAnswerRefs?.flatMap(ref=>ref.sourceSpans??[])??[],selectionEvidence:r.selectionEvidence??null,conditionSources:r.conditionSources??[]}])).values()].sort((a,b)=>a.id<b.id?-1:1);}

/** 사용자별 직접 평가의 명시 조건을 비교한다. 분포는 관측 식사 수이며 개인 미래 확률이 아니다. */
export function buildPersonalTasteModel(normalized,{asOf=null,policy:inputPolicy={},suppressedQuestionIDs=[],_assessQuestions=true,_includeEvidence=true}={}){
 const policy={...PERSONAL_TASTE_POLICY,...inputPolicy};
 if(!Number.isInteger(policy.minMeals)||policy.minMeals<2||!Number.isInteger(policy.minConditionMeals)||policy.minConditionMeals<2||policy.maxConditionDimensions!==2)throw new Error('INVALID_PERSONAL_TASTE_POLICY');
 const userID=normalized.userId??normalized.userID??'';
 const cutoff=asOf===null?null:Date.parse(asOf);if(cutoff!==null&&!Number.isFinite(cutoff))throw new Error('INVALID_PERSONAL_TASTE_CUTOFF');
 const excludedEvidence=[];const included=[];let missingKnownAtCount=0;
 const groupsByID=new Map();for(const r of normalized.records??[])groupsByID.set(r.observationId,[...(groupsByID.get(r.observationId)??[]),r]);
 for(const [id,duplicates] of [...groupsByID].sort(([a],[b])=>a<b?-1:1)){
  const r=duplicates[0];let reason=null;
  if(duplicates.length>1&&duplicates.some(x=>canonical(x)!==canonical(r)))reason='conflicting_record_identity';
  else if(r.userId!==userID)reason='different_user';
  else if(!userID||typeof id!=='string'||!id||!r.experienceId||!(r.mealId??r.experienceId))reason='missing_record_identity';
  const observedAt=Object.hasOwn(r,'observedAt')?r.observedAt:r.recordedAt??null,knownAt=r.knownAt??null;
  if(knownAt===null)missingKnownAtCount++;
  if(!reason&&cutoff!==null){if(observedAt===null||!Number.isFinite(Date.parse(observedAt)))reason='observed_time_unknown';else if(knownAt===null||!Number.isFinite(Date.parse(knownAt)))reason='known_time_unknown';else if(Date.parse(observedAt)>cutoff||Date.parse(knownAt)>cutoff)reason='after_cutoff';}
  if(!reason&&!confirmed(r))reason='unconfirmed';
  if(reason){excludedEvidence.push({id,reason});continue;}
  included.push({...r,mealId:r.mealId??r.experienceId,target:r.target??'unspecified',phase:r.phase??'unspecified',observedAt,knownAt,dishKindIDs:sorted(r.dishKindIDs??[])});
 }
 const scopeGroups=new Map();for(const r of included){const key=semanticScope(r);scopeGroups.set(key,[...(scopeGroups.get(key)??[]),r]);}
 const ratingGroups=new Map();
 for(const r of included.filter(r=>r.kind==='attribute_liking')){
  let reason=null;if(!r.attribute||r.attribute.endsWith('.unspecified'))reason='unknown_attribute';
  else if(!outcomeValues.includes(r.value)||r.scale!=='attribute-three-category-v1')reason='unsupported_liking';
  else if((scopeGroups.get(semanticScope(r))??[]).some(other=>other.kind==='sensory_presence'&&other.value===false&&sameSelection(other,r)))reason='absence_qualified';
  if(reason){excludedEvidence.push({id:r.observationId,reason});continue;}
  const intensityRows=(scopeGroups.get(semanticScope(r))??[]).filter(other=>other.kind==='sensory_intensity'&&other.scale==='expression-strength-v1'&&sameSelection(other,r));
  const levels=sorted(intensityRows.map(other=>other.value));
  const intensity=levels.length===1&&['weak','medium','strong'].includes(levels[0])?levels[0]:null;
  const key=canonical([userID,r.mealId,r.attribute,r.reference??null,r.target,r.phase,intensity,r.dishKindIDs]);
  ratingGroups.set(key,[...(ratingGroups.get(key)??[]),{...r,intensity,intensityRows,intensityConflict:levels.length>1}]);
 }
 const units=[...ratingGroups].sort(([a],[b])=>a<b?-1:1).map(([key,rows])=>{
  const r=rows[0],values=sorted(rows.map(x=>x.value));return {id:identifier('unit',[key]),mealID:r.mealId,experienceIDs:sorted(rows.map(x=>x.experienceId)),attribute:r.attribute,reference:r.reference??null,label:labelFor(r),target:r.target,phase:r.phase,intensity:r.intensity,dishKindIDs:r.dishKindIDs,liking:values.length===1?values[0]:'mixed',intensityConflict:rows.some(x=>x.intensityConflict),evidenceIDs:_includeEvidence?sorted(rows.flatMap(x=>[x.observationId,...x.intensityRows.map(i=>i.observationId)])):[],evidence:_includeEvidence?sourceEvidence(rows.flatMap(x=>[x,...x.intensityRows])):[]};
 });
 const attributes=new Map();for(const u of units)attributes.set(attributeKey(u),[...(attributes.get(attributeKey(u))??[]),u]);
 const candidates=[];
 for(const [key,attributeUnits] of [...attributes].sort(([a],[b])=>a<b?-1:1)){
  const base=vote(attributeUnits);const conditionSets=new Map([['[]',[]]]),seenConditions=new Set();
  for(const u of attributeUnits){const available=conditionList(u),signature=canonical(available);if(seenConditions.has(signature))continue;seenConditions.add(signature);available.sort((a,b)=>canonical(a)<canonical(b)?-1:1);for(const c of available)conditionSets.set(canonical([c]),[c]);for(let i=0;i<available.length;i++)for(let j=i+1;j<available.length;j++)if(available[i].dimension!==available[j].dimension){const pair=[available[i],available[j]];conditionSets.set(canonical(pair),pair);}}
  for(const [conditionKey,conditions] of [...conditionSets].sort(([a],[b])=>a<b?-1:1)){
   const selected=attributeUnits.filter(u=>matches(u,conditions)), {meals,distribution}=vote(selected),rawDirection=leader(distribution);
   const opposite=rawDirection==='positive'?'negative':rawDirection==='negative'?'positive':null;
   const counterMealIDs=opposite?meals.filter(m=>m.value===opposite).map(m=>m.mealID):rawDirection==='neutral'?meals.filter(m=>['positive','negative'].includes(m.value)).map(m=>m.mealID):[];
   const minimum=conditions.length?policy.minConditionMeals:policy.minMeals;
   let unchangedCount=0;for(const meal of meals){const reduced={...distribution,[meal.value]:distribution[meal.value]-1,mealCount:distribution.mealCount-1};if(rawDirection!==null&&leader(reduced)===rawDirection)unchangedCount++;}
   const stable=meals.length>1&&unchangedCount===meals.length;
   const abstainReasons=[];
   if(meals.length<minimum)abstainReasons.push(conditions.length?'condition_needs_repeated_meals':'needs_independent_meals');
   if(distribution.mixed)abstainReasons.push('conflicting_reports_in_meal');
   if(rawDirection===null)abstainReasons.push('no_unique_direction');
   if(counterMealIDs.length)abstainReasons.push('counter_evidence_present');
   if(!stable)abstainReasons.push('leave_one_meal_out_unstable');
   if(conditions.some(c=>c.dimension==='intensity')&&selected.some(u=>u.intensityConflict))abstainReasons.push('intensity_conflict');
   const direction=abstainReasons.length?null:rawDirection;
   const status=direction?'repeated_direction':distribution.mixed||counterMealIDs.length||rawDirection===null?'mixed':meals.length<minimum?(conditions.length?'insufficient_context':'first_signal'):'unstable';
   const first=selected[0],conditionText=conditions.map(conditionLabel).join(' · ');
   candidates.push({id:identifier('candidate',[userID,key,conditionKey]),attribute:first.attribute,reference:first.reference,label:first.label,conditions,
    title:conditions.length?`${first.label}, ${conditionText}에서 남긴 평가`:`${first.label}에 남긴 평가`,
    body:direction?`${meals.length}번의 식사에서 ${direction==='positive'?'호감':direction==='negative'?'아쉬움':'중립'} 방향이 반복됐어요. 관찰한 조건의 기록이며 원인을 뜻하지 않아요.`:`${meals.length}번의 식사를 비교했어요. 반례나 부족한 조건을 확인하며 판단을 유보해요.`,
    status,direction,distribution,baselineDistribution:base.distribution,supportMealIDs:rawDirection?meals.filter(m=>m.value===rawDirection).map(m=>m.mealID):[],counterMealIDs,neutralMealIDs:meals.filter(m=>m.value==='neutral').map(m=>m.mealID),mixedMealIDs:meals.filter(m=>m.value==='mixed').map(m=>m.mealID),evidenceIDs:sorted(selected.flatMap(u=>u.evidenceIDs)),evidence:[...new Map(selected.flatMap(u=>u.evidence).map(e=>[e.id,e])).values()].sort((a,b)=>a.id<b.id?-1:1),abstainReasons,stability:{evaluatedMealCount:meals.length,unchangedCount,stable},contrastsWithBaseline:direction!==null&&leader(base.distribution)!==direction,
   });
  }
 }
 candidates.sort((a,b)=>a.id<b.id?-1:1);
 const fitPatterns=buildFitPatterns(included,userID,policy,{includeEvidence:_includeEvidence});
 const overallPatterns=buildOverallPatterns(included,userID,{includeEvidence:_includeEvidence});
 const overallAssociations=[];
 for(const u of (_includeEvidence?units:[])){const overall=included.filter(r=>r.kind==='overall_liking'&&u.experienceIDs.includes(r.experienceId)&&r.scale==='overall-five-category-v1');if(overall.length)overallAssociations.push({unitID:u.id,mealID:u.mealID,attribute:u.attribute,individualValue:u.liking,overallValues:sorted(overall.map(r=>r.value)),evidenceIDs:sorted([...u.evidenceIDs,...overall.map(r=>r.observationId)]),causalClaim:null});}
 const snapshot=nextSelection=>({version:PERSONAL_TASTE_MODEL_VERSION,userID,policy,units,candidates,fitPatterns,overallPatterns,nextSelection,overallAssociations,excludedEvidence:excludedEvidence.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:a.reason<b.reason?-1:1),temporalValidity:{mode:asOf===null?'current_snapshot':'historical_as_of',asOf,missingKnownAtCount,historicalReconstruction:false},limits:['분포는 기록한 식사 수이며 미래 호감 확률이 아니에요.','조건별 차이는 연관이며 원인을 확정하지 않아요.','전체 평가는 개별 감각의 평가를 바꾸지 않아요.','과거 수정 이력이 없는 기록은 과거 상태로 복원하지 않아요.']});
 if(!_assessQuestions)return snapshot(null);
 const questions=[];
 const sensory=included.filter(r=>r.attribute&&!r.attribute.endsWith('.unspecified')&&r.kind==='sensory_presence'&&r.value===true);
 for(const r of sensory){if(included.some(x=>x.kind==='attribute_liking'&&semanticScope(x)===semanticScope(r)&&sameSelection(x,r)))continue;questions.push({attribute:r.attribute,reference:r.reference??null,label:labelFor(r),facet:'liking',reason:'liking_not_reported',score:100,evidenceIDs:[r.observationId],mealIDs:[r.mealId],target:r.target,phase:r.phase});}
 for(const u of units){for(const [facet,missing,score] of [['intensity',u.intensity===null,70],['target',u.target==='unspecified',60],['phase',u.phase==='unspecified',50]]){if(!missing)continue;const unstable=candidates.some(c=>c.attribute===u.attribute&&c.reference===u.reference&&c.status==='mixed');questions.push({attribute:u.attribute,reference:u.reference,label:u.label,facet,reason:unstable?'unstable_context_comparison':`${facet}_not_reported`,score:unstable?90:score,evidenceIDs:u.evidenceIDs,mealIDs:[u.mealID],target:u.target,phase:u.phase});}}
 for(const r of scopedRatings(included,'preference_fit','preference-fit-v1',FIT_VALUES)){
  for(const [facet,missing,score] of [['intensity',r.intensity===null,70],['target',r.target==='unspecified',60],['phase',r.phase==='unspecified',50]]){
   if(!missing)continue;
   const unstable=fitPatterns.some(p=>p.attribute===r.attribute&&p.reference===(r.reference??null)&&p.status==='mixed_fit');
   questions.push({attribute:r.attribute,reference:r.reference??null,label:labelFor(r),facet,reason:unstable?'unstable_context_comparison':`${facet}_not_reported`,score:unstable?90:score,evidenceIDs:r.evidenceRows.map(row=>row.observationId),mealIDs:[r.mealId],target:r.target,phase:r.phase});
  }
 }
 for(const [key,rows] of attributes){
  const known=sorted(rows.map(u=>u.intensity).filter(Boolean));if(!known.some(level=>vote(rows.filter(u=>u.intensity===level)).distribution.mealCount>=policy.minConditionMeals))continue;
  const proposed=['weak','medium','strong'].find(value=>!known.includes(value));if(!proposed)continue;
  const first=rows[0];questions.push({attribute:first.attribute,reference:first.reference,label:first.label,facet:'intensity',reason:'unobserved_intensity_comparison',score:10,evidenceIDs:sorted(rows.flatMap(u=>u.evidenceIDs)),mealIDs:sorted(rows.map(u=>u.mealID)),target:'unspecified',phase:'unspecified',intent:'exploration',proposedCondition:{dimension:'intensity',value:proposed}});
 }
 const questionGroups=new Map();for(const q of questions){const key=canonical([q.attribute,q.reference,q.facet,q.target,q.phase,q.intent??'clarification',q.proposedCondition??null]);const previous=questionGroups.get(key);questionGroups.set(key,previous?{...previous,score:Math.max(previous.score,q.score),evidenceIDs:sorted([...previous.evidenceIDs,...q.evidenceIDs]),mealIDs:sorted([...previous.mealIDs,...q.mealIDs])}:q);}
 const suppressedIDs=new Set(suppressedQuestionIDs), baselines=new Map();
 const ranked=[...questionGroups].filter(([key])=>!suppressedIDs.has(identifier('next-selection',[userID,key]))).map(([key,q])=>{
  const attribute=canonical([q.attribute,q.reference]);
  if(!baselines.has(attribute)){
   const attributeRecords=included.filter(r=>attributeKey(r)===attribute);
   const experiences=new Set(attributeRecords.map(r=>r.experienceId));
   const records=[...attributeRecords,...included.filter(r=>r.kind==='overall_liking'&&experiences.has(r.experienceId))];
   const project=records=>buildPersonalTasteModel({userId:userID,records},{policy,_assessQuestions:false,_includeEvidence:false});
   const sameAttribute=row=>canonical([row.attribute,row.reference])===attribute;
   baselines.set(attribute,{records,project,model:{policy,candidates:candidates.filter(sameAttribute),fitPatterns:fitPatterns.filter(sameAttribute),overallPatterns:overallPatterns.filter(sameAttribute)}});
  }
  const baseline=baselines.get(attribute);
  return [key,assessQuestion({...q,key,intent:q.intent??'clarification'},baseline.records,baseline.project,baseline.model)];
 }).sort(([,a],[,b])=>questionPrecedes(a,b)?-1:1);
 const suppressed=new Set(suppressedQuestionIDs);const chosen=ranked.find(([key])=>!suppressed.has(identifier('next-selection',[userID,key])));const nextSelection=chosen?{id:identifier('next-selection',[userID,chosen[0]]),attribute:chosen[1].attribute,label:chosen[1].label,facet:chosen[1].facet,question:chosen[1].intent==='exploration'?`다음 식사에서 ${conditionLabel(chosen[1].proposedCondition)}로 느낀 ${chosen[1].label}는 어떤지 확인해 볼까요?`:({liking:`${chosen[1].label} 자체는 어땠나요?`,intensity:`${chosen[1].label}는 어느 정도로 느껴졌나요?`,target:`${chosen[1].label}는 어느 부분에서 느껴졌나요?`,phase:`${chosen[1].label}는 언제 느껴졌나요?`}[chosen[1].facet]),reason:chosen[1].reason,evidenceIDs:sorted(chosen[1].evidenceIDs),mealIDs:sorted(chosen[1].mealIDs),createsEvidence:false,intent:chosen[1].intent??'clarification',proposedCondition:chosen[1].proposedCondition??null,unobserved:chosen[1].intent==='exploration'}:null;
 if(nextSelection){nextSelection.responseSourceID=chosen[1].responseSourceID??null;nextSelection.impact=chosen[1].impact??null;}
 return snapshot(nextSelection);
}

export function predictPersonalTaste(model,query){
 const explicit=['target','phase','intensity'].flatMap(d=>query[d]&&query[d]!=='unspecified'?[{dimension:d,value:query[d]}]:[]).concat((query.dishKindIDs??[]).map(value=>({dimension:'dishKind',value})));
 const units=model.units.filter(u=>u.attribute===query.attribute&&u.reference===(query.reference??null)&&matches(u,explicit));
 const exact=vote(units), minimum=explicit.length?model.policy.minConditionMeals:model.policy.minMeals;
 const failure=reason=>({direction:null,candidateID:null,status:'abstained',abstainReasons:[reason],evidenceIDs:sorted(units.flatMap(u=>u.evidenceIDs))});
 if(!units.length)return failure('unobserved_attribute_or_conditions');
 if(exact.distribution.mealCount<minimum)return failure('query_conditions_need_repeated_meals');
 if(exact.distribution.mixed||exact.distribution.positive&&exact.distribution.negative)return failure('query_condition_counter_evidence');
 const exactDirection=leader(exact.distribution);
 if(exactDirection==='neutral'&&(exact.distribution.positive||exact.distribution.negative))return failure('query_condition_counter_evidence');
 if(exactDirection===null||exact.meals.some(meal=>leader({...exact.distribution,[meal.value]:exact.distribution[meal.value]-1,mealCount:exact.distribution.mealCount-1})!==exactDirection))return failure('query_leave_one_meal_out_unstable');
 const candidates=model.candidates.filter(c=>c.attribute===query.attribute&&c.reference===(query.reference??null)&&c.conditions.every(condition=>condition.dimension==='dishKind'?(query.dishKindIDs??[]).includes(condition.value):query[condition.dimension]===condition.value));
 const deepest=Math.max(-1,...candidates.map(c=>c.conditions.length));const mostSpecific=candidates.filter(c=>c.conditions.length===deepest);
 const supported=mostSpecific.filter(c=>c.direction!==null);if(!supported.length)return failure('specific_condition_abstained');
 const directions=sorted(supported.map(c=>c.direction));
 if(directions.length===1&&directions[0]===leader(exact.distribution)){supported.sort((a,b)=>b.distribution.mealCount-a.distribution.mealCount||(a.id<b.id?-1:1));const c=supported[0];return {direction:c.direction,candidateID:c.id,status:'observed_condition_direction',abstainReasons:[],evidenceIDs:sorted(units.flatMap(u=>u.evidenceIDs))};}
 return failure(directions.length>1?'conflicting_matching_conditions':'no_supported_condition');
}

/** 평가 대상 식사 전체를 제외하고, 그 식사 직전까지 알려진 자료만 학습한다. */
export function evaluatePersonalTasteModelTimeline(records,{userId,policy={},minimumTrainingMeals=3}={}){
 const meals=new Map();for(const r of records)meals.set(r.mealId??r.experienceId,[...(meals.get(r.mealId??r.experienceId)??[]),r]);
 const results=[];
 for(const [mealID,heldout] of [...meals].sort(([a,ra],[b,rb])=>Date.parse(ra[0].observedAt)-Date.parse(rb[0].observedAt)||(a<b?-1:1))){
  const time=Math.min(...heldout.map(r=>Date.parse(r.observedAt)));if(!Number.isFinite(time))continue;
  const training=records.filter(r=>(r.mealId??r.experienceId)!==mealID&&Date.parse(r.observedAt)<time&&r.knownAt&&Date.parse(r.knownAt)<time);
  if(new Set(training.map(r=>r.mealId??r.experienceId)).size<minimumTrainingMeals)continue;
  const model=buildPersonalTasteModel({userId,records:training},{asOf:new Date(time-1).toISOString(),policy,_assessQuestions:false});
  const ground=buildPersonalTasteModel({userId,records:heldout},{policy,_assessQuestions:false});
  for(const unit of ground.units){if(unit.liking==='mixed')continue;const query={attribute:unit.attribute,reference:unit.reference,target:unit.target,phase:unit.phase,intensity:unit.intensity,dishKindIDs:unit.dishKindIDs};const prediction=predictPersonalTaste(model,query);const baseline=model.candidates.find(c=>c.attribute===unit.attribute&&c.reference===unit.reference&&!c.conditions.length);results.push({mealID,attribute:unit.attribute,expected:unit.liking,predicted:prediction.direction,baseline:baseline?leader(baseline.distribution):null,trainingMealIDs:sorted(training.map(r=>r.mealId??r.experienceId))});}
 }
 const metric=field=>{const answered=results.filter(r=>r[field]!==null),correct=answered.filter(r=>r[field]===r.expected).length;return {total:results.length,answered:answered.length,correct,incorrect:answered.length-correct,coverage:results.length?answered.length/results.length:null,accuracy:answered.length?correct/answered.length:null};};
 return {version:'tba-personal-timeline-evaluation/1',evidenceClass:'synthetic_fixture',model:metric('predicted'),baseline:metric('baseline'),results};
}
