import { CircleDot } from "lucide-react";
import DishKindIcon from "../DishKindIcon";
import { DISH_KIND_ICON_NODES } from "../../../constants/dishKindIcons";
import { COMPONENT_TOKENS, TASTE_TINTS, type TasteId } from '../../../constants/designTokens';
import { CHART_ON_BRIGHT_FILL_COLOR } from '../../../constants/uiColorTokens';
import { miniBubbleGeometry } from './miniBubbleGeometry';

export interface MiniBubbleItem {
  id: string;
  label: string;
  value: number | null;
  axis: TasteId;
  dishKindId?: string;
}

export interface MiniBubbleChartProps {
  items: readonly MiniBubbleItem[];
  label?: string;
  content?: 'value' | 'icon';
}

export function miniBubbleColor(axis: TasteId) {
  return `var(--tb-taste-${axis}-chart-tint-40, ${TASTE_TINTS[axis][40]})`;
}

export function miniBubbleLabelFontSize(value: number, radius: number) {
  const diameter = radius * 2;
  return Math.max(0, Math.min(10, diameter * 0.72, (diameter - 2) / (String(value).length * 0.62)));
}

export default function MiniBubbleChart({ items, label, content = 'value' }: MiniBubbleChartProps) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const circles = miniBubbleGeometry(items.map(item => item.value));
  const values = items.map(item => `${item.label} ${item.value != null && Number.isFinite(item.value) && item.value >= 0 ? item.value : '미확인'}`).join(', ');
  const description = label ?? (items.length
    ? `원의 면적으로 크기 비교. ${values}. 위치는 수치를 의미하지 않습니다.${circles.length ? '' : ' 표시할 양수 값이 없습니다.'}`
    : '비교할 데이터 없음');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    style={{ display: 'block', width, minWidth: width, maxWidth: width, height, flexShrink: 0 }}
    role="img" aria-label={description} data-name="Mini Bubble Chart" data-content={content}>
    {circles.map(circle => <g key={items[circle.index].id} data-value={circle.value}>
      <circle cx={circle.cx} cy={circle.cy} r={circle.radius} fill={miniBubbleColor(items[circle.index].axis)}>
        <title>{`${items[circle.index].label}: ${circle.value}`}</title>
      </circle>
      {content === 'icon' ? <g
        transform={`translate(${circle.cx - Math.min(16, circle.radius * 1.2) / 2}, ${circle.cy - Math.min(16, circle.radius * 1.2) / 2})`}
        style={{ color: CHART_ON_BRIGHT_FILL_COLOR }} aria-hidden="true" data-dish-kind={items[circle.index].dishKindId ?? 'unknown'}>
        {items[circle.index].dishKindId && Object.hasOwn(DISH_KIND_ICON_NODES, items[circle.index].dishKindId!)
          ? <DishKindIcon id={items[circle.index].dishKindId!} size={Math.min(16, circle.radius * 1.2)} />
          : <CircleDot size={Math.min(16, circle.radius * 1.2)} strokeWidth={2} />}
      </g> : <text x={circle.cx} y={circle.cy} textAnchor="middle" dominantBaseline="central" aria-hidden="true"
        fill={CHART_ON_BRIGHT_FILL_COLOR} fontSize={miniBubbleLabelFontSize(circle.value, circle.radius)} fontWeight={500}
        style={{ fontFamily: 'Pretendard, sans-serif', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}>
        {circle.value}
      </text>}
    </g>)}
  </svg>;
}
