# Taste Buddy Design System

## 문서 목적

이 문서는 Taste Buddy의 현재 시각 시스템을 한곳에서 읽을 수 있게 정리한 운영 문서다.

- 제품 경험의 상위 기준은 `src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`
- 현재 시각 시스템의 설명 기준은 이 `DESIGN.md`
- 실제 구현 토큰의 원본은 `src/styles/design-system.css` 와 `src/constants/designTokens.ts`
- `/design-system` 과 `/design-system-updates` 프리뷰는 이 문서가 코드에 반영된 현재 상태를 검증하는 화면

이 문서의 역할은 두 가지다.

1. Taste Buddy가 어떤 미감과 제품 톤을 유지해야 하는지 설명한다.
2. 현재 프리뷰에 정리된 토큰, 컴포넌트, 규칙, 불일치 항목을 다시 문서화한다.

---

## 제품 컨텍스트

### What This Product Is

Taste Buddy는 일반적인 예약 앱이 아니다.

이 제품의 핵심은 사용자의 미각 프로필을 해석해서 셰프가 실제로 활용할 수 있는 형태로 번역하는 것이다.

이 제품은 다음의 서비스 루프를 전제로 한다.

1. Quick Taste Calibration
2. Taste Profile Creation
3. Reservation Personalization
4. Chef Calibration Guidance
5. Dining Experience
6. Post-Dining Feedback
7. Profile Refinement
8. Optional Precision Calibration

### What This Product Is Not

- 의료 진단 도구가 아니다.
- 실험실 장비 UI처럼 보이면 안 된다.
- 일반적인 레스토랑 피드나 소셜 앱처럼 보이면 안 된다.
- "재미있는 맛 테스트" 같은 가벼운 퀴즈 톤이면 안 된다.

### 현재 제품 포지셔닝

Taste Buddy는 프리미엄 다이닝 개인화 서비스다.

사용자에게는 "내 입맛이 이해되고 있다"는 감각을 주고, 셰프에게는 "이 손님에게 어떤 식으로 경험을 전달해야 하는지"를 더 정확하게 읽게 해줘야 한다.

그래서 UI는 세 가지를 동시에 만족해야 한다.

- 프리미엄 다이닝 서비스처럼 차분하고 정제되어야 한다.
- 해석 도구처럼 명확해야 한다.
- 학습 시스템처럼 점진적인 진화를 보여줘야 한다.

---

## 디자인 방향

### Direction Name

Quiet Hospitality Intelligence

### 핵심 인상

- 차분하다
- 프리미엄이다
- 읽기 쉽다
- 과장하지 않는다
- 해석 중심이다

### Safe Choices

- 밝고 공기감 있는 중립 배경을 유지한다.
- 모바일 우선 레이아웃을 유지한다.
- 예약, 프로필, 피드백 흐름에서 명확한 CTA와 카드 구조를 유지한다.
- Pretendard 단일 폰트 체계를 유지한다.

### Deliberate Risks

- 맛 컬러를 단순 장식이 아니라 제품 의미 체계로 사용한다.
- 일반 예약 앱보다 더 절제된 타이포 ceiling을 둔다. 제품 전체에서 `18px`를 넘기지 않는다.
- 화려한 브랜드 컬러 대신 중립 구조 위에 미각 컬러와 hospitality warmth를 선택적으로 얹는다.

### Hard Rules

- 제품 UI의 텍스트는 `18px`를 넘기지 않는다.
- Pretendard 단일 폰트 체계를 유지한다.
- 모바일이 기본 조형 모델이다. 큰 화면에서는 넓히는 대신 stage에 올린다.
- 맛 컬러는 의미용이다. 장식용으로 남발하지 않는다.
- 데이터 시각화는 해석을 돕기 위한 것이어야지, 보기 좋은 배경 장식이어서는 안 된다.
- 여백, 대비, 그룹핑으로 위계를 만든다. 큰 제목으로 위계를 해결하려고 하지 않는다.

---

## 프리뷰 기준 화면

현재 디자인 시스템 문서화의 기준은 아래 프리뷰다.

- 앱 쉘: `http://localhost:3001/`
- 디자인 시스템: `http://localhost:3001/design-system`
- 업데이트 프리뷰: `http://localhost:3001/design-system-updates`

실행 명령:

- `npm run dev`
- `npm run dev:design-system`
- `npm run dev:design-system-updates`

보조 스크립트:

- `scripts/open-design-system.mjs`

### 프리뷰 섹션 구조

`src/pages/DesignSystemPage.tsx` 의 내비게이션 섹션 순서를 기준으로 문서도 같은 구조를 따른다.

1. Audit
2. Colors
3. Typography
4. Spacing
5. Shadows
6. Icons
7. Buttons
8. Chips & Badges
9. Fields
10. Cards
11. Navigation
12. Feedback
13. Overlay
14. App Specific
15. Component Specs
16. Audit Notes

### 현재 감사 요약

`src/components/design-system/inventory.ts` 의 `AUDIT_SUMMARY` 기준:

