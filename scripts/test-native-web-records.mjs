import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'native-web-record-tests-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeRecordDeletion.ts'; export * from './src/lib/gastronomy/nativeRecord.ts'; export * from './src/lib/gastronomy/nativeRepository.ts'; export * from './src/lib/gastronomy/nativeArchive.ts'; export * from './src/lib/gastronomy/nativePerception.ts';",resolveDir:process.cwd()},outfile:path.join(temp,'contracts.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {deleteNativeRecord,readValidatedNativeRecords,nativeRecordPhotoFilenames,NativeRepository,blankSnapshot,newNativeRecord,readNativeRecords,replaceNativeRecord,prepareNativeRecord,makeSelection,overallEvaluation,canonical,encodeNativeValue,decodeNativeAccount,swiftTime,buildNativePerceptionRecords}=await import(path.join(temp,'contracts.mjs'));
const clone=v=>structuredClone(v);
const now=new Date('2026-09-22T12:00:00+09:00');
function draft(menu='시험 국수'){return {...newNativeRecord(undefined,now),menu,note:'원문',sensorySelections:[{...makeSelection('salty-balanced','bubble'),liking:'liked',intensity:'medium',target:'whole_dish',phase:'first_bite'}],tasteExperienceIDs:['salty-balanced'],overallEvaluation:overallEvaluation('liked')};}
function harness(enabled=true){
 const values=new Map(),photos=new Map();let remote=null,saves=0,failure=false,loseResponse=false,beforeSave;
 const storage={read:async owner=>clone(values.get(owner)??null),photo:async(owner,file)=>photos.get(owner+file)??null,update:async(owner,change,photo)=>{const next=change(clone(values.get(owner)??null));if(failure)throw Error('quota');values.set(owner,clone(next));if(photo)photos.set(owner+photo.filename,photo.blob);return clone(next);}};
 const transport={fetch:async()=>({enabled,remote:clone(remote)}),save:async(owner,snapshot,revision)=>{saves++;if(beforeSave)await beforeSave();if((remote?.revision??0)!==revision)throw Error('conflict');remote={snapshot:clone(snapshot),revision:revision+1};if(loseResponse)throw Error('lost response');return remote.revision;}};
 return {repo:new NativeRepository(storage,transport),storage,get remote(){return remote;},set remote(v){remote=v;},get saves(){return saves;},set fail(v){failure=v;},set lose(v){loseResponse=v;},set beforeSave(v){beforeSave=v;}};
}
test('creation produces a Swift-readable record without replacing other native values',()=>{const base={...blankSnapshot(),values:{profile:'dW50b3VjaGVkLWJhc2U2NA=='},photoFilenames:['existing.jpg'],futureFlag:{keep:true}};const next=replaceNativeRecord(base,draft(),null,now);assert.equal(next.values.profile,'dW50b3VjaGVkLWJhc2U2NA==');assert.deepEqual(next.photoFilenames,['existing.jpg']);assert.deepEqual(next.futureFlag,{keep:true});assert.equal(readNativeRecords(next).length,1);assert.equal(decodeNativeAccount(next,now).observations.filter(o=>o.facet==='overall')[0].value,'positive');});
test('optional responses are not manufactured',()=>{const e=draft();e.sensorySelections=[makeSelection('salty-balanced','bubble')];e.overallEvaluation=null;const data=decodeNativeAccount(replaceNativeRecord(blankSnapshot(),e,null,now),now);assert.equal(data.observations.filter(o=>o.facet==='liking'||o.facet==='overall').length,0);});
test('semantic uncertainty is preserved in originals, not blocked or invented',()=>{const e=draft();e.sensorySelections=[{...makeSelection('sweet-fruit-soft','bubble'),intensity:'strong'}];const s=replaceNativeRecord(blankSnapshot(),e,null,now);assert.equal(readNativeRecords(s)[0].sensorySelections[0].intensity,'strong');assert.equal(decodeNativeAccount(s,now).observations.filter(o=>o.facet==='intensity').length,0);});
test('correction keeps original unknown fields and increments revision',()=>{const e={...draft(),futureField:{value:3},savedAt:swiftTime(now)};const next=prepareNativeRecord({...e,note:'고친 원문'},e,new Date(+now+1000));assert.deepEqual(next.futureField,e.futureField);assert.equal(next.savedAt,e.savedAt);assert.equal(next.memoryRevision,1);assert.equal(next.memoryCorrections[0].before.note,'원문');assert.equal(next.memoryCorrections[0].after.note,'고친 원문');});
test('erasing a note removes it from correction history too',()=>{const a=prepareNativeRecord(draft(),undefined,now),b=prepareNativeRecord({...a,note:'두 번째'},a,new Date(+now+1000)),c=prepareNativeRecord({...b,note:''},b,new Date(+now+2000));assert.ok(c.memoryCorrections.every(h=>!('note' in h.before)));assert.ok(c.memoryCorrections.every(h=>!h.after.note));});
test('editing a note does not turn an existing intensity into a new response',()=>{const e=prepareNativeRecord({...draft(),mealTime:{source:'user_confirmed',start:swiftTime(now)}},undefined,now),edited=prepareNativeRecord({...e,note:'메모만 변경'},e,new Date(+now+1000));const before=buildNativePerceptionRecords([e]).records.find(r=>r.kind==='sensory_intensity'),after=buildNativePerceptionRecords([edited]).records.find(r=>r.kind==='sensory_intensity');assert.equal(before.knownAt,after.knownAt);});
test('a changed intensity gets its own correction timestamp',()=>{const e=prepareNativeRecord(draft(),undefined,now);const edited=prepareNativeRecord({...e,sensorySelections:e.sensorySelections.map(s=>({...s,intensity:'strong'}))},e,new Date(+now+1000));const records=buildNativePerceptionRecords([edited]).records;assert.equal(records.find(r=>r.kind==='sensory_intensity').knownAt,new Date(+now+1000).toISOString());assert.equal(records.find(r=>r.kind==='attribute_liking').knownAt,now.toISOString());});
test('add-menu draft preserves meal identity and date without reusing recipe identity',()=>{const e={...draft(),mealTime:{source:'user_confirmed',start:swiftTime(now)},foodSource:{kind:'homeCooked',homeCookingID:'recipe',version:1}};const added=newNativeRecord(e);assert.notEqual(added.id,e.id);assert.equal(added.mealID,e.mealID);assert.deepEqual(added.mealTime,e.mealTime);assert.equal(added.foodSource.homeCookingID,null);});
test('stale local editor cannot overwrite a newer original',()=>{const e=draft(),base=replaceNativeRecord(blankSnapshot(),e,null,now),saved=readNativeRecords(base)[0],next=replaceNativeRecord(base,{...saved,note:'newer'},saved,new Date(+now+1000));assert.throws(()=>replaceNativeRecord(next,{...saved,note:'stale'},saved));});
test('first load failure cannot seed an empty signed-in backup',async()=>{const h=harness();await assert.rejects(h.repo.commit('A',draft(),null));assert.equal(await h.repo.read('A'),null);assert.equal(h.saves,0);});
test('local create survives reload and sync writes exactly once',async()=>{const h=harness();await h.repo.refresh('A');const e=draft();await h.repo.commit('A',e,null);assert.equal((await h.repo.read('A')).dirty,true);await h.repo.sync('A');assert.equal(h.saves,1);assert.equal(readNativeRecords(h.remote.snapshot)[0].id,e.id);assert.equal((await h.repo.read('A')).dirty,false);await h.repo.sync('A');assert.equal(h.saves,1);});
test('guest data is durable locally and never sent to a remote account',async()=>{const h=harness(false);await h.repo.refresh('guest');await h.repo.commit('guest',draft(),null);await h.repo.sync('guest');assert.equal(h.saves,0);assert.equal(readNativeRecords((await h.repo.refresh('guest')).snapshot).length,1);});
test('accounts are isolated in local storage',async()=>{const h=harness(false);await h.repo.refresh('A');await h.repo.commit('A',draft(),null);await h.repo.refresh('B');assert.equal(readNativeRecords((await h.repo.read('B')).snapshot).length,0);assert.equal(readNativeRecords((await h.repo.read('A')).snapshot).length,1);});
test('revision conflict retains both snapshots without another write',async()=>{const h=harness();await h.repo.refresh('A');const local=draft('웹 기록');await h.repo.commit('A',local,null);h.remote={snapshot:replaceNativeRecord(blankSnapshot(),draft('다른 기기'),null,now),revision:1};await assert.rejects(h.repo.sync('A'),/다른 기기/);const cached=await h.repo.read('A');assert.equal(readNativeRecords(cached.snapshot)[0].menu,'웹 기록');assert.equal(readNativeRecords(cached.conflict.snapshot)[0].menu,'다른 기기');assert.equal(h.saves,0);});
test('choosing account copy retains the local snapshot as recovery',async()=>{const h=harness();await h.repo.refresh('A');await h.repo.commit('A',draft('웹 원본'),null);h.remote={snapshot:replaceNativeRecord(blankSnapshot(),draft('계정 원본'),null,now),revision:1};await h.repo.refresh('A');const next=await h.repo.useAccountCopy('A');assert.equal(readNativeRecords(next.snapshot)[0].menu,'계정 원본');assert.equal(readNativeRecords(next.recoveries[0].snapshot)[0].menu,'웹 원본');});
test('lost response is reconciled after reload without duplicate creates',async()=>{const h=harness();await h.repo.refresh('A');await h.repo.commit('A',draft(),null);h.lose=true;await assert.rejects(h.repo.sync('A'),/lost/);h.lose=false;await h.repo.refresh('A');await h.repo.sync('A');assert.equal(h.saves,1);assert.equal(readNativeRecords(h.remote.snapshot).length,1);assert.equal((await h.repo.read('A')).dirty,false);});
test('a local edit during sync stays dirty against the new revision',async()=>{const h=harness();await h.repo.refresh('A');await h.repo.commit('A',draft(),null);const current=readNativeRecords((await h.repo.read('A')).snapshot)[0];h.beforeSave=async()=>{await h.repo.commit('A',{...current,note:'sync 중 작성'},current);};await h.repo.sync('A');const local=await h.repo.read('A');assert.equal(local.revision,1);assert.equal(local.dirty,true);assert.equal(readNativeRecords(local.snapshot)[0].note,'sync 중 작성');assert.equal(readNativeRecords(h.remote.snapshot)[0].note,'원문');});
test('storage failure retains previous record and rejects completion',async()=>{const h=harness();await h.repo.refresh('A');h.fail=true;await assert.rejects(h.repo.commit('A',draft(),null),/quota/);assert.equal(readNativeRecords((await h.repo.read('A')).snapshot).length,0);});
test('unknown future schema never gets overwritten',async()=>{const h=harness();h.remote={snapshot:{...blankSnapshot(),schemaVersion:3},revision:4};await assert.rejects(h.repo.refresh('A'));assert.equal(h.saves,0);assert.equal(await h.repo.read('A'),null);});
test('malformed original rejects an update before any mutation',()=>{const base={...blankSnapshot(),values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([{id:'broken'}])}};assert.throws(()=>replaceNativeRecord(base,draft(),null));});
test('malformed optional source fields cannot replace a readable local archive',async()=>{for(const change of [{tasteExperienceIDs:'broken'},{sensorySelections:[null]},{memoryCorrections:[{revision:1,changedAt:1,before:null,after:{}}]}]){const h=harness();await h.repo.refresh('A');const before=await h.repo.read('A');h.remote={snapshot:{...blankSnapshot(),values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([{...draft(),...change}])}},revision:1};await assert.rejects(h.repo.refresh('A'));assert.deepEqual(await h.repo.read('A'),before);assert.equal(h.saves,0);}});
test('legacy omitted optional fields and opaque future source fields are preserved',()=>{const e={...draft(),tasteExperienceIDs:undefined,detailTagIDs:null,sensorySelections:null,futureSource:{keep:true}};const snapshot={...blankSnapshot(),values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([e])}};const records=readNativeRecords(snapshot);assert.deepEqual(records[0].futureSource,{keep:true});assert.equal(records[0].sensorySelections,null);});
test('confirmed meal day and actual save time remain separate',()=>{const meal=swiftTime(new Date('2026-09-20T00:00:00+09:00'));const s=replaceNativeRecord(blankSnapshot(),{...draft(),mealTime:{source:'user_confirmed',start:meal}},null,now);const e=readNativeRecords(s)[0];assert.equal(e.observedAt,meal);assert.equal(e.date,meal);assert.equal(e.savedAt,swiftTime(now));assert.notEqual(e.date,e.savedAt);});
test('quick capture is an archive record without sensory facts',()=>{const s=replaceNativeRecord(blankSnapshot(),{...draft(),feedbackStatus:'captured'},null,now);const data=decodeNativeAccount(s,now);assert.equal(data.records.length,1);assert.equal(data.observations.length,0);});
test('local photo and its source reference commit together',async()=>{const h=harness(false);await h.repo.refresh('guest');const photo={filename:'photo-test.jpg',blob:new Blob(['test-photo'],{type:'image/jpeg'})};const e={...draft(),reflectionPhotoFilename:photo.filename};const a=await h.repo.commit('guest',e,null,photo);assert.ok(a.snapshot.photoFilenames.includes(photo.filename));assert.equal((await h.repo.photo('guest',photo.filename)).size,photo.blob.size);assert.equal(await h.repo.photo('another-owner',photo.filename),null);});
test('mismatched photo filename cannot create a dangling record',async()=>{const h=harness(false);await h.repo.refresh('guest');await assert.rejects(h.repo.commit('guest',{...draft(),reflectionPhotoFilename:'expected.jpg'},null,{filename:'wrong.jpg',blob:new Blob(['x'],{type:'image/jpeg'})}));assert.equal(readNativeRecords((await h.repo.read('guest')).snapshot).length,0);assert.equal(await h.repo.photo('guest','wrong.jpg'),null);});
test('backup errors persist across remount without losing the local original',async()=>{const h=harness();await h.repo.refresh('A');await h.repo.commit('A',draft(),null);h.lose=true;await assert.rejects(h.repo.sync('A'));const a=await h.repo.read('A');assert.match(a.lastError,/lost response/);assert.equal(a.dirty,true);assert.equal(readNativeRecords(a.snapshot).length,1);});
test('a newer local edit survives both a lost response and the retry',async()=>{const h=harness();await h.repo.refresh('A');await h.repo.commit('A',draft(),null);const original=readNativeRecords((await h.repo.read('A')).snapshot)[0];h.beforeSave=async()=>h.repo.commit('A',{...original,note:'보관해야 할 새 원문'},original);h.lose=true;await assert.rejects(h.repo.sync('A'));h.beforeSave=undefined;h.lose=false;const cached=await h.repo.refresh('A');assert.equal(cached.revision,1);assert.equal(cached.dirty,true);assert.equal(readNativeRecords(cached.snapshot)[0].note,'보관해야 할 새 원문');await h.repo.sync('A');assert.equal(h.remote.revision,2);assert.equal(readNativeRecords(h.remote.snapshot).length,1);assert.equal(readNativeRecords(h.remote.snapshot)[0].note,'보관해야 할 새 원문');});


