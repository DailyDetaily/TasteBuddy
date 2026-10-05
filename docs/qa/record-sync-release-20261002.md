# 기록 → 분석 → 동기화 → 복원 점검 — 2026-10-02

현재 checkout의 원문·계정·사진 경로를 점검하고 데이터 유실 및 계정 혼합 결함을 수정했다. **운영 배포 완료나 모든 플랫폼 간 기록 통합 완료를 뜻하지 않는다.** 서버 적용과 실제 인증·기기 왕복을 통과해야 출시할 수 있다.

## 시작 시 구현과 확인되지 않은 범위

| 플랫폼 | 이미 있던 구현 | 확인한 문제 또는 미검증 범위 |
| --- | --- | --- |
| 웹 | 계정별 IndexedDB, Swift 형식 원문, revision 비교 저장, 원문 기반 분석, 충돌 보관 | 사진의 기기 복원과 누락 검사, 연결 복구 후 재전송, 계정 전환 중 늦은 응답, 실제 계정 왕복 |
| iOS | 계정 snapshot·사진 백업, 충돌 선택, 로컬 원문·분석 | 미래 버전 보관본 재인코딩, 늦은 저장 응답, 복원 중 편집, 사진 참조 및 계정별 캐시, 손상 원문의 분석 상태 |
| Android | 단일 기기 파일과 로컬 분석, 인증·사진 UI | 여러 계정이 같은 파일 사용, 로그아웃 시 기록·사진 삭제, 계정 백업·복원 미구현 |
| 서버 | 로컬 migration의 RLS·CAS·사진 보호·피드백 원자적 저장 | 손상 envelope 저장 허용. 연결된 원격 이력에는 계정 백업 관련 migration이 미적용 |

문서의 예전 `pending` 표기를 기능 부재의 단독 근거로 쓰지 않았다. 현재 source와 회귀 검사를 대조했다. 작업 전부터 있던 디자인·브랜드·분석 UI 변경은 보존했다.

## 수정한 내용

### 웹

- 읽을 수 없는 버전·base64·onboarding 값·사진 목록을 거절한다. 네이티브 원문과 Android 확장이 요구하는 사진 참조를 확인한다.
- 누락된 로컬 사진은 계정에서 내려받는다. 여러 사진을 한꺼번에 메모리에 쌓지 않고 계정별 저장소에 한 장씩 보관한다. 최종 IndexedDB 트랜잭션에서 필요한 사진이 아직 존재하는지 확인한 뒤 원문을 적용한다.
- 같은 이름의 다른 사진을 덮어쓰지 않는다. 두 탭이 동시에 같은 이름을 넣어도 원문과 사진 중 일부만 저장되지 않도록 트랜잭션 전체를 취소한다.
- 앱을 다시 열거나 연결이 복구되면 남은 백업을 재시도한다. 탭 사이에 변경을 알리고, 시작 계정과 다른 화면에는 늦은 성공·실패 응답을 적용하지 않는다.
- 이전 웹 피드백 조회를 기대 계정에 고정한다. 계정 변경이나 조회 오류를 빈 기록·예시 데이터로 바꾸지 않는다.
- Android 원문 확장과 사진 참조를 유지하며 웹의 삭제가 이를 제거하지 않는다.
- 기기 원문이 손상돼도 정상 계정 백업을 명시적으로 선택해 복원할 수 있다. 손상된 원문값은 복구본에 그대로 남기고 JSON 파일로 내려받을 수 있다. 지원하지 않는 미래 버전은 이 경로로 덮지 않는다.

주요 구현: [nativeRepository](../../src/lib/gastronomy/nativeRepository.ts), [nativeStorage](../../src/lib/gastronomy/nativeStorage.ts), [nativeTransport](../../src/lib/gastronomy/nativeTransport.ts), [useNativeJournal](../../src/lib/gastronomy/useNativeJournal.ts), [조회 경계](../../src/lib/tasteBuddySupabase.ts).

### iOS

