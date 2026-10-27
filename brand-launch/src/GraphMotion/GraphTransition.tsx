import { useId } from "react";
import {
  AbsoluteFill,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { tasteLineChartColor } from "../../../src/constants/colorModes";
import { MiniLineGraphView } from "./MiniLineGraph";
import { GraphComparisonAreaView } from "./GraphComparisonArea";
import { GraphAreaHeatmapView } from "./GraphAreaHeatmap";
import { GraphHeatmapTreemapView } from "./GraphHeatmapTreemap";
import { GraphTreemapBubbleView } from "./GraphTreemapBubble";
import { GraphBubblePieView } from "./GraphBubblePie";
import { BUBBLE_PIE_TIMING } from "./bubble-pie-transition";
import { TREEMAP_BUBBLE_TIMING } from "./treemap-bubble-transition";
import { HEATMAP_TREEMAP_TIMING } from "./heatmap-treemap-transition";
import { AREA_HEATMAP_TIMING } from "./area-heatmap-transition";
import { COMPARISON_TIMING } from "./comparison-area-transition";
import { MINI_LINE } from "./mini-line-motion";
import { roundedTrackWindow } from "./rounded-line-track";
import {
  graphTransitionPose,
  TRANSITION_TIMING,
} from "./graph-transition-motion";
import {
  graphTransitionLineProps,
  type GraphTransitionProps,
} from "./graph-transition-settings";

export const GraphTransitionView = ({
  graph,
  frame,
  fps = 60,
  scale = 1,
}: {
  graph: GraphTransitionProps;
  frame: number;
  fps?: number;
  scale?: number;
}) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pose = graphTransitionPose(frame, graph);
  if (frame < TRANSITION_TIMING.gatherStart || !pose) {
    return (
      <MiniLineGraphView
        graph={graphTransitionLineProps(graph)}
        frame={frame}
        fps={fps}
        scale={scale}
        roundTrackJoins
        currentNodeRadius={MINI_LINE.trackWidth / 2}
      />
    );
  }
  if (frame >= BUBBLE_PIE_TIMING.start) {
    return <GraphBubblePieView frame={frame} scale={scale} fps={fps} />;
  }
  if (frame >= TREEMAP_BUBBLE_TIMING.start) {
    return <GraphTreemapBubbleView frame={frame} scale={scale} fps={fps} />;
  }
  if (frame >= HEATMAP_TREEMAP_TIMING.start) {
    return (
      <GraphHeatmapTreemapView
        graph={graph}
        frame={frame}
        bars={pose.bars}
        scale={scale}
      />
    );
  }
  if (frame >= AREA_HEATMAP_TIMING.start) {
    return (
      <GraphAreaHeatmapView
        graph={graph}
        frame={frame}
        bars={pose.bars}
        scale={scale}
      />
    );
  }
  if (frame > COMPARISON_TIMING.roundStart) {
    return (
      <GraphComparisonAreaView
        graph={graph}
        frame={frame}
        bars={pose.bars}
        scale={scale}
      />
    );
  }
  const axis =
    TASTE_IDS.find(
      (taste) => TASTE_TOKENS[taste].label === graph.데이터[0].미각,
    ) ?? "umami";
  const palette = TASTE_TOKENS[axis].palette;
  const node = pose.seeds[6];
  const gradient = `transition-line-${id}`;
  const beforeDrop = frame < TRANSITION_TIMING.dropStart;
  return (
    <svg
      width={MINI_LINE.width * scale}
      height={MINI_LINE.height * scale}
      viewBox={`0 0 ${MINI_LINE.width} ${MINI_LINE.height}`}
      style={{ display: "block" }}
      role="img"
      data-graph="graph-transition"
      data-frame={frame}
      aria-label="라인의 우측 노드 하나와 배경 스트로크 여섯 조각이 씨앗으로 떨어져 일곱 막대로 자라는 합성 모션"
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
            stopColor={interpolateColors(
              node.grow,
              [0, 1],
              [tasteLineChartColor(axis, "start", "light"), palette.main],
            )}
          />
          <stop
            offset="100%"
            stopColor={tasteLineChartColor(axis, "end", "light")}
            stopOpacity={1}
          />
        </linearGradient>
      </defs>
      {beforeDrop ? (
        <>
          {frame < TRANSITION_TIMING.splitStart ? (
            <path
              data-mark="track"
              d={pose.track.path}
              {...roundedTrackWindow(pose.track.length, 0, pose.track.length)}
              fill="none"
              stroke={palette.chartTrack}
              strokeWidth={MINI_LINE.trackWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            pose.chunks.map((chunk, index) => (
              <path
                key={index}
                data-seed-origin="background"
                data-seed-index={index}
                d={pose.track.path}
                {...roundedTrackWindow(pose.track.length, chunk.from, chunk.to)}
                fill="none"
                stroke={palette.chartTrack}
                strokeWidth={MINI_LINE.trackWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))
          )}
          {frame < TRANSITION_TIMING.gatherEnd && (
            <>
              <path
                data-mark="line"
                d={pose.track.path}
                {...roundedTrackWindow(
                  pose.track.length,
                  pose.thin.from,
                  pose.thin.to,
                )}
                fill="none"
                stroke={`url(#${gradient})`}
                strokeWidth={MINI_LINE.lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pose.history.map(
                (point, index) =>
                  pose.historyDistances[index] < pose.track.length && (
                    <circle
                      key={index}
                      data-mark="history"
                      cx={point.x}
                      cy={point.y}
                      r={MINI_LINE.historyDiameter / 2}
                      fill={`url(#${gradient})`}
                    />
                  ),
              )}
            </>
          )}
        </>
      ) : (
        pose.seeds.map((seed) => (
          <rect
            key={seed.index}
            data-seed-index={seed.index}
            data-seed-origin={seed.fromCurrentNode ? "current" : "background"}
            data-mark="capsule"
            data-value={graph["막대 기록"][seed.index]}
            x={seed.x}
            y={seed.y}
            width={seed.width}
            height={seed.height}
            rx={seed.radius}
            fill={palette.chartTrack}
          />
        ))
      )}
      {/* One persistent dark node: never faded or replaced by a seventh track seed. */}
      <circle
        data-mark="current"
        data-seed-origin="current-node"
        data-seed-index={6}
        cx={node.cx}
        cy={node.cy}
        r={node.radius}
        fill={node.grow === 1 ? palette.main : `url(#${gradient})`}
      />
    </svg>
  );
};

export const GraphTransition: React.FC<GraphTransitionProps> = (props) => {
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
      <GraphTransitionView
        graph={props}
        frame={frame}
        fps={fps}
        scale={scale}
      />
    </AbsoluteFill>
  );
};
