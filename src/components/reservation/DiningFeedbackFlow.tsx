import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight as ArrowRightIcon,
  Camera as CameraIcon,
  ChevronRight as ChevronRightIcon,
  CircleCheck as CircleCheckIcon,
  ChefHat as ChefHatIcon,
  MessageSquareText as MessageSquareTextIcon,
  PenLine as PenLineIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const ArrowRight = wrapIcon(ArrowRightIcon);
const Camera = wrapIcon(CameraIcon);
const ChevronRight = wrapIcon(ChevronRightIcon);
const CheckCircle2 = wrapIcon(CircleCheckIcon);
const ChefHat = wrapIcon(ChefHatIcon);
const MessageSquareText = wrapIcon(MessageSquareTextIcon);
const PenLine = wrapIcon(PenLineIcon);
const Plus = wrapIcon(PlusIcon);
const Search = wrapIcon(SearchIcon);
const Sparkles = wrapIcon(SparklesIcon);

import SectionCard from '../SectionCard';
import TopAppBar from '../TopAppBar';
import OutlineBadge from '../system/OutlineBadge';
import FlowBottomCta from '../system/FlowBottomCta';
import PageSection from '../system/PageSection';
import SelectionCard from '../system/SelectionCard';
import TokenBox from '../system/TokenBox';
import TasteChip from '../system/TasteChip';
import TasteWordSearch from '../search/TasteWordSearch';
import {
  type DiningDishMetadata,
  type DiningFeedbackChoice,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../../constants/diningFeedbackData';
import {
  getStrongestTasteMeasurement,
  getWeakestTasteMeasurement,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

const returnIntentOptions = [
  { id: 'yes', label: '이 방향으로 다시 경험하고 싶어요' },
  { id: 'maybe', label: '조금 더 맞추면 다시 좋아질 것 같아요' },
  { id: 'no', label: '다른 방향이 더 잘 맞을 것 같아요' },
] as const;

export type TasteAxisId = 'sweet' | 'sour' | 'salty' | 'bitter' | 'umami' | 'fat';
type DiningFeedbackStep = 'menu-select' | 'taste-checkin' | 'detail-tags' | 'taste-reflection';
type DiningDetailTagCategoryId = 'balance' | 'flow' | 'texture' | 'aroma' | 'composition';

interface DiningDetailTagCategory {
  id: DiningDetailTagCategoryId;
  label: string;
  tags: readonly {
    id: string;
    label: string;
  }[];
}

const DETAIL_TAG_COLLAPSED_VISIBLE_COUNT = 5;

const diningDetailTagCategories: readonly DiningDetailTagCategory[] = [
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
    ],
  },
];

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

