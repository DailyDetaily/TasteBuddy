import {
  DINING_SELECTION_CATALOG,
  ALL_DINING_SELECTION_CATALOG,
  DINING_SELECTION_VERSION,
  parseStructuredSelections,
} from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { SENSORY_V2_VERSION, makeSensoryV2Selection, sensoryV2Entry } from '../sensoryV2.mjs';
import { nativeOverallStar } from "./archiveMenuInsights";
import {
  DINING_OVERALL_QUESTION,
  DINING_OVERALL_RESPONSES,
  DINING_OVERALL_VERSION,
  parseOverallEvaluation,
} from "../../../scripts/tba-platform-pilot/dining-overall-evaluation.mjs";
export const DINING_KEY = "tastebuddy.ios.dining-entries.v1";
export const ANDROID_ARCHIVE_KEY = "tastebuddy.android.archive.v1";
export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue };
export interface SensorySelection {
  id: string;
  type: string;
  catalogVersion: string;
  labelSnapshot: string;
  liking?: string | null;
  intensity?: string | null;
  preferenceFit?: string | null;
  target: string;
  phase: string;
  relatedBubbleID?: string | null;
  selectionInstanceID?: string | null;
  definitionVersion?: string | null;
  bindingMode?: string | null;
  scopeKind?: string | null;
  relatedBubbleLabelSnapshot?: string | null;
  [key: string]: unknown;
}
export interface NativeRecord {
  id: string;
  mealID: string;
  restaurant: string;
  restaurantID?: string | null;
  menu: string;
  menuItemID?: string | null;
  date: number;
  observedAt: number;
  savedAt?: number;
  updatedAt?: number;
  rating: number;
  note: string;
  tasteExperienceIDs: string[];
  detailTagIDs: string[];
  dishKindIDs: string[];
  sensorySelections?: SensorySelection[] | null;
  overallEvaluation?: Record<string, any> | null;
  feedbackStatus: string;
  reflectionPhotoFilename?: string | null;
  additionalPhotoFilenames?: string[] | null;
  mealTime?: {
    source: string;
    start?: number | null;
    end?: number | null;
    confirmedAt?: number | null;
    [key: string]: unknown;
  } | null;
  foodSource?: {
    kind: string;
    homeCookingID?: string | null;
    restaurantNamespace?: string | null;
    restaurantPlace?: {
      name: string;
      address: string;
      kakaoPlaceID?: string | null;
      googlePlaceID?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      phone?: string | null;
    } | null;
    version: number;
    [key: string]: unknown;
  } | null;
  memoryRevision?: number;
  memoryCorrections?: Correction[];
  [key: string]: any;
}
export function nativeRecordPhotoFilenames(entry: NativeRecord): string[] {
  return [...new Set([entry.reflectionPhotoFilename, ...(entry.additionalPhotoFilenames ?? [])]
    .filter((name): name is string => name != null))];
}
export interface Correction {
  id: string;
  revision: number;
  changedAt: number;
  before: Record<string, any>;
  after: Record<string, any>;
  [key: string]: unknown;
}
export interface NativeSnapshot {
  schemaVersion: number;
  values: Record<string, string>;
  hasSeenOnboarding?: boolean;
  photoFilenames: string[];
  [key: string]: unknown;
}
export const swiftTime = (date = new Date()) =>
  (date.getTime() - Date.UTC(2001, 0, 1)) / 1000;
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
}
export function encodeNativeValue(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768)
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}
export function decodeNativeValue(value: string): unknown {
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
    ),
  );
}
export const blankSnapshot = (): NativeSnapshot => ({
  schemaVersion: 2,
  values: {},
  hasSeenOnboarding: false,
  photoFilenames: [],
});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const stringList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
export function androidArchivePhotoFilenames(snapshot: NativeSnapshot): string[] {
  const encoded = snapshot.values[ANDROID_ARCHIVE_KEY];
  if (encoded === undefined) return [];
  let archive: unknown;
  try { archive = decodeNativeValue(encoded); } catch {
    throw new Error("Android 백업을 읽지 못해 원본을 유지했어요.");
  }
  if (!object(archive) || archive.schemaVersion !== 1 || !object(archive.state) ||
      !stringList(archive.photoFilenames) ||
      archive.photoFilenames.some((name: string) => !/^[A-Za-z0-9_-]{1,251}\.jpg$/.test(name)))
    throw new Error("현재 버전에서 읽을 수 없는 Android 백업이에요. 원본을 유지했어요.");
  return archive.photoFilenames;
}
function readableSourceFields(value: Record<string, any>): boolean {
  return (
    ["tasteExperienceIDs", "detailTagIDs", "dishKindIDs", "additionalPhotoFilenames"].every(
      (key) => value[key] == null || stringList(value[key]),
    ) &&
    (value.sensorySelections == null ||
      (Array.isArray(value.sensorySelections) &&
        value.sensorySelections.every(
          (selection: unknown) =>
            object(selection) &&
            ["id", "type", "catalogVersion", "labelSnapshot", "target", "phase"].every(
              (key) => typeof selection[key] === "string",
            ),
        ))) &&
    ["overallEvaluation", "mealTime", "foodSource"].every(
      (key) => value[key] == null || object(value[key]),
    )
  );
}
export function readNativeRecords(snapshot: NativeSnapshot): NativeRecord[] {
  if (
    !snapshot ||
    ![1, 2].includes(snapshot.schemaVersion) ||
    !snapshot.values ||
    typeof snapshot.values !== "object" ||
    Array.isArray(snapshot.values) ||
    Object.values(snapshot.values).some(value => typeof value !== "string" || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) ||
    typeof snapshot.hasSeenOnboarding !== "boolean" ||
    !stringList(snapshot.photoFilenames) ||
    new Set(snapshot.photoFilenames).size !== snapshot.photoFilenames.length ||
    snapshot.photoFilenames.some(name => !/^[A-Za-z0-9_-]{1,251}\.jpg$/.test(name))
  )
    throw new Error(
      "현재 버전에서 읽을 수 없는 계정 백업이에요. 원본을 유지했어요.",
    );
  if (androidArchivePhotoFilenames(snapshot).some(name => !snapshot.photoFilenames.includes(name)))
    throw new Error("Android 사진의 백업 목록이 일치하지 않아 원본을 유지했어요.");
  if (snapshot.values[DINING_KEY] === undefined) return [];
  let entries: unknown;
  try {
    entries = decodeNativeValue(snapshot.values[DINING_KEY]);
  } catch {
    throw new Error("저장된 원본을 읽지 못했어요. 기존 기록을 유지했어요.");
  }
  if (!Array.isArray(entries))
    throw new Error("저장된 원본 목록을 읽지 못했어요.");
  for (const e of entries)
    if (
      !object(e) ||
      !uuid.test(e.id) ||
      typeof e.menu !== "string" ||
      typeof e.restaurant !== "string" ||
      !Number.isFinite(e.date) ||
      typeof e.note !== "string" ||
      !Number.isInteger(e.rating) ||
      (e.mealID != null && !uuid.test(e.mealID)) ||
      !readableSourceFields(e) ||
      (e.memoryCorrections != null &&
        (!Array.isArray(e.memoryCorrections) ||
          !e.memoryCorrections.every(
            (correction: unknown) =>
              object(correction) &&
              Number.isFinite(correction.changedAt) &&
              Number.isInteger(correction.revision) &&
              object(correction.before) &&
              object(correction.after) &&
              readableSourceFields(correction.before) &&
              readableSourceFields(correction.after),
          )))
    )
      throw new Error("일부 원본을 읽지 못해 변경을 저장하지 않았어요.");
  if (new Set(entries.map((e) => e.id.toLowerCase())).size !== entries.length)
    throw new Error("같은 식별자의 원본이 겹쳐 변경을 저장하지 않았어요.");
  // Optional unknown fields and original array order are preserved on every write.
  return entries as NativeRecord[];
}
export function newNativeRecord(
  meal?: NativeRecord,
  now = new Date(),
): NativeRecord {
  const id = crypto.randomUUID().toUpperCase(),
    time = meal?.observedAt ?? meal?.date ?? swiftTime(now);
  return {
    id,
    mealID: meal?.mealID ?? meal?.id ?? id,
    restaurant: meal?.restaurant ?? "",
    restaurantID: meal?.restaurantID ?? null,
    menu: "",
    date: time,
    observedAt: time,
    rating: 0,
    note: "",
    tasteExperienceIDs: [],
    detailTagIDs: [],
    dishKindIDs: [],
    sensorySelections: [],
    overallEvaluation: null,
    feedbackStatus: "completed",
    mealTime: meal?.mealTime ?? null,
    foodSource: meal?.foodSource
      ? { ...meal.foodSource, homeCookingID: null }
      : null,
  };
}
export function makeSelection(id: string, type: string): SensorySelection {
  if (sensoryV2Entry(id)?.type === type) return makeSensoryV2Selection(id);
  const c = DINING_SELECTION_CATALOG.find(
    (c) => c.id === id && c.type === type,
  );
  if (!c) throw new Error("선택 목록을 다시 확인해 주세요.");
  return {
    id: c.id,
    type: c.type,
    catalogVersion: DINING_SELECTION_VERSION,
    labelSnapshot: c.label,
    target: "unspecified",
    phase: "unspecified",
  };
}
export function effectiveSelections(entry: NativeRecord): SensorySelection[] {
  if (Array.isArray(entry.sensorySelections)) return entry.sensorySelections;
  return [
    ...(entry.tasteExperienceIDs ?? []).map((id) => ({ id, type: "bubble" })),
    ...(entry.detailTagIDs ?? []).map((id) => ({ id, type: "detailTag" })),
  ].map((s) => {
    const definition = DINING_SELECTION_CATALOG.find(c => c.id === s.id && c.type === s.type);
    return {id:s.id,type:s.type,catalogVersion:DINING_SELECTION_VERSION,labelSnapshot:definition?.label??s.id,target:'unspecified',phase:'unspecified'};
  });
}
export function overallEvaluation(value: string) {
  const response = DINING_OVERALL_RESPONSES[value];
  if (!response) throw new Error("음식 전체 평가를 다시 골라주세요.");
  return {
    questionID: "overall_liking",
    questionVersion: DINING_OVERALL_VERSION,
    questionLabelSnapshot: DINING_OVERALL_QUESTION,
    responseValue: value,
    responseLabelSnapshot: response.label,
    target: "whole_dish",
    phase: "unspecified",
  };
}
const sourceKeys = [
  "restaurant",
  "restaurantID",
  "menu",
  "menuItemID",
  "note",
  "observedAt",
  "mealTime",
  "foodSource",
  "sensorySelections",
  "sensoryPresentation",
  "overallEvaluation",
  "tasteExperienceIDs",
  "detailTagIDs",
  "dishKindIDs",
  "feedbackStatus",
];
const erased = (v: unknown) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0);
export function prepareNativeRecord(
  candidate: NativeRecord,
  previous?: NativeRecord,
  now = new Date(),
): NativeRecord {
  if (
    !uuid.test(candidate.id) ||
    !uuid.test(candidate.mealID ?? candidate.id) ||
    !candidate.menu.trim()
  )
    throw new Error("메뉴 이름을 입력해 주세요.");
  const entry: NativeRecord = {
    ...candidate,
    menu: candidate.menu.trim(),
    restaurant: candidate.restaurant.trim(),
    mealID: candidate.mealID ?? candidate.id,
  };
  if (
    !Number.isFinite(entry.observedAt ?? entry.date) ||
    !Number.isInteger(entry.rating)
  )
    throw new Error("원본의 시간 또는 기록 형식을 확인해 주세요.");
  // Unchanged unknown selections remain intact; only edited choices must pass current validation.
  if (
    canonical(entry.sensorySelections) !==
      canonical(previous?.sensorySelections) &&
    entry.sensorySelections
  ) {
    const changed = entry.sensorySelections.filter(
      (s) =>
        !(previous ? effectiveSelections(previous) : []).some(
          (p) => canonical(p) === canonical(s),
        ),
    );
    for (const s of changed) {
      if(s.type==='detailTag'&&s.id.startsWith('custom:')&&s.labelSnapshot.trim()&&s.id.endsWith(`:${s.labelSnapshot}`))continue;
      const definition = ALL_DINING_SELECTION_CATALOG.find(
        (c) => c.id === s.id && c.type === s.type,
      );
      if (
        !definition ||
        s.catalogVersion !== definition.catalogVersion ||
        (s.catalogVersion === SENSORY_V2_VERSION && s.definitionVersion !== sensoryV2Entry(s.id)?.definitionVersion) ||
        s.labelSnapshot !== definition.label
      )
        throw new Error("선택 목록을 다시 확인해 주세요.");
      const allowed = {
        liking: ["liked", "neutral", "disliked"],
        intensity: ["light", "medium", "strong"],
        preferenceFit: ["tooWeak", "justRight", "tooStrong"],
      };
      for (const [field, values] of Object.entries(allowed))
        if (s[field] != null && !values.includes(String(s[field])))
          throw new Error("선택한 감각 응답을 다시 확인해 주세요.");
    }
  }
  if (
    entry.overallEvaluation &&
    canonical(entry.overallEvaluation) !==
      canonical(previous?.overallEvaluation) &&
    parseOverallEvaluation(entry.overallEvaluation).unresolved.length &&
    nativeOverallStar(entry.overallEvaluation) === null
  )
    throw new Error("음식 전체 평가를 다시 확인해 주세요.");
  if (
    entry.mealTime?.source === "user_confirmed" &&
    (!Number.isFinite(entry.mealTime.start) ||
      entry.mealTime.start! > swiftTime(now))
  )
    throw new Error("확인한 식사일은 오늘까지 선택할 수 있어요.");
  if (
    entry.mealTime?.source === "user_confirmed" &&
    Number.isFinite(entry.mealTime.start)
  )
    entry.observedAt = entry.mealTime.start!;
  entry.date = entry.observedAt;
  if (!previous)
    return {
      ...entry,
      savedAt: entry.savedAt ?? swiftTime(now),
      memoryRevision: 0,
    };
  if (
    previous.id !== entry.id ||
    (previous.mealID && previous.mealID !== entry.mealID)
  )
    throw new Error("기록의 식사 연결이 변경되었어요.");
  const changed = sourceKeys.filter(
    (k) => canonical(previous[k] ?? null) !== canonical(entry[k] ?? null),
  );
  if (
    !changed.length &&
    entry.reflectionPhotoFilename === previous.reflectionPhotoFilename &&
    canonical(entry.additionalPhotoFilenames ?? []) === canonical(previous.additionalPhotoFilenames ?? [])
  )
    return previous;
  const cleared = changed.filter(
    (k) =>
      !["mealTime", "observedAt"].includes(k) &&
      erased(entry[k]) &&
      !(
        k === "sensorySelections" &&
        entry[k] == null &&
        (entry.tasteExperienceIDs?.length ?? 0) +
          (entry.detailTagIDs?.length ?? 0) >
          0
      ),
  );
  const history = structuredClone(previous.memoryCorrections ?? []);
  for (const correction of history)
    for (const key of cleared) {
      delete correction.before[key];
      delete correction.after[key];
    }
  const revision = (previous.memoryRevision ?? 0) + 1;
  history.push({
    id: crypto.randomUUID().toUpperCase(),
    revision,
    changedAt: swiftTime(now),
    before: Object.fromEntries(
      changed
        .filter((k) => !cleared.includes(k))
        .map((k) => [k, previous[k] ?? null]),
    ),
    after: Object.fromEntries(changed.map((k) => [k, entry[k] ?? null])),
  });
  return {
    ...entry,
    tbaAnalysisSnapshot:
      revision !== (previous.memoryRevision ?? 0)
        ? null
        : entry.tbaAnalysisSnapshot,
    savedAt: previous.savedAt,
    updatedAt: swiftTime(now),
    memoryRevision: revision,
    memoryCorrections: history,
  };
}
export function replaceNativeRecord(
  snapshot: NativeSnapshot,
  candidate: NativeRecord,
  expected: NativeRecord | null,
  now = new Date(),
): NativeSnapshot {
  const records = readNativeRecords(snapshot);
  const index = records.findIndex((r) => r.id === candidate.id);
  if (
    (expected === null && index >= 0) ||
    (expected !== null &&
      (index < 0 || canonical(records[index]) !== canonical(expected)))
  )
    throw new Error(
      "원본이 변경되었거나 현재 계정에 없는 기록이에요. 다시 열어 확인해 주세요.",
    );
  const next = prepareNativeRecord(
    candidate,
    index < 0 ? undefined : records[index],
    now,
  );
  const values =
    index < 0
      ? [next, ...records]
      : records.map((r, i) => (i === index ? next : r));
  return {
    ...snapshot,
    schemaVersion: 2,
    values: { ...snapshot.values, [DINING_KEY]: encodeNativeValue(values) },
  };
}
