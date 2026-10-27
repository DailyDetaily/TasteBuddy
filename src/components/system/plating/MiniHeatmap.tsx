import { COMPONENT_TOKENS, NEUTRAL_TASTE_TOKENS, TASTE_TINTS, TASTE_MAIN_COLORS, type TasteId } from '../../../constants/designTokens';
import { miniHeatmapGeometry } from './miniHeatmapGeometry';

export interface MiniHeatmapProps {
  /** Daily counts in chronological order. Zero is no records; null is unavailable. */
  values: readonly (number | null)[];
  axis?: TasteId;
  /** Weekday of the first value: Monday = 0, Sunday = 6. */
  startDay?: number;
  label?: string;
}

export function miniHeatmapColor(level: number | null, axis: TasteId = 'umami') {
  if (level === null) return `var(--tb-color-heatmap-neutral, ${NEUTRAL_TASTE_TOKENS.palette.tint80})`;
  if (level >= 4) return `var(--tb-taste-${axis}-heatmap-4, ${TASTE_MAIN_COLORS[axis]})`;
  const step = [80, 60, 40, 20][level] as 80 | 60 | 40 | 20;
  return `var(--tb-taste-${axis}-heatmap-${level}, ${TASTE_TINTS[axis][step]})`;
}

export default function MiniHeatmap({ values, axis = 'umami', startDay = 0, label }: MiniHeatmapProps) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const cells = miniHeatmapGeometry(values, startDay);
  const total = cells.reduce((sum, cell) => sum + (cell.value ?? 0), 0);
  const missing = cells.filter(cell => !cell.padding && cell.level === null).length;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    style={{ display: 'block', width, minWidth: width, maxWidth: width, height, flexShrink: 0 }}
    role="img" aria-label={label ?? (cells.length ? `${values.length}일 기록 히트맵. 총 ${total}개, 미확인 ${missing}일. 왼쪽에서 오른쪽 월요일부터 일요일, 위에서 아래 주 순서.` : '기록 데이터 없음')}
    data-name="Mini Heatmap">
    {cells.map(cell => <rect key={cell.index} x={cell.x} y={cell.y} width={cell.width} height={cell.height}
      rx={Math.min(2, cell.width / 2, cell.height / 2)} data-level={cell.padding ? 'padding' : cell.level ?? 'missing'}
      aria-hidden={cell.padding || undefined}
      fill={miniHeatmapColor(cell.padding ? null : cell.level, axis)}>
      {!cell.padding && <title>{`${cell.index + 1}일째: ${cell.value === null ? '미확인' : `${cell.value}개`}`}</title>}
    </rect>)}
  </svg>;
}
