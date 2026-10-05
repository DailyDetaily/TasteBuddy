export function discoveryFixtures(m) {
  const now=new Date('2026-09-22T12:00:00+09:00'), day=86400000;
  let index=0;
  const entry=({menu='비교 국수', age=1, liking='liked', fit='justRight', intensity='medium', overall='liked', choices, ...extra}={})=>{
    const id=`00000000-0000-4000-8000-${String(++index).padStart(12,'0')}`;
    return m.prepareNativeRecord({...m.newNativeRecord(undefined,now),id,mealID:id,menu,restaurant:'검증 식당',restaurantID:'qa-r1',foodSource:{kind:'restaurant',restaurantNamespace:'kakao',version:1},
      mealTime:age===null?null:{source:'user_confirmed',start:m.swiftTime(new Date(+now-age*day))},
      sensorySelections:choices??[{...m.makeSelection('sour-fresh','bubble'),liking,preferenceFit:fit,intensity,target:'broth',phase:'during_meal'}],
      overallEvaluation:overall?m.overallEvaluation(overall):null,...extra},undefined,now);
  };
  const batch=(n,options={})=>Array.from({length:n},(_,i)=>entry({...options,age:(options.age??1)+i}));
  const good=batch(3),bad=batch(3,{menu:'비교 만두',liking:'disliked'});
  const shared=entry({menu:'비교 국수',age:8}),sharedOther=entry({menu:'비교 만두',age:8,liking:'disliked',mealID:shared.mealID});
  const periods=[...batch(5,{age:100,liking:'disliked',fit:'tooStrong'}),...batch(5,{age:1})];
  const sour=m.makeSelection('sour-fresh','bubble'),salty=m.makeSelection('salty-balanced','bubble');
  const presence=[...batch(5,{age:100,choices:[salty]}),...batch(5,{age:1,choices:[sour]})];
  const parent={...sour,intensity:'medium',target:'whole_dish',phase:'during_meal'};
  const child={...m.makeSelection('balance-acid-cleans','detailTag'),relatedBubbleID:'sour-fresh',liking:'liked',preferenceFit:'justRight',target:'whole_dish',phase:'during_meal'};
  const cases=[
    ['empty',[]],['common',[...good,entry({menu:'비교 만두'})]],['conditional',[...good,...bad]],['shared-excluded',[...good,...bad,shared,sharedOther]],
    ['exception',[...batch(4,{age:3}),entry({liking:'disliked'})]],['exception-two-latest',[...batch(4,{age:3}),entry({liking:'disliked'}),entry({liking:'disliked'})]],
    ['familiar-new',[...batch(3,{age:5}),entry({menu:'새 메뉴'})]],['familiar-counter',[...batch(3,{age:5}),entry({age:4,liking:'disliked'}),entry({menu:'새 메뉴'})]],
    ['familiar-too-many-counter',[...batch(3,{age:5}),...batch(2,{age:3,liking:'disliked'}),entry({menu:'새 메뉴'})]],
    ['preferred',[...good,...batch(3,{intensity:'strong',fit:'tooStrong'})]],['only-too-strong',batch(3,{fit:'tooStrong'})],
    ['overall-example',[entry({liking:'disliked'})]],['overall-mixed',[shared,sharedOther]],
    ['revisit',[entry({age:5,overall:'disliked'}),entry()]],['revisit-latest-missing',[entry({age:5,overall:'disliked'}),entry({overall:null})]],
    ['period',periods],['period-missing-phase',periods.map(e=>({...e,sensorySelections:e.sensorySelections.map(c=>({...c,phase:undefined}))}))],
    ['period-missing-intensity',periods.map(e=>({...e,sensorySelections:e.sensorySelections.map(c=>({...c,intensity:undefined}))}))],
    ['period-one-day',[...batch(5,{age:100,liking:'disliked',fit:'tooStrong'}).map(e=>({...e,mealTime:{source:'user_confirmed',start:m.swiftTime(new Date(+now-100*day))}})),...batch(5).map(e=>({...e,mealTime:{source:'user_confirmed',start:m.swiftTime(new Date(+now-day))}}))]],
    ['presence',presence],['parent-intensity',batch(3,{choices:[parent,child]})],['orphan-child',batch(3,{choices:[child]})],
    ['unknown-dates',[...good,...bad].map(e=>({...e,mealTime:null}))],['period-thirty',[...batch(5,{age:40,liking:'disliked',fit:'tooStrong'}),...batch(5)],{period:'thirty'}],
    ['selected-month',[...batch(3,{age:100,menu:'오래된 메뉴'}),...batch(3)],{period:'month'}],
    ['source-restaurant',periods,{source:'restaurant'}],['source-homeCooked',periods,{source:'homeCooked'}],
  ].map(([id,entries,options={}])=>({id,entries,options,now}));
  return {cases,entry,batch,now};
}
