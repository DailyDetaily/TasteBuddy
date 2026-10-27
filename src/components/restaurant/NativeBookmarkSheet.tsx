import * as Dialog from "@radix-ui/react-dialog";
import { TASTE_TOKENS } from "../../constants/uiColorTokens";
import ToastSurface from "../system/ToastSurface";
import { useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2, ChefHat, Sparkles, Store } from "lucide-react";
import BottomSheetShell, {
  BottomSheetCloseButton,
} from "../system/BottomSheetShell";
import { DrawerTitle, DrawerDescription } from "../ui/drawer";
import { Switch } from "../ui/switch";
import { ListThumbnail, type BookmarkList } from "./RestaurantBookmarkSheet";
import {
  readNativeBookmarks,
  BOOKMARK_ICONS,
  BOOKMARK_TASTES,
  DEFAULT_NATIVE_LIST,
  createNativeBookmarkList,
  ensureNativeBookmark,
  nativeBookmarkSignature,
  nativeListSignature,
  removeNativeBookmark,
  saveNativeBookmark,
  type NativeBookmarkSeed,
  type NativeListDraft,
} from "../../lib/gastronomy/nativeBookmarks";
import type { NativeBookmarksController } from "../../lib/gastronomy/useNativeBookmarks";
import type { NativeBookmarkList } from "../../lib/gastronomy/nativeProfile";
import type { NativeSnapshot } from "../../lib/gastronomy/nativeRecord";

export function bookmarkThumbnail(list: NativeBookmarkList): BookmarkList {
  return {
    ...list,
    coverIconId:
      BOOKMARK_ICONS.find((id) => id === list.coverIconID) ?? "utensils",
    coverTasteId:
      BOOKMARK_TASTES.find((id) => id === list.coverTasteID) ?? "sweet",
  };
}
export function NativeBookmarkThumbnail({
  list,
}: {
  list: NativeBookmarkList;
}) {
  const legacyIcon =
    list.coverIconID === "chefHat"
      ? ChefHat
      : list.coverIconID === "sparkles"
        ? Sparkles
        : list.coverIconID === "store"
          ? Store
          : undefined;
  return (
    <ListThumbnail list={bookmarkThumbnail(list)} IconOverride={legacyIcon} />
  );
}
const suggestionDescriptions: Record<string, string> = {
  "가보고 싶은 다이닝": "예약 전 다시 판단해볼 후보",
  "나중에 비교할 곳": "메뉴와 내 미각 기준을 더 살펴본 뒤 고를 곳",
  "기준점이 될 수 있는 곳": "내 취향의 기준을 잡을 때 다시 볼 후보",
  "기념일 후보": "차분하게 오래 기억될 식사를 고를 때",
  "셰프 관심 리스트": "셰프의 코스와 감각 흐름을 이어서 보고 싶은 곳",
};
const tastes = ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방감"];
const icons = [
  "고기",
  "케이크",
  "커피",
  "냄비",
  "크루아상",
  "음료",
  "디저트",
  "달걀",
  "생선",
  "샐러드",
  "샌드위치",
  "수프",
  "식기",
  "와인",
];
const suggestions = [
  "가보고 싶은 다이닝",
  "나중에 비교할 곳",
  "기준점이 될 수 있는 곳",
  "기념일 후보",
  "셰프 관심 리스트",
];
const button = "min-h-11 rounded-xl px-4 text-[14px] disabled:opacity-40";

