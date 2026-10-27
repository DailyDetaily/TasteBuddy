import { prepare, type Data, type OverallStar, type State } from "./engine";

/** Display values only. Inputs are the existing account's validated records. */
export interface ArchiveMenuGroup {
  id: string;
  label: string;
  mealCount: number;
  entryIDs: string[];
  firstEntryIDs: string[];
}
export interface ArchiveMenuInsights {
  newMenus: ArchiveMenuGroup[];
  familiarMenus: ArchiveMenuGroup[];
  uncertainMenus: ArchiveMenuGroup[];
  repeatedMenus: ArchiveMenuGroup[];
  satisfiedMenus: ArchiveMenuGroup[];
  belowThresholdMenus: ArchiveMenuGroup[];
  unratedMenus: ArchiveMenuGroup[];
  ambiguousRatingMenus: ArchiveMenuGroup[];
  mealCount: number;
  menuCount: number;
  restaurantCount: number;
  unknownDateCount: number;
  unlinkedMenuCount: number;
  unknownDateEntryIDs: string[];
  unlinkedMenuEntryIDs: string[];
}
const unique = <T,>(values: T[]) => [...new Set(values)];
const byID = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function buildArchiveMenuInsights(data: Data, now = new Date()): ArchiveMenuInsights {
  return archiveMenuInsights(prepare(data, "all", "all", now), data.overallStars ?? []);
}

export function archiveMenuInsights(state: State, stars: readonly OverallStar[] = []): ArchiveMenuInsights {
  const records = state.records;
  const start = +new Date(state.now.getFullYear(), state.now.getMonth(), state.now.getDate() - 29);
  const groups = new Map<string, typeof records>();
  for (const row of records) {
    if (!row.menuKey) continue; // A name alone does not establish restaurant/menu identity.
    groups.set(row.menuKey, [...(groups.get(row.menuKey) ?? []), row]);
  }
  const starGroups = new Map<string, OverallStar[]>();
  for (const star of stars) starGroups.set(star.id, [...(starGroups.get(star.id) ?? []), star]);
  const validStars = [...starGroups.values()].filter(rows => rows.every(row =>
    row.entryID === rows[0].entryID && row.value === rows[0].value
  )).map(rows => rows[0]).filter(row => Number.isFinite(row.value)
    && row.value >= 0.5 && row.value <= 5 && Number.isInteger(row.value * 2));
  const result: ArchiveMenuInsights = {
    newMenus: [], familiarMenus: [], uncertainMenus: [], repeatedMenus: [],
    satisfiedMenus: [], belowThresholdMenus: [], unratedMenus: [], ambiguousRatingMenus: [],
    mealCount: unique(records.map(row => row.mealID)).length,
    menuCount: groups.size,
    restaurantCount: unique(records.flatMap(row => row.restaurantKey ? [row.restaurantKey] : [])).length,
    unknownDateCount: records.filter(row => !row.date).length,
    unlinkedMenuCount: records.filter(row => !row.menuKey).length,
    unknownDateEntryIDs: records.filter(row => !row.date).map(row => row.id).sort(),
    unlinkedMenuEntryIDs: records.filter(row => !row.menuKey).map(row => row.id).sort(),
  };
  for (const [id, source] of groups) {
    const rows = [...source].sort(byID);
    const dates = rows.flatMap(row => row.date ? [Date.parse(row.date)] : []);
    const firstDate = dates.length ? Math.min(...dates) : null;
    const firstRows = firstDate === null ? [] : rows.filter(row => row.date && Date.parse(row.date) === firstDate);
    const group: ArchiveMenuGroup = {
      id, label: rows[0].menu + (rows[0].restaurant ? " · " + rows[0].restaurant : " · 직접 만든 요리"),
      mealCount: unique(rows.map(row => row.mealID)).length,
      entryIDs: rows.map(row => row.id),
      firstEntryIDs: firstRows.map(row => row.id),
    };
    if (group.mealCount >= 2) result.repeatedMenus.push(group);
    if (!dates.some(date => date >= start)) continue;
    if (firstDate !== null && firstDate < start) {
      result.familiarMenus.push(group);
    } else if (rows.some(row => !row.date)) {
      result.uncertainMenus.push(group);
    } else {
      result.newMenus.push(group);
      const answers = unique(validStars.filter(star => group.firstEntryIDs.includes(star.entryID)).map(star => star.value));
      if (unique(firstRows.map(row => row.mealID)).length !== 1 || answers.length > 1) {
        result.ambiguousRatingMenus.push(group);
      } else if (answers.length === 0) {
        result.unratedMenus.push(group);
      } else {
        (answers[0] >= 4 ? result.satisfiedMenus : result.belowThresholdMenus).push(group);
      }
    }
  }
  for (const key of ["newMenus", "familiarMenus", "uncertainMenus", "satisfiedMenus",
    "belowThresholdMenus", "unratedMenus", "ambiguousRatingMenus"] as const) result[key].sort(byID);
  result.repeatedMenus.sort((a, b) => b.mealCount - a.mealCount || byID(a, b));
  result.repeatedMenus = result.repeatedMenus.slice(0, 3);
  return result;
}

/** Exact source schema; the older five-category scale must never become stars. */
export function nativeOverallStar(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const e = value as Record<string, unknown>;
  if (e.unparsedPayload != null || e.questionID !== "overall_liking"
      || e.questionVersion !== "dining-overall-stars/1"
      || e.questionLabelSnapshot !== "이 음식은 전체적으로 어땠나요?"
      || e.target !== "whole_dish" || e.phase !== "unspecified"
      || typeof e.responseValue !== "string") return null;
  const rating = Number(e.responseValue);
  return Number.isFinite(rating) && rating >= 0.5 && rating <= 5
    && Number.isInteger(rating * 2) && String(rating) === e.responseValue
    && e.responseLabelSnapshot === e.responseValue + "점" ? rating : null;
}
