import {
  ChevronLeftRegular, ChevronRightRegular
} from '@fluentui/react-icons';
import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  buildHomeReservationHint,
  buildHomeSpecialNoteFromReservations,
  buildHomeTasteProfileFromMeasurements,
  LegacyHomeSpecialNoteCard,
  LegacyHomeTasteProfileCard,
} from '../imports/Home';
import PalateSignatureHeroCard from '../components/analysis/PalateSignatureHeroCard';
import RealMenuRecommendationCard from '../components/analysis/RealMenuRecommendationCard';
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import SectionCard from '../components/SectionCard';
import InsightCard from '../components/system/InsightCard';
import PageSection from '../components/system/PageSection';
import ProfileConfidenceCard, {
  type ProfileConfidenceStage,
} from '../components/system/ProfileConfidenceCard';
import SectionTitle from '../components/system/SectionTitle';
import { DATA_VIZ_TOKENS, ICON_TOKENS, TASTE_IDS, TASTE_LABELS, TASTE_LABEL_TO_ID, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import { TASTE_COLORS, buildTasteAdjustmentGradient, getTasteColor, getTasteTint, getTasteTintSubText, mixHexColors } from '../constants/tasteColors';
import { type DiningFeedbackDraft } from '../constants/diningFeedbackData';
import {
  formatMeasurementDate,
  getAverageMeasurementMm,
  getTasteMeasurementAgeLabel,
  getAverageReferenceMeasurementMm,
  getStrongestTasteMeasurement,
  getTasteMeasurementEntries,
  getWeakestTasteMeasurement,
  isTasteMeasurementStale,
  type TasteMeasurementEntry,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  hydrateRecentMeasurementSnapshots,
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  type RestaurantContentDish,
} from '../lib/tasteBuddySupabase';
import { RESERVATION_CATALOG, type ReservationRecord } from '../constants/reservationCatalog';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const ChevronLeft = wrapIcon(ChevronLeftRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);

const RADAR_CHART = DATA_VIZ_TOKENS.radar;
const TREND_TINT_LINE_STROKE_WIDTH = 10;
const TREND_LINE_STROKE_WIDTH = 1;
const TREND_DOT_RADIUS = 5;
const TREND_ACTIVE_DOT_OUTER_RADIUS = 9;
const TREND_ACTIVE_DOT_CORE_RADIUS = TREND_DOT_RADIUS;
const TREND_ACTIVE_DOT_HALO_WHITE_MIX = 0.72;
const TREND_GUIDE_GAP = 2;
const TREND_GUIDE_MASK_WIDTH = 6;
const TREND_GUIDE_BOTTOM_TAIL = 8;
const TREND_CHART_TOP_MARGIN = 10;
const TREND_CHART_X_AXIS_HEIGHT = 18;
const TREND_CHART_Y_AXIS_WIDTH = 34;
const TREND_WINDOW_NAV_BUTTON_SIZE = ICON_TOKENS.container.lg;
const GRAPH_TASTE_ORDER = TASTE_LABELS;
const TREND_RANGE_OPTIONS = [
  { id: 'week', label: '주', days: 7 },
  { id: 'month', label: '달', days: 31 },
  { id: 'quarter', label: '분기', days: 92 },
  { id: 'year', label: '년', days: 366 },
  { id: 'all', label: '전부', days: null },
] as const;
const TREND_TASTE_OPTIONS = ['모든맛', ...GRAPH_TASTE_ORDER] as const;
const TREND_GRID_HORIZONTAL_STROKE = '#E2E5EA';
const TREND_GRID_VERTICAL_STROKE = '#E6E8ED';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CHEF_TRANSLATION_COPY =
  '단맛과 신맛이 현재 더 빠르게 반응하는 포인트이므로, 코스 구성 시 너무 밀도 있게 겹치지 않도록 조절하면 전반적 밸런스가 한층 여유롭게 맞춰집니다.';
const CHEF_TRANSLATION_ACCENT_COLOR = mixHexColors(
  getTasteColor('단맛'),
  getTasteColor('신맛'),
  0.5,
);

function formatTasteDeltaSummary(deltaMm: number) {
  if (Math.abs(deltaMm) < 0.5) {
    return '평균과 유사한 반응';
  }
  return deltaMm > 0 ? '더 또렷하게 감지' : '더 부드럽게 필요';
}

function deriveProfileConfidenceStage(measurementCount: number): ProfileConfidenceStage {
  if (measurementCount >= 4) {
    return 'Refined';
  }

  if (measurementCount >= 2) {
    return 'Building';
  }

  return 'Starter';
}

type ProfileChangeTrendPoint = {
  event: string;
  isVisible: boolean;
  xPosition: number;
  단맛: number;
  신맛: number;
  쓴맛: number;
  짠맛: number;
  감칠맛: number;
  지방맛: number;
};

type RealMenuRecommendation = {
  chef: string;
  courseLabel: string;
  fitScore: number;
  id: string;
  ingredients: string[];
  reason: string;
  restaurant: string;
  subtitle: string;
  tasteLabel: string;
  title: string;
};

type TrendRangeId = (typeof TREND_RANGE_OPTIONS)[number]['id'];

type TrendViewWindow = {
  startMs: number;
  endMs: number;
};

interface WeeklyTrendActiveDotProps {
  cx?: number;
  cy?: number;
  payload?: ProfileChangeTrendPoint;
}

interface WeeklyTrendCursorProps {
  height?: number;
  payload?: WeeklyTrendTooltipEntry[];
  points?: Array<{
    x?: number;
    y?: number;
  }>;
  top?: number;
}

interface WeeklyTrendAxisTickProps {
  labelByPosition: Record<string, string>;
  rangeId: TrendRangeId;
  tickPositionKeys: string[];
  payload?: {
    value?: number | string;
  };
  x?: number;
  y?: number;
}

function WeeklyTrendActiveDot({
  cx,
  cy,
  payload,
  taste,
}: WeeklyTrendActiveDotProps & {
  taste: string;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || payload?.isVisible === false) {
    return null;
  }

  const tasteColor = getTasteColor(taste);
  const haloColor = mixHexColors(tasteColor, '#FFFFFF', TREND_ACTIVE_DOT_HALO_WHITE_MIX);

  return (
    <g>
      <rect
        x={cx - TREND_GUIDE_MASK_WIDTH / 2}
        y={cy - (TREND_ACTIVE_DOT_OUTER_RADIUS + TREND_GUIDE_GAP)}
        width={TREND_GUIDE_MASK_WIDTH}
        height={(TREND_ACTIVE_DOT_OUTER_RADIUS + TREND_GUIDE_GAP) * 2}
        fill="#FFFFFF"
        rx={TREND_GUIDE_MASK_WIDTH / 2}
      />
      <circle cx={cx} cy={cy} r={TREND_ACTIVE_DOT_OUTER_RADIUS} fill={haloColor} />
      <circle cx={cx} cy={cy} r={TREND_ACTIVE_DOT_CORE_RADIUS} fill={tasteColor} />
    </g>
  );
}

function WeeklyTrendDot({
  cx,
  cy,
  payload,
  taste,
}: WeeklyTrendActiveDotProps & {
  taste: string;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number' || payload?.isVisible === false) {
    return null;
  }

  return <circle cx={cx} cy={cy} r={TREND_DOT_RADIUS} fill={getTasteColor(taste)} />;
}

function WeeklyTrendCursor({
  height,
  payload,
  points,
  top,
}: WeeklyTrendCursorProps) {
  const x = points?.[0]?.x;
  const activeDatum = payload?.[0]?.payload;

  if (
    typeof x !== 'number' ||
    typeof top !== 'number' ||
    typeof height !== 'number' ||
    activeDatum?.isVisible === false
  ) {
    return null;
  }

  return (
    <line
      x1={x}
      x2={x}
      y1={top}
      y2={top + height}
      stroke="#0F0F0F"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
}

function WeeklyTrendAxisTick({
  labelByPosition,
  payload,
  rangeId,
  tickPositionKeys,
  x,
  y,
}: WeeklyTrendAxisTickProps) {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }

  const valueKey = formatTrendPositionKey(payload?.value);
  const label = labelByPosition[valueKey];

  if (!label) {
    return null;
  }

  const isFirst = tickPositionKeys[0] === valueKey;
  const isLast = tickPositionKeys[tickPositionKeys.length - 1] === valueKey;
  const edgeLabelOffset = rangeId === 'all' ? 6 : 2;

  return (
    <text
      x={x}
      y={y + 10}
      fill="var(--tb-color-text-hint)"
      fontSize="11"
      textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
      dx={isFirst ? edgeLabelOffset : isLast ? -edgeLabelOffset : 0}
    >
      {label}
    </text>
  );
}

function FixedTrendYAxisLabels({
  domain,
  ticks,
}: {
  domain: [number, number];
  ticks: number[];
}) {
  const [domainMin, domainMax] = domain;
  const denominator = Math.max(1, domainMax - domainMin);

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0"
      style={{ width: TREND_CHART_Y_AXIS_WIDTH }}
      aria-hidden="true"
    >
      {ticks.map((tick) => {
        const ratio = (domainMax - tick) / denominator;

        return (
          <span
            key={`trend-y-label-${tick}`}
            className="absolute right-0 -translate-y-1/2 text-[11px] text-[var(--tb-color-text-hint)]"
            style={{
              top: `calc(${TREND_CHART_TOP_MARGIN}px + ((100% - ${TREND_CHART_TOP_MARGIN + TREND_CHART_X_AXIS_HEIGHT}px) * ${ratio}))`,
            }}
          >
            {tick}
          </span>
        );
      })}
    </div>
  );
}

function TasteDirectionIcon({
  taste,
  trend,
  muted = false,
  size = 32,
}: {
  taste: string;
  trend: 'up' | 'down' | 'flat';
  muted?: boolean;
  size?: number;
}) {
  const baseColor = taste === '모든맛' ? '#7A7A7A' : getTasteColor(taste);
  const strokeColor = muted ? 'rgba(255,255,255,0.88)' : '#FFFFFF';
  const backgroundColor = muted ? mixHexColors(baseColor, '#FFFFFF', 0.58) : baseColor;
  const path =
    trend === 'up'
      ? 'M4 12L12 4M12 4H6M12 4V10'
      : trend === 'down'
        ? 'M4 4L12 12M12 12H6M12 12V6'
        : 'M4 8H12M12 8L9 5M12 8L9 11';

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        backgroundColor,
        opacity: muted ? 0.55 : 1,
      }}
      aria-hidden="true"
    >
      <svg width={Math.round(size * 0.58)} height={Math.round(size * 0.58)} viewBox="0 0 16 16" fill="none">
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface WeeklyTrendTooltipEntry {
  dataKey?: string | number;
  payload?: ProfileChangeTrendPoint;
  value?: number | string;
}

