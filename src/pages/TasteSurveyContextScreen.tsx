import { ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import BirthDatePicker, {
  formatBirthDate,
  getDaysInMonth,
  getDefaultBirthDateYears,
  parseBirthDate,
  type BirthDateParts,
} from '../components/system/BirthDatePicker';
import FlowStepCta from '../components/system/FlowStepCta';
import OutlineBadge from '../components/system/OutlineBadge';
import SelectionCard from '../components/system/SelectionCard';
import StepBadge from '../components/system/StepBadge';
import {
  TASTE_SURVEY_CONTEXT_COPY,
  TASTE_SURVEY_CONTEXT_STEPS,
} from '../constants/tasteSurveyConfig';
import { ICON_TOKENS } from '../constants/designTokens';
import type {
  TasteSurveyContextFieldId,
  TasteSurveyRespondentContext,
  TasteSurveySexContext,
  TasteSurveySmokingStatus,
} from '../types/tasteSurvey';

interface TasteSurveyContextScreenProps {
  birthDate: string | null;
  context: TasteSurveyRespondentContext;
  currentIndex: number;
  onBack: () => void;
  onBirthDateChange: (birthDate: string) => void;
  onChange: (context: TasteSurveyRespondentContext) => void;
  onContinue: () => void;
}

type ContextOptionValue =
  | TasteSurveySexContext
  | TasteSurveySmokingStatus;

function getSelectedValue(
  context: TasteSurveyRespondentContext,
  fieldId: TasteSurveyContextFieldId,
) {
  return context[fieldId];
}

function getNextContext(
  context: TasteSurveyRespondentContext,
  fieldId: TasteSurveyContextFieldId,
  value: ContextOptionValue,
): TasteSurveyRespondentContext {
  if (fieldId === 'sexContext') {
    return { ...context, sexContext: value as TasteSurveySexContext };
  }

  return { ...context, smokingStatus: value as TasteSurveySmokingStatus };
}

export default function TasteSurveyContextScreen({
  birthDate,
  context,
  currentIndex,
  onBack,
  onBirthDateChange,
  onChange,
  onContinue,
}: TasteSurveyContextScreenProps) {
  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0),
  );
  const step = TASTE_SURVEY_CONTEXT_STEPS[safeIndex];
  const selectedValue = getSelectedValue(context, step.id);
  const isLast = safeIndex === TASTE_SURVEY_CONTEXT_STEPS.length - 1;
  const [draftBirthDateParts, setDraftBirthDateParts] = useState<BirthDateParts>(
    () => parseBirthDate(birthDate),
  );
  const years = useMemo(getDefaultBirthDateYears, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const days = useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(draftBirthDateParts.year, draftBirthDateParts.month) },
        (_, index) => index + 1,
      ),
    [draftBirthDateParts.month, draftBirthDateParts.year],
  );

  useEffect(() => {
    setDraftBirthDateParts(parseBirthDate(birthDate));
  }, [birthDate]);

  const updateBirthDatePart = (field: keyof BirthDateParts, value: number) => {
    setDraftBirthDateParts((current) => {
      const next = { ...current, [field]: value };
      const maxDay = getDaysInMonth(next.year, next.month);

      if (next.day > maxDay) {
        next.day = maxDay;
      }

      const nextBirthDate = formatBirthDate(next);
      onBirthDateChange(nextBirthDate);
      onChange({
        ...context,
        birthDate: nextBirthDate,
      });

      return next;
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <header className="z-20 flex w-full shrink-0 justify-center">
        <div
          className="w-full max-w-[1440px] border-b border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)]"
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-5">
            <button
              type="button"
              aria-label="이전 화면으로 돌아가기"
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              onClick={onBack}
              style={{
                width: ICON_TOKENS.container.lg,
                height: ICON_TOKENS.container.lg,
              }}
            >
              <ChevronLeftIcon size={ICON_TOKENS.size.lg} strokeWidth={1.5} />
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              해석 참고 정보
            </span>
            <div
              aria-hidden="true"
              style={{
                width: ICON_TOKENS.container.lg,
                height: ICON_TOKENS.container.lg,
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-4 no-scrollbar">
        <div className="tb-section-stack pb-[calc(188px+var(--tb-safe-area-bottom))]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <OutlineBadge>{step.badgeLabel}</OutlineBadge>
            <StepBadge currentIndex={safeIndex} total={TASTE_SURVEY_CONTEXT_STEPS.length} />
          </div>

          <div className="rounded-[14px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
              {TASTE_SURVEY_CONTEXT_COPY.title}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              {TASTE_SURVEY_CONTEXT_COPY.description}
            </p>
          </div>

          <div className="tb-card-stack gap-1">
            <h1 className="text-[18px] font-bold leading-tight tracking-normal text-[var(--tb-color-text-primary)]">
              {step.title}
            </h1>
            <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
              {step.description}
            </p>
          </div>

          {step.id === 'birthDate' ? (
            <div className="rounded-[24px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-4 pb-4 pt-4">
              <BirthDatePicker
                days={days}
                months={months}
                parts={draftBirthDateParts}
                showConfirmButton={false}
                title="생년월일"
                years={years}
                onChange={updateBirthDatePart}
              />
            </div>
          ) : (
            <div className="tb-card-stack">
              {step.options.map((option) => (
                <SelectionCard
                  key={option.value}
                  className="min-h-[44px] items-center rounded-[20px]"
                  indicator="checkbox"
                  selected={selectedValue === option.value}
                  singleLine
                  title={option.label}
                  onClick={() => {
                    onChange(getNextContext(context, step.id, option.value));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FlowStepCta
        actionLabel={isLast ? '설문으로 이어가기' : '계속'}
        currentIndex={safeIndex}
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onContinue}
        total={TASTE_SURVEY_CONTEXT_STEPS.length}
      />
    </div>
  );
}
