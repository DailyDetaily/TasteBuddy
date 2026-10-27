import MiniBubbleChart, { miniBubbleColor } from "../system/plating/MiniBubbleChart";
import { useMemo, useState } from 'react';
import MiniChart from '../system/plating/MiniChart';
import MiniHeatmap, { miniHeatmapColor } from '../system/plating/MiniHeatmap';
import MiniLineChart from '../system/plating/MiniLineChart';
import MiniAreaChart, { miniAreaLayerColor } from '../system/plating/MiniAreaChart';
import { miniAreaLayerGeometry } from '../system/plating/miniAreaGeometry';
import MiniStackedBarChart, { miniStackedBarColor } from '../system/plating/MiniStackedBarChart';
import PieDonutChart, { pieDonutColor, pieDonutRemainderColor } from '../system/plating/PieDonutChart';
import { buildRecordChartData, type RecordChartData } from '../../lib/gastronomy/recordChartData';
import type { Data } from '../../lib/gastronomy/engine';
import { DetailBubbleChart, DetailCalendarChart, DetailCartesianChart, DetailDonutChart, detailAreaWeight } from '../system/DetailCharts';
import { CHART_COMPARISON_TRACK_COLOR, TASTE_TOKENS } from '../../constants/uiColorTokens';

const modes = [ ['heatmap', '달력'], ['bar', '일별 기록'], ['grouped', '이전 7일 비교'], ['line', '최근 4일 흐름'], ['linePair', '두 미각 흐름 비교'],
  ['area', '최근 4일 영역'], ['areaLayered', '미각 기록 겹침'], ['areaComparison', '같은 미각 기록 비교'], ['stacked', '최근 7일 출처'], ['pie', '이번 달 출처 구성'], ['bubble', '이번 달 출처 규모'], ['bubbleIcon', '이번 달 음식 종류'], ['absolute', '이번 달 출처 확인 비율'] ] as const;
export type RecordChartMode = typeof modes[number][0];
type Mode = RecordChartMode;