const tasteExperienceAxes: readonly {
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
const feedbackBodyClass = 'text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]';
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
  const axisLabelById: Record<TasteAxisId, string> = {
    bitter: '쓴맛',
    fat: '지방맛',
    salty: '짠맛',
    sour: '신맛',
    sweet: '단맛',
    umami: '감칠맛',
  };
  const targetTaste = axisLabelById[experience.axis];
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
  onToggleSelection?: (experience: TasteExperienceWord) => void;
  selectedExperienceIds: readonly string[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const hasExploredMapRef = useRef(false);
  const hasInitializedMapRef = useRef(false);
  const isTouchGestureRef = useRef(false);
  const isTouchingMapRef = useRef(false);
  const isSnappingRef = useRef(false);
  const hasReleasedScrollRef = useRef(false);
  const mapZoomRef = useRef(1);
  const pinchGestureRef = useRef<{
    anchorX: number;
    anchorY: number;
    initialDistance: number;
    initialZoom: number;
    midpointX: number;
    midpointY: number;
  } | null>(null);
  const settleAnimationFrameRef = useRef<number | null>(null);
  const [draftSelectedExperienceId, setDraftSelectedExperienceId] = useState<string | null>(
    selectedExperienceIds[0] ?? null,
  );
  const [mapZoom, setMapZoom] = useState(1);
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

  const getClosestBubble = () => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return null;
    }

    const zoom = mapZoomRef.current;
    const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    const centerY = viewport.scrollTop + viewport.clientHeight / 2;
    return tasteExperienceBubblePositions.reduce((currentClosest, bubble) => {
      const currentX = currentClosest.x * zoom + viewport.clientWidth / 2;
      const currentY = currentClosest.y * zoom + viewport.clientHeight / 2;
      const nextX = bubble.x * zoom + viewport.clientWidth / 2;
      const nextY = bubble.y * zoom + viewport.clientHeight / 2;
      const currentDistance = Math.hypot(currentX - centerX, currentY - centerY);
      const nextDistance = Math.hypot(nextX - centerX, nextY - centerY);

      return nextDistance < currentDistance ? bubble : currentClosest;
    });
  };

  const selectClosestBubble = () => {
    const closest = getClosestBubble();

    if (!closest) {
      return null;
    }

    if (closest.experience.id !== selectedExperienceIdRef.current) {
      selectedExperienceIdRef.current = closest.experience.id;
      setDraftSelectedExperienceId(closest.experience.id);
    }

    return closest;
  };

  const clearSettledSnap = () => {
    if (settleAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(settleAnimationFrameRef.current);
      settleAnimationFrameRef.current = null;
    }
  };

  useEffect(() => () => clearSettledSnap(), []);

  const snapClosestBubbleToCenter = () => {
    const viewport = viewportRef.current;
    const closest = selectClosestBubble();

    if (!viewport || !closest) {
      return;
    }

    setIsFeedbackCardVisible(false);
    isSnappingRef.current = true;
    viewport.scrollTo({
      behavior: 'smooth',
      left: closest.x * mapZoomRef.current,
      top: closest.y * mapZoomRef.current,
    });

    window.setTimeout(() => {
      isSnappingRef.current = false;
      setIsFeedbackCardVisible(true);
    }, 420);
  };

  const scheduleSettledSnap = () => {
    clearSettledSnap();

    const viewport = viewportRef.current;

    if (!viewport || isTouchingMapRef.current || isSnappingRef.current) {
      return;
    }

    let lastLeft = viewport.scrollLeft;
    let lastTop = viewport.scrollTop;
    let stableFrameCount = 0;

    const waitForScrollToSettle = () => {
      const currentViewport = viewportRef.current;

      if (!currentViewport || isTouchingMapRef.current || isSnappingRef.current) {
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

    mapZoomRef.current = nextZoom;
    setMapZoom(nextZoom);
    window.requestAnimationFrame(() => {
      viewport.scrollLeft = viewport.clientWidth / 2 + pinchGesture.anchorX * nextZoom - pinchGesture.midpointX;
      viewport.scrollTop = viewport.clientHeight / 2 + pinchGesture.anchorY * nextZoom - pinchGesture.midpointY;
      selectClosestBubble();
    });
  };

  const handleMapTouchEnd = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in event && event.touches.length >= 2) {
      beginPinchGesture(event);
      return;
    }

    pinchGestureRef.current = null;
    isTouchingMapRef.current = false;
    hasReleasedScrollRef.current = true;
    scheduleSettledSnap();
  };

  const handleMapPointerCancel = () => {
    pinchGestureRef.current = null;
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

  const focusNextUnselectedBubbleTowardCenter = (currentExperienceId: string) => {
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
    const nextBubblePosition = renderedBubblePositions
      .filter((position) => !selectedExperienceIdSet.has(position.experience.id))
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
    <div className="relative h-full w-full overflow-hidden bg-[var(--tb-color-bg-focus)]">
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
            {renderedBubblePositions.map(({ experience, size, x, y }) => {
              const isSelected = enlargedExperienceIds.includes(experience.id);
              const priorityIndex = selectedExperienceIds.indexOf(experience.id);
              const distanceFromSelected = selectedBubblePosition
                ? Math.hypot(x - selectedBubblePosition.x, y - selectedBubblePosition.y)
                : undefined;

              return (
                <div
                  key={experience.id}
                  aria-label={experience.label}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectedExperienceIdRef.current = experience.id;
                    setDraftSelectedExperienceId(experience.id);
                    onToggleSelection?.(experience);
                  }}
                  className={cn(
                    'pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none items-center justify-center rounded-full px-4 text-center text-[14px] font-bold leading-tight transition-all duration-300 ease-out',
                    isSelected ? 'z-[4] border shadow-[0_18px_46px_rgba(0,0,0,0.12)]' : 'z-[3] border-0 shadow-none',
                  )}
                  style={{
                    ...getTasteExperienceStyle(experience.axis, experience.intensity, {
                      distanceFromSelected,
                      isSelected,
                    }),
                    height: size,
                    left: x,
                    top: y,
                    width: size,
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

function DiningDetailTagSection({
  accentAxis,
  category,
  customTags,
  expanded,
  inputValue,
  isInputOpen,
  onAddCustomTag,
  onChangeInputValue,
  onOpenInput,
  onToggleExpanded,
  onToggleTag,
  selectedTagIds,
}: {
  accentAxis: TasteAxisId;
  category: DiningDetailTagCategory;
  customTags: readonly string[];
  expanded: boolean;
  inputValue: string;
  isInputOpen: boolean;
  onAddCustomTag: () => void;
  onChangeInputValue: (value: string) => void;
  onOpenInput: () => void;
  onToggleExpanded: () => void;
  onToggleTag: (tagId: string) => void;
  selectedTagIds: readonly string[];
}) {
  const selectedTagIdSet = new Set(selectedTagIds);
  const tagListRef = useRef<HTMLDivElement | null>(null);
  const [collapsedTagLimit, setCollapsedTagLimit] = useState(DETAIL_TAG_COLLAPSED_VISIBLE_COUNT);
  const standardTags = category.tags.map((tag) => ({ ...tag, custom: false }));
  const customTagItems = customTags.map((label) => ({
    custom: true,
    id: getCustomDetailTagId(category.id, label),
    label,
  }));
  const allTags = [...standardTags, ...customTagItems];
  const getEstimatedChipWidth = (label: string) => Math.min(160, Math.max(56, label.length * 13 + 32));
  const getRowsNeeded = (chipWidths: number[], maxWidth: number) => {
    let rows = 1;
    let rowWidth = 0;

    for (const chipWidth of chipWidths) {
      const nextWidth = rowWidth === 0 ? chipWidth : rowWidth + 8 + chipWidth;

      if (nextWidth > maxWidth && rowWidth > 0) {
        rows += 1;
        rowWidth = chipWidth;
      } else {
        rowWidth = nextWidth;
      }
    }

    return rows;
  };
  const visibleTagIds = new Set<string>();
  const visibleTags = expanded
    ? allTags
    : allTags.filter((tag, index) => {
        const shouldShow =
          index < collapsedTagLimit || selectedTagIdSet.has(tag.id) || tag.custom;

        if (shouldShow) {
          visibleTagIds.add(tag.id);
        }

        return shouldShow;
      });
  const hasHiddenTags = !expanded && allTags.some((tag) => !visibleTagIds.has(tag.id));
  const canCollapse = expanded && allTags.length > DETAIL_TAG_COLLAPSED_VISIBLE_COUNT;

  useEffect(() => {
    const updateCollapsedTagLimit = () => {
      const tagListWidth = tagListRef.current?.clientWidth ?? 0;

      if (tagListWidth <= 0 || expanded) {
        return;
      }

      const plusWidth = 36;
      const moreWidth = 36;
      const maxRows = 2;
      const allChipWidths = [plusWidth, ...allTags.map((tag) => getEstimatedChipWidth(tag.label))];

      if (getRowsNeeded(allChipWidths, tagListWidth) <= maxRows) {
        setCollapsedTagLimit(allTags.length);
        return;
      }

      let nextLimit = Math.min(allTags.length, DETAIL_TAG_COLLAPSED_VISIBLE_COUNT);

      while (nextLimit > 0) {
        const chipWidths = [
          plusWidth,
          ...allTags.slice(0, nextLimit).map((tag) => getEstimatedChipWidth(tag.label)),
          moreWidth,
        ];

        if (getRowsNeeded(chipWidths, tagListWidth) <= maxRows) {
          break;
        }

        nextLimit -= 1;
      }

      setCollapsedTagLimit(nextLimit);
    };

    updateCollapsedTagLimit();
    window.addEventListener('resize', updateCollapsedTagLimit);

    return () => {
      window.removeEventListener('resize', updateCollapsedTagLimit);
    };
  }, [category.tags, customTags, expanded]);

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

      <div ref={tagListRef} className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenInput}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
          aria-label={`${category.label} 직접 입력`}
        >
          <Plus size={ICON_TOKENS.size.md} strokeWidth={1.8} />
        </button>
        {visibleTags.map((tag) => {
          const selected = selectedTagIdSet.has(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className={cn(
                'rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
                selected
                  ? ''
                  : tag.custom
                    ? 'border-dashed border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]'
                    : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]',
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
        })}
        {hasHiddenTags ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
            aria-label={`${category.label} 태그 더 보기`}
          >
            <ChevronRight size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
        ) : canCollapse ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-muted)]"
          >
            접기
          </button>
        ) : null}
      </div>

      {isInputOpen ? (
        <div className="flex items-center gap-2">
          <input
            value={inputValue}
            onChange={(event) => onChangeInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAddCustomTag();
              }
            }}
            className="min-w-0 flex-1 rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-3 py-2 text-[12px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
            placeholder="직접 느낀 표현 입력"
          />
          <button
            type="button"
            onClick={onAddCustomTag}
            className="rounded-full bg-[var(--tb-color-text-primary)] px-4 py-2 text-[12px] font-semibold text-[var(--tb-color-text-inverse)]"
          >
            완료
          </button>
        </div>
      ) : null}
    </section>
  );
}

