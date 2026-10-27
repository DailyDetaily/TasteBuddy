export type PieDonutMode = 'relative' | 'absolute';

/** Absolute values are percentage points out of 100, never renormalized. */
export function pieDonutData(values: readonly number[], mode: PieDonutMode = 'relative') {
  if (mode === 'relative') return { values: [...values], remainder: 0, valid: true };
  const sum = values.reduce((total, value) => total + value, 0);
  if (values.some(value => !Number.isFinite(value) || value < 0) || sum > 100 + 1e-10) {
    return { values: [], remainder: 0, valid: false };
  }
  const remainder = Math.max(0, 100 - sum);
  return { values: [...values, remainder], remainder, valid: true };
}
