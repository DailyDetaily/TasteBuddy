import captureData from "./nativeLayoutCaptures.json";

export type LayoutRect = { x: number; y: number; width: number; height: number };
export type LayoutScreen = "home" | "dining" | "sheet";
export type NativeLayoutCapture = {
  id: string;
  screen: LayoutScreen;
  dynamicType: "large" | "accessibility2";
  keyboardVisible: boolean;
  status: "ready";
  file: string;
  sha256: string;
  width: number;
  height: number;
  safeArea: { top: number; right: number; bottom: number; left: number };
  frames: Partial<Record<string, LayoutRect>>;
  keyboardFrame?: LayoutRect;
};

export const nativeLayoutCaptures = captureData.captures as NativeLayoutCapture[];

export const layoutScreenGuides: Array<{
  id: LayoutScreen;
  title: string;
  description: string;
  regions: Array<{ key: string; label: string; note: string }>;
  sources: string[];
}> = [
  {
    id: "home",
    title: "홈",
    description: "상단 탐색·스크롤 본문·하단 탭의 영역을 실제 홈 화면에서 확인해요.",
    regions: [
      { key: "top-bar", label: "상단 탐색", note: "AppShellView가 홈의 검색과 상단 영역을 구성해요." },
      { key: "home-card", label: "인사이트 카드", note: "CompactSummaryCard는 132 × 132pt의 공용 카드 규격을 사용해요." },
      { key: "content", label: "스크롤 본문", note: "좌우 여백을 제외한 본문 전체 치수예요. 화면 아래로 이어지는 내용도 높이에 포함해요." },
      { key: "bottom-tab", label: "하단 탭", note: "탭의 높이와 기기의 하단 안전 영역을 구분해요." },
    ],
    sources: [
      "Components/Shell/AppShellView.swift · AppShellView",
      "Components/Shell/AppChromeComponents.swift · MainTabChromeScrollView",
      "Features/Home/HomeView.swift · HomeView",
      "Features/Home/HomeSummaryComponents.swift · CompactSummaryCard",
    ],
  },
  {
    id: "dining",
    title: "식사 기록",
    description: "메뉴 선택 화면에서 질문·스크롤하는 목록·다음 행동의 관계를 확인해요.",
    regions: [
      { key: "dining-header", label: "상단바", note: "TBFlowTopBar가 현재 흐름의 제목과 이전 화면으로 가는 행동을 표시해요." },
      { key: "dining-content", label: "질문과 메뉴 목록", note: "안내 헤더와 메뉴 목록의 전체 치수예요. 화면 아래로 이어지는 내용도 높이에 포함해요." },
      { key: "dining-footer", label: "고정 하단 행동", note: "다음 단계로 이동하는 행동을 화면 아래에 유지해요." },
      { key: "safe-area-bottom", label: "하단 안전 영역", note: "기기에서 받은 시스템 영역이며 콘텐츠 간격 토큰과 별개예요." },
    ],
    sources: [
      "Features/Dining/DiningView.swift · DiningFeedbackSheet / menuStep",
      "Components/TBComponents.swift · TBFlowTopBar / TBFlowBottomCTA / TBSelectionCard",
    ],
  },
  {
    id: "sheet",
    title: "계정 연결 시트",
    description: "실제 이메일 입력 시트의 헤더·본문·행동을 확인해요. 키보드가 열렸을 때 가려지는 영역도 함께 살펴보세요.",
    regions: [
      { key: "sheet-header", label: "시트 헤더", note: "닫기와 제목을 담는 공용 BottomSheetShell의 헤더예요." },
      { key: "sheet-input", label: "이메일 입력", note: "최소 48pt의 입력 영역과 안쪽 여백을 사용해요." },
      { key: "auth-primary-action", label: "주요 행동", note: "AuthEntrySheet가 키보드 높이에 따라 이 버튼의 위치를 조정해요." },
      { key: "sheet-footer", label: "푸터 영역", note: "푸터와 주요 행동의 위치는 키보드가 열리면 달라질 수 있어요." },
      { key: "keyboard", label: "시스템 키보드", note: "실제 iOS 키보드의 표시 영역이에요. 가려진 시트 부품에는 번호선을 표시하지 않아요." },
    ],
    sources: [
      "Components/Shell/AppShellView.swift · staged AuthEntrySheet",
      "Features/Auth/AuthEntryView.swift · AuthEntrySheet",
      "Components/SystemCoreComponents.swift · BottomSheetShell",
      "Components/NativeInputComponents.swift · TBTextInput",
    ],
  },
];