// Mounted for one editing session. The admitted restaurant signature never follows remote updates.
export default function NativeBookmarkSheet({
  controller: c,
  seed,
  ensureOnOpen = false,
  onClose,
}: {
  controller: NativeBookmarksController;
  seed?: NativeBookmarkSeed;
  ensureOnOpen?: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"select" | "create">(
    !seed || !c.state?.lists.length ? "create" : "select",
  );
  const [draft, setDraft] = useState<NativeListDraft>({
    name: "",
    isPrivate: false,
    coverIconID: "utensils",
    coverTasteID: "sweet",
  });
  const coverTrigger = useRef<HTMLButtonElement|null>(null);
  const [cover, setCover] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [signature, setSignature] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialized = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (initialized.current || !c.archive || c.readError) return;
    initialized.current = true;
    if (!seed) return;
    if (!ensureOnOpen) {
      setSignature(
        nativeBookmarkSignature(c.archive.snapshot, seed.restaurantID),
      );
      return;
    }
    setBusy(true);
    c.change((snapshot) => ensureNativeBookmark(snapshot, seed))
      .then((next) => {
        if (alive.current)
          setSignature(
            nativeBookmarkSignature(next.snapshot, seed.restaurantID),
          );
      })
      .catch((e) => {
        if (alive.current) setError(e.message);
      })
      .finally(() => {
        if (alive.current) setBusy(false);
      });
  }, [c.archive, c.readError]);
  const current = c.state?.records.find(
    (r) => r.restaurantID === seed?.restaurantID,
  );
  const ready =
    !!c.archive &&
    !c.readError &&
    !busy &&
    !toast &&
    (!seed || signature !== null);
  async function commit(
    change: (s: NativeSnapshot) => NativeSnapshot,
    stayOpen = false,
  ) {
    setBusy(true);
    setError(null);
    try {
      const next = await c.change(change);
      if (alive.current) {
        const state = readNativeBookmarks(next.snapshot),
          record = state.records.find(
            (r) => r.restaurantID === seed?.restaurantID,
          ),
          list = state.lists.find((l) => l.id === record?.listID);
        if (seed && stayOpen) {
          setSignature(
            nativeBookmarkSignature(next.snapshot, seed.restaurantID),
          );
          return;
        }
        if (seed && !record) {
          onClose();
          return;
        }
        setToast(
          seed
            ? record
              ? `${list?.name ?? "기본 목록"}에 저장됨`
              : "저장한 식당을 해제했어요"
            : `${draft.name.trim()} 리스트를 만들었어요`,
        );
        timer.current = setTimeout(() => {
          if (alive.current) onClose();
        }, 700);
      }
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const create = () => {
    const now = new Date();
    return commit((s) => {
      const next = createNativeBookmarkList(
        s,
        { ...draft, description: suggestionDescriptions[draft.name.trim()] },
        now,
      );
      return seed
        ? saveNativeBookmark(next.snapshot, seed, next.list.id, signature!, now)
        : next.snapshot;
    });
  };
  return (
    <BottomSheetShell
      open
      onOpenChange={(open) => {
        if (!open && !busy && !cover) onClose();
      }}
      dismissible={!busy && !cover}
      headerStart={<BottomSheetCloseButton disabled={busy} />}
      headerCenter={<DrawerTitle>북마크</DrawerTitle>}
      footer={
        mode === "create" ? (
          <div className="flex gap-2">
            <button
              className={`${button} flex-1 bg-[var(--tb-color-surface-muted)]`}
              disabled={busy}
              onClick={() =>
                seed && c.state?.lists.length ? setMode("select") : onClose()
              }
            >
              취소
            </button>
            <button
              className={`${button} flex-1 bg-[var(--tb-color-interaction-primary)] text-[var(--tb-color-interaction-on-primary)]`}
              disabled={!ready || !draft.name.trim()}
              onClick={create}
            >
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        ) : undefined
      }
      bodyClassName="overflow-y-auto px-5 pb-8"
    >
      {toast && (
        <div className="absolute bottom-5 left-5 right-5 z-[65]">
          <ToastSurface className="bg-[var(--tb-color-interaction-primary)] text-[var(--tb-color-interaction-on-primary)]" message={toast} />
        </div>
      )}
      <DrawerDescription className="sr-only">
        저장한 식당의 리스트를 선택하거나 새 리스트를 만들 수 있어요.
      </DrawerDescription>
      {(error || c.readError) && (
        <p role="alert" className="mb-4 text-[13px] text-red-700">
          {error ?? c.readError}
        </p>
      )}
      {!c.archive && <p role="status">저장 목록을 불러오고 있어요.</p>}
      {mode === "create" ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <ListThumbnail
              list={bookmarkThumbnail({
                id: "preview",
                description: "",
                ...draft,
              })}
            />
            <div className="flex-1">
              <p className="font-bold">{draft.name || "새 리스트"}</p>
              <p className="text-xs">
                {draft.isPrivate ? "비밀 리스트" : "공개 리스트"}
              </p>
            </div>
            <button
              className={button}
              ref={coverTrigger}
              onClick={() => setCover(!cover)}
              aria-expanded={cover}
            >
              변경
            </button>
          </div>
          <Dialog.Root open={cover} onOpenChange={setCover}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/35" />
              <Dialog.Content onCloseAutoFocus={e=>{e.preventDefault();coverTrigger.current?.focus();}} className="fixed left-1/2 top-1/2 z-[71] flex max-h-[90dvh] w-[calc(100%-40px)] max-w-[320px] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-[20px] bg-[var(--tb-color-surface-base)] p-5 outline-none">
                <div className="flex items-center justify-between">
                  <Dialog.Close
                    aria-label="커버 편집 닫기"
                    className="min-h-10 min-w-10"
                  >
                    ×
                  </Dialog.Close>
                  <Dialog.Title className="text-[15px] font-bold">
                    커버 편집
                  </Dialog.Title>
                  <Dialog.Close className="min-h-10 text-[13px] font-bold">
                    완료
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  리스트의 아이콘과 배경색을 선택해요.
                </Dialog.Description>
                <div className="flex justify-center">
                  <ListThumbnail
                    className="size-[104px]"
                    iconSize={40}
                    list={bookmarkThumbnail({
                      id: "preview",
                      description: "",
                      ...draft,
                    })}
                  />
                </div>
                <div className="flex justify-center gap-2">
                  {BOOKMARK_TASTES.map((id, i) => (
                    <button
                      key={id}
                      aria-label={tastes[i]}
                      aria-pressed={draft.coverTasteID === id}
                      className={`size-8 shrink-0 rounded-[10px] ${draft.coverTasteID === id ? "ring-4 ring-white outline outline-2 outline-offset-2" : ""}`}
                      style={{
                        backgroundColor: TASTE_TOKENS[id].palette.tintSurface,
                        outlineColor: TASTE_TOKENS[id].palette.main,
                      }}
                      onClick={() => setDraft({ ...draft, coverTasteID: id })}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {BOOKMARK_ICONS.map((id, i) => (
                    <button
                      key={id}
                      aria-label={icons[i]}
                      aria-pressed={draft.coverIconID === id}
                      className="rounded-xl"
                      onClick={() => setDraft({ ...draft, coverIconID: id })}
                    >
                      <ListThumbnail
                        className="aspect-square w-full"
                        style={
                          draft.coverIconID === id
                            ? undefined
                            : {
                                backgroundColor:
                                  "var(--tb-color-surface-muted)",
                                color: "var(--tb-color-icon-primary)",
                              }
                        }
                        list={bookmarkThumbnail({
                          id,
                          description: "",
                          ...draft,
                          coverIconID: id,
                        })}
                      />
                    </button>
                  ))}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <label className="flex flex-col gap-2 text-sm font-bold">
            리스트 이름
            <input
              autoComplete="off"
              className="min-h-12 rounded-xl border p-3 font-normal"
              placeholder="예: 부모님과 가볼 곳"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                className={`${button} bg-[var(--tb-color-surface-muted)] text-left`}
                onClick={() => setDraft({ ...draft, name })}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="flex min-h-14 items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-semibold">
                비밀 리스트로 설정하기
              </span>
              <span className="text-xs text-[var(--tb-color-text-hint)]">
                회원님만 이 리스트를 볼 수 있습니다.
              </span>
            </span>
            <Switch
              aria-label="비밀 리스트로 설정하기"
              size="lg"
              checked={draft.isPrivate}
              onCheckedChange={(isPrivate) => setDraft({ ...draft, isPrivate })}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            className={`${button} flex items-center gap-2`}
            disabled={!ready}
            onClick={() => setMode("create")}
          >
            <Plus size={20} />새 리스트 만들기
          </button>
          {c.state?.lists.map((list) => (
            <div
              key={list.id}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-[var(--tb-color-surface-base)] p-3"
            >
              <button
                disabled={!ready}
                className="flex min-h-11 flex-1 items-center gap-3 text-left disabled:opacity-40"
                aria-pressed={current?.listID === list.id}
                onClick={() => {
                  if (current?.listID !== list.id)
                    void commit((s) =>
                      saveNativeBookmark(
                        s,
                        seed!,
                        list.id,
                        signature!,
                        new Date(),
                        nativeListSignature(list),
                      ),
                    );
                }}
              >
                <NativeBookmarkThumbnail list={list} />
                <span className="flex-1">
                  <span className="block font-semibold">{list.name}</span>
                  <span className="text-xs text-[var(--tb-color-text-hint)]">
                    {list.isPrivate ? "비밀 리스트" : "공개 리스트"}
                  </span>
                </span>
              </button>
              <button
                disabled={!ready}
                aria-label={`${list.name} ${current?.listID === list.id ? "선택 해제" : "선택"}`}
                aria-pressed={current?.listID === list.id}
                className="flex size-11 items-center justify-center rounded-xl border disabled:opacity-40"
                onClick={() =>
                  commit(
                    (s) =>
                      saveNativeBookmark(
                        s,
                        seed!,
                        current?.listID === list.id
                          ? DEFAULT_NATIVE_LIST
                          : list.id,
                        signature!,
                        new Date(),
                        nativeListSignature(list),
                      ),
                    current?.listID === list.id,
                  )
                }
              >
                {current?.listID === list.id ? (
                  <Check size={20} />
                ) : (
                  <Plus size={20} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {seed && c.state?.ids.includes(seed.restaurantID) && (
        <button
          disabled={!ready}
          className={`${button} mt-5 flex items-center justify-center gap-2 text-red-700`}
          onClick={() =>
            commit((s) =>
              removeNativeBookmark(s, seed.restaurantID, signature!),
            )
          }
        >
          <Trash2 size={18} />
          저장한 식당 해제
        </button>
      )}
    </BottomSheetShell>
  );
}
