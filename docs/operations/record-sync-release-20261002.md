# 기록 백업·복원 배포 명세 — 2026-10-02

## 2026-10-12 적용 완료

현재 앱 연결 서버에 선별 SQL 5개와 `delete-account` version 5를 사용자 승인 후 적용했다. ChatGPT OAuth/export migration과 seed는 포함하지 않았다. iPhone 16 Pro에서 기존 기록·사진의 백업 완료와 원본 바이트 일치를 확인했다. [적용 결과와 검증 범위](../../output/ios-analysis-backup-20261012/verification.md). 이하 명세의 미배포 표현은 2026-10-02~03 당시의 기록이다.

이 문서는 식사 원문과 사진의 계정 백업, 기기 복원, 충돌 보존을 위한 **배포 후보와 실행 순서**다. 이번 작업에서는 운영 migration, 함수 배포, 계정 생성·삭제, 사용자 데이터 쓰기를 실행하지 않았다. 운영 배포는 이 명세와 검증 결과를 검토한 뒤 별도로 결정한다.

## 1. 확인한 상태

| 구분 | 확인한 내용 | 증거와 한계 |
| --- | --- | --- |
| 연결된 원격 DB의 적용 이력 | `20260903091000_feedback_learning_idempotency.sql`까지 local/remote 버전이 대응한다. 이후 7개 local migration에는 remote 버전이 없다. | [읽기 전용 migration 목록](../../output/qa/release-integrity-20261002/remote-migrations.log). 적용 이력 확인이며 실제 DB 정의와 모든 정책의 일치까지 증명하지 않는다. |
| 원격 Edge Function 목록 | 아래 5개 함수가 `ACTIVE`로 표시됐다. | [읽기 전용 함수 metadata](../../output/qa/release-integrity-20261002/remote-functions.json). 상태·버전·수정 시각으로 배포된 함수 소스가 현재 checkout과 같다고 판단하지 않는다. |
| 원격 `delete-account` 소스 | 별도 `/tmp` 디렉터리에 API 방식으로 내려받은 artifact에는 native 사진 삭제 모듈·호출이 없다. 기존 upload lease 대기와 R2/cache 정리 경로는 현재 소스와 대응한다. | [소스 비교와 SHA-256](../../output/qa/release-integrity-20261002/deployed-delete-account-source.json). 함수 호출, 계정 삭제, Storage 접근 결과를 검증한 것은 아니다. |
| 로컬 SQL 의존성 | 기존 적용 baseline 뒤에 아래의 선별 5개 migration만 적용하는 조합이 로컬 PGlite에서 생성됐다. `native_account_data`, atomic feedback RPC, envelope 검사 함수가 있고 ChatGPT export 테이블은 없음을 확인했다. | Supabase Auth·Storage의 플랫폼 표면을 대체한 로컬 PostgreSQL 결과다. 실제 Supabase Storage API나 운영 적용 결과는 아니다. |
| 로컬 클라이언트 소스 | 웹·iOS는 공통 snapshot을 읽고 쓴다. Android는 `tastebuddy.android.archive.v1`에 Android 원문을 보관하고 공통 snapshot의 다른 키를 유지한다. | Android extension의 백업·복원 계약이며 iOS/Web 식사 원문과 Android 식사 원문의 변환·분석 일치를 뜻하지 않는다. |

관찰한 원격 함수 metadata:

| 함수 | 상태 | 원격 version |
| --- | --- | --- |
| `kakao-place-lookup` | ACTIVE | 5 |
| `google-place-enrich` | ACTIVE | 7 |
| `upload-profile-avatar` | ACTIVE | 6 |
| `upload-feedback-reflection-photo` | ACTIVE | 4 |
| `delete-account` | ACTIVE | 4 |

연결된 프로젝트가 실제 배포 대상으로 지정된 production인지 staging인지는 배포 시 프로젝트 식별자와 환경 설정으로 다시 확인한다. 위 조회에서 사용자 row나 사진을 읽지 않았다.

## 2. 이번 범위의 SQL 5개

이미 원격 적용 이력에 있는 `20260903090000_premerge_data_safety.sql`과 `20260903091000_feedback_learning_idempotency.sql`이 baseline이다. 전자는 `account_deletion_requests`, 미디어 upload lease와 계정 삭제 조정 함수를 제공한다. 후자는 피드백 변경의 학습 lock과 재계산 trigger를 제공한다.

아래 순서로 적용한다. 기존 migration 파일의 내용과 버전은 바꾸지 않는다.

