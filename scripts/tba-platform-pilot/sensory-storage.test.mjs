import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createExperiencePilot, FIXTURE_TIME, fixtureAnswer, ruleResultFor, validateStoredRuleArtifact } from './experience-evidence.mjs';
import { AI_RESPONSE_SCHEMA, rawAnswerHash, validateAIProposal } from './ai-extraction.mjs';
import { buildInsightViews, normalizeEvidence } from './insight-views.mjs';
import { LEXICON_VERSION, parseByRules } from './rules.mjs';
import { parseByRules as parseByRulesV3 } from './rules-v3.mjs';
import { parseByRules as parseByRulesV4 } from './rules-v4.mjs';

const food={id:'sensory-storage-food',name:'감각 저장 테스트 음식',claims:[]};
const v2=value=>({question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value});
const event=(experienceId,mutationId,baseRevision,answer,answerKey)=>({experienceId,mutationId,baseRevision,operation:'set',answerKey,recordedAt:FIXTURE_TIME,answer});
const span=(text,quote=text)=>{const start=text.indexOf(quote);return {start,end:start+quote.length,quote};};

test('v4 artifact replay retains its version while new intensity negation uses v5',()=>{
  const answer=v2('단맛이 강하지 않았어요.');
  const context={owner:'u',experienceId:'meal',answerId:'answer',eventId:'event',answerKey:'note'};
  const source={answerId:context.answerId,eventId:context.eventId,answerKey:context.answerKey};
  const result=ruleResultFor(answer,source,{evidenceClass:'user_report',parser:parseByRulesV4});
  const artifact={...context,evidenceClass:'user_report',rawHash:rawAnswerHash(answer),result};
  assert.equal(result.versions.rules,'tba-rules/4');
  assert.deepEqual(validateStoredRuleArtifact(artifact,{answer,context}),result);
  const current=parseByRules(answer);
  assert.equal(current.versions.rules,'tba-rules/5');
  assert.equal(current.observations.some(atom=>atom.kind==='sensory_presence'),false);
  assert.throws(()=>validateStoredRuleArtifact({...artifact,result:{...result,versions:current.versions}},
    {answer,context}),/RULE_ARTIFACT_MAPPING_MISMATCH/);
});

test('AI sensory_detail 계약은 원문 detail만 받고 미분류 의미를 unresolved로 유지한다',()=>{
  const text='바삭한 식감보다 촉촉한 식감이 좋았어요.';
  const answer=v2(text),ruleResult=parseByRules(answer),context={owner:'u',experienceId:'e',answerKey:'review',answerId:'a',eventId:'event',rawHash:rawAnswerHash(answer)};
  const candidate={kind:'sensory_detail',attribute:'texture.moist',value:'촉촉한 식감',scale:'sensory-detail-v1',target:'whole_dish',phase:'unspecified',phrase:text,reference:null,combinationComponents:[],sourceSpans:[span(text),span(text,'촉촉한 식감')]};
  const valid=validateAIProposal({observations:[candidate],unresolved:[]},{answer,ruleResult,context});
  assert.equal(AI_RESPONSE_SCHEMA.properties.observations.items.properties.kind.enum.includes('sensory_detail'),true);
  assert.equal(valid.observations.length,1);assert.equal(valid.observations[0].confirmationStatus,'model_extracted_unconfirmed');
  assert.deepEqual(valid.rejections,[]);

  const invented=validateAIProposal({observations:[{...candidate,value:'크리미한 식감'}],unresolved:[]},{answer,ruleResult,context});
  assert.equal(invented.observations.length,0);assert.ok(invented.rejections.includes('INVALID_DETAIL_VALUE'));assert.ok(invented.unresolved.length);
  const unknown=validateAIProposal({observations:[{...candidate,kind:'future_sensory_kind',scale:'future-v1'}],unresolved:[]},{answer,ruleResult,context});
  assert.equal(unknown.observations.length,0);assert.ok(unknown.rejections.includes('UNKNOWN_KIND'));

  const vagueText='향이 코끝에서 둥글게 퍼졌어요.',vagueAnswer=v2(vagueText),vagueContext={...context,rawHash:rawAnswerHash(vagueAnswer)};
  const vagueCandidate={...candidate,attribute:'aroma.unspecified',value:vagueText,phrase:vagueText,sourceSpans:[span(vagueText)]};
  const vague=validateAIProposal({observations:[vagueCandidate],unresolved:[]},{answer:vagueAnswer,ruleResult:parseByRules(vagueAnswer),context:vagueContext});
  assert.equal(vague.observations.length,0,'같은 의미를 이미 보존한 규칙 atom은 AI 중복으로 만들지 않는다');
  assert.ok(vague.unresolved.some(item=>item.reason==='unclassified_sensory_description'));
});

