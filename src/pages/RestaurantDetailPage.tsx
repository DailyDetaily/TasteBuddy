import { useEffect, useState } from 'react';
import {
  Ellipsis,
  Share,
} from 'lucide-react';

import TopAppBar from '../components/TopAppBar';
import PageSection from '../components/system/PageSection';
import RestaurantBookmarkSheet, {
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
  isRestaurantBookmarked,
} from '../components/restaurant/RestaurantBookmarkSheet';
import RestaurantHeroCard from '../components/restaurant/RestaurantHeroCard';
import RestaurantInfoCard from '../components/restaurant/RestaurantInfoCard';
import RestaurantMemorableDishCard from '../components/restaurant/RestaurantMemorableDishCard';
import RestaurantScoreSummaryCard, {
  type RestaurantScoreTag,
} from '../components/restaurant/RestaurantScoreSummaryCard';
import { ICON_TOKENS } from '../constants/designTokens';
import { getChefImageByName } from '../constants/chefImages';
import type { HomeChefMatchCardData } from '../components/home/HomeCards';
import type { HomeSearchResult } from '../components/home/HomeUnifiedSearch';
import type { RealMenuRecommendationCardData } from '../components/analysis/RealMenuRecommendationCard';
import type { ReservationRecord } from '../constants/reservationCatalog';

export type RestaurantDetailViewModel = {
  id: string;
  category: string;
  chef: {
    avatarUrl?: string | null;
    name: string;
  };
  heroImageUrl?: string | null;
  info: {
    address: string;
    hours: string;
    instagram?: string;
    phone?: string;
    website?: string;
  };
  locationLabel: string;
  memorableDishes: {
    id: string;
    imageUrl?: string | null;
    summary: string;
    tags: string[];
    title: string;
  }[];
  name: string;
  scores: {
    overallScore: number;
    palateFriendsAverageScore: number;
    personalMatchRate: number;
  };
  summaryLine: string;
  tags: RestaurantScoreTag[];
};

const DEFAULT_RESTAURANT_DETAIL: RestaurantDetailViewModel = {
  id: 'restaurant-venu',
  name: '레스토랑 베누',
  category: '정제된 코스 다이닝',
  locationLabel: '서울 한남',
  heroImageUrl: getChefImageByName('황정인'),
  chef: {
    name: '황정인',
    avatarUrl: getChefImageByName('황정인'),
  },
  summaryLine: '당신의 입맛에 잘 맞을 가능성이 높은 정제된 코스 다이닝 레스토랑이에요.',
  scores: {
    personalMatchRate: 83,
    palateFriendsAverageScore: 78,
    overallScore: 4.6,
  },
  tags: [
    { id: 'clear-umami', label: '맑은 감칠맛', tasteAxis: 'umami', tone: 'taste' },
    { id: 'soft-fat', label: '부드러운 지방감', tasteAxis: 'fat', tone: 'taste' },
    { id: 'long-finish', label: '긴 여운', tone: 'neutral' },
    { id: 'anniversary', label: '기념일', tone: 'neutral' },
    { id: 'quiet-room', label: '조용한 공간', tone: 'neutral' },
    { id: 'course-dining', label: '코스 다이닝', tone: 'neutral' },
    { id: 'restrained-acidity', label: '절제된 산미', tasteAxis: 'sour', tone: 'taste' },
  ],
  memorableDishes: [
    {
      id: 'mushroom-broth',
      title: '버섯 브로스',
      imageUrl: null,
      tags: ['맑은 감칠맛', '긴 여운', '가벼운 마무리'],
      summary: '맑고 깊은 버섯의 풍미가 입안을 편안하게 열어줘요.',
    },
    {
      id: 'hanwoo-main',
      title: '한우 메인',
      imageUrl: null,
      tags: ['부드러운 지방감', '밀도감', '긴 여운'],
      summary: '부드럽고 농도 있는 한우의 풍미가 오래 남아요.',
    },
  ],
  info: {
    address: '서울 용산구 한남대로 91길 12',
    hours: '화-토 18:00-22:00, 일/월 휴무',
    website: 'restaurant-venu.kr',
    instagram: '@restaurant_venu',
    phone: '02-0000-8300',
  },
};

