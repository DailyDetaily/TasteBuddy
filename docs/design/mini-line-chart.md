# 미니 라인 그래프

2026-10-07 · 미각 변화 카드의 기존 `TasteLineChart`를 독립 예시로 추가했다.

옅은 미각색 트랙, 얇은 그라데이션 라인, 현재 값의 원형 노드가 같은 경로를 따라 표시된다. 웹 미각 변화 카드는 `TasteInsightSummaryCard.tsx`, iOS는 `SystemParityComponents.swift`의 `TasteInsightSummaryCard`가 기존 `TasteLineChart`를 사용한다. 기존 컴포넌트를 재사용하며 웹·Figma의 그라데이션은 아래 규칙을 따른다.

- 독립 미니 그래프 컨테이너는 132 × 56px/pt다. 내부 행은 56px/pt다. 여러 계열은 행 간격 4를 제외한 높이를 균등하게 나눈다.
- 옅은 트랙 두께 12, 그라데이션 라인 2, 현재 원형 노드 지름 12.
- 트랙과 얇은 라인은 모두 둥근 끝·둥근 연결(`strokeCap=ROUND`, `strokeJoin=ROUND`)을 사용한다. Figma에서 경로를 다시 지정한 뒤에도 이 값을 명시해 캡슐 끝이 각지게 돌아가지 않도록 한다. 그래프와 미각 변화 카드의 지표 행은 캡 끝을 잘라내지 않는다. 원본 높이 56pt와 카드 내부 높이 52pt를 모두 확인한다.
- 라이트 모드의 옅은 미각 트랙은 바 그래프와 같은 불투명 `palette.chartTrack` 토큰이다. main에 투명도를 곱하지 않는다. iOS는 `axis.chartTrackColor`, Figma의 `mini-chart/line-track`은 `taste/{axis}/lineChart/track`을 참조한다. 감칠맛은 `#F0E3F0`이다. 모든 미각 트랙은 `tint/80`(미각색 20% + 흰색 80%)을 참조한다.
- 라이트 모드의 얇은 라인 그라데이션은 웹·iOS·Figma에서 왼쪽 미각색 30%의 불투명 `tint/70`에서 오른쪽 `main` 100%로 이어진다. `COMPONENT_TOKENS.miniChart.lineStartTint = 70`이며 감칠맛 시작색은 `#E8D5E9`다. Figma는 `mini-chart/line-start → taste/{axis}/lineChart/start → primitive/taste/{axis}/tint/70`을 사용한다. iOS도 공통 라인 색상 함수로 같은 `tint/70 → main`을 사용한다. Remotion의 기존 생성 스냅샷은 별도 자산이다. 웹·Figma의 얇은 라인과 작은 과거 점은 그래프 전체 x=0…132를 기준으로 같은 그라데이션을 공유한다. 각 점 안에서 그라데이션을 다시 시작하지 않고 동일한 x의 선과 작은 점은 같은 색으로 이어진다. 큰 현재 노드는 Light에서 기존 그라데이션, Dark에서 main 단색을 사용한다.
- 웹·iOS 과거 노드는 지름 4, 현재 노드는 지름 12다. 과거 점은 각 관찰의 x를 유지하면서 라운드 경로 위의 y에 놓는다.
- 같은 차트 안의 계열은 공통 척도를 사용한다. 웹은 폭에 맞춰 최근 점을 선택하고 iOS는 기존 저장 이력 개수 제한을 유지한다. 실제 카드와 미니 예시는 132 너비 안에서 표시할 점의 간격을 균등하게 나눈다.

```tsx
<MiniLineChart entries={[
  { id: 'umami', taste: '감칠맛', values: [1.2, 2.1, 2.4, 4.5] },
]} label="최근 감칠맛 변화: 1.2, 2.1, 2.4, 4.5" />
```

[플레이팅 예시](/design-system/components/mini-line-chart)는 기존 그래프와 실제 미각 변화 카드 컴포넌트를 함께 보여준다. [기존 미니 그래프 페이지](/design-system/components/mini-chart)의 바 그래프 예시 바로 아래에도 배치했다. 예시 데이터는 합성 값이다.

[Figma 기본 컴포넌트](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=820-3657)도 기존 막대 컴포넌트 바로 아래에 위치한다.

56px 높이 전체에 맞춘 R 6의 [미니 영역 차트](mini-area-chart.md)를 라인 그래프 바로 아래에 배치했다.

