# TCSBadge

2026-10-08 · 기존 웹 TCS 배지와 같은 규칙을 사용하는 iOS 공용 컴포넌트.

[Figma 예시](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1100-3894) · [원본 컴포넌트](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1100-3885) · [플레이팅](http://127.0.0.1:3001/design-system/components/tcs-badge)

| 항목 | 규칙 |
| --- | --- |
| 크기 | 높이 18px/pt, 너비는 문구에 맞춤 |
| 글자 | Pretendard Bold 10, 행 높이 14, 흰색 |
| 형태 | 좌우 패딩 6, 상하 2, 반경 6 |
| 색상 | 라이트 팔레트의 `taste.light` 75% + 흰색 25%. 라이트·다크에서 동일 |
| 그라데이션 | 135°, 입력 순서 유지, `abs(change)` 비율 |
| 경계 혼합 | `min(24%, 이전 구간 × 0.8, 다음 구간 × 0.8)` |
| 빈 데이터 | 0·비유한 가중치를 제외한 결과가 없으면 `#E0E0E0` |
| 비활성 | `disabledSurface`, 흰 글자와 입체 음영 유지 |

음수도 크기만 색 비율에 반영한다. 예를 들어 단맛 20·감칠맛 5의 경계는 72–88%다. 색은 최대 4개로 자르지 않으며 순서를 바꾸거나 같은 미각을 합치지 않는다.

활성 배지의 미각색·흰 글자·입체 음영·빈 데이터 색은 모드와 무관하게 유지한다. 비활성 배경만 현재 모드의 `disabledSurface`를 따른다.

## 사용

```tsx
<TCSBadge adjustments={[{ taste: "단맛", change: 20 }, { taste: "감칠맛", change: 5 }]} />
<TCSBadge disabled />
```

```swift
TCSBadge(adjustments: [
    .init(taste: .sweet, change: 20),
    .init(taste: .umami, change: 5)
])
TCSBadge(disabled: true)
```

기본 `label`은 `TCS`다. 웹은 숫자·퍼센트 문자열을 받고, iOS는 `TasteAxis`와 `Double`을 받는다. iOS는 상위 `.disabled`도 반영한다. 배지는 읽기 전용이며 조정의 부호·수치·준비 상태를 주변 문구로 함께 제공한다. 기존 흰 글자와 연한 배경은 보조 표식으로 유지하며 필수 상태를 배지만으로 설명하지 않는다.

## 원본과 연결

- 웹: `src/components/system/TCSBadge.tsx`, `tcsBadgeTokens.ts`, `src/constants/tasteColors.ts`.
- iOS: `ios/TasteBuddy/Components/DesignSystemFullComponents.swift`의 `TCSBadge`, `TCSBadgeGradient`, `TCSBadgeAdjustment`.
- Figma: `Example=Single/Pair/Triple/Empty × State=Default/Disabled`, Label 텍스트 속성, Light/Dark 색상 변수. Example은 합성 데이터 프리셋이며 제품 API의 외형 옵션이 아니다.
- 색상: `--tb-tcs-badge-{taste}`, `--tb-tcs-badge-label`, `--tb-tcs-badge-empty`. 비활성은 기존 `--tb-color-surface-disabled`를 참조한다.
- 음영: 웹의 외부 그림자 3개·내부 하이라이트/음영 4개를 유지한다. Figma는 `Elevation/TCSBadge`, iOS는 같은 오프셋·색·불투명도를 사용하며 CSS blur의 절반을 Gaussian radius로 적용한다.

웹의 다이닝 준비·이력 사용처는 유지한다. iOS 공용 타입과 디자인 시스템 예시를 제공하며 새로운 예약/TCS 제품 흐름은 추가하지 않는다.

초기 구현 검증 근거: `output/tcs-badge-20261008/`. iOS 전용 테스트 5개, 웹 그라데이션 테스트 4개, 독립 SwiftUI 표본 6개를 확인했다.

활성색 고정 후 검증 근거: `output/tcs-badge-20261008/fixed-color/`. 웹 타입 검사와 브라우저의 6개 미각 토큰·활성 그라데이션 동일성 확인, iOS 앱 빌드가 통과했다. SwiftUI 표본 6개를 갱신했고 라이트·다크 배지 내부 비교에서 최대·평균 채널 차이는 모두 0이었다. 비활성 배경은 웹에서 라이트 `#EFEFEF`, 다크 `#313131`로 유지된다. XCTest 재실행은 별도 SelectionCard 테스트의 `indicatorTopPadding` 참조 컴파일 오류로 중단되어 새 통과 결과로 간주하지 않는다. 실제 계정의 TCS 동작이나 VoiceOver 조작 검증은 별도다.
