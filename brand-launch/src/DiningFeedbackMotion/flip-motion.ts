import { referenceEase } from "../GraphMotion/reference-motion";
import type { FlipProps } from "./flip-settings";

// Same fold/unfold timing and easing as HomePeriodInsightMotion, on the Y axis.
export const flipTiming = (props: FlipProps, fps = 30) => {
  const hold = Math.round(props["카드 유지 시간"] * fps);
  const fold = Math.max(2, Math.round(props["접힘 시간"] * fps));
  const unfold = Math.max(2, Math.round(props["펼침 시간"] * fps));
  const segment = hold + fold + unfold;
  return {
    hold,
    fold,
    unfold,
    segment,
    durationInFrames: props.카드.length * segment,
  };
};

export const flipPose = (frame: number, props: FlipProps, fps = 30) => {
  const timing = flipTiming(props, fps);
  const f = Math.max(0, Math.min(timing.durationInFrames - 1, frame));
  const segment = Math.floor(f / timing.segment);
  const local = f % timing.segment;
  const stopped = props.재생 === "정지";
  const from = stopped ? props["정지 카드"] - 1 : segment;
  const to = (from + 1) % props.카드.length;
  const sign =
    props["플립 방향"] === "왼쪽"
      ? -1
      : props["플립 방향"] === "오른쪽"
        ? 1
        : segment % 2 === 0
          ? -1
          : 1;
  const incoming = !stopped && local >= timing.hold + timing.fold;
  const rotation =
    stopped || local < timing.hold
      ? 0
      : incoming
        ? -sign *
          90 *
          (1 -
            referenceEase(
              (local - timing.hold - timing.fold) / (timing.unfold - 1),
            ))
        : sign * 90 * referenceEase((local - timing.hold) / (timing.fold - 1));
  const phase = stopped ? 0 : f / (timing.durationInFrames - 1);
  return {
    from,
    to,
    cardIndex: incoming ? to : from,
    rotation: rotation === 0 ? 0 : rotation,
    blend: stopped
      ? 0
      : referenceEase(
          (local - timing.hold) / (timing.fold + timing.unfold - 1),
        ),
    elapsed: (1 - Math.cos(phase * Math.PI * 2)) * 3 * props["배경 속도"],
  };
};
