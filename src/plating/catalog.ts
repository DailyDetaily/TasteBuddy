import { componentExampleContent as exampleContent } from "./componentExampleContent";
import { getComponentDocumentation } from "./componentDocumentation";

import type { ComponentGuide } from "./componentGuides";
import { nativeComponentGuides as componentGuides } from "./nativeComponentGuides";
import { additionalComponents } from "./additionalCatalog";
import { nativeComponentAudit } from "./nativeComponentAudit";

export const PLATING_FIGMA =
  "https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W";
export const BASE = "/design-system";
export type ComponentGroup =
  | "액션"
  | "입력·선택"
  | "탐색"
  | "콘텐츠"
  | "피드백"
  | "오버레이"
  | "Taste Buddy";
export type CatalogComponent = {
  id: string;
  name: string;
  korean: string;
  group: ComponentGroup;
  purpose: string;
  usage: string;
  source: string;
  native: string;
  states: string[];
  specs: string;
  rule: string;
  accessibility: string;
  difference: string;
  demo: "production" | "spec" | "library";
  code: string;
  pattern: string;
  guide?: ComponentGuide;
  references?: { label: string; url: string }[];
};
type Row = [
  string,
  string,
  string,
  ComponentGroup,
  string,
  string,
  string,
  string,
  string,
];
const rows: Row[] = [
  [
    "primary-button",
    "PrimaryButton",
    "주요 버튼",
    "액션",
    "화면의 가장 중요한 다음 행동을 안내해요.",
    "식사 기록 완료 · 인증 · 온보딩",
    "PrimaryButton.tsx",
    "TBComponents.swift",
    "최소 48 / Compact 40 · 반경 10 · 긴 문구 높이 확장",
  ],
  [
    "icon-button",
    "IconButton",
    "아이콘 버튼",
    "액션",
    "이름을 가진 짧은 보조 행동을 실행해요.",
    "상단 바의 닫기 · 정보 보기",
    "BottomSheetShell.tsx",
    "SystemParityComponents.swift",
    "웹 아이콘 기본 24 · 버튼 영역 32 · Native 터치 목표와 별도 확인",
  ],
  [
    "text-input",
    "TextInput",
    "입력 필드",
    "입력·선택",
    "사용자가 직접 입력한 값을 검토하고 수정해요.",
    "프로필 이름·버디네임 · 식사명 · 인증 폼",
    "TextInput.tsx",
    "NativeInputComponents.swift",
    "프로필 48 · 반경 12 · 값 14 SemiBold · 라벨 12 SemiBold",
  ],
  [
    "search-field",
    "SearchField",
    "검색 필드",
    "입력·선택",
    "질문과 결과를 같은 맥락에서 연결해요.",
    "음식·장소 검색",
    "../ui/input.tsx",
    "NativeInputComponents.swift",
    "44 이상 · 지우기 버튼 · 결과 수 안내",
  ],
  [
    "selection-card",
    "SelectionCard",
    "선택 카드",
    "입력·선택",
    "설명을 읽고 하나 또는 여러 항목을 선택해요.",
    "온보딩 · 식사 경험 선택",
    "SelectionCard.tsx",
    "NativeInputComponents.swift",
    "패딩 16 · 반경 20 · 제목 14 / 설명 12",
  ],
  [
    "chip",
    "Chip",
    "칩",
    "입력·선택",
    "짧은 조건과 선택 상태를 압축해 보여줘요.",
    "검색 키워드 · 저장 리스트 이름 · 식당 정보",
    "Chip.tsx",
    "SystemParityComponents.swift",
    "내용에 맞는 너비 · 상태별 경계 · full 반경",
  ],
  [
    "checkbox",
    "Checkbox",
    "체크박스",
    "입력·선택",
    "독립적인 여러 선택을 표현해요.",
    "식이제한 복수 선택 문구 재현",
    "../ui/checkbox.tsx",
    "NativeInputComponents.swift",
    "웹 시각 영역 16 · 레이블을 포함한 터치 영역 확보",
  ],
  [
    "radio",
    "RadioGroup",
    "라디오",
    "입력·선택",
    "같은 질문에서 한 개의 답을 선택해요.",
    "식사 성향 단일 선택 문구 재현",
    "../ui/radio-group.tsx",
    "NativeInputComponents.swift",
    "웹 16 원형 · 그룹 이름 · 방향키 이동",
  ],
  [
    "switch",
    "Switch",
    "스위치",
    "입력·선택",
    "즉시 적용되는 설정을 켜고 꺼요.",
    "저장 리스트 공개 여부",
    "../ui/switch.tsx",
    "NativeInputComponents.swift",
    "On / Off · 동일한 레이블 유지",
  ],
  [
    "top-bar",
    "TopBar",
    "상단 바",
    "탐색",
    "화면 제목과 돌아갈 위치를 알려줘요.",
    "홈 · 기록 · 분석",
    "FlowHeaderBlock.tsx",
    "Shell/AppChromeComponents.swift",
    "Native 48 / Web 56 · 제목 가운데",
  ],
  [
    "bottom-tab",
    "BottomTab",
    "하단 탭",
    "탐색",
    "서로 독립적인 주요 목적지 사이를 이동해요.",
    "홈 · 다이닝 · 분석",
    "HomeTabIcon.tsx",
    "Shell/AppChromeComponents.swift",
    "안전 영역 포함 · 활성 목적지 1개",
  ],
  [
    "back-button",
    "BackButton",
    "뒤로 가기",
    "탐색",
    "실제로 방문한 이전 단계로 돌아가요.",
    "식사 기록의 단계 이동",
    "FlowHeaderBlock.tsx",
    "Shell/AppChromeComponents.swift",
    "44 터치 영역 · 20 아이콘 · 방문 이력 기준",
  ],
  [
    "step-indicator",
    "StepIndicator",
    "단계 표시",
    "탐색",
    "현재 위치를 전체 흐름 안에서 보여줘요.",
    "온보딩 · 식사 기록",
    "StepIndicator.tsx",
    "TBComponents.swift",
    "6 높이 · 활성 16 너비 · 간격 6",
  ],
  [
    "card",
    "CompactCard",
    "카드",
    "콘텐츠",
    "하나의 주제에 속한 정보를 담아요.",
    "홈 요약 · 기록 목록",
    "CompactCard.tsx",
    "SystemParityComponents.swift",
    "반경 20 · 내용 패딩 12 · 카드 사이 12",
  ],
  [
    "list-row",
    "ListRow",
    "목록 행",
    "콘텐츠",
    "같은 종류의 정보를 빠르게 훑어봐요.",
    "설정 · 식사 목록",
    "CardScrollList.tsx",
    "SystemParityComponents.swift",
    "최소 48 · 제목과 보조 정보 · 선택적 이동 표시",
  ],
  [
    "badge",
    "StatusChip",
    "배지",
    "콘텐츠",
    "상태 또는 보조 분류를 짧게 알립니다.",
    "해석 근거 · 기록 상태",
    "StatusChip.tsx",
    "SystemParityComponents.swift",
    "10–12 글자 · 내용 너비 · 단독 상호작용 없음",
  ],
  [
    "avatar",
    "TasteProfileAvatar",
    "아바타",
    "콘텐츠",
    "프로필의 시각적 식별을 도와줘요.",
    "홈 · 내 프로필",
    "TasteProfileAvatar.tsx",
    "PalateBloomAvatar.swift",
    "sm / md / lg / xl · 장식과 데이터 구분",
  ],
  [
    "divider",
    "Separator",
    "구분선",
    "콘텐츠",
    "서로 다른 정보 그룹의 경계를 보여줘요.",
    "설정 · 상세 시트",
    "../ui/separator.tsx",
    "SystemCoreComponents.swift",
    "1px · 기본 경계색 · 양쪽 여백 유지",
  ],
  [
    "toast",
    "ToastSurface",
    "토스트",
    "피드백",
    "짧은 완료 안내와 되돌리기 행동을 제공해요.",
    "복사 완료 · 기록 취소 안내",
    "ToastSurface.tsx",
    "DesignSystemFullComponents.swift",
    "기본 3.5초 · 긴 문구 줄바꿈 · 대체되는 알림",
  ],
  [
    "inline-error",
    "InlineError",
    "인라인 오류",
    "피드백",
    "수정할 입력과 이유를 바로 연결해요.",
    "식사명 · 인증 검증",
    "../ui/input.tsx",
    "NativeInputComponents.swift",
    "오류색 + 설명 · aria-describedby 연결",
  ],
  [
    "empty-state",
    "EmptyState",
    "빈 상태",
    "피드백",
    "아직 없는 정보와 다음 행동을 알려줘요.",
    "기록이 없는 아카이브 · 검색 결과 없음",
    "EmptyState.tsx",
    "SystemCoreComponents.swift",
    "제목 16 · 설명 13 · 선택적 단일 행동",
  ],
  [
    "progress",
    "Progress",
    "진행 표시",
    "피드백",
    "작업이 진행 중임을 알려줘요.",
    "분석 · 사진 처리",
    "../ui/progress.tsx",
    "SystemCoreComponents.swift",
    "정량 / 비정량 · 작업명 · 중복 실행 방지",
  ],
  [
    "bottom-sheet",
    "BottomSheetShell",
    "바텀시트",
    "오버레이",
    "현재 화면의 맥락 안에서 내용을 확인하고 선택해요.",
    "해석 상세 · 감각 선택 · 메뉴",
    "BottomSheetShell.tsx",
    "SystemCoreComponents.swift",
    "Native 반경 32 / Web 20 · 안전 영역 · 고정 헤더",
  ],
  [
    "dialog",
    "Dialog",
    "다이얼로그",
    "오버레이",
    "중요한 확인과 결정을 잠시 분리해요.",
    "삭제 확인 · 중단 확인",
    "../ui/alert-dialog.tsx",
    "SystemCoreComponents.swift",
    "제목 · 영향 설명 · 취소 / 구체적 행동",
  ],
  [
    "menu",
    "DropdownMenu",
    "메뉴",
    "오버레이",
    "같은 대상에 대한 보조 행동을 모아요.",
    "기록 편집 · 메뉴 선택",
    "../ui/dropdown-menu.tsx",
    "SystemParityComponents.swift",
    "항목 최소 40 · 방향키 · Escape · 초점 복귀",
  ],
  [
    "taste-chip",
    "TasteChip",
    "미각 칩",
    "Taste Buddy",
    "미각의 이름과 명시된 값을 함께 보여줘요.",
    "식사 결과 · 분석 요약",
    "TasteChip.tsx",
    "SystemParityComponents.swift",
    "미각 6색 · soft 배경 · 10 글자 · 0값 보존",
  ],
  [
    "sensory-bubble",
    "SensoryBubble",
    "감각 버블",
    "Taste Buddy",
    "식사에서 느낀 감각을 골라 기록해요.",
    "감각 선택 2단계",
    "../dining-native/SensorySelectionEditor.tsx",
    "../Features/Dining/DiningSensorySelectionEditor.swift",
    "160 버블 / 147 상세 태그 · 선택과 호감 분리",
  ],
  [
    "taste-bloom",
    "TasteBloom",
    "Taste Bloom",
    "Taste Buddy",
    "미각 간의 관계를 고유한 꽃의 형태로 표현해요.",
    "프로필 · 결과 · BX 그래픽",
    "PalateBloomAvatar.tsx",
    "PalateBloomAvatar.swift",
    "6개 축 · 순위별 꽃잎 · 읽을 수 있는 대체 정보",
  ],
  [
    "dining-result",
    "DiningResultCard",
    "식사 결과 카드",
    "Taste Buddy",
    "기록한 경험과 해석의 근거를 함께 정리해요.",
    "식사 기록 완료",
    "TasteInsightSummaryCard.tsx",
    "../Features/Dining/DiningView.swift",
    "기록 맥락 → 관찰 → 해석 · 출처와 날짜 구분",
  ],
  [
    "interpretation-card",
    "InterpretationCard",
    "해석 카드",
    "Taste Buddy",
    "여러 기록에서 보이는 경향을 조심스럽게 설명해요.",
    "홈 요약 · 취향 분석",
    "InterpretationCard.tsx",
    "../Features/Analysis/PersonalTasteInsightCards.swift",
    "짧은 감각 제목 · 근거 수 · 가설 표현",
  ],
  [
    "taste-graph",
    "TasteGraph",
    "미각 그래프",
    "Taste Buddy",
    "관측된 값과 비교 범위를 왜곡 없이 보여줘요.",
    "기간별 분석 · 강도와 호감 비교",
    "TasteLineChart.tsx",
    "TasteRadarView.swift",
    "축 · 단위 · 기간 · 결측 표시 · 정적 대안",
  ],
];

