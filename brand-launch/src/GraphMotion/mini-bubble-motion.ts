import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { miniBubbleGeometry } from "../../../src/components/system/plating/miniBubbleGeometry";
import type { MiniBubbleGraphProps } from "./mini-bubble-settings";

export const BUBBLE_DURATION = 300;
export const BUBBLE_FPS = 60;
export const BUBBLE_TIMING = {
  start: 18,
  settle: 60,
  exit: 240,
  end: 282,
  grow: 30,
  stagger: 6,
} as const;
const ease = (progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
};
export const BUBBLE_OVERSHOOT = 0.04;
export const BUBBLE_PEAK_PROGRESS = 0.65;
export const miniBubbleEnterProgress = (progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  const peak = BUBBLE_PEAK_PROGRESS;
  return t <= peak
    ? (1 + BUBBLE_OVERSHOOT) * ease(t / peak)
    : 1 + BUBBLE_OVERSHOOT * (1 - ease((t - peak) / (1 - peak)));
};
export const miniBubbleItems = (graph: MiniBubbleGraphProps) =>
  graph.데이터.map((item, index) => ({
    id: `bubble-${index}`,
    label: item.항목,
    value: item.값,
    axis:
      TASTE_IDS.find((id) => TASTE_TOKENS[id].label === item.색상) ?? "umami",
    dishKindId: item["음식 종류"],
  }));
export const miniBubbleContent = (graph: MiniBubbleGraphProps) =>
  graph.표시 === "음식 아이콘" ? "icon" : "value";

/** Original area-based circles keep their centers; only presentation scale changes. */
export const miniBubblePose = (frame: number, graph: MiniBubbleGraphProps) => {
  const circles = miniBubbleGeometry(graph.데이터.map((item) => item.값));
  const stagger =
    circles.length > 1
      ? Math.min(BUBBLE_TIMING.stagger, 12 / (circles.length - 1))
      : 0;
  return circles.map((circle, order) => {
    const entering = miniBubbleEnterProgress(
      (frame - BUBBLE_TIMING.start - order * stagger) / BUBBLE_TIMING.grow,
    );
    const leaving =
      1 -
      ease(
        (frame - BUBBLE_TIMING.exit - (circles.length - 1 - order) * stagger) /
          BUBBLE_TIMING.grow,
      );
    const progress =
      graph.재생 === "정지"
        ? 1
        : graph.재생 === "진입 후 유지"
          ? entering
          : entering * leaving;
    return { ...circle, progress };
  });
};
