import { decodeNativeValue, type NativeSnapshot } from "./nativeRecord";
import type { NativeAnalysisSnapshot } from "./nativeAnalysis";
import { nativeSensoryInsights } from "./nativeSensoryInsights";

export const NATIVE_SAVED_IDS = "tastebuddy.ios.saved-restaurant-ids.v1";
export const NATIVE_BOOKMARKS = "tastebuddy.ios.restaurant-bookmarks.v1";
export const NATIVE_BOOKMARK_LISTS =
  "tastebuddy.ios.restaurant-bookmark-lists.v1";
export interface NativeBookmark {
  restaurantID: string;
  restaurantName: string;
  chefName: string;
  listID: string;
  savedAt: number | null;
}
export interface NativeBookmarkList {
  coverIconID?: string;
  coverTasteID?: string;
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
}
export function readNativeProfileBookmarks(snapshot: NativeSnapshot) {
  const present = [
    NATIVE_SAVED_IDS,
    NATIVE_BOOKMARKS,
    NATIVE_BOOKMARK_LISTS,
  ].some((k) => k in snapshot.values);
  const read = (key: string): unknown[] => {
    if (!(key in snapshot.values)) return [];
    const value = decodeNativeValue(snapshot.values[key]);
    if (!Array.isArray(value))
      throw new Error(
        "저장 식당 정보를 읽지 못했어요. 원본은 유지되어 있어요.",
      );
    return value;
  };
  const saved = read(NATIVE_SAVED_IDS);
  if (saved.some((v) => typeof v !== "string"))
    throw new Error("저장 식당 식별자를 확인해야 해요.");
  const bookmarks = read(NATIVE_BOOKMARKS).map((value): NativeBookmark => {
    const r = value as Record<string, unknown> | null;
    if (
      !r ||
      ["restaurantID", "restaurantName", "chefName", "listID"].some(
        (k) => typeof r[k] !== "string",
      ) ||
      typeof r.savedAt !== "number" ||
      !Number.isFinite(r.savedAt)
    )
      throw new Error("저장 식당 원본을 확인해야 해요.");
    return r as unknown as NativeBookmark;
  });
  const lists = read(NATIVE_BOOKMARK_LISTS).map((value): NativeBookmarkList => {
    const r = value as Record<string, unknown> | null;
    if (
      !r ||
      ["id", "name", "description"].some((k) => typeof r[k] !== "string") ||
      typeof r.isPrivate !== "boolean"
    )
      throw new Error("저장 리스트 원본을 확인해야 해요.");
    return r as unknown as NativeBookmarkList;
  });
  // Native load unions legacy saved IDs with bookmark records. One restaurant remains one saved item.
  const ids = [
    ...new Set([
      ...(saved as string[]),
      ...bookmarks.map((b) => b.restaurantID),
    ]),
  ].sort();
  const records = ids.map(
    (id) =>
      [...bookmarks]
        .filter((b) => b.restaurantID === id)
        .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0] ?? {
        restaurantID: id,
        restaurantName: "",
        chefName: "",
        listID: "default-saved",
        savedAt: null,
      },
  );
  return { present, ids, records, lists };
}
export function nativeProfileActivity(snapshot: NativeAnalysisSnapshot) {
  const sources = new Set(
    snapshot.observations
      .filter(
        (o) =>
          !["sensory_detail", "unresolved"].includes(o.kind) ||
          (o.selectionEvidence &&
            o.selectionEvidence.resolution !== "unresolved"),
      )
      .map((o) => o.experienceId),
  );
  return {
    sourceExperienceCount: sources.size,
    completedExperienceCount: snapshot.completed.length,
    insightCount: nativeSensoryInsights(snapshot.observations).length,
  };
}
export function nativeProfileSummary(
  context: {
    birthDate?: string | null;
    sexContext?: string | null;
    smokingStatus?: string | null;
  },
  restrictions: string[],
) {
  const hasContext =
    context.birthDate != null ||
    context.sexContext != null ||
    context.smokingStatus != null;
  return `${hasContext ? "기준 정보 입력" : "기준 정보 미입력"} · ${restrictions.length ? `식이제한 ${restrictions.length}개` : "식이제한 없음"}`;
}
