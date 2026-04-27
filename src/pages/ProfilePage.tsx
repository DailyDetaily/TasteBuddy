import { useEffect, useState } from 'react';
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
  Star as StarIcon
} from 'lucide-react';
import React from 'react';

import type { AppMenuSupportPanel } from '../components/AppMenuDrawer';
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';

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
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;

import SectionCard from '../components/SectionCard';
import ChefAvatar from '../components/system/ChefAvatar';
import OutlineBadge from '../components/system/OutlineBadge';
import PageSection from '../components/system/PageSection';
import TasteChip from '../components/system/TasteChip';
import { ICON_TOKENS } from '../constants/designTokens';
import { type ReservationRecord } from '../constants/reservationCatalog';
import { getTasteColor } from '../constants/tasteColors';
import {
  formatMeasurementDate,
  formatMeasurementValue,
  getAverageMeasurementMm,
  getStrongestTasteMeasurement,
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  getTasteProfileBadge,
  isBroadStarterMeasurementSnapshot,
  isTasteMeasurementStale,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  getStarterAxisDisplayLabel,
  type RestaurantReadyGuidance,
} from '../constants/quickTasteCalibrationData';
import { hydrateReservationPageData } from '../lib/tasteBuddySupabase';

interface ProfileStat {
  color: string;
  icon: React.ElementType;
  label: string;
  value: string;
}

export interface FavoriteChef {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
  taste: string;
}

function formatChefName(name: string) {
  return name.endsWith('셰프') ? name : `${name} 셰프`;
}

