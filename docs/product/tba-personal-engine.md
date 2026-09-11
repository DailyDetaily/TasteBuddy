# TBA 개인 취향 분석 엔진

작성일: 2026-09-06 · 초기 감각 확장: `tba-personal-engine/2` · 최신 조건부 모델 연결: `tba-personal-engine/3` · 실제 모델·실사용 해석 품질은 별도 검증 필요

사용자 기록을 저장·정제하고, 같은 유효 근거에서 취향 인사이트와 메인·날개, 개인별 설명을 생성한다. 개인 취향 분석 엔진을 감각 상세 구조로 확장하고, Swift 계약 구현을 통해 네이티브 앱에 연결했다. 감각 정제와 초기 연결 검증은 [감각 모델과 앱 연결](./tba-native-sensory-integration.md), 선택형 수집 이후 고도화와 최신 검증은 [조건부 개인 취향 모델](./tba-advanced-personal-model.md)을 기준으로 한다. 운영 인증 서버의 분석 저장, 입맛 그룹, 식당·메뉴 추천은 아직 포함하지 않는다.

[플랫폼 설계](./tba-data-platform-architecture.md) · [해석 모델](./tba-analysis-interpretation-model.md) · [9가지 미각 타입](./tba-palate-styles.md) · [파일럿 검증](./tba-platform-pilot-report.md)

## 1. 실행

프로젝트 루트에서 실행한다. 기존 Node.js와 `@electric-sql/pglite`를 사용하며 새 의존성은 추가하지 않았다.

```bash
node --test scripts/tba-platform-pilot/*.test.mjs scripts/tba-engine/*.test.mjs
node scripts/tba-platform-pilot/build-semantic-lexicon.mjs --check
node scripts/tba-platform-pilot/semantic-evaluation.mjs --check
node scripts/tba-engine/run.mjs
```

마지막 명령은 [가상 입력](../../scripts/tba-engine/example-input.json)을 실행한다. 결과를 파일로 남기려면 다음과 같이 실행한다.

```bash
node scripts/tba-engine/run.mjs --output docs/product/tba-engine-example-results.json
```

[실행 결과](./tba-engine-example-results.json)는 6개 경험·6개 식사·16개 관찰·미확정 표현 1개를 사용한다. 로맨틱 메인·로스터 윙과 인사이트 5개를 생성하고, 첫 화면에 사용할 하이라이트에서는 같은 취향에 대한 중복 설명을 줄인다. 실제 모델 호출은 0회다. 이 개수는 가상 사례의 실행 결과이며 실사용자 분포나 분류 정확도가 아니다.

자신의 입력 파일은 `--input 입력.json`으로 전달한다. 원문·출처·모든 뷰를 포함하려면 `--full`을 사용한다. 이 명령은 메모리 DB에서 배치를 분석하고 종료한다. 배치 안에서 같은 경험의 `answerKey`를 반복하면 조용히 덮어쓰지 않고 실패한다.

## 2. 연결한 구성

| 모듈 | 역할 |
| --- | --- |
| [index.mjs](../../scripts/tba-engine/index.mjs) | 저장·AI 추출·정제·인사이트·타입·서술을 연결하는 엔진 진입점 |
| [palate-profile.mjs](../../scripts/tba-engine/palate-profile.mjs) | 아홉 타입의 직접 지지·반대 근거, 메인·날개·유보 상태 |
| [sensory-understanding.mjs](../../scripts/tba-engine/sensory-understanding.mjs) | 감각별 상세 묘사·강도·호감·부재 조건·부위·시점 관계와 선택 확인 후보 |
| [personal-insights.mjs](../../scripts/tba-engine/personal-insights.mjs) | 반복 호감, 맥락별 차이, 조합, 강도와 호감, 적정 수준, 한 식사 안의 변화 |
| [narrative.mjs](../../scripts/tba-engine/narrative.mjs) | 실제 발견과 원문을 바탕으로 개인별 문장 생성, 인용 검증, 실패 시 근거 요약 |
| [evidence.mjs](../../scripts/tba-engine/evidence.mjs) | 범위·근거 참조·식사 수·원문 인용의 공통 처리 |
| [run.mjs](../../scripts/tba-engine/run.mjs) | JSON 입력을 받아 끝까지 실행하는 배치 명령 |
| [experience-evidence.mjs](../../scripts/tba-platform-pilot/experience-evidence.mjs) | 기존 저장 계약을 재사용하며 실제 입력 구분·디스크 저장·일관된 근거 조회 지원 |
| [rules.mjs](../../scripts/tba-platform-pilot/rules.mjs) | 선택형·명확한 문장의 규칙 우선 정제, 문맥 연결이 필요한 부분만 AI 경로로 전달 |