실제 그래프 너비는 컨테이너와 같은 132px다. 미니 컴포넌트는 `plotWidth={132}`를 전달해 점 간격을 펼친다. 라인은 양끝 캡 반경 6px를 포함해 132px이고, 영역 면은 x=0부터 x=132까지 채운다.

2026-10-11 · 실제 웹·iOS `TasteInsightSummaryCard`도 `plotWidth=132`를 명시한다. 웹 카드의 그래프 칸은 줄어들지 않는 132px로 고정하며, iOS 미니 예시와 기록 상세도 같은 너비를 전달한다. 두 점 이상이면 중심점은 x=6…126, 트랙은 둥근 끝을 포함해 x=0…132다. 한 점만 있으면 과거 값을 만들지 않고 현재 점만 오른쪽에 표시한다. iOS의 `showsPendingHistory` 대기 표시는 기존 왼쪽 현재 점과 오른쪽으로 흐려지는 장식 트랙을 유지한다. 빈 비교 표시·행 높이·곡선 라운드·색상·원본 이력 선택은 그대로다.

## 상승·하강 두 계열

네이티브 `TasteInsightSummaryCard.summaryDetails`의 상승 1개·하강 1개 표시 구조를 참고한 compact 예시다. 단일 그래프 옆에 추가하며 공통 척도로 두 흐름을 보여준다.

- 전체 132 × 56px 안에 26px 행 두 개와 4px 간격을 배치한다.
- 기본 두께와 동일하게 옅은 캡슐 12px, 라인 2px, 현재 점 12px, 과거 점 4px.
- 두 계열 모두 전체 132px 기준의 그라데이션을 선과 점에 공유한다. 라이트는 `tint/70 → main`, 다크는 아래 전용 색상 역할을 사용한다.
- 계열별 점 중심은 행 내부 y=6~20 범위에 놓여 캡슐과 현재 점이 56px 밖으로 넘치지 않는다.
- `compact`는 두 계열용이다. 미니 그래프의 전체 높이는 계열 수와 관계없이 56px다.
- 네이티브 원본은 24pt 행·4pt 간격·12pt 캡슐·2pt 라인이며 두 계열 높이는 52pt다. 미니 그래프와 기록 상세 라인은 56pt로 표시하며, 기존 미각 변화 전용 행의 높이는 유지한다.

```tsx
<MiniLineChart compact entries={[
  { id: 'umami', taste: '감칠맛', values: [1.2, 2.1, 2.4, 4.5] },
  { id: 'bitter', taste: '쓴맛', values: [0.8, -0.6, -1.4, -2.8] },
]} label="감칠맛 상승과 쓴맛 하강: 합성 데이터" />
```

[Figma 상승·하강 컴포넌트](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=901-3685).

## 다크 모드 선과 트랙의 대비 — 2026-10-10

얇은 선과 원형 노드의 과한 밝기를 낮추고 어두운 캡슐 트랙은 밝게 올렸다. 다른 차트의 색상을 바꾸지 않도록 라인 전용 `taste/{axis}/lineChart/{track,start,end}` 역할을 사용한다. 기존 6개 미각의 불투명 틴트 팔레트를 재사용하며 투명도로 조절하지 않는다.

| 역할 | 라이트 Web/iOS/Figma | 다크 Web/iOS/Figma | 감칠맛 다크 |
| --- | --- | --- | --- |
| 캡슐 트랙 | tint/80 | tint/70 | `#49364A` |
| 얇은 선·작은 점 시작 | tint/70 | tint/60 | `#583E59` |
| 얇은 선·작은 점 끝 / 큰 현재 노드 | main | main | `#B372B4` |

Figma의 라이트 primitive에 고정됐던 그라데이션 시작점을 모드별 별칭으로 교체했다. 작은 과거 점은 기존 전체 너비 기준 그라데이션을 공유한다. 네이티브 현재 노드는 끝점 색을 사용하고, 과거 점은 얇은 라인과 같은 전체 너비 그라데이션을 공유한다. 네이티브 라이트 시작색도 tint/70으로 통일한다. 다크의 선·작은 점은 tint/60 → main이며 큰 현재 점은 main이다. `TasteChartTrackMark`와 한 점만 있는 대기 트랙에도 같은 다크 색상 역할이 적용된다.