test('sensory_detail 저장은 원문·조건·unresolved를 보존하고 수정·삭제·재시도·디스크 재개에 수렴한다',async()=>{
  const root=await mkdtemp(join(tmpdir(),'tba-sensory-storage-'));
  const dataDir=join(root,'db');
  let pilot=await createExperiencePilot({dataDir,evidenceClass:'user_report'});
  try {
    await pilot.importFoods({sources:[],foods:[food]});await pilot.createUser('u');
    await pilot.createExperience({owner:'u',id:'baseline',mealId:'baseline-meal',foodId:food.id});
    await pilot.mutate('u',event('baseline','baseline-1',0,fixtureAnswer('sensory',['바삭한']),'legacy'));
    const baselineBefore=(await pilot.currentEvidenceRows('u')).filter(row=>row.experience_id==='baseline');

    await pilot.createExperience({owner:'u',id:'detail',mealId:'detail-meal',foodId:food.id});
    const first=event('detail','detail-1',0,v2('씹을수록 촉촉했습니다.'),'detail-a');
    assert.deepEqual(await pilot.mutate('u',first),await pilot.mutate('u',first));
    await pilot.mutate('u',event('detail','detail-2',1,v2('씹을수록 촉촉했습니다.'),'detail-b'));
    await pilot.mutate('u',event('detail','detail-3',2,v2('향이 코끝에서 둥글게 퍼졌어요.'),'aroma-detail'));

    let snapshot=await pilot.currentEvidenceSnapshot('u');
    let normalized=normalizeEvidence(snapshot.rows,{unresolvedRows:snapshot.unresolvedRows,userId:'u',evidenceClass:'user_report'});
    let typed=normalized.records.filter(record=>record.experienceId==='detail'&&record.kind==='sensory_detail'&&record.attribute==='texture.moist');
    assert.equal(typed.length,1);assert.equal(typed[0].sourceAnswerRefs.length,2);assert.equal(typed[0].resolution,'retained_sensory_description');
    const vague=normalized.records.find(record=>record.experienceId==='detail'&&record.attribute==='aroma.unspecified');
    assert.equal(vague.value,'향이 코끝에서 둥글게 퍼졌어요.');assert.equal(vague.resolution,'retained_unclassified_sensory_description');assert.equal(vague.explicitLiking,null);
    assert.ok(normalized.unresolvedRecords.some(record=>record.experienceId==='detail'&&record.unresolvedReason==='unclassified_sensory_description'));
    const views=buildInsightViews(normalized),summary=views.experienceSummaries.find(item=>item.scope.experienceIds.includes('detail'));
    assert.equal(summary.status,'retained_with_unresolved_meaning');assert.ok(summary.facts.some(fact=>fact.resolution==='retained_unclassified_sensory_description'));

    const unknownRow={...snapshot.rows.find(row=>row.experience_id==='detail'),payload:{...snapshot.rows.find(row=>row.experience_id==='detail').payload,kind:'future_sensory_kind'}};
    assert.throws(()=>normalizeEvidence([unknownRow],{userId:'u',evidenceClass:'user_report'}),/UNSUPPORTED_EVIDENCE/);

    await pilot.mutate('u',event('detail','detail-4',3,v2('삼킨 뒤 촉촉했습니다.'),'detail-a'));
    const changedSnapshot=await pilot.currentEvidenceSnapshot('u');
    const changedNormalized=normalizeEvidence(changedSnapshot.rows,{unresolvedRows:changedSnapshot.unresolvedRows,userId:'u',evidenceClass:'user_report'});
    assert.deepEqual(changedNormalized.records.filter(record=>record.experienceId==='detail'&&record.kind==='sensory_detail'&&record.attribute==='texture.moist').map(record=>record.value).sort(),['삼킨 뒤 촉촉했습니다.','씹을수록 촉촉했습니다.']);
    await pilot.mutate('u',{experienceId:'detail',mutationId:'detail-5',baseRevision:4,operation:'remove',answerKey:'detail-b',recordedAt:FIXTURE_TIME});
    snapshot=await pilot.currentEvidenceSnapshot('u');
    normalized=normalizeEvidence(snapshot.rows,{unresolvedRows:snapshot.unresolvedRows,userId:'u',evidenceClass:'user_report'});
    typed=normalized.records.filter(record=>record.experienceId==='detail'&&record.kind==='sensory_detail'&&record.attribute==='texture.moist');
    assert.deepEqual(typed.map(record=>[record.value,record.phase]),[['삼킨 뒤 촉촉했습니다.','after_swallow']]);
    const baselineAfter=snapshot.rows.filter(row=>row.experience_id==='baseline');assert.deepEqual(baselineAfter,baselineBefore);

    await pilot.createExperience({owner:'u',id:'deleted',mealId:'deleted-meal',foodId:food.id});
    await pilot.mutate('u',event('deleted','deleted-1',0,v2('온도가 혀에서 천천히 올라왔어요.'),'temperature-detail'));
    await pilot.mutate('u',{experienceId:'deleted',mutationId:'deleted-2',baseRevision:1,operation:'delete',recordedAt:FIXTURE_TIME});
    assert.equal((await pilot.currentEvidenceSnapshot('u')).rows.some(row=>row.experience_id==='deleted'),false);

    const beforeClose=await pilot.currentEvidenceSnapshot('u');await pilot.close();pilot=null;
    pilot=await createExperiencePilot({dataDir,evidenceClass:'user_report'});
    assert.deepEqual(await pilot.currentEvidenceSnapshot('u'),beforeClose);
  } finally {await pilot?.close();await rm(root,{recursive:true,force:true});}
});

