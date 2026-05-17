import { type CSSProperties, useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon,
  Bluetooth as BluetoothIcon,
  BatteryFull as BatteryFullIcon,
  RefreshCw as RefreshCwIcon,
  Bell as BellIcon,
  CircleHelp as CircleHelpIcon,
  Info as InfoIcon,
  Trophy as TrophyIcon,
  MessageCircle as MessageCircleIcon,
  Calendar as CalendarIcon,
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
const ChevronRight = wrapIcon(ChevronRightIcon);
const Bluetooth = wrapIcon(BluetoothIcon);
const Battery = wrapIcon(BatteryFullIcon);
const RefreshCw = wrapIcon(RefreshCwIcon);
const Bell = wrapIcon(BellIcon);
const HelpCircle = wrapIcon(CircleHelpIcon);
const Info = wrapIcon(InfoIcon);
const Award = wrapIcon(TrophyIcon);
const MessageCircle = wrapIcon(MessageCircleIcon);
const Calendar = wrapIcon(CalendarIcon);
const Star = wrapIcon(StarIcon);
const UserPlus = wrapIcon(UserPlusIcon);
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;

import SectionCard from '../components/SectionCard';
import ChefAvatar from '../components/system/ChefAvatar';
import OutlineBadge from '../components/system/OutlineBadge';
import PageSection from '../components/system/PageSection';
import { ICON_TOKENS } from '../constants/designTokens';
import { type ReservationRecord } from '../constants/reservationCatalog';
import { type DiningFeedbackDraft } from '../constants/diningFeedbackData';
import {
  formatMeasurementDate,
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

interface ProfileStat {
  color: string;
  icon: React.ElementType;
  label: string;
  value: string;
}

export interface ProfileIdentityData {
  avatarImageDataUrl?: string | null;
  avatarStyle?: CSSProperties;
  displayName?: string | null;
  friendCount?: number;
  followerCount?: number;
  followingCount?: number;
  initials?: string | null;
  nickname?: string | null;
}

export interface FavoriteChef {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
  taste: string;
}

const DEFAULT_PROFILE_IDENTITY: Required<Pick<ProfileIdentityData, 'displayName' | 'followerCount' | 'followingCount' | 'initials'>> = {
  displayName: 'Taste Buddy Guest',
  followerCount: 0,
  followingCount: 0,
  initials: 'TB',
};
const DEFAULT_AVATAR_STYLE: CSSProperties = {
  background:
    'radial-gradient(circle at 28% 24%, rgba(255, 153, 0, 0.52), transparent 45%), radial-gradient(circle at 72% 76%, rgba(179, 114, 180, 0.38), transparent 44%), var(--tb-color-surface-muted)',
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
  averageRating: number | null,
): ProfileStat[] {
  const measurementDates = measurementSnapshots
    .map((snapshot) => new Date(snapshot.measuredAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());
  const firstMeasurementDate = measurementDates[0] ?? null;
  const usagePeriodLabel = formatUsagePeriod(firstMeasurementDate);

  return [
    {
      label: 'TCS 보정',
      value: `${measurementSnapshots.length}회`,
      icon: Award,
      color: '#FF9900',
    },
    {
      label: '피드백',
      value: `${feedbackCount}건`,
      icon: MessageCircle,
      color: '#B372B4',
    },
    {
      label: '이용 기간',
      value: usagePeriodLabel,
      icon: Calendar,
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

function formatUsagePeriod(startDate: Date | null) {
  if (!startDate) {
    return '-';
  }

  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (elapsedDays === 0) {
    return '오늘';
  }

  if (elapsedDays < 30) {
    return `${elapsedDays}일`;
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);

  if (elapsedMonths < 12) {
    return `${elapsedMonths}개월`;
  }

  const years = Math.floor(elapsedMonths / 12);
  const months = elapsedMonths % 12;

  return months > 0 ? `${years}년 ${months}개월` : `${years}년`;
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

const settingsSections = [
  {
    title: '미각 관리',
    items: [
      { label: '미각 재측정', icon: RefreshCw, desc: '테이스틱으로 미각 민감도 다시 측정' },
      { label: '보정 알림 설정', icon: Bell, desc: '다이닝 전 미각 측정 알림' },
    ],
  },
  {
    title: '앱 정보',
    items: [
      { label: '도움말', icon: HelpCircle, desc: 'TCS 사용 가이드' },
      { label: '앱 정보', icon: Info, desc: 'TasteBuddy v1.0.0' },
    ],
  },
];

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
  hasUnreadNotifications?: boolean;
}

export default function ProfilePage({
  measurementSnapshot,
  starterGuidance = null,
  profileIdentity,
  onOpenSupportPanel,
  onStartMeasurement,
  onNavigateToReservation,
  onOpenRestaurantDetail,
  onOpenNotifications,
  onOpenMenu,
  onOpenProfileSettings,
  hasUnreadNotifications,
}: ProfilePageProps) {
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const averageMeasurement = getAverageMeasurementMm(measurementSnapshot);
  const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);
  const displayName = profileIdentity?.displayName?.trim() || DEFAULT_PROFILE_IDENTITY.displayName;
  const nickname = profileIdentity?.nickname?.trim() ?? '';
  const nicknameLabel = nickname ? `@${nickname}` : '닉네임 미설정';
  const initials = profileIdentity?.initials?.trim() || DEFAULT_PROFILE_IDENTITY.initials;
  const followerCount = profileIdentity?.followerCount ?? DEFAULT_PROFILE_IDENTITY.followerCount;
  const followingCount = profileIdentity?.followingCount ?? DEFAULT_PROFILE_IDENTITY.followingCount;
  const friendCount = profileIdentity?.friendCount ?? 0;
  const avatarStyle = profileIdentity?.avatarStyle ?? DEFAULT_AVATAR_STYLE;
  const [favoriteChefs, setFavoriteChefs] = useState<FavoriteChef[]>([]);
  const [stats, setStats] = useState<ProfileStat[]>(() => deriveProfileStats([measurementSnapshot], 0, null));

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

      setFavoriteChefs(deriveFavoriteChefs(hydratedData.reservations));
      setStats(
        deriveProfileStats(
          actualMeasurements,
          feedbackEntries.length,
          averageRating,
        ),
      );
    })();

    return () => {
      isCancelled = true;
    };
  }, [measurementSnapshot]);

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
                  <div className="relative rounded-full p-[2px]">
                    <div
                      className="flex size-[68px] items-center justify-center overflow-hidden rounded-full"
                      style={profileIdentity?.avatarImageDataUrl ? undefined : avatarStyle}
                    >
                      {profileIdentity?.avatarImageDataUrl ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          src={profileIdentity.avatarImageDataUrl}
                        />
                      ) : (
                        <span className="text-[18px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--tb-color-border-avatar-soft)]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="truncate text-[18px] font-bold text-[var(--tb-color-text-primary)]">{displayName}</span>
                    <span className="truncate text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                      {nicknameLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex min-w-[64px] flex-col">
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followerCount)}
                    </span>
                    <span className="text-[11px] text-[var(--tb-color-text-muted)]">팔로워</span>
                  </div>
                  <div className="flex min-w-[64px] flex-col">
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(followingCount)}
                    </span>
                    <span className="text-[11px] text-[var(--tb-color-text-muted)]">팔로잉</span>
                  </div>
                  <div className="flex min-w-[64px] flex-col">
                    <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      {formatSocialCount(friendCount)}
                    </span>
                    <span className="text-[11px] text-[var(--tb-color-text-muted)]">친구</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenProfileSettings}
                    className="ml-auto flex h-9 items-center gap-2 rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                  >
                    <UserPlus size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                    <span>친구 찾기</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <PageSection title="활동 요약" titleSize="md">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <SectionCard key={index}>
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px]"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon size={ICON_TOKENS.size.md} strokeWidth={1.5} style={{ color: stat.color }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[var(--tb-color-text-muted)]">{stat.label}</span>
                        <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{stat.value}</span>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </PageSection>

          <PageSection title="즐겨찾기 셰프" titleSize="md">
            <div className="flex flex-col gap-3">
              {favoriteChefs.map((chef, index) => (
                <SectionCard
                  key={index}
                  onClick={() => {
                    if (onOpenRestaurantDetail) {
                      onOpenRestaurantDetail(chef);
                      return;
                    }

                    onNavigateToReservation?.(chef.name);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <ChefAvatar
                      alt={chef.name}
                      className="h-[40px] w-[40px] rounded-[10px]"
                      iconSize={ICON_TOKENS.size.lg}
                      imageSrc={chef.image}
                      taste={chef.taste}
                      variant="neutral"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                        {formatChefName(chef.name)}
                      </span>
                      <span className="text-[11px] text-[var(--tb-color-text-muted)]">{chef.restaurant}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{chef.matchRate}%</span>
                    <ChevronRight
                      size={CARD_TRAILING_ICON_SIZE}
                      className="text-[var(--tb-color-icon-muted)]"
                    />
                  </div>
                </SectionCard>
              ))}
            </div>
          </PageSection>

          {settingsSections.map((section, sectionIndex) => (
            <PageSection
              key={section.title}
              id={sectionIndex === 0 ? 'profile-settings' : undefined}
              title={section.title}
              titleSize="md"
            >
              <div className="flex flex-col gap-3">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const onClick =
                    item.label === '미각 재측정'
                      ? onStartMeasurement
                      : item.label === '보정 알림 설정'
                        ? () => onOpenSupportPanel?.('notification-settings')
                        : item.label === '도움말'
                          ? () => onOpenSupportPanel?.('help')
                          : item.label === '앱 정보'
                            ? () => onOpenSupportPanel?.('about')
                            : undefined;

                  return (
                    <SectionCard
                      key={item.label}
                      onClick={onClick}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon size={ICON_TOKENS.size.md} className="shrink-0 text-[var(--tb-color-icon-primary)]" />
                        <div className="flex flex-col flex-1">
                          <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[var(--tb-color-text-muted)]">{item.desc}</span>
                        </div>
                        <ChevronRight
                          size={CARD_TRAILING_ICON_SIZE}
                          className="text-[var(--tb-color-icon-muted)]"
                        />
                      </div>
                    </SectionCard>
                  );
                })}
              </div>
            </PageSection>
          ))}

          <SectionCard>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)]">
                  <span className="text-[10px] font-bold text-[var(--tb-color-text-primary)]">TB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">테이스틱</span>
                  <span className="text-[11px] text-[var(--tb-color-text-muted)]">Tastick Pro</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Bluetooth size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                  <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">연결됨</span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
                  <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">87%</span>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-[var(--tb-color-border-strong)]" />
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-[var(--tb-color-text-muted)]">마지막 측정</span>
              <span className="text-[12px] font-medium text-[var(--tb-color-text-primary)]">
                {formatMeasurementDate(measurementSnapshot.measuredAt)}
              </span>
            </div>
          </SectionCard>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
