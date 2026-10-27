import { buildCards, buildDiscoveries, dimensionRows, eventRows, mealCount, periodWindow, prepare, senseKey, type Card, type Category, type Data, type Facet, type Period, type Segment, type State } from '../../lib/gastronomy/engine';
import type { TasteDetailPeriod } from '../system/plating/PeriodPicker';

export type DetailPeriod = 'original' | TasteDetailPeriod;
export interface DetailQuery {
  id: string;
  title: string;
  category: Category;
  originalPeriod: Period;
  source: string;
  domain: string;
  attribute: string;
  facet: Facet;
}

/** Calendar-month ranges, anchored to the same local day as the source category. */
export function detailPeriodWindow(period: DetailPeriod, original: Period, now: Date) {
  if (period === 'original') return periodWindow(original, now);
  if (period === 0) return null;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const start = new Date(end);
  const day = start.getDate();
  start.setDate(1);
  start.setMonth(start.getMonth() - period);
  start.setDate(Math.min(day, new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
  return { start: +start, end: +end };
}

/** Retain the complete validated history for first/repeat and prior-period queries. */
export function prepareDetailState(data: Data, query: DetailQuery, period: DetailPeriod, now: Date): State {
  const state = prepare(data, 'all', query.source, now);
  const window = detailPeriodWindow(period, query.originalPeriod, now);
  const selected = state.records.filter(record => !window || (record.date !== null && Date.parse(record.date) >= window.start && Date.parse(record.date) < window.end));
  const ids = new Set(selected.map(record => record.id));
  return { ...state, window, selected, observations: state.allObservations.filter(observation => ids.has(observation.entryID)) };
}

export interface DetailComparison { points: DetailPlotPoint[]; status?: string; scope?: string }
export type ResolvedDetailCard = Card & { comparisons?: Record<string, DetailComparison>; scope?: string };

/** Equal calendar-day windows, matching TDWindow.previous across DST boundaries. */
export function detailComparisonPeriods(state: State) {
  const recent = state.window ?? periodWindow('ninety', state.now)!;
  const start = new Date(recent.start), end = new Date(recent.end);
  const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
  const previous = { start: +new Date(start.getFullYear(), start.getMonth(), start.getDate() - days), end: recent.start };
  const select = (window: { start: number; end: number }) => state.records.filter(record => record.date !== null && Date.parse(record.date) >= window.start && Date.parse(record.date) < window.end);
  return { recent, previous, before: select(previous), after: select(recent) };
}

function comparisonScope(periods: ReturnType<typeof detailComparisonPeriods>, unit: string) {
  const format = (window: { start: number; end: number }) => {
    const end = new Date(window.end); end.setDate(end.getDate() - 1);
    return `${new Date(window.start).toLocaleDateString('ko-KR')}–${end.toLocaleDateString('ko-KR')}`;
  };
  return `이전 ${format(periods.previous)} ↔ 최근 ${format(periods.recent)} · ${unit}`;
}

/** Native archive selections preserve the catalog version as an explicit JSON field. */
function observationCatalog(selection: string) {
  try {
    const value = JSON.parse(selection);
    return Array.isArray(value) && value.length >= 4 && typeof value[2] === 'string' && value[2].trim() ? value[2] : null;
  } catch { return null; }
}

function resolveComparisonCard(state: State, query: DetailQuery): ResolvedDetailCard {
  const periods = detailComparisonPeriods(state), comparisons: Record<string, DetailComparison> = {};
  const recordIDs = [...new Set([...periods.before, ...periods.after].map(record => record.id))];
  if (query.id === 'change-experience') {
    const rows = [['meal', '기록한 식사', '번'], ['menu', '메뉴', '개'], ['restaurant', '식당', '곳'], ['foodKind', '음식 종류', '가지']].map(([id, title, unit]) => {
      const count = (records: Data['records']) => {
        if (id === 'meal') return mealCount(records);
        const value = dimensionRows(records, id).length;
        return value === 0 && records.length > 0 ? null : value;
      };
      const before = count(periods.before), after = count(periods.after);
      comparisons[id] = { points: [before, after].map((value, index) => ({ id: index ? 'after' : 'before', label: index ? '최근' : '이전', value, valueLabel: value === null ? '—' : String(value) })), status: before === null || after === null ? '연결 미확인' : undefined, scope: comparisonScope(periods, `${id === 'meal' ? '식사' : title} 기준`) };
      return { id, title, value: `${before === null ? '미확인' : before} → ${after === null ? '미확인' : after}${unit}`, detail: '이전 → 최근 · 연결된 정체성만 집계', entryIDs: recordIDs };
    });
    return { id: query.id, title: query.title, meaning: '확인된 식사일 · 같은 길이의 이전·최근 기간', rows, comparisons, scope: comparisonScope(periods, '식사·연결된 경험 수') };
  }
  const beforeIDs = new Set(periods.before.map(record => record.id)), afterIDs = new Set(periods.after.map(record => record.id));
  const presence = state.allObservations.filter(observation => observation.facet === 'presence' && (beforeIDs.has(observation.entryID) || afterIDs.has(observation.entryID)));
  const baseBefore = presence.filter(observation => beforeIDs.has(observation.entryID)), baseAfter = presence.filter(observation => afterIDs.has(observation.entryID));
  const countMeals = (records: Data['records'], observations: typeof presence) => { const ids = new Set(observations.map(observation => observation.entryID)); return mealCount(records.filter(record => ids.has(record.id))); };
  const denominatorBefore = countMeals(periods.before, baseBefore), denominatorAfter = countMeals(periods.after, baseAfter);
  const versionsBefore = new Set(baseBefore.map(observation => observationCatalog(observation.selection))), versionsAfter = new Set(baseAfter.map(observation => observationCatalog(observation.selection)));
  const compatible = versionsBefore.size === 1 && versionsAfter.size === 1 && !versionsBefore.has(null) && !versionsAfter.has(null) && [...versionsBefore][0] === [...versionsAfter][0];
  const keys = [...new Set(presence.map(senseKey))].filter(key => !query.attribute || key === query.attribute).sort();
  const rows = keys.map(id => {
    const selected = presence.filter(observation => senseKey(observation) === id);
    const before = countMeals(periods.before, selected), after = countMeals(periods.after, selected);
    const label = (value: number, denominator: number) => denominator > 0 ? `${value}/${denominator}번 (${Math.round(value / denominator * 100)}%)` : '자료 없음';
    comparisons[id] = {
      points: [[before, denominatorBefore], [after, denominatorAfter]].map(([value, denominator], index) => ({ id: index ? 'after' : 'before', label: index ? '최근' : '이전', value: compatible && denominator > 0 ? value / denominator * 100 : null, valueLabel: denominator > 0 ? `${value}/${denominator} · ${Math.round(value / denominator * 100)}%` : '—' })),
      status: !compatible ? '비교 기준 확인 필요' : !denominatorBefore || !denominatorAfter ? '비교 부족' : undefined,
    };
    return { id, title: selected[0].label, value: `${label(before, denominatorBefore)} → ${label(after, denominatorAfter)}`, detail: '각 기간에 유효한 감각을 남긴 식사가 분모 · 호감의 변화가 아니에요', entryIDs: [...new Set([...baseBefore, ...baseAfter].map(observation => observation.entryID))] };
  });
  return { id: query.id, title: query.title, meaning: '확인된 식사일 · 같은 길이의 이전·최근 기간', rows, comparisons, scope: comparisonScope(periods, '유효한 감각을 남긴 식사 중 비중') };
}

export function resolveDetailCard(state: State, query: DetailQuery): ResolvedDetailCard {
  if (query.id === 'change-experience' || query.id === 'change-presence') return resolveComparisonCard(state, query);
  if (query.id === 'unknown') return {
    id: query.id, title: query.title, meaning: '식사일 미확인 · 전체 기록',
    rows: [{ id: 'unknown', title: '날짜 미확인', value: `${state.unknown.length}개`, detail: '전체 기간에만 포함', entryIDs: state.unknown.map(record => record.id) }],
  };
  if (query.id.startsWith('first/') || query.id.startsWith('repeat/')) {
    const [kind, dimension] = query.id.split('/');
    return { id: query.id, title: query.title, meaning: '확인된 식사일 기준 · 전체 기록과 비교', rows: eventRows(state, dimension, kind === 'first') };
  }
  return buildCards(state, query.category, query).find(card => card.id === query.id)
    ?? buildDiscoveries(state).find(card => card.id === query.id)
    ?? { id: query.id, title: query.title, meaning: '현재 연결된 기록이 없어요', rows: [] };
}

/** Native distribution order; values and unknown categories remain untouched. */
export function orderedDetailSegments(segments: readonly Segment[]) {
  const order = segments.some(segment => ['very_positive', 'very_negative'].includes(segment.key))
    ? ['very_negative', 'negative', 'neutral', 'positive', 'very_positive', 'mixed', 'missing', 'unresolved']
    : segments.some(segment => ['below_preferred', 'just_right', 'above_preferred'].includes(segment.key))
      ? ['below_preferred', 'just_right', 'above_preferred', 'mixed', 'missing', 'unresolved']
      : segments.some(segment => ['weak', 'medium', 'strong'].includes(segment.key))
        ? ['weak', 'medium', 'strong', 'mixed', 'missing', 'unresolved']
        : ['negative', 'neutral', 'positive', 'mixed', 'missing', 'unresolved'];
  const rank = (key: string) => order.includes(key) ? order.indexOf(key) : order.length;
  return [...segments].sort((a, b) => rank(a.key) - rank(b.key));
}

export interface DetailPlotPoint { id: string; label: string; value: number | null; valueLabel: string }
/** Plot supplied numeric counts only; never parse display copy into measurements. */
export function detailPlotPoints(card: ResolvedDetailCard, rowID: string | undefined, records: Data['records']): DetailPlotPoint[] {
  if (card.rows.some(row => row.id.endsWith(':before'))) return [];
  const row = card.rows.find(row => row.id === rowID) ?? card.rows[0];
  if (!row) return [];
  if (card.comparisons?.[row.id]) return card.comparisons[row.id].points;
  if (row.segments?.length) return orderedDetailSegments(row.segments).map(segment => ({ id: segment.key, label: segment.label, value: Number.isFinite(segment.count) && segment.count >= 0 ? segment.count : null, valueLabel: String(segment.count) }));
  // These engine rows express independent meal counts. Change rows express comparisons
  // and must not be recast as a count merely because they also carry evidence IDs.
  if (card.rows.length < 2 || !['menu', 'restaurant', 'foodKind', 'presence'].includes(card.id) && !/^(first|repeat)\//.test(card.id)) return [];
  return card.rows.slice(0, 6).map(item => {
    const ids = new Set(item.entryIDs), source = records.filter(record => ids.has(record.id));
    const value = source.length === ids.size ? mealCount(source) : null;
    return { id: item.id, label: item.title, value, valueLabel: value === null ? '—' : String(value) };
  });
}