/** Consumes the same account-scoped repository data as the archive; never loads fixtures. */
export default function RecordChartsPanel({ data, now, loading = false, error, onRetry, variant = 'detail' }: {
  data: Data; now: Date; loading?: boolean; error?: string | null; onRetry?: () => void; variant?: 'mini' | 'detail';
}) {
  const [mode, setMode] = useState<Mode>('heatmap');
  const chart = useMemo(() => buildRecordChartData(data, now), [data, now]);
  const visibleTotal = ['grouped', 'stacked'].includes(mode) ? chart.current.reduce((a, b) => a + b, 0)
    : ['line', 'area'].includes(mode) ? chart.lineValues.reduce((a, b) => a + b, 0) : chart.total;
  const sensoryMode = mode === 'areaLayered' || mode === 'areaComparison' || mode === 'linePair';
  const areaEntries = recordAreaEntries(chart, mode);
  const areaLayers = miniAreaLayerGeometry(areaEntries, mode === 'areaComparison' ? 'comparison' : 'layered');
  const largestArea = areaEntries.reduce((best, entry, index) => detailAreaWeight(entry.values) > detailAreaWeight(areaEntries[best]?.values ?? []) ? index : best, 0);
  const areaTint = (index: number) => variant === 'detail' ? mode === 'areaComparison' && index === largestArea ? 80 : 20 : areaLayers.find(layer => layer.index === index)?.tint ?? 60;
  const sourceMode = ['stacked', 'pie', 'absolute', 'bubble'].includes(mode);
  const period = sensoryMode ? (mode === 'areaComparison' ? '최근 4일 · 직전 4일 비교' : '최근 4일 · 미각별 식사 기록') : ['grouped', 'stacked'].includes(mode) ? '최근 7일 · 오늘 포함'
    : ['line', 'area'].includes(mode) ? '최근 4일 · 오늘 포함' : chart.monthLabel;
  return <section className={variant === 'detail' ? 'tb-taste-detail-panel' : 'mb-5 rounded-[20px] bg-[var(--tb-color-surface-base)] p-4'} aria-label="실제 기록 그래프">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[14px] font-semibold">기록량</h2>
      <select aria-label="기록 그래프 보기" value={mode} onChange={event => setMode(event.target.value as Mode)}
        className="min-h-11 rounded-lg bg-[var(--tb-color-surface-muted)] px-3 text-[12px]">
        {modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    {loading ? <p role="status" className="py-4 text-[12px]">기록을 불러오고 있어요</p> : error ? <div role="alert" className="text-[12px]">
      <p>기록을 모두 확인하지 못했어요. {error}</p>
      {onRetry && <button type="button" onClick={onRetry} className="min-h-11 underline">다시 시도</button>}
    </div> : <>
      <div className={variant === 'detail' ? 'flex flex-col gap-4' : 'my-3 flex flex-wrap items-center justify-between gap-4'}>
        <div><p className="text-[13px] font-medium">{period}</p><p className="text-[12px] text-[var(--tb-color-text-hint)]">{sensoryMode ? '미각을 기록한 식사 수' : `요리 기록 ${visibleTotal}개`}</p></div>
        {variant === 'detail' ? <RecordDetailChartGraphic chart={chart} mode={mode} /> : <RecordChartGraphic chart={chart} mode={mode} />}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--tb-color-text-hint)]">
        {mode === 'heatmap' && [0, 1, 2, 3, 4].map(level => <span key={level} className="inline-flex items-center gap-1"><i className="size-2 rounded-sm" style={{ background: miniHeatmapColor(level) }} />{level === 4 ? '4개 이상' : `${level}개`}</span>)}
        {mode === 'bubbleIcon' && variant === 'mini' && chart.foodKinds.map(kind => <span key={kind.id}>{kind.label} {kind.value}개</span>)}
        {mode === 'grouped' && <span>회색: 직전 7일 · 미각색: 최근 7일</span>}
        {sourceMode && (variant === 'mini' || mode === 'stacked') && chart.series.map(source => <span key={source.id} className="inline-flex items-center gap-1"><i className="size-2 rounded-sm" style={{ background: mode === 'absolute' && source.id === 'unknown' ? pieDonutRemainderColor : mode === 'stacked' ? miniStackedBarColor(source.axis) : mode === 'bubble' ? miniBubbleColor(source.axis) : pieDonutColor(source.axis) }} />{source.label} {mode === 'stacked' ? source.values.reduce((a, b) => a + b, 0) : source.value}개</span>)}
      </div>
      {sensoryMode && <div className="mt-2 text-[11px] text-[var(--tb-color-text-hint)]">
        <div className="flex flex-wrap gap-3">{areaEntries.map((entry, index) => <span key={entry.id} className="inline-flex items-center gap-1">
          <i className="size-2 rounded-sm" style={{ background: mode === 'linePair' ? TASTE_TOKENS[chart.sensorySeries[index].axis].palette.main : miniAreaLayerColor(entry.taste, areaTint(index)) }} />
          {entry.taste}{mode === 'areaComparison' ? (entry.id === 'current' ? ' 최근' : ' 직전') : ''} {entry.values.reduce<number>((sum, value) => sum + (value ?? 0), 0)}회
        </span>)}</div>
        <p className="mt-1">최근 8일 기록 상위 {mode === 'linePair' ? '2개 ' : ''}미각 · 같은 식사의 같은 미각은 한 번만 포함해요. 강도·호감 점수가 아닌 기록 횟수예요. 유효한 감각 기록이 없는 식사 {chart.sensoryUnobservedMeals}회.</p>
        <p className="mt-1">{chart.areaDays[0]}–{chart.areaDays.at(-1)}{mode === 'areaComparison' && ` / 비교 ${chart.areaComparisonDays[0]}–${chart.areaComparisonDays.at(-1)}`}. 미확인 구간은 비워 두며, 겹친 {mode === 'linePair' ? '계열' : '영역'}을 더하지 않아요.</p>
      </div>}
      {mode === 'bubbleIcon' && <p className="mt-2 text-[11px] text-[var(--tb-color-text-hint)]">상위 3개 종류 · 여러 종류로 분류한 기록은 각 종류에 한 번씩 포함돼요. 미분류 {chart.unclassifiedFoodCount}개.</p>}
      <p className="mt-3 text-[11px] text-[var(--tb-color-text-hint)]">확인된 식사일 기준 · 식사 한 번에 요리 기록이 여러 개일 수 있어요.{chart.unknownDateCount > 0 && ` 식사일 미확인 ${chart.unknownDateCount}개 제외.`}{chart.futureCount > 0 && ` 미래 식사일 ${chart.futureCount}개 제외.`}</p>
      {mode === 'heatmap' && <p className="mt-1 text-[11px] text-[var(--tb-color-text-hint)]">뉴트럴 채움은 아직 오지 않은 날짜예요. 확인된 0개와 구분해요.</p>}
    </>}
  </section>;
}

