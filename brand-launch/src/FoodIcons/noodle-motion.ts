import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

type Keyframe = readonly [seconds: number, value: number];

const track = (seconds: number, keys: readonly Keyframe[]) => {
  for (let index = 1; index < keys.length; index++) {
    const [end, to] = keys[index];
    if (seconds > end) continue;
    const [start, from] = keys[index - 1];
    const t = Math.max(0, Math.min(1, (seconds - start) / (end - start)));
    return from + (to - from) * t * t * (3 - 2 * t);
  }
  return keys[keys.length - 1][1];
};

// Move the grip 1.5 units inward along the chopsticks' midline so the rear
// stays above the rim while the tips and all three pickup points dip inside.
export const CHOPSTICK_PIVOT = { x: 19.5, y: 6 - 1.5 / 7 };

export const noodleMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { cycleFrames } = foodIconOriginalTiming(speed, fps);
  const seconds = still
    ? 0
    : ((frame % cycleFrames) / cycleFrames) * FOOD_ICON_CYCLE_SECONDS;

  // Even the gentlest setting submerges all three pickup points behind the rim.
  // Strength changes the wrist travel and overshoot without losing contact.
  const dipAngle = -(44 + strength * 4);
  const dipY = 3.2 + strength * 0.4;
  const pose = (dip: number, lift: number) =>
    track(seconds, [
      [0, 0],
      [0.16, 0],
      [0.66, dip],
      [0.76, dip],
      [1.18, lift],
      [1.32, 0],
    ]);
  // Two compact wrist beats after the lift, with the wok's short pause and a
  // slightly longer second beat like the first two braised-lid hops.
  const bobY =
    track(seconds, [
      [0, 0],
      [1.34, 0],
      [1.46, -0.42],
      [1.6, 0],
      [1.64, 0],
      [1.78, -0.6],
      [1.94, 0],
    ]) * strength;

  return {
    chopsticks: {
      x: pose(0.25 * strength, -0.2 * strength),
      y: pose(dipY, -0.3 * strength) + bobY,
      angle: pose(dipAngle, 1.8 * strength),
    },
    noodles: {
      visible: seconds >= 0.72 && seconds < 2.42,
      bobY,
      retract: track(seconds, [
        [0, 0],
        [2, 0],
        [2.42, 1],
      ]),
    },
  };
};

// Only the pickup point follows the chopsticks; each strand hangs vertically.
export const noodleAnchor = (
  x: number,
  y: number,
  pose: ReturnType<typeof noodleMotion>["chopsticks"],
) => {
  const radians = (pose.angle * Math.PI) / 180;
  const dx = x - CHOPSTICK_PIVOT.x;
  const dy = y - CHOPSTICK_PIVOT.y;
  return {
    x:
      CHOPSTICK_PIVOT.x +
      dx * Math.cos(radians) -
      dy * Math.sin(radians) +
      pose.x,
    y:
      CHOPSTICK_PIVOT.y +
      dx * Math.sin(radians) +
      dy * Math.cos(radians) +
      pose.y,
  };
};
