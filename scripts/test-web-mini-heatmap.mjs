import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
const dir = await mkdtemp(path.join(tmpdir(), 'tb-heatmap-'));
const out = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniHeatmapGeometry.ts'], outfile: out, bundle: true, format: 'esm', platform: 'node', logLevel: 'silent' });
const { miniHeatmapGeometry: geometry } = await import(out);
after(() => rm(dir, { recursive: true, force: true }));
test('calendar flows Monday to Sunday across, then into next week below', () => {
  const cells = geometry(Array(14).fill(1));
  assert.equal(cells[0].y, cells[6].y);
  assert.ok(cells[6].x > cells[0].x);
  assert.equal(cells[7].x, cells[0].x);
  assert.ok(cells[7].y > cells[0].y);
  const offset = geometry([1, 2], 6).filter(c => !c.padding);
  assert.ok(offset[0].x > offset[1].x);
  assert.ok(offset[1].y > offset[0].y);
});
test('zero, missing, invalid and positive counts keep distinct fixed levels', () => {
  assert.deepEqual(geometry([0, null, -1, NaN, Infinity, 1, 2, 3, 4, 20]).filter(c => !c.padding).map(c => c.level), [0, null, null, null, null, 1, 2, 3, 4, 4]);
  assert.equal(geometry([2])[0].level, geometry([2, 100])[0].level);
  assert.deepEqual(geometry([]), []);
});
test('rectangular cells and neutral calendar padding fill 132 by 56', () => {
  for (const count of [1, 7, 31, 84, 182, 365]) for (const offset of [0, 3, 6]) {
    const cells = geometry(Array(count).fill(1), offset);
    assert.equal(cells.filter(c => !c.padding).length, count);
    assert.equal(cells.length % 7, 0);
    assert.ok(cells.filter(c => c.padding).every(c => c.value === null && c.level === 0));
    for (const c of cells) {
      assert.ok(c.width > 0 && c.height > 0 && c.x >= -1e-9 && c.y >= -1e-9);
      assert.ok(c.x + c.width <= 132 + 1e-9 && c.y + c.height <= 56 + 1e-9);
    }
    assert.equal(cells[0].x, 0);
    assert.equal(cells[0].y, 0);
    assert.ok(Math.abs(cells.at(-1).y + cells.at(-1).height - 56) < 1e-9);
    assert.ok(Math.abs(Math.max(...cells.map(c => c.x + c.width)) - 132) < 1e-9);
  }
});
