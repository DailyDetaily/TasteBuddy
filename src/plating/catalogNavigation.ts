/** Figma's Plating catalog, expressed as document navigation. Component APIs stay separate. */
import figmaMap from "./figma-map.json";

export type LibraryAreaId = "core" | "data-visualization" | "product-components" | "patterns";
export type LibrarySection = { id: string; label: string; componentIds: string[]; docSlugs?: string[] };
export type LibraryArea = {
  id: LibraryAreaId;
  label: string;
  entry: string;
  intro: string;
  figmaNodeId: string;
  sections: LibrarySection[];
};

export const libraryAreas: LibraryArea[] = [
  {
    id: "core", label: "Core components", entry: "components", figmaNodeId: figmaMap.catalogs.core,
    intro: "버튼과 입력, 배치와 피드백 등 공통 UI의 원본과 사용 기준을 찾아보세요.",
    sections: [
      { id: "layout", label: "Layout & cards · 레이아웃과 카드", componentIds: ["card", "list-row", "expandable-card", "stack-card"] },
      { id: "action", label: "Action · 액션", componentIds: ["icon-action-button", "icon-button", "inline-button", "primary-button", "capsule-button", "text-action"] },
      { id: "input", label: "Selection & Input · 선택과 입력", componentIds: ["capsule-tabs", "checkbox", "chip", "date-picker", "radio", "search-field", "select", "selection-card", "switch", "textarea", "text-input", "wheel-picker"] },
      { id: "content", label: "Content · 콘텐츠", componentIds: ["disclosure", "chip-group", "image-frame", "divider", "badge"] },
      { id: "loading", label: "Loading · 로딩", componentIds: ["skeleton", "progress"] },
      { id: "navigation", label: "Navigation · 내비게이션", componentIds: ["back-button", "bottom-tab", "step-indicator", "top-bar"] },
      { id: "feedback", label: "Feedback · 피드백", componentIds: ["inline-error", "notification-badge", "toast"] },
      { id: "presentation", label: "Presentation · 프레젠테이션", componentIds: ["bottom-sheet", "dialog", "menu", "sheet-background"] },
    ],
  },
  {
    id: "data-visualization", label: "Data visualization", entry: "data-visualization", figmaNodeId: figmaMap.catalogs["data-visualization"],
    intro: "미니 그래프의 종류와 변형, 미각 관계를 보여주는 시각화를 모았어요. 각 문서에서 단위·기간·범례와 사용 예시를 확인하세요.",
    sections: [
      { id: "mini-charts", label: "Mini charts · 미니 그래프", componentIds: ["mini-chart", "mini-line-chart", "mini-area-chart", "mini-stacked-bar-chart", "mini-bubble-chart", "mini-heatmap", "mini-treemap-chart", "pie-donut-chart"] },
      { id: "taste-visualizations", label: "Taste visualizations · 미각 시각화", componentIds: ["taste-graph", "taste-bloom"] },
    ],
  },
  {
    id: "product-components", label: "Product components", entry: "product-components", figmaNodeId: figmaMap.catalogs["product-components"],
    intro: "식사 기록과 미각, 프로필에 특화된 Taste Buddy의 UI를 찾아보세요. 그래프 자체의 기준은 Data visualization에서 관리해요.",
    sections: [
      { id: "identity", label: "Taste & identity · 미각과 정체성", componentIds: ["taste-chip", "avatar", "tcs-badge"] },
      { id: "record", label: "Record & scope · 기록과 범위", componentIds: ["sensory-bubble", "period-picker", "scope-label"] },
      { id: "cards", label: "Product cards · 제품 카드", componentIds: ["dining-result", "dish-feed", "interpretation-card", "mini-card", "profile-card", "summary-card", "taste-change-card"] },
    ],
  },
  {
    id: "patterns", label: "Patterns", entry: "patterns", figmaNodeId: figmaMap.catalogs.patterns,
    intro: "빈 상태와 재시도, 기록과 액션 등 실제 흐름에서 컴포넌트를 조합하는 방식을 확인하세요.",
    sections: [
      { id: "meal-to-meaning", label: "Meal to meaning · 식사에서 해석까지", componentIds: [], docSlugs: ["patterns/dining", "patterns/sensory", "patterns/interpretation"] },
      { id: "state-search", label: "State & Search · 상태와 검색", componentIds: ["empty-state", "flow-retry", "flow-loading"], docSlugs: ["patterns/revision", "patterns/recovery"] },
      { id: "flow-actions", label: "Flow & actions · 흐름과 행동", componentIds: ["record-actions", "social-actions"], docSlugs: ["patterns/flow-step", "patterns/sheet-presentation"] },
    ],
  },
];

export function componentLocation(id: string) {
  for (const area of libraryAreas) {
    const section = area.sections.find((item) => item.componentIds.includes(id));
    if (section) return { areaId: area.id, areaLabel: area.label, category: section.label };
  }
  // Existing web-only references remain discoverable without becoming Figma core entries.
  return { areaId: "resources", areaLabel: "Resources", category: "Web references · 웹 참고 문서" };
}

