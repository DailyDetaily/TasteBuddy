import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const COHORT_HASH='97f44fd703fb056f5ecaec0c7790f80d832ab50b1e758e75dacf2042c0110706';
export const REVIEW_VERSION='advanced-model-review/1';
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const hash=value=>createHash('sha256').update(canonical(value)).digest('hex');
export async function loadFrozenCohorts(){const text=await readFile(new URL('./advanced-personal-cohorts.json',import.meta.url),'utf8');assert.equal(createHash('sha256').update(text).digest('hex'),COHORT_HASH,'동결 cohort 파일이 변경됨');return JSON.parse(text);}
const directions={liked:'positive',neutral:'neutral',disliked:'negative'};
const intensities={light:'weak',medium:'medium',strong:'strong'};

// 원자료 DTO를 이미 알려진 관찰 계약으로만 옮긴다. 생산 모델/정답 출력은 사용하지 않는다.
export function recordsForMeal(meal){
  const s=meal.selection, phrase=s.labelSnapshot;
  const base={userId:meal.userID,mealId:meal.mealID,experienceId:meal.mealID,attribute:'taste.sour',reference:null,target:s.target??'unspecified',phase:s.phase??'unspecified',observedAt:meal.observedAt,knownAt:meal.knownAt,dishKindIDs:meal.dishKindIDs??[],phrase,sourceSpans:[{start:0,end:phrase.length,quote:phrase}],confirmationStatus:'explicit_user_choice',evidenceClass:'synthetic_fixture'};
  const rows=[];
  const add=(kind,value,scale,facet)=>rows.push({...base,observationId:`${meal.mealID}:${facet}`,kind,value,scale,selectionEvidence:{selectionID:s.id,type:s.type,catalogVersion:s.catalogVersion,labelSnapshot:phrase,facet,labelValue:({liking:{liked:'좋았어요',neutral:'보통이에요',disliked:'아쉬웠어요'},intensity:{light:'약하게',medium:'중간 정도',strong:'강하게'},preferenceFit:{tooWeak:'조금 부족했어요',justRight:'알맞았어요',tooStrong:'조금 과했어요'}}[facet]?.[s[facet]])??phrase,responseValue:s[facet]??s.id,resolution:'resolved'}});
  add('sensory_presence',true,'presence-v1','selection');
  if(s.liking!=null)add('attribute_liking',directions[s.liking],'attribute-three-category-v1','liking');
  if(s.intensity!=null)add('sensory_intensity',intensities[s.intensity],'expression-strength-v1','intensity');
  if(s.preferenceFit!=null)add('preference_fit',{tooWeak:'below_preferred',justRight:'just_right',tooStrong:'above_preferred'}[s.preferenceFit],'preference-fit-v1','preferenceFit');
  return rows;
}
const normalization=(records,userId)=>({userId,records,evidenceSetHash:hash(records)});
function baselinePrediction(records,query){
  const byMeal=new Map();
  for(const r of records){if(r.kind!=='attribute_liking'||r.attribute!==query.attribute)continue;const votes=byMeal.get(r.mealId)??new Set();votes.add(r.value);byMeal.set(r.mealId,votes);}
  const counts={positive:0,neutral:0,negative:0};
  for(const votes of byMeal.values())if(votes.size===1&&Object.hasOwn(counts,[...votes][0]))counts[[...votes][0]]++;
  const ordered=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  return {direction:byMeal.size>=3&&ordered[0][1]>ordered[1][1]?ordered[0][0]:null,status:'attribute_meal_majority',counts};
}
function metrics(rows,key){const predicted=rows.filter(r=>r[key].direction!=null),wrong=predicted.filter(r=>r[key].direction!==r.groundTruth);return {total:rows.length,predicted:predicted.length,abstained:rows.length-predicted.length,correct:predicted.length-wrong.length,wrongPredictions:wrong.length,accuracyAmongPredictions:predicted.length?(predicted.length-wrong.length)/predicted.length:null,predictionCoverage:rows.length?predicted.length/rows.length:0,abstentionCoverage:rows.length?(rows.length-predicted.length)/rows.length:0,wrongConfidentPredictions:wrong.length,confidenceCountMeaning:'incorrect non-abstaining direction; not calibrated probability'};}

