const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const progress = (time: number, start: number, duration: number) =>
  smooth((time - start) / duration);

export type ResultCardPhase = "entrance" | "complete";

export const RESULT_CARD_ENTRANCE_SECONDS = 1.66;

// Source symbol -> merged annulus -> card frame. The inner opening follows
// the outside by 0.06s, then the whole photo resolves from blur.
// Only the merge and frame expansion are sped up; focus lasts 0.34 seconds.
export const resultCardBloom = (
  elapsed: number,
  phase: ResultCardPhase = "entrance",
) => {
  const t = phase === "complete" ? RESULT_CARD_ENTRANCE_SECONDS : elapsed;
  return {
    opacity: progress(t, 0.02, 0.22),
    symbolScale: 0.78 + 0.22 * progress(t, 0.02, 0.28),
    merge: progress(t, 0.38, 0.22),
    outer: progress(t, 0.64, 0.3),
    inner: progress(t, 0.7, 0.3),
    reveal: {
      surface: progress(t, 1.36, 0.1),
      photoVisible: t >= 1.02,
      photo: progress(t, 1.02, 0.34),
      title: progress(t, 1.12, 0.28),
      reactions: progress(t, 1.2, 0.28),
      details: progress(t, 1.28, 0.28),
      note: progress(t, 1.36, 0.28),
    },
  };
};

export const resultChromeOpacity = (elapsed: number, fromPreview = false) =>
  progress(elapsed, fromPreview ? 0.5 : RESULT_CARD_ENTRANCE_SECONDS, 0.3);
