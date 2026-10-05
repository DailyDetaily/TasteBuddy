# 플레이팅 모션 시스템 · Plating Motion

**플레이팅(Plating)**은 Taste Buddy의 디자인 시스템이고, **Plating Motion**은 그 안의 움직임 규칙이다. 입력에 응답하고, 정보의 관계를 정돈하고, 의미가 드러나는 순간을 강조한다. 기본 값 → 동작 역할 → 키프레임 → 연출 패턴의 네 층으로 관리한다.

## 기준과 네이밍

| 층 | 정의 | 기준 파일 |
| --- | --- | --- |
| 기본 값 | 시간·간격·이동량·스케일·이징 | `src/constants/designTokens.ts`의 `MOTION_TOKENS` |
| 동작 역할 | `press`, `feedback`, `content`, `sheet`, `bloom` | `src/constants/platingMotion.ts`의 `PLATING_MOTION_ROLES` |
| 키프레임 | 시작·중간·종료 상태와 각 구간의 보간 | 같은 파일의 `PLATING_MOTION_RECIPES` |
| 연출 패턴 | 블룸 프레임·소스 스플래터 및 아래 카탈로그 | 각 Remotion 원본과 이 문서의 계약 |

웹 키프레임과 CSS 클래스는 `plating-{대상}-{동작}`으로 명명한다. 예: `plating-content-enter`, `plating-sheet-exit`, `plating-result-bloom`. 코드에서 고르는 이름은 `contentEnter`, `sheetExit`, `resultBloom`이다. 기존 `--tb-*`, `TBMotion`, `TasteBloomMotion` 및 컴포지션 ID는 유지한다. iOS의 `PlatingMotion`은 기존 타입의 별칭이다.

### 곡선과 시간

- **웹 기본**: 상태 변경 `ease`, 등장 `cubic-bezier(0.22, 1, 0.36, 1)`, 퇴장 `ease-out`. 키프레임 구간마다 적용한다.
- **iOS 기본**: 네이티브 `Spring(duration:bounce:)`, bounce `0.18`. 역할의 체감 시간과 `settlingDuration`을 구분한다. 고정 CSS 곡선으로 대체하지 않는다.
- **결과 카드 블룸**: 기존 웹의 `860ms + 120ms 지연`, `cubic-bezier(0.18, 0.92, 0.2, 1)`을 보존한다. `bloom` 역할의 720ms와 별도다.
- **브랜드 연출**: 블룸 프레임은 구간별 `smoothstep(t) = t²(3−2t)`, 소스 스플래터는 ω=14, ζ=0.58인 기존 감쇠 스프링을 쓴다. 하나의 기본 이징으로 합치지 않는다.
- **순차 등장**: 기본 간격 60ms. 신규 웹 프리셋의 추가 지연은 최대 240ms로 제한한다. 이는 새 웹 기본값이며 기존 iOS 대기 카드나 Remotion 타임라인의 간격을 변경하지 않는다.
- **시계**: 웹은 ms, iOS·Remotion 원본은 s. 영상의 프레임은 `round(seconds × fps)`로 마지막에 환산한다. 30fps의 60ms는 정확한 정수 프레임이 아니므로 프레임 수를 원본 시간 대신 저장하지 않는다.

## 키프레임 계약

각 프리셋은 `id`, 역할, 시작 조건, 적용 범위, `durationMs`, `delayMs`, 이징, 기준점, `frames`를 가진다. 각 프레임은 `offset`(0–1), 상태 이름과 속성 값을 가진다. 0%와 100%를 명시하고, 중간에 빠진 속성은 앞뒤 키프레임 사이에서 보간한다. 기준점은 별도 래퍼에 적용해 컴포넌트의 레이아웃 transform과 충돌하지 않게 한다.

