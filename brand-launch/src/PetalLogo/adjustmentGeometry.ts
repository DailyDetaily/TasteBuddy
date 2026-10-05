// The three radial-layer split/rejoin sequence from taste-motion.ts rotatingLayers.
// One complete sequence is paced to three seconds with AE-style Easy Ease.
const states = [
  [0, 0, 0],
  [0, 0, 15],
  [0, 15, 30],
  [15, 15, 30],
  [30, 30, 30],
];
export const adjustmentLayers = (
  seconds: number,
  inner: number,
  outer: number,
) => {
  const progress = Math.max(0, Math.min(1, seconds / 3));
  const step = Math.min(
    states.length - 2,
    Math.floor(progress * (states.length - 1)),
  );
  const t = progress * (states.length - 1) - step;
  const eased = t * t * (3 - 2 * t);
  return Array.from({ length: 3 }, (_, layer) => ({
    layer,
    inner: inner + ((outer - inner) * layer) / 3,
    outer: inner + ((outer - inner) * (layer + 1)) / 3,
    angle:
      states[step][layer] +
      (states[step + 1][layer] - states[step][layer]) * eased,
  }));
};
