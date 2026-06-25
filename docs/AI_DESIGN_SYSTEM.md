# AI Design System Guide

이 문서는 다른 AI 에이전트와 새 기여자가 Taste Buddy의 디자인 시스템을 가장 빠르게 파악하기 위한 진입 문서다.

긴 문서 전체를 바로 읽기 전에, 이 파일로 먼저 "무엇이 진짜 기준인지", "무슨 용어를 써야 하는지", "어떤 조합을 반복해야 하는지"를 잡는다.

## Read Order

1. 제품 경험 기준: [`../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
2. 시각 시스템 설명: [`../DESIGN.md`](../DESIGN.md)
3. 타입 기반 토큰 원본: [`../src/constants/designTokens.ts`](../src/constants/designTokens.ts)
4. CSS 변수 미러: [`../src/styles/design-system.css`](../src/styles/design-system.css)
5. 프리뷰 인벤토리와 상태: [`../src/components/design-system/inventory.ts`](../src/components/design-system/inventory.ts)
6. 컴포넌트 스타일 스냅샷: [`../src/components/design-system/componentStyleSpecs.ts`](../src/components/design-system/componentStyleSpecs.ts)

## Fast Mental Model

Taste Buddy는 일반 예약 앱이 아니라, 미각 데이터를 해석해서 셰프가 실제로 활용할 수 있게 번역하는 제품이다.

디자인 시스템은 아래 세 층으로 읽는다.

1. Neutral system: 전체 구조, 대부분의 surface, 기본 텍스트
2. Taste palette: 제품 의미를 만드는 도메인 컬러
3. Warm hospitality layer: care, anticipation, premium tone이 필요한 순간의 보조 감정 레이어

핵심 원칙:

- 기본 UI는 neutral에서 시작한다.
- taste color는 장식이 아니라 의미일 때만 사용한다.
- 큰 텍스트보다 대비, 여백, 그룹핑으로 위계를 만든다.
- 모바일이 기본 조형 모델이다.

## Source Of Truth

파일 우선순위는 아래 순서를 따른다.

1. 제품 방향: [`../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
2. 시각 규칙과 해석: [`../DESIGN.md`](../DESIGN.md)
3. 실제 토큰 값: [`../src/constants/designTokens.ts`](../src/constants/designTokens.ts), [`../src/styles/design-system.css`](../src/styles/design-system.css)
4. 프리뷰 인벤토리와 감사 메모: [`../src/components/design-system/inventory.ts`](../src/components/design-system/inventory.ts)

토큰 값을 바꿀 때 `DESIGN.md`만 바꾸면 안 되고, 구현 토큰도 함께 바꿔야 한다.

## Vocabulary

같은 의미를 여러 이름으로 부르지 않는다. 아래 용어를 우선 사용한다.

| 용어 | 의미 | 비고 |
| --- | --- | --- |
| `bg` | 더 강한 taste fill | stat, highlight, 보정 강조 블록 |
| `tintSoft` | 부드러운 inline taste tint 배경 | `TasteChip`, `기준점/절대 좌표` 메타 칩 |
| `tintSoftBorder` | `tintSoft` 위 경계선 | soft inline chip / meta chip border |
| `tintSurface` | 부드러운 taste 카드 배경 | `셰프 매칭`, `세부 분석` 같은 해석형 카드 |
| `tintSurfaceText` | `tintSurface` 위의 메인 텍스트 색 | 카드 타이틀, 강조 라벨 |
| `tintSurfaceSubText` | `tintSurface` 위의 보조 텍스트 색 | 레스토랑명, 설명 보조선 |
| `main` | taste의 대표 시그널 컬러 | 값, 노드, chip, chart signal |
| `gradient` | taste 기반 그라디언트 | 주로 배지나 강조 패턴 |

중요:

- `ringBaseColor`는 측정 루프 그래픽 구현 토큰이다.
- 카드 배경 의미로는 `tintSurface`를 우선 사용한다.
- 작은 pill / 메타 칩 배경은 `tintSoft`와 `tintSoftBorder`를 우선 사용한다.
- "같은 값이지만 다른 역할"이 생기면 의미 토큰을 먼저 보고, 그래픽 구현 토큰은 필요할 때만 본다.

## Core Tokens

### Layout

- page gutter: `20px`
- section gap: `20px`
- card stack gap: `12px`
- primary button height: `48px`
- top app bar height: `56px`
- bottom tab bar min-height: `60px`
- screen max width: `1440px`
- reusable box sizes: `sm 32px`, `md 40px`, `lg 48px`

### Radius

- badge / small chip: `6px`
- icon / symbol box: `8px`
- control: `10px`
- inset support block: `12px` to `14px`
- primary card shell: `20px`
- pill: `9999px`

### Typography

- font family: `Pretendard`
- maximum product font size: `18px`
- display / heading / title token ceiling: `18px`
- body: `14px`
- caption: `12px`
- micro: `10px` to `11px`

### Core Surfaces

- page background: `#F3F3F3`
- focus background: `#FFFFFF`
- base surface: `#FFFFFF`
- card surface: `#FFFFFF`
- muted surface: `#F7F7F7`
- elevated surface: `#FCFCFC`
- overlay surface: `rgba(255, 255, 255, 0.8)`

## Taste Palette

이 시스템에서 taste 컬러는 도메인 언어다. 아래 값은 자주 쓰는 최소 세트다.

| Taste | Main | BG | Tint Surface | Tint Surface Text | Tint Surface Sub Text |
| --- | --- | --- | --- | --- | --- |
| Sweet / 단맛 | `#FF9900` | `#FFD699` | `#FFEBCC` | `#6F4609` | `#896735` |
| Sour / 신맛 | `#FBC02D` | `#FFEF99` | `#FFF7CC` | `#6F5F09` | `#897C35` |
| Bitter / 쓴맛 | `#95C900` | `#E0EBB4` | `#EAF4CC` | `#505B24` | `#70794B` |
| Salty / 짠맛 | `#7299FF` | `#C6D6FF` | `#E3EBFF` | `#36466F` | `#5A6789` |
| Umami / 감칠맛 | `#B372B4` | `#E1C7E1` | `#F0E3F0` | `#513751` | `#705B70` |
| Fat / 지방맛 | `#95867A` | `#D5CFCA` | `#EAE7E4` | `#453F3A` | `#66625D` |

## Reusable Recipes

아래 조합은 다른 AI가 새 화면을 만들 때 바로 재사용할 수 있는 대표 레시피다.

### Chef Matching Card

소스: [`../src/components/home/ChefMatchCard.tsx`](../src/components/home/ChefMatchCard.tsx)

- card bg: `getTasteTintSurface(taste)`
- border: `getTasteTint(taste, 0.18)`
- title / match text: `getTasteTintSurfaceText(taste)`
- meta text: `getTasteTintSurfaceSubText(taste)`
- shell: `132 x 132`, radius `20px`, padding `12px`
- image: `ImageBox` `lg`, fallback icon `xl`

### Detail Analysis Card

소스: [`../src/pages/AnalysisPage.tsx`](../src/pages/AnalysisPage.tsx)

- card bg: `getTasteTintSurface(taste)`
- border: `getTasteTint(taste, 0.18)`
- title: `--tb-taste-{tasteId}-tint-surface-text`
- summary: `--tb-taste-{tasteId}-tint-surface-sub-text`
- shell: `132 x 132`, radius `20px`, padding `12px`

### Chip

소스: [`../src/components/system/Chip.tsx`](../src/components/system/Chip.tsx)

- intent: non-taste general label chip
- size set: `xs`, `sm`, `md`
- size recipe:
  xs = `10px` text, `12px` icon, `px 8 / py 4 / gap 4`
  sm = `11px` text, `12px` icon, `px 10 / py 6 / gap 6`
  md = `12px` text, `14px` icon, `px 12 / py 8 / gap 8`
- variant set: `soft`, `outline`, `solid`, `text`
- tone set: `neutral`, `success`, `warning`, `accent`
- neutral soft: `surface-muted + border-default + text-muted`
- icon support: `leadingIcon`, `trailingIcon`
- background token override: `backgroundColorToken`
- composition: `asChild` for anchor / button / span reuse

### TasteChip

소스: [`../src/components/system/TasteChip.tsx`](../src/components/system/TasteChip.tsx)

- border: `taste.palette.tintSoftBorder`
- background: `taste.palette.tintSoft`
- label color: neutral primary
- value color: `getTasteColor(taste)`
- shape: full pill
- neutral meta: use `tone="neutral"` for non-taste labels such as `첫 측정` or `4회 예약`; it uses `surface-muted / border-strong / text-tertiary`

### SectionCard

소스: [`../src/components/SectionCard.tsx`](../src/components/SectionCard.tsx)

- background: `surface-card`
- radius: `20px`
- body padding: `12px`
- hover: `translateY(-4px)` with stronger shadow

### ImageBox

소스: [`../src/components/system/ImageBox.tsx`](../src/components/system/ImageBox.tsx)

- intent: chef, restaurant, menu 등 작은 사진 컨테이너
- size set: `sm 32px`, `md 40px`, `lg 48px`
- radius: `8px`
- image state: `object-cover`
- empty state: `person`, `chef`, `restaurant`, `menu`, `generic` fallback icon

### TopAppBar / Overlay

소스: [`../src/components/TopAppBar.tsx`](../src/components/TopAppBar.tsx), [`../src/components/NotificationPanel.tsx`](../src/components/NotificationPanel.tsx)

- default surface: `bg-page` with soft transparency and blur
- solid surface: match the owning content background (`bg-page` or `bg-focus`)
- keep structure simple; do not turn overlays into dashboards

## Hard Rules

- 제품 UI 텍스트는 `18px`를 넘기지 않는다.
- 긴 본문을 taste color로 세팅하지 않는다.
- 한 블록에 여섯 taste를 동시에 강하게 전개하지 않는다.
- default UI state는 neutral, success, warning에서 시작하고, destructive는 위험 액션에만 제한한다.
- taste는 의미가 핵심일 때만 전면에 올린다.
- 새로운 재사용 패턴이면 `/design-system` 프리뷰에 반영한다.

## Anti-Patterns

- generic 예약 앱처럼 보이는 넓은 카드 나열
- 실험실 UI처럼 보이는 과도한 측정 강조
- purple startup gradient
- giant display typography
- decorative chart only, no interpretation text
- `tintSurface` 대신 구현 디테일 토큰만 직접 참조하는 카드 작성

## Update Checklist

토큰이나 공용 규칙을 수정할 때는 아래를 같이 본다.

1. [`../DESIGN.md`](../DESIGN.md)
2. [`../src/constants/designTokens.ts`](../src/constants/designTokens.ts)
3. [`../src/styles/design-system.css`](../src/styles/design-system.css)
4. [`../src/components/design-system/inventory.ts`](../src/components/design-system/inventory.ts)
5. 필요하면 [`../src/components/design-system/componentStyleSpecs.ts`](../src/components/design-system/componentStyleSpecs.ts)

## Machine-Readable Snapshot

구조화된 버전은 [`./design-system.snapshot.json`](./design-system.snapshot.json)에 있다.
