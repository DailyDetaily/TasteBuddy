# Taste Buddy Design System Guidelines

현재까지 구현된 화면을 분석해 정리한 운영용 디자인 시스템이다. 새로 리디자인한 문서가 아니라, 이미 앱에 반복해서 등장하는 시각 규칙을 추출해 공통 언어로 정리한 기준서다.

제품 경험 원칙, UX writing 기준, 서비스 루프 관련 내용은 같은 폴더의 `TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`를 따른다. 이 문서는 시각 시스템과 UI 구현 규칙에 집중한다.

## 분석 범위

- `SplashScreen`
- `OnboardingScreen`
- `TeastickConnectScreen`
- `TasteMeasurementScreen`
- `Home`
- `AnalysisPage`
- `ReservationPage`
- `ProfilePage`
- `SectionCard`, `PrimaryButton`, `TopAppBar`, `BottomTabBar`
- `TasteCircularLoop`, `DiningFeedbackFlow`, 차트/그래픽 컴포넌트

## 1. System Principles

### 1-1. Clinical Softness

- 전체 화면은 거의 항상 흰 배경에서 시작한다.
- 정보 구조는 의료/분석 앱처럼 또렷해야 하지만, 표면은 카드 중심의 부드러운 라운드로 감성을 유지한다.

### 1-2. Taste As Accent

- 브랜드의 핵심 시각 언어는 "맛별 색"이다.
- 뉴트럴 UI 위에 필요한 순간만 맛 색상을 올려 의미를 만든다.
- 일반 UI 상태색보다 taste palette가 우선한다.

### 1-3. Rounded Compact Mobile Rhythm

- 모바일 우선 레이아웃이며, 가장 자주 반복되는 값은 `12`, `20`, `24`다.
- 카드와 리스트가 촘촘하지만 답답하지 않게 보여야 하므로, 좁은 화면에서도 여백이 촘촘하게 정렬되어야 한다.

### 1-4. Calm Motion

- 전환은 존재하지만 과시적이지 않다.
- 대부분 `180ms`~`300ms`의 짧은 피드백과 `620ms` 이하의 진입 애니메이션으로 끝난다.
- 예외적으로 taste ring, splash, drawer transform만 조금 더 길게 간다.

## 2. Color

### 2-1. Neutral Foundation

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-bg-page` | `#F3F3F3` | 기본 화면 배경 |
| `--tb-color-surface-base` | `#FFFFFF` | 상단 바, 드로어 내부, 이미지 프레임 기본면 |
| `--tb-color-surface-card` | `#FFFFFF` | 기본 카드 면 |
| `--tb-color-surface-card-hover` | `#FAFAFA` | 인터랙티브 카드 hover |
| `--tb-color-surface-muted` | `#F7F7F7` | 체크리스트, 보조 블록 |
| `--tb-color-surface-elevated` | `#FCFCFC` | 현재 단계 강조면 |
| `--tb-color-surface-disabled` | `#EFEFEF` | disabled 버튼 |
| `--tb-color-text-primary` | `#0F0F0F` | 메인 제목, 주 액션 |
| `--tb-color-text-secondary` | `#3F3F3F` | 보조 제목, 아이콘 기본 |
| `--tb-color-text-tertiary` | `#535353` | 배지, 보조 라벨 |
| `--tb-color-text-body` | `#666666` | 본문 설명 |
| `--tb-color-text-hint` | `#888888` | chart label, 보조 안내 |
| `--tb-color-text-disabled` | `#AFAFAF` | 비활성 텍스트 |
| `--tb-color-border-card` | `#F0F0F0` | 이미지/사진 카드 프레임 |
| `--tb-color-border-subtle` | `#E8E8E8` | progress track, chart grid |
| `--tb-color-border-default` | `#E7E7E7` | 탭 바 상단 경계 |
| `--tb-color-border-strong` | `#E5E5E5` | active step, drawer handle |

