import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createExperiencePilot, fixtureAnswer, FIXTURE_TIME } from './experience-evidence.mjs';
let p;
const ref={sourceId:'test-source',recordHash:'test-record-hash',recordPointer:'/0',pointer:'/0/name',field:'name',quote:'테스트 음식'};
const food={id:'test-food',name:'테스트 음식',claims:[{id:'name',predicate:'name',value:'테스트 음식',sourceRefs:[ref]}]};
before(async()=>{ p=await createExperiencePilot(); await p.importFoods({sources:[{id:'test-source'}],foods:[food]}); await p.createUser('u'); await p.createUser('other'); });
after(async()=>p?.close());
async function exp(id,mealId=id,owner='u') { await p.createExperience({owner,id,mealId,foodId:'test-food'}); }
const evt=(id,mutationId,baseRevision,answer,extra={})=>({experienceId:id,mutationId,baseRevision,operation:'set',recordedAt:FIXTURE_TIME,answer,...extra});
const active=async id=>(await p.db.query('SELECT * FROM observations WHERE experience_id=$1 AND active ORDER BY id',[id])).rows;
const count=async(table,id)=>(await p.db.query(`SELECT count(*)::int AS n FROM ${table} WHERE experience_id=$1`,[id])).rows[0].n;

test('food source FK rejects unknown provenance transactionally; food claims never become observations',async()=>{
  assert.equal((await p.currentState('u')).coverage.observations,0);
  await assert.rejects(p.importFoods({sources:[],foods:[{...food,id:'bad-food',claims:[{...food.claims[0],sourceRefs:[{...ref,sourceId:'missing'}]}]}]}),/foreign key/);
  assert.equal((await p.db.query("SELECT * FROM foods WHERE id='bad-food'")).rows.length,0);
});
test('choice mapping keeps overall liking, sensory presence and unresolved free text separate',async()=>{
  await exp('choice');
  await p.mutate('u',evt('choice','c1',0,fixtureAnswer('overall','좋았어요')));
  await p.mutate('u',evt('choice','c2',1,fixtureAnswer('sensory',['바삭한','바삭한','훈연향','깔끔한'])));
  await p.mutate('u',evt('choice','c3',2,fixtureAnswer('free_text','맛있지만 비싸서 다시 안 갈래요')));
  const os=await active('choice');
  assert.equal(os.length,5); assert.equal(os.filter(o=>o.payload.kind==='attribute_liking').length,0);
  assert.equal(os.filter(o=>o.payload.kind==='unresolved').length,2);
  for(const o of os) for(const r of o.payload.sourceAnswerRefs) {
    const a=(await p.db.query('SELECT payload,event_id FROM answers WHERE id=$1',[r.answerId])).rows[0];
    assert.equal(a.event_id,r.eventId); assert.ok(JSON.stringify(a.payload.value).includes(r.phrase));
    assert.equal(r.questionVersion,'1');
  }
  const texts=(await p.currentState('u')).interpretations.filter(x=>x.experience_id==='choice').map(x=>x.payload.text).join(' ');
  assert.ok(!texts.includes('바삭해서'));
});
test('idempotency, payload conflict, revision conflicts, replacement, same meaning and partial clear',async()=>{
  await exp('mutation');
  const e=evt('mutation','m1',0,fixtureAnswer('overall','좋았어요'));
  assert.deepEqual(await p.mutate('u',e),await p.mutate('u',e));
  assert.equal(await count('input_events','mutation'),1);
  await assert.rejects(p.mutate('u',{...e,answer:fixtureAnswer('overall','아쉬웠어요')}),/MUTATION_PAYLOAD_CONFLICT/);
  await assert.rejects(p.mutate('u',{...e,mutationId:'stale'}),/REVISION_CONFLICT/);
  await p.mutate('u',evt('mutation','m2',1,fixtureAnswer('sensory',['진한 감칠맛'])));
  await p.mutate('u',evt('mutation','m3',2,fixtureAnswer('overall','아쉬웠어요')));
  assert.equal((await active('mutation')).length,3);
  assert.equal((await active('mutation')).find(o=>o.payload.kind==='overall_liking').payload.value,'negative');
  await p.mutate('u',evt('mutation','m4',3,fixtureAnswer('overall','아쉬웠어요')));
  assert.equal((await active('mutation')).length,3);
  await p.mutate('u',{experienceId:'mutation',mutationId:'m5',baseRevision:4,operation:'clear',question:'sensory',recordedAt:FIXTURE_TIME});
  assert.equal((await active('mutation')).length,1);
  assert.equal((await active('mutation'))[0].payload.kind,'overall_liking');
  await assert.rejects(p.applyAnalysis('u','mutation',4),/STALE_ANALYSIS/);
  await p.applyAnalysis('u','mutation',5);
});
test('unknown dictionary version rolls back events, revision and receipts',async()=>{
  await exp('version');
  await assert.rejects(p.mutate('u',evt('version','v1',0,fixtureAnswer('sensory',['바삭한'],{questionVersion:'99'}))),/UNKNOWN_VERSION/);
  await assert.rejects(p.mutate('u',evt('version','v2',0,fixtureAnswer('overall','maybe'))),/INVALID_CHOICE/);
  await assert.rejects(p.mutate('u',evt('version','v3',0,fixtureAnswer('overall','toString'))),/INVALID_CHOICE/);
  assert.equal(await count('input_events','version'),0);
  assert.equal((await p.db.query("SELECT revision FROM experiences WHERE id='version'")).rows[0].revision,0);
});
test('negative overall and strong umami offer no preference support; direct positive contests avoidance',async()=>{
  await exp('mixed');
  await p.mutate('u',evt('mixed','x1',0,fixtureAnswer('overall','아쉬웠어요')));
  await p.mutate('u',evt('mixed','x2',1,fixtureAnswer('sensory',['진한 감칠맛'])));
  let h=(await p.currentState('u')).interpretations.find(i=>i.experience_id==='mixed'&&i.status==='candidate').payload;
  assert.deepEqual(h.directSupportRefs,[]); assert.deepEqual(h.cooccurrenceRefs,[]); assert.equal(h.probability,null);
  await p.mutate('u',evt('mixed','x3',2,fixtureAnswer('attribute_liking','좋았어요',{attribute:'감칠맛'})));
  h=(await p.currentState('u')).interpretations.find(i=>i.experience_id==='mixed'&&i.status==='contested').payload;
  assert.equal(h.counterRefs.length,1); assert.equal(h.directSupportRefs.length,0);
  assert.equal((await active('mixed')).find(o=>o.payload.kind==='overall_liking').payload.value,'negative');
  assert.equal((await active('mixed')).length,4);
});
test('ownership checked in API and composite DB evidence references',async()=>{
  await exp('private','private','other');
  await assert.rejects(p.mutate('u',evt('private','p1',0,fixtureAnswer('overall','좋았어요'))),/OWNER_MISMATCH/);
  await assert.rejects(p.createExperience({id:'cross-meal',owner:'u',mealId:'private',foodId:'test-food'}),/foreign key/);
  await p.mutate('other',evt('private','p2',0,fixtureAnswer('overall','좋았어요')));
  const a=(await p.db.query("SELECT * FROM answers WHERE experience_id='private'")).rows[0];
  await assert.rejects(p.db.query('INSERT INTO observations VALUES($1,$2,$3,$4,$5,$6,true,$7)',['cross-owner','choice','u',a.id,'invalid',{},FIXTURE_TIME]),/foreign key/);
  const o=(await active('private'))[0], i=(await p.currentState('u')).interpretations[0];
  await assert.rejects(p.db.query('INSERT INTO interpretation_dependencies VALUES($1,$2,$3,$4)',[i.id,o.id,i.experience_id,'u']),/foreign key/);
});
test('as_of excludes future input and every dish in target meal',async()=>{
  await exp('history'); await exp('future'); await exp('target','shared'); await exp('shared-side','shared');
  await p.mutate('u',evt('history','h1',0,fixtureAnswer('overall','괜찮았어요'),{recordedAt:'2026-09-06T10:00:00Z'}));
  await p.mutate('u',evt('future','h2',0,fixtureAnswer('overall','좋았어요'),{recordedAt:'2026-09-06T11:00:01Z'}));
  await p.mutate('u',evt('shared-side','h3',0,fixtureAnswer('sensory',['바삭한']),{recordedAt:'2026-09-06T10:00:00Z'}));
  const snapshot=await p.featureSnapshot('u',{asOf:'2026-09-06T11:00:00Z',targetExperienceId:'target'});
  assert.deepEqual(snapshot.priorEvidence.map(o=>o.experience_id),['history']);
  const boundary=await p.featureSnapshot('u',{asOf:'2026-09-06T10:00:00Z',targetExperienceId:'target'});
  assert.equal(boundary.priorEvidence.length,1);
});
test('delete physically removes raw and derived data; contentless tombstones and retry receipts cannot revive',async()=>{
  await exp('delete');
  const initial=evt('delete','d1',0,fixtureAnswer('overall','좋았어요'));
  await p.mutate('u',initial);
  const deletion={experienceId:'delete',mutationId:'d2',baseRevision:1,operation:'delete',recordedAt:FIXTURE_TIME};
  assert.deepEqual(await p.mutate('u',deletion),await p.mutate('u',deletion));
  for(const table of ['input_events','answers','observations','interpretations']) assert.equal(await count(table,'delete'),0);
  assert.equal((await p.db.query("SELECT * FROM interpretation_dependencies WHERE experience_id='delete'")).rows.length,0);
  assert.equal((await p.currentState('u')).observations.filter(o=>o.experience_id==='delete').length,0);
  await p.mutate('u',initial); // contentless receipt is a retry acknowledgement, not a restored snapshot
  await assert.rejects(p.mutate('u',evt('delete','d3',2,fixtureAnswer('overall','좋았어요'))),/EXPERIENCE_DELETED/);
  await assert.rejects(p.applyAnalysis('u','delete',2),/EXPERIENCE_DELETED/);
  await assert.rejects(exp('delete'),/EXPERIENCE_DELETED/);
  const tombstone=(await p.db.query("SELECT * FROM tombstones WHERE experience_id='delete'")).rows[0];
  assert.deepEqual(Object.keys(tombstone).sort(),['experience_id','owner','revision']);
  const receipt=(await p.db.query("SELECT * FROM receipts WHERE mutation_id='d1'")).rows[0];
  assert.equal('payload' in receipt,false); assert.equal('answer' in receipt,false);
});

