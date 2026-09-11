import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  ArrowRight as ArrowRightIcon,
  Camera as CameraIcon,
  Image as ImageIcon,
  SwitchCamera as SwitchCameraIcon,
  PenLine as PenLineIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Sparkles as SparklesIcon,
  X as XIcon,
  Zap as ZapIcon,
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const ArrowRight = wrapIcon(ArrowRightIcon);
const Camera = wrapIcon(CameraIcon);
const Image = wrapIcon(ImageIcon);
const SwitchCamera = wrapIcon(SwitchCameraIcon);
const PenLine = wrapIcon(PenLineIcon);
const Plus = wrapIcon(PlusIcon);
const Search = wrapIcon(SearchIcon);
const Share = wrapIcon(ShareIcon);
const Sparkles = wrapIcon(SparklesIcon);
const X = wrapIcon(XIcon);
const Zap = wrapIcon(ZapIcon);

import SectionCard from '../SectionCard';
import TopAppBar from '../TopAppBar';
import OutlineBadge from '../system/OutlineBadge';
import FlowBottomCta from '../system/FlowBottomCta';
import ImageBox from '../system/ImageBox';
import PageSection from '../system/PageSection';
import SelectionCard from '../system/SelectionCard';
import TasteChip from '../system/TasteChip';
import TasteWordSearch from '../search/TasteWordSearch';
import {
  type DiningDishMetadata,
  type DiningFeedbackChoice,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
  createCustomDiningDishMetadata,
  createDiningDishFeedbackDraft,
} from '../../constants/diningFeedbackData';
import {
  diningDetailTagCategories,
  getDiningDetailTagMetadata,
  type DiningDetailTagCategory,
  type DiningDetailTagMetadata,
} from '../../constants/diningDetailTags';
import {
  CUSTOM_DISH_KIND_PREFIX,
  DISH_KIND_OPTIONS,
  getCustomDishKindId,
  getDishKindLabel,
  inferDishKindIds,
} from '../../constants/dishKindTags';
import {
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { ICON_TOKENS } from '../../constants/designTokens';
import { resolvePublicMediaPath } from '../../lib/mediaAssets';
import { cn } from '../ui/utils';

export {
  diningDetailTagCategories,
  getDiningDetailTagMetadata,
  type DiningDetailTagCategory,
  type DiningDetailTagMetadata,
} from '../../constants/diningDetailTags';

const returnIntentOptions = [
  { id: 'yes', label: '이 방향으로 다시 경험하고 싶어요' },
  { id: 'maybe', label: '조금 더 맞추면 다시 좋아질 것 같아요' },
  { id: 'no', label: '다른 방향이 더 잘 맞을 것 같아요' },
] as const;

const EMPTY_ACTIVE_DISH: DiningDishMetadata = {
  chefIntent: '직접 입력 메뉴를 추가하면 미각 기록을 이어갈 수 있어요.',
  courseLabel: '직접 입력',
  feedbackChoices: [],
  flavorNotes: [],
  id: 'empty-active-dish',
  ingredients: [],
  subtitle: '직접 입력한 메뉴',
  techniques: [],
  title: '직접 입력',
};

export type TasteAxisId = 'sweet' | 'sour' | 'salty' | 'bitter' | 'umami' | 'fat';
const TASTE_AXIS_LABEL_BY_ID: Record<TasteAxisId, string> = {
  bitter: '쓴맛',
  fat: '지방맛',
  salty: '짠맛',
  sour: '신맛',
  sweet: '단맛',
  umami: '감칠맛',
};
type DiningFeedbackStep =
  | 'menu-select'
  | 'taste-checkin'
  | 'detail-tags'
  | 'result-card'
  | 'taste-reflection'
  | 'camera-capture';

const RECOMMENDED_DETAIL_TAG_IDS_BY_TASTE_AXIS: Record<TasteAxisId, readonly string[]> = {
  bitter: ['aroma-roasted', 'aroma-smoky', 'composition-fire-clear', 'flow-long-lasting'],
  fat: ['texture-coating', 'texture-silky', 'composition-fat-supports', 'balance-finish-heavy'],
  salty: ['balance-clear-seasoning', 'balance-center-clear', 'composition-sauce-leads'],
  sour: ['balance-acid-cleans', 'flow-clean-finish', 'flow-opens-next', 'composition-acid-structure'],
  sweet: ['balance-sweet-support', 'aroma-fruity', 'flow-finish-quiet', 'balance-aftertaste-light'],
  umami: ['balance-umami-depth', 'flow-deepens-late', 'aroma-broth', 'composition-connected'],
};

const RECOMMENDED_DETAIL_TAG_IDS_BY_DISH_KIND: Record<string, readonly string[]> = {
  beverage_pairing: ['aroma-fruity', 'flow-opens-next', 'balance-aftertaste-light'],
  broth: ['aroma-broth', 'flow-deepens-late', 'flow-clean-finish'],
  cold: ['texture-cool-cleans', 'flow-first-clear', 'balance-aftertaste-light'],
  dairy_cheese: ['texture-coating', 'texture-silky', 'balance-finish-heavy'],
  dessert: ['balance-sweet-support', 'aroma-fruity', 'texture-silky'],
  dumpling_batter: ['texture-chewy', 'composition-connected', 'composition-sauce-leads'],
  fermented_jang: ['aroma-fermented', 'balance-umami-depth', 'flow-long-lasting'],
  fried_crispy: ['texture-crisp', 'composition-cooking-strong', 'balance-finish-heavy'],
  grain_noodle: ['texture-chewy', 'texture-temperature-right', 'composition-sauce-leads'],
  grilled_smoked: ['composition-fire-clear', 'aroma-smoky', 'composition-cook-point'],
  legume_tofu: ['texture-soft', 'balance-umami-depth', 'aroma-ingredient-clear'],
  meat: ['aroma-meaty', 'composition-fat-supports', 'texture-juicy'],
  raw_cured: ['flow-first-clear', 'balance-acid-cleans', 'texture-cool-cleans'],
  sauce_glaze: ['composition-sauce-leads', 'balance-center-clear', 'flow-long-lasting'],
  seafood: ['aroma-seafood', 'balance-umami-depth', 'flow-clean-finish'],
  spice_heat: ['aroma-spice', 'balance-intensity-high', 'flow-long-lasting'],
  steamed_braised: ['texture-soft', 'flow-deepens-late', 'balance-umami-depth'],
  stir_fried_wok: ['composition-cooking-strong', 'aroma-roasted', 'balance-intensity-high'],
  vegetable_herb: ['aroma-herbal', 'aroma-ingredient-clear', 'balance-aftertaste-light'],
};

export interface TasteExperienceWord {
  angleOffset: number;
  axis: TasteAxisId;
  description: string;
  id: string;
  intensity: 1 | 2 | 3 | 4;
  key: string;
  label: string;
  radiusOffset?: number;
}

export const tasteExperienceAxes: readonly {
  id: TasteAxisId;
  label: string;
  angle: number;
  words: readonly Omit<TasteExperienceWord, 'axis' | 'id'>[];
}[] = [
  {
    id: 'sweet',
    label: '단맛',
    angle: -105,
    words: [
      { angleOffset: -10, intensity: 1, key: 'soft', label: '부드러운 단맛', description: '단맛이 배경처럼 가볍게 받쳐줬어요.' },
      { angleOffset: 10, intensity: 1, key: 'fruit-soft', label: '은은한 과일 단맛', description: '과일처럼 맑은 단맛이 가볍게 지나갔어요.' },
      { angleOffset: -24, intensity: 2, key: 'front', label: '먼저 올라온 단맛', description: '다른 풍미보다 단맛이 조금 먼저 느껴졌어요.' },
      { angleOffset: -8, intensity: 2, key: 'round', label: '둥근 단맛', description: '모서리 없이 둥글게 이어지는 단맛이었어요.' },
      { angleOffset: 8, intensity: 2, key: 'caramel', label: '캐러멜 같은 단맛', description: '구운 설탕이나 캐러멜처럼 깊은 단맛이 남았어요.' },
      { angleOffset: 24, intensity: 2, key: 'clean-finish', label: '깔끔한 단맛', description: '단맛이 남더라도 마무리는 비교적 깨끗했어요.' },
      { angleOffset: -24, intensity: 3, key: 'long', label: '오래 남은 단맛', description: '식사 뒤쪽까지 단맛의 여운이 이어졌어요.' },
      { angleOffset: -8, intensity: 3, key: 'syrup', label: '시럽 같은 단맛', description: '농도 있는 단맛이 입안에 또렷하게 남았어요.' },
      { angleOffset: 8, intensity: 3, key: 'finish-hold', label: '피니시를 잡은 단맛', description: '마지막 인상이 단맛 중심으로 정리됐어요.' },
      { angleOffset: 24, intensity: 3, key: 'dense', label: '밀도 있는 단맛', description: '단맛의 농도가 높아 중심 인상으로 느껴졌어요.' },
      { angleOffset: -12, intensity: 4, key: 'too-much', label: '조금 과한 단맛', description: '마무리에서 단맛이 다른 인상을 덮었어요.' },
      { angleOffset: 12, intensity: 4, key: 'covering', label: '재료를 덮은 단맛', description: '단맛 때문에 재료의 개성이 덜 느껴졌어요.' },
    ],
  },
  {
    id: 'sour',
    label: '신맛',
    angle: -45,
    words: [
      { angleOffset: -10, intensity: 1, key: 'fresh', label: '산뜻한 산미', description: '산미가 조용하게 입맛을 열어줬어요.' },
      { angleOffset: 10, intensity: 1, key: 'soft-citrus', label: '부드러운 과일 산미', description: '과일처럼 부드러운 산미가 편안하게 느껴졌어요.' },
      { angleOffset: -24, intensity: 2, key: 'opening', label: '입맛을 여는 산미', description: '산미가 코스의 리듬을 또렷하게 만들었어요.' },
      { angleOffset: -8, intensity: 2, key: 'clean-finish', label: '끝맛을 정리한 산미', description: '마무리의 무게를 산미가 가볍게 정리했어요.' },
      { angleOffset: 8, intensity: 2, key: 'citrus', label: '시트러스 산미', description: '레몬이나 유자처럼 밝은 산미로 느껴졌어요.' },
      { angleOffset: 24, intensity: 2, key: 'fermented', label: '발효 산미', description: '발효에서 오는 깊은 산미가 느껴졌어요.' },
      { angleOffset: -24, intensity: 3, key: 'sharp', label: '날카로운 산미', description: '산미가 한 번에 올라와 조금 또렷하게 남았어요.' },
      { angleOffset: -8, intensity: 3, key: 'vinegar', label: '식초 같은 산미', description: '식초처럼 직선적인 산미가 선명했어요.' },
      { angleOffset: 8, intensity: 3, key: 'long', label: '오래 남은 산미', description: '산미의 여운이 예상보다 길게 이어졌어요.' },
      { angleOffset: 24, intensity: 3, key: 'tight', label: '입안을 조인 산미', description: '산미가 입안을 조이는 듯한 긴장감으로 남았어요.' },
      { angleOffset: -12, intensity: 4, key: 'jumping', label: '튀는 산미', description: '산미가 재료의 흐름보다 앞서 느껴졌어요.' },
      { angleOffset: 12, intensity: 4, key: 'covering', label: '재료를 가린 산미', description: '산미가 커서 재료의 다른 결이 덜 보였어요.' },
    ],
  },
  {
    id: 'salty',
    label: '짠맛',
    angle: 15,
    words: [
      { angleOffset: -10, intensity: 1, key: 'balanced', label: '간이 잘 맞음', description: '간이 전체 흐름을 자연스럽게 받쳐줬어요.' },
      { angleOffset: 10, intensity: 1, key: 'soft-salt', label: '부드러운 간', description: '짠맛이 튀지 않고 조용하게 받쳐줬어요.' },
      { angleOffset: -24, intensity: 2, key: 'clear', label: '선명한 짠맛', description: '짠맛이 풍미의 윤곽을 또렷하게 만들었어요.' },
      { angleOffset: -8, intensity: 2, key: 'flavor-lift', label: '풍미를 살린 간', description: '간이 재료의 향과 감칠맛을 살려줬어요.' },
      { angleOffset: 8, intensity: 2, key: 'broth-salt', label: '육수의 짠맛', description: '육수나 소스에서 오는 짠맛으로 느껴졌어요.' },
      { angleOffset: 24, intensity: 2, key: 'sea-clean', label: '맑은 해수감', description: '바다 향이 맑게 느껴지는 짠맛이었어요.' },
      { angleOffset: -24, intensity: 3, key: 'strong-sea', label: '해수감이 강함', description: '짠맛이나 바다 향이 앞쪽에서 분명하게 느껴졌어요.' },
      { angleOffset: -8, intensity: 3, key: 'sauce-forward', label: '소스의 간이 강함', description: '소스의 짠맛이 재료보다 더 크게 남았어요.' },
      { angleOffset: 8, intensity: 3, key: 'fermented-salt', label: '젓갈 같은 짠맛', description: '발효 해산물 같은 짠맛과 향이 느껴졌어요.' },
      { angleOffset: 24, intensity: 3, key: 'long-salty', label: '오래 남은 짠맛', description: '짠맛의 여운이 입안에 길게 남았어요.' },
      { angleOffset: -12, intensity: 4, key: 'front', label: '간이 앞섬', description: '간이 다른 재료보다 먼저 크게 남았어요.' },
      { angleOffset: 12, intensity: 4, key: 'covering', label: '재료를 가린 간', description: '짠맛 때문에 재료의 섬세함이 덜 느껴졌어요.' },
    ],
  },
  {
    id: 'bitter',
    label: '쓴맛',
    angle: 75,
    words: [
      { angleOffset: -10, intensity: 1, key: 'soft-after', label: '쌉싸름한 여운', description: '작은 쓴맛이 마무리를 정리해줬어요.' },
      { angleOffset: 10, intensity: 1, key: 'clean-bitter', label: '깔끔한 쌉싸름함', description: '쓴맛이 부담 없이 입안을 정리했어요.' },
      { angleOffset: -24, intensity: 2, key: 'roasted', label: '구운 향', description: '로스팅이나 직화 향이 맛의 깊이를 더했어요.' },
      { angleOffset: -8, intensity: 2, key: 'herbal', label: '허브 쌉싸름함', description: '허브나 잎채소 같은 산뜻한 쓴맛이 있었어요.' },
      { angleOffset: 8, intensity: 2, key: 'char', label: '직화의 쌉싸름함', description: '불향과 함께 오는 쌉싸름함이 느껴졌어요.' },
      { angleOffset: 24, intensity: 2, key: 'finish-clean', label: '마무리를 정리한 쓴맛', description: '작은 쓴맛이 피니시를 깨끗하게 만들었어요.' },
      { angleOffset: -24, intensity: 3, key: 'strong-smoke', label: '훈연감이 강함', description: '훈연이나 탄 향이 재료보다 또렷하게 남았어요.' },
      { angleOffset: -8, intensity: 3, key: 'burnt', label: '탄 향', description: '탄 향이나 그을린 향이 강하게 느껴졌어요.' },
      { angleOffset: 8, intensity: 3, key: 'dry-bitter', label: '건조한 쓴맛', description: '입안을 조금 마르게 하는 쓴맛이 남았어요.' },
      { angleOffset: 24, intensity: 3, key: 'long-bitter', label: '오래 남은 쓴맛', description: '쓴맛의 여운이 예상보다 길게 이어졌어요.' },
      { angleOffset: -12, intensity: 4, key: 'covering', label: '쓴맛이 덮음', description: '쓴맛이 다른 풍미를 가리는 쪽으로 느껴졌어요.' },
      { angleOffset: 12, intensity: 4, key: 'smoke-cover', label: '훈연이 재료를 덮음', description: '훈연감이 커서 재료의 개성이 묻혔어요.' },
    ],
  },
  {
    id: 'umami',
    label: '감칠맛',
    angle: 135,
    words: [
      { angleOffset: -10, intensity: 1, key: 'subtle-depth', label: '은근한 깊이', description: '감칠맛이 조용하게 배경을 채웠어요.' },
      { angleOffset: 10, intensity: 1, key: 'clear', label: '맑은 감칠맛', description: '깊이는 있지만 무겁지 않게 이어졌어요.' },
      { angleOffset: -24, intensity: 2, key: 'flowing', label: '풍미가 이어짐', description: '재료의 깊이가 자연스럽게 이어졌어요.' },
      { angleOffset: -8, intensity: 2, key: 'broth', label: '육수 같은 깊이', description: '맑은 육수처럼 깊고 안정적인 감칠맛이었어요.' },
      { angleOffset: 8, intensity: 2, key: 'seafood', label: '해산물 감칠맛', description: '조개나 해산물에서 오는 감칠맛이 느껴졌어요.' },
      { angleOffset: 24, intensity: 2, key: 'fermented', label: '발효 감칠맛', description: '발효 재료에서 오는 깊은 감칠맛이 있었어요.' },
      { angleOffset: -24, intensity: 3, key: 'dense', label: '밀도 있는 감칠맛', description: '감칠맛의 존재감이 코스의 중심을 만들었어요.' },
      { angleOffset: -8, intensity: 3, key: 'meaty', label: '육향의 감칠맛', description: '고기나 jus에서 오는 묵직한 감칠맛이 느껴졌어요.' },
      { angleOffset: 8, intensity: 3, key: 'long', label: '긴 감칠맛', description: '감칠맛의 여운이 길고 안정적으로 이어졌어요.' },
      { angleOffset: 24, intensity: 3, key: 'short', label: '짧게 끊긴 감칠맛', description: '기대보다 감칠맛이 빨리 사라졌어요.' },
      { angleOffset: -12, intensity: 4, key: 'heavy', label: '무겁게 쌓임', description: '감칠맛이 누적되며 후반이 조금 묵직했어요.' },
      { angleOffset: 12, intensity: 4, key: 'covering', label: '감칠맛이 재료를 덮음', description: '감칠맛이 커서 재료의 섬세함이 덜 느껴졌어요.' },
    ],
  },
  {
    id: 'fat',
    label: '지방감',
    angle: 195,
    words: [
      { angleOffset: -10, intensity: 1, key: 'soft-texture', label: '부드러운 질감', description: '기름기보다 질감의 부드러움으로 남았어요.' },
      { angleOffset: 10, intensity: 1, key: 'clean-fat', label: '가볍게 정리된 지방감', description: '지방감이 있지만 마무리는 가볍게 정리됐어요.' },
      { angleOffset: -24, intensity: 2, key: 'nutty-weight', label: '고소한 무게', description: '지방감이 풍성함을 만들며 편안하게 느껴졌어요.' },
      { angleOffset: -8, intensity: 2, key: 'buttery', label: '버터리함', description: '버터처럼 부드럽고 둥근 지방감이 있었어요.' },
      { angleOffset: 8, intensity: 2, key: 'creamy', label: '크리미함', description: '크림 같은 질감이 입안을 부드럽게 감쌌어요.' },
      { angleOffset: 24, intensity: 2, key: 'silky', label: '실키한 질감', description: '매끈하게 이어지는 질감으로 느껴졌어요.' },
      { angleOffset: -24, intensity: 3, key: 'long', label: '오래 남는 지방감', description: '지방감이나 버터감이 입안에 길게 남았어요.' },
      { angleOffset: -8, intensity: 3, key: 'rich', label: '풍성한 지방감', description: '지방감이 코스의 볼륨을 크게 만들었어요.' },
      { angleOffset: 8, intensity: 3, key: 'coating', label: '입안을 코팅함', description: '지방감이 입안을 감싸며 오래 남았어요.' },
      { angleOffset: 24, intensity: 3, key: 'finish-heavy', label: '무거운 피니시', description: '마무리가 조금 묵직하게 느껴졌어요.' },
      { angleOffset: -12, intensity: 4, key: 'greasy', label: '느끼하게 남음', description: '후반에 지방감이 정리되지 않고 크게 남았어요.' },
      { angleOffset: 12, intensity: 4, key: 'fat-covering', label: '지방감이 재료를 덮음', description: '지방감이 커서 재료의 향이 덜 느껴졌어요.' },
    ],
  },
] as const;

const tasteExperienceWords: TasteExperienceWord[] = tasteExperienceAxes.flatMap((axis) =>
  axis.words.map((word) => ({
    ...word,
    axis: axis.id,
    id: `${axis.id}-${word.key}`,
  })),
);

const feedbackLabelClass =
  'self-start text-left text-[14px] font-semibold text-[var(--tb-color-text-subtle)]';
const feedbackSectionLabelClass = 'text-[12px] font-semibold text-[var(--tb-color-text-muted)]';
const feedbackBodyClass = 'leading-relaxed text-[var(--tb-color-text-subtle)]';
const feedbackHintClass = 'text-[12px] font-semibold text-[var(--tb-color-text-faint)]';

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--tb-color-surface-base)] px-2.5 py-1 text-[10px] font-medium text-[var(--tb-color-text-subtle)]">
      {children}
    </span>
  );
}

