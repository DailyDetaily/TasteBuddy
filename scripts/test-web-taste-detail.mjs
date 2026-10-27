import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-taste-detail-'));
await build({ entryPoints: ['src/components/gastronomy/detailPresentation.ts'], outfile: path.join(dir, 'detail.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { detailPeriodWindow, prepareDetailState, resolveDetailCard, detailPlotPoints } = await import(path.join(dir, 'detail.mjs'));
after(() => fs.rm(dir, { recursive: true, force: true }));
const now = new Date(2026, 9, 25, 12);
const query = { id: 'meals', title: '기록한 식사', category: 'experience', originalPeriod: 'all', source: 'all', domain: '맛', attribute: '', facet: 'liking' };
const record = (id, extra = {}) => ({ id, mealID: id, menu: '국수', restaurant: '식당', foodKinds: [], date: new Date(2026, 9, 20).toISOString(), savedAt: new Date(2026, 9, 21).toISOString(), note: '', labels: [], source: 'restaurant', ...extra });
const data = (records, observations = []) => ({ records, observations });
const resolve = (records, period = 'original', q = query) => { const state = prepareDetailState(data(records), q, period, now); return resolveDetailCard(state, q); };
test('month bounds follow local calendar, clamp short months, and end after today', () => {
  const range = detailPeriodWindow(1, 'all', new Date(2026, 2, 30, 12));
  assert.equal(new Date(range.start).getMonth(), 1); assert.equal(new Date(range.start).getDate(), 28);
  assert.equal(new Date(range.end).getDate(), 31);
  assert.equal(detailPeriodWindow(0, 'month', now), null);
});
test('original window remains the source card period', () => {
  const range = detailPeriodWindow('original', 'month', now);
  assert.equal(new Date(range.start).getDate(), 1); assert.equal(new Date(range.end).getDate(), 26);
});
test('unknown meals stay all-time only and future or conflicting meals stay excluded', () => {
  const records = [record('known'), record('unknown', { date: null }), record('future', { date: new Date(2027, 0, 1).toISOString() })];
  assert.equal(resolve(records).rows[0].value, '2번');
  assert.equal(resolve(records, 1).rows[0].value, '1번');
  assert.equal(resolve([record('a'), record('a', { note: 'conflict' })]).rows[0].value, '0번');
});
test('detail resolves additions, date updates, deletions, and account-specific inputs', () => {
  assert.equal(resolve([record('a')]).rows[0].value, '1번');
  assert.equal(resolve([record('a'), record('b')]).rows[0].value, '2번');
  assert.equal(resolve([record('a', { date: null })], 1).rows[0].value, '0번');
  assert.equal(resolve([]).rows[0].value, '0번');
  assert.deepEqual(resolve([record('account-b')]).rows[0].entryIDs, ['account-b']);
});
test('first/repeat retains the complete history beyond the selected period', () => {
  const records = [record('old', { date: new Date(2026, 0, 2).toISOString() }), record('recent')];
  assert.equal(resolve(records, 1, { ...query, id: 'first/menu' }).rows.length, 0);
  assert.equal(resolve(records, 1, { ...query, id: 'repeat/menu' }).rows.length, 1);
});
test('distribution uses supplied numeric observations, zero distinct from invalid', () => {
  const card = { id: 'overall', rows: [{ id: 'overall', title: '음식 전체', value: '2개', segments: [{ key: 'zero', label: '좋음', count: 0 }, { key: 'unknown', label: '오류', count: NaN }] }] };
  assert.deepEqual(detailPlotPoints(card, undefined, []).map(p => p.value), [0, null]);
});
test('dimension plots count meals, not multiple dishes, and never parse display values', () => {
  const records = [record('a', { mealID: 'same' }), record('b', { mealID: 'same' }), record('c')];
  const card = { id: 'menu', rows: [{ id: 'one', title: '국수', value: '999번', entryIDs: ['a', 'b'] }, { id: 'two', title: '밥', value: '999번', entryIDs: ['c'] }] };
  assert.deepEqual(detailPlotPoints(card, undefined, records).map(p => p.value), [1, 1]);
  assert.equal(detailPlotPoints({ ...card, id: 'change-experience' }, undefined, records).length, 0);
});
const comparisonQuery = { ...query, id: 'change-experience', title: '경험 범위의 변화', category: 'change', originalPeriod: 'month' };
const inSeptember = id => record(id, { date: new Date(2026, 8, 15).toISOString() });
const comparison = (records, q = comparisonQuery, observations = []) => {
  const state = prepareDetailState(data(records, observations), q, 1, now);
  return resolveDetailCard(state, q);
};
test('paired experience plot uses independent meals in each equal calendar-day window', () => {
  const records = [inSeptember('before-a'), inSeptember('before-b'), record('after-a', { mealID: 'after' }), record('after-b', { mealID: 'after' })];
  const card = comparison(records);
  assert.deepEqual(detailPlotPoints(card, 'meal', records).map(point => point.value), [2, 1]);
  assert.equal(card.rows.find(row => row.id === 'meal').value, '2 → 1번');
  assert.ok(card.scope.includes('이전'));
});
test('paired identity counts preserve unresolved links, and known empty periods remain zero', () => {
  const records = [inSeptember('before'), record('after', { menuKey: null, restaurantKey: null, foodKinds: [] })];
  const card = comparison(records);
  assert.deepEqual(detailPlotPoints(card, 'menu', records).map(point => point.value), [1, null]);
  assert.equal(card.comparisons.menu.status, '연결 미확인');
  assert.deepEqual(detailPlotPoints(comparison([]), 'menu', []).map(point => point.value), [0, 0]);
});
const presence = (id, entryID, attribute = 'taste.sweet', catalog = 'dining-sensory-selection/1') => ({ id, entryID, facet: 'presence', attribute, label: attribute === 'taste.sweet' ? '단맛' : '짠맛', value: 'present', target: 'whole_dish', phase: 'first_bite', selection: JSON.stringify(['bubble', attribute, catalog, '']) });
test('sensory comparison denominator counts only meals with direct presence, never unobserved meals', () => {
  const records = [inSeptember('b1'), inSeptember('b2'), inSeptember('unobserved'), record('a1'), record('a2', { mealID: 'a1' })];
  const observations = [presence('p1', 'b1'), presence('p2', 'b2', 'taste.salty'), presence('p3', 'a1', 'taste.salty'), presence('p4', 'a2', 'taste.salty')];
  const card = comparison(records, { ...comparisonQuery, id: 'change-presence' }, observations);
  const points = detailPlotPoints(card, JSON.stringify(['taste.sweet', '']), records);
  assert.deepEqual(points.map(point => point.value), [50, 0]);
  assert.deepEqual(points.map(point => point.valueLabel), ['1/2 · 50%', '0/1 · 0%']);
});
test('sensory comparison with missing or changed catalog keeps both plot sides unknown', () => {
  const records = [inSeptember('b'), record('a')];
  for (const version of [null, 'different-catalog']) {
    const card = comparison(records, { ...comparisonQuery, id: 'change-presence' }, [presence('pb', 'b'), presence('pa', 'a', 'taste.sweet', version)]);
    assert.deepEqual(detailPlotPoints(card, undefined, records).map(point => point.value), [null, null]);
    assert.equal(Object.values(card.comparisons)[0].status, '비교 기준 확인 필요');
  }
});
test('sensory comparison excludes unknown dates, future dates and non-presence facets', () => {
  const records = [inSeptember('b'), record('a'), record('unknown', { date: null }), record('future', { date: new Date(2027, 0, 1).toISOString() })];
  const observations = [presence('pb', 'b'), presence('pa', 'a'), presence('pu', 'unknown'), presence('pf', 'future'), { ...presence('liking', 'a'), facet: 'liking', value: 'positive' }];
  const card = comparison(records, { ...comparisonQuery, id: 'change-presence' }, observations);
  assert.deepEqual(detailPlotPoints(card, undefined, records).map(point => point.valueLabel), ['1/1 · 100%', '1/1 · 100%']);
});
test('comparison recomputes after original updates, deletes and account switches', () => {
  const q = { ...comparisonQuery, id: 'change-presence' }, b = inSeptember('b'), a = record('a');
  const observations = [presence('pb', 'b'), presence('pa', 'a')];
  assert.deepEqual(detailPlotPoints(comparison([b, a], q, observations), undefined, [b, a]).map(point => point.value), [100, 100]);
  assert.deepEqual(detailPlotPoints(comparison([b], q, observations), undefined, [b]).map(point => point.value), [null, null]);
  assert.equal(comparison([], q, observations).rows.length, 0);
  assert.deepEqual(detailPlotPoints(comparison([b, { ...a, date: null }], q, observations), undefined, [b, a]).map(point => point.value), [null, null]);
});
