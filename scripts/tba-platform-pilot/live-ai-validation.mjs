import {parseByRules} from './rules.mjs';
import {resolveWithAI,rawAnswerHash,DEFAULT_AI_MODEL,DEFAULT_AI_REASONING} from './ai-extraction.mjs';
import {loadCases,tuple} from './semantic-evaluation.mjs';

// 전용 실호출 CLI. 키를 파일에서 찾거나 출력하지 않으며 누락 시 네트워크 호출은 0회다.
const data=await loadCases();
const candidates=data.cases.map(fixture=>({fixture,rules:parseByRules(fixture.answer)})).filter(item=>item.rules.needsAI);
const budget={limit:20,attempts:0};
const model=process.env.TBA_AI_MODEL??DEFAULT_AI_MODEL;
if(!process.env.OPENAI_API_KEY) {
  console.log(JSON.stringify({mode:'live_api_validation',status:'unverified_missing_key',model,reasoning:DEFAULT_AI_REASONING,actualApiCalls:0,maximumCallsIncludingRetries:20,plannedCandidateCount:candidates.length,modelQualityValidated:false,usage:{inputTokens:0,outputTokens:0,totalTokens:0},cases:[],limitations:['OPENAI_API_KEY is not configured; no model output or model quality was evaluated.']},null,2));
} else {
  const cache=new Map(),results=[];
  for(const {fixture,rules} of candidates) {
    if(budget.attempts>=budget.limit) break;
    const context={owner:'synthetic-live-validation-user',experienceId:fixture.id,answerKey:'review',answerId:`${fixture.id}:answer`,eventId:`${fixture.id}:event`,revision:1,rawHash:rawAnswerHash(fixture.answer)};
    const result=await resolveWithAI({answer:fixture.answer,ruleResult:rules,context,cache,config:{apiKey:process.env.OPENAI_API_KEY,provider:'live_api',model,reasoning:DEFAULT_AI_REASONING,budget,maxAttempts:2}});
    const observed=[...rules.observations,...result.observations],keys=new Set(observed.map(atom=>JSON.stringify(tuple(atom))));
    const required=new Set(fixture.expected.required.map(atom=>JSON.stringify(tuple(atom)))),allowed=new Set((fixture.expected.allowed??[]).map(atom=>JSON.stringify(tuple(atom))));
    const missing=[...required].filter(key=>!keys.has(key)),unexpected=[...keys].filter(key=>!required.has(key)&&!allowed.has(key));
    const forbidden=observed.filter(atom=>(fixture.expected.forbidden??[]).some(pattern=>Object.entries(pattern).every(([key,value])=>JSON.stringify(atom[key])===JSON.stringify(value))));
    results.push({id:fixture.id,status:result.status,attempts:result.artifact.attempts,attemptLog:result.artifact.attemptLog,usage:result.usage,rejections:result.artifact.rejections,observations:observed,unresolved:result.unresolved,contractComparison:{missing:missing.map(JSON.parse),unexpected:unexpected.map(JSON.parse),forbidden:forbidden.map(tuple),passed:!missing.length&&!unexpected.length&&!forbidden.length}});
  }
  const usage=results.reduce((sum,result)=>({inputTokens:sum.inputTokens+result.usage.inputTokens,outputTokens:sum.outputTokens+result.usage.outputTokens,totalTokens:sum.totalTokens+result.usage.totalTokens}),{inputTokens:0,outputTokens:0,totalTokens:0});
  console.log(JSON.stringify({mode:'live_api_validation',status:'executed_curated_contract_cases',model,reasoning:DEFAULT_AI_REASONING,actualApiCalls:budget.attempts,maximumCallsIncludingRetries:20,plannedCandidateCount:candidates.length,completedCases:results.length,modelQualityValidated:false,usage,cases:results,limitations:['Only fixed synthetic regression cases were checked; this is not population accuracy, a hidden holdout, preference prediction or recommendation quality.','A strict JSON schema and source validation cannot establish general semantic accuracy.','No production database, UI, real user feedback or model training was used.']},null,2));
}
