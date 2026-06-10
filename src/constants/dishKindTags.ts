export interface DishKindInferenceInput {
  flavorNotes?: readonly string[];
  ingredients?: readonly string[];
  subtitle?: string | null;
  techniques?: readonly string[];
  title?: string | null;
}

export interface DishKindOption {
  id: string;
  label: string;
  keywords: readonly string[];
}

export const DISH_KIND_OPTIONS: readonly DishKindOption[] = [
  {
    id: 'seafood',
    label: '해산물',
    keywords: ['굴', '생선', '금태', '조개', '백합', '해산물', '오징어', '문어', '새우', 'seafood', 'fish', 'oyster'],
  },
  {
    id: 'meat',
    label: '육류',
    keywords: ['한우', '소고기', '오리', '돼지', '양갈비', '갈비', '등갈비', '백립', '립', '닭', '고기', '육향', 'beef', 'duck', 'lamb', 'pork', 'rib', 'ribs'],
  },
  {
    id: 'vegetable_herb',
    label: '채소/허브',
    keywords: ['채소', '나물', '봄동', '더덕', '오이', '허브', '딜', '가니시', 'vegetable', 'herb'],
  },
  {
    id: 'grain_noodle',
    label: '면/곡물',
    keywords: ['메밀', '면', '국수', '카펠리니', '밥', '쌀', '곡물', '타르트 셸', 'grain', 'noodle'],
  },
  {
    id: 'broth',
    label: '국물/브로스',
    keywords: ['육수', '국물', '브로스', 'jus', '쥬', '소스', 'broth', 'stock'],
  },
  {
    id: 'grilled_smoked',
    label: '구이/훈연',
    keywords: ['숯불', '직화', '굽기', '구운', '훈연', '스모키', '불맛', 'grill', 'charcoal', 'smoke'],
  },
  {
    id: 'fermented_jang',
    label: '발효/장',
    keywords: ['된장', '간장', '백간장', '장', '발효', '코지', '미소', 'fermented', 'jang', 'koji', 'miso'],
  },
  {
    id: 'dessert',
    label: '디저트',
    keywords: ['디저트', '아이스크림', '타르트', '캐러멜', '그라니타', '배 콩포트', '단맛', 'dessert', 'ice cream'],
  },
  {
    id: 'cold',
    label: '차가운 요리',
    keywords: ['차가운', '차갑게', '냉', '아이스', '그라니타', 'cold', 'cool'],
  },
  {
    id: 'beverage_pairing',
    label: '음료/페어링',
    keywords: ['음료', '차', '와인', '페어링', '주스', 'beverage', 'pairing', 'wine'],
  },
];

export const CUSTOM_DISH_KIND_PREFIX = 'custom-dish-kind:';

export function getCustomDishKindId(label: string) {
  return `${CUSTOM_DISH_KIND_PREFIX}${label.trim()}`;
}

export function isCustomDishKindId(kindId: string) {
  return kindId.startsWith(CUSTOM_DISH_KIND_PREFIX);
}

export function getDishKindLabel(kindId: string) {
  if (isCustomDishKindId(kindId)) {
    return kindId.slice(CUSTOM_DISH_KIND_PREFIX.length).trim();
  }

  return DISH_KIND_OPTIONS.find((option) => option.id === kindId)?.label ?? kindId;
}

export function getDishKindOption(kindId: string) {
  return DISH_KIND_OPTIONS.find((option) => option.id === kindId) ?? null;
}

export function normalizeDishKindLabels(labels: readonly string[]) {
  const seenLabels = new Set<string>();

  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .filter((label) => {
      const key = label.toLowerCase();

      if (seenLabels.has(key)) {
        return false;
      }

      seenLabels.add(key);
      return true;
    })
    .slice(0, 6);
}

export function resolveDishKindLabels(kindIds: readonly string[], customLabels: readonly string[] = []) {
  return normalizeDishKindLabels([
    ...kindIds.map(getDishKindLabel),
    ...customLabels,
  ]);
}

export function inferDishKindIds(input: DishKindInferenceInput, limit = 4) {
  const searchableText = [
    input.title,
    input.subtitle,
    ...(input.ingredients ?? []),
    ...(input.techniques ?? []),
    ...(input.flavorNotes ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!searchableText.trim()) {
    return [];
  }

  return DISH_KIND_OPTIONS
    .map((option) => ({
      id: option.id,
      score: option.keywords.reduce(
        (sum, keyword) => sum + (searchableText.includes(keyword.toLowerCase()) ? 1 : 0),
        0,
      ),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((candidate) => candidate.id);
}
