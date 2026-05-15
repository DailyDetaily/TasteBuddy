import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  buildHomeReservationHint,
  buildHomeSpecialNoteFromReservations,
  buildHomeTasteProfileFromMeasurements,
  LegacyHomeSpecialNoteCard,
  LegacyHomeSpecialNoteDetailScreen,
  LegacyHomeTasteProfileCard,
  LegacyHomeTasteProfileDetailScreen,
} from '../imports/Home';
import PalateSignatureHeroCard from '../components/analysis/PalateSignatureHeroCard';
import { type RealMenuRecommendationCardData } from '../components/analysis/RealMenuRecommendationCard';
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import SectionCard from '../components/SectionCard';
import InterpretationDetailDrawer, {
  type InterpretationDetailContent,
} from '../components/system/InterpretationDetailDrawer';
import CardDetailLabel from '../components/system/CardDetailLabel';
import InterpretationCard from '../components/system/InterpretationCard';
import PageSection from '../components/system/PageSection';
import ProfileConfidenceCard, {
  type ProfileConfidenceStage,
} from '../components/system/ProfileConfidenceCard';
import CardScrollList from '../components/system/CardScrollList';
import SectionTitle from '../components/system/SectionTitle';
import TasteTintCard from '../components/system/TasteTintCard';
import HexRadarChart from '../components/system/HexRadarChart';
import { DATA_VIZ_TOKENS, ICON_TOKENS, NEUTRAL_TASTE_TOKENS, TASTE_IDS, TASTE_LABELS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import { buildTasteAdjustmentGradient, getTasteColor, getTasteTint, mixHexColors } from '../constants/tasteColors';
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
  resolveTasteMeasurementValue,
  type TasteMeasurementEntry,
  type TasteMeasurementResults,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  hydrateRecentMeasurementSnapshots,
  hydrateReservationPageData,
} from '../lib/tasteBuddySupabase';
import { RESERVATION_CATALOG, type ReservationRecord } from '../constants/reservationCatalog';
import TasteChangePage from './TasteChangePage';

const RADAR_CHART = DATA_VIZ_TOKENS.radar;
const TREND_TINT_LINE_STROKE_WIDTH = 12;
const TREND_LINE_STROKE_WIDTH = 2;
const TREND_DOT_RADIUS = 6;
const TREND_ACTIVE_DOT_OUTER_RADIUS = 10;
const TREND_ACTIVE_DOT_CORE_RADIUS = TREND_DOT_RADIUS;
const TREND_ACTIVE_DOT_HALO_WHITE_MIX = 0.72;
const TREND_GUIDE_GAP = 2;
const TREND_GUIDE_MASK_WIDTH = 6;
const TREND_GUIDE_BOTTOM_TAIL = 8;
const TREND_CHART_TOP_MARGIN = 10;
const TREND_CHART_X_AXIS_HEIGHT = 18;
const TREND_CHART_Y_AXIS_WIDTH = 34;
const TREND_CHART_Y_AXIS_GAP = 4;
const TREND_CHART_Y_AXIS_LABEL_PADDING = 4;
const TREND_CHART_GRID_EDGE_GUTTER = 18;
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

