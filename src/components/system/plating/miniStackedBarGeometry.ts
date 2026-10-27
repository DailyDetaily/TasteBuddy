import { COMPONENT_TOKENS, type TasteId } from '../../../constants/designTokens';
import { miniChartGeometry } from './miniChartGeometry';

export interface MiniStackedBarSeries {
  id: string;
  label: string;
  axis: TasteId;
  /** One value per period, aligned across all series. null means unknown. */
  values: readonly (number | null)[];
}

export function miniStackedBarGeometry(series: readonly MiniStackedBarSeries[]) {
  const count = Math.max(0, ...series.map(item => item.values.length));
  const totals = Array.from({ length: count }, (_, index) => {
    const values = series.map(item => item.values[index]);
    if (values.some(value => value == null || !Number.isFinite(value) || value < 0)) return null;
    const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    return Number.isFinite(total) ? total : null;
  });
  const maximum = Math.max(0, ...totals.map(total => total ?? 0));
  const { height, zeroHeightRatio } = COMPONENT_TOKENS.miniChart;
  return miniChartGeometry(totals, undefined, { fitWeek: false }).map(bar => {
    const total = totals[bar.index];
    const barHeight = total === null ? 0 : total === 0 ? bar.width * zeroHeightRatio : total / maximum * height;
    let cumulativeValue = 0;
    const layers = total !== null && total > 0 ? series.flatMap(item => {
      const value = item.values[bar.index] ?? 0;
      if (value === 0) return [];
      cumulativeValue += value;
      const layerHeight = cumulativeValue / maximum * height;
      return [{ id: item.id, axis: item.axis, value, cumulativeValue, y: height - layerHeight, height: layerHeight }];
    }).reverse() : [];
    // Paint the longest cumulative capsule first; every layer shares the baseline.
    return { index: bar.index, x: bar.x, y: height - barHeight, width: bar.width, height: barHeight, total, layers };
  });
}
