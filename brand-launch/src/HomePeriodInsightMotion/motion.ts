import { referenceEase } from "../GraphMotion/reference-motion";
import type { HomePeriodMotionProps } from "./settings";

// The GIF sets the entrance timing; the completed-card hold is adjustable in Studio.
export const periodTiming = (props: HomePeriodMotionProps, fps = 30) => {
  const stagger = Math.round(props["카드 시차"] * fps);
  const lastDelay = (props.카드.length - 1) * stagger;
  const graphStart = Math.round(0.36 * fps);
  const graphGrow = Math.round(1.04 * fps);
  const fold = Math.round(0.32 * fps);
  const exitStart =
    graphStart + graphGrow + lastDelay + Math.round(props["정지 시간"] * fps);
  return {
    stagger,
    unfold: Math.round(0.48 * fps),
    graphStart,
    graphGrow,
    exitStart,
    fold,
    durationInFrames: Math.max(
      Math.round(3 * fps),
      exitStart + fold + lastDelay + Math.round(0.1 * fps),
    ),
  };
};

export const periodCardPose = (
  frame: number,
  index: number,
  props: HomePeriodMotionProps,
  fps = 30,
) => {
  if (props.재생 === "정지") return { visible: true, rotateX: 0, graph: 1 };
  const timing = periodTiming(props, fps);
  const localFrame = frame - index * timing.stagger;
  const entrance = referenceEase(localFrame / timing.unfold);
  const exit =
    props.재생 === "전체 모션"
      ? referenceEase((localFrame - timing.exitStart) / timing.fold)
      : 0;
  return {
    visible: localFrame > 0 && exit < 1,
    rotateX: 90 * (1 - entrance) - 90 * exit,
    graph: referenceEase((localFrame - timing.graphStart) / timing.graphGrow),
  };
};
