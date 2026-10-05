import { parsePath, reduceInstructions } from "@remotion/paths";

type Point = { x: number; y: number };
type Curve = { from: Point; first: Point; second: Point; to: Point };
export type FruitBite = Point & { radius: number };
const TAU = Math.PI * 2;
const EPSILON = 0.000001;
const SAMPLE_COUNT = 64;

const mix = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const split = (curve: Curve, t: number): [Curve, Curve] => {
  const a = mix(curve.from, curve.first, t);
  const b = mix(curve.first, curve.second, t);
  const c = mix(curve.second, curve.to, t);
  const d = mix(a, b, t);
  const e = mix(b, c, t);
  const middle = mix(d, e, t);
  return [
    { from: curve.from, first: a, second: d, to: middle },
    { from: middle, first: e, second: c, to: curve.to },
  ];
};

const pointAt = (curve: Curve, t: number): Point => {
  const u = 1 - t;
  return {
    x:
      u ** 3 * curve.from.x +
      3 * u * u * t * curve.first.x +
      3 * u * t * t * curve.second.x +
      t ** 3 * curve.to.x,
    y:
      u ** 3 * curve.from.y +
      3 * u * u * t * curve.first.y +
      3 * u * t * t * curve.second.y +
      t ** 3 * curve.to.y,
  };
};

const circleDistance = (point: Point, bite: FruitBite) =>
  (point.x - bite.x) ** 2 + (point.y - bite.y) ** 2 - bite.radius ** 2;
const circlePoint = (bite: FruitBite, angle: number): Point => ({
  x: bite.x + Math.cos(angle) * bite.radius,
  y: bite.y + Math.sin(angle) * bite.radius,
});
const angleAt = (bite: FruitBite, point: Point) =>
  ((Math.atan2(point.y - bite.y, point.x - bite.x) % TAU) + TAU) % TAU;
const number = (value: number) => Number(value.toFixed(5));
const position = (point: Point) => `${number(point.x)} ${number(point.y)}`;
const unique = (values: number[]) =>
  values
    .sort((a, b) => a - b)
    .filter(
      (value, index, sorted) =>
        index === 0 || value - sorted[index - 1] > EPSILON,
    );

export const prepareFruitOutline = (source: string) => {
  const curves: Curve[] = [];
  let current: Point = { x: 0, y: 0 };
  let start = current;
  const line = (to: Point) => {
    if (Math.hypot(to.x - current.x, to.y - current.y) > EPSILON)
      curves.push({
        from: current,
        first: mix(current, to, 1 / 3),
        second: mix(current, to, 2 / 3),
        to,
      });
    current = to;
  };
  for (const instruction of reduceInstructions(parsePath(source))) {
    if (instruction.type === "M") {
      current = { x: instruction.x, y: instruction.y };
      start = current;
    } else if (instruction.type === "C") {
      const to = { x: instruction.x, y: instruction.y };
      curves.push({
        from: current,
        first: { x: instruction.cp1x, y: instruction.cp1y },
        second: { x: instruction.cp2x, y: instruction.cp2y },
        to,
      });
      current = to;
    } else if (instruction.type === "L") {
      line({ x: instruction.x, y: instruction.y });
    } else if (instruction.type === "Z") {
      line(start);
    }
  }
  const sampled = curves.map((curve) => ({
    curve,
    points: Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) =>
      pointAt(curve, index / SAMPLE_COUNT),
    ),
  }));
  return {
    source,
    sampled,
    polygon: sampled.flatMap(({ points }) => points.slice(0, -1)),
  };
};

type Outline = ReturnType<typeof prepareFruitOutline>;

const insideBody = (point: Point, polygon: Point[]) => {
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const a = polygon[index];
    const b = polygon[previous];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
};

