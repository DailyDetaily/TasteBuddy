import { random } from "remotion";

const FOCUS_RANGE_SCALE = 1.6;

// Seeded phases/directions keep Studio scrubbing and parallel renders identical.
// Integer frequencies close both the position and velocity at the loop seam.
// Slightly quicker secondary waves lift average speed without a faster main orbit.
const wander = [
  { frequency: 2, amplitude: 0.14 },
  { frequency: 4, amplitude: 0.09 },
  { frequency: 5, amplitude: 0.06 },
  { frequency: 10, amplitude: 0.035 },
].map((wave, index) => {
  const direction = random(`taste-sphere-direction-${index}`) * Math.PI * 2;
  return {
    ...wave,
    phase: random(`taste-sphere-phase-${index}`) * Math.PI * 2,
    dx: Math.cos(direction),
    dy: Math.sin(direction),
  };
});

/** Normalized focus offset. Its distance never exceeds 0.52 of the radius. */
export const sphereFocus = (
  frame: number,
  durationInFrames: number,
  still: boolean,
) => {
  if (still) return { x: 0.14, y: 0.2 };
  const phase = (frame / Math.max(1, durationInFrames)) * Math.PI * 2;
  return wander.reduce(
    (point, wave) => {
      const displacement =
        FOCUS_RANGE_SCALE *
        wave.amplitude *
        Math.sin(phase * wave.frequency + wave.phase);
      return {
        x: point.x + displacement * wave.dx,
        y: point.y + displacement * wave.dy,
      };
    },
    { x: 0, y: 0 },
  );
};
