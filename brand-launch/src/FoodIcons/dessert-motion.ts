import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

export const DESSERT_FRONT_DEPTH = 0.4;
export const DESSERT_BITES = [
  { id: "back-corner", x: 14, y: 1.5, radius: 6.5, at: 2.74, duration: 0.18 },
  { id: "finish-top", x: 8, y: 5.5, radius: 9.2, at: 3.34, duration: 0.24 },
  { id: "finish-middle", x: 20, y: 10, radius: 11.4, at: 3.48, duration: 0.26 },
  {
    id: "finish-bottom",
    x: 13,
    y: 10.5,
    radius: 11.5,
    at: 3.64,
    duration: 0.26,
  },
] as const;

const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const dessertMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const seconds = still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) *
      FOOD_ICON_CYCLE_SECONDS *
      2;
  const reset = seconds >= 3.98;
  const returnLayers = [3.98, 4.17, 4.36].map((start) => {
    const progress = smooth(start, start + 0.18, seconds);
    return {
      progress,
      opacity: smooth(start, start + 0.04, seconds),
      y: -6 * strength * (1 - progress),
    };
  });
  const cherryArrival = smooth(4.76, 4.94, seconds);
  let reaction = 0;
  for (const at of [1.54, 2.14, ...DESSERT_BITES.map((bite) => bite.at)]) {
    const phase = (seconds - at) / 0.22;
    if (phase > 0 && phase < 1)
      reaction += Math.sin(phase * Math.PI) * (1 - phase) * strength;
  }
  return {
    eaten: reset ? 0 : DESSERT_FRONT_DEPTH * smooth(1.54, 1.72, seconds),
    corner: reset ? 0 : smooth(2.14, 2.32, seconds),
    lastBite: reset ? 0 : smooth(3.34, 3.9, seconds),
    rebuilding: reset && seconds < 4.94,
    returnLayers,
    lineTrim: smooth(4.56, 4.74, seconds),
    bites: DESSERT_BITES.map((bite) => ({
      ...bite,
      radius: reset
        ? 0
        : bite.radius * smooth(bite.at, bite.at + bite.duration, seconds),
    })),
    cherryScale: reset ? 1 : 1 - smooth(0.94, 1.12, seconds),
    cherryOpacity: reset ? smooth(4.76, 4.8, seconds) : 1,
    cherryY: reset ? -7 * (1 - cherryArrival) : 0,
    cherryGap: reset
      ? 1 - smooth(4.82, 4.94, seconds)
      : smooth(0.94, 1.12, seconds),
    x: reaction * 0.18,
    y: -reaction * 0.08,
  };
};
