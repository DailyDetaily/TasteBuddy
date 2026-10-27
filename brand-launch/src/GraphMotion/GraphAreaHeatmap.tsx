import { useId } from "react";
import {
  TASTE_IDS,
  TASTE_TINTS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import type { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import { miniHeatmapColor } from "../../../src/components/system/plating/MiniHeatmap";
import { miniHeatmapMotionColor } from "./mini-heatmap-motion";
import {
  areaHeatmapTransitionPose,
  AREA_HEATMAP_TIMING,
} from "./area-heatmap-transition";
import type { GraphTransitionProps } from "./graph-transition-settings";

export const GraphAreaHeatmapView = ({
  graph,
  frame,
  bars,
  scale = 1,
}: {
  graph: GraphTransitionProps;
  frame: number;
  bars: ReturnType<typeof miniChartGeometry>;
  scale?: number;
}) => {
  const clipId = `heatmap-panel-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const pose = areaHeatmapTransitionPose(frame, graph, bars);
  const axis =
    TASTE_IDS.find((id) => TASTE_TOKENS[id].label === graph.데이터[0].미각) ??
    "umami";
  const t = AREA_HEATMAP_TIMING;
  return (
    <svg
      width={132 * scale}
      height={56 * scale}
      viewBox="0 0 132 56"
      style={{ display: "block" }}
      role="img"
      data-graph="graph-transition"
      data-frame={frame}
      data-phase={pose.phase}
      aria-label="합성 전환 영상: 큰 영역 순차 채움, 작은 영역 역재생과 노드 소멸, 히트맵 격자 분할 후 1·2·3·4단계 색상 표시"
    >
      {frame <= t.splitStart ? (
        <path
          data-mark="filling-area"
          d={pose.large.path}
          fill={TASTE_TINTS[axis][80]}
        />
      ) : (
        <>
          <defs>
            <clipPath id={clipId}>
              <rect {...pose.bounds} rx={pose.outerRadius} />
            </clipPath>
          </defs>
          <g
            clipPath={`url(#${clipId})`}
            data-mark="heatmap-grid"
            data-split={pose.split}
            data-color-progress={pose.colorProgress}
          >
            {pose.cells.map((cell) => (
              <rect
                key={cell.slot}
                data-mark="heatmap-cell"
                data-slot={cell.slot}
                data-level={
                  cell.padding ? "padding" : (cell.level ?? "missing")
                }
                x={cell.x}
                y={cell.y}
                width={cell.width}
                height={cell.height}
                rx={cell.radius}
                fill={
                  cell.padding
                    ? pose.calendarProgress === 0
                      ? TASTE_TINTS[axis][80]
                      : pose.calendarProgress === 1
                        ? miniHeatmapColor(null, axis)
                        : `color-mix(in srgb, ${TASTE_TINTS[axis][80]} ${(1 - pose.calendarProgress) * 100}%, ${miniHeatmapColor(null, axis)} ${pose.calendarProgress * 100}%)`
                    : cell.level === null && frame >= t.colorStart
                      ? "none"
                      : pose.colorProgress === 0
                        ? TASTE_TINTS[axis][80]
                        : miniHeatmapMotionColor(
                            cell.level ?? 0,
                            axis,
                            pose.colorProgress,
                          )
                }
                stroke={
                  cell.level === null && frame >= t.colorStart
                    ? miniHeatmapColor(null, axis)
                    : undefined
                }
                strokeWidth={
                  cell.level === null && frame >= t.colorStart
                    ? Math.min(0.6, cell.height / 4)
                    : undefined
                }
              />
            ))}
          </g>
        </>
      )}
      {frame < t.collapseEnd ? (
        <path
          data-mark="reversing-small-area"
          d={pose.small.path}
          fill={TASTE_TINTS[axis][20]}
        />
      ) : frame < t.nodeExitEnd ? (
        <circle
          data-mark="disappearing-node"
          cx={pose.node.cx}
          cy={pose.node.cy}
          r={pose.node.radius}
          fill={TASTE_TINTS[axis][20]}
        />
      ) : null}
    </svg>
  );
};
