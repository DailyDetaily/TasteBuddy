import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ellipsis,
  Pencil,
  Share,
} from 'lucide-react';

import TopAppBar from '../components/TopAppBar';
import PageSection from '../components/system/PageSection';
import {
  DiningAiAnalysisScreen,
  DiningFeedbackScreen,
} from '../components/reservation/DiningFeedbackFlow';
import RestaurantBookmarkSheet, {
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
  isRestaurantBookmarked,
} from '../components/restaurant/RestaurantBookmarkSheet';
import RestaurantHeroCard from '../components/restaurant/RestaurantHeroCard';
import RestaurantInfoCard, {
  type RestaurantInfoViewModel,
} from '../components/restaurant/RestaurantInfoCard';
import RestaurantInfoSuggestionSheet from '../components/restaurant/RestaurantInfoSuggestionSheet';
import RestaurantMemorableDishCard, {
  type RestaurantMemorableDishViewModel,
} from '../components/restaurant/RestaurantMemorableDishCard';
import RestaurantMenuDetailView, {
  type RestaurantMenuDetailViewModel,
} from '../components/restaurant/RestaurantMenuDetailView';
import { type RestaurantScoreTag } from '../components/restaurant/RestaurantScoreSummaryCard';
import { ICON_TOKENS, TASTE_LABEL_TO_ID, type TasteId } from '../constants/designTokens';
import { getChefImageByName } from '../constants/chefImages';
import {
  createDiningFeedbackDraft,
  type DiningFeedbackChoice,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../constants/diningFeedbackData';
import {
  createInitialTasteMeasurementSnapshot,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import type { HomeChefMatchCardData } from '../components/home/HomeCards';
import type { HomeSearchResult } from '../components/home/HomeUnifiedSearch';
import type { RealMenuRecommendationCardData } from '../components/analysis/RealMenuRecommendationCard';
import type { ReservationRecord } from '../constants/reservationCatalog';
import { hydrateRestaurantPlaceInfo } from '../lib/tasteBuddySupabase';

type RestaurantDetailView = 'detail' | 'feedback' | 'analysis' | 'menuDetail';

interface RestaurantNavigationLocation {
  selectedMenuDetail: RestaurantMenuDetailViewModel | null;
  selectedView: RestaurantDetailView;
}

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
    email?: string;
    hours: string;
    instagram?: string;
    phone?: string;
    website?: string;
  };
  locationLabel: string;
  mediaStatus?: 'placeholder' | 'verified';
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
  confidenceLabel: string;
  decisionReason: string;
  fitSummary: string;
  mainRisk: string;
  summaryLine: string;
  tags: RestaurantScoreTag[];
};

function getConfidenceLabelFromMatch(matchRate: number) {
  if (matchRate >= 82) {
    return '근거 충분';
  }

  if (matchRate >= 72) {
    return '근거 보통';
  }

  return '더 확인 필요';
}

function getTasteAxisFromLabel(label: string): TasteId | undefined {
  const exactTasteId = TASTE_LABEL_TO_ID[label as keyof typeof TASTE_LABEL_TO_ID];

  if (exactTasteId) {
    return exactTasteId;
  }

  if (label.includes('감칠')) {
    return 'umami';
  }

  if (label.includes('산미') || label.includes('신맛')) {
    return 'sour';
  }

  if (label.includes('짠맛') || label.includes('염도')) {
    return 'salty';
  }

  if (label.includes('단맛')) {
    return 'sweet';
  }

  if (label.includes('쓴맛') || label.includes('비터')) {
    return 'bitter';
  }

  if (label.includes('지방')) {
    return 'fat';
  }

  return undefined;
}

function buildMenuDetailViewModel(
  restaurant: RestaurantDetailViewModel,
  dish: RestaurantMemorableDishViewModel,
  index: number,
): RestaurantMenuDetailViewModel {
  const tasteTags = dish.tags.map((tag) => {
    const tasteAxis = getTasteAxisFromLabel(tag);

    return {
      id: `${dish.id}-${tag}`,
      label: tag,
      tasteAxis,
      tone: tasteAxis ? 'taste' : 'neutral',
    } satisfies RestaurantMenuDetailViewModel['tasteTags'][number];
  });
  const primaryTasteTag = tasteTags.find((tag) => tag.tasteAxis);
  const secondaryTag = tasteTags.find((tag) => tag.id !== primaryTasteTag?.id);
  const fitBand =
    restaurant.scores.personalMatchRate >= 82
      ? '내 기준 Fit 높음'
      : restaurant.scores.personalMatchRate >= 72
        ? '내 기준 Fit 안정적'
        : '내 기준 Fit 확인 중';
  const lowConfidenceHint =
    restaurant.confidenceLabel === '더 확인 필요'
      ? '아직 메뉴 단위 근거가 충분하지 않아요. 먹어본 메뉴로 남기면 다음 판단에서 감각 흐름을 더 분명하게 비교할 수 있어요.'
      : undefined;

  return {
    id: `${restaurant.id}-${dish.id}`,
    title: dish.title,
    restaurantName: restaurant.name,
    chefName: restaurant.chef.name,
    courseLabel: index === 0 ? '첫 번째로 비교할 메뉴' : `기억 후보 ${index + 1}`,
    imageUrl: dish.imageUrl,
    summaryLine: dish.summary,
    fitBand,
    confidenceLabel: restaurant.confidenceLabel,
    expectedTasteFlow:
      primaryTasteTag && secondaryTag
        ? `${primaryTasteTag.label}이 먼저 잡히고 ${secondaryTag.label}이 식사 후 기억의 길이를 정리할 가능성이 있어요.`
        : `${dish.title}의 중심 인상이 현재 프로필에서 어떻게 남는지 차분히 확인해볼 만해요.`,
    mainRisk:
      secondaryTag?.label
        ? `${secondaryTag.label}이 예상보다 강하거나 짧게 남으면 전체 기억이 다르게 정리될 수 있어요.`
        : restaurant.mainRisk,
    chefIntent: `${restaurant.chef.name} 셰프는 ${dish.title}에서 ${primaryTasteTag?.label ?? dish.tags[0] ?? '중심 풍미'}을 차분히 전달하고, 코스 안에서 자연스럽게 이어지는 경험을 의도한 것으로 읽혀요.`,
    similarPalateSignal:
      primaryTasteTag && secondaryTag
        ? `비슷한 미각 기준에서는 ${primaryTasteTag.label}과 ${secondaryTag.label}이 함께 있을 때 만족도가 안정적으로 읽혔어요.`
        : '비슷한 미각 기준에서는 메뉴의 첫 인상보다 식사 후 어떻게 기억되는지가 더 중요한 단서였어요.',
    pastExperienceComparison:
      index === 0
        ? '지난번 좋았던 메인 후보보다 첫 인상은 더 조용하고, 피니시는 더 짧게 정리될 수 있어요.'
        : '앞선 메뉴 후보보다 중심 풍미는 조금 더 농도 있게, 마무리는 더 오래 남을 수 있어요.',
    lowConfidenceHint,
    tasteTags,
  };
}

