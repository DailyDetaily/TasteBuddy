import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  swiftTime,
  type NativeSnapshot,
} from "./nativeRecord";
import {
  NATIVE_SAVED_IDS,
  NATIVE_BOOKMARKS,
  NATIVE_BOOKMARK_LISTS,
  readNativeProfileBookmarks,
  type NativeBookmark,
  type NativeBookmarkList,
} from "./nativeProfile";
export const NATIVE_BOOKMARK_PENDING =
  "tastebuddy.ios.restaurant-bookmark-pending-mutations.v1";
export const DEFAULT_NATIVE_LIST = "default-saved";
export const BOOKMARK_ICONS = [
  "beef",
  "cake-slice",
  "coffee",
  "cooking-pot",
  "croissant",
  "cup-soda",
  "dessert",
  "egg-fried",
  "fish",
  "salad",
  "sandwich",
  "soup",
  "utensils",
  "wine",
] as const;
export const BOOKMARK_TASTES = [
  "sweet",
  "sour",
  "bitter",
  "salty",
  "umami",
  "fat",
] as const;
export interface NativeBookmarkMutation {
  id: string;
  kind: string;
  restaurantID?: string | null;
  listID?: string | null;
  createdAt: number;
  [key: string]: unknown;
}
export interface NativeListDraft {
  name: string;
  description?: string;
  isPrivate: boolean;
  coverIconID: string;
  coverTasteID: string;
}
export type NativeBookmarkSeed = Pick<
  NativeBookmark,
  "restaurantID" | "restaurantName" | "chefName"
>;
export function readNativeBookmarks(snapshot: NativeSnapshot) {
  const state = readNativeProfileBookmarks(snapshot);
  const rawRecords =
    snapshot.values[NATIVE_BOOKMARKS] === undefined
      ? []
      : (decodeNativeValue(
          snapshot.values[NATIVE_BOOKMARKS],
        ) as NativeBookmark[]);
  const rawPending =
    snapshot.values[NATIVE_BOOKMARK_PENDING] === undefined
      ? []
      : decodeNativeValue(snapshot.values[NATIVE_BOOKMARK_PENDING]);
  if (
    !Array.isArray(rawPending) ||
    rawPending.some(
      (p) =>
        !p ||
        typeof p !== "object" ||
        typeof p.id !== "string" ||
        !p.id ||
        typeof p.kind !== "string" ||
        typeof p.createdAt !== "number" ||
        !Number.isFinite(p.createdAt) ||
        [p.restaurantID, p.listID].some(
          (v) => v != null && typeof v !== "string",
        ),
    )
  )
    throw Error("저장 변경 이력을 읽지 못했어요. 원본은 유지되어 있어요.");
  const lists = new Map<string, NativeBookmarkList>();
  for (const list of state.lists) {
    if (
      !list.id ||
      (lists.has(list.id) && canonical(lists.get(list.id)) !== canonical(list))
    )
      throw Error(
        "같은 리스트 식별자의 내용이 서로 달라요. 원본을 확인해 주세요.",
      );
    lists.set(list.id, list);
  }
  if (state.ids.some((id) => !id))
    throw Error("저장 식당 식별자를 확인해 주세요.");
  return {
    ...state,
    lists: [...lists.values()],
    rawRecords,
    pending: rawPending as NativeBookmarkMutation[],
  };
}
export function nativeBookmarkSignature(
  snapshot: NativeSnapshot,
  restaurantID: string,
) {
  const state = readNativeBookmarks(snapshot);
  return canonical([
    state.ids.includes(restaurantID),
    state.rawRecords.filter((r) => r.restaurantID === restaurantID),
  ]);
}
export const nativeListSignature = (list: NativeBookmarkList) =>
  canonical(list);