test('semantically identical saves preserve original evidence IDs and as_of availability',async()=>{
  await exp('unchanged'); await exp('unchanged-target');
  await p.mutate('u',evt('unchanged','unchanged1',0,fixtureAnswer('sensory',['훈연향','바삭한']),{recordedAt:'2026-09-06T09:00:00Z'}));
  const original=await active('unchanged');
  await p.mutate('u',evt('unchanged','unchanged2',1,fixtureAnswer('sensory',['바삭한','훈연향','바삭한']),{recordedAt:'2026-09-06T13:00:00Z'}));
  assert.deepEqual(await active('unchanged'),original);
  assert.equal(await count('input_events','unchanged'),2);
  assert.equal(await count('answers','unchanged'),1);
  const snapshot=await p.featureSnapshot('u',{asOf:'2026-09-06T09:30:00Z',targetExperienceId:'unchanged-target'});
  assert.equal(snapshot.priorEvidence.filter(o=>o.experience_id==='unchanged').length,2);
});

test('answerKey keeps multiple phases and targets; removal only retracts the chosen key',async()=>{
  await exp('multi-key');
  const v2=(value,extra={})=>fixtureAnswer('attribute_liking',value,{questionVersion:'2',choiceVersion:'tba-semantic-lexicon/2',attribute:'taste.sweet',...extra});
  await p.mutate('u',evt('multi-key','mk1',0,v2('좋았어요',{target:'sauce',phase:'first_bite'}),{answerKey:'sauce-first'}));
  await p.mutate('u',evt('multi-key','mk2',1,v2('아쉬웠어요',{target:'sauce',phase:'late_meal'}),{answerKey:'sauce-late'}));
  await p.mutate('u',evt('multi-key','mk3',2,v2('괜찮았어요',{target:'coating',phase:'first_bite'}),{answerKey:'coating-first'}));
  assert.equal((await active('multi-key')).length,3);
  await p.mutate('u',{experienceId:'multi-key',mutationId:'mk4',baseRevision:3,operation:'remove',answerKey:'sauce-late',recordedAt:FIXTURE_TIME});
  assert.deepEqual((await active('multi-key')).map(o=>o.payload.phase),['first_bite','first_bite']);
  assert.equal((await p.db.query("SELECT * FROM answers WHERE experience_id='multi-key' AND active")).rows.length,2);
});