type AnalysisInsight = InterpretationDetailContent & {
  id: string;
  supportingText: string;
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
      className="pointer-events-none absolute inset-y-0 right-0 box-border"
      style={{
        width: TREND_CHART_Y_AXIS_WIDTH,
        paddingLeft: TREND_CHART_Y_AXIS_LABEL_PADDING,
      }}
      aria-hidden="true"
    >
      {ticks.map((tick) => {
        const ratio = (domainMax - tick) / denominator;

        return (
          <span
            key={`trend-y-label-${tick}`}
            className="absolute -translate-y-1/2 text-[11px] text-[var(--tb-color-text-hint)]"
            style={{
              left: TREND_CHART_Y_AXIS_LABEL_PADDING,
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
  size = ICON_TOKENS.container.lg,
}: {
  taste: string;
  trend: 'up' | 'down' | 'flat';
  muted?: boolean;
  size?: number;
}) {
  const baseColor = taste === '모든맛' ? NEUTRAL_TASTE_TOKENS.palette.main : getTasteColor(taste);
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
      className="inline-flex shrink-0 items-center justify-center rounded-[8px]"
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
      accentColor: getTasteColor(strongestTaste.label),
      description: `${strongestTaste.label}에 빠르게 반응하는 프로필이에요`,
      eyebrow: '먼저 읽히는 맛',
      id: 'strongest-taste',
      meaning: `${strongestTaste.label} 축이 메뉴의 첫인상을 비교적 빠르게 결정할 가능성이 커요. 같은 자극도 이 맛이 앞에서 읽히면 전체 밸런스를 더 또렷하게 느낄 수 있어요.`,
      nextStep: `다음 다이닝 해석에서는 ${strongestTaste.label}이 과하게 겹치지 않도록 흐름을 먼저 보고, 이 축이 자연스럽게 살아나는 메뉴를 우선 추천해요.`,
      supportingText: `다음 추천에서는 ${strongestTaste.label}이 자연스럽게 살아나는 메뉴를 먼저 볼게요.`,
      title: `${strongestTaste.label} 반응이 먼저 올라와요`,
    },
    {
      accentColor: getTasteColor(biggestDeltaTaste.label),
      description: `${biggestDeltaTaste.label} 변화가 눈에 띄게 나타났어요. 다음 다이닝에 반영됩니다`,
      eyebrow: '최근 변화 신호',
      id: 'biggest-delta',
      meaning: `이번에는 ${biggestDeltaTaste.label} 축의 체감이 평소보다 더 크게 움직였어요. 고정된 판단이라기보다, 현재 컨디션까지 함께 읽어야 하는 신호에 가까워요.`,
      nextStep: `다음 다이닝 해석에는 ${biggestDeltaTaste.label} 변화를 먼저 반영하고, 식후 피드백이 쌓이면 이 변화가 일시적인지 반복 패턴인지 더 정확히 구분해요.`,
      supportingText: `이번 변화는 다음 다이닝 개인화에 우선 반영돼요.`,
      title: `${biggestDeltaTaste.label} 변화가 이번 측정에서 두드러져요`,
    },
    {
      accentColor: getTasteColor(weakestTaste.label),
      description: `${weakestTaste.label}은 천천히 쌓이는 구성이 더 편안할 수 있어요`,
      eyebrow: '편안한 밀도',
      id: 'weakest-taste',
      meaning: `${weakestTaste.label} 자극이 한 번에 강하게 들어오기보다, 코스 안에서 부드럽게 이어질 때 전체 경험이 더 안정적으로 느껴질 가능성이 있어요.`,
      nextStep: `예약 개인화와 셰프 가이드에는 ${weakestTaste.label} 밀도를 한 번에 몰지 않고, 더 완만한 흐름에서 읽히도록 참고 포인트로 반영해요.`,
      supportingText: `코스 안에서는 한 번에 강하게 밀기보다 완만한 흐름으로 참고해요.`,
      title: `${weakestTaste.label}은 천천히 쌓이는 구성이 편안할 수 있어요`,
    },
    {
      accentColor: getTasteColor(strongestTaste.label),
      description: totalSensitivity > avgSensitivity
        ? '전체적으로 평균보다 민감한 프로필이에요'
        : '전체적으로 평균에 가까운 균형 잡힌 프로필이에요',
      eyebrow: '전체 프로필',
      id: 'overall-profile',
      meaning: totalSensitivity > avgSensitivity
        ? '맛의 대비와 전환이 비교적 또렷하게 느껴질 수 있어, 작은 차이도 식사 인상에 영향을 줄 가능성이 커요.'
        : '특정 축 하나가 압도하기보다 여러 맛의 균형과 연결감을 안정적으로 읽는 편으로 해석할 수 있어요.',
      nextStep: totalSensitivity > avgSensitivity
        ? '다음 다이닝 추천에서는 자극을 겹치기보다, 여백 있는 전개와 균형을 우선 검토해요.'
        : '다음 다이닝 추천에서는 한 가지 자극을 과하게 밀기보다, 코스 전체의 연결감과 균형을 중심으로 맞춰가요.',
      supportingText: totalSensitivity > avgSensitivity
        ? '다음 추천은 자극을 겹치기보다 여백과 균형을 먼저 봐요.'
        : '다음 추천은 코스 전체의 연결감과 균형을 중심으로 맞춰가요.',
      title: totalSensitivity > avgSensitivity
        ? '전반적으로 맛 변화를 빠르게 읽는 편이에요'
        : '전반적으로 균형 있게 읽는 프로필이에요',
    },
  ] satisfies AnalysisInsight[];
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

function formatMeasurementDayKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatRadarMeasurementLabel(
  snapshot: TasteMeasurementSnapshot,
  timeline: TasteMeasurementSnapshot[],
  latestSnapshot: TasteMeasurementSnapshot,
) {
  if (snapshot.measuredAt === latestSnapshot.measuredAt) {
    return '최근 측정';
  }

  const dayKey = formatMeasurementDayKey(snapshot.measuredAt);
  const hasSameDayMeasurement = timeline.some(
    (item) => item.measuredAt !== snapshot.measuredAt
      && formatMeasurementDayKey(item.measuredAt) === dayKey,
  );

  if (!hasSameDayMeasurement) {
    return formatTrendDateLabel(snapshot.measuredAt);
  }

  const parts = new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).formatToParts(new Date(snapshot.measuredAt));
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
  const timeLabel = [dayPeriod, `${hour}:${minute}`].filter(Boolean).join(' ');

  return `${formatTrendDateLabel(snapshot.measuredAt)} ${timeLabel}`;
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

function endOfMonth(value: Date) {
  return startOfDay(new Date(value.getFullYear(), value.getMonth() + 1, 0));
}

function startOfYear(value: Date) {
  return new Date(value.getFullYear(), 0, 1);
}

function startOfQuarter(value: Date) {
  const quarterStartMonth = Math.floor(value.getMonth() / 3) * 3;
  return startOfDay(new Date(value.getFullYear(), quarterStartMonth, 1));
}

function endOfQuarter(value: Date) {
  return endOfMonth(addMonths(startOfQuarter(value), 2));
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

function addYears(value: Date, amount: number) {
  return startOfDay(new Date(value.getFullYear() + amount, value.getMonth(), 1));
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
  return `${value.getMonth() + 1}.${value.getDate()}`;
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
    endOfMonth(new Date(dataBounds.latestMs)).getTime(),
    endOfQuarter(new Date(dataBounds.latestMs)).getTime(),
    endOfWeekMonday(new Date(dataBounds.latestMs)).getTime(),
    endOfYear(new Date(dataBounds.latestMs)).getTime(),
  );

  return {
    earliestMs: Math.min(dataBounds.earliestMs, paddedEarliestMs),
    latestMs: paddedLatestMs,
  };
}

function createCalendarTrendViewWindow(
  rangeId: TrendRangeId,
  anchorMs: number,
  navigationBounds: { earliestMs: number; latestMs: number },
) {
  const anchorDate = startOfDay(new Date(anchorMs));

  if (rangeId === 'week') {
    const startDate = startOfWeekMonday(anchorDate);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: addDays(startDate, 6).getTime(),
      },
      navigationBounds,
    );
  }

  if (rangeId === 'month') {
    const startDate = startOfMonth(anchorDate);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endOfMonth(anchorDate).getTime(),
      },
      navigationBounds,
    );
  }

  if (rangeId === 'quarter') {
    const startDate = startOfQuarter(anchorDate);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endOfQuarter(anchorDate).getTime(),
      },
      navigationBounds,
    );
  }

  if (rangeId === 'year') {
    const startDate = startOfYear(anchorDate);

    return clampTrendViewWindow(
      {
        startMs: startDate.getTime(),
        endMs: endOfYear(anchorDate).getTime(),
      },
      navigationBounds,
    );
  }

  return clampTrendViewWindow(
    {
      startMs: startOfYear(new Date(navigationBounds.earliestMs)).getTime(),
      endMs: endOfYear(new Date(navigationBounds.latestMs)).getTime(),
    },
    navigationBounds,
  );
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

