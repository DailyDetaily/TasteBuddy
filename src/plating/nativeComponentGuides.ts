import { componentGuides, type ComponentGuide } from "./componentGuides";

const anatomy = (rows: string[][]) =>
  rows.map(([name, slot, description]) => ({ name, slot, description }));
const properties = (rows: string[][]) =>
  rows.map(([name, initial, description]) => ({ name, initial, description }));
const states = (rows: string[][]) =>
  rows.map(([name, condition, appearance, behavior]) => ({
    name,
    condition,
    appearance,
    behavior,
  }));
const tokens = (rows: string[][]) =>
  rows.map(([part, state, reference, value]) => ({
    part,
    state,
    reference,
    value,
  }));
const specs = (rows: string[][]) =>
  rows.map(([property, ios]) => ({ property, ios, web: "" }));

/** iOS source review, 2026-10-01. Browser drawings explain the native slots;
 * their content is illustrative, and is not an iOS runtime capture. */
export const nativeComponentGuides: Partial<Record<string, ComponentGuide>> = {
  "primary-button": {
    ...componentGuides["primary-button"]!,
    platform: "ios",
    anatomy: anatomy([
      [
        "버튼 영역",
        "Button / RoundedRectangle",
        "최소 높이 48pt, 반경 10pt예요. 내용 너비는 fullWidth로 정해요. 번호와 연결선은 크기 계산에 포함하지 않아요.",
      ],
      [
        "행동 이름",
        "Text(title)",
        "기본은 Pretendard SemiBold 14pt, Compact는 12pt예요. 제목은 사용처가 전달해요.",
      ],
    ]),
    properties: properties([
      [
        "title / action",
        "필수",
        "표시할 문구와 실행할 동작이에요. 저장 중 문구도 사용처에서 바꿔요.",
      ],
      [
        "isEnabled",
        "true",
        "false이면 .disabled(true)가 적용돼요. 상위 뷰의 비활성 상태도 반영해요.",
      ],
      [
        "visualDisabled",
        "false",
        "비활성 색만 적용해요. isEnabled가 true이고 상위 뷰도 활성이라면 action과 누름 표면색·축소는 동작해요.",
      ],
      [
        "fullWidth / size",
        "true / .default",
        "기본 최소 높이는 48pt, .compact는 40pt예요. fullWidth가 true면 주어진 폭을 채워요.",
      ],
      [
        "appearance",
        ".primary",
        "기본 검정 버튼 또는 .tasteTint(TasteAxis)를 선택해요. 미각형은 tintColor 배경과 tintTextColor 글자를 사용하고 그림자는 없어요.",
      ],
    ]),
    states: states([
      [
        "기본",
        "isEnabled=true",
        "actionPrimary 배경 / actionOnPrimary 글자",
        "action을 실행해요.",
      ],
      [
        "누름",
        "활성 + isPressed",
        "크기 기준 1pt 축소 + 표면색",
        "가로 감소량은 최대 4pt이며 press 스프링으로 반응해요. 글자·경계는 덮지 않아요.",
      ],
      [
        "비활성",
        "isEnabled=false 또는 상위 비활성",
        "disabledSurface / textDisabled / 그림자 없음",
        "action과 누름 표면색·축소를 막아요.",
      ],
      [
        "조건 안내",
        "visualDisabled=true + 실제 활성",
        "비활성 색 / 그림자 없음",
        "action과 누름 표면색·축소는 유지돼요. 실행 조건의 검사는 사용처가 담당해요.",
      ],
      [
        "처리 중 조합",
        "title 변경 + isEnabled=false",
        "예: “저장 중”",
        "내장 loading 상태는 없어요. 작업과 중복 실행 차단은 사용처가 관리해요.",
      ],
      [
        "동작 줄이기",
        "accessibilityReduceMotion=true",
        "크기 유지",
        "누름 축소와 스프링을 생략하고 표면색만 즉시 반응해요. 실행 가능 여부는 유지해요.",
      ],
    ]),
    stateNote:
      "iOS는 isEnabled와 상위 환경의 isEnabled를 함께 확인해요. visualDisabled는 실행 차단과 별개이며, 비활성 색의 변경에는 feedback 역할을 사용해요.",
    rules: [
      {
        title: "주요 행동을 하나로 정해요",
        body: "식사 기록 화면에는 “기록 완료”처럼 결과를 알 수 있는 이름을 사용해요. action에서 실제 완료 조건을 확인해요.",
      },
      {
        title: "긴 문구와 글자 확대를 함께 확인해요",
        body: "높이는 고정값이 아니라 최소값이에요. 줄 수와 너비 제한은 호출부에서 확인해요. 기본 버튼의 내부 패딩은 0pt이고, Compact는 좌우 16pt·상하 8pt예요.",
      },
      {
        title: "처리 상태는 사용처가 관리해요",
        body: "title과 isEnabled를 함께 변경해 중복 실행을 막아요. 성공 응답을 받은 뒤 완료 안내를 보여줘요.",
      },
    ],
    tokens: tokens([
      [
        "배경 / 글자",
        "기본",
        "TBColor.actionPrimary / actionOnPrimary",
        "#0F0F0F / #FFFFFF",
      ],
      [
        "배경 / 글자",
        "비활성 표현",
        "TBColor.disabledSurface / textDisabled",
        "#EFEFEF / #AFAFAF",
      ],
      [
        "최소 높이 / 반경",
        "기본",
        "TBSize.primaryButtonHeight / TBRadius.control",
        "48pt / 10pt",
      ],
      [
        "글자",
        "기본 / Compact",
        "TBFont.semibold(size.fontSize)",
        "14pt / 12pt",
      ],
      [
        "누름",
        "활성",
        "TBControlFeedback.response / spring(.press)",
        "1 − 1/max(height, width/4, 24) / Spring(duration: 0.12, bounce: 0.18)",
      ],
      [
        "그림자",
        "기본 primary만",
        "Color.black.opacity(0.10)",
        "radius 20 · x 0 · y 8pt",
      ],
    ]),
    platforms: specs([
      ["기본 / Compact", "최소 높이 48 / 40pt · SemiBold 14 / 12pt"],
      ["내부 패딩", "기본: 좌우·상하 0pt / Compact: 좌우 16·상하 8pt"],
      [
        "누름과 복귀",
        "press 스프링 · duration 파라미터 0.12초 · bounce 0.18. 실제 안착 시간과는 달라요.",
      ],
      ["색 상태 변경", "feedback 스프링 · duration 파라미터 0.18초"],
      ["그림자 제외 조건", "비활성 표현, Compact, tasteTint"],
      ["모서리", "RoundedRectangle · cornerRadius 10 · continuous"],
    ]),
    accessibility: [
      "SwiftUI Button의 title로 행동을 설명해요. isEnabled와 상위 .disabled 상태를 모두 반영해요.",
      "visualDisabled만 켜면 누를 수 있어요. 사용처가 필요한 조건을 설명하고 잘못된 실행을 막아야 해요.",
      "TBFont.custom은 Dynamic Type의 영향을 받아요. 큰 글자에서 문구와 터치 영역이 잘리지 않는지 확인해요.",
      "동작 줄이기에서는 누름 축소·스프링 없이 표면색만 즉시 바뀌어요. 실제 비활성은 색 반응도 생략해요.",
    ],
    sources: [
      "ios/TasteBuddy/Components/TBComponents.swift",
      "ios/TasteBuddy/DesignSystem/TBTheme.swift",
      "ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift",
    ],
  },
  "taste-chip": {
    ...componentGuides["taste-chip"]!,
    platform: "ios",
    anatomy: anatomy([
      [
        "바탕과 경계",
        "Capsule / strokeBorder",
        "chipBackgroundColor와 borderDefaultColor를 사용해요. 채움은 Light tint/80 · Dark tint/70이며 1pt 경계선은 안쪽에 그려져 칩 크기를 늘리지 않아요.",
      ],
      [
        "이름",
        "Text(title)",
        "미각 soft에서는 값이 없으면 tintTextColor, 값이 있으면 textPrimary로 표시해요. 공용 Chip의 기본 크기는 11pt medium이며 한 줄로 표시해요.",
      ],
      [
        "선택적 값",
        "Text(value)",
        "같은 크기의 semibold와 tintTextColor를 사용해요. 문자열 “0”도 표시하고 nil이면 값 영역을 생략해요.",
      ],
    ]),
    properties: properties([
      [
        "title",
        "필수",
        "공용 Chip의 이름이에요. 미각 이름은 title: axis.label로 전달해요.",
      ],
      [
        "tasteAxis",
        "nil",
        "미각 팔레트가 필요할 때 축을 전달해요. 지정한 미각 팔레트는 tone보다 우선해요.",
      ],
      [
        "value",
        "nil",
        "String? 값이에요. nil이면 영역을 생략하고 “0”은 유지해요.",
      ],
      [
        "tone / variant",
        ".neutral / .soft",
        "neutral·success·warning·accent 톤과 soft·outline·solid·text 표현 방식을 지원해요.",
      ],
      ["size", ".small", "extraSmall / small / medium이 있어요. 글자·간격·패딩이 함께 달라져요."],
      ["아이콘 / trailingAction", "nil", "좌우 아이콘과 후행 아이콘 액션, 접근성 레이블을 지원해요."],
      ["isEnabled", "true", "자체 값과 상위 비활성 환경을 함께 반영해요."],
    ]),
    states: states([
      [
        "이름만",
        "value=nil",
        "미각색 이름",
        "수치 영역만 생략해요. nil 자체를 기록 없음으로 해석하지 않아요.",
      ],
      [
        "값 포함",
        "value가 있음",
        "중립색 이름 + 미각색 값",
        "이름은 medium, 값은 semibold예요.",
      ],
      [
        "0",
        "value=“0”",
        "0을 그대로 표시",
        "강도 0을 호감이나 결측으로 바꾸지 않아요.",
      ],
      [
        "중립 표현",
        "tasteAxis=nil, tone=.neutral, variant=.soft",
        "TBChipColor.neutralBackground / neutralBorder / textTertiary",
        "이름과 값 모두 중립색이에요.",
      ],
      [
        "미각 지정 없음",
        "tasteAxis=nil",
        "중립 팔레트로 대체",
        "임의의 미각색을 배정하지 않아요.",
      ],
      ["비활성", "isEnabled=false 또는 상위 비활성", "disabledSurface / borderDisabled / textDisabled", "후행 아이콘 액션도 실행하지 않아요."],
    ]),
    stateNote:
      "iOS TasteChip은 공용 Chip으로 통합됐어요. 이름과 값은 한 줄 고정이며, Medium 이름·Semibold 값·자연 줄 높이·내부 경계를 사용해요. 선택 상태는 호출부가 관리하고, 비활성·아이콘·후행 액션은 Chip이 지원해요.",
    rules: [
      {
        title: "미기록은 말로 밝혀요",
        body: "value: nil은 수치 영역만 생략해요. 데이터가 없다는 뜻을 전달하려면 “기록 없음”을 별도로 표시해요.",
      },
      {
        title: "값의 기준을 가까이 둬요",
        body: "“이번 식사의 미각 강도 · 0–10”처럼 범위와 의미를 함께 보여줘요. 강도를 호감이나 음식 전체 평가로 바꾸어 읽지 않아요.",
      },
      {
        title: "숫자에도 배경 위 글자색을 사용해요",
        body: "미각 soft·outline·text에서는 tintTextColor를 사용하고 값이 있는 칩의 이름만 textPrimary로 바뀌어요. solid에서는 진한 미각 배경 위에 이름과 값을 흰색으로 표시해요.",
      },
    ],
    tokens: tokens([
      [
        "배경 / 경계",
        "미각 soft 표현",
        "TasteAxis.chipBackgroundColor / borderDefaultColor",
        "Light tint 80 / 70 · Dark tint 70 / 60",
      ],
      [
        "이름 / 값",
        "미각 표현",
        "TasteAxis.tintTextColor",
        "팔레트의 tintSurfaceText · 6색 각각의 배경 위 글자색",
      ],
      ["이름", "값 포함", "TBColor.textPrimary", "#0F0F0F"],
      [
        "배경 / 경계 / 글자",
        "중립 표현",
        "TBChipColor.neutralBackground / neutralBorder · TBColor.textTertiary",
        "Light #F7F7F7 / #E5E5E5 / #535353 · Dark #343434 / #484848 / #C6C6C6",
      ],
      [
        "경계",
        "모든 크기",
        "Capsule().strokeBorder(lineWidth: 1)",
        "내부 1pt · 레이아웃 크기에 추가되지 않음",
      ],
      [
        "글자 굵기",
        "이름 / 값",
        "TBFont.medium / TBFont.semibold",
        "500 / 600",
      ],
    ]),
    platforms: specs([
      ["xs", "글자 10 · 간격 4 · 좌우 8 · 상하 4pt"],
      ["sm", "글자 11 · 간격 6 · 좌우 10 · 상하 6pt"],
      ["md", "글자 12 · 간격 8 · 좌우 12 · 상하 8pt"],
      [
        "색 우선순위",
        "비활성 → 비활성 색 / 개별 색상 override → tasteAxis 팔레트 → tone·variant 팔레트",
      ],
      ["수치 색", "tintTextColor. mainColor가 아니에요."],
      [
        "접근성",
        ".accessibilityElement(children: .combine)으로 이름과 값을 묶어 읽음",
      ],
    ]),
    accessibility: [
      "이름과 값을 하나의 접근성 요소로 묶어요. 값의 단위와 해석 기준은 주변 문맥으로 설명해요.",
      "미각 이름을 유지해 색에만 의존하지 않아요. 결측은 별도 문구로 밝혀요.",
      "상위 배치가 글자 확대와 여러 칩의 줄바꿈을 처리해야 해요. 칩 자체에 선택 의미를 붙이지 않아요.",
    ],
    sources: [
      "ios/TasteBuddy/Components/SystemParityComponents.swift",
      "ios/TasteBuddy/Models/TasteModels.swift",
      "ios/TasteBuddy/DesignSystem/TBTheme.swift",
    ],
  },
  "bottom-sheet": {
    ...componentGuides["bottom-sheet"]!,
    platform: "ios",
    anatomy: anatomy([
      [
        "손잡이",
        "grabber",
        "36×5pt, textHint 색이에요. 상단 5pt에 놓이며 헤더가 있으면 헤더 위에 겹쳐 배치해요.",
      ],
      [
        "헤더",
        "headerStart / headerCenter / headerEnd",
        "좌우 20pt·상단 20pt·하단 12pt예요. 양쪽 슬롯은 32pt, 제목은 전체 폭의 중앙에 놓여요.",
      ],
      [
        "본문",
        "Content",
        "fixed 모드에서는 남은 높이를 채워요. 내부 여백과 ScrollView는 사용처가 제공해요.",
      ],
      [
        "푸터",
        "footer / footerSafeAreaAccessory",
        "좌우 20pt·상단 16pt예요. 하단 안전 영역과 선택적 보조 영역을 계산해요.",
      ],
    ]),
    properties: properties([
      [
        "headerStart / Center / End",
        "nil",
        "하나라도 있으면 헤더를 표시해요. 없으면 손잡이만 배치해요. 제목의 서체와 색은 전달한 뷰가 정해요.",
      ],
      [
        "stageMode",
        ".fixed",
        "fixed는 화면 높이로 계산해요. auto(maxHeightRatio:)는 콘텐츠 높이를 사용하되 화면 비율로 최대 높이를 제한해요.",
      ],
      [
        "footer / footerSafeAreaAccessory",
        "nil",
        "주요 행동과 하단 보조 콘텐츠를 넣어요. 보조 콘텐츠의 기본 높이는 28pt예요.",
      ],
      [
        "footerHorizontalPadding / footerTopPadding",
        "20 / 16pt",
        "푸터의 좌우와 위쪽 여백이에요. 하단은 footerBottomPaddingOverride로 재정의할 수 있어요.",
      ],
      [
        "footerKeyboardOffset",
        "0",
        "호출부에서 받은 값만큼 푸터를 위로 이동해요. 키보드 높이를 Shell이 자동 계산하지는 않아요.",
      ],
      [
        "usesNativeSheetChrome / surfaceBackground",
        "false / TBColor.focus",
        "시스템 시트 환경의 표면 처리와 배경이에요. 별도 presenter가 시트의 표시·닫기를 관리해요.",
      ],
    ]),
    states: states([
      [
        "헤더 있음",
        "헤더 슬롯 중 하나 이상 존재",
        "헤더 + 겹쳐 놓인 손잡이",
        "기본 슬롯 높이 32 + 상단 20 + 하단 12pt예요.",
      ],
      [
        "헤더 없음",
        "헤더 슬롯 모두 nil",
        "손잡이만 표시",
        "상단 5 + 손잡이 5pt를 차지해요.",
      ],
      [
        "fixed",
        "stageMode=.fixed",
        "계산된 고정 높이",
        "본문이 남은 높이를 채워요.",
      ],
      [
        "auto",
        "stageMode=.auto(maxHeightRatio:)",
        "내용 높이 + 최대 높이 제한",
        "본문을 무조건 남은 높이만큼 늘리지 않아요.",
      ],
      [
        "키보드 대응",
        "footerKeyboardOffset > 0",
        "푸터를 해당 값만큼 위로 이동",
        "호출부가 offset을 제공해요. 현재 전환은 easeOut 0.24초예요.",
      ],
      [
        "닫기 · 적용",
        "전달한 버튼의 action",
        "호출부의 결과에 따라 변경",
        "Shell에는 open·저장·닫기 상태가 없어요. presenter와 화면이 각각 관리해요.",
      ],
    ]),
    stateNote:
      "iOS BottomSheetShell은 배치용 뷰예요. 표시·닫기·드래그는 presenter, 선택·저장은 화면의 action이 담당해요. 웹의 open/onOpenChange 계약을 적용하지 않아요.",
    rules: [
      {
        title: "닫기는 전달된 action으로 처리해요",
        body: "BottomSheetCloseButton은 받은 action만 실행해요. 그 자체가 저장하거나 화면을 닫지는 않아요. 완료 버튼과 닫기 버튼의 action을 구분해요.",
      },
      {
        title: "스크롤과 본문 여백은 사용처가 정해요",
        body: "Shell의 Content에는 고정 패딩이나 ScrollView가 없어요. 화면이 여백·스크롤·입력 위치를 구성해요.",
      },
      {
        title: "기기별 안전 영역을 사용해요",
        body: "fixed 높이는 현재 화면 높이와 상단 안전 영역으로 계산해요. 하단은 기본 여백과 safe area 중 큰 값을 사용하고, 보조 콘텐츠가 있으면 그 높이도 고려해요.",
      },
    ],
    example: {
      context: "iOS 시트를 호출하는 화면의 책임 · 설명용 예제",
      good: "닫기 action은 복귀를, 완료 action은 명시적인 적용을 담당하도록 구성해요.",
      avoid:
        "닫기 action에 저장까지 연결하면 중단하려는 동작이 변경을 확정할 수 있어요.",
    },
    tokens: tokens([
      [
        "높이",
        "fixed",
        "BottomSheetShellMetrics.stageHeight",
        "max(0, 화면 높이 × 0.98 − safeAreaTop − 12pt)",
      ],
      [
        "상단 반경",
        "표면",
        "BottomSheetShellMetrics.topRadius",
        "32pt · 위 모서리만",
      ],
      [
        "손잡이",
        "기본",
        "grabberWidth / grabberHeight / grabberTopMargin",
        "36×5pt · 위쪽 5pt",
      ],
      ["손잡이 색", "기본", "TBColor.textHint", "#6F6F6F"],
      ["배경 카드", "열림", "TBSheetPresentation.Background.scale / radius", "90% · 모서리 20pt"],
      ["배경 이동", "AppShell", "TBSheetPresentation.Background.offsetY", "상단 안전 영역 + 10pt · 인증 진입은 10pt"],
      ["배경 딤", "열림", "TBSheetPresentation.Background.dimOpacity", "검정 60% · 진행 값에 비례"],
      ["드래그 닫기", "AppShell", "TBSheetPresentation.Drag.dismissProgress", "예측 이동이 시트 높이의 32% 이상"],
      [
        "헤더",
        "슬롯 있음",
        "headerHorizontalPadding / headerTopPadding / headerBottomPadding",
        "좌우 20 · 상단 20 · 하단 12pt · 양쪽 슬롯 32pt",
      ],
      [
        "푸터",
        "footer 있음",
        "footerHorizontalPadding / footerTopPadding / footerSafeAreaHeight",
        "좌우 20 · 상단 16 · 하단 max(12, safeAreaBottom)pt",
      ],
      [
        "닫기 아이콘",
        "기본",
        "TBIcon.Size.large / Container.large / Stroke.regular",
        "아이콘 24pt · 영역 32pt · 선 1.8pt",
      ],
    ]),
    platforms: specs([
      ["기본 표면", "TBColor.focus (#FFFFFF) · 최대 폭 1440pt"],
      [
        "손잡이와 헤더",
        "헤더가 있으면 ZStack으로 겹침. 손잡이의 10pt가 헤더 높이에 더해지지 않아요.",
      ],
      [
        "헤더 기본 높이",
        "슬롯 32 + 상단 20 + 하단 12 = 64pt. 제목 콘텐츠가 더 크면 달라질 수 있어요.",
      ],
      ["본문", "별도 패딩·스크롤 없음. fixed에서 maxHeight=.infinity"],
      [
        "푸터 보조 영역",
        "기본 보조 높이 28 + 위 12 + 아래 12 = 52pt와 safeAreaBottom 중 큰 값",
      ],
      ["표면 그림자", "사용자 정의 표면: 검정 24%, radius 30, x 0, y 20pt"],
      [
        "닫기·배경·드래그",
        "Shell 밖의 presenter와 action에서 관리. Shell만으로 종료 동작을 판단하지 않아요.",
      ],
      [
        "도식의 범위",
        "iOS의 부품 배치를 설명해요. 본문과 전체 높이는 설명용으로 축약했으며 실기기 화면 캡처가 아니에요.",
      ],
    ]),
    accessibility: [
      "닫기 버튼은 ariaLabel 인자로 accessibilityLabel을 설정해요. 손잡이는 accessibilityHidden(true)예요.",
      "BottomSheetIconButton은 .plain 스타일이며 누름 축소를 내장하지 않아요.",
      "닫은 뒤 접근성 초점, VoiceOver의 모달 탐색, 드래그 종료는 presenter와 실제 화면에서 확인해야 해요.",
      "footerKeyboardOffset 전환은 현재 easeOut 0.24초를 직접 사용해요. 이 부분은 Shell 안에서 동작 줄이기를 따로 분기하지 않아요.",
    ],
    sources: [
      "ios/TasteBuddy/Components/SystemCoreComponents.swift",
      "ios/TasteBuddy/Components/LucideIcon.swift",
      "ios/TasteBuddy/DesignSystem/TBTheme.swift",
      "ios/TasteBuddy/Features/DesignSystem/DesignSystemPreviewView.swift",
    ],
  },
};