`원문 저장 → 규칙 정제 → 필요한 경우 AI 추출 → 현재 유효 근거 조회 → 개인 인사이트·타입 → 선택적 모델 서술` 순서다. 원문 저장을 마친 뒤 네트워크를 호출한다. 추출이나 서술에 실패해도 저장된 기록과 규칙으로 확인한 관찰은 유지된다.

## 3. 애플리케이션에서 호출

Node.js의 신뢰된 서버 또는 로컬 프로세스에서 가져온다. 브라우저에 API 키나 이 저장 엔진을 넣지 않는다. 호출 애플리케이션은 `owner`를 실제 인증된 사용자와 연결해야 한다. 이 라이브러리의 사용자 ID 검사는 네트워크 인증을 대신하지 않는다.

```javascript
import { createTasteAnalysisEngine } from './scripts/tba-engine/index.mjs';
import { LEXICON_VERSION } from './scripts/tba-platform-pilot/rules.mjs';

const engine = await createTasteAnalysisEngine();
try {
  await engine.importFoods({
    sources: [],
    foods: [{ id: 'local-food-1', name: '직접 기록한 음식', claims: [] }],
  });
  await engine.createUser('local-user');
  await engine.createExperience({
    owner: 'local-user', id: 'experience-1', mealId: 'meal-1', foodId: 'local-food-1',
  });
  const result = await engine.saveAnswer('local-user', {
    experienceId: 'experience-1', mutationId: 'mutation-1', baseRevision: 0,
    operation: 'set', answerKey: 'review', recordedAt: new Date().toISOString(),
    answer: {
      question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION,
      target: 'whole_dish', phase: 'unspecified', value: '단맛이 좋았어요.',
    },
  });
  console.log(result.analysis.profile.label);
} finally {
  await engine.close();
}
```

메서드 계약:

- `prepareAnswer(answer)`: 저장·호출 없이 규칙 결과와 `needsAI`를 확인한다.
- `mutate(owner, event)`: `set/remove/clear/delete`와 기준 버전·재시도 ID를 적용한다. `delete`는 경험 전체의 원문과 파생 근거를 삭제한다. `remove/clear`는 선택 취소이며 과거 이력의 물리 삭제와 구분한다.
- `saveAnswer(owner, event)`: 원문 저장, 필요한 AI 추출, 최신 분석까지 연결한다. `resolveAI: false` 옵션으로 추출을 나중에 처리할 수 있다.
- `processAnswerAI(owner, {experienceId, answerKey, baseRevision})`: 저장된 답변의 AI 추출을 재시도한다. 사용자 수정 이후의 오래된 결과는 적용하지 않는다.
- `analyze(owner)`: 최신 근거로 타입·인사이트·근거 요약을 재생성한다. 네트워크를 호출하지 않는다.
- `analyze(owner, {narrate: true})`: 모델 서술을 요청한다. 키가 없으면 명시적인 상태와 근거 요약을 반환한다.

`recordedAt`은 신뢰된 호출자가 전달하는 수신 시각이다. 같은 `mutationId`를 재시도할 때 시각을 포함한 같은 이벤트를 보내야 한다. 사용자가 주장하는 식사 시각을 검증된 서버 수신 시각으로 취급하면 안 된다. 운영 오프라인 동기화는 앱 연결 단계의 별도 작업이다.

