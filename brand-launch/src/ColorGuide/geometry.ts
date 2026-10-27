import { TASTE_MAIN_COLORS } from "../../../src/constants/designTokens";

// Original two-ring geometry from Group 353.png in its 242×235 coordinate system.
// Preserve the original radii, band widths, and gap; scale the complete guide below.
export const guideGeometry = {
  width: 242,
  height: 235,
  cx: 121,
  cy: 117.25,
  outerRadius: 108,
  innerRadius: 72,
  bandWidth: 18,
  dotRadius: 9,
  dashWidth: 0.7,
  dashPattern: "0.5 2.2",
} as const;

// Fit the OUTER ring edge to 720 px on the 1080 px canvas with uniform scaling.
// 234 source units / 351 viewBox units * 1080 = 720 px; margins are 180 px.
const viewportHalfSize =
  (guideGeometry.outerRadius + guideGeometry.bandWidth / 2) * (1080 / 720);
export const guideViewport = {
  x: guideGeometry.cx - viewportHalfSize,
  y: guideGeometry.cy - viewportHalfSize,
  size: viewportHalfSize * 2,
} as const;

export const polar = (radius: number, angle: number) => ({
  x: guideGeometry.cx + radius * Math.cos((angle * Math.PI) / 180),
  y: guideGeometry.cy + radius * Math.sin((angle * Math.PI) / 180),
});

export const outerDots = [
  { id: "sweet", name: "Sweet", angle: -120, labelY: 4.5 },
  { id: "sour", name: "Sour", angle: -60, labelY: 4.5 },
  { id: "bitter", name: "Bitter", angle: 0, labelY: 96.5 },
  { id: "salty", name: "Salty", angle: 60, labelY: 191.5 },
  { id: "umami", name: "Umami", angle: 120, labelY: 191.5 },
  { id: "fat", name: "Fatty", angle: 180, labelY: 96.5 },
].map((dot) => ({
  ...dot,
  ...polar(guideGeometry.outerRadius, dot.angle),
  color: TASTE_MAIN_COLORS[dot.id as keyof typeof TASTE_MAIN_COLORS],
}));

const channels = (hex: string) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
const hexColor = (rgb: number[]) =>
  "#" +
  rgb
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

// Current taste strengths over white, retaining the reference's 8-bit alpha rounding.
// Reference specimens use #FFA319/#FFCC7F/#FFF5E5; product tint rules are unchanged.
export const referenceTone = (
  strength: number,
  main: string = TASTE_MAIN_COLORS.sweet,
) => {
  const alpha = Math.round((strength * 255) / 100);
  return hexColor(
    channels(main).map((value) => (value * alpha + 255 * (255 - alpha)) / 255),
  );
};
export const innerDots = Array.from({ length: 10 }, (_, index) => {
  const strength = 100 - index * 10,
    angle = -108 + index * 36;
  return {
    strength,
    angle,
    ...polar(guideGeometry.innerRadius, angle),
  };
});
export const mixColor = (from: string, to: string, amount: number) => {
  const a = channels(from),
    b = channels(to);
  return hexColor(a.map((value, index) => value + (b[index] - value) * amount));
};

// Opaque overlapping one-degree wedges are composited once at group opacity.
// This avoids dark seams in the translucent bands.
const annularWedge = (radius: number, angle: number) => {
  const outer = radius + guideGeometry.bandWidth / 2,
    inner = radius - guideGeometry.bandWidth / 2;
  const a = polar(outer, angle),
    b = polar(outer, angle + 1.12),
    c = polar(inner, angle + 1.12),
    d = polar(inner, angle);
  const pt = (p: { x: number; y: number }) =>
    `${p.x.toFixed(5)} ${p.y.toFixed(5)}`;
  return `M ${pt(a)} A ${outer} ${outer} 0 0 1 ${pt(b)} L ${pt(c)} A ${inner} ${inner} 0 0 0 ${pt(d)} Z`;
};
export const outerWedges = Array.from({ length: 360 }, (_, degree) => {
  const segment = Math.floor(degree / 60);
  return {
    d: annularWedge(guideGeometry.outerRadius, -120 + degree),
    color: mixColor(
      outerDots[segment].color,
      outerDots[(segment + 1) % 6].color,
      ((degree % 60) + 0.5) / 60,
    ),
  };
});
export const innerMaskWedges = Array.from({ length: 360 }, (_, degree) => {
  const segment = Math.floor(degree / 36);
  const from = innerDots[segment].strength / 100,
    to = innerDots[(segment + 1) % 10].strength / 100;
  const value = Math.round(
    255 * (from + ((to - from) * ((degree % 36) + 0.5)) / 36),
  );
  return {
    d: annularWedge(guideGeometry.innerRadius, -108 + degree),
    color: `rgb(${value}, ${value}, ${value})`,
  };
});
