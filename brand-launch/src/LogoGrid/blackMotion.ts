import { clamp01, ramp } from "./motion";
import { getWordmarkEntryStart, WORDMARK_FILL_FRAMES } from "./wordmarkMotion";
import {
  CLASSIC_OPEN_START,
  CLASSIC_OPEN_END,
  GRID_SYMBOL_CENTER,
} from "./shortsOpening";

export const BLACK_SYMBOL_MOVE_START = CLASSIC_OPEN_START + 6;
export const BLACK_SYMBOL_MOVE_END = CLASSIC_OPEN_END;

// HD design coordinates, matching the original translate(278 200) scale(1.36).
const finalCenter = {
  x: 278 + GRID_SYMBOL_CENTER.x * 1.36,
  y: 200 + GRID_SYMBOL_CENTER.y * 1.36,
};

export const getBlackSymbolOffset = (frame: number) => {
  // Begin opening at the screen centre, then settle into the left-hand lockup
  // as the petals finish opening. The wordmark and closing motion stay put.
  const remaining =
    1 - ramp(frame, BLACK_SYMBOL_MOVE_START, BLACK_SYMBOL_MOVE_END);
  return {
    x: (960 - finalCenter.x) * remaining,
    y: (540 - finalCenter.y) * remaining,
  };
};

export const getBlackWordmarkFillProgress = (frame: number, index: number) => {
  const start = getWordmarkEntryStart(index, "classic");
  const progress = clamp01((frame - start) / WORDMARK_FILL_FRAMES);
  // A gentle ease-in: progressively faster toward the end of each fill.
  return progress ** 1.6;
};
