import type {
  ChipMetrics,
  ResultChipItem,
} from "../DiningFeedbackMotion/ResultChip";
import { nativeLineHeight } from "../HomePeriodInsightMotion/native";
import { nativeChip, nativeColors } from "../TabBarCameraEntry/native-ui";

// TBSelectableChip(.dining), ChipSize.medium, no accentAxis, light appearance.
// The narrow source-parity test checks these synced tokens against current Swift.
export const nativeDishChipMetrics: ChipMetrics = {
  height: nativeChip.height,
  fontSize: nativeChip.fontSize,
  fontWeight: 500, // ChipSize.medium.font -> TBFont.medium -> Pretendard-Medium.
  lineHeight: nativeLineHeight(nativeChip.fontSize),
  paddingX: nativeChip.paddingX,
  paddingY: nativeChip.paddingY,
  iconGap: nativeChip.gap,
  contentHeight: Math.max(
    nativeChip.assetSize,
    nativeLineHeight(nativeChip.fontSize),
  ),
  borderWidth: nativeChip.borderWidth,
};
export const nativeDishIconSize = nativeChip.assetSize;
export const nativeDishChipGap = nativeChip.rowGap;
export const nativeDishChipColors = (
  selected = false,
): NonNullable<ResultChipItem["colors"]> => {
  return selected
    ? {
        fill: nativeColors.selectionSurface,
        border: nativeColors.selectionSurface,
        text: nativeColors.selectionText,
      }
    : {
        fill: nativeColors.mutedSurface,
        border: nativeColors.border,
        text: nativeColors.textTertiary,
      };
};