const production = new Set([
  "primary-button",
  "icon-button",
  "text-input",
  "search-field",
  "selection-card",
  "chip",
  "checkbox",
  "radio",
  "switch",
  "step-indicator",
  "card",
  "badge",
  "avatar",
  "divider",
  "toast",
  "inline-error",
  "empty-state",
  "progress",
  "bottom-sheet",
  "dialog",
  "menu",
  "taste-chip",
  "taste-bloom",
]);
const examples: Record<string, string> = {
  "icon-button":
    '<BottomSheetIconButton\n  icon={X} ariaLabel="닫기" onClick={onClose}\n/>',
  "text-input":
    '<TextInput label="버디네임" value={name}\n  onChange={event => setName(event.target.value)}\n  placeholder="Taste Buddy에서 사용할 이름"\n  helperText="친구가 나를 찾는 고유 버디네임입니다." />',
  "search-field":
    '<label htmlFor="search">음식 검색</label>\n<Input id="search" type="search" value={query}\n  onChange={event => setQuery(event.target.value)}\n  aria-describedby="results"\n/>\n<p id="results" role="status">{results.length}개 결과</p>',
  "selection-card": `<SelectionCard title="${exampleContent.selectionCard.title}"\n  description="${exampleContent.selectionCard.description}"\n  selected={selected}\n  onClick={() => setSelected(!selected)}\n/>`,
  chip: '<Chip asChild variant={selected ? "solid" : "soft"}>\n  <button aria-pressed={selected}\n    onClick={() => setSelected(!selected)}>가보고 싶은 다이닝</button>\n</Chip>',
  checkbox: `<label>\n  <Checkbox checked={checked}\n    onCheckedChange={value => setChecked(value === true)} />\n  ${exampleContent.checkbox}\n</label>`,
  radio: `<RadioGroup value={explorationStyle} onValueChange={setExplorationStyle}\n  aria-label="${exampleContent.radio.label}">\n${exampleContent.radio.options.map((option) => `  <label><RadioGroupItem value="${option.value}" />${option.label}</label>`).join("\n")}\n</RadioGroup>`,
  switch: `<label>\n  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />\n  ${exampleContent.switch}\n</label>`,
  "step-indicator": "<StepIndicator total={5} currentIndex={2} />",
  card: '<CompactCard as="div" heading="오늘의 식사"\n  media={<img src={imageUrl} alt="" />}\n  metadata="합성 예제 · 저녁"\n/>',
  badge: "<StatusChip>기록 기반</StatusChip>",
  avatar: '<TasteProfileAvatar initials="TB" size="xl" />',
  divider: "<Separator />",
  toast:
    '<ToastSurface message="기록을 저장했어요"\n  actionLabel="되돌리기" onAction={onUndo}\n/>\n// 표시 수명과 중복 알림 교체는 presenter가 관리해요.',
  "inline-error":
    '<label htmlFor="food">음식 이름</label>\n<Input id="food" aria-invalid={true}\n  aria-describedby="food-error" />\n<p id="food-error">음식 이름을 입력해 주세요.</p>',
  "empty-state":
    '<EmptyState title="아직 식사 기록이 없어요"\n  description="첫 경험을 남겨 보세요."\n  actionLabel="식사 기록" onAction={onStartRecord}\n/>',
  progress: '<Progress value={64} aria-label="기록 분석 진행률" />',
  dialog:
    "<Dialog>\n  <DialogTrigger asChild><PrimaryButton>열기</PrimaryButton></DialogTrigger>\n  <DialogContent>\n    <DialogTitle>예제 기록을 삭제할까요?</DialogTitle>\n    <DialogDescription>합성 예제만 변경돼요.</DialogDescription>\n  </DialogContent>\n</Dialog>",
  menu: "<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <PrimaryButton>기록 메뉴</PrimaryButton>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem onSelect={onEdit}>기록 편집</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>",
  "taste-bloom":
    '<PalateBloomAvatar size={200}\n  profile={{sweet:72, sour:58, bitter:36, salty:46, umami:84, fat:63}}\n  ariaLabel="합성 예제의 미각 관계"\n/>',
};
const specifics: Record<string, Partial<CatalogComponent>> = {
  "primary-button": {
    rule: "한 화면의 주요 행동은 하나로 정해요. disabled는 실제 실행을 막고, visualDisabled는 설명을 보여줄 수 있는 별도 상태예요.",
    accessibility:
      "button 요소와 명확한 행동명. 처리 중에는 aria-busy를 제공하고 반복 실행을 막아요.",
    difference:
      "Web과 Native 모두 최소 높이 48 / 40. 기본 버튼의 내부 좌우 여백은 Native 0 / Web 16이며 Compact는 양쪽 16이에요. Native는 semibold, Web은 medium이고 작업 실행·취소는 각 흐름이 책임져요.",
    code: '<PrimaryButton disabled={saving} aria-busy={saving}>\n  {saving ? "저장 중" : "기록 완료"}\n</PrimaryButton>',
  },
  "taste-chip": {
    rule: "색은 미각의 종류를 나타내요. 선택·강도·호감으로 해석하지 않아요. 값 0과 기록 없음을 구분해요.",
    accessibility:
      "레이블과 값을 텍스트로 읽을 수 있어야 해요. 연한 미각색을 작은 본문색으로 쓰지 않아요.",
    difference:
      "Native의 tintTextColor 기준으로 레이블과 수치의 대비를 맞췄어요. 웹은 0값도 숨기지 않아요.",
    code: '<TasteChip taste="단맛" value={0} />\n<TasteChip taste="신맛" />',
  },
  "bottom-sheet": {
    rule: "배경 맥락을 유지하는 상세·선택에 사용해요. 긴 독립 작업은 새 화면으로 이동해요. 닫기는 결과 저장과 같지 않아요.",
    accessibility:
      "제목·설명 연결, 초점 가두기, Escape 닫기, 닫은 뒤 실행 버튼으로 초점 복귀. 스크린리더와 스와이프는 플랫폼별 확인이 필요해요.",
    difference:
      "Native 최대 높이 98%, 반경 32, 손잡이 36×5. Web은 95%, 반경 20, 40×6. 이 v1은 양쪽의 현재 계약을 보존해요.",
    code: "<BottomSheetShell open={open} onOpenChange={setOpen}\n  headerCenter={<DrawerTitle>감각 선택</DrawerTitle>}>\n  <DrawerDescription>식사에서 느낀 감각을 골라 주세요.</DrawerDescription>\n</BottomSheetShell>",
  },
  toast: {
    rule: "완료 안내는 짧게. 되돌리기는 실제 콜백이 있는 경우에만 노출해요. 입력을 막는 오류에는 쓰지 않아요.",
    accessibility:
      "role=status로 알리고 키보드 초점을 빼앗지 않아요. 긴 문구를 자르지 않아요.",
    difference:
      "Surface는 표현만 담당해요. Native의 3.5초 종료·중복 교체 정책은 presenter가 담당하고 사이트 예제는 수동 종료도 제공해요.",
  },
  "taste-graph": {
    rule: "보이지 않는 값은 0이 아니에요. 최소 표시 길이는 장식이며 저장된 값과 별개예요. 강도와 호감의 축을 섞지 않아요.",
    accessibility:
      "동일한 값을 읽을 수 있는 표를 함께 제공해요. 색에만 의존하지 않고 단위·기준 기간을 명시해요.",
  },
  "sensory-bubble": {
    rule: "감각을 느꼈다는 사실을 선택해요. 좋고 싫음, 강도, 음식 전체 평가는 후속 입력과 별개예요.",
    accessibility:
      "버블의 레이블과 선택 상태를 함께 읽어요. 터치 영역을 확보하고 확대 시 겹치지 않게 줄바꿈해요.",
  },
  "empty-state": {
    rule: "“취향이 없어요” 대신 “아직 기록이 없어요”라고 안내해요. 검색 결과가 없는 경우 조건 변경을 제안해요.",
    accessibility:
      "설명과 다음 행동을 텍스트로 제공해요. 장식 이미지는 읽지 않아요.",
  },
};
export const components: CatalogComponent[] = rows.map(
  ([id, name, korean, group, purpose, usage, source, native, specs]) => ({
    id,
    name,
    korean,
    group,
    purpose,
    usage,
    source: `src/components/system/${source}`,
    native: `ios/TasteBuddy/Components/${native}`,
    states: getComponentDocumentation(id).states.map(([value]) => value),
    specs,
    guide: componentGuides[id],
    demo: production.has(id) ? "production" : "spec",
    rule: "정보의 역할을 유지하고 한 컴포넌트에 서로 다른 목적을 섞지 않아요. 긴 한국어는 줄바꿈하며 내용이 없는 경우 별도 상태를 보여줘요.",
    accessibility:
      "의미 있는 이름과 상태를 제공해요. 키보드로 조작하고 초점을 볼 수 있어야 해요. 선택은 색과 형태·텍스트를 함께 사용해요.",
    difference:
      "네이티브 구현을 규격 기준으로 삼았어요. 웹 재현 예제는 문서에서 표시하며 제스처·플랫폼 피드백은 동일하다고 가정하지 않아요.",
    code:
      examples[id] ??
      `// 네이티브 규격의 문서용 재현입니다.\nimport ComponentPreview from './ComponentPreview';\nimport { components } from './catalog';\n\nconst component = components.find(item => item.id === '${id}')!;\n<ComponentPreview component={component} />`,
    pattern:
      group === "Taste Buddy"
        ? "interpretation"
        : group === "피드백"
          ? "recovery"
          : "dining",
    ...specifics[id],
  }),
);

