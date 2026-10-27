import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { miniHeatmapColor } from "../../../src/components/system/plating/MiniHeatmap";
import {
  miniHeatmapAxis,
  miniHeatmapPose,
  miniHeatmapMotionColor,
} from "./mini-heatmap-motion";
import type { MiniHeatmapGraphProps } from "./mini-heatmap-settings";

export const MiniHeatmapGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniHeatmapGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const cells = miniHeatmapPose(frame, graph);
  const axis = miniHeatmapAxis(graph);
  const total = cells.reduce((sum, cell) => sum + (cell.value ?? 0), 0);
  const missing = cells.filter(
    (cell) => !cell.padding && cell.level === null,
  ).length;
  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
      role="img"
      data-graph="mini-heatmap"
      data-frame={frame}
      aria-label={`미니 히트맵 모션 · 합성 요리 기록 수. ${graph.기록.length}일, 확인된 기록 ${total}개, 미확인 ${missing}일. 가로 월–일, 세로 주차.`}
    >
      {cells.map((cell) => (
        <g
          key={cell.slot}
          data-slot={cell.slot}
          opacity={cell.opacity}
          data-color-progress={cell.colorProgress}
        >
          <rect
            x={cell.x}
            y={cell.y}
            width={cell.width}
            height={cell.height}
            rx={Math.min(2, cell.width / 2, cell.height / 2)}
            data-level={cell.padding ? "padding" : (cell.level ?? "missing")}
            aria-hidden={cell.padding || undefined}
            fill={
              cell.padding
                ? miniHeatmapColor(null)
                : cell.level === null
                  ? "none"
                  : miniHeatmapMotionColor(cell.level, axis, cell.colorProgress)
            }
            stroke={
              cell.level === null ? miniHeatmapColor(null, axis) : undefined
            }
            strokeWidth={
              cell.level === null ? Math.min(0.6, cell.height / 4) : undefined
            }
          >
            {!cell.padding && (
              <title>{`${cell.index + 1}일째: ${cell.value === null ? "미확인" : `${cell.value}개`}`}</title>
            )}
          </rect>
        </g>
      ))}
    </svg>
  );
};

export const MiniHeatmapGraph: React.FC<MiniHeatmapGraphProps> = (props) => {
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
      <MiniHeatmapGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
