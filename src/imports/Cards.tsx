import svgPaths from "./svg-lcymr56wxc";

function TasteCircle() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Taste Circle">
      <div className="absolute inset-[-7.14%]">
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
    </div>
  );
}

function Head() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Head">
      <TasteCircle />
      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">특이 사항</p>
    </div>
  );
}

function Content() {
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

function MoreInfo() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="More info">
      <Content />
    </div>
  );
}

function Right() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-[59px]" data-name="Right">
      <MoreInfo />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-center flex flex-wrap gap-[187px] items-center justify-between min-w-[311px] relative shrink-0 w-full" data-name="Heading">
      <Head />
      <Right />
    </div>
  );
}

function ArrowBox() {
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

function Info() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox />
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">구아닐산 증가</p>
      <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">+5.2%</p>
    </div>
  );
}

function ArrowBox1() {
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

function Frame() {
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

function Info1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Info">
      <ArrowBox1 />
      <Frame />
    </div>
  );
}

function Info2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Info">
      <Info />
      <Info1 />
    </div>
  );
}

function Right1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Right">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold h-[14px] justify-center leading-[0] relative shrink-0 text-[#0f0f0f] text-[16px] w-full">
        <p className="leading-[100.06%]">발효식품에 민감함</p>
      </div>
      <Info2 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents right-[100px] top-[42px]">
      <div className="absolute flex h-[10px] items-center justify-center right-[105px] top-[47px] w-0">
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
      <div className="absolute right-[100px] size-[10px] top-[42px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #FF9900)" id="Ellipse 215" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[105px] text-[6px] text-center text-white top-[46.5px] translate-x-[50%] translate-y-[-50%] w-[10px]">
        <p className="leading-[normal]">1</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents right-[80px] top-[22px]">
      <div className="absolute flex h-[30px] items-center justify-center right-[85px] top-[27px] w-0">
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
      <div className="absolute right-[80px] size-[10px] top-[22px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #FFD600)" id="Ellipse 216" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[85px] size-[10px] text-[6px] text-center text-white top-[27px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">3</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents right-[20px] top-[12px]">
      <div className="absolute flex h-[40px] items-center justify-center right-[25px] top-[17px] w-0">
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
      <div className="absolute right-[20px] size-[10px] top-[12px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #B372B4)" id="Ellipse 219" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[25px] size-[10px] text-[6px] text-center text-white top-[17px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">4</p>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents right-0 top-[2px]">
      <div className="absolute flex h-[50px] items-center justify-center right-[5px] top-[7px] w-0">
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
      <div className="absolute right-0 size-[10px] top-[2px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #95867A)" id="Ellipse 220" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[5px] size-[10px] text-[6px] text-center text-white top-[7px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">5</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents right-[60px] top-[32px]">
      <div className="absolute flex h-[20px] items-center justify-center right-[65px] top-[37px] w-0">
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
      <div className="absolute right-[60px] size-[10px] top-[32px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #95C900)" id="Ellipse 217" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[65px] size-[10px] text-[6px] text-center text-white top-[37px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">2</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents right-[40px] top-[32px]">
      <div className="absolute flex h-[20px] items-center justify-center right-[45px] top-[37px] w-0">
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
      <div className="absolute right-[40px] size-[10px] top-[32px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <circle cx="5" cy="5" fill="var(--fill-0, #7299FF)" id="Ellipse 218" r="5" />
        </svg>
      </div>
      <div className="absolute flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] right-[45px] size-[10px] text-[6px] text-center text-white top-[37px] translate-x-[50%] translate-y-[-50%]">
        <p className="leading-[normal]">2</p>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents right-0 top-[2px]">
      <Group />
      <Group1 />
      <Group4 />
      <Group5 />
      <Group2 />
      <Group3 />
    </div>
  );
}

function MeasureGraph() {
  return (
    <div className="basis-0 grow h-[62px] min-h-px min-w-px relative shrink-0" data-name="Measure Graph">
      <Group6 />
    </div>
  );
}

function Content1() {
  return (
    <div className="content-start flex flex-wrap gap-[12px] items-start justify-between min-w-[311px] relative shrink-0 w-full" data-name="Content">
      <Right1 />
      <MeasureGraph />
    </div>
  );
}

export default function Cards() {
  return (
    <div className="bg-[#f3f3f3] relative rounded-[20px] size-full" data-name="Cards">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[12px] relative size-full">
          <Heading />
          <Content1 />
        </div>
      </div>
    </div>
  );
}