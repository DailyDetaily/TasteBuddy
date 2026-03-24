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
import { buildTasteAdjustmentGradient, getTasteColor, getTasteTint, mixHexColors, TASTE_TYPES } from "../constants/tasteColors";
import {  
  StarRegular, StarHalfRegular, ClockRegular, SearchRegular,
  ChevronDownRegular, ChevronRightRegular, ChevronUpRegular 
} from '@fluentui/react-icons';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const Star = wrapIcon(StarRegular);
const StarHalf = wrapIcon(StarHalfRegular);
const Clock = wrapIcon(ClockRegular);
const Search = wrapIcon(SearchRegular);
const ChevronDown = wrapIcon(ChevronDownRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);
const ChevronUp = wrapIcon(ChevronUpRegular);

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







function Ratio() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio1() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[16px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio />
        </div>
      </div>
    </div>
  );
}

function Ratio2() {
  return (
    <div className="content-stretch flex flex-col h-full items-start overflow-clip relative shrink-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[32px]" style={{ "--transform-inner-width": "16", "--transform-inner-height": "32" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio1 />
        </div>
      </div>
    </div>
  );
}

function ProfileImageResourcePlaceholderProfileInitials() {
  return (
    <div className="absolute bg-white inset-0" data-name="Profile-Image/_Resource/Placeholder/Profile-Initials">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 153, 0, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <path d="M32 32H0V0H32V32Z" fill="var(--fill-0, #FF9900)" id="Subtract" opacity="0.2" />
        </svg>
      </div>
      <p className="absolute font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] left-[16px] text-[#0f0f0f] text-[14px] text-center text-nowrap top-[8px] translate-x-[-50%] whitespace-pre">JH</p>
    </div>
  );
}

function ProfileImageProfileImage() {
  return (
    <div className="relative rounded-[10000px] shrink-0 size-[32px]" data-name="Profile-Image/Profile-Image">
      <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[inherit] size-[32px]">
        <Ratio2 />
        <ProfileImageResourcePlaceholderProfileInitials />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(15,15,15,0.2)] border-solid inset-0 pointer-events-none rounded-[10000px]" />
    </div>
  );
}

function ProfileImage() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Profile-image">
      <ProfileImageProfileImage />
    </div>
  );
}

function Left() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Left">
      <ProfileImage />
    </div>
  );
}

function Ratio3() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio4() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio3 />
        </div>
      </div>
    </div>
  );
}

function Ratio5() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio4 />
        </div>
      </div>
    </div>
  );
}

function AlertUndefinedGlyphUndefined() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Alert / undefined / Glyph: undefined">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Alert / undefined / Glyph: undefined">
          <path d={svgPaths.p10a17300} fill="var(--fill-0, #3F3F3F)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio5 />
      <AlertUndefinedGlyphUndefined />
    </div>
  );
}

function Ratio6() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio7() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio6 />
        </div>
      </div>
    </div>
  );
}

function Ratio8() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio7 />
        </div>
      </div>
    </div>
  );
}

function AddCircleUndefinedGlyphUndefined() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Add Circle / undefined / Glyph: undefined">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Add Circle / undefined / Glyph: undefined">
          <path d={svgPaths.p35731e80} fill="var(--fill-0, #3F3F3F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio8 />
      <AddCircleUndefinedGlyphUndefined />
    </div>
  );
}

function Ratio9() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio10() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio9 />
        </div>
      </div>
    </div>
  );
}

function Ratio11() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio10 />
        </div>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[21.88%_9.38%]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 14">
        <g id="Group 151">
          <path d={svgPaths.p184c1a00} fill="var(--fill-0, #3F3F3F)" id="Vector 229 (Stroke)" />
          <path d={svgPaths.p22677180} fill="var(--fill-0, #3F3F3F)" id="Vector 231 (Stroke)" />
          <path d={svgPaths.pa9da800} fill="var(--fill-0, #3F3F3F)" id="Vector 230 (Stroke)" />
        </g>
      </svg>
    </div>
  );
}

function NavigationUndefinedGlyphUndefined() {
  return (
    <div className="absolute left-0 overflow-clip size-[24px] top-0" data-name="Navigation / undefined / Glyph: undefined">
      <Group7 />
    </div>
  );
}

function Icons2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio11 />
      <NavigationUndefinedGlyphUndefined />
    </div>
  );
}

function Icon() {
  return (
    <div className="box-border content-stretch flex gap-[16px] items-center justify-end px-0 py-[2px] relative shrink-0" data-name="Icon">
      <Icons />
      <Icons1 />
      <Icons2 />
    </div>
  );
}

function Action() {
  return (
    <div className="content-stretch flex gap-[16px] items-center justify-center relative shrink-0" data-name="Action">
      <Icon />
    </div>
  );
}

function Right() {
  return (
    <div className="content-stretch flex gap-[20px] items-center justify-center relative shrink-0" data-name="Right">
      <Action />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white h-[56px] max-w-[1100px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center max-w-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[56px] items-center justify-between max-w-inherit pl-[20px] pr-[16px] py-[12px] relative w-full">
          <Left />
          <Right />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-solid border-white inset-0 pointer-events-none" />
    </div>
  );
}

function Container() {
  return (
    <div className="backdrop-blur-[32px] backdrop-filter content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Container">
      <div className="absolute bg-white inset-0 opacity-[0.74]" data-name="Background" />

      <Content />
    </div>
  );
}

function TopAppBars() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Top App Bars">
      <Container />
    </div>
  );
}

function OsBarTopNavigationResourceContents() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="OS/Bar/Top Navigation/Resource/Contents">
      <TopAppBars />
    </div>
  );
}

function Heading() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Heading">
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[1.4] min-h-px min-w-px relative shrink-0 text-[20px] text-black tracking-[-0.24px]">셰프 매칭</p>
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[grey] text-nowrap text-right tracking-[0.3421px] whitespace-pre">자세히 보기</p>
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
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[#0f0f0f] text-[14px] w-full">황정인 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] w-full">레스토랑 베누</p>
    </div>
  );
}

function Info1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[#0f0f0f] text-[10px] text-nowrap whitespace-pre">매칭률 75%</p>
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
    <div className="bg-[#ffebcc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px]" data-name="Cards">
      <Content2 />
    </div>
  );
}

function Info2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Info">
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[#0f0f0f] text-[14px] w-full">이은지 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] w-full">숍 리제 (Lysée)</p>
    </div>
  );
}

function Info3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info2 />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[#0f0f0f] text-[10px] text-nowrap whitespace-pre">매칭률 72%</p>
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
    <div className="bg-[#fff7cc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px]" data-name="Cards">
      <Content3 />
    </div>
  );
}

function Info4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Info">
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[#0f0f0f] text-[14px] w-full">임정식 셰프</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] w-full">정식당</p>
    </div>
  );
}

function Info5() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[normal] relative shrink-0" data-name="Info">
      <Info4 />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold relative shrink-0 text-[#0f0f0f] text-[10px] text-nowrap whitespace-pre">매칭률 70%</p>
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
    <div className="bg-[#eaf4cc] box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 size-[132px]" data-name="Cards">
      <Content4 />
    </div>
  );
}

