# 식사 선호 질문과 TBA 계약

기준일: 2026-09-07. 계약 `tba-preference-intake/1`, 질문 도구 `1.0.0`.

기존 7문항의 선택을 질문·응답 원문과 함께 저장하고, TBA의 `statedPreferences`에서 자기 보고로 반환한다. 웹, iOS, Android가 같은 질문과 15개 공통 사례를 사용한다. 질문 내용의 기준은 `src/constants/preferenceIntakeCatalog.json`이며 네이티브 앱은 각자 번들에 포함된 JSON으로 독립 실행한다.

| 질문 | TBA 의미 |
| --- | --- |
| 피해야 할 재료 | `self_reported_food_restriction` |
| 식사 원칙 | `dietary_practice` |
| 편안하게 즐기는 요리 | `cuisine_preference` |
| 자주 피하는 요소 | `stated_avoidance` |
| 편안한 풍미 강도 | `preferred_flavor_intensity` |
| 새로운 음식에 대한 선호 | `exploration_preference` |
| 정보 공유에 대한 선호 | `sharing_preference` |

각 저장본은 ID, 소유자, 저장 시점과 알려진 시점, 플랫폼 출처, 질문 ID·문구·설명, 선택 ID·라벨·설명, 응답 여부를 보존한다. 수정하면 새 저장본을 추가하며 가장 최근의 유효한 저장본을 현재 선호로 사용한다. 최신 미응답을 이전 응답으로 채우지 않는다. 동일 ID의 중복은 한 번만 사용하고 내용이 충돌하면 제외한다. 다른 소유자, 지원하지 않는 버전, 변조된 선택, 잘못된 시점과 기준일 이후의 자료도 제외한다.

`declared_none`과 `unanswered`는 다르다. 과거에 빈 배열로 정리된 프로필은 원래 ‘없음’을 골랐다고 추정하지 않으며 다시 저장하기 전까지 TBA 근거로 만들지 않는다. 질문·선택 문구가 바뀌면 도구 버전과 이전 버전 읽기 정책을 함께 갱신해야 한다.

선호 응답은 실식사 관찰, 독립 식사 횟수, 감각 강도, 민감도, 실제 호감 학습값에 합산하지 않는다. 재료 제한은 자기 보고이며 진단이 아니다. 공유 응답은 선호이며 정보 전송 또는 공유 동의를 발생시키지 않는다.

네이티브 첫 진입은 온보딩 → 식사 선호 → 기준 음식 회상으로 연결한다. 기존 미각 프로필이 있는 사용자는 첫 진입 질문을 다시 강제하지 않는다. 세 플랫폼의 나의 입맛 화면에서 응답과 원문을 확인하고 수정할 수 있다. Android의 설정에서도 같은 7단계 화면을 재사용한다.

저장은 기존 로컬 저장 경로를 사용한다. 웹은 사용자 상태의 `latestPreferenceIntakeProfile.submissions`, iOS는 `UserDefaults`의 선호 프로필, Android는 앱 상태의 `preferenceSubmissions`에 보관한다. iOS와 Android의 현재 분석 소유자는 `local-owner`이며 웹은 현재 세션 ID 또는 `local-owner`다. 이 작업은 서버 DB 저장·계정 간 동기화·클라우드 배포를 포함하지 않는다.

검사: `node --test scripts/tba-engine/preference-intake-evidence.test.mjs`, `node scripts/build-preference-intake-contract.mjs --check`, iOS의 `TasteContractGoldenTests`·`AppModelPersistenceTests`·`AppPhaseTests`, Android의 `PreferenceIntakeEvidenceTest`·`PreferenceIntakeJourneyTest`. 공통 사례는 출처·선택 검증, 없음과 미응답, 수정·중복·기준일·소유자 분리를 검사한다. 저장 복원 검사와 식사 분석 불변 검사도 포함한다. 실행 결과와 실제 화면 확인 범위는 작업 보고에 별도로 기록한다.

## 2026-09-07 검증 결과

- 웹 빌드와 TBA JavaScript 검사 87개 통과. 실제 브라우저에서 7문항 저장 → 풍미 선호 수정 → 새로고침 후 조회를 확인했고, 원문 이력 2개가 유지됐다.
- Android 단위 검사 485개, 앱·계측 테스트 APK 빌드, lint 통과. 계측 실행은 에뮬레이터의 `INSTRUMENTATION_ABORTED: System has crashed.`로 중단되어 실제 화면 흐름은 미확인이다.
- iOS 앱·테스트 패키지 빌드 통과. Swift 원본 선호 엔진을 Mac에서 실행하여 공통 15개 사례와 Codable 저장·복원을 확인했다. iOS 시뮬레이터에서 첫 질문 화면도 확인했다. XCTest는 테스트 앱 기동 후 검사 시작 단계에서 멈춰 완료하지 못했으므로 AppModel 통합 검사 통과로 간주하지 않는다.
