# 미니 버블 차트

2026-10-08 · 132 × 56px. 원의 면적으로 항목별 값을 비교한다. 위치·거리·순서는 수치 축이나 관계를 표현하지 않는다.

원의 지름은 값의 제곱근에 비례한다. 예를 들어 값 4와 16은 면적이 1:4, 지름은 1:2다. 가장 큰 원은 최대 56px이며, 항목이 많아 너비를 넘으면 모든 원을 같은 비율로 축소한다. 원은 겹치지 않고 입력 순서대로 가운데 높이에 배치하며 묶음 전체를 우측 정렬한다. 기본 원 사이 간격은 4px다.

이 스케일은 한 그래프 안의 상대 비교용이다. 서로 다른 그래프의 원 크기로 절댓값을 비교하지 않는다. 색은 항목 식별을 위한 `taste/{axis}/tint/40`이며 값의 크기를 나타내지 않는다. 각 원 중앙에 숫자 값을 표시한다. 숫자는 Pretendard Medium, 기본 10px이며 작은 원이나 긴 숫자에서는 원 안에 맞도록 줄인다. 글자색은 text/primary 토큰을 사용한다. 항목명은 범례와 접근성 설명으로 함께 제공한다.

0은 면적이 없으므로 원을 그리지 않는다. null·음수·비정상 값도 그리지 않으며 접근성 설명에서는 미확인으로 구분한다. 양수 값에 최소 원 크기를 강제로 적용하지 않는다.

```tsx
<MiniBubbleChart items={[
  { id: 'home', label: '집밥', value: 9, axis: 'umami' },
  { id: 'out', label: '외식', value: 16, axis: 'sweet' },
]} />
```

3개 숫자 견본의 한식 3은 `bitter`(초록), 양식 8은 `sweet`(주황), 중식 18은 `umami`(보라)다. 2026-10-12 트리맵과 함께 분류 색상을 맞췄다.

플레이팅·Figma 견본은 합성 데이터다. 웹·iOS 제품 연결은 아래 데이터 계약을 따른다.

- [플레이팅 예시](http://localhost:3001/design-system/components/mini-bubble-chart)
- [Figma · 2개 항목](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1098-3846)
- [Figma · 3개 항목](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1098-3850)

2026-10-09: [Content/Chart/MiniBubble](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1346-1918) 한 세트로 정리했다. `Display=숫자 2개`(1098:3846), `Display=숫자 3개`(1098:3850), `Display=아이콘 3개`(1159:4080)를 선택한다. 기존 원본 ID·값·면적·색상·아이콘과 모든 인스턴스 연결을 유지한 Figma 구성 변경이다. 웹·iOS API와 실제 집계는 변경하지 않았다.

Figma의 버블 설명·Light/Dark 견본은 `04 Patterns`의 [미니 그래프 전체 목록](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1356-4629)에 있다. `03 Components`에서는 다른 미니 그래프와 함께 대표 항목 하나로 안내한다.

제품 연결: 웹·iOS 아카이브 상세에서 이번 달 음식 출처별 실제 요리 기록 수를 표시한다. [데이터 계약](data-component-contract.md)을 따른다.


## 음식 아이콘 버전

`content="icon"`과 항목별 `dishKindId`를 전달하면 숫자 대신 기존 음식 SVG 아이콘을 표시한다. 기본 `content="value"`는 숫자다. 원의 면적·위치·색상은 두 버전에서 동일하다. 아이콘은 최대 16px, 원 지름의 60% 이내로 축소한다. 알 수 없는 아이콘 ID는 일반 점 표시로 대체하고 항목명과 값은 범례·접근성 설명에 보존한다.

```tsx
<MiniBubbleChart content="icon" items={[
  { id: 'seafood', label: '해산물', dishKindId: 'seafood', value: 9, axis: 'salty' },
  { id: 'meat', label: '육류', dishKindId: 'meat', value: 16, axis: 'umami' },
  { id: 'noodle', label: '면류', dishKindId: 'noodle', value: 6, axis: 'sweet' },
]} />
```

제품의 ‘이번 달 음식 종류’ 모드는 계정 원본에 등록된 음식 분류를 집계한다. 같은 기록의 같은 분류는 한 번만 센다. 여러 분류가 있는 기록은 각 종류에 포함되므로 합계가 요리 기록 수보다 클 수 있다. 건수 내림차순·분류 ID 오름차순으로 상위 3개를 표시하고 미분류 수를 따로 안내한다. 미각색은 분류의 실제 미각을 추론하지 않는다.

웹은 `DISH_KIND_ICON_NODES`, iOS는 동기화된 `DishKind-*` 벡터 자산, Figma는 같은 SVG 경로를 사용한다.
[Figma 음식 아이콘 버전](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1159-4080).


## 비교 항목 수

버블은 2–3개 항목의 단순 크기 비교에 사용한다. 기존 6개 합성 예시는 별도 [미니 트리맵](mini-treemap-chart.md)으로 옮겼다. 제품의 기존 버블·음식 아이콘 호출부는 유지한다.
