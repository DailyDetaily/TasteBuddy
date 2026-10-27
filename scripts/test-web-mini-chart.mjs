import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-mini-chart-'));
const outfile = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniChartGeometry.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { miniChartGeometry, miniChartMonthValues } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));

test('weekly single bars reach both edges without changing zero or missing day slots', () => {
  const bars = miniChartGeometry([0, 1, null, 3, 2, 4, 3]);
  assert.deepEqual(bars.map(bar => bar.x), [0, 20, 40, 60, 80, 100, 120]);
  assert.ok(bars.every(bar => bar.width === 12));
  assert.equal(bars[0].height, 6);
  assert.equal(bars[2].height, 0);
  assert.equal(bars.at(-1).x + bars.at(-1).width, 132);
  const stackedLayout = miniChartGeometry(Array(7).fill(1), undefined, { fitWeek: false });
  assert.ok(Math.abs(stackedLayout[0].x - 15 / 7) < 1e-9);
});

test('zero keeps its slot and one remains circular at either density', () => {
  for (const count of [7, 12]) {
    const values = Array(count).fill(4); values[0] = 0; values[1] = 1;
    const bars = miniChartGeometry(values);
    assert.equal(bars[0].height, bars[0].width / 2);
    assert.equal(bars[0].endpoint, false);
    assert.equal(bars[1].height, bars[1].width);
    assert.equal(bars[1].width, count === 7 ? 12 : 8.25);
    assert.equal(bars.at(-1).height, 56);
    assert.equal(bars.at(-1).endpoint, true);
  }
});
test('all ones stay circular, missing values stay absent, zero has no endpoint', () => {
  assert.ok(miniChartGeometry(Array(7).fill(1)).every(bar => bar.height === bar.width));
  const bars = miniChartGeometry([null, NaN, Infinity, -1, 1, 2, 0]);
  assert.deepEqual(bars.slice(0, 4).map(bar => bar.height), [0, 0, 0, 0]);
  assert.equal(bars.at(-1).endpoint, false);
  assert.deepEqual(miniChartGeometry([]), []);
});
test('larger counts increase monotonically and many bars remain within the plot', () => {
  const bars = miniChartGeometry([0, 1, 2, 3, 4, 5, 6]);
  assert.ok(bars.slice(1).every((bar, i) => i === 0 || bar.height > bars[i].height));
  for (const count of [1, 7, 12, 52, 200]) {
    const dense = miniChartGeometry(Array(count).fill(2));
    assert.ok(dense.every(bar => bar.width > 0 && bar.x >= 0 && bar.x + bar.width <= 132.000001));
  }
});
test('taller specimens preserve the original Figma value scale', async () => {
  const ledger = JSON.parse(await readFile('output/summary-card-figma-20261006/mini-chart-contract-20261007.json', 'utf8'));
  for (const chart of ledger.charts) {
    const bars = miniChartGeometry(chart.bars.map(bar => bar.value));
    chart.bars.forEach((bar, i) => {
      assert.equal(bars[i].width, bar.width);
      const expected = bar.height <= bar.width ? bar.height : bar.width + (bar.height - bar.width) / (32 - bar.width) * (56 - bar.width);
      assert.ok(Math.abs(bars[i].height - expected) < 1e-6);
    });
  }
});

test('grouped bars use a shared scale and preserve previous/current ordering', () => {
  const bars = miniChartGeometry([1, 4, 3, 6], [0, 2, 4, 3]);
  assert.equal(bars.length, 8);
  assert.deepEqual(bars.map(b => b.comparison), [true, false, true, false, true, false, true, false]);
  bars.map(b => b.height).forEach((height, i) => assert.ok(Math.abs(height - [6, 12, 20.8, 38.4, 38.4, 29.6, 29.6, 56][i]) < 1e-9));
  assert.equal(bars[1].x - bars[0].x - bars[0].width, 2);
  const unequalMaxima = miniChartGeometry([1, 2], [2, 4]);
  assert.equal(unequalMaxima[0].height, unequalMaxima[3].height);
  assert.ok(unequalMaxima[3].height < 56);
});
test('grouped missing values are not zero and dense pairs stay inside the frame', () => {
  const bars = miniChartGeometry([1], [0, 2, 3]);
  assert.equal(bars.length, 6);
  assert.equal(bars[3].height, 0);
  assert.equal(bars[5].endpoint, false);
  for (const count of [1, 4, 7, 52, 200]) {
    const dense = miniChartGeometry(Array(count).fill(1), Array(count).fill(0));
    assert.ok(dense.every(bar => bar.width > 0 && bar.x >= 0 && bar.x + bar.width <= 132.000001));
    assert.ok(dense.every(bar => bar.height === bar.width * (bar.comparison ? 0.5 : 1)));
  }
});

