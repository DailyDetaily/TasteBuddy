import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import type { Category } from "../../../src/lib/gastronomy/engine";
import type { CardKind, TasteAxis } from "../HomePeriodInsightMotion/settings";
import type { BarGraphProps } from "../GraphMotion/settings";
import type { MiniLineGraphProps } from "../GraphMotion/mini-line-settings";
import type { MiniAreaGraphProps } from "../GraphMotion/mini-area-settings";
import { miniStackedBarDefaultProps } from "../GraphMotion/mini-stacked-bar-settings";
import { miniGroupedBarDefaultProps } from "../GraphMotion/mini-grouped-bar-settings";
import { miniPieDefaultProps } from "../GraphMotion/mini-pie-settings";
import type { MiniBubbleGraphProps } from "../GraphMotion/mini-bubble-settings";
import { transitionBubbleItems } from "../GraphMotion/treemap-bubble-transition";
import { foodIcons } from "../FoodIcons/catalog";
import { miniTreemapDefaultProps } from "../GraphMotion/mini-treemap-settings";
import { miniHeatmapDefaultProps } from "../GraphMotion/mini-heatmap-settings";
import { barTiming } from "../GraphMotion/motion";
import { miniLineTiming } from "../GraphMotion/mini-line-motion";
import { AREA_TIMING } from "../GraphMotion/mini-area-motion";
import { STACKED_BAR_TIMING } from "../GraphMotion/mini-stacked-bar-motion";
import { GROUPED_BAR_TIMING } from "../GraphMotion/mini-grouped-bar-motion";
import { PIE_TIMING } from "../GraphMotion/mini-pie-motion";
import { BUBBLE_TIMING } from "../GraphMotion/mini-bubble-motion";
import { TREEMAP_TIMING } from "../GraphMotion/mini-treemap-motion";
import { HEATMAP_TIMING } from "../GraphMotion/mini-heatmap-motion";

// Motion specimens only. Keep copy and totals derived from these same inputs.
const base = {
  재생: "진입 후 유지" as const,
  "확대 배율": 1,
  "배경 색": "#FFFFFF",
};
export const barExample: BarGraphProps = {
  ...base,
  색상: "감칠맛",
  "시작 대기": 0.3,
  "진입 시간": 0.8,
  "막대 간 지연": 0.08,
  "유지 시간": 1.6,
  "끝 여백": 0.5,
  데이터: [0, 1, 3, 2, 5, 4, 7].map((값, i) => ({ 항목: `${i + 1}일`, 값 })),
};
export const lineExample: MiniLineGraphProps = {
  ...base,
  "시작 대기": 0.3,
  "진입 시간": 1.2,
  "행 간 지연": 0.12,
  "유지 시간": 1.6,
  "끝 여백": 0.7,
  데이터: [{ 미각: "감칠맛", 기록: [1.2, 2.1, 2.4, 4.5] }],
};
export const areaExample: MiniAreaGraphProps = {
  ...base,
  미각: "감칠맛",
  기록: [...lineExample.데이터[0].기록],
};
export const groupedExample = { ...miniGroupedBarDefaultProps, ...base };
const sourceLabels = ["집밥", "식당", "미확인"];
export const stackedExample = {
  ...miniStackedBarDefaultProps,
  ...base,
  데이터: miniStackedBarDefaultProps.데이터.map((series, i) => ({
    ...series,
    항목: sourceLabels[i],
  })),
};
export const pieExample = {
  ...miniPieDefaultProps,
  ...base,
  데이터: miniPieDefaultProps.데이터.map((series, i) => ({
    ...series,
    항목: sourceLabels[i],
  })),
};
// Reuse the transition's original counts, colors and icons.
// Labels remain illustrative synthetic records from the chosen food icons.
const bubbleItems = transitionBubbleItems.map((item) => ({
  ...item,
  label: foodIcons.find((icon) => icon.id === item.dishKindId)!.label,
}));
const primaryBubble = bubbleItems.reduce((largest, item) =>
  (item.value ?? 0) > (largest.value ?? 0) ? item : largest,
);
export const bubbleExample: MiniBubbleGraphProps = {
  ...base,
  표시: "음식 아이콘",
  데이터: bubbleItems.map((item) => ({
    항목: item.label,
    색상: TASTE_TOKENS[item.axis].label,
    값: item.value,
    "음식 종류": item.dishKindId,
  })),
};
// Keep all six categories from the existing treemap specimen.
export const treemapExample = {
  ...miniTreemapDefaultProps,
  ...base,
};
export const heatmapExample = { ...miniHeatmapDefaultProps, ...base };

export type SummaryGraphKind =
  | "bar"
  | "grouped"
  | "stacked"
  | "line"
  | "area"
  | "bubble"
  | "pie"
  | "treemap"
  | "heatmap";
