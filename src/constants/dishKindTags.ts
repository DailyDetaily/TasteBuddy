export interface DishKindInferenceInput {
  flavorNotes?: readonly string[];
  ingredients?: readonly string[];
  subtitle?: string | null;
  techniques?: readonly string[];
  title?: string | null;
}

export type DishKindGroup = 'ingredient' | 'form' | 'method' | 'attribute' | 'legacy';

export interface DishKindOption {
  id: string;
  label: string;
  group: DishKindGroup;
  keywords: readonly string[];
}

export const DISH_KIND_TAXONOMY_VERSION = 'dish-kind/2';
export const DISH_KIND_GROUPS = [
  { id: 'ingredient', label: '주요 재료' },
  { id: 'form', label: '요리 형태' },
  { id: 'method', label: '조리·처리' },
  { id: 'attribute', label: '특성' },
] as const;

export const DISH_KIND_OPTIONS: readonly DishKindOption[] = [
  {
    id: "seafood",
    label: "해산물",
    group: "ingredient",
    keywords: ["굴", "생선", "연어", "참치", "광어", "고등어", "전복", "낙지", "게", "금태", "조개", "백합", "해산물", "오징어", "문어", "새우", "성게", "해삼", "seafood", "fish", "oyster", "shellfish", "shrimp", "굴찜", "굴전", "굴구이", "생굴"],
  },
  {
    id: "meat",
    label: "육류",
    group: "ingredient",
    keywords: ["한우", "소고기", "육회", "오리", "돼지", "양갈비", "갈비", "등갈비", "백립", "립", "닭", "고기", "육향", "beef", "duck", "lamb", "pork", "chicken", "rib", "ribs"],
  },
  {
    id: "vegetable_herb",
    label: "채소/허브",
    group: "ingredient",
    keywords: ["채소", "나물", "봄동", "더덕", "오이", "허브", "딜", "가니시", "토마토", "vegetable", "herb"],
  },
  {
    id: "legume_tofu",
    label: "두부/콩",
    group: "ingredient",
    keywords: ["두부", "콩", "콩물", "두유", "유바", "템페", "비지", "tofu", "soy", "soybean", "yuba", "tempeh", "검은콩", "완두콩", "병아리콩", "렌틸콩", "서리태", "낫토"],
  },
  {
    id: "egg",
    label: "달걀",
    group: "ingredient",
    keywords: ["달걀", "계란", "수란", "오믈렛", "오믈레트", "스크램블", "난류", "egg", "eggs", "omelette", "omelet", "frittata"],
  },
  {
    id: "mushroom",
    label: "버섯",
    group: "ingredient",
    keywords: ["버섯", "표고", "송이", "양송이", "느타리", "트러플", "mushroom", "shiitake", "truffle"],
  },
  {
    id: "fruit",
    label: "과일",
    group: "ingredient",
    keywords: ["과일", "사과", "딸기", "바나나", "복숭아", "감귤", "귤", "오렌지", "포도", "망고", "배", "레몬", "라임", "유자", "자두", "살구", "체리", "블루베리", "fruit", "apple", "strawberry", "peach", "citrus", "pear", "mango", "lemon", "lime"],
  },
  {
    id: "nut_seed",
    label: "견과·씨앗",
    group: "ingredient",
    keywords: ["견과", "씨앗", "땅콩", "아몬드", "호두", "잣", "피스타치오", "헤이즐넛", "캐슈", "참깨", "들깨", "깨", "해바라기씨", "호박씨", "nut", "nuts", "seed", "seeds", "peanut", "almond", "walnut", "pistachio", "hazelnut", "cashew", "sesame"],
  },
  {
    id: "seaweed",
    label: "해조류",
    group: "ingredient",
    keywords: ["해조류", "해조", "미역", "다시마", "김", "톳", "매생이", "감태", "파래", "모자반", "seaweed", "kelp", "nori", "wakame"],
  },
  {
    id: "dairy_cheese",
    label: "유제품/치즈",
    group: "ingredient",
    keywords: ["치즈", "버터", "크림", "유청", "우유", "요거트", "부라타", "리코타", "마스카포네", "dairy", "cheese", "butter", "cream", "whey", "milk", "yogurt", "burrata", "ricotta", "mascarpone"],
  },
  {
    id: "spice",
    label: "향신료",
    group: "ingredient",
    keywords: ["향신료", "고추", "후추", "산초", "생강", "겨자", "와사비", "계피", "정향", "큐민", "커민", "카다멈", "강황", "팔각", "카레", "칠리", "spice", "spices", "chili", "pepper", "ginger", "wasabi", "curry", "cinnamon", "cumin", "cardamom", "clove", "turmeric"],
  },
  {
    id: "noodle",
    label: "면류",
    group: "form",
    keywords: ["면", "국수", "카펠리니", "파스타", "라멘", "라면", "우동", "소바", "냉면", "쫄면", "밀면", "칼국수", "쌀국수", "스파게티", "링귀니", "페투치네", "noodle", "noodles", "pasta", "ramen", "udon", "soba", "spaghetti", "linguine", "짜장면", "자장면", "짬뽕", "비빔면", "탄탄면"],
  },
  {
    id: "rice_grain",
    label: "밥·곡물",
    group: "form",
    keywords: ["밥", "쌀", "죽", "곡물", "곡류", "잡곡", "현미", "보리", "퀴노아", "오트밀", "쌀밥", "현미밥", "보리밥", "솥밥", "덮밥", "볶음밥", "비빔밥", "주먹밥", "초밥", "김밥", "리조또", "전복죽", "쌀죽", "rice", "grain", "grains", "porridge", "risotto", "oatmeal", "quinoa", "barley", "호박죽", "닭죽", "흰죽", "영양밥", "잡곡밥"],
  },
  {
    id: "bread",
    label: "빵",
    group: "form",
    keywords: ["빵", "브리오슈", "바게트", "포카치아", "사워도우", "크루아상", "크로와상", "토스트", "베이글", "스콘", "bread", "toast", "bagel", "brioche", "baguette", "croissant", "focaccia", "sourdough", "scone", "소금빵", "식빵", "마늘빵", "단팥빵", "호밀빵", "통밀빵", "모닝빵"],
  },
  {
    id: "dumpling",
    label: "만두",
    group: "form",
    keywords: ["만두", "딤섬", "교자", "라비올리", "피에로기", "dumpling", "dumplings", "dimsum", "dim sum", "gyoza", "ravioli", "pierogi"],
  },
  {
    id: "pancake",
    label: "전·부침",
    group: "form",
    keywords: ["전", "부침", "부침개", "파전", "김치전", "감자전", "빈대떡", "팬케이크", "크레페", "pancake", "pancakes", "jeon", "crepe"],
  },
  {
    id: "broth",
    label: "국물/브로스",
    group: "form",
    keywords: ["육수", "국물", "브로스", "수프", "탕", "국", "찌개", "스톡", "broth", "stock", "soup", "consomme", "stew", "국밥", "해장국", "미역국", "된장국", "떡국", "곰탕", "설렁탕", "삼계탕", "매운탕", "갈비탕", "추어탕", "육개장"],
  },
  {
    id: "sauce_glaze",
    label: "소스/글레이즈",
    group: "form",
    keywords: ["소스", "글레이즈", "리덕션", "쥬", "jus", "그레이비", "드레싱", "비네그레트", "퓌레", "쿨리", "sauce", "glaze", "reduction", "gravy", "dressing", "vinaigrette", "puree", "coulis"],
  },
  {
    id: "grilled",
    label: "구이",
    group: "method",
    keywords: ["구이", "구운", "굽기", "숯불", "직화", "구워", "로스팅", "오븐", "그릴", "grill", "grilled", "charcoal", "roasted", "roast", "oven", "broil", "bbq"],
  },
  {
    id: "smoked",
    label: "훈연",
    group: "method",
    keywords: ["훈연", "훈제", "스모크", "smoked", "smoking", "smoke"],
  },
  {
    id: "stir_fried_wok",
    label: "볶음/웍",
    group: "method",
    keywords: ["볶음", "볶은", "볶기", "웍", "소테", "stir-fry", "stir fried", "stir-frying", "wok", "saute", "sauteed"],
  },
  {
    id: "fried_crispy",
    label: "튀김/크리스피",
    group: "method",
    keywords: ["튀김", "튀긴", "프라이", "바삭", "크리스피", "덴푸라", "가라아게", "커틀릿", "fried", "fry", "crispy", "crisp", "tempura", "karaage", "fritter", "cutlet"],
  },
  {
    id: "steamed",
    label: "찜·스팀",
    group: "method",
    keywords: ["찜", "찐", "찌기", "스팀", "증기", "수증기", "쪄낸", "찐만두", "만두찜", "계란찜", "달걀찜", "생선찜", "조개찜", "대게찜", "steamed", "steam", "새우찜", "굴찜"],
  },
  {
    id: "braised",
    label: "조림·브레이즈",
    group: "method",
    keywords: ["조림", "졸임", "브레이즈", "라구", "갈비찜", "찜닭", "김치찜", "동파육", "braised", "braise", "jorim", "simmered", "ragu"],
  },
  {
    id: "raw",
    label: "회·생식",
    group: "method",
    keywords: ["회", "육회", "생식", "날것", "사시미", "타르타르", "타타르", "카르파초", "세비체", "숙성회", "생굴", "생선회", "연어회", "참치회", "광어회", "모둠회", "모듬회", "raw", "sashimi", "tartare", "carpaccio", "ceviche"],
  },
  {
    id: "pickled",
    label: "절임",
    group: "method",
    keywords: ["절임", "초절임", "피클", "장아찌", "피클링", "pickled", "pickle", "pickles", "pickling"],
  },
  {
    id: "cured",
    label: "염장·큐어",
    group: "method",
    keywords: ["큐어", "큐어링", "염장", "그라브락스", "생햄", "프로슈토", "하몽", "판체타", "cured", "curing", "gravlax", "prosciutto", "jamon", "pancetta"],
  },
  {
    id: "fermented_jang",
    label: "발효/장",
    group: "method",
    keywords: ["된장", "간장", "백간장", "발효", "코지", "미소", "고추장", "청국장", "김치", "fermented", "jang", "koji", "miso", "soy sauce", "doenjang", "gochujang", "kimchi"],
  },
  {
    id: "dessert",
    label: "디저트",
    group: "form",
    keywords: ["디저트", "아이스크림", "타르트", "캐러멜", "그라니타", "소르베", "콩포트", "초콜릿", "dessert", "ice cream", "sorbet", "tart", "caramel", "granita", "compote", "chocolate"],
  },
  {
    id: "beverage_pairing",
    label: "음료/페어링",
    group: "form",
    keywords: ["음료", "차", "와인", "페어링", "주스", "커피", "칵테일", "beverage", "pairing", "wine", "tea", "juice", "coffee", "cocktail", "녹차", "홍차", "우롱차", "보이차", "말차", "밀크티", "허브티"],
  },
  {
    id: "spicy",
    label: "매운맛",
    group: "attribute",
    keywords: ["매운맛", "매운", "매콤", "맵다", "맵게", "얼얼", "불닭", "마라", "마파", "사천", "spicy", "hot chili", "mala", "mapo", "sichuan"],
  },
  {
    id: "cold",
    label: "차가움",
    group: "attribute",
    keywords: ["차가운", "차갑게", "차게", "냉면", "냉국", "냉채", "냉우동", "냉소바", "냉파스타", "냉", "아이스", "소르베", "그라니타", "cold", "cool", "chilled", "iced", "sorbet", "granita"],
  },
];

