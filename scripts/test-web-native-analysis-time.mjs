import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {build} from 'esbuild';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'tba-policy-time-'));
after(()=>fs.rm(temp,{recursive:true,force:true}));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeAnalysisPresentation.ts';export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativeRepository.ts';export * from './src/lib/gastronomy/nativeRecordDeletion.ts';export {buildPersonalTasteModel} from './scripts/tba-engine/personal-taste-model.mjs';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:path.join(temp,'web.mjs'),logLevel:'silent'});
const {buildNativeAnalysis,nativeAnalysisGroups,makeSelection,newNativeRecord,prepareNativeRecord,swiftTime,buildPersonalTasteModel,NativeRepository,readNativeRecords,deleteNativeRecord,DINING_KEY,encodeNativeValue}=await import(path.join(temp,'web.mjs'));
const meal=new Date('2026-10-01T03:00:00Z'),saved=new Date('2026-10-01T04:00:00Z'),reference=new Date('2026-10-13T08:00:00Z');
const entry=extra=>({...prepareNativeRecord({...newNativeRecord(undefined,saved),menu:'합성 정책 음식',note:'',sensorySelections:[{...makeSelection('sour-fresh','bubble'),liking:'liked'}]},undefined,saved),...extra});
const confirmed={source:'user_confirmed',start:swiftTime(meal),confirmedAt:swiftTime(saved)};
const past=s=>buildPersonalTasteModel({userId:'owner',records:s.observations},{asOf:'2026-10-02T00:00:00Z',_assessQuestions:false});
for(const source of ['recorded_only','unknown','photo_candidate','approximate_period']) test(`unconfirmed ${source} retains current evidence, not historical meal time`,()=>{
 const e=entry({mealTime:{...confirmed,source}}),original=structuredClone(e),s=buildNativeAnalysis([e],'owner',reference);
 assert.equal(s.model.units.length,1);assert.ok(s.observations.every(o=>o.observedAt===null));assert.equal(past(s).units.length,0);
 assert.ok(nativeAnalysisGroups(s).length>0);assert.deepEqual(e,original);
});
test('confirmed meal time overrides a conflicting raw date, including offset-equivalent times',()=>{
 const e=entry({observedAt:swiftTime(reference),date:swiftTime(reference),mealTime:confirmed}),s=buildNativeAnalysis([e],'owner',reference);
 assert.equal(s.observations[0].observedAt,meal.toISOString());assert.equal(past(s).units.length,1);
 const same=entry({mealTime:{...confirmed,start:swiftTime(new Date('2026-10-01T12:00:00+09:00'))}});
 assert.equal(buildNativeAnalysis([same],'owner',reference).observations[0].observedAt,s.observations[0].observedAt);
});
test('future confirmed meal cannot produce type, candidates, fallback or questions',()=>{
 const e=entry({mealTime:{...confirmed,start:swiftTime(new Date('2027-01-01T03:00:00Z'))}}),s=buildNativeAnalysis([e],'owner',reference);
 assert.equal(s.completed.length,0);assert.equal(s.observations.length,0);assert.equal(s.model.units.length,0);
 assert.equal(s.mainWing.main,null);assert.equal(nativeAnalysisGroups(s).length,0);assert.equal(s.model.queuedSelections.length,0);
});
test('future knownAt cannot bypass the current snapshot through an undated source',()=>{
 const e=entry({savedAt:swiftTime(new Date('2027-01-01T03:00:00Z')),updatedAt:undefined,memoryCorrections:[],mealTime:null});
 const s=buildNativeAnalysis([e],'owner',reference);assert.equal(s.observations.length,0);assert.equal(s.model.units.length,0);assert.equal(s.mainWing.main,null);
});
test('legacy and invalid meal metadata remain undated rather than using save time',()=>{
 for(const mealTime of [null,{source:'user_confirmed',start:null},{source:'user_confirmed',start:NaN}]) {
  const s=buildNativeAnalysis([entry({mealTime})],'owner',reference);
  assert.equal(s.model.units.length,1);assert.equal(s.observations[0].observedAt,null);
 }
 assert.throws(()=>buildNativeAnalysis([],'owner',new Date(NaN)),/INVALID_ANALYSIS_REFERENCE_DATE/);
});
test('repository save, restore, date correction, deletion and account isolation reach actual analysis',async()=>{
 const store=new Map();let fail=false;
 const clone=structuredClone;
 const storage={read:async owner=>clone(store.get(owner)??null),photo:async()=>null,update:async(owner,change)=>{const next=change(clone(store.get(owner)??null));if(fail)throw Error('synthetic storage failure');store.set(owner,clone(next));return clone(next);}};
 const transport={fetch:async()=>({enabled:false,remote:null}),save:async()=>{throw Error('No remote calls are permitted in this test');}};
 const repo=new NativeRepository(storage,transport);await repo.refresh('A');await repo.refresh('B');
 const e=entry({mealTime:{source:'recorded_only',start:swiftTime(meal)},futureOpaque:{keep:true}});
 await repo.commit('A',e,null);
 const restoredRepo=new NativeRepository(storage,transport);
 const records=async owner=>readNativeRecords((await restoredRepo.read(owner)).snapshot);
 let r=(await records('A'))[0];const id=r.id,mealID=r.mealID,savedAt=r.savedAt;
 assert.equal(buildNativeAnalysis(await records('A'),'A').model.units.length,1);
 assert.equal(buildNativeAnalysis(await records('B'),'B').model.units.length,0);
 const future={...r,mealTime:{source:'user_confirmed',start:swiftTime(new Date(Date.now()+86400000))}};
 // Ordinary writes already reject a future meal. Verify that protection, then
 // simulate an old/restored archive containing it, using only the in-memory test store.
 await assert.rejects(restoredRepo.commit('A',future,r),/확인한 식사일/);
 assert.deepEqual((await records('A'))[0],r);
 await restoredRepo.changeSnapshot('A',snapshot=>({...snapshot,values:{...snapshot.values,[DINING_KEY]:encodeNativeValue([future])}}));
 r=(await records('A'))[0];
 assert.equal(buildNativeAnalysis([r],'A').model.units.length,0);
 fail=true;await assert.rejects(restoredRepo.commit('A',{...r,mealTime:confirmed},r),/synthetic storage/);fail=false;
 assert.deepEqual((await records('A'))[0],r);
 await restoredRepo.commit('A',{...r,mealTime:confirmed},r);r=(await records('A'))[0];
 assert.equal(buildNativeAnalysis([r],'A').model.units.length,1);
 assert.equal(r.id,id);assert.equal(r.mealID,mealID);assert.equal(r.savedAt,savedAt);assert.deepEqual(r.futureOpaque,{keep:true});
 await restoredRepo.changeSnapshot('A',snapshot=>deleteNativeRecord(snapshot,r));
 assert.equal(buildNativeAnalysis(await records('A'),'A').model.units.length,0);
 assert.equal((await records('B')).length,0);
});
