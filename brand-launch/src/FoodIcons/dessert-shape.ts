import { getBoundingBox, parsePath, reduceInstructions } from "@remotion/paths";

type Point = { x: number; y: number };
type Curve = { from: Point; first: Point; second: Point; to: Point };
const mix = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const n = (value: number) => Number(value.toFixed(5));
const xy = (point: Point, offset = 0) => `${n(point.x)} ${n(point.y + offset)}`;

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
const at = (curve: Curve, t: number) => split(curve, t)[0].to;
const root = (fn: (value: number) => number, from: number, to: number) => {
  if (Math.abs(fn(from)) < 0.00000001) return from;
  if (Math.abs(fn(to)) < 0.00000001) return to;
  let low = from;
  let high = to;
  const sign = fn(low) >= 0;
  for (let index = 0; index < 28; index++) {
    const middle = (low + high) / 2;
    if (fn(middle) >= 0 === sign) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
};
const tAtY = (curve: Curve, y: number) => {
  if (y <= curve.from.y) return 0;
  if (y >= curve.to.y) return 1;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 28; index++) {
    const middle = (low + high) / 2;
    if (at(curve, middle).y < y) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
};

export const prepareDessertShape = (body: string, layers: string[]) => {
  const commands = reduceInstructions(parsePath(body));
  const first = commands[0];
  const tip = commands[1];
  const rear = commands[6];
  const back = commands[7];
  const last = commands[commands.length - 1];
  if (
    first.type !== "M" ||
    tip.type !== "L" ||
    rear.type !== "L" ||
    back.type !== "C" ||
    last.type !== "L"
  )
    throw new Error("Unexpected dessert source outline");
  const bounds = getBoundingBox(body);
  const apex = { x: back.x, y: back.y };
  return {
    tip: { x: tip.x, y: tip.y },
    rear: { x: rear.x, y: rear.y },
    apex,
    depth: bounds.y2 - tip.y,
    leftTop: [apex, { x: last.x, y: last.y }, { x: first.x, y: first.y }],
    bottomEdge: commands
      .slice(2, 6)
      .map((command) => {
        if (command.type === "L") return `L${command.x} ${command.y}`;
        if (command.type === "C")
          return `C${command.cp1x} ${command.cp1y} ${command.cp2x} ${command.cp2y} ${command.x} ${command.y}`;
        throw new Error("Unexpected dessert base outline");
      })
      .join(""),
    back: {
      from: apex,
      first: { x: back.cp2x, y: back.cp2y },
      second: { x: back.cp1x, y: back.cp1y },
      to: { x: rear.x, y: rear.y },
    },
    cherryGap: `M${last.x} ${last.y}L${first.x} ${first.y}`,
    layers: layers.map((path) => {
      const layer = getBoundingBox(path);
      return { offset: layer.y1 - tip.y, endX: layer.x2 };
    }),
  };
};

type Cake = ReturnType<typeof prepareDessertShape>;

export const dessertStackLayers = (cake: Cake) => {
  const heights = [0, ...cake.layers.map(({ offset }) => offset), cake.depth];
  return heights
    .slice(0, -1)
    .map((top, index) => {
      const bottom = heights[index + 1];
      const left = cake.leftTop
        .map(
          (point, pointIndex) =>
            `${pointIndex === 0 ? "M" : "L"}${xy(point, top)}`,
        )
        .join("");
      const base =
        bottom === cake.depth
          ? cake.bottomEdge
          : `L${xy(cake.tip, bottom)}L${xy(cake.rear, bottom)}`;
      return {
        body: `${left}L${xy(cake.tip, top)}${base}L${xy(cake.rear, top)}C${xy(cake.back.second, top)} ${xy(cake.back.first, top)} ${xy(cake.apex, top)}Z`,
        topEdge:
          index > 0 ? `M${xy(cake.tip, top)}L${xy(cake.rear, top)}` : null,
      };
    })
    .reverse();
};

// The round bite cuts the top plane, then the same edge is extruded through
// the cake's actual thickness. Its two layer curves meet the original layers.
export const dessertShape = (cake: Cake, eaten: number, rightCorner = 0) => {
  const width = cake.rear.x - cake.tip.x;
  const front = cake.tip.x + width * eaten;
  const radiusX = width / 2;
  const radiusY = 3.5 + Math.max(0, Math.min(1, (eaten - 0.29) / 0.99)) * 5;
  const center = { x: front - radiusX, y: cake.tip.y };
  const cutX = (y: number) =>
    center.x +
    radiusX * Math.sqrt(Math.max(0, 1 - ((y - center.y) / radiusY) ** 2));
  const leftX = (y: number) =>
    cake.apex.x +
    ((cake.tip.x - cake.apex.x) * (y - cake.apex.y)) /
      (cake.tip.y - cake.apex.y);
  const backAt = (y: number) => at(cake.back, tAtY(cake.back, y));
  const remainingWidth = (y: number) =>
    backAt(y).x - Math.max(leftX(y), cutX(y));
  const steps = 128;
  const ys = Array.from(
    { length: steps + 1 },
    (_, index) => cake.apex.y + ((cake.tip.y - cake.apex.y) * index) / steps,
  );
  const valid = ys.map((y) => remainingWidth(y) > 0.00001);
  const first = valid.indexOf(true);
  const last = valid.lastIndexOf(true);
  if (first < 0) return null;
  const minY =
    first === 0 ? ys[0] : root(remainingWidth, ys[first - 1], ys[first]);
  const maxY =
    last === steps ? ys[steps] : root(remainingWidth, ys[last], ys[last + 1]);
  if (maxY - minY < 0.015) return null;
  const cutStartY =
    cutX(minY) >= leftX(minY)
      ? minY
      : root((y) => cutX(y) - leftX(y), minY, maxY);
  const start = { x: cutX(cutStartY), y: cutStartY };
  const end = { x: cutX(maxY), y: maxY };
  const arcStart = {
    x: cutX(Math.max(start.y, center.y - radiusY)),
    y: Math.max(start.y, center.y - radiusY),
  };
  const hasStraightStart = arcStart.y > start.y + 0.00001;
  const hasArc = end.y > arcStart.y + 0.00001;
  const forward = (offset: number) =>
    `${hasStraightStart ? `L${xy(arcStart, offset)}` : ""}${hasArc ? `A${n(radiusX)} ${n(radiusY)} 0 0 1 ${xy(end, offset)}` : `L${xy(end, offset)}`}`;
  const reverse = (offset: number) =>
    `${hasArc ? `A${n(radiusX)} ${n(radiusY)} 0 0 0 ${xy(arcStart, offset)}` : ""}${hasStraightStart || !hasArc ? `L${xy(start, offset)}` : ""}`;
  const fromT = tAtY(cake.back, minY);
  const toT = tAtY(cake.back, maxY);
  const prefix = split(cake.back, toT)[0];
  const back = fromT === 0 ? prefix : split(prefix, fromT / toT)[1];
  const flatFront = Math.abs(maxY - cake.tip.y) < 0.00001;
  const bottom = cake.tip.y + cake.depth;
  const corner = Math.min(1, Math.max(0, cake.rear.x - end.x));
  const frontBottom = flatFront
    ? `L${n(cake.rear.x - corner)} ${n(bottom)}C${n(cake.rear.x - 0.4 * corner)} ${n(bottom)} ${n(cake.rear.x)} ${n(bottom - 0.4 * corner)} ${n(cake.rear.x)} ${n(bottom - corner)}L${xy(cake.rear)}`
    : `L${xy(back.to)}`;
  const body = `M${xy(start)}L${xy(start, cake.depth)}${forward(cake.depth)}${frontBottom}C${xy(back.second)} ${xy(back.first)} ${xy(back.from)}L${xy(start)}Z`;
  const face = `M${xy(start)}${forward(0)}L${xy(end, cake.depth)}${reverse(cake.depth)}Z`;
  const cutEdge = `M${xy(start)}${forward(0)}`;
  const layers = cake.layers.map(
    ({ offset, endX }) =>
      `M${xy(start, offset)}${forward(offset)}${flatFront && end.x < endX ? `L${n(endX)} ${n(cake.tip.y + offset)}` : ""}`,
  );
  if (rightCorner > 0.00001) {
    const cornerRadiusX = width / 3;
    const cornerRadiusY = 3.5;
    const rightEnd = {
      x: cake.rear.x - width * 0.26 * rightCorner,
      y: cake.tip.y,
    };
    const cornerCenterX = rightEnd.x + cornerRadiusX;
    const rightCutX = (y: number) =>
      cornerCenterX -
      cornerRadiusX *
        Math.sqrt(Math.max(0, 1 - ((y - cake.tip.y) / cornerRadiusY) ** 2));
    const cornerY = root(
      (y) => rightCutX(y) - backAt(y).x,
      cake.apex.y,
      cake.tip.y,
    );
    const cornerTop = backAt(cornerY);
    const remainingBack = split(cake.back, tAtY(cake.back, cornerY))[0];
    const cornerForward = (offset: number) =>
      `A${n(cornerRadiusX)} ${n(cornerRadiusY)} 0 0 0 ${xy(rightEnd, offset)}`;
    const cornerReverse = (offset: number) =>
      `A${n(cornerRadiusX)} ${n(cornerRadiusY)} 0 0 1 ${xy(cornerTop, offset)}`;
    // The right bite is the same full-height cut as the front bite. Its
    // top, bottom and cream layers all follow the matching projected arc.
    const cornerBody = `M${xy(start)}L${xy(start, cake.depth)}${forward(cake.depth)}L${xy(rightEnd, cake.depth)}${cornerReverse(cake.depth)}L${xy(cornerTop)}C${xy(remainingBack.second)} ${xy(remainingBack.first)} ${xy(remainingBack.from)}L${xy(start)}Z`;
    const cornerFace = `M${xy(cornerTop)}${cornerForward(0)}L${xy(rightEnd, cake.depth)}${cornerReverse(cake.depth)}Z`;
    return {
      body: cornerBody,
      face: `${face} ${cornerFace}`,
      cutEdge: `${cutEdge} M${xy(cornerTop)}${cornerForward(0)}`,
      layers: layers.map(
        (layer, index) =>
          `${layer} M${xy(rightEnd, cake.layers[index].offset)}${cornerReverse(cake.layers[index].offset)}`,
      ),
    };
  }
  return { body, face, cutEdge, layers };
};