function WeeklyTrendTooltip({
  active,
  payload,
  visibleTasteLabels,
}: {
  active?: boolean;
  payload?: WeeklyTrendTooltipEntry[];
  visibleTasteLabels: string[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const activeDatum = payload[0]?.payload;

  if (!activeDatum || !activeDatum.isVisible || !activeDatum.event.trim()) {
    return null;
  }

  const uniqueEntries = visibleTasteLabels.map((taste) => ({
    dataKey: taste,
    value: activeDatum[taste],
  })).filter((entry): entry is { dataKey: string; value: number | string } =>
    typeof entry.value !== 'undefined',
  );

  return (
    <div className="min-w-[116px] rounded-[12px] bg-white px-[12px] py-[10px] shadow-[var(--tb-shadow-soft)]">
      <p className="mb-[6px] text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
        {activeDatum.event}
      </p>
      <div className="flex flex-col gap-[5px]">
        {uniqueEntries.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <span
                className="size-[8px] rounded-full"
                style={{ backgroundColor: getTasteColor(entry.dataKey) }}
              />
              <span className="text-[12px] font-medium text-[var(--tb-color-text-secondary)]">
                {entry.dataKey}
              </span>
            </div>
            <span
              className="text-[12px] font-semibold"
              style={{ color: getTasteColor(entry.dataKey) }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildInsights(
  myTasteData: TasteMeasurementEntry[],
  totalSensitivity: number,
  avgSensitivity: number,
) {
  const strongestTaste = myTasteData.reduce((strongest, entry) =>
    entry.valueMm > strongest.valueMm ? entry : strongest,
  );
  const weakestTaste = myTasteData.reduce((weakest, entry) =>
    entry.valueMm < weakest.valueMm ? entry : weakest,
  );
  const biggestDeltaTaste = myTasteData.reduce((biggestDelta, entry) =>
    Math.abs(entry.deltaMm) > Math.abs(biggestDelta.deltaMm) ? entry : biggestDelta,
  );

  return [
    {
      taste: strongestTaste.label,
      text: `${strongestTaste.label}에 빠르게 반응하는 프로필이에요`,
      type: 'high' as const,
    },
    {
      taste: biggestDeltaTaste.label,
      text: `${biggestDeltaTaste.label} 변화가 눈에 띄게 나타났어요. 다음 다이닝에 반영됩니다`,
      type: biggestDeltaTaste.deltaMm >= 0 ? 'up' as const : 'low' as const,
    },
    {
      taste: weakestTaste.label,
      text: `${weakestTaste.label}은 천천히 쌓이는 구성이 더 편안할 수 있어요`,
      type: 'low' as const,
    },
    {
      taste: strongestTaste.label,
      text: totalSensitivity > avgSensitivity
        ? '전체적으로 평균보다 민감한 프로필이에요'
        : '전체적으로 평균에 가까운 균형 잡힌 프로필이에요',
      type: 'high' as const,
    },
  ];
}

function formatTrendDateLabel(value: string) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';

  return `${month}.${day}`;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startOfYear(value: Date) {
  return new Date(value.getFullYear(), 0, 1);
}

function startOfWeekMonday(value: Date) {
  const next = startOfDay(value);
  const day = next.getDay();
  const distanceFromMonday = (day + 6) % 7;
  next.setDate(next.getDate() - distanceFromMonday);
  return startOfDay(next);
}

function endOfWeekMonday(value: Date) {
  return addDays(startOfWeekMonday(value), 6);
}

function endOfYear(value: Date) {
  return new Date(value.getFullYear(), 11, 31);
}

function addMonths(value: Date, amount: number) {
  const next = new Date(value.getFullYear(), value.getMonth() + amount, 1);
  return startOfDay(next);
}

function formatTrendWeekdayLabel(value: Date) {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(value);
}

function formatTrendMonthDayAxisLabel(value: Date) {
  const month = value.getMonth() + 1;
  const day = value.getDate();
  return `${month}.${day}`;
}

function formatTrendMonthMondayAxisLabel(value: Date) {
  return `월 ${value.getDate()}`;
}

function formatTrendMonthAxisLabel(value: Date) {
  return `${value.getMonth() + 1}월`;
}

function formatTrendAllAxisLabel(value: Date, spanDays: number) {
  if (spanDays > 366) {
    return `${value.getFullYear()}.${String(value.getMonth() + 1).padStart(2, '0')}`;
  }

  if (spanDays > 31) {
    return formatTrendMonthAxisLabel(value);
  }

  return formatTrendMonthDayAxisLabel(value);
}

function formatTrendRangeDate(value: Date) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';

  return `${year}. ${month}. ${day}.`;
}

function formatTrendCompactRangeDate(value: Date) {
  return `${value.getFullYear()}.${value.getMonth() + 1}.${value.getDate()}.`;
}

function formatTrendYearRangeLabel(value: Date) {
  return `${value.getFullYear()}`;
}

function formatTrendYearMonthRangeLabel(value: Date) {
  return `${value.getFullYear()}년 ${value.getMonth() + 1}월`;
}

function formatTrendQuarterRangeLabel(startValue: Date, endValue: Date) {
  const startYear = startValue.getFullYear();
  const endYear = endValue.getFullYear();
  const startMonth = startValue.getMonth() + 1;
  const endMonth = endValue.getMonth() + 1;

  if (startYear === endYear) {
    return `${startYear}년 ${startMonth}월~${endMonth}월`;
  }

  return `${startYear}년 ${startMonth}월~${endYear}년 ${endMonth}월`;
}

function formatTrendCurrentQuarterLabel(value: Date) {
  const year = value.getFullYear();
  const quarterStartMonth = Math.floor(value.getMonth() / 3) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;

  return `${year}년 ${quarterStartMonth}월~${quarterEndMonth}월`;
}

function formatTrendAllRangeLabel(startValue: Date, endValue: Date) {
  const startYear = startValue.getFullYear();
  const endYear = endValue.getFullYear();

  if (startYear === endYear) {
    return `${startYear}`;
  }

  return `${startYear}~${endYear}`;
}

function formatTrendPositionKey(value: number | string | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return value.toFixed(4);
}

function getTrendDurationDays(window: TrendViewWindow) {
  return Math.max(1, Math.round((window.endMs - window.startMs) / DAY_IN_MS) + 1);
}

function getTrendDataBounds(
  snapshots: TasteMeasurementSnapshot[],
  fallbackSnapshot: TasteMeasurementSnapshot,
) {
  const safeSnapshots = snapshots.length > 0 ? snapshots : [fallbackSnapshot];
  const timestamps = safeSnapshots.map((snapshot) => startOfDay(new Date(snapshot.measuredAt)).getTime());
  const earliestMs = Math.min(...timestamps);
  const latestMs = Math.max(...timestamps);

  return {
    earliestMs,
    latestMs,
  };
}

function getTrendNavigationBounds(
  dataBounds: { earliestMs: number; latestMs: number },
) {
  const paddedEarliestMs = dataBounds.latestMs - 730 * DAY_IN_MS;
  const paddedLatestMs = Math.max(
    dataBounds.latestMs,
    endOfWeekMonday(new Date(dataBounds.latestMs)).getTime(),
    endOfYear(new Date(dataBounds.latestMs)).getTime(),
  );

  return {
    earliestMs: Math.min(dataBounds.earliestMs, paddedEarliestMs),
    latestMs: paddedLatestMs,
  };
}

function createTrendViewWindow(
  endMs: number,
  durationDays: number,
) {
  const safeEndMs = startOfDay(new Date(endMs)).getTime();
  const safeDurationDays = Math.max(1, Math.round(durationDays));

  return {
    startMs: safeEndMs - (safeDurationDays - 1) * DAY_IN_MS,
    endMs: safeEndMs,
  };
}

function createTrendViewWindowFromCenter(
  centerMs: number,
  durationDays: number,
) {
  const safeCenterMs = startOfDay(new Date(centerMs)).getTime();
  const safeDurationDays = Math.max(1, Math.round(durationDays));
  const halfSpanBeforeDays = Math.floor((safeDurationDays - 1) / 2);
  const halfSpanAfterDays = safeDurationDays - 1 - halfSpanBeforeDays;

  return {
    startMs: safeCenterMs - halfSpanBeforeDays * DAY_IN_MS,
    endMs: safeCenterMs + halfSpanAfterDays * DAY_IN_MS,
  };
}

function clampTrendViewWindow(
  window: TrendViewWindow,
  bounds: { earliestMs: number; latestMs: number },
) {
  const durationMs = Math.max(DAY_IN_MS, window.endMs - window.startMs + DAY_IN_MS);
  const totalSpanMs = Math.max(DAY_IN_MS, bounds.latestMs - bounds.earliestMs + DAY_IN_MS);

  if (durationMs >= totalSpanMs) {
    return {
      startMs: bounds.earliestMs,
      endMs: bounds.latestMs,
    };
  }

  let startMs = window.startMs;
  let endMs = window.endMs;

  if (startMs < bounds.earliestMs) {
    startMs = bounds.earliestMs;
    endMs = startMs + durationMs - DAY_IN_MS;
  }

  if (endMs > bounds.latestMs) {
    endMs = bounds.latestMs;
    startMs = endMs - durationMs + DAY_IN_MS;
  }

  return {
    startMs,
    endMs,
  };
}

function getTrendPresetDurationDays(
  rangeId: TrendRangeId,
  dataBounds: { earliestMs: number; latestMs: number },
) {
  const totalSpanDays = Math.max(1, Math.round((dataBounds.latestMs - dataBounds.earliestMs) / DAY_IN_MS) + 1);
  const option = TREND_RANGE_OPTIONS.find((item) => item.id === rangeId);

  if (!option || rangeId === 'all' || option.days === null) {
    return totalSpanDays;
  }

  return option.days;
}

function createTrendViewWindowFromRange(
  rangeId: TrendRangeId,
  dataBounds: { earliestMs: number; latestMs: number },
  navigationBounds: { earliestMs: number; latestMs: number },
) {
  if (rangeId === 'week') {
    const startDate = startOfWeekMonday(new Date(dataBounds.latestMs));
    const endDate = addDays(startDate, 6);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      },
      navigationBounds,
    );
  }

  if (rangeId === 'year') {
    const endDate = endOfYear(new Date(dataBounds.latestMs));
    const startDate = startOfYear(endDate);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      },
      navigationBounds,
    );
  }

  if (rangeId === 'all') {
    const startDate = startOfYear(new Date(dataBounds.earliestMs));
    const endDate = endOfYear(new Date(dataBounds.latestMs));

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endDate.getTime(),
      },
      navigationBounds,
    );
  }

  const durationDays = getTrendPresetDurationDays(rangeId, dataBounds);

  return clampTrendViewWindow(
    createTrendViewWindow(dataBounds.latestMs, durationDays),
    navigationBounds,
  );
}

