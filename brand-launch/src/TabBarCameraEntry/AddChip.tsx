import { nativeColors as colors, nativeChip } from "./native-ui";
// Native DiningFeedbackAddChipButton: 36pt circle, 14pt plus, inset border.
export const AddChip = ({ label }: { label: string }) => (
  <span
    aria-label={label}
    style={{
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      width: nativeChip.addSize,
      height: nativeChip.addSize,
      borderRadius: "50%",
      boxShadow: `inset 0 0 0 ${nativeChip.borderWidth}px ${colors.border}`,
      background: colors.mutedSurface,
      color: colors.textMuted,
    }}
  >
    <svg
      width={nativeChip.iconSize}
      height={nativeChip.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  </span>
);