## 4. 실제 입력과 검증 자료, 저장·삭제

기본 입력 종류는 `user_report`다. 예시와 테스트는 명시적으로 `synthetic_fixture`를 사용한다. 두 종류는 정제·인사이트·타입·서술까지 유지되고 같은 저장소에 섞이지 않는다. `user_report` 경로 테스트에 사용한 문장도 수작업 검증 입력이며 실제 사용자 실증 자료는 아니다.

`createTasteAnalysisEngine({dataDir})`에 디렉터리를 전달하면 로컬 PGlite 저장소에 보존하고 재개할 수 있다. 생략하면 메모리 저장이다. 같은 디렉터리는 한 프로세스의 저장소로 사용한다. 기존 파일럿의 재시도·기준 버전·출처·소유자 제약을 유지한다.

분석용 관찰과 미확정 원문은 같은 읽기 트랜잭션에서 조회한다. 서술 생성 뒤에도 근거 해시를 다시 확인한다. 그 사이 수정·삭제가 있으면 생성한 문장을 폐기하고 최신 자료의 근거 요약을 돌려준다. 서술 캐시는 사용자와 근거 집합·모델·프롬프트 조건별로 분리하고 변경 때 제거한다.

외부로 이미 전달한 보고서 파일, 호출자의 캐시, 백업, 앱의 미디어 삭제는 엔진 밖의 수명주기다. 이 엔진의 삭제 성공을 그런 외부 사본까지 삭제했다는 의미로 사용하지 않는다.

## 5. 타입을 고르는 방법

메인과 날개는 `provisional_profile`인 제품 해석이다. 아홉 타입 각각에 직접 지지·반대·중립·미확인 모델 근거와 음식·대상·시점 범위를 남긴다.

- 기본 표시 정책은 서로 다른 식사 2개 이상의 직접 호감을 요구한다. 지지 식사 수가 반대 식사 수보다 많을 때 대표 후보로 둔다. 후보는 `지지 식사 수 - 반대 식사 수`, 지지 식사 수 순으로 비교한다.
- 이 기준은 학습한 가중치나 과학적으로 검증된 임계값이 아니다. 버전 있는 초기 표시 정책이며 `policy.minDistinctMeals`로 높일 수 있다. 식사 수를 독립 표본 수로 부르지 않는다.
- 1위 근거가 같으면 `ambiguous_main`으로 후보를 함께 남긴다. 대표 근거가 부족하면 `learning`이다. 점수를 100% 비율로 변환하지 않는다.
- 날개는 나머지 여덟 타입에서 고른다. 메인의 근거와 다른 직접 평가가 별도 식사들에서 뒷받침될 때만 붙인다. 날개 후보끼리 동률이면 유보한다.
- 강렬형은 동일 경험·감각·대상·시점에서 확인된 강한 감각과 직접 호감을 연결한다. 매운맛을 좋아한다는 기록만으로 높은 강도까지 좋아한다고 확대하지 않는다. 같은 범위에 강도 보고가 충돌하면 보류한다.
- 한 답변의 여러 문장에서 같은 관찰을 반복해도 관찰을 합치고 원문 출처들을 보존한다. 같은 식사의 여러 접시·태그도 식사 수를 늘리지 않는다.
- `안 달아서 좋다`는 단맛 자체의 호감으로 넣지 않는다. 반대 경험은 지우지 않고 해당 범위와 함께 남긴다.
- 모델 추출은 `model_extracted_unconfirmed`로 남기며 대표 타입과 채택된 개인 발견에 바로 쓰지 않는다. 원래 기록에 대한 명시적인 감각 평가를 받으면 직접 근거로 사용할 수 있다.

규칙 v3는 `재료 본연의 맛`, `고소한 맛`, `구수한 맛`, `산뜻한 맛`, `농밀한 풍미`, `발효 풍미`, `맛의 균형`을 넓은 경험 속성으로 보존한다. 고소함을 견과류·지방·구움향으로, 발효라는 표현을 확인된 조리 공정으로 바꾸지 않는다. 845개 버블 사전의 단독 모호 표현은 기존 미확정 상태를 유지한다.

