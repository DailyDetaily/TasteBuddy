# 미니 히트맵

132 × 56 컨테이너. 한 칸은 하루, 가로 7열은 월–일이며 세로 행은 시간순 주 단위다. 직사각형 칸으로 컨테이너 전체 너비와 높이를 채운다. 칸 간격은 최대 2px, 칸 반경은 최대 2px다. 반경은 칸 너비·높이 절반을 넘지 않는다. 날짜가 많아지면 컨테이너에 맞춰 칸과 간격이 줄어든다.

`values`는 날짜순 기록량이며 `startDay`는 첫 날짜의 요일(월요일 0, 일요일 6)이다. Light에서 실제 날짜의 0개는 불투명 `taste/{axis}/tint/80`, 1·2·3개는 `taste/{axis}/tint/60·40·20`, 4개 이상은 `taste/{axis}/main`을 사용한다. 고정 구간이므로 기간 간 색의 의미가 같다. `null`·음수·비정상 값은 빈 윤곽으로 표시한다. 월 시작 전·종료 후 빈칸은 뉴트럴로 채운다. Light는 기존 #E4E4E4, Dark는 비교 캡슐과 같은 #454545다. 이 칸은 실제 날짜나 기록 0으로 집계하지 않는다.

예시는 2026년 10월 1–31일의 합성 데이터 하나다. 시작 요일은 목요일(startDay=3)이며 5행으로 배치한다. Figma는 같은 좌표와 토큰으로 만든 편집 가능한 컴포넌트다. 하단 문구는 기존 카드와 같은 11px/17px 스타일이며 크기 표기는 넣지 않는다. 제품의 웹·iOS 연결은 [데이터 컴포넌트 계약](data-component-contract.md)을 따른다.

- [Figma 기본 컴포넌트](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1089-3900)
- [Figma 예시](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1089-4083)
- [플레이팅](http://localhost:3001/design-system/components/mini-heatmap)

```tsx
<MiniHeatmap values={[0, 1, 2, 3, 4, 0, 2, 1, 3, 0, 4, 2, 1, 0]} axis="umami" startDay={0} />
```

다크 0값은 각 미각의 일반 tint/70(감칠맛 #49364A)이다. 1·2·3개는 일반 tint/50·30·10, 4개 이상은 미각 main이다. Figma의 taste/{axis}/heatmap/0…4 역할과 웹·iOS 셀·범례가 같은 고정 단계를 사용한다. 미확인·미래의 빈 윤곽에도 같은 뉴트럴 역할을 사용하며 0값과 합치지 않는다.
