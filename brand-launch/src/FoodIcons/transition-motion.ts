import { foodIcons } from "./catalog";
import { FRUIT_BITES } from "./fruit-motion";
import type { FoodIconTransitionProps } from "./transition-settings";
import {
  FOOD_ICON_CYCLE_SECONDS,
  FOOD_ICON_FPS,
  foodIconSingleTiming,
} from "./timing";

// The transition has its own viewing order, independent of grid placement.
// Peas remain an individual-only motion.
const transitionIconIds = [
  "stir_fried_wok",
  "pancake",
  "braised",
  "steamed",
  "spice",
  "dessert",
  "fruit",
  "beverage_pairing",
  "broth",
  "noodle",
  "seaweed",
  "smoked",
  "grilled",
] as const;
export const transitionIcons = transitionIconIds.map((id) => {
  const icon = foodIcons.find((entry) => entry.id === id);
  if (!icon) throw new Error(`Missing transition icon: ${id}`);
  return icon;
});

export const foodIconTransitionTiming = (
  props: FoodIconTransitionProps,
  fps = FOOD_ICON_FPS,
) => {
  const holdFrames = Math.max(
    0,
    Math.round((props["모션 후 정지"] ?? 0) * fps),
  );
  const morphFrames = Math.max(2, Math.round(props["전환 시간"] * fps));
  let cursor = 0;
  const segments = transitionIcons.map((icon) => {
    const cycleFrames = foodIconSingleTiming(
      icon.id,
      props["모션 속도"] ?? 1,
      fps,
    ).durationInFrames;
    // Leave directly from the eaten core, after the last bite settles.
    // The standalone/grid loop keeps its original disappearance and apple drop.
    const fruitEndSeconds = FRUIT_BITES[FRUIT_BITES.length - 1].at + 0.2;
    const motionFrames =
      icon.id === "fruit"
        ? Math.ceil(
            (cycleFrames * fruitEndSeconds) / (FOOD_ICON_CYCLE_SECONDS * 2) -
              1e-8,
          ) + 1
        : cycleFrames;
    const start = cursor;
    cursor += motionFrames + holdFrames + morphFrames;
    return { start, motionFrames, end: cursor };
  });
  return { holdFrames, morphFrames, segments, durationInFrames: cursor };
};

export const foodIconTransitionPose = (
  frame: number,
  timing: ReturnType<typeof foodIconTransitionTiming>,
  still: boolean,
) => {
  const local = still
    ? 0
    : ((frame % timing.durationInFrames) + timing.durationInFrames) %
      timing.durationInFrames;
  const index = timing.segments.findIndex((segment) => local < segment.end);
  const segment = timing.segments[index];
  const slot = local - segment.start;
  const morphStart = segment.motionFrames + timing.holdFrames;
  const t = Math.max(
    0,
    Math.min(1, (slot - morphStart) / (timing.morphFrames - 1)),
  );
  const progress = t * t * t * (t * (t * 6 - 15) + 10);
  return {
    index,
    next: (index + 1) % timing.segments.length,
    progress,
    motionFrame: Math.min(slot, segment.motionFrames - 1),
    phase:
      slot < segment.motionFrames
        ? "motion"
        : slot < morphStart
          ? "hold"
          : "morph",
  };
};
