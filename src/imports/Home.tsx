import React, { useEffect, useRef, useState } from "react";
import svgPaths from "./svg-h9nsrm0gkv";
// import imgImage from "figma:asset/0681bae57cc99eb9acba0a48c532d82e73863896.png";
// import imgImage1 from "figma:asset/c778d4444bb95d0a798d28fe5acdfe85cf6ffc14.png";
// import imgImage2 from "figma:asset/2220fac5adaafaa71708a4ae95760913fe178d89.png";
import chefHwangJeongin from "../assets/HwangJeongin.png";
import chefLeeEunji from "../assets/LeeEunji.png";
import chefLimJeongsik from "../assets/LimJeongsik.png";
import chefHyunseokChoi from "../assets/HyunseokChoi.png";
import chefSonJongwon from "../assets/SonJongwon.png";
import chefLeeJun from "../assets/LeeJun.png";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import TasteChip from "../components/system/TasteChip";
import TopAppBar from "../components/TopAppBar";
import ChefAvatar from "../components/system/ChefAvatar";
import CardDetailLabel from "../components/system/CardDetailLabel";
import TCSBadge from "../components/system/TCSBadge";
import TastePointArrowBox from "../components/system/TastePointArrowBox";
import { ICON_TOKENS, TASTE_IDS, TASTE_TOKENS, type TasteId } from "../constants/designTokens";
import {
  buildTasteAdjustmentGradient,
  getTasteBg,
  getTasteColor,
  getTasteTint,
  getTasteTintSurface,
  getTasteTintSurfaceSubText,
  getTasteTintSurfaceText,
  mixHexColors,
  TASTE_TYPES,
} from "../constants/tasteColors";
import { type DiningFeedbackDraft } from "../constants/diningFeedbackData";
import { RESERVATION_CATALOG, type ReservationRecord } from "../constants/reservationCatalog";
import {
  TASTE_MEASUREMENT_AVERAGES,
  getTasteMeasurementAgeLabel,
  type TasteMeasurementSnapshot,
} from "../constants/tasteMeasurementData";
import {
  hydrateRecentMeasurementSnapshots,
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  type RestaurantContentDish,
} from "../lib/tasteBuddySupabase";
import {
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  Clock as ClockIcon,
  Search as SearchIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon
} from 'lucide-react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const Star = wrapIcon(StarIcon);
const StarHalf = wrapIcon(StarHalfIcon);
const Clock = wrapIcon(ClockIcon);
const Search = wrapIcon(SearchIcon);
const ChevronDown = wrapIcon(ChevronDownIcon);
const ChevronRight = wrapIcon(ChevronRightIcon);
const ChevronUp = wrapIcon(ChevronUpIcon);

type HomeChefCardData = {
  bgColor?: string;
  image: string | null;
  match: number;
  name: string;
  restaurant: string;
  taste: string;
};

type HomeAdjustmentHistoryItem = {
  adjustmentDetail: {
    evaluation: {
      options: {
        negative1: string;
        negative2: string;
        positive: string;
      };
      question: string;
    };
    method: {
      minus: {
        desc: string;
        icon: string;
        name: string;
      };
      plus: {
        desc: string;
        icon: string;
        name: string;
      };
    };
    quote: string;
    summary: Array<{
      label: string;
      taste: string;
      value: number;
    }>;
  };
  adjustments: Array<{
    change: string;
    taste: string;
  }>;
  badgeColor?: string;
  chefName: string;
  color?: string;
  date: string;
  duration: string;
  feedbackLabel: string;
  id: number;
  image: string | null;
  isExpanded: boolean;
  likedTastes: string[];
  menu: string;
  neededAdjustments: string[];
  restaurant: string;
  satisfaction: number;
  selectedIntensity: string | null;
  time: string;
};

type HomeTrendDetail = {
  cue: string;
  detailLabel: string;
  detailTypeLabel?: string;
  history: string[];
  parentTaste: string;
  change: string;
  trend: "increase" | "decrease";
};

type HomeTasteProfileCardData = {
  details: HomeTrendDetail[];
  keywords: string[];
  periodLabel: string;
  serviceHint: string;
  summary: string;
  title: string;
};

type HomeSpecialNoteCardData = {
  confidenceLabel: string;
  confidenceNote: string;
  details: HomeTrendDetail[];
  guidance: string[];
  keywords: string[];
  periodLabel: string;
  reservationHint: string;
  serviceHint: string;
  summary: string;
  title: string;
  translationStatusLabel: string;
};

type HomeMeasurementSeriesPoint = {
  label: string;
} & Record<string, number | string>;

type HomeMeasurementOverviewValue = {
  change: number;
  taste: string;
};

const HOME_TASTE_PROFILE_CARD = {
  details: [
    {
      cue: "당 보강 없이도 단맛이 더 빨리 또렷하게 느껴지는 흐름이에요.",
      detailLabel: "단맛",
      history: ["+1.8%", "+3.2%", "+5.4%", "+7.1%", "+9.8%", "+12.6%"],
      parentTaste: "단맛",
      change: "+15.2%",
      trend: "increase",
    },
    {
      cue: "풍미의 깊이보다 마무리의 밀도에서 먼저 둔감해졌어요.",
      detailLabel: "감칠맛",
      history: ["-1.4%", "-2.9%", "-4.1%", "-5.8%", "-7.6%", "-9.1%"],
      parentTaste: "감칠맛",
      change: "-10.7%",
      trend: "decrease",
    },
  ],
  keywords: ["체중 감소", "단맛 반응", "감칠맛 밀도"],
  periodLabel: "6.10-16일",
  summary:
    "최근 6일 동안 단맛은 더 빨리 또렷해지고, 감칠맛은 같은 강도에서도 밀도가 덜 느껴졌어요. 지금 변화는 음식 취향이 바뀌었다기보다 컨디션 변화에 따른 반응 차이에 가까워요.",
  serviceHint:
    "다음 추천과 셰프 메모에는 단맛 자극은 과하게 올리지 않고, 감칠맛은 깊이보다 잔향과 밀도를 보강하는 방향으로 반영됩니다.",
  title: "체중 감소 뒤 반응이 달라졌어요",
} as const;
const HOME_TASTE_PROFILE_CIRCLE_GRADIENT = buildTasteAdjustmentGradient(
  HOME_TASTE_PROFILE_CARD.details.map((detail) => ({
    taste: detail.parentTaste,
    change: detail.change,
  })),
  { direction: "to bottom", useTint: false },
);
const HOME_TASTE_PROFILE_WEEKLY_SERIES = [
  { label: "6.10", "단맛": 1.8, "감칠맛": -1.4, "신맛": 0.4, "쓴맛": -0.8, "짠맛": 0.7, "지방맛": -0.5 },
  { label: "6.11", "단맛": 3.2, "감칠맛": -2.9, "신맛": 0.9, "쓴맛": -1.1, "짠맛": 0.4, "지방맛": -0.9 },
  { label: "6.12", "단맛": 5.4, "감칠맛": -4.1, "신맛": 1.2, "쓴맛": -1.3, "짠맛": 0.2, "지방맛": -1.6 },
  { label: "6.13", "단맛": 7.1, "감칠맛": -5.8, "신맛": 1.5, "쓴맛": -1.7, "짠맛": -0.3, "지방맛": -2.4 },
  { label: "6.14", "단맛": 9.8, "감칠맛": -7.6, "신맛": 1.9, "쓴맛": -1.9, "짠맛": -0.7, "지방맛": -3.2 },
  { label: "6.16", "단맛": 15.2, "감칠맛": -10.7, "신맛": 2.3, "쓴맛": -2.1, "짠맛": -1.4, "지방맛": -4.7 },
] as const;
const HOME_TASTE_PROFILE_OVERVIEW_VALUES = [
  { taste: "단맛", change: 15.2 },
  { taste: "신맛", change: 2.3 },
  { taste: "쓴맛", change: -2.1 },
  { taste: "짠맛", change: -1.4 },
  { taste: "감칠맛", change: -10.7 },
  { taste: "지방맛", change: -4.7 },
] as const;
const HOME_SPECIAL_NOTE_CARD = {
  confidenceLabel: "반복 관찰 4회",
  confidenceNote: "최근 식사와 피드백에서 비슷한 세부 반응이 이어졌어요.",
  details: [
    {
      cue: "표고, 다시, 숙성 발효 베이스에서 반응이 더 크게 나타나요.",
      detailLabel: "구아닐산",
      detailTypeLabel: "감칠맛 유형",
      history: ["+0.4%", "+0.8%", "+1.1%", "+1.5%", "+1.9%", "+3.4%", "+2.7%", "+4.5%"],
      parentTaste: "감칠맛",
      change: "+5.2%",
      trend: "increase",
    },
    {
      cue: "무거운 지방감보다 가볍고 정돈된 마무리가 더 편안해요.",
      detailLabel: "글루탐산",
      detailTypeLabel: "지방 유형",
      history: ["-0.6%", "-1.2%", "-1.8%", "-2.4%", "-3.2%", "-6.4%", "-5.3%", "-10.8%"],
      parentTaste: "지방맛",
      change: "-14.3%",
      trend: "decrease",
    },
  ],
  guidance: [
    "발효 베이스는 낮게 시작하고, 깊이는 후반에 단계적으로 올려요.",
    "풍미의 무게는 유지하되 농축된 발효감은 먼저 강하게 밀지 않아요.",
  ],
  keywords: ["발효 베이스", "숙성 풍미", "농축 감칠맛"],
  periodLabel: "6.10-16일",
  reservationHint:
    "다음 예약에서는 이 신호가 셰프 메모에 함께 전달돼요. 메뉴 방향은 유지하되, 발효 베이스의 시작 강도와 풍미의 밀도를 더 부드럽게 조정하는 기준으로 반영됩니다.",
  serviceHint:
    "이 신호는 셰프의 의도를 바꾸기보다, 같은 의도가 더 편안하게 전달되도록 돕는 가이드로 쓰여요.",
  summary:
    "감칠맛과 지방감 전체가 아니라, 발효 풍미를 만드는 세부 요소에서 반응 차이가 보였어요. 다음 예약 personalisation에는 이 세부 신호가 함께 전달됩니다.",
  title: "발효 풍미에 예민한 편",
  translationStatusLabel: "다음 예약 반영 중",
} as const;
const HOME_SPECIAL_NOTE_CIRCLE_GRADIENT = buildTasteAdjustmentGradient(
  HOME_SPECIAL_NOTE_CARD.details.map((detail) => ({
    taste: detail.parentTaste,
    change: detail.change,
  })),
  { direction: "to bottom", useTint: false },
);

function cloneHomeTrendDetail(detail: HomeTrendDetail): HomeTrendDetail {
  return {
    ...detail,
    history: [...detail.history],
  };
}

function cloneHomeTasteProfileCardData(
  cardData: typeof HOME_TASTE_PROFILE_CARD | HomeTasteProfileCardData,
): HomeTasteProfileCardData {
  return {
    ...cardData,
    details: cardData.details.map((detail) => cloneHomeTrendDetail(detail)),
    keywords: [...cardData.keywords],
  };
}

function cloneHomeSpecialNoteCardData(
  cardData: typeof HOME_SPECIAL_NOTE_CARD | HomeSpecialNoteCardData,
): HomeSpecialNoteCardData {
  return {
    ...cardData,
    details: cardData.details.map((detail) => cloneHomeTrendDetail(detail)),
    guidance: [...cardData.guidance],
    keywords: [...cardData.keywords],
  };
}

