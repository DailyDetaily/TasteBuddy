import type { CarouselProps } from "./carousel-settings";

export const carouselTiming = (props: CarouselProps, fps = 30) => {
  const hold = Math.round(props["카드 유지 시간"] * fps);
  const move = Math.round(props["스크롤 시간"] * fps);
  return {
    hold,
    move,
    segment: hold + move,
    durationInFrames: 6 * (hold + move),
  };
};

// Measured from download.mp4: 2.5s per card, cubic-bezier(0.9, 0, 0.1, 1).
// Invert the curve's x coordinate; no anticipation or overshoot.
export const referenceProgress = (progress: number) => {
  const p = Math.min(1, Math.max(0, progress));
  if (p === 0 || p === 1) return p;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const t = (low + high) / 2;
    const x = 2.7 * (1 - t) ** 2 * t + 0.3 * (1 - t) * t ** 2 + t ** 3;
    if (x < p) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) * t ** 2 + t ** 3;
};

export const cardOpacity = (relative: number, inactiveOpacity: number) => {
  const focus = Math.max(0, 1 - Math.abs(relative));
  const emphasis = focus * focus * (3 - 2 * focus);
  return inactiveOpacity + (1 - inactiveOpacity) * emphasis;
};

export const carouselPose = (frame: number, props: CarouselProps, fps = 30) => {
  const timing = carouselTiming(props, fps);
  const f = Math.min(timing.durationInFrames - 1, Math.max(0, frame));
  const segment = Math.floor(f / timing.segment);
  const local = f % timing.segment;
  const progress =
    props.재생 === "정지"
      ? 0
      : referenceProgress((local - timing.hold) / (timing.move - 1));
  const from = props.재생 === "정지" ? props["정지 카드"] - 1 : segment;
  const position = from + progress;
  // Close the background's time path too, so the sixth-to-first transition loops cleanly.
  const phase = props.재생 === "정지" ? 0 : f / (timing.durationInFrames - 1);
  const elapsed = (1 - Math.cos(phase * Math.PI * 2)) * 3 * props["배경 속도"];
  return {
    position,
    from: from % 6,
    to: (from + 1) % 6,
    blend: Math.min(1, Math.max(0, progress)),
    elapsed,
  };
};

export const relativeCardPosition = (
  index: number,
  position: number,
  slots = 6,
) => ((((index - position + slots / 2) % slots) + slots) % slots) - slots / 2;

export const mixHex = (a: string, b: string, progress: number) => {
  const channel = (hex: string, offset: number) =>
    parseInt(hex.slice(offset, offset + 2), 16);
  return `#${[1, 3, 5]
    .map((offset) =>
      Math.round(
        channel(a, offset) +
          (channel(b, offset) - channel(a, offset)) * progress,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};
