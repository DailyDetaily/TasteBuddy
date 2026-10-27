import MiniStackedBarChart, { miniStackedBarColor, type MiniStackedBarSeries } from '../components/system/plating/MiniStackedBarChart';
import InsightSummaryCard from '../components/system/InsightSummaryCard';
import { TASTE_TOKENS } from '../constants/uiColorTokens';
import './mini-chart-examples.css';

export const stackedBarExampleSeries: MiniStackedBarSeries[] = [
  { id: 'home', label: '집밥', axis: 'umami', values: [2, 3, 2, 4, 3, 4, 5, 2, 3, 4, 2, 3, 4, 5, 4] },
  { id: 'out', label: '외식', axis: 'sweet', values: [1, 2, 2, 1, 3, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2] },
  { id: 'delivery', label: '배달', axis: 'bitter', values: [1, 0, 1, 2, 1, 1, 2, 0, 1, 2, 1, 2, 1, 1, 2] },
];
const week = stackedBarExampleSeries.map(series => ({ ...series, values: series.values.slice(0, 7) }));

export function MiniStackedBarChartSpecimens() {
  return <div className="pl-mini-specimens">
    {([{ name: '누적 바 · 일주일', series: week }, { name: '누적 바 · 보름', series: stackedBarExampleSeries }]).map(example =>
      <div className="pl-mini-specimen" key={example.name} style={{ width: 164, padding: 16 }}>
        <span>{example.name}</span>
        <MiniStackedBarChart series={example.series} label={`${example.name}. 합성 기록의 집밥·외식·배달 구성과 총량.`} />
        <small>132 × 56 · 총량 + 구성</small>
      </div>)}
  </div>;
}

export default function MiniStackedBarChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniStackedBarChart series={week} />;
  const totals = week.map(series => ({ ...series, total: series.values.reduce<number>((sum, value) => sum + (value ?? 0), 0) }));
  return <div className="pl-mini-examples">
    <MiniStackedBarChartSpecimens />
    <div className="pl-donut-legend">{totals.map(series => <span key={series.id}>
      <i style={{ background: miniStackedBarColor(series.axis) }} />{series.label} {series.total}회
    </span>)}</div>
    <div className="pl-mini-card-examples">
      <InsightSummaryCard category="experience" title="식사 기록 구성" iconColor={TASTE_TOKENS[week[0].axis ?? 'umami'].palette.main} legend={totals.map(series => ({ id: series.id, label: series.label, color: miniStackedBarColor(series.axis) }))}>
        <div className="pl-mini-card-body">
          <div><strong>{totals.reduce((sum, series) => sum + series.total, 0)}개의 기록</strong><p>최근 7일 · 집밥·외식·배달</p></div>
          <MiniStackedBarChart series={week} />
        </div>
      </InsightSummaryCard>
    </div>
    <p className="pl-mini-caption">합성 예시 · 같은 하단에서 시작하는 캡슐 바를 긴 순서대로 뒤부터 겹칩니다. 색상은 차트용 tint/20 토큰입니다.</p>
  </div>;
}
