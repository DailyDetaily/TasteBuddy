# Android 이식 상태

기준: 2026-09-07 작업 시작 시점의 `ios/TasteBuddy`. 파일별 SHA-256은 `ios-source-baseline.json`에 보존합니다. 전체 이식 기준은 유지합니다. 이후 기준 음식 회상 설문 v2만 별도로 반영했으며 소스와 해시는 `onboarding-survey-reference-update.json`에 있습니다.

## 구현 범위

| 영역 | Android 구현 | 주요 파일 |
| --- | --- | --- |
| 진입 | 게스트, Google PKCE, 이메일 인증·연결, 온보딩, 기준 정보·기준 음식 회상 6문항·원응답 결과 | `ui/EntryScreens.kt`, `data/BackendClient.kt` |
| 홈·분석 | 현재 해석, 근거, 조건별 후보, 다음 질문과 응답 연결, 주·보조 입맛, 원문 미해석 보존 | `ui/JournalScreens.kt`, `domain/SensoryAnalyzer.kt`, `domain/PersonalTasteModel.kt` |
| 식사 기록 | CameraX·사진 선택, 식당·메뉴, 먼저 저장, 감각 지도·상세 선택·직접 평가, 메모, 완료·편집·삭제·실행 취소 | `ui/DiningFlow.kt`, `ui/AppViewModel.kt` |
| 기록 보기·공유 | 내 기록·예시 피드, 상세, 같은 식사 추가, 정사각형 카드·갤러리·공유·Instagram | `ui/RecordScreens.kt`, `data/ShareCardStore.kt` |
| 검색·식당 | 식당·메뉴·셰프·사용자 검색, 주변 식당, 장소 상세·지도·전화·웹사이트, 저장 리스트·커버 | `ui/BrowseScreens.kt`, `data/PlacesClient.kt` |
| 프로필·설정 | 사진·이름·닉네임·기준 정보·식이 제한·식사 선호, 재설문, 연결 계정·로그아웃·탈퇴 | `ui/ProfileScreens.kt` |
| 저장·세션 | 원자적 저장, 동시 쓰기 직렬화, 손상 원본 보존, 새 버전 선택 원문 보존, Keystore 암호화 | `data/AppRepository.kt`, `data/SecureSessionStore.kt` |
| 시각 자산 | Pretendard, 기존 온보딩·브랜드 이미지, Lucide 벡터, iOS 맛 지도 좌표와 선택 확대 계산 | `ui/TasteTheme.kt`, `domain/TasteMapLayout.kt`, `shared-assets-manifest.json` |

## 맛을 느끼는 경향 검증 (2026-09-07)

- 비교 기록이 없는 미각변화 카드에 중립 `−` 박스 2개와 12dp 연한 바탕선·2dp 그라데이션 선·원형 노드를 반영했습니다. 표시 전용이며 관찰 데이터를 만들지 않습니다. 단위 검사 483개와 `:app:assembleDebug` 통과, Android 화면 실측은 미확인입니다.

- 미각변화 카드를 전체 `미각 변화` 화면으로 연결했습니다. iOS의 기간·맛·음식/출처 선택, 강도 그래프, 이전/최근 요약과 원본 근거 연결을 반영했습니다. 해당 변경 후 단위 검사 **483개, 실패 0개**, `:app:assembleDebug`, `:app:assembleDebugAndroidTest`를 통과했습니다. `TastePerceptionJourneyTest`도 새 화면 이동·뒤로·원본 연결을 검사하도록 갱신했습니다. 실제 기기 확인은 아래 ANR 환경 제한으로 남아 있습니다.
- 레이더 카드의 기간 이동, 최소 길이의 빈 축, 막대 두께·노드 지름 16, 하단 반응 배지를 iOS 변경에 맞췄습니다. 추가 수정 후 단위 검사 483개와 `:app:assembleDebug`를 다시 통과했습니다. 아래의 에뮬레이터 ANR로 새 카드의 Android 실제 화면은 미확인입니다.
- iOS의 해당 변경만 `taste-perception-reference-update.json`에 명시적으로 반영했습니다. 최초 전체 이식 기준과 다른 작업은 유지했습니다.
- 단위 검사 **483개, 실패 0개**. 식사 중복·조건·기간·직접 강도 분리의 공통 19개 사례와 설문 0·모름·동일 시각 사본의 비교 금지를 포함합니다.
- `:app:assembleDebug`와 `:app:assembleDebugAndroidTest` **통과**.
- `TastePerceptionJourneyTest`에 빈 변화 카드 → 식사 6건 저장·다시 읽기 → 이전 3건/최근 3건 비교 → 원본 기록 이동 검사를 추가했습니다.
- API 35 에뮬레이터를 저장소 읽기 전용·새 부팅으로 실행했고 `sys.boot_completed=1`을 확인했습니다. 검사 시작 후 **“System UI isn't responding”** 화면이 발생했습니다. 진행 표시는 `0/1 completed`였으며 검사를 중단했습니다. **기기 검사 통과로 집계하지 않습니다.** 안정된 Android 기기에서 위 검사 실행이 남아 있습니다.
- 이 변경의 웹 빌드·실제 나의입맛 흐름, iOS 빌드·37개 관련 XCTest·카드 렌더는 별도로 확인했습니다. 운영 서버 쓰기나 출시 배포는 수행하지 않았습니다.

