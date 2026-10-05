import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleChipCount } from '../src/components/system/plating/chipGroupLayout.mjs';

test('all tags fit without reserving an unnecessary count chip', () => {
  assert.equal(visibleChipCount([72, 72, 72], 232, 8, 0, [36, 36, 36]), 3);
});
test('editable group reserves the plus and exact overflow count widths', () => {
  assert.equal(visibleChipCount([72, 72, 72], 240, 8, 36, [36, 36, 36]), 2);
  assert.equal(visibleChipCount([72, 72, 72], 239, 8, 36, [36, 36, 36]), 1);
});
test('expanding input reduces the number of visible tags', () => {
  assert.equal(visibleChipCount([72, 72, 72], 320, 8, 140, [36, 36, 36]), 1);
  assert.equal(visibleChipCount([72, 72, 72], 320, 8, 220, [36, 36, 36]), 0);
});
test('two-digit hidden counts use their measured width', () => {
  const widths = Array(12).fill(50), counts = Array.from({length:12}, (_, i) => i < 9 ? 32 : 44);
  assert.equal(visibleChipCount(widths, 212, 8, 36, counts), 2);
  assert.equal(visibleChipCount(widths, 211, 8, 36, counts), 2);
  assert.equal(visibleChipCount(widths, 203, 8, 36, counts), 1);
});
test('empty groups and oversized tags retain an accurate hidden count', () => {
  assert.equal(visibleChipCount([], 320, 8, 36, []), 0);
  assert.equal(visibleChipCount([500, 72], 320, 8, 36, [36, 36]), 0);
});