// Historical labels and IDs are kept separately from new choices.
export const LEGACY_DISH_KIND_OPTIONS: readonly DishKindOption[] = [
  {
    id: "grain_noodle",
    label: "면/밥/곡물",
    group: "legacy",
    keywords: ["메밀", "면", "국수", "카펠리니", "파스타", "라멘", "우동", "소바", "밥", "쌀", "죽", "리조또", "빵", "곡물", "grain", "noodle", "rice", "pasta", "ramen", "udon", "soba", "risotto", "bread"],
  },
  {
    id: "dumpling_batter",
    label: "만두/전/반죽",
    group: "legacy",
    keywords: ["만두", "딤섬", "교자", "전", "부침개", "반죽", "크레페", "라비올리", "피에로기", "dumpling", "dimsum", "dim sum", "gyoza", "jeon", "batter", "dough", "crepe", "ravioli"],
  },
  {
    id: "grilled_smoked",
    label: "구이/훈연",
    group: "legacy",
    keywords: ["숯불", "직화", "굽기", "구운", "훈연", "스모키", "불맛", "로스팅", "오븐", "grill", "grilled", "charcoal", "smoke", "smoked", "roasted", "oven", "broil", "bbq"],
  },
  {
    id: "steamed_braised",
    label: "찜/브레이즈",
    group: "legacy",
    keywords: ["찜", "찐", "조림", "졸임", "브레이즈", "라구", "찜닭", "동파육", "steamed", "braised", "braise", "jorim", "simmered", "ragu", "confit"],
  },
  {
    id: "raw_cured",
    label: "생/절임/큐어",
    group: "legacy",
    keywords: ["회", "생", "날것", "타르타르", "카르파초", "세비체", "큐어", "절임", "초절임", "숙성회", "마리네", "raw", "sashimi", "tartare", "carpaccio", "ceviche", "cured", "pickled", "marinated"],
  },
  {
    id: "spice_heat",
    label: "향신료/매운맛",
    group: "legacy",
    keywords: ["향신료", "매운맛", "매운", "맵", "고추", "후추", "산초", "마라", "마파", "사천", "생강", "겨자", "와사비", "카레", "칠리", "spice", "spicy", "heat", "chili", "pepper", "mala", "mapo", "sichuan", "ginger", "wasabi", "curry"],
  },
];

