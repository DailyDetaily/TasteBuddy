import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import { getTasteChartArea } from "../../../src/constants/tasteColors";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { miniAreaPose } from "./mini-area-motion";
import type { MiniAreaGraphProps } from "./mini-area-settings";

export const MiniAreaGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniAreaGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const pose = miniAreaPose(frame, graph);
  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      style={
        {
          display: "block",
          "--tb-mini-chart-track": getTasteChartArea(graph.미각),
        } as CSSProperties
      }
      role="img"
      aria-label={`미니 영역 모션 · 합성 견본. ${graph.미각}: ${graph.기록.length ? graph.기록.slice(-4).join(" → ") : "기록 없음"}`}
      data-graph="mini-area"
      data-frame={frame}
      data-progress={pose.progress}
      data-minimum-height={pose.minimumHeight}
    >
      {pose.paths.map((path, index) => (
        <path
          key={index}
          data-name="Rounded area surface"
          d={path}
          fill="var(--tb-mini-chart-track)"
        />
      ))}
    </svg>
  );
};

export const MiniAreaGraph: React.FC<MiniAreaGraphProps> = (props) => {
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
      <MiniAreaGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
