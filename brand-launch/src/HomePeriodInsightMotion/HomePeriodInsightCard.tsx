import type { CSSProperties, ReactNode } from "react";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import { cardIdentity, type CardKind, type TasteAxis } from "./settings";
import {
  nativeCardStyle,
  NativeDetailLabel,
  nativeLineHeight,
  NativeText,
} from "./native";

// Coordinates follow the native LucideIcon.swift outline variants (24-unit grid).
const iconPaths: Record<CardKind, string> = {
  recordFlow:
    "M8 2V6 M16 2V6 M5 4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4 M3 10H21 M9 16L11 18L15 14",
  newExperiences:
    "M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z M20 3V7 M22 5H18 M4 17V19 M5 18H3",
  repeatPatterns:
    "M3 12A9 9 0 0 1 12 3A9.75 9.75 0 0 1 18.74 5.74L21 8 M21 3V8H16 M21 12A9 9 0 0 1 12 21A9.75 9.75 0 0 1 5.26 18.26L3 16 M3 21V16H8",
  tasteClue:
    "M3 7C5 5 7 9 9 7S13 9 15 7S19 9 21 7 M3 12C5 10 7 14 9 12S13 14 15 12S19 14 21 12 M3 17C5 15 7 19 9 17S13 19 15 17S19 19 21 17",
  experienceBreadth:
    "M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12 M2 12H22 M12 2C7.5 6 7.5 18 12 22 M12 2C16.5 6 16.5 18 12 22 M4 7H20 M4 17H20",
  tasteChange: "M7 17L17 7 M7 7H17V17",
};

export type ArchiveChart = {
  kind: "timeSeries" | "distribution" | "composition";
  segments: { value: number }[];
};

export type HomePeriodInsightCardProps = {
  kind: CardKind;
  title: string;
  detail: string;
  chartValues: number[];
  accentAxis?: TasteAxis;
  archiveChart?: ArchiveChart;
  labelOverride?: string;
  detailLineLimit?: number | null;
  controls?: ReactNode;
  balancedFooter?: ReactNode;
  iconOverride?: ReactNode;
  headerActionLabel?: string | null;
  onTap?: () => void;
  showsDetailAction?: boolean;
  graphProgress?: number;
  graphContent?: ReactNode;
  style?: CSSProperties;
};

export const HomePeriodInsightCard: React.FC<HomePeriodInsightCardProps> = ({
  kind,
  title,
  detail,
  chartValues,
  accentAxis,
  archiveChart,
  labelOverride,
  detailLineLimit = 2,
  controls,
  balancedFooter,
  iconOverride,
  headerActionLabel = "자세히보기",
  onTap,
  showsDetailAction = false,
  graphProgress = 1,
  graphContent,
  style,
}) => {
  const growth = Math.max(0, Math.min(1, graphProgress));
  const identity = cardIdentity[kind];
  const axis = accentAxis ?? identity.axis;
  const label = labelOverride ?? identity.label;
  const usesArchive =
    archiveChart &&
    archiveChart.kind !== "composition" &&
    archiveChart.segments.some((segment) => segment.value > 0);
  const segments = usesArchive
    ? archiveChart.segments
    : chartValues.map((value) => ({ value }));
  const maximum = Math.max(0, ...segments.map((segment) => segment.value));
  const gap = usesArchive ? 3 : 4;
  const inset = usesArchive ? 0 : 2;
  const column =
    (132 - inset * 2 - gap * (segments.length - 1)) /
    Math.max(1, segments.length);
  const thickness = Math.min(32, usesArchive ? Math.min(12, column) : column);
  const details = (
    <div
      style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {title && (
          <NativeText size={16} weight={700} lineSpacing={2}>
            {title}
          </NativeText>
        )}
        <NativeText
          size={12}
          weight={400}
          lineSpacing={3}
          color="#888888"
          lineLimit={detailLineLimit}
        >
          {detail}
        </NativeText>
      </div>
      {graphContent ??
        (segments.length > 0 && (
          <svg
            data-period-chart="true"
            width={132}
            height={32}
            viewBox="0 0 132 32"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
          >
            <g data-growth="one-diameter" data-growth-progress={growth}>
              {segments.map((segment, index) => {
                const palette = TASTE_TOKENS[axis].palette;
                // A visible bar starts at one diameter, then extends upward.
                // Keep true zero values empty; short positive bars stay circular.
                const target =
                  maximum > 0
                    ? Math.max(thickness, (segment.value / maximum) * 32)
                    : 0;
                const h =
                  segment.value > 0
                    ? thickness + (target - thickness) * growth
                    : 0;
                const x =
                  inset + index * (column + gap) + (column - thickness) / 2;
                const radius = thickness / 2;
                const endpoint =
                  (usesArchive && archiveChart.kind === "distribution") ||
                  index === segments.length - 1;
                return h > 0 ? (
                  <g key={index} data-period-bar={index}>
                    <rect
                      x={x}
                      y={32 - h}
                      width={thickness}
                      height={h}
                      rx={radius}
                      fill={palette.tintSoftBorder}
                    />
                    {endpoint && (
                      <circle
                        cx={x + thickness / 2}
                        cy={32 - h + radius}
                        r={radius}
                        fill={palette.main}
                      />
                    )}
                  </g>
                ) : null;
              })}
            </g>
          </svg>
        ))}
    </div>
  );
  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        {iconOverride ?? (
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={TASTE_TOKENS[axis].palette.main}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d={iconPaths[kind]} />
          </svg>
        )}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            lineHeight: `${nativeLineHeight(14)}px`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
      </div>
      {(onTap || showsDetailAction) && headerActionLabel && (
        <NativeDetailLabel label={headerActionLabel} />
      )}
    </div>
  );
  const upper = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {header}
      {controls}
      {controls && onTap ? (
        <button
          type="button"
          onClick={onTap}
          style={{ all: "unset", cursor: "pointer", minHeight: 44 }}
        >
          {details}
        </button>
      ) : (
        details
      )}
    </div>
  );
  return (
    <article
      data-period-card={kind}
      aria-label={[label, title, detail].filter(Boolean).join(", ")}
      style={{
        ...nativeCardStyle,
        ...style,
      }}
    >
      <div
        style={
          balancedFooter
            ? { display: "grid", gridTemplateRows: "1fr auto 1fr" }
            : undefined
        }
      >
        {onTap && !controls ? (
          <button
            type="button"
            onClick={onTap}
            style={{
              all: "unset",
              display: "block",
              width: "100%",
              cursor: "pointer",
            }}
          >
            {upper}
          </button>
        ) : (
          upper
        )}
        {balancedFooter && (
          <>
            <div
              style={{ height: 0.5, background: "#E8E8E8", margin: "12px 0" }}
            />
            <div>{balancedFooter}</div>
          </>
        )}
      </div>
    </article>
  );
};