function buildRestaurantFeedbackChoices(dishTitle: string, tags: readonly string[]): readonly DiningFeedbackChoice[] {
  const primaryTaste = tags[0] ?? '중심 풍미';
  const secondaryTaste = tags[1] ?? '마무리';

  return [
    {
      affectedTastes: [primaryTaste, secondaryTaste],
      id: `${dishTitle}-too-strong`,
      ingredientPairing: `${primaryTaste} 인상이 강하게 남았다면 다음에는 같은 계열 후보를 조금 더 가볍게 비교할 수 있어요.`,
      label: '인상이 조금 강했어요',
      recommendation: `${primaryTaste}의 밀도와 ${secondaryTaste}의 길이를 다음 예약 판단에서 조금 더 조심스럽게 볼 수 있어요.`,
      reason: '좋고 나쁨보다, 이 메뉴가 내 기준에서 어느 정도 강도로 기억됐는지를 학습하기 위한 선택입니다.',
    },
    {
      affectedTastes: [secondaryTaste],
      id: `${dishTitle}-too-short`,
      ingredientPairing: `${secondaryTaste}가 짧게 남았다면 더 긴 피니시를 가진 메뉴 후보를 비교 기준으로 삼을 수 있어요.`,
      label: '기억보다 짧게 남았어요',
      recommendation: `다음에는 ${secondaryTaste}가 더 오래 이어지는 코스인지 판단 근거에 함께 반영할 수 있어요.`,
      reason: '맛의 첫인상은 좋았지만 식사 후 기억되는 길이가 기대보다 짧았을 때 남기는 단서입니다.',
    },
    {
      affectedTastes: [primaryTaste],
      id: `${dishTitle}-aligned`,
      ingredientPairing: `${primaryTaste} 흐름이 잘 맞았다면 비슷한 감각 축을 다음 후보 추천에 더 강하게 반영할 수 있어요.`,
      label: '내 기준에 잘 맞았어요',
      recommendation: `${primaryTaste}가 편안하게 전달되는 레스토랑을 다음 예약 후보에서 더 우선적으로 비교할 수 있어요.`,
      reason: '이 메뉴가 내 미각 프로필에서 반복해 찾고 싶은 기준점이 될 수 있을 때 선택합니다.',
    },
  ];
}

function createRestaurantFeedbackScenario(
  restaurant: RestaurantDetailViewModel,
): DiningFeedbackScenario {
  const dishes = restaurant.memorableDishes.slice(0, 3).map((dish, index) => ({
    chefIntent: dish.summary,
    courseLabel: index === 0 ? '가장 기억난 메뉴' : `기억 메뉴 ${index + 1}`,
    feedbackChoices: buildRestaurantFeedbackChoices(dish.title, dish.tags),
    flavorNotes: dish.tags,
    id: `${restaurant.id}-${dish.id}`,
    ingredients: dish.tags,
    subtitle: dish.tags.join(' · '),
    techniques: ['식후 회고', '미각 기준 업데이트'],
    title: dish.title,
  }));

  return {
    completedAt: new Date().toISOString(),
    courseName: restaurant.category,
    dishes,
    postDiningPrompt:
      '전체 식사 인상과 기억에 남은 메뉴 단서만 남겨도 다음 예약 판단이 더 정교해집니다.',
    reservationId: 0,
    restaurant: restaurant.name,
  };
}

const BENU_INFO: RestaurantInfoViewModel = {
  address: '22 Hawthorne St, San Francisco, CA 94105, USA',
  hours: '화-토 디너 운영 / 일·월 휴무',
  website: 'benusf.com',
  instagram: '@benu_sf',
  email: 'contact@benusf.com',
  phone: '+1 415-685-4860',
};

const LYSEE_INFO: RestaurantInfoViewModel = {
  address: '44 E 21st St, New York, NY 10010, USA',
  hours: '월-목 11:00-18:00, 금-토 11:00-20:00, 일 11:00-19:00',
  website: 'lyseenyc.com',
  instagram: '@lysee.nyc',
  email: 'info@lyseenyc.com',
};

const JUNGSIK_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 선릉로158길 11',
  hours: '매일 런치 12:00-15:00, 디너 17:30-22:00',
  website: 'jungsik.kr',
  instagram: '@jungsik_inc',
  email: 'reservation@jungsik.kr',
  phone: '02-517-4654',
};

const SEVENTH_DOOR_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 학동로97길 41, 4층',
  hours: '화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무',
  website: '7thdoor.kr',
  phone: '02-542-3010',
};

const ALLA_PRIMA_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 학동로17길 13',
  hours: '월·수-일 런치 12:00-15:00, 디너 18:00-22:00 / 화 휴무',
  phone: '02-511-2555',
};

const EVETT_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 도산대로45길 10-5',
  hours: '화·수 디너 17:30-22:30, 목-토 런치 12:00-14:30, 디너 17:30-22:30 / 일·월 휴무',
  website: 'restaurantevett.com',
  phone: '070-4231-1022',
};

