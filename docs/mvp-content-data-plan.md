# Taste Buddy MVP 콘텐츠 데이터 구축 계획

## 1. 왜 이 작업이 필요한가

지금 앱은 화면 구조와 DB 구조는 잡혀 있지만, 실제 서비스가 되려면 아래 두 가지가 추가로 필요하다.

1. 운영 데이터
- 어떤 레스토랑이 있는지
- 어떤 셰프가 있는지
- 어떤 코스와 디시가 있는지

2. 미각 해석 데이터
- 각 디시가 어떤 taste / perceptual signal을 가질 가능성이 있는지
- 사용자가 왜 그런 반응을 보였는지 설명할 근거가 무엇인지

즉, 이제부터는 "앱 개발"과 별도로 "서비스 데이터 제작"이 필요하다.

## 2. 반드시 필요한 데이터 묶음

### A. 운영 카탈로그 데이터

앱에서 바로 보여주는 기본 데이터다.

- `restaurants`
  - 이름
  - slug
  - 도시
  - 소개 문구
  - 활성 상태

- `chefs`
  - 셰프 이름
  - 레스토랑 연결
  - 짧은 소개
  - 프로필 이미지 경로

- `dish_entities`
  - 디시 공개 이름
  - 공개 부제
  - 코스 위치
  - 시즌 라벨
  - 활성 상태

이 데이터가 있어야 앱에서 레스토랑, 셰프, 메뉴를 "실제 서비스처럼" 보여줄 수 있다.

### B. 공개 정보 리서치 데이터

이 데이터는 "사실"을 저장하는 층이다.

- `source_documents`
  - 메뉴 페이지
  - 기사
  - 인터뷰
  - 리뷰
  - SNS 포스트

- `dish_observed_facts`
  - 공개된 재료
  - 공개된 조리 기법
  - 온도감
  - 감각 키워드
  - 코스 위치

중요한 원칙:
- 여기에는 확인 가능한 사실만 넣는다.
- 비공개 레시피를 사실처럼 넣지 않는다.

### C. 디시 추론 데이터

이 데이터는 "가설"을 저장하는 층이다.

- `dish_inference_profiles`
  - `taste_vector`
    - sweet, sour, bitter, salty, umami, fat
  - `perceptual_vector`
    - brightness, heaviness, cleanFinish, linger, smoke, aromaIntensity, textureRichness, thermalImpact
  - confidence
  - rationale
  - uncertainty_notes

예시:
- "금태 + 버터 소스 + 조개 육수"는
  - `umami` 높음
  - `fat` 높음
  - `linger` 높음
  - `cleanFinish`는 낮아질 가능성

### D. 연구 기반 규칙 데이터

이 데이터는 "왜 이런 추론을 하는지"의 기준이다.

- `research_rules`
  - sweet suppresses bitterness
  - sodium reduces bitterness
  - umami synergy
  - high fat needs relief
  - smoke can mask detail
  - temperature modulates taste

이 규칙은 AI가 임의로 결론을 내리기보다, 추론을 더 일관되게 만드는 안전장치 역할을 한다.

### E. 사용자 학습 데이터

이 데이터가 쌓여야 진짜 개인화가 시작된다.

- `measurement_sessions`
- `measurement_results`
- `feedback_submissions`
- `feedback_items`
- `feedback_parses`
- `user_learned_deltas`

이 영역은 사용자가 실제로 측정하고, 실제 식후 피드백을 남겨야 쌓인다.

## 3. 무엇을 수작업으로 만들고, 무엇을 AI 보조로 만들까

### 수작업이 필요한 것

초기에는 사람이 직접 확인해야 한다.

- 레스토랑 목록 선정
- 셰프 이름과 소속 확인
- 코스명 / 디시명 정리
- 출처 URL 수집
- 공개 메뉴 설명 정리
- fact / inference 구분 검수

이유:
- 잘못된 레스토랑/셰프/디시 정보는 서비스 신뢰도를 크게 떨어뜨린다.

### AI 보조가 적합한 것

AI는 아래 작업에서 속도를 높일 수 있다.

- 공개 텍스트에서 재료/기법/감각 키워드 추출
- 리뷰 여러 개를 한 포맷으로 요약
- 디시의 taste / perceptual vector 초안 생성
- 사용자 자유서술 피드백을 태그화
- 설명 문구 생성