test('디스크의 legacy v1과 rules/3 artifact는 원문 재처리 없이 각 저장 버전으로 검증한다',async()=>{
  const root=await mkdtemp(join(tmpdir(),'tba-rule-version-')),dataDir=join(root,'db');
  let pilot=await createExperiencePilot({dataDir,evidenceClass:'user_report'});
  try {
    await pilot.importFoods({sources:[],foods:[food]});await pilot.createUser('u');
    await pilot.createExperience({owner:'u',id:'legacy',mealId:'legacy-meal',foodId:food.id});
    await pilot.mutate('u',event('legacy','legacy-1',0,fixtureAnswer('sensory',['바삭한']),'legacy'));
    await pilot.createExperience({owner:'u',id:'v3',mealId:'v3-meal',foodId:food.id});
    const oldAnswer=v2('단맛이 좋았습니다.');await pilot.mutate('u',event('v3','v3-1',0,oldAnswer,'review'));
    const answerRow=(await pilot.db.query("SELECT * FROM answers WHERE experience_id='v3' AND answer_key='review' AND active")).rows[0];
    const context={owner:'u',experienceId:'v3',answerId:answerRow.id,eventId:answerRow.event_id,answerKey:'review'};
    const oldResult=ruleResultFor(oldAnswer,{answerId:context.answerId,eventId:context.eventId,answerKey:context.answerKey},{evidenceClass:'user_report',parser:parseByRulesV3});
    const oldArtifact={origin:'rules',...context,evidenceClass:'user_report',rawHash:rawAnswerHash(oldAnswer),result:oldResult};
    await pilot.db.query("UPDATE extraction_artifacts SET payload=$1 WHERE answer_id=$2 AND origin='rules'",[oldArtifact,answerRow.id]);
    await pilot.mutate('u',event('v3','v3-2',1,fixtureAnswer('overall','좋았어요'),'overall'));
    let oldRows=(await pilot.currentEvidenceRows('u')).filter(row=>row.answer_id===answerRow.id);
    assert.deepEqual(oldRows.map(row=>[row.payload.kind,row.payload.attribute,row.payload.extraction]),[['sensory_presence','taste.sweet','tba-rules/3']]);

    await pilot.close();pilot=null;pilot=await createExperiencePilot({dataDir,evidenceClass:'user_report'});
    const reopened=await pilot.currentEvidenceSnapshot('u');
    oldRows=reopened.rows.filter(row=>row.answer_id===answerRow.id);
    assert.deepEqual(oldRows.map(row=>row.payload.kind),['sensory_presence']);
    assert.ok(reopened.rows.some(row=>row.experience_id==='legacy'&&row.payload.extraction==='reviewed_choice_mapping_v1'));

    const artifactRow=(await pilot.db.query("SELECT id,payload FROM extraction_artifacts WHERE answer_id=$1 AND origin='rules'",[answerRow.id])).rows[0];
    const unsupported={...artifactRow.payload,result:{...artifactRow.payload.result,versions:{lexicon:'tba-semantic-lexicon/2',rules:'tba-rules/999'}}};
    await pilot.db.query('UPDATE extraction_artifacts SET payload=$1 WHERE id=$2',[unsupported,artifactRow.id]);
    const invalidSnapshot=await pilot.currentEvidenceSnapshot('u');
    assert.throws(()=>normalizeEvidence(invalidSnapshot.rows,{unresolvedRows:invalidSnapshot.unresolvedRows,userId:'u',evidenceClass:'user_report'}),/UNKNOWN_RULE_ARTIFACT_VERSION/);
  } finally {await pilot?.close();await rm(root,{recursive:true,force:true});}
});