| 순서 | 파일 | 새로 제공하는 계약 | 주요 선행 조건 |
| --- | --- | --- | --- |
| 1 | [`20260908105000_native_account_data.sql`](../../supabase/migrations/20260908105000_native_account_data.sql) | `native_account_data`, 자기 계정 read RLS, `save_native_account_data(uuid,jsonb,bigint)`, revision 비교 후 저장, 삭제 중 저장 차단, 사진 object 존재 확인 | `auth.users`, `profiles`, `account_deletion_requests`, `storage.objects` |
| 2 | [`20260908110000_atomic_feedback.sql`](../../supabase/migrations/20260908110000_atomic_feedback.sql) | `save_dining_feedback_atomic(uuid,uuid,timestamptz,jsonb,jsonb,boolean,boolean)`: 식사·피드백·해석·근거·완료 상태의 단일 트랜잭션, 수정 충돌과 재전송 보호 | 기존 reservation/feedback/evidence tables, `client_submission_completed_at`, 학습 trigger |
| 3 | [`20260908120000_native_dining_photos.sql`](../../supabase/migrations/20260908120000_native_dining_photos.sql) | 비공개 `native-dining-photos` bucket, 계정 prefix RLS, upload lease, 현재 snapshot이 참조하는 사진의 삭제 차단 | 1번, 기존 `account_media_uploads`, Supabase Storage schema |
| 4 | [`20260913011000_native_food_memory_v2.sql`](../../supabase/migrations/20260913011000_native_food_memory_v2.sql) | snapshot v1/v2 읽기, v2 저장, 기존 v2를 v1으로 덮는 downgrade 차단 | 1번의 table/check constraint |
| 5 | [`20261002010000_native_account_envelope_validation.sql`](../../supabase/migrations/20261002010000_native_account_envelope_validation.sql) | 숫자 schema version, onboarding boolean, Swift가 읽을 수 있는 base64 value 검사. Android extension의 envelope·사진 manifest를 검사하고 기존 extension key를 제거하는 update 차단 | 1번·4번. 새 check는 `NOT VALID`로 추가해 과거 손상 row를 보존하고 이후 insert/update부터 검사. 미지원 데이터의 내용은 해석하거나 병합하지 않음 |

### 범위 밖 migration

- `20260906120000_chatgpt_analysis_connection.sql`: ChatGPT OAuth role·hook·export table·configuration.
- `20260913010000_food_memory_export_v2.sql`: 위 ChatGPT export table의 v2 payload 허용.

두 migration은 이번 기록 백업에 필요하지 않다. OAuth client, Auth hook, MCP reader, export table의 별도 배포를 이번 작업에 포함하지 않는다. 적용하지 않은 버전을 `migration repair`로 적용 완료 처리하지 않는다.

현재 checkout에서 전체 `db push`를 실행하면 이 두 migration도 후보에 포함된다. 배포 준비 시 **이미 적용된 baseline 파일 전부와 이번 5개 파일만** 별도 release 디렉터리에 복사하고, 원본과 파일 hash가 같은지 확인한다. 그 디렉터리에서 검토한 대상 환경에 연결한 뒤 아래 dry-run 목록이 정확히 이번 5개인지 확인한다. seed와 custom role을 추가하는 옵션은 쓰지 않는다.

검토용 [원문 파일 묶음과 포함·제외 목록](../../output/qa/release-integrity-20261002/server-release-candidate/README.md), [SHA-256 manifest](../../output/qa/release-integrity-20261002/server-release-candidate/manifest.json)를 보존했다. 이 묶음에는 환경 설정·secret·프로젝트 연결 정보가 없으며 환경 연결이나 배포는 수행하지 않았다.

```sh
supabase db push --linked --dry-run
```

초기 작성 시 CLI help·원격 metadata·배포 함수 소스의 읽기 전용 확인과 로컬 SQL 검사를 수행했다. 2026-10-03에는 별도 실행 디렉터리에서 위 원격 dry-run을 수행했고 정확히 선별 5개만 표시됐다. 실제 push는 실행하지 않았다. 배포 도구가 baseline 이력 차이를 보고하면 원인을 확인하며, 이력을 임의로 맞추거나 파일을 제거해 통과시키지 않는다.

### 2026-10-03 실행 전 확인

