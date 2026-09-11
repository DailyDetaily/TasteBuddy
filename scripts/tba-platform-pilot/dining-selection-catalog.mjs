import fixture from '../../ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json' with { type: 'json' };
export const DINING_SELECTION_VERSION = 'dining-sensory-selection/1';
const reviewed=new Map();
function define(ids,attribute,extra={}) { for(const id of ids.split(' ')) { if(reviewed.has(id))throw new Error(`DUPLICATE_REVIEWED_SELECTION:${id}`); reviewed.set(id,{attribute,...extra}); } }
// 정확한 ID 목록만 검토한다. 지도 축, 위치, radius/intensity 수치는 사용하지 않는다.
define('sweet-soft sweet-fruit-soft sweet-front sweet-round sweet-caramel sweet-clean-finish sweet-long sweet-syrup sweet-finish-hold sweet-dense sweet-too-much sweet-covering','taste.sweet');
define('sour-fresh sour-soft-citrus sour-opening sour-clean-finish sour-citrus sour-fermented sour-sharp sour-vinegar sour-long sour-tight sour-jumping sour-covering','taste.sour');
define('salty-balanced salty-soft-salt salty-clear salty-flavor-lift salty-broth-salt salty-sauce-forward salty-fermented-salt salty-long-salty salty-front salty-covering','taste.salty');
define('salty-sea-clean salty-strong-sea','taste.unspecified');
define('bitter-soft-after bitter-clean-bitter bitter-herbal bitter-char bitter-finish-clean bitter-dry-bitter bitter-long-bitter bitter-covering','taste.bitter');
define('bitter-roasted','aroma.roasted');
define('bitter-strong-smoke bitter-smoke-cover','aroma.smoky');
define('bitter-burnt','aroma.reference',{reference:true});
define('umami-clear umami-seafood umami-fermented umami-dense umami-meaty umami-long umami-short umami-covering','taste.umami');
define('umami-subtle-depth umami-broth','taste.unspecified');
define('umami-flowing umami-heavy','finish.unspecified');
define('fat-soft-texture','texture.soft');
define('fat-clean-fat fat-long fat-rich fat-fat-covering','mouthfeel.fatty');
define('fat-nutty-weight fat-buttery','taste.unspecified');
define('fat-creamy fat-greasy','mouthfeel.unspecified');
define('fat-silky','texture.smooth');
define('fat-coating','mouthfeel.coating');
define('fat-finish-heavy','finish.unspecified');
define('balance-clear-seasoning','taste.salty');
define('balance-well-balanced','flavor.balance');
define('balance-sweet-support','taste.sweet');
define('balance-acid-cleans','taste.sour');
define('balance-umami-depth','taste.umami');
define('balance-one-note-forward balance-center-clear balance-flavors-layered balance-edge-soft','taste.unspecified',{contextRole:'relation'});
define('balance-finish-heavy balance-aftertaste-light','finish.unspecified',{contextRole:'relation'});
define('balance-intensity-high','taste.unspecified',{contextRole:'intensity'});
define('flow-first-clear flow-middle-spreads flow-deepens-late flow-clean-finish flow-long-lasting flow-quick-fade flow-opens-next flow-finish-piled flow-front-soft flow-middle-tight flow-rhythm-smooth flow-finish-quiet','finish.unspecified',{contextRole:'temporal'});
define('texture-soft','texture.soft');
define('texture-dense texture-light texture-dry','texture.unspecified');
define('texture-coating','mouthfeel.coating');
define('texture-temperature-right','temperature.unspecified');
define('texture-cool-cleans','temperature.cold');
define('texture-warm-spreads','temperature.warm');
define('texture-silky','texture.smooth');
define('texture-chewy','texture.chewy');
define('texture-crisp','texture.crisp');
define('texture-juicy','texture.moist'); // 수분감은 즙 방출과 다르다.
define('aroma-seafood','aroma.marine');
define('aroma-meaty aroma-earthy aroma-spice aroma-broth','aroma.reference',{reference:true});
define('aroma-herbal','aroma.herbal');
define('aroma-fermented','aroma.fermented');
define('aroma-roasted','aroma.roasted');
define('aroma-smoky','aroma.smoky');
define('aroma-fruity','aroma.fruity');
define('aroma-nutty','aroma.nutty');
define('aroma-ingredient-clear','aroma.unspecified');
define('composition-cook-point composition-sauce-leads composition-contrast-good composition-connected composition-cooking-strong composition-course-fit composition-garnish-works composition-fire-clear composition-portion-right composition-transition-good','taste.unspecified',{contextRole:'relation'});
define('composition-fat-supports','mouthfeel.fatty');
define('composition-acid-structure','taste.sour');
const overrides={
 'sweet-fruit-soft':{intrinsicIntensity:'weak'},
 'sweet-too-much':{intrinsicFit:'above_preferred'},
 'salty-balanced':{intrinsicFit:'just_right'},
 'salty-broth-salt':{intrinsicTarget:'broth'},
 'salty-strong-sea':{intrinsicIntensity:'strong'},
 'salty-sauce-forward':{intrinsicTarget:'sauce',intrinsicIntensity:'strong'},
 'bitter-strong-smoke':{intrinsicIntensity:'strong'},
 'balance-intensity-high':{intrinsicIntensity:'strong'},
 'texture-temperature-right':{intrinsicFit:'just_right'},
 'composition-sauce-leads':{intrinsicTarget:'sauce'},
};
export const DINING_SELECTION_CATALOG=Object.freeze([
 ...fixture.tasteExperienceAxes.flatMap(axis=>axis.words.map(word=>({id:`${axis.id}-${word.key}`,type:'bubble',label:word.label}))),
 ...fixture.detailTagCategories.flatMap(category=>category.tags.map(tag=>({id:tag.id,type:'detailTag',label:tag.label}))),
].map(entry=>{
 const definition=reviewed.get(entry.id);if(!definition)throw new Error(`UNREVIEWED_SELECTION:${entry.id}`);
 return {...entry,catalogVersion:DINING_SELECTION_VERSION,...definition,...overrides[entry.id],resolution:definition.attribute.endsWith('.unspecified')?'reviewed_descriptor':'resolved'};
}));
if(DINING_SELECTION_CATALOG.length!==132||reviewed.size!==132)throw new Error('SELECTION_CATALOG_COVERAGE_MISMATCH');
export const DINING_SELECTION_VALUES=Object.freeze({
 liking:{liked:'positive',neutral:'neutral',disliked:'negative'},
 intensity:{light:'weak',medium:'medium',strong:'strong'},
 preferenceFit:{tooWeak:'below_preferred',justRight:'just_right',tooStrong:'above_preferred'},
 target:{unspecified:'unspecified',whole_dish:'whole_dish',sauce:'sauce',surface:'surface',inside:'inside',coating:'coating',skin:'skin',broth:'broth',noodles:'noodles',meat:'meat',filling:'filling',flesh:'flesh',cream:'cream'},
 phase:{unspecified:'unspecified',first_bite:'first_bite',early_meal:'early_meal',during_meal:'during_meal',late_meal:'late_meal',after_swallow:'after_swallow',after_meal:'after_meal'},
});
export const DINING_SELECTION_LABELS=Object.freeze({
 liking:{liked:'좋았어요',neutral:'보통이에요',disliked:'아쉬웠어요'},intensity:{light:'약하게',medium:'중간 정도',strong:'강하게'},preferenceFit:{tooWeak:'조금 부족했어요',justRight:'알맞았어요',tooStrong:'조금 과했어요'},
 target:{unspecified:'따로 정하지 않음',whole_dish:'음식 전체',sauce:'소스',surface:'겉',inside:'속',coating:'튀김옷',skin:'껍질',broth:'국물',noodles:'면',meat:'고기',filling:'소',flesh:'속살',cream:'크림'},
 phase:{unspecified:'따로 정하지 않음',first_bite:'첫입',early_meal:'초반',during_meal:'먹는 동안',late_meal:'나중',after_swallow:'삼킨 뒤',after_meal:'식사 후'},
});
