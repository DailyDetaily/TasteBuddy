import snapshot from "./ios-foundations.generated.json";

type Metric = { name: string; value: number };
type NativeColor = { name: string; value: string; alias?: string };
export type NativeTextRole = {
  name: string;
  size: number;
  weight: string;
  additionalLineSpacing: number;
  color: string;
};
export type NativeTaste = {
  id: string;
  label: string;
  main: string;
  tintSurface: string;
  tintText: string;
  gradient: string[];
};
export const IOS_FOUNDATIONS = snapshot as {
  sources: { path: string; sha256: string }[];
  colors: NativeColor[];
  spacing: Metric[];
  radius: Metric[];
  sizes: Metric[];
  typography: {
    fontSizes: Metric[];
    weights: Record<string, number>;
    lineHeights: Metric[];
    letterSpacing: Metric[];
    roles: NativeTextRole[];
  };
  tastes: NativeTaste[];
  controlFeedback: {
    pressDistance: number;
    widthBasisDivisor: number;
    minimumBasis: number;
    primaryOpacity: number;
    neutralOpacity: number;
    durationMs: number;
  };
};
export const TASTE_COLOR_INTENTS: Record<
  string,
  { colorName: string; rationale: string }
> = {
  sweet: {
    colorName: "따뜻한 주황",
    rationale:
      "잘 익은 과일과 꿀에서 떠오르는 따뜻하고 풍부한 인상을 주황으로 표현해요.",
  },
  sour: {
    colorName: "선명한 노랑",
    rationale:
      "레몬 같은 감귤류의 산뜻한 인상을 담아요. 선명한 노랑으로 신맛의 또렷하고 경쾌한 성격을 표현해요.",
  },
  bitter: {
    colorName: "식물을 떠올리는 황록",
    rationale:
      "잎채소와 허브에서 떠오르는 식물적인 인상을 담아, 쌉싸름한 감각을 황록색으로 표현해요.",
  },
  salty: {
    colorName: "맑은 파랑",
    rationale:
      "바다와 소금의 연결을 담은 파랑이에요. 따뜻한 계열의 단맛·신맛과 구분되도록 차가운 계열을 사용해요.",
  },
  umami: {
    colorName: "차분한 보라색",
    rationale:
      "여러 풍미가 어우러지는 인상을 차분한 보라색으로 표현해요. 다른 미각색과 구분되는 계열로 감칠맛의 자리를 만들어요.",
  },
  fat: {
    colorName: "따뜻한 브라운",
    rationale:
      "견과와 오일에서 떠오르는 차분한 인상을 담아요. 채도가 낮은 브라운으로 지방맛을 구분하고, 선명한 미각색 사이에서 팔레트의 균형을 잡아요.",
  },
};
export const COLOR_GROUPS = {
  background: "페이지 배경",
  surface: "서페이스",
  text: "텍스트",
  border: "경계",
  icon: "아이콘",
  state: "상태 안내",
  interaction: "행동과 선택",
  scrim: "딤",
} as const;
type ColorGroup = keyof typeof COLOR_GROUPS;
const colorMeta: Record<string, [ColorGroup, string]> = {
  page: ["background", "페이지의 기본 바탕"],
  focus: ["background", "집중 영역의 바탕"],
  surface: ["surface", "기본 콘텐츠와 카드의 표면"],
  surfaceHover: ["surface", "포인터가 올라간 표면"],
  mutedSurface: ["surface", "보조 콘텐츠 표면"],
  elevatedSurface: ["surface", "떠 있는 콘텐츠 표면"],
  disabledSurface: ["surface", "비활성 요소의 표면"],
  overlaySurface: ["surface", "배경이 비치는 밝은 표면"],
  placeholderSurface: ["surface", "로딩·이미지 자리 채움의 중립 표면"],
  inverseSurface: ["surface", "밝은 글자를 받치는 어두운 표면"],
  textPrimary: ["text", "주요 제목과 핵심 정보"],
  textSecondary: ["text", "보조적인 주요 정보"],
  textTertiary: ["text", "세 번째 위계의 정보"],
  textBody: ["text", "일반 본문과 설명"],
  textAction: ["text", "실행 가능한 보조 행동"],
  textHint: ["text", "짧은 입력 힌트"],
  textDisabled: ["text", "실제 비활성 상태의 글자"],
  textSubtle: ["text", "투명도 60%의 보조 글자"],
  textMuted: ["text", "투명도 50%의 보조 글자"],
  textFaint: ["text", "투명도 40%의 약한 글자"],
  textInverse: ["text", "어두운 표면 위 글자"],
  borderCard: ["border", "카드의 약한 경계"],
  borderSubtle: ["border", "반복되는 요소의 구분"],
  border: ["border", "기본 경계"],
  borderStrong: ["border", "강조된 경계"],
  borderDisabled: ["border", "비활성 요소의 경계"],
  borderAvatar: ["border", "아바타의 경계"],
  borderAvatarSoft: ["border", "아바타의 약한 경계"],
  iconPrimary: ["icon", "기본 아이콘"],
  iconHover: ["icon", "포인터가 올라간 아이콘"],
  iconMuted: ["icon", "약하게 표시하는 아이콘"],
  success: ["state", "성공 안내의 전경"],
  successSoft: ["state", "성공 안내의 바탕"],
  warning: ["state", "주의 안내의 전경"],
  warningSoft: ["state", "주의 안내의 바탕"],
  destructive: ["state", "오류와 삭제"],
  neutral: ["state", "일반 안내의 글자와 아이콘"],
  neutralSoft: ["state", "일반 안내의 바탕; 비활성 상태와 구분"],
  informative: ["state", "부가 정보의 글자와 아이콘"],
  informativeSoft: ["state", "부가 정보를 받치는 밝은 중립 바탕"],
  successText: ["state", "성공 배경 위 작은 글자"],
  successStrong: ["state", "흰색 글자를 받치는 성공 채움 표면"],
  warningStrong: ["state", "흰색 글자를 받치는 주의 채움 표면"],
  destructiveText: ["state", "오류 배경과 누름 상태 위 작은 글자"],
  warningText: ["state", "주의 배경 위 작은 글자"],
  destructiveSoft: ["state", "오류·삭제 안내의 바탕"],
  actionPrimary: ["interaction", "주요 행동 버튼의 바탕"],
  actionOnPrimary: ["interaction", "주요 행동 버튼 위 글자와 아이콘"],
  selectionSurface: ["interaction", "선택한 칩·컨트롤을 채우는 바탕"],
  selectionText: ["interaction", "선택한 바탕 위 글자와 아이콘"],
  focusRing: ["interaction", "키보드 초점과 입력 초점을 표시하는 경계"],
  hoverOverlay: ["interaction", "밝은 표면의 포인터 반응 · 검정 4%"],
  pressedOverlay: ["interaction", "밝은 표면의 누름 반응 · 검정 6%"],
  pressedInverseOverlay: ["interaction", "어두운 표면의 누름 반응 · 흰색 10%"],
  scrimSubtle: ["scrim", "가벼운 맥락 안내 뒤의 딤 · 검정 35%"],
  scrimDefault: ["scrim", "확인 대화상자 뒤의 기본 딤 · 검정 50%"],
  scrimStrong: ["scrim", "독립된 작업 시트 뒤의 강한 딤 · 검정 60%"],
};
export const NATIVE_COLORS = IOS_FOUNDATIONS.colors.map((color) => {
  const metadata = colorMeta[color.name];
  if (!metadata)
    throw new Error("Missing iOS color documentation: " + color.name);
  return {
    ...color,
    group: metadata[0],
    label: metadata[1],
    code: "TBColor." + color.name,
  };
});
export function nativeColor(name: string) {
  const color = NATIVE_COLORS.find((item) => item.name === name);
  if (!color) throw new Error("Unknown iOS color: " + name);
  return color.value;
}
export function nativeMetric(
  group: "spacing" | "radius" | "sizes",
  name: string,
) {
  const metric = IOS_FOUNDATIONS[group].find((item) => item.name === name);
  if (!metric) throw new Error("Unknown iOS metric: " + group + "." + name);
  return metric.value;
}
export const TEXT_ROLE_LABELS: Record<
  string,
  { label: string; sample: string }
