export const DINING_OVERALL_VERSION = 'dining-overall-liking/1';
export const DINING_OVERALL_QUESTION = '이 음식은 전체적으로 어땠나요?';
export const DINING_OVERALL_RESPONSES = Object.freeze({veryLiked:{label:'정말 좋았어요',value:'very_positive'},liked:{label:'좋았어요',value:'positive'},neutral:{label:'보통이었어요',value:'neutral'},disliked:{label:'아쉬웠어요',value:'negative'},veryDisliked:{label:'많이 아쉬웠어요',value:'very_negative'}});
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function parseOverallEvaluation(evaluation,{source={},questionVersion='1',choiceVersion=DINING_OVERALL_VERSION,ruleVersion='tba-rules/4',lexiconVersion='tba-semantic-lexicon/2'}={}) {
 const e=evaluation, result={observations:[],unresolved:[],needsAI:false,decisionReasons:[],versions:{lexicon:lexiconVersion,rules:ruleVersion}};
 const label=typeof e?.responseLabelSnapshot==='string'?e.responseLabelSnapshot:'읽을 수 없는 응답';
 const evidence={selectionID:e?.questionID??'',type:'overallEvaluation',catalogVersion:e?.questionVersion??'',labelSnapshot:e?.questionLabelSnapshot??'',facet:'liking',labelValue:label,responseValue:e?.responseValue??null,relatedBubbleID:null,relatedBubbleLabel:null,resolution:'resolved'};
 const span={start:0,end:label.length,quote:label};
 const response=DINING_OVERALL_RESPONSES[e?.responseValue];
 let reason;
 if(!e||typeof e!=='object'||Array.isArray(e)||e.unparsedPayload!=null)reason='unreadable_overall_evaluation_payload';
 else if(questionVersion!=='1'||choiceVersion!==DINING_OVERALL_VERSION||e.questionID!=='overall_liking'||e.questionVersion!==DINING_OVERALL_VERSION)reason='unknown_overall_evaluation_version';
 else if(e.questionLabelSnapshot!==DINING_OVERALL_QUESTION||label!==(response?.label??'알 수 없는 응답'))reason='overall_evaluation_label_mismatch';
 else if(!response)reason='unknown_overall_evaluation_response';
 else if(e.target!=='whole_dish'||e.phase!=='unspecified')reason='invalid_overall_evaluation_scope';
 if(reason)result.unresolved.push({phrase:label,reason,sourceSpans:[span],selectionEvidence:{...evidence,resolution:'unresolved'}});
 else result.observations.push({kind:'overall_liking',attribute:null,value:response.value,scale:'overall-five-category-v1',target:e.target,phase:e.phase,phrase:label,sourceSpans:[span],ruleIds:['structured-overall-liking'],sourceAnswerRefs:[{...source,phrase:label,question:'structured_overall',questionVersion,choiceVersion}],extraction:ruleVersion,evidenceClass:'user_report',selectionEvidence:evidence});
 result.decisionReasons.push(reason?'overall_evaluation_pending':'overall_evaluation_complete');
 return result;
}
export function validateOverallEvaluationAtom(atom,answer){
 const parsed=parseOverallEvaluation(answer.value,{questionVersion:answer.questionVersion,choiceVersion:answer.choiceVersion});
 const valid=parsed.observations.some(candidate=>['kind','attribute','value','scale','target','phase','phrase','reference','selectionEvidence','sourceSpans'].every(key=>canonical(candidate[key])===canonical(atom[key])));
 return {valid,errors:valid?[]:['OVERALL_EVALUATION_ATOM_NOT_SUPPORTED']};
}
const evaluation=responseValue=>({questionID:'overall_liking',questionVersion:DINING_OVERALL_VERSION,questionLabelSnapshot:DINING_OVERALL_QUESTION,responseValue,responseLabelSnapshot:DINING_OVERALL_RESPONSES[responseValue].label,target:'whole_dish',phase:'unspecified'});
const valid=Object.keys(DINING_OVERALL_RESPONSES).map(value=>({id:value,evaluation:evaluation(value)}));
export const DINING_NATIVE_OVERALL_CONTRACT={version:DINING_OVERALL_VERSION,fixtures:[...valid,{id:'unknown-version',evaluation:{...evaluation('liked'),questionVersion:'future/1'}},{id:'label-mismatch',evaluation:{...evaluation('liked'),responseLabelSnapshot:'다른 문구'}},{id:'invalid-scope',evaluation:{...evaluation('liked'),target:'sauce'}},{id:'unknown-response',evaluation:{...evaluation('liked'),responseValue:'future',responseLabelSnapshot:'알 수 없는 응답'}}].map(f=>({...f,expected:parseOverallEvaluation(f.evaluation)}))};
