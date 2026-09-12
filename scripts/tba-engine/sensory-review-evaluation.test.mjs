import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reviewSuite, verifySuite, scoreReviewCase, evaluateSensoryReview } from './sensory-review-evaluation.mjs';
const fixture = reviewSuite.cases[0];
const atom = {kind:'sensory_detail',scale:'sensory-detail-v1',attribute:'taste.unspecified',value:fixture.text,sourceSpans:[{start:0,end:fixture.text.length,quote:fixture.text}]};
test('독립 fixture는 동결 해시와 50개 고유 ID를 유지한다',()=>{
 assert.equal(verifySuite(),true); assert.equal(new Set(reviewSuite.cases.map(c=>c.id)).size,50);
 const copy=structuredClone(reviewSuite);copy.cases[0].text+='변경';assert.equal(verifySuite(copy),false);
});
test('API 대기와 미해석은 상세 구절을 회수해도 의미 성공으로 계산하지 않는다',()=>{
 const r=scoreReviewCase(fixture,{observations:[atom],unresolved:[{text:fixture.text}],needsAI:true});
 assert.equal(r.interpretedDetail,true);assert.equal(r.semanticSuccess,false);assert.equal(r.unresolved,true);
});
test('원문 구절 위조는 회수 또는 안전성 성공으로 감출 수 없다',()=>{
 const r=scoreReviewCase(fixture,{observations:[{...atom,value:fixture.text+'없는 내용'}],unresolved:[]});
 assert.equal(r.interpretedDetail,false);assert.ok(r.safetyFailures.includes('fabricated_source_span'));
});
test('감각 문장에 호감 원자를 주입하면 별도 안전성 위반이다',()=>{
 const r=scoreReviewCase(fixture,{observations:[atom,{...atom,kind:'attribute_liking',value:'positive'}],unresolved:[]});
 assert.ok(r.safetyFailures.includes('sensory_implies_liking'));
});
test('동결 baseline 재평가는 현재 생산 코드 대신 저장된 출력을 사용한다',()=>{
 const snapshot=JSON.parse(readFileSync(new URL('./sensory-review-baseline.json',import.meta.url)));
 const report=evaluateSensoryReview({snapshot,parse:()=>{throw new Error('MUST_NOT_PARSE');}});
 assert.equal(report.metrics.cases,50);assert.equal(report.metrics.overallAccuracy,null);
 assert.equal(report.suiteHash,snapshot.suiteHash);
 assert.throws(()=>evaluateSensoryReview({snapshot:{...snapshot,suiteHash:'invalid'}}),/BASELINE_HASH/);
});
test('원문 detail과 기존 의미 원자의 회수를 구분하고 중복 형식을 강제하지 않는다',()=>{
 const c=reviewSuite.cases.find(x=>x.id==='SR-036');
 const a={kind:'sensory_presence',attribute:'aroma.herbal',value:true,sourceSpans:[{start:0,end:c.text.length,quote:c.text}]};
 const r=scoreReviewCase(c,{observations:[a],unresolved:[]});
 assert.equal(r.interpretedDetail,false);assert.equal(r.existingMeaningEquivalent,true);assert.equal(r.detailOrEquivalent,true);
 assert.ok(!r.failures.includes('detail_or_equivalent_missing'));
});
test('소스 조건을 튀김 식감의 대상으로 바꾸면 명시적인 귀속 위반이다',()=>{
 const c=reviewSuite.cases.find(x=>x.id==='SR-033');
 const a={kind:'sensory_presence',attribute:'texture.crisp',value:true,target:'sauce',sourceSpans:[{start:0,end:c.text.length,quote:c.text}]};
 const r=scoreReviewCase(c,{observations:[a],unresolved:[]});
 assert.ok(r.safetyFailures.includes('condition_as_sensory_target'));assert.equal(r.existingMeaningEquivalent,false);
});