function deriveTrendRangeIdFromWindow(
  window: TrendViewWindow,
  dataBounds: { earliestMs: number; latestMs: number },
): TrendRangeId {
  const durationDays = getTrendDurationDays(window);
  const totalSpanDays = Math.max(1, Math.round((dataBounds.latestMs - dataBounds.earliestMs) / DAY_IN_MS) + 1);
  const coversAllTimeline = window.startMs <= dataBounds.earliestMs && window.endMs >= dataBounds.latestMs;

  if (coversAllTimeline && totalSpanDays > 366) {
    return 'all';
  }

  if (durationDays <= 9) {
    return 'week';
  }

  if (durationDays <= 45) {
    return 'month';
  }

  if (durationDays <= 120) {
    return 'quarter';
  }

  if (durationDays <= 450) {
    return 'year';
  }

  return 'all';
}

function shiftTrendViewWindow(
  window: TrendViewWindow,
  rangeId: TrendRangeId,
  direction: -1 | 1,
  bounds: { earliestMs: number; latestMs: number },
) {
  if (rangeId === 'year') {
    const targetYear = new Date(window.startMs).getFullYear() + direction;
    return clampTrendViewWindow(
      {
        startMs: startOfYear(new Date(targetYear, 0, 1)).getTime(),
        endMs: endOfYear(new Date(targetYear, 0, 1)).getTime(),
      },
      bounds,
    );
  }

  if (rangeId === 'quarter') {
    return clampTrendViewWindow(
      {
        startMs: addMonths(new Date(window.startMs), direction).getTime(),
        endMs: addMonths(new Date(window.endMs), direction).getTime(),
      },
      bounds,
    );
  }

  const shiftDays = (() => {
    switch (rangeId) {
      case 'week':
        return 1;
      case 'month':
        return 7;
      case 'all':
        return Math.max(1, Math.round((getTrendDurationDays(window) - 1) / 4));
      default:
        return Math.max(1, Math.round(getTrendDurationDays(window) * 0.78));
    }
  })();

  return clampTrendViewWindow(
    {
      startMs: window.startMs + shiftDays * DAY_IN_MS * direction,
      endMs: window.endMs + shiftDays * DAY_IN_MS * direction,
    },
    bounds,
  );
}

function scaleTrendViewWindow(
  window: TrendViewWindow,
  scaleFactor: number,
  bounds: { earliestMs: number; latestMs: number },
) {
  const currentDurationDays = getTrendDurationDays(window);
  const totalSpanDays = Math.max(1, Math.round((bounds.latestMs - bounds.earliestMs) / DAY_IN_MS) + 1);
  const targetDurationDays = Math.min(
    Math.max(3, Math.round(currentDurationDays * scaleFactor)),
    Math.max(totalSpanDays, 540),
  );
  const centerMs = window.startMs + (window.endMs - window.startMs) / 2;

  return clampTrendViewWindow(
    createTrendViewWindowFromCenter(centerMs, targetDurationDays),
    bounds,
  );
}

function getVisibleTrendPositions(count: number) {
  if (count <= 0) {
    return [] as number[];
  }

  if (count === 1) {
    return [0.5];
  }

  if (count === 2) {
    return [1 / 3, 1];
  }

  if (count === 3) {
    return [1 / 3, 2 / 3, 1];
  }

  return Array.from({ length: count }, (_, index) => index / (count - 1));
}

function buildTrendGuideFromDates(
  dates: Date[],
  formatter: (value: Date) => string,
  window: TrendViewWindow,
) {
  const safeDates = dates.length > 0 ? dates : [new Date()];
  const denominator = Math.max(DAY_IN_MS, window.endMs - window.startMs);
  const positions = safeDates.map((date) => {
    const rawPosition = (startOfDay(date).getTime() - window.startMs) / denominator;
    return Math.max(0, Math.min(1, Number(rawPosition.toFixed(4))));
  });
  const labelByPosition = positions.reduce<Record<string, string>>((accumulator, position, index) => {
    accumulator[formatTrendPositionKey(position)] = formatter(safeDates[index]);
    return accumulator;
  }, {});

  return {
    tickPositions: positions,
    gridPositions: positions,
    labelByPosition,
  };
}

function buildEqualYearMonthGuide(window: TrendViewWindow) {
  const year = new Date(window.startMs).getFullYear();
  const dates = Array.from({ length: 12 }, (_, index) => new Date(year, index, 1));
  const positions = dates.map((_, index) => Number((index / 12).toFixed(4)));
  const labelByPosition = positions.reduce<Record<string, string>>((accumulator, position, index) => {
    accumulator[formatTrendPositionKey(position)] = formatTrendMonthAxisLabel(dates[index]);
    return accumulator;
  }, {});

  return {
    tickPositions: positions,
    gridPositions: positions,
    labelByPosition,
  };
}

function sanitizeTrendGuide(guide: {
  tickPositions: number[];
  gridPositions: number[];
  labelByPosition: Record<string, string>;
}) {
  const dedupedGridPositions = guide.gridPositions.filter((position, index, positions) => {
    return index === 0 || Math.abs(position - positions[index - 1]) > 0.0005;
  });

  return {
    ...guide,
    gridPositions: dedupedGridPositions,
  };
}

function appendTrendGridBoundary(
  guide: {
    tickPositions: number[];
    gridPositions: number[];
    labelByPosition: Record<string, string>;
  },
  boundaryPosition: number,
) {
  const hasBoundary = guide.gridPositions.some((position) => Math.abs(position - boundaryPosition) <= 0.0005);

  if (hasBoundary) {
    return guide;
  }

  return {
    ...guide,
    gridPositions: [...guide.gridPositions, boundaryPosition],
  };
}

function appendTrendBoundaryTick(
  guide: {
    tickPositions: number[];
    gridPositions: number[];
    labelByPosition: Record<string, string>;
  },
  boundaryPosition: number,
  label: string,
) {
  const boundaryKey = formatTrendPositionKey(boundaryPosition);
  const hasBoundaryTick = guide.tickPositions.some((position) => Math.abs(position - boundaryPosition) <= 0.0005);

  return {
    tickPositions: hasBoundaryTick ? guide.tickPositions : [...guide.tickPositions, boundaryPosition],
    gridPositions: guide.gridPositions,
    labelByPosition: {
      ...guide.labelByPosition,
      [boundaryKey]: label,
    },
  };
}

function buildMonthBoundaryDatesWithinWindow(window: TrendViewWindow) {
  const startDate = startOfDay(new Date(window.startMs));
  const endDate = startOfDay(new Date(window.endMs));
  const firstBoundary =
    startOfMonth(startDate).getTime() < startDate.getTime()
      ? addMonths(startOfMonth(startDate), 1)
      : startOfMonth(startDate);
  const dates: Date[] = [];

  for (
    let cursor = firstBoundary;
    cursor.getTime() <= endDate.getTime();
    cursor = addMonths(cursor, 1)
  ) {
    dates.push(cursor);
  }

  return dates;
}

function buildWeeklyMondayDatesWithinWindow(window: TrendViewWindow) {
  const startDate = startOfDay(new Date(window.startMs));
  const endDate = startOfDay(new Date(window.endMs));
  const firstMonday = startOfWeekMonday(startDate);
  const firstVisibleMonday =
    firstMonday.getTime() < startDate.getTime() ? addDays(firstMonday, 7) : firstMonday;
  const dates: Date[] = [];

  for (
    let cursor = firstVisibleMonday;
    cursor.getTime() <= endDate.getTime();
    cursor = addDays(cursor, 7)
  ) {
    dates.push(cursor);
  }

  return dates;
}

function buildYearBoundaryDatesWithinWindow(window: TrendViewWindow) {
  const startDate = startOfDay(new Date(window.startMs));
  const endDate = startOfDay(new Date(window.endMs));
  const firstBoundary = startOfYear(new Date(startDate.getFullYear() + 1, 0, 1));
  const dates: Date[] = [];

  for (
    let cursor = firstBoundary;
    cursor.getTime() <= endDate.getTime();
    cursor = startOfYear(new Date(cursor.getFullYear() + 1, 0, 1))
  ) {
    dates.push(cursor);
  }

  return dates;
}

function buildTrendPeriodGuide(
  rangeId: TrendRangeId,
  window: TrendViewWindow,
) {
  const startDate = startOfDay(new Date(window.startMs));
  const endDate = startOfDay(new Date(window.endMs));

  switch (rangeId) {
    case 'week': {
      const dates = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
      return sanitizeTrendGuide(buildTrendGuideFromDates(dates, formatTrendWeekdayLabel, window));
    }
    case 'month': {
      const dates = buildWeeklyMondayDatesWithinWindow(window);
      return sanitizeTrendGuide(buildTrendGuideFromDates(dates, formatTrendMonthMondayAxisLabel, window));
    }
    case 'quarter': {
      const dates = buildMonthBoundaryDatesWithinWindow(window);
      const nextBoundaryLabel =
        dates.length > 0
          ? formatTrendMonthAxisLabel(addMonths(dates[dates.length - 1], 1))
          : formatTrendMonthAxisLabel(addMonths(endDate, 1));
      return appendTrendBoundaryTick(appendTrendGridBoundary(
        sanitizeTrendGuide(buildTrendGuideFromDates(dates, formatTrendMonthAxisLabel, window)),
        1,
      ), 1, nextBoundaryLabel);
    }
    case 'year': {
      return sanitizeTrendGuide(buildEqualYearMonthGuide(window));
    }
    case 'all':
    default: {
      const dates = buildYearBoundaryDatesWithinWindow(window);
      let guide = sanitizeTrendGuide(
        buildTrendGuideFromDates(dates, formatTrendYearRangeLabel, window),
      );
      const startYearLabel = formatTrendYearRangeLabel(startDate);
      const endBoundaryYearLabel = formatTrendYearRangeLabel(
        startOfYear(new Date(endDate.getFullYear() + 1, 0, 1)),
      );

      guide = appendTrendBoundaryTick(appendTrendGridBoundary(guide, 0), 0, startYearLabel);
      guide = appendTrendGridBoundary(guide, 1);

      guide = appendTrendBoundaryTick(guide, 1, endBoundaryYearLabel);

      return sanitizeTrendGuide(guide);
    }
  }
}

