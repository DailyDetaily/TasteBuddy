export const PETAL_FPS = 30;
export const PETAL_OPEN_FRAMES = PETAL_FPS; // One second to first reach the fully open pose.
export const PETAL_TURN_START = PETAL_OPEN_FRAMES + PETAL_FPS;
export const PETAL_TURN_FRAMES = 10;
export const PETAL_DURATION = PETAL_FPS * 6;
export const PETAL_THICKNESS = 10; // Total front-to-back depth in 1080px composition units.
export const PETAL_COPY_START = PETAL_TURN_START + PETAL_TURN_FRAMES;
export const PETAL_COPY_FRAMES = 10;
export const PETAL_COPY_ANGLE = 30;
export const PETAL_SHORTEN_START = PETAL_COPY_START + PETAL_COPY_FRAMES;
export const PETAL_SHORTEN_FRAMES = 10;
export const PETAL_FINAL_HOLD_FRAMES =
  PETAL_DURATION - PETAL_SHORTEN_START - PETAL_SHORTEN_FRAMES;
export const PETAL_ANGLES = [0, 60, 120, 180, -120, -60] as const;
export const PETAL_PIVOT = { x: 129.644, y: 627.2727272727 };
export const PETAL_PERSPECTIVE = 1400;
export type MotionSettings = {
  openFrames: number;
  openHoldFrames: number;
  yFrames: number;
  copyFrames: number;
  shortenFrames: number;
  finalHoldFrames: number;
  yDegrees: number;
  thickness: number;
  copyDegrees: number;
  innerRatio: number;
  scale: number;
};
export const DEFAULT_SETTINGS: MotionSettings = {
  openFrames: 30,
  openHoldFrames: 30,
  yFrames: 10,
  copyFrames: 10,
  shortenFrames: 10,
  finalHoldFrames: 90,
  yDegrees: 90,
  thickness: 10,
  copyDegrees: 30,
  innerRatio: 0.25,
  scale: 0.53,
};
export const getTiming = (settings: MotionSettings = DEFAULT_SETTINGS) => {
  const turnStart = settings.openFrames + settings.openHoldFrames;
  const copyStart = turnStart + settings.yFrames;
  const shortenStart = copyStart + settings.copyFrames;
  const holdStart = shortenStart + settings.shortenFrames;
  return {
    turnStart,
    copyStart,
    shortenStart,
    holdStart,
    duration: holdStart + settings.finalHoldFrames,
  };
};
export const petalChapters = [
  {
    from: 0,
    duration: PETAL_OPEN_FRAMES,
    name: "01 · X축 펼침",
  },
  {
    from: PETAL_OPEN_FRAMES,
    duration: PETAL_FPS,
    name: "02 · 펴진 상태 유지",
  },
  {
    from: PETAL_TURN_START,
    duration: PETAL_TURN_FRAMES,
    name: "03 · Y축 회전",
  },
  {
    from: PETAL_TURN_START + PETAL_TURN_FRAMES,
    duration: PETAL_COPY_FRAMES,
    name: "04 · 회전 후 정지",
  },
  {
    from: PETAL_SHORTEN_START,
    duration: PETAL_SHORTEN_FRAMES,
    name: "06 · 바깥쪽 기준 라인 단축",
  },
  {
    from: PETAL_SHORTEN_START + PETAL_SHORTEN_FRAMES,
    duration: PETAL_FINAL_HOLD_FRAMES,
    name: "07 · 단축 후 정지",
  },
] as const;
// The original held set stays put while the copy turns and then holds.
export const petalLayers = [
  ...petalChapters.slice(0, 4).map((chapter, index) => ({
    ...chapter,
    axis: (index < 2 ? "X" : "Y") as "X" | "Y",
  })),
  {
    from: PETAL_COPY_START,
    duration: PETAL_COPY_FRAMES,
    name: "05 · 복제본 시계방향 회전",
    axis: "Z",
  },
  ...petalChapters.slice(4).map((chapter) => ({ ...chapter, axis: "length" })),
];
// AE default Easy Ease on the rotation keyframes: zero endpoint velocity,
// one-third temporal influence on each end (shown as 33.33% in AE).
// Cubic Bezier (1/3, 0, 2/3, 1) has linear time and value 3t² - 2t³.
// https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html
export const easyEase = (progress: number) => {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
};
export const openingRotationX = (frame: number, settings = DEFAULT_SETTINGS) =>
  90 * (1 - easyEase(frame / settings.openFrames));
export const copyRotationZ = (frame: number, settings = DEFAULT_SETTINGS) =>
  settings.copyDegrees *
  easyEase((frame - getTiming(settings).copyStart) / (settings.copyFrames - 1));
export const getLineLengthState = (
  frame: number,
  radii: { inner: number; outer: number },
  settings = DEFAULT_SETTINGS,
) => {
  const progress = easyEase(
    (frame - getTiming(settings).shortenStart) / (settings.shortenFrames - 1),
  );
  const inner =
    radii.inner + (radii.outer * settings.innerRatio - radii.inner) * progress;
  const scale = (radii.outer - inner) / (radii.outer - radii.inner);
  return {
    inner,
    outer: radii.outer,
    scale,
    offset: -radii.outer * (1 - scale),
  };
};
export const getPetalScene = (settings = DEFAULT_SETTINGS) => ({
  x: 540,
  y: 960,
  scale: settings.scale,
});
export const getPetalPose = (
  frame: number,
  index: number,
  settings = DEFAULT_SETTINGS,
) => ({
  angle: PETAL_ANGLES[index],
  // The original SVG planes share one pivot and unfold simultaneously.
  rotationX: openingRotationX(frame, settings),
  // The ten displayed samples are frames 60–69, including both keyframes.
  rotationY:
    settings.yDegrees *
    easyEase((frame - getTiming(settings).turnStart) / (settings.yFrames - 1)),
  thickness: frame >= getTiming(settings).turnStart ? settings.thickness : 0,
  opacity: 1,
});
