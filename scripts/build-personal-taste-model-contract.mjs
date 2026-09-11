import { readFileSync,writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPersonalTasteModel,predictPersonalTaste,PERSONAL_TASTE_MODEL_VERSION } from './tba-engine/personal-taste-model.mjs';
import { ENGINE_V2_FIXTURES } from './tba-engine/personal-taste-insights-fixtures.mjs';
export const modelRecord=(id,value='positive',extra={})=>({observationId:id,userId:'fixture-user',experienceId:`e-${id}`,mealId:`m-${id}`,kind:'attribute_liking',attribute:'taste.sour',attributeLabel:null,reference:null,value,scale:'attribute-three-category-v1',target:'unspecified',phase:'unspecified',observedAt:'2026-09-01T12:00:00.000Z',knownAt:'2026-09-01T12:01:00.000Z',dishKindIDs:[],phrase:value==='positive'?'좋았어요':value==='negative'?'아쉬웠어요':'보통이에요',sourceSpans:[{start:0,end:value==='positive'?4:5,quote:value==='positive'?'좋았어요':value==='negative'?'아쉬웠어요':'보통이에요'}],confirmationStatus:'explicit_user_choice',selectionEvidence:null,conditionSources:[],...extra});
const repeat=(prefix,value,extra={})=>[1,2,3].map(i=>modelRecord(`${prefix}${i}`,value,extra));
const strong=repeat('strong','negative',{target:'whole_dish',phase:'during_meal'}).flatMap(r=>[r,{...r,observationId:r.observationId+'-intensity',kind:'sensory_intensity',scale:'expression-strength-v1',value:'strong',phrase:'강하게',sourceSpans:[{start:0,end:3,quote:'강하게'}]}]);
const cases=[
 ...ENGINE_V2_FIXTURES,
 {id:'empty',records:[]},
 {id:'first',records:[modelRecord('1')]},
 {id:'repeated',records:repeat('p','positive')},
 {id:'counter',records:[...repeat('p','positive'),modelRecord('n','negative')]},
 {id:'neutral',records:repeat('z','neutral')},
 {id:'same-meal-conflict',records:[modelRecord('p','positive',{mealId:'one'}),modelRecord('n','negative',{mealId:'one'})]},
 {id:'conditional-direction',records:[...repeat('p','positive',{target:'sauce'}),...repeat('n','negative',{target:'whole_dish'})],queries:[{attribute:'taste.sour',target:'sauce'},{attribute:'taste.sour',target:'inside'}]},
 {id:'strong-unobserved-weak',records:strong,queries:[{attribute:'taste.sour',intensity:'weak'},{attribute:'taste.sour',intensity:'strong',target:'whole_dish',phase:'during_meal'}]},
 {id:'absence',records:[modelRecord('p'),modelRecord('a',false,{experienceId:'e-p',mealId:'m-p',kind:'sensory_presence',scale:'presence-v1'})]},
 {id:'overall-different-dish',records:[modelRecord('p','positive',{mealId:'one'}),modelRecord('o','very_negative',{mealId:'one',kind:'overall_liking',attribute:null,scale:'overall-five-category-v1'})]},
 {id:'future-known',records:repeat('p','positive',{knownAt:'2026-09-10T12:00:00.000Z'}),asOf:'2026-09-05T12:00:00.000Z'},
 {id:'legacy-unknown-time',records:repeat('p','positive',{knownAt:null}),asOf:'2026-09-05T12:00:00.000Z'},
 {id:'other-user',records:repeat('p','positive',{userId:'other-user'})},
 {id:'unanswered',records:[modelRecord('present',true,{kind:'sensory_presence',scale:'presence-v1'})]},
 {id:'dish-kind',records:repeat('p','positive',{dishKindIDs:['seafood']}),queries:[{attribute:'taste.sour',dishKindIDs:['meat']},{attribute:'taste.sour',dishKindIDs:['seafood']}]},
 {id:'unknown-description',records:repeat('p','positive',{attribute:'taste.unspecified'})},
];
export const PERSONAL_TASTE_NATIVE_CONTRACT={version:PERSONAL_TASTE_MODEL_VERSION,fixtures:cases.map(c=>{const asOf=c.asOf??null,expected=buildPersonalTasteModel({userId:'fixture-user',records:c.records},{asOf});return {id:c.id,userID:'fixture-user',records:c.records,asOf,expected,predictions:(c.queries??[]).map(query=>({query,expected:predictPersonalTaste(expected,query)}))};})};
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const path=fileURLToPath(new URL('../ios/TasteBuddy/Resources/TBA/personal-taste-model-contract.json',import.meta.url));const output=JSON.stringify(PERSONAL_TASTE_NATIVE_CONTRACT,null,2)+'\n';
 if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw new Error('PERSONAL_TASTE_CONTRACT_STALE');}else writeFileSync(path,output);
 console.log(JSON.stringify({version:PERSONAL_TASTE_MODEL_VERSION,fixtures:cases.length,path}));
}
