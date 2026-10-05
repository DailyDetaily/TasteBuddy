import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {SENSORY_V2,makeSensoryV2Selection,makeSensoryV2Presentation,sensoryV2Categories} from '../src/lib/sensoryV2.mjs';
import {parseStructuredSelections} from './tba-platform-pilot/dining-selections.mjs';
const selection=(id,extra={})=>({...makeSensoryV2Selection(id,{instanceID:id}),...extra});
const fixtures=SENSORY_V2.entries.map(e=>({id:e.id,selections:[selection(e.id)]}));
const historical=e=>({...selection(e.id),selectionInstanceID:`archived:${e.id}`,labelSnapshot:e.label,definitionVersion:e.definitionVersion,target:e.intrinsicTarget??'whole_dish',phase:e.intrinsicPhase??'unspecified'});
for(const e of SENSORY_V2.archivedEntries ?? [])fixtures.push({id:`archived:${e.id}`,selections:[historical(e)]});
const historicalParent=historical(SENSORY_V2.archivedEntries.find(e=>e.id==='v2.bubble.umami.subtle'));
fixtures.push({id:'modifier-archived-parent',selections:[historicalParent,makeSensoryV2Selection('v2.detail.flow.lingering',{relatedBubble:historicalParent,instanceID:'archived-parent-modifier'})]});
fixtures.push({id:'archived-label-mismatch',selections:[{...historicalParent,labelSnapshot:'은근한 깊이'}]});
const parent=selection('v2.bubble.sweet.basic');
const modifier=makeSensoryV2Selection('v2.detail.flow.lingering',{relatedBubble:parent,instanceID:'linked-modifier'});
fixtures.push(
  {id:'explicit-modifier',selections:[parent,modifier]},
  {id:'orphan-modifier',selections:[modifier]},
  {id:'modifier-invalid-parent-scope',selections:[{...parent,phase:'unknown_phase'},modifier]},
  {id:'same-expression-two-parts',selections:[selection('v2.detail.texture.soft',{selectionInstanceID:'surface',target:'surface',liking:'liked'}),selection('v2.detail.texture.soft',{selectionInstanceID:'inside',target:'inside',liking:'disliked'})]},
  {id:'instance-conflict',selections:[selection('v2.bubble.sweet.basic',{liking:'liked'}),selection('v2.bubble.sweet.basic',{liking:'disliked'})]},
  {id:'intrinsic-intensity-conflict',selections:[selection('v2.bubble.sweet.strong',{intensity:'light'})]},
  {id:'future-definition',selections:[selection('v2.bubble.sweet.basic',{definitionVersion:'future/9'})]},
  {id:'composite-explicit-liking',selections:[selection('v2.detail.aroma.nutty-impression',{liking:'liked'})]},
  {id:'independent-invalid-parent-link',selections:[parent,selection('v2.detail.aroma.roasted',{relatedBubbleID:parent.id})]},
);
for(const f of fixtures){const expected=parseStructuredSelections(f.selections);f.expected={observations:expected.observations,unresolved:expected.unresolved,needsAI:false};}
const contexts=[];
for(const profile of SENSORY_V2.profiles)for(const confirmed of [false,true]){
  const input={menu:'',dishKindIDs:[],profileSelection:[profile.id],flagOverrides:confirmed?Object.fromEntries(SENSORY_V2.contextFlags.map(f=>[f.id,'confirmed'])):{}};
  const expected=makeSensoryV2Presentation(input);
  contexts.push({id:`${profile.id}-${confirmed}`,input,expected,categories:sensoryV2Categories(expected)});
}
for(const menu of ['커피','아이스 우유 커피','말차라떼','두유 밀크티','중식','차돌구이','비빔우동','크림 파스타','크림 리조또','김치찌개','튀김','연어회 덮밥']){
  const input={menu,dishKindIDs:[],profileSelection:null,flagOverrides:{}};
  const expected=makeSensoryV2Presentation(input);contexts.push({id:menu,input,expected,categories:sensoryV2Categories(expected)});
}
const output=JSON.stringify({version:SENSORY_V2.version,fixtures,contexts},null,2)+'\n';
const path=new URL('./fixtures/sensory-v2-parity.json',import.meta.url);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('V2 parity fixtures stale');}
else {mkdirSync(new URL('./fixtures/',import.meta.url),{recursive:true});writeFileSync(path,output);}
console.log(JSON.stringify({parserFixtures:fixtures.length,contextFixtures:contexts.length}));