### AI에 맡기면 안 되는 것

- 비공개 레시피를 사실처럼 확정
- 셰프 의도를 단정
- 사용자 민감도를 AI가 멋대로 변경
- 근거 없는 taste vector 저장

## 4. MVP에서 추천하는 작업 순서

### 1단계. 운영 카탈로그 만들기

처음에는 5~10개 레스토랑, 2~4개 코스, 20~40개 디시 정도면 충분하다.

필수 컬럼:
- restaurant
- chef
- public_title
- course_position
- season_label

### 2단계. 공개 정보 리서치

디시마다 최소 2개 이상의 출처를 모은다.

우선순위:
1. 공식 메뉴
2. 셰프 인터뷰
3. 기사
4. 리뷰
5. SNS

### 3단계. observed facts 입력

예:
- ingredients
- techniques
- sensory_words
- temperature

### 4단계. inferred profile 생성

초기에는 사람이 검수하는 AI 보조 방식으로 한다.

저장 원칙:
- confidence 반드시 저장
- rationale 반드시 저장
- evidence_ids 반드시 저장

### 5단계. research rules 적용

디시 프로필이 너무 임의적이지 않게 규칙을 함께 반영한다.

### 6단계. 사용자 피드백이 쌓이면 learned layer 반영

이때부터 진짜 개인화가 시작된다.

## 5. 데이터 상태 라벨

모든 데이터는 아래 3가지 상태로 구분하는 것이 좋다.

- `observed`
  - 공개 소스에서 확인된 사실
- `inferred`
  - 공개 정보 + 규칙 + AI 보조로 만든 가설
- `learned`
  - 실제 사용자 반응으로 검증된 패턴

이 구분이 없으면 나중에 어떤 데이터가 사실이고 어떤 데이터가 추정인지 구분이 안 된다.

## 6. MVP에서 현실적인 데이터 수량

처음부터 너무 크게 잡지 않는 것이 좋다.

- 레스토랑: 5~10
- 셰프: 5~10
- 디시: 30~60
- source_documents: 디시당 2~4개
- research_rules: 6~12개
- feedback tags: 10~20개

이 정도면 MVP에서 충분히 "서비스처럼 보이는" 수준까지 갈 수 있다.

## 7. 운영 기준

### 사실 검수 기준

- 공식 메뉴에 적혀 있으면 `observed`
- 인터뷰/기사에서 셰프가 직접 언급하면 `observed`
- 리뷰어 표현만 있으면 `observed + 낮은 confidence` 또는 `inferred`
- 추정된 조리법/레시피 비율은 `inferred`

### confidence 기준 예시

- 공식 메뉴: `0.9 ~ 1.0`
- 셰프 인터뷰: `0.8 ~ 0.95`
- 기사: `0.7 ~ 0.85`
- 리뷰: `0.55 ~ 0.75`
- AI 추론만 있는 경우: `0.4 ~ 0.65`

## 8. 실제 작업 담당 분리

### 운영/기획

- 어떤 레스토랑부터 넣을지 선정
- 어떤 수준까지 공개 정보를 쓸지 기준 정리
- fact / inference 검수

### 콘텐츠 리서치

- 메뉴, 기사, 인터뷰, 리뷰 수집
- source_documents 작성
- dish_observed_facts 정리

### AI 보조 파이프라인

- observed facts 추출 초안
- inference profile 초안
- feedback text tagging 초안

### 앱/백엔드

- Supabase 입력 도구
- seed import
- 조회 화면 연결

## 9. 지금 바로 필요한 다음 액션

### 바로 시작할 것

1. MVP 대상 레스토랑 5곳 선정
2. 각 레스토랑당 대표 코스 1개 선정
3. 코스별 대표 디시 4~6개 정리
4. 각 디시의 source_documents 2개 이상 수집
5. observed / inferred seed JSON 작성

### 이 단계가 끝나면 가능한 것

- 홈/예약/셰프 화면을 실제 콘텐츠 기반으로 교체
- 식후 피드백과 디시 특성을 연결
- 설명 문구를 실제 디시 근거 기반으로 생성