| 프리셋 | 시간 / 지연 | 시작 → 종료 |
| --- | --- | --- |
| `pressIn` / `pressOut` | 각각 120 / 0ms | scale 1 ↔ 0.98; 누름과 해제는 각각의 이벤트 |
| `feedback` | 180 / 0ms | opacity 0 → 1, scale 0.9 → 1; 선택 표시·상태 없는 아이콘 |
| `contentEnter` | 300 / 0ms | opacity 0 → 1, y 8px → 0 |
| `contentExit` | 300 / 0ms | opacity 1 → 0, y 0 → −8px |
| `questionEnter` | 500 / 0ms | opacity 0 → 1, y −20px → 0, scale 0.97 → 1; 위쪽 기준 |
| `sheetEnter` / `sheetExit` | 각각 500 / 0ms | 시트 자신의 높이 100% ↔ 0; 아래쪽 기준 |
| `chartReveal` | 500 / 0ms | 왼쪽에서 표시 마스크 열기; 최종 수치·좌표 고정 |
| `resultBloom` | 860 / 120ms | 아래의 기존 웹 결과 카드 4개 키프레임 |

### 결과 카드 블룸의 실제 키프레임

| 구간 | 지연 포함 시각 | 상태 | opacity | y | scale | blur |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| 0% | 120ms | 응축 | 0 | 24px | 0.88 | 8px |
| 46% | 515.6ms | 봉우리 | 1 | −4px | 1.018 | 0 |
| 72% | 739.2ms | 복귀 | 앞뒤 보간 | 1px | 0.996 | 앞뒤 보간 |
| 100% | 980ms | 안착 | 1 | 0 | 1 | 0 |

이 프리셋은 기존 `.dining-result-card-bloom`에 연결되어 있다. CSS와 Web Animations 프리뷰는 같은 원본에서 생성된다. 기존 halo 연출은 별도 레이어로 보존한다. 나머지 웹 프리셋은 iOS의 상태·거리 규칙을 웹용으로 정의한 공통 라이브러리이며, 모든 제품 화면의 이식이 완료되었다는 뜻은 아니다.

### 인터럽트·접근성·데이터

- 실행 횟수는 기본 1회, 종료는 최종 상태 유지(`fill: both`). 누름 유지시간·토스트 읽기시간·서버 대기시간을 모션 duration에 섞지 않는다.
- 사용자의 다음 입력을 기다리게 하지 않는다. 상태 전환 시 이전 Animation을 취소하고, 제스처가 있으면 해당 플랫폼의 연속 상태/속도를 사용한다. 정적 진입 프리셋을 제스처 엔진으로 사용하지 않는다.
- 동작 줄이기는 지연과 이동·확대·블러를 생략하고 같은 최종 상태를 즉시 표시한다. 루프도 중지한다. 숨겨진 탭·프리뷰는 재생을 멈추고 unmount 시 animation과 프레임 콜백을 정리한다.
- opacity·마스크는 유효 범위를 유지한다. 차트는 최종 데이터 위에 마스크만 적용하며 데이터 값에 오버슈트를 주지 않는다. 의미 없는 0을 양수처럼 만들지 않는다.
- 퇴장 완료 후 DOM 제거·포커스 복귀·`inert` 처리는 시트/컨트롤의 책임이다. opacity 0인 상태만으로 상호작용이 제거되었다고 가정하지 않는다.

## 사용과 프리뷰

웹 원본을 바꾸면 `npm run design:motion`으로 `src/styles/plating-motion.css`를 생성한다. 생성 파일은 직접 수정하지 않는다. `npm run test:motion`은 CSS 동기화, 종료 상태·동작 줄이기, 플랫폼 역할 및 시퀀스 주요 시점을 검사한다.

```tsx
// CSS: 한 번의 정적 진입. 반복 실행은 클래스/요소 생명주기를 관리한다.
<div className="plating-content-enter">...</div>

// Web Animations: 시스템 접근성 값을 전달하고 이전 실행과 unmount를 정리한다.
const { keyframes, options, origin } = getPlatingMotion('questionEnter', {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  index: 1,
});
element.style.transformOrigin = origin;
const animation = element.animate(keyframes, options);
// 해당 상태를 떠나거나 컴포넌트를 제거할 때 animation.cancel();
```