- 지원하지 않는 로컬 보관본과 손상된 원문을 유지하고 쓰기를 중단한다. 손상 상태를 정상적인 빈 분석으로 표시하지 않는다.
- 백업 요청의 토큰을 시작 계정에 고정하고, 완료 응답의 작업·계정 유효성을 확인한 뒤 revision을 갱신한다.
- 사진을 확보하기 전 원격 원문을 적용하지 않는다. 실패한 원격 원문은 재시도용으로 보관하며, 복원 중 생긴 로컬 수정도 덮지 않는다.
- 사진 저장 경로와 썸네일 캐시를 계정별로 분리한다. 사진을 공유하는 원문·복구본이 있으면 다른 기록 삭제로 지우지 않는다.
- 기존 공용 사진은 소유자가 명확한 경우에만 복사한다. 여러 계정이 같은 이름을 참조하면 원본을 보존하고 원격 복원으로 소유권을 확인한다.
- 계정 전환 시 이전 편집 화면과 썸네일 상태를 정리한다. 사진이 뒤늦게 복원되면 썸네일을 다시 읽는다.
- 지원하는 버전의 기기 원문이 손상되면 정상 계정 백업을 선택할 수 있다. 원래 보관 파일의 바이트를 보존한 뒤 사진과 원문을 복원한다. 자동 초기화나 미래 버전 덮어쓰기는 허용하지 않는다.
- 분석 중 각 평가마다 전체 관측을 다시 검색하던 부분을 같은 대상별 Dictionary·Set 조회로 바꿨다. 기존 근거 연결 키·순서·분석 ID 생성 규칙은 유지했다.

주요 구현: [AppModel](../../ios/TasteBuddy/App/AppModel.swift), [계정 저장소](../../ios/TasteBuddy/Data/Backend/NativeAccountDataRepository.swift), [사진 저장소](../../ios/TasteBuddy/Data/Backend/NativeAccountPhotoRepository.swift). 아래 실행 결과와 함께 판단한다.

### Android

- 계정별 원자적 파일로 분리하고 로그아웃 후에도 원문·사진을 보존한다. 소유자를 증명할 수 없는 기존 파일은 게스트 보관함에 남긴다.
- 전체 Android 원문을 `values["tastebuddy.android.archive.v1"]`에 보관한다. iOS·웹의 원문 키는 그대로 유지한다.
- 사진 업로드 후 revision을 비교해 저장하고, 사진 확보 후 원문을 복원한다. 충돌 선택을 적용하기 전에 교체되는 원문과 사진을 복구용으로 보존한다.
- 마지막 기록 삭제, 저장 성공 후 응답 유실, 업로드 도중 편집, 늦은 토큰 갱신·로그아웃 경계를 처리한다. 자동 백업 중에도 로컬 편집을 저장할 수 있다.
- 삭제·로그아웃 요청 뒤 다른 계정 또는 같은 계정으로 새로 로그인하면 이전 요청이 새 세션을 지우지 않는다. 로컬 초기화도 요청을 시작한 계정과 현재 계정이 같은지 확인한다.
- 감각 선택의 알 수 없는 추가 필드를 원문으로 유지한다. 새 계정에 예시 인물의 프로필을 표시하지 않는다.
- 읽을 수 없는 기기 파일은 명시적 계정 백업 복원으로만 교체할 수 있다. 파일이 도중에 바뀌었거나 계정이 다르거나 더 새로운 버전이면 거절하고, 교체 전 원래 바이트를 별도 파일에 보관한다.

상세 계약과 경계: [Android 계정 백업](../../android/ACCOUNT_BACKUP.md).

### 서버

- 새 forward migration이 Swift가 읽을 수 있는 envelope를 검사한다. 기존 손상 row는 지우거나 빈 값으로 바꾸지 않는다.
- 구형 클라이언트가 Android 확장을 없애거나 그 사진 참조를 누락하면 저장을 거절한다. 기존 payload·revision·사진 삭제 보호는 유지한다.
- RLS·원자적 피드백·사진 검사에 최신 migration을 적용하도록 회귀 검사를 갱신했다.

[서버 변경](../../supabase/migrations/20261002010000_native_account_envelope_validation.sql) · [선별 배포 명세](../operations/record-sync-release-20261002.md).

## 검증 증거

로그 루트는 [release-integrity-20261002](../../output/qa/release-integrity-20261002/)이며 [플랫폼별 결과 요약](../../output/qa/release-integrity-20261002/verification-summary.json)을 함께 보존했다. 웹 빌드 335개 파일을 이 폴더에 보존했고 [빌드 파일 SHA-256](../../output/qa/release-integrity-20261002/web-delivery-manifest.json), [웹·서버 소스 SHA-256](../../output/qa/release-integrity-20261002/web-server-source-manifest.json)을 남겼다. 다른 대화에서도 수정하는 checkout이므로 아래 결과는 이 검증 당시 파일과 빌드를 기준으로 한다.