export function evaluateFrozenCohorts(fixture,{buildPersonalTasteModel,predictPersonalTaste}){
  return fixture.cohorts.map(cohort=>{
    const evaluated=[];
    for(const heldout of cohort.meals.filter(m=>m.holdout)){
      const trainMeals=cohort.meals.filter(m=>m.mealID!==heldout.mealID&&m.userID===heldout.userID&&Date.parse(m.observedAt)<=Date.parse(heldout.queryAt)&&Date.parse(m.knownAt)<=Date.parse(heldout.queryAt));
      assert.ok(trainMeals.every(m=>m.mealID!==heldout.mealID));
      const records=trainMeals.flatMap(recordsForMeal),query={attribute:fixture.attribute,reference:null,target:heldout.selection.target,phase:heldout.selection.phase,intensity:intensities[heldout.selection.intensity],dishKindIDs:heldout.dishKindIDs};
      assert.ok(!Object.hasOwn(query,'liking')&&!Object.hasOwn(query,'overallEvaluation'));
      const model=buildPersonalTasteModel(normalization(records,heldout.userID),{asOf:heldout.queryAt});
      const prediction=predictPersonalTaste(model,query),knownIDs=new Set(records.map(r=>r.observationId));
      assert.ok((prediction.evidenceIDs??[]).every(id=>knownIDs.has(id)),'예측이 학습 밖의 근거를 참조함');
      evaluated.push({modelVersion:model.version,mealID:heldout.mealID,queryAt:heldout.queryAt,trainMealIDs:trainMeals.map(m=>m.mealID),groundTruth:heldout.groundTruth.direction,model:prediction,baseline:baselinePrediction(records,query)});
    }
    return {id:cohort.id,model:metrics(evaluated,'model'),baseline:metrics(evaluated,'baseline'),evaluated};
  });
}

function manualMeal(id,liking='liked',extra={}){return {mealID:id,userID:'review-user',observedAt:'2026-01-01T12:00:00Z',knownAt:'2026-01-01T13:00:00Z',dishKindIDs:[],selection:{id:'sour-fresh',type:'bubble',catalogVersion:'dining-sensory-selection/1',labelSnapshot:'산뜻한 산미',liking,target:'unspecified',phase:'unspecified',...extra}};}
const evidenceIDs=model=>[...new Set((model.candidates??[]).flatMap(c=>c.evidenceIDs??[]).concat(model.nextSelection?.evidenceIDs??[]))];
const distributions=model=>(model.candidates??[]).map(c=>({attribute:c.attribute,conditions:c.conditions,distribution:c.distribution,direction:c.direction,status:c.status,supportMealIDs:c.supportMealIDs,counterMealIDs:c.counterMealIDs,neutralMealIDs:c.neutralMealIDs,mixedMealIDs:c.mixedMealIDs})).sort((a,b)=>canonical(a).localeCompare(canonical(b)));

