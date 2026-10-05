import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tb-profile-backup-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeProfileIdentity.ts';export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativeRepository.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'web.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(dir,'web.mjs'));
const edit={displayName:'QA 이름',nickname:'@qa-buddy@',birthDate:'1990-02-28',sexContext:'prefer_not_to_say',smokingStatus:'never',dietaryRestrictions:['vegan']};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=';
const apply=(s,e=edit,a)=>m.updateNativeProfileIdentity(s,e,m.profileSignature(s),a);
test('identity JSON and avatar bytes use the native Data envelope in one snapshot',()=>{
 const s=m.blankSnapshot();s.values.unrelated=m.encodeNativeValue({future:true});s.photoFilenames=['dining.jpg'];
 const result=apply(s,edit,png),r=m.readNativeProfileIdentity(result);assert.equal(r.identity.displayName,'QA 이름');assert.equal(r.identity.nickname,'qa-buddy');assert.equal(result.values[m.PROFILE_AVATAR_KEY],png);assert.match(r.avatarDataUrl,/^data:image\/png;base64,/);assert.deepEqual(result.photoFilenames,s.photoFilenames);assert.equal(result.values.unrelated,s.values.unrelated);assert.equal(s.values[m.PROFILE_IDENTITY_KEY],undefined);
});
test('future identity fields and unsupported unchanged context survive edits',()=>{
 const s=apply(m.blankSnapshot());s.values[m.PROFILE_IDENTITY_KEY]=m.encodeNativeValue({...edit,sexContext:'future-context',opaque:{keep:1}});
 const next=apply(s,{...edit,displayName:'수정',sexContext:null});const identity=m.readNativeProfileIdentity(next).identity;assert.deepEqual(identity.opaque,{keep:1});assert.equal(identity.sexContext,'future-context');
});
test('photo removal deletes only avatar bytes and never existing media or observations',()=>{
 const s=apply(m.blankSnapshot(),edit,png);s.values.custom='b3BhcXVl';s.photoFilenames=['meal.jpg'];const n=apply(s,edit,null);assert.equal(n.values[m.PROFILE_AVATAR_KEY],undefined);assert.equal(n.values.custom,'b3BhcXVl');assert.deepEqual(n.photoFilenames,['meal.jpg']);assert.equal(m.readNativeProfileIdentity(n).present,true);
});
test('unsupported native photo bytes remain backed up until explicitly removed',()=>{
 const s=apply(m.blankSnapshot());s.values[m.PROFILE_AVATAR_KEY]=btoa('future-image-format');const r=m.readNativeProfileIdentity(s);assert.equal(r.unsupportedAvatar,true);assert.equal(r.avatarDataUrl,null);assert.equal(apply(s).values[m.PROFILE_AVATAR_KEY],s.values[m.PROFILE_AVATAR_KEY]);assert.equal(apply(s,edit,null).values[m.PROFILE_AVATAR_KEY],undefined);
});
test('unreadable profile or avatar is not replaced by empty defaults',()=>{
 for(const [key,value] of [[m.PROFILE_IDENTITY_KEY,m.encodeNativeValue({displayName:1})],[m.PROFILE_AVATAR_KEY,'not-base64']]){const s=m.blankSnapshot();s.values[key]=value;assert.throws(()=>apply(s));assert.equal(s.values[key],value);}
});
test('old editor cannot overwrite a changed identity or changed photo',()=>{
 const s=apply(m.blankSnapshot()),sig=m.profileSignature(s);for(const changed of [apply(s,{...edit,displayName:'다른 탭'}),apply(s,edit,png)])assert.throws(()=>m.updateNativeProfileIdentity(changed,edit,sig));
});
test('unrelated dining updates merge without invalidating profile editor',()=>{
 const s=apply(m.blankSnapshot()),sig=m.profileSignature(s),changed={...s,values:{...s.values,newField:'preserve'}};
 const n=m.updateNativeProfileIdentity(changed,{...edit,displayName:'수정'},sig);assert.equal(n.values.newField,'preserve');
});
test('unchanged profile is a no-op, invalid date and oversized snapshots fail before replacement',()=>{
 const s=apply(m.blankSnapshot());assert.equal(apply(s),s);assert.throws(()=>apply(s,{...edit,birthDate:'2026-02-30'}));assert.throws(()=>apply(s,{...edit,nickname:'@@'}));const big={...s,values:{...s.values,padding:'x'.repeat(16*1024*1024)}};assert.throws(()=>apply(big));
});
function repository(){let saved=new Map(),fail=false,remote=null,saves=0;const storage={read:async owner=>structuredClone(saved.get(owner)??null),photo:async()=>null,update:async(owner,change)=>{const next=change(structuredClone(saved.get(owner)??null));if(fail)throw Error('disk full');saved.set(owner,structuredClone(next));return structuredClone(next);}};const transport={fetch:async()=>({enabled:true,remote:structuredClone(remote)}),save:async(owner,snapshot,revision)=>{saves++;remote={snapshot:structuredClone(snapshot),revision:revision+1};return revision+1;}};return {repo:new m.NativeRepository(storage,transport),storage,transport,fail:()=>fail=true,remote:value=>remote=value,saves:()=>saves};}
test('failed transaction cannot partially save identity or photo',async()=>{
 const h=repository();await h.repo.refresh('A');const before=await h.repo.read('A');h.fail();await assert.rejects(h.repo.changeSnapshot('A',s=>apply(s,edit,png)));assert.deepEqual(await h.repo.read('A'),before);
});
test('account originals stay separate and restored snapshots preserve raw photo bytes',async()=>{
 const h=repository();await h.repo.refresh('A');await h.repo.refresh('B');await h.repo.changeSnapshot('A',s=>apply(s,edit,png));assert.equal(m.readNativeProfileIdentity((await h.repo.read('B')).snapshot).identity,null);await h.repo.sync('A');const storage={read:async()=>null,photo:async()=>null,update:async(o,change)=>change(null)};const restored=await new m.NativeRepository(storage,h.transport).refresh('A');assert.equal(restored.snapshot.values[m.PROFILE_AVATAR_KEY],png);assert.equal(m.readNativeProfileIdentity(restored.snapshot).identity.displayName,edit.displayName);
});
test('remote revision conflict keeps local profile and photo recoverable without a write',async()=>{
 const h=repository();await h.repo.refresh('A');await h.repo.changeSnapshot('A',s=>apply(s,edit,png));h.remote({snapshot:apply(m.blankSnapshot(),{...edit,displayName:'다른 기기'}),revision:4});await assert.rejects(h.repo.sync('A'));const current=await h.repo.read('A');assert.equal(current.snapshot.values[m.PROFILE_AVATAR_KEY],png);assert.equal(m.readNativeProfileIdentity(current.conflict.snapshot).identity.displayName,'다른 기기');assert.equal(h.saves(),0);
});
test('malformed remote profile never replaces a valid local snapshot',async()=>{
 const h=repository();await h.repo.refresh('A');await h.repo.changeSnapshot('A',s=>apply(s,edit,png));await h.repo.sync('A');const before=await h.repo.read('A');
 const bad=m.blankSnapshot();bad.values[m.PROFILE_IDENTITY_KEY]=m.encodeNativeValue({displayName:5});h.remote({snapshot:bad,revision:2});await assert.rejects(h.repo.refresh('A'));assert.deepEqual(await h.repo.read('A'),before);
});
// Inject fake sessions and public transport; never call a live account in this test.
await build({entryPoints:['src/lib/gastronomy/nativeProfilePublish.ts'],outfile:path.join(dir,'publish.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent',define:{'import.meta.env.VITE_SUPABASE_URL':'"https://qa.invalid"','import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':'"public-test-key"','import.meta.env.VITE_SUPABASE_ANON_KEY':'""'},plugins:[{name:'mock',setup(b){b.onResolve({filter:/^(\.\.\/supabase|@supabase\/supabase-js)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.startsWith('@')?'export const createClient=(...args)=>globalThis.profilePublishMock.client(...args);':'export const getCurrentSupabaseSession=()=>globalThis.profilePublishMock.session();',loader:'js'}));}}]});
const {publishNativeProfileIdentity}=await import(path.join(dir,'publish.mjs'));
test('public sync pins the original token and skips metadata when the owner changes',async()=>{
 const originalFetch=globalThis.fetch;let fetched=0,token,filter;const sessions=[{user:{id:'A'},access_token:'token-A'},{user:{id:'B'},access_token:'token-B'}];
 globalThis.fetch=async()=>{fetched++;return {ok:true}};globalThis.profilePublishMock={session:async()=>sessions.shift(),client:(u,k,options)=>({from:()=>({upsert:async(values)=>{token=await options.accessToken();filter=values.id;assert.deepEqual(Object.keys(values).sort(),['display_name','id','nickname']);return {error:null};}})})};
 try{await assert.rejects(publishNativeProfileIdentity('A','Name','handle'));assert.equal(token,'token-A');assert.equal(filter,'A');assert.equal(fetched,0);}finally{globalThis.fetch=originalFetch;delete globalThis.profilePublishMock;}
});
test('guest save does not publish and wrong-owner requests are rejected before sending',async()=>{
 globalThis.profilePublishMock={session:async()=>null,client:()=>{throw Error('unexpected request')}};await publishNativeProfileIdentity('guest','Name','handle');globalThis.profilePublishMock.session=async()=>({user:{id:'B'},access_token:'token-B'});await assert.rejects(publishNativeProfileIdentity('A','Name','handle'));delete globalThis.profilePublishMock;
});
test('public delivery creates a missing profile and sends only names with the admitted token',async()=>{
 const oldFetch=globalThis.fetch;let row,request;globalThis.profilePublishMock={session:async()=>({user:{id:'A'},access_token:'token-A'}),client:()=>({from:()=>({upsert:async(values,options)=>{row=values;assert.equal(options.onConflict,'id');return {error:null};}})})};globalThis.fetch=async(url,options)=>{request={url,...options};return {ok:true};};
 try{await publishNativeProfileIdentity('A','Name','handle');assert.deepEqual(row,{id:'A',display_name:'Name',nickname:'handle'});assert.equal(request.headers.Authorization,'Bearer token-A');assert.deepEqual(JSON.parse(request.body),{data:{display_name:'Name',nickname:'handle'}});}finally{globalThis.fetch=oldFetch;delete globalThis.profilePublishMock;}
});