const KWONSOOKSOO_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 압구정로80길 37, 4층',
  hours: '화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무',
  website: 'kwonsooksoo.com',
  phone: '02-542-6268',
};

const LA_YEON_INFO: RestaurantInfoViewModel = {
  address: '서울 중구 동호로 249 신라호텔 23층',
  hours: '매일 런치 12:00-14:30, 디너 17:30-21:30',
  website: 'shilla.net/seoul/dining/viewDining.do?contId=KRN',
  phone: '02-2230-3367',
};

const MINGLES_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 도산대로67길 19, 2층',
  hours: '화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무',
  website: 'restaurant-mingles.com',
  phone: '02-515-7306',
};

const MOSU_INFO: RestaurantInfoViewModel = {
  address: '서울 용산구 이태원로55가길 45',
  hours: '화-토 런치 12:00-15:00, 디너 18:00-22:00 / 일·월 휴무',
  website: 'mosuseoul.com',
  phone: '02-793-5995',
};

const ONJIUM_INFO: RestaurantInfoViewModel = {
  address: '서울 종로구 효자로 49, 4층',
  hours: '화-금 런치 12:00-15:00, 디너 18:00-22:00 / 토-월 휴무',
  phone: '02-6952-0024',
};

const SOIGNE_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 강남대로 652 신사스퀘어 2층 201호',
  hours: '화-일 런치 12:00-15:00, 디너 18:00-22:00 / 월 휴무',
  website: 'soignerestaurantgroup.com',
  phone: '02-3477-9386',
};

const SOSUHEON_INFO: RestaurantInfoViewModel = {
  address: '서울 중구 만리재로21길 8',
  hours: '예약제로 운영',
  phone: '010-9694-3368',
};

type RestaurantContextProfile = Pick<RestaurantDetailViewModel, 'category' | 'locationLabel' | 'tags'>;

function tag(id: string, label: string, tone: RestaurantScoreTag['tone'] = 'neutral', tasteAxis?: TasteId): RestaurantScoreTag {
  return { id, label, tasteAxis, tone };
}

function getRestaurantContextProfile(restaurantName: string, sourceTasteId: TasteId = 'umami'): RestaurantContextProfile {
  const normalizedName = restaurantName.trim().toLowerCase();
  const primaryTasteTag = {
    bitter: tag('primary-bitter', '은근한 쓴맛', 'taste', 'bitter'),
    fat: tag('primary-fat', '부드러운 지방감', 'taste', 'fat'),
    salty: tag('primary-salty', '절제된 염도', 'taste', 'salty'),
    sour: tag('primary-sour', '절제된 산미', 'taste', 'sour'),
    sweet: tag('primary-sweet', '은은한 단맛', 'taste', 'sweet'),
    umami: tag('primary-umami', '깊은 감칠맛', 'taste', 'umami'),
  } satisfies Record<TasteId, RestaurantScoreTag>;

  if (normalizedName.includes('밍글스') || normalizedName.includes('mingles')) {
    return {
      category: '모던 한식 코스',
      locationLabel: '서울 청담',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('jang-depth', '장 발효의 깊이', 'taste', 'umami'),
        tag('hanwoo-flow', '한우 메인'),
        tag('modern-hansik', '현대 한식'),
        tag('pairing-ready', '페어링 추천'),
      ],
    };
  }

  if (normalizedName.includes('알라프리마') || normalizedName.includes('alla')) {
    return {
      category: '이노베이티브 다이닝',
      locationLabel: '서울 학동',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('seasonal-produce', '제철 재료'),
        tag('japanese-nuance', '일식 뉘앙스'),
        tag('open-kitchen', '오픈 키친'),
        tag('creative-course', '창의적 코스'),
      ],
    };
  }

  if (normalizedName.includes('에빗') || normalizedName.includes('evett')) {
    return {
      category: '한국 식재료 테이스팅',
      locationLabel: '서울 도산',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('local-ingredients', '로컬 식재료'),
        tag('story-course', '스토리텔링 코스'),
        tag('creative-korean', '창의적 한식'),
        tag('long-finish', '긴 여운'),
      ],
    };
  }

  if (normalizedName.includes('온지음') || normalizedName.includes('onjium')) {
    return {
      category: '전통 한식 연구 다이닝',
      locationLabel: '서울 효자로',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('royal-cuisine', '궁중음식 기반'),
        tag('seasonal-table', '계절상'),
        tag('heritage', '전통 재해석'),
        tag('quiet-counter', '고요한 카운터'),
      ],
    };
  }

  if (normalizedName.includes('라연') || normalizedName.includes('layeon')) {
    return {
      category: '정통 한식 파인 다이닝',
      locationLabel: '서울 장충',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('formal-hansik', '격식 있는 한식'),
        tag('hotel-dining', '호텔 다이닝'),
        tag('seasonal-hansik', '계절 한식'),
        tag('calm-service', '차분한 서비스'),
      ],
    };
  }

  if (normalizedName.includes('세븐스') || normalizedName.includes('7th')) {
    return {
      category: '발효 한식 컨템포러리',
      locationLabel: '서울 청담',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('fermentation', '발효와 숙성'),
        tag('chef-table', '셰프 테이블'),
        tag('korean-sauces', '장과 소스'),
        tag('focused-counter', '집중형 카운터'),
      ],
    };
  }

  if (normalizedName.includes('정식당') || normalizedName.includes('jungsik')) {
    return {
      category: '뉴코리안 파인 다이닝',
      locationLabel: '서울 청담',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('new-korean', '뉴코리안'),
        tag('refined-course', '정교한 코스'),
        tag('wine-pairing', '와인 페어링'),
        tag('urban-dining', '도심 다이닝'),
      ],
    };
  }

  if (normalizedName.includes('권숙수') || normalizedName.includes('kwonsooksoo')) {
    return {
      category: '한식 파인 다이닝',
      locationLabel: '서울 청담',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('traditional-jang', '전통 장'),
        tag('seasonal-hansik-detail', '계절 한식'),
        tag('formal-service', '격식 있는 서비스'),
        tag('heritage-course', '한식 코스'),
      ],
    };
  }

  if (normalizedName.includes('모수') || normalizedName.includes('mosu')) {
    return {
      category: '이노베이티브 한식',
      locationLabel: '서울 이태원',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('minimal-course', '미니멀 코스'),
        tag('precise-acidity', '정교한 산미', 'taste', 'sour'),
        tag('long-finish-context', '긴 피니시'),
        tag('focused-service', '집중형 서비스'),
      ],
    };
  }

  if (normalizedName.includes('스와니예') || normalizedName.includes('soigne')) {
    return {
      category: '컨템포러리 코스',
      locationLabel: '서울 신사',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('signature-lunch', '시그니처 런치'),
        tag('episode-course', '스토리 코스'),
        tag('delicate-composition', '섬세한 구성'),
        tag('city-course', '도심 코스'),
      ],
    };
  }

  if (normalizedName.includes('이타닉가든') || normalizedName.includes('eatanicgarden')) {
    return {
      category: '호텔 한식 테이스팅',
      locationLabel: '서울 역삼',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('palace-nuance', '궁중 감각'),
        tag('seasonal-tasting', '계절 코스'),
        tag('joseon-palace', '조선 팰리스'),
        tag('precise-hospitality', '정교한 서비스'),
      ],
    };
  }

  if (
    normalizedName.includes('세븐도어') ||
    normalizedName.includes('세븐스도어') ||
    normalizedName.includes('7thdoor') ||
    normalizedName.includes('seventhdoor')
  ) {
    return {
      category: '발효 한식 컨템포러리',
      locationLabel: '서울 청담',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('fermentation-seventh', '발효와 숙성'),
        tag('chef-table-seventh', '셰프 테이블'),
        tag('korean-sauces-seventh', '장과 소스'),
        tag('focused-counter-seventh', '집중형 카운터'),
      ],
    };
  }

  if (normalizedName.includes('소수헌') || normalizedName.includes('sosuheon')) {
    return {
      category: '스시 오마카세',
      locationLabel: '서울 만리동',
      tags: [
        primaryTasteTag[sourceTasteId],
        tag('eight-seat-counter', '8석 카운터'),
        tag('hanok-space', '한옥 공간'),
        tag('sushi-focus', '스시 중심'),
        tag('quiet-service', '조용한 응대'),
      ],
    };
  }

  return {
    category: DEFAULT_RESTAURANT_DETAIL.category,
    locationLabel: DEFAULT_RESTAURANT_DETAIL.locationLabel,
    tags: DEFAULT_RESTAURANT_DETAIL.tags,
  };
}

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
  confidenceLabel: '근거 보통',
  fitSummary: '맑은 감칠맛과 부드러운 지방감이 현재 프로필에서 기대하는 중심 풍미와 자연스럽게 이어질 가능성이 있어요.',
  mainRisk: '코스 후반에 지방감과 여운이 길어지면 전체 인상이 조금 무겁게 남을 수 있어요.',
  decisionReason: '비슷한 미각 기준에서는 조용한 공간, 긴 피니시, 절제된 산미가 함께 있을 때 만족도가 더 안정적으로 읽혀요.',
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
    {
      id: 'seasonal-fish-course',
      title: '제철 생선 코스',
      imageUrl: null,
      tags: ['절제된 산미', '맑은 감칠맛', '가벼운 여운'],
      summary: '제철 생선의 산뜻한 결이 코스 중반의 균형을 차분하게 잡아줘요.',
    },
    {
      id: 'clear-broth-finish',
      title: '맑은 국물 마무리',
      imageUrl: null,
      tags: ['편안한 마무리', '맑은 감칠맛', '긴 피니시'],
      summary: '식사 후반의 인상을 무겁지 않게 정리하며 여운을 길게 남겨요.',
    },
  ],
  info: BENU_INFO,
};

