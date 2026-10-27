import { COMPONENT_TOKENS, TASTE_TINTS, type TasteId } from '../../../constants/designTokens';
import { COLOR_TOKENS } from '../../../constants/uiColorTokens';
import { miniStackedBarGeometry, type MiniStackedBarSeries } from './miniStackedBarGeometry';

export type { MiniStackedBarSeries } from './miniStackedBarGeometry';

export interface MiniStackedBarChartProps {
  series: readonly MiniStackedBarSeries[];
  /** Omit when the surrounding card already describes the data. */
  label?: string;
}

export function miniStackedBarColor(axis: TasteId) {
  const step = COMPONENT_TOKENS.miniChart.stackedBarTint;
  return `var(--tb-taste-${axis}-chart-tint-${step}, var(--tb-taste-${axis}-tint-${step}, ${TASTE_TINTS[axis][step]}))`;
}

/** Longest-to-shortest cumulative capsules share a baseline and circular end caps. */
export default function MiniStackedBarChart({ series, label }: MiniStackedBarChartProps) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const bars = miniStackedBarGeometry(series);
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    style={{ display: 'block', width, minWidth: width, maxWidth: width, height, flexShrink: 0 }} role={label ? 'img' : undefined}
    aria-label={label} aria-hidden={label ? undefined : true} data-name="Mini Stacked Bar Chart">
    {bars.map(bar => bar.height > 0 && <g key={bar.index}>
      {bar.total === 0 ? <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height}
        rx={bar.height / 2} fill={COLOR_TOKENS.border.default} /> : bar.layers.map(layer =>
        <rect key={layer.id} x={bar.x} y={layer.y} width={bar.width} height={layer.height}
          rx={Math.min(bar.width, layer.height) / 2} fill={miniStackedBarColor(layer.axis)} />)}
    </g>)}
  </svg>;
}
