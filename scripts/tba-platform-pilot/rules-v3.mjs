import { readFileSync } from 'node:fs';

export const LEXICON_VERSION = 'tba-semantic-lexicon/2';
export const RULE_VERSION = 'tba-rules/3';
const fail = message => { throw new Error(message); };
const ratings = { '좋았어요': 'positive', '괜찮았어요': 'neutral', '아쉬웠어요': 'negative' };
const scales = { sensory_presence: 'presence-v1', sensory_intensity: 'expression-strength-v1', overall_liking: 'overall-three-category-v1', attribute_liking: 'attribute-three-category-v1', preference_fit: 'preference-fit-v1', combination_liking: 'combination-three-category-v1', unresolved: 'unresolved-v1' };
const targets = new Set(['whole_dish', 'sauce', 'surface', 'inside', 'coating', 'skin', 'broth', 'noodles', 'meat', 'filling', 'flesh', 'cream', 'combination', 'unspecified']);
const phases = new Set(['unspecified', 'first_bite', 'early_meal', 'during_meal', 'late_meal', 'after_swallow', 'after_meal']);
const attributes = new Set(['taste.sweet', 'taste.sour', 'taste.salty', 'taste.bitter', 'taste.umami', 'mouthfeel.fatty', 'mouthfeel.astringent', 'mouthfeel.coating', 'mouthfeel.dry', 'texture.crisp', 'texture.crunchy', 'texture.chewy', 'texture.springy', 'texture.soft', 'texture.smooth', 'texture.juicy', 'texture.moist', 'texture.dry', 'texture.hard', 'texture.thick', 'texture.sticky', 'texture.grainy', 'texture.crumbly', 'temperature.cold', 'temperature.warm', 'trigeminal.spicy', 'trigeminal.pungent', 'trigeminal.numbing', 'trigeminal.fizzy', 'trigeminal.tingling', 'aroma.smoky', 'aroma.roasted', 'aroma.fruity', 'aroma.floral', 'aroma.herbal', 'aroma.marine', 'aroma.fermented', 'aroma.dairy', 'aroma.nutty', 'aroma.reference', 'aroma.unspecified', 'finish.duration']);
const attributeMeanings = {
  'taste.sweet':'단맛','taste.sour':'신맛·산미','taste.salty':'짠맛','taste.bitter':'쓴맛','taste.umami':'감칠맛',
  'mouthfeel.fatty':'느껴지는 기름기·지방감','mouthfeel.astringent':'떫고 조이는 구강 느낌','mouthfeel.coating':'명시된 막이 입안을 덮거나 붙는 느낌','mouthfeel.dry':'입안이 마르는 느낌',
  'texture.crisp':'바삭한 식감','texture.crunchy':'아삭한 식감','texture.chewy':'씹힘 저항·쫄깃함','texture.springy':'탄력·탱글함','texture.soft':'부드러운 식감','texture.smooth':'매끈한 질감','texture.juicy':'씹을 때 즙이 나오는 느낌','texture.moist':'촉촉한 수분감, 즙이 방출된다는 뜻은 아님','texture.dry':'푸석한 음식 질감','texture.hard':'단단한 질감','texture.thick':'꾸덕하거나 되직한 질감','texture.sticky':'달라붙는 질감','texture.grainy':'알갱이·가루 입자감','texture.crumbly':'잘게 부서지는 질감',
  'temperature.cold':'명시된 차가움','temperature.warm':'명시된 따뜻함, 물리적 온도 수치나 기전은 미확정',
  'trigeminal.spicy':'매운 자극','trigeminal.pungent':'알싸한 자극','trigeminal.numbing':'얼얼한 느낌','trigeminal.fizzy':'탄산이 명시된 자극','trigeminal.tingling':'톡 쏘는 자극, 탄산 원인 추론 금지',
  'aroma.smoky':'불·훈연·연기 향','aroma.roasted':'구운 향','aroma.fruity':'과일향','aroma.floral':'꽃향','aroma.herbal':'풀·허브향','aroma.marine':'바다를 떠올리는 향','aroma.fermented':'발효향','aroma.dairy':'우유·버터 계열 향','aroma.nutty':'명시된 견과류 향, 고소한만으로 추론 금지','aroma.reference':'비유 향, reference에 원문상의 비유 대상 필수. 실제 재료가 아님','aroma.unspecified':'향 존재는 명시됐지만 종류 미확정','finish.duration':'여운의 존재, 구체 감각·길이·시점은 추가 근거 필요',
};
// 넓은 경험 표현은 그대로 보존한다. 고소함을 견과 향이나 실제 재료로 바꾸지 않는다.
const flavorMeanings = {
  'flavor.ingredient_character':'재료 본연의 맛이 드러나는 경험. 순함·낮은 조미 강도를 자동 추론하지 않음',
  'flavor.nutty_savory':'사용자가 명시한 고소한 맛·풍미. 견과류·지방·구움향 중 어느 원인인지 미확정',
  'flavor.cereal_savory':'사용자가 명시한 구수한 맛·풍미. 곡물 재료나 구운 조리법을 추론하지 않음',
  'flavor.fresh':'사용자가 명시한 산뜻하거나 상쾌한 맛. 산도·온도·향의 원인은 미확정',
  'flavor.rich':'사용자가 명시한 농밀하거나 묵직한 풍미. 감칠맛·지방 함량을 추론하지 않음',
  'flavor.fermented':'사용자가 발효 풍미라고 표현한 경험. 실제 발효 공정의 검증과 별개',
  'flavor.balance':'사용자가 명시한 맛의 균형·조화. 각 구성 감각의 개별 호감과 별개',
};
for (const [id,meaning] of Object.entries(flavorMeanings)) { attributes.add(id); attributeMeanings[id]=meaning; }
const kindValues = {sensory_presence:[true,false],sensory_intensity:['weak','medium','strong'],overall_liking:['positive','neutral','negative'],attribute_liking:['positive','neutral','negative'],preference_fit:['above_preferred','below_preferred','just_right'],combination_liking:['positive','neutral','negative']};
export const SEMANTIC_CONTRACT = Object.freeze({
  versions:{lexicon:LEXICON_VERSION,rules:RULE_VERSION},
  attributes:[...attributes].map(id=>({id,meaning:attributeMeanings[id]})),
  kinds:Object.fromEntries(Object.entries(scales).map(([kind,scale])=>[kind,{scale,values:kindValues[kind]??'original_text_string',attributePolicy:['overall_liking','combination_liking','unresolved'].includes(kind)?'null':'known_attribute',meaning:{sensory_presence:'실제로 보고한 감각의 존재 또는 명시적 부재',sensory_intensity:'표현상 강도, 객관적 수치 아님',overall_liking:'음식 전체 직접 평가',attribute_liking:'특정 감각의 직접 평가',preference_fit:'해당 감각 수준과 원하는 수준의 관계',combination_liking:'구성속성·대상쌍 조합의 직접 평가; combinationComponents 보존',unresolved:'해석되지 않은 원문'}[kind]}])),
  targets:[...targets],phases:[...phases],
  phaseMeanings:{unspecified:'시점 미언급',first_bite:'첫입·첫 모금 명시',early_meal:'처음엔·처음에는 등 식사 초반, 정확한 첫입 아님',during_meal:'씹거나 먹는 동안',late_meal:'식사 중 나중 시점, 정량적 후반 절반 아님',after_swallow:'삼킨 뒤',after_meal:'식사를 마친 뒤'},
  sourcePolicy:{offsets:'javascript_utf16_code_units',freeText:'answer.value',choice:'선택 label, choiceId 필수',phrase:'sourceSpans 중 하나의 quote와 완전 일치',defaultPhase:'unspecified',metaphor:'비유 대상 원문은 reference에 보존, 재료 포함으로 변환 금지',combination:'combinationComponents:[{attribute,target,reference?}]에 명시적 구성쌍 보존'},
});
export function validateSemanticAtom(atom) {
  const errors = [];
  if (!Object.hasOwn(scales, atom?.kind)) errors.push('UNKNOWN_KIND');
  if (atom?.scale !== scales[atom?.kind]) errors.push('INVALID_SCALE');
  if (!targets.has(atom?.target)) errors.push('INVALID_TARGET');
  if (!phases.has(atom?.phase)) errors.push('INVALID_PHASE');
  if (['overall_liking', 'combination_liking', 'unresolved'].includes(atom?.kind)) {
    if (atom.attribute !== null) errors.push('INVALID_ATTRIBUTE');
  } else if (!attributes.has(atom?.attribute)) errors.push('INVALID_ATTRIBUTE');
  const validValues = kindValues;
  if (validValues[atom?.kind] && !validValues[atom.kind].includes(atom.value)) errors.push('INVALID_VALUE');
  if (atom?.attribute === 'aroma.reference' && (typeof atom.reference !== 'string' || !atom.reference.trim())) errors.push('MISSING_AROMA_REFERENCE');
  if (atom?.combinationComponents !== undefined && (!Array.isArray(atom.combinationComponents) || atom.combinationComponents.some(c=>!attributes.has(c.attribute)||!targets.has(c.target)))) errors.push('INVALID_COMBINATION_COMPONENTS');
  if (atom?.kind === 'unresolved' && typeof atom.value !== 'string') errors.push('INVALID_VALUE');
  if (atom?.kind === 'overall_liking' && atom.target !== 'whole_dish') errors.push('INVALID_OVERALL_TARGET');
  return { valid: errors.length === 0, errors };
}
let lexicon;
function entries() {
  if (!lexicon) lexicon = new Map(JSON.parse(readFileSync(new URL('./semantic-lexicon.json', import.meta.url), 'utf8')).entries.map(entry => [entry.id, entry]));
  return lexicon;
}
const shape = (kind, attribute, value, extra = {}) => ({ kind, attribute, value, scale: scales[kind], ...extra });
const senseDefinitions = [
  ['flavor.ingredient_character', /재료 (?:본연|자체|고유)의 (?:맛|풍미)/u],
  ['flavor.nutty_savory', /고소한 (?:맛|풍미)|고소함/u],
  ['flavor.cereal_savory', /구수한 (?:맛|풍미)|구수함/u],
  ['flavor.fresh', /산뜻한 맛|상쾌한 맛/u],
  ['flavor.rich', /농밀한 (?:맛|풍미)|묵직한 풍미/u],
  ['flavor.fermented', /발효 (?:풍미|맛)/u],
  ['flavor.balance', /맛의 (?:균형|조화)/u],
  ['taste.sweet', /단맛|달콤(?:한|함|해요|했어요|하다|하고|하지만|하지)|달달(?:한|함|해요|했어요|하고)|달(?:아요|아서|았어요|았지만|았고|았는데|고|지만|다고|다|지|게)/u],
  ['taste.sour', /신맛|산미|새콤(?:한|함|해요|했어요|하고|하지만|하지)|시큼(?:한|함|해요|했어요|하고|하지)|시(?:어요|었어요)/u],
  ['taste.salty', /짠맛|짭짤(?:한|함|해요|했어요|하고|하지)|짜(?:요|고|지만|다|지)|짰(?:어요|지만)/u],
  ['taste.bitter', /쓴맛|쌉싸름(?:한|함|해요|했어요|하고|하지)|쌉쌀(?:한|함|해요|했어요)|쓰(?:다|고|지만|지)|써요|썼(?:어요|고|지만)/u],
  ['taste.umami', /감칠맛/u],
  ['texture.crisp', /바삭(?:한|함|해요|했어요|했어요|했(?:고|지만)|하다|하고|하지만|하지|했지만|하게)|파삭(?:한|해요|했어요)/u],
  ['texture.crunchy', /아삭(?:한|함|해요|했어요|하고|하지)/u],
  ['texture.chewy', /쫄깃(?:한|함|해요|했어요|하고|하지)|쫀득(?:한|함|해요|했어요)|질(?:긴|겨요|겼어요)/u],
  ['texture.springy', /탱글(?:한|함|해요|했어요|하고|하지)|탄력(?:이|있는| 있는)/u],
  ['texture.soft', /부드러(?:운|움|워요|웠어요|웠지만)|부드럽(?:다|고|지만|지|게)/u],
  ['texture.smooth', /매끈(?:한|함|해요|했어요|하고|하지)/u],
  ['texture.moist', /촉촉(?:한|함|해요|했어요|하고|하지)|수분감/u],
  ['texture.juicy', /육즙|과즙/u],
  ['texture.dry', /푸석(?:한|함|해요|했어요|하고|하지)/u],
  ['texture.hard', /단단(?:한|함|해요|했어요|하고|하지)/u],
  ['texture.thick', /꾸덕(?:한|함|해요|했어요|하고|하지)|걸쭉(?:한|함|해요|했어요)|되직(?:한|함|해요|했어요)/u],
  ['texture.sticky', /끈적(?:한|함|해요|했어요)|달라붙(?:는|어요|었어요)/u],
  ['mouthfeel.fatty', /기름기|지방감|기름(?:진|져요|졌어요|지고|지지만|지지)/u],
  ['mouthfeel.astringent', /떫(?:은|어요|었어요|고|지만|지)/u],
  ['trigeminal.spicy', /매운맛|매콤(?:한|함|해요|했어요|하고|하지)|매워요|매웠어요|맵(?:다|고|지만|지|게)/u],
  ['trigeminal.pungent', /알싸(?:한|함|해요|했어요)/u],
  ['trigeminal.numbing', /얼얼(?:한|함|해요|했어요)/u],
  ['trigeminal.fizzy', /탄산(?:감)?/u],
  ['trigeminal.tingling', /톡 쏘(?:는|아요|았어요)/u],
  ['temperature.cold', /차가(?:운|워요|웠어요)|차갑(?:다|고|지만|지)/u],
  ['temperature.warm', /따뜻(?:한|해요|했어요)/u],
  ['aroma.smoky', /훈연향|숯불향|불향|연기향/u],
  ['aroma.roasted', /구운 향|볶은 향/u],
  ['aroma.floral', /꽃향/u], ['aroma.fruity', /과일향/u],
  ['aroma.herbal', /허브향|풀향/u], ['aroma.marine', /바다향/u],
  ['aroma.fermented', /발효향/u], ['aroma.dairy', /우유향|버터향/u],
  ['mouthfeel.coating', /크림막|기름막|남는 막/u], ['finish.duration', /여운/u],
];
if (senseDefinitions.some(row=>row.length!==2 || !attributes.has(row[0]) || !(row[1] instanceof RegExp))) fail('INVALID_SENSE_DEFINITION');
function findSenses(text) {
  const matches = [];
  for (const [attribute, pattern] of senseDefinitions) {
    for (const match of text.matchAll(new RegExp(pattern.source, 'gu'))) {
      // 조사 앞 명사 또는 검토한 활용형만 읽는다. 음식명 안의 단순 문자열은 읽지 않는다.
      const before = text.slice(0, match.index).at(-1);
      const after = text.slice(match.index + match[0].length);
      if (before && /[가-힣A-Za-z]/u.test(before)) continue;
      if (/^[가-힣A-Za-z]/u.test(after) && !/^(?:은|는|이|가|을|를|도|만|의|에|으로|과|와|었|있|없|나|좋|싫|부담|강|약|적|많|덜)/u.test(after)) continue;
      matches.push({ attribute, phrase: match[0], start: match.index, end: match.index + match[0].length });
    }
  }
  // 이 규칙의 명사 목록은 향의 비유 대상이며 재료 명세가 아니다.
  for (const m of text.matchAll(/(?:아몬드|땅콩|헤이즐넛|호두|레몬|오렌지|딸기|사과|복숭아|장미|자스민|버터|우유|바질|민트|버섯|가죽|나무|연기)(?: 같은|를 닮은|을 닮은|를 떠올리는|을 떠올리는) 향/gu)) matches.push({ attribute: 'aroma.reference', phrase: m[0], start: m.index, end: m.index + m[0].length, reference: m[0] });
  return matches.filter(m=>m.attribute!=='trigeminal.tingling'||!matches.some(other=>other.attribute==='trigeminal.fizzy')).sort((a,b) => a.start - b.start);
}
const scopePatterns = [
  ['flesh', /속살(?:은|이|의|을)|살(?:은|이|의|을)/u], ['cream', /크림(?:은|이|의|을)/u],
  ['coating', /튀김옷(?:은|는|이|가|의|을|에)?/u], ['sauce', /소스(?:는|가|의|를|에)?|양념(?:은|이|의|을|에)?/u],
  ['surface', /겉면(?:은|이|의|을)?|겉(?:은|이|의|을)/u], ['inside', /속(?:은|이|의|을)/u],
  ['skin', /껍질(?:은|이|의|을)?/u], ['broth', /국물(?:은|이|의|을)?|육수(?:는|가|의|를)?/u],
  ['noodles', /면(?:은|이|의|을)/u], ['meat', /고기(?:는|가|의|를)/u], ['filling', /만두소(?:는|가|의|를)?/u],
];
const phasePatterns = [
  ['early_meal', /처음엔|처음에는/u],
  ['first_bite', /첫\s?입|첫 모금|먹자마자|첫입부터/u],
  ['late_meal', /후반(?:에는|에|은|으로)?|나중에는|나중엔|먹다 보니|몇 입 뒤/u],
  ['after_swallow', /삼킨\s?뒤|삼킨\s?후/u],
  ['during_meal', /씹을수록|씹는 동안|먹는 동안/u],
  ['after_meal', /다 먹은 뒤|식사 후|먹은 뒤/u],
];
function detectScope(text, answer) {
  const foundTargets = scopePatterns.filter(([,p]) => [...text.matchAll(new RegExp(p.source,'gu'))].some(m => m.index === 0 || !/[가-힣A-Za-z]/u.test(text[m.index-1]))).map(([t]) => t);
  const foundPhases = phasePatterns.filter(([,p]) => p.test(text)).map(([t]) => t);
  return { target: foundTargets[0] ?? answer.target ?? 'whole_dish', phase: foundPhases[0] ?? answer.phase ?? 'unspecified', targetOrigin: foundTargets.length ? 'explicit_text' : 'question_default', phaseOrigin: foundPhases.length ? 'explicit_text' : answer.phase ? 'question_default' : 'unspecified', ambiguous: foundTargets.length > 1 || foundPhases.length > 1 };
}
function unresolvedItem(phrase, start, reason, extra = {}) { return { phrase, reason, sourceSpans: [{ start, end: start + phrase.length, quote: phrase }], ...extra }; }
function withEvidence(atom, phrase, span, answer, source, ruleIds, scope = {}) {
  return { ...atom, phrase, target: scope.target ?? answer.target ?? 'whole_dish', phase: scope.phase ?? answer.phase ?? 'unspecified',
    targetOrigin: scope.targetOrigin ?? 'question_default', phaseOrigin: scope.phaseOrigin ?? (answer.phase ? 'question_default' : 'unspecified'),
    sourceSpans: [span], ruleIds, sourceAnswerRefs: [{ ...source, phrase, question: answer.question, questionVersion: answer.questionVersion, choiceVersion: answer.choiceVersion }], extraction: RULE_VERSION, evidenceClass: 'user_report' };
}
function legacy(answer, source) {
  if (answer.questionVersion !== '1' || answer.choiceVersion !== '1') fail('UNKNOWN_VERSION');
  if (!['overall','sensory','attribute_liking','free_text'].includes(answer.question)) fail('UNKNOWN_QUESTION');
  if (!['whole_dish','sauce'].includes(answer.target) || !['first_bite','during_meal','after_meal'].includes(answer.phase)) fail('INVALID_SCOPE');
  const observations = [];
  const add = (phrase, atom) => observations.push({ ...withEvidence(atom, phrase, { start:0,end:phrase.length,quote:phrase }, answer, source, ['legacy-v1']), extraction:'reviewed_choice_mapping_v1',evidenceClass:'synthetic_fixture' });
  const descriptors = { '바삭한': [shape('sensory_presence','texture.crisp',true)], '진한 감칠맛':[shape('sensory_presence','taste.umami',true),shape('sensory_intensity','taste.umami','strong')], '훈연향':[shape('sensory_presence','aroma.smoky',true)], '깔끔한':[shape('unresolved',null,'깔끔한')] };
  if (answer.question === 'overall') {
    if (!Object.hasOwn(ratings, answer.value) || answer.target !== 'whole_dish') fail('INVALID_CHOICE');
    add(answer.value, shape('overall_liking',null,ratings[answer.value]));
  } else if (answer.question === 'sensory') {
    if (!Array.isArray(answer.value)) fail('INVALID_CHOICE');
    for (const phrase of answer.value) { if (!Object.hasOwn(descriptors,phrase)) fail('INVALID_CHOICE'); for (const atom of descriptors[phrase]) add(phrase,atom); }
  } else if (answer.question === 'attribute_liking') {
    const names = { '감칠맛':'taste.umami','훈연향':'aroma.smoky','바삭함':'texture.crisp' };
    if (!Object.hasOwn(names,answer.attribute) || !Object.hasOwn(ratings,answer.value)) fail('INVALID_CHOICE');
    add(answer.value,shape('attribute_liking',names[answer.attribute],ratings[answer.value]));
  } else { if (typeof answer.value !== 'string' || !answer.value.trim()) fail('INVALID_TEXT'); add(answer.value,shape('unresolved',null,answer.value)); }
  return { observations,unresolved:[],needsAI:false,decisionReasons:['legacy_v1_contract'],versions:{lexicon:'1',rules:'1'} };
}

