# 계정 기록 보존·피드백 일괄 저장·강도 부정 수정

이번 변경은 소스와 로컬 검증을 위한 것이다. 운영 DB·Storage·Edge Function에 자동 적용되지 않는다.

## 변경 범위

- iOS는 로그아웃 때 계정 기록을 보관하고, 다른 계정의 기록과 분리한다. 계정 원본은 `native_account_data`의 버전 비교 저장으로 백업하며 같은 계정에서 복구한다. 서버 연결 실패나 충돌 때 로컬 원본을 덮어쓰지 않는다.
- 사진은 공개 URL 없이 `native-dining-photos` 비공개 버킷에 원본을 보관한다. 사진 백업 후 기록을 저장하며, 현재 계정 백업에서 사용하는 사진은 정리 작업으로 삭제할 수 없다. 계정 탈퇴는 이 버킷의 사진 정리까지 성공한 뒤 완료한다.
- 서로 다른 기기의 변경이 충돌하면 설정에서 사용할 기록을 선택한다. 선택 전 두 원본과 사진을 이 기기에 보관한다. 읽을 수 없는 버전이나 손상된 기록을 빈 목록으로 바꿔 저장하지 않는다.
- 웹은 `save_dining_feedback_atomic` RPC에서 메뉴 원문·피드백·파싱·근거·완료 표시·학습값을 함께 저장한다. 등록·수정·선택 취소에 적용하며, 실패 시 개별 저장으로 우회하지 않는다. confidence 요약 캐시는 저장 후 갱신하고 다음 읽기에서 재생성할 수 있다.
- JS·iOS·Android의 “강하지 않다”는 원문과 미해석 상태로 남긴다. 감각이 없거나 약하다고 추정하지 않는다. 신규 규칙은 `tba-rules/5`이고 저장된 v4 artifact는 당시 버전으로 검증한다.

iOS 계정 백업은 네이티브 원본의 복구용이다. 기존 웹 피드백을 네이티브 기록으로 자동 변환하거나 서로 다른 플랫폼의 기록을 병합하지 않는다. 과거 로그아웃으로 이미 삭제됐거나 부분 저장에서 누락된 원문을 새로 만들어 복구하지 않는다.

## 적용 순서

1. [이전 데이터 안전성 변경](./premerge-data-safety-release.md)의 필수 마이그레이션과 미디어 설정이 적용됐는지 확인한다.
2. 다음 새 마이그레이션을 순서대로 적용한다.
   - `20260908105000_native_account_data.sql`
   - `20260908110000_atomic_feedback.sql`
   - `20260908120000_native_dining_photos.sql`
3. `supabase/functions/delete-account`를 배포해 비공개 원본 사진 정리까지 연결한다.
4. 웹 번들과 iOS·Android 앱을 배포한다. 새 웹은 RPC가 준비되지 않으면 원격 저장을 실패로 처리하므로 서버를 먼저 적용한다.

관계없는 대기 마이그레이션이나 ChatGPT OAuth hook 설정을 이 작업에 함께 활성화하지 않는다. 새 버킷에는 공개 접근을 허용하지 않는다.

## 검증

```sh
npm test
npm run build
node --test scripts/chatgpt-connection.test.mjs
node --test scripts/tba-platform-pilot/rules.test.mjs scripts/tba-platform-pilot/sensory-storage.test.mjs
node scripts/build-tba-sensory-native-contract.mjs --check
```

iOS는 `TasteBuddy` 전체 단위 검사를 실행한다. 네트워크가 없는 로컬 검증에는 `TB_SUPABASE_URL=__PREMERGE_NO_BACKEND__`, `TB_SUPABASE_PUBLISHABLE_KEY=__PREMERGE_NO_BACKEND__`를 빌드 인자로 지정한다. Android는 `:app:testDebugUnitTest :app:assembleDebug`를 실행한다.

DB 검사는 PGlite에서 실제 앱 마이그레이션과 RLS를 실행하며 Supabase의 Auth·Storage 플랫폼 표면만 대체한다. 사진 HTTP 검사는 모킹한다. 이 결과는 실제 서비스의 업로드·새 기기 복구·탈퇴 성공을 대신하지 않는다. 배포 후 별도 테스트 계정으로 로그아웃/재로그인, 계정 교체, 새 기기 복구, 동시 수정, 사진 삭제, 탈퇴를 확인한다.
