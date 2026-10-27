import { miniTreemapGeometry } from "../../../src/components/system/plating/miniTreemapGeometry";
import { miniBubbleGeometry } from "../../../src/components/system/plating/miniBubbleGeometry";
import { miniTreemapLabelFontSize } from "../../../src/components/system/plating/MiniTreemapChart";
import { HEATMAP_TREEMAP_TIMING } from "./heatmap-treemap-transition";
import { miniTreemapItems } from "./mini-treemap-motion";
import { miniTreemapDefaultProps } from "./mini-treemap-settings";
import { GRAPH_TRANSITION_HOLD_FRAMES } from "./graph-transition-settings";
import {
  BUBBLE_TIMING,
  BUBBLE_OVERSHOOT,
  BUBBLE_PEAK_PROGRESS,
  miniBubbleEnterProgress,
} from "./mini-bubble-motion";

const start = HEATMAP_TREEMAP_TIMING.end;
export const TREEMAP_BUBBLE_TIMING = {
  start,
  disappear: start + 30,
  roundEnd: start + 18,
  dropEnd: start + 36,
  sweetRollStart: start + 18,
  sweetRollEnd: start + 32,
  bitterBounceEnd: start + 48,
  growStart: {
    bitter: start + 52,
    sweet: start + 32,
    umami: start + 48,
  },
  settled: start + 52 + BUBBLE_TIMING.grow,
  end: start + 52 + BUBBLE_TIMING.grow + GRAPH_TRANSITION_HOLD_FRAMES,
} as const;
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
};
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

export const transitionTreemapItems = miniTreemapItems(miniTreemapDefaultProps);
// Illustrative icons for this synthetic sequence, not inferred dish records.
const icons = {
  bitter: "stir_fried_wok",
  sweet: "dessert",
  umami: "beverage_pairing",
};
export const transitionBubbleItems = transitionTreemapItems
  .filter((item) => Object.hasOwn(icons, item.axis))
  .map((item) => ({
    ...item,
    dishKindId: icons[item.axis as keyof typeof icons],
  }));
const cells = miniTreemapGeometry(
  transitionTreemapItems.map((item) => item.value),
);
const circles = miniBubbleGeometry(
  transitionBubbleItems.map((item) => item.value),
);
const left = Math.min(...circles.map((circle) => circle.cx - circle.radius));
const right = Math.max(...circles.map((circle) => circle.cx + circle.radius));
// Match the centered presentation in the individual bubble composition.
export const transitionBubbleOffsetX = (132 - left - right) / 2;

const smallCircles = cells.map((cell) => {
  const axis = transitionTreemapItems[cell.index].axis;
  return {
    cx:
      axis === "bitter"
        ? cell.x + cell.radius
        : axis === "sweet"
          ? cell.x + cell.width - cell.radius
          : cell.x + cell.width / 2,
    cy: axis === "umami" ? cell.y + cell.radius : cell.y + cell.height / 2,
    radius: cell.radius,
  };
});
const floor = 56;
const fallFrames =
  TREEMAP_BUBBLE_TIMING.dropEnd - TREEMAP_BUBBLE_TIMING.roundEnd;
const farthestDrop = Math.max(
  ...smallCircles.map((circle, i) =>
    Object.hasOwn(icons, transitionTreemapItems[i].axis)
      ? floor - circle.radius - circle.cy
      : 0,
  ),
);
const gravity = (2 * farthestDrop) / fallFrames ** 2;

