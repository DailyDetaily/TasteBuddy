import catalog from '../constants/dining-sensory-v2.json' with {type: 'json'};

export const SENSORY_V2 = catalog;
export const SENSORY_V2_VERSION = catalog.version;
export const sensoryV2Entry = id => catalog.entries.find(e => e.id === id) ?? null;
// Definition revisions are not aliases: old choices keep their original label and semantics.
export function sensoryV2DefinitionForSelection(selection) {
  if (selection?.catalogVersion !== catalog.version || !selection.definitionVersion) return null;
  return [...catalog.entries, ...(catalog.archivedEntries ?? [])].find(e =>
    e.id === selection.id && e.type === selection.type && e.definitionVersion === selection.definitionVersion) ?? null;
}
export function sensoryV2MatchesQuery(id, query) {
  const entry = sensoryV2Entry(id);
  const text = String(query ?? '').trim().toLocaleLowerCase();
  return !!entry && [entry.label, entry.description, ...(entry.searchAliases ?? [])]
    .some(value => value.toLocaleLowerCase().includes(text));
}
export const sensorySelectionKey = s => s.selectionInstanceID ?? `${s.catalogVersion}:${s.type}:${s.id}:${s.relatedBubbleID ?? ''}:${s.target ?? ''}:${s.phase ?? ''}`;
const unique = values => [...new Set(values)];
const ruleMatches = (rule, menu, kinds) => rule.anyGroups.every(g => g.some(w => menu.includes(w.toLowerCase())))
  && rule.kindGroups.every(g => g.some(id => kinds.includes(id))) && !rule.excludes.some(w => menu.includes(w.toLowerCase()));
const conditionMatches = (condition, profile, flags) => (!condition.requiresContextFlag || flags[condition.requiresContextFlag] === 'confirmed')
  && (!condition.requiresProfileId || condition.requiresProfileId === profile.id)
  && (!condition.requiresProfileKind || condition.requiresProfileKind === profile.detailProfileKind);

export function resolveSensoryV2Context({menu = '', dishKindIDs = [], profileSelection = null, flagOverrides = {}} = {}) {
  const matched = catalog.contextRules.filter(r => ruleMatches(r, menu.toLowerCase(), dishKindIDs))
    .sort((a,b) => b.priority-a.priority || a.id.localeCompare(b.id));
  const candidates = unique(matched.map(r => r.profileId).filter(Boolean));
  let profileIds = profileSelection == null ? candidates : unique(profileSelection.filter(id => catalog.profiles.some(p => p.id === id)));
  const compatible = profileIds.every((a,i) => profileIds.slice(i+1).every(b => catalog.compatibleProfilePairs.some(pair => pair.includes(a) && pair.includes(b))));
  const ambiguous = profileIds.length > 1 && !compatible;
  if (!profileIds.length || ambiguous || profileIds.includes('generic')) profileIds = ['generic'];
  const inferred = Object.fromEntries(unique(matched.flatMap(r => r.flags)).map(id => [id, 'confirmed']));
  const contextFlags = {...inferred, ...flagOverrides};
  for (const {ifConfirmed, mayConfirm} of catalog.contextDerivations) {
    if (contextFlags[ifConfirmed] !== 'confirmed') continue;
    if (['explicitly_rejected','conflicting'].includes(contextFlags[mayConfirm])) {
      contextFlags[ifConfirmed] = contextFlags[mayConfirm] = 'conflicting';
    } else if (!contextFlags[mayConfirm] || contextFlags[mayConfirm] === 'unknown') contextFlags[mayConfirm] = 'confirmed';
  }
  return {profileIds, profileSelection, flagOverrides, contextFlags, contextSource: profileSelection == null ? 'menu_and_kind_rules' : 'user_selection', matchedRuleIds: matched.map(r=>r.id), suggestedProfileIds: candidates, ambiguous};
}

