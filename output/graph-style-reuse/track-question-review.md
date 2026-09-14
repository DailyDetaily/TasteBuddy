# 그래프와 질문 카드 최종 수정

홈에서 완료 후 남은 질문 전체를 이어서 표시하는 최신 변경은 [홈의 남은 질문 연속 표시](</Users/sinjunho/Desktop/Taste Buddy/output/home-question-continuation/review.md>)에 기록했다.

후속 제보로 확인된 ‘원래 기록 보기/수정’만 나타나는 경로는 [질문 카드 답변 수정](</Users/sinjunho/Desktop/Taste Buddy/output/question-inline-fix/review.md>)에서 추가로 수정했다. 아래는 그 이전 수정과 검증 이력이다.

2026-09-13. 이어진 사용자 요청에 따라 기존 스타일과 질문 전체보기 흐름을 재사용했다.

- 세로 막대 아래의 회색 가로 기준선을 제거했다.
- 가로 막대는 연한 트랙, 2pt 그라데이션 선, 최대 12pt 원형 끝점으로 표시한다. 범주별 실제 비율과 상세 이동을 유지한다.
- 펼친 질문 카드 하단을 직접 답하는 선택 버튼으로 정리했다. 직접 선택지가 없는 질문에만 기존 기록 진입 버튼을 제공한다.
- ‘다른 확인할 기록 보기’를 제거하고 기존 ‘질문 전체보기 · N개’ 버튼으로 전체 질문 시트를 연다.

## 확인한 화면

iOS 26.5, 402×874pt 전용 QA 시뮬레이터에서 실제 SwiftUI 앱을 실행한 캡처다. 합성 음식 기록을 사용했으며 실제 사용자 기록이 아니다.

| 질문 카드 | 홈 그래프 |
| --- | --- |
| ![답변 선택지만 있는 질문 카드](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-home-question-01-scope.png>) | ![기준선 제거와 기존 가로 막대 스타일](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-home-question-02-four-charts.png>) |

홈 그래프 캡처에서는 스크롤 위치 때문에 식사 카드 제목 일부가 고정 검색창 뒤에 있다. 그래프 하단, 가로 트랙과 나머지 카드에서 요청한 변경을 확인했다.

| 기존 질문 전체보기 버튼 | 기존 전체 질문 시트 |
| --- | --- |
| ![질문 전체보기 버튼](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-home-question-see-all.png>) | ![전체 질문 시트](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-home-question-all-list.png>) |

전체보기 흐름은 11개 합성 음식 기록에서 생성한 질문 10개로 확인했다.

![큰 글자에서 세로로 배치한 답변 선택지](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-home-question-large-01-actions.png>)

## 검증

동일한 최종 제품 코드에 대해 다음 세 UI 사례가 각 실행에서 통과했다. 단일 실행의 전체 테스트 묶음이 모두 통과했다는 뜻은 아니다.

| 확인한 동작 | 실행 결과 |
| --- | --- |
| 일반 글자: 불필요한 질문 보조 버튼 부재, 답변 저장·실행 취소, 평가 범주에서 원문 이동 | `track-question-3`, test01 통과, 53.638초 |
| 큰 글자: 44pt 이상 선택 버튼, 실제 답변 저장, 차트 상세·0건 범주·필터 해제 | `track-question-4`, test02 통과, 49.730초, 실패 0개, xcodebuild 종료 코드 0 |
| 기존 전체보기 버튼에서 전체 질문 시트 이동 | `track-question-2`, test04 통과, 21.845초 |

최종 테스트 빌드(`track-question-test-build-2.log`)와 `git diff --check`가 통과했다. 해당 UI 실행 사이에 제품 코드를 추가 변경하지 않았다.

검증 도중 첫 실행은 현재 테스트 소스와 다른 이전 동작을 실행했고, 전용 QA 시뮬레이터 재시작·테스트 러너 재설치 후 현재 테스트를 실행했다. 이후 실행에서 XCTest의 반복 접근성 조회가 3.5초 실행 취소 토스트를 놓치고, 화면 밖 버튼을 누를 수 있다고 보고하는 문제가 있었다. 테스트의 토스트 좌표 탭과 보이는 영역 기준의 제한된 스크롤로 보정했다. 실행 2의 다른 사례는 실패했고, 실행 3은 test01 통과 후 큰 글자 스크롤 반복 때문에 중단했다. 마지막 실행 4에서 보정한 큰 글자 사례가 통과했다. 제품의 토스트 시간과 스크롤 동작은 변경하지 않았다.

이 시각 수정에서 기존 193개 단위·통합 테스트를 다시 실행하지 않았다. 실기기·운영 데이터·VoiceOver 음성 출력은 이번 검증 범위에 포함하지 않는다.

최신 요청에 해당하는 제품 코드 차이는 [track-question-changes.patch](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/track-question-changes.patch>)에 보존했다. 이전 그래프 변경과 검증은 [기존 검토 기록](</Users/sinjunho/Desktop/Taste Buddy/output/graph-style-reuse/visual-review.md>)에서 확인할 수 있다.
