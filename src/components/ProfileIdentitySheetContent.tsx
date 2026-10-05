import { ChevronRight } from 'lucide-react';
import { nativeProfileSummary } from '../lib/gastronomy/nativeProfile';
import type { CSSProperties } from 'react';

import { PREFERENCE_INTAKE_QUESTIONS, type PreferenceIntakeProfile } from '../constants/preferenceIntakeData';
import type { TasteSurveyRespondentContext } from '../types/tasteSurvey';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from './system/PalateBloomAvatar';

interface ProfileIdentitySheetContentProps {
  summaryOverride?: string;
  birthDate: string | null;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
  nickname: string | null;
  preferenceProfile: PreferenceIntakeProfile | null;
  respondentContext: TasteSurveyRespondentContext;
  userAvatarImageSrc?: string | null;
  userPalateBloomProfile?: PalateBloomTasteProfile;
  userPalateBloomShapeSeed?: string;
  userTasteAccentStyle: CSSProperties;
  onEditProfile: () => void;
  onLinkCurrentProfile: () => void;
}

const dietaryRestrictionQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);

export default function ProfileIdentitySheetContent({
  summaryOverride,
  birthDate,
  displayName,
  email,
  isAnonymous,
  nickname,
  preferenceProfile,
  respondentContext,
  userAvatarImageSrc,
  userPalateBloomProfile,
  userPalateBloomShapeSeed,
  userTasteAccentStyle,
  onEditProfile,
  onLinkCurrentProfile,
}: ProfileIdentitySheetContentProps) {
  const nameLabel = displayName || '이름 미설정';
  const nicknameLabel = `@${nickname?.trim().replace(/^@+|@+$/g, '') || 'tastebuddy'}`;
  const restrictions = (preferenceProfile?.dietaryRestrictions ?? []).filter(value => value !== dietaryRestrictionQuestion?.noneOptionId);
  const referenceSummary = summaryOverride ?? nativeProfileSummary({...respondentContext, birthDate:birthDate ?? respondentContext.birthDate}, restrictions);

  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onEditProfile}
        aria-label="프로필 편집"
        className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3 text-left transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-[14px]">
          <PalateBloomAvatar
            ariaLabel={nameLabel}
            imageSrc={userAvatarImageSrc}
            profile={userPalateBloomProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
            shapeSeed={userPalateBloomShapeSeed}
            size={64}
          />

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
            background: 'var(--tb-color-surface-muted)',
            color: 'var(--tb-color-text-secondary)',
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
              {referenceSummary}
            </p>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--tb-color-text-secondary)]"
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
                ? '현재 계정을 이메일에 연결하면 식사 기록과 입맛 해석을 다음 기기에서도 이어서 볼 수 있어요.'
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
              background: 'var(--tb-color-surface-muted)',
              color: 'var(--tb-color-text-secondary)',
            }}
          >
            <span>현재 계정을 이메일에 연결</span>
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
