import captureData from "./nativeTypographyCaptures.json";

export type TypographyCapture = {
  id: string;
  kind: "role" | "dynamic" | "usage";
  category: "large" | "xxxLarge" | "accessibility2";
  file: string;
  width: number;
  height: number;
};
export type TypographyFontMetric = {
  role: string;
  postScriptName: string;
  familyName: string;
  baseSize: number;
  lineHeight: number;
  ascender: number;
  descender: number;
  capHeight: number;
};
export const nativeTypography = captureData as { platform: string; captures: TypographyCapture[]; fonts: TypographyFontMetric[] };

type TypographyRecipe = {
  id: string;
  title: string;
  component: string;
  description: string;
  rows: [role: string, font: string, color: string, layout: string][];
  note: string;
  sources: string[];
};

export const typographyRecipes: TypographyRecipe[] = [
  {
    id: "usage-home", title: "홈 · 인사이트 요약", component: "CompactSummaryCard",
    description: "미각 배경 위에서 제목·값·하단 안내의 굵기와 크기를 구분해요.",
    rows: [
      ["카드 제목", "14pt · Bold", "axis.tintTextColor", "1줄 · 말줄임"],
      ["부제·값", "14pt · SemiBold", "axis.tintSubTextColor", "1줄 · 말줄임"],
      ["보조 문구 · detail", "10pt · Regular", "axis.tintTextColor", "현재 구현 1줄 · 작성 기준 기본 2줄"],
    ],
    note: "UX 라이팅 기준은 기본 2줄이에요. 윗줄은 핵심 값을 보완하는 사실·상태, 아랫줄은 기간·대상·비교 기준을 담아요. 각 줄은 필수 정보 한 가지를 짧은 구절로 쓰며 제목·값을 반복하지 않아요. 그래프와 나란히 놓을 때 텍스트는 카드 절반 이내에서 전체 2줄을 넘지 않게 다듬어요. 추가할 필수 기준이 없으면 아랫줄을 억지로 채우지 않아요. 이 기준의 제품 적용은 별도이며 현재 CompactSummaryCard 표본은 한 줄 구현이에요.",
    sources: ["Features/Home/HomeSummaryComponents.swift · CompactSummaryCard", "Components/SystemParityComponents.swift · RecommendationMiniCardTextLayout", "docs/design/summary-card-ux-writing.md · 요약 카드 UX 라이팅 규칙"],
  },
  {
    id: "usage-dining", title: "식사 기록 · 메뉴 선택", component: "DiningFeedbackIntroHeader + PrimaryButton",
    description: "질문을 먼저 읽고 설명·상황 안내·다음 행동으로 이어지게 해요.",
    rows: [
      ["질문", "18pt · Bold", "textPrimary", "추가 행간 2pt"],
      ["안내 본문", "14pt · Regular", "textBody", "추가 행간 5pt"],
      ["상황 설명", "12pt · Regular", "textHint", "추가 행간 4pt"],
      ["주요 행동", "14pt · SemiBold", "actionOnPrimary", "최소 높이 48pt"],
    ],
    note: "이 본문은 TBTextStyle.body와 크기는 같지만 추가 행간이 5pt예요. 기존 화면의 조합을 설명하며, 공용 body 역할의 4pt 규격을 바꾸지는 않아요.",
    sources: ["Features/Dining/DiningView.swift · DiningFeedbackIntroHeader / 메뉴 선택 CTA", "Components/TBComponents.swift · PrimaryButton"],
  },
  {
    id: "usage-analysis", title: "분석 · 질문 카드", component: "TasteQuestionStackCard",
    description: "질문·보조 설명·답변의 위계를 유지하면서 펼침과 글자 확대에 대응해요.",
    rows: [
      ["질문", "14pt · SemiBold", "textPrimary", "기본 2줄 · 접근성 크기에서 제한 해제"],
      ["보조 설명", "11pt · Regular", "textHint", "기본 1줄 · 최소 축소 0.85"],
      ["상단 라벨", "11pt · Medium", "textSecondary", "선택적으로 표시"],
      ["답변 선택지", "11pt · SemiBold", "textSecondary / selectionText", "최소 높이 48pt"],
    ],
    note: "실제 질문 카드는 접근성 글자 크기에서 답변을 세로로 배치하고 보조 설명의 줄 제한도 해제해요. 이 표본은 글자 조합을 추출한 예시이며 카드의 펼침·질문 상태 전체를 재현하지 않아요.",
    sources: ["Features/Analysis/SensoryAnalysisCards.swift · TasteQuestionStackCard", "Components/SystemParityComponents.swift · ChipSize.small"],
  },
];

export const componentTextRecipes = [
  ["화면 상단 제목", "15pt · Bold", "textPrimary", "TopAppBar / TBFlowTopBar", "1줄"],
  ["흐름 제목", "16 / 18pt · Bold", "textPrimary", "TBFlowHeaderBlock", "추가 행간 1pt"],
  ["기본 버튼", "14pt · SemiBold", "actionOnPrimary", "PrimaryButton", "최소 높이 48pt"],
  ["Compact 버튼", "12pt · SemiBold", "actionOnPrimary", "PrimaryButton(.compact)", "최소 높이 40pt"],
] as const;
