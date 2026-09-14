# 홈·나의 입맛·질문 통합 구현

2026-09-13. 주 범위는 `ios/TasteBuddy`와 네이티브 테스트다. 시작 branch는 main,
HEAD 및 `git ls-remote origin refs/heads/main`은 a69feb0fbb112834068f8191cc7a120a8bcef3d9.
기존 장기 음식 기억 변경을 포함한 시작 diff와 status는 `output/home-taste-questions/preexisting.*`에 보존했다.
저장소/상위 폴더에 적용할 AGENTS.md는 발견되지 않았다. `ios/README.md`와 `ios/project.yml`을 따른다.

| 요구 | 현재 호출 경로 / 재사용 | 확인한 공백 | 수정 / 검증 |
|---|---|---|---|
| 정확한 질문 대상 | SensoryAnalysisEngine → PersonalTasteModelBuilder → availableSelections | 감각·facet·조건별 그룹 ID가 여러 경험을 합침 | 개별 출처 ID와 family 분리, Q1–3/8/14/17/18 |
| 답변 가능성 | PersonalTasteInlineAnswer → AppModel.savePersonalTasteQuestionResponse | legacy 임시 선택에도 버튼 표시, 직접 조건과 상속 조건 비교 | parser 기반 가능성 검사, Q4–7 |
| 안전 저장 | persistDiningEntries의 encode/readback 및 expected 비교 재사용 | 질문은 expected:nil, 계정 문맥 없음, undo가 저장 결과 무시 | 최신성·계정·실패 검사, Q11–13 |
| 질문 노출 | 기존 사진/스택/인라인/전체 목록/고정 3개 배치 | resolved와 숨김 혼용, 비평가 보류 없음, 범위 문구 생략 | instance progress, 보조 동작, Q9/10/16 |
| 홈 요약 | HomeArchiveSummaryEngine → HomeSummaryCard → HomeArchiveDetailView | 메뉴 이름이 식당 범위를 잃음, 부족 카드 9개 강제 | 집계/카피/빈 상태, 관련 원본 연결 |
| 홈 하단 | HomeArchiveMetricsEngine → HomePeriodInsightCard | chartValues 비어 있음, 탭 없음, 전체 평가를 meal 단위로 합침 | 시간/구성/5단계 분포와 범주 상세 |
| 타입/레이더/변화 | 기존 Hero, TastePerceptionCards, reportedValues 레이더 | 출처는 메뉴 안, 기준 반응/아직 변화없음 카피 | 범위/단위/결측/출처 정합성 |
| 강도–호감 | 기존 PersonalTasteCandidateDetailSheet와 observations | 3×3 탐색 없음 | 같은 출처·조건의 쌍과 충돌/미확인, 셀→원문 |
| 교정/시간/검색/export | 기존 미커밋 DiningMemoryContext/FoodMemory 및 AppModel 수정/삭제 | 새 기능과 회귀 확인 필요 | 원문 수정/삭제 및 기존 계약 보존 |

진행: 구현과 baseline 재현, 관련 iOS 단위·통합 193개와 실제 UI 3개 실행을 마쳤다.
합성 자료·정적 검사·시뮬레이터·실기기·제품 사용자 연구는 별도 검증 범위로 보고한다.

## 구현 계약

### 홈: 원본으로 내려가는 표시

기존 `HomeSummaryCard` 정사각형·가로 스크롤과 `HomePeriodInsightCard` 외형을 재사용한다. 상단 정보 순서는 분류명 → 값 → 범위다. 기본 기록 카드를 남기고, 근거 없는 조건·차이·변화 카드는 만들지 않는다. 카드에 표시한 숫자는 아래 출처만 사용한다.

| 카드 | 입력과 단위 | 상세 |
|---|---|---|
| 기록 | 현재 계정의 고유 mealID / 디시 experienceID | 식사에 연결된 원문 목록 |
| 반복 | 식당 범위 안의 메뉴가 나타난 독립 식사 | 해당 메뉴의 방문 기록 |
| 경험 | 식당 ID/이름과 메뉴 ID/이름의 확인 가능한 범위 | 현재 관련 음식 |
| 호감 | 완료 음식의 직접 전체 평가 또는 명시적 원문 전체 긍정 | 해당 응답/원문 |
| 감각 | 같은 감각의 실제 긍정·부정·혼합 식사, 없으면 존재 기록 수 | 지지·반대 원문 |
| 알맞음 | 같은 범위의 preference fit 직접 응답 | 알맞음/부족/과함 근거 |
| 조건 | 같은 감각에서 한 조건 차원으로 구분되는 반대 평가 | 두 조건의 근거 |
| 차이 | 같은 음식 경험의 전체/부분 평가 | 전체와 감각 응답을 함께 표시 |
| 변화 | 확인 가능한 **기록일** 기준의 기록 구성 비중 | 기간과 분모, 해당 기록. 선호 전환을 뜻하지 않음 |

