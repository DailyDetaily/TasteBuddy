import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import MiniBubbleChart from "../../../src/components/system/plating/MiniBubbleChart";
import {
  miniBubbleContent,
  miniBubbleItems,
  miniBubblePose,
} from "./mini-bubble-motion";
import type { MiniBubbleGraphProps } from "./mini-bubble-settings";

export const MiniBubbleGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniBubbleGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const circles = miniBubblePose(frame, graph);
  // Center the final visible bounds, not the source SVG's right-aligned box.
  // Ignore animated progress so the group stays anchored during growth/exit.
  const left = circles.length
    ? Math.min(...circles.map((circle) => circle.cx - circle.radius))
    : 0;
  const right = circles.length
    ? Math.max(...circles.map((circle) => circle.cx + circle.radius))
    : width;
  const offsetX = (width - left - right) / 2;
  // Animate only the source SVG's top-level item groups. Its area geometry,
  // labels, icon paths, colors and accessibility description remain untouched.
  const motion =
    `[data-bubble-motion="${id}"] > svg { overflow: visible; }\n` +
    circles
      .map(
        (circle, order) =>
          `[data-bubble-motion="${id}"] > svg > g:nth-of-type(${order + 1}) { transform-box: view-box; transform-origin: ${circle.cx}px ${circle.cy}px; transform: scale(${circle.progress}); visibility: ${circle.progress > 0 ? "visible" : "hidden"}; }`,
      )
      .join("\n");
  return (
    <div
      data-graph="mini-bubble"
      data-frame={frame}
      style={{ width: width * scale, height: height * scale }}
    >
      <style>{motion}</style>
      <div
        data-bubble-motion={id}
        style={{
          width,
          height,
          transformOrigin: "0 0",
          transform: `scale(${scale}) translateX(${offsetX}px)`,
        }}
      >
        <MiniBubbleChart
          items={miniBubbleItems(graph)}
          content={miniBubbleContent(graph)}
        />
      </div>
    </div>
  );
};

export const MiniBubbleGraph: React.FC<MiniBubbleGraphProps> = (props) => {
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
      <MiniBubbleGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