접근성 설정 변경도 반영해야 하는 지속 컴포넌트는 `matchMedia`의 change를 구독한다. 실제 예시는 `PlatingMotionSection.tsx`다. CSS 클래스는 media query 변경을 자동으로 반영한다. CSS 클래스와 Web Animations를 같은 래퍼에 중복 적용하지 않는다.

```swift
// 기존 tasteBloomMotion modifier와 동일한 네이티브 구현.
withAnimation(PlatingMotion.animation(.content, reduceMotion: reduceMotion)) {
    isExpanded.toggle()
}
```

`/design-system#motion`에서 10개 웹 프리셋을 재생·일시정지·탐색하고, 0.25×/0.5×/1× 속도와 30/60fps 환산, 시스템 또는 수동 동작 줄이기를 확인한다. 브랜드 패턴의 시점 표는 원본 코드의 랜드마크이며 웹 기본 샘플이 해당 브랜드 연출을 렌더링하는 것은 아니다.

## 기존 모션 카탈로그

정리 기준: 2026-09-30의 현재 소스와 Remotion 등록 목록. 이름, 동작, 사용처를 찾기 위한 카탈로그다. 화면 비율·해상도·예시 데이터·정지 상태만 다른 컴포지션은 같은 모션의 변형으로 묶는다. 이번 정리는 소스 확인이며 전체 영상의 재검수나 네이티브 적용 완료를 뜻하지 않는다.

## 시스템의 구성

- **기본 동작 역할**: 누름, 선택 피드백, 콘텐츠 전환, 시트, 블룸. iOS의 시간·스프링 원본은 [TasteBloomMotion.swift](../../ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift), 적용 규칙은 [TasteBloomMotion](taste-bloom-motion.md)에서 관리한다.
- **이름 있는 표현 패턴**: 블룸 프레임, 소스 스플래터처럼 형태와 순서가 정해진 모션. 아래에 확정 이름과 현재 구현 범위를 기록한다.
- **브랜드·데이터 시각화**: 로고, 아바타, 분석 그래픽, 카테고리 등의 독립 시퀀스. 각 소스 폴더가 타임라인과 데이터 의미의 기준이다.

웹 일반 UI의 CSS 시간·이징은 [DESIGN.md](../../DESIGN.md)의 Motion Tokens를 따른다. iOS 기본 스프링, 웹 토큰, Remotion의 개별 연출 곡선은 서로 다른 구현이므로 하나의 시간값으로 간주하지 않는다.

| iOS 기본 역할 | 체감 시간 | 용도 |
| --- | ---: | --- |
| `press` | 120ms | 버튼 누름과 복귀 |
| `feedback` | 180ms | 선택, 칩, 탭, 짧은 피드백 |
| `content` | 300ms | 카드 정리, 단계·기간 교체 |
| `sheet` | 500ms | 시트, 질문 펼침, 그래프 등장, 지도 초점 |
| `bloom` | 720ms | 기록 진입, 결과 카드, 심벌 강조 |

위 시간은 네이티브 스프링의 체감 시간이다. 실제 안착 시간 및 아래 시퀀스의 전체 길이와 다르다.

## 소스 스플래터 · Sauce Splatter

- **시스템 식별자**: `sauce-splatter`
- **확정 이름**: 소스 스플래터 / Sauce Splatter. 앞서 논의한 Sauce Spread, Sauce Drizzle은 사용하지 않는다.
- **용도**: 결과 카드의 맛 반응 칩과 상세 태그가 서로 이어지며 등장하는 패턴.
- **현재 적용**: Remotion `TabBar-CameraEntry-Portrait`의 오른쪽 결과 카드. 네이티브 앱 이식은 아직 이 패턴의 적용 범위에 포함하지 않는다.

### 동작과 필수 규칙

