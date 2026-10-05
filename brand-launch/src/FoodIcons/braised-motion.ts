import {
  FOOD_ICON_PREVIEW_SECONDS,
  foodIconTiming,
  retimeFoodIconSeconds,
} from "./timing";

// Source lid: M4 8 L20 4. Rotate its slope flat and lower its center from y6
// onto the pot rim at y12. Both the lid and its handle share this transform.
export const BRAISED_CLOSED_LID_ANGLE = (Math.atan2(4, 16) * 180) / Math.PI;

const pressureHops = [
  { start: 0.24, duration: 0.32, height: 2, tilt: -2.5 },
  { start: 0.7, duration: 0.38, height: 3.4, tilt: 4 },
  {
    start: 1.22,
    duration: 0.52,
    height: 6,
    tilt: -BRAISED_CLOSED_LID_ANGLE,
  },
  // A light rebound immediately after the largest landing.
  { start: 1.74, duration: 0.18, height: 0.55, tilt: 1.6 },
] as const;

// Keep the pressure hops and final rebound brisk, with longer closed-lid gaps.
const playbackTiming = [
  [0, 0],
  [0.45, 0.24],
  [0.77, 0.56],
  [1.35, 0.7],
  [1.73, 1.08],
  [2.45, 1.22],
  [3.15, 1.92],
  [FOOD_ICON_PREVIEW_SECONDS / 2, 2.5],
] as const;

export const braisedMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { cycleFrames } = foodIconTiming(speed, fps);
  const playbackSeconds = still
    ? 0
    : ((frame % cycleFrames) / cycleFrames) * (FOOD_ICON_PREVIEW_SECONDS / 2);
  const seconds = retimeFoodIconSeconds(playbackSeconds, playbackTiming);
  const hop = pressureHops.find(
    ({ start, duration }) => seconds >= start && seconds < start + duration,
  );
  const progress = hop ? (seconds - hop.start) / hop.duration : 0;
  // A pressure impulse lifts the lid; gravity accelerates it back onto the rim.
  const heightCurve = 4 * progress * (1 - progress);
  // The largest hop reaches the original open-lid pose without overshooting it.
  const amplitude = hop === pressureHops[2] ? Math.min(strength, 1) : strength;
  return {
    lift: (hop?.height ?? 0) * heightCurve * amplitude,
    tilt: (hop?.tilt ?? 0) * heightCurve * amplitude,
  };
};
