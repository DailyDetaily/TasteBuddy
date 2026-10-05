import { insightExpansion, insightFillEnd } from "../taste-motion";
import type { Point } from "./types";
type Packed = { point: Point; parent: number; start: number; duration: number };
const plans = new Map<number, Packed[]>();
const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
/** The original six-branch packed-dot entrance, adapted to the context layer slot count. */
function plan(count: number): Packed[] {
  const cached = plans.get(count);
  if (cached) return cached;
  let layers = 1;
  while (((layers * (layers + 1)) / 2) * 6 < count) layers++;
  const scaleLayers = Math.max(6, layers),
    packed: Packed[] = [];
  for (let layer = 1; layer <= layers; layer++) {
    const slots = Array.from({ length: layer }, (_, i) => i).sort(
      (a, b) =>
        Math.abs(a - (layer - 1) / 2) - Math.abs(b - (layer - 1) / 2) || a - b,
    );
    const duration = layer === 1 ? 0.1 : (layer * 0.025) / Math.ceil(layer / 2);
    for (const slot of slots)
      for (let sector = 0; sector < 6 && packed.length < count; sector++) {
        const angle =
          (-2 * Math.PI) / 3 +
          (sector * Math.PI) / 3 +
          ((slot / layer) * Math.PI) / 3;
        const radius = ((79 - 4.8) * layer) / scaleLayers;
        const point = {
          x: 320 + Math.cos(angle) * radius,
          y: 320 + Math.sin(angle) * radius,
        };
        const start =
          layer === 1
            ? 0
            : 0.1 +
              ((layer * (layer - 1)) / 2 - 1) * 0.025 +
              Math.floor(Math.abs(slot - (layer - 1) / 2)) * duration;
        let parent = 0,
          closest = Infinity;
        packed.forEach((candidate, index) => {
          if (
            index % 6 !== sector ||
            candidate.start + candidate.duration > start + 1e-8
          )
            return;
          const d = Math.hypot(
            point.x - candidate.point.x,
            point.y - candidate.point.y,
          );
          if (d < closest) {
            closest = d;
            parent = index;
          }
        });
        packed.push({ point, parent, start, duration });
      }
  }
  const end = Math.max(0.1, ...packed.map((d) => d.start + d.duration));
  const rate = (insightFillEnd - 0.1) / Math.max(0.001, end - 0.1);
  packed.forEach((d, i) => {
    if (i >= 6) {
      d.start = 0.1 + (d.start - 0.1) * rate;
      d.duration *= rate;
    }
  });
  plans.set(count, packed);
  return packed;
}
export function contextEntry(count: number, time: number) {
  const packed = plan(count),
    rawExpansion = insightExpansion(time),
    expansion = rawExpansion > 1 - 1e-12 ? 1 : rawExpansion;
  return {
    expansion,
    dots: packed.map((entry, i) => {
      const progress =
        time >= insightFillEnd
          ? 1
          : smooth((time - entry.start) / entry.duration);
      const parent = i < 6 ? { x: 320, y: 320 } : packed[entry.parent].point;
      return {
        x: parent.x + (entry.point.x - parent.x) * progress,
        y: parent.y + (entry.point.y - parent.y) * progress,
        progress,
        r: (4.8 + (9.5 - 4.8) * expansion) * progress,
      };
    }),
  };
}
