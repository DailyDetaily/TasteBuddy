import {
  BROTH_PREVIEW_SECONDS,
  FOOD_ICON_CYCLE_SECONDS,
  brothTiming,
} from "./timing";

type Point = { x: number; y: number };

export const BROTH_SPOON_HEAD_WIDTH = 5;
export const BROTH_SPOON_HEAD_ANGLE = 35;
export const BROTH_SPOON_HEAD_DEPTH = 1.1;
export const BROTH_SPOON_BOWL_GAP = 2;
const BASE_LOOP_SECONDS = FOOD_ICON_CYCLE_SECONDS * 2;
const BASE_PREVIEW_SECONDS = 8;
const BASE_STEAM_RESUME_SECONDS = 4.93;
// Preserve the steam, lift, sip and return speeds from the eight-second loop.
// The additional two playback seconds belong entirely to the stirring gesture.
export const BROTH_LOOP_SECONDS =
  (BASE_LOOP_SECONDS * BROTH_PREVIEW_SECONDS) / BASE_PREVIEW_SECONDS;
const EXTRA_STIR_SECONDS = BROTH_LOOP_SECONDS - BASE_LOOP_SECONDS;
export const BROTH_STEAM_RESUME_SECONDS =
  BASE_STEAM_RESUME_SECONDS + EXTRA_STIR_SECONDS;
export const BROTH_STEAM_SPEED = 1.7;

// The clock keeps its existing speed while the preview grows to ten seconds.
export const brothSeconds = (
  frame: number,
  fps: number,
  speed: number,
  still = false,
) => {
  const { durationInFrames } = brothTiming(speed, fps);
  const local = frame % durationInFrames;
  if (still || local === 0 || local === durationInFrames - 1) return 0;
  return (local / Math.max(1, durationInFrames - 1)) * BROTH_LOOP_SECONDS;
};

const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const brothSteamOpacity = (seconds: number, steamDoneAt: number) =>
  seconds < steamDoneAt
    ? 1
    : smooth(
        BROTH_STEAM_RESUME_SECONDS,
        BROTH_STEAM_RESUME_SECONDS + 0.05,
        seconds,
      );

// Speed up the two steam pulses, then approach the next loop's initial steam
// phase from below so the faster clock does not jump at the loop seam.
export const brothSteamSeconds = (seconds: number) =>
  (seconds >= BROTH_STEAM_RESUME_SECONDS
    ? seconds - BROTH_LOOP_SECONDS
    : seconds) * BROTH_STEAM_SPEED;

export const brothSpoonPose = (
  seconds: number,
  front: Point,
  rear: Point,
  steamDoneAt: number,
  lift: number,
  verticalRear: Point,
  strength: number,
) => {
  // Wait for both steam pulses. Add time only to the two uninterrupted turns;
  // every later gesture keeps its duration and shifts two playback seconds.
  const baseDuration = BASE_STEAM_RESUME_SECONDS - steamDoneAt;
  const sequenceEnd = baseDuration + EXTRA_STIR_SECONDS;
  const elapsed = Math.max(0, Math.min(sequenceEnd, seconds - steamDoneAt));
  const phase = elapsed / sequenceEnd;
  const stirEnd = baseDuration * 0.49 + EXTRA_STIR_SECONDS;
  const scoopAt = baseDuration * 0.58 + EXTRA_STIR_SECONDS;
  const raisedAt = baseDuration * 0.69 + EXTRA_STIR_SECONDS;
  const lowerAt = baseDuration * 0.84 + EXTRA_STIR_SECONDS;
  const returnAt = baseDuration * 0.93 + EXTRA_STIR_SECONDS;
  const turn =
    smooth(stirEnd, scoopAt, elapsed) *
    (1 - smooth(returnAt, sequenceEnd, elapsed));
  const rise =
    smooth(scoopAt, raisedAt, elapsed) *
    (1 - smooth(lowerAt, returnAt, elapsed));
  // Tip the raised spoon slightly counterclockwise around the front head,
  // then level it before lowering. Its center stays fixed as the handle rises.
  const sip =
    smooth(raisedAt, baseDuration * 0.745 + EXTRA_STIR_SECONDS, elapsed) *
    (1 - smooth(baseDuration * 0.785 + EXTRA_STIR_SECONDS, lowerAt, elapsed));
  const dx = front.x - rear.x;
  const dy = front.y - rear.y;
  const horizontalAngle = ((Math.PI - Math.atan2(dy, dx)) * 180) / Math.PI;
  // Author the complete spoon horizontally, then rotate the entire utensil.
  // The handle and closed bowl keep the same relative position at every frame.
  // Start turning as the spoon stands up, blending directly into the moving
  // orbit instead of finishing the upright pose before beginning to stir.
  const upright =
    smooth(0, baseDuration * 0.12, elapsed) *
    (1 - smooth(stirEnd, scoopAt, elapsed));
  const stirClock = Math.max(0, Math.min(1, elapsed / stirEnd));
  // Cosine velocity ramps join an even cruising speed with no sudden change
  // in velocity or acceleration at either end of the complete orbit.
  const ramp = 0.12;
  const startProgress = (time: number) =>
    (time - (ramp / Math.PI) * Math.sin((Math.PI * time) / ramp)) /
    (2 * (1 - ramp));
  const stirProgress =
    stirClock < ramp
      ? startProgress(stirClock)
      : stirClock > 1 - ramp
        ? 1 - startProgress(1 - stirClock)
        : (stirClock - ramp / 2) / (1 - ramp);
  const stirPhase = stirProgress * Math.PI * 4;
  // Leftward motion dips through the center; the return arc rises equally.
  const orbitX = Math.cos(stirPhase) * 3.1 * strength * upright;
  const orbitY = Math.sin(stirPhase) * 0.65 * strength * upright;
  const angle =
    -horizontalAngle * (1 - upright - turn) -
    90 * upright -
    BROTH_SPOON_HEAD_ANGLE * turn;
  const tip = {
    x: rear.x - Math.hypot(dx, dy),
    y: rear.y,
  };
  const headRadians = (BROTH_SPOON_HEAD_ANGLE * Math.PI) / 180;
  const headX = -BROTH_SPOON_HEAD_WIDTH * Math.cos(headRadians);
  const headY = -BROTH_SPOON_HEAD_WIDTH * Math.sin(headRadians);

  return {
    angle,
    sipAngle: -8 * sip,
    sipPivot: { x: tip.x + headX / 2, y: tip.y + headY / 2 },
    x: (verticalRear.x - rear.x) * upright + orbitX,
    y: -lift * rise + (verticalRear.y - rear.y) * upright + orbitY,
    headOpacity: 1 - upright,
    stirProgress,
    phase,
    tip,
    // The closed head has a fixed bend; only the shared spoon group rotates.
    bowlPath: `M${tip.x} ${tip.y}a${BROTH_SPOON_HEAD_WIDTH / 2} ${BROTH_SPOON_HEAD_DEPTH} ${BROTH_SPOON_HEAD_ANGLE} 0 1 ${headX} ${headY}Z`,
    steamOpacity: brothSteamOpacity(seconds, steamDoneAt),
  };
};