export function parseByRules(answer, { source = {} } = {}) {
  if (answer?.questionVersion === '1') return legacy(answer,source);
  if (answer?.questionVersion !== '2' || answer.choiceVersion !== LEXICON_VERSION) fail('UNKNOWN_VERSION');
  if (!['overall','sensory','attribute_liking','free_text'].includes(answer.question)) fail('UNKNOWN_QUESTION');
  if ((answer.target !== undefined && !targets.has(answer.target)) || (answer.phase !== undefined && !phases.has(answer.phase))) fail('INVALID_SCOPE');
  const result = { observations:[],unresolved:[],needsAI:false,decisionReasons:[],versions:{lexicon:LEXICON_VERSION,rules:RULE_VERSION} };
  const add = (atom, phrase, start, rule, scope={}, extra={}) => result.observations.push(withEvidence(atom,phrase,{start,end:start+phrase.length,quote:phrase,...extra},answer,source,[rule],scope));
  if (answer.question === 'overall' || answer.question === 'attribute_liking') {
    if (!Object.hasOwn(ratings,answer.value)) fail('INVALID_CHOICE');
    if (answer.question === 'overall' && answer.target && answer.target !== 'whole_dish') fail('INVALID_CHOICE');
    const attribute = { '감칠맛':'taste.umami','훈연향':'aroma.smoky','바삭함':'texture.crisp','단맛':'taste.sweet','신맛':'taste.sour','짠맛':'taste.salty','쓴맛':'taste.bitter' }[answer.attribute] ?? answer.attribute;
    if (answer.question === 'attribute_liking' && !attributes.has(attribute)) fail('INVALID_CHOICE');
    add(shape(answer.question === 'overall' ? 'overall_liking':'attribute_liking',answer.question === 'overall' ? null:attribute,ratings[answer.value]),answer.value,0,'explicit-choice');
  } else if (answer.question === 'sensory') {
    if (!Array.isArray(answer.value)) fail('INVALID_CHOICE');
    for (const choice of answer.value) {
      const entry = entries().get(choice?.id);
      if (!entry || entry.label !== choice.label) fail('INVALID_CHOICE');
      for (const atom of entry.semanticAtoms) add(atom,choice.label,0,'lexicon-exact-id-label',{target:atom.target ?? answer.target ?? 'whole_dish',phase:atom.phase ?? answer.phase ?? 'unspecified',targetOrigin:atom.target ? 'explicit_label':'question_default',phaseOrigin:atom.phase ? 'explicit_label':answer.phase ? 'question_default':'unspecified'},{choiceId:choice.id});
      if (entry.resolution !== 'resolved') result.unresolved.push(unresolvedItem(choice.label,0,entry.reason,{choiceId:choice.id,resolution:entry.resolution}));
    }
  } else {
    if (typeof answer.value !== 'string' || !answer.value.trim()) fail('INVALID_TEXT');
    const text = answer.value;
    // 독립 문장은 따로 처리한다. 한 문장 안에서 아직 연결을 풀지 못한
    // 복합 부정·대명사 관계는 전체 구절을 보류하되 다른 문장의 근거는 보존한다.
    const unresolvedStructure = /(?:그 향|그 맛|그 식감|그것|이것)|(?:안 .*(?:아니|않))|(?:않은 건 아니|없지 않|지 않지)/u;
    const clauses = [];
    for (const sentence of text.matchAll(/[^.!?\n]+(?:[.!?\n]|$)/gu)) {
      if (unresolvedStructure.test(sentence[0])) {
        clauses.push({text:sentence[0],start:sentence.index,deferredStructure:true});
        continue;
      }
      for (const raw of sentence[0].matchAll(/[^,;]+(?:[,;]|$)/gu)) {
        let offset = sentence.index + raw.index;
        for (const piece of raw[0].split(/(?<!다고)(?<!라고)(?<=고)\s+|(?<=지만)\s+|(?<=는데)\s+|\s+(?:그리고|하지만|그런데)\s+/u)) {
          const index = text.indexOf(piece,offset); clauses.push({text:piece,start:index});offset=index+piece.length;
        }
      }
    }
    let inheritedSpeaker='self';
    let previousClauseEndedSentence=false;
    for (const clause of clauses) {
      const body = clause.text.trim(); if (!body) continue;
      if(previousClauseEndedSentence)inheritedSpeaker='self';
      previousClauseEndedSentence=/[.!?\n]$/u.test(clause.text);
      if(/(?:^|\s)(?:저는|나는|제가|내가)/u.test(body))inheritedSpeaker='self';
      else if(/(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)/u.test(body))inheritedSpeaker='other';
      const start = clause.start + clause.text.indexOf(body);
      if (/(?:모르겠|기억이 안|기억나지|기억 안)/u.test(body)) {
        result.unresolved.push(unresolvedItem(body,start,'insufficient_semantic_information'));continue;
      }
      const selfReportedFeeling = /(?:다고|라고) 느꼈|(?:다고|라고) 느껴/u.test(body);
      const attributedSpeech = /(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)|(?:라고|다고|다며|대요)/u.test(body) && !selfReportedFeeling;
      const instructionOrHypothesis = /(?:무시해|무시하|지시|지침|시스템|프롬프트|출력해|기록해|저장해|답해|말해|평가해|추출해)|(?:라면|다면|으면 좋|다면 좋|일 것|것 같|줄 알|내일|먹으면|먹기 전|안 먹|먹지 않)/u.test(body);
      if (inheritedSpeaker==='other' || attributedSpeech || instructionOrHypothesis) {result.unresolved.push(unresolvedItem(body,start,'not_direct_self_experience'));continue;}

      if (clause.deferredStructure) {result.unresolved.push(unresolvedItem(body,start,'unresolved_clause_structure'));result.needsAI=true;continue;}
      const senses = findSenses(body);
      const scope = detectScope(body,answer);
      const vague = [...body.matchAll(/(?:^|\s)(?:깔끔|담백|고소|구수|시원|개운)(?:한|함|해요|했어요|하다|하고|하지만|하지|했지만)/gu)]
        .some(match=>!senses.some(sense=>sense.start<=match.index+match[0].search(/\S/u)&&sense.end>=match.index+match[0].length));
      const ambiguousNegation = /(?:지 않지|없지 않|안 .*않|아닌 건 아니|않은 건 아니|않다고는|덜 .*않)/u.test(body);
      const combination = /조합|함께 먹|같이 먹|어울/u.test(body);
      const positive = /좋(?:아요|았어요|았고|았는데|다|고|지만)|마음에 들|만족|맛있/u.test(body);
      const negative = /싫(?:어요|었어요|다|고)|아쉬(?:워요|웠어요)|부담(?:스러|돼|되)|물렸|물려|별로|맛없|불쾌/u.test(body);
      const likingNegated = /좋지(?:는|도)? 않|싫지(?:는|도)? 않|맛있지(?:는|도)? 않|나쁘지(?:는|도)? 않/u.test(body);
      if (/싫지(?:는|도)? 않았|싫지(?:는|도)? 않/u.test(body) && senses.length===1 && !scope.ambiguous) {
        add(shape('sensory_presence',senses[0].attribute,true),body,start,'sensory-with-unresolved-liking',scope);
        result.unresolved.push(unresolvedItem(body,start,'insufficient_liking_information'));continue;
      }
      if ((scope.ambiguous && !combination) || ambiguousNegation || likingNegated || (positive && negative) || (senses.length > 1 && /(?:좋|싫|너무|강|약|적당|않|없|아니|안\s)/u.test(body) && !combination)) {
        result.unresolved.push(unresolvedItem(body,start,'unresolved_clause_structure'));result.needsAI ||= senses.length > 0 || positive || negative;continue;
      }
      if (combination) {
        if (senses.length > 1 || scope.ambiguous) {result.unresolved.push(unresolvedItem(body,start,'unresolved_combination_scope'));result.needsAI=true;continue;}
        if (positive !== negative) add(shape('combination_liking',null,positive?'positive':'negative',{combinationComponents:senses.map(s=>({attribute:s.attribute,target:scope.target,...(s.reference?{reference:s.reference}:{})}))}),body,start,'explicit-combination-liking',{...scope,target:'combination',targetOrigin:'explicit_text'});
        else result.unresolved.push(unresolvedItem(body,start,'combination_relation_unresolved'));
        continue;
      }
      if (!senses.length) {
        if (vague) result.unresolved.push(unresolvedItem(body,start,'insufficient_semantic_information'));
        else if (positive !== negative && !scope.ambiguous && scope.target === 'whole_dish' && !/(?:가격|서비스|주차|직원|분위기|의자|인테리어|거리)/u.test(body)) add(shape('overall_liking',null,positive?'positive':'negative'),body,start,'explicit-overall-liking',scope);
        else if (/(?:맛|향|식감|단|쓴|짠|매운|바삭|소스|후반|첫입)/u.test(body)) { result.unresolved.push(unresolvedItem(body,start,'unresolved_clause_structure'));result.needsAI = true; }
        else result.unresolved.push(unresolvedItem(body,start,'unrelated_text'));
        continue;
      }
      for (const sense of senses) {
        const absent = /(?:^|\s)안\s/u.test(body) || /(?:지(?:는|도)?\s?않|없(?:어|다|었|고)|느껴지지|나지 않)/u.test(body);
        if (/아니/u.test(body) && !absent) {result.unresolved.push(unresolvedItem(body,start,'unresolved_negation'));result.needsAI = true;continue;}
        const fit = /너무|지나치게|과하게|과했|과해|과한|과도/u.test(body) ? 'above_preferred' : /덜 .*좋|더 .*좋|부족|싱거/u.test(body) ? 'below_preferred' : /적당|딱 좋|알맞/u.test(body) ? 'just_right' : null;
        // 좋아요 앞의 너무는 강한 호감 표현일 수 있으므로 감각 과다로 변환하지 않는다.
        const tooOnlyLiking = positive && !negative;
        const intensity = /진한|진해|진했|강한|강해|강했|강하게|매우|아주|엄청/u.test(body) ? 'strong' : /은은|약한|약해|약했|살짝|희미/u.test(body) ? 'weak' : null;
        add(shape('sensory_presence',sense.attribute,!absent,sense.reference?{reference:sense.reference}:{}),body,start,'explicit-sensory-presence',scope);
        if (!absent && intensity) add(shape('sensory_intensity',sense.attribute,intensity),body,start,'explicit-expression-intensity',scope);
        if (!absent && fit && (!tooOnlyLiking || fit==='just_right')) add(shape('preference_fit',sense.attribute,fit),body,start,'explicit-preference-fit',scope);
        if (positive !== negative) add(shape('attribute_liking',sense.attribute,positive?'positive':'negative',sense.reference?{reference:sense.reference}:{}),body,start,'explicit-attribute-liking',scope);
      }
      if (senses.some(s=>s.attribute==='trigeminal.tingling')) result.unresolved.push(unresolvedItem(body,start,'tingling_cause_unspecified'));
      if (senses.some(s=>s.attribute==='finish.duration')) result.unresolved.push(unresolvedItem(body,start,'finish_attribute_duration_phase_unspecified'));
      if (vague) result.unresolved.push(unresolvedItem(body,start,'insufficient_semantic_information'));
    }
  }
  result.decisionReasons.push(result.needsAI?'meaningful_unresolved_structure':result.observations.length ? result.unresolved.length?'partial_rules_with_unresolved':'rules_complete': 'no_resolvable_observation');
  return result;
}

