import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { miniTreemapGeometry } from "../../../src/components/system/plating/miniTreemapGeometry";
import type { MiniTreemapGraphProps } from "./mini-treemap-settings";

export const TREEMAP_DURATION = 300;
export const TREEMAP_FPS = 60;
export const TREEMAP_TIMING = {
  start: 18,
  settle: 90,
  exit: 210,
  end: 282,
  grow: 42,
  stagger: 6,
  maxSpread: 30,
} as const;
const ease = (progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  // Smootherstep: zero velocity and acceleration at both ends, no rebound.
  return Math.max(0, Math.min(1, t ** 3 * (t * (6 * t - 15) + 10)));
};
export const miniTreemapItems = (graph: MiniTreemapGraphProps) =>
  graph.데이터.map((item, index) => ({
    id: `treemap-${index}`,
    label: item.항목,
    value: item.값,
    axis:
      TASTE_IDS.find((id) => TASTE_TOKENS[id].label === item.색상) ?? "umami",
  }));

/** Source cells stay fixed; reveal rank follows their visual centers left to right. */
export const miniTreemapPose = (
  frame: number,
  graph: MiniTreemapGraphProps,
) => {
  const cells = miniTreemapGeometry(graph.데이터.map((item) => item.값));
  const ordered = [...cells].sort(
    (a, b) =>
      a.x + a.width / 2 - (b.x + b.width / 2) ||
      a.y + a.height / 2 - (b.y + b.height / 2) ||
      a.index - b.index,
  );
  const ranks = new Map(ordered.map((cell, rank) => [cell.index, rank]));
  const stagger =
    cells.length > 1
      ? Math.min(
          TREEMAP_TIMING.stagger,
          TREEMAP_TIMING.maxSpread / (cells.length - 1),
        )
      : 0;
  return cells.map((cell) => {
    const rank = ranks.get(cell.index)!;
    const entering = ease(
      (frame - TREEMAP_TIMING.start - rank * stagger) / TREEMAP_TIMING.grow,
    );
    const leaving =
      1 -
      ease(
        (frame - TREEMAP_TIMING.exit - (cells.length - 1 - rank) * stagger) /
          TREEMAP_TIMING.grow,
      );
    const progress =
      graph.재생 === "정지"
        ? 1
        : graph.재생 === "진입 후 유지"
          ? entering
          : entering * leaving;
    return { ...cell, progress };
  });
};
