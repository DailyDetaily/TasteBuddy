# Taste Buddy Android

현재 iOS 네이티브 앱을 기준으로 만든 Kotlin·Jetpack Compose 앱입니다. 웹뷰를 사용하지 않습니다. Android 8.0(API 26) 이상을 지원하고 API 36을 대상으로 빌드합니다.

## 실행

Android Studio에서 이 `android` 디렉터리를 엽니다. JDK 21과 Android SDK Platform 36, Build Tools 36.0.0이 필요합니다. Gradle 8.13은 포함된 Wrapper가 설치합니다.

```sh
./gradlew :app:assembleDebug
./gradlew :app:installDebug
```

설치용 APK: `app/build/outputs/apk/debug/app-debug.apk`

`local.properties`는 Git에 포함되지 않습니다. `local.properties.example`을 참고해 SDK 경로와 공개 앱 연결 설정을 입력합니다. 이 작업 환경에는 SDK 경로와 기존 iOS의 공개 연결 설정이 반영되어 있습니다. 배포 서명 키는 포함하지 않습니다.

## 포함된 흐름

- Google PKCE·이메일 인증·게스트, 온보딩 4개 화면, 기준 정보와 기준 음식 회상 6문항, 원응답 보기.
- 홈의 개인 기록 요약, 감각 분석·원문 근거·조건별 후보·다음 질문, 현재 기록의 비교 범위.
- 카메라·사진 보관함, 식당 검색·직접 입력, 메뉴 기록, 사진만 먼저 저장, 감각 선택과 호감·강도·적합도·부위·시점, 메모, 편집·삭제·실행 취소·같은 식사에 메뉴 추가.
- 식당·메뉴·셰프·버디 검색, 식당 정보·지도·전화·웹사이트, 북마크와 리스트·커버·공개 여부 설정.
- 프로필·사진·기준 정보·식이 제한·식사 선호, 계정 연결·로그아웃·탈퇴.
- 기록 카드 미리보기·공유·갤러리 저장·Instagram, 구성된 경우 ChatGPT 분석 자료 연결·삭제.

## 데이터와 연결 범위

식사 기록·사진·북마크·댓글·팔로우 선택은 기기에 저장됩니다. iOS 기준 소스에서 아직 제공하지 않는 관계 목록·활동 통계는 Android에서도 실제 데이터처럼 만들어 표시하지 않습니다. 둘러보기 피드는 예시임을 표시합니다. 북마크의 공개 여부는 로컬 속성이며 서버에 공개하는 기능은 아닙니다.

완료된 감각 평가만 분석에 사용합니다. 사진만 저장한 기록은 학습 근거가 되지 않습니다. 같은 식사의 여러 표현은 근거 수를 중복해서 늘리지 않습니다. 해석하지 못한 표현과 알 수 없는 새 버전 선택은 원문을 보존합니다. 이미지 색상 팔레트는 시각 표현용이며 맛이나 호감을 추정하지 않습니다.

세션 토큰은 Android Keystore로 암호화하고, 앱 상태는 원자적으로 저장합니다. 읽기 실패 시 원래 기록을 덮어쓰지 않습니다. 로그아웃은 iOS와 같이 이 기기의 로컬 기록·사진을 초기화하므로 화면에서 확인합니다. 실제 계정 탈퇴는 서버 성공 후 초기화합니다.

Google 로그인 콜백은 기존 `tastebuddy://auth/callback`을 사용합니다. Google·이메일 실제 인증, 실제 계정 탈퇴, 제공자 키 제한, Instagram 앱 연결은 해당 서비스와 기기에서 별도 확인해야 합니다. `TB_CHATGPT_ENTRY_URL`이 비어 있으면 ChatGPT 카드를 표시하지 않습니다.

## 소스 기준과 재검증

이식 기준은 2026-09-07 작업 시작 시점의 iOS 소스이며 파일별 해시는 `ios-source-baseline.json`에 있습니다. 작업 도중 iOS에 추가된 변경은 이 기준에 자동으로 섞지 않습니다. 2026-09-07 기준 음식 회상 설문 v2만 별도로 반영했으며, 해당 범위와 소스 해시는 `onboarding-survey-reference-update.json`에 있습니다. 맛을 느끼는 경향·레이더·전후 비교는 `taste-perception-reference-update.json`에 별도로 기록했습니다.

`Tools/sync-ios-reference.py`는 iOS의 감각 규칙·설문·브랜드 이미지·글꼴을 명시적으로 동기화합니다. `Tools/export-native-content.py`는 네이티브 식당·예시 피드를 JSON으로 내보냅니다. `Tools/export-ios-map-fixture.py`는 실제 Swift 맛 지도 엔진을 실행해 기본 좌표와 선택 시 비교 자료를 만듭니다. 이 내보내기 도구에만 Xcode의 Swift 컴파일러가 필요하며, Android 빌드 자체는 iOS나 Node.js를 필요로 하지 않습니다. 세 도구의 `--source`에는 같은 기준의 iOS 소스 디렉터리를 지정합니다.

```sh
./gradlew :app:testDebugUnitTest
./gradlew :app:connectedDebugAndroidTest
./gradlew :app:lintDebug
```

단위 검사는 실제 iOS 계약 사례 458개와 학습 경계, 인증 요청을 확인합니다. 기기 검사는 게스트 진입·실제 기록 흐름·재실행·동시 저장·손상 파일 보존·암호화·사진과 공유 카드 생성을 확인합니다. 최신 실행 결과와 남은 확인 항목은 `PORTING_STATUS.md`에 기록합니다.
