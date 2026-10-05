import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'native-journal-tests-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeJournalPolicy.ts';export * from './src/lib/gastronomy/nativeHomeDiscoveries.ts';export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativeRepository.ts';",resolveDir:process.cwd()},outfile:path.join(temp,'module.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(temp,'module.mjs'));
const now=new Date('2026-09-22T12:00:00+09:00'),q={id:'question-instance-v2:test',sourceExperienceID:'11111111-1111-1111-1111-111111111111'},day=86400000;
const {blankSnapshot,updateQuestionHistory,readQuestionHistory,shouldPresentQuestion,migrateQuestionHistory,QUESTION_PROGRESS_KEY,NATIVE_MODEL_OWNER,encodeNativeValue,decodeNativeValue,swiftTime,visibleDiscoveries,updateDiscoveryHistory,mergeJournal,previewJournal,newNativeRecord,prepareNativeRecord,makeSelection,overallEvaluation,buildNativeAnalysis,buildNativeHomeDiscoveries,nativeDiscoveryIsCurrent}=m;
const progress=s=>readQuestionHistory(s)[NATIVE_MODEL_OWNER]?.[q.id];
const card=(id,subject=id,kind='timeGap',relevance=10)=>({id,revisionKey:`r:${id}`,meaningKey:`m:${id}`,subjectID:subject,kind,relevance,sortDate:+now});
const entry=(menu='국수',extra={})=>prepareNativeRecord({...newNativeRecord(undefined,now),menu,restaurant:'QA 식당',restaurantID:'QA-r1',foodSource:{kind:'restaurant',restaurantNamespace:'kakao',version:1},...extra},undefined,now);
const discoveries=(entries,options={})=>buildNativeHomeDiscoveries(entries,buildNativeAnalysis(entries,NATIVE_MODEL_OWNER),now,options);
test('question exposure and status preserve unknown account values, users and fields',()=>{
 const base={...blankSnapshot(),values:{unrelated:'b3BhcXVl',[QUESTION_PROGRESS_KEY]:encodeNativeValue({other:{keep:{questionID:'keep',firstExposedAt:0,status:'future',opaque:{safe:true}}}})}};
 const exposed=updateQuestionHistory(base,q,'exposed',now),again=updateQuestionHistory(exposed,q,'exposed',new Date(+now+10));assert.equal(again,exposed);assert.equal(exposed.values.unrelated,'b3BhcXVl');assert.deepEqual(readQuestionHistory(exposed).other,readQuestionHistory(base).other);assert.equal(progress(exposed).status,'active');
});
test('question defer, cannot recall, resolve and unknown states have native boundaries',()=>{
 for(const [status,duration] of [['deferred',day],['cannotRecall',30*day],['resolved',day]]){const p=progress(updateQuestionHistory(blankSnapshot(),q,status,now));assert.equal(shouldPresentQuestion(p,new Date(+now+duration-1)),false);assert.equal(shouldPresentQuestion(p,new Date(+now+duration)),true);}
 assert.equal(shouldPresentQuestion({...progress(updateQuestionHistory(blankSnapshot(),q,'active',now)),status:'future'},new Date(+now+99*day)),false);assert.equal(shouldPresentQuestion(progress(updateQuestionHistory(blankSnapshot(),q,'dismissed',now)),new Date(+now+99*day)),false);
});
test('legacy family completion delays existing sources once, never new sources',()=>{
 const family='next-selection:family',old={questionID:family,firstExposedAt:swiftTime(now)-100,status:'resolved',statusChangedAt:swiftTime(now)};
 const base={...blankSnapshot(),values:{[QUESTION_PROGRESS_KEY]:encodeNativeValue({[NATIVE_MODEL_OWNER]:{[family]:old}})}};
 const e=entry(),a={...q,familyID:family,sourceExperienceID:e.id.toLowerCase()},b={...a,id:'question-instance-v2:new',responseSourceID:'new'};
 const migrated=migrateQuestionHistory(base,[a,b],[{observationId:'new',knownAt:new Date(+now+1).toISOString()}],[e],now);
 assert.equal(readQuestionHistory(migrated)[NATIVE_MODEL_OWNER][a.id].status,'deferred');assert.equal(readQuestionHistory(migrated)[NATIVE_MODEL_OWNER][b.id],undefined);assert.equal(migrateQuestionHistory(migrated,[a],[],[e],new Date(+now+day)),migrated);assert.deepEqual(readQuestionHistory(migrated)[NATIVE_MODEL_OWNER][family],old);
});
test('resolved question reappearing from source erasure retains original cooldown',()=>{
 const base=updateQuestionHistory(blankSnapshot(),q,'resolved',now),next=migrateQuestionHistory(base,[q],[],[],new Date(+now+1000));assert.equal(progress(next).status,'active');assert.equal(progress(next).suppressedUntil,swiftTime(now)+86400);
});
test('corrupt question history never becomes an empty replacement',()=>{
 const base={...blankSnapshot(),values:{[QUESTION_PROGRESS_KEY]:encodeNativeValue({bad:[1,2]})}};assert.throws(()=>updateQuestionHistory(base,q,'exposed',now));assert.deepEqual(decodeNativeValue(base.values[QUESTION_PROGRESS_KEY]),{bad:[1,2]});
 const invalid={...blankSnapshot(),values:{[QUESTION_PROGRESS_KEY]:encodeNativeValue({'local-owner':{[q.id]:{questionID:q.id,firstExposedAt:0,status:'active',sourceEntryID:'bad-id'}}})}};assert.throws(()=>updateQuestionHistory(invalid,q,'exposed',now));
});
test('discovery read persists across revisions but new meaning waits only for subject cooldown',()=>{
 const a=card('a','menu'),history=updateDiscoveryHistory({},a,'read',now);assert.equal(visibleDiscoveries([{...a,revisionKey:'changed'}],history,new Date(+now+2*day)).length,0);
 assert.equal(visibleDiscoveries([{...a,meaningKey:'new'}],history,new Date(+now+day-1)).length,0);assert.equal(visibleDiscoveries([{...a,meaningKey:'new'}],history,new Date(+now+day)).length,1);
});
test('explicit snooze persists seven days across revisions and meaning changes',()=>{
 const a=card('a'),history=updateDiscoveryHistory({},a,'snooze',now),updated={...a,revisionKey:'new',meaningKey:'new'};assert.equal(visibleDiscoveries([updated],history,new Date(+now+7*day-1)).length,0);assert.equal(visibleDiscoveries([updated],history,new Date(+now+7*day)).length,1);
});
test('diverse discoveries rank first without permanently dropping same-subject perspectives',()=>{
 const rows=[card('a','one','timeGap',80),card('b','one','lastYear',70),card('c','two','timeGap',60),card('d','three','restaurantCollection',50)];
 assert.deepEqual(visibleDiscoveries(rows,{},now).map(c=>c.id),['a','d','c','b']);assert.equal(visibleDiscoveries(rows,{},now,0).length,0);
});
test('merged queue alternates discovery first, preview caps one or three and refills',()=>{
 const items=mergeJournal([{id:'q1'},{id:'q2'},{id:'q3'},{id:'q4'}],[card('a','same'),card('b','same'),card('c','other')]);
 assert.deepEqual(items.slice(0,4).map(i=>i.type),['discovery','question','discovery','question']);assert.equal(previewJournal(items,1).length,1);assert.deepEqual(previewJournal(items,3).map(i=>i.id),['discovery:r:a','question:q1','question:q2']);assert.deepEqual(previewJournal(items.slice(1),3).map(i=>i.id),['question:q1','discovery:r:b','question:q2']);assert.equal(items.length,7);
});
test('history cap retains fresh subject and snooze controls ahead of permanent read keys',()=>{
 const history=Object.fromEntries(Array.from({length:2050},(_,i)=>[`read:${i}`,Date.UTC(4001,0,1)])),a=card('new','new');const next=updateDiscoveryHistory(history,a,'snooze',now);assert.equal(Object.keys(next).length,2048);assert.equal(next['snooze:new'],+now+7*day);
});
test('restaurant discovery uses explicit namespaces, independent meals and native milestones',()=>{
 const rows=['국수','만두','김밥'].map(menu=>entry(menu));assert.ok(discoveries(rows).some(c=>c.kind==='restaurantCollection'));
 const same=rows.map(e=>({...e,mealID:rows[0].mealID}));assert.equal(discoveries(same).some(c=>c.kind==='restaurantCollection'),false);
 assert.equal(discoveries(rows.map((e,i)=>({...e,foodSource:{...e.foodSource,restaurantNamespace:`provider-${i}`}}))).some(c=>c.kind==='restaurantCollection'),false);
 const noIDs=rows.map(e=>({...e,restaurantID:null}));assert.equal(discoveries(noIDs).some(c=>c.kind==='restaurantCollection'),false);
});
test('discovery read meaning is stable across note/photo changes and count within milestone',()=>{
 const rows=['국수','만두','김밥'].map(menu=>entry(menu)),first=discoveries(rows).find(c=>c.kind==='restaurantCollection');
 const edited=prepareNativeRecord({...rows[0],note:'수정'},rows[0],new Date(+now-1)),second=discoveries([edited,...rows.slice(1)]).find(c=>c.kind==='restaurantCollection');assert.equal(first.meaningKey,second.meaningKey);assert.notEqual(first.revisionKey,second.revisionKey);assert.equal(nativeDiscoveryIsCurrent(first,[edited,...rows.slice(1)]),false);
 const fourth=discoveries([...rows,entry('우동')]).find(c=>c.kind==='restaurantCollection');assert.equal(first.meaningKey,fourth.meaningKey);const fifth=discoveries([...rows,entry('우동'),entry('라면')]).find(c=>c.kind==='restaurantCollection');assert.notEqual(first.meaningKey,fifth.meaningKey);
});
test('repeated satisfaction keeps negative and missing records as evidence',()=>{
 const rows=[...Array.from({length:3},()=>entry('국수',{overallEvaluation:overallEvaluation('liked')})),entry('국수',{overallEvaluation:overallEvaluation('disliked')}),entry('국수')];const c=discoveries(rows).find(c=>c.kind==='repeatedGoodEvaluation');assert.ok(c);assert.equal(c.entryIDs.length,5);assert.equal(c.numeratorIDs.length,3);assert.equal(c.denominatorIDs.length,4);
 assert.equal(discoveries([...rows,entry('국수',{overallEvaluation:overallEvaluation('disliked')})]).some(c=>c.kind==='repeatedGoodEvaluation'),false);
});
test('sensory cooccurrence is in the same dish and does not infer absent or unknown sensations',()=>{
 const choices=[makeSelection('sour-fresh','bubble'),makeSelection('salty-balanced','bubble')];const together=Array.from({length:3},()=>entry('국수',{sensorySelections:choices}));assert.ok(discoveries(together).some(c=>c.kind==='sensoryCooccurrence'));
 const apart=together.flatMap(e=>[{...e,sensorySelections:[choices[0]]},{...entry('만두'),mealID:e.mealID,sensorySelections:[choices[1]]}]);assert.equal(discoveries(apart).some(c=>c.kind==='sensoryCooccurrence'),false);
});
test('date unknown, conflicting and future meals do not become temporal discoveries',()=>{
 const past=new Date(+now-100*day),recent=new Date(+now-day),a=entry('국수',{mealTime:{source:'user_confirmed',start:swiftTime(past)}}),b=entry('국수',{mealTime:{source:'user_confirmed',start:swiftTime(recent)}});
 assert.ok(discoveries([a,b]).some(c=>c.kind==='timeGap'));assert.equal(discoveries([{...a,mealTime:null},b]).some(c=>c.kind==='timeGap'),false);
 assert.equal(discoveries([a,b,{...entry('다른 요리'),mealID:b.mealID,mealTime:null}]).some(c=>c.kind==='timeGap'),false);
 assert.equal(discoveries([a,{...b,mealTime:{source:'user_confirmed',start:swiftTime(new Date(+now+day))}}]).some(c=>c.kind==='timeGap'),false);
});
test('stale sensory analysis cannot supply evidence for corrected originals',()=>{
 const rows=Array.from({length:3},()=>entry('국수',{overallEvaluation:overallEvaluation('liked')})),snapshot=buildNativeAnalysis(rows,NATIVE_MODEL_OWNER);const edited=rows.map(e=>prepareNativeRecord({...e,overallEvaluation:overallEvaluation('disliked')},e,new Date(+now+1)));
 assert.equal(buildNativeHomeDiscoveries(edited,snapshot,now).some(c=>c.kind==='repeatedGoodEvaluation'),false);
});
function repository(){let state=null,fail=false;const storage={read:async()=>structuredClone(state),photo:async()=>null,update:async(owner,change)=>{const next=change(structuredClone(state));if(fail)throw Error('storage full');state=structuredClone(next);return structuredClone(next);}};return {repo:new m.NativeRepository(storage,{fetch:async()=>({enabled:false,remote:null}),save:async()=>{throw Error('unexpected remote');}}),fail:()=>{fail=true;}};}
test('answer and question status commit atomically and metadata failure retains original',async()=>{
 const {repo}=repository();await repo.refresh('guest');const e=entry();await repo.commit('guest',e,null);const before=m.readNativeRecords((await repo.read('guest')).snapshot)[0];const next={...before,note:'edited'};
 await assert.rejects(repo.commit('guest',next,before,undefined,()=>{throw Error('unreadable progress');}));assert.equal(m.readNativeRecords((await repo.read('guest')).snapshot)[0].note,before.note);
 const after=await repo.commit('guest',next,before,undefined,s=>updateQuestionHistory(s,q,'resolved',now));assert.equal(m.readNativeRecords(after.snapshot)[0].note,'edited');assert.equal(progress(after.snapshot).status,'resolved');
});
test('failed local progress write never changes originals or reports successful completion',async()=>{
 const h=repository();await h.repo.refresh('guest');await h.repo.commit('guest',entry(),null);const before=await h.repo.read('guest');h.fail();await assert.rejects(h.repo.changeSnapshot('guest',s=>updateQuestionHistory(s,q,'deferred',now)));assert.deepEqual(await h.repo.read('guest'),before);
});
test('unresolved same-meal sensory fields cannot be promoted by another dish',()=>{
 const a=makeSelection('sour-fresh','bubble'),b=makeSelection('salty-balanced','bubble');
 const rows=Array.from({length:3},()=>entry('국수',{sensorySelections:[a,b]}));
 const extra=rows.map(e=>({...entry('문제 선택'),sensorySelections:[{...a,catalogVersion:'future/999'}],mealID:e.mealID}));
 assert.equal(discoveries([...rows,...extra]).some(c=>c.kind==='sensoryCooccurrence'),false);
});
test('month discovery identity does not become new at each midnight',()=>{
 const rows=['국수','만두','김밥'].map(menu=>entry(menu,{mealTime:{source:'user_confirmed',start:swiftTime(new Date(+now-5*day))}}));const snapshot=buildNativeAnalysis(rows,NATIVE_MODEL_OWNER);
 const a=buildNativeHomeDiscoveries(rows,snapshot,now,{period:'month'}).find(c=>c.kind==='restaurantCollection'),b=buildNativeHomeDiscoveries(rows,snapshot,new Date(+now+day),{period:'month'}).find(c=>c.kind==='restaurantCollection');assert.equal(a.id,b.id);assert.equal(a.meaningKey,b.meaningKey);
});
