# TBA 근거 연결·독립 식사 집계 수정

작성일: 2026-09-15. 적용 체크아웃: `/Users/sinjunho/Desktop/Taste Buddy`.
시작 HEAD: `d1845d0`; 기존 미커밋 미식 데이터 v2 변경을 보존한 상태에서 수정했다.
네이티브 분석 버전: `tba-native-sensory/4`.

## 변경 범위

### 선택별 근거 연결

`Domain/Models/SensoryAnalysisModels.swift`의 `SensoryEvidenceLinkage`가 선택 종류,
선택 ID, 카탈로그 버전, 연결 부모 ID를 함께 비교한다. 식별 필드가 없는 선택은
다른 관찰과 연결하지 않는다. 서로 다른 응답 facet은 동일한 선택에 속할 수 있다.

보조 인사이트·메인/윙의 범위 키에는 기록 ID, 감각 속성, 참조, 대상, 시점과 선택
정체성을 함께 넣는다. 자유 회고는 원본 필드를 구분하고 구조화 선택과 연결하지
않는다. 키는 구분자나 nil/빈 문자열로 충돌하지 않도록 JSON으로 표현한다.

`PersonalTasteModelBuilder.sameSelection`과 `TDNativeAdapter`의 식별 검증도
같은 helper를 재사용한다. 미식 v2가 이미 제공하는 `validatedIntensityLinks`와
현재 원본에서 검증한 부모 버블 연결은 보존한다. 검증 없이 부모가 같다는 이유로
형제 선택끼리 강도·호감을 합치지 않는다.

### 독립 식사와 요리 기록

`SensoryAnalysisEngine.buildInsights`의 반복 선호 분류는 `independentMealID`의
고유 개수를 사용한다. 한 식사의 두 요리는 두 원본 근거지만 반복 식사는 아니다.
`experienceIDs`는 그대로 유지해 두 원문 모두 열 수 있고, 여러 원본이 있을 때
본문에 식사 수와 요리 기록 수를 각각 표시한다. 개인 모델의 최소 3식사 정책과
메인/윙의 기존 후보 정책은 변경하지 않는다.

### 자유 회고와 선택형 집계

최신 미식 데이터 v2의 선택형 응답 전용 측정 계약은 유지한다. 자유 회고에서
추출한 진술은 전체 TBA 분석에 남으며, 사진·생성 요약을 응답으로 채우지 않는다.

이전에는 자유 회고의 정상 관찰도 `현재 직접 응답과 관찰 불일치` 이슈가 되어
같은 식사·감각의 정상 선택 응답까지 발견 계산에서 제외될 수 있었다. 어댑터는
`sourceField == note`이고 선택 증거가 없는 관찰 집합을 측정 범위 밖으로 처리한다.
이것은 유효 근거 추가나 해석 성공 처리가 아니라 선택형 측정에서의 제외다.
선택 근거와 note가 섞인 동일 관찰 ID 충돌, 오래된 선택, 분석 대기 등은 기존 검증을
계속 거친다.

감각·취향·맥락·변화 화면과 감각 근거를 사용하는 발견 상세에 다음 범위를 표시한다.

> 감각·평가 집계는 선택형 응답 기준이에요. 자유 회고는 원문과 나의 입맛 분석에 남으며, 이 집계에는 포함하지 않아요.

## 수정 파일

- `ios/TasteBuddy/Domain/Models/SensoryAnalysisModels.swift`
- `ios/TasteBuddy/Domain/Models/PersonalTasteModel.swift` — 기존 미식 v2 변경 유지, sameSelection만 공통화
- `ios/TasteBuddy/Domain/UseCases/SensoryAnalysisEngine.swift`
- `ios/TasteBuddy/Features/Gastronomy/TasteDataNativeAdapter.swift`
- `ios/TasteBuddy/Features/Gastronomy/TasteDataCategoryView.swift`
- `ios/TasteBuddy/Features/Gastronomy/TasteDataDiscoveries.swift`
- `ios/TasteBuddyTests/SensoryAnalysisEngineTests.swift` — 회귀 9개 추가
- `ios/TasteBuddyTests/GastronomyNativeTests.swift` — 회귀 4개 추가

새 소스 파일이나 테스트 타깃을 추가하지 않았으며 프로젝트 파일 재생성, 커밋,
푸시, 배포, 사용자 원본 데이터 변경은 수행하지 않는다.

## 검증

로그 경로: `/tmp/tastebuddy-tba-linkage-20260915/`.

- Node 회귀: 55개 통과, 실패 0개 (`node-1.log`).
- 감각 계약: `node scripts/build-tba-sensory-native-contract.mjs --check` 통과.
  `tba-rules/5`, 어휘 845개, 예문 148개. 정제 계약 자체는 변경하지 않았다.
- 네이티브 앱·테스트 번들 빌드 및 선택한 XCTest: **167개 통과, 실패 0개, 종료 코드 0**.
  추가 회귀 13개가 포함된다. 실제 `SensoryAnalysisEngine.analyze` 호출을 통해
  다른 선택의 강도가 메인/윙에 전파되지 않음, 정상 같은 선택 연결 유지,
  회고의 부재 표현과 선택 호감 분리, 독립 식사 반복, 선택형 집계와 발견의 회고 경계를 확인했다.
  `native-1.log`, `native-1.xcresult`; 테스트 완료 시각 2026-09-15 20:15:39 +09:00.
- `git diff --check`: 통과.
- 이번 실행은 선택한 9개 XCTest 클래스의 회귀 검사다. 프로젝트 전체 XCTest나
  UI 자동화, 실제 사용자 자연어 정확도, 대량 기록 성능 검증을 의미하지 않는다.

네이티브 실행 환경은 iOS 26.5, Intel x86_64, Xcode `/Applications/Xcode.app`,
시뮬레이터 `54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4`다.
선택한 XCTest는 감각 분석·구조화 선택·개인 모델·미식 데이터·발견 경로를 검사한다.
실기기 상호작용이나 운영 계정 동기화 검증은 이 수정의 실행 결과로 주장하지 않는다.
