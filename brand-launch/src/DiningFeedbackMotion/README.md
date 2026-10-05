# 식후 피드백 모션

전체 이름과 사용처는 [모션 시스템](../../../docs/design/motion-system.md)에 정리한다.

## 소스 스플래터 · Sauce Splatter

결과 칩의 연결 등장 패턴 이름은 **소스 스플래터** (`sauce-splatter`)다. 작은 원이 캡슐로 커지고, 가로 오버슛 때 높이가 살짝 눌리며, 정점 전에 다음 원이 메타볼처럼 돋아나 분리된다. `MetaballChipRow.tsx`와 `chip-motion.ts`가 구현 원본이며 코드 식별자는 유지한다.

현재 `TabBar-CameraEntry-Portrait`의 맛 반응·상세 태그 줄에 적용한다. 두 칩 기준 1.3초이며 각 줄은 두 선택이 준비된 뒤 시작한다. `FeedbackCard`의 `chipEntrance`를 생략한 기존 플립·캐러셀은 정적 칩을 유지한다. 네이티브 앱에는 이 패턴을 아직 이식하지 않았다.

## 독립 결과 카드 영상

Studio의 `Dining-Feedback` 폴더:

- `DiningFeedback-Flip`: 중앙 카드 한 장의 좌우 플립 전환
- `DiningFeedback-Result`: 여섯 결과 카드 + 3색 그라데이션
- `DiningFeedback-Card`: 동일한 캐러셀, 투명 배경
- `DiningFeedback-Gradient`: 카드 전환과 동기화된 배경만

모든 컴포지션은 1920×1080, 30fps다. 캐러셀 세 컴포지션은 기본 15초로 여섯 카드를 순환한다.
참고 영상 `/Users/sinjunho/Desktop/download.mp4`처럼 2.5초마다 한 칸씩 이동한다.
느린 출발 → 중간에서 빠른 이동 → 부드러운 감속의 cubic-bezier(0.9, 0, 0.1, 1)을 사용한다.
원본 첫 주기의 카드 사이 경계를 60fps로 추적한 곡선이며, 분석은 `output/dining-feedback-reference/motion-analysis.json`에 저장했다.
스튜디오에서 유지 시간, 스크롤 시간, 주변 카드 불투명도, 카드 간격, 배경 속도, 정지 카드, 각 카드 내용을 조절한다.
기본값 저장을 지원하도록 등록과 기본값은 `src/Root.tsx`에 직접 명시했다.

여섯 카드를 한 줄로 배치하고 화면 밖에서 순환시킨다. 모든 카드는 290×500pt로 동일하며 크기 변화가 없다. 모든 카드의 기본 불투명도는 100%다. 주변 카드 불투명도를 낮추면 중앙 카드로 이동할 때 부드럽게 강조된다.
활성 카드의 메인·보조·세 번째 컬러가 배경에 함께 반영된다. 마지막 카드는 첫 카드로 이어지고 첫·끝 프레임의 카드 위치와 배경이 일치한다.
`정지`를 고르면 지정한 카드를 중앙에 놓고 배경을 고정한다.

## 좌우 플립 버전

`DiningFeedback-Flip`은 한 장의 카드를 중앙에 두고 세로축(Y축)으로 회전시킨다.
기존 `HomePeriodInsightMotion`의 가감속 곡선과 접힘 0.32초 / 펼침 0.48초를 사용한다.
기존 카드가 ±90도로 접힌 순간 다음 카드로 바뀌고, 반대쪽 ±90도에서 정면으로 펼쳐진다.
카드는 모두 290×500pt, 불투명도 100%이며 미리 로드되어 교체 시 사진 로딩을 기다리지 않는다.

기본 유지 1.5초, 계속 왼쪽으로 전환, 30fps 기준 414프레임(13.8초) 루프다.
유지·접힘·펼침 시간과 플립 방향(왼쪽 / 오른쪽 / 좌우 번갈아)을 Studio에서 편집한다.
3색 그라데이션도 다음 카드의 팔레트로 전환되며 배경 속도는 2다.
플립의 마지막 오리 콩피 카드는 `주색 영역 비중` 0.80을 사용한다. 기본 0.56보다 지방맛 색상 덩어리를 넓히고 두 보조색을 줄인다. 카드 전환 중 비중도 부드럽게 보간한다.
플립 기본값은 캐러셀과 별개로 저장되므로 기존 캐러셀 설정에 영향을 주지 않는다.
검증 프레임은 `output/dining-feedback-flip/`에 있다.

## 디시와 배경

기존 `public/brand/dish-topviews`의 이미지 여섯 장을 사용한다. 사진은 1:1로 보여 원본 탑뷰를 자르지 않는다.

| 파일 | 예시 메뉴 | 메인 컬러 |
| --- | --- | --- |
| dish-19.png | 단호박 라비올리 | 단맛 · #FF9900 |
| dish-12.png | 시트러스 타르트 | 신맛 · #FBC02D |
| dish-16.png | 구운 관자와 리크 | 쓴맛 · #95C900 |
| dish-18.png | 캐비아 타르틀렛 | 짠맛 · #7299FF |
| dish-20.png | 조개와 버섯 브로스 | 감칠맛 · #B372B4 |
| dish-15.png | 오리 콩피 | 지방맛 · #95867A |

메뉴·반응·미식 노트와 맛 매핑은 시각 자료를 위한 예시다. 실제 식사 기록이나 사진으로 검증한 맛을 뜻하지 않는다.

식당명은 영상용으로 만든 가상 이름이다: 오르토 루체, 리에르 테이블, 메종 네리브, 마레 앤 포레, 비스트로 루벨. 실제 매장이나 방문 기록을 나타내지 않는다. 시트러스 타르트의 출처는 `직접 만든 요리`로 표기한다.

각 카드의 `메인 컬러`, `보조 컬러`, `세 번째 컬러`와 카드 문구는 별도로 편집할 수 있다.

## 네이티브 기준과 모션

- `DiningView.swift`: `DiningFeedbackResultCard`, `DiningFeedbackResultBackground`, `DiningFeedbackResultLayout`
- `TasteModels.swift`: 여섯 미각 mainColor
- `TBTheme.swift`: 카드 표면·텍스트·경계 색상
- `SystemParityComponents.swift`: `TasteChip` xs
- `NativeLayoutComponents.swift`: `TBOverflowTagRow`

카드 290×500pt, 내부 여백 12pt, 모서리 20pt, 반응 칩과 상세 태그 `+N`, 미식 노트를 유지했다.
배경의 blob 형태와 sin/cos 이동은 네이티브를 바탕으로 하되 주색과 서로 다른 두 보조색을 섞는다.
프레임에서 카드 위치와 색상 혼합률을 함께 계산한다. 반복 경계에서는 배경의 시간 위상도 일치시킨다.
2D 가로 배치와 스크롤 곡선은 이 영상에 추가한 연출이다. React/CSS 구현이므로 네이티브 blur·shadow·모서리 렌더링과 차이가 있을 수 있다.
네이티브 소스 변경의 자동 동기화는 없다.

## 검증

- `npm run lint`
- `node --test scripts/dining-feedback-carousel.test.mjs scripts/dining-feedback-flip.test.mjs`
- 렌더 프레임: `output/dining-feedback-reference-motion/`

테스트는 여섯 이미지·색상, 레이어별 동일 설정, 머무는 시간, 참고 영상 곡선과의 위치 차이, 역방향 이동 방지, 카드 불투명도, 첫·끝 프레임 위치, 정지 모드와 다른 재생 시간의 경계를 확인한다.
MP4 출력은 별도 렌더 작업이다.
