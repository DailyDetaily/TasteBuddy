# 음식 종류와 특성 · dish-kind/2

2026-10-03 적용. 활성 선택지는 음식 종류 30개와 특성 2개이며, 이전 결합 분류 6개는 기존 기록을 읽기 위해 별도로 유지한다. 현재 분류의 기준은 `src/constants/dishKindTags.ts`다.

## 선택 구조

| 그룹 | 수 | 항목 |
| --- | ---: | --- |
| 주요 재료 | 11 | 해산물, 육류, 채소/허브, 두부/콩, 달걀, 버섯, 과일, 견과·씨앗, 해조류, 유제품/치즈, 향신료 |
| 요리 형태 | 9 | 면류, 밥·곡물, 빵, 만두, 전·부침, 국물/브로스, 소스/글레이즈, 디저트, 음료/페어링 |
| 조리·처리 | 10 | 구이, 훈연, 볶음/웍, 튀김/크리스피, 찜·스팀, 조림·브레이즈, 회·생식, 절임, 염장·큐어, 발효/장 |
| 특성 | 2 | 매운맛, 차가움 |

여러 태그를 함께 선택할 수 있다. 재료와 조리·처리는 한 단계의 배타적 분류가 아니다. 훈연 연어는 해산물+훈연, 차가운 면은 면류+차가움으로 표현할 수 있다. 분류 태그는 해당 감각을 실제로 느꼈거나 좋아했다는 응답을 대신하지 않는다.

## 이전 분류와 호환

| 이전 ID | 새 선택지 |
| --- | --- |
| `grain_noodle` | `noodle`, `rice_grain`, `bread` |
| `dumpling_batter` | `dumpling`, `pancake` |
| `grilled_smoked` | `grilled`, `smoked` |
| `steamed_braised` | `steamed`, `braised` |
| `raw_cured` | `raw`, `pickled`, `cured` |
| `spice_heat` | `spice`, `spicy` |

달걀 `egg`, 버섯 `mushroom`, 과일 `fruit`, 견과·씨앗 `nut_seed`, 해조류 `seaweed`를 추가했다. 차가움 `cold`는 동일 ID로 특성 그룹에 배치했다.

이전 결합 ID를 자동으로 새 하위 ID에 배정하지 않는다. 기존 선택은 원래 ID와 라벨로 읽고 편집 화면의 ‘이전에 선택한 분류’에 표시한다. 사용자가 바꾸기 전까지 원본 기록은 유지한다. 새 기록의 자동 추천은 활성 ID만 사용한다. 저장 스키마는 기존 ID 배열을 유지하며 사용자 데이터 마이그레이션을 실행하지 않는다.

## TBA 연결

- 자동 추론: 재료·조리·특성의 구체적인 단어를 사용한다. `생선`의 ‘생’, `김치`의 ‘김’, `eggplant`의 `egg`, `strawberry`의 `raw` 같은 부분 문자열로 다른 종류를 추론하지 않는다.
- 감각 표현: 정확한 재료와 조리의 조합으로 기존 프로필을 선택하고, 새 종류에 적합한 기존 표현의 후보 순서를 조정한다. 선택되지 않은 감각이나 호감 기록을 만들지 않는다.
- 회·생식과 해산물의 조합은 생해산물 프로필을 사용할 수 있다. 절임·큐어·이전 `raw_cured`는 그 자체로 생해산물 프로필이 되지 않는다.
- 향신료는 향신료 향 후보를, 매운맛 특성은 자극 표현 후보를 제공한다. 향신료만으로 매운 자극을 확인하지 않는다. 매운맛·차가움을 신맛·쓴맛으로 대체하지 않는다.
- 지식 연결: 과일·견과를 디저트로, 달걀을 육류로, 해조류를 생선류로 자동 묶던 연결을 정리했다. 기존 6,800개 지식 기록의 ID·출처·FoodOn 연결은 유지하고 분류 매핑만 갱신한다.
- 웹의 분류·라벨·이전 분류·별칭·기존 감각 후보 순서는 iOS 계약 JSON으로 생성한다. iOS와 Android는 해당 계약을 공유한다. 감각 v2의 맥락과 후보 순서는 웹·iOS에 연결되며 Android의 기존 감각 화면에는 기존 카탈로그용 후보 순서를 연결한다.

## 생성 및 검증

분류만 변경할 때는 기존 지식의 출처 연결을 유지하는 갱신 경로를 사용한다.

```sh
node scripts/build-tba-food-knowledge-dataset.mjs --remap-taxonomy
node scripts/build-tba-food-knowledge-runtime.mjs
node scripts/build-sensory-v2.mjs
node scripts/build-sensory-v2-fixtures.mjs
node ios/Tools/generate-tba-native-bundle.mjs
node ios/Tools/generate-contract-fixtures.mjs --only=dining-feedback-scenario.json
```

TBA 결과가 바뀌면 분석·엔진 golden fixture도 재생성한다. 변경된 공유 리소스는 Android assets와 체크섬에 동기화한다.

회귀 검사는 `scripts/test-dish-kind-taxonomy.mjs`, `scripts/test-web-sensory-v2.mjs`, 기존 점수·식품 지식 검사, iOS `TasteBuddyAgentFullEngineTests`, Android `DishKindCatalogTest`에 있다. 실행 결과와 한계는 `output/qa/dish-taxonomy-20261002/verification.md`에 기록한다.

32종 SVG는 `output/design/tb-icon-editor/food/`에 있다. 이전 고추와 지느러미를 제거한 생선 형태는 유지했다.

2026-10-03 후속 적용으로 웹·iOS·Android의 음식 종류 선택 칩 왼쪽에 16px 아이콘을 연결했다. 아이콘은 칩의 글자색을 따르며, 선택·추천·비활성 색상과 기존 선택 동작을 유지한다. 아이콘은 접근성 이름에서 제외하고 기존 칩 라벨을 사용한다. 이전 결합 분류 6개에는 당시 도안을 사용하며, 사용자 정의 종류에는 임의의 음식 그림을 배정하지 않는다.

편집기의 현재 SVG를 제품 자산으로 갱신하려면 `python3 scripts/sync-dish-kind-icons.py`를 실행한다. 이 명령은 현재 32종과 이전 6종을 웹 도형 데이터, iOS 템플릿 벡터 자산, Android 벡터 drawable로 내보낸다. 앱 실행과 빌드는 편집기 서버에 의존하지 않는다. 칩 적용 검증은 `output/qa/dish-kind-chip-icons-20261003/verification.md`에 기록한다.