function QuickOptionGroup<T extends number | string>({
  onChange,
  options,
  value,
}: {
  onChange: (nextValue: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
            option.value === value
              ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
              : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function getExperienceMappedRating(experience: TasteExperienceWord) {
  if (experience.intensity >= 4) {
    return 2;
  }

  if (experience.intensity === 3) {
    return 3;
  }

  return 4;
}

export function findTasteExperience(experienceId: string | null | undefined) {
  const exactMatch = tasteExperienceWords.find((experience) => experience.id === experienceId);

  if (exactMatch || !experienceId) {
    return exactMatch ?? null;
  }

  const legacyMatch = experienceId.match(/^(sweet|sour|salty|bitter|umami|fat)-([1-4])$/);
  if (!legacyMatch) {
    return null;
  }

  const [, axis, intensity] = legacyMatch;
  return (
    tasteExperienceWords.find(
      (experience) => experience.axis === axis && experience.intensity === Number(intensity),
    ) ?? null
  );
}

function getSelectedExperienceIds(
  response: { selectedExperienceId?: string | null; selectedExperienceIds?: string[] } | undefined,
) {
  const ids = [
    ...(response?.selectedExperienceIds ?? []),
    response?.selectedExperienceId ?? null,
  ].filter((experienceId): experienceId is string => Boolean(experienceId));

  return [...new Set(ids)].slice(0, 3);
}

function getSelectedTasteExperiences(
  response: { selectedExperienceId?: string | null; selectedExperienceIds?: string[] } | undefined,
) {
  return getSelectedExperienceIds(response)
    .map((experienceId) => findTasteExperience(experienceId))
    .filter((experience): experience is TasteExperienceWord => Boolean(experience));
}

function findClosestDishChoice(dish: DiningDishMetadata, experience: TasteExperienceWord) {
  const targetTaste = TASTE_AXIS_LABEL_BY_ID[experience.axis];
  const matchingChoices = dish.feedbackChoices.filter((choice) =>
    choice.affectedTastes.includes(targetTaste),
  );

  if (matchingChoices.length === 0) {
    return dish.feedbackChoices[Math.min(experience.intensity - 1, dish.feedbackChoices.length - 1)];
  }

  if (experience.intensity <= 2) {
    return matchingChoices[matchingChoices.length - 1];
  }

  return matchingChoices[0];
}

function getFallbackExperienceIdFromChoice(choice: DiningFeedbackChoice | undefined) {
  if (!choice) {
    return null;
  }

  const axisByTasteLabel: Record<string, TasteAxisId> = {
    감칠맛: 'umami',
    단맛: 'sweet',
    신맛: 'sour',
    쓴맛: 'bitter',
    짠맛: 'salty',
    지방맛: 'fat',
  };
  const axis = choice.affectedTastes.map((taste) => axisByTasteLabel[taste]).find(Boolean);

  if (!axis) {
    return null;
  }

  const isBalanced = /좋았|만족|이어졌|균형|안정/.test(choice.label);
  return (
    tasteExperienceWords.find(
      (experience) => experience.axis === axis && experience.intensity === (isBalanced ? 2 : 3),
    )?.id ?? null
  );
}

function getTasteExperienceStyle(
  axis: TasteAxisId,
  intensity: number,
  options: {
    distanceFromSelected?: number;
    isSelected?: boolean;
  } = {},
): CSSProperties {
  const tint = `var(--tb-taste-${axis}-tint-surface)`;
  const border = `var(--tb-taste-${axis}-tint-soft-border)`;
  const text = `var(--tb-taste-${axis}-tint-surface-text)`;

  if (options.isSelected) {
    return {
      backgroundColor: tint,
      borderColor: border,
      color: text,
    };
  }

  const distanceFromSelected = options.distanceFromSelected;
  const distanceStep =
    typeof distanceFromSelected === 'number'
      ? Math.max(1, Math.round(distanceFromSelected / BUBBLE_GRID_SPACING))
      : 1;
  const whiteMix = Math.min(80, distanceStep * 20);
  const tintMix = 100 - whiteMix;

  return {
    backgroundColor: `color-mix(in srgb, ${tint} ${tintMix}%, var(--tb-color-bg-focus))`,
    borderColor: border,
    color: `color-mix(in srgb, ${text} ${tintMix}%, var(--tb-color-bg-focus))`,
  };
}

const BUBBLE_MAP_SIZE = 1680;
const BUBBLE_MAP_CENTER = BUBBLE_MAP_SIZE / 2;
const BUBBLE_MAP_NEUTRAL_POINT = {
  x: BUBBLE_MAP_CENTER,
  y: BUBBLE_MAP_CENTER,
};
const BUBBLE_SIZE = 126;
const SELECTED_BUBBLE_SIZE = 164;
const BUBBLE_GRID_SPACING = 136;
const BUBBLE_SURFACE_GAP = BUBBLE_GRID_SPACING - BUBBLE_SIZE;
const BUBBLE_GRID_ROTATION_DEGREES = 0;
const BUBBLE_GRID_SEARCH_RANGE = 12;
const BUBBLE_RELAXATION_ITERATIONS = 12;
const BUBBLE_MAP_ZOOM_MIN = 0.72;
const BUBBLE_MAP_ZOOM_MAX = 1.42;
const BUBBLE_MAP_ENTRY_ZOOM = 0.86;
const BUBBLE_MAP_SELECTED_ZOOM = 1;
const BUBBLE_MAP_ZOOM_TRANSITION_MS = 460;
const BUBBLE_MAP_PINCH_SNAP_SUPPRESS_MS = 360;
const BUBBLE_MAP_NEUTRAL_BUBBLE_SIZE = 56;
const BUBBLE_INTRO_PRIMARY_DELAY_MS = 440;
const BUBBLE_INTRO_PRIMARY_STEP_MS = 76;
const BUBBLE_INTRO_OUTER_DELAY_MS = 900;
const BUBBLE_INTRO_OUTER_SPREAD_MS = 1260;
const BUBBLE_INTRO_DURATION_MS = 680;

interface TasteExperienceHexPoint {
  angle: number;
  axisId: TasteAxisId;
  distance: number;
  x: number;
  y: number;
}

function getRadialPoint(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function getAngleDistance(leftAngle: number, rightAngle: number) {
  const distance = Math.abs(normalizeAngle(leftAngle) - normalizeAngle(rightAngle));

  return distance > 180 ? 360 - distance : distance;
}

function getNearestAxisByAngle(angle: number) {
  return tasteExperienceAxes.reduce((nearestAxis, axis) => {
    const nearestDistance = getAngleDistance(angle, nearestAxis.angle);
    const axisDistance = getAngleDistance(angle, axis.angle);

    return axisDistance < nearestDistance ? axis : nearestAxis;
  }, tasteExperienceAxes[0]);
}

function getRotatedPoint(x: number, y: number, angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getHexGridPoints(pointCount: number) {
  const rowHeight = BUBBLE_GRID_SPACING * Math.sqrt(3) / 2;
  const points: TasteExperienceHexPoint[] = [];

  for (let row = -BUBBLE_GRID_SEARCH_RANGE; row <= BUBBLE_GRID_SEARCH_RANGE; row += 1) {
    for (let column = -BUBBLE_GRID_SEARCH_RANGE; column <= BUBBLE_GRID_SEARCH_RANGE; column += 1) {
      const rawX = (column + (Math.abs(row) % 2 === 1 ? 0.5 : 0)) * BUBBLE_GRID_SPACING;
      const rawY = row * rowHeight;
      const rotatedPoint = getRotatedPoint(rawX, rawY, BUBBLE_GRID_ROTATION_DEGREES);
      const distance = Math.hypot(rotatedPoint.x, rotatedPoint.y);

      if (distance < 1) {
        continue;
      }

      const angle = (Math.atan2(rotatedPoint.y, rotatedPoint.x) * 180) / Math.PI;
      points.push({
        angle,
        axisId: getNearestAxisByAngle(angle).id,
        distance,
        x: rotatedPoint.x,
        y: rotatedPoint.y,
      });
    }
  }

  return points
    .sort(
      (leftPoint, rightPoint) =>
        leftPoint.distance - rightPoint.distance || leftPoint.angle - rightPoint.angle,
    )
    .slice(0, pointCount);
}

const tasteExperienceHexPoints = getHexGridPoints(tasteExperienceWords.length);
const tasteExperienceHexPointsByAxis = tasteExperienceAxes.reduce(
  (axisPointsById, axis) => ({
    ...axisPointsById,
    [axis.id]: tasteExperienceHexPoints
      .filter((point) => point.axisId === axis.id)
      .sort(
        (leftPoint, rightPoint) =>
          leftPoint.distance - rightPoint.distance ||
          getAngleDistance(leftPoint.angle, axis.angle) -
          getAngleDistance(rightPoint.angle, axis.angle),
      ),
  }),
  {} as Record<TasteAxisId, TasteExperienceHexPoint[]>,
);

// Keep each axis as a compact triangular silhouette inside the shared hex grid.
// Slot overrides are only for visual silhouette correction; they must not change
// a word's taste axis, color, meaning, or chef-facing interpretation.
const tasteExperienceSlotTargetById = new Map<string, string>([
  ['fat-coating', 'sweet-finish-hold'],
  ['umami-meaty', 'fat-coating'],
  ['bitter-dry-bitter', 'umami-meaty'],
  ['salty-fermented-salt', 'bitter-dry-bitter'],
  ['sour-vinegar', 'salty-fermented-salt'],
  ['sweet-finish-hold', 'sour-vinegar'],
]);

const baseTasteExperienceBubblePositions = tasteExperienceAxes.flatMap((axis) =>
  axis.words.map((word, wordIndex) => {
    const experience = {
      ...word,
      axis: axis.id,
      id: `${axis.id}-${word.key}`,
    } as TasteExperienceWord;
    const point = tasteExperienceHexPointsByAxis[axis.id][wordIndex];

    return {
      experience,
      size: BUBBLE_SIZE,
      x: BUBBLE_MAP_CENTER + (point?.x ?? 0),
      y: BUBBLE_MAP_CENTER + (point?.y ?? 0),
    };
  }),
);
const baseTasteExperienceBubblePositionById = new Map(
  baseTasteExperienceBubblePositions.map((position) => [position.experience.id, position]),
);
const tasteExperienceBubblePositions = baseTasteExperienceBubblePositions.map((position) => {
  const targetId = tasteExperienceSlotTargetById.get(position.experience.id);
  const targetPosition = targetId ? baseTasteExperienceBubblePositionById.get(targetId) : null;

  if (!targetPosition) {
    return position;
  }

  return {
    ...position,
    x: targetPosition.x,
    y: targetPosition.y,
  };
});
const tasteExperienceNeutralBubblePosition = {
  size: BUBBLE_MAP_NEUTRAL_BUBBLE_SIZE,
  x: BUBBLE_MAP_NEUTRAL_POINT.x,
  y: BUBBLE_MAP_NEUTRAL_POINT.y,
};
const tasteExperienceIntroPrimaryIds = tasteExperienceAxes.map((axis) => `${axis.id}-${axis.words[0].key}`);
const tasteExperienceIntroPrimaryIdSet = new Set(tasteExperienceIntroPrimaryIds);
const tasteExperienceIntroOuterPositions = tasteExperienceBubblePositions
  .filter((position) => !tasteExperienceIntroPrimaryIdSet.has(position.experience.id))
  .sort((leftPosition, rightPosition) => {
    const leftDistance = Math.hypot(
      leftPosition.x - BUBBLE_MAP_CENTER,
      leftPosition.y - BUBBLE_MAP_CENTER,
    );
    const rightDistance = Math.hypot(
      rightPosition.x - BUBBLE_MAP_CENTER,
      rightPosition.y - BUBBLE_MAP_CENTER,
    );
    const leftAngle = Math.atan2(leftPosition.y - BUBBLE_MAP_CENTER, leftPosition.x - BUBBLE_MAP_CENTER);
    const rightAngle = Math.atan2(rightPosition.y - BUBBLE_MAP_CENTER, rightPosition.x - BUBBLE_MAP_CENTER);

    return leftDistance - rightDistance || leftAngle - rightAngle;
  });
const tasteExperienceIntroDelayById = new Map<string, number>([
  ...tasteExperienceIntroPrimaryIds.map((id, index) => [
    id,
    BUBBLE_INTRO_PRIMARY_DELAY_MS + index * BUBBLE_INTRO_PRIMARY_STEP_MS,
  ] as const),
  ...tasteExperienceIntroOuterPositions.map((position, index) => {
    const progress =
      tasteExperienceIntroOuterPositions.length <= 1
        ? 1
        : index / (tasteExperienceIntroOuterPositions.length - 1);
    const acceleratingProgress = Math.pow(progress, 0.62);

    return [
      position.experience.id,
      BUBBLE_INTRO_OUTER_DELAY_MS + acceleratingProgress * BUBBLE_INTRO_OUTER_SPREAD_MS,
    ] as const;
  }),
]);

function getTasteExperienceIntroDelay(experienceId: string) {
  return tasteExperienceIntroDelayById.get(experienceId) ?? BUBBLE_INTRO_OUTER_DELAY_MS;
}

type TasteExperienceBubblePosition = (typeof tasteExperienceBubblePositions)[number];
type TasteExperienceSnapTarget =
  | { kind: 'bubble'; position: TasteExperienceBubblePosition }
  | { kind: 'neutral'; position: typeof tasteExperienceNeutralBubblePosition };

function getTasteExperienceBubbleRenderPositions(selectedExperienceIds: readonly string[]) {
  const selectedIdSet = new Set(selectedExperienceIds);
  const selectedPositions = tasteExperienceBubblePositions.filter((position) =>
    selectedIdSet.has(position.experience.id),
  );
  const primarySelectedPosition = selectedPositions[0];

  if (!primarySelectedPosition) {
    return tasteExperienceBubblePositions;
  }

  const selectedRadiusDelta = (SELECTED_BUBBLE_SIZE - BUBBLE_SIZE) / 2;
  const expandedPositions = tasteExperienceBubblePositions.map((position) => {
    const isSelected = selectedIdSet.has(position.experience.id);

    if (isSelected) {
      return {
        ...position,
        size: SELECTED_BUBBLE_SIZE,
      };
    }

    const nearestSelectedPosition = selectedPositions.reduce((nearestPosition, selectedPosition) => {
      const nearestDistance = Math.hypot(position.x - nearestPosition.x, position.y - nearestPosition.y);
      const selectedDistance = Math.hypot(position.x - selectedPosition.x, position.y - selectedPosition.y);

      return selectedDistance < nearestDistance ? selectedPosition : nearestPosition;
    }, primarySelectedPosition);
    const deltaX = position.x - nearestSelectedPosition.x;
    const deltaY = position.y - nearestSelectedPosition.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= 0) {
      return position;
    }

    return {
      ...position,
      x: position.x + (deltaX / distance) * selectedRadiusDelta,
      y: position.y + (deltaY / distance) * selectedRadiusDelta,
    };
  });

  const relaxedPositions = expandedPositions.map((position) => ({ ...position }));

  for (let iteration = 0; iteration < BUBBLE_RELAXATION_ITERATIONS; iteration += 1) {
    for (let leftIndex = 0; leftIndex < relaxedPositions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < relaxedPositions.length; rightIndex += 1) {
        const leftPosition = relaxedPositions[leftIndex];
        const rightPosition = relaxedPositions[rightIndex];
        const deltaX = rightPosition.x - leftPosition.x;
        const deltaY = rightPosition.y - leftPosition.y;
        const distance = Math.max(Math.hypot(deltaX, deltaY), 0.001);
        const minimumDistance =
          (leftPosition.size + rightPosition.size) / 2 + BUBBLE_SURFACE_GAP;
        const overlap = minimumDistance - distance;

        if (overlap <= 0) {
          continue;
        }

        const offsetX = (deltaX / distance) * overlap;
        const offsetY = (deltaY / distance) * overlap;

        leftPosition.x -= offsetX / 2;
        leftPosition.y -= offsetY / 2;
        rightPosition.x += offsetX / 2;
        rightPosition.y += offsetY / 2;
      }
    }
  }

  return relaxedPositions;
}

function BubbleLabel({
  isSelected,
  label,
}: {
  isSelected: boolean;
  label: string;
}) {
  const words = label.split(' ');
  const shouldOpticallyCenterMultilineLabel = words.length > 1;

  return (
    <span
      className={cn(
        'flex w-full max-w-full flex-wrap content-center items-center justify-center gap-x-1 gap-y-0.5 text-center text-[14px] leading-[1.15] transition-transform duration-300 ease-out [transform-origin:center_center] [word-break:keep-all]',
        isSelected ? 'scale-[1.14]' : 'scale-100',
        shouldOpticallyCenterMultilineLabel ? 'translate-y-[2px]' : '',
      )}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="whitespace-nowrap">
          {word}
        </span>
      ))}
    </span>
  );
}

