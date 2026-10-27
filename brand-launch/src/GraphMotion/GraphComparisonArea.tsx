import { interpolateColors } from "remotion";
import {
  TASTE_IDS,
  TASTE_TINTS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import type { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  comparisonAreaTransitionPose,
  COMPARISON_TIMING,
} from "./comparison-area-transition";
import { roundedTrackWindow } from "./rounded-line-track";
import type { GraphTransitionProps } from "./graph-transition-settings";

export const GraphComparisonAreaView = ({
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
  const pose = comparisonAreaTransitionPose(frame, graph, bars);
  const axis =
    TASTE_IDS.find(
      (axis) => TASTE_TOKENS[axis].label === graph.데이터[0].미각,
    ) ?? "umami";
  const palette = TASTE_TOKENS[axis].palette,
    t = COMPARISON_TIMING;
  const nodeColor =
    pose.node.colorProgress <= 0
      ? palette.main
      : pose.node.colorProgress >= 1
        ? TASTE_TINTS[axis][20]
        : interpolateColors(
            pose.node.colorProgress,
            [0, 1],
            [palette.main, TASTE_TINTS[axis][20]],
          );
  const trackPath = `M ${pose.track.from} ${pose.track.y} H ${pose.track.to}`;
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
      aria-label="합성 전환 영상: 바닥 고정 원형 축소, 진한 노드의 낙하와 탄성, 캡슐 연결 후 큰 영역과 진한 영역의 순차 성장"
    >
      {frame < t.connectStart ? (
        pose.circles.map((bar, i) => (
          <rect
            key={i}
            data-mark="rounding-bar"
            data-bar-index={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={bar.radius}
            fill={TASTE_TINTS[axis][80]}
          />
        ))
      ) : frame < t.connectEnd ? (
        pose.segments.map((segment, i) => (
          <path
            key={i}
            data-mark="joining-segment"
            data-seed-index={i}
            d={trackPath}
            stroke={TASTE_TINTS[axis][80]}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
            {...roundedTrackWindow(
              pose.track.to - pose.track.from,
              segment.from - pose.track.from,
              segment.to - pose.track.from,
            )}
          />
        ))
      ) : (
        <path
          data-mark="comparison-large"
          data-tint="80"
          d={pose.large.path}
          fill={TASTE_TINTS[axis][80]}
        />
      )}
      {frame >= t.spreadStart ? (
        <path
          data-mark="comparison-small"
          data-seed-origin="current-node"
          data-color-role="tint/20"
          d={pose.small.path}
          fill={TASTE_TINTS[axis][20]}
        />
      ) : (
        <circle
          data-mark="current"
          data-seed-origin="current-node"
          cx={pose.node.cx}
          cy={pose.node.cy}
          r={pose.node.radius}
          fill={nodeColor}
        />
      )}
    </svg>
  );
};
