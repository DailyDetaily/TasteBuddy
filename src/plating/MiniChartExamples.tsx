import { MiniHeatmapSpecimens } from "./MiniHeatmapExamples";
import { PieDonutChartSpecimens } from './PieDonutChartExamples';
import { MiniStackedBarChartSpecimens } from './MiniStackedBarChartExamples';
import { MiniAreaChartSpecimens } from './MiniAreaChartExamples';
import { ChevronRight } from 'lucide-react';
import MiniChart from '../components/system/plating/MiniChart';
import { MiniLineChartSpecimens } from './MiniLineChartExamples';
import InsightSummaryCard from '../components/system/InsightSummaryCard';
import { COLOR_TOKENS, COMPONENT_TOKENS, TASTE_TOKENS } from '../constants/designTokens';
import './mini-chart-examples.css';

const monthly = [0, 1, 2, 3, 2, 4, 3, 5, 4, 2, 0, 1, 3, 5, 4, 6, 5, 3, 4, 6, 7, 5, 4, 6, 8, 6, 7, 9, 8, 10, 9];
const basic = monthly.slice(0, 7);
const halfMonth = monthly.slice(0, 15);

export default function MiniChartExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniChart values={basic} />;
  const { width, examplePadding } = COMPONENT_TOKENS.miniChart;
  return <div className="pl-mini-examples">
    <div className="pl-mini-specimens">
      <div className="pl-mini-specimen" style={{ width: width + examplePadding * 2, padding: examplePadding }}>
        <span>일주일</span>
        <MiniChart values={basic} label="2026년 8월 1일~7일 기록. 합성 데이터 예시." />
        <small>8월 1–7일 · 막대 12 / 간격 8</small>
      </div>
      <div className="pl-mini-specimen" style={{ width: width + examplePadding * 2, padding: examplePadding }}>
        <span>보름</span>
        <MiniChart values={halfMonth} label="2026년 8월 1일~15일 기록. 합성 데이터 예시." />
        <small>8월 1–15일 · 132 × 56</small>
      </div>
      <div className="pl-mini-specimen" style={{ width: width + examplePadding * 2, padding: examplePadding }}>
        <span>한달</span>
        <MiniChart values={monthly} month={{ year: 2026, month: 8 }}
          label="2026년 8월 1일부터 31일까지의 날짜별 기록. 합성 예시." />
        <small>8월 1–31일 · 132 × 56</small>
      </div>
    </div>
    <div className="pl-mini-specimens pl-mini-line-section">
      <div className="pl-mini-specimen" style={{ width: width + examplePadding * 2, padding: examplePadding }}>
        <span>미니 그래프 · 그룹</span>
        <MiniChart values={[1, 4, 3, 6]} comparisonValues={[0, 2, 4, 3]}
          label="합성 비교 예시. 이전 0, 2, 4, 3. 현재 1, 4, 3, 6." />
        <small>132 × 56</small>
      </div>
    </div>
    <p className="pl-mini-caption" aria-hidden="true">
      그룹형: <span style={{ color: COLOR_TOKENS.text.body }}>● 이전</span> · <span style={{ color: TASTE_TOKENS.umami.palette.main }}>● 현재</span>
    </p>
    <div className="pl-mini-line-section"><MiniLineChartSpecimens /></div>
    <div className="pl-mini-line-section"><MiniAreaChartSpecimens /></div>
    <div className="pl-mini-line-section"><PieDonutChartSpecimens /></div>
    <div className="pl-mini-line-section"><MiniStackedBarChartSpecimens /></div>
    <div className="pl-mini-line-section"><MiniHeatmapSpecimens /></div>
    <div className="pl-mini-card-examples">
      {([
        { title: '기록한 식사', value: '12번의 식사', detail: '디시 기록 18개', period: '최근 1개월', axis: 'umami', category: 'experience' },
        { title: '음식 전체 평가', value: '18개의 음식 평가', detail: '직접 남긴 음식 전체 평가', period: '전체 기간', axis: 'sour', category: 'preference' },
      ] as const).map(({ title, value, detail, period, axis, category }) => <div key={title}>
        <p className="pl-mini-card-label">{title}</p>
        <InsightSummaryCard category={category} title={title} iconColor={TASTE_TOKENS[axis].palette.main}
          legend={[{ label: title === '음식 전체 평가' ? '음식 전체 평가 수' : '일별 요리 기록 수', color: TASTE_TOKENS[axis].palette.main }]}
          action={<span className="pl-mini-card-action">자세히보기<ChevronRight size={14} /></span>}>
          <div className="pl-mini-card-body">
            <div><strong>{value}</strong><p>{detail}<br />{period}</p></div>
            <MiniChart values={basic} axis={axis} />
          </div>
        </InsightSummaryCard>
      </div>)}
    </div>
    <p className="pl-mini-caption">합성 예시 · 0은 막대 두께의 절반 높이, 1은 원형, 2 이상은 값에 따라 길어지는 막대입니다.</p>
  </div>;
}
