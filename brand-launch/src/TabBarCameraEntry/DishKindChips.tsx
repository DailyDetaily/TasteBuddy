import {
  nativeFlowUI as ui,
  nativeColors as colors,
  nativeChip,
  nativeText,
} from "./native-ui";
import { AddChip } from "./AddChip";
import { nativeFeedback } from "../generated/native-feedback";
import { nativeLineHeight } from "../HomePeriodInsightMotion/native";

// TBSelectableChip(.dining), ChipSize.medium and DiningFeedbackAddChipButton.
// SwiftUI strokes overlay the pill without increasing its layout dimensions.
export const DishKindChips = () => (
  <div
    data-dish-kind-section
    style={{
      padding: ui.sectionPadding,
      background: colors.surface,
      borderRadius: ui.cardRadius,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {nativeText("음식 종류와 특성", "menu")}
        </div>
        <div
          style={{
            fontSize: nativeChip.fontSize,
            color: "rgba(15,15,15,0.6)",
            lineHeight: `${nativeLineHeight(nativeChip.fontSize) + 3}px`,
          }}
        >
          {nativeText(
            "추천 태그를 먼저 골라두었어요. 메뉴와 다르면 직접 바꿔주세요.",
            "menu",
          )}
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(15,15,15,0.4)",
          flexShrink: 0,
        }}
      >
        {nativeText("선택사항", "menu")}
      </span>
    </div>
    {nativeFeedback.dishKindGroups.map((group) => (
      <div
        key={group.id}
        data-dish-kind-group={group.id}
        style={{ marginBottom: 12 }}
      >
        <div
          style={{
            fontSize: nativeFeedback.dishKindLayout.labelSize,
            color: colors.textSubtle,
            marginBottom: nativeFeedback.dishKindLayout.gap,
          }}
        >
          {group.label}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: nativeFeedback.dishKindLayout.wrapGap,
            alignItems: "center",
          }}
        >
          {group.kinds.map((kind) => {
            const selected = (
              nativeFeedback.selectedDishKindIDs as readonly string[]
            ).includes(kind.id);
            const nodes = (
              nativeFeedback.dishKindIcons as Record<
                string,
                readonly (readonly [string, Record<string, string>])[]
              >
            )[kind.id];
            return (
              <span
                key={kind.id}
                data-dish-kind={kind.id}
                data-selected={selected}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: nativeChip.gap,
                  height: nativeChip.height,
                  padding: `${nativeChip.paddingY}px ${nativeChip.paddingX}px`,
                  borderRadius: 999,
                  boxShadow: `inset 0 0 0 ${nativeChip.borderWidth}px ${selected ? colors.textPrimary : colors.border}`,
                  background: selected
                    ? colors.textPrimary
                    : colors.mutedSurface,
                  color: selected ? colors.textInverse : colors.textMuted,
                  fontSize: nativeChip.fontSize,
                  fontWeight: 600,
                  lineHeight: `${nativeLineHeight(nativeChip.fontSize)}px`,
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width={nativeChip.assetSize}
                  height={nativeChip.assetSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  {nodes.map(([tag, attributes], i) =>
                    createElement(tag, { ...attributes, key: i }),
                  )}
                </svg>
                {kind.label}
              </span>
            );
          })}
        </div>
      </div>
    ))}
    <AddChip label={nativeText("디시 종류 직접 입력", "menu")} />
  </div>
);
import { createElement } from "react";