export function sensoryV2Categories(context) {
  const profiles = context.profileIds.map(id => catalog.profiles.find(p=>p.id===id)).filter(Boolean);
  const primary = profiles[0] ?? catalog.profiles[0];
  const labels = {...primary.categoryLabels};
  const pools = Object.fromEntries(catalog.families.map(f => [f.id, []]));
  const append = id => {const e=sensoryV2Entry(id);if(e?.familyId && !pools[e.familyId].includes(id)) pools[e.familyId].push(id);};
  for (const p of profiles) {
    for(const ids of Object.values(p.familyTagPools)) ids.forEach(append);
    for(const c of p.conditionalTagAdditions ?? []) if(conditionMatches(c,p,context.contextFlags)) append(c.id);
  }
  for(const o of catalog.overlays) {
    if(context.contextFlags[o.requiresContextFlag] !== 'confirmed') continue;
    Object.assign(labels,o.categoryLabels);
    o.addTagIds.forEach(append);
    for(const c of o.conditionalTagAdditions ?? []) if(profiles.some(p=>conditionMatches(c,p,context.contextFlags))) append(c.id);
    for(const c of o.categoryLabelOverrides ?? []) if(conditionMatches(c,primary,context.contextFlags)) Object.assign(labels,c.categoryLabels);
  }
  const promoted = unique(catalog.overlays.filter(o=>context.contextFlags[o.requiresContextFlag]==='confirmed').flatMap(o=>o.promoteTagIds ?? []));
  for (const id of promoted.reverse()) {
    const family=sensoryV2Entry(id)?.familyId;
    if (family && pools[family].includes(id)) pools[family]=[id,...pools[family].filter(value=>value!==id)];
  }
  return primary.categoryOrder.map(id => ({id,label:labels[id],tags:pools[id].map(id=>({id,label:sensoryV2Entry(id).label}))}));
}

export function sensoryV2OrderedBubbleIDs(context) {
  const promotions=[];
  for(const id of context.profileIds) {
    const profile=catalog.profiles.find(p=>p.id===id);if(!profile)continue;
    promotions.push(...profile.bubblePromoteIds);
    for(const c of profile.conditionalBubblePromotions ?? []) if(conditionMatches(c,profile,context.contextFlags)) promotions.push(c.id);
  }
  for(const o of catalog.overlays) if(context.contextFlags[o.requiresContextFlag]==='confirmed') promotions.push(...o.bubblePromoteIds);
  return catalog.axes.flatMap(a=>{
    const ids=a.words.map(w=>w.id);
    const preferred=unique(promotions).filter(id=>ids.includes(id)&&!sensoryV2Entry(id).fixedAnchor).slice(0,2);
    preferred.forEach((id,i)=>{const from=ids.indexOf(id),to=i+1;[ids[from],ids[to]]=[ids[to],ids[from]];});
    return ids;
  });
}

export function makeSensoryV2Presentation(input = {}) {
  const context=resolveSensoryV2Context(input);
  return {catalogVersion:catalog.version, sourceVersion:catalog.sourceVersion, layoutVersion:catalog.layoutVersion,
    ...context, orderedBubbleIDs:sensoryV2OrderedBubbleIDs(context),
    offeredDetailIDs:sensoryV2Categories(context).flatMap(f=>f.tags.map(t=>t.id)),
    viewportVisibility:'unmeasured', attention:'unknown'};
}

export function validSensoryV2Presentation(value) {
  const ids=value?.orderedBubbleIDs;
  if(value?.catalogVersion!==catalog.version || value?.layoutVersion!==catalog.layoutVersion || !Array.isArray(ids) || ids.length!==160 || new Set(ids).size!==160) return false;
  if(!Array.isArray(value.profileIds)||!value.profileIds.length||value.profileIds.some(id=>!catalog.profiles.some(p=>p.id===id)))return false;
  let offset=0;
  for(const axis of catalog.axes){const slice=ids.slice(offset,offset+axis.words.length);offset+=axis.words.length;
    if(slice[0]!==axis.words[0].id||slice.some(id=>sensoryV2Entry(id)?.axis!==axis.id))return false;}
  return value.contextFlags && typeof value.contextFlags==='object'&&!Array.isArray(value.contextFlags);
}

export function sensoryV2Axes(presentation, preservingSelections = []) {
  const order=validSensoryV2Presentation(presentation)?presentation.orderedBubbleIDs:catalog.axes.flatMap(a=>a.words.map(w=>w.id));
  const preserved = new Map();
  for (const selection of preservingSelections) {
    const definition = sensoryV2DefinitionForSelection(selection);
    if (selection.type === 'bubble' && definition?.label === selection.labelSnapshot && selection.unparsedPayload == null) preserved.set(selection.id, definition);
  }
  return catalog.axes.map(a=>({...a,words:order.filter(id=>sensoryV2Entry(id)?.axis===a.id).map(id=>{
    const word = a.words.find(w=>w.id===id), old = preserved.get(id);
    return old ? {...word, label:old.label, description:old.description} : word;
  })}));
}

