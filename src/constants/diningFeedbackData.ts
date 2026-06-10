import { inferDishKindIds } from './dishKindTags';
import type { TasteBuddyAgentDiningAnalysisSnapshot } from '../types/tasteBuddyAgent';

export interface DiningFeedbackChoice {
  affectedTastes: string[];
  id: string;
  ingredientPairing: string;
  label: string;
  recommendation: string;
  reason: string;
}

export interface DiningDishMetadata {
  chefIntent: string;
  courseLabel: string;
  feedbackChoices: readonly DiningFeedbackChoice[];
  flavorNotes: readonly string[];
  id: string;
  ingredients: readonly string[];
  subtitle: string;
  techniques: readonly string[];
  title: string;
}

export interface DiningFeedbackScenario {
  completedAt: string;
  courseName: string;
  dishes: readonly DiningDishMetadata[];
  postDiningPrompt: string;
  reservationId: number;
  restaurant: string;
}

export interface DiningDishFeedbackDraft {
  customDishKindLabels?: string[];
  customDetailTags?: Record<string, string[]>;
  feedbackUpdatedAt?: string | null;
  reflectionNote?: string;
  reflectionPhotoName?: string | null;
  reflectionPhotoPreviewUrl?: string | null;
  selectedDishKindIds?: string[];
  selectedDetailTagIds?: string[];
  rating: number;
  selectedChoiceId: string | null;
  selectedExperienceId?: string | null;
  selectedExperienceIds?: string[];
  tbaAnalysisSnapshot?: TasteBuddyAgentDiningAnalysisSnapshot | null;
  tbaAnalysisVersion?: string | null;
  tbaConfidence?: number | null;
  tbaFoodOnMatchIds?: string[];
  tbaLexiconCandidateIds?: string[];
  tbaSignalIds?: string[];
}

export interface DiningFeedbackDraft {
  customDishes?: DiningDishMetadata[];
  dishResponses: Record<string, DiningDishFeedbackDraft>;
  overallComment: string;
  overallRating: number;
  returnIntent: 'yes' | 'maybe' | 'no';
}

export function hasDiningDishFeedbackResponse(
  response: DiningDishFeedbackDraft | null | undefined,
) {
  if (!response) {
    return false;
  }

  const hasSelectedExperience =
    Boolean(response.selectedExperienceId) ||
    (response.selectedExperienceIds?.some(Boolean) ?? false);
  const hasSelectedDetailTag = response.selectedDetailTagIds?.some(Boolean) ?? false;
  const hasCustomDetailTag = Object.values(response.customDetailTags ?? {}).some((labels) =>
    labels.some((label) => label.trim().length > 0),
  );
  const hasReflection =
    Boolean(response.reflectionNote?.trim()) ||
    Boolean(response.reflectionPhotoName) ||
    Boolean(response.reflectionPhotoPreviewUrl);

  return Boolean(
    response.selectedChoiceId ||
      hasSelectedExperience ||
      hasSelectedDetailTag ||
      hasCustomDetailTag ||
      hasReflection,
  );
}

export function createDiningDishFeedbackDraft(
  dish: DiningDishMetadata,
): DiningDishFeedbackDraft {
  return {
    customDetailTags: {},
    customDishKindLabels: [],
    rating: 3,
    reflectionNote: '',
    reflectionPhotoName: null,
    reflectionPhotoPreviewUrl: null,
    selectedChoiceId: null,
    selectedDetailTagIds: [],
    selectedDishKindIds: inferDishKindIds(dish),
    selectedExperienceId: null,
    selectedExperienceIds: [],
    tbaAnalysisSnapshot: null,
    tbaAnalysisVersion: null,
    tbaConfidence: null,
    tbaFoodOnMatchIds: [],
    tbaLexiconCandidateIds: [],
    tbaSignalIds: [],
  };
}

