import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-bubble-'));
const outfile = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/miniBubbleGeometry.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { miniBubbleGeometry } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));

test('circle areas, rather than diameters, encode the values', () => {
  const circles = miniBubbleGeometry([1, 4, 9, 16]);
  assert.deepEqual(circles.map(c => c.radius * 2), [12, 24, 36, 48]);
  assert.equal(circles[3].radius ** 2 / circles[0].radius ** 2, 16);
});

test('positions retain input order with no value sorting', () => {
  const circles = miniBubbleGeometry([9, 16, 4]);
  assert.deepEqual(circles.map(c => c.index), [0, 1, 2]);
  assert.ok(circles.every(c => c.cy === 28));
  assert.ok(circles[0].cx < circles[1].cx && circles[1].cx < circles[2].cx);
  assert.ok(Math.abs(circles.at(-1).cx + circles.at(-1).radius - 132) < 1e-9);
});

test('dense data fits without overlap and retains area ratios', () => {
  for (const count of [6, 20, 100]) {
    const values = Array.from({ length: count }, (_, i) => i + 1);
    const circles = miniBubbleGeometry(values);
    for (const [i, c] of circles.entries()) {
      assert.ok(c.cx - c.radius >= -1e-8 && c.cx + c.radius <= 132 + 1e-8);
      assert.ok(c.cy - c.radius >= 0 && c.cy + c.radius <= 56);
      if (i) assert.ok(c.cx - c.radius > circles[i - 1].cx + circles[i - 1].radius);
      assert.ok(Math.abs(c.radius ** 2 / circles[0].radius ** 2 - values[i]) < 1e-9);
    }
  }
});

test('zeros and unavailable values create no positive-area marks', () => {
  assert.deepEqual(miniBubbleGeometry([0, null, -1, NaN, Infinity]), []);
  assert.deepEqual(miniBubbleGeometry([0, 9, null, 4]).map(c => c.index), [1, 3]);
});

test('a single positive value remains a right-aligned circle', () => {
  assert.deepEqual(miniBubbleGeometry([7]), [{ index: 0, value: 7, cx: 104, cy: 28, radius: 28 }]);
});

test('large magnitudes normalize without overflow or changing ratios', () => {
  const circles = miniBubbleGeometry([1e308, 2.5e307]);
  assert.ok(circles.every(c => Number.isFinite(c.radius) && Number.isFinite(c.cx)));
  assert.equal(circles[0].radius / circles[1].radius, 2);
});
