import type { CSSProperties } from "react";
import { nativeLineHeight } from "../HomePeriodInsightMotion/native";
import { palette, rgba, type TasteAxis } from "./settings";
import { mixHex } from "./carousel-motion";

export type ResultChipItem = { label: string; axis?: TasteAxis };
export const RESULT_CHIP_HEIGHT = nativeLineHeight(10) + 8;
export const resultChipStyle = (axis?: TasteAxis): CSSProperties => ({
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 500,
  lineHeight: `${nativeLineHeight(10)}px`,
  padding: "4px 8px",
  borderRadius: 999,
  background: axis ? rgba(palette[axis].main, 0.05) : "#F7F7F7",
  color: axis ? palette[axis].text : "#535353",
  boxShadow: `inset 0 0 0 1px ${axis ? rgba(palette[axis].main, 0.18) : "#E5E5E5"}`,
  whiteSpace: "nowrap",
});

export const resultChipColors = (axis?: TasteAxis) => {
  const fill = axis ? mixHex("#FFFFFF", palette[axis].main, 0.05) : "#F7F7F7";
  return {
    fill,
    border: axis ? mixHex(fill, palette[axis].main, 0.18) : "#E5E5E5",
    text: axis ? palette[axis].text : "#535353",
  };
};

export const ResultChip = ({ label, axis }: ResultChipItem) => (
  <span
    data-result-chip={axis ? "reaction" : "detail"}
    style={resultChipStyle(axis)}
  >
    {label}
  </span>
);
