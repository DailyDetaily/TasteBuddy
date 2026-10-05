# Plating 네이티브 UX 개선 — 원본 수정과 여러 줄 입력

2026-10-02 · 작업 ID `tsk_8583ac62efcfcf3a` · 1차 적용 범위

## 목적과 범위

좋은 TB 컴포넌트를 재사용하면서 기본적인 입력·취소·복구 UX를 실제 네이티브 화면에서 보완한다. 앱 전체 UX 감사를 완료한 문서가 아니다. 이번 단위는 **음식 기억 → 회고·식사 시점 바로잡기**와 **다이닝 추가 메모의 공용 입력 적용**이다.

유지: Pretendard, 중립 표면, 20pt 카드/입력 반경, 기존 미각·평가 데이터, 원본 식별자, TBA 분석과 저장·동기화 계약. 기존 `TasteDetailGroup`, `SectionCard`, `TBTokenButtonStyle`, `Callout`, 시스템 TextEditor·Picker·DatePicker·toolbar를 재사용한다. 핵심 탭이나 카테고리·읽기 상세 정책은 변경하지 않는다.

## 확인한 문제와 해결

| ID | 변경 전 근거 | 제품 영향 | 이번 적용 |
| --- | --- | --- | --- |
| EDIT-01 | `FoodMemoryDetailView`의 수정·전체 편집·비교가 연속된 일반 텍스트 Button | 긴 원본을 읽은 뒤 행동을 찾고 누르기 어렵고 삭제와 위계가 섞임 | 기존 `TasteDetailGroup`에 세 개의 전체 행 버튼을 구성. 최소 52pt·줄바꿈·chevron. 삭제는 별도 44pt 행동과 기존 destructiveText |
| EDIT-02 | `FoodMemoryCorrectionSheet`의 취소가 즉시 dismiss, 저장이 항상 활성, 변경 여부 없음 | 수정 중 이탈로 초안 유실, 변경 없는 저장 | `FoodMemoryCorrectionDraft`로 로컬 초안 관리. 변경 없으면 저장 비활성·즉시 취소, 변경 있으면 계속 수정/변경 버리기 확인·스와이프 닫기 차단 |
| EDIT-03 | 전역 `diningPersistenceError`를 폼에 그대로 표시 | 이전 작업 오류가 현재 오류처럼 보이거나 실패 뒤 초안 상태를 파악하기 어려움 | 현재 저장 시도의 오류만 로컬 상태로 표시. 기존 Callout critical을 사용하고 해당 위치로 스크롤·접근성 초점 요청 |
| INPUT-01 | 회고 수정과 `DiningFeedbackSheet.reflectionView`의 개별 TextEditor, 다이닝 선택사항 표기가 입력 뒤에 위치 | 입력의 목적·상태·안내 방식이 화면별로 다름 | 실제 두 사용처를 `TBTextArea`로 교체. 레이블→편집 영역→도움말/오류 구조와 초점·비활성 상태 공용화 |

관찰 근거는 실제 합성 QA 검색→음식 기억 화면 및 위 Swift 소스다. 수정 전 회고 편집 화면의 시각 캡처는 확보하지 못했으며 해당 결함은 소스에서 확인했다. 실제 사용자 조사 결과나 앱 전체의 문제가 모두 해결됐다는 뜻은 아니다.

## 참고한 공식 패턴

확인일: 2026-10-02. 외부 코드·브랜드 자산·라이브러리를 복사하거나 설치하지 않았다.

