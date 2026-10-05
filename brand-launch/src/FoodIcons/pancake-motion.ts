import {
  normalizePath,
  parsePath,
  reduceInstructions,
  serializeInstructions,
} from "@remotion/paths";
import {
  FOOD_ICON_PREVIEW_SECONDS,
  foodIconTiming,
  retimeFoodIconSeconds,
} from "./timing";

const CAMERA_DISTANCE = 32;
// Keyframes retain their original authoring clock within a five-second repeat.
const TOSS_START = 0.2;
const TOSS_TRAVEL = 1.2;
const APPROACH_START = TOSS_START + TOSS_TRAVEL / 2;
const LANDING_TIME = TOSS_START + 52 / 60;
const SPIN_END = TOSS_START + TOSS_TRAVEL * 0.9;
const LANDING_TRAVEL = 0.45;
const SETTLE_END = LANDING_TIME + LANDING_TRAVEL;

// Keep the airborne rotation fast; give the landing and settled pose more time.
const playbackTiming = [
  [0, 0],
  [0.55, TOSS_START],
  [0.55 + LANDING_TIME - TOSS_START, LANDING_TIME],
  [0.55 + LANDING_TIME - TOSS_START + 0.7, SETTLE_END],
  [FOOD_ICON_PREVIEW_SECONDS / 2, 2.5],
] as const;

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export const pancakeMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { cycleFrames } = foodIconTiming(speed, fps);
  const playbackSeconds = still
    ? 0
    : ((frame % cycleFrames) / cycleFrames) * (FOOD_ICON_PREVIEW_SECONDS / 2);
  const seconds = retimeFoodIconSeconds(playbackSeconds, playbackTiming);
  const landingElapsed = seconds - LANDING_TIME;
  // Preserve the toss and first-contact pose; stretch only the remaining turn.
  const rotationSeconds =
    seconds < LANDING_TIME
      ? seconds
      : LANDING_TIME +
        landingElapsed * ((SPIN_END - LANDING_TIME) / LANDING_TRAVEL);
  const progress = (rotationSeconds - TOSS_START) / TOSS_TRAVEL;
  const landingTime =
    landingElapsed >= 0 && seconds < SETTLE_END ? landingElapsed : null;
  if (progress <= 0 || seconds >= SETTLE_END) {
    return {
      angle: 0,
      facing: 1,
      turnSin: 0,
      lift: 0,
      detailOpacity: 1,
      landingTime,
      approach: 0,
    };
  }

  // First contact happens during the final quarter-turn. Attached points then
  // stay on the floor while the free surface completes the turn around them.
  const angle = 720 * ease(progress / 0.9);
  const facing = Math.cos((angle * Math.PI) / 180);
  const approach = Math.max(
    0,
    Math.min(1, (seconds - APPROACH_START) / (LANDING_TIME - APPROACH_START)),
  );
  return {
    angle,
    facing,
    turnSin: Math.sin((angle * Math.PI) / 180),
    // Raise the whole rotating icon by one source radius at the toss's peak.
    lift:
      landingTime === null ? 9 * strength * 4 * progress * (1 - progress) : 0,
    // Original markings belong to the front; they pass out of sight at the edge.
    detailOpacity: ease((facing - 0.02) / 0.16),
    landingTime,
    approach: approach ** 3,
  };
};

type PancakePose = ReturnType<typeof pancakeMotion>;
type Point = { x: number; y: number };
type Center = Point & { baseY: number };

const projectFreePoint = (
  x: number,
  y: number,
  pose: PancakePose,
  center: Center,
) => {
  const localY = y - center.y;
  // Rotate a single plane; the source outline has no added sidewall or thickness.
  const rotatedY = localY * pose.facing;
  const rotatedZ = localY * pose.turnSin;
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - rotatedZ);
  return {
    x: center.x + (x - center.x) * perspective,
    y: center.y + rotatedY * perspective,
  };
};

export const pancakeVerticalOffset = (
  center: Center,
  radius: number,
  pose: PancakePose,
) => {
  if (pose.landingTime !== null || pose.angle === 0) return 0;
  // Lower the final rotation by the visible outline's bottom, not its center.
  const bottom = Math.max(
    ...[center.y - radius, center.y + radius].map(
      (y) => projectFreePoint(center.x, y, pose, center).y,
    ),
  );
  return -pose.lift + pose.approach * (center.baseY - bottom + pose.lift);
};

const projectPoint = (
  x: number,
  y: number,
  pose: PancakePose,
  center: Center,
) => {
  const free = projectFreePoint(x, y, pose, center);
  if (pose.landingTime === null) {
    return {
      x: free.x + (x - free.x) * pose.approach,
      y: free.y,
    };
  }

  const radius = center.baseY - center.y;
  const contactProgress = Math.max(
    0,
    Math.min(1, pose.landingTime / LANDING_TRAVEL),
  );
  const contactY = center.baseY - 2 * radius * contactProgress;
  if (y >= contactY) return { x, y };

  const anchor = projectFreePoint(center.x, contactY, pose, center);
  const distance = contactY - y;
  // Keep the first-contact tilted silhouette, now anchored on the floor. Perspective
  // can only shorten the free surface; it must never stretch outside its rest shape.
  const maxDistance = distance * Math.max(0, pose.facing);
  const projectedDistance = Math.max(
    0,
    Math.min(maxDistance, anchor.y - free.y),
  );
  const curvedJoin =
    1 - ease(contactProgress / 0.18) * (1 - ease(distance / (radius * 0.65)));
  return {
    x,
    y: y + (contactY - projectedDistance - y) * curvedJoin,
  };
};

const polygonPath = (points: Point[]) =>
  points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ") + " Z";

export const pancakeOutline = (
  center: Center,
  radius: number,
  pose: PancakePose,
) =>
  polygonPath(
    Array.from({ length: 96 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      return projectPoint(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle),
        pose,
        center,
      );
    }),
  );

// Project the original face markings through the same 3D plane as its outline.
export const pancakePath = (
  source: string,
  pose: PancakePose,
  center: Center,
) => {
  if (pose.angle === 0 && pose.landingTime === null) return source;
  return serializeInstructions(
    reduceInstructions(parsePath(normalizePath(source))).map((instruction) => {
      if (instruction.type === "C") {
        const cp1 = projectPoint(
          instruction.cp1x,
          instruction.cp1y,
          pose,
          center,
        );
        const cp2 = projectPoint(
          instruction.cp2x,
          instruction.cp2y,
          pose,
          center,
        );
        return {
          ...instruction,
          ...projectPoint(instruction.x, instruction.y, pose, center),
          cp1x: cp1.x,
          cp1y: cp1.y,
          cp2x: cp2.x,
          cp2y: cp2.y,
        };
      }
      return "x" in instruction && "y" in instruction
        ? {
            ...instruction,
            ...projectPoint(instruction.x, instruction.y, pose, center),
          }
        : instruction;
    }),
  );
};