/** The same account-scoped chart payload as the mini renderer; only display scale
 * and interaction change. The 4/7-day/month windows and nulls are preserved. */
export function RecordDetailChartGraphic({ chart, mode }: { chart: RecordChartData; mode: RecordChartMode }) {
  const dateLabel = (date: string) => `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}`;
  const sourceItems = chart.series.map(source => ({ ...source, color: mode === 'absolute' && source.id === 'unknown' ? pieDonutRemainderColor : mode === 'bubble' ? miniBubbleColor(source.axis) : pieDonutColor(source.axis) }));
  if (mode === 'heatmap') return <DetailCalendarChart days={chart.month} startDay={chart.startDay} label={`${chart.monthLabel} 날짜별 요리 기록`} />;
  if (mode === 'bubbleIcon') return chart.foodKinds.length ? <DetailBubbleChart items={chart.foodKinds.map(kind => ({ ...kind, color: miniBubbleColor(kind.axis) }))} content="icon" unit="개" label="이번 달 음식 종류별 요리 기록" /> : <p className="tb-detail-chart-empty">등록된 음식 종류가 없어요</p>;
  if (mode === 'bubble') return <DetailBubbleChart items={sourceItems} unit="개" label="이번 달 음식 출처별 요리 기록" />;
  if (mode === 'pie' || mode === 'absolute') return <DetailDonutChart items={sourceItems} unit="개" label={mode === 'absolute' ? '이번 달 출처 확인 비율 · 출처 미확인 포함' : '이번 달 출처 구성'} />;
  if (mode === 'linePair') {
    const pair = chart.sensorySeries.slice(0, 2);
    if (!pair.length) return <p className="tb-detail-chart-empty">확인된 미각 기록이 없어요</p>;
    return <>
      <DetailCartesianChart key={mode} labels={chart.areaDays.map(dateLabel)}
        series={pair.map(item => ({ id: item.id, label: item.taste, axis: item.axis, values: item.values, color: TASTE_TOKENS[item.axis].palette.main }))}
        kind="line" unit="회" label="두 미각의 기록 흐름" />
      {pair.length < 2 && <p className="tb-detail-chart-note">현재 확인된 미각은 한 가지예요. 두 번째 미각 기록이 모이면 함께 비교할 수 있어요.</p>}
    </>;
  }
  const sensory = mode === 'areaLayered' || mode === 'areaComparison';
  if (sensory && !chart.sensorySeries.length) return <p className="tb-detail-chart-empty">확인된 미각 기록이 없어요</p>;
  const entries = recordAreaEntries(chart, mode);
  const largest = entries.reduce((best, entry, index) => detailAreaWeight(entry.values) > detailAreaWeight(entries[best]?.values ?? []) ? index : best, 0);
  const sensorySeries = entries.map((entry, index) => ({ id: entry.id, label: `${entry.taste}${mode === 'areaComparison' ? entry.id === 'previous' ? ' 직전' : ' 최근' : ''}`, values: entry.values, color: miniAreaLayerColor(entry.taste, mode === 'areaComparison' && index === largest ? 80 : 20) }));
  if (mode === 'areaComparison') sensorySeries.sort((a, b) => (a.id === 'current' ? -1 : 0) - (b.id === 'current' ? -1 : 0));
  const days = mode === 'bar' ? chart.month.map(day => day.date) : mode === 'grouped' || mode === 'stacked' ? chart.currentDays : chart.lineDays;
  const series = sensory ? sensorySeries : mode === 'stacked' ? chart.series.map(source => ({ id: source.id, label: source.label, values: source.values, axis: source.axis, color: miniStackedBarColor(source.axis) }))
    : mode === 'grouped' ? [{ id: 'previous', label: '직전 7일', values: chart.previous, axis: 'umami' as const, comparison: true, color: CHART_COMPARISON_TRACK_COLOR }, { id: 'current', label: '최근 7일', values: chart.current, axis: 'umami' as const, color: TASTE_TOKENS.umami.palette.main }]
    : [{ id: 'records', label: '요리 기록', axis: 'umami' as const, values: mode === 'bar' ? chart.month.map(day => day.count) : chart.lineValues, color: mode === 'area' ? miniAreaLayerColor('감칠맛', 60) : TASTE_TOKENS.umami.palette.main }];
  return <DetailCartesianChart key={mode} labels={(sensory ? chart.areaDays : days).map(dateLabel)} series={series}
    unit={sensory ? '회' : '개'} label={modes.find(([id]) => id === mode)?.[1] ?? '기록 그래프'}
    selectionLabels={mode === 'grouped' ? chart.currentDays.map((day, index) => `${dateLabel(day)} / 직전 ${dateLabel(chart.previousDays[index])}`) : mode === 'areaComparison' ? chart.areaDays.map((day, index) => `${dateLabel(day)} / 직전 ${dateLabel(chart.areaComparisonDays[index])}`) : undefined}
    kind={sensory || mode === 'area' ? 'area' : mode === 'line' ? 'line' : mode === 'stacked' ? 'stacked' : mode === 'grouped' ? 'grouped' : 'bar'}
    initialIndex={mode === 'bar' ? chart.month.filter(day => day.count !== null).length - 1 : undefined} />;
}