export function nativeLayoutRegion(capture: NativeLayoutCapture, key: string): LayoutRect | undefined {
  if (key === "safe-area-top") return { x: 0, y: 0, width: capture.width, height: capture.safeArea.top };
  if (key === "safe-area-bottom") return { x: 0, y: capture.height - capture.safeArea.bottom, width: capture.width, height: capture.safeArea.bottom };
  if (key === "keyboard") return capture.keyboardFrame;
  return capture.frames[key];
}

type SpacingMeasurement = { label: string; token: string; expected: string; actual?: number; note: string };

export function layoutSpacingMeasurements(capture: NativeLayoutCapture): SpacingMeasurement[] {
  const frame = (key: string) => nativeLayoutRegion(capture, key);
  const leftInset = (outer: string, inner: string) => {
    const a = frame(outer), b = frame(inner);
    return a && b ? b.x - a.x : undefined;
  };
  if (capture.screen === "home") {
    return [
      { label: "페이지 좌우", token: "TBSpacing.page", expected: "20pt", actual: frame("home-card")?.x, note: "가로 목록의 첫 카드가 놓인 위치를 화면 왼쪽에서 측정해요." },
      { label: "카드 안쪽", token: "RecommendationMiniCardMetrics.padding", expected: "12pt", actual: leftInset("home-card", "home-card-content"), note: "이 카드는 전용 Metrics의 12pt를 사용해요. 값이 같아도 TBSpacing.card를 직접 참조한 것으로 표기하지 않아요." },
      { label: "카드 너비", token: "RecommendationMiniCardMetrics.width", expected: "132pt", actual: frame("home-card")?.width, note: "132pt 중 양쪽 12pt를 제외한 콘텐츠 너비는 108pt예요." },
      { label: "카드 높이", token: "RecommendationMiniCardMetrics.height", expected: "132pt", actual: frame("home-card")?.height, note: "고정 높이의 카드라 큰 글자 상태에서는 줄바꿈·말줄임·겹침을 함께 확인해요." },
      { label: "섹션 사이", token: "TBSpacing.section", expected: "20pt", note: "HomeView의 본문 VStack에 적용된 소스값이에요." },
      { label: "같은 목록의 카드 사이", token: "TBSpacing.x12", expected: "12pt", note: "HomeSensorySummarySection의 CardScrollList에 적용된 소스값이에요." },
    ];
  }
  if (capture.screen === "dining") {
    return [
      { label: "본문의 좌우", token: "TBSpacing.page", expected: "20pt", actual: frame("dining-content")?.x, note: "질문과 메뉴 목록의 왼쪽 경계를 화면에서 측정해요." },
      { label: "메뉴 카드 사이", token: "TBSpacing.x12", expected: "12pt", note: "메뉴 목록의 VStack 간격이에요." },
      { label: "선택 카드 안쪽", token: "TBSelectionCard", expected: "16pt", note: "선택 표시와 문구를 감싸는 해당 컴포넌트의 padding 값이에요." },
      { label: "하단 행동 영역", token: "FlowBottomCtaMetrics.minHeight", expected: "140pt", actual: frame("dining-footer")?.height, note: "실제 사용처가 확보하는 높이와 PrimaryButton의 최소 높이 48pt는 다른 값이에요." },
      { label: "기기 하단 안전 영역", token: "safeAreaInsets.bottom", expected: "기기별 측정", actual: capture.safeArea.bottom, note: "화면 아래 시스템 영역의 실측값이에요." },
    ];
  }
  const keyboard = frame("keyboard"), action = frame("auth-primary-action");
  return [
    { label: "본문 좌우", token: "TBSpacing.page", expected: "20pt", actual: leftInset("sheet-header", "sheet-input"), note: "입력 영역과 시트 헤더 바깥 경계의 왼쪽 차이를 측정해요." },
    { label: "입력 높이", token: "TBTextInputVariant.auth.minimumHeight", expected: "최소 48pt", actual: frame("sheet-input")?.height, note: "글자가 커지면 최소값보다 더 많은 높이가 필요할 수 있어요." },
    { label: "주요 행동 높이", token: "PrimaryButton", expected: "최소 48pt", actual: action?.height, note: "버튼의 높이와 푸터 전체 높이는 구분해요." },
    { label: "키보드 위 간격", token: "AuthEntrySheet.emailPrimaryActionOffset", expected: "12pt 기준", actual: keyboard && action ? keyboard.y - action.y - action.height : undefined, note: "키보드가 열린 표본에서 버튼 아래와 키보드 위의 거리를 측정해요." },
    { label: "푸터 하단 여백", token: "BottomSheetShellMetrics.footerSafeAreaHeight", expected: "max(12, safeAreaBottom)", note: "액세서리가 없는 경우의 소스 규칙이에요. 키보드 이동은 AuthEntrySheet가 별도로 처리해요." },
  ];
}
