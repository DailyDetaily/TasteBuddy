export type PreferenceIntakeQuestionId =
  | 'allergies'
  | 'dietaryRestrictions'
  | 'preferredCuisineTypes'
  | 'avoidedSignals'
  | 'flavorIntensityPreference'
  | 'explorationStyle'
  | 'sharePreferenceWithRestaurant';

export type PreferenceIntakeSelectionMode = 'single' | 'multiple';

export type FlavorIntensityOption =
  | 'very-light'
  | 'light'
  | 'balanced'
  | 'rich'
  | 'very-rich';

export type ExplorationStyleOption = 'familiar' | 'balanced' | 'adventurous';

export type SharePreferenceWithRestaurantOption =
  | 'safety-only'
  | 'summary-ok'
  | 'preview-first';

export interface PreferenceIntakeOption {
  description: string;
  id: string;
  label: string;
}

export interface PreferenceIntakeQuestion {
  description: string;
  eyebrow: string;
  gridColumns?: 1 | 2;
  helperText?: string;
  id: PreferenceIntakeQuestionId;
  maxSelections?: number;
  minSelections?: number;
  noneOptionId?: string;
  options: readonly PreferenceIntakeOption[];
  selectionMode: PreferenceIntakeSelectionMode;
  title: string;
}

export interface PreferenceIntakeResponses {
  allergies: string[];
  avoidedSignals: string[];
  dietaryRestrictions: string[];
  explorationStyle: ExplorationStyleOption | null;
  flavorIntensityPreference: FlavorIntensityOption | null;
  preferredCuisineTypes: string[];
  sharePreferenceWithRestaurant: SharePreferenceWithRestaurantOption | null;
}

export interface PreferenceIntakeProfile {
  allergies: string[];
  avoidedSignals: string[];
  dietaryRestrictions: string[];
  explorationStyle: ExplorationStyleOption | null;
  flavorIntensityPreference: FlavorIntensityOption | null;
  preferredCuisineTypes: string[];
  sharePreferenceWithRestaurant: SharePreferenceWithRestaurantOption | null;
}

const NONE_OPTION_IDS = {
  allergies: 'allergies-none',
  avoidedSignals: 'avoided-signals-none',
  dietaryRestrictions: 'dietary-restrictions-none',
} as const;

const FLAVOR_INTENSITY_OPTIONS = [
  'very-light',
  'light',
  'balanced',
  'rich',
  'very-rich',
] as const satisfies readonly FlavorIntensityOption[];

const EXPLORATION_STYLE_OPTIONS = [
  'familiar',
  'balanced',
  'adventurous',
] as const satisfies readonly ExplorationStyleOption[];

const SHARE_PREFERENCE_OPTIONS = [
  'safety-only',
  'summary-ok',
  'preview-first',
] as const satisfies readonly SharePreferenceWithRestaurantOption[];

