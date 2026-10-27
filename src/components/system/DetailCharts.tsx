import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { CHART_COMPARISON_TRACK_COLOR, COLOR_TOKENS, TASTE_TOKENS } from '../../constants/uiColorTokens';
import type { TasteId } from '../../constants/designTokens';
import { miniHeatmapColor } from './plating/MiniHeatmap';
import DishKindIcon from './DishKindIcon';
import { buildRoundedLinePath } from './roundedLinePath';
import { dataAlignedLineLayout } from './dataAlignedLinePath';
import { buildRoundedAreaPath } from './plating/roundedAreaPath';
import { symbolDonutGeometry } from './plating/symbolDonutGeometry';
import { miniBubbleGeometry } from './plating/miniBubbleGeometry';
import { getTasteChartLineEnd, getTasteChartLineStart, getTasteChartNodeStart, getTasteLineChartTrack } from '../../constants/tasteColors';
import './detail-charts.css';

/** Presentation only. Callers supply validated current-account aggregates with their
 * original unit, period, confirmed meal dates/local calendar, denominator and ID
 * deduplication. No source records or dates are inferred here. Unknown/future values
 * remain null, never zero. Detail axes are linear; compact-chart minimum heights
 * are deliberately not reused on a numbered scale. */
export interface DetailChartItem { id: string; label: string; value: number | null; color?: string; valueLabel?: string; dishKindId?: string; axis?: TasteId }
export interface DetailChartSeries { id: string; label: string; values: readonly (number | null)[]; color: string; axis?: TasteId; comparison?: boolean; highlightsEachValue?: boolean }
const valid = (value: number | null | undefined): value is number => value !== null && value !== undefined && Number.isFinite(value) && value >= 0;
const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
const fallbackColor = TASTE_TOKENS.umami.palette.main;

export function detailChartScale(values: readonly (number | null)[], maximum?: number) {
  const peak = Math.max(1, ...values.filter(valid));
  const raw = (maximum ?? peak) / 4;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = maximum ? maximum / 4 : Math.max(1, [1, 2, 5, 10].find(value => value * power >= raw)! * power);
  const top = maximum ?? Math.ceil(peak / step) * step;
  return { maximum: top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step) };
}

function useChartSelection(signature: string, fallback: number) {
  const [selection, setSelection] = useState({ signature, index: fallback });
  const index = selection.signature === signature ? selection.index : fallback;
  useEffect(() => { setSelection({ signature, index: fallback }); }, [signature, fallback]);
  return [index, (next: number) => setSelection({ signature, index: next })] as const;
}

function Readout({ label, value, unit, children }: { label: string; value: string; unit?: string; children?: ReactNode }) {
  return <div className="tb-detail-chart-readout" aria-live="polite" aria-atomic="true">
    <span className="tb-detail-chart-eyebrow">{label}</span>
    <div className="tb-detail-chart-value">{value}{unit && <span>{unit}</span>}</div>
    {children}
  </div>;
}

