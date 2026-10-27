import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { COLOR_TOKENS } from "../../../src/constants/uiColorTokens";
import { miniStackedBarColor } from "../../../src/components/system/plating/MiniStackedBarChart";
import { miniStackedBarPose } from "./mini-stacked-bar-motion";
import type { MiniStackedBarGraphProps } from "./mini-stacked-bar-settings";

export const MiniStackedBarGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniStackedBarGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const bars = miniStackedBarPose(frame, graph);
  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
      role="img"
      data-graph="mini-stacked-bar"
      data-frame={frame}
      aria-label={`미니 누적 막대 모션 · 합성 요리 기록 수. ${graph.데이터
        .map(
          (series) =>
            `${series.항목}: ${series.기록.map((value) => (value === null ? "미확인" : value)).join(" · ")}`,
        )
        .join(", ")}`}
    >
      {bars.map(
        (bar) =>
          bar.height > 0 && (
            <g
              key={bar.index}
              data-bar-index={bar.index}
              data-progress={bar.progress}
              opacity={bar.total === 0 ? bar.opacity : undefined}
            >
              {bar.total === 0 ? (
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx={bar.radius}
                  fill={COLOR_TOKENS.border.default}
                />
              ) : (
                bar.layers.map((layer) => (
                  <rect
                    key={layer.id}
                    x={bar.x}
                    y={layer.y}
                    width={bar.width}
                    height={layer.height}
                    rx={layer.radius}
                    fill={miniStackedBarColor(layer.axis)}
                    opacity={layer.opacity < 1 ? layer.opacity : undefined}
                  />
                ))
              )}
            </g>
          ),
      )}
    </svg>
  );
};

export const MiniStackedBarGraph: React.FC<MiniStackedBarGraphProps> = (
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
      <MiniStackedBarGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
