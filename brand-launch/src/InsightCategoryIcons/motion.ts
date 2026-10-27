import { categories } from "../../../src/lib/gastronomy/engine";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import type { CategoryIconTransitionProps } from "./settings";

export const CATEGORY_ICON_FPS = 60;
// Presentation sequence for this video, using the product's main taste colors.
const categoryTasteAxes = {
  experience: "sweet",
  sensation: "sour",
  preference: "bitter",
  context: "salty",
  change: "umami",
} as const;
export const categoryIcons = categories.map(({ id, title }) => ({
  id,
  label: title,
  taste: categoryTasteAxes[id],
  color: TASTE_TOKENS[categoryTasteAxes[id]].palette.main,
}));

export const categoryIconTransitionTiming = (
  props: CategoryIconTransitionProps,
  fps = CATEGORY_ICON_FPS,
) => {
  const holdFrames = Math.max(1, Math.round(props["유지 시간"] * fps));
  const morphFrames = Math.max(2, Math.round(props["전환 시간"] * fps));
  const segmentFrames = holdFrames + morphFrames;
  return {
    holdFrames,
    morphFrames,
    segmentFrames,
    durationInFrames: segmentFrames * categoryIcons.length,
  };
};

export const categoryIconTransitionPose = (
  frame: number,
  timing: ReturnType<typeof categoryIconTransitionTiming>,
  still = false,
) => {
  const local = still
    ? 0
    : ((frame % timing.durationInFrames) + timing.durationInFrames) %
      timing.durationInFrames;
  const index = Math.floor(local / timing.segmentFrames);
  const slot = local % timing.segmentFrames;
  const t = Math.max(
    0,
    Math.min(1, (slot - timing.holdFrames) / (timing.morphFrames - 1)),
  );
  // Match the food-icon transition's zero-velocity, zero-acceleration ends.
  const progress = t * t * t * (t * (t * 6 - 15) + 10);
  return {
    index,
    next: (index + 1) % categoryIcons.length,
    progress,
    phase: slot < timing.holdFrames ? "hold" : "morph",
  };
};
