# 개인 모델 v2: 알맞음, 전체 평가, 다음 질문

상태: 2026-09-07 로컬 구현·개발 검증 완료.

구현 범위는 `tba-personal-taste-model/2`의 세 가지 확장이다. 기존 기록 형식과 질문 이력의 의미 식별자는 유지한다. 외부 API나 RAG·LLM 연결, 기간 변화와 감각 조합의 추가 분석은 이번 변경에 포함하지 않는다.

## 알맞았던 수준과 조건

`fitPatterns`는 `preference-fit-v1`의 `below_preferred`, `just_right`, `above_preferred`를 호감과 별도로 집계한다. 같은 선택·기록·부위·시점에서 실제 보고한 강도만 연결한다. 명시 조건은 기존처럼 최대 두 차원이며 강도·부위·시점·음식 종류를 사용한다.

- 같은 식사 안의 같은 응답은 한 표다. 원표현과 선택·조건 출처는 모두 보존한다.
- 같은 식사에 서로 다른 알맞음 응답이 있으면 `mixed`로 세며 중립으로 환산하지 않는다.
- 같은 범위에 존재 부정 응답이 있거나 유효하지 않은 척도·응답이면 패턴 근거로 사용하지 않는다.
- 최소 식사 수 이상에서 식사별 응답이 모두 같을 때만 `repeated_fit`이다. 기본 최소값은 3이며 보정된 과학적 임계값이라는 주장이 아니다.
- 그 외에는 부족함·알맞음·과함·한 식사 내 복수 응답의 실제 분포와 관찰 부족 상태를 보여준다.

예를 들어 중간 강도에서 알맞음 3회, 강한 강도에서 과함 3회가 있어도 산미 자체의 불호를 생성하지 않는다. 같은 근거가 여러 조건 카드에 쓰여도 전체 식사 수를 합산하지 않는다.

## 음식 전체와 개별 감각의 교차 해석

`overallPatterns`는 전체 5단계와 개별 호감 3단계의 정확한 평가 쌍을 보존한다. 5단계의 간격을 수치로 가정하거나 3단계로 압축하지 않는다. 중립과 미응답을 구별한다.

연결 단위는 같은 `experienceId`와 `mealId`다. 호감 평가를 식사 단위로 합친 뒤 다른 메뉴의 전체 평가를 붙이지 않는다. 같은 평가 쌍이 한 식사의 여러 메뉴에 있으면 한 번만 센다. 한 식사 안에 서로 다른 평가 쌍이 있으면 `mixedMealIDs`에 따로 남기며 어떤 한 쌍의 반복 근거로도 더하지 않는다.

카드는 “전체는 정말 좋았어요, 산미는 아쉬웠어요가 함께 나온 식사”처럼 함께 나타난 양상을 설명한다. 원인·기여도·상관 계수를 계산하지 않는다. 요약에는 전체 조건에서 관찰한 평가 쌍 하나와 식사 수, 다른 평가의 존재를 짧게 표시하며 상세에서 조건별 분포와 모든 평가 쌍을 확인한다. 반복 수에 이르지 못한 쌍은 관찰 사례로 표시하고 같은 식사 내 차이도 근거 상세에 남긴다.

## 답변에 따른 다음 질문 선정

기존 호감 미응답, 강도·부위·시점 미응답, 새 강도 탐색 후보를 유지하고 알맞음만 있는 기록의 조건 누락도 포함한다.

1. 질문이 실제로 보완할 원관찰 하나를 `responseSourceID`로 지정한다. 같은 의미로 묶인 여러 원관찰 중 정렬된 첫 유효 출처를 사용하며 모든 원기록을 한꺼번에 바꾼다고 가정하지 않는다.
2. 호감·강도의 가능한 세 응답, 부위·시점은 실제 다른 기록에서 보고한 값만 임시로 적용한다. 이미 충돌한 강도 응답은 미응답처럼 덮어쓰지 않는다.
3. 해당 감각·참조 범위의 현재 해석을 재사용하고, 응답 분기의 조건별 호감·알맞음·반복 평가 쌍을 같은 규칙으로 다시 계산한다. 최소 근거 수에 이르지 못하는 분기는 비교를 생략한다.
4. 가능한 답변과 현재 상태 사이에서 달라지는 유효 해석 수가 많은 질문을 우선한다. 영향이 같으면 기존 누락 항목의 우선순위, 연결된 식사 수, 의미 식별자 순으로 결정한다.