| 항목 | 현재 값 |
| --- | --- |
| Currently used component count | `19` |
| Defined primitive count | `20` |
| Shared motion duration | `300ms` |
| Screen max width | `1440px` |
| Shared button height | `48px` |

---

## Source Of Truth Map

| 파일 | 역할 |
| --- | --- |
| `src/index.css` | Tailwind, globals, 앱 토큰 시트를 한곳에서 불러오는 전역 진입점 |
| `src/styles/design-system.css` | 실제 앱 shell과 컴포넌트가 참조하는 `tb-*` 토큰과 공용 클래스 |
| `src/constants/designTokens.ts` | CSS 변수를 TS 객체로 미러링한 타입 기반 토큰 |
| `src/styles/globals.css` | shadcn 계열 generic semantic theme와 일부 dark mode 토큰 |
| `src/components/design-system/inventory.ts` | 프리뷰에서 쓰는 인벤토리, 감사 요약, 불일치, TODO, 소스 맵 |
| `src/components/design-system/componentStyleSpecs.ts` | 컴포넌트별 스타일값 스냅샷과 프롬프트 템플릿 |
| `src/lib/designTokenRuntime.ts` | 프리뷰에서 로컬 runtime override를 적용하는 편집 레이어 |
| `DESIGN.md` | 제품 관점의 시각 규칙과 현재 시스템 정리 문서 |

### 소스 우선순위

1. 제품 성격과 방향은 `src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`
2. 현재 시각 규칙과 시스템 해석은 `DESIGN.md`
3. 실제 토큰 값은 `src/styles/design-system.css` 와 `src/constants/designTokens.ts`
4. 현재 컴포넌트 상태와 감사 노트는 `src/components/design-system/inventory.ts`

---

## 셸 시스템

### Tab Shell

대상: `Home`, `Analysis`, `Reservation`, `Profile`

- 배경은 `#F3F3F3`
- 핵심 콘텐츠는 흰 카드 위에 얹는다
- 큰 화면에서도 카드와 레일 구조를 유지한다
- 그냥 전체 폭을 늘리지 않는다

### Flow Shell

대상: 온보딩, calibration, connect, measurement

- 흰 stage
- 읽기 쉬운 단일 컬럼
- 설명, 증거, CTA 순서가 분명해야 한다

### Conversion Shell

대상: improve accuracy, confirmation, upsell

- 강한 약속 블록 하나
- proof stack 하나
- 강한 액션 하나

### Drawer / Overlay Shell

대상: 메뉴, 알림, 분기형 보조 작업

- 반투명 흰 서피스
- blur 사용 가능
- 내부는 대시보드처럼 복잡해지지 않게 유지

---

## 제품 패턴

이 패턴들은 Taste Buddy가 generic 예약 앱처럼 보이지 않게 만드는 핵심 구조다.

### 1. Explainable Personalization

모든 주요 추천이나 결과 카드는 아래를 설명해야 한다.

- what we know
- what it means
- what happens next

### 2. Confidence Visibility

프로필은 완성 / 미완성이 아니라 점진적 정교화로 보여야 한다.

권장 상태 언어:

- Starter
- Building
- Refined

### 3. Chef Translation

Taste Buddy만의 고유 패턴이다.

미각 데이터를 그대로 보여주는 대신 아래 구조로 번역해야 한다.

- likely sensitivity
- dining implication
- chef-usable hint

### 4. Empty State With Momentum

빈 화면은 "아직 없음"으로 끝나면 안 된다.

- 이 화면이 앞으로 무엇이 될지
- 사용자가 왜 여기에 다시 오게 될지
- 지금 할 수 있는 다음 액션 하나

### 5. Post-Dining Learning Loop

피드백은 설문 제출처럼 보여서는 안 된다.

다음 식사를 더 잘 맞추기 위한 투자처럼 보여야 한다.

---

## 색상 시스템

### 색상 구조 원칙

Taste Buddy의 색상은 세 층으로 읽혀야 한다.

1. neutral system
2. taste palette
3. warm hospitality layer

중립 레이어가 구조를 만들고, 맛 컬러가 의미를 만들고, warmth는 care와 anticipation이 필요한 순간에만 감정을 보완한다.

### Background & Surface

| Token | Value | 역할 |
| --- | --- | --- |
| `--tb-color-bg-page` | `#F3F3F3` | 앱 전체 배경 |
| `--tb-color-bg-focus` | `#FFFFFF` | 집중형 flow 화면 배경 |
| `--tb-color-surface-base` | `#FFFFFF` | 기본 서피스, 상단 바, 기본 컨테이너 |
| `--tb-color-surface-card` | `#FFFFFF` | 기본 카드 |
| `--tb-color-surface-card-hover` | `#FAFAFA` | 인터랙티브 카드 hover |
| `--tb-color-surface-muted` | `#F7F7F7` | 보조 블록, muted panel |
| `--tb-color-surface-elevated` | `#FCFCFC` | 올라온 보조 서피스 |
| `--tb-color-surface-disabled` | `#EFEFEF` | disabled fill |
| `--tb-color-surface-overlay` | `rgba(255,255,255,0.8)` | 반투명 overlay 서피스 |

