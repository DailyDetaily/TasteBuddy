import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { CalendarCheck, ChevronLeft, ChevronRight, Clock3, ImagePlus, MoreHorizontal, Pencil, Plus, SquarePen, Star, Trash2, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import BottomSheetShell, { BottomSheetCloseButton } from '../system/BottomSheetShell';
import PrimaryButton from '../system/PrimaryButton';
import TasteChip from '../system/TasteChip';
import { DrawerTitle, DrawerDescription } from '../ui/drawer';
import { effectiveSelections, nativeRecordPhotoFilenames, swiftTime, type NativeRecord } from '../../lib/gastronomy/nativeRecord';
import { nativeOverallStar } from '../../lib/gastronomy/archiveMenuInsights';
import { deleteNativeRecord } from '../../lib/gastronomy/nativeRecordDeletion';
import { useNativeJournal } from '../../lib/gastronomy/useNativeJournal';
import { swiftDate } from '../../lib/gastronomy/nativeArchive';
import { confirmedMealDateLabel } from './NativeDiningFeedCard';
import useNativeRecordPhotos from './useNativeRecordPhotos';
import './native-dining.css';

const fieldClass = 'min-h-12 w-full rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] px-3 text-[14px]';

function dateInput(entry: NativeRecord) {
  const value = entry.mealTime?.source === 'user_confirmed' && entry.mealTime.start != null ? swiftDate(entry.mealTime.start) : null;
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Option({ icon: Icon, title, description, destructive, disabled, onClick }: {
  icon: LucideIcon; title: string; description: string; destructive?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return <button type="button" className="native-dining-option-row" disabled={disabled} onClick={onClick}>
    <span className={`native-dining-option-icon ${destructive ? 'text-[var(--tb-color-destructive)]' : ''}`}><Icon size={18} strokeWidth={1.8} /></span>
    <span className="min-w-0 flex-1">
      <span className={`block text-[14px] font-semibold ${destructive ? 'text-[var(--tb-color-destructive)]' : ''}`}>{title}</span>
      <span className="mt-1 block text-[11px] leading-4 text-[var(--tb-color-text-hint)]">{description}</span>
    </span>
    <ChevronRight className="shrink-0 text-[var(--tb-color-text-hint)]" size={16} strokeWidth={1.8} />
  </button>;
}

function RecordContent({ owner, entry, onOptions, onPhoto, onInfo, onRate, busy }: {
  owner: string; entry: NativeRecord; onOptions: () => void; onPhoto: () => void; onInfo: () => void;
  onRate: (value: number | null) => void; busy: boolean;
}) {
  const { urls: photos, loading, unavailable, retry } = useNativeRecordPhotos(owner, entry);
  const rating = nativeOverallStar(entry.overallEvaluation);
  const selections = effectiveSelections(entry);
  return <>
    <div className="flex snap-x snap-mandatory overflow-x-auto bg-[var(--tb-color-surface-muted)] no-scrollbar" aria-label="기록 사진">
      {photos.length ? photos.map((url, index) => <img key={url} src={url} className="native-dining-detail-photo" alt={`${entry.menu} 사진 ${index + 1}`} />)
        : <button type="button" disabled={busy || loading} onClick={unavailable ? retry : onPhoto} className="native-dining-detail-photo flex flex-col items-center justify-center gap-3 text-[var(--tb-color-text-hint)]">
          <ImagePlus size={24} strokeWidth={1.8} /><span className="text-[13px]">{loading ? '사진 불러오는 중' : unavailable ? '사진을 불러오지 못했어요 · 다시 시도' : '사진 추가'}</span>
        </button>}
    </div>
    <div className="flex min-h-[40dvh] flex-col gap-4 bg-[var(--tb-color-bg-focus)] px-5 pb-10 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[18px] font-bold leading-6">{entry.menu}</h1>
          {!!entry.restaurant && <p className="mt-1 text-[13px] font-medium text-[var(--tb-color-text-subtle)]">{entry.restaurant}</p>}
        </div>
        {entry.overallEvaluation && rating === null
          ? <TasteChip tone="neutral" taste={typeof entry.overallEvaluation.responseLabelSnapshot === 'string' ? entry.overallEvaluation.responseLabelSnapshot : '전체 평가 미확인'} />
          : <div className="flex shrink-0" role="group" aria-label={`전체 평가 ${rating === null ? '없음' : `${rating}점`}`}>
            {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" disabled={busy}
              aria-label={`${star}점`} aria-pressed={rating === star}
              className="relative flex h-8 w-5 items-center justify-center text-[var(--tb-color-border-default)]"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const next = event.detail > 0 && event.clientX - rect.left < rect.width / 2 ? star - .5 : star;
                onRate(rating === next ? null : next);
              }}>
              <Star size={18} strokeWidth={0} fill="currentColor" />
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-[var(--tb-user-accent-main)]" style={{ width: `${Math.max(0, Math.min(1, (rating ?? 0) - star + 1)) * 100}%` }}>
                <Star className="ml-px shrink-0" size={18} strokeWidth={0} fill="currentColor" />
              </span>
            </button>)}
          </div>}
      </div>
      <button type="button" onClick={onInfo} className="self-start text-[11px] font-medium text-[var(--tb-color-text-muted)]">{confirmedMealDateLabel(entry)}</button>
      {!!selections.length && <div className="flex flex-wrap gap-1.5">{selections.map((selection) => <TasteChip key={selection.selectionInstanceID ?? `${selection.id}:${selection.relatedBubbleID ?? ''}`} taste={selection.labelSnapshot} tone="neutral" />)}</div>}
      <button type="button" onClick={onOptions} className="rounded-[12px] bg-[var(--tb-color-surface-muted)] p-3 text-left text-[14px] leading-[1.48] text-[var(--tb-color-text-subtle)]">
        <span className="font-semibold text-[var(--tb-color-text-primary)]">미식 노트: </span>
        <span className="whitespace-pre-wrap">{entry.note || '아직 남긴 메모가 없어요.'}</span>
      </button>
    </div>
  </>;
}

