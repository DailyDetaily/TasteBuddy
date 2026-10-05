import type { TasteChangeGraphProps } from "./line-settings";

export type LinePoint = { x: number; y: number };
export const LINE_METRICS = {
  width: 132,
  rowHeight: 24,
  rowGap: 4,
  trackWidth: 12,
  coreWidth: 2,
  nodeRadius: 6,
  maxPointGap: 36,
  maximumPoints: 7,
} as const;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

export const lineTiming = (props: TasteChangeGraphProps, fps = 30) => {
  const padding = Math.max(1, Math.round(fps * 0.2));
  const grow = Math.max(1, Math.round(props["진입 시간"] * fps));
  const stagger = Math.round(props["행 간 지연"] * fps);
  const spread = (props.데이터.length - 1) * stagger;
  const settle = padding + grow + spread;
  const exit = settle + Math.max(1, Math.round(props["유지 시간"] * fps));
  const end = exit + grow + spread;
  return {
    padding,
    grow,
    stagger,
    settle,
    exit,
    end,
    durationInFrames:
      props.재생 === "진입·유지·퇴장" ? end + padding + 1 : exit + 1,
  };
};

// Native TasteLineChart shares one domain across rows. Row position, not a
// separately rescaled trend, determines y. Zero and negative values are valid.
export const lineDomain = (props: TasteChangeGraphProps) => {
  const values = props.데이터.flatMap((row) =>
    row.기록.slice(-LINE_METRICS.maximumPoints),
  );
  if (!values.length) return { min: -1, max: 1 };
  const min = Math.min(...values),
    max = Math.max(...values);
  const padding =
    min === max
      ? Math.max(1, Math.abs(min) * 0.2)
      : Math.max(1, (max - min) * 0.18);
  return { min: min - padding, max: max + padding };
};

export const lineGeometry = (props: TasteChangeGraphProps, index: number) => {
  const values = props.데이터[index].기록.slice(-LINE_METRICS.maximumPoints);
  const state = !values.length
    ? "empty"
    : values.length === 1 && props["첫 기록 대기선"]
      ? "pending"
      : "history";
  const intervals = Math.max(0, values.length - 1);
  const gap =
    intervals > 0
      ? Math.min(
          LINE_METRICS.maxPointGap,
          (LINE_METRICS.width - 12) / intervals,
        )
      : 0;
  const graphWidth =
    state === "history" ? 12 + intervals * gap : LINE_METRICS.width;
  const offset = LINE_METRICS.width - graphWidth;
  const domain = lineDomain(props);
  const points = values.map((value, i) => ({
    x: offset + 6 + i * gap,
    y:
      18 -
      ((value - domain.min) / Math.max(domain.max - domain.min, 0.001)) * 10,
  }));
  const track =
    state === "empty"
      ? [
          { x: 6, y: 12 },
          { x: 126, y: 12 },
        ]
      : state === "pending"
        ? [points[0], { x: 126, y: points[0].y }]
        : points;
  return { state, values, points, track, offset, graphWidth };
};

// Trim along the original polyline. No smoothing or value interpolation that
// changes its settled geometry; the moving endpoint stays on that path.
export const trimLine = (points: LinePoint[], progress: number) => {
  if (!points.length || progress <= 0) return [];
  if (progress >= 1 || points.length === 1) return points;
  const lengths = points
    .slice(1)
    .map((point, i) =>
      Math.hypot(point.x - points[i].x, point.y - points[i].y),
    );
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * progress;
  const visible = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) {
      visible.push(points[i + 1]);
      remaining -= lengths[i];
    } else {
      const fraction = lengths[i] > 0 ? remaining / lengths[i] : 0;
      visible.push({
        x: points[i].x + (points[i + 1].x - points[i].x) * fraction,
        y: points[i].y + (points[i + 1].y - points[i].y) * fraction,
      });
      break;
    }
  }
  return visible;
};

export const linePose = (
  frame: number,
  index: number,
  props: TasteChangeGraphProps,
  fps = 30,
) => {
  const timing = lineTiming(props, fps);
  const geometry = lineGeometry(props, index);
  const entered = easeOut(
    (frame - timing.padding - index * timing.stagger) / timing.grow,
  );
  const remaining = easeOut(
    (timing.end - frame - index * timing.stagger) / timing.grow,
  );
  const progress =
    props.재생 === "정지"
      ? 1
      : props.재생 === "진입·유지·퇴장"
        ? Math.min(entered, remaining)
        : entered;
  const visible = trimLine(geometry.track, progress);
  return {
    ...geometry,
    progress,
    visible,
    opacity: easeOut(progress * 5),
    // Waiting space never moves the one real observation into an invented past.
    endpoint:
      geometry.state === "pending"
        ? geometry.points[0]
        : visible[visible.length - 1],
  };
};

export const linePath = (points: LinePoint[]) =>
  points.map((point, i) => `${i ? "L" : "M"}${point.x} ${point.y}`).join(" ");
