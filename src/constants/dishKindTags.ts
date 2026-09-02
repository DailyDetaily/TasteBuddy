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
    keywords: ['굴', '생선', '금태', '조개', '백합', '해산물', '오징어', '문어', '새우', '성게', '해삼', 'seafood', 'fish', 'oyster', 'shellfish', 'shrimp'],
  },
  {
    id: 'meat',
    label: '육류',
    keywords: ['한우', '소고기', '오리', '돼지', '양갈비', '갈비', '등갈비', '백립', '립', '닭', '고기', '육향', 'beef', 'duck', 'lamb', 'pork', 'chicken', 'rib', 'ribs'],
  },
  {
    id: 'vegetable_herb',
    label: '채소/허브',
    keywords: ['채소', '나물', '봄동', '더덕', '오이', '허브', '딜', '가니시', '버섯', '토마토', 'vegetable', 'herb', 'mushroom'],
  },
  {
    id: 'legume_tofu',
    label: '두부/콩',
    keywords: ['두부', '콩', '콩물', '두유', '유바', '템페', '비지', 'tofu', 'soy', 'soybean', 'yuba', 'tempeh'],
  },
  {
    id: 'grain_noodle',
    label: '면/밥/곡물',
    keywords: ['메밀', '면', '국수', '카펠리니', '파스타', '라멘', '우동', '소바', '밥', '쌀', '죽', '리조또', '빵', '곡물', 'grain', 'noodle', 'rice', 'pasta', 'ramen', 'udon', 'soba', 'risotto', 'bread'],
  },
  {
    id: 'dumpling_batter',
    label: '만두/전/반죽',
    keywords: ['만두', '딤섬', '교자', '전', '부침개', '반죽', '크레페', '라비올리', '피에로기', 'dumpling', 'dimsum', 'dim sum', 'gyoza', 'jeon', 'batter', 'dough', 'crepe', 'ravioli'],
  },
  {
    id: 'broth',
    label: '국물/브로스',
    keywords: ['육수', '국물', '브로스', '수프', '탕', '국', '찌개', '스톡', 'broth', 'stock', 'soup', 'consomme', 'stew'],
  },
  {
    id: 'sauce_glaze',
    label: '소스/글레이즈',
    keywords: ['소스', '글레이즈', '리덕션', '쥬', 'jus', '그레이비', '드레싱', '비네그레트', '퓌레', '쿨리', 'sauce', 'glaze', 'reduction', 'gravy', 'dressing', 'vinaigrette', 'puree', 'coulis'],
  },
  {
    id: 'grilled_smoked',
    label: '구이/훈연',
    keywords: ['숯불', '직화', '굽기', '구운', '훈연', '스모키', '불맛', '로스팅', '오븐', 'grill', 'grilled', 'charcoal', 'smoke', 'smoked', 'roasted', 'oven', 'broil', 'bbq'],
  },
  {
    id: 'stir_fried_wok',
    label: '볶음/웍',
    keywords: ['볶음', '볶은', '볶기', '웍', '소테', 'stir-fry', 'stir fried', 'stir-frying', 'wok', 'saute', 'sauteed'],
  },
  {
    id: 'fried_crispy',
    label: '튀김/크리스피',
    keywords: ['튀김', '튀긴', '프라이', '바삭', '크리스피', '덴푸라', '가라아게', '커틀릿', 'fried', 'fry', 'crispy', 'crisp', 'tempura', 'karaage', 'fritter', 'cutlet'],
  },
  {
    id: 'steamed_braised',
    label: '찜/브레이즈',
    keywords: ['찜', '찐', '조림', '졸임', '브레이즈', '라구', '찜닭', '동파육', 'steamed', 'braised', 'braise', 'jorim', 'simmered', 'ragu', 'confit'],
  },
  {
    id: 'raw_cured',
    label: '생/절임/큐어',
    keywords: ['회', '생', '날것', '타르타르', '카르파초', '세비체', '큐어', '절임', '초절임', '숙성회', '마리네', 'raw', 'sashimi', 'tartare', 'carpaccio', 'ceviche', 'cured', 'pickled', 'marinated'],
  },
  {
    id: 'fermented_jang',
    label: '발효/장',
    keywords: ['된장', '간장', '백간장', '장', '발효', '코지', '미소', '고추장', '청국장', '김치', 'fermented', 'jang', 'koji', 'miso', 'soy sauce', 'doenjang', 'gochujang', 'kimchi'],
  },
  {
    id: 'dairy_cheese',
    label: '유제품/치즈',
    keywords: ['치즈', '버터', '크림', '유청', '우유', '요거트', '부라타', '리코타', '마스카포네', 'dairy', 'cheese', 'butter', 'cream', 'whey', 'milk', 'yogurt', 'burrata', 'ricotta', 'mascarpone'],
  },
  {
    id: 'spice_heat',
    label: '향신료/매운맛',
    keywords: ['향신료', '매운맛', '매운', '맵', '고추', '후추', '산초', '마라', '마파', '사천', '생강', '겨자', '와사비', '카레', '칠리', 'spice', 'spicy', 'heat', 'chili', 'pepper', 'mala', 'mapo', 'sichuan', 'ginger', 'wasabi', 'curry'],
  },
  {
    id: 'cold',
    label: '차가운 요리',
    keywords: ['차가운', '차갑게', '차게', '냉', '아이스', '소르베', '그라니타', 'cold', 'cool', 'chilled', 'iced', 'sorbet', 'granita'],
  },
  {
    id: 'dessert',
    label: '디저트',
    keywords: ['디저트', '아이스크림', '타르트', '캐러멜', '그라니타', '소르베', '콩포트', '단맛', '초콜릿', 'dessert', 'ice cream', 'sorbet', 'tart', 'caramel', 'granita', 'compote', 'chocolate'],
  },
  {
    id: 'beverage_pairing',
    label: '음료/페어링',
    keywords: ['음료', '차', '와인', '페어링', '주스', '커피', '칵테일', 'beverage', 'pairing', 'wine', 'tea', 'juice', 'coffee', 'cocktail'],
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