function TasteExperienceMap({
  focusExperienceId,
  onConfirm,
  onToggleSelection,
  selectedExperienceIds,
}: {
  focusExperienceId?: string | null;
  onConfirm: (experience: TasteExperienceWord) => void;
  onToggleSelection?: (experience: TasteExperienceWord) => readonly string[] | void;
  selectedExperienceIds: readonly string[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const hasExploredMapRef = useRef(false);
  const hasInitializedMapRef = useRef(false);
  const hasExpandedMapZoomRef = useRef(false);
  const isPinchingMapRef = useRef(false);
  const isTouchGestureRef = useRef(false);
  const isTouchingMapRef = useRef(false);
  const isSnappingRef = useRef(false);
  const hasReleasedScrollRef = useRef(false);
  const suppressSnapUntilRef = useRef(0);
  const mapZoomRef = useRef(BUBBLE_MAP_ENTRY_ZOOM);
  const pinchGestureRef = useRef<{
    anchorX: number;
    anchorY: number;
    initialDistance: number;
    initialZoom: number;
    midpointX: number;
    midpointY: number;
  } | null>(null);
  const settleAnimationFrameRef = useRef<number | null>(null);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const [draftSelectedExperienceId, setDraftSelectedExperienceId] = useState<string | null>(
    selectedExperienceIds[0] ?? null,
  );
  const [mapZoom, setMapZoom] = useState(BUBBLE_MAP_ENTRY_ZOOM);
  const [isFeedbackCardVisible, setIsFeedbackCardVisible] = useState(true);
  const selectedExperienceIdRef = useRef<string | null | undefined>(draftSelectedExperienceId);
  const resolvedSelectedExperience = findTasteExperience(draftSelectedExperienceId);
  const resolvedSelectedExperienceId = resolvedSelectedExperience?.id ?? draftSelectedExperienceId;
  const selectedExperienceIdSet = new Set(selectedExperienceIds);
  const enlargedExperienceIds =
    selectedExperienceIds.length >= 3
      ? [...selectedExperienceIds]
      : [
        ...selectedExperienceIds,
        ...(resolvedSelectedExperienceId ? [resolvedSelectedExperienceId] : []),
      ];

  useEffect(() => {
    const nextSelectedExperienceId = selectedExperienceIds[0] ?? null;

    if (selectedExperienceIdRef.current && selectedExperienceIds.includes(selectedExperienceIdRef.current)) {
      return;
    }

    selectedExperienceIdRef.current = nextSelectedExperienceId;
    setDraftSelectedExperienceId(nextSelectedExperienceId);
  }, [selectedExperienceIds]);

  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  const getClosestSnapTarget = () => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return null;
    }

    const zoom = mapZoomRef.current;
    const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    const centerY = viewport.scrollTop + viewport.clientHeight / 2;
    const candidates: TasteExperienceSnapTarget[] = [
      { kind: 'neutral', position: tasteExperienceNeutralBubblePosition },
      ...tasteExperienceBubblePositions.map((position) => ({ kind: 'bubble' as const, position })),
    ];

    return candidates.reduce((currentClosest, candidate) => {
      const currentX = currentClosest.position.x * zoom + viewport.clientWidth / 2;
      const currentY = currentClosest.position.y * zoom + viewport.clientHeight / 2;
      const nextX = candidate.position.x * zoom + viewport.clientWidth / 2;
      const nextY = candidate.position.y * zoom + viewport.clientHeight / 2;
      const currentDistance = Math.hypot(currentX - centerX, currentY - centerY);
      const nextDistance = Math.hypot(nextX - centerX, nextY - centerY);

      return nextDistance < currentDistance ? candidate : currentClosest;
    });
  };

  const selectClosestBubble = () => {
    const closest = getClosestSnapTarget();

    if (!closest) {
      return null;
    }

    if (closest.kind === 'neutral') {
      if (selectedExperienceIdRef.current !== null) {
        selectedExperienceIdRef.current = null;
        setDraftSelectedExperienceId(null);
      }

      return closest;
    }

    if (closest.position.experience.id !== selectedExperienceIdRef.current) {
      selectedExperienceIdRef.current = closest.position.experience.id;
      setDraftSelectedExperienceId(closest.position.experience.id);
    }

    return closest;
  };

  const clearSettledSnap = () => {
    if (settleAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(settleAnimationFrameRef.current);
      settleAnimationFrameRef.current = null;
    }
  };

  const clearMapZoomAnimation = () => {
    if (zoomAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomAnimationFrameRef.current);
      zoomAnimationFrameRef.current = null;
    }
  };

  const suppressSnapAfterPinch = () => {
    suppressSnapUntilRef.current = window.performance.now() + BUBBLE_MAP_PINCH_SNAP_SUPPRESS_MS;
  };

  const isSnapSuppressed = () => window.performance.now() < suppressSnapUntilRef.current;

  useEffect(() => () => {
    clearSettledSnap();
    clearMapZoomAnimation();
  }, []);

  const animateMapZoomTo = (nextZoom: number, anchorPoint?: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    const currentZoom = mapZoomRef.current;
    const anchorX = anchorPoint?.x ?? (viewport ? viewport.scrollLeft / currentZoom : BUBBLE_MAP_NEUTRAL_POINT.x);
    const anchorY = anchorPoint?.y ?? (viewport ? viewport.scrollTop / currentZoom : BUBBLE_MAP_NEUTRAL_POINT.y);

    clearMapZoomAnimation();

    if (!viewport) {
      mapZoomRef.current = nextZoom;
      setMapZoom(nextZoom);
      return;
    }

    const startTime = window.performance.now();
    const startZoom = currentZoom;
    const startLeft = viewport.scrollLeft;
    const startTop = viewport.scrollTop;
    const targetLeft = anchorX * nextZoom;
    const targetTop = anchorY * nextZoom;

    const animateFrame = (now: number) => {
      const progress = clampNumber((now - startTime) / BUBBLE_MAP_ZOOM_TRANSITION_MS, 0, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextFrameZoom = startZoom + (nextZoom - startZoom) * easedProgress;

      mapZoomRef.current = nextFrameZoom;
      setMapZoom(nextFrameZoom);
      viewport.scrollLeft = startLeft + (targetLeft - startLeft) * easedProgress;
      viewport.scrollTop = startTop + (targetTop - startTop) * easedProgress;

      if (progress < 1) {
        zoomAnimationFrameRef.current = window.requestAnimationFrame(animateFrame);
        return;
      }

      zoomAnimationFrameRef.current = null;
      mapZoomRef.current = nextZoom;
      setMapZoom(nextZoom);
      viewport.scrollLeft = targetLeft;
      viewport.scrollTop = targetTop;
    };

    zoomAnimationFrameRef.current = window.requestAnimationFrame(animateFrame);
  };

  const expandMapToSelectedZoom = (anchorPoint?: { x: number; y: number }) => {
    if (hasExpandedMapZoomRef.current) {
      return;
    }

    hasExpandedMapZoomRef.current = true;
    animateMapZoomTo(BUBBLE_MAP_SELECTED_ZOOM, anchorPoint);
  };

  const shrinkMapToEntryZoom = (anchorPoint?: { x: number; y: number }) => {
    if (!hasExpandedMapZoomRef.current) {
      return;
    }

    hasExpandedMapZoomRef.current = false;
    animateMapZoomTo(BUBBLE_MAP_ENTRY_ZOOM, anchorPoint);
  };

  const snapMapToTarget = (target: TasteExperienceSnapTarget) => {
    const nextZoom = target.kind === 'neutral' ? BUBBLE_MAP_ENTRY_ZOOM : BUBBLE_MAP_SELECTED_ZOOM;

    hasExpandedMapZoomRef.current = target.kind === 'bubble';
    animateMapZoomTo(nextZoom, target.position);
  };

  const snapClosestBubbleToCenter = () => {
    const viewport = viewportRef.current;
    const closest = selectClosestBubble();

    if (!viewport || !closest) {
      return;
    }

    setIsFeedbackCardVisible(false);
    isSnappingRef.current = true;
    snapMapToTarget(closest);

    window.setTimeout(() => {
      isSnappingRef.current = false;
      setIsFeedbackCardVisible(closest.kind === 'bubble');
    }, BUBBLE_MAP_ZOOM_TRANSITION_MS + 40);
  };

  const scheduleSettledSnap = () => {
    clearSettledSnap();

    const viewport = viewportRef.current;

    if (
      !viewport ||
      isPinchingMapRef.current ||
      isSnapSuppressed() ||
      isTouchingMapRef.current ||
      isSnappingRef.current
    ) {
      return;
    }

    let lastLeft = viewport.scrollLeft;
    let lastTop = viewport.scrollTop;
    let stableFrameCount = 0;

    const waitForScrollToSettle = () => {
      const currentViewport = viewportRef.current;

      if (
        !currentViewport ||
        isPinchingMapRef.current ||
        isSnapSuppressed() ||
        isTouchingMapRef.current ||
        isSnappingRef.current
      ) {
        settleAnimationFrameRef.current = null;
        return;
      }

      const nextLeft = currentViewport.scrollLeft;
      const nextTop = currentViewport.scrollTop;
      const movement = Math.hypot(nextLeft - lastLeft, nextTop - lastTop);

      if (movement < 0.35) {
        stableFrameCount += 1;
      } else {
        stableFrameCount = 0;
      }

      lastLeft = nextLeft;
      lastTop = nextTop;

      if (stableFrameCount >= 8) {
        settleAnimationFrameRef.current = null;
        hasReleasedScrollRef.current = false;
        snapClosestBubbleToCenter();
        return;
      }

      settleAnimationFrameRef.current = window.requestAnimationFrame(waitForScrollToSettle);
    };

    settleAnimationFrameRef.current = window.requestAnimationFrame(waitForScrollToSettle);
  };

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const selectedBubble = tasteExperienceBubblePositions.find(
      (bubble) => bubble.experience.id === resolvedSelectedExperienceId,
    );
    const targetX = selectedBubble?.x ?? BUBBLE_MAP_NEUTRAL_POINT.x;
    const targetY = selectedBubble?.y ?? BUBBLE_MAP_NEUTRAL_POINT.y;

    viewport.scrollLeft = targetX * mapZoomRef.current;
    viewport.scrollTop = targetY * mapZoomRef.current;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        hasInitializedMapRef.current = true;

        if (selectedBubble) {
          selectClosestBubble();
        }
      });
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || !focusExperienceId || !hasInitializedMapRef.current) {
      return;
    }

    const focusedBubble = tasteExperienceBubblePositions.find(
      (bubble) => bubble.experience.id === focusExperienceId,
    );

    if (!focusedBubble) {
      return;
    }

    hasExploredMapRef.current = true;
    selectedExperienceIdRef.current = focusExperienceId;
    setDraftSelectedExperienceId(focusExperienceId);
    setIsFeedbackCardVisible(false);
    expandMapToSelectedZoom(focusedBubble);
    isSnappingRef.current = true;
    viewport.scrollTo({
      behavior: 'smooth',
      left: focusedBubble.x * mapZoomRef.current,
      top: focusedBubble.y * mapZoomRef.current,
    });

    window.setTimeout(() => {
      isSnappingRef.current = false;
      setIsFeedbackCardVisible(true);
    }, 420);
  }, [focusExperienceId]);

  const handleMapScroll = () => {
    if (!hasInitializedMapRef.current) {
      return;
    }

    hasExploredMapRef.current = true;
    if (isPinchingMapRef.current || isSnapSuppressed()) {
      return;
    }

    if (!isSnappingRef.current) {
      setIsFeedbackCardVisible(false);
    }
    window.requestAnimationFrame(selectClosestBubble);

    if (
      isSnappingRef.current ||
      isTouchingMapRef.current ||
      (isTouchGestureRef.current && !hasReleasedScrollRef.current)
    ) {
      return;
    }

    hasReleasedScrollRef.current = true;
    scheduleSettledSnap();
  };

  const getTouchDistance = (touches: TouchList) => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];

    return Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
  };

  const getTouchMidpoint = (touches: TouchList) => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];

    return {
      x: (firstTouch.clientX + secondTouch.clientX) / 2,
      y: (firstTouch.clientY + secondTouch.clientY) / 2,
    };
  };

  const beginPinchGesture = (event: React.TouchEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;

    if (!viewport || event.touches.length < 2) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const midpoint = getTouchMidpoint(event.touches);
    const midpointX = midpoint.x - viewportRect.left;
    const midpointY = midpoint.y - viewportRect.top;
    const initialZoom = mapZoomRef.current;

    isPinchingMapRef.current = true;
    suppressSnapAfterPinch();
    clearSettledSnap();
    clearMapZoomAnimation();
    pinchGestureRef.current = {
      anchorX: (viewport.scrollLeft + midpointX - viewport.clientWidth / 2) / initialZoom,
      anchorY: (viewport.scrollTop + midpointY - viewport.clientHeight / 2) / initialZoom,
      initialDistance: getTouchDistance(event.touches),
      initialZoom,
      midpointX,
      midpointY,
    };
  };

  const handleMapTouchStart = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    hasExploredMapRef.current = true;
    isTouchGestureRef.current = 'touches' in event;
    isTouchingMapRef.current = true;
    hasReleasedScrollRef.current = false;
    clearSettledSnap();

    if ('touches' in event && event.touches.length >= 2) {
      beginPinchGesture(event);
      return;
    }
  };

  const handleMapTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const pinchGesture = pinchGestureRef.current;

    if (!viewport || !pinchGesture || event.touches.length < 2) {
      return;
    }

    event.preventDefault();
    const nextZoom = clampNumber(
      pinchGesture.initialZoom * (getTouchDistance(event.touches) / pinchGesture.initialDistance),
      BUBBLE_MAP_ZOOM_MIN,
      BUBBLE_MAP_ZOOM_MAX,
    );

    clearMapZoomAnimation();
    mapZoomRef.current = nextZoom;
    setMapZoom(nextZoom);
    window.requestAnimationFrame(() => {
      viewport.scrollLeft = viewport.clientWidth / 2 + pinchGesture.anchorX * nextZoom - pinchGesture.midpointX;
      viewport.scrollTop = viewport.clientHeight / 2 + pinchGesture.anchorY * nextZoom - pinchGesture.midpointY;
    });
  };

  const handleMapTouchEnd = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in event && event.touches.length >= 2) {
      beginPinchGesture(event);
      return;
    }

    if (isPinchingMapRef.current) {
      pinchGestureRef.current = null;
      isPinchingMapRef.current = false;
      suppressSnapAfterPinch();
      isTouchingMapRef.current = 'touches' in event && event.touches.length > 0;
      hasReleasedScrollRef.current = false;
      return;
    }

    pinchGestureRef.current = null;
    isTouchingMapRef.current = false;
    hasReleasedScrollRef.current = true;
    scheduleSettledSnap();
  };

  const handleMapPointerCancel = () => {
    const wasPinching = isPinchingMapRef.current;

    pinchGestureRef.current = null;
    isPinchingMapRef.current = false;
    if (wasPinching) {
      suppressSnapAfterPinch();
    }
    isTouchingMapRef.current = false;

    if (hasReleasedScrollRef.current) {
      scheduleSettledSnap();
    }
  };

  const handleMapMouseLeave = () => {
    if (isTouchGestureRef.current && isTouchingMapRef.current) {
      return;
    }

    handleMapPointerCancel();
  };

  const selectedExperience = resolvedSelectedExperience;
  const renderedBubblePositions = getTasteExperienceBubbleRenderPositions(
    enlargedExperienceIds,
  );
  const selectedBubblePosition = renderedBubblePositions.find(
    (position) => position.experience.id === resolvedSelectedExperienceId,
  );

  const focusBubblePosition = (bubblePosition: (typeof renderedBubblePositions)[number]) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    selectedExperienceIdRef.current = bubblePosition.experience.id;
    setDraftSelectedExperienceId(bubblePosition.experience.id);
    setIsFeedbackCardVisible(false);
    expandMapToSelectedZoom(bubblePosition);
    isSnappingRef.current = true;
    viewport.scrollTo({
      behavior: 'smooth',
      left: bubblePosition.x * mapZoomRef.current,
      top: bubblePosition.y * mapZoomRef.current,
    });

    window.setTimeout(() => {
      isSnappingRef.current = false;
      setIsFeedbackCardVisible(true);
    }, 420);
  };

  const focusNextUnselectedBubbleTowardCenter = (
    currentExperienceId: string,
    selectedIds: readonly string[] = selectedExperienceIds,
  ) => {
    const currentPosition = renderedBubblePositions.find(
      (position) => position.experience.id === currentExperienceId,
    );

    if (!currentPosition) {
      return;
    }

    const currentCenterDistance = Math.hypot(
      currentPosition.x - BUBBLE_MAP_NEUTRAL_POINT.x,
      currentPosition.y - BUBBLE_MAP_NEUTRAL_POINT.y,
    );
    const centerDeltaX = BUBBLE_MAP_NEUTRAL_POINT.x - currentPosition.x;
    const centerDeltaY = BUBBLE_MAP_NEUTRAL_POINT.y - currentPosition.y;
    const centerDistance = Math.max(1, Math.hypot(centerDeltaX, centerDeltaY));
    const targetX = currentPosition.x + (centerDeltaX / centerDistance) * BUBBLE_GRID_SPACING;
    const targetY = currentPosition.y + (centerDeltaY / centerDistance) * BUBBLE_GRID_SPACING;
    const selectedIdSet = new Set(selectedIds);
    const nextBubblePosition = renderedBubblePositions
      .filter((position) => !selectedIdSet.has(position.experience.id))
      .reduce<(typeof renderedBubblePositions)[number] | null>((bestPosition, position) => {
        const distanceFromTarget = Math.hypot(position.x - targetX, position.y - targetY);
        const distanceFromCurrent = Math.hypot(position.x - currentPosition.x, position.y - currentPosition.y);
        const nextCenterDistance = Math.hypot(
          position.x - BUBBLE_MAP_NEUTRAL_POINT.x,
          position.y - BUBBLE_MAP_NEUTRAL_POINT.y,
        );
        const score =
          distanceFromTarget +
          Math.abs(distanceFromCurrent - BUBBLE_GRID_SPACING) * 0.35 +
          (nextCenterDistance > currentCenterDistance ? BUBBLE_GRID_SPACING * 2 : 0);

        if (!bestPosition) {
          return position;
        }

        const bestDistanceFromTarget = Math.hypot(bestPosition.x - targetX, bestPosition.y - targetY);
        const bestDistanceFromCurrent = Math.hypot(bestPosition.x - currentPosition.x, bestPosition.y - currentPosition.y);
        const bestCenterDistance = Math.hypot(
          bestPosition.x - BUBBLE_MAP_NEUTRAL_POINT.x,
          bestPosition.y - BUBBLE_MAP_NEUTRAL_POINT.y,
        );
        const bestScore =
          bestDistanceFromTarget +
          Math.abs(bestDistanceFromCurrent - BUBBLE_GRID_SPACING) * 0.35 +
          (bestCenterDistance > currentCenterDistance ? BUBBLE_GRID_SPACING * 2 : 0);

        return score < bestScore ? position : bestPosition;
      }, null);

    if (nextBubblePosition) {
      focusBubblePosition(nextBubblePosition);
    }
  };

  return (
    <div className="taste-experience-map-intro relative h-full w-full overflow-hidden bg-[var(--tb-color-bg-focus)]">
      <div className="pointer-events-none absolute inset-0 z-50 bg-white taste-experience-map-intro-veil" />
      <div
        ref={viewportRef}
        onScroll={handleMapScroll}
        onMouseDown={handleMapTouchStart}
        onMouseLeave={handleMapMouseLeave}
        onMouseUp={handleMapTouchEnd}
        onPointerCancel={handleMapPointerCancel}
        onTouchCancel={handleMapPointerCancel}
        onTouchEnd={handleMapTouchEnd}
        onTouchMove={handleMapTouchMove}
        onTouchStart={handleMapTouchStart}
        className="h-full w-full cursor-grab overflow-auto overscroll-contain bg-[var(--tb-color-bg-focus)] no-scrollbar active:cursor-grabbing [touch-action:pan-x_pan-y]"
      >
        <div
          className="relative"
          style={{
            height: `calc(${BUBBLE_MAP_SIZE * mapZoom}px + 100vh)`,
            width: `calc(${BUBBLE_MAP_SIZE * mapZoom}px + 100vw)`,
          }}
        >
          <div
            className="absolute"
            style={{
              height: BUBBLE_MAP_SIZE,
              left: '50vw',
              top: '50vh',
              transform: `scale(${mapZoom})`,
              transformOrigin: '0 0',
              width: BUBBLE_MAP_SIZE,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{
                height: tasteExperienceNeutralBubblePosition.size,
                left: tasteExperienceNeutralBubblePosition.x,
                top: tasteExperienceNeutralBubblePosition.y,
                width: tasteExperienceNeutralBubblePosition.size,
              }}
            />
            {renderedBubblePositions.map(({ experience, size, x, y }) => {
              const isSelected = enlargedExperienceIds.includes(experience.id);
              const priorityIndex = selectedExperienceIds.indexOf(experience.id);
              const distanceFromSelected = selectedBubblePosition
                ? Math.hypot(x - selectedBubblePosition.x, y - selectedBubblePosition.y)
                : undefined;
              const introDelay = getTasteExperienceIntroDelay(experience.id);

              return (
                <div
                  key={experience.id}
                  aria-label={experience.label}
                  onClick={(event) => {
                    event.stopPropagation();
                    expandMapToSelectedZoom({ x, y });
                    selectedExperienceIdRef.current = experience.id;
                    setDraftSelectedExperienceId(experience.id);
                    const nextSelectedExperienceIds = onToggleSelection?.(experience);

                    if (
                      Array.isArray(nextSelectedExperienceIds) &&
                      nextSelectedExperienceIds.includes(experience.id) &&
                      nextSelectedExperienceIds.length < 3
                    ) {
                      window.setTimeout(() => {
                        focusNextUnselectedBubbleTowardCenter(experience.id, nextSelectedExperienceIds);
                      }, 120);
                    }
                  }}
                  className={cn(
                    'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none transition-all duration-300 ease-out',
                    isSelected ? 'z-[4]' : 'z-[3]',
                  )}
                  style={{
                    height: size,
                    left: x,
                    top: y,
                    width: size,
                  }}
                >
                  <div
                    className={cn(
                      'taste-experience-bubble-intro relative flex h-full w-full items-center justify-center rounded-full px-4 text-center text-[14px] font-bold leading-tight transition-all duration-300 ease-out',
                      isSelected ? 'border shadow-[0_18px_46px_rgba(0,0,0,0.12)]' : 'border-0 shadow-none',
                    )}
                    style={{
                      ...getTasteExperienceStyle(experience.axis, experience.intensity, {
                        distanceFromSelected,
                        isSelected,
                      }),
                      animationDelay: `${introDelay}ms`,
                      animationDuration: `${BUBBLE_INTRO_DURATION_MS}ms`,
                    }}
                  >
                    {priorityIndex >= 0 ? (
                      <span className="absolute left-1/2 top-[34%] -translate-x-1/2 text-[10px] font-semibold leading-none opacity-70">
                        {priorityIndex === 0 ? '메인 미각' : '보조 미각'}
                      </span>
                    ) : null}
                    <BubbleLabel
                      isSelected={isSelected}
                      label={experience.label}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedExperience ? (
        <div
          className={cn(
            'absolute inset-x-0 bottom-[max(20px,var(--tb-safe-area-bottom))] z-30 px-5 transition-all duration-200 ease-out',
            isFeedbackCardVisible
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0',
          )}
        >
          <SectionCard hoverEffect={false} className="border-1 p-4">
            <div className="flex w-full items-center gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className="text-[16px] font-bold leading-tight"
                  style={{ color: `var(--tb-taste-${selectedExperience.axis}-main)` }}
                >
                  {selectedExperience.label}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-[var(--tb-color-text-subtle)]">
                  {selectedExperience.description}
                </p>
                <TasteSelectionPriorityGuide
                  activeExperienceId={selectedExperience.id}
                  selectedExperienceIds={selectedExperienceIds}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedExperienceIds.length < 3 && selectedExperienceIdSet.has(selectedExperience.id)) {
                    focusNextUnselectedBubbleTowardCenter(selectedExperience.id);
                    return;
                  }

                  onConfirm(selectedExperience);
                }}
                className="pointer-events-auto ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] transition hover:opacity-90"
                aria-label={
                  selectedExperienceIds.length >= 3
                    ? '선택한 미각 인상으로 계속하기'
                    : selectedExperienceIdSet.has(selectedExperience.id)
                      ? '다음 미각 후보로 이동하기'
                      : '현재 미각 인상 선택하기'
                }
              >
                <ArrowRight size={ICON_TOKENS.size.md} strokeWidth={2} />
              </button>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}

function TasteSelectionPriorityGuide({
  activeExperienceId,
  selectedExperienceIds,
}: {
  activeExperienceId: string;
  selectedExperienceIds: readonly string[];
}) {
  const activeSlotIndex = Math.min(selectedExperienceIds.length, 2);
  const activeLabel = selectedExperienceIds.length === 0
    ? '메인 미각 선택'
    : selectedExperienceIds.length < 3
      ? '보조 미각 선택'
      : '미각 선택 완료';

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      {[0, 1, 2].map((slotIndex) => {
        const slotExperience = findTasteExperience(selectedExperienceIds[slotIndex]);
        const isFilled = Boolean(slotExperience);
        const isActiveSlot = slotIndex === activeSlotIndex;
        const slotColor = slotExperience
          ? `var(--tb-taste-${slotExperience.axis}-main)`
          : 'var(--tb-color-border-default)';

        return (
          <span
            key={slotIndex}
            className="inline-flex min-h-4 items-center gap-1.5"
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full border"
              style={{
                backgroundColor: isFilled ? slotColor : 'transparent',
                borderColor: slotColor,
              }}
            />
            {isActiveSlot ? (
              <span className="whitespace-nowrap text-[11px] font-semibold leading-none text-[var(--tb-color-text-faint)]">
                {activeLabel}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function getSelectedChoice(dish: DiningDishMetadata, draft: DiningFeedbackDraft) {
  const selectedChoiceId = draft.dishResponses[dish.id]?.selectedChoiceId;
  return dish.feedbackChoices.find((choice) => choice.id === selectedChoiceId) ?? dish.feedbackChoices[0];
}

function getCustomDetailTagId(categoryId: string, label: string) {
  return `custom:${categoryId}:${label.trim()}`;
}

function getRecommendedDishKindIds(dish: DiningDishMetadata) {
  return inferDishKindIds(dish);
}

function getRecommendedDetailTagIds({
  dishKindIds,
  experiences,
}: {
  dishKindIds: readonly string[];
  experiences: readonly TasteExperienceWord[];
}) {
  const recommendedIds = [
    ...experiences.flatMap((experience) =>
      RECOMMENDED_DETAIL_TAG_IDS_BY_TASTE_AXIS[experience.axis] ?? [],
    ),
    ...dishKindIds.flatMap((kindId) => RECOMMENDED_DETAIL_TAG_IDS_BY_DISH_KIND[kindId] ?? []),
  ];
  const seenIds = new Set<string>();

  return recommendedIds.filter((tagId) => {
    if (seenIds.has(tagId)) {
      return false;
    }

    seenIds.add(tagId);
    return true;
  });
}

function getSelectedDishKindIds(
  dish: DiningDishMetadata,
  response: { selectedDishKindIds?: string[] } | undefined,
) {
  const selectedIds = response?.selectedDishKindIds ?? [];

  return selectedIds.length > 0 ? selectedIds : getRecommendedDishKindIds(dish);
}

function getCustomDishKindLabelsFromIds(kindIds: readonly string[]) {
  return kindIds
    .filter((kindId) => kindId.startsWith(CUSTOM_DISH_KIND_PREFIX))
    .map((kindId) => getDishKindLabel(kindId));
}

function CustomDishSelectionCard({
  description,
  editInputRef,
  editValue,
  isEditing,
  onCancelEdit,
  onChangeEditValue,
  onEdit,
  onRemove,
  onSaveEdit,
  onSelect,
  selected,
  title,
  trailing,
}: {
  description?: string;
  editInputRef: RefObject<HTMLInputElement | null>;
  editValue: string;
  isEditing: boolean;
  onCancelEdit: () => void;
  onChangeEditValue: (value: string) => void;
  onEdit: () => void;
  onRemove: () => void;
  onSaveEdit: () => void;
  onSelect: () => void;
  selected: boolean;
  title: string;
  trailing?: ReactNode;
}) {
  const canSaveEdit = editValue.trim().length > 0;

  return (
    <div
      className={cn(
        'flex w-full items-stretch gap-3 rounded-[var(--tb-radius-20)] border p-4 text-left transition-all',
        selected
          ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-base)] shadow-[0_12px_24px_rgba(15,15,15,0.06)]'
          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)]',
      )}
    >
      {isEditing ? (
        <form
          className="flex min-w-0 flex-1 items-start gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveEdit();
          }}
        >
          <span
            aria-hidden="true"
            className="mt-[2px] flex size-[18px] shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-[var(--tb-color-text-primary)] shadow-[inset_0_0_0_2px_var(--tb-color-text-primary)]"
          >
            <span className="size-[8px] rounded-full bg-[var(--tb-color-text-primary)]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <input
              ref={editInputRef}
              value={editValue}
              onChange={(event) => onChangeEditValue(event.target.value)}
              className="h-[22px] min-w-0 bg-transparent p-0 text-[14px] font-semibold leading-normal text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
              aria-label={`${title} 메뉴명 수정`}
              enterKeyHint="done"
              required
            />
            {description ? (
              <span className="text-[12px] font-normal leading-normal text-[var(--tb-color-text-muted)]">
                {description}
              </span>
            ) : null}
          </span>
        </form>
      ) : (
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            aria-pressed={selected}
            aria-label={`${title} 선택`}
            onClick={onSelect}
            className={cn(
              'mt-[2px] flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2',
              selected
                ? 'border-transparent bg-transparent text-[var(--tb-color-text-primary)] shadow-[inset_0_0_0_2px_var(--tb-color-text-primary)]'
                : 'border-[var(--tb-color-border-disabled)] bg-transparent text-transparent',
            )}
          >
            <span
              className={cn(
                'size-[8px] rounded-full transition-colors',
                selected ? 'bg-[var(--tb-color-text-primary)]' : 'bg-transparent',
              )}
            />
          </button>

          <span className="flex min-w-0 flex-1 flex-col">
            <button
              type="button"
              aria-pressed={selected}
              onClick={onSelect}
              className="w-fit max-w-full rounded-[6px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2"
            >
              <span className="block truncate text-[14px] font-semibold leading-normal text-[var(--tb-color-text-primary)]">
                {title}
              </span>
            </button>
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {description ? (
                <span className="text-[12px] font-normal leading-normal text-[var(--tb-color-text-muted)]">
                  {description}
                </span>
              ) : null}
            </span>
          </span>
        </span>
      )}

      <span className="flex min-h-[36px] shrink-0 flex-col items-end justify-between">
        {trailing ? <span className="shrink-0">{trailing}</span> : <span aria-hidden="true" />}
        <span className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-[11px] font-semibold text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={!canSaveEdit}
                className={cn(
                  'text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2',
                  canSaveEdit
                    ? 'text-[var(--tb-color-text-primary)] hover:text-[var(--tb-color-text-secondary)]'
                    : 'text-[var(--tb-color-text-disabled)]',
                )}
              >
                저장
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label={`${title} 카드 수정`}
                onClick={onEdit}
                className="text-[11px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2"
              >
                수정
              </button>
              <button
                type="button"
                aria-label={`${title} 카드 제거`}
                onClick={onRemove}
                className="text-[11px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2"
              >
                제거
              </button>
            </>
          )}
        </span>
      </span>
    </div>
  );
}

function DishKindTagSelector({
  customLabels,
  inputValue,
  isInputOpen,
  onAddCustomKind,
  onChangeInputValue,
  onCloseInput,
  onOpenInput,
  onToggleKind,
  recommendedKindIds,
  selectedKindIds,
}: {
  customLabels: readonly string[];
  inputValue: string;
  isInputOpen: boolean;
  onAddCustomKind: () => void;
  onChangeInputValue: (value: string) => void;
  onCloseInput: () => void;
  onOpenInput: () => void;
  onToggleKind: (kindId: string) => void;
  recommendedKindIds: readonly string[];
  selectedKindIds: readonly string[];
}) {
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const selectedIdSet = new Set(selectedKindIds);
  const recommendedIdSet = new Set(recommendedKindIds);
  const orderedOptions = [
    ...recommendedKindIds
      .map((kindId) => DISH_KIND_OPTIONS.find((option) => option.id === kindId))
      .filter((option): option is (typeof DISH_KIND_OPTIONS)[number] => Boolean(option)),
    ...DISH_KIND_OPTIONS.filter((option) => !recommendedIdSet.has(option.id)),
  ];
  const customOptions = customLabels.map((label) => ({
    id: getCustomDishKindId(label),
    label,
  }));

  useEffect(() => {
    if (isInputOpen) {
      customInputRef.current?.focus();
    }
  }, [isInputOpen]);

  return (
    <section className="rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
            디시 종류
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            추천 태그를 먼저 골라두었어요. 메뉴와 다르면 직접 바꿔주세요.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-[var(--tb-color-text-faint)]">
          선택사항
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {orderedOptions.map((option) => {
          const isSelected = selectedIdSet.has(option.id);
          const isRecommended = recommendedIdSet.has(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggleKind(option.id)}
              className={cn(
                'rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
                isSelected
                  ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
                  : isRecommended
                    ? 'border-[var(--tb-user-accent-main)] bg-[color-mix(in_srgb,var(--tb-user-accent-main)_12%,white)] text-[var(--tb-user-accent-main)]'
                    : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-subtle)]',
              )}
            >
              {option.label}
            </button>
          );
        })}
        {customOptions.map((option) => {
          const isSelected = selectedIdSet.has(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggleKind(option.id)}
              className={cn(
                'rounded-full border border-dashed px-3 py-2 text-[12px] font-semibold transition-colors',
                isSelected
                  ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
                  : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-subtle)]',
              )}
            >
              {option.label}
            </button>
          );
        })}

        {isInputOpen ? (
          <form
            className="inline-flex h-9 min-w-[116px] items-center gap-2 rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3"
            onSubmit={(event) => {
              event.preventDefault();
              onAddCustomKind();
            }}
          >
            <input
              ref={customInputRef}
              value={inputValue}
              onChange={(event) => onChangeInputValue(event.target.value)}
              onBlur={() => {
                if (!inputValue.trim()) {
                  onCloseInput();
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
              placeholder="직접 입력"
              enterKeyHint="done"
              aria-label="디시 종류 직접 입력"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={onOpenInput}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 text-[12px] font-semibold text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
          >
            <Plus size={ICON_TOKENS.size.sm} strokeWidth={1.8} />
            직접 입력
          </button>
        )}
      </div>
    </section>
  );
}

function DiningDetailTagSection({
  accentAxis,
  category,
  customTags,
  inputValue,
  isInputOpen,
  onAddCustomTag,
  onCloseInput,
  onChangeInputValue,
  onOpenInput,
  onToggleTag,
  recommendedTagIds,
  selectedTagIds,
}: {
  accentAxis: TasteAxisId;
  category: DiningDetailTagCategory;
  customTags: readonly string[];
  inputValue: string;
  isInputOpen: boolean;
  onAddCustomTag: () => void;
  onCloseInput: () => void;
  onChangeInputValue: (value: string) => void;
  onOpenInput: () => void;
  onToggleTag: (tagId: string) => void;
  recommendedTagIds?: readonly string[];
  selectedTagIds: readonly string[];
}) {
  const selectedTagIdSet = new Set(selectedTagIds);
  const recommendedTagIdSet = new Set(recommendedTagIds ?? []);
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const standardTags = category.tags.map((tag) => ({ ...tag, custom: false }));
  const customTagItems = customTags.map((label) => ({
    custom: true,
    id: getCustomDetailTagId(category.id, label),
    label,
  }));
  const allTags = [...standardTags, ...customTagItems].sort((left, right) => {
    const leftRecommended = recommendedTagIdSet.has(left.id);
    const rightRecommended = recommendedTagIdSet.has(right.id);

    if (leftRecommended !== rightRecommended) {
      return leftRecommended ? -1 : 1;
    }

    return 0;
  });
  const tagRowBreakIndex = Math.ceil(allTags.length / 2);
  const tagRows = [allTags.slice(0, tagRowBreakIndex), allTags.slice(tagRowBreakIndex)];
  const renderTagButton = (tag: (typeof allTags)[number]) => {
    const selected = selectedTagIdSet.has(tag.id);
    const recommended = recommendedTagIdSet.has(tag.id);

    return (
      <button
        key={tag.id}
        type="button"
        onClick={() => onToggleTag(tag.id)}
        className={cn(
          'shrink-0 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
          selected
            ? ''
            : recommended
              ? 'border-[color-mix(in_srgb,var(--tb-user-accent-main)_46%,white)] bg-[color-mix(in_srgb,var(--tb-user-accent-main)_10%,white)] text-[var(--tb-user-accent-main)]'
            : tag.custom
              ? 'border-dashed border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-subtle)]'
              : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-subtle)]',
        )}
        style={
          selected
            ? ({
              backgroundColor: `var(--tb-taste-${accentAxis}-tint-surface)`,
              borderColor: `var(--tb-taste-${accentAxis}-tint-soft-border)`,
              color: `var(--tb-taste-${accentAxis}-tint-surface-text)`,
            } as CSSProperties)
            : undefined
        }
      >
        {tag.label}
      </button>
    );
  };
  const customInputControl = isInputOpen ? (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onAddCustomTag();
      }}
      className={cn(
        'inline-grid h-9 max-w-full shrink-0 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)]',
        inputValue ? 'min-w-9 grid-cols-[max-content] px-3' : 'w-9 grid-cols-[minmax(0,1fr)] px-3',
      )}
    >
      {inputValue ? (
        <span
          className="invisible col-start-1 row-start-1 whitespace-pre text-[12px] font-semibold"
          aria-hidden="true"
        >
          {inputValue}
        </span>
      ) : null}
      <input
        ref={customInputRef}
        size={1}
        value={inputValue}
        onChange={(event) => onChangeInputValue(event.target.value)}
        onBlur={() => {
          if (!inputValue.trim()) {
            onCloseInput();
          }
        }}
        className="col-start-1 row-start-1 h-full w-full min-w-0 bg-transparent p-0 text-center text-[12px] font-semibold text-[var(--tb-color-text-primary)] caret-[var(--tb-color-text-primary)] outline-none"
        enterKeyHint="done"
        aria-label={`${category.label} 직접 입력`}
      />
    </form>
  ) : (
    <button
      type="button"
      onClick={onOpenInput}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
      aria-label={`${category.label} 직접 입력`}
    >
      <Plus size={ICON_TOKENS.size.md} strokeWidth={1.8} />
    </button>
  );

  useEffect(() => {
    if (isInputOpen) {
      customInputRef.current?.focus();
    }
  }, [isInputOpen]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
          {category.label}
        </h2>
        <span className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
          선택사항
        </span>
      </div>

      <div className="relative -mx-5">
        <div className="max-w-full overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max flex-col gap-2">
            <div className="flex items-center gap-2">
              {customInputControl}
              {tagRows[0].map(renderTagButton)}
            </div>
            <div className="flex items-center gap-2">
              {tagRows[1].map(renderTagButton)}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[var(--tb-color-bg-focus)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[var(--tb-color-bg-focus)] to-transparent" />
      </div>

    </section>
  );
}

