type Point = { x: number; y: number };
export type LineRadii = { inner: number; outer: number };
export type PetalWall = { x: number; y: number; length: number; angle: number };
const mid = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

// Radial bounds of the exact cubic silhouette after the held +90° Y turn.
// Refine local extrema after coarse bracketing; do not infer the radius from
// the SVG viewBox, whose control handles extend beyond the drawn outline.
export const projectedPetalRadii = (
  path: string,
  scale: number,
  pivot: Point,
  perspective: number,
  yDegrees = 90,
): LineRadii => {
  const v = path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)!.map(Number);
  let a = { x: v[0], y: v[1] };
  let inner = Infinity,
    outer = -Infinity;
  for (let i = 2; i < v.length; i += 6) {
    const b = { x: v[i], y: v[i + 1] };
    const c = { x: v[i + 2], y: v[i + 3] };
    const d = { x: v[i + 4], y: v[i + 5] };
    const radius = (t: number) => {
      const u = 1 - t;
      const x =
        u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x;
      const y =
        u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y;
      return (
        ((pivot.y - y) * scale * perspective) /
        (perspective +
          (x - pivot.x) * scale * Math.sin((yDegrees * Math.PI) / 180))
      );
    };
    const samples = Array.from({ length: 65 }, (_, j) => radius(j / 64));
    inner = Math.min(inner, ...samples);
    outer = Math.max(outer, ...samples);
    for (let j = 1; j < 64; j++) {
      const maximum =
        samples[j] >= samples[j - 1] && samples[j] >= samples[j + 1];
      const minimum =
        samples[j] <= samples[j - 1] && samples[j] <= samples[j + 1];
      if (!maximum && !minimum) continue;
      let lo = (j - 1) / 64,
        hi = (j + 1) / 64;
      for (let k = 0; k < 48; k++) {
        const l = lo + (hi - lo) / 3,
          r = hi - (hi - lo) / 3;
        if (radius(l) < radius(r) === maximum) lo = l;
        else hi = r;
      }
      const refined = radius((lo + hi) / 2);
      inner = Math.min(inner, refined);
      outer = Math.max(outer, refined);
    }
    a = d;
  }
  return { inner, outer };
};

// Subdivide the supplied cubic outline to <= 0.12px side-wall error.
// The front/back SVG faces still use the exact, unmodified source path.
export const petalWalls = (
  path: string,
  scale: number,
  pivot: Point,
): PetalWall[] => {
  const values = path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)!.map(Number);
  if (values.length !== 32 || (path.match(/C/g) ?? []).length !== 5)
    throw new Error("Expected the original M + five cubic petal path.");
  const point = (i: number): Point => ({
    x: (values[i] - pivot.x) * scale,
    y: (values[i + 1] - pivot.y) * scale,
  });
  const contour: Point[] = [point(0)];
  const flatten = (a: Point, b: Point, c: Point, d: Point, depth: number) => {
    const dx = d.x - a.x,
      dy = d.y - a.y;
    const length = Math.hypot(dx, dy);
    const distance = (p: Point) =>
      length > 0
        ? Math.abs(dy * (p.x - a.x) - dx * (p.y - a.y)) / length
        : Math.hypot(p.x - a.x, p.y - a.y);
    if (depth >= 10 || Math.max(distance(b), distance(c)) <= 0.12) {
      contour.push(d);
      return;
    }
    const ab = mid(a, b),
      bc = mid(b, c),
      cd = mid(c, d);
    const abc = mid(ab, bc),
      bcd = mid(bc, cd),
      split = mid(abc, bcd);
    flatten(a, ab, abc, split, depth + 1);
    flatten(split, bcd, cd, d, depth + 1);
  };
  let start = point(0);
  for (let i = 2; i < values.length; i += 6) {
    const end = point(i + 4);
    flatten(start, point(i), point(i + 2), end, 0);
    start = end;
  }
  // Last cubic ends at the starting vertex; no open seam or duplicate wall.
  return contour.slice(0, -1).map((a, i) => {
    const b = contour[i + 1];
    return {
      x: a.x,
      y: a.y,
      length: Math.hypot(b.x - a.x, b.y - a.y),
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
  });
};

export const sidewallColor = (fill: string) => {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(fill);
  if (!hex) return fill;
  return `rgb(${hex
    .slice(1)
    .map((v) => Math.min(255, parseInt(v, 16) + 24))
    .join(", ")})`;
};
