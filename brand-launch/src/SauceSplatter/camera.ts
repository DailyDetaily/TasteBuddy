import { chipRowDuration, chipPeak } from "../DiningFeedbackMotion/chip-motion";
import { SAUCE_CAMERA_LEAD, SAUCE_ROW_DELAY } from "./motion";

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export type SauceCameraTrack = {
  startSeconds: number;
  endX: number;
  endSeconds: number;
};

/** One continuous pan to the measured final edge, independent of row reveals. */
export const createSauceCameraTrack = ({
  rows,
  scale,
  viewportWidth,
  padding,
  gap,
}: {
  rows: number[][];
  scale: number;
  viewportWidth: number;
  padding: number;
  gap: number;
}): SauceCameraTrack => {
  const worldWidth = Math.max(
    0,
    ...rows.map(
      (widths) =>
        widths.reduce((sum, width) => sum + width, 0) +
        Math.max(0, widths.length - 1) * gap,
    ),
  );
  const endX = Math.max(0, worldWidth * scale + 2 * padding - viewportWidth);
  // Let the third row's leading chip finish expanding before the pan starts.
  // For fewer rows, wait for the leading chip on the last available row.
  const startSeconds =
    Math.min(2, Math.max(0, rows.length - 1)) * SAUCE_ROW_DELAY + chipPeak(0);
  const entranceSeconds = Math.max(
    0,
    ...rows.map(
      (widths, row) => row * SAUCE_ROW_DELAY + chipRowDuration(widths.length),
    ),
  );
  const endSeconds = Math.max(0, entranceSeconds - SAUCE_CAMERA_LEAD);
  return {
    startSeconds,
    endX,
    endSeconds,
  };
};

const cameraProgress = (elapsed: number, track: SauceCameraTrack) => {
  if (elapsed <= track.startSeconds) return 0;
  if (elapsed >= track.endSeconds) return 1;
  const progress =
    (elapsed - track.startSeconds) / (track.endSeconds - track.startSeconds);
  // A single easing curve has one velocity peak, with no intermediate stops.
  return smootherstep(progress);
};

export const sauceCameraOffset = (elapsed: number, track: SauceCameraTrack) =>
  track.endX * cameraProgress(elapsed, track);