function DiningResultReactionBubble({ experience }: { experience: TasteExperienceWord }) {
  const axisLabel = TASTE_AXIS_LABEL_BY_ID[experience.axis];

  return (
      <TasteChip
        className="max-w-full px-3 py-1.5 text-[10px] font-semibold leading-none"
        colorTaste={axisLabel}
        taste={experience.label}
        title={axisLabel}
      />
  );
}

const DINING_RESULT_TAG_GAP = 6;

function DiningResultDetailTagMoreChip({ count }: { count: number }) {
  return (
    <TasteChip
      className="shrink-0"
      taste={`+${count}`}
      title={`${count}개 태그 더 있음`}
      tone="neutral"
    />
  );
}

function DiningResultDetailTagRow({
  detailTags,
}: {
  detailTags: readonly DiningDetailTagMetadata[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const counterMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(detailTags.length);
  const detailTagSignature = detailTags.map((tag) => `${tag.id}:${tag.label}`).join('|');

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const measureElement = measureRef.current;

    if (!containerElement || !measureElement) {
      return;
    }

    let animationFrameId = 0;

    const updateVisibleCount = () => {
      const availableWidth = containerElement.clientWidth;
      const tagElements = Array.from(
        measureElement.querySelectorAll<HTMLElement>('[data-result-detail-tag="true"]'),
      );

      if (availableWidth <= 0 || tagElements.length === 0) {
        setVisibleCount(detailTags.length);
        return;
      }

      const tagWidths = tagElements.map((tagElement) => tagElement.offsetWidth);
      const moreChipWidth = counterMeasureRef.current?.offsetWidth ?? 0;
      let nextVisibleCount = 0;

      for (let count = tagWidths.length; count >= 0; count -= 1) {
        const hiddenCount = tagWidths.length - count;
        const visibleElementCount = count + (hiddenCount > 0 ? 1 : 0);
        const gapWidth = Math.max(0, visibleElementCount - 1) * DINING_RESULT_TAG_GAP;
        const tagsWidth = tagWidths
          .slice(0, count)
          .reduce((totalWidth, tagWidth) => totalWidth + tagWidth, 0);
        const requiredWidth = tagsWidth + (hiddenCount > 0 ? moreChipWidth : 0) + gapWidth;

        if (requiredWidth <= availableWidth) {
          nextVisibleCount = count;
          break;
        }
      }

      setVisibleCount((currentVisibleCount) =>
        currentVisibleCount === nextVisibleCount ? currentVisibleCount : nextVisibleCount,
      );
    };

    const requestUpdate = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateVisibleCount);
    };

    requestUpdate();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', requestUpdate);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', requestUpdate);
      };
    }

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(containerElement);
    resizeObserver.observe(measureElement);
    window.addEventListener('resize', requestUpdate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', requestUpdate);
    };
  }, [detailTags.length, detailTagSignature]);

  const resolvedVisibleCount = Math.min(visibleCount, detailTags.length);
  const hiddenCount = Math.max(0, detailTags.length - resolvedVisibleCount);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex w-full flex-nowrap items-center gap-[6px] overflow-hidden">
        {detailTags.slice(0, resolvedVisibleCount).map((tag) => (
          <TasteChip
            className="shrink-0"
            key={tag.id}
            taste={tag.label}
            tone="neutral"
            title={tag.categoryLabel}
          />
        ))}
        {hiddenCount > 0 ? <DiningResultDetailTagMoreChip count={hiddenCount} /> : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max flex-nowrap items-center gap-[6px]"
        ref={measureRef}
      >
        {detailTags.map((tag) => (
          <TasteChip
            className="shrink-0"
            data-result-detail-tag="true"
            key={tag.id}
            taste={tag.label}
            tone="neutral"
            title={tag.categoryLabel}
          />
        ))}
        <span ref={counterMeasureRef}>
          <DiningResultDetailTagMoreChip count={detailTags.length} />
        </span>
      </div>
    </div>
  );
}

