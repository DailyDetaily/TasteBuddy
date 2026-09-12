import { useId, type ReactNode } from 'react';

import { TASTE_IDS, TASTE_TOKENS } from '../../constants/designTokens';
import { buildTasteAdjustmentGradient, getTasteColor } from '../../constants/tasteColors';
import { cn } from '../ui/utils';
import CardDetailLabel from './CardDetailLabel';
import TasteChip from './TasteChip';
import TasteLineChart from './TasteLineChart';
import TastePointArrowBox, { type TastePointArrowBoxTrend } from './TastePointArrowBox';

export function TasteChangeEmptySummary() {
  const gradientId = useId();
  return <div className="flex w-full flex-col gap-1" aria-label="상승 변화와 하강 변화 모두 비교 기록 없음">
    {['상승 변화', '하강 변화'].map((label, index) => <div key={label} className="flex h-6 items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TastePointArrowBox trend="neutral" />
        <span className="text-[14px] font-medium text-[var(--tb-color-text-hint)]">{label}</span>
      </div>
      <svg aria-hidden="true" className="h-6 w-[132px] shrink-0" viewBox="0 0 132 24">
        <defs><linearGradient id={`${gradientId}-${index}`} gradientUnits="userSpaceOnUse" x1="6" x2="126" y1="12" y2="12">
          <stop stopColor="var(--tb-color-border-default)" /><stop offset="1" stopColor="var(--tb-color-text-hint)" />
        </linearGradient></defs>
        {/* Decorative empty state; this line does not represent observations. */}
        <path d="M6 12H126" stroke="var(--tb-color-text-hint)" strokeOpacity="0.12" strokeWidth="12" strokeLinecap="round" />
        <path d="M6 12H126" stroke={`url(#${gradientId}-${index})`} strokeWidth="2" strokeLinecap="round" />
        <circle cx="126" cy="12" r="6" fill="var(--tb-color-text-hint)" />
      </svg>
    </div>)}
  </div>;
}

export type TasteInsightSummaryDetail = {
  change: string;
  detailLabel: string;
  history: string[];
  parentTaste: string;
  trend: TastePointArrowBoxTrend;
};

interface TasteInsightSummaryCardProps {
  children?: ReactNode;
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
  children,
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

          {children ?? <div className="flex flex-col gap-[10px]">
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
          </div>}
        </div>
      </div>
    </button>
  );
}
