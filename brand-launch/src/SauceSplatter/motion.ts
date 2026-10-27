import {
  chipRowDuration,
  type ChipSeparation,
} from "../DiningFeedbackMotion/chip-motion";
import type { SauceSplatterProps } from "./settings";

export const SAUCE_SPLATTER_FPS = 60;
export const SAUCE_ROW_DELAY = 0.65;
export const SAUCE_CAMERA_LEAD = 0.35;
// Change only the pull-away and neck release, preserving growth and row timing.
export const SAUCE_SPLASH_SEPARATION: ChipSeparation = {
  travelSeconds: 0.12,
  neckStartSeconds: 0.16,
  neckDurationSeconds: 0.055,
};

export const sauceRowSizes = (count: number, requestedRows: number) => {
  const rows = Math.min(count, requestedRows);
  if (rows === 0) return [];
  const perRow = Math.floor(count / rows);
  return Array.from(
    { length: rows },
    (_, row) => perRow + (row < count % rows ? 1 : 0),
  );
};

export const sauceSplatterTiming = (
  props: SauceSplatterProps,
  fps = SAUCE_SPLATTER_FPS,
) => {
  const startFrames = Math.round(props["시작 대기"] * fps);
  const entranceSeconds = Math.max(
    0,
    ...sauceRowSizes(props.칩.length, props["줄 수"]).map(
      (count, row) => row * SAUCE_ROW_DELAY + chipRowDuration(count),
    ),
  );
  const cameraEndSeconds = Math.max(0, entranceSeconds - SAUCE_CAMERA_LEAD);
  const entranceFrames = Math.ceil((entranceSeconds / props.속도) * fps);
  const holdFrames = Math.ceil(props["유지 시간"] * fps);
  return {
    startFrames,
    entranceSeconds,
    cameraEndSeconds,
    durationInFrames: startFrames + entranceFrames + holdFrames + 1,
  };
};

export const sauceSplatterElapsed = (
  frame: number,
  props: SauceSplatterProps,
  fps = SAUCE_SPLATTER_FPS,
) => {
  const timing = sauceSplatterTiming(props, fps);
  if (props.재생 === "정지") return timing.entranceSeconds;
  return Math.min(
    timing.entranceSeconds,
    ((frame - timing.startFrames) / fps) * props.속도,
  );
};