> = {
  sectionTitle: { label: "섹션 제목", sample: "최근에 발견한 입맛" },
  subsectionTitle: { label: "하위 제목", sample: "함께 나타난 감각" },
  sheetTitle: { label: "시트 제목", sample: "식사 기록 수정" },
  body: {
    label: "본문",
    sample: "같은 음식도 그날의 조리법과 상황에 따라 다르게 느낄 수 있어요.",
  },
  caption: { label: "보조 설명", sample: "최근 1개월 · 예시 기록 3개" },
  detailAction: { label: "상세 행동", sample: "기록 살펴보기" },
};
export const FOUNDATION_TOPICS = [
  {
    group: "start",
    slug: "foundations/design-tokens",
    title: "디자인 토큰",
    description: "iOS의 이름과 실제 값, 역할과 사용법을 연결해요.",
    kind: "tokens",
  },
  {
    group: "visual",
    slug: "foundations/colors",
    title: "색상",
    description: "미각색의 디자인 의도와 뉴트럴 계열의 역할을 알아봐요.",
    kind: "colors",
  },
  {
    group: "visual",
    slug: "foundations/typography",
    title: "타이포그래피",
    description: "제목과 본문을 iOS의 글자 역할로 구성해요.",
    kind: "type",
  },
  {
    group: "visual",
    slug: "foundations/layout",
    title: "레이아웃",
    description: "화면 영역과 안전 영역, 스크롤의 역할을 정해요.",
    kind: "layout",
  },
  {
    group: "visual",
    slug: "foundations/spacing",
    title: "스페이싱",
    description: "iOS 간격의 실제 값과 용도별 이름을 선택해요.",
    kind: "spacing",
  },
  {
    group: "visual",
    slug: "foundations/radius",
    title: "반경",
    description: "카드·버튼·시트의 형태와 포함 관계를 살펴봐요.",
    kind: "radius",
  },
  {
    group: "visual",
    slug: "foundations/elevation",
    title: "레이어",
    description: "화면과 시트가 겹치는 범위와 표시 소유권을 정해요.",
    kind: "elevation",
  },
  {
    group: "visual",
    slug: "foundations/icons",
    title: "아이콘과 이미지",
    description: "행동과 경험의 맥락을 알아보기 쉽게 전해요.",
    kind: "icons",
  },
  {
    group: "experience",
    slug: "foundations/state",
    title: "상태",
    description: "선택과 입력, 실행 가능 여부의 조합을 정의해요.",
    kind: "state",
  },
  {
    group: "experience",
    slug: "foundations/feedback",
    title: "누름 피드백",
    description: "표면색과 크기로 누름·취소에 응답해요.",
    kind: "feedback",
  },
  {
    group: "experience",
    slug: "writing",
    title: "콘텐츠와 라이팅",
    description: "기록의 범위 안에서 구체적으로 말해요.",
    kind: "writing",
  },
  {
    group: "experience",
    slug: "motion",
    title: "인터랙션과 모션",
    description: "입력과 변화, 시작과 종료를 연결해요.",
    kind: "motion",
  },
  {
    group: "experience",
    slug: "accessibility",
    title: "접근성",
    description: "다른 입력과 읽기 방식에서도 같은 정보를 전해요.",
    kind: "access",
  },
] as const;
