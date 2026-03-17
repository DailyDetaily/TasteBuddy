import { LAYOUT_TOKENS } from '../../constants/designTokens';

export const TASTE_CIRCULAR_LOOP_LAYOUT = {
  center: LAYOUT_TOKENS.tasteLoopSize / 2,
  guideDotDiameter: LAYOUT_TOKENS.tasteLoopGuideDotDiameter,
  guideDotGap: LAYOUT_TOKENS.tasteLoopGuideDotGap,
  guideRadius: LAYOUT_TOKENS.tasteLoopGuideRadius,
  labelOffset: LAYOUT_TOKENS.tasteLoopLabelOffset,
  nodeRadius: LAYOUT_TOKENS.tasteLoopNodeRadius,
  outerRingInset: LAYOUT_TOKENS.tasteLoopOuterRingInset,
  outerRingThickness: LAYOUT_TOKENS.tasteLoopOuterRingThickness,
  ringRadius: LAYOUT_TOKENS.tasteLoopRingRadius,
  size: LAYOUT_TOKENS.tasteLoopSize,
  stepCount: LAYOUT_TOKENS.tasteLoopStepCount,
} as const;
