import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = JSON.parse(readFileSync(`${root}docs/product/tastebuddy-sensory-redesign-v2.json`, 'utf8'));
const version = 'dining-sensory-selection/2';
const camel = value => Array.isArray(value) ? value.map(camel) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).map(([key, val]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), camel(val)])) : value;
const temporal = qualifier => ({
  'first-bite': {event: 'first_bite', pattern: 'perceived'},
  'first-sip': {event: 'first_sip', pattern: 'perceived'},
  'after-swallow': {event: 'after_swallow', pattern: 'perceived'},
  'while-chewing': {event: 'while_chewing', pattern: 'perceived'},
  'late-onset': {event: 'unspecified', pattern: 'delayed_onset'},
  'quick-fade': {event: 'unspecified', pattern: 'fades_quickly'},
  lingering: {event: 'unspecified', pattern: 'long_persistence'},
})[qualifier];
const bubbleEntry = n => ({
    id: n.id, type: 'bubble', label: n.label, description: n.description ?? n.definition, axis: n.axis,
    definition: n.definition, searchAliases: n.search_aliases ?? [],
    attribute: n.concept_id, definitionVersion: n.definition_version,
    baseRank: n.base_rank, fixedAnchor: n.fixed_anchor, bindingMode: 'independent',
    referenceLabel: n.reference_label, intrinsicTarget: n.intrinsic_target,
    intrinsicPhase: n.intrinsic_phase ?? (['first_bite','first_sip','after_swallow','while_chewing'].includes(temporal(n.temporal_qualifier)?.event) ? temporal(n.temporal_qualifier).event : null),
    intrinsicIntensity: n.intrinsic_intensity_candidate === 'light' ? 'weak' : n.intrinsic_intensity_candidate,
    semanticFacets: {
      ...(n.temporal_qualifier ? {temporal: temporal(n.temporal_qualifier)} : {}),
      ...(n.reference_label ? {referenceLabel: n.reference_label} : {}),
    },
    resolution: 'editorial_candidate', catalogVersion: version,
  });
const entries = [
  ...source.bubble_nodes.map(bubbleEntry),
  ...source.detail_nodes.map(n => ({
    id: n.id, type: 'detailTag', label: n.label, description: n.definition,
    familyId: n.family_id, attribute: n.attribute_candidate, definitionVersion: n.definition_version,
    bindingMode: n.binding_mode, intrinsicTarget: n.intrinsic_target,
    intrinsicIntensity: n.semantic_facets?.intensity ?? null,
    intrinsicFit: n.semantic_facets?.preference_fit ?? null,
    semanticFacets: camel(n.semantic_facets),
    intrinsicPhase: ['first_bite','first_sip','after_swallow','while_chewing','repeated_bites','repeated_sips'].includes(n.semantic_facets?.temporal?.event) ? n.semantic_facets.temporal.event : null,
    resolution: n.resolution_policy === 'unresolved_composite' ? 'unresolved_composite' : 'editorial_candidate',
  })),
].map(n => ({...n, catalogVersion: version}));
const axes = source.axes.map(a => ({id: a.id, label: a.label, angle: a.angle_degrees,
  words: entries.filter(n => n.axis === a.id).map(n => ({
    id: n.id, key: n.id.split('.').at(-1), label: n.label, description: n.description,
    angleOffset: 0, intensity: null, radiusOffset: null,
  })),
}));
const angleDistance = (a,b) => {const d = Math.abs(((a-b)%360+540)%360-180);return d;};
const points = [];
for (let row=-20; row<=20; row++) for(let col=-20; col<=20; col++) {
  const x=(col+(Math.abs(row)%2 ? 0.5:0))*136, y=row*136*Math.sqrt(3)/2;
  if (Math.hypot(x,y)<1) continue;
  const angle=Math.atan2(y,x)*180/Math.PI;
  const axis=[...axes].sort((a,b)=>angleDistance(angle,a.angle)-angleDistance(angle,b.angle))[0];
  points.push({x,y,angle,axis:axis.id,distance:Math.hypot(x,y)});
}
const slots = axes.flatMap(a => points.filter(p=>p.axis===a.id)
  .sort((l,r)=>l.distance-r.distance || angleDistance(l.angle,a.angle)-angleDistance(r.angle,a.angle) || l.angle-r.angle)
  .slice(0,a.words.length).map((p,index)=>({id:`${a.id}:${index}`,axis:a.id,index,x:p.x,y:p.y})));
