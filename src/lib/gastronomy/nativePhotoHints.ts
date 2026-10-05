import { supabase } from "../supabase";
export function photoTextLines(text: string) {
  return [
    ...new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 2 && line.length <= 80),
    ),
  ].slice(0, 20);
}
export async function readPhotoHints(
  file: File,
  signal: AbortSignal,
  onProgress: (value: number) => void,
) {
  const { createWorker } = await import("tesseract.js");
  const { gps } = await import("exifr");
  if (signal.aborted) throw Error("사진 확인을 취소했어요.");
  const location = await gps(file).catch(() => undefined);
  const worker = await createWorker(["kor", "eng"], 1, {
    workerPath: "/ocr/v7/worker.min.js",
    corePath: "/ocr/v7",
    langPath: "/ocr/v7",
    logger: (m) => {
      if (m.status === "recognizing text" && !signal.aborted)
        onProgress(m.progress);
    },
  });
  const cancel = () => {
    void worker.terminate();
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    if (signal.aborted) throw Error("사진 확인을 취소했어요.");
    const result = await worker.recognize(file);
    return {
      lines: photoTextLines(result.data.text),
      location:
        location &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude)
          ? location
          : null,
    };
  } finally {
    signal.removeEventListener("abort", cancel);
    await worker.terminate();
  }
}
export async function photoRestaurantCandidates(
  query: string,
  location: { latitude: number; longitude: number },
): Promise<Array<{ placeId: string; name: string; address: string | null }>> {
  if (!supabase) throw Error("식당 검색 연결을 확인해 주세요.");
  if (
    !Number.isFinite(location.latitude) ||
    Math.abs(location.latitude) > 90 ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.longitude) > 180
  )
    throw Error("사진 위치를 확인하지 못했어요.");
  const { data, error } = await supabase.functions.invoke(
    "kakao-place-lookup",
    {
      body: {
        query: query.trim() || "음식점",
        includeCandidates: true,
        x: String(location.longitude),
        y: String(location.latitude),
        radius: 700,
      },
    },
  );
  if (error) throw Error("주변 식당을 불러오지 못했어요.");
  const places = (Array.isArray(data?.places) ? data.places : [])
    .filter(
      (p: any) =>
        p &&
        typeof p.placeId === "string" &&
        /^\d+$/.test(p.placeId) &&
        typeof p.name === "string" &&
        p.name.trim(),
    )
    .slice(0, 8) as Array<{
    placeId: string;
    name: string;
    address: string | null;
  }>;
  return !places.length && query.trim() && query.trim() !== "음식점"
    ? photoRestaurantCandidates("음식점", location)
    : places;
}
