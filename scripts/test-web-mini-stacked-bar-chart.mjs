import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-mini-stacked-'));
const outfile = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniStackedBarGeometry.ts'], outfile,
  bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { miniStackedBarGeometry: geometry } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const series = (values, id = 'home') => ({ id, label: id, axis: 'umami', values });

test('cumulative capsules share the same baseline and scale, longest painted first', () => {
  const bars = geometry([series([3, 6]), series([6, 6], 'out')]);
  assert.deepEqual(bars.map(bar => bar.total), [9, 12]);
  assert.deepEqual(bars.map(bar => bar.height), [42, 56]);
  assert.deepEqual(bars[0].layers.map(s => s.height), [42, 14]);
  assert.deepEqual(bars[1].layers.map(s => s.height), [56, 28]);
  assert.equal(bars[0].layers[0].y, bars[0].y);
  for (const bar of bars) for (const layer of bar.layers) assert.equal(layer.y + layer.height, 56);
});

test('an incomplete period cannot appear as a complete partial total', () => {
  const bars = geometry([series([1, null, 2, 3, -1, NaN]), series([1, 2, null, 1, 1, 1], 'out')]);
  assert.deepEqual(bars.map(bar => bar.total), [2, null, null, 4, null, null]);
  for (const index of [1, 2, 4, 5]) {
    assert.equal(bars[index].height, 0);
    assert.equal(bars[index].layers.length, 0);
  }
  assert.ok(bars[3].x > bars[2].x);
});

test('zero markers, missing tails, and empty input remain distinct', () => {
  const bars = geometry([series([0, 1]), series([0], 'out')]);
  assert.equal(bars[0].height, bars[0].width / 2);
  assert.equal(bars[0].total, 0);
  assert.equal(bars[0].layers.length, 0);
  assert.equal(bars[1].total, null);
  assert.deepEqual(geometry([]), []);
});

test('dense capsules preserve cumulative heights, reverse paint order, and plot bounds', () => {
  for (const count of [1, 7, 15, 31, 200]) {
    const bars = geometry([series(Array(count).fill(1)), series(Array(count).fill(2), 'out')]);
    for (const bar of bars) {
      assert.ok(bar.width > 0 && bar.x >= 0 && bar.x + bar.width <= 132.000001);
      assert.ok(Math.abs(bar.height - 56) < 1e-9);
      assert.deepEqual(bar.layers.map(s => s.id), ['out', 'home']);
      assert.deepEqual(bar.layers.map(s => s.cumulativeValue), [3, 1]);
      assert.ok(bar.layers.every(s => s.y >= -1e-9 && Math.abs(s.y + s.height - 56) < 1e-9));
    }
  }
});

test('overflowing totals are missing rather than invalid SVG coordinates', () => {
  const bar = geometry([series([Number.MAX_VALUE]), series([Number.MAX_VALUE], 'out')])[0];
  assert.equal(bar.total, null);
  assert.equal(bar.height, 0);
  assert.deepEqual(bar.layers, []);
});

test('three categories produce 6, 5, 3 cumulative layers and zeros do not cover prior caps', () => {
  const bar = geometry([series([3]), series([2], 'out'), series([1], 'delivery')])[0];
  assert.deepEqual(bar.layers.map(layer => layer.cumulativeValue), [6, 5, 3]);
  assert.deepEqual(bar.layers.map(layer => layer.id), ['delivery', 'out', 'home']);
  const withZero = geometry([series([3]), series([0], 'out'), series([1], 'delivery')])[0];
  assert.deepEqual(withZero.layers.map(layer => layer.id), ['delivery', 'home']);
  assert.deepEqual(withZero.layers.map(layer => layer.cumulativeValue), [4, 3]);
});