export function validateAtomSourceScope(atom, answer) {
  const errors = [];
  if (!Array.isArray(atom.sourceSpans) || !atom.sourceSpans.length) return {valid:false,errors:['MISSING_SOURCE_SPANS']};
  for (const span of atom.sourceSpans) {
    const original = typeof answer.value === 'string' ? answer.value : answer.value?.find(c=>c.id===span.choiceId)?.label;
    if (typeof original!=='string' || !Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start<0 || span.end<=span.start || span.end>original.length || original.slice(span.start,span.end)!==span.quote) errors.push('SOURCE_SPAN_MISMATCH');
  }
  const primary=atom.sourceSpans.find(span=>span.quote===atom.phrase);
  if (!primary) errors.push('PHRASE_NOT_IN_SOURCE_SPANS');
  if(errors.length)return {valid:false,errors};
  if(Array.isArray(answer.value)) {
    const choice=answer.value.find(c=>c.id===primary.choiceId),entry=entries().get(choice?.id);
    if(!entry || entry.label!==choice.label) return {valid:false,errors:['INVALID_CHOICE_SOURCE']};
    const allowed=entry.semanticAtoms.some(candidate=>candidate.kind===atom.kind && candidate.attribute===atom.attribute && candidate.value===atom.value && (candidate.target??answer.target??'whole_dish')===atom.target && (candidate.phase??answer.phase??'unspecified')===atom.phase && (candidate.reference??null)===(atom.reference??null));
    return {valid:allowed,errors:allowed?[]:['SEMANTIC_ATOM_NOT_IN_CHOICE']};
  }
  const text=primary.quote, found=findSenses(text), scope=detectScope(text,answer);
  const support=atom.sourceSpans.filter(span=>span!==primary).flatMap(span=>findSenses(span.quote));
  const supportAttributes=[...new Set(support.map(s=>s.attribute))];
  const anaphoricFamily=/그 향/u.test(text)?'aroma.':/그 맛/u.test(text)?'taste.':/그 식감/u.test(text)?'texture.':null;
  const supportedAnaphora=anaphoricFamily && found.length===0 && supportAttributes.length===1 && supportAttributes[0]===atom.attribute && atom.attribute?.startsWith(anaphoricFamily);
  if (atom.attribute!==null && !found.some(s=>s.attribute===atom.attribute) && !supportedAnaphora) errors.push('ATTRIBUTE_NOT_IN_SOURCE');
  if(atom.attribute==='aroma.reference' && (!atom.reference || ![...found,...(supportedAnaphora?support:[])].some(s=>s.reference===atom.reference)))errors.push('REFERENCE_NOT_IN_SOURCE');
  const combination=atom.kind==='combination_liking' && atom.target==='combination' && /조합|함께|같이|어울/u.test(text);
  if(!combination && (atom.target!==scope.target || scope.ambiguous))errors.push('TARGET_NOT_IN_SOURCE');
  if(atom.phase!==scope.phase)errors.push('PHASE_NOT_IN_SOURCE');
  return {valid:errors.length===0,errors};
}