### Text & Icon

| Token | Value | 역할 |
| --- | --- | --- |
| `--tb-color-text-primary` | `#0F0F0F` | 가장 강한 텍스트 |
| `--tb-color-text-secondary` | `#3F3F3F` | 서브 헤딩, 강조 메타 |
| `--tb-color-text-tertiary` | `#535353` | 세 번째 단계 라벨 |
| `--tb-color-text-body` | `#666666` | 기본 본문 |
| `--tb-color-text-hint` | `#888888` | 힌트, 차트 라벨 |
| `--tb-color-text-disabled` | `#AFAFAF` | disabled 텍스트 |
| `--tb-color-text-inverse` | `#FFFFFF` | 어두운 배경 위 텍스트 |
| `--tb-color-icon-primary` | `#3F3F3F` | 기본 아이콘 |
| `--tb-color-icon-hover` | `#6F6F6F` | hover 아이콘 |
| `--tb-color-icon-muted` | `#AFAFAF` | 비활성 / 보조 아이콘 |

### Border & State

| Token | Value | 역할 |
| --- | --- | --- |
| `--tb-color-border-card` | `#F0F0F0` | 카드 edge |
| `--tb-color-border-subtle` | `#E8E8E8` | 차트 grid, 보조 구분선 |
| `--tb-color-border-default` | `#E7E7E7` | 기본 border |
| `--tb-color-border-strong` | `#E5E5E5` | 더 강한 구분선 |
| `--tb-color-border-disabled` | `#E0E0E0` | disabled border |
| `--tb-color-success` | `#2F8F5B` | success foreground |
| `--tb-color-success-soft` | `#E6F4EC` | success soft fill |
| `--tb-color-warning` | `#A8661A` | warning foreground |
| `--tb-color-warning-soft` | `#FFF1DE` | warning soft fill |

### Taste Palette

맛 컬러는 장식 컬러가 아니다. 제품 의미를 전달하는 domain token이다.

| Taste | Main | Dark | Light | BG | Tint Soft | Tint Soft Border | Tint Surface | Gradient |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sweet / 단맛 | `#FF9900` | `#CC7A00` | `#FFCC80` | `#FFD699` | `rgba(255, 153, 0, 0.05)` | `rgba(255, 153, 0, 0.18)` | `#FFEBCC` | `linear-gradient(135deg, #FF9900, #FFB84D)` |
| Sour / 신맛 | `#FBC02D` | `#C99A00` | `#FDD835` | `#FFEF99` | `rgba(251, 192, 45, 0.05)` | `rgba(251, 192, 45, 0.18)` | `#FFF7CC` | `linear-gradient(135deg, #FBC02D, #FFD54F)` |
| Bitter / 쓴맛 | `#95C900` | `#6E9600` | `#E6EE9C` | `#E0EBB4` | `rgba(149, 201, 0, 0.05)` | `rgba(149, 201, 0, 0.18)` | `#EAF4CC` | `linear-gradient(135deg, #95C900, #AED581)` |
| Salty / 짠맛 | `#7299FF` | `#4A70CC` | `#90CAF9` | `#C6D6FF` | `rgba(114, 153, 255, 0.05)` | `rgba(114, 153, 255, 0.18)` | `#E3EBFF` | `linear-gradient(135deg, #7299FF, #9FBFFF)` |
| Umami / 감칠맛 | `#B372B4` | `#8A5490` | `#CE93D8` | `#E1C7E1` | `rgba(179, 114, 180, 0.05)` | `rgba(179, 114, 180, 0.18)` | `#F0E3F0` | `linear-gradient(135deg, #B372B4, #CE93D8)` |
| Fat / 지방맛 | `#95867A` | `#6B5E54` | `#BCAAA4` | `#D5CFCA` | `rgba(149, 134, 122, 0.05)` | `rgba(149, 134, 122, 0.18)` | `#EAE7E4` | `linear-gradient(135deg, #95867A, #B0A49A)` |

### Taste Surface Roles

| Token | 역할 | 대표 예시 |
| --- | --- | --- |
| `BG` | 맛 신호를 더 또렷하게 보여줘야 하는 fill. quick stat, calibration highlight, 더 직접적인 시선 유도에 사용 | 측정/보정 계열 강조 블록, taste fill |
| `Tint Soft` | 작은 pill / 메타 칩에서 맛 맥락을 부드럽게 드러내는 얇은 tint 배경 | `TasteChip`, 측정 화면 `절대 좌표` / `기준점` 칩 |
| `Tint Soft Border` | `Tint Soft`와 함께 쓰는 경계선 | soft inline chip / meta chip border |
| `Tint Surface` | 한 가지 맛 맥락을 유지하되 카드가 과하게 외치지 않게 만드는 부드러운 해석형 배경 | `셰프 매칭`, `세부 분석` 카드 |