하단은 `HomeArchiveVisualizationEngine`의 표시 모델을 `HomeArchiveMetricsEngine`에서 호출한다. 모든 범주의 entryIDs/evidenceIDs가 상세의 필터다.

- 기록한 식사: 고유 mealID, 확인된 식사일의 일/주/월/연도 구간. 날짜가 없거나 같은 식사의 날짜가 충돌하면 시점 미확인에 둔다. 구간 간 공백은 실제 0회이며 보간하지 않는다.
- 경험한 메뉴: 식당 범위 안의 메뉴. 한 번 기록/여러 독립 식사에서 반복의 합이 메뉴 수다.
- 기록한 식당: 한 번 기록/재방문 기록의 합이 식당 수다. 같은 식사의 여러 접시를 재방문으로 세지 않는다.
- 음식 전체 평가: 현재 카탈로그의 5단계 직접 응답, 고유 experienceID. 미응답·충돌·원문 전체 평가를 별도 표시한다. 원문의 긍정/부정을 5단계 강도로 변환하지 않는다.

카운트 높이는 0 기준이고 0에는 최소 높이를 주지 않는다. 구성 막대는 분모를 표시한다. 상세는 범주 선택·필터 해제·현재 음식 원문·기존 수정 화면으로 연결된다. 상단 상세도 관련 범위를 표시하고 필터를 해제할 수 있다. 원본이 수정/삭제되면 현재 목록으로 다시 계산한다. 이전 계정의 상세는 닫는다.

2026-09-13 그래프 디자인 후속 수정: 기존 홈의 캡슐 막대·원형 끝점을 `TasteChartBarMark`로 추출해 기간 카드와 아카이브 카드·상세에서 공유한다. 카드의 기존 미각 팔레트와 `tasteBloomChartReveal`을 사용한다. 가로 구성 막대는 범주별 실제 비율의 폭을 유지하면서 `TasteChartTrackMark`의 연한 트랙·2pt 그라데이션 선·최대 12pt 원형 노드로 표시한다. 세로 막대 밑의 회색 기준선은 제거했다. 이어진 사용자 요청에 따라 홈 카드의 그래프 바로 아래 기간·단위·범례·평가 양끝 문구는 제거했다. 범위와 수치는 카드 본문·상세·접근성 요약으로 확인한다. 강도·호감 표의 유효 셀은 해당 감각의 기존 표면색·글자색으로 표시하며 호감 방향별로 색을 바꾸지 않는다. 집계와 질문 로직은 이 디자인 수정의 대상이 아니다. 전후 화면과 해당 수정만의 검증은 [그래프 디자인 검토](../../output/graph-style-reuse/visual-review.md)에 기록했다.

### 나의 입맛

- 타입은 기존 main/wing 안전장치를 유지한다. 완료 음식과 관련 독립 식사를 구분하고, 직접 평가·반대 근거를 기존 시트로 연다. 타입이 정해지지 않아도 후보의 근거는 숨기지 않는다.
- 레이더는 현재 선택한 출처/기간/척도를 보인다. 식사 강도와 기준 음식 회상을 합치지 않는다. 없는 축은 `—`이며 0이나 닫힌 다각형을 만들지 않는다. 유효한 회상 0은 실제 중앙 점이다. 이전 기록은 빈 점·점선, 현재 기록은 채운 점·실선이다. 기존 `taste.*` 축 계약을 유지한다. `mouthfeel.fatty`나 다른 향/질감을 미각 축에 대신 넣지 않는다. 지방 관련 직접 축 자료가 없으면 비워 둔다.
- 기존 비교 가능 조건·식사 수 정책은 유지한다. 자료가 없으면 ‘비교할 기록이 부족해요’, 실제 같은 값이면 같은 강도라고 표시한다. 현재 정책의 3회를 검증된 학습 표본수라고 주장하지 않는다.
- 기존 감각 상세의 3×3 매트릭스는 동일 경험·감각·reference·원선택/원문·대상·시점의 강도와 호감만 짝짓는다. 음식 전체 호감은 짝의 입력이 아니다. 짝 미확인과 현재 충돌은 따로 열람한다. 셀은 음식 경험 수이며, 같은 식사/다른 조건의 중복 가능성을 설명한다.

### 질문 수명주기

선택지가 없는 카드의 원문 보기 버튼만 나타나는 후속 오류와 수정·검증은 [질문 카드 답변 수정](</Users/sinjunho/Desktop/Taste Buddy/output/question-inline-fix/review.md>)에 기록했다.

