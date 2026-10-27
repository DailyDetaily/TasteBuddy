import { useId, useState, type ReactNode } from 'react';
import type { CurveFactory } from 'd3-shape';
import { Menu as MenuIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopAppBar from '../components/TopAppBar';
import { DetailValueGroup } from '../components/gastronomy/TasteDataPage';
import '../components/gastronomy/taste-detail.css';
import { ICON_TOKENS, TASTE_IDS, type TasteId } from '../constants/designTokens';
import { TASTE_TOKENS } from '../constants/uiColorTokens';
import { getTasteChartLineStart, getTasteChartLineEnd, getTasteChartNodeStart, getTasteLineChartTrack } from '../constants/tasteColors';
import type { LinePathPoint } from '../components/system/roundedLinePath';
import { dataAlignedLineCubicCommands } from '../components/system/dataAlignedLinePath';
import { tasteChangeLabel } from '../lib/tastePerception.mjs';
import PeriodPicker, { type TasteDetailPeriod } from '../components/system/plating/PeriodPicker';
import { tasteChangeBounds } from '../lib/tasteChangePeriod.mjs';

interface TasteChangePageProps {
  children: ReactNode;
  onBack: () => void;
  onOpenMenu?: () => void;
  topSlot?: ReactNode;
}

export interface TasteChangePoint {
  id: string; date: number; start: number; value: number; label: string; count: number;
  evidenceIDs: string[]; experienceIDs: string[];
  sources?: { id: string; foodName: string; restaurantName: string; note: string; selectedLabels: string[] }[];
}
export interface TasteChangeSeries {
  id: string; axis: TasteId; source: string; condition: string; maximum: number;
  points: TasteChangePoint[]; details: string[];
}

/** The mini's R path is inversely aligned to actual data; both strokes share it. */
const roundedMiniCurve: CurveFactory = context => {
  let points: LinePathPoint[] = [];
  return {
    areaStart() {}, areaEnd() {},
    lineStart() { points = []; },
    point(x: number, y: number) { points.push({ x, y }); },
    lineEnd() {
      if (!points.length) return;
      context.moveTo(points[0].x, points[0].y);
      for (const command of dataAlignedLineCubicCommands(points, 12)) {
        if (command.kind === 'line') context.lineTo(command.to.x, command.to.y);
        else context.bezierCurveTo(command.control1.x, command.control1.y, command.control2.x, command.control2.y, command.to.x, command.to.y);
      }
    },
  };
};

export function TasteChangeEvidencePage({ series, onBack, onOpenMenu }: {
  series: TasteChangeSeries[]; onBack: () => void; onOpenMenu?: () => void;
}) {
  const gradientID = `taste-change-detail-${useId().replace(/:/g, '')}`;
  const first = series.find(row => !['비교 부족', '같은 강도'].includes(tasteChangeLabel(row.points))) ?? series[0];
  const [axisIndex, setAxisIndex] = useState(Math.max(0, TASTE_IDS.indexOf(first?.axis)));
  const [selectedID, setSelectedID] = useState<string | undefined>(first?.id);
  const [period, setPeriod] = useState<TasteDetailPeriod>(0);
  const [offset, setOffset] = useState(0);
  const axis = TASTE_IDS[axisIndex], label = TASTE_TOKENS[axis].label;
  const choices = series.filter(row => row.axis === axis);
  const selected = choices.find(row => row.id === selectedID) ?? choices[0];
  const points = selected?.points ?? [];
  const { start, end } = tasteChangeBounds(points, period, offset);
  const visible = points.filter(point => point.date >= start && point.date <= end);
  const shortLabel = (point?: TasteChangePoint) => point ? selected?.maximum === 4 ? `${point.value}단계` : ['약함', '중간', '강함'][point.value] : '—';
  const dateLabel = (value: number) => new Date(value).toLocaleDateString('ko-KR');
  const rangeTabs = <PeriodPicker value={period} axis={axis} onValueChange={value => { setPeriod(value); setOffset(0); }} />;
  return <TasteChangePage onBack={onBack} onOpenMenu={onOpenMenu} topSlot={rangeTabs}>
    <div data-testid="taste-change-screen" className="tb-taste-detail-stack">
      <section className="tb-taste-detail-panel">
        <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3">
          <button type="button" aria-label="이전 기간 보기" disabled={!period || !points.some(point => point.date < start)} onClick={() => setOffset(offset - 1)} className="flex size-10 items-center justify-center rounded-full border disabled:opacity-30"><ChevronLeft size={16} /></button>
          <p className="text-center text-[13px] text-[var(--tb-color-text-hint)]">{selected ? `${dateLabel(start)} – ${dateLabel(end)}` : '기록 없음'}</p>
          <button type="button" aria-label="다음 기간 보기" disabled={offset >= 0} onClick={() => setOffset(offset + 1)} className="flex size-10 items-center justify-center rounded-full border disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
        <div className="flex min-h-11 items-center justify-center">
          <select aria-label="미각 선택" className="min-h-11 max-w-full bg-transparent px-3 text-center text-[16px] font-medium" style={{ color: TASTE_TOKENS[axis].palette.tintSurfaceText }} value={axisIndex}
            onChange={event => { setAxisIndex(Number(event.target.value)); setSelectedID(undefined); setOffset(0); }}>
            {TASTE_IDS.map((id, index) => <option key={id} value={index}>{TASTE_TOKENS[id].label}</option>)}
          </select>
        </div>
        {selected && <select aria-label="비교할 음식과 기록 출처 선택" value={selected.id} onChange={event => { setSelectedID(event.target.value); setOffset(0); }} className="min-h-11 w-full bg-transparent text-center text-[12px]">
          {choices.map(row => <option key={row.id} value={row.id}>{row.source} · {row.condition}</option>)}
        </select>}
        <div className="relative h-[260px] w-full" role="img" aria-label={`${label} 미각 변화 그래프, ${visible.map(point => `${point.id} ${point.label}`).join(', ') || '기록 없음'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visible} margin={{ top: 10, right: 8, left: 18, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientID} gradientUnits="userSpaceOnUse" x1="0" x2="100%" y1="0" y2="0"><stop offset="0%" stopColor={getTasteChartLineStart(label)} /><stop offset="100%" stopColor={getTasteChartLineEnd(label)} /></linearGradient>
                <linearGradient id={`${gradientID}-node`} gradientUnits="userSpaceOnUse" x1="0" x2="100%" y1="0" y2="0"><stop offset="0%" stopColor={getTasteChartNodeStart(label)} /><stop offset="100%" stopColor={getTasteChartLineEnd(label)} /></linearGradient>
              </defs>
              <CartesianGrid vertical={visible.length > 0} stroke="var(--tb-data-viz-radar-grid)" strokeDasharray="3 4" />
              <XAxis hide={!visible.length} type="number" dataKey="date" domain={start === end ? [start - 86400000, end + 86400000] : [start, end]} ticks={visible.map(point => point.date)} interval={0} tickFormatter={value => new Date(value).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide={!visible.length} orientation="right" domain={[0, selected?.maximum ?? 4]} ticks={Array.from({ length: (selected?.maximum ?? 4) + 1 }, (_, i) => i)} tickFormatter={value => selected?.maximum === 2 ? ['약함', '중간', '강함'][value] : `${value}단계`} width={42} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={value => dateLabel(Number(value))} formatter={(_value, _name, item) => [item.payload.label, item.payload.id]} />
              <Line type={roundedMiniCurve} dataKey="value" stroke={getTasteLineChartTrack(label)} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" dot={false} activeDot={false} tooltipType="none" isAnimationActive={false} />
              <Line type={roundedMiniCurve} dataKey="value" stroke={`url(#${gradientID})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                dot={({ cx, cy, index }: { cx?: number; cy?: number; index?: number }) => { return <circle key={index} cx={cx} cy={cy} r={index === visible.length - 1 ? 6 : 2} fill={`url(#${gradientID}${index === visible.length - 1 ? '-node' : ''})`} strokeWidth={0} />; }}
                activeDot={(props: unknown) => { const { cx, cy } = props as { cx?: number; cy?: number }; return <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--tb-color-text-primary)" strokeWidth={1} />; }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          {!visible.length && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[var(--tb-color-text-hint)]">비교할 기록이 더 필요해요</p>}
        </div>
        <p className="tb-taste-detail-scope">{selected?.maximum === 2 ? '직접 느낀 강도 · 약함–강함' : '회상 강도 · 0–4'}</p>
      </section>
      <DetailValueGroup rows={[
        { title: '이전', value: shortLabel(visible.find(point => point.id === '이전')) },
        { title: '최근', value: shortLabel(visible.find(point => point.id === '최근')) },
        { title: '변화', value: <span style={{ color: TASTE_TOKENS[axis].palette.tintSurfaceText }}>{tasteChangeLabel(visible)}</span> },
      ]} />
      <details className="tb-taste-detail-disclosure">
        <summary className="justify-center">경험 비교</summary>
        {(selected?.details ?? ['같은 음식·조건에서 직접 느낀 강도를 남기면 이전과 최근을 비교할 수 있어요.']).map(text => <p key={text} className="text-[12px] leading-5 text-[var(--tb-color-text-secondary)]">{text}</p>)}
        {visible.map(point => <div key={point.id} className="border-t border-[var(--tb-color-border-subtle)] pt-3 text-[13px]">
          <p className="font-semibold">{point.id} · {dateLabel(point.start)} – {dateLabel(point.date)}</p>
          <p className="mt-2">{point.label} · {selected?.source === '식사 기록' ? `식사 ${point.count}회` : `회상 응답 ${point.count}개`}</p>
          {point.sources?.map(source => <details key={source.id} className="mt-2"><summary className="min-h-11 cursor-pointer py-3 font-medium">{source.foodName} 원본 응답 보기</summary><p>{source.restaurantName}</p><p className="whitespace-pre-wrap">{source.note}</p><p>{source.selectedLabels.join(' · ')}</p></details>)}
        </div>)}
      </details>
    </div>
  </TasteChangePage>;
}

export default function TasteChangePage({ children, onBack, onOpenMenu, topSlot }: TasteChangePageProps) {
  return <div className="tb-taste-detail">
    <header className="tb-taste-detail-header">
      <TopAppBar appearance="transparent" title="미각 변화" showBack onBack={onBack} rightActions={onOpenMenu ? <button type="button" onClick={onOpenMenu} aria-label="메뉴 열기" className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)]"><MenuIcon size={ICON_TOKENS.size.lg} strokeWidth={1.8} /></button> : <></>} />
    </header>
    {topSlot && <div className="tb-taste-detail-controls">{topSlot}</div>}
    <div className="tb-taste-detail-scroll">{children}</div>
  </div>;
}