export function DetailCartesianChart({ labels, series, kind = 'bar', unit, label, maximum, valueLabels, selectionLabels, selectionKey = '', initialIndex }: {
  labels: readonly string[]; series: readonly DetailChartSeries[];
  kind?: 'bar' | 'grouped' | 'stacked' | 'line' | 'area'; unit: string; label: string;
  maximum?: number; valueLabels?: readonly string[]; selectionLabels?: readonly string[]; selectionKey?: string; initialIndex?: number;
}) {
  const instanceID = useId().replace(/:/g, '');
  const signature = JSON.stringify([selectionKey, labels, series]);
  const latestKnown = labels.reduce((last, _, index) => series.some(row => valid(row.values[index])) ? index : last, 0);
  const fallback = Math.max(0, Math.min(labels.length - 1, initialIndex ?? latestKnown));
  const [selected, select] = useChartSelection(signature, fallback);
  const sums = labels.map((_, index) => series.some(row => !valid(row.values[index])) ? null : series.reduce((sum, row) => sum + row.values[index]!, 0));
  const scale = detailChartScale(kind === 'stacked' ? sums : series.flatMap(row => [...row.values]), maximum);
  const W = 360, H = 246, left = 8, right = 44, top = 18, bottom = 32, plotW = W - left - right, plotH = H - top - bottom;
  const baseline = top + plotH, slot = plotW / Math.max(1, labels.length);
  const continuous = kind === 'line' || kind === 'area';
  const x = (index: number) => continuous && labels.length > 1 ? left + plotW * index / (labels.length - 1) : left + slot * (index + .5);
  const y = (value: number) => baseline - value / scale.maximum * plotH;
  const current = series.map(row => ({ ...row, value: row.values[selected] }));
  const primary = kind === 'grouped' ? current.at(-1) : current[0];
  const oneValue = kind === 'stacked' ? sums[selected] : primary?.value;
  const summary = valid(oneValue) ? valueLabels?.[selected] ?? number(oneValue) : '—';
  const readoutLabel = `${selectionLabels?.[selected] ?? labels[selected] ?? label}${current.length > 1 ? kind === 'stacked' ? ' · 합계' : ` · ${primary?.label ?? ''}` : ''}`;
  const detail = current.map(row => `${row.label} ${valid(row.value) ? number(row.value) + unit : '미확인'}`).join(' · ');
  const selectAt = (clientX: number, element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    const point = (clientX - box.left) / box.width * W;
    const index = continuous && labels.length > 1 ? Math.round((point - left) / plotW * (labels.length - 1)) : Math.floor((point - left) / slot);
    select(Math.max(0, Math.min(labels.length - 1, index)));
  };
  const labelStride = Math.max(1, Math.ceil(labels.length / 7));
  const drawSeries = kind === 'area' ? [...series].sort((a, b) => detailAreaWeight(b.values) - detailAreaWeight(a.values)) : series;
  return <div className="tb-detail-chart" data-chart-kind={kind}>
    {kind === 'line' && current.length === 2 ? <div className="tb-detail-chart-pair" aria-live="polite" aria-atomic="true">
      <span className="tb-detail-chart-eyebrow">{selectionLabels?.[selected] ?? labels[selected]}</span>
      <div className="tb-detail-chart-pair-values">{current.map(row => <div key={row.id}>
        <span className="tb-detail-chart-eyebrow"><i style={{ background: row.color }} />{row.label}</span>
        <div className="tb-detail-chart-value">{valid(row.value) ? number(row.value) : '—'}{valid(row.value) && <span>{unit}</span>}</div>
        {!valid(row.value) && <span className="tb-detail-chart-note">미확인</span>}
      </div>)}</div>
    </div> : <Readout label={readoutLabel} value={summary} unit={valid(oneValue) && !valueLabels?.[selected] ? unit : undefined}>
      {current.length > 1 && <div className="tb-detail-chart-selected-series">{current.map(row => <span key={row.id}><i style={{ background: row.color }} />{row.label} <b>{valid(row.value) ? number(row.value) + unit : '미확인'}</b></span>)}</div>}
      {current.length === 1 && !valid(oneValue) && <span className="tb-detail-chart-note">확인된 값이 없어요</span>}
    </Readout>}
    <div className="tb-detail-chart-touch" tabIndex={labels.length ? 0 : -1} role="slider" aria-label={`${label}. 좌우 방향키로 항목 선택`} aria-valuemin={0} aria-valuemax={Math.max(0, labels.length - 1)} aria-valuenow={selected} aria-valuetext={`${labels[selected] ?? ''}, ${detail}`}
      onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); select(event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1 : Math.max(0, Math.min(labels.length - 1, selected + (event.key === 'ArrowLeft' ? -1 : 1)))); } }}
      onPointerDown={event => selectAt(event.clientX, event.currentTarget)} onPointerMove={event => { if (event.buttons === 1) selectAt(event.clientX, event.currentTarget); }}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="tb-detail-chart-svg">
        {scale.ticks.map(tick => <g key={tick}><line x1={left} x2={W - right} y1={y(tick)} y2={y(tick)} className="tb-detail-chart-grid" /><text x={W - 4} y={y(tick) + 4} textAnchor="end" className="tb-detail-chart-axis">{number(tick)}{maximum === 100 ? '%' : ''}</text></g>)}
        {!!labels.length && <line x1={x(selected)} x2={x(selected)} y1={top} y2={baseline} className="tb-detail-chart-guide" />}
        {(kind === 'line' || kind === 'area') ? drawSeries.map((row, seriesIndex) => {
          const runs: { index: number; value: number }[][] = []; let run: { index: number; value: number }[] = [];
          labels.forEach((_, index) => { const value = row.values[index]; if (valid(value)) run.push({ index, value }); else if (run.length) { runs.push(run); run = []; } });
          if (run.length) runs.push(run);
          const taste = TASTE_TOKENS[row.axis ?? 'umami'].label;
          const gradientID = `detail-line-${instanceID}-${seriesIndex}`, nodeGradientID = `${gradientID}-current`;
          return <g key={row.id} data-line-series={kind === 'line' ? row.id : undefined}>
            {kind === 'line' && <defs><linearGradient id={gradientID} gradientUnits="userSpaceOnUse" x1={left} x2={W - right} y1="0" y2="0"><stop offset="0%" stopColor={getTasteChartLineStart(taste)} /><stop offset="100%" stopColor={getTasteChartLineEnd(taste)} /></linearGradient><linearGradient id={nodeGradientID} gradientUnits="userSpaceOnUse" x1={left} x2={W - right} y1="0" y2="0"><stop offset="0%" stopColor={getTasteChartNodeStart(taste)} /><stop offset="100%" stopColor={getTasteChartLineEnd(taste)} /></linearGradient></defs>}
            {runs.map((points, runIndex) => {
            const coordinates = points.map(point => ({ x: x(point.index), y: y(point.value) }));
            const layout = kind === 'line' ? dataAlignedLineLayout(coordinates, 12) : { controls: coordinates, radius: 0 };
            const path = buildRoundedLinePath(layout.controls, layout.radius);
            const markers = coordinates;
            return <g key={runIndex}>{kind === 'area' ? points.length > 1 && <path d={buildRoundedAreaPath([...coordinates, { x: coordinates.at(-1)!.x, y: baseline }, { x: coordinates[0].x, y: baseline }], 6)} fill={row.color} data-series={row.id} />
              : <>{points.length > 1 && <><path d={path} fill="none" stroke={getTasteLineChartTrack(taste)} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" data-mark="line-track" /><path d={path} fill="none" stroke={`url(#${gradientID})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-mark="line-core" /></>}
                {markers.map((point, markerIndex) => { const selectedNode = points[markerIndex].index === selected; return <g key={points[markerIndex].index}><circle cx={point.x} cy={point.y} r={selectedNode ? 6 : 2} fill={`url(#${selectedNode ? nodeGradientID : gradientID})`} className="tb-detail-line-node" data-mark={selectedNode ? 'current-node' : 'history-node'} />
                  <circle cx={point.x} cy={point.y} r={selectedNode ? 9 : 5} opacity={selectedNode ? 1 : 0} fill="none" stroke={`url(#${nodeGradientID})`} strokeWidth="1" className="tb-detail-line-selection" data-mark={selectedNode ? 'selection' : undefined} /></g>; })}</>}</g>;
          })}</g>;
        }) : labels.map((_, index) => {
          const groupWidth = Math.min(kind === 'grouped' ? 28 : 12, slot * .64), barWidth = groupWidth / (kind === 'grouped' ? Math.max(1, series.length) : 1);
          if (kind === 'stacked') {
            if (sums[index] === null) return null;
            if (sums[index] === 0) return <circle key={index} cx={x(index)} cy={baseline} r="2" fill={COLOR_TOKENS.border.default} />;
            let cumulative = 0;
            const layers = series.flatMap(row => { const value = row.values[index]!; cumulative += value; return value > 0 ? [{ row, cumulative }] : []; }).reverse();
            return <g key={index}>{layers.map(({ row, cumulative: heightValue }) => <rect key={row.id} x={x(index) - barWidth / 2} y={y(heightValue)} width={barWidth} height={baseline - y(heightValue)} rx={Math.min(barWidth, baseline - y(heightValue)) / 2} fill={row.color} data-mark="cumulative-capsule" />)}</g>;
          }
          return <g key={index}>{series.map((row, seriesIndex) => {
            const value = row.values[index]; if (!valid(value)) return null;
            const barX = x(index) - groupWidth / 2 + (kind === 'grouped' ? seriesIndex * barWidth : 0);
            const width = Math.max(1, barWidth - (kind === 'grouped' ? 2 : 0)), height = value / scale.maximum * plotH, radius = Math.min(width, height) / 2;
            const track = row.comparison ? CHART_COMPARISON_TRACK_COLOR : TASTE_TOKENS[row.axis ?? 'umami'].palette.chartTrack;
            const endpoint = row.comparison ? COLOR_TOKENS.text.body : TASTE_TOKENS[row.axis ?? 'umami'].palette.main;
            const latest = row.values.reduce((last, v, slotIndex) => valid(v) ? slotIndex : last, -1);
            const endpointShown = value > 0 && (row.highlightsEachValue || index === latest);
            const startX = barX + (kind === 'grouped' ? 1 : 0);
            return value === 0 ? <circle key={row.id} cx={startX + width / 2} cy={baseline} r="2" fill={track} />
              : <g key={row.id}><rect x={startX} y={y(value)} width={width} height={height} rx={radius} fill={track} data-mark="capsule-track" />
                {endpointShown && <circle cx={startX + width / 2} cy={y(value) + radius} r={radius} fill={endpoint} data-mark="capsule-endpoint" />}</g>;
          })}</g>;
        })}
        {labels.map((item, index) => (index % labelStride === 0 || index === labels.length - 1) && <text key={index} x={x(index)} y={H - 8} textAnchor="middle" className="tb-detail-chart-axis">{item.length > 9 ? item.slice(0, 8) + '…' : item}</text>)}
      </svg>
    </div>
    <span className="tb-detail-chart-hint">그래프를 눌러 값을 살펴보세요</span>
  </div>;
}

