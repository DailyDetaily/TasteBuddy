import {
  DEFAULT_SETTINGS,
  openingRotationX,
  PETAL_OPEN_FRAMES,
  PETAL_PERSPECTIVE,
  PETAL_PIVOT,
} from "../PetalLogo/motion";

export const GRID_SYMBOL_CENTER = { x: 308, y: 249 };
export const GRID_SYMBOL_RADIUS = 92;
export const SHORTS_OPEN_FRAMES = PETAL_OPEN_FRAMES;
// Preserve the Shorts perspective-to-radius ratio at the supplied grid scale.
export const GRID_PETAL_PERSPECTIVE =
  (PETAL_PERSPECTIVE * GRID_SYMBOL_RADIUS) /
  (PETAL_PIVOT.y * DEFAULT_SETTINGS.scale);

export const getShortsOpeningPose = (openingFrame: number) => ({
  foldDegrees: openingRotationX(openingFrame),
  size: 1,
  opacity: 1,
  shade: 0,
});

export const CLASSIC_OPEN_START = 18;
export const CLASSIC_OPEN_END = CLASSIC_OPEN_START + SHORTS_OPEN_FRAMES;
export const CLASSIC_FOLD_START = 228;
export const CLASSIC_FOLD_END = CLASSIC_FOLD_START + SHORTS_OPEN_FRAMES;

export const getClassicPetalStage = (frame: number) => {
  if (frame < CLASSIC_OPEN_START || frame >= CLASSIC_FOLD_END)
    return { mode: "hidden", openingFrame: 0 } as const;
  if (frame < CLASSIC_OPEN_END)
    return {
      mode: "opening",
      openingFrame: frame - CLASSIC_OPEN_START,
    } as const;
  if (frame >= CLASSIC_FOLD_START)
    return { mode: "folding", openingFrame: CLASSIC_FOLD_END - frame } as const;
  return { mode: "held", openingFrame: SHORTS_OPEN_FRAMES } as const;
};

export const isClassicStackGuideVisible = (frame: number, index: number) => {
  // The central 12 guide and its label remain until their normal final exit,
  // without disappearing and reappearing during the petal opening or fold.
  if (index === 35 || index === 49) return true;
  return getClassicPetalStage(frame).mode !== "folding";
};