- 웹 `.env.local`, iOS `Secrets.local.xcconfig`, Android `local.properties`의 Supabase host와 CLI 연결 프로젝트가 모두 `hmexwxpkbrykxxdhhkai`로 일치했다. 프로젝트 이름은 `DailyDetaily's Project`, 상태는 `ACTIVE_HEALTHY`다. 실제 설정 값·key는 보고서에 복사하지 않았다.
- Supabase 프로젝트 목록과 해당 프로젝트의 preview branch 목록에서 별도 Taste Buddy staging 환경은 확인되지 않았다. 현재 앱이 연결하는 서버를 실제 반영 대상으로 사용할지 확인하는 단계다.
- 실제 DB의 read-only transaction에서 baseline 22개 이력, 선행 upload lease 함수와 피드백 완료 열을 확인했다. native table·bucket·RPC는 아직 없으며 기존 Storage object policy도 없었다. 사용자 row나 사진은 조회하지 않았다.
- 검토용 원문 33개와 실행 디렉터리·현재 소스의 SHA-256이 일치했다. [dry-run](../../output/qa/release-server-20261002/dry-run.log)은 위 SQL 5개만 포함하고 seed·role 변경은 비어 있었다.
- 배포된 `upload-profile-avatar`와 `upload-feedback-reflection-photo` 소스를 API로 내려받아 실제 `withAccountMediaUpload` 호출과 시작·종료 RPC를 확인했다. 현재 확인한 함수에는 upload lease가 있으므로 이번 배포에 두 업로드 함수의 재배포를 추가할 필요가 없다. [소스 검사](../../output/qa/release-server-20261002/deployed-upload-lease-check.json).
- 이 단계에서는 대상 DB의 스키마·데이터·함수 artifact를 변경하지 않았다. [사전 확인 요약](../../output/qa/release-server-20261002/preflight-summary.json), [실제 스키마 조회](../../output/qa/release-server-20261002/preflight-before.json), [적용안](record-sync-server-preflight-20261003.md)을 보존했다.

## 3. 함수와 사진 저장소

### 필요한 함수 artifact

공통 snapshot은 PostgREST/RPC, 새 사진은 Supabase Storage를 사용하므로 새 업로드 Edge Function은 필요하지 않다. 기존 `delete-account`는 새 비공개 사진을 지운 뒤 Auth 계정을 삭제하는 구현이어야 한다.

검토할 소스 묶음:

- [`delete-account/index.ts`](../../supabase/functions/delete-account/index.ts)
- [`delete-account/cleanup.ts`](../../supabase/functions/delete-account/cleanup.ts)
- [`delete-account/native-photos.ts`](../../supabase/functions/delete-account/native-photos.ts)
- [`_shared/direct-app-session.ts`](../../supabase/functions/_shared/direct-app-session.ts)
- [`_shared/r2-delete.ts`](../../supabase/functions/_shared/r2-delete.ts)
- [`_shared/cloudflare-cache.ts`](../../supabase/functions/_shared/cloudflare-cache.ts)

현재 소스는 삭제 요청을 먼저 기록하고 진행 중 upload lease가 있으면 재시도를 요청한다. R2 avatar·reflection prefix, `native-dining-photos`의 해당 계정 prefix, 공개 미디어 cache 정리를 마친 뒤 Auth 계정을 삭제한다. 일부 삭제가 실패하면 Auth와 삭제 요청을 유지한다. native 사진은 첫 100개를 지우고 다시 첫 페이지를 조회하므로 페이지 이동 때문에 남은 사진을 건너뛰지 않는다.

2026-10-02에 설치된 CLI의 `functions download delete-account --use-api`로 실제 배포 소스를 별도 `/tmp` 작업 디렉터리에 내려받았다. 저장소의 함수 파일은 변경하지 않았고 Docker 설치·함수 호출·배포도 하지 않았다. 확인한 결과는 다음과 같다.

- `native-dining-photos` 참조, `deleteNativePhotos` 호출, `native-photos.ts` 모듈이 모두 없다.
- 배포된 `cleanup.ts`는 현재 소스에서 native 사진 삭제 단계만 뺀 것과 정확히 일치한다. `prepare`에서 진행 중 upload 수를 확인하고 있으면 중단하며, R2 삭제와 cache purge를 마친 뒤 Auth 삭제를 호출한다.
- `index.ts`의 `prepare`, `deleteMediaPrefix`, `purgeMediaCache`, `deleteAuthUser` callback도 현재 소스와 대응한다. `prepare_account_deletion` RPC를 사용한다.
- `_shared/r2-delete.ts`와 `_shared/cloudflare-cache.ts`의 SHA-256은 현재 소스와 같다. 전체 entry 소스는 현재 소스와 같지 않다.

