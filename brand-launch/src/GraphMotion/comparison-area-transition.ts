import { AREA_TIMING, miniAreaProgress } from "./mini-area-motion";
import {
  miniAreaLayerGeometry,
  miniAreaValueHeight,
} from "../../../src/components/system/plating/miniAreaGeometry";
import {
  roundedLineCorners,
  type LinePathPoint,
} from "../../../src/components/system/roundedLinePath";
import { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  graphTransitionBarGeometry,
  TRANSITION_TIMING,
} from "./graph-transition-motion";
import {
  type GraphTransitionProps,
  LARGE_AREA_VALUES,
  SMALL_AREA_VALUES,
  GRAPH_TRANSITION_HOLD_FRAMES,
} from "./graph-transition-settings";

// Four corners take 1.2 seconds here; the standalone Area timing is unchanged.
export const COMPARISON_CORNER_FRAMES = 18;
/** Start the dark capsule's extension after all four large-area corners settle. */
export const COMPARISON_CAPSULE_DELAY = 72 + 4 * COMPARISON_CORNER_FRAMES;
const start = TRANSITION_TIMING.settled + GRAPH_TRANSITION_HOLD_FRAMES;
const nodeSettled = start + 74;
const connectStart = nodeSettled + 12;
const connectEnd = connectStart + 42;
const largeShapeStart = connectEnd + 30;
const largeShapeEnd = largeShapeStart + 4 * COMPARISON_CORNER_FRAMES;
const spreadEnd = largeShapeEnd + 42;
export const COMPARISON_TIMING = {
  roundStart: start,
  roundEnd: start + 42,
  nodeDropStart: start + 30,
  nodeSettled,
  connectStart,
  connectEnd,
  spreadStart: largeShapeEnd,
  spreadEnd,
  largeShapeStart,
  largeShapeEnd,
  smallShapeStart: spreadEnd,
  settled: spreadEnd + 4 * COMPARISON_CORNER_FRAMES,
} as const;
const W = 132,
  H = 56,
  DIAMETER = 12,
  RADIUS = DIAMETER / 2;
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const ease = (p: number) => {
  const t = clamp(p);
  return t ** 3 * (t * (6 * t - 15) + 10);
};
const phase = (frame: number, start: number, end: number) =>
  ease((frame - start) / (end - start));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Same circular fillets as the line: R12 top bends, default R6 outer corners.
 * The two outer corners see the full neighboring segment, including for a circle.
 */
export const comparisonAreaSurface = (
  top: LinePathPoint[],
  floor = H,
  outerRadius = 6,
) => {
  const polygon = [
    ...top,
    { x: top[top.length - 1].x, y: floor },
    { x: top[0].x, y: floor },
  ];
  const wrapped = [polygon[polygon.length - 1], ...polygon, polygon[0]];
  const outer = roundedLineCorners(wrapped, outerRadius).slice(1, -1);
  const inner = roundedLineCorners(wrapped, 12).slice(1, -1);
  const corners = polygon.map((_, i) =>
    i > 0 && i < top.length - 1 ? inner[i] : outer[i],
  );
  const xy = (p: LinePathPoint) => `${p.x} ${p.y}`;
  let path = "";
  polygon.forEach((point, i) => {
    const c = corners[i];
    path += `${i ? " L" : "M"} ${xy(c?.entry ?? point)}`;
    if (c) path += ` A ${c.radius} ${c.radius} 0 0 ${c.sweep} ${xy(c.exit)}`;
  });
  return { top, polygon, corners, path: path + " Z", floor };
};

type Bars = ReturnType<typeof miniChartGeometry>;
/** Reuse the product's shared value-one scale. Transition inputs are validated. */
export const comparisonAreaHeight = (value: number, maximum: number) =>
  miniAreaValueHeight(value, maximum)!;

export const comparisonAreaTargets = (
  graph: GraphTransitionProps,
  bars: Bars = graphTransitionBarGeometry(graph),
) => {
  const left = Math.min(...bars.map((bar) => bar.x));
  const right = Math.max(...bars.map((bar) => bar.x + bar.width));
  const bounds = { left, right, width: right - left };
  const entries = [
    {
      id: "large",
      taste: graph.데이터[0]?.미각 ?? "감칠맛",
      values: graph["큰 영역 값"] ?? LARGE_AREA_VALUES,
    },
    {
      id: "small",
      taste: graph.데이터[0]?.미각 ?? "감칠맛",
      values: graph["작은 영역 값"] ?? SMALL_AREA_VALUES,
    },
  ];
  const rows = miniAreaLayerGeometry(entries, "comparison");
  const surface = (id: "large" | "small") => {
    const points = rows.find((row) => row.id === id)!.runs[0];
    return comparisonAreaSurface(
      points.map((point) => ({
        x: left + (point.x / W) * bounds.width,
        y: point.y,
      })),
    );
  };
  return {
    bounds,
    large: surface("large"),
    small: surface("small"),
  };
};

