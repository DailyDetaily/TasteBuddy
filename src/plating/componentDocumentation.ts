import { COMPONENT_TOKENS } from "../constants/designTokens";
import { PROFILE_AVATAR_SIZE_TOKENS } from "../components/system/profileAvatarSizeTokens";
import { additionalComponentDocumentation } from "./additionalComponentDocumentation";

export type PreviewOptions = Record<string, string>;
export type PropertyKind = "variant" | "size" | "layout" | "slot" | "data";
export type PropertyOption = { value: string; label: string; description?: string; previewState?: string };
export type ComponentProperty = {
  key: string;
  title: string;
  api: string;
  kind: PropertyKind;
  options: PropertyOption[];
  defaultValue: string;
  description: string;
  source: "web" | "composition" | "native-spec";
  compare?: boolean;
  control?: boolean;
};
export type ComponentDocumentation = {
  anatomy: [string, string][];
  properties: ComponentProperty[];
  states: [string, string][];
  sizeNote: string;
  variantNote: string;
  slots: [string, string][];
  guidelines: string[];
  boundaries: string[];
  sources: string[];
};
const opt = (value: string, label = value, description?: string): PropertyOption => ({ value, label, description });
const options = (values: string[]) => values.map((value) => opt(value));
const yesNo = [opt("true", "표시"), opt("false", "숨김")];
const property = (
  key: string, title: string, api: string, kind: PropertyKind,
  values: PropertyOption[], defaultValue: string, description: string,
  source: ComponentProperty["source"] = "web", compare = true,
): ComponentProperty => ({ key, title, api, kind, options: values, defaultValue, description, source, compare });
const state = (...rows: [string, string][]) => rows;
const baseStates = state(["기본", "사용할 수 있는 상태예요."], ["비활성", "실행할 수 없으며 클릭과 키보드 실행을 막아요."]);
const selectionStates = state(
  ["기본", "선택하지 않은 상태예요."], ["선택", "현재 선택을 표시해요."],
  ["비활성", "선택하지 않은 채 변경을 막아요."], ["선택·비활성", "선택값을 유지하면서 변경을 막아요."],
);
const overlayStates = state(["닫힘", "실행 버튼에서 열 수 있어요."], ["열림", "오른쪽 예시는 열린 구조예요. 실제 열기와 닫기는 위 프리뷰에서 확인해요."]);
const inputStates = state(["기본", "값이 비어 있고 입력을 기다려요."], ["초점", "입력 요소에 키보드 초점이 있어요."], ["입력됨", "수정할 수 있는 값이 있어요."], ["오류", "입력과 오류 문구를 연결해요."], ["읽기 전용", "값을 읽을 수 있지만 수정하지 않아요."], ["비활성", "값 변경과 실행을 막아요."]);
const labelSlot: [string, string] = ["Label", "문구는 내용에 맞게 변경하되 역할을 알아볼 수 있게 작성해요."];
const noSize = "별도 size 옵션이 없어요. 내용과 부모 너비에 맞춰 배치하고, 글자 확대를 CSS 축소로 덮어쓰지 않아요.";
const noVariant = "별도 외형 variant가 없는 구성입니다. 슬롯과 데이터의 차이를 임의의 새 스타일로 만들지 않아요.";
const doc = (value: ComponentDocumentation) => value;
const web = (file: string) => `src/components/system/${file}.tsx`;
const ui = (file: string) => `src/components/ui/${file}.tsx`;
const native = (file: string) => `ios/TasteBuddy/Components/${file}.swift`;
const chipSizes = Object.entries(COMPONENT_TOKENS.chip.size).map(([key, value]) => opt(key, key, `글자 ${value.fontSize} · 상하 ${value.paddingBlock} · 좌우 ${value.paddingInline} · 아이콘 ${value.iconSize}`));
const avatarSizes = Object.entries(PROFILE_AVATAR_SIZE_TOKENS).map(([key, value]) => opt(key, key, `${value} × ${value}px`));