2026-09-13 후속 UI 요청에 따라 펼친 질문 카드 하단은 직접 답하는 선택 버튼으로 정리했다. 반복 설명, ‘원래 기록 보기/수정’ 보조 버튼, 기억 안 남·나중에·숨기기 버튼을 함께 나열하지 않는다. 후속 제보로 원문 보기 버튼만 남는 경로를 제거했다. 홈·나의 입맛·질문 전체보기에는 실제 저장 가능한 선택지가 있는 질문만 표시한다. 원문 의미 확인·충돌·미래 식사 제안은 분석 대기열에 보존하지만 즉시 답변 카드에는 섞지 않는다. 오류 메시지, 안전 저장·실행 취소와 과거 보류 상태의 저장/복원 로직은 유지한다. 아래의 보류 정책과 이전 검증 이력은 데이터 계약의 기록이며, 현재 카드에 보조 버튼이 노출된다는 뜻은 아니다.

`SensoryAnalysisEngine → PersonalTasteModelBuilder.buildRecords(individualQuestions: true) → individualQuestionGroups → 실제 parser로 저장 가능한 선택지 검증 → 제한된 영향 계산 → availableSelections → answerableQuestions → 홈/나의 입맛/전체 질문 → AppModel 저장 → 현재 원문 재분석`이다.

1. 가족 ID는 기존 감각·reference·facet·대상·시점의 표시 주제다. 완료의 단위로 사용하지 않는다.
2. 개별 ID는 계정·experienceID·선택의 ID/종류/당시 버전/문구/부모 관계·확인 facet을 포함한다. 원문은 인용과 원구간을 함께 고정한다. 전체 observation hash, 데이터셋 revision, mealID만으로 식별하지 않는다.
3. 같은 식사의 여러 접시에도 각각 질문이 있다. 직접 응답이 있거나 충돌인 facet은 단순 누락으로 묻지 않는다.
4. `PersonalTasteInlineAnswer`는 View 밖의 `PersonalTasteQuestionAnswer.swift`에 둔다. 인라인 표시와 실제 저장 전 적용이 같은 parser 검사 경로를 사용한다. nil 레거시는 기존 분석과 동일한 effectiveSelections로 버블·태그를 복원해 선택지를 검증한다. 실제 답변 때에만 복원한 선택과 해당 응답을 저장하며 조회만으로 데이터를 바꾸지 않는다. 알 수 없는 나머지 ID와 메모·사진·식사·교정 정보는 보존한다. 선택 배열로 복원한 사실만으로 기존 감각의 knownAt을 답변 시각으로 바꾸지 않으며, 새 응답에만 새 시각을 사용한다. 명시적 []는 과거 태그를 되살리지 않는다. 자유 원문은 임의 선택지로 치환하지 않고 음식 기억/원문 근거의 수정 경로를 유지한다.
5. 부모로부터 상속된 유효 target/phase는 parser 결과로 검사한다. 답할 태그의 빈 facet만 변경한다. 부모·다른 태그·사진·기억 날짜/교정 정보를 복사 보존한다.
6. 응답 문맥에는 계정 generation과 열린 시점의 원본을 보관한다. 저장은 `updateDiningEntry(expected:)`의 현재 원본 비교와 encode/readback 성공 이후에만 완료·토스트를 확정한다. 최신 note/photo/다른 응답을 stale 편집으로 덮지 않는다.
7. 자유 회고의 완료는 같은 감각/범위의 실제 파싱 결과와 편집한 원구간을 확인한다. 다른 버블 추가나 원문을 그대로 두고 다른 문장에 답한 경우는 완료가 아니다.
8. 실행 취소는 응답 직후 원본과 현재 원본이 같은지, 계정이 같은지 검사한다. 이후 편집은 덮지 않는다. 삭제된 기록은 부활하지 않는다.
9. 현재 답을 삭제하면 원문에서 질문 후보를 재평가한다. 답변 사실과 노출 억제 기간은 별개다.

노출 정책은 주입 가능한 `PersonalTasteQuestionPresentationPolicy`다. 현재 기본값은 나중에 24시간, 기억 안 남 30일, 답 삭제 후 재노출 유예 24시간, 과거 가족 이력 이관 유예 7일이다. 이는 구현 정책이며 사용자 연구로 검증된 최적값이 아니다. 기본 숨기기는 개별 질문에만 적용한다. 미래 상태 문자열은 손실 없이 저장하고 노출만 보류한다.

과거 family resolved/dismissed를 모든 인스턴스 완료로 복사하지 않는다. 원문으로 답 여부를 확인하고, 과거 이력 뒤에 새로 생긴 원출처를 제외하고 일시 억제를 이관한다. 원출처 시각이 없는 옛 기록은 완료로 복원하지 않고 한 번의 유예만 보존한다. 새로 추가한 식사는 과거 가족 억제로 영구 차단하지 않는다. 당시 저장 시점이 미상인 원본에 답변을 합성하지 않는다.