function parseReservationDisplayDate(dateText: string) {
  const [year, month, day] = dateText.split('.');
  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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
  reservations: ReservationRecord[],
  feedbackCount: number,
  averageRating: number | null,
): ProfileStat[] {
  const reservationCount = reservations.length;
  const reservationDates = reservations
    .map((reservation) => parseReservationDisplayDate(reservation.date))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => left.getTime() - right.getTime());
  const firstReservationDate = reservationDates[0] ?? null;
  const usageMonths = firstReservationDate
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - firstReservationDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      )
    : 0;

  return [
    {
      label: 'TCS 보정',
      value: `${reservationCount}회`,
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
      value: usageMonths > 0 ? `${usageMonths}개월` : '-',
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
  onOpenSupportPanel?: (panel: AppMenuSupportPanel) => void;
  onStartMeasurement: () => void;
  onNavigateToReservation?: (chefName: string) => void;
  onOpenRestaurantDetail?: (chef: FavoriteChef) => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function ProfilePage({
  measurementSnapshot,
  starterGuidance = null,
  onOpenSupportPanel,
  onStartMeasurement,
  onNavigateToReservation,
  onOpenRestaurantDetail,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: ProfilePageProps) {
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const myTasteEntries = getTasteMeasurementEntries(measurementSnapshot);
  const myTaste = myTasteEntries.map((entry) => ({
    maxValue: 10,
    taste: entry.label,
    value: entry.valueMm,
    qualitative:
      isBroadStarterProfile
        ? getStarterAxisDisplayLabel(entry.valueMm)
        : entry.valueMm >= entry.averageMm + 0.5
          ? '반응 빠름'
          : entry.valueMm <= entry.averageMm - 0.5
            ? '부드럽게 반응'
            : '균형적',
  }));
  const averageMeasurement = getAverageMeasurementMm(measurementSnapshot);
  const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const remeasurementAccentTaste = getStrongestTasteMeasurement(measurementSnapshot).label;
  const [favoriteChefs, setFavoriteChefs] = useState<FavoriteChef[]>([]);
  const [stats, setStats] = useState<ProfileStat[]>(() => deriveProfileStats([], 0, null));

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const hydratedData = await hydrateReservationPageData();

      if (isCancelled) {
        return;
      }

      const feedbackEntries = Object.values(hydratedData.feedbackByReservationId);
      const averageRating =
        feedbackEntries.length > 0
          ? feedbackEntries.reduce((sum, feedback) => sum + feedback.overallRating, 0) /
            feedbackEntries.length
          : null;

      setFavoriteChefs(deriveFavoriteChefs(hydratedData.reservations));
      setStats(
        deriveProfileStats(
          hydratedData.reservations,
          feedbackEntries.length,
          averageRating,
        ),
      );
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-20 pt-5 animate-fadeIn">
          <div className="tb-card-stack">
            <div className="flex items-center gap-4">
              <div className="relative rounded-full size-[64px]">
                <div className="flex items-center justify-center rounded-full size-[64px] bg-[var(--tb-taste-sweet-bg)]">
                  <span className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">JH</span>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--tb-color-border-avatar-soft)]" />
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">신준호</span>
                <div className="flex items-center gap-2">
                  <OutlineBadge>{isBroadStarterProfile ? 'Starter Profile' : tasteProfileBadge}</OutlineBadge>
                  <span className="text-[12px] text-[var(--tb-color-text-muted)]">
                    {isBroadStarterProfile
                      ? '일반 식당에서도 바로 쓰는 질문 기반 시작 프로필'
                      : averageMeasurement > 5
                        ? '평균보다 민감한 프로필'
                        : '균형 잡힌 프로필'}
                  </span>
                </div>
                <p className="mt-[2px] text-[11px] text-[var(--tb-color-text-hint)]">
                  이 프로필은 다이닝 경험을 통해 더 정교해져요
                </p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => {
                    const settingsEl = document.getElementById('profile-settings');
                    settingsEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-card)]"
                  style={{
                    width: ICON_TOKENS.container.lg,
                    height: ICON_TOKENS.container.lg,
                  }}
                >
                  <Settings size={ICON_TOKENS.size.lg} className="text-[var(--tb-color-icon-primary)]" />
                </button>
              </div>
            </div>

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

            <TasteMeasurementMiniCta
              accentTaste={remeasurementAccentTaste}
              title={
                needsMeasurementRefresh
                  ? isBroadStarterProfile
                    ? '스타터 프로필을 더 정교하게 만들 수 있어요'
                    : '미각 갱신 추천'
                  : '현재 프로필 반영 완료'
              }
              actionFullWidth={!needsMeasurementRefresh}
              padding={needsMeasurementRefresh ? 'default' : 'compact'}
              description={
                needsMeasurementRefresh
                  ? isBroadStarterProfile
                    ? `${measurementAgeLabel} 질문 기반 스타터 프로필이에요. 다시 점검하거나 식사 기록이 쌓이면 메뉴 추천과 매장 전달 포인트가 더 자연스러워집니다.`
                    : `${measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 더 정밀해집니다.`
                  : isBroadStarterProfile
                    ? '질문 기반 시작 프로필이 반영되어 있어요. 식사 기록이 쌓일수록 더 정교해집니다.'
                    : '가장 최근 입맛 상태가 반영되어 있습니다. 다시 측정할 수도 있어요.'
              }
              meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
              actionLabel={needsMeasurementRefresh ? '프로필 업데이트' : '다시 측정'}
              onAction={onStartMeasurement}
              tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
            />

            {starterGuidance ? (
              <SectionCard hoverEffect={false}>
                <div className="flex flex-col gap-3 w-full">
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                      {starterGuidance.surfaceLabel}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      {starterGuidance.summaryLine}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {starterGuidance.topLabels.map((label) => (
                      <TasteChip key={label} taste={label} value="잘 맞는 쪽" />
                    ))}
                    <TasteChip taste={starterGuidance.cautionLabel} value="조심할 포인트" />
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>

          <PageSection title={isBroadStarterProfile ? '지금 잘 받는 맛 강도' : '나의 미각'}>
            <SectionCard>
              <div className="flex flex-col gap-3 w-full">
                {myTaste.map((item, index) => {
                  const color = getTasteColor(item.taste);
                  return (
                    <div key={item.taste} className="flex items-center gap-3 w-full">
                      <span className="w-[42px] text-[12px] font-medium text-[var(--tb-color-text-primary)]">
                        {item.taste}
                      </span>
                      <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[var(--tb-color-border-subtle)]">
                        <div
                          className="h-full rounded-full transition-all duration-700 animate-grow"
                          style={{
                            width: `${(item.value / item.maxValue) * 100}%`,
                            backgroundColor: color,
                            animationDelay: `${index * 100}ms`,
                            animationFillMode: 'both',
                          }}
                        />
                      </div>
                      <span className="w-[72px] text-right text-[12px] font-semibold" style={{ color }}>
                        {item.qualitative}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </PageSection>

          <PageSection title="활동 요약">
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

          <PageSection title="즐겨찾기 셰프">
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

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
