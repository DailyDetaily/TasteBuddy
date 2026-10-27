import type { CSSProperties, ReactNode } from "react";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import InsightCategoryIcon from "../../../src/components/system/InsightCategoryIcon";
import type { Category } from "../../../src/lib/gastronomy/engine";
import SummaryCardFooter, {
  type SummaryCardLegendItem,
} from "../../../src/components/system/SummaryCardLegend";
import { cardIdentity, type CardKind, type TasteAxis } from "./settings";
import {
  nativeCardStyle,
  NativeDetailLabel,
  nativeLineHeight,
  NativeText,
} from "./native";

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
  category?: Category;
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
  legend?: readonly SummaryCardLegendItem[];
  style?: CSSProperties;
};

export const HomePeriodInsightCard: React.FC<HomePeriodInsightCardProps> = ({
  kind,
  title,
  detail,
  chartValues,
  accentAxis,
  category,
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
  legend = [],
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
          <span style={{ display: "flex", flexShrink: 0 }}>
            <InsightCategoryIcon
              category={category ?? identity.category}
              color={TASTE_TOKENS[axis].palette.main}
            />
          </span>
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
        {legend.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <SummaryCardFooter items={legend} />
          </div>
        )}
      </div>
    </article>
  );
};