function DiningDishResultCard({
  activeChoice,
  dish,
  experiences,
  photoPreviewUrl,
  scenario,
  selectedDetailTagIds,
}: {
  activeChoice: DiningFeedbackChoice;
  dish: DiningDishMetadata;
  experiences: readonly TasteExperienceWord[];
  photoPreviewUrl?: string | null;
  scenario: DiningFeedbackScenario;
  selectedDetailTagIds: readonly string[];
}) {
  const detailTags = selectedDetailTagIds
    .map((tagId) => getDiningDetailTagMetadata(tagId))
    .filter((tag): tag is DiningDetailTagMetadata => Boolean(tag));
  const mainExperience = experiences[0] ?? null;
  const synthesisSummary =
    mainExperience
      ? `${mainExperience.label} 인상을 중심으로 보면, ${activeChoice.reason} 이 기록은 다음 다이닝에서 ${dish.title}처럼 기억에 남는 코스를 더 섬세하게 맞추는 단서가 됩니다.`
      : `${activeChoice.reason} 이 기록은 다음 다이닝에서 ${dish.title}의 인상을 다시 읽는 기준이 됩니다.`;

  return (
    <SectionCard hoverEffect={false} className="w-full gap-[10px] border-0 bg-[var(--tb-color-surface-base)] shadow-[0_24px_70px_rgba(15,15,15,0.16)]">
      <div className="flex w-full flex-col gap-[10px]">
        <ImageBox
          alt={`${dish.title} 메뉴 사진`}
          className="aspect-[4/5] w-full rounded-[var(--tb-radius-12)]"
          fallbackIconSize={ICON_TOKENS.size.xl}
          imageSrc={photoPreviewUrl}
          kind="menu"
        />
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
            {dish.title}
          </h2>
          <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            {dish.courseLabel} · {scenario.restaurant}
          </p>
        </div>
      </div>

      {experiences.length > 0 || detailTags.length > 0 ? (
        <div className="flex w-full flex-col gap-[6px]">
          {experiences.length > 0 ? (
            <div className="flex w-full flex-wrap items-start gap-[6px]">
              {experiences.slice(0, 3).map((experience) => (
                <DiningResultReactionBubble
                  experience={experience}
                  key={`${dish.id}-${experience.id}`}
                />
              ))}
            </div>
          ) : null}

          {detailTags.length > 0 ? (
            <DiningResultDetailTagRow detailTags={detailTags} />
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[122px] w-full overflow-hidden rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-[10px]">
        <div className="flex items-center gap-2">
          <Sparkles size={ICON_TOKENS.size.sm} strokeWidth={1.8} />
          <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
            미식 노트
          </span>
        </div>
        <p className="mt-[6px] overflow-hidden text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
          {synthesisSummary}
        </p>
      </div>
    </SectionCard>
  );
}

function softenRecommendationCopy(recommendation: string) {
  return recommendation
    .replace(/해보세요\./g, '하는 방향이 더 잘 맞을 수 있어요.')
    .replace(/좋습니다\./g, '좋을 수 있어요.')
    .replace(/편이 좋습니다\./g, '편이 더 잘 맞을 수 있어요.')
    .replace(/편이 좋습니다/g, '편이 더 잘 맞을 수 있어요');
}

interface DiningFeedbackScreenProps {
  draft: DiningFeedbackDraft;
  isSubmitting?: boolean;
  onBack: () => void;
  onChange: (nextDraft: DiningFeedbackDraft) => void;
  onMapViewChange?: (isMapView: boolean) => void;
  onSubmit: (draft?: DiningFeedbackDraft) => Promise<void> | void;
  scenario: DiningFeedbackScenario;
  submitErrorMessage?: string | null;
}

export function DiningFeedbackScreen({
  draft,
  isSubmitting = false,
  onBack,
  onChange,
  onMapViewChange,
  onSubmit,
  scenario,
  submitErrorMessage,
}: DiningFeedbackScreenProps) {
  const [feedbackStep, setFeedbackStep] = useState<DiningFeedbackStep>('menu-select');
  const [selectedDishIndex, setSelectedDishIndex] = useState<number | null>(null);
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const [isTasteSearchOpen, setIsTasteSearchOpen] = useState(false);
  const [searchedExperienceId, setSearchedExperienceId] = useState<string | null>(null);
  const [activeCustomDetailCategoryId, setActiveCustomDetailCategoryId] = useState<string | null>(null);
  const [customDetailInputValue, setCustomDetailInputValue] = useState('');
  const [isCustomDishInputOpen, setIsCustomDishInputOpen] = useState(false);
  const [customDishInputValue, setCustomDishInputValue] = useState('');
  const [editingCustomDishId, setEditingCustomDishId] = useState<string | null>(null);
  const [editingCustomDishInputValue, setEditingCustomDishInputValue] = useState('');
  const [isDishKindInputOpen, setIsDishKindInputOpen] = useState(false);
  const [dishKindInputValue, setDishKindInputValue] = useState('');
  const [activeDetailExperienceIndex, setActiveDetailExperienceIndex] = useState(0);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraFlashOn, setIsCameraFlashOn] = useState(false);
  const [isResultChromeVisible, setIsResultChromeVisible] = useState(false);
  const reflectionPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const reflectionGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const customDishInputRef = useRef<HTMLInputElement | null>(null);
  const editingCustomDishInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const latestDraftRef = useRef(draft);
  const feedbackDishes = [...scenario.dishes, ...(draft.customDishes ?? [])];
  const activeDish = feedbackDishes[activeDishIndex] ?? feedbackDishes[0] ?? EMPTY_ACTIVE_DISH;
  const activeResponse = draft.dishResponses[activeDish.id] ?? createDiningDishFeedbackDraft(activeDish);
  const activeChoice = getSelectedChoice(activeDish, draft);
  const activeExperienceIds = getSelectedExperienceIds(activeResponse);
  const activeExperiences = getSelectedTasteExperiences(activeResponse);
  const activeExperience = activeExperiences[0] ?? null;
  const activeDetailExperience =
    activeExperiences[Math.min(activeDetailExperienceIndex, Math.max(0, activeExperiences.length - 1))] ??
    activeExperience;
  const selectedDetailTagIds = activeResponse.selectedDetailTagIds ?? [];
  const customDetailTags = activeResponse.customDetailTags ?? {};
  const activeDishKindIds = getSelectedDishKindIds(activeDish, activeResponse);
  const recommendedDetailTagIds = getRecommendedDetailTagIds({
    dishKindIds: activeDishKindIds,
    experiences: activeExperiences,
  });
  const reflectionNote = activeResponse.reflectionNote ?? '';
  const reflectionPhotoName = activeResponse.reflectionPhotoName ?? null;
  const reflectionPhotoPreviewUrl =
    resolvePublicMediaPath(activeResponse.reflectionPhotoPreviewUrl) ?? null;
  const completedDishCount = feedbackDishes.filter(
    (dish) => getSelectedExperienceIds(draft.dishResponses[dish.id]).length > 0,
  ).length;
  const selectedDish = selectedDishIndex === null ? null : feedbackDishes[selectedDishIndex] ?? null;
  const selectedDishResponse = selectedDish
    ? draft.dishResponses[selectedDish.id] ?? createDiningDishFeedbackDraft(selectedDish)
    : null;
  const selectedDishRecommendedKindIds = selectedDish ? getRecommendedDishKindIds(selectedDish) : [];
  const selectedDishKindIds = selectedDish && selectedDishResponse
    ? getSelectedDishKindIds(selectedDish, selectedDishResponse)
    : [];
  const selectedDishCustomKindLabels = selectedDishResponse?.customDishKindLabels ?? [];
  const customDishIdSet = new Set((draft.customDishes ?? []).map((dish) => dish.id));
  const submitStatusHelperText = isSubmitting
    ? '피드백을 저장하고 있어요. 잠시만 기다려주세요.'
    : submitErrorMessage ?? null;

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  const commitDraftChange = (nextDraft: DiningFeedbackDraft) => {
    latestDraftRef.current = nextDraft;
    onChange(nextDraft);
  };

  useEffect(() => {
    onMapViewChange?.(true);

    return () => {
      onMapViewChange?.(false);
    };
  }, [onMapViewChange]);

  useEffect(() => {
    if (isCustomDishInputOpen) {
      customDishInputRef.current?.focus();
    }
  }, [isCustomDishInputOpen]);

  useEffect(() => {
    if (editingCustomDishId) {
      editingCustomDishInputRef.current?.focus();
    }
  }, [editingCustomDishId]);

  useEffect(() => {
    if (feedbackStep !== 'camera-capture') {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraFlashOn(false);

      return;
    }

    let isCancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraErrorMessage('이 기기에서는 카메라를 바로 열 수 없어요. 사진첩에서 선택해주세요.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: cameraFacingMode } },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        setCameraErrorMessage(null);

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          await cameraVideoRef.current.play().catch(() => undefined);
        }
      } catch {
        setCameraErrorMessage('카메라 권한이 없어 사진첩에서만 선택할 수 있어요.');
      }
    };

    void startCamera();

    return () => {
      isCancelled = true;
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [cameraFacingMode, feedbackStep]);

  const selectTasteExperience = (experience: TasteExperienceWord) => {
    const currentExperienceIds = getSelectedExperienceIds(activeResponse);
    const nextExperienceIds = currentExperienceIds.includes(experience.id)
      ? currentExperienceIds.filter((experienceId) => experienceId !== experience.id)
      : [...currentExperienceIds, experience.id].slice(0, 3);
    const mainExperience = findTasteExperience(nextExperienceIds[0]);
    const closestChoice = mainExperience ? findClosestDishChoice(activeDish, mainExperience) : null;
    const nextRating = mainExperience ? getExperienceMappedRating(mainExperience) : 3;
    const nextDishResponses = {
      ...draft.dishResponses,
      [activeDish.id]: {
        ...activeResponse,
        rating: nextRating,
        selectedChoiceId: closestChoice?.id ?? (nextExperienceIds.length > 0 ? activeResponse.selectedChoiceId : null),
        selectedExperienceId: nextExperienceIds[0] ?? null,
        selectedExperienceIds: nextExperienceIds,
      },
    };
    const ratingValues = Object.values(nextDishResponses).map((response) => response.rating);
    const averageRating =
      ratingValues.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratingValues.length);

    commitDraftChange({
      ...draft,
      dishResponses: nextDishResponses,
      overallRating: Math.round(averageRating),
      returnIntent: averageRating >= 4 ? 'yes' : averageRating <= 2.5 ? 'no' : 'maybe',
    });

    return nextExperienceIds;
  };

  const updateDishResponse = (
    dish: DiningDishMetadata,
    nextResponse: Partial<typeof activeResponse>,
  ) => {
    const currentResponse = draft.dishResponses[dish.id] ?? createDiningDishFeedbackDraft(dish);

    commitDraftChange({
      ...draft,
      dishResponses: {
        ...draft.dishResponses,
        [dish.id]: {
          ...currentResponse,
          ...nextResponse,
        },
      },
    });
  };

  const updateActiveDishResponse = (nextResponse: Partial<typeof activeResponse>) => {
    updateDishResponse(activeDish, nextResponse);
  };

  const addCustomDish = () => {
    const title = customDishInputValue.trim();

    if (!title) {
      return;
    }

    const customDish = createCustomDiningDishMetadata(title);
    const nextCustomDishes = [...(draft.customDishes ?? []), customDish];
    const nextIndex = scenario.dishes.length + nextCustomDishes.length - 1;

    commitDraftChange({
      ...draft,
      customDishes: nextCustomDishes,
      dishResponses: {
        ...draft.dishResponses,
        [customDish.id]: createDiningDishFeedbackDraft(customDish),
      },
    });
    setSelectedDishIndex(nextIndex);
    setCustomDishInputValue('');
    setIsCustomDishInputOpen(false);
    setEditingCustomDishId(null);
    setEditingCustomDishInputValue('');
  };

  const openCustomDishEdit = (dish: DiningDishMetadata) => {
    setIsCustomDishInputOpen(false);
    setCustomDishInputValue('');
    setEditingCustomDishId(dish.id);
    setEditingCustomDishInputValue(dish.title);
  };

  const cancelCustomDishEdit = () => {
    setEditingCustomDishId(null);
    setEditingCustomDishInputValue('');
  };

  const saveCustomDishEdit = (dishId: string) => {
    const nextTitle = editingCustomDishInputValue.trim();

    if (!nextTitle) {
      return;
    }

    const currentCustomDishes = draft.customDishes ?? [];
    let didUpdate = false;
    const nextCustomDishes = currentCustomDishes.map((dish) => {
      if (dish.id !== dishId) {
        return dish;
      }

      didUpdate = true;
      return {
        ...dish,
        title: nextTitle,
      };
    });

    if (!didUpdate) {
      return;
    }

    commitDraftChange({
      ...draft,
      customDishes: nextCustomDishes,
    });
    setEditingCustomDishId(null);
    setEditingCustomDishInputValue('');
  };

  const removeCustomDish = (dishId: string) => {
    const currentCustomDishes = draft.customDishes ?? [];
    const nextCustomDishes = currentCustomDishes.filter((dish) => dish.id !== dishId);

    if (nextCustomDishes.length === currentCustomDishes.length) {
      return;
    }

    const removedDishIndex = feedbackDishes.findIndex((dish) => dish.id === dishId);
    const { [dishId]: _removedResponse, ...nextDishResponses } = draft.dishResponses;

    commitDraftChange({
      ...draft,
      customDishes: nextCustomDishes,
      dishResponses: nextDishResponses,
    });
    setSelectedDishIndex((currentIndex) => {
      if (currentIndex === null || removedDishIndex === -1 || currentIndex < removedDishIndex) {
        return currentIndex;
      }

      return currentIndex === removedDishIndex ? null : currentIndex - 1;
    });
    setActiveDishIndex((currentIndex) => {
      if (removedDishIndex === -1 || currentIndex < removedDishIndex) {
        return currentIndex;
      }

      if (currentIndex === removedDishIndex) {
        return Math.max(0, Math.min(currentIndex, feedbackDishes.length - 2));
      }

      return currentIndex - 1;
    });
    setIsDishKindInputOpen(false);
    setDishKindInputValue('');
    if (editingCustomDishId === dishId) {
      setEditingCustomDishId(null);
      setEditingCustomDishInputValue('');
    }
  };

  const toggleSelectedDishKind = (kindId: string) => {
    if (!selectedDish) {
      return;
    }

    const currentKindIds = getSelectedDishKindIds(selectedDish, selectedDishResponse ?? undefined);
    const nextKindIds = currentKindIds.includes(kindId)
      ? currentKindIds.filter((selectedKindId) => selectedKindId !== kindId)
      : [...currentKindIds, kindId].slice(0, 6);

    updateDishResponse(selectedDish, {
      selectedDishKindIds: nextKindIds,
      customDishKindLabels: [
        ...(selectedDishResponse?.customDishKindLabels ?? []),
        ...getCustomDishKindLabelsFromIds(nextKindIds).filter(
          (label) => !(selectedDishResponse?.customDishKindLabels ?? []).includes(label),
        ),
      ],
    });
  };

  const addSelectedDishCustomKind = () => {
    if (!selectedDish) {
      return;
    }

    const label = dishKindInputValue.trim();

    if (!label) {
      return;
    }

    const customKindId = getCustomDishKindId(label);
    const currentCustomLabels = selectedDishResponse?.customDishKindLabels ?? [];
    const currentKindIds = getSelectedDishKindIds(selectedDish, selectedDishResponse ?? undefined);

    updateDishResponse(selectedDish, {
      customDishKindLabels: currentCustomLabels.includes(label)
        ? currentCustomLabels
        : [...currentCustomLabels, label],
      selectedDishKindIds: currentKindIds.includes(customKindId)
        ? currentKindIds
        : [...currentKindIds, customKindId].slice(0, 6),
    });
    setDishKindInputValue('');
    setIsDishKindInputOpen(false);
  };

  const toggleDetailTag = (tagId: string) => {
    const nextSelectedTagIds = selectedDetailTagIds.includes(tagId)
      ? selectedDetailTagIds.filter((selectedTagId) => selectedTagId !== tagId)
      : [...selectedDetailTagIds, tagId];

    updateActiveDishResponse({ selectedDetailTagIds: nextSelectedTagIds });
  };

  const openCustomDetailInput = (categoryId: string) => {
    setActiveCustomDetailCategoryId(categoryId);
    setCustomDetailInputValue('');
  };

  const closeCustomDetailInput = () => {
    setActiveCustomDetailCategoryId(null);
    setCustomDetailInputValue('');
  };

  const addCustomDetailTag = (categoryId: string) => {
    const label = customDetailInputValue.trim();

    if (!label) {
      return;
    }

    const currentCategoryTags = customDetailTags[categoryId] ?? [];
    const nextCategoryTags = currentCategoryTags.includes(label)
      ? currentCategoryTags
      : [...currentCategoryTags, label];
    const customTagId = getCustomDetailTagId(categoryId, label);

    updateActiveDishResponse({
      customDetailTags: {
        ...customDetailTags,
        [categoryId]: nextCategoryTags,
      },
      selectedDetailTagIds: selectedDetailTagIds.includes(customTagId)
        ? selectedDetailTagIds
        : [...selectedDetailTagIds, customTagId],
    });
    setCustomDetailInputValue('');
    setActiveCustomDetailCategoryId(null);
  };

  const openTasteReflection = () => {
    setFeedbackStep('taste-reflection');
  };

  const openCameraCapture = () => {
    setCameraErrorMessage(null);
    setFeedbackStep('camera-capture');
  };

  const closeCameraCapture = () => {
    setCameraErrorMessage(null);
    setFeedbackStep('detail-tags');
  };

  const switchCameraFacingMode = () => {
    setCameraErrorMessage(null);
    setIsCameraFlashOn(false);
    setCameraFacingMode((currentFacingMode) => (currentFacingMode === 'environment' ? 'user' : 'environment'));
  };

  const toggleCameraFlash = async () => {
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;

    if (!track || !capabilities?.torch) {
      setIsCameraFlashOn(false);
      setCameraErrorMessage('이 기기에서는 플래시를 바로 켤 수 없어요.');
      return;
    }

    const nextFlashState = !isCameraFlashOn;

    try {
      await track.applyConstraints({
        advanced: [{ torch: nextFlashState } as MediaTrackConstraintSet],
      });
      setIsCameraFlashOn(nextFlashState);
      setCameraErrorMessage(null);
    } catch {
      setIsCameraFlashOn(false);
      setCameraErrorMessage('플래시를 켜지 못했어요.');
    }
  };

  const openReflectionGallery = () => {
    reflectionGalleryInputRef.current?.click();
  };

  const applyReflectionPhotoFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      updateActiveDishResponse({
        reflectionPhotoName: file.name,
        reflectionPhotoPreviewUrl: typeof reader.result === 'string' ? reader.result : null,
      });
      setFeedbackStep('taste-reflection');
    };
    reader.readAsDataURL(file);
  };

  const handleReflectionPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    applyReflectionPhotoFile(file);
    event.target.value = '';
  };

  const captureCameraPhoto = () => {
    const video = cameraVideoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraErrorMessage('카메라 화면을 불러온 뒤 다시 촬영해주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraErrorMessage('사진을 저장하지 못했어요. 다시 시도해주세요.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    updateActiveDishResponse({
      reflectionPhotoName: `taste-reflection-${Date.now()}.jpg`,
      reflectionPhotoPreviewUrl: canvas.toDataURL('image/jpeg', 0.92),
    });
    setFeedbackStep('taste-reflection');
  };

  const completeDetailTags = () => {
    setActiveCustomDetailCategoryId(null);
    setCustomDetailInputValue('');
    setIsResultChromeVisible(false);
    setFeedbackStep('result-card');
  };

  const handleResultAdditionalRecord = () => {
    setSelectedDishIndex(null);
    setSearchedExperienceId(null);
    setIsResultChromeVisible(false);
    setFeedbackStep('menu-select');
  };

  const handleResultBack = () => {
    setIsResultChromeVisible(false);
    setFeedbackStep('detail-tags');
  };

  const handleResultShare = async () => {
    const shareText = `${scenario.restaurant} ${activeDish.title}의 미각 기록`;

    if (navigator.share) {
      await navigator.share({
        text: shareText,
        title: 'Taste Buddy 다이닝 기록',
      }).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(shareText).catch(() => undefined);
  };

  const moveToTasteCheckin = () => {
    if (selectedDishIndex === null) {
      return;
    }

    const dish = feedbackDishes[selectedDishIndex];

    if (!dish) {
      return;
    }

    const response = draft.dishResponses[dish.id] ?? createDiningDishFeedbackDraft(dish);
    const selectedKindIds = getSelectedDishKindIds(dish, response);

    if ((response.selectedDishKindIds ?? []).length === 0 && selectedKindIds.length > 0) {
      updateDishResponse(dish, { selectedDishKindIds: selectedKindIds });
    }

    setActiveDishIndex(selectedDishIndex);
    setSearchedExperienceId(null);
    setIsCustomDishInputOpen(false);
    setIsDishKindInputOpen(false);
    setFeedbackStep('taste-checkin');
  };

  const handleTopBack = () => {
    if (isSubmitting) {
      return;
    }

    if (feedbackStep === 'taste-checkin') {
      if (isTasteSearchOpen) {
        setIsTasteSearchOpen(false);
        return;
      }

      setSearchedExperienceId(null);
      setFeedbackStep('menu-select');
      return;
    }

    if (feedbackStep === 'detail-tags') {
      setFeedbackStep('taste-checkin');
      return;
    }

    if (feedbackStep === 'result-card') {
      setSelectedDishIndex(null);
      setFeedbackStep('menu-select');
      return;
    }

    if (feedbackStep === 'taste-reflection') {
      setFeedbackStep('detail-tags');
      return;
    }

    if (feedbackStep === 'camera-capture') {
      setFeedbackStep('detail-tags');
      return;
    }

    onBack();
  };

  if (feedbackStep === 'taste-checkin') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[var(--tb-color-bg-focus)] animate-slideIn">
        <div className="absolute inset-x-0 top-0 z-40">
          <TopAppBar
            appearance="transparent"
            title={activeDish.title}
            showBack
            onBack={handleTopBack}
            rightActions={
              <button
                type="button"
                onClick={() => setIsTasteSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                aria-label="미각 단어 검색"
                title="미각 단어 검색"
              >
                <Search size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </button>
            }
          />
        </div>

        <TasteExperienceMap
          focusExperienceId={searchedExperienceId}
          selectedExperienceIds={activeExperienceIds}
          onToggleSelection={(experience) => {
            selectTasteExperience(experience);
            setSearchedExperienceId(null);
          }}
          onConfirm={(experience) => {
            if (activeExperienceIds.length >= 3) {
              setSearchedExperienceId(null);
              setActiveCustomDetailCategoryId(null);
              setActiveDetailExperienceIndex(0);
              setFeedbackStep('detail-tags');
              return;
            }

            const nextExperienceIds = selectTasteExperience(experience);
            setSearchedExperienceId(null);
          }}
        />
        <TasteWordSearch
          axes={tasteExperienceAxes}
          isOpen={isTasteSearchOpen}
          onClose={() => setIsTasteSearchOpen(false)}
          onSelect={(experience) => {
            setSearchedExperienceId(experience.id);
            setIsTasteSearchOpen(false);
          }}
          words={tasteExperienceWords}
        />
      </div>
    );
  }

  if (feedbackStep === 'result-card') {
    const resultAxis = activeExperience?.axis ?? 'umami';
    const resultSecondaryAxis = activeExperiences[1]?.axis ?? resultAxis;
    const resultTertiaryAxis = activeExperiences[2]?.axis ?? resultSecondaryAxis;
    const resultBackgroundStyle = {
      '--tb-dining-result-mesh-main': `color-mix(in srgb, var(--tb-taste-${resultAxis}-main) 70%, white)`,
      '--tb-dining-result-mesh-secondary': `color-mix(in srgb, var(--tb-taste-${resultSecondaryAxis}-main) 70%, white)`,
      '--tb-dining-result-mesh-tertiary': `color-mix(in srgb, var(--tb-taste-${resultTertiaryAxis}-main) 70%, white)`,
      backgroundColor: `var(--tb-taste-${resultAxis}-tint-surface)`,
    } as CSSProperties;

    return (
      <div
        className="relative isolate flex h-full w-full items-center justify-center overflow-hidden px-5 py-10 animate-slideIn"
        onClick={() => setIsResultChromeVisible(true)}
        onTouchStart={() => setIsResultChromeVisible(true)}
        style={resultBackgroundStyle}
      >
        <div className="pointer-events-none absolute inset-[-18%] dining-result-mesh" aria-hidden="true" />
        <div
          className={cn(
            'pointer-events-auto absolute inset-x-0 top-0 z-30 transition-all duration-300 ease-out',
            isResultChromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0',
          )}
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <TopAppBar
            appearance="transparent"
            showBack
            onBack={handleResultBack}
            rightActions={
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleResultShare();
                }}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                aria-label="결과 카드 공유"
                title="공유"
              >
                <Share size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </button>
            }
          />
        </div>
        <div className="dining-result-card-bloom relative z-10 w-[min(360px,calc(100vw-100px))] max-w-full">
          <DiningDishResultCard
            activeChoice={activeChoice}
            dish={activeDish}
            experiences={activeExperiences}
            photoPreviewUrl={reflectionPhotoPreviewUrl}
            scenario={scenario}
            selectedDetailTagIds={selectedDetailTagIds}
          />
        </div>
        <FlowBottomCta
          actionDisabled={isSubmitting}
          actionLabel={isSubmitting ? '저장 중' : '저장'}
          className={cn(
            'transition-all duration-300 ease-out',
            isResultChromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none',
          )}
          fadeClassName="!bg-none"
          helperText={submitStatusHelperText}
          onAction={() => {
            void onSubmit(latestDraftRef.current);
          }}
          secondaryButtonDisabled={isSubmitting}
          secondaryButtonClassName="border border-white/80 bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] shadow-none"
          secondaryButtonLabel="추가 기록"
          onSecondaryButtonAction={handleResultAdditionalRecord}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col animate-slideIn',
        feedbackStep === 'camera-capture'
          ? 'bg-black'
          : feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection'
            ? 'bg-[var(--tb-color-bg-focus)]'
            : 'bg-[var(--tb-color-bg-page)]',
      )}
    >
      {feedbackStep !== 'camera-capture' ? (
        <TopAppBar
          appearance={feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection' ? 'solid' : undefined}
          solidBackground={feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection' ? 'focus' : 'page'}
          title={feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection' ? activeDish.title : '식후 피드백'}
          showBack
          onBack={handleTopBack}
          rightActions={<div className="h-10 w-10" aria-hidden="true" />}
        />
      ) : null}
      <div className={cn(feedbackStep === 'camera-capture' ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto no-scrollbar')}>
        <div
          className={cn(
            feedbackStep === 'camera-capture' ? 'h-full' : 'tb-section-stack px-5 pt-6 pb-[168px]',
          )}
        >
          {feedbackStep !== 'detail-tags' &&
            feedbackStep !== 'taste-reflection' &&
            feedbackStep !== 'camera-capture' ? (
            <div className="flex flex-col gap-3">
              <div>
                <h1
                  className={cn(
                    'font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]',
                    feedbackStep === 'menu-select' ? 'text-[16px]' : 'text-[18px]',
                  )}
                >
                  {feedbackStep === 'menu-select' ? (
                    '어떤 메뉴를 먼저 기록할까요?'
                  ) : (
                    <>
                      이 음식이 어떻게 남았는지
                      <br />
                      가장 가까운 말을 골라주세요
                    </>
                  )}
                </h1>
                <p
                  className={cn(
                    `mt-1 ${feedbackBodyClass}`,
                    feedbackStep === 'menu-select' ? 'text-[12px]' : 'text-[13px]',
                  )}
                >
                  {feedbackStep === 'menu-select'
                    ? '모든 코스를 한 번에 평가하지 않아도 괜찮아요. 가장 선명하게 기억나는 메뉴부터 선택하면, 그 메뉴의 미각 인상만 차분히 기록할 수 있어요.'
                    : '정답을 맞히는 평가가 아니라, 입안에 남은 인상을 이름 붙이는 체크인이에요. 중앙은 은은한 인상, 바깥으로 갈수록 강하게 남은 인상입니다.'}
                </p>
              </div>
              <p className="text-[12px] font-medium text-[var(--tb-color-text-faint)]">
                {scenario.courseName} · {scenario.restaurant}
              </p>
            </div>
          ) : null}

          {feedbackStep === 'menu-select' ? (
            <PageSection>
              <div className="flex flex-col gap-3">
                {feedbackDishes.map((dish, index) => {
                  const isSelected = selectedDishIndex === index;
                  const recordedExperiences = getSelectedTasteExperiences(draft.dishResponses[dish.id]);
                  const recordedExperience = recordedExperiences[0] ?? null;
                  const isCustomDish = customDishIdSet.has(dish.id);
                  const selectDish = () => {
                    setIsCustomDishInputOpen(false);
                    setCustomDishInputValue('');
                    setEditingCustomDishId(null);
                    setEditingCustomDishInputValue('');
                    setSelectedDishIndex((currentIndex) => (
                      currentIndex === index ? null : index
                    ));
                  };
                  const trailingContent = recordedExperience ? (
                    <span className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
                        {recordedExperiences.length > 1
                          ? `${recordedExperience.label} 외 ${recordedExperiences.length - 1}개 기록됨`
                          : `${recordedExperience.label} 기록됨`}
                      </span>
                    </span>
                  ) : null;

                  if (isCustomDish) {
                    return (
                      <CustomDishSelectionCard
                        key={dish.id}
                        description={dish.subtitle}
                        editInputRef={editingCustomDishInputRef}
                        editValue={editingCustomDishInputValue}
                        isEditing={editingCustomDishId === dish.id}
                        onCancelEdit={cancelCustomDishEdit}
                        onChangeEditValue={setEditingCustomDishInputValue}
                        onEdit={() => openCustomDishEdit(dish)}
                        onRemove={() => removeCustomDish(dish.id)}
                        onSaveEdit={() => saveCustomDishEdit(dish.id)}
                        onSelect={selectDish}
                        selected={isSelected}
                        title={dish.title}
                        trailing={trailingContent}
                      />
                    );
                  }

                  return (
                    <SelectionCard
                      key={dish.id}
                      description={dish.subtitle}
                      indicator="radio"
                      onClick={selectDish}
                      selected={isSelected}
                      title={dish.title}
                      trailing={trailingContent}
                    />
                  );
                })}
                <SelectionCard
                  description="코스 목록에 없는 메뉴도 미각 기록으로 남길 수 있어요."
                  indicator="radio"
                  onClick={() => {
                    setSelectedDishIndex(null);
                    setEditingCustomDishId(null);
                    setEditingCustomDishInputValue('');
                    setIsCustomDishInputOpen((currentValue) => !currentValue);
                  }}
                  selected={isCustomDishInputOpen}
                  title="직접 입력"
                />
                {isCustomDishInputOpen ? (
                  <form
                    className="rounded-[var(--tb-radius-20)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addCustomDish();
                    }}
                  >
                    <label className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]" htmlFor="custom-dish-input">
                      메뉴 직접 입력
                    </label>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        id="custom-dish-input"
                        ref={customDishInputRef}
                        value={customDishInputValue}
                        onChange={(event) => setCustomDishInputValue(event.target.value)}
                        className="h-11 min-w-0 flex-1 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] px-3 text-[13px] font-semibold text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                        placeholder="예: 오미자와 배 디저트"
                        enterKeyHint="done"
                      />
                      <button
                        type="submit"
                        className="h-11 shrink-0 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] px-4 text-[12px] font-semibold text-[var(--tb-color-text-inverse)]"
                      >
                        추가
                      </button>
                    </div>
                  </form>
                ) : null}
                {selectedDish ? (
                  <DishKindTagSelector
                    customLabels={selectedDishCustomKindLabels}
                    inputValue={dishKindInputValue}
                    isInputOpen={isDishKindInputOpen}
                    onAddCustomKind={addSelectedDishCustomKind}
                    onChangeInputValue={setDishKindInputValue}
                    onCloseInput={() => {
                      setIsDishKindInputOpen(false);
                      setDishKindInputValue('');
                    }}
                    onOpenInput={() => {
                      setIsDishKindInputOpen(true);
                      setDishKindInputValue('');
                    }}
                    onToggleKind={toggleSelectedDishKind}
                    recommendedKindIds={selectedDishRecommendedKindIds}
                    selectedKindIds={selectedDishKindIds}
                  />
                ) : null}
              </div>
            </PageSection>
          ) : feedbackStep === 'detail-tags' ? (
            <>
              <PageSection>
                <div className="flex flex-col items-center gap-4 py-2">
                  {activeDetailExperience ? (
                    <div
                      className="flex h-[176px] w-[176px] flex-col items-center justify-center rounded-full border px-5 text-center"
                      style={{
                        backgroundColor: `var(--tb-taste-${activeDetailExperience.axis}-tint-surface)`,
                        borderColor: `var(--tb-taste-${activeDetailExperience.axis}-tint-soft-border)`,
                        color: `var(--tb-taste-${activeDetailExperience.axis}-tint-surface-text)`,
                      }}
                    >
                      <span className="text-[11px] font-semibold opacity-70">
                        {activeDetailExperienceIndex === 0 ? '메인 미각' : '보조 미각'}
                      </span>
                      <span className="mt-2 text-[17px] font-bold leading-tight">
                        {activeDetailExperience.label}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-center gap-3">
                    {activeExperiences.map((experience, index) => {
                      const isActive = index === activeDetailExperienceIndex;

                      return (
                        <button
                          key={experience.id}
                          type="button"
                          onClick={() => setActiveDetailExperienceIndex(index)}
                          className={cn(
                            'h-6 w-6 rounded-full border transition-transform active:scale-95',
                            isActive ? 'scale-110' : 'opacity-70',
                          )}
                          style={{
                            backgroundColor: isActive
                              ? `var(--tb-taste-${experience.axis}-tint-surface)`
                              : `var(--tb-taste-${experience.axis}-tint-soft)`,
                            borderColor: `var(--tb-taste-${experience.axis}-tint-soft-border)`,
                          }}
                          aria-label={`${index === 0 ? '메인' : '보조'} 미각 ${experience.label} 보기`}
                        />
                      );
                    })}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openTasteReflection}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openTasteReflection();
                      }
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3 transition-colors hover:border-[var(--tb-color-border-default)]"
                    aria-label="미각 회고 페이지 열기"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--tb-color-text-primary)]">
                        짧은 미식 기록 추가
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTasteReflection();
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                        aria-label="짧은 미식 기록 작성"
                      >
                        <PenLine size={ICON_TOKENS.size.md} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openCameraCapture();
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                        aria-label="미식 기록 사진 추가"
                      >
                        <Camera size={ICON_TOKENS.size.md} strokeWidth={1.8} />
                      </button>
                    </div>
                    <input
                      ref={reflectionPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleReflectionPhotoChange}
                      aria-label="미식 기록 사진 업로드"
                    />
                  </div>
                </div>
              </PageSection>

              <PageSection>
                <div className="flex flex-col gap-7">
                  {diningDetailTagCategories.map((category) => (
                    <DiningDetailTagSection
                      key={category.id}
                      accentAxis={activeDetailExperience?.axis ?? 'umami'}
                      category={category}
                      customTags={customDetailTags[category.id] ?? []}
                      inputValue={activeCustomDetailCategoryId === category.id ? customDetailInputValue : ''}
                      isInputOpen={activeCustomDetailCategoryId === category.id}
                      onAddCustomTag={() => addCustomDetailTag(category.id)}
                      onCloseInput={closeCustomDetailInput}
                      onChangeInputValue={setCustomDetailInputValue}
                      onOpenInput={() => openCustomDetailInput(category.id)}
                      onToggleTag={toggleDetailTag}
                      recommendedTagIds={recommendedDetailTagIds}
                      selectedTagIds={selectedDetailTagIds}
                    />
                  ))}
                </div>
              </PageSection>
            </>
          ) : feedbackStep === 'taste-reflection' ? (
            <PageSection>
              <div className="flex w-full flex-col gap-5">
                <div className="text-left">
                  <h1
                    className="text-[18px] font-bold"
                    style={{
                      color: activeDetailExperience
                        ? `var(--tb-taste-${activeDetailExperience.axis}-main)`
                        : 'var(--tb-color-text-primary)',
                    }}
                  >
                    {activeDetailExperience?.label ?? '선택한 미각'}
                  </h1>
                  <p className="mt-1 text-[14px] font-semibold leading-relaxed text-[var(--tb-color-text-subtle)]">
                    왜 느꼈는지 알려주세요.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <textarea
                    value={reflectionNote}
                    onChange={(event) => updateActiveDishResponse({ reflectionNote: event.target.value })}
                    className="min-h-[156px] w-full resize-none rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                  />

                  {reflectionPhotoPreviewUrl ? (
                    <img
                      src={reflectionPhotoPreviewUrl}
                      alt={reflectionPhotoName ?? '미식 기록 사진'}
                      className="aspect-[4/3] w-full rounded-[20px] object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </PageSection>
          ) : feedbackStep === 'camera-capture' ? (
            <div className="relative h-full w-full overflow-hidden bg-black">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'h-full w-full object-cover',
                  cameraFacingMode === 'user' ? 'scale-x-[-1]' : undefined,
                )}
              />
              {cameraErrorMessage ? (
                <div className="absolute inset-x-5 top-[calc(env(safe-area-inset-top)+80px)] rounded-[20px] bg-black/55 px-4 py-3 text-center backdrop-blur-md">
                  <p className="text-[13px] leading-relaxed text-white">{cameraErrorMessage}</p>
                </div>
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/55 to-transparent" />
              <button
                type="button"
                onClick={closeCameraCapture}
                className="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors active:bg-black/55"
                aria-label="카메라 닫기"
              >
                <X size={ICON_TOKENS.size.lg} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={toggleCameraFlash}
                className={cn(
                  'absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(124,124,124,0.5)] text-white backdrop-blur-md transition-colors active:bg-[rgba(96,96,96,0.82)]',
                  isCameraFlashOn ? 'ring-1 ring-white/80' : undefined,
                )}
                aria-label={isCameraFlashOn ? '플래시 끄기' : '플래시 켜기'}
              >
                <Zap size={ICON_TOKENS.size.lg} strokeWidth={2} />
              </button>
              <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+24px)] flex items-center justify-between px-7">
                <button
                  type="button"
                  onClick={openReflectionGallery}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(124,124,124,0.5)] text-white backdrop-blur-md transition-colors active:bg-[rgba(96,96,96,0.82)]"
                  aria-label="사진첩에서 선택"
                >
                  <Image size={ICON_TOKENS.size.lg} strokeWidth={1.9} />
                </button>
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white bg-white/25 backdrop-blur-sm transition-transform active:scale-95"
                  aria-label="사진 촬영"
                >
                  <span className="h-[58px] w-[58px] rounded-full bg-white" />
                </button>
                <button
                  type="button"
                  onClick={switchCameraFacingMode}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(124,124,124,0.5)] text-white backdrop-blur-md transition-colors active:bg-[rgba(96,96,96,0.82)]"
                  aria-label="전면 후면 카메라 전환"
                >
                  <SwitchCamera size={ICON_TOKENS.size.lg} strokeWidth={1.9} />
                </button>
              </div>
              <input
                ref={reflectionGalleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReflectionPhotoChange}
                aria-label="사진첩에서 선택"
              />
            </div>
          ) : (
            <PageSection title="코스별 미각 체크인" titleSize="md">
              <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <span className={feedbackLabelClass}>
                      {activeDishIndex + 1} / {feedbackDishes.length} · {activeDish.courseLabel}
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                        {activeDish.title}
                      </h2>
                      <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                        {activeDish.subtitle}
                      </p>
                    </div>
                  </div>
                  <OutlineBadge>{completedDishCount}개 기록</OutlineBadge>
                </div>

                <TasteExperienceMap
                  selectedExperienceIds={activeExperienceIds}
                  onToggleSelection={selectTasteExperience}
                  onConfirm={selectTasteExperience}
                />

                <div className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-3">
                  <p className={feedbackHintClass}>선택한 미각 인상</p>
                  <p className="mt-2 text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                    {activeExperience?.label ?? activeChoice.label}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {activeExperience?.description ?? activeChoice.reason}
                  </p>
                  <div className="mt-3 border-t border-[var(--tb-color-border-subtle)] pt-3">
                    <p className={feedbackHintClass}>셰프용 번역</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {activeChoice.reason}
                    </p>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveDishIndex((index) => Math.max(0, index - 1))}
                    disabled={activeDishIndex === 0}
                    className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-2 text-[12px] font-semibold text-[var(--tb-color-text-subtle)] disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDishIndex((index) => Math.min(feedbackDishes.length - 1, index + 1))
                    }
                    disabled={activeDishIndex === feedbackDishes.length - 1}
                    className="rounded-full border border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] px-4 py-2 text-[12px] font-semibold text-[var(--tb-color-text-inverse)] disabled:opacity-40"
                  >
                    다음 코스
                  </button>
                </div>
              </SectionCard>
            </PageSection>
          )}

          {feedbackStep === 'taste-checkin' ? (
            <PageSection title="마지막 메모" titleSize="md">
              <SectionCard hoverEffect={false}>
                <div className="w-full">
                  <p className={feedbackSectionLabelClass}>다음 다이닝에 꼭 반영하고 싶은 한 가지</p>
                  <p className={`mt-1 ${feedbackHintClass}`}>선택사항이에요. 기억에 남은 흐름만 적어도 충분합니다.</p>
                  <textarea
                    value={draft.overallComment}
                    onChange={(event) =>
                      commitDraftChange({
                        ...draft,
                        overallComment: event.target.value,
                      })
                    }
                    className="mt-3 min-h-[92px] w-full resize-none rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-3 text-[13px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                    placeholder="예: 메인 이후에는 무게감이 조금 빨리 쌓였고, 디저트는 단맛보다 산뜻한 마무리가 더 편했어요."
                  />
                </div>

                <div className="w-full">
                  <p className={feedbackSectionLabelClass}>다음 예약 방향</p>
                  <div className="mt-3">
                    <QuickOptionGroup
                      value={draft.returnIntent}
                      onChange={(returnIntent) => commitDraftChange({ ...draft, returnIntent })}
                      options={returnIntentOptions.map((option) => ({
                        label: option.label,
                        value: option.id,
                      }))}
                    />
                  </div>
                </div>
              </SectionCard>
            </PageSection>
          ) : null}
        </div>
      </div>

      {feedbackStep !== 'camera-capture' ? (
        <FlowBottomCta
          actionDisabled={(feedbackStep === 'menu-select' && selectedDishIndex === null) || isSubmitting}
          actionLabel={
            isSubmitting
              ? '저장 중'
              : feedbackStep === 'menu-select'
              ? '선택한 메뉴 기록하기'
              : feedbackStep === 'taste-reflection'
                ? '계속하기'
                : feedbackStep === 'detail-tags'
                  ? '완료'
                  : '다음 다이닝에 반영하기'
          }
          helperText={
            submitStatusHelperText &&
              feedbackStep !== 'menu-select' &&
              feedbackStep !== 'detail-tags' &&
              feedbackStep !== 'taste-reflection'
              ? submitStatusHelperText
              : feedbackStep === 'menu-select'
              ? selectedDish
                ? `${selectedDish.courseLabel} · ${selectedDish.title}의 미각 인상을 기록합니다.`
                : feedbackDishes.length === 0
                  ? '직접 입력으로 기억난 메뉴를 먼저 추가해주세요.'
                  : '가장 기억에 남는 메뉴 하나를 먼저 선택해주세요.'
              : feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection'
                ? selectedDetailTagIds.length > 0
                  ? `${selectedDetailTagIds.length}개의 디테일 단서를 함께 저장합니다.`
                  : '태그를 고르지 않아도 미각 인상은 저장됩니다.'
                : '저장 후 바로 어떤 점이 다음 다이닝에 반영되는지 확인할 수 있어요.'
          }
          onAction={
            feedbackStep === 'menu-select'
              ? moveToTasteCheckin
              : feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection'
                ? completeDetailTags
                : () => {
                  void onSubmit(latestDraftRef.current);
                }
          }
          fadeClassName={
            feedbackStep === 'detail-tags'
              ? 'min-h-[calc(112px+var(--tb-safe-area-bottom))]'
              : undefined
          }
          secondaryButtonLabel={feedbackStep === 'taste-reflection' ? '취소하기' : undefined}
          secondaryButtonDisabled={isSubmitting}
          onSecondaryButtonAction={
            feedbackStep === 'taste-reflection' ? () => setFeedbackStep('detail-tags') : undefined
          }
        />
      ) : null}
    </div>
  );
}
