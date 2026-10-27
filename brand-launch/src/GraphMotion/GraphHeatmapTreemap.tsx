import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { COLOR_TOKENS } from "../../../src/constants/uiColorTokens";
import { miniHeatmapColor } from "../../../src/components/system/plating/MiniHeatmap";
import { miniBubbleColor } from "../../../src/components/system/plating/MiniBubbleChart";
import MiniTreemapChart, {
  miniTreemapLabelFontSize,
} from "../../../src/components/system/plating/MiniTreemapChart";
import type { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import {
  heatmapTreemapTransitionPose,
  HEATMAP_TREEMAP_TIMING,
} from "./heatmap-treemap-transition";
import { miniTreemapItems } from "./mini-treemap-motion";
import { miniTreemapDefaultProps } from "./mini-treemap-settings";
import type { GraphTransitionProps } from "./graph-transition-settings";

const items = miniTreemapItems(miniTreemapDefaultProps);
const joinedColor = miniHeatmapColor(null);
const mixColor = (from: string, to: string, progress: number) =>
  progress <= 0
    ? from
    : progress >= 1
      ? to
      : `color-mix(in srgb, ${from} ${(1 - progress) * 100}%, ${to} ${progress * 100}%)`;

export const GraphHeatmapTreemapView = ({
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
  const pose = heatmapTreemapTransitionPose(frame, graph, bars);
  const axis =
    TASTE_IDS.find((id) => TASTE_TOKENS[id].label === graph.데이터[0].미각) ??
    "umami";
  if (frame >= HEATMAP_TREEMAP_TIMING.settled)
    return (
      <div
        data-graph="graph-transition"
        data-frame={frame}
        data-phase={pose.phase}
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
          <MiniTreemapChart items={items} />
        </div>
      </div>
    );
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
      aria-label="합성 전환: 큰 트리맵 블록일수록 더 많은 히트맵 셀이 합쳐집니다"
    >
      {pose.groups.map((group) => (
        <g
          key={group.index}
          data-merge-group={group.index}
          data-tile-count={group.count}
          data-value={group.value}
        >
          {group.progress === 0 ? (
            pose.tiles
              .filter((tile) => tile.group === group.index)
              .map((tile) => (
                <rect
                  key={tile.slot}
                  data-mark="merging-cell"
                  data-slot={tile.slot}
                  x={tile.x}
                  y={tile.y}
                  width={tile.width}
                  height={tile.height}
                  rx={tile.radius}
                  fill={mixColor(
                    miniHeatmapColor(tile.padding ? null : tile.level, axis),
                    joinedColor,
                    tile.progress,
                  )}
                />
              ))
          ) : group.progress < 1 ? (
            <path
              data-mark="merging-region"
              d={group.path}
              fill={joinedColor}
            />
          ) : (
            <rect
              data-mark="merged-block"
              x={group.x}
              y={group.y}
              width={group.width}
              height={group.height}
              rx={group.radius}
              fill={mixColor(
                joinedColor,
                miniBubbleColor(items[group.index].axis),
                pose.shape,
              )}
            />
          )}
          {pose.label > 0 && (
            <text
              x={group.x + group.width / 2}
              y={group.y + group.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              aria-hidden="true"
              fontSize={miniTreemapLabelFontSize(
                group.value,
                group.width,
                group.height,
              )}
              fontWeight={500}
              fill={COLOR_TOKENS.text.primary}
              opacity={pose.label}
              style={{
                fontFamily: "Pretendard, sans-serif",
                fontVariantNumeric: "tabular-nums",
                pointerEvents: "none",
              }}
            >
              {group.value}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};
