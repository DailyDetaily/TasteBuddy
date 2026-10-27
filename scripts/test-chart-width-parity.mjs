import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-chart-width-'));
const out = path.join(dir, 'render.cjs');
await build({ stdin: { contents: `
export {default as Card, TasteChangeEmptySummary} from './src/components/system/TasteInsightSummaryCard';
export {miniChartGeometry} from './src/components/system/plating/miniChartGeometry';
export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: out, logLevel: 'silent' });
const { Card, TasteChangeEmptySummary, miniChartGeometry, createElement: h, renderToStaticMarkup: render } = createRequire(import.meta.url)(out);
after(() => rm(dir, { recursive: true, force: true }));

test('the actual summary card fixes both line rows at 132 for short and long histories', () => {
  for (const count of [1, 2, 4, 7]) {
    const details = ['increase', 'decrease'].map((trend, i) => ({
      detailLabel: i ? '쓴맛' : '감칠맛', parentTaste: i ? '쓴맛' : '감칠맛', trend,
      history: Array.from({ length: count - 1 }, (_, index) => `${i ? -index : index}%`), change: i ? '-8%' : '+8%',
    }));
    const html = render(h(Card, { details, keywords: [], sectionLabel: '미각 변화', title: '표본', onClick() {} }));
    assert.equal((html.match(/viewBox="0 0 132 24"/g) ?? []).length, 2);
    const currentNodes = [...html.matchAll(/<circle data-name="Current node" cx="([\d.]+)"/g)];
    assert.equal(currentNodes.length, 2);
    currentNodes.forEach(node => assert.equal(Number(node[1]) + 6, 132));
    const trackPaths = [...html.matchAll(/<path d="([^"]*)" fill="none" stroke="var\(--tb-mini-chart-track\)"/g)];
    assert.equal(trackPaths.length, 2);
    trackPaths.forEach(([, d]) => {
      assert.match(d, count === 1 ? /^M 126 / : /^M 6 /);
      if (count === 1) assert.doesNotMatch(d, / [LAC] /);
    });
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
  const empty = render(h(TasteChangeEmptySummary));
  assert.equal((empty.match(/viewBox="0 0 132 24"/g) ?? []).length, 2);
  assert.equal((empty.match(/d="M6 12H126"/g) ?? []).length, 4);
});

function block(source, marker) {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `Missing ${marker}`);
  let level = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') level++;
    if (source[i] === '}' && --level === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed ${marker}`);
}

test('actual Swift spacing and line layout preserve edges, dense variants and waiting state', { skip: process.platform !== 'darwin' }, async () => {
  const source = await readFile('ios/TasteBuddy/Components/SystemParityComponents.swift', 'utf8');
  const data = await readFile('ios/TasteBuddy/Features/Home/RecordChartData.swift', 'utf8');
  const dimensions = block(data, 'enum TBMiniChartDimensions {');
  const metrics = block(source, 'enum TBMiniChartMetrics {');
  const layout = block(source, 'static func horizontalLayout(');
  const diameter = source.match(/static let currentNodeDiameter: CGFloat = ([\d.]+)/)[1];
  const main = path.join(dir, 'main.swift');
  await writeFile(main, `import Foundation
${dimensions}
${metrics}
enum LineLayout { static let currentNodeDiameter: CGFloat = ${diameter}
${layout}
}
let cases = [(7, false, true), (15, false, true), (31, false, true), (4, true, true), (7, true, true), (7, false, false)]
let bars: [[String: Any]] = cases.map { count, grouped, fitWeek in
  let gap = TBMiniChartMetrics.spacing(count: count, grouped: grouped, fitWeek: fitWeek)
  let width = TBMiniChartMetrics.barWidth(count: count, grouped: grouped, fitWeek: fitWeek)
  let cell = (TBMiniChartMetrics.width - gap * CGFloat(count - 1)) / CGFloat(count)
  let inner = grouped ? TBMiniChartMetrics.innerSpacing(count: count) : 0
  let xs = (0..<count).flatMap { i -> [CGFloat] in
    let x = CGFloat(i) * (cell + gap) + (cell - (grouped ? 2 * width + inner : width)) / 2
    return grouped ? [x, x + width + inner] : [x]
  }
  return ["count": count, "grouped": grouped, "fitWeek": fitWeek, "width": width, "xs": xs]
}
let lines: [[String: Any]] = [0, 1, 2, 4, 7].map { count in
  let v = LineLayout.horizontalLayout(pointCount: count, availableWidth: 200, plotWidth: 132)
  return ["count": count, "width": v.width, "gap": v.pointGap, "first": v.firstX]
}
let pending = LineLayout.horizontalLayout(pointCount: 1, availableWidth: 132, plotWidth: 132, showsPendingHistory: true)
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: ["bars": bars, "lines": lines, "pending": [pending.width, pending.pointGap, pending.firstX]]))
`);
  const binary = path.join(dir, 'native');
  execFileSync('xcrun', ['swiftc', main, '-o', binary], { timeout: 120000 });
  const native = JSON.parse(execFileSync(binary, { encoding: 'utf8' }));
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
  for (const row of native.bars) {
    const values = Array(row.count).fill(1);
    const web = miniChartGeometry(values, row.grouped ? values : undefined, { fitWeek: row.fitWeek });
    web.forEach((bar, i) => { near(bar.x, row.xs[i]); near(bar.width, row.width); });
  }
  for (const row of native.lines) {
    assert.equal(row.width, 132);
    if (row.count === 1) assert.equal(row.first, 126);
    if (row.count >= 2) { assert.equal(row.first, 6); near(row.first + row.gap * (row.count - 1) + 6, 132); }
  }
  assert.deepEqual(native.pending, [132, 0, 6]);
});
