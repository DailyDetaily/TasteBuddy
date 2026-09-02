import Chip from '../system/Chip';
import OutlineBadge from '../system/OutlineBadge';
import SectionTitle from '../system/SectionTitle';
import SelectionCard from '../system/SelectionCard';
import StepBadge from '../system/StepBadge';
import { cn } from '../ui/utils';
import { TASTE_SURVEY_LIKERT_SCALE } from '../../constants/tasteSurveyConfig';
import { TASTE_TOKENS } from '../../constants/designTokens';
import type { TasteSurveyItem, TasteSurveyLikertValue } from '../../types/tasteSurvey';

interface TasteSurveyQuestionCardProps {
  className?: string;
  currentIndex?: number;
  item: TasteSurveyItem;
  onSelectLikert: (value: TasteSurveyLikertValue) => void;
  onSelectUncertain: () => void;
  selectedValue: TasteSurveyLikertValue | null;
  total?: number;
  uncertain: boolean;
}

const CONSTRUCT_HELPER_COPY: Record<TasteSurveyItem['construct'], string> = {
  overload: '조금 더 강해졌을 때 쉽게 과하다고 느끼는지 확인해요.',
  salience: '작은 차이가 빨리 또렷하게 느껴지는지 확인해요.',
};

export default function TasteSurveyQuestionCard({
  className,
  currentIndex,
  item,
  onSelectLikert,
  onSelectUncertain,
  selectedValue,
  total,
  uncertain,
}: TasteSurveyQuestionCardProps) {
  const taste = TASTE_TOKENS[item.tasteId];
  const isExploratory = Boolean(item.exploratoryMetadata);

  return (
    <div className={cn('flex w-full flex-col gap-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <OutlineBadge>{taste.label}</OutlineBadge>
        <div className="flex items-center gap-2">
          {isExploratory ? (
            <Chip size="xs" tone="warning" variant="soft">
              조심스럽게 해석
            </Chip>
          ) : null}
          {typeof currentIndex === 'number' && typeof total === 'number' ? (
            <StepBadge currentIndex={currentIndex} total={total} />
          ) : null}
        </div>
      </div>

      <div className="rounded-[14px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3">
        <p
          className="text-[16px] font-bold leading-snug"
          style={{ color: taste.palette.main }}
        >
          {item.anchor.label}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {item.anchor.description}
        </p>
      </div>

      <div className="tb-card-stack gap-1">
        <SectionTitle size="md" className="leading-tight">
          {item.prompt}
        </SectionTitle>
        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
          {CONSTRUCT_HELPER_COPY[item.construct]}
        </p>
      </div>

      <div className="tb-card-stack">
        {Object.entries(TASTE_SURVEY_LIKERT_SCALE.labels).map(([rawValue, label]) => {
          const value = Number(rawValue) as TasteSurveyLikertValue;
          const isSelected = !uncertain && selectedValue === value;

          return (
            <SelectionCard
              key={value}
              indicator="checkbox"
              selected={isSelected}
              singleLine
              title={label}
              className="min-h-[44px] items-center rounded-[20px]"
              onClick={() => onSelectLikert(value)}
            />
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={uncertain}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[20px] border border-dashed p-4 text-left transition-all active:scale-[0.99]',
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
  );
}