웹 `TasteInsightSummaryCard → TasteLineChart`, 기록 화면의 기존 `RecordChartsPanel` 호출 및 iOS의 같은 표시 경로를 유지한다. 데이터 단위·기간·계정 범위·집계·저장소·로딩/빈 상태 처리는 변경하지 않는다. 수치와 연결 계약은 [데이터 컴포넌트 계약](data-component-contract.md)을 따른다. 라인 2, 트랙 12, 현재 점 12, 과거 점 4 및 경로·클리핑은 그대로다.

2026-10-12 정리: 선명한 공통 원색을 적용하고 다크 트랙 tint/70 · 선과 작은 점 tint/60 → main · 큰 원형 노드 main으로 Figma·웹·iOS를 일치시켰다. 배경용 틴트와 그래프 역할은 분리한다.

빈 비교 그래프의 Figma 시작점도 웹·iOS의 `M6 12H126` 경로에 맞췄다. 트랙은 두께 12의 둥근 끝을 포함해 x=0…132, 얇은 선은 두께 2의 둥근 끝을 포함해 x=5…127이다. 선의 중심 경로는 양쪽 모두 x=6…126이며, 현재 원형 노드는 cx=126·r=6이다. 원본 `.Card/Comparison/Empty`를 수정해 라이트·다크 카드에 함께 전파한다. 색상·데이터·제품 코드는 변경하지 않았다.

## 꺾임 라운드 — 2026-10-11

- 웹 `roundedLinePath.ts`와 iOS `TasteLineRounding`은 전체 좌표에서 중심선 반경 12의 원호를 먼저 계산한다. 12px/pt 트랙의 안쪽 경계는 반경 6으로 둥글게 연결된다. 단순 round join과 구분한다.
- 꺾임 각도를 θ라 할 때 양쪽 접선 거리 = min(12 × tan(θ/2), 앞 변 길이/2, 뒤 변 길이/2). 짧은 변에서는 반경을 함께 줄여 라운드가 겹치지 않게 한다. 직선·한 점·빈 입력에는 꺾임을 만들지 않는다.
- 배경과 얇은 선은 같은 고정 경로를 사용한다. 웹/Figma의 과거 점은 원래 x에 대응하는 라운드 경로 위에 배치한다. 현재 점과 양끝 좌표, 기록 값, 척도, 점 개수와 색상·두께는 유지한다. iOS도 과거 점을 같은 라운드 경로 위에 표시한다.
- Remotion의 개별 라인·전환 영상·카드 라인도 같은 경로를 사용하며, 애니메이션은 경로를 변형하지 않고 표시 길이만 바꾼다.
- Figma `Content/Chart/MiniLine`(820:3657), `MiniLinePaired`(901:3685)의 기존 ID·키와 색상 변수 연결을 유지한 채 경로를 갱신한다. 연결된 TasteChange 및 라이트·다크 요약 카드에 상속된다. Figma는 원호와 접선이 같은 cubic 표현을 사용한다.
- 데이터 계약은 기존 그대로다. 미각 변화는 기존 프로필 이력, 기록 상세 라인은 현재 계정의 최근 4일 요리 기록 집계를 사용한다. 이 변경은 경로 표현만 바꾸며 저장소·집계·로딩/빈 상태·계정 전환 처리와 영역 차트를 바꾸지 않는다.

로컬 검증 명령: `node --test scripts/test-chart-width-parity.mjs scripts/test-web-mini-chart.mjs scripts/test-rounded-line-path.mjs scripts/test-web-record-chart-data.mjs scripts/test-web-record-chart-loader.mjs scripts/test-web-record-chart-render.mjs`. 실제 카드 렌더의 고정 폭·실제 Swift 배치 헬퍼·공통 모서리 기하 비교, 기존 저장/복원/수정/삭제 및 계정 격리를 모의 저장소에서 검사한다.

2026-10-12 · iOS 작은 과거 점 보완: 기존 TasteLineChart에 4pt 과거 점을 추가하고 웹 roundedLineMarkers와 같은 계산을 사용한다. 원본의 시점별 x는 유지하고 필렛 원호 위의 y에 배치한다. 점과 2pt 선은 같은 그라데이션을 사용하므로 다크에서는 tint/60에서 미각 main으로 이어진다. 큰 현재 점은 main 단색이다. 넓은 12pt 배경은 tint/70, 현재 점은 12pt를 유지한다. 빈 데이터와 한 점 대기에는 과거 점을 만들지 않는다.
