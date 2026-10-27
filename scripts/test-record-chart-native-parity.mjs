import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Swift and TypeScript chart aggregates agree across local calendar boundaries', { skip: process.platform !== 'darwin' }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-native-chart-parity-'));
  const oldTZ = process.env.TZ;
  try {
    const out = path.join(dir, 'web.mjs');
    await build({ stdin: { contents: "export * from './src/lib/gastronomy/recordChartData'; export {prepare} from './src/lib/gastronomy/engine';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent' });
    const { buildRecordChartData, prepare } = await import(out);
    const main = path.join(dir, 'main.swift');
    await fs.writeFile(main, `import Foundation
let input = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [String: Any]
var calendar = Calendar(identifier: .gregorian); calendar.timeZone = TimeZone(identifier: input["timeZone"] as! String)!
func date(_ value: String) -> Date { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; if let d = f.date(from: value) { return d }; f.formatOptions = [.withInternetDateTime]; return f.date(from: value)! }
let records = (input["records"] as! [[String: Any]]).map { row in TBRecordChartData.Input(id: row["id"] as! String, date: (row["date"] as? String).map(date), source: row["source"] as! String, mealID: row["mealID"] as? String, tasteIDs: row["tasteIDs"] as? [String] ?? [], hasSensoryRecord: row["hasSensoryRecord"] as? Bool ?? false) }
let result = TBRecordChartData.make(records: records, now: date(input["now"] as! String), calendar: calendar, unknownDateCount: input["unknown"] as! Int, futureCount: input["future"] as! Int)
let output: [String: Any] = ["month": result.month.map { ["date": $0.id, "count": $0.count.map { $0 as Any } ?? NSNull()] }, "total": result.total, "startDay": result.startDay, "current": result.current, "previous": result.previous, "currentDays": result.currentDays, "previousDays": result.previousDays, "series": result.series.map { ["id": $0.id, "value": $0.value, "values": $0.values] as [String: Any] }, "absolute": result.absoluteValues, "steps": TBMiniHeatmapGeometry.tintSteps, "areaDays": result.areaDays, "areaComparisonDays": result.areaComparisonDays, "sensoryUnobservedMeals": result.sensoryUnobservedMeals, "sensorySeries": result.sensorySeries.map { ["id": $0.id, "label": $0.label, "value": $0.value, "values": $0.values.map { $0.map { $0 as Any } ?? NSNull() }, "comparisonValues": $0.comparisonValues.map { $0.map { $0 as Any } ?? NSNull() }] as [String: Any] }]
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]))
`);
    const binary = path.join(dir, 'runner');
    execFileSync('xcrun', ['swiftc', 'ios/TasteBuddy/Features/Home/RecordChartData.swift', main, '-o', binary], { timeout: 120000, maxBuffer: 2 * 1024 * 1024 });
    for (const [timeZone, nowText] of [['Asia/Seoul', '2026-10-08T03:00:00Z'], ['America/Los_Angeles', '2026-11-03T20:00:00Z'], ['Asia/Seoul', '2028-02-29T03:00:00Z']]) {
      process.env.TZ = timeZone;
      const now = new Date(nowText);
      const records = Array.from({ length: 20 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - index % 12), 10);
        return { id: `r${index}`, mealID: `m${index}`, menu: '', restaurant: '', foodKinds: [], labels: [], note: '', savedAt: now.toISOString(), date: date.toISOString(), source: ['homeCooked', 'restaurant', 'unknown'][index % 3] };
      });
      const observations = records.flatMap((record, index) => index % 5 === 0 ? [] : ['taste.umami', ...(index % 3 === 0 ? ['taste.sweet'] : [])].map((attribute, j) => ({ id: `${record.id}:${j}`, entryID: record.id, facet: 'presence', value: 'present', attribute, label: '', target: 'whole_dish', phase: 'unspecified', selection: `${index}:${j}` })));
      const data = { records, observations }, state = prepare(data, 'all', 'all', now), web = buildRecordChartData(data, now);
      const nativeRecords = state.records.map(row => { const observed = state.observations.filter(o => o.entryID === row.id); return { ...row, tasteIDs: observed.map(o => o.attribute.slice(6)), hasSensoryRecord: observed.length > 0 }; });
      const native = JSON.parse(execFileSync(binary, { input: JSON.stringify({ timeZone, now: now.toISOString(), records: nativeRecords, unknown: state.unknown.length, future: state.future.length }), encoding: 'utf8' }));
      assert.deepEqual(native.month, web.month.map(({ date, count }) => ({ date, count })));
      for (const key of ['total', 'startDay', 'current', 'previous', 'currentDays', 'previousDays', 'areaDays', 'areaComparisonDays', 'sensoryUnobservedMeals']) assert.deepEqual(native[key], web[key], `${timeZone}: ${key}`);
      assert.deepEqual(native.series, web.series.map(({ id, value, values }) => ({ id, value, values })));
      native.absolute.forEach((value, index) => assert.ok(Math.abs(value - web.absolute[index].value) < 1e-9));
      assert.deepEqual(native.steps, [80, 60, 40, 20, 0]);
      assert.deepEqual(native.sensorySeries, web.sensorySeries.map(({ id, taste, value, values, comparisonValues }) => ({ id, label: taste, value, values, comparisonValues })));
    }
  } finally {
    if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
