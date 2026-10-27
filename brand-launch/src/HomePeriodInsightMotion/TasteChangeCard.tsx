import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import InsightCategoryIcon from "../../../src/components/system/InsightCategoryIcon";
import {
  CardTasteChangeGraph,
  cardTasteChangeLayout,
  type TasteChangeRows,
} from "./CardTasteChangeGraph";
import {
  AnimatedTrendArrow,
  countingChange,
} from "./TasteChangeAccents";
import {
  nativeCardStyle,
  NativeDetailLabel,
  nativeLineHeight,
  NativeText,
} from "./native";

const colorFor = (label: string) =>
  TASTE_TOKENS[
    TASTE_IDS.find((id) => TASTE_TOKENS[id].label === label) ?? "umami"
  ].palette.main;

// The reference uses TasteInsightSummaryCard's header, full-width title,
// then trend rows + a chart. It is not HomePeriodInsightCard's detail layout.
export const TasteChangeCard: React.FC<{
  title: string;
  sectionLabel: string;
  period?: string;
  rows: TasteChangeRows;
  progress: number;
  keywords?: string[];
}> = ({
  title,
  sectionLabel,
  period = "자세히보기",
  rows,
  progress,
  keywords = [],
}) => {
  const { graph, height } = cardTasteChangeLayout(rows);
  const colors = graph.데이터.map((row) => colorFor(row.미각));
  return (
    <article
      data-period-card="tasteChange"
      aria-label={`${sectionLabel}, ${title}, ${period ?? ""}`}
      style={{
        ...nativeCardStyle,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "flex", flexShrink: 0 }}>
            <InsightCategoryIcon category="change" color={colors[0]} />
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: `${nativeLineHeight(14)}px`,
            }}
          >
            {sectionLabel}
          </span>
        </div>
        {period && <NativeDetailLabel label={period} />}
      </div>
      {title && (
        <NativeText size={16} weight={700} lineSpacing={2}>
          {title}
        </NativeText>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {graph.데이터.length > 0 && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                height,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                gap: 4,
              }}
            >
              {graph.데이터.map((row, index) => {
                const value = row.기록[row.기록.length - 1];
                const change = countingChange(value, progress);
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      height: 24,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <AnimatedTrendArrow
                      value={value}
                      color={colorFor(row.미각)}
                      progress={progress}
                    />
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#3F3F3F",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: `${nativeLineHeight(14)}px`,
                        }}
                      >
                        {row.미각}
                      </span>
                      <span
                        data-count-value={value}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: `${nativeLineHeight(12)}px`,
                          color: colorFor(row.미각),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {change}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <CardTasteChangeGraph rows={graph.데이터} progress={progress} />
          </div>
        )}
        {keywords.length > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {keywords.map((keyword, index) => {
              const axis = TASTE_IDS.find((id) =>
                keyword.startsWith(TASTE_TOKENS[id].label),
              );
              const palette = axis ? TASTE_TOKENS[axis].palette : undefined;
              const label = axis ? TASTE_TOKENS[axis].label : keyword;
              const value = axis ? keyword.slice(label.length).trim() : "";
              return (
                <span
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    boxShadow: `inset 0 0 0 1px ${palette?.tintSoftBorder ?? "#E5E5E5"}`,
                    background: palette?.tintSoft ?? "#F7F7F7",
                    fontSize: 11,
                    lineHeight: `${nativeLineHeight(11)}px`,
                    fontWeight: 500,
                    color: value ? "#0F0F0F" : "#535353",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {value && (
                    <span style={{ color: palette?.main, fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};
