import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

// Product SVG order is right, center, left. Reading order here is intentional.
export const SMOKE_LANES = [
  { name: "center", sourceIndex: 1, start: 0.1 },
  { name: "left", sourceIndex: 2, start: 0.4 },
  { name: "right", sourceIndex: 0, start: 0.7 },
] as const;

const LOOP_SECONDS = FOOD_ICON_CYCLE_SECONDS * 2;
const EMISSION_INTERVAL = LOOP_SECONDS / 2;
const DOT_RADIUS = 0.8;
const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const smokedSeconds = (
  frame: number,
  fps: number,
  speed: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const local = frame % durationInFrames;
  if (still || local === 0 || local === durationInFrames - 1) return 0;
  return (local / Math.max(1, durationInFrames - 1)) * LOOP_SECONDS;
};

export const smokedLane = (
  seconds: number,
  start: number,
  length: number,
  strength: number,
  gapScale = 1,
) => {
  const progress = (seconds - start) / EMISSION_INTERVAL;
  const phase = ((progress % 1) + 1) % 1;
  // Each stroke can fill the original curve. Space the packets around that
  // full length instead of shortening the stroke to fit a fixed pitch.
  const strokeLength = length;
  const clearGap = 1.3 + 1.1 * strength;
  // Widen the space after the preceding stroke by 80%, while preserving
  // the point's spacing from the following stroke.
  const gapAheadOfDot = clearGap * 0.7 * 1.8 * gapScale;
  const gapBehindDot = clearGap * 0.3 * gapScale;
  const pitch =
    strokeLength + 2 + 2 * DOT_RADIUS + gapAheadOfDot + gapBehindDot;
  const offset = phase * pitch;
  const packets = [-1, 0, 1, 2];

  const lines = packets.map((index) => {
    const head = offset + index * pitch;
    const tail = head - strokeLength;
    const from = Math.max(0, Math.min(length, tail));
    const to = Math.max(0, Math.min(length, head));
    const middle = (from + to) / (2 * length);
    const opacity =
      smooth(0, 0.06, to / length) * (1 - smooth(0.84, 1, middle));
    return {
      index,
      visible: to - from > 0.015 && opacity > 0.002,
      start: from,
      length: Math.max(0, to - from),
      width: 2 * (1 - 0.35 * smooth(0.78, 1, middle)),
      opacity,
    };
  });

  const dots = packets.map((index) => {
    // Follow the original curve, but reveal the point only in the upper
    // dissipation zone instead of carrying a visible point up the whole path.
    const distance = offset + index * pitch + 1 + gapBehindDot + DOT_RADIUS;
    const position = Math.max(0, Math.min(1, distance / length));
    const opacity =
      smooth(0.76, 0.84, position) * (1 - smooth(0.88, 1, position));
    return {
      name: `between-${index}`,
      visible: distance > 0 && distance < length && opacity > 0.002,
      distance,
      radius: DOT_RADIUS * (1 - 0.86 * smooth(0.84, 1, position)),
      opacity,
    };
  });

  return {
    lines,
    dots,
    // Identify the stroke already travelling when the loop begins, so a
    // consumer can let it finish without starting another emission.
    precedingStrokeIndex: Math.floor(progress) + 1,
    precedingStrokeEndsAt:
      start + ((2 * length) / pitch - 1) * EMISSION_INTERVAL,
    followingStrokeEndsAt: start + ((2 * length) / pitch) * EMISSION_INTERVAL,
  };
};
