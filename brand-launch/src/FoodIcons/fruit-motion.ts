import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

const UPPER_BITE = { x: 23.8, y: 10.2, radius: 6.6 };
const LOWER_BITE = { x: 0.2, y: 17, radius: 6.8 };
const CORE_BITE = { x: 23.5, y: 13.5, radius: 9.5 };

// Plan each bite as one half of a pair, keeping the actual eating sequence.
export const FRUIT_BITES = [
  { ...UPPER_BITE, id: "upper-right", at: 0.5 },
  { ...LOWER_BITE, id: "lower-left", at: 1 },
  { ...LOWER_BITE, x: 24 - LOWER_BITE.x, id: "lower-right", at: 1.5 },
  { ...UPPER_BITE, x: 24 - UPPER_BITE.x, id: "upper-left", at: 1.95 },
  { ...CORE_BITE, id: "core-right", at: 2.4 },
  { ...CORE_BITE, x: 24 - CORE_BITE.x, id: "core-left", at: 2.85 },
] as const;

const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const fruitMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const local = frame % durationInFrames;
  const seconds = still
    ? 0
    : (local / durationInFrames) * FOOD_ICON_CYCLE_SECONDS * 2;
  const reset = seconds >= 4.3;
  const bites = FRUIT_BITES.map((bite) => ({
    ...bite,
    radius: reset ? 0 : bite.radius * smooth(bite.at, bite.at + 0.12, seconds),
  }));
  let kick = 0;
  let lift = 0;
  for (const bite of FRUIT_BITES) {
    const progress = (seconds - bite.at) / 0.2;
    if (progress <= 0 || progress >= 1) continue;
    const pulse = Math.sin(progress * Math.PI) * (1 - progress);
    kick += (bite.x > 12 ? -1 : 1) * pulse * strength;
    lift += pulse * strength;
  }
  let dropY = 0;
  if (reset) {
    if (seconds < 4.72) {
      const fall = Math.max(0, Math.min(1, (seconds - 4.38) / 0.34));
      // Accelerate downward from above after the empty core has disappeared.
      dropY = -26 * (1 - fall * fall);
    } else {
      const rebound = Math.max(0, Math.min(1, (seconds - 4.72) / 0.22));
      dropY = -2.4 * strength * 4 * rebound * (1 - rebound) ** 2;
    }
  }
  const settle = Math.max(0, Math.min(1, (seconds - 4.72) / 0.24));
  const sway =
    Math.sin(settle * Math.PI * 2) * Math.sqrt(1 - settle) * strength;
  return {
    bites,
    x: kick * 0.22 + sway * 0.3,
    y: -lift * 0.12 + dropY,
    angle: kick * 1.4 + sway * 5,
    opacity: reset
      ? smooth(4.38, 4.44, seconds)
      : 1 - smooth(4.05, 4.3, seconds),
  };
};
