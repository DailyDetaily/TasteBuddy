import { getChefImageByName } from './chefImages';

export type ReservationStatus = 'upcoming' | 'preparing' | 'ready' | 'completed';

export interface ReservationAdjustment {
  direction: string;
  taste: string;
}

export interface ReservationTimelineStep {
  current?: boolean;
  done: boolean;
  step: string;
}

export interface ReservationRecord {
  adjustments: ReservationAdjustment[];
  chef: string;
  chefImage: string | null;
  course: string;
  date: string;
  diningPromise: string;
  externalRef?: string | null;
  guests: number;
  guestUnderstanding: string;
  id: number;
  matchRate: number;
  remoteId?: string | null;
  restaurant: string;
  status: ReservationStatus;
  tcsStatus: string;
  time: string;
  timeline: ReservationTimelineStep[];
}

export const RESERVATION_CATALOG: ReservationRecord[] = [
  {
    id: 1,
    restaurant: '레스토랑 베누',
    chef: '황정인',
    chefImage: getChefImageByName('황정인'),
    date: '2025.03.15',
    time: '저녁 7:00',
    guests: 2,
    status: 'ready',
    course: '시그니처 디너 코스',
    matchRate: 75,
    tcsStatus: '셰프 가이드가 준비되었습니다',
    adjustments: [
      { taste: '감칠맛', direction: '살리기' },
      { taste: '짠맛', direction: '정리하기' },
    ],
    diningPromise:
      '코스의 중심 풍미는 살리되, 피니시는 조금 더 또렷하게 정리해 황정인 셰프의 의도가 더 자연스럽게 전달되도록 준비됐습니다.',
    guestUnderstanding:
      '지금의 프로필은 깊이감은 즐기지만 마무리가 무거워지면 만족이 떨어질 수 있다는 점을 보여줘요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: true },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false, current: true },
    ],
  },
  {
    id: 2,
    restaurant: '숍 리제 (Lysée)',
    chef: '이은지',
    chefImage: getChefImageByName('이은지'),
    date: '2025.03.22',
    time: '저녁 6:30',
    guests: 2,
    status: 'upcoming',
    course: '봄 시즌 테이스팅 코스',
    matchRate: 72,
    tcsStatus: '예약이 확정되었습니다',
    adjustments: [
      { taste: '단맛', direction: '살리기' },
      { taste: '신맛', direction: '살리기' },
    ],
    diningPromise:
      '디저트와 피니시 코스에서 단맛과 산미의 균형이 더 잘 맞도록, 이은지 셰프가 전달 강도를 조율할 수 있는 상태예요.',
    guestUnderstanding:
      '지금의 프로필은 부드러운 단맛은 좋아하지만 마무리에 선명한 정리감이 함께 있을 때 더 만족할 가능성을 보여줘요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: false, current: true },
      { step: '셰프 TCS 준비', done: false },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false },
    ],
  },
  {
    id: 3,
    restaurant: '정식당',
    chef: '임정식',
    chefImage: getChefImageByName('임정식'),
    date: '2025.02.28',
    time: '저녁 7:30',
    guests: 4,
    status: 'completed',
    course: '한식 모던 코스',
    matchRate: 70,
    tcsStatus: '다이닝이 완료되었습니다',
    adjustments: [
      { taste: '감칠맛', direction: '살리기' },
      { taste: '지방맛', direction: '살리기' },
    ],
    diningPromise:
      '메인 코스의 밀도와 발효 감칠맛이 더 자연스럽게 이어지도록 프로필이 반영된 다이닝이었습니다.',
    guestUnderstanding:
      '당시 프로필은 중심 풍미가 살아 있는 코스에서 만족이 높고, 후반 무게감은 더 섬세한 정리가 필요하다는 방향을 보여줬어요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: true },
      { step: '사전 미각 측정', done: true },
      { step: '다이닝 완료', done: true },
    ],
  },
];

export function buildMockReservationExternalRef(id: number) {
  return `mock-reservation-${id}`;
}

export function parseMockReservationExternalRef(externalRef: string | null | undefined) {
  if (!externalRef) {
    return null;
  }

  const match = externalRef.match(/^mock-reservation-(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number.parseInt(match[1] ?? '', 10);
  return Number.isNaN(id) ? null : id;
}

export function getReservationCatalogEntry(id: number) {
  return RESERVATION_CATALOG.find((reservation) => reservation.id === id) ?? null;
}
