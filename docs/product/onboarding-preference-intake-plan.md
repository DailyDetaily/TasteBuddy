# Onboarding Preference Intake Plan

Date: 2026-04-18

## Summary

서비스 설명 온보딩 다음에는 `회원 정보 입력 화면`이 아니라 `첫 다이닝 프로필을 가볍게 여는 사전 조사 화면`이 와야 한다.

핵심은 세 가지다.

1. `안전 정보`는 초기에 구조화해서 받아야 한다.
2. `취향 정보`는 첫 추천과 첫 예약 설명에 도움이 되는 최소 항목만 받아야 한다.
3. `민감하지만 효용이 낮은 정보`는 온보딩에서 빼야 한다.

그래서 권장 구조는 `서비스 설명 -> 사전 조사 -> Quick Taste Calibration -> 첫 프로필`이다.

이 문서의 결론은 명확하다.

- `알러지 반응`, `식이제한`, `좋아하는 요리 종류`는 온보딩 초기에 받는 것이 맞다.
- `성별`은 기본 온보딩 필수 항목으로 넣지 않는 것이 맞다.
- 이 화면은 설문이 아니라 `예약 전 설명과 셰프용 가이드를 더 정확하게 만들기 위한 준비 단계`로 보여야 한다.
- 상호작용 패턴은 `한 화면에 한 질문`, `선택 카드 중심`, `하단 step CTA`가 맞다.

## Why This Screen Exists

현재 Taste Buddy의 온보딩은 서비스 가치 설명 뒤에 바로 Quick Taste Calibration으로 넘어간다. 이 흐름은 미각 축을 빠르게 만드는 데는 좋지만, 실제 예약과 다이닝 경험에 바로 필요한 정보가 비어 있다.

특히 다음 정보는 미각 축과 별개로 초기에 필요하다.

- 먹으면 안 되는 것
- 먹을 수는 있지만 피하고 싶은 것
- 평소 편안하게 즐기는 식사 카테고리
- 어떤 스타일의 식사를 기대하는지에 대한 약한 prior

이 정보가 없으면 첫 프로필은 만들어져도, 첫 예약 설명은 빈약해질 수 있다.

예를 들면:

- 알러지가 있는데 취향 추천만 정확한 경우
- 비건/페스코인데 셰프 가이드가 현실적으로 쓸모없는 경우
- 사용자가 이탈리안, 일식 코스, 한식 파인다이닝 중 어디에 더 편안함을 느끼는지 전혀 모르는 상태로 첫 추천을 내는 경우

즉 이 화면의 목적은 `정확한 추천`보다 먼저 `말이 되는 첫 추천`을 만드는 것이다.

## What Current Market Signals Say

공개 자료 기준으로 현재 예약 서비스들은 사전 입력을 주로 `예약 메모`나 `프리비짓 질문`으로 다룬다.

### Tock

Tock은 `Pre-visit questions`로 식이제한, 좌석 선호, 특별한 날 같은 정보를 예약 후 수집하고, 이를 태그와 노트로 예약에 자동 반영한다.

이건 Taste Buddy에 중요한 시사점을 준다.

- 사전 입력은 자유서술보다 `구조화된 태그`가 운영에 유리하다.
- 하지만 이 정보는 보통 `이번 예약`에만 붙고, `지속되는 취향 프로필`로 발전하진 않는다.

### OpenTable

OpenTable의 레스토랑 가이드는 메뉴와 프로필에서 `식이제한 수용 가능 여부`, `좌석 타입`, `접근성`, `특별 요청`을 더 분명하게 보여주라고 권한다.

OpenTable의 diner survey 자료에서는 다음 신호가 보인다.

- `75%`가 dining preferences, 예를 들면 dietary restrictions를 공유하길 원한다.
- `91%`가 특별한 날 여부를 레스토랑에 알리고 싶어 한다.
- `85%`가 레스토랑과 직접 소통하길 원한다.

즉 사람들은 식사 전에 충분한 맥락 전달을 원한다.

### Resy

Resy의 privacy policy는 dietary information을 민감 정보로 취급하고, 예약 시 사용자가 지시하면 레스토랑과 공유할 수 있다고 명시한다.

이건 Taste Buddy에 두 가지 기준을 준다.