const EATANIC_GARDEN_COURSE_DISHES: RestaurantMemorableDishViewModel[] = [
  {
    id: 'eatanic-junami-rice',
    title: '주나미 쌀',
    imageUrl: null,
    tags: ['쌀의 단맛', '차분한 시작', '맑은 여운'],
    summary: '쌀의 은은한 단맛으로 코스의 첫 인상을 조용하게 열어줘요.',
  },
  {
    id: 'eatanic-bugak',
    title: '부각',
    imageUrl: null,
    tags: ['바삭한 질감', '짭짤한 균형', '가벼운 시작'],
    summary: '바삭한 질감과 짭짤한 균형이 입맛을 가볍게 깨워줘요.',
  },
  {
    id: 'eatanic-deodeok-root',
    title: '더덕',
    imageUrl: null,
    tags: ['뿌리채소 향', '은근한 쓴맛', '긴 여운'],
    summary: '더덕의 향과 은근한 쓴맛이 코스의 깊이를 천천히 쌓아줘요.',
  },
  {
    id: 'eatanic-bomdong',
    title: '봄동',
    imageUrl: null,
    tags: ['계절 채소', '절제된 산미', '맑은 감칠맛'],
    summary: '봄동의 산뜻한 결이 중반부의 맛을 맑게 정리해줘요.',
  },
  {
    id: 'eatanic-hanjae-minari',
    title: '한재 미나리',
    imageUrl: null,
    tags: ['향채의 선명함', '가벼운 쓴맛', '깨끗한 마무리'],
    summary: '미나리의 선명한 향이 코스 사이의 전환점을 깨끗하게 만들어줘요.',
  },
  {
    id: 'eatanic-fish-jorim',
    title: '생선 조림',
    imageUrl: null,
    tags: ['부드러운 염도', '감칠맛', '따뜻한 여운'],
    summary: '생선 조림의 감칠맛과 염도가 중심 풍미를 차분히 잡아줘요.',
  },
  {
    id: 'eatanic-samgyetang',
    title: '삼계탕',
    imageUrl: null,
    tags: ['따뜻한 육수', '부드러운 지방감', '편안한 밀도'],
    summary: '삼계탕의 따뜻한 육수감이 후반부의 안정감을 만들어줘요.',
  },
  {
    id: 'eatanic-bulgogi',
    title: '불고기',
    imageUrl: null,
    tags: ['달큰한 감칠맛', '부드러운 지방감', '익숙한 여운'],
    summary: '불고기의 달큰한 감칠맛이 코스의 기억점을 또렷하게 남겨요.',
  },
  {
    id: 'eatanic-baked-sweet-potato',
    title: '군고구마',
    imageUrl: null,
    tags: ['자연스러운 단맛', '구운 향', '부드러운 마무리'],
    summary: '군고구마의 자연스러운 단맛이 식사의 온도를 부드럽게 낮춰줘요.',
  },
  {
    id: 'eatanic-mother-of-pearl-box',
    title: '자개함',
    imageUrl: null,
    tags: ['디저트 구성', '차분한 마무리', '긴 피니시'],
    summary: '자개함 구성의 디저트가 코스의 마지막 인상을 정돈해줘요.',
  },
];