const extent=Math.max(...slots.flatMap(p=>[Math.abs(p.x),Math.abs(p.y)]));
const mapSize=Math.ceil((extent+164/2+136)*2/4)*4;
const rule = (id, profileId, anyGroups=[], kindGroups=[], flags=[], excludes=[], priority=100) => ({id,profileId,anyGroups,kindGroups,flags,excludes,priority});
const rules = [
  rule('coffee-name','coffee',[['커피','아메리카노','에스프레소','카페라떼','카페라테','카푸치노','콜드브루','플랫화이트','coffee','espresso','americano','cappuccino']],[],[],[],300),
  rule('tea-name','tea',[['녹차','홍차','우롱차','보이차','말차','얼그레이','허브티','밀크티','루이보스','캐모마일','녹차라떼','홍차라떼','matcha','green tea','black tea']],[],[],[],290),
  rule('fizzy-name','fizzy-drink',[['탄산수','탄산음료','콜라','사이다','스파클링','토닉워터','sparkling','soda','cola']],[],[],[],280),
  rule('cream-noodles','cream-pasta',[['파스타','스파게티','페투치네','링귀니','펜네','pasta'],['크림','cream']],[],[],[],260),
  rule('tomato-noodles','tomato-pasta',[['파스타','스파게티','링귀니','펜네','pasta'],['토마토','아라비아타','뽀모도로','tomato']],[],[],[],260),
  rule('broth-noodles','broth-noodle',[['라멘','라면','우동','쌀국수','칼국수','국물면','잔치국수','ramen','udon']],[],[],['볶음','비빔','마제','야키'],250),
  rule('named-broth-noodles','broth-noodle',[['국물','육수'],['면','국수','noodle']],[],[],[],250),
  rule('grilled-meat','grilled-meat',[['고기','소고기','돼지','닭','오리','삼겹살','목살','갈비','차돌','양고기'],['구이','구운']],[],[],[],240),
  rule('grilled-fish','grilled-fish',[['생선','고등어','연어','갈치','삼치','도미','조기','장어'],['구이','구운']],[],[],[],240),
  rule('raw-seafood','raw-seafood',[['사시미','생굴','연어회','참치회','광어회','모둠회','모듬회','생선회','sashimi']],[],[],[],240),
  rule('fried-name','fried',[['튀김','돈가스','돈까스','가라아게','가라아게','커틀릿','고로케','덴푸라','후라이드']],[],[],[],220),
  rule('fried-kind','fried',[],[['fried_crispy']],[],[],220),
  rule('fermented-broth-name','fermented-broth',[['김치찌개','된장찌개','청국장','된장국','김치전골']],[],[],[],230),
  rule('fermented-broth-kinds','fermented-broth',[],[['broth'],['fermented_jang']],[],[],230),
  rule('salad-name','salad',[['샐러드','생채','salad']],[],[],[],210),
  rule('rice-name','grain-rice',[['쌀밥','보리밥','현미밥','잡곡밥','볶음밥','덮밥','비빔밥','리조또','쌀죽','전복죽','닭죽']],[],[],[],180),
  rule('dessert-name','dessert',[['케이크','디저트','아이스크림','푸딩','무스','타르트','마카롱','케익']],[],[],[],200),
  rule('dessert-kind','dessert',[],[['dessert']],[],[],200),
  rule('milk-explicit',null,[['우유','밀크']],[],['milk_known'],['두유','소이','귀리','오트','아몬드밀크','코코넛밀크','우유 없이','우유없는','무유제품']),
  rule('ice-explicit',null,[['아이스','얼음','iced']],[],['ice_known'],['얼음 없이','얼음없는']),
  rule('sauce-explicit',null,[['소스','글레이즈','sauce']],[],['sauce_known']),
  rule('dressing-explicit',null,[['드레싱','dressing']],[],['dressing_known','sauce_known']),
  rule('cheese-explicit',null,[['치즈','파르미지아노','파마산','cheese']],[],['cheese_known','dairy_known']),
  rule('butter-explicit',null,[['버터','butter']],[],['butter_known','dairy_known'],['땅콩버터','피넛버터']),
  rule('rice-grains',null,[['쌀밥','보리밥','현미밥','잡곡밥','볶음밥','덮밥','비빔밥','리조또']],[],['rice_grains_known']),
  rule('kimchi-explicit',null,[['김치']],[],['kimchi_known']),
  rule('soy-sauce-explicit',null,[['간장']],[],['soy_sauce_known']),
  rule('spice-explicit',null,[['매운','매콤','마라','고추','불닭','청양']],[],['spice_or_pungency_known']),
  rule('spicy-kind',null,[],[['spicy']],['spice_or_pungency_known']),
  rule('citrus-explicit',null,[['레몬','라임','유자','감귤']],[],['citrus_known']),
  rule('sweetened-explicit',null,[['시럽','가당','설탕']],[],['sweetened_known'],['무가당','무설탕','설탕 없이','시럽 없이','제로']),
  rule('chewable-drink',null,[['타피오카','펄 추가','버블티','알로에 음료']],[],['chewable_component_known']),
  rule('baked-structure',null,[['케이크','케익','타르트','쿠키','스콘']],[],['baked_structure_known']),
  rule('layered-structure',null,[['레이어','밀푀유','크레이프 케이크']],[],['layered_structure_known']),
  rule('meat-broth',null,[['사골','고기육수','고기 육수','소고기 육수','닭 육수','돈코츠']],[],['meat_broth_known']),
  rule('anchovy-broth',null,[['멸치육수','멸치 육수']],[],['anchovy_broth_known']),
];
// Only precise kinds activate profiles; a legacy combined kind stays ambiguous.
rules.push(
  rule('raw-seafood-kinds','raw-seafood',[],[['raw'],['seafood']],[],[],240),
  rule('grilled-meat-kinds','grilled-meat',[],[['grilled'],['meat']],[],[],240),
  rule('grilled-fish-kinds','grilled-fish',[],[['grilled'],['seafood']],[],[],240),
  rule('broth-noodle-kinds','broth-noodle',[],[['noodle'],['broth']],[],[],250),
  rule('rice-grain-kind','grain-rice',[],[['rice_grain']],[],[],180),
  ...(source.dish_kind_contexts ?? []).map(c => rule(`dish-kind-${c.kind_id}`,null,[],[[c.kind_id]],[`dish_kind_${c.kind_id}_known`])),
);
const kindOverlays = (source.dish_kind_contexts ?? []).map(c => ({
  id:`dish-kind-${c.kind_id}`, requiresContextFlag:`dish_kind_${c.kind_id}_known`,
  categoryLabels:{}, addTagIds:c.promote_tag_ids, promoteTagIds:c.promote_tag_ids, bubblePromoteIds:[],
}));
const data = {
  version, sourceVersion:source.version, definitionVersion:source.definition_version,
  layoutVersion:'sensory-hex/2', axes, entries,
  archivedEntries:(source.bubble_definition_archive ?? []).map(bubbleEntry),
  families:source.detail_families.map(f=>({id:f.id,label:f.default_label,tags:f.base_tag_ids})),
  profiles:camel(source.food_profiles), overlays:[...camel(source.context_overlays), ...kindOverlays],
  contextFlags:[...(source.dish_kind_contexts ?? []).map(c=>({id:`dish_kind_${c.kind_id}_known`,label:`${c.label} 맥락`})), ...camel(source.detail_context_flag_definitions), ...Object.entries({
    meat_broth_known:'고기 육수', anchovy_broth_known:'멸치 육수', shellfish_component_known:'조개류',
    cheese_known:'치즈', butter_known:'버터', cooked_vegetable_known:'익힌 채소', oil_dressing_known:'오일 드레싱',
    caramel_known:'캐러멜', cacao_known:'카카오', kimchi_known:'김치', soy_sauce_known:'간장',
    sweetened_known:'설탕·시럽 첨가', citrus_known:'감귤류',
  }).map(([id,label])=>({id,label}))], contextDerivations:camel(source.detail_context_derivations),
  contextRules:rules,
  compatibleProfilePairs:[['broth-noodle','fermented-broth'],['raw-seafood','grain-rice'],['fried','grain-rice'],['grilled-meat','grain-rice'],['grilled-fish','grain-rice']],
  layout:{mapSize,bubbleSize:126,selectedBubbleSize:164,gridSpacing:136,slots,maxSwapPairsPerAxis:2},
  reviewStatus:'editorial_candidate_not_validated',
};
if (entries.filter(e=>e.type==='bubble').length!==160 || entries.filter(e=>e.type==='detailTag').length!==147) throw Error('Unexpected catalog counts');
if(source.bubble_nodes.some(n=>!n.description?.trim())) throw Error('Every bubble needs a user-facing explanation');
const definitionKeys=[...entries,...data.archivedEntries].map(e=>`${e.catalogVersion}:${e.type}:${e.id}:${e.definitionVersion}`);
if(new Set(definitionKeys).size!==definitionKeys.length) throw Error('Ambiguous current or historical definition');
if(new Set(source.bubble_nodes.map(n=>n.label)).size!==source.bubble_nodes.length) throw Error('Duplicate bubble labels');
if(new Set(entries.map(e=>e.id)).size!==entries.length || new Set(slots.map(s=>`${s.x}:${s.y}`)).size!==160) throw Error('Duplicate catalog IDs or map slots');
const text=JSON.stringify(data,null,2)+'\n';
for(const relative of ['src/constants/dining-sensory-v2.json','ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json','android/app/src/main/assets/tba/dining-sensory-v2.json']) {
  const path=`${root}${relative}`;
  if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==text) throw Error(`Stale ${relative}`);}
  else {mkdirSync(path.substring(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,text);}
}
console.log(JSON.stringify({version,bubbles:160,details:147,mapSize,slots:slots.length}));
