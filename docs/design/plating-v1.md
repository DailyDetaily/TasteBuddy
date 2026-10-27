# Plating v1 — 구현과 확인 범위

2026-09-30 · 기준 체크아웃: `/Users/sinjunho/Desktop/Taste Buddy`

## TCSBadge · 2026-10-08

[TCSBadge](tcs-badge.md)를 기존 웹 기준으로 iOS 공용 컴포넌트와 Figma에 연결했다. 플레이팅에 단색·다색·빈 데이터·비활성 및 Light/Dark 예시를 추가했다. 가중치·경계 혼합·틴트·18pt 높이·7개 음영을 동기화했으며 iOS 제품 화면 편입은 사용처에서 선택한다. 검증 근거: `output/tcs-badge-20261008/`.

## 컬러 스타일 가이드 · 2026-10-07

[최종 컬러 가이드](./color-style-guide.md)는 Atomic 원시 색상, Semantic 역할 연결, 필수 규칙만 제공한다. 기존 TB 150개 페인트 스타일·52개 색상 변수 검토와 상세 대비 근거는 [상세 참고](./color-style-reference.md)에 보관한다. [Figma Atomic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=39-2)·[Semantic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=839-113)과 `/design-system/foundations/colors`에 같은 구분을 적용했다.

- 페이지 정리: Figma Atomic은 원시 팔레트, Semantic은 역할 연결과 57개 UI 역할 색으로 나눴다. 중복 표와 긴 설명을 줄이고, 이전 TB 비교와 문서용 컴포넌트 원본을 Resource로 옮겼다. 플레이팅은 Atomic·Semantic·필수 규칙·참고의 네 섹션으로 줄였으며 상세 참고는 접어 두었다. 정리 작업의 근거: `output/plating/color-pages-simple-20261007/`.

- 신맛 main은 #FFD600. 6개 미각 × 흰색 10·20·30·40·50·60·70·80·90·95의 60개 불투명 컬러 스타일을 만들었다. `chartTrack`·`tintSurface`·`tintSoftBorder`는 tint/80(미각색 20%), `tintSoft`도 옅은 채움 역할로 Light tint/80 · Dark tint/70을 참조한다(2026-10-12 통일). 신맛 20%는 #FFF7CC다.
- Figma의 의미 토큰 57개를 현재 Swift 역할에 맞춰 보강했다. 웹 힌트 #6F6F6F·Figma 기본 아이콘 #3F3F3F를 정렬하고, 상태 Text/Soft·행동·딤을 웹에도 연결했다. 기존 페이지 변수 ID를 유지하며 bg/page로 이름을 정리하고 흰색 surface/base를 분리했다.
- 웹·SwiftUI·Android의 미각 혼합 계산과 역할 연결을 갱신했다. 바·라인 그래프는 chartTrack을 사용한다. 기존 측정 그래픽의 별도 팔레트는 유지한다.
- 타입 검사, Vite/PWA 빌드, iOS x86_64 시뮬레이터 대상 빌드, 색상·대비·미니 그래프 검사 12개 통과. Figma 60단계는 코드와 값·alpha가 일치하고 가이드의 가로 넘침은 없다. 웹 1440px·320px에서도 가로 넘침 0, 여섯 미각 선택 전환과 역할값 일치, 확인 중 런타임 오류 0을 확인했다. 실제 iOS/Android 기기 동작 검증과 Android 빌드는 포함하지 않는다.

근거: `output/plating/color-style-guide-20261007/`. 다른 대화에서 진행 중인 그래프·카드 구조 변경은 유지했다.

## 전체 51개 컴포넌트 iOS 대조 · 2026-10-01

[항목별 대조표](./plating-ios-component-audit.md)에 51개 계열의 실제 타입·사용처·규격·속성·상태·차이를 기록했다. 현재 iOS 제품 구현 38개, 시스템 컨트롤 7개, 참고 견본 5개, 독립 대응 없음 1개다. 기존 Native 소스 연결 17개를 실제 선언 또는 사용처로 수정했다.

사이트는 iOS 대조 결과와 실제 Native 렌더를 먼저 표시하고, 기존 Web 프리뷰·속성은 접힌 참고 영역에서 유지한다. Figma는 기존 참고 링크이며 이번 iOS 대조로 노드를 갱신한 것은 아니다.

시뮬레이터 빌드 성공 후 41개 계열의 실제 SwiftUI 타입을 50장의 독립 예제로 렌더해 확인했다. 나머지 10개는 소스 대조만 완료했다. 캡처의 문구·값은 합성 예제이며 실제 저장·복귀·제스처·VoiceOver·실기기 검증을 뜻하지 않는다. 근거는 `output/plating/native-audit-20261001/`의 대조 JSON, 소스 해시, 캡처 manifest와 빌드 로그다.

