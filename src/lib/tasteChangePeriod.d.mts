export function tasteChangeBounds(
  points: readonly { date: number; start: number }[],
  months: 0 | 1 | 3 | 6 | 12,
  offset?: number,
  now?: number,
): { start: number; end: number };