export type LibraryReference = {
  id: string;
  name: string;
  korean: string;
  purpose: string;
  figmaNodeId: string;
  sourcePaths: string[];
  related: { slug: string; label: string }[];
};

/** Source/index pages for existing Figma entries that have no standalone web playground. */
export const libraryReferences: LibraryReference[] = [
  {
    id: "capsule-button", name: "CapsuleButton", korean: "캡슐 버튼", figmaNodeId: "1436:9451",
    purpose: "캡슐 형태의 텍스트와 선택적 아이콘으로 행동을 표현해요. 기존 outlined·tonal 표현과 sm·md 텍스트 크기를 사용해요.",
    sourcePaths: ["src/components/system/CapsuleButton.tsx"],
    related: [{ slug: "components/primary-button", label: "PrimaryButton" }, { slug: "components/inline-button", label: "InlineButton" }],
  },
  {
    id: "sheet-background", name: "SheetBackground", korean: "시트 배경", figmaNodeId: "1282:9873",
    purpose: "시트 뒤에 놓인 화면을 감싸는 배경 레이어예요. 배경의 변환과 시트의 표시 방식은 SheetPresentation에서 함께 확인해요.",
    sourcePaths: ["src/components/system/SheetBackground.tsx", "src/lib/sheetPresentation.ts"],
    related: [{ slug: "components/bottom-sheet", label: "BottomSheetShell" }, { slug: "patterns/sheet-presentation", label: "SheetPresentation" }],
  },
  {
    id: "period-picker", name: "PeriodPicker", korean: "기간 선택", figmaNodeId: "1282:8983",
    purpose: "CapsuleTabs에 1·3·6·12개월과 전체 기간 선택지를 연결해요. 실제 날짜 범위와 데이터 필터링은 사용하는 화면에서 결정해요.",
    sourcePaths: ["src/components/system/plating/PeriodPicker.tsx"],
    related: [{ slug: "components/capsule-tabs", label: "CapsuleTabs" }, { slug: "data-visualization", label: "Data visualization" }],
  },
  {
    id: "dish-feed", name: "DishFeed", korean: "디시 피드", figmaNodeId: "1375:5834",
    purpose: "작성자, 음식 사진, 기록과 반응을 한 피드 항목으로 묶어요. 식사 기록 완료 결과 카드와 구분해 사용해요.",
    sourcePaths: ["src/components/dining/DishFeedbackCard.tsx", "docs/design/dish-feed-card.md"],
    related: [{ slug: "components/dining-result", label: "DiningResultCard" }, { slug: "components/social-actions", label: "SocialActions" }],
  },
  {
    id: "mini-card", name: "MiniCard", korean: "미니 카드", figmaNodeId: "1282:11901",
    purpose: "홈의 작은 정사각형 카드에 아이콘, 핵심값, 보조 설명과 기간을 담아요. 카테고리 아이콘은 카드 내부 구성으로 사용해요.",
    sourcePaths: ["ios/TasteBuddy/Features/Home/HomeSummaryComponents.swift", "ios/TasteBuddy/Components/SystemParityComponents.swift", "docs/design/summary-card-ux-writing.md"],
    related: [{ slug: "components/summary-card", label: "SummaryCard" }],
  },
  {
    id: "profile-card", name: "ProfileCard", korean: "프로필 카드", figmaNodeId: "1282:12005",
    purpose: "아바타와 프로필 정보, 선택적인 행동과 소셜 수치를 함께 보여줘요. 현재 Figma 정의와 네이티브 ProfileHeroCard 원본을 연결해요.",
    sourcePaths: ["ios/TasteBuddy/Components/ProfileHeroCard.swift"],
    related: [{ slug: "components/avatar", label: "TasteProfileAvatar" }, { slug: "components/social-actions", label: "SocialActions" }],
  },
  {
    id: "summary-card", name: "SummaryCard", korean: "요약 카드", figmaNodeId: "1282:14532",
    purpose: "제목, 핵심값과 보조 문구를 그래프와 조합하고, 구분선 아래 범례로 계열과 단위를 설명해요. 범례 항목 간 8px, 점과 텍스트 간 4px를 사용해요.",
    sourcePaths: ["src/components/system/InsightSummaryCard.tsx", "src/components/system/SummaryCardLegend.tsx", "src/plating/SummaryCardExamples.tsx", "ios/TasteBuddy/Components/SystemParityComponents.swift", "docs/design/summary-card-ux-writing.md"],
    related: [{ slug: "components/mini-chart", label: "미니 그래프와 카드 사용 예시" }, { slug: "data-visualization", label: "Data visualization" }],
  },
  {
    id: "taste-change-card", name: "TasteChangeCard", korean: "미각 변화 카드", figmaNodeId: "1282:14699",
    purpose: "미각 변화의 요약과 상승·하강 비교를 담아요. 일반 기록 요약 카드와 구분하고 기존 TasteInsightSummaryCard의 표시 규칙을 따릅니다.",
    sourcePaths: ["src/components/system/TasteInsightSummaryCard.tsx", "docs/design/mini-line-chart.md"],
    related: [{ slug: "components/mini-line-chart", label: "미니 라인 그래프" }, { slug: "components/summary-card", label: "SummaryCard" }],
  },
];
