import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  swiftTime,
  type NativeSnapshot,
} from "./nativeRecord";
import {
  readNativeBookmarks,
  NATIVE_BOOKMARK_PENDING,
  BOOKMARK_ICONS,
  BOOKMARK_TASTES,
  DEFAULT_NATIVE_LIST,
} from "./nativeBookmarks";
import {
  NATIVE_BOOKMARKS,
  NATIVE_BOOKMARK_LISTS,
  NATIVE_SAVED_IDS,
} from "./nativeProfile";
export const LEGACY_IMPORTS = "tastebuddy.web.bookmark-imports.v1";
export function readLegacyBookmarks() {
  return {
    lists: JSON.parse(
      localStorage.getItem("tastebuddy-restaurant-bookmark-lists-v1") ?? "[]",
    ),
    records: JSON.parse(
      localStorage.getItem("tastebuddy-restaurant-bookmarks-v1") ?? "[]",
    ),
  };
}
export function prepareLegacyBookmarks(raw: {
  lists: unknown;
  records: unknown;
}) {
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.records))
    throw Error("이전 저장 목록을 읽지 못했어요. 원본을 확인해 주세요.");
  const lists = raw.lists.map((l) => {
    if (
      !l ||
      ["id", "name", "description"].some((k) => typeof l[k] !== "string") ||
      !l.id ||
      typeof (l.isPrivate ?? false) !== "boolean"
    )
      throw Error("이전 리스트 정보를 확인해 주세요.");
    return {
      ...l,
      isPrivate: l.isPrivate ?? false,
      coverIconID:
        BOOKMARK_ICONS.find((id) => id === l.coverIconId) ?? "utensils",
      coverTasteID:
        BOOKMARK_TASTES.find((id) => id === l.coverTasteId) ?? "sweet",
    };
  });
  const records = raw.records.map((r) => {
    if (
      !r ||
      ["restaurantId", "restaurantName", "chefName", "listId", "savedAt"].some(
        (k) => typeof r[k] !== "string",
      ) ||
      !r.restaurantId ||
      !Number.isFinite(Date.parse(r.savedAt))
    )
      throw Error("이전 저장 식당 정보를 확인해 주세요.");
    return {
      restaurantID: r.restaurantId,
      restaurantName: r.restaurantName,
      chefName: r.chefName,
      listID: r.listId,
      savedAt: swiftTime(new Date(r.savedAt)),
    };
  });
  for (const [rows, id] of [
    [lists, "id"],
    [records, "restaurantID"],
  ] as const) {
    const seen = new Map();
    for (const row of rows) {
      const key = (row as any)[id];
      if (seen.has(key) && canonical(seen.get(key)) !== canonical(row))
        throw Error("이전 저장 목록에 같은 식별자의 서로 다른 내용이 있어요.");
      seen.set(key, row);
    }
  }
  return {
    lists: [...new Map(lists.map((l) => [l.id, l])).values()],
    records: [...new Map(records.map((r) => [r.restaurantID, r])).values()],
    signature: canonical(raw),
  };
}
export function importLegacyBookmarks(
  s: NativeSnapshot,
  raw: { lists: unknown; records: unknown },
  expected: string,
  owner: string,
  now = new Date(),
): NativeSnapshot {
  const old = prepareLegacyBookmarks(raw);
  if (old.signature !== expected)
    throw Error("이전 저장 목록이 바뀌었어요. 다시 열어 확인해 주세요.");
  const state = readNativeBookmarks(s),
    imports =
      s.values[LEGACY_IMPORTS] === undefined
        ? []
        : decodeNativeValue(s.values[LEGACY_IMPORTS]);
  if (!Array.isArray(imports))
    throw Error("이전 가져오기 이력을 확인해 주세요.");
  if (imports.some((i) => i.signature === expected && i.owner === owner))
    return s;
  const lists = [...state.lists],
    records = [...state.rawRecords],
    pending = [...state.pending];
  const event = (kind: string, restaurantID?: string, listID?: string) => ({
    id: crypto.randomUUID().toUpperCase(),
    kind,
    restaurantID,
    listID,
    createdAt: swiftTime(now),
  });
  for (const list of old.lists) {
    const current = lists.find((l) => l.id === list.id);
    if (
      current &&
      ["name", "description", "isPrivate", "coverIconID", "coverTasteID"].some(
        (k) => (current as any)[k] !== list[k],
      )
    )
      throw Error("같은 식별자의 리스트 내용이 달라요. 원본을 확인해 주세요.");
    if (!current) {
      lists.push(list);
      pending.push(event("createList", undefined, list.id));
    }
  }
  for (const record of old.records) {
    if (state.ids.includes(record.restaurantID)) continue;
    if (
      record.listID !== DEFAULT_NATIVE_LIST &&
      !lists.some((l) => l.id === record.listID)
    )
      throw Error("저장 식당의 리스트를 찾지 못했어요.");
    records.push(record);
    pending.push(event("saveBookmark", record.restaurantID, record.listID));
  }
  const next = {
    ...s,
    values: {
      ...s.values,
      [NATIVE_BOOKMARK_LISTS]: encodeNativeValue(lists),
      [NATIVE_BOOKMARKS]: encodeNativeValue(records),
      [NATIVE_SAVED_IDS]: encodeNativeValue(
        [
          ...new Set([...state.ids, ...records.map((r) => r.restaurantID)]),
        ].sort(),
      ),
      [NATIVE_BOOKMARK_PENDING]: encodeNativeValue(pending),
      [LEGACY_IMPORTS]: encodeNativeValue([
        ...imports,
        {
          owner,
          signature: expected,
          importedAt: now.toISOString(),
          original: raw,
        },
      ]),
    },
  };
  if (new TextEncoder().encode(JSON.stringify(next)).length > 16 * 1024 * 1024)
    throw Error("계정 백업 용량을 초과했어요. 이전 자료는 그대로 있어요.");
  return next;
}
