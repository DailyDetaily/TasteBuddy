import { additionalComponents } from "./additionalCatalog";
import type { ComponentDocumentation, ComponentProperty, PropertyKind } from "./componentDocumentation";

// These entries document the shared workspace's additional library components.
// They describe the current APIs without changing those components' behavior.
const axis = (key: string, title: string, api: string, kind: PropertyKind, values: [string, string, string?][], description: string, source: ComponentProperty["source"] = "web"): ComponentProperty => ({
  key, title, api, kind, description, source,
  defaultValue: values[0][0],
  options: values.map(([value, label, previewState]) => ({ value, label, previewState })),
  control: values.every(([, , previewState]) => Boolean(previewState)),
  compare: values.every(([, , previewState]) => Boolean(previewState)),
});
const fixed = "별도 size enum은 없어요. 내용과 부모 너비에 맞춰 배치하며 긴 한글과 확대 글자를 확인해요.";
const noVariant = "별도의 외형 variant를 제공하지 않아요. 필요한 콘텐츠·상태·동작을 조합해요.";
const states: Record<string, string> = {
  "기본":"입력하거나 실행할 수 있는 초기 예제예요.", "입력됨":"값이 입력되어 있어요.", "선택됨":"선택한 값을 유지해요.",
  "오류":"오류 이유와 해결 행동을 함께 안내해요.", "비활성":"현재 값은 유지하고 실행·입력을 막아요.",
  "빈 값":"아직 선택하지 않았어요.", "값 있음":"확정한 값을 표시해요.", "큰 글자":"직접 선택 메뉴를 사용하는 배치 대안이에요.",
  "선택":"선택 결과를 표시해요.", "실패":"실행 실패와 다시 시도를 확인해요.", "읽음":"읽지 않은 알림 수가 0이면 배지를 숨겨요.",
  "점":"수량 대신 새 알림의 존재를 표시해요.", "수량":"실제 읽지 않은 알림 수를 표시해요.", "99+":"표시 상한을 초과한 수량이에요.",
  "접힘":"제목만 표시해요.", "펼침":"상세 내용을 표시해요.", "긴 내용":"긴 내용이 흐름 안에서 줄바꿈돼요.",
  "긴 문구":"긴 한국어가 잘리거나 겹치지 않는지 확인해요.", "빈 목록":"비어 있다는 안내를 제공해요.",
  "불러오는 중":"정확한 비율을 만들지 않는 비정량 진행 상태예요.", "긴 안내":"긴 안내를 줄바꿈해서 표시해요.",
  "원본 없음":"등록된 이미지가 없는 상태예요.", "불러오기 실패":"원본이 있지만 불러오지 못한 상태예요.",
  "말일":"월을 바꾸면 유효한 마지막 날짜로 맞춰요.", "직접 입력":"휠을 사용하기 어려울 때 날짜 입력을 제공해요.",
  "미리보기":"선택한 사진을 표시하고 삭제할 수 있어요.", "긴 제목":"제목이 길어도 본문과 행동이 겹치지 않아야 해요.",
};
const entries: Record<string, Pick<ComponentDocumentation, "anatomy" | "properties" | "slots"> & Partial<ComponentDocumentation>> = {
  callout: {
    anatomy: [["Icon", "선택적인 채운 아이콘"], ["Copy", "짧은 제목과 본문을 한 문단에 배치"], ["Action", "전체 클릭 화살표 또는 닫기 버튼"]],
    properties: [], slots: [["title / message", "짧은 제목과 본문"], ["icon", "SF Symbol 이름 또는 nil"], ["interaction", "동작과 닫기는 호출부 콜백"]],
    sizeNote: "Native 최소 높이 50pt·패딩 14pt·닫기 터치 영역 44pt. 본문은 Dynamic Type에 따라 높이가 늘어납니다.",
    variantNote: "표시·전체 클릭·닫기와 다섯 가지 톤을 조합합니다. 주의·오류는 닫기 없음.",
    boundaries: ["공용 SwiftUI 타입과 네이티브 프리뷰 구현. 제품 화면 편입과 실기기 VoiceOver 검증은 별도입니다."],
  },
  textarea: {
    anatomy:[["Label","입력할 내용의 이름이에요."],["Textarea","여러 줄의 원문을 입력해요."],["Message","도움말보다 오류가 우선이에요."]],
    properties:[axis("rows","Rows","rows","size",[["3","3줄"],["5","5줄"],["8","8줄"]],"HTML textarea의 rows를 전달할 수 있어요. 이 프리뷰는 원본의 기본 높이를 사용해요."),axis("message","Message","hint / error","variant",[["hint","도움말","기본"],["error","오류","오류"]],"error가 있으면 hint 대신 표시하며 입력과 연결해요.")],
    slots:[["label / hint / error","문구는 폼의 검증 결과에 맞춰 전달해요."]], sizeNote:"iOS TBTextArea와 반경 20, 편집 박스 기본 높이 176, 레이블 14·입력 13을 공유해요. 웹은 HTML textarea의 rows와 세로 크기 조정을 지원하고 긴 입력은 내부에서 스크롤해요.",
    guidelines:["작성한 원문을 오류 후에도 유지해요.","여러 줄 입력을 한 줄 Input으로 바꾸지 않아요."]
  },
  select: {
    anatomy: [["Label", "선택할 값의 이름이에요."], ["Value / Placeholder", "현재 값과 빈 값을 구분해요."], ["Chevron", "선택창을 열 수 있음을 알려줘요."], ["Message", "도움말이나 오류를 연결해요."]],
    properties: [axis("state", "State", "value", "data", [["empty","기본","기본"],["filled","선택됨","선택됨"]], "현재 값은 화면에서 전달해요."), axis("picker", "Picker", "onClick / mode", "variant", [["single","단일 선택","기본"],["date","날짜 선택","날짜 선택"],["multiple","복수 선택","복수 선택"],["menu","메뉴 선택","메뉴 선택"]], "같은 필드에 날짜·단일·복수 선택창 또는 브라우저 메뉴를 연결해요.")],
    slots: [["label / value / placeholder", "필드 이름과 현재 값을 표시해요."], ["helperText / error", "메시지와 접근성 설명을 연결해요."], ["onClick / ref", "picker 모드에서 선택창을 열고 초점을 복귀시켜요."], ["options / onChange", "menu 모드에서 정해진 목록의 값을 선택해요."]],
    sizeNote: "프로필 기준 최소 높이 48px/pt · 반경 12 · 좌우 12 · 라벨 12 SemiBold · 값 14 SemiBold · 화살표 16.",
    variantNote: "선택창의 종류를 연결하는 하나의 SelectField예요. InputButton은 이 필드에 통합했어요.",
    guidelines: ["선택창을 연 것과 값을 확정한 것을 구분해요.", "프로필 날짜는 적용 시 반영하고, 단일·복수 선택은 프로필 초안에 반영해요. 전체 프로필 저장은 화면에서 실행해요."],
    boundaries: ["웹 문서의 선택창은 합성 예제이며 실제 계정에 저장하지 않아요."],
  },
  "capsule-tabs": {
    anatomy: [["Group", "같은 질문의 선택지를 공통 배경 없이 배치해요."], ["Option", "44px 터치 영역 안에 32px 캡슐을 표시해요."], ["Selection", "선택값 하나에만 표면·경계·굵은 글자를 적용해요."]],
    properties: [
      { ...axis("usage", "Usage", "options", "data", [["view", "보기 전환"], ["period", "기간 선택"]], "보기 전환과 PeriodPicker는 같은 CapsuleTabs의 사용 예제예요."), control: true },
      { ...axis("axis", "Tone", "axis", "variant", [["none", "기본색"], ["sweet", "단맛"], ["sour", "신맛"], ["bitter", "쓴맛"], ["salty", "짠맛"], ["umami", "감칠맛"], ["fat", "지방맛"]], "axis를 생략하면 기본색, 전달하면 해당 미각의 tintSurface·tintSurfaceText·tintSoftBorder를 사용해요."), control: true },
      { ...axis("menu", "Layout", "menu", "layout", [["false", "캡슐 목록"], ["true", "메뉴 대안"]], "큰 글자에는 menu를 전달해요. collapseToMenu를 켜면 320px 이하에서 메뉴로 바뀌어요."), control: true },
      { ...axis("disabled", "Enabled", "disabled", "data", [["false", "사용 가능"], ["true", "비활성"]], "현재 선택을 유지하고 변경을 막아요."), control: true },
    ],
    slots: [["options", "value·label·disabled 목록. 문구와 개수는 데이터로 전달해요."], ["value / onValueChange", "현재 선택과 선택 변경 콜백이에요."], ["label", "선택 그룹의 접근성 이름이에요."]],
    sizeNote: "캡슐 높이 32px · 터치 높이 44px · 좌우 14px · 간격 8px · 글자 13px. 선택 Bold, 기본 Medium이에요.",
    variantNote: "하나의 CapsuleTabs에 기본색·미각 6색, 선택·비활성, 캡슐·메뉴 배치를 조합해요.",
    guidelines: ["PeriodPicker는 1·3·6개월·1년·전체 옵션을 미리 구성한 사용 패턴이에요.", "기간 계산·데이터 필터링·기록 없음 표시는 화면이 처리해요. 문서 예제는 선택값만 바꿔요."],
  },
  "text-action":{anatomy:[["Label","덜 강조하는 행동의 이름이에요."]],properties:[axis("disabled","Enabled","disabled","data",[["false","사용 가능","기본"],["true","비활성","비활성"]],"이름을 읽을 수 있게 유지하고 실행을 막아요.")],slots:[["children","행동을 설명하는 짧은 문구예요."]],sizeNote:"새 웹 TextAction은 최소 44px의 조작 영역을 사용해요. Native AuthTextActionButton의 기존 28pt와 다른 구현이에요.",guidelines:["실제 URL로 이동할 때는 버튼 대신 링크를 사용해요."]},
  "icon-action-button": {
    anatomy: [["Target", "행동을 실행하는 32pt 높이의 영역이에요."], ["Icon", "종류와 활성 상태를 표시해요."], ["Count", "전달한 경우에만 숫자를 표시해요."]],
    properties: [axis("kind", "Kind", "kind", "variant", [["save","저장"],["bookmark","북마크"],["like","좋아요"],["comment","댓글"],["share","공유"]], "저장·북마크는 기록 배치, 좋아요·댓글·공유는 소셜 배치를 사용해요."), axis("active", "State", "active", "data", [["false","기본","기본"],["true","활성","활성"]], "활성은 저장·북마크·좋아요만 지원해요."), axis("count", "Count", "count", "slot", [["number","숫자 표시","기본"],["undefined","숫자 없음","숫자 없음"]], "숫자를 생략하면 아이콘만 표시해요.")],
    slots: [["onClick", "기록 작성·북마크 편집·댓글·공유는 화면에서 실행해요."], ["activeColor / label", "화면의 미각 색상과 접근성 이름을 지정해요."]],
    sizeNote: "높이 32pt. 기록 아이콘 24pt, 소셜 아이콘 18pt·공유 17pt, 숫자 12pt Regular입니다.",
    guidelines: ["기본 버튼은 상태를 반전하거나 저장하지 않아요.", "좋아요만 토글 의미를 제공해요. 댓글·공유는 액션 버튼이에요."],
    boundaries: ["화면의 실제 서버 저장·오류·복구 정책을 컴포넌트가 대신하지 않아요."],
  },
  "record-actions": {
    anatomy: [["Save", "기록 작성으로 진입해요."], ["Bookmark", "북마크 저장·편집 시트를 열어요."]],
    properties: [axis("state", "State", "isRecorded / isBookmarked", "data", [["false","기본","기본"],["true","저장됨","저장됨"]], "두 버튼의 상태는 독립적으로 전달해요."), axis("disabled", "Disabled", "disabled", "data", [["false","사용 가능","기본"],["true","비활성","비활성"]], "실행 가능 여부를 화면에서 결정해요.")],
    slots: [["onRecord / onBookmark", "콜백이 있는 버튼만 표시해요. 버튼을 눌렀다는 이유로 저장 완료 상태를 만들지 않아요."]],
    sizeNote: "32×32pt 버튼 두 개, 아이콘 24pt, 간격 0pt.",
    guidelines: ["순서는 저장 → 북마크예요.", "북마크 활성 상태에서도 편집 시트를 열어요."],
    boundaries: ["현재 기록·북마크 상태와 저장 위치는 화면이 관리해요."],
  },
  "social-actions": {
    anatomy: [["Like", "좋아요 상태와 수량이에요."], ["Comment", "댓글 보기·작성이에요."], ["Share", "공유 행동이에요."]],
    properties: [axis("state", "State", "isLiked", "data", [["false","기본","기본"],["true","활성","활성"]], "좋아요의 활성 상태만 전달해요."), axis("count", "Count", "likeCount / commentCount / shareCount", "slot", [["number","숫자 표시","기본"],["undefined","숫자 없음","숫자 없음"]], "세 수량은 독립적이며 실제 값만 전달해요.")],
    slots: [["onLike / onComment / onShare", "세 행동을 독립적으로 실행해요. 댓글 콜백이 없으면 읽기 전용으로 표시해요."], ["accentColor", "좋아요 활성 색상을 지정해요."]],
    sizeNote: "높이 32pt · 아이콘 18pt/공유 17pt · 버튼 간격 8pt · 숫자 간격 2pt · 숫자 12pt Regular.",
    guidelines: ["순서는 좋아요 → 댓글 → 공유예요.", "댓글·공유를 토글로 표현하지 않아요."],
    boundaries: ["예제의 숫자와 반응은 합성 데이터예요. 제품의 집계·공유 성공 여부는 화면의 책임이에요."],
  },
  "notification-badge":{anatomy:[["Badge","버튼에 붙는 작은 표시예요."],["Count","표시할 때만 수량을 나타내요."]],properties:[axis("dot","Variant","dot","variant",[["true","점","점"],["false","수량","수량"]],"수량 대신 존재 여부만 표현할 수 있어요."),axis("count","Count","count","data",[["3","3개","수량"],["120","99+","99+"],["0","숨김","읽음"]],"0 이하·유효하지 않은 값은 숨기고 99를 넘으면 99+로 표시해요.")],slots:[],sizeNote:"점 6px / 수량 최소 18px. 긴 수량은 99+로 축약해요.",guidelines:["배지는 장식으로 숨기고 실제 수량은 알림 버튼의 접근성 이름에 포함해요.","확인 후 실제 읽음 처리 결과에 맞춰 갱신해요."]},
  skeleton:{anatomy:[["Shape","예상 콘텐츠의 윤곽이에요."],["Status","로딩 중임을 텍스트로 알려줘요."]],properties:[axis("shape","Shape","shape","variant",[["card","Card","카드"],["text","Text","텍스트"],["rectangle","Rectangle","미디어"],["circle","Circle","아바타"]],"실제로 나타날 콘텐츠의 형태를 선택해요.")],slots:[],guidelines:["새 데이터를 로딩할 때 실제 콘텐츠의 구조를 유지해요.","동작 줄이기에서 반복 애니메이션을 멈춰요."]},
  "image-frame":{anatomy:[["Frame","비율과 잘림 영역이에요."],["Image","등록된 원본이에요."],["Fallback","없거나 실패한 경우의 대체 아이콘이에요."]],properties:[axis("ratio","Ratio","className / aspect ratio","layout",[["16:9","가로형","이미지"],["1:1","정사각형","정사각형"]],"비율은 원본 ImageBox의 prop이 아닌 호출부 클래스예요.","composition"),axis("fallback","Fallback","imageSrc / fallback","variant",[["image","이미지","이미지"],["none","원본 없음","원본 없음"],["error","실패","불러오기 실패"]],"등록된 이미지가 없음과 불러오기 실패를 구분해요."),axis("kind","Kind","kind / fallback","data",[["chef","Chef"],["restaurant","Restaurant"],["menu","Menu"]],"kind별 대체 아이콘을 선택할 수 있어요. 현재 프리뷰는 메뉴를 사용해요.")],slots:[["alt","콘텐츠 이미지의 의미를 제공해요."]],guidelines:["잘림으로 필요한 정보가 사라지지 않는지 확인해요.","원본 유무를 추론한 음식 평가로 바꾸지 않아요."]},
  disclosure:{
    anatomy:[["Accordion","세로로 이어진 항목의 펼침 상태를 관리해요."],["Header / Trigger","헤더 전체가 클릭 영역이며 제목과 화살표를 포함해요."],["Content Panel","헤더 아래에 불렛 또는 문장형 본문이 펼쳐져요."]],
    properties:[
      axis("open","Open","values / defaultValues / onValuesChange","data",[["closed","접힘","접힘"],["open","펼침","펼침"]],"열린 항목의 value 배열을 사용해요. defaultValues가 없으면 모두 접혀 있어요."),
      axis("format","Content","AccordionContent children","slot",[["bullets","불렛 목록","펼침"],["paragraph","문장형","문장형"]],"본문을 불렛 목록 또는 문장으로 작성해요. 형식은 콘텐츠 슬롯이 소유해요.","composition"),
      axis("multiple","Expansion","multiple","variant",[["false","단일 펼침","펼침"],["true","복수 펼침","복수 펼침"]],"기본은 한 항목씩 열고 다른 항목을 열면 기존 항목이 닫혀요."),
      axis("variant","Variant","variant","variant",[["inline","연속 목록","펼침"],["separated","분리형","분리형"]],"항목 사이 구분선 또는 분리된 카드로 배치해요."),
      axis("size","Size","size","layout",[["medium","Medium"],["large","Large"],["responsive","Responsive"]],"제목·설명·화살표와 헤더 여백을 조절해요."),
    ],
    slots:[["title / description / prefix","헤더 제목과 선택적인 설명·앞쪽 요소예요."],["AccordionContent","커스텀 콘텐츠 컨테이너예요. 본문 패딩과 타이포그래피는 자식에서 지정해요."]],
    sizeNote:"Medium은 제목 16·줄 높이 24·설명 13·화살표 20px, Large는 18·16·24px입니다. Responsive는 768px에서 Large로 전환해요.",
    variantNote:"Inline은 구분선으로 이어진 목록, Separated는 12/16px 간격으로 나뉜 카드입니다.",
    guidelines:["최소 두 개 이상의 항목으로 구성해요.","헤더 전체가 클릭 영역이에요. 본문 내부에 별도 스크롤을 만들지 않아요.","단일 콘텐츠를 여는 Disclosure는 별도 컴포넌트로 유지해요."],
    boundaries:["웹 Accordion의 그룹 구조와 펼침 정책을 구현했어요. 현재 iOS 공용 타입은 단일 Disclosure이며 같은 그룹 API를 제공하지 않아요."],
  },
  "scope-label":{anatomy:[["Caption","기간·출처·척도를 짧게 알려줘요."]],properties:[axis("context","Context","children","data",[["record","기록","기록 기반"],["selfReport","자기보고","자기보고"],["insufficient","근거 부족","근거 부족"]],"데이터 종류에 맞는 내용을 조합하는 예제이며 별도 context prop이 아니에요.","composition")],slots:[["children","근거가 되는 날짜·출처·표본 수를 표시해요."]],guidelines:["자기보고와 실제 식사에서 관찰한 감각을 구분해요.","없는 근거 수나 기간을 만들어내지 않아요."]},
  "chip-group": {
    anatomy: [["Add / Input", "36px (+) 칩이 입력 필드로 바뀌어요."], ["Chips", "Chip으로 디테일 태그 정보를 표시하고 선택해요."], ["Overflow", "숨겨진 태그 수를 +N으로 표시하고 전체를 펼쳐요."]],
    properties: [axis("variant", "Variant", "variant", "variant", [["basic", "기본", "기본"], ["editable", "편집형", "편집형"]], "기본형은 태그만, 편집형형은 (+)·태그·(+N)을 함께 배치해요."), axis("input", "Input", "input", "data", [["closed", "추가 버튼", "편집형"], ["open", "입력 중", "입력 중"]], "입력값에 따라 36–220px로 늘어나며 Enter로 추가하고 Escape로 취소해요.")],
    slots: [["items", "id·label·selected·recommended·custom을 제공해요. 문자열 목록도 읽기용으로 받을 수 있어요."], ["onToggle / onAdd", "선택과 추가한 값은 화면에서 저장해요."], ["input", "기존 화면의 입력 상태와 콜백을 연결할 수 있어요."], ["axis", "선택한 태그의 미각 색상을 지정해요."]],
    sizeNote: "기존 디테일 태그 규격: 최소 높이 36px · 글자 12px SemiBold · 좌우 12px · 간격 8px. (+)는 36px 원형이에요.",
    variantNote: "기본형은 칩만, 편집형은 (+)·칩들·(+N)을 배치해요. overflow로 기본형에도 +N을 적용할 수 있어요.",
    guidelines: ["+N은 실제 숨긴 항목 수예요. 입력 필드가 늘어나는 너비까지 포함해서 계산해요.", "기본·선택 태그, (+) 입력, (+N)은 같은 Chip을 재사용해요."],
    sources: ["src/components/system/Chip.tsx", "src/components/system/plating/ChipGroup.tsx", "src/components/reservation/DiningFeedbackFlow.tsx", "ios/TasteBuddy/Features/Dining/DiningView.swift"],
    boundaries: ["문서에서 추가한 태그는 로컬 예제 상태에만 반영돼요. iOS의 원본 선택 화면 배치는 변경하지 않았어요."],
  },
  "flow-loading":{anatomy:[["Spinner","진행 중임을 나타내요."],["Message","무엇을 불러오는지 설명해요."]],properties:[axis("message","Message","message","slot",[["short","짧은 안내","불러오는 중"],["long","긴 안내","긴 안내"]],"작업의 대상과 기다리는 이유를 설명해요.","composition")],slots:[["message","값을 생략하면 기본 설문 준비 문구를 사용해요."]],guidelines:["비정량 로딩에서 가짜 진행률을 만들지 않아요.","실패하면 재시도 가능한 별도 상태로 이동해요."]},
  "flow-retry":{anatomy:[["Title / Message","실패한 대상과 다시 할 일을 설명해요."],["Action","동일한 작업을 다시 시도해요."]],properties:[axis("message","Message","message","slot",[["short","짧은 안내","실패"],["long","긴 안내","긴 안내"]],"긴 오류 안내도 줄바꿈해 읽을 수 있어야 해요.","composition"),axis("busy","Busy","busy","data",[["false","재시도 가능"],["true","처리 중"]],"busy가 true면 버튼이 비활성이고 로딩 문구를 표시해요. 상단 예제는 재시도 후 FlowLoadingState로 전환해요.")],slots:[["title / message","현재 실패를 해결하는 데 필요한 내용만 알려줘요."]],guidelines:["다시 시도 callback이 실제 같은 요청을 실행하도록 연결해요.","원래 입력을 보존했는지 확인하기 전 보존을 약속하지 않아요."]},
  "action-area":{anatomy:[["Progress","전체 과정의 현재 위치예요."],["Primary action","다음 또는 완료 행동이에요."],["Secondary action","필요하면 이전·취소를 제공해요."]],properties:[axis("secondary","Secondary","secondaryButtonLabel / callback","slot",[["false","주 행동","기본"],["true","보조 행동","보조 행동"]],"한 영역에서 행동의 우선순위를 분명히 해요.","composition"),axis("indicator","Indicator","showIndicator","slot",[["true","표시"],["false","숨김"]],"단계가 없는 흐름에서는 숨길 수 있어요. 현재 예제는 단계 표시를 사용해요.")],slots:[["stepLabel","현재 단계의 설명이에요."],["actionLabel","실행 결과를 보여주는 문구예요."]],guidelines:["키보드·safe area와 본문이 겹치지 않게 배치해요.","버튼 비활성과 시각적 상태를 구분해요."]},
  "date-picker":{anatomy:[["Label","날짜의 의미를 나타내요."],["Date input","플랫폼의 날짜 선택 UI를 열어요."],["Hint / Error","기간 범위와 오류를 설명해요."]],properties:[axis("mode","Selection","DateField composition","layout",[["single","식사일","식사일"],["range","기간","기간"]],"기간은 두 DateField를 조합하며 min으로 순서를 제한해요.","composition"),axis("bounds","Bounds","min / max","data",[["YYYY-MM-DD","날짜 문자열"]],"유효한 범위를 HTML date input에 전달해요.")],slots:[["label / hint / error","확정 날짜와 회상 기간의 의미를 구분해요."]],guidelines:["표시되는 달력 외형은 브라우저·OS에 따라 달라요.","저장일을 식사일로 대신 쓰지 않아요."]},
  "wheel-picker": {
    anatomy: [["Header", "생년월일 제목과 닫기 버튼이에요."], ["System wheel", "iOS DatePicker가 연·월·일을 표시해요."], ["Apply", "선택한 날짜를 프로필 초안에 반영해요."]],
    properties: [axis("date", "Example date", "value", "data", [["1995-01-01", "일반 날짜", "기본"], ["2000-02-29", "윤년 말일", "말일"]], "1940-01-01부터 오늘 기준 12년 전 사이의 날짜를 선택해요.")],
    slots: [["title", "프로필에서 선택할 날짜의 이름이에요."], ["value / onValueChange", "선택창 임시값을 관리해요."], ["onApply", "적용할 날짜를 전달하고 닫아요."], ["onClose", "임시값을 적용하지 않고 닫아요."]],
    guidelines: ["네이티브는 시스템 DatePicker(.wheel)를 사용해요.", "프로필 초안에 반영하는 적용과 계정에 저장하는 전체 저장을 구분해요."],
    boundaries: ["웹 비교 예제는 실제 iOS 26.5 한국어 캡처를 대조한 BirthDatePicker 외형과 선택·적용 동작을 보여줘요. 문서의 실제 iOS 렌더는 사용자 제공 화면에서 선택창만 잘라낸 이미지예요. OS·언어 설정에 따라 휠 표시가 달라져요."],
  },
  "attachment-input":{anatomy:[["Trigger","파일 선택기를 열어요."],["Preview","선택한 사진을 표시해요."],["Remove / Message","삭제·오류·진행 상태를 안내해요."]],properties:[axis("preview","Preview","initialPreview","variant",[["none","비어 있음","기본"],["image","미리보기","미리보기"]],"initialPreview는 초기값이며 현재 파일 선택은 컴포넌트가 관리해요."),axis("error","Error","initialError","data",[["none","오류 없음","기본"],["error","오류 안내","오류"]],"잘못된 파일과 읽기 실패를 텍스트로 안내해요.")],slots:[["label","입력 영역의 이름이에요."],["onChange","선택한 File 또는 삭제 시 null을 전달해요."]],guidelines:["로컬 미리보기와 서버 저장 완료를 구분해요.","삭제나 새 선택 뒤 이전 비동기 결과가 덮어쓰지 않게 처리해요."]},
};

export const additionalComponentDocumentation: Record<string, ComponentDocumentation> = Object.fromEntries(
  additionalComponents.map((item) => {
    const details = entries[item.id];
    if (!details) throw new Error(`Missing library component documentation: ${item.id}`);
    return [item.id, {
      sizeNote: fixed, variantNote: noVariant,
      states: item.states.map((name) => [name, states[name] ?? `${name}에 해당하는 내용을 표시해요. 선택은 예제의 로컬 상태에서 확인해요.`]),
      guidelines: [item.rule],
      boundaries: ["새 웹 라이브러리의 문서 예제예요. Native 화면과 실제 계정 저장·동기화의 실행 검증은 별도예요."],
      sources: [item.source, item.native],
      ...details,
    } satisfies ComponentDocumentation];
  }),
);
