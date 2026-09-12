import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTastePerception, buildSurveyPerception, buildTasteChangeSeries, tasteChangeLabel } from '../src/lib/tastePerception.mjs';

const fixtures = JSON.parse(readFileSync(new URL('../ios/TasteBuddy/Resources/TBA/taste-perception-fixtures.json', import.meta.url), 'utf8'));
for (const example of fixtures.cases) test(example.id, () => {
  const result = buildTastePerception(example.records, { asOf: example.asOf ?? null, userID: 'owner' });
  assert.equal(result.evidenceCount, example.expected.meals);
  assert.equal(result.patterns.length, example.expected.patterns);
  assert.equal(result.changes.length, example.expected.changes);
  assert.equal(result.contrasts.length, example.expected.contrasts);
  assert.deepEqual(result.axes.map(row => row.current?.currentLevel ?? null), example.expected.levels);
  if (example.expected.recentCounts) assert.deepEqual(result.axes.find(row => row.axis === 'salty').current.counts, example.expected.recentCounts);
  const repeated = buildTastePerception([...example.records, ...example.records], { asOf: example.asOf ?? null, userID: 'owner' });
  assert.deepEqual(repeated, result, '원문 재전송은 근거를 늘리지 않는다');
});

const catalog = JSON.parse(readFileSync(new URL('../ios/TasteBuddy/Resources/Fixtures/taste-survey-golden.json', import.meta.url), 'utf8'));
const original = catalog.cases[0].expected.snapshot.surveySubmission;
test('미각변화 화면은 같은 조건의 두 기간과 원본 근거를 연결하며 회상 0을 보존한다', () => {
  const example = fixtures.cases.find(row => row.expected.changes > 0);
  const model = buildTastePerception(example.records, { userID: 'owner' });
  const pattern = model.changes[0];
  const row = buildTasteChangeSeries(model, { points: [] }).find(row => row.id === pattern.id);
  assert.deepEqual(row.points.map(point => point.value), [pattern.previousLevel, pattern.currentLevel]);
  assert.deepEqual(row.points.map(point => point.count), [3, 3]);
  assert.deepEqual(row.points[0].evidenceIDs, pattern.previous.evidenceIDs);
  assert.deepEqual(row.points[1].experienceIDs, pattern.recent.experienceIDs);
  const old = structuredClone(original); old.recordedAt = '2026-08-01T00:00:00Z';
  const current = structuredClone(original); current.recordedAt = '2026-09-01T00:00:00Z';
  old.responses = [{ itemId: old.items[0].id, selectedValue: 2, uncertain: false }];
  current.responses = [{ itemId: current.items[0].id, selectedValue: 0, uncertain: false }];
  const recall = buildTasteChangeSeries({ patterns: [] }, buildSurveyPerception([old, current]))[0];
  assert.deepEqual(recall.points.map(point => point.value), [2, 0]);
  assert.equal(tasteChangeLabel(recall.points), '더 약하게');
  assert.equal(tasteChangeLabel(recall.points.slice(1)), '비교 부족');
  assert.deepEqual(buildTasteChangeSeries({ patterns: [] }, { points: [] }), []);
});
test('설문 0·모름·미응답과 원래 음식 조건을 보존하고 같은 문항끼리만 비교한다', () => {
  const old = structuredClone(original); old.recordedAt = '2026-08-01T00:00:00.000Z';
  const current = structuredClone(original); current.recordedAt = '2026-09-01T00:00:00.000Z';
  current.responses = [{ itemId: current.items[0].id, selectedValue: 0, uncertain: false },
    { itemId: current.items[1].id, selectedValue: null, uncertain: true, uncertaintyReason: 'cannot_recall' }];
  const before = JSON.stringify([current, old]);
  const result = buildSurveyPerception([current, old, current]);
  assert.equal(result.points.find(row => row.axis === current.items[0].tasteId).value, 0);
  assert.equal(result.points.filter(row => row.value !== null).length, 1);
  assert.equal(result.changes.length, 1);
  assert.equal(JSON.stringify([current, old]), before);
  old.items[0].anchor.conditions[0] = '다른 조리 조건';
  assert.equal(buildSurveyPerception([current, old]).changes.length, 0);
});

test('회상 척도·문항 버전이 다르면 전후 비교를 만들지 않는다', () => {
  const old = structuredClone(original); old.recordedAt = '2026-08-01T00:00:00.000Z';
  const current = structuredClone(original); current.recordedAt = '2026-09-01T00:00:00.000Z';
  current.responses[0].selectedValue = 0;
  old.scale.labels['0'] = '다른 의미';
  assert.equal(buildSurveyPerception([current, old]).changes.length, 0);
  old.scale = current.scale; old.instrument.version = '1.0.0';
  assert.equal(buildSurveyPerception([current, old]).changes.length, 0);
});

 test('같은 시각의 다른 날짜 표기는 전후 변화가 아니다', () => {
  const first = structuredClone(original); first.recordedAt = '2026-09-01T00:00:00.000Z';
  const copy = structuredClone(first); copy.recordedAt = '2026-09-01T00:00:00Z'; copy.responses[0].selectedValue = 0;
  assert.equal(buildSurveyPerception([first, copy]).changes.length, 0);
});
