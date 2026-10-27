import { pieDonutColor } from "../../../src/components/system/plating/PieDonutChart";
import { COLOR_TOKENS } from "../../../src/constants/uiColorTokens";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import { FoodIcon } from "../FoodIcons/FoodIcon";
import { foodIcons } from "../FoodIcons/catalog";
import { GraphTreemapBubbleView } from "./GraphTreemapBubble";
import { MiniPieGraphView } from "./MiniPieGraph";
import { PIE_TIMING } from "./mini-pie-motion";
import { miniPieDefaultProps } from "./mini-pie-settings";
import {
  BUBBLE_PIE_TIMING,
  bubblePieTransitionPose,
  transitionPieSegments,
} from "./bubble-pie-transition";

export const GraphBubblePieView = ({
  frame,
  scale = 1,
  fps = 60,
}: {
  frame: number;
  scale?: number;
  fps?: number;
}) => {
  if (frame <= BUBBLE_PIE_TIMING.start)
    return <GraphTreemapBubbleView frame={frame} scale={scale} fps={fps} />;
  if (frame >= BUBBLE_PIE_TIMING.exitStart)
    return (
      <div
        data-graph="graph-transition"
        data-frame={frame}
        data-phase={
          frame >= BUBBLE_PIE_TIMING.exitEnd ? "pie-ended" : "pie-exit"
        }
        style={{
          width: 132 * scale,
          height: 56 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MiniPieGraphView
          graph={miniPieDefaultProps}
          frame={PIE_TIMING.exit + frame - BUBBLE_PIE_TIMING.exitStart}
          scale={scale}
        />
      </div>
    );
  const finished = frame >= BUBBLE_PIE_TIMING.settled;
  const pieces = bubblePieTransitionPose(frame);
  return (
    <svg
      width={132 * scale}
      height={56 * scale}
      viewBox="0 0 132 56"
      style={{ display: "block", overflow: "visible" }}
      role="img"
      data-graph="graph-transition"
      data-frame={frame}
      data-phase={finished ? "pie-hold" : "bubble-to-pie"}
      aria-label={`합성 전환: ${transitionPieSegments.map((item, i) => `${TASTE_TOKENS[item.axis].label}은 ${["오른쪽", "왼쪽 아래", "왼쪽 위"][i]}`).join(", ")} 파이 조각으로 변합니다`}
    >
      {pieces.map((piece) => (
        <g key={piece.axis} data-axis={piece.axis}>
          <g
            transform={`translate(${piece.cx - piece.radius} ${piece.cy - piece.radius}) scale(${piece.pathScale})`}
          >
            <path
              data-mark={finished ? "settled-pie" : "narrowing-bubble"}
              data-fraction={piece.fraction}
              d={piece.path}
              fill={pieDonutColor(piece.axis)}
              transform={
                piece.pathRotation
                  ? `rotate(${piece.pathRotation} 92 92)`
                  : undefined
              }
            />
          </g>
          {piece.iconOpacity > 0 && (
            <g
              transform={`translate(${piece.cx - piece.iconSize / 2} ${piece.cy - piece.iconSize / 2})`}
              opacity={piece.iconOpacity}
              style={{ color: COLOR_TOKENS.text.primary }}
              aria-hidden="true"
            >
              <FoodIcon
                icon={foodIcons.find((icon) => icon.id === piece.dishKindId)!}
                size={piece.iconSize}
                animate={false}
                motion={{ 재생: "정지", "모션 속도": 1, "모션 강도": 1 }}
              />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};
