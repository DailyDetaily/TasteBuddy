export type DiningDetailTagCategoryId = 'balance' | 'flow' | 'texture' | 'aroma' | 'composition';

export interface DiningDetailTagOption {
  id: string;
  label: string;
}

export interface DiningDetailTagCategory {
  id: DiningDetailTagCategoryId;
  label: string;
  tags: readonly DiningDetailTagOption[];
}

export interface DiningDetailTagMetadata {
  categoryId: DiningDetailTagCategoryId;
  categoryLabel: string;
  id: string;
  label: string;
}

export const diningDetailTagCategories: readonly DiningDetailTagCategory[] = [
  {
    id: 'balance',
    label: '맛의 강도와 균형',
    tags: [
      { id: 'balance-clear-seasoning', label: '간이 선명함' },
      { id: 'balance-well-balanced', label: '균형이 좋음' },
      { id: 'balance-one-note-forward', label: '한 맛이 앞섬' },
      { id: 'balance-sweet-support', label: '단맛이 받쳐줌' },
      { id: 'balance-acid-cleans', label: '산미가 정리함' },
      { id: 'balance-umami-depth', label: '감칠맛이 깊음' },
      { id: 'balance-finish-heavy', label: '마무리가 무거움' },
      { id: 'balance-intensity-high', label: '강도가 높음' },
      { id: 'balance-center-clear', label: '중심이 또렷함' },
      { id: 'balance-aftertaste-light', label: '끝맛이 가벼움' },
      { id: 'balance-flavors-layered', label: '맛이 겹쳐짐' },
      { id: 'balance-edge-soft', label: '모서리가 부드러움' },
    ],
  },
  {
    id: 'flow',
    label: '입안의 흐름',
    tags: [
      { id: 'flow-first-clear', label: '처음에 선명함' },
      { id: 'flow-middle-spreads', label: '중반에 퍼짐' },
      { id: 'flow-deepens-late', label: '뒤로 갈수록 깊어짐' },
      { id: 'flow-clean-finish', label: '피니시가 깨끗함' },
      { id: 'flow-long-lasting', label: '오래 남음' },
      { id: 'flow-quick-fade', label: '빠르게 사라짐' },
      { id: 'flow-opens-next', label: '다음 맛을 열어줌' },
      { id: 'flow-finish-piled', label: '끝에 쌓임' },
      { id: 'flow-front-soft', label: '앞맛이 부드러움' },
      { id: 'flow-middle-tight', label: '중반이 조여짐' },
      { id: 'flow-rhythm-smooth', label: '리듬이 매끄러움' },
      { id: 'flow-finish-quiet', label: '마무리가 조용함' },
    ],
  },
  {
    id: 'texture',
    label: '질감과 온도',
    tags: [
      { id: 'texture-soft', label: '부드러움' },
      { id: 'texture-dense', label: '밀도 있음' },
      { id: 'texture-light', label: '가벼움' },
      { id: 'texture-coating', label: '코팅감 있음' },
      { id: 'texture-dry', label: '건조함' },
      { id: 'texture-temperature-right', label: '온도가 잘 맞음' },
      { id: 'texture-cool-cleans', label: '차갑게 정리됨' },
      { id: 'texture-warm-spreads', label: '따뜻하게 퍼짐' },
      { id: 'texture-silky', label: '실키함' },
      { id: 'texture-chewy', label: '씹는 힘이 있음' },
      { id: 'texture-crisp', label: '바삭함' },
      { id: 'texture-juicy', label: '수분감 있음' },
    ],
  },
  {
    id: 'aroma',
    label: '향과 재료 인상',
    tags: [
      { id: 'aroma-seafood', label: '해산물 향' },
      { id: 'aroma-meaty', label: '육향' },
      { id: 'aroma-herbal', label: '허브 향' },
      { id: 'aroma-fermented', label: '발효 향' },
      { id: 'aroma-roasted', label: '구운 향' },
      { id: 'aroma-smoky', label: '훈연 향' },
      { id: 'aroma-fruity', label: '과일 향' },
      { id: 'aroma-ingredient-clear', label: '재료감이 선명함' },
      { id: 'aroma-nutty', label: '견과 향' },
      { id: 'aroma-earthy', label: '흙내음' },
      { id: 'aroma-spice', label: '향신료 향' },
      { id: 'aroma-broth', label: '육수 향' },
    ],
  },
  {
    id: 'composition',
    label: '조리와 구성 단서',
    tags: [
      { id: 'composition-cook-point', label: '굽기가 좋음' },
      { id: 'composition-sauce-leads', label: '소스가 이끎' },
      { id: 'composition-fat-supports', label: '지방이 받쳐줌' },
      { id: 'composition-acid-structure', label: '산미가 구조를 만듦' },
      { id: 'composition-contrast-good', label: '대비가 좋음' },
      { id: 'composition-connected', label: '재료 간 연결이 좋음' },
      { id: 'composition-cooking-strong', label: '조리가 강함' },
      { id: 'composition-course-fit', label: '구성감이 좋음' },
      { id: 'composition-garnish-works', label: '가니시가 맞음' },
      { id: 'composition-fire-clear', label: '불맛이 선명함' },
      { id: 'composition-portion-right', label: '양감이 적절함' },
      { id: 'composition-transition-good', label: '코스 연결이 좋음' },
    ],
  },
];

export function getDiningDetailTagMetadata(tagId: string | null | undefined) {
  if (!tagId) {
    return null;
  }

  const customTagMatch = tagId.match(/^custom:([^:]+):(.+)$/);

  if (customTagMatch) {
    const [, categoryId, label] = customTagMatch;
    const category = diningDetailTagCategories.find((detailCategory) => detailCategory.id === categoryId);

    if (!category || !label.trim()) {
      return null;
    }

    return {
      categoryId: category.id,
      categoryLabel: category.label,
      id: tagId,
      label: label.trim(),
    } satisfies DiningDetailTagMetadata;
  }

  for (const category of diningDetailTagCategories) {
    const tag = category.tags.find((detailTag) => detailTag.id === tagId);

    if (tag) {
      return {
        categoryId: category.id,
        categoryLabel: category.label,
        id: tag.id,
        label: tag.label,
      } satisfies DiningDetailTagMetadata;
    }
  }

  return null;
}
