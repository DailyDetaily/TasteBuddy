import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import {
  CHART_COMPARISON_TRACK_COLOR,
  COLOR_TOKENS,
  TASTE_TOKENS,
} from "../../../src/constants/uiColorTokens";
import {
  miniGroupedBarAxis,
  miniGroupedBarPose,
} from "./mini-grouped-bar-motion";
import type { MiniGroupedBarGraphProps } from "./mini-grouped-bar-settings";

export const MiniGroupedBarGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniGroupedBarGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const palette = TASTE_TOKENS[miniGroupedBarAxis(graph)].palette;
  const valuesLabel = (values: readonly (number | null)[]) =>
    values.length
      ? values
          .map((value) => (value === null ? "미확인" : `${value}개`))
          .join(" · ")
      : "미확인";
  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      style={
        {
          display: "block",
          "--tb-mini-chart-track": palette.chartTrack,
        } as CSSProperties
      }
      role="img"
      data-graph="mini-grouped-bar"
      data-frame={frame}
      aria-label={`미니 그룹 막대 모션 · 합성 요리 기록 수. 이전: ${valuesLabel(graph["이전 기록"])}. 현재: ${valuesLabel(graph["현재 기록"])}`}
    >
      {miniGroupedBarPose(frame, graph).map(
        (bar, index) =>
          bar.height > 0 && (
            <g
              key={index}
              data-pair-index={bar.index}
              data-series={bar.comparison ? "previous" : "current"}
              data-progress={bar.progress}
              opacity={bar.opacity}
            >
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={bar.radius}
                fill={
                  bar.comparison
                    ? CHART_COMPARISON_TRACK_COLOR
                    : "var(--tb-mini-chart-track)"
                }
              />
              {bar.endpoint && (
                <circle
                  cx={bar.x + bar.width / 2}
                  cy={bar.y + bar.radius}
                  r={bar.radius}
                  fill={bar.comparison ? COLOR_TOKENS.text.body : palette.main}
                />
              )}
            </g>
          ),
      )}
    </svg>
  );
};

export const MiniGroupedBarGraph: React.FC<MiniGroupedBarGraphProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const plot = COMPONENT_TOKENS.miniChart;
  const scale = Math.min(
    props["확대 배율"],
    (width * 0.9) / plot.width,
    (height * 0.9) / plot.height,
  );
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MiniGroupedBarGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
