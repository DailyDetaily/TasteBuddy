import { DINING_NATIVE_OVERALL_CONTRACT } from './tba-platform-pilot/dining-overall-evaluation.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { DINING_NATIVE_SELECTION_CONTRACT } from './build-dining-sensory-selection-contract.mjs';
import { fileURLToPath } from 'node:url';
import { LEXICON_VERSION, RULE_VERSION, SEMANTIC_CONTRACT, SENSORY_RULE_DATA, parseByRules } from './tba-platform-pilot/rules.mjs';
import { positiveEvaluation, negativeEvaluation, evaluationCue, comparativeOrConditional, temporalDetail } from './tba-platform-pilot/sensory-language.mjs';
import { attributeLabel } from './tba-engine/evidence.mjs';
import { PALATE_STYLES, buildPalateProfile } from './tba-engine/palate-profile.mjs';
const lexical=JSON.parse(readFileSync(new URL('./tba-platform-pilot/semantic-lexicon.json',import.meta.url),'utf8'));
const golden=JSON.parse(readFileSync(new URL('./tba-platform-pilot/semantic-review-cases.json',import.meta.url),'utf8'));
const added=['단맛이 좋았습니다.','구수한 향이 부드러워서 좋았습니다.','구수한 향이 부드러운 느낌이라 좋았습니다.','소스를 찍을 때만 튀김의 바삭함이 좋았습니다.','단맛이 거슬렸다.','겉은 가볍게 부서지고 속은 촉촉했다.','버터 같은 향은 좋았지만 입안에 남는 기름진 느낌은 아쉬웠다.','씹을수록 단맛이 둥글게 퍼졌다.','삼킨뒤 단맛이 남았어요.','식으니 단맛이 강해졌어요.','향이 종이처럼 납작하게 느껴져 좋았습니다.','어제보다 단맛이 좋았습니다.','“단맛이 좋았고 향이 좋았습니다.”','첨부하지 않은 사진을 보고 식감을 분석해 줘.','식당 조명이 따뜻하고 직원 말투가 달콤했다.'];
const intensityNegations=['단맛이 강하지 않았어요.','단맛이 강하지는 않았어요.','단맛이 강하진 않았어요.','단맛이 약하지 않았어요.','감칠맛이 진하지 않았어요.','단맛이 안 강했어요.','단맛이 세지 않았어요.','단맛이 강하게 느껴지지 않았어요.','단맛이 강하지 않아서 좋았어요.','🍽️ 단맛이 강하지 않았어요. 단맛이 좋았어요.','단맛과 쓴맛이 강하지 않았어요.','단맛이 강하지 않은 건 아니에요.','단맛이 좋지 않았어요.'];
const fixtures=[...golden.cases.map(c=>({id:c.id,answer:c.answer})),...added.map((value,i)=>({id:`native-detail-${i}`,answer:{question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value}})),...intensityNegations.map((value,i)=>({id:`native-intensity-negation-${i}`,answer:{question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value}}))].map(({id,answer})=>({id,answer,expected:parseByRules(answer)}));
const styleExamples={purist:'재료 본연의 맛이 좋았어요.',maximalist:'매운맛이 강했어요. 매운맛이 좋았어요.',alchemist:'발효 풍미가 좋았어요.',roaster:'고소한 맛이 좋았어요.',romantic:'단맛이 좋았어요.',texturalist:'바삭함이 좋았어요.',epicure:'감칠맛이 좋았어요.',refresher:'산뜻한 맛이 좋았어요.',harmonist:'맛의 균형이 좋았어요.'};
const profileInputs=[...Object.entries(styleExamples).map(([id,text])=>({id,notes:[text,text]})),{id:'first-signal',notes:['단맛이 좋았습니다.']},{id:'tie',notes:['단맛이 좋았습니다. 바삭함이 좋았습니다.','단맛이 좋았습니다. 바삭함이 좋았습니다.']},{id:'independent-wing',notes:['단맛이 좋았습니다. 바삭함이 좋았습니다.','단맛이 좋았습니다. 바삭함이 좋았습니다.','단맛이 좋았습니다.']},{id:'overlapping-wing',notes:['단맛이 강해서 좋았습니다.','단맛이 강해서 좋았습니다.','단맛이 강해서 좋았습니다.','단맛이 좋았습니다.']},{id:'absence-qualified',notes:['단맛이 없어서 좋았습니다.','단맛이 없어서 좋았습니다.']},{id:'unknown-detail',notes:['향이 종이처럼 납작해서 좋았습니다.','향이 종이처럼 납작해서 좋았습니다.']}];
const profileFixtures=profileInputs.map(({id,notes})=>{
 const records=notes.flatMap((value,i)=>parseByRules({question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value}).observations.map((atom,j)=>({...atom,observationId:`o-${i}-${j}`,experienceId:`e-${i}`,mealId:`e-${i}`,foodId:`f-${i}`,reference:atom.reference??null,confirmationStatus:'rule_extracted_statement'})));
 const profile=buildPalateProfile({records,userId:'native-parity',evidenceSetHash:'fixture',evidenceClass:'synthetic_fixture',coverage:{meals:notes.length}});
 return {id,notes,expected:{status:profile.status,mainID:profile.main?.id??null,wingID:profile.wing?.id??null,candidates:profile.candidates.map(c=>({id:c.id,status:c.status,supportExperienceCount:c.supportCoverage.meals,counterExperienceCount:c.counterCoverage.meals,eligible:c.eligible}))}};
});
const data={schemaVersion:1,ruleVersion:RULE_VERSION,lexiconVersion:LEXICON_VERSION,semantic:{...SEMANTIC_CONTRACT,attributes:SEMANTIC_CONTRACT.attributes.map(a=>({...a,label:a.id.endsWith('.unspecified')?({taste:'미각 표현',aroma:'향 표현',texture:'식감 표현',mouthfeel:'입안 느낌',temperature:'온도 표현',trigeminal:'자극 표현',finish:'여운 표현'}[a.id.split('.')[0]]):attributeLabel(a.id)}))},language:SENSORY_RULE_DATA,patterns:Object.fromEntries(Object.entries({positiveEvaluation,negativeEvaluation,evaluationCue,comparativeOrConditional,temporalDetail}).map(([k,v])=>[k,v.source])),lexicon:lexical.entries,styles:PALATE_STYLES,fixtures,profileFixtures,selectionCatalog:DINING_NATIVE_SELECTION_CONTRACT,overallEvaluationContract:DINING_NATIVE_OVERALL_CONTRACT};
const path=fileURLToPath(new URL('../ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json',import.meta.url));
const output=JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==output)throw new Error('SENSORY_NATIVE_CONTRACT_STALE');}
else writeFileSync(path,output);
console.log(JSON.stringify({ruleVersion:RULE_VERSION,lexiconCount:lexical.entries.length,fixtureCount:fixtures.length,path}));
