import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPersonalTasteModel,predictPersonalTaste } from './personal-taste-model.mjs';
import { modelRecord,PERSONAL_TASTE_NATIVE_CONTRACT } from '../build-personal-taste-model-contract.mjs';
import { createTasteAnalysisEngine } from './index.mjs';
import { LEXICON_VERSION } from '../tba-platform-pilot/rules.mjs';
const build=records=>buildPersonalTasteModel({userId:'fixture-user',records});
test('같은 식사의 중복 평가와 상반 응답은 독립 반복으로 승격되지 않는다',()=>{
 const r=modelRecord('a');const model=build([r,r,modelRecord('b','negative',{mealId:r.mealId})]);
 assert.equal(model.units.length,1);assert.equal(model.units[0].liking,'mixed');assert.equal(model.candidates[0].distribution.mealCount,1);assert.equal(model.candidates[0].direction,null);
});
test('미관찰 강도 종류 결합 조건은 넓은 속성 방향으로 우회하지 않는다',()=>{
 const fixture=PERSONAL_TASTE_NATIVE_CONTRACT.fixtures.find(f=>f.id==='strong-unobserved-weak');
 assert.equal(predictPersonalTaste(fixture.expected,{attribute:'taste.sour',intensity:'weak'}).direction,null);
 const m=build([1,2,3].map(i=>modelRecord(`${i}`,'positive',{dishKindIDs:['seafood']})));
 assert.equal(predictPersonalTaste(m,{attribute:'taste.sour',dishKindIDs:['meat']}).direction,null);
});
test('강도 조건은 실제 강도 행 출처를 포함하고 다른 선택에 전파하지 않는다',()=>{
 const meta=id=>({selectionID:id,type:'bubble',catalogVersion:'v1',labelSnapshot:id,facet:'liking',labelValue:'좋았어요',responseValue:'liked',relatedBubbleID:null,relatedBubbleLabel:null,resolution:'resolved'});
 const r=modelRecord('p','positive',{selectionEvidence:meta('one')}),level=modelRecord('i','strong',{experienceId:r.experienceId,mealId:r.mealId,kind:'sensory_intensity',scale:'expression-strength-v1',selectionEvidence:meta('two')});
 assert.equal(build([r,level]).units[0].intensity,null);
 const linked={...level,selectionEvidence:{...meta('one'),facet:'intensity'}};const unit=build([r,linked]).units[0];assert.equal(unit.intensity,'strong');assert.ok(unit.evidenceIDs.includes('i'));
});
test('전체 5단계는 같은 기록에서만 연결하고 개별 평가를 바꾸지 않는다',()=>{
 const r=modelRecord('p','positive'),overall=modelRecord('o','very_negative',{mealId:r.mealId,kind:'overall_liking',attribute:null,scale:'overall-five-category-v1'});
 assert.equal(build([r,overall]).overallAssociations.length,0);
 const linked=build([r,{...overall,experienceId:r.experienceId}]);assert.equal(linked.units[0].liking,'positive');assert.deepEqual(linked.overallAssociations[0].overallValues,['very_negative']);
});
test('중립 후보의 다른 호감 응답도 반례로 남긴다',()=>{
 const model=build([1,2,3].map(i=>modelRecord(`${i}`,'neutral')).concat(modelRecord('p','positive')));const baseline=model.candidates.find(c=>!c.conditions.length);
 assert.deepEqual(baseline.counterMealIDs,['m-p']);assert.equal(baseline.direction,null);
});
test('답변이 모두 있어도 미관찰 대조 강도는 새 식사 탐색으로 제안한다',()=>{
 const m=PERSONAL_TASTE_NATIVE_CONTRACT.fixtures.find(f=>f.id==='strong-unobserved-weak').expected;
 assert.equal(m.nextSelection.intent,'exploration');assert.equal(m.nextSelection.unobserved,true);assert.equal(m.nextSelection.createsEvidence,false);assert.equal(m.nextSelection.proposedCondition.value,'weak');
});
test('실제 저장 경로가 관찰시간 종류 식별자 전달과 과거 알려진 시점을 지킨다',async()=>{
 const engine=await createTasteAnalysisEngine({evidenceClass:'synthetic_fixture'});
 try{
  await engine.importFoods({sources:[],foods:[{id:'f',name:'검증 음식',claims:[]}]});await engine.createUser('u');
  await engine.createExperience({owner:'u',id:'e',mealId:'m',foodId:'f',observedAt:'2026-09-01T00:00:00.000Z',dishKindIDs:['seafood'],restaurantID:'r',menuItemID:'menu'});
  await engine.mutate('u',{experienceId:'e',mutationId:'one',baseRevision:0,operation:'set',recordedAt:'2026-09-02T00:00:00.000Z',answer:{question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value:'산미가 좋았어요.'}});
  const current=await engine.analyze('u');const r=current.provenance.records.find(r=>r.kind==='attribute_liking');
  assert.equal(r.observedAt,'2026-09-01T00:00:00.000Z');assert.equal(r.knownAt,'2026-09-02T00:00:00.000Z');assert.deepEqual(r.dishKindIDs,['seafood']);assert.equal(r.restaurantID,'r');assert.equal(r.menuItemID,'menu');assert.equal(current.personalModel.units[0].mealID,'m');
  const prior=await engine.analyze('u',{asOf:'2026-09-01T12:00:00.000Z'});assert.equal(prior.personalModel.units.length,0);assert.equal(prior.provenance.records.length,0);
  const later=await engine.analyze('u',{asOf:'2026-09-03T00:00:00.000Z'});assert.equal(later.personalModel.units.length,1);
 }finally{await engine.close();}
});
test('억제된 질문을 건너뛰어도 평가 단위와 분포는 바뀌지 않는다',()=>{
 const records=[modelRecord('one')],first=build(records);const next=buildPersonalTasteModel({userId:'fixture-user',records},{suppressedQuestionIDs:[first.nextSelection.id]});
 assert.notEqual(next.nextSelection.id,first.nextSelection.id);assert.deepEqual(next.units,first.units);assert.deepEqual(next.candidates,first.candidates);
});
test('이전 디스크 스키마는 원기록을 보존하고 context 컬럼을 추가한다',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const directory=await mkdtemp(join(tmpdir(),'taste-model-migration-'));let db,engine;
 try{
  db=new PGlite(directory);const schema=(await readFile(new URL('../tba-platform-pilot/schema.sql',import.meta.url),'utf8')).replace(" context jsonb NOT NULL DEFAULT '{}'::jsonb,",'');await db.exec(schema);
  await db.exec("INSERT INTO foods VALUES('f','음식','{}'); INSERT INTO users VALUES('u','synthetic_fixture'); INSERT INTO meals VALUES('m','u'); INSERT INTO experiences(id,owner,meal_id,food_id) VALUES('old','u','m','f')");await db.close();db=null;
  engine=await createTasteAnalysisEngine({dataDir:directory,evidenceClass:'synthetic_fixture'});await engine.createExperience({owner:'u',id:'new',mealId:'new-meal',foodId:'f',observedAt:'2026-09-01T00:00:00.000Z',dishKindIDs:['seafood']});await engine.close();engine=null;
  db=new PGlite(directory);const rows=(await db.query('SELECT id,context FROM experiences ORDER BY id')).rows;assert.deepEqual(rows.find(r=>r.id==='old').context,{});assert.deepEqual(rows.find(r=>r.id==='new').context.dishKindIDs,['seafood']);
 }finally{await engine?.close();await db?.close();await rm(directory,{recursive:true,force:true});}
});
