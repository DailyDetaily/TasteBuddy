import { COMPONENT_TOKENS } from '../../../constants/designTokens';

/** null/non-finite values keep their position without inventing a zero. */
export function miniChartGeometry(values: readonly (number | null)[], comparisonValues?: readonly (number | null)[], options: { fitWeek?: boolean } = {}) {
  const { width, height, gap: preferredGap, maximumBarWidth, zeroHeightRatio } = COMPONENT_TOKENS.miniChart;
  const grouped = comparisonValues !== undefined;
  const count = Math.max(values.length, comparisonValues?.length ?? 0);
  // Seven single-series bars fill the plot: 7 × 12 + 6 × 8 = 132.
  // Stacked charts retain their independent spacing contract.
  const requestedGap = grouped ? COMPONENT_TOKENS.miniChart.groupGap
    : count === 7 && options.fitWeek !== false ? COMPONENT_TOKENS.miniChart.weeklyGap : preferredGap;
  const gap = count ? Math.min(requestedGap, width / ((grouped ? 3 : 2) * count)) : preferredGap;
  const cellWidth = count ? (width - gap * (count - 1)) / count : 0;
  const innerGap = grouped ? Math.min(COMPONENT_TOKENS.miniChart.intraGroupGap, cellWidth / 4) : 0;
  const barWidth = Math.min(maximumBarWidth, grouped ? (cellWidth - innerGap) / 2 : cellWidth);
  // Both series share the same scale, including when one series has missing values.
  const maximum = Math.max(0, ...[...values, ...(comparisonValues ?? [])].filter((v): v is number => v !== null && Number.isFinite(v)));
  const makeBar = (value: number | null | undefined, index: number, comparison: boolean) => {
    const present = value != null && Number.isFinite(value) && value >= 0;
    // Zero is a position marker; one is a circle; larger counts extend the capsule.
    const barHeight = !present ? 0 : value === 0 ? barWidth * zeroHeightRatio
      : maximum <= 1 ? barWidth
      : barWidth + Math.max(0, value - 1) / (maximum - 1) * (height - barWidth);
    return {
      x: index * (cellWidth + gap) + (cellWidth - (grouped ? 2 * barWidth + innerGap : barWidth)) / 2
        + (grouped && !comparison ? barWidth + innerGap : 0),
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
      endpoint: present && value > 0 && index === count - 1,
      comparison,
      index,
    };
  };
  return Array.from({ length: count }, (_, index) => grouped
    ? [makeBar(comparisonValues?.[index], index, true), makeBar(values[index], index, false)]
    : [makeBar(values[index], index, false)]).flat();
}

/** One slot per calendar day; absent entries stay missing instead of becoming zero. */
export function miniChartMonthValues(values: readonly (number | null)[], year: number, month: number) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) return [];
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return Array.from({ length: days }, (_, i) => values[i] ?? null);
}