const chefData = [
  {
    name: "황정인 셰프",
    restaurant: "레스토랑 베누",
    match: 75,
    image: chefHwangJeongin,
    bgColor: "#ffebcc",
    taste: "단맛",
  },
  {
    name: "이은지 셰프",
    restaurant: "숍 리제 (Lysée)",
    match: 72,
    image: chefLeeEunji,
    bgColor: "#fff7cc",
    taste: "신맛",
  },
  {
    name: "임정식 셰프",
    restaurant: "정식당",
    match: 70,
    image: chefLimJeongsik,
    bgColor: "#eaf4cc",
    taste: "쓴맛",
  },
  {
    name: "최현석 셰프",
    restaurant: "레스토랑 CHOI",
    match: 68,
    image: chefHyunseokChoi,
    bgColor: "#E6F0FF",
    taste: "짠맛",
  },
  {
    name: "손종원 셰프",
    restaurant: "이타닉가든",
    match: 65,
    image: chefSonJongwon,
    bgColor: "#F0E3F0",
    taste: "감칠맛",
  },
  {
    name: "이준 셰프",
    restaurant: "스와니예",
    match: 62,
    image: chefLeeJun,
    bgColor: "#EAE7E4",
    taste: "지방맛",
  }
];

function ChefCard({ chef }: { chef: typeof chefData[0] }) {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 w-[132px] h-[132px]"
      style={{
        backgroundColor: chef.bgColor,
        border: `1px solid ${getTasteTint(chef.taste, 0.24)}`,
      }}
    >
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full h-full">
        <div className="relative rounded-[8px] shrink-0 size-[48px] overflow-hidden bg-gray-200">
          <img alt={chef.name} className="absolute inset-0 w-full h-full object-cover" src={chef.image} />
        </div>

        <div className="content-stretch flex flex-col justify-between items-start leading-[normal] relative shrink-0 w-full grow">
          <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[#0f0f0f] text-[14px] w-full truncate">{chef.name}</p>
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal text-[10px] text-[rgba(15,15,15,0.6)] w-full truncate">{chef.restaurant}</p>
          </div>
          <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[#0f0f0f] text-[10px]">매칭률 {chef.match}%</p>
        </div>
      </div>
    </div>
  );
}

function Content5() {
  return (
    <div className="content-stretch flex gap-3 items-start relative shrink-0 w-[calc(100%+40px)] mx-[-20px] px-[20px] overflow-x-auto pb-4 no-scrollbar" data-name="Content">
      {chefData.map((chef, index) => (
        <ChefCard key={index} chef={chef} />
      ))}
    </div>
  );
}

function ChefList() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Chef List">
      <Heading1 />
      <Content5 />
    </div>
  );
}

function Section() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          <ChefList />
        </div>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="flex justify-between items-start w-full" data-name="Heading">
      <span className="text-[20px] font-bold text-[#0f0f0f] tracking-[-0.24px]">미각 프로필</span>
      <button type="button" className="flex items-center gap-1 cursor-pointer">
        <span className="text-[11px] text-[#808080]">이번 주</span>
        <ChevronDown className="w-3 h-3 text-[#3F3F3F]" />
      </button>
    </div>
  );
}

function TasteCircle() {
  return (
    <div
      className="relative shrink-0 size-[16px] rounded-full"
      data-name="Taste Circle"
      style={{ background: HOME_TASTE_PROFILE_CIRCLE_GRADIENT }}
    />
  );
}

function Head() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">미각변화</p>
    </div>
  );
}

function Content7() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap text-right tracking-[0.3421px] whitespace-pre">
        {HOME_TASTE_PROFILE_CARD.periodLabel}
      </p>
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

function MoreInfo4() {
  return (
    <div className="basis-0 flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="More info">
      <Content7 />
    </div>
  );
}

function Right1() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0 w-[59px]" data-name="Right">
      <MoreInfo4 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="flex gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head />
      <Right1 />
    </div>
  );
}

function TasteChangeMiniGraph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(128);
  const graphEntries = HOME_TASTE_PROFILE_SUMMARY_DETAILS.map((detail) => ({
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

function Cards3({ onOpenDetail }: { onOpenDetail: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="bg-white h-auto relative rounded-[20px] shrink-0 w-full text-left transition-colors hover:bg-[#fafafa]"
      data-name="Cards"
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <Heading4 />

          <div className="box-border content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
                {HOME_TASTE_PROFILE_CARD.title}
              </p>
            </div>

            <div className="content-stretch flex gap-[24px] items-stretch relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                {HOME_TASTE_PROFILE_SUMMARY_DETAILS.map((detail) => (
                  <div key={detail.detailLabel} className="flex items-center gap-[8px] w-full">
                    <SpecialNoteArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <p className="truncate text-[13px] font-medium text-[rgba(15,15,15,0.72)]">
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
                <TasteChangeMiniGraph />
              </div>
            </div>

            <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
              {HOME_TASTE_PROFILE_CARD.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-white px-[8px] py-[4px] text-[10px] font-semibold text-[rgba(15,15,15,0.62)]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function TasteCircle1() {
  return (
    <div
      className="relative shrink-0 size-[16px] rounded-full"
      data-name="Taste Circle"
      style={{ background: HOME_SPECIAL_NOTE_CIRCLE_GRADIENT }}
    />
  );
}

function Head1() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle1 />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">특이사항</p>
    </div>
  );
}

function Content9() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap text-right tracking-[0.3421px] whitespace-pre">{HOME_SPECIAL_NOTE_CARD.periodLabel}</p>
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

function MoreInfo5() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="More info">
      <Content9 />
    </div>
  );
}

function Right3() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-[59px]" data-name="Right">
      <MoreInfo5 />
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-center flex flex-wrap gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head1 />
      <Right3 />
    </div>
  );
}