test('multi-photo records retain every photo through a web note edit and validate the full manifest',()=>{
 const entry={...draft(),reflectionPhotoFilename:'cover.jpg',additionalPhotoFilenames:['second.jpg','third.jpg']};
 const snapshot={...blankSnapshot(),values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([entry])},photoFilenames:['cover.jpg','second.jpg','third.jpg']};
 assert.deepEqual(nativeRecordPhotoFilenames(readValidatedNativeRecords(snapshot)[0]),snapshot.photoFilenames);
 const changed=replaceNativeRecord(snapshot,{...entry,note:'메모 수정'},entry,now);
 assert.deepEqual(readValidatedNativeRecords(changed)[0].additionalPhotoFilenames,['second.jpg','third.jpg']);
 assert.throws(()=>readValidatedNativeRecords({...snapshot,photoFilenames:['cover.jpg','second.jpg']}));
 const malformed={...entry,additionalPhotoFilenames:'second.jpg'};
 assert.throws(()=>readNativeRecords({...snapshot,values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([malformed])}}));
});
test('deleting a multi-photo record keeps shared photo references and removes its own gallery',()=>{
 const entry={...draft(),reflectionPhotoFilename:'cover.jpg',additionalPhotoFilenames:['shared.jpg','third.jpg']};
 const other={...draft('다른 음식'),reflectionPhotoFilename:'shared.jpg'};
 const snapshot={...blankSnapshot(),values:{'tastebuddy.ios.dining-entries.v1':encodeNativeValue([entry,other])},photoFilenames:['cover.jpg','shared.jpg','third.jpg','opaque.jpg']};
 const result=deleteNativeRecord(snapshot,entry);
 assert.deepEqual(result.photoFilenames,['shared.jpg','opaque.jpg']);
 assert.equal(readValidatedNativeRecords(result)[0].id,other.id);
});
test('a gallery-only edit is persisted instead of treated as an unchanged record',()=>{
 const before={...draft(),reflectionPhotoFilename:'cover.jpg',additionalPhotoFilenames:['second.jpg']};
 const after=prepareNativeRecord({...before,additionalPhotoFilenames:[]},before,now);
 assert.deepEqual(after.additionalPhotoFilenames,[]);
 assert.equal(after.note,before.note);
});