질문 분기에서는 판단에 쓰이지 않는 근거 목록·전체 평가 연결·다음 질문의 재생성을 생략한다. 동일한 조건 조합도 한 번만 구성한다. 원래 계산과 모든 판단·분포가 같은지 별도로 비교하며, 실제 반환 결과의 출처는 그대로 유지한다.

이 비교는 답변의 확률이나 사용자 취향의 정확도를 추정하는 정보 이득 모델이 아니다. 현재 규칙의 해석 상태가 달라질 수 있는지 확인하는 결정적 비교다. 가상 응답·근거는 반환·저장하지 않으며 관찰 수를 늘리지 않는다. 해석 수는 겹치는 조건을 포함한 내부 선정 기준으로, 독립된 근거 수나 화면의 신뢰도 점수로 사용하지 않는다.

기존 기록 보완은 지정한 출처의 저장 레코드를 열고 해당 버블·태그 이름을 질문 카드에 표시한다. 명시 선택에서 시작한 질문은 같은 선택 ID·종류·카탈로그 버전·연결 버블의 응답으로만 완료한다. 다른 선택에 같은 감각 평가를 남긴 것으로 원질문을 해결했다고 처리하지 않는다. 메모에서 시작한 질문은 메모 응답의 감각·참조·범위를 확인하며, 별개의 버블·태그 선택만 추가한 것으로 완료하지 않는다.

## 앱과 코드

- JS: `scripts/tba-engine/personal-taste-insights.mjs`, `personal-taste-questions.mjs`; 기존 `personal-taste-model.mjs`에서 연결한다.
- Swift: `PersonalTasteInsights.swift`, `PersonalTasteQuestions.swift`; 기존 `PersonalTasteModelBuilder`와 같은 계약을 계산한다.
- 분석 화면에 기존 `InterpretationCard`와 디자인 토큰을 사용한 알맞음·전체 교차 카드와 식사별 원응답 상세를 추가한다. 홈은 같은 결과의 요약을 사용한다.
- `AppModel`은 수정·삭제 후 전체 개인 모델을 재계산하므로 새 집계와 질문의 근거도 함께 갱신한다.
- 별도 검증 진입점 `--sensory-insights-qa`, `--sensory-insights-home-qa`, `--sensory-fit-detail-qa`, `--sensory-overall-detail-qa`는 `AppModel.preview`를 사용한다.

## 검증

검증은 JS의 독립 의미 검사, JS/Swift 공유 계약, 실제 Native 선택 입력·질문 저장 경로, 앱 빌드·단위 검사와 시뮬레이터 표시를 구분한다. 기존 AM 의미 기준과 합성 시계열 평가의 정답은 변경하지 않는다. 실제 사용자 예측 정확도나 실기기 상호작용 검증을 대신하지 않는다.

