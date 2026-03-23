import { TASTE_IDS, type TasteId } from './designTokens';
import {
  TASTE_MEASUREMENT_AVERAGES,
  createTasteMeasurementSnapshot,
  type TasteMeasurementEntry,
  type TasteMeasurementSnapshot,
} from './tasteMeasurementData';

type TasteAdjustments = Partial<Record<TasteId, number>>;

export interface QuickTasteCalibrationOption {
  description: string;
  id: string;
  label: string;
  profileNote: string;
  tasteAdjustments: TasteAdjustments;
}

export interface QuickTasteCalibrationQuestion {
  calibrationHint: string;
  description: string;
  eyebrow: string;
  id: string;
  options: readonly QuickTasteCalibrationOption[];
  title: string;
}

export type QuickTasteCalibrationResponses = Record<string, string>;

const STARTER_PROFILE_MIN = 3.2;
const STARTER_PROFILE_MAX = 7.2;

export const QUICK_TASTE_CALIBRATION_QUESTIONS: readonly QuickTasteCalibrationQuestion[] = [
  {
    id: 'sweetness-finish',
    eyebrow: '01 Current Sweetness',
    title: '단맛이 느껴질 때,\n어느 쪽이 더 자연스럽나요?',
    description: '지금의 입맛에서 단맛이 어떻게 정리될 때 가장 편안한지 가볍게 보정합니다.',
    calibrationHint: '이 답변은 단맛의 길이감과 마무리 인상을 반영해요.',
    options: [
      {
        id: 'clean',
        label: '깨끗하게 정리되는 쪽',
        description: '단맛이 오래 남기보다 선명하게 지나가면 더 잘 맞아요.',
        profileNote: '단맛이 길게 남기보다 정돈된 피니시에서 더 편안함을 느끼는 경향이 보여요.',
        tasteAdjustments: {
          sweet: -0.5,
          sour: 0.3,
          bitter: 0.2,
        },
      },
      {
        id: 'balanced',
        label: '부드럽게 균형 잡힌 쪽',
        description: '단맛이 튀지 않고 다른 맛과 함께 자연스럽게 이어지는 편이 좋아요.',
        profileNote: '단맛이 중심을 차지하기보다 전체 흐름 속에서 부드럽게 어우러질 때 안정감을 느낄 수 있어요.',
        tasteAdjustments: {
          sweet: 0.1,
          sour: 0.1,
          umami: 0.2,
        },
      },
      {
        id: 'rich',
        label: '조금 더 깊고 풍성한 쪽',
        description: '단맛이 여운과 밀도를 남길 때 만족감이 더 커져요.',
        profileNote: '단맛이 조금 더 깊고 둥글게 이어질 때 만족도가 높아질 가능성이 있어 보여요.',
        tasteAdjustments: {
          sweet: 0.6,
          fat: 0.5,
          umami: 0.2,
        },
      },
    ],
  },
  {
    id: 'course-finish',
    eyebrow: '02 Finish Preference',
    title: '코스의 끝맛은\n어떤 방향이 가장 잘 맞나요?',
    description: '마지막 인상이 어떻게 정리될 때 자연스럽게 느껴지는지 확인합니다.',
    calibrationHint: '이 답변은 산미, 감칠맛, 밀도감의 현재 포인트를 보정해요.',
    options: [
      {
        id: 'bright',
        label: '밝고 또렷한 피니시',
        description: '끝맛이 선명하게 정리되면 다음 코스로 넘어가기 좋아요.',
        profileNote: '피니시는 밝고 또렷하게 정리될 때 더 자연스럽게 받아들여질 수 있어요.',
        tasteAdjustments: {
          sour: 0.7,
          salty: 0.3,
          fat: -0.2,
        },
      },
      {
        id: 'soft',
        label: '부드럽고 둥근 피니시',
        description: '끝맛이 매끄럽게 감싸지면 전체 흐름이 편안하게 느껴져요.',
        profileNote: '끝맛은 각이 서기보다 부드럽고 둥글게 이어질 때 더 안정적으로 느껴질 수 있어요.',
        tasteAdjustments: {
          sweet: 0.3,
          fat: 0.6,
        },
      },
      {
        id: 'deep',
        label: '깊고 길게 남는 피니시',
        description: '짧게 끝나기보다 풍미가 조금 더 이어질 때 만족스러워요.',
        profileNote: '감칠맛과 밀도감이 조금 더 길게 이어지는 코스에서 만족도가 높아질 수 있어요.',
        tasteAdjustments: {
          umami: 0.8,
          fat: 0.3,
          bitter: 0.1,
        },
      },
    ],
  },
  {
    id: 'flavor-friction',
    eyebrow: '03 Flavor Friction',
    title: '맛이 쌓일 때,\n어느 지점이 먼저 걸리나요?',
    description: '지금의 컨디션에서 빠르게 부담으로 느껴질 수 있는 포인트를 찾습니다.',
    calibrationHint: '이 답변은 현재 프로필에서 과하게 느껴질 수 있는 포인트를 가볍게 조정해요.',
    options: [
      {
        id: 'sweet-heavy',
        label: '단맛이 먼저 무거워져요',
        description: '후반으로 갈수록 단맛이 빠르게 쌓이면 부담스럽게 느껴져요.',
        profileNote: '후반에 단맛이 빠르게 쌓이는 구성은 조금 더 가볍게 정리하는 편이 잘 맞을 수 있어요.',
        tasteAdjustments: {
          sweet: -0.5,
          sour: 0.2,
          fat: -0.2,
        },
      },
      {
        id: 'acid-sharp',
        label: '산미가 날카롭게 올라와요',
        description: '산미가 한 번에 치고 올라오면 흐름이 끊기는 느낌이 있어요.',
        profileNote: '산미는 강하게 밀어붙이기보다 부드럽게 연결될 때 더 편안하게 느껴질 수 있어요.',
        tasteAdjustments: {
          sour: -0.6,
          sweet: 0.2,
          fat: 0.2,
        },
      },
      {
        id: 'bitter-stands-out',
        label: '쓴맛이 예상보다 도드라져요',
        description: '균형 안에 있어야 할 쓴맛이 먼저 느껴지면 피로하게 다가와요.',
        profileNote: '쓴맛은 또렷하게 강조되기보다 다른 풍미 속에 정리될 때 더 안정적으로 느껴질 수 있어요.',
        tasteAdjustments: {
          bitter: -0.7,
          sweet: 0.2,
          umami: 0.1,
        },
      },
      {
        id: 'salt-lingers',
        label: '짠맛이 길게 남아요',
        description: '간이 맞아도 마지막에 짠 인상이 오래 남으면 아쉬워요.',
        profileNote: '짠맛은 직접적으로 길게 남기보다 다른 풍미와 함께 정리되는 편이 더 잘 맞을 수 있어요.',
        tasteAdjustments: {
          salty: -0.6,
          umami: 0.2,
          sweet: 0.1,
        },
      },
    ],
  },
  {
    id: 'course-memory',
    eyebrow: '04 Dining Memory',
    title: '보통 가장 좋은 인상으로\n남는 코스는 어느 쪽인가요?',
    description: '어떤 전개에서 만족이 높아지는지 확인해 첫 프로필에 반영합니다.',
    calibrationHint: '이 답변은 현재 더 반응하기 쉬운 다이닝 흐름을 반영해요.',
    options: [
      {
        id: 'starter',
        label: '스타터',
        description: '첫 인상이 선명하고 정돈되어 있을 때 가장 기대감이 올라가요.',
        profileNote: '선명한 첫 인상과 가벼운 전개에서 만족이 높아질 가능성이 보여요.',
        tasteAdjustments: {
          sour: 0.5,
          salty: 0.2,
        },
      },
      {
        id: 'seafood-vegetable',
        label: '해산물 또는 채소 코스',
        description: '섬세한 향과 결이 살아 있는 코스가 가장 기억에 남아요.',
        profileNote: '섬세한 향과 선명한 감칠맛이 살아 있는 코스에서 좋은 인상이 남을 수 있어요.',
        tasteAdjustments: {
          umami: 0.5,
          sour: 0.3,
          salty: 0.1,
        },
      },
      {
        id: 'main',
        label: '메인 코스',
        description: '풍미의 밀도와 중심 인상이 분명한 코스에서 만족감이 커져요.',
        profileNote: '중심이 되는 풍미와 밀도감이 살아 있는 메인 코스에서 만족이 높아질 수 있어요.',
        tasteAdjustments: {
          umami: 0.6,
          fat: 0.5,
        },
      },
      {
        id: 'dessert',
        label: '디저트',
        description: '식사의 끝을 정리하는 단맛과 향의 균형이 가장 중요하게 느껴져요.',
        profileNote: '식사의 마지막에 단맛과 여운이 정리되는 방식에서 만족도가 크게 달라질 수 있어요.',
        tasteAdjustments: {
          sweet: 0.6,
          fat: 0.2,
          bitter: 0.1,
        },
      },
    ],
  },
] as const;

