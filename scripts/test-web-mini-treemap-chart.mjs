import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-treemap-'));
const outfile = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniTreemapGeometry.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { miniTreemapGeometry } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const area = c => c.width * c.height - (4 - Math.PI) * c.radius ** 2;

test('the six reference values retain their colored-area proportions', () => {
  const values = [3, 8, 18, 12, 6, 4], cells = miniTreemapGeometry(values);
  assert.equal(cells.length, 6);
  const total = cells.reduce((sum, c) => sum + area(c), 0);
  for (const c of cells) assert.ok(Math.abs(area(c) / total - values[c.index] / 51) < 1e-6);
});

test('capsule cells stay inside 132 by 56 without overlapping', () => {
  const cells = miniTreemapGeometry([3, 8, 18, 12, 6, 4]);
  for (const c of cells) {
    assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.width <= 132 + 1e-8 && c.y + c.height <= 56 + 1e-8);
    assert.equal(c.radius, Math.min(c.width, c.height) / 2);
    for (const other of cells) if (other.index !== c.index) {
      assert.ok(c.x + c.width <= other.x || other.x + other.width <= c.x || c.y + c.height <= other.y || other.y + other.height <= c.y);
    }
  }
});

test('layout is deterministic and preserves source item identities', () => {
  const values = [4, 4, 8, 4];
  assert.deepEqual(miniTreemapGeometry(values), miniTreemapGeometry(values));
  assert.deepEqual(miniTreemapGeometry(values).map(c => [c.index, c.value]), values.map((v, i) => [i, v]));
});

test('the largest block is on the right and the smallest is at the top', () => {
  const cells = miniTreemapGeometry([3, 8, 18, 12, 6, 4]);
  const byValue = value => cells.find(cell => cell.value === value);
  assert.equal(byValue(18).x, Math.max(...cells.map(cell => cell.x)));
  assert.ok(Math.abs(byValue(18).x + byValue(18).width - 131.5) < 1e-8);
  assert.equal(byValue(18).y, byValue(12).y);
  assert.equal(byValue(18).height, byValue(12).height);
  assert.ok(Math.abs(byValue(3).y - 0.5) < 1e-8);
  assert.ok(byValue(3).y < byValue(4).y && byValue(4).y < byValue(8).y);
});

test('zero and unavailable values do not create misleading areas', () => {
  assert.deepEqual(miniTreemapGeometry([0, null, -1, NaN, Infinity]), []);
  assert.deepEqual(miniTreemapGeometry([0, 8, null, 2]).map(c => c.index), [1, 3]);
});

test('different distributions retain area ratios after rounding', () => {
  for (const values of [[1, 1, 1, 1, 1, 1], [1, 2, 3], [999, 1], [4, 7, 12, 3, 6, 8, 15]]) {
    const cells = miniTreemapGeometry(values), sum = values.reduce((a, b) => a + b, 0), colored = cells.reduce((a, c) => a + area(c), 0);
    for (const c of cells) assert.ok(Math.abs(area(c) / colored / (c.value / sum) - 1) < 1e-5);
  }
});

test('single and extreme magnitudes remain finite', () => {
  assert.equal(miniTreemapGeometry([5]).length, 1);
  for (const values of [[1e308, 1e308], [1e308, 1], [1e-300, 2e-300]]) {
    assert.ok(miniTreemapGeometry(values).every(c => Object.values(c).every(Number.isFinite)));
  }
});
