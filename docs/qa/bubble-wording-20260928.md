# 미각 버블 자연어 문구 개정 검증 — 2026-09-28

## 적용 결과

- 설계 원본: `docs/product/tastebuddy-sensory-redesign-v2.json`
- 설계 버전: `tastebuddy-sensory-redesign-v2-candidate-4`
- 신규 버블 정의 버전: `redesign-bubble-wording-4`
- 런타임 저장 계약 버전: `dining-sensory-selection/2` 유지
- 버블 160개 중 146개 라벨 수정, 160개 모두 사용자용 설명 작성. 6개 축과 고정 앵커 유지.
- 디테일 147개, 기존 5개 관점형 가족 및 음식별 카테고리·조건부 후보 규칙은 변경하지 않음.
- 이전 버블 정의 160개를 원본 그대로 `bubble_definition_archive`에 보관. 현재 표시 목록에는 추가하지 않음.
- 기존 ID·감각 속성·비유 대상·시점·강도 정보·기본 순번·프로필 참조와 배치 정책을 보존.

## 실제 변경

1. 모든 문구에 축 이름을 붙이는 형식을 없애고 짧은 인상 표현과 필요한 미각 명칭을 함께 사용.
2. `label`(버블), `description`(사용자용 설명), `definition`(해석 경계)을 구분. 생성기가 설명을 빈 문자열로 만들던 부분 수정.
3. iOS와 웹의 해석은 선택 당시 ID·카탈로그 버전·정의 버전으로 수행. 모르는 버전과 라벨 불일치는 미확정 처리.
4. 저장 기록 편집 시 과거 라벨을 지도에 복원하며 새 라벨로 덮어쓰지 않음. 이전 명칭을 검색 별칭으로 제공.
5. 공용 JSON을 웹·iOS·Android 자원에 동일하게 생성. Android는 자원 일치만 확인했고 앱 실행·과거 정의 파서는 검증하지 않음.
6. PWA 캐시 제한을 높이지 않고 `vite.config.ts`에서 감각 사전을 `sensory-catalog` 청크로 분리.
7. 기존 845개 설계·어휘 문서 상단에 현재 적용 문서 링크를 추가. 과거 후보 내용은 보존.

## 통과한 검증

| 검증 | 실제 결과 |
|---|---|
| Node 회귀 테스트 | `node --test scripts/test-web-sensory-v2.mjs scripts/test-web-bubble-wording-v4.mjs` — 19개 통과, 실패 0 |
| 과거 기록 | 이전 버블 160개 전체 해석·원문 라벨·정의 버전 유지, 과거 부모 버블에 연결된 수식 태그, 새/옛 표현 공존 검증 |
| 배치 | 모든 음식 프로필에서 160개·6축 앵커·최대 24개 위치 변경 유지. 슬롯 유한 좌표·여백·기본 원형 겹침 없음 |
| 원본 비교 | 수정 전 백업과 160개 과거 정의 전체 일치. 축·순번·147개 디테일·프로필·배치·선택 정책 불변 |
| 생성물 | `build-sensory-v2.mjs --check` 및 `build-sensory-v2-fixtures.mjs --check` 통과. 파서 검토 사례 478개, 음식 문맥 사례 42개 생성 및 동기화 |
| TypeScript | `tsc --noEmit --incremental --tsBuildInfoFile output/qa/bubble-wording-20260928/typecheck.tsbuildinfo` — 종료 코드 0 |
| Swift 구문 | 수정한 카탈로그·파서·DiningView·SensoryV2Tests의 `swiftc -frontend -parse` — 종료 코드 0 |
| 웹 프로덕션 | 별도 QA 출력 폴더로 Vite 빌드 종료 코드 0. PWA service worker 생성 완료 |
| 패치 공백 검사 | 수정 코드 경로의 `git diff --check` 오류 없음 |

파서 사례 478개는 웹 결과로 생성한 iOS 대조용 자료이다. 이 숫자를 iOS 테스트 통과 건수로 해석하지 않는다.

## 빌드 과정 및 제한

첫 TypeScript 검사는 실행 제한 시간으로 종료됐고, 증분 검사를 다시 실행하여 통과했다.

첫 웹 빌드는 메인 JS 약 3.19 MB가 기존 설정의 3 MiB 캐시 한도를 넘어 PWA 생성에서 실패했다. 감각 사전 청크 분리 후 메인 JS 약 2.71 MB, 감각 사전 약 475 kB로 분리되어 PWA 생성까지 성공했다. 500 kB 초과 청크 및 일부 정적/동적 import 중복 경고는 남아 있다.

`xcodebuild test -only-testing:TasteBuddyTests/SensoryV2Tests`를 iOS 26.5의 기존 전용 QA 시뮬레이터에서 시도했으나, 의존성 빌드 중 300초 제한 시간으로 종료됐다. 따라서 **iOS 전체 빌드와 네이티브 단위 테스트는 통과했다고 보고하지 않는다.** Swift 구문 검사 통과는 전체 타입 검사나 앱 실행 검증을 대신하지 않는다.

실제 기기·시뮬레이터 화면, 라벨 줄바꿈·가독성, 사용자 어휘 이해도, Android 앱 실행은 이번 작업에서 확인하지 않았다. 어휘는 편집 후보이며 의미 구별에 대한 사용자 검증은 별도로 필요하다.

Git 커밋과 운영 배포는 하지 않았다. 웹 빌드는 기존 `dist` 대신 QA 폴더에 생성했다.

## 파일과 로그

- 전체 어휘와 설명: `docs/product/tastebuddy-bubble-wording-v4.md`
- 통합 설계: `docs/product/tastebuddy-sensory-redesign-v2.md`
- 원본 백업: `output/qa/bubble-wording-20260928/backup/`
- 변경 수·보존 검증: `output/qa/bubble-wording-20260928/verification.json`
- Node 결과: `output/qa/bubble-wording-20260928/tests.log`
- TypeScript 결과: `output/qa/bubble-wording-20260928/typecheck.log`
- 웹 빌드 결과: `output/qa/bubble-wording-20260928/web-build.log`
- iOS 미완료 빌드 로그: `output/qa/bubble-wording-20260928/ios-test.log`
