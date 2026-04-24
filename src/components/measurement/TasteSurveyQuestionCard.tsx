import type { CSSProperties } from 'react';

import SectionCard from '../SectionCard';
import Chip from '../system/Chip';
import OutlineBadge from '../system/OutlineBadge';
import SectionTitle from '../system/SectionTitle';
import { cn } from '../ui/utils';
import { TASTE_SURVEY_LIKERT_SCALE } from '../../constants/tasteSurveyConfig';
import { TASTE_TOKENS } from '../../constants/designTokens';
import type { TasteSurveyItem, TasteSurveyLikertValue } from '../../types/tasteSurvey';

interface TasteSurveyQuestionCardProps {
  className?: string;
  item: TasteSurveyItem;
  onSelectLikert: (value: TasteSurveyLikertValue) => void;
  onSelectUncertain: () => void;
  selectedValue: TasteSurveyLikertValue | null;
  uncertain: boolean;
}

const CONSTRUCT_HELPER_COPY: Record<TasteSurveyItem['construct'], string> = {
  overload: '조금 더 강해졌을 때 쉽게 과하다고 느끼는지 확인해요.',
  salience: '작은 차이가 빨리 또렷하게 느껴지는지 확인해요.',
};

export default function TasteSurveyQuestionCard({
  className,
  item,
  onSelectLikert,
  onSelectUncertain,
  selectedValue,
  uncertain,
}: TasteSurveyQuestionCardProps) {
  const taste = TASTE_TOKENS[item.tasteId];
  const isExploratory = Boolean(item.exploratoryMetadata);

  return (
    <SectionCard
      hoverEffect={false}
      className={cn('border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-card)]', className)}
    >
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OutlineBadge>{taste.label}</OutlineBadge>
          {isExploratory ? (
            <Chip size="xs" tone="warning" variant="soft">
              조심스럽게 해석
            </Chip>
          ) : null}
        </div>

        <div className="rounded-[14px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3">
          <p
            className="text-[12px] font-semibold"
            style={{ color: taste.palette.tintSurfaceText }}
          >
            기준 앵커
          </p>
          <p className="mt-1 text-[14px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
            {item.anchor.label}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {item.anchor.description}
          </p>
        </div>

        <div className="tb-card-stack gap-2">
          <SectionTitle size="md" className="leading-tight">
            {item.prompt}
          </SectionTitle>
          <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            {CONSTRUCT_HELPER_COPY[item.construct]}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {Object.entries(TASTE_SURVEY_LIKERT_SCALE.labels).map(([rawValue, label]) => {
            const value = Number(rawValue) as TasteSurveyLikertValue;
            const isSelected = !uncertain && selectedValue === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-left transition-all active:scale-[0.99]',
                  isSelected
                    ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-base)] shadow-[0_10px_22px_rgba(15,15,15,0.06)]'
                    : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] hover:border-[var(--tb-color-border-strong)]',
                )}
                onClick={() => onSelectLikert(value)}
              >
                <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                  {label}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
                  style={
                    {
                      backgroundColor: isSelected ? taste.palette.tintSurface : 'transparent',
                      borderColor: isSelected ? taste.palette.main : 'var(--tb-color-border-disabled)',
                      color: isSelected ? taste.palette.tintSurfaceText : 'var(--tb-color-text-faint)',
                    } as CSSProperties
                  }
                >
                  {value}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={uncertain}
          className={cn(
            'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[12px] border border-dashed px-3 py-2 text-left transition-all active:scale-[0.99]',
            uncertain
              ? 'border-[var(--tb-color-text-secondary)] bg-[var(--tb-color-surface-muted)]'
              : 'border-[var(--tb-color-border-strong)] bg-[var(--tb-color-surface-base)]',
          )}
          onClick={onSelectUncertain}
        >
          <span className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              {TASTE_SURVEY_LIKERT_SCALE.uncertainLabel}
            </span>
            <span className="text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
              최근 기준으로 떠올리기 어렵다면 따로 표시해요.
            </span>
          </span>
          <span className="text-[11px] font-semibold text-[var(--tb-color-text-faint)]">
            별도 저장
          </span>
        </button>
      </div>
    </SectionCard>
  );
}
