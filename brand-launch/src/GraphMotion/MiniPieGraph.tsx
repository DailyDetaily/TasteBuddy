import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import PieChart, {
  pieDonutColor,
  pieDonutRemainderColor,
} from "../../../src/components/system/plating/PieDonutChart";
import { SYMBOL_DONUT } from "../../../src/components/system/plating/symbolDonutGeometry";
import { miniPieMode, miniPiePose, miniPieSegments } from "./mini-pie-motion";
import type { MiniPieGraphProps } from "./mini-pie-settings";

export const MiniPieGraphView = ({
  graph,
  frame,
  scale = 1,
}: {
  graph: MiniPieGraphProps;
  frame: number;
  scale?: number;
}) => {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const pose = miniPiePose(frame, graph);
  const segments = miniPieSegments(graph);
  const clipId = useId().replace(/:/g, "");
  return (
    <div
      data-graph="mini-pie"
      data-frame={frame}
      data-motion="radial-fill"
      style={{
        width: height * scale,
        height: height * scale,
        position: "relative",
      }}
    >
      <div
        style={{
          width,
          height,
          transformOrigin: "0 0",
          transform: `scale(${scale}) translateX(${height - width}px)`,
        }}
      >
        <div data-fill-progress={pose.fillProgress} style={{ width, height }}>
          {pose.pieces.every((piece) => piece.fillProgress === 1) ? (
            <PieChart segments={segments} mode={miniPieMode(graph)} />
          ) : (
            <div
              style={{
                width,
                height,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width={height}
                height={height}
                viewBox={`0 0 ${SYMBOL_DONUT.diameter} ${SYMBOL_DONUT.diameter}`}
                role="img"
                aria-label="미니 파이 · 합성 예시 · 안쪽에서 바깥쪽으로 채움"
                style={{ display: "block", flexShrink: 0, overflow: "visible" }}
              >
                <defs>
                  {pose.pieces.map((piece) => (
                    <clipPath key={piece.index} id={`${clipId}-${piece.index}`}>
                      <path d={piece.path} />
                    </clipPath>
                  ))}
                </defs>
                {pose.fillProgress > 0 &&
                  pose.pieces
                    .filter((piece) => piece.fillProgress > 0)
                    .map((piece) => (
                      <g
                        key={piece.index}
                        clipPath={`url(#${clipId}-${piece.index})`}
                      >
                        <path
                          data-layer="fill"
                          d={piece.filledPath ?? undefined}
                          fill={
                            piece.index === segments.length
                              ? pieDonutRemainderColor
                              : pieDonutColor(segments[piece.index].axis)
                          }
                          data-remainder={
                            piece.index === segments.length || undefined
                          }
                          data-fraction={piece.fraction}
                        />
                      </g>
                    ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MiniPieGraph: React.FC<MiniPieGraphProps> = (props) => {
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
      <MiniPieGraphView graph={props} frame={frame} scale={scale} />
    </AbsoluteFill>
  );
};