const EATANIC_GARDEN_INFO: RestaurantInfoViewModel = {
  address: '서울 강남구 테헤란로 231 조선 팰리스 36층',
  hours: '수-일 런치 12:00-14:30, 디너 18:00-22:00 / 월·화 휴무',
  website: 'jpg.josunhotel.com/dining/EatanicGarden.do',
  instagram: '@eatanicgarden',
  phone: '02-727-7610',
};

function normalizeRestaurantName(restaurantName: string) {
  return restaurantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isEatanicGardenRestaurant(restaurantName: string) {
  const normalizedName = normalizeRestaurantName(restaurantName);

  return normalizedName.includes('이타닉가든') || normalizedName.includes('eatanicgarden');
}

function getRestaurantInfo(restaurantName: string) {
  const normalizedName = normalizeRestaurantName(restaurantName);

  if (normalizedName.includes('이타닉가든') || normalizedName.includes('eatanicgarden')) {
    return EATANIC_GARDEN_INFO;
  }

  if (
    normalizedName.includes('베누') ||
    normalizedName.includes('benu') ||
    normalizedName.includes('venu')
  ) {
    return BENU_INFO;
  }

  if (
    normalizedName.includes('리제') ||
    normalizedName.includes('lysee')
  ) {
    return LYSEE_INFO;
  }

  if (normalizedName.includes('정식당') || normalizedName.includes('jungsik')) {
    return JUNGSIK_INFO;
  }

  if (
    normalizedName.includes('세븐도어') ||
    normalizedName.includes('세븐스도어') ||
    normalizedName.includes('7thdoor') ||
    normalizedName.includes('seventhdoor')
  ) {
    return SEVENTH_DOOR_INFO;
  }

  if (
    normalizedName.includes('알라프리마') ||
    normalizedName.includes('allaprima')
  ) {
    return ALLA_PRIMA_INFO;
  }

  if (normalizedName.includes('에빗') || normalizedName.includes('evett')) {
    return EVETT_INFO;
  }

  if (
    normalizedName.includes('권숙수') ||
    normalizedName.includes('kwonsooksoo')
  ) {
    return KWONSOOKSOO_INFO;
  }

  if (
    normalizedName.includes('라연') ||
    normalizedName.includes('layeon')
  ) {
    return LA_YEON_INFO;
  }

  if (normalizedName.includes('밍글스') || normalizedName.includes('mingles')) {
    return MINGLES_INFO;
  }

  if (normalizedName.includes('모수') || normalizedName.includes('mosu')) {
    return MOSU_INFO;
  }

  if (normalizedName.includes('온지음') || normalizedName.includes('onjium')) {
    return ONJIUM_INFO;
  }

  if (normalizedName.includes('스와니예') || normalizedName.includes('soigne')) {
    return SOIGNE_INFO;
  }

  if (normalizedName.includes('소수헌') || normalizedName.includes('sosuheon')) {
    return SOSUHEON_INFO;
  }

  return DEFAULT_RESTAURANT_DETAIL.info;
}

export function createRestaurantDetailFromChefMatch(
  chef: HomeChefMatchCardData,
): RestaurantDetailViewModel {
  const chefName = chef.chef.replace(/\s*셰프$/, '');
  const representativeDish =
    chef.representativeDishTitle && chef.representativeDishTitle !== '메뉴 미정'
      ? chef.representativeDishTitle
      : '시그니처 코스';
  const memorableDishes = isEatanicGardenRestaurant(chef.restaurant)
    ? EATANIC_GARDEN_COURSE_DISHES
    : [
        {
          id: 'representative-dish',
          title: representativeDish,
          imageUrl: null,
          tags: ['맑은 감칠맛', '긴 여운', '가벼운 마무리'],
          summary: '현재 미각 기준에서 코스의 첫 인상을 차분하게 열어줄 가능성이 높아요.',
        },
        ...DEFAULT_RESTAURANT_DETAIL.memorableDishes.slice(1),
      ];
  const info = getRestaurantInfo(chef.restaurant);
  const contextProfile = getRestaurantContextProfile(chef.restaurant, chef.sourceTasteId ?? chef.tasteId);

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    ...contextProfile,
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
    confidenceLabel:
      chef.matchConfidence === 'strong'
        ? '근거 충분'
        : chef.matchConfidence === 'building'
          ? '근거 보통'
          : '더 확인 필요',
    fitSummary:
      chef.matchReason ??
      `${representativeDish}의 중심 풍미가 현재 프로필에서 또렷하게 반응하는 축과 자연스럽게 이어질 가능성이 있어요.`,
    mainRisk: '대표 메뉴 외 코스 전체의 산미, 지방감, 피니시 흐름은 방문 전 한 번 더 확인하면 좋아요.',
    decisionReason: `${representativeDish}를 기준으로 보면 이곳은 메뉴 단위의 매칭 근거가 있어 예약 후보로 비교하기 좋은 편이에요.`,
    summaryLine:
      chef.matchReason ??
      `${chef.restaurant}은 현재 프로필에서 또렷한 감각 축이 코스의 중심 풍미와 자연스럽게 이어질 가능성이 높아요.`,
    memorableDishes,
    info,
  };
}