test('same observation from multiple answers preserves every source and does not double count',async()=>{
  await exp('multi-source');
  await p.mutate('u',evt('multi-source','ms1',0,fixtureAnswer('sensory',['바삭한']),{answerKey:'bubble'}));
  await p.mutate('u',evt('multi-source','ms2',1,fixtureAnswer('sensory',['바삭한']),{answerKey:'confirm'}));
  const observations=await active('multi-source');
  assert.equal(observations.length,1); assert.equal(observations[0].payload.sourceAnswerRefs.length,2);
  assert.equal((await p.db.query("SELECT * FROM observation_sources WHERE observation_id=$1",[observations[0].id])).rows.length,2);
  await p.mutate('u',{experienceId:'multi-source',mutationId:'ms3',baseRevision:2,operation:'clear',answerKey:'bubble',recordedAt:FIXTURE_TIME});
  assert.equal((await active('multi-source')).length,1);
  assert.equal((await active('multi-source'))[0].payload.sourceAnswerRefs.length,1);
});

test('changed free text or question version replaces active raw source even when meaning tuple is identical',async()=>{
  await exp('raw-revision');
  const v2=value=>({question:'free_text',questionVersion:'2',choiceVersion:'tba-semantic-lexicon/2',value});
  await p.mutate('u',evt('raw-revision','rr1',0,v2('바삭해요.')));
  const original=(await active('raw-revision'))[0];
  await p.mutate('u',evt('raw-revision','rr2',1,v2('바삭해요!')));
  assert.notEqual((await active('raw-revision'))[0].answer_id,original.answer_id);
  assert.equal((await p.db.query("SELECT payload FROM answers WHERE experience_id='raw-revision' AND active")).rows[0].payload.value,'바삭해요!');
  await p.mutate('u',evt('raw-revision','rr3',2,fixtureAnswer('overall','좋았어요')));
  const oldAnswer=(await active('raw-revision')).find(o=>o.payload.kind==='overall_liking').answer_id;
  await p.mutate('u',evt('raw-revision','rr4',3,fixtureAnswer('overall','좋았어요',{questionVersion:'2',choiceVersion:'tba-semantic-lexicon/2'})));
  assert.notEqual((await active('raw-revision')).find(o=>o.payload.kind==='overall_liking').answer_id,oldAnswer);
  assert.equal((await p.db.query("SELECT payload FROM answers WHERE experience_id='raw-revision' AND question='overall' AND active")).rows[0].payload.questionVersion,'2');
});