function filterMeasurementsByWindow(
  snapshots: TasteMeasurementSnapshot[],
  window: TrendViewWindow,
) {
  const filteredSnapshots = snapshots.filter((snapshot) => {
    const measuredAt = startOfDay(new Date(snapshot.measuredAt)).getTime();
    return measuredAt >= window.startMs && measuredAt <= window.endMs;
  });

  return filteredSnapshots;
}

function buildTrendRangeLabel(window: TrendViewWindow | null, rangeId: TrendRangeId) {
  if (!window) {
    return '측정 데이터 없음';
  }

  const startDate = new Date(window.startMs);
  const endDate = new Date(window.endMs);

  if (rangeId === 'week') {
    return `${formatTrendCompactRangeDate(startDate)}~${formatTrendCompactRangeDate(endDate)}`;
  }

  if (rangeId === 'month') {
    return formatTrendYearMonthRangeLabel(endDate);
  }

  if (rangeId === 'quarter') {
    return formatTrendCurrentQuarterLabel(endDate);
  }

  if (rangeId === 'year') {
    return formatTrendYearRangeLabel(startDate);
  }

  if (rangeId === 'all') {
    return formatTrendAllRangeLabel(startDate, endDate);
  }

  return `${formatTrendRangeDate(startDate)} - ${formatTrendRangeDate(endDate)}`;
}

function buildTrendAxisConfig(
  points: ProfileChangeTrendPoint[],
  visibleTasteLabels: string[],
) {
  const values = points.flatMap((point) =>
    visibleTasteLabels
      .map((label) => point[label as keyof ProfileChangeTrendPoint])
      .filter((value): value is number => typeof value === 'number'),
  );

  if (values.length === 0) {
    return {
      domain: [0, 100] as [number, number],
      ticks: [20, 40, 60, 80, 100],
    };
  }

  const minimumValue = Math.min(...values);
  const maximumValue = Math.max(...values);
  const basePadding = minimumValue === maximumValue ? 8 : Math.max(4, Math.ceil((maximumValue - minimumValue) * 0.16));
  const rawMin = Math.max(0, minimumValue - basePadding);
  const rawMax = Math.min(100, maximumValue + basePadding);
  const tickStep = rawMax - rawMin <= 20 ? 5 : rawMax - rawMin <= 40 ? 10 : 20;
  const domainMin = Math.max(0, Math.floor(rawMin / tickStep) * tickStep);
  const domainMax = Math.min(100, Math.ceil(rawMax / tickStep) * tickStep);
  const ticks: number[] = [];

  for (let tick = domainMin; tick <= domainMax; tick += tickStep) {
    ticks.push(tick);
  }

  return {
    domain: [domainMin, domainMax] as [number, number],
    ticks,
  };
}

function createTrendPoint(
  snapshot: TasteMeasurementSnapshot,
  eventLabel: string,
  isVisible: boolean,
  xPosition: number,
): ProfileChangeTrendPoint {
  const point: ProfileChangeTrendPoint = {
    event: eventLabel,
    isVisible,
    xPosition,
    단맛: 0,
    신맛: 0,
    쓴맛: 0,
    짠맛: 0,
    감칠맛: 0,
    지방맛: 0,
  };

  for (const entry of getTasteMeasurementEntries(snapshot)) {
    point[entry.label] = entry.score;
  }

  return point;
}

function mergeMeasurementSnapshots(
  snapshots: TasteMeasurementSnapshot[],
  latestSnapshot: TasteMeasurementSnapshot | null,
) {
  const mergedSnapshots = new Map<string, TasteMeasurementSnapshot>();

  snapshots.forEach((snapshot) => {
    mergedSnapshots.set(snapshot.measuredAt, snapshot);
  });

  if (latestSnapshot) {
    mergedSnapshots.set(latestSnapshot.measuredAt, latestSnapshot);
  }

  return [...mergedSnapshots.values()]
    .sort(
      (left, right) =>
        new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
    )
    .slice(-6);
}

function buildProfileChangeTrendData(
  snapshots: TasteMeasurementSnapshot[],
  window: TrendViewWindow | null,
  rangeId: TrendRangeId,
) {
  const sortedSnapshots = [...snapshots]
    .sort(
      (left, right) =>
        new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
    );

  if (sortedSnapshots.length === 0 || !window) {
    return [] as ProfileChangeTrendPoint[];
  }

  const projectByWindow = (snapshot: TasteMeasurementSnapshot) => {
    const measuredAt = startOfDay(new Date(snapshot.measuredAt)).getTime();

    if (rangeId === 'year') {
      const measuredDate = new Date(measuredAt);
      const year = new Date(window.startMs).getFullYear();
      const monthIndex = measuredDate.getMonth();
      const monthStart = startOfDay(new Date(year, monthIndex, 1)).getTime();
      const nextMonthStart = startOfDay(
        monthIndex === 11 ? new Date(year + 1, 0, 1) : new Date(year, monthIndex + 1, 1),
      ).getTime();
      const monthSpan = Math.max(DAY_IN_MS, nextMonthStart - monthStart);
      const monthProgress = (measuredAt - monthStart) / monthSpan;
      const rawPosition = monthIndex / 12 + monthProgress / 12;

      return Math.max(0, Math.min(1, Number(rawPosition.toFixed(4))));
    }

    if (rangeId === 'all') {
      const denominator = Math.max(DAY_IN_MS, window.endMs - window.startMs);
      const rawPosition = (measuredAt - window.startMs) / denominator;

      return Math.max(0, Math.min(1, Number(rawPosition.toFixed(4))));
    }

    const denominator = Math.max(DAY_IN_MS, window.endMs - window.startMs);
    const rawPosition = (measuredAt - window.startMs) / denominator;
    const clampedPosition = Math.max(0, Math.min(1, Number(rawPosition.toFixed(4))));

    return clampedPosition;
  };
  const visiblePositions = sortedSnapshots.map((snapshot) => projectByWindow(snapshot));
  const visiblePoints = sortedSnapshots.map((snapshot, index) =>
    createTrendPoint(
      snapshot,
      formatTrendDateLabel(snapshot.measuredAt),
      true,
      visiblePositions[index] ?? 1,
    ),
  );

  return visiblePoints;
}

function buildTasteStrengthMap(snapshot: TasteMeasurementSnapshot) {
  return getTasteMeasurementEntries(snapshot).reduce<Record<TasteId, number>>((accumulator, entry) => {
    accumulator[entry.id] = entry.score / 100;
    return accumulator;
  }, {} as Record<TasteId, number>);
}

function scoreDishFit(
  snapshot: TasteMeasurementSnapshot,
  dish: RestaurantContentDish,
  strongestTasteId: TasteId,
) {
  const tasteStrengthMap = buildTasteStrengthMap(snapshot);
  const overlapScore =
    TASTE_IDS.reduce((sum, tasteId) => sum + tasteStrengthMap[tasteId] * dish.tasteVector[tasteId], 0) /
    TASTE_IDS.length;
  const focusScore = tasteStrengthMap[strongestTasteId] * dish.tasteVector[strongestTasteId];

  return Math.round(Math.min(0.99, overlapScore * 0.72 + focusScore * 0.18 + dish.confidence * 0.1) * 100);
}

function buildRecommendationReason(
  dish: RestaurantContentDish,
  strongestTaste: TasteMeasurementEntry,
  weakestTaste: TasteMeasurementEntry,
) {
  const dominantTasteLabel = TASTE_TOKENS[dish.dominantTaste].label;
  const ingredientLabel = dish.ingredients.slice(0, 2).join(' · ');

  if (dish.dominantTaste === strongestTaste.id) {
    return `${strongestTaste.label} 반응이 또렷한 지금은 ${dominantTasteLabel} 중심의 ${dish.title}이 더 선명하게 읽힐 가능성이 높아요.${ingredientLabel ? ` ${ingredientLabel} 구성이 그 결을 자연스럽게 밀어줍니다.` : ''}`;
  }

  if (dish.dominantTaste === weakestTaste.id) {
    return `${weakestTaste.label}은 천천히 쌓이는 편이라 ${dish.title}처럼 ${dish.courseLabel.toLowerCase()} 흐름에서 부드럽게 이어지는 구성이 더 편안할 수 있어요.${ingredientLabel ? ` ${ingredientLabel}처럼 재료가 겹겹이 이어지는 점도 장점입니다.` : ''}`;
  }

  return `${dish.title}은 ${dominantTasteLabel} 축이 중심이고 현재 프로필과 비교적 고르게 맞는 실제 메뉴예요.${ingredientLabel ? ` 특히 ${ingredientLabel} 조합이 현재 반응과 잘 맞을 가능성이 있어요.` : ''}`;
}

function buildRealMenuRecommendations(
  snapshot: TasteMeasurementSnapshot,
  dishes: RestaurantContentDish[],
) {
  if (dishes.length === 0) {
    return [] as RealMenuRecommendation[];
  }

  const strongestTaste = getStrongestTasteMeasurement(snapshot);
  const weakestTaste = getWeakestTasteMeasurement(snapshot);
  const seenDishKeys = new Set<string>();
  const seenRestaurants = new Set<string>();
  const rankedRecommendations = dishes
    .map<RealMenuRecommendation>((dish) => ({
      id: dish.id,
      title: dish.title,
      subtitle: dish.subtitle,
      restaurant: dish.restaurant,
      chef: dish.chef,
      courseLabel: dish.courseLabel,
      ingredients: dish.ingredients,
      tasteLabel: TASTE_TOKENS[dish.dominantTaste].label,
      fitScore: scoreDishFit(snapshot, dish, strongestTaste.id),
      reason: buildRecommendationReason(dish, strongestTaste, weakestTaste),
    }))
    .sort((left, right) => right.fitScore - left.fitScore);
  const diversified: RealMenuRecommendation[] = [];

  for (const item of rankedRecommendations) {
    const dishKey = `${item.restaurant}:${item.title}`;

    if (seenDishKeys.has(dishKey) || seenRestaurants.has(item.restaurant)) {
      continue;
    }

    seenDishKeys.add(dishKey);
    seenRestaurants.add(item.restaurant);
    diversified.push(item);

    if (diversified.length === 3) {
      return diversified;
    }
  }

  for (const item of rankedRecommendations) {
    const dishKey = `${item.restaurant}:${item.title}`;

    if (seenDishKeys.has(dishKey)) {
      continue;
    }

    seenDishKeys.add(dishKey);
    diversified.push(item);

    if (diversified.length === 3) {
      break;
    }
  }

  return diversified.slice(0, 3);
}

