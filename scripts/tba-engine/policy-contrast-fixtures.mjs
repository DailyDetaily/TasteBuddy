// Synthetic semantic oracles, authored independently of model output. Never import production code here.
const copy = value => structuredClone(value);
const choice = (id, extra = {}) => ({selectionID:id,type:'bubble',catalogVersion:'policy-test/1',labelSnapshot:'산미',facet:'liking',labelValue:'좋았어요',responseValue:'liked',relatedBubbleID:null,relatedBubbleLabel:null,resolution:'resolved',selectionInstanceID:id,...extra});
const row = (id, extra = {}) => ({observationId:id,userId:'owner',experienceId:`e-${id}`,mealId:`m-${id}`,kind:'attribute_liking',attribute:'taste.sour',attributeLabel:'산미',reference:null,value:'positive',scale:'attribute-three-category-v1',target:'whole_dish',phase:'during_meal',observedAt:'2026-10-01T03:00:00.000Z',knownAt:'2026-10-01T04:00:00.000Z',dishKindIDs:[],phrase:'합성 직접 응답',sourceSpans:[],confirmationStatus:'explicit_user_choice',conditionSources:[],...extra});
const rated = () => [1,2,3].map(n=>row(`r${n}`));
const intensity = (r, extra = {}) => ({...r,observationId:r.observationId+'-intensity',kind:'sensory_intensity',value:'strong',scale:'expression-strength-v1',...extra});
const overall = (r, extra = {}) => ({...r,observationId:r.observationId+'-overall',kind:'overall_liking',attribute:null,value:'very_positive',scale:'overall-five-category-v1',...extra});
const input = (records, options = {}, query = null) => ({userID:'owner',records,options:{_assessQuestions:false,...options},query});
const pairs = [];
function pair(id,title,changed,basis,a,ae,b,be,forbidden) {
  pairs.push({id,title,evidenceClass:'synthetic_fixture',changedCoreCondition:changed,oracleBasis:basis,forbiddenInterpretation:forbidden,variants:[{label:'A',input:copy(a),expected:ae},{label:'B',input:copy(b),expected:be}]});
}
{
 const a=rated(), b=a.map(r=>({...r,mealId:'one-meal'}));
 pair('C01','식사와 접시','mealId grouping','같은 식사의 여러 접시는 독립 반복을 늘리지 않는다.',input(a),{mealCount:3,direction:'positive'},input(b),{mealCount:1,direction:null},'접시 3개를 식사 3회로 계산');
 pair('C02','첫 단서와 반복','2 versus 3 meals','현행 최소 3회 정책은 유지하되 2회의 직접 응답도 보존한다.',input(a.slice(0,2)),{mealCount:2,direction:null,unitCount:2},input(a),{mealCount:3,direction:'positive',unitCount:3},'유보를 무기록으로 바꾸기');
 const fourth=row('r4',{value:'neutral'});
 pair('C03','중립과 반대','fourth response value','중립을 호감 횟수로 세지 않으며 명시적 반대는 보존한다.',input([...a,fourth]),{mealCount:4,direction:'positive',positive:3,neutral:1},input([...a,{...fourth,value:'negative'}]),{mealCount:4,direction:null,positive:3,negative:1},'호감 4회 또는 반례 삭제');
 const presence=row('r4-presence',{experienceId:fourth.experienceId,mealId:fourth.mealId,kind:'sensory_presence',scale:'presence-v1',value:true});
 pair('C04','미응답과 중립','liking response presence','감각만 기록한 식사는 중립 응답이 아니다.',input([...a,presence]),{mealCount:3,neutral:0},input([...a,presence,fourth]),{mealCount:4,neutral:1},'미응답을 중립으로 대체');
 const extra=row('duplicate-dish',{mealId:a[0].mealId});
 pair('C05','식사 내부 상충','one same-meal response value','한 식사 안의 반대 응답은 mixed이며 평균 중립이 아니다.',input([...a,extra]),{mealCount:3,mixed:0,direction:'positive'},input([...a,{...extra,value:'negative'}]),{mealCount:3,mixed:1,direction:null},'상충을 오류로 삭제하거나 중립으로 평균');
 pair('C06','동일 ID 사본','duplicate value consistency','동일 관찰은 한 번만, 충돌 사본은 입력 순서로 택하지 않는다.',input([...a,a[0]]),{mealCount:3,excludedCount:0},input([...a,{...a[0],value:'negative'}]),{mealCount:2,excludedCount:1},'중복으로 근거 증가');
}
{
 const r=row('link',{selectionEvidence:choice('one')}), i=intensity(r,{selectionEvidence:choice('one',{facet:'intensity'})});
 pair('C07','선택 인스턴스','intensity selectionInstanceID','선택 A의 강도를 별도 선택 B의 호감에 빌려주지 않는다.',input([r,i]),{intensities:['strong']},input([r,{...i,selectionEvidence:{...i.selectionEvidence,selectionInstanceID:'other'}}]),{intensities:[null]},'다른 선택의 강도 전파');
 const invalid=[r,i].map(v=>({...v,selectionEvidence:{...v.selectionEvidence,catalogVersion:''}}));
 pair('C08','정체성 검증','catalogVersion presence','필수 식별 정보 누락은 같은 선택이라는 증거가 아니다. 직접 호감은 남긴다.',input([r,i]),{unitCount:1,intensities:['strong']},input(invalid),{unitCount:1,intensities:[null]},'빈 식별자끼리 같은 선택으로 연결');
 const foreign=row('diagnostic',{knownAt:null,userId:'other'});
 pair('C09','계정 진단','userId of unknown-knownAt row','현재 계정의 누락 진단에 다른 계정 자료를 합치지 않는다.',input([r,foreign]),{missingKnownAtCount:0},input([r,{...foreign,userId:'owner'}]),{missingKnownAtCount:1},'다른 계정의 누락 수 표시');
 const whole=overall(r);
 pair('C10','전체 평가 연결','overall mealId','전체와 개별 평가는 같은 경험과 식사에 속해야 한다.',input([r,whole]),{overallAssociationCount:1,hasOverallPatterns:true},input([r,{...whole,mealId:'other-meal'}]),{overallAssociationCount:0,hasOverallPatterns:false},'다른 식사의 전체 평가 연결');
 pair('C11','전체 평가 유효값','overall value','5단계 척도 이름만 맞고 값이 미지원이면 유효 응답이 아니다.',input([r,whole]),{overallAssociationCount:1,hasOverallPatterns:true},input([r,{...whole,value:'unsupported'}]),{overallAssociationCount:0,hasOverallPatterns:false},'미지원 값을 평가로 생성');
}
{
 const records=[], links={};
 for(let n=1;n<=3;n++) {
  const r=row('parent-'+n,{selectionEvidence:choice('child-'+n,{relatedBubbleID:'parent-'+n})});
  const i=intensity(r,{selectionEvidence:choice('parent-'+n,{facet:'intensity'})});
  const f={...r,observationId:'fit-'+n,kind:'preference_fit',scale:'preference-fit-v1',value:'above_preferred'};
  records.push(r,i,f,overall(r));links[r.observationId]=[i.observationId];links[f.observationId]=[i.observationId];
 }
 const fit=records.filter(r=>['preference_fit','sensory_intensity'].includes(r.kind));
 const options={_assessQuestions:true,individualQuestions:true};
 pair('C12','알맞음의 강도 질문','validatedIntensityLinks only','검증된 응답 강도는 집계와 미응답 판단에서 동일해야 한다.',input(fit,options),{hasFitIntensity:false,intensityClarificationCount:3},input(fit,{...options,validatedIntensityLinks:links}),{hasFitIntensity:true,intensityClarificationCount:0},'이미 아는 강도를 다시 질문');
 pair('C13','전체 교차 조건','validatedIntensityLinks only','호감과 연결된 검증 강도가 전체 평가와의 교차에서도 보존된다.',input(records),{hasOverallIntensity:false},input(records,{validatedIntensityLinks:links}),{hasOverallIntensity:true,overallHasIntensityEvidence:true},'교차 해석에서 조건 근거 누락');
}
{
 const rows=rated(),cutoff={asOf:'2026-10-02T00:00:00.000Z'};
 for(const [id,key] of [['C14','observedAt'],['C15','knownAt']]) {
  const b=copy(rows);b[2][key]='2026-10-03T00:00:00.000Z';
  pair(id,key+' 경계',key+' only','기준시각 이후 경험이나 뒤늦게 알려진 응답을 과거 판단에 쓰지 않는다.',input(rows,cutoff),{mealCount:3,direction:'positive'},input(b,cutoff),{mealCount:2,direction:null},'시간 누출 또는 과거 원본 복원 주장');
 }
 const b=copy(rows);b[2].confirmationStatus='unconfirmed';
 pair('C16','의미 확인 상태','confirmationStatus','미확인 해석은 명시적 호감으로 학습하지 않는다.',input(rows),{mealCount:3,direction:'positive'},input(b),{mealCount:2,direction:null},'해석 미확인을 명시 응답으로 취급');
 const fit=rows.map(r=>({...r,kind:'preference_fit',value:'just_right',scale:'preference-fit-v1'})),other=copy(fit);other[2].value='above_preferred';
 pair('C17','알맞음의 반복','one fit value','알맞음은 호감과 독립이며 서로 다른 알맞음 응답을 보존한다.',input(fit),{fitRepeatedValue:'just_right',unitCount:0},input(other),{fitRepeatedValue:null,unitCount:0},'알맞음을 호감으로 변환');
 const strong=rows.flatMap(r=>[r,intensity(r)]);
 pair('C18','미관찰 강도','query intensity','강한 조건만 관찰한 결과를 약한 조건으로 우회하지 않는다.',input(strong,{}, {attribute:'taste.sour',intensity:'strong'}),{predictionDirection:'positive'},input(strong,{}, {attribute:'taste.sour',intensity:'weak'}),{predictionDirection:null},'미관찰 강도 예측');
 const foods=strong.map(r=>({...r,dishKindIDs:['seafood']}));
 pair('C19','미관찰 음식 조합','query dishKindIDs','관찰한 강도가 같아도 새 음식 종류의 결합은 별개다.',input(foods,{}, {attribute:'taste.sour',intensity:'strong',dishKindIDs:['seafood']}),{predictionDirection:'positive'},input(foods,{}, {attribute:'taste.sour',intensity:'strong',dishKindIDs:['meat']}),{predictionDirection:null},'새 조건의 호감을 단정');
 const a=rows.flatMap(r=>[r,overall(r)]),c=a.map(r=>r.kind==='overall_liking'?{...r,value:'very_negative'}:r);
 pair('C20','전체와 개별 분리','overall evaluation only','전체 평가만 반전해도 동일한 개별 감각 호감은 바뀌지 않는다.',input(a),{direction:'positive',positive:3},input(c),{direction:'positive',positive:3},'전체 평가로 감각 호감 덮어쓰기');
}
export const POLICY_CONTRAST_PAIRS = pairs;