### Taste Palette Rules

- 맛 컬러는 값, node, chip, delta, chart signal에 쓴다.
- `Tint Surface`는 taste 의미를 담는 카드 배경에 우선 사용하고, 텍스트는 `Tint Surface Text` / `Tint Surface Sub Text` 조합으로 맞춘다.
- `BG`는 `Tint Surface`보다 한 단계 강한 fill이다. 카드 전체 바탕보다는 stat, emphasis, 측정 결과 강조에 더 잘 맞는다.
- 긴 본문을 taste color로 세팅하지 않는다.
- 한 블록 안에 여섯 맛을 동시에 강하게 펼치지 않는다.
- 기본 상태는 neutral, success, warning으로 시작한다.
- "맛의 의미"가 핵심일 때만 taste palette를 전면에 올린다.

### Hospitality Warmth

현재 구현에는 전용 warmth token 세트가 독립 토큰으로 자리잡지는 않았지만, 문서 기준으로는 아래 역할을 유지한다.

- linen tone: 약속, 기대, care를 주는 카드
- sand tone: 부드러운 분리감
- bronze / roast tone: premium hospitality signal

warmth는 taste palette보다 앞에 나오면 안 된다.

---

## 타이포그래피 시스템

### Font Family

- 기본 폰트: `Pretendard`
- 로드 토큰: `--tb-font-family-sans`

제품 앱은 단일 폰트 전략을 유지한다. 별도 display serif를 추가하지 않는다.

### Type Scale

| Role | Token / Value | Weight | Line Height | 용도 |
| --- | --- | --- | --- | --- |
| Display | `18px` | `700` | `1.2` | completion, strongest headline |
| Heading | `18px` | `700` | `1.35` | flow title, drawer title |
| Title | `18px` | `700` | `1.2` | section title, key card title |
| Section | `16px` | `700` | `1.35` | local subsection heading |
| Body | `14px` | `400` | `1.5` | 기본 본문 |
| Body Strong | `14px` | `600` | `1.45` | inline 강조 |
| Caption | `12px` | `600` | `1.4` | badge, helper, meta |
| Micro | `10px` to `11px` | `500` to `600` | `1.3` to `1.4` | 아주 작은 라벨 |

### Raw Token Scale

| Token | Value |
| --- | --- |
| `--tb-font-size-10` | `10px` |
| `--tb-font-size-11` | `11px` |
| `--tb-font-size-12` | `12px` |
| `--tb-font-size-13` | `13px` |
| `--tb-font-size-14` | `14px` |
| `--tb-font-size-15` | `15px` |
| `--tb-font-size-16` | `16px` |
| `--tb-font-size-18` | `18px` |
| `--tb-font-size-20` | `18px` |
| `--tb-font-size-22` | `18px` |
| `--tb-font-size-24` | `18px` |
| `--tb-font-size-28` | `18px` |

### Typography Rules

- 제품 UI는 `18px` ceiling을 유지한다.
- 한 화면에서 실질적인 heading level은 최대 두 단계까지만 쓴다.
- 숫자 읽기가 중요한 경우 tabular figure를 우선한다.
- 위계는 크기보다 grouping, spacing, contrast로 만든다.

---

## 간격, 반경, 그림자

### Spacing Scale

| Token | Value |
| --- | --- |
| `--tb-space-2` | `2px` |
| `--tb-space-4` | `4px` |
| `--tb-space-6` | `6px` |
| `--tb-space-8` | `8px` |
| `--tb-space-10` | `10px` |
| `--tb-space-12` | `12px` |
| `--tb-space-16` | `16px` |
| `--tb-space-20` | `20px` |
| `--tb-space-24` | `24px` |
| `--tb-space-40` | `40px` |

### Radius Scale

| Token | Value | 역할 |
| --- | --- | --- |
| `--tb-radius-6` | `6px` | 작은 badge, compact control |
| `--tb-radius-8` | `8px` | small surface, `TokenBox` |
| `--tb-radius-10` | `10px` | 기본 CTA |
| `--tb-radius-12` | `12px` | row, tab, selectable card |
| `--tb-radius-14` | `14px` | profile block, empty state icon box |
| `--tb-radius-20` | `20px` | 기본 카드 shell |
| `--tb-radius-24` | `24px` | immersive / media shell |
| `--tb-radius-full` | `9999px` | chip, pill |

### Shadow Tokens

| Token | Value | 용도 |
| --- | --- | --- |
| `--tb-shadow-hover` | `0 1px 3px rgba(15, 15, 15, 0.06)` | 가벼운 hover |

### Box Size Tokens