function createTrendViewWindowFromRange(
  rangeId: TrendRangeId,
  dataBounds: { earliestMs: number; latestMs: number },
  navigationBounds: { earliestMs: number; latestMs: number },
) {
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

  return createCalendarTrendViewWindow(rangeId, dataBounds.latestMs, navigationBounds);
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
  const startDate = new Date(window.startMs);

  if (rangeId === 'week') {
    return createCalendarTrendViewWindow(
      'week',
      addDays(startDate, direction * 7).getTime(),
      bounds,
    );
  }

  if (rangeId === 'month') {
    return createCalendarTrendViewWindow(
      'month',
      addMonths(startDate, direction).getTime(),
      bounds,
    );
  }

  if (rangeId === 'quarter') {
    return createCalendarTrendViewWindow(
      'quarter',
      addMonths(startDate, direction * 3).getTime(),
      bounds,
    );
  }

  if (rangeId === 'year') {
    return createCalendarTrendViewWindow(
      'year',
      addYears(startDate, direction).getTime(),
      bounds,
    );
  }

  return window;
}

function getScaledTrendRangeId(rangeId: TrendRangeId, scaleFactor: number): TrendRangeId {
  const orderedRangeIds: TrendRangeId[] = ['week', 'month', 'quarter', 'year', 'all'];
  const currentIndex = Math.max(0, orderedRangeIds.indexOf(rangeId));
  const nextIndex = scaleFactor < 1
    ? Math.max(0, currentIndex - 1)
    : Math.min(orderedRangeIds.length - 1, currentIndex + 1);

  return orderedRangeIds[nextIndex] ?? rangeId;
}