const curveIntersections = (curve: Curve, points: Point[], bite: FruitBite) => {
  const roots: number[] = [];
  for (let index = 0; index < SAMPLE_COUNT; index++) {
    let low = index / SAMPLE_COUNT;
    let high = (index + 1) / SAMPLE_COUNT;
    let lowValue = circleDistance(points[index], bite);
    const highValue = circleDistance(points[index + 1], bite);
    if (Math.abs(lowValue) < EPSILON) roots.push(low);
    if (lowValue * highValue >= 0) continue;
    for (let iteration = 0; iteration < 26; iteration++) {
      const middle = (low + high) / 2;
      const value = circleDistance(pointAt(curve, middle), bite);
      if (lowValue * value <= 0) high = middle;
      else {
        low = middle;
        lowValue = value;
      }
    }
    roots.push((low + high) / 2);
  }
  if (Math.abs(circleDistance(points[SAMPLE_COUNT], bite)) < EPSILON)
    roots.push(1);
  return unique(roots);
};

const circleIntersections = (a: FruitBite, b: FruitBite): Point[] => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (
    distance < EPSILON ||
    distance >= a.radius + b.radius ||
    distance <= Math.abs(a.radius - b.radius)
  )
    return [];
  const along =
    (a.radius ** 2 - b.radius ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, a.radius ** 2 - along ** 2));
  const center = {
    x: a.x + (dx * along) / distance,
    y: a.y + (dy * along) / distance,
  };
  return [
    {
      x: center.x - (dy * height) / distance,
      y: center.y + (dx * height) / distance,
    },
    {
      x: center.x + (dy * height) / distance,
      y: center.y - (dx * height) / distance,
    },
  ];
};

// Keep the source's surviving Bézier curves and add only the exposed circular
// bite edges. Overlapping bites share one boundary, including the final core.
export const fruitOutline = (outline: Outline, bites: FruitBite[]) => {
  const active = bites.filter((bite) => bite.radius > 0.001);
  if (!active.length) return outline.source;
  const angles = active.map(() => [0, TAU]);
  const pieces: string[] = [];
  for (const { curve, points } of outline.sampled) {
    const cuts = [0, 1];
    active.forEach((bite, index) => {
      const roots = curveIntersections(curve, points, bite);
      cuts.push(...roots);
      angles[index].push(
        ...roots.map((root) => angleAt(bite, pointAt(curve, root))),
      );
    });
    const boundaries = unique(cuts);
    for (let index = 1; index < boundaries.length; index++) {
      const from = boundaries[index - 1];
      const to = boundaries[index];
      if (
        active.some(
          (bite) =>
            circleDistance(pointAt(curve, (from + to) / 2), bite) < -EPSILON,
        )
      )
        continue;
      const prefix = to === 1 ? curve : split(curve, to)[0];
      const segment = from === 0 ? prefix : split(prefix, from / to)[1];
      pieces.push(
        `M${position(segment.from)}C${position(segment.first)} ${position(segment.second)} ${position(segment.to)}`,
      );
    }
  }
  active.forEach((bite, index) => {
    for (let other = index + 1; other < active.length; other++) {
      for (const intersection of circleIntersections(bite, active[other])) {
        angles[index].push(angleAt(bite, intersection));
        angles[other].push(angleAt(active[other], intersection));
      }
    }
  });
  active.forEach((bite, index) => {
    const boundaries = unique(angles[index]);
    for (let part = 1; part < boundaries.length; part++) {
      const from = boundaries[part - 1];
      const to = boundaries[part];
      const middle = circlePoint(bite, (from + to) / 2);
      if (
        !insideBody(middle, outline.polygon) ||
        active.some(
          (other, otherIndex) =>
            otherIndex !== index && circleDistance(middle, other) < -EPSILON,
        )
      )
        continue;
      pieces.push(
        `M${position(circlePoint(bite, from))}A${number(bite.radius)} ${number(bite.radius)} 0 ${to - from > Math.PI ? 1 : 0} 1 ${position(circlePoint(bite, to))}`,
      );
    }
  });
  return pieces.join(" ");
};
