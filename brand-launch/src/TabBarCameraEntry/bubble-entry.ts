import catalog from "./feedback-catalog";
import {
  nativeSheetSpring,
  nativeVeilOpacity,
} from "../TasteBubbleMapMotion/native-spring";

// TasteExperienceMapEngine.introDelays: six primary tastes first, then
// the remaining bubbles ordered by distance and angle from the map center.
const primary = [...new Set(catalog.bubbles.map((b) => b.axis))].map(
  (axis) => catalog.bubbles.find((b) => b.axis === axis)!,
);
const primaryIDs = new Set(primary.map((b) => b.id));
const outer = catalog.bubbles
  .filter((b) => !primaryIDs.has(b.id))
  .sort(
    (a, b) =>
      Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) ||
      Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x),
  );
export const bubbleIntroDelays = Object.fromEntries([
  ...primary.map((b, i) => [b.id, 0.18 + i * 0.06]),
  ...outer.map((b, i) => [b.id, 0.5 + (i / (outer.length - 1)) * 0.3]),
]) as Record<string, number>;
export const bubbleEntry = (id: string, seconds: number) => {
  const response = nativeSheetSpring(seconds - bubbleIntroDelays[id]);
  return {
    opacity: Math.max(0, Math.min(1, response)),
    scale: 0.72 + 0.28 * response,
  };
};
export { nativeVeilOpacity };
