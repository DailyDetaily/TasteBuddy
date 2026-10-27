import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-area-layers-'));
const out = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniAreaGeometry.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent' });
const { miniAreaLayerGeometry: geometry, miniAreaValueHeight: valueHeight, miniAreaPointRuns: pointRuns } = await import(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
const entry = (id, values, taste = '감칠맛') => ({ id, taste, values });
test('all layers share the zero baseline and maximum, with larger surfaces behind', () => {
  const layers = geometry([entry('small', [2, 2, 2, 2]), entry('large', [10, 10, 10, 10]), entry('middle', [5, 5, 5, 5])], 'layered');
  assert.deepEqual(layers.map(l => l.id), ['large', 'middle', 'small']);
  assert.deepEqual(layers.map(l => l.tint), [20, 20, 20]);
  layers.forEach((layer, i) => assert.ok(layer.runs[0].every(p => Math.abs(p.y - [0, 220 / 9, 352 / 9][i]) < 1e-9)));
  assert.ok(layers.every(l => l.runs[0][0].x === 0 && l.runs[0].at(-1).x === 132));
});
test('comparison tint follows area size, including when current data is larger', () => {
  const layers = geometry([entry('current', [8, 8, 8, 8]), entry('previous', [4, 4, 4, 4])], 'comparison');
  assert.deepEqual(layers.map(l => [l.id, l.tint]), [['current', 80], ['previous', 20]]);
  assert.deepEqual(geometry([entry('a', [1, 2]), entry('b', [2, 3], '단맛')], 'comparison'), []);
  assert.deepEqual(geometry([entry('a', [1, 2]), entry('b', [1, 2, 3])], 'layered'), []);
});
test('missing values break date runs; zeros retain their actual baseline', () => {
  const [layer] = geometry([entry('a', [4, null, 0, 8])], 'layered');
  assert.equal(layer.runs.length, 1); assert.deepEqual(layer.runs[0], [{ x: 88, y: 56 }, { x: 132, y: 0 }]);
  assert.deepEqual(geometry([entry('a', [0, 0, 0, 0])], 'layered'), []);
  assert.deepEqual(geometry([entry('a', [null, -1, NaN, Infinity])], 'layered'), []);
  const crossing = geometry([entry('a', [2, 8, 2, 8]), entry('b', [6, 3, 6, 3])], 'comparison');
  assert.ok(crossing.find(l => l.id === 'a').runs[0][1].y < crossing.find(l => l.id === 'b').runs[0][1].y);
});
test('Swift and web layer order, color roles and coordinates agree', { skip: process.platform !== 'darwin' }, async () => {
  const main = path.join(dir, 'main.swift'), binary = path.join(dir, 'native');
  await fs.writeFile(main, `import Foundation
let data = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [String: Any]
let values = (data["values"] as! [[Any]]).map { row in row.map { $0 as? Double } }
if data["single"] as? Bool == true {
    let runs = TBMiniAreaGeometry.single(values[0]).map { $0.map { ["x": $0.x, "y": $0.y] } }
    FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: runs))
    exit(0)
}
let result = TBMiniAreaGeometry.layers(values, comparison: data["comparison"] as! Bool).map { layer in
    ["index": layer.index, "tint": layer.tint, "area": layer.area, "runs": layer.runs.map { $0.map { ["x": $0.x, "y": $0.y] } }] as [String: Any]
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: result))
`);
  execFileSync('xcrun', ['swiftc', 'ios/TasteBuddy/Features/Home/RecordChartData.swift', main, '-o', binary], { timeout: 120000 });
  for (const [values, comparison] of [[[[2, 3, 4, 6], [4, 6, 7, 10], [1, 1, 2, 3]], false], [[[4, null, 0, 8], [6, 3, null, 3]], true], [[[0, 0], [0, 0]], true], [[[1, 1, 1, 1], [1, 1, 1, 1]], true], [[[0, 1, 2, 10], [0, 0.5, 1, 3]], true]]) {
    const native = JSON.parse(execFileSync(binary, { input: JSON.stringify({ values, comparison }), encoding: 'utf8' }));
    const web = geometry(values.map((v, i) => entry(String(i), v)), comparison ? 'comparison' : 'layered')
      .map(({ index, tint, area, runs }) => ({ index, tint, area, runs }));
    assert.deepEqual(native, web);
  }
  for (const values of [[1,1,1,1], [1], [0,0,0,0], [0,1,2,10], [1.2,2.1,2.4,4.5], [1,null,2,10], [1,-1,2,10], [10,1,10,1], [0.1,0.5,0.7,1]]) {
    const native = JSON.parse(execFileSync(binary, {input: JSON.stringify({values:[values], single:true}), encoding:'utf8'}));
    const maximum = Math.max(0,...values.filter(v => v !== null && Number.isFinite(v) && v >= 0));
    assert.deepEqual(native, pointRuns(values, maximum));
  }
});

test('all area types use a fixed 12px height for one, preserve zero and break at unknowns', () => {
  for (const maximum of [1,2,10,1000000]) {
    assert.equal(valueHeight(0,maximum),0);
    assert.equal(valueHeight(0.5,maximum),6);
    assert.equal(valueHeight(1,maximum),12);
    if(maximum>1) assert.equal(valueHeight(maximum,maximum),56);
    for(const invalid of [null,-1,NaN,Infinity]) assert.equal(valueHeight(invalid,maximum),null);
  }
  assert.deepEqual(pointRuns([1],1), [[{x:0,y:44},{x:132,y:44}]]);
  assert.ok(pointRuns([1,1,1,1],1)[0].every(p=>p.y===44));
  for(const variant of ['layered','comparison']) {
    const layers=geometry([entry('a',[1,1,1,1]),entry('b',[1,1,1,1])],variant);
    assert.ok(layers.every(l=>l.runs[0].every(p=>p.y===44)));
  }
  assert.deepEqual(pointRuns([1,null,1,10],10), [[{x:88,y:44},{x:132,y:0}]]);
});
