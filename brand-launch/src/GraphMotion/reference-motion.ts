import { lineGeometry, trimLine } from "./line-motion";
import type { ReferenceLineProps } from "./reference-settings";

// Fit to the orange endpoint's normalized x in Taste Card Scroll_1.gif,
// 25fps, frames 9–35. RMSE 0.00893; this is timing, not user data.
export const REFERENCE_EASING = [0.3038, 0, 0.2562, 1] as const;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const referenceRowHeight = (props: ReferenceLineProps) =>
  24 + 10 * ((props["높낮이 배율"] ?? 1) - 1);

export const referenceGeometry = (props: ReferenceLineProps, index: number) => {
  const geometry = lineGeometry(props, index);
  const gain = props["높낮이 배율"] ?? 1;
  const expand = (point: { x: number; y: number }) => ({
    x: point.x,
    y:
      geometry.state === "empty"
        ? referenceRowHeight(props) / 2
        : 8 + (point.y - 8) * gain,
  });
  return {
    ...geometry,
    points: geometry.points.map(expand),
    track: geometry.track.map(expand),
  };
};

export const referenceRowStep = (props: ReferenceLineProps) => {
  const rows = props.데이터.map((_, index) => referenceGeometry(props, index));
  // Keep the two graphs close; expand only if their actual strokes would touch.
  return Math.max(
    28,
    ...rows
      .slice(1)
      .map(
        (row, index) =>
          Math.max(...rows[index].track.map((point) => point.y)) -
          Math.min(...row.track.map((point) => point.y)) +
          16,
      ),
  );
};

export const referenceEase = (value: number) => {
  const x = clamp(value);
  if (x === 0 || x === 1) return x;
  let low = 0,
    high = 1;
  for (let i = 0; i < 24; i++) {
    const t = (low + high) / 2;
    const at =
      3 * (1 - t) ** 2 * t * REFERENCE_EASING[0] +
      3 * (1 - t) * t * t * REFERENCE_EASING[2] +
      t ** 3;
    if (at < x) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) * t * t + t ** 3;
};

export const referenceTiming = (props: ReferenceLineProps, fps = 30) => {
  const start = Math.round(props["시작 대기"] * fps);
  const grow = Math.max(1, Math.round(props["진입 시간"] * fps));
  const stagger = Math.round(props["행 간 지연"] * fps);
  const settle = start + grow + (props.데이터.length - 1) * stagger;
  const exit = settle + Math.round(props["유지 시간"] * fps);
  // The exit uses the entrance duration, easing, and per-row delay.
  const arrive = exit + grow + (props.데이터.length - 1) * stagger;
  const end = arrive + 1;
  return {
    start,
    grow,
    stagger,
    settle,
    exit,
    arrive,
    end,
    durationInFrames: Math.max(
      1,
      props.재생 === "진입·유지·퇴장"
        ? end + Math.max(1, Math.round(props["끝 여백"] * fps))
        : exit + 1,
    ),
  };
};

// Move the tail along the exact path followed by the entrance head.
export const trimLineFromLeft = (
  points: ReturnType<typeof lineGeometry>["track"],
  progress: number,
) => {
  if (progress <= 0) return points;
  if (progress >= 1) return [points[points.length - 1]];
  const prefix = trimLine(points, progress);
  return [prefix[prefix.length - 1], ...points.slice(prefix.length - 1)];
};

export const referenceLinePose = (
  frame: number,
  index: number,
  props: ReferenceLineProps,
  fps = 30,
) => {
  const timing = referenceTiming(props, fps);
  const geometry = referenceGeometry(props, index);
  const staticFrame = props.재생 === "정지";
  const start = timing.start + index * timing.stagger;
  const progress = staticFrame
    ? 1
    : referenceEase((frame - start) / timing.grow);
  const exitStart = timing.exit + index * timing.stagger;
  const leaving = props.재생 === "진입·유지·퇴장" && frame >= exitStart;
  const exitProgress = leaving
    ? referenceEase((frame - exitStart) / timing.grow)
    : 0;
  const shown =
    staticFrame ||
    (frame >= start &&
      !(props.재생 === "진입·유지·퇴장" && frame > exitStart + timing.grow));
  const visible = !shown
    ? []
    : leaving
      ? geometry.state === "pending"
        ? // A waiting track's only real node is on the left: retract that
          // decorative tail to its real node without inventing another point.
          exitProgress >= 1
          ? [geometry.points[0]]
          : trimLine(geometry.track, 1 - exitProgress)
        : trimLineFromLeft(geometry.track, exitProgress)
      : progress > 0
        ? trimLine(geometry.track, progress)
        : [geometry.track[0], geometry.track[0]];
  return {
    ...geometry,
    progress,
    exitProgress,
    visible,
    opacity: shown ? 1 : 0,
    endpoint: !shown
      ? undefined
      : geometry.state === "pending"
        ? geometry.points[0]
        : leaving
          ? geometry.track[geometry.track.length - 1]
          : visible[visible.length - 1],
  };
};

export const referencePresentation = (
  frame: number,
  props: ReferenceLineProps,
  fps = 30,
) => {
  const timing = referenceTiming(props, fps);
  const phase =
    props.재생 === "정지"
      ? "static"
      : frame < timing.start
        ? "waiting"
        : frame < timing.settle
          ? "drawing"
          : props.재생 !== "진입·유지·퇴장" || frame < timing.exit
            ? "holding"
            : frame < timing.end
              ? "exiting-right"
              : "blank";
  return { phase };
};
