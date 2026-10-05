import { FOOD_ICON_CYCLE_SECONDS, foodIconOriginalTiming } from "./timing";

const POUR_COMPLETE_SECONDS = 1.76;
const DROP_START_SECONDS = POUR_COMPLETE_SECONDS + 0.04;
const DROP_DURATION_SECONDS = 0.48;
const AERATE_START_SECONDS = DROP_START_SECONDS + DROP_DURATION_SECONDS;
export const WINE_LINE_WIDTH = 2;

const smooth = (start: number, end: number, seconds: number) => {
  const t = Math.max(0, Math.min(1, (seconds - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

export const wineMotion = (
  frame: number,
  fps: number,
  speed: number,
  strength: number,
  still = false,
) => {
  const { durationInFrames } = foodIconOriginalTiming(speed, fps);
  const seconds = still
    ? 0
    : ((frame % durationInFrames) / durationInFrames) *
      FOOD_ICON_CYCLE_SECONDS *
      2;
  // The pouring head first touches the painted glass rim at about 0.44s.
  const fill =
    smooth(0.44, POUR_COMPLETE_SECONDS, seconds) *
    (1 - smooth(3.24, 4.16, seconds));
  const aerate =
    smooth(AERATE_START_SECONDS, AERATE_START_SECONDS + 0.28, seconds) *
    (1 - smooth(2.92, 3.28, seconds));
  const lift = smooth(2.96, 3.44, seconds) * (1 - smooth(4.2, 4.68, seconds));
  const tip = smooth(3.08, 3.72, seconds) * (1 - smooth(4.2, 4.68, seconds));
  const phase = ((seconds - AERATE_START_SECONDS) / 0.84) * Math.PI * 2;
  const pouring =
    smooth(0.6, 0.84, seconds) *
    (1 - smooth(POUR_COMPLETE_SECONDS - 0.28, POUR_COMPLETE_SECONDS, seconds));
  const drinkWave =
    smooth(3.08, 3.44, seconds) * (1 - smooth(3.88, 4.16, seconds));
  const dropProgress = Math.max(
    0,
    Math.min(1, (seconds - DROP_START_SECONDS) / DROP_DURATION_SECONDS),
  );

  return {
    fill,
    x: 0.22 * strength * aerate * Math.sin(phase),
    y: -1.4 * strength * lift + 0.1 * strength * aerate * (1 - Math.cos(phase)),
    angle: strength * (2.4 * aerate * Math.sin(phase) - 40 * tip),
    wavePhase: phase,
    waveAmplitude:
      strength *
      (0.72 * aerate + 0.16 * pouring + 0.18 * drinkWave) *
      Math.sin((fill * Math.PI) / 2),
    pourHead: smooth(0.32, 0.64, seconds),
    pourTail: smooth(
      POUR_COMPLETE_SECONDS - 0.32,
      POUR_COMPLETE_SECONDS,
      seconds,
    ),
    dropletHeight: 3.2 * strength * 4 * dropProgress * (1 - dropProgress),
    dropletRadius: WINE_LINE_WIDTH / 2,
    dropletOpacity:
      smooth(0, 0.1, dropProgress) * (1 - smooth(0.9, 1, dropProgress)),
  };
};

type WinePose = ReturnType<typeof wineMotion>;
type Bowl = {
  left: number;
  right: number;
  fullY: number;
  bottomY: number;
};

export const wineSurface = (pose: WinePose, bowl: Bowl) => {
  const centerX = (bowl.left + bowl.right) / 2;
  const radians = (pose.angle * Math.PI) / 180;
  // Counter-tilt the liquid inside the rotating glass to keep it level in space.
  const slope = -Math.tan(radians);
  const radius = bowl.bottomY - bowl.fullY;
  // Start at the inside of the 2px bowl outline, where the first wine is visible.
  const emptyY = bowl.fullY + Math.max(0, radius - 1) / Math.cos(radians);
  const level = emptyY + (bowl.fullY - emptyY) * pose.fill;
  const left = bowl.left - 1;
  const right = bowl.right + 1;
  const width = right - left;
  const waveNumber = (Math.PI * 2) / width;
  const height = (x: number) =>
    level +
    slope * (x - centerX) +
    pose.waveAmplitude * Math.sin((x - left) * waveNumber + pose.wavePhase);
  const derivative = (x: number) =>
    slope +
    pose.waveAmplitude *
      waveNumber *
      Math.cos((x - left) * waveNumber + pose.wavePhase);

  // Four cubic spans form a smooth travelling wave without polygon corners.
  let surface = `M ${left} ${height(left)}`;
  for (let index = 0; index < 4; index++) {
    const from = left + (width * index) / 4;
    const to = left + (width * (index + 1)) / 4;
    const handle = (to - from) / 3;
    surface += ` C ${from + handle} ${height(from) + derivative(from) * handle} ${to - handle} ${height(to) - derivative(to) * handle} ${to} ${height(to)}`;
  }
  const bowlWidth = bowl.right - bowl.left;
  const streamX = centerX + bowlWidth * 0.1;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // Find the surface under the stream's landing point, including glass sway.
  let contactX = streamX;
  for (let index = 0; index < 4; index++) {
    const worldX =
      centerX +
      pose.x +
      (contactX - centerX) * cos -
      (height(contactX) - bowl.bottomY) * sin;
    contactX -= (worldX - streamX) / (cos - derivative(contactX) * sin);
  }
  const surfaceY =
    bowl.bottomY +
    pose.y +
    (contactX - centerX) * sin +
    (height(contactX) - bowl.bottomY) * cos;
  const streamTop = -4;
  // A 2px round-capped stroke extends 1px past its endpoint.
  const streamBottom = surfaceY - 1;
  const streamStartX = centerX - bowlWidth * 0.45;
  const streamLength = pose.pourHead - pose.pourTail;
  // Keep the upper curve fixed. Only its straight, vertical tail shortens as
  // the liquid rises, so filling cannot bend or stretch the pouring arc.
  const curveBottom = bowl.fullY - 2;
  const curveHeight = curveBottom - streamTop;
  const streamPath = `M ${streamStartX} ${streamTop} C ${centerX - bowlWidth * 0.15} ${streamTop + curveHeight * 0.2} ${streamX} ${streamTop + curveHeight * 0.46} ${streamX} ${curveBottom} L ${streamX} ${streamBottom}`;

  return {
    surface,
    centerSurfaceY: height(centerX),
    stream: streamLength > 0 ? streamPath : null,
    streamStart: pose.pourTail,
    streamLength,
  };
};
