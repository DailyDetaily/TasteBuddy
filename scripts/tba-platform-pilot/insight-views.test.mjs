import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createExperiencePilot,fixtureAnswer,FIXTURE_TIME} from './experience-evidence.mjs';
import {normalizeEvidence,buildInsightViews,INSIGHT_RULE_VERSION} from './insight-views.mjs';
import {rawAnswerHash} from './ai-extraction.mjs';
let p;
const owner='insight-user';
before(async()=>{
  p=await createExperiencePilot();
  await p.importFoods({sources:[],foods:[{id:'food-a',name:'합성 테스트 음식 A',claims:[]},{id:'food-b',name:'합성 테스트 음식 B',claims:[]}]});
  await p.createUser(owner);
});
after(async()=>p?.close());
async function create(id,foodId='food-a',mealId=id) {await p.createExperience({owner,id,foodId,mealId});}
async function set(id,revision,question,value,extra={}) {
  await p.mutate(owner,{experienceId:id,mutationId:`${id}-${revision}`,baseRevision:revision,operation:'set',recordedAt:FIXTURE_TIME,answer:fixtureAnswer(question,value,extra)});
}
async function views() { return buildInsightViews(normalizeEvidence(await p.currentEvidenceRows(owner))); }
function walk(value,visitor) { if(value && typeof value==='object') {visitor(value); for(const v of Object.values(value)) walk(v,visitor);} }

test('normalization preserves raw answers, has deterministic order, rejects broken lineage and deduplicates retries',async()=>{
  await create('raw');
  await set('raw',0,'sensory',['바삭한','깔끔한']);
  const rows=await p.currentEvidenceRows(owner),original=JSON.stringify(rows);
  const normalized=normalizeEvidence(rows);
  assert.equal(JSON.stringify(rows),original);
  assert.deepEqual(normalizeEvidence([...rows].reverse().concat(rows)),normalized);
  assert.deepEqual(normalized.records[0].originalAnswer,rows[0].original_answer);
  assert.equal(normalized.records.find(r=>r.kind==='sensory_presence').explicitLiking,null);
  assert.equal(normalized.records.find(r=>r.kind==='unresolved').resolution,'unresolved');
  assert.deepEqual(buildInsightViews(normalized),buildInsightViews(normalized));
  assert.throws(()=>normalizeEvidence([{...rows[0],active:false}]),/ACTIVE_EVIDENCE_REQUIRED/);
  assert.throws(()=>normalizeEvidence([{...rows[0],answer_id:'not-the-source'}]),/SOURCE_ANSWER_MISMATCH/);
  assert.throws(()=>normalizeEvidence([{...rows[0],payload:{...rows[0].payload,phrase:'원문에 없는 구절'}}]),/RAW_ANSWER_SCOPE_MISMATCH/);
  assert.throws(()=>buildInsightViews({...normalized,records:[]}),/NORMALIZED_EVIDENCE_CHANGED/);
  assert.equal(JSON.stringify(rows),original);
  assert.equal(normalized.userId,owner);
  assert.ok(normalized.records.every(r=>r.userId===owner));
  assert.throws(()=>normalizeEvidence([...rows,{...rows[0],owner:'different-user'}]),/MIXED_USER_EVIDENCE/);
  assert.throws(()=>normalizeEvidence([{...rows[0],owner:undefined}]),/MISSING_OWNER/);
  assert.throws(()=>normalizeEvidence(rows.map(r=>({...r,owner:'different-user'}))),/SOURCE_OWNER_MISMATCH/);
  const otherNormalized=structuredClone(normalized);
  otherNormalized.userId='different-user';
  otherNormalized.records=otherNormalized.records.map(r=>({...r,userId:'different-user'}));
  otherNormalized.evidenceSetHash=rawAnswerHash({records:otherNormalized.records,unresolvedRecords:otherNormalized.unresolvedRecords});
  assert.notEqual(buildInsightViews(otherNormalized).experienceSummaries[0].id,buildInsightViews(normalized).experienceSummaries[0].id);
  assert.throws(()=>buildInsightViews({...normalized,userId:'different-user'}),/NORMALIZED_OWNER_MISMATCH/);
  const sensory=rows.find(r=>r.payload.kind==='sensory_presence');
  assert.throws(()=>normalizeEvidence([{...sensory,payload:{...sensory.payload,sourceAnswerRefs:sensory.payload.sourceAnswerRefs.map(ref=>({...ref,confirmationStatus:'model_extracted_unconfirmed'}))}}]),/SOURCE_CONFIRMATION_MISMATCH/);
  assert.throws(()=>normalizeEvidence([{...sensory,payload:{...sensory.payload,kind:'attribute_liking',value:'positive',scale:'attribute-three-category-v1'}}]),/SEMANTIC_MAPPING_MISMATCH/);
  assert.throws(()=>normalizeEvidence([{...sensory,payload:{...sensory.payload,sourceAnswerRefs:sensory.payload.sourceAnswerRefs.map(r=>({...r,question:'attribute_liking'}))}}]),/RAW_ANSWER_SCOPE_MISMATCH/);
});

