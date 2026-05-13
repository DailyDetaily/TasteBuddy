import { ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { PREFERENCE_INTAKE_QUESTIONS, type PreferenceIntakeProfile } from '../constants/preferenceIntakeData';
import { TASTE_SURVEY_CONTEXT_OPTIONS } from '../constants/tasteSurveyConfig';
import type { TasteSurveyRespondentContext } from '../types/tasteSurvey';

interface ProfileIdentitySheetContentProps {
  avatarImageDataUrl: string | null;
  avatarStyle: CSSProperties;
  birthDate: string | null;
  displayName: string | null;
  email: string | null;
  initials: string;
  isAnonymous: boolean;
  nickname: string | null;
  preferenceProfile: PreferenceIntakeProfile | null;
  respondentContext: TasteSurveyRespondentContext;
  userTasteAccentStyle: CSSProperties;
  onEditProfile: () => void;
  onLinkCurrentProfile: () => void;
}

const dietaryRestrictionQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);

function resolveContextLabel<Field extends keyof typeof TASTE_SURVEY_CONTEXT_OPTIONS>(
  field: Field,
  value: TasteSurveyRespondentContext[Field] | undefined,
) {
  if (!value) {
    return null;
  }

  return TASTE_SURVEY_CONTEXT_OPTIONS[field].find((option) => option.value === value)?.label ?? null;
}

function resolveCompactSexLabel(value: TasteSurveyRespondentContext['sexContext']) {
  if (value === 'male') {
    return '남';
  }

  if (value === 'female') {
    return '여';
  }

  if (value === 'prefer_not_to_say') {
    return '미공개';
  }

  return value ? '기타' : null;
}

function resolveCompactSmokingLabel(value: TasteSurveyRespondentContext['smokingStatus']) {
  if (value === 'current') {
    return '흡연자';
  }

  if (value === 'former') {
    return '과거 흡연';
  }

  if (value === 'never') {
    return '비흡연';
  }

  if (value === 'prefer_not_to_say') {
    return '미공개';
  }

  return null;
}

function getDietaryRestrictionCount(profile: PreferenceIntakeProfile | null) {
  const restrictions = profile?.dietaryRestrictions ?? [];

  if (restrictions.length === 0 || !dietaryRestrictionQuestion) {
    return 0;
  }

  return restrictions
    .filter((restriction) => {
      const option = dietaryRestrictionQuestion.options.find((item) => item.id === restriction);

      return option && option.id !== dietaryRestrictionQuestion.noneOptionId;
    })
    .length;
}

function getAgeLabelFromBirthDate(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? `${age}세` : null;
}

function createReferenceSummary(
  birthDate: string | null,
  context: TasteSurveyRespondentContext,
  profile: PreferenceIntakeProfile | null,
) {
  const dietaryRestrictionCount = getDietaryRestrictionCount(profile);
  const dietaryRestrictionLabel =
    dietaryRestrictionCount > 0 ? `식이제한 ${dietaryRestrictionCount}개` : '식이제한 없음';
  const ageLabel = getAgeLabelFromBirthDate(birthDate) ?? resolveContextLabel('ageRange', context.ageRange);
  const sexLabel = resolveCompactSexLabel(context.sexContext);
  const smokingLabel = resolveCompactSmokingLabel(context.smokingStatus);
  const enteredLabels = [
    ageLabel,
    sexLabel,
    smokingLabel,
    dietaryRestrictionLabel,
  ].filter(Boolean);
  const missingLabels = [
    ageLabel ? null : '연령',
    context.sexContext ? null : '성별',
    context.smokingStatus ? null : '흡연유무',
  ].filter(Boolean);

  if (missingLabels.length > 0) {
    enteredLabels.push(`${missingLabels.join('•')} 미입력`);
  }

  return enteredLabels.join(', ');
}

export default function ProfileIdentitySheetContent({
  avatarImageDataUrl,
  avatarStyle,
  birthDate,
  displayName,
  email,
  initials,
  isAnonymous,
  nickname,
  preferenceProfile,
  respondentContext,
  userTasteAccentStyle,
  onEditProfile,
  onLinkCurrentProfile,
}: ProfileIdentitySheetContentProps) {
  const nameLabel = displayName || '이름 미설정';
  const nicknameLabel = nickname || '닉네임 미설정';
  const referenceSummary = createReferenceSummary(
    birthDate,
    respondentContext,
    preferenceProfile,
  );

  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onEditProfile}
        className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3 text-left transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 rounded-full">
            <div
              className="flex size-16 items-center justify-center overflow-hidden rounded-full"
              style={avatarImageDataUrl ? undefined : avatarStyle}
            >
              {avatarImageDataUrl ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  src={avatarImageDataUrl}
                />
              ) : (
                <span className="text-[18px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.34)]">
                  {initials}
                </span>
              )}
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

        <div
          className="mt-5 flex w-full items-center gap-3 rounded-[var(--tb-radius-12)] px-3 py-3 text-left transition-transform active:scale-[0.99]"
          style={{
            ...userTasteAccentStyle,
            background: 'var(--tb-user-accent-tint-surface)',
            color: 'var(--tb-user-accent-dark)',
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[var(--tb-user-accent-dark)]">
              {referenceSummary}
            </p>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--tb-user-accent-dark)]"
            strokeWidth={2.4}
          />
        </div>
      </button>

      <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
              계정 연결
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              {isAnonymous
                ? '지금 만든 미각 프로필을 이메일에 연결하면 다음 기기에서도 이어서 사용할 수 있어요.'
                : '현재 프로필은 이메일 계정에 연결되어 있습니다.'}
            </p>
          </div>
        </div>

        {isAnonymous ? (
          <button
            type="button"
            onClick={onLinkCurrentProfile}
            className="mt-3 flex h-11 w-full items-center justify-between rounded-[var(--tb-radius-12)] px-3 text-left text-[12px] font-semibold transition-transform active:scale-[0.99]"
            style={{
              ...userTasteAccentStyle,
              background: 'var(--tb-user-accent-tint-surface)',
              color: 'var(--tb-user-accent-dark)',
            }}
          >
            <span>현재 프로필을 이메일에 연결</span>
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
          </button>
        ) : email ? (
          <div className="mt-3 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-2">
            <p className="text-[11px] font-semibold text-[var(--tb-color-text-faint)]">
              연결된 이메일
            </p>
            <p className="mt-1 break-words text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              {email}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