export default function NativeDiningRecordDetail({ owner, entryID, onClose, onEdit, onAddMenu, initialOptions = false }: {
  owner: string; entryID: string; onClose: () => void; onEdit: (id: string) => void;
  onAddMenu?: (id: string) => void; initialOptions?: boolean;
}) {
  const journal = useNativeJournal(owner);
  const entry = journal.entries.find((item) => item.id === entryID);
  const [options, setOptions] = useState(initialOptions);
  const [editor, setEditor] = useState<{ kind: 'note' | 'info' | 'history'; baseline: NativeRecord; note: string; restaurant: string; date: string } | null>(null);
  const [deleting, setDeleting] = useState<NativeRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const scope = useRef({ owner, entryID, alive: true });
  scope.current.owner = owner; scope.current.entryID = entryID;
  useEffect(() => { scope.current.alive = true; return () => { scope.current.alive = false; }; }, []);
  useEffect(() => { setOptions(initialOptions); setEditor(null); setDeleting(null); setError(null); }, [owner, entryID]);
  const current = () => scope.current.alive && scope.current.owner === owner && scope.current.entryID === entryID;

  const save = async (next: NativeRecord, baseline: NativeRecord, photo?: {filename: string; blob: Blob}) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await journal.commit(next, baseline, photo);
      if (current()) setEditor(null);
    } catch (cause) {
      if (current()) setError(cause instanceof Error ? cause.message : '저장하지 못했어요. 작성한 내용은 유지했어요.');
    } finally { if (current()) setBusy(false); }
  };
  const openEditor = (kind: 'note' | 'info' | 'history') => {
    if (!entry) return;
    setOptions(false); setError(null);
    setEditor({ kind, baseline: structuredClone(entry), note: entry.note, restaurant: entry.restaurant, date: dateInput(entry) });
  };
  const choosePhoto = () => { setOptions(false); photoInput.current?.click(); };
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[79] bg-black/20" />
      <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-[80] bg-[var(--tb-color-bg-focus)] outline-none" onEscapeKeyDown={(event) => { if (options || editor || deleting || busy) event.preventDefault(); }}>
        <Dialog.Title className="sr-only">나의 기록 상세</Dialog.Title>
        <div className="h-full overflow-y-auto no-scrollbar">
          {entry ? <RecordContent owner={owner} entry={entry} onOptions={() => openEditor('note')} onPhoto={choosePhoto} onInfo={() => openEditor('info')} busy={busy}
            onRate={(value) => void save({ ...entry, overallEvaluation: value === null ? null : {
              questionID: 'overall_liking', questionVersion: 'dining-overall-stars/1', questionLabelSnapshot: '이 음식은 전체적으로 어땠나요?',
              responseValue: String(value), responseLabelSnapshot: `${value}점`, target: 'whole_dish', phase: 'unspecified',
            } }, entry)} />
            : <div className="p-5 pt-24"><p role="status">{journal.error ?? (journal.loading ? '기록을 불러오고 있어요.' : '삭제되었거나 현재 계정에서 볼 수 없는 기록이에요.')}</p>{journal.error && <button type="button" className="mt-4 min-h-11" onClick={journal.retry}>다시 시도</button>}</div>}
          {(error || journal.error || journal.archive?.dirty) && <p role={error || journal.error ? 'alert' : 'status'} className="px-5 pb-6 text-[12px] text-[var(--tb-color-text-hint)]">{error ?? journal.error ?? (journal.archive?.remoteEnabled ? '기기에 보관한 기록이에요. 계정 백업을 기다리고 있어요.' : '이 기기에 기록을 보관했어요.')}</p>}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-5 pt-[max(12px,env(safe-area-inset-top))]">
          <button type="button" aria-label="기록 상세 닫기" disabled={busy} className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/40 bg-[var(--tb-color-surface-card)]/85 shadow-sm backdrop-blur-xl" onClick={onClose}><ChevronLeft size={20} strokeWidth={1.8} /></button>
          {entry && <button type="button" aria-label="기록 옵션" className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/40 bg-[var(--tb-color-surface-card)]/85 shadow-sm backdrop-blur-xl" onClick={() => setOptions(true)}><MoreHorizontal size={20} strokeWidth={1.8} /></button>}
        </div>
        <input ref={photoInput} type="file" accept="image/*" aria-label="기록 사진 추가" className="sr-only" disabled={busy} onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (!file || !entry || busy) return;
          const baseline = structuredClone(entry);
          setBusy(true); setError(null);
          try {
            const bitmap = await createImageBitmap(file);
            let blob: Blob;
            try {
              const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
              const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
              const context = canvas.getContext('2d'); if (!context) throw new Error('사진을 읽지 못했어요.');
              context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
              blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('사진을 준비하지 못했어요.')), 'image/jpeg', .86));
            } finally { bitmap.close(); }
            if (!current()) return;
            const filename = `${crypto.randomUUID()}.jpg`;
            const names = [...nativeRecordPhotoFilenames(baseline), filename];
            await journal.commit({ ...baseline, reflectionPhotoFilename: names[0], additionalPhotoFilenames: names.slice(1) }, baseline, { filename, blob });
          } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : '사진을 저장하지 못했어요.'); }
          finally { if (current()) setBusy(false); }
        }} />
        <BottomSheetShell open={options && !!entry} onOpenChange={setOptions} contentClassName="!z-[90] !bg-[var(--tb-color-bg-page)]" overlayClassName="!z-[89]" headerStart={<BottomSheetCloseButton />} headerCenter={<DrawerTitle className="text-[15px] font-bold">기록 옵션</DrawerTitle>}>
          <DrawerDescription className="sr-only">사진과 기록을 수정하거나 삭제할 수 있어요.</DrawerDescription>
          <div className="flex flex-col gap-[10px] overflow-y-auto px-5 pb-10 pt-2">
            <Option icon={SquarePen} title="기록 수정" description="음식과 미각, 전체 평가를 다시 정리합니다" onClick={() => { setOptions(false); onEdit(entryID); }} />
            <Option icon={ImagePlus} title="사진 추가" description="이 음식 기록에 사진을 추가합니다" disabled={busy} onClick={choosePhoto} />
            <Option icon={Pencil} title="메모 수정" description="이 기록에 남긴 메모를 수정합니다" onClick={() => openEditor('note')} />
            <Option icon={CalendarCheck} title="기록 정보 수정" description="식사일과 식당을 수정합니다" onClick={() => openEditor('info')} />
            {!!onAddMenu && <Option icon={Plus} title="메뉴 추가" description="같은 식사에 먹은 다른 메뉴를 기록합니다" onClick={() => { setOptions(false); onAddMenu(entryID); }} />}
            {!!entry?.memoryCorrections?.length && <Option icon={Clock3} title="수정 이력" description="이 기록에서 수정한 내용을 확인합니다" onClick={() => openEditor('history')} />}
            <Option icon={Trash2} title="기록 삭제" description="사진과 음식 기록을 삭제합니다" destructive onClick={() => { if (entry) setDeleting(structuredClone(entry)); setOptions(false); }} />
            <button type="button" className="min-h-12 text-[14px] text-[var(--tb-color-text-hint)]" onClick={() => setOptions(false)}>취소</button>
          </div>
        </BottomSheetShell>
        <BottomSheetShell open={!!editor} onOpenChange={(open) => { if (!open && !busy) setEditor(null); }} contentClassName="!z-[90]" overlayClassName="!z-[89]" headerStart={<BottomSheetCloseButton disabled={busy} />} headerCenter={<DrawerTitle className="text-[15px] font-bold">{editor?.kind === 'note' ? '메모 수정' : editor?.kind === 'info' ? '기록 정보 수정' : '수정 이력'}</DrawerTitle>}>
          <DrawerDescription className="sr-only">현재 계정에 저장된 원본 기록을 확인합니다.</DrawerDescription>
          {editor && <form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8" onSubmit={(event) => {
            event.preventDefault();
            const baseline = editor.baseline;
            if (editor.kind === 'note') void save({ ...baseline, note: editor.note }, baseline);
            else if (editor.kind === 'info') {
              const restaurantChanged = editor.restaurant !== baseline.restaurant;
              const dateChanged = editor.date !== dateInput(baseline);
              void save({ ...baseline, restaurant: editor.restaurant,
                ...(restaurantChanged ? { restaurantID: null, menuItemID: null, foodSource: baseline.foodSource ? { ...baseline.foodSource, restaurantPlace: null } : baseline.foodSource } : {}),
                ...(dateChanged ? { mealTime: editor.date ? { source: 'user_confirmed', start: swiftTime(new Date(`${editor.date}T00:00:00`)), confirmedAt: swiftTime() } : { source: 'unknown' } } : {}),
              }, baseline);
            }
          }}>
            {editor.kind === 'note' ? <label className="text-[14px] font-semibold">메모<textarea autoFocus aria-label="기록 메모" value={editor.note} onChange={(event) => setEditor({ ...editor, note: event.target.value })} className={`${fieldClass} mt-2 min-h-[176px] py-3 font-normal`} placeholder="기억에 남는 맛과 상황을 적어 주세요." /></label>
              : editor.kind === 'info' ? <>
                <label className="text-[14px] font-semibold">식사일<input aria-label="확인한 식사일" type="date" value={editor.date} max={new Date().toLocaleDateString('en-CA')} className={`${fieldClass} mt-2`} onChange={(event) => setEditor({ ...editor, date: event.target.value })} /><span className="mt-2 block text-[12px] font-normal text-[var(--tb-color-text-hint)]">날짜를 모르면 비워두세요.</span></label>
                <label className="text-[14px] font-semibold">식당<input aria-label="기록 식당" value={editor.restaurant} className={`${fieldClass} mt-2`} onChange={(event) => setEditor({ ...editor, restaurant: event.target.value })} /></label>
              </> : <div className="flex flex-col gap-4">{[...(editor.baseline.memoryCorrections ?? [])].reverse().map((correction) => <article key={correction.id} className="rounded-[20px] bg-[var(--tb-color-surface-muted)] p-4 text-[13px]"><p className="text-[11px] text-[var(--tb-color-text-hint)]">{new Date(swiftDate(correction.changedAt)!).toLocaleString('ko-KR')}</p><p className="mt-2">{Object.keys(correction.after).map((key) => ({ note: '메모', restaurant: '식당', menu: '메뉴', mealTime: '식사일', overallEvaluation: '전체 평가', sensorySelections: '미각' })[key] ?? '기록').filter((name, index, list) => list.indexOf(name) === index).join(' · ')}</p>{typeof correction.after.note === 'string' && <p className="mt-2 whitespace-pre-wrap">{correction.after.note}</p>}</article>)}</div>}
            {error && <p role="alert" className="text-[13px] text-[var(--tb-color-destructive)]">{error}</p>}
            {editor.kind !== 'history' && <PrimaryButton type="submit" disabled={busy}>{busy ? '저장 중…' : '저장'}</PrimaryButton>}
          </form>}
        </BottomSheetShell>
        <AlertDialog.Root open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}><AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[95] bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[96] w-[calc(100%-40px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-[var(--tb-color-surface-card)] p-5">
            <AlertDialog.Title className="text-[17px] font-bold">이 미식 기록을 삭제할까요?</AlertDialog.Title><AlertDialog.Description className="mt-3 text-[13px] leading-5">{deleting?.menu} 기록과 연결된 질문 이력을 삭제해요. 다른 메뉴가 쓰는 사진은 유지해요.</AlertDialog.Description>
            {error && <p role="alert" className="mt-3 text-[13px]">{error}</p>}
            <div className="mt-4 flex gap-3"><AlertDialog.Cancel disabled={busy} className="min-h-11 flex-1">취소</AlertDialog.Cancel><button type="button" disabled={busy} className="min-h-11 flex-1 rounded-xl bg-[var(--tb-color-destructive)] text-white" onClick={async () => {
              if (!deleting || busy) return;
              setBusy(true); setError(null);
              try { await journal.changeSnapshot((snapshot) => deleteNativeRecord(snapshot, deleting)); if (current()) onClose(); }
              catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : '삭제하지 못했어요.'); }
              finally { if (current()) setBusy(false); }
            }}>{busy ? '삭제 중…' : '삭제'}</button></div>
          </AlertDialog.Content>
        </AlertDialog.Portal></AlertDialog.Root>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
