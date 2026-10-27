# 플레이팅 컬러

Light / Dark · sRGB

[Atomic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=39-2) · [Semantic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=839-113) · [플레이팅](http://127.0.0.1:3001/design-system/foundations/colors)

[Dark Atomic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=939-4592) · [Light / Dark 비교와 Dark Semantic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=939-3899)

[시각화·측정·효과 비교](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1005-4136) · [플레이팅 시각화와 효과](http://127.0.0.1:3001/design-system/foundations/colors?mode=dark#visualization-colors)

## Atomic — 원시 색상

| 단맛 | 신맛 | 쓴맛 | 짠맛 | 감칠맛 | 지방맛 |
| --- | --- | --- | --- | --- | --- |
| #FF9900 | #FFD600 | #95C900 | #7299FF | #B372B4 | #95867A |

- 기준색 혼합 단계: **10 · 20 · 30 · 40 · 50 · 60 · 70 · 80 · 90 · 95%**.
- 기준색은 Light **#FFFFFF**, Dark **#1C1C1C**다. Dark도 같은 미각 원색을 사용하고 배경·그래프·글자 역할에서 밝기를 조정한다.
- 숫자는 기준색 비율이다. `tint/80` = 미각색 20% + 기준색 80%. 모든 단계는 불투명하다.
- 계산: 채널별 `round(main × (1 − p) + base × p)`. 색상 자체에 alpha를 더하지 않는다.
- 미각 다크 톤·뉴트럴·상태 팔레트의 원시 값도 Atomic에서 확인한다.

## Semantic — 사용 역할

| 역할 | Light | Dark | 용도 |
| --- | --- | --- | --- |
| main | 원색 | 같은 원색 | 미각 정체성·강조 |
| tintSurface | tint/80 | tint/70 | 카드·톤 버튼·태그·선택 탭의 옅은 채움 |
| chartTrack | tint/80 | tint/70 | 캡슐 막대 |
| border/subtle | tint/80 | tint/70 | 기본 표면 위 약한 경계 |
| border/default | tint/70 | tint/60 | 채워진 카드·칩·탭의 경계 |
| border/strong | tint/60 | tint/50 | 강한 경계 · 선택·추천 |
| border/accent | main | main | 강조색 아웃라인 |
| tintSoft · chipBackground | tint/80 | tint/70 | tintSurface와 같은 채움의 호환 역할 |
| tintSurfaceText | 기존 진한 글자색 | Light tint/80 | 배경 위 글자 |
| tintSurfaceSubText | 기존 보조 글자색 | Light tint/50 | 보조 글자 |

`{taste}`는 sweet · sour · bitter · salty · umami · fat이다.

배경·표면, 텍스트, 경계·아이콘, 상태, 행동·선택, 딤은 각 역할 토큰을 사용한다. 값이 같아도 이름은 유지한다.

신맛: Light·Dark `main #FFD600`. Light `tint/80 #FFF7CC` · Dark `tint/80 #494116`. Dark 카드 `tint/70 #605414` 위 글자는 `#FFF7CC`다.

Dark 페이지 `#141414` · 카드 `#282828` · 상위 표면 `#343434` · 주요 글자 `#F5F5F5` · 본문 `#B8B8B8`. 사진과 브랜드 그래픽의 대표색은 고정한다. 딤은 두 모드 모두 검정 계열이다.

카드·톤 버튼·태그·선택 탭의 옅은 미각색 배경은 모두 Light `tint/80`·Dark `tint/70`이다. `tintSurface`를 기본으로 쓰며 기존 `tintSoft`·`chipBackground` 접근자도 같은 채움으로 연결한다. 미각 칩의 경계는 `taste/{taste}/border/default`·`borderDefaultColor`로 Light 70 / Dark 60이다. 선택·추천은 같은 채움 위 strong 경계(60/50)와 기존 선택 표시로 구분한다. 본문·작은 라벨은 `tintSurfaceText`, 보조 글자는 `tintSurfaceSubText`를 함께 사용한다. 호버·누름은 기존 상태 오버레이를 얹고 비활성 상태의 의미와 조작 제한은 유지한다.

뉴트럴 미각 칩은 Light 배경 `#F7F7F7`·테두리 `#E5E5E5`, Dark 배경 `#343434`·테두리 `#484848`을 사용한다. Dark 카드 `#282828`보다 칩 면을 밝게 하고 경계를 은은하게 구분한다. 기존 `surface/muted #222222`·`border/strong #808080`의 조합은 이 칩에 사용하지 않는다. 글자는 기존 `text/tertiary`를 유지한다.

## 적용

- 메뉴의 **화면 테마**에서 `시스템 · 라이트 · 다크`를 선택한다. 기본값은 시스템이며, 선택은 각 기기에 저장되어 앱을 다시 열어도 유지된다. 시스템을 선택한 경우에만 OS의 테마 변경을 따른다.
- Figma: **Plating Semantic → Light / Dark**. `taste/{taste}/tint/{step}`도 같은 모드 선택을 따른다. Light 원색과 Dark 전용 원시 값을 모드별 별칭으로 연결한다.
- 웹 앱은 저장된 테마 선택과 `prefers-color-scheme`을 해석해 `data-tb-theme`와 `dark` 클래스를 즉시 갱신한다. CSS 역할 변수와 `uiColorTokens.ts`의 UI 팔레트를 사용한다. SVG의 수치 색상 계산은 `useProductColorMode()`와 모드별 원시 팔레트를 사용한다. 플레이팅 문서에서는 Light / Dark 선택기로 예시를 전환한다.
- iOS의 `TBColor`, `axis.palette`, `axis.measurementPalette`, `axis.chartTrackColor`는 시스템 테마를 따르는 동적 색상이다. SwiftUI의 기본 `colorScheme` 전달을 사용하며 일반 화면에 Light를 강제하지 않는다. 고정 모드 예시는 `TBColorMode(colorScheme)`, `axis.palette(in: .dark)`, `TBTasteTint.color(main, percent: 80, mode: .dark)`를 사용한다. 사진 화면의 상태표시줄 설정은 기존 표시 의도를 유지한다.
- 카메라·사진·기기 설명 영상·컬러 브랜드 그래픽은 원래 표현을 유지한다. 시작 로고의 단색 글자와 일반 UI 배경·텍스트·버튼·입력·차트는 테마에 맞게 전환한다.

## 시각화와 효과

- 데이터 시각화 9역할: 트랙, 격자, 평균 영역·선, 강조 영역·선, 라벨, 실제 렌더 격자, 중앙 마스크.
- 6미각 각각 측정 10단계, 링·가이드·광원, 별도 라벨색, 레이더 선을 정의한다. Dark 측정 단계는 차콜 50%부터 대표색까지 이어진다. 단계색 자체를 본문 글자색으로 사용하지 않는다.
- 중립 미각은 Light `main #7A7A7A`, `tint/80 #E4E4E4`; Dark `main #A3A3A3`, `tint/80 #2F2F2F`다.
- 그림자·블러 12종은 기존 위치·반경을 유지하고 색상·불투명도를 전환한다. Figma Effect Style은 Semantic 모드에 연결되며 CSS와 Swift에도 같은 정의를 제공한다.
- Figma Semantic COLOR 변수는 총 324개다. 앞선 확장으로 추가·보완한 146역할의 Light / Dark 292값을 코드와 대조했고, 이후 칩 배경·테두리 역할을 분리했다.

## 검증 · 2026-10-07

- 색상·대비 검사 12개, 기존 차트 기하 검사 25개 통과. 타입 검사, 웹 빌드, iOS 시뮬레이터 빌드와 생성본 동기화 검사 통과.
- 웹: 홈·나의 입맛·다이닝·프로필에서 시스템 테마를 바꿔도 선택 탭과 샘플 측정 데이터를 유지했다. 검색 입력도 유지됐다. 시각화 가이드는 320px·1280px에서 양 모드와 미각 선택을 확인했다.
- iOS: iPhone 17 / iOS 26.5 시뮬레이터에서 홈 Light→Dark→Light, 분석 Light→Dark를 재실행 없이 확인했다. 원래 시스템 설정인 Light로 복원했다.
- 로컬 샘플·미리보기 데이터로 확인했다. 실기기, 운영 계정, 전체 네이티브 탐색·시트 흐름을 검증한 것은 아니다. 자세한 결과는 `output/plating/dark-colors-completion-20261007/verification.json`에 기록했다.

### 메뉴 테마 선택 추가

- 웹과 iOS 메뉴에서 앱 정보 카드 아래의 화면 테마 카드를 누르면 바텀시트가 열린다. 시트에 시스템·라이트·다크 선택 버튼을 세로로 배치한다. 선택은 기기에 저장하며 즉시 반영한다.
- 웹 타입 검사와 색상·선택 저장 검사 15개 통과. 실제 브라우저에서 수동 선택 우선 적용, 새로고침 복원, 시스템 변경 추종을 확인했다.
- iOS 시뮬레이터 빌드 통과. 메뉴 버튼으로 모드 전환, 앱 재실행 후 라이트 선택 복원, 시스템 변경 추종을 확인했다. 라이트 시트의 바깥 배경도 밝게 맞춰 상태 표시줄 대비를 유지한다.
- 검증 자료는 `output/plating/menu-theme-20261007/`에 저장한다. 실기기와 운영 계정 검증은 포함하지 않는다.
- 위 검증은 최초 인라인 선택 UI 기준이다. 이후 카드·바텀시트 배치 변경은 요청에 따라 추가 검증하지 않았다.

## 필수 규칙

- 작은 글자 ≥ **4.5:1**, 필수 UI·그래픽 ≥ **3:1**. [WCAG 글자 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- main은 작은 본문에 사용하지 않는다. 미각 배경에는 tintSurfaceText를 사용한다.
- 색과 함께 문구·형태를 제공한다. 투명색은 최종 배경 위에서 확인한다.
- 컴포넌트는 Semantic을 참조한다. 색상 변경은 코드·Figma·문서를 함께 갱신한다.

## 참고

- [전체 값·대비·이전 TB 검토](./color-style-reference.md)
- 원본: `src/constants/designTokens.ts`, `src/constants/colorModes.ts`, `src/styles/design-system.css`, `ios/TasteBuddy/Models/TasteModels.swift`.
- 생성: `node scripts/build-color-modes.mjs` → `src/styles/color-modes.css`와 `TBTheme.swift`의 COLOR MODES 영역. 생성 영역은 직접 수정하지 않는다.
- Figma 변경 이력과 문서용 컴포넌트 원본은 Resource에 보관한다.

## 다크 미각색 정리 · 2026-10-12

라이트처럼 선명한 미각 구분을 위해 여섯 원색을 두 모드에서 공유한다. 카드·칩은 차콜 혼합, 읽기용 글자는 밝은 틴트, 그래프는 별도의 밝기 단계로 연결한다.

| 미각 | Light / Dark main | Dark 카드 위 기본색 대비 |
| --- | --- | --- |
| 단맛 | `#FF9900` | 6.89:1 |
| 신맛 | `#FFD600` | 10.44:1 |
| 쓴맛 | `#95C900` | 7.46:1 |
| 짠맛 | `#7299FF` | 5.42:1 |
| 감칠맛 | `#B372B4` | 4.20:1 |
| 지방맛 | `#95867A` | 4.19:1 |

일반 `tint/{step}` 숫자는 기준색 비율이다. 그래프의 `chart/tint/{step}`은 시각적 강도 역할이며 같은 숫자의 표면 틴트와 구분한다.

| 그래프 역할 | Light | Dark |
| --- | --- | --- |
| chart/tint/80 | tint/80 | tint/20 |
| chart/tint/60 · 단일 영역 | tint/60 | tint/10 |
| chart/tint/40 · 파이·버블 | tint/40 | main |
| chart/tint/20 · 겹침·누적 막대 | tint/20 | main + 흰색 12% |
| chart/main · 최고 강도 | main | main + 흰색 25% |

캡슐 막대는 별도 `chartTrack` 역할로 Light 일반 `tint/80` · Dark 일반 `tint/70`을 사용하고 원형 끝점은 해당 모드의 미각 `main`이다.

다크 라인은 넓은 트랙 tint/70, 얇은 선·작은 점 tint/60 → main, 큰 원형 노드 main이다. 작은 점은 각 점마다 그라데이션을 반복하지 않고 선 전체의 같은 x 좌표 색을 사용한다. 밝은 그래프 안의 글자·아이콘은 `color/chart/on-bright-fill #0F0F0F`를 사용한다. 카드 위 본문용 글자 역할은 별도로 유지한다.

UI의 main·dark·light는 모드를 따라가며, 브랜드 원본과 사진은 원본을 사용한다. 채워진 별은 Light에서 기존 밝은 미각색, Dark에서 새 main을 사용한다. 인사이트 점은 엔진의 색상 역할을 양 모드에서 해석하며 아래 점 링 규칙을 따른다. 공통 tintSurface·tintSoft·chipBackground는 모두 Light 80 / Dark 70이다.

미각 경계 4종은 모두 불투명도 100%다. `cardBorder`·`chipBorder`처럼 컴포넌트 이름으로 분리하지 않는다. 중립색·상태 경계의 사용처와 호환 정책은 [보더 토큰](border-tokens.md)에 정리한다.

다크의 보조 배경 톤은 일반 tint/70으로 통일한다. 캡슐 막대·라인의 넓은 스트로크·같은 미각 비교의 큰 영역과 그 범례는 `chartTrack`을 공유한다. 뉴트럴 비교 캡슐은 `color/chart/comparison-track`으로 Light 기존 회색 18% / Dark 뉴트럴 main #A3A3A3와 기준색 #1C1C1C를 30:70으로 혼합한 불투명 #454545다. 단일 영역·미각 겹침·작은 비교 영역·히트맵의 값별 색 단계는 별도다.

히트맵은 별도 heatmap/0…4 역할로 0·1·2·3·4개 이상을 표시한다. Light는 일반 tint/80·60·40·20·main, Dark는 일반 tint/70·50·30·10·main이다. 미래·미확인 및 월 바깥 칸은 테두리 없이 뉴트럴로 채운다. Light #E4E4E4, Dark는 비교 캡슐과 같은 #454545이며 확인된 0건의 미각색과 구분한다. 셀과 범례는 동일한 단계를 사용한다.

라이트 라인의 시작색은 웹·iOS·Figma 모두 일반 tint/70이다. 파이의 남은 영역과 해당 범례는 전용 color/chart/remainder로 Light #E4E4E4 · Dark #A3A3A3을 사용한다. 히트맵 padding 및 일반 neutral/tint/80과 구분한다.

### 인사이트 점 링 · 2026-10-12

| 역할 | Light | Dark |
| --- | --- | --- |
| 진한 점 | 미각 main | 같은 미각 main |
| 옅은 점 · motion/companion | 일반 tint/60 | 일반 tint/70 |
| 빈 상태의 기본 점 링 | insight-empty #E4E4E4 | insight-empty #343434 |
| 미응답·보류의 중립 점 | insight-placeholder #D0D0D0 | insight-placeholder #A3A3A3 |
| 중앙 수치 | text/primary | text/primary |
| 중앙 제목·단위 | text/body | text/body |
| 상태 설명 | text/hint | text/hint |

경험·감각·취향·맥락·변화 5종에 같은 역할을 적용한다. 취향 링의 장식용 원색 알파 단계도 main / motion/companion으로 연결해 완성 상태의 점은 불투명하다. 진입·선택 해제의 모션 알파는 유지한다. 파이·버블의 영역색, 히트맵의 수치 단계, 밝은 채움 안의 글자 역할은 해당 의미가 있는 곳에만 사용한다. 링의 중앙 글자는 점 안이 아닌 페이지 위이므로 일반 text 역할이다.

웹 `categoryMotionColor`와 생성 Swift `TBTasteMotionColor.hex`는 원본·구버전 엔진 색을 같은 모드별 역할로 해석한다. Figma `taste/{taste}/motion/companion`은 Light `tint/60`·Dark `tint/70`의 별칭이다. 라이트 페이지 `#F3F3F3` 위에서 점이 묻히지 않도록 링만 보정하며, 흰 카드 위의 미니 그래프와 공통 `tintSurface`는 기존 규칙을 유지한다. `color/chart/insight-placeholder`는 Light `#D0D0D0`·Dark `#A3A3A3`이다. 기록이 있는 링의 좌표·개수·반지름·분모·미확인 상태·계정 데이터 경로는 변경하지 않는다.

빈 상태(`noData`)는 각 종류의 기본 배치를 정지된 연한 뉴트럴 점으로 표시한다. 경험·감각·취향은 각 기존 기본 링, 맥락은 기본 3중 링, 변화는 기본 2중 링을 재사용한다. 점은 `data: false`이며 기록·평가·조건 수가 아니다. 중앙 수치는 `—` / `— → —`와 기존 상태 설명을 유지한다. 확인된 0, 부분적으로 확인된 기간, 미응답·보류·오류의 의미는 그대로다.