function SpecialNoteArrowBox({
  parentTaste,
  trend,
}: {
  parentTaste: string;
  trend: "increase" | "decrease";
}) {
  const fillColor = getTasteColor(parentTaste);

  return (
    <div className="relative shrink-0 size-[18px]" data-name="Arrow Box">
      <div className="absolute inset-0" style={{ "--fill-0": fillColor } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g id="Arrow Box">
            <rect fill="var(--fill-0, #B372B4)" height="18" rx="4" width="18" />
            <path
              d={trend === "increase" ? svgPaths.p3d191ac0 : svgPaths.p1157b300}
              id="Vector 222"
              stroke="var(--stroke-0, white)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SpecialNoteMiniGraph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(128);
  const graphEntries = HOME_SPECIAL_NOTE_SUMMARY_DETAILS.map((detail) => ({
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
  item: (typeof HOME_SPECIAL_NOTE_CARD.details)[number];
}) {
  const accentColor = getTasteColor(item.parentTaste);
  const accentTint = getTasteTint(item.parentTaste, 0.12);

  return (
    <div
      className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full rounded-[12px] bg-[#f7f7f7] px-[10px] py-[10px]"
      data-name="Info"
    >
      <SpecialNoteArrowBox parentTaste={item.parentTaste} trend={item.trend} />
      <div className="basis-0 content-stretch flex grow min-h-px min-w-px relative shrink-0">
        <div className="content-stretch flex flex-col gap-[4px] items-start relative w-full">
          <div className="flex flex-wrap items-center gap-[6px]">
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[rgba(15,15,15,0.75)]">
              {item.detailLabel} {item.trend === "increase" ? "증가" : "감소"}
            </p>
            <span
              className="inline-flex items-center rounded-full px-[6px] py-[2px] text-[10px] font-semibold"
              style={{ backgroundColor: accentTint, color: accentColor }}
            >
              {item.detailTypeLabel}
            </span>
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.55)]">
              {item.change}
            </p>
          </div>
          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.4] relative text-[11px] text-[rgba(15,15,15,0.6)]">
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

function SpecialNoteGuidanceList() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      {HOME_SPECIAL_NOTE_CARD.guidance.map((guidance) => (
        <div
          key={guidance}
          className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full rounded-[12px] bg-[#f7f7f7] px-[10px] py-[10px]"
        >
          <div className="mt-[5px] size-[6px] rounded-full bg-[#0f0f0f]" />
          <p className="basis-0 grow min-w-0 self-stretch font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.45] relative text-[12px] text-[rgba(15,15,15,0.65)] whitespace-normal break-keep text-left">
            {guidance}
          </p>
        </div>
      ))}
    </div>
  );
}

function SpecialNoteFeatureBody() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Special Note Feature">
      <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
        <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
          <span className="inline-flex items-center rounded-full bg-[#0f0f0f] px-[8px] py-[3px] text-[10px] font-semibold text-white">
            셰프 전달 포인트
          </span>
          <span className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-[#f3f3f3] px-[8px] py-[3px] text-[10px] font-semibold text-[rgba(15,15,15,0.7)]">
            {HOME_SPECIAL_NOTE_CARD.confidenceLabel}
          </span>
        </div>
        <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
          {HOME_SPECIAL_NOTE_CARD.title}
        </p>
        <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[12px] text-[rgba(15,15,15,0.6)] w-full">
          {HOME_SPECIAL_NOTE_CARD.summary}
        </p>
        <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[11px] text-[rgba(15,15,15,0.5)] w-full">
          {HOME_SPECIAL_NOTE_CARD.confidenceNote}
        </p>
      </div>

      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
          <div className="content-stretch flex flex-wrap gap-[8px] items-center justify-between relative shrink-0 w-full">
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[12px]">
              세부 미각 요소
            </p>
            <span className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-[#f3f3f3] px-[8px] py-[3px] text-[10px] font-semibold text-[rgba(15,15,15,0.65)]">
              {HOME_SPECIAL_NOTE_CARD.translationStatusLabel}
            </span>
          </div>
          <Info11 />
        </div>

        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[12px] relative rounded-[14px] shrink-0 w-full bg-white">
          <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[12px]">
            예약에 어떻게 반영되나요
          </p>
          <SpecialNoteGuidanceList />
          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[1.45] relative min-w-0 self-stretch text-[11px] text-[rgba(15,15,15,0.55)] whitespace-normal break-keep text-left">
            {HOME_SPECIAL_NOTE_CARD.reservationHint}
          </p>
        </div>
      </div>
    </div>
  );
}

function Info11() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Info">
      {HOME_SPECIAL_NOTE_CARD.details.map((detail) => (
        <SpecialNoteInfo key={detail.detailLabel} item={detail} />
      ))}
    </div>
  );
}

function Right4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Right">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold h-[14px] justify-center leading-[0] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
        <p className="leading-[100.06%]">{HOME_SPECIAL_NOTE_CARD.title}</p>
      </div>
      <Info11 />
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

function Content10() {
  return (
    <div className="content-start flex flex-wrap gap-[12px] items-start justify-between min-w-[311px] relative shrink-0 w-full" data-name="Content">
      <Right4 />
      <MeasureGraph1 />
    </div>
  );
}

function Cards4({ onOpenDetail }: { onOpenDetail: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className="bg-white h-auto relative rounded-[20px] shrink-0 w-full text-left transition-colors hover:bg-[#fafafa]"
      data-name="Cards"
    >
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <div className="content-center flex flex-wrap gap-4 items-center justify-between min-w-[311px] relative shrink-0 w-full">
            <Head1 />
            <div className="flex items-center gap-1 text-[#808080]">
              <span className="text-[11px] font-medium">자세히</span>
              <ChevronRight className="w-3 h-3 text-[#3F3F3F]" />
            </div>
          </div>

          <div className="box-border content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[1.25] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
                {HOME_SPECIAL_NOTE_CARD.title}
              </p>
            </div>

            <div className="content-stretch flex gap-[24px] items-stretch relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                {HOME_SPECIAL_NOTE_SUMMARY_DETAILS.map((detail) => (
                  <div
                    key={detail.detailLabel}
                    className="flex items-center gap-[8px] w-full"
                  >
                    <SpecialNoteArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <p className="truncate text-[13px] font-medium text-[rgba(15,15,15,0.72)]">
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
                <SpecialNoteMiniGraph />
              </div>
            </div>

            <div className="content-stretch flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
              {HOME_SPECIAL_NOTE_CARD.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-white px-[8px] py-[4px] text-[10px] font-semibold text-[rgba(15,15,15,0.62)]"
                >
                  {keyword}
                </span>
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
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[normal] min-h-px min-w-px relative shrink-0 text-[#0f0f0f] text-[14px]">모든 정보 보기</p>
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
    <div className="bg-[#f3f3f3] relative rounded-[20px] shrink-0 w-full" data-name="Cards">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <Heading6 />
        </div>
      </div>
    </div>
  );
}

function Content12({
  onOpenSpecialNote,
  onOpenTasteProfile,
}: {
  onOpenSpecialNote: () => void;
  onOpenTasteProfile: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Content">
      <Cards3 onOpenDetail={onOpenTasteProfile} />
      <Cards4 onOpenDetail={onOpenSpecialNote} />
    </div>
  );
}

function TasteProfile({
  onOpenSpecialNote,
  onOpenTasteProfile,
}: {
  onOpenSpecialNote: () => void;
  onOpenTasteProfile: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Taste Profile">
      <Heading3 />
      <Content12 onOpenSpecialNote={onOpenSpecialNote} onOpenTasteProfile={onOpenTasteProfile} />
    </div>
  );
}

function Section1() {
  const [specialNoteOpen, setSpecialNoteOpen] = useState(false);
  const [tasteProfileOpen, setTasteProfileOpen] = useState(false);

  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start relative w-full">
          <TasteProfile
            onOpenSpecialNote={() => setSpecialNoteOpen(true)}
            onOpenTasteProfile={() => setTasteProfileOpen(true)}
          />
        </div>
      </div>

      {tasteProfileOpen ? (
        <div className="fixed inset-0 z-[60] bg-[#f3f3f3]">
          <TasteProfileDetailScreen onBack={() => setTasteProfileOpen(false)} />
        </div>
      ) : null}

      {specialNoteOpen ? (
        <div className="fixed inset-0 z-[70] bg-[#f3f3f3]">
          <SpecialNoteDetailScreen onBack={() => setSpecialNoteOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

function ContentAdjustmentViewAll() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[grey] text-nowrap text-right tracking-[0.3421px] whitespace-pre">전체 보기</p>
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
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[1.4] min-h-px min-w-px relative shrink-0 text-[20px] text-black tracking-[-0.24px]">조정 히스토리</p>
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
      className={`bg-white relative rounded-[20px] shrink-0 w-full transition-all ${isSelectedForCompare ? 'ring-2 ring-[#0f0f0f] shadow-[0_8px_24px_rgba(15,15,15,0.08)]' : ''}`}
      data-name="History Card"
    >
      <div className="overflow-clip rounded-[inherit] size-full cursor-pointer" onClick={onClick}>
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <div className="flex items-center gap-2 w-full">
            <span
              className="text-white text-[10px] px-[6px] py-[2px] rounded-[6px] font-bold relative shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]"
              style={{
                background: buildTasteAdjustmentGradient(history.adjustments),
              }}
            >
              TCS
            </span>
            <p className="font-bold text-[14px]">{history.menu}</p>
            <div className="grow" />
            {isCompareMode ? (
              <div
                className={`inline-flex items-center rounded-full px-[8px] py-[4px] text-[10px] font-semibold ${isSelectedForCompare ? 'bg-[#0f0f0f] text-white' : 'bg-[#f3f3f3] text-[#666666]'}`}
              >
                {isSelectedForCompare ? `${compareSelectionOrder}번째 선택` : '비교 선택'}
              </div>
            ) : (
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-[11px] text-[#808080]">자세히</span>
                <ChevronRight className="w-3 h-3 text-[#3F3F3F]" />
              </div>
            )}
          </div>

          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full gap-[8px]">
            <img
              src={history.image}
              alt={history.menu}
              className="relative rounded-[8px] shrink-0 size-[40px] object-cover"
            />
            <div className="content-stretch flex flex-col gap-[2px] items-start relative grow">
              <p className="font-bold text-[14px]">{history.chefName} 셰프</p>
              <p className="text-[12px] text-gray-500">{history.restaurant}</p>
            </div>

          </div>

          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full flex-wrap">
            <div className="flex gap-[4px] items-center">
              <Clock className="size-[12px] text-[rgba(15,15,15,0.6)]" />
              <p className="font-normal text-[11px] text-[rgba(15,15,15,0.6)]">
                {history.date} {history.time}
              </p>
            </div>
            <p className="font-normal text-[11px] text-[rgba(15,15,15,0.6)]">
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
  return history.feedbackLabel === '피드백 작성하기' || history.satisfaction === 0;
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
  const mostDifferentTaste = allTastes.reduce((result, taste) => {
    const difference = Math.abs((firstMap.get(taste) || 0) - (secondMap.get(taste) || 0));

    if (!result || difference > result.difference) {
      return { taste, difference };
    }

    return result;
  }, null as null | { taste: string; difference: number });

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
    <div className="flex flex-col w-full h-full bg-[#f3f3f3] relative font-['Pretendard_Variable',sans-serif]">
      <div className="sticky top-0 z-50 bg-[#f3f3f3] border-b border-[#ececec]">
        <div className="flex items-center px-[20px] py-[12px] max-h-[56px]">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[#3F3F3F]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-bold text-[15px] text-[#0f0f0f] leading-[18px]">조정 히스토리</span>
            <span className="font-medium text-[12px] text-gray-500 leading-[14px]">{historyData.length}개의 조정 기록</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`ml-auto flex items-center justify-center size-[32px] rounded-full transition-colors z-20 ${isSearchOpen ? 'bg-white text-[#0f0f0f]' : 'hover:bg-gray-100 text-[#3F3F3F]'}`}
            aria-label={isSearchOpen ? '검색창 닫기' : '검색 열기'}
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="sticky top-0 z-40 border-b border-[#e3e3e3] bg-[#f3f3f3]">
          <div className="flex flex-col gap-[8px] px-[20px] pt-[8px] pb-[10px]">
            {isSearchOpen ? (
              <div className="flex items-center gap-[10px] rounded-[18px] bg-white px-[14px] py-[12px] shadow-[0_8px_24px_rgba(15,15,15,0.04)]">
                <Search size={16} className="text-[rgba(15,15,15,0.38)]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="메뉴명, 셰프명, 레스토랑 검색"
                  className="w-full bg-transparent text-[14px] text-[#0f0f0f] outline-none placeholder:text-[rgba(15,15,15,0.38)]"
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
          <div className="bg-white rounded-[24px] p-[16px] flex flex-col gap-[14px] shadow-[0_8px_24px_rgba(15,15,15,0.04)]">
            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[11px] font-semibold text-[rgba(15,15,15,0.5)] tracking-[0.2px]">최근 30일 요약</span>
                <p className="text-[20px] font-bold text-[#0f0f0f] tracking-[-0.24px]">반복된 조정 패턴을 빠르게 찾으세요</p>
                <p className="text-[13px] leading-[1.45] text-[rgba(15,15,15,0.62)]">
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
                className={`shrink-0 rounded-full px-[12px] py-[8px] text-[12px] font-semibold transition-colors ${compareMode ? 'bg-[#0f0f0f] text-white' : 'bg-[#f3f3f3] text-[#0f0f0f]'}`}
              >
                {compareMode ? '비교 종료' : '비교 시작'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[8px]">
              <div className="rounded-[18px] bg-[#f7f7f7] px-[12px] py-[10px]">
                <div className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">전체 기록</div>
                <div className="mt-[4px] text-[18px] font-bold text-[#0f0f0f]">{historyData.length}개</div>
              </div>
              <div className="rounded-[18px] bg-[#f7f7f7] px-[12px] py-[10px]">
                <div className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">자주 조정된 미각</div>
                <div className="mt-[6px] text-[14px] font-bold leading-[1.35]">
                  {topAdjustedTastes.map((taste, index) => (
                    <React.Fragment key={taste}>
                      <span style={{ color: getTasteColor(taste) }}>{taste}</span>
                      {index < topAdjustedTastes.length - 1 ? <span className="text-[#0f0f0f]"> · </span> : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="rounded-[18px] bg-[#f7f7f7] px-[12px] py-[10px]">
                <div className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">피드백 미작성</div>
                <div className="mt-[4px] text-[18px] font-bold text-[#0f0f0f]">{pendingFeedbackCount}건</div>
              </div>
            </div>
          </div>

          {compareMode ? (
            <div className="bg-white rounded-[24px] p-[16px] flex flex-col gap-[12px] shadow-[0_8px_24px_rgba(15,15,15,0.04)]">
              <div className="flex items-center justify-between gap-[12px]">
                <div>
                  <p className="text-[16px] font-bold text-[#0f0f0f]">비교할 기록 선택</p>
                  <p className="text-[12px] text-[rgba(15,15,15,0.56)]">카드 2개를 고르면 반복 포인트와 차이를 바로 볼 수 있어요.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompareIds([])}
                  className="rounded-full bg-[#f3f3f3] px-[10px] py-[7px] text-[11px] font-semibold text-[#555555]"
                >
                  선택 초기화
                </button>
              </div>

              <div className="flex gap-[8px] flex-wrap">
                {selectedCompareHistories.length > 0 ? selectedCompareHistories.map((history) => (
                  <span key={history.id} className="inline-flex items-center rounded-full bg-[#f3f3f3] px-[10px] py-[6px] text-[12px] font-semibold text-[#0f0f0f]">
                    {history.menu}
                  </span>
                )) : (
                  <span className="inline-flex items-center rounded-full bg-[#f3f3f3] px-[10px] py-[6px] text-[12px] font-medium text-[#666666]">
                    아직 선택된 기록이 없어요
                  </span>
                )}
              </div>

              {comparisonSummary ? (
                <div className="flex flex-col gap-[10px] rounded-[18px] bg-[#f7f7f7] p-[12px]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    <div className="rounded-[16px] bg-white p-[12px]">
                      <p className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">{selectedCompareHistories[0].menu}</p>
                      <p className="mt-[6px] text-[14px] font-bold text-[#0f0f0f]">
                        {comparisonSummary.firstStrongest?.taste} {comparisonSummary.firstStrongest?.change}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-white p-[12px]">
                      <p className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">{selectedCompareHistories[1].menu}</p>
                      <p className="mt-[6px] text-[14px] font-bold text-[#0f0f0f]">
                        {comparisonSummary.secondStrongest?.taste} {comparisonSummary.secondStrongest?.change}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-[12px] flex flex-col gap-[4px]">
                    <p className="text-[11px] font-medium text-[rgba(15,15,15,0.52)]">비교 요약</p>
                    <p className="text-[13px] font-semibold text-[#0f0f0f]">
                      공통 조정: {comparisonSummary.sharedTastes.length > 0 ? comparisonSummary.sharedTastes.join(' · ') : '겹치는 미각 없음'}
                    </p>
                    <p className="text-[12px] text-[rgba(15,15,15,0.62)]">
                      가장 차이 큰 포인트는 {comparisonSummary.mostDifferentTaste?.taste}이고, 차이는 {comparisonSummary.mostDifferentTaste?.difference}%p예요.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] bg-[#f7f7f7] px-[12px] py-[10px] text-[12px] text-[rgba(15,15,15,0.62)]">
                  두 개를 고르면 공통 조정과 가장 다른 포인트를 바로 보여드릴게요.
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <p className="text-[18px] font-bold tracking-[-0.24px] text-[#0f0f0f]">조정 기록</p>
              <p className="text-[12px] text-[rgba(15,15,15,0.48)]">{filteredHistoryData.length}개 표시</p>
            </div>
            <div className="relative shrink-0 pt-[2px]">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 cursor-pointer"
                aria-expanded={isSortMenuOpen}
                aria-label="정렬 기준 열기"
              >
                <span className="text-[11px] text-[#808080]">
                  {sortOptions.find((option) => option.id === sortMode)?.label ?? '최신순'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#3F3F3F] transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-10 min-w-[148px] rounded-[18px] bg-white p-[6px] shadow-[0_16px_32px_rgba(15,15,15,0.12)]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSortMode(option.id);
                        setIsSortMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[12px] px-[10px] py-[9px] text-left text-[12px] font-semibold transition-colors ${sortMode === option.id ? 'bg-[#0f0f0f] text-white' : 'text-[#555555] hover:bg-[#f5f5f5]'}`}
                    >
                      <span>{option.label}</span>
                      {sortMode === option.id ? <span className="text-[11px]">적용 중</span> : null}
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
              <div className="bg-white rounded-[24px] px-[16px] py-[20px] text-center shadow-[0_8px_24px_rgba(15,15,15,0.04)]">
                <p className="text-[15px] font-bold text-[#0f0f0f]">조건에 맞는 기록이 없어요</p>
                <p className="mt-[6px] text-[13px] leading-[1.45] text-[rgba(15,15,15,0.58)]">검색어나 필터를 조금 넓혀서 다시 찾아보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionAdjustmentHistory() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [historyPageOpen, setHistoryPageOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyData, setHistoryData] = useState([
    {
      id: 1,
      menu: "트러플 파스타",
      chefName: "김호윤",
      restaurant: "더 이탈리안 클럽",
      date: "2024.12.04",
      time: "저녁 7:00",
      duration: "1시간 50분",
      image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop",
      satisfaction: 0,
      color: "#E8D5E9",
      adjustments: [
        { taste: "감칠맛", change: "+10%" },
        { taste: "지방맛", change: "+7%" },
        { taste: "짠맛", change: "+3%" }
      ],
      feedbackLabel: "피드백 작성하기",
      badgeColor: "#95A4FC", // Purple-ish
      isExpanded: false,
      selectedIntensity: null as string | null,
      likedTastes: [] as string[],
      neededAdjustments: [] as string[],
      adjustmentDetail: {
        method: {
          minus: { name: "정제염 (Salt)", desc: "직접적인 짠맛을 줄였습니다 (-3g)", icon: "📉" },
          plus: { name: "앤초비 파우더", desc: "깊은 감칠맛으로 대체했습니다 (+5g)", icon: "📈" }
        },
        summary: [
          { taste: "짠맛", value: -15, label: "짠맛" },
          { taste: "감칠맛", value: 10, label: "감칠맛" }
        ],
        quote: "소금의 날카로운 짠맛 대신,\n앤초비 파우더의 깊은 감칠맛으로 간을 맞춰 자극을 줄였습니다.",
        evaluation: {
          question: "오늘 셰프의 전략(소금 대신 앤초비 파우더)은 어땠나요?",
          options: {
            positive: "완벽한 밸런스였어요",
            negative1: "조금 비릿했어요",
            negative2: "여전히 짰어요"
          }
        }
      }
    },
    {
      id: 2,
      menu: "송로버섯 리조또",
      chefName: "박준우",
      restaurant: "오트뤼",
      date: "2024.12.01",
      time: "점심 12:30",
      duration: "1시간 20분",
      image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200&h=200&fit=crop",
      satisfaction: 0,
      color: "#FFE0B2", // Light Orange/Beige
      adjustments: [
        { taste: "단맛", change: "+15%" },
        { taste: "감칠맛", change: "+8%" }
      ],
      feedbackLabel: "피드백 보기",
      badgeColor: "#FFB26B", // Orange
      isExpanded: false,
      selectedIntensity: "적당했어요",
      likedTastes: ["단맛", "감칠맛"],
      neededAdjustments: [] as string[],
      adjustmentDetail: {
        method: {
          minus: { name: "설탕 (Sugar)", desc: "인공적인 단맛을 줄였습니다 (-5g)", icon: "📉" },
          plus: { name: "양파 캐러멜 (Onion Caramel)", desc: "자연스러운 단맛과 풍미를 더했습니다 (+10g)", icon: "📈" }
        },
        summary: [
          { taste: "단맛", value: 15, label: "단맛" },
          { taste: "감칠맛", value: 8, label: "감칠맛" }
        ],
        quote: "설탕의 인공적인 단맛 대신,\n양파 캐러멜의 깊은 풍미로 밸런스를 맞췄습니다.",
        evaluation: {
          question: "오늘 셰프의 전략(설탕 대신 양파 캐러멜)은 어땠나요?",
          options: {
            positive: "풍미가 훌륭해요",
            negative1: "단맛이 부족해요",
            negative2: "양파 향이 강해요"
          }
        }
      }
    },
    {
      id: 3,
      menu: "한우 등심 스테이크",
      chefName: "최현석",
      restaurant: "레스토랑 CHOI",
      date: "2024.12.02",
      time: "점심 12:00",
      duration: "1시간 45분",
      image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200&h=200&fit=crop",
      satisfaction: 4,
      color: "#E3F2FD", // Light Blue
      adjustments: [
        { taste: "짠맛", change: "+12%" },
        { taste: "지방맛", change: "+5%" }
      ],
      feedbackLabel: "피드백 보기",
      badgeColor: "#8FBFFF", // Blue
      isExpanded: false,
      selectedIntensity: "적당했어요",
      likedTastes: ["짠맛"],
      neededAdjustments: ["지방맛"],
      adjustmentDetail: {
        method: {
          minus: { name: "소금 (Salt)", desc: "기본 시즈닝을 줄였습니다 (-2g)", icon: "📉" },
          plus: { name: "트러플 소금 (Truffle Salt)", desc: "풍미 있는 짠맛으로 변경했습니다 (+3g)", icon: "📈" }
        },
        summary: [
          { taste: "짠맛", value: 12, label: "짠맛" },
          { taste: "지방맛", value: 5, label: "지방맛" }
        ],
        quote: "일반 소금 대신,\n트러플 소금의 풍미를 더해 나트륨은 줄이고 만족감은 높였습니다.",
        evaluation: {
          question: "오늘 셰프의 전략(일반 소금 대신 트러플 소금)은 어땠나요?",
          options: {
            positive: "고급스러운 맛이에요",
            negative1: "향이 너무 강해요",
            negative2: "덜 짠 것 같아요"
          }
        }
      }
    },
    {
      id: 4,
      menu: "랍스터 비스크",
      chefName: "황정인",
      restaurant: "레스토랑 베누",
      date: "2024.11.28",
      time: "저녁 6:30",
      duration: "1시간 30분",
      image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=200&fit=crop",
      satisfaction: 3,
      color: "#FFE0B2", // Light Orange/Beige
      adjustments: [
        { taste: "단맛", change: "+15%" },
        { taste: "감칠맛", change: "+8%" }
      ],
      feedbackLabel: "피드백 보기",
      badgeColor: "#FFB26B", // Orange
      isExpanded: false,
      selectedIntensity: "적당했어요",
      likedTastes: ["단맛", "감칠맛"],
      neededAdjustments: [] as string[],
      adjustmentDetail: {
        method: {
          minus: { name: "크림 (Cream)", desc: "무거운 느낌을 줄였습니다 (-10ml)", icon: "📉" },
          plus: { name: "조개 육수 (Clam Stock)", desc: "시원한 감칠맛을 더했습니다 (+20ml)", icon: "📈" }
        },
        summary: [
          { taste: "단맛", value: 15, label: "단맛" },
          { taste: "감칠맛", value: 8, label: "감칠맛" }
        ],
        quote: "무거운 크림 대신,\n조개 육수의 시원한 감칠맛을 더해 가볍지만 깊은 맛을 냈습니다.",
        evaluation: {
          question: "오늘 셰프의 전략(크림 대신 조개 육수)은 어땠나요?",
          options: {
            positive: "시원하고 깊어요",
            negative1: "너무 가벼워요",
            negative2: "비린 맛이 나요"
          }
        }
      }
    },
    {
      id: 5,
      menu: "시트러스 타르트",
      chefName: "이은지",
      restaurant: "숍 리제",
      date: "2024.11.28",
      time: "저녁 6:30",
      duration: "2시간",
      image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=200&h=200&fit=crop",
      satisfaction: 5,
      color: "#FFF9C4", // Light Yellow
      adjustments: [
        { taste: "신맛", change: "+10%" },
        { taste: "쓴맛", change: "-5%" }
      ],
      feedbackLabel: "피드백 보기",
      badgeColor: "#C0CA33", // Lime/Yellow-Green
      isExpanded: false,
      selectedIntensity: "적당했어요",
      likedTastes: ["신맛"],
      neededAdjustments: [] as string[],
      adjustmentDetail: {
        method: {
          minus: { name: "레몬 제스트 (Lemon Zest)", desc: "쓴맛을 줄였습니다 (-2g)", icon: "📉" },
          plus: { name: "유자청 (Yuzu)", desc: "달콤한 신맛을 더했습니다 (+5g)", icon: "📈" }
        },
        summary: [
          { taste: "신맛", value: 10, label: "신맛" },
          { taste: "쓴맛", value: -5, label: "쓴맛" }
        ],
        quote: "레몬 제스트의 쓴맛 대신,\n유자청의 향긋한 달콤함을 더해 산미를 부드럽게 잡았습니다.",
        evaluation: {
          question: "오늘 셰프의 전략(레몬 제스트 대신 유자청)은 어땠나요?",
          options: {
            positive: "향긋하고 좋아요",
            negative1: "너무 달아요",
            negative2: "신맛이 약해요"
          }
        }
      }
    }
  ]);

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
            <span className="text-[20px] font-bold text-[#0f0f0f] tracking-[-0.24px]">조정 히스토리</span>
            {hasHiddenHistory ? (
              <button
                type="button"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => setShowAllHistory((prev) => !prev)}
                aria-expanded={showAllHistory}
                aria-label={showAllHistory ? "조정 히스토리 접기" : "조정 히스토리 전체 보기"}
              >
                <span className="text-[11px] text-[#808080]">{showAllHistory ? "접기" : "전체 보기"}</span>
                {showAllHistory ? (
                  <ChevronUp className="w-3 h-3 text-[#3F3F3F]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#3F3F3F]" />
                )}
              </button>
            ) : null}
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 w-full">
            {visibleHistoryData.map((item, index) => (
              <HistoryCard key={index} history={item} onRate={handleRate} onClick={() => setSelectedId(item.id)} />
            ))}
          </div>

          <button
            type="button"
            className="w-full bg-white rounded-full p-[12px] mb-10 flex justify-between items-center cursor-pointer hover:bg-[#fafafa] transition-colors"
            onClick={() => setHistoryPageOpen(true)}
          >
            <span className="font-bold text-[14px] text-[#0f0f0f]">모든 정보 보기</span>
            <ChevronRight className="w-4 h-4 text-[#3F3F3F]" />
          </button>
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

function Content13() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-8 p-5 grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Content">
      <Section />
      <Section1 />
      <SectionAdjustmentHistory />

    </div>
  );
}

function SpecialNoteDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col w-full h-full bg-[#f3f3f3] relative overflow-y-auto no-scrollbar font-['Pretendard_Variable',sans-serif]">
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-50 bg-[#f3f3f3] border-b border-[#e7e7e7]">
        <button onClick={onBack} className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[#3F3F3F]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[15px] text-[#0f0f0f] leading-[18px]">특이사항</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">세부 미각 요소 기반 전달 포인트</span>
        </div>
      </div>

      <div className="flex flex-col gap-[12px] p-[20px]">
        <div className="bg-white rounded-[20px] p-[12px] flex items-start gap-[12px]">
          <div
            className="shrink-0 size-[42px] rounded-full"
            style={{ background: HOME_SPECIAL_NOTE_CIRCLE_GRADIENT }}
          />
          <div className="flex flex-col gap-[6px] min-w-0">
            <div className="flex flex-wrap gap-[6px] items-center">
              <span className="inline-flex items-center rounded-full bg-[#0f0f0f] px-[8px] py-[3px] text-[10px] font-semibold text-white">
                셰프 전달 포인트
              </span>
              <span className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-[#f3f3f3] px-[8px] py-[3px] text-[10px] font-semibold text-[rgba(15,15,15,0.7)]">
                {HOME_SPECIAL_NOTE_CARD.translationStatusLabel}
              </span>
            </div>
            <p className="font-bold text-[18px] leading-[1.25] text-[#0f0f0f]">
              {HOME_SPECIAL_NOTE_CARD.title}
            </p>
            <p className="text-[13px] leading-[1.5] text-[rgba(15,15,15,0.62)]">
              {HOME_SPECIAL_NOTE_CARD.serviceHint}
            </p>
          </div>
        </div>

        <SpecialNoteFeatureBody />
      </div>
    </div>
  );
}

function TasteProfileTrendChart() {
  return (
    <div className="w-full">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={HOME_TASTE_PROFILE_WEEKLY_SERIES}
            margin={{ top: 12, right: 12, bottom: 12, left: 0 }}
          >
            {HOME_TASTE_PROFILE_SUMMARY_DETAILS.map((detail) => {
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
        {HOME_TASTE_PROFILE_WEEKLY_SERIES.map((item) => (
          <span
            key={item.label}
            className="text-[10px] font-medium text-[rgba(15,15,15,0.42)]"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TasteProfileDetailScreen({ onBack }: { onBack: () => void }) {
  const maxAbsChange = Math.max(
    ...HOME_TASTE_PROFILE_OVERVIEW_VALUES.map((item) => Math.abs(item.change)),
  );

  return (
    <div className="flex flex-col w-full h-full bg-[#f3f3f3] relative overflow-y-auto no-scrollbar font-['Pretendard_Variable',sans-serif]">
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-50 bg-[#f3f3f3] border-b border-[#e7e7e7]">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[#3F3F3F]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[15px] text-[#0f0f0f] leading-[18px]">미각변화</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">최근 6일 반응 추세</span>
        </div>
      </div>

      <div className="flex flex-col gap-[12px] p-[20px]">
        <div className="bg-white rounded-[20px] p-[12px] flex items-start gap-[12px]">
          <div
            className="shrink-0 size-[42px] rounded-full"
            style={{ background: HOME_TASTE_PROFILE_CIRCLE_GRADIENT }}
          />
          <div className="flex flex-col gap-[6px] min-w-0">
            <div className="flex flex-wrap gap-[6px] items-center">
              <span className="inline-flex items-center rounded-full bg-[#0f0f0f] px-[8px] py-[3px] text-[10px] font-semibold text-white">
                이번 주 요약
              </span>
              <span className="inline-flex items-center rounded-full border border-[#e7e7e7] bg-[#f3f3f3] px-[8px] py-[3px] text-[10px] font-semibold text-[rgba(15,15,15,0.7)]">
                {HOME_TASTE_PROFILE_CARD.periodLabel}
              </span>
            </div>
            <p className="font-bold text-[18px] leading-[1.25] text-[#0f0f0f]">
              {HOME_TASTE_PROFILE_CARD.title}
            </p>
            <p className="text-[13px] leading-[1.5] text-[rgba(15,15,15,0.62)]">
              {HOME_TASTE_PROFILE_CARD.summary}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between gap-[12px]">
            <div>
              <p className="text-[14px] font-bold text-[#0f0f0f]">주간 추이</p>
              <p className="mt-[3px] text-[11px] leading-[1.45] text-[rgba(15,15,15,0.55)]">
                단맛과 감칠맛의 반응 변화가 가장 크게 흔들렸어요.
              </p>
            </div>
          </div>
          <TasteProfileTrendChart />
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[10px]">
          <div>
            <p className="text-[14px] font-bold text-[#0f0f0f]">핵심 변화</p>
            <p className="mt-[3px] text-[11px] leading-[1.45] text-[rgba(15,15,15,0.55)]">
              현재 컨디션에서 가장 크게 바뀐 두 포인트만 먼저 보여드려요.
            </p>
          </div>

          {HOME_TASTE_PROFILE_SUMMARY_DETAILS.map((detail) => (
            <div
              key={detail.detailLabel}
              className="flex gap-[10px] items-start rounded-[12px] bg-[#f7f7f7] px-[10px] py-[10px]"
            >
              <SpecialNoteArrowBox parentTaste={detail.parentTaste} trend={detail.trend} />
              <div className="flex min-w-0 flex-col gap-[4px]">
                <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
                  <p className="text-[13px] font-semibold text-[#0f0f0f]">
                    {detail.detailLabel}
                  </p>
                  <p
                    className="text-[12px] font-semibold"
                    style={{ color: getTasteColor(detail.parentTaste) }}
                  >
                    {detail.change}
                  </p>
                </div>
                <p className="text-[11px] leading-[1.45] text-[rgba(15,15,15,0.58)] break-keep">
                  {detail.cue}
                </p>
              </div>
            </div>
          ))}

          <p className="text-[11px] leading-[1.45] text-[rgba(15,15,15,0.55)] break-keep">
            {HOME_TASTE_PROFILE_CARD.serviceHint}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-[12px] flex flex-col gap-[12px] pb-[20px]">
          <div>
            <p className="text-[14px] font-bold text-[#0f0f0f]">전체 미각 분포</p>
            <p className="mt-[3px] text-[11px] leading-[1.45] text-[rgba(15,15,15,0.55)]">
              모든 미각의 변화량을 함께 보면 이번 주 반응의 중심이 더 분명해져요.
            </p>
          </div>

          <div className="flex flex-col gap-[10px]">
            {HOME_TASTE_PROFILE_OVERVIEW_VALUES.map((item) => {
              const barWidth = `${(Math.abs(item.change) / maxAbsChange) * 100}%`;
              const accentColor = getTasteColor(item.taste);
              const accentTint = getTasteTint(item.taste, 0.14);

              return (
                <div key={item.taste} className="flex items-center gap-[10px]">
                  <div className="w-[46px] shrink-0">
                    <span className="text-[12px] font-medium text-[rgba(15,15,15,0.72)]">
                      {item.taste}
                    </span>
                  </div>
                  <div className="flex-1 rounded-full bg-[#f3f3f3] h-[12px] overflow-hidden">
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
        <button onClick={onBack} className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20 text-[#3F3F3F]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bold text-[15px] text-[#0f0f0f] leading-[18px]">{data.menu}</span>
          <span className="font-medium text-[12px] text-gray-500 leading-[14px]">{data.chefName} 셰프 · {data.restaurant}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[24px] p-[20px]">
        {/* Section 1: Calibration Scope (Summary) */}
        <div className="flex flex-col gap-[12px]">
          <h3 className="font-bold text-[20px] text-[#0f0f0f]">조정 범위</h3>
          <div className="bg-[#f3f3f3] rounded-[20px] p-[12px] flex flex-col gap-4">
            <p className="text-[14px] text-[#0f0f0f] leading-snug font-medium">
              고객님의 <span className="font-bold">
                '{summary.map((s: any, i: number) => (
                  <React.Fragment key={i}>
                    <span style={{ color: tasteColors[s.label] || "#9333EA" }}>
                      {i === 0 && "높은 "}
                      {s.label}
                      {i === summary.length - 1 && " 민감도"}
                    </span>
                    {i < summary.length - 1 && <span className="text-[#0f0f0f]">, </span>}
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
                      className="text-[13px] font-bold"
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
                    <span className="text-[13px] text-[#555555] font-bold">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Chef's Solution (Method & Ingredients) */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[20px] text-[#0f0f0f]">셰프의 솔루션</h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Minus Card */}
            <div className="bg-[#f3f3f3] rounded-[20px] p-[12px] flex flex-col gap-[12px] transition-all hover:bg-[#eaeaea]">
              {/* Header: Icon + Label */}
              <div className="flex items-center gap-[6px]">
                <div className="relative shrink-0 size-[18px]">
                  <div className="absolute inset-0 rounded-[4px]" style={{ backgroundColor: tasteColors[minusTaste] || '#3B82F6' }}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                      <path d={svgPaths.p1157b300} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] text-[#0f0f0f] text-[14px]">줄였어요</p>
              </div>

              {/* Content: Text Left, Icon Right */}
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-[#0f0f0f] mb-1">{method.minus.name}</span>
                  <p className="text-[13px] text-[#666666] leading-snug">{method.minus.desc}</p>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex justify-center -my-3 z-10">
              <div className="bg-white p-2 rounded-full text-[#3F3F3F] shadow-sm">
                <ChevronDown size={20} />
              </div>
            </div>

            {/* Plus Card */}
            <div className="bg-[#f3f3f3] rounded-[20px] p-[12px] flex flex-col gap-[12px] transition-all hover:bg-[#eaeaea]">
              {/* Header: Icon + Label */}
              <div className="flex items-center gap-[6px]">
                <div className="relative shrink-0 size-[18px]">
                  <div className="absolute inset-0 rounded-[4px]" style={{ backgroundColor: tasteColors[plusTaste] || '#7C3AED' }}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                      <path d={svgPaths.p3d191ac0} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] text-[#0f0f0f] text-[14px]">대신 넣었어요</p>
              </div>

              {/* Content: Text Left, Icon Right */}
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-[#0f0f0f] mb-1">{method.plus.name}</span>
                  <p className="text-[13px] text-[#666666] leading-snug">{method.plus.desc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f3f3f3] p-4 rounded-[16px] mt-2">
            <p className="text-[13px] text-[#444444] italic text-center font-medium whitespace-pre-wrap">{quote}</p>
          </div>
        </div>

        {/* Section 3: Feedback Action */}
        <div className="flex flex-col gap-[16px] pb-10">
          <h3 className="font-bold text-[20px] text-[#0f0f0f]">나의 평가</h3>
          <p className="text-[14px] text-[#0f0f0f]">{evaluation.question}</p>

          <div className="flex flex-col gap-3">
            <button className="w-full py-[12px] rounded-[10px] bg-[#0f0f0f] text-white font-medium text-[14px] leading-normal shadow-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {evaluation.options.positive}
            </button>
            <div className="flex gap-3">
              <button className="flex-1 py-[12px] rounded-[10px] bg-[#f3f3f3] text-[#666666] font-medium text-[14px] leading-normal hover:bg-[#e0e0e0] transition-all">
                {evaluation.options.negative1}
              </button>
              <button className="flex-1 py-[12px] rounded-[10px] bg-[#f3f3f3] text-[#666666] font-medium text-[14px] leading-normal hover:bg-[#e0e0e0] transition-all">
                {evaluation.options.negative2}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Content14() {
  return (
    <div className="basis-0 bg-[#f3f3f3] content-stretch flex flex-col grow items-center min-h-px min-w-px overflow-y-auto no-scrollbar relative w-full h-full" data-name="Content">
      <Content13 />
    </div>
  );
}

function Viewport({ onStartMeasurement }: { onStartMeasurement?: () => void }) {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative w-full h-full overflow-hidden" data-name="Viewport">
      <div className="shrink-0 w-full">
        <TopAppBar onStartMeasurement={onStartMeasurement} />
      </div>
      <Content14 />
    </div>
  );
}

function Ratio12() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio13() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio12 />
        </div>
      </div>
    </div>
  );
}

function Ratio14() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio13 />
        </div>
      </div>
    </div>
  );
}

function Icons3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio14 />
      <div className="absolute inset-[8.33%_12.5%_12.49%_12.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
          <path d={svgPaths.p3d342380} fill="var(--fill-0, #3F3F3F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Contants() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="Contants">
      <Icons3 />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.429] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.8)] text-nowrap tracking-[0.145px] whitespace-pre">홈</p>
    </div>
  );
}

function Tab() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[10px] grow items-center justify-center min-h-px min-w-px px-0 py-[4px] relative shrink-0" data-name="Tab 1">
      <Contants />
    </div>
  );
}

function Ratio15() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio16() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio15 />
        </div>
      </div>
    </div>
  );
}

function Ratio17() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio16 />
        </div>
      </div>
    </div>
  );
}

function Icons4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio17 />
      <div className="absolute inset-[12.5%_8.33%_8.33%_8.33%]" data-name="Union">
        <div className="absolute inset-0" style={{ "--fill-0": "rgba(63, 63, 63, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19">
            <g id="Union">
              <path clipRule="evenodd" d={svgPaths.p28cd6d00} fill="#3F3F3F" fillRule="evenodd" />
              <path d={svgPaths.p42b0300} fill="#3F3F3F" />
              <path clipRule="evenodd" d={svgPaths.p3797e880} fill="#3F3F3F" fillRule="evenodd" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Contants1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="Contants">
      <Icons4 />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.429] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.8)] text-nowrap tracking-[0.145px] whitespace-pre">분석</p>
    </div>
  );
}

function Tab1() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[10px] grow items-center justify-center min-h-px min-w-px px-0 py-[4px] relative shrink-0" data-name="Tab 2">
      <Contants1 />
    </div>
  );
}

function Ratio18() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio19() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio18 />
        </div>
      </div>
    </div>
  );
}

function Ratio20() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio19 />
        </div>
      </div>
    </div>
  );
}

function Icons5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio20 />
      <div className="absolute h-[14px] left-[2px] top-[5px] w-[20px]" data-name="Union">
        <div className="absolute inset-0" style={{ "--fill-0": "rgba(63, 63, 63, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 14">
            <path clipRule="evenodd" d={svgPaths.p2ac50a00} fill="var(--fill-0, #3F3F3F)" fillRule="evenodd" id="Union" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Contants2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="Contants">
      <Icons5 />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.429] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.8)] text-nowrap tracking-[0.145px] whitespace-pre">메시지</p>
    </div>
  );
}

function Tab2() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[10px] grow items-center justify-center min-h-px min-w-px px-0 py-[4px] relative shrink-0" data-name="Tab 3">
      <Contants2 />
    </div>
  );
}

function Ratio21() {
  return <div className="h-full w-0" data-name="Ratio" />;
}

function Ratio22() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-center relative" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[12px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[330deg]">
          <Ratio21 />
        </div>
      </div>
    </div>
  );
}

function Ratio23() {
  return (
    <div className="absolute content-stretch flex flex-col h-[24px] items-start left-0 overflow-clip top-0" data-name="Ratio">
      <div className="basis-0 flex grow items-center justify-center min-h-px min-w-px relative shrink-0 w-[24px]" style={{ "--transform-inner-width": "12", "--transform-inner-height": "24" } as React.CSSProperties}>
        <div className="flex-none h-full rotate-[323.13deg]">
          <Ratio22 />
        </div>
      </div>
    </div>
  );
}

function PersonUndefinedGlyphUndefined() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Person / undefined / Glyph: undefined">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Person / undefined / Glyph: undefined">
          <path d={svgPaths.p242dc300} fill="var(--fill-0, #3F3F3F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icons6() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Ratio23 />
      <PersonUndefinedGlyphUndefined />
    </div>
  );
}

function Contants3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="Contants">
      <Icons6 />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.429] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.8)] text-nowrap tracking-[0.145px] whitespace-pre">프로필</p>
    </div>
  );
}

function Tab3() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[10px] grow items-center justify-center min-h-px min-w-px px-0 py-[4px] relative shrink-0" data-name="Tab 4">
      <Contants3 />
    </div>
  );
}

function Contents() {
  return (
    <div className="box-border content-stretch flex gap-[26px] items-center justify-center px-0 py-[4px] relative shrink-0 w-full" data-name="Contents">
      <Tab />
      <Tab1 />
      <Tab2 />
      <Tab3 />
    </div>
  );
}

function SpacingBottomSafeArea() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Spacing/Bottom Safe Area">
      <div className="h-[34px] shrink-0 w-full" data-name="Guide" />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="absolute bg-white inset-0" data-name="Background" />
      <Contents />
      <SpacingBottomSafeArea />
    </div>
  );
}

function OsBarBottomNavigationResourceContents() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="OS/Bar/Bottom Navigation/Resource/Contents">
      <Container1 />
    </div>
  );
}

function Shape() {
  return (
    <div className="absolute bottom-[8px] h-[5px] left-[32.13%] right-[32.13%]" data-name="Shape">
      <div className="absolute bottom-0 left-0 right-[-0.25%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 144 5">
          <path d={svgPaths.p130c0400} data-figma-bg-blur-radius="44" fill="var(--fill-0, #0F0F0F)" id="Union" />
        </svg>
      </div>
    </div>
  );
}

function HomeBarHomeIndicator() {
  return (
    <div className="h-[34px] relative shrink-0 w-full" data-name=".Home Bar/Home Indicator">
      <Shape />
    </div>
  );
}

function Content15() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center relative shrink-0 w-full" data-name="Content">
      <HomeBarHomeIndicator />
    </div>
  );
}

function HomeBar() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Home Bar">
      <Content15 />
    </div>
  );
}

function Absolute() {
  return (
    <div className="content-stretch flex flex-col h-0 items-center justify-end relative shrink-0 w-full" data-name="Absolute">
      <HomeBar />
    </div>
  );
}

function OsBarBottomNavigation() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="OS/Bar/Bottom Navigation">
      <Absolute />
    </div>
  );
}

function Container2() {
  return (
    <div className="backdrop-blur-[32px] backdrop-filter content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <OsBarBottomNavigationResourceContents />
      <OsBarBottomNavigation />
      <div className="h-0 shrink-0 w-full" data-name="Absolute" />
    </div>
  );
}

function BottomAppBars() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Bottom app bars">
      <Container2 />
      <div aria-hidden="true" className="absolute border-[#e7e7e7] border-[1px_0px_0px] border-solid bottom-0 left-0 pointer-events-none right-0 top-[-1px]" />
    </div>
  );
}

function OsBarBottomNavigation1() {
  return (
    <div className="content-stretch flex flex-col items-start justify-end relative shrink-0 w-full" data-name="OS/Bar/Bottom Navigation">
      <BottomAppBars />
    </div>
  );
}



export default function Home({
  onGoToAnalysis,
  onStartMeasurement,
}: {
  onGoToAnalysis?: () => void;
  onStartMeasurement?: () => void;
}) {
  // Store the callback globally so deeply nested components can use it
  if (onGoToAnalysis) {
    (window as any).__goToAnalysis = onGoToAnalysis;
  }

  return (
    <div className="w-full h-full bg-[#f3f3f3]">
      <div className="bg-[#f3f3f3] content-stretch flex flex-col items-start relative w-full h-full overflow-hidden" data-name="Home">
        <Viewport onStartMeasurement={onStartMeasurement} />
      </div>
    </div>
  );
}
