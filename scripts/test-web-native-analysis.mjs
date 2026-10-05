import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {sha256} from './tba-engine/sha256.mjs';
import {buildPersonalTasteModel,predictPersonalTaste} from './tba-engine/personal-taste-model.mjs';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'native-analysis-web-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeAnalysisPresentation.ts';export * from './src/lib/gastronomy/nativeQuestions.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},bundle:true,platform:'browser',format:'esm',outfile:path.join(temp,'analysis.mjs'),logLevel:'silent'});
const {buildNativeAnalysis,nativeAnalysisSources,nativeAnalysisGroups,nativeQuestionChoices,applyNativeQuestion,newNativeRecord,makeSelection,overallEvaluation,prepareNativeRecord}=await import(path.join(temp,'analysis.mjs'));
const now=new Date('2026-09-22T01:00:00Z');
const entry=(extra={})=>prepareNativeRecord({...newNativeRecord(undefined,now),menu:'QA 국수',restaurant:'QA 식당',sensorySelections:[{...makeSelection('sour-fresh','bubble')}],...extra},undefined,now);
const native=rows=>buildNativeAnalysis(rows,'owner');
const fixture=JSON.parse(await fs.readFile('ios/TasteBuddy/Resources/TBA/personal-taste-model-contract.json','utf8'));
test('v2 instances cannot lend strength to another instance in the type profile',()=>{
 const choice=(instanceID,extra={})=>({...makeSelection('v2.bubble.sweet.basic','bubble'),selectionInstanceID:instanceID,...extra});
 const split=native([1,2].map(n=>entry({sensorySelections:[choice(`strength-${n}`,{intensity:'strong'}),choice(`liking-${n}`,{liking:'liked'})]})));
 assert.equal(split.unresolved.length,0);
 assert.ok(split.model.units.every(u=>u.intensity===null));
 assert.equal(split.mainWing.candidates.find(c=>c.id==='maximalist').eligible,false);
 const joined=native([1,2].map(n=>entry({sensorySelections:[choice(`both-${n}`,{intensity:'strong',liking:'liked'})]})));
 assert.equal(joined.mainWing.candidates.find(c=>c.id==='maximalist').eligible,true);
});
test('displayed liking count excludes neutral meals while retaining total coverage',()=>{
 const s=native(['liked','liked','liked','neutral'].map(liking=>entry({sensorySelections:[{...makeSelection('sour-fresh','bubble'),liking}]})));
 const group=nativeAnalysisGroups(s).find(g=>g.kind==='candidate');
 assert.match(group.body,/4번의 식사 중 3번에서 호감/);
 assert.equal(group.mealIDs.length,4);
});
test('v2 follow-up answers stay attached to the selected instance',()=>{
 const first={...makeSelection('v2.detail.texture.soft','detailTag'),selectionInstanceID:'surface',target:'surface',scopeKind:'component'};
 const second={...first,selectionInstanceID:'inside',target:'inside'};
 const e=entry({sensorySelections:[first,second]}),s=native([e]);
 const source=s.observations.find(o=>o.kind==='sensory_detail'&&o.selectionEvidence?.selectionInstanceID==='inside');
 assert.ok(source);
 const edited=applyNativeQuestion(e,source,'liking','liked');
 assert.ok(edited);
 assert.equal(edited.sensorySelections[0].liking,undefined);
 assert.equal(edited.sensorySelections[1].liking,'liked');
});
test('portable SHA256 preserves Node identities for Unicode and block boundaries',()=>{
 for(const n of [0,1,55,56,63,64,65,1000,65537])for(const seed of ['a','산미 🍜/"']){const text=seed.repeat(n);assert.equal(sha256(text),createHash('sha256').update(text).digest('hex'));}
});
test('all frozen iOS shared model fixtures and predictions remain exact',()=>{
 for(const f of fixture.fixtures){const model=buildPersonalTasteModel({userId:f.userID,records:f.records},{asOf:f.asOf});assert.deepEqual(model,f.expected,f.id);for(const prediction of f.predictions)assert.deepEqual(predictPersonalTaste(model,prediction.query),prediction.expected,f.id);}
});
test('browser source preserves observed, saved, overall, and sensory evidence separately',()=>{
 const e=entry({overallEvaluation:overallEvaluation('liked'),note:'단맛이 강하지 않았어요.'}),s=native([e]);
 assert.equal(s.completed.length,1);assert.ok(s.observations.some(o=>o.kind==='overall_liking'));assert.equal(s.observations.filter(o=>o.kind==='attribute_liking').length,0);assert.ok(s.unresolved.some(o=>o.phrase.includes('단맛')));assert.equal(s.model.units.length,0);
});
test('quick capture and conflicting copies cannot produce analysis',()=>{
 const e=entry();assert.equal(native([{...e,feedbackStatus:'captured'}]).observations.length,0);assert.equal(native([e,{...e,note:'different'}]).observations.length,0);
});
test('same-meal dishes count once and cannot supply repeated direction',()=>{
 const e=entry({sensorySelections:[{...makeSelection('sour-fresh','bubble'),liking:'liked'}]}),other={...entry(),mealID:e.mealID,sensorySelections:e.sensorySelections};
 const s=native([e,other]);assert.ok(s.model.candidates.every(c=>c.distribution.mealCount===1&&c.direction===null));assert.equal(s.mainWing.status,'learning');
});
test('questions stay attached to individual originals and stable across reorder',()=>{
 const a=entry(),b=entry(),s=native([a,b]),reverse=native([b,a]);
 const liking=s.model.queuedSelections.filter(q=>q.facet==='liking');assert.equal(liking.length,2);assert.notEqual(liking[0].id,liking[1].id);assert.deepEqual(reverse.model.queuedSelections,s.model.queuedSelections);
 const q=liking[0],source=s.observations.find(o=>o.observationId===q.responseSourceID),e=[a,b].find(e=>e.id.toLowerCase()===source.experienceId);
 const amended=applyNativeQuestion(e,source,'liking','liked');assert.equal(amended.mealID,e.mealID);assert.equal(amended.savedAt,e.savedAt);
 const after=native([a,b].map(row=>row.id===e.id?prepareNativeRecord(amended,e,new Date(+now+1000)):row));
 assert.equal(after.model.queuedSelections.filter(q=>q.facet==='liking').length,1);assert.equal(after.model.units.length,1);
});
test('question answers refuse stale, foreign, duplicate, or already answered sources',()=>{
 const e=entry(),s=native([e]),source=s.observations.find(o=>o.kind==='sensory_presence');
 assert.equal(applyNativeQuestion(entry(),source,'liking','liked'),null);
 assert.equal(applyNativeQuestion({...e,sensorySelections:[...e.sensorySelections,...e.sensorySelections]},source,'liking','liked'),null);
 const answered=applyNativeQuestion(e,source,'liking','liked');assert.equal(applyNativeQuestion(answered,source,'liking','disliked'),null);
 const changed={...e,sensorySelections:e.sensorySelections.map(s=>({...s,target:'sauce'}))};assert.equal(applyNativeQuestion(changed,source,'liking','liked'),null);
});
test('intrinsic catalog intensity is not asked as a missing answer',()=>{
 const e=entry({sensorySelections:[{...makeSelection('salty-balanced','bubble'),liking:'liked'}]}),s=native([e]);
 for(const q of s.model.queuedSelections.filter(q=>q.facet==='intensity')){const source=s.observations.find(o=>o.observationId===q.responseSourceID);if(s.observations.some(o=>o.kind==='sensory_intensity'&&o.selectionEvidence.selectionID===source.selectionEvidence.selectionID))assert.equal(nativeQuestionChoices(e,source,q.facet).length,0);}
});
test('answering a facet preserves earlier responses knownAt and source revision',()=>{
 const e=entry(),s=native([e]),source=s.observations.find(o=>o.kind==='sensory_presence'),changed=applyNativeQuestion(e,source,'liking','liked');
 const saved=prepareNativeRecord(changed,e,new Date(+now+1000)),after=native([saved]);
 assert.equal(after.observations.find(o=>o.kind==='sensory_presence').knownAt,source.knownAt);assert.equal(after.observations.find(o=>o.kind==='attribute_liking').knownAt,new Date(+now+1000).toISOString());assert.equal(saved.memoryRevision,1);
});
test('ordinary note edit does not redate overall evaluation',()=>{
 const e=entry({overallEvaluation:overallEvaluation('liked')}),before=native([e]).observations.find(o=>o.kind==='overall_liking'),edited=prepareNativeRecord({...e,note:'메모를 보완했어요'},e,new Date(+now+1000));
 assert.equal(native([edited]).observations.find(o=>o.kind==='overall_liking').knownAt,before.knownAt);
});
test('candidate presentation retains counter evidence and withholding',()=>{
 const rows=['liked','liked','liked','disliked'].map(liking=>entry({sensorySelections:[{...makeSelection('sour-fresh','bubble'),liking}]})),s=native(rows),g=nativeAnalysisGroups(s).find(g=>g.kind==='candidate');
 assert.ok(s.model.candidates.every(c=>c.direction===null));assert.match(g.eyebrow,/다른 기록/);assert.equal(g.mealIDs.length,4);assert.ok(g.body.includes('아쉬움'));assert.ok(g.evidenceIDs.every(id=>s.observations.some(o=>o.observationId===id)));
});
test('fit and overall presentation counts follow separate native distributions',()=>{
 const rows=[1,2,3].map(()=>entry({sensorySelections:[{...makeSelection('sour-fresh','bubble'),liking:'disliked',preferenceFit:'justRight'}],overallEvaluation:overallEvaluation('liked')})),s=native(rows),groups=nativeAnalysisGroups(s);
 assert.ok(groups.find(g=>g.kind==='fit').rows.some(r=>r.counts.includes('알맞았어요 · 3번의 식사')));
 const overall=groups.find(g=>g.kind==='overall');assert.match(overall.body,/전체 ‘좋았어요’/);assert.match(overall.body,/‘아쉬웠어요’/);assert.equal(overall.mealIDs.length,3);
});
test('semantic uncertainty is preserved without an answer shortcut',()=>{
 const e=entry({sensorySelections:[{...makeSelection('sweet-fruit-soft','bubble'),intensity:'strong'}]}),s=native([e]);
 assert.ok(s.unresolved.length>0);for(const q of s.model.queuedSelections){const source=s.observations.find(o=>o.observationId===q.responseSourceID);assert.equal(nativeQuestionChoices(e,source,q.facet).length,0);}
});
test('source indices and note punctuation changes never relink evidence by array index',()=>{
 const e=entry(),before=native([e]).observations,after=native([{...e,sensorySelections:[...e.sensorySelections,makeSelection('salty-balanced','bubble')]}]).observations;
 for(const row of before)assert.ok(after.some(o=>o.observationId===row.observationId));
});
test('fit-only originals retain native fallback insights without inventing liking',()=>{
 const e=entry({sensorySelections:[{...makeSelection('sour-fresh','bubble'),preferenceFit:'justRight'}]}),s=native([e]),groups=nativeAnalysisGroups(s);
 assert.equal(s.model.units.length,0);assert.ok(groups.some(g=>g.kind==='candidate'&&g.title==='이 음식에서 느낀 알맞은 정도'));
 assert.ok(groups.find(g=>g.kind==='candidate').evidenceIDs.every(id=>s.observations.some(o=>o.observationId===id&&o.kind==='preference_fit')));
});
