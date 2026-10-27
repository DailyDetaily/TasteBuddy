import { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  COMPONENT_TOKENS,
  TASTE_IDS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import type { MiniGroupedBarGraphProps } from "./mini-grouped-bar-settings";

export const GROUPED_BAR_DURATION = 300;
export const GROUPED_BAR_FPS = 60;
export const GROUPED_BAR_TIMING = {
  start: 18,
  settle: 96,
  exit: 192,
  end: 270,
} as const;
const ease = (value: number) => 1 - (1 - Math.min(1, Math.max(0, value))) ** 3;

export const miniGroupedBarAxis = (graph: MiniGroupedBarGraphProps) =>
  TASTE_IDS.find((id) => TASTE_TOKENS[id].label === graph.색상) ?? "umami";

/** Previous/current pairs share both the product scale and motion progress. */
export const miniGroupedBarPose = (
  frame: number,
  graph: MiniGroupedBarGraphProps,
) => {
  const targets = miniChartGeometry(graph["현재 기록"], graph["이전 기록"]);
  const pairCount = targets.length / 2;
  const spread = Math.min(30, Math.max(0, pairCount - 1) * 6);
  const stagger = pairCount > 1 ? spread / (pairCount - 1) : 0;
  const grow = GROUPED_BAR_TIMING.settle - GROUPED_BAR_TIMING.start - spread;
  return targets.map((bar) => {
    const delay = bar.index * stagger;
    const entering = frame - GROUPED_BAR_TIMING.start - delay;
    const leaving = GROUPED_BAR_TIMING.end - frame - delay;
    const envelope = (duration: number) =>
      graph.재생 === "정지"
        ? 1
        : graph.재생 === "진입 후 유지"
          ? ease(entering / duration)
          : Math.min(ease(entering / duration), ease(leaving / duration));
    const progress = envelope(grow);
    const seed = Math.min(bar.width, bar.height);
    const height =
      progress === 1 ? bar.height : seed + (bar.height - seed) * progress;
    return {
      ...bar,
      height,
      y: COMPONENT_TOKENS.miniChart.height - height,
      radius: Math.min(bar.width, height) / 2,
      progress,
      opacity: bar.height > 0 ? envelope(7) : 0,
    };
  });
};