- 알러지/식이제한은 `민감 정보`로 취급해야 한다.
- 취향 학습용 정보와 운영 전달용 정보는 `동의 구조`를 분리해야 한다.

## Product Principle For TasteBuddy

Taste Buddy는 기존 예약 앱처럼 `요청사항 메모칸` 하나로 끝내면 안 된다.

이 제품의 사전 조사는 아래 3층 구조여야 한다.

1. `Operational Safety`
   - 먹으면 안 되는 것
   - 반드시 피해야 하는 것
   - 예약 전 레스토랑에 전달되어야 하는 것
2. `Taste Context`
   - 평소 편안하게 즐기는 요리 종류
   - 선호하는 식사 스타일
   - 첫 추천 품질을 올릴 수 있는 약한 prior
3. `Learning Seed`
   - 이후 피드백과 합쳐질 때 진짜 프로필로 발전할 수 있는 초기 힌트

이 원칙으로 보면, 사용자가 제안한 항목 중 우선순위는 다음과 같다.

## Decision By Field

| 항목 | 온보딩 포함 여부 | 방식 | 이유 |
| --- | --- | --- | --- |
| 성별 | `기본 온보딩에서 제외` | 필요 시 나중에 optional profile field | 추천/예약 설명 정확도에 직접 기여가 약하고, 민감도는 상대적으로 높다 |
| 알러지 반응 | `필수` | 구조화된 multi-select + 추가 텍스트 | 안전과 운영 현실에 직접 연결된다 |
| 식이제한 | `필수 또는 준필수` | single/multi-select | 첫 추천과 예약 가능성 필터링에 바로 필요하다 |
| 좋아하는 요리 종류 | `필수` | 최대 3-5개 선택 | 첫 탐색과 첫 fit explanation 품질에 유효한 prior다 |
| 싫어하거나 피하는 재료 | `선택` | multi-select + 기타 텍스트 | 알러지는 아니지만 만족도에 큰 영향을 준다 |
| 향신료/매운맛 허용도 | `추천` | 3단계 또는 5단계 선택 | 요리 유형 추천과 dish expectation 설명에 도움된다 |
| 새로운 음식 시도 성향 | `추천` | single-select | 보수적 추천 vs 실험적 추천 분기점으로 유용하다 |
| 예산, 직업, 소득 | `초기 제외` | - | 첫 프로필 가치보다 입력 저항이 더 크다 |
| 연령대 | `초기 제외` | - | 직접 효용이 낮고 우회적으로만 쓰일 가능성이 높다 |

## Recommended Screen Structure

권장 구조는 `한 화면에 다 몰아넣는 폼`이 아니라 `phase는 두 개지만, 질문은 화면마다 하나씩 나뉘는 흐름`이다.

즉 정보 구조는 두 묶음이지만, 실제 UI는 아래처럼 분리된다.

### Phase A: 먼저 피해야 할 것

이 phase는 `안전과 운영 현실`에 관한 질문만 다룬다.

권장 화면 순서:

1. 알러지 반응
2. 식이제한
3. 레스토랑 전달 동의

왜 먼저냐:

- 안전 정보가 가장 중요하다
- 사용자는 이 단계에서 “이 앱이 내 상황을 진지하게 본다”는 신뢰를 느낀다
- 이후 추천 결과의 말이 안 되는 경우를 크게 줄인다

### Phase B: 평소 더 편안한 식사 스타일

이 phase는 `첫 추천 품질`과 `첫 fit explanation`에 필요한 약한 prior를 받는다.

권장 화면 순서:

4. 좋아하는 요리 종류
5. 피하는 재료 또는 자주 아쉬운 포인트
6. 매운맛 허용도
7. 새로운 스타일 시도 성향

왜 둘째냐:

- 이 정보는 안전보다 덜 중요하지만, 첫 추천 품질에는 중요하다
- Quick Taste Calibration으로 가기 전에 “내가 어떤 사람인지 앱이 조금은 이해하고 있다”는 느낌을 만든다

## Interaction Pattern

이 흐름은 반드시 아래 패턴으로 구현하는 것이 맞다.

### One Question Per Screen

- 화면당 질문은 하나만 둔다
- 질문 아래에는 설명 1문장만 둔다
- 선택 이후 즉시 다음으로 넘어가거나, `다음` CTA가 활성화된다

왜냐하면:

- 여러 질문을 한 화면에 두면 설문처럼 느껴진다
- 현재 OnboardingScreen과 QuickTasteCalibrationScreen도 이미 step 기반 흐름에 익숙하다
- 질문을 쪼개면 사용자는 “입력 중”보다 “프로필을 만드는 중”이라는 감각을 더 쉽게 느낀다

### Selection Card First

- 기본 입력 방식은 chip보다 `선택 카드`가 맞다
- 카드 한 장이 옵션 하나를 대표한다
- 선택 상태는 테두리, 배경, 보조 라벨로 분명히 보여준다

권장 카드 구성:

- option label
- 짧은 설명 한 줄
- 필요 시 `추천에 반영`, `예약 준비에 반영` 같은 보조 라벨

### Free Text Is Branching, Not Primary

- 자유 입력은 기본 입력 방식이 아니어야 한다
- `기타`를 눌렀을 때만 짧은 추가 입력이 열려야 한다
- 메인 화면 자체가 텍스트 폼처럼 보이면 안 된다

### Shared Flow Shell

- 상단은 현재 onboarding / calibration과 같은 white flow shell
- 하단은 `FlowStepCta` 패턴을 재사용
- 본문 선택지는 `SectionCard` 계열 선택 카드로 처리

즉 새 화면은 새로운 interaction grammar를 만들기보다, 현재 있는 `step indicator + anchored CTA + card selection` 문법을 그대로 확장하는 편이 맞다

## Suggested Wireflow

가장 자연스러운 v1 wireflow는 아래다.

1. `Intro transition`
   - "몇 가지 질문만 더 답하면 첫 추천이 더 정확해져요"
2. `알러지 반응`
3. `식이제한`
4. `레스토랑 전달 동의`
5. `좋아하는 요리 종류`
6. `피하는 재료 또는 자주 아쉬운 포인트`
7. `매운맛 허용도`
8. `새로운 스타일 시도 성향`
9. `Quick Taste Calibration intro`

질문 수가 많아 보이지만, 각 화면이 카드 선택 하나로 끝나면 실제 체감은 훨씬 가볍다.

반대로 2개 이상의 질문을 한 화면에 넣으면 단계 수는 적어 보여도 체감 부담은 더 커진다.

## Detailed Question Plan

### 1. 알러지 반응

권장 질문:

`먹거나 접촉하면 반응이 있는 재료가 있나요?`

권장 UI:

- 다중 선택 카드
- 첫 카드로 `없음`
- `기타` 선택 시에만 짧은 텍스트 입력 열기

권장 옵션:

- 없음
- 갑각류
- 견과류
- 유제품
- 달걀
- 글루텐
- 생선
- 대두
- 기타 직접 입력

추가 구조:

- `정말 피해야 해요`
- `가능하면 피하고 싶어요`

이유:

- 단순히 “있음/없음”보다 운영상 심각도가 중요하다
- 향후 레스토랑 전달 로직에서 hard exclusion과 soft caution을 나눌 수 있다

### 2. 식이제한

권장 질문:

`평소 지키는 식사 원칙이 있나요?`

권장 UI:

- 단일 선택 카드 또는 최대 2개 선택 카드
- `없음`은 첫 카드
- `기타` 선택 시 텍스트 확장

권장 옵션:

- 없음
- 채식 위주
- 비건
- 페스코
- 할랄 지향
- 돼지고기 제외
- 소고기 제외
- 글루텐 프리 지향
- 기타 직접 입력

이유:

- 추천 가능한 레스토랑 pool 자체를 바꾸는 정보다
- 셰프 브리프 생성 시 “조정 가능한 취향”과 “넘을 수 없는 제한”을 구분하는 기반이 된다

### 3. 좋아하는 요리 종류

권장 질문:

`평소 더 편안하게 즐기는 요리 스타일을 골라주세요`

권장 선택 방식:

- 카드 다중 선택
- 최대 5개 선택
- 최소 2개 권장

권장 카테고리 초안:

- 한식 코스
- 일식 오마카세
- 프렌치
- 이탈리안
- 스테이크하우스
- 와인바 다이닝
- 중식 파인다이닝
- 해산물 중심
- 숯불/그릴 중심
- 디저트가 중요한 코스

이유:

- 이건 절대 취향이 아니라 `초기 탐색 prior`다
- TasteBuddy가 아직 사용자 로그가 없을 때 후보군을 정리하는 데 유효하다