// 6각형 꼭짓점 좌표 생성 (상단 시작, 시계 방향)
function hexPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI / 3) * i - Math.PI / 2 - Math.PI / 6;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function hexPolygon(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => hexPoint(cx, cy, r, i))
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

function trianglePolygon(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
) {
  return Array.from({ length: 3 }, (_, index) => {
    const angle = ((startAngleDeg + 120 * index) * Math.PI) / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    return `${x},${y}`;
  }).join(' ');
}

function movePointTowardCenter(
  cx: number,
  cy: number,
  x: number,
  y: number,
  offset: number,
): [number, number] {
  const dx = cx - x;
  const dy = cy - y;
  const distance = Math.hypot(dx, dy);
  const safeOffset = Math.min(offset, distance);

  if (distance === 0 || safeOffset === 0) {
    return [x, y];
  }

  return [
    x + (dx / distance) * safeOffset,
    y + (dy / distance) * safeOffset,
  ];
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function solveCubicBezierY(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const clampedProgress = clampUnit(progress);

  if (clampedProgress === 0 || clampedProgress === 1) {
    return clampedProgress;
  }

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  let t = clampedProgress;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const currentX = sampleCurveX(t) - clampedProgress;
    const currentSlope = sampleCurveDerivativeX(t);

    if (Math.abs(currentX) < 0.0001 || Math.abs(currentSlope) < 0.000001) {
      break;
    }

    t -= currentX / currentSlope;
  }

  let lowerBound = 0;
  let upperBound = 1;
  t = clampUnit(t);

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const currentX = sampleCurveX(t);

    if (Math.abs(currentX - clampedProgress) < 0.00001) {
      break;
    }

    if (currentX > clampedProgress) {
      upperBound = t;
    } else {
      lowerBound = t;
    }

    t = (lowerBound + upperBound) / 2;
  }

  return sampleCurveY(t);
}

function getRadarAnimationProgress(progress: number) {
  return solveCubicBezierY(progress, 0.3, 0, 0.1, 1);
}

function getRoundedClosedCorners(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadius: number,
) {
  if (points.length < 3) {
    return [];
  }

  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length] ?? point;
    const next = points[(index + 1) % points.length] ?? point;
    const incomingDx = previous[0] - point[0];
    const incomingDy = previous[1] - point[1];
    const outgoingDx = next[0] - point[0];
    const outgoingDy = next[1] - point[1];
    const incomingDistance = Math.hypot(incomingDx, incomingDy) || 1;
    const outgoingDistance = Math.hypot(outgoingDx, outgoingDy) || 1;
    const safeRadius = Math.min(cornerRadius, incomingDistance / 2, outgoingDistance / 2);

    return {
      control: point,
      entry: [
        point[0] + (incomingDx / incomingDistance) * safeRadius,
        point[1] + (incomingDy / incomingDistance) * safeRadius,
      ] as const,
      exit: [
        point[0] + (outgoingDx / outgoingDistance) * safeRadius,
        point[1] + (outgoingDy / outgoingDistance) * safeRadius,
      ] as const,
    };
  });
}

function buildRoundedClosedPath(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadius: number,
) {
  const roundedCorners = getRoundedClosedCorners(points, cornerRadius);

  const firstCorner = roundedCorners[0];

  if (!firstCorner) {
    return '';
  }

  const commands = [`M ${firstCorner.exit[0]} ${firstCorner.exit[1]}`];

  for (let index = 1; index < roundedCorners.length; index += 1) {
    const corner = roundedCorners[index];

    if (!corner) {
      continue;
    }

    commands.push(`L ${corner.entry[0]} ${corner.entry[1]}`);
    commands.push(`Q ${corner.control[0]} ${corner.control[1]} ${corner.exit[0]} ${corner.exit[1]}`);
  }

  commands.push(`L ${firstCorner.entry[0]} ${firstCorner.entry[1]}`);
  commands.push(
    `Q ${firstCorner.control[0]} ${firstCorner.control[1]} ${firstCorner.exit[0]} ${firstCorner.exit[1]}`,
  );
  commands.push('Z');

  return commands.join(' ');
}

function buildRoundedClosedSegmentPaths(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadius: number,
) {
  const roundedCorners = getRoundedClosedCorners(points, cornerRadius);

  return roundedCorners.map((corner, index) => {
    const nextCorner = roundedCorners[(index + 1) % roundedCorners.length];

    if (!corner || !nextCorner) {
      return '';
    }

    return [
      `M ${corner.exit[0]} ${corner.exit[1]}`,
      `L ${nextCorner.entry[0]} ${nextCorner.entry[1]}`,
      `Q ${nextCorner.control[0]} ${nextCorner.control[1]} ${nextCorner.exit[0]} ${nextCorner.exit[1]}`,
    ].join(' ');
  });
}

