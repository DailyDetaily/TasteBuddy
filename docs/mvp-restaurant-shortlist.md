# Taste Buddy MVP 레스토랑 선정안

확인 기준일: 2026-03-29

아래 shortlist는 `한국 파인다이닝 미각 데이터셋 MVP`를 만들기 위한 시작 후보군이다.

## 선정 기준

### 1. 공개 정보가 충분히 있는가
- 공식 소개
- 메뉴 소개 또는 코스 설명
- 기사/인터뷰/리뷰

### 2. 코스 구조가 명확한가
- amuse / starter / fish / main / dessert처럼 단계가 분리되어야 한다
- 그래야 디시 단위 미각 반응을 추적하기 쉽다

### 3. 미각적으로 구분되는 시그니처가 있는가
- 발효
- 장
- 해산물 감칠맛
- 지방감/정리감
- 디저트 산미/단맛

### 4. 서로 다른 스타일을 포함하는가
- 전통 기반 모던 한식
- 현대적 Korean Contemporary
- 발효 중심
- 창의적 해석

### 5. MVP에서 다루기 쉬운가
- 서울 중심
- 코스형 서비스
- 출처 확보 가능

## 추천 시작 5곳

### 1. Mingles
- 추천 우선순위: `P1`
- 이유:
  - 공식/권위 출처에서 디시 설명이 비교적 풍부하다
  - 장, 해산물, 농축 감칠맛, 디저트 해석 등 미각 축이 뚜렷하다
  - Taste Buddy의 `발효 풍미`, `감칠맛`, `피니시` 설명에 잘 맞는다
- 집중 포인트:
  - umami
  - fermentation
  - jang-driven finish
  - layered Korean tasting structure
- 시작 권장 디시 수:
  - 5~6개
- 출처:
  - Michelin Guide restaurant page

### 2. Onjium
- 추천 우선순위: `P1`
- 이유:
  - 전통 Korean aesthetics와 court cuisine research 기반 설명이 명확하다
  - 역사성, 계절성, 절제된 표현을 가진 디시 분석에 적합하다
  - "강한 자극보다 정제된 전달" 유형의 미각 데이터 구축에 좋다
- 집중 포인트:
  - clean finish
  - seasonal reinterpretation
  - balance over intensity
- 시작 권장 디시 수:
  - 4~5개
- 출처:
  - Michelin Guide restaurant page

### 3. Jungsik
- 추천 우선순위: `P1`
- 이유:
  - 글로벌 인지도가 높고, 한식 요소를 현대적으로 전환하는 예시가 분명하다
  - banchan, abalone, duck, reinterpretation 등 미각 설명 포인트가 많다
  - 앱의 대표 예시 레스토랑로 쓰기 좋다
- 집중 포인트:
  - modern reinterpretation
  - familiar Korean references
  - progression from banchan to main
- 시작 권장 디시 수:
  - 5~6개
- 출처:
  - Michelin Guide restaurant page

### 4. 7th Door
- 추천 우선순위: `P2`
- 이유:
  - 발효와 숙성을 핵심 테마로 전면에 내세워 서비스 메시지와 잘 맞는다
  - `fermentation and aging` 자체가 Taste Buddy의 특이사항/세부 미각 설명과 연결되기 쉽다
- 집중 포인트:
  - fermentation
  - aging
  - chef intent
  - seventh taste concept
- 시작 권장 디시 수:
  - 4~5개
- 출처:
  - Michelin Guide restaurant page

### 5. Eatanic Garden
- 추천 우선순위: `P2`
- 이유:
  - seasonal main element 중심 설명 방식이 디시 entity 만들기에 유리하다
  - Korean Contemporary로서 시각적/서사적 요소와 미각 요소를 함께 설명하기 좋다
- 집중 포인트:
  - seasonal ingredient spotlight
  - modern Korean technique
  - card-based course explanation
- 시작 권장 디시 수:
  - 4~5개
- 출처:
  - Michelin Guide restaurant page

## MVP 우선순위 제안

### 1차 입력
- Mingles
- Onjium
- Jungsik

이 3곳부터 시작하면 된다.

이유:
- 서로 다른 스타일을 확보할 수 있다
- 앱에 이미 일부 예시 문구가 맞물리기 쉽다
- 공개 설명 기반 디시 프로파일 만들기가 상대적으로 쉽다

### 2차 확장
- 7th Door
- Eatanic Garden

이유:
- 발효/숙성, seasonal element 같은 특성 축을 더 풍부하게 만들 수 있다

## 실제 제작 단위

레스토랑 하나를 이렇게 쪼개서 입력한다.

1. `restaurant`
2. `chef`
3. `source_documents` 2~4개
4. `dish_entities` 4~6개
5. `dish_observed_facts`
6. `dish_inference_profiles`

즉, 레스토랑 1곳을 완성하려면:
- source 2~4개
- dish 4~6개
- fact row 12~30개
- inference row 4~6개

정도가 필요하다.

## 가장 현실적인 시작 순서

1. Mingles 1개 코스 입력
2. Onjium 1개 코스 입력
3. Jungsik 1개 코스 입력
4. 세 레스토랑에서 공통적으로 쓰이는 태그/룰 정리
5. 그 뒤 7th Door, Eatanic Garden 확장

## 주의할 점

- Michelin 설명은 훌륭한 시작점이지만 레시피 자체를 제공하지는 않는다
- 따라서 `observed`와 `inferred`를 반드시 분리해야 한다
- 셰프 의도와 조리 기법은 공식 출처가 없으면 추정으로 내려야 한다
- 리뷰 기반 감각 표현은 confidence를 낮게 넣어야 한다

