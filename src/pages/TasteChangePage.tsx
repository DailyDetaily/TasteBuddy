import { useState, type ReactNode } from 'react';
import { Menu as MenuIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import PageSection from '../components/system/PageSection';
import { ICON_TOKENS, TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import { getTasteColor, getTasteTint } from '../constants/tasteColors';
import { tasteChangeLabel } from '../lib/tastePerception.mjs';

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

export function TasteChangeEvidencePage({ series, onBack, onOpenMenu }: {
  series: TasteChangeSeries[]; onBack: () => void; onOpenMenu?: () => void;
}) {
  const first = series.find(row => !['비교 부족', '같은 강도'].includes(tasteChangeLabel(row.points))) ?? series[0];
  const [axisIndex, setAxisIndex] = useState(Math.max(0, TASTE_IDS.indexOf(first?.axis)));
  const [selectedID, setSelectedID] = useState(first?.id);
  const [days, setDays] = useState(0);
  const [offset, setOffset] = useState(0);
  const axis = TASTE_IDS[axisIndex], label = TASTE_TOKENS[axis].label;
  const choices = series.filter(row => row.axis === axis);
  const selected = choices.find(row => row.id === selectedID) ?? choices[0];
  const points = selected?.points ?? [];
  const latest = points.length ? Math.max(...points.map(point => point.date)) : Date.now();
  const end = latest + offset * days * 86400000;
  const start = days ? end - days * 86400000 : points.length ? Math.min(...points.map(point => point.start)) : end;
  const visible = points.filter(point => point.date >= start && point.date <= end);
  const shortLabel = (point?: TasteChangePoint) => point ? selected?.maximum === 4 ? `${point.value}단계` : ['약함', '중간', '강함'][point.value] : '기록 없음';
  const color = getTasteColor(label), tint = getTasteTint(label, .18);
  const dateLabel = (value: number) => new Date(value).toLocaleDateString('ko-KR');
  const move = (direction: number) => { setAxisIndex((axisIndex + direction + TASTE_IDS.length) % TASTE_IDS.length); setSelectedID(undefined); setOffset(0); };
  const rangeTabs = <div className="flex justify-center gap-2">{[[7, '주'], [31, '달'], [92, '분기'], [366, '년'], [0, '전부']].map(([value, name]) =>
    <button key={value} type="button" className="min-h-11 rounded-full px-[14px] text-[13px] font-semibold" aria-pressed={days === value}
      style={days === value ? { color, backgroundColor: tint } : { color: 'var(--tb-color-text-tertiary)' }} onClick={() => { setDays(Number(value)); setOffset(0); }}>{name}</button>)}</div>;
  return <TasteChangePage onBack={onBack} onOpenMenu={onOpenMenu} topSlot={rangeTabs}>
    <div data-testid="taste-change-screen" className="tb-section-stack">
      <SectionCard className="!rounded-none" hoverEffect={false}>
        <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3">
          <button type="button" aria-label="이전 기간 보기" disabled={!days || !points.some(point => point.date < start)} onClick={() => setOffset(offset - 1)} className="flex size-10 items-center justify-center rounded-full border disabled:opacity-30"><ChevronLeft size={16} /></button>
          <p className="text-center text-[15px] font-semibold">{selected ? `${dateLabel(start)} – ${dateLabel(end)}` : '기록 대기'}</p>
          <button type="button" aria-label="다음 기간 보기" disabled={offset >= 0} onClick={() => setOffset(offset + 1)} className="flex size-10 items-center justify-center rounded-full border disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button type="button" onClick={() => move(-1)} className="min-h-11 justify-self-start rounded-[14px] bg-[var(--tb-color-surface-muted)] px-2 text-[12px] opacity-50">{TASTE_TOKENS[TASTE_IDS[(axisIndex + 5) % 6]].label}</button>
          <div className="rounded-[18px] border border-[var(--tb-color-border-default)] p-3 text-center"><p className="text-[14px] font-semibold" style={{ color }}>{label}</p><p className="text-[11px]">{shortLabel(visible.at(-1))}</p></div>
          <button type="button" onClick={() => move(1)} className="min-h-11 justify-self-end rounded-[14px] bg-[var(--tb-color-surface-muted)] px-2 text-[12px] opacity-50">{TASTE_TOKENS[TASTE_IDS[(axisIndex + 1) % 6]].label}</button>
        </div>
        {selected && <select aria-label="비교할 음식과 기록 출처 선택" value={selected.id} onChange={event => { setSelectedID(event.target.value); setOffset(0); }} className="min-h-11 w-full bg-transparent text-center text-[12px]">
          {choices.map(row => <option key={row.id} value={row.id}>{row.source} · {row.condition}</option>)}
        </select>}
        <div className="relative h-[280px] w-full" role="img" aria-label={`${label} 미각 변화 그래프, ${visible.map(point => `${point.id} ${point.label}`).join(', ') || '기록 없음'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visible} margin={{ top: 10, right: 8, left: 18, bottom: 5 }}>
              <CartesianGrid stroke="#E6E8ED" strokeDasharray="3 4" />
              <XAxis hide={!visible.length} type="number" dataKey="date" domain={start === end ? [start - 86400000, end + 86400000] : [start, end]} ticks={visible.map(point => point.date)} interval={0} tickFormatter={value => new Date(value).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis orientation="right" domain={[0, selected?.maximum ?? 4]} ticks={Array.from({ length: (selected?.maximum ?? 4) + 1 }, (_, i) => i)} tickFormatter={value => selected?.maximum === 2 ? ['약함', '중간', '강함'][value] : `${value}단계`} width={42} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip payloadUniqBy="dataKey" labelFormatter={value => dateLabel(Number(value))} formatter={(_value, _name, item) => [item.payload.label, item.payload.id]} />
              <Line type="linear" dataKey="value" stroke={tint} strokeWidth={12} strokeLinecap="round" dot={false} activeDot={false} tooltipType="none" isAnimationActive={false} />
              <Line type="linear" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 6, fill: color, strokeWidth: 0 }} activeDot={{ r: 8 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          {!visible.length && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[var(--tb-color-text-hint)]">비교할 기록이 더 필요해요</p>}
        </div>
      </SectionCard>
      <PageSection title="미각 세부 정보" className="px-5">
        <SectionCard hoverEffect={false}>
          <div className="grid w-full grid-cols-3 gap-2">{[
            ['이전', shortLabel(visible.find(point => point.id === '이전'))], ['최근', shortLabel(visible.find(point => point.id === '최근'))], ['변화', tasteChangeLabel(visible)],
          ].map(([name, value]) => <div key={name} className="rounded-xl bg-[var(--tb-color-surface-muted)] p-3"><p className="text-[11px] text-[var(--tb-color-text-hint)]">{name}</p><p className="mt-1 text-[14px] font-bold">{value}</p></div>)}</div>
          <p className="w-full text-[13px]">{visible.length === 2 ? `같은 음식·조건에서 ${tasteChangeLabel(visible)} 남겼어요.` : '아직 변화없음 · 이 기간에 비교할 기록이 더 필요해요.'}</p>
          {(selected?.details ?? ['같은 음식·조건에서 직접 느낀 강도를 남기면 이전과 최근을 비교할 수 있어요.']).map(text => <p key={text} className="w-full rounded-xl border border-[var(--tb-color-border-subtle)] p-3 text-[12px]">{text}</p>)}
          {visible.map(point => <div key={point.id} className="w-full border-t border-[var(--tb-color-border-default)] pt-3 text-[13px]">
            <p className="font-semibold">{point.id} · {dateLabel(point.start)} – {dateLabel(point.date)}</p>
            <p>{point.label} · {selected?.source === '식사 기록' ? `식사 ${point.count}회` : `회상 응답 ${point.count}개`}</p>
            {point.sources?.map(source => <details key={source.id} className="mt-2"><summary className="min-h-11 cursor-pointer py-3 font-medium">{source.foodName} 원본 응답 보기</summary><p>{source.restaurantName}</p><p className="whitespace-pre-wrap">{source.note}</p><p>{source.selectedLabels.join(' · ')}</p></details>)}
          </div>)}
        </SectionCard>
      </PageSection>
    </div>
  </TasteChangePage>;
}

export default function TasteChangePage({ children, onBack, onOpenMenu, topSlot }: TasteChangePageProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
        <div className="pointer-events-auto w-full max-w-[1440px]">
          <TopAppBar
            title="미각 변화"
            showBack
            onBack={onBack}
            rightActions={(
              <button
                type="button"
                onClick={onOpenMenu}
                aria-label="메뉴 열기"
                className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                style={{
                  width: ICON_TOKENS.container.lg,
                  height: ICON_TOKENS.container.lg,
                }}
              >
                <MenuIcon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </button>
            )}
          />
        </div>
      </div>
      {topSlot ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
          style={{ top: 'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))' }}
        >
          <div className="pointer-events-auto w-full max-w-[1440px] shrink-0 border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-5 pb-4 pt-1">
            {topSlot}
          </div>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className={`tb-section-stack px-0 pb-20 animate-fadeIn ${topSlot ? 'pt-[53px]' : 'pt-5'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
