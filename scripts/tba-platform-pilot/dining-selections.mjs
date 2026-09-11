import { DINING_SELECTION_VERSION, DINING_SELECTION_CATALOG, DINING_SELECTION_VALUES, DINING_SELECTION_LABELS } from './dining-selection-catalog.mjs';
export { DINING_SELECTION_VERSION, DINING_SELECTION_CATALOG };
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const catalog=new Map(DINING_SELECTION_CATALOG.map(e=>[`${e.type}:${e.id}`,e]));
const scales={sensory_presence:'presence-v1',sensory_detail:'sensory-detail-v1',sensory_intensity:'expression-strength-v1',attribute_liking:'attribute-three-category-v1',preference_fit:'preference-fit-v1'};
export function parseStructuredSelections(selections,{source={},questionVersion='2',choiceVersion=DINING_SELECTION_VERSION,ruleVersion='tba-rules/4',lexiconVersion='tba-semantic-lexicon/2'}={}) {
 if(!Array.isArray(selections))throw new Error('INVALID_STRUCTURED_SELECTIONS');
 const result={observations:[],unresolved:[],needsAI:false,decisionReasons:[],versions:{lexicon:lexiconVersion,rules:ruleVersion}};
 const unique=[...new Map(selections.map(s=>[canonical(s),s])).values()];
 const groups=new Map();for(const s of unique){const k=`${s?.type}:${s?.id}`;groups.set(k,[...(groups.get(k)??[]),s]);}
 for(const s of unique){
  const label=typeof s?.labelSnapshot==='string'?s.labelSnapshot:typeof s?.id==='string'?s.id:JSON.stringify(s);
  const span={start:0,end:label.length,quote:label,choiceId:s?.id};
  const entry=catalog.get(`${s?.type}:${s?.id}`);
  let target=s?.target??'unspecified',phase=s?.phase??'unspecified';
  const parent=s?.relatedBubbleID?unique.find(p=>p?.type==='bubble'&&p.id===s.relatedBubbleID):null;
  const parentEntry=parent?catalog.get(`bubble:${parent.id}`):null;
  const metadata=(facet='selection',responseValue=s?.id,labelValue=label,resolution=entry?.resolution??'unresolved')=>({selectionID:s?.id??'',type:s?.type??'',catalogVersion:s?.catalogVersion??'',labelSnapshot:label,facet,labelValue,responseValue:responseValue??null,relatedBubbleID:s?.relatedBubbleID??null,relatedBubbleLabel:parent?.labelSnapshot??null,resolution});
  const pending=(reason,facet='selection',responseValue=s?.id)=>{result.unresolved.push({phrase:label,reason,choiceId:s?.id,sourceSpans:[span],selectionEvidence:metadata(facet,responseValue,DINING_SELECTION_LABELS[facet]?.[responseValue]??label,'unresolved')});};
  if(s?.unparsedPayload!=null){pending('unreadable_selection_payload');continue;}
  if(choiceVersion!==DINING_SELECTION_VERSION||s?.catalogVersion!==DINING_SELECTION_VERSION){pending('unknown_selection_catalog_version');continue;}
  if(!entry){pending('unknown_selection_id');continue;}
  if(entry.label!==s.labelSnapshot){pending('selection_label_mismatch');continue;}
  if(groups.get(`${s.type}:${s.id}`).length>1){pending('conflicting_choice_responses','conflict',canonical(s));continue;}
  const invalid=Object.entries(DINING_SELECTION_VALUES).find(([field,values])=>s[field]!=null&&!Object.hasOwn(values,s[field]));
  if(invalid){pending('unknown_selection_response',invalid[0],String(s[invalid[0]]));continue;}
  const validParent=parent&&parentEntry&&parent.catalogVersion===DINING_SELECTION_VERSION&&parent.labelSnapshot===parentEntry.label&&groups.get(`bubble:${parent.id}`)?.length===1;
  if(s.relatedBubbleID&&!validParent){pending('related_bubble_unavailable','relation',s.relatedBubbleID);}
  if(validParent){if(target==='unspecified')target=parent.target!=='unspecified'&&parent.target?parent.target:parentEntry.intrinsicTarget??target;if(phase==='unspecified')phase=parent.phase??phase;}
  if((entry.intrinsicTarget&&target!=='unspecified'&&target!==entry.intrinsicTarget)||(entry.intrinsicPhase&&phase!=='unspecified'&&phase!==entry.intrinsicPhase)){
   pending('conflicting_selection_scope',entry.intrinsicTarget?'target':'phase',entry.intrinsicTarget?target:phase);continue;
  }
  target=entry.intrinsicTarget??target;phase=entry.intrinsicPhase??phase;
  const attribute=entry.attribute,detailAttribute=validParent&&entry.contextRole?parentEntry.attribute:attribute;
  function add(kind,attribute,value,facet='selection',responseValue=s.id){
   const reference=(attribute===entry.attribute&&entry.reference)?label:(attribute===parentEntry?.attribute&&parentEntry?.reference)?parent.labelSnapshot:undefined;
   result.observations.push({kind,attribute,value,scale:scales[kind],target,phase,phrase:label,sourceSpans:[span],...(reference?{reference}:{}),ruleIds:[`structured-choice-${facet}`],sourceAnswerRefs:[{...source,phrase:label,question:'structured_sensory',questionVersion,choiceVersion,choiceId:s.id}],extraction:ruleVersion,evidenceClass:'user_report',selectionEvidence:metadata(facet,responseValue,DINING_SELECTION_LABELS[facet]?.[responseValue]??label)});
  }
  if(!attribute.endsWith('.unspecified'))add('sensory_presence',attribute,true);
  add('sensory_detail',detailAttribute,label);
  const intensity=s.intensity==null?null:DINING_SELECTION_VALUES.intensity[s.intensity];
  if(entry.intrinsicIntensity&&intensity&&entry.intrinsicIntensity!==intensity)pending('conflicting_selection_intensity','intensity',s.intensity);
  else if(intensity||entry.intrinsicIntensity)add('sensory_intensity',entry.contextRole==='intensity'&&validParent?parentEntry.attribute:attribute,intensity??entry.intrinsicIntensity,s.intensity?'intensity':'selection',s.intensity??s.id);
  const fit=s.preferenceFit==null?null:DINING_SELECTION_VALUES.preferenceFit[s.preferenceFit];
  if(entry.intrinsicFit&&fit&&entry.intrinsicFit!==fit)pending('conflicting_selection_preference_fit','preferenceFit',s.preferenceFit);
  else if(fit||entry.intrinsicFit)add('preference_fit',attribute,fit??entry.intrinsicFit,s.preferenceFit?'preferenceFit':'selection',s.preferenceFit??s.id);
  if(s.liking!=null)add('attribute_liking',attribute,DINING_SELECTION_VALUES.liking[s.liking],'liking',s.liking);
 }
 result.decisionReasons.push(result.unresolved.length?'structured_choices_with_pending':'structured_choices_complete');
 return result;
}
export function validateStructuredSelectionAtom(atom,answer){
 const parsed=parseStructuredSelections(answer.value,{questionVersion:answer.questionVersion,choiceVersion:answer.choiceVersion});
 const same=candidate=>['kind','attribute','value','scale','target','phase','phrase','reference'].every(k=>canonical(candidate[k])===canonical(atom[k]))&&canonical(candidate.selectionEvidence)===canonical(atom.selectionEvidence)&&canonical(candidate.sourceSpans)===canonical(atom.sourceSpans);
 return {valid:parsed.observations.some(same),errors:parsed.observations.some(same)?[]:['STRUCTURED_SELECTION_ATOM_NOT_SUPPORTED']};
}
