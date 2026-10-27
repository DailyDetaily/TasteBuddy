import {
  COMPONENT_TOKENS,
  TASTE_IDS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import { pieDonutData } from "../../../src/components/system/plating/pieDonutData";
import {
  SYMBOL_DONUT,
  symbolDonutGeometry,
} from "../../../src/components/system/plating/symbolDonutGeometry";
import type { MiniPieGraphProps } from "./mini-pie-settings";

export const PIE_DURATION = 300;
export const PIE_FPS = 60;
export const PIE_TIMING = {
  start: 18,
  settle: 72,
  exit: 228,
  end: 282,
} as const;
const { width, height } = COMPONENT_TOKENS.miniChart;
export const PIE_CENTER = { x: width - height / 2, y: height / 2 };
export const miniPieMode = (graph: MiniPieGraphProps) =>
  graph["값 기준"] === "절대 백분율" ? "absolute" : "relative";
export const miniPieSegments = (graph: MiniPieGraphProps) =>
  graph.데이터.map((item, index) => ({
    id: `segment-${index}`,
    label: item.항목,
    value: item.값,
    axis:
      TASTE_IDS.find((id) => TASTE_TOKENS[id].label === item.색상) ?? "umami",
  }));

export const PIE_FILL_FRAMES = 42;
export const PIE_STAGGER_FRAMES = 6;
export const pieEaseInOut = (progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  // Match the treemap's gentle endpoints: zero velocity/acceleration, no rebound.
  return Math.max(0, Math.min(1, t ** 3 * (t * (6 * t - 15) + 10)));
};

/** Fill clockwise and drain counterclockwise, with the same short overlap. */
export const miniPiePose = (frame: number, graph: MiniPieGraphProps) => {
  const data = pieDonutData(
    miniPieSegments(graph).map((segment) => segment.value),
    miniPieMode(graph),
  );
  const targets = symbolDonutGeometry(data.values);
  const stagger =
    targets.length > 1
      ? Math.min(PIE_STAGGER_FRAMES, 12 / (targets.length - 1))
      : 0;
  const pieces = targets.map((piece, order) => {
    const delay = order * stagger;
    const exitDelay = (targets.length - 1 - order) * stagger;
    const entering = pieEaseInOut(
      (frame - PIE_TIMING.start - delay) / PIE_FILL_FRAMES,
    );
    const leaving =
      1 - pieEaseInOut((frame - PIE_TIMING.exit - exitDelay) / PIE_FILL_FRAMES);
    const fillProgress =
      graph.재생 === "정지"
        ? 1
        : graph.재생 === "진입 후 유지"
          ? entering
          : entering * leaving;
    const fillRadius = (SYMBOL_DONUT.diameter / 2) * fillProgress;
    const filledPath =
      fillProgress === 1
        ? piece.path
        : (symbolDonutGeometry(data.values, fillRadius).find(
            (fill) => fill.index === piece.index,
          )?.path ?? null);
    return { ...piece, fillProgress, fillRadius, filledPath };
  });
  return {
    fillProgress: pieces.length
      ? pieces.reduce((sum, piece) => sum + piece.fillProgress, 0) /
        pieces.length
      : 1,
    pieces,
  };
};
