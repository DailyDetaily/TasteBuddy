type Point = { x: number; y: number };
type Wall = Point & { length: number; angle: number };
export type FeedbackFace = { points: Point[]; cap: boolean; depth: number };
const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};

// Same turn-then-bend staging as taste-motion.ts feedbackMorph.
export const feedbackPose = (seconds: number) => {
  const progress = ease(seconds / 1.7);
  return {
    rotation: (-Math.PI / 2) * ease(progress / 0.72),
    bend: ease((progress - 0.72) / 0.28),
    spread: ease((seconds - 1.7) / 1.3),
  };
};

// Project the actual extruded SVG faces at Y=+90°, then shorten at the fixed tip.
export const feedbackFaces = (
  walls: Wall[],
  thickness: number,
  perspective: number,
  originalInner: number,
  outer: number,
  inner: number,
): FeedbackFace[] => {
  const scale = (outer - inner) / (outer - originalInner);
  const offset = -outer * (1 - scale);
  const project = (p: Point, z: number): Point => {
    const k = perspective / (perspective + p.x);
    return { x: z * k, y: p.y * k * scale + offset };
  };
  const faces: FeedbackFace[] = walls.map((w) => {
    const a = { x: w.x, y: w.y };
    const angle = (w.angle * Math.PI) / 180;
    const b = {
      x: w.x + w.length * Math.cos(angle),
      y: w.y + w.length * Math.sin(angle),
    };
    return {
      cap: false,
      depth: -(a.x + b.x) / 2,
      points: [
        project(a, -thickness / 2),
        project(b, -thickness / 2),
        project(b, thickness / 2),
        project(a, thickness / 2),
      ],
    };
  });
  for (const z of [-thickness / 2, thickness / 2]) {
    faces.push({
      cap: true,
      depth: -walls.reduce((sum, w) => sum + w.x, 0) / walls.length,
      points: walls.map((w) => project(w, z)),
    });
  }
  return faces.sort((a, b) => a.depth - b.depth);
};

export const clipFeedbackFace = (
  points: Point[],
  inner: number,
  outer: number,
): Point[] => {
  let result = points;
  for (const [edge, sign] of [
    [-outer, 1],
    [-inner, -1],
  ]) {
    const input = result;
    result = [];
    for (let i = 0; i < input.length; i++) {
      const a = input[i],
        b = input[(i + 1) % input.length];
      const ai = (a.y - edge) * sign >= -1e-9,
        bi = (b.y - edge) * sign >= -1e-9;
      if (ai) result.push(a);
      if (ai !== bi) {
        const t = (edge - a.y) / (b.y - a.y);
        result.push({ x: a.x + (b.x - a.x) * t, y: edge });
      }
    }
  }
  return result;
};

export const feedbackPoint = (
  point: Point,
  seconds: number,
  layer: number,
  inner: number,
  outer: number,
  radiusOffset = 0,
): Point => {
  const { rotation, bend, spread } = feedbackPose(seconds);
  const section = (outer - inner) / 3;
  const baseRadius = inner + section * (layer + 0.5);
  const radius = baseRadius + (section / 2) * spread + radiusOffset;
  const half = section / 2;
  const sector = Math.PI / 12;
  const fit =
    (radius * Math.sin(sector)) /
    (Math.abs(Math.sin(rotation)) * Math.cos(sector) +
      Math.abs(Math.cos(rotation)) * Math.sin(sector));
  const along = -point.y - baseRadius;
  const s = (along * Math.min(half, fit)) / half;
  const straight = {
    x: point.x * Math.cos(rotation) + s * Math.sin(rotation),
    y: -radius + point.x * Math.sin(rotation) - s * Math.cos(rotation),
  };
  const angle = (-along / half) * sector;
  const arc = {
    x: (radius + point.x) * Math.sin(angle),
    y: -(radius + point.x) * Math.cos(angle),
  };
  return {
    x: straight.x + (arc.x - straight.x) * bend,
    y: straight.y + (arc.y - straight.y) * bend,
  };
};

// Subdivide before bending so long original polygon edges become smooth arcs.
export const feedbackFacePath = (
  points: Point[],
  seconds: number,
  layer: number,
  inner: number,
  outer: number,
  radiusOffset = 0,
) => {
  if (points.length < 3) return "";
  const mapped: Point[] = [];
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let j = 0; j < count; j++) {
      const t = j / count;
      mapped.push(
        feedbackPoint(
          { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
          seconds,
          layer,
          inner,
          outer,
          radiusOffset,
        ),
      );
    }
  });
  return (
    mapped
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(4)},${p.y.toFixed(4)}`,
      )
      .join(" ") + " Z"
  );
};

// Periodic outward flow; reset occurs only while the individual ring is invisible.
// Normalize each starting phase so the transition hands off three opaque rings.
export const feedbackLoopRings = (
  seconds: number,
  inner: number,
  outer: number,
) => {
  const fade = (phase: number) =>
    ease(phase / 0.12) * (1 - ease((phase - 0.75) / 0.25));
  return Array.from({ length: 3 }, (_, layer) => {
    const initial = 1 / 6 + layer / 3;
    const phase = (((initial + Math.max(0, seconds) / 3) % 1) + 1) % 1;
    const radius = inner + (outer - inner) * phase;
    const base = inner + (outer - inner) * initial;
    return {
      radius,
      offset: radius - base,
      opacity: Math.min(1, fade(phase) / fade(initial)),
    };
  });
};