주의:

- 이 답변 하나로 “당신은 프렌치를 좋아하는 사람”처럼 고정하면 안 된다
- 이후 실제 방문 로그와 충돌하면 빠르게 약화되어야 한다

### 4. 피하는 재료 또는 자주 아쉬운 포인트

권장 질문:

`알러지는 아니지만, 자주 피하거나 아쉬웠던 요소가 있나요?`

권장 UI:

- 선택 카드 다중 선택
- `딱히 없어요`를 첫 카드로 두기
- `기타` 선택 시 직접 입력

권장 옵션 예시:

- 너무 강한 산미
- 지나치게 진한 버터/유지감
- 내장류
- 생식감이 강한 해산물
- 향이 강한 허브
- 너무 매운 음식
- 기타 직접 입력

이유:

- 이 항목은 취향의 negative prior를 준다
- 실제 만족도 하락을 막는 데 도움이 크다

### 5. 매운맛 허용도

권장 질문:

`매운맛은 어느 정도까지 편안한가요?`

권장 UI:

- 5개 단일 선택 카드
- 숫자 slider보다 의미 기반 라벨 카드가 더 적합

권장 옵션:

- 거의 못 먹어요
- 약간은 괜찮아요
- 보통이에요
- 꽤 즐겨요
- 강한 매운맛도 좋아해요

이유:

- 한국 사용자 기준으로 설명력이 높다
- 메뉴 설명, 추천, 사전 주의 문구에 모두 활용 가능하다

### 6. 새로운 스타일 시도 성향

권장 질문:

`낯선 스타일의 식사도 즐겨보는 편인가요?`

권장 UI:

- 3개 단일 선택 카드
- 각 카드에 추천 톤 차이를 짧게 설명

권장 옵션:

- 익숙한 스타일이 좋아요
- 반반이에요
- 새로운 시도도 기대돼요

이유:

- 이 값은 추천 엔진보다 `fit explanation 문구 톤`에 더 중요하다
- 보수적 유저에게는 안정적 설명을, 실험 성향 유저에게는 서사와 새로움을 강조할 수 있다

## Why Gender Should Not Be In The First Intake

사용자가 예시로 `성별`을 언급했지만, 현재 Taste Buddy의 제품 가치와 연결해 보면 온보딩 필수 항목으로는 적합하지 않다.

이유는 간단하다.

1. 첫 추천 정확도에 직접적으로 기여하는 신호가 아니다.
2. 민감 정보로 느껴질 수 있다.
3. 사용자는 “왜 이걸 물어보지?”라는 저항을 바로 느낀다.

물론 나중에 profile personalization이나 커뮤니케이션 톤, 선호 호칭, 라이프스타일 연구 같은 맥락에서 optional field로 실험할 수는 있다. 하지만 첫 온보딩의 goal은 `신뢰 + 첫 가치 체감`이지 `회원 DB 풍부화`가 아니다.

결론:

- `성별`은 v1 onboarding intake에서 제외
- 꼭 필요해지면 나중에 `선택 입력`으로 profile settings에 이동

## UX Rules

이 화면은 문진표나 회원가입 폼처럼 보이면 안 된다.

반드시 아래를 지켜야 한다.

1. 한 화면당 질문은 정확히 하나만 둔다.
2. 기본 입력은 선택 카드다. 폼 필드가 중심이 되면 안 된다.
3. 다중 선택도 카드 기반으로 처리하고, 필요한 경우에만 chip 보조 표시를 쓴다.
4. 자유 입력은 `기타` 분기나 마지막 보충 메모에만 쓴다.
5. 각 화면 상단에 `왜 묻는지`를 1문장으로 설명한다.
6. 하단은 현재 onboarding과 같은 anchored CTA를 유지한다.
7. 마지막에는 `이 정보가 첫 추천과 예약 준비에 이렇게 쓰입니다`를 짧게 요약한다.

권장 마이크로카피 예시:

- `먹지 못하는 재료는 추천과 예약 준비에서 가장 먼저 반영돼요`
- `이 선택은 첫 추천의 출발점을 잡는 데 사용돼요`
- `나중에 언제든 바꿀 수 있어요`

## Data Structure Recommendation

제품 레벨에서 필요한 구조는 아래 정도면 충분하다.