components.push(...additionalComponents);
for (const component of components) {
  const audit = nativeComponentAudit[component.id];
  if (audit && component.id !== "disclosure") {
    component.native = audit.sources[0].path;
    component.specs = audit.specs;
  }
}

export type DocSection = {
  id: string;
  title: string;
  body: string;
  items?: string[];
};
export type DocPage = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: DocSection[];
};
export const docs: DocPage[] = [
  {
    slug: "getting-started",
    eyebrow: "START HERE",
    title: "경험을 담는 기준, 플레이팅",
    intro:
      "Taste Buddy를 함께 만드는 디자이너와 개발자를 위한 작업 도구예요. 실제 제품의 규칙과 새로운 제안을 구분해서 사용해요.",
    sections: [
      {
        id: "purpose",
        title: "무엇을 위한 시스템인가요",
        body: "플레이팅은 식사 경험을 담고, 정보 사이의 관계를 정돈하고, 의미가 드러나는 순간을 설계해요. Quiet Hospitality Intelligence를 제품의 작은 선택에까지 연결합니다.",
      },
      {
        id: "designer",
        title: "디자이너의 첫 작업",
        body: "기초에서 의미별 토큰을 확인하고 컴포넌트의 실제 사용처를 읽으세요. Figma 메인 컴포넌트에서 인스턴스를 만든 뒤 필요한 상태만 바꿔요.",
        items: [
          "제품 프리뷰는 현재 앱의 라이트 규격이에요. 문서 사이트는 홈 라이트·상세 다크 테마를 사용해요.",
          "Figma의 폰트 대체 여부와 플랫폼 차이를 먼저 확인하세요.",
          "브랜드 그래픽은 원본의 조형·비율을 보존해요.",
        ],
      },
      {
        id: "developer",
        title: "개발자의 첫 작업",
        body: "상세 페이지의 실제 소스와 예제를 확인하세요. 공통 컴포넌트의 상태와 업무 흐름의 비동기 상태를 구분해요.",
        items: [
          "src/constants/designTokens.ts: 웹 토큰",
          "ios/TasteBuddy/DesignSystem: 네이티브 기초",
          "brand-launch: BX 원본",
          "src/plating: 문서 데이터·탐색·프리뷰",
        ],
      },
      {
        id: "truth",
        title: "기준이 다른 경우",
        body: "제품 UI는 현재 네이티브 코드와 화면, 의도는 기존 가이드, BX는 Remotion 원본을 기준으로 판단해요. 같은 역할의 차이는 대응표에 기록하고 실제로 확인한 범위만 검증됨으로 표시합니다.",
      },
    ],
  },
  {
    slug: "principles",
    eyebrow: "PRINCIPLES",
    title: "이해를 돕고, 판단을 서두르지 않아요",
    intro: "차분하고 정제된 경험은 작은 판단 규칙에서 시작해요.",
    sections: [
      {
        id: "evidence",
        title: "기록에서 말할 수 있는 만큼",
        body: "감각의 존재, 강도, 호감, 적절성, 음식 전체 평가는 서로 다른 정보예요. 관찰에서 해석으로 넘어갈 때 근거와 조건을 함께 제시해요.",
        items: [
          "의도: 사용자가 해석의 범위를 이해할 수 있게 해요.",
          "판단: “매운맛을 좋아해요”라고 쓰기 전 호감 기록을 확인해요.",
          "예시: “최근 3개 기록에서 고소함을 자주 선택했어요.”",
          "예외: 사용자가 직접 표현한 선호는 자기 보고로 표시해요.",
        ],
      },
      {
        id: "hierarchy",
        title: "한 번에 한 가지 목적",
        body: "화면은 하나의 주요 행동을 중심으로 구성해요. 제목은 지금 할 일, 본문은 결정에 필요한 정보, 보조 링크는 자세한 근거를 담아요.",
        items: [
          "주요 CTA는 하나만 강조해요.",
          "상세 근거는 시트에서 펼치되 핵심 결론을 숨기지 않아요.",
          "안전·삭제 영향처럼 결정에 필수적인 정보는 미리 보여줘요.",
        ],
      },
      {
        id: "control",
        title: "사용자가 속도를 정해요",
        body: "뒤로 가기는 방문한 경로를 따르고 닫기·취소·완료를 구분해요. 움직임을 줄이거나 미디어를 멈출 수 있어야 해요.",
        items: [
          "예시: 식사 입력에서 이전 단계로 돌아가 수정할 수 있어요.",
          "예외: 완료 후 새 기록이 시작되는 경우에는 목적지를 명확히 알려요.",
        ],
      },
      {
        id: "recovery",
        title: "실패 다음에 할 일이 보여요",
        body: "실패한 대상과 다음 행동을 함께 설명해요. 입력 보존이나 자동 복구는 실제로 확인한 동작일 때만 약속해요.",
        items: [
          "좋은 예: “사진을 불러오지 못했어요. 다시 선택해 주세요.”",
          "피할 예: “오류가 발생했습니다.”",
          "저장 여부가 불확실하면 중복 저장을 유도하기 전에 상태를 확인해요.",
        ],
      },
    ],
  },
  {
    slug: "foundations",
    eyebrow: "FOUNDATIONS",
    title: "경험의 기초를 고르는 기준",
    intro:
      "색과 글자부터 배치·상태·입력 반응까지, iOS 화면을 만드는 공통 기준을 모았어요. 실제 SwiftUI 규격과 각 역할의 선택·조합 규칙을 함께 확인해요.",
    sections: [
      {
        id: "start",
        title: "토큰에서 시작해요",
        body: "디자인 토큰에서 역할과 Swift 이름을 먼저 확인하세요. 같은 색이나 크기여도 사용 목적이 다르면 역할을 구분해요.",
      },
      {
        id: "visual",
        title: "정보의 관계를 보여줘요",
        body: "간격과 형태로 정보를 묶고, 아이콘과 이미지로 행동과 식사 경험의 맥락을 전달해요. 각 기준은 관련 컴포넌트의 규격과 함께 사용해요.",
      },
      {
        id: "experience",
        title: "행동과 해석을 이어줘요",
        body: "상태는 현재 할 수 있는 일을, 누름 피드백은 입력 직후의 반응을, 모션은 움직임의 시간과 방식을 정해요. 각 기준을 관련 컴포넌트와 패턴에 연결해 사용하세요.",
      },
    ],
  },
  {
    slug: "foundations/design-tokens",
    eyebrow: "FOUNDATIONS",
    title: "디자인 토큰",
    intro:
      "반복되는 시각적 결정을 Swift 이름으로 연결해요. iOS 화면에서 색·간격·글자·움직임을 고를 때 기존 역할과 실제 사용법을 먼저 확인하세요.",
    sections: [
      {
        id: "layers",
        title: "iOS의 공통 규격",
        body: "TBTheme.swift는 색상·간격·반경·치수·글자·데이터 그래프의 공통 규격을 제공해요. 화면에서는 숫자를 반복하기보다 용도에 맞는 이름을 사용하세요.",
        items: [
          "TBColor는 색의 역할, TBSpacing은 간격, TBRadius는 반경, TBSize는 공통 치수를 정의해요.",
          "TBTypography는 글자 스케일을, TBTextStyle은 제목·본문 같은 글자 역할을 정의해요. 새 텍스트는 .tbTextStyle(...)로 적용해요.",
          "TasteBloomMotion은 움직임의 역할과 스프링을, TBDataViz는 진행 막대·레이더·추이·링의 시각 규격을 정의해요.",
        ],
      },
      {
        id: "naming",
        title: "이름은 역할을 따라요",
        body: "문서에서 고른 역할을 SwiftUI의 실제 API에 연결해요. 값이 같아도 역할이 다르면 이름을 구분해서 사용하세요.",
        items: [
          "페이지 바탕: TBColor.page는 #F3F3F3이에요. .tbPageBackground()의 기본 배경으로 사용해요.",
          "기본 표면: TBColor.surface는 #FFFFFF예요. 카드와 내용 영역에 .background(TBColor.surface)로 적용해요.",
          "페이지 여백: .padding(.horizontal, TBSpacing.page)를 사용해요. 본문은 Text에 .tbTextStyle(.body)를 적용하면 글꼴·색·추가 행간이 함께 설정돼요.",
        ],
      },
      {
        id: "platforms",
        title: "iOS 적용 범위",
        body: "색상·간격·글자의 기준은 ios/TasteBuddy/DesignSystem/TBTheme.swift예요. 치수와 기본 글자 크기는 pt로 읽고, 화면의 안전 영역·Dynamic Type·동작 줄이기 설정을 함께 고려해요.",
        items: [
          "TBTheme.swift: TBColor·TBSpacing·TBRadius·TBSize·TBTypography·TBTextStyle·TBDataViz를 확인해요.",
          "TasteBloomMotion.swift: press·feedback·content·sheet·bloom 역할을 선택하고 reduceMotion 값을 전달해요. TBMotion은 같은 타입의 별칭이에요.",
          "Models/TasteModels.swift: TasteAxis에서 미각 분류색과 배경 위 글자색을 확인해요.",
          "ios/DESIGN_SYSTEM.md와 해당 SwiftUI 컴포넌트에서 실제 적용 위치, 예외 규격, 상태별 동작을 확인해요.",
        ],
      },
      {
        id: "changes",
        title: "사용처와 함께 바꿔요",
        body: "토큰을 바꾸기 전에 현재 사용처와 해결하려는 문제를 확인해요. 값 변경은 그 이름을 참조하는 모든 화면에 영향을 줄 수 있어요.",
        items: [
          "변경할 역할과 영향을 받는 SwiftUI 컴포넌트·화면을 찾고, 새 이름이 필요한지 판단해요.",
          "Swift 정의와 사용 예제, ios/DESIGN_SYSTEM.md의 관련 규격을 함께 갱신해요.",
          "이름을 옮길 때는 기존 참조와 호환 여부를 기록해요. 확인한 빌드·화면·기기 범위를 운영 문서에 남겨요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/colors",
    eyebrow: "FOUNDATIONS",
    title: "색상",
    intro:
      "미각을 구분하는 여섯 색과, 기록을 읽기 쉽게 받쳐주는 뉴트럴 계열을 함께 사용해요. 색에 담은 의도와 사용하는 역할을 알아보세요.",
    sections: [
      {
        id: "overview",
        title: "컬러 오버뷰",
        body: "플레이팅의 컬러는 음식에서 느낀 감각을 알아보고 기록을 이해하도록 돕는 언어예요. 미각 컬러는 어떤 감각인지 드러내고, 뉴트럴 계열은 배경·표면·글자·경계의 구조를 만들어요.",
        items: [
          "같은 미각에는 같은 색을 사용해요. 기록, 차트, 해석 카드에서 미각을 일관되게 알아볼 수 있도록 해요.",
          "음식과 기록이 중심이 되도록 뉴트럴 계열을 바탕에 두고, 미각의 의미를 전달하는 곳에 색을 사용해요.",
          "미각색은 감각의 종류를 뜻해요. 강도는 수치와 그래프의 크기·위치로, 호감은 별도의 응답으로 표현해요.",
        ],
      },
      {
        id: "taste",
        title: "미각 컬러의 선정 이유",
        body: "음식에서 떠오르는 인상과 팔레트 안의 구분을 기준으로 여섯 색을 설명해요. 색과 미각의 연결은 플레이팅의 시각적 해석이에요.",
      },
      {
        id: "roles",
        title: "뉴트럴·상태 컬러",
        body: "뉴트럴 계열은 밝기와 대비로 정보의 위계를 만들고, 음식 사진과 미각 컬러를 받쳐줘요. 역할별 스와치를 눌러 색상값과 iOS 토큰을 확인하세요.",
      },
      {
        id: "state-pairs",
        title: "상태별 색 조합",
        body: "중립·정보·성공·주의·오류에는 각각의 배경과 글자색을 함께 사용해요. 아래 문구는 색 조합을 설명하는 예제이며, 색상값은 현재 iOS 토큰을 따릅니다.",
      },
      {
        id: "interaction-colors",
        title: "행동과 선택의 색",
        body: "주요 행동·선택·초점·호버·누름에는 각 역할의 색을 사용해요. 같은 검정이나 흰색이어도 역할 이름을 유지하면 상태를 일관되게 조합할 수 있어요.",
      },
      {
        id: "pairings",
        title: "배경과 글자를 함께 골라요",
        body: "색의 가독성은 함께 놓인 전경과 배경으로 판단해요. 기본 표면에는 TBColor.textPrimary·textBody 등 목적에 맞는 글자색을, 밝은 미각 배경에는 해당 TasteAxis.tintTextColor를 사용하고 실제 조합의 대비를 확인하세요.",
        items: [
          "선택·오류·성공은 색과 함께 형태, 아이콘 또는 문구로도 알려요.",
          "투명도, 사진, 그라디언트가 겹치면 최종 배경 위에서 다시 확인해요.",
          "TBColor.textHint·textDisabled를 중요한 본문이나 활성 행동의 기본값으로 사용하지 않아요. 활성 보조 행동에는 textAction을 사용해요.",
        ],
      },
      {
        id: "contrast",
        title: "읽기용 색 조합과 대비",
        body: "본문·입력 힌트·상태 안내·선택·미각 라벨에 쓰는 글자와 배경의 조합을 확인해요. 상태별 글자색은 기본·호버·누름에서도 일반 작은 글자 기준을 만족하도록 정합니다.",
      },
      {
        id: "mode",
        title: "현재 지원 범위",
        body: "현재 TBColor는 iOS 제품의 라이트 규격을 정의해요. 이 문서의 값은 Swift 소스에서 확인한 기준이에요. 실제 화면의 배경 조합, 투명도와 접근성 설정에 따른 가독성은 적용 화면에서 확인해요.",
      },
      {
        id: "color-usage-examples",
        title: "제품에서 색이 쓰이는 모습",
        body: "iOS의 홈·미각 선택·기록 저장에서 쓰는 색상과 상태를 실제 소스 기준으로 살펴봐요.",
      },
    ],
  },
  {
    slug: "foundations/typography",
    eyebrow: "FOUNDATIONS",
    title: "타이포그래피",
    intro:
      "제목은 지금 볼 내용을, 본문은 결정에 필요한 정보를, 보조 글자는 맥락을 전달해요. 크기 이름보다 글자의 역할을 먼저 고르세요.",
    sections: [
      {
        id: "product",
        title: "제품의 글자 역할",
        body: "iOS 제품은 Pretendard Regular·Medium·Semibold·Bold를 사용해요. TBTextStyle의 sectionTitle·subsectionTitle·sheetTitle·body·caption·detailAction 중 역할을 고르고 .tbTextStyle(...)로 적용하세요.",
        items: [
          "iOS 기본 규격: 섹션 제목 18pt Bold, 하위 제목 16pt Bold, 시트 제목 15pt Bold, 본문 14pt Regular, 캡션 12pt Semibold, 상세 행동 11pt Medium.",
          "TBFont의 18pt 제한은 기본 요청 크기의 상한이에요. Dynamic Type으로 확대된 실제 표시 크기의 상한을 뜻하지 않아요.",
          "TBTextStyle.body는 추가 행간 4pt, caption은 3pt를 적용해요. 나머지 역할의 추가 행간은 0pt예요. 줄 수 제한은 해당 컴포넌트에서 정해요.",
        ],
      },
      {
        id: "component-text",
        title: "화면 제목과 행동의 글자",
        body: "상단 제목과 버튼은 공용 컴포넌트가 크기·굵기·색상을 함께 정해요. 텍스트 역할과 컴포넌트 규격을 용도에 맞게 선택하세요.",
      },
      {
        id: "type-recipes",
        title: "제품에서 함께 쓰는 글자",
        body: "홈·식사 기록·분석의 실제 소스에서 글자 조합을 가져왔어요. 공용 TBTextStyle을 쓰는 경우와 화면에서 TBFont를 직접 조합하는 경우를 구분해요.",
      },
      {
        id: "legacy",
        title: "기존 숫자 이름과 실제 값",
        body: "TBTypography.FontSize.x20·x22·x24·x28은 현재 모두 18pt예요. 기존 참조를 위한 호환 이름으로 구분하고 이름만 보고 20–28pt 크기로 해석하지 않아요. TBFont도 전달받은 기본 크기에 min(size, 18)을 적용해요.",
        items: [
          "새 텍스트에는 TBTextStyle의 역할을 먼저 선택해요. 기본 크기 18pt를 직접 참조해야 하면 TBTypography.FontSize.x18을 사용해요.",
          "기존 이름이나 TBFont의 크기 제한을 바꾸기 전에는 사용처와 Dynamic Type에서의 화면 영향을 확인해요.",
        ],
      },
      {
        id: "editorial",
        title: "문서와 브랜드의 글자",
        body: "문서와 브랜드의 큰 디스플레이 글자는 별도 표현 체계를 사용해요. iOS 제품의 제목·본문 규격은 이 페이지의 TBTextStyle을 기준으로 확인하세요.",
      },
      {
        id: "fonts",
        title: "iOS 서체 등록",
        body: "ios/project.yml의 UIAppFonts에 Pretendard-Regular·Medium·SemiBold·Bold.otf가 등록되어 있어요. TBFont는 각 서체 이름을 Font.custom으로 사용해요. 임의의 시스템 서체로 대체하기 전에 등록 이름과 실제 표시를 확인하세요.",
      },
      {
        id: "wrap",
        title: "긴 한국어와 글자 확대",
        body: "의미 단위로 줄바꿈하고 긴 문구가 화면 너비를 넘지 않게 해요. 버튼과 오류 문구는 필요한 높이를 확보하고, Dynamic Type 확대 시 제목·본문·행동이 가려지지 않는지 확인하세요.",
        items: [
          "음식명·장소명·오류 안내처럼 길어지는 실제 문구로 확인해요.",
          "필수 정보를 줄 수 제한이나 말줄임만으로 숨기지 않아요.",
          "작은 iPhone 화면과 큰 Dynamic Type 크기에서 줄바꿈, 조작 영역, 스크롤을 함께 확인해요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/layout",
    eyebrow: "FOUNDATIONS",
    title: "레이아웃",
    intro:
      "화면의 구조는 읽기와 행동의 순서를 정해요. 제목·스크롤하는 내용·고정 행동을 나누고 안전 영역과 글자 확대에서도 이 관계를 유지해요.",
    sections: [
      {
        id: "anatomy",
        title: "화면의 영역을 먼저 나눠요",
        body: "상단 바는 현재 위치와 이동을, 본문은 판단에 필요한 정보를, 하단 행동은 다음 단계를 맡아요. 실제 iOS의 홈·식사 기록·계정 연결 시트에서 영역과 치수를 확인하세요. 화면 속 기록은 문서용 합성 데이터예요.",
        items: [
          "페이지 좌우 여백은 TBSpacing.page 20pt, 섹션 사이 기준은 TBSpacing.section 20pt예요. SectionCard는 TBSpacing.card 12pt로 내용을 감싸요.",
          "상단 바의 TBSize.topAppBarHeight 32pt는 내용 행이에요. AppChromeMetrics의 위·아래 8pt를 더한 바 자체는 48pt이며 상태 영역과 안전 영역은 셸이 별도로 반영해요.",
          "하단 탭의 60pt와 화면 하단 안전 영역은 구분해요. 제목·본문·고정 행동의 공간을 모두 더한 뒤 실제 읽기 영역을 확인하세요.",
        ],
      },
      {
        id: "safe-area",
        title: "안전 영역과 키보드는 화면 구조예요",
        body: "배경은 화면 끝까지 채울 수 있지만 읽을 내용과 조작 영역은 시스템 영역에 가리지 않아야 해요. 키보드가 열렸을 때 입력 필드, 오류 안내, 완료 행동 중 무엇을 계속 보여줄지 정하세요.",
        items: [
          "AppShellView가 상단과 하단의 안전 영역을 처리해요. 화면별 여백을 더하기 전에 셸에서 이미 확보한 공간을 확인해요.",
          "BottomSheetShell의 footer는 기본적으로 max(12pt, safeAreaBottom)을 확보해요. 액세서리가 있으면 그 높이와 간격도 포함해요.",
          "키보드 회피는 입력 화면이 소유해요. 인증 이메일 단계는 주요 행동만 별도 오프셋으로 이동하고, 모든 시트가 자동으로 키보드를 피하지 않아요.",
        ],
      },
      {
        id: "scrolling",
        title: "마지막 정보까지 닿을 수 있어야 해요",
        body: "본문이 길어지면 본문 영역을 스크롤하고, 고정된 탭이나 행동이 마지막 항목을 덮지 않도록 끝 여백을 확보해요. 보이는 영역을 줄이는 오버레이와 장식도 함께 점검하세요.",
        items: [
          "메인 탭 화면은 TBSpacing.mainTabContentBottom으로 탭 높이 60pt와 추가 여백 12pt를 확보하는 사용처가 있어요. 중복 패딩은 셸과 화면을 함께 확인해요.",
          "시트에는 BottomSheetScrollView를 사용해 본문 스크롤과 시트 드래그를 연결해요. 본문이 맨 위에 있거나 스크롤할 필요가 없을 때 시트 드래그를 허용하는 구조예요.",
          "입력 중인 항목과 관련 오류가 스크롤 밖으로 밀리지 않는지, 가장 아래 항목과 고정 행동을 각각 누를 수 있는지 확인해요.",
        ],
      },
      {
        id: "dynamic-type",
        title: "글자가 커지면 배치를 넓혀요",
        body: "문구를 읽을 수 있는 공간을 먼저 확보해요. 같은 기기·같은 데이터·같은 초기 스크롤 위치에서 기본 Large와 접근성 AX2를 비교해요. 실제 제품의 줄바꿈과 고정 영역을 함께 살펴보세요.",
        items: [
          "제목·본문·행동 이름은 필요한 줄 수를 확보하고 필수 내용을 말줄임으로 숨기지 않아요.",
          "버튼 묶음은 긴 문구와 큰 Dynamic Type에서 세로 배치를 고려해요. 실제 재배치 책임은 해당 컴포넌트와 사용처의 구현에서 확인해요.",
          "작은 iPhone, 긴 음식명, 키보드가 열린 입력, 큰 Dynamic Type을 각각 확인해요. 기본 화면이 맞는 것만으로 확대 상태의 레이아웃을 판단하지 않아요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/spacing",
    eyebrow: "FOUNDATIONS",
    title: "스페이싱",
    intro:
      "가까운 정보는 묶고 다른 주제는 떼어 놓아요. 간격은 화면을 채우는 장식보다 정보 사이의 관계를 설명하는 기준이에요.",
    sections: [
      {
        id: "scale",
        title: "기존 스케일에서 골라요",
        body: "TBSpacing은 2·4·6·8·10·12·16·20·24·40pt를 제공해요. 기본 단위를 늘리기 전에 가장 가까운 기존 값으로 관계를 표현할 수 있는지 확인하세요.",
        items: [
          "2–8pt는 같은 조작 요소 안의 작은 관계를 정리할 때, 10–16pt는 가까운 내용과 요소를 묶을 때 검토해요.",
          "20–40pt는 주제와 영역을 나눌 때 검토해요. 값 자체보다 같은 화면 안의 관계가 일관되는지가 중요해요.",
          "숫자 범위는 선택을 돕는 기준이에요. 기존 컴포넌트에 명시된 간격은 해당 규격을 먼저 따라요.",
        ],
      },
      {
        id: "roles",
        title: "용도가 있는 이름을 먼저 사용해요",
        body: "같은 20pt라도 페이지 바깥 여백과 섹션 사이의 역할은 달라요. 의미가 정해져 있으면 TBSpacing.page·section·card를 사용해 변경 의도를 남기세요.",
        items: [
          "page 20pt: 화면 좌우의 기본 콘텐츠 여백. .padding(.horizontal, TBSpacing.page)에 사용해요.",
          "section 20pt: 서로 다른 주제의 기준 간격. 관련 내용 내부의 간격과 구분해요.",
          "card 12pt: SectionCard의 내부 여백. 카드 바깥 간격과 중복해 적용하지 않아요.",
          "pageTop 8pt와 mainTabContentBottom 72pt는 셸·탭과 본문의 관계를 다뤄요. 하단 안전 영역 자체를 뜻하지 않아요.",
        ],
      },
      {
        id: "content",
        title: "내용의 길이가 달라져도 관계를 유지해요",
        body: "제목과 설명은 같은 묶음으로, 다음 질문이나 다른 기록은 별도 묶음으로 읽혀야 해요. 긴 문구가 생겼을 때 행간과 요소 간격을 혼동해서 추가 여백을 줄이지 않아요.",
        items: [
          "카드 바깥 여백, 카드 내부 여백, 글자 사이 행간을 각각 확인해요. 한쪽 문제를 다른 값을 바꿔 해결하지 않아요.",
          "고정 높이 안에 여백과 글자를 밀어 넣지 않아요. 내용이 늘면 컨테이너 높이 또는 스크롤 영역을 늘려요.",
          "간격을 줄이기 전에 그 공간이 조작 영역, 안전 영역, 키보드 회피를 위해 필요한지 확인해요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/radius",
    eyebrow: "FOUNDATIONS",
    title: "반경",
    intro:
      "모서리는 요소의 크기와 역할을 드러내요. 조작 요소·정보 묶음·큰 표면의 관계를 유지하면서 기존 iOS 규격을 사용해요.",
    sections: [
      {
        id: "scale",
        title: "역할별 반경을 확인해요",
        body: "TBRadius는 badge 6, icon 8, control 10, row 12, support 14, card 20, media 24pt를 정의해요. 칩과 완전히 둥근 형태는 chip 999, full 9999라는 기존 값을 사용해요.",
        items: [
          "chip과 full의 큰 값은 캡슐형 모서리를 만드는 기존 정의예요. 보이는 반경은 실제 너비·높이와 도형에 따라 달라져요.",
          "BottomSheetShellMetrics.topRadius는 별도의 32pt이며 시트의 위쪽 모서리에 적용해요. 카드 반경 20pt와 바꿔 쓰지 않아요.",
        ],
      },
      {
        id: "roles",
        title: "컴포넌트의 역할로 골라요",
        body: "PrimaryButton은 control 10pt, SectionCard는 card 20pt를 사용해요. 작은 조작 요소에 큰 표면의 반경을 그대로 옮기지 말고 이미 정의된 컴포넌트의 형태를 유지하세요.",
        items: [
          "라벨·배지, 누르는 컨트롤, 내용을 묶는 카드, 사진·미디어의 규격을 구분해요.",
          "선택·비활성·누름 상태만으로 모서리 형태를 바꿔 다른 종류의 요소처럼 보이게 하지 않아요.",
          "새 역할이 필요하면 기존 부품과 함께 비교한 뒤 이름과 적용 범위를 정해요. 화면 한 곳의 인상만으로 전체 반경을 바꾸지 않아요.",
        ],
      },
      {
        id: "containment",
        title: "겹친 표면의 모서리를 함께 봐요",
        body: "카드 안의 이미지와 조작 요소는 바깥 모서리, 안쪽 여백, 클리핑 경계를 함께 확인해요. 반경 수치 하나가 모든 중첩 구조에서 같은 형태를 만들지는 않아요.",
        items: [
          "SectionCard는 continuous 모서리로 내용을 클리핑해요. 내부 이미지가 바깥 경계를 넘거나 여백 때문에 모서리 곡선이 어색해지지 않는지 확인해요.",
          "테두리·배경·클리핑은 같은 도형과 반경을 사용해 어긋난 가장자리가 생기지 않게 해요.",
          "시트는 위 모서리만 둥글게 처리하고 하단 배경을 안전 영역까지 이어 붙여요. 실제 BottomSheetSurfaceChrome의 표면 구조를 기준으로 확인해요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/elevation",
    eyebrow: "FOUNDATIONS",
    title: "레이어",
    intro:
      "깊이는 지금 집중할 곳과 돌아갈 배경의 관계를 알려줘요. 표면의 모양, 겹침 순서, 입력과 접근성의 범위를 함께 정해요.",
    sections: [
      {
        id: "levels",
        title: "표면의 역할을 먼저 정해요",
        body: "기본 내용은 여백과 경계로 묶고, 떠 있는 표면에는 필요한 경우 그림자와 가림막을 사용해요. 그림자가 진하다고 모든 화면 위에 표시되는 것은 아니에요.",
        items: [
          "SectionCard는 표면색과 선택적인 1pt 경계로 정보를 묶어요. 카드마다 그림자를 더해 계층을 만들지 않아요.",
          "시트는 원래 화면 위에서 이어지는 작업을 담고, 확인창은 현재 작업에서 결정해야 할 내용을 담아요.",
          "토스트는 짧은 결과 안내예요. 사용자가 반드시 읽고 결정해야 하는 오류나 삭제 영향은 일시적인 토스트만으로 전달하지 않아요.",
        ],
      },
      {
        id: "presentation",
        title: "표시되는 컨테이너를 먼저 확인해요",
        body: "SwiftUI의 zIndex는 같은 컨테이너 안의 겹침 순서를 정해요. 시스템 sheet·alert 같은 별도 presentation 위로 올리는 전역 번호가 아니에요. 어느 화면이나 시트에 속한 내용인지부터 결정하세요.",
        items: [
          "AppShellView의 기본 화면과 staged sheet는 같은 셸의 ZStack에서 순서를 관리해요. 배경·시트·시트 위 편집기를 각각의 역할로 구분해요.",
          "BottomSheetShell.floatingLayer는 해당 시트의 위에 놓는 슬롯이에요. 다른 시스템 presentation까지 넘는 전역 오버레이로 사용하지 않아요.",
          "시트 안에서 열린 메뉴나 확인은 그 시트가 닫힐 때의 처리도 함께 정해요. zIndex 숫자를 크게 만드는 것으로 소유 관계를 대신하지 않아요.",
        ],
      },
      {
        id: "focus",
        title: "보이는 순서와 조작 순서를 맞춰요",
        body: "모달이 열리면 사용자와 보조 기술이 현재 모달에 집중할 수 있어야 해요. 가려진 화면의 버튼이 눌리거나 읽히지 않도록 입력과 접근성 범위를 함께 관리하세요.",
        items: [
          "AppShell의 staged sheet가 열리면 배경 화면의 터치와 접근성 탐색을 막고, 시트는 모달 의미를 가져야 해요. 시트 위 확인창이 열리면 아래 시트도 탐색에서 제외해요.",
          "닫기·취소·배경 누르기는 각각의 화면 계약을 따라요. 저장 중이거나 되돌릴 수 없는 결정에서는 모든 닫기 방법이 같은 결과를 내는지 확인해요.",
          "닫힌 뒤 현재 작업의 맥락을 다시 찾을 수 있는지 VoiceOver와 실제 조작으로 확인해요. 모달 trait만 추가한 것을 전체 초점 복귀 검증으로 보지 않아요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/state",
    eyebrow: "FOUNDATIONS",
    title: "상태",
    intro:
      "상태는 무엇이 선택되었고 지금 무엇을 할 수 있는지 알려줘요. 선택 여부, 누르는 순간, 실행 가능 여부, 처리 중 여부를 각각 판단해요.",
    sections: [
      {
        id: "model",
        title: "서로 다른 질문을 나눠요",
        body: "selected는 현재 선택, pressed는 누르는 동안의 반응, disabled는 실행 불가를 뜻해요. loading은 작업이 진행 중이라는 별도 정보예요. 하나의 색이나 하나의 상태 이름으로 합치지 않아요.",
        items: [
          "선택: TBSelectionCard의 isSelected처럼 사용자가 고른 값을 나타내요. 누름이 끝나도 선택은 유지될 수 있어요.",
          "누름: 입력을 전달받는 동안의 일시적 반응이에요. 누름 표시 자체를 선택 완료나 저장 성공으로 해석하지 않아요.",
          "실행 가능 여부: PrimaryButton과 TBSelectionCard의 isEnabled 및 상위 SwiftUI 환경의 isEnabled를 함께 따라요.",
        ],
      },
      {
        id: "combinations",
        title: "선택한 항목도 다시 누를 수 있어요",
        body: "selected와 pressed는 동시에 나타날 수 있어요. 누르는 동안에도 선택을 나타내는 체크·경계·텍스트를 유지하고, 손을 놓으면 누름 반응만 끝내요.",
        items: [
          "선택 + 누름: 선택 표시 위에 누름 표면색과 크기 반응을 더해요. 누른 동안 선택색을 지우지 않아요.",
          "선택 + 비활성: 무엇이 선택되었는지는 남기고 실행만 막아요. 비활성이라는 이유로 선택값을 임의로 해제하지 않아요.",
          "비활성 + 누름: 실행과 누름 피드백을 제공하지 않아요. 상위 컨테이너가 비활성화한 경우에도 같은 규칙을 따라요.",
        ],
      },
      {
        id: "disabled",
        title: "비활성과 조건 안내를 구분해요",
        body: "isEnabled=false는 행동을 실행할 수 없는 실제 비활성이에요. visualDisabled는 비활성처럼 보이되 눌러서 필요한 조건을 안내할 수 있는 기존 옵션이에요. 두 상태의 행동을 같다고 가정하지 않아요.",
        items: [
          "실제 비활성: 실행을 막고 비활성 색을 사용해요. 전체 opacity를 내려 주변 내용까지 흐리게 만들지 않아요.",
          "조건 안내: isEnabled=true, visualDisabled=true라면 콜백이 실행돼요. 사용처는 미충족 조건을 설명하고 실제 저장·이동은 조건을 다시 확인해요.",
          "실제 비활성과 조건 안내가 함께 설정되면 실행 불가가 우선해요. 눌러야만 알 수 있는 필수 조건은 주변 설명으로도 제공해요.",
        ],
      },
      {
        id: "loading",
        title: "처리 중은 사용처가 명시해요",
        body: "PrimaryButton에는 별도 loading 옵션이 없어요. 저장·요청을 시작하는 화면이 처리 상태, 문구, 중복 실행 방지와 완료·실패 후 복귀를 함께 관리해요.",
        items: [
          "처리 중에는 “저장 중”처럼 현재 작업을 알리고 isEnabled=false로 중복 실행을 막아요. 진행 표시만 바꾸는 것으로 실행이 막히지는 않아요.",
          "성공 응답을 확인한 뒤 완료 상태를 보여줘요. 손을 놓거나 누름 애니메이션이 끝난 시점을 완료로 사용하지 않아요.",
          "실패하면 현재 입력과 작업 상태를 확인한 뒤 다시 할 수 있는 행동을 제공해요. 저장 여부가 불확실하면 같은 요청을 바로 반복하도록 유도하지 않아요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/feedback",
    eyebrow: "FOUNDATIONS",
    title: "누름 피드백",
    intro:
      "입력을 받았다는 반응은 누르는 즉시 보여줘요. 선택과 결과의 의미를 유지하면서 조작한 대상의 표면과 크기만 잠깐 바꿔요.",
    sections: [
      {
        id: "press",
        title: "크기와 표면을 함께 반응시켜요",
        body: "주요 버튼, 플로의 보조 행동, 선택 카드에는 표면색과 크기 반응을 함께 적용해요. 기존의 일괄 0.98배 축소 대신 요소의 크기를 기준으로 축소량을 제한해요.",
        items: [
          "크기는 max(높이, 너비 ÷ 4, 24pt)를 기준으로 1pt를 줄이는 비율을 사용해요. 이 기준으로 전체 너비 감소가 최대 4pt가 되도록 해요.",
          "어두운 주요 버튼은 흰색 10%, 중립·미각 틴트 표면은 검정 6%를 겹쳐요. 글자와 선택 표시의 색은 유지해요.",
          "전환은 기존 TasteBloomMotion의 press 역할과 120ms 스프링을 유지해요. 역할의 시간과 실제 스프링의 안착 시간은 구분해요.",
        ],
      },
      {
        id: "cancel",
        title: "누름이 끝나면 원래 상태로 돌아와요",
        body: "손을 놓거나 누름이 취소되면 표면과 크기를 복원해요. 선택 상태와 입력값은 해당 행동이 실제로 실행되었는지에 따라 유지하거나 바뀌어야 해요.",
        items: [
          "손가락이 조작 영역 밖으로 나가거나 스크롤로 바뀌는 경우를 확인해요. 취소된 누름을 완료 행동으로 처리하지 않아요.",
          "누름 반응은 Button의 pressed 상태를 따르고, 데이터 저장과 화면 이동은 action에서 처리해요.",
          "성공·실패·되돌리기 같은 결과 안내는 관련 컴포넌트와 패턴에서 선택해요. 모든 입력에 완료 토스트나 햅틱을 추가하지 않아요.",
        ],
      },
      {
        id: "reduce-motion",
        title: "동작 줄이기에서도 입력은 보여줘요",
        body: "동작 줄이기가 켜지면 크기 축소와 애니메이션을 생략하고 표면색 변화만 즉시 보여줘요. 실제 비활성 상태에는 표면 반응도 적용하지 않아요.",
        items: [
          "접근성의 동작 줄이기 값을 받아 누름·복원 모두 같은 정책을 적용해요.",
          "visualDisabled는 실제 실행 불가와 달라요. 조건을 설명하는 행동이 가능한 동안에는 누름 반응을 제공해요.",
          "모든 기존 TBTokenButtonStyle 사용처를 한 번에 바꾸지 않아요. 새 규칙은 도입한 컴포넌트의 표면·상태와 함께 확인해요.",
        ],
      },
      {
        id: "nested",
        title: "한 번의 입력에 한 대상만 반응해요",
        body: "카드 안에 별도 버튼이 있으면 어느 영역이 행동을 소유하는지 분명해야 해요. 안쪽 행동을 눌렀는데 카드 전체와 버튼이 함께 축소되거나 같은 행동이 두 번 실행되지 않게 해요.",
        items: [
          "카드 전체가 하나의 행동이면 표면·내용을 하나의 조작 대상으로 묶어요.",
          "독립적인 내부 행동이 있으면 부모와 자식의 조작 영역을 분리해요. 중첩 Button으로 두 행동을 겹치지 않아요.",
          "정적인 TasteChip이나 단순 정보 카드에는 누름 피드백을 붙이지 않아요. 실제로 실행할 행동이 있는 요소에만 적용해요.",
        ],
      },
    ],
  },
  {
    slug: "foundations/icons",
    eyebrow: "FOUNDATIONS",
    title: "아이콘과 이미지",
    intro: "아이콘은 행동을 알아보게 하고, 이미지는 경험의 맥락을 담아요.",
    sections: [
      {
        id: "icons",
        title: "명확한 이름이 먼저",
        body: "제품의 기존 아이콘과 Lucide를 사용하며 일반적인 선 두께를 유지해요. 아이콘 버튼에는 행동을 설명하는 접근 가능한 이름과 44px 이상의 클릭 영역을 제공해요. 장식은 숨김 처리해요.",
      },
      {
        id: "images",
        title: "이미지의 맥락",
        body: "식사 사진은 실제 경험을 대표하며 개인 기록을 문서 예제에 사용하지 않아요. 로고·BX는 원본 비율을 보존하고 미리보기 컨테이너에서 잘라내지 않아요.",
      },
      {
        id: "bloom",
        title: "Bloom은 이미지 이상의 규칙",
        body: "Taste Bloom의 꽃잎은 미각 관계를 표현해요. 데이터가 없는 상태를 임의의 꽃으로 해석하지 않고 텍스트 대안을 제공해요. BX 장식형 Bloom은 데이터형과 적용 맥락이 달라요.",
      },
    ],
  },
  {
    slug: "patterns/dining",
    eyebrow: "PATTERNS",
    title: "식사 기록",
    intro: "먹은 경험을 남기고, 사용자가 입력한 정보에서 해석을 시작해요.",
    sections: [
      {
        id: "entry",
        title: "시작 조건",
        body: "식사 기록 진입 행동에서 시작해요. 현재 입력값과 수정 중인 기록의 식별자를 구분하고 예제에는 합성 데이터만 사용해요.",
      },
      {
        id: "steps",
        title: "단계와 분기",
        body: "식사 맥락 → 감각 선택 → 별도 평가 → 결과 확인. 사진·장소 정보가 없어도 실제 허용되는 필수 입력 기준을 따르고 선택되지 않은 감각을 0 강도나 싫어함으로 채우지 않아요.",
      },
      {
        id: "back",
        title: "중단과 복귀",
        body: "뒤로 가기는 방문한 단계로 돌아가요. 중단 시 보존 범위는 실제 저장 구현이 책임져요. 문구만으로 미구현 보존을 약속하지 않아요.",
      },
      {
        id: "complete",
        title: "완료 조건",
        body: "기록 저장이 성공한 뒤 결과로 이동해요. 식사 날짜와 저장 날짜를 구분하고, 해석은 관찰한 정보의 범위를 넘지 않아요.",
      },
    ],
  },
  {
    slug: "patterns/sensory",
    eyebrow: "PATTERNS",
    title: "감각을 고르는 흐름",
    intro: "무엇을 느꼈는지와 어떻게 평가하는지를 분리해요.",
    sections: [
      {
        id: "entry",
        title: "시작과 선택",
        body: "현재 음식의 감각 선택 화면에서 시작해요. 감각 버블과 상세 태그는 dining-sensory-selection/2 카탈로그의 이름과 정의를 사용해요.",
      },
      {
        id: "branch",
        title: "분기와 변경",
        body: "선택한 버블의 상세 태그를 펼치고 해제할 수 있어요. 존재·강도·호감은 다른 입력으로 유지해요. 선택하지 않았다는 이유로 불호를 추론하지 않아요.",
      },
      {
        id: "finish",
        title: "복귀와 완료",
        body: "상세 선택에서 돌아오면 상위 화면의 맥락을 유지해요. 완료 전 선택 요약을 확인하고 결과에는 기록한 감각만 표시해요.",
      },
    ],
  },
  {
    slug: "patterns/interpretation",
    eyebrow: "PATTERNS",
    title: "기록에서 해석으로",
    intro: "관찰, 조건, 해석의 순서로 근거를 연결해요.",
    sections: [
      {
        id: "entry",
        title: "시작 조건과 정보 위계",
        body: "유효한 기록이 있는 경우 해석을 제시해요. 제목은 짧은 감각 언어, 본문은 관찰, 보조 정보는 기간·표본 수·조건을 담아요.",
      },
      {
        id: "uncertainty",
        title: "불확실성과 분기",
        body: "표본이 적거나 충돌하면 단정 대신 가능성과 추가 기록 필요성을 설명해요. 기록 없음은 취향 없음이 아니며 별도의 빈 상태예요.",
      },
      {
        id: "detail",
        title: "상세와 복귀",
        body: "카드를 열어 근거를 확인하고 닫으면 같은 위치로 돌아와요. 사용자가 해석을 이해하고 기록을 다시 확인할 수 있으면 흐름이 완료돼요.",
      },
    ],
  },
  {
    slug: "patterns/revision",
    eyebrow: "PATTERNS",
    title: "원본을 바로잡는 흐름",
    intro: "회고를 수정해도 감각 응답과 음식 전체 평가는 유지해요. 저장 전 초안과 현재 원본을 구분합니다.",
    sections: [
      {
        id: "entry",
        title: "음식 기억에서 수정해요",
        body: "내 기록 검색 → 음식 기억 → 회고·식사 시점 바로잡기. 기존 TasteDetailGroup 안의 전체 행 버튼으로 수정·전체 편집·비교를 묶고, 삭제는 별도 행동으로 분리해요.",
      },
      {
        id: "editing",
        title: "바뀐 내용이 있을 때 저장해요",
        body: "TBTextArea는 레이블·편집 영역·안내를 구분해요. 원문을 그대로 복사한 로컬 초안에서 편집하고 변경이 없으면 저장을 비활성화해요. 빈 회고는 허용하며 원문을 임의로 다듬거나 평가값을 채우지 않아요.",
        items: ["회고와 식사 시점·음식 출처만 수정해요. 전체 감각 응답 수정은 별도의 기존 편집 경로를 사용해요.", "키보드는 별도의 닫기 행동으로 내릴 수 있어요. 큰 글자에서는 편집 영역을 넓히고 바깥 내용은 스크롤해요."],
      },
      {
        id: "cancel",
        title: "취소는 저장과 달라요",
        body: "변경이 없으면 바로 닫아요. 수정한 내용이 있으면 ‘계속 수정’과 ‘변경 내용 버리기’를 선택해요. 수정 중에는 시트를 쓸어내려 실수로 닫지 않도록 막고 취소 버튼을 남겨요.",
      },
      {
        id: "save",
        title: "현재 원본을 확인한 뒤 저장해요",
        body: "편집을 시작한 원본을 초안과 함께 보관하고, 기존 updateDiningEntry의 expected 검사로 현재 원본과 비교해요. 다른 화면의 새 원본을 오래된 초안으로 덮어쓰지 않아요. 저장에 실패하면 현재 화면의 Callout을 읽고 입력을 유지한 채 확인할 수 있어요. 로컬 저장 성공과 원격 동기화 완료를 같은 것으로 안내하지 않아요.",
      },
      {
        id: "scope",
        title: "구현과 검증 범위",
        body: "iOS FoodMemoryDetailView·FoodMemoryCorrectionSheet와 DiningFeedbackSheet.reflectionView에 연결했어요. 웹 입력 프리뷰와 Android의 편집 흐름은 이번 iOS 변경과 별도예요. 실행·실기기·VoiceOver의 확인 여부는 해당 변경 기록을 기준으로 읽어야 해요.",
        items: ["실제 사용처: ios/TasteBuddy/Features/Home/FoodMemoryViews.swift", "공용 입력: ios/TasteBuddy/Components/NativeInputComponents.swift → TBTextArea", "다이닝 사용처: ios/TasteBuddy/Features/Dining/DiningView.swift → reflectionView"],
      },
    ],
  },
  {
    slug: "patterns/recovery",
    eyebrow: "PATTERNS",
    title: "검색, 빈 상태와 복구",
    intro: "결과가 없거나 실패해도 다음 선택을 할 수 있게 해요.",
    sections: [
      {
        id: "search",
        title: "검색과 필터",
        body: "검색어와 선택된 필터를 명확히 보여줘요. 결과가 없으면 조건 지우기·변경을 제공하고 최초 기록 없음과 다른 문구를 사용해요.",
      },
      {
        id: "error",
        title: "실패와 재시도",
        body: "네트워크·권한·입력 오류를 구분해요. 재시도 중 중복 실행을 막고 완료·실패를 알립니다. 저장 상태가 불명확하면 서버 확인을 우선해요.",
      },
      {
        id: "exit",
        title: "중단·복귀·완료",
        body: "다시 시도하거나 입력을 수정하거나 안전하게 닫을 수 있어요. 실제 성공 응답이 도착했을 때만 완료 피드백을 보여줘요.",
      },
    ],
  },
  {
    slug: "writing",
    eyebrow: "CONTENT & WRITING",
    title: "친절하고, 구체적으로",
    intro: "과장하지 않고 사용자의 다음 행동을 돕는 문장을 써요.",
    sections: [
      {
        id: "voice",
        title: "브랜드의 목소리",
        body: "차분하게 초대하고 정확하게 설명해요. 제품 본문은 해요체, 짧은 버튼은 행동형, 제목은 간결한 명사·문장형을 사용해요. 느낌표와 평가성 칭찬은 줄여요.",
      },
      {
        id: "terms",
        title: "용어를 구분해요",
        body: "미각: 단맛·신맛·쓴맛·짠맛·감칠맛·지방맛. 감각: 식사에서 느낀 특성. 강도: 얼마나 느꼈는지. 호감: 얼마나 좋았는지. 적절성: 그 음식과 상황에 알맞았는지. 식사 평가: 음식 전체에 대한 평가.",
      },
      {
        id: "examples",
        title: "상황에 맞는 안내",
        body: "온보딩은 목적을, 입력 도움말은 형식을, 권한 요청은 쓰임을, 로딩은 처리 대상을 말해요. 오류는 실패한 대상과 다음 행동을 함께 설명해요.",
        items: [
          "빈 상태: “아직 식사 기록이 없어요. 첫 경험을 남겨 보세요.”",
          "입력: “음식 이름을 입력해 주세요.”",
          "권한: “식사 사진을 추가하려면 사진 접근이 필요해요.”",
          "로딩: “기록을 살펴보고 있어요.”",
          "오류: “사진을 불러오지 못했어요. 다시 선택해 주세요.”",
        ],
      },
      {
        id: "actions",
        title: "확인 대신 실제 행동",
        body: "버튼은 “확인”보다 “기록 완료”, “다시 시도”, “기록 삭제”처럼 결과를 알려줘요. 삭제 설명에는 실제 복구 가능 여부를 확인해서 적어요. 보존 동작을 확인하기 전 “입력은 안전하게 보관돼요”라고 쓰지 않아요.",
      },
    ],
  },
  {
    slug: "motion",
    eyebrow: "INTERACTION & MOTION",
    title: "의미가 드러나는 순간",
    intro: "입력, 상태 변화, 피드백, 종료를 하나의 동작으로 연결해요.",
    sections: [
      {
        id: "roles",
        title: "다섯 가지 역할",
        body: "Press 120ms, Feedback 180ms, Content 300ms, Sheet 500ms, Bloom 720ms. 역할 토큰은 기본값이며 resultBloom 같은 시그니처는 자체 시간·키프레임을 유지해요.",
      },
      {
        id: "contract",
        title: "시작과 종료가 분명한 움직임",
        body: "입력 직후 누름 피드백, 저장 성공 후 완료 피드백을 보여줘요. 취소·재입력 시 진행 중인 효과를 끝내고 최신 상태만 남겨요. 차트의 애니메이션은 원래 데이터의 비율을 바꾸지 않아요.",
      },
      {
        id: "reduced",
        title: "동작 줄이기",
        body: "이동·확대 대신 최종 상태와 텍스트 피드백을 제공해요. 브랜드 영상은 기본 수동 재생이며 화면 밖과 백그라운드에서는 멈춰요. 운영체제 설정을 존중하고 사용자가 명시적으로 재생할 수 있게 해요.",
      },
    ],
  },
  {
    slug: "accessibility",
    eyebrow: "ACCESSIBILITY",
    title: "다른 방식으로도 같은 경험",
    intro: "보이는 외형만으로 완료를 판단하지 않아요.",
    sections: [
      {
        id: "keyboard",
        title: "키보드와 초점",
        body: "Tab 순서는 읽는 순서를 따르고 초점을 항상 표시해요. 모달은 초점을 내부에 가두며 Escape로 닫고 열었던 버튼으로 돌려줘요. 현재 페이지와 선택 상태를 프로그램으로 알 수 있어야 해요.",
      },
      {
        id: "read",
        title: "읽기와 대비",
        body: "작은 본문은 최소 4.5:1 대비를 목표로 해요. 시각적 경계의 낮은 대비를 텍스트까지 확대 적용하지 않아요. 이미지 대체 정보, 입력 레이블, 오류 연결과 라이브 피드백을 제공합니다.",
      },
      {
        id: "resize",
        title: "확대와 작은 화면",
        body: "320px 너비, 긴 한국어와 200% 확대에서 내용·행동·초점이 잘리지 않는지 확인해요. 표와 코드는 구획 안에서만 스크롤하고 페이지 전체에 가로 넘침을 만들지 않아요.",
      },
      {
        id: "motion",
        title: "동작과 플랫폼 확인",
        body: "동작 줄이기를 지원하고 자동 반복을 제한해요. 웹 키보드 통과는 VoiceOver·TalkBack·실기기 통과가 아니에요. 각각 별도의 검증 근거를 남깁니다.",
      },
    ],
  },
  {
    slug: "governance",
    eyebrow: "RESOURCES & GOVERNANCE",
    title: "같이 바꾸고, 근거를 남겨요",
    intro: "Figma, 코드, 문서가 어느 지점에서 연결되는지 추적할 수 있게 해요.",
    sections: [
      {
        id: "version",
        title: "Plating v1 · 2026.09.30",
        body: "31개 컴포넌트 계열, 4개 제품 흐름, 현재 라이트 토큰과 17개 기존 BX 렌더를 v1에 포함해요. 다크 모드, 새로운 제품 정책, 전체 Android 시각 동등성은 후속 범위예요.",
      },
      {
        id: "process",
        title: "변경 절차",
        body: "사용처와 문제 → 영향받는 ID → 코드·Figma 수정 → 문서와 대응표 갱신 → 해당 플랫폼 검증 → 변경 이력 기록. 소스만 바뀐 경우 검증 상태를 유지하지 말고 다시 확인해요.",
      },
      {
        id: "sync",
        title: "동기화의 범위",
        body: "모션 CSS는 design:motion과 test:motion으로 원본 레시피와 검사해요. BX 복사본은 sync-plating-assets.mjs에서 해시·미디어 규격을 기록해요. Figma는 자동 동기화가 아니라 실제 노드 ID를 가진 명시적 스냅샷이에요.",
      },
      {
        id: "migration",
        title: "기존 문서에서 이동",
        body: "기존 /design-system#motion은 새 모션 문서로 연결해요. 이전 전체 플레이그라운드는 /design-system/legacy에 보존했어요. 사용 중인 제품 토큰과 모션 레시피의 이름은 유지합니다.",
      },
      {
        id: "changes",
        title: "이번 보완",
        body: "탐색·검색·상세 프리뷰·모바일 메뉴·미디어 제어를 새로 구현했어요. 미각 칩의 0값과 텍스트 대비, 토스트의 가독성과 행동 연결을 보완하고 플랫폼 차이를 문서화했어요.",
      },
    ],
  },
];
export type PlatingNavGroup = {
  id: string;
  label: string;
  entry: string;
  items: string[][];
};

export const componentNavGroup: PlatingNavGroup = {
  id: "components",
  label: "Components",
  entry: "components",
  items: [
    ["components", `전체 컴포넌트 (${components.length})`],
    ...[...components]
      .sort((a, b) => a.name.localeCompare(b.name, "en"))
      .map(({ id, name }) => [`components/${id}`, name]),
  ],
};

export const navGroups: PlatingNavGroup[] = [
  {
    id: "getting-started",
    label: "시작하기",
    entry: "getting-started",
    items: [
      ["getting-started", "소개와 사용법"],
      ["principles", "제품 원칙"],
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    entry: "foundations",
    items: [
      ["foundations", "전체보기"],
      ["foundations/design-tokens", "디자인 토큰"],
      ["foundations/colors", "색상"],
      ["foundations/typography", "타이포그래피"],
      ["foundations/layout", "레이아웃"],
      ["foundations/spacing", "스페이싱"],
      ["foundations/radius", "반경"],
      ["foundations/elevation", "레이어"],
      ["foundations/state", "상태"],
      ["foundations/feedback", "누름 피드백"],
      ["foundations/icons", "아이콘과 이미지"],
      ["writing", "콘텐츠와 라이팅"],
      ["motion", "인터랙션과 모션"],
      ["accessibility", "접근성"],
    ],
  },
  componentNavGroup,
  {
    id: "patterns",
    label: "Patterns",
    entry: "patterns/dining",
    items: [
      ["patterns/dining", "식사 기록"],
      ["patterns/sensory", "감각 선택"],
      ["patterns/interpretation", "취향 해석"],
      ["patterns/revision", "원본 수정과 복귀"],
      ["patterns/recovery", "검색과 복구"],
    ],
  },
  {
    id: "brand",
    label: "브랜드",
    entry: "brand-assets",
    items: [["brand-assets", "전체 브랜드 에셋"]],
  },
  {
    id: "resources",
    label: "Resources",
    entry: "audit",
    items: [
      ["audit", "현재 자산과 대응표"],
      ["governance", "운영과 변경 이력"],
    ],
  },
];
export const references = [
  {
    name: "SEED",
    url: "https://seed-design.io/",
    observation: "브랜드 홈과 문서의 별도 위계, 좌측 분류와 본문 목차",
    application:
      "홈은 BX를 크게 보여주고 문서는 고정 탐색과 읽기 폭을 사용해요.",
  },
  {
    name: "Montage",
    url: "https://montage.wanted.co.kr/",
    observation: "시각적인 컴포넌트 목록과 분류, 예제 중심의 문서",
    application:
      "실제 제품 외형을 썸네일로 보여주고 규격·상태·코드를 연결해요.",
  },
  {
    name: "SOCARFRAME",
    url: "https://socarframe.socar.kr/",
    observation: "브랜드 영상 진입과 UX 판단 원칙의 연결",
    application: "Remotion 원본과 의도 → 판단 → 예시 → 예외 구조를 적용해요.",
  },
  {
    name: "Toss",
    url: "https://toss.tech/article/8-writing-principles-of-toss",
    observation: "사용자가 이해하는 구체적 언어와 다음 행동",
    application: "상황별 문구에 실패 대상과 행동을 명시해요.",
  },
  {
    name: "Apple HIG",
    url: "https://developer.apple.com/design/human-interface-guidelines/motion",
    observation: "목적 있는 피드백과 동작 줄이기",
    application:
      "제품 피드백과 BX 연출의 시간을 구분하고 정적 대안을 제공해요.",
  },
  {
    name: "Material",
    url: "https://developer.android.com/codelabs/m3-design-theming",
    observation: "역할 기반 색상과 의미별 토큰",
    application: "Primitive → Semantic alias로 사용 의도를 보존해요.",
  },
];