// Retired combined IDs remain readable; they never imply all of their children.
export const ALL_DISH_KIND_OPTIONS = [...DISH_KIND_OPTIONS, ...LEGACY_DISH_KIND_OPTIONS];
export const DISH_KIND_ALIASES: Readonly<Record<string, string>> = {
  "beef": "meat",
  "beverage": "beverage_pairing",
  "braised": "braised",
  "bread": "bread",
  "broth": "broth",
  "chocolate": "dessert",
  "crustacean": "seafood",
  "cured": "cured",
  "dairy": "dairy_cheese",
  "dessert": "dessert",
  "dumpling": "dumpling",
  "fermented": "fermented_jang",
  "fish": "seafood",
  "foam": "dessert",
  "fried": "fried_crispy",
  "fruit": "fruit",
  "garnish": "vegetable_herb",
  "grain": "rice_grain",
  "grilled": "grilled",
  "herb": "vegetable_herb",
  "leafyGreen": "vegetable_herb",
  "meat": "meat",
  "mushroom": "mushroom",
  "noodle": "noodle",
  "nut": "nut_seed",
  "pickled": "pickled",
  "pork": "meat",
  "poultry": "meat",
  "powder": "dessert",
  "roasted": "grilled",
  "rootVegetable": "vegetable_herb",
  "salad": "vegetable_herb",
  "sauce": "sauce_glaze",
  "scallop": "seafood",
  "seafood": "seafood",
  "seaweed": "seaweed",
  "shellfish": "seafood",
  "smoked": "smoked",
  "soy": "legume_tofu",
  "spice": "spice",
  "steamed": "steamed",
  "tea": "beverage_pairing",
  "tofu": "legume_tofu",
  "vegetable": "vegetable_herb",
  "wine": "beverage_pairing",
  "egg": "egg",
  "seed": "nut_seed",
  "spicy": "spicy",
  "rice": "rice_grain",
  "pancake": "pancake"
};
export function getDishKindOptionsForSelection(selectedIds: readonly string[] = []) {
  return [...DISH_KIND_OPTIONS, ...LEGACY_DISH_KIND_OPTIONS.filter(option => selectedIds.includes(option.id))];
}

