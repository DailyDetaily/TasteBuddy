import test from 'node:test';
import assert from 'node:assert/strict';
import { LEXICON_VERSION, parseByRules, validateSemanticAtom, validateAtomSourceScope } from './rules.mjs';
const answer=value=>({question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,value});
const parse=value=>parseByRules(answer(value));
const matching=(r,kind)=>r.observations.filter(a=>a.kind===kind);

test('검토한 평가 활용형은 단맛 호감을 보존하고 미해석 평가를 완료로 처리하지 않는다',()=>{
  for (const text of ['단맛이 좋았습니다.','단맛이 좋았다.','단맛이 좋습니다.']) {
    const r=parse(text);assert.equal(matching(r,'attribute_liking')[0]?.value,'positive',text);assert.equal(r.needsAI,false,text);
  }
  for (const text of ['단맛이 아쉬웠습니다.','단맛이 싫었습니다.']) assert.equal(matching(parse(text),'attribute_liking')[0]?.value,'negative');
  const pending=parse('단맛이 거슬렸다.');assert.equal(matching(pending,'attribute_liking').length,0);assert.equal(pending.needsAI,true);assert.equal(pending.unresolved[0].reason,'uninterpreted_evaluation');
});

test('겉과 속의 세부 동작을 독립된 원문과 대상에 보존한다',()=>{
  const text='🍽️ 겉은 가볍게 부서지고 속은 촉촉했다.';
  const r=parse(text),details=matching(r,'sensory_detail');
  assert.deepEqual(details.map(a=>[a.attribute,a.target,a.value]),[['texture.crumbly','surface','🍽️ 겉은 가볍게 부서지고'],['texture.moist','inside','속은 촉촉했다.']]);
  assert.equal(matching(r,'attribute_liking').length,0);
  for (const atom of r.observations) {assert.deepEqual(validateSemanticAtom(atom),{valid:true,errors:[]});assert.deepEqual(validateAtomSourceScope(atom,answer(text)),{valid:true,errors:[]});}
});

test('비유 향 호감과 남는 지방감 아쉬움을 섞지 않는다',()=>{
  const r=parse('버터 같은 향은 좋았지만 입안에 남는 기름진 느낌은 아쉬웠다.');
  assert.deepEqual(matching(r,'attribute_liking').map(a=>[a.attribute,a.value]),[['aroma.reference','positive'],['mouthfeel.fatty','negative']]);
  for(const atom of r.observations) assert.equal(validateSemanticAtom(atom).valid,true,atom.kind);
  const detail=matching(r,'sensory_detail')[0];assert.equal(detail.attribute,'mouthfeel.fatty');assert.equal(detail.phase,'unspecified');assert.match(detail.value,/입안에 남는/);
});

test('조건 변화와 시간 원문을 보존하고 식으니를 온도 수치나 식사 후반으로 만들지 않는다',()=>{
  for (const [text,phase] of [['씹을수록 단맛이 강해졌어요.','during_meal'],['삼킨뒤 단맛이 남았어요.','after_swallow'],['식으니 단맛이 강해졌어요.','unspecified']]) {
    const details=matching(parse(text),'sensory_detail');assert.equal(details.length,1,text);assert.equal(details[0].value,text);assert.equal(details[0].phase,phase);
  }
});

test('어휘 밖의 감각 표현은 원문 구조와 대기를 보존하고 전체 음식 호감으로 바꾸지 않는다',()=>{
  const text='향이 종이처럼 납작하게 느껴져 좋았습니다.';
  const r=parse(text),detail=matching(r,'sensory_detail')[0];assert.equal(detail.attribute,'aroma.unspecified');assert.equal(detail.value,text);assert.equal(r.needsAI,true);assert.ok(r.unresolved.length);assert.equal(r.observations.length,1);
  assert.deepEqual(validateAtomSourceScope(detail,answer(text)),{valid:true,errors:[]});
  assert.equal(validateAtomSourceScope({...detail,value:'포근한 버터 향'},answer(text)).valid,false);
  assert.equal(validateSemanticAtom({...detail,value:2}).valid,false);
  assert.equal(validateSemanticAtom({...detail,attribute:'texture.unspecified',kind:'sensory_presence',scale:'presence-v1',value:true}).valid,false);
});

test('타인·인용·가정·비교·부정 평가가 무조건 개인 긍정 근거가 되지 않는다',()=>{
  for (const text of ['친구는 단맛이 좋았습니다.','“단맛이 좋았고 향이 좋았습니다.”','단맛이 좋았다던데요.','“단맛이 좋았습니다”라고 했다.','단맛이 좋았다면 다시 먹었을 거예요.','단맛이 좋지 않았습니다.']) {const r=parse(text);assert.equal(matching(r,'attribute_liking').length,0,text);assert.ok(r.unresolved.length,text);}
  const comparison=parse('어제보다 단맛이 좋았습니다.');assert.equal(matching(comparison,'attribute_liking').length,0);assert.equal(comparison.needsAI,true);assert.equal(matching(comparison,'sensory_detail')[0].value,'어제보다 단맛이 좋았습니다.');
  const absent=parse('단맛은 없었습니다.');assert.equal(matching(absent,'sensory_presence')[0].value,false);assert.equal(matching(absent,'attribute_liking').length,0);
});


test('분석 요청과 환경의 감각 비유를 음식 감각으로 만들지 않는다',()=>{
  for(const text of ['첨부하지 않은 사진을 보고 식감을 분석해 줘.','식당 조명이 따뜻하고 직원 말투가 달콤했다.']) { const r=parse(text);assert.deepEqual(r.observations,[]);assert.ok(r.unresolved.length);assert.equal(r.needsAI,false); }
});


test('탄성과 명사형 평가 어미를 보존하고 미분류 감각 평가범위는 따로 보류한다',()=>{
  assert.equal(matching(parse('젤리가 몇 번 씹어도 버티는 탄성이 좋았습니다.'),'attribute_liking')[0]?.value,'positive');
  assert.equal(matching(parse('단맛이 싫었음.'),'attribute_liking')[0]?.value,'negative');
  const r=parse('치즈에서 젖은 양말 같은 냄새가 나서 싫었습니다.');assert.equal(r.unresolved[0].reason,'explicit_evaluation_scope_unresolved');assert.equal(matching(r,'overall_liking').length,0);
});


test('향의 부드러움과 조건 속 소스를 식감의 호감으로 오인하지 않는다',()=>{
  const aroma=parse('구수한 향이 부드러운 느낌이라 좋았습니다.');assert.equal(matching(aroma,'attribute_liking').length,0);assert.equal(matching(aroma,'sensory_detail')[0]?.attribute,'aroma.unspecified');assert.equal(aroma.needsAI,true);
  const conditional=parse('소스를 찍을 때만 튀김의 바삭함이 좋았습니다.');assert.deepEqual(conditional.observations,[]);assert.equal(conditional.unresolved[0]?.reason,'unresolved_condition_or_comparison');
});