1. 작은 원이 나타나고, 실제 라벨 너비에 맞는 캡슐로 가로 확장한다.
2. 가로 오버슛 순간 높이를 기본의 86%까지 살짝 눌러 탱글한 탄성을 만든다.
3. 앞 칩의 오버슛 정점 전에 오른쪽 가장자리에서 다음 칩의 원이 돋아난다.
4. 두 형태 사이의 메타볼 연결부가 가늘어지며 떨어진 뒤 다음 원이 캡슐로 확장한다.
5. 텍스트의 비율은 유지하고, 정착 후 원래 칩의 크기·색·테두리로 돌아온다.

칩 몸체와 연결부는 하나의 실루엣으로 합성한다. 연결부에 겹친 테두리나 진한 색 이음새를 만들지 않는다. 기본 칩 선택 반응과 구분되는 **등장 연출**이며, 다른 선택 칩 전체에 자동 적용하지 않는다.

### 현재 타이밍

한 줄의 시작을 0초로 계산한다.

| 시점 | 상태 |
| --- | --- |
| 0.00s | 첫 원 등장 |
| 0.12s | 첫 원이 캡슐로 확장 시작 |
| 0.28s | 두 번째 원이 앞 칩에서 돋아남 |
| 약 0.40s | 첫 칩의 가로 오버슛·높이 압축 정점 |
| 0.50s | 두 번째 원의 연결 해제 완료, 캡슐 확장 시작 |
| 1.30s | 두 칩의 연속 등장 완료 |

기본 3화면 영상에서는 두 선택이 모인 뒤 줄 단위로 시작한다. 맛 반응은 약 23.183초, 상세 태그는 약 32.633초다. 이 시각은 영상 앞부분의 길이를 바꾸면 함께 달라진다. 세 번째 이후의 시작은 `chipStart(index)`가 정하며, 두 번째 이후 0.38초 간격이다.

구현 이름은 기법을 설명하는 `MetaballChipRow`를 유지한다. 디자인 이름과 코드 이름은 아래처럼 연결한다.

- 렌더러: [MetaballChipRow.tsx](../../brand-launch/src/DiningFeedbackMotion/MetaballChipRow.tsx)
- 타이밍·형태·연결부: [chip-motion.ts](../../brand-launch/src/DiningFeedbackMotion/chip-motion.ts)
- 완성 칩: [ResultChip.tsx](../../brand-launch/src/DiningFeedbackMotion/ResultChip.tsx)
- 사용처: [Card.tsx](../../brand-launch/src/DiningFeedbackMotion/Card.tsx), [FeedbackFlow.tsx](../../brand-launch/src/TabBarCameraEntry/FeedbackFlow.tsx)
- 기존 검증 코드: [chip-metaball.test.mjs](../../brand-launch/scripts/chip-metaball.test.mjs)

`FeedbackCard`에 `chipEntrance={{ reactions: secondsSinceTasteRowReady, details: secondsSinceDetailRowReady }}`를 전달한다. 각 값은 해당 줄이 준비된 뒤의 경과 초이며, 준비 전에는 음수다. 속성을 생략하면 정적인 칩을 표시한다.

## 블룸 프레임 · Bloom Frame

- **시스템 식별자**: `bloom-frame`
- **용도**: 흰 심벌에서 사진을 담는 결과 카드로 이어지는 등장 패턴.
- **현재 적용**: Remotion `TabBar-CameraEntry-Portrait`의 오른쪽 결과 카드.
- **순서**: 흰 여섯 꽃잎 → 속이 빈 O → 둥근 카드 외곽 → 사진 영역으로 커지는 안쪽 빈 공간 → 블러가 풀리는 사진.

원본 심벌 경로를 유지하고, 꽃잎이 합쳐질 때 모서리는 둥글게 이어진다. 카드는 중앙에서 정면을 유지한 채 확장한다. 메뉴 이름은 첫 제목으로 바로 표시한다.