export function getQuickTasteCalibrationQuestion(questionId: string) {
  return QUICK_TASTE_CALIBRATION_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getQuickTasteCalibrationSelection(
  responses: QuickTasteCalibrationResponses,
  questionId: string,
) {
  const question = getQuickTasteCalibrationQuestion(questionId);

  if (!question) {
    return null;
  }

  const selectedOptionId = responses[questionId];
  const option = question.options.find((candidate) => candidate.id === selectedOptionId);

  if (!option) {
    return null;
  }

  return { option, question };
}

export function getQuickTasteCalibrationSelections(responses: QuickTasteCalibrationResponses) {
  return QUICK_TASTE_CALIBRATION_QUESTIONS.map((question) =>
    getQuickTasteCalibrationSelection(responses, question.id),
  ).filter((selection): selection is NonNullable<typeof selection> => selection !== null);
}

export function createQuickTasteCalibrationSnapshot(
  responses: QuickTasteCalibrationResponses,
): TasteMeasurementSnapshot {
  const scores = TASTE_IDS.reduce(
    (accumulator, tasteId) => {
      accumulator[tasteId] = TASTE_MEASUREMENT_AVERAGES[tasteId];
      return accumulator;
    },
    {} as Record<TasteId, number>,
  );

  for (const { option } of getQuickTasteCalibrationSelections(responses)) {
    for (const tasteId of TASTE_IDS) {
      const adjustment = option.tasteAdjustments[tasteId];

      if (typeof adjustment === 'number') {
        scores[tasteId] += adjustment;
      }
    }
  }

  const results = TASTE_IDS.reduce(
    (accumulator, tasteId) => {
      accumulator[tasteId] = Number(
        Math.min(STARTER_PROFILE_MAX, Math.max(STARTER_PROFILE_MIN, scores[tasteId])).toFixed(2),
      );
      return accumulator;
    },
    {} as Record<TasteId, number>,
  );

  return createTasteMeasurementSnapshot(results);
}

export function getStarterProfileHighlights(entries: TasteMeasurementEntry[]) {
  const sortedEntries = [...entries].sort((left, right) => right.valueMm - left.valueMm);

  return {
    primary: sortedEntries.slice(0, 2),
    softest: sortedEntries[sortedEntries.length - 1],
  };
}
