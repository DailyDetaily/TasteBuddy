export const FOOD_ICON_FPS = 60;
// Existing keyframes use a 2.5-second half-cycle authoring clock.
// Keep it separate from playback length so extending the preview does not
// change emission counts, gesture order, or loop boundaries.
export const FOOD_ICON_CYCLE_SECONDS = 2.5;
export const FOOD_ICON_PREVIEW_SECONDS = 10;

const timingForSeconds = (seconds: number, speed: number, fps: number) => {
  // Quantize the common 2.5-second unit once so all loop boundaries remain
  // aligned at fractional speeds such as 1.1x, without changing motion rates.
  const unitFrames = Math.max(
    1,
    Math.round((FOOD_ICON_CYCLE_SECONDS * fps) / speed),
  );
  const cycleFrames = (unitFrames * seconds) / (FOOD_ICON_CYCLE_SECONDS * 2);
  return { cycleFrames, durationInFrames: cycleFrames * 2 };
};

export const foodIconTiming = (speed: number, fps = FOOD_ICON_FPS) =>
  timingForSeconds(FOOD_ICON_PREVIEW_SECONDS, speed, fps);

// Restore the original 2.5/5-second motions independently of the grid length.
export const foodIconOriginalTiming = (speed: number, fps = FOOD_ICON_FPS) =>
  timingForSeconds(FOOD_ICON_CYCLE_SECONDS * 2, speed, fps);

export const BROTH_PREVIEW_SECONDS = 10;
export const brothTiming = (speed: number, fps = FOOD_ICON_FPS) =>
  timingForSeconds(BROTH_PREVIEW_SECONDS, speed, fps);

export const FOOD_ICON_GRID_SECONDS = 10;
export const foodIconGridTiming = (speed: number, fps = FOOD_ICON_FPS) =>
  timingForSeconds(FOOD_ICON_GRID_SECONDS, speed, fps);

const originalTimingIds = new Set([
  "dessert",
  "fruit",
  "beverage_pairing",
  "noodle",
  "grilled",
  "seaweed",
  "smoked",
  "steamed",
  "stir_fried_wok",
]);
const halfCycleIds = new Set(["noodle", "seaweed", "braised", "pancake"]);

export const foodIconSingleTiming = (
  iconId: string,
  speed: number,
  fps = FOOD_ICON_FPS,
) => {
  const timing =
    iconId === "broth"
      ? brothTiming(speed, fps)
      : originalTimingIds.has(iconId)
        ? foodIconOriginalTiming(speed, fps)
        : foodIconTiming(speed, fps);
  return {
    ...timing,
    durationInFrames: halfCycleIds.has(iconId)
      ? timing.cycleFrames
      : timing.durationInFrames,
  };
};

// Redistribute time around fast actions. Adjacent keys with equal time deltas
// retain the original action speed; longer playback spans give holds room.
export const retimeFoodIconSeconds = (
  seconds: number,
  keys: readonly (readonly [playback: number, motion: number])[],
) => {
  for (let index = 1; index < keys.length; index++) {
    const [end, to] = keys[index];
    if (seconds > end) continue;
    const [start, from] = keys[index - 1];
    const progress = Math.max(
      0,
      Math.min(1, (seconds - start) / (end - start)),
    );
    return from + (to - from) * progress;
  }
  return keys[keys.length - 1][1];
};
