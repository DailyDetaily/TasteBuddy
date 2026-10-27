import { getBoundingBox, getLength, getPointAtLength } from "@remotion/paths";
import type { FoodIconEntry } from "../FoodIcons/catalog";
import { prepareIconMorph } from "../FoodIcons/transition-shapes";

type Point = { x: number; y: number };
const SAMPLE_COUNT = 192;
const distance = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const smoothstep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const sample = (path: string) => {
  const length = getLength(path);
  const box = getBoundingBox(path);
  // Unmatched details grow from a zero-length anchor.
  const anchor = { x: box.x1, y: box.y1 };
  return Array.from(
    { length: SAMPLE_COUNT + 1 },
    (_, index) =>
      getPointAtLength(
        path,
        Math.min(length, (length * index) / SAMPLE_COUNT),
      ) ?? anchor,
  );
};

// Equal arc-length samples avoid interpolating unrelated SVG control points.
// A closed contour may start anywhere without changing its silhouette.
const alignSamples = (from: Point[], to: Point[]) => {
  const sourceClosed = distance(from[0], from[SAMPLE_COUNT]) < 1e-8;
  const targetClosed = distance(to[0], to[SAMPLE_COUNT]) < 1e-8;
  const rotateSource = sourceClosed && !targetClosed;
  let best = { from, to };
  let bestCost = Infinity;
  for (const reversed of [false, true]) {
    const target = reversed ? [...to].reverse() : to;
    const offsets = sourceClosed || targetClosed ? SAMPLE_COUNT : 1;
    for (let offset = 0; offset < offsets; offset++) {
      const sourceAt = (index: number) =>
        rotateSource ? from[(index + offset) % SAMPLE_COUNT] : from[index];
      const targetAt = (index: number) =>
        targetClosed ? target[(index + offset) % SAMPLE_COUNT] : target[index];
      let cost = 0;
      for (let index = 0; index <= SAMPLE_COUNT; index += 4) {
        cost += distance(sourceAt(index), targetAt(index));
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = {
          from: from.map((_, index) => sourceAt(index)),
          to: to.map((_, index) => targetAt(index)),
        };
      }
    }
  }
  return best;
};

export const prepareCategoryIconMorph = (
  from: FoodIconEntry,
  to: FoodIconEntry,
) =>
  prepareIconMorph(from, to).map((part) => ({
    ...part,
    samples: alignSamples(sample(part.from), sample(part.to)),
  }));

export type CategoryIconMorphPart = ReturnType<
  typeof prepareCategoryIconMorph
>[number];

export const categoryIconMorphPaths = (
  parts: CategoryIconMorphPart[],
  progress: number,
) =>
  parts.map((part) => ({
    d:
      progress === 0
        ? part.from
        : progress === 1
          ? part.to
          : part.samples.from
              .map((from, index) => {
                const to = part.samples.to[index];
                const x = from.x + (to.x - from.x) * progress;
                const y = from.y + (to.y - from.y) * progress;
                return `${index === 0 ? "M" : "L"}${x} ${y}`;
              })
              .join(""),
    strokeWidth: part.fromWidth + (part.toWidth - part.fromWidth) * progress,
    opacity:
      (part.fromOpacity + (part.toOpacity - part.fromOpacity) * progress) *
      // Clear outgoing details before incoming details become prominent.
      // Both fade curves have smooth starts and finishes.
      (part.entering
        ? smoothstep((progress - 0.25) / 0.75)
        : part.leaving
          ? 1 - smoothstep(progress / 0.75)
          : 1),
  }));
