import { COMPONENT_TOKENS } from '../../../constants/designTokens';
import { CHART_ON_BRIGHT_FILL_COLOR } from '../../../constants/uiColorTokens';
import { miniBubbleColor, type MiniBubbleItem } from './MiniBubbleChart';
import { miniTreemapGeometry } from './miniTreemapGeometry';

export interface MiniTreemapChartProps {
  items: readonly MiniBubbleItem[];
  label?: string;
}

export function miniTreemapLabelFontSize(value: number, width: number, height: number) {
  return Math.max(0, Math.min(10, height * 0.6, (width - 4) / (String(value).length * 0.62)));
}

export default function MiniTreemapChart({ items, label }: MiniTreemapChartProps) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const cells = miniTreemapGeometry(items.map(item => item.value));
  const values = items.map(item => `${item.label} ${item.value != null && Number.isFinite(item.value) && item.value >= 0 ? item.value : '미확인'}`).join(', ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
    aria-label={label ?? (items.length ? `트리맵, 도형 면적으로 크기 비교. ${values}. 위치는 수치를 의미하지 않습니다.` : '비교할 데이터 없음')}
    style={{ display: 'block', width, minWidth: width, maxWidth: width, height, flexShrink: 0 }} data-name="Mini Treemap Chart">
    {cells.map(cell => <g key={items[cell.index].id} data-value={cell.value}>
      <rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} rx={cell.radius} fill={miniBubbleColor(items[cell.index].axis)}>
        <title>{`${items[cell.index].label}: ${cell.value}`}</title>
      </rect>
      <text x={cell.x + cell.width / 2} y={cell.y + cell.height / 2} textAnchor="middle" dominantBaseline="central" aria-hidden="true"
        fontSize={miniTreemapLabelFontSize(cell.value, cell.width, cell.height)} fontWeight={500} fill={CHART_ON_BRIGHT_FILL_COLOR}
        style={{ fontFamily: 'Pretendard, sans-serif', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}>{cell.value}</text>
    </g>)}
  </svg>;
}