2026-09-14 후속 정정에 따라 홈은 기본 스택 카드와 펼쳤을 때 최대 3개 표시를 유지한다. 메뉴별 대표 질문이나 고정 ID 묶음으로 대기열을 제한하지 않고, 현재 저장 가능한 전체 미응답 질문에서 표시할 카드를 매번 가져온다. 하나를 답하면 다음 대기 질문이 빈자리에 들어오며, 펼친 상태에서 3개를 초과하는 질문은 기존 ‘질문 전체보기’로도 열 수 있다. 마지막 질문이 해결되면 완료·빈 상태 문구 없이 질문 영역을 렌더링하지 않는다. 분석 중의 일시적 빈 snapshot은 처리 상태로 표시하며, 노출은 펼침/응답 등의 사용자 동작을 기준으로 기록하고 View 생성 자체를 인지로 세지 않는다. 이번 스택 복원은 사용자 요청에 따라 빌드·실행 검증을 생략했다. 이전 전체 나열 UI의 검증 결과는 이 변경의 검증 근거가 아니다.

분석 대기열의 우선순위는 현재 기억 보완 → 편집 가능한 중요한 원문/충돌 → 선택적 새 경험 관찰이다. 즉시 답변 UI는 이 대기열에서 저장 가능한 선택지를 다시 확인한 질문만 사용한다. 같은 종류 안에서는 실제 인라인 저장 가능성, facet의 기존 정책, 조건/반례를 구분하는 기존 영향 계산, 안정된 출처 순서로 정렬한다. 영향 계산은 상위 12개에 한정하며 가상 값은 실제 저장 가능한 응답만 사용한다. 원문 편집이나 복원이 불가능한 선택처럼 안전한 버튼 응답이 없는 질문의 가상 영향은 계산하지 않는다. 값은 정확도·사용자 가치·정보이득의 검증 수치가 아니다. 영향이 0인 기억도 열람/수정할 수 있다. 탐색은 한쪽 끝의 강도만 있을 때 인접 범주를 제안하며, 중간만 있고 두 방향이 동률이면 임의로 약함부터 권하지 않는다.

원문 의미 확인은 parser가 확인이 필요하다고 남긴 note와 실제 충돌에만 연결한다. 모르는 카탈로그 ID/버전을 임의의 선택으로 바꾸는 질문은 만들지 않는다. 홈 답변 카드에서 제외된 원문도 기존 음식 기억 목록과 원문 근거에서 열고 수정할 수 있다.

### 공유 수명주기와 호환성

장기 음식 기억의 미커밋 구현(`DiningMemoryContext`, `FoodMemory`, 현재 원문 expected 비교, 계정 generation, export source fingerprint)을 재사용한다. 이번 작업은 새 서버 저장소·운영 migration·외부 전송 경로를 추가하지 않는다. 기존 공유 모델 v2 fixture 경로는 `individualQuestions: false` 기본값으로 유지한다. 네이티브 질문 ID/노출 상태는 현재 앱의 응답 경로에 적용한다. 실제 내보내기 데이터와 가상 답변은 분리한다.

`output/home-taste-questions/preexisting.patch`가 이번 작업 전 사용자 변경의 기준이다. Git 전체 diff에는 이전 장기 기억 작업도 포함되므로 전체 diff를 이번 구현의 단독 결과로 해석하지 않는다.

## 검증 기록

- 시작 원격과 로컬 HEAD 일치: 위 SHA. reset/stash/rebase 하지 않았다.
- baseline 핵심 재현: 같은 감각의 A/B를 기존 가족 ID로 묶으면 질문 1개이고 A 억제 후 0개였다. `question-baseline-core.log`.
- 수정 후 macOS Foundation 실행: A/B 2개 → A 억제 후 B 1개, 새 C 독립 생성, 관찰 hash 변경에도 논리 ID 유지, 입력 순서 불변, 가상값 비유입. 공유 모델 21 fixture와 예측이 동일했다. 이 실행은 iOS 저장/화면 검증이 아니다.
- baseline iOS XCTest: 29개 실행, `TastePerceptionTests.testCompletedMealFlowSeparatesStrengthLikingAndFit` 한 사례의 assertion 2개 실패. 기존 날짜 출처 변경 후 합성 자료에 확인된 식사일이 없는데 시점 비교를 기대했다. 테스트에 실제 확인된 날짜 출처를 명시하고, 미확인 날짜를 비교에서 제외하는 별도 회귀를 추가했다.
- baseline 화면: 같은 QA 시뮬레이터의 `before-home.png`, `before-analysis.png`. 기본 7개 합성 기록이며 사용자의 실제 기록이 아니다. `baseline-current.png`는 SpringBoard이므로 앱 전후 증거로 사용하지 않는다.
- iOS 단위/통합 실행과 성능 수치는 아래 최종 결과에 기록했다. 화면 실행은 별도 결과로 구분한다.


