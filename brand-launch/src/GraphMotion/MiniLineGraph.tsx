import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { tasteLineChartColor } from "../../../src/constants/colorModes";
import { MINI_LINE, miniLinePath, miniLinePose } from "./mini-line-motion";
import type { MiniLineGraphProps } from "./mini-line-settings";
import { roundedTrackWindow } from "./rounded-line-track";

/** Pure frame view: compare its final SVG with the original product component. */
export const MiniLineGraphView = ({
  graph: props,
  frame,
  fps,
  scale = 1,
  roundTrackJoins = true,
  currentNodeRadius,
}: {
  graph: MiniLineGraphProps;
  frame: number;
  fps: number;
  scale?: number;
  /** Presentation overrides used only by the combined graph video. */
  roundTrackJoins?: boolean;
  currentNodeRadius?: number;
}) => {
  const id = useId().replace(/:/g, "");
  const summary = props.데이터
    .map(
      (row) =>
        `${row.미각}: ${row.기록.length ? row.기록.slice(-4).join(" → ") : "기록 없음"}`,
    )
    .join("; ");
  return (
    <svg
      width={MINI_LINE.width * scale}
      height={MINI_LINE.height * scale}
      viewBox={`0 0 ${MINI_LINE.width} ${MINI_LINE.height}`}
      style={{ display: "block" }}
      role="img"
      aria-label={`미니 라인 모션 · 합성 미각 변화. ${summary}`}
      data-graph="mini-line"
      data-frame={frame}
    >
      <title>기존 미니 라인 그래프 · 실제 계정과 연결되지 않은 합성 견본</title>
      {props.데이터.map((row, index) => {
        const pose = miniLinePose(frame, index, props, fps);
        const axis =
          TASTE_IDS.find((axis) => TASTE_TOKENS[axis].label === row.미각) ??
          "umami";
        const gradient = `mini-line-${id}-${index}`;
        const currentGradient = `${gradient}-current`;
        const track = pose.track;
        const revealed = track ? track.length * pose.progress : 0;
        const path = track?.path ?? miniLinePath(pose.visible);
        const window = track
          ? roundedTrackWindow(track.length, 0, revealed)
          : {};
        return (
          <g
            key={index}
            transform={`translate(0 ${pose.offsetY})`}
            opacity={pose.opacity}
            data-row={index}
            data-progress={pose.progress}
          >
            <defs>
              <linearGradient
                id={gradient}
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={MINI_LINE.width}
                y1={0}
                y2={0}
              >
                <stop
                  offset="0%"
                  stopColor={tasteLineChartColor(axis, "start", "light")}
                />
                <stop
                  offset="100%"
                  stopColor={tasteLineChartColor(axis, "end", "light")}
                  stopOpacity={1}
                />
              </linearGradient>
              <linearGradient
                id={currentGradient}
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={MINI_LINE.width}
                y1={0}
                y2={0}
              >
                <stop offset="0%" stopColor={tasteLineChartColor(axis, "nodeStart", "light")} />
                <stop offset="100%" stopColor={tasteLineChartColor(axis, "end", "light")} />
              </linearGradient>
            </defs>
            <path
              data-mark="track"
              d={path}
              {...window}
              fill="none"
              stroke={tasteLineChartColor(axis, "track", "light")}
              strokeLinecap="round"
              strokeLinejoin={roundTrackJoins ? "round" : undefined}
              strokeWidth={MINI_LINE.trackWidth}
            />
            <path
              data-mark="line"
              d={path}
              {...window}
              fill="none"
              stroke={`url(#${gradient})`}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={MINI_LINE.lineWidth}
            />
            {pose.history.map((point, i) => (
              <circle
                key={i}
                data-mark="history"
                cx={point.x}
                cy={point.y}
                r={MINI_LINE.historyDiameter / 2}
                fill={`url(#${gradient})`}
              />
            ))}
            <circle
              data-mark="current"
              cx={pose.endpoint.x}
              cy={pose.endpoint.y}
              r={currentNodeRadius ?? MINI_LINE.currentDiameter / 2}
              fill={`url(#${currentGradient})`}
            />
          </g>
        );
      })}
    </svg>
  );
};

export const MiniLineGraph: React.FC<MiniLineGraphProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(
    props["확대 배율"],
    (width * 0.9) / MINI_LINE.width,
    (height * 0.9) / MINI_LINE.height,
  );
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MiniLineGraphView graph={props} frame={frame} fps={fps} scale={scale} />
    </AbsoluteFill>
  );
};