/** Trapezoidal area on the shared linear scale; null intervals have no area. */
export function detailAreaWeight(values: readonly (number | null)[]) {
  return values.reduce<number>((area, value, index) => index > 0 && valid(value) && valid(values[index - 1]) ? area + (values[index - 1]! + value) / 2 : area, 0);
}

export function DetailHorizontalBars({ items, unit, label }: { items: readonly DetailChartItem[]; unit: string; label: string }) {
  const [selected, select] = useChartSelection(JSON.stringify(items), 0);
  const scale = detailChartScale(items.map(item => item.value));
  return <div className="tb-detail-chart" aria-label={label} data-chart-kind="ranking">
    <Readout label={items[selected]?.label ?? label} value={valid(items[selected]?.value) ? number(items[selected].value!) : '—'} unit={items.length ? unit : undefined} />
    <div className="tb-detail-ranking">{items.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === index} onClick={() => select(index)}>
      <span className="tb-detail-ranking-label"><span>{index + 1}. {item.label}</span><b>{valid(item.value) ? `${number(item.value)}${unit}` : '미확인'}</b></span>
      <span className="tb-detail-ranking-track">{valid(item.value) && item.value > 0 && <i style={{ width: `${item.value / scale.maximum * 100}%`, background: TASTE_TOKENS[item.axis ?? 'umami'].palette.chartTrack }}><b style={{ background: TASTE_TOKENS[item.axis ?? 'umami'].palette.main }} /></i>}</span>
    </button>)}</div>
    {!!items.length && <div className="tb-detail-ranking-axis">{scale.ticks.map(tick => <span key={tick} style={{ left: `${tick / scale.maximum * 100}%` }}>{number(tick)}</span>)}</div>}
    {!items.length && <p className="tb-detail-chart-empty">이 범위의 기록이 없어요</p>}
  </div>;
}