test('all five views preserve evidence references and separate overall liking, strength, presence and direct liking',async()=>{
  await create('mixed','food-a','shared-meal');
  await create('contrast','food-b','shared-meal');
  await set('mixed',0,'overall','아쉬웠어요');
  await set('mixed',1,'sensory',['진한 감칠맛']);
  await set('mixed',2,'attribute_liking','좋았어요',{attribute:'감칠맛'});
  await set('contrast',0,'attribute_liking','아쉬웠어요',{attribute:'감칠맛',target:'sauce',phase:'first_bite'});
  const rows=await p.currentEvidenceRows(owner),normalized=normalizeEvidence(rows),result=buildInsightViews(normalized);
  assert.equal(result.coverage.experiences,3); assert.equal(result.coverage.meals,2);
  assert.equal(result.coverage.observations,7); assert.ok(result.totalOutputs>result.coverage.observations);
  const known=new Map(normalized.records.map(r=>[r.observationId,r]));
  walk(result,item=>{
    if(!item.type) return;
    assert.equal(item.ruleVersion,INSIGHT_RULE_VERSION);
    assert.deepEqual(item.scope.userIds,[owner]);
    assert.equal(item.evidenceSetHash,normalized.evidenceSetHash);
    assert.ok(item.observationRefs.length>0);
    for(const id of item.observationRefs) {
      assert.ok(known.has(id));
      assert.ok(item.scope.experienceIds.includes(known.get(id).experienceId));
      assert.ok(item.scope.foodIds.includes(known.get(id).foodId));
    }
  });
  const crisp=result.attributeProfiles.find(v=>v.attribute==='texture.crisp');
  assert.equal(crisp.status,'preference_unknown'); assert.deepEqual(crisp.directLiking,[]);
  const umami=result.attributeProfiles.find(v=>v.attribute==='taste.umami');
  assert.equal(umami.reportedIntensity[0].value,'strong'); assert.equal(umami.sensoryPresence[0].value,true);
  assert.deepEqual(umami.directLiking.map(f=>f.value).sort(),['negative','positive']);
  assert.equal(umami.generalizedPreference,null);
  const mixed=result.contextInsights.find(i=>i.type==='evaluation_coexistence');
  assert.equal(mixed.status,'different_scoped_evaluations'); assert.equal(mixed.causalExplanation,null);
  const contrast=result.contextInsights.find(i=>i.type==='context_comparison');
  assert.equal(contrast.status,'reported_context_difference'); assert.equal(contrast.temporalTrend,null);
  assert.deepEqual(contrast.scope.targets,['sauce','whole_dish']);
  const grouping=result.groupComparisonPreparation;
  assert.equal(grouping.actualGroups,null); assert.equal(grouping.similarityScores,null); assert.equal(grouping.recommendations,null);
  for(const feature of grouping.features) {
    assert.equal(feature.numericVector,null);
    if(feature.role==='reported_sensation_context') assert.equal(feature.preferenceValue,null);
  }
  assert.ok(result.clarificationCandidates.some(q=>q.type==='clarify_expression'));
  assert.ok(result.clarificationCandidates.some(q=>q.type==='clarify_attribute_liking'));
});

test('editing, removing and deleting retract referenced evidence across every rebuilt output',async()=>{
  await create('mutable');
  await set('mutable',0,'overall','좋았어요');
  await set('mutable',1,'sensory',['훈연향']);
  await set('mutable',2,'attribute_liking','좋았어요',{attribute:'훈연향'});
  const before=(await p.currentEvidenceRows(owner)).filter(r=>r.experience_id==='mutable').map(r=>r.id);
  await set('mutable',3,'attribute_liking','아쉬웠어요',{attribute:'훈연향'});
  let result=await views();
  walk(result,item=>{if(item.observationRefs) for(const id of before) assert.ok(!item.observationRefs.includes(id));});
  assert.equal(result.attributeProfiles.find(a=>a.attribute==='aroma.smoky').directLiking[0].value,'negative');
  await p.mutate(owner,{experienceId:'mutable',mutationId:'remove-liking',baseRevision:4,operation:'remove',question:'attribute_liking',recordedAt:FIXTURE_TIME});
  result=await views();
  const smoky=result.attributeProfiles.find(a=>a.attribute==='aroma.smoky');
  assert.equal(smoky.status,'preference_unknown'); assert.deepEqual(smoky.directLiking,[]);
  assert.ok(!result.groupComparisonPreparation.features.some(f=>f.attribute==='aroma.smoky'&&f.role==='explicit_attribute_preference'));
  await p.mutate(owner,{experienceId:'mutable',mutationId:'clear-sensory',baseRevision:5,operation:'clear',question:'sensory',recordedAt:FIXTURE_TIME});
  result=await views();
  assert.ok(!JSON.stringify(result).includes('aroma.smoky'));
  assert.ok(result.experienceSummaries.some(e=>e.scope.experienceIds.includes('mutable')));
  await p.mutate(owner,{experienceId:'mutable',mutationId:'delete-mutable',baseRevision:6,operation:'delete',recordedAt:FIXTURE_TIME});
  const normalized=normalizeEvidence(await p.currentEvidenceRows(owner)); result=buildInsightViews(normalized);
  assert.ok(!JSON.stringify(normalized).includes('mutable'));
  assert.ok(!JSON.stringify(result).includes('mutable'));
  assert.equal(result.coverage.experiences,3);
});

test('empty evidence remains unsupported and does not create numeric preference or group outputs',()=>{
  const result=buildInsightViews(normalizeEvidence([]));
  assert.equal(result.totalOutputs,0); assert.equal(result.coverage.experiences,0);
  assert.equal(result.groupComparisonPreparation.status,'no_evidence');
  assert.deepEqual(result.groupComparisonPreparation.features,[]);
  assert.deepEqual(result.groupComparisonPreparation.observationRefs,[]);
  assert.ok(result.unsupported.includes('actual_similar_taste_groups'));
});
