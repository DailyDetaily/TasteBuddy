// Timings fitted to the supplied 300-frame reference, in its 30fps timebase.
// The source movie contains no editable animation curves; these are reconstructed.
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};
export const ramp = (frame: number, start: number, end: number) =>
  smooth((frame - start) / (end - start));

export const keyed = (
  frame: number,
  frames: readonly number[],
  values: readonly number[],
) => {
  if (frame <= frames[0]) return values[0];
  for (let i = 1; i < frames.length; i++) {
    if (frame <= frames[i]) {
      const t = ramp(frame, frames[i - 1], frames[i]);
      return values[i - 1] + (values[i] - values[i - 1]) * t;
    }
  }
  return values[values.length - 1];
};

export const getLogoGridMotion = (frame: number) => {
  const intro = frame < 210;
  const petalTime = intro ? frame : 42 - (frame - 228) * 2;
  return {
    frame,
    radial: keyed(
      petalTime,
      [18, 24, 27, 30, 33, 36, 39, 42],
      [0, 0.17, 0.27, 0.41, 0.62, 0.82, 0.95, 1],
    ),
    tangential: keyed(
      petalTime,
      [18, 24, 27, 30, 33, 36, 39, 42],
      [0, 0.35, 1.05, 1.85, 1.58, 1.2, 1.02, 1],
    ),
    circularity: keyed(
      petalTime,
      [18, 24, 27, 30, 33, 36, 42],
      [0, 0, 0.55, 1, 0.25, 0, 0],
    ),
    symbolOpacity: ramp(frame, 18, 24) * (1 - ramp(frame, 239, 242)),
    wordmark: ramp(frame, 43, 51) * (1 - ramp(frame, 220, 229)),
    grid: ramp(frame, 24, 48) * (1 - ramp(frame, 255, 272)),
    perimeter: ramp(frame, 30, 48) * (1 - ramp(frame, 259, 272)),
    dimensions: ramp(frame, 31, 48) * (1 - ramp(frame, 256, 270)),
    stack: ramp(frame, 0, 43) * (1 - ramp(frame, 257, 272)),
    stackOpacity:
      ramp(frame, 0, 8) *
      (0.25 + 0.75 * ramp(frame, 18, 48)) *
      (1 - ramp(frame, 263, 276)),
  };
};

// Source order is not clockwise. Indices are the original root-child indices.
export const petalAngles: Record<number, number> = {
  17: 0,
  19: 60,
  21: 120,
  18: 180,
  20: 240,
  22: 300,
};
export const orbitAngles: Record<number, number> = {
  37: 30,
  41: 60,
  28: 90,
  39: 120,
  26: 150,
  43: 180,
  38: 210,
  42: 240,
  36: 270,
  40: 300,
  27: 330,
};

export const getOrbitAngle = (frame: number, target: number) => {
  const index = target / 30;
  if (frame < 210) {
    const frontier = keyed(
      frame,
      [36, 42, 48, 54, 60, 66, 72, 78, 86],
      [0, 10, 85, 170, 220, 265, 300, 340, 370],
    );
    return Math.max(0, Math.min(target, frontier - index * 2));
  }
  const frontier = keyed(
    frame,
    [210, 218, 230, 242, 254, 262],
    [360, 335, 280, 180, 60, 0],
  );
  return Math.max(0, Math.min(target, frontier - (11 - index) * 1.5));
};
