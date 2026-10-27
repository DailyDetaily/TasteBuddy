import { useState, useRef, useEffect } from "react";
import {
  readLegacyBookmarks,
  prepareLegacyBookmarks,
  importLegacyBookmarks,
} from "../../lib/gastronomy/nativeBookmarkImport";
import type { NativeBookmarksController } from "../../lib/gastronomy/useNativeBookmarks";
export default function NativeBookmarkImport({
  owner,
  controller: c,
}: {
  owner: string;
  controller: NativeBookmarksController;
}) {
  const [preview, setPreview] = useState<ReturnType<
      typeof prepareLegacyBookmarks
    > | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null);
  const current = useRef(owner);
  current.current = owner;
  useEffect(() => {
    setPreview(null);
    setConfirmed(false);
    setMessage(null);
  }, [owner]);
  const inspect = () => {
    try {
      setPreview(prepareLegacyBookmarks(readLegacyBookmarks()));
      setConfirmed(false);
      setMessage(null);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  async function save() {
    if (!preview || !confirmed) return;
    setBusy(true);
    try {
      await c.change((s) => {
        if (current.current !== owner)
          throw Error("계정이 바뀌어 가져오기를 멈췄어요.");
        return importLegacyBookmarks(
          s,
          readLegacyBookmarks(),
          preview.signature,
          owner,
        );
      });
      setMessage("가져왔어요. 기존 저장 항목과 이전 원본은 유지했어요.");
      setPreview(null);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-4 rounded-2xl border p-4 text-sm">
      <button className="min-h-11 underline" onClick={inspect}>
        이전 웹 목록 가져오기
      </button>
      {preview && (
        <div className="space-y-3">
          <p>
            리스트 {preview.lists.length}개 · 식당 {preview.records.length}개
          </p>
          <p className="text-xs">
            현재 계정에 이미 있는 식당은 유지해요. 이전 원본은 지우지 않아요.
          </p>
          <ul>
            {preview.lists.map((l) => (
              <li key={l.id}>{l.name}</li>
            ))}
          </ul>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            이 목록은 내가 사용한 기록이며 현재 계정으로 가져옵니다.
          </label>
          <button
            className="min-h-11 rounded-xl bg-[var(--tb-color-interaction-primary)] px-4 text-[var(--tb-color-interaction-on-primary)] disabled:opacity-40"
            disabled={!confirmed || busy}
            onClick={save}
          >
            {busy ? "가져오는 중…" : "가져오기"}
          </button>
          <button
            className="ml-4 min-h-11"
            disabled={busy}
            onClick={() => setPreview(null)}
          >
            취소
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
