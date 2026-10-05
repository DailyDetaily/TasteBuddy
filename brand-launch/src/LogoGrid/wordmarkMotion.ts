import { ramp } from "./motion";

export const WORDMARK_FILL_FRAMES = 24;
export const getWordmarkEntryStart = (
  index: number,
  variant: "classic" | "dynamic",
) => {
  const taste = index < 7;
  const letter = taste ? index - 2 : index - 7;
  return (
    (variant === "classic" ? (taste ? 43 : 51) : taste ? 126 : 150) + letter * 2
  );
};
export const getWordmarkFillProgress = (
  frame: number,
  index: number,
  variant: "classic" | "dynamic",
) => {
  const start = getWordmarkEntryStart(index, variant);
  return ramp(frame, start, start + WORDMARK_FILL_FRAMES);
};