| 범위 | 결과 | 실행의 경계 |
| --- | --- | --- |
| 웹 기존 회귀 baseline | 187/187 통과 | 수정 전 현재 checkout의 Node 검사 |
| 웹 회귀 | 221/221 통과 | 원문·저장·분석 계약, 모의 네트워크. 최종 실행은 test concurrency 2로 제한 |
| 서버·프로젝트 검사 | 39/39 통과 및 별도 SQL·렌더·점수 assertion 통과 | PGlite의 PostgreSQL, Auth·Storage·HTTP 대체 |
| 웹 TypeScript | 최종 검사 통과 | Plating 캡처의 선택적 frame 키 타입도 실제 sparse 데이터에 맞춰 한 줄 수정 |
| 웹 배포용 빌드 | Vite/PWA 빌드 통과 | 새 출력 디렉터리 사용. [출력 위치](../../output/qa/release-integrity-20261002/web-delivery-path.txt), [로그](../../output/qa/release-integrity-20261002/web-build-delivery.log). 기존 큰 번들·Browserslist 경고가 남음 |
| 웹 브라우저 | 기록 입력·전체 평가·오프라인 저장·분석·재접속·계정 전환·재로딩 확인 | 실제 React 컴포넌트·Web Worker·IndexedDB, 합성 입력과 모의 서버. 전체 앱 온보딩·실제 로그인 결과가 아님 |
| Android | 최종 533/533 단위 검사 및 debug APK 빌드 통과 | JVM/Robolectric·모의 서버. 실패·오류·건너뜀 0개. 연결된 기기 없음 |
| iOS | 시뮬레이터 XCTest 97/97 통과 | 정상 에셋 포함 앱·테스트 번들 빌드 후 실제 XCTest 실행. iOS 26.5·x86_64, 모의/격리 저장소. 전체 UI 여정·실기기·실제 서버 왕복은 미포함 |

웹 UI 근거: [오프라인 저장](../../output/qa/release-integrity-20261002/web-offline-record.png), [계정 전환 후 원문](../../output/qa/release-integrity-20261002/web-restored-record.png), [여정 로그](../../output/qa/release-integrity-20261002/browser-journey.log). 테스트 화면에는 격리 QA와 모의 서버임을 표시했다. 외부 요청은 차단했고 폰트 CDN 차단 로그는 제품 실행 예외와 구분한다.

IndexedDB 실검사: [계정 전환·사진 충돌·트랜잭션 취소](../../output/qa/release-integrity-20261002/browser-storage-final.log), [필요 사진 누락 시 원문 적용 중단](../../output/qa/release-integrity-20261002/browser-photo-publication.log). [손상 원문 복원 화면](../../output/qa/release-integrity-20261002/web-explicit-recovery.png)에서는 분석을 중단하고 명시적 복원을 진행했으며, 내려받은 JSON의 손상 원문값이 변경되지 않았음을 확인했다. [복원 여정 로그](../../output/qa/release-integrity-20261002/browser-recovery.log).

Android 근거: [최종 단위 검사](../../output/qa/release-integrity-20261002/android/final-unit.log), [최종 빌드](../../output/qa/release-integrity-20261002/android/final-assemble.log), [보존 APK](../../output/qa/release-integrity-20261002/android/tastebuddy-android-debug-20261002.apk), [설정·서명·SHA-256](../../output/qa/release-integrity-20261002/android/verification.json). 기존 Supabase HTTPS·공개 key 설정을 포함한 debug 인증서 서명 APK이며 실제 서비스 연결 검사는 하지 않았다. 기존 에뮬레이터와 사용자 자료를 초기화하지 않았다.

iOS 근거: [최종 XCTest 로그](../../output/qa/release-integrity-20261002/ios/final-xcode-test.log), [결과 번들](../../output/qa/release-integrity-20261002/ios/final.xcresult), [결과 요약](../../output/qa/release-integrity-20261002/ios/xcresult-summary.json), [검증 소스 SHA-256](../../output/qa/release-integrity-20261002/ios/final-source.sha256). 영속 저장 17개, 식사 원문·분석 16개, 계정 수명주기 5개, 계정 저장소 21개, 사진 저장소 15개, 질문 범위 1개, 분석 엔진 22개를 실행했다. 기존 저장 검사의 기대값은 새 수정 이력을 명시적으로 검증하도록 보정했으며 원문 필드의 동일성 검사는 유지했다. 호스트 실행 중 `AttributeGraph` cycle 경고 1건과 AppIntents metadata 추출 생략 경고가 있었다. 테스트는 통과했지만 관련 UI 동작 전체를 검증한 결과는 아니다.