function write(
  snapshot: NativeSnapshot,
  updates: Record<string, unknown>,
): NativeSnapshot {
  const values = { ...snapshot.values };
  for (const [key, value] of Object.entries(updates))
    values[key] = encodeNativeValue(value);
  const next = { ...snapshot, values };
  if (new TextEncoder().encode(JSON.stringify(next)).length > 16 * 1024 * 1024)
    throw Error(
      "계정 백업 용량을 초과해 저장하지 못했어요. 원본은 유지되어 있어요.",
    );
  return canonical(next) === canonical(snapshot) ? snapshot : next;
}
const mutation = (
  kind: string,
  now: Date,
  restaurantID?: string,
  listID?: string,
): NativeBookmarkMutation => ({
  id: crypto.randomUUID().toUpperCase(),
  kind,
  restaurantID,
  listID,
  createdAt: swiftTime(now),
});
export function createNativeBookmarkList(
  snapshot: NativeSnapshot,
  draft: NativeListDraft,
  now = new Date(),
) {
  const state = readNativeBookmarks(snapshot),
    name = draft.name.trim();
  if (!name) throw Error("리스트 이름을 입력해 주세요.");
  if (
    !BOOKMARK_ICONS.some((id) => id === draft.coverIconID) ||
    !BOOKMARK_TASTES.some((id) => id === draft.coverTasteID)
  )
    throw Error("리스트 표지를 확인해 주세요.");
  const id = `list-${name.toLowerCase().replace(/\s+/g, "-")}-${now.getTime()}`;
  if (state.lists.some((l) => l.id === id))
    throw Error("같은 리스트가 이미 만들어졌어요. 다시 확인해 주세요.");
  const list = {
    id,
    name,
    description: draft.description ?? "내 기준으로 다시 살펴볼 레스토랑 리스트",
    isPrivate: draft.isPrivate,
    coverIconID: draft.coverIconID,
    coverTasteID: draft.coverTasteID,
  };
  return {
    list,
    snapshot: write(snapshot, {
      [NATIVE_BOOKMARK_LISTS]: [list, ...state.lists],
      [NATIVE_BOOKMARK_PENDING]: [
        ...state.pending,
        mutation("createList", now, undefined, id),
      ],
    }),
  };
}
export function saveNativeBookmark(
  snapshot: NativeSnapshot,
  seed: NativeBookmarkSeed,
  listID: string,
  expected: string,
  now = new Date(),
  expectedList?: string,
) {
  const state = readNativeBookmarks(snapshot);
  if (
    !seed.restaurantID ||
    typeof seed.restaurantName !== "string" ||
    typeof seed.chefName !== "string"
  )
    throw Error("저장할 식당을 확인해 주세요.");
  if (nativeBookmarkSignature(snapshot, seed.restaurantID) !== expected)
    throw Error(
      "다른 곳에서 이 식당의 저장 상태가 바뀌었어요. 다시 열어 확인해 주세요.",
    );
  if (listID !== DEFAULT_NATIVE_LIST) {
    const target = state.lists.find((l) => l.id === listID);
    if (
      !target ||
      (expectedList !== undefined &&
        nativeListSignature(target) !== expectedList)
    )
      throw Error("선택한 리스트가 바뀌었어요. 다시 확인해 주세요.");
  }
  const current = state.records.find(
    (r) => r.restaurantID === seed.restaurantID,
  );
  const record = { ...current, ...seed, listID, savedAt: swiftTime(now) };
  const records = [
    record,
    ...state.rawRecords.filter((r) => r.restaurantID !== seed.restaurantID),
  ].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
  return write(snapshot, {
    [NATIVE_SAVED_IDS]: [...new Set([...state.ids, seed.restaurantID])].sort(),
    [NATIVE_BOOKMARKS]: records,
    [NATIVE_BOOKMARK_PENDING]: [
      ...state.pending,
      mutation("saveBookmark", now, seed.restaurantID, listID),
    ],
  });
}
export function ensureNativeBookmark(
  snapshot: NativeSnapshot,
  seed: NativeBookmarkSeed,
  now = new Date(),
) {
  if (
    readNativeBookmarks(snapshot).rawRecords.some(
      (r) => r.restaurantID === seed.restaurantID,
    )
  )
    return snapshot;
  return saveNativeBookmark(
    snapshot,
    seed,
    DEFAULT_NATIVE_LIST,
    nativeBookmarkSignature(snapshot, seed.restaurantID),
    now,
  );
}
export function removeNativeBookmark(
  snapshot: NativeSnapshot,
  restaurantID: string,
  expected: string,
  now = new Date(),
) {
  const state = readNativeBookmarks(snapshot);
  if (nativeBookmarkSignature(snapshot, restaurantID) !== expected)
    throw Error(
      "다른 곳에서 이 식당의 저장 상태가 바뀌었어요. 다시 열어 확인해 주세요.",
    );
  if (!state.ids.includes(restaurantID)) return snapshot;
  return write(snapshot, {
    [NATIVE_SAVED_IDS]: state.ids.filter((id) => id !== restaurantID),
    [NATIVE_BOOKMARKS]: state.rawRecords.filter(
      (r) => r.restaurantID !== restaurantID,
    ),
    [NATIVE_BOOKMARK_PENDING]: [
      ...state.pending,
      mutation("removeBookmark", now, restaurantID),
    ],
  });
}