홈 표시 결과는 `HomeArchivePresentation`으로 만들어 `AppModel.homeArchivePresentation`에 게시한다. 원본 mutation 시 즉시 nil로 무효화하고, 취소되지 않은 최신 분석 revision에서만 결과를 반영한다. View/상세는 이 결과를 읽고 원문 목록은 현재 `diningEntries`에서 조회한다. 스크롤·보류·단순 펼침으로 홈 엔진을 다시 실행하지 않는다. 강도/호감 질문의 실제 선택 조건 검사는 분석 한 번 안에서만 캐시하므로 계정 간 자료를 재사용하지 않는다.

대용량 샘플링에서 확인한 반복 작업은 전체 관찰 배열에서 같은 범위의 호감과 원출처를 찾는 조회였다. 기존 `scopeGroups`, `sourcesByID`, 음식별 전체 평가 인덱스를 재사용하도록 바꿨다. 같은 조회 결과를 사용하고 공유 21 fixture/예측 비교로 의미가 유지되는지 확인했다. 전후 성능값은 최적화하지 않은 Debug 실행이며 실기기/Release 수치가 아니다.

재현 명령은 `bash scripts/verify-home-taste-questions.sh <현재 시뮬레이터 UUID> unit <고유 실행명>` 및 같은 명령의 `ui` 모드다. 실행 전에 `xcrun simctl list devices available`로 목적지를 확인한다. 실제 사용한 목적지는 `54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4`, iOS 26.5이다. DerivedData는 `/tmp/TasteBuddyHomeQuestionsQA`, 출력은 `output/home-taste-questions/<실행명>.log/.xcresult`다. 원격 배포/DB 쓰기 없이 로컬 합성 자료만 실행한다.

검증 중 변경의 구분:

- `integration-1`: 새 통합 19개와 여러 기존 모듈은 통과. 기존 AM27은 raw 후보가 숨김 뒤 삭제된다고 기대해 실패했다. 현재 미응답과 화면 노출을 나눈 계약에 따라 raw 후보 보존 + 공통 노출 필터의 다음 항목을 검사하도록 수정했다. 2,000개 기존 부하 검사는 병목 조사/수정 후 중단했다. 전체 회귀 통과로 집계하지 않는다.
- `integration-2/3`: QA Reduce Motion 환경 주입이 read-only라는 빌드 오류, 테스트의 Void 반환 오용을 각각 수정했다. 실행 성공으로 집계하지 않는다. 실제 시스템 Reduce Motion 설정을 바꿨다는 증거로도 사용하지 않는다.
- `integration-4`: 수정된 홈 캐시/개별 reference 등을 포함한 통합 실행. 대용량 반복 조회를 샘플링하고 개선한 뒤 이전 빌드를 중단했다. 전체 회귀 통과로 집계하지 않는다.
- 공유 계약 검사: `node scripts/build-personal-taste-model-contract.mjs --check`, macOS 실제 모델 실행 `python3 scripts/test-native-question-instances.py`. 21 fixture와 예측 동일.
- 수신 측 로컬 회귀: `node --test integrations/chatgpt/test/*.test.mjs`, 7개 통과. v2 원문 revision/미확인 식사 시점/출처 불일치/중복 경험/비공개 필드 범위 검증이다. 운영 내보내기를 수행하지 않았다.


### 추가 회귀에서 확인한 차이

`integration-6`은 187개 테스트를 끝까지 실행했고 5개 사례에서 assertion 8개가 실패했다. 마지막 대용량 검사는 2,000개에 최초 분석 222.102초, 교정 후 재분석 236.839초였다. 이는 최적화하지 않은 Intel iOS 시뮬레이터의 합성 부하이며 제품 성능 목표를 충족했다는 뜻이 아니다.

