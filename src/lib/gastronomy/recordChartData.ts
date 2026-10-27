import { ALL_DISH_KIND_OPTIONS } from "../../constants/dishKindTags";
import { prepare, type Data, type State } from './engine';
import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';

/** Shared with TBRecordChartData. Counts are dishes, not meals or inferred taste scores. */
export const RECORD_CHART_SOURCES = [
  { id: 'homeCooked', label: '직접 만든 요리', axis: 'umami' as TasteId },
  { id: 'restaurant', label: '식당 음식', axis: 'sweet' as TasteId },
  { id: 'unknown', label: '출처 미확인', axis: 'fat' as TasteId },
] as const;
export const RECORD_CHART_HEATMAP_STEPS = [80, 60, 40, 20, 0] as const;

const localDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayDate = (date: Date, offset = 0) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

export function recordChartDataFromState(state: State) {
  const now = state.now, today = dayDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const recordsByDay = new Map<string, typeof state.records>();
  for (const record of state.records) {
    // prepare() has excluded conflicting identities and future meal dates.
    if (!record.date) continue;
    const date = new Date(record.date);
    if (!Number.isFinite(+date) || date > now) continue;
    const key = localDay(date);
    recordsByDay.set(key, [...(recordsByDay.get(key) ?? []), record]);
  }
  const month = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const rows = recordsByDay.get(localDay(date)) ?? [];
    return { date: localDay(date), count: date > today ? null : rows.length, entryIDs: rows.map(row => row.id) };
  });
  const currentDays = Array.from({ length: 7 }, (_, i) => localDay(dayDate(now, i - 6)));
  const previousDays = Array.from({ length: 7 }, (_, i) => localDay(dayDate(now, i - 13)));
  const current = currentDays.map(day => (recordsByDay.get(day) ?? []).length);
  const previous = previousDays.map(day => (recordsByDay.get(day) ?? []).length);
  const monthRows = month.flatMap(day => recordsByDay.get(day.date) ?? []);
  const sourceKey = (source: string) => source === 'restaurant' || source === 'homeCooked' ? source : 'unknown';
  const series = RECORD_CHART_SOURCES.map(source => ({ ...source,
    values: currentDays.map(day => (recordsByDay.get(day) ?? []).filter(row => sourceKey(row.source) === source.id).length),
    value: monthRows.filter(row => sourceKey(row.source) === source.id).length,
  }));
  const kindMap = new Map<string, { id: string; label: string; value: number }>();
  let unclassifiedFoodCount = 0;
  for (const record of monthRows) {
    const kinds = new Map((record.foodKindIDs ?? record.foodKinds).flatMap(key => {
      const kind = ALL_DISH_KIND_OPTIONS.find(option => option.id === key || option.label === key);
      return kind ? [[kind.id, kind] as const] : [];
    }));
    if (!kinds.size) unclassifiedFoodCount++;
    for (const kind of kinds.values()) kindMap.set(kind.id, { id: kind.id, label: kind.label, value: (kindMap.get(kind.id)?.value ?? 0) + 1 });
  }
  const foodKinds = [...kindMap.values()].sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, 3).map(kind => ({ ...kind, axis: 'umami' as TasteId, dishKindId: kind.id }));
  // Explicit presence counts per meal, never intensity/liking scores or inferred absence.
  const presence = state.observations.filter(o => o.facet === 'presence' && o.value === 'present');
  const observedEntries = new Set(presence.map(o => o.entryID));
  const presenceByTaste = new Map(TASTE_IDS.map(axis => [axis, new Set(presence
    .filter(o => o.attribute === (axis === 'fat' ? 'mouthfeel.fatty' : `taste.${axis}`)).map(o => o.entryID))]));
  const areaDays = currentDays.slice(-4);
  const areaComparisonDays = Array.from({ length: 4 }, (_, i) => localDay(dayDate(now, i - 7)));
  const areaAllDays = [...areaComparisonDays, ...areaDays];
  const countTaste = (axis: TasteId, day: string): number | null => {
    const rows = recordsByDay.get(day) ?? [];
    if (rows.length && !rows.some(row => observedEntries.has(row.id))) return null;
    return new Set(rows.filter(row => presenceByTaste.get(axis)!.has(row.id)).map(row => row.mealID)).size;
  };
  const sensorySeries = TASTE_IDS.map(axis => ({
    id: axis, axis, taste: TASTE_TOKENS[axis].label,
    values: areaDays.map(day => countTaste(axis, day)),
    comparisonValues: areaComparisonDays.map(day => countTaste(axis, day)),
    value: areaAllDays.reduce((sum, day) => sum + (countTaste(axis, day) ?? 0), 0),
  })).filter(series => series.value > 0)
    .sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 3);
  const areaRecords = areaAllDays.flatMap(day => recordsByDay.get(day) ?? []);
  const observedMeals = new Set(areaRecords.filter(row => observedEntries.has(row.id)).map(row => row.mealID));
  const sensoryUnobservedMeals = new Set(areaRecords.filter(row => !observedMeals.has(row.mealID)).map(row => row.mealID)).size;
  const total = month.reduce((sum, day) => sum + (day.count ?? 0), 0);
  return {
    monthLabel: `${now.getFullYear()}년 ${now.getMonth() + 1}월`,
    startDay: (monthStart.getDay() + 6) % 7,
    month, total, series, current, previous, currentDays, previousDays, foodKinds, unclassifiedFoodCount,
    sensorySeries, areaDays, areaComparisonDays, sensoryUnobservedMeals,
    // Four points match the existing compact line chart's visible capacity.
    lineValues: current.slice(-4), lineDays: currentDays.slice(-4),
    absolute: total ? series.filter(source => source.id !== 'unknown').map(source => ({ ...source, value: source.value / total * 100 })) : [],
    unknownDateCount: state.unknown.length, futureCount: state.future.length,
    entryIDs: month.flatMap(day => day.entryIDs),
  };
}
export type RecordChartData = ReturnType<typeof recordChartDataFromState>;
export function buildRecordChartData(data: Data, now = new Date()): RecordChartData {
  return recordChartDataFromState(prepare(data, 'all', 'all', now));
}