export const PREFERENCE_INTAKE_QUESTIONS: readonly PreferenceIntakeQuestion[] = [
  {
    id: 'allergies',
    eyebrow: '01 Safety',
    title: '먹으면 불편해지거나 꼭 피해야 하는 재료가 있나요?',
    description: '먼저 피해야 할 것을 알아야 첫 추천과 예약 준비가 안전해져요.',
    helperText: '복수 선택 가능',
    selectionMode: 'multiple',
    noneOptionId: NONE_OPTION_IDS.allergies,
    gridColumns: 1,
    options: [
      {
        id: NONE_OPTION_IDS.allergies,
        label: '없어요',
        description: '현재 꼭 피해야 하는 재료는 없어요.',
      },
      {
        id: 'shellfish',
        label: '갑각류',
        description: '새우, 게, 랍스터처럼 껍질이 있는 해산물은 피해야 해요.',
      },
      {
        id: 'tree-nuts',
        label: '견과류',
        description: '아몬드, 호두, 피스타치오 등은 주의가 필요해요.',
      },
      {
        id: 'dairy',
        label: '유제품',
        description: '우유, 버터, 크림, 치즈 계열은 조심해야 해요.',
      },
      {
        id: 'egg',
        label: '달걀',
        description: '달걀이나 달걀 기반 소스는 피해야 해요.',
      },
      {
        id: 'gluten',
        label: '밀 / 글루텐',
        description: '밀가루와 글루텐이 들어간 메뉴는 피하는 편이에요.',
      },
      {
        id: 'fish',
        label: '생선',
        description: '생선 자체나 생선 육수도 조심해야 해요.',
      },
      {
        id: 'soy',
        label: '대두',
        description: '간장, 된장, 두부처럼 대두 기반 재료를 피해야 해요.',
      },
    ],
  },
  {
    id: 'dietaryRestrictions',
    eyebrow: '02 Dining Rule',
    title: '평소 지키는 식사 원칙이 있나요?',
    description: '이 답변은 추천 가능한 레스토랑과 메뉴 폭을 먼저 좁히는 데 쓰여요.',
    helperText: '복수 선택 가능',
    selectionMode: 'multiple',
    noneOptionId: NONE_OPTION_IDS.dietaryRestrictions,
    gridColumns: 1,
    options: [
      {
        id: NONE_OPTION_IDS.dietaryRestrictions,
        label: '없어요',
        description: '지금은 특별히 지키는 식사 원칙이 없어요.',
      },
      {
        id: 'vegetarian-forward',
        label: '채식 위주',
        description: '가능하면 채소 중심으로 식사하고 싶어요.',
      },
      {
        id: 'vegan',
        label: '비건',
        description: '동물성 재료를 가능한 한 피하고 싶어요.',
      },
      {
        id: 'pescatarian',
        label: '페스코',
        description: '육류보다는 해산물 중심 식사가 더 편해요.',
      },
      {
        id: 'no-pork',
        label: '돼지고기 제외',
        description: '돼지고기가 들어간 메뉴는 피하고 싶어요.',
      },
      {
        id: 'no-beef',
        label: '소고기 제외',
        description: '소고기가 들어간 메뉴는 피하고 싶어요.',
      },
      {
        id: 'gluten-conscious',
        label: '글루텐 프리 지향',
        description: '밀가루 기반 메뉴는 가능한 한 피하는 편이에요.',
      },
      {
        id: 'halal-oriented',
        label: '할랄 지향',
        description: '식사 원칙상 허용 가능한 재료를 중요하게 봐요.',
      },
    ],
  },
  {
    id: 'preferredCuisineTypes',
    eyebrow: '03 Starter Prior',
    title: '평소 더 편안하게 즐기는 요리 종류를 골라주세요',
    description: '첫 추천의 출발점을 잡기 위한 질문이에요. 나중에 언제든 바꿀 수 있어요.',
    helperText: '한 가지 이상, 최대 5개 선택',
    selectionMode: 'multiple',
    minSelections: 1,
    maxSelections: 5,
    gridColumns: 2,
    options: [
      {
        id: 'korean-course',
        label: '한식 코스',
        description: '한식의 익숙한 결을 코스 형태로 즐기는 편이에요.',
      },
      {
        id: 'japanese-omakase',
        label: '일식 오마카세',
        description: '재료 중심의 섬세한 흐름이 편안하게 느껴져요.',
      },
      {
        id: 'french',
        label: '프렌치',
        description: '소스와 구성, 정제된 플레이트를 즐기는 편이에요.',
      },
      {
        id: 'italian',
        label: '이탈리안',
        description: '풍미의 중심이 분명한 코스나 파스타 전개가 좋아요.',
      },
      {
        id: 'chinese-dining',
        label: '중식 다이닝',
        description: '향과 열감, 전개가 분명한 식사를 선호해요.',
      },
      {
        id: 'steakhouse',
        label: '스테이크하우스',
        description: '직관적인 중심 풍미와 단단한 메인 구성이 좋아요.',
      },
      {
        id: 'wine-bar-dining',
        label: '와인바 다이닝',
        description: '가볍게 흐르지만 개성 있는 페어링 경험을 좋아해요.',
      },
      {
        id: 'seafood-forward',
        label: '해산물 중심',
        description: '해산물의 질감과 향 차이를 즐기는 편이에요.',
      },
      {
        id: 'grill-fire',
        label: '숯불 / 그릴 중심',
        description: '불향과 직선적인 풍미가 있는 식사가 편안해요.',
      },
      {
        id: 'dessert-led',
        label: '디저트가 좋은 코스',
        description: '식사의 마무리 완성도가 전체 인상에 크게 중요해요.',
      },
    ],
  },
  {
    id: 'avoidedSignals',
    eyebrow: '04 Friction',
    title: '알러지는 아니지만 자주 피하거나 아쉬웠던 요소가 있나요?',
    description: '이 답변은 첫 추천에서 실패 확률을 줄이는 데 먼저 반영돼요.',
    helperText: '복수 선택 가능',
    selectionMode: 'multiple',
    noneOptionId: NONE_OPTION_IDS.avoidedSignals,
    gridColumns: 1,
    options: [
      {
        id: NONE_OPTION_IDS.avoidedSignals,
        label: '딱히 없어요',
        description: '지금은 특별히 피하고 싶은 요소가 떠오르지 않아요.',
      },
      {
        id: 'high-acidity',
        label: '강한 산미',
        description: '산미가 너무 앞으로 나오면 피로하게 느껴질 때가 있어요.',
      },
      {
        id: 'heavy-butter',
        label: '짙은 버터감',
        description: '버터나 유지감이 너무 두꺼우면 부담스러워요.',
      },
      {
        id: 'offal',
        label: '내장류',
        description: '향이나 질감 때문에 선호하지 않는 편이에요.',
      },
      {
        id: 'raw-seafood-texture',
        label: '강한 생식감',
        description: '날것의 질감이 강하면 편안하지 않을 때가 있어요.',
      },
      {
        id: 'strong-herbs',
        label: '강한 허브 향',
        description: '허브 향이 전면에 나오면 다른 맛이 가려질 때가 있어요.',
      },
      {
        id: 'very-spicy',
        label: '아주 매운 음식',
        description: '매운 자극이 강해지면 전체 식사를 편하게 즐기기 어려워요.',
      },
    ],
  },
  {
    id: 'flavorIntensityPreference',
    eyebrow: '05 Intensity',
    title: '첫 추천은 어느 정도의 풍미 강도가 편안한가요?',
    description: '처음 제안할 메뉴와 레스토랑의 무게감을 과하지 않게 맞추는 데 쓰여요.',
    helperText: '한 가지를 골라주세요',
    selectionMode: 'single',
    gridColumns: 1,
    options: [
      {
        id: 'very-light',
        label: '맑고 가벼운 쪽이 좋아요',
        description: '육수나 산뜻한 소스처럼 끝맛이 깨끗한 구성이 더 편안해요.',
      },
      {
        id: 'light',
        label: '대체로 가벼운 쪽',
        description: '무겁지 않되 적당한 포인트가 있는 식사가 좋아요.',
      },
      {
        id: 'balanced',
        label: '균형이 좋으면 돼요',
        description: '맑음과 진함 어느 한쪽보다 전체 밸런스가 더 중요해요.',
      },
      {
        id: 'rich',
        label: '조금 진한 쪽이 좋아요',
        description: '버터감, 구이향, 농도감이 어느 정도 있어야 만족스러워요.',
      },
      {
        id: 'very-rich',
        label: '분명히 진한 쪽이 좋아요',
        description: '소스, 불향, 숙성감처럼 존재감 있는 풍미가 더 끌려요.',
      },
    ],
  },
  {
    id: 'explorationStyle',
    eyebrow: '06 Exploration',
    title: '낯선 스타일의 식사도 즐겨보는 편인가요?',
    description: '추천 결과를 설명할 때, 안정감을 강조할지 새로움을 강조할지 정하는 데 쓰여요.',
    helperText: '한 가지를 골라주세요',
    selectionMode: 'single',
    gridColumns: 1,
    options: [
      {
        id: 'familiar',
        label: '익숙한 스타일이 좋아요',
        description: '너무 낯선 전개보다는 안정적으로 좋은 경험이 더 중요해요.',
      },
      {
        id: 'balanced',
        label: '반반이에요',
        description: '익숙함과 새로움이 적절히 섞여 있으면 가장 편안해요.',
      },
      {
        id: 'adventurous',
        label: '새로운 시도도 기대돼요',
        description: '완전히 새로운 스타일이라도 이유가 있으면 즐길 수 있어요.',
      },
    ],
  },
  {
    id: 'sharePreferenceWithRestaurant',
    eyebrow: '07 Sharing',
    title: '예약 준비에는 어느 정도까지 반영해도 괜찮을까요?',
    description: '안전 정보와 취향 정보는 같은 강도로 공유되지 않아요. 먼저 선호 범위를 정해둘게요.',
    helperText: '한 가지를 골라주세요',
    selectionMode: 'single',
    gridColumns: 1,
    options: [
      {
        id: 'safety-only',
        label: '안전 정보만 먼저 공유',
        description: '알러지나 식이제한처럼 꼭 필요한 정보만 전달해요.',
      },
      {
        id: 'summary-ok',
        label: '요약된 취향까지 공유',
        description: '안전 정보와 함께 짧은 취향 요약도 전달해도 괜찮아요.',
      },
      {
        id: 'preview-first',
        label: '먼저 보여주고 확인받기',
        description: '무엇을 전달할지 내가 보고 확인한 뒤 공유하고 싶어요.',
      },
    ],
  },
] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isNullableOption<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T | null {
  return value === null || (typeof value === 'string' && allowedValues.includes(value as T));
}

