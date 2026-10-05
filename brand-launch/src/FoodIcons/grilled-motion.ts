import {
  getLength,
  normalizePath,
  parsePath,
  reduceInstructions,
  serializeInstructions,
} from "@remotion/paths";
import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

// The source flame grows from this base during ignition only.
export const FLAME_BASE = { x: 12, y: 15 };
const LOOP_SECONDS = FOOD_ICON_CYCLE_SECONDS * 2;
// Full ignition at 0.34s, followed by steady swaying until 2.86s.
const WIND_START = 2.86;
const BREAKUP_START = WIND_START + 0.48;
const EXTINGUISH_END = BREAKUP_START + 0.38;

const afterSmoke = (seconds: number) => {
  // Traverse only the lower 62% of the original center curve, once per flame.
  const routeLength = 0.62;
  const strokeLength = 0.24;
  const progress = (seconds - EXTINGUISH_END - 0.06) / 0.68;
  const head =
    Math.max(0, Math.min(1, progress)) * (routeLength + strokeLength);
  const start = Math.max(0, Math.min(routeLength, head - strokeLength));
  const end = Math.max(0, Math.min(routeLength, head));
  const middle = (start + end) / (2 * routeLength);
  const opacity = ease(end / 0.06) * (1 - ease((middle - 0.7) / 0.3));
  // One small separator follows the same curve ahead of the line. Reveal it
  // only near the shortened route's top, matching the smoked icon's dissipation.
  const dotPosition = head + 0.2;
  const dotProgress = dotPosition / routeLength;
  const dotOpacity =
    ease((dotProgress - 0.6) / 0.16) * (1 - ease((dotProgress - 0.8) / 0.2));
  return {
    visible:
      progress > 0 && progress < 1 && end - start > 0.001 && opacity > 0.002,
    start,
    length: end - start,
    width: 2 * (1 - 0.45 * ease((middle - 0.7) / 0.3)),
    opacity,
    dot: {
      visible: progress > 0 && progress < 1 && dotOpacity > 0.002,
      position: Math.min(routeLength, dotPosition),
      radius: 0.65 * (1 - 0.86 * ease((dotProgress - 0.8) / 0.2)),
      opacity: dotOpacity,
    },
  };
};

export const grilledMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const seconds = still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) * LOOP_SECONDS;

  // Carry one continuous wind motion through breakup instead of stopping one
  // eased movement and starting another. The gust also overlaps the first gaps.
  const windProgress = Math.max(0, Math.min(1, (seconds - WIND_START) / 0.86));
  const windTravel = windProgress * windProgress * (1.75 - 0.75 * windProgress);
  const gust = ease((seconds - WIND_START) / 0.56);
  const breakup = Math.max(0, Math.min(1, (seconds - BREAKUP_START) / 0.38));
  const scale = ease((seconds - 0.12) / 0.22);
  const elapsed = seconds - 0.24;
  const envelope = ease(elapsed / 0.18) * (1 - gust);
  const lowerPhase = (elapsed / 1.6) * Math.PI * 2;
  // Unequal smooth cycles vary the tip's range and timing without frame jitter.
  // Keep these deterministic so seeking and rendering reproduce the same flame.
  const upperPhase =
    lowerPhase * 2 + 0.3 * Math.sin((elapsed / 1.17) * Math.PI * 2 + 0.4);
  const tipRange =
    0.82 +
    0.22 * Math.sin((elapsed / 1.31) * Math.PI * 2 + 0.7) +
    0.13 * Math.sin((elapsed / 0.73) * Math.PI * 2 + 1.9);
  // Bound amplitude once, rather than flattening each sample at the extremes.
  // A continuous wave passes through the center without separate eased beats.
  const amplitude = Math.tanh(strength * 1.75) * 0.8 * envelope;
  // The tip keeps its faster rhythm, with a different reach on each sway.
  const bend = Math.sin(upperPhase) * tipRange * amplitude + 0.93 * gust;
  const curlBend = Math.sin(lowerPhase - 0.24) * amplitude - 0.6 * gust;
  // Let the shoulder and outer curve follow the tip slightly later to the right.
  const rightSway =
    0.95 * amplitude * tipRange * (0.5 + 0.5 * Math.sin(upperPhase - 0.45));

  return {
    scale,
    bend,
    curlBend,
    // Anchor the foot while the common contour bends farther downwind at the top.
    driftX: 0.6 * windTravel,
    contourTopOffset: rightSway + 5.4 * windTravel,
    breakup,
    smoke: afterSmoke(seconds),
    visible: scale > 0 && breakup < 1,
  };
};

// Five connected sections retain the original curve geometry while gaps open.
const flameSections = [
  { from: 0, to: 0.18, start: 0, end: 0.6, towards: "end" },
  { from: 0.18, to: 0.34, start: 0.2, end: 0.9, towards: "end" },
  { from: 0.34, to: 0.58, start: 0.38, end: 1, towards: "base" },
  { from: 0.58, to: 0.8, start: 0.16, end: 0.86, towards: "start" },
  { from: 0.8, to: 1, start: 0, end: 0.64, towards: "start" },
] as const;