export type SummaryLegendItem = { label: string; color?: string };
export type SummaryCardExample = {
  graph: SummaryGraphKind;
  kind: CardKind;
  category?: Category;
  axis: TasteAxis;
  label: string;
  title: string;
  detail: string;
  legend: SummaryLegendItem[];
  settle: number;
};
const sum = (values: readonly (number | null)[]) =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0);
const color = (axis: TasteAxis) => TASTE_TOKENS[axis].palette.main;
const sources = [
  { label: "집밥", color: color("umami") },
  { label: "식당", color: color("sweet") },
  { label: "미확인", color: color("bitter") },
];

export const summaryCardExamples: SummaryCardExample[] = [
  {
    graph: "bar",
    kind: "recordFlow",
    axis: "umami",
    label: "기록 추이",
    title: `${sum(barExample.데이터.map((point) => point.값))}개 기록`,
    detail: `기록한 날 ${barExample.데이터.filter((point) => (point.값 ?? 0) > 0).length}일\n7일 표본`,
    legend: [{ label: "막대 · 일별 요리 기록 수", color: color("umami") }],
    settle: barTiming(barExample).settle,
  },
  {
    graph: "grouped",
    kind: "repeatPatterns",
    category: "change",
    axis: "umami",
    label: "기간 비교",
    title: `${sum(groupedExample["현재 기록"])}개 기록`,
    detail: `직전보다 ${sum(groupedExample["현재 기록"]) - sum(groupedExample["이전 기록"])}개 많음\n4일씩 비교`,
    legend: [
      { label: "직전", color: "#BDBDBD" },
      { label: "현재 · 요리 기록 수", color: color("umami") },
    ],
    settle: GROUPED_BAR_TIMING.settle,
  },
  {
    graph: "stacked",
    kind: "experienceBreadth",
    axis: "umami",
    label: "출처별 기록",
    title: `${sum(stackedExample.데이터.map((series) => sum(series.기록)))}개 기록`,
    detail: "출처별 요리 기록\n7일 표본",
    legend: sources,
    settle: STACKED_BAR_TIMING.settle,
  },
  {
    graph: "line",
    kind: "tasteChange",
    axis: "umami",
    label: "미각 변화",
    title: "감칠맛 변화",
    detail: "비교 관찰 4개\n단위 없는 합성 값",
    legend: [{ label: "라인 · 과거 3개 / 현재 1개", color: color("umami") }],
    settle: miniLineTiming(lineExample).settle,
  },
  {
    graph: "area",
    kind: "tasteClue",
    axis: "umami",
    label: "값의 흐름",
    title: "영역 추이",
    detail: "관찰 4개\n단위 없는 합성 값",
    legend: [{ label: "영역 · 같은 간격의 관찰", color: color("umami") }],
    settle: AREA_TIMING.settle,
  },
  {
    graph: "bubble",
    kind: "experienceBreadth",
    axis: "umami",
    label: "음식 종류",
    title: `${sum(bubbleExample.데이터.map((item) => item.값))}개 기록`,
    detail: `${bubbleItems.length}가지 음식 종류\n${primaryBubble.label} ${primaryBubble.value}개로 최다`,
    legend: bubbleItems.map((item) => ({
      label: `${item.label} ${item.value}`,
      color: color(item.axis),
    })),
    settle: BUBBLE_TIMING.settle,
  },
  {
    graph: "pie",
    kind: "experienceBreadth",
    axis: "umami",
    label: "출처 비율",
    title: `${sum(pieExample.데이터.map((item) => item.값))}개 기록`,
    detail: `전체 요리 기록 기준\n분모 ${sum(pieExample.데이터.map((item) => item.값))}개`,
    legend: sources,
    settle: PIE_TIMING.settle,
  },
  {
    graph: "treemap",
    kind: "newExperiences",
    axis: "umami",
    label: "종류 구성",
    title: `${treemapExample.데이터.length}가지 종류`,
    detail: `요리 기록 ${sum(treemapExample.데이터.map((item) => item.값))}개\n중복 없는 분류 표본`,
    legend: treemapExample.데이터.map((item) => ({
      label: item.항목,
      color: color(
        TASTE_IDS.find((axis) => TASTE_TOKENS[axis].label === item.색상) ??
          "umami",
      ),
    })),
    settle: TREEMAP_TIMING.settle,
  },
  {
    graph: "heatmap",
    kind: "recordFlow",
    axis: "umami",
    label: "기록 빈도",
    title: `${heatmapExample.기록.filter((value) => (value ?? 0) > 0).length}일 기록`,
    detail: `요리 기록 ${sum(heatmapExample.기록)}개\n31일 표본`,
    legend: [
      { label: "히트맵 · 0 / 1 / 2 / 3 / 4개 이상", color: color("umami") },
    ],
    settle: HEATMAP_TIMING.colorSettle,
  },
];
