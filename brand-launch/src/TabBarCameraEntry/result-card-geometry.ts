import { logoGridElements } from "../LogoGrid/geometry";

// The six original paths, including their optical corrections. Their common
// center is (308, 249), and the source symbol is 184 units high.
export const resultSymbolPetals = logoGridElements
  .filter((element) => element.role === "logo.symbol")
  .map((element) => ({
    name: element.name,
    path: element.props.d!,
    points: element.props.d!.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)!.map(Number),
  }));

const angles: Record<string, number> = {
  "symbol.N": -90,
  "symbol.NE": -30,
  "symbol.SE": 30,
  "symbol.S": 90,
  "symbol.SW": 150,
  "symbol.NW": 210,
};
const mix = (from: number, to: number, p: number) => from + (to - from) * p;
const point = (r: number, angle: number) => [
  308 + Math.cos(angle) * r,
  249 + Math.sin(angle) * r,
];
const arc = (r: number, from: number, to: number) => {
  const start = point(r, from);
  const end = point(r, to);
  const k = (4 / 3) * Math.tan((to - from) / 4) * r;
  return [
    start[0] - Math.sin(from) * k,
    start[1] + Math.cos(from) * k,
    end[0] + Math.sin(to) * k,
    end[1] - Math.cos(to) * k,
    ...end,
  ];
};
const line = (from: number[], to: number[]) => [
  mix(from[0], to[0], 1 / 3),
  mix(from[1], to[1], 1 / 3),
  mix(from[0], to[0], 2 / 3),
  mix(from[1], to[1], 2 / 3),
  ...to,
];
const ringSector = (degrees: number) => {
  const angle = (degrees * Math.PI) / 180;
  const half = Math.PI / 6;
  const outer = 92;
  const inner = 51.75; // 27pt opening at the displayed 96pt symbol size.
  return [
    ...point(inner, angle + half),
    ...line(point(inner, angle + half), point(outer, angle + half)),
    ...arc(outer, angle + half, angle),
    ...arc(outer, angle, angle - half),
    ...line(point(outer, angle - half), point(inner, angle - half)),
    ...arc(inner, angle - half, angle + half),
  ];
};
const targets = resultSymbolPetals.map((petal) =>
  ringSector(angles[petal.name]),
);

export const mergedPetalPath = (index: number, progress: number) => {
  const petal = resultSymbolPetals[index];
  if (progress <= 0) return petal.path;
  const points = petal.points.map((value, i) =>
    mix(value, targets[index][i], progress),
  );
  let d = `M${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 6)
    d += `C${points.slice(i, i + 6).join(" ")}`;
  return `${d}Z`;
};

export type RoundedFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};
export const roundedFramePath = ({
  x,
  y,
  width: w,
  height: h,
  radius: r,
}: RoundedFrame) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
  `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
  `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

export const resultFrameGeometry = (
  height: number,
  outer: number,
  inner: number,
) => {
  const outerWidth = mix(96, 302, outer);
  const outerHeight = mix(96, height, outer);
  const photoWidth = mix(54, 278, inner);
  const photoHeight = mix(54, 347.5, inner);
  const photoCenterY = mix(height / 2, 185.75, inner);
  return {
    outer: {
      x: (302 - outerWidth) / 2,
      y: (height - outerHeight) / 2,
      width: outerWidth,
      height: outerHeight,
      radius: mix(48, 20, outer),
    },
    inner: {
      x: (302 - photoWidth) / 2,
      y: photoCenterY - photoHeight / 2,
      width: photoWidth,
      height: photoHeight,
      radius: mix(27, 12, inner),
    },
  };
};
