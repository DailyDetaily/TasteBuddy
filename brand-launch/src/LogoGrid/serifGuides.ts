import { ramp } from "./motion";
import type { GridVariant } from "./layerTiming";
import {
  getWordmarkEntryStart,
  getWordmarkFillProgress,
} from "./wordmarkMotion";

// Circles fitted to the rounded terminal contours of the source SVG.
// Order within each glyph matches wordmarkTerminals.ts. These are construction
// overlays, not replacements for the source paths or the fill's starting points.
const circles: Record<number, readonly (readonly [number, number, number])[]> =
  {
    2: [
      [440.748, 176.082, 2.779],
      [511.459, 176.082, 2.779],
      [461.5, 240, 2.75],
      [490.7, 240, 2.85],
    ],
    3: [
      [501.212, 198.469, 5.558],
      [548.199, 234.491, 2.257],
    ],
    4: [
      [544.75, 224.906, 2.742],
      [580.025, 197.589, 2.534],
    ],
    5: [
      [593.597, 165.457, 3.556],
      [577.891, 185.297, 2.608],
      [614.031, 184.98, 3.268],
      [615.74, 229.515, 2.453],
    ],
    6: [[660.03, 225.129, 2.522]],
    7: [
      [461.5, 258, 2.75],
      [461.6, 337, 2.9],
      [488.133, 295.753, 2.413],
    ],
    8: [
      [521.208, 284.918, 2.312],
      [560.1, 284.925, 2.417],
      [586.685, 331.766, 2.289],
    ],
    9: [
      [615, 258, 2.75],
      [642.886, 331.647, 2.358],
    ],
    10: [
      [671, 258, 2.75],
      [698.629, 331.647, 2.358],
    ],
    11: [
      [687.113, 281.31, 2.515],
      [711.123, 281.386, 2.427],
      [729.995, 281.315, 2.488],
      [751.514, 281.327, 2.496],
      [693.75, 360.65, 5.3],
    ],
  };

// Reuse the four original circles. Their original internal labels (51, 73)
// remain in the source geometry but are omitted from both rendered timelines.
const sourceCircles: Record<string, number> = {
  "2-2": 1,
  "7-0": 52,
  "9-0": 53,
  "10-0": 54,
};
type SerifGuide = {
  id: string;
  glyphIndex: number;
  terminalIndex: number;
  cx: number;
  cy: number;
  r: number;
  sourceCircleIndex?: number;
};
const guides: SerifGuide[] = [];
for (const [glyph, terminals] of Object.entries(circles)) {
  terminals.forEach(([cx, cy, r], terminalIndex) => {
    const id = `${glyph}-${terminalIndex}`;
    guides.push({
      id,
      glyphIndex: Number(glyph),
      terminalIndex,
      cx,
      cy,
      r,
      sourceCircleIndex: sourceCircles[id],
    });
  });
}
export const serifGuides = guides.sort((a, b) => a.cx - b.cx || a.cy - b.cy);

export const SERIF_GUIDE_STROKE_WIDTH = 0.5;

export const getSerifGuideLabel = (radius: number) => {
  // Match the source's nominal outside diameter: r=2.75 is labeled "6".
  const diameter = Math.round(radius * 2 + SERIF_GUIDE_STROKE_WIDTH);
  const text = String(diameter);
  const fontSize =
    ((radius * 2 - 0.9) * 0.92) / Math.hypot(0.62 * text.length, 0.78);
  return { text, diameter, fontSize };
};

// One label per size, on the leftmost circle across both rows. Equal x values
// use the upper circle, matching serifGuides' stable visual ordering.
export const serifGuideLabelIds = new Set<string>();
const labeledDiameters = new Set<number>();
for (const guide of serifGuides) {
  const { diameter } = getSerifGuideLabel(guide.r);
  if (labeledDiameters.has(diameter)) continue;
  labeledDiameters.add(diameter);
  serifGuideLabelIds.add(guide.id);
}

// Share each glyph's exact entry clock and easing, with no separate lead or
// sweep. The existing Taste/Buddy order and two-frame letter stagger drive both.
export const getSerifGuideWindow = (variant: GridVariant) => ({
  from: getWordmarkEntryStart(2, variant),
  end: variant === "classic" ? 272 : 246,
});

export const getSerifGuideStart = (guide: SerifGuide, variant: GridVariant) =>
  getWordmarkEntryStart(guide.glyphIndex, variant);

export const getSerifGuideOpacity = (
  frame: number,
  guide: SerifGuide,
  variant: GridVariant,
) => {
  const exit = variant === "classic" ? [259, 272] : [225, 246];
  return (
    getWordmarkFillProgress(frame, guide.glyphIndex, variant) *
    (1 - ramp(frame, exit[0], exit[1]))
  );
};
