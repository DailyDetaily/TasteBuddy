import { ChevronRight, Search, UserPlus } from 'lucide-react';
import { useState, type CSSProperties, type FormEvent } from 'react';

import { PREFERENCE_INTAKE_QUESTIONS, type PreferenceIntakeProfile } from '../constants/preferenceIntakeData';
import type { DiningFriendProfile } from '../lib/supabase';
import type { TasteSurveyRespondentContext } from '../types/tasteSurvey';
import TasteProfileAvatar from './system/TasteProfileAvatar';

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
  friendCount: number;
  onAddFriend: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onEditProfile: () => void;
  onLinkCurrentProfile: () => void;
  onSearchFriends: (query: string) => Promise<{
    ok: boolean;
    friends: DiningFriendProfile[];
    message: string;
  }>;
}

const dietaryRestrictionQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);

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
  const birthDateLabel = birthDate ?? context.birthDate ?? null;
  const ageLabel = getAgeLabelFromBirthDate(birthDateLabel);
  const sexLabel = resolveCompactSexLabel(context.sexContext);
  const smokingLabel = resolveCompactSmokingLabel(context.smokingStatus);
  const enteredLabels = [
    ageLabel,
    sexLabel,
    smokingLabel,
    dietaryRestrictionLabel,
  ].filter(Boolean);
  const missingLabels = [
    ageLabel ? null : '생년월일',
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
  friendCount,
  onAddFriend,
  onEditProfile,
  onLinkCurrentProfile,
  onSearchFriends,
}: ProfileIdentitySheetContentProps) {
  const nameLabel = displayName || '이름 미설정';
  const nicknameLabel = nickname || '버디네임 미설정';
  const referenceSummary = createReferenceSummary(
    birthDate,
    respondentContext,
    preferenceProfile,
  );
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState<DiningFriendProfile[]>([]);
  const [friendSearchStatus, setFriendSearchStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  const handleFriendSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFriendSearchStatus('searching');
    setFriendMessage(null);

    const result = await onSearchFriends(friendQuery);

    setFriendResults(result.friends);
    setFriendSearchStatus(result.ok ? 'success' : 'error');
    setFriendMessage(
      result.ok
        ? result.friends.length > 0
          ? `${result.friends.length}명의 다이닝 친구를 찾았습니다.`
          : '일치하는 버디네임을 찾지 못했습니다.'
        : result.message,
    );
  };

  const handleAddFriend = async (friend: DiningFriendProfile) => {
    setAddingFriendId(friend.id);
    setFriendMessage(null);

    const result = await onAddFriend(friend);

    setFriendMessage(result.message);
    setAddingFriendId(null);

    if (result.ok) {
      setFriendResults((currentResults) =>
        currentResults.map((item) =>
          item.id === friend.id ? { ...item, isFriend: true } : item,
        ),
      );
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onEditProfile}
        className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3 text-left transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <TasteProfileAvatar
            imageSrc={avatarImageDataUrl}
            initials={initials}
            size="md"
            style={avatarStyle}
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

      <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-bg-focus)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
              다이닝 친구
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              버디네임으로 친구를 찾아 다음 다이닝 취향 기록을 함께 이어갈 수 있어요.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
            팔로잉 {friendCount.toLocaleString('ko-KR')}명
          </div>
        </div>

        <form className="mt-3 flex gap-2" onSubmit={handleFriendSearch}>
          <label className="min-w-0 flex-1">
            <span className="sr-only">친구 버디네임 검색</span>
            <input
              autoComplete="off"
              className="h-11 w-full rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[13px] font-semibold text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
              onChange={(event) => setFriendQuery(event.target.value)}
              placeholder="@buddyname"
              type="search"
              value={friendQuery}
            />
          </label>
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] transition-transform active:scale-[0.98] disabled:opacity-50"
            disabled={friendSearchStatus === 'searching'}
            aria-label="친구 검색"
          >
            <Search className="size-4" strokeWidth={2.3} />
          </button>
        </form>

        {friendMessage ? (
          <p
            className="mt-2 text-[11px] leading-relaxed"
            style={{
              color: friendSearchStatus === 'error'
                ? 'var(--tb-color-feedback-danger, #b42318)'
                : 'var(--tb-color-text-muted)',
            }}
          >
            {friendMessage}
          </p>
        ) : null}

        {friendResults.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {friendResults.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-surface-muted)] text-[12px] font-bold text-[var(--tb-color-text-muted)]">
                  {(friend.displayName || friend.nickname).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                    {friend.displayName || 'Taste Buddy Guest'}
                  </p>
                  <p className="mt-[2px] truncate text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                    @{friend.nickname}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--tb-color-border-default)] px-3 text-[11px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)] disabled:opacity-55"
                  disabled={friend.isFriend || addingFriendId === friend.id}
                  onClick={() => void handleAddFriend(friend)}
                >
                  <UserPlus className="size-3.5" strokeWidth={2.2} />
                  <span>
                    {friend.isFriend
                      ? '추가됨'
                      : addingFriendId === friend.id
                        ? '추가 중'
                        : '추가'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