### 2-2. State Semantics

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-success` | `#2F8F5B` | 준비 완료, 긍정 상태 텍스트/아이콘 |
| `--tb-color-success-soft` | `#E6F4EC` | success chip / subtle success background |
| `--tb-color-warning` | `#A8661A` | 진행 중, 주의가 필요한 상태 텍스트/아이콘 |
| `--tb-color-warning-soft` | `#FFF1DE` | warning chip / subtle warning background |

### 2-3. Taste Palette

| Taste | Main | Dark | Light | Background | Gradient |
| --- | --- | --- | --- | --- | --- |
| Sweet | `#FF9900` | `#CC7A00` | `#FFCC80` | `#FFD699` | `linear-gradient(135deg, #FF9900, #FFB84D)` |
| Sour | `#FBC02D` | `#C99A00` | `#FDD835` | `#FFEF99` | `linear-gradient(135deg, #FBC02D, #FFD54F)` |
| Bitter | `#95C900` | `#6E9600` | `#E6EE9C` | `#E0EBB4` | `linear-gradient(135deg, #95C900, #AED581)` |
| Salty | `#7299FF` | `#4A70CC` | `#90CAF9` | `#C6D6FF` | `linear-gradient(135deg, #7299FF, #9FBFFF)` |
| Umami | `#B372B4` | `#8A5490` | `#CE93D8` | `#E1C7E1` | `linear-gradient(135deg, #B372B4, #CE93D8)` |
| Fat | `#95867A` | `#6B5E54` | `#BCAAA4` | `#D5CFCA` | `linear-gradient(135deg, #95867A, #B0A49A)` |

### 2-4. Color Usage Rules

- 대부분의 화면은 `white -> light gray card -> taste accent` 순서로 계층을 만든다.
- taste color는 제목 전체보다 값, 그래프, 변화량, 상태 포인트에 쓰는 것이 기본이다.
- 본문 문단을 taste color로 길게 쓰지 않는다.
- **포인트 카드(Point Card) 예외 규칙**: 특정 미각 요소(예: 셰프 매칭, 세부 분석 정사각형 메뉴 등)를 강조해야 하는 소형 카드 그룹의 경우, 각 미각의 `Background` 컬러를 전체 카드 배경으로 허용한다. 이때 내부 텍스트 및 레이아웃은 임상적 감성을 해치지 않게 여백을 유지한다.
- 맛 배경색 위 텍스트는 가능한 한 해당 taste의 dark tone을 먼저 쓰고, 대비가 부족하면 `#0F0F0F`로 내린다.
- 차트와 링에서는 맛의 정체성을 유지하되, 격자와 기준선은 반드시 뉴트럴 그레이로 남긴다.
- success / warning은 상태 chip, 진행 상태, 짧은 피드백에만 제한적으로 쓴다.
- 상태색을 새로 만들기 전에는 neutral scale, success, warning, taste palette 순서로 먼저 검토한다.

## 3. Color Tokens

### 3-1. Token Naming

- 페이지/표면: `--tb-color-bg-*`, `--tb-color-surface-*`
- 텍스트: `--tb-color-text-*`
- 경계: `--tb-color-border-*`
- 아이콘: `--tb-color-icon-*`
- 상태: `--tb-color-success*`, `--tb-color-warning*`
- 맛별 토큰: `--tb-taste-{taste}-{role}`
- 코드 레이어에서는 `COLOR_TOKENS`, `TASTE_TOKENS`, `TASTE_COLORS`를 source of truth로 사용한다.

### 3-2. Token Structure Rule

- UI 공통값은 semantic token으로 정의한다.
- 맛 색은 semantic token이 아니라 product domain token이다.
- 새 상태색을 만들기 전에 기존 neutral scale 또는 taste palette에서 해결 가능한지 먼저 본다.

## 4. Type Scale

Pretendard를 전 화면 기본 서체로 사용한다. 헤드라인은 촘촘하고 강하게, 본문은 짧고 안정적으로 간다.