최종 타입 검사·Vite/PWA 빌드 통과. 별도 Playwright 세션에서 51개 문서의 1440px·320px 배치 102건, PNG 요청 50개, 문서 앵커 51개, 모바일 외부 번호 4개를 확인했다. 가로 넘침·중복 ID·런타임 오류 0. 갤러리는 51개 중 실제 렌더 41개와 소스 확인 10개를 표시한다. 근거: `output/playwright/plating-ios-audit-*-checks.json`, `output/plating/native-audit-20261001/verification.json`.

캡처 재생성은 DesignSystemPreviewView의 DEBUG 전용 `--design-system-preview --plating-native-audit-capture` 경로를 사용한다. 평소 제품 동작에는 캡처를 실행하지 않는다.

## iOS 기준 재대조 및 외부 번호 배치 · 2026-10-01

PrimaryButton, TasteChip, BottomSheetShell의 추가 가이드는 iOS 소스만 기준으로 표시한다. `nativeComponentGuides.ts`에 현재 명세를 두고 기존 가이드 렌더러와 카탈로그에 연결했다. 아래 최초 보강 기록의 Web/iOS 비교는 이전 단계의 확인 범위다.

- 구조도의 번호와 연결선을 요소 밖에 배치했다. 시트 번호는 절대 위치로 표시해 헤더·본문·푸터의 크기 계산에서 제외했다.
- PrimaryButton의 SemiBold 14/12pt, 기본/Compact 패딩, 비활성 표현과 실제 실행 차단, press/feedback 스프링을 소스와 대조했다. 스프링 duration은 실제 안착 시간이 아닌 파라미터로 명시했다.
- TasteChip의 xs/sm/md, 초기화 방식별 기본 tone, 문자열 값·nil·0, 1pt 내부 경계선, tintTextColor를 대조했다. 여섯 팔레트의 배경·테두리·글자색 18개 항목이 일치했다. `ios/DESIGN_SYSTEM.md`의 오래된 숫자 색 설명도 수정했다.
- BottomSheetShell의 상단 반경 32pt, 손잡이 36×5pt, 헤더와 손잡이의 겹침, 헤더 20/20/12pt 및 푸터 20/16pt 여백, 안전 영역, 높이 모드, 24pt 닫기 아이콘을 대조했다. 본문 여백·스크롤·표시·닫기는 호출부의 책임으로 명시했다.
- 구조도는 설명용 재현이다. 시트 본문과 전체 높이는 축약하며 iOS 런타임 캡처로 표시하지 않는다. 키보드 푸터 전환의 `easeOut(0.24)`에는 Shell 내부의 동작 줄이기 분기가 없다는 현재 한계도 기록했다.
- 확인: 타입 검사 및 별도 출력 디렉터리의 Vite/PWA 빌드 통과. 데스크톱 문서에서 시트 번호 4개의 외부 배치와 규격을 확인했다. 근거: `output/plating/native-comparison-20261001/`의 로그, 팔레트 비교, `ios-sheet-callouts.png`.
- 제한: 이번 수정으로 iOS 빌드·시뮬레이터·실기기 실행을 검증하지 않았다. 후속 모바일 문서 확인은 브라우저 제어 시간 초과로 완료하지 못했다.

## 세 컴포넌트 문서 최초 보강 · 2026-10-01

PrimaryButton, TasteChip, BottomSheetShell에 공통 문서 형식을 적용했다. SEED의 구조·속성·사용 판단·세부 명세 구성을 참고하고, 내용은 현재 Web/iOS 구현에서 확인했다.

- 부품 이름을 연결한 구조도, 웹 속성과 기본값, 17개 상태·조합, 제품 맥락의 권장/피해야 할 예, 18개 부품별 스타일 명세를 추가했다.
- 버튼은 `disabled`와 `visualDisabled`, 처리 중 조합과 실행 책임을 구분했다. 미각 칩은 값 생략·0·미기록·중립 표현을 구분했다. 시트는 닫기와 적용, 본문 스크롤과 저장을 담당하는 사용처의 책임을 명시했다.
- Web/iOS의 높이, 서체, 누름 시간, 시트 반경·손잡이·크기 모드를 현재 값으로 나란히 표시했다. 플랫폼 규격 표는 소스 확인이며 네이티브 실행 검증은 아니다.
- `componentGuides.ts`에 명세를 두고 `ComponentGuidelines.tsx`와 `component-guides.css`가 공통으로 표시한다. 카탈로그의 선택적 `guide` 필드로 연결되어 레지스트리에도 포함된다.
- 문서용 CSS가 Compact 버튼을 48px·14px로 표시하던 부분을 40px·12px로 수정했다. 제품 컴포넌트의 규격은 그대로 사용한다.
- 브라우저 확인: 세 문서의 1280px·320px 배치와 표 영역, 시트 열기·Escape·초점 복귀, 처리 중 실행 차단, Compact 크기, 긴 한국어 버튼의 높이 확장을 확인했다. 근거: `output/plating/component-guides-20261001/browser-checks.json`과 같은 폴더의 화면 캡처.
- 최종 타입 검사와 프로덕션 빌드 통과. 로그: 같은 폴더의 `typecheck.log`, `build.log`. 빌드 출력: `/tmp/plating-component-guides-final-20261001.Hj7IyZ`.