- 전체 TBA 플랫폼·엔진 Node 검사: 165/165 통과, 실패·skip 0. 새 의미 검사 14개를 포함한다.
- 계약 파일 최신성: 개인 모델 21개, 선택형 수집 277개, 감각 정제 135개 fixture 확인 통과.
- macOS에서 실제 Swift 모델 소스를 컴파일해 공유 계약 21개와 예측을 실행: JS 결과와 불일치 0개. 입력 DTO는 앱 소스의 원문 선언을 사용했다. 이 검사는 iOS 앱 실행 검증과 구별한다.
- 성능 표본: `swiftc -O`로 컴파일한 동일 Swift 모델에서 250회 식사·1,000개 관찰의 현재 결과와 다음 질문 계산 9.43초. 같은 Mac에서 다른 빌드가 실행 중인 단회 측정이며 실기기 지연을 뜻하지 않는다. 앱은 전체 분석을 백그라운드에서 계산한다.
- iOS 앱과 테스트 실행 파일 빌드 성공. 전용 iPhone 17 Pro 시뮬레이터(iOS 26.5, x86_64)에서 단위 검사 280/280 통과, 실패·skip 0. `PersonalTasteInsightTests`, 공유 계약, 실제 질문 저장·완료 경계 검사를 포함한다.
- 마지막 요약·안내 문구 수정 후 앱을 다시 빌드하고 관련 iOS 검사 10/10 재통과. 위 280개 전체 실행은 이 문구 수정 전이며, 엔진·저장 로직은 이후 바꾸지 않았다.
- 전용 시뮬레이터에서 홈·분석·알맞음 상세·전체 평가 상세를 실제 실행해 확인했다. 마지막 문구가 적용된 홈·알맞음 상세도 다시 확인했다. 홈에서 출처 선택명과 질문 선정 이유가 표시되고, 상세에서 두 평가의 분리·조건별 분포·식사별 원응답 연결을 확인했다.
- 실기기의 전체 터치 경로, VoiceOver, 큰 글자 크기와 실제 사용자 예측 정확도는 이번 검증에 포함하지 않는다.

Node 로그: `/tmp/tba-engine-v2-node-complete.log`. 최종 Swift 공유 계약·성능 실행 파일: `/tmp/tba-engine-v2-core-check/contract-check-release-final`.

iOS 빌드 로그는 `/tmp/tba-engine-v2-build-final.log`, 최종 단위 검사 로그와 결과는 `/tmp/tba-engine-v2-native-host-recovered.log`, `/tmp/tba-engine-v2-native-host-recovered.xcresult`에 있다. 시뮬레이터 서비스 연결 오류를 복구한 뒤 완료한 실행의 결과다.

마지막 문구 검사는 `/tmp/tba-engine-v2-copy-final.log`, `/tmp/tba-engine-v2-copy-final.xcresult`에 있다. 화면 캡처는 `/tmp/tba-engine-v2-analysis.png`, `/tmp/tba-engine-v2-home-final.png`, `/tmp/tba-engine-v2-fit-detail-final.png`, `/tmp/tba-engine-v2-overall-detail.png`다.

실행 명령은 프로젝트 루트 기준이다. 재실행 시 결과 번들 경로는 새 경로를 지정한다.

```bash
node --test scripts/tba-platform/*.test.mjs scripts/tba-engine/*.test.mjs
node scripts/build-personal-taste-model-contract.mjs --check
node scripts/build-dining-sensory-selection-contract.mjs --check
node scripts/build-tba-sensory-native-contract.mjs --check
xcodebuild -jobs 2 -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/tba-sensory-deriveddata -disableAutomaticPackageResolution ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES build-for-testing
xcodebuild -xctestrun /tmp/tba-sensory-deriveddata/Build/Products/TasteBuddy_iphonesimulator26.5-x86_64.xctestrun -destination 'platform=iOS Simulator,id=8E064D18-EF6F-4D6D-9437-B3707A1F57CF,arch=x86_64' -destination-timeout 300 -parallel-testing-enabled NO -collect-test-diagnostics never -resultBundlePath /tmp/tba-engine-v2-native-host-recovered.xcresult test-without-building
xcodebuild -jobs 2 -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination 'platform=iOS Simulator,id=8E064D18-EF6F-4D6D-9437-B3707A1F57CF,arch=x86_64' -derivedDataPath /tmp/tba-sensory-deriveddata -disableAutomaticPackageResolution -parallel-testing-enabled NO -collect-test-diagnostics never -only-testing:TasteBuddyTests/PersonalTasteInsightTests -resultBundlePath /tmp/tba-engine-v2-copy-final.xcresult test
```

웹 앱 소스는 변경하지 않아 웹 앱 빌드는 실행하지 않는다.
