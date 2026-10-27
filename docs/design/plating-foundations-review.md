# 플레이팅 Foundations 검토와 보완 제안

## 레이아웃·스페이싱의 실제 iOS 화면 · 2026-10-02

레이아웃 문서에 실제 `AppShellView`의 홈, `DiningFeedbackSheet`의 메뉴 선택, `AppShellView`에서 여는 계정 연결 시트를 연결했다. 홈·식사 기록은 Large와 AX2를 비교하고 계정 연결은 실제 키보드의 닫힘·열림을 비교한다. 스페이싱 문서에는 홈의 첫 인사이트 카드를 확대하고 소스 규격과 실측값을 나란히 표시했다.

### 화면과 측정

- 같은 iPhone 17 시뮬레이터의 402×874pt 화면을 캡처했다. 홈과 식사 기록은 같은 합성 데이터와 초기 스크롤 위치를 사용한다.
- 앱의 실제 뷰에 DEBUG 관찰 코드를 붙여 영역을 기록한다. UIKit 좌표 변환으로 앱 윈도우 기준 위치를 얻고, 시뮬레이터 스크린샷의 3배 픽셀 크기와 대조한다.
- 영역 번호와 직선은 문서의 SVG 오버레이다. 원본 PNG는 유지하며, 원본 보기로 표시를 전환할 수 있다. 키보드나 시트 클리핑으로 보이지 않는 부품에는 번호선을 표시하지 않는다.
- 홈의 첫 카드는 `RecommendationMiniCardLayout`이다. 외곽 132×132pt, 안쪽 108×108pt, 내부 여백 12pt, 페이지 왼쪽 여백 20pt를 실측했다. 내부 여백의 소유자는 `RecommendationMiniCardMetrics.padding`이며 같은 값의 `TBSpacing.card`로 잘못 표기하지 않는다.
- 메뉴 선택의 `TBFlowTopBar`는 32pt이고 하단 행동 영역은 `FlowBottomCtaMetrics.minHeight`의 140pt다. 홈의 48pt 상단바와 혼동하지 않는다.
- 계정 연결 시트는 제품의 커스텀 staged presentation을 사용한다. 별도 시스템 `.sheet`로 표시한 초기 캡처는 최종 자료에서 제외했다.

### 현재 확인된 제품 문제

1. **홈의 AX2 카드 잘림:** 본문 전체 높이는 약 901.7pt에서 1311.7pt로 늘어나지만 인사이트 카드는 132pt로 고정된다. AX2 표본에서 카드 하단 안내가 잘린다.
2. **계정 연결 시트의 키보드 가림:** 키보드는 y=566pt부터 308pt 높이로 표시되고, 입력칸은 y≈728.3pt에 남아 가려진다. 버튼은 y≈793.3pt에서 507.3pt로 286pt 이동하지만 시트의 시작 y=634pt보다 위에 놓여 부모의 클리핑에 잘린다. 단순히 버튼 사각형이 키보드 위에 있다는 계산만으로 실제 표시를 판정할 수 없다.

이 두 상태는 문서에서 개선이 필요한 현재 동작으로 표시했다. 이번 작업은 문서와 관찰 코드이며 제품의 글자 크기·카드 높이·시트 배치를 수정하지 않았다.

### 재현과 확인 범위

`--plating-layout-preview --plating-layout-screen home|dining|sheet --plating-layout-size large|accessibility2`로 실제 뷰를 연다. 키보드 표본에는 `--plating-layout-keyboard`를 더한다. 이메일은 입력·제출하지 않고 실제 입력칸에 초점만 준다. 전용 preview 저장소와 fixture 또는 unavailable 저장소를 주입하며 일반 앱 루트의 계정 복원·동기화는 실행하지 않는다.

- 구현: [LayoutDocumentationPreview.swift](../../ios/TasteBuddy/Features/DesignSystem/LayoutDocumentationPreview.swift)
- 수집: [capture-plating-layout.mjs](../../scripts/capture-plating-layout.mjs)
- 캡처·윈도우 좌표·파일 해시·소스 해시: [nativeLayoutCaptures.json](../../src/plating/nativeLayoutCaptures.json)
- 문서: [NativeLayoutReference.tsx](../../src/plating/NativeLayoutReference.tsx), [nativeLayoutReferenceData.ts](../../src/plating/nativeLayoutReferenceData.ts)
- 검사: [plating-layout.test.mjs](../../scripts/plating-layout.test.mjs) — 6개 캡처의 좌표, PNG 크기·해시, 홈 카드 치수, Dynamic Type 환경, 실제 키보드와 버튼 이동을 확인한다.

iOS Debug 빌드와 캡처 검사 5개가 통과했다. 결과는 `output/plating/layout-native-build-final-20261002.log`, `output/plating/layout-native-capture-20261002.log`, `output/plating/layout-tests-20261002.log`에 있다. 최종 타입 검사와 문서 프로덕션 빌드도 통과했다(`layout-typecheck-final-20261002.log`, `layout-build-20261002.log`).

기존 인앱 브라우저 탭에서 빌드 결과를 확인했다. 홈·식사 기록·계정 연결의 상태 전환, 원본 표시, 가려진 시트 부품의 번호선 제외를 확인했다. 1005px와 390px에서 페이지 가로 넘침이 없으며, 모바일 비교 화면은 한 열로 표시된다. 스페이싱 표는 자체 영역에서 가로 스크롤한다. [홈 영역 설명](../../output/plating/layout-desktop-20261002.jpg), [키보드 비교](../../output/plating/layout-keyboard-desktop-20261002.jpg), [스페이싱 실측 표](../../output/plating/spacing-desktop-20261002.jpg)를 저장했다.

전체 제품 여정, 화면 끝까지의 스크롤 조작, VoiceOver, 실기기는 이 확인 범위에 포함하지 않는다.