export function DetailBubbleChart({ items, unit, label, content = 'value' }: { items: readonly DetailChartItem[]; unit: string; label: string; content?: 'value' | 'icon' }) {
  const positive = items.filter(item => valid(item.value) && item.value > 0);
  const [selected, select] = useChartSelection(JSON.stringify(items), 0);
  const circles = miniBubbleGeometry(items.map(item => item.value));
  return <div className="tb-detail-chart" data-chart-kind="bubble">
    <Readout label={items[selected]?.label ?? label} value={valid(items[selected]?.value) ? number(items[selected].value!) : '—'} unit={items.length ? unit : undefined} />
    <svg viewBox="0 0 360 190" role="img" aria-label={label} className="tb-detail-chart-svg" data-content={content}>
      {circles.map(circle => { const item = items[circle.index], radius = circle.radius * 2.5, cx = 15 + circle.cx * 2.5, iconSize = Math.min(40, radius * 1.2);
        return <g key={item.id} onClick={() => select(circle.index)} style={{ cursor: 'pointer' }}><circle cx={cx} cy="90" r={radius} fill={item.color ?? fallbackColor} />
          {selected === circle.index && <circle cx={cx} cy="90" r={radius + 4} fill="none" stroke={COLOR_TOKENS.text.primary} strokeWidth="1" data-mark="selection" />}
          {content === 'icon' && item.dishKindId ? <g transform={`translate(${cx - iconSize / 2}, ${90 - iconSize / 2})`} style={{ color: 'var(--tb-color-chart-on-bright-fill,#0F0F0F)' }} data-dish-kind={item.dishKindId}><DishKindIcon id={item.dishKindId} size={iconSize} /></g>
            : radius >= 10 && <text x={cx} y="90" dominantBaseline="central" textAnchor="middle" className="tb-detail-bubble-number" style={{ fontSize: Math.min(26, radius * .7, radius * 1.5 / (String(item.value).length * .62)) }}>{number(item.value!)}</text>}</g>;
      })}
    </svg>
    <ChartLegend items={items} unit={unit} selected={selected} onSelect={select} />
    {!positive.length && <p className="tb-detail-chart-empty">{items.some(item => !valid(item.value)) ? '확인된 값이 없어요' : '표시할 기록이 없어요'}</p>}
  </div>;
}