| Token | Value | 용도 |
| --- | --- | --- |
| `--tb-box-size-sm` | `32px` | compact icon / symbol box |
| `--tb-box-size-md` | `40px` | list row icon / medium symbol box |
| `--tb-box-size-lg` | `48px` | empty state / emphasized symbol box |
| `--tb-shadow-soft` | `0 4px 20px rgba(0, 0, 0, 0.1)` | 가벼운 floating surface |
| `--tb-shadow-strong` | `0 12px 32px rgba(15, 15, 15, 0.12)` | interactive card hover |
| `--tb-shadow-button` | `0 8px 20px rgba(0, 0, 0, 0.1)` | primary CTA |
| `--tb-shadow-drawer` | `0 20px 60px rgba(0, 0, 0, 0.24)` | drawer, notification overlay |
| `--tb-shadow-badge-elevated` | layered shadow | gradient TCS badge |

### Layout Tokens

| Token | Value |
| --- | --- |
| `--tb-layout-screen-max-width` | `1440px` |
| `--tb-layout-page-gutter` | `20px` |
| `--tb-layout-section-gap` | `20px` |
| `--tb-layout-card-stack-gap` | `12px` |
| `--tb-layout-card-padding` | `12px` |
| `--tb-size-top-app-bar-height` | `56px` |
| `--tb-size-bottom-tab-bar-height` | `60px` |
| `--tb-size-primary-button-height` | `48px` |
| `--tb-size-bottom-fade-min-height` | `140px` |
| `--tb-size-bottom-indicator-width` | `134px` |

### Layout Rules

- 기본 page gutter는 `20px`
- 카드 내부 기본 padding은 `12px`
- 카드 스택 기본 gap은 `12px`
- 큰 섹션 전환은 `20px` 이상으로만 벌린다
- sticky action reserve zone은 최소 `140px` 확보한다

---

## 모션, 아이콘, 데이터 시각화

### Motion Tokens

| Token | Value |
| --- | --- |
| `--tb-motion-duration-fast` | `180ms` |
| `--tb-motion-duration-normal` | `300ms` |
| `--tb-motion-duration-medium` | `500ms` |
| `--tb-motion-duration-slow` | `620ms` |
| `--tb-motion-duration-slowest` | `720ms` |
| `--tb-motion-duration-loop-pulse` | `1600ms` |
| `--tb-motion-duration-splash` | `2500ms` |

Easing:

- standard: `ease`
- entrance: `cubic-bezier(0.22, 1, 0.36, 1)`
- exit: `ease-out`

Scale:

- press: `0.98`
- tab hover: `1.05`
- tab active: `1.1`
- loop node pulse: `1.28`
- loop label pulse: `1.06`

### Motion Rules

- 대부분의 인터랙션 피드백은 `180ms` 에서 `300ms`
- 화면 전환이나 큰 shell 변화는 `500ms` 에서 `620ms`
- bounce는 쓰지 않는다
- 반복 애니메이션은 device state나 taste activity를 설명할 때만 허용

### Icon Rules

- 메인 앱의 실제 아이콘 언어는 `lucide-react`
- 디자인 시스템 문서와 샘플도 같은 아이콘 언어를 사용한다

현재 메인 앱 컴포넌트는 대부분 `ICON_TOKENS.size` 를 직접 읽는다.

현재 아이콘 크기 시스템은 CSS 변수와 TS 미러가 같은 값을 보도록 정렬한다.

| Token | Value |
| --- | --- |
| `xs` | `12` |
| `sm` | `14` |
| `base` | `16` |
| `md` | `18` |
| `control` | `20` |
| `lg` | `24` |
| `xl` | `28` |
| `touch` | `24` |
| `hero` | `24` |

### Data Visualization Rules

- 차트는 세 가지 목적일 때만 쓴다.
- relative taste balance
- change over time
- confidence and refinement

세부 규칙:

- grid line은 neutral로 유지한다
- taste color는 signal로만 사용한다
- 해석 텍스트를 항상 옆에 둔다
- raw number만으로 읽게 만들지 않는다

주요 data-viz token:

| 항목 | 값 |
| --- | --- |
| Progress bar height | `8px` |
| Radar size | `320px` |
| Radar label size | `10px` |
| Trend dot size | `4px` |
| Orbit outer ring thickness | `24px` |
| Orbit guide radius | `138px` |

---

## 현재 사용 중인 컴포넌트

`src/components/design-system/inventory.ts` 의 `CURRENTLY_USED_COMPONENTS` 기준.