test('legacy interpretations keep model-only candidates unconfirmed and adopt explicit support from any source',async()=>{
  const text='감칠맛은 처음엔 좋았는데 나중에는 그 맛이 부담스러웠어요.';
  const span=quote=>{const start=text.indexOf(quote);assert.ok(start>=0);return {start,end:start+quote.length,quote};};
  for(const [value,phase,phrase,support] of [['positive','early_meal','감칠맛은 처음엔 좋았는데',[]],['negative','late_meal','나중에는 그 맛이 부담스러웠어요.',['감칠맛']]]) {
    const id=`model-confirm-${value}`;await exp(id);
    await p.mutate('u',evt(id,`${id}:overall`,0,fixtureAnswer('overall','아쉬웠어요')));
    await p.mutate('u',evt(id,`${id}:review`,1,{question:'free_text',questionVersion:'2',choiceVersion:'tba-semantic-lexicon/2',value:text},{answerKey:'review'}));
    const atom=(kind,atomValue,scale)=>({kind,attribute:'taste.umami',value:atomValue,scale,target:'whole_dish',phase,phrase,reference:null,combinationComponents:[],sourceSpans:[span(phrase),...support.map(span)]});
    const proposal={observations:[atom('sensory_presence',true,'presence-v1'),atom('attribute_liking',value,'attribute-three-category-v1')],unresolved:[]};
    await p.processAnswerAI('u',{experienceId:id,answerKey:'review',baseRevision:2},{recordedAt:FIXTURE_TIME,config:{apiKey:'offline-confirmation-key',provider:'offline_fixture'},fetchImpl:async()=>({ok:true,status:200,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(proposal)}]}]})})});
    let current=(await p.currentState('u')).interpretations.filter(item=>item.experience_id===id);
    let liking=(await active(id)).find(item=>item.payload.kind==='attribute_liking');
    let summary=current.find(item=>item.payload.observationRefs.length===1&&item.payload.observationRefs[0]===liking.id);
    assert.equal(summary.status,'candidate');assert.equal(summary.payload.confirmationStatus,'model_extracted_unconfirmed');assert.match(summary.payload.text,/사용자 확인 전/);
    let hypothesis=current.find(item=>item.payload.claim);
    assert.deepEqual(hypothesis.payload.directSupportRefs,[]);assert.deepEqual(hypothesis.payload.counterRefs,[]);assert.ok(hypothesis.payload.modelCandidateRefs.includes(liking.id));
    // 사전순으로 뒤의 key를 써서 기존 model anchor가 남아도 모든 원문 참조를 확인하는지 검증한다.
    await p.mutate('u',evt(id,`${id}:confirmation`,2,{question:'attribute_liking',questionVersion:'2',choiceVersion:'tba-semantic-lexicon/2',attribute:'taste.umami',target:'whole_dish',phase,value:value==='positive'?'좋았어요':'아쉬웠어요'},{answerKey:'zz-confirmation'}));
    liking=(await active(id)).find(item=>item.payload.kind==='attribute_liking');
    assert.equal(liking.payload.sourceAnswerRefs.length,2);assert.equal(liking.payload.confirmationStatus,'model_extracted_unconfirmed');
    current=(await p.currentState('u')).interpretations.filter(item=>item.experience_id===id);
    summary=current.find(item=>item.payload.observationRefs.length===1&&item.payload.observationRefs[0]===liking.id);
    assert.equal(summary.status,'scoped_fact');assert.equal(summary.payload.confirmationStatus,'explicit_user_choice');assert.ok(!summary.payload.text.includes('사용자 확인 전'));
    hypothesis=current.find(item=>item.payload.claim);
    assert.deepEqual(hypothesis.payload[value==='positive'?'counterRefs':'directSupportRefs'],[liking.id]);assert.ok(!hypothesis.payload.modelCandidateRefs.includes(liking.id));
    assert.equal(hypothesis.status,value==='positive'?'contested':'candidate');
  }
});


