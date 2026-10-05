import { getBoundingBox, warpPath } from "@remotion/paths";
import { foodIconOriginalTiming } from "./timing";

export const SEAWEED_ROOT_Y = 19;

export const seaweedPhase = (
  frame: number,
  fps: number,
  speed: number,
  still = false,
) => {
  const { cycleFrames } = foodIconOriginalTiming(speed, fps);
  const local = frame % cycleFrames;
  if (still || local === 0 || local === cycleFrames - 1) return 0;
  return (local / Math.max(1, cycleFrames - 1)) * Math.PI * 2;
};

type EdgePoint = {
  x: number;
  y: number;
  angle: number;
  distance: number;
};

export const seaweedOffset = (
  y: number,
  phase: number,
  blade: number,
  strength: number,
) => {
  const height = Math.max(0, Math.min(1, (SEAWEED_ROOT_Y - y) / 16));
  const delayedPhase = phase - (0.5 * height + 0.3 * blade) * Math.sin(phase);
  const sway = 2.4 * Math.pow(height, 1.7) * Math.sin(delayedPhase);
  const ripple =
    0.55 *
    Math.pow(height, 0.8) *
    Math.sin(height * Math.PI * 2) *
    Math.sin(delayedPhase * 2);
  return (sway + ripple) * strength;
};

const sampleEdge = (edge: EdgePoint[], distance: number) => {
  let low = 0;
  let high = edge.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (edge[middle].distance < distance) low = middle;
    else high = middle;
  }
  const a = edge[low];
  const b = edge[high];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: a.angle + (b.angle - a.angle) * t,
  };
};

export const seaweedWarp = (
  source: string,
  phase: number,
  blade: number,
  strength: number,
) => {
  const bounds = getBoundingBox(source);
  const centerX = (bounds.x1 + bounds.x2) / 2;
  const halfWidth = bounds.width / 2;
  const length = SEAWEED_ROOT_Y - bounds.y1;
  const steps = Math.ceil(length * 24);
  const offsetAt = (distance: number) =>
    seaweedOffset(SEAWEED_ROOT_Y - distance, phase, blade, strength);
  const angleAt = (distance: number) => {
    if (distance === 0) return 0;
    const before = Math.max(0, distance - 0.001);
    const after = Math.min(length, distance + 0.001);
    return Math.atan((offsetAt(after) - offsetAt(before)) / (after - before));
  };
  const edges: [EdgePoint[], EdgePoint[]] = [[], []];
  for (let i = 0; i <= steps; i++) {
    const distance = (i / steps) * length;
    const x = centerX + offsetAt(distance);
    const y = SEAWEED_ROOT_Y - distance;
    const angle = angleAt(distance);
    for (const [side, edge] of edges.entries()) {
      const offset = (side === 0 ? -1 : 1) * halfWidth;
      const point = {
        x: x + Math.cos(angle) * offset,
        y: y + Math.sin(angle) * offset,
        angle,
        distance: 0,
      };
      const previous = edge[edge.length - 1];
      if (previous) {
        point.distance =
          previous.distance +
          Math.hypot(point.x - previous.x, point.y - previous.y);
      }
      edge.push(point);
    }
  }

  return (point: { x: number; y: number }) => {
    const side = point.x < centerX ? 0 : 1;
    const distance = Math.max(0, Math.min(length, SEAWEED_ROOT_Y - point.y));
    const edge = edges[side];
    const capProgress = Math.max(
      0,
      (distance - length + halfWidth) / halfWidth,
    );
    const capEase = capProgress * capProgress * (3 - 2 * capProgress);
    // Keep the original arc-length spacing throughout the scalloped body.
    // Absorb the small length difference in the smooth rounded tip only.
    const bent = sampleEdge(
      edge,
      distance + (edge[edge.length - 1].distance - length) * capEase,
    );
    const scallop = point.x - centerX - (side === 0 ? -1 : 1) * halfWidth;
    return {
      x: bent.x + Math.cos(bent.angle) * scallop,
      y: bent.y + Math.sin(bent.angle) * scallop,
    };
  };
};

export const seaweedPath = (
  source: string,
  phase: number,
  blade: number,
  strength: number,
) => {
  if (phase === 0 || strength === 0) return source;
  return warpPath(source, seaweedWarp(source, phase, blade, strength));
};