현재 꽃잎 합체는 0.38–0.60초, 카드 외곽 확장은 0.64–0.94초다. 내부 빈 공간은 외곽보다 0.06초 뒤인 0.70–1.00초에 사진 프레임으로 확장한다. 사진 전체는 1.02초에 나타나고 0.34초 동안 블러 14→0으로 선명해진다. 전체 진입 길이는 1.66초다.

소스: [ResultCardReveal.tsx](../../brand-launch/src/TabBarCameraEntry/ResultCardReveal.tsx), [result-card-geometry.ts](../../brand-launch/src/TabBarCameraEntry/result-card-geometry.ts), [result-card-motion.ts](../../brand-launch/src/TabBarCameraEntry/result-card-motion.ts).

## 현재 구현된 모션 목록

소스에서 확인한 모션을 아래 13개 묶음으로 정리했다. 블룸 프레임과 소스 스플래터 외 항목은 기존 이름 또는 동작 설명이며, 이번에 새 브랜드 이름을 확정한 것은 아니다.

| 묶음 | 종류와 움직임 | 현재 소스 / 대표 Studio ID |
| --- | --- | --- |
| **블룸 프레임** | 심벌 합체 → O 확장 → 카드·사진 프레임 → 블러 해제 | [TabBarCameraEntry](../../brand-launch/src/TabBarCameraEntry/README.md) · `TabBar-CameraEntry-Portrait` 안에 포함 |
| **소스 스플래터** | 원 → 캡슐, 납작한 오버슛, 다음 원의 메타볼 분리 | [DiningFeedbackMotion](../../brand-launch/src/DiningFeedbackMotion/README.md) · 같은 3화면 영상 안에 포함 |
| **기록 버튼·카메라 진입** | 버튼 내부 컬러 흐름·눌림, 버튼 중심 블룸 확장, 카메라 초점 전환 | [TabBarPlusButton](../../brand-launch/src/TabBarPlusButton/README.md), [TabBarCameraEntry](../../brand-launch/src/TabBarCameraEntry/README.md) · `TabBar-PlusButton`, `TabBar-CameraEntry-Portrait` |
| **카드 전환** | 좌우 Y축 플립, 가로 캐러셀, 인사이트 카드 순차 펼침·접힘 | [DiningFeedbackMotion](../../brand-launch/src/DiningFeedbackMotion/README.md), [HomePeriodInsightMotion](../../brand-launch/src/HomePeriodInsightMotion/README.md) · `DiningFeedback-Flip`, `DiningFeedback-Result`, `DiningFeedback-Card`, `HomePeriodInsightCard` |
| **결과 배경** | 세 컬러 덩어리의 유동 그라데이션, 활성 카드·선택 맛에 따른 팔레트 전환 | [Background.tsx](../../brand-launch/src/DiningFeedbackMotion/Background.tsx) · `DiningFeedback-Gradient` 및 결과 카드 영상 |
| **그래프** | 캡슐 막대의 순차 성장·수축, 꺾인 선을 따르는 끝점 이동, 선이 끝점으로 모이는 퇴장 | [GraphMotion](../../brand-launch/src/GraphMotion/README.md) · `TasteGraph-Bar`, `TasteGraph-Bar-Home`, `TasteGraph-Bar-Distribution`, `TasteGraph-TasteChange`, `TasteGraph-TasteChange-Reference` |
| **꽃잎·로고** | 꽃잎 3D 펼침·회전·역접힘, 작도 그리드 전개, 워드마크 획 끝부터 채움 | [PetalLogo](../../brand-launch/src/PetalLogo/README.md), [LogoGrid](../../brand-launch/src/LogoGrid/README.md) · `TasteBuddy-Petal-Shorts`, `LogoGrid`, `Logo-Black` 및 HD·비교 버전 |
| **키네틱 타이포** | Kalice 획 채움, 문구 유지와 교체 | [KineticStatements](../../brand-launch/src/KineticStatements/README.md) · `Kinetic-Statements` 및 Square·Portrait |
| **Taste Bloom 아바타** | 꽃 펼침·접힘, 중심에서 바깥으로 파동, 프로필 유형 전환, 값·형태 조절 시연 | [TasteBloomAvatars](../../brand-launch/src/TasteBloomAvatars/README.md), [Workbench](../../brand-launch/src/TasteBloomWorkbench/README.md) · `TasteBloom-9`, `TasteBloom-Wave`, `TasteBloom-Profile`, `TasteBloom-Profile-Landscape`, `TasteBloom-Controls-Demo` |
| **Taste Motion** | 분석, 디테일 매트릭스, 회전 레이어, 피드백 링, 인사이트 링의 5스타일과 연결 시퀀스 | [TasteMotion.tsx](../../brand-launch/src/TasteMotion.tsx), [설명](../../brand-launch/README.md) · `Onboarding-analysis`, `Onboarding-detailMatrix`, `TasteMotion-rotatingLayers`, `TasteMotion-feedbackRings`, `TasteMotion-insightRing`, `TasteMotion-analysisToRotation`, `TasteMotion-completeFlow` |
| **카테고리 시각화** | 경험·감각·취향·맥락·변화의 5종, 점의 해체·교차 이동·재조립 전환 | [TasteDataCategoryMotion](../../brand-launch/src/TasteDataCategoryMotion/README.md) · `TasteData-*`, `TasteCategory-*`, `TasteCategory-Collection` |
| **미각 버블 맵** | 버블 순차 진입, 선택 확대·주변 밀어내기, 지도 이동·줌아웃, 외곽부터 소멸 | [TasteBubbleMapMotion](../../brand-launch/src/TasteBubbleMapMotion/README.md) · `TasteBubbleMap`, `TasteBubbleMap-Idle`, `TasteBubbleMap-Reduced` |
| **음식 이미지 전환** | 여섯 디시 탑뷰 이미지의 유지·디졸브 | [DishTopviews](../../brand-launch/src/DishTopviews/index.tsx) · `DishTopviews-Sequence` |

