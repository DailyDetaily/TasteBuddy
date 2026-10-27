import { useEffect, useRef, useState } from "react";
import {
  readPhotoHints,
  photoRestaurantCandidates,
} from "../../lib/gastronomy/nativePhotoHints";
export default function NativePhotoHints({
  file,
  onMenu,
  onRestaurant,
}: {
  file: File;
  onMenu: (text: string) => void;
  onRestaurant: (id: string, name: string) => void;
}) {
  const abort = useRef<AbortController | null>(null),
    alive = useRef(true);
  const [hints, setHints] = useState<Awaited<
      ReturnType<typeof readPhotoHints>
    > | null>(null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState<string | null>(null),
    [places, setPlaces] = useState<
      Awaited<ReturnType<typeof photoRestaurantCandidates>>
    >([]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      abort.current?.abort();
    };
  }, []);
  async function read() {
    setBusy(true);
    setError(null);
    abort.current?.abort();
    const a = new AbortController();
    abort.current = a;
    try {
      const value = await readPhotoHints(file, a.signal, setProgress);
      if (alive.current && !a.signal.aborted) setHints(value);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function search(query: string) {
    setBusy(true);
    setError(null);
    try {
      let location = hints?.location;
      if (!location)
        location = await new Promise<GeolocationCoordinates>(
          (resolve, reject) => {
            if (!navigator.geolocation) {
              reject(
                Error("위치를 확인하지 못했어요. 식당을 직접 검색해 주세요."),
              );
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (p) => resolve(p.coords),
              () =>
                reject(
                  Error("위치를 확인하지 못했어요. 식당을 직접 검색해 주세요."),
                ),
              { timeout: 8000, maximumAge: 60000 },
            );
          },
        );
      const rows = await photoRestaurantCandidates(query, location);
      if (alive.current) {
        setPlaces(rows);
        if (!rows.length)
          setError("주변 식당을 찾지 못했어요. 식당을 직접 검색해 주세요.");
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border p-3 text-sm">
      <p className="text-xs text-[var(--tb-color-text-hint)]">
        사진 글자는 기기에서 읽어요. 메뉴는 선택한 문구만 반영해요.
      </p>
      <button className="min-h-11 underline" disabled={busy} onClick={read}>
        {busy
          ? `사진 확인 중 ${Math.round(progress * 100)}%`
          : "사진 글자 읽기"}
      </button>
      {error && <p role="alert">{error}</p>}
      {hints && (
        <>
          <p className="text-xs">
            {hints.lines.length
              ? "사진에서 읽은 글자"
              : "읽을 수 있는 글자를 찾지 못했어요."}
          </p>
          {hints.lines.map((line) => (
            <div
              key={line}
              className="mt-2 flex items-center justify-between gap-2"
            >
              <span className="break-all">{line}</span>
              <button
                className="min-h-11 shrink-0 underline"
                onClick={() => onMenu(line)}
              >
                메뉴로 사용
              </button>
            </div>
          ))}
          <p className="mt-3 text-xs">
            주변 식당 찾기는 사진 위치 또는 허용한 현재 위치와 검색어를 공개
            장소 검색에 사용해요.
          </p>
          <button
            disabled={busy}
            className="min-h-11 underline"
            onClick={() => search(hints.lines[0] ?? "음식점")}
          >
            주변 식당 찾기
          </button>
          {places.map((p) => (
            <button
              key={p.placeId}
              className="block min-h-11 w-full rounded-xl bg-[var(--tb-color-surface-base)] p-3 text-left"
              onClick={() => onRestaurant(p.placeId, p.name)}
            >
              {p.name}
              <span className="block text-xs">{p.address}</span>
            </button>
          ))}
        </>
      )}
    </section>
  );
}
