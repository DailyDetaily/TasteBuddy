import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { normalizeEvidence, buildInsightViews } from './insight-views.mjs';
import { LEXICON_VERSION, RULE_VERSION, parseByRules } from './rules.mjs';
import { buildFoodEvidencePilot } from './food-evidence.mjs';
import { createExperiencePilot, fixtureAnswer, FIXTURE_TIME } from './experience-evidence.mjs';

async function runExpandedScenario(p) {
  const owner='synthetic-user-v2',actions=[],revisions=new Map();let mockCalls=0;
  const lexicon=JSON.parse(await readFile(new URL('./semantic-lexicon.json',import.meta.url),'utf8'));
  const choice=label=>{const entry=lexicon.entries.find(item=>item.label===label);if(!entry)throw new Error(`MISSING_FIXTURE_LABEL:${label}`);return {id:entry.id,label:entry.label};};
  const answer=(question,value,extra={})=>({question,questionVersion:'2',choiceVersion:LEXICON_VERSION,value,...extra});
  await p.createUser(owner);
  async function create(id,foodId,mealId=id) {await p.createExperience({owner,id,mealId,foodId});revisions.set(id,0);}
  async function set(id,answerKey,a) {
    const revision=revisions.get(id),mutationId=`${id}:input:${revision}`;
    const result=await p.mutate(owner,{experienceId:id,mutationId,baseRevision:revision,operation:'set',answerKey,recordedAt:FIXTURE_TIME,answer:a});
    revisions.set(id,result.revision);actions.push({experienceId:id,answerKey,operation:'set',revision:result.revision,needsAI:parseByRules(a).needsAI});
  }
  async function remove(id,answerKey,operation='remove') {
    const revision=revisions.get(id),result=await p.mutate(owner,{experienceId:id,mutationId:`${id}:${operation}:${revision}`,baseRevision:revision,operation,answerKey,recordedAt:FIXTURE_TIME});
    revisions.set(id,result.revision);actions.push({experienceId:id,answerKey,operation,revision:result.revision});
  }
  async function offlineAI(id,answerKey,proposal) {
    const result=await p.processAnswerAI(owner,{experienceId:id,answerKey,baseRevision:revisions.get(id)},{recordedAt:'2026-09-06T12:05:00Z',config:{apiKey:'explicit-offline-fixture-token',provider:'offline_fixture'},fetchImpl:async()=>{mockCalls++;return {ok:true,status:200,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(proposal)}]}],usage:{input_tokens:0,output_tokens:0,total_tokens:0}})};}});
    assert.equal(result.artifact.provider,'offline_fixture');assert.deepEqual(result.artifact.rejections,[]);
    actions.push({experienceId:id,answerKey,operation:'offline_ai_fixture',status:result.status,actualApiCalls:0});
  }
  const scales={sensory_presence:'presence-v1',attribute_liking:'attribute-three-category-v1',combination_liking:'combination-three-category-v1'};
  const span=(raw,quote)=>{const start=raw.indexOf(quote);assert.ok(start>=0);return {start,end:start+quote.length,quote};};
  const atom=(raw,kind,attribute,value,target,phase,phrase,support=[],components=[])=>({kind,attribute,value,scale:scales[kind],target,phase,phrase,reference:null,combinationComponents:components,sourceSpans:[span(raw,phrase),...support.map(quote=>span(raw,quote))]});
  await create('v2-fries','korean-food:7472924a4379','v2-meal-1');
  await set('v2-fries','overall',answer('overall','좋았어요'));
  await set('v2-fries','coating-presence',answer('sensory',[choice('바삭한')],{target:'coating',phase:'first_bite'}));
  await set('v2-fries','coating-presence',answer('sensory',[choice('바삭한'),choice('바삭한')],{target:'coating',phase:'first_bite'}));
  await set('v2-fries','coating-first',answer('attribute_liking','좋았어요',{attribute:'texture.crisp',target:'coating',phase:'first_bite'}));
  await set('v2-fries','coating-late',answer('attribute_liking','아쉬웠어요',{attribute:'texture.crisp',target:'coating',phase:'late_meal'}));
  await set('v2-fries','inside-first',answer('attribute_liking','괜찮았어요',{attribute:'texture.crisp',target:'inside',phase:'first_bite'}));
  await set('v2-fries','sauce-fit',answer('free_text','소스의 단맛이 너무 강해요.'));
  const combination='소스의 단맛과 튀김옷의 바삭함이 함께 있어서 좋았어요.';
  await set('v2-fries','combination',answer('free_text',combination));
  const components=[{attribute:'taste.sweet',target:'sauce',reference:null,sourceSpans:[span(combination,'소스의 단맛')]},{attribute:'texture.crisp',target:'coating',reference:null,sourceSpans:[span(combination,'튀김옷의 바삭함')]}];
  await offlineAI('v2-fries','combination',{observations:[atom(combination,'sensory_presence','taste.sweet',true,'sauce','unspecified','소스의 단맛'),atom(combination,'sensory_presence','texture.crisp',true,'coating','unspecified','튀김옷의 바삭함'),atom(combination,'combination_liking',null,'positive','combination','unspecified',combination,[],components)],unresolved:[]});
  await create('v2-fries-repeat','korean-food:7472924a4379','v2-meal-2');
  await set('v2-fries-repeat','coating-first',answer('attribute_liking','좋았어요',{attribute:'texture.crisp',target:'coating',phase:'first_bite'}));
  await create('v2-bulgogi','native-food:91511','v2-meal-3');
  await set('v2-bulgogi','overall',answer('overall','아쉬웠어요'));
  const timeText='불향은 처음엔 좋았는데 나중에는 그 향이 부담스러웠어요.';
  await set('v2-bulgogi','review',answer('free_text',timeText));
  await offlineAI('v2-bulgogi','review',{observations:[atom(timeText,'sensory_presence','aroma.smoky',true,'whole_dish','early_meal','불향은 처음엔 좋았는데'),atom(timeText,'attribute_liking','aroma.smoky','positive','whole_dish','early_meal','불향은 처음엔 좋았는데'),atom(timeText,'sensory_presence','aroma.smoky',true,'whole_dish','late_meal','나중에는 그 향이 부담스러웠어요.',['불향']),atom(timeText,'attribute_liking','aroma.smoky','negative','whole_dish','late_meal','나중에는 그 향이 부담스러웠어요.',['불향'])],unresolved:[]});
  await set('v2-bulgogi','late-confirmation',answer('attribute_liking','아쉬웠어요',{attribute:'aroma.smoky',target:'whole_dish',phase:'late_meal'}));
  await create('v2-salmon','korean-food:50e0ec477973','v2-meal-4');
  await set('v2-salmon','sensory',answer('sensory',[choice('촉촉한'),choice('깔끔한')],{target:'flesh'}));
  await set('v2-salmon','aroma-butter',answer('free_text','버터 같은 향이 느껴져요.'));
  await set('v2-salmon','aroma-peach',answer('free_text','복숭아 같은 향이 느껴져요.'));
  await create('v2-garujang','native-food:91391','v2-meal-5');
  await set('v2-garujang','broth-review',answer('free_text','국물은 삼킨 뒤 짠맛이 강해요.'));
  await set('v2-garujang','broth-liking',answer('attribute_liking','아쉬웠어요',{attribute:'taste.salty',target:'broth',phase:'after_swallow'}));
  await set('v2-garujang','temporary',answer('sensory',[choice('바삭한')]));
  await remove('v2-garujang','temporary');
  await create('v2-gajami-a','native-food:91013','v2-meal-6');
  await set('v2-gajami-a','broth',answer('free_text','국물은 첫입에 감칠맛이 좋았어요.'));
  await create('v2-gajami-b','native-food:91393','v2-meal-7');
  await set('v2-gajami-b','broth',answer('free_text','국물은 첫입에 감칠맛이 싫었어요.'));
  await create('v2-espresso','korean-food:5606a53f7a02','v2-meal-8');
  await set('v2-espresso','bitter',answer('free_text','쓴맛이 너무 강해요.'));
  await set('v2-espresso','overall',answer('overall','괜찮았어요'));
  await create('v2-deleted','korean-food:50e0ec477973','v2-meal-deleted');
  await set('v2-deleted','review',answer('free_text','깔끔해요.'));
  await remove('v2-deleted','review','delete');
  const normalizedEvidence=normalizeEvidence(await p.currentEvidenceRows(owner),{unresolvedRows:await p.currentUnresolvedRows(owner)}),insightViews=buildInsightViews(normalizedEvidence);
  assert.ok(!JSON.stringify(normalizedEvidence).includes('v2-deleted'));
  assert.ok(!JSON.stringify(insightViews).includes('v2-deleted'));
  assert.equal(normalizedEvidence.records.filter(r=>r.attribute==='aroma.reference').length,2);
  assert.ok(insightViews.temporalInsights.length>0);assert.ok(insightViews.targetInsights.length>0);assert.ok(insightViews.repeatedExperienceInsights.length>0);assert.ok(insightViews.combinationInsights.length>0);assert.ok(insightViews.preferenceFitInsights.length>0);
  const snapshot=await p.featureSnapshot(owner,{asOf:'2026-09-06T12:01:00Z',targetExperienceId:'v2-espresso'});
  assert.ok(snapshot.priorEvidence.every(row=>row.payload.sourceAnswerRefs.every(ref=>ref.extractionMethod!=='ai')));
  return {userId:owner,evidenceClass:'synthetic_fixture',versions:{lexicon:LEXICON_VERSION,rules:RULE_VERSION},actualApiCalls:0,offlineMockCalls:mockCalls,modelQualityValidated:false,actions,currentPersonalEvidence:await p.currentState(owner),normalizedEvidence,insightViews,extractionArtifacts:await p.currentExtractionArtifacts(owner),featureSnapshot:snapshot,
    limits:['Offline model responses are deliberately handcrafted contract fixtures, not model quality measurements.','Model-extracted candidates stay unconfirmed unless an explicit scoped answer supports the same meaning.','Unresolved rule clauses remain available for optional confirmation after AI candidates arrive.']};
}