테스트 완료 후 다른 대화가 `SensoryAnalysisCards.swift`를 다시 수정했다. 97개 통과 결과는 보존한 테스트 당시 소스에 대한 결과이며, 이후 UI 수정까지 검증했다고 확대하지 않는다. [검증 시점과 후속 변경](../../output/qa/release-integrity-20261002/ios/verification.json)에 이를 기록했다.

### iOS 대용량 분석 관찰

Intel Mac의 iOS 26.5 시뮬레이터, `-O` 빌드에서 합성 기록으로 `SensoryAnalysisEngine.analyze` 전체 호출을 측정했다. 서로 다른 식사 ID에 같은 짧은 두 문장 메모가 있고 감각 선택·사진이 없는 완료 기록이다. 교정 후 재분석 값에는 결과 assertion 두 개도 포함한다.

| 합성 기록 수 | 최적화 전 전체 분석 / 교정 후 재분석 | 최적화 후 전체 분석 / 교정 후 재분석 |
| --- | --- | --- |
| 50 | 0.782초 / 1.123초 | 0.525초 / 0.488초 |
| 500 | 54.784초 / 48.091초 | 5.069초 / 4.844초 |
| 2,000 | 실행 중단, 완료 수치 없음 | 20.943초 / 19.500초 |

최종 97개 검사에는 이 성능 검사도 포함했다. 전체 반복 검색을 줄인 뒤 같은 합성 500건의 관찰 시간은 약 10배 짧아졌다. 실행별 시스템 부하가 달랐고 단회 wall time이므로 실기기 평균이나 보편적 속도 향상률로 해석하지 않는다. 앱은 같은 엔진을 백그라운드에서 호출한다. 실제 사용 기록과 대표 기기에서의 분석 갱신 지연은 추가 확인이 필요하다.

## 남은 출시 조건

1. **서버 적용:** [배포 명세](../operations/record-sync-release-20261002.md)의 SQL 5개와 `delete-account` 갱신을 staging에서 확인하고 대상 환경에 적용한다. 다운로드한 현재 함수 소스에는 native 사진 삭제가 없는 것을 확인했다. [배포 소스 비교](../../output/qa/release-integrity-20261002/deployed-delete-account-source.json). 관련 없는 ChatGPT/OAuth migration 2개는 포함하지 않는다. 연결된 프로젝트의 production 환경 지정 자체까지 확인한 결과는 아니다.
2. **실제 계정 왕복:** 전용 계정 A/B로 웹↔iOS, Android↔Android의 로그인·사진·수정·삭제·충돌·새 기기 복원을 검사한다. 실제 Auth·Storage·RLS와 세션 만료를 통과해야 한다. 사용자의 운영 원문을 시험 자료로 사용하지 않는다.
3. **플랫폼 간 범위:** Android 원문은 Android 사이에서 복원된다. Android와 iOS·웹 사이의 식사 기록 변환 및 공통 분석은 아직 제공하지 않는다. 이를 지원하는 제품으로 출시하려면 별도 호환 구현과 왕복 검증이 필요하다.
4. **기기 UI:** 실제 카메라·GPS·백그라운드 종료·저장 공간 부족·VoiceOver/TalkBack·큰 글자를 기기에서 확인한다. Android에는 현재 연결된 기기가 없으며 기존 여정 테스트는 앱 저장소를 초기화하므로 사용자 자료가 있는 기기에서 그대로 실행하지 않는다.
5. **복구 경계:** Android의 충돌 복구본은 내부 파일이고 복구본 목록 UI가 없다. 같은 이름의 다른 사진이 공용 기기 디렉터리에 있으면 복원을 거절한다. iOS에서 소유자가 불명확한 기존 공용 사진은 자동 귀속하지 않는다. 이 경계에 맞는 지원·복구 절차가 필요하다.
6. **출시 artifact:** 웹은 검증한 전체 빌드 출력으로 배포한다. Android debug APK와 서명하지 않은 iOS 시뮬레이터 테스트는 스토어 제출용 서명·릴리스 설정 검증을 대신하지 않는다.
7. **대용량 분석 성능:** 대표 실기기에서 50·500·2,000건의 분석 갱신 시간을 다시 측정하고 허용 지연 기준을 정한다. 반복 검색은 개선했으나 출시에서 지원하는 기록 규모의 응답 시간은 실제 기기에서 검증해야 한다.

운영 DB/Storage/함수를 변경하거나 계정을 생성·삭제하지 않았고, 스토어 배포도 수행하지 않았다.
