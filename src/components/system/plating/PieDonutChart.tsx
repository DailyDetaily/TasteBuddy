import { COMPONENT_TOKENS, NEUTRAL_TASTE_TOKENS, TASTE_TINTS, type TasteId } from '../../../constants/designTokens';
import { COLOR_TOKENS } from '../../../constants/uiColorTokens';
import { SYMBOL_DONUT, symbolDonutGeometry } from './symbolDonutGeometry';
import { pieDonutData, type PieDonutMode } from './pieDonutData';

export interface PieDonutSegment {
  id: string;
  label: string;
  value: number;
  axis: TasteId;
}

export interface PieDonutChartProps {
  segments: readonly PieDonutSegment[];
  size?: number;
  label?: string;
  mode?: PieDonutMode;
}

export function pieDonutColor(axis: TasteId) {
  return `var(--tb-taste-${axis}-chart-tint-40, ${TASTE_TINTS[axis][40]})`;
}

export const pieDonutRemainderColor = `var(--tb-color-chart-remainder, ${NEUTRAL_TASTE_TOKENS.palette.tint80})`;

export default function PieChart({ segments, size = COMPONENT_TOKENS.miniChart.height, label, mode = 'relative' }: PieDonutChartProps) {
  const data = pieDonutData(segments.map(s => s.value), mode);
  const pieces = symbolDonutGeometry(data.values);
  const description = !data.valid ? '백분율 데이터 오류: 0 이상의 값과 합계 100 이하가 필요합니다' : label ?? (pieces.length
    ? [...segments.filter(s => Number.isFinite(s.value) && s.value > 0).map(s => `${s.label} ${s.value}${mode === 'absolute' ? '%' : ''}`),
      ...(data.remainder > 0 ? [`남은 영역 ${data.remainder}%`] : [])].join(', ')
    : '기록 없음');
  return <div data-name="Pie Chart Container" style={{ width: COMPONENT_TOKENS.miniChart.width, height: size, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
    <svg width={size} height={size} viewBox={`0 0 ${SYMBOL_DONUT.diameter} ${SYMBOL_DONUT.diameter}`}
    role="img" aria-label={description} style={{ display: 'block', flexShrink: 0 }} data-name="Pie Chart">
    {pieces.map(piece => <path key={piece.index} d={piece.path}
      fill={piece.index === segments.length ? pieDonutRemainderColor : pieDonutColor(segments[piece.index].axis)}
      data-remainder={piece.index === segments.length || undefined}
      data-fraction={piece.fraction} />)}
    {!pieces.length && <circle cx="92" cy="92" r="91" fill="none" stroke={COLOR_TOKENS.border.default} strokeWidth="1" />}
    </svg>
  </div>;
}
