import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import {
  readNativeRecords,
  type NativeRecord,
  type NativeSnapshot,
} from "../../lib/gastronomy/nativeRecord";
import { readNativeProfileIdentity } from "../../lib/gastronomy/nativeProfileIdentity";
import { DishFeedbackCardSkeleton } from "../dining/DishFeedbackCard";
import NativeDiningFeedCard from "./NativeDiningFeedCard";
import NativeDiningRecordDetail from "./NativeDiningRecordDetail";
import useNativeRecordPhotos from "./useNativeRecordPhotos";
import './native-dining.css';
import type { TasteProfile } from '../system/PalateBloomAvatar';
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
  const { urls: photos } = useNativeRecordPhotos(owner, entry);
  return photos[0] ? <img src={photos[0]} alt={`${entry.menu} 기록 사진`} className="aspect-[4/3] w-full rounded-[18px] object-cover" /> : (fallback ?? null);
}

export default function NativeDiningHome({
  owner,
  active,
  onCreate,
  onEdit,
  onAddMenu,
  onRootViewChange,
  avatarProfile,
  children,
}: {
  owner: string;
  active: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onAddMenu: (id: string) => void;
  onRootViewChange?: (root: boolean) => void;
  avatarProfile?: TasteProfile;
  children: ReactNode;
}) {
  const journal = useNativeJournal(owner, active);
  const [selected, setSelected] = useState<{ id: string; options: boolean } | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  useEffect(() => { setSelected(null); setShareStatus(null); }, [owner]);
  let profile: ReturnType<typeof readNativeProfileIdentity> | null = null;
  try { if (journal.archive) profile = readNativeProfileIdentity(journal.archive.snapshot); } catch { /* The journal displays its validation error below. */ }
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
    <main className="h-full overflow-y-auto bg-[var(--tb-color-bg-page)] px-5 pb-[72px] pt-4">
      <h1 className="mb-3 text-[18px] font-bold leading-[1.2]">나의 디시</h1>
      {shareStatus && <p role="status" className="mb-3 text-[12px] text-[var(--tb-color-text-hint)]">{shareStatus}</p>}
      {journal.loading && !journal.archive && <div role="status" aria-label="기록 불러오는 중" className="flex flex-col gap-3"><DishFeedbackCardSkeleton /><DishFeedbackCardSkeleton /></div>}
      {(journal.error || journal.archive?.dirty) && (
        <div className="mb-4 rounded-[20px] bg-[var(--tb-color-surface-base)] p-4">
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
                    className="mt-3 min-h-11 rounded-full bg-[var(--tb-color-interaction-primary)] px-4 text-[12px] text-[var(--tb-color-interaction-on-primary)]"
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
      {!entries.length && !journal.loading && !journal.error && journal.archive && (
        <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] px-5 py-8 text-center">
          <h2 className="text-[15px] font-semibold">
            첫 미식 기록을 기다리고 있어요
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[var(--tb-color-text-hint)]">
            오늘의 메뉴와 기억에 남은 미각을 남겨보세요.
          </p>
          <button
            type="button"
            className="mt-4 min-h-11 rounded-full bg-[var(--tb-color-interaction-primary)] px-5 text-[13px] text-[var(--tb-color-interaction-on-primary)]"
            onClick={onCreate}
          >
            미식 기록 남기기
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {entries.map((entry) => <NativeDiningFeedCard
          key={entry.id} owner={owner} entry={entry}
          mealCount={entries.filter((candidate) => (candidate.mealID ?? candidate.id) === (entry.mealID ?? entry.id)).length}
          avatarImageSrc={profile?.avatarDataUrl}
          avatarProfile={avatarProfile}
          onSelect={() => setSelected({ id: entry.id, options: false })}
          onOptions={() => setSelected({ id: entry.id, options: true })}
          onShare={() => {
            const text = `${entry.restaurant} ${entry.menu}${entry.note ? `: ${entry.note}` : ''}`.trim();
            void (async () => {
              try {
                if (navigator.share) await navigator.share({ text });
                else { await navigator.clipboard.writeText(text); setShareStatus('기록 요약을 복사했어요.'); }
              } catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setShareStatus('공유하지 못했어요. 다시 시도해 주세요.'); }
            })();
          }}
        />)}
      </div>
      {selected && <NativeDiningRecordDetail key={`${owner}:${selected.id}`} owner={owner} entryID={selected.id} initialOptions={selected.options}
        onClose={() => setSelected(null)} onEdit={(id) => { setSelected(null); onEdit(id); }} onAddMenu={(id) => { setSelected(null); onAddMenu(id); }} />}
      {!!journal.archive?.recoveries?.length && (
        <details className="mt-6 rounded-[20px] bg-[var(--tb-color-surface-base)] p-4">
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
    </main>
  );
}