| Group | Component | 역할 | Source |
| --- | --- | --- | --- |
| Card | `SectionCard` | 리스트 섹션, 통계 타일, 요약 카드의 기본 shell | `src/components/SectionCard.tsx` |
| Button | `PrimaryButton` | 온보딩, 측정, 예약, 피드백 전반의 메인 CTA | `src/components/system/PrimaryButton.tsx` |
| Button | `FlowBottomCta` | 온보딩, 측정, 예약, 피드백 전반의 하단 CTA shell | `src/components/system/FlowBottomCta.tsx` |
| Button | `FlowStepCta` | 온보딩과 미각 측정 플로우의 공통 하단 step footer | `src/components/system/FlowStepCta.tsx` |
| Navigation | `TopAppBar` | 공용 상단 내비게이션 shell | `src/components/TopAppBar.tsx` |
| Navigation | `BottomTabBar` | 메인 플로우 하단 탭 바 | `src/components/BottomTabBar.tsx` |
| Overlay | `NotificationPanel` | 상단 알림 overlay | `src/components/NotificationPanel.tsx` |
| Overlay | `AppMenuDrawer` | 우측 메뉴 drawer | `src/components/AppMenuDrawer.tsx` |
| Chip | `Chip` | 일반 목적 neutral / semantic / icon label chip | `src/components/system/Chip.tsx` |
| Badge | `OutlineBadge` | 프로필 단계, 섹션 라벨 | `src/components/system/OutlineBadge.tsx` |
| Badge | `StatusChip` | 예약 상태 메타데이터 | `src/components/system/StatusChip.tsx` |
| Badge | `Home TCS Badge` | 홈 히스토리 카드의 gradient TCS 배지 | `src/imports/Home.tsx` |
| Chip | `TasteChip` | 맛 포인트 전용 taste-aware pill | `src/components/system/TasteChip.tsx` |
| Card | `InterpretationCard` | 프로필 해석, 셰프 번역 요약, 홈 변화 요약 카드 | `src/components/system/InterpretationCard.tsx` |
| Typography Helper | `SectionTitle` | 섹션 제목 helper | `src/components/system/SectionTitle.tsx` |
| App Specific | `TasteMeasurementMiniCta` | 여러 탭에서 재사용되는 inline CTA 카드 | `src/components/measurement/TasteMeasurementMiniCta.tsx` |
| Feedback | `EmptyState` | 비어 있는 상태 안내 블록 | `src/components/system/EmptyState.tsx` |
| App Specific Screen | `ImproveAccuracyScreen` | 정밀도 향상 설명 full-screen composite | `src/pages/ImproveAccuracyScreen.tsx` |
| App Specific Flow | `DiningFeedbackFlow` | 피드백 전용 flow, choice, summary 카드 집합 | `src/components/reservation/DiningFeedbackFlow.tsx` |

---

## 핵심 컴포넌트 스타일 스냅샷

프리뷰의 `componentSpecs` 섹션에서 바로 확인할 수 있는 핵심 스타일값만 다시 적는다.

### Buttons & Chips / Badges

| Component | 현재 규칙 |
| --- | --- |
| `PrimaryButton` | 높이 `48px`, radius `10px`, background `--tb-color-text-primary`, text `--tb-color-text-inverse`, shadow `--tb-shadow-button`, active scale `0.98` |
| `PrimaryButton compact` | 최소 높이 `40px`, `16px` 좌우 여백, `12px` 글자, `600` 굵기, shadow 없음 |
| `FlowBottomCta` | bottom fade shell, absolute bottom anchor, min-height `140px`, padding-inline `20px`, padding-bottom `40px + safe area`, primary action은 `PrimaryButton`, top slot / helper copy optional |
| `FlowStepCta` | absolute bottom anchor, content shell `relative flex min-h-[140px] w-full flex-col items-center justify-end px-5`, indicator `mb-8`, button `mb-8`, 미각 측정에서는 active dot만 `palette.main`을 쓰고 나머지 dot은 neutral gray 유지 |
| `Chip` | full pill, size `xs/sm/md`, tone `neutral/success/warning/accent`, variant `soft/outline/solid/text`, general label / source tag / icon+text chip 용도. `xs`: `10px`, `px 8 / py 4 / gap 4 / icon 12`. `sm`: `11px`, `px 10 / py 6 / gap 6 / icon 12`. `md`: `12px`, `px 12 / py 8 / gap 8 / icon 14`. 필요 시 `backgroundColorToken`으로 `surface-base` 같은 배경 토큰을 직접 주입할 수 있다. |
| `OutlineBadge` | `1px solid --tb-color-text-tertiary`, radius `6px`, padding `2px 8px`, `12px / 600` |
| `StatusChip` | radius `6px`, padding `2px 6px`, `10px / 700`, 색상은 prop으로 주입 |
| `HomeTcsBadge` | radius `6px`, padding `2px 6px`, `10px / 700`, weighted taste-light gradient + badge elevated shadow |
| `TasteChip` | full pill, border `taste.palette.tintSoftBorder`, bg `taste.palette.tintSoft`, `10px / 500`, value는 taste color `600`; 미각과 무관한 메타는 `tone="neutral"`로 `surface-muted / border-strong / text-tertiary` 사용 |
| `TokenBox` | radius `8px`, size `sm/md/lg = 32/40/48px`, `backgroundToken`과 `textToken`으로 `tb-*` 색상 토큰을 주입 |
| `ImageBox` | radius `8px`, size `sm/md/lg = 32/40/48px`, 이미지가 있으면 `object-cover`, 없으면 `person/chef/restaurant/menu/generic` fallback icon |

### Cards

