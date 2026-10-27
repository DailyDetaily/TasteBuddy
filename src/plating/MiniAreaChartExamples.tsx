import MiniAreaChart from '../components/system/plating/MiniAreaChart';
import { TASTE_IDS, TASTE_TOKENS } from '../constants/designTokens';
import './mini-chart-examples.css';

const values = [1.2, 2.1, 2.4, 4.5];
const entries = [{ id: 'umami', taste: '감칠맛', values }];
export const layeredAreaEntries = [
  { id: 'umami', taste: '감칠맛', values: [4, 6, 7, 10] },
  { id: 'sweet', taste: '단맛', values: [2, 3, 4, 6] },
  { id: 'bitter', taste: '쓴맛', values: [1, 1, 2, 3] },
];
export const comparisonAreaEntries = [
  { id: 'previous', taste: '감칠맛', values: [4, 6, 7, 10] },
  { id: 'current', taste: '감칠맛', values: [2, 3, 4, 6] },
];

export function MiniAreaChartSpecimens({ variant }: { variant?: 'single' | 'layered' | 'comparison' } = {}) {
  return <div className="pl-mini-specimens">
    {(!variant || variant === 'single') && <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>미니 영역 차트</span>
      <MiniAreaChart entries={entries} label="감칠맛 변화 영역 차트: 합성 데이터 예시" />
      <small>132 × 56 · 모서리 보정</small>
    </div>}
    {(!variant || variant === 'layered') && <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>미각 3개 겹침</span>
      <MiniAreaChart entries={layeredAreaEntries} variant="layered" label="합성 예시: 감칠맛·단맛·쓴맛을 같은 척도로 겹친 영역" />
      <small>감칠맛 · 단맛 · 쓴맛 · tint/20</small>
    </div>}
    {(!variant || variant === 'comparison') && <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>같은 미각 비교</span>
      <MiniAreaChart entries={comparisonAreaEntries} variant="comparison" label="합성 예시: 감칠맛 비교. 큰 영역 배경톤, 작은 영역 tint/20" />
      <small>큰 영역 배경톤 · 작은 영역 20</small>
    </div>}
  </div>;
}

export default function MiniAreaChartExamples({ thumbnail = false, state = '기본', variant }: { thumbnail?: boolean; state?: string; variant?: string }) {
  const selected = variant === 'layered' || variant === 'comparison' || variant === 'single' ? variant
    : state === '미각 3개 겹침' ? 'layered' : state === '같은 미각 비교' ? 'comparison' : 'single';
  if (thumbnail) return selected === 'single' ? <MiniAreaChart entries={entries} />
    : <MiniAreaChart entries={selected === 'layered' ? layeredAreaEntries : comparisonAreaEntries} variant={selected} />;
  return <div className="pl-mini-examples">
    <MiniAreaChartSpecimens variant={selected} />
    <div className="pl-mini-line-colors">
      {TASTE_IDS.map(axis => <div key={axis}>
        <span>{TASTE_TOKENS[axis].label}</span>
        <MiniAreaChart entries={[{ id: axis, taste: TASTE_TOKENS[axis].label, values }]}
          label={`${TASTE_TOKENS[axis].label}: 합성 변화 예시`} />
      </div>)}
    </div>
    <p className="pl-mini-caption">합성 예시 · 값 0은 0px, 값 1은 12px이며 1 초과 값을 공통 최대 높이 56px까지 연결합니다. 양끝 R6 · 중간 모서리는 양끝과 비슷하게 둥글게 보정합니다.</p>
  </div>;
}
