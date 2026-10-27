import {
  Check as CheckIcon
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { TASTE_TOKENS } from '../../constants/uiColorTokens';
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
          <span className="rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
            {tasteProfileBadge}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-[var(--tb-color-surface-base)] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              가장 민감한 맛
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: `var(--tb-taste-${strongestTaste.id}-measurement-text)` }}
            >
              {strongestTaste.label}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {formatMeasurementValue(strongestTaste.valueMm)}
            </p>
          </div>
          <div className="rounded-[8px] bg-[var(--tb-color-surface-base)] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              가장 둔감한 맛
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: `var(--tb-taste-${weakestTaste.id}-measurement-text)` }}
            >
              {weakestTaste.label}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {formatMeasurementValue(weakestTaste.valueMm)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[8px] bg-[var(--tb-color-surface-base)] px-3 py-3">
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
              style={{ backgroundColor: TASTE_TOKENS[entry.id].palette.tintSurface }}
            >
              {(() => {
                const labelColor = TASTE_TOKENS[entry.id].palette.tintSurfaceText;

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
