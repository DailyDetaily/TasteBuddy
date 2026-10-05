import { logoGridElements } from "./geometry";
import { introCircles, INTRO_GUIDE_HANDOFF_END } from "./dynamicMotion";
import { orbitAngles } from "./motion";
import { getWordmarkEntryStart } from "./wordmarkMotion";
import { classicStackCircles } from "./circleGuideMotion";

export type GridVariant = "classic" | "dynamic";

// Immutable source windows. Editable JSX `from` values move these animations
// on the timeline without changing their original easing or camera timebase.
export const getGridLayerWindow = (index: number, variant: GridVariant) => {
  const node = logoGridElements[index];
  if (variant === "classic") {
    if (node.role === "logo.symbol") return { from: 18, end: 258 };
    if (node.role === "logo.wordmark")
      return { from: getWordmarkEntryStart(index, variant), end: 229 };
    const stackCircle = classicStackCircles.find(
      (circle) => circle.circleIndex === index || circle.labelIndex === index,
    );
    if (stackCircle) return { from: stackCircle.start, end: 276 };
    if (orbitAngles[index] !== undefined)
      return { from: Math.floor(37 + orbitAngles[index] / 120), end: 260 };
    if (node.role === "guide.grid") return { from: 24, end: 272 };
    if (node.role === "guide.circles") return { from: 30, end: 272 };
    return { from: 31, end: 270 };
  }
  if (node.role === "logo.symbol") return { from: 54, end: 300 };
  if (node.role === "logo.wordmark")
    return {
      from: getWordmarkEntryStart(index, variant),
      end: 289,
    };
  const intro = introCircles.find(
    (c) => c.circleIndex === index || c.labelIndex === index,
  );
  if (intro)
    return {
      from: intro.start,
      end:
        index === 25 || intro.circleIndex === 35
          ? 246
          : INTRO_GUIDE_HANDOFF_END,
    };
  if (orbitAngles[index] !== undefined)
    return { from: Math.floor(87 + (orbitAngles[index] / 30) * 0.8), end: 246 };
  if (node.role === "guide.grid")
    return {
      from: [61, 62].includes(index)
        ? 108
        : [67, 68, 69, 70].includes(index)
          ? 126
          : 185,
      end: 246,
    };
  return {
    from:
      index === 72
        ? 107
        : [0, 1, 16, 51, 52, 53, 54, 73].includes(index)
          ? 133
          : 189 + (index % 4) * 2,
    end: 246,
  };
};

// GridScene isolates this stack from the composition background. The negative
// symbol plane contains both the flat SVG and its 3D bloom/fold descendants;
// no transformed petal can composite in front of a construction guide.
export const gridLayerZIndex = (index: number) =>
  logoGridElements[index].role === "logo.symbol" ? -1 : index + 1;