export function createCustomDiningDishMetadata(title: string): DiningDishMetadata {
  const safeTitle = title.trim() || '직접 입력한 메뉴';
  const normalizedId = safeTitle
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'dish';

  return {
    chefIntent: '사용자가 직접 입력한 메뉴입니다. 미각 기록을 바탕으로 다음 다이닝 기준에 반영합니다.',
    courseLabel: '직접 입력',
    feedbackChoices: [
      {
        affectedTastes: ['감칠맛'],
        id: 'custom-dish-note',
        ingredientPairing: '사용자가 남긴 미각 인상을 중심으로 다음 경험을 조율합니다.',
        label: '이 메뉴의 인상을 기록했어요',
        recommendation: '선택한 미각 인상과 디테일 태그를 다음 다이닝 기준에 반영합니다.',
        reason: '직접 입력한 메뉴라 사용자가 남긴 감각 단서가 가장 중요한 기준입니다.',
      },
    ],
    flavorNotes: [],
    id: `custom-dish-${normalizedId}-${Date.now().toString(36)}`,
    ingredients: [],
    subtitle: '직접 입력한 메뉴',
    techniques: [],
    title: safeTitle,
  };
}

export const DINING_FEEDBACK_SCENARIOS: Record<number, DiningFeedbackScenario> = {
  3: {
    completedAt: '2026-03-11T20:40:00+09:00',
    courseName: '한식 모던 코스',
    postDiningPrompt:
      '메뉴의 밸런스와 재료 궁합이 내 미각과 어떻게 맞았는지 남겨주시면, 다음 다이닝을 더 정밀하게 맞출 수 있어요.',
    reservationId: 3,
    restaurant: '정식당',
    dishes: [
      {
        chefIntent:
          '입맛을 깨우는 산미와 해수의 감칠맛을 짧고 선명하게 전달하는 스타터입니다.',
        courseLabel: 'Amuse',
        feedbackChoices: [
          {
            affectedTastes: ['신맛', '감칠맛'],
            id: 'acid-too-sharp',
            ingredientPairing: '유자 코지의 산미를 10% 낮추고 청사과 젤을 더하면 입체감이 살아납니다.',
            label: '산미가 조금 날카로웠어요',
            recommendation:
              '유자 코지 농도를 낮추고 오이 수분감을 늘려 산미와 해수 향을 더 분리해보세요.',
            reason:
              '유자 코지와 백간장 젤의 산미가 한 번에 올라오면서 굴의 감칠맛이 뒤로 밀린 인상입니다.',
          },
          {
            affectedTastes: ['짠맛', '감칠맛'],
            id: 'oyster-aroma-forward',
            ingredientPairing: '오이 브루누아즈와 딜 오일을 늘리면 바다 향이 더 맑게 정리됩니다.',
            label: '굴 향이 먼저 치고 올라왔어요',
            recommendation:
              '딜과 오이의 차가운 허브 톤을 조금 더 키워 굴 향과 유자 향이 겹치지 않게 조정해보세요.',
            reason:
              '첫 코스에서 아이오딘 향이 앞서면서 산뜻하게 시작해야 하는 입구감이 다소 무거워졌습니다.',
          },
          {
            affectedTastes: ['신맛'],
            id: 'starter-balanced',
            ingredientPairing: '현재의 산미와 짠맛 균형이 좋습니다.',
            label: '첫 코스로 가장 좋았어요',
            recommendation: '현재 방향을 유지하되 온도와 식감 대비만 유지해도 좋습니다.',
            reason:
              '산미와 해수 감칠맛이 짧게 정리되면서 다음 코스로 넘어가는 전개가 자연스러웠습니다.',
          },
        ],
        flavorNotes: ['산뜻한 산미', '해수 감칠맛', '차가운 질감'],
        id: 'amuse-oyster-tart',
        ingredients: ['남해안 참굴', '유자 코지', '백간장 젤', '오이 브루누아즈', '메밀 타르트 셸'],
        subtitle: '남해안 참굴 · 유자 코지 · 메밀 타르트 셸',
        techniques: ['저온 절임', '코지 숙성', '젤화', '차갑게 서빙'],
        title: '유자 코지 굴 타르트',
      },
      {
        chefIntent:
          '금태의 지방감에 조개 버터 소스를 겹쳐 고급스러운 밀도를 만들고, 봄동으로 끝맛을 정리한 코스입니다.',
        courseLabel: 'Fish',
        feedbackChoices: [
          {
            affectedTastes: ['지방맛', '짠맛'],
            id: 'butter-too-long',
            ingredientPairing: '레몬 오일과 봄동 절임을 조금 더 올리면 지방감이 더 빨리 정리됩니다.',
            label: '버터감이 길게 남았어요',
            recommendation:
              '조개 버터 소스의 환원 농도를 낮추고 산도가 있는 채소 피니시를 보강해보세요.',
            reason:
              '금태의 자체 지방과 조개 버터 소스가 겹치면서 입안에서 무게감이 예상보다 오래 남았습니다.',
          },
          {
            affectedTastes: ['감칠맛', '짠맛'],
            id: 'finish-too-short',
            ingredientPairing: '백합 육수를 조금 더 농축하면 생선 뒤의 감칠맛 길이가 늘어납니다.',
            label: '피니시가 생각보다 짧았어요',
            recommendation:
              '버터보다는 조개 육수의 볼륨을 늘려 금태의 풍미가 끝까지 이어지게 조정해보세요.',
            reason:
              '전반의 볼륨은 충분했지만 소스의 감칠맛이 짧아 생선 자체의 인상이 빠르게 사라졌습니다.',
          },
          {
            affectedTastes: ['감칠맛', '지방맛'],
            id: 'fish-balanced',
            ingredientPairing: '현재의 버터-조개-봄동 조합이 안정적입니다.',
            label: '지금 밸런스가 딱 좋았어요',
            recommendation: '현재 조합을 유지하되 봄동의 식감 대비를 계속 살리는 편이 좋습니다.',
            reason:
              '버터의 밀도와 봄동의 정리감이 맞물려 생선 코스다운 풍성함이 자연스럽게 전달되었습니다.',
          },
        ],
        flavorNotes: ['버터리한 질감', '조개 감칠맛', '구운 향'],
        id: 'fish-kinmedai',
        ingredients: ['금태', '봄동', '백합 조개', '버터', '미소', '레몬 오일'],
        subtitle: '숯불 금태 · 봄동 · 조개 버터 소스',
        techniques: ['숯불 굽기', '버터 바스팅', '육수 환원', '채소 절임'],
        title: '숯불 금태와 봄동',
      },
      {
        chefIntent:
          '육향, 발효 감칠맛, 직화 향을 겹쳐 코스의 중심 무게를 만드는 메인 디시입니다.',
        courseLabel: 'Main',
        feedbackChoices: [
          {
            affectedTastes: ['감칠맛', '지방맛'],
            id: 'umami-flat',
            ingredientPairing: '된장 jus에 표고 농축액이나 흑마늘을 조금 더해 감칠맛의 길이를 늘릴 수 있습니다.',
            label: '감칠맛이 기대보다 짧았어요',
            recommendation:
              '된장 jus의 깊이를 조금 더 키우고 버섯 듀셀의 농축도를 올려 코스의 중심 인상을 더 분명하게 만들어보세요.',
            reason:
              '고기의 육향은 충분했지만 발효된장과 버섯에서 기대한 깊은 감칠맛이 짧게 끝난 인상입니다.',
          },
          {
            affectedTastes: ['쓴맛', '지방맛'],
            id: 'smoke-over',
            ingredientPairing: '더덕의 쌉싸름함을 살리고 훈연은 한 단계 낮추면 재료 분리가 더 잘 됩니다.',
            label: '훈연향이 재료를 덮었어요',
            recommendation:
              '직화 향을 줄이고 더덕과 능이버섯의 개별 향을 더 드러내는 방향으로 조정해보세요.',
            reason:
              '숯향이 메인의 인상을 주도하면서 된장 jus와 더덕의 개성이 상대적으로 묻혔습니다.',
          },
          {
            affectedTastes: ['감칠맛', '지방맛'],
            id: 'main-balanced',
            ingredientPairing: '직화 향과 발효 감칠맛의 균형이 좋습니다.',
            label: '메인으로 가장 만족스러웠어요',
            recommendation: '현재 중심 인상은 유지하되 가니시의 산뜻한 포인트만 미세 조정하면 좋습니다.',
            reason:
              '고기, 버섯, 된장의 세 가지 포인트가 균형 있게 올라오며 메인 코스로서의 존재감이 충분했습니다.',
          },
        ],
        flavorNotes: ['육향', '발효 감칠맛', '직화 향', '묵직한 피니시'],
        id: 'main-hanwoo',
        ingredients: ['한우 채끝', '더덕', '능이버섯', '된장 jus', '흑마늘 퓌레'],
        subtitle: '한우 채끝 · 더덕 · 된장 jus',
        techniques: ['직화 시어링', 'jus 환원', '버섯 듀셀', '숯불 향 입히기'],
        title: '한우 채끝과 더덕',
      },
      {
        chefIntent:
          '고소한 흑임자와 배의 수분감으로 식사의 끝을 부드럽게 닫되, 한국적인 곡물 향을 남기는 디저트입니다.',
        courseLabel: 'Dessert',
        feedbackChoices: [
          {
            affectedTastes: ['단맛', '지방맛'],
            id: 'sweet-front',
            ingredientPairing: '배 콩포트 당도를 낮추고 청사과 그라니타를 더하면 단맛이 앞서지 않습니다.',
            label: '단맛이 먼저 치고 올라왔어요',
            recommendation:
              '조청 캐러멜과 배 콩포트의 당도 중첩을 줄이고 산미 있는 과일 요소를 보강해보세요.',
            reason:
              '배 콩포트의 당도와 흑임자 아이스크림의 고소함이 겹치면서 마무리에서 단맛이 예상보다 먼저 인지되었습니다.',
          },
          {
            affectedTastes: ['신맛', '지방맛'],
            id: 'acid-missing',
            ingredientPairing: '배즙 대신 매실 또는 청사과 그라니타를 쓰면 끝맛이 더 살아납니다.',
            label: '고소함은 좋지만 산미가 부족했어요',
            recommendation:
              '곡물 향은 유지하되 디저트 마무리에 작은 산미 포인트를 넣어 후반 무게를 덜어내는 편이 좋습니다.',
            reason:
              '전체 코스 후반의 지방감과 고소함을 정리할 산미가 부족해 마무리가 다소 평평하게 느껴졌습니다.',
          },
          {
            affectedTastes: ['단맛', '지방맛'],
            id: 'dessert-balanced',
            ingredientPairing: '현재의 배-흑임자 조합이 안정적입니다.',
            label: '식사의 끝맛과 잘 이어졌어요',
            recommendation: '현재 콘셉트를 유지하되 식감 대비만 계속 살리면 좋습니다.',
            reason:
              '고소함과 수분감이 충돌 없이 이어지면서 코스의 끝을 부드럽게 닫아주는 역할을 잘 수행했습니다.',
          },
        ],
        flavorNotes: ['고소함', '부드러운 단맛', '곡물 향', '차가운 마무리'],
        id: 'dessert-black-sesame',
        ingredients: ['흑임자 아이스크림', '배 콩포트', '메밀 튀일', '배즙 그라니타', '조청 캐러멜'],
        subtitle: '흑임자 · 배 콩포트 · 메밀 튀일',
        techniques: ['아이스크림 churn', '저온 콩포트', '튀일 베이킹', '그라니타'],
        title: '흑임자 아이스크림과 배 콩포트',
      },
    ],
  },
};

export function getDiningFeedbackScenario(reservationId: number) {
  return DINING_FEEDBACK_SCENARIOS[reservationId] ?? null;
}

export function createDiningFeedbackDraft(
  scenario: DiningFeedbackScenario,
): DiningFeedbackDraft {
  const defaultDishResponses = scenario.dishes.reduce<Record<string, DiningDishFeedbackDraft>>(
    (responses, dish) => {
      responses[dish.id] = createDiningDishFeedbackDraft(dish);
      return responses;
    },
    {},
  );

  return {
    customDishes: [],
    dishResponses: defaultDishResponses,
    overallComment: '',
    overallRating: 3,
    returnIntent: 'maybe',
  };
}