export function createRestaurantDetailFromChefMatch(
  chef: HomeChefMatchCardData,
): RestaurantDetailViewModel {
  const chefName = chef.chef.replace(/\s*셰프$/, '');
  const representativeDish =
    chef.representativeDishTitle && chef.representativeDishTitle !== '메뉴 미정'
      ? chef.representativeDishTitle
      : '시그니처 코스';

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    id: chef.restaurantSlug ?? `${chef.restaurant}-${chefName}`,
    name: chef.restaurant,
    heroImageUrl: chef.image ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: chefName,
      avatarUrl: chef.image ?? getChefImageByName(chefName),
    },
    scores: {
      ...DEFAULT_RESTAURANT_DETAIL.scores,
      personalMatchRate: Math.max(chef.match, DEFAULT_RESTAURANT_DETAIL.scores.personalMatchRate),
    },
    summaryLine:
      chef.matchReason ??
      `${chef.restaurant}은 현재 프로필에서 또렷한 감각 축이 코스의 중심 풍미와 자연스럽게 이어질 가능성이 높아요.`,
    memorableDishes: [
      {
        id: 'representative-dish',
        title: representativeDish,
        imageUrl: null,
        tags: ['맑은 감칠맛', '긴 여운', '가벼운 마무리'],
        summary: '현재 미각 기준에서 코스의 첫 인상을 차분하게 열어줄 가능성이 높아요.',
      },
      DEFAULT_RESTAURANT_DETAIL.memorableDishes[1],
    ],
  };
}

export function createRestaurantDetailFromSearchResult(
  result: HomeSearchResult,
): RestaurantDetailViewModel {
  const primaryDishTitle = result.type === 'menu' ? result.label : result.signatureItems[0];
  const chefName = result.chef.replace(/\s*셰프$/, '');

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    id: result.id,
    name: result.restaurant,
    heroImageUrl: result.image ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: chefName,
      avatarUrl: result.image ?? getChefImageByName(chefName),
    },
    summaryLine:
      result.type === 'restaurant'
        ? `${result.restaurant}은 현재 프로필 기준에서 메뉴의 감각 흐름을 차분히 읽어볼 만한 레스토랑이에요.`
        : result.type === 'chef'
          ? `${chefName} 셰프의 메뉴 구성은 현재 프로필에서 기억될 감각을 메뉴 단위로 확인하기 좋아요.`
          : `${result.label}이 어떤 감각으로 남을 가능성이 높은지 ${result.restaurant}의 흐름 안에서 살펴볼 수 있어요.`,
    memorableDishes: [
      {
        id: `${result.id}-primary`,
        title: primaryDishTitle || '시그니처 메뉴',
        imageUrl: null,
        tags: result.signatureItems.length > 0 ? result.signatureItems : ['맑은 감칠맛', '긴 여운'],
        summary: result.matchMeta || '현재 프로필과 연결되는 감각 포인트를 메뉴 단위로 다시 읽어볼 수 있어요.',
      },
      DEFAULT_RESTAURANT_DETAIL.memorableDishes[1],
    ],
  };
}

export function createRestaurantDetailFromMenuRecommendation(
  menu: RealMenuRecommendationCardData,
): RestaurantDetailViewModel {
  const chefName = menu.chef.replace(/\s*셰프$/, '');

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    id: `menu-${menu.id}`,
    name: menu.restaurant,
    heroImageUrl: getChefImageByName(chefName) ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: chefName,
      avatarUrl: getChefImageByName(chefName),
    },
    scores: {
      ...DEFAULT_RESTAURANT_DETAIL.scores,
      personalMatchRate: menu.fitScore,
    },
    summaryLine: `${menu.restaurant}에서는 ${menu.title}처럼 현재 프로필에 맞는 감각 흐름을 메뉴 단위로 읽어볼 수 있어요.`,
    memorableDishes: [
      {
        id: menu.id,
        title: menu.title,
        imageUrl: null,
        tags: [menu.tasteLabel, menu.courseLabel, ...menu.ingredients].slice(0, 3),
        summary: menu.reason,
      },
      DEFAULT_RESTAURANT_DETAIL.memorableDishes[0],
    ],
  };
}

