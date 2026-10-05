import {
  COLOR_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
  SPACING_TOKENS,
} from "../constants/designTokens";

export type GuideKind = "button" | "taste" | "sheet";
export type ComponentGuide = {
  platform?: "ios";
  kind: GuideKind;
  anatomy: { name: string; slot: string; description: string }[];
  properties: { name: string; initial: string; description: string }[];
  states: {
    name: string;
    condition: string;
    appearance: string;
    behavior: string;
  }[];
  stateNote: string;
  rules: { title: string; body: string }[];
  example: { context: string; good: string; avoid: string };
  tokens: { part: string; state: string; reference: string; value: string }[];
  platforms: { property: string; web: string; ios: string }[];
  accessibility: string[];
  sources: string[];
  reference: { label: string; href: string };
};

// Documentation contracts. These describe the existing implementations; they do
// not add component props or imply that native and web behave identically.
export const componentGuides: Partial<Record<string, ComponentGuide>> = {
  "primary-button": {
    kind: "button",
    anatomy: [
      {
        name: "버튼 영역",
        slot: "button",
        description:
          "행동을 실행하는 영역이에요. 기본 높이는 최소 48이며 문구가 길면 함께 늘어나요.",
      },
      {
        name: "행동 이름",
        slot: "children",
        description:
          "저장할 대상과 결과를 알려줘요. 처리 중 안내도 같은 자리에 표시해요.",
      },
    ],
    properties: [
      {
        name: "size",
        initial: "default",
        description:
          "default는 최소 48, compact는 최소 40이에요. 웹 Compact의 글자는 12px예요.",
      },
      {
        name: "fullWidth",
        initial: "true",
        description:
          "부모의 가로 폭을 채워요. false는 내용에 맞는 너비를 지정해요.",
      },
      {
        name: "disabled",
        initial: "false",
        description:
          "실행과 키보드 초점을 막아요. 저장 중 중복 실행도 사용처에서 이 값으로 막아요.",
      },
      {
        name: "visualDisabled",
        initial: "false",
        description:
          "비활성 색만 적용해요. 클릭과 키보드 입력은 가능하므로, 사용처에서 미충족 조건을 안내해요.",
      },
      {
        name: "aria-busy",
        initial: "미지정",
        description:
          "웹의 처리 상태를 전달해요. 문구 변경과 실행 차단은 사용처가 함께 설정해요.",
      },
    ],
    states: [
      {
        name: "기본",
        condition: "disabled=false",
        appearance: "진한 배경 + 밝은 글자",
        behavior: "클릭·Enter·Space로 행동을 실행해요.",
      },
      {
        name: "누름",
        condition: "활성 상태에서 누르는 동안",
        appearance: "웹 0.98배 · iOS는 크기 기반 축소와 표면색",
        behavior: "누름을 놓거나 취소하면 원래 크기로 돌아와요.",
      },
      {
        name: "비활성",
        condition: "disabled=true",
        appearance: "비활성 색 · 그림자 없음",
        behavior: "클릭과 Tab 초점을 받지 않아요.",
      },
      {
        name: "조건 안내",
        condition: "visualDisabled=true, disabled=false",
        appearance: "비활성 색 · 웹 누름 축소 없음",
        behavior:
          "실행 조건을 설명하는 콜백을 연결해요. 실제 저장은 사용처에서 차단해야 해요.",
      },
      {
        name: "처리 중",
        condition: "disabled=true + aria-busy=true",
        appearance: "비활성 색 + “저장 중”",
        behavior:
          "사용처가 문구를 바꾸고 중복 실행을 막아요. busy 속성만으로는 실행이 막히지 않아요.",
      },
      {
        name: "비활성 + 조건 안내",
        condition: "disabled=true + visualDisabled=true",
        appearance: "비활성 색",
        behavior: "disabled가 우선하므로 안내 콜백도 실행되지 않아요.",
      },
    ],
    stateNote:
      "처리 중은 별도 내장 prop이 아닌 사용처의 조합이에요. 누름은 일시적인 상호작용, disabled와 visualDisabled는 실행 가능 여부를 결정하는 옵션이에요.",
    rules: [
      {
        title: "주요 행동을 하나로 정해요",
        body: "식사 기록 화면의 주요 행동은 “기록 완료”로 표시해요. “나중에”처럼 보조 행동이 필요하면 강조도를 낮춰 배치해요.",
      },
      {
        title: "긴 문구에는 높이와 공간을 내줘요",
        body: "고정 높이로 자르지 않아요. 버튼 두 개의 문구가 길거나 글자가 커지면 사용처에서 세로 배치해요. PrimaryButton 자체가 버튼 묶음을 재배치하지는 않아요.",
      },
      {
        title: "완료 피드백은 성공 응답 뒤에 보여줘요",
        body: "누름 반응은 입력 직후에, 저장 완료 안내는 실제 성공 응답 뒤에 보여줘요. 실패하면 입력을 확인하거나 다시 시도할 행동을 제공해요.",
      },
    ],
    example: {
      context: "식사 기록의 마지막 단계 · 설명용 합성 예제",
      good: "“식사 기록 완료”는 누른 뒤 무엇이 달라지는지 알려줘요. 보조 행동은 시각적 무게를 낮춰요.",
      avoid:
        "같은 강조도의 “확인” 버튼을 반복하면 실행 결과와 주요 행동을 알아보기 어려워요.",
    },
    tokens: [
      {
        part: "배경 / 글자",
        state: "기본",
        reference: "--tb-color-text-primary / --tb-color-text-inverse",
        value: `${COLOR_TOKENS.text.primary} / ${COLOR_TOKENS.text.inverse}`,
      },
      {
        part: "배경 / 글자",
        state: "비활성 · 조건 안내",
        reference: "--tb-color-surface-disabled / --tb-color-text-disabled",
        value: `${COLOR_TOKENS.surface.disabled} / ${COLOR_TOKENS.text.disabled}`,
      },
      {
        part: "높이 / 반경",
        state: "기본",
        reference: "--tb-size-primary-button-height / --tb-radius-10",
        value: `48px 이상 / ${RADIUS_TOKENS[10]}`,
      },
      {
        part: "좌우 여백",
        state: "기본",
        reference: "--tb-space-16",
        value: SPACING_TOKENS[16],
      },
      {
        part: "누름 크기 / 전환",
        state: "활성",
        reference: "--tb-motion-scale-press / --tb-motion-duration-fast",
        value: `${MOTION_TOKENS.scale.press} / ${MOTION_TOKENS.durationMs.fast}ms`,
      },
      {
        part: "그림자",
        state: "기본",
        reference: "--tb-shadow-button",
        value: "0 8px 20px rgba(0,0,0,0.1)",
      },
    ],
    platforms: [
      {
        property: "최소 높이 · 반경",
        web: "기본 48 / Compact 40 · 반경 10px",
        ios: "기본 48 / Compact 40 · 반경 10pt",
      },
      {
        property: "서체",
        web: "기본 14px medium · Compact 12px semibold",
        ios: "기본 14pt · Compact 12pt, 모두 semibold",
      },
      {
        property: "색 변형",
        web: "별도 appearance prop 없음",
        ios: "primary / tasteTint(TasteAxis)",
      },
      {
        property: "기본 좌우 여백",
        web: "16px",
        ios: "0pt · 외부 레이아웃에서 여백 제공",
      },
      {
        property: "누름",
        web: "0.98배 · fast 180ms",
        ios: "크기 기준 1pt 축소 + 표면색 · press 120ms",
      },
      {
        property: "조건 안내의 누름",
        web: "visualDisabled에서는 축소 없음",
        ios: "실행 가능하면 visualDisabled에도 표면색·축소 적용",
      },
    ],
    accessibility: [
      "행동을 설명하는 이름을 제공해요. 처리 중에는 사용처에서 aria-busy와 disabled를 함께 설정해요.",
      "visualDisabled는 실제 비활성 상태가 아니에요. 필요한 조건을 주변 도움말과 aria-describedby로 연결하고, 콜백에서 조건을 다시 확인해요.",
      "키보드 초점을 숨기지 않아요. 글자 확대 시 줄바꿈과 버튼 높이가 함께 늘어나는지 확인해요.",
      "동작 줄이기에서는 축소를 생략하고, 문구와 상태 표시로 같은 결과를 전달해요.",
    ],
    sources: [
      "src/styles/design-system.css",
      "src/constants/designTokens.ts",
      "ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift",
    ],
    reference: {
      label: "SEED · Action Button",
      href: "https://seed-design.io/components/action-button",
    },
  },
  "taste-chip": {
    kind: "taste",
    anatomy: [
      {
        name: "미각 바탕과 경계",
        slot: "span",
        description:
          "tintSoft와 tintSoftBorder로 미각 종류를 구분해요. 색 면적은 강도를 뜻하지 않아요.",
      },
      {
        name: "이름",
        slot: "taste",
        description:
          "단맛·신맛처럼 표시할 이름이에요. colorTaste로 이름과 팔레트 기준을 따로 지정할 수 있어요.",
      },
      {
        name: "선택적 값",
        slot: "value",
        description:
          "0도 표시해요. 값의 단위·기간·강도인지 호감인지는 주변 제목과 설명에서 알려줘요.",
      },
    ],
    properties: [
      {
        name: "taste",
        initial: "필수",
        description:
          "화면에 보이는 이름이에요. 알려진 미각 이름이면 해당 팔레트도 선택해요.",
      },
      {
        name: "colorTaste",
        initial: "taste와 같음",
        description: "표시 이름과 팔레트 기준이 다를 때 지정해요.",
      },
      {
        name: "tone",
        initial: "taste",
        description:
          "taste 또는 neutral. neutral은 표현 방식이며 중립적인 호감 평가를 뜻하지 않아요.",
      },
      {
        name: "value",
        initial: "미지정",
        description:
          "0을 포함한 값은 표시하고, undefined와 null은 값 영역만 생략해요.",
      },
    ],
    states: [
      {
        name: "이름만",
        condition: "value 미지정",
        appearance: "미각 이름 + 해당 팔레트",
        behavior:
          "수치 영역을 생략해요. 생략만으로 기록 없음이나 0을 의미하지 않아요.",
      },
      {
        name: "값 포함",
        condition: "value가 null·undefined가 아님",
        appearance: "중립색 이름 + 미각색 수치",
        behavior: "값의 의미와 단위를 주변 맥락에 함께 표시해요.",
      },
      {
        name: "0",
        condition: "value={0}",
        appearance: "0을 그대로 표시",
        behavior:
          "측정값 0과 미기록을 구분해요. 0만으로 싫어한다고 해석하지 않아요.",
      },
      {
        name: "중립 표현",
        condition: "tone=neutral",
        appearance: "중립 배경·경계·글자",
        behavior:
          "정보의 표현 색만 바꿔요. 감각이나 호감의 평가값은 바뀌지 않아요.",
      },
      {
        name: "중립 표현 + 0",
        condition: "tone=neutral + value={0}",
        appearance: "중립색 이름과 0",
        behavior: "tone과 value는 독립적으로 조합할 수 있어요.",
      },
    ],
    stateNote:
      "TasteChip은 정보를 표시하는 span이에요. selected·disabled 같은 선택 옵션은 없어요. 감각 선택에는 SensoryBubble이나 SelectionCard의 선택 규칙을 사용해요.",
    rules: [
      {
        title: "미기록은 말로 밝혀요",
        body: "value를 생략한 칩은 이름만 남아요. 데이터가 없다는 뜻을 전달하려면 “기록 없음”을 별도로 표시해요.",
      },
      {
        title: "값을 읽는 기준을 가까이 둬요",
        body: "“이번 식사의 단맛 강도 · 0–10”처럼 범위와 의미를 보여줘요. 같은 숫자를 호감이나 음식 전체 평가로 바꾸어 읽지 않아요.",
      },
      {
        title: "배경 위 글자색과 시그널 컬러를 구분해요",
        body: "작은 글자에는 tintSurfaceText를 사용해요. main은 차트나 아이콘의 시그널 색이에요. 중립 톤으로 바꾸어도 원래 데이터 의미는 유지해요.",
      },
    ],
    example: {
      context: "이번 식사의 미각 강도 · 0–10 · 설명용 합성 예제",
      good: "단맛은 강도 0으로 기록했고 신맛은 기록하지 않은 상태예요. 수치와 결측을 각각 표시해요.",
      avoid:
        "단맛 강도 0을 “싫어함”으로 바꾸거나, 기록하지 않은 신맛을 0으로 채우지 않아요.",
    },
    tokens: [
      {
        part: "배경 / 경계",
        state: "미각 표현",
        reference: "getTasteTintSoft / getTasteTintSoftBorder",
        value: "미각별 tintSoft / tintSoftBorder · 경계 1px",
      },
      {
        part: "미각 글자",
        state: "이름만 · 수치",
        reference: "getTasteTintSurfaceText",
        value: "미각별 tintSurfaceText",
      },
      {
        part: "이름",
        state: "값 포함",
        reference: "--tb-color-text-primary",
        value: COLOR_TOKENS.text.primary,
      },
      {
        part: "배경 / 경계",
        state: "중립 표현",
        reference: "--tb-color-surface-muted / --tb-color-border-strong",
        value: `${COLOR_TOKENS.surface.muted} / ${COLOR_TOKENS.border.strong}`,
      },
      {
        part: "글자",
        state: "중립 표현",
        reference: "--tb-color-text-tertiary",
        value: COLOR_TOKENS.text.tertiary,
      },
      {
        part: "간격 / 여백 / 글자",
        state: "웹 기본",
        reference: "gap-1 / px-2 py-1 / text-[10px] (구현값)",
        value: "간격 4 · 좌우 8 · 상하 4 · 10px",
      },
    ],
    platforms: [
      {
        property: "기본 형태",
        web: "span · 둥근 캡슐 · 경계 1px",
        ios: "HStack · Capsule · 경계 1pt",
      },
      {
        property: "크기",
        web: "기본 10px · 별도 size prop 없음",
        ios: "xs / sm / md · 기본 xs",
      },
      { property: "값 생략", web: "undefined 또는 null", ios: "nil" },
      { property: "0 표시", web: "value={0}", ios: "value: “0”" },
      {
        property: "의미 색",
        web: "TASTE_COLORS의 tintSurfaceText",
        ios: "TasteAxis.tintTextColor",
      },
    ],
    accessibility: [
      "이름과 값을 텍스트로 제공해요. 숫자의 의미와 단위를 주변 제목이나 접근성 이름에 함께 적어요.",
      "정보 표시용 칩에 선택 상태를 임의로 붙이지 않아요. 조작이 필요하면 적합한 선택 컴포넌트를 사용해요.",
      "색만 보고 미각을 구분하게 하지 않아요. 미각 이름을 유지하고, 여러 칩은 글자 확대 시 다음 줄로 흐르게 해요.",
      "기록 없음은 별도 문구로 알려줘요. 화면에 값이 없다고 해서 스크린리더가 결측의 의미를 자동으로 알 수는 없어요.",
    ],
    sources: [
      "src/constants/tasteColors.ts",
      "src/constants/designTokens.ts",
      "ios/TasteBuddy/Models/TasteModels.swift",
    ],
    reference: {
      label: "SEED · Chip의 사용 판단 구조",
      href: "https://seed-design.io/components/chip",
    },
  },
  "bottom-sheet": {
    kind: "sheet",
    anatomy: [
      {
        name: "손잡이",
        slot: "DrawerContent",
        description:
          "시트의 경계를 알려줘요. 웹은 40×6, iOS 사용자 정의 시트는 36×5예요.",
      },
      {
        name: "헤더",
        slot: "headerStart / headerCenter / headerEnd",
        description:
          "이동·제목·닫기 영역이에요. 웹 제목에는 DrawerTitle을 연결해요.",
      },
      {
        name: "본문",
        slot: "children / bodyClassName",
        description:
          "상세 정보나 선택 항목을 담아요. 긴 내용은 사용처가 본문 안에 스크롤 영역을 제공해요.",
      },
      {
        name: "푸터",
        slot: "footer",
        description:
          "선택 적용 같은 주요 행동을 고정해요. 내용과 하단 안전 영역을 함께 고려해요.",
      },
    ],
    properties: [
      {
        name: "open / onOpenChange",
        initial: "사용처에서 관리",
        description:
          "열림 상태를 제어해요. false 전환에 저장을 연결하지 않아요.",
      },
      {
        name: "trigger",
        initial: "미지정",
        description:
          "DrawerTrigger asChild로 실행 버튼을 연결하면 닫은 뒤 초점을 돌려줄 기준이 생겨요.",
      },
      {
        name: "headerCenter / headerEnd",
        initial: "미지정",
        description:
          "제목과 닫기 버튼을 넣어요. 제목은 짧게 유지하고 오른쪽 버튼과 겹치지 않게 확인해요.",
      },
      {
        name: "bodyClassName / children",
        initial: "flex · overflow-hidden",
        description:
          "Shell 자체는 본문을 스크롤하지 않아요. 긴 목록에는 min-h-0와 overflow-y-auto 같은 본문 처리가 필요해요.",
      },
      {
        name: "footer",
        initial: "미지정",
        description:
          "명시적인 적용 버튼을 넣어요. 저장 성공·오류·미저장 변경 처리는 사용처가 관리해요.",
      },
    ],
    states: [
      {
        name: "닫힘",
        condition: "open=false",
        appearance: "원래 화면",
        behavior: "실행 버튼에서 다시 열 수 있어요.",
      },
      {
        name: "열림",
        condition: "open=true",
        appearance: "오버레이 + 제목 + 본문",
        behavior: "초점이 시트 안으로 이동해요. 제목과 설명을 연결해요.",
      },
      {
        name: "열림 + 변경 있음",
        condition: "사용처의 draft 변경",
        appearance: "선택 상태와 적용 버튼",
        behavior: "임시 선택과 확정 값을 사용처에서 구분해요.",
      },
      {
        name: "적용 중",
        condition: "사용처의 저장 작업",
        appearance: "처리 중 문구 + 비활성 적용 버튼",
        behavior:
          "중복 실행을 막아요. 닫기 허용 여부는 사용처의 저장 정책에 맞춰 정해요.",
      },
      {
        name: "닫기 · Escape",
        condition: "onOpenChange(false)",
        appearance: "원래 화면으로 복귀",
        behavior:
          "저장을 뜻하지 않아요. 임시 변경의 폐기·보존은 사용처가 정하고 초점을 복귀시켜요.",
      },
      {
        name: "적용 성공",
        condition: "명시적인 적용 + 성공 응답",
        appearance: "변경된 원래 화면",
        behavior:
          "확정 값을 반영한 뒤 시트를 닫아요. 실패하면 오류와 재시도 행동을 제공해요.",
      },
    ],
    stateNote:
      "Shell은 배치와 열림을 담당해요. 선택 값, 저장, 키보드 대응, 미저장 변경 정책은 사용처의 책임이에요. 제목이 있는 열린 상태와 닫힌 상태를 상단 프리뷰에서 직접 확인할 수 있어요.",
    rules: [
      {
        title: "현재 화면의 맥락을 이어가요",
        body: "감각 선택, 짧은 상세 확인처럼 원래 화면으로 돌아올 작업에 사용해요. 여러 단계를 오가는 독립 작업은 별도 화면을 선택해요.",
      },
      {
        title: "닫기와 적용을 구분해요",
        body: "닫기·오버레이·Escape는 모두 복귀 경로예요. 저장은 이름이 분명한 완료 버튼에 연결하고, 실패했을 때 수정·재시도할 수 있게 해요.",
      },
      {
        title: "본문만 스크롤하고 마지막 항목을 남겨요",
        body: "긴 목록은 헤더와 푸터 사이에서 스크롤해요. 마지막 항목이 고정 버튼에 가리지 않는지, 작은 화면과 키보드가 열린 상황에서 각각 확인해요.",
      },
    ],
    example: {
      context: "감각 선택을 마치거나 중단할 때 · 설명용 합성 예제",
      good: "닫기는 이전 화면으로 돌아가고, “선택 완료”는 적용을 실행해요. 두 행동의 결과를 따로 정해요.",
      avoid:
        "모든 닫힘에 저장을 연결하면 Escape나 바깥 영역을 눌러도 변경이 확정돼요.",
    },
    tokens: [
      {
        part: "표면",
        state: "열림",
        reference: "--tb-color-bg-focus",
        value: COLOR_TOKENS.background.focus,
      },
      {
        part: "오버레이",
        state: "열림",
        reference: "rgba(0,0,0,0.6) (구현값)",
        value: "검정 60%",
      },
      {
        part: "높이",
        state: "웹 기본",
        reference: "--tb-viewport-height / --tb-safe-area-top",
        value: "뷰포트 × 0.95 − 상단 안전 영역 − 12px",
      },
      {
        part: "상단 반경 / 손잡이",
        state: "웹 기본",
        reference: "rounded-t-[20px] / w-10 h-1.5 (구현값)",
        value: "20px / 40×6px",
      },
      {
        part: "손잡이 색",
        state: "열림",
        reference: "--tb-color-border-strong",
        value: COLOR_TOKENS.border.strong,
      },
      {
        part: "푸터 하단 여백",
        state: "footer 있음",
        reference: "max(12px, var(--tb-safe-area-bottom))",
        value: "12px와 하단 안전 영역 중 큰 값",
      },
    ],
    platforms: [
      {
        property: "높이",
        web: "뷰포트 × 0.95 − safe top − 12px",
        ios: "기본 fixed: 화면 × 0.98 − safe top − 12pt",
      },
      {
        property: "상단 반경 · 손잡이",
        web: "20px · 40×6px",
        ios: "사용자 정의 시트: 32pt · 36×5pt",
      },
      {
        property: "크기 모드",
        web: "기본 고정 높이 · 클래스 재정의 가능",
        ios: "fixed / auto(maxHeightRatio:) · native sheet chrome 옵션",
      },
      {
        property: "본문 스크롤",
        web: "사용처의 내부 스크롤 영역",
        ios: "사용처의 ScrollView 등",
      },
      {
        property: "키보드",
        web: "뷰포트·입력 위치·푸터를 사용처에서 확인",
        ios: "footerKeyboardOffset 등을 사용처에서 전달",
      },
    ],
    accessibility: [
      "DrawerTitle과 DrawerDescription으로 목적을 알려줘요. 닫기 아이콘에는 접근성 이름을 제공해요.",
      "trigger로 연 버튼에 닫은 뒤 초점이 돌아가는지 확인해요. 프로그래밍 방식으로 열면 복귀 위치도 따로 관리해요.",
      "열린 동안 Tab 초점이 시트 안에 머무르는지, Escape로 닫히는지 확인해요. 저장 중 닫기를 막는다면 이유와 종료 경로를 함께 제공해요.",
      "키보드와 큰 글자 때문에 입력·오류·적용 버튼이 가리지 않는지 확인해요. 웹 키보드 확인과 VoiceOver·TalkBack·네이티브 제스처 확인은 각각 기록해요.",
    ],
    sources: [
      "src/components/ui/drawer.tsx",
      "src/constants/designTokens.ts",
      "ios/TasteBuddy/DesignSystem/TBTheme.swift",
    ],
    reference: {
      label: "SEED · Bottom Sheet",
      href: "https://seed-design.io/components/bottom-sheet",
    },
  },
};