- `TastePerceptionTests.testSharedEvidenceCases`: 이번 지방 질감→미각 축 연결이 기존 공유 `fat-mouthfeel-is-not-fat-taste` 계약을 깨뜨린 신규 회귀였다. 저장 축과 의미를 유지하도록 해당 연결을 제거했다. 결측 지방 축을 억지로 채우지 않는다.
- 계정 복원 2개 사례: 기존 `bookmarkRecords(from:)`가 모르는 식당 ID를 카탈로그 기본 식당 `onjium`으로 바꿨다. ID는 그대로 보존하고 이름이 없으면 ‘저장한 식당’으로 표시하도록 수정했다. 다른 기기 복원/충돌 복원 테스트가 이 경로를 검증한다.
- 계정 동기화 1개 사례: JSON 객체 키 순서에 따라 같은 원문의 바이트가 달랐다. 직렬화한 바이트의 순서 대신 수신 JSON을 실제 `DiningEntry`로 복원하여 원본 전체와 비교한다.
- 전체 평가 교정 1개 사례: 이전 테스트는 전체 평가만 바꿔도 감각의 `knownAt`이 갱신되고 교정 이력이 없기를 기대했다. 현재 장기 기억 계약에 맞게 감각의 원래 knownAt 보존, sourceRevision 갱신, 교정 이력 생성, 원문 필드 전체 보존을 검사한다.
- 프로필 계산에서 `directLiking`의 각 평가가 전체 자료를 다시 훑는 것을 실행 샘플링으로 확인했다. 동일 scope의 존재 부정 집합을 먼저 만들고 조회하여 기존 제외 조건을 그대로 유지한다.

### 고정 요구 사례와 실행 위치

| 사례 | 실제 검사 위치와 의미 |
|---|---|
| M1–M9 / C1 | `HomeTasteQuestionsIntegrationTests.testM1ThroughM9AndC1KeepOriginalMeaningAndCorrectionScope`의 고정 원문, 전체/부분/이유 미상/생성 요약 제외/교정 범위. 기존 `LongitudinalFoodMemoryTests`의 검색·반례·회고 시각도 함께 실행 |
| Q1–3 | A/B/C 개별 ID, 새 식사, 답 삭제 후 현재 후보 재평가. 기본 모델 결함은 수정 전 Foundation 실행에서 별도로 재현 |
| Q4–7 | 레거시/빈 배열, 실제 카탈로그 부모 상속, intrinsic, 충돌과 미응답 구분, parser 검증 가능한 선택지만 적용 |
| Q8 | 같은 식사의 다른 디시, 다른 reference, 기존 `testQuestionMediaUsesOnlyItsSourceMealAndNeverAFutureMeal`의 사진 출처 |
| Q9–10 | 보류/기억 안 남/숨김/펼침이 원문·관찰을 바꾸지 않음, 재실행 후 억제 유지와 만료 |
| Q11 | 계정 generation, 삭제, 다른 선택/부모 변경, 동시 편집 뒤 stale 저장 거절 |
| Q12 | encode 실패 시 미완료; 원문 저장 직후 질문 이력 전 중단을 재현하고 새 AppModel에서 원문을 다시 분석해 이미 답한 질문을 제외 |
| Q13 | 기존 즉시 취소와 이후 편집 보호 테스트; UI에서 답변 토스트→취소 경로는 별도 화면 실행 |
| Q14 | `PersonalTasteQuestionResolutionTests`의 무관한 단맛·다른 선택·다른 대상/시점·다른 원문 구간이 원래 질문을 완료하지 않음 |
| Q15 | 실제 모델 Foundation 재현의 가상 observation 비유입, 기존 모델 hypothetical 회귀, 공유 21 fixture/예측, 로컬 export 수신 계약 |
| Q16 | 기존/새 배치 테스트의 최대 3개·자동 보충 없음·명시적 갱신. 계정 변경 시 View reset은 코드 연결 확인이며 계정 전환 UI 자동화는 별도 미실행 |
| Q17 | 과거 family 이력의 알려진/미상 날짜 이관, 새 식사에는 과거 억제를 복사하지 않음 |
| Q18 | 호감 답변 뒤 강도는 다른 ID/facet, 같은 원출처 유지 |

표는 테스트 범위 매핑이며 화면 실행 여부와 최종 통과 결과는 실행 결과표에서 별도로 구분한다. 앱 프로세스를 OS가 강제 종료하는 순간의 복구는 수행하지 않았고, Q12는 저장/이력 사이 상태와 새 AppModel 복원으로 재현한다.

### 제품 검증 계획

실제 사용자 연구는 수행하지 않았다. 합성 자료로 구현과 기록 의미를 확인한 결과만 보고한다. 후속 사용성 검증에서는 참여자가 (1) 타입의 호감과 레이더의 강도를 구분하는지, (2) 질문이 가리키는 식당·음식·부위·시점을 설명할 수 있는지, (3) 차트에서 과거 음식과 반대 경험을 찾아 비교할 수 있는지, (4) 기억이 없을 때 억지 답변 없이 보류할 수 있는지를 과제 수행과 설명으로 확인한다. 성공률·소요 시간·오해한 문구를 기록하고, 취향 정확성·유지율 향상으로 확대 해석하지 않는다.


### 최종 단위·통합 실행

