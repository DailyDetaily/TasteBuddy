import {
  FOOD_ICON_PREVIEW_SECONDS,
  foodIconTiming,
  retimeFoodIconSeconds,
} from "./timing";

// The working end stays inside the mortar as its pivot travels with the grind.
export const PESTLE_PIVOT = { x: 11.5, y: 15.5 };

// Longer lifts and pauses, but each downward strike still lasts 0.154 seconds.
// Two uninterrupted grinding turns get four seconds, followed by a soft return.
const playbackTiming = [
  [0, 0],
  [0.5, 0.3],
  [1, 0.586],
  [1.154, 0.74],
  [1.5, 0.82],
  [2, 1.106],
  [2.154, 1.26],
  [2.35, 1.36],
  [2.75, 1.6],
  [6.75, 4.2],
  [7.6, 4.8],
  [FOOD_ICON_PREVIEW_SECONDS, 5],
] as const;

const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const spiceMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconTiming(speed, fps);
  const playbackSeconds = still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) *
      FOOD_ICON_PREVIEW_SECONDS;
  const seconds = retimeFoodIconSeconds(playbackSeconds, playbackTiming);

  let lift = 0;
  for (const start of [0.3, 0.82]) {
    const progress = (seconds - start) / 0.44;
    if (progress <= 0 || progress >= 1) continue;
    // A deliberate lift followed by a quicker downward strike.
    lift =
      2.2 *
      strength *
      (progress < 0.65
        ? smooth(0, 0.65, progress)
        : 1 - smooth(0.65, 1, progress));
  }

  // Match the broth spoon's broad, flat ellipse and its brief speed ramps.
  // Keep the radius constant through the orbit; only ease in and out at its
  // right edge so the middle of the grinding gesture does not shrink.
  // The 2.6-second keyframe span occupies four seconds of the playback loop.
  const grindClock = Math.max(0, Math.min(1, (seconds - 1.6) / 2.6));
  const grindProgress =
    grindClock < 0.1
      ? grindClock ** 2 / 0.18
      : grindClock > 0.9
        ? 1 - (1 - grindClock) ** 2 / 0.18
        : (grindClock - 0.05) / 0.9;
  const grindEnvelope =
    smooth(1.36, 1.6, seconds) * (1 - smooth(4.2, 4.8, seconds));
  const grindPhase = grindProgress * Math.PI * 4;
  const reach = Math.cos(grindPhase) * strength * grindEnvelope;
  const depth = Math.sin(grindPhase) * strength * grindEnvelope;

  return {
    // Hold the upright, pre-strike pose between cycles instead of tilting
    // back to the source SVG and immediately standing up again.
    x: 0.5 + 2.7 * reach,
    y: 0.5 - lift + 0.58 * depth,
    angle: -32 + 23 * reach,
  };
};
