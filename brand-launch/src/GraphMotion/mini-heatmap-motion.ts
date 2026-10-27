import { random } from "remotion";
import { miniHeatmapGeometry } from "../../../src/components/system/plating/miniHeatmapGeometry";
import {
  TASTE_IDS,
  TASTE_TOKENS,
  type TasteId,
} from "../../../src/constants/designTokens";
import { miniHeatmapColor } from "../../../src/components/system/plating/MiniHeatmap";
import {
  HEATMAP_WEEKDAYS,
  type MiniHeatmapGraphProps,
} from "./mini-heatmap-settings";

export const HEATMAP_DURATION = 300;
export const HEATMAP_FPS = 60;
export const HEATMAP_TIMING = {
  start: 18,
  settle: 96,
  colorStart: 108,
  colorSettle: 156,
  exit: 192,
  end: 270,
} as const;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => 1 - (1 - clamp(value)) ** 3;
export const miniHeatmapAxis = (graph: MiniHeatmapGraphProps) =>
  TASTE_IDS.find((id) => TASTE_TOKENS[id].label === graph.색상) ?? "umami";
export const miniHeatmapStartDay = (graph: MiniHeatmapGraphProps) =>
  HEATMAP_WEEKDAYS.indexOf(graph["시작 요일"]);

/** Stable random timing only: calendar slots and source values never move. */
export const miniHeatmapOrderRanks = (
  count: number,
  phase: "reveal" | "exit" = "reveal",
) => {
  const order = Array.from({ length: count }, (_, slot) => ({
    slot,
    noise: random(`mini-heatmap-${phase}-${slot}`),
  })).sort((a, b) => a.noise - b.noise || a.slot - b.slot);
  const ranks = new Array<number>(count);
  order.forEach(({ slot }, rank) => {
    ranks[slot] = rank;
  });
  return ranks;
};

/** Flow continuously through the shared palette; each cell stops at its target. */
export const miniHeatmapMotionColor = (
  level: number,
  axis: TasteId,
  progress: number,
) => {
  const displayedLevel = Math.min(level, clamp(progress) * 4);
  const lower = Math.floor(displayedLevel);
  const base = miniHeatmapColor(lower, axis);
  if (displayedLevel === lower) return base;
  const target = miniHeatmapColor(lower + 1, axis);
  // Use the entire interval without restarting easing or pausing at each step.
  const blend = displayedLevel - lower;
  return `color-mix(in srgb, ${base} ${((1 - blend) * 100).toFixed(4)}%, ${target} ${(blend * 100).toFixed(4)}%)`;
};

/** Reveal the pale calendar first, then deepen each known cell to its own level. */
export const miniHeatmapPose = (
  frame: number,
  graph: MiniHeatmapGraphProps,
) => {
  const cells = miniHeatmapGeometry(graph.기록, miniHeatmapStartDay(graph));
  const revealRanks = miniHeatmapOrderRanks(cells.length);
  const exitRanks = miniHeatmapOrderRanks(cells.length, "exit");
  const spread = Math.min(54, Math.max(0, cells.length - 1) * 1.5);
  const stagger = cells.length > 1 ? spread / (cells.length - 1) : 0;
  const reveal = HEATMAP_TIMING.settle - HEATMAP_TIMING.start - spread;
  const colorProgress =
    graph.재생 === "정지"
      ? 1
      : graph.재생 === "진입·유지·퇴장" && frame >= HEATMAP_TIMING.end
        ? 0
        : clamp(
            (frame - HEATMAP_TIMING.colorStart) /
              (HEATMAP_TIMING.colorSettle - HEATMAP_TIMING.colorStart),
          );
  return cells.map((cell, slot) => {
    const enterDelay = revealRanks[slot] * stagger;
    const entering = ease((frame - HEATMAP_TIMING.start - enterDelay) / reveal);
    // Independent seeded order, with the same exit curve and time window.
    const exitDelay = (cells.length - 1 - exitRanks[slot]) * stagger;
    const leaving = ease((HEATMAP_TIMING.end - frame - exitDelay) / reveal);
    const opacity =
      graph.재생 === "정지"
        ? 1
        : graph.재생 === "진입 후 유지"
          ? entering
          : Math.min(entering, leaving);
    return { ...cell, slot, opacity, colorProgress };
  });
};