추가 컴포넌트는 명세 데이터와 해당 구조도를 등록해 같은 형식을 사용할 수 있다. 이번 보강은 문서 사이트와 레지스트리에 한정하며 Figma 노드나 네이티브 제품 동작을 추가 변경한 것은 아니다.

## 후속 보완 · 2026-10-01

### 전체 컴포넌트의 Variant · Size · State 문서

[SEED Chip](https://seed-design.io/components/chip)의 속성별 비교 구성을 참고해 현재 카탈로그 51개 상세 페이지를 보강했다. 기존 31개와 공유 작업 폴더에 추가된 20개 모두 현재 소스의 지원 범위로 문서화했다.

- Anatomy, Properties, Variant, Size, State, Slots를 공통으로 제공한다. 109개 속성 축과 162개 시작 상태 설명을 등록했으며, 속성 표에서 실제 prop과 화면 조합을 구분한다. 지원하지 않는 크기나 변형은 새 API처럼 만들지 않는다.
- Chip은 `soft / outline / solid / text`, `xs / sm / md`, 4개 톤, 읽기·실행·선택 용도, 앞뒤 아이콘, 선택·비활성 조합을 비교한다. `asChild` 아이콘은 실제 버튼 자식에 넣고, 선택 상태는 호출부가 관리한다.
- 프리뷰의 속성 선택·초기화와 코드 탭을 연결했다. 비교용 정적 예제는 `inert`로 중복 조작을 막고 실제 조작은 상단 프리뷰에서 제공한다. 대표 제품 코드 외에는 문서 프리뷰 재현 코드임을 표시한다.
- PrimaryButton, TasteChip, BottomSheetShell의 별도 iOS 가이드를 보존했다. 이 세 페이지는 웹 속성 비교를 먼저 표시하고 iOS 구조·상태·규격을 이어서 제공하며, 목차와 안내에서 기준을 구분한다. 예를 들어 웹 TasteChip의 고정 크기를 iOS `xs / sm / md`와 동일하다고 표시하지 않는다.
- 문서 데이터: `src/plating/componentDocumentation.ts`, `additionalComponentDocumentation.ts`. 공통 표시: `ComponentReference.tsx`, `component-reference.css`. 프리뷰와 코드 연결: `ComponentPreview.tsx`, `componentExampleCode.ts`, `PlatingSite.tsx`.
- 전체 51개 상세 페이지에서 1143px·390px 배치, 중복 없는 섹션 ID, 속성 표·컨트롤 일치, 355개 비교 예제의 `inert` 적용과 가로 넘침 없음을 확인했다. 브라우저 런타임 오류는 없었다. 근거: `output/plating/component-docs-pages-20261001.json`.
- 타입 검사와 `/tmp/plating-component-docs-final-20261001` 프로덕션 빌드 통과. 162개 시작 상태의 예제 코드 JSX 구문 검사와 실제 조작 56개 확인 통과. 결과는 `output/plating/component-docs-code-checks-20261001.json`, `component-docs-live-checks-20261001.log`, `component-docs-typecheck-20261001.log`, `component-docs-build-final-20261001.log`에 기록했다.
- 문서 웹의 확인 범위다. 이번 문서 보강으로 Figma 노드나 iOS·Android 앱의 구현·실행 검증을 추가 완료한 것은 아니다.


### 헤더와 영역별 좌측 탐색

SEED의 실제 헤더·Foundations 좌측 탐색을 참고해, 헤더를 시작하기 / Foundations / Components / Patterns / 브랜드 / Resources로 나눴다. 각 문서와 상세 화면의 좌측에는 현재 영역만 표시한다. Components는 카탈로그에서 생성한 전체 31개 이름을 알파벳순으로 제공하며 전체 목록·상세의 현재 위치를 표시한다. 기존 대표 3개 바로가기로만 구성했던 메뉴는 제거했다.

- `src/plating/catalog.ts`: 영역별 진입점·하위 메뉴, 동적 컴포넌트 목록. 라이팅·모션·접근성은 Foundations로 이동.
- `src/plating/PlatingSite.tsx`: 헤더/좌측의 동일 영역 연결, 브랜드 에셋 개별 링크, 모바일 영역 선택, 영역 변경 시 좌측 스크롤 초기화.
- `src/plating/plating.css`: 가운데 정렬 헤더, 선택 상태, 좁은 데스크톱과 모바일 메뉴 대응.
- 확인: 타입 검사 및 `/tmp/plating-navigation-final-20261001` 빌드 통과. 1440/1143/1024/900/801px 헤더 충돌·넘침, 390/320px 모바일, 현재 위치·뒤로 가기·Escape 초점 복귀 등 브라우저 52개 확인 통과.
- 근거: `output/plating/navigation-browser-checks-20261001.json`, `navigation-build-20261001.log`, `navigation-typecheck-20261001.log`, `output/playwright/plating-navigation-*-20261001.png`.
- 이번 변경은 웹 문서 탐색에 한정한다. 컴포넌트 수는 31개이며 Figma·Native 컴포넌트 추가 작업은 하지 않았다.

### 컴포넌트 커버리지 대조

Montage 전체 원본과 현재 제품을 대조한 [컴포넌트 커버리지 감사](./plating-component-coverage.md)를 추가했다. 공개 원본 44개 기준 정리됨 8, 보완 필요 21, 누락 11, 제외·보류 4다. 전체 391개 원본 및 근거·속성 매핑은 별도 인벤토리/JSON에 보존했다. 이 감사는 누락 항목의 추가 구현을 완료했다는 뜻이 아니다.

[SEED까지 포함한 대조표](./plating-seed-coverage.md)도 추가했다. 현행 52문서와 Deprecated 9문서를 구분했으며, 현행은 정리됨 7, 보완 필요 16, 누락 15, 제외·보류 14다. Montage와 동일 역할이 겹치므로 두 집계를 합산하지 않는다. 새로 확인한 알림 배지·입력형 선택 버튼·생년월일 휠·스크롤 페이드도 후속 작업에 포함한다.

첫 항목으로 사이트 프리뷰의 선택 상태 전환을 수정했다. 선택 카드·체크박스·스위치의 시작 상태가 이후 클릭 결과를 덮어쓰지 않도록 분리했고, 같은 상태를 공유하는 라디오의 초기 선택도 연결했다. 해당 선택기는 `시작 상태`로 표시한다.

- 수정 범위: `src/plating/ComponentPreview.tsx`, `src/plating/PlatingSite.tsx`.
- 확인: 클릭·키보드 전환, 문구 편집 후 상태 유지, 비활성, 프리셋 변경, 탭 재진입과 모바일 조작 등 35/35 통과. 런타임 오류 없음.
- 근거: `output/plating/preview-state-checks-20261001.json`. 타입 검사와 `/tmp/plating-preview-state-20261001` 프로덕션 빌드 통과.
- 이번 확인은 문서 사이트 프리뷰에 한정한다. 제품 전체 상태 조합이나 Native 검증을 추가 완료한 것은 아니다.

후속 순서는 실제 제품에서 사용하는 기간·상세 모드 선택기, 출처·수치·펼침 영역, 로딩·재시도 및 태그 레이아웃의 카탈로그/Figma 편입이다. 현재 31개 계열은 선정한 v1 범위이며 제품 전체 컴포넌트 목록은 아니다.

## 실행 결과

- [사이트 홈](http://127.0.0.1:3001/design-system) · [컴포넌트](http://127.0.0.1:3001/design-system/components) · [브랜드 에셋](http://127.0.0.1:3001/design-system/brand-assets) · [모션](http://127.0.0.1:3001/design-system/motion)
- [전용 Figma 파일](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W) · 13페이지, 31개 컴포넌트 계열, 91개 변형, 아이콘 원본 4개, 변수 138개, 텍스트·효과 스타일 16개.
- 14개 문서 안에 UX 원칙, Foundations, Writing, Motion, Accessibility, 4개 제품 패턴과 운영 기준을 구성했다. 기존 BX 렌더 17개를 원본 소스·메타데이터와 연결했다.
- 대표 연결: [PrimaryButton](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-13), [TasteChip](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-23), [BottomSheetShell](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-127).

## 몽타주 Figma 참고 후 수정

사용자가 제공한 [Wanted Design System](https://www.figma.com/design/cBy8RRtgNuhqgYcW4yM4Jo?node-id=0-1)의 실제 페이지·변수·컴포넌트·가이드 보드를 읽고 구조를 참고했다. 원티드 파일에는 쓰기 작업을 하지 않았다.

- Overview와 Updates, Foundations의 Color·Semantic·Typography·Space, 역할별 Components, Patterns, Brand & Motion, Resources로 13페이지를 구성했다.
- 31개 컴포넌트마다 모든 상태 예제, 실제 속성 표, 규격·사용 조건, 메인 컴포넌트를 한 보드에 배치했다. 기존 원본 ID와 138개 변수 연결은 유지했다.
- 컴포넌트 이름에 Action/Input/Navigation/Content/Feedback/Overlay/TasteBuddy 분류를 적용했다.
- TasteChip Value, BottomSheet Title·Description을 텍스트 속성으로 제공했다. Label 변경·6색 Value·Native/Web 시트 문구·아이콘 Instance Swap 12개 조작이 통과했다.
- Kalice는 기존 BX 글리프 경로를 사용해 표지와 타이포 가이드의 벡터로 표현했다. 본문·제품 텍스트는 2026-10-07 Pretendard로 전환했다.
- 대표 보드: [PrimaryButton](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=37-114), [TasteChip](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=38-1503), [BottomSheetShell](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=38-1314).

## 기준과 최종 홈 결정

제품 UI의 기준은 현재 iOS 소스와 [iOS 디자인 시스템](../../ios/DESIGN_SYSTEM.md), 의미와 문구의 기준은 제품 경험 지침과 [DESIGN.md](../../DESIGN.md)다. 브랜드 조형·영상은 `brand-launch`의 기존 소스와 실제 렌더를 사용한다. Figma, 브라우저 재현, 네이티브 실행은 서로 다른 확인 범위다.

홈은 사용자 최종 요청에 따라 [Montage](https://montage.wanted.co.kr/)의 중앙 정렬 타이틀, 넓은 여백, 그래픽 행과 문서 진입 구조를 참고했다. SEED식 영상 벤토는 제거했다. 밝은 홈과 어두운 문서 화면을 유지하고, 설명 문구·번호·보조 라벨을 줄였다. 홈에는 영상 요소와 자동 재생이 없다. 기존 영상은 브랜드 에셋 문서에서 재생한다.

영문 디스플레이는 Kalice, 한글·본문·조작 요소는 Pretendard다. 로컬 사이트는 기존 `Kalice-Trial-Regular.otf`와 Pretendard 원본을 로드한다. 공개 배포와 별도 폰트 라이선스 검토는 이번 로컬 구현의 검증 범위에 포함하지 않는다. 2026-10-07 Figma 계정에 Pretendard Regular·Medium·SemiBold·Bold를 등록하고 파일 전체의 Noto Sans KR 텍스트·스타일을 Pretendard로 전환했다. Kalice의 기존 벡터 표현은 유지한다. 원본 로고와 워드마크는 편집 가능한 SVG 형태를 보존했다.

홈 Bloom은 기존 `brand-launch/public/brand/taste-bloom/*.svg`에서 배경 원만 제외한 장식용 파생물이다. 원본 경로와 SHA-256은 `public/plating/bloom-forms/provenance.json`에 기록했다. 개인 취향 데이터의 시각화로 사용하지 않는다.

## 현황과 보완

| 발견한 차이·누락 | v1 처리 | 상태와 한계 |
| --- | --- | --- |
| 기존 단일 긴 프리뷰에 탐색·검색·직접 URL 부족 | 홈, 사이드바, 검색, 목록, 개별 상세, 모바일 메뉴, 목차 구현 | 브라우저 직접 진입·뒤로 가기 확인 |
| Figma 전용 라이브러리 부재 | 변수·의미 alias·스타일·메인 컴포넌트·Nested Instance·상태·속성·패턴 구축 | 파일 내 편집 가능. 조직 라이브러리 배포는 수행하지 않음 |
| Figma와 코드 경로 대응 부재 | 실제 노드 ID, 소스, 문서 URL을 레지스트리로 연결 | `src/plating/figma-map.json`; 자동 양방향 동기화 아님 |
| PrimaryButton의 긴 한국어 높이·Radix ref 문제 | 고정 높이를 최소 높이로 전환하고 forwardRef 제공 | 긴 문구, 비활성, 시트 초점 복귀 확인 |
| TasteChip의 밝은 색 텍스트·숫자 0 누락 | tintSurfaceText 사용, 0을 유효 값으로 렌더링 | 6색 대비 6.17–9.89:1, Native 숫자 색도 같은 의미 색 적용 |
| ToastSurface의 밝은 바탕과 흰 글자 | 기본 전경색 수정, 문구 줄바꿈, 선택적 실제 action button 제공 | action callback 확인; 수명·교체는 presenter 담당 |
| BottomSheet trigger와 focus/ref 연결 누락 | trigger slot과 DrawerOverlay forwardRef 추가 | 선택·초점 유지·Escape·초점 복귀 확인 |
| Native/Web 시트 규격 차이 | Native/Web 변형과 차이 문서화 | Native 반경32·98%, Web 반경20·95%; 제품 전체 일괄 변경 없음 |
| Native/Web 상단 바와 버튼 서체·여백 차이 | 플랫폼별 값을 명시 | 상단 바 Native48/Web56; 기본 버튼 Native semibold/Web medium |
| Figma 줄바꿈과 인스턴스 폭 대응 누락 | Auto Layout, Fill, 최소 높이, 텍스트 속성 정리 | 검토 인스턴스와 긴 한국어 예제 확인 |
| 기록 없음 예제에 합성 기록 수·해석이 남음 | 0개·빈 상태와 근거 부족 문구 분리 | 미기록을 중립·싫어함·취향 부재로 해석하지 않음 |
| 브랜드 자산의 출처와 플레이어 부족 | 기존 렌더·poster·원본·해상도·fps·길이·해시 연결, 미디어 제어 구현 | 렌더 존재를 최종 채택·제품 적용으로 간주하지 않음 |
| 문서 사이트에서 앱의 overflow:hidden 상속 | 문서 경로에만 자연스러운 세로 스크롤 복원 | 앵커 이동·320px 화면 확인 |

## 구조와 변경 절차

- `src/plating/catalog.ts`: 컴포넌트 31개와 문서 내용, 실제 코드/Native 경로, 상태·규격·차이.
- `src/plating/PlatingSite.tsx`: 문서 탐색·검색·갤러리·상세. 실제 프리뷰는 `ComponentPreview.tsx`로 분리하고 지연 로드한다.
- `src/plating/PlatingHome.tsx`와 `plating-home.css`: Montage를 참고한 홈. 문서 스타일과 제품 컴포넌트의 규격을 분리한다.
- `src/plating/MediaPlayer.tsx`: 재생·정지·탐색·속도·동작 줄이기·화면 밖/백그라운드 정지.
- `src/plating/assets.json`: 기존 렌더 17개의 소스와 실제 미디어 메타데이터. `scripts/sync-plating-assets.mjs`로 갱신한다.
- `src/plating/figma-map.json`: 안정적인 컴포넌트 ID와 실제 Figma 노드 ID. 노드를 다시 만들지 말고 변경 대상의 현재 구조부터 확인한다.
- `scripts/sync-plating-home-art.mjs`: 홈 장식 Bloom 파생물 재생성. 원본은 변경하지 않는다.
- `scripts/build-plating-registry.mjs`: 카탈로그를 내보내고 소스 경로 존재 여부를 확인한다.
- `src/constants/platingMotion.ts` → `npm run design:motion` → `src/styles/plating-motion.css`: 제품 모션의 검증된 단방향 생성 범위다.

변경 시 해당 플랫폼 소스와 의미를 먼저 확인하고, 영향을 받는 토큰·컴포넌트·문서·Figma 노드를 함께 갱신한다. 규격 차이는 숨기지 않고 `difference`에 남긴다. 이전 `/design-system#motion` 링크와 `/design-system/legacy`는 유지한다. 개인 기록은 예제로 사용하지 않는다.

## 검증 근거

| 범위 | 확인한 결과 | 근거 |
| --- | --- | --- |
| TypeScript | `npm run typecheck` 통과 | 현재 웹 소스 |
| 제품 모션 | 6개 테스트 통과, 생성 CSS 동기화 확인 | `scripts/plating-motion.test.mjs`, build precheck |
| 프로덕션 번들 | Vite/PWA 빌드 통과 | `/tmp/plating-web-handoff-20260930` |
| 브라우저 기능 | 61/61 통과, runtime page error 없음 | `output/plating/browser-checks-final.json` |
| 브라우저 범위 | 31개 직접 URL·검색·필터·탭·복사·시트·초점·토스트·영상·앵커·뒤로 가기·320px | 동일 검증 JSON |
| 최신 홈 | 영상/벤토 0개, Kalice 실제 로드, 1440·390·320px 가로 넘침 없음, 시작 버튼 → 다크 문서 | `output/plating/home-final-checks.json`, `output/playwright/plating-home-montage-final-*.png` |
| 데이터·연결 | 31개 Web/Native 소스 경로와 Figma ID 존재, 미각 칩 텍스트 대비 확인 | `output/plating/registry-validation.json` |
| Figma | 13페이지 구조, 31세트·91변형·138변수·16스타일, 검토 인스턴스·4개 프로토타입 연결·페이지 시각 확인 | `output/plating/figma/montage-final-audit.json`, `montage-property-checks.json`, `montage-*-final.png` |
| Remotion Studio | Logo-Black 재생 후 프레임 77에서 표시·일시정지 확인 | `output/playwright/plating-remotion-studio-logo-black.png` |
| iOS | simulator target build 성공, 현재 소스의 입력·오류·비활성·미각 칩 상태 캡처 | `output/plating/native/build-after-contrast.log`, `states-20260930.png` |

브라우저에서 확인한 로컬 조작은 배포 환경·서버 저장·계정 동기화 검증이 아니다. Native build와 상태 화면 캡처는 XCTest, 전체 사용자 여정, VoiceOver, 실기기 또는 Android 검증이 아니다. Figma 프로토타입은 단계 이동의 근사 예제이며 Native 제스처 실행 증거가 아니다.

장시간 Remotion Studio 확인 세션에서는 `Maximum update depth exceeded` 로그 2건이 발생했다. 대표 프레임 표시와 재생·정지는 확인했지만, Studio 로그의 원인 분석이나 모든 컴포지션의 무오류 실행을 확인한 것은 아니다. 사이트 플레이어의 브라우저 확인 결과와 구분한다.

현재 Figma 계정/플랜에서는 Code Connect 도구가 허용되지 않아 게시하지 않았다. 노드↔코드↔문서의 실제 링크는 제공하지만 Code Connect 자동 통합으로 표시하지 않는다. Pretendard 폰트는 통일했으며 플랫폼별 줄바꿈·렌더링의 완전한 일치는 사용 화면에서 확인한다. 제품의 다크·고대비 테마는 이번 문서 테마 변경과 별도의 범위다.

## 레퍼런스 적용 범위

[Montage](https://montage.wanted.co.kr/)는 최종 홈의 타이포 중심 위계·여백·탐색, [SEED](https://seed-design.io/)는 문서 정보 구조와 시각적 컴포넌트 탐색, [SOCAR](https://design.socar.kr/)는 UX 원칙의 짧은 전달 방식을 참고했다. 레퍼런스의 브랜드 그래픽·색·로고를 복제하지 않고 Taste Buddy 원본을 사용했다.

## v1 컴포넌트 목록

아래 표는 카탈로그와 실제 Figma 노드를 연결한다. 실제 Web 컴포넌트 렌더와 Native 규격을 참고한 재현의 구분은 각 문서와 `catalog.ts`의 `demo` 필드가 기준이다.

| 계열 | 역할 | 사이트 | Figma |
| --- | --- | --- | --- |
| PrimaryButton | 주요 버튼 | [문서](http://127.0.0.1:3001/design-system/components/primary-button) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-13) |
| IconButton | 아이콘 버튼 | [문서](http://127.0.0.1:3001/design-system/components/icon-button) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-56) |
| TextInput | 입력 필드 | [문서](http://127.0.0.1:3001/design-system/components/text-input) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-84) |
| SearchField | 검색 필드 | [문서](http://127.0.0.1:3001/design-system/components/search-field) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-152) |
| SelectionCard | 선택 카드 | [문서](http://127.0.0.1:3001/design-system/components/selection-card) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-224) |
| Chip | 칩 | [문서](http://127.0.0.1:3001/design-system/components/chip) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-274) |
| Checkbox | 체크박스 | [문서](http://127.0.0.1:3001/design-system/components/checkbox) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-296) |
| RadioGroup | 라디오 | [문서](http://127.0.0.1:3001/design-system/components/radio) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-329) |
| Switch | 스위치 | [문서](http://127.0.0.1:3001/design-system/components/switch) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=6-362) |
| TopBar | 상단 바 | [문서](http://127.0.0.1:3001/design-system/components/top-bar) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-99) |
| BottomTab | 하단 탭 | [문서](http://127.0.0.1:3001/design-system/components/bottom-tab) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-136) |
| BackButton | 뒤로 가기 | [문서](http://127.0.0.1:3001/design-system/components/back-button) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-201) |
| StepIndicator | 단계 표시 | [문서](http://127.0.0.1:3001/design-system/components/step-indicator) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-230) |
| CompactCard | 카드 | [문서](http://127.0.0.1:3001/design-system/components/card) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-267) |
| ListRow | 목록 행 | [문서](http://127.0.0.1:3001/design-system/components/list-row) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-296) |
| StatusChip | 배지 | [문서](http://127.0.0.1:3001/design-system/components/badge) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-321) |
| TasteProfileAvatar | 아바타 | [문서](http://127.0.0.1:3001/design-system/components/avatar) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-342) |
| Separator | 구분선 | [문서](http://127.0.0.1:3001/design-system/components/divider) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=7-515) |
| ToastSurface | 토스트 | [문서](http://127.0.0.1:3001/design-system/components/toast) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-7) |
| InlineError | 인라인 오류 | [문서](http://127.0.0.1:3001/design-system/components/inline-error) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-30) |
| EmptyState | 빈 상태 | [문서](http://127.0.0.1:3001/design-system/components/empty-state) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-63) |
| Progress | 진행 표시 | [문서](http://127.0.0.1:3001/design-system/components/progress) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-96) |
| BottomSheetShell | 바텀시트 | [문서](http://127.0.0.1:3001/design-system/components/bottom-sheet) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-127) |
| Dialog | 다이얼로그 | [문서](http://127.0.0.1:3001/design-system/components/dialog) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-182) |
| DropdownMenu | 메뉴 | [문서](http://127.0.0.1:3001/design-system/components/menu) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=8-211) |
| TasteChip | 미각 칩 | [문서](http://127.0.0.1:3001/design-system/components/taste-chip) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-23) |
| SensoryBubble | 감각 버블 | [문서](http://127.0.0.1:3001/design-system/components/sensory-bubble) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-85) |
| TasteBloom | Taste Bloom | [문서](http://127.0.0.1:3001/design-system/components/taste-bloom) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-153) |
| DiningResultCard | 식사 결과 카드 | [문서](http://127.0.0.1:3001/design-system/components/dining-result) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-250) |
| InterpretationCard | 해석 카드 | [문서](http://127.0.0.1:3001/design-system/components/interpretation-card) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-279) |
| TasteGraph | 미각 그래프 | [문서](http://127.0.0.1:3001/design-system/components/taste-graph) | [원본](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=9-308) |


## 2026-10-01 누락 컴포넌트 추가

SEED·Montage 대조에서 실제 제품 사용 근거가 있던 누락을 중복 없이 20개 계열로 정리해 추가했다. 웹 카탈로그는 총 51개이며 Figma에는 70개 새 변형을 연결했다. 기존 v1의 31개 목록과 감사 집계는 시점별 기록이다. [추가 목록·검토 순서·검증](./plating-component-review.md)을 기준으로 후속 수정한다.


## Resource 출처별 컴포넌트 보기 · 2026-10-03

피그마 Resource 바로 아래에 `기존 TB 컴포넌트`(163:57)와 `새로 만든 컴포넌트`(163:58)를 추가했다. 기존 3 Component의 원본을 이동하거나 복제하지 않고 연결된 인스턴스 갤러리로 제공한다.

- 기존 TB 기반 33종: 기존 코드 재사용 25종 + 기존 Native 구조를 문서용으로 재현한 8종. 추가 카탈로그에 있는 ImageBox·FlowStepCta도 당시 기존 코드이므로 이쪽에 포함했다. FlowStepCta는 2026-10-10 독립 컴포넌트에서 제거하고 StepIndicator + PrimaryButton 조합 패턴으로 전환했다.
- 신규·보강 19종: 플레이팅 웹 라이브러리 17종 + 기존 BirthDatePicker를 조합·보강한 WheelDatePicker 1종 + 신규 SwiftUI Callout 1종. 제품 화면에 적용됐다는 뜻의 분류는 아니다.
- TextareaField 카드에는 웹과 별도 iOS TBTextArea 인스턴스를 함께 배치했다. Callout은 코드만 있고 Figma 원본은 없어 미등록 카드로 표시한다.
- 52개 카드의 중복 없는 분류, 52개 인스턴스의 원본 연결과 카드·프리뷰 영역 내 배치를 확인했다. 두 갤러리의 대표 행을 이미지로 확인했다. 전체 페이지는 27개가 됐다.
- 근거: `output/plating/figma-component-provenance-validation-20261003.json`, `output/plating/component-provenance-*-20261003.png`.
## 미니 그래프 동기화 · 2026-10-07

`MiniChart` / `TBMiniChart`의 [공통 규격](mini-chart.md)을 Figma, 플레이팅 예시, React·SwiftUI 코드와 함께 관리한다. 132×32 고정 영역에서 기본 7개·촘촘한 12개를 지원하며, 0은 막대 두께의 절반 높이, 1은 원형이다. 기록한 식사·음식 전체 평가 예제 카드는 유지한다. 컴포넌트를 바꿀 때 모든 연결 자료를 같은 작업에서 갱신하고 검증 범위를 기록한다.

그룹형 미니 그래프는 2026-10-07 추가했다. `comparisonValues`로 이전·현재를 공통 척도로 비교하며 Figma·React·SwiftUI·플레이팅 예시는 [공통 규격](mini-chart.md)을 따른다.
