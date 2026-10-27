# 플레이팅 컬러 상세 참고

2026-10-07 · [간단 가이드](./color-style-guide.md) · 계산·대조·전환 이력

신맛 대표색은 `#FFD600`이다. 홈·프로필·분석·컴포넌트 갤러리의 기존 노란 강조색도 공용 팔레트 참조로 통일했다. 웹·iOS·Android·브랜드 코드와 피그마 플레이팅 24개 페이지에서 이전 `#FBC02D` 및 이전 파생 배경값의 잔여를 확인해 정리했다. 이 확인은 소스와 디자인 원본 기준이며, 설치된 네이티브 앱 화면은 재빌드·실행 확인과 구분한다.

[Figma 최종 가이드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=839-113) · [플레이팅 웹 가이드](http://127.0.0.1:3001/design-system/foundations/colors) · [기존 TB 원본](https://www.figma.com/design/zVE73nDTX0mU6uBuoIQYJE?node-id=1247-3269)

기존 TB의 페인트 스타일 150개와 TB Theme의 색상 변수 52개를 현재 플레이팅·웹·iOS와 대조했다. 새 UI는 이 문서의 역할별 값을 사용한다. 미각 대표색의 정체성은 유지하며, 신맛 대표색은 **#FFD600**으로 통일한다. 이전 파일의 다른 색·Dark 팔레트는 이력과 참고로 보존한다.

## 1. 컬러를 선택하는 기준

- **미각은 색으로 구분**: 단맛·신맛·쓴맛·짠맛·감칠맛·지방맛의 대표색을 유지해요. 강도는 크기·위치·수치로, 호감은 별도의 응답으로 표현해요.
- **UI는 역할로 선택**: 페이지·카드·글자·경계·상태를 먼저 고르고 토큰을 사용해요. 같은 HEX여도 서로 다른 역할은 이름을 분리해요.
- **배경과 글자는 한 쌍**: 미각 배경 tintSurface에는 tintSurfaceText를 사용해요. main은 분류와 그래픽의 강조색이고, 작은 글자의 기본값은 아니에요.
- **혼합 팔레트에서 역할로 연결**: Light는 흰색, Dark는 #1C1C1C의 10–95% 혼합 팔레트를 원시 값으로 두고, 의미 토큰이 해당 단계를 참조한다. 캡슐 막대 트랙은 Light `tint/80` · Dark `tint/70`이다.

색은 감각의 종류나 상태를 전달한다. 감각의 강도·직접 호감·취향 적합도·전체 평가를 색 하나로 합치지 않는다. 단맛과 신맛, 쓴맛과 성공은 색이 비슷하므로 문구·아이콘·형태를 함께 제공한다.

## 2. 미각 팔레트 · Light

| 미각 | main | tintSurface | tintSurfaceText | 읽기 조합 대비 |
| --- | --- | --- | --- | --- |
| 단맛 / `sweet` | `#FF9900` | `#FFEBCC` | `#6F4609` | 7.05:1 |
| 신맛 / `sour` | `#FFD600` | `#FFF7CC` | `#6F5F09` | 5.86:1 |
| 쓴맛 / `bitter` | `#95C900` | `#EAF4CC` | `#505B24` | 6.40:1 |
| 짠맛 / `salty` | `#7299FF` | `#E3EBFF` | `#36466F` | 7.78:1 |
| 감칠맛 / `umami` | `#B372B4` | `#F0E3F0` | `#513751` | 8.41:1 |
| 지방맛 / `fat` | `#95867A` | `#EAE7E4` | `#453F3A` | 8.42:1 |

| 역할 | 사용 기준 |
| --- | --- |
| `main` | 미각 분류, 아이콘, 그래픽 강조. 작은 글자의 기본값으로 사용하지 않는다. |
| `tintSurface` | 카드·버튼·태그·선택 탭의 공통 옅은 채움. Light `tint/80` / Dark `tint/70`을 참조한다. |
| `tintSurfaceText` | tintSurface 위 작은 라벨·숫자·음식명. iOS에서는 `TasteAxis.tintTextColor`. |
| `tintSoft` | 불투명한 약한 미각 표면. Light `tint/80`, Dark `tint/70`을 참조해 배경 위에서 구분한다. |
| `border/subtle` | 기본 표면 위 약한 경계. Light tint/80, Dark tint/70. |
| `border/default` | 채워진 표면의 일반 경계. Light tint/70, Dark tint/60. |
| `border/strong` | 선택·추천 상태의 강한 경계. Light tint/60, Dark tint/50. |
| `border/accent` | 미각 main을 사용하는 강조색 경계. |
| `chartTrack` | 불투명 캡슐 트랙. Light `tint/80` · Dark `tint/70`을 참조한다. |
| `tintSurfaceSubText` | 기존 보조 역할. 중요한 작은 글자의 대비 통과를 보장하지 않으며 실제 조합을 별도로 확인한다. |

미각별 배경과 읽기용 글자 조합은 모두 작은 글자 4.5:1 기준을 만족한다. 여섯 main 자체를 흰색 위 글자로 쓰면 약 1.43–3.52:1로 모두 미달한다. 긴 본문에는 중립 `textBody`를 사용한다.

## 3. 불투명색·알파·톤의 구분

- **불투명색**: alpha 1.0이며 바탕에 따라 변하지 않는다. HEX로 명시한다.
- **알파**: `rgba`의 색과 투명도를 함께 기록한다. 최종 보이는 값은 앞색 × alpha + 바탕 × (1 − alpha)다. Figma에서 이미 알파가 들어간 변수에 node opacity를 다시 곱하지 않는다.
- **톤 견본**: 기준색 혼합 비율 p에 대해 각 sRGB 8-bit 채널을 `round(main × (1 − p) + base × p)`로 계산한다. Light base는 255, Dark base는 28이다. 코드에서는 정수 반올림 `floor((channel × (100 − step) + base × step + 50) / 100)`을 사용한다. 숫자는 기준색 혼합 비율이며 알파가 아니다.

미각 여섯 색 모두 10·20·30·40·50·60·70·80·90·95 단계의 불투명 팔레트를 정의한다. 기존 TB Sour-10…95도 #FFD600 기준으로 다시 계산했다. 예: Sour-20 #FFDE33, Sour-50 #FFEB80, Sour-80 #FFF7CC, Sour-95 #FFFDF2. Light의 `tintSurface`와 `chartTrack`은 `tint/80`을 참조한다. 경계는 별도의 border 역할을 사용한다. 신맛 대표색을 #FFD600으로 되돌려, tint/80은 기존 배경과 같은 #FFF7CC가 된다.

기존 `Taste Colors 30%`의 여섯 색과 `Color BG 20%`는 실제로 alpha 100%다. 기존 디자인의 이력으로 보존하고 스타일 설명에 이 사실을 적었다. 새 UI는 이름의 퍼센트를 계산 규칙으로 해석하지 말고 역할 토큰을 사용한다.

**측정 그래픽 역할**: 신맛 main과 측정 루프의 강조색은 현재 #FFD600으로 같다. 일반 UI는 palette, 측정 그래픽은 measurement 역할을 각각 참조한다. 값이 같아도 역할 토큰은 유지한다.

### 여섯 미각의 흰색 혼합 팔레트

| 미각 / 흰색 비율 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 단맛 | `#FFA31A` | `#FFAD33` | `#FFB84D` | `#FFC266` | `#FFCC80` | `#FFD699` | `#FFE0B3` | `#FFEBCC` | `#FFF5E6` | `#FFFAF2` |
| 신맛 | `#FFDA1A` | `#FFDE33` | `#FFE24D` | `#FFE666` | `#FFEB80` | `#FFEF99` | `#FFF3B3` | `#FFF7CC` | `#FFFBE6` | `#FFFDF2` |
| 쓴맛 | `#A0CE1A` | `#AAD433` | `#B5D94D` | `#BFDF66` | `#CAE480` | `#D5E999` | `#DFEFB3` | `#EAF4CC` | `#F4FAE6` | `#FAFCF2` |
| 짠맛 | `#80A3FF` | `#8EADFF` | `#9CB8FF` | `#AAC2FF` | `#B9CCFF` | `#C7D6FF` | `#D5E0FF` | `#E3EBFF` | `#F1F5FF` | `#F8FAFF` |
| 감칠맛 | `#BB80BC` | `#C28EC3` | `#CA9CCB` | `#D1AAD2` | `#D9B9DA` | `#E1C7E1` | `#E8D5E9` | `#F0E3F0` | `#F7F1F8` | `#FBF8FB` |
| 지방맛 | `#A09287` | `#AA9E95` | `#B5AAA2` | `#BFB6AF` | `#CAC3BD` | `#D5CFCA` | `#DFDBD7` | `#EAE7E4` | `#F4F3F2` | `#FAF9F8` |

예: `primitive/taste/sour/tint/80` → `taste/sour/chartTrack` → 캡슐 트랙. CSS는 `--tb-taste-sour-chart-track: var(--tb-taste-sour-tint-80)`이며, iOS는 `axis.chartTrackColor`를 사용한다. 컴포넌트가 임의로 alpha를 더 곱하지 않는다.

## 4. 뉴트럴·상태·행동 · Light

페이지 `#F3F3F3`, 기본 카드 `#FFFFFF`, 본문 `#666666`, 읽기용 힌트 `#6F6F6F`, 기본 아이콘 `#3F3F3F`를 사용한다. 경계 `#E7E7E7`은 보조 분리선이며, 필수 조작 경계의 3:1 대비를 대신하지 않는다. 실제 비활성 요소만 disabled 색을 쓴다.

| 상태 | 강조 | 읽기용 Text | Soft 배경 | 읽기 조합 대비 |
| --- | --- | --- | --- | --- |
| success | `#2F8F5B` | `#236B45` | `#E6F4EC` | 5.68:1 |
| warning | `#A8661A` | `#875014` | `#FFF1DE` | 5.93:1 |
| destructive | `#D4183D` | `#B31333` | `#FCEDEF` | 6.05:1 |

주요 행동·선택은 #0F0F0F / #FFFFFF, 초점은 #3F3F3F다. 호버는 검정 4%, 누름은 검정 6%, 어두운 표면의 누름은 흰색 10%를 겹친다. 딤은 검정 35%·50%·60%로 구분하며 플랫폼이 제공하는 딤과 중복 적용하지 않는다.

### 현재 의미 토큰 대응표

Figma 변수는 원시 값에 별칭으로 연결한다. 아래 Swift 값은 `TBTheme.swift`, 웹 값은 `designTokens.ts`와 `design-system.css`에 대응한다. 동일한 값도 역할은 분리한다.

| Swift | Figma | CSS | 값 |
| --- | --- | --- | --- |
| `TBColor.page` | `color/bg/page` | `--tb-color-bg-page` | `#F3F3F3` |
| `TBColor.focus` | `color/bg/focus` | `--tb-color-bg-focus` | `#FFFFFF` |
| `TBColor.surface` | `color/surface/base` | `--tb-color-surface-base` | `#FFFFFF` |
| `TBColor.surfaceHover` | `color/surface/cardHover` | `--tb-color-surface-card-hover` | `#FAFAFA` |
| `TBColor.mutedSurface` | `color/surface/muted` | `--tb-color-surface-muted` | `#F7F7F7` |
| `TBColor.elevatedSurface` | `color/surface/elevated` | `--tb-color-surface-elevated` | `#FCFCFC` |
| `TBColor.disabledSurface` | `color/surface/disabled` | `--tb-color-surface-disabled` | `#EFEFEF` |
| `TBColor.placeholderSurface` | `color/surface/placeholder` | `--tb-color-surface-placeholder` | `#EFEFEF` |
| `TBColor.inverseSurface` | `color/surface/inverse` | `--tb-color-surface-inverse` | `#0F0F0F` |
| `TBColor.overlaySurface` | `color/surface/overlay` | `--tb-color-surface-overlay` | `rgba(255, 255, 255, 0.8)` |
| `TBColor.textPrimary` | `color/text/primary` | `--tb-color-text-primary` | `#0F0F0F` |
| `TBColor.textSecondary` | `color/text/secondary` | `--tb-color-text-secondary` | `#3F3F3F` |
| `TBColor.textTertiary` | `color/text/tertiary` | `--tb-color-text-tertiary` | `#535353` |
| `TBColor.textBody` | `color/text/body` | `--tb-color-text-body` | `#666666` |
| `TBColor.textAction` | `color/text/action` | `--tb-color-text-action` | `#666666` |
| `TBColor.textHint` | `color/text/hint` | `--tb-color-text-hint` | `#6F6F6F` |
| `TBColor.textDisabled` | `color/text/disabled` | `--tb-color-text-disabled` | `#AFAFAF` |
| `TBColor.textSubtle` | `color/text/subtle` | `--tb-color-text-subtle` | `rgba(15, 15, 15, 0.6)` |
| `TBColor.textMuted` | `color/text/muted` | `--tb-color-text-muted` | `rgba(15, 15, 15, 0.5)` |
| `TBColor.textFaint` | `color/text/faint` | `--tb-color-text-faint` | `rgba(15, 15, 15, 0.4)` |
| `TBColor.textInverse` | `color/text/inverse` | `--tb-color-text-inverse` | `#FFFFFF` |
| `TBColor.borderCard` | `color/border/card` | `--tb-color-border-card` | `#F0F0F0` |
| `TBColor.borderSubtle` | `color/border/subtle` | `--tb-color-border-subtle` | `#E8E8E8` |
| `TBColor.border` | `color/border/default` | `--tb-color-border-default` | `#E7E7E7` |
| `TBColor.borderStrong` | `color/border/strong` | `--tb-color-border-strong` | `#E5E5E5` |
| `TBColor.borderDisabled` | `color/border/disabled` | `--tb-color-border-disabled` | `#E0E0E0` |
| `TBColor.borderAvatar` | `color/border/avatar` | `--tb-color-border-avatar` | `rgba(15, 15, 15, 0.2)` |
| `TBColor.borderAvatarSoft` | `color/border/avatarSoft` | `--tb-color-border-avatar-soft` | `rgba(15, 15, 15, 0.15)` |
| `TBColor.iconPrimary` | `color/icon/primary` | `--tb-color-icon-primary` | `#3F3F3F` |
| `TBColor.iconHover` | `color/icon/hover` | `--tb-color-icon-hover` | `#6F6F6F` |
| `TBColor.iconMuted` | `color/icon/muted` | `--tb-color-icon-muted` | `#AFAFAF` |
| `TBColor.neutral` | `color/feedback/neutral` | `--tb-color-neutral` | `#3F3F3F` |
| `TBColor.neutralSoft` | `color/feedback/neutralSoft` | `--tb-color-neutral-soft` | `#EFEFEF` |
| `TBColor.informative` | `color/feedback/informative` | `--tb-color-informative` | `#3F3F3F` |
| `TBColor.informativeSoft` | `color/feedback/informativeSoft` | `--tb-color-informative-soft` | `#F7F7F7` |
| `TBColor.success` | `color/feedback/success` | `--tb-color-success` | `#2F8F5B` |
| `TBColor.successText` | `color/feedback/successText` | `--tb-color-success-text` | `#236B45` |
| `TBColor.successStrong` | `color/feedback/successStrong` | `--tb-color-success-strong` | `#236B45` |
| `TBColor.successSoft` | `color/feedback/successSoft` | `--tb-color-success-soft` | `#E6F4EC` |
| `TBColor.warning` | `color/feedback/warning` | `--tb-color-warning` | `#A8661A` |
| `TBColor.warningText` | `color/feedback/warningText` | `--tb-color-warning-text` | `#875014` |
| `TBColor.warningStrong` | `color/feedback/warningStrong` | `--tb-color-warning-strong` | `#875014` |
| `TBColor.warningSoft` | `color/feedback/warningSoft` | `--tb-color-warning-soft` | `#FFF1DE` |
| `TBColor.destructive` | `color/feedback/destructive` | `--tb-color-destructive` | `#D4183D` |
| `TBColor.destructiveText` | `color/feedback/destructiveText` | `--tb-color-destructive-text` | `#B31333` |
| `TBColor.destructiveSoft` | `color/feedback/destructiveSoft` | `--tb-color-destructive-soft` | `#FCEDEF` |
| `TBColor.actionPrimary` | `color/interaction/primary` | `--tb-color-interaction-primary` | `#0F0F0F` |
| `TBColor.actionOnPrimary` | `color/interaction/onPrimary` | `--tb-color-interaction-on-primary` | `#FFFFFF` |
| `TBColor.selectionSurface` | `color/interaction/selected` | `--tb-color-interaction-selected` | `#0F0F0F` |
| `TBColor.selectionText` | `color/interaction/onSelected` | `--tb-color-interaction-on-selected` | `#FFFFFF` |
| `TBColor.focusRing` | `color/interaction/focus` | `--tb-color-interaction-focus` | `#3F3F3F` |
| `TBColor.hoverOverlay` | `color/interaction/hoverOverlay` | `--tb-color-interaction-hover-overlay` | `rgba(0, 0, 0, 0.04)` |
| `TBColor.pressedOverlay` | `color/interaction/pressedOverlay` | `--tb-color-interaction-pressed-overlay` | `rgba(0, 0, 0, 0.06)` |
| `TBColor.pressedInverseOverlay` | `color/interaction/pressedInverseOverlay` | `--tb-color-interaction-pressed-inverse-overlay` | `rgba(255, 255, 255, 0.1)` |
| `TBColor.scrimSubtle` | `color/scrim/subtle` | `--tb-color-scrim-subtle` | `rgba(0, 0, 0, 0.35)` |
| `TBColor.scrimDefault` | `color/scrim/default` | `--tb-color-scrim-default` | `rgba(0, 0, 0, 0.5)` |
| `TBColor.scrimStrong` | `color/scrim/strong` | `--tb-color-scrim-strong` | `rgba(0, 0, 0, 0.6)` |

기존 Figma 페이지 변수의 ID는 유지하면서 `color/surface/base`에서 `color/bg/page`로 이름을 정리했다. 흰색 `color/surface/base`는 별도로 추가했다. 기존 `color/surface/card`도 흰색 카드 역할로 유지한다. `native/color/text/hint` 등 기존 호환 이름은 삭제하지 않는다.

## 5. 제품 적용 예

| 맥락 | 배경·표현 | 글자·보완 정보 |
| --- | --- | --- |
| 미각 카드 | `tintSurface` | `tintSurfaceText` |
| 약한 미각 칩 | `chipBackground` + `border/default`: Light 80/70, Dark 70/60 | `tintSurfaceText` |
| 뉴트럴 미각 칩 | Light `#F7F7F7`/`#E5E5E5`, Dark `#343434`/`#484848` 배경·테두리 | `text/tertiary` |
| 아카이브 미니 그래프 | 최근 강조 main, 연한 미각 트랙 chartTrack (미각색 20%) | 카드의 핵심 수치·기간·상세 정보. 연한 막대만으로 필수 정보를 전달하지 않는다. |
| 성공·주의·오류 안내 | 각 상태의 Soft | 각 상태의 Text + 문구·아이콘 |
| 주요 행동 | `interaction.primary` | `interaction.onPrimary`; 비활성 색과 분리 |

## 6. 대비와 접근성

- 일반 작은 글자는 **4.5:1 이상**, 큰 글자는 **3:1 이상**으로 검토한다. 큰 글자는 24 CSS px 이상 또는 굵은 18.67 CSS px 이상에 해당한다. [WCAG 2.2 글자 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- 필수 UI 경계와 정보를 전달하는 그래픽은 인접색과 **3:1 이상**으로 검토한다. 장식·중복 정보의 예외를 실제 기능에 따라 판단한다. [WCAG 2.2 비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- 표의 수치는 불투명 단색 sRGB 상대 휘도 계산이다. 통과 판단에는 반올림 전 값을 사용한다. 사진·투명도·그라디언트 위에서는 최종 합성 결과를 확인한다.
- 색상만으로 선택·성공·오류·미각을 전달하지 않는다. 실제 기기·색각 차이·화면 전체의 접근성 검증을 이 계산만으로 통과했다고 주장하지 않는다.

## 7. 기존 TB 스타일 검토와 결정

| 항목 | 이전 상태 | 최종 사용 기준 |
| --- | --- | --- |
| 신맛 대표색 | TB Sour #FFD600 | #FFD600으로 복원. 기존 TB 스타일·변수와 Sour 톤 견본도 같은 원색으로 계산해요. |
| 쓴맛 | 스타일 #95C900 / 변수 #B2CC44 | 현재 대표색 #95C900을 채택해요. 이전 변수의 다른 색은 새 UI에 사용하지 않아요. |
| 성공 | 스타일 #43C900 / 변수 #9ACA16 | 현재 success #2F8F5B, 읽기용 successText #236B45를 사용해요. 쓴맛과 의미를 분리해요. |
| 주의·오류 | 주의 #FF9900 / 오류 #E51919 | 현재 warning #A8661A / destructive #D4183D를 사용해요. 작은 글자는 각 Text 토큰을 선택해요. |
| 30%와 Color BG 20% | 이름에 %가 있지만 alpha는 100% | 이전 이름은 이력으로 보존해요. 새 UI는 흰색 혼합 단계와 이를 참조하는 역할 토큰을 사용해요. |
| Surface·Fill·Label 단계 | 01·02 번호와 여러 페인트를 겹친 구조 | 페이지·카드·본문·힌트처럼 실제 역할에 연결해요. 밝기 번호를 UI 위계와 동일시하지 않아요. |
| Line·Dimmer | Light Line 03·04가 동일한 50%; 딤 50%·60% 불일치 | 경계는 border 계열, 딤은 검정 35%·50%·60%를 사용해요. 기존 Dark 흰색 딤은 채택하지 않아요. |
| 힌트·아이콘·페이지 | 웹 힌트 #888888, Figma 아이콘 #0F0F0F, 페이지 이름 surface/base | 힌트 #6F6F6F, 아이콘 #3F3F3F로 정렬했어요. Figma 페이지는 bg/page, 흰 표면은 surface/base로 분리해요. |
| Dark | 기존 TB에 별도 Dark 참고값이 있어요 | 이전 값은 이력으로 보존해요. 새 Dark 규격은 #1C1C1C 혼합과 역할별 조합으로 정의해요. |

추가 확인: Static White 견본의 `White #000000` 오표기를 `White #FFFFFF`로, Garnish Green의 `Negative -Dark` 오표기를 정정했다. 기존 `TB/Metarial/Dimmer`의 철자와 Light/Dark 값 차이, `TB/Static/Static`의 모드 반전, On Light/On Dark 라벨이 테마마다 반전되는 구조는 이전 파일의 이력으로 남긴다. 새 UI의 static은 모드와 무관한 색, semantic은 역할에 따른 색으로 구분한다.

## 8. Light / Dark 범위

새 컬러 규격은 **Light / Dark** 두 모드다. 두 모드가 여섯 미각 원색을 공유하며 표면·그래프·글자 역할에서 밝기를 조정한다. 단계의 숫자는 모드별 기준색 비율로 정의한다. Light의 기준색은 #FFFFFF, Dark의 기준색은 #1C1C1C다. 기존 Light 값은 그대로 유지한다.

- `tint/80` = 미각색 20% + 해당 기준색 80%. sRGB 채널별 정수 반올림이며 불투명색이다.
- 미각 경계는 `border/subtle` 80/70, `border/default` 70/60, `border/strong` 60/50, `border/accent` main/main을 사용하며 모두 불투명도 100%다. 미니 카드의 일반 경계는 웹 `--tb-taste-{taste}-border-default`와 iOS `TasteAxis.borderDefaultColor`로 연결한다. [보더 사용처와 규칙](border-tokens.md).
- 카드 `tintSurface`는 Light 80 / Dark 70, `chartTrack`은 Light 80 / Dark 70, `tintSoftBorder`는 두 모드 모두 80, `tintSoft`·`chipBackground`는 Light 80 / Dark 70으로 tintSurface와 같다. 그래프 전용 역할은 Figma·웹·iOS에서 일치하며 `color-style-guide.md`를 따른다.
- Dark `tintSurfaceText`는 고정된 Light tint/80, 보조 글자는 Light tint/50을 참조한다. 글자색에는 차콜 혼합을 적용하지 않는다.
- Dark 페이지 #141414 → 카드 #282828 → 상위 표면 #343434. 주요 글자 #F5F5F5, 본문 #B8B8B8, 힌트 #A3A3A3.
- Dark 주요 행동은 #F5F5F5 / #0F0F0F. 기본 표면의 호버는 흰색 6%, 누름은 흰색 10%, 밝은 주요 행동의 누름은 검정 8%다.
- UI main은 모드별 팔레트를 사용하고 사진·브랜드 그래픽의 원색은 보존한다. 딤은 검정 35/50/60%를 유지한다.

| 미각 | Dark main | 카드 tint/70 | 막대 tint/70 | 글자 | 보조 글자 | 글자 대비 |
| --- | --- | --- | --- | --- | --- | --- |
| 단맛 | `#FF9900` | `#604214` | `#604214` | `#FFEBCC` | `#FFCC80` | 7.87:1 |
| 신맛 | `#FFD600` | `#605414` | `#605414` | `#FFF7CC` | `#FFEB80` | 7.00:1 |
| 쓴맛 | `#95C900` | `#405014` | `#405014` | `#EAF4CC` | `#CAE480` | 7.71:1 |
| 짠맛 | `#7299FF` | `#364260` | `#364260` | `#E3EBFF` | `#B9CCFF` | 8.36:1 |
| 감칠맛 | `#B372B4` | `#49364A` | `#49364A` | `#F0E3F0` | `#D9B9DA` | 8.88:1 |
| 지방맛 | `#95867A` | `#403C38` | `#403C38` | `#EAE7E4` | `#CAC3BD` | 8.87:1 |

### 차콜 혼합 단계

| 미각 / 기준색 비율 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 단맛 | `#E88D03` | `#D28006` | `#BB7408` | `#A4670B` | `#8E5B0E` | `#774E11` | `#604214` | `#493516` | `#332919` | `#27221B` |
| 신맛 | `#E8C303` | `#D2B106` | `#BB9E08` | `#A48C0B` | `#8E790E` | `#776611` | `#605414` | `#494116` | `#332F19` | `#27251B` |
| 쓴맛 | `#89B803` | `#7DA606` | `#719508` | `#65840B` | `#59730E` | `#4C6111` | `#405014` | `#343F16` | `#282D19` | `#22251B` |
| 짠맛 | `#698DE8` | `#6180D2` | `#5874BB` | `#5067A4` | `#475B8E` | `#3E4E77` | `#364260` | `#2D3549` | `#252933` | `#202227` |
| 감칠맛 | `#A469A5` | `#956196` | `#865886` | `#775077` | `#684768` | `#583E59` | `#49364A` | `#3A2D3A` | `#2B252B` | `#242024` |
| 지방맛 | `#897B71` | `#7D7167` | `#71665E` | `#655C54` | `#59514B` | `#4C4642` | `#403C38` | `#34312F` | `#282725` | `#222121` |

### 모드 연결과 현재 범위

Figma의 **Plating Semantic**에서 Light / Dark를 선택한다. `taste/{taste}/tint/{step}` 변수의 이름은 두 모드에서 같고, 고정된 원시 Light/차콜 값에 별칭으로 연결한다. 기존 변수 ID와 Light 값은 보존했다. `Plating/Taste/{taste}/Charcoal {step}`과 `Plating/Dark/…` 페인트 스타일을 함께 제공한다.

[Dark Atomic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=939-4592) · [Light / Dark와 Dark Semantic](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=939-3899)

웹의 `data-tb-theme="dark"` 범위에서는 기존 CSS 역할 변수가 Dark 값으로 바뀐다. 중첩된 Light 범위도 원시값과 별칭을 함께 재선언해 상위 Dark 값이 새지 않게 한다. JavaScript는 `COLOR_TOKENS_BY_MODE[mode]`, `TASTE_PALETTES_BY_MODE[mode]`, `TASTE_TINTS_BY_MODE[mode]`를 사용한다.

iOS에는 `TBColorMode(colorScheme)`의 역할별 프로퍼티와 `TasteAxis.palette(in: mode)`, `chartTrackColor(in: mode)`를 제공한다. 원시 단계는 `TBTasteTint.color(main, percent: 80, mode: .dark)`다. 기존 호출부의 `TBColor`와 `TasteAxis.palette`는 동적 색상을 반환하며, 명시적인 Light 값은 `TBLightColor`와 `TasteAxis.lightPalette`로 분리했다.

후속 적용에서는 시각화·측정·중립 미각과 그림자·블러 12종을 추가하고, 웹·iOS 앱의 시스템 테마 전환을 연결했다. 일반 UI와 차트는 역할 색상을 사용하고 사진·카메라·컬러 브랜드 그래픽은 고정 표현을 유지한다. Figma Semantic COLOR 변수는 324개이며, 추가·보완한 146역할의 두 모드 값은 코드와 일치한다. [시각화·효과 가이드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1005-4136)에서 확인한다. Android 전체 테마와 실기기 검증은 포함하지 않는다. 문서 사이트 외곽의 Dark 테마와 제품 컬러 선택은 별개다.

## 9. 구현과 유지 관리

- 웹: `src/constants/designTokens.ts`, `src/constants/colorModes.ts`, `src/styles/design-system.css`, `src/styles/color-modes.css`.
- iOS: `ios/TasteBuddy/DesignSystem/TBTheme.swift`, `ios/TasteBuddy/Models/TasteModels.swift`. Light 원본을 유지하며 Dark 대표색·역할값은 모드별 팔레트에서 생성한다.
- Android 팔레트: `android/app/src/main/java/com/tastebuddy/android/domain/Models.kt`에서 신맛 #FFD600과 동일한 정수 흰색 혼합 계산·20% 배경을 사용한다. 전체 Android 의미 토큰 테마·실행을 검증한 것은 아니다.
- 플레이팅: `colorStyleGuideData.ts`, `ColorStyleGuideReference.tsx`, `ColorModeReference.tsx`, `ColorFoundationReference.tsx`, `ColorRoleExamples.tsx`. 모드 선택으로 원시값·역할·대비와 색상 상세값을 전환한다.
- Figma: 기존 변수를 재사용하고 Dark 값과 60개 모드별 단계 변수를 추가했다. 기존 Light 가이드 옆에 Dark 원시 팔레트와 양 모드 비교·역할 견본을 배치했다.
- 생성: `node scripts/build-color-modes.mjs`로 CSS와 `TBTheme.swift`의 COLOR MODES 영역을 갱신하고, `node scripts/build-plating-ios-foundations.mjs`로 Swift 소스 메타데이터를 갱신한다. `--check`는 CSS·Swift 생성본과 원본의 차이를 검사한다.
- 변경 순서: 역할·의존 항목 확인 → 코드와 Figma 변수·스타일 수정 → 파생 데이터 재생성 → 문서·예제 갱신 → 값·대비·렌더 확인. 원시 HEX 전체 치환은 하지 않는다. 새로운 미각 역할은 우선 10–95 팔레트의 한 단계를 참조하며, 다른 혼합 비율이 필요하면 원시 팔레트와 근거를 함께 확장한다.

이 검토에서 웹 힌트색을 #6F6F6F로 정렬하고, 빠져 있던 상태 Text/Soft·행동·딤 역할을 기존 iOS 값으로 추가했다. Figma 기본 아이콘은 #3F3F3F로 정렬했다. 기존 TB의 별도 성공·쓴맛·Dark 값은 전역 재색칠하지 않고 전환 규칙으로 분리했다.

근거 및 검증 결과: `output/plating/color-style-guide-20261007/`. 원본 읽기 스냅샷, 변경한 Figma ID, 색상 대응 및 대비 검사, 웹 렌더 확인을 보관한다. 실제 iOS/Android 기기에서 전체 화면을 실행한 검증은 포함하지 않는다.