`integration-7`: **193개 테스트, 실패 0개**, 실제 iOS 26.5 시뮬레이터에서 332.429초 실행, xcodebuild 종료 코드 0. 19개 선택 suite이며 저장소의 모든 테스트를 실행했다는 뜻은 아니다. 새 `HomeTasteQuestionsIntegrationTests` 23개, 기존 질문 저장 18개, 계정·장기 기억·전체 평가·구조화 감각·공유 모델·홈 집계·레이더와 공통 Reduce Motion 정책이 포함된다. 이 실행 이후 차트 View에만 반복 막대 대비와 전체 평가 양 끝 문구를 추가했으며 실제 UI 빌드/실행에서 검증한다.

| 합성 자료 | 규모 | 최초 분석 | 교정 후 재분석 | 기타 |
|---|---:|---:|---:|---|
| 구조화 선택 | 50 | 0.325초 | 별도 아래 회고 검사 | 차트 0.014초 / 필터·요약 0.019초 |
| 구조화 선택 | 500 | 3.348초 | 별도 아래 회고 검사 | 차트 0.133초 / 필터·요약 0.150초 |
| 자유 회고 | 50 | 0.612초 | 0.622초 | 기억 인덱스·비교 0.030초 |
| 자유 회고 | 500 | 11.835초 | 12.609초 | 기억 인덱스·비교 0.205초 |
| 자유 회고 | 2,000 | 136.442초 | 121.959초 | 기억 인덱스·비교 0.665초 |

`SWIFT_OPTIMIZATION_LEVEL=-Onone`의 Intel 시뮬레이터 수치이며 다른 로컬 작업 부하가 있었다. 전후 고정 성능 비율이나 실기기/Release 성능을 입증하지 않는다. 특히 2,000개 자유 회고의 전체 재분석은 아직 느리다. 앱은 이를 background 작업으로 처리하고 현재 원문은 즉시 조회하며 홈 표시 모델은 최신 revision 결과만 반영한다. 긴 전체 재분석의 추가 최적화와 실기기 프로파일링은 남은 성능 과제다.


### 화면 검증 중 실제 발견과 수정

`ui-1`은 3개를 실행해 레이더/매트릭스 근거 탐색 1개 통과, 2개 실패였다. 큰 글자에서 ‘나중에’ 버튼의 AX 영역이 40.667pt로 측정됐다. `.frame(minHeight: 44)`를 Button 바깥이 아닌 실제 label 안에 두고 contentShape를 지정했다. 홈 답변 버튼은 실제 화면에 있었지만 부모의 `taste-question-answers` 식별자가 자식의 개별 식별자를 덮어썼다. 실패 당시 AX 트리에서 세 버튼 모두 같은 부모 식별자로 노출된 것을 확인해 상위 식별자를 제거했다. 통과 기준을 낮추지 않고 같은 실제 버튼·44pt 검사를 다시 실행한다.


`ui-2`에서 홈 질문 응답→성공 안내→취소→전체 평가 ‘정말 좋았어요’ 범주→현재 음식 원문 흐름이 통과했다. 매트릭스 추가 검사는 뒤 시트에도 존재하는 같은 이름의 메뉴를 첫 번째로 선택해 실패했다. AX 트리에서 앞 시트의 마지막 메뉴와 뒤 시트의 여러 메뉴가 모두 조회되는 것을 확인하고 현재 가장 위 시트의 메뉴로 한정했다. 44pt 보조 버튼은 큰 글자의 픽셀 반올림으로 43.667pt가 되어 최소 48pt label로 확보했다. 접근성 글자 크기의 보조 응답은 세로 목록으로 바꾸고, 하단 탭 문구는 xxxLarge까지 확대하며 한 줄로 유지한다. 전체 접근성 이름은 보존한다. 기본 크기의 탭 모양/순서는 유지한다.


`ui-3`은 홈 응답/차트 원문과 큰 글자 조작 2개가 통과했다. 레이더 검사는 상위 카드 식별자가 비활성 ‘이전 기간’ 버튼에도 전달되어 hit point를 구하지 못했다. 읽기 대상인 Canvas의 접근성 이름/값으로 선택하고, 스크롤 위치는 섹션 제목으로 확인하도록 바꿨다. 미응답 단맛과 실제 신맛 강도 3의 AX 값도 검사한다. 원문 선택 메뉴에는 현재 원본의 식사일/기록일 설명을 붙여 같은 메뉴의 여러 경험을 구분한다. 이는 식사 시각이 미확인인 기록에 날짜를 새로 확정하는 동작이 아니다.


### 최종 실제 화면 실행

`ui-4`: **3개 UI 테스트, 실패 0개**, iOS 26.5 / 402×874pt 시뮬레이터에서 146.285초. 모든 자료는 기존 합성 7개에 식사일을 명시한 QA 변형이며 실제 사용자 기록이 아니다.