test('structured selection saves retain distinct sources, preserve reordered evidence and retract corrections and clears',async()=>{
  const {normalizeEvidence}=await import('./insight-views.mjs');
  const {DINING_SELECTION_VERSION:version}=await import('./dining-selections.mjs');
  let calls=0;
  const pilot=await createExperiencePilot({aiFetch:async()=>{calls++;throw new Error('unexpected network');},evidenceClass:'user_report'});
  try {
    await pilot.importFoods({sources:[],foods:[{id:'structured-food',name:'선택 검증 음식',claims:[]}]});
    await pilot.createUser('structured-owner');
    for(const id of ['structured-meal','structured-target']) await pilot.createExperience({owner:'structured-owner',id,foodId:'structured-food',mealId:id});
    let revision=0;
    const a={id:'bitter-roasted',type:'bubble',catalogVersion:version,labelSnapshot:'구운 향',liking:'liked'};
    const b={id:'aroma-roasted',type:'detailTag',catalogVersion:version,labelSnapshot:'구운 향',liking:'liked',relatedBubbleID:'bitter-roasted'};
    const answer=value=>({question:'structured_sensory',questionVersion:'2',choiceVersion:version,value});
    const mutate=async(operation,value,recordedAt='2026-09-06T13:00:00Z')=>pilot.mutate('structured-owner',{experienceId:'structured-meal',mutationId:`structured-${revision}`,baseRevision:revision++,operation,recordedAt,...(operation==='set'?{answer:answer(value)}:{question:'structured_sensory'})});
    const snapshot=()=>pilot.currentEvidenceSnapshot('structured-owner');
    await mutate('set',[a,b],'2026-09-06T09:00:00Z');
    const first=await snapshot();
    assert.deepEqual(new Set(first.rows.map(r=>r.payload.selectionEvidence.selectionID)),new Set([a.id,b.id]));
    assert.equal(first.rows.filter(r=>r.payload.kind==='attribute_liking').length,2);
    const normalized=normalizeEvidence(first.rows,{unresolvedRows:first.unresolvedRows});
    for(const row of first.rows) assert.deepEqual(normalized.records.find(r=>r.observationId===row.id).selectionEvidence,row.payload.selectionEvidence);
    assert.equal(normalized.coverage.experiences,1);
    const changedSource=structuredClone(first.rows[0]);changedSource.payload.selectionEvidence.relatedBubbleID='wrong-parent';
    assert.throws(()=>normalizeEvidence([changedSource]),/SEMANTIC_MAPPING_MISMATCH/);
    await mutate('set',[b,a,a]);
    const reordered=await snapshot();
    assert.deepEqual(reordered.rows.map(r=>r.id),first.rows.map(r=>r.id));
    assert.deepEqual(reordered.rows.map(r=>r.recorded_at),first.rows.map(r=>r.recorded_at));
    const historical=await pilot.featureSnapshot('structured-owner',{asOf:'2026-09-06T09:30:00Z',targetExperienceId:'structured-target'});
    assert.deepEqual(historical.priorEvidence.map(r=>r.id),first.rows.map(r=>r.id));
    await mutate('set',[{...a,liking:'disliked'},b]);
    const corrected=await snapshot();
    assert.ok(corrected.rows.every(r=>!first.rows.some(old=>old.id===r.id)));
    assert.equal(corrected.rows.find(r=>r.payload.kind==='attribute_liking'&&r.payload.selectionEvidence.selectionID===a.id).payload.value,'negative');
    await mutate('set',[a,{...a,liking:'disliked'}]);
    const conflict=await snapshot();
    assert.equal(conflict.rows.length,0);
    assert.ok(conflict.unresolvedRows.length>=2);
    const conflictNormalized=normalizeEvidence(conflict.rows,{unresolvedRows:conflict.unresolvedRows});
    assert.ok(conflictNormalized.unresolvedRecords.every(r=>r.selectionEvidence?.selectionID===a.id));
    await mutate('set',[]);
    assert.equal((await snapshot()).rows.length,0);assert.equal((await snapshot()).unresolvedRows.length,0);
    await mutate('set',[a,{...b,id:'future',labelSnapshot:'미래 선택'}]);
    assert.ok((await snapshot()).unresolvedRows.length);
    await mutate('clear');
    assert.equal((await snapshot()).rows.length,0);assert.equal((await snapshot()).unresolvedRows.length,0);
    await pilot.applyAnalysis('structured-owner','structured-meal',revision);
    assert.equal((await snapshot()).rows.length,0);assert.equal((await snapshot()).unresolvedRows.length,0);
    await mutate('set',[a]);await mutate('remove');
    assert.equal((await snapshot()).rows.length,0);
    assert.equal(calls,0);
  } finally {await pilot.close();}
});