export function evaluateFrozenScenarios({buildPersonalTasteModel:build,predictPersonalTaste:predict}){
  const results=[];
  const check=(id,fn)=>{try{const details=fn();results.push({id,status:'passed',details:details??null});}catch(error){results.push({id,status:'failed',reason:error.message});}};
  const unconnected=(id,reason)=>results.push({id,status:'contract_unconnected',reason});
  const model=(rows,options={})=>build(normalization(rows,'review-user'),options);
  const rows=(id,liking='liked',extra={})=>recordsForMeal(manualMeal(id,liking,extra));
  const series=(prefix,n,liking,extra)=>Array.from({length:n},(_,i)=>rows(`${prefix}-${i}`,liking,extra)).flat();
  const hasContext=(m,dimension,value,vote)=>m.candidates.some(c=>c.conditions.some(d=>d.dimension===dimension&&d.value===value)&&c.distribution[vote]>0);
  check('AM-01',()=>{const m=model([...series('weak',4,'liked',{intensity:'light'}),...series('strong',4,'disliked',{intensity:'strong'})]);assert.ok(hasContext(m,'intensity','weak','positive'));assert.ok(hasContext(m,'intensity','strong','negative'));});
  check('AM-02',()=>{const m=model([...series('sauce',4,'liked',{target:'sauce'}),...series('dish',4,'disliked',{target:'whole_dish'})]);assert.ok(hasContext(m,'target','sauce','positive'));assert.ok(hasContext(m,'target','whole_dish','negative'));});
  check('AM-03',()=>{const m=model([...series('first',4,'liked',{phase:'first_bite'}),...series('late',4,'disliked',{phase:'late_meal'})]);assert.ok(hasContext(m,'phase','first_bite','positive'));assert.ok(hasContext(m,'phase','late_meal','negative'));});
  check('AM-04',()=>{const a=series('seafood',4,'liked',{}).map(r=>({...r,dishKindIDs:['seafood']})),b=series('meat',4,'disliked',{}).map(r=>({...r,dishKindIDs:['meat']}));const m=model([...a,...b]);assert.ok(hasContext(m,'dishKind','seafood','positive'));assert.ok(hasContext(m,'dishKind','meat','negative'));});
  check('AM-05',()=>{const m=model(series('seafood',5,'liked',{}).map(r=>({...r,dishKindIDs:['seafood']})));const p=predict(m,{attribute:'taste.sour',dishKindIDs:['meat']});assert.equal(p.direction,null,'한 음식종류만 관찰한 호감을 미경험 종류에 확정 적용');});
  check('AM-06',()=>{const m=model([...series('yes',4,'liked',{}),...series('no',4,'disliked',{})]);assert.equal(predict(m,{attribute:'taste.sour'}).direction,null);assert.ok(m.candidates.some(c=>c.distribution.positive>0&&c.distribution.negative>0));});
  check('AM-07',()=>{const m=model([...series('conf-a',4,'liked',{target:'sauce',intensity:'light',phase:'first_bite'}),...series('conf-b',4,'disliked',{target:'whole_dish',intensity:'strong',phase:'late_meal'})]);assert.equal(predict(m,{attribute:'taste.sour',target:'sauce',intensity:'strong',phase:'first_bite'}).direction,null,'여러 조건이 교란된 미관찰 조합을 확정 예측');});
  check('AM-08',()=>{const input=series('strong-like',4,'liked',{intensity:'strong',preferenceFit:'justRight'});const before=structuredClone(input);const m=model(input);assert.deepEqual(input,before);assert.ok(m.candidates.some(c=>c.distribution.positive===4&&c.distribution.negative===0));});
  check('AM-09',()=>{const input=series('duplicates',4,'liked',{});assert.deepEqual(distributions(model(input)),distributions(model([...input].reverse().concat(input))));});
  check('AM-10',()=>{const m=model(rows('one-facets','liked',{intensity:'strong',target:'sauce',phase:'first_bite'}));assert.ok(m.candidates.every(c=>c.distribution.mealCount<=1));});
  check('AM-11',()=>{const input=rows('same-meal','liked',{}).map(r=>({...r,attribute:'aroma.roasted',phrase:'구운 향',sourceSpans:[{start:0,end:4,quote:'구운 향'}],selectionEvidence:{...r.selectionEvidence,selectionID:'bitter-roasted',labelSnapshot:'구운 향',labelValue:r.selectionEvidence.facet==='selection'?'구운 향':r.selectionEvidence.labelValue,responseValue:r.selectionEvidence.facet==='selection'?'bitter-roasted':r.selectionEvidence.responseValue}})),duplicate=input.map(r=>({...r,observationId:`${r.observationId}:aroma-roasted`,selectionEvidence:{...r.selectionEvidence,selectionID:'aroma-roasted',type:'detailTag',responseValue:r.selectionEvidence.facet==='selection'?'aroma-roasted':r.selectionEvidence.responseValue,relatedBubbleID:'bitter-roasted',relatedBubbleLabel:'구운 향'}}));const m=model([...input,...duplicate]);assert.ok(m.candidates.every(c=>c.distribution.mealCount<=1));});
  check('AM-12',()=>{const m=model([...rows('distinct-a'),...rows('distinct-b')]);assert.ok(m.candidates.some(c=>c.distribution.mealCount===2));});
  check('AM-13',()=>{const input=series('same-sour',4,'disliked',{});const overall=value=>({...input[0],observationId:'overall',kind:'overall_liking',attribute:null,value,scale:'overall-five-category-v1'});assert.deepEqual(distributions(model([...input,overall('positive')])),distributions(model([...input,overall('very_negative')])));});
  check('AM-14',()=>{const input=series('whole-only',4,'liked',{}).filter(r=>r.kind==='attribute_liking').map(r=>({...r,kind:'overall_liking',attribute:null,scale:'overall-five-category-v1',value:'very_positive'}));assert.equal(model(input).candidates.length,0);});
  check('AM-15',()=>{const m=model(rows('unanswered',null,{}));assert.ok(m.candidates.every(c=>c.distribution.positive===0&&c.distribution.neutral===0&&c.distribution.negative===0));});
  check('AM-16',()=>{const m=model([...rows('neutral','neutral'),...rows('negative','disliked')]);assert.ok(m.candidates.some(c=>c.distribution.neutral===1&&c.distribution.negative===1&&c.distribution.positive===0));});
  check('AM-17',()=>{const m=model(rows('selected-only'));assert.ok(m.candidates.every(c=>c.attribute==='taste.sour'));assert.ok(!JSON.stringify(m).includes('texture.crisp'));});
  unconnected('AM-18','완료 전 기록 제외는 실제 DiningEntry→관찰 진입 검사가 필요하며 모델 단독 record 계약에는 feedbackStatus가 없음');
  check('AM-19',()=>{const input=rows('unknown').map(r=>({...r,attribute:'taste.unspecified',selectionEvidence:{...r.selectionEvidence,resolution:'unresolved'}}));assert.equal(predict(model(input),{attribute:'taste.sour'}).direction,null);assert.ok(!model(input).candidates.some(c=>c.status==='repeated_direction'));});
  check('AM-20',()=>{const before=model(series('edit',4,'liked',{}));const after=model(series('edit',4,'disliked',{}));assert.ok(before.candidates.some(c=>c.distribution.positive===4));assert.ok(after.candidates.every(c=>c.distribution.positive===0));});
  check('AM-21',()=>{const input=series('clear-overall',4,'disliked',{}),whole={...input[0],observationId:'whole-clear',kind:'overall_liking',attribute:null,value:'very_negative',scale:'overall-five-category-v1'};const cleared=model(input);assert.deepEqual(distributions(cleared),distributions(model([...input,whole])));assert.equal(cleared.overallAssociations.length,0);assert.ok(!evidenceIDs(cleared).includes('whole-clear'));});
  unconnected('AM-22','sensorySelections=[]와 legacy bare IDs의 부활 여부는 실제 저장→관찰 진입 연결이 필요함');
  check('AM-23',()=>{const input=series('delete',4,'liked',{}),removed=new Set(input.filter(r=>r.mealId==='delete-0').map(r=>r.observationId));const after=model(input.filter(r=>r.mealId!=='delete-0'));assert.ok(evidenceIDs(after).every(id=>!removed.has(id)));});
  check('AM-24',()=>{const old=series('known',4,'liked',{}),future=series('future',4,'disliked',{}).map(r=>({...r,knownAt:'2026-02-01T00:00:00Z'}));const cut='2026-01-02T00:00:00Z';const a=model(old,{asOf:cut}),b=model([...old,...future],{asOf:cut});assert.deepEqual(distributions(a),distributions(b));assert.ok(evidenceIDs(b).every(id=>!id.startsWith('future-')));});
  check('AM-25',()=>{const m=model(rows('single'));assert.equal(predict(m,{attribute:'taste.sour'}).direction,null);assert.ok(m.candidates.every(c=>c.status!=='repeated_direction'));});
  check('AM-26',()=>{const m=model([...series('support',4,'liked',{target:'sauce'}),...rows('exception','disliked',{target:'whole_dish'})]);assert.ok(m.candidates.some(c=>c.distribution.negative>0));assert.ok(evidenceIDs(m).some(id=>id.startsWith('exception:')));});
  unconnected('AM-27','실제 질문 노출·dismissal 이력 계약과 생성기를 연결해야 같은 맥락 재노출을 검사할 수 있음');
  check('AM-28',()=>{const m=model(series('answered',4,'liked',{intensity:'strong',target:'sauce',phase:'first_bite'}));if(m.nextSelection?.attribute==='taste.sour')assert.notEqual(m.nextSelection.facet,'liking','동일한 직접 응답을 다시 미응답 질문으로 생성');});
  check('AM-29',()=>{const input=series('trace',4,'liked',{target:'sauce'}),ids=new Set(input.map(r=>r.observationId)),m=model(input);assert.ok(evidenceIDs(m).every(id=>ids.has(id)));if(m.nextSelection)assert.equal(m.nextSelection.createsEvidence,false);assert.deepEqual(input,series('trace',4,'liked',{target:'sauce'}));if(m.nextSelection){const question={...input[0],observationId:'generated-question',kind:'generated_question',value:m.nextSelection.question,confirmationStatus:'generated_not_user_evidence'};assert.deepEqual(distributions(model([...input,question])),distributions(m));}});
  check('AM-30',()=>{const m=model(series('only-strong',4,'disliked',{intensity:'strong'}));assert.equal(predict(m,{attribute:'taste.sour',intensity:'weak'}).direction,null,'약한 산미를 먹은 적 없는데 호감 방향을 예측');});
  check('AM-31',()=>{const input=[...series('order-a',4,'liked',{target:'sauce'}),...series('order-b',4,'disliked',{target:'whole_dish'})];assert.deepEqual(model(input),model([...input].reverse()));});
  check('AM-32',()=>{const own=series('mine',4,'liked',{}),other=series('other',8,'disliked',{}).map(r=>({...r,userId:'another-user'}));try{const m=model([...own,...other]);assert.deepEqual(distributions(m),distributions(model(own)));assert.ok(evidenceIDs(m).every(id=>!id.startsWith('other-')));}catch(error){assert.match(error.message,/user|owner|mixed/i);}});
  return results.sort((a,b)=>a.id.localeCompare(b.id));
}

export async function runAdvancedPersonalEvaluation(){
  const fixture=await loadFrozenCohorts();
  const api=await import('./personal-taste-model.mjs');
  const scenarios=evaluateFrozenScenarios(api),cohorts=evaluateFrozenCohorts(fixture,api);
  return {version:'advanced-personal-evaluation/1',queryKnownConditions:'explicitly supplied target, phase, intensity and dish kinds; outcome liking excluded',preConsumptionPrediction:false,scope:'conditional response evaluation given reported sensory conditions; not menu recommendation accuracy',productionSourceHash:createHash('sha256').update(await readFile(new URL('./personal-taste-model.mjs',import.meta.url))).digest('hex'),scenarioVersion:REVIEW_VERSION,cohortHash:COHORT_HASH,evaluationType:'synthetic_development_not_real_user_accuracy',actualApiCalls:0,scenarios,scenarioCounts:Object.fromEntries(['passed','failed','contract_unconnected'].map(status=>[status,scenarios.filter(s=>s.status===status).length])),cohorts};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const result=await runAdvancedPersonalEvaluation();
  const output=process.argv[2];if(output)await writeFile(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({...result,cohorts:result.cohorts.map(({evaluated,...summary})=>summary)},null,2));
}
