import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  ChevronRight as ChevronRightIcon,
  CircleCheck as CircleCheckIcon,
  Trophy as TrophyIcon,
  Star as StarIcon,
  UserPlus as UserPlusIcon
} from 'lucide-react';
import React from 'react';

import type { AppMenuSupportPanel } from '../components/AppMenuDrawer';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, className, ...props }: any) => (
    <IconComponent
      {...props}
      className={className}
      style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
    />
  );
};

const Settings = wrapIcon(SettingsIcon);
const Bookmark = wrapIcon(BookmarkIcon);
const ChevronRight = wrapIcon(ChevronRightIcon);
const CircleCheck = wrapIcon(CircleCheckIcon);
const Award = wrapIcon(TrophyIcon);
const Star = wrapIcon(StarIcon);
const UserPlus = wrapIcon(UserPlusIcon);
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;

import ChefAvatar from '../components/system/ChefAvatar';
import CompactCard from '../components/system/CompactCard';
import OutlineBadge from '../components/system/OutlineBadge';
import PageSection from '../components/system/PageSection';
import PalateBloomAvatar, {
  createPalateBloomProfileFromMeasurementSnapshot,
  type TasteProfile as PalateBloomTasteProfile,
} from '../components/system/PalateBloomAvatar';
import SummaryMetricCard from '../components/system/SummaryMetricCard';
import TastickDeviceCard from '../components/system/TastickDeviceCard';
import DiningFriendProfileCard from '../components/profile/DiningFriendProfileCard';
import { ICON_TOKENS } from '../constants/designTokens';
import { type ReservationRecord } from '../constants/reservationCatalog';
import { type DiningFeedbackDraft } from '../constants/diningFeedbackData';
import {
  getAverageMeasurementMm,
  getTasteProfileBadge,
  isBroadStarterMeasurementSnapshot,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import {
  hydrateRecentMeasurementSnapshots,
  hydrateReservationPageData,
} from '../lib/tasteBuddySupabase';
import {
  loadRestaurantBookmarks,
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
} from '../components/restaurant/RestaurantBookmarkSheet';
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
  followerCount?: number;
  followingCount?: number;
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
function formatChefName(name: string) {
  return name.endsWith('셰프') ? name : `${name} 셰프`;
}

function formatSocialCount(count: number | null | undefined) {
  return Math.max(0, count ?? 0).toLocaleString('ko-KR');
}

function deriveFavoriteChefs(reservations: ReservationRecord[]): FavoriteChef[] {
  const chefMap = new Map<string, FavoriteChef>();

  for (const reservation of reservations) {
    const key = `${reservation.chef}:${reservation.restaurant}`;
    const existing = chefMap.get(key);

    if (!existing || reservation.matchRate > existing.matchRate) {
      chefMap.set(key, {
        name: reservation.chef,
        restaurant: reservation.restaurant,
        image: reservation.chefImage,
        matchRate: reservation.matchRate,
        taste: reservation.adjustments[0]?.taste ?? '감칠맛',
      });
    }
  }

  return Array.from(chefMap.values())
    .sort((left, right) => right.matchRate - left.matchRate)
    .slice(0, 3);
}

function deriveProfileStats(
  measurementSnapshots: TasteMeasurementSnapshot[],
  feedbackCount: number,
  savedListCount: number,
  averageRating: number | null,
): ProfileStat[] {
  return deriveProfileStatsFromCounts({
    averageRating,
    feedbackCount,
    measurementCount: measurementSnapshots.length,
    savedListCount,
  });
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
      label: 'TCS 보정',
      value: `${measurementCount}회`,
      icon: Award,
      color: '#FF9900',
    },
    {
      label: '피드백',
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
      color: '#FBC02D',
    },
  ];
}

function getActualMeasurementSnapshots(
  hydratedSnapshots: TasteMeasurementSnapshot[],
  currentSnapshot: TasteMeasurementSnapshot,
) {
  if (hydratedSnapshots.length === 0) {
    return [currentSnapshot];
  }

  const seenMeasuredAt = new Set<string>();
  return [...hydratedSnapshots, currentSnapshot].filter((snapshot) => {
    if (seenMeasuredAt.has(snapshot.measuredAt)) {
      return false;
    }

    seenMeasuredAt.add(snapshot.measuredAt);
    return true;
  });
}