따라서 **SQL 3번으로 bucket을 만든 다음, native 사진 삭제가 포함된 `delete-account` 함수 묶음을 배포하는 작업이 남아 있다.** 이 결론은 다운로드한 소스 비교에서 나왔으며 원격 `version: 4`나 `ACTIVE`만으로 추정하지 않았다. R2/Cloudflare 설정의 유효성, 실제 upload 대기, 사진 삭제 성공은 함수 실행으로 검증하지 않았다. [비교 metadata](../../output/qa/release-integrity-20261002/deployed-delete-account-source.json)에 파일 digest와 확인한 code symbol만 기록했다.

기존 `upload-profile-avatar`, `upload-feedback-reflection-photo`도 [`withAccountMediaUpload`](../../supabase/functions/_shared/account-media.ts)를 사용하는지 확인한다. 이전 배포에서 lease 적용이 완료됐다면 이번 범위에서 다시 배포할 필요는 없다. 미적용 상태라면 [기존 미디어 배포 순서](premerge-data-safety-release.md)를 따라 upload 함수부터 맞춘 뒤 삭제 함수를 배포한다. 장소 조회 함수의 갱신은 이번 백업 기능의 선행 조건이 아니다.

### 보존할 저장 계약

- snapshot은 계정당 16 MiB 상한과 단조 증가 revision을 사용한다. 오래된 기기의 `expected_revision`으로 최신 원문을 덮을 수 없어야 한다.
- `native-dining-photos`는 비공개, JPEG, 파일당 6 MiB다. object key는 `<user UUID>/<filename>.jpg`이며 파일 이름은 SQL의 허용 문자·길이를 따른다.
- 사진은 같은 이름으로 덮지 않는다. 교체 사진에 새 이름을 부여하고 기존 원문이 참조하는 사진은 보존한다.
- Android extension의 사진도 공통 `photoFilenames`에 포함해야 한다. 웹·iOS의 편집이 이 참조나 extension 바이트를 없애면 안 된다.
- 일반 로그아웃은 계정별 로컬 원문과 사진을 보존한다. 계정 삭제는 서버 성공을 확인한 뒤 해당 계정 로컬 자료를 처리한다.