// 커스텀 6각형 레이더 차트
function HexRadarChart({
  myTasteData,
  shouldAnimate = true,
}: {
  myTasteData: TasteMeasurementEntry[];
  shouldAnimate?: boolean;
}) {
  const cx = 160;
  const cy = 145;
  const maxR = 100;
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridStrokeColor = mixHexColors(RADAR_CHART.gridColor, '#FFFFFF', 0.45);
  const profileAnimationDurationMs = (60 / 60) * 1000;
  const centerStarRadius = 18 * (25 / 27);
  const centerStarUp = trianglePolygon(cx, cy, centerStarRadius, -90);
  const centerStarDown = trianglePolygon(cx, cy, centerStarRadius, 90);
  const gradientIdPrefix = React.useId().replace(/:/g, '');
  const radarMotionFrameRef = useRef<number | null>(null);
  const [profileMotionProgress, setProfileMotionProgress] = useState(0);
  const tasteProfileAnimationKey = myTasteData
    .map(({ label, score, averageScore }) => `${label}:${score}:${averageScore}`)
    .join('|');

  useEffect(() => {
    if (radarMotionFrameRef.current !== null) {
      cancelAnimationFrame(radarMotionFrameRef.current);
      radarMotionFrameRef.current = null;
    }

    if (!shouldAnimate) {
      setProfileMotionProgress(0);
      return;
    }

    if (
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setProfileMotionProgress(1);
      return;
    }

    setProfileMotionProgress(0);
    let animationStart: number | null = null;
    const animateProfile = (timestamp: number) => {
      if (animationStart === null) {
        animationStart = timestamp;
      }

      const elapsed = timestamp - animationStart;
      const rawProgress = Math.min(elapsed / profileAnimationDurationMs, 1);

      setProfileMotionProgress(rawProgress);

      if (rawProgress < 1) {
        radarMotionFrameRef.current = requestAnimationFrame(animateProfile);
        return;
      }

      radarMotionFrameRef.current = null;
    };

    radarMotionFrameRef.current = requestAnimationFrame(animateProfile);

    return () => {
      if (radarMotionFrameRef.current !== null) {
        cancelAnimationFrame(radarMotionFrameRef.current);
        radarMotionFrameRef.current = null;
      }
    };
  }, [profileAnimationDurationMs, shouldAnimate, tasteProfileAnimationKey]);

  const animatedProfileProgress = getRadarAnimationProgress(profileMotionProgress);

  // 나의 민감도 폴리곤 좌표
  const myPoints = myTasteData.map((d, i) => {
    const r = (d.score / 100) * maxR * animatedProfileProgress;
    return hexPoint(cx, cy, r, i);
  });
  const myNodePoints = myPoints.map(([x, y]) =>
    movePointTowardCenter(cx, cy, x, y, 10 * animatedProfileProgress),
  );
  const mySegmentPaths = buildRoundedClosedSegmentPaths(myPoints, 8);

  // 평균 민감도 폴리곤 좌표
  const avgPoints = myTasteData.map((d, i) => {
    const r = (d.averageScore / 100) * maxR;
    return hexPoint(cx, cy, r, i);
  });
  const avgPath = buildRoundedClosedPath(avgPoints, 8);

  // 꼭짓점 (맛 라벨 + 점)
  const vertices = myTasteData.map((d, i) => ({
    ...d,
    point: hexPoint(cx, cy, maxR, i),
    labelPoint: hexPoint(cx, cy, maxR + 10, i),
    color: getTasteColor(d.label),
  }));

  // 대각선 (0-3, 1-4, 2-5)
  const diagonals = [
    [vertices[0], vertices[3]],
    [vertices[1], vertices[4]],
    [vertices[2], vertices[5]],
  ];

  return (
    <svg
      width={RADAR_CHART.size}
      height="310"
      viewBox={`0 0 ${RADAR_CHART.size} 310`}
      className="mx-auto w-full max-w-[320px]"
    >
      <defs>
        {vertices.map((vertex, index) => {
          const nextVertex = vertices[(index + 1) % vertices.length];

          if (!nextVertex) {
            return null;
          }

          return (
            <linearGradient
              key={`profile-gradient-${index}`}
              id={`${gradientIdPrefix}-profile-gradient-${index}`}
              x1={myPoints[index]?.[0] ?? cx}
              y1={myPoints[index]?.[1] ?? cy}
              x2={myPoints[(index + 1) % myPoints.length]?.[0] ?? cx}
              y2={myPoints[(index + 1) % myPoints.length]?.[1] ?? cy}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={mixHexColors(vertex.color, '#FFFFFF', 0.5)} />
              <stop offset="100%" stopColor={mixHexColors(nextVertex.color, '#FFFFFF', 0.5)} />
            </linearGradient>
          );
        })}
      </defs>

      {/* 배경 6각형 그리드 */}
      {gridLevels.map((level, idx) => (
        <polygon
          key={idx}
          points={hexPolygon(cx, cy, maxR * level)}
          fill="none"
          stroke={gridStrokeColor}
          strokeWidth="1"
        />
      ))}

      {/* 대각선 */}
      {diagonals.map(([a, b], idx) => (
        <line
          key={idx}
          x1={a.point[0]}
          y1={a.point[1]}
          x2={b.point[0]}
          y2={b.point[1]}
          stroke={gridStrokeColor}
          strokeWidth="1"
        />
      ))}

      {/* 중심점에서 나의 민감도 노드로 연결되는 축 */}
      {myNodePoints.map(([x, y], idx) => (
        <line
          key={`spoke-${idx}`}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={mixHexColors(vertices[idx]?.color ?? RADAR_CHART.highlightStroke, '#FFFFFF', 0.4)}
          strokeWidth="16"
          strokeLinecap="round"
        />
      ))}

      <polygon points={centerStarUp} fill="#FFFFFF" />
      <polygon points={centerStarDown} fill="#FFFFFF" />

      {/* 평균 민감도 헥사곤 */}
      <path
        d={avgPath}
        fill={RADAR_CHART.averageFill}
        stroke={RADAR_CHART.averageStroke}
        strokeWidth="1.5"
      />

      {/* 나의 민감도 헥사곤 */}
      {mySegmentPaths.map((segmentPath, index) => (
        <path
          key={`my-segment-${index}`}
          d={segmentPath}
          fill="none"
          stroke={`url(#${gradientIdPrefix}-profile-gradient-${index})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* 나의 민감도 꼭짓점 */}
      {myNodePoints.map(([x, y], i) => (
        <circle
          key={`my-${i}`}
          cx={x}
          cy={y}
          r="8"
          fill={vertices[i]?.color ?? RADAR_CHART.highlightStroke}
        />
      ))}

      {/* 맛 라벨 */}
      {vertices.map((v, i) => {
        const isLeft = i === 5;
        const isRight = i === 2;
        const isTopLabel = i === 0 || i === 1;
        const isBottomLabel = i === 3 || i === 4;

        return (
          <text
            key={`label-${i}`}
            x={v.labelPoint[0]}
            y={v.labelPoint[1]}
            textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
            dominantBaseline={
              isTopLabel ? 'text-after-edge' : isBottomLabel ? 'text-before-edge' : 'middle'
            }
            className="text-[8px] font-medium"
            fill={RADAR_CHART.labelColor}
          >
            {v.label}
          </text>
        );
      })}
    </svg>
  );
}

interface AnalysisPageProps {
  isActive?: boolean;
  measurementSnapshot: TasteMeasurementSnapshot;
  onStartMeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function AnalysisPage({
  isActive = true,
  measurementSnapshot,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: AnalysisPageProps) {
  const period = '이번 측정';
  const initialTimeline = [measurementSnapshot];
  const initialTrendDataBounds = getTrendDataBounds(initialTimeline, measurementSnapshot);
  const initialTrendNavigationBounds = getTrendNavigationBounds(initialTrendDataBounds);
  const [measurementTimeline, setMeasurementTimeline] = useState<TasteMeasurementSnapshot[]>(initialTimeline);
  const [reservations, setReservations] = useState<ReservationRecord[]>(RESERVATION_CATALOG);
  const [feedbackByReservationId, setFeedbackByReservationId] = useState<Record<number, DiningFeedbackDraft>>({});
  const [selectedTrendRange, setSelectedTrendRange] = useState<TrendRangeId>('all');
  const [trendViewWindow, setTrendViewWindow] = useState<TrendViewWindow>(
    createTrendViewWindowFromRange('all', initialTrendDataBounds, initialTrendNavigationBounds),
  );
  const [selectedTasteIndex, setSelectedTasteIndex] = useState(0);
  const [contentDishes, setContentDishes] = useState<RestaurantContentDish[]>([]);
  const [trendDragOffsetX, setTrendDragOffsetX] = useState(0);
  const [trendMotionOffsetPercent, setTrendMotionOffsetPercent] = useState(0);
  const [trendMotionScale, setTrendMotionScale] = useState(1);
  const [isTrendDragging, setIsTrendDragging] = useState(false);
  const trendPointerStartXRef = useRef<number | null>(null);
  const trendTouchStateRef = useRef<{
    mode: 'none' | 'swipe' | 'pinch';
    startX: number;
    initialDistance: number;
    initialWindow: TrendViewWindow | null;
  }>({
    mode: 'none',
    startX: 0,
    initialDistance: 0,
    initialWindow: null,
  });
  const trendMotionFrameRef = useRef<number | null>(null);
  const myTasteData = getTasteMeasurementEntries(measurementSnapshot);
  const totalSensitivity = getAverageMeasurementMm(measurementSnapshot);
  const avgSensitivity = getAverageReferenceMeasurementMm();
  const insights = buildInsights(myTasteData, totalSensitivity, avgSensitivity);
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const chefTranslationIndicatorBackground = buildTasteAdjustmentGradient(
    myTasteData
      .filter((entry) => CHEF_TRANSLATION_COPY.includes(entry.label))
      .map((entry) => ({
        change: entry.score,
        taste: entry.label,
      })),
    'to bottom',
  );
  const realMenuRecommendations = buildRealMenuRecommendations(measurementSnapshot, contentDishes);
  const trendDataBounds = getTrendDataBounds(measurementTimeline, measurementSnapshot);
  const trendNavigationBounds = getTrendNavigationBounds(trendDataBounds);
  const activeTrendRange = selectedTrendRange;
  const filteredMeasurements = filterMeasurementsByWindow(measurementTimeline, trendViewWindow);
  const trendData = buildProfileChangeTrendData(filteredMeasurements, trendViewWindow, activeTrendRange);
  const profileConfidenceStage = deriveProfileConfidenceStage(measurementTimeline.length);
  const legacyTasteProfileCard = buildHomeTasteProfileFromMeasurements(measurementTimeline).cardData;
  const legacySpecialNoteCard = buildHomeSpecialNoteFromReservations(
    reservations,
    feedbackByReservationId,
    buildHomeReservationHint(reservations),
  );
  const hasTrendHistory = filteredMeasurements.length > 1;
  const totalTasteScore = Math.round(totalSensitivity * 10);
  const totalTasteDelta = Number((totalSensitivity - avgSensitivity).toFixed(2));
  const selectedTaste = TREND_TASTE_OPTIONS[selectedTasteIndex] ?? TREND_TASTE_OPTIONS[0];
  const previousTaste =
    TREND_TASTE_OPTIONS[
      selectedTasteIndex <= 0 ? TREND_TASTE_OPTIONS.length - 1 : selectedTasteIndex - 1
    ] ?? TREND_TASTE_OPTIONS[0];
  const nextTaste =
    TREND_TASTE_OPTIONS[
      selectedTasteIndex >= TREND_TASTE_OPTIONS.length - 1 ? 0 : selectedTasteIndex + 1
    ] ?? TREND_TASTE_OPTIONS[0];
  const getTasteTrendDirection = (deltaMm?: number) =>
    typeof deltaMm !== 'number' || Math.abs(deltaMm) < 0.01
      ? 'flat' as const
      : deltaMm > 0
        ? 'up' as const
        : 'down' as const;
  const getTasteCardMeta = (taste: (typeof TREND_TASTE_OPTIONS)[number]) => {
    if (taste === '모든맛') {
      return {
        score: totalTasteScore,
        trend: getTasteTrendDirection(totalTasteDelta),
      };
    }

    const entry = myTasteData.find((item) => item.label === taste);

    return {
      score: entry?.score ?? 0,
      trend: getTasteTrendDirection(entry?.deltaMm),
    };
  };
  const selectedTasteMeta = getTasteCardMeta(selectedTaste);
  const previousTasteMeta = getTasteCardMeta(previousTaste);
  const nextTasteMeta = getTasteCardMeta(nextTaste);
  const visibleTasteLabels = selectedTaste === '모든맛' ? [...GRAPH_TASTE_ORDER] : [selectedTaste];
  const visibleTrendData = trendData.filter((point) => point.isVisible);
  const trendAxisConfig = buildTrendAxisConfig(visibleTrendData, visibleTasteLabels);
  const trendRangeLabel = buildTrendRangeLabel(trendViewWindow, activeTrendRange);
  const trendPeriodGuide = buildTrendPeriodGuide(activeTrendRange, trendViewWindow);
  const trendTickPositionKeys = trendPeriodGuide.tickPositions.map((position) =>
    formatTrendPositionKey(position),
  );
  const trendBaseInset =
    trendPeriodGuide.gridPositions.length > 1
      ? Math.min(0.08, (trendPeriodGuide.gridPositions[1] - trendPeriodGuide.gridPositions[0]) / 6)
      : 0.08;
  const trendLeadingInset = trendBaseInset;
  const trendTrailingInset = trendBaseInset;
  const trendGridStepFraction =
    trendPeriodGuide.gridPositions.length > 1
      ? trendPeriodGuide.gridPositions[1] - trendPeriodGuide.gridPositions[0]
      : 0.25;
  const trendChartDomainEnd =
    activeTrendRange === 'year' && trendPeriodGuide.gridPositions.length > 0
      ? (trendPeriodGuide.gridPositions[trendPeriodGuide.gridPositions.length - 1] ?? 1) + trendTrailingInset
      : 1 + trendTrailingInset;
  const shouldLockTrendGridDuringSwipe = activeTrendRange === 'year';
  const visibleTrendDragOffsetX = shouldLockTrendGridDuringSwipe ? 0 : trendDragOffsetX;
  const visibleTrendMotionOffsetPercent = shouldLockTrendGridDuringSwipe ? 0 : trendMotionOffsetPercent;

  const triggerTrendMotion = (
    kind: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out',
    stepFraction = trendGridStepFraction,
  ) => {
    const initialTransform =
      kind === 'pan-left'
        ? { offsetPercent: stepFraction * 100, scale: 1 }
        : kind === 'pan-right'
          ? { offsetPercent: -stepFraction * 100, scale: 1 }
          : kind === 'zoom-in'
            ? { offsetPercent: 0, scale: 0.97 }
            : { offsetPercent: 0, scale: 1.03 };

    if (trendMotionFrameRef.current !== null) {
      cancelAnimationFrame(trendMotionFrameRef.current);
    }

    setTrendMotionOffsetPercent(initialTransform.offsetPercent);
    setTrendMotionScale(initialTransform.scale);
    trendMotionFrameRef.current = requestAnimationFrame(() => {
      setTrendMotionOffsetPercent(0);
      setTrendMotionScale(1);
      trendMotionFrameRef.current = null;
    });
  };

  const updateTrendWindow = (
    nextWindow: TrendViewWindow,
    motionKind?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out',
  ) => {
    setTrendViewWindow(clampTrendViewWindow(nextWindow, trendNavigationBounds));

    if (motionKind) {
      triggerTrendMotion(motionKind);
    }
  };

  const handleSelectTrendRange = (rangeId: TrendRangeId) => {
    setSelectedTrendRange(rangeId);
    updateTrendWindow(
      createTrendViewWindowFromRange(rangeId, trendDataBounds, trendNavigationBounds),
      rangeId === activeTrendRange ? undefined : 'zoom-out',
    );
  };

  const previousTrendWindowCandidate = shiftTrendViewWindow(
    trendViewWindow,
    activeTrendRange,
    -1,
    trendNavigationBounds,
  );
  const canShiftTrendWindowBackward =
    previousTrendWindowCandidate.endMs >= trendDataBounds.earliestMs;

  const handleShiftTrendWindow = (direction: -1 | 1) => {
    const nextWindow = shiftTrendViewWindow(
      trendViewWindow,
      activeTrendRange,
      direction,
      trendNavigationBounds,
    );

    if (direction < 0 && nextWindow.endMs < trendDataBounds.earliestMs) {
      return;
    }

    updateTrendWindow(
      nextWindow,
      direction < 0 ? 'pan-right' : 'pan-left',
    );
  };

  const handleScaleTrendWindow = (scaleFactor: number) => {
    const nextWindow = scaleTrendViewWindow(trendViewWindow, scaleFactor, trendNavigationBounds);
    setSelectedTrendRange(deriveTrendRangeIdFromWindow(nextWindow, trendDataBounds));
    updateTrendWindow(
      nextWindow,
      scaleFactor < 1 ? 'zoom-in' : 'zoom-out',
    );
  };

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const [recentMeasurements, contentCatalog, reservationPageData] = await Promise.all([
        hydrateRecentMeasurementSnapshots(),
        hydrateRestaurantContentCatalog(),
        hydrateReservationPageData(),
      ]);

      if (isCancelled) {
        return;
      }

      const mergedMeasurements = mergeMeasurementSnapshots(recentMeasurements, measurementSnapshot);

      setMeasurementTimeline(mergedMeasurements.length > 0 ? mergedMeasurements : [measurementSnapshot]);
      setContentDishes(contentCatalog.dishes);
      setReservations(
        reservationPageData.reservations.length > 0
          ? reservationPageData.reservations
          : RESERVATION_CATALOG,
      );
      setFeedbackByReservationId(reservationPageData.feedbackByReservationId);
    })();

    return () => {
      isCancelled = true;
    };
  }, [measurementSnapshot.measuredAt]);

  useEffect(() => {
    setTrendViewWindow((currentWindow) => clampTrendViewWindow(currentWindow, trendNavigationBounds));
  }, [trendNavigationBounds.earliestMs, trendNavigationBounds.latestMs]);

  useEffect(() => {
    return () => {
      if (trendMotionFrameRef.current !== null) {
        cancelAnimationFrame(trendMotionFrameRef.current);
      }
    };
  }, []);

  const handleMoveTasteFilter = (direction: -1 | 1) => {
    setSelectedTasteIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return TREND_TASTE_OPTIONS.length - 1;
      }

      if (nextIndex >= TREND_TASTE_OPTIONS.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  const handleTrendPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      return;
    }

    trendPointerStartXRef.current = event.clientX;
    setIsTrendDragging(true);
  };

  const handleTrendPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (trendPointerStartXRef.current === null) {
      return;
    }

    setTrendDragOffsetX(event.clientX - trendPointerStartXRef.current);
  };

  const finishTrendSwipe = (offsetX: number) => {
    const threshold = 44;

    if (Math.abs(offsetX) >= threshold) {
      handleShiftTrendWindow(offsetX > 0 ? -1 : 1);
    }

    trendPointerStartXRef.current = null;
    setIsTrendDragging(false);
    setTrendDragOffsetX(0);
  };

  const handleTrendPointerUp = () => {
    if (trendPointerStartXRef.current === null) {
      return;
    }

    finishTrendSwipe(trendDragOffsetX);
  };

  const handleTrendWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    handleScaleTrendWindow(event.deltaY < 0 ? 0.75 : 1.25);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return 0;
    }

    const [firstTouch, secondTouch] = [touches[0], touches[1]];
    return Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
  };

  const handleTrendTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) {
      trendTouchStateRef.current = {
        mode: 'pinch',
        startX: 0,
        initialDistance: getTouchDistance(event.touches),
        initialWindow: trendViewWindow,
      };
      setIsTrendDragging(false);
      setTrendDragOffsetX(0);
      return;
    }

    trendTouchStateRef.current = {
      mode: 'swipe',
      startX: event.touches[0]?.clientX ?? 0,
      initialDistance: 0,
      initialWindow: trendViewWindow,
    };
    setIsTrendDragging(true);
  };

  const handleTrendTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (trendTouchStateRef.current.mode === 'pinch' && event.touches.length >= 2) {
      event.preventDefault();
      const nextDistance = getTouchDistance(event.touches);
      const initialDistance = trendTouchStateRef.current.initialDistance;
      const initialWindow = trendTouchStateRef.current.initialWindow;

      if (!initialWindow || initialDistance <= 0 || nextDistance <= 0) {
        return;
      }

      const nextScale = initialDistance / nextDistance;
      setTrendViewWindow(scaleTrendViewWindow(initialWindow, nextScale, trendNavigationBounds));
      return;
    }

    if (trendTouchStateRef.current.mode !== 'swipe') {
      return;
    }

    const nextX = event.touches[0]?.clientX ?? trendTouchStateRef.current.startX;
    setTrendDragOffsetX(nextX - trendTouchStateRef.current.startX);
  };

  const handleTrendTouchEnd = () => {
    if (trendTouchStateRef.current.mode === 'pinch') {
      const initialWindow = trendTouchStateRef.current.initialWindow;
      setSelectedTrendRange(deriveTrendRangeIdFromWindow(trendViewWindow, trendDataBounds));
      const motionKind =
        initialWindow && getTrendDurationDays(trendViewWindow) > getTrendDurationDays(initialWindow)
          ? 'zoom-out'
          : 'zoom-in';
      triggerTrendMotion(motionKind);
      trendTouchStateRef.current = {
        mode: 'none',
        startX: 0,
        initialDistance: 0,
        initialWindow: null,
      };
      return;
    }

    if (trendTouchStateRef.current.mode === 'swipe') {
      finishTrendSwipe(trendDragOffsetX);
    }

    trendTouchStateRef.current = {
      mode: 'none',
      startX: 0,
      initialDistance: 0,
      initialWindow: null,
    };
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="tb-section-stack p-5 animate-fadeIn">
          <PageSection title="나의 미각" titleAs="h1" titleSize="lg" contentClassName="flex flex-col gap-3">
            <PalateSignatureHeroCard
              measurementAgeLabel={measurementAgeLabel}
              tasteEntries={myTasteData}
            />

            <InsightCard
              description={CHEF_TRANSLATION_COPY}
              eyebrow="셰프는 이렇게 참고합니다 (Chef Translation)"
              indicatorBackground={chefTranslationIndicatorBackground}
            />

            <ProfileConfidenceCard
              measurementAgeLabel={measurementAgeLabel}
              measurementCount={measurementTimeline.length}
              needsMeasurementRefresh={needsMeasurementRefresh}
              stage={profileConfidenceStage}
              strongestTasteLabel={getStrongestTasteMeasurement(measurementSnapshot).label}
              weakestTasteLabel={getWeakestTasteMeasurement(measurementSnapshot).label}
            />

            <TasteMeasurementMiniCta
              accentTaste={
                needsMeasurementRefresh
                  ? undefined
                  : getStrongestTasteMeasurement(measurementSnapshot).label
              }
              title={needsMeasurementRefresh ? '프로필 업데이트 추천' : '현재 컨디션 다시 측정'}
              actionFullWidth={!needsMeasurementRefresh}
              description={
                needsMeasurementRefresh
                  ? `${measurementAgeLabel} 데이터예요. 다시 측정하면 분석 결과를 더 현재 입맛에 맞게 볼 수 있어요.`
                  : '컨디션이 달라졌다면 지금 다시 측정해 이번 분석을 최신 상태로 맞출 수 있어요.'
              }
              meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
              actionLabel={needsMeasurementRefresh ? '재측정' : '다시 측정'}
              onAction={onStartMeasurement}
              padding={needsMeasurementRefresh ? 'default' : 'compact'}
              tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
            />

            <SectionCard hoverEffect={false}>
              <div className="flex items-center justify-between w-full">
                <button className="rounded-full p-1 transition-colors hover:bg-[var(--tb-color-surface-muted)]">
                  <ChevronLeft size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-primary)]" />
                </button>
                <span className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">{period}</span>
                <button className="rounded-full p-1 transition-colors hover:bg-[var(--tb-color-surface-muted)]">
                  <ChevronRight size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-primary)]" />
                </button>
              </div>

              <div className="flex w-full flex-col items-center animate-slideUp">
                <HexRadarChart myTasteData={myTasteData} shouldAnimate={isActive} />

                <div className="mt-2 flex items-end gap-0">
                  <div className="flex flex-col items-center gap-[4px]">
                    <span className="text-[10px] text-[var(--tb-color-text-hint)]">나의 반응</span>
                    <span className="rounded-[6px] bg-[var(--tb-color-text-primary)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">
                      {totalSensitivity > avgSensitivity + 0.5 ? '민감' : totalSensitivity < avgSensitivity - 0.5 ? '부드러움' : '평균'}
                    </span>
                  </div>
                  <span className="mx-[4px] flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[var(--tb-color-text-disabled)] text-[10px] text-[var(--tb-color-text-inverse)]">→</span>
                  <div className="flex flex-col items-center gap-[4px]">
                    <span className="text-[10px] text-[var(--tb-color-text-hint)]">기준 반응</span>
                    <span className="rounded-[6px] bg-[var(--tb-color-text-primary)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">
                      평균
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <LegacyHomeTasteProfileCard
              cardData={legacyTasteProfileCard}
              onOpenDetail={() => undefined}
            />

            <LegacyHomeSpecialNoteCard
              cardData={legacySpecialNoteCard}
              onOpenDetail={() => undefined}
            />
          </PageSection>

          <PageSection title="세부 분석" titleSize="md">
            <div className="mx-[-20px] flex w-[calc(100%+40px)] gap-[10px] overflow-x-auto px-[20px] pb-4 no-scrollbar">
              {myTasteData.map((item, idx) => {
                const colors = TASTE_COLORS[item.label as keyof typeof TASTE_COLORS];
                const tasteId = TASTE_LABEL_TO_ID[item.label as keyof typeof TASTE_LABEL_TO_ID];
                const tintTextColor = tasteId ? `var(--tb-taste-${tasteId}-tint-text)` : colors.tintText;
                const tintSubTextColor = tasteId
                  ? `var(--tb-taste-${tasteId}-tint-sub-text)`
                  : getTasteTintSubText(item.label);
                return (
                  <div
                    key={idx}
                    className="shrink-0 w-[132px] h-[132px] rounded-[20px] p-3 flex flex-col gap-2 animate-slideUp transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.98] cursor-pointer"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${getTasteTint(item.label, 0.18)}`,
                      animationDelay: `${idx * 80}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <div
                      className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[14px]"
                      style={{ backgroundColor: colors.main }}
                    >
                      {item.deltaMm > 0 ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : item.deltaMm < 0 ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4L12 12M12 12H6M12 12V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 8H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-[1px]">
                      <p className="font-bold text-[14px]" style={{ color: tintTextColor }}>{item.label}</p>
                      <p className="font-medium text-[12px]" style={{ color: tintSubTextColor }}>
                        {formatTasteDeltaSummary(item.deltaMm)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </PageSection>

          {/* 측정/피드백 변화 차트 */}
          <details className="group flex flex-col gap-3 pb-6">
            <summary className="list-none flex cursor-pointer w-full items-center justify-between rounded-[20px] bg-[var(--tb-color-surface-base)] border border-[var(--tb-color-border-default)] p-4 transition-all duration-300 hover:bg-[var(--tb-color-surface-muted)] active:scale-[0.98]">
              <div className="flex flex-col gap-1">
                <SectionTitle size="md" className="mb-0">
                  {hasTrendHistory ? '과거 측정 및 미각 변화 추이' : '현재 측정 기준 미각 분포 차트'}
                </SectionTitle>
                <p className="text-[12px] text-[var(--tb-color-text-subtle)] font-normal">전문가용 데이터 대시보드 열기</p>
              </div>
              <ChevronRight size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-primary)] transition-transform duration-300 group-open:rotate-90" />
            </summary>
            
            <div className="mt-4 flex flex-col gap-3 animate-fadeIn">
              <SectionCard>
                <div className="mb-0 w-full">
                  <div className="flex w-full justify-center gap-[8px]">
                  {TREND_RANGE_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => handleSelectTrendRange(option.id)}
                      className={`h-auto flex-none rounded-full border px-[14px] py-[8px] text-[13px] font-semibold transition-colors ${
                        activeTrendRange === option.id
                          ? 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-primary)]'
                          : 'border-transparent bg-transparent text-[var(--tb-color-text-secondary)]'
                      }`}
                      aria-pressed={activeTrendRange === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                  </div>
                </div>
              <div className="mb-0 grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 pt-0">
                <button
                  type="button"
                  disabled={!canShiftTrendWindowBackward}
                  onClick={() => handleShiftTrendWindow(-1)}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] transition-colors hover:bg-white disabled:cursor-default disabled:border-[var(--tb-color-border-subtle)] disabled:bg-transparent disabled:text-[var(--tb-color-text-disabled)]"
                  style={{
                    width: TREND_WINDOW_NAV_BUTTON_SIZE,
                    height: TREND_WINDOW_NAV_BUTTON_SIZE,
                  }}
                  aria-label="이전 기간 보기"
                >
                  <ChevronLeft size={ICON_TOKENS.size.lg} />
                </button>
                <div className="flex min-w-0 items-center justify-center text-center">
                  <p className="truncate text-[15px] font-semibold leading-none text-[var(--tb-color-text-primary)]">
                    {trendRangeLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleShiftTrendWindow(1)}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] transition-colors hover:bg-white"
                  style={{
                    width: TREND_WINDOW_NAV_BUTTON_SIZE,
                    height: TREND_WINDOW_NAV_BUTTON_SIZE,
                  }}
                  aria-label="다음 기간 보기"
                >
                  <ChevronRight size={ICON_TOKENS.size.lg} />
                </button>
              </div>
              <div className="mb-0 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMoveTasteFilter(-1)}
                  className="flex min-h-[42px] min-w-0 items-center justify-self-start gap-2 rounded-[14px] bg-[var(--tb-color-surface-muted)] px-[8px] py-[8px] text-[12px] font-medium leading-none text-[var(--tb-color-text-secondary)] opacity-50 transition-opacity hover:opacity-70"
                  aria-label={`이전 미각 ${previousTaste} 보기`}
                >
                  <TasteDirectionIcon
                    taste={previousTaste}
                    trend={previousTasteMeta.trend}
                    muted
                    size={24}
                  />
                  <span className="truncate text-[12px] font-semibold leading-none">{previousTaste}</span>
                </button>
                <div className="flex min-h-[56px] min-w-0 items-center justify-center gap-2 rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-[12px] text-center">
                  <TasteDirectionIcon
                    taste={selectedTaste}
                    trend={selectedTasteMeta.trend}
                    size={ICON_TOKENS.size.lg}
                  />
                  <div className="flex min-w-0 flex-col items-start">
                    <span className="truncate text-[14px] font-semibold leading-none text-[var(--tb-color-text-primary)]">
                      {selectedTaste}
                    </span>
                    <span className="mt-[3px] text-[11px] font-medium leading-none text-[var(--tb-color-text-secondary)]">
                      {selectedTasteMeta.score}점
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMoveTasteFilter(1)}
                  className="flex min-h-[42px] min-w-0 items-center justify-self-end gap-2 rounded-[14px] bg-[var(--tb-color-surface-muted)] px-[8px] py-[8px] text-[12px] font-medium leading-none text-[var(--tb-color-text-secondary)] opacity-50 transition-opacity hover:opacity-70"
                  aria-label={`다음 미각 ${nextTaste} 보기`}
                >
                  <TasteDirectionIcon
                    taste={nextTaste}
                    trend={nextTasteMeta.trend}
                    muted
                    size={24}
                  />
                  <span className="truncate text-[12px] font-semibold leading-none">{nextTaste}</span>
                </button>
              </div>
              <div className="mb-2">
                <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {hasTrendHistory
                    ? '측정이 쌓일수록 각 미각 축이 어떻게 달라졌는지 추세로 이어서 볼 수 있어요.'
                    : '첫 측정이라 아직 누적 추세는 없어요. 이번 값을 현재 기준점으로 저장했고, 다음 측정부터 변화 흐름이 이어집니다.'}
                </p>
              </div>
              <div
                className="h-[280px] w-full touch-none select-none"
                onPointerDown={handleTrendPointerDown}
                onPointerMove={handleTrendPointerMove}
                onPointerUp={handleTrendPointerUp}
                onPointerCancel={handleTrendPointerUp}
                onPointerLeave={handleTrendPointerUp}
                onTouchStart={handleTrendTouchStart}
                onTouchMove={handleTrendTouchMove}
                onTouchEnd={handleTrendTouchEnd}
                onWheel={handleTrendWheel}
              >
                <div className="relative h-full w-full">
                  <div
                    className="h-full w-full"
                    style={{
                      transform: `translateX(calc(${visibleTrendDragOffsetX}px + ${visibleTrendMotionOffsetPercent}%)) scale(${trendMotionScale})`,
                      transition: isTrendDragging ? 'none' : 'transform 260ms steps(4, end), opacity 220ms linear',
                      opacity: isTrendDragging
                        ? shouldLockTrendGridDuringSwipe
                          ? 0.96
                          : Math.max(0.84, 1 - Math.abs(trendDragOffsetX) / 240)
                        : 1,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: TREND_CHART_TOP_MARGIN, bottom: 0 }}>
                        {trendAxisConfig.ticks.map((value) => (
                          <ReferenceLine
                            key={`trend-horizontal-grid-${value}`}
                            y={value}
                            stroke={TREND_GRID_HORIZONTAL_STROKE}
                            strokeWidth={1}
                            ifOverflow="extendDomain"
                          />
                        ))}
                        {trendPeriodGuide.gridPositions
                          .map((value) => (
                            <ReferenceLine
                              key={`trend-grid-${value}`}
                              x={value}
                              stroke={TREND_GRID_VERTICAL_STROKE}
                              strokeDasharray="4 4"
                              strokeWidth={1}
                              ifOverflow="extendDomain"
                            />
                          ))}
                        <XAxis
                          type="number"
                          dataKey="xPosition"
                          domain={[-trendLeadingInset, trendChartDomainEnd]}
                          ticks={trendPeriodGuide.tickPositions}
                          tick={(props) => (
                            <WeeklyTrendAxisTick
                              {...props}
                              labelByPosition={trendPeriodGuide.labelByPosition}
                              rangeId={activeTrendRange}
                              tickPositionKeys={trendTickPositionKeys}
                            />
                          )}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          padding={{ left: 4, right: 4 }}
                          height={TREND_CHART_X_AXIS_HEIGHT}
                          tickMargin={0}
                        />
                        <YAxis
                          orientation="right"
                          domain={trendAxisConfig.domain}
                          ticks={trendAxisConfig.ticks}
                          axisLine={false}
                          tickLine={false}
                          tick={false}
                          width={TREND_CHART_Y_AXIS_WIDTH}
                        />
                        <Tooltip
                          content={<WeeklyTrendTooltip visibleTasteLabels={visibleTasteLabels} />}
                          cursor={<WeeklyTrendCursor />}
                        />
                        {visibleTasteLabels.map((taste) => (
                          <React.Fragment key={taste}>
                            <Line
                              type="linear"
                              dataKey={taste}
                              stroke={getTasteTint(taste, 0.18)}
                              strokeWidth={TREND_TINT_LINE_STROKE_WIDTH}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              dot={false}
                              activeDot={false}
                              isAnimationActive={false}
                            />
                            <Line
                              type="linear"
                              dataKey={taste}
                              stroke={getTasteColor(taste)}
                              strokeWidth={TREND_LINE_STROKE_WIDTH}
                              dot={(props) => <WeeklyTrendDot {...props} taste={taste} />}
                              activeDot={(props) => <WeeklyTrendActiveDot {...props} taste={taste} />}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              isAnimationActive={false}
                            />
                          </React.Fragment>
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className="pointer-events-none absolute"
                    style={{
                      top: TREND_CHART_TOP_MARGIN,
                      bottom: TREND_CHART_X_AXIS_HEIGHT,
                      right: TREND_CHART_Y_AXIS_WIDTH - 1,
                      width: 2,
                      backgroundColor: 'var(--tb-color-surface-card)',
                    }}
                    aria-hidden="true"
                  />
                  <FixedTrendYAxisLabels
                    domain={trendAxisConfig.domain}
                    ticks={trendAxisConfig.ticks}
                  />
                </div>
              </div>
            </SectionCard>
            </div>
          </details>

          {realMenuRecommendations.length > 0 ? (
            <PageSection title="지금 프로필에 맞는 실제 메뉴" titleSize="md">
              <div className="flex flex-col gap-3">
                {realMenuRecommendations.map((menu) => (
                  <RealMenuRecommendationCard key={menu.id} menu={menu} />
                ))}
              </div>
            </PageSection>
          ) : null}

          {/* 인사이트 */}
          <PageSection title="인사이트" titleSize="md" className="pb-6">
            <div className="flex flex-col gap-3">
              {insights.map((item, idx) => (
                <InsightCard
                  key={idx}
                  accentColor={getTasteColor(item.taste)}
                  description={item.text}
                />
              ))}
            </div>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