export const componentDocumentation: Record<string, ComponentDocumentation> = {
  ...additionalComponentDocumentation,
  "expandable-card": doc({
    anatomy: [["Card surface", "12pt 패딩·20pt 반경의 단일 카드예요."], ["Media", "질문 예제의 좌측 60 × 60pt 사진 또는 일러스트예요."], ["Header", "제목과 한 줄 보조 문구예요."], ["Body", "헤더 아래에 펼치는 내용 슬롯이에요."]],
    properties: [],
    states: state(["본문 접힘", "헤더와 보조 문구만 보여줘요."], ["본문 펼침", "헤더 아래의 본문을 보여줘요. 질문 예제에는 답변 선택지를 넣어요."]),
    sizeNote: "패딩 12pt·반경 20pt·헤더 최소 높이 60pt. 헤더와 본문 사이 12pt. 질문 예제의 답변 버튼은 최소 높이 44pt·좌우 패딩 10pt예요.",
    variantNote: "State는 개별 카드 본문의 접힘·펼침이에요. 질문은 사용 예이며 컴포넌트의 범위를 질문으로 제한하지 않아요.",
    slots: [["header", "미디어·제목·보조 설명과 선택적 우측 행동을 넣어요."], ["content", "답변 선택지나 추가 설명을 넣어요."]],
    guidelines: ["보조 문구는 한 줄을 넘지 않고 긴 문구는 끝을 말줄임해요.", "카드 묶음에는 StackCard를 조합해요.", "본문 펼침과 대기열 펼침을 서로 다른 상태로 관리해요."],
    boundaries: ["표본은 실제 SwiftUI 렌더이며 문구는 합성 예제예요. 정적 이미지에서는 답변·저장 동작을 실행하지 않아요.", "피그마·웹·네이티브에서 Pretendard를 사용해요. 플랫폼별 줄바꿈과 렌더링은 사용 화면에서 확인해요."],
    sources: [web("ExpandableCard"), native("NativeLayoutComponents"), "ios/TasteBuddy/Features/Analysis/SensoryAnalysisCards.swift"],
  }),
  "stack-card": doc({
    anatomy: [["Front card", "ExpandableCard 등 개별 카드 컴포넌트를 넣어요."], ["Back cards", "쌓인 상태에서만 8pt·16pt 아래에 장식 카드를 보여줘요."], ["Stack toggle", "첫 카드에 대기열을 펼치거나 접는 별도 행동을 넣어요."]],
    properties: [],
    states: state(["스택 쌓임", "첫 카드와 뒤쪽 장식 두 장을 보여줘요."], ["스택 펼침", "장식을 없애고 카드 3개를 아래로 나열해요. 첫 카드만 접기 토글을 보여줘요."]),
    sizeNote: "스택 자체의 내부 패딩은 0pt예요. 펼친 카드 간격은 12pt이고, 쌓인 상태의 아래 장식 공간은 16pt예요. 개별 카드의 패딩·본문 규격은 ExpandableCard에서 정의해요.",
    variantNote: "State는 카드 묶음의 쌓임·나열이에요. 개별 카드의 답변 접힘·펼침은 ExpandableCard의 상태예요.",
    slots: [["content", "호출부가 선택한 표시 카드를 넣어요."], ["isExpanded / showsStack", "세로 나열 상태와 접힌 상태의 장식 표시를 관리해요."]],
    guidelines: ["질문·발견처럼 같은 대기열의 카드를 묶어요.", "대기열 토글은 첫 카드에만 넣어요.", "뒤쪽 장식의 수를 실제 카드 수로 해석하지 않아요."],
    boundaries: ["표본은 실제 SwiftUI 렌더이며 질문 문구는 합성 예제예요. 홈의 순서·최대 3개 표시·전체보기는 호출부의 정책이에요.", "피그마·웹·네이티브에서 Pretendard를 사용해요. 플랫폼별 줄바꿈과 렌더링은 사용 화면에서 확인해요."],
    sources: [web("StackCard"), native("NativeLayoutComponents"), "ios/TasteBuddy/Features/Home/HomeSummaryComponents.swift"],
  }),
  "primary-button": doc({
    anatomy: [["Container", "배경·최소 높이·터치 영역을 제공해요."], labelSlot],
    properties: [
      property("size", "Size", "size", "size", [opt("default", "Default", "최소 48px"), opt("compact", "Compact", "최소 40px")], "default", "기본 행동에는 Default, 좁은 보조 영역에는 Compact를 써요."),
      property("fullWidth", "Width", "fullWidth", "layout", [opt("true", "Fill"), opt("false", "Content")], "true", "부모 너비를 채우거나 내용 너비로 배치해요."),
    ],
    states: state(...baseStates, ["누름", "실제 포인터·키보드 입력 시 눌림 반응을 제공해요. 아래에는 눌린 형태를 보여줘요."], ["처리 중", "화면이 문구·aria-busy·중복 실행 방지를 함께 관리해요."], ["설명 가능한 비활성", "visualDisabled는 외형만 바꾸므로 클릭해 이유를 설명할 수 있어요."]),
    sizeNote: "Default 48px / Compact 40px는 최소 높이예요. 긴 한국어는 줄바꿈하며 버튼 높이가 늘어나요.",
    variantNote: "웹 PrimaryButton에는 색상 variant가 없어요. Native appearance의 primary/tasteTint는 별도 계약이며 아래 웹 예제를 새 API로 오해하지 않아요.",
    slots: [labelSlot], guidelines: ["한 화면의 다음 행동을 대표하는 문구를 사용해요.", "visualDisabled와 실제 disabled를 서로 바꾸지 않아요.", "처리 중 상태는 성공·실패·취소와 함께 화면이 관리해요."],
    boundaries: ["Native tasteTint는 원본에 존재하지만 이 웹 컴포넌트의 prop은 아니에요."], sources: [web("PrimaryButton"), native("TBComponents")],
  }),
  "icon-button": doc({
    anatomy: [["Target", "아이콘보다 넓은 버튼 영역이에요."], ["Icon", "행동을 나타내는 심볼이에요."]],
    properties: [property("icon", "Icon", "icon", "slot", options(["close", "search", "filter"]), "close", "아이콘을 바꾸면 접근성 이름도 바꿔요."), property("iconSize", "Icon size", "iconSize", "size", [opt("16", "16px"),opt("20", "20px"),opt("24", "24px")], "20", "아이콘 크기를 바꿔도 바깥 버튼 영역은 유지해요."), property("stroke", "Stroke", "iconStrokeWidth", "data", options(["1.5", "1.8", "2"]), "1.8", "같은 화면에서는 동일한 선 두께를 사용해요.", "web", false)],
    states: baseStates, sizeNote: "웹 버튼 영역은 ICON_TOKENS.container.lg를 사용해요. 아이콘 16/20/24px는 iconSize의 예시 값이며 Native 터치 목표와 구분해요.", variantNote: noVariant,
    slots: [["icon", "ElementType으로 전달해요. svg 장식과 버튼 이름을 중복해서 읽지 않게 해요."]], guidelines: ["닫기·검색·필터처럼 익숙한 행동에 사용해요.", "ariaLabel은 아이콘 모양 대신 수행하는 행동을 말해요."], boundaries: ["BottomSheetIconButton을 재사용해요. 배경형/테두리형이라는 별도 variant API는 없어요."], sources: [web("BottomSheetShell")],
  }),
  "text-input": doc({
    anatomy: [["Label", "입력 대상의 이름이에요."], ["Input", "키보드로 값을 직접 입력해요."], ["Message", "도움말 또는 오류를 안내해요."]],
    properties: [property("inputType", "Input type", "type", "variant", options(["text", "email", "password"]), "text", "입력값의 목적에 맞게 지정해요.", "web", false)],
    states: inputStates,
    sizeNote: "프로필 기준 최소 높이 48px/pt · 반경 12 · 좌우 12 · 라벨 12 SemiBold · 값 14 SemiBold · 도움말 11 Regular. Native의 dining 44와 auth 48 규격도 유지해요.",
    variantNote: "직접 타이핑하는 입력 필드예요. 선택창을 여는 필드는 SelectField를 사용해요.",
    slots: [["label / placeholder", "입력 대상과 빈 값의 안내를 구분해요."], ["helperText / error", "오류가 있으면 도움말보다 먼저 표시해요."], ["value / onChange", "입력 상태와 검증은 화면에서 관리해요."]],
    guidelines: ["프로필 이름과 버디네임에 같은 컴포넌트를 사용해요.", "TextInput과 SelectField는 라벨·높이·배경·테두리·메시지 규칙을 공유해요."],
    boundaries: ["값 검증, 저장 요청, 계정 동기화는 필드의 책임이 아니에요."],
    sources: [web("TextInput"), web("FormField"), native("NativeInputComponents"), "ios/TasteBuddy/Components/Shell/AppShellView.swift"],
  }),
  "search-field": doc({
    anatomy: [["Search icon", "검색 입력이라는 맥락을 제공해요."], ["Input", "검색어를 입력해요."], ["Clear", "검색어 전체를 지워요."], ["Result message", "결과 없음과 검색 범위를 안내해요."]],
    properties: [property("clear", "Clear button", "conditional clear action", "slot", yesNo, "true", "검색어가 있을 때만 보이고 읽기 전용·비활성에서는 변경하지 않아요.", "composition"),property("helper", "Result message", "aria-describedby", "slot", yesNo, "true", "입력과 결과 상태를 텍스트로 연결해요.", "composition")],
    states: state(...inputStates, ["결과 없음", "입력 실패가 아니라 일치하는 결과가 없는 상태예요."]), sizeNote: "Input과 검색 아이콘·지우기 버튼을 조합해요. 별도 Small/Large 검색 필드 API는 없어요.",variantNote: "검색 아이콘과 지우기 행동을 Input에 조합하는 예제예요.",
    slots: [["Leading", "검색 아이콘은 장식이에요."],["Trailing", "지우기 버튼에는 이름이 필요해요."],["Result", "검색 결과 수나 빈 결과를 안내해요."]],guidelines:["검색어를 지워도 입력 초점은 유지해요.","결과 없음과 서버 오류를 같은 상태로 처리하지 않아요."],boundaries:["검색 요청·취소·로딩은 예제의 로컬 상태와 별개이며 검색 화면에서 구현해요."],sources:[ui("input")],
  }),
  "selection-card": doc({
    anatomy: [["Indicator", "라디오 또는 체크 표시예요."],["Title / Description", "선택지를 이해할 수 있게 설명해요."],["Trailing", "보조 콘텐츠를 배치할 수 있어요."]],
    properties: [property("indicator", "Variant", "indicator", "variant", options(["radio","checkbox"]),"radio","단일 선택과 복수 선택의 규칙은 부모 그룹이 관리해요."),property("singleLine", "Layout", "singleLine", "layout",[opt("false","설명 포함"),opt("true","한 줄")],"false","한 줄 예제에서는 description을 생략해요."),property("trailing", "Trailing", "trailing", "slot",yesNo,"false","추가 정보나 아이콘을 배치해요.")],
    states: selectionStates,sizeNote:"너비를 채우며 패딩 16px·반경 20px를 사용해요. 별도 크기 enum은 없어요.",variantNote:"선택 표시 유형과 콘텐츠 배치를 독립적으로 바꿔요.",slots:[labelSlot,["Description","선택 전에 필요한 차이만 설명해요."],["Trailing","카드 클릭과 충돌하는 중첩 버튼은 넣지 않아요."]],guidelines:["‘직접 입력’과 설명은 메뉴 기록의 실제 선택 카드 문구예요.","라디오 외형만으로 배타 선택이 보장되지는 않아요. 그룹 값으로 제어해요.","선택 여부와 비활성 여부를 독립적으로 표현해요."],boundaries:["선택/disabled는 실제 상태지만 웹 원본에 별도의 disabled 색상 분기는 없어요. 임의로 다른 제품 외형을 덧씌우지 않아요."],sources:[web("SelectionCard"),"src/components/reservation/DiningFeedbackFlow.tsx",native("TBComponents")],
  }),
  chip: doc({
    anatomy:[["Container","크기·색·경계를 제공해요."],["Label","짧은 값이나 행동을 표시해요."],["Leading / Trailing","필요한 경우 양쪽에 아이콘을 배치해요."]],
    properties:[
      { ...property("kind", "Kind", "kind", "variant", [{value:"label",label:"디테일 기본",previewState:"디테일 기본"},{value:"add",label:"(+) 추가",previewState:"추가"},{value:"overflow",label:"(+N) 생략",previewState:"+N"}], "label", "Chip에서 디테일 표시·선택, 추가 입력, +N을 제공해요. kind를 생략하면 기존 크기·색상·아이콘 API를 사용해요."), compare: false },
      property("variant","Variant","variant","variant",options(Object.keys(COMPONENT_TOKENS.chip.tone.neutral)),"soft","soft / outline / solid / text가 실제 웹 variant예요. 선택 여부 자체를 나타내는 prop은 아니에요."),
      property("size","Size","size","size",chipSizes,"sm","xs / sm / md의 글자·패딩·아이콘 크기를 함께 바꿔요. 높이는 내용과 line-height에 따라 결정돼요."),
      property("tone","Tone","tone","variant",options(Object.keys(COMPONENT_TOKENS.chip.tone)),"neutral","neutral / success / warning / accent는 정보의 역할을 나타내요. 미각 6색과는 별개예요."),
      property("usage","Usage","asChild + button","layout",[opt("display","읽기용"),opt("action","행동"),opt("toggle","선택")],"toggle","읽기용은 span, 행동·선택은 asChild와 button으로 조합해요. 선택 상태는 호출부가 관리해요.","composition"),
      property("icons","Slots","leadingIcon / trailingIcon","slot",[opt("none","없음"),opt("leading","Leading"),opt("trailing","Trailing"),opt("both","양쪽")],"none","span 모드에서는 icon prop을 사용해요. asChild에서는 아이콘을 button 자식 안에 직접 구성해야 해요.","composition"),
    ],
    states:state(...selectionStates,["누름","누르고 있는 순간의 예시예요. 선택 결과와 구분해요."],["선택·누름","선택된 값에 대한 누름 반응이에요."],["디테일 기본","디테일 태그 화면의 36px 태그예요."],["디테일 선택","선택한 미각 색상의 태그예요."],["추가","(+)를 누르면 입력 필드가 돼요."],["입력 중","Enter로 추가하고 Escape로 취소해요."],["+N","숨겨진 태그 수를 표시해요."]),
    sizeNote:"xs: 10px / 패딩 4×8 · sm: 11px / 6×10 · md: 12px / 8×12. Native TBSelectableChip은 dining 최소 36pt, correction은 상하 패딩 9pt로 별도 계약이에요.",
    variantNote:"SEED의 Solid / Outline Strong / Outline Weak를 그대로 추가하지 않아요. Taste Buddy는 soft / outline / solid / text를 제공해요.",
    slots:[["leadingIcon / trailingIcon","기본 span에서 아이콘 슬롯을 사용할 수 있어요."],["asChild","button 자식과 함께 쓰며 아이콘도 그 자식 안에 넣어요. 선택 시 aria-pressed를 제공해요."]],
    guidelines:["예제 문구 ‘가보고 싶은 다이닝’은 저장 리스트의 추천 이름 선택에서 가져왔어요. 크기·색상·아이콘은 속성 비교를 위한 조합이에요.","선택형에서는 선택값과 disabled를 독립적으로 관리해요.","variant를 selected로 취급하지 않아요. 예제는 선택 시 solid로 매핑하는 호출부 규칙을 보여줘요.","읽기용 Chip을 클릭 가능한 것처럼 표시하지 않아요.","여러 칩의 단일/복수 선택·줄바꿈·+N은 그룹과 배치의 책임이에요."],
    boundaries:["kind=label은 selected로 선택을 표시해요. kind 생략 시 기존 asChild 버튼 조합으로 선택 상태를 관리해요. 포인터 누름은 문서의 button 조합이에요.","Native dining/correction, accentAxis, isEnabled는 TBSelectableChip의 옵션이며 웹 API와 동일하지 않아요."],sources:[web("Chip"),"src/components/restaurant/RestaurantBookmarkSheet.tsx","src/constants/designTokens.ts",native("NativeInputComponents")],
  }),
  checkbox:doc({anatomy:[["Control","16px 웹 체크 영역이에요."],labelSlot],properties:[property("invalid","Validation","aria-invalid","variant",[opt("false","기본"),opt("true","오류")],"false","그룹이나 필드의 검증 결과를 전달해요.","composition")],states:state(...selectionStates,["혼합","Radix checked=indeterminate를 전달해요. 현재 원본은 혼합 상태에도 체크 아이콘을 쓰므로 별도의 마이너스 외형으로 보지 않아요."]),sizeNote:"웹 primitive는 16px 고정이에요. Label을 포함한 충분한 클릭 영역은 조합에서 제공해요.",variantNote:"별도 size/tone API는 없고 선택·disabled·오류 상태를 조합해요.",slots:[labelSlot],guidelines:["‘돼지고기 제외’는 프로필 식이제한의 실제 복수 선택 문구예요. 여기서는 독립 Checkbox로 재현해요.","여러 독립 항목을 선택할 때 사용해요.","한 문장의 긍정/부정을 일관되게 유지해요.","전체/부분 선택의 의미와 mixed 상태를 함께 정의해요."],boundaries:["제품의 식이제한 화면은 checkbox 표시가 있는 SelectionCard를 사용해요. 이 독립 Checkbox 예제와 화면 전체를 동일하게 보지 않아요.","혼합 상태의 외형은 현재 공유 코드 그대로 표시해요. 이 문서는 아이콘 변경을 제품 전체에 적용하지 않아요."],sources:[ui("checkbox"),"src/constants/preferenceIntakeCatalog.json","src/components/ProfileEditSheetContent.tsx"]}),
  radio:doc({anatomy:[["Group","하나의 질문과 선택값을 소유해요."],["Item","value와 선택 표시를 제공해요."],labelSlot],properties:[property("orientation","Orientation","orientation + layout","layout",options(["horizontal","vertical"]),"horizontal","방향에 맞는 키보드 이동과 배치를 같이 설정해요."),property("invalid","Validation","aria-invalid","variant",[opt("false","기본"),opt("true","오류")],"false","선택이 필요한 필드의 오류를 표시해요.","composition")],states:selectionStates,sizeNote:"웹 원형 제어는 16px예요. 레이블을 클릭해도 선택되도록 감싸요.",variantNote:noVariant,slots:[labelSlot],guidelines:["식사 성향 질문과 세 선택지는 실제 초기 선호 입력의 문구예요. 문서에서는 RadioGroup으로 단일 선택을 재현해요.","한 그룹에서 하나만 선택해요.","키보드 방향키로 같은 그룹의 항목을 이동해요.","옵션 의미를 바꾸면서 선택값을 그대로 유지하지 않아요."],boundaries:["선택 카드와 라디오 그룹은 같은 API가 아니에요."],sources:[ui("radio-group"),"src/constants/preferenceIntakeCatalog.json","src/pages/PreferenceIntakeScreen.tsx"]}),
  switch:doc({anatomy:[["Track","켜짐/꺼짐을 담는 배경이에요."],["Thumb","상태에 따라 위치가 바뀌어요."],labelSlot],properties:[property("size","Size","size","size",[opt("sm","Small","28×16 / thumb 12px"),opt("md","Medium","36×20 / thumb 16px"),opt("lg","Large","44×24 / thumb 20px")],"md","제어와 thumb 크기를 함께 바꿔요.")],states:state(["꺼짐","설정이 꺼져 있어요."],["켜짐","설정이 켜져 있어요."],["비활성","꺼진 채 변경을 막아요."],["켜짐·비활성","켜진 값을 유지하면서 변경을 막아요."]),sizeNote:"sm 28×16 / md 36×20 / lg 44×24px. 작은 외형과 별개로 레이블을 포함한 클릭 영역을 확보해요.",variantNote:"별도 tone API는 없어요. 켜짐/꺼짐과 disabled는 독립적인 상태예요.",slots:[labelSlot],guidelines:["‘비밀 리스트로 설정하기’는 저장 리스트 작성 화면의 실제 Switch 문구예요. 여기서는 로컬 예제의 값만 변경해요.","설정값의 적용 시점은 사용처가 정해요. 리스트 작성 화면에서는 작성 중인 공개 여부를 바꿔요.","켜짐과 꺼짐 사이에서 레이블 문구를 바꾸지 않아요."],boundaries:[],sources:[ui("switch"),"src/components/restaurant/NativeBookmarkSheet.tsx"]}),
  "top-bar":doc({anatomy:[["Leading","뒤로·프로필·기본 여백이에요."],["Title","현재 화면 제목이에요."],["Trailing","해당 화면의 보조 행동이에요."]],properties:[property("appearance","Appearance","TopAppBar.appearance","variant",options(["default","solid","transparent","glass"]),"default","일반 배경과 버블 맵의 개별 글래스 표면을 비교해요. Glass는 실제 웹 TopAppBar의 참고 구현이에요.","native-spec"),property("back","Leading","showBack","slot",yesNo,"true","루트와 상세의 돌아가기 역할을 구분해요.","native-spec"),property("actions","Trailing","showsDefaultActions / rightActions","slot",yesNo,"true","관련 행동만 표시해요.","native-spec")],states:state(["기본","해당 제목과 액션을 표시해요."]),sizeNote:"Native 일반형은 내용 32pt + 상하 8pt = 48pt, Glass는 40pt예요. Glass 제목은 Bold 15·좌우 패딩 12, 버튼은 40pt·아이콘 24pt이며 safe area는 상위 화면이 관리해요.",variantNote:"default / solid / transparent / glass를 구분해요. iOS 홈은 transparent에 프로필·기본 액션을 조합하고, 버블 맵은 glass에 뒤로·제목·검색·다음을 조합해요.",slots:[["Leading / Center / Trailing","각 영역의 폭과 제목 중심을 독립적으로 관리해요."]],guidelines:["뒤로 가기는 실제 방문한 이력을 따라요.","닫기는 단계 이동과 구분해요."],boundaries:["웹의 blur 표현은 iOS glassEffect를 설명하는 참고예요. 실제 iOS 렌더는 위 캡처를 확인해요."],sources:[native("Shell/AppChromeComponents"),"src/components/TopAppBar.tsx"]}),
  "bottom-tab":doc({anatomy:[["Bar","주요 목적지의 고정 영역이에요."],["Item","아이콘·레이블·현재 목적지를 표시해요."]],properties:[property("labels","Label","label visibility example","slot",yesNo,"true","레이블이 없는 예제도 접근성 이름은 유지해요. 실제 제품은 레이블을 표시해요.","composition")],states:state(["홈","홈 목적지가 활성화되어 있어요."],["다이닝","다이닝 목적지가 활성화되어 있어요."],["분석","분석 목적지가 활성화되어 있어요."]),sizeNote:"너비는 화면에 맞춰 분배하며 하단 safe area를 더해요. 글자와 아이콘을 확대해도 라벨이 겹치지 않아야 해요.",variantNote:"홈/다이닝/분석은 크기·외형 variant가 아닌 선택된 목적지예요.",slots:[["Icon / Label","탭마다 아이콘과 목적지 이름을 유지해요."]],guidelines:["현재 목적지는 하나만 표시해요.","같은 탭을 다시 눌렀을 때의 동작은 앱 라우터가 결정해요."],boundaries:["중앙 기록 버튼의 카메라·모션은 별도 Native 구성으로 이 축약 예제에 포함되지 않아요."],sources:[native("Shell/AppChromeComponents"),native("Shell/BottomTabCenterButton")]}),
  "back-button":doc({anatomy:[["Arrow","돌아가기 방향을 나타내요."],["Label","필요하면 돌아갈 맥락을 알려줘요."]],properties:[property("labelVisible","Label","label composition","slot",yesNo,"true","문구가 없어도 버튼의 접근성 이름은 남아요.","composition")],states:baseStates,sizeNote:"터치 영역은 최소 44px을 확보하고 아이콘은 20px로 표시하는 규격 예제예요.",variantNote:noVariant,slots:[labelSlot],guidelines:["방문 이력을 한 단계 되돌려요.","상위 페이지로 이동하기와 닫기를 같은 행동으로 묶지 않아요."],boundaries:["문서 프리뷰는 이동 피드백만 표시하며 앱의 라우팅 데이터를 변경하지 않아요."],sources:[web("FlowHeaderBlock"),native("Shell/AppChromeComponents")]}),
  "step-indicator":doc({anatomy:[["Track","전체 단계 수를 알려줘요."],["Current","현재 단계의 길이와 색을 다르게 표시해요."]],properties:[property("total","Total","total","data",options(["3","5","7"]),"5","전체 단계 수예요. currentIndex는 0부터 시작해요.","web",false),property("accent","Color","activeColor / inactiveColor","variant",[opt("neutral","기본"),opt("taste","미각 강조")],"neutral","의미가 유지되는 범위에서 강조색을 지정해요.")],states:state(["첫 단계","0번 단계예요."],["중간 단계","진행 중인 중간 단계예요."],["마지막 단계","마지막 단계이며 완료 상태와 동일하지 않아요."]),sizeNote:"높이 6px, 현재 단계 너비 16px, 나머지 6px, 간격 6px예요.",variantNote:"total·currentIndex와 색을 제어하며 별도 size variant는 없어요.",slots:[],guidelines:["실제로 방문하지 않은 단계를 완료로 표시하지 않아요.","전체 수가 바뀌면 현재 index도 유효한 범위로 맞춰요."],boundaries:["이 표시 자체는 클릭 가능한 단계 이동 UI가 아니에요."],sources:[web("StepIndicator")]}),
  card:doc({anatomy:[["Media","목록에서 대상을 식별하는 시각 자료예요."],["Heading / Metadata","제목과 보조 정보를 제공해요."],["Actions","선택적인 오른쪽 내용이에요."]],properties:[property("as","Element","as","variant",options(["div","button"]),"div","표시용과 클릭 가능한 카드를 구분해요."),property("metadata","Metadata","metadata","slot",yesNo,"true","주제를 이해하는 데 필요한 짧은 보조 정보예요."),property("actions","Actions","actions","slot",yesNo,"false","부모가 button이면 추가 버튼을 중첩하지 않아요.")],states:baseStates,sizeNote:"반경 20px·패딩 12px·내부 간격 12px. 제목/메타데이터는 기본적으로 한 줄 말줄임이에요.",variantNote:"CompactCard의 as는 DOM 역할이에요. Native SectionCard와 목록형 CompactCard를 같은 외형 variant로 취급하지 않아요.",slots:[["media","필수 ReactNode예요. 장식이면 빈 대체 텍스트를 사용해요."],["heading / metadata","기록의 이름과 맥락을 전달해요."],["actions","카드 전체 클릭과 개별 액션이 충돌하지 않아야 해요."]],guidelines:["한 카드에는 한 대상의 정보만 묶어요.","긴 제목의 전체 내용은 상세 화면에서도 확인할 수 있어야 해요."],boundaries:["disabled는 as=button에만 실행을 막는 의미가 있어요."],sources:[web("CompactCard"),native("TBComponents")]}),
  "list-row":doc({anatomy:[["Label","행의 주제예요."],["Value","해당 주제의 값이에요."],["Chevron / Divider","이동 가능 여부와 행 경계를 표시해요."]],properties:[property("chevron","Chevron","showsChevron","slot",yesNo,"true","값의 표시와 이동 가능한 행을 구분해요.","native-spec"),property("divider","Divider","showsDivider","slot",yesNo,"true","그룹의 첫 행에서는 경계가 필요하지 않을 수 있어요.","native-spec"),property("layout","Layout","Dynamic Type layout","layout",[opt("row","가로"),opt("stack","큰 글자 대응")],"row","큰 글자에서는 값을 세로로 배치하는 규격을 보여줘요.","native-spec")],states:state(["기본","레이블과 값을 읽어요."]),sizeNote:"TasteDetailValueRow 최소 52pt, 좌우 16pt·상하 12pt. 큰 글자에서는 값이 아래로 이동해요.",variantNote:"이동 표시·경계·큰 글자 배치의 차이를 재현해요.",slots:[["title / value","0, 미확인, 근거 부족을 다른 값으로 표시해요."]],guidelines:["Chevron이 있는 행은 실제 이동 동작을 제공해야 해요.","미확인을 0으로 보여주지 않아요."],boundaries:["웹 규격 예제이며 현재 Native 값 행을 직접 렌더링한 것은 아니에요."],sources:[native("TasteDetailPage"),web("CardScrollList")]}),
  badge:doc({anatomy:[["Container","짧은 읽기용 레이블을 감싸요."],labelSlot],properties:[property("tone","Color pairing","color / backgroundColor","variant",[opt("default","기본"),opt("success","성공 예시"),opt("warning","주의 예시")],"default","StatusChip에 tone prop은 없어요. 의미 토큰의 전경/배경을 짝으로 전달하는 조합이에요.","composition")],states:state(["기본","상태나 분류를 읽기만 해요."]),sizeNote:"반경 6px·기본 패딩 좌우 6px/상하 2px를 사용해요. 별도 크기 prop은 없어요.",variantNote:"기본 스타일과 직접 전달하는 color/backgroundColor를 구분해요. 색상 예제는 새로운 tone API가 아니에요.",slots:[labelSlot],guidelines:["버튼이나 선택 칩처럼 사용하지 않아요.","색과 함께 상태를 말하는 문구를 제공해요."],boundaries:["알림 점/읽지 않은 개수는 NotificationBadge 역할로 별도예요."],sources:[web("StatusChip"),"src/styles/design-system.css"]}),
  avatar:doc({anatomy:[["Frame","원형 이미지 영역과 경계예요."],["Image / Initials","사진 또는 이름의 머리글자를 표시해요."],["Background","사진이 없으면 측정 기반 배경이 표시돼요."]],properties:[property("size","Size","size","size",avatarSizes,"xl","프로필 맥락에 맞게 실제 크기 토큰을 선택해요."),property("content","Content","imageSrc / initials","variant",[opt("initials","Initials"),opt("image","Image")],"initials","사진과 이니셜은 동시에 표시하지 않아요.","composition")],states:state(["기본","사진 또는 이니셜이 있어요."],["기록 없음","측정 기록 없이도 사용자의 이름을 표시해요."]),sizeNote:"sm 32 / md 42 / lg 68 / xl 96px. 사진이 없는 경우에도 같은 프레임 크기를 유지해요.",variantNote:"imageSrc가 있으면 사진, 없으면 initials와 배경으로 표현해요.",slots:[["imageSrc","예제 사진은 기존 로컬 브랜드 자산을 사용해요."],["initials","표시 이름에서 결정한 짧은 텍스트예요."]],guidelines:["프레임에 ariaLabel을 제공해 중복 낭독을 피하세요.","측정값이 없다는 사실을 사용자 식별의 부재로 표현하지 않아요."],boundaries:["사진 로딩 실패의 자동 대체는 이 컴포넌트가 제공하는 동작이 아니에요."],sources:[web("TasteProfileAvatar"),"src/components/system/profileAvatarSizeTokens.ts"]}),
  divider:doc({anatomy:[["Line","인접 정보의 경계를 구분해요."]],properties:[property("orientation","Orientation","orientation","variant",options(["horizontal","vertical"]),"horizontal","세로 구분선은 부모 높이가 필요해요."),property("decorative","Semantics","decorative","data",[opt("true","장식"),opt("false","의미 있는 경계")],"true","장식이면 스크린리더가 읽지 않아요.","web",false)],states:state(["기본","주변 콘텐츠보다 강하게 주목받지 않아야 해요."]),sizeNote:"수평은 높이 1px, 수직은 너비 1px이며 나머지 길이는 부모를 따라요.",variantNote:"방향을 제외한 굵기/색상 variant API는 없어요.",slots:[],guidelines:["마지막 항목 아래의 불필요한 경계는 생략해요.","그룹 간 여백만으로 충분하면 선을 추가하지 않아요."],boundaries:[],sources:[ui("separator")]}),
  toast:doc({anatomy:[["Media","선택적 아이콘·작은 이미지를 배치해요."],["Message","일어난 일을 짧게 알려줘요."],["Action","되돌리기 등의 행동이에요."]],properties:[property("media","Media","media","slot",yesNo,"false","알림 이해에 필요한 경우에만 사용해요."),property("action","Action","actionLabel + onAction","slot",yesNo,"false","실제 callback이 있어야 버튼이 돼요.")],states:state(["기본","행동 없이 결과를 안내해요."],["행동 포함","실행 가능한 되돌리기 버튼을 포함해요."]),sizeNote:"반경 20px·패딩 12px·메시지 13px. 긴 문구는 줄바꿈하며 버튼은 최소 높이 44px이에요.",variantNote:"웹 Surface에는 tone API가 없어요. Native의 warning은 별도 표현이며 수명은 presenter가 소유해요.",slots:[["message","ReactNode를 받아 긴 한국어도 줄바꿈해요."],["media","선택적 시각 자료예요."],["actionLabel / onAction","레이블만 제공하면 동작 없는 텍스트가 되므로 의도를 확인해요."]],guidelines:["다른 작업의 초점을 빼앗지 않아요.","실제로 복구할 수 있을 때만 되돌리기를 제공해요.","중복 교체·취소·3.5초 수명은 presenter 계약과 연결해요."],boundaries:["이 예제의 되돌리기는 합성 피드백만 표시해요."],sources:[web("ToastSurface"),native("NativeFeedbackComponents")]}),
  "inline-error":doc({anatomy:[["Input","문제가 있는 값과 연결돼요."],["Message","원인과 다음 행동을 안내해요."]],properties:[property("message","Message","error text","variant",[opt("required","필수 입력"),opt("format","형식 오류")],"required","오류 내용은 필드의 검증 결과에 맞춰 정해요.","composition"),property("helper","Visibility","aria-describedby","slot",yesNo,"true","오류를 숨기면 그 필드의 오류 설명도 사라져요. 기본은 표시예요.","composition")],states:state(["오류","Input과 메시지를 aria-describedby로 연결해요."],["읽기 전용","잘못된 값이라도 현재 화면에서 수정할 수 없는 경우예요."],["비활성","입력은 막혀 있어도 오류 맥락은 읽을 수 있어야 해요."]),sizeNote:"메시지는 내용에 맞춰 줄바꿈하며 12px로 표시하는 조합 예제예요.",variantNote:"독립 오류 컴포넌트 API가 아니라 Input과 문구를 연결하는 패턴이에요.",slots:[["Message","입력값·규칙·다음 행동 중 사용자가 해결하는 데 필요한 정보를 제공해요."]],guidelines:["붉은 경계만으로 오류를 전달하지 않아요.","사용자가 행동할 수 있는 문구를 제공해요."],boundaries:["재시도 버튼이 필요한 전체 화면 오류와 구분해요."],sources:[ui("input"),native("NativeInputComponents")]}),
  "empty-state":doc({anatomy:[["Icon","선택적 장식이에요."],["Title / Description","무엇이 비어 있는지 알려줘요."],["Action","다음 행동이 있을 때만 표시해요."]],properties:[property("icon","Icon","icon","slot",yesNo,"false","장식 아이콘이 문구를 대신하지 않아요."),property("action","Action","actionLabel / onAction","slot",yesNo,"true","사용자가 할 수 있는 행동이 있을 때만 제공해요."),property("actionTone","Action tone","actionTone","variant",options(["default","user-accent"]),"default","사용자 강조색을 적용할 수 있어요.")],states:state(["첫 기록","아직 기록하지 않은 상태예요."],["검색 결과 없음","검색 조건에 맞는 결과가 없어요."]),sizeNote:"제목 16px·설명 13px, 상하 패딩 48px. 전체 화면과 카드 안에서는 부모 영역을 기준으로 배치해요.",variantNote:"첫 사용과 검색 결과 없음은 콘텐츠 상태예요. CTA 색은 actionTone으로 별도 지정해요.",slots:[["icon","ReactNode예요."],["title / description","비어 있는 대상과 가능한 행동을 설명해요."],["action","레이블과 callback을 함께 제공해요."]],guidelines:["기록 없음은 취향이 없음이 아니에요.","검색 결과 없음에는 조건 변경을 제안해요."],boundaries:["로딩·실패·근거 부족과 빈 목록을 같은 상태로 쓰지 않아요."],sources:[web("EmptyState")]}),
  progress:doc({anatomy:[["Track / Indicator","정량이면 전체 범위와 진행량을 나타내요."],["Status","현재 작업을 텍스트로 알려줘요."]],properties:[property("value","Value","value","data",options(["0","35","64","100"]),"64","정량 진행률의 예시예요. 비정량에는 퍼센트를 표시하지 않아요.","web",false)],states:state(["정량","진행률을 알 수 있어요."],["비정량","완료 비율을 계산할 수 없어요."]),sizeNote:"정량 Progress의 높이는 8px이고 너비는 부모를 채워요. 비정량은 문서용 spinner 조합으로 구분해요.",variantNote:"Progress bar와 비정량 spinner는 같은 컴포넌트의 size 변형이 아니에요.",slots:[["Status text","진행 중인 작업을 알려줘요."]],guidelines:["실제 계산할 수 없는 진행률을 만들지 않아요.","완료 후 다음 상태로 전환해요."],boundaries:["현재 Progress wrapper는 시각 value를 사용하지만 Radix Root로 value를 전달하지 않는 한계가 있어요. 예제는 aria 값과 텍스트를 명시해요."],sources:[ui("progress"),native("NativeLayoutComponents")]}),
  "bottom-sheet":doc({anatomy:[["Overlay / Container","배경과 모달 영역을 분리해요."],["Header","제목·뒤로·닫기를 담아요."],["Body","선택과 상세 내용을 담아요."],["Footer","고정된 완료 행동을 배치해요."]],properties:[property("close","Close button","headerEnd","slot",yesNo,"true","닫기 버튼의 유무와 다른 종료 경로를 함께 확인해요."),property("footer","Footer","footer","slot",yesNo,"true","본문 스크롤과 분리할 행동만 고정해요."),property("headerLayout","Header slots","headerStart / headerCenter","layout",[opt("title","제목"),opt("back","뒤로 + 제목")],"title","이전 단계가 있는 경우에만 뒤로 슬롯을 사용해요.","composition")],states:overlayStates,sizeNote:"Native 최대 98%·반경 32pt / 웹 95%·반경 20px. grabber는 각각 36×5 / 40×6이에요.",variantNote:"Native/Web 크기는 문서의 플랫폼 비교이지 웹 API의 Platform prop이 아니에요.",slots:[["trigger","열기 버튼과 초점 복귀를 연결해요."],["headerStart / Center / End","선택적 헤더 슬롯이에요."],["children / footer / floatingLayer","본문·고정 행동·추가 레이어를 구분해요."]],guidelines:["제목과 설명을 접근성 속성으로 연결해요.","닫기는 저장 완료와 같지 않아요.","독립적이고 긴 작업은 별도 화면을 고려해요."],boundaries:["열림 비교 타일은 구조 예시예요. 실제 포커스·Escape·선택은 상단의 열기 버튼에서 확인해요."],sources:[web("BottomSheetShell"),native("SystemCoreComponents")]}),
  dialog:doc({anatomy:[["Overlay","배경 작업을 분리해요."],["Title / Description","목적과 결과를 설명해요."],["Content / Actions","필요한 내용과 다음 행동이에요."]],properties:[property("description","Description","DialogDescription","slot",yesNo,"true","설명을 생략하면 불필요한 aria-describedby 참조도 없애요."),property("actionLayout","Action layout","footer composition","layout",[opt("row","가로"),opt("stack","세로")],"row","긴 버튼 문구는 세로 배치를 고려해요.","composition")],states:overlayStates,sizeNote:"웹 DialogContent 기본은 max-w-lg예요. 이 예제의 레이아웃은 footer 조합이며 별도 size API가 아니에요.",variantNote:"확인/삭제 예제이며 모든 작업 모달을 같은 콘텐츠로 처리하지 않아요.",slots:[["Title / Description","접근성 이름·설명을 연결해요."],["Content / Footer","화면에서 필요한 작업을 구성해요."]],guidelines:["실제 취소와 확정 행동을 분명히 구분해요.","복구 가능 여부를 확인한 문구만 사용해요."],boundaries:["Native 시스템 alert와 웹 Dialog는 외형과 제스처가 같지 않아요."],sources:[ui("dialog"),"ios/TasteBuddy/Features/Dining/DiningView.swift"]}),
  menu:doc({anatomy:[["Trigger","현재 맥락에서 메뉴를 열어요."],["Content","행동 또는 선택 항목을 담아요."],["Item","문구·상태·선택 표시를 제공해요."]],properties:[property("menuType","Item type","DropdownMenuItem / CheckboxItem / RadioItem","variant",[opt("action","행동"),opt("checkbox","복수 선택"),opt("radio","단일 선택")],"action","서로 다른 의미를 가진 메뉴 항목을 구분해요.","composition"),property("align","Alignment","align","layout",options(["start","center","end"]),"start","Trigger를 기준으로 목록의 정렬을 정해요."),property("destructive","Destructive","variant","slot",yesNo,"false","파괴적 행동은 destructive variant와 확인 단계를 함께 사용해요.")],states:state(...overlayStates,["항목 비활성","목록은 열 수 있지만 특정 항목의 실행은 막혀 있어요."]),sizeNote:"웹 메뉴는 최소 8rem, 기본 sideOffset 4px예요. 화면 가장자리에서는 Radix의 충돌 처리를 따라요.",variantNote:"Action/Checkbox/Radio는 각 primitive를 조합해요. 전체 메뉴에 없는 variant prop을 만들지 않아요.",slots:[["Item / Label / Separator","관련 항목을 그룹으로 묶어요."],["Submenu","필요한 깊이만 제공해요. 이 프리뷰는 한 단계 메뉴예요."]],guidelines:["선택과 즉시 실행을 같은 문구로 혼동시키지 않아요.","삭제는 대상과 결과를 확인하는 별도 단계로 연결해요."],boundaries:["열린 구조 타일과 실제 portal 메뉴는 서로 다른 확인 범위예요."],sources:[ui("dropdown-menu")]}),
  "taste-chip":doc({anatomy:[["Taste label","미각 종류를 표시해요."],["Value","관측된 값이 있을 때만 표시해요."],["Surface","미각 또는 중립 의미 색이에요."]],properties:[property("taste","Taste","taste / colorTaste","variant",options(["단맛","신맛","쓴맛","짠맛","감칠맛","지방맛"]),"단맛","색은 미각의 종류를 나타내며 호감·강도가 아니에요."),property("tone","Tone","tone","variant",options(["taste","neutral"]),"taste","맥락에 맞춰 미각색 또는 중립색을 사용해요."),property("value","Value","value","data",[opt("none","없음"),opt("0","0"),opt("72","72")],"none","값 0과 값 없음은 서로 달라요.","web",false)],states:state(["기본","라벨만 표시해요."],["값 포함","값을 추가로 표시해요."],["중립","미각 강조 없이 중립으로 표시해요."]),sizeNote:"글자 10px·상하 패딩 4px·좌우 8px·간격 4px. size prop은 없어요.",variantNote:"6가지 미각과 tone·값 유무를 독립적으로 조합해요.",slots:[["value","숫자 0도 유효한 ReactNode로 표시해요."]],guidelines:["값이 없다고 0이나 중립으로 바꾸지 않아요.","colorTaste를 지정할 때 표시 레이블과 색 의미를 검토해요."],boundaries:["읽기용 span이에요. 선택하려면 별도의 선택 컨트롤이 필요해요."],sources:[web("TasteChip"),native("SystemParityComponents")]}),
  "sensory-bubble":doc({anatomy:[["Bubble","감각 선택 영역이에요."],["Label","감각 카탈로그의 이름이에요."],["Selection","현재 선택 여부예요."]],properties:[property("selection","Selection","selection group rule","variant",[opt("multiple","복수"),opt("single","단일 예제")],"multiple","기본은 여러 감각 선택이에요. 단일은 그룹 동작을 비교하는 문서 예제예요.","composition"),property("layout","Layout","layout example","layout",[opt("bubble","버블"),opt("wrap","줄바꿈 대안")],"bubble","좁은 화면이나 큰 글자에서는 겹치지 않는 대안이 필요해요.","composition")],states:selectionStates,sizeNote:"선택기의 감각 데이터·배치가 크기를 결정해요. 아래 버블 크기는 웹 설명용 표본이며 카탈로그의 강도를 뜻하지 않아요.",variantNote:"선택 개수와 배치의 차이를 보여줘요. 감각을 느꼈다는 사실과 호감을 구분해요.",slots:[labelSlot],guidelines:["형태나 크기를 감각 강도 점수처럼 해석하지 않아요.","긴 레이블·확대 글자가 겹치지 않게 해요."],boundaries:["실제 160개 감각 버블 전체를 이 축약 예제에서 재현하지 않아요."],sources:["ios/TasteBuddy/Features/Dining/DiningSensorySelectionEditor.swift",native("NativeInputComponents")]}),
  "taste-bloom":doc({anatomy:[["Petal","순위와 관계를 표현하는 꽃잎이에요."],["Stamen / Pistil","고유한 중심 형태를 만들어요."],["Frame / Image","선택적인 외곽과 사진 대체 영역이에요."]],properties:[property("petal","Petal","petalShape","variant",options(["roundPetal","capsulePetal","softDiamondPetal","serratedTipPetal"]),"roundPetal","실제 지원하는 네 가지 꽃잎을 비교해요."),property("stamen","Stamen","stamenShape","variant",options(["thinStamen","roundedSpokeStamen","dottedRayStamen"]),"thinStamen","수술 형태를 지정할 수 있어요."),property("pistil","Pistil","pistilShape","variant",options(["solidPistil","diamondPistil","seedCluster"]),"solidPistil","중심부 형태를 지정할 수 있어요."),property("size","Size","size","size",[opt("96","96px"),opt("128","128px"),opt("200","200px")],"200","숫자 또는 프로필 크기 토큰을 사용할 수 있어요."),property("frame","Frame","showFrame","slot",yesNo,"true","외곽 프레임의 표시 여부예요.")],states:state(["표본 데이터","합성 데이터로 형태를 확인해요."],["기록 없음","데이터가 없을 때는 의미 없는 꽃을 개인의 취향 결과로 보여주지 않아요."]),sizeNote:"숫자 size와 sm/md/lg/xl 토큰을 지원해요. shapeSeed와 shapeCountOverride는 재현 가능한 형태 제어에 사용해요.",variantNote:"형태 차이는 profile·seed와 shape 속성으로 결정돼요. 꽃잎 모양을 새로운 취향 분류로 명명하지 않아요.",slots:[["imageSrc","사진이 있으면 사진 표현으로 바꿀 수 있어요."],["ariaLabel","데이터를 읽을 수 있는 대체 설명을 제공해요."]],guidelines:["브랜드 장식용 Bloom과 개인 데이터 Bloom을 구분해요.","동일한 데이터·seed로 재현 가능한 형태를 유지해요."],boundaries:["이 문서의 수치는 합성 예제이며 실제 사용자의 점수가 아니에요."],sources:[web("PalateBloomAvatar")]}),
  "dining-result":doc({anatomy:[["Context","기록한 식사와 시점을 표시해요."],["Observation","남긴 감각을 정리해요."],["Evidence / Tags","출처·수량·감각 라벨이에요."]],properties:[property("tags","Tags","sensory evidence composition","slot",yesNo,"true","관찰한 감각만 표시해요.","composition"),property("scope","Scope","source caption composition","slot",yesNo,"true","기록 기준을 숨기면 해석 근거를 확인하기 어려워져요.","composition")],states:state(["표본 기록","입력한 식사 기록의 표본이에요."],["기록 없음","기록 수는 0이며 첫 기록 행동을 안내해요."]),sizeNote:noSize,variantNote:"표본/기록 없음은 데이터 상태예요. 감각의 존재·강도·호감·음식 전체 평가는 별개예요.",slots:[["Context / Tags","실제 식사 맥락과 감각 근거를 조합해요."]],guidelines:["저장일을 식사일로 바꾸지 않아요.","기록 없음 화면에 합성 기록 수를 남기지 않아요."],boundaries:["웹 규격 예제로 실제 식사 결과 컴포넌트의 데이터 처리를 실행하지 않아요."],sources:["ios/TasteBuddy/Features/Dining/DiningView.swift",web("TasteInsightSummaryCard")]}),
  "interpretation-card":doc({anatomy:[["Title","짧은 감각 표현으로 시작해요."],["Interpretation","관찰에서 추론한 경향을 설명해요."],["Scope","근거 수와 적용 조건이에요."]],properties:[property("scope","Evidence","source caption composition","slot",yesNo,"true","해석의 근거를 확인할 수 있어야 해요.","composition"),property("tags","Sensory tags","tag composition","slot",yesNo,"true","해석과 관련된 감각만 사용해요.","composition")],states:state(["근거 있음","근거의 범위 안에서 경향을 설명해요."],["근거 부족","단정하는 제목·숫자를 숨기고 부족함을 설명해요."]),sizeNote:noSize,variantNote:"근거 있음/부족은 외형 취향이 아닌 해석 가능 범위의 차이예요.",slots:[["Evidence / Condition","기간·출처·반례와 필요한 조건을 연결해요."]],guidelines:["보조 설명은 한 줄로 표시하고 넘칠 때만 말줄임과 InlineButton 더보기를 표시해요. 상세 보기가 없으면 인라인으로 펼쳐요.","같은 식사에서 나온 여러 메모를 독립 식사 수로 세지 않아요.","선호와 감각의 존재를 같은 결론으로 바꾸지 않아요."],boundaries:["실제 분석 엔진·계정 데이터·재집계를 실행하지 않는 표본 예제예요."],sources:["ios/TasteBuddy/Components/SystemParityComponents.swift",web("InterpretationCard"),web("InlineButton")]}),
  "taste-graph":doc({anatomy:[["Axis / Label","무엇을 비교하는지 알려줘요."],["Mark / Value","관측한 값이에요."],["Scope / Alternative","척도·출처와 읽기 대안이에요."]],properties:[property("display","Display","visual / table alternative","variant",[opt("bars","막대"),opt("table","값 표")],"bars","같은 데이터를 그림과 표로 읽을 수 있어요.","composition"),property("labels","Values","value label composition","slot",yesNo,"true","숫자를 숨겨도 접근성 설명에는 값을 유지해요.","composition")],states:state(["표본 데이터","실제 사용자의 데이터가 아닌 합성 6축 예제예요."],["기록 없음","축의 관측치가 없어요."],["미확인 포함","결측은 0으로 채우지 않아요."],["0 포함","실제 0을 결측과 구분해서 표시해요."]),sizeNote:"내용 너비를 사용하며 값 표는 좁은 화면에서도 읽을 수 있어야 해요. 별도 Small/Large API는 없어요.",variantNote:"이 페이지는 막대·표의 의미를 재현해요. 실제 Native radar/line/bar를 동일 API로 간주하지 않아요.",slots:[["Scope","단위·비교 기간·출처를 반드시 연결해요."],["Data table","그래프와 같은 값을 읽을 수 있어요."]],guidelines:["강도와 호감의 축을 섞지 않아요.","보이게 하는 최소 길이를 저장된 값으로 취급하지 않아요.","결측과 0의 텍스트를 명시해요."],boundaries:["웹 규격 예제이며 측정 정확도나 해석 엔진의 검증 결과가 아니에요."],sources:[native("TasteDetailPage"),web("TasteLineChart")]}),
};

