import { Check as CheckIcon } from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';

type SurveyStepStatus = 'completed' | 'active' | 'inactive';

interface SurveyStepCardProps {
  /** 1-based step number displayed inside the marker */
  stepNumber: number;
  title: string;
  /** Description is only rendered when the card is active */
  description?: string;
  status: SurveyStepStatus;
}

const CARD_CLASS: Record<SurveyStepStatus, string> = {
  active: 'border border-[var(--tb-color-border-strong)] bg-[var(--tb-color-surface-elevated)]',
  completed: 'bg-[var(--tb-color-surface-elevated)] opacity-80',
  inactive: 'bg-[var(--tb-color-surface-muted)]',
};

const MARKER_CLASS: Record<SurveyStepStatus, string> = {
  active: 'bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]',
  completed: 'bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]',
  inactive: 'bg-[var(--tb-color-text-disabled)] text-[var(--tb-color-text-inverse)]',
};

const TITLE_CLASS: Record<SurveyStepStatus, string> = {
  active: 'text-[var(--tb-color-text-primary)]',
  completed: 'text-[var(--tb-color-text-primary)]',
  inactive: 'text-[var(--tb-color-text-tertiary)]',
};

export default function SurveyStepCard({
  stepNumber,
  title,
  description,
  status,
}: SurveyStepCardProps) {
  const rowAlignmentClassName = status === 'active' ? 'items-start' : 'items-center';

  return (
    <div
      className={`w-full rounded-[20px] p-3 transition-all duration-300 ${CARD_CLASS[status]}`}
    >
      <div className={`flex gap-3 ${rowAlignmentClassName}`}>
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] ${MARKER_CLASS[status]}`}>
          {status === 'completed' ? (
            <CheckIcon size={ICON_TOKENS.size.sm} strokeWidth={3} />
          ) : (
            <span className="text-[13px] font-bold">{stepNumber}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-[14px] font-bold tracking-normal ${TITLE_CLASS[status]}`}>
            {title}
          </h3>
          {status === 'active' && description ? (
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
