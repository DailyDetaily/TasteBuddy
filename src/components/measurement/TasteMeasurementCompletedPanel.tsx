import {
  Check as CheckIcon
} from 'lucide-react';

import { ICON_TOKENS, TASTE_TOKENS } from '../../constants/designTokens';
import {
  formatMeasurementDate,
  formatMeasurementValue,
  getAverageMeasurementMm,
  getStrongestTasteMeasurement,
  getTasteMeasurementEntries,
  getTasteProfileBadge,
  getWeakestTasteMeasurement,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';

const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
  />
);

const Check = wrapIcon(CheckIcon);

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');

  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function rgbToHex(rgb: number[]) {
  return `#${rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixHex(colorA: string, colorB: string, ratio: number) {
  const left = hexToRgb(colorA);
  const right = hexToRgb(colorB);

  return rgbToHex(left.map((channel, index) => channel + (right[index] - channel) * ratio));
}

function getRelativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(backgroundColor: string, foregroundColor: string) {
  const backgroundLuminance = getRelativeLuminance(backgroundColor);
  const foregroundLuminance = getRelativeLuminance(foregroundColor);
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleTasteLabelColor(backgroundColor: string, baseColor: string) {
  if (getContrastRatio(backgroundColor, baseColor) >= 3) {
    return baseColor;
  }

  for (let ratio = 0.05; ratio <= 1; ratio += 0.05) {
    const candidate = mixHex(baseColor, '#0F0F0F', ratio);
    if (getContrastRatio(backgroundColor, candidate) >= 3) {
      return candidate;
    }
  }

  return '#0F0F0F';
}

interface TasteMeasurementCompletedPanelProps {
  snapshot: TasteMeasurementSnapshot;
}

export default function TasteMeasurementCompletedPanel({
  snapshot,
}: TasteMeasurementCompletedPanelProps) {
  const completedEntries = getTasteMeasurementEntries(snapshot);
  const averageMeasurement = getAverageMeasurementMm(snapshot);
  const strongestTaste = getStrongestTasteMeasurement(snapshot);
  const weakestTaste = getWeakestTasteMeasurement(snapshot);
  const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);

  return (
    <>
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black shadow-2xl">
        <Check size={ICON_TOKENS.size.lg} color="white" strokeWidth={3} />
      </div>
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-tight">
          미각 측정이
          <br />
          완료되었어요
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--tb-color-text-body)]">
          방금 측정한 결과를 바탕으로 미각 프로필을 업데이트했어요.
          <br />
          프로필에서 이번 측정값과 세부 분석을 바로 확인할 수 있습니다.
        </p>
      </div>

      <div className="mb-3 flex flex-col gap-3 rounded-[20px] bg-[var(--tb-color-bg-page)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              이번 측정 요약
            </p>
            <h2 className="mt-1 text-[18px] font-bold text-[var(--tb-color-text-primary)]">
              평균 {formatMeasurementValue(averageMeasurement)}
            </h2>
          </div>
          <span className="rounded-full border border-[var(--tb-color-border-subtle)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
            {tasteProfileBadge}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-white p-3">
            <p className="mb-2 text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              가장 민감한 맛
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: TASTE_TOKENS[strongestTaste.id].measurement.accent }}
            >
              {strongestTaste.label}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {formatMeasurementValue(strongestTaste.valueMm)}
            </p>
          </div>
          <div className="rounded-[8px] bg-white p-3">
            <p className="mb-2 text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              가장 둔감한 맛
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: TASTE_TOKENS[weakestTaste.id].measurement.accent }}
            >
              {weakestTaste.label}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {formatMeasurementValue(weakestTaste.valueMm)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-3">
          <div>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              프로필 반영 시점
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {formatMeasurementDate(snapshot.measuredAt)}
            </p>
          </div>
          <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
            6개 맛 측정 완료
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
          세부 측정값
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {completedEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[20px] p-3"
              style={{ backgroundColor: TASTE_TOKENS[entry.id].palette.bg }}
            >
              {(() => {
                const labelColor = getAccessibleTasteLabelColor(
                  TASTE_TOKENS[entry.id].palette.bg,
                  TASTE_TOKENS[entry.id].palette.dark,
                );

                return (
                  <>
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: labelColor }}
                    >
                      {entry.label}
                    </p>
                    <p
                      className="mt-2 text-[18px] font-bold"
                      style={{ color: TASTE_TOKENS[entry.id].palette.dark }}
                    >
                      {entry.valueMm.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[var(--tb-color-text-subtle)]">
                      기준 평균 {formatMeasurementValue(entry.averageMm)}
                    </p>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