등록 진입점은 [Root.tsx](../../brand-launch/src/Root.tsx)와 각 폴더의 `index.tsx`다. `TasteBuddyLaunch`와 `Scenes`의 여섯 장면은 앱 소개 영상의 편집 구성으로 함께 보존한다. 화면 비율, 회전 레이어의 3×3 조합, 카테고리의 빈 데이터·정지·밀집 등의 예시는 별도 모션 종류로 중복 계산하지 않았다.

### 플랫폼과 보관본 구분

- 블룸 프레임과 소스 스플래터는 현재 Remotion 연출이다. 공통 iOS `bloom` / `feedback` 역할이 있다는 사실만으로 두 패턴의 네이티브 이식이 완료된 것은 아니다.
- 로고 스플래시에는 [웹 SplashLogo](../../src/components/graphics/SplashLogo.tsx)와 [iOS SplashView](../../ios/TasteBuddy/Features/Launch/SplashView.swift)가 별도로 존재한다. 카테고리 시각화에도 [iOS 구현](../../ios/TasteBuddy/Features/Gastronomy/TasteDataMotionView.swift)이 있다. 이번 작업에서는 실행을 재검증하지 않았다.
- 별도 BX Plan 사이트의 로컬 `public/motion-library.js`에는 14개 미디어 항목이 있다. 이 목록은 영상 자산 목록이며 최신 Studio 목록과 같지 않다. 예를 들어 `LogoGrid-Dynamic`은 사이트 목록에 남아 있지만 현재 Studio 등록은 제거되어 있고 이전 소스·출력만 보관된다.
- 플레이팅 명명과 공통 키프레임 등록은 기존 컴포지션 ID, Remotion 수식 또는 BX 사이트 배포본을 바꾸지 않는다. Android 공통 모션 런타임의 이식·실행 검증은 이 웹/iOS 명명 작업의 완료 범위에 포함하지 않는다.
