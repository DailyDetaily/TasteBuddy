# 기존 그래프 스타일 재사용

질문 카드의 원문 보기 대체 버튼만 나타나는 문제의 후속 수정은 [질문 카드 답변 수정](</Users/sinjunho/Desktop/Taste Buddy/output/question-inline-fix/review.md>)에 기록했다.

최신 요청의 기준선 제거·가로 트랙·질문 카드 수정과 검증은 [최종 수정 화면](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-question-review.md>)에 기록했다. 아래는 앞선 수정 이력이다.

## 이전 수정: 홈 그래프 아래 텍스트 제거

이어진 요청에 따라 홈 카드 그래프 아래의 기간·단위·범례·평가 양끝 문구를 제거했다. 카드 본문, 그래프 자체, 상세의 범주 선택 및 접근성 요약은 유지했다.

![현재 홈 그래프](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/no-caption-home.png>)

`no-caption-1`: iOS 빌드와 홈 → 평가 범주 → 원문 이동 UI 테스트 1개 통과, 실패 0개, 39.352초, xcodebuild 종료 코드 0. 캡처에서 네 그래프 밑의 텍스트 제거를 확인했다. 아래의 기존 전후 표는 이 텍스트 제거 직전의 스타일 수정 기록이다.


2026-09-13. 직전 홈·나의 입맛·질문 구현의 그래프 표현을 수정했다.

- 홈의 기존 `HomePeriodInsightSparkBars`에서 캡슐 막대와 원형 끝점을 `TasteChartBarMark`로 추출했다. 기존 기간 카드와 새 아카이브 카드·상세가 함께 사용한다.
- 시간 막대는 마지막 구간의 끝점, 5단계 평가 분포는 각 유효 범주의 끝점을 표시한다. 카드에 이미 지정된 `TasteAxis` 팔레트를 사용하며 평가 방향에 따라 색을 바꾸지 않는다.
- 메뉴·식당 구성은 같은 팔레트의 연한 색/주색으로 구분한다. 범주와 개수를 붙인 범례를 표시한다.
- 강도·호감 표는 실제 기록이 있는 셀에 해당 감각의 기존 표면색·글자색·테두리·원형 표시를 사용한다. 미각 축에 속하지 않는 속성은 중립색을 유지한다.
- `TasteLineChartMetrics`, `TasteRadarContract`의 기존 크기와 `tasteBloomChartReveal`을 재사용했다. 높이·좌표에 새 보간을 적용하지 않는다. 0건은 막대와 끝점을 그리지 않고, 작은 값의 끝점도 실제 막대 높이 안에 둔다.

집계 모델, 질문 저장, 원문 필터와 이동 경로는 그대로다. 원형 표시의 색은 긍정/부정 분류가 아니다. 기존 카드 외형과 큰 글자의 세로 배치를 유지한다.

이번 수정만의 코드 차이는 [design-changes.patch](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/design-changes.patch>)에 보존했다. 이 작업 시작 때의 4개 Swift 파일은 `source-before/`에 보존했다. 저장소 전체 diff에는 이전 작업도 포함되어 있다.

## 실제 화면 비교

동일한 7개 합성 음식 기록에 식사일이 확인된 QA 변형이다. 사용자의 실제 기록이 아니다. iOS 26.5, 402×874pt 시뮬레이터에서 캡처했다.

홈 캡처는 스크롤 중 식사 카드의 위쪽이 고정 검색창 뒤에 있다. 메뉴·식당·평가 카드 전체와 식사 막대 하단을 비교할 수 있다. 시간 막대 전체는 아래 큰 글자 캡처에서 확인했다.

### 홈 카드

| 수정 전 | 수정 후 |
| --- | --- |
| ![수정 전](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/before-home-question-02-four-charts.png>) | ![수정 후](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/after-home-question-02-four-charts.png>) |

### 5단계 평가 상세

| 수정 전 | 수정 후 |
| --- | --- |
| ![수정 전](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/before-home-question-03-category.png>) | ![수정 후](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/after-home-question-03-category.png>) |

### 강도·호감 표

| 수정 전 | 수정 후 |
| --- | --- |
| ![수정 전](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/before-analysis-question-02-matrix.png>) | ![수정 후](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/after-analysis-question-02-matrix.png>) |

### 큰 글자 설정

[시간 막대와 세로 카드 배치](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/after-home-question-large-02-chart.png>), [0건 범주와 필터 해제](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/after-home-question-large-03-zero-category.png>).

## 이번 수정의 검증

- `TasteBuddyMemoryQA` 빌드 및 `HomeTasteQuestionUITests` **3개 통과**, 실패 0개, XCTest 실행 168.809초, xcodebuild 종료 코드 0.
- 홈 질문 답변·취소 → 평가 차트 → 특정 범주 → 해당 음식 원문 이동.
- 접근성 최대 글자 크기에서 보류·차트 상세·0건 범주·필터 해제와 하단 탭의 조작 가능성.
- 레이더 결측/실제 강도 접근성 값 → 강도·호감 셀 3개 → 해당 근거 → 지정 음식 원문 이동.
- 캡처 검토: 7건 범주의 막대만 표시되고 나머지 네 범주는 0으로 남는다. 시간 막대 7개는 같은 높이이며 마지막 구간만 끝점이 있다. 같은 산미의 좋음/아쉬움 셀은 같은 팔레트이고 행 문구로 방향을 구분한다. 큰 글자에서는 그래프가 본문 아래에 배치된다.
- `git diff --check` 통과. 집계·저장 모델을 수정하지 않았으며 이전의 193개 단위·통합 테스트를 이번 디자인 후속 작업에서 재실행한 것으로 집계하지 않는다.

[실행 로그](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/ui-1.log>), [XCTest 결과](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/ui-1.xcresult>), [캡처 원본 목록](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/ui-1-attachments/manifest.json>).

실기기 및 실제 VoiceOver 음성 탐색은 이번 검증 범위에 포함하지 않는다.

재현: 저장소 루트에서 `bash scripts/verify-home-taste-questions.sh 54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4 ui graph-style-recheck`를 실행한다. 실행 전 `xcrun simctl list devices available`로 사용 가능한 목적지를 확인한다. 이 명령의 결과 경로는 기존 스크립트의 `output/home-taste-questions/`이며 위 결과는 동일한 xcodebuild 인자로 `output/graph-style-reuse/`에 저장했다.