export function DetailDonutChart({ items, unit, label }: { items: readonly DetailChartItem[]; unit: string; label: string }) {
  const complete = items.every(item => valid(item.value));
  const total = complete ? items.reduce((sum, item) => sum + item.value!, 0) : 0;
  const [selected, select] = useChartSelection(JSON.stringify(items), 0);
  const pieces = complete ? symbolDonutGeometry(items.map(item => item.value!)) : [];
  const selectedValue = items[selected]?.value;
  return <div className="tb-detail-chart" data-chart-kind="pie">
    <Readout label={items[selected]?.label ?? label} value={total && valid(selectedValue) ? number(selectedValue) : '—'} unit={total ? unit : undefined}>
      <span className="tb-detail-chart-note">{!complete ? '확인되지 않은 항목이 있어 비율을 계산하지 않아요' : total ? `전체 ${number(total)}${unit} 중 ${number((selectedValue ?? 0) / total * 100)}%` : '비율을 계산할 기록이 없어요'}</span>
    </Readout>
    <svg viewBox="0 0 360 212" role="img" aria-label={`${label}. ${items.map(item => `${item.label} ${valid(item.value) ? number(item.value) + unit : '미확인'}`).join(', ')}`} className="tb-detail-chart-svg">
      {!pieces.length && <><circle cx="180" cy="104" r="92" fill="none" stroke="var(--tb-color-border-subtle)" strokeWidth="1" /><text x="180" y="108" textAnchor="middle" className="tb-detail-chart-axis">{complete ? '기록 없음' : '확인 필요'}</text></>}
      <g transform="translate(88 12)">{pieces.map(piece => <path key={items[piece.index].id} d={piece.path} fill={items[piece.index].color ?? fallbackColor}
        stroke={selected === piece.index ? COLOR_TOKENS.text.primary : 'none'} strokeWidth="1" strokeLinejoin="round" onClick={() => select(piece.index)} style={{ cursor: 'pointer' }} data-mark="rounded-pie-sector" data-fraction={piece.fraction} />)}</g>
    </svg>
    {total > 0 && <p className="tb-detail-chart-hint">전체 {number(total)}{unit}</p>}
    <ChartLegend items={items} unit={unit} selected={selected} onSelect={select} />
  </div>;
}

function ChartLegend({ items, unit, selected, onSelect }: { items: readonly DetailChartItem[]; unit: string; selected: number; onSelect: (index: number) => void }) {
  return <div className="tb-detail-chart-legend">{items.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected} onClick={() => onSelect(index)}><i style={{ background: item.color ?? fallbackColor }} /><span>{item.label}</span><b>{valid(item.value) ? number(item.value) + unit : '미확인'}</b></button>)}</div>;
}

export function DetailCalendarChart({ days, startDay, axis = 'umami', label }: { days: readonly { date: string; count: number | null }[]; startDay: number; axis?: TasteId; label: string }) {
  const latest = Math.max(0, days.reduce((last, day, index) => day.count !== null ? index : last, 0));
  const [selected, select] = useChartSelection(JSON.stringify(days), latest);
  const current = days[selected];
  return <div className="tb-detail-chart" data-chart-kind="calendar">
    <Readout label={current?.date ?? label} value={valid(current?.count) ? number(current.count) : '—'} unit={valid(current?.count) ? '개 요리 기록' : undefined}>
      {current?.count === null && <span className="tb-detail-chart-note">아직 오지 않았거나 확인되지 않은 날짜</span>}
    </Readout>
    <div className="tb-detail-calendar" aria-label={label}>
      {['월', '화', '수', '목', '금', '토', '일'].map(day => <span key={day} className="tb-detail-calendar-weekday">{day}</span>)}
      {Array.from({ length: startDay }, (_, index) => <span aria-hidden="true" key={`padding-${index}`} />)}
      {days.map((day, index) => <button type="button" key={day.date} onClick={() => select(index)} aria-pressed={index === selected} data-level={day.count === null ? 'unknown' : Math.min(4, day.count)} aria-label={`${day.date}, ${day.count === null ? '미확인' : `${day.count}개 요리 기록`}`} style={{ '--detail-cell-color': miniHeatmapColor(day.count === null ? null : Math.min(4, day.count), axis) } as CSSProperties}>
        <span>{index + 1}</span><b>{day.count === null ? '—' : day.count}</b>
      </button>)}
    </div>
  </div>;
}
