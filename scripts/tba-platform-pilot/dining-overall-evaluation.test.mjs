import test from 'node:test';
import assert from 'node:assert/strict';
import { DINING_NATIVE_OVERALL_CONTRACT, DINING_OVERALL_VERSION, parseOverallEvaluation } from './dining-overall-evaluation.mjs';
import { parseByRules, validateSemanticAtom, validateAtomSourceScope } from './rules.mjs';
const chosen=DINING_NATIVE_OVERALL_CONTRACT.fixtures[0].evaluation;
const answer=value=>({question:'structured_overall',questionVersion:'1',choiceVersion:DINING_OVERALL_VERSION,value});
test('전체평가 다섯 원응답은 각각 다른 값으로 보존되고 실제 응답 인용을 검증한다',()=>{
 const values=new Set();
 for(const fixture of DINING_NATIVE_OVERALL_CONTRACT.fixtures.slice(0,5)){
  const result=parseByRules(answer(fixture.evaluation));
  assert.equal(result.observations.length,1);assert.equal(result.needsAI,false);
  const atom=result.observations[0];values.add(atom.value);
  assert.equal(atom.scale,'overall-five-category-v1');assert.equal(atom.kind,'overall_liking');assert.equal(atom.attribute,null);
  assert.equal(atom.phrase,fixture.evaluation.responseLabelSnapshot);
  assert.notEqual(atom.phrase,atom.selectionEvidence.labelSnapshot);
  assert.equal(atom.selectionEvidence.labelValue,atom.phrase);
  assert.equal(validateSemanticAtom(atom).valid,true);assert.equal(validateAtomSourceScope(atom,answer(fixture.evaluation)).valid,true);
 }
 assert.equal(values.size,5);
});
test('질문 문구나 다른 응답으로 바꾼 인용은 출처 검증을 통과하지 않는다',()=>{
 const atom=parseOverallEvaluation(chosen).observations[0];
 assert.equal(validateAtomSourceScope({...atom,phrase:chosen.questionLabelSnapshot},answer(chosen)).valid,false);
 assert.equal(validateAtomSourceScope({...atom,value:'very_negative'},answer(chosen)).valid,false);
 assert.equal(validateSemanticAtom({...atom,selectionEvidence:null}).valid,false);
});
test('미등록 버전 라벨 범위 손상 원응답은 확정관찰을 만들지 않는다',()=>{
 for(const fixture of DINING_NATIVE_OVERALL_CONTRACT.fixtures.slice(5)){
  const result=parseByRules(answer(fixture.evaluation));assert.equal(result.observations.length,0);assert.equal(result.unresolved.length,1);assert.equal(result.needsAI,false);
 }
 for(const invalid of [null,42,{...chosen,unparsedPayload:{responseValue:42}}]){assert.equal(parseOverallEvaluation(invalid).observations.length,0);}
});
