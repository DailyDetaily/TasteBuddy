import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {discoveryFixtures} from './fixtures/web-native-discovery-cases.mjs';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'native-discovery-tests-'));
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeHomeDiscoveries.ts';export * from './src/lib/gastronomy/nativeDiscoveryRelations.ts';export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'module.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(dir,'module.mjs')),{cases,entry,batch,now}=discoveryFixtures(m);
const discover=(entries,options={})=>m.buildNativeHomeDiscoveries(entries,m.buildNativeAnalysis(entries,'local-owner'),now,options);
const values=new Map(cases.map(c=>[c.id,discover(c.entries,c.options)]));
const kind=(id,k)=>values.get(id).filter(c=>c.kind===k);
test('all ten advanced kinds are generated from actual native-shaped originals',()=>{
 const expected={common:'commonPreference',conditional:'conditionalContrast',exception:'patternException','familiar-new':'familiarTasteInNewMenu',preferred:'preferredIntensity','overall-example':'overallContrast',revisit:'revisitComparison',period:'periodChange',presence:'sensoryPeriodChange'};
 for(const [fixture,k] of Object.entries(expected))assert.ok(kind(fixture,k).length,`${fixture}: ${k}`);
 assert.ok(kind('period','fitPeriodChange').length);
});
test('shared meals remain visible but are excluded from independent menu contrast',()=>{
 const c=kind('shared-excluded','conditionalContrast')[0];assert.ok(c);assert.equal(c.denominatorIDs.length,6);
 assert.equal(c.evidenceGroups.find(g=>g.label==='독립 비교에서 제외한 공통 식사').mealIDs.length,1);assert.equal(c.entryIDs.length,8);
});
test('exception requires exactly one latest meal and keeps it outside baseline',()=>{
 assert.equal(kind('exception-two-latest','patternException').length,0);const c=kind('exception','patternException')[0];assert.equal(c.numeratorIDs.length,1);assert.equal(c.denominatorIDs.length,4);assert.ok(c.numeratorIDs.every(id=>!c.denominatorIDs.includes(id)));
});
test('new-menu relation retains counter evidence and needs both direct positive ratings',()=>{
 assert.equal(kind('familiar-counter','familiarTasteInNewMenu').length,1);assert.equal(kind('familiar-too-many-counter','familiarTasteInNewMenu').length,0);
 const f=cases.find(c=>c.id==='familiar-new');assert.equal(discover(f.entries.map((e,i)=>i===3?{...e,overallEvaluation:null}:e)).filter(c=>c.kind==='familiarTasteInNewMenu').length,0);
});
test('appropriateness never becomes liking or a claimed optimum',()=>{
 const c=kind('only-too-strong','preferredIntensity')[0];assert.match(c.title,/과함/);assert.doesNotMatch(c.title,/알맞았던/);
 const rows=batch(3,{liking:undefined,fit:'justRight'});assert.equal(discover(rows).some(c=>c.kind==='commonPreference'),false);
});
test('overall contrasts keep single examples and mixed meal pairs separate',()=>{
 assert.match(kind('overall-example','overallContrast')[0].detail,/개별 경험/);assert.equal(kind('overall-mixed','overallContrast').length,0);
});
test('revisit uses the two latest dated meals and never skips an unanswered latest meal',()=>{
 assert.equal(kind('revisit-latest-missing','revisitComparison').length,0);assert.equal(kind('revisit','revisitComparison')[0].entryIDs.length,2);
});
test('period comparisons require confirmed scope, intensity and at least two dates on both sides',()=>{
 for(const id of ['period-missing-phase','period-missing-intensity','period-one-day'])for(const k of ['periodChange','fitPeriodChange'])assert.equal(kind(id,k).length,0,`${id}/${k}`);
 for(const k of ['periodChange','fitPeriodChange'])assert.ok(kind('period-thirty',k).length);
});
test('presence proportion uses all sensory meals as denominator, never rating counts',()=>{
 const rows=kind('presence','sensoryPeriodChange');assert.equal(rows.length,2);for(const c of rows){assert.equal(c.denominatorIDs.length,5);assert.equal(c.evidenceGroups.find(g=>g.label==='이전 기간 전체 기준').mealIDs.length,5);}
});
test('validated parent intensity is allowed, orphan intensity is never guessed',()=>{
 assert.ok(kind('parent-intensity','preferredIntensity').length);assert.equal(kind('orphan-child','preferredIntensity').length,0);
});
test('selected periods narrow non-temporal relationships without inventing cross-period common preference',()=>{
 assert.equal(kind('selected-month','commonPreference').length,0);assert.ok(kind('selected-month','preferredIntensity').length);
});
test('unknown dates retain non-temporal findings while withholding chronology',()=>{
 assert.ok(kind('unknown-dates','conditionalContrast').length);for(const k of ['patternException','familiarTasteInNewMenu','revisitComparison','periodChange','sensoryPeriodChange','fitPeriodChange'])assert.equal(kind('unknown-dates',k).length,0);
});
test('semantic IDs survive note corrections; source fingerprints invalidate old proof',()=>{
 const f=cases.find(c=>c.id==='conditional'),c=kind('conditional','conditionalContrast')[0];
 const edited=f.entries.map((e,i)=>i?e:m.prepareNativeRecord({...e,note:'추가 메모'},e,new Date(+now-1))),fresh=discover(edited).find(c=>c.kind==='conditionalContrast');assert.equal(c.id,fresh.id);assert.equal(c.meaningKey,fresh.meaningKey);assert.notEqual(c.revisionKey,fresh.revisionKey);assert.equal(m.nativeDiscoveryIsCurrent(c,edited),false);
});
test('insufficient samples and below-threshold percentage differences stay hidden',()=>{
 const low=[...batch(4,{age:100,liking:'disliked',fit:'tooStrong'}),...batch(5)];assert.equal(discover(low).some(c=>['periodChange','fitPeriodChange'].includes(c.kind)),false);
 const small=[...batch(5,{age:100}),...batch(4),...batch(1,{age:6,liking:'disliked',fit:'tooStrong'})];assert.equal(discover(small).some(c=>['periodChange','fitPeriodChange'].includes(c.kind)),false);
});
test('observations must match current direct choices even if completed originals have the same revision',()=>{
 const rows=[...batch(3),entry({menu:'다른 국수'})],snapshot=m.buildNativeAnalysis(rows,'local-owner');
 const corrupted={...snapshot,observations:snapshot.observations.map(o=>o.kind==='attribute_liking'?{...o,value:'negative'}:o)};
 const cards=m.buildNativeHomeDiscoveries(rows,corrupted,now);
 assert.equal(cards.some(c=>c.kind==='commonPreference'||c.kind==='overallContrast'),false);
});
test('conflicting duplicate observation IDs cannot become one extra vote',()=>{
 const rows=[...batch(3),entry({menu:'다른 국수'})],snapshot=m.buildNativeAnalysis(rows,'local-owner'),likings=snapshot.observations.filter(o=>o.kind==='attribute_liking');
 const corrupted={...snapshot,observations:[...snapshot.observations,...likings.map(o=>({...o,value:'negative'}))]};
 assert.equal(m.buildNativeHomeDiscoveries(rows,corrupted,now).some(c=>c.kind==='commonPreference'),false);
});
test('an unanswered sibling dish does not supply an overall contrast',()=>{
 const a=entry({liking:'disliked',overall:null}),b=entry({menu:'다른 요리',mealID:a.mealID,choices:[]});
 assert.equal(discover([a,b]).some(c=>c.kind==='overallContrast'),false);
});
