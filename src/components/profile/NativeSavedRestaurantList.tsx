import NativeBookmarkImport from "./NativeBookmarkImport";
import { lookupSavedPlace } from "../../lib/gastronomy/nativeSavedPlaceLookup";
import {
  resolveNativeSavedPlace,
  readSavedPlaceCache,
  type SavedPlace,
} from "../../lib/gastronomy/nativeSavedPlace";
import type { RestaurantContentCatalog } from "../../lib/tasteBuddySupabase";
import type { ReservationRecord } from "../../constants/reservationCatalog";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { Bookmark, ChevronRight, ArrowLeft } from "lucide-react";
import { useNativeBookmarks } from "../../lib/gastronomy/useNativeBookmarks";
import NativeBookmarkSheet, {
  bookmarkThumbnail,
  NativeBookmarkThumbnail,
} from "../restaurant/NativeBookmarkSheet";
import {
  ListThumbnail,
  loadBookmarkLists,
  loadRestaurantBookmarks,
} from "../restaurant/RestaurantBookmarkSheet";
import { type NativeBookmark } from "../../lib/gastronomy/nativeProfile";
import { swiftDate } from "../../lib/gastronomy/nativeArchive";

export default function NativeSavedRestaurantList({
  owner,
  children,
  catalog,
  reservations,
  onOpenPlace,
  navigation,
  onNavigationChange,
}: {
  owner: string;
  children: ReactNode;
  catalog: RestaurantContentCatalog;
  reservations: ReservationRecord[];
  onOpenPlace: (place: SavedPlace) => void;
  navigation?: { listID: string | null; restaurantID: string | null };
  onNavigationChange?: (value: {
    listID: string | null;
    restaurantID: string | null;
  }) => void;
}) {
  const journal = useNativeBookmarks(owner);
  const alive = useRef(true),
    lookupVersion = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [lookupBusy, setLookupBusy] = useState(false),
    [lookupError, setLookupError] = useState<string | null>(null);
  async function lookup(record: NativeBookmark) {
    const version = ++lookupVersion.current;
    setLookupBusy(true);
    setLookupError(null);
    try {
      const place = await lookupSavedPlace(record);
      if (!alive.current || version !== lookupVersion.current) return;
      if (place) onOpenPlace(place);
      else
        setLookupError(
          "같은 장소를 찾지 못했어요. 저장 정보는 유지되어 있어요.",
        );
    } catch (e) {
      if (alive.current && version === lookupVersion.current)
        setLookupError(
          e instanceof Error ? e.message : "장소를 확인하지 못했어요.",
        );
    } finally {
      if (alive.current && version === lookupVersion.current)
        setLookupBusy(false);
    }
  }
  const [editing, setEditing] = useState<NativeBookmark | "create" | null>(
    null,
  );
  const [legacy, setLegacy] = useState(false);
  const [listID, updateListID] = useState<string | null>(
    navigation?.listID ?? null,
  );
  const setListID = (id: string | null) => {
    updateListID(id);
    onNavigationChange?.({ listID: id, restaurantID: null });
  };
  const [selectedRestaurant, updateSelectedRestaurant] = useState<
    string | null
  >(navigation?.restaurantID ?? null);
  const setSelectedRestaurant = (id: string | null) => {
    ++lookupVersion.current;
    setLookupBusy(false);
    updateSelectedRestaurant(id);
    setLookupError(null);
    onNavigationChange?.({ listID, restaurantID: id });
  };
  const saved = journal.state,
    error = journal.readError;
  if (!journal.archive || error)
    return (
      <div
        className="p-5 text-[13px]"
        role={error || journal.error ? "alert" : "status"}
      >
        {error ?? journal.error ?? "저장 식당을 불러오고 있어요."}
        <button className="ml-2 min-h-11 underline" onClick={journal.retry}>
          다시 시도
        </button>
      </div>
    );
  if (!saved) return null;
  if (legacy)
    return (
      <div className="h-full">
        <button
          className="min-h-11 px-5 text-sm"
          onClick={() => setLegacy(false)}
        >
          새 저장 목록으로
        </button>
        {children}
      </div>
    );
  const sheet = editing && (
    <NativeBookmarkSheet
      key={`${owner}:${editing === "create" ? "create" : editing.restaurantID}`}
      controller={journal}
      seed={editing === "create" ? undefined : editing}
      onClose={() => setEditing(null)}
    />
  );
  const lists = [
    { id: "all", name: "전체", description: "", isPrivate: true },
    ...saved.lists.filter((l) => l.id !== "all"),
  ];
  const active = lists.find((l) => l.id === listID);
  const records = saved.records.filter(
    (r) => !active || active.id === "all" || r.listID === active.id,
  );
  const cachedPlaces = readSavedPlaceCache();
  const resolve = (r: NativeBookmark) =>
    resolveNativeSavedPlace(r, catalog, reservations, readSavedPlaceCache());
  const descriptions = new Map(
    records.map((r) => {
      const result = resolve(r);
      return [
        r.restaurantID,
        result.status === "resolved"
          ? result.place.place?.address || result.place.chefName
          : "",
      ];
    }),
  );
  const open = (r: NativeBookmark) => {
    const result = resolve(r);
    if (result.status === "resolved") onOpenPlace(result.place);
    else setSelectedRestaurant(r.restaurantID);
  };
  const selected = saved.records.find(
    (r) => r.restaurantID === selectedRestaurant,
  );
  if (selected)
    return (
      <main
        aria-label="저장한 식당"
        className="h-full overflow-y-auto bg-[var(--tb-color-bg-page)] px-5 pb-20 pt-5"
      >
        <button
          onClick={() => setSelectedRestaurant(null)}
          className="mb-3 flex min-h-11 items-center gap-2 text-[13px]"
        >
          <ArrowLeft size={18} />
          저장 식당 목록으로
        </button>
        <section className="rounded-[20px] bg-white p-3">
          <h2 className="text-[16px] font-bold">
            {selected.restaurantName || "식당 정보 확인 필요"}
          </h2>
          {selected.chefName && (
            <p className="mt-2 text-[13px]">{selected.chefName}</p>
          )}
          {selected.savedAt != null && (
            <p className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]">
              {new Date(swiftDate(selected.savedAt)!).toLocaleDateString(
                "ko-KR",
              )}{" "}
              저장
            </p>
          )}
          {!selected.restaurantName && (
            <p className="mt-2 break-all text-xs">
              식당 ID: {selected.restaurantID}
            </p>
          )}
          {resolve(selected).status === "resolved" && (
            <button
              className="mt-4 min-h-11 rounded-xl border px-4 text-sm"
              onClick={() => open(selected)}
            >
              장소 상세 보기
            </button>
          )}
          {/^(?:kakao-restaurant-)?\d+$/.test(selected.restaurantID) && (
            <div className="mt-4">
              <p className="text-xs text-[var(--tb-color-text-hint)]">
                저장한 식당 이름과 장소 식별자로 공개 장소 정보를 확인해요.
              </p>
              <button
                disabled={lookupBusy}
                className="min-h-11 text-sm underline"
                onClick={() => lookup(selected)}
              >
                {lookupBusy ? "확인 중…" : "장소 정보 다시 확인"}
              </button>
              {lookupError && (
                <p role="alert" className="text-sm">
                  {lookupError}
                </p>
              )}
            </div>
          )}
          <button
            className="mt-4 min-h-11 rounded-xl bg-black px-4 text-sm text-white"
            onClick={() => setEditing(selected)}
          >
            저장 목록 관리
          </button>
          <p className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]">
            {resolve(selected).status === "ambiguous"
              ? "서로 다른 장소 정보가 연결되어 있어요. 저장 정보는 유지했어요."
              : "연결할 장소 정보를 확인하지 못했어요. 저장 정보는 유지되어 있어요."}
          </p>
        </section>
        {sheet}
      </main>
    );
  return (
    <main
      aria-label="테이스트 리스트"
      className="h-full overflow-y-auto bg-[var(--tb-color-bg-page)] px-5 pb-20 pt-5"
    >
      {active ? (
        <>
          <button
            onClick={() => setListID(null)}
            className="mb-3 flex min-h-11 items-center gap-2 text-[13px]"
          >
            <ArrowLeft size={18} />
            리스트 전체 보기
          </button>
          <h2 className="text-[16px] font-bold">{active.name}</h2>
          <p className="mb-4 mt-1 text-[12px] text-[var(--tb-color-text-hint)]">
            저장 식당 {records.length}개
          </p>
          <div className="flex flex-col gap-3">
            {records.map((r) => (
              <button
                key={r.restaurantID}
                onClick={() => open(r)}
                className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-white p-3 text-left disabled:opacity-70"
              >
                <Bookmark size={20} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">
                    {r.restaurantName || "식당 정보 확인 필요"}
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-[var(--tb-color-text-hint)]">
                    {descriptions.get(r.restaurantID) ||
                      r.chefName ||
                      (r.restaurantName
                        ? "저장한 식당"
                        : `식당 ID: ${r.restaurantID}`)}
                  </span>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          {!records.length && (
            <p
              role="status"
              className="py-6 text-[13px] text-[var(--tb-color-text-hint)]"
            >
              이 리스트에 저장한 식당이 없어요.
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            className="min-h-11 rounded-xl bg-black px-4 text-sm text-white"
            onClick={() => setEditing("create")}
          >
            새 리스트 만들기
          </button>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setListID(list.id)}
              className="flex min-h-[72px] items-center gap-3 rounded-[20px] bg-white p-3 text-left"
            >
              <NativeBookmarkThumbnail list={list} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">
                  {list.name}
                </span>
                <span className="mt-1 block text-[11px] text-[var(--tb-color-text-hint)]">
                  {list.id === "all"
                    ? "저장 식당"
                    : list.isPrivate
                      ? "비밀 리스트"
                      : "공개 리스트"}{" "}
                  ·{" "}
                  {list.id === "all"
                    ? saved!.ids.length
                    : saved!.records.filter((r) => r.listID === list.id).length}
                  개
                </span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      {(loadBookmarkLists().length > 0 ||
        loadRestaurantBookmarks().length > 0) && (
        <button
          className="mt-4 min-h-11 text-sm underline"
          onClick={() => setLegacy(true)}
        >
          이전에 저장한 목록
        </button>
      )}
      <NativeBookmarkImport owner={owner} controller={journal} />
      {sheet}
    </main>
  );
}
