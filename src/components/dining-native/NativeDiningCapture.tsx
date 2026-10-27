import type { NativeRecord } from "../../lib/gastronomy/nativeRecord";
import { useEffect, useRef, useState } from "react";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import NativeDiningEditor from "./NativeDiningEditor";
import NativeDiningCameraSource from './NativeDiningCameraSource';
export interface NativeCaptureRequest {
  seed?: Pick<NativeRecord, "restaurant"> &
    Partial<Pick<NativeRecord, "menu" | "restaurantID" | "foodSource">>;
  entryID?: string;
  mealEntryID?: string;
}
export default function NativeDiningCapture({
  owner,
  request,
  onClose,
  onSaved,
}: {
  owner: string;
  request: NativeCaptureRequest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mounted = useRef(true);
  const [camera, setCamera] = useState(!request.entryID && !request.mealEntryID && !request.seed);
  const [initialPhoto, setInitialPhoto] = useState<File | undefined>();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const journal = useNativeJournal(owner);
  const original = request.entryID
    ? journal.entries.find((e) => e.id === request.entryID)
    : undefined;
  const meal = request.mealEntryID
    ? journal.entries.find((e) => e.id === request.mealEntryID)
    : undefined;
  if (camera) return <NativeDiningCameraSource onClose={onClose} onManual={() => setCamera(false)} onPhoto={(file) => { setInitialPhoto(file); setCamera(false); }} />;
  if (
    !journal.canEdit ||
    (request.entryID && !original) ||
    (request.mealEntryID && !meal)
  )
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="미식 기록 준비"
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-[var(--tb-color-bg-page)] p-5"
      >
        <p role="status" className="text-[14px]">
          {journal.error ??
            (journal.loading
              ? "기록을 준비하고 있어요"
              : "연결된 원본 기록을 찾지 못했어요.")}
        </p>
        <button type="button" className="min-h-11" onClick={journal.retry}>
          다시 시도
        </button>
        <button type="button" className="min-h-11" onClick={onClose}>
          닫기
        </button>
      </div>
    );
  return (
    <NativeDiningEditor
      owner={owner}
      original={original}
      initialPhoto={initialPhoto}
      seed={request.seed}
      meal={meal}
      entries={journal.entries}
      onClose={onClose}
      onSave={async (...args) => {
        await journal.commit(...args);
        if (mounted.current) onSaved();
      }}
    />
  );
}