## 6. 개인별 설명과 실제 모델 검증

개인 발견은 메인·날개 이름에서 생성하지 않는다. 원문의 직접 호감과 조건에서 반복·차이·조합을 찾는다. 서술 모델에도 타입 이름을 보내지 않고 해당 발견·허용 범위·원문 인용을 보낸다. 같은 `로맨틱 · 로스터 윙`이어도 서로 다른 사용자 기록에서는 다른 설명 자료가 생성된다.

기본 출력은 `source: evidence_summary`인 근거 요약이다. 자연어 생성 경로는 Responses API의 구조화 출력으로 문단·발견 ID·정확한 인용을 받는다. 모르는 ID, 틀린 인용, 누락된 근거, 과도한 일반화 표현, 거부·시간 초과·불완전 응답은 근거 요약으로 대체한다. [OpenAI 구조화 출력 문서](https://developers.openai.com/api/docs/guides/structured-outputs)

구조와 인용의 통과만으로 문장의 의미가 모두 옳다고 보지 않는다. 통과한 모델 서술도 `model_draft`, `references_checked_meaning_requires_review`로 표시한다. 사용자 확인·실제 기록 평가 없이 검증된 해석이나 새 학습 근거로 승격하지 않는다.

실제 호출은 안전하게 `OPENAI_API_KEY`가 설정된 셸에서 실행한다.

```bash
node scripts/tba-engine/run.mjs --live
node scripts/tba-platform-pilot/live-ai-validation.mjs
```

기존 기본 모델 `gpt-6-astra`, reasoning `medium`을 유지하고 `TBA_AI_MODEL` 또는 엔진 설정으로 바꿀 수 있다. 배치의 `--live`는 추출·서술을 합해 최대 20회로 제한한다. API 키는 출력·결과 파일·프롬프트에 넣지 않는다. 기본 실행에는 네트워크 호출이 없다.

## 7. 검증 결과와 남은 범위

최신 v2 감각 확장·iOS 연동 결과와 해석 회수의 한계는 [감각 모델과 앱 연결](./tba-native-sensory-integration.md)에 정리한다. 아래 검사는 v1 단계의 검증 이력이다.

후속 [API 연결 전 추가 평가](./tba-engine-validation.md)에서는 새로운 가상 시나리오 12개와 평가기 검사 3개를 추가했다. 엔진 관련 검사는 기존 16개와 합계 19개 통과했다. 같은 메인·날개의 개인별 근거 차이를 확인했으며, 미해석 조합 기록 2개는 실제 추출 성공과 구분해 남겼다. API 연결은 사용자 요청에 따라 나중에 진행한다.

기존 61개와 새 엔진 16개, 합계 **77개 검사 통과**를 확인했다. 아홉 타입 도달, 근거 없는 호감 금지, 같은 식사 중복 방지, 동률 유보, 개인별 설명 차이, 수정·취소·삭제 전파, 다른 소유자 접근 거부, 모델 확인 상태, 서술 인용 검사, 늦은 서술 폐기, 실제 입력 구분과 디스크 재개를 검증한다.

845개 의미사전 재생성 검사가 통과했다. 120개 고정 예문의 기존 회귀 기준도 유지되며, 정밀도 100%·재현율 93.16%는 이 고정 예문의 규칙 결과다. 아홉 타입의 분류 정확도나 실제 모델 성능을 뜻하지 않는다.

검증 환경에 API 키가 없어 실제 모델 호출은 0회다. 실제 사용자의 해석 유용성·메인/날개 적합성·자연어 설명 품질은 남아 있다. 당시 v1 단계에서는 앱·운영 DB·그룹·추천 연결이 범위 밖이었으며 Node 엔진만 바꾸어 앱 빌드를 실행하지 않았다. 후속 v2에서는 네이티브 앱 연결을 구현했으며, 운영 DB·그룹·추천은 아직 범위 밖이다.