function getAverageFeedbackRating(feedbackEntries: DiningFeedbackDraft[]) {
  if (feedbackEntries.length === 0) {
    return null;
  }

  return (
    feedbackEntries.reduce((sum, feedback) => sum + feedback.overallRating, 0) /
    feedbackEntries.length
  );
}

interface ProfilePageProps {
  measurementSnapshot: TasteMeasurementSnapshot;
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
  measurementSnapshot,
  starterGuidance = null,
  profileIdentity,
  onNavigateToReservation,
  onOpenRestaurantDetail,
  onOpenProfileSettings,
  onOpenSavedList,
  onAddFriend,
  onRemoveFriend,
  activeConnectionView = null,
  selectedConnectionProfile = null,
  onConnectionViewChange,
  onSelectedConnectionProfileChange,
  onLoadConnections,
  hasUnreadNotifications,
}: ProfilePageProps) {
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const averageMeasurement = getAverageMeasurementMm(measurementSnapshot);
  const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);
  const displayName = profileIdentity?.displayName?.trim() || DEFAULT_PROFILE_IDENTITY.displayName;
  const nickname = profileIdentity?.nickname?.trim() ?? '';
  const nicknameLabel = nickname ? `@${nickname}` : '버디네임 미설정';
  const followerCount = profileIdentity?.followerCount ?? DEFAULT_PROFILE_IDENTITY.followerCount;
  const followingCount = profileIdentity?.followingCount ?? DEFAULT_PROFILE_IDENTITY.followingCount;
  const palateBloomShapeSeed = profileIdentity?.palateBloomShapeSeed;
  const palateBloomProfile =
    profileIdentity?.palateBloomProfile ??
    createPalateBloomProfileFromMeasurementSnapshot(
      measurementSnapshot,
      nickname || displayName || 'taste-buddy-profile',
    );
  const [connectionProfiles, setConnectionProfiles] = useState<DiningFriendProfile[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [updatingConnectionId, setUpdatingConnectionId] = useState<string | null>(null);
  const [favoriteChefs, setFavoriteChefs] = useState<FavoriteChef[]>([]);
  const [stats, setStats] = useState<ProfileStat[]>(() =>
    deriveProfileStats([measurementSnapshot], 0, loadRestaurantBookmarks().length, null),
  );

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const [hydratedData, hydratedMeasurements] = await Promise.all([
        hydrateReservationPageData(),
        hydrateRecentMeasurementSnapshots(100),
      ]);

      if (isCancelled) {
        return;
      }

      const feedbackEntries = Object.values(hydratedData.feedbackByReservationId);
      const actualMeasurements = getActualMeasurementSnapshots(
        hydratedMeasurements,
        measurementSnapshot,
      );
      const averageRating = getAverageFeedbackRating(feedbackEntries);
      const savedListCount = loadRestaurantBookmarks().length;

      setFavoriteChefs(deriveFavoriteChefs(hydratedData.reservations));
      setStats(
        deriveProfileStats(
          actualMeasurements,
          feedbackEntries.length,
          savedListCount,
          averageRating,
        ),
      );
    })();

    return () => {
      isCancelled = true;
    };
  }, [measurementSnapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSavedListCount = () => {
      const savedListCount = loadRestaurantBookmarks().length;

      setStats((currentStats) =>
        currentStats.map((stat) =>
          stat.label === '테이스트 리스트'
            ? { ...stat, value: `${savedListCount}곳` }
            : stat,
        ),
      );
    };

    window.addEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncSavedListCount);
    window.addEventListener('storage', syncSavedListCount);

    return () => {
      window.removeEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncSavedListCount);
      window.removeEventListener('storage', syncSavedListCount);
    };
  }, []);

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
      const selectedProfileActionDisabled =
        updatingConnectionId === selectedConnectionProfile.id ||
        (selectedConnectionProfile.isFriend ? !onRemoveFriend : !onAddFriend);
      const selectedProfileActionLabel = selectedConnectionProfile.isFriend
        ? updatingConnectionId === selectedConnectionProfile.id
          ? '취소 중'
          : '팔로잉'
        : updatingConnectionId === selectedConnectionProfile.id
          ? '추가 중'
          : '팔로우';
      const selectedProfileStats = deriveProfileStatsFromCounts({
        averageRating: selectedConnectionProfile.activitySummary?.averageRating ?? null,
        feedbackCount: selectedConnectionProfile.activitySummary?.feedbackCount ?? 0,
        listLabel: '다이닝 기록',
        listValue: `${selectedConnectionProfile.activitySummary?.reservationCount ?? 0}회`,
        measurementCount:
          selectedConnectionProfile.activitySummary?.measurementCount ??
          (selectedProfileSnapshot ? 1 : 0),
        savedListCount: selectedConnectionProfile.activitySummary?.savedRestaurantCount ?? 0,
      });
      const selectedFavoriteChefs = selectedConnectionProfile.favoriteChefs ?? [];

      return (
        <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="tb-section-stack px-5 pb-20 pt-5 animate-fadeIn">
              <div className="tb-card-stack">
                <div className="rounded-[20px] bg-white p-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <PalateBloomAvatar
                        ariaLabel={selectedProfileName}
                        imageSrc={selectedProfileAvatarSrc}
                        profile={selectedProfileBloom}
                        shapeSeed={`${selectedConnectionProfile.id}|${selectedProfileSnapshot?.measuredAt ?? 'no-measurement'}`}
                        size="lg"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                          {selectedProfileName}
                        </span>
                        <span className="truncate text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          {selectedProfileNickname}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex min-w-[64px] flex-col rounded-[8px] text-left">
                        <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {formatSocialCount(selectedConnectionProfile.followerCount)}
                        </span>
                        <span className="text-[12px] text-[var(--tb-color-text-muted)]">팔로워</span>
                      </div>
                      <div className="flex min-w-[64px] flex-col rounded-[8px] text-left">
                        <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {formatSocialCount(selectedConnectionProfile.followingCount)}
                        </span>
                        <span className="text-[12px] text-[var(--tb-color-text-muted)]">팔로잉</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleToggleConnectionFriend(selectedConnectionProfile)}
                        disabled={selectedProfileActionDisabled}
                        className={
                          selectedConnectionProfile.isFriend
                            ? 'ml-auto flex h-9 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)] disabled:opacity-55'
                            : 'ml-auto flex h-9 items-center justify-center rounded-full px-3 text-[12px] font-semibold transition-[filter,opacity] hover:brightness-[0.98] disabled:opacity-55'
                        }
                        style={
                          selectedConnectionProfile.isFriend
                            ? undefined
                            : {
                              background: 'var(--tb-user-accent-tint-surface, var(--tb-taste-sweet-bg))',
                              color: 'var(--tb-user-accent-dark, var(--tb-taste-sweet-dark))',
                            }
                        }
                      >
                        {selectedProfileActionLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <PageSection title="활동 요약" titleSize="md">
                <div className="grid grid-cols-2 gap-3">
                  {selectedProfileStats.map((stat) => (
                    <SummaryMetricCard
                      key={stat.label}
                      color={stat.color}
                      icon={stat.icon}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div>
              </PageSection>

              <PageSection title="즐겨찾기 셰프" titleSize="md">
                <div className="flex flex-col gap-3">
                  {selectedFavoriteChefs.length === 0 ? (
                    <div className="rounded-[20px] bg-white px-4 py-5 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                      아직 공개된 즐겨찾기 셰프 흐름이 없습니다.
                    </div>
                  ) : null}
                  {selectedFavoriteChefs.map((chef, index) => (
                    <CompactCard
                      key={index}
                      onClick={() => {
                        if (onOpenRestaurantDetail) {
                          onOpenRestaurantDetail(chef);
                          return;
                        }

                        onNavigateToReservation?.(chef.name);
                      }}
                      media={
                        <ChefAvatar
                          alt={chef.name}
                          className="h-[40px] w-[40px] rounded-[10px]"
                          iconSize={ICON_TOKENS.size.lg}
                          imageSrc={resolvePublicMediaPath(chef.image) ?? chef.image}
                          taste={chef.taste}
                          variant="neutral"
                        />
                      }
                      heading={formatChefName(chef.name)}
                      metadata={chef.restaurant}
                      headingClassName="font-semibold"
                      metadataClassName="font-normal"
                      actions={
                        <span className="flex items-center gap-3">
                          <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{chef.matchRate}%</span>
                          <ChevronRight
                            size={CARD_TRAILING_ICON_SIZE}
                            className="text-[var(--tb-color-icon-muted)]"
                          />
                        </span>
                      }
                    />
                  ))}
                </div>
              </PageSection>

              <div className="h-6" />
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
              <div className="rounded-[20px] bg-white p-4 text-[13px] font-semibold text-[var(--tb-color-text-muted)]">
                {connectionTitle} 목록을 불러오고 있어요.
              </div>
            ) : null}

            {connectionStatus !== 'loading' && connectionProfiles.length === 0 ? (
              <div className="rounded-[20px] bg-white p-4">
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
        <div className="tb-section-stack px-5 pb-20 pt-5 animate-fadeIn">
          <div className="tb-card-stack">
            <div className="relative rounded-[20px] bg-white p-3">
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
                <div className="flex items-center gap-4 pr-12">
                  <PalateBloomAvatar
                    ariaLabel={displayName}
                    imageSrc={profileIdentity?.avatarImageDataUrl}
                    profile={palateBloomProfile}
                    shapeSeed={palateBloomShapeSeed}
                    size="lg"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[16px] font-bold text-[var(--tb-color-text-primary)]">{displayName}</span>
                    <span className="truncate text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                      {nicknameLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openConnectionView('followers')}
                    className="flex min-w-[64px] flex-col rounded-[8px] text-left transition-colors]"
                  >
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followerCount)}
                    </span>
                    <span className="text-[12px] text-[var(--tb-color-text-muted)]">팔로워</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openConnectionView('following')}
                    className="flex min-w-[64px] flex-col rounded-[8px] text-left transition-colors]"
                  >
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followingCount)}
                    </span>
                    <span className="text-[12px] text-[var(--tb-color-text-muted)]">팔로잉</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenProfileSettings}
                    className="ml-auto flex h-9 items-center gap-2 rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                  >
                    <UserPlus size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                    <span>버디 찾기</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <PageSection title="활동 요약" titleSize="md">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <SummaryMetricCard
                  key={stat.label}
                  color={stat.color}
                  icon={stat.icon}
                  label={stat.label}
                  onClick={stat.label === '테이스트 리스트' ? onOpenSavedList : undefined}
                  value={stat.value}
                />
              ))}
            </div>
          </PageSection>

          <PageSection title="즐겨찾기 셰프" titleSize="md">
            <div className="flex flex-col gap-3">
              {favoriteChefs.map((chef, index) => (
                <CompactCard
                  key={index}
                  onClick={() => {
                    if (onOpenRestaurantDetail) {
                      onOpenRestaurantDetail(chef);
                      return;
                    }

                    onNavigateToReservation?.(chef.name);
                  }}
                  media={
                    <ChefAvatar
                      alt={chef.name}
                      className="h-[40px] w-[40px] rounded-[10px]"
                      iconSize={ICON_TOKENS.size.lg}
                      imageSrc={resolvePublicMediaPath(chef.image) ?? chef.image}
                      taste={chef.taste}
                      variant="neutral"
                    />
                  }
                  heading={formatChefName(chef.name)}
                  metadata={chef.restaurant}
                  headingClassName="font-semibold"
                  metadataClassName="font-normal"
                  actions={
                    <span className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{chef.matchRate}%</span>
                      <ChevronRight
                        size={CARD_TRAILING_ICON_SIZE}
                        className="text-[var(--tb-color-icon-muted)]"
                      />
                    </span>
                  }
                />
              ))}
            </div>
          </PageSection>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
