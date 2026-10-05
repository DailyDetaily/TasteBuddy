import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import test from 'node:test';
import {resolveSensoryV2Context, sensoryV2Categories, SENSORY_V2} from '../src/lib/sensoryV2.mjs';

const result=await build({stdin:{contents:`
  export * from './src/constants/dishKindTags.ts';
  export {mapDishKindTagsToTbaSignals,findTbaSignalDefinitionsByText} from './src/lib/tbaSignalMapping.ts';
  export {inferTbaMenuContext} from './src/lib/tbaFoodKnowledgeDataset.ts';
  export {normalizeLexiconDishKindAffinity} from './src/lib/tbaKnowledge.ts';
  export {findFoodOnBridgeEntriesByText} from './src/lib/tbaFoodOnMapping.ts';
`,resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const t=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const active=new Set(t.DISH_KIND_OPTIONS.map(o=>o.id));
const kinds=menu=>t.inferDishKindIds({title:menu},32);
const native=JSON.parse(readFileSync('ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json','utf8'));

test('32 active choices preserve 30 food kinds, two traits, and six historical IDs',()=>{
  assert.equal(active.size,32);
  assert.equal(t.DISH_KIND_OPTIONS.filter(o=>o.group!=='attribute').length,30);
  assert.deepEqual(t.DISH_KIND_OPTIONS.filter(o=>o.group==='attribute').map(o=>o.id),['spicy','cold']);
  assert.equal(t.LEGACY_DISH_KIND_OPTIONS.length,6);
  for(const option of t.LEGACY_DISH_KIND_OPTIONS){
    assert(!active.has(option.id));
    assert.equal(t.getDishKindLabel(option.id),option.label);
    const choices=t.getDishKindOptionsForSelection([option.id]);
    assert.equal(choices.filter(o=>o.group==='legacy').length,1);
    assert.equal(choices.find(o=>o.group==='legacy').id,option.id);
    const mapped=t.mapDishKindTagsToTbaSignals([option.id]);
    assert.equal(mapped.unmappedTags.length,0);
    assert.deepEqual(mapped.mappedSignals.map(s=>s.definition.id),[`dish-kind:${option.id}`]);
  }
});

test('menu inference separates processing and does not invent spicy, raw, or ingredient identities',()=>{
  const cases=[
    ['생선구이',['seafood','grilled'],['raw','cured','smoked']],
    ['훈제연어',['seafood','smoked'],['raw','grilled']],
    ['염장연어',['seafood','cured'],['raw','pickled','fermented_jang']],
    ['오이 피클',['pickled'],['raw','cured','fermented_jang']],
    ['계란찜',['egg','steamed'],['braised']],
    ['갈비찜',['meat','braised'],['steamed']],
    ['계피',['spice'],['spicy']],
    ['매운 국수',['spicy','noodle'],['rice_grain']],
    ['딸기',['fruit'],['dessert','raw']],
    ['호두',['nut_seed'],['dessert']],
    ['표고버섯',['mushroom'],['vegetable_herb']],
    ['미역',['seaweed'],['seafood']],
    ['김치',['fermented_jang'],['seaweed']],
    ['비빔국수',['noodle'],['broth']],
    ['소금빵',['bread'],['rice_grain']],
    ['미역국',['seaweed','broth'],['seafood']],
    ['홍차',['beverage_pairing'],['cold']],
    ['땅콩',['nut_seed'],['legume_tofu']],
    ['eggplant',[],['egg']],
    ['strawberry',[],['raw']],
  ];
  for(const [menu,expected,excluded] of cases){
    const inferred=kinds(menu);
    for(const id of expected)assert(inferred.includes(id),`${menu}: missing ${id}, got ${inferred}`);
    for(const id of excluded)assert(!inferred.includes(id),`${menu}: unexpected ${id}, got ${inferred}`);
    assert(inferred.every(id=>active.has(id)));
  }
});

test('TBA signals and affinities preserve the new distinctions',()=>{
  const mapped=t.mapDishKindTagsToTbaSignals([...active]);
  assert.equal(mapped.unmappedTags.length,0);
  assert.equal(mapped.mappedSignals.length,32);
  const affinity=t.normalizeLexiconDishKindAffinity({dishKindAffinity:{grilled:.4,roasted:.8,smoked:.7,fruit:.9,nut:.6,cured:.8,pickled:.7}});
  assert.equal(affinity.grilled,.8);assert.equal(affinity.smoked,.7);
  assert.equal(affinity.fruit,.9);assert.equal(affinity.nut_seed,.6);
  assert.equal(affinity.cured,.8);assert.equal(affinity.pickled,.7);
  assert.equal(affinity.dessert,undefined);assert.equal(affinity.raw_cured,undefined);
  for(const [menu,expected,excluded] of [['훈제연어','smoked','grilled'],['표고버섯','mushroom','vegetable_herb'],['미역','seaweed','seafood'],['딸기','fruit','dessert'],['계란','egg','meat']]){
    const context=t.inferTbaMenuContext([],menu);
    assert(context.dishKindIds.includes(expected),`${menu}: ${context.dishKindIds}`);
    assert(!context.dishKindIds.includes(excluded),`${menu}: ${context.dishKindIds}`);
  }
  assert(!t.findTbaSignalDefinitionsByText('strawberry',{domains:['cooking-process']}).some(m=>m.definition.id==='process:raw'));
  assert(!t.findFoodOnBridgeEntriesByText('eggplant').some(m=>m.entry.id==='foodon-bridge:ingredient:egg'));
  assert(!t.findFoodOnBridgeEntriesByText('김치').some(m=>m.entry.id==='foodon-bridge:ingredient:seaweed'));
});

test('precise kind context changes candidates without asserting taste or expanding legacy groups',()=>{
  assert.deepEqual(resolveSensoryV2Context({dishKindIDs:['raw','seafood']}).profileIds,['raw-seafood']);
  for(const id of ['cured','pickled','raw_cured'])assert(!resolveSensoryV2Context({dishKindIDs:[id,'seafood']}).profileIds.includes('raw-seafood'));
  assert.deepEqual(resolveSensoryV2Context({dishKindIDs:['grilled','meat']}).profileIds,['grilled-meat']);
  assert(!resolveSensoryV2Context({dishKindIDs:['smoked','meat']}).profileIds.includes('grilled-meat'));
  assert.deepEqual(resolveSensoryV2Context({dishKindIDs:['noodle','broth']}).profileIds,['broth-noodle']);
  assert(!resolveSensoryV2Context({dishKindIDs:['grain_noodle','broth']}).profileIds.includes('broth-noodle'));
  for(const kind of ['spice','spice_heat'])assert.equal(resolveSensoryV2Context({dishKindIDs:[kind]}).contextFlags.spice_or_pungency_known,undefined);
  assert.equal(resolveSensoryV2Context({dishKindIDs:['spicy']}).contextFlags.spice_or_pungency_known,'confirmed');
  const mushroom=resolveSensoryV2Context({dishKindIDs:['mushroom']});
  assert.equal(sensoryV2Categories(mushroom).find(c=>c.id==='aroma').tags[0].id,'v2.detail.aroma.mushroom');
  const rejected=resolveSensoryV2Context({dishKindIDs:['mushroom'],flagOverrides:{dish_kind_mushroom_known:'explicitly_rejected'}});
  assert.notEqual(sensoryV2Categories(rejected).find(c=>c.id==='aroma').tags[0].id,'v2.detail.aroma.mushroom');
  assert.equal(SENSORY_V2.entries.filter(e=>e.type==='bubble').length,160);
  assert.equal(SENSORY_V2.entries.filter(e=>e.type==='detailTag').length,147);
});

test('generated native choices, labels, aliases and legacy choices match web',()=>{
  assert.deepEqual(native.dishKindOptions,t.DISH_KIND_OPTIONS);
  assert.deepEqual(native.legacyDishKindOptions,t.LEGACY_DISH_KIND_OPTIONS);
  assert.deepEqual(native.dishKindAliases,t.DISH_KIND_ALIASES);
  assert.deepEqual(native.dishKindDetailRecommendations,t.DISH_KIND_DETAIL_RECOMMENDATIONS);
});
