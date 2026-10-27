import { MiniAreaChartSpecimens } from './MiniAreaChartExamples';
import MiniLineChart from '../components/system/plating/MiniLineChart';
import TasteInsightSummaryCard from '../components/system/TasteInsightSummaryCard';
import { TASTE_IDS, TASTE_TOKENS } from '../constants/designTokens';
import './mini-chart-examples.css';

const values = [1.2, 2.1, 2.4, 4.5];
const entries = [{ id: 'umami', taste: '감칠맛', values }];
const pairedEntries = [...entries, { id: 'bitter', taste: '쓴맛', values: [0.8, -0.6, -1.4, -2.8] }];

export function MiniLineChartSpecimens() {
  return <div className="pl-mini-specimens">
    <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>미니 라인 그래프</span>
      <MiniLineChart entries={entries} label="감칠맛 변화 그래프: 합성 데이터 예시" />
      <small>132 × 56 · 라인 2</small>
    </div>
    <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>상승 · 하강</span>
      <MiniLineChart entries={pairedEntries} compact
        label="합성 미각 변화: 감칠맛 1.2, 2.1, 2.4, 4.5 상승. 쓴맛 0.8, -0.6, -1.4, -2.8 하강." />
      <small>132 × 56 · 라인 2</small>
    </div>
  </div>;
}

export default function MiniLineChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniLineChart entries={entries} />;
  return <div className="pl-mini-examples">
    <MiniLineChartSpecimens />
    <div className="pl-mini-line-section"><MiniAreaChartSpecimens /></div>
    <div className="pl-mini-line-colors">
      {TASTE_IDS.map(axis => <div key={axis}>
        <span>{TASTE_TOKENS[axis].label}</span>
        <MiniLineChart entries={[{ id: axis, taste: TASTE_TOKENS[axis].label, values }]}
          label={`${TASTE_TOKENS[axis].label}: 합성 변화 예시`} />
      </div>)}
    </div>
    <div className="pl-mini-card-examples">
      <TasteInsightSummaryCard sectionLabel="미각 변화" title="최근 미각 변화" keywords={[]}
        onClick={() => {}} details={[
          { detailLabel: '감칠맛', parentTaste: '감칠맛', history: ['+1.2%', '+2.1%', '+2.4%'], change: '+4.5%', trend: 'increase' },
          { detailLabel: '쓴맛', parentTaste: '쓴맛', history: ['+0.8%', '-0.6%', '-1.4%'], change: '-2.8%', trend: 'decrease' },
        ]} />
    </div>
    <p className="pl-mini-caption">합성 예시 · 미각 변화 카드의 기존 TasteLineChart를 그대로 사용합니다.</p>
  </div>;
}
