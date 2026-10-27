import TasteLineChart from '../TasteLineChart';
import { COMPONENT_TOKENS, TASTE_IDS, TASTE_TINTS, TASTE_TOKENS } from '../../../constants/designTokens';
import type { MiniLineChartProps } from './MiniLineChart';
import { miniAreaLayerGeometry, type MiniAreaLayerEntry } from './miniAreaGeometry';
import { MINI_CHART_MAIN_COLORS, MINI_CHART_TINT20_COLORS } from '../../../constants/uiColorTokens';

type LayeredAreaProps = { entries: readonly MiniAreaLayerEntry[]; label?: string };
export type MiniAreaChartProps = (Omit<MiniLineChartProps, 'compact'> & { variant?: 'single' }) |
  (LayeredAreaProps & { variant: 'layered' }) | (LayeredAreaProps & { variant: 'comparison' });

export function miniAreaLayerColor(taste: string, tint: 0 | 20 | 40 | 60 | 80 = 60) {
  const axis = TASTE_IDS.find(id => TASTE_TOKENS[id].label === taste) ?? 'sweet';
  if (tint === 0) return MINI_CHART_MAIN_COLORS[axis];
  if (tint === 20) return MINI_CHART_TINT20_COLORS[axis];
  if (tint === 80) return `var(--tb-taste-${axis}-chart-track, ${TASTE_TINTS[axis][80]})`;
  return `var(--tb-taste-${axis}-chart-tint-${tint}, ${TASTE_TINTS[axis][tint]})`;
}

/** Opaque tint/60 area with R6 outer corners and shared optical rounding at interior bends. */
export default function MiniAreaChart(props: MiniAreaChartProps) {
  if (props.variant === 'layered' || props.variant === 'comparison') {
    const { entries, variant, label } = props;
    const { width, height } = COMPONENT_TOKENS.miniChart;
    const layers = miniAreaLayerGeometry(entries, variant);
    const summary = entries.map(entry => `${entry.taste}: ${entry.values.map(value => value !== null && Number.isFinite(value) && value >= 0 ? value : '미확인').join(', ')}`).join('. ');
    return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }} data-name="Mini Area Chart" data-variant={variant}
      role="img" aria-label={label ?? `같은 척도의 겹친 영역. ${summary}`}>
      {layers.map(layer => <g key={layer.id} data-series={layer.id} data-tint={layer.tint}>
        {layer.paths.map((path, index) => <path key={index} d={path} fill={miniAreaLayerColor(entries[layer.index].taste, layer.tint)} />)}
      </g>)}
    </svg>;
  }
  const { entries, label } = props;
  return <div style={{ width: COMPONENT_TOKENS.miniChart.width, height: COMPONENT_TOKENS.miniChart.height, display: 'flex', alignItems: 'center', flexShrink: 0 }}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <TasteLineChart plotWidth={COMPONENT_TOKENS.miniChart.width} plotHeight={COMPONENT_TOKENS.miniChart.height} entries={entries} area />
  </div>;
}