function parseTasteChangeValue(change: number | string) {
  if (typeof change === "number") {
    return change;
  }

  const parsed = Number.parseFloat(change.replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHomeTasteProfileSummaryDetails() {
  const detailsWithValue = HOME_TASTE_PROFILE_CARD.details.map((detail) => ({
    detail,
    numericChange: parseTasteChangeValue(detail.change),
  }));

  const highestIncrease =
    detailsWithValue
      .filter((item) => item.numericChange > 0)
      .sort((left, right) => right.numericChange - left.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => right.numericChange - left.numericChange)[0];

  const biggestDecrease =
    detailsWithValue
      .filter((item) => item.numericChange < 0)
      .sort((left, right) => left.numericChange - right.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => left.numericChange - right.numericChange)[0];

  const summaryDetails: Array<(typeof HOME_TASTE_PROFILE_CARD.details)[number]> = [];

  if (highestIncrease?.detail) {
    summaryDetails.push(highestIncrease.detail);
  }

  if (
    biggestDecrease?.detail &&
    biggestDecrease.detail.detailLabel !== highestIncrease?.detail?.detailLabel
  ) {
    summaryDetails.push(biggestDecrease.detail);
  }

  return summaryDetails;
}

const HOME_TASTE_PROFILE_SUMMARY_DETAILS = getHomeTasteProfileSummaryDetails();

function getHomeSpecialNoteSummaryDetails() {
  const detailsWithValue = HOME_SPECIAL_NOTE_CARD.details.map((detail) => ({
    detail,
    numericChange: parseTasteChangeValue(detail.change),
  }));

  const highestIncrease =
    detailsWithValue
      .filter((item) => item.numericChange > 0)
      .sort((left, right) => right.numericChange - left.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => right.numericChange - left.numericChange)[0];

  const biggestDecrease =
    detailsWithValue
      .filter((item) => item.numericChange < 0)
      .sort((left, right) => left.numericChange - right.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => left.numericChange - right.numericChange)[0];

  const summaryDetails: Array<(typeof HOME_SPECIAL_NOTE_CARD.details)[number]> = [];

  if (highestIncrease?.detail) {
    summaryDetails.push(highestIncrease.detail);
  }

  if (
    biggestDecrease?.detail &&
    biggestDecrease.detail.detailLabel !== highestIncrease?.detail?.detailLabel
  ) {
    summaryDetails.push(biggestDecrease.detail);
  }

  return summaryDetails;
}

const HOME_SPECIAL_NOTE_SUMMARY_DETAILS = getHomeSpecialNoteSummaryDetails();

function buildSpecialNoteTrendPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  let path = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`;

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];

    if (!current) {
      continue;
    }
    path += ` L ${current.x} ${current.y}`;
  }

  return path;
}







function Heading() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Heading">
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[1.4] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.24px]">셰프 매칭</p>
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[12px] text-[grey] text-nowrap text-right tracking-[0.3421px] whitespace-pre">자세히 보기</p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[8px] relative w-[4px]">
            <div className="absolute inset-[-6.25%_-12.5%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 9">
                <path d="M4.5 0.5L0.5 4.5L4.5 8.5" id="Vector 143" stroke="var(--stroke-0, #808080)" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreInfo() {
  return (
    <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-name="More info">
      <Content1 />
    </div>
  );
}

function MoreInfo1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0" data-name="More Info">
      <MoreInfo />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex gap-[8px] items-end relative shrink-0 w-full" data-name="Heading">
      <Heading />
      <div className="flex flex-row items-end self-stretch">
        <MoreInfo1 />
      </div>
    </div>
  );
}

function Info() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Info">
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px] w-full">황정인 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[var(--tb-color-text-muted)] w-full">레스토랑 베누</p>
    </div>
  );
}

function Info1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[var(--tb-color-text-primary)] text-[10px] text-nowrap whitespace-pre">매칭률 75%</p>
    </div>
  );
}

function Content2() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-name="Content">
      <div className="relative rounded-[8px] shrink-0 size-[48px]" data-name="Image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px]">
          <img alt="" className="absolute h-[224%] left-[-27.29%] max-w-none top-[-1.88%] w-[179.2%] object-cover" src={chefHwangJeongin} />
        </div>
      </div>
      <Info1 />
    </div>
  );
}

function Cards() {
  return (
    <div className="bg-[#ffebcc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.99] cursor-pointer" data-name="Cards">
      <Content2 />
    </div>
  );
}

function Info2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Info">
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px] w-full">이은지 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[var(--tb-color-text-muted)] w-full">숍 리제 (Lysée)</p>
    </div>
  );
}

function Info3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info2 />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[var(--tb-color-text-primary)] text-[10px] text-nowrap whitespace-pre">매칭률 72%</p>
    </div>
  );
}

function Content3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-name="Content">
      <div className="relative rounded-[8px] shrink-0 size-[48px]" data-name="Image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px]">
          <img alt="" className="absolute h-[338.39%] left-[-85.36%] max-w-none top-[-32.13%] w-[270.71%] object-cover" src={chefLeeEunji} />
        </div>
      </div>
      <Info3 />
    </div>
  );
}

function Cards1() {
  return (
    <div className="bg-[#fff7cc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.99] cursor-pointer" data-name="Cards">
      <Content3 />
    </div>
  );
}

function Info4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Info">
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px] w-full">임정식 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[var(--tb-color-text-muted)] w-full">정식당</p>
    </div>
  );
}

function Info5() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info4 />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[var(--tb-color-text-primary)] text-[10px] text-nowrap whitespace-pre">매칭률 70%</p>
    </div>
  );
}

function Content4() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-name="Content">
      <div className="relative rounded-[8px] shrink-0 size-[48px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={chefLimJeongsik} />
      </div>
      <Info5 />
    </div>
  );
}

function Cards2() {
  return (
    <div className="bg-[#eaf4cc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.99] cursor-pointer" data-name="Cards">
      <Content4 />
    </div>
  );
}

const CHEF_IMAGE_BY_NAME: Record<string, string> = {
  "손종원": chefSonJongwon,
  "이은지": chefLeeEunji,
  "이준": chefLeeJun,
  "임정식": chefLimJeongsik,
  "최현석": chefHyunseokChoi,
  "황정인": chefHwangJeongin,
};

function getChefImageByName(name: string) {
  return CHEF_IMAGE_BY_NAME[name.replace(/\s*셰프$/, "")] ?? null;
}

function buildHomeChefCardsFromReservations(reservations: ReservationRecord[]) {
  const tasteFallbacks = ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"];
  const uniqueChefs = new Map<string, HomeChefCardData>();

  for (const reservation of reservations) {
    const key = `${reservation.chef}:${reservation.restaurant}`;

    if (uniqueChefs.has(key)) {
      continue;
    }

    uniqueChefs.set(key, {
      name: reservation.chef.endsWith("셰프") ? reservation.chef : `${reservation.chef} 셰프`,
      restaurant: reservation.restaurant,
      match: reservation.matchRate,
      image: reservation.chefImage ?? getChefImageByName(reservation.chef),
      taste: reservation.adjustments[0]?.taste ?? tasteFallbacks[uniqueChefs.size % tasteFallbacks.length] ?? "감칠맛",
    });
  }

  return Array.from(uniqueChefs.values())
    .sort((left, right) => right.match - left.match)
    .slice(0, 6);
}

function buildHomeChefCardsFromContent(dishes: RestaurantContentDish[]) {
  if (dishes.length === 0) {
    return [];
  }

  const groupedByRestaurant = new Map<
    string,
    {
      chef: string;
      dishCount: number;
      match: number;
      restaurant: string;
      taste: string;
    }
  >();

  for (const dish of dishes) {
    const current = groupedByRestaurant.get(dish.restaurantSlug);
    const match = 58 + Math.min(37, Math.round(dish.confidence * 35));

    if (!current) {
      groupedByRestaurant.set(dish.restaurantSlug, {
        chef: dish.chef,
        restaurant: dish.restaurant,
        dishCount: 1,
        match,
        taste: TASTE_TOKENS[dish.dominantTaste].label,
      });
      continue;
    }

    current.dishCount += 1;
    current.match = Math.max(current.match, match);
  }

  return [...groupedByRestaurant.values()]
    .sort((left, right) => {
      if (right.dishCount !== left.dishCount) {
        return right.dishCount - left.dishCount;
      }

      return right.match - left.match;
    })
    .slice(0, 6)
    .map((entry) => ({
      name: entry.chef.endsWith("셰프") ? entry.chef : `${entry.chef} 셰프`,
      restaurant: entry.restaurant,
      match: entry.match,
      image: getChefImageByName(entry.chef),
      taste: entry.taste,
    }));
}

function mergeHomeChefCards(
  reservationCards: HomeChefCardData[],
  contentCards: HomeChefCardData[],
) {
  const merged = new Map<string, HomeChefCardData>();

  for (const card of [...reservationCards, ...contentCards]) {
    const key = `${card.name}:${card.restaurant}`;
    if (!merged.has(key)) {
      merged.set(key, card);
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => right.match - left.match)
    .slice(0, 6);
}

export function buildHomeReservationHint(reservations: ReservationRecord[]) {
  const nextReservation =
    reservations.find((reservation) => reservation.status !== "completed") ??
    reservations[0] ??
    null;

  if (!nextReservation) {
    return HOME_SPECIAL_NOTE_CARD.reservationHint;
  }

  if (nextReservation.status === "completed") {
    return `${nextReservation.restaurant} 다이닝에서 남긴 반응은 다음 예약 셰프 메모에 함께 반영돼요. 메뉴 방향은 유지하되, 전달 강도와 마무리의 밀도를 더 편안하게 조정하는 기준으로 쓰입니다.`;
  }

  return `다음 예약인 ${nextReservation.restaurant} ${nextReservation.course}에는 이 신호가 셰프 메모에 함께 전달돼요. 메뉴 방향은 유지하되, 전달 강도와 풍미의 밀도를 더 부드럽게 조정하는 기준으로 반영됩니다.`;
}

function buildHistoryDuration(reservation: ReservationRecord) {
  if (reservation.course.includes("디너")) {
    return "1시간 50분";
  }

  if (reservation.course.includes("런치")) {
    return "1시간 20분";
  }

  if (reservation.status === "completed") {
    return "1시간 40분";
  }

  return "예상 1시간 30분";
}

function mapAdjustmentDirectionToChange(direction: string, index: number) {
  const normalized = direction.trim();

  if (normalized.includes("정리")) {
    return `${-1 * Math.max(4, 8 - index * 2)}%`;
  }

  if (normalized.includes("살리")) {
    return `+${Math.max(5, 10 - index * 2)}%`;
  }

  return index === 0 ? "+8%" : "+5%";
}

function buildHistoryAdjustments(reservation: ReservationRecord) {
  if (reservation.adjustments.length > 0) {
    return reservation.adjustments.slice(0, 3).map((adjustment, index) => ({
      taste: adjustment.taste,
      change: mapAdjustmentDirectionToChange(adjustment.direction, index),
    }));
  }

  return [{ taste: "감칠맛", change: "+6%" }];
}

function buildHistoryFeedbackLabel(
  reservation: ReservationRecord,
  draft: DiningFeedbackDraft | undefined,
) {
  if (reservation.status === "completed") {
    return draft ? "피드백 보기" : "피드백 작성하기";
  }

  if (reservation.status === "ready" || reservation.status === "preparing") {
    return "다이닝 준비 중";
  }

  return "예약 예정";
}

function buildHistorySelectedIntensity(rating: number) {
  if (rating >= 5) {
    return "매우 만족했어요";
  }

  if (rating >= 4) {
    return "적당했어요";
  }

  if (rating >= 3) {
    return "조금 아쉬웠어요";
  }

  if (rating >= 1) {
    return "다시 조정이 필요해요";
  }

  return null;
}

function buildHistoryLikedTastes(
  reservation: ReservationRecord,
  draft: DiningFeedbackDraft | undefined,
) {
  if (!draft || draft.overallRating < 4) {
    return [];
  }

  return reservation.adjustments
    .filter((adjustment) => adjustment.direction.includes("살리"))
    .map((adjustment) => adjustment.taste);
}

function buildHistoryNeededAdjustments(
  reservation: ReservationRecord,
  draft: DiningFeedbackDraft | undefined,
) {
  if (!draft) {
    return reservation.adjustments
      .filter((adjustment) => adjustment.direction.includes("정리"))
      .map((adjustment) => adjustment.taste);
  }

  if (draft.overallRating <= 3) {
    return reservation.adjustments.map((adjustment) => adjustment.taste).slice(0, 2);
  }

  return reservation.adjustments
    .filter((adjustment) => adjustment.direction.includes("정리"))
    .map((adjustment) => adjustment.taste);
}

function buildHistoryAdjustmentDetail(
  reservation: ReservationRecord,
  adjustments: HomeAdjustmentHistoryItem["adjustments"],
  draft: DiningFeedbackDraft | undefined,
): HomeAdjustmentHistoryItem["adjustmentDetail"] {
  const summary = adjustments.map((adjustment) => ({
    taste: adjustment.taste,
    value: Number.parseInt(adjustment.change.replace("%", ""), 10) || 0,
    label: adjustment.taste,
  }));
  const firstPositive = summary.find((item) => item.value > 0) ?? summary[0] ?? {
    taste: "감칠맛",
    value: 6,
    label: "감칠맛",
  };
  const firstNegative = summary.find((item) => item.value < 0) ?? null;
  const minusTarget = firstNegative?.label ?? "직접적인 자극";
  const plusTarget = firstPositive.label;
  const quote = draft?.overallComment?.trim()
    ? `"${draft.overallComment.trim()}"`
    : reservation.status === "completed"
      ? reservation.guestUnderstanding
      : reservation.diningPromise;

  return {
    method: {
      minus: {
        name: firstNegative ? `${minusTarget} 전달 강도` : "첫 인상 자극",
        desc: firstNegative
          ? `${minusTarget}가 먼저 튀지 않도록 시작 강도를 한 단계 정리했어요.`
          : "첫 인상이 과하게 밀려오지 않도록 전체 밸런스를 한 단계 부드럽게 정리했어요.",
        icon: "📉",
      },
      plus: {
        name: `${plusTarget} 여운`,
        desc: `${plusTarget}의 존재감이 자연스럽게 남도록 밀도와 피니시를 보강했어요.`,
        icon: "📈",
      },
    },
    summary,
    quote,
    evaluation: reservation.status === "completed"
      ? {
          question: `이번 ${reservation.course} 조정이 전체 밸런스에 어떻게 느껴졌나요?`,
          options: {
            positive: "의도와 잘 맞았어요",
            negative1: "조금 과했어요",
            negative2: "보정이 더 필요해요",
          },
        }
      : {
          question: `다음 ${reservation.course}에서 이런 조정 방향이 기대되시나요?`,
          options: {
            positive: "기대돼요",
            negative1: "조금 더 가볍게",
            negative2: "조금 더 선명하게",
          },
        },
  };
}

function buildHomeAdjustmentHistory(
  reservations: ReservationRecord[],
  feedbackByReservationId: Record<number, DiningFeedbackDraft>,
) {
  return [...reservations]
    .map<HomeAdjustmentHistoryItem>((reservation, index) => {
      const draft = feedbackByReservationId[reservation.id];
      const adjustments = buildHistoryAdjustments(reservation);

      return {
        id: reservation.id,
        menu: reservation.course,
        chefName: reservation.chef,
        restaurant: reservation.restaurant,
        date: reservation.date,
        time: reservation.time,
        duration: buildHistoryDuration(reservation),
        image: reservation.chefImage ?? getChefImageByName(reservation.chef),
        satisfaction: reservation.status === "completed" ? draft?.overallRating ?? 0 : 0,
        color: getTasteBg(adjustments[0]?.taste ?? "감칠맛"),
        adjustments,
        feedbackLabel: buildHistoryFeedbackLabel(reservation, draft),
        badgeColor: getTasteColor(adjustments[0]?.taste ?? "감칠맛"),
        isExpanded: false,
        selectedIntensity: buildHistorySelectedIntensity(draft?.overallRating ?? 0),
        likedTastes: buildHistoryLikedTastes(reservation, draft),
        neededAdjustments: buildHistoryNeededAdjustments(reservation, draft),
        adjustmentDetail: buildHistoryAdjustmentDetail(reservation, adjustments, draft),
      };
    })
    .sort((left, right) => getHistoryTimestampValue(right) - getHistoryTimestampValue(left));
}

function buildContentHistoryDate(index: number) {
  const baseDate = new Date("2026-03-29T12:00:00+09:00");
  baseDate.setDate(baseDate.getDate() - index);
  const year = baseDate.getFullYear();
  const month = `${baseDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${baseDate.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function buildContentHistoryAdjustments(dish: RestaurantContentDish) {
  return Object.entries(dish.tasteVector)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tasteId, value]) => ({
      taste: TASTE_TOKENS[tasteId as TasteId].label,
      change: `+${Math.max(4, Math.round(value * 18))}%`,
    }));
}

function buildContentHistoryDetail(
  dish: RestaurantContentDish,
  adjustments: HomeAdjustmentHistoryItem["adjustments"],
): HomeAdjustmentHistoryItem["adjustmentDetail"] {
  const summary = adjustments.map((adjustment) => ({
    taste: adjustment.taste,
    value: Number.parseInt(adjustment.change.replace("%", ""), 10) || 0,
    label: adjustment.taste,
  }));
  const leadIngredients = dish.ingredients.slice(0, 3).join(", ");

  return {
    method: {
      minus: {
        name: "직접적인 자극",
        desc: `${dish.courseLabel} 코스의 결을 해치지 않으면서 첫 인상을 한 단계 정리하는 방향을 기준으로 봤어요.`,
        icon: "📉",
      },
      plus: {
        name: `${adjustments[0]?.taste ?? "감칠맛"} 전달`,
        desc: `${dish.title}처럼 ${adjustments[0]?.taste ?? "감칠맛"} 축이 또렷한 메뉴는 현재 프로필에서 더 선명하게 읽힐 가능성이 있어요.`,
        icon: "📈",
      },
    },
    summary,
    quote: leadIngredients
      ? `"주재료 ${leadIngredients} 구성이 현재 반응 축과 비교적 잘 맞는 실제 메뉴 후보예요."`
      : `"${dish.restaurant}의 ${dish.title}은 현재 프로필에서 주목해볼 실제 메뉴 후보예요."`,
    evaluation: {
      question: `${dish.restaurant}의 ${dish.title}을 다음 추천 후보로 보고 싶으신가요?`,
      options: {
        positive: "추천 후보로 좋아요",
        negative1: "조금 더 가볍게",
        negative2: "조금 더 선명하게",
      },
    },
  };
}

function selectDiverseContentDishes(
  dishes: RestaurantContentDish[],
  limit: number,
) {
  const ranked = dishes.slice().sort((left, right) => {
    const confidenceDelta = right.confidence - left.confidence;

    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.restaurant.localeCompare(right.restaurant, "ko");
  });
  const selected: RestaurantContentDish[] = [];
  const seenRestaurants = new Set<string>();

  for (const dish of ranked) {
    if (seenRestaurants.has(dish.restaurant)) {
      continue;
    }

    seenRestaurants.add(dish.restaurant);
    selected.push(dish);

    if (selected.length === limit) {
      return selected;
    }
  }

  for (const dish of ranked) {
    if (selected.some((item) => item.id === dish.id)) {
      continue;
    }

    selected.push(dish);

    if (selected.length === limit) {
      break;
    }
  }

  return selected;
}

function buildHomeAdjustmentHistoryFromContent(dishes: RestaurantContentDish[]) {
  return selectDiverseContentDishes(dishes, 5)
    .map<HomeAdjustmentHistoryItem>((dish, index) => {
      const adjustments = buildContentHistoryAdjustments(dish);

      return {
        id: 9000 + index,
        menu: dish.title,
        chefName: dish.chef,
        restaurant: dish.restaurant,
        date: buildContentHistoryDate(index),
        time: `${dish.courseLabel} 코스`,
        duration: dish.seasonLabel ?? "실제 메뉴 데이터",
        image: getChefImageByName(dish.chef),
        satisfaction: 0,
        color: getTasteBg(adjustments[0]?.taste ?? "감칠맛"),
        adjustments,
        feedbackLabel: "실제 메뉴 데이터",
        badgeColor: getTasteColor(adjustments[0]?.taste ?? "감칠맛"),
        isExpanded: false,
        selectedIntensity: null,
        likedTastes: dish.ingredients.slice(0, 2),
        neededAdjustments: [],
        adjustmentDetail: buildContentHistoryDetail(dish, adjustments),
      };
    });
}

function mergeHomeAdjustmentHistory(
  reservationHistory: HomeAdjustmentHistoryItem[],
  contentHistory: HomeAdjustmentHistoryItem[],
) {
  if (contentHistory.length === 0) {
    return reservationHistory;
  }

  const merged: HomeAdjustmentHistoryItem[] = [];
  const seenKeys = new Set<string>();
  const pushIfNeeded = (item: HomeAdjustmentHistoryItem | undefined) => {
    if (!item) {
      return;
    }

    const key = `${item.restaurant}:${item.menu}`;
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    merged.push(item);
  };

  const maxLength = Math.max(reservationHistory.length, contentHistory.length);

  for (let index = 0; index < maxLength; index += 1) {
    pushIfNeeded(reservationHistory[index]);
    pushIfNeeded(contentHistory[index]);
  }

  return merged;
}

function formatSignedPercent(value: number) {
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

function getHomeCardSummaryDetails(details: HomeTrendDetail[]) {
  const detailsWithValue = details.map((detail) => ({
    detail,
    numericChange: parseTasteChangeValue(detail.change),
  }));

  const highestIncrease =
    detailsWithValue
      .filter((item) => item.numericChange > 0)
      .sort((left, right) => right.numericChange - left.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => right.numericChange - left.numericChange)[0];

  const biggestDecrease =
    detailsWithValue
      .filter((item) => item.numericChange < 0)
      .sort((left, right) => left.numericChange - right.numericChange)[0] ??
    [...detailsWithValue].sort((left, right) => left.numericChange - right.numericChange)[0];

  const summaryDetails: HomeTrendDetail[] = [];

  if (highestIncrease?.detail) {
    summaryDetails.push(highestIncrease.detail);
  }

  if (
    biggestDecrease?.detail &&
    biggestDecrease.detail.detailLabel !== highestIncrease?.detail?.detailLabel
  ) {
    summaryDetails.push(biggestDecrease.detail);
  }

  return summaryDetails;
}

function getHomeKeywordTasteLabel(keyword: string) {
  return TASTE_IDS
    .map((tasteId) => TASTE_TOKENS[tasteId].label)
    .find((label) => keyword.startsWith(label));
}

function HomeKeywordChip({ keyword }: { keyword: string }) {
  const tasteLabel = getHomeKeywordTasteLabel(keyword);

  if (!tasteLabel) {
    return <TasteChip taste={keyword} tone="neutral" />;
  }

  const value = keyword.slice(tasteLabel.length).trim();

  return <TasteChip taste={tasteLabel} value={value || undefined} />;
}

function buildHomeCardCircleGradient(details: HomeTrendDetail[]) {
  return buildTasteAdjustmentGradient(
    details.map((detail) => ({
      taste: detail.parentTaste,
      change: detail.change,
    })),
    { direction: "to bottom", useTint: false },
  );
}

function formatHomeShortDate(dateIso: string) {
  const date = new Date(dateIso);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${month}.${day}`;
}

function getTastePercentDelta(snapshot: TasteMeasurementSnapshot, tasteId: TasteId) {
  const average = TASTE_MEASUREMENT_AVERAGES[tasteId];
  const value = snapshot.results[tasteId] ?? average;

  if (average === 0) {
    return 0;
  }

  return Number((((value - average) / average) * 100).toFixed(1));
}

function mergeMeasurementSnapshots(
  snapshots: TasteMeasurementSnapshot[],
  latestSnapshot: TasteMeasurementSnapshot | null,
) {
  const mergedSnapshots = new Map<string, TasteMeasurementSnapshot>();

  snapshots.forEach((snapshot) => {
    mergedSnapshots.set(snapshot.measuredAt, snapshot);
  });

  if (latestSnapshot) {
    mergedSnapshots.set(latestSnapshot.measuredAt, latestSnapshot);
  }

  return [...mergedSnapshots.values()].sort(
    (left, right) =>
      new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
  );
}

function buildMeasurementSeriesFromSnapshots(
  snapshots: TasteMeasurementSnapshot[],
): HomeMeasurementSeriesPoint[] {
  if (snapshots.length === 0) {
    return HOME_TASTE_PROFILE_WEEKLY_SERIES.map((item) => ({ ...item }));
  }

  const sortedSnapshots = [...snapshots].sort(
    (left, right) =>
      new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
  );

  return sortedSnapshots.map((snapshot) => {
    const point: HomeMeasurementSeriesPoint = {
      label: formatHomeShortDate(snapshot.measuredAt),
    };

    TASTE_IDS.forEach((tasteId) => {
      point[TASTE_TOKENS[tasteId].label] = getTastePercentDelta(snapshot, tasteId);
    });

    return point;
  });
}

function buildMeasurementOverviewValues(
  snapshots: TasteMeasurementSnapshot[],
): HomeMeasurementOverviewValue[] {
  const latestSnapshot = snapshots[snapshots.length - 1];

  if (!latestSnapshot) {
    return HOME_TASTE_PROFILE_OVERVIEW_VALUES.map((item) => ({ ...item }));
  }

  return TASTE_IDS.map((tasteId) => ({
    taste: TASTE_TOKENS[tasteId].label,
    change: getTastePercentDelta(latestSnapshot, tasteId),
  }));
}

function buildMeasurementTrendDetail(
  tasteId: TasteId,
  series: HomeMeasurementSeriesPoint[],
  numericChange: number,
): HomeTrendDetail {
  const label = TASTE_TOKENS[tasteId].label;
  const hasTrendHistory = series.length > 1;

  return {
    detailLabel: label,
    parentTaste: label,
    trend: numericChange >= 0 ? "increase" : "decrease",
    change: formatSignedPercent(numericChange),
    history: series
      .slice(0, -1)
      .map((point) => formatSignedPercent(Number(point[label] ?? 0))),
    cue:
      hasTrendHistory
        ? numericChange >= 0
          ? `${label} 반응이 평균보다 더 빠르고 또렷하게 올라왔어요. 같은 강도에서도 ${label} 인상이 앞쪽으로 느껴질 수 있어요.`
          : `${label} 반응이 평균보다 더 둔하게 내려와요. 깊이나 밀도를 살짝 더 보강할 때 만족이 높아질 가능성이 있어요.`
        : numericChange >= 0
          ? `${label} 반응이 평균보다 더 빠르고 또렷하게 나타났어요. 아직 첫 측정이라 추세보다 현재 기준값으로 이해하면 좋아요.`
          : `${label} 반응이 평균보다 더 부드럽게 나타났어요. 아직 첫 측정이라 추세보다 현재 기준값으로 보는 단계예요.`,
  };
}

export function buildHomeTasteProfileFromMeasurements(
  snapshots: TasteMeasurementSnapshot[],
): {
  cardData: HomeTasteProfileCardData;
  overviewValues: HomeMeasurementOverviewValue[];
  series: HomeMeasurementSeriesPoint[];
} {
  if (snapshots.length === 0) {
    return {
      cardData: cloneHomeTasteProfileCardData(HOME_TASTE_PROFILE_CARD),
      overviewValues: HOME_TASTE_PROFILE_OVERVIEW_VALUES.map((item) => ({ ...item })),
      series: HOME_TASTE_PROFILE_WEEKLY_SERIES.map((item) => ({ ...item })),
    };
  }

  const latestSnapshot = snapshots[snapshots.length - 1];
  const series = buildMeasurementSeriesFromSnapshots(snapshots);
  const overviewValues = buildMeasurementOverviewValues(snapshots);
  const sortedValues = [...overviewValues].sort((left, right) => right.change - left.change);
  const strongestIncrease = sortedValues[0] ?? overviewValues[0];
  const strongestDecrease =
    [...overviewValues].sort((left, right) => left.change - right.change)[0] ??
    overviewValues[overviewValues.length - 1];
  const increaseTasteId =
    TASTE_IDS.find((tasteId) => TASTE_TOKENS[tasteId].label === strongestIncrease?.taste) ??
    "sweet";
  const decreaseTasteId =
    TASTE_IDS.find((tasteId) => TASTE_TOKENS[tasteId].label === strongestDecrease?.taste) ??
    "umami";
  const details = [
    buildMeasurementTrendDetail(increaseTasteId, series, strongestIncrease?.change ?? 0),
    buildMeasurementTrendDetail(decreaseTasteId, series, strongestDecrease?.change ?? 0),
  ].filter((detail, index, array) =>
    array.findIndex((candidate) => candidate.detailLabel === detail.detailLabel) === index,
  );
  const latestMeasurementAgeLabel = getTasteMeasurementAgeLabel(latestSnapshot);
  const isFirstMeasurement = snapshots.length === 1;

  return {
    cardData: {
      title: isFirstMeasurement
        ? `이번 측정에서 ${strongestIncrease?.taste ?? "단맛"}은 또렷하고 ${strongestDecrease?.taste ?? "감칠맛"}은 부드럽게 느껴졌어요`
        : `${strongestIncrease?.taste ?? "단맛"}은 또렷해지고 ${strongestDecrease?.taste ?? "감칠맛"}은 둔해졌어요`,
      periodLabel:
        snapshots.length > 1
          ? `${formatHomeShortDate(snapshots[0].measuredAt)}-${formatHomeShortDate(latestSnapshot.measuredAt)}`
          : latestMeasurementAgeLabel,
      summary: isFirstMeasurement
        ? `${latestMeasurementAgeLabel} 기준 첫 측정이에요. ${strongestIncrease?.taste ?? "단맛"}은 평균보다 더 또렷하게 느껴지고, ${strongestDecrease?.taste ?? "감칠맛"}은 더 부드럽게 받아들이는 편으로 확인됐어요. 아직 이전 측정과의 추세는 없어서 이번 값을 현재 기준선으로 저장했어요.`
        : `${latestMeasurementAgeLabel} 기준으로 ${strongestIncrease?.taste ?? "단맛"}은 평균보다 빠르게 느껴지고, ${strongestDecrease?.taste ?? "감칠맛"}은 같은 강도에서도 인상이 덜 또렷해졌어요. 지금 변화는 취향이 바뀌었다기보다 최근 컨디션과 누적 반응의 차이에 가까워요.`,
      serviceHint: isFirstMeasurement
        ? `다음 추천과 셰프 메모에는 이번 측정 기준으로 ${strongestIncrease?.taste ?? "단맛"} 자극은 과하게 올리지 않고, ${strongestDecrease?.taste ?? "감칠맛"}은 밀도와 마무리를 부드럽게 맞추는 방향으로 반영됩니다.`
        : `다음 추천과 셰프 메모에는 ${strongestIncrease?.taste ?? "단맛"} 자극은 과하게 올리지 않고, ${strongestDecrease?.taste ?? "감칠맛"}은 깊이보다 잔향과 밀도를 보강하는 방향으로 반영됩니다.`,
      keywords: [
        ...(isFirstMeasurement ? ["첫 측정"] : []),
        `${strongestIncrease?.taste ?? "단맛"} 반응`,
        `${strongestDecrease?.taste ?? "감칠맛"} 밀도`,
        latestMeasurementAgeLabel,
      ],
      details,
    },
    overviewValues,
    series,
  };
}

function buildSpecialNoteDetailHistory(
  reservations: ReservationRecord[],
  taste: string,
  preferredDirection: "increase" | "decrease",
) {
  const values = reservations.map((reservation) => {
    const adjustment = reservation.adjustments.find((item) => item.taste === taste);

    if (!adjustment) {
      return 0;
    }

    const magnitude = reservation.status === "completed" ? 8 : 5;

    if (adjustment.direction.includes("정리")) {
      return preferredDirection === "decrease" ? -magnitude : magnitude * 0.4;
    }

    return preferredDirection === "increase" ? magnitude : -magnitude * 0.4;
  });

  return values.length === 0 ? ["0.0%"] : values.map((value) => formatSignedPercent(value));
}

export function buildHomeSpecialNoteFromReservations(
  reservations: ReservationRecord[],
  feedbackByReservationId: Record<number, DiningFeedbackDraft>,
  reservationHint: string,
) {
  if (reservations.length === 0) {
    return cloneHomeSpecialNoteCardData(HOME_SPECIAL_NOTE_CARD);
  }

  const sortedReservations = [...reservations].sort(
    (left, right) => getHistoryTimestampValue(left) - getHistoryTimestampValue(right),
  );
  const completedReservations = sortedReservations.filter(
    (reservation) => reservation.status === "completed",
  );
  const adjustmentWeights = new Map<string, number>();
  const adjustmentDirections = new Map<string, number>();

  sortedReservations.forEach((reservation) => {
    const draft = feedbackByReservationId[reservation.id];
    const reservationWeight = draft ? (draft.overallRating <= 3 ? 1.35 : 1.1) : 1;

    reservation.adjustments.forEach((adjustment) => {
      adjustmentWeights.set(
        adjustment.taste,
        (adjustmentWeights.get(adjustment.taste) ?? 0) + reservationWeight,
      );
      adjustmentDirections.set(
        adjustment.taste,
        (adjustmentDirections.get(adjustment.taste) ?? 0) +
          (adjustment.direction.includes("정리") ? -1 : 1) * reservationWeight,
      );
    });
  });

  const topAdjustmentTastes =
    [...adjustmentWeights.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 2)
      .map(([taste]) => taste) || [];
  const primaryTaste = topAdjustmentTastes[0] ?? "감칠맛";
  const secondaryTaste = topAdjustmentTastes[1] ?? "지방맛";
  const primaryDirection =
    (adjustmentDirections.get(primaryTaste) ?? 0) >= 0 ? "increase" : "decrease";
  const secondaryDirection =
    (adjustmentDirections.get(secondaryTaste) ?? 0) >= 0 ? "increase" : "decrease";
  const primaryStrength = Math.max(4.5, (adjustmentWeights.get(primaryTaste) ?? 1) * 2.4);
  const secondaryStrength = Math.max(3.2, (adjustmentWeights.get(secondaryTaste) ?? 1) * 1.8);
  const hasNextReservation = sortedReservations.some(
    (reservation) => reservation.status !== "completed",
  );

  return {
    confidenceLabel: `반복 관찰 ${Math.max(completedReservations.length, 1)}회`,
    confidenceNote:
      completedReservations.length > 0
        ? "완료한 다이닝의 피드백과 예약별 조정 방향에서 비슷한 포인트가 반복됐어요."
        : "아직 완료한 다이닝은 적지만, 예약별 조정 방향에서 같은 미각 포인트가 반복되고 있어요.",
    details: [
      {
        detailLabel: primaryTaste,
        detailTypeLabel: "반복 조정 포인트",
        parentTaste: primaryTaste,
        trend: primaryDirection,
        change: formatSignedPercent(
          primaryDirection === "increase" ? primaryStrength : primaryStrength * -1,
        ),
        history: buildSpecialNoteDetailHistory(
          sortedReservations.slice(-6),
          primaryTaste,
          primaryDirection,
        ),
        cue:
          primaryDirection === "increase"
            ? `${primaryTaste} 축은 여러 예약에서 반복적으로 살리기 방향이 잡혔어요. 사용자는 이 포인트가 살아 있을 때 코스의 만족도가 더 높아질 가능성이 있어요.`
            : `${primaryTaste} 축은 여러 예약에서 반복적으로 정리하기 방향이 잡혔어요. 이 포인트가 먼저 과해지면 전체 밸런스가 무거워질 수 있어요.`,
      },
      {
        detailLabel: secondaryTaste,
        detailTypeLabel: "마무리 조정 포인트",
        parentTaste: secondaryTaste,
        trend: secondaryDirection,
        change: formatSignedPercent(
          secondaryDirection === "increase" ? secondaryStrength : secondaryStrength * -1,
        ),
        history: buildSpecialNoteDetailHistory(
          sortedReservations.slice(-6),
          secondaryTaste,
          secondaryDirection,
        ),
        cue:
          secondaryDirection === "increase"
            ? `${secondaryTaste} 포인트는 후반 인상을 조금 더 살려주는 편이 안정적이에요. 같은 코스라도 마무리 밀도를 보강하면 만족이 높아질 수 있어요.`
            : `${secondaryTaste} 포인트는 후반으로 갈수록 정리감이 중요해졌어요. 강도보다 피니시를 다듬는 쪽이 더 자연스럽게 맞을 가능성이 커요.`,
      },
    ],
    guidance: [
      `${primaryTaste}은 시작부터 과하게 밀기보다 코스 중후반에 자연스럽게 드러나게 해주세요.`,
      `${secondaryTaste}은 전체 볼륨보다 피니시와 잔향의 정돈감을 먼저 맞추는 편이 좋아요.`,
    ],
    keywords: [`${primaryTaste} 조정`, `${secondaryTaste} 마무리`, `${sortedReservations.length}회 예약`],
    periodLabel:
      sortedReservations.length > 1
        ? `${sortedReservations[0]?.date.slice(5)}-${sortedReservations[sortedReservations.length - 1]?.date.slice(5)}`
        : `${sortedReservations.length}회 예약`,
    reservationHint,
    serviceHint: `이 신호는 셰프의 의도를 바꾸기보다, ${primaryTaste}과 ${secondaryTaste} 전달이 더 편안하게 느껴지도록 조정 기준을 제공하는 데 쓰여요.`,
    summary: `최근 예약과 피드백에서는 ${primaryTaste}과 ${secondaryTaste}이 반복적으로 조정 포인트로 나타났어요. 다음 예약 personalisation에는 이 두 축의 전달 강도와 마무리 밀도가 함께 반영됩니다.`,
    title: `${primaryTaste}과 ${secondaryTaste} 전달이 자주 흔들려요`,
    translationStatusLabel: hasNextReservation ? "다음 예약 반영 중" : "다음 추천 반영 중",
  } satisfies HomeSpecialNoteCardData;
}

export function getLegacyHomeCardArchiveData() {
  const reservationHint = buildHomeReservationHint(RESERVATION_CATALOG);
  const tasteProfile = buildHomeTasteProfileFromMeasurements([]);

  return {
    adjustmentHistoryData: buildHomeAdjustmentHistory(RESERVATION_CATALOG, {}),
    featuredChefs: buildHomeChefCardsFromReservations(RESERVATION_CATALOG),
    reservationHint,
    specialNoteCard: buildHomeSpecialNoteFromReservations(
      RESERVATION_CATALOG,
      {},
      reservationHint,
    ),
    tasteProfileCard: tasteProfile.cardData,
    tasteProfileOverviewValues: tasteProfile.overviewValues,
    tasteProfileSeries: tasteProfile.series,
  };
}

function ChefCard({
  chef,
  hoverShadow = true,
  hoverMotion = true,
}: {
  chef: HomeChefCardData;
  hoverShadow?: boolean;
  hoverMotion?: boolean;
}) {
  const chefTintBackgroundColor = getTasteTintSurface(chef.taste);
  const chefNameColor = getTasteTintSurfaceText(chef.taste);
  const chefMetaColor = getTasteTintSurfaceSubText(chef.taste);
  const chefMatchColor = getTasteTintSurfaceText(chef.taste);

  return (
    <div
      className={`box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 w-[132px] h-[132px] cursor-pointer ${
        hoverMotion ? 'transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]' : ''
      } ${
        hoverShadow ? 'hover:shadow-[var(--tb-shadow-strong)]' : ''
      }`}
      style={{
        backgroundColor: chefTintBackgroundColor,
        border: `1px solid ${getTasteTint(chef.taste, 0.18)}`,
      }}
    >
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full h-full">
        <ChefAvatar
          alt={chef.name}
          className="relative shrink-0 size-[48px] rounded-[8px]"
          iconSize={ICON_TOKENS.size.xl}
          imageSrc={chef.image}
          taste={chef.taste}
        />

        <div className="content-stretch flex flex-col justify-between items-start leading-[normal] relative shrink-0 w-full grow">
          <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
            <p
              className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[14px] w-full truncate"
              style={{ color: chefNameColor }}
            >
              {chef.name}
            </p>
            <p
              className="font-['Pretendard_Variable:Regular',sans-serif] font-normal text-[10px] w-full truncate"
              style={{ color: chefMetaColor }}
            >
              {chef.restaurant}
            </p>
          </div>
          <p
            className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[10px]"
            style={{ color: chefMatchColor }}
          >
            매칭률 {chef.match}%
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyChefCard({ index }: { index: number }) {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 w-[132px] h-[132px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)]"
      aria-hidden="true"
    >
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full h-full">
        <div className="relative rounded-[8px] shrink-0 size-[48px] overflow-hidden bg-[var(--tb-color-bg-page)] border border-[var(--tb-color-border-subtle)]" />

        <div className="content-stretch flex flex-col justify-between items-start leading-[normal] relative shrink-0 w-full grow">
          <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
            <div
              className="h-[14px] rounded-full bg-[var(--tb-color-border-subtle)]"
              style={{ width: index === 1 ? '68px' : '74px' }}
            />
            <div
              className="h-[10px] rounded-full bg-[var(--tb-color-border-disabled)]"
              style={{ width: index === 2 ? '82px' : '76px' }}
            />
          </div>
          <div className="h-[10px] rounded-full bg-[var(--tb-color-border-disabled)] w-[56px]" />
        </div>
      </div>
    </div>
  );
}

function Content5({ featuredChefs }: { featuredChefs: HomeChefCardData[] }) {
  if (featuredChefs.length === 0) {
    return (
      <div className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-3 items-start relative shrink-0 w-[calc(100%+40px)] mx-[-20px] px-[20px] overflow-x-auto pt-2 pb-1 no-scrollbar">
          {[0, 1, 2].map((index) => (
            <EmptyChefCard key={index} index={index} />
          ))}
        </div>

        <div className="w-full rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] px-[16px] py-[14px]">
          <p className="text-[15px] font-bold text-[var(--tb-color-text-primary)]">셰프 매칭 대기중</p>
          <p className="mt-[6px] text-[13px] leading-[1.5] text-[var(--tb-color-text-muted)]">
            레스토랑 콘텐츠와 예약 데이터가 더 쌓이면 현재 프로필에 맞는 셰프 카드가 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-stretch flex gap-3 items-start relative shrink-0 w-[calc(100%+40px)] mx-[-20px] px-[20px] overflow-x-auto pt-2 pb-4 no-scrollbar" data-name="Content">
      {featuredChefs.map((chef, index) => (
        <ChefCard key={index} chef={chef} />
      ))}
    </div>
  );
}

function ChefList({ featuredChefs }: { featuredChefs: HomeChefCardData[] }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Chef List">
      <Heading1 />
      <Content5 featuredChefs={featuredChefs} />
    </div>
  );
}

function Section({ featuredChefs }: { featuredChefs: HomeChefCardData[] }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          <ChefList featuredChefs={featuredChefs} />
        </div>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="flex justify-between items-start w-full" data-name="Heading">
      <span className="text-[18px] font-bold text-[var(--tb-color-text-primary)] tracking-[-0.24px]">미각 프로필</span>
      <button type="button" className="flex items-center gap-1 cursor-pointer">
        <span className="text-[12px] text-[var(--tb-color-text-hint)]">현재 기준</span>
        <ChevronDown className="w-3 h-3 text-[var(--tb-color-text-secondary)]" />
      </button>
    </div>
  );
}

function TasteCircle({ details }: { details: HomeTrendDetail[] }) {
  return (
    <div
      className="relative shrink-0 size-[16px] rounded-full"
      data-name="Taste Circle"
      style={{ background: buildHomeCardCircleGradient(details) }}
    />
  );
}

function Head({ details }: { details: HomeTrendDetail[] }) {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle details={details} />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px] text-nowrap whitespace-pre">미각변화</p>
    </div>
  );
}

function Heading4({
  details,
  periodLabel,
}: {
  details: HomeTrendDetail[];
  periodLabel: string;
}) {
  return (
    <div className="flex gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head details={details} />
      <CardDetailLabel label={periodLabel} />
    </div>
  );
}

function TasteChangeMiniGraph({ details }: { details: HomeTrendDetail[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(128);
  const graphEntries = getHomeCardSummaryDetails(details).map((detail) => ({
    ...detail,
    graphValues: [...detail.history, detail.change].map((value) => parseTasteChangeValue(value)),
  }));
  const currentDotRadius = 6;
  const historyDotRadius = 2;
  const tintedLineWidth = 12;
  const maxPointGap = 36;
  const graphHeight = 24;
  const graphInsetX = 6;
  const lineStartWhiteMix = 0.6;

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = (nextWidth: number) => {
      setAvailableWidth((previousWidth) => {
        const roundedWidth = Math.max(0, Math.round(nextWidth));
        return previousWidth === roundedWidth ? previousWidth : roundedWidth;
      });
    };

    updateWidth(node.clientWidth);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      updateWidth(entry.contentRect.width);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className="content-stretch flex w-full flex-col gap-[4px] shrink-0"
      data-name="Taste Change Graph"
    >
      {graphEntries.map((entry, index) => {
        const fillColor = getTasteColor(entry.parentTaste);
        const trackColor = getTasteTint(entry.parentTaste, 0.18);
        const lineStartColor = mixHexColors(fillColor, '#FFFFFF', lineStartWhiteMix);
        const maxVisiblePoints = Math.max(
          2,
          Math.floor(Math.max(availableWidth - graphInsetX * 2, 0) / maxPointGap) + 1,
        );
        const visibleValues = entry.graphValues.slice(-maxVisiblePoints);
        const graphWidth =
          graphInsetX * 2 + Math.max(visibleValues.length - 1, 0) * maxPointGap;
        const values = visibleValues;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const xStep = maxPointGap;
        const gradientId = `taste-change-graph-gradient-${index}`;
        const points = values.map((value, pointIndex) => {
          const normalized =
            maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);

          return {
            x: Math.round(graphInsetX + xStep * pointIndex),
            y: Math.round(18 - normalized * 10),
          };
        });
        const graphPath = buildSpecialNoteTrendPath(points);
        const currentPoint =
          points[points.length - 1] ?? { x: graphWidth - graphInsetX, y: graphHeight / 2 };

        return (
          <div key={entry.detailLabel} className="flex h-[24px] w-full items-center justify-end">
            <div className="relative h-[24px]" style={{ width: `${graphWidth}px` }}>
              <svg className="absolute inset-0 size-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                <defs>
                  <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2={graphWidth} y1="0" y2="0">
                    <stop offset="0%" stopColor={lineStartColor} />
                    <stop offset="100%" stopColor={fillColor} />
                  </linearGradient>
                </defs>
                <path
                  d={graphPath}
                  fill="none"
                  stroke={trackColor}
                  strokeLinecap="round"
                  strokeWidth={tintedLineWidth}
                />
                <path
                  d={graphPath}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              {points.slice(0, -1).map((point, historyIndex) => {
                const progress =
                  graphWidth <= graphInsetX * 2
                    ? 1
                    : Math.min(
                        1,
                        Math.max(0, (point.x - graphInsetX) / (graphWidth - graphInsetX * 2)),
                      );
                const pointColor = mixHexColors(
                  fillColor,
                  '#FFFFFF',
                  lineStartWhiteMix * (1 - progress),
                );

                return (
                  <span
                    key={`${entry.detailLabel}-history-${historyIndex}`}
                    aria-hidden="true"
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: pointColor,
                      height: `${historyDotRadius * 2}px`,
                      left: `${point.x}px`,
                      top: `${point.y}px`,
                      transform: 'translate(-50%, -50%)',
                      width: `${historyDotRadius * 2}px`,
                    }}
                  />
                );
              })}
              <span
                aria-hidden="true"
                className="absolute rounded-full"
                style={{
                  backgroundColor: fillColor,
                  height: `${currentDotRadius * 2}px`,
                  left: `${currentPoint.x}px`,
                  top: `${currentPoint.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${currentDotRadius * 2}px`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Cards3({
  cardData,
  onOpenDetail,
}: {
  cardData: HomeTasteProfileCardData;
  onOpenDetail: () => void;
}) {
  const summaryDetails = getHomeCardSummaryDetails(cardData.details);

  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="bg-white h-auto relative rounded-[20px] shrink-0 w-full text-left cursor-pointer"
      data-name="Cards"
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <Heading4 details={cardData.details} periodLabel={cardData.periodLabel} />

          <div className="box-border content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[var(--tb-color-text-primary)] text-[16px] w-full">
                {cardData.title}
              </p>
            </div>

            <div className="content-stretch flex gap-[24px] items-stretch relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                {summaryDetails.map((detail) => (
                  <div key={detail.detailLabel} className="flex items-center gap-[8px] w-full">
                    <TastePointArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <p className="truncate text-[14px] font-medium text-[var(--tb-color-text-secondary)]">
                        {detail.detailLabel}
                      </p>
                      <p
                        className="shrink-0 text-[12px] font-semibold leading-[1.1]"
                        style={{ color: getTasteColor(detail.parentTaste) }}
                      >
                        {detail.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
                <TasteChangeMiniGraph details={cardData.details} />
              </div>
            </div>

            <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
              {cardData.keywords.map((keyword) => (
                <HomeKeywordChip key={keyword} keyword={keyword} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function TasteCircle1({ details }: { details: HomeTrendDetail[] }) {
  return (
    <div
      className="relative shrink-0 size-[16px] rounded-full"
      data-name="Taste Circle"
      style={{ background: buildHomeCardCircleGradient(details) }}
    />
  );
}

function Head1({ details }: { details: HomeTrendDetail[] }) {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle1 details={details} />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px] text-nowrap whitespace-pre">특이사항</p>
    </div>
  );
}

function Heading5({
  details,
  periodLabel,
}: {
  details: HomeTrendDetail[];
  periodLabel: string;
}) {
  return (
    <div className="content-center flex flex-wrap gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head1 details={details} />
      <CardDetailLabel label={periodLabel} />
    </div>
  );
}

function SpecialNoteMiniGraph({ details }: { details: HomeTrendDetail[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(128);
  const graphEntries = getHomeCardSummaryDetails(details).map((detail) => ({
    ...detail,
    graphValues: [...detail.history, detail.change].map((value) => parseTasteChangeValue(value)),
  }));
  const currentDotRadius = 6;
  const historyDotRadius = 2;
  const tintedLineWidth = 12;
  const maxPointGap = 36;
  const graphHeight = 24;
  const graphInsetX = 6;
  const lineStartWhiteMix = 0.6;

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = (nextWidth: number) => {
      setAvailableWidth((previousWidth) => {
        const roundedWidth = Math.max(0, Math.round(nextWidth));
        return previousWidth === roundedWidth ? previousWidth : roundedWidth;
      });
    };

    updateWidth(node.clientWidth);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      updateWidth(entry.contentRect.width);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className="content-stretch flex w-full flex-col gap-[4px] shrink-0"
      data-name="Special Note Graph"
    >
      {graphEntries.map((entry, index) => {
        const fillColor = getTasteColor(entry.parentTaste);
        const trackColor = getTasteTint(entry.parentTaste, 0.18);
        const lineStartColor = mixHexColors(fillColor, '#FFFFFF', lineStartWhiteMix);
        const maxVisiblePoints = Math.max(
          2,
          Math.floor(Math.max(availableWidth - graphInsetX * 2, 0) / maxPointGap) + 1,
        );
        const visibleValues = entry.graphValues.slice(-maxVisiblePoints);
        const graphWidth =
          graphInsetX * 2 + Math.max(visibleValues.length - 1, 0) * maxPointGap;
        const values = visibleValues;
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const xStep = maxPointGap;
        const gradientId = `special-note-graph-gradient-${index}`;
        const points = values.map((value, index) => {
          const normalized =
            maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);

          return {
            x: Math.round(graphInsetX + xStep * index),
            y: Math.round(18 - normalized * 10),
          };
        });
        const graphPath = buildSpecialNoteTrendPath(points);
        const currentPoint = points[points.length - 1] ?? { x: graphWidth - graphInsetX, y: graphHeight / 2 };

        return (
          <div key={entry.detailLabel} className="flex h-[24px] w-full items-center justify-end">
            <div className="relative h-[24px]" style={{ width: `${graphWidth}px` }}>
              <svg
                className="absolute inset-0 size-full"
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              >
                <defs>
                  <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2={graphWidth} y1="0" y2="0">
                    <stop offset="0%" stopColor={lineStartColor} />
                    <stop offset="100%" stopColor={fillColor} />
                  </linearGradient>
                </defs>
                <path
                  d={graphPath}
                  fill="none"
                  stroke={trackColor}
                  strokeLinecap="round"
                  strokeWidth={tintedLineWidth}
                />
                <path
                  d={graphPath}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              {points.slice(0, -1).map((point, historyIndex) => {
                const progress =
                  graphWidth <= graphInsetX * 2
                    ? 1
                    : Math.min(
                        1,
                        Math.max(0, (point.x - graphInsetX) / (graphWidth - graphInsetX * 2)),
                      );
                const pointColor = mixHexColors(
                  fillColor,
                  '#FFFFFF',
                  lineStartWhiteMix * (1 - progress),
                );

                return (
                  <span
                    key={`${entry.detailLabel}-history-${historyIndex}`}
                    aria-hidden="true"
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: pointColor,
                      height: `${historyDotRadius * 2}px`,
                      left: `${point.x}px`,
                      top: `${point.y}px`,
                      transform: 'translate(-50%, -50%)',
                      width: `${historyDotRadius * 2}px`,
                    }}
                  />
                );
              })}
              <span
                aria-hidden="true"
                className="absolute rounded-full"
                style={{
                  backgroundColor: fillColor,
                  height: `${currentDotRadius * 2}px`,
                  left: `${currentPoint.x}px`,
                  top: `${currentPoint.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${currentDotRadius * 2}px`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpecialNoteInfo({
  item,
}: {
  item: HomeTrendDetail;
}) {
  const accentColor = getTasteColor(item.parentTaste);
  const accentTint = getTasteTint(item.parentTaste, 0.12);

  return (
    <div
      className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full rounded-[12px] bg-[var(--tb-color-surface-muted)] px-[10px] py-[10px]"
      data-name="Info"
    >
      <TastePointArrowBox parentTaste={item.parentTaste} trend={item.trend} />
      <div className="basis-0 content-stretch flex grow min-h-px min-w-px relative shrink-0">
        <div className="content-stretch flex flex-col gap-[4px] items-start relative w-full">
          <div className="flex flex-wrap items-center gap-[6px]">
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[var(--tb-color-text-secondary)]">
              {item.detailLabel} {item.trend === "increase" ? "증가" : "감소"}
            </p>
            <span
              className="inline-flex items-center rounded-full px-[6px] py-[2px] text-[10px] font-semibold"
              style={{ backgroundColor: accentTint, color: accentColor }}
            >
              {item.detailTypeLabel}
            </span>
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[10px] text-[var(--tb-color-text-subtle)]">
              {item.change}
            </p>
          </div>
          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.4] relative text-[12px] text-[var(--tb-color-text-muted)]">
            {item.cue}
          </p>
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] relative text-[10px]" style={{ color: accentColor }}>
            {item.parentTaste} 팔레트로 셰프 전달 포인트에 반영
          </p>
        </div>
      </div>
    </div>
  );
}

function SpecialNoteGuidanceList({ guidance }: { guidance: string[] }) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      {guidance.map((guidanceItem) => (
        <div
          key={guidanceItem}
          className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full rounded-[12px] bg-[var(--tb-color-surface-muted)] px-[10px] py-[10px]"
        >
          <div className="mt-[5px] size-[6px] rounded-full bg-[var(--tb-color-text-primary)]" />
          <p className="basis-0 grow min-w-0 self-stretch font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.45] relative text-[12px] text-[var(--tb-color-text-muted)] whitespace-normal break-keep text-left">
            {guidanceItem}
          </p>
        </div>
      ))}
    </div>
  );
}

function SpecialNoteFeatureBody({
  cardData,
  reservationHint,
}: {
  cardData: HomeSpecialNoteCardData;
  reservationHint: string;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Special Note Feature">
      <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
        <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
          <span className="inline-flex items-center rounded-full bg-[var(--tb-color-text-primary)] px-[8px] py-[3px] text-[10px] font-semibold text-white">
            셰프 전달 포인트
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-[8px] py-[3px] text-[10px] font-semibold text-[var(--tb-color-text-secondary)]">
            {cardData.confidenceLabel}
          </span>
        </div>
        <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[var(--tb-color-text-primary)] text-[16px] w-full">
          {cardData.title}
        </p>
        <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[12px] text-[var(--tb-color-text-muted)] w-full">
          {cardData.summary}
        </p>
        <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[12px] text-[var(--tb-color-text-subtle)] w-full">
          {cardData.confidenceNote}
        </p>
      </div>

      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
          <div className="content-stretch flex flex-wrap gap-[8px] items-center justify-between relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[var(--tb-color-text-primary)] text-[12px]">
              세부 미각 요소
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-[8px] py-[3px] text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
              {cardData.translationStatusLabel}
            </span>
          </div>
          <Info11 details={cardData.details} />
        </div>

        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
          <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[var(--tb-color-text-primary)] text-[12px]">
            예약에 어떻게 반영되나요
          </p>
          <SpecialNoteGuidanceList guidance={cardData.guidance} />
          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.45] relative min-w-0 self-stretch text-[12px] text-[var(--tb-color-text-subtle)] whitespace-normal break-keep text-left">
            {reservationHint}
          </p>
        </div>
      </div>
    </div>
  );
}

function Info11({ details }: { details: HomeTrendDetail[] }) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Info">
      {details.map((detail) => (
        <SpecialNoteInfo key={detail.detailLabel} item={detail} />
      ))}
    </div>
  );
}

function Right4({ cardData }: { cardData: HomeSpecialNoteCardData }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Right">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold h-[14px] justify-center leading-[0] relative shrink-0 text-[var(--tb-color-text-primary)] text-[16px] w-full">
        <p className="leading-[100.06%]">{cardData.title}</p>
      </div>
      <Info11 details={cardData.details} />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents right-[113px] top-[42px]">
      <div className="absolute flex h-[10px] items-center justify-center right-[118px] top-[47px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[10px] relative w-0">
            <div className="absolute inset-[-50%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 20">
                <path d="M5 15V5" id="Vector 222" stroke="var(--stroke-0, #FFCC7F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[113px] size-[10px] top-[42px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #FF9900)" id="Ellipse 203" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[118px] text-[6px] text-center text-white top-[46.5px] translate-x-[50%] translate-y-[-50%] w-[10px]">
        <p className="leading-[normal]">1</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents right-[93px] top-[22px]">
      <div className="absolute flex h-[30px] items-center justify-center right-[98px] top-[27px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[30px] relative w-0">
            <div className="absolute inset-[-16.67%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 40">
                <path d="M5 35V5" id="Vector 221" stroke="var(--stroke-0, #FFEA7F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[93px] size-[10px] top-[22px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #FFD600)" id="Ellipse 216" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[98px] size-[10px] text-[6px] text-center text-white top-[27px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents right-[33px] top-[12px]">
      <div className="absolute flex h-[40px] items-center justify-center right-[38px] top-[17px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[40px] relative w-0">
            <div className="absolute inset-[-12.5%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 50">
                <path d="M5 45V5" id="Vector 218" stroke="var(--stroke-0, #D9B8D9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[33px] size-[10px] top-[12px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #B372B4)" id="Ellipse 210" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[38px] size-[10px] text-[6px] text-center text-white top-[17px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">4</p>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents right-[13px] top-[2px]">
      <div className="absolute flex h-[50px] items-center justify-center right-[18px] top-[7px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[50px] relative w-0">
            <div className="absolute inset-[-10%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 60">
                <path d="M5 55V5" id="Vector 217" stroke="var(--stroke-0, #CAC2BC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[13px] size-[10px] top-[2px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #95867A)" id="Ellipse 220" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[18px] size-[10px] text-[6px] text-center text-white top-[7px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">5</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents right-[73px] top-[32px]">
      <div className="absolute flex h-[20px] items-center justify-center right-[78px] top-[37px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[20px] relative w-0">
            <div className="absolute inset-[-25%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 30">
                <path d="M5 25V5" id="Vector 220" stroke="var(--stroke-0, #CAE47F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[73px] size-[10px] top-[32px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #95C900)" id="Ellipse 217" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[78px] size-[10px] text-[6px] text-center text-white top-[37px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">2</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents right-[53px] top-[32px]">
      <div className="absolute flex h-[20px] items-center justify-center right-[58px] top-[37px] w-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[20px] relative w-0">
            <div className="absolute inset-[-25%_-5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 30">
                <path d="M5 25V5" id="Vector 219" stroke="var(--stroke-0, #B8CCFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[53px] size-[10px] top-[32px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #7299FF)" id="Ellipse 218" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[58px] size-[10px] text-[6px] text-center text-white top-[37px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">2</p>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents right-[13px] top-[2px]">
      <Group />
      <Group1 />
      <Group4 />
      <Group5 />
      <Group2 />
      <Group3 />
    </div>
  );
}

function MeasureGraph1() {
  return (
    <div className="basis-0 grow h-[62px] min-h-px min-w-px relative shrink-0" data-name="Measure Graph">
      <Group6 />
    </div>
  );
}

function Content10({ cardData }: { cardData: HomeSpecialNoteCardData }) {
  return (
    <div className="content-start flex flex-wrap gap-[12px] items-start justify-between min-w-[311px] relative shrink-0 w-full" data-name="Content">
      <Right4 cardData={cardData} />
      <MeasureGraph1 />
    </div>
  );
}

function Cards4({
  cardData,
  onOpenDetail,
}: {
  cardData: HomeSpecialNoteCardData;
  onOpenDetail: () => void;
}) {
  const summaryDetails = getHomeCardSummaryDetails(cardData.details);

  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="bg-white h-auto relative rounded-[20px] shrink-0 w-full text-left cursor-pointer"
      data-name="Cards"
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <div className="content-center flex flex-wrap gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full">
            <Head1 details={cardData.details} />
            <CardDetailLabel />
          </div>

          <div className="box-border content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[var(--tb-color-text-primary)] text-[16px] w-full">
                {cardData.title}
              </p>
            </div>

            <div className="content-stretch flex gap-[24px] items-stretch relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                {summaryDetails.map((detail) => (
                  <div
                    key={detail.detailLabel}
                    className="flex items-center gap-[8px] w-full"
                  >
                    <TastePointArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <p className="truncate text-[14px] font-medium text-[var(--tb-color-text-secondary)]">
                        {detail.detailLabel}
                      </p>
                      <p
                        className="shrink-0 text-[12px] font-semibold leading-[1.1]"
                        style={{ color: getTasteColor(detail.parentTaste) }}
                      >
                        {detail.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
                <SpecialNoteMiniGraph details={cardData.details} />
              </div>
            </div>

            <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
              {cardData.keywords.map((keyword) => (
                <HomeKeywordChip key={keyword} keyword={keyword} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function Head2() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Head">
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[normal] min-h-px min-w-px relative shrink-0 text-[var(--tb-color-text-primary)] text-[14px]">모든 정보 보기</p>
    </div>
  );
}

function Content11() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[8px] relative w-[4px]">
            <div className="absolute inset-[-6.25%_-12.5%]" style={{ "--stroke-0": "rgba(111, 111, 111, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 9">
                <path d="M4.5 0.5L0.5 4.5L4.5 8.5" id="Vector 143" stroke="var(--stroke-0, #6F6F6F)" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreInfo6() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="More info">
      <Content11 />
    </div>
  );
}

function Right5() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Right">
      <MoreInfo6 />
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-center flex flex-wrap gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head2 />
      <Right5 />
    </div>
  );
}

function Cards5() {
  return (
    <div className="bg-[var(--tb-color-bg-page)] relative rounded-[20px] shrink-0 w-full" data-name="Cards">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <Heading6 />
        </div>
      </div>
    </div>
  );
}

function Content12({
  specialNoteCard,
  tasteProfileCard,
  onOpenSpecialNote,
  onOpenTasteProfile,
}: {
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  onOpenSpecialNote: () => void;
  onOpenTasteProfile: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Content">
      <Cards3 cardData={tasteProfileCard} onOpenDetail={onOpenTasteProfile} />
      <Cards4 cardData={specialNoteCard} onOpenDetail={onOpenSpecialNote} />
    </div>
  );
}

function TasteProfile({
  specialNoteCard,
  tasteProfileCard,
  onOpenSpecialNote,
  onOpenTasteProfile,
}: {
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  onOpenSpecialNote: () => void;
  onOpenTasteProfile: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Taste Profile">
      <Heading3 />
      <Content12
        specialNoteCard={specialNoteCard}
        tasteProfileCard={tasteProfileCard}
        onOpenSpecialNote={onOpenSpecialNote}
        onOpenTasteProfile={onOpenTasteProfile}
      />
    </div>
  );
}

function Section1({
  reservationHint,
  specialNoteCard,
  tasteProfileCard,
  tasteProfileOverviewValues,
  tasteProfileSeries,
}: {
  reservationHint: string;
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  tasteProfileOverviewValues: HomeMeasurementOverviewValue[];
  tasteProfileSeries: HomeMeasurementSeriesPoint[];
}) {
  const [specialNoteOpen, setSpecialNoteOpen] = useState(false);
  const [tasteProfileOpen, setTasteProfileOpen] = useState(false);

  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          <TasteProfile
            specialNoteCard={specialNoteCard}
            tasteProfileCard={tasteProfileCard}
            onOpenSpecialNote={() => setSpecialNoteOpen(true)}
            onOpenTasteProfile={() => setTasteProfileOpen(true)}
          />
        </div>
      </div>

      {tasteProfileOpen ? (
        <div className="fixed inset-0 z-[60] bg-[var(--tb-color-bg-page)]">
          <TasteProfileDetailScreen
            cardData={tasteProfileCard}
            overviewValues={tasteProfileOverviewValues}
            series={tasteProfileSeries}
            onBack={() => setTasteProfileOpen(false)}
          />
        </div>
      ) : null}

      {specialNoteOpen ? (
        <div className="fixed inset-0 z-[70] bg-[var(--tb-color-bg-page)]">
          <SpecialNoteDetailScreen
            cardData={specialNoteCard}
            onBack={() => setSpecialNoteOpen(false)}
            reservationHint={reservationHint}
          />
        </div>
      ) : null}
    </div>
  );
}

function ContentAdjustmentViewAll() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[12px] text-[grey] text-nowrap text-right tracking-[0.3421px] whitespace-pre">전체 보기</p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[270deg]">
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

function MoreInfoAdjustment() {
  return (
    <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-name="More info">
      <ContentAdjustmentViewAll />
    </div>
  );
}

function HeadingAdjustment() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Heading">
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[1.4] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.24px]">조정 히스토리</p>
    </div>
  );
}






function HistoryCard({
  history,
  onRate,
  onClick,
  isCompareMode = false,
  isSelectedForCompare = false,
  compareSelectionOrder = 0,
}: {
  history: any,
  onRate: (id: number, rating: number, action?: boolean | "toggle" | "edit" | { type: string, value: any }) => void,
  onClick: () => void,
  isCompareMode?: boolean;
  isSelectedForCompare?: boolean;
  compareSelectionOrder?: number;
}) {
  return (
    <div
      className={`bg-white relative rounded-[20px] shrink-0 w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.99] ${isSelectedForCompare ? 'ring-2 ring-[#0f0f0f] shadow-[var(--tb-shadow-soft)]' : ''}`}
      data-name="History Card"
    >
      <div className="overflow-clip rounded-[inherit] size-full cursor-pointer" onClick={onClick}>
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <div className="flex items-center gap-2 w-full">
            <TCSBadge adjustments={history.adjustments} />
            <p className="font-bold text-[14px]">{history.menu}</p>
            <div className="grow" />
            {isCompareMode ? (
              <div
                className={`inline-flex items-center rounded-full px-[8px] py-[4px] text-[10px] font-semibold ${isSelectedForCompare ? 'bg-[var(--tb-color-text-primary)] text-white' : 'bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-body)]'}`}
              >
                {isSelectedForCompare ? `${compareSelectionOrder}번째 선택` : '비교 선택'}
              </div>
            ) : (
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-[12px] text-[var(--tb-color-text-hint)]">자세히</span>
                <ChevronRight className="w-3 h-3 text-[var(--tb-color-text-secondary)]" />
              </div>
            )}
          </div>

          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full gap-[8px]">
            <ChefAvatar
              alt={String(history.chefName ?? history.restaurant)}
              className="relative shrink-0 size-[40px] rounded-[8px]"
              iconSize={28}
              imageSrc={history.image}
              taste={history.adjustments[0]?.taste ?? history.adjustmentDetail.summary[0]?.taste}
              variant="neutral"
            />
            <div className="content-stretch flex flex-col gap-[2px] items-start relative grow">
              <p className="font-bold text-[14px]">{history.chefName} 셰프</p>
              <p className="text-[12px] text-gray-500">{history.restaurant}</p>
            </div>

          </div>

          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full flex-wrap">
            <div className="flex gap-[4px] items-center">
              <Clock className="size-[12px] text-[var(--tb-color-text-muted)]" />
              <p className="font-normal text-[12px] text-[var(--tb-color-text-muted)]">
                {history.date} {history.time}
              </p>
            </div>
            <p className="font-normal text-[12px] text-[var(--tb-color-text-muted)]">
              • 사용 시간 {history.duration}
            </p>
          </div>

          <div className="content-stretch flex gap-[6px] items-start relative shrink-0 w-full flex-wrap">
            {history.adjustments.map((adj: any, idx: number) => (
              <TasteChip
                key={`${history.id}-${adj.taste}-${idx}`}
                taste={adj.taste}
                value={adj.change}
              />
            ))}
          </div>




        </div>
      </div>
    </div>
  );
}

function getHistoryTimestampValue(history: any) {
  return Number(String(history.date).replace(/\./g, ''));
}

function getAdjustmentMagnitudeValue(change: string) {
  return Math.abs(Number(String(change).replace('%', '')) || 0);
}

function getAdjustmentSignedValue(change: string) {
  return Number(String(change).replace('%', '')) || 0;
}

function getHistoryAdjustmentMagnitude(history: any) {
  return history.adjustments.reduce(
    (sum: number, adjustment: any) => sum + getAdjustmentMagnitudeValue(adjustment.change),
    0,
  );
}

function isFeedbackPendingHistory(history: any) {
  return history.feedbackLabel === '피드백 작성하기';
}

function getTopAdjustedTastes(historyData: any[]) {
  const tasteCounts = new Map<string, number>();

  historyData.forEach((history) => {
    history.adjustments.forEach((adjustment: any) => {
      tasteCounts.set(adjustment.taste, (tasteCounts.get(adjustment.taste) || 0) + 1);
    });
  });

  return Array.from(tasteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([taste]) => taste);
}

function getTasteFilterChipStyle(taste: string, isSelected: boolean) {
  if (taste === '전체') {
    return isSelected
      ? {
          backgroundColor: '#0f0f0f',
          borderColor: '#0f0f0f',
          color: '#FFFFFF',
        }
      : {
          backgroundColor: '#f3f3f3',
          borderColor: '#f3f3f3',
          color: '#555555',
        };
  }

  return isSelected
    ? {
        backgroundColor: getTasteColor(taste),
        borderColor: getTasteColor(taste),
        color: '#FFFFFF',
      }
    : {
        backgroundColor: '#f3f3f3',
        borderColor: '#f3f3f3',
        color: '#555555',
      };
}

function getStrongestAdjustment(history: any) {
  return history.adjustments.reduce((strongest: any, adjustment: any) => {
    if (!strongest) {
      return adjustment;
    }

    return getAdjustmentMagnitudeValue(adjustment.change) > getAdjustmentMagnitudeValue(strongest.change)
      ? adjustment
      : strongest;
  }, null);
}

function getComparisonSummary(histories: any[]) {
  if (histories.length !== 2) {
    return null;
  }

  const [firstHistory, secondHistory] = histories;
  const firstMap = new Map(firstHistory.adjustments.map((adjustment: any) => [adjustment.taste, getAdjustmentSignedValue(adjustment.change)]));
  const secondMap = new Map(secondHistory.adjustments.map((adjustment: any) => [adjustment.taste, getAdjustmentSignedValue(adjustment.change)]));
  const allTastes = Array.from(new Set([...firstMap.keys(), ...secondMap.keys()]));

  const sharedTastes = allTastes.filter((taste) => firstMap.has(taste) && secondMap.has(taste));
  const mostDifferentTaste = allTastes.reduce<{ taste: string; difference: number } | null>((result, taste) => {
    const difference = Math.abs((Number(firstMap.get(taste)) || 0) - (Number(secondMap.get(taste)) || 0));

    if (!result || difference > result.difference) {
      return { taste, difference };
    }

    return result;
  }, null);

  return {
    firstStrongest: getStrongestAdjustment(firstHistory),
    secondStrongest: getStrongestAdjustment(secondHistory),
    sharedTastes,
    mostDifferentTaste,
  };
}

function AdjustmentHistoryScreen({
  historyData,
  onBack,
  onOpenDetail,
  onRate,
}: {
  historyData: any[];
  onBack: () => void;
  onOpenDetail: (id: number) => void;
  onRate: (id: number, rating: number, action?: boolean | "toggle" | "edit" | { type: string, value: any }) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tasteFilterTrackRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [shouldCenterTasteFilters, setShouldCenterTasteFilters] = useState(false);
  const [selectedTasteFilter, setSelectedTasteFilter] = useState('전체');
  const [sortMode, setSortMode] = useState<'recent' | 'adjustment' | 'satisfaction'>('recent');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<number[]>([]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const availableTasteFilters = Array.from(
    new Set(historyData.flatMap((history) => history.adjustments.map((adjustment: any) => adjustment.taste))),
  );
  const orderedTasteFilters = TASTE_TYPES.filter((taste) => availableTasteFilters.includes(taste));
  const topAdjustedTastes = getTopAdjustedTastes(historyData);
  const pendingFeedbackCount = historyData.filter(isFeedbackPendingHistory).length;
  const filteredHistoryData = [...historyData]
    .filter((history) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const searchableText = `${history.menu} ${history.chefName} ${history.restaurant}`.toLowerCase();
      const matchesSearch = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      const matchesTaste =
        selectedTasteFilter === '전체'
          ? true
          : history.adjustments.some((adjustment: any) => adjustment.taste === selectedTasteFilter);

      return matchesSearch && matchesTaste;
    })
    .sort((leftHistory, rightHistory) => {
      if (sortMode === 'adjustment') {
        return getHistoryAdjustmentMagnitude(rightHistory) - getHistoryAdjustmentMagnitude(leftHistory);
      }

      if (sortMode === 'satisfaction') {
        return rightHistory.satisfaction - leftHistory.satisfaction;
      }

      return getHistoryTimestampValue(rightHistory) - getHistoryTimestampValue(leftHistory);
    });
  const selectedCompareHistories = historyData.filter((history) => selectedCompareIds.includes(history.id));
  const comparisonSummary = getComparisonSummary(selectedCompareHistories);

  useEffect(() => {
    const trackElement = tasteFilterTrackRef.current;

    if (!trackElement) {
      return;
    }

    const updateTasteFilterAlignment = () => {
      setShouldCenterTasteFilters(trackElement.scrollWidth <= trackElement.clientWidth + 1);
    };

    const animationFrameId = window.requestAnimationFrame(updateTasteFilterAlignment);
    const resizeObserver = new ResizeObserver(updateTasteFilterAlignment);

    resizeObserver.observe(trackElement);
    window.addEventListener('resize', updateTasteFilterAlignment);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateTasteFilterAlignment);
    };
  }, [orderedTasteFilters.join('|'), isSearchOpen, selectedTasteFilter]);

  const handleToggleCompareMode = () => {
    setCompareMode((prev) => !prev);
    setSelectedCompareIds([]);
  };

  const sortOptions = [
    { id: 'recent', label: '최신순' },
    { id: 'adjustment', label: '변화량 큰 순' },
    { id: 'satisfaction', label: '만족도 높은 순' },
  ] as const;

  const handleHistoryCardClick = (historyId: number) => {
    if (!compareMode) {
      onOpenDetail(historyId);
      return;
    }

    setSelectedCompareIds((prev) => {
      if (prev.includes(historyId)) {
        return prev.filter((id) => id !== historyId);
      }

      if (prev.length >= 2) {
        return prev;
      }

      return [...prev, historyId];
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)] relative font-['Pretendard_Variable',sans-serif]">
      <div className="sticky top-0 z-50 bg-[var(--tb-color-bg-page)] border-b border-[var(--tb-color-border-subtle)]">
        <div className="flex items-center px-[20px] py-[12px] max-h-[56px]">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[var(--tb-color-text-secondary)]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] leading-[18px]">조정 히스토리</span>
            <span className="font-medium text-[12px] text-gray-500 leading-[14px]">{historyData.length}개의 조정 기록</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`ml-auto flex items-center justify-center size-[32px] rounded-full transition-colors z-20 ${isSearchOpen ? 'text-[var(--tb-color-text-primary)]' : 'hover:bg-gray-100 text-[var(--tb-color-text-secondary)]'}`}
            aria-label={isSearchOpen ? '검색창 닫기' : '검색 열기'}
          >
            <Search size={ICON_TOKENS.size.lg} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="sticky top-0 z-40 border-b border-[var(--tb-color-border-strong)] bg-[var(--tb-color-bg-page)]">
          <div className="flex flex-col gap-[8px] px-[20px] pt-[8px] pb-[10px]">
            {isSearchOpen ? (
              <div className="flex items-center gap-[10px] rounded-[var(--tb-radius-20)] bg-white px-[14px] py-[12px] shadow-[var(--tb-shadow-soft)]">
                <Search size={ICON_TOKENS.size.base} className="text-[var(--tb-color-icon-muted)]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="메뉴명, 셰프명, 레스토랑 검색"
                  className="w-full bg-transparent text-[14px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-icon-muted)]"
                />
              </div>
            ) : null}

            <div
              ref={tasteFilterTrackRef}
              className={`flex gap-[8px] overflow-x-auto no-scrollbar ${shouldCenterTasteFilters ? 'justify-center' : 'justify-start'}`}
            >
              {['전체', ...orderedTasteFilters].map((taste) => (
                <button
                  key={taste}
                  type="button"
                  onClick={() => setSelectedTasteFilter(taste)}
                  className="shrink-0 rounded-full px-[12px] py-[8px] text-[12px] font-semibold transition-colors"
                  style={{
                    ...getTasteFilterChipStyle(taste, selectedTasteFilter === taste),
                    ...(selectedTasteFilter !== taste
                      ? {
                        backgroundColor: '#f3f3f3',
                        borderColor: 'transparent',
                      }
                    : {}),
                  }}
                >
                  {taste}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[16px] px-[20px] pt-[10px]">
          <div className="bg-white rounded-[var(--tb-radius-24)] p-[16px] flex flex-col gap-[14px] shadow-[var(--tb-shadow-soft)]">
            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)] tracking-[0.2px]">최근 30일 요약</span>
                <p className="text-[18px] font-bold text-[var(--tb-color-text-primary)] tracking-[-0.24px]">반복된 조정 패턴을 빠르게 찾으세요</p>
                <p className="text-[14px] leading-[1.45] text-[var(--tb-color-text-muted)]">
                  가장 자주 조정된 포인트는{' '}
                  {topAdjustedTastes.map((taste, index) => (
                    <React.Fragment key={taste}>
                      <span style={{ color: getTasteColor(taste) }} className="font-semibold">
                        {taste}
                      </span>
                      {index < topAdjustedTastes.length - 1 ? <span> · </span> : null}
                    </React.Fragment>
                  ))}
                  이고, 아직 평가가 남은 기록은 {pendingFeedbackCount}개예요.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleCompareMode}
                className={`shrink-0 rounded-full px-[12px] py-[8px] text-[12px] font-semibold transition-colors ${compareMode ? 'bg-[var(--tb-color-text-primary)] text-white' : 'bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-primary)]'}`}
              >
                {compareMode ? '비교 종료' : '비교 시작'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] px-[12px] py-[10px]">
                <div className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">전체 기록</div>
                <div className="mt-[4px] text-[18px] font-bold text-[var(--tb-color-text-primary)]">{historyData.length}개</div>
              </div>
              <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] px-[12px] py-[10px]">
                <div className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">자주 조정된 미각</div>
                <div className="mt-[6px] text-[14px] font-bold leading-[1.35]">
                  {topAdjustedTastes.map((taste, index) => (
                    <React.Fragment key={taste}>
                      <span style={{ color: getTasteColor(taste) }}>{taste}</span>
                      {index < topAdjustedTastes.length - 1 ? <span className="text-[var(--tb-color-text-primary)]"> · </span> : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] px-[12px] py-[10px]">
                <div className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">피드백 미작성</div>
                <div className="mt-[4px] text-[18px] font-bold text-[var(--tb-color-text-primary)]">{pendingFeedbackCount}건</div>
              </div>
            </div>
          </div>

          {compareMode ? (
            <div className="bg-white rounded-[var(--tb-radius-24)] p-[16px] flex flex-col gap-[12px] shadow-[var(--tb-shadow-soft)]">
              <div className="flex items-center justify-between gap-[12px]">
                <div>
                  <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">비교할 기록 선택</p>
                  <p className="text-[12px] text-[var(--tb-color-text-subtle)]">카드 2개를 고르면 반복 포인트와 차이를 바로 볼 수 있어요.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompareIds([])}
                  className="rounded-full bg-[var(--tb-color-bg-page)] px-[10px] py-[7px] text-[12px] font-semibold text-[var(--tb-color-text-tertiary)]"
                >
                  선택 초기화
                </button>
              </div>

              <div className="flex gap-[8px] flex-wrap">
                {selectedCompareHistories.length > 0 ? selectedCompareHistories.map((history) => (
                  <span key={history.id} className="inline-flex items-center rounded-full bg-[var(--tb-color-bg-page)] px-[10px] py-[6px] text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                    {history.menu}
                  </span>
                )) : (
                  <span className="inline-flex items-center rounded-full bg-[var(--tb-color-bg-page)] px-[10px] py-[6px] text-[12px] font-medium text-[var(--tb-color-text-body)]">
                    아직 선택된 기록이 없어요
                  </span>
                )}
              </div>

              {comparisonSummary ? (
                <div className="flex flex-col gap-[10px] rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] p-[12px]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    <div className="rounded-[var(--tb-radius-14)] bg-white p-[12px]">
                      <p className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">{selectedCompareHistories[0].menu}</p>
                      <p className="mt-[6px] text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        {comparisonSummary.firstStrongest?.taste} {comparisonSummary.firstStrongest?.change}
                      </p>
                    </div>
                    <div className="rounded-[var(--tb-radius-14)] bg-white p-[12px]">
                      <p className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">{selectedCompareHistories[1].menu}</p>
                      <p className="mt-[6px] text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        {comparisonSummary.secondStrongest?.taste} {comparisonSummary.secondStrongest?.change}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[var(--tb-radius-14)] bg-white p-[12px] flex flex-col gap-[4px]">
                    <p className="text-[12px] font-medium text-[var(--tb-color-text-subtle)]">비교 요약</p>
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      공통 조정: {comparisonSummary.sharedTastes.length > 0 ? comparisonSummary.sharedTastes.join(' · ') : '겹치는 미각 없음'}
                    </p>
                    <p className="text-[12px] text-[var(--tb-color-text-muted)]">
                      가장 차이 큰 포인트는 {comparisonSummary.mostDifferentTaste?.taste}이고, 차이는 {comparisonSummary.mostDifferentTaste?.difference}%p예요.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-muted)] px-[12px] py-[10px] text-[12px] text-[var(--tb-color-text-muted)]">
                  두 개를 고르면 공통 조정과 가장 다른 포인트를 바로 보여드릴게요.
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <p className="text-[18px] font-bold tracking-[-0.24px] text-[var(--tb-color-text-primary)]">조정 기록</p>
              <p className="text-[12px] text-[var(--tb-color-text-subtle)]">{filteredHistoryData.length}개 표시</p>
            </div>
            <div className="relative shrink-0 pt-[2px]">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 cursor-pointer"
                aria-expanded={isSortMenuOpen}
                aria-label="정렬 기준 열기"
              >
                <span className="text-[12px] text-[var(--tb-color-text-hint)]">
                  {sortOptions.find((option) => option.id === sortMode)?.label ?? '최신순'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[var(--tb-color-text-secondary)] transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-10 min-w-[148px] rounded-[var(--tb-radius-20)] bg-white p-[6px] shadow-[var(--tb-shadow-strong)]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSortMode(option.id);
                        setIsSortMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[12px] px-[10px] py-[9px] text-left text-[12px] font-semibold transition-colors ${sortMode === option.id ? 'bg-[var(--tb-color-text-primary)] text-white' : 'text-[var(--tb-color-text-tertiary)] hover:bg-[var(--tb-color-surface-muted)]'}`}
                    >
                      <span>{option.label}</span>
                      {sortMode === option.id ? <span className="text-[12px]">적용 중</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-[12px]">
            {filteredHistoryData.length > 0 ? filteredHistoryData.map((item) => (
              <HistoryCard
                key={item.id}
                history={item}
                onRate={onRate}
                onClick={() => handleHistoryCardClick(item.id)}
                isCompareMode={compareMode}
                isSelectedForCompare={selectedCompareIds.includes(item.id)}
                compareSelectionOrder={selectedCompareIds.indexOf(item.id) + 1}
              />
            )) : (
              <div className="bg-white rounded-[var(--tb-radius-24)] px-[16px] py-[20px] text-center shadow-[var(--tb-shadow-soft)]">
                <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">조건에 맞는 기록이 없어요</p>
                <p className="mt-[6px] text-[14px] leading-[1.45] text-[var(--tb-color-text-muted)]">검색어나 필터를 조금 넓혀서 다시 찾아보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionAdjustmentHistory({
  initialHistoryData,
}: {
  initialHistoryData?: HomeAdjustmentHistoryItem[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [historyPageOpen, setHistoryPageOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HomeAdjustmentHistoryItem[]>(initialHistoryData ?? []);

  useEffect(() => {
    if (!initialHistoryData) {
      return;
    }

    setHistoryData(initialHistoryData);
  }, [initialHistoryData]);

  const handleRate = (id: number, rating: number, action?: boolean | "toggle" | "edit" | { type: string, value: any }) => {
    setHistoryData(prev => prev.map(item => {
      if (item.id !== id) return item;

      // Toggle action
      if (action === "toggle") {
        return { ...item, isExpanded: !item.isExpanded };
      }

      // Save action (true)
      if (action === true) {
        return { ...item, satisfaction: rating, feedbackLabel: "피드백 보기", isExpanded: true };
      }

      // Cancel action (false)
      if (action === false) {
        return { ...item, isExpanded: false };
      }

      // Edit action
      if (action === "edit") {
        return { ...item, feedbackLabel: "피드백 작성하기", isExpanded: true };
      }

      // Check for object actions (feedback updates)
      if (typeof action === 'object' && action !== null) {
        if (action.type === 'intensity') {
          return { ...item, selectedIntensity: action.value };
        }
        if (action.type === 'toggle_liked') {
          const val = action.value;
          const newLiked = (item.likedTastes || []).includes(val)
            ? (item.likedTastes || []).filter(t => t !== val)
            : [...(item.likedTastes || []), val];
          return { ...item, likedTastes: newLiked };
        }
        if (action.type === 'toggle_needed') {
          const val = action.value;
          const newNeeded = (item.neededAdjustments || []).includes(val)
            ? (item.neededAdjustments || []).filter(t => t !== val)
            : [...(item.neededAdjustments || []), val];
          return { ...item, neededAdjustments: newNeeded };
        }
      }

      // Default: Star rating click (just update rating)
      return { ...item, satisfaction: rating };
    }));
  };

  const visibleHistoryCount = showAllHistory ? historyData.length : 2;
  const visibleHistoryData = historyData.slice(0, visibleHistoryCount);
  const hasHiddenHistory = historyData.length > 2;

  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start gap-[12px] relative w-full">
          {/* Section Header */}
          <div className="flex justify-between items-start w-full mb-2">
            <span className="text-[18px] font-bold text-[var(--tb-color-text-primary)] tracking-[-0.24px]">조정 히스토리</span>
            {hasHiddenHistory ? (
              <button
                type="button"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => setShowAllHistory((prev) => !prev)}
                aria-expanded={showAllHistory}
                aria-label={showAllHistory ? "조정 히스토리 접기" : "조정 히스토리 전체 보기"}
              >
                <span className="text-[12px] text-[var(--tb-color-text-hint)]">{showAllHistory ? "접기" : "전체 보기"}</span>
                {showAllHistory ? (
                  <ChevronUp className="w-3 h-3 text-[var(--tb-color-text-secondary)]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[var(--tb-color-text-secondary)]" />
                )}
              </button>
            ) : null}
          </div>

          {/* List */}
          {visibleHistoryData.length > 0 ? (
            <div className="flex flex-col gap-3 w-full">
              {visibleHistoryData.map((item, index) => (
                <HistoryCard key={index} history={item} onRate={handleRate} onClick={() => setSelectedId(item.id)} />
              ))}
            </div>
          ) : (
            <div className="w-full rounded-[20px] bg-white px-[16px] py-[18px] text-center shadow-[var(--tb-shadow-soft)]">
              <p className="text-[15px] font-bold text-[var(--tb-color-text-primary)]">아직 표시할 조정 히스토리가 없어요</p>
              <p className="mt-[6px] text-[13px] leading-[1.5] text-[var(--tb-color-text-muted)]">
                실제 예약과 메뉴 데이터가 연결되면 여기에서 레스토랑별 조정 기록을 바로 볼 수 있어요.
              </p>
            </div>
          )}

          {historyData.length > 0 ? (
            <button
              type="button"
              className="w-full bg-white rounded-full p-[12px] mb-10 flex justify-between items-center cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[var(--tb-shadow-strong)] active:scale-[0.98]"
              onClick={() => setHistoryPageOpen(true)}
            >
              <span className="font-bold text-[14px] text-[var(--tb-color-text-primary)]">모든 정보 보기</span>
              <ChevronRight className="w-4 h-4 text-[var(--tb-color-text-secondary)]" />
            </button>
          ) : null}
        </div>
      </div>

      {historyPageOpen ? (
        <div className="fixed inset-0 z-[60] bg-white">
          <AdjustmentHistoryScreen
            historyData={historyData}
            onBack={() => setHistoryPageOpen(false)}
            onOpenDetail={(id) => setSelectedId(id)}
            onRate={handleRate}
          />
        </div>
      ) : null}

      {/* Detail Screen Overlay */}
      {selectedId && (
        <div className="fixed inset-0 z-[70] bg-white">
          <AdjustmentDetailScreen
            data={historyData.find(h => h.id === selectedId)}
            onBack={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}

function Content13({
  specialNoteCard,
  tasteProfileCard,
  tasteProfileOverviewValues,
  tasteProfileSeries,
  featuredChefs,
  reservationHint,
  adjustmentHistoryData,
}: {
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  tasteProfileOverviewValues: HomeMeasurementOverviewValue[];
  tasteProfileSeries: HomeMeasurementSeriesPoint[];
  featuredChefs: HomeChefCardData[];
  reservationHint: string;
  adjustmentHistoryData?: HomeAdjustmentHistoryItem[];
}) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-8 p-5 grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Content">
      <Section featuredChefs={featuredChefs} />
      <Section1
        reservationHint={reservationHint}
        specialNoteCard={specialNoteCard}
        tasteProfileCard={tasteProfileCard}
        tasteProfileOverviewValues={tasteProfileOverviewValues}
        tasteProfileSeries={tasteProfileSeries}
      />
      <SectionAdjustmentHistory initialHistoryData={adjustmentHistoryData} />

    </div>
  );
}

function SpecialNoteDetailScreen({
  cardData,
  onBack,
  reservationHint,
}: {
  cardData: HomeSpecialNoteCardData;
  onBack: () => void;
  reservationHint: string;
}) {
  const circleGradient = buildHomeCardCircleGradient(cardData.details);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)] relative overflow-y-auto no-scrollbar font-['Pretendard_Variable',sans-serif]">
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-50 bg-[var(--tb-color-bg-page)] border-b border-[var(--tb-color-border-default)]">
        <button onClick={onBack} className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[var(--tb-color-text-secondary)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] leading-[18px]">특이사항</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">세부 미각 요소 기반 전달 포인트</span>
        </div>
      </div>

      <div className="flex flex-col gap-[12px] p-[20px]">
        <div className="bg-white rounded-[20px] p-[12px] flex items-start gap-[12px]">
          <div
            className="shrink-0 size-[42px] rounded-full"
            style={{ background: circleGradient }}
          />
          <div className="flex flex-col gap-[6px] min-w-0">
            <div className="flex flex-wrap gap-[6px] items-center">
              <span className="inline-flex items-center rounded-full bg-[var(--tb-color-text-primary)] px-[8px] py-[3px] text-[10px] font-semibold text-white">
                셰프 전달 포인트
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-[8px] py-[3px] text-[10px] font-semibold text-[var(--tb-color-text-secondary)]">
                {cardData.translationStatusLabel}
              </span>
            </div>
            <p className="font-bold text-[18px] leading-[1.25] text-[var(--tb-color-text-primary)]">
              {cardData.title}
            </p>
            <p className="text-[14px] leading-[1.5] text-[var(--tb-color-text-muted)]">
              {cardData.serviceHint}
            </p>
          </div>
        </div>

        <SpecialNoteFeatureBody cardData={cardData} reservationHint={reservationHint} />
      </div>
    </div>
  );
}

function TasteProfileTrendChart({
  series,
  summaryDetails,
}: {
  series: HomeMeasurementSeriesPoint[];
  summaryDetails: HomeTrendDetail[];
}) {
  return (
    <div className="w-full">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series as any[]}
            margin={{ top: 12, right: 12, bottom: 12, left: 0 }}
          >
            {summaryDetails.map((detail) => {
              const strokeColor = getTasteColor(detail.parentTaste);

              return (
                <Line
                  key={detail.detailLabel}
                  type="monotone"
                  dataKey={detail.parentTaste}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ffffff", stroke: strokeColor, strokeWidth: 2 }}
                  activeDot={{ r: 4, fill: strokeColor, stroke: "#ffffff", strokeWidth: 1.5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-[2px] flex items-center justify-between px-[6px]">
        {series.map((item) => (
          <span
            key={item.label}
            className="text-[10px] font-medium text-[rgba(15,15,15,0.42)]"
          >
            {String(item.label)}
          </span>
        ))}
      </div>
    </div>
  );
}

function TasteProfileDetailScreen({
  cardData,
  onBack,
  overviewValues,
  series,
}: {
  cardData: HomeTasteProfileCardData;
  onBack: () => void;
  overviewValues: HomeMeasurementOverviewValue[];
  series: HomeMeasurementSeriesPoint[];
}) {
  const summaryDetails = getHomeCardSummaryDetails(cardData.details);
  const circleGradient = buildHomeCardCircleGradient(cardData.details);
  const summaryTasteLabels = summaryDetails.map((detail) => detail.detailLabel);
  const hasTrendHistory = series.length > 1;
  const maxAbsChange = Math.max(
    ...overviewValues.map((item) => Math.abs(item.change)),
  );

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)] relative overflow-y-auto no-scrollbar font-['Pretendard_Variable',sans-serif]">
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-50 bg-[var(--tb-color-bg-page)] border-b border-[var(--tb-color-border-default)]">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[var(--tb-color-text-secondary)]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] leading-[18px]">미각변화</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">
            {hasTrendHistory ? "최근 측정 반응 추세" : "이번 측정 기준 반응"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[12px] p-[20px]">
        <div className="bg-white rounded-[20px] p-[12px] flex items-start gap-[12px]">
          <div
            className="shrink-0 size-[42px] rounded-full"
            style={{ background: circleGradient }}
          />
          <div className="flex flex-col gap-[6px] min-w-0">
            <div className="flex flex-wrap gap-[6px] items-center">
              <span className="inline-flex items-center rounded-full bg-[var(--tb-color-text-primary)] px-[8px] py-[3px] text-[10px] font-semibold text-white">
                {hasTrendHistory ? "최근 추세 요약" : "이번 측정 요약"}
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-[8px] py-[3px] text-[10px] font-semibold text-[var(--tb-color-text-secondary)]">
                {cardData.periodLabel}
              </span>
            </div>
            <p className="font-bold text-[18px] leading-[1.25] text-[var(--tb-color-text-primary)]">
              {cardData.title}
            </p>
            <p className="text-[14px] leading-[1.5] text-[var(--tb-color-text-muted)]">
              {cardData.summary}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between gap-[12px]">
            <div>
              <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                {hasTrendHistory ? "주간 추이" : "현재 측정 포인트"}
              </p>
              <p className="mt-[3px] text-[12px] leading-[1.45] text-[var(--tb-color-text-subtle)]">
                {hasTrendHistory
                  ? summaryTasteLabels.length > 1
                    ? `${summaryTasteLabels[0]}과 ${summaryTasteLabels[1]} 반응 변화가 가장 크게 흔들렸어요.`
                    : `${summaryTasteLabels[0] ?? "미각"} 반응 변화가 가장 크게 흔들렸어요.`
                  : summaryTasteLabels.length > 1
                    ? `${summaryTasteLabels[0]}과 ${summaryTasteLabels[1]}이 이번 측정에서 평균과 가장 큰 차이를 보였어요.`
                    : `${summaryTasteLabels[0] ?? "미각"} 반응이 이번 측정에서 평균과 가장 큰 차이를 보였어요.`}
              </p>
            </div>
          </div>
          <TasteProfileTrendChart series={series} summaryDetails={summaryDetails} />
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[10px]">
          <div>
            <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">핵심 변화</p>
            <p className="mt-[3px] text-[12px] leading-[1.45] text-[var(--tb-color-text-subtle)]">
              {hasTrendHistory
                ? "현재 컨디션에서 가장 크게 바뀐 두 포인트만 먼저 보여드려요."
                : "이번 측정에서 평균과 차이가 큰 두 포인트를 먼저 보여드려요."}
            </p>
          </div>

          {summaryDetails.map((detail) => (
            <div
              key={detail.detailLabel}
              className="flex gap-[10px] items-start rounded-[12px] bg-[var(--tb-color-surface-muted)] px-[10px] py-[10px]"
            >
              <TastePointArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
              <div className="flex min-w-0 flex-col gap-[4px]">
                <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    {detail.detailLabel}
                  </p>
                  <p
                    className="text-[12px] font-semibold"
                    style={{ color: getTasteColor(detail.parentTaste) }}
                  >
                    {detail.change}
                  </p>
                </div>
                <p className="text-[12px] leading-[1.45] text-[var(--tb-color-text-muted)] break-keep">
                  {detail.cue}
                </p>
              </div>
            </div>
          ))}

          <p className="text-[12px] leading-[1.45] text-[var(--tb-color-text-subtle)] break-keep">
            {cardData.serviceHint}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[12px] pb-[20px]">
          <div>
            <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">전체 미각 분포</p>
            <p className="mt-[3px] text-[12px] leading-[1.45] text-[var(--tb-color-text-subtle)]">
              {hasTrendHistory
                ? "모든 미각의 변화량을 함께 보면 최근 반응의 중심이 더 분명해져요."
                : "이번 측정값이 평균과 얼마나 차이 나는지 함께 보면 현재 반응의 중심이 더 분명해져요."}
            </p>
          </div>

          <div className="flex flex-col gap-[10px]">
            {overviewValues.map((item) => {
              const barWidth = `${(Math.abs(item.change) / maxAbsChange) * 100}%`;
              const accentColor = getTasteColor(item.taste);
              const accentTint = getTasteTint(item.taste, 0.14);

              return (
                <div key={item.taste} className="flex items-center gap-[10px]">
                  <div className="w-[46px] shrink-0">
                    <span className="text-[12px] font-medium text-[var(--tb-color-text-secondary)]">
                      {item.taste}
                    </span>
                  </div>
                  <div className="flex-1 rounded-full bg-[var(--tb-color-bg-page)] h-[12px] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${accentTint} 0%, ${accentColor} 100%)`,
                        width: barWidth,
                      }}
                    />
                  </div>
                  <div className="w-[52px] shrink-0 text-right">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: accentColor }}
                    >
                      {item.change > 0 ? "+" : ""}
                      {item.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustmentDetailScreen({ data, onBack }: { data: any, onBack: () => void }) {
  if (!data || !data.adjustmentDetail) return null;
  const { summary, method, quote, evaluation } = data.adjustmentDetail;

  const tasteColors: { [key: string]: string } = {
    "단맛": "#FF9900",
    "신맛": "#FBC02D",
    "쓴맛": "#95C900",
    "짠맛": "#7299FF",
    "감칠맛": "#B372B4",
    "지방맛": "#95867A"
  };

  // Generate dynamic title string (e.g., "높은 단맛, 감칠맛 민감도")
  const tasteLabels = summary.map((s: any) => s.label).join(", ");

  // Identify tastes for "Reduced" and "Added" cards
  const minusTaste = summary.find((s: any) => s.value < 0)?.label;
  const plusTaste = summary.find((s: any) => s.value > 0)?.label;

  return (
    <div className="flex flex-col w-full h-full bg-white relative overflow-y-auto no-scrollbar font-['Pretendard_Variable',sans-serif]">
      {/* Header */}
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-50 bg-white border-b border-[#f3f3f3]">
        <button onClick={onBack} className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[var(--tb-color-text-secondary)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] leading-[18px]">{data.menu}</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">{data.chefName} 셰프 · {data.restaurant}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[24px] p-[20px]">
        {/* Section 1: Calibration Scope (Summary) */}
        <div className="flex flex-col gap-[12px]">
          <h3 className="font-bold text-[18px] text-[var(--tb-color-text-primary)]">조정 범위</h3>
          <div className="bg-[var(--tb-color-bg-page)] rounded-[20px] p-[12px] flex flex-col gap-4">
            <p className="text-[14px] text-[var(--tb-color-text-primary)] leading-snug font-medium">
              고객님의 <span className="font-bold">
                '{summary.map((s: any, i: number) => (
                  <React.Fragment key={i}>
                    <span style={{ color: tasteColors[s.label] || "#9333EA" }}>
                      {i === 0 && "높은 "}
                      {s.label}
                      {i === summary.length - 1 && " 민감도"}
                    </span>
                    {i < summary.length - 1 && <span className="text-[var(--tb-color-text-primary)]">, </span>}
                  </React.Fragment>
                ))}'
              </span>를 고려해<br />전체적인 밸런스를 조정했습니다.
            </p>

            {/* Equalizer Graph UI */}
            <div className="flex gap-6 items-end h-[140px] justify-center mt-2 relative">
              {/* Zero Line */}
              <div className="absolute w-[80%] h-[1px] bg-gray-300 top-1/2 -z-0"></div>

              {summary.map((item: any, idx: number) => {
                const isPositive = item.value > 0;
                const absValue = Math.abs(item.value);
                const height = absValue * 3.5; // Adjusted scaling
                const barColor = tasteColors[item.label] || (isPositive ? '#7C3AED' : '#3B82F6');

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-[60px]">
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: barColor }}
                    >
                      {isPositive ? '+' : ''}{item.value}%
                    </span>
                    <div className="relative w-full h-[80px] flex items-center justify-center">
                      <div
                        className={`w-[16px] rounded-full transition-all duration-500 shadow-sm ${isPositive ? 'mb-[40px]' : 'mt-[40px]'}`}
                        style={{ height: `${height}px`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[14px] text-[var(--tb-color-text-tertiary)] font-bold">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Chef's Solution (Method & Ingredients) */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[18px] text-[var(--tb-color-text-primary)]">셰프의 솔루션</h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Minus Card */}
            <div className="bg-[var(--tb-color-bg-page)] rounded-[20px] p-[12px] flex flex-col gap-[12px] transition-all hover:bg-[#eaeaea]">
              {/* Header: Icon + Label */}
              <div className="flex items-center gap-[6px]">
                <TastePointArrowBox parentTaste={minusTaste ?? '짠맛'} trend="decrease" />
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] text-[var(--tb-color-text-primary)] text-[14px]">줄였어요</p>
              </div>

              {/* Content: Text Left, Icon Right */}
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] mb-1">{method.minus.name}</span>
                  <p className="text-[14px] text-[var(--tb-color-text-body)] leading-snug">{method.minus.desc}</p>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex justify-center -my-3 z-10">
              <div className="bg-white p-2 rounded-full text-[var(--tb-color-text-secondary)] shadow-sm">
                <ChevronDown size={ICON_TOKENS.size.control} />
              </div>
            </div>

            {/* Plus Card */}
            <div className="bg-[var(--tb-color-bg-page)] rounded-[20px] p-[12px] flex flex-col gap-[12px] transition-all hover:bg-[#eaeaea]">
              {/* Header: Icon + Label */}
              <div className="flex items-center gap-[6px]">
                <TastePointArrowBox parentTaste={plusTaste ?? '감칠맛'} trend="increase" />
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] text-[var(--tb-color-text-primary)] text-[14px]">대신 넣었어요</p>
              </div>

              {/* Content: Text Left, Icon Right */}
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-[var(--tb-color-text-primary)] mb-1">{method.plus.name}</span>
                  <p className="text-[14px] text-[var(--tb-color-text-body)] leading-snug">{method.plus.desc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--tb-color-bg-page)] p-4 rounded-[var(--tb-radius-14)] mt-2">
            <p className="text-[14px] text-[var(--tb-color-text-tertiary)] italic text-center font-medium whitespace-pre-wrap">{quote}</p>
          </div>
        </div>

        {/* Section 3: Feedback Action */}
        <div className="flex flex-col gap-[16px] pb-10">
          <h3 className="font-bold text-[18px] text-[var(--tb-color-text-primary)]">나의 평가</h3>
          <p className="text-[14px] text-[var(--tb-color-text-primary)]">{evaluation.question}</p>

          <div className="flex flex-col gap-3">
            <button className="w-full py-[12px] rounded-[10px] bg-[var(--tb-color-text-primary)] text-white font-medium text-[14px] leading-normal shadow-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {evaluation.options.positive}
            </button>
            <div className="flex gap-3">
              <button className="flex-1 py-[12px] rounded-[10px] bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-body)] font-medium text-[14px] leading-normal hover:bg-[var(--tb-color-border-disabled)] transition-all">
                {evaluation.options.negative1}
              </button>
              <button className="flex-1 py-[12px] rounded-[10px] bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-body)] font-medium text-[14px] leading-normal hover:bg-[var(--tb-color-border-disabled)] transition-all">
                {evaluation.options.negative2}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Content14({
  specialNoteCard,
  tasteProfileCard,
  tasteProfileOverviewValues,
  tasteProfileSeries,
  featuredChefs,
  reservationHint,
  adjustmentHistoryData,
}: {
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  tasteProfileOverviewValues: HomeMeasurementOverviewValue[];
  tasteProfileSeries: HomeMeasurementSeriesPoint[];
  featuredChefs: HomeChefCardData[];
  reservationHint: string;
  adjustmentHistoryData?: HomeAdjustmentHistoryItem[];
}) {
  return (
    <div className="basis-0 bg-[var(--tb-color-bg-page)] content-stretch flex flex-col grow items-center min-h-px min-w-px overflow-y-auto no-scrollbar relative w-full h-full" data-name="Content">
      <Content13
        specialNoteCard={specialNoteCard}
        tasteProfileCard={tasteProfileCard}
        tasteProfileOverviewValues={tasteProfileOverviewValues}
        tasteProfileSeries={tasteProfileSeries}
        featuredChefs={featuredChefs}
        reservationHint={reservationHint}
        adjustmentHistoryData={adjustmentHistoryData}
      />
    </div>
  );
}

function Viewport({
  specialNoteCard,
  tasteProfileCard,
  tasteProfileOverviewValues,
  tasteProfileSeries,
  featuredChefs,
  reservationHint,
  adjustmentHistoryData,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: {
  specialNoteCard: HomeSpecialNoteCardData;
  tasteProfileCard: HomeTasteProfileCardData;
  tasteProfileOverviewValues: HomeMeasurementOverviewValue[];
  tasteProfileSeries: HomeMeasurementSeriesPoint[];
  featuredChefs: HomeChefCardData[];
  reservationHint: string;
  adjustmentHistoryData?: HomeAdjustmentHistoryItem[];
  onStartMeasurement?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}) {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative w-full h-full overflow-hidden" data-name="Viewport">
      <div className="shrink-0 w-full">
        <TopAppBar onStartMeasurement={onStartMeasurement} onOpenNotifications={onOpenNotifications} onOpenMenu={onOpenMenu} hasUnreadNotifications={hasUnreadNotifications} />
      </div>
      <Content14
        specialNoteCard={specialNoteCard}
        tasteProfileCard={tasteProfileCard}
        tasteProfileOverviewValues={tasteProfileOverviewValues}
        tasteProfileSeries={tasteProfileSeries}
        featuredChefs={featuredChefs}
        reservationHint={reservationHint}
        adjustmentHistoryData={adjustmentHistoryData}
      />
    </div>
  );
}

export {
  Cards3 as LegacyHomeTasteProfileCard,
  Cards4 as LegacyHomeSpecialNoteCard,
  SpecialNoteDetailScreen as LegacyHomeSpecialNoteDetailScreen,
  ChefCard as LegacyHomeChefCard,
  EmptyChefCard as LegacyHomeEmptyChefCard,
  HistoryCard as LegacyHomeHistoryCard,
  Section1 as LegacyHomeTasteSummarySection,
  SectionAdjustmentHistory as LegacyHomeAdjustmentHistorySection,
  TasteProfileDetailScreen as LegacyHomeTasteProfileDetailScreen,
};

export default function Home({
  hasMeasurementData,
  measurementSnapshot,
  onGoToAnalysis,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: {
  hasMeasurementData: boolean;
  measurementSnapshot: TasteMeasurementSnapshot | null;
  onGoToAnalysis?: () => void;
  onStartMeasurement?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}) {
  const [featuredChefs, setFeaturedChefs] = useState<HomeChefCardData[]>([]);
  const [reservationHint, setReservationHint] = useState(HOME_SPECIAL_NOTE_CARD.reservationHint);
  const [adjustmentHistoryData, setAdjustmentHistoryData] = useState<HomeAdjustmentHistoryItem[]>();
  const [tasteProfileCard, setTasteProfileCard] = useState<HomeTasteProfileCardData>(() =>
    cloneHomeTasteProfileCardData(HOME_TASTE_PROFILE_CARD),
  );
  const [specialNoteCard, setSpecialNoteCard] = useState<HomeSpecialNoteCardData>(() =>
    cloneHomeSpecialNoteCardData(HOME_SPECIAL_NOTE_CARD),
  );
  const [tasteProfileSeries, setTasteProfileSeries] = useState<HomeMeasurementSeriesPoint[]>(
    HOME_TASTE_PROFILE_WEEKLY_SERIES.map((item) => ({ ...item })),
  );
  const [tasteProfileOverviewValues, setTasteProfileOverviewValues] = useState<
    HomeMeasurementOverviewValue[]
  >(HOME_TASTE_PROFILE_OVERVIEW_VALUES.map((item) => ({ ...item })));

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const [hydratedData, recentMeasurements, contentCatalog] = await Promise.all([
        hydrateReservationPageData(),
        hydrateRecentMeasurementSnapshots(),
        hydrateRestaurantContentCatalog(),
      ]);

      if (isCancelled) {
        return;
      }

      const measurementTimeline = mergeMeasurementSnapshots(
        recentMeasurements,
        measurementSnapshot,
      );
      const nextReservationHint = buildHomeReservationHint(hydratedData.reservations);
      const nextTasteProfile = buildHomeTasteProfileFromMeasurements(measurementTimeline);
      const reservationChefCards = buildHomeChefCardsFromReservations(hydratedData.reservations);
      const contentChefCards = buildHomeChefCardsFromContent(contentCatalog.dishes);
      const reservationHistory = buildHomeAdjustmentHistory(
        hydratedData.reservations,
        hydratedData.feedbackByReservationId,
      );
      const contentHistory = buildHomeAdjustmentHistoryFromContent(contentCatalog.dishes);
      const nextFeaturedChefs = hasMeasurementData
        ? mergeHomeChefCards(reservationChefCards, contentChefCards)
        : [];
      const nextAdjustmentHistoryData = hasMeasurementData
        ? mergeHomeAdjustmentHistory(reservationHistory, contentHistory)
        : [];

      setFeaturedChefs(nextFeaturedChefs);
      setReservationHint(nextReservationHint);
      setAdjustmentHistoryData(nextAdjustmentHistoryData);
      setTasteProfileCard(nextTasteProfile.cardData);
      setTasteProfileSeries(nextTasteProfile.series);
      setTasteProfileOverviewValues(nextTasteProfile.overviewValues);
      setSpecialNoteCard(
        buildHomeSpecialNoteFromReservations(
          hydratedData.reservations,
          hydratedData.feedbackByReservationId,
          nextReservationHint,
        ),
      );
    })();

    return () => {
      isCancelled = true;
    };
  }, [hasMeasurementData, measurementSnapshot]);

  // Store the callback globally so deeply nested components can use it
  if (onGoToAnalysis) {
    (window as any).__goToAnalysis = onGoToAnalysis;
  }

  return (
    <div className="w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="bg-[var(--tb-color-bg-page)] content-stretch flex flex-col items-start relative w-full h-full overflow-hidden" data-name="Home">
        <Viewport
          specialNoteCard={specialNoteCard}
          tasteProfileCard={tasteProfileCard}
          tasteProfileOverviewValues={tasteProfileOverviewValues}
          tasteProfileSeries={tasteProfileSeries}
          featuredChefs={featuredChefs}
          reservationHint={reservationHint}
          adjustmentHistoryData={adjustmentHistoryData}
          onStartMeasurement={onStartMeasurement}
          onOpenNotifications={onOpenNotifications}
          onOpenMenu={onOpenMenu}
          hasUnreadNotifications={hasUnreadNotifications}
        />
      </div>
    </div>
  );
}
