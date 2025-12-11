import React, { useState } from "react";
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
import { Star, StarHalf, Clock, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";







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
    bgColor: "#ffebcc"
  },
  {
    name: "이은지 셰프",
    restaurant: "숍 리제 (Lysée)",
    match: 72,
    image: chefLeeEunji,
    bgColor: "#fff7cc"
  },
  {
    name: "임정식 셰프",
    restaurant: "정식당",
    match: 70,
    image: chefLimJeongsik,
    bgColor: "#eaf4cc"
  },
  {
    name: "최현석 셰프",
    restaurant: "레스토랑 CHOI",
    match: 68,
    image: chefHyunseokChoi,
    bgColor: "#E6F0FF"
  },
  {
    name: "손종원 셰프",
    restaurant: "이타닉가든",
    match: 65,
    image: chefSonJongwon,
    bgColor: "#F0E3F0"
  },
  {
    name: "이준 셰프",
    restaurant: "스와니예",
    match: 62,
    image: chefLeeJun,
    bgColor: "#EAE7E4"
  }
];

function ChefCard({ chef }: { chef: typeof chefData[0] }) {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative rounded-[20px] shrink-0 w-[132px] h-[132px]"
      style={{ backgroundColor: chef.bgColor }}
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
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-[calc(100%+40px)] mx-[-20px] px-[20px] overflow-x-auto pb-4 no-scrollbar" data-name="Content">
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
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start p-[20px] relative w-full">
          <ChefList />
        </div>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="Heading">
      <p className="basis-0 font-['Pretendard_Variable:Bold',sans-serif] font-bold grow leading-[1.4] min-h-px min-w-px relative shrink-0 text-[20px] text-black tracking-[-0.24px]">미각 프로필</p>
    </div>
  );
}

function Content6() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[grey] text-nowrap text-right tracking-[0.3421px] whitespace-pre">이번 주</p>
      <div className="flex h-[4px] items-center justify-center relative shrink-0 w-[8px]" style={{ "--transform-inner-width": "4", "--transform-inner-height": "8" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
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

function MoreInfo2() {
  return (
    <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-name="More info">
      <Content6 />
    </div>
  );
}

function MoreInfo3() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0" data-name="More Info">
      <MoreInfo2 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex gap-[8px] items-end relative shrink-0 w-full" data-name="Heading">
      <Heading2 />
      <div className="flex flex-row items-end self-stretch">
        <MoreInfo3 />
      </div>
    </div>
  );
}

function TasteCircle() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Taste Circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Taste Circle">
          <circle cx="8" cy="8" fill="url(#paint0_linear_1_1996)" id="Ellipse 211" r="8" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1996" x1="8" x2="8" y1="0" y2="16">
            <stop offset="0.2" stopColor="#FF9900" />
            <stop offset="0.8" stopColor="#B372B4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Head() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">미각 변화</p>
    </div>
  );
}

function Content7() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap text-right tracking-[0.3421px] whitespace-pre">6.10-16일</p>
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

function ArrowBox() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Arrow Box">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 153, 0, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g id="Arrow Box">
            <rect fill="var(--fill-0, #FF9900)" height="18" rx="4" width="18" />
            <path d={svgPaths.p3d191ac0} id="Vector 222" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Info6() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox />
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">단맛 증가</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">+15.2%</p>
    </div>
  );
}

function ArrowBox1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Arrow Box">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(179, 114, 180, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g id="Arrow Box">
            <rect fill="var(--fill-0, #B372B4)" height="18" rx="4" width="18" />
            <path d={svgPaths.p1157b300} id="Vector 222" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex font-['Pretendard_Variable:Regular',sans-serif] font-normal gap-[2px] grow items-center leading-[0] min-h-px min-w-px relative shrink-0 text-[rgba(15,15,15,0.6)] text-nowrap">
      <div className="flex flex-col justify-center relative shrink-0 text-[12px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">감칠맛 감소</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[10px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">-10.7%</p>
      </div>
    </div>
  );
}

function Info7() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox1 />
      <Frame />
    </div>
  );
}

function Info8() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Info">
      <Info6 />
      <Info7 />
    </div>
  );
}

function Right2() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Right">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold h-[14px] justify-center leading-[0] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
        <p className="leading-[100.06%]">체중 감소에 따른</p>
      </div>
      <Info8 />
    </div>
  );
}

function GraphBottom() {
  return (
    <div className="absolute contents right-[13px] top-[calc(50%_+_21.22px)] translate-y-[-50%]" data-name="Graph Bottom">
      <div className="absolute h-[7.444px] right-[18px] top-[calc(50%_+_18.72px)] translate-y-[-50%] w-[100px]">
        <div className="absolute inset-[-67.16%_-5%_-67.17%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 110 18">
            <path d={svgPaths.p3020d880} id="Vector 152" stroke="var(--stroke-0, #F0E3F0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[7.444px] right-[18px] top-[calc(50%_+_18.72px)] translate-y-[-50%] w-[100px]">
        <div className="absolute inset-[-13.43%_-1%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 102 10">
            <path d={svgPaths.p3255eb00} id="Vector 168" stroke="url(#paint0_linear_5_7582)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_5_7582" x1="-39" x2="101" y1="3.44446" y2="3.44446">
                <stop stopColor="#E8D5E9" />
                <stop offset="1" stopColor="#B576B6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute right-[13px] size-[10px] top-[calc(50%_+_22.44px)] translate-y-[-50%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #B372B4)" id="Ellipse 210" r="5" />
        </svg>
      </div>
    </div>
  );
}

