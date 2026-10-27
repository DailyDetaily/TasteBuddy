import InsightSummaryCard from '../components/system/InsightSummaryCard';
import CardDetailLabel from '../components/system/CardDetailLabel';
import MiniChart from '../components/system/plating/MiniChart';
import MiniTreemapChart from '../components/system/plating/MiniTreemapChart';
import MiniStackedBarChart, { miniStackedBarColor } from '../components/system/plating/MiniStackedBarChart';
import { COLOR_TOKENS, TASTE_TOKENS } from '../constants/uiColorTokens';
import { MINI_TREEMAP_ITEMS } from './MiniTreemapChartExamples';
import { stackedBarExampleSeries } from './MiniStackedBarChartExamples';
import './mini-chart-examples.css';

const week = [0, 1, 2, 3, 2, 4, 3];
const stacked = stackedBarExampleSeries.map(series => ({ ...series, values: series.values.slice(0, 7) }));

export default function SummaryCardExamples() {
  return <div>
    <p className="pl-mini-caption">합성 예시 · 구분선 0.5px · 위아래 12px · 항목 간 8px · 점–텍스트 4px</p>
    {(['light', 'dark'] as const).map(mode => <section key={mode} data-tb-theme={mode} aria-label={`${mode} 요약 카드 예시`}
      style={{ background: COLOR_TOKENS.background.page, color: COLOR_TOKENS.text.primary, padding: 16, borderRadius: 20, marginTop: 16 }}>
      <h3 style={{ color: 'var(--tb-color-text-primary)', margin: '0 0 12px', fontSize: 12 }}>{mode === 'light' ? 'Light' : 'Dark'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
        <InsightSummaryCard category="experience" title="기록 추이" iconColor={TASTE_TOKENS.umami.palette.main} action={<CardDetailLabel />}
          legend={[{ label: '일별 요리 기록 수', color: TASTE_TOKENS.umami.palette.main }]}>
          <div className="pl-mini-card-body"><div><strong>{week.reduce((a, b) => a + b, 0)}개 기록</strong><p>기록한 날 6일<br />7일 표본</p></div><MiniChart values={week} /></div>
        </InsightSummaryCard>
        <InsightSummaryCard category="experience" title="출처별 기록" iconColor={TASTE_TOKENS[stacked[0].axis ?? 'umami'].palette.main} action={<CardDetailLabel />}
          legend={stacked.map(series => ({ id: series.id, label: series.label, color: miniStackedBarColor(series.axis) }))}>
          <div className="pl-mini-card-body"><div><strong>{stacked.flatMap(series => series.values).reduce<number>((sum, value) => sum + (value ?? 0), 0)}개 기록</strong><p>출처별 요리 기록<br />7일 합성 표본</p></div><MiniStackedBarChart series={stacked} /></div>
        </InsightSummaryCard>
        <InsightSummaryCard category="experience" title="종류 구성" iconColor={TASTE_TOKENS.umami.palette.main} action={<CardDetailLabel />}
          legend={MINI_TREEMAP_ITEMS.map(item => ({ id: item.id, label: item.label, color: TASTE_TOKENS[item.axis ?? 'umami'].palette.main }))}>
          <div className="pl-mini-card-body"><div><strong>{MINI_TREEMAP_ITEMS.length}가지 종류</strong><p>요리 기록 {MINI_TREEMAP_ITEMS.reduce((sum, item) => sum + (item.value ?? 0), 0)}개<br />중복 없는 분류 표본</p></div><MiniTreemapChart items={MINI_TREEMAP_ITEMS} /></div>
        </InsightSummaryCard>
      </div>
    </section>)}
    <p className="pl-mini-caption">범례가 없으면 구분선과 범례 영역이 함께 생략됩니다. 항목은 그래프의 원본 계열에서 가져오며 좁은 폭에서는 다음 줄로 이어집니다.</p>
  </div>;
}