export function createRestaurantDetailFromFavoriteChef({
  image,
  matchRate,
  name,
  restaurant,
  taste,
}: {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
  taste: string;
}): RestaurantDetailViewModel {
  const chefName = name.replace(/\s*셰프$/, '');

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    id: `favorite-${restaurant}-${chefName}`,
    name: restaurant,
    heroImageUrl: image ?? getChefImageByName(chefName) ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: chefName,
      avatarUrl: image ?? getChefImageByName(chefName),
    },
    scores: {
      ...DEFAULT_RESTAURANT_DETAIL.scores,
      personalMatchRate: Math.max(matchRate, DEFAULT_RESTAURANT_DETAIL.scores.personalMatchRate),
    },
    summaryLine: `${chefName} 셰프의 ${restaurant}은 내 프로필에서 ${taste} 흐름이 어떻게 기억될지 살펴보기 좋은 후보예요.`,
    tags: [
      { id: 'favorite-taste', label: taste, tone: 'neutral' },
      ...DEFAULT_RESTAURANT_DETAIL.tags.filter((tag) => tag.id !== 'clear-umami').slice(0, 5),
    ],
  };
}

export function createRestaurantDetailFromReservation(
  reservation: ReservationRecord,
): RestaurantDetailViewModel {
  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    id: `reservation-${reservation.id}`,
    name: reservation.restaurant,
    heroImageUrl: reservation.chefImage ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: reservation.chef,
      avatarUrl: reservation.chefImage,
    },
    category: reservation.course,
    scores: {
      ...DEFAULT_RESTAURANT_DETAIL.scores,
      personalMatchRate: Math.max(reservation.matchRate, DEFAULT_RESTAURANT_DETAIL.scores.personalMatchRate),
    },
    summaryLine: reservation.guestUnderstanding,
    memorableDishes: [
      {
        id: `reservation-course-${reservation.id}`,
        title: reservation.course,
        imageUrl: null,
        tags: reservation.adjustments.map((adjustment) => adjustment.taste),
        summary: reservation.diningPromise,
      },
      DEFAULT_RESTAURANT_DETAIL.memorableDishes[0],
    ],
  };
}

interface RestaurantDetailPageProps {
  onBack: () => void;
  restaurant?: RestaurantDetailViewModel | null;
}

export default function RestaurantDetailPage({
  onBack,
  restaurant = DEFAULT_RESTAURANT_DETAIL,
}: RestaurantDetailPageProps) {
  const detail = restaurant ?? DEFAULT_RESTAURANT_DETAIL;
  const [isBookmarkSheetOpen, setIsBookmarkSheetOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => isRestaurantBookmarked(detail.name));

  const iconButtonClassName =
    'flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]';
  const iconButtonStyle = {
    height: ICON_TOKENS.container.lg,
    width: ICON_TOKENS.container.lg,
  };

  useEffect(() => {
    const syncBookmarkState = () => {
      setIsBookmarked(isRestaurantBookmarked(detail.name));
    };

    syncBookmarkState();
    window.addEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarkState);
    window.addEventListener('storage', syncBookmarkState);

    return () => {
      window.removeEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarkState);
      window.removeEventListener('storage', syncBookmarkState);
    };
  }, [detail.name]);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar
        title={detail.name}
        showBack
        onBack={onBack}
        rightActions={
          <>
            <button
              type="button"
              aria-label="공유"
              className={iconButtonClassName}
              style={iconButtonStyle}
            >
              <Share size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="더보기"
              className={iconButtonClassName}
              style={iconButtonStyle}
            >
              <Ellipsis size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack p-5 pb-10">
          <RestaurantHeroCard
            isBookmarked={isBookmarked}
            restaurant={detail}
            onBookmarkClick={() => setIsBookmarkSheetOpen(true)}
          />

          <PageSection title="내 기준으로 본 이곳" titleAs="h2" titleSize="md">
            <RestaurantScoreSummaryCard summary={detail} />
          </PageSection>

          <RestaurantMemorableDishCard dishes={detail.memorableDishes} />

          <PageSection title="위치 및 정보" titleAs="h2" titleSize="md">
            <RestaurantInfoCard info={detail.info} />
          </PageSection>

          <div className="h-6" />
        </div>
      </div>

      <RestaurantBookmarkSheet
        open={isBookmarkSheetOpen}
        onOpenChange={setIsBookmarkSheetOpen}
        onSaved={() => setIsBookmarked(true)}
        restaurant={detail}
      />
    </div>
  );
}
