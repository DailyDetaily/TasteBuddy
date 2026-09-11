# TBA Knowledge RAG And Core Taste Lexicon Plan

작성일: 2026-06-01  
범위: TasteBuddyAgent(TBA)의 음식 지식 RAG, Core Taste Lexicon, FART/ART Mapper, 사용자 피드백 기반 선호 학습 설계

2026-09-06 기준: 이 문서는 기존 Mapper·RAG·confidence 설계의 참고 자료다. 현재 제품 우선순위는 개인 취향 이해와 다양한 해석·인사이트, 추후 비슷한 입맛 그룹 연결, 이후 그룹 기반 식당·메뉴 추천이다. 신규 데이터 정제·재해석·모델 판단에는 [플랫폼 아키텍처](./tba-data-platform-architecture.md), [수집·정제 계약](./tba-sensory-data-design.md), [분석·해석 모델](./tba-analysis-interpretation-model.md)이 우선한다. 아래의 고정 축·신뢰도 수치·추천 gate를 새 플랫폼의 원본 데이터 계약으로 승계하지 않는다.

TBA는 하나의 LLM이 아니라 다음 세 층을 조합한 미각 해석 시스템이다.

```text
TBA
= FART/ART Mapper 규칙 기반 해석 레이어
+ FoodSky/FoodEarth 기반 음식 지식 RAG
+ 사용자 피드백 기반 선호 학습 모델
```

LLM이나 RAG는 점수의 주인이 아니다. 추천 점수, 유사도, confidence gate, TCS 보정값은 deterministic layer와 사용자 피드백 학습이 만든다. RAG는 음식이 무엇인지, 어떤 재료/조리/향미 맥락이 있는지 보강하는 근거 레이어다.

---

## 1. First Output Schema

TBA 지식 레이어는 앱에 아래 출력을 제공해야 한다.

| 출력 | 설명 | canonical owner |
| --- | --- | --- |
| `dishKindIds` | 사용자가 기록한 음식 종류 | feedback flow + mapper |
| `ingredientSignals` | 재료 기반 음식 지식 신호 | Food Knowledge RAG |
| `processSignals` | 조리법/기술 기반 신호 | Food Knowledge RAG |
| `coreLexiconIds` | Core Taste Lexicon과 연결된 핵심 미각 개념 | FART/ART Mapper |
| `tasteVector` | 6축 미각 변화/인상 | FART/ART Mapper |
| `perceptualVector` | 여운, 무게감, 향, 질감 등 경험 축 | FART/ART Mapper |
| `tasteBubbles` | 카드에 보이는 미각 버블 | FART/ART Mapper |
| `detailTags` | 세부 경험 태그 | FART/ART Mapper |
| `diningNote` | 사용자가 직접 쓴 것처럼 읽히는 미식 노트 | Taste Note Composer |
| `confidence` | 추천/셰프 가이드 사용 가능 여부 | Confidence Gate |

---

## 2. Core Taste Lexicon

초기 Core Taste Lexicon은 [`src/constants/tbaCoreTasteLexicon.ts`](../../src/constants/tbaCoreTasteLexicon.ts)에 100개 candidate로 둔다.

각 항목은 아래 필드를 가진다.

| 필드 | 의미 |
| --- | --- |
| `id`, `label`, `aliases` | 앱/문서/검색에서 쓰는 기준어휘 |
| `category` | taste, finish, texture, aroma, process, ingredient, composition |
| `summary` | 사람이 검수하기 위한 한 줄 의미 |
| `tasteVector` | 6축 taste signal. signed value를 허용 |
| `perceptualVector` | 밝음, 여운, 무게감, 향, 질감 등 signed perceptual signal |
| `dishKindAffinity` | dish kind와의 초기 친화도 |
| `foodOnHints` | FoodOn ingredient/process taxonomy 매핑 후보 |
| `recipeNlgTechniqueHints` | RecipeNLG에서 추출할 technique pattern 후보 |
| `initialConfidence` | 사람이 검수하기 전 초기 confidence |
| `minRecommendationConfidence` | 추천/셰프 가이드 사용 최소 confidence |
| `status` | draft, candidate, human-reviewed, active, retired |

현재 기본값:

```text
initialConfidence = 0.42
minRecommendationConfidence = 0.72
status = candidate
```

즉 지금 100개 항목은 앱이 참고할 수 있는 후보지만, 추천/셰프 가이드/TCS의 강한 근거로 쓰려면 human review와 app feedback이 필요하다.

---

## 3. Food Knowledge RAG

Food Knowledge RAG는 다음 자료를 섞는다.

| source | 역할 | 주의 |
| --- | --- | --- |
| Core Taste Lexicon | TBA 내부 기준어휘 | 수동 작성 + 검수 필요 |
| FoodOn | ingredient/process taxonomy 기준 | taxonomy id와 label만 우선 매핑 |
| RecipeNLG | technique pattern 후보 추출 | 원문/레시피 재사용 전 license 확인 |
| FoodSky/FoodEarth | 음식 지식 문서와 설명 근거 | 모델 직접 운영보다 knowledge doc/RAG 우선 |
| App feedback | 실제 사용자 반응 | confidence 업데이트의 최종 근거 |

