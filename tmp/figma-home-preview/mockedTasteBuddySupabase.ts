import type { RestaurantContentCatalog } from '../../src/lib/tasteBuddySupabase';
import { RESERVATION_CATALOG } from '../../src/constants/reservationCatalog';
import {
  createInitialTasteMeasurementSnapshot,
  createTasteMeasurementSnapshot,
} from '../../src/constants/tasteMeasurementData';

export * from '../../src/lib/tasteBuddySupabase';

const seededCatalog: RestaurantContentCatalog = {
  chefs: [
    {
      name: '손종원',
      restaurant: '이타닉가든',
      restaurantSlug: 'eatanic-garden',
      signatureDishTitles: ['제철 해산물', '발효 풍미 브로스'],
      taste: 'umami',
    },
    {
      name: '이은지',
      restaurant: '리제',
      restaurantSlug: 'lysee',
      signatureDishTitles: ['시트러스 피니시', '계절 디저트'],
      taste: 'sweet',
    },
    {
      name: '임정식',
      restaurant: '정식당',
      restaurantSlug: 'jungsik',
      signatureDishTitles: ['감태 국수', '장향 메인'],
      taste: 'salty',
    },
  ],
  dishes: [
    {
      id: 'seed-dish-1',
      chef: '손종원',
      confidence: 0.95,
      courseLabel: '메인',
      coursePosition: 'main',
      dominantTaste: 'umami',
      ingredients: ['해산물', '허브'],
      restaurant: '이타닉가든',
      restaurantSlug: 'eatanic-garden',
      seasonLabel: '2026 Spring',
      subtitle: '해산물과 허브를 중심으로 풍미가 길게 이어지는 코스',
      tasteVector: {
        sweet: 0.12,
        sour: 0.2,
        bitter: 0.09,
        salty: 0.24,
        umami: 0.94,
        fat: 0.22,
      },
      title: '제철 해산물 코스',
    },
    {
      id: 'seed-dish-2',
      chef: '이은지',
      confidence: 0.91,
      courseLabel: '디저트',
      coursePosition: 'dessert',
      dominantTaste: 'sweet',
      ingredients: ['감귤', '바닐라'],
      restaurant: '리제',
      restaurantSlug: 'lysee',
      seasonLabel: '2026 Spring',
      subtitle: '밝은 산미와 단맛이 균형 있게 정리되는 피니시',
      tasteVector: {
        sweet: 0.93,
        sour: 0.46,
        bitter: 0.04,
        salty: 0.08,
        umami: 0.14,
        fat: 0.28,
      },
      title: '시트러스 디저트',
    },
    {
      id: 'seed-dish-3',
      chef: '임정식',
      confidence: 0.88,
      courseLabel: '스타터',
      coursePosition: 'starter',
      dominantTaste: 'salty',
      ingredients: ['감태', '면', '육수'],
      restaurant: '정식당',
      restaurantSlug: 'jungsik',
      seasonLabel: '2026 Spring',
      subtitle: '감태 향과 미네랄감이 또렷하게 살아나는 대표 메뉴',
      tasteVector: {
        sweet: 0.1,
        sour: 0.11,
        bitter: 0.06,
        salty: 0.91,
        umami: 0.48,
        fat: 0.19,
      },
      title: '감태 국수',
    },
  ],
};

export async function hydrateReservationPageData() {
  return {
    feedbackByReservationId: {},
    feedbackScenariosByReservationId: {},
    reservations: RESERVATION_CATALOG,
  };
}

export async function hydrateRestaurantContentCatalog() {
  return seededCatalog;
}

export async function hydrateRecentMeasurementSnapshots() {
  const current = createInitialTasteMeasurementSnapshot();

  return [
    createTasteMeasurementSnapshot(
      {
        sweet: 7.9,
        sour: 6.7,
        bitter: 4.5,
        salty: 5.6,
        umami: 3.4,
        fat: 5.1,
      },
      '2026-02-18T11:05:00+09:00',
    ),
    createTasteMeasurementSnapshot(
      {
        sweet: 8.1,
        sour: 7.0,
        bitter: 4.2,
        salty: 5.8,
        umami: 3.2,
        fat: 5.4,
      },
      '2026-02-27T19:20:00+09:00',
    ),
    current,
  ];
}
