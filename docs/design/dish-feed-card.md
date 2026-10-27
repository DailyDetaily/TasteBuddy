# 디시 피드 카드

2026-10-09 · [Figma 디시 피드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1375-5834).

`Content/Card/DishFeed`(197:2262)는 `NativeDishFeedbackCard`를 표현하는 독립 컴포넌트다. `TasteBuddy/DiningResultCard`(9:250)는 식사 기록 완료 결과의 `미각 기록`·`빠른 기록` 두 상태만 포함한다. 피드를 결과 카드의 상태로 선택하지 않는다. 컴포넌트 페이지의 항목·원본·속성도 각각 분리했다.

디시 피드의 순서는 작성자 헤더 → 사진 레일 → 칩 그룹 → 미식 노트 → 구분선 → 소셜 액션과 날짜다. 바깥 패딩과 세로 간격은 12, 모서리는 20이다. 작성자 헤더는 32px 아바타, 14px 작성자·메뉴 문장, 12px 식당·상대 시점, 32px 옵션 영역 안의 18px 아이콘으로 구성한다.

- 사진은 기존 `Content/ImageBox` 정사각형 원본을 재사용하며, 피드에서는 144×144로 표시한다. 사진 간격은 8이다. 기본 디자인 표본에는 사진 한 개를 넣었고, 두 번째 사진 표시 옵션을 제공한다. 실제 네이티브는 사용자 기록에 속하는 미디어만 표시하며 미디어가 없으면 레일을 생략한다.
- 미각·상세 칩은 기존 `Content/ChipGroup` 두 인스턴스를 재사용한다. 내부 칩은 네이티브 `Chip(size: .small)`의 11px Medium, 좌우 패딩 10, 상하 패딩 6으로 맞춘다. 두 그룹 사이 간격은 6이다. 원본 태그가 없으면 해당 그룹을 숨긴다. 미각 칩은 줄바꿈을 허용하고 상세 칩은 한 줄에 표시한다.
- 미식 노트는 `미식 노트: `가 앞에 붙는 하나의 문단이다. 14px, 접두부 SemiBold·본문 Regular, 줄 간격 4, 패딩 12·모서리 12, 최대 네 줄이다.
- 하단은 기존 `Action/SocialActions`와 오른쪽 11px 날짜를 사용한다. 좋아요·댓글·공유 영역 높이는 32다. 날짜 문구는 호출부에서 제공하며 확인하지 않은 식사일을 생성하지 않는다.

기존 Light/Dark 피드 인스턴스와 이전 예시의 원본 ID 연결을 유지했다. 정사각형 ImageBox의 기본 296×296 크기는 유지하면서 내부 이미지를 부모 크기에 맞추어, 작은 피드 이미지가 다른 콘텐츠 영역까지 넘치지 않게 했다.

구조 기준은 `ios/TasteBuddy/Components/TBComponents.swift`의 `NativeDishFeedbackCard`, `DishFeedbackAuthorLine`, `DishFeedbackImageRail`, `DiningNotePreview`와 `IconActionButton.swift`의 `SocialActions`다. 실제 화면 호출은 `Features/Dining/DiningView.swift`에서 확인했다. 이번 수정은 Figma와 연결 문서 범위다. 사진·칩·수치는 합성 디자인 표본이며 제품 계정 데이터·저장·집계는 변경하지 않았다. 네이티브 실행 화면을 이번 작업에서 새로 캡처하지 않았으며 검증은 현재 SwiftUI 소스와 Figma 구조·Light/Dark 렌더 기준이다. 증거는 `output/dish-feed-figma-20261009/`에 있다.
