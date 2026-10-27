import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { miniHeatmapGeometry } from "../../../src/components/system/plating/miniHeatmapGeometry";
import type { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  comparisonAreaSurface,
  comparisonAreaTransitionPose,
  COMPARISON_TIMING,
} from "./comparison-area-transition";
import { AREA_TIMING, miniAreaProgress } from "./mini-area-motion";
import { HEATMAP_TIMING } from "./mini-heatmap-motion";
import {
  miniHeatmapDefaultProps,
  HEATMAP_WEEKDAYS,
} from "./mini-heatmap-settings";
import {
  GRAPH_TRANSITION_HOLD_FRAMES,
  type GraphTransitionProps,
} from "./graph-transition-settings";

const start = COMPARISON_TIMING.settled + GRAPH_TRANSITION_HOLD_FRAMES;
// Keep the large panel fill at three 0.4-second steps, independently of growth.
const fillCornerFrames = (AREA_TIMING.settle - AREA_TIMING.start) / 3;
const reverseShapeEnd =
  start + COMPARISON_TIMING.settled - COMPARISON_TIMING.smallShapeStart;
const collapseEnd =
  reverseShapeEnd + COMPARISON_TIMING.spreadEnd - COMPARISON_TIMING.spreadStart;
const nodeExitEnd = collapseEnd + 12;
const splitStart = nodeExitEnd + 12;
const splitEnd = splitStart + 48;
const colorStart = splitEnd + HEATMAP_TIMING.colorStart - HEATMAP_TIMING.settle;
const colorSettle =
  colorStart + HEATMAP_TIMING.colorSettle - HEATMAP_TIMING.colorStart;
export const AREA_HEATMAP_TIMING = {
  start,
  fillEnd: start + 3 * fillCornerFrames,
  reverseShapeEnd,
  collapseEnd,
  nodeExitEnd,
  splitStart,
  splitEnd,
  colorStart,
  colorSettle,
  end: colorSettle + GRAPH_TRANSITION_HOLD_FRAMES,
} as const;
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const ease = (p: number) => {
  const t = clamp(p);
  return t ** 3 * (t * (6 * t - 15) + 10);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Reuse the standalone heatmap's synthetic calendar and counts. They are
// independent of the preceding area values; subdivision keeps one uniform tint.
const calendar = miniHeatmapGeometry(
  miniHeatmapDefaultProps.기록,
  HEATMAP_WEEKDAYS.indexOf(miniHeatmapDefaultProps["시작 요일"]),
);
const columns = 7;
const rows = calendar.length / columns;

type Bars = ReturnType<typeof miniChartGeometry>;
export const areaHeatmapTransitionPose = (
  frame: number,
  graph: GraphTransitionProps,
  bars: Bars,
) => {
  const t = AREA_HEATMAP_TIMING;
  const source = comparisonAreaTransitionPose(
    COMPARISON_TIMING.settled,
    graph,
    bars,
  );
  // The fourth point remains anchored. In the default specimen it is the
  // maximum (y=0), so the filled panel is exactly the product's 132 × 56 plot.
  const ceiling = source.large.top[3].y;
  const nodeExit = ease(
    (frame - t.collapseEnd) / (t.nodeExitEnd - t.collapseEnd),
  );
  const outerRadius = mix(6, 2, nodeExit);
  const pointProgress = source.large.top.map((_, index) =>
    index === 3
      ? 0
      : miniAreaProgress(
          frame - t.start + AREA_TIMING.start,
          "진입 후 유지",
          (2 - index) * fillCornerFrames,
          fillCornerFrames,
        ),
  );
  const large =
    frame <= t.start
      ? source.large
      : comparisonAreaSurface(
          source.large.top.map((point, index) => ({
            x: point.x,
            y: mix(point.y, ceiling, pointProgress[index]),
          })),
          source.large.floor,
          outerRadius,
        );
  const reverseFrame = Math.max(
    COMPARISON_TIMING.spreadStart,
    COMPARISON_TIMING.settled - Math.max(0, frame - t.start),
  );
  const small = comparisonAreaTransitionPose(reverseFrame, graph, bars).small;
  const split = ease((frame - t.splitStart) / (t.splitEnd - t.splitStart));
  const colorProgress = clamp(
    (frame - t.colorStart) / (t.colorSettle - t.colorStart),
  );
  const calendarProgress = ease(
    (frame - t.splitEnd) / (t.colorStart - t.splitEnd),
  );
  const bounds = {
    x: source.target.bounds.left,
    y: ceiling,
    width: source.target.bounds.width,
    height: source.large.floor - ceiling,
  };
  const plot = COMPONENT_TOKENS.miniChart;
  const cells = calendar.map((cell, slot) => {
    const column = slot % columns,
      row = Math.floor(slot / columns);
    const x0 = (column * plot.width) / columns;
    const y0 = (row * plot.height) / rows;
    const width =
      (mix(plot.width / columns, cell.width, split) * bounds.width) /
      plot.width;
    const height =
      (mix(plot.height / rows, cell.height, split) * bounds.height) /
      plot.height;
    return {
      ...cell,
      slot,
      x: bounds.x + (mix(x0, cell.x, split) * bounds.width) / plot.width,
      y: bounds.y + (mix(y0, cell.y, split) * bounds.height) / plot.height,
      width,
      height,
      radius: Math.min(2, width / 2, height / 2) * split,
    };
  });
  return {
    source,
    large,
    small,
    pointProgress,
    reverseFrame,
    split,
    colorProgress,
    calendarProgress,
    cells,
    bounds,
    outerRadius,
    node: {
      cx: source.node.cx,
      cy: source.node.cy,
      radius: source.node.radius * (1 - nodeExit),
    },
    phase:
      frame < t.fillEnd
        ? "area-fill-and-reverse"
        : frame < t.reverseShapeEnd
          ? "small-area-reverse"
          : frame < t.collapseEnd
            ? "small-capsule-collapse"
            : frame < t.nodeExitEnd
              ? "small-node-disappear"
              : frame < t.splitStart
                ? "filled-area-hold"
                : frame < t.splitEnd
                  ? "heatmap-subdivide"
                  : frame < t.colorStart
                    ? "heatmap-grid-hold"
                    : frame < t.colorSettle
                      ? "heatmap-color-steps"
                      : "heatmap-colored-hold",
  };
};
