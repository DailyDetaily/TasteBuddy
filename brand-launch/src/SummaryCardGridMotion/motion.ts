import { referenceEase } from "../GraphMotion/reference-motion";
import { summaryCardExamples } from "./catalog";
import { SUMMARY_GRID_FPS, type SummaryCardGridProps } from "./settings";

export const summaryGridTiming = (props: SummaryCardGridProps) => {
  const stagger = Math.round(props["카드 시차"] * SUMMARY_GRID_FPS);
  const lastDelay = (summaryCardExamples.length - 1) * stagger;
  const settled = Math.max(
    ...summaryCardExamples.map((card, i) => card.settle + i * stagger),
  );
  const exitStart = settled + Math.round(props["정지 시간"] * SUMMARY_GRID_FPS);
  const fold = Math.round(0.32 * SUMMARY_GRID_FPS);
  return {
    stagger,
    unfold: Math.round(0.48 * SUMMARY_GRID_FPS),
    settled,
    exitStart,
    fold,
    durationInFrames:
      props.재생 === "전체 모션"
        ? exitStart + lastDelay + fold + 12
        : exitStart + 1,
  };
};

export const summaryGridCardPose = (
  frame: number,
  index: number,
  props: SummaryCardGridProps,
) => {
  const timing = summaryGridTiming(props);
  const localFrame = frame - index * timing.stagger;
  if (props.재생 === "정지")
    return { localFrame: 0, visible: true, rotateX: 0 };
  const entrance = referenceEase(localFrame / timing.unfold);
  const exit =
    props.재생 === "전체 모션"
      ? referenceEase((localFrame - timing.exitStart) / timing.fold)
      : 0;
  return {
    localFrame,
    visible: localFrame > 0 && exit < 1,
    rotateX: 90 * (1 - entrance) - 90 * exit,
  };
};
