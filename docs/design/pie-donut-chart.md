# 파이 차트

기본 예시와 썸네일은 기존 구성비 예시인 집밥 50%·외식 33.3%·배달 16.7%를 사용한다.

조각과 범례의 색상은 불투명 `taste/{axis}/tint/40` 토큰을 사용한다. 웹과 Figma 모두 같은 모드별 틴트 토큰을 참조한다.

2026-10-08 · 컨테이너 132 × 56px, 파이 56 × 56px 우측 정렬. 중앙 구멍 없이 조각이 중심까지 채워지는 파이 차트다.

## 모양

첨부 이미지의 파이 형태에 맞춰 조각 사이 경계는 직선으로, 바깥 모서리는 넉넉하게 둥글게 처리하고 중심 쪽 R은 작게 분리한다. 중앙에 별도 구멍을 만들지 않으며 단일 항목이나 100% 뉴트럴 영역은 꽉 찬 원이다.

파이는 132 × 56px 컨테이너의 오른쪽에 정렬한다. 그래프 자체는 56 × 56px이며 x=76이다. 바깥 R 상한은 약 6.51px, 조각 간 간격은 약 1.75px다. 원본 32px 파이의 전체 비율을 균등하게 확대한다.

안쪽 R은 조각 각도별로 계산한다. 이전보다 둥글기를 늘려 원호 길이 상한은 약 8.25px, 둥글림으로 끝이 후퇴하는 깊이는 최대 2.45px로 조정한다. 좁은 조각에 원호 길이 기준만 적용해 끝이 지나치게 밀려나는 것을 막는다.

`R = min(원호 길이 / |π − 각도|, 최대 후퇴량 × sin(각도/2) / (1 − sin(각도/2)), 사용 가능한 공간의 상한)`으로 계산한다. 현재 예시의 안쪽 R은 10% 약 1.10px, 20% 약 3.50px, 30% 약 6.56px, 40% 약 13.13px다. 50%는 중심 경계가 직선이므로 안쪽 원호가 필요 없다.

데이터의 각도 비율은 그대로 유지하며 시작 경계는 이미지처럼 12시 방향이다.

직선과 원호가 접하는 지점을 계산해 매끄럽게 연결한다. 웹과 Figma는 동일한 경로를 사용한다.

## 데이터와 사용

서로 겹치지 않는 분류의 구성비에 사용한다. 미각 강도처럼 독립적인 값을 합계 100%로 바꾸지 않는다. 각 조각에 할당한 각도는 원본 값의 비율을 유지한다. 곡선으로 비워지는 면이 있으므로 채워진 픽셀 면적은 정확한 수치 비율이 아니다. 항목명·값·백분율을 범례에 함께 제공한다.

기본 `mode="relative"`는 값의 합계로 구성비를 계산한다. 0·음수·비정상 값은 조각을 생성하지 않는다. 합계가 0이면 빈 윤곽을 표시하고 “기록 없음”으로 읽는다.

`mode="absolute"`는 각 value를 100 기준 백분율로 사용한다. 10·30·20이면 각 조각은 10%·30%·20%, 남은 40%는 불투명 `color/chart/remainder`다. Light #E4E4E4 / Dark #A3A3A3이며 Figma·웹·iOS의 남은 영역과 해당 범례가 같은 역할을 사용한다. 모두 0이면 전체가 뉴트럴 색의 꽉 찬 원이다. 합계 100 초과·음수·비정상 입력은 빈 윤곽과 접근성 오류 설명으로 표시하며 다시 정규화하지 않는다.

```tsx
<PieDonutChart size={56} segments={[
  { id: 'home', label: '집밥', value: 18, axis: 'umami' },
  { id: 'out', label: '외식', value: 12, axis: 'sweet' },
  { id: 'delivery', label: '배달', value: 6, axis: 'bitter' },
]} label="집밥 50%, 외식 33.3%, 배달 16.7%" />
```

`size`의 기본값은 56다. `axis`는 미각 팔레트 색을 선택한다. 예시는 합성 데이터이며 실제 기록을 집계하거나 저장하지 않는다.

## 구현과 연결

- [플레이팅 예시](http://localhost:3001/design-system/components/pie-donut-chart)
- [Figma 기본 컴포넌트](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=908-3700)
- [Figma 절대값 예시](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=908-3722)
- `src/components/system/plating/PieDonutChart.tsx`
- `src/components/system/plating/symbolDonutGeometry.ts`

웹과 Figma는 같은 cubic 경로를 사용한다. 원본 심볼 파일은 수정하지 않았다. 제품의 웹·iOS 연결은 [데이터 컴포넌트 계약](data-component-contract.md)을 따른다.

```tsx
<PieDonutChart mode="absolute" segments={[
  { id: "home", label: "집밥", value: 10, axis: "umami" },
  { id: "out", label: "외식", value: 30, axis: "sweet" },
  { id: "delivery", label: "배달", value: 20, axis: "bitter" },
]} />
```