function softenRecommendationCopy(recommendation: string) {
  return recommendation
    .replace(/해보세요\./g, '하는 방향이 더 잘 맞을 수 있어요.')
    .replace(/좋습니다\./g, '좋을 수 있어요.')
    .replace(/편이 좋습니다\./g, '편이 더 잘 맞을 수 있어요.')
    .replace(/편이 좋습니다/g, '편이 더 잘 맞을 수 있어요');
}

function getTasteCounts(choices: DiningFeedbackChoice[]) {
  const counts = new Map<string, number>();

  for (const choice of choices) {
    for (const taste of choice.affectedTastes) {
      counts.set(taste, (counts.get(taste) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([taste]) => taste);
}

function buildAnalysisSummary(
  scenario: DiningFeedbackScenario,
  draft: DiningFeedbackDraft,
  measurementSnapshot: TasteMeasurementSnapshot,
) {
  const strongestTaste = getStrongestTasteMeasurement(measurementSnapshot);
  const weakestTaste = getWeakestTasteMeasurement(measurementSnapshot);
  const selectedChoices = scenario.dishes.map((dish) => getSelectedChoice(dish, draft));
  const topAffectedTastes = getTasteCounts(selectedChoices).slice(0, 3);
  const mostFrictionDish = scenario.dishes
    .map((dish) => ({
      dish,
      response: draft.dishResponses[dish.id],
    }))
    .sort((left, right) => left.response.rating - right.response.rating)[0];
  const mostFrictionChoice = getSelectedChoice(mostFrictionDish.dish, draft);
  const bestAlignedDish = scenario.dishes
    .map((dish) => ({
      dish,
      response: draft.dishResponses[dish.id],
    }))
    .sort((left, right) => right.response.rating - left.response.rating)[0];
  const bestAlignedChoice = getSelectedChoice(bestAlignedDish.dish, draft);

  return {
    profileStage: 'Building Profile',
    strongestTaste,
    weakestTaste,
    mostFrictionChoice,
    mostFrictionDish: mostFrictionDish.dish,
    bestAlignedChoice,
    bestAlignedDish: bestAlignedDish.dish,
    topAffectedTastes,
    summaryTitle: '이번 피드백으로 현재 프로필이 한 단계 더 정교해졌어요',
    summary: `${bestAlignedDish.dish.title}에서 잘 맞은 인상과 ${mostFrictionDish.dish.title}에서 남은 마찰이 함께 반영되면서, 다음 예약은 더 자연스럽게 맞출 수 있는 방향으로 정리됐어요.`,
    changes: [
      {
        title: '더 선명해진 이해',
        body: `${bestAlignedDish.dish.title}에서는 ${bestAlignedChoice.label} 방향이 잘 맞았고, ${strongestTaste.label}은 현재 더 또렷하게 반응하는 포인트로 정리됐어요.`,
      },
      {
        title: '이번에 다듬어진 지점',
        body: `${mostFrictionDish.dish.title}에서는 ${mostFrictionChoice.label} 인상이 남았어요. 다음에는 ${weakestTaste.label}의 연결감과 피니시 정리를 더 섬세하게 맞출 수 있어요.`,
      },
      {
        title: '다음 다이닝 반영',
        body: softenRecommendationCopy(mostFrictionChoice.recommendation),
      },
    ],
    chefReadySummary: `${strongestTaste.label}처럼 강하게 느껴진 포인트는 겹치지 않게 정리하고, ${weakestTaste.label}처럼 짧게 남은 포인트는 더 자연스럽게 이어지는 방향이 현재 가장 잘 맞는 흐름으로 읽혀요.`,
    learningLoop: '이 피드백은 다음 예약, 셰프용 캘리브레이션, 이후 프로필 업데이트에 함께 반영됩니다.',
    progressSteps: [
      { label: 'Starter Profile', caption: '첫 해석' },
      { label: 'Building Profile', caption: '현재 단계' },
      { label: 'Refined Profile', caption: '반복될수록' },
    ] as const,
  };
}

interface DiningFeedbackScreenProps {
  draft: DiningFeedbackDraft;
  onBack: () => void;
  onChange: (nextDraft: DiningFeedbackDraft) => void;
  onMapViewChange?: (isMapView: boolean) => void;
  onSubmit: () => void;
  scenario: DiningFeedbackScenario;
}

export function DiningFeedbackScreen({
  draft,
  onBack,
  onChange,
  onMapViewChange,
  onSubmit,
  scenario,
}: DiningFeedbackScreenProps) {
  const [feedbackStep, setFeedbackStep] = useState<DiningFeedbackStep>('menu-select');
  const [selectedDishIndex, setSelectedDishIndex] = useState<number | null>(null);
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const [isTasteSearchOpen, setIsTasteSearchOpen] = useState(false);
  const [searchedExperienceId, setSearchedExperienceId] = useState<string | null>(null);
  const [expandedDetailCategoryIds, setExpandedDetailCategoryIds] = useState<string[]>([]);
  const [activeCustomDetailCategoryId, setActiveCustomDetailCategoryId] = useState<string | null>(null);
  const [customDetailInputValue, setCustomDetailInputValue] = useState('');
  const [activeDetailExperienceIndex, setActiveDetailExperienceIndex] = useState(0);
  const reflectionPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const activeDish = (scenario.dishes[activeDishIndex] ?? scenario.dishes[0]) as DiningDishMetadata;
  const activeResponse = draft.dishResponses[activeDish.id] ?? {
    customDetailTags: {},
    rating: 3,
    reflectionNote: '',
    reflectionPhotoName: null,
    reflectionPhotoPreviewUrl: null,
    selectedChoiceId: null,
    selectedDetailTagIds: [],
    selectedExperienceId: null,
    selectedExperienceIds: [],
  };
  const activeChoice = getSelectedChoice(activeDish, draft);
  const activeExperienceIds = getSelectedExperienceIds(activeResponse);
  const activeExperiences = getSelectedTasteExperiences(activeResponse);
  const activeExperience = activeExperiences[0] ?? null;
  const activeDetailExperience =
    activeExperiences[Math.min(activeDetailExperienceIndex, Math.max(0, activeExperiences.length - 1))] ??
    activeExperience;
  const selectedDetailTagIds = activeResponse.selectedDetailTagIds ?? [];
  const customDetailTags = activeResponse.customDetailTags ?? {};
  const reflectionNote = activeResponse.reflectionNote ?? '';
  const reflectionPhotoName = activeResponse.reflectionPhotoName ?? null;
  const reflectionPhotoPreviewUrl = activeResponse.reflectionPhotoPreviewUrl ?? null;
  const completedDishCount = scenario.dishes.filter(
    (dish) => getSelectedExperienceIds(draft.dishResponses[dish.id]).length > 0,
  ).length;
  const selectedDish = selectedDishIndex === null ? null : scenario.dishes[selectedDishIndex] ?? null;

  useEffect(() => {
    onMapViewChange?.(feedbackStep === 'taste-checkin');

    return () => {
      onMapViewChange?.(false);
    };
  }, [feedbackStep, onMapViewChange]);

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

    onChange({
      ...draft,
      dishResponses: nextDishResponses,
      overallRating: Math.round(averageRating),
      returnIntent: averageRating >= 4 ? 'yes' : averageRating <= 2.5 ? 'no' : 'maybe',
    });

    return nextExperienceIds;
  };

  const updateActiveDishResponse = (nextResponse: Partial<typeof activeResponse>) => {
    onChange({
      ...draft,
      dishResponses: {
        ...draft.dishResponses,
        [activeDish.id]: {
          ...activeResponse,
          ...nextResponse,
        },
      },
    });
  };

  const toggleDetailTag = (tagId: string) => {
    const nextSelectedTagIds = selectedDetailTagIds.includes(tagId)
      ? selectedDetailTagIds.filter((selectedTagId) => selectedTagId !== tagId)
      : [...selectedDetailTagIds, tagId];

    updateActiveDishResponse({ selectedDetailTagIds: nextSelectedTagIds });
  };

  const toggleDetailCategoryExpanded = (categoryId: string) => {
    setExpandedDetailCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((expandedCategoryId) => expandedCategoryId !== categoryId)
        : [...current, categoryId],
    );
  };

  const openCustomDetailInput = (categoryId: string) => {
    setActiveCustomDetailCategoryId(categoryId);
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

  const openReflectionPhotoUpload = () => {
    reflectionPhotoInputRef.current?.click();
  };

  const handleReflectionPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateActiveDishResponse({
        reflectionPhotoName: file.name,
        reflectionPhotoPreviewUrl: typeof reader.result === 'string' ? reader.result : null,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const completeDetailTags = () => {
    setSelectedDishIndex(null);
    setActiveCustomDetailCategoryId(null);
    setCustomDetailInputValue('');
    setFeedbackStep('menu-select');
  };

  const moveToTasteCheckin = () => {
    if (selectedDishIndex === null) {
      return;
    }

    setActiveDishIndex(selectedDishIndex);
    setSearchedExperienceId(null);
    setFeedbackStep('taste-checkin');
  };

  const handleTopBack = () => {
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

    if (feedbackStep === 'taste-reflection') {
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
              setExpandedDetailCategoryIds([]);
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

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col animate-slideIn',
        feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection'
          ? 'bg-[var(--tb-color-bg-focus)]'
          : 'bg-[var(--tb-color-bg-page)]',
      )}
    >
      <TopAppBar
        appearance={feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection' ? 'solid' : undefined}
        title="식후 피드백"
        showBack
        onBack={handleTopBack}
        rightActions={<div className="h-10 w-10" aria-hidden="true" />}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pt-6 pb-[168px]">
          {feedbackStep !== 'detail-tags' && feedbackStep !== 'taste-reflection' ? (
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
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
                <p className={`mt-1 ${feedbackBodyClass}`}>
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
                {scenario.dishes.map((dish, index) => {
                  const isSelected = selectedDishIndex === index;
                  const recordedExperiences = getSelectedTasteExperiences(draft.dishResponses[dish.id]);
                  const recordedExperience = recordedExperiences[0] ?? null;

                  return (
                    <SelectionCard
                      key={dish.id}
                      description={dish.subtitle}
                      indicator="radio"
                      onClick={() => setSelectedDishIndex(index)}
                      selected={isSelected}
                      title={dish.title}
                      trailing={
                        recordedExperience ? (
                          <span className="rounded-full bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
                            {recordedExperiences.length > 1
                              ? `${recordedExperience.label} 외 ${recordedExperiences.length - 1}개 기록됨`
                              : `${recordedExperience.label} 기록됨`}
                          </span>
                        ) : null
                      }
                    />
                  );
                })}
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
                            'h-8 w-8 rounded-full border transition-transform active:scale-95',
                            isActive ? 'scale-110 shadow-[0_8px_18px_rgba(0,0,0,0.10)]' : 'opacity-70',
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
                    className="flex w-full max-w-[420px] cursor-pointer items-center justify-between gap-4 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] p-3 transition-colors hover:border-[var(--tb-color-border-default)]"
                    aria-label="미각 회고 페이지 열기"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
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
                          openReflectionPhotoUpload();
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
                      expanded={expandedDetailCategoryIds.includes(category.id)}
                      inputValue={activeCustomDetailCategoryId === category.id ? customDetailInputValue : ''}
                      isInputOpen={activeCustomDetailCategoryId === category.id}
                      onAddCustomTag={() => addCustomDetailTag(category.id)}
                      onChangeInputValue={setCustomDetailInputValue}
                      onOpenInput={() => openCustomDetailInput(category.id)}
                      onToggleExpanded={() => toggleDetailCategoryExpanded(category.id)}
                      onToggleTag={toggleDetailTag}
                      selectedTagIds={selectedDetailTagIds}
                    />
                  ))}
                </div>
              </PageSection>
            </>
          ) : feedbackStep === 'taste-reflection' ? (
            <PageSection>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  {activeDetailExperience ? (
                    <div
                      className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full border px-4"
                      style={{
                        backgroundColor: `var(--tb-taste-${activeDetailExperience.axis}-tint-surface)`,
                        borderColor: `var(--tb-taste-${activeDetailExperience.axis}-tint-soft-border)`,
                        color: `var(--tb-taste-${activeDetailExperience.axis}-tint-surface-text)`,
                      }}
                    >
                      <span className="text-[10px] font-semibold opacity-70">
                        {activeDetailExperienceIndex === 0 ? '메인 미각' : '보조 미각'}
                      </span>
                      <span className="mt-2 text-[15px] font-bold leading-tight">
                        {activeDetailExperience.label}
                      </span>
                    </div>
                  ) : null}
                  <div>
                    <h1 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                      미각 회고
                    </h1>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      이 인상이 남은 순간을 짧게 적어두면 다음 다이닝에 더 잘 반영할 수 있어요.
                    </p>
                  </div>
                </div>

                <SectionCard hoverEffect={false}>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                        짧은 기록
                      </span>
                      <textarea
                        value={reflectionNote}
                        onChange={(event) => updateActiveDishResponse({ reflectionNote: event.target.value })}
                        className="min-h-[120px] w-full resize-none rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] px-4 py-3 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                        placeholder="예: 중반부터 산미가 정리해줘서 생선 뒤맛이 더 맑게 느껴졌어요."
                      />
                    </label>

                    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] p-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[var(--tb-color-text-primary)]">
                          접시 사진
                        </p>
                        <p className="mt-1 truncate text-[12px] text-[var(--tb-color-text-subtle)]">
                          {reflectionPhotoName ?? '사진을 추가하면 장면을 더 쉽게 떠올릴 수 있어요.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openReflectionPhotoUpload}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-icon-primary)]"
                        aria-label="미식 기록 사진 추가"
                      >
                        <Camera size={ICON_TOKENS.size.md} strokeWidth={1.8} />
                      </button>
                    </div>

                    {reflectionPhotoPreviewUrl ? (
                      <img
                        src={reflectionPhotoPreviewUrl}
                        alt={reflectionPhotoName ?? '미식 기록 사진'}
                        className="aspect-[4/3] w-full rounded-[20px] object-cover"
                      />
                    ) : null}
                  </div>
                </SectionCard>
              </div>
            </PageSection>
          ) : (
            <PageSection title="코스별 미각 체크인" titleSize="md">
              <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <span className={feedbackLabelClass}>
                      {activeDishIndex + 1} / {scenario.dishes.length} · {activeDish.courseLabel}
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
                      setActiveDishIndex((index) => Math.min(scenario.dishes.length - 1, index + 1))
                    }
                    disabled={activeDishIndex === scenario.dishes.length - 1}
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
                      onChange({
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
                      onChange={(returnIntent) => onChange({ ...draft, returnIntent })}
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

      <FlowBottomCta
        actionDisabled={feedbackStep === 'menu-select' && selectedDishIndex === null}
        actionLabel={
          feedbackStep === 'menu-select'
            ? '선택한 메뉴 기록하기'
            : feedbackStep === 'detail-tags' || feedbackStep === 'taste-reflection'
              ? '디테일 저장하기'
              : '다음 다이닝에 반영하기'
        }
        helperText={
          feedbackStep === 'menu-select'
            ? selectedDish
              ? `${selectedDish.courseLabel} · ${selectedDish.title}의 미각 인상을 기록합니다.`
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
              : onSubmit
        }
      />
    </div>
  );
}

interface DiningAiAnalysisScreenProps {
  draft: DiningFeedbackDraft;
  measurementSnapshot: TasteMeasurementSnapshot;
  onBack: () => void;
  onClose: () => void;
  scenario: DiningFeedbackScenario;
}

export function DiningAiAnalysisScreen({
  draft,
  measurementSnapshot,
  onBack,
  onClose,
  scenario,
}: DiningAiAnalysisScreenProps) {
  const summary = buildAnalysisSummary(scenario, draft, measurementSnapshot);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar title="프로필 정교화" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pt-6 pb-[168px]">
          <SectionCard
            hoverEffect={false}
            className="bg-[var(--tb-color-surface-muted)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <OutlineBadge>{summary.profileStage}</OutlineBadge>
                <div>
                  <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    프로필이 업데이트됐습니다
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    다음 예약 추천에 반영할 수 있는 최신 프로필이 준비됐어요.
                  </p>
                </div>
              </div>
              <TokenBox backgroundToken="surface-base" textToken="text-primary">
                <CheckCircle2 size={ICON_TOKENS.size.lg} />
              </TokenBox>
            </div>

            <div className="w-full rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-base)] px-4 py-4">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">{summary.summaryTitle}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">{summary.summary}</p>
            </div>
          </SectionCard>

          <PageSection title="프로필 변화 요약" titleSize="md">
            <div className="grid grid-cols-1 gap-3">
              {summary.changes.map((note, index) => {
                const Icon = index === 0 ? Sparkles : index === 1 ? ChefHat : MessageSquareText;
                const iconTokens =
                  index === 0
                    ? { backgroundToken: 'taste-sweet-bg', textToken: 'taste-sweet-main' }
                    : index === 1
                      ? { backgroundToken: 'taste-salty-bg', textToken: 'taste-salty-main' }
                      : { backgroundToken: 'taste-umami-bg', textToken: 'taste-umami-main' };

                return (
                  <SectionCard key={note.title} hoverEffect={false}>
                    <div className="flex items-start gap-3">
                      <TokenBox
                        backgroundToken={iconTokens.backgroundToken}
                        textToken={iconTokens.textToken}
                      >
                        <Icon size={ICON_TOKENS.size.md} />
                      </TokenBox>
                      <div className="flex flex-col gap-1">
                        <p className={feedbackHintClass}>{note.title}</p>
                        <p className="text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-tertiary)]">
                          {note.body}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </PageSection>

          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4">
              <div>
                <p className={feedbackHintClass}>Confidence</p>
                <h2 className="mt-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                  반복될수록 더 선명해지는 Building Profile 단계예요
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {summary.progressSteps.map((step, index) => {
                  const isCurrent = index === 1;

                  return (
                    <div
                      key={step.label}
                      className={cn(
                        'rounded-[16px] border px-3 py-3',
                        isCurrent
                          ? 'border-[var(--tb-color-text-secondary)] bg-[var(--tb-color-surface-muted)]'
                          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)]',
                      )}
                    >
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        {step.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                        {step.caption}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                {summary.learningLoop}
              </p>
            </div>
          </SectionCard>

          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start gap-3">
              <TokenBox backgroundToken="surface-base" textToken="text-primary">
                <ChefHat size={ICON_TOKENS.size.md} />
              </TokenBox>
              <div className="flex flex-col gap-1">
                <p className={feedbackHintClass}>셰프용 현재 요약</p>
                <p className="text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-tertiary)]">
                  {summary.chefReadySummary}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.topAffectedTastes.map((taste) => (
                    <TasteChip key={taste} taste={taste} />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <FlowBottomCta
        actionLabel="예약 상세로 돌아가기"
        helperText="다음 예약과 프로필 업데이트에 자동 반영됩니다."
        onAction={onClose}
      />
    </div>
  );
}