export function makeSensoryV2Selection(id, {relatedBubble=null, instanceID=null}={}) {
  const e=sensoryV2Entry(id);if(!e)throw Error('Unknown sensory expression');
  const linked=e.bindingMode==='modifier'?relatedBubble:null;
  return {id:e.id,type:e.type,catalogVersion:catalog.version,definitionVersion:e.definitionVersion,
    selectionInstanceID:instanceID ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    labelSnapshot:e.label,bindingMode:e.bindingMode,
    scopeKind:linked?'bubble':e.bindingMode==='relation'?'relation':e.intrinsicTarget?'component':'whole_dish',
    target:e.intrinsicTarget ?? (linked?'unspecified':'whole_dish'),phase:e.intrinsicPhase ?? 'unspecified',
    relatedBubbleID:linked?.id ?? null,relatedBubbleLabelSnapshot:linked?.labelSnapshot ?? null};
}

export const sensoryV2Values = {
  liking:{liked:'positive',neutral:'neutral',disliked:'negative'},
  intensity:{light:'weak',medium:'medium',strong:'strong'},
  preferenceFit:{tooWeak:'below_preferred',justRight:'just_right',tooStrong:'above_preferred'},
  target:Object.fromEntries(['unspecified','whole_dish','sauce','surface','inside','coating','skin','broth','noodles','meat','filling','flesh','cream','beverage','rice_grains'].map(v=>[v,v])),
  phase:Object.fromEntries(['unspecified','first_bite','first_sip','early_meal','during_meal','late_meal','after_swallow','after_meal','while_chewing','repeated_bites','repeated_sips'].map(v=>[v,v])),
};

