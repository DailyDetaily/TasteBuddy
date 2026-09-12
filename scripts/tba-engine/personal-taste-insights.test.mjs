import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPersonalTasteModel } from './personal-taste-model.mjs';
import { insightRecord as record, withIntensity, withOverall, fitRecords, impactRecords, ENGINE_V2_FIXTURES } from './personal-taste-insights-fixtures.mjs';

const build = (records, options) => buildPersonalTasteModel({ userId: 'fixture-user', records }, options);
const base = patterns => patterns.find(p => p.conditions.length === 0);
test('알맞음은 호감을 생성하지 않고 강도와 음식 조건별 반복을 보존한다', () => {
  const model = build(fitRecords);
  assert.equal(model.units.length, 0);
  assert.deepEqual(base(model.fitPatterns).distribution, { belowPreferred: 0, justRight: 3, abovePreferred: 3, mixed: 0, mealCount: 6 });
  for (const [level, fit] of [['medium', 'just_right'], ['strong', 'above_preferred']]) {
    const pattern = model.fitPatterns.find(p => p.conditions.length === 1 && p.conditions[0].value === level);
    assert.equal(pattern.repeatedValue, fit); assert.equal(pattern.distribution.mealCount, 3);
    assert.equal(pattern.evidenceIDs.length, 6);
  }
  assert.ok(model.fitPatterns.every(p => p.conditions.length <= 2));
});
test('알맞음 중복과 같은 식사의 상반 평가는 반복 근거를 부풀리지 않는다', () => {
  const a = record('a', 'below_preferred', { kind: 'preference_fit', scale: 'preference-fit-v1' });
  const b = { ...a, observationId: 'b', experienceId: 'other-dish' };
  assert.equal(base(build([a, a, b]).fitPatterns).distribution.mealCount, 1);
  const pattern = base(build([a, { ...b, value: 'above_preferred' }]).fitPatterns);
  assert.equal(pattern.distribution.mixed, 1); assert.equal(pattern.repeatedValue, null);
  assert.deepEqual(pattern.evidenceIDs, ['a', 'b']);
});
test('알맞음 집계에도 소유자 시점 확인 상태와 존재 부정 경계가 적용된다', () => {
  const a = record('a', 'just_right', { kind: 'preference_fit', scale: 'preference-fit-v1' });
  const records = [a, { ...a, observationId: 'other', userId: 'other' },
    { ...a, observationId: 'future', knownAt: '2026-09-10T00:00:00.000Z' },
    { ...a, observationId: 'unconfirmed', confirmationStatus: 'inferred' },
    { ...a, observationId: 'absent', kind: 'sensory_presence', scale: 'presence-v1', value: false }];
  assert.equal(build(records, { asOf: '2026-09-05T00:00:00.000Z' }).fitPatterns.length, 0);
});
test('전체 5단계와 개별 3단계의 15개 조합을 합치거나 평균내지 않는다', () => {
  const model = build(ENGINE_V2_FIXTURES.find(f => f.id === 'v2-overall-all-categories').records);
  const pattern = base(model.overallPatterns);
  assert.equal(pattern.cells.length, 15); assert.equal(pattern.mealIDs.length, 15);
  assert.ok(pattern.cells.every(c => c.mealIDs.length === 1)); assert.equal(pattern.causalClaim, null);
  assert.equal(pattern.cells.filter(c => c.overallValue === 'neutral').length, 3);
});
test('같은 식사의 다른 메뉴 평가는 실제 디시 쌍으로만 연결하고 복수 쌍을 별도로 남긴다', () => {
  const records = ENGINE_V2_FIXTURES.find(f => f.id === 'v2-overall-different-dishes').records;
  const pattern = base(build(records).overallPatterns);
  assert.equal(pattern.cells.length, 0); assert.deepEqual(pattern.mixedMealIDs, ['one']);
  assert.equal(pattern.evidenceIDs.length, 4);
  const unlinked = [record('a', 'negative', { mealId: 'one' }),
    record('b', 'very_positive', { mealId: 'one', kind: 'overall_liking', attribute: null, scale: 'overall-five-category-v1' })];
  assert.equal(build(unlinked).overallPatterns.length, 0);
});
test('동일 전체 평가 쌍이 같은 식사의 여러 메뉴에 있어도 한 번만 센다', () => {
  const rows = ['a', 'b'].flatMap(id => withOverall(record(id, 'negative', { mealId: 'one' }), 'very_positive'));
  const pattern = base(build(rows).overallPatterns);
  assert.equal(pattern.cells.length, 1); assert.deepEqual(pattern.cells[0].mealIDs, ['one']);
  assert.equal(pattern.cells[0].evidenceIDs.length, 4);
});
test('여러 식사의 같은 평가 쌍은 근거를 빠짐없이 한 번씩 정렬해 보존한다', () => {
  const rows = Array.from({ length: 100 }, (_, i) => withOverall(record(`meal-${i}`, 'negative'), 'very_positive')).flat();
  const cell = base(build([...rows].reverse()).overallPatterns).cells[0];
  assert.equal(cell.mealIDs.length, 100);
  assert.deepEqual(cell.evidenceIDs, rows.map(r => r.observationId).sort());
});
test('해석을 바꿀 수 있는 강도 질문이 고정 점수가 높은 호감 미응답보다 먼저 나온다', () => {
  const frozen = structuredClone(impactRecords), model = build(impactRecords), question = model.nextSelection;
  assert.equal(question.attribute, 'taste.sour'); assert.equal(question.facet, 'intensity');
  assert.equal(question.responseSourceID, 'question-source');
  assert.equal(question.impact.basis, 'answer_can_change_interpretation');
  assert.ok(question.impact.changedInterpretationCount > 0); assert.equal(question.impact.alternativeCount, 3);
  assert.deepEqual(impactRecords, frozen); assert.ok(!JSON.stringify(model).includes('__question_'));
  assert.equal(model.units.length, 7);
});
test('질문 억제와 입력 순서 변경은 실근거와 새 집계에 영향을 주지 않는다', () => {
  const model = build(impactRecords), reordered = build([...impactRecords].reverse());
  assert.deepEqual(reordered, model);
  const hidden = build(impactRecords, { suppressedQuestionIDs: [model.nextSelection.id] });
  assert.notEqual(hidden.nextSelection.id, model.nextSelection.id);
  for (const key of ['units', 'candidates', 'fitPatterns', 'overallPatterns']) assert.deepEqual(hidden[key], model[key]);
});
test('같은 속성의 다른 선택에 평가가 있어도 선택별 미응답은 남긴다', () => {
  const meta = id => ({ selectionID: id, type: 'bubble', catalogVersion: 'v1', labelSnapshot: id,
    facet: 'presence', labelValue: '느꼈어요', responseValue: null, relatedBubbleID: null, relatedBubbleLabel: null, resolution: 'resolved' });
  const present = record('present', true, { kind: 'sensory_presence', scale: 'presence-v1', selectionEvidence: meta('one') });
  const rated = record('rated', 'positive', { experienceId: present.experienceId, mealId: present.mealId, selectionEvidence: meta('two') });
  const question = build([present, rated]).nextSelection;
  assert.equal(question.facet, 'liking'); assert.equal(question.responseSourceID, 'present');
});
test('충돌한 강도는 가상 응답으로 덮어쓰지 않는다', () => {
  const rows = [1, 2, 3].flatMap(i => withIntensity(record(`r${i}`), 'strong'));
  rows.push({ ...rows[1], observationId: 'conflict', value: 'weak' });
  const question = build(rows).nextSelection;
  assert.equal(question.facet, 'intensity'); assert.equal(question.intent, 'clarification');
  assert.equal(question.impact.alternativeCount, 0);
});
test('호감이 없어도 알맞음의 조건 해석을 바꿀 강도를 질문한다', () => {
  const rows = [0, 1, 2, 3].flatMap(i => {
    const fit = record(`fit-${i}`, i < 3 ? 'just_right' : 'above_preferred', { kind: 'preference_fit', scale: 'preference-fit-v1' });
    return i < 3 ? withIntensity(fit, 'medium') : [fit];
  });
  const question = build(rows).nextSelection;
  assert.equal(question.facet, 'intensity'); assert.equal(question.responseSourceID, 'fit-3');
  assert.ok(question.impact.changedInterpretationCount > 0);
});
test('부위와 시점의 가상 답변은 실제 관찰된 조건만 사용한다', () => {
  for (const facet of ['target', 'phase']) {
    const known = facet === 'target' ? 'broth' : 'after_swallow';
    const rows = [0, 1, 2, 3].flatMap(i => withIntensity(record(`r-${i}`, i < 3 ? 'positive' : 'negative', {
      [facet]: i < 3 ? known : 'unspecified',
    }), 'weak'));
    const question = build(rows).nextSelection;
    assert.equal(question.facet, facet); assert.equal(question.impact.alternativeCount, 1);
    assert.ok(question.impact.changedInterpretationCount > 0);
    assert.ok(question.evidenceIDs.includes(question.responseSourceID));
  }
});
test('질문 비교용 계산은 출처 표시를 생략해도 모든 판단과 분포가 같다', () => {
  const shape = model => JSON.stringify(model, (key, value) =>
    ['evidence', 'evidenceIDs', 'overallAssociations', 'nextSelection'].includes(key) ? undefined : value);
  for (const fixture of ENGINE_V2_FIXTURES) {
    const full = build(fixture.records);
    const decision = build(fixture.records, { _assessQuestions: false, _includeEvidence: false });
    assert.equal(shape(decision), shape(full), fixture.id);
  }
});
