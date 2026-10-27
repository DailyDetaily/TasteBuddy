import Chip from '../system/Chip';
import OutlineBadge from '../system/OutlineBadge';
import SectionTitle from '../system/SectionTitle';
import SelectionCard from '../system/SelectionCard';
import StepBadge from '../system/StepBadge';
import { cn } from '../ui/utils';
import { TASTE_SURVEY_LIKERT_SCALE, TASTE_SURVEY_UNCERTAINTY_LABELS } from '../../constants/tasteSurveyConfig';
import { TASTE_TOKENS } from '../../constants/uiColorTokens';
import type { TasteSurveyItem, TasteSurveyLikertValue, TasteSurveyUncertaintyReason } from '../../types/tasteSurvey';

interface TasteSurveyQuestionCardProps {
  className?: string;
  currentIndex?: number;
  item: TasteSurveyItem;
  onSelectLikert: (value: TasteSurveyLikertValue) => void;
  onSelectUncertain: (reason: TasteSurveyUncertaintyReason) => void;
  selectedValue: TasteSurveyLikertValue | null;
  total?: number;
  uncertain: boolean;
  uncertaintyReason?: TasteSurveyUncertaintyReason;
}

export default function TasteSurveyQuestionCard({
  className,
  currentIndex,
  item,
  onSelectLikert,
  onSelectUncertain,
  selectedValue,
  total,
  uncertain,
  uncertaintyReason,
}: TasteSurveyQuestionCardProps) {
  const taste = TASTE_TOKENS[item.tasteId];
  const isExploratory = Boolean(item.exploratoryMetadata);

  return (
    <div className={cn('flex w-full flex-col gap-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <OutlineBadge>{taste.label}</OutlineBadge>
        <div className="flex items-center gap-2">
          {isExploratory ? (
            <Chip size="xs" tone="neutral" variant="soft">
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
          style={{ color: taste.palette.tintSurfaceText }}
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
          {item.helper}
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

      <div className="flex flex-col gap-2">
        {(Object.entries(TASTE_SURVEY_UNCERTAINTY_LABELS) as [TasteSurveyUncertaintyReason, string][])
          .filter(([reason]) => reason !== 'cannot_isolate_taste' || item.tasteId === 'fat')
          .map(([reason, label]) => <SelectionCard
            key={reason}
            title={label}
            indicator="checkbox"
            selected={uncertain && (uncertaintyReason ?? 'cannot_recall') === reason}
            singleLine={false}
            onClick={() => onSelectUncertain(reason)}
          />)}
      </div>
    </div>
  );
}