export function parseSensoryV2Selections(selections, {allSelections=selections, legacyEntries=[], source={}, ruleVersion='tba-sensory-v2/1', questionVersion='2'}={}) {
  const optionalKeys=new Set(['liking','intensity','preferenceFit','relatedBubbleID','relatedBubbleLabelSnapshot','selectionInstanceID','definitionVersion','bindingMode','scopeKind','unparsedPayload']);
  const canonical = value=>JSON.stringify(Object.fromEntries(Object.entries(value).filter(([key,v])=>v!=null||!optionalKeys.has(key))),(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
  const result={observations:[],unresolved:[],needsAI:false,decisionReasons:[],versions:{lexicon:catalog.sourceVersion,rules:ruleVersion}};
  const uniqueChoices=[...new Map(selections.map(s=>[canonical(s),s])).values()];
  const uniqueAll=[...new Map(allSelections.map(s=>[canonical(s),s])).values()];
  const counts=new Map();for(const s of uniqueChoices){const k=sensorySelectionKey(s);counts.set(k,(counts.get(k)??0)+1);}
  for(const s of uniqueChoices) {
    const e=sensoryV2DefinitionForSelection(s)??sensoryV2Entry(s.id),label=s.labelSnapshot??s.id??'',span={start:0,end:label.length,quote:label,choiceId:s.id};
    const parents=uniqueAll.filter(p=>p.type==='bubble'&&p.id===s.relatedBubbleID);
    const parent=parents.length===1?parents[0]:null;
    const pe=parent?.catalogVersion===catalog.version?sensoryV2DefinitionForSelection(parent):legacyEntries.find(e=>e.id===parent?.id&&e.type==='bubble'&&e.catalogVersion===parent?.catalogVersion);
    let target=s.target??'unspecified',phase=s.phase??'unspecified';
    const evidence=(facet='selection',response=s.id,resolution=e?.resolution??'unresolved')=>({selectionID:s.id,type:s.type,catalogVersion:s.catalogVersion,labelSnapshot:label,
      selectionInstanceID:s.selectionInstanceID??null,definitionVersion:s.definitionVersion??null,bindingMode:e?.bindingMode??s.bindingMode??null,
      semanticFacets:e?.semanticFacets??null,facet,labelValue:facet==='selection'?label:String(response),responseValue:response,
      relatedBubbleID:s.relatedBubbleID??null,relatedBubbleLabel:parent?.labelSnapshot??s.relatedBubbleLabelSnapshot??null,resolution});
    const pending=(reason,facet='selection',response=s.id)=>result.unresolved.push({phrase:label,reason,choiceId:s.id,sourceSpans:[span],selectionEvidence:evidence(facet,response,'unresolved')});
    if(s.unparsedPayload!=null){pending('unreadable_selection_payload');continue;}
    if(!e||e.type!==s.type){pending('unknown_selection_id');continue;}
    if(s.catalogVersion!==catalog.version){pending('unknown_selection_catalog_version');continue;}
    if(s.definitionVersion!==e.definitionVersion){pending('unknown_selection_definition_version');continue;}
    if(label!==e.label){pending('selection_label_mismatch');continue;}
    if(counts.get(sensorySelectionKey(s))!==1){pending('conflicting_choice_responses','conflict',canonical(s));continue;}
    const invalid=Object.entries(sensoryV2Values).find(([field,values])=>s[field]!=null&&!Object.hasOwn(values,s[field]));
    if(invalid){pending('unknown_selection_response',invalid[0],s[invalid[0]]);continue;}
    if(s.bindingMode!==e.bindingMode || (s.relatedBubbleID && e.bindingMode!=='modifier')){pending('unsupported_selection_binding');continue;}
    if(!['whole_dish','component','bubble','relation'].includes(s.scopeKind) || (s.scopeKind==='bubble'&&!s.relatedBubbleID) || (s.relatedBubbleID&&s.scopeKind!=='bubble') || (e.bindingMode==='relation'&&s.scopeKind!=='relation')){pending('unsupported_selection_scope');continue;}
    if(e.bindingMode==='modifier' && s.relatedBubbleID) {
      const parentResponsesValid=parent&&Object.entries(sensoryV2Values).every(([field,values])=>parent[field]==null||Object.hasOwn(values,parent[field]));
      const parentScopeValid=pe&&(!pe.intrinsicTarget||!parent.target||parent.target==='unspecified'||parent.target===pe.intrinsicTarget)&&(!pe.intrinsicPhase||!parent.phase||parent.phase==='unspecified'||parent.phase===pe.intrinsicPhase);
      if(!parent||!pe||!parentResponsesValid||!parentScopeValid||parent.labelSnapshot!==pe.label||parent.unparsedPayload!=null|| (parent.catalogVersion===catalog.version&&(parent.definitionVersion!==pe.definitionVersion||parent.bindingMode!=='independent'||parent.relatedBubbleID||!['whole_dish','component'].includes(parent.scopeKind)))) {pending('related_bubble_unavailable','relation',s.relatedBubbleID);continue;}
      if(target==='unspecified')target=parent.target!=='unspecified'?parent.target:pe.intrinsicTarget??'unspecified';
      if(phase==='unspecified')phase=parent.phase??'unspecified';
    }
    if((e.intrinsicTarget&&target!=='unspecified'&&e.intrinsicTarget!==target)||(e.intrinsicPhase&&phase!=='unspecified'&&e.intrinsicPhase!==phase)){pending('conflicting_selection_scope');continue;}
    target=e.intrinsicTarget??target;phase=e.intrinsicPhase??phase;
    const attribute=e.bindingMode==='modifier'&&parent?pe.attribute:e.attribute;
    const reference=e.referenceLabel ? e.label : (e.type==='detailTag' || Object.keys(e.semanticFacets??{}).length) ? e.label : null;
    const add=(kind,value,facet='selection',response=s.id)=>result.observations.push({kind,attribute,value,
      scale:({sensory_presence:'presence-v1',sensory_detail:'sensory-detail-v1',sensory_intensity:'expression-strength-v1',attribute_liking:'attribute-three-category-v1',preference_fit:'preference-fit-v1'})[kind],
      target,phase,phrase:label,sourceSpans:[span],...(reference?{reference}:{}),
      ruleIds:[`structured-v2-${facet}`],sourceAnswerRefs:[{...source,phrase:label,question:'structured_sensory',questionVersion,choiceVersion:catalog.version,choiceId:s.id}],
      extraction:ruleVersion,evidenceClass:'user_report',selectionEvidence:evidence(facet,response)});
    // Candidate descriptors retain their distinctions; relational/composite tags never create component presence.
    if(e.type==='bubble' && !e.referenceLabel)add('sensory_presence',true);
    add('sensory_detail',label);
    if(e.resolution==='unresolved_composite')pending('composite_meaning_unresolved');
    const intensity=s.intensity==null?null:sensoryV2Values.intensity[s.intensity];
    if(intensity&&e.intrinsicIntensity&&intensity!==e.intrinsicIntensity)pending('conflicting_selection_intensity','intensity',s.intensity);
    else if(intensity||e.intrinsicIntensity)add('sensory_intensity',intensity??e.intrinsicIntensity,s.intensity==null?'selection':'intensity',s.intensity??s.id);
    const fit=s.preferenceFit==null?null:sensoryV2Values.preferenceFit[s.preferenceFit];
    if(fit&&e.intrinsicFit&&fit!==e.intrinsicFit)pending('conflicting_selection_preference_fit','preferenceFit',s.preferenceFit);
    else if(fit||e.intrinsicFit)add('preference_fit',fit??e.intrinsicFit,s.preferenceFit==null?'selection':'preferenceFit',s.preferenceFit??s.id);
    if(s.liking!=null)add('attribute_liking',sensoryV2Values.liking[s.liking],'liking',s.liking);
  }
  return result;
}
