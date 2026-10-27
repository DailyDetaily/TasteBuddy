import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-archive-menu-'));
const out = path.join(dir, 'contracts.mjs');
await build({ stdin: { contents: ["export * from './src/lib/gastronomy/archiveMenuInsights';", "export {prepare} from './src/lib/gastronomy/engine';", "export * from './src/lib/gastronomy/nativeRecord';", "export * from './src/lib/gastronomy/nativeRepository';", "export * from './src/lib/gastronomy/nativeRecordDeletion';", "export * from './src/lib/gastronomy/nativeArchive';"].join('\n'), resolveDir: process.cwd() }, outfile: out, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { buildArchiveMenuInsights: insights, prepare, nativeOverallStar, NativeRepository, newNativeRecord, decodeNativeAccount, readNativeRecords, deleteNativeRecord, swiftTime } = await import(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
process.env.TZ = 'Asia/Seoul';
const now = new Date('2026-10-25T12:00:00+09:00');
const row = (id, menuKey, date = '2026-10-20T12:00:00+09:00', extra = {}) => ({ id, mealID: id, menuKey, restaurantKey: 'restaurant', menu: menuKey ?? '미연결', restaurant: '식당', date, savedAt: now.toISOString(), source: 'restaurant', foodKinds: [], note: '', labels: [], ...extra });
const star = (entryID, value) => ({ id: entryID + ':stars', entryID, value });
const data = (records, overallStars = []) => ({ records, overallStars, observations: [] });
const ids = rows => rows.map(row => row.id);
const fixture = data([
  row('new-first', 'new'), row('new-copy', 'new', undefined, { mealID: 'new-first' }), row('new-later', 'new', '2026-10-21T12:00:00+09:00'),
  row('old-first', 'old', '2026-09-01T12:00:00+09:00'), row('old-recent', 'old'), row('old-undated', 'old', null),
  row('uncertain-old', 'uncertain', null), row('uncertain-recent', 'uncertain'), row('unrated', 'unrated'),
  row('same-day-a', 'same-day'), row('same-day-b', 'same-day'),
  row('conflicting-a', 'conflicting'), row('conflicting-b', 'conflicting', undefined, { mealID: 'conflicting-a' }),
  row('unknown', null), row('date-unknown', 'date-unknown', null),
  row('future', 'future', '2026-10-26T12:00:00+09:00'), row('future-sibling', 'future', null, { mealID: 'future' }),
  row('duplicate', 'duplicate'), row('duplicate', 'duplicate', undefined, { note: 'conflicting original' }),
], [star('new-first', 3.5), star('new-copy', 3.5), star('new-later', 5), star('same-day-a', 5), star('same-day-b', 5), star('conflicting-a', 3), star('conflicting-b', 5)]);
test('newness uses full history; groups are disjoint; future and conflicting originals are excluded', () => {
  const r = insights(fixture, now);
  assert.deepEqual(ids(r.newMenus), ['conflicting', 'new', 'same-day', 'unrated']);
  assert.deepEqual(ids(r.familiarMenus), ['old']); assert.deepEqual(ids(r.uncertainMenus), ['uncertain']);
  assert.equal(r.unlinkedMenuCount, 1); assert.equal(r.unknownDateCount, 3); assert.equal(r.menuCount, 7);
});
test('TOP 3 counts meals, not dish rows; undated repeats and deterministic ties are preserved', () => {
  const r = insights(fixture, now);
  assert.deepEqual(r.repeatedMenus.map(m => [m.id, m.mealCount]), [['old', 3], ['new', 2], ['same-day', 2]]);
  assert.deepEqual(insights({ ...fixture, records: [...fixture.records].reverse() }, now), r);
});
test('first-meal ratings do not use later scores or guess same-day order; missing differs from zero', () => {
  const r = insights(fixture, now);
  assert.deepEqual(ids(r.satisfiedMenus), []); assert.deepEqual(ids(r.belowThresholdMenus), ['new']);
  assert.deepEqual(ids(r.unratedMenus), ['unrated']); assert.deepEqual(ids(r.ambiguousRatingMenus), ['conflicting', 'same-day']);
  assert.equal(r.satisfiedMenus.length / (r.satisfiedMenus.length + r.belowThresholdMenus.length), 0);
  assert.equal(insights(data([row('r', 'r')]), now).belowThresholdMenus.length, 0);
});
test('same menu names in different restaurants stay separate and exact duplicates count once', () => {
  const a = row('a', 'A:pasta'), b = row('b', 'B:pasta', undefined, { restaurantKey: 'B' });
  const r = insights(data([a, a, b], [star('a', 4), star('b', 3.5)]), now);
  assert.equal(r.newMenus.length, 2); assert.equal(r.mealCount, 2); assert.equal(r.restaurantCount, 2);
  assert.equal(r.satisfiedMenus.length, 1); assert.equal(r.belowThresholdMenus.length, 1);
});
const evaluation = value => ({ questionID: 'overall_liking', questionVersion: 'dining-overall-stars/1', questionLabelSnapshot: '이 음식은 전체적으로 어땠나요?', responseValue: String(value), responseLabelSnapshot: String(value) + '점', target: 'whole_dish', phase: 'unspecified' });
test('only canonical direct half-star answers count; legacy and future-known evaluations are excluded', () => {
  assert.equal(nativeOverallStar(evaluation(4.5)), 4.5);
  for (const invalid of [evaluation(4.25), evaluation(0), evaluation(6), { ...evaluation(4), responseLabelSnapshot: '좋았어요' }, { ...evaluation(4), responseValue: '4.0' }, { ...evaluation(4), questionVersion: 'dining-overall-liking/1', responseValue: 'liked' }]) assert.equal(nativeOverallStar(invalid), null);
  const entry = { ...newNativeRecord(undefined, now), overallEvaluation: evaluation(5), feedbackStatus: 'completed', memoryCorrections: [{ id: 'future-edit', revision: 1, changedAt: swiftTime(new Date('2026-10-26T12:00:00+09:00')), before: { overallEvaluation: null }, after: { overallEvaluation: evaluation(5) } }] };
  const payload = { schemaVersion: 1, values: { 'tastebuddy.ios.dining-entries.v1': Buffer.from(JSON.stringify([entry])).toString('base64') } };
  assert.deepEqual(decodeNativeAccount(payload, now).overallStars, []);
});
test('rolling 30 days follow local calendar boundaries through DST and leap dates', () => {
  for (const [zone, time] of [['Asia/Seoul', '2026-10-25T03:00:00Z'], ['America/Los_Angeles', '2026-11-03T20:00:00Z'], ['Asia/Seoul', '2028-03-01T03:00:00Z']]) {
    process.env.TZ = zone; const n = new Date(time), boundary = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 29), before = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 30, 23, 59);
    const r = insights(data([row('at', 'at', boundary.toISOString(), { savedAt: time }), row('before', 'before', before.toISOString(), { savedAt: time }), row('before-return', 'before', time, { savedAt: time })]), n);
    assert.deepEqual(ids(r.newMenus), ['at'], zone); assert.deepEqual(ids(r.familiarMenus), ['before'], zone);
  }
  process.env.TZ = 'Asia/Seoul';
});
test('Swift and web produce identical results from shared fixtures in three time zones', { skip: process.platform !== 'darwin' }, async () => {
  const main = path.join(dir, 'main.swift'), binary = path.join(dir, 'runner');
  await fs.writeFile(main, [
    'import Foundation',
    'let input = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [String: Any]',
    'var calendar = Calendar(identifier: .gregorian); calendar.timeZone = TimeZone(identifier: input["timeZone"] as! String)!',
    'func date(_ value: String) -> Date { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; if let d = f.date(from: value) { return d }; f.formatOptions = [.withInternetDateTime]; return f.date(from: value)! }',
    'let records = (input["records"] as! [[String: Any]]).map { row in HomeArchiveMenuInsights.Record(id: row["id"] as! String, mealID: row["mealID"] as! String, menuKey: row["menuKey"] as? String, restaurantKey: row["restaurantKey"] as? String, menu: row["menu"] as! String, restaurant: row["restaurant"] as! String, date: (row["date"] as? String).map(date)) }',
    'let stars = (input["stars"] as! [[String: Any]]).map { row in HomeArchiveMenuInsights.Star(id: row["id"] as! String, entryID: row["entryID"] as! String, value: row["value"] as! Double) }',
    'let result = HomeArchiveMenuInsights.make(records: records, stars: stars, now: date(input["now"] as! String), calendar: calendar)',
    'let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]; FileHandle.standardOutput.write(try encoder.encode(result))',
  ].join('\n'));
  execFileSync('xcrun', ['swiftc', 'ios/TasteBuddy/Features/Home/ArchiveMenuInsights.swift', main, '-o', binary], { timeout: 120000 });
  for (const zone of ['Asia/Seoul', 'America/Los_Angeles', 'UTC']) {
    process.env.TZ = zone;
    for (const source of [fixture, data([]), data([row('one', 'one')], [star('one', 4)])]) {
      const state = prepare(source, 'all', 'all', now);
      const native = JSON.parse(execFileSync(binary, { input: JSON.stringify({ records: state.records, stars: source.overallStars, now: now.toISOString(), timeZone: zone }), encoding: 'utf8' }));
      assert.deepEqual(native, insights(source, now), zone);
    }
  }
  process.env.TZ = 'Asia/Seoul';
});
function harness() {
  const cached = new Map(), remote = new Map(); let fail = false;
  const copy = v => v == null ? null : structuredClone(v);
  const storage = { read: async owner => copy(cached.get(owner)), photo: async () => null, update: async (owner, change) => { const next = change(copy(cached.get(owner))); cached.set(owner, copy(next)); return copy(next); } };
  const transport = { fetch: async owner => { if (fail) throw Error('offline'); return { enabled: true, remote: copy(remote.get(owner)) }; }, save: async (owner, snapshot, revision) => { assert.equal(remote.get(owner)?.revision ?? 0, revision); remote.set(owner, { snapshot: copy(snapshot), revision: revision + 1 }); return revision + 1; } };
  return { repo: new NativeRepository(storage, transport), set fail(value) { fail = value; } };
}
test('repository save/restore/edit/delete propagate; accounts isolate; outages remain errors', async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  const h = harness(); await h.repo.refresh('A');
  const record = { ...newNativeRecord(undefined, now), menu: '국수', restaurant: '식당', restaurantID: 'restaurant', foodSource: { kind: 'restaurant', version: 1 }, feedbackStatus: 'completed', overallEvaluation: evaluation(4.5), mealTime: { source: 'user_confirmed', start: swiftTime(new Date('2026-10-20T12:00:00+09:00')), confirmedAt: swiftTime(now) } };
  const read = async owner => insights(decodeNativeAccount((await h.repo.refresh(owner)).snapshot, now), now);
  await h.repo.commit('A', record, null); await h.repo.sync('A');
  assert.equal((await read('A')).newMenus.length, 1); assert.equal((await read('A')).satisfiedMenus.length, 1);
  const restored = readNativeRecords((await h.repo.read('A')).snapshot)[0];
  await h.repo.commit('A', { ...restored, overallEvaluation: evaluation(3) }, restored); await h.repo.sync('A');
  assert.equal((await read('A')).satisfiedMenus.length, 0); assert.equal((await read('A')).belowThresholdMenus.length, 1);
  const current = readNativeRecords((await h.repo.read('A')).snapshot)[0];
  const repeated = { ...newNativeRecord(undefined, now), restaurant: record.restaurant, restaurantID: record.restaurantID, menu: record.menu, foodSource: record.foodSource, feedbackStatus: 'completed', overallEvaluation: evaluation(5), mealTime: { ...record.mealTime, start: swiftTime(new Date('2026-10-22T12:00:00+09:00')) } };
  await h.repo.commit('A', repeated, null); await h.repo.sync('A');
  assert.equal((await read('A')).repeatedMenus[0].mealCount, 2); assert.equal((await read('A')).belowThresholdMenus.length, 1);
  await h.repo.commit('A', { ...current, mealTime: { ...current.mealTime, start: swiftTime(new Date('2026-09-01T12:00:00+09:00')) } }, current); await h.repo.sync('A');
  assert.equal((await read('A')).familiarMenus.length, 1); assert.equal((await read('A')).newMenus.length, 0);
  assert.equal((await read('B')).mealCount, 0); assert.equal((await read('A')).mealCount, 2);
  await h.repo.changeSnapshot('A', snapshot => deleteNativeRecord(snapshot, readNativeRecords(snapshot).find(r => r.id === record.id))); await h.repo.sync('A');
  assert.equal((await read('A')).newMenus.length, 1); assert.equal((await read('A')).satisfiedMenus.length, 1); assert.equal((await read('A')).repeatedMenus.length, 0);
  h.fail = true; await assert.rejects(read('A'), /offline/);
});
