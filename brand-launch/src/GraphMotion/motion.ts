import type { BarGraphProps } from "./settings";

export const GRAPH_FPS = 30;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

export const barTiming = (props: BarGraphProps, fps = GRAPH_FPS) => {
  const padding = Math.max(1, Math.round(0.2 * fps));
  const grow = Math.max(1, Math.round(props["진입 시간"] * fps));
  const stagger = Math.round(props["막대 간 지연"] * fps);
  const spread = Math.max(0, props.데이터.length - 1) * stagger;
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

// Logical dimensions follow HomeArchiveChartView: 12×32 compact bars,
// 16×180 detail bars. The preview scales the complete graph uniformly.
export const barLayout = (props: BarGraphProps) => {
  const compact = props.형태 === "홈 미니";
  const width = compact ? 132 : 312;
  const gap = compact ? 3 : 8;
  const count = props.데이터.length;
  const column = (width - gap * Math.max(0, count - 1)) / Math.max(1, count);
  const barWidth = Math.min(compact ? 12 : 16, column);
  const top = 24;
  const plotHeight = compact ? 32 : 180;
  const labelFontSize = compact ? 6 : 10;
  const charactersPerLine = Math.max(1, Math.floor(column / labelFontSize));
  const labelLines = props.데이터.map((point) => {
    const characters = Array.from(point.항목);
    return Array.from(
      { length: Math.ceil(characters.length / charactersPerLine) },
      (_, line) =>
        characters
          .slice(line * charactersPerLine, (line + 1) * charactersPerLine)
          .join(""),
    );
  });
  const footer = props["수치와 라벨"]
    ? Math.max(
        40,
        24 +
          Math.max(0, ...labelLines.map((lines) => lines.length)) *
            labelFontSize *
            1.35,
      )
    : 24;
  return {
    width,
    gap,
    column,
    barWidth,
    top,
    plotHeight,
    labelFontSize,
    labelLines,
    baseline: top + plotHeight,
    viewWidth: width + 32,
    viewHeight: top + plotHeight + footer,
    x: (index: number) => 16 + column / 2 + index * (column + gap),
  };
};

export const barPose = (
  frame: number,
  index: number,
  props: BarGraphProps,
  fps = GRAPH_FPS,
) => {
  const timing = barTiming(props, fps);
  const layout = barLayout(props);
  const value = props.데이터[index]?.값;
  const maximum = Math.max(0, ...props.데이터.map((point) => point.값 ?? 0));
  const fraction =
    value != null && maximum > 0 ? Math.max(0, value) / maximum : 0;
  const start = timing.padding + index * timing.stagger;
  const entered = easeOut((frame - start) / timing.grow);
  // Reverse the same entrance envelope: rightmost retracts first and the
  // endpoints stay attached to the capsule rather than floating or squashing.
  const remaining = easeOut(
    (timing.end - frame - index * timing.stagger) / timing.grow,
  );
  const progress =
    props.재생 === "정지"
      ? 1
      : props.재생 === "진입·유지·퇴장"
        ? Math.min(entered, remaining)
        : entered;
  const height = layout.plotHeight * fraction * progress;
  const diameter = Math.min(layout.barWidth, height);
  const hasEndpoint =
    props.끝점 === "모든 막대" ||
    (props.끝점 === "마지막 막대" && index === props.데이터.length - 1);
  const labelIn = easeOut(
    (frame - (start + timing.grow * 0.7)) / (timing.grow * 0.3),
  );
  const labelOut = easeOut(
    (timing.end - frame - index * timing.stagger - timing.grow * 0.7) /
      (timing.grow * 0.3),
  );
  return {
    value,
    fraction,
    progress,
    height,
    x: layout.x(index),
    y: layout.baseline - height,
    width: layout.barWidth,
    radius: diameter / 2,
    endpointRadius: hasEndpoint ? diameter / 2 : 0,
    labelOpacity:
      props.재생 === "정지"
        ? 1
        : props.재생 === "진입·유지·퇴장"
          ? Math.min(labelIn, labelOut)
          : labelIn,
  };
};
