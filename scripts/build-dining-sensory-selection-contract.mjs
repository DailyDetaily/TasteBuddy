import { writeFileSync,readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DINING_SELECTION_VERSION as version,DINING_SELECTION_CATALOG as entries,DINING_SELECTION_VALUES as values,DINING_SELECTION_LABELS as labels } from './tba-platform-pilot/dining-selection-catalog.mjs';
import { parseStructuredSelections } from './tba-platform-pilot/dining-selections.mjs';
const selection=(id,extra={})=>{const e=entries.find(e=>e.id===id);return{id,type:e?.type??'bubble',catalogVersion:version,labelSnapshot:e?.label??id,target:'unspecified',phase:'unspecified',...extra};};
const cases=[...entries.map(e=>({id:`coverage:${e.id}`,selections:[selection(e.id)]})),...entries.map(e=>({id:`liking:${e.id}`,selections:[selection(e.id,{liking:'liked'})]})),
{id:'unknown-id',selections:[selection('future-bubble',{labelSnapshot:'원래 미래 선택'})]},
{id:'unknown-version',selections:[selection('bitter-roasted',{catalogVersion:'future/8'})]},
{id:'label-mismatch',selections:[selection('bitter-roasted',{labelSnapshot:'바뀐 향'})]},
{id:'future-facet',selections:[selection('bitter-roasted',{liking:'future_liking'})]},
{id:'conflicting-responses',selections:[selection('bitter-roasted',{liking:'liked'}),selection('bitter-roasted',{liking:'disliked'})]},
{id:'same-response-dedup',selections:[selection('bitter-roasted',{liking:'liked'}),selection('bitter-roasted',{liking:'liked'})]},
{id:'intensity-conflict',selections:[selection('bitter-strong-smoke',{intensity:'light'})]},
{id:'target-conflict',selections:[selection('salty-sauce-forward',{target:'surface'})]},
{id:'all-facets',selections:[selection('bitter-roasted',{liking:'liked',intensity:'strong',preferenceFit:'justRight',target:'surface',phase:'after_swallow'})]},
{id:'linked-intensity',selections:[selection('sweet-soft'),selection('balance-intensity-high',{relatedBubbleID:'sweet-soft'})]},
{id:'linked-liking-no-spread',selections:[selection('bitter-roasted',{liking:'liked'}),selection('flow-long-lasting',{relatedBubbleID:'bitter-roasted'})]},
{id:'missing-parent',selections:[selection('flow-long-lasting',{relatedBubbleID:'missing'})]},
{id:'cleared',selections:[]},
];
export const DINING_NATIVE_SELECTION_CONTRACT={version,entries,values,labels,fixtures:cases.map(c=>({...c,expected:parseStructuredSelections(c.selections)}))};
const path=fileURLToPath(new URL('../ios/TasteBuddy/Resources/TBA/dining-sensory-selection-catalog.json',import.meta.url));
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const output=JSON.stringify(DINING_NATIVE_SELECTION_CONTRACT,null,2)+'\n';
 if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw new Error('DINING_SELECTION_CONTRACT_STALE');}else writeFileSync(path,output);
 console.log(JSON.stringify({selectionCount:entries.length,fixtureCount:cases.length,path}));
}