- [SEED Field](https://seed-design.io/components/field): 레이블·입력·안내의 관계, 오류 우선 안내, 값이 바뀐 편집에서의 이탈 확인. 문구·픽셀 규격을 복사하지 않고 TB의 기존 표면·타이포그래피에 적용.
- [SEED Text Input & Textarea](https://seed-design.io/components/text-input): 입력·초점·오류·비활성의 구분과 고정 편집 영역의 내부 스크롤. 이번 TB 타입은 readOnly·AI loading·내용 길이 기반 autosize를 지원한다고 문서화하지 않는다.
- [Montage Text area / Web](https://montage.wanted.co.kr/docs/components/selection-and-input/text-area/web): 입력 목적의 제목·placeholder·설명과 여러 줄 입력 상태. Web API를 SwiftUI에 그대로 옮기지 않는다.
- [Apple interactiveDismissDisabled](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled(_:)): 변경한 초안의 실수 이탈 방지에 시스템 presentation 기능 사용. 확인창·키보드·텍스트 편집은 운영체제 동작을 유지한다.

TDS·Material을 이번 문제의 필수 외형으로 섞지 않았다. 다음 흐름에서 필요할 때 관련 공식 컴포넌트를 별도로 대조한다.

## 컴포넌트 계약

### TBTextArea — 신규 공용 타입, 기존 화면에 실제 적용

파일: `ios/TasteBuddy/Components/NativeInputComponents.swift`

- `text: Binding<String>`, `label: String`은 필수.
- `placeholder`, `accessibilityName`, `helperText`, `errorText`, `minimumHeight`, `isEnabled`, 외부 `FocusState<Bool>.Binding` 지원.
- 기본 편집 viewport는 156pt, 회고 수정은 180pt. **위·아래 10pt 패딩, 레이블과 메시지 높이는 별도**다. 이 값을 컴포넌트 전체 높이로 표시하지 않는다.
- Dynamic Type 배율로 viewport를 넓힌다. 긴 입력은 TextEditor 내부에서 스크롤하며 페이지도 별도로 스크롤한다. 내용 길이에 따른 무제한 autosize가 아니다.
- label 14pt SemiBold, 입력 13pt Regular, 안내 12pt Regular. 기존 `TBFont`와 `TBColor` 사용.
- 초점 경계 2pt, 기본/오류 경계 1pt. 오류가 도움말보다 우선하며, 상위 비활성도 실제 입력을 막는다.
- 저장·검증·필수 여부는 호출부가 소유한다. 선택적인 회고를 필수로 바꾸거나 글자 수 제한을 새로 만들지 않는다.
- Placeholder를 값으로 저장하지 않고 원문의 공백·줄바꿈·Unicode를 보존한다.

### 수정 흐름 — 기존 컴포넌트 조합

파일: `ios/TasteBuddy/Features/Home/FoodMemoryViews.swift`

`FoodMemoryCorrectionDraft`는 note/mealTime/foodSource의 편집값과 **편집을 시작할 때의 원본**을 함께 보관한다. 부모 화면의 live entry가 갱신되어도 `@State` 초안 안의 비교 원본은 바뀌지 않는다. 저장 시 이 원본을 복사하고 기존과 동일하게 확인된 식사 시점만 date/observedAt에 반영한다. 감각·호감·알맞음·전체 평가와 원본 식별자를 변경하지 않는다.

재개 중 소스 대조에서 `let original`을 부모의 갱신값으로 받으면서 초안만 `@State`로 유지하는 불일치를 확인했다. `expected`가 최신 원본으로 자동 교체되지 않도록 기준을 초안으로 옮겼다. 이 위험은 코드 구조에서 판단한 것으로 실제 사용자 데이터에서 덮어쓰기를 재현했다는 뜻은 아니다. 별도 회귀 테스트는 편집 시작 이후 원본 변경 시 저장 거절·최신 원본 유지·초안 보존을 확인한다.

`AppModel.updateDiningEntry(_:expected:)`의 기존 동기 로컬 저장과 stale 원본 검사를 그대로 사용한다. 가짜 대기나 로딩 화면을 넣지 않고, 원격 동기화 완료라고 약속하지 않는다. 실패하면 초안은 화면에 남고 기존 원본을 덮어쓰지 않는다. 계정 generation이 바뀌면 기존대로 편집을 닫는다.

### 실제 교체 위치

| 기존 구현 | 새 구현 | 실제 경로 |
| --- | --- | --- |
| 회고 수정 Form의 개별 TextEditor | TBTextArea + 기존 카드/피커 + 시스템 toolbar | 내 기록 검색 → 음식 기억 → 회고·식사 시점 바로잡기 |
| 다이닝 reflectionView의 개별 TextEditor와 뒤쪽 선택사항 표기 | TBTextArea | 디테일 태그의 추가 메모 행동 → reflectionView |
| 음식 기억의 세 개 일반 텍스트 행동 | TasteDetailGroup + 기존 버튼 스타일 | FoodMemoryDetailView 본문 하단 |
| 현재 편집과 관계없는 전역 오류 노출 | 현재 저장 시도 전용 Callout | FoodMemoryCorrectionSheet 저장 실패 |

## Plating 및 Figma

사이트는 기존 `textarea` 카탈로그 계열을 유지하며 실제 Native 타입을 `TBTextArea`로 갱신한다. Callout은 critical 표시형의 실제 제품 사용처를 추가한다. 모든 Callout 옵션이 제품에 사용된다고 간주하지 않는다.

`NativeComponentReference`에는 항목별 소스 대조일과 실제 Native 사용 설명을 지원한다. 과거 웹 설명과 신규 iOS 사용처를 합치지 않는다. `patterns/revision`은 실제 수정·취소·저장 계약과 소스를 연결한다.

Figma: 기존 웹 TextareaField `77:198`과 인스턴스는 보존한다. 서로 다른 플랫폼 규격을 같은 상태라고 덮어쓰지 않고 `Input/TBTextArea (iOS)` 대응 세트 `126:580`과 검토 보드 `126:581`을 추가했다. 기본·입력됨·초점·오류·비활성의 5가지 시각 상태, Label/Value/Message/Show message 속성을 제공한다. Value와 Message는 상태와 별도이므로 검토 인스턴스에 실제 예문을 명시했다.

기존 Figma 변수·스타일을 재사용했다. iOS hint는 현재 #6F6F6F, 웹은 #888888이므로 기존 공유 변수를 일괄 변경하지 않고 필요한 native 역할을 별도 alias로 연결했다. 기존 Noto Sans KR 대체 스타일을 유지하며 앱의 Pretendard와 동일한 폰트 렌더라고 주장하지 않는다. 새 네이티브 변수는 실제 Swift 이름을 갖고, 해당하지 않는 Web/Android code syntax는 만들지 않았다.

[Figma 네이티브 입력 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=126-581) · [원본 수정 상태 계약](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=131-198)

Patterns의 새 보드 `131:198`은 기존 입력 컴포넌트 인스턴스로 변경 없음·수정 중·저장 실패와 취소/완료 계약을 설명한다. 전체 네이티브 화면이나 시스템 시트·키보드의 픽셀 재현은 아니다. 기존 Patterns 프레임은 보존했다. `figma-map.json`의 nativeComponents/nativeReviews/patterns 대응에 새 ID를 기록하고 기존 웹 매핑은 유지한다. iOS의 `NativeProductComponentCatalog`에도 TBTextArea의 실제 사용과 Callout critical의 제품 적용을 반영했다.

## 검증 기록

지속 보관한 요약·최종 소스 해시·로그·합성 화면은 `output/plating/native-ux-20261002-8583-retry/verification.json`과 같은 폴더에 있다. 대용량 `.xcresult`와 빌드 출력은 아래 임시 경로에 보존한다.

2026-10-02 재개 검증. 이전 감사나 중간 빌드의 통과를 최종 결과로 대체하지 않았다. 환경은 Xcode 26.6 / iOS 26.5 / Plating QA iPhone 17 시뮬레이터이며, QA 진입점의 합성 데이터에서 실제 제품 화면을 사용했다. 개인 계정의 기록은 수정하지 않았다.

| 범위 | 실제 결과 | 근거 (`/tmp/tb-ux-20261002-8583/retry/` 기준) |
| --- | --- | --- |
| 최종 iOS 앱 및 단위 테스트 | `PlatingEditingContractTests` 7/7 통과, exit 0 | `unit-final.log`, `unit-final.xcresult` |
| 최종 제품 흐름 UI 테스트 | 수정·취소·버리기·저장·큰 글자 2개 + 기존 검색·비교·정정·Undo/Redo·삭제 1개, 총 3/3 통과, exit 0 | `ui-validated.log`, `ui-validated.xcresult` |
| 실제 편집 화면 | 키보드 열린 편집, 변경 버리기 확인, 큰 글자와 취소 접근을 화면으로 확인. 최종 테스트 첨부 14개 추출 | `ui-final-attachments/manifest.json`; 실제 입력과 취소 화면 확인 |
| SwiftUI 독립 표본 | TBTextArea 5개: 빈 값·입력됨·오류·비활성·큰 글자. 390pt 부모, 3배 PNG, SHA-256 확인 | `native-captures/manifest.json`; 5개 이미지 시각 확인 |
| 기존 캡처 보존 | 기존 42개 계열을 변경하지 않고 textarea 1개 계열만 추가 | `capture-textarea.py`, `capture-textarea.log`, 기존 registry와 항목별 대조 |
| Foundations | Swift 원본 3개와 생성 데이터 일치 | `node scripts/build-plating-ios-foundations.mjs --check` |
| Motion | 생성 CSS 일치, 6/6 테스트 통과 | `npm run test:motion` |
| 최종 TypeScript | `tsc --noEmit` 통과, exit 0 | `typecheck-final.log`, `typecheck-final.exit` |
| Plating 문서 브라우저 | 수정 흐름·Textarea·Callout × 320/390/1280px = 9개 확인. 가로 넘침·중복 ID·실행 예외 0. Textarea 이미지 5개의 로드·상태명 확인 | `site-checks.json`, `site-checks.log` |
| Plating 배포용 빌드 | Vite/PWA 빌드 통과, exit 0. 기존 dist를 덮어쓰지 않고 별도 출력 | `site-build.log`, `site-build.exit`, `site-delivery/` |
| Figma | `126:580`의 5개 실제 컴포넌트 변형, 편집 속성, 변수 연결 25개 노드를 확인. 입력 보드 및 수정 패턴을 시각 확인 | `figma-review.json`; 보드 `126:581`, `131:198` |

단위 테스트는 viewport 계산, 원문/초안 독립, note 외 원본 보존, 빈 회고·미지원 출처값 보존, 확인 시점 적용, stale 편집 차단에 더해 **편집 시작 원본의 고정**을 검사한다. UI 테스트는 QA의 검색 진입점을 사용했으며, 홈의 모든 진입 경로나 앱 전체를 실행한 검증은 아니다.

최종 단위 검사는 `TasteBuddy` scheme의 `test`, UI 검사는 같은 최종 앱 빌드와 수정된 UI 테스트 번들에 대해 `TasteBuddyMemoryQA` scheme의 `test-without-building`으로 수행했다. 공통 destination은 `B25AEC3A-FDA5-4DAE-A549-23061D6E2EB9`, derived data는 `/tmp/plating-native-20260930`이다. 실제 전체 명령은 각 로그 첫머리에 보존했다.

중간 실패도 보존한다. 최초 빌드는 시간 제한으로 종료됐고, 초기 UI 실패는 테스트 입력 helper의 커서 위치 및 iPhone에서 동작하지 않은 Cmd+A 선택 가정 때문이었다. 짧은 fixture의 실제 trailing 편집 영역에 커서를 놓고 원문을 지운 뒤 **입력값 전체 일치 단언**을 유지해 재검증했다. 실패를 피하려고 원문·저장 결과 검사를 제거하지 않았다. `ui-retry.xcresult`에서 3/3 통과한 뒤, 원본 고정 보완을 포함한 최종 앱에서 `ui-validated.xcresult`로 다시 3/3 통과했다.

경고와 제한: 단위 테스트 시작 시 `AttributeGraph: cycle detected` 경고 1회가 있었으며 앞선 `unit-limited.log`에도 같은 종류가 존재했다. 테스트는 통과했지만 경고 원인은 이번에 분리하지 못했다. 웹 빌드에는 일부 큰 번들과 오래된 Browserslist 데이터 경고가 남아 있다. 이를 없애려고 무관한 의존성 업그레이드를 하지는 않았다. VoiceOver/TalkBack 실사용, 실기기, 저장 장치 오류를 주입한 화면 테스트, 다이닝 전체 플로는 미검증이다. 저장 충돌은 단위 테스트에서 확인했고, 오류의 정적 입력 표본을 실제 저장 실패 UI 테스트로 간주하지 않는다.

변경 전 원본은 `baseline/`, 재개 직전 원본은 `retry/baseline/`에 별도로 보존했다. 최종 Figma 재개 수정은 기존 `131:228`, `131:235`의 저장·충돌 설명 두 곳이며 기존 노드와 인스턴스는 유지했다.

캡처는 DEBUG 전용 `--design-system-preview --plating-native-audit-capture --plating-textarea-capture`로 재생성했다. 기본 상태는 Dynamic Type large, 큰 글자 표본은 accessibility2다. 정적 캡처와 실제 입력·저장·보조 기술 검증을 구분한다. 최종 PNG는 `public/plating/native-component-audit/textarea--*.png`, 연결은 `src/plating/nativeAuditCaptures.json`에 있다.

## 미반영 및 다음 범위

이번 적용은 앱 전체 완료가 아니다. 홈·분석·검색 필터·프로필·다른 편집 화면의 전체 UX 감사와 교체는 남아 있다. 날짜 범위/출처 피커의 업무 규칙은 이번에 바꾸지 않았다. 다이닝 전체 기록 플로와 Android·실제 웹 제품의 대응 편집 UX는 별도 검증·반영 대상이다.

향후 진행은 같은 방식으로 실제 흐름 1~2개씩 선택한다. P0 저장/취소/데이터 의미 → P1 입력/선택/탐색/접근성 → P2 일관성과 중복 → P3 문서·장식 순서이며, 문서를 늘리는 것보다 실제 제품 적용과 검증을 우선한다.