function GraphTop() {
  return (
    <div className="absolute contents right-[13px] top-[calc(50%_-_13.5px)] translate-y-[-50%]" data-name="Graph Top">
      <div className="absolute h-[12px] right-[18px] top-[calc(50%_-_11px)] translate-y-[-50%] w-[100px]">
        <div className="absolute inset-[-41.68%_-5%_-41.67%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 110 22">
            <path d={svgPaths.p3d90bd00} id="Vector 150" stroke="var(--stroke-0, #FFEBCC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[12px] right-[18px] top-[calc(50%_-_11px)] translate-y-[-50%] w-[100px]">
        <div className="absolute inset-[-8.34%_-1%_-8.33%_-1%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 102 14">
            <path d={svgPaths.p16e45b04} id="Vector 153" stroke="url(#paint0_linear_5_7592)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_5_7592" x1="-39" x2="101" y1="8.50024" y2="8.50024">
                <stop stopColor="#FFDFAF" />
                <stop offset="1" stopColor="#FF9900" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute right-[13px] size-[10px] top-[calc(50%_-_17px)] translate-y-[-50%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #FF9900)" id="Ellipse 203" r="5" />
        </svg>
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents right-[13px] top-[calc(50%_+_2.72px)] translate-y-[-50%]">
      <GraphBottom />
      <GraphTop />
    </div>
  );
}

function MeasureGraph() {
  return (
    <div className="basis-0 grow h-[62px] min-h-px min-w-px relative shrink-0" data-name="Measure Graph">
      <Group8 />
    </div>
  );
}

function Content8() {
  return (
    <div className="content-start flex flex-wrap gap-[12px] items-start justify-between min-w-[311px] relative shrink-0 w-full" data-name="Content">
      <Right2 />
      <MeasureGraph />
    </div>
  );
}

function Cards3() {
  return (
    <div className="bg-[#f3f3f3] h-auto relative rounded-[20px] shrink-0 w-full" data-name="Cards">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <Heading4 />
          <Content8 />
        </div>
      </div>
    </div>
  );
}

function TasteCircle1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Taste Circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Taste Circle">
          <circle cx="8" cy="8" fill="url(#paint0_linear_1_1973)" id="Ellipse 211" r="8" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1973" x1="8" x2="8" y1="0" y2="16">
            <stop offset="0.2" stopColor="#B372B4" />
            <stop offset="0.8" stopColor="#95867A" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Head1() {
  return (
    <div className="flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle1 />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">특이 사항</p>
    </div>
  );
}

function Content9() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[1.273] relative shrink-0 text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap text-right tracking-[0.3421px] whitespace-pre">6.10-16일</p>
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

function ArrowBox2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Arrow Box">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(179, 114, 180, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g id="Arrow Box">
            <rect fill="var(--fill-0, #B372B4)" height="18" rx="4" width="18" />
            <path d={svgPaths.p3d191ac0} id="Vector 222" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Info9() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox2 />
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">구아닐산 증가</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">+5.2%</p>
    </div>
  );
}

function ArrowBox3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Arrow Box">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(149, 134, 122, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g id="Arrow Box">
            <rect fill="var(--fill-0, #95867A)" height="18" rx="4" width="18" />
            <path d={svgPaths.p1157b300} id="Vector 222" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="basis-0 content-stretch flex font-['Pretendard_Variable:Regular',sans-serif] font-normal gap-[2px] grow items-center leading-[0] min-h-px min-w-px relative shrink-0 text-[rgba(15,15,15,0.6)] text-nowrap">
      <div className="flex flex-col justify-center relative shrink-0 text-[12px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">글루탐산 감소</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[10px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">-14.3%</p>
      </div>
    </div>
  );
}

function Info10() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox3 />
      <Frame1 />
    </div>
  );
}

function Info11() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Info">
      <Info9 />
      <Info10 />
    </div>
  );
}

function Right4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Right">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold h-[14px] justify-center leading-[0] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
        <p className="leading-[100.06%]">발효식품에 민감함</p>
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

function Cards4() {
  return (
    <div className="bg-[#f3f3f3] h-auto relative rounded-[20px] shrink-0 w-full" data-name="Cards">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] h-auto items-start p-[12px] relative w-full">
          <Heading5 />
          <Content10 />
        </div>
      </div>
    </div>
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

function Content12() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Content">
      <Cards3 />
      <Cards4 />
      <Cards5 />
    </div>
  );
}

function TasteProfile() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Taste Profile">
      <Heading3 />
      <Content12 />
    </div>
  );
}

function Section1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start p-[20px] relative w-full">
          <TasteProfile />
        </div>
      </div>
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