export function createRestaurantDetailFromSearchResult(
  result: HomeSearchResult,
): RestaurantDetailViewModel {
  if (result.source === 'kakao') {
    const address = result.place?.address ?? DEFAULT_RESTAURANT_DETAIL.info.address;
    const info: RestaurantInfoViewModel = {
      address,
      hours: 'Taste Buddy 분석 준비 중',
      mapUrl: result.place?.placeUrl ?? undefined,
      phone: result.place?.phone ?? undefined,
      sourceByRow: {
        address: 'kakao',
        ...(result.place?.phone ? { phone: 'kakao' as const } : {}),
      },
    };
    const locationLabel = address.split(' ').slice(0, 2).join(' ') || DEFAULT_RESTAURANT_DETAIL.locationLabel;

    return {
      ...DEFAULT_RESTAURANT_DETAIL,
      id: result.id,
      name: result.restaurant,
      category: '카카오 장소 정보 기반',
      heroImageUrl: null,
      locationLabel,
      mediaStatus: 'placeholder',
      chef: {
        name: 'Taste Buddy 분석 준비 중',
        avatarUrl: null,
      },
      confidenceLabel: '더 확인 필요',
      fitSummary:
        '장소 정보는 카카오 기준으로 확인했어요. 메뉴별 미각 매칭은 Taste Buddy 데이터가 준비되면 같은 페이지에서 이어서 볼 수 있어요.',
      mainRisk:
        '아직 메뉴와 코스의 미각 벡터가 연결되지 않아 개인화 매칭률은 판단하지 않았어요.',
      decisionReason:
        '먼저 장소를 확인하고, 자주 찾는 식당은 Taste Buddy 큐레이션 후보로 올려 메뉴와 셰프 해석을 붙일 수 있어요.',
      summaryLine:
        `${result.restaurant}은 카카오 장소 정보로 먼저 확인한 레스토랑이에요. Taste Buddy 분석은 준비 중입니다.`,
      scores: {
        personalMatchRate: 0,
        palateFriendsAverageScore: 0,
        overallScore: 0,
      },
      tags: [
        { id: 'kakao-place', label: '카카오 장소 정보', tone: 'neutral' },
        { id: 'analysis-pending', label: 'TB 분석 준비 중', tone: 'neutral' },
        { id: 'taste-vector-pending', label: '미각 벡터 미연결', tone: 'neutral' },
      ],
      memorableDishes: [
        {
          id: `${result.id}-analysis-pending`,
          title: 'Taste Buddy 분석 준비 중',
          imageUrl: null,
          tags: ['메뉴 수집 전', '미각 벡터 미연결'],
          summary:
            '이 식당의 코스와 메뉴 데이터가 준비되면 감각 흐름, 셰프 의도, 개인화 매칭을 같은 상세 페이지에서 볼 수 있어요.',
        },
        {
          id: `${result.id}-place-confirmed`,
          title: '장소 정보 확인됨',
          imageUrl: null,
          tags: ['카카오 장소', '주소 확인'],
          summary:
            address !== DEFAULT_RESTAURANT_DETAIL.info.address
              ? `${address} 기준으로 위치 정보를 확인했어요.`
              : '카카오 장소 정보를 기준으로 식당 존재 여부를 먼저 확인했어요.',
        },
      ],
      info,
    };
  }

  const primaryDishTitle = result.type === 'menu' ? result.label : result.signatureItems[0];
  const chefName = result.chef.replace(/\s*셰프$/, '');
  const memorableDishes = isEatanicGardenRestaurant(result.restaurant)
    ? EATANIC_GARDEN_COURSE_DISHES
    : [
        {
          id: `${result.id}-primary`,
          title: primaryDishTitle || '시그니처 메뉴',
          imageUrl: null,
          tags: result.signatureItems.length > 0 ? result.signatureItems : ['맑은 감칠맛', '긴 여운'],
          summary: result.matchMeta || '현재 프로필과 연결되는 감각 포인트를 메뉴 단위로 다시 읽어볼 수 있어요.',
        },
        ...DEFAULT_RESTAURANT_DETAIL.memorableDishes.slice(1),
      ];
  const info = getRestaurantInfo(result.restaurant);
  const contextProfile = getRestaurantContextProfile(result.restaurant);

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    ...contextProfile,
    id: result.id,
    name: result.restaurant,
    heroImageUrl: result.image ?? DEFAULT_RESTAURANT_DETAIL.heroImageUrl,
    chef: {
      name: chefName,
      avatarUrl: result.image ?? getChefImageByName(chefName),
    },
    confidenceLabel: result.type === 'restaurant' ? '더 확인 필요' : '근거 보통',
    fitSummary:
      result.matchMeta ||
      `${primaryDishTitle || result.restaurant}의 감각 단서가 현재 프로필과 어떻게 이어지는지 확인해볼 만해요.`,
    mainRisk: '검색 결과 기반 정보라 코스 전체의 강도와 후반 피니시는 추가 확인이 필요해요.',
    decisionReason:
      result.type === 'menu'
        ? `${primaryDishTitle}처럼 구체적인 메뉴 단서가 있어 판단의 출발점이 비교적 분명해요.`
        : '아직 메뉴 단서가 충분하지 않다면 감각 태그와 대표 dish를 함께 보고 판단하는 편이 좋아요.',
    summaryLine:
      result.type === 'restaurant'
        ? `${result.restaurant}은 현재 프로필 기준에서 메뉴의 감각 흐름을 차분히 읽어볼 만한 레스토랑이에요.`
        : result.type === 'chef'
          ? `${chefName} 셰프의 메뉴 구성은 현재 프로필에서 기억될 감각을 메뉴 단위로 확인하기 좋아요.`
          : `${result.label}이 어떤 감각으로 남을 가능성이 높은지 ${result.restaurant}의 흐름 안에서 살펴볼 수 있어요.`,
    memorableDishes,
    info,
  };
}

