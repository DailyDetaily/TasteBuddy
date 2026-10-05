import type { CSSProperties, ReactNode } from "react";

// CoreText metrics from the bundled Pretendard OTF: ascent + descent, no leading.
export const nativeLineHeight = (size: number) => size * 1.193359375;
export const nativeCardStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 20,
  padding: 12,
  background: "#FFFFFF",
  color: "#0F0F0F",
  fontFamily: "Pretendard, sans-serif",
  overflow: "hidden",
};

export const NativeText: React.FC<{
  children: ReactNode;
  size: number;
  weight: number;
  lineSpacing?: number;
  color?: string;
  lineLimit?: number | null;
}> = ({ children, size, weight, lineSpacing = 0, color, lineLimit }) => (
  <div
    style={{ display: "flow-root", fontSize: size, fontWeight: weight, color }}
  >
    <div
      style={{
        lineHeight: `${nativeLineHeight(size) + lineSpacing}px`,
        marginBlock: -lineSpacing / 2,
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lineLimit ?? undefined,
      }}
    >
      {children}
    </div>
  </div>
);

export const NativeDetailLabel: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      color: "#666666",
      fontSize: 11,
      fontWeight: 500,
      lineHeight: `${nativeLineHeight(11)}px`,
      whiteSpace: "nowrap",
    }}
  >
    {label}
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6L15 12L9 18" />
    </svg>
  </span>
);
