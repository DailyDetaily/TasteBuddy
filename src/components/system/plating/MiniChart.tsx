import type { CSSProperties } from 'react';
import { COMPONENT_TOKENS, type TasteId } from '../../../constants/designTokens';
import { CHART_COMPARISON_TRACK_COLOR, COLOR_TOKENS, TASTE_TOKENS } from '../../../constants/uiColorTokens';
import { miniChartGeometry, miniChartMonthValues } from './miniChartGeometry';

export interface MiniChartProps {
  values: readonly (number | null)[];
  /** Aligned by index with values. When supplied, render previous/current pairs. */
  comparisonValues?: readonly (number | null)[];
  axis?: TasteId;
  /** Calendar month (1–12). values[0] is day 1; omitted days stay empty. */
  month?: { year: number; month: number };
  /** Omit when the containing card already provides the data summary. */
  label?: string;
  highlightsEachValue?: boolean;
}

/** Data count changes bar density; the chart always occupies 132 × 56. */
export default function MiniChart({ values, comparisonValues, month, axis = 'umami', label, highlightsEachValue = false }: MiniChartProps) {
  const displayedValues = month ? miniChartMonthValues(values, month.year, month.month) : values;
  const displayedComparison = month && comparisonValues !== undefined
    ? miniChartMonthValues(comparisonValues, month.year, month.month) : comparisonValues;
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const color = TASTE_TOKENS[axis].palette.main;
  const trackColor = TASTE_TOKENS[axis].palette.chartTrack;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    style={{ display: 'block', flexShrink: 0, '--tb-mini-chart-track': trackColor } as CSSProperties} role={label ? 'img' : undefined}
    aria-label={label} aria-hidden={label ? undefined : true}>
    {miniChartGeometry(displayedValues, displayedComparison).map((bar, index) => bar.height > 0 && <g key={index}>
      <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height}
        rx={Math.min(bar.width, bar.height) / 2} fill={bar.comparison ? CHART_COMPARISON_TRACK_COLOR : 'var(--tb-mini-chart-track)'} />
      {(bar.endpoint || (highlightsEachValue && (bar.comparison ? displayedComparison?.[bar.index] : displayedValues[bar.index])! > 0)) && <circle cx={bar.x + bar.width / 2}
        cy={bar.y + Math.min(bar.width, bar.height) / 2}
        r={Math.min(bar.width, bar.height) / 2} fill={bar.comparison ? COLOR_TOKENS.text.body : color} />}
    </g>)}
  </svg>;
}
