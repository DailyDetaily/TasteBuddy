import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { trimLine } from "./line-motion";
import { roundedLineMarkers } from "../../../src/components/system/roundedLinePath";
import { pointOnRoundedTrack, roundedLineTrack } from "./rounded-line-track";
import { GRAPH_FPS } from "./motion";
import type { MiniLineGraphProps } from "./mini-line-settings";

export const MINI_LINE = {
  width: COMPONENT_TOKENS.miniChart.width,
  height: COMPONENT_TOKENS.miniChart.height,
  ...COMPONENT_TOKENS.miniChart.compactLine,
  maxPointGap: 36,
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => 1 - (1 - clamp(value)) ** 3;
export const miniLinePath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

/** Frame adapter for MiniLineChart -> TasteLineChart. Parity-tested against its actual SVG. */
export const miniLineGeometry = (props: Pick<MiniLineGraphProps, "데이터">) => {
  const inset = MINI_LINE.currentDiameter / 2;
  const maxPoints = Math.max(
    2,
    Math.floor((MINI_LINE.width - inset * 2) / MINI_LINE.maxPointGap) + 1,
  );
  const rows = props.데이터.map((row) => ({
    ...row,
    values: row.기록.slice(-maxPoints),
  }));
  const values = rows.flatMap((row) => row.values);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 0;
  const padding =
    rawMin === rawMax
      ? Math.max(1, Math.abs(rawMin) * 0.2)
      : Math.max(1, (rawMax - rawMin) * 0.18);
  const min = rawMin - padding,
    max = rawMax + padding;
  const rowHeight =
    (MINI_LINE.height - Math.max(0, rows.length - 1) * MINI_LINE.rowGap) /
    Math.max(1, rows.length);
  return rows.map((row, index) => {
    const gap =
      row.values.length > 1
        ? (MINI_LINE.width - inset * 2) / (row.values.length - 1)
        : MINI_LINE.maxPointGap;
    const points = row.values.map((value, i) => ({
      x: Math.round(
        row.values.length === 1 ? MINI_LINE.width - inset : inset + gap * i,
      ),
      y: Math.round(
        rowHeight -
          inset -
          ((value - min) / (max - min)) * (rowHeight - inset * 2),
      ),
    }));
    let length = 0;
    const distances = points.map((point, i) => {
      if (i)
        length += Math.hypot(
          point.x - points[i - 1].x,
          point.y - points[i - 1].y,
        );
      return length;
    });
    return {
      ...row,
      points,
      distances,
      length,
      rowHeight,
      offsetY: index * (rowHeight + MINI_LINE.rowGap),
      current: points[points.length - 1] ?? {
        x: MINI_LINE.width - inset,
        y: rowHeight / 2,
      },
    };
  });
};

export const miniLineTiming = (props: MiniLineGraphProps, fps = GRAPH_FPS) => {
  const start = Math.round(props["시작 대기"] * fps);
  const draw = Math.max(1, Math.round(props["진입 시간"] * fps));
  const stagger = Math.round(props["행 간 지연"] * fps);
  const spread = Math.max(0, props.데이터.length - 1) * stagger;
  const settle = start + draw + spread;
  const exit = settle + Math.round(props["유지 시간"] * fps);
  const end = exit + draw + spread;
  return {
    start,
    draw,
    stagger,
    settle,
    exit,
    end,
    fade: Math.min(draw, Math.max(1, Math.round(0.12 * fps))),
    durationInFrames:
      props.재생 === "진입·유지·퇴장"
        ? end + Math.max(1, Math.round(props["끝 여백"] * fps))
        : exit + 1,
  };
};

export const miniLinePose = (
  frame: number,
  index: number,
  props: MiniLineGraphProps,
  fps = GRAPH_FPS,
) => {
  const row = miniLineGeometry(props)[index];
  const t = miniLineTiming(props, fps);
  const entered = frame - t.start - index * t.stagger;
  const remaining = t.end - frame - index * t.stagger;
  const envelope = (duration: number) =>
    props.재생 === "정지"
      ? 1
      : props.재생 === "진입·유지·퇴장"
        ? Math.min(ease(entered / duration), ease(remaining / duration))
        : ease(entered / duration);
  const progress = envelope(t.draw);
  const visible =
    progress === 0 ? row.points.slice(0, 1) : trimLine(row.points, progress);
  const track =
    row.points.length > 1
      ? roundedLineTrack(row.points, MINI_LINE.trackWidth / 2)
      : null;
  const markers = roundedLineMarkers(row.points, MINI_LINE.trackWidth);
  return {
    ...row,
    track,
    progress,
    opacity: envelope(t.fade),
    visible,
    endpoint: track
      ? pointOnRoundedTrack(track, track.length * progress)
      : row.current,
    history: markers
      .slice(0, -1)
      .filter(
        (_, i) =>
          (track?.distances[i] ?? row.distances[i]) <=
          (track?.length ?? row.length) * progress,
      ),
  };
};