## 네이티브 의미색 보완

2026-10-02. iOS 색상 역할을 34개에서 57개로 보완했다. 기존 여섯 미각 팔레트는 유지한다. 사용자 범위 수정에 따라 적용 대상은 iOS와 Plating 문서이며, 이번에 수정했던 웹 제품 파일 36개는 작업 전 스냅샷으로 복원했다. 복원 전 예상 변경과 현재 파일을 대조해 다른 변경이 없음을 확인했고, 복원 후 바이트·SHA256 일치를 확인했다.

- 일반 안내는 `neutral / neutralSoft`, 추가 정보는 `informative / informativeSoft`를 사용한다. 자리 채움은 `placeholderSurface`, 실제 비활성은 `disabledSurface`로 구분한다.
- 오류 배경은 불투명한 `destructiveSoft #FCEDEF`로 통일한다. 성공·주의·오류의 작은 글자는 `successText`, `warningText`, `destructiveText`를 사용한다. 흰색 글자가 올라가는 성공·주의 칩은 `successStrong`, `warningStrong`을 사용한다.
- 주요 행동·선택·초점에는 `actionPrimary / actionOnPrimary`, `selectionSurface / selectionText`, `focusRing`을 연결한다. 누름 표면은 기존 네이티브 규칙과 같은 검정 6%·흰색 10%이며, 호버 표면은 검정 4%다.
- `scrimSubtle / scrimDefault / scrimStrong`은 검정 35%·50%·60%다. 커스텀 오버레이에서 역할에 따라 사용하고 시스템 시트·경고창의 딤은 iOS가 관리한다.
- `textHint`와 이를 참조하는 레이더 라벨을 `#6F6F6F`로 조정했다. 밝은 기본 표면·페이지·보조 표면에서 작은 글자 대비 4.5:1을 만족한다.
- 색상 문서에 8개 역할 그룹, 상태별 조합, 행동·선택 표본, 17개 읽기용 색 조합의 계산 대비를 연결했다. 홈·미각 선택·저장 예시는 현재 SwiftUI 소스와 토큰을 사용한 문서용 표본이다.

확인: 타입 검사, 문서 프로덕션 빌드, 네이티브 색상 계약 4개 검사, Swift 원본과 생성 데이터 대조, iOS 시뮬레이터 빌드와 `testDesignColorTokenMirrorExposesCompleteReactColorLayer` 1개 실행 통과. 기본·호버·누름 합성에서 상태 글자 대비를 검사했다. 실제 SwiftUI 표본 97개를 다시 캡처하고 Callout 전체 프리뷰의 기본·정보·성공·주의·오류 색상을 시각 확인했다. VoiceOver·실기기·제품 전체 흐름은 이 확인에 포함하지 않는다.

색상 사용 예시를 담당한 병행 작업에서도 데스크톱·모바일의 넘침, 미각 선택 토글, 저장 예시·비활성·안내를 확인했고 콘솔 오류가 없었다. 문서 표본 캡처: `output/plating/color-role-usage-20261002.png`. 실제 SwiftUI 프리뷰: `output/plating/color-role-native-preview-20261002.png`.

근거: `output/plating/color-role-tests-20261002.log`, `output/plating/color-role-typecheck-20261002.log`, `output/plating/color-role-native-tests-20261002.log`, `/tmp/plating-color-roles-20261002.xcresult`, `output/plating/color-role-native-captures-20261002.json`, `output/plating/web-color-rollback-20261002.json`. 최종 문서 빌드: `output/plating/color-role-build-final-20261002.log`.

## 몽타주를 참고한 의미색 화면 구성

