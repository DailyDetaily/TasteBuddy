import { clamp01, ramp } from "./motion";

export const circleEaseOut = (frame: number, start: number, duration = 14) =>
  1 - (1 - clamp01((frame - start) / duration)) ** 3;

// The bottom of each source circle's path stays fixed throughout scaling.
// Its numeric label uses the same circle anchor, never its own text centre.
export const introCircles = [
  { diameter: 12, circleIndex: 35, labelIndex: 49, start: 0, bottom: 254.75 },
  { diameter: 6, circleIndex: 24, labelIndex: 50, start: 8, bottom: 242.75 },
  { diameter: 14, circleIndex: 44, labelIndex: 48, start: 16, bottom: 236.75 },
  { diameter: 28, circleIndex: 45, labelIndex: 47, start: 24, bottom: 222.75 },
  { diameter: 38, circleIndex: 25, labelIndex: 46, start: 32, bottom: 194.75 },
] as const;

// The original layout also includes a lower 6 guide. Add it after the upward
// chain has finished, so it cannot interrupt 12 → 6 → 14 → 28 → 38.
export const classicStackCircles = [
  ...introCircles,
  { diameter: 6, circleIndex: 23, labelIndex: 80, start: 48, bottom: 260.75 },
] as const;

export const getClassicCircleScale = (frame: number, start: number) =>
  circleEaseOut(frame, start) * (1 - ramp(frame, 257, 272));

export const bottomAnchoredCircleTransform = (bottom: number, scale: number) =>
  `translate(308 ${bottom}) scale(${scale}) translate(-308 ${-bottom})`;
