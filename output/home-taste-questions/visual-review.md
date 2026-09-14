# 홈·나의 입맛·질문 실제 화면

2026-09-13 · iOS 26.5 · Taste Buddy Memory QA · 402×874pt

전후 비교는 같은 기기, 같은 기본 합성 7개 기록과 같은 시작 화면이다. 실제 식사일을 추가 확정하지 않았다. 사용자의 실제 기록이나 이미지가 아니다. 상태 표시줄 시각과 질문 ID에 따른 대체 일러스트는 달라질 수 있다.

[구현·Q1–Q18·검증 보고서](</Users/sinjunho/Desktop/Taste Buddy/docs/product/home-taste-questions-implementation.md>)

## 홈

정사각형 카드·가로 스크롤·질문 스택을 유지했다. 집계 단위를 정리하고, 펼친 질문에 부위·시점·인용·날짜의 확실성을 보여준다. 답변·원문 편집·비평가 보류가 같은 카드 안에 있다.

| 수정 전 | 수정 후 |
|---|---|
| ![수정 전](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/before-home.png>) | ![수정 후](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/after-home.png>) |

## 나의 입맛

기존 타입·인사이트 카드 형태를 유지했다. 완료 음식 기록과 관련 식사를 구분하고 직접 평가·반대 근거로 들어간다. 이 자료만으로 안정된 타입을 확정하지 않는다.

| 수정 전 | 수정 후 |
|---|---|
| ![수정 전](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/before-analysis.png>) | ![수정 후](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/after-analysis.png>) |

## 실제 UI 조작 검증

`ui-4.xcresult`: 3개 통과. 아래는 기본 합성 자료에 확인된 식사일을 명시한 QA 변형이다. 전후 기본 자료와 구분한다. 스크롤 화면은 캡처 당시 보이는 범위이며 화면 밖 내용을 합성하지 않았다.

### 홈의 네 아카이브 차트

![홈의 네 아카이브 차트](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/home-question-02-four-charts.png>)

### 전체 평가의 다섯 범주와 현재 필터

![전체 평가의 다섯 범주와 현재 필터](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/home-question-03-category.png>)

### 같은 출처의 강도–호감 3×3과 짝 미확인

![같은 출처의 강도–호감 3×3과 짝 미확인](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/analysis-question-02-matrix.png>)

### 매트릭스에서 연 2026년 9월 7일의 실제 합성 원본

![매트릭스에서 연 2026년 9월 7일의 실제 합성 원본](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/analysis-question-04-current-original.png>)

### 레이더 하단의 결측 축·척도·이전 비교 부족 상태

![레이더 하단의 결측 축·척도·이전 비교 부족 상태](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/analysis-question-01-radar.png>)

### 가장 큰 접근성 글자 크기의 질문 동작과 하단 탭

![가장 큰 접근성 글자 크기의 질문 동작과 하단 탭](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/home-question-large-01-actions.png>)

### 큰 글자에서 0건인 식사일 미확인 범주

![큰 글자에서 0건인 식사일 미확인 범주](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/home-question-large-03-zero-category.png>)