RAG document는 아래 단위로 만든다.

```text
KnowledgeDoc
- title
- summary
- dishKindIds
- ingredientTaxonomyIds
- processTaxonomyIds
- lexiconIds
- confidence.lexicon
- confidence.foodMapping
- confidence.humanReview
- confidence.appFeedback
- status
```

---

## 4. FART/ART Mapper

FART/ART Mapper는 음식 지식을 사용자 미각 언어로 바꾸는 deterministic layer다.

입력:

- 메뉴명
- 레스토랑/코스 맥락
- 사용자가 선택한 dish kind
- 미각 버블/디테일 태그
- Food Knowledge RAG 결과
- 작성자 6축 미각 프로필
- 기존 사용자 피드백 history

처리:

1. 메뉴명과 dish kind로 후보 KnowledgeDoc 검색
2. KnowledgeDoc의 `lexiconIds`를 Core Taste Lexicon으로 확장
3. taste/perceptual vector를 confidence-weighted sum으로 합산
4. 사용자 6축 프로필에 맞춰 강조/감쇠
5. 후보 미각 버블과 디테일 태그를 rank
6. confidence gate를 통과한 항목만 recommendation/chef guide에 전달

출력:

- `tasteBubbleCandidates`
- `detailTagCandidates`
- `tasteVector`
- `perceptualVector`
- `supportingLexiconIds`
- `uncertaintyNotes`

---

## 5. Taste Note Composer

미식 노트는 제3자 분석문처럼 보이면 안 된다. 사용자가 직접 쓴 짧은 리뷰처럼 읽혀야 한다.

작성 규칙:

- 첫 문장은 음식 종류와 조리 맥락에서 시작한다.
- 미각 버블 1-2개와 디테일 태그 1-2개를 자연어로 녹인다.
- 작성자의 6축 프로필에 따라 같은 음식도 다른 관점으로 쓴다.
- `~라고 분석됩니다`, `사용자는` 같은 제3자 표현을 쓰지 않는다.
- confidence가 낮은 근거는 미식 노트 본문에 단정적으로 쓰지 않는다.

예:

```text
숯불 향이 먼저 올라오고, 생선의 감칠맛은 생각보다 맑게 이어졌어요.
소스가 지방감을 오래 끌고 가지 않아서 마지막은 비교적 산뜻하게 닫혔습니다.
```

---

## 6. Confidence Update

Confidence는 하나가 아니라 네 가지로 분리한다.

| confidence | 의미 |
| --- | --- |
| `lexiconConfidence` | 이 미각 개념 자체가 TBA 기준어휘로 안정적인가 |
| `foodMappingConfidence` | 이 음식/재료/조리법에 이 개념을 붙여도 되는가 |
| `humanReviewConfidence` | 사람이 검수했는가 |
| `userPreferenceConfidence` | 이 사용자에게 이 신호가 실제로 반복 확인되는가 |

업데이트 근거:

- 사용자가 추천 미각 버블을 그대로 선택했는가
- 직접 입력한 태그가 기존 lexicon과 반복적으로 매칭되는가
- 미식 노트 이후 사용자가 수정/삭제/반응했는가
- 유사 미각 사용자의 반복 리뷰에서도 같은 신호가 나오는가
- 특정 dish kind에서만 맞는 신호인지, 범용 신호인지

---

## 7. Confidence Gate

추천/셰프 가이드/TCS에 사용할 수 있는 최소 기준:

| surface | 최소 조건 |
| --- | --- |
| 미각 버블 후보 | `lexiconConfidence >= 0.42` |
| 디테일 태그 후보 | `foodMappingConfidence >= 0.5` |
| 미식 노트 | `humanReviewConfidence >= 0.5` 또는 deterministic fallback |
| 추천 설명 | combined confidence >= 0.72 |
| 셰프 가이드 | human-reviewed + combined confidence >= 0.78 |
| TCS 보정 | userPreferenceConfidence >= 0.68 + evidence count >= 3 |

confidence가 낮은 항목은 추천 근거로 쓰지 않고, “다음 리뷰에서 확인할 후보”로만 보관한다.

---

## 8. Next Build Order

1. Core Taste Lexicon 100개 1차 검수
2. `dishKindTags`와 lexicon `dishKindAffinity` 연결
3. FoodOn taxonomy id 매핑 필드 채우기
4. RecipeNLG technique verb pattern 후보 추출
5. FoodSky/FoodEarth mini data를 KnowledgeDoc 후보로 변환
6. human-reviewed 항목만 active 처리
7. TBA `buildDiningNote()`가 lexicon 기반 후보를 사용하도록 연결
8. 앱 피드백에서 confidence update 이벤트 저장
9. confidence gate를 추천/셰프 가이드/TCS에 적용