function scaleTrendViewWindow(
  window: TrendViewWindow,
  rangeId: TrendRangeId,
  scaleFactor: number,
  dataBounds: { earliestMs: number; latestMs: number },
  navigationBounds: { earliestMs: number; latestMs: number },
) {
  const nextRangeId = getScaledTrendRangeId(rangeId, scaleFactor);
  const centerMs = window.startMs + (window.endMs - window.startMs) / 2;

  return {
    rangeId: nextRangeId,
    window: nextRangeId === 'all'
      ? createTrendViewWindowFromRange('all', dataBounds, navigationBounds)
      : createCalendarTrendViewWindow(nextRangeId, centerMs, navigationBounds),
  };
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
  const tickPositions = dates.map((_, index) => Number((index / 11).toFixed(4)));
  const gridPositions = tickPositions;
  const labelByPosition = tickPositions.reduce<Record<string, string>>((accumulator, position, index) => {
    accumulator[formatTrendPositionKey(position)] = formatTrendMonthAxisLabel(dates[index]);
    return accumulator;
  }, {});

  return {
    tickPositions,
    gridPositions,
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
  allRangeDataBounds?: { earliestMs: number; latestMs: number },
) {
  const startDate = startOfDay(new Date(window.startMs));
  const endDate = startOfDay(new Date(window.endMs));

  switch (rangeId) {
    case 'week': {
      const dates = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
      return appendTrendGridBoundary(
        sanitizeTrendGuide(buildTrendGuideFromDates(dates, formatTrendWeekdayLabel, window)),
        1,
      );
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
      return appendTrendGridBoundary(
        sanitizeTrendGuide(buildEqualYearMonthGuide(window)),
        1,
      );
    }
    case 'all':
    default: {
      const dataStartDate = startOfDay(new Date(allRangeDataBounds?.earliestMs ?? window.startMs));
      const dataEndDate = startOfDay(new Date(allRangeDataBounds?.latestMs ?? window.endMs));
      const sameYear = dataStartDate.getFullYear() === dataEndDate.getFullYear();
      const startLabel = sameYear
        ? formatTrendMonthDayAxisLabel(dataStartDate)
        : formatTrendYearRangeLabel(dataStartDate);
      const endLabel = sameYear
        ? formatTrendMonthDayAxisLabel(dataEndDate)
        : formatTrendYearRangeLabel(dataEndDate);

      return {
        tickPositions: [0, 1],
        gridPositions: [0, 1],
        labelByPosition: {
          [formatTrendPositionKey(0)]: startLabel,
          [formatTrendPositionKey(1)]: endLabel,
        },
      };
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
  _points: ProfileChangeTrendPoint[],
  _visibleTasteLabels: string[],
) {
  return {
    domain: [0, 100] as [number, number],
    ticks: [20, 40, 60, 80, 100],
  };
}

function formatTasteTrendDelta(delta: number) {
  if (Math.abs(delta) < 1) {
    return '변화 적음';
  }

  return `${delta > 0 ? '+' : ''}${delta}점`;
}

function buildTasteTrendDetailInfo({
  points,
  selectedTaste,
  visibleTasteLabels,
}: {
  points: ProfileChangeTrendPoint[];
  selectedTaste: (typeof TREND_TASTE_OPTIONS)[number];
  visibleTasteLabels: string[];
}) {
  const visiblePoints = points.filter((point) => point.isVisible);
  const firstPoint = visiblePoints[0];
  const lastPoint = visiblePoints[visiblePoints.length - 1];
  const hasHistory = !!firstPoint && !!lastPoint && visiblePoints.length > 1;

  if (!hasHistory) {
    const currentTaste = selectedTaste === '모든맛' ? '전체 미각' : selectedTaste;

    return {
      accentTaste: selectedTaste,
      currentLabel: '현재 기준',
      deltaLabel: '기준 형성 중',
      endScore: selectedTaste === '모든맛' ? undefined : lastPoint?.[selectedTaste],
      eyebrow: '첫 기준',
      meaning:
        '아직 변화폭을 단정하기보다는 이번 값을 다음 식사를 맞추는 시작 기준으로 보는 단계예요.',
      nextStep:
        '다음 측정이나 식사 피드백이 쌓이면 이 축이 안정적으로 유지되는지, 혹은 다이닝 맥락에 따라 달라지는지 이어서 확인합니다.',
      startScore: undefined,
      title: `${currentTaste}의 변화 기준을 쌓고 있어요`,
      whatWeKnow:
        '현재 측정값은 예약 개인화에 바로 사용할 수 있지만, 반복 추세는 다음 기록부터 더 자연스럽게 읽힙니다.',
    };
  }

  if (selectedTaste !== '모든맛') {
    const startScore = firstPoint[selectedTaste];
    const endScore = lastPoint[selectedTaste];
    const delta = endScore - startScore;
    const directionPhrase =
      Math.abs(delta) < 1
        ? '큰 흔들림 없이 유지되는 흐름'
        : delta > 0
          ? '조금 더 선명하게 올라온 흐름'
          : '조금 더 부드럽게 낮아진 흐름';

    return {
      accentTaste: selectedTaste,
      currentLabel: '현재',
      deltaLabel: formatTasteTrendDelta(delta),
      endScore,
      eyebrow: `${selectedTaste} 세부 변화`,
      meaning:
        Math.abs(delta) < 1
          ? `${selectedTaste}은 현재 안정적인 기준으로 읽혀요. 다음 다이닝에서는 이 축을 크게 조정하기보다 다른 맛과의 균형을 확인하는 데 쓰입니다.`
          : `${selectedTaste}은 ${directionPhrase}으로 읽혀요. 강도를 단정하기보다 코스 안에서 어떤 맛과 함께 놓일 때 편안한지 보는 기준입니다.`,
      nextStep:
        `${selectedTaste}이 중심이 되는 메뉴에서는 셰프의 의도를 바꾸기보다, 여운과 받침 맛의 균형을 참고 포인트로 전달합니다.`,
      startScore,
      title: `${selectedTaste}은 ${directionPhrase}이에요`,
      whatWeKnow:
        `${startScore}점에서 ${endScore}점으로 이어졌고, 최근 기준에서는 ${Math.abs(delta) < 1 ? '유사한 반응' : delta > 0 ? '더 또렷한 반응' : '더 부드러운 반응'}으로 정리됩니다.`,
    };
  }

  const rankedChanges = visibleTasteLabels
    .map((taste) => {
      const startScore = firstPoint[taste as keyof ProfileChangeTrendPoint];
      const endScore = lastPoint[taste as keyof ProfileChangeTrendPoint];

      return {
        delta: typeof startScore === 'number' && typeof endScore === 'number' ? endScore - startScore : 0,
        endScore,
        startScore,
        taste,
      };
    })
    .filter(
      (item): item is {
        delta: number;
        endScore: number;
        startScore: number;
        taste: string;
      } => typeof item.startScore === 'number' && typeof item.endScore === 'number',
    )
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));

  const strongestChange = rankedChanges[0];

  if (!strongestChange || Math.abs(strongestChange.delta) < 1) {
    return {
      accentTaste: '모든맛',
      currentLabel: '전체',
      deltaLabel: '안정적',
      endScore: undefined,
      eyebrow: '전체 흐름',
      meaning:
        '전체 미각 축이 큰 흔들림 없이 유지되고 있어, 다음 다이닝에서는 세부 취향보다 현재 균형을 안정적으로 반영하는 쪽이 좋습니다.',
      nextStep:
        '예약 가이드에는 큰 조정 요청보다 현재 균형을 유지하는 참고 신호로 전달됩니다.',
      startScore: undefined,
      title: '전체 미각 균형이 안정적으로 유지되고 있어요',
      whatWeKnow:
        '선택한 기간 안에서 두드러지게 흔들린 축이 크지 않아, 지금 프로필은 비교적 일관된 기준으로 읽힙니다.',
    };
  }

  const directionPhrase = strongestChange.delta > 0 ? '더 또렷해진 축' : '더 부드러워진 축';

  return {
    accentTaste: strongestChange.taste,
    currentLabel: '주요 변화',
    deltaLabel: formatTasteTrendDelta(strongestChange.delta),
    endScore: strongestChange.endScore,
    eyebrow: '전체 흐름',
    meaning:
      `${strongestChange.taste}이 가장 ${directionPhrase}으로 읽혀요. 이 변화는 단일 취향 판단보다 코스 안에서 어떤 맛을 받쳐주면 좋은지 보는 참고점입니다.`,
    nextStep:
      '다음 예약 가이드에는 가장 큰 변화 축을 먼저 반영하되, 셰프에게는 조정 명령이 아니라 손님이 더 편안하게 의도를 받을 수 있는 힌트로 전달합니다.',
    startScore: strongestChange.startScore,
    title: `${strongestChange.taste} 변화가 가장 먼저 읽혀요`,
    whatWeKnow:
      `${strongestChange.taste}은 ${strongestChange.startScore}점에서 ${strongestChange.endScore}점으로 이어졌고, 선택한 기간에서 가장 뚜렷한 변화로 정리됩니다.`,
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

function aggregateMeasurementsByDay(snapshots: TasteMeasurementSnapshot[]) {
  const groupedSnapshots = snapshots.reduce<Record<string, TasteMeasurementSnapshot[]>>((groups, snapshot) => {
    const dayKey = formatMeasurementDayKey(snapshot.measuredAt);
    groups[dayKey] = [...(groups[dayKey] ?? []), snapshot];
    return groups;
  }, {});

  return Object.entries(groupedSnapshots)
    .map<TasteMeasurementSnapshot>(([dayKey, daySnapshots]) => {
      const measuredAt = `${dayKey}T12:00:00+09:00`;
      const results = TASTE_IDS.reduce<TasteMeasurementResults>((accumulator, tasteId) => {
        const values = daySnapshots
          .map((snapshot) => snapshot.results[tasteId])
          .filter((value): value is number => typeof value === 'number');
        const fallbackValue = resolveTasteMeasurementValue(daySnapshots[daySnapshots.length - 1], tasteId);

        accumulator[tasteId] =
          values.length > 0
            ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
            : fallbackValue;

        return accumulator;
      }, {} as TasteMeasurementResults);

      return {
        measuredAt,
        results,
        source: daySnapshots.some((snapshot) => snapshot.source === 'measured')
          ? 'measured'
          : daySnapshots[daySnapshots.length - 1]?.source,
      };
    })
    .sort(
      (left, right) =>
        new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
    );
}

function buildProfileChangeTrendData(
  snapshots: TasteMeasurementSnapshot[],
  window: TrendViewWindow | null,
  rangeId: TrendRangeId,
) {
  const sortedSnapshots = aggregateMeasurementsByDay(snapshots)
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
      const rawPosition = monthIndex >= 11
        ? 1
        : monthIndex / 11 + monthProgress / 11;

      return Math.max(0, Math.min(1, Number(rawPosition.toFixed(4))));
    }

    if (rangeId === 'all') {
      const firstMeasuredAt = startOfDay(new Date(sortedSnapshots[0]?.measuredAt ?? window.startMs)).getTime();
      const lastMeasuredAt = startOfDay(new Date(sortedSnapshots[sortedSnapshots.length - 1]?.measuredAt ?? window.endMs)).getTime();
      const denominator = Math.max(DAY_IN_MS, lastMeasuredAt - firstMeasuredAt);
      const rawPosition = sortedSnapshots.length === 1
        ? 0.5
        : (measuredAt - firstMeasuredAt) / denominator;

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

interface AnalysisPageProps {
  isActive?: boolean;
  measurementSnapshot: TasteMeasurementSnapshot;
  onStartMeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onOpenRestaurantDetail?: (menu: RealMenuRecommendationCardData) => void;
  hasUnreadNotifications?: boolean;
}

export default function AnalysisPage({
  isActive = true,
  measurementSnapshot,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  onOpenRestaurantDetail,
  hasUnreadNotifications,
}: AnalysisPageProps) {
  const initialTimeline = [measurementSnapshot];
  const initialTrendDataBounds = getTrendDataBounds(initialTimeline, measurementSnapshot);
  const initialTrendNavigationBounds = getTrendNavigationBounds(initialTrendDataBounds);
  const [measurementTimeline, setMeasurementTimeline] = useState<TasteMeasurementSnapshot[]>(initialTimeline);
  const [selectedRadarMeasurementIndex, setSelectedRadarMeasurementIndex] = useState(0);
  const [reservations, setReservations] = useState<ReservationRecord[]>(RESERVATION_CATALOG);
  const [feedbackByReservationId, setFeedbackByReservationId] = useState<Record<number, DiningFeedbackDraft>>({});
  const [selectedTrendRange, setSelectedTrendRange] = useState<TrendRangeId>('all');
  const [trendViewWindow, setTrendViewWindow] = useState<TrendViewWindow>(
    createTrendViewWindowFromRange('all', initialTrendDataBounds, initialTrendNavigationBounds),
  );
  const [selectedTasteIndex, setSelectedTasteIndex] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<AnalysisInsight | null>(null);
  const [isInsightDrawerOpen, setIsInsightDrawerOpen] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [activeLegacyDetail, setActiveLegacyDetail] = useState<'taste-profile' | 'special-note' | null>(null);
  const [isTasteChangePageOpen, setIsTasteChangePageOpen] = useState(false);
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
  const chefTranslationInsight: AnalysisInsight = {
    description: CHEF_TRANSLATION_COPY,
    eyebrow: '셰프 참고 가이드',
    id: 'chef-translation',
    indicatorBackground: chefTranslationIndicatorBackground,
    meaning: '현재는 단맛과 신맛이 겹치는 구간에서 반응이 빠르게 올라와, 자극이 밀집되면 전체 인상이 조금 더 강하게 느껴질 수 있어요.',
    nextStep: '예약 개인화와 셰프 가이드에는 산미와 단맛의 밀도를 조금 나눠 읽는 참고 포인트로 전달돼요. 레시피를 바꾸라는 뜻이 아니라, 현재 손님의 수용 리듬을 이해하는 수준이에요.',
    title: '셰프가 참고할 현재 프로필 가이드',
  };
  const trendDataBounds = getTrendDataBounds(measurementTimeline, measurementSnapshot);
  const trendNavigationBounds = getTrendNavigationBounds(trendDataBounds);
  const activeTrendRange = selectedTrendRange;
  const filteredMeasurements = filterMeasurementsByWindow(measurementTimeline, trendViewWindow);
  const trendData = buildProfileChangeTrendData(filteredMeasurements, trendViewWindow, activeTrendRange);
  const selectedRadarMeasurement =
    measurementTimeline[selectedRadarMeasurementIndex]
    ?? measurementTimeline[measurementTimeline.length - 1]
    ?? measurementSnapshot;
  const selectedRadarData = getTasteMeasurementEntries(selectedRadarMeasurement);
  const selectedRadarTotalSensitivity = getAverageMeasurementMm(selectedRadarMeasurement);
  const selectedRadarPeriod = formatRadarMeasurementLabel(
    selectedRadarMeasurement,
    measurementTimeline,
    measurementSnapshot,
  );
  const canShowPreviousRadarMeasurement = selectedRadarMeasurementIndex > 0;
  const canShowNextRadarMeasurement = selectedRadarMeasurementIndex < measurementTimeline.length - 1;
  const profileConfidenceStage = deriveProfileConfidenceStage(measurementTimeline.length);
  const legacyReservationHint = buildHomeReservationHint(reservations);
  const legacyTasteProfile = buildHomeTasteProfileFromMeasurements(measurementTimeline);
  const legacyTasteProfileCard = legacyTasteProfile.cardData;
  const legacySpecialNoteCard = buildHomeSpecialNoteFromReservations(
    reservations,
    feedbackByReservationId,
    legacyReservationHint,
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
  const trendRangeAccentColor =
    selectedTaste === '모든맛' ? NEUTRAL_TASTE_TOKENS.palette.main : getTasteColor(selectedTaste);
  const trendRangeAccentTint =
    selectedTaste === '모든맛' ? NEUTRAL_TASTE_TOKENS.palette.tintSurface : getTasteTint(selectedTaste, 0.12);
  const visibleTasteLabels = selectedTaste === '모든맛' ? [...GRAPH_TASTE_ORDER] : [selectedTaste];
  const visibleTrendData = trendData.filter((point) => point.isVisible);
  const trendAxisConfig = buildTrendAxisConfig(visibleTrendData, visibleTasteLabels);
  const trendRangeLabel = buildTrendRangeLabel(trendViewWindow, activeTrendRange);
  const tasteTrendDetailInfo = buildTasteTrendDetailInfo({
    points: trendData,
    selectedTaste,
    visibleTasteLabels,
  });
  const tasteTrendDetailAccentColor =
    tasteTrendDetailInfo.accentTaste === '모든맛'
      ? NEUTRAL_TASTE_TOKENS.palette.main
      : getTasteColor(tasteTrendDetailInfo.accentTaste);
  const tasteTrendDetailAccentTint =
    tasteTrendDetailInfo.accentTaste === '모든맛'
      ? NEUTRAL_TASTE_TOKENS.palette.tintSurface
      : getTasteTint(tasteTrendDetailInfo.accentTaste, 0.12);
  const trendPeriodGuide = buildTrendPeriodGuide(
    activeTrendRange,
    trendViewWindow,
    trendDataBounds,
  );
  const handleOpenInsightDetail = (insight: AnalysisInsight) => {
    setSelectedInsight(insight);
    setIsInsightDrawerOpen(true);
  };
  const visibleInsights = showAllInsights ? insights : insights.slice(0, 1);
  const canToggleInsights = insights.length > 1;

  if (activeLegacyDetail === 'taste-profile') {
    return (
      <LegacyHomeTasteProfileDetailScreen
        cardData={legacyTasteProfile.cardData}
        onBack={() => setActiveLegacyDetail(null)}
        overviewValues={legacyTasteProfile.overviewValues}
        series={legacyTasteProfile.series}
      />
    );
  }

  if (activeLegacyDetail === 'special-note') {
    return (
      <LegacyHomeSpecialNoteDetailScreen
        cardData={legacySpecialNoteCard}
        onBack={() => setActiveLegacyDetail(null)}
        reservationHint={legacyReservationHint}
      />
    );
  }

  const trendLeadingInset = 0;
  const trendTrailingInset = 0;
  const trendChartEdgeGutter = TREND_CHART_GRID_EDGE_GUTTER;
  const trendChartLeftGutter = trendChartEdgeGutter;
  const trendChartRightGutter = trendChartEdgeGutter;
  const trendYAxisReservedWidth = TREND_CHART_Y_AXIS_WIDTH + TREND_CHART_Y_AXIS_GAP;
  const trendGridStepFraction =
    trendPeriodGuide.gridPositions.length > 1
      ? trendPeriodGuide.gridPositions[1] - trendPeriodGuide.gridPositions[0]
      : 0.25;
  const trendChartDomainEnd = 1 + trendTrailingInset;
  const trendChartDomainStart = -trendLeadingInset;
  const trendChartDomainSpan = Math.max(0.0001, trendChartDomainEnd - trendChartDomainStart);
  const trendExtendedOffsetSpan = activeTrendRange === 'week' ? 1 + trendGridStepFraction : 1;
  const trendExtendedGuides = (activeTrendRange === 'all' ? [0] : [-1, 0, 1]).map((direction) => {
    const guideWindow = direction === 0
      ? trendViewWindow
      : shiftTrendViewWindow(trendViewWindow, activeTrendRange, direction as -1 | 1, trendNavigationBounds);
    const guide = direction === 0
      ? trendPeriodGuide
      : buildTrendPeriodGuide(activeTrendRange, guideWindow, trendDataBounds);

    return {
      guide,
      offset: direction * trendExtendedOffsetSpan,
    };
  });
  const trendExtendedGridPositions = trendExtendedGuides
    .flatMap(({ guide, offset }) => guide.gridPositions.map((position) => position + offset))
    .filter((position, index, positions) => positions.findIndex((item) => Math.abs(item - position) < 0.0005) === index);
  const trendExtendedTickLabels = trendExtendedGuides.flatMap(({ guide, offset }) =>
    guide.tickPositions.map((position, index) => {
      const valueKey = formatTrendPositionKey(position);

      return {
        key: `${offset}-${valueKey}`,
        label: guide.labelByPosition[valueKey],
        value: position + offset,
      };
    }).filter((item) => item.label),
  );
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
    const next = scaleTrendViewWindow(
      trendViewWindow,
      activeTrendRange,
      scaleFactor,
      trendDataBounds,
      trendNavigationBounds,
    );
    setSelectedTrendRange(next.rangeId);
    updateTrendWindow(
      next.window,
      scaleFactor < 1 ? 'zoom-in' : 'zoom-out',
    );
  };

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const [recentMeasurements, reservationPageData] = await Promise.all([
        hydrateRecentMeasurementSnapshots(),
        hydrateReservationPageData(),
      ]);

      if (isCancelled) {
        return;
      }

      const mergedMeasurements = mergeMeasurementSnapshots(recentMeasurements, measurementSnapshot);
      const nextMeasurements = mergedMeasurements.length > 0 ? mergedMeasurements : [measurementSnapshot];

      setMeasurementTimeline(nextMeasurements);
      setSelectedRadarMeasurementIndex(Math.max(0, nextMeasurements.length - 1));
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

  const handleMoveRadarMeasurement = (direction: -1 | 1) => {
    setSelectedRadarMeasurementIndex((currentIndex) => {
      const timelineLength = measurementTimeline.length;

      if (timelineLength <= 1) {
        return currentIndex;
      }

      return Math.max(0, Math.min(timelineLength - 1, currentIndex + direction));
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
      const next = scaleTrendViewWindow(
        initialWindow,
        activeTrendRange,
        nextScale,
        trendDataBounds,
        trendNavigationBounds,
      );
      setTrendViewWindow(next.window);
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
      const nextRangeId = deriveTrendRangeIdFromWindow(trendViewWindow, trendDataBounds);
      const nextWindow = nextRangeId === 'all'
        ? createTrendViewWindowFromRange('all', trendDataBounds, trendNavigationBounds)
        : createCalendarTrendViewWindow(
          nextRangeId,
          trendViewWindow.startMs + (trendViewWindow.endMs - trendViewWindow.startMs) / 2,
          trendNavigationBounds,
        );
      setSelectedTrendRange(nextRangeId);
      setTrendViewWindow(nextWindow);
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

  const tasteChangeRangeTabs = (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full justify-center gap-[8px]">
        {TREND_RANGE_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => handleSelectTrendRange(option.id)}
            className={`h-auto flex-none rounded-full border px-[14px] py-[8px] text-[13px] font-semibold transition-colors ${activeTrendRange === option.id
              ? ''
              : 'border-transparent bg-transparent text-[var(--tb-color-text-tertiary)]'
              }`}
            style={activeTrendRange === option.id ? {
              backgroundColor: trendRangeAccentTint,
              borderColor: 'transparent',
              color: trendRangeAccentColor,
            } : undefined}
            aria-pressed={activeTrendRange === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const tasteChangeChartSection = (
    <div className="tb-section-stack animate-fadeIn">
      <SectionCard className="!rounded-none">
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
            <ChevronLeftIcon size={ICON_TOKENS.size.sm} className="-translate-x-px" />
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
            <ChevronRightIcon size={ICON_TOKENS.size.sm} className="translate-x-px" />
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
              size={ICON_TOKENS.size.lg}
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
              size={ICON_TOKENS.size.lg}
            />
            <span className="truncate text-[12px] font-semibold leading-none">{nextTaste}</span>
          </button>
        </div>
        <div
          className="-mx-3 h-[280px] w-[calc(100%+24px)] touch-none select-none"
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
          <div className="relative h-full w-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                right: trendYAxisReservedWidth,
                transform: `translateX(calc(${visibleTrendDragOffsetX}px + ${visibleTrendMotionOffsetPercent}%)) scale(${trendMotionScale})`,
                transition: isTrendDragging ? 'none' : 'transform 260ms steps(4, end), opacity 220ms linear',
                opacity: isTrendDragging
                  ? shouldLockTrendGridDuringSwipe
                    ? 0.96
                    : Math.max(0.84, 1 - Math.abs(trendDragOffsetX) / 240)
                  : 1,
              }}
            >
              <div
                className="pointer-events-none absolute z-0"
                style={{
                  top: TREND_CHART_TOP_MARGIN,
                  bottom: TREND_CHART_X_AXIS_HEIGHT,
                  left: 0,
                  right: 0,
                }}
                aria-hidden="true"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-y-0 left-[-100%] w-[300%]">
                    {trendAxisConfig.ticks.map((value) => {
                      const [domainMin, domainMax] = trendAxisConfig.domain;
                      const ratio = (domainMax - value) / Math.max(1, domainMax - domainMin);

                      return (
                        <span
                          key={`trend-horizontal-grid-${value}`}
                          className="absolute left-0 h-px w-full"
                          style={{
                            top: `${ratio * 100}%`,
                            backgroundColor: TREND_GRID_HORIZONTAL_STROKE,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: trendChartLeftGutter,
                    right: trendChartRightGutter,
                  }}
                >
                  <div className="absolute inset-y-0 left-[-100%] w-[300%]">
                    {trendExtendedGridPositions.map((value) => {
                      const ratio = (value - trendChartDomainStart) / trendChartDomainSpan;
                      const isRightEdgeGridLine = Math.abs(ratio - 1) < 0.0005;

                      return (
                        <span
                          key={`trend-extended-grid-${value}`}
                          className="absolute top-0 h-full border-l"
                          style={{
                            left: `${((ratio + 1) / 3) * 100}%`,
                            borderColor: TREND_GRID_VERTICAL_STROKE,
                            borderLeftStyle: 'dashed',
                            transform: isRightEdgeGridLine ? 'translateX(-1px)' : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: trendChartLeftGutter,
                    right: trendChartRightGutter,
                  }}
                >
                  <div className="absolute inset-y-0 left-[-100%] w-[300%]">
                    {trendExtendedTickLabels.map((item) => {
                      const ratio = (item.value - trendChartDomainStart) / trendChartDomainSpan;

                      return (
                        <span
                          key={`trend-extended-label-${item.key}`}
                          className="absolute top-[calc(100%+4px)] whitespace-nowrap text-[11px] text-[var(--tb-color-text-hint)]"
                          style={{
                            left: `${((ratio + 1) / 3) * 100}%`,
                          }}
                        >
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <LineChart
                  data={trendData}
                  margin={{
                    top: TREND_CHART_TOP_MARGIN,
                    right: trendChartEdgeGutter,
                    bottom: 0,
                    left: trendChartLeftGutter,
                  }}
                >
                  <XAxis
                    type="number"
                    dataKey="xPosition"
                    domain={[-trendLeadingInset, trendChartDomainEnd]}
                    ticks={trendPeriodGuide.tickPositions}
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    padding={{ left: 0, right: 0 }}
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
                    width={0}
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
              className="pointer-events-none absolute right-0 bg-[var(--tb-color-surface-base)]"
              style={{
                top: TREND_CHART_TOP_MARGIN,
                bottom: TREND_CHART_X_AXIS_HEIGHT,
                width: trendYAxisReservedWidth,
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
      <PageSection
        className="px-5"
        contentClassName="w-full"
        title="미각 세부 정보"
        titleSize="md"
      >
        <SectionCard hoverEffect={false}>
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                  {tasteTrendDetailInfo.eyebrow}
                </p>
                <p className="mt-1 text-[15px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                  {tasteTrendDetailInfo.title}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-[6px] text-[12px] font-semibold"
                style={{
                  backgroundColor: tasteTrendDetailAccentTint,
                  color: tasteTrendDetailAccentColor,
                }}
              >
                {tasteTrendDetailInfo.deltaLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                <p className="text-[11px] font-semibold text-[var(--tb-color-text-hint)]">
                  시작
                </p>
                <p className="mt-1 text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                  {typeof tasteTrendDetailInfo.startScore === 'number'
                    ? `${tasteTrendDetailInfo.startScore}점`
                    : '기준 없음'}
                </p>
              </div>
              <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-3">
                <p className="text-[11px] font-semibold text-[var(--tb-color-text-hint)]">
                  {tasteTrendDetailInfo.currentLabel}
                </p>
                <p className="mt-1 text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                  {typeof tasteTrendDetailInfo.endScore === 'number'
                    ? `${tasteTrendDetailInfo.endScore}점`
                    : `${selectedTasteMeta.score}점`}
                </p>
              </div>
              <div className="rounded-[12px] px-3 py-3" style={{ backgroundColor: tasteTrendDetailAccentTint }}>
                <p className="text-[11px] font-semibold" style={{ color: tasteTrendDetailAccentColor }}>
                  변화
                </p>
                <p className="mt-1 text-[14px] font-bold" style={{ color: tasteTrendDetailAccentColor }}>
                  {tasteTrendDetailInfo.deltaLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: '지금 읽히는 변화', text: tasteTrendDetailInfo.whatWeKnow },
                { label: '다이닝에서의 의미', text: tasteTrendDetailInfo.meaning },
                { label: '다음 반영 방식', text: tasteTrendDetailInfo.nextStep },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[12px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] px-3 py-3"
                >
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </PageSection>
    </div>
  );

  if (isTasteChangePageOpen) {
    return (
      <TasteChangePage
        onBack={() => setIsTasteChangePageOpen(false)}
        onOpenMenu={onOpenMenu}
        topSlot={tasteChangeRangeTabs}
      >
        {tasteChangeChartSection}
      </TasteChangePage>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-20 pt-5 animate-fadeIn">
          <PageSection title="나의 미각" titleAs="h1" titleSize="lg" contentClassName="flex flex-col gap-3">
            <PalateSignatureHeroCard
              measurementAgeLabel={measurementAgeLabel}
              tasteEntries={myTasteData}
            />

            <InterpretationCard
              detailLabel="가이드 보기"
              description={chefTranslationInsight.description}
              eyebrow={chefTranslationInsight.eyebrow}
              indicatorBackground={chefTranslationInsight.indicatorBackground}
              onExpand={() => handleOpenInsightDetail(chefTranslationInsight)}
            />

            <ProfileConfidenceCard
              measurementAgeLabel={measurementAgeLabel}
              measurementCount={measurementTimeline.length}
              needsMeasurementRefresh={needsMeasurementRefresh}
              stage={profileConfidenceStage}
              strongestTasteLabel={getStrongestTasteMeasurement(measurementSnapshot).label}
              weakestTasteLabel={getWeakestTasteMeasurement(measurementSnapshot).label}
            />

            <SectionCard hoverEffect={false}>
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  aria-label="이전 측정 그래프 보기"
                  disabled={!canShowPreviousRadarMeasurement}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
                  onClick={() => handleMoveRadarMeasurement(-1)}
                >
                  <ChevronLeftIcon size={ICON_TOKENS.size.lg} className="-translate-x-px text-[var(--tb-color-icon-primary)]" />
                </button>
                <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                  {selectedRadarPeriod}
                </span>
                <button
                  type="button"
                  aria-label="다음 측정 그래프 보기"
                  disabled={!canShowNextRadarMeasurement}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
                  onClick={() => handleMoveRadarMeasurement(1)}
                >
                  <ChevronRightIcon size={ICON_TOKENS.size.lg} className="translate-x-px text-[var(--tb-color-icon-primary)]" />
                </button>
              </div>

              <div className="flex w-full flex-col items-center animate-slideUp">
                <HexRadarChart myTasteData={selectedRadarData} shouldAnimate={isActive} />

                <div className="mt-2 flex items-end gap-0">
                  <div className="flex flex-col items-center gap-[4px]">
                    <span className="text-[10px] text-[var(--tb-color-text-hint)]">나의 반응</span>
                    <span className="rounded-[6px] bg-[var(--tb-color-text-primary)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">
                      {selectedRadarTotalSensitivity > avgSensitivity + 0.5 ? '민감' : selectedRadarTotalSensitivity < avgSensitivity - 0.5 ? '부드러움' : '평균'}
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

            <LegacyHomeTasteProfileCard
              cardData={legacyTasteProfileCard}
              onOpenDetail={() => setIsTasteChangePageOpen(true)}
            />

            <LegacyHomeSpecialNoteCard
              cardData={legacySpecialNoteCard}
              onOpenDetail={() => setActiveLegacyDetail('special-note')}
            />
          </PageSection>

          <PageSection title="세부 분석" titleSize="md">
            <CardScrollList>
              {myTasteData.map((item, idx) => {
                const taste = TASTE_TOKENS[item.id];

                return (
                  <TasteTintCard
                    key={item.id}
                    className="shrink-0 animate-slideUp"
                    style={{
                      animationDelay: `${idx * 80}ms`,
                      animationFillMode: 'both',
                    }}
                    description={formatTasteDeltaSummary(item.deltaMm)}
                    detail={`현재 반응 ${item.score}점`}
                    tasteId={item.id}
                    title={item.label}
                    leading={
                      item.deltaMm > 0 ? (
                        <svg
                          width={ICON_TOKENS.size.xl}
                          height={ICON_TOKENS.size.xl}
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 12L12 4M12 4H6M12 4V10"
                            stroke={taste.palette.main}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : item.deltaMm < 0 ? (
                        <svg
                          width={ICON_TOKENS.size.xl}
                          height={ICON_TOKENS.size.xl}
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4L12 12M12 12H6M12 12V6"
                            stroke={taste.palette.main}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width={ICON_TOKENS.size.xl}
                          height={ICON_TOKENS.size.xl}
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 8H12"
                            stroke={taste.palette.main}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )
                    }
                    leadingStyle={{ backgroundColor: 'var(--tb-color-surface-base)' }}
                  />
                );
              })}
            </CardScrollList>
          </PageSection>

          {/* 인사이트 */}
          <PageSection
            title={(
              <div className="flex w-full items-center justify-between gap-3">
                <span>인사이트</span>
                {canToggleInsights ? (
                  <button
                    type="button"
                    className="rounded-full"
                    onClick={() => setShowAllInsights((prev) => !prev)}
                    aria-expanded={showAllInsights}
                    aria-label={showAllInsights ? '인사이트 접기' : '인사이트 전체보기'}
                  >
                    <CardDetailLabel
                      direction={showAllInsights ? 'up' : 'down'}
                      label={showAllInsights ? '접기' : '전체보기'}
                    />
                  </button>
                ) : null}
              </div>
            )}
            titleAs="div"
            titleSize="md"
            className="pb-6"
          >
            <div className="flex flex-col gap-3">
              {visibleInsights.map((item) => (
                <InterpretationCard
                  key={item.id}
                  accentColor={item.accentColor}
                  detailLabel="해석 보기"
                  description={item.description}
                  eyebrow={item.eyebrow}
                  onExpand={() => handleOpenInsightDetail(item)}
                  supportingText={item.supportingText}
                />
              ))}
            </div>
          </PageSection>
        </div>
      </div>

      <InterpretationDetailDrawer
        interpretation={selectedInsight}
        open={isInsightDrawerOpen}
        onOpenChange={setIsInsightDrawerOpen}
      />
    </div>
  );
}
