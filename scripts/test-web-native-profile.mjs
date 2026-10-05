import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tb-native-profile-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeProfile.ts';export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'module.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(dir,'module.mjs')),now=new Date('2026-09-22T03:00:00Z');
const entry=(extra={})=>m.prepareNativeRecord({...m.newNativeRecord(undefined,now),menu:'프로필 검증',sensorySelections:[m.makeSelection('sour-fresh','bubble')],...extra},undefined,now);
const activity=rows=>m.nativeProfileActivity(m.buildNativeAnalysis(rows,'local-owner'));
test('empty profile has no invented measurement, rating or insight',()=>assert.deepEqual(activity([]),{sourceExperienceCount:0,completedExperienceCount:0,insightCount:0}));
test('completed records and meaningful evidence are distinct',()=>{
 const a=entry({sensorySelections:[],note:''}),b=entry(),c={...entry(),feedbackStatus:'captured'};
 const result=activity([a,b,c]);assert.equal(result.completedExperienceCount,2);assert.equal(result.sourceExperienceCount,1);assert.equal(result.insightCount,0);
});
test('multiple dishes of one meal are separate source records without a repeated preference',()=>{
 const a=entry({sensorySelections:[{...m.makeSelection('sour-fresh','bubble'),liking:'liked'}]}),b={...entry({sensorySelections:a.sensorySelections}),mealID:a.mealID};
 assert.deepEqual(activity([a,b]),{sourceExperienceCount:2,completedExperienceCount:2,insightCount:1});
});
test('fit-only response counts an insight without requiring liking',()=>assert.equal(activity([entry({sensorySelections:[{...m.makeSelection('sour-fresh','bubble'),preferenceFit:'justRight'}]})]).insightCount,1));
test('conflicting originals never inflate profile activity',()=>{
 const a=entry();assert.equal(activity([a,{...a,note:'conflict'}]).sourceExperienceCount,0);
});
test('native saved count unions legacy IDs with records and deduplicates restaurants',()=>{
 const base=m.blankSnapshot();base.values[m.NATIVE_SAVED_IDS]=m.encodeNativeValue(['a','a','legacy']);base.values[m.NATIVE_BOOKMARKS]=m.encodeNativeValue([{restaurantID:'a',restaurantName:'첫 식당',chefName:'',listID:'one',savedAt:1},{restaurantID:'a',restaurantName:'현재 식당',chefName:'',listID:'two',savedAt:2},{restaurantID:'b',restaurantName:'둘째',chefName:'',listID:'one',savedAt:3}]);
 const before=JSON.stringify(base),saved=m.readNativeProfileBookmarks(base);assert.deepEqual(saved.ids,['a','b','legacy']);assert.equal(saved.records[0].restaurantName,'현재 식당');assert.equal(saved.records[2].restaurantName,'');assert.equal(JSON.stringify(base),before);
});
test('missing native storage differs from explicitly empty native storage',()=>{
 const s=m.blankSnapshot();assert.equal(m.readNativeProfileBookmarks(s).present,false);s.values[m.NATIVE_SAVED_IDS]=m.encodeNativeValue([]);assert.equal(m.readNativeProfileBookmarks(s).present,true);
});
test('unreadable bookmark data is not reported as an empty list',()=>{
 for(const value of [{},[1],null]){const s=m.blankSnapshot();s.values[m.NATIVE_SAVED_IDS]=m.encodeNativeValue(value);assert.throws(()=>m.readNativeProfileBookmarks(s));}
 const s=m.blankSnapshot();s.values[m.NATIVE_BOOKMARKS]=m.encodeNativeValue([{restaurantID:'x'}]);assert.throws(()=>m.readNativeProfileBookmarks(s));
});
test('profile summary reports context presence and restriction count without exposing age',()=>{
 assert.equal(m.nativeProfileSummary({},[]),'기준 정보 미입력 · 식이제한 없음');assert.equal(m.nativeProfileSummary({birthDate:'1990-01-01'},['a','b']),'기준 정보 입력 · 식이제한 2개');
});