1. `test01QuestionScopeAnswerUndoAndChartCategoryOriginal`: 식당·음식·국물·먹는 동안을 확인, ‘중간 정도’ 응답 저장, 성공 안내, 취소, 전체 평가 ‘정말 좋았어요’ 범주, 현재 음식 원문 열기. 45.226초.
2. `test02LargeTypeQuestionAndMetricActionsRemainReachable`: accessibilityExtraExtraExtraLarge, 한 줄 하단 탭과 도달 가능성, 보조 응답의 실제 AX 영역 44pt 이상, ‘나중에’, 기록한 식사 상세의 0건 미확인 범주와 필터 해제. 39.559초.
3. `test03AnalysisRadarMissingAxesAndMatrixOriginal`: 단맛 ‘기록 없음’과 신맛 직접 강도 3의 AX 값, 강함×부정 셀의 3개 경험, 해당 근거 목록, 44pt 이상 원문 메뉴, 2026년 9월 7일의 특정 원본 C4 열기. 61.478초.

UI 검증은 실제 SwiftUI 앱을 XCUITest로 조작한 결과다. 193개 단위·통합 이후에는 차트 대비/끝 문구, 질문과 원문 버튼의 터치 영역, 큰 글자 보조 동작·탭 배치, 원문 메뉴 날짜만 추가 변경했고 UI 빌드/실행으로 확인했다. 도메인·저장 로직은 해당 단위·통합 통과 이후 바꾸지 않았다.

### 확인한 범위와 남은 검증

- 실제 확인: 관련 단위·통합 193개, UI 3개, 공유 모델/예측 21 fixture, 로컬 export 수신 회귀 7개. 320pt/402pt 홈 호스팅·스크롤 검사는 단위 suite, 실제 앱 UI는 402pt 시뮬레이터다.
- 접근성: 큰 글자 조작, 실제 AX 터치 영역, 차트 읽기값을 확인했다. Reduce Motion 공통 정책의 애니메이션/대기 제거 5개 테스트도 통과했다. 실제 VoiceOver 음성 탐색이나 시스템 Reduce Motion 설정을 켠 기기 조작을 수행한 결과는 아니다.
- 실제 기기 성능, 운영 Supabase 백업·복원·삭제/내보내기, OS 강제 종료 타이밍, 계정 전환 UI 자동화, 사용자 연구는 별도 검증이 필요하다. 계정 격리/저장 사이 중단 상태는 로컬 통합 테스트로 확인했다.
- 2,000개 자유 회고의 전체 재분석 시간은 개선이 필요하다. 표시 캐시와 현재 원문 조회 분리만으로 Release/실기기 성능을 보증하지 않는다.


### 전후 화면과 최종 작업 상태

[실제 전후 화면과 UI 캡처](</Users/sinjunho/Desktop/Taste Buddy/output/home-taste-questions/visual-review.md>)에 기본 합성 7개 전후 비교와 날짜 확인 QA 변형을 구분했다. 기본 홈은 `--sensory-insights-home-qa --question-stack-expanded-qa`, 기본 분석은 `--sensory-insights-qa`로 같은 시뮬레이터에서 캡처했다. 새 그래프의 0 기준/끝 범주, 원문 이동, 큰 글자 보조 동작과 하단 탭을 실제 PNG로 검토했다. 레이더 스크롤 캡처는 보이는 하단 범위이며 전체 카드 합성 이미지가 아니다.

핵심 변경 위치:

- 홈 표시/원문: `HomeArchiveVisualizationModels.swift`, `HomeArchiveVisualizationViews.swift`, `HomeSummaryModels.swift`, `HomeSummaryComponents.swift`, `HomePeriodInsightComponents.swift`, `HomeView.swift`.
- 질문: `PersonalTasteQuestionInstance.swift`, `PersonalTasteSourceReviewQuestions.swift`, `PersonalTasteQuestionAnswer.swift`, `PersonalTasteModel.swift`, `PersonalTasteQuestions.swift`, `SensoryAnalysisEngine.swift`, `AppModel.swift`.
- 나의 입맛/접근성: `AnalysisView.swift`, `SensoryAnalysisCards.swift`, `TastePerceptionCards.swift`, `TasteRadarView.swift`, `TasteIntensityLikingMatrix.swift`, `TasteIntensityLikingMatrixView.swift`, `AppChromeComponents.swift`.
- 실행: `HomeTasteQuestionsIntegrationTests.swift`, 관련 기존 테스트, `TasteBuddyMemoryUITests/FoodMemoryUITests.swift`, `scripts/verify-home-taste-questions.sh`, `scripts/test-native-question-instances.py`.

최종 확인: `git diff --check` 통과. HEAD는 시작 SHA를 유지하며 변경은 로컬 미커밋 상태다. 기존 장기 음식 기억·서버 변경은 시작 자료와 함께 보존했다. 이번 작업에서 운영 DB 적용이나 외부 데이터 게시를 수행하지 않았다.