| Token | Value | Primary Role |
| --- | --- | --- |
| `--tb-font-size-10` | `10px` | 탭 라벨, status chip, 보조 수치 |
| `--tb-font-size-11` | `11px` | 메타 정보, 날짜, 서브타이틀 |
| `--tb-font-size-12` | `12px` | 배지, helper, small value |
| `--tb-font-size-13` | `13px` | 카드 본문, 리스트 상세 |
| `--tb-font-size-14` | `14px` | 기본 버튼, row label |
| `--tb-font-size-15` | `15px` | 강조형 small heading |
| `--tb-font-size-16` | `16px` | section title md |
| `--tb-font-size-18` | `18px` | section title lg, detail header |
| `--tb-font-size-20` | `20px` | profile name, 핵심 headline |
| `--tb-font-size-22` | `22px` | onboarding / drawer title |
| `--tb-font-size-24` | `24px` | page hero title |
| `--tb-font-size-28` | `28px` | completion / success headline |

### Typography Rules

- `700`: 페이지 헤드라인, 카드 핵심 수치
- `600`: 섹션 타이틀, 선택 상태 라벨
- `500`: 버튼, 보조 인터랙션
- `400`: 본문, 메타
- 타이틀은 `tight` 또는 `snug`, 설명문은 `normal` 또는 `relaxed`
- 한 화면 안에서 헤드라인 단계는 2개를 넘기지 않는다

## 5. Spacing

| Token | Value | Role |
| --- | --- | --- |
| `--tb-space-2` | `2px` | micro gap |
| `--tb-space-4` | `4px` | 작은 라벨 보정 |
| `--tb-space-6` | `6px` | indicator / tab label gap |
| `--tb-space-8` | `8px` | chip / icon gap |
| `--tb-space-10` | `10px` | compact inset |
| `--tb-space-12` | `12px` | 카드 내부 기본 여백 |
| `--tb-space-16` | `16px` | 중간 간격, 버튼 좌우 패딩 |
| `--tb-space-20` | `20px` | 페이지 좌우 gutter |
| `--tb-space-24` | `24px` | 큰 section 사이 간격 |
| `--tb-space-40` | `40px` | 강한 분리, sheet/dramatic offset |

### Spacing Rules

- 기본 페이지 gutter는 `20px`
- 카드 내부는 `12px`
- 큰 section rhythm은 `24px` 또는 `32px`
- 화면 하단 sticky action 구역은 최소 `140px` fade 영역을 확보한다

## 6. Radius

| Token | Value | Role |
| --- | --- | --- |
| `--tb-radius-6` | `6px` | outline badge |
| `--tb-radius-8` | `8px` | 소형 썸네일 |
| `--tb-radius-10` | `10px` | primary button, 작은 stat tile |
| `--tb-radius-12` | `12px` | 카드 안쪽 흰색 strip |
| `--tb-radius-14` | `14px` | 큰 썸네일 |
| `--tb-radius-20` | `20px` | 기본 카드 shell |
| `--tb-radius-24` | `24px` | drawer, media frame |
| `--tb-radius-full` | `9999px` | pill, avatar, indicator |

### Radius Rules

- 제품의 대표 라운드는 `20px`
- `24px`는 sheet, 비주얼 프레임, immersive media에만 쓴다
- `full`은 탭 indicator처럼 길쭉한 오브젝트에도 허용한다

## 7. Shadows

| Token | Value | Role |
| --- | --- | --- |
| `--tb-shadow-hover` | `0 1px 3px rgba(15, 15, 15, 0.06)` | 카드 hover |
| `--tb-shadow-soft` | `0 4px 20px rgba(0, 0, 0, 0.1)` | 일반 부유감 |
| `--tb-shadow-button` | `0 8px 20px rgba(0, 0, 0, 0.1)` | 주요 버튼 |
| `--tb-shadow-drawer` | `0 20px 60px rgba(0, 0, 0, 0.24)` | large drawer / background card transform |

### Shadow Rules

- 이 제품은 shadow보다 tone contrast를 먼저 사용한다
- shadow는 깊이를 만드는 보조 수단이며, 카드 기본 상태에는 거의 드러나지 않는다
- 검은 배경 위 드로어/변형 카드에만 강한 그림자를 허용한다

## 8. Motion