const foods=buildFoodEvidencePilot();
const p=await createExperiencePilot();
try {
  await p.importFoods(foods);
  await p.createUser('synthetic-user');
  await p.createUser('synthetic-other');
  const owner='synthetic-user', actions=[];
  async function create(id,mealId,foodId) { await p.createExperience({id,owner,mealId,foodId}); }
  async function send(id,mutationId,baseRevision,answer,extra={}) {
    const event={experienceId:id,mutationId,baseRevision,operation:'set',recordedAt:FIXTURE_TIME,answer,...extra};
    const result=await p.mutate(owner,event);
    actions.push({experienceId:id,operation:event.operation,mutationId,revision:result.revision,evidenceClass:'synthetic_fixture'});
    return event;
  }
  await create('fries','meal-1','korean-food:7472924a4379');
  const retry=await send('fries','fries-1',0,fixtureAnswer('overall','좋았어요'),{recordedAt:'2026-09-06T10:00:00Z'});
  assert.deepEqual(await p.mutate(owner,retry),{revision:1,mutationId:'fries-1'});
  actions.push({operation:'retry',mutationId:'fries-1',result:'same_receipt_no_new_event'});
  await send('fries','fries-2',1,fixtureAnswer('sensory',['바삭한']),{recordedAt:'2026-09-06T10:00:00Z'});
  await create('bulgogi','meal-2','native-food:91511');
  await send('bulgogi','bulgogi-1',0,fixtureAnswer('overall','아쉬웠어요'));
  await send('bulgogi','bulgogi-2',1,fixtureAnswer('sensory',['진한 감칠맛']));
  const initialCandidate=(await p.currentState(owner)).interpretations.find(i=>i.status==='candidate');
  assert.deepEqual(initialCandidate.payload.directSupportRefs,[]);
  assert.deepEqual(initialCandidate.payload.cooccurrenceRefs,[]);
  await send('bulgogi','bulgogi-3',2,fixtureAnswer('attribute_liking','좋았어요',{attribute:'감칠맛'}));
  await create('salmon','meal-3','korean-food:50e0ec477973');
  await send('salmon','salmon-1',0,fixtureAnswer('sensory',['깔끔한']));
  await create('additional','meal-3','korean-food:5606a53f7a02');
  await send('additional','additional-1',0,fixtureAnswer('overall','좋았어요'));
  await send('additional','additional-2',1,fixtureAnswer('sensory',['훈연향']));
  await send('additional','additional-3',2,fixtureAnswer('overall','괜찮았어요'));
  await send('additional','additional-4',3,fixtureAnswer('overall','괜찮았어요'));
  await send('additional','additional-5',4,undefined,{operation:'remove',question:'sensory'});
  await assert.rejects(p.applyAnalysis(owner,'additional',3),/STALE_ANALYSIS/);
  await assert.rejects(p.mutate(owner,{...retry,mutationId:'late-edit'}),/REVISION_CONFLICT/);
  await assert.rejects(p.mutate(owner,{...retry,answer:fixtureAnswer('overall','아쉬웠어요')}),/MUTATION_PAYLOAD_CONFLICT/);
  await assert.rejects(p.mutate('synthetic-other',{...retry,mutationId:'cross-owner'}),/OWNER_MISMATCH/);
  await create('deleted-fixture','meal-4','native-food:91391');
  await send('deleted-fixture','deleted-1',0,fixtureAnswer('free_text','합성 삭제 검증 응답'));
  await send('deleted-fixture','deleted-2',1,undefined,{operation:'delete'});
  await assert.rejects(p.mutate(owner,{experienceId:'deleted-fixture',mutationId:'resurrect',baseRevision:2,operation:'set',recordedAt:FIXTURE_TIME,answer:fixtureAnswer('overall','좋았어요')}),/EXPERIENCE_DELETED/);
  const featureSnapshot=await p.featureSnapshot(owner,{asOf:'2026-09-06T11:00:00Z',targetExperienceId:'bulgogi'});
  assert.deepEqual([...new Set(featureSnapshot.priorEvidence.map(o=>o.experience_id))],['fries']);
  const current=await p.currentState(owner);
  assert.equal(current.coverage.experiences,4); assert.equal(current.coverage.meals,3); assert.equal(current.coverage.observations,8);
  assert.equal(current.interpretations.find(i=>i.status==='contested').experience_id,'bulgogi');
  const expandedScenario=await runExpandedScenario(p);
  const databaseCounts={};
  for(const table of ['sources','foods','food_claims','claim_sources','users','meals','experiences','input_events','answers','observations','interpretations','interpretation_dependencies','tombstones','receipts','extraction_artifacts','observation_sources','unresolved_signals']) databaseCounts[table]=(await p.db.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count;
  const deletedRows={};
  for(const table of ['input_events','answers','observations','interpretations','interpretation_dependencies']) {
    deletedRows[table]=(await p.db.query(`SELECT count(*)::int AS count FROM ${table} WHERE experience_id='deleted-fixture'`)).rows[0].count;
    assert.equal(deletedRows[table],0);
  }
  const normalizedEvidence=normalizeEvidence(await p.currentEvidenceRows(owner));
  const insightViews=buildInsightViews(normalizedEvidence);
  assert.deepEqual(insightViews.coverage,normalizedEvidence.coverage);
  const output={
    schemaVersion:'tba-platform-pilot-v2',
    meta:{real_food_data:true,synthetic_user_feedback:true,engine_executed:true,predictive_model_trained:false,database:'PGlite in-memory',fixtureTime:FIXTURE_TIME,actual_api_calls:0,offline_mock_calls:expandedScenario.offlineMockCalls,live_api_validation:'not_run_offline_pilot'},
    foodEvidence:foods,
    database:{counts:databaseCounts,deletedExperienceContentRows:deletedRows,scope:'Local SQL and application contract only; production authentication/RLS not exercised'},
    syntheticScenario:{evidenceClass:'synthetic_fixture',actions,checks:{retry_no_duplicate:true,payload_conflict_rejected:true,stale_edit_rejected:true,stale_analysis_rejected:true,cross_owner_rejected:true,partial_remove_preserved_overall:true,deleted_experience_cannot_revive:true,avoidance_candidate_without_direct_or_cooccurrence_support:true,direct_umami_positive_contests_avoidance:true,overall_negative_preserved:true,as_of_excludes_future_and_target_meal:true}},
    currentValidAnswers:(await p.db.query('SELECT id,experience_id,question,payload,recorded_at FROM answers WHERE active AND owner=$1 ORDER BY id',[owner])).rows,
    currentPersonalEvidence:current,
    expandedScenario,
    normalizedEvidence,
    insightViews,
    featureSnapshot,
    limitations:['All user, meal and experience feedback is synthetic_fixture; food records alone are real local assets.','Reviewed question/choice mapping only; unrecognized free text remains unresolved.','Counts describe experiences, meal clusters and observations; no independent sample size or preference probability is estimated.','No chemical measurements, external tasting data, model training, recommendation accuracy evaluation, actual LLM API calls or UI.','No production RLS/authentication, concurrent network clients, outbox worker, backup deletion, model unlearning or historical as_of reconstruction is validated.','Current views are queried after mutations and deletion; pre-deletion outputs are not reused as current state.','In-memory database is destroyed after this deterministic report is written; source files and existing application data remain unchanged.']
  };
  const path=resolve('docs/product/tba-platform-pilot-results.json');
  await writeFile(path,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({output:path,databaseCounts,coverage:current.coverage,insightOutputCounts:insightViews.outputCounts,totalInsightOutputs:insightViews.totalOutputs,v2Coverage:expandedScenario.normalizedEvidence.coverage,v2OutputCounts:expandedScenario.insightViews.outputCounts,v2TotalOutputs:expandedScenario.insightViews.totalOutputs,actualApiCalls:0,offlineMockCalls:expandedScenario.offlineMockCalls,checks:'passed'},null,2));
} finally { await p.close(); }
