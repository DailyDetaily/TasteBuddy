import { useEffect, useState } from 'react';
import {
  SettingsRegular, ChevronRightRegular, BluetoothRegular, Battery5Regular,
  ArrowSyncRegular, AlertRegular, QuestionCircleRegular, InfoRegular,
  TrophyRegular, ChatRegular, CalendarRegular, StarRegular
} from '@fluentui/react-icons';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, className, ...props }: any) => (
    <IconComponent {...props} className={className} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const Settings = wrapIcon(SettingsRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);
const Bluetooth = wrapIcon(BluetoothRegular);
const Battery = wrapIcon(Battery5Regular);
const RefreshCw = wrapIcon(ArrowSyncRegular);
const Bell = wrapIcon(AlertRegular);
const HelpCircle = wrapIcon(QuestionCircleRegular);
const Info = wrapIcon(InfoRegular);
const Award = wrapIcon(TrophyRegular);
const MessageCircle = wrapIcon(ChatRegular);
const Calendar = wrapIcon(CalendarRegular);
const Star = wrapIcon(StarRegular);
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import OutlineBadge from '../components/system/OutlineBadge';
import SectionTitle from '../components/system/SectionTitle';
import {
  type ReservationRecord,
} from '../constants/reservationCatalog';
import { getTasteColor } from '../constants/tasteColors';
import {
  formatMeasurementDate,
  formatMeasurementValue,
  getAverageMeasurementMm,
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  getTasteProfileBadge,
  isTasteMeasurementStale,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { hydrateReservationPageData } from '../lib/tasteBuddySupabase';

interface ProfileStat {
  color: string;
  icon: React.ElementType;
  label: string;
  value: string;
}

interface FavoriteChef {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
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

// 설정 메뉴
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
  onStartMeasurement: () => void;
  onNavigateToReservation?: (chefName: string) => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function ProfilePage({
  measurementSnapshot,
  onStartMeasurement,
  onNavigateToReservation,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: ProfilePageProps) {
  const myTasteEntries = getTasteMeasurementEntries(measurementSnapshot);
  const myTaste = myTasteEntries.map((entry) => ({
    maxValue: 10,
    taste: entry.label,
    value: entry.valueMm,
    qualitative: entry.valueMm >= entry.averageMm + 0.5
      ? '반응 빠름'
      : entry.valueMm <= entry.averageMm - 0.5
        ? '부드럽게 반응'
        : '균형적',
  }));
  const averageMeasurement = getAverageMeasurementMm(measurementSnapshot);
  const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
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
      <TopAppBar onStartMeasurement={onStartMeasurement} onOpenNotifications={onOpenNotifications} onOpenMenu={onOpenMenu} hasUnreadNotifications={hasUnreadNotifications} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-8 p-5 animate-fadeIn">

          {/* 프로필 헤더 */}
          <div className="flex items-center gap-4">
            <div className="relative rounded-full size-[64px]">
              <div className="flex items-center justify-center rounded-full size-[64px] bg-[var(--tb-taste-sweet-bg)]">
                <span className="text-[24px] font-bold text-[var(--tb-color-text-primary)]">JH</span>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-full border border-[var(--tb-color-border-avatar-soft)]" />
            </div>
            <div className="flex flex-col gap-[2px]">
              <span className="text-[20px] font-bold text-[var(--tb-color-text-primary)]">신준호</span>
                <div className="flex items-center gap-2">
                  <OutlineBadge>{tasteProfileBadge}</OutlineBadge>
                  <span className="text-[12px] text-[var(--tb-color-text-muted)]">
                    {averageMeasurement > 5 ? '평균보다 민감한 프로필' : '균형 잡힌 프로필'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--tb-color-text-hint)] mt-[2px]">이 프로필은 다이닝 경험을 통해 더 정교해져요</p>
            </div>
            <div className="ml-auto">
              <button onClick={() => {
                const settingsEl = document.getElementById('profile-settings');
                settingsEl?.scrollIntoView({ behavior: 'smooth' });
              }} className="rounded-full p-2 transition-colors hover:bg-[var(--tb-color-surface-card)]">
                <Settings size={20} className="text-[var(--tb-color-icon-primary)]" />
              </button>
            </div>
          </div>

          {/* 테이스틱 기기 상태 */}
          <SectionCard>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)]">
                  <span className="text-[10px] font-bold text-[var(--tb-color-text-primary)]">TB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">테이스틱</span>
                  <span className="text-[11px] text-[var(--tb-color-text-muted)]">Teastick Pro</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Bluetooth size={14} className="text-[var(--tb-color-icon-primary)]" />
                  <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">연결됨</span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery size={14} className="text-[var(--tb-color-icon-primary)]" />
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
            title={needsMeasurementRefresh ? '미각 재측정이 필요해 보여요' : '프로필을 한 번 더 점검할 수 있어요'}
            description={
              needsMeasurementRefresh
                ? `${measurementAgeLabel} 상태예요. 최신 데이터로 갱신하면 추천과 보정 정확도가 더 좋아져요.`
                : '입맛이 달라졌다면 지금 다시 측정해서 내 프로필을 더 정확하게 유지할 수 있어요.'
            }
            meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
            actionLabel={needsMeasurementRefresh ? '재측정' : '다시 측정'}
            onAction={onStartMeasurement}
            tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
          />

          {/* 나의 미각 수치 */}
          <div>
            <SectionTitle className="mb-3">나의 미각</SectionTitle>
            <SectionCard>
              <div className="flex flex-col gap-3 w-full">
                {myTaste.map((item, idx) => {
                  const color = getTasteColor(item.taste);
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full">
                      <span className="w-[42px] text-[12px] font-medium text-[var(--tb-color-text-primary)]">{item.taste}</span>
                      <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[var(--tb-color-border-subtle)]">
                        <div
                          className="h-full rounded-full transition-all duration-700 animate-grow"
                          style={{
                            width: `${(item.value / item.maxValue) * 100}%`,
                            backgroundColor: color,
                            animationDelay: `${idx * 100}ms`,
                            animationFillMode: 'both',
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold w-[72px] text-right" style={{ color }}>
                        {item.qualitative}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* 활동 요약 */}
          <div>
            <SectionTitle className="mb-3">활동 요약</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <SectionCard key={idx}>
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="shrink-0 w-[40px] h-[40px] rounded-[10px] flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon size={18} strokeWidth={1.5} style={{ color: stat.color }} />
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
          </div>

          {/* 즐겨찾기 셰프 */}
          <div>
            <SectionTitle className="mb-3">즐겨찾기 셰프</SectionTitle>
            <div className="flex flex-col gap-3">
              {favoriteChefs.map((chef, idx) => (
                <SectionCard key={idx} onClick={() => onNavigateToReservation?.(chef.name)}>
                  <div className="flex items-center gap-3 w-full">
                    {chef.image ? (
                      <img
                        src={chef.image}
                        alt={chef.name}
                        className="w-[40px] h-[40px] rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[var(--tb-color-surface-muted)] text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                        {chef.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{formatChefName(chef.name)}</span>
                      <span className="text-[11px] text-[var(--tb-color-text-muted)]">{chef.restaurant}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">{chef.matchRate}%</span>
                    <ChevronRight size={16} className="text-[var(--tb-color-icon-muted)]" />
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>

          {/* 설정 */}
          {settingsSections.map((section, sIdx) => (
            <div key={sIdx} id={sIdx === 0 ? 'profile-settings' : undefined}>
              <SectionTitle className="mb-3">{section.title}</SectionTitle>
              <div className="flex flex-col gap-3">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <SectionCard key={idx} onClick={
                      item.label === '미각 재측정' ? onStartMeasurement : undefined
                    }>
                      <div className="flex items-center gap-3 w-full">
                        <Icon size={18} className="shrink-0 text-[var(--tb-color-icon-primary)]" />
                        <div className="flex flex-col flex-1">
                          <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{item.label}</span>
                          <span className="text-[11px] text-[var(--tb-color-text-muted)]">{item.desc}</span>
                        </div>
                        <ChevronRight size={16} className="text-[var(--tb-color-icon-muted)]" />
                      </div>
                    </SectionCard>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
