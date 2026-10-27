import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-aligned-line-'));
const output = path.join(dir, 'geometry.cjs');
await build({ stdin: { contents: "export * from './src/components/system/dataAlignedLinePath'; export * from './src/components/system/roundedLinePath'; export {DetailCartesianChart} from './src/components/system/DetailCharts'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: output, logLevel: 'silent' });
const { dataAlignedLineLayout, dataAlignedLineCubicCommands, buildDataAlignedCubicPath, roundedLineCorners, roundedLineMarkers, buildRoundedLinePath, DetailCartesianChart, createElement: h, renderToStaticMarkup: render } = createRequire(import.meta.url)(output);
after(() => rm(dir, { recursive: true, force: true }));
const xy = pairs => pairs.map(([x, y]) => ({ x, y }));
const fixtures = [[], xy([[6, 28]]), xy([[0, 20], [100, 20]]),
  xy([[8, 159], [108, 69], [208, 114], [308, 24]]), xy([[8, 69], [108, 114], [208, 69], [308, 159]]),
  xy([[0, 4], [1, 0], [2, 4], [3, 0]]), xy([[0, 0], [2, 0], [3, 3], [8, 3], [9, 0]]),
  xy([[0, 0], [100, 10], [101, -10], [300, 10]]), xy([[0, 1], [.001, 10], [200, 20], [201, 21]]),
  xy([[0, 0], [0, 4], [10, 2]])];
let seed = 17;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
for (let i = 0; i < 40; i++) {
  const count = 3 + Math.floor(random() * 12);
  fixtures.push(Array.from({ length: count }, (_, index) => ({ x: index * 300 / (count - 1), y: Math.floor(random() * 201) })));
}
const near = (a, b, epsilon = 1e-6) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);

test('inverse corner heights keep source coordinates fixed and put them on the original R path', () => {
  for (const points of fixtures) {
    const before = structuredClone(points), layout = dataAlignedLineLayout(points);
    assert.deepEqual(points, before);
    assert.deepEqual(layout.controls.map(p => p.x), points.map(p => p.x));
    assert.ok(layout.radius >= 0 && layout.radius <= 12);
    assert.doesNotMatch(buildRoundedLinePath(layout.controls, layout.radius), /NaN|Infinity/);
    assert.doesNotMatch(buildDataAlignedCubicPath(points), /NaN|Infinity/);
    const cubic = dataAlignedLineCubicCommands(points);
    for (const point of points.slice(1)) assert.ok(cubic.some(command => command.to.x === point.x && command.to.y === point.y));
    const markers = roundedLineMarkers(layout.controls, layout.radius), corners = roundedLineCorners(layout.controls, layout.radius);
    markers.forEach((marker, index) => {
      near(marker.x, points[index].x); near(marker.y, points[index].y, 1e-7);
      const corner = corners[index];
      if (corner) {
        near(Math.hypot(points[index].x - corner.center.x, points[index].y - corner.center.y), corner.radius);
        assert.ok(points[index].x >= corner.entry.x - 1e-6 && points[index].x <= corner.exit.x + 1e-6);
      }
    });
  }
  for (const points of fixtures.slice(3, 5)) {
    const layout = dataAlignedLineLayout(points);
    assert.equal(layout.radius, 12, 'the current two-line specimens retain R12');
    assert.match(buildRoundedLinePath(layout.controls, layout.radius), / L .* A /);
  }
});

test('detail keeps a single rounded path for both strokes and exact coordinates for every dot and selection', () => {
  for (const values of [[1, 3, 2, 4], [0, null, 3, 4], [null, 4, null, null]]) {
    const html = render(h(DetailCartesianChart, { labels: ['1', '2', '3', '4'], series: [{ id: 'a', label: '감칠맛', values, color: '#b373b3', axis: 'umami' }], kind: 'line', unit: '회', label: '기록', initialIndex: 1 }));
    const paths = mark => [...html.matchAll(new RegExp(`<path\\b[^>]*data-mark="${mark}"[^>]*>`, 'g'))].map(match => match[0].match(/d="([^"]+)"/)[1]);
    assert.deepEqual(paths('line-track'), paths('line-core'));
    const circles = [...html.matchAll(/<circle\b[^>]*data-mark="(?:history-node|current-node)"[^>]*>/g)].map(match => match[0]);
    const indices = values.flatMap((value, index) => value === null ? [] : [index]);
    assert.equal(circles.length, indices.length);
    circles.forEach((circle, n) => {
      const index = indices[n];
      near(Number(circle.match(/cx="([^"]+)"/)[1]), 8 + 308 * index / 3);
      near(Number(circle.match(/cy="([^"]+)"/)[1]), 214 - values[index] / 4 * 196);
    });
    const selected = [...html.matchAll(/<circle\b[^>]*data-mark="selection"[^>]*>/g)].map(match => match[0]);
    assert.equal(selected.length, values[1] === null ? 0 : 1);
    if (selected.length) near(Number(selected[0].match(/cy="([^"]+)"/)[1]), 214 - values[1] / 4 * 196);
    if (values.includes(null)) assert.equal(paths('line-core').length, values[2] === null ? 0 : 1);
  }
});

test('Swift and web reverse the same circular rounding for matching coordinates', { skip: process.platform !== 'darwin' }, async () => {
  const base = await readFile('ios/TasteBuddy/Components/SystemParityComponents.swift', 'utf8');
  const rounding = base.slice(base.indexOf('enum TasteLineRounding {'), base.indexOf('/// 홈 카드의 고정 크기 미니 그래프.'));
  const source = await readFile('ios/TasteBuddy/Components/TasteDetailCharts.swift', 'utf8');
  const alignment = source.slice(source.indexOf('enum TasteDetailLineAlignment {'), source.indexOf('/// Detail presentation'));
  const main = path.join(dir, 'main.swift');
  await writeFile(main, `import SwiftUI\n${rounding}\n${alignment}\n
let rows = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [[[String: Double]]]
let result: [[String: Any]] = rows.map { row in
  let points = row.map { CGPoint(x: $0["x"]!, y: $0["y"]!) }
  let layout = TasteDetailLineAlignment.layout(points)
  _ = TasteLineRounding.path(layout.controls, radius: layout.radius).cgPath
  return ["radius": layout.radius, "controls": layout.controls.map { ["x": $0.x, "y": $0.y] },
    "markers": TasteLineRounding.markers(layout.controls, radius: layout.radius).map { ["x": $0.x, "y": $0.y] }]
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: result))\n`);
  const binary = path.join(dir, 'native-geometry');
  execFileSync('xcrun', ['swiftc', main, '-o', binary], { timeout: 120000 });
  const actual = JSON.parse(execFileSync(binary, { input: JSON.stringify(fixtures), encoding: 'utf8' }));
  fixtures.forEach((points, index) => {
    const expected = dataAlignedLineLayout(points);
    near(actual[index].radius, expected.radius);
    points.forEach((point, i) => {
      for (const axis of ['x', 'y']) {
        near(actual[index].controls[i][axis], expected.controls[i][axis]);
        near(actual[index].markers[i][axis], point[axis], 1e-7);
      }
    });
  });
});
