import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  CircleCheck as CircleCheckIcon,
  Trophy as TrophyIcon,
  Star as StarIcon,
  UserPlus as UserPlusIcon
} from 'lucide-react';
import React from 'react';
import { TASTE_TOKENS } from '../constants/uiColorTokens';

import type { AppMenuSupportPanel } from '../components/AppMenuDrawer';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, className, ...props }: any) => (
    <IconComponent
      {...props}
      className={className}
      style={{ fontSize: size ?? 20, width: size ?? 20, height: size ?? 20, ...style }}
    />
  );
};

const Settings = wrapIcon(SettingsIcon);
const Bookmark = wrapIcon(BookmarkIcon);
const CircleCheck = wrapIcon(CircleCheckIcon);
const Award = wrapIcon(TrophyIcon);
const Star = wrapIcon(StarIcon);

import PageSection from '../components/system/PageSection';
import NativeProfileActivity from '../components/profile/NativeProfileActivity';
import DiningFriendActionButton from '../components/profile/DiningFriendActionButton';
import CapsuleButton from '../components/system/CapsuleButton';
import PalateBloomAvatar, {
  createPalateBloomProfileFromMeasurementSnapshot,
  createPalateBloomFallbackProfile,
  type TasteProfile as PalateBloomTasteProfile,
} from '../components/system/PalateBloomAvatar';
import SummaryMetricCard from '../components/system/SummaryMetricCard';
import DiningFriendProfileCard from '../components/profile/DiningFriendProfileCard';
import { ICON_TOKENS } from '../constants/designTokens';
import {
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import { resolvePublicMediaPath } from '../lib/mediaAssets';
import type {
  DiningFriendProfile,
  ProfileConnectionKind,
} from '../lib/supabase';

interface ProfileStat {
  color: string;
  icon: React.ElementType;
  label: string;
  value: string;
}

export interface ProfileIdentityData {
  avatarImageDataUrl?: string | null;
  displayName?: string | null;
  followerCount?: number | null;
  followingCount?: number | null;
  nickname?: string | null;
  palateBloomProfile?: PalateBloomTasteProfile;
  palateBloomShapeSeed?: string;
}

export interface FavoriteChef {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
  taste: string;
}

const DEFAULT_PROFILE_IDENTITY: Required<Pick<ProfileIdentityData, 'displayName' | 'followerCount' | 'followingCount'>> = {
  displayName: 'Taste Buddy Guest',
  followerCount: 0,
  followingCount: 0,
};

function formatSocialCount(count: number | null | undefined) {
  return count == null ? '—' : Math.max(0, count).toLocaleString('ko-KR');
}

function deriveProfileStatsFromCounts({
  averageRating,
  feedbackCount,
  listLabel = '테이스트 리스트',
  listValue,
  measurementCount,
  savedListCount,
}: {
  averageRating: number | null;
  feedbackCount: number;
  listLabel?: string;
  listValue?: string;
  measurementCount: number;
  savedListCount: number;
}): ProfileStat[] {
  return [
    {
      label: '미각 기록',
      value: `${measurementCount}회`,
      icon: Award,
      color: '#FF9900',
    },
    {
      label: '다이닝 리뷰',
      value: `${feedbackCount}건`,
      icon: CircleCheck,
      color: '#B372B4',
    },
    {
      label: listLabel,
      value: listValue ?? `${savedListCount}개`,
      icon: Bookmark,
      color: '#7299FF',
    },
    {
      label: '평균 만족도',
      value: averageRating !== null ? averageRating.toFixed(1) : '-',
      icon: Star,
      color: TASTE_TOKENS.sour.palette.main,
    },
  ];
}

interface ProfilePageProps {
  owner?: string;
  active?: boolean;
  onFindBuddy?: () => void;
  measurementSnapshot?: TasteMeasurementSnapshot | null;
  starterGuidance?: RestaurantReadyGuidance | null;
  profileIdentity?: ProfileIdentityData;
  onOpenSupportPanel?: (panel: AppMenuSupportPanel) => void;
  onStartMeasurement: () => void;
  onNavigateToReservation?: (chefName: string) => void;
  onOpenRestaurantDetail?: (chef: FavoriteChef) => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onOpenProfileSettings?: () => void;
  onOpenSavedList?: () => void;
  onAddFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onRemoveFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  activeConnectionView?: ProfileConnectionKind | null;
  selectedConnectionProfile?: DiningFriendProfile | null;
  onConnectionViewChange?: (kind: ProfileConnectionKind | null) => void;
  onSelectedConnectionProfileChange?: (friend: DiningFriendProfile | null) => void;
  onLoadConnections?: (kind: ProfileConnectionKind) => Promise<{
    ok: boolean;
    friends: DiningFriendProfile[];
    message: string;
  }>;
  hasUnreadNotifications?: boolean;
}

export default function ProfilePage({
  owner = 'guest',
  active = true,
  onFindBuddy,
  measurementSnapshot,
  profileIdentity,
  onOpenProfileSettings,
  onOpenSavedList,
  onAddFriend,
  onRemoveFriend,
  activeConnectionView = null,
  selectedConnectionProfile = null,
  onConnectionViewChange,
  onSelectedConnectionProfileChange,
  onLoadConnections,
}: ProfilePageProps) {
  const displayName = profileIdentity?.displayName?.trim() || 'Taste Buddy Guest';
  const nickname = profileIdentity?.nickname?.trim().replace(/^@+|@+$/g, '') ?? '';
  const nicknameLabel = nickname ? `@${nickname}` : '@tastebuddy';
  const followerCount = profileIdentity?.followerCount;
  const followingCount = profileIdentity?.followingCount;
  const palateBloomShapeSeed = profileIdentity?.palateBloomShapeSeed ?? 'current-user';
  const palateBloomProfile =
    profileIdentity?.palateBloomProfile ??
    (measurementSnapshot ? createPalateBloomProfileFromMeasurementSnapshot(measurementSnapshot, nickname || displayName) : createPalateBloomFallbackProfile('current-user'));
  const [connectionProfiles, setConnectionProfiles] = useState<DiningFriendProfile[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [updatingConnectionId, setUpdatingConnectionId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeConnectionView || !onLoadConnections) {
      return;
    }

    let isCancelled = false;
    setConnectionStatus('loading');
    setConnectionMessage(null);

    void (async () => {
      const result = await onLoadConnections(activeConnectionView);

      if (isCancelled) {
        return;
      }

      setConnectionProfiles(result.friends);
      setConnectionStatus(result.ok ? 'success' : 'error');
      setConnectionMessage(result.ok ? null : result.message);
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeConnectionView, onLoadConnections]);

  const openConnectionView = (kind: ProfileConnectionKind) => {
    onConnectionViewChange?.(kind);
    onSelectedConnectionProfileChange?.(null);
    setConnectionProfiles([]);
    setConnectionStatus('idle');
    setConnectionMessage(null);
  };

  const handleToggleConnectionFriend = async (friend: DiningFriendProfile) => {
    const handler = friend.isFriend ? onRemoveFriend : onAddFriend;

    if (!handler) {
      return;
    }

    setUpdatingConnectionId(friend.id);
    const result = await handler(friend);
    setUpdatingConnectionId((currentId) => (currentId === friend.id ? null : currentId));
    setConnectionMessage(result.message);

    if (result.ok) {
      const nextFriend = { ...friend, isFriend: !friend.isFriend };

      setConnectionProfiles((currentProfiles) =>
        friend.isFriend && activeConnectionView === 'following'
          ? currentProfiles.filter((item) => item.id !== friend.id)
          : currentProfiles.map((item) =>
            item.id === friend.id ? nextFriend : item,
          ),
      );

      if (selectedConnectionProfile?.id === friend.id) {
        onSelectedConnectionProfileChange?.(
          friend.isFriend && activeConnectionView === 'following' ? null : nextFriend,
        );
      }
    }
  };

  if (activeConnectionView) {
    const connectionTitle = activeConnectionView === 'followers' ? '팔로워' : '팔로잉';
    const emptyDescription =
      activeConnectionView === 'followers'
        ? '아직 나를 팔로우한 다이닝 친구가 없습니다.'
        : '아직 내가 팔로우한 다이닝 친구가 없습니다.';

    if (selectedConnectionProfile) {
      const selectedProfileName =
        selectedConnectionProfile.displayName || selectedConnectionProfile.nickname || 'Taste Buddy Guest';
      const selectedProfileNickname = selectedConnectionProfile.nickname
        ? `@${selectedConnectionProfile.nickname}`
        : '버디네임 미설정';
      const selectedProfileSnapshot = selectedConnectionProfile.latestTasteMeasurementSnapshot;
      const selectedProfileAvatarSrc = resolvePublicMediaPath(selectedConnectionProfile.avatarPath);
      const selectedProfileBloom = createPalateBloomProfileFromMeasurementSnapshot(
        selectedProfileSnapshot,
        selectedConnectionProfile.id,
      );
      const isSeedTasteProfile = selectedConnectionProfile.id.startsWith('taste-dev-');
      const selectedProfileActionDisabled =
        isSeedTasteProfile ||
        updatingConnectionId === selectedConnectionProfile.id ||
        (selectedConnectionProfile.isFriend ? !onRemoveFriend : !onAddFriend);
      const selectedProfileActionLabel = selectedConnectionProfile.isFriend
        ? updatingConnectionId === selectedConnectionProfile.id
          ? '취소 중'
          : '팔로잉'
        : isSeedTasteProfile
          ? '개발 프로필'
        : updatingConnectionId === selectedConnectionProfile.id
          ? '추가 중'
          : '팔로우';
      const selectedProfileStats = selectedConnectionProfile.activitySummary ? deriveProfileStatsFromCounts({
        averageRating: selectedConnectionProfile.activitySummary?.averageRating ?? null,
        feedbackCount: selectedConnectionProfile.activitySummary?.feedbackCount ?? 0,
        measurementCount:
          selectedConnectionProfile.activitySummary?.measurementCount ??
          (selectedProfileSnapshot ? 1 : 0),
        savedListCount: selectedConnectionProfile.activitySummary?.savedRestaurantCount ?? 0,
      }) : null;
      return (
        <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="tb-section-stack px-5 pb-[72px] pt-2 animate-fadeIn">
              <div className="tb-card-stack">
                <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-[14px]">
                      <PalateBloomAvatar
                        ariaLabel={selectedProfileName}
                        imageSrc={selectedProfileAvatarSrc}
                        profile={selectedProfileBloom}
                        shapeSeed={`${selectedConnectionProfile.id}|${selectedProfileSnapshot?.measuredAt ?? 'no-measurement'}`}
                        size={64}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                          {selectedProfileName}
                        </span>
                        <span className="truncate text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                          {selectedProfileNickname}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[18px]">
                      <div className="flex min-w-[64px] flex-col gap-[3px] rounded-[8px] text-left">
                        <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {formatSocialCount(selectedConnectionProfile.followerCount)}
                        </span>
                        <span className="text-[12px] text-[var(--tb-color-text-hint)]">팔로워</span>
                      </div>
                      <div className="flex min-w-[64px] flex-col gap-[3px] rounded-[8px] text-left">
                        <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {formatSocialCount(selectedConnectionProfile.followingCount)}
                        </span>
                        <span className="text-[12px] text-[var(--tb-color-text-hint)]">팔로잉</span>
                      </div>
                      <DiningFriendActionButton
                        ariaLabel={
                          selectedConnectionProfile.isFriend ? '팔로잉 취소' : '팔로우'
                        }
                        className="ml-auto"
                        onClick={() => void handleToggleConnectionFriend(selectedConnectionProfile)}
                        disabled={selectedProfileActionDisabled}
                        label={selectedProfileActionLabel}
                        textSize="md"
                        variant={selectedConnectionProfile.isFriend ? 'neutral' : 'accent'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <PageSection title="활동 요약" titleAs="h2">
                {selectedProfileStats ? <div className="grid grid-cols-2 gap-3">
                  {selectedProfileStats.map((stat) => (
                    <SummaryMetricCard
                      key={stat.label}
                      color={stat.color}
                      icon={stat.icon}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div> : <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-3">
                  <p className="text-[14px] font-bold leading-[17px] text-[var(--tb-color-text-primary)]">활동 통계 미제공</p>
                  <p className="mt-[5px] text-[12px] leading-[15px] text-[var(--tb-color-text-subtle)]">이 프로필에서 공개한 기록 통계가 없습니다.</p>
                </div>}
              </PageSection>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 pt-5">
          <div className="flex flex-col gap-3">
            {connectionStatus === 'loading' ? (
              <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-4 text-[13px] font-semibold text-[var(--tb-color-text-muted)]">
                {connectionTitle} 목록을 불러오고 있어요.
              </div>
            ) : null}

            {connectionStatus !== 'loading' && connectionProfiles.length === 0 ? (
              <div className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-4">
                <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                  {connectionStatus === 'error'
                    ? `${connectionTitle} 목록을 불러오지 못했어요`
                    : `${connectionTitle} 목록이 비어 있어요`}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {connectionMessage ?? emptyDescription}
                </p>
              </div>
            ) : null}

            {connectionProfiles.map((friend) => (
              <DiningFriendProfileCard
                key={friend.id}
                actionAriaLabel={friend.isFriend ? '팔로잉 취소' : '팔로우'}
                actionDisabled={updatingConnectionId === friend.id || (friend.isFriend ? !onRemoveFriend : !onAddFriend)}
                actionLabel={
                  friend.isFriend
                    ? updatingConnectionId === friend.id
                      ? '취소 중'
                      : '팔로잉'
                    : updatingConnectionId === friend.id
                      ? '추가 중'
                      : '팔로우'
                }
                actionVariant={friend.isFriend ? 'neutral' : 'accent'}
                friend={friend}
                onAction={(selectedFriend) => void handleToggleConnectionFriend(selectedFriend)}
                onOpenProfile={(selectedFriend) => onSelectedConnectionProfileChange?.(selectedFriend)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-[72px] pt-2 animate-fadeIn">
          <div className="tb-card-stack">
            <div className="relative rounded-[20px] bg-[var(--tb-color-surface-base)] p-3">
              <button
                type="button"
                onClick={onOpenProfileSettings}
                className="absolute right-3 top-3 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-card)]"
                style={{
                  width: ICON_TOKENS.container.lg,
                  height: ICON_TOKENS.container.lg,
                }}
                aria-label="프로필 설정 열기"
              >
                <Settings size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-primary)]" />
              </button>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-[14px] pr-12">
                  <PalateBloomAvatar
                    ariaLabel={displayName}
                    imageSrc={profileIdentity?.avatarImageDataUrl ?? undefined}
                    profile={palateBloomProfile}
                    shapeSeed={palateBloomShapeSeed}
                    size={64}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[16px] font-bold text-[var(--tb-color-text-primary)]">{displayName}</span>
                    <span className="truncate text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                      {nicknameLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-[18px]">
                  <button
                    type="button"
                    onClick={() => openConnectionView('followers')}
                    className="flex min-w-[64px] flex-col gap-[3px] rounded-[8px] text-left transition-colors"
                  >
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followerCount)}
                    </span>
                    <span className="text-[12px] text-[var(--tb-color-text-hint)]">팔로워</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openConnectionView('following')}
                    className="flex min-w-[64px] flex-col gap-[3px] rounded-[8px] text-left transition-colors"
                  >
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followingCount)}
                    </span>
                    <span className="text-[12px] text-[var(--tb-color-text-hint)]">팔로잉</span>
                  </button>
                  <CapsuleButton
                    type="button"
                    onClick={onFindBuddy}
                    className="ml-auto"
                    icon={UserPlusIcon}
                  >
                    버디 찾기
                  </CapsuleButton>
                </div>
              </div>
            </div>

          </div>

          <NativeProfileActivity owner={owner} active={active} onOpenSavedList={onOpenSavedList} />

        </div>
      </div>
    </div>
  );
}