| Component | 현재 규칙 |
| --- | --- |
| `SectionCard` | radius `20px`, background `surface-card`, body gap `12px`, body padding `12px`, hover 시 `translateY(-4px)`, interactive면 active 시 `scale(0.99)` |
| `PageSection` | title + card stack wrapper, 기본 stack gap `12px`, `SectionTitle` 사용 |
| `TasteMeasurementMiniCta` | radius `20px`, 기본 padding `12px`, neutral / alert tone 분기, alert는 sweet bg 기반 gradient, title `14px / 600`, desc `12px`, meta `11px`, action은 compact `PrimaryButton` |
| `EmptyState` | centered layout, gap `16px`, padding `48px 24px`, icon box `48px / radius 14px`, title `16px / 700`, desc `13px`, CTA radius `10px` |

### Navigation & Overlay

| Component | 현재 규칙 |
| --- | --- |
| `TopAppBar` | 기본은 `bg-page` 85% + blur `12px`, solid 상태는 콘텐츠 배경(`bg-page`/`bg-focus`)과 일치, padding `20px 12px`, 높이 `56px`, avatar `32px`, icon `24px`, unread dot `6px` |
| `BottomTabBar` | min-height `60px`, `bg-page` 85% + blur `12px`, border-top default, tab padding `6px 16px`, label `10px`, active scale `1.1`, iOS home indicator는 시스템 기본 표시만 사용 |
| `NotificationPanel` | top `56px`, horizontal margin `20px`, max-height `70vh`, radius `20px`, white 85% + blur, shadow `drawer`, unread row는 muted surface |
| `AppMenuDrawer` | width `300px`, max-width `85vw`, white 85% + blur, backdrop `black/30 + blur(2px)`, transition `300ms entrance easing`, row radius `12px` |

### 현재 캡처된 스타일 스펙 목록

`src/components/design-system/componentStyleSpecs.ts` 기준:

- Currently used: `Chip`, `TasteChip`, `HomeTcsBadge`, `StatusChip`, `OutlineBadge`, `PrimaryButton`, `FlowBottomCta`, `FlowStepCta`, `SectionCard`, `PageSection`, `TasteMeasurementMiniCta`, `TopAppBar`, `BottomTabBar`, `NotificationPanel`, `AppMenuDrawer`, `EmptyState`
- Defined but unused: `Badge`, `Button`, `Input`, `Textarea`, `SelectTrigger`, `Tabs`, `DialogContent`, `SheetContent`, `PopoverContent`, `TooltipContent`

---

## 현재 정의만 되어 있고 메인 앱에서는 거의 쓰지 않는 프리미티브

`src/components/ui` 아래의 shadcn / Radix 계열 프리미티브가 존재하지만, 메인 앱 플로우에서는 아직 많이 쓰이지 않는다.

### Buttons / Feedback

- `Button`
- `Badge`
- `Alert`
- `Progress`
- `Skeleton`
- `Toast` wrapper

### Fields

- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `Slider`

### Layout / Navigation

- `Tabs`
- `Card`

### Overlay

- `Dialog`
- `Sheet`
- `Popover`
- `Tooltip`
- `Drawer`

### 사용 원칙

- 새 화면을 만든다고 해서 자동으로 이 프리미티브를 가져다 쓰지 않는다.
- 먼저 `tb-*` 토큰과 현재 앱 shell 규칙에 맞는지 본다.
- 도입한다면 generic theme가 아니라 Taste Buddy 토큰에 맞게 매핑해야 한다.

---

## 알려진 불일치와 리스크

`src/components/design-system/inventory.ts` 의 `INCONSISTENCIES` 기준.

### 1. 토큰 레이어가 두 갈래로 병존

- 위치: `src/styles/globals.css`, `src/styles/design-system.css`
- 설명: generic semantic theme와 `tb-*` 앱 토큰이 함께 존재한다.
- 현재 판단: 실제 앱 shell은 `tb-*` 가 주도한다.
- 규칙: 제품 UI를 건드릴 때는 `tb-*` 를 우선 사용한다.

### 2. 기능 페이지에 raw utility 값이 남아 있음

- 위치: `src/pages/DiningPage.tsx`, `src/pages/ProfilePage.tsx`, `src/components/reservation/DiningFeedbackFlow.tsx`
- 설명: 시각적으로는 토큰과 맞지만, raw arbitrary value가 반복된다.
- 규칙: 같은 값이 두 번 이상 반복되면 토큰 또는 공용 컴포넌트로 승격한다.

### 3. `SectionTitle` 채택이 일관되지 않음

- 위치: `src/components/system/SectionTitle.tsx`, `src/pages/AnalysisPage.tsx`, `src/pages/ProfilePage.tsx`
- 설명: 같은 역할의 heading이 helper 없이 ad hoc class로 남아 있다.
- 규칙: 새로운 섹션 heading은 `SectionTitle` 을 우선 사용한다.

### 4. 다크 모드 적용 범위가 부분적

- 위치: `src/styles/globals.css`, `src/styles/design-system.css`
- 설명: `.dark` override는 generic token에만 있고 앱 shell `tb-*` 레이어에는 없다.
- 현재 판단: 다크 모드는 실제 제품 기준 완성 상태가 아니다.