export function RecordChartGraphic({ chart, mode }: { chart: RecordChartData; mode: RecordChartMode }) {
  const days = chart.month.map(day => day.count);
  const line = [{ id: 'umami', taste: '감칠맛', values: chart.lineValues }];
  return <>
        {mode === 'heatmap' && <MiniHeatmap values={days} startDay={chart.startDay} />}
        {mode === 'bar' && <MiniChart values={days} label={`${chart.monthLabel} 일별 요리 기록`} />}
        {mode === 'grouped' && <MiniChart values={chart.current} comparisonValues={chart.previous} label="최근 7일과 직전 7일의 일별 요리 기록" />}
        {mode === 'line' && <MiniLineChart entries={line} label={`최근 4일 요리 기록 ${chart.lineValues.join(', ')}개`} />}
        {mode === 'linePair' && (chart.sensorySeries.length
          ? chart.sensorySeries.slice(0, 2).every(item => item.values.every(value => value !== null))
            ? <MiniLineChart compact entries={chart.sensorySeries.slice(0, 2).map(item => ({ id: item.id, taste: item.taste, values: item.values as number[] }))} label="최근 4일 두 미각별 독립 식사 기록" />
            : <span className="text-[12px]">미확인 구간은 상세 그래프에서 확인해요</span>
          : <span className="text-[12px]">확인된 미각 기록이 없어요</span>)}
        {mode === 'area' && (chart.lineValues.some(value => value > 0) ? <MiniAreaChart entries={line} label={`최근 4일 요리 기록 ${chart.lineValues.join(', ')}개`} /> : <span className="text-[12px]">이 기간의 기록이 없어요</span>)}
        {(mode === 'areaLayered' || mode === 'areaComparison') && (chart.sensorySeries.length
          ? <MiniAreaChart entries={recordAreaEntries(chart, mode)} variant={mode === 'areaComparison' ? 'comparison' : 'layered'}
              label={recordAreaEntries(chart, mode).map(entry => `${entry.taste} ${mode === 'areaComparison' && entry.id === 'previous' ? '직전 4일' : '최근 4일'} 미각을 기록한 식사 ${entry.values.map(value => value === null ? '미확인' : `${value}회`).join(', ')}`).join('. ')} />
          : <span className="text-[12px]">확인된 미각 기록이 없어요</span>)}
        {mode === 'stacked' && <MiniStackedBarChart series={chart.series} label="최근 7일 음식 출처별 요리 기록" />}
        {mode === 'bubbleIcon' && (chart.foodKinds.length ? <MiniBubbleChart items={chart.foodKinds} content="icon" /> : <span className="text-[12px]">등록된 음식 종류가 없어요</span>)}
        {mode === 'bubble' && <MiniBubbleChart items={chart.series} />}
        {mode === 'pie' && <PieDonutChart segments={chart.series} label={chart.series.map(s => `${s.label} ${s.value}개`).join(', ')} />}
        {mode === 'absolute' && (chart.total ? <PieDonutChart segments={chart.absolute} mode="absolute" label={`이번 달 ${chart.total}개 중 ${chart.series[2].value}개는 출처 미확인. ${chart.absolute.map(s => `${s.label} ${s.value.toFixed(1)}%`).join(', ')}`} /> : <span className="text-[12px]">계산할 기록이 없어요</span>)}
  </>;
}

function recordAreaEntries(chart: RecordChartData, mode: Mode) {
  if (mode === 'areaComparison') {
    const first = chart.sensorySeries[0];
    return first ? [
      { id: 'previous', taste: first.taste, values: first.comparisonValues },
      { id: 'current', taste: first.taste, values: first.values },
    ] : [];
  }
  return (mode === 'linePair' ? chart.sensorySeries.slice(0, 2) : chart.sensorySeries).map(({ id, taste, values }) => ({ id, taste, values }));
}
