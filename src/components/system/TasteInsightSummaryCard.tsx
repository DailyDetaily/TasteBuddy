import type { ReactNode } from 'react';

import { TASTE_IDS, TASTE_TOKENS } from '../../constants/designTokens';
import { buildTasteAdjustmentGradient, getTasteColor } from '../../constants/tasteColors';
import { cn } from '../ui/utils';
import CardDetailLabel from './CardDetailLabel';
import TasteChip from './TasteChip';
import TasteLineChart from './TasteLineChart';
import TastePointArrowBox, { type TastePointArrowBoxTrend } from './TastePointArrowBox';

export type TasteInsightSummaryDetail = {
  change: string;
  detailLabel: string;
  history: string[];
  parentTaste: string;
  trend: TastePointArrowBoxTrend;
};

interface TasteInsightSummaryCardProps {
  action?: ReactNode;
  actionLabel?: string;
  className?: string;
  details: TasteInsightSummaryDetail[];
  keywords: string[];
  onClick: () => void;
  sectionLabel: string;
  title: string;
}

function parseTasteChangeValue(value: string) {
  const parsed = Number.parseFloat(value.replace('%', '').replace('+', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSummaryDetails(details: TasteInsightSummaryDetail[]) {
  const rankedIncreases = details
    .filter((detail) => detail.trend === 'increase')
    .sort((left, right) => parseTasteChangeValue(right.change) - parseTasteChangeValue(left.change));
  const rankedDecreases = details
    .filter((detail) => detail.trend === 'decrease')
    .sort((left, right) => parseTasteChangeValue(left.change) - parseTasteChangeValue(right.change));
  const summaryDetails: TasteInsightSummaryDetail[] = [];
  const highestIncrease = rankedIncreases[0];
  const biggestDecrease = rankedDecreases[0];

  if (highestIncrease) {
    summaryDetails.push(highestIncrease);
  }

  if (biggestDecrease && biggestDecrease.detailLabel !== highestIncrease?.detailLabel) {
    summaryDetails.push(biggestDecrease);
  }

  return summaryDetails.length > 0 ? summaryDetails : details.slice(0, 2);
}

function getKeywordTasteLabel(keyword: string) {
  return TASTE_IDS
    .map((tasteId) => TASTE_TOKENS[tasteId].label)
    .find((label) => keyword.startsWith(label));
}

function KeywordChip({ keyword }: { keyword: string }) {
  const tasteLabel = getKeywordTasteLabel(keyword);

  if (!tasteLabel) {
    return <TasteChip taste={keyword} tone="neutral" />;
  }

  const value = keyword.slice(tasteLabel.length).trim();
  return <TasteChip taste={tasteLabel} value={value || undefined} />;
}

function buildIndicatorBackground(details: TasteInsightSummaryDetail[]) {
  return buildTasteAdjustmentGradient(
    details.map((detail) => ({
      taste: detail.parentTaste,
      change: detail.change,
    })),
    { direction: 'to bottom', useTint: false },
  );
}

export default function TasteInsightSummaryCard({
  action,
  actionLabel,
  className,
  details,
  keywords,
  onClick,
  sectionLabel,
  title,
}: TasteInsightSummaryCardProps) {
  const summaryDetails = getSummaryDetails(details);
  const graphEntries = summaryDetails.map((detail) => ({
    id: detail.detailLabel,
    taste: detail.parentTaste,
    values: [...detail.history, detail.change].map((value) => parseTasteChangeValue(value)),
  }));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full rounded-[20px] bg-white text-left transition-transform active:scale-[0.98]', className)}
    >
      <div className="overflow-clip rounded-[inherit]">
        <div className="flex w-full flex-col gap-[12px] p-3">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full"
                style={{ background: buildIndicatorBackground(details) }}
              />
              <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                {sectionLabel}
              </p>
            </div>
            {action ?? <CardDetailLabel label={actionLabel} />}
          </div>

          <p className="text-[16px] font-bold leading-[1.25] text-[var(--tb-color-text-primary)]">
            {title}
          </p>

          <div className="flex flex-col gap-[10px]">
            <div className="flex w-full items-stretch gap-[24px]">
              <div className="flex min-w-0 grow basis-0 flex-col gap-[4px]">
                {summaryDetails.map((detail) => (
                  <div key={detail.detailLabel} className="flex w-full items-center gap-[8px]">
                    <TastePointArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <p className="truncate text-[14px] font-medium text-[var(--tb-color-text-secondary)]">
                        {detail.detailLabel}
                      </p>
                      <p
                        className="shrink-0 text-[12px] font-semibold leading-[1.1]"
                        style={{ color: getTasteColor(detail.parentTaste) }}
                      >
                        {detail.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex min-w-0 grow basis-0 items-center">
                <TasteLineChart entries={graphEntries} />
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-[6px]">
              {keywords.map((keyword) => (
                <KeywordChip key={keyword} keyword={keyword} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