### 5. 상태 색상 체계가 아직 완전하지 않음

- 위치: `src/styles/design-system.css`, `src/pages/DiningPage.tsx`
- 설명: success / warning은 `tb-*` 에 들어왔지만, error는 아직 generic destructive token에 기대는 부분이 있다.
- 규칙: 새 에러 UI를 만들 때는 error를 `tb-*` 레이어에 정식 편입하는 쪽을 우선 검토한다.

---

## 정리 우선순위

`src/components/design-system/inventory.ts` 의 `TODO_ITEMS` 기준.

### 1. 공용 폼 필드 추출

- 대상: 검색 행, textarea shell, choice selector
- 관련 파일: `src/components/reservation/DiningFeedbackFlow.tsx`, `src/pages/DiningPage.tsx`

### 2. 리스트 아이템 프리미티브 추출

- 대상: 예약 행, 셰프 행, 설정 행
- 관련 파일: `src/pages/ProfilePage.tsx`, `src/pages/DiningPage.tsx`

### 3. 오버레이 전략 통합

- 대상: custom drawer와 Radix / Vaul 계열 overlay 정리
- 관련 파일: `src/pages/TeastickConnectScreen.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/drawer.tsx`

### 4. 지속형 디자인 토큰 편집기 보강

- 현재 상태: `src/lib/designTokenRuntime.ts` 로 로컬 runtime override는 가능
- 한계: source-of-truth 코드를 직접 갱신하지는 않는다

---

## 런타임 프리뷰 규칙

`src/lib/designTokenRuntime.ts` 는 디자인 시스템 프리뷰에서 다음 값을 로컬로 조절하게 해준다.

- background
- primaryText
- bodyText
- border
- cardSurface
- cardRadius
- controlRadius
- gap
- sectionGap
- titleSize
- displaySize
- bodySize
- captionSize
- fontWeight
- lineHeight
- shadowKey

### Runtime Override Rules

- runtime override는 프리뷰 검증용이다.
- 최종 source-of-truth 수정은 반드시 `src/styles/design-system.css` 와 `src/constants/designTokens.ts` 에 반영한다.
- 프리뷰에서 괜찮아 보인 값을 그대로 shipping decision으로 간주하지 않는다.

---

## 향후 UI 작업 규칙

- 제품 UI는 `tb-*` 토큰을 우선 사용한다.
- 새로운 토큰은 같은 예외가 최소 두 번 이상 반복될 때만 만든다.
- reusable pattern이면 `src/components/system` 또는 적절한 앱 전용 컴포넌트로 추출한다.
- generic primitive를 도입할 때는 Taste Buddy의 spacing, radius, color, motion 규칙에 먼저 맞춘다.
- 새 컴포넌트가 재사용 대상이라면 `/design-system` 프리뷰에서 확인 가능하도록 인벤토리 또는 스펙에 편입한다.
- 데이터 시각화는 설명 문구와 함께 배치한다.
- empty state는 반드시 다음 액션을 포함한다.
- hardware나 measurement mechanics보다 "더 잘 맞는 다이닝 경험"을 먼저 보여준다.

---

## 접근성 규칙

- WCAG 2.2 AA 기준으로 본다.
- taste color만으로 의미를 전달하지 않는다.
- zoom, dynamic font scaling을 깨지 않게 유지한다.
- 최소 tap target은 `44px`
- focus state는 항상 보여야 한다.
- success, error, warning은 텍스트로도 명시한다.
- 차트에는 해석 텍스트를 함께 둔다.

---

## 이미지 사용 규칙

- plated detail
- hands, tools, texture
- close crop
- restaurant atmosphere as support

피해야 하는 것:

- generic smiling diner photo
- stock-style hero
- saturated food poster look
- 밀도 높은 작업 화면 안의 giant full-bleed photo

---

## 참고 소스

- `DESIGN.md`
- `src/index.css`
- `src/styles/globals.css`
- `src/styles/design-system.css`
- `src/constants/designTokens.ts`
- `src/components/system`
- `src/components/ui`
- `src/pages/DesignSystemPage.tsx`
- `src/components/design-system/inventory.ts`
- `src/components/design-system/componentStyleSpecs.ts`

---

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-04-07 | Quiet Hospitality Intelligence 방향 유지 | 예약 앱과 실험실 UI 사이에서 Taste Buddy만의 해석 중심 톤을 유지하기 위해 |
| 2026-04-13 | `DESIGN.md` 를 디자인 시스템 프리뷰 기준으로 재구성 | 프리뷰에 이미 정리된 토큰, 컴포넌트, 불일치, TODO를 문서와 동일한 구조로 맞추기 위해 |
| 2026-04-13 | taste background와 icon size의 CSS/TS 미러 값을 정렬 | 실제 UI와 프리뷰, 문서가 서로 다른 값을 말하지 않게 하기 위해 |