`delete-account`에는 기존 Supabase·R2·Cloudflare 설정이 계속 필요하다. 필요한 이름은 [기존 배포 문서의 서버 설정](premerge-data-safety-release.md#서버-설정)을 따른다. 이 문서와 검증 로그에 실제 key, token, DB password를 넣지 않는다.

### 구형 앱과 함께 배포할 때

**서버의 5번 보호 migration을 적용한 뒤 Android 계정 백업을 배포한다.** 구형 iOS/Web가 새 extension key를 버리거나 Android 사진을 공통 manifest에서 빼는 저장은 서버가 거절해야 한다. 클라이언트가 저장 실패를 성공으로 표시하거나 로컬 원문을 지우지 않는지도 확인한다. 사용자에게는 호환 버전으로 업데이트한 뒤 백업을 재시도하는 경로를 제공한다.

서버는 이미 존재하는 `tastebuddy.android.archive.v1` key의 제거를 update trigger로 차단한다. extension의 base64 JSON이 object이고, 양수 숫자 `schemaVersion`, object `state`, 안전한 JPG 이름 배열 `photoFilenames`를 가지며 그 이름이 공통 manifest에 포함되는지도 검사한다. Android가 마지막 식사 기록을 지워도 extension key를 유지하고 실제 남아 있는 프로필·설문·작성 중 기록 등의 원문과 사진 목록을 저장한다. 계정 전체 row의 삭제는 이 update guard의 대상이 아니다.

서버는 Android `state` 내부의 기록 의미를 해석하지 않는다. 따라서 유효한 빈 extension으로의 명시적 교체와 내용이 있는 extension의 교체는 정상 Android 변경으로 처리될 수 있다. 이 검사는 key 누락·사진 참조 누락을 막으며 원문을 조용히 합쳐서 저장하지 않는다. 호환 웹·iOS는 Android extension 바이트를 그대로 보존해야 한다.

## 4. 실행 순서와 통과 기준

1. 배포 대상으로 지정된 환경의 migration 이력, 실제 table/function/RLS 정의, 비공개 bucket 설정을 읽기 전용으로 확인한다. 별도 release 디렉터리와 선별 5개 파일의 hash를 기록한다.
2. staging에서 baseline과 선별 SQL 조합을 적용하고 metadata를 다시 확인한다. 이어서 필요한 `delete-account` artifact를 배포한다. 기존 upload 함수에 lease가 없다면 위의 선행 순서를 따른다.
3. 고정된 합성 fixture와 별도 테스트 계정 A/B만 사용해 아래 흐름을 실행한다. 실제 사용자 계정·사진·이메일이나 기록 사본을 fixture로 쓰지 않는다. 재현 기록에는 테스트 계정의 비밀정보를 남기지 않는다.
4. 서버와 Storage 검사가 통과한 뒤 해당 서버 계약을 사용하는 웹·iOS·Android 빌드를 배포 후보로 묶는다. 운영 반영 전 staging 결과와 실제 대상 환경의 차이를 검토한다.
5. 운영 배포가 별도로 승인되면 검토한 동일 manifest·artifact를 적용하고 적용 이력 및 함수 artifact를 다시 확인한다. 사용자 데이터의 자동 이전이나 정리는 이 배포에 포함하지 않는다.

통과해야 하는 흐름:

| 흐름 | 확인할 결과 |
| --- | --- |
| 웹/iOS: 기록·사진 저장 → 앱 재실행 → 두 번째 기기 복원 | 원문, 원본 사진, account revision이 이어지고 복원 뒤 오프라인에서도 원본을 읽음 |
| Android: 기록·사진 백업 → 다른 Android 기기 복원 | Android 원문 extension이 복원되고 공통 snapshot의 웹/iOS 키가 바뀌지 않음 |
| A 로그아웃 → B 로그인 → A 재로그인 | B에 A 원문·사진이 나타나지 않고 A 로컬 원문이 유지됨 |
| 오프라인 편집 → 재접속 | 같은 원문을 중복 생성하지 않고 계정 백업이 진행됨 |
| 두 기기에서 동시에 수정 또는 마지막 기록 삭제 | revision 충돌을 알리고 양쪽 원문과 삭제 의도를 보존함 |
| 구형 앱이 Android key를 없애거나 사진 manifest를 iOS 사진만으로 재작성 | 저장이 거절되고 기존 snapshot 바이트·revision·Android 사진 삭제 보호가 유지됨 |
| 저장 성공 뒤 응답 유실 → 재시도 | 이미 저장된 snapshot을 확인하고 원문·학습 근거를 중복 생성하지 않음 |
| 잘못된 envelope·새 schema·누락 사진·저장 공간 부족 | 읽을 수 있는 기존 로컬 원문과 서버 revision을 유지하며 재시도 경로를 제공함 |
| 합성 테스트 계정 삭제, upload 진행 중 삭제, Storage 실패 후 재시도 | 업로드와 삭제가 조정되고 사진 정리가 끝나기 전 Auth 성공 삭제를 반환하지 않음 |

로컬 단위/PGlite/모의 네트워크 검사와 실제 계정·Storage·기기 흐름의 결과를 따로 기록한다. 전체 결과는 이번 작업의 QA 문서와 `output/qa/release-integrity-20261002/` 로그에서 관리한다.

## 5. 중단·복구 원칙

- 배포 실패 시 새 클라이언트 확대를 멈추고 실패한 migration/function 단계부터 확인한다. 이미 적용된 table·bucket·원문 row를 지워 되돌리지 않는다.
- v2 원문을 v1으로 바꾸거나 미지원 key를 제거하지 않는다. 구형 앱으로 되돌려야 한다면 먼저 v2를 안전하게 읽고 보존하는 호환 버전을 준비한다.
- envelope 검사에 걸린 과거 row는 원본 그대로 보관한다. 원문·계정 소유권을 확인한 별도 복구 절차 없이 빈 snapshot으로 교체하지 않는다. `NOT VALID` 제약을 검증 완료로 바꾸는 작업은 기존 row 검사와 복구 후 별도로 수행한다.
- 충돌은 사용자 선택 전에 자동 병합·덮어쓰기를 하지 않는다. 선택 적용으로 원문을 교체하기 전에 교체되는 원문과 사진을 복구용으로 보존한다. 다른 계정의 복구본을 연결하지 않는다.
- 계정 삭제의 부분 실패는 기존 삭제 요청으로 재시도한다. 정리가 덜 끝났다는 이유로 Auth를 먼저 지우거나 삭제 요청을 없애 새 upload를 허용하지 않는다.
- Supabase Storage object는 Storage API로 처리한다. SQL로 `storage.objects`만 지워 미디어 실체와 metadata를 분리하지 않는다.
- RLS 비활성화, public bucket 전환, anonymous 권한 확대를 배포 실패의 임시 해결책으로 사용하지 않는다.
