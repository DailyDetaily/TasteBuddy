import { BUBBLE_AXES } from "./catalog";
import { NATIVE_BUBBLE_LAYOUT } from "./native-layout";
import type { AxisID, Bubble, Point } from "./types";

export const MAP = {
  size: 1680,
  center: 840,
  diameter: 126,
  selectedDiameter: 164,
  spacing: 136,
  gap: 10,
  entryZoom: 0.86,
  selectedZoom: 1,
  viewport: 720,
} as const;

export const GRID_FINAL_ZOOM = 0.134;
// Two offscreen rows plus a radius absorb repulsion and prevent edge pop-in.
// This is WORLD space, not a large screen-space margin multiplied by zoom-out.
export const GRID_GUARD_WORLD = MAP.spacing * 2 + MAP.selectedDiameter / 2;
export const GRID_INTERACTION_RING = 7;
const ROW_HEIGHT = (MAP.spacing * Math.sqrt(3)) / 2;

export function hexPoint(q: number, r: number): Point {
  return {
    x: MAP.center + MAP.spacing * (q + r / 2),
    y: MAP.center + ROW_HEIGHT * r,
  };
}

export function hexCell(point: Point): { q: number; r: number } {
  const rf = (point.y - MAP.center) / ROW_HEIGHT;
  const qf = (point.x - MAP.center) / MAP.spacing - rf / 2;
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const qError = Math.abs(q - qf);
  const rError = Math.abs(r - rf);
  const sError = Math.abs(s - sf);
  if (qError > rError && qError > sError) q = -r - s;
  else if (rError > sError) r = -q - s;
  return { q: q === 0 ? 0 : q, r: r === 0 ? 0 : r };
}

export function hexRing(q: number, r: number): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
}

export function axisAtCell(q: number, r: number): AxisID {
  const point = hexPoint(q, r);
  const angle =
    (Math.atan2(point.y - MAP.center, point.x - MAP.center) * 180) / Math.PI;
  const distance = (degrees: number) =>
    Math.abs(((angle - degrees + 540) % 360) - 180);
  return BUBBLE_AXES.reduce((best, axis) =>
    distance(axis.angle) < distance(best.angle) ? axis : best,
  ).id;
}

// The source 72 retain their actual native coordinates, identities and delays.
export function makeBaseBubbles(): Bubble[] {
  const slots = new Map<string, (typeof NATIVE_BUBBLE_LAYOUT)[number]>(
    NATIVE_BUBBLE_LAYOUT.map((point) => [point.id, point]),
  );
  return BUBBLE_AXES.flatMap((axis) =>
    axis.words.map((word, i): Bubble => {
      const id = `${axis.id}-${word.key}`;
      const slot = slots.get(id);
      if (!slot) throw new Error(`Missing native bubble map position: ${id}`);
      const cell = hexCell(slot);
      const expected = hexPoint(cell.q, cell.r);
      if (Math.hypot(slot.x - expected.x, slot.y - expected.y) > 1e-5) {
        throw new Error(`Native bubble is off the shared hex grid: ${id}`);
      }
      return {
        id,
        kind: "native",
        ...cell,
        axis: axis.id,
        label: word.label,
        description: word.description,
        intensity: word.intensity,
        x: slot.x,
        y: slot.y,
        diameter: slot.diameter,
        introDelay: slot.introDelay,
        primary: i === 0,
      };
    }),
  );
}
export const BASE_BUBBLES = makeBaseBubbles();
const NATIVE_CELLS = new Set(
  BASE_BUBBLES.map((bubble) => `${bubble.q}:${bubble.r}`),
);

function extraAtCell(q: number, r: number): Bubble {
  const axisID = axisAtCell(q, r);
  const axis = BUBBLE_AXES.find((item) => item.id === axisID)!;
  // Stable by cell, never by the current viewport's array index.
  const hash = (Math.imul(q, 73856093) ^ Math.imul(r, 19349663)) >>> 0;
  const word = axis.words[hash % axis.words.length];
  return {
    id: `grid:${q}:${r}`,
    kind: "extended",
    q,
    r,
    axis: axisID,
    label: word.label,
    description: word.description,
    intensity: word.intensity,
    ...hexPoint(q, r),
    diameter: MAP.diameter,
    introDelay: 0,
    primary: false,
  };
}

/**
 * One bounded collection for layout, repulsion and rendering.
 * No permanent thousands-of-items atlas and no separate background layer.
 * Native + two neighboring rings stabilize the interaction solve; only the
 * current camera rectangle and its small guard band are generated beyond it.
 */
