import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-tcs-badge-'));
const outfile = path.join(dir, 'gradient.mjs');
await build({ entryPoints: ['src/constants/tasteColors.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { buildTasteAdjustmentGradient } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const options = { colorForTaste: taste => taste === '단맛' ? '#FFCC80' : '#CE93D8' };

test('weighted boundary and percentage strings agree with the native fixture', () => {
  const expected = 'linear-gradient(135deg, #FFCC80 0%, #FFCC80 72.00%, #CE93D8 88.00%, #CE93D8 100%)';
  assert.equal(buildTasteAdjustmentGradient([{taste:'단맛',change:'+20%'},{taste:'감칠맛',change:'-5%'}], options), expected);
});
test('zero, missing and non-finite weights do not introduce bogus colors', () => {
  assert.equal(buildTasteAdjustmentGradient([], options), '#E0E0E0');
  assert.equal(buildTasteAdjustmentGradient([{taste:'단맛',change:0},{taste:'감칠맛',change:NaN},{taste:'감칠맛',change:Infinity}], options), '#E0E0E0');
  assert.equal(buildTasteAdjustmentGradient([{taste:'단맛',change:-12},{taste:'감칠맛',change:0}], options), 'linear-gradient(135deg, #FFCC80 0%, #FFCC80 100%)');
});
test('large finite input does not overflow normalization', () => {
  assert.equal(buildTasteAdjustmentGradient([{taste:'단맛',change:Number.MAX_VALUE},{taste:'감칠맛',change:Number.MAX_VALUE}], options), 'linear-gradient(135deg, #FFCC80 0%, #FFCC80 38.00%, #CE93D8 62.00%, #CE93D8 100%)');
});
test('existing helper calls retain their original default tint and direction', () => {
  const data = [{taste:'단맛',change:12}];
  assert.match(buildTasteAdjustmentGradient(data), /^linear-gradient\(135deg, color-mix\(in srgb, var\(--tb-taste-sweet-light,/);
  assert.match(buildTasteAdjustmentGradient(data, '90deg'), /^linear-gradient\(90deg,/);
  assert.equal(buildTasteAdjustmentGradient(data, {colorForTaste:()=> '#123456'}), 'linear-gradient(135deg, #123456 0%, #123456 100%)');
});
