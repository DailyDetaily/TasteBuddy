/** The existing Remotion module is the exact TypeScript counterpart of
 * ios/TasteBuddy/Components/TasteMotionView.swift. Keep one geometry source. */
import {
  analysisCircle, analysisLineColorIndex, analysisLineOpacity, analysisPoints,
  feedbackMorph, feedbackPaths, feedbackRings, feedbackTransitionDuration,
  motionPoints, palette, type Point,
} from '../../../brand-launch/src/taste-motion';

export type NativeOnboardingMotionStyle = 'analysis' | 'rotatingLayers' | 'feedbackRings';
export const onboardingPalette = palette;
export const reducedMotionTime = (style: NativeOnboardingMotionStyle) => style === 'feedbackRings' ? feedbackTransitionDuration : 0;
export interface OnboardingStroke { points: Point[]; color: number; opacity: number }
export function onboardingMotionFrame(style: NativeOnboardingMotionStyle, time: number) {
  const strokes: OnboardingStroke[] = [];
  if (style === 'analysis') {
    const circle = analysisCircle(time), points = analysisPoints(circle);
    for (let index = 0; index < points.length / 2; index++) strokes.push({ points: points.slice(index * 2, index * 2 + 2), color: analysisLineColorIndex(index, circle.lineDensity), opacity: analysisLineOpacity(index, circle.lineDensity) });
  } else if (style === 'rotatingLayers') {
    // TasteMotionView's actual defaults are six layers and twelve rays.
    const points = motionPoints(style, time, 6, 12);
    for (let index = 0; index < points.length / 2; index++) strokes.push({ points: points.slice(index * 2, index * 2 + 2), color: index % 6, opacity: 1 });
  } else {
    const morph = feedbackMorph(time);
    if (morph.bend === 1) return { strokes, rings: feedbackRings(time), gradientBlend: 1 };
    feedbackPaths(time, 12).forEach((points, index) => strokes.push({ points, color: index % 6, opacity: 1 }));
    return { strokes, rings: [], gradientBlend: morph.gradientBlend };
  }
  return { strokes, rings: [], gradientBlend: 0 };
}
