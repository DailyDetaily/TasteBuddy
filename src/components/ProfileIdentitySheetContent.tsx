import { ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { PREFERENCE_INTAKE_QUESTIONS, type PreferenceIntakeProfile } from '../constants/preferenceIntakeData';
import { TASTE_SURVEY_CONTEXT_OPTIONS } from '../constants/tasteSurveyConfig';
import type { TasteSurveyRespondentContext } from '../types/tasteSurvey';

interface ProfileIdentitySheetContentProps {
  avatarStyle: CSSProperties;
  displayName: string | null;
  email: string | null;
  initials: string;
  nickname: string | null;
  preferenceProfile: PreferenceIntakeProfile | null;
  respondentContext: TasteSurveyRespondentContext;
  userTasteAccentStyle: CSSProperties;
  onEditReferenceInfo: () => void;
}

const dietaryRestrictionQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);

function resolveContextLabel<Field extends keyof typeof TASTE_SURVEY_CONTEXT_OPTIONS>(
  field: Field,
  value: TasteSurveyRespondentContext[Field] | undefined,
) {
  if (!value) {
    return '미입력';
  }

  return TASTE_SURVEY_CONTEXT_OPTIONS[field].find((option) => option.value === value)?.label ?? '미입력';
}

function resolveDietaryRestrictionLabel(profile: PreferenceIntakeProfile | null) {
  const restrictions = profile?.dietaryRestrictions ?? [];

  if (restrictions.length === 0 || !dietaryRestrictionQuestion) {
    return '미입력';
  }

  return restrictions
    .map((restriction) => (
      dietaryRestrictionQuestion.options.find((option) => option.id === restriction)?.label
    ))
    .filter(Boolean)
    .join(', ');
}

export default function ProfileIdentitySheetContent({
  avatarStyle,
  displayName,
  email,
  initials,
  nickname,
  preferenceProfile,
  respondentContext,
  userTasteAccentStyle,
  onEditReferenceInfo,
}: ProfileIdentitySheetContentProps) {
  const nameLabel = displayName || '이름 미설정';
  const nicknameLabel = nickname || '닉네임 미설정';
  const referenceInfo = [
    { label: '연령', value: resolveContextLabel('ageRange', respondentContext.ageRange) },
    { label: '성별', value: resolveContextLabel('sexContext', respondentContext.sexContext) },
    { label: '흡연', value: resolveContextLabel('smokingStatus', respondentContext.smokingStatus) },
    { label: '식이제한', value: resolveDietaryRestrictionLabel(preferenceProfile) },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3">
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 rounded-full">
            <div
              className="flex size-16 items-center justify-center overflow-hidden rounded-full"
              style={avatarStyle}
            >
              <span className="text-[18px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.34)]">
                {initials}
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              {nameLabel}
            </p>
            <p className="mt-1 truncate text-[13px] font-semibold text-[var(--tb-color-text-muted)]">
              {nicknameLabel}
            </p>
            {email ? (
              <p className="mt-1 truncate text-[12px] text-[var(--tb-color-text-faint)]">
                {email}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onEditReferenceInfo}
          className="mt-5 flex w-full items-center gap-3 rounded-[var(--tb-radius-12)] px-3 py-3 text-left transition-transform active:scale-[0.99]"
          style={{
            ...userTasteAccentStyle,
            background: 'var(--tb-user-accent-tint-surface)',
            color: 'var(--tb-user-accent-dark)',
          }}
        >
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2">
            {referenceInfo.map((item) => (
              <div key={item.label} className="min-w-0">
                <p className="text-[10px] font-semibold text-[var(--tb-user-accent-tint-surface-sub-text)]">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[var(--tb-user-accent-tint-surface-text)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--tb-user-accent-dark)]"
            strokeWidth={2.4}
          />
        </button>
      </div>
    </section>
  );
}
