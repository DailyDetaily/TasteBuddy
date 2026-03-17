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
import { TASTE_COLORS, TASTE_TYPES, getTasteColor } from '../constants/tasteColors';
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

// 주간 추이 데이터 (미각별 라인이 겹치지 않도록 간격 조정)
const weeklyTrend = [
  { week: '1주차', 단맛: 95, 신맛: 80, 짠맛: 65, 지방맛: 50, 쓴맛: 35, 감칠맛: 20 },
  { week: '2주차', 단맛: 92, 신맛: 84, 짠맛: 68, 지방맛: 52, 쓴맛: 32, 감칠맛: 18 },
  { week: '3주차', 단맛: 97, 신맛: 82, 짠맛: 62, 지방맛: 47, 쓴맛: 28, 감칠맛: 22 },
  { week: '4주차', 단맛: 94, 신맛: 86, 짠맛: 67, 지방맛: 54, 쓴맛: 30, 감칠맛: 15 },
];

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
    <svg width="320" height="310" viewBox="0 0 320 310" className="w-full max-w-[320px] mx-auto">
      {/* 배경 6각형 그리드 */}
      {gridLevels.map((level, idx) => (
        <polygon
          key={idx}
          points={hexPolygon(cx, cy, maxR * level)}
          fill="none"
          stroke="#e8e8e8"
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
          stroke="#e8e8e8"
          strokeWidth="1"
        />
      ))}

      {/* 평균 민감도 헥사곤 */}
      <polygon
        points={avgPolygon}
        fill="#f0f0f0"
        fillOpacity="0.6"
        stroke="#d0d0d0"
        strokeWidth="1.5"
      />

      {/* 나의 민감도 헥사곤 */}
      <polygon
        points={myPolygon}
        fill="#FF9900"
        fillOpacity="0.12"
        stroke="#FF9900"
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
          r="3"
          fill="#FF9900"
        />
      ))}

      {/* 맛 컬러 도트 (외곽) */}
      {vertices.map((v, i) => (
        <circle
          key={`dot-${i}`}
          cx={v.dotPoint[0]}
          cy={v.dotPoint[1]}
          r="8"
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
            fill="#888"
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
    <div className="flex flex-col w-full h-full bg-white">
      <TopAppBar onStartMeasurement={onStartMeasurement} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-8 p-5 animate-fadeIn">
          {/* 페이지 타이틀 */}
          <div>
            <h1 className="font-bold text-[24px] text-[#0f0f0f] tracking-[-0.24px]">미각 프로필</h1>
            <OutlineBadge className="mt-2">{tasteProfileBadge}</OutlineBadge>
          </div>

          {/* 슈퍼 테이스터 요약 */}
          <SectionCard>
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-1">
                <p className="font-bold text-[16px] text-[#0f0f0f]">슈퍼 테이스터</p>
                <p className="text-[13px] text-[rgba(15,15,15,0.6)] leading-relaxed">
                  신준호님의 평균 미각 민감도는 {formatMeasurementValue(totalSensitivity)}로<br />
                  평균보다 {Math.round(((totalSensitivity - avgSensitivity) / avgSensitivity) * 100)}% 높습니다.<br />
                  {strongestTaste.label}에 가장 민감하며 {weakestTaste.label}에 가장 둔감합니다.
                </p>
              </div>
              <button className="text-[#AFAFAF] hover:text-[#0f0f0f] transition-colors size-[18px] flex items-center justify-center shrink-0">
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

          {/* 기간 선택 */}
          <div className="flex items-center justify-between">
            <button className="p-1 rounded-full hover:bg-[#f3f3f3] transition-colors">
              <ChevronLeft size={20} className="text-[#3F3F3F]" />
            </button>
            <span className="font-semibold text-[15px] text-[#0f0f0f]">{period}</span>
            <button className="p-1 rounded-full hover:bg-[#f3f3f3] transition-colors">
              <ChevronRight size={20} className="text-[#3F3F3F]" />
            </button>
          </div>

          {/* 6각형 레이더 차트 */}
          <div className="flex flex-col items-center animate-slideUp">
            <HexRadarChart myTasteData={myTasteData} />

            {/* 범례 */}
            <div className="flex items-end gap-0 mt-2">
              <div className="flex flex-col items-center gap-[4px]">
                <span className="text-[10px] text-[#999]">나의 민감도</span>
                <span className="bg-[#0f0f0f] text-white text-[12px] font-bold px-[10px] py-[3px] rounded-[6px]">
                  {formatMeasurementValue(totalSensitivity, '')}
                </span>
              </div>
              <span className="w-[24px] h-[24px] flex items-center justify-center bg-[#B2B2B2] text-white text-[10px] rounded-[6px] mx-[2px]">→</span>
              <div className="flex flex-col items-center gap-[4px]">
                <span className="text-[10px] text-[#999]">평균 민감도</span>
                <span className="bg-[#0f0f0f] text-white text-[12px] font-bold px-[10px] py-[3px] rounded-[6px]">
                  {formatMeasurementValue(avgSensitivity, '')}
                </span>
              </div>
            </div>
          </div>

          {/* 세부 분석 카드 */}
          <div>
            <SectionTitle size="md" className="mb-3">세부 분석</SectionTitle>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 w-[calc(100%+40px)] mx-[-20px] px-[20px]">
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

          {/* 주간 추이 차트 */}
          <div className="flex flex-col gap-3">
            <div>
              <SectionTitle size="md" className="mb-3">주간 미각 변화 추이</SectionTitle>
              <SectionCard>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend} margin={{ top: 10, bottom: 10 }}>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: '#999' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    {TASTE_TYPES.map((taste) => (
                      <React.Fragment key={taste}>
                        {/* 굵고 반투명한 배경 선 (도트 제거) */}
                        <Line
                          type="monotone"
                          dataKey={taste}
                          stroke={getTasteColor(taste)}
                          strokeWidth={12}
                          strokeOpacity={0.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dot={false}
                          activeDot={false}
                          isAnimationActive={false}
                        />
                        {/* 얇고 불투명한 메인 실선 및 배경 선에 맞춘 큰 불투명 도트 */}
                        <Line
                          type="monotone"
                          dataKey={taste}
                          stroke={getTasteColor(taste)}
                          strokeWidth={1}
                          dot={{ r: 4, fill: getTasteColor(taste), strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: getTasteColor(taste), strokeWidth: 0 }}
                        />
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            </div>

            {/* 모든 정보 보기 버튼 */}
            <div className="w-full bg-[#f3f3f3] rounded-full p-[12px] flex justify-between items-center cursor-pointer hover:bg-[#ececec] transition-colors">
              <span className="font-bold text-[14px] text-[#0f0f0f]">모든 정보 보기</span>
              <ChevronRight size={16} className="text-[#3F3F3F]" />
            </div>
          </div>

          {/* 인사이트 */}
          <div className="pb-6">
            <SectionTitle size="md" className="mb-3">인사이트</SectionTitle>
            <div className="flex flex-col gap-3">
              {insights.map((item, idx) => (
                <SectionCard key={idx}>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="shrink-0 w-[8px] h-[36px] rounded-full"
                      style={{ backgroundColor: getTasteColor(item.taste) }}
                    />
                    <p className="text-[13px] text-[#0f0f0f] leading-relaxed">{item.text}</p>
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
