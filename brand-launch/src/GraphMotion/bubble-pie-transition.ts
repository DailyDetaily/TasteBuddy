import {
  SYMBOL_DONUT,
  symbolDonutGeometry,
} from "../../../src/components/system/plating/symbolDonutGeometry";
import { miniPieDefaultProps } from "./mini-pie-settings";
import { PIE_TIMING, pieEaseInOut } from "./mini-pie-motion";
import {
  GRAPH_TRANSITION_BLANK_FRAMES,
  GRAPH_TRANSITION_HOLD_FRAMES,
} from "./graph-transition-settings";
import {
  TREEMAP_BUBBLE_TIMING,
  treemapBubbleTransitionPose,
} from "./treemap-bubble-transition";

const start = TREEMAP_BUBBLE_TIMING.end;
const exitStart = start + 66 + GRAPH_TRANSITION_HOLD_FRAMES;
export const BUBBLE_PIE_TIMING = {
  start,
  iconFadeEnd: start + 9,
  morphStart: start,
  shapeEnd: start + 48,
  settled: start + 66,
  exitStart,
  exitEnd: exitStart + PIE_TIMING.end - PIE_TIMING.exit,
  end:
    exitStart +
    PIE_TIMING.end -
    PIE_TIMING.exit +
    GRAPH_TRANSITION_BLANK_FRAMES,
} as const;
export const TRANSITION_PIE_CENTER = { x: 66, y: 28 };
// Reuse the individual pie's exact specimen proportions and continue each
// bubble's category color. These independent synthetic values are not a re-count
// or normalization of the preceding bubbles' 3 / 8 / 18 records.
export const transitionPieSegments = miniPieDefaultProps.데이터.map(
  (item, index) => ({
    id: `transition-pie-${index}`,
    axis: (["umami", "sweet", "bitter"] as const)[index],
    value: item.값,
  }),
);
export const transitionPieTargets = symbolDonutGeometry(
  transitionPieSegments.map((item) => item.value),
);
const source = treemapBubbleTransitionPose(start).filter(
  (cell) => cell.selected,
);
const tau = 2 * Math.PI;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Original circular/angular shrink, with a bounded inner tangent arc. */
export function bubblePieTransitionPose(frame: number) {
  const t = BUBBLE_PIE_TIMING;
  const progress = pieEaseInOut(
    (frame - t.morphStart) / (t.shapeEnd - t.morphStart),
  );
  const iconOpacity =
    1 - pieEaseInOut((frame - start) / (t.iconFadeEnd - start));
  const move = pieEaseInOut((frame - start - 14) / (t.settled - start - 14));
  const verticalMove = pieEaseInOut((frame - start) / (t.settled - start));
  return source.map((bubble) => {
    const index = transitionPieSegments.findIndex(
      (item) => item.axis === bubble.item.axis,
    );
    const target = transitionPieTargets[index];
    const targetSpan = target.endAngle - target.startAngle;
    const span = mix(tau, targetSpan, progress);
    const startAngle =
      target.index === 0 ? 0 : (target.startAngle + target.endAngle - span) / 2;
    const endAngle = startAngle + span;
    const area = mix(bubble.radius ** 2 * tau, 28 ** 2 * targetSpan, progress);
    const radius = Math.sqrt(area / span);
    const cx = mix(bubble.cx, TRANSITION_PIE_CENTER.x, move);
    const arcHeight = target.index === 2 ? -10 : target.index === 1 ? 8 : 0;
    const cy =
      TRANSITION_PIE_CENTER.y + arcHeight * Math.sin(Math.PI * verticalMove);
    const originalPath =
      progress === 1
        ? target.path
        : symbolDonutGeometry([span, tau - span], SYMBOL_DONUT.diameter / 2, {
            gapProgress: pieEaseInOut(progress / 0.18),
          })[0].path;
    return {
      axis: bubble.item.axis,
      sourceValue: bubble.item.value,
      targetValue: transitionPieSegments[index].value,
      fraction: target.fraction,
      progress,
      move,
      verticalMove,
      cx,
      cy,
      radius,
      startAngle,
      endAngle,
      path: originalPath,
      pathRotation: progress === 1 ? 0 : (startAngle * 180) / Math.PI,
      pathScale: (radius * 2) / SYMBOL_DONUT.diameter,
      iconOpacity,
      iconSize: bubble.iconSize,
      dishKindId: bubble.dishKindId!,
    };
  });
}