## 기준 음식 회상 설문 v2 검증 (2026-09-07)

- `:app:testDebugUnitTest :app:assembleDebug`: **통과, 481개 검사, 실패 0개**. iOS/웹 공통 계약 458개, 설문 원응답·구형 저장 복원 전용 3개를 포함합니다.
- 설문은 0–4 강도와 세 가지 모름 사유를 별도로 저장합니다. 이전 12문항 ID는 새 답변에 섞지 않고 미응답을 중립값으로 채우지 않습니다. 원문·기준 음식·조건·버전을 저장한 제출 객체를 홈과 분석에서 재사용합니다.
- 새 테스트 에뮬레이터의 기기 검사는 앱 설치 전에 `Cannot access system provider: 'settings' before system providers are installed!`로 중단됐습니다.
- 기존 테스트 이미지를 읽기 전용으로 다시 실행해 부팅 완료와 APK 설치를 확인했습니다. 이후 `com.android.phone`, `com.google.android.apps.nexuslauncher`, `com.google.android.gms` 등의 ANR이 반복되어 기기 검사를 중단했습니다. 새 설문 흐름·저장·재실행 검사는 **실기기에서 추가 확인이 필요하며 통과로 집계하지 않습니다**.
- `SurveyJourneyTest`에 실제 6문항 → 검토 → 결과 → 저장 → 다시 읽기 → 분석 화면 검사를 추가했습니다. 기기 환경이 안정화되면 `StorageContractTest`와 함께 실행할 수 있습니다.
- 운영 서버 쓰기·출시 배포는 수행하지 않았습니다.

## 최초 이식 기준 검증

- JVM 단위 검사: **474개, 실패 0개**. 실제 iOS 계약 454개, 학습 경계 6개, 인증 요청·실패 처리 10개, 다음 질문 판정 3개, 맛 지도 비교 1개(3개 선택 시나리오)를 포함합니다.
- Debug 앱과 Android 기기 검사 APK 생성 완료.
- 기기 설치: Android 15(API 35) x86_64 에뮬레이터에 앱·검사 APK 설치 성공.
- 기기 실행·검사: **미완료**. 시스템 UI의 반복 ANR과 Google 서비스 시간 초과가 함께 발생했습니다. 저장 검사 두 번은 앱 프로세스 시작 시간 초과로 종료됐고, 화면 검사도 안정적으로 진행되지 않아 중단했습니다. 시작 스플래시까지만 캡처했으며 앱 화면의 정상 작동을 확인한 것으로 간주하지 않습니다. 검사 코드 8개는 포함되어 있으나 통과 결과는 없습니다.
- 최종 `:app:assembleDebug :app:lintDebug --offline`: **통과**. 정적 분석 오류 0개. 의존성 최신 버전·KTX 사용 제안 등 경고는 남아 있으며, 검사 오류를 억제하는 설정은 추가하지 않았습니다.

## 확인 경계

전체 화면의 픽셀 일치, 시트·블룸 전환의 iOS와 동일한 모션, TalkBack·큰 글자·다양한 화면 크기 검증은 별도 실기 QA가 필요합니다. Android의 뒤로 가기·권한·공유는 플랫폼 동작을 사용합니다.

실제 Google·이메일 로그인, 계정 삭제, 공급자 키의 Android 사용 제한, GPS·실물 카메라, Instagram 설치 기기 연결은 아직 실서비스에서 검증하지 않았습니다. 인증 요청과 실패 경계는 모의 서버 검사 결과입니다. ChatGPT 연결 URL은 현재 구성값이 비어 있어 카드가 숨겨집니다.

식사·북마크·팔로우 선택·댓글은 iOS 기준의 로컬 저장 범위입니다. 예시 피드는 예시로 표시하고 개인 분석 근거에 포함하지 않습니다. 북마크 공개 설정은 서버 공개 기능으로 표시하지 않습니다. 식당의 개인 일치율은 근거가 연결되지 않은 상태에서 점수로 만들지 않습니다.

## 실행 산출물

- 앱: `app/build/outputs/apk/debug/app-debug.apk`
- 최종 앱 SHA-256: `2423d1696b5b597b297cc5d814513bc69e073b75acf0af7e5cf870e50cf60f09`
- 기기 검사: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`
- 단위 검사 보고서: `app/build/reports/tests/testDebugUnitTest/index.html`
- 정적 분석 보고서: `app/build/reports/lint-results-debug.html`

실행 방법과 연결 설정은 `README.md`를 참고합니다. APK는 개발 서명이며 Play 배포용 서명은 설정하지 않았습니다.
