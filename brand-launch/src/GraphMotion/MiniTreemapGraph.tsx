import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import MiniTreemapChart from "../../../src/components/system/plating/MiniTreemapChart";
import { miniTreemapItems, miniTreemapPose } from "./mini-treemap-motion";
import type { MiniTreemapGraphProps } from "./mini-treemap-settings";

export const MiniTreemapGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniTreemapGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cells = miniTreemapPose(frame, graph);
  // Keep the source SVG and its rounded-area compensation unchanged.
  // Rect and label scale together about each final cell's center.
  const motion =
    `[data-treemap-motion="${id}"] > svg { overflow: visible; }\n` +
    cells
      .map(
        (cell, order) =>
          `[data-treemap-motion="${id}"] > svg > g:nth-of-type(${order + 1}) { transform-box: view-box; transform-origin: ${cell.x + cell.width / 2}px ${cell.y + cell.height / 2}px; transform: scale(${cell.progress}); visibility: ${cell.progress > 0 ? "visible" : "hidden"}; }`,
      )
      .join("\n");
  return (
    <div
      data-graph="mini-treemap"
      data-frame={frame}
      style={{ width: width * scale, height: height * scale }}
    >
      <style>{motion}</style>
      <div
        data-treemap-motion={id}
        style={{
          width,
          height,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
        }}
      >
        <MiniTreemapChart items={miniTreemapItems(graph)} />
      </div>
    </div>
  );
};

export const MiniTreemapGraph: React.FC<MiniTreemapGraphProps> = (props) => {
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
      <MiniTreemapGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
