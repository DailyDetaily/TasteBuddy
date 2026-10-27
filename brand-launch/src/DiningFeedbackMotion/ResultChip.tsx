import type { CSSProperties, ReactNode } from "react";
import { nativeLineHeight } from "../HomePeriodInsightMotion/native";
import { palette, rgba, type TasteAxis } from "./settings";
import { mixHex } from "./carousel-motion";

export type ResultChipItem = {
  label: string;
  axis?: TasteAxis;
  icon?: ReactNode;
  colors?: { fill: string; border: string; text: string };
};
export type ChipMetrics = {
  height: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  iconGap: number;
  contentHeight: number;
  borderWidth: number;
};
export const RESULT_CHIP_HEIGHT = nativeLineHeight(10) + 8;
export const resultChipStyle = (
  axis?: TasteAxis,
  metrics?: ChipMetrics,
  colors?: ResultChipItem["colors"],
): CSSProperties => ({
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
  ...(metrics
    ? ({
        height: metrics.height,
        fontSize: metrics.fontSize,
        fontWeight: metrics.fontWeight,
        lineHeight: `${metrics.lineHeight}px`,
        padding: `${metrics.paddingY}px ${metrics.paddingX}px`,
        display: "inline-flex",
        alignItems: "center",
      } as CSSProperties)
    : {}),
  ...(colors
    ? {
        background: colors.fill,
        color: colors.text,
        boxShadow: `inset 0 0 0 ${metrics?.borderWidth ?? 1}px ${colors.border}`,
      }
    : {}),
});

export const resultChipColors = (axis?: TasteAxis) => {
  const fill = axis ? mixHex("#FFFFFF", palette[axis].main, 0.05) : "#F7F7F7";
  return {
    fill,
    border: axis ? mixHex(fill, palette[axis].main, 0.18) : "#E5E5E5",
    text: axis ? palette[axis].text : "#535353",
  };
};

export const ResultChipContent = ({
  label,
  icon,
  metrics,
}: ResultChipItem & { metrics?: ChipMetrics }) =>
  icon ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: metrics?.iconGap ?? 4,
        height: metrics?.contentHeight ?? nativeLineHeight(10),
        verticalAlign: "top",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </span>
  ) : (
    <>{label}</>
  );

export const ResultChip = ({
  label,
  axis,
  icon,
  colors,
  metrics,
}: ResultChipItem & { metrics?: ChipMetrics }) => (
  <span
    data-result-chip={axis ? "reaction" : "detail"}
    style={resultChipStyle(axis, metrics, colors)}
  >
    <ResultChipContent label={label} icon={icon} metrics={metrics} />
  </span>
);