export function createInitialPreferenceIntakeResponses(): PreferenceIntakeResponses {
  return {
    allergies: [],
    avoidedSignals: [],
    dietaryRestrictions: [],
    explorationStyle: null,
    flavorIntensityPreference: null,
    preferredCuisineTypes: [],
    sharePreferenceWithRestaurant: null,
  };
}

export function createPreferenceIntakeResponsesFromProfile(
  profile: PreferenceIntakeProfile | null,
): PreferenceIntakeResponses {
  if (!profile) {
    return createInitialPreferenceIntakeResponses();
  }

  return {
    allergies:
      profile.allergies.length > 0 ? profile.allergies : [NONE_OPTION_IDS.allergies],
    avoidedSignals:
      profile.avoidedSignals.length > 0
        ? profile.avoidedSignals
        : [NONE_OPTION_IDS.avoidedSignals],
    dietaryRestrictions:
      profile.dietaryRestrictions.length > 0
        ? profile.dietaryRestrictions
        : [NONE_OPTION_IDS.dietaryRestrictions],
    explorationStyle: profile.explorationStyle,
    flavorIntensityPreference:
      isNullableOption(
        (profile as PreferenceIntakeProfile & { flavorIntensityPreference?: unknown })
          .flavorIntensityPreference,
        FLAVOR_INTENSITY_OPTIONS,
      )
        ? (profile as PreferenceIntakeProfile & {
            flavorIntensityPreference?: FlavorIntensityOption | null;
          }).flavorIntensityPreference ?? null
        : null,
    preferredCuisineTypes: profile.preferredCuisineTypes,
    sharePreferenceWithRestaurant: profile.sharePreferenceWithRestaurant,
  };
}

