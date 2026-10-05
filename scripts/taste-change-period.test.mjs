import test from 'node:test';
import assert from 'node:assert/strict';
import { tasteChangeBounds } from '../src/lib/tasteChangePeriod.mjs';

const at = (year, month, day) => new Date(year, month - 1, day, 12).getTime();
const point = (year, month, day) => ({ start: at(year, month, day), date: at(year, month, day) });

test('month-end and leap-year ranges use calendar months', () => {
  assert.deepEqual(tasteChangeBounds([point(2026, 3, 31)], 1), { start: at(2026, 2, 28), end: at(2026, 3, 31) });
  assert.deepEqual(tasteChangeBounds([point(2024, 3, 31)], 1), { start: at(2024, 2, 29), end: at(2024, 3, 31) });
  assert.deepEqual(tasteChangeBounds([point(2024, 2, 29)], 12), { start: at(2023, 2, 28), end: at(2024, 2, 29) });
});

test('previous periods move by the selected month count and return to the latest bound', () => {
  const points = [point(2026, 10, 3)];
  for (const months of [1, 3, 6, 12]) {
    const current = tasteChangeBounds(points, months);
    const previous = tasteChangeBounds(points, months, -1);
    assert.equal(previous.end, current.start);
    assert.equal(tasteChangeBounds(points, months, 0).end, points[0].date);
  }
});

test('all includes the earliest observation start regardless of ordering or old offset', () => {
  const points = [{ start: at(2025, 1, 1), date: at(2025, 3, 1) }, point(2026, 10, 3)];
  assert.deepEqual(tasteChangeBounds(points.toReversed(), 0, -2), { start: at(2025, 1, 1), end: at(2026, 10, 3) });
});

test('empty data keeps finite bounds without inventing observations', () => {
  const now = at(2026, 10, 3);
  assert.deepEqual(tasteChangeBounds([], 0, 0, now), { start: now, end: now });
  assert.deepEqual(tasteChangeBounds([], 6, 0, now), { start: at(2026, 4, 3), end: now });
});

test('points at range edges remain included while older data is excluded', () => {
  const points = [point(2026, 6, 30), point(2026, 7, 3), point(2026, 10, 3)];
  const { start, end } = tasteChangeBounds(points, 3);
  assert.deepEqual(points.filter(p => p.date >= start && p.date <= end), points.slice(1));
});
