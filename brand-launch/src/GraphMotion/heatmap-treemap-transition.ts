import { roundedCellMerge } from "./rounded-cell-merge";

import { miniTreemapGeometry } from "../../../src/components/system/plating/miniTreemapGeometry";
import type { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  areaHeatmapTransitionPose,
  AREA_HEATMAP_TIMING,
} from "./area-heatmap-transition";
import { miniTreemapDefaultProps } from "./mini-treemap-settings";
import {
  GRAPH_TRANSITION_HOLD_FRAMES,
  type GraphTransitionProps,
} from "./graph-transition-settings";

const start = AREA_HEATMAP_TIMING.end;
export const HEATMAP_TREEMAP_TIMING = {
  start,
  packEnd: start + 48,
  shapeEnd: start + 78,
  settled: start + 90,
  end: start + 90 + GRAPH_TRANSITION_HOLD_FRAMES,
} as const;
type Box = { x: number; y: number; width: number; height: number };
const ease = (progress: number) => {
  const t = Math.min(1, Math.max(0, progress));
  return t ** 3 * (t * (6 * t - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Visual tile allocation only; calendar days are not classified or aggregated. */
export function treemapTileCounts(total: number, values: readonly number[]) {
  const sum = values.reduce((a, b) => a + b, 0);
  const shares = values.map((value) => (total * value) / sum);
  const counts = shares.map(Math.floor);
  const remaining = total - counts.reduce((a, b) => a + b, 0);
  shares
    .map((share, index) => ({ index, remainder: share - counts[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .slice(0, remaining)
    .forEach(({ index }) => counts[index]++);
  return counts;
}

/** Assign fixed cells by overlap with the actual default treemap positions. */
function matchTiles(source: readonly Box[], target: readonly Box[]) {
  const n = source.length;
  const costs = source.map((a) =>
    target.map(
      (b) =>
        (a.x + a.width / 2 - b.x - b.width / 2) ** 2 +
        (a.y + a.height / 2 - b.y - b.height / 2) ** 2 -
        1024 *
          Math.max(
            0,
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
          ) *
          Math.max(
            0,
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
          ),
    ),
  );
  const u = Array(n + 1).fill(0),
    v = Array(n + 1).fill(0);
  const p = Array(n + 1).fill(0),
    way = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const min = Array(n + 1).fill(Infinity),
      used = Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity,
        j1 = 0;
      for (let j = 1; j <= n; j++)
        if (!used[j]) {
          const current = costs[i0 - 1][j - 1] - u[i0] - v[j];
          if (current < min[j]) {
            min[j] = current;
            way[j] = j0;
          }
          if (min[j] < delta) {
            delta = min[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else min[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }
  const assignment = Array<number>(n);
  for (let j = 1; j <= n; j++) assignment[p[j] - 1] = j - 1;
  return assignment;
}

const values = miniTreemapDefaultProps.데이터.map((item) => item.값!);
const targets = miniTreemapGeometry(values);
const counts = treemapTileCounts(35, values);
const destinations = targets.flatMap((block) =>
  Array.from({ length: counts[block.index] }, () => ({
    ...block,
    group: block.index,
  })),
);
const layouts = new Map<
  string,
  {
    assignment: number[];
    paths: ReturnType<typeof roundedCellMerge>[];
  }
>();

export const heatmapTreemapTransitionPose = (
  frame: number,
  graph: GraphTransitionProps,
  bars: ReturnType<typeof miniChartGeometry>,
) => {
  const source = areaHeatmapTransitionPose(start, graph, bars).cells;
  const key = source
    .map((cell) => `${cell.x},${cell.y},${cell.width},${cell.height}`)
    .join(";");
  let layout = layouts.get(key);
  if (!layout) {
    const assignment = matchTiles(source, destinations);
    layout = {
      assignment,
      paths: targets.map((target) =>
        roundedCellMerge(
          source.filter(
            (_, index) =>
              destinations[assignment[index]].group === target.index,
          ),
          target,
        ),
      ),
    };
    if (layouts.size >= 8) layouts.delete(layouts.keys().next().value!);
    layouts.set(key, layout);
  }
  const t = HEATMAP_TREEMAP_TIMING;
  const color = ease((frame - start) / 12);
  const progress = ease((frame - start - 12) / (t.packEnd - start - 12));
  const shape = ease((frame - t.packEnd) / (t.shapeEnd - t.packEnd));
  const label = ease((frame - t.shapeEnd) / (t.settled - t.shapeEnd));
  const groups = targets.map((target) => ({
    ...target,
    count: counts[target.index],
    progress,
    radius: mix(2, target.radius, progress),
    path:
      progress > 0 && progress < 1 ? layout.paths[target.index](progress) : "",
  }));
  const tiles = source.map((cell, index) => ({
    ...cell,
    group: destinations[layout.assignment[index]].group,
    progress: color,
  }));
  return {
    tiles,
    groups,
    shape,
    label,
    phase:
      frame < t.packEnd
        ? "heatmap-cells-merge"
        : frame < t.shapeEnd
          ? "treemap-color-and-settle"
          : frame < t.settled
            ? "treemap-labels"
            : "treemap-hold",
  };
};
