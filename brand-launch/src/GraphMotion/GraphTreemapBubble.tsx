import { miniBubbleColor } from "../../../src/components/system/plating/MiniBubbleChart";
import MiniTreemapChart from "../../../src/components/system/plating/MiniTreemapChart";
import { FoodIcon } from "../FoodIcons/FoodIcon";
import { foodIcons } from "../FoodIcons/catalog";
import { COLOR_TOKENS } from "../../../src/constants/uiColorTokens";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import {
  TREEMAP_BUBBLE_TIMING,
  transitionTreemapItems,
  transitionBubbleItems,
  treemapBubbleTransitionPose,
} from "./treemap-bubble-transition";

export const GraphTreemapBubbleView = ({
  frame,
  scale = 1,
}: {
  frame: number;
  scale?: number;
  fps?: number;
}) => {
  if (frame <= TREEMAP_BUBBLE_TIMING.start) {
    return (
      <div
        data-graph="graph-transition"
        data-frame={frame}
        data-phase="treemap-hold"
        style={{ width: 132 * scale, height: 56 * scale }}
      >
        <div
          style={{
            width: 132,
            height: 56,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
          }}
        >
          <MiniTreemapChart items={transitionTreemapItems} />
        </div>
      </div>
    );
  }
  const finished = frame >= TREEMAP_BUBBLE_TIMING.settled;
  const cells = treemapBubbleTransitionPose(frame);
  // Draw disappearing cells first so a tiny remnant cannot cover a survivor.
  const ordered = [...cells].sort(
    (a, b) => Number(a.selected) - Number(b.selected),
  );
  return (
    <svg
      width={132 * scale}
      height={56 * scale}
      viewBox="0 0 132 56"
      style={{ display: "block", overflow: "visible" }}
      role="img"
      data-graph="graph-transition"
      data-frame={frame}
      data-phase={
        finished
          ? "bubble-hold"
          : frame < TREEMAP_BUBBLE_TIMING.roundEnd
            ? "treemap-shorten"
            : frame < TREEMAP_BUBBLE_TIMING.dropEnd
              ? "bubble-roll-and-drop"
              : "bubble-rebound"
      }
      aria-label={`합성 전환: ${transitionBubbleItems.map((item) => `${TASTE_TOKENS[item.axis].label} ${item.value}`).join(", ")}의 셀이 기본 음식 아이콘 버블로 변합니다`}
    >
      {ordered
        .filter((cell) => cell.visible)
        .map((cell) => (
          <g
            key={cell.item.id}
            data-treemap-index={cell.index}
            data-axis={cell.item.axis}
            data-value={cell.item.value}
            data-motion-phase={cell.phase}
          >
            {finished ? (
              <circle
                data-mark="settled-bubble"
                cx={cell.cx}
                cy={cell.cy}
                r={cell.radius}
                fill={miniBubbleColor(cell.item.axis)}
              />
            ) : (
              <rect
                data-mark={
                  cell.selected
                    ? "morphing-bubble"
                    : "disappearing-treemap-cell"
                }
                x={cell.cx - cell.width / 2}
                y={cell.cy - cell.height / 2}
                width={cell.width}
                height={cell.height}
                rx={cell.radius}
                fill={miniBubbleColor(cell.item.axis)}
                transform={
                  cell.rotation
                    ? `rotate(${cell.rotation} ${cell.cx} ${cell.cy})`
                    : undefined
                }
              />
            )}
            {cell.numberOpacity > 0 && (
              <text
                x={cell.cx}
                y={cell.cy}
                textAnchor="middle"
                dominantBaseline="central"
                aria-hidden="true"
                fontSize={cell.numberSize}
                fontWeight={500}
                fill={COLOR_TOKENS.text.primary}
                opacity={cell.numberOpacity}
                style={{
                  fontFamily: "Pretendard, sans-serif",
                  fontVariantNumeric: "tabular-nums",
                  pointerEvents: "none",
                }}
              >
                {cell.item.value}
              </text>
            )}
            {cell.dishKindId && cell.iconOpacity > 0 && (
              <g
                data-dish-kind={cell.dishKindId}
                transform={`translate(${cell.cx - cell.iconSize / 2}, ${cell.cy - cell.iconSize / 2})`}
                opacity={cell.iconOpacity}
                style={{ color: COLOR_TOKENS.text.primary }}
                aria-hidden="true"
              >
                <FoodIcon
                  icon={foodIcons.find((icon) => icon.id === cell.dishKindId)!}
                  size={cell.iconSize}
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
