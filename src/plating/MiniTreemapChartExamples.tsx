import MiniTreemapChart from '../components/system/plating/MiniTreemapChart';
import { miniBubbleColor, type MiniBubbleItem } from '../components/system/plating/MiniBubbleChart';
import './mini-chart-examples.css';

export const MINI_TREEMAP_ITEMS: MiniBubbleItem[] = [
  { id: 'korean', label: '한식', value: 3, axis: 'bitter' },
  { id: 'western', label: '양식', value: 8, axis: 'sweet' },
  { id: 'chinese', label: '중식', value: 18, axis: 'umami' },
  { id: 'japanese', label: '일식', value: 12, axis: 'salty' },
  { id: 'snack', label: '분식', value: 6, axis: 'sour' },
  { id: 'other', label: '기타', value: 4, axis: 'fat' },
];

export default function MiniTreemapChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniTreemapChart items={MINI_TREEMAP_ITEMS} />;
  return <div className="pl-mini-examples">
    <div className="pl-mini-specimens"><div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>트리맵 · 6개 항목</span>
      <MiniTreemapChart items={MINI_TREEMAP_ITEMS} />
      <small>3 · 8 · 18 · 12 · 6 · 4</small>
    </div></div>
    <div className="pl-donut-legend">{MINI_TREEMAP_ITEMS.map(item => <span key={item.id}>
      <i style={{ background: miniBubbleColor(item.axis) }} />{item.label} {item.value}개
    </span>)}</div>
    <p className="pl-mini-caption">합성 예시 · 둥근 블록의 면적이 값에 비례 · 위치는 의미 없음</p>
  </div>;
}