test('adding a gallery photo retains the cover and remains scoped to its owner',async()=>{
 const h=harness(false);await h.repo.refresh('A');await h.repo.refresh('B');
 const cover={filename:'gallery-cover.jpg',blob:new Blob(['cover'],{type:'image/jpeg'})};
 const created=await h.repo.commit('A',{...draft(),reflectionPhotoFilename:cover.filename},null,cover);
 const original=readValidatedNativeRecords(created.snapshot)[0];
 const second={filename:'gallery-second.jpg',blob:new Blob(['second'],{type:'image/jpeg'})};
 const added=await h.repo.commit('A',{...original,additionalPhotoFilenames:[second.filename]},original,second);
 const entry=readValidatedNativeRecords(added.snapshot)[0];
 assert.equal(entry.reflectionPhotoFilename,cover.filename);
 assert.deepEqual(entry.additionalPhotoFilenames,[second.filename]);
 assert.deepEqual(added.snapshot.photoFilenames,[cover.filename,second.filename]);
 assert.equal(await (await h.repo.photo('A',cover.filename)).text(),'cover');
 assert.equal(await (await h.repo.photo('A',second.filename)).text(),'second');
 assert.equal(await h.repo.photo('B',second.filename),null);
 assert.equal(readNativeRecords((await h.repo.read('B')).snapshot).length,0);
 await assert.rejects(h.repo.commit('A',{...original,additionalPhotoFilenames:[second.filename]},original,second),/원본이 변경/);
});