2026-10-02. [Montage Semantic Colors](https://montage.wanted.co.kr/docs/foundations/base-material/colors/semantic)의 역할별 설명·연속 스와치·색상 상세 표시를 참고했다. 사용자 코멘트에 따라 미각 컬러의 여섯 카드, 선정 이유, 배경 위 글자색과 그라디언트 참고는 유지했다.

- 뉴트럴·상태 영역은 페이지 배경·서페이스·텍스트·경계·아이콘·상태의 여섯 그룹으로 구성한다. Swift 생성 데이터의 34개 색상값을 사용한다.
- 스와치를 누르면 역할 설명, 알파를 포함한 HEX, RGBA, Swift 토큰과 별칭 참조를 표시한다. HEX와 Swift 이름을 복사할 수 있다. 투명 색의 체크무늬는 설명용 바탕이다.
- 이름·역할·색상값 검색, 역할 필터와 전체 보기 복원을 제공한다. 작은 화면에서는 스와치를 최대 세 열로 나누고, 상세 패널의 Swift 이름에 별도 행을 확보한다.

타입 검사·형식 검사·Swift 원본 대조·최종 프로덕션 빌드가 통과했다. 브라우저에서 카드 6개·스와치 34개·역할 그룹 6개를 확인했다. 토큰 복사, Escape 닫기와 트리거 초점 복원, 검색·빈 결과·역할 필터·별칭 표시가 동작했다. 320px에서 페이지 폭은 320px이며 상세 패널은 좌우 16px 안쪽의 288px로 표시된다. `TBColor.overlaySurface`는 모바일 패널에서 한 줄로 읽힌다. [검사 기록](../../output/plating/montage-color-20261001/checks.json), [역할별 스와치](../../output/plating/montage-color-20261001/desktop-groups.jpg), [상세 패널](../../output/plating/montage-color-20261001/desktop-detail.jpg), [모바일 상세](../../output/plating/montage-color-20261001/mobile-detail.jpg), [유지한 미각 카드](../../output/plating/montage-color-20261001/taste-kept.jpg)를 남겼다.

구현은 [ColorFoundationReference.tsx](../../src/plating/ColorFoundationReference.tsx)와 [color-foundation.css](../../src/plating/color-foundation.css)에 있다. [FoundationReference.tsx](../../src/plating/FoundationReference.tsx)는 기존 미각 카드와 새 의미색 화면을 연결하고, [foundationReferenceData.ts](../../src/plating/foundationReferenceData.ts)의 역할 표기를 서페이스로 맞췄다. [catalog.ts](../../src/plating/catalog.ts)는 뉴트럴·상태 컬러의 섹션 제목과 소개를 정리한다.

## 색상 오버뷰와 미각색의 디자인 의도

2026-10-01. [SEED Color](https://seed-design.io/foundations/color)의 오버뷰와 역할 설명을 참고해 색상 문서에 플레이팅의 목적을 추가했다. 소개 순서는 오버뷰 → 미각 컬러 → 뉴트럴 계열로 유지한다.

- 오버뷰는 미각색이 감각의 종류를 구분하고, 뉴트럴 계열이 기록과 행동의 구조를 만든다는 기준을 설명한다. 미각의 종류·강도·호감은 서로 다른 표현으로 다룬다.
- 여섯 색의 이유는 기존 팔레트에 대한 **이번 문서의 디자인 해석**으로 새로 작성했다. 과일·꿀의 주황, 감귤류의 노랑, 식물의 황록, 바다·소금의 파랑, 어우러지는 풍미의 보라색, 견과·오일의 브라운으로 설명한다. 과거 선정 과정이나 보편적인 과학적 대응을 확인한 기록은 아니다.
- 색상값은 기존 Swift 생성 데이터를 사용한다. 원색·밝은 미각 배경·배경 위 글자색의 이름과 사용 기준을 함께 제공한다. 문서의 해석 문구는 생성 데이터와 분리한다.

타입 검사·수정한 참고 화면의 형식 검사·Swift 원본 대조·새 출력 폴더의 프로덕션 빌드가 통과했다. 브라우저에서 오버뷰 → 미각색 → 뉴트럴 계열의 순서, 여섯 선정 이유, 목차 이동과 320px 배치를 확인했다. 320px에서 페이지 너비는 320px로 가로 넘침이 없으며, 오버뷰와 미각 카드가 한 열로 표시된다. [오버뷰](../../output/plating/color-overview-20261001/overview.jpg), [미각 선정 이유](../../output/plating/color-overview-20261001/taste-rationale.jpg), [모바일 오버뷰](../../output/plating/color-overview-20261001/mobile-overview.jpg), [모바일 미각 카드](../../output/plating/color-overview-20261001/mobile-taste.jpg)에 현재 화면을 남겼다.

## iOS 기준 2차 반영: 상태·누름·레이아웃

2026-10-01. 기존 iOS 구현을 검토한 뒤, SEED의 [상태](https://seed-design.io/foundations/state), [표면색 피드백](https://seed-design.io/foundations/feedback/color), [크기 피드백](https://seed-design.io/foundations/feedback/scale), [레이어](https://seed-design.io/foundations/elevation) 설명 방식을 플레이팅에 맞춰 적용했다.

### 문서와 사용 기준

- 기존 간격과 형태를 레이아웃·스페이싱·반경·레이어로 분리하고 상태·누름 피드백을 추가했다. 전체보기·사이드바·Foundation Map을 연결했다.
- 레이아웃에는 상단바의 실제 32+8+8pt, 하단 탭 최소 60pt, 안전 영역·키보드·스크롤의 소유권을 표시했다. 인증 이메일 CTA의 별도 이동과 시트의 일반 푸터를 구분했다.
- 스페이싱·반경 표는 기존 Swift에서 생성한 값을 사용한다. 상태 조합과 일반·동작 줄이기·비활성 입력 반응은 조절 가능한 브라우저 예제로 설명한다. 이 예제는 iOS 렌더링 검증 결과가 아니다.
- 기존 layout의 spacing·shape·layers·responsive 해시는 각각 새 문서 또는 safe-area 절로 연결한다.

### 실제 iOS 공통 구현 변경

1. `PrimaryButton`, `TBFlowBottomCTA`의 보조 버튼, `TBSelectionCard`에 명시적으로 새 누름 피드백을 적용했다. 표면색만 흰색 10% 또는 검정 6%로 바꾸므로 글자·선택 표시·테두리의 색을 덮지 않는다.
2. `TBControlFeedback`은 `max(height, width/4, 24)`를 기준으로 1pt를 줄인다. 가로 감소량은 최대 4pt이며 기존 120ms spring을 유지한다. 동작 줄이기에서는 표면색만 즉시 반응하고 실제 비활성에서는 색과 크기를 바꾸지 않는다. `visualDisabled`의 안내 행동은 유지한다.
3. `AppShellView`는 커스텀 시트 뒤의 기본 화면을 접근성 탐색에서 숨기고, 상위 커버 편집·삭제 확인이 열리면 아래 시트도 숨긴다. 배경을 담은 UIKit hosting 경계를 지나 실제 SwiftUI 콘텐츠에 숨김 상태를 전달한다. 상위 모달에 가려진 시트는 자식 접근성 요소를 제외하고, 현재 최상위 표시 영역에만 `isModal` 의미를 제공한다.

누름 수치는 `TasteBloomMotion.swift`에서 생성 데이터로 추출한다. 기존 `TBTokenButtonStyle()`의 다른 사용처와 기능별 저장·로딩 처리는 유지한다. 키보드·iPad 분할 화면·모든 Dynamic Type 대응을 일괄 완료한 변경은 아니다.

### 확인한 범위

- 문서 타입 검사·프로덕션 빌드·Swift 원본 대조·문서 경로 및 절 ID 검사를 통과했다. 최종 출력은 `output/plating/ios-foundations-phase2-20261001/site-delivery`다.
- iPhone 17 / iOS 26.5 시뮬레이터에서 `TasteBloomMotionTests` 8개가 통과했다. 새 누름 정책의 크기 제한·동작 줄이기·비활성·잘못된 크기 입력을 포함한다.
- `ControlFeedbackUITests` 1개가 통과했다. 버튼 여백 누르기·영역 밖 취소·누름 전용 동작 줄이기·조건 안내 실행·로컬/상위 비활성·처리 중 조합을 확인했다. [시뮬레이터 캡처](../../output/plating/ios-foundations-phase2-20261001/ui-first-attachments/190A7872-C61F-442A-8C04-B3E5F7376875.png)는 실행 횟수와 최종 상태를 보여주며, 누르는 순간의 픽셀 검증을 뜻하지 않는다.
- 최종 모달 구현의 UI 실행 검사는 완료하지 못했다. 컴파일 이후 Xcode의 디버그 심볼 생성에서 응답이 멈춰 해당 검사를 중단했다. 앞선 자동화 실행에서도 응답 지연이 있었다.
- 최초 모달 검사는 `exists == false`를 VoiceOver 노출의 대리 지표로 삼았으나 이 기준은 철회했다. [Apple의 exists 설명](https://developer.apple.com/documentation/xcuiautomation/xcuielement/exists)과 [접근성 테스트 설명](https://developer.apple.com/videos/play/wwdc2023/10035/)에 따라 최종 테스트는 모달 열기·취소·복귀 흐름만 검사한다. VoiceOver 실제 탐색·초점 복원·실기기 확인은 미검증이다.
- 브라우저에서는 상태 문서의 DOM과 탐색 연결을 확인했다. 연결 시간 초과가 반복되어 이번 2차 화면의 시각·320px 반응형·입력 예제 최종 검사는 미완료다. 1차 브라우저 검증 결과를 이 변경에 그대로 적용하지 않는다.

[검사 기록](../../output/plating/ios-foundations-phase2-20261001/checks.json)에 명령별 범위·로그·소스 해시를 남겼다.

## iOS 기준 1차 반영

2026-10-01에 토큰·색상·타이포그래피와 전체보기를 iOS 기준으로 보완했다. 구현 문서의 진입점은 [Foundations 전체보기](http://127.0.0.1:3001/design-system/foundations)다.

- 전체보기와 디자인 토큰 문서를 추가하고 헤더·사이드바·홈의 디자인 토큰 링크를 연결했다.
- `TBTheme.swift`와 `TasteModels.swift`에서 색상 34개, 간격 15개, 반경 9개, 치수 17개, 글자 역할 6개, 미각 팔레트 6개를 추출한다. 페이지 배경과 콘텐츠 표면, 활성 보조 행동과 비활성 글자, 미각 분류색과 배경 위 글자색을 구분했다.
- 색상 검색·역할 필터·Swift 이름 복사, 미각색 조합과 그라디언트 참고 예, 역할별 예문과 배율 조절을 제공한다. 배율 조절은 브라우저 참고 예이며 iOS Dynamic Type 실행 결과와 구분한다.
- 현재 iOS의 기본 글자 크기, 추가 행간, 호환 크기 이름과 실제 SwiftUI 사용 예를 설명한다.

기준값 갱신은 `node scripts/build-plating-ios-foundations.mjs`, 현재 Swift 소스와의 대조는 같은 명령에 `--check`를 붙여 실행한다. 문서 데이터는 [ios-foundations.generated.json](../../src/plating/ios-foundations.generated.json), 렌더링은 [FoundationReference.tsx](../../src/plating/FoundationReference.tsx)에 있다.

타입 검사·형식 검사·Swift 원본 대조·새 출력 폴더의 프로덕션 빌드가 통과했다. 브라우저에서는 색상 검색·빈 결과·역할 필터·복사, 1280px·320px 배치, 긴 한국어의 200% 참고 예제, 모바일 메뉴 이동을 확인했다. [검사 기록](../../output/plating/ios-foundations-20261001/checks.json)에 범위와 로그를 남겼다. iOS 앱의 소스값과 동작은 이번 문서 작업에서 변경하지 않았으며 네이티브 실행 검증은 수행하지 않았다.

아래 내용은 수정 전 비교 검토와 후속 제안이다. 아래 화면 캡처도 최초 검토 당시의 상태다.

2026-10-01 · 검토 기준: `/Users/sinjunho/Desktop/Taste Buddy`

플레이팅에는 색상, 타이포그래피, 간격과 형태, 아이콘과 이미지, 콘텐츠와 라이팅, 인터랙션과 모션, 접근성의 7개 문서가 있다. 미각색과 배경 위 글자색의 구분, 감각과 호감의 구분, 동작 줄이기, 플랫폼 차이를 드러내는 원칙도 이미 마련되어 있다.

보완의 핵심은 **토큰과 실제 구현의 대응을 정확히 만들고, 요소를 선택하고 조합하는 기준을 문서로 제공하는 것**이다. 아래는 현재 문서와 소스에서 확인한 사실에 기반한 제안이다. 제품이나 Figma에 적용된 변경을 뜻하지 않는다.

## SEED에서 참고할 구조

[SEED Foundations](https://seed-design.io/foundations)는 전체보기 외에 16개 주제를 제공한다. 그중 플레이팅에 가장 도움이 되는 점은 다음과 같다.

- [Design Token](https://seed-design.io/foundations/design-token)은 값의 스케일과 역할을 연결한다. 값을 선택한 의도와 실제 사용할 이름을 함께 설명한다.
- [Color](https://seed-design.io/foundations/color)는 역할과 팔레트를 구분하고, [Typography](https://seed-design.io/foundations/typography)는 개별 크기·행간·굵기를 역할별 텍스트 스타일로 조합한다.
- [State](https://seed-design.io/foundations/state), [Feedback](https://seed-design.io/foundations/feedback), [Motion](https://seed-design.io/foundations/motion)은 상태의 의미, 입력에 대한 반응, 시간에 따른 움직임을 각각 설명한다.
- [Elevation](https://seed-design.io/foundations/elevation)은 화면과 시트 같은 전역 계층, 그 안에 놓이는 요소의 계층을 설명하고 표면색·그림자·경계선으로 표현한다.
- [Iconography Usage](https://seed-design.io/foundations/iconography/usage)처럼 크기, 주변 글자, 터치 영역, 실제 사용처를 시각 예제로 연결한다.

플레이팅에는 이 설명 방식과 관계를 적용한다. 제품의 기존 6색, Pretendard, 기본 치수와 모션은 현재 구현과 사용 목적을 근거로 다룬다.

## 먼저 수정할 부분

### 색상 이름과 구현 경로의 대응

현재 색상 문서는 `surface/base = #F3F3F3`를 안내한다. 웹 코드에서는 `COLOR_TOKENS.background.page = #F3F3F3`, `COLOR_TOKENS.surface.base = #FFFFFF`다. 문서 이름에서 코드 경로를 유추하면 다른 값을 선택할 수 있다.

- 문서 근거: [PlatingSite.tsx](../../src/plating/PlatingSite.tsx)의 `ColorTokens`와 현재 브라우저 화면.
- 구현 근거: [designTokens.ts](../../src/constants/designTokens.ts)의 `COLOR_TOKENS`, [design-system.css](../../src/styles/design-system.css)의 `--tb-color-bg-page`와 `--tb-color-surface-base`.
- 제안: 문서 이름·역할·코드 경로·CSS 변수·플랫폼 값을 한 표로 연결하고, 문서의 색상값은 그 대응 데이터에서 표시한다.

Figma 생성 스크립트에도 `surface/base`와 `--tb-color-surface-base`의 잘못된 값 대응 등이 보인다. [prepare-plating-figma.mjs](../../scripts/prepare-plating-figma.mjs)의 색상 배열을 함께 점검해야 한다. 이는 현재 로컬 스크립트의 관찰이며, 연결된 Figma 파일의 최신 변수값을 확인한 결과는 아니다.

### 타이포그래피의 역할과 기존 이름

웹의 `fontSize[20]`, `[22]`, `[24]`, `[28]`은 모두 `18px`다. 문서에도 이 사실은 쓰여 있지만, 숫자 이름만 보고 크기를 선택하기는 어렵다. 기존 이름은 호환용으로 명시하고, 새 사용처에는 역할별 스타일을 안내하는 편이 좋다.

iOS에는 이미 `TBTextStyle`의 `sectionTitle`, `subsectionTitle`, `sheetTitle`, `body`, `caption`, `detailAction`이 있다. 이 정의를 문서에 올리고 웹·Android 대응을 기록하면 된다. iOS의 기본 크기 상한 18pt와 Dynamic Type으로 확대되는 실제 표시 크기는 구분해야 한다.

근거: [웹 글자 토큰](../../src/constants/designTokens.ts), [TBTextStyle](../../ios/TasteBuddy/DesignSystem/TBTheme.swift), [iOS 글자 역할 문서](../../ios/DESIGN_SYSTEM.md).

### 제품 레이아웃의 설명

현재 `간격과 형태`의 반응형 부분은 문서 사이트의 사이드바·목차·프리뷰 폭을 설명한다. 제품 화면에 필요한 안전 영역, 키보드, 하단 고정 행동, 스크롤 영역, 큰 글자에서의 재배치 기준을 추가해야 한다.

`Layout`, `Spacing`, `Radius`, `Elevation`을 각각 찾을 수 있도록 분리하고 현재의 `pageGutter`, `sectionGap`, `cardStackGap` 같은 역할 토큰을 노출한다. 간격 스케일을 늘릴 필요성은 실제 사용처로 판단한다.

근거: [현재 Foundations 문서](../../src/plating/catalog.ts), [LAYOUT_TOKENS](../../src/constants/designTokens.ts), [네이티브 치수와 배치](../../ios/DESIGN_SYSTEM.md).

### Foundations 진입과 연결

헤더의 Foundations는 현재 색상 문서로 바로 이동한다. 전체보기에서는 각 주제가 어떤 결정을 돕는지 설명하는 것이 좋다. 홈의 Foundation Map에서 `디자인 토큰`은 색상의 한 절로, `상태`는 Chip 컴포넌트로 연결되어 있다. 독립 문서가 생기면 이 연결도 함께 바꾼다.

근거: [navGroups](../../src/plating/catalog.ts), [PlatingFoundationMap](../../src/plating/PlatingFoundationMap.tsx).

## SEED 16개 항목 대조

아래의 문서 부족은 해당 기능이나 토큰 자체가 제품에 없다는 뜻이 아니다. 구현된 내용을 문서로 올리는 일과 새로운 기준을 결정하는 일을 구분한다.

| SEED 항목 | 현재 플레이팅 | 수정 또는 추가 제안 |
| --- | --- | --- |
| [Design Token](https://seed-design.io/foundations/design-token) | 색상에 원색·의미 설명이 있고 코드에는 여러 토큰군이 있다. 독립 참고 문서는 없다. | 이름 짓기, 스케일→역할→컴포넌트 연결, 단위, alias, 플랫폼 대응, 변경 절차를 독립 문서로 만든다. |
| [Color](https://seed-design.io/foundations/color) | 미각 6색, 배경 위 글자색, 일부 의미색이 보인다. 코드에 있는 색상 역할 중 문서에 표시되지 않는 항목도 있다. | 페이지·표면·글자·아이콘·경계·상태·미각을 구분하고 배경과 전경의 허용 조합, 실제 적용 예를 제공한다. 이름과 값의 대응부터 수정한다. |
| [Typography](https://seed-design.io/foundations/typography) | 폰트와 대략적인 크기 범위, 긴 문구 원칙을 설명한다. | 역할별 크기·굵기·행간·자간·실제 예문을 표시한다. iOS의 기존 역할을 활용하고 웹의 호환 토큰을 명시한다. |
| [Iconography](https://seed-design.io/foundations/iconography) | 기존 아이콘·Lucide 사용과 접근 가능한 이름, 클릭 영역 원칙이 있다. | 실제 아이콘 목록, 크기와 선 두께의 용도, 글자와의 정렬, 선택 상태, 보이는 크기와 터치 영역을 문서화한다. 이미지 규칙은 별도 탭으로 구분한다. |
| [Elevation](https://seed-design.io/foundations/elevation) | 간격과 형태의 한 절에 경계·그림자·오버레이가 함께 설명된다. 그림자 토큰은 있다. | 페이지·고정 조작부·시트·다이얼로그·일시 안내의 겹침과 각 컨테이너 안의 순서를 독립 문서로 정의한다. 표면색·경계·그림자 선택도 연결한다. |
| [Gradient](https://seed-design.io/foundations/gradient) | 미각별 gradient 토큰과 제품의 그라디언트 구현은 있지만 전용 사용 기준은 없다. | 우선 Color의 하위 탭으로 추가한다. 미각 표현, 콘텐츠 끝의 페이드, 사진 위 가독성, 브랜드 장식의 목적과 적용 대상을 구분한다. |
| [Inclusive Design](https://seed-design.io/foundations/inclusive-design) | 초점, 대비, 대체 정보, 작은 화면, 동작 줄이기 원칙이 있다. | 색상 이외의 정보 표시, 제스처 대안, 확대 시 재배치, 오류 읽기와 접근 가능한 이름을 실제 예제로 보강한다. 측정법과 플랫폼별 확인 조건을 명시한다. |
| [International Design](https://seed-design.io/foundations/international-design) | Foundations에 별도 기준이 없다. 긴 한국어에 대한 설명은 있다. | 우선 날짜·시간·개수·단위·긴 음식명과 장소명 표기를 콘텐츠 문서에 추가한다. 전체 다국어·RTL 대응은 지원 언어와 제품 계획이 정해질 때 확장한다. |
| [Layout](https://seed-design.io/foundations/layout) | 간격·반경·레이어와 함께 묶여 있고 반응형 설명은 문서 사이트 중심이다. | 제품 화면의 영역, 콘텐츠 폭, 안전 영역, 키보드와 고정 행동, 스크롤을 설명한다. 문서 사이트 레이아웃은 사이트 가이드로 이동한다. |
| [Motion](https://seed-design.io/foundations/motion) | 5개 역할, 시간, 키프레임, 시작·종료·중단과 동작 줄이기 등 기존 자료가 있다. | 현재 자료를 유지하면서 역할 기본값과 실제 제품 적용값, 일반 UI·브랜드 시퀀스, 플랫폼별 곡선의 대응을 더 쉽게 찾게 한다. |
| [Radius](https://seed-design.io/foundations/radius) | 반경 스케일과 부품별 용도가 간격과 형태 안에 있다. | 독립 참고 페이지에 표와 실제 부품 예제를 둔다. iOS 시트 32pt와 웹 시트 20px 같은 차이를 명시한다. |
| [Spacing](https://seed-design.io/foundations/spacing) | 숫자 스케일, 페이지 20, 카드 내용 12가 안내된다. 의미 토큰도 코드에 있다. | 페이지 여백·제목과 본문·항목 사이·섹션 사이·고정 행동 아래 여백을 실제 화면에 표시한다. 기존 역할 토큰의 선택 기준을 설명한다. |
| [State](https://seed-design.io/foundations/state) | 컴포넌트별 상태는 있다. Foundations의 공통 상태 문서는 없다. | enabled·pressed·selected·disabled의 관계를 정의한다. 웹의 hover·focus-visible과 실제 필요한 loading·read-only·invalid도 구분하고 조합 표를 만든다. |
| [Voice and Tone](https://seed-design.io/foundations/voice-and-tone) | 콘텐츠와 라이팅의 한 절에 차분한 목소리와 해요체 원칙이 있다. | 초대·입력·해석·오류·삭제 상황별 태도와 표현 예를 마련한다. 취향을 평가하거나 근거 없이 단정하지 않는 현재 원칙을 유지한다. |
| [Writing](https://seed-design.io/foundations/writing) | 용어, 상황별 안내, 행동형 버튼 문구가 있다. | 제목·설명·버튼·오류의 작성 규칙, 숫자·날짜·문장부호·줄바꿈, 권장 및 피해야 할 예를 보강한다. Voice and Tone과 같은 문서의 별도 탭으로 둘 수 있다. |
| [Feedback](https://seed-design.io/foundations/feedback) | 누름 모션과 일부 컴포넌트 규칙에 흩어져 있다. | 입력 직후의 표면색·축소·햅틱, 중첩된 조작 대상, 비활성·처리 중, 동작 줄이기의 반응을 독립 문서로 만든다. 저장 완료·오류·토스트 선택은 결과 안내 패턴으로 연결한다. |

## 독립 문서로 우선 추가할 세 가지

### 상태

선택 상태와 누름 상태는 동시에 나타날 수 있다. 비활성, 읽기 전용, 처리 중은 실행 가능 여부와 초점 규칙이 다르다. 단일 상태 목록과 함께 조합·우선순위·동작 표가 필요하다.

플레이팅의 `PrimaryButton`에는 `disabled`와 `visualDisabled`의 차이, 처리 중 조합이 이미 문서화되어 있다. 이 구분을 공통 문서에 연결하고 컴포넌트의 세부 명세는 해당 페이지에 둔다. 현재 PrimaryButton 명세에는 웹 누름 180ms와 iOS 120ms의 차이도 기록되어 있다.

근거: [componentGuides.ts](../../src/plating/componentGuides.ts).

### 누름 피드백

SEED의 Feedback은 입력이 전달되었음을 알리는 즉각적인 반응을 다룬다. [Scale](https://seed-design.io/foundations/feedback/scale)은 크기에 따른 축소, 전체와 내부 콘텐츠 중 반응할 대상, 중첩 축소를 구체적으로 설명한다. [Color](https://seed-design.io/foundations/feedback/color)는 눌린 표면색과 선택 상태 색상의 관계를 설명한다.

플레이팅은 현재 0.98배 누름 규칙을 가진다. 작은 아이콘과 넓은 버튼에서의 적용 예, 축소할 영역, 카드 내부의 개별 행동, 누름 취소 후 복귀, 동작 줄이기 시 남길 반응을 정리한다. 새로운 축소 공식의 도입 여부는 그 예제를 비교한 후 결정한다.

### 레이어

그림자 목록만으로 시트 안의 메뉴, 시트 위의 확인창, 오류 안내의 위치를 정할 수는 없다. 각 오버레이의 소속 컨테이너, 가림막 범위, 겹침 순서와 초점·닫기 규칙을 연결해야 한다. 시각적인 깊이와 구현의 `z-index` 값은 각각 설명한다.

## 플레이팅에 추가할 감각과 데이터 표현

Taste Buddy에는 감각 데이터가 색, 그래프, 칩, Bloom과 문장으로 변환되는 공통 기준이 필요하다. 현재 원칙·패턴·컴포넌트에 흩어진 내용을 Foundations의 `감각과 데이터 표현` 문서로 모으는 것을 제안한다.

- **무엇을 측정했는가:** 감각의 존재, 강도, 호감, 적절성, 식사 전체 평가를 각각 설명한다.
- **없는 값과 확인된 값:** 미기록·확인 불가·확인된 0·중립을 시각적으로 어떻게 구분하는지 예제를 제공한다.
- **색과 형태의 의미:** 미각 6색의 분류 의미, 그래프의 수치 표현, 데이터형 Bloom과 장식형 Bloom의 적용 기준을 연결한다.
- **해석의 근거:** 기간, 표본 수, 출처, 조건, 관찰과 추정의 구분을 어느 위치에 표시하는지 정의한다.
- **표시상의 보정:** 작은 값의 가시성이나 애니메이션 때문에 표시를 조정할 때도 원본 값과 데이터 간 관계를 보존하도록 규칙을 둔다.
- **읽기 대안:** 그래프·꽃잎의 모양과 색을 읽지 못해도 같은 핵심 정보를 얻을 수 있는 텍스트를 제공한다.

이미 제품에 있는 의미와 표현 사이의 계약을 정리하는 작업이다. 근거: [원칙과 패턴](../../src/plating/catalog.ts), [네이티브 상세 화면과 데이터 표현](../../ios/DESIGN_SYSTEM.md), [모션의 데이터 보존 규칙](../../src/constants/platingMotion.ts).

## 문서 구성 제안

| 영역 | 문서 |
| --- | --- |
| 시작 | 전체보기, 디자인 토큰 |
| 시각 | 색상, 타이포그래피, 아이콘과 이미지, 레이아웃, 스페이싱, 반경, 레이어 |
| 동작 | 상태, 누름 피드백, 모션 |
| 언어와 접근 | 콘텐츠와 라이팅, 접근성 |
| Taste Buddy의 표현 | 감각과 데이터 표현 |

색상의 하위 탭은 역할·팔레트·그라디언트, 콘텐츠와 라이팅의 하위 탭은 보이스와 톤·작성 규칙·날짜와 숫자 표기로 시작한다. 이미지의 사진·크롭·실패 대체 규칙은 아이콘 규격과 구분된 탭에 둔다.

각 문서는 다음 순서를 기본으로 한다.

1. 어떤 결정을 돕는지 짧게 설명한다.
2. 실제 제품 예제로 차이를 보여준다.
3. 토큰의 이름·값·역할·참조 관계를 제공한다.
4. 선택 기준과 권장·피해야 할 예를 보여준다.
5. 상태 조합, 작은 화면, 글자 확대, 긴 콘텐츠를 다룬다.
6. 관련 컴포넌트와 패턴, 플랫폼별 구현 경로를 연결한다.
7. 지원 범위와 확인 근거를 표시한다.

## 플랫폼과 접근성의 권장 기준

플랫폼은 같은 역할을 어떻게 구현하는지 비교해야 한다. 웹 px/rem, iOS pt와 Dynamic Type, Android dp/sp를 동일 숫자만으로 판단하지 않는다.

현재 Android의 [TasteTheme.kt](../../android/app/src/main/java/com/tastebuddy/android/ui/TasteTheme.kt)는 자체 색상과 타이포그래피를 정의한다. 예를 들어 `TB.ink`는 `#1E1E1E`이고 기본 버튼은 최소 52dp·반경 16dp다. 웹·iOS의 주요 글자 `#0F0F0F`, 기본 버튼 48·반경 10과 차이가 있다. 이것만으로 오류로 판정하지 않고, 공식 지원 범위·의도된 차이·정렬이 필요한 차이를 대응표에 기록해야 한다.

SEED의 [Inclusive Design](https://seed-design.io/foundations/inclusive-design)은 APCA를 사용하고, 현재 플레이팅 문서는 작은 본문 4.5:1 대비비를 안내한다. 서로 다른 측정값을 같은 기준으로 취급하지 말고 측정법과 적용 대상을 명시한다. 색만으로 전달하지 않는 선택 상태, 제스처 대안, 초점, 큰 글자, 보조 기술의 읽기까지 사례를 제공한다.

현재 플레이팅이 제품 라이트 테마를 기준으로 한다는 설명은 명확하다. 제품 다크·고대비 테마는 지원 계획에 따라 확장할 항목이며, 어두운 문서 사이트만으로 지원을 판단하지 않는다.

## 권장 작업 순서와 완료 조건

| 순서 | 작업 | 완료 조건 |
| --- | --- | --- |
| 1 | 토큰 대응, 색상, 타이포그래피, 전체보기 | 문서에서 고른 토큰을 실제 코드에서 찾을 수 있고 값·역할·플랫폼이 일치하거나 차이가 명시된다. 기존 글자 역할과 호환 이름이 구분된다. |
| 2 | 상태, 누름 피드백, 레이어, 제품 레이아웃, 감각과 데이터 표현 | 선택+누름, 처리 중, 시트 위 확인창, 키보드가 열린 입력, 동작 줄이기를 설명할 수 있다. 미기록·0·호감과 강도의 차이를 실제 제품 예제로 설명할 수 있다. |
| 3 | 스페이싱, 반경, 아이콘, 접근성 | 실제 부품과 화면에 치수·관계가 표시되고 큰 글자·입력 방식별 적용 조건을 찾을 수 있다. |
| 4 | 콘텐츠 표기, 이미지, 그라디언트 | 날짜·숫자·긴 이름·실패한 이미지·각 그라디언트의 목적을 실제 제품 예제로 설명할 수 있다. |

## 이번에 확인한 화면과 범위

| 단계 | 화면 | 관찰 |
| --- | --- | --- |
| 1 | SEED Foundations 전체보기 | 전체보기와 세부 문서의 역할이 분명하고 16개 주제를 직접 탐색할 수 있다. |
| 2 | 플레이팅 색상 문서 | 미각 6색과 배경 위 글자색을 함께 보여주는 장점이 있다. Foundations는 7개 문서로 구성되며 전체보기 없이 색상으로 진입한다. 색상 이름과 코드 경로의 대응 보강이 필요하다. |

![SEED Foundations 전체보기](</Users/sinjunho/Desktop/Taste Buddy/output/plating/foundations-review-20261001/01-seed-foundations.png>)

![플레이팅 색상 문서](</Users/sinjunho/Desktop/Taste Buddy/output/plating/foundations-review-20261001/02-plating-colors.png>)

공식 SEED 문서 16개와 관련 하위 문서, 현재 플레이팅의 7개 문서와 토큰·일부 플랫폼 구현을 대조했다. 화면은 이번 검토에서 열려 있던 두 브라우저 탭을 직접 캡처하고 저장 파일을 확인했다. iOS·Android 실행, Figma 최신 파일, 전체 접근성·제품 상호작용 검증은 이번 검토의 범위에 포함되지 않는다.

## 타이포그래피 문서 보강 · 2026-10-02

`/design-system/foundations/typography`에 iOS 글자 역할과 제품에서 쓰는 조합, 실제 Dynamic Type 표본을 추가했다.

- `TBTextStyle`의 6개 역할을 SwiftUI로 렌더하고 크기·굵기·색상·추가 행간을 표시했다. `UIFont`의 기본 행 높이는 별도 측정값으로 설명한다.
- 상단 바·흐름 제목·기본 및 compact 버튼의 글자 규격과 사용 API를 연결했다.
- 홈 `CompactSummaryCard`, 식사 `DiningFeedbackIntroHeader`, 분석 `TasteQuestionStackCard`에서 글자 조합을 추출했다. 표본의 문구는 문서용 예문이고 전체 제품 화면이나 모든 상호작용을 재현한 것은 아니다.
- 같은 긴 한국어와 390pt 너비에 `.large`, `.xxxLarge`, `.accessibility2`를 적용했다. 측정된 콘텐츠 높이는 각각 268pt, 352pt, 541pt다. 긴 버튼 문구는 확대 시 줄바꿈된다.
- 기존 브라우저 입력·배율 미리보기는 접힌 참고 영역에 유지했다. 실제 iOS Dynamic Type 표본과 구별했다.

제품의 폰트 값은 이번 작업에서 변경하지 않았다. 네이티브 변경은 DEBUG 문서 캡처와 실행 분기, Xcode 프로젝트 등록이다.

### 확인 근거

| 확인 | 결과 |
| --- | --- |
| iOS Debug 시뮬레이터 빌드 | 성공. `TypographyDocumentationCapture.swift` 포함 |
| SwiftUI 캡처 | 역할 6개, 사용 조합 3개, Dynamic Type 3개, 총 12개 생성 |
| 서체 등록 | Pretendard Regular·Medium·SemiBold·Bold의 PostScript 이름 확인 |
| 캡처 검사 | `node --test scripts/plating-typography.test.mjs` 4개 통과. 기본 크기·서체 이름·PNG 크기·해시·콘텐츠 높이 검사 |
| 문서 정적 검사 | `npm run typecheck`와 별도 출력 디렉터리의 `npm run build` 통과 |
| 브라우저 | 기존 Chrome 플레이팅 탭에서 역할·사용 예시·Dynamic Type 표시 확인. 1885px와 390px 너비에서 문서 가로 넘침 없음 |

캡처와 측정값은 [nativeTypographyCaptures.json](../../src/plating/nativeTypographyCaptures.json), PNG는 [native-typography](../../public/plating/native-typography)에 있다. 수집 코드는 [TypographyDocumentationCapture.swift](../../ios/TasteBuddy/Features/DesignSystem/TypographyDocumentationCapture.swift)이며, `--design-system-preview --callout-preview --plating-typography-capture`로 실행한다.

![실제 Dynamic Type 표본을 비교하는 문서](../../output/plating/typography-dynamic-desktop-20261002.jpg)

이 검증은 문서와 독립 SwiftUI 표본에 한정한다. 실제 제품 화면 전체의 큰 글자 배치, 스크롤·키보드·고정 하단 영역, VoiceOver와 실기기는 확인하지 않았다.
