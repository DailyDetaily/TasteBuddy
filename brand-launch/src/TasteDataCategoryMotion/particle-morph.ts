import type { Dot, Frame } from "./types";

// BX presentation only: particle correspondence is not a relationship between records.
// One track per particle. The native/category measurement geometry is never modified.
export const CATEGORY_TRANSITION_FRAMES = 45;
const CENTER = 320;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const particleEase = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const particleMotionEase = (value: number) => {
  const t = clamp(value);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

type Point = { x: number; y: number };
export type ParticleDot = Pick<
  Dot,
  "id" | "x" | "y" | "r" | "color" | "opacity"
>;
export type ParticleTrack = {
  id: string;
  source: ParticleDot;
  target: ParticleDot;
  kind: "matched" | "appearing" | "retiring";
  delay: number;
  finish: number;
  control1: Point;
  control2: Point;
};
export type ParticlePlan = { tracks: ParticleTrack[] };

const seeded = (key: string) => {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const channels = (color: string): number[] => {
  const hex = color.slice(1);
  if (!color.startsWith("#") || !/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) {
    throw new Error(`Expected an opaque hex motion token, received ${color}`);
  }
  const n = parseInt(
    hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex,
    16,
  );
  return [16, 8, 0].map((shift) => (n >>> shift) & 255);
};
const mixColor = (from: string, to: string, progress: number) => {
  const a = channels(from),
    b = channels(to);
  return (
    "#" +
    a
      .map((value, i) =>
        Math.round(lerp(value, b[i], progress))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};
export const resolvedParticleDot = (dot: Dot): ParticleDot => ({
  id: dot.id,
  x: dot.x,
  y: dot.y,
  r: dot.r,
  opacity: dot.opacity,
  color: mixColor(dot.color, dot.tintColor ?? dot.color, clamp(dot.tint ?? 0)),
});
const radius = (p: Point) => Math.hypot(p.x - CENTER, p.y - CENTER);
const stableOrder = (dots: Dot[]) =>
  [...dots]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(resolvedParticleDot);

// Prefer a destination across the center, with a different seeded bearing per source.
// Nearest-neighbor matching was the reason the earlier transition stayed local.
const crossingCost = (
  source: ParticleDot,
  target: ParticleDot,
  seed: string,
) => {
  const r0 = Math.max(1, radius(source)),
    r1 = Math.max(1, radius(target));
  const sx = (source.x - CENTER) / r0,
    sy = (source.y - CENTER) / r0;
  const tx = (target.x - CENTER) / r1,
    ty = (target.y - CENTER) / r1;
  const turn = (seeded(`${seed}:${source.id}:bearing`) - 0.5) * 1.3;
  const desiredX = -sx * Math.cos(turn) + sy * Math.sin(turn);
  const desiredY = -sx * Math.sin(turn) - sy * Math.cos(turn);
  const sameSide = sx * tx + sy * ty;
  return (
    (desiredX - tx) ** 2 +
    (desiredY - ty) ** 2 +
    (sameSide > -0.25 ? 8 * (sameSide + 1.25) : 0) +
    0.04 * seeded(`${seed}:${source.id}:${target.id}:choice`)
  );
};

// Rectangular assignment (rows <= columns): every real endpoint is used exactly once.
function assign(
  rows: ParticleDot[],
  columns: ParticleDot[],
  costFor: (row: ParticleDot, column: ParticleDot) => number,
): number[] {
  const n = rows.length,
    m = columns.length;
  const matrix = rows.map((row) =>
    columns.map((column) => costFor(row, column)),
  );
  const u = new Float64Array(n + 1),
    v = new Float64Array(m + 1);
  const owners = new Int32Array(m + 1),
    previous = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    owners[0] = i;
    let j0 = 0;
    const costs = new Float64Array(m + 1).fill(Infinity);
    const used = new Uint8Array(m + 1);
    do {
      used[j0] = 1;
      const row = owners[j0];
      let delta = Infinity,
        next = 0;
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue;
        const cost = matrix[row - 1][j - 1] - u[row] - v[j];
        if (cost < costs[j]) {
          costs[j] = cost;
          previous[j] = j0;
        }
        if (costs[j] < delta) {
          delta = costs[j];
          next = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[owners[j]] += delta;
          v[j] -= delta;
        } else costs[j] -= delta;
      }
      j0 = next;
    } while (owners[j0] !== 0);
    do {
      const next = previous[j0];
      owners[j0] = owners[next];
      j0 = next;
    } while (j0 !== 0);
  }
  const result = Array<number>(n).fill(-1);
  for (let j = 1; j <= m; j++) if (owners[j]) result[owners[j] - 1] = j - 1;
  return result;
}

const invisibleAcross = (
  dot: ParticleDot,
  candidates: ParticleDot[],
  id: string,
  seed: string,
): ParticleDot => {
  const opposite = candidates.reduce<ParticleDot | undefined>(
    (best, candidate) =>
      !best ||
      crossingCost(dot, candidate, seed) < crossingCost(dot, best, seed)
        ? candidate
        : best,
    undefined,
  );
  // Missing endpoints are invisible; they do not create extra visible records.
  return { ...(opposite ?? dot), id, opacity: 0 };
};
const inEnvelope = (point: Point, outer: number): Point => {
  const r = radius(point),
    scale = r > outer && r > 0 ? outer / r : 1;
  return {
    x: CENTER + (point.x - CENTER) * scale,
    y: CENTER + (point.y - CENTER) * scale,
  };
};
const onChord = (a: Point, b: Point, t: number): Point => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

export function makeParticlePlan(
  from: Frame,
  to: Frame,
  seed: string,
): ParticlePlan {
  const source = stableOrder(from.dots),
    target = stableOrder(to.dots);
  const pairs: {
    source: ParticleDot;
    target: ParticleDot;
    kind: ParticleTrack["kind"];
  }[] = [];
  if (source.length <= target.length) {
    const matching = assign(source, target, (a, b) => crossingCost(a, b, seed));
    const taken = new Set(matching);
    matching.forEach((j, i) =>
      pairs.push({ source: source[i], target: target[j], kind: "matched" }),
    );
    target.forEach((dot, j) => {
      if (!taken.has(j))
        pairs.push({
          source: invisibleAcross(dot, source, `birth:${dot.id}`, seed),
          target: dot,
          kind: "appearing",
        });
    });
  } else {
    const matching = assign(target, source, (b, a) => crossingCost(a, b, seed));
    const taken = new Set(matching);
    matching.forEach((i, j) =>
      pairs.push({ source: source[i], target: target[j], kind: "matched" }),
    );
    source.forEach((dot, i) => {
      if (!taken.has(i))
        pairs.push({
          source: dot,
          target: invisibleAcross(dot, target, `retire:${dot.id}`, seed),
          kind: "retiring",
        });
    });
  }
  const outer = Math.max(0, ...source.map(radius), ...target.map(radius));
  return {
    tracks: pairs.map((pair) => {
      const id = `${seed}:${pair.source.id}->${pair.target.id}`;
      const random = (name: string) => seeded(id + ":" + name);
      const dx = pair.target.x - pair.source.x,
        dy = pair.target.y - pair.source.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const normal = { x: -dy / length, y: dx / length };
      const control = (t: number, name: string) => {
        const anchor = onChord(pair.source, pair.target, t);
        const bend = (random(name) - 0.5) * outer * 1.05;
        return inEnvelope(
          { x: anchor.x + normal.x * bend, y: anchor.y + normal.y * bend },
          outer,
        );
      };
      // Spread crossing times across the transition instead of collapsing all points at t=0.5.
      const phase = random("phase");
      return {
        ...pair,
        id,
        delay: 0.02 + 0.36 * phase,
        finish: clamp(
          0.56 + 0.4 * phase + (random("speed") - 0.5) * 0.06,
          0.54,
          0.98,
        ),
        control1: control(0.22, "bend1"),
        control2: control(0.78, "bend2"),
      };
    }),
  };
}

// Cartesian cubic paths cross the former central exclusion zone. There is no radius floor,
// shared center waypoint, shared rotation or parent scale. Bounded control points guarantee
// the entire curve stays in the source/target envelope without clamping the animated path.
const pathPoint = (track: ParticleTrack, t: number): Point => {
  const q = 1 - t;
  const coordinate = (axis: "x" | "y") =>
    q ** 3 * track.source[axis] +
    3 * q * q * t * track.control1[axis] +
    3 * q * t * t * track.control2[axis] +
    t ** 3 * track.target[axis];
  return { x: coordinate("x"), y: coordinate("y") };
};

export function sampleParticlePlan(
  plan: ParticlePlan,
  progress: number,
): ParticleDot[] {
  if (!Number.isFinite(progress))
    throw new Error("Particle progress must be finite.");
  const p = clamp(progress);
  return plan.tracks.map((track) => {
    const { source, target } = track;
    if (p === 0) return { ...source, id: track.id };
    if (p === 1) return { ...target, id: track.id };
    const local = clamp((p - track.delay) / (track.finish - track.delay));
    // Strong slow → fast → slow motion: particles ease out of the old
    // formation, move fastest through the center-crossing phase, then
    // ease into the new formation without a hard stop.
    const move = particleMotionEase(local);
    const point = pathPoint(track, move);
    const opacity =
      track.kind === "appearing"
        ? target.opacity * particleEase(local / 0.22)
        : track.kind === "retiring"
          ? source.opacity * (1 - particleEase((local - 0.76) / 0.24))
          : lerp(source.opacity, target.opacity, move);
    return {
      id: track.id,
      ...point,
      r: lerp(source.r, target.r, move),
      color: mixColor(
        source.color,
        target.color,
        particleEase((local - 0.12) / 0.76),
      ),
      opacity,
    };
  });
}

export function particleTransitionAt(
  plan: ParticlePlan,
  frame: number,
  duration = CATEGORY_TRANSITION_FRAMES,
) {
  if (!Number.isInteger(duration) || duration < 2 || !Number.isFinite(frame)) {
    throw new Error(
      "Particle transition requires a finite frame and at least two frames.",
    );
  }
  const progress = clamp(frame / (duration - 1));
  return {
    progress,
    dots: sampleParticlePlan(plan, progress),
    outgoingText: 1 - particleEase(progress / 0.14),
    incomingText: particleEase((progress - 0.89) / 0.11),
  };
}