### Motion Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--tb-motion-duration-fast` | `180ms` | press, hover, color change |
| `--tb-motion-duration-normal` | `300ms` | card transition, indicator |
| `--tb-motion-duration-medium` | `500ms` | screen tint/background change |
| `--tb-motion-duration-slow` | `620ms` | drawer-linked transform |
| `--tb-motion-duration-slowest` | `720ms` | radius-heavy transform |
| `--tb-motion-duration-loop-pulse` | `1600ms` | taste ring pulse |
| `--tb-motion-duration-splash` | `2500ms` | splash symbol reveal |

### Easing Rules

- 기본 전환은 `ease`
- 진입/확장형 전환은 `cubic-bezier(0.22, 1, 0.36, 1)`
- 화면 전환의 이동량은 보통 `8px`, `12px`, `20px` 중 하나를 쓴다
- user control이 있는 흐름은 과한 bounce를 넣지 않는다

### Motion Behavior Rules

- 버튼 active scale은 `0.98`을 넘기지 않는다
- 탭/아이콘 hover 확대는 `1.05`, active는 `1.1` 정도가 상한이다
- ring pulse만 예외적으로 더 오래 간다
- 여러 애니메이션이 겹칠 때는 opacity + translate 조합을 우선하고 rotate는 제한적으로 사용한다

## 9. Component Rules

### 9-1. App Shell

- 전체 앱은 `max-width: 1440px`
- 내부 경험은 모바일 우선이지만 데스크톱에서도 가운데 정렬된 single-column shell을 유지한다

### 9-2. Top App Bar

- 높이 `56px`
- 좌우 여백 `20px`
- `bg-page` 반투명(약 85 %) + `backdrop-blur-md` glassmorphism 유지
- 좌측은 profile avatar 또는 back affordance, 우측은 24px line icon 2~3개

### 9-3. Bottom Tab Bar

- `bg-page` 반투명(약 85 %) + `backdrop-blur-md` glassmorphism + subtle top border
- 아이콘 크기 `24px`, 라벨 `10px`
- inactive는 muted gray, active는 black
- 하단 home indicator는 항상 black pill

### 9-4. Cards

- 기본 shell은 `SectionCard`
- 배경 `#F3F3F3`, radius `20px`, padding/gap `12px`
- 카드 안의 secondary strip은 white + `12px` radius
- 클릭 가능한 카드만 hover tone change를 가진다

### 9-5. Buttons

- primary button은 black fill + white text + `48px` height + `10px` radius
- compact button은 `40px` 이상 높이 유지
- disabled는 surface gray로 낮추고 shadow를 제거한다

### 9-6. Chips And Badges

- `OutlineBadge`: 12px, 6px radius, thin border
- `StatusChip`: 홈 탭 `TCS` 배지를 기준으로 한다
- 홈 탭 `TCS` 배지는 단순 색 나열이 아니라, `adjustments.change` 절대값 비율만큼 각 미각 컬러 구간이 달라지는 weighted gradient를 사용한다
- 홈 탭 `TCS` 배지 gradient는 각 taste `light` palette에 `white 25% mix`를 적용한 더 옅은 컬러를 사용한다
- 홈 탭 `TCS` 배지 gradient 경계는 끊기지 않도록 넓은 transition 구간으로 자연스럽게 연결한다
- `StatusChip` spec: `10px` bold text, `6px` radius, `6px / 2px` padding, relative positioning
- `StatusChip` shadow: `0 2px 8px rgba(0,0,0,0.1)`, `0 1px 2px rgba(0,0,0,0.1)`, `inset 0 1px 0 rgba(255,255,255,0.3)`
- `StatusChip`은 상태 의미에 따라 background fill과 text color만 바꾸고, 크기와 타이포그래피는 유지한다
- `TasteChip`: 각 미각 메인 컬러의 `5% tint` 배경과 `18% tint` 외곽선을 사용하고, 내부에는 taste label + colorized value를 넣는다

### 9-7. Section Title

- 화면 내 반복 heading은 반드시 `SectionTitle`로 통일
- `md`는 16px, `lg`는 18px
- 새로운 title 스타일을 만들기 전에 existing size class로 해결한다

### 9-8. Sticky Bottom CTA

- 스크롤 콘텐츠 위에 gradient fade를 두고 버튼을 안착시킨다
- fade 영역은 정보의 끝이 아니라 action zone임을 알려주는 장치다