// Small remnants stay on the original contour between the larger fragments.
const gapMarks = [
  { kind: "dash", length: 0.024, start: 0.18, end: 0.73, weight: 0.55 },
  { kind: "dot", length: 0.0001, start: 0.5, end: 0.99, weight: 0.5 },
  { kind: "dash", length: 0.02, start: 0.42, end: 0.94, weight: 0.5 },
  { kind: "dot", length: 0.0001, start: 0.24, end: 0.78, weight: 0.45 },
] as const;

export const grilledFlameFragments = (breakup: number, path: string) => {
  const contourLength = getLength(path);
  const instructions = parsePath(path);
  const baseIndex = instructions.findIndex(
    (instruction) =>
      "y" in instruction && Math.abs(instruction.y - FLAME_BASE.y) < 0.00001,
  );
  const basePosition =
    baseIndex < 0
      ? 0.44
      : getLength(serializeInstructions(instructions.slice(0, baseIndex + 1))) /
        contourLength;
  const curves = flameSections.map(
    ({ from, to, start, end, towards }, index) => {
      const cut = ease((breakup - start) / (end - start));
      const target =
        towards === "end"
          ? to
          : towards === "start"
            ? from
            : Math.max(from, Math.min(to, basePosition));
      // The upper ends recede first. The last lower arc closes onto the foot.
      const visibleStart = from + (target - from) * cut;
      const visibleEnd = to + (target - to) * cut;
      return {
        id: `curve-${index}`,
        kind: "curve",
        start: visibleStart,
        length: visibleEnd - visibleStart,
        strokeScale: 1 - ease((cut - 0.72) / 0.28),
      };
    },
  );
  const marks = gapMarks.map((mark, index) => {
    const progress = (breakup - mark.start) / (mark.end - mark.start);
    const life = ease(progress / 0.25) * (1 - ease((progress - 0.58) / 0.42));
    const before = curves[index];
    const after = curves[index + 1];
    const gapStart = before.start + before.length;
    const gapEnd = after.start;
    // Follow the actual opening along the common contour, and keep the remnant
    // clear of both neighboring round caps as the disappearance moves downward.
    const available = Math.max(
      0,
      (gapEnd - gapStart) * contourLength -
        before.strokeScale -
        after.strokeScale -
        0.15,
    );
    const strokeScale = Math.min(mark.weight * life, available / 2.5);
    const desiredLength =
      mark.kind === "dot"
        ? mark.length
        : mark.length * (1 - ease((progress - 0.5) / 0.5));
    const length = Math.min(
      desiredLength,
      Math.max(0, (available - 2 * strokeScale) / contourLength),
    );
    return {
      id: `remnant-${index}`,
      kind: mark.kind,
      start: (gapStart + gapEnd - length) * 0.5,
      length,
      strokeScale,
    };
  });
  return [...curves, ...marks].filter(
    (fragment) => fragment.length > 0 && fragment.strokeScale > 0,
  );
};

export const grilledFlamePath = (
  source: string,
  bend: number,
  curlBend: number,
  contourTopOffset: number,
) => {
  if (bend === 0 && curlBend === 0 && contourTopOffset === 0) return source;
  const tip = 1.45 * bend;
  const curl = -0.22 * curlBend;
  const instructions = parsePath(normalizePath(source));

  // Keep the original arcs and cubic segments. Move the tip with its adjacent
  // handles, and translate the inner curl as one intact circle. The shoulders,
  // lower outline, and all arc radii stay unchanged instead of being warped.
  const outline = serializeInstructions(
    instructions.map((instruction, index) => {
      if (index === 0 && instruction.type === "M") {
        return { ...instruction, x: instruction.x + tip };
      }
      if (index === 1 && instruction.type === "C") {
        return { ...instruction, cp1x: instruction.cp1x + tip };
      }
      if (index === 4 && instruction.type === "C") {
        return {
          ...instruction,
          cp2x: instruction.cp2x + curl,
          x: instruction.x + curl,
        };
      }
      if (index === 5 && instruction.type === "A") {
        return { ...instruction, x: instruction.x + curl };
      }
      if (index === 6 && instruction.type === "C") {
        return {
          ...instruction,
          cp1x: instruction.cp1x + curl,
          cp2x: instruction.cp2x + tip,
          x: instruction.x + tip,
        };
      }
      return instruction;
    }),
  );
  if (contourTopOffset === 0) return outline;

  // A height-linear displacement is an affine bend: it keeps the curves smooth
  // and their joins tangent, without the ripples/pinches of a nonlinear warp.
  // Bake it into the shared path so stroke weight stays constant and every long
  // arc, short dash, and dot follows exactly the same deformed contour.
  const shiftCurve = (x: number, y: number) =>
    x + (contourTopOffset * (FLAME_BASE.y - y)) / (FLAME_BASE.y - 2);
  return serializeInstructions(
    reduceInstructions(parsePath(outline)).map((instruction) => {
      if (instruction.type === "Z") return instruction;
      if (instruction.type === "C") {
        return {
          ...instruction,
          x: shiftCurve(instruction.x, instruction.y),
          cp1x: shiftCurve(instruction.cp1x, instruction.cp1y),
          cp2x: shiftCurve(instruction.cp2x, instruction.cp2y),
        };
      }
      return { ...instruction, x: shiftCurve(instruction.x, instruction.y) };
    }),
  );
};
