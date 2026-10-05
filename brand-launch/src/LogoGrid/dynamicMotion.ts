import { keyed, ramp } from "./motion";
import { getShortsOpeningPose, SHORTS_OPEN_FRAMES } from "./shortsOpening";
export { circleEaseOut, introCircles } from "./circleGuideMotion";

export const dynamicChapters = [
  { from: 0, duration: 21, name: "01 · 중앙 12원에서 시작" },
  { from: 21, duration: 33, name: "02 · 6 · 14 · 28 · 38원 확대" },
  { from: 54, duration: 33, name: "03 · 여섯 잎의 3D 펼침" },
  { from: 87, duration: 27, name: "04 · 작도 원의 제자리 확대" },
  { from: 114, duration: 30, name: "05 · 심벌에서 이름으로 팬" },
  { from: 144, duration: 39, name: "06 · Taste / Buddy 순차 등장" },
  { from: 183, duration: 42, name: "07 · 전체 로고로 풀백" },
  { from: 225, duration: 75, name: "08 · 가이드 정리와 역재생 접힘" },
] as const;

// Source SVG coordinates. At scale=1, the final visible logo spans 62% of HD width.
export const dynamicBaseScale = (1920 * 0.62) / (754 - 225.7550527132959);
const cameraFrames = [0, 14, 24, 34, 46, 54, 87, 114, 144, 183, 225];
export const getDynamicCamera = (frame: number) => ({
  x: keyed(
    frame,
    cameraFrames,
    [308, 308, 308, 308, 308, 308, 308, 308, 525, 596, 489.87752635665],
  ),
  y: keyed(
    frame,
    cameraFrames,
    [249, 249, 234, 218, 206, 249, 249, 249, 211, 263, 263],
  ),
  scale: keyed(
    frame,
    cameraFrames,
    [22, 22, 9.5, 5.7, 3.3, 2.65, 1.75, 1.9, 2.2, 1.35, 1],
  ),
  roll: 0,
});

export const BLOOM_START = 54;
export const BLOOM_END = 87;
export const DYNAMIC_FOLD_END = 299;
export const DYNAMIC_FOLD_START = DYNAMIC_FOLD_END - SHORTS_OPEN_FRAMES;
export const INTRO_GUIDE_HANDOFF_END = BLOOM_END + 12;
export const introVisibility = (frame: number, index = 35) => {
  // Keep the central 12 circle/label and north 38 outline through the bloom
  // and held logo. Their only exit is the shared final guideExit fade.
  if (index === 35 || index === 49 || index === 25) return 1;
  return 1 - ramp(frame, BLOOM_END, INTRO_GUIDE_HANDOFF_END);
};

// Closing samples the opening in reverse; it has no separate motion curve.
export const getDynamicOpeningFrame = (frame: number) =>
  frame >= DYNAMIC_FOLD_START ? DYNAMIC_FOLD_END - frame : frame - BLOOM_START;
export const getPetalPose3D = (frame: number) =>
  getShortsOpeningPose(getDynamicOpeningFrame(frame));

export const guideExit = (frame: number) => 1 - ramp(frame, 225, 246);
