import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { buildRoundedAreaPath } from "../../../src/components/system/plating/roundedAreaPath";
import { miniAreaPointRuns } from "../../../src/components/system/plating/miniAreaGeometry";
import type { MiniAreaGraphProps } from "./mini-area-settings";

export const AREA_DURATION = 300;
export const AREA_FPS = 60;
export const AREA_TIMING = {
  start: 18,
  settle: 90,
  exit: 186,
  end: 258,
} as const;
const ease = (value: number) => 1 - (1 - Math.min(1, Math.max(0, value))) ** 3;

/** Grow from the left-face-height rectangle, then return to the same base. */
export const miniAreaProgress = (
  frame: number,
  playback: MiniAreaGraphProps["재생"],
  delay = 0,
  duration: number = AREA_TIMING.settle - AREA_TIMING.start,
) => {
  if (playback === "정지") return 1;
  const entering = ease((frame - AREA_TIMING.start - delay) / duration);
  return playback === "진입 후 유지"
    ? entering
    : Math.min(entering, ease((AREA_TIMING.end - frame - delay) / duration));
};

/** Match the original single-area vertex positions; only inner corner rounding is optically adjusted. */
export const miniAreaGeometry = (records: readonly number[]) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const maxPoints = Math.max(2, Math.floor((width - 12) / 36) + 1);
  const values = records.slice(-maxPoints);
  const maximum = Math.max(
    0,
    ...values.filter((value) => Number.isFinite(value) && value >= 0),
  );
  const runs = miniAreaPointRuns(values, maximum, width, height);
  const points = runs.flat();
  const leftY = points[0]?.y ?? height;
  return { width, height, points, runs, leftY, minimumHeight: height - leftY };
};

export const miniAreaPose = (frame: number, graph: MiniAreaGraphProps) => {
  const geometry = miniAreaGeometry(graph.기록);
  const progress = miniAreaProgress(frame, graph.재생);
  // The left edge is fixed. Give each remaining corner its own turn inside
  // the existing 72-frame growth window; the reverse exit starts on the right.
  const movingCount = Math.max(1, geometry.points.length - 1);
  const cornerDuration = (AREA_TIMING.settle - AREA_TIMING.start) / movingCount;
  const cornerProgress = geometry.points.map((_, index) =>
    miniAreaProgress(
      frame,
      graph.재생,
      Math.max(0, index - 1) * cornerDuration,
      cornerDuration,
    ),
  );
  let offset = 0;
  const runs = geometry.runs.map((run) => {
    const startY = run[0].y;
    const moved = run.map((point, index) => ({
      x: point.x,
      y: startY + (point.y - startY) * cornerProgress[offset + index],
    }));
    offset += run.length;
    return moved;
  });
  const points = runs.flat();
  const paths = runs.map((run) =>
    buildRoundedAreaPath(
      [
        ...run,
        { x: run[run.length - 1].x, y: geometry.height },
        { x: run[0].x, y: geometry.height },
      ],
      6,
    ),
  );
  return {
    ...geometry,
    points,
    runs,
    paths,
    path: paths.join(" "),
    progress,
    cornerProgress,
  };
};
