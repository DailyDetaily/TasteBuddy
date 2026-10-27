import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export const PEA_SEQUENCE = {
  seamAt: 0.18,
  seamUntil: 0.4,
  openAt: 0.5,
  lensAt: 0.7,
  openUntil: 0.8,
  popAt: 0.76,
  popDelay: 0.18,
  exitStart: 2.8,
  exitAt: 3.65,
  closeAt: 3.72,
  lineAt: 4.15,
  closedAt: 4.45,
} as const;

export const peaSeam = (seconds: number, index = 0) =>
  smooth(
    PEA_SEQUENCE.seamAt,
    PEA_SEQUENCE.seamUntil,
    seconds - index * PEA_SEQUENCE.popDelay,
  ) *
  (1 - smooth(PEA_SEQUENCE.lineAt, PEA_SEQUENCE.closedAt, seconds));

export const peaSeconds = (
  frame: number,
  fps: number,
  speed: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  return still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) *
        FOOD_ICON_CYCLE_SECONDS *
        2;
};

export const peaOpening = (seconds: number, index = 0) => {
  const local = seconds - index * PEA_SEQUENCE.popDelay;
  const opening =
    local < PEA_SEQUENCE.lensAt
      ? 0.64 * smooth(PEA_SEQUENCE.openAt, PEA_SEQUENCE.lensAt, local)
      : 0.64 +
        0.36 * smooth(PEA_SEQUENCE.lensAt, PEA_SEQUENCE.openUntil, local);
  return (
    opening * (1 - smooth(PEA_SEQUENCE.closeAt, PEA_SEQUENCE.lineAt, seconds))
  );
};

export type PeaGeometry = { x: number; y: number; radius: number };

export const PEA_DESIGN_GRID_SIZE = 24;
const PRESS_LIFT = 0.35;

export const peaEntranceLift = (
  seconds: number,
  index: number,
  strength: number,
) => {
  const local = seconds - index * PEA_SEQUENCE.popDelay;
  // The bean and the closed lip rise together, then the lip recoils as it escapes.
  return (
    -PRESS_LIFT *
    strength *
    smooth(PEA_SEQUENCE.openAt, PEA_SEQUENCE.popAt, local) *
    (1 - smooth(PEA_SEQUENCE.popAt, PEA_SEQUENCE.popAt + 0.16, local))
  );
};

export const peaMotion = (
  seconds: number,
  index: number,
  center: PeaGeometry,
  strength: number,
  exitOffset = 0,
) => {
  const start = PEA_SEQUENCE.popAt + index * PEA_SEQUENCE.popDelay;
  // A closed aperture hides the pea geometrically; it never fades into view.
  const visible =
    seconds >= PEA_SEQUENCE.openAt + index * PEA_SEQUENCE.popDelay ? 1 : 0;
  if (seconds >= PEA_SEQUENCE.closedAt) {
    return { x: center.x, y: center.y, angle: 0, opacity: 0, popped: false };
  }
  if (seconds <= start) {
    return {
      x: center.x,
      y: center.y + peaEntranceLift(seconds, index, strength),
      angle: 0,
      opacity: visible,
      popped: false,
    };
  }
  const elapsed = Math.max(0, seconds - start);
  const gravity = 52;
  // An immediate upward launch makes the pea pop out, then gravity takes over.
  const velocity = Math.sqrt(2 * gravity * 3.2 * strength);
  // The rolling pea's outer stroke rests on the bottom of the icon design grid.
  const ground = PEA_DESIGN_GRID_SIZE - center.radius - 1;
  const launchY = center.y - PRESS_LIFT * strength;
  const landing =
    (velocity + Math.sqrt(velocity ** 2 + 2 * gravity * (ground - launchY))) /
    gravity;
  const groundedTime = Math.max(0, elapsed - landing);
  const drift = 3.4 + index * 2.1;
  const airTime = Math.min(elapsed, landing);
  let x = center.x + drift * airTime;
  let y = launchY - velocity * airTime + (gravity * airTime ** 2) / 2;
  let bounce = 0;

  if (elapsed >= landing) {
    // Two short ballistic rebounds, followed by a continuous rightward roll.
    const hops = [
      { start: 0, duration: 0.38, height: 1.1 },
      { start: 0.38, duration: 0.22, height: 0.32 },
    ];
    for (const hop of hops) {
      const progress = (groundedTime - hop.start) / hop.duration;
      if (progress >= 0 && progress < 1) {
        bounce = 4 * hop.height * strength * progress * (1 - progress);
      }
    }
    y = ground - bounce;
    // Integrate the gradual speed-up so the landing does not teleport sideways.
    const accelerationTime = 0.6;
    const rollingSpeed = 6.5;
    const ramp = Math.min(groundedTime, accelerationTime);
    x +=
      drift * groundedTime +
      (rollingSpeed - drift) *
        (ramp ** 2 / (2 * accelerationTime) +
          Math.max(0, groundedTime - accelerationTime));
  }

  // Both peas receive the same extra travel, preserving their spacing while
  // carrying them beyond the design grid edge. The SVG clips them at full opacity.
  const exitProgress = clamp(
    (seconds - PEA_SEQUENCE.exitStart) /
      (PEA_SEQUENCE.exitAt - PEA_SEQUENCE.exitStart),
  );
  x += exitOffset * exitProgress ** 2;
  return {
    x,
    y,
    angle: ((x - center.x) / center.radius) * (180 / Math.PI),
    opacity: visible,
    popped: seconds > start,
  };
};

// Four cubic segments: a straight diagonal seam first, pointed lens next,
// then a round opening. The endpoints lose their corners only near full opening.
export const peaAperture = (center: PeaGeometry, opening: number) => {
  const r = center.radius;
  const h = r * opening;
  const rounded = smooth(0.64, 1, opening);
  const k = (4 * (Math.sqrt(2) - 1)) / 3;
  const tangent = h * k * rounded;
  const xControl = r * (0.62 + (k - 0.62) * rounded);
  const point = (x: number, y: number) =>
    `${center.x + (x + y) / Math.SQRT2} ${center.y + (-x + y) / Math.SQRT2}`;
  return [
    `M ${point(-r, 0)}`,
    `C ${point(-r, -tangent)} ${point(-xControl, -h)} ${point(0, -h)}`,
    `C ${point(xControl, -h)} ${point(r, -tangent)} ${point(r, 0)}`,
    `C ${point(r, tangent)} ${point(xControl, h)} ${point(0, h)}`,
    `C ${point(-xControl, h)} ${point(-r, tangent)} ${point(-r, 0)} Z`,
  ].join(" ");
};
