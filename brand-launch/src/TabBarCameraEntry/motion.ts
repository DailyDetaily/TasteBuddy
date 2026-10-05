import {
  mix,
  type BeamColor,
  type BeamState,
} from "../TabBarPlusButton/motion";
import {
  palette as feedbackPalette,
  tasteAxes,
} from "../DiningFeedbackMotion/colors";
import type { CameraEntryProps } from "./settings";

export const ENTRY_FPS = 60;
export const NATIVE_WIDTH = 402;
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const smoothStep = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

// A frame-addressable shuffle lets Studio seeking and parallel rendering use
// the same random order. Every three pairs contain all six palette colors.
const shuffledPalette = (bag: number, seed: number) => {
  let state =
    (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(bag + 1, 0x85ebca6b)) >>> 0;
  const indices = tasteAxes.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    const j = Math.floor(random * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

const rgb = (hex: string): BeamColor => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];
const palette = tasteAxes.map((axis) => rgb(feedbackPalette[axis].main));
const tints = tasteAxes.map((axis) => rgb(feedbackPalette[axis].tint));

export type EntryColorState = BeamState & {
  background: BeamColor;
  tertiary: BeamColor;
};

export const resultBackgroundColors = (state: EntryColorState) => {
  const hex = (color: BeamColor) =>
    `#${color
      .map((channel) =>
        Math.round(channel * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  return {
    background: hex(state.background),
    main: hex(state.first),
    secondary: hex(state.second),
    tertiary: hex(state.tertiary),
  };
};

export const colorPairForCycle = (cycle: number, seed: number) => {
  const bag = Math.floor(cycle / 3);
  const indices = shuffledPalette(bag, seed);
  if (bag > 0) {
    const previous = shuffledPalette(bag - 1, seed).slice(4);
    if (previous.includes(indices[0]) && previous.includes(indices[1])) {
      [indices[1], indices[2]] = [indices[2], indices[1]];
    }
  }
  const offset = (cycle % 3) * 2;
  return [indices[offset], indices[offset + 1]] as const;
};

export const randomBeamState = (
  frame: number,
  fps: number,
  interval: number,
  seed: number,
  mode: CameraEntryProps["컬러 모드"] = "6색 랜덤",
): EntryColorState => {
  const cycleFrames = Math.max(1, Math.round(interval * fps));
  const time = Math.max(0, frame);
  const cycle = Math.floor(time / cycleFrames);
  const local = (time % cycleFrames) / cycleFrames;
  const current =
    mode === "블루 · 퍼플"
      ? ([3, 4] as const)
      : mode === "블루 · 옐로우"
        ? ([3, 1] as const)
        : colorPairForCycle(cycle, seed);
  const next =
    mode === "6색 랜덤" ? colorPairForCycle(cycle + 1, seed) : current;
  // Briefly settle on each pair so the six individual colors remain legible.
  const blend = smoothStep((local - 0.12) / 0.76);
  const phase = (time / fps / 3.6) * Math.PI * 2;
  return {
    phase,
    hue: 0,
    first: mix(palette[current[0]], palette[next[0]], blend),
    second: mix(palette[current[1]], palette[next[1]], blend),
    tertiary: mix(palette[current[1]], palette[next[1]], blend),
    background: mix(tints[current[0]], tints[next[0]], blend),
  };
};

// Captured from SwiftUI Spring(duration: role.duration, bounce: 0.18).
// TasteBloomMotion uses settlingDuration, not the nominal 0.72s, as its clock.
export const nativeSpring = {
  bloom: {
    duration: 1.2586192857687966,
    stiffness: 76.15435494667715,
    damping: 14.311699866353504,
  },
  feedback: {
    duration: 0.35971687345552483,
    stiffness: 1218.4696791468343,
    damping: 57.246799465414014,
  },
};

export const springValue = (
  elapsed: number,
  role: keyof typeof nativeSpring = "bloom",
) => {
  const { stiffness, damping, duration } = nativeSpring[role];
  if (elapsed <= 0) return 0;
  if (elapsed >= duration) return 1;
  const decay = damping / 2;
  const frequency = Math.sqrt(stiffness - decay * decay);
  return (
    1 -
    Math.exp(-decay * elapsed) *
      (Math.cos(frequency * elapsed) +
        (decay / frequency) * Math.sin(frequency * elapsed))
  );
};

type TimingProps = Pick<
  CameraEntryProps,
  "클릭 전 대기" | "누름 시간" | "진입 속도" | "카메라 유지 시간"
>;

export const entryTiming = (props: TimingProps, fps = ENTRY_FPS) => {
  const clickFrame = Math.round(props["클릭 전 대기"] * fps);
  const pressFrames = Math.max(1, Math.round(props["누름 시간"] * fps));
  const launchFrame = clickFrame + pressFrames;
  const bloomFrames = Math.ceil(
    (nativeSpring.bloom.duration * fps) / props["진입 속도"],
  );
  const fadeFrames = Math.ceil(
    (nativeSpring.feedback.duration * fps) / props["진입 속도"],
  );
  const cameraFrame = launchFrame + bloomFrames;
  const controlsFrame =
    cameraFrame - Math.round((0.3 * fps) / props["진입 속도"]);
  const clearFrame = cameraFrame + fadeFrames;
  return {
    clickFrame,
    pressFrames,
    launchFrame,
    bloomFrames,
    fadeFrames,
    cameraFrame,
    controlsFrame,
    clearFrame,
    durationInFrames:
      clearFrame + Math.round(props["카메라 유지 시간"] * fps) + 1,
  };
};

export type Point = { x: number; y: number };
export type Viewport = { width: number; height: number };

export const entryLayout = (
  width: number,
  height: number,
  bottom: number,
  buttonSize: number,
) => {
  const scale = width / NATIVE_WIDTH;
  return {
    scale,
    size: { width: NATIVE_WIDTH, height: height / scale },
    origin: { x: NATIVE_WIDTH / 2, y: (height - bottom) / scale },
    sourceRadius: buttonSize / scale / 2,
  };
};

export const bloomState = (elapsed: number, buttonState: EntryColorState) => {
  const time = Math.max(0, elapsed);
  const local = (time % 3.6) / 3.6;
  const progress = clamp(time / nativeSpring.bloom.duration);
  const expansion = springValue(time);
  const phase = local * Math.PI * 2;
  // Button and bloom share the ongoing color clock, including during entry.
  const colors = [buttonState.first, buttonState.second];
  return {
    progress,
    expansion,
    phase,
    colors,
  };
};

export const bloomGeometry = (
  size: Viewport,
  origin: Point,
  expansion: number,
  sourceRadius = 24,
) => {
  const target =
    Math.max(
      ...[0, size.width].flatMap((x) =>
        [0, size.height].map((y) => Math.hypot(x - origin.x, y - origin.y)),
      ),
    ) +
    Math.max(size.width, size.height) * 0.16;
  const radius = sourceRadius + (target - sourceRadius) * expansion;
  const reveal = smoothStep((expansion - 0.7) / 0.3);
  const halo =
    Math.max(Math.min(size.width, size.height) * 0.28, 104) *
    (1 - reveal * 0.3);
  const revealRadius = Math.max(0, radius - halo) * reveal;
  const revealFeather = 8 + 14 * reveal;
  return {
    radius,
    revealRadius,
    revealFeather,
    maskFeather:
      (5.5 + 10.5 * clamp(expansion / 0.24)) *
      (1 - clamp((expansion - 0.9) / 0.1) * 0.2),
    edgeBlur:
      (7 + 13 * clamp(expansion / 0.22)) *
      (1 - clamp((expansion - 0.88) / 0.12) * 0.18),
    edgeWidth:
      Math.max(Math.min(size.width, size.height) * 0.09, 34) *
      (0.58 + 0.42 * clamp(expansion / 0.28)) *
      (1 - clamp((expansion - 0.88) / 0.12) * 0.42),
  };
};

// Same 128-sample radial boundary as TasteBloomTransitionMetrics.radialBlobPath.
export const radialBlobPath = (
  size: Viewport,
  origin: Point,
  radius: number,
  phase: number,
  expansion: number,
  sourceRadius = 24,
) => {
  const amplitude =
    Math.max(Math.min(size.width, size.height) * 0.072, 26) *
    (0.72 + 0.34 * clamp(expansion / 0.3)) *
    (0.08 + 0.92 * smoothStep(expansion / 0.12)) *
    (1 - clamp((expansion - 0.9) / 0.1) * 0.54) *
    (0.76 + 0.24 * Math.min(radius / 180, 1));
  return (
    Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      const wave =
        Math.sin(a * 3 + phase * 1.18) * 0.52 +
        Math.sin(a * 6 - phase * 0.74) * 0.24 +
        Math.cos(a * 2 + phase * 0.46) * 0.14 +
        Math.sin(a * 10 + phase * 1.72) * 0.12 +
        Math.cos(a * 13 - phase * 1.08) * 0.09 +
        Math.sin(a - Math.PI / 2) * 0.1;
      const r = Math.max(sourceRadius * 0.72, radius + amplitude * wave);
      return `${i === 0 ? "M" : "L"}${(origin.x + Math.cos(a) * r).toFixed(4)},${(origin.y + Math.sin(a) * r).toFixed(4)}`;
    }).join(" ") + " Z"
  );
};