export const treemapBubbleTransitionPose = (frame: number) => {
  const t = TREEMAP_BUBBLE_TIMING;
  const elapsed = frame - start;
  const leaving = 1 - ease((frame - t.roundEnd) / (t.disappear - t.roundEnd));
  const round = ease(elapsed / (t.roundEnd - start));
  const fall = Math.max(0, frame - t.roundEnd);
  return cells.map((cell) => {
    const item = transitionTreemapItems[cell.index];
    const order = transitionBubbleItems.findIndex(
      (bubble) => bubble.id === item.id,
    );
    const selected = order >= 0;
    const small = smallCircles[cell.index];
    const target = circles[order];
    const sourceCx = cell.x + cell.width / 2;
    const sourceCy = cell.y + cell.height / 2;
    const growStart = selected
      ? t.growStart[item.axis as keyof typeof t.growStart]
      : t.settled;
    const localFrame = frame - growStart;
    const local = localFrame / BUBBLE_TIMING.grow;
    const growth = miniBubbleEnterProgress(local);
    const growthBlend =
      local >= BUBBLE_PEAK_PROGRESS ? 1 : growth / (1 + BUBBLE_OVERSHOOT);
    // First shorten the long axis into a circle, then shrink that circle.
    // Fat contracts horizontally; sour/salty contract vertically, at center.
    let width = mix(cell.width, small.radius * 2, round) * leaving,
      height = mix(cell.height, small.radius * 2, round) * leaving;
    let cx = sourceCx,
      cy = sourceCy;
    let rotation = 0;
    let phase = selected || frame < t.roundEnd ? "shorten" : "circle-shrink";
    if (selected) {
      width = mix(cell.width, small.radius * 2, round);
      height = mix(cell.height, small.radius * 2, round);
      cx =
        item.axis === "bitter"
          ? cell.x + width / 2
          : item.axis === "sweet"
            ? cell.x + cell.width - width / 2
            : sourceCx;
      cy = item.axis === "umami" ? cell.y + height / 2 : sourceCy;
      if (frame >= t.roundEnd) {
        cy = Math.min(
          floor - small.radius,
          small.cy + (gravity * fall * fall) / 2,
        );
        phase = cy + small.radius < floor ? "drop" : "ground-settle";
      }
      if (item.axis === "sweet" && frame >= t.sweetRollStart) {
        const roll = ease(
          (frame - t.sweetRollStart) / (t.sweetRollEnd - t.sweetRollStart),
        );
        cx += (target.cx + transitionBubbleOffsetX - small.cx) * roll;
        // Rotate only after the horizontal capsule has become a full circle.
        const radians = (cx - small.cx) / small.radius;
        rotation = (radians * 180) / Math.PI;
        const contact = mix(
          cell.y + cell.height,
          floor,
          ease((frame - t.sweetRollStart) / 6),
        );
        cy = contact - small.radius;
        phase = "roll";
      }
      if (
        item.axis === "bitter" &&
        frame >= t.dropEnd &&
        frame < t.bitterBounceEnd
      ) {
        const bounceFrames = t.bitterBounceEnd - t.dropEnd;
        const bounceTime = frame - t.dropEnd;
        const reboundVelocity = (gravity * bounceFrames) / 2;
        cy =
          floor -
          small.radius -
          reboundVelocity * bounceTime +
          (gravity * bounceTime ** 2) / 2;
        phase = "ground-bounce";
      }
      if (frame >= growStart) {
        const radius =
          small.radius * (1 - growthBlend) + target.radius * growth;
        width = height = radius * 2;
        const flight = Math.max(0, Math.min(1, local));
        const move = ease(flight);
        // A single upward rebound, with zero velocity at launch and settling.
        const lift = 8 * 64 * flight ** 3 * (1 - flight) ** 3;
        const launchX =
          item.axis === "sweet"
            ? target.cx + transitionBubbleOffsetX
            : small.cx;
        cx = mix(launchX, target.cx + transitionBubbleOffsetX, move);
        cy = mix(floor - small.radius, target.cy, move) - lift;
        phase = local >= 1 ? "settled" : "grow-and-rise";
      }
    }
    return {
      index: cell.index,
      item,
      selected,
      order,
      growth,
      round,
      growStart,
      rotation,
      phase,
      visible: selected || leaving > 0,
      cx,
      cy,
      width,
      height,
      radius: Math.min(width, height) / 2,
      numberOpacity: 1 - ease(elapsed / 10),
      numberSize:
        miniTreemapLabelFontSize(cell.value, cell.width, cell.height) *
        (selected ? 1 : leaving),
      iconOpacity: selected
        ? ease(
            (localFrame - (BUBBLE_TIMING.grow * BUBBLE_PEAK_PROGRESS - 6)) / 6,
          )
        : 0,
      iconSize: target
        ? Math.min(16, target.radius * 1.2) *
          (local >= BUBBLE_PEAK_PROGRESS ? growth : 1)
        : 0,
      dishKindId: selected
        ? transitionBubbleItems[order].dishKindId
        : undefined,
    };
  });
};
