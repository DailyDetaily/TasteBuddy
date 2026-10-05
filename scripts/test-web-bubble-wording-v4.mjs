import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SENSORY_V2, sensoryV2Entry, sensoryV2Axes, sensoryV2DefinitionForSelection, sensoryV2MatchesQuery, makeSensoryV2Selection, makeSensoryV2Presentation} from '../src/lib/sensoryV2.mjs';
import {parseStructuredSelections} from './tba-platform-pilot/dining-selections.mjs';
const source=JSON.parse(readFileSync(new URL('../docs/product/tastebuddy-sensory-redesign-v2.json',import.meta.url),'utf8'));
const historical=e=>({...makeSensoryV2Selection(e.id,{instanceID:`historical:${e.id}`}),labelSnapshot:e.label,definitionVersion:e.definitionVersion,target:e.intrinsicTarget??'whole_dish',phase:e.intrinsicPhase??'unspecified'});

test('wording is authored per expression, not a six-axis suffix template',()=>{
  assert.equal(SENSORY_V2.entries.filter(e=>e.type==='bubble').length,160);
  assert.equal(sensoryV2Entry('v2.bubble.bitter.lingering').label,'쌉싸름한 여운');
  assert.equal(sensoryV2Entry('v2.bubble.umami.subtle').label,'은근한 깊이');
  assert.equal(sensoryV2Entry('v2.bubble.salty.subtle').label,'부드러운 간');
  assert.equal(sensoryV2Entry('v2.bubble.sweet.caramel-like').label,'캐러멜 같은 단맛');
  for(const axis of SENSORY_V2.axes){
    assert.ok(axis.words.filter(w=>/(단맛|신맛|짠맛|쓴맛|감칠맛|지방감)$/.test(w.label)).length < axis.words.length*0.6,axis.id);
    assert.notEqual(axis.words[0].label,axis.label);
  }
  assert.equal(new Set(source.bubble_nodes.map(n=>n.label)).size,160);
  for(const node of source.bubble_nodes){
    const word=SENSORY_V2.axes.flatMap(a=>a.words).find(w=>w.id===node.id);
    assert.equal(word.description,node.description,node.id);
    assert.ok(word.description.trim().length>8,node.id);
    assert.ok(!word.description.startsWith('사용자가 '),node.id);
    assert.equal(node.definition_version,node.fixed_anchor?'redesign-bubble-anchor-5':'redesign-bubble-wording-4');
  }
});
test('aromas, textures and implicit liking stay outside taste labels',()=>{
  const forbidden=new Set(['구운 향','탄 향','바삭함','탱글함','실키한 질감','크리미함','버터 향']);
  for(const node of source.bubble_nodes){assert.ok(!forbidden.has(node.label));assert.equal(node.actual_ingredient_asserted,false);assert.equal(node.liking,null);}
  assert.equal(source.detail_nodes.length,147);
  assert.equal(source.detail_families.length,5);
});
test('every archived bubble definition still parses without rewriting its record',()=>{
  assert.equal(SENSORY_V2.archivedEntries.length,166);
  for(const e of SENSORY_V2.archivedEntries){
    const selection=historical(e),before=JSON.stringify(selection),result=parseStructuredSelections([selection]);
    assert.deepEqual(result.unresolved,[],e.id);
    assert.ok(result.observations.some(o=>o.kind==='sensory_detail'&&o.value===e.label),e.id);
    assert.ok(result.observations.every(o=>o.selectionEvidence.definitionVersion===e.definitionVersion),e.id);
    assert.ok(result.observations.every(o=>o.attribute===e.attribute),e.id);
    assert.equal(JSON.stringify(selection),before);
    assert.equal(sensoryV2DefinitionForSelection(selection).label,e.label);
  }
});
test('old wording and current wording coexist; forged and future revisions are held',()=>{
  const old=SENSORY_V2.archivedEntries.find(e=>e.id==='v2.bubble.bitter.lingering');
  const previous=historical(old),current=makeSensoryV2Selection(old.id,{instanceID:'current'});
  assert.notEqual(previous.labelSnapshot,current.labelSnapshot);
  assert.notEqual(previous.definitionVersion,current.definitionVersion);
  const mixed=parseStructuredSelections([previous,current]);
  assert.deepEqual(mixed.unresolved,[]);
  assert.deepEqual(mixed.observations.filter(o=>o.kind==='sensory_detail').map(o=>o.value),[old.label,current.labelSnapshot]);
  for(const wrong of [{...previous,labelSnapshot:current.labelSnapshot},{...previous,definitionVersion:'future/99'}]){
    const result=parseStructuredSelections([wrong]);assert.equal(result.observations.length,0);assert.ok(result.unresolved.length>0);
  }
});
test('modifier references resolve the archived parent rather than the renamed word',()=>{
  const parent=historical(SENSORY_V2.archivedEntries.find(e=>e.id==='v2.bubble.umami.subtle'));
  const detail=makeSensoryV2Selection('v2.detail.flow.lingering',{relatedBubble:parent,instanceID:'historical-parent-modifier'});
  const result=parseStructuredSelections([parent,detail]);
  assert.deepEqual(result.unresolved,[]);
  const observation=result.observations.find(o=>o.selectionEvidence.selectionInstanceID==='historical-parent-modifier');
  assert.equal(observation.attribute,'taste.umami');assert.equal(observation.selectionEvidence.relatedBubbleLabel,parent.labelSnapshot);
});
test('editing restores old labels without moving map slots or mutating current catalog',()=>{
  const old=historical(SENSORY_V2.archivedEntries.find(e=>e.id==='v2.bubble.salty.subtle'));
  const presentation=makeSensoryV2Presentation({menu:'튀김'});
  const base=sensoryV2Axes(presentation).flatMap(a=>a.words),restored=sensoryV2Axes(presentation,[old]).flatMap(a=>a.words);
  assert.deepEqual(restored.map(w=>w.id),base.map(w=>w.id));
  assert.equal(restored.find(w=>w.id===old.id).label,old.labelSnapshot);
  assert.equal(sensoryV2Entry(old.id).label,'부드러운 간');
  assert.deepEqual(sensoryV2Axes(presentation,[]).flatMap(a=>a.words),base);
  assert.equal(sensoryV2Axes(null,[old]).flatMap(a=>a.words).find(w=>w.id===old.id).label,old.labelSnapshot);
});
test('previous labels remain searchable while selected evidence keeps its own wording',()=>{
  for(const node of source.bubble_nodes){
    for(const alias of node.search_aliases)assert.equal(sensoryV2MatchesQuery(node.id,alias),true,node.id);
  }
  assert.equal(sensoryV2MatchesQuery('v2.bubble.bitter.lingering','오래 남는 쓴맛'),true);
  assert.equal(sensoryV2MatchesQuery('v2.bubble.umami.subtle','은근한 깊이'),true);
  assert.equal(sensoryV2MatchesQuery('unknown','깊이'),false);
});
