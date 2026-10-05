// Geometry, color transforms and timing from BottomTabCenterButton.swift.
// The native random pairs are arranged into a deterministic, closed video loop.
export type BeamColor = readonly [number, number, number];

export const NATIVE_SIZE = 48;
export const COLOR_INSET = 1 / 3; // The verified iPhone @3x one-pixel inset.
export const BUTTON_FPS = 60;
export const CYCLE_SECONDS = 3.6;
export const palette: readonly BeamColor[] = [
  [1, 0.6, 0],
  [251 / 255, 192 / 255, 45 / 255],
  [149 / 255, 201 / 255, 0],
  [114 / 255, 153 / 255, 1],
  [179 / 255, 114 / 255, 180 / 255],
  [149 / 255, 134 / 255, 122 / 255],
];
export const colorPairs = [
  [3, 2],
  [0, 4],
  [5, 3],
  [1, 2],
  [4, 0],
  [2, 5],
] as const;
export const pairNames = [
  "파랑 · 초록",
  "주황 · 분홍",
  "갈색 · 파랑",
  "노랑 · 초록",
  "분홍 · 주황",
  "초록 · 갈색",
] as const;

export const blobSpecs = [
  {
    color: 0,
    radiusX: 42,
    radiusY: 24,
    x: 0.18,
    y: 0.08,
    group: 1,
    xSign: 1,
    ySign: 1,
    glow: true,
  },
  {
    color: 0,
    radiusX: 36,
    radiusY: 21,
    x: 0.42,
    y: 0,
    group: 2,
    xSign: 1,
    ySign: 1,
    glow: false,
  },
  {
    color: 0,
    radiusX: 24,
    radiusY: 42,
    x: 0,
    y: 0.42,
    group: 3,
    xSign: 1,
    ySign: 1,
    glow: true,
  },
  {
    color: 0,
    radiusX: 18,
    radiusY: 24,
    x: 0.29,
    y: 1,
    group: 2,
    xSign: -1,
    ySign: -1,
    glow: false,
  },
  {
    color: 1,
    radiusX: 108,
    radiusY: 19,
    x: 0.74,
    y: 0,
    group: 1,
    xSign: -1,
    ySign: 1,
    glow: false,
  },
  {
    color: 1,
    radiusX: 51,
    radiusY: 16,
    x: 1,
    y: 0.38,
    group: 3,
    xSign: -1,
    ySign: 1,
    glow: true,
  },
  {
    color: 1,
    radiusX: 44,
    radiusY: 19,
    x: 0.78,
    y: 0.94,
    group: 1,
    xSign: -1,
    ySign: -1,
    glow: true,
  },
  {
    color: 1,
    radiusX: 16,
    radiusY: 25,
    x: 0.52,
    y: 1,
    group: 2,
    xSign: -1,
    ySign: -1,
    glow: false,
  },
] as const;

const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const mix = (a: BeamColor, b: BeamColor, amount: number): BeamColor => [
  a[0] + (b[0] - a[0]) * amount,
  a[1] + (b[1] - a[1]) * amount,
  a[2] + (b[2] - a[2]) * amount,
];

export const filterColor = (
  color: BeamColor,
  hue: number,
  brightness: number,
  saturation: number,
  contrast = 1,
): BeamColor => {
  const [r, g, b] = color;
  const c = Math.cos((hue * Math.PI) / 180);
  const s = Math.sin((hue * Math.PI) / 180);
  const red =
    ((0.213 + c * 0.787 - s * 0.213) * r +
      (0.715 - c * 0.715 - s * 0.715) * g +
      (0.072 - c * 0.072 + s * 0.928) * b) *
    brightness;
  const green =
    ((0.213 - c * 0.213 + s * 0.143) * r +
      (0.715 + c * 0.285 + s * 0.14) * g +
      (0.072 - c * 0.072 - s * 0.283) * b) *
    brightness;
  const blue =
    ((0.213 - c * 0.213 - s * 0.787) * r +
      (0.715 - c * 0.715 + s * 0.715) * g +
      (0.072 + c * 0.928 + s * 0.072) * b) *
    brightness;
  const luma = red * 0.213 + green * 0.715 + blue * 0.072;
  return [red, green, blue].map((v) =>
    clamp((luma + (v - luma) * saturation - 0.5) * contrast + 0.5),
  ) as unknown as BeamColor;
};

export const limitLuminance = (color: BeamColor, max: number): BeamColor => {
  const luma = color[0] * 0.213 + color[1] * 0.715 + color[2] * 0.072;
  return luma > max
    ? (color.map((v) => (v * max) / luma) as unknown as BeamColor)
    : color;
};
export const rgba = (c: BeamColor, alpha = 1) =>
  `rgba(${c.map((v) => (v * 255).toFixed(4)).join(",")},${alpha})`;

export const buttonTiming = (speed: number, fps = BUTTON_FPS) => {
  const cycleFrames = Math.max(1, Math.round((CYCLE_SECONDS * fps) / speed));
  const loopFrames = cycleFrames * colorPairs.length;
  return { cycleFrames, loopFrames, durationInFrames: loopFrames + 1 };
};

export const beamState = (
  frame: number,
  fps: number,
  speed: number,
  firstPair = 0,
  still = false,
) => {
  const { cycleFrames, loopFrames } = buttonTiming(speed, fps);
  const local = still ? 0 : ((frame % loopFrames) + loopFrames) % loopFrames;
  const cycle = Math.floor(local / cycleFrames);
  const progress = (local % cycleFrames) / cycleFrames;
  const eased = progress * progress * (3 - 2 * progress);
  const current = colorPairs[(cycle + firstPair) % colorPairs.length];
  const next = colorPairs[(cycle + firstPair + 1) % colorPairs.length];
  const phase = progress * Math.PI * 2;
  return {
    phase,
    hue: still ? 0 : Math.sin(phase + Math.PI / 6) * 12,
    first: mix(palette[current[0]], palette[next[0]], eased),
    second: mix(palette[current[1]], palette[next[1]], eased),
  };
};
export type BeamState = ReturnType<typeof beamState>;

export const blobGeometry = (phase: number) => {
  const wave = (offset: number) => (1 - Math.cos(phase + offset)) / 2;
  const glow = 0.9 + wave(Math.PI / 3) * 0.2;
  return blobSpecs.map((blob) => {
    const offset = ((blob.group - 1) * Math.PI * 2) / 3;
    return {
      color: blob.color,
      cx: NATIVE_SIZE * blob.x + 5.7 * Math.sin(phase + offset) * blob.xSign,
      cy:
        NATIVE_SIZE * blob.y +
        5.7 * Math.sin(phase + offset + Math.PI / 2) * blob.ySign,
      rx: blob.radiusX * (0.86 + wave(offset) * 0.3),
      ry:
        blob.radiusY *
        (0.88 + wave(offset + Math.PI) * 0.24) *
        (blob.glow ? glow : 1),
    };
  });
};