## 10. Icon Rules

### 10-1. Icon Language

- 주 라이브러리는 `@fluentui/react-icons`와 `lucide-react`
- 같은 행 안에서 다른 계열을 섞더라도 stroke 느낌은 최대한 맞춘다

### 10-2. Size Rules

- metadata/icon inline: `12`~`14`
- list/action secondary: `16`~`18`
- nav/action primary: `24`
- hero/back close affordance: `28`

### 10-3. Stroke Rules

- thin: `1.5`
- regular: `1.8`
- medium: `2`
- strong emphasis: `2.2`
- check/completion: `3`

### 10-4. Usage Rules

- 아이콘 단독보다 텍스트와 짝지어 의미를 보완한다
- 색상은 기본적으로 `text-secondary` 또는 `icon-muted`
- taste 의미를 전달해야 할 때만 taste color를 적용한다
- 아이콘 컨테이너는 `32`, `40`, `48` 정사각 라운드 박스를 기본으로 사용한다

## 11. Illustration Style

- onboarding과 device flow는 "백색 배경 위 제품/데이터 시연" 방식이 핵심이다
- 비주얼은 강한 장식보다 실제 제품 이미지, 짧은 루프 비디오, 간단한 브랜드 그래픽이 중심이다
- 프레임은 대부분 라운드 rectangle 또는 무배경 isolate 처리
- 그림자와 배경색은 매우 약하게 쓰고, 콘텐츠 자체가 주인공이 되게 한다
- 새 일러스트를 추가할 때도 복잡한 scene보다 single object, single concept 구성이 맞다

## 12. Chart And Ring Visualization Rules

### 12-1. Shared Rules

- 데이터 시각화의 바닥은 neutral gray, 의미 레이어는 taste color
- 축, grid, baseline은 조용해야 하고 데이터 포인트만 눈에 띄어야 한다
- 장식보다 읽기 쉬운 간격과 라벨 정렬이 우선이다

### 12-2. Progress Bars

- 높이 `8px`
- track는 `#E8E8E8`
- fill은 taste별 main color
- 값 숫자는 바 우측 정렬 + 해당 taste 색으로 표시

### 12-3. Radar Chart

- 6축 고정 hexagon 구조를 사용한다
- grid는 `#E8E8E8`
- 평균 면은 반투명 gray fill + gray stroke
- 사용자 면은 Sweet orange 기반 highlight fill/stroke를 사용하고, 외곽 taste dot만 각 taste color를 쓴다
- 맛 라벨은 회색 `9px`로 가볍게 유지한다

### 12-4. Weekly Trend Chart

- 선 굵기 `1px`
- dot `4px`, active dot `5px`
- 라인 컬러는 taste palette를 그대로 사용한다
- 복수 라인이 겹칠 수 있으므로 grid와 tooltip은 최대한 중립적으로 유지한다

### 12-5. Circular Taste Ring

- 최대 크기 `320px`
- outer ring thickness `24px`
- node radius `12px`
- step count `10`
- 각 taste는 전용 gradient base, guide dot color, 10단계 node scale을 가진다
- active node만 pulse와 glow를 가진다
- ring geometry는 바꾸지 않고 색상만 바꾸는 것이 원칙이다

## 13. Accessibility And Quality Guardrails

- tint background 위 taste-colored text는 최소 `3:1` 대비를 맞춘다
- 본문 설명은 `#666666` 전후 범위를 유지해 눈부심을 줄인다
- 정보 density가 높아질수록 border보다 spacing으로 구분한다
- 한 카드 안에 taste accent는 1개, 많아도 2개 레이어를 넘기지 않는다

## 14. Source Of Truth

코드 기준 소스는 아래를 따른다.

- `src/constants/designTokens.ts`
- `src/styles/design-system.css`
- `src/constants/tasteColors.ts`
- `src/components/system/*`
- `src/components/graphics/*`

새 화면을 만들 때는 먼저 기존 token과 component 규칙 안에서 해결하고, 반복이 2회 이상 확인될 때만 새 토큰을 추가한다.