test('OE01-08 overall five-step source survives storage and cannot alter identical sensory dislikes',async()=>{
  const {normalizeEvidence,buildInsightViews}=await import('./insight-views.mjs');
  let calls=0;
  const pilot=await createExperiencePilot({aiFetch:async()=>{calls++;throw new Error('unexpected network');},evidenceClass:'user_report'});
  try {
    const owner='overall-owner';
    await pilot.importFoods({sources:[],foods:[{id:'overall-food',name:'전체 평가 검증 음식',claims:[]}]});
    await pilot.createUser(owner);
    const revisions=new Map();
    async function create(id){await pilot.createExperience({owner,id,foodId:'overall-food',mealId:id});revisions.set(id,0);}
    async function mutate(id,question,value,operation='set'){
      const revision=revisions.get(id);revisions.set(id,revision+1);
      const answer={question,questionVersion:question==='structured_overall'?'1':'2',choiceVersion:question==='structured_overall'?'dining-overall-liking/1':'dining-sensory-selection/1',value};
      return pilot.mutate(owner,{experienceId:id,mutationId:`${id}-${revision}`,baseRevision:revision,operation,recordedAt:FIXTURE_TIME,...(operation==='set'?{answer}:{question})});
    }
    const labels={veryLiked:'정말 좋았어요',liked:'좋았어요',neutral:'보통이었어요',disliked:'아쉬웠어요',veryDisliked:'많이 아쉬웠어요'};
    const evaluation=responseValue=>({questionID:'overall_liking',questionVersion:'dining-overall-liking/1',questionLabelSnapshot:'이 음식은 전체적으로 어땠나요?',responseValue,responseLabelSnapshot:labels[responseValue],target:'whole_dish',phase:'unspecified'});
    const sour={id:'sour-fresh',type:'bubble',catalogVersion:'dining-sensory-selection/1',labelSnapshot:'산뜻한 산미',liking:'disliked'};
    const normalize=async()=>{const snapshot=await pilot.currentEvidenceSnapshot(owner);return normalizeEvidence(snapshot.rows,{unresolvedRows:snapshot.unresolvedRows});};
    const sensoryMeaning=records=>records.filter(r=>r.kind!=='overall_liking').map(({kind,attribute,value,scale,target,phase,phrase,selectionEvidence})=>({kind,attribute,value,scale,target,phase,phrase,selectionEvidence})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    for(const [id,response] of [['overall-a','liked'],['overall-b','veryDisliked']]){
      await create(id);await mutate(id,'structured_sensory',[sour]);await mutate(id,'structured_overall',evaluation(response));
    }
    const normalized=await normalize();
    const a=normalized.records.filter(r=>r.experienceId==='overall-a'),b=normalized.records.filter(r=>r.experienceId==='overall-b');
    assert.deepEqual(sensoryMeaning(a),sensoryMeaning(b));
    assert.equal(a.find(r=>r.kind==='overall_liking').value,'positive');assert.equal(b.find(r=>r.kind==='overall_liking').value,'very_negative');
    assert.equal(normalized.coverage.experiences,2);
    assert.ok(normalized.records.filter(r=>r.kind==='attribute_liking').every(r=>r.value==='negative'));
    assert.ok(!normalized.records.some(r=>r.kind==='sensory_intensity'));
    const whole=b.find(r=>r.kind==='overall_liking');
    assert.equal(whole.selectionEvidence.labelSnapshot,'이 음식은 전체적으로 어땠나요?');
    assert.equal(whole.selectionEvidence.labelValue,'많이 아쉬웠어요');
    assert.equal(whole.selectionEvidence.responseValue,'veryDisliked');
    assert.deepEqual(whole.originalAnswer.value,evaluation('veryDisliked'));
    const views=buildInsightViews(normalized);
    assert.ok(views.attributeProfiles.find(r=>r.attribute==='taste.sour').directLiking.every(r=>r.value==='negative'));
    await mutate('overall-a','structured_overall',evaluation('veryDisliked'));
    const corrected=(await normalize()).records.filter(r=>r.experienceId==='overall-a');
    assert.deepEqual(sensoryMeaning(corrected),sensoryMeaning(a));
    assert.equal(corrected.filter(r=>r.kind==='overall_liking').length,1);
    assert.equal(corrected.find(r=>r.kind==='overall_liking').value,'very_negative');
    await mutate('overall-a','structured_overall',null,'clear');
    const cleared=(await normalize()).records.filter(r=>r.experienceId==='overall-a');
    assert.deepEqual(sensoryMeaning(cleared),sensoryMeaning(a));assert.ok(!cleared.some(r=>r.kind==='overall_liking'));
    await create('overall-only');
    assert.ok(!(await normalize()).records.some(r=>r.experienceId==='overall-only'));
    for(const [response,expected] of [['veryLiked','very_positive'],['liked','positive'],['neutral','neutral'],['disliked','negative'],['veryDisliked','very_negative']]){
      await mutate('overall-only','structured_overall',evaluation(response));
      const only=(await normalize()).records.filter(r=>r.experienceId==='overall-only');
      assert.equal(only.length,1);assert.equal(only[0].value,expected);assert.equal(only[0].scale,'overall-five-category-v1');assert.equal(only[0].attribute,null);
    }
    for(const invalid of [{...evaluation('liked'),questionVersion:'future/9'},{...evaluation('liked'),responseLabelSnapshot:'많이 아쉬웠어요'}]){
      await mutate('overall-only','structured_overall',invalid);
      const pending=await normalize();
      assert.ok(!pending.records.some(r=>r.experienceId==='overall-only'));
      const unresolved=pending.unresolvedRecords.find(r=>r.experienceId==='overall-only');
      assert.ok(unresolved);assert.deepEqual(unresolved.originalAnswer.value,invalid);
      assert.equal(unresolved.selectionEvidence.labelValue,invalid.responseLabelSnapshot);
    }
    await mutate('overall-only','structured_overall',null,'remove');
    const removed=await normalize();assert.ok(!removed.unresolvedRecords.some(r=>r.experienceId==='overall-only'));
    assert.equal(calls,0);
  } finally {await pilot.close();}
});
