import { miniStackedBarGeometry } from "../../../src/components/system/plating/miniStackedBarGeometry";
import {
  COMPONENT_TOKENS,
  TASTE_IDS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import type { MiniStackedBarGraphProps } from "./mini-stacked-bar-settings";

export const STACKED_BAR_DURATION = 300;
export const STACKED_BAR_FPS = 60;
export const STACKED_BAR_TIMING = {
  start: 18,
  settle: 96,
  exit: 192,
  end: 270,
} as const;
const ease = (value: number) => 1 - (1 - Math.min(1, Math.max(0, value))) ** 3;

export const miniStackedBarSeries = (graph: MiniStackedBarGraphProps) =>
  graph.데이터.map((series, index) => ({
    id: `series-${index}`,
    label: series.항목,
    axis:
      TASTE_IDS.find((id) => TASTE_TOKENS[id].label === series.색상) ?? "umami",
    values: series.기록,
  }));

/** Add category groups bottom-to-top, preserving the final cumulative capsules. */
export const miniStackedBarPose = (
  frame: number,
  graph: MiniStackedBarGraphProps,
) => {
  const series = miniStackedBarSeries(graph);
  const targets = miniStackedBarGeometry(series);
  // Keep a category in the same phase across every column, including columns
  // where another category is zero. Never rank by each column's visible layers.
  const groupIds = series
    .map((item) => item.id)
    .filter((id) =>
      targets.some((bar) => bar.layers.some((layer) => layer.id === id)),
    );
  const groupCount = Math.max(1, groupIds.length);
  const window = STACKED_BAR_TIMING.settle - STACKED_BAR_TIMING.start;
  const baseline = COMPONENT_TOKENS.miniChart.height;
  return targets.map((bar) => {
    const animate = (
      targetHeight: number,
      group: number,
      seedHeight = Math.min(bar.width, targetHeight),
    ) => {
      const groupStart = Math.round((group * window) / groupCount);
      const groupEnd = Math.round(((group + 1) * window) / groupCount);
      const groupDuration = groupEnd - groupStart;
      const spread = Math.min(
        9,
        groupDuration * 0.35,
        Math.max(0, targets.length - 1) * 1.5,
      );
      const stagger = targets.length > 1 ? spread / (targets.length - 1) : 0;
      const delay = groupStart + bar.index * stagger;
      const entering = frame - STACKED_BAR_TIMING.start - delay;
      const leaving = STACKED_BAR_TIMING.end - frame - delay;
      const envelope = (duration: number) =>
        graph.재생 === "정지"
          ? 1
          : graph.재생 === "진입 후 유지"
            ? ease(entering / duration)
            : Math.min(ease(entering / duration), ease(leaving / duration));
      const grow = groupDuration - spread;
      const progress = envelope(grow);
      const height =
        progress === 1
          ? targetHeight
          : seedHeight + (targetHeight - seedHeight) * progress;
      return {
        height,
        y: baseline - height,
        radius: Math.min(bar.width, height) / 2,
        progress,
        opacity: targetHeight > 0 ? envelope(Math.min(7, grow)) : 0,
      };
    };
    const marker = animate(bar.height, 0);
    const layers = bar.layers.map((layer, index) => ({
      ...layer,
      // Layers remain painted longest-first. The next array item is the
      // already completed cumulative layer directly below this category.
      ...animate(
        layer.height,
        groupIds.indexOf(layer.id),
        bar.layers[index + 1]?.height ?? Math.min(bar.width, layer.height),
      ),
    }));
    return {
      ...bar,
      ...marker,
      opacity:
        bar.total === 0
          ? marker.opacity
          : Math.max(0, ...layers.map((layer) => layer.opacity)),
      layers,
    };
  });
};
