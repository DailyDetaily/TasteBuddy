import { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import type { BarGraphProps } from "./settings";

export const GRAPH_FPS = 60;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

export const barTiming = (props: BarGraphProps, fps = GRAPH_FPS) => {
  const start = Math.round(props["시작 대기"] * fps);
  const grow = Math.max(1, Math.round(props["진입 시간"] * fps));
  const stagger = Math.round(props["막대 간 지연"] * fps);
  const spread = Math.max(0, props.데이터.length - 1) * stagger;
  const settle = start + grow + spread;
  const exit = settle + Math.round(props["유지 시간"] * fps);
  const end = exit + grow + spread;
  return {
    start,
    grow,
    stagger,
    settle,
    exit,
    end,
    fade: Math.min(grow, Math.max(1, Math.round(0.12 * fps))),
    durationInFrames:
      props.재생 === "진입·유지·퇴장"
        ? end + Math.max(1, Math.round(props["끝 여백"] * fps))
        : exit + 1,
  };
};

export const barPose = (
  frame: number,
  index: number,
  props: BarGraphProps,
  fps = GRAPH_FPS,
) => {
  // Reuse the product's count scale, density, zero/null rules and endpoint rule.
  const target = miniChartGeometry(props.데이터.map((point) => point.값))[
    index
  ];
  const timing = barTiming(props, fps);
  const elapsed = frame - timing.start - index * timing.stagger;
  const remaining = timing.end - frame - index * timing.stagger;
  const staticFrame = props.재생 === "정지";
  const envelope = (duration: number) =>
    staticFrame
      ? 1
      : props.재생 === "진입·유지·퇴장"
        ? Math.min(easeOut(elapsed / duration), easeOut(remaining / duration))
        : easeOut(elapsed / duration);
  const progress = envelope(timing.grow);
  // Positive marks start as full circles and extend upwards; no clipped caps,
  // overshoot, or value interpolation. Zero stays a half-height position mark.
  const seedHeight = Math.min(target.width, target.height);
  const height = seedHeight + (target.height - seedHeight) * progress;
  return {
    ...target,
    height,
    y: COMPONENT_TOKENS.miniChart.height - height,
    radius: Math.min(target.width, height) / 2,
    progress,
    opacity: target.height > 0 ? envelope(timing.fade) : 0,
  };
};
