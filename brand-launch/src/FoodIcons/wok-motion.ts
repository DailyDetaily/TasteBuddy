import {
  FOOD_ICON_CYCLE_SECONDS,
  foodIconOriginalTiming,
  retimeFoodIconSeconds,
} from "./timing";

// Circle underlying the product path: M5 9 A6 6 0 0 1 10 6.
// Rotate the source arc and leading dot together to preserve their 1px gap.
const sourceStart = { x: 5, y: 9 };
const sourceEnd = { x: 10, y: 6 };
const radius = 6;
const dx = sourceEnd.x - sourceStart.x;
const dy = sourceEnd.y - sourceStart.y;
const chord = Math.hypot(dx, dy);
const centerOffset = Math.sqrt(radius * radius - (chord * chord) / 4);
const cx = (sourceStart.x + sourceEnd.x) / 2 - (dy / chord) * centerOffset;
const cy = (sourceStart.y + sourceEnd.y) / 2 + (dx / chord) * centerOffset;
const degrees = (radians: number) => (radians * 180) / Math.PI;
const sourceStartAngle = degrees(
  Math.atan2(sourceStart.y - cy, sourceStart.x - cx),
);
const sourceEndAngle = degrees(Math.atan2(sourceEnd.y - cy, sourceEnd.x - cx));

export const WOK_ARC = {
  cx,
  cy,
  radius,
  sourceEndAngle,
  span: sourceEndAngle - sourceStartAngle,
};

// Prepare twice, then repeat the full wind-up/toss/catch without preparing again.
const TOSS_WINDUP_START = 0.7;
const TOSS_SPEED = 1.25;
const SECOND_TOSS_START = 1.86;
const FLIGHT_START = 0.96;
const FLIGHT_END = 1.96;

// Repeat the full sequence every five seconds. Keep the preparation and toss
// speeds, shortening only the gaps between completed gestures.
const playbackTiming = [
  [0, 0],
  [0.35, 0.12],
  [1.35, 0.66],
  [2, 0.7],
  [3.088, 1.788],
  [3.45, 1.86],
  [4.538, 2.948],
  [FOOD_ICON_CYCLE_SECONDS * 2, 5],
] as const;

type Keyframe = readonly [seconds: number, value: number];

// Zero velocity at each direction change gives the wrist a short, clean flick.
const track = (seconds: number, keys: readonly Keyframe[]) => {
  for (let index = 1; index < keys.length; index++) {
    const [end, to] = keys[index];
    if (seconds > end) continue;
    const [start, from] = keys[index - 1];
    const t = Math.max(0, Math.min(1, (seconds - start) / (end - start)));
    const eased = t * t * (3 - 2 * t);
    return from + (to - from) * eased;
  }
  return keys[keys.length - 1][1];
};

export const wokMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const playbackSeconds = still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) *
      FOOD_ICON_CYCLE_SECONDS *
      2;
  const seconds = retimeFoodIconSeconds(playbackSeconds, playbackTiming);
  const tossStart =
    seconds >= SECOND_TOSS_START ? SECOND_TOSS_START : TOSS_WINDUP_START;
  const motionSeconds =
    seconds < TOSS_WINDUP_START
      ? seconds
      : TOSS_WINDUP_START + (seconds - tossStart) * TOSS_SPEED;
  const value = (keys: readonly Keyframe[]) =>
    track(motionSeconds, keys) * strength;
  const flying = motionSeconds >= FLIGHT_START && motionSeconds <= FLIGHT_END;
  const progress = Math.max(
    0,
    Math.min(1, (motionSeconds - FLIGHT_START) / (FLIGHT_END - FLIGHT_START)),
  );
  // Both ends extend below the lip. The transformed lip clips the ingredients
  // until they emerge, and occludes them again on their way back into the wok.
  // Begin deeper in the pan so the leading dot is also hidden at release.
  const headAngle = -248 + progress * 352;

  return {
    pan: {
      x: value([
        [0, 0],
        [0.12, 0],
        [0.26, 0.45],
        [0.38, 0],
        [0.4, 0],
        [0.53, 0.55],
        [0.66, 0],
        [0.7, 0],
        [0.95, 0.7],
        [1.12, -0.45],
        [1.64, 0.15],
        [1.98, 0],
      ]),
      y: value([
        [0, 0],
        [0.12, 0],
        [0.26, 0.16],
        [0.38, 0],
        [0.4, 0],
        [0.53, 0.22],
        [0.66, 0],
        [0.7, 0],
        [0.95, 0.5],
        [1.12, -0.65],
        [1.68, 0.4],
        [2.02, 0],
      ]),
      angle: value([
        [0, 0],
        [0.12, 0],
        [0.26, -2],
        [0.38, 0],
        [0.4, 0],
        [0.53, -2.6],
        [0.66, 0],
        [0.7, 0],
        [0.95, -5.5],
        [1.12, 8],
        [1.66, -3.5],
        [1.88, 1.2],
        [2.06, 0],
      ]),
    },
    orbit: {
      angle: flying ? headAngle - sourceEndAngle : 0,
      visible: flying,
    },
  };
};