export function createRestaurantDetailFromMenuRecommendation(
  menu: RealMenuRecommendationCardData,
): RestaurantDetailViewModel {
  const chefName = menu.chef.replace(/\s*셰프$/, '');
  const memorableDishes = isEatanicGardenRestaurant(menu.restaurant)
    ? EATANIC_GARDEN_COURSE_DISHES
    : [
        {
          id: menu.id,
          title: menu.title,
          imageUrl: null,
          tags: [menu.tasteLabel, menu.courseLabel, ...menu.ingredients].slice(0, 3),
          summary: menu.reason,
        },
        ...DEFAULT_RESTAURANT_DETAIL.memorableDishes,
      ];
  const info = getRestaurantInfo(menu.restaurant);
  const contextProfile = getRestaurantContextProfile(
    menu.restaurant,
    TASTE_LABEL_TO_ID[menu.tasteLabel] ?? 'umami',
  );

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    ...contextProfile,
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
    confidenceLabel: getConfidenceLabelFromMatch(menu.fitScore),
    fitSummary: menu.reason,
    mainRisk: '추천된 메뉴 하나의 적합도이므로 코스 전체가 같은 방향으로 이어지는지는 더 확인해야 해요.',
    decisionReason: `${menu.title}의 ${menu.tasteLabel} 흐름과 ${menu.ingredients.slice(0, 2).join(', ') || menu.courseLabel} 단서가 현재 기준에서 비교 근거가 됩니다.`,
    summaryLine: `${menu.restaurant}에서는 ${menu.title}처럼 현재 프로필에 맞는 감각 흐름을 메뉴 단위로 읽어볼 수 있어요.`,
    memorableDishes,
    info,
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
  const memorableDishes = isEatanicGardenRestaurant(restaurant)
    ? EATANIC_GARDEN_COURSE_DISHES
    : DEFAULT_RESTAURANT_DETAIL.memorableDishes;
  const info = getRestaurantInfo(restaurant);
  const contextProfile = getRestaurantContextProfile(
    restaurant,
    TASTE_LABEL_TO_ID[taste] ?? 'umami',
  );

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    ...contextProfile,
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
    confidenceLabel: getConfidenceLabelFromMatch(matchRate),
    fitSummary: `${taste} 흐름이 내 프로필에서 반복적으로 눈에 들어온다면 이곳은 다음 후보로 비교해볼 만해요.`,
    mainRisk: '좋아하는 셰프/스타일 신호가 강한 만큼, 실제 코스의 계절 메뉴 흐름은 따로 확인하면 좋아요.',
    decisionReason: `${chefName} 셰프와 ${restaurant}은 관심 경험으로 저장해두고 비슷한 후보와 비교하기 좋은 레스토랑이에요.`,
    summaryLine: `${chefName} 셰프의 ${restaurant}은 내 프로필에서 ${taste} 흐름이 어떻게 기억될지 살펴보기 좋은 후보예요.`,
    memorableDishes,
    info,
  };
}

export function createRestaurantDetailFromReservation(
  reservation: ReservationRecord,
): RestaurantDetailViewModel {
  const memorableDishes = isEatanicGardenRestaurant(reservation.restaurant)
    ? EATANIC_GARDEN_COURSE_DISHES
    : [
        {
          id: `reservation-course-${reservation.id}`,
          title: reservation.course,
          imageUrl: null,
          tags: reservation.adjustments.map((adjustment) => adjustment.taste),
          summary: reservation.diningPromise,
        },
        ...DEFAULT_RESTAURANT_DETAIL.memorableDishes,
      ];
  const info = getRestaurantInfo(reservation.restaurant);
  const contextProfile = getRestaurantContextProfile(
    reservation.restaurant,
    TASTE_LABEL_TO_ID[reservation.adjustments[0]?.taste ?? ''] ?? 'umami',
  );

  return {
    ...DEFAULT_RESTAURANT_DETAIL,
    ...contextProfile,
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
    confidenceLabel: getConfidenceLabelFromMatch(reservation.matchRate),
    fitSummary: reservation.diningPromise,
    mainRisk:
      reservation.adjustments.length > 0
        ? `${reservation.adjustments.map((adjustment) => adjustment.taste).join(', ')} 조정 방향이 실제 코스 후반까지 편안하게 이어지는지 확인하면 좋아요.`
        : '예약 정보는 있지만 감각 조정 단서가 아직 적어 방문 전 메뉴 흐름을 더 확인하면 좋아요.',
    decisionReason: reservation.guestUnderstanding,
    summaryLine: reservation.guestUnderstanding,
    memorableDishes,
    info,
  };
}

interface RestaurantDetailPageProps {
  measurementSnapshot?: TasteMeasurementSnapshot | null;
  onBack: () => void;
  onFeedbackMapViewChange?: (isMapView: boolean) => void;
  restaurant?: RestaurantDetailViewModel | null;
}

