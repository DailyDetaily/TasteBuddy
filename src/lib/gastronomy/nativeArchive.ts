import {
  DINING_SELECTION_CATALOG,
  DINING_SELECTION_VERSION,
  parseStructuredSelections,
} from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { parseOverallEvaluation } from "../../../scripts/tba-platform-pilot/dining-overall-evaluation.mjs";
import { DISH_KIND_OPTIONS } from "../../constants/dishKindTags";
import type { Data, Facet, Observation, OverallStar, RecordRow } from "./engine";
import { nativeOverallStar } from "./archiveMenuInsights";
const object = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
const text = (value: unknown) => (typeof value === "string" ? value : "");
const SWIFT_EPOCH_MS = Date.UTC(2001, 0, 1);
export function swiftDate(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(SWIFT_EPOCH_MS + value * 1000);
  return Number.isFinite(+date) ? date.toISOString() : null;
}
const facets: Record<string, Facet> = {
  sensory_presence: "presence",
  sensory_intensity: "intensity",
  attribute_liking: "liking",
  preference_fit: "fit",
  overall_liking: "overall",
};
/** Swift Data is base64 JSON with dates in seconds since 2001, not Unix time. Never writes the native snapshot. */
export function decodeNativeAccount(payload: unknown, now = new Date()): Data {
  if (
    !object(payload) ||
    ![1, 2].includes(payload.schemaVersion) ||
    !object(payload.values)
  )
    throw new Error("현재 웹앱에서 읽을 수 없는 계정 백업 버전이에요.");
  const encoded = payload.values["tastebuddy.ios.dining-entries.v1"];
  if (encoded == null)
    return { records: [], observations: [], sourceRecordCount: 0 };
  if (typeof encoded !== "string")
    throw new Error("네이티브 원본 기록을 읽지 못했어요.");
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const entries: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  if (!Array.isArray(entries))
    throw new Error("네이티브 원본 기록을 읽지 못했어요.");
  const records: RecordRow[] = [],
    observations: Observation[] = [], overallStars: OverallStar[] = [];
  for (const e of entries) {
    if (
      !object(e) ||
      typeof e.id !== "string" ||
      typeof e.restaurant !== "string" ||
      typeof e.menu !== "string"
    )
      throw new Error("일부 네이티브 원본을 읽지 못했어요.");
    const observedAt = swiftDate(e.observedAt ?? e.date);
    if (!observedAt || Date.parse(observedAt) > +now) continue;
    const selections = Array.isArray(e.sensorySelections)
      ? e.sensorySelections
      : [
          ...strings(e.tasteExperienceIDs).map((id) => ({
            id,
            type: "bubble",
          })),
          ...strings(e.detailTagIDs).map((id) => ({ id, type: "detailTag" })),
        ].flatMap((s) => {
          const entry = DINING_SELECTION_CATALOG.find(
            (c) => c.id === s.id && c.type === s.type,
          );
          return entry
            ? [
                {
                  ...s,
                  catalogVersion: DINING_SELECTION_VERSION,
                  labelSnapshot: entry.label,
                },
              ]
            : [];
        });
    const parsed = parseStructuredSelections(selections);
    const overall = e.overallEvaluation
      ? parseOverallEvaluation(e.overallEvaluation)
      : { observations: [] };
    const source =
      e.foodSource?.kind === "homeCooked"
        ? "homeCooked"
        : e.foodSource?.kind === "restaurant"
          ? "restaurant"
          : "unknown";
    const restaurantKey =
      source !== "homeCooked" && text(e.restaurantID).trim()
        ? JSON.stringify([
            text(e.foodSource?.restaurantNamespace) || "tastebuddy.restaurant",
            e.restaurantID,
          ])
        : null;
    const menuToken = text(e.menuItemID).trim()
      ? ["id", e.menuItemID]
      : e.menu.trim()
        ? ["name", e.menu.trim().normalize("NFC")]
        : null;
    const menuKey =
      source === "homeCooked" && text(e.foodSource?.homeCookingID).trim()
        ? JSON.stringify(["homeCooked", e.foodSource.homeCookingID])
        : restaurantKey && menuToken
          ? JSON.stringify([restaurantKey, menuToken])
          : null;
    const confirmedAt = swiftDate(e.mealTime?.confirmedAt);
    records.push({
      id: `native:${e.id}`,
      fingerprint: JSON.stringify(e),
      mealID: `native:${text(e.mealID) || e.id}`,
      menu: e.menu,
      restaurant: source === "homeCooked" ? "" : e.restaurant,
      menuKey,
      restaurantKey,
      foodKindIDs: strings(e.dishKindIDs),
      foodKinds: strings(e.dishKindIDs).flatMap((id) => {
        const k = DISH_KIND_OPTIONS.find((k) => k.id === id);
        return k ? [k.label] : [];
      }),
      date:
        e.mealTime?.source === "user_confirmed" &&
        (!confirmedAt || Date.parse(confirmedAt) <= +now)
          ? swiftDate(e.mealTime?.start)
          : null,
      savedAt: swiftDate(e.savedAt) ?? observedAt,
      note: text(e.note),
      labels: selections
        .filter(object)
        .map((s) => text(s.labelSnapshot))
        .filter(Boolean),
      source,
    });
    if ((e.feedbackStatus ?? "completed") !== "completed") continue;
    const star = nativeOverallStar(e.overallEvaluation);
    const overallCorrection = Array.isArray(e.memoryCorrections)
      ? [...e.memoryCorrections].reverse().find(c => object(c)
        && object(c.before) && object(c.after)
        && JSON.stringify(c.before.overallEvaluation) !== JSON.stringify(c.after.overallEvaluation))
      : null;
    const overallKnownAt = swiftDate(overallCorrection?.changedAt
      ?? (e.memoryCorrections == null ? e.updatedAt ?? e.savedAt : e.savedAt)) ?? observedAt;
    if (star !== null && Date.parse(overallKnownAt) <= +now) overallStars.push({
      id: "native:" + e.id + ":overall-stars", entryID: "native:" + e.id, value: star,
    });
    for (const [i, o] of [
      ...parsed.observations,
      ...overall.observations,
    ].entries()) {
      if (
        !facets[o.kind] ||
        o.attribute?.endsWith(".unspecified") ||
        (o.kind === "sensory_presence" && o.value !== true)
      )
        continue;
      observations.push({
        id: `native:${e.id}:${i}`,
        entryID: `native:${e.id}`,
        facet: facets[o.kind],
        attribute: o.attribute ?? "overall",
        reference: o.reference,
        label: o.reference ?? nativeAttributeLabel(o.attribute ?? ""),
        value: o.kind === "sensory_presence" ? "present" : String(o.value),
        target: o.target ?? "unspecified",
        phase: o.phase ?? "unspecified",
        selection: JSON.stringify([
          o.selectionEvidence?.type,
          o.selectionEvidence?.selectionID,
          o.selectionEvidence?.catalogVersion,
          o.selectionEvidence?.relatedBubbleID ?? "",
          ...(o.selectionEvidence?.selectionInstanceID != null ? [o.selectionEvidence.selectionInstanceID] : []),
        ]),
      });
    }
  }
  return { records, observations, overallStars, sourceRecordCount: entries.length };
}
function nativeAttributeLabel(attribute: string) {
  const labels: Record<string, string> = {
    "taste.sweet": "단맛",
    "taste.sour": "신맛",
    "taste.bitter": "쓴맛",
    "taste.salty": "짠맛",
    "taste.umami": "감칠맛",
    "mouthfeel.fatty": "지방감",
    "texture.soft": "부드러움",
    "texture.smooth": "매끄러움",
    "texture.chewy": "쫄깃함",
    "texture.crisp": "바삭함",
    "texture.moist": "수분감",
    "mouthfeel.coating": "입안을 감싸는 느낌",
    "aroma.roasted": "구운 향",
    "aroma.smoky": "훈연 향",
    "aroma.herbal": "허브 향",
    "aroma.fermented": "발효 향",
    "aroma.fruity": "과일 향",
    "aroma.nutty": "견과 향",
    "aroma.marine": "바다 향",
  };
  return labels[attribute] ?? (attribute ? "선택한 감각" : "음식 전체");
}
