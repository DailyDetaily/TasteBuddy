import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-record-charts-'));
const out = path.join(dir, 'contracts.mjs');
await build({ stdin: { contents: "export * from './src/lib/gastronomy/recordChartData'; export * from './src/lib/gastronomy/nativeRecord'; export * from './src/lib/gastronomy/nativeRepository'; export * from './src/lib/gastronomy/nativeRecordDeletion'; export * from './src/lib/gastronomy/nativeArchive';", resolveDir: process.cwd() }, outfile: out, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { buildRecordChartData: charts, NativeRepository, newNativeRecord, decodeNativeAccount, readNativeRecords, deleteNativeRecord, swiftTime } = await import(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
process.env.TZ = 'Asia/Seoul';
const now = new Date('2026-10-08T12:00:00+09:00');
const row = (id, extra = {}) => ({ id, mealID: id, menu: '국수', restaurant: '', foodKinds: [], date: '2026-10-01T12:00:00+09:00', savedAt: '2026-10-08T09:00:00+09:00', note: '', labels: [], source: 'unknown', ...extra });
const data = records => ({ records, observations: [] });
test('month includes known zero days, future nulls, and local weekday offset', () => {
  const chart = charts(data([row('a'), row('b', { date: '2026-09-30T16:00:00Z' })]), now);
  assert.equal(chart.month.length, 31); assert.equal(chart.startDay, 3);
  assert.equal(chart.month[0].count, 2); assert.equal(chart.month[7].count, 0);
  assert.equal(chart.month[8].count, null); assert.equal(chart.total, 2);
  const february = charts(data([]), new Date('2028-02-29T12:00:00+09:00'));
  assert.equal(february.month.length, 29); assert.ok(february.month.every(day => day.count === 0));
});
test('all charts share distinct dish records and explicit source partitions', () => {
  const records = [row('a', { mealID: 'meal', source: 'homeCooked' }), row('b', { mealID: 'meal', source: 'restaurant' }), row('c', { source: 'unknown' })];
  const chart = charts(data([...records, records[0]]), now);
  assert.equal(chart.total, 3); assert.deepEqual(chart.series.map(s => s.value), [1, 1, 1]);
  assert.equal(chart.series.reduce((sum, s) => sum + s.value, 0), chart.total);
  assert.ok(Math.abs(chart.absolute.reduce((sum, s) => sum + s.value, 0) - 200 / 3) < 1e-9);
  assert.deepEqual(chart.previous, [0, 0, 0, 0, 0, 0, 3]);
  assert.deepEqual(chart.current, Array(7).fill(0));
});
test('unknown dates, contradictory meal dates, duplicate conflicts and future days never become plotted zero records', () => {
  const records = [row('unknown', { date: null }), row('future', { date: '2026-10-09T12:00:00+09:00' }),
    row('a', { mealID: 'm' }), row('b', { mealID: 'm', date: null }), row('duplicate'), row('duplicate', { note: 'conflict' })];
  const chart = charts(data(records), now);
  assert.equal(chart.total, 0); assert.equal(chart.unknownDateCount, 3); assert.equal(chart.futureCount, 1);
  assert.deepEqual(chart.absolute, []);
});
function harness() {
  const cached = new Map(), remote = new Map(); let failFetch = false;
  const copy = value => value == null ? null : structuredClone(value);
  const storage = { read: async owner => copy(cached.get(owner)), photo: async () => null,
    update: async (owner, change) => { const next = change(copy(cached.get(owner))); cached.set(owner, copy(next)); return copy(next); } };
  const transport = { fetch: async owner => { if (failFetch) throw Error('offline'); return { enabled: true, remote: copy(remote.get(owner)) }; },
    save: async (owner, snapshot, revision) => { assert.equal(remote.get(owner)?.revision ?? 0, revision); remote.set(owner, { snapshot: copy(snapshot), revision: revision + 1 }); return revision + 1; } };
  return { repo: new NativeRepository(storage, transport), storage, remote, set fail(value) { failFetch = value; } };
}
test('repository save/restore/edit/delete feeds the chart and isolates accounts', async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  const h = harness(); await h.repo.refresh('A');
  let record = { ...newNativeRecord(undefined, now), menu: '국수', restaurant: '식당', dishKindIDs: ['seafood'], foodSource: { kind: 'restaurant', version: 1 },
    mealTime: { source: 'user_confirmed', start: swiftTime(new Date('2026-10-02T12:00:00+09:00')), confirmedAt: swiftTime(now) },
    feedbackStatus: 'completed', sensorySelections: [{ id: 'umami-clear', type: 'bubble', catalogVersion: 'dining-sensory-selection/1', labelSnapshot: '맑은 감칠맛', target: 'whole_dish', phase: 'unspecified' }] };
  await h.repo.commit('A', record, null); await h.repo.sync('A');
  const restored = await h.repo.refresh('A');
  assert.equal(charts(decodeNativeAccount(restored.snapshot, now), now).month[1].count, 1);
  assert.deepEqual(charts(decodeNativeAccount(restored.snapshot, now), now).sensorySeries[0].comparisonValues, [0, 1, 0, 0]);
  assert.deepEqual(charts(decodeNativeAccount(restored.snapshot, now), now).foodKinds.map(k => [k.id, k.value]), [['seafood', 1]]);
  const original = readNativeRecords(restored.snapshot)[0];
  await h.repo.commit('A', { ...original, mealTime: { ...original.mealTime, start: swiftTime(new Date('2026-10-03T12:00:00+09:00')) } }, original);
  await h.repo.sync('A');
  const edited = await h.repo.refresh('A');
  const chart = charts(decodeNativeAccount(edited.snapshot, now), now);
  assert.equal(chart.month[1].count, 0); assert.equal(chart.month[2].count, 1);
  assert.deepEqual(chart.sensorySeries[0].comparisonValues, [0, 0, 1, 0]);
  assert.equal(charts(decodeNativeAccount((await h.repo.refresh('B')).snapshot, now), now).total, 0);
  assert.deepEqual(charts(decodeNativeAccount((await h.repo.refresh('B')).snapshot, now), now).sensorySeries, []);
  await h.repo.changeSnapshot('A', snapshot => deleteNativeRecord(snapshot, readNativeRecords(snapshot)[0]));
  await h.repo.sync('A');
  assert.equal(charts(decodeNativeAccount((await h.repo.refresh('A')).snapshot, now), now).total, 0);
  assert.deepEqual(charts(decodeNativeAccount((await h.repo.refresh('A')).snapshot, now), now).sensorySeries, []);
  h.fail = true; await assert.rejects(h.repo.refresh('A'), /offline/);
});

test('food icon bubbles count each saved classification once per dish, with deterministic top three', () => {
  const records = [
    row('a', { foodKindIDs: ['seafood', 'seafood', 'meat'] }),
    row('b', { foodKindIDs: ['seafood', 'noodle'] }),
    row('c', { foodKindIDs: ['meat'] }),
    row('d', { foodKinds: ['면류'] }),
    row('e', { foodKindIDs: ['unrecognized'] }),
  ];
  const chart = charts(data(records), now);
  assert.equal(chart.total, 5);
  assert.deepEqual(chart.foodKinds.map(k => [k.id, k.value]), [['meat', 2], ['noodle', 2], ['seafood', 2]]);
  assert.equal(chart.unclassifiedFoodCount, 1);
  assert.ok(chart.foodKinds.every(k => k.dishKindId === k.id));
});

test('sensory overlays deduplicate meals, preserve missing observations and align disjoint four-day windows', () => {
  const today = '2026-10-08T10:00:00+09:00';
  const records = [row('a', { mealID: 'meal', date: today }), row('b', { mealID: 'meal', date: today }),
    row('pending', { date: '2026-10-07T10:00:00+09:00' }), row('previous', { date: '2026-10-04T10:00:00+09:00' }),
    row('unknown', { date: null }), row('future', { date: '2026-10-09T10:00:00+09:00' })];
  const observation = (id, entryID, attribute, facet = 'presence') => ({ id, entryID, attribute, facet, value: facet === 'presence' ? 'present' : 'strong', label: '', target: '', phase: '', selection: id });
  const observations = [observation('a1', 'a', 'taste.umami'), observation('a2', 'a', 'taste.umami'), observation('b1', 'b', 'taste.umami'),
    observation('b2', 'b', 'taste.sweet'), observation('p', 'previous', 'taste.umami'), observation('u', 'unknown', 'taste.umami'),
    observation('f', 'future', 'taste.umami'), observation('intensity', 'pending', 'taste.salty', 'intensity')];
  const result = charts({ records, observations }, now);
  assert.deepEqual(result.areaDays, ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']);
  assert.deepEqual(result.areaComparisonDays, ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  assert.deepEqual(result.sensorySeries.map(s => s.id), ['umami', 'sweet']);
  assert.deepEqual(result.sensorySeries[0].values, [0, 0, null, 1]);
  assert.deepEqual(result.sensorySeries[0].comparisonValues, [0, 0, 0, 1]);
  assert.equal(result.sensoryUnobservedMeals, 1);
  assert.deepEqual(charts(data([]), now).sensorySeries, []);
});