export default function RestaurantDetailPage({
  measurementSnapshot,
  onBack,
  onFeedbackMapViewChange,
  restaurant = DEFAULT_RESTAURANT_DETAIL,
}: RestaurantDetailPageProps) {
  const sourceDetail = restaurant ?? DEFAULT_RESTAURANT_DETAIL;
  const resolvedInfo =
    sourceDetail.mediaStatus === 'placeholder'
      ? sourceDetail.info
      : getRestaurantInfo(sourceDetail.name);
  const [placeInfo, setPlaceInfo] = useState<Partial<RestaurantInfoViewModel> | null>(null);
  const detail = useMemo(
    () => ({
      ...sourceDetail,
      info: {
        ...resolvedInfo,
        ...placeInfo,
      },
    }),
    [placeInfo, resolvedInfo, sourceDetail],
  );
  const feedbackScenario = useMemo(() => createRestaurantFeedbackScenario(detail), [detail]);
  const [selectedView, setSelectedView] = useState<RestaurantDetailView>('detail');
  const [selectedMenuDetail, setSelectedMenuDetail] =
    useState<RestaurantMenuDetailViewModel | null>(null);
  const navigationStackRef = useRef<RestaurantNavigationLocation[]>([]);
  const [feedbackDraft, setFeedbackDraft] = useState<DiningFeedbackDraft>(() =>
    createDiningFeedbackDraft(feedbackScenario),
  );
  const [isBookmarkSheetOpen, setIsBookmarkSheetOpen] = useState(false);
  const [isInfoSuggestionSheetOpen, setIsInfoSuggestionSheetOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => isRestaurantBookmarked(detail.name));
  const feedbackResetRestaurantIdRef = useRef(detail.id);

  const iconButtonClassName =
    'flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]';
  const iconButtonStyle = {
    height: ICON_TOKENS.container.lg,
    width: ICON_TOKENS.container.lg,
  };

  const getCurrentNavigationLocation = (): RestaurantNavigationLocation => ({
    selectedMenuDetail,
    selectedView,
  });

  const navigateToRestaurantLocation = (
    nextLocation: RestaurantNavigationLocation,
    options: { replace?: boolean } = {},
  ) => {
    const currentLocation = getCurrentNavigationLocation();

    if (
      currentLocation.selectedView === nextLocation.selectedView &&
      currentLocation.selectedMenuDetail?.id === nextLocation.selectedMenuDetail?.id
    ) {
      return;
    }

    if (!options.replace) {
      navigationStackRef.current = [
        ...navigationStackRef.current.slice(-9),
        currentLocation,
      ];
    }

    setSelectedMenuDetail(nextLocation.selectedMenuDetail);
    setSelectedView(nextLocation.selectedView);
  };

  const goBackToPreviousRestaurantLocation = (
    fallback: RestaurantNavigationLocation = {
      selectedMenuDetail: null,
      selectedView: 'detail',
    },
  ) => {
    const previousLocation = navigationStackRef.current.pop() ?? fallback;

    setSelectedMenuDetail(previousLocation.selectedMenuDetail);
    setSelectedView(previousLocation.selectedView);
  };

  useEffect(() => {
    let isCancelled = false;
    setPlaceInfo(sourceDetail.info.sourceByRow?.address === 'kakao' ? sourceDetail.info : null);

    void (async () => {
      const hydratedPlaceInfo = await hydrateRestaurantPlaceInfo(sourceDetail.name);

      if (isCancelled) {
        return;
      }

      setPlaceInfo(hydratedPlaceInfo);
    })();

    return () => {
      isCancelled = true;
    };
  }, [sourceDetail.name]);

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

  useEffect(() => {
    if (feedbackResetRestaurantIdRef.current === detail.id) {
      return;
    }

    feedbackResetRestaurantIdRef.current = detail.id;
    setFeedbackDraft(createDiningFeedbackDraft(feedbackScenario));
    setSelectedView('detail');
    setSelectedMenuDetail(null);
    navigationStackRef.current = [];
  }, [detail.id, feedbackScenario]);

  useEffect(() => {
    if (selectedView !== 'feedback') {
      onFeedbackMapViewChange?.(false);
    }

    return () => {
      onFeedbackMapViewChange?.(false);
    };
  }, [onFeedbackMapViewChange, selectedView]);

  if (selectedView === 'feedback') {
    return (
      <DiningFeedbackScreen
        draft={feedbackDraft}
        onBack={goBackToPreviousRestaurantLocation}
        onChange={setFeedbackDraft}
        onMapViewChange={onFeedbackMapViewChange}
        onSubmit={() =>
          navigateToRestaurantLocation({
            selectedMenuDetail: null,
            selectedView: 'analysis',
          })
        }
        scenario={feedbackScenario}
      />
    );
  }

  if (selectedView === 'analysis') {
    return (
      <DiningAiAnalysisScreen
        draft={feedbackDraft}
        measurementSnapshot={measurementSnapshot ?? createInitialTasteMeasurementSnapshot()}
        onBack={goBackToPreviousRestaurantLocation}
        onClose={() =>
          navigateToRestaurantLocation(
            {
              selectedMenuDetail: null,
              selectedView: 'detail',
            },
            { replace: true },
          )
        }
        scenario={feedbackScenario}
      />
    );
  }

  if (selectedView === 'menuDetail' && selectedMenuDetail) {
    return (
      <RestaurantMenuDetailView
        menu={selectedMenuDetail}
        onBack={goBackToPreviousRestaurantLocation}
        onRecordDishMemory={() =>
          navigateToRestaurantLocation({
            selectedMenuDetail,
            selectedView: 'feedback',
          })
        }
      />
    );
  }

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
            quickInfo={detail.info}
            restaurant={detail}
            onBookmarkClick={() => setIsBookmarkSheetOpen(true)}
            onVisitedClick={() =>
              navigateToRestaurantLocation({
                selectedMenuDetail: null,
                selectedView: 'feedback',
              })
            }
          />

          <RestaurantMemorableDishCard
            dishes={detail.memorableDishes}
            onSelectDish={(dish, index) => {
              navigateToRestaurantLocation({
                selectedMenuDetail: buildMenuDetailViewModel(detail, dish, index),
                selectedView: 'menuDetail',
              });
            }}
          />

          <PageSection title="위치 및 정보" titleAs="h2" titleSize="md">
            <div className="flex flex-col items-center gap-2">
              <RestaurantInfoCard info={detail.info} />
              <button
                className="inline-flex items-center gap-1.5 self-center px-1 py-1 text-[12px] font-semibold text-[var(--tb-user-accent-main)] transition-colors hover:text-[var(--tb-user-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-user-accent-tint-soft-border)]"
                onClick={() => setIsInfoSuggestionSheetOpen(true)}
                type="button"
              >
                <Pencil aria-hidden="true" size={13} strokeWidth={1.8} />
                수정 제안하기
              </button>
            </div>
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
      <RestaurantInfoSuggestionSheet
        info={detail.info}
        open={isInfoSuggestionSheetOpen}
        onOpenChange={setIsInfoSuggestionSheetOpen}
        restaurantName={detail.name}
      />
    </div>
  );
}