function HistoryCard({ history, onRate, onClick }: { history: any, onRate: (id: number, rating: number, action?: boolean | "toggle" | "edit" | { type: string, value: any }) => void, onClick: () => void }) {
  const getTasteColor = (taste: string) => {
    const tasteColors: { [key: string]: string } = {
      "단맛": "#FF9900",
      "신맛": "#FBC02D",
      "쓴맛": "#95C900",
      "짠맛": "#7299FF",
      "감칠맛": "#B372B4",
      "지방맛": "#95867A"
    };
    return tasteColors[taste] || "#FF9900";
  };

  const getTasteGradient = (adjustments: any[]) => {
    const tasteColors: { [key: string]: string } = {
      "단맛": "#FFCC80", // Desaturated/Lighter Orange
      "신맛": "#FDD835", // Desaturated/Lighter Yellow
      "쓴맛": "#E6EE9C", // Desaturated/Lighter Lime
      "짠맛": "#90CAF9", // Desaturated/Lighter Blue
      "감칠맛": "#CE93D8", // Desaturated/Lighter Purple
      "지방맛": "#BCAAA4"  // Desaturated/Lighter Brown
    };

    if (adjustments.length === 0) return "#E0E0E0";

    if (adjustments.length === 1) {
      const color = tasteColors[adjustments[0].taste] || "#FFCC80";
      return `linear-gradient(135deg, ${color}, ${color})`;
    }

    const colors = adjustments.map((adj: any) => tasteColors[adj.taste] || "#E0E0E0");
    return `linear-gradient(135deg, ${colors.join(', ')})`;
  };

  return (
    <div className="bg-[#f3f3f3] relative rounded-[20px] shrink-0 w-full" data-name="History Card">
      <div className="overflow-clip rounded-[inherit] size-full cursor-pointer" onClick={onClick}>
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <div className="flex items-center gap-2 w-full">
            <span
              className="text-white text-[10px] px-[6px] py-[2px] rounded-[6px] font-bold relative shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]"
              style={{
                background: getTasteGradient(history.adjustments),
              }}
            >
              TCS
            </span>
            <p className="font-bold text-[14px]">{history.menu}</p>
            <div className="grow" />
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[11px] text-[#808080]">자세히</span>
              <ChevronRight className="w-3 h-3 text-[#808080]" />
            </div>
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
              <div
                key={idx}
                className="bg-white rounded-[100px] px-[8px] py-[4px] flex gap-[4px] items-center"
              >
                <p className="font-medium text-[10px] text-[#0f0f0f]">
                  {adj.taste}
                </p>
                <p
                  className="font-semibold text-[10px]"
                  style={{ color: getTasteColor(adj.taste) }}
                >
                  {adj.change}
                </p>
              </div>
            ))}
          </div>




        </div>
      </div>
    </div>
  );
}

function SectionAdjustmentHistory() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  return (
    <div className="relative shrink-0 w-full mb-10" data-name="Section">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start p-[20px] gap-[12px] relative w-full">
          {/* Section Header */}
          <div className="flex justify-between items-end w-full mb-2">
            <span className="text-[20px] font-bold text-[#0f0f0f] tracking-[-0.24px]">조정 히스토리</span>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[11px] text-[#808080]">전체 보기</span>
              <ChevronDown className="w-3 h-3 text-[#808080]" />
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 w-full">
            {historyData.map((item, index) => (
              <HistoryCard key={index} history={item} onRate={handleRate} onClick={() => setSelectedId(item.id)} />
            ))}
          </div>

          <div className="w-full bg-[#f3f3f3] rounded-full p-[12px] flex justify-between items-center cursor-pointer">
            <span className="font-bold text-[14px] text-[#0f0f0f]">모든 정보 보기</span>
            <ChevronRight className="w-4 h-4 text-[#808080]" />
          </div>
        </div>
      </div>

      {/* Detail Screen Overlay */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-white">
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
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Content">
      <Section />
      <Section1 />
      <SectionAdjustmentHistory />

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
      <div className="flex items-center px-[20px] py-[12px] max-h-[56px] sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#f3f3f3]">
        <button onClick={onBack} className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors z-20">
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

          <div className="flex flex-col gap-4">
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
              <div className="bg-white p-2 rounded-full text-gray-400 border border-[#f3f3f3] shadow-sm">
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

          <div className="bg-white p-4 rounded-[16px] border border-[#f3f3f3] shadow-[0_2px_12px_rgba(0,0,0,0.04)] mt-2">
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
    <div className="basis-0 bg-white content-stretch flex flex-col grow items-center min-h-px min-w-px overflow-y-auto no-scrollbar relative w-full h-full" data-name="Content">
      <Content13 />
    </div>
  );
}

function Viewport() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative w-full h-full overflow-hidden" data-name="Viewport">
      <OsBarTopNavigationResourceContents />
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



export default function Home() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="bg-white content-stretch flex flex-col items-start relative w-full h-full max-w-[1440px] shadow-2xl overflow-hidden" data-name="Home">
        <Viewport />
        <OsBarBottomNavigation1 />
      </div>
    </div>
  );
}