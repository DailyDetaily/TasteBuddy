import { roundedLineMarkers } from "../../../src/components/system/roundedLinePath";
import { miniChartGeometry } from "../../../src/components/system/plating/miniChartGeometry";
import { miniLineGeometry, MINI_LINE } from "./mini-line-motion";
import { GRAPH_FPS } from "./motion";
import {
  pointOnRoundedTrack,
  roundedLineTrack,
  roundedTrackDistanceAtX,
} from "./rounded-line-track";
import {
  graphTransitionLineProps,
  GRAPH_TRANSITION_BLANK_FRAMES,
  GRAPH_TRANSITION_HOLD_FRAMES,
  type GraphTransitionProps,
} from "./graph-transition-settings";

const gatherStart =
  GRAPH_TRANSITION_BLANK_FRAMES +
  1.2 * GRAPH_FPS +
  GRAPH_TRANSITION_HOLD_FRAMES;
export const TRANSITION_TIMING = {
  gatherStart,
  gatherEnd: gatherStart + 28,
  splitStart: gatherStart + 28,
  splitEnd: gatherStart + 58,
  dropStart: gatherStart + 58,
  dropStagger: 1.25,
  gravity: 0.12,
  currentNodeFallFrames: 0.41 * GRAPH_FPS,
  bounceFrames: 14,
  bounceHeightRatio: 0.085,
  maximumBounceHeight: 3.2,
  growStart: gatherStart + 108,
  growFrames: 42,
  growStagger: 2,
  settled: gatherStart + 162,
} as const;
export const TRANSITION_LAST_BAR_HEIGHT = 48;

/** Motion-specimen height override: preserve the product's other bars and
 * zero/one marks; the last extended bar gives the dark node a 36px drop.
 */
export const graphTransitionBarGeometry = (props: GraphTransitionProps) =>
  miniChartGeometry(props["막대 기록"]).map((bar, index, bars) =>
    index === bars.length - 1 && props["막대 기록"][index] > 1
      ? {
          ...bar,
          height: TRANSITION_LAST_BAR_HEIGHT,
          y: MINI_LINE.height - TRANSITION_LAST_BAR_HEIGHT,
        }
      : bar,
  );
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const transitionEase = (value: number) => {
  const t = clamp(value);
  return clamp(t ** 3 * (t * (6 * t - 15) + 10));
};
const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress;

export const graphTransitionPose = (
  frame: number,
  props: GraphTransitionProps,
) => {
  const line = miniLineGeometry(graphTransitionLineProps(props))[0];
  if (!line || line.points.length < 2) return null;
  const track = roundedLineTrack(line.points, MINI_LINE.trackWidth / 2);
  // Six seeds are cut from the backdrop; they are not extra observations.
  const seedDistances = Array.from({ length: 7 }, (_, index) => {
    if (index === 6) return track.length;
    const x = lerp(line.points[0].x, line.current.x, index / 6);
    return roundedTrackDistanceAtX(track, x);
  });
  const seedOrigins = seedDistances.map((distance) =>
    pointOnRoundedTrack(track, distance),
  );
  const bars = graphTransitionBarGeometry(props);
  const t = TRANSITION_TIMING;
  const gather = transitionEase(
    (frame - t.gatherStart) / (t.gatherEnd - t.gatherStart),
  );
  const split = transitionEase(
    (frame - t.splitStart) / (t.splitEnd - t.splitStart),
  );
  const thin = { from: track.length * gather, to: track.length };
  // Every history dot advances by the same arc length, so its spacing is
  // preserved until it reaches the stationary right node and is absorbed.
  const historyDistances = track.distances
    .slice(0, -1)
    .map((distance) => distance + track.length * gather);
  const history =
    gather === 0
      ? roundedLineMarkers(line.points, MINI_LINE.trackWidth).slice(0, -1)
      : historyDistances.map((distance) =>
          pointOnRoundedTrack(track, distance),
        );
  const chunks = seedOrigins.slice(0, 6).map((_, index) => {
    const center = seedDistances[index];
    const from = index === 0 ? 0 : (seedDistances[index - 1] + center) / 2;
    const to =
      index === 5 ? track.length : (center + seedDistances[index + 1]) / 2;
    return { from: lerp(from, center, split), to: lerp(to, center, split) };
  });
  const seeds = seedOrigins.map((origin, index) => {
    const bar = bars[index];
    const radius = MINI_LINE.trackWidth / 2;
    const groundY = MINI_LINE.height - radius;
    const fallDistance = Math.max(0, groundY - origin.y);
    const fallFrames =
      index === 6 && fallDistance > 0
        ? t.currentNodeFallFrames
        : Math.sqrt((2 * fallDistance) / t.gravity);
    const elapsed = frame - t.dropStart - index * t.dropStagger;
    const landingFrame = t.dropStart + index * t.dropStagger + fallFrames;
    const dropProgress =
      fallFrames > 0 ? clamp(elapsed / fallFrames) : Number(elapsed >= 0);
    const bounceAge = frame - landingFrame;
    const bouncing = bounceAge > 0 && bounceAge < t.bounceFrames;
    // The actual drop height controls impact: higher seeds rebound slightly more.
    const bounceHeight = Math.min(
      t.maximumBounceHeight,
      fallDistance * t.bounceHeightRatio,
    );
    const hop = bouncing
      ? bounceHeight * Math.sin((Math.PI * bounceAge) / t.bounceFrames)
      : 0;
    const cx = lerp(
      origin.x,
      bar.x + bar.width / 2,
      transitionEase(dropProgress),
    );
    const cy =
      elapsed < 0
        ? origin.y
        : elapsed < fallFrames
          ? index === 6
            ? origin.y + fallDistance * (elapsed / fallFrames) ** 2
            : origin.y + 0.5 * t.gravity * elapsed ** 2
          : groundY - hop;
    const grow = transitionEase(
      (frame - t.growStart - index * t.growStagger) / t.growFrames,
    );
    const growing = frame >= t.growStart + index * t.growStagger;
    const height = growing ? lerp(bar.width, bar.height, grow) : radius * 2;
    const x = growing ? bar.x : cx - radius;
    const y = growing ? MINI_LINE.height - height : cy - radius;
    const r = Math.min(bar.width, height) / 2;
    return {
      index,
      origin,
      landingFrame,
      bounceHeight,
      grow,
      x,
      y,
      width: bar.width,
      height,
      radius: r,
      cx: x + bar.width / 2,
      cy: y + r,
      fromCurrentNode: index === 6,
    };
  });
  return {
    line,
    track,
    bars,
    gather,
    split,
    thin,
    history,
    historyDistances,
    chunks,
    seeds,
  };
};
