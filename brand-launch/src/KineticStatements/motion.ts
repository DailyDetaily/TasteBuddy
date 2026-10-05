import type { KineticStatementsProps } from "./settings";

export const KINETIC_FPS = 30;
export const progress = (frame: number, start: number, end: number) =>
  Math.min(1, Math.max(0, (frame - start) / Math.max(1, end - start)));
export const easeOut = (value: number) => 1 - Math.pow(1 - value, 4);
export const inkLetterCount = (text: string) =>
  [...text].filter((char) => !/\s/.test(char)).length;

export const kineticPhrases = (props: KineticStatementsProps) => [
  props["문구 1"],
  props["문구 2"],
  props["문구 3"],
  props["문구 4"],
];

export const kineticTiming = (props: KineticStatementsProps) => {
  const texts = kineticPhrases(props);
  const fillFrames = Math.round(props["문구 채움 시간"] * KINETIC_FPS);
  const stagger = props["글자 시차"];
  const holdFrames = Math.round(props["문구 유지"] * KINETIC_FPS);
  const transitionFrames = Math.round(props["전환 시간"] * KINETIC_FPS);
  const finalHoldFrames = Math.round(props["마지막 유지"] * KINETIC_FPS);
  const overlapFrames = Math.round(transitionFrames * 0.5);

  let cursor = 4;
  const phrases = texts.map((text, index) => {
    const start = cursor;
    const fillEnd =
      start +
      fillFrames +
      Math.max(0, inkLetterCount(text) - 1) * stagger;
    const isLast = index === texts.length - 1;
    const exitStart = fillEnd + (isLast ? 0 : holdFrames);
    const exitEnd = exitStart + (isLast ? 0 : transitionFrames);

    if (!isLast) cursor = Math.max(start + 1, exitEnd - overlapFrames);

    return {
      text,
      start,
      fillEnd,
      exitStart,
      exitEnd,
      isLast,
    };
  });

  const last = phrases[phrases.length - 1];
  const signatureStart = last.fillEnd + 4;

  return {
    phrases,
    fillFrames,
    stagger,
    holdFrames,
    transitionFrames,
    signatureStart,
    durationInFrames: last.fillEnd + finalHoldFrames,
  };
};

// The terminal-fill behavior stays related to the Taste Buddy wordmark,
// but the shorter phrase units use a faster default cadence.
export const letterFillAt = (
  frame: number,
  start: number,
  index: number,
  fillFrames: number,
  stagger: number,
) => {
  const letterStart = start + index * stagger;
  return progress(frame, letterStart, letterStart + fillFrames) ** 1.6;
};
