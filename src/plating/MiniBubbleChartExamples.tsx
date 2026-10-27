import MiniBubbleChart, { miniBubbleColor, type MiniBubbleItem } from '../components/system/plating/MiniBubbleChart';
import './mini-chart-examples.css';

export const MINI_BUBBLE_EXAMPLES: { title: string; items: MiniBubbleItem[] }[] = [
  { title: '2개 항목', items: [
    { id: 'home', label: '집밥', value: 9, axis: 'umami' },
    { id: 'out', label: '외식', value: 16, axis: 'sweet' },
  ] },
  { title: '3개 항목', items: [
    { id: 'korean', label: '한식', value: 3, axis: 'bitter' },
    { id: 'western', label: '양식', value: 8, axis: 'sweet' },
    { id: 'chinese', label: '중식', value: 18, axis: 'umami' },
  ] },
];

export const MINI_BUBBLE_ICON_EXAMPLE: MiniBubbleItem[] = [
  { id: 'seafood', label: '해산물', dishKindId: 'seafood', value: 9, axis: 'salty' },
  { id: 'meat', label: '육류', dishKindId: 'meat', value: 16, axis: 'umami' },
  { id: 'noodle', label: '면류', dishKindId: 'noodle', value: 6, axis: 'sweet' },
];

export default function MiniBubbleChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniBubbleChart items={MINI_BUBBLE_EXAMPLES[0].items} />;
  return <div className="pl-mini-examples">
    <div className="pl-mini-specimens">
      {MINI_BUBBLE_EXAMPLES.map(example => <div key={example.title} className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
        <span>버블 차트 · {example.title}</span>
        <MiniBubbleChart items={example.items} />
        <small>{example.items.map(item => item.value).join(' · ')}</small>
      </div>)}
      <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
        <span>버블 차트 · 음식 아이콘</span>
        <MiniBubbleChart items={MINI_BUBBLE_ICON_EXAMPLE} content="icon" />
        <small>음식 종류 · 면적으로 비교</small>
      </div>
    </div>
    <div className="pl-donut-legend">{MINI_BUBBLE_EXAMPLES[0].items.map(item => <span key={item.id}>
      <i style={{ background: miniBubbleColor(item.axis) }} />{item.label} {item.value}회
    </span>)}</div>
    <div className="pl-donut-legend">{MINI_BUBBLE_ICON_EXAMPLE.map(item => <span key={item.id}><i style={{ background: miniBubbleColor(item.axis) }} />{item.label} {item.value}개</span>)}</div>
    <p className="pl-mini-caption">합성 예시 · 원의 면적이 값에 비례 · 위치는 의미 없음 · 각 그래프 안에서 크기 비교</p>
  </div>;
}
