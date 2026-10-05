import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SENSORY_V2, makeSensoryV2Presentation, sensoryV2Categories, makeSensoryV2Selection, parseSensoryV2Selections, validSensoryV2Presentation, sensoryV2Entry} from '../src/lib/sensoryV2.mjs';
import {parseStructuredSelections} from './tba-platform-pilot/dining-selections.mjs';

const choice=(id,extra={})=>({...makeSensoryV2Selection(id,{instanceID:id}),...extra});
const ids=(context)=>sensoryV2Categories(context).flatMap(c=>c.tags.map(t=>t.id));
test('v2 ships identical resources to web, iOS and Android',()=>{
  const web=readFileSync(new URL('../src/constants/dining-sensory-v2.json',import.meta.url),'utf8');
  for(const path of ['../ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json','../android/app/src/main/assets/tba/dining-sensory-v2.json'])assert.equal(readFileSync(new URL(path,import.meta.url),'utf8'),web);
  assert.equal(SENSORY_V2.entries.filter(e=>e.type==='bubble').length,160);
  assert.equal(SENSORY_V2.entries.filter(e=>e.type==='detailTag').length,147);
});
test('every food preserves all words, six anchors and at least 136 positions',()=>{
  const base=SENSORY_V2.axes.flatMap(a=>a.words.map(w=>w.id));
  for(const profile of SENSORY_V2.profiles){
    const p=makeSensoryV2Presentation({profileSelection:[profile.id],flagOverrides:Object.fromEntries(SENSORY_V2.contextFlags.map(f=>[f.id,'confirmed']))});
    assert.equal(validSensoryV2Presentation(p),true);
    assert.equal(p.orderedBubbleIDs.filter((id,i)=>id!==base[i]).length<=24,true);
    assert.deepEqual(new Set(p.orderedBubbleIDs),new Set(base));
  }
});
test('all map slots have margin, finite coordinates and no overlaps',()=>{
  const {slots,mapSize,bubbleSize}=SENSORY_V2.layout;
  assert.equal(slots.length,160);
  for(const s of slots){assert.ok(Number.isFinite(s.x)&&Number.isFinite(s.y));assert.ok(Math.abs(s.x)+82<mapSize/2);assert.ok(Math.abs(s.y)+82<mapSize/2);}
  for(let i=0;i<slots.length;i++)for(let k=i+1;k<slots.length;k++)assert.ok(Math.hypot(slots[i].x-slots[k].x,slots[i].y-slots[k].y)>=bubbleSize+9.9);
});
test('menu rules do not turn cuisine, cold food, latte or dry noodles into unsupported profiles',()=>{
  for(const menu of ['중식','라떼','비빔우동','레모네이드'])assert.deepEqual(makeSensoryV2Presentation({menu}).profileIds,['generic']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'차돌구이'}).profileIds,['grilled-meat']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'아이스 아메리카노'}).profileIds,['coffee']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'말차라떼'}).profileIds,['tea']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'크림 리조또'}).profileIds,['grain-rice']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'크림 파스타'}).profileIds,['cream-pasta']);
  assert.deepEqual(makeSensoryV2Presentation({menu:'커피',profileSelection:[]}).profileIds,['generic']);
});
test('beverage pools replace generic tags and apply explicit component conditions',()=>{
  for(const id of ['coffee','tea','fizzy-drink']){
    const p=makeSensoryV2Presentation({profileSelection:[id]});
    assert.ok(ids(p).includes('v2.detail.flow.sip-build'));
    assert.ok(!ids(p).includes('v2.detail.flow.chew-build'));
    assert.ok(!ids(p).includes('v2.detail.composition.cook-right'));
  }
  const plain=makeSensoryV2Presentation({menu:'커피'}),milk=makeSensoryV2Presentation({menu:'우유 커피'});
  assert.ok(!ids(plain).includes('v2.detail.composition.milk-coffee-fit'));
  assert.ok(ids(milk).includes('v2.detail.composition.milk-coffee-fit'));
  const rejected=makeSensoryV2Presentation({menu:'우유 커피',flagOverrides:{milk_known:'explicitly_rejected'}});
  assert.ok(!ids(rejected).includes('v2.detail.composition.milk-coffee-fit'));
});
test('new expressions all parse and never generate implicit liking',()=>{
  for(const e of SENSORY_V2.entries){
    const parsed=parseStructuredSelections([choice(e.id)]);
    assert.ok(parsed.observations.some(o=>o.kind==='sensory_detail'),e.id);
    assert.ok(!parsed.observations.some(o=>o.kind==='attribute_liking'),e.id);
    assert.ok(parsed.unresolved.every(o=>o.reason==='composite_meaning_unresolved'),e.id);
  }
});
test('opposite viscosity and concentration values retain distinct semantics',()=>{
  const labels=['v2.detail.texture.thick-sauce','v2.detail.texture.thin-sauce','v2.detail.composition.concentration-too-dilute','v2.detail.composition.concentration-right','v2.detail.composition.concentration-too-dense'];
  const result=parseStructuredSelections(labels.map(id=>choice(id)));
  const detail=result.observations.filter(o=>o.kind==='sensory_detail');
  assert.notDeepEqual(detail[0].selectionEvidence.semanticFacets,detail[1].selectionEvidence.semanticFacets);
  assert.deepEqual(result.observations.filter(o=>o.kind==='preference_fit').map(o=>o.value),['below_preferred','just_right','above_preferred']);
});
test('relations and independent aromas never inherit taste evidence',()=>{
  const result=parseStructuredSelections([choice('v2.detail.balance.bitter-sweet-fit'),choice('v2.detail.aroma.roasted',{liking:'liked'})]);
  assert.ok(result.observations.every(o=>!['taste.sweet','taste.bitter'].includes(o.attribute)));
  assert.equal(result.observations.find(o=>o.kind==='attribute_liking').attribute,'aroma.roasted');
});
test('modifier links require an available parent and orphaned choices remain unresolved',()=>{
  const parent=choice('v2.bubble.sweet.basic');
  const modifier=makeSensoryV2Selection('v2.detail.flow.lingering',{relatedBubble:parent,instanceID:'modifier'});
  const linked=parseStructuredSelections([parent,modifier]);
  assert.equal(linked.observations.find(o=>o.selectionEvidence.selectionInstanceID==='modifier').attribute,'taste.sweet');
  const orphan=parseStructuredSelections([modifier]);
  assert.equal(orphan.observations.length,0);
  assert.ok(orphan.unresolved.some(o=>o.reason==='related_bubble_unavailable'));
  assert.equal(modifier.relatedBubbleID,parent.id);
});
test('same expression supports separate instances and preserves conflicts on the same instance',()=>{
  const a=choice('v2.detail.texture.soft',{selectionInstanceID:'a',target:'surface',liking:'liked'});
  const b=choice('v2.detail.texture.soft',{selectionInstanceID:'b',target:'inside',liking:'disliked'});
  const parsed=parseStructuredSelections([a,b]);
  assert.deepEqual(parsed.observations.filter(o=>o.kind==='attribute_liking').map(o=>[o.target,o.value]),[['surface','positive'],['inside','negative']]);
  const conflict=parseStructuredSelections([a,{...a,liking:'disliked'}]);
  assert.equal(conflict.observations.length,0);assert.equal(conflict.unresolved.length,2);
});
test('old selections retain v1 parsing while future definitions are held',()=>{
  const old={id:'sour-fresh',type:'bubble',catalogVersion:'dining-sensory-selection/1',labelSnapshot:'산뜻한 산미',target:'unspecified',phase:'unspecified',liking:'liked'};
  const oldResult=parseStructuredSelections([old]);
  const mixed=parseStructuredSelections([old,choice('v2.detail.texture.crisp')]);
  assert.deepEqual(mixed.observations.filter(o=>o.selectionEvidence.catalogVersion===old.catalogVersion),oldResult.observations);
  const future=parseStructuredSelections([choice('v2.bubble.sweet.basic',{definitionVersion:'future/9'})]);
  assert.equal(future.observations.length,0);assert.equal(future.unresolved[0].reason,'unknown_selection_definition_version');
});
test('presentation snapshots stay reproducible after a different menu is inferred',()=>{
  const original=makeSensoryV2Presentation({menu:'튀김'}),copy=JSON.parse(JSON.stringify(original));
  makeSensoryV2Presentation({menu:'커피'});
  assert.deepEqual(original,copy);assert.equal(validSensoryV2Presentation(copy),true);
  assert.equal(copy.viewportVisibility,'unmeasured');
});