```ts
type SafetyProfile = {
  allergies: Array<{
    ingredient: string
    severity: 'hard_exclusion' | 'soft_caution'
  }>
  dietaryRestrictions: string[]
  extraCautionNote: string | null
  consentToShareWithRestaurant: boolean
}

type DiningContextProfile = {
  preferredCuisineTypes: string[]
  avoidedIngredientsOrSignals: string[]
  spiceTolerance: 'low' | 'medium_low' | 'medium' | 'medium_high' | 'high'
  explorationStyle: 'familiar' | 'balanced' | 'adventurous'
}
```

중요한 점:

- `SafetyProfile`은 운영 전달과 직접 연결된다
- `DiningContextProfile`은 추천과 fit explanation의 초기 seed로 쓴다
- 둘을 같은 저장 구조에 섞어두지 않는 편이 좋다

## Recommended Flow In TasteBuddy

현재 앱 흐름:

`서비스 설명 온보딩 -> Quick Taste Calibration`

권장 흐름:

`서비스 설명 온보딩 -> Preference Intake -> Quick Taste Calibration -> Starter Profile`

이렇게 바꾸면 좋은 점:

- Quick Taste Calibration이 너무 갑작스럽지 않다
- 첫 프로필 카드에서 “왜 이런 추천이 나왔는지” 설명할 재료가 늘어난다
- 예약 전 화면에서 미각 축 + 제한 조건 + 카테고리 선호를 함께 설명할 수 있다

## V1 Scope

v1에서는 아래만 넣는 것이 맞다.

### Must Have

- 알러지 반응
- 식이제한
- 좋아하는 요리 종류
- 매운맛 허용도
- 새로운 스타일 시도 성향
- 레스토랑 전달 동의

### Nice To Have

- 피하는 재료
- 특별한 날/동반자 유형
- 와인 페어링 선호

### Exclude For Now

- 성별
- 연령대
- 직업/소득
- 너무 세밀한 영양/건강 정보
- 긴 자유서술 문답

## Open Questions

아직 결정이 필요한 부분도 있다.

1. `좋아하는 요리 종류`를 cuisine taxonomy로 갈지, dining style taxonomy로 갈지
2. 알러지 severity를 2단계로 충분히 볼지, 3단계 이상으로 세분화할지
3. 이 정보 중 어떤 범위까지 레스토랑과 자동 공유할지
4. 첫 프로필 화면에서 이 정보들을 얼마나 직접적으로 노출할지

내 현재 추천은 이렇다.

- cuisine taxonomy와 dining style taxonomy를 섞지 말고, v1은 `요리 종류` 중심으로 단순하게 간다
- severity는 `hard_exclusion / soft_caution` 2단계면 충분하다
- 레스토랑 공유는 안전 정보 중심으로 제한하고, 취향 정보는 요약/번역된 형태만 공유한다

## Recommended Next Step

다음 단계는 문서가 아니라 화면 설계다.

구체적으로는 아래 순서가 맞다.

1. `Preference Intake` single-question wireflow 설계
2. 각 질문을 selection card UI로 정리하고, 옵션 개수를 모바일 기준으로 줄이기
3. `FlowStepCta`와 `SectionCard`를 재사용하는 컴포넌트 구조 초안 잡기
4. starter profile 카드에서 이 정보가 어떻게 해석되는지 연결하기
5. 실제 구현 시 `onboarding -> intake -> calibration` 상태 흐름 추가

## Sources

- [Tock: Setting Up Pre-visit Questions](https://tock.zendesk.com/hc/en-us/articles/360030879572-Setting-Up-Pre-visit-Questions)
- [OpenTable: What guests need to know when picking a restaurant](https://www.opentable.com/restaurant-solutions/resources/info-guests-need/)
- [OpenTable Q1 2022 diner insights PDF](https://www.opentable.com/restaurant-solutions/wp-content/uploads/sites/156/2022/02/q122-diner-insights_b2b_us_opentable.pdf)
- [Resy Privacy Policy](https://resy.com/privacy)
- Existing Taste Buddy onboarding note: [`./onboarding-digital-anchoring.md`](./onboarding-digital-anchoring.md)
- Existing onboarding flow: [`../../src/pages/OnboardingScreen.tsx`](../../src/pages/OnboardingScreen.tsx)
