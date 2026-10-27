import PieDonutChart, { pieDonutColor, type PieDonutSegment } from '../components/system/plating/PieDonutChart';
import './mini-chart-examples.css';

const composition: PieDonutSegment[] = [
  { id: 'home', label: '집밥', value: 18, axis: 'umami' },
  { id: 'dining', label: '외식', value: 12, axis: 'sweet' },
  { id: 'delivery', label: '배달', value: 6, axis: 'bitter' },
];
const absolute: PieDonutSegment[] = composition.map((segment, index) => ({ ...segment, value: [10, 30, 20][index] }));

export function PieDonutChartSpecimens() {
  return <div className="pl-mini-specimens">
    <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>파이 차트 · 기본</span>
      <PieDonutChart segments={composition} label="합성 기록: 집밥 50%, 외식 33.3%, 배달 16.7%" />
      <small>50% · 33.3% · 16.7%</small>
    </div>
    <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>파이 차트 · 절대값</span>
      <PieDonutChart segments={absolute} mode="absolute" />
      <small>10% · 30% · 20%<br />남은 영역 40%</small>
    </div>
  </div>;
}

export default function PieDonutChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <PieDonutChart segments={composition} />;
  return <div className="pl-mini-examples">
    <PieDonutChartSpecimens />
    <div className="pl-donut-legend">{composition.map(s => <span key={s.id}>
      <i style={{ background: pieDonutColor(s.axis) }} />{s.label} {s.value}회
    </span>)}</div>
    <p className="pl-mini-caption">합성 예시 · 132 × 56 컨테이너 · 56 × 56 파이 우측 정렬</p>
  </div>;
}