export function getComponentDocumentation(id: string): ComponentDocumentation {
  const entry = componentDocumentation[id];
  if (!entry) throw new Error(`Missing Plating component documentation: ${id}`);
  return entry;
}
export function defaultPreviewOptions(id: string): PreviewOptions {
  return Object.fromEntries((componentDocumentation[id]?.properties ?? []).map((p) => [p.key, p.defaultValue]));
}

export function statePreviewOptions(id: string, state: string): PreviewOptions {
  if (id === "capsule-tabs") return { usage: state === "기간 선택" ? "period" : "view", menu: String(state === "큰 글자"), disabled: String(state === "비활성") };
  if (id === "disclosure") return { open: ["접힘", "비활성"].includes(state) ? "closed" : "open", format: state === "문장형" ? "paragraph" : "bullets", multiple: String(state === "복수 펼침"), variant: state === "분리형" ? "separated" : "inline" };
  if (id === "toast") return { action: String(state === "행동 포함") };
  if (id === "taste-chip") return { tone: state === "중립" ? "neutral" : "taste", value: state === "값 포함" ? "0" : "none" };
  return Object.fromEntries((componentDocumentation[id]?.properties ?? []).flatMap((property) => {
    const option = property.options.find((value) => value.previewState === state);
    return option ? [[property.key, option.value]] : [];
  }));
}
