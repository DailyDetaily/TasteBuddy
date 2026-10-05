import { deleteNativeRecord } from "../../lib/gastronomy/nativeRecordDeletion";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Pencil, ChevronLeft } from "lucide-react";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import { nativeRepository } from "../../lib/gastronomy/nativeRuntime";
import {
  effectiveSelections,
  readNativeRecords,
  type NativeRecord,
  type NativeSnapshot,
} from "../../lib/gastronomy/nativeRecord";
import { swiftDate } from "../../lib/gastronomy/nativeArchive";
import { getCurrentSupabaseSession, supabase } from "../../lib/supabase";
function RecoveryCopy({ snapshot, recordedAt }: { snapshot: NativeSnapshot; recordedAt: string }) {
  let entries: NativeRecord[] = [];
  let unreadable = false;
  try { entries = readNativeRecords(snapshot); } catch { unreadable = true; }
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ recordedAt, snapshot }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `taste-buddy-recovery-${recordedAt.replace(/[^0-9A-Za-z]/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="mt-4 border-t pt-4">
    <p className="text-[12px]">{new Date(recordedAt).toLocaleString("ko-KR")}</p>
    {unreadable ? <p className="py-3 text-[12px]">읽을 수 없는 기기 원문을 변경 없이 보관했어요. 파일로 저장해 복구에 사용할 수 있어요.</p>
      : entries.map(e => <div key={e.id} className="py-3"><p className="text-[14px] font-semibold">{e.menu}</p><p className="whitespace-pre-wrap text-[12px]">{e.note}</p></div>)}
    <button type="button" className="min-h-11 text-[12px] underline" onClick={download}>원문 파일 저장</button>
  </section>;
}
export function NativeRecordPhoto({
  owner,
  entry,
  fallback,
}: {
  owner: string;
  entry: NativeRecord;
  fallback?: ReactNode;
}) {
  const [value, setValue] = useState<{ key: string; url: string } | null>(null);
  const key = `${owner}/${entry.reflectionPhotoFilename}`;
  useEffect(() => {
    const filename = entry.reflectionPhotoFilename;
    if (!filename) return;
    let cancelled = false;
    let objectURL: string | undefined;
    void (async () => {
      const blob = await nativeRepository.photo(owner, filename);
      if (blob) {
        objectURL = URL.createObjectURL(blob);
        if (cancelled) URL.revokeObjectURL(objectURL);
        else setValue({ key, url: objectURL });
        return;
      }
      const session = await getCurrentSupabaseSession();
      if (
        cancelled ||
        !supabase ||
        session?.user.id !== owner ||
        session.user.is_anonymous
      )
        return;
      const { data } = await supabase.storage
        .from("native-dining-photos")
        .createSignedUrl(`${owner.toLowerCase()}/${filename}`, 120);
      if (data && !cancelled) setValue({ key, url: data.signedUrl });
    })().catch(() => {});
    return () => {
      cancelled = true;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [owner, entry.reflectionPhotoFilename, key]);
  return value?.key === key ? (
    <img
      src={value.url}
      alt={`${entry.menu} 기록 사진`}
      className="aspect-[4/3] w-full rounded-[18px] object-cover"
    />
  ) : (
    (fallback ?? null)
  );
}
export default function NativeDiningHome({
  owner,
  active,
  onCreate,
  onEdit,
  onAddMenu,
  onRootViewChange,
  children,
}: {
  owner: string;
  active: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onAddMenu: (id: string) => void;
  onRootViewChange?: (root: boolean) => void;
  children: ReactNode;
}) {
  const journal = useNativeJournal(owner, active);
  const [deleting, setDeleting] = useState<NativeRecord | null>(null),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState<string | null>(null);
  useEffect(() => {
    setDeleting(null);
    setDeleteError(null);
  }, [owner]);
  const [legacy, setLegacy] = useState(false),
    [compare, setCompare] = useState(false);
  useEffect(() => {
    if (!legacy) onRootViewChange?.(true);
  }, [legacy, onRootViewChange]);
  if (legacy)
    return (
      <div className="flex h-full flex-col">
        <button
          type="button"
          className="flex min-h-11 shrink-0 items-center gap-2 px-5 text-[13px]"
          onClick={() => {
            setLegacy(false);
            onRootViewChange?.(true);
          }}
        >
          <ChevronLeft size={18} />
          나의 디시로 돌아가기
        </button>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    );
  const entries = [...journal.entries].sort(
    (a, b) => (b.observedAt ?? b.date) - (a.observedAt ?? a.date),
  );
  return (
    <main className="h-full overflow-y-auto bg-[var(--tb-color-bg-page)] px-5 pb-8 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">나의 디시</h1>
        <button
          type="button"
          aria-label="새 미식 기록"
          className="flex min-h-11 items-center gap-1 text-[13px]"
          onClick={onCreate}
        >
          <Plus size={18} />
          기록
        </button>
      </div>
      {journal.loading && (
        <p role="status" className="mb-4 text-[12px]">
          기록을 불러오고 있어요.
        </p>
      )}
      {(journal.error || journal.archive?.dirty) && (
        <div className="mb-4 rounded-[20px] bg-white p-4">
          <p
            role={journal.error ? "alert" : "status"}
            className="text-[13px] leading-6"
          >
            {journal.error ?? "기기에 기록을 보관했어요."}
          </p>
          {journal.archive?.conflict ? (
            <>
              <button
                type="button"
                className="min-h-11 text-[12px] underline"
                onClick={() => setCompare((v) => !v)}
              >
                계정 기록과 비교
              </button>
              {compare && (
                <div className="mt-3">
                  <p className="text-[13px] font-semibold">
                    계정에 저장된 기록
                  </p>
                  <ul className="my-3 list-inside list-disc text-[12px]">
                    {readNativeRecords(journal.archive.conflict.snapshot).map(
                      (e) => (
                        <li key={e.id}>
                          {e.restaurant} · {e.menu}
                        </li>
                      ),
                    )}
                  </ul>
                  <p className="text-[12px] leading-5">
                    웹에서 작성한 변경은 아래 ‘따로 보관한 기록’에 남겨둡니다.
                  </p>
                  <button
                    type="button"
                    className="mt-3 min-h-11 rounded-full bg-black px-4 text-[12px] text-white"
                    onClick={() => void journal.useAccount()}
                  >
                    웹 변경을 따로 보관하고 계정 기록 사용
                  </button>
                </div>
              )}
            </>
          ) : journal.archive?.remoteEnabled || journal.error ? (
            <button
              type="button"
              className="min-h-11 text-[12px] underline"
              disabled={journal.loading}
              onClick={() =>
                journal.archive ? void journal.sync() : journal.retry()
              }
            >
              계정 백업 다시 시도
            </button>
          ) : null}
        </div>
      )}
      {!entries.length && !journal.loading && (
        <div className="rounded-[20px] bg-white px-5 py-8 text-center">
          <h2 className="text-[15px] font-semibold">
            첫 미식 기록을 기다리고 있어요
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[var(--tb-color-text-hint)]">
            오늘의 메뉴와 기억에 남은 미각을 남겨보세요.
          </p>
          <button
            type="button"
            className="mt-4 min-h-11 rounded-full bg-black px-5 text-[13px] text-white"
            onClick={onCreate}
          >
            미식 기록 남기기
          </button>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {entries.map((entry) => {
          const count = entries.filter(
            (e) => (e.mealID ?? e.id) === (entry.mealID ?? entry.id),
          ).length;
          return (
            <article
              key={entry.id}
              className="overflow-hidden rounded-[24px] bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] text-[var(--tb-color-text-hint)]">
                  {count > 1 ? `같은 식사 · ${count}개 메뉴` : "미식 기록"}
                </p>
                <button
                  type="button"
                  aria-label={`${entry.menu} 원본 수정`}
                  className="flex size-11 items-center justify-center"
                  onClick={() => onEdit(entry.id)}
                >
                  <Pencil size={18} />
                </button>
              </div>
              <button
                className="min-h-11 text-xs text-red-700"
                aria-label={`${entry.menu} 기록 삭제`}
                onClick={() => {
                  setDeleting(structuredClone(entry));
                  setDeleteError(null);
                }}
              >
                기록 삭제
              </button>
              <NativeRecordPhoto owner={owner} entry={entry} />
              <p className="mt-4 text-[12px] text-[var(--tb-color-text-hint)]">
                {entry.restaurant || "식당 미기록"}
              </p>
              <h2 className="mt-1 text-[18px] font-bold">{entry.menu}</h2>
              {entry.overallEvaluation && (
                <p className="mt-3 text-[14px]">
                  {entry.overallEvaluation.responseLabelSnapshot}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {effectiveSelections(entry).map((s) => (
                  <span
                    key={s.type + s.id}
                    className="rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[11px]"
                  >
                    {s.labelSnapshot}
                  </span>
                ))}
              </div>
              {entry.note && (
                <p className="mt-4 whitespace-pre-wrap text-[14px] leading-6">
                  {entry.note}
                </p>
              )}
              {entry.feedbackStatus === "captured" && (
                <button
                  type="button"
                  className="mt-3 min-h-11 rounded-full bg-black px-4 text-[12px] text-white"
                  onClick={() => onEdit(entry.id)}
                >
                  미각 기록 이어 쓰기
                </button>
              )}
              <p className="mt-4 text-[11px] text-[var(--tb-color-text-hint)]">
                {entry.mealTime?.source === "user_confirmed" &&
                entry.mealTime.start != null
                  ? `식사일 ${new Date(swiftDate(entry.mealTime.start)!).toLocaleDateString("ko-KR")}`
                  : "식사일 미확인"}
              </p>
              <button
                type="button"
                className="mt-3 min-h-11 text-[12px]"
                onClick={() => onAddMenu(entry.id)}
              >
                이 식사에 메뉴 추가
              </button>
              {(entry.memoryCorrections?.length ?? 0) > 0 && (
                <details className="mt-2 text-[12px]">
                  <summary className="min-h-11 cursor-pointer py-3">
                    수정 이력 {entry.memoryCorrections!.length}개
                  </summary>
                  {entry.memoryCorrections!.map((c) => (
                    <p key={c.id} className="py-2">
                      {new Date(swiftDate(c.changedAt)!).toLocaleString(
                        "ko-KR",
                      )}{" "}
                      ·{" "}
                      {Object.keys(c.after)
                        .map(
                          (k) =>
                            ({
                              note: "메모",
                              menu: "메뉴",
                              restaurant: "식당",
                              sensorySelections: "감각 응답",
                              overallEvaluation: "전체 평가",
                              mealTime: "식사 시점",
                              foodSource: "음식 출처",
                              dishKindIDs: "음식 종류",
                            })[k] ?? "기록",
                        )
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(" · ")}
                    </p>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </div>
      {!!journal.archive?.recoveries?.length && (
        <details className="mt-6 rounded-[20px] bg-white p-4">
          <summary className="min-h-11 cursor-pointer text-[13px] font-semibold">
            따로 보관한 기록
          </summary>
          {journal.archive.recoveries.map((r, i) => (
            <RecoveryCopy key={i} snapshot={r.snapshot} recordedAt={r.recordedAt} />
          ))}
        </details>
      )}
      <button
        type="button"
        className="mt-6 min-h-11 text-[12px] text-[var(--tb-color-text-hint)]"
        onClick={() => setLegacy(true)}
      >
        이전 기록·예약 보기
      </button>
      <AlertDialog.Root
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[90] bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-40px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5">
            <AlertDialog.Title className="font-bold">
              이 미식 기록을 삭제할까요?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm">
              {deleting?.menu} 기록과 연결된 질문 이력을 삭제해요. 다른 메뉴가
              쓰는 사진은 유지해요.
            </AlertDialog.Description>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <AlertDialog.Cancel
                disabled={deleteBusy}
                className="min-h-11 flex-1"
              >
                취소
              </AlertDialog.Cancel>
              <button
                disabled={deleteBusy}
                className="min-h-11 flex-1 rounded-xl bg-red-700 text-white"
                onClick={async () => {
                  if (!deleting) return;
                  setDeleteBusy(true);
                  try {
                    await journal.changeSnapshot((s) =>
                      deleteNativeRecord(s, deleting),
                    );
                    setDeleting(null);
                  } catch (e) {
                    setDeleteError((e as Error).message);
                  } finally {
                    setDeleteBusy(false);
                  }
                }}
              >
                {deleteBusy ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