test('grouped geometry preserves original horizontal positions and scales from the circle anchor', async () => {
  const ledger = JSON.parse(await readFile('output/summary-card-figma-20261006/grouped-mini-chart-20261007.json', 'utf8'));
  const bars = miniChartGeometry([1, 4, 3, 6], [0, 2, 4, 3]);
  ledger.finalGeometry.forEach((bar, i) => {
    for (const key of ['x', 'width', 'comparison']) assert.equal(bars[i][key], bar[key]);
    const expected = bar.height <= bar.width ? bar.height : bar.width + (bar.height - bar.width) / (32 - bar.width) * (56 - bar.width);
    assert.ok(Math.abs(bars[i].height - expected) < 1e-9);
    assert.equal(bars[i].y + bars[i].height, 56);
  });
});

test('calendar month handles leap years and each actual month length', () => {
  for (const [year, month, days] of [[2026, 2, 28], [2024, 2, 29], [1900, 2, 28], [2000, 2, 29], [2026, 4, 30], [2026, 8, 31]]) {
    const values = miniChartMonthValues(Array(31).fill(2), year, month);
    assert.equal(values.length, days);
    const bars = miniChartGeometry(values);
    assert.equal(bars.length, days);
    assert.ok(Math.abs(bars.at(-1).x + bars.at(-1).width - 132) < 1e-6);
  }
});
test('calendar day slots preserve missing days and confirmed zero', () => {
  const values = miniChartMonthValues([2, null, 0, 1], 2026, 8);
  assert.deepEqual(values.slice(0, 5), [2, null, 0, 1, null]);
  assert.equal(values.length, 31);
  assert.equal(miniChartGeometry(values)[1].height, 0);
  assert.ok(miniChartGeometry(values)[2].height > 0);
  assert.deepEqual(miniChartMonthValues([], 2026, 13), []);
});


test('native mini-bar metrics use the same weekly width without changing other densities', {skip:process.platform!=='darwin'}, async () => {
  const source=await readFile('ios/TasteBuddy/Components/SystemParityComponents.swift','utf8');
  const metrics=source.slice(source.indexOf('enum TBMiniChartMetrics {'),source.indexOf('struct TBMiniChart: View'));
  const swift=path.join(dir,'metrics.swift');
  await writeFile(swift, String.raw`import Foundation
  enum TBMiniChartDimensions { static let width:CGFloat=132; static let height:CGFloat=56 }
  ${metrics}
  for grouped in [false,true] { for count in [1,7,12,31] {
    let spacing=TBMiniChartMetrics.spacing(count:count,grouped:grouped)
    let width=TBMiniChartMetrics.barWidth(count:count,grouped:grouped)
    let cell=(132-spacing*CGFloat(count-1))/CGFloat(count)
    let inner=grouped ? TBMiniChartMetrics.innerSpacing(count:count) : 0
    let left=(cell-(grouped ? 2*width+inner : width))/2
    print("\(grouped),\(count),\(spacing),\(width),\(left)")
  }}
  `);
  const result=execFileSync('xcrun',['swift',swift],{encoding:'utf8'}).trim().split('\n');
  for(const row of result){
    const [grouped,count,spacing,width,left]=row.split(',');
    const n=Number(count), bars=miniChartGeometry(Array(n).fill(2),grouped==='true'?Array(n).fill(1):undefined);
    assert.ok(Math.abs(bars[0].width-Number(width))<1e-8);
    assert.ok(Math.abs(bars[0].x-Number(left))<1e-8);
    if(grouped==='false'&&n===7)assert.equal(Number(spacing),8);
  }
});