function sanitizeMultipleValue(question: PreferenceIntakeQuestion, selections: string[]) {
  if (!question.noneOptionId) {
    return selections;
  }

  return selections.filter((selection) => selection !== question.noneOptionId);
}

export function buildPreferenceIntakeProfile(
  responses: PreferenceIntakeResponses,
): PreferenceIntakeProfile {
  const questionsById = new Map(
    PREFERENCE_INTAKE_QUESTIONS.map((question) => [question.id, question]),
  );

  return {
    allergies: sanitizeMultipleValue(
      questionsById.get('allergies')!,
      responses.allergies,
    ),
    avoidedSignals: sanitizeMultipleValue(
      questionsById.get('avoidedSignals')!,
      responses.avoidedSignals,
    ),
    dietaryRestrictions: sanitizeMultipleValue(
      questionsById.get('dietaryRestrictions')!,
      responses.dietaryRestrictions,
    ),
    explorationStyle: responses.explorationStyle,
    flavorIntensityPreference: responses.flavorIntensityPreference,
    preferredCuisineTypes: responses.preferredCuisineTypes,
    sharePreferenceWithRestaurant: responses.sharePreferenceWithRestaurant,
  };
}

export function isPreferenceIntakeProfile(value: unknown): value is PreferenceIntakeProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as PreferenceIntakeProfile;

  return (
    isStringArray(profile.allergies) &&
    isStringArray(profile.avoidedSignals) &&
    isStringArray(profile.dietaryRestrictions) &&
    isStringArray(profile.preferredCuisineTypes) &&
    (profile.flavorIntensityPreference === undefined ||
      isNullableOption(profile.flavorIntensityPreference, FLAVOR_INTENSITY_OPTIONS)) &&
    isNullableOption(profile.explorationStyle, EXPLORATION_STYLE_OPTIONS) &&
    isNullableOption(profile.sharePreferenceWithRestaurant, SHARE_PREFERENCE_OPTIONS)
  );
}

export function getNextPreferenceMultiSelectValue(
  question: PreferenceIntakeQuestion,
  currentValue: string[],
  optionId: string,
): string[] {
  const maxSelections = question.maxSelections ?? Number.POSITIVE_INFINITY;
  const noneOptionId = question.noneOptionId;
  const hasSelection = currentValue.includes(optionId);

  if (hasSelection) {
    return currentValue.filter((selection) => selection !== optionId);
  }

  if (noneOptionId && optionId === noneOptionId) {
    return [noneOptionId];
  }

  const baseSelections = noneOptionId
    ? currentValue.filter((selection) => selection !== noneOptionId)
    : [...currentValue];

  if (baseSelections.length >= maxSelections) {
    return baseSelections;
  }

  return [...baseSelections, optionId];
}

export function isPreferenceQuestionAnswered(
  question: PreferenceIntakeQuestion,
  responses: PreferenceIntakeResponses,
): boolean {
  const value = responses[question.id];

  if (question.selectionMode === 'single') {
    return typeof value === 'string' && value.length > 0;
  }

  return Array.isArray(value) && value.length >= (question.minSelections ?? 1);
}