export function buildBubbleGrid(camera: Point, zoom: number, rotationDegrees = 0): Bubble[] {
  if (![camera.x, camera.y, zoom, rotationDegrees].every(Number.isFinite) || zoom < 0.08) {
    throw new Error("Invalid or excessive bubble-grid viewport.");
  }
  const cells = new Map<string, Bubble>();
  const append = (q: number, r: number) => {
    if (q === 0 && r === 0) return; // Intentional native center void.
    const key = `${q}:${r}`;
    if (!NATIVE_CELLS.has(key) && !cells.has(key))
      cells.set(key, extraAtCell(q, r));
  };
  for (let r = -GRID_INTERACTION_RING; r <= GRID_INTERACTION_RING; r++) {
    for (let q = -GRID_INTERACTION_RING; q <= GRID_INTERACTION_RING; q++) {
      if (hexRing(q, r) <= GRID_INTERACTION_RING) append(q, r);
    }
  }
  const halfWidth = MAP.viewport / (2 * zoom) + GRID_GUARD_WORLD;
  const angle = rotationDegrees * Math.PI / 180;
  const c = Math.cos(angle), s = Math.sin(angle);
  const rotatedHalf = halfWidth * (Math.abs(c) + Math.abs(s));
  const rMin = Math.ceil((camera.y - rotatedHalf - MAP.center) / ROW_HEIGHT);
  const rMax = Math.floor((camera.y + rotatedHalf - MAP.center) / ROW_HEIGHT);
  for (let r = rMin; r <= rMax; r++) {
    const qMin = Math.ceil(
      (camera.x - rotatedHalf - MAP.center) / MAP.spacing - r / 2,
    );
    const qMax = Math.floor(
      (camera.x + rotatedHalf - MAP.center) / MAP.spacing - r / 2,
    );
    for (let q = qMin; q <= qMax; q++) {
      const point = hexPoint(q, r);
      const dx = point.x - camera.x, dy = point.y - camera.y;
      // Sample the inverse-rotated viewport, not a huge square bounding box.
      if (Math.abs(dx*c-dy*s) <= halfWidth && Math.abs(dx*s+dy*c) <= halfWidth) append(q, r);
    }
  }
  return [
    ...BASE_BUBBLES,
    ...[...cells.values()].sort((a, b) => a.r - b.r || a.q - b.q),
  ];
}

export type GridExpansion = Point & { id: string; amount: number };

/**
 * Same displacement envelope for every grid cell. Do not add three full
 * radius increments together: that inflates the entire surrounding lattice.
 * Normalize the active selections and let local contacts provide only the
 * remaining clearance. Full selection keeps its own original anchor.
 */
export function expandBubbleGrid(
  bubbles: Bubble[],
  expansions: GridExpansion[],
): Bubble[] {
  if (expansions.length === 0) return bubbles;
  const increment = (MAP.selectedDiameter - MAP.diameter) / 2;
  return bubbles.map((bubble) => {
    const own = expansions.find((item) => item.id === bubble.id)?.amount ?? 0;
    let x = 0;
    let y = 0;
    let total = 0;
    for (const anchor of expansions) {
      if (anchor.id === bubble.id) continue;
      const dx = bubble.x - anchor.x;
      const dy = bubble.y - anchor.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      x += (dx / distance) * increment * anchor.amount * (1 - own);
      y += (dy / distance) * increment * anchor.amount * (1 - own);
      total += anchor.amount;
    }
    const normalizer = Math.max(1, total);
    return {
      ...bubble,
      x: bubble.x + x / normalizer,
      y: bubble.y + y / normalizer,
    };
  });
}

// Build the broad phase once per topology rather than reconstructing a hash
// map in every solver iteration. Two hex rings include all potential contacts
// in the small 126→164 selection range, including native/added seam pairs.
const PAIR_OFFSETS: { q: number; r: number }[] = [];
for (let q = -2; q <= 2; q++)
  for (let r = -2; r <= 2; r++) {
    if (hexRing(q, r) > 0 && hexRing(q, r) <= 2) PAIR_OFFSETS.push({ q, r });
  }
let cachedTopology = "";
let cachedPairs: [number, number][] = [];
function contactPairs(bubbles: Bubble[]): [number, number][] {
  const topology = bubbles.map((b) => `${b.q}:${b.r}`).join(";");
  if (topology === cachedTopology) return cachedPairs;
  const index = new Map(bubbles.map((b, i) => [`${b.q}:${b.r}`, i]));
  const pairs: [number, number][] = [];
  bubbles.forEach((b, i) => {
    for (const offset of PAIR_OFFSETS) {
      const j = index.get(`${b.q + offset.q}:${b.r + offset.r}`);
      if (j !== undefined && j > i) pairs.push([i, j]);
    }
  });
  cachedTopology = topology;
  cachedPairs = pairs;
  return pairs;
}

/** One frame-local shared solve; a cell's source never affects its spacing. */
export function relaxBubbles(bubbles: Bubble[]): Bubble[] {
  const pairs = contactPairs(bubbles);
  const x = Float64Array.from(bubbles, (b) => b.x);
  const y = Float64Array.from(bubbles, (b) => b.y);
  const minimum = pairs.map(
    ([i, j]) => (bubbles[i].diameter + bubbles[j].diameter) / 2 + MAP.gap,
  );
  for (let iteration = 0; iteration < 320; iteration++) {
    let worstOverlap = 0;
    for (let k = 0; k < pairs.length; k++) {
      const [i, j] = pairs[k];
      let dx = x[j] - x[i];
      let dy = y[j] - y[i];
      const target = minimum[k];
      if (Math.abs(dx) >= target || Math.abs(dy) >= target) continue;
      let distance = Math.hypot(dx, dy);
      if (distance < 1e-8) {
        dx = 1;
        dy = 0;
        distance = 1;
      }
      const overlap = target - distance;
      if (overlap <= 0.002) continue;
      worstOverlap = Math.max(worstOverlap, overlap);
      const factor = overlap / (2 * distance);
      x[i] -= dx * factor;
      y[i] -= dy * factor;
      x[j] += dx * factor;
      y[j] += dy * factor;
    }
    if (worstOverlap <= 0.002) break;
  }
  return bubbles.map((b, i) => ({ ...b, x: x[i], y: y[i] }));
}

// Stable line breaks, independent of browser font load order.
export function bubbleLabelLines(label: string): string[] {
  const lines: string[] = [];
  let current = "";
  const units = (text: string) =>
    [...text].reduce(
      (n, c) => n + (/\s/.test(c) ? 0.35 : /[A-Za-z0-9]/.test(c) ? 0.6 : 1),
      0,
    );
  for (const word of label.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && units(next) > 7.2) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}
