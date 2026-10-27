import { nativeFeedback } from "../generated/native-feedback";
export const tasteAxes = [
  "단맛",
  "신맛",
  "쓴맛",
  "짠맛",
  "감칠맛",
  "지방맛",
] as const;
export type TasteAxis = (typeof tasteAxes)[number];

// Values follow the native TasteAxisPalette automatically.
export const palette: Record<
  TasteAxis,
  { main: string; tint: string; text: string; selectedBorder: string }
> = nativeFeedback.palette;