/** Reverse of the line's segmentation: expand seven intervals on one fixed
 * horizontal track. The round caps overlap naturally; no metaball field/mask.
 */
export const comparisonAreaTransitionPose = (
  frame: number,
  graph: GraphTransitionProps,
  bars: Bars,
) => {
  const t = COMPARISON_TIMING,
    target = comparisonAreaTargets(graph, bars);
  const round = phase(frame, t.roundStart, t.roundEnd);
  const circles = bars.map((bar) => {
    const height = mix(bar.height, DIAMETER, round);
    return {
      ...bar,
      height,
      y: H - height,
      radius: Math.min(bar.width, height) / 2,
    };
  });
  const last = bars[bars.length - 1];
  const originalY = last.y + RADIUS,
    groundY = H - RADIUS;
  const fallDistance = Math.max(0, groundY - originalY);
  const fallFrames =
    fallDistance > 0 ? TRANSITION_TIMING.currentNodeFallFrames : 0;
  const landingFrame = t.nodeDropStart + fallFrames;
  const age = frame - t.nodeDropStart,
    bounceAge = frame - landingFrame;
  const bounceHeight = Math.min(
    TRANSITION_TIMING.maximumBounceHeight,
    fallDistance * TRANSITION_TIMING.bounceHeightRatio,
  );
  const bounce =
    bounceAge > 0 && bounceAge < TRANSITION_TIMING.bounceFrames
      ? bounceHeight *
        Math.sin((Math.PI * bounceAge) / TRANSITION_TIMING.bounceFrames)
      : 0;
  const node = {
    cx: last.x + last.width / 2,
    cy:
      age <= 0
        ? originalY
        : age < fallFrames
          ? originalY + fallDistance * (age / fallFrames) ** 2
          : groundY - bounce,
    radius: RADIUS,
    landingFrame,
    bounceHeight,
    colorProgress: fallFrames > 0 ? ease(age / fallFrames) : Number(age >= 0),
  };
  const connection = phase(frame, t.connectStart, t.connectEnd);
  const centers = bars.map((bar) => bar.x + bar.width / 2);
  const track = {
    from: centers[0],
    to: centers[centers.length - 1],
    y: groundY,
  };
  const segments = centers.map((center, i) => ({
    from: mix(
      center,
      i === 0 ? center : (centers[i - 1] + center) / 2,
      connection,
    ),
    to: mix(
      center,
      i === centers.length - 1 ? center : (center + centers[i + 1]) / 2,
      connection,
    ),
  }));
  const spread = phase(frame, t.spreadStart, t.spreadEnd);
  const cornerProgress = (start: number, count: number) =>
    Array.from({ length: count }, (_, i) =>
      miniAreaProgress(
        frame - start + AREA_TIMING.start,
        "진입 후 유지",
        i * COMPARISON_CORNER_FRAMES,
        COMPARISON_CORNER_FRAMES,
      ),
    );
  const largeCornerProgress = cornerProgress(
    t.largeShapeStart,
    target.large.top.length,
  );
  const smallCornerProgress = cornerProgress(
    t.smallShapeStart,
    target.small.top.length,
  );
  const largeShape = phase(frame, t.largeShapeStart, t.largeShapeEnd);
  const smallShape = phase(frame, t.smallShapeStart, t.settled);
  const large =
    largeShape === 1
      ? target.large
      : comparisonAreaSurface(
          target.large.top.map((p, i) => ({
            x: p.x,
            y: mix(H - DIAMETER, p.y, largeCornerProgress[i]),
          })),
        );
  const left =
    spread === 1
      ? target.bounds.left
      : target.bounds.right - mix(DIAMETER, target.bounds.width, spread);
  // Remain a horizontal capsule until its full 132px span is complete.
  const small =
    smallShape === 1
      ? target.small
      : smallShape === 0
        ? comparisonAreaSurface([
            { x: left, y: H - DIAMETER },
            { x: target.bounds.right, y: H - DIAMETER },
          ])
        : comparisonAreaSurface(
            target.small.top.map((p, i) => ({
              x: p.x,
              y: mix(H - DIAMETER, p.y, smallCornerProgress[i]),
            })),
          );
  return {
    target,
    round,
    circles,
    node,
    track,
    segments,
    connection,
    spread,
    largeShape,
    smallShape,
    largeCornerProgress,
    smallCornerProgress,
    large,
    small,
    largePath: large.path,
    phase:
      frame < t.roundEnd
        ? "bars-to-circles"
        : frame < t.nodeDropStart
          ? "circles-hold"
          : frame < t.nodeSettled
            ? "node-drop-bounce"
            : frame < t.connectStart
              ? "circles-ready"
              : frame < t.connectEnd
                ? "circles-to-capsules"
                : frame < t.largeShapeStart
                  ? "capsule-and-node-hold"
                  : frame < t.largeShapeEnd
                    ? "large-area-grow"
                    : frame < t.smallShapeStart
                      ? "small-capsule-extend"
                      : frame < t.settled
                        ? "small-area-grow"
                        : "comparison-hold",
  };
};