export function matchesDishKindKeyword(text: string, keyword: string) {
  const value = keyword.toLowerCase();
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Avoid egg in eggplant, raw in strawberry, 김 in 김치, and 생 in 생선.
  if (/^[a-z0-9 -]+$/.test(value)) return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
  if (value.length === 1) return new RegExp(`(^|[^가-힣a-z0-9])${escaped}($|[^가-힣a-z0-9])`, 'i').test(text);
  return text.includes(value);
}

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

  return ALL_DISH_KIND_OPTIONS.find((option) => option.id === kindId)?.label ?? kindId;
}

export function getDishKindOption(kindId: string) {
  return ALL_DISH_KIND_OPTIONS.find((option) => option.id === kindId) ?? null;
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
        (sum, keyword) => sum + (matchesDishKindKeyword(searchableText, keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((candidate) => candidate.id);
}

// Candidate ordering only; these tags are never auto-selected or stored as observations.
export const DISH_KIND_DETAIL_RECOMMENDATIONS: Readonly<Record<string, readonly string[]>> = {
  "beverage_pairing": [
    "aroma-fruity",
    "flow-opens-next",
    "balance-aftertaste-light"
  ],
  "broth": [
    "aroma-broth",
    "flow-deepens-late",
    "flow-clean-finish"
  ],
  "cold": [
    "texture-cool-cleans",
    "flow-first-clear",
    "balance-aftertaste-light"
  ],
  "dairy_cheese": [
    "texture-coating",
    "texture-silky",
    "balance-finish-heavy"
  ],
  "dessert": [
    "balance-sweet-support",
    "aroma-fruity",
    "texture-silky"
  ],
  "dumpling_batter": [
    "texture-chewy",
    "composition-connected",
    "composition-sauce-leads"
  ],
  "fermented_jang": [
    "aroma-fermented",
    "balance-umami-depth",
    "flow-long-lasting"
  ],
  "fried_crispy": [
    "texture-crisp",
    "composition-cooking-strong",
    "balance-finish-heavy"
  ],
  "grain_noodle": [
    "texture-chewy",
    "texture-temperature-right",
    "composition-sauce-leads"
  ],
  "grilled_smoked": [
    "composition-fire-clear",
    "aroma-smoky",
    "composition-cook-point"
  ],
  "legume_tofu": [
    "texture-soft",
    "balance-umami-depth",
    "aroma-ingredient-clear"
  ],
  "meat": [
    "aroma-meaty",
    "composition-fat-supports",
    "texture-juicy"
  ],
  "raw_cured": [
    "flow-first-clear",
    "balance-acid-cleans",
    "texture-cool-cleans"
  ],
  "sauce_glaze": [
    "composition-sauce-leads",
    "balance-center-clear",
    "flow-long-lasting"
  ],
  "seafood": [
    "aroma-seafood",
    "balance-umami-depth",
    "flow-clean-finish"
  ],
  "spice_heat": [
    "aroma-spice",
    "balance-intensity-high",
    "flow-long-lasting"
  ],
  "steamed_braised": [
    "texture-soft",
    "flow-deepens-late",
    "balance-umami-depth"
  ],
  "stir_fried_wok": [
    "composition-cooking-strong",
    "aroma-roasted",
    "balance-intensity-high"
  ],
  "vegetable_herb": [
    "aroma-herbal",
    "aroma-ingredient-clear",
    "balance-aftertaste-light"
  ],
  "noodle": [
    "texture-chewy",
    "composition-sauce-leads",
    "texture-temperature-right"
  ],
  "rice_grain": [
    "aroma-ingredient-clear",
    "texture-soft",
    "composition-cook-point"
  ],
  "bread": [
    "aroma-roasted",
    "texture-soft",
    "texture-crisp"
  ],
  "dumpling": [
    "texture-chewy",
    "composition-connected",
    "texture-juicy"
  ],
  "pancake": [
    "texture-crisp",
    "composition-cook-point",
    "aroma-roasted"
  ],
  "grilled": [
    "aroma-roasted",
    "composition-fire-clear",
    "composition-cook-point"
  ],
  "smoked": [
    "aroma-smoky",
    "flow-long-lasting",
    "aroma-ingredient-clear"
  ],
  "steamed": [
    "texture-soft",
    "texture-juicy",
    "composition-cook-point"
  ],
  "braised": [
    "texture-soft",
    "composition-sauce-leads",
    "flow-deepens-late"
  ],
  "raw": [
    "aroma-ingredient-clear",
    "texture-chewy",
    "flow-first-clear"
  ],
  "pickled": [
    "texture-crisp",
    "balance-clear-seasoning",
    "aroma-ingredient-clear"
  ],
  "cured": [
    "balance-clear-seasoning",
    "texture-chewy",
    "flow-long-lasting"
  ],
  "spice": [
    "aroma-spice",
    "aroma-ingredient-clear",
    "flow-long-lasting"
  ],
  "spicy": [
    "balance-intensity-high",
    "flow-long-lasting"
  ],
  "egg": [
    "texture-soft",
    "texture-silky",
    "composition-cook-point"
  ],
  "mushroom": [
    "aroma-ingredient-clear",
    "balance-umami-depth",
    "texture-chewy"
  ],
  "fruit": [
    "aroma-fruity",
    "texture-juicy",
    "balance-sweet-support"
  ],
  "nut_seed": [
    "aroma-roasted",
    "texture-crisp",
    "aroma-ingredient-clear"
  ],
  "seaweed": [
    "aroma-ingredient-clear",
    "texture-chewy",
    "balance-umami-depth"
  ]
};
