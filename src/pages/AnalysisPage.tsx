import {
  ChevronLeftRegular, ChevronRightRegular, InfoRegular
} from '@fluentui/react-icons';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const ChevronLeft = wrapIcon(ChevronLeftRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);
const Info = wrapIcon(InfoRegular);
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import OutlineBadge from '../components/system/OutlineBadge';
import SectionTitle from '../components/system/SectionTitle';
import { DATA_VIZ_TOKENS, TASTE_LABELS } from '../constants/designTokens';
import { TASTE_COLORS, getTasteColor, getTasteTint, mixHexColors } from '../constants/tasteColors';
import {
  formatMeasurementDate,
  formatMeasurementValue,
  getAverageMeasurementMm,
  getTasteMeasurementAgeLabel,
  getAverageReferenceMeasurementMm,
  getStrongestTasteMeasurement,
  getTasteMeasurementEntries,
  getTasteProfileBadge,
  getWeakestTasteMeasurement,
  isTasteMeasurementStale,
  type TasteMeasurementEntry,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';

// 측정/피드백 기반 변화 데이터 (미각별 라인이 겹치지 않도록 간격 조정)
const profileChangeTrend = [
  { event: '03.02', 단맛: 95, 신맛: 82, 쓴맛: 69, 짠맛: 58, 감칠맛: 44, 지방맛: 20 },
  { event: '03.08', 단맛: 92, 신맛: 79, 쓴맛: 66, 짠맛: 61, 감칠맛: 47, 지방맛: 18 },
  { event: '03.17', 단맛: 96, 신맛: 81, 쓴맛: 64, 짠맛: 59, 감칠맛: 41, 지방맛: 22 },
  { event: '03.24', 단맛: 94, 신맛: 84, 쓴맛: 67, 짠맛: 60, 감칠맛: 45, 지방맛: 15 },
];

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
const PROFILE_CHANGE_TREND_LAST_INDEX = profileChangeTrend.length - 1;
const GRAPH_TASTE_ORDER = TASTE_LABELS;

type ProfileChangeTrendPoint = (typeof profileChangeTrend)[number];

interface WeeklyTrendActiveDotProps {
  cx?: number;
  cy?: number;
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
  index?: number;
  payload?: {
    value?: string;
  };
  x?: number;
  y?: number;
}

function WeeklyTrendActiveDot({
  cx,
  cy,
  taste,
}: WeeklyTrendActiveDotProps & {
  taste: string;
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number') {
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

function WeeklyTrendCursor({
  height,
  payload,
  points,
  top,
}: WeeklyTrendCursorProps) {
  const x = points?.[0]?.x;
  const startY = points?.[0]?.y;
  const defaultEndY = points?.[1]?.y;

  if (
    typeof x !== 'number' ||
    typeof startY !== 'number' ||
    typeof defaultEndY !== 'number' ||
    typeof top !== 'number' ||
    typeof height !== 'number'
  ) {
    return null;
  }

  const bottomMostPointY = (payload ?? []).reduce<number | null>((currentBottomY, entry) => {
    const value = Number(entry.value);

    if (!Number.isFinite(value)) {
      return currentBottomY;
    }

    const clampedValue = Math.max(0, Math.min(100, value));
    const nextY = top + height * (1 - clampedValue / 100);

    if (currentBottomY === null) {
      return nextY;
    }

    return Math.max(currentBottomY, nextY);
  }, null);

  const endY = bottomMostPointY === null
    ? defaultEndY
    : Math.min(
        defaultEndY,
        bottomMostPointY + TREND_ACTIVE_DOT_OUTER_RADIUS + TREND_GUIDE_GAP + TREND_GUIDE_BOTTOM_TAIL,
      );

  return (
    <line
      x1={x}
      x2={x}
      y1={startY}
      y2={endY}
      stroke="#0F0F0F"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
}

function WeeklyTrendAxisTick({
  index,
  payload,
  x,
  y,
}: WeeklyTrendAxisTickProps) {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }

  const isFirst = index === 0;
  const isLast = index === PROFILE_CHANGE_TREND_LAST_INDEX;

  return (
    <text
      x={x}
      y={y + 10}
      fill="var(--tb-color-text-hint)"
      fontSize="11"
      textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
      dx={isFirst ? 2 : isLast ? -2 : 0}
    >
      {payload?.value}
    </text>
  );
}

interface WeeklyTrendTooltipEntry {
  dataKey?: string | number;
  payload?: ProfileChangeTrendPoint;
  value?: number | string;
}

function WeeklyTrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: WeeklyTrendTooltipEntry[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const activeDatum = payload[0]?.payload;

  if (!activeDatum) {
    return null;
  }

  const uniqueEntries = GRAPH_TASTE_ORDER.map((taste) => ({
    dataKey: taste,
    value: activeDatum[taste],
  })).filter((entry): entry is { dataKey: string; value: number | string } =>
    typeof entry.value !== 'undefined',
  );

  return (
    <div className="min-w-[116px] rounded-[12px] bg-white px-[12px] py-[10px] shadow-[var(--tb-shadow-soft)]">
      <p className="mb-[6px] text-[11px] font-semibold text-[rgba(15,15,15,0.55)]">{label}</p>
      <div className="flex flex-col gap-[5px]">
        {uniqueEntries.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <span
                className="size-[8px] rounded-full"
                style={{ backgroundColor: getTasteColor(entry.dataKey) }}
              />
              <span className="text-[12px] font-medium text-[rgba(15,15,15,0.72)]">
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
      text: `${strongestTaste.label} 민감도가 평균보다 ${Math.round(((strongestTaste.valueMm - strongestTaste.averageMm) / strongestTaste.averageMm) * 100)}% 높습니다`,
      type: 'high' as const,
    },
    {
      taste: biggestDeltaTaste.label,
      text: `이번 측정에서 ${biggestDeltaTaste.label}이 평균 대비 ${Math.abs(biggestDeltaTaste.deltaMm).toFixed(2)}mM ${biggestDeltaTaste.deltaMm >= 0 ? '높게' : '낮게'} 나타났습니다`,
      type: biggestDeltaTaste.deltaMm >= 0 ? 'up' as const : 'low' as const,
    },
    {
      taste: weakestTaste.label,
      text: `${weakestTaste.label}에 가장 둔감합니다. 다음 보정에서는 ${weakestTaste.label} 강화 추천`,
      type: 'low' as const,
    },
    {
      taste: strongestTaste.label,
      text: `전체 평균 민감도는 ${formatMeasurementValue(totalSensitivity)}로 기준 평균 ${formatMeasurementValue(avgSensitivity)}보다 높습니다`,
      type: 'high' as const,
    },
  ];
}

// 6각형 꼭짓점 좌표 생성 (상단 시작, 시계 방향)
function hexPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function hexPolygon(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => hexPoint(cx, cy, r, i))
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

// 커스텀 6각형 레이더 차트
function HexRadarChart({ myTasteData }: { myTasteData: TasteMeasurementEntry[] }) {
  const cx = 160;
  const cy = 145;
  const maxR = 100;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // 나의 민감도 폴리곤 좌표
  const myPoints = myTasteData.map((d, i) => {
    const r = (d.score / 100) * maxR;
    return hexPoint(cx, cy, r, i);
  });
  const myPolygon = myPoints.map(([x, y]) => `${x},${y}`).join(' ');

  // 평균 민감도 폴리곤 좌표
  const avgPoints = myTasteData.map((d, i) => {
    const r = (d.averageScore / 100) * maxR;
    return hexPoint(cx, cy, r, i);
  });
  const avgPolygon = avgPoints.map(([x, y]) => `${x},${y}`).join(' ');

  // 꼭짓점 (맛 라벨 + 점)
  const vertices = myTasteData.map((d, i) => ({
    ...d,
    point: hexPoint(cx, cy, maxR, i),
    labelPoint: hexPoint(cx, cy, maxR + 25, i),
    dotPoint: hexPoint(cx, cy, maxR + 10, i),
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
      {/* 배경 6각형 그리드 */}
      {gridLevels.map((level, idx) => (
        <polygon
          key={idx}
          points={hexPolygon(cx, cy, maxR * level)}
          fill="none"
          stroke={RADAR_CHART.gridColor}
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
          stroke={RADAR_CHART.gridColor}
          strokeWidth="1"
        />
      ))}

      {/* 평균 민감도 헥사곤 */}
      <polygon
        points={avgPolygon}
        fill={RADAR_CHART.averageFill}
        stroke={RADAR_CHART.averageStroke}
        strokeWidth="1.5"
      />

      {/* 나의 민감도 헥사곤 */}
      <polygon
        points={myPolygon}
        fill={RADAR_CHART.highlightFill}
        stroke={RADAR_CHART.highlightStroke}
        strokeWidth="2"
      />

      {/* 대각선 (나의 민감도 점 연결 — X자 형태) */}
      {diagonals.map(([a, b], idx) => {
        const aIdx = myTasteData.findIndex(d => d.label === a.label);
        const bIdx = myTasteData.findIndex(d => d.label === b.label);

        const ax = myPoints[aIdx][0];
        const ay = myPoints[aIdx][1];
        const bx = myPoints[bIdx][0];
        const by = myPoints[bIdx][1];
        return (
          <line
            key={`diag-${idx}`}
            x1={ax}
            y1={ay}
            x2={bx}
            y2={by}
            stroke={a.color}
            strokeWidth="1.5"
            opacity="0.4"
          />
        );
      })}

      {/* 나의 민감도 꼭짓점 */}
      {myPoints.map(([x, y], i) => (
        <circle
          key={`my-${i}`}
          cx={x}
          cy={y}
          r={RADAR_CHART.nodeSize}
          fill={RADAR_CHART.highlightStroke}
        />
      ))}

      {/* 맛 컬러 도트 (외곽) */}
      {vertices.map((v, i) => (
        <circle
          key={`dot-${i}`}
          cx={v.dotPoint[0]}
          cy={v.dotPoint[1]}
          r={RADAR_CHART.outerDotSize}
          fill={v.color}
        />
      ))}

      {/* 맛 라벨 */}
      {vertices.map((v, i) => {
        // 지방맛(5), 단맛(0), 신맛(1)은 위로, 쓴맛(2), 짠맛(3), 감칠맛(4)은 아래로 배치
        const isAbove = [0, 1, 5].includes(i);
        const yOffset = isAbove ? -14 : 22;

        return (
          <text
            key={`label-${i}`}
            x={v.dotPoint[0]}
            y={v.dotPoint[1] + yOffset}
            textAnchor="middle"
            className="text-[9px] font-medium"
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
  measurementSnapshot: TasteMeasurementSnapshot;
  onStartMeasurement: () => void;
}

export default function AnalysisPage({
  measurementSnapshot,
  onStartMeasurement,
}: AnalysisPageProps) {
  const period = '이번 측정';
  const myTasteData = getTasteMeasurementEntries(measurementSnapshot);
  const totalSensitivity = getAverageMeasurementMm(measurementSnapshot);
  const avgSensitivity = getAverageReferenceMeasurementMm();
  const strongestTaste = getStrongestTasteMeasurement(measurementSnapshot);
  const weakestTaste = getWeakestTasteMeasurement(measurementSnapshot);
  const tasteProfileBadge = getTasteProfileBadge(totalSensitivity);
  const insights = buildInsights(myTasteData, totalSensitivity, avgSensitivity);
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <TopAppBar onStartMeasurement={onStartMeasurement} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-6 p-5 animate-fadeIn">
          {/* 페이지 타이틀 */}
          <div>
            <h1 className="text-[18px] font-bold tracking-[-0.24px] text-[var(--tb-color-text-primary)]">미각 프로필</h1>
            <OutlineBadge className="mt-2">{tasteProfileBadge}</OutlineBadge>
          </div>

          {/* 슈퍼 테이스터 요약 */}
          <SectionCard>
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-1">
                <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">슈퍼 테이스터</p>
                <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  신준호님의 평균 미각 민감도는 {formatMeasurementValue(totalSensitivity)}로<br />
                  평균보다 {Math.round(((totalSensitivity - avgSensitivity) / avgSensitivity) * 100)}% 높습니다.<br />
                  {strongestTaste.label}에 가장 민감하며 {weakestTaste.label}에 가장 둔감합니다.
                </p>
              </div>
              <button className="flex size-[18px] shrink-0 items-center justify-center text-[var(--tb-color-icon-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]">
                <Info size={18} />
              </button>
            </div>
          </SectionCard>

          <TasteMeasurementMiniCta
            title={needsMeasurementRefresh ? '프로필 업데이트 추천' : '현재 컨디션 다시 측정'}
            description={
              needsMeasurementRefresh
                ? `${measurementAgeLabel} 데이터예요. 다시 측정하면 분석 결과를 더 현재 입맛에 맞게 볼 수 있어요.`
                : '컨디션이 달라졌다면 지금 다시 측정해 이번 분석을 최신 상태로 맞출 수 있어요.'
            }
            meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
            actionLabel={needsMeasurementRefresh ? '재측정' : '다시 측정'}
            onAction={onStartMeasurement}
            tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
          />

          <SectionCard hoverEffect={false}>
            <div className="flex items-center justify-between w-full">
              <button className="rounded-full p-1 transition-colors hover:bg-[var(--tb-color-surface-muted)]">
                <ChevronLeft size={20} className="text-[var(--tb-color-icon-primary)]" />
              </button>
              <span className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">{period}</span>
              <button className="rounded-full p-1 transition-colors hover:bg-[var(--tb-color-surface-muted)]">
                <ChevronRight size={20} className="text-[var(--tb-color-icon-primary)]" />
              </button>
            </div>

            <div className="flex w-full flex-col items-center animate-slideUp">
              <HexRadarChart myTasteData={myTasteData} />

              <div className="mt-2 flex items-end gap-0">
                <div className="flex flex-col items-center gap-[4px]">
                  <span className="text-[10px] text-[var(--tb-color-text-hint)]">나의 민감도</span>
                  <span className="rounded-[6px] bg-[var(--tb-color-text-primary)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">
                    {formatMeasurementValue(totalSensitivity, '')}
                  </span>
                </div>
                <span className="mx-[2px] flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[var(--tb-color-text-disabled)] text-[10px] text-[var(--tb-color-text-inverse)]">→</span>
                <div className="flex flex-col items-center gap-[4px]">
                  <span className="text-[10px] text-[var(--tb-color-text-hint)]">평균 민감도</span>
                  <span className="rounded-[6px] bg-[var(--tb-color-text-primary)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">
                    {formatMeasurementValue(avgSensitivity, '')}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <div>
            <SectionTitle size="md" className="mb-3">세부 분석</SectionTitle>
            <div className="flex gap-[10px] overflow-x-auto no-scrollbar pb-2 w-[calc(100%+40px)] mx-[-20px] px-[20px]">
              {myTasteData.map((item, idx) => {
                const colors = TASTE_COLORS[item.label as keyof typeof TASTE_COLORS];
                return (
                  <div
                    key={idx}
                    className="shrink-0 w-[132px] h-[132px] rounded-[20px] p-3 flex flex-col gap-2 animate-slideUp"
                    style={{
                      backgroundColor: colors.bg,
                      animationDelay: `${idx * 80}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <div
                      className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[14px]"
                      style={{ backgroundColor: `${colors.main}80` }}
                    >
                      {item.deltaMm > 0 ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4L12 12M12 12H6M12 12V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-[1px]">
                      <p className="font-bold text-[14px]" style={{ color: colors.dark }}>{item.label}</p>
                      <p className="font-semibold text-[11px]" style={{ color: colors.dark }}>
                        {item.deltaMm > 0 ? '+' : ''}{item.deltaMm.toFixed(2)} mM
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 측정/피드백 변화 차트 */}
          <div className="flex flex-col gap-2">
            <div>
              <SectionTitle size="md" className="mb-3">측정·피드백 기반 미각 변화 추이</SectionTitle>
              <SectionCard>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profileChangeTrend} margin={{ top: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="event"
                      tick={<WeeklyTrendAxisTick />}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      padding={{ left: 12, right: 12 }}
                      height={18}
                      tickMargin={0}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      content={<WeeklyTrendTooltip />}
                      cursor={<WeeklyTrendCursor />}
                    />
                    {GRAPH_TASTE_ORDER.map((taste) => (
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
                          dot={{ r: TREND_DOT_RADIUS, fill: getTasteColor(taste), strokeWidth: 0 }}
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
            </SectionCard>
            </div>

            {/* 모든 정보 보기 버튼 */}
            <div className="flex w-full cursor-pointer items-center justify-between rounded-full bg-[var(--tb-color-surface-card)] p-[12px] transition-colors hover:bg-[var(--tb-color-surface-card-hover)]">
              <span className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">모든 정보 보기</span>
              <ChevronRight size={16} className="text-[var(--tb-color-icon-primary)]" />
            </div>
          </div>

          {/* 인사이트 */}
          <div className="pb-6">
            <SectionTitle size="md" className="mb-3">인사이트</SectionTitle>
            <div className="flex flex-col gap-2">
              {insights.map((item, idx) => (
                <SectionCard key={idx}>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="shrink-0 w-[8px] h-[36px] rounded-full"
                      style={{ backgroundColor: getTasteColor(item.taste) }}
                    />
                    <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">{item.text}</p>
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
