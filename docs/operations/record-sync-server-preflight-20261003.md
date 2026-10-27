# 기록 백업 서버 적용 전 확인 — 2026-10-03

## 2026-10-12 적용 완료

사용자 승인 후 현재 앱이 연결하는 같은 서버에 아래 SQL 5개와 `delete-account`를 실제 반영했다. 원격 이력은 27개이며 함수는 version 5, `verify_jwt: true`다. native table의 RLS와 비공개 사진 bucket을 확인했다. iPhone 16 Pro의 기존 원본 기록 4개·사진 4개가 백업됐고 기기/서버 원본 바이트가 일치한다. 계정 삭제 함수를 실제 호출하거나 새 기기 복원까지 검증한 것은 아니다.

[2026-10-12 적용·실기기 검증](../../output/ios-analysis-backup-20261012/verification.md). 이하 내용은 2026-10-03의 사전 점검 기록이다.

선별 SQL과 계정 삭제 함수의 반영 준비를 마쳤다. **현재 앱이 연결하는 서버에 실제 반영할지 확인이 남아 있다.** 대상 스키마·데이터·Edge Function은 아직 변경하지 않았다.

## 대상과 확인 결과

| 항목 | 결과 |
| --- | --- |
| Supabase 프로젝트 | `DailyDetaily's Project` / `hmexwxpkbrykxxdhhkai` / 서울 / `ACTIVE_HEALTHY` |
| 클라이언트 연결 | 웹·iOS·Android와 CLI 연결 프로젝트 일치 |
| 별도 staging | 프로젝트·preview branch 목록에서 확인되지 않음 |
| 원격 baseline | `20260903091000`까지 22개 이력 확인 |
| native table·bucket·RPC | 아직 미적용 |
| 배포 원문 | SQL·함수 33개 모두 기존 검토본·현재 소스와 SHA-256 일치 |
| 원격 dry-run | 아래 SQL 5개만 포함, seed·role 변경 없음 |
| 기존 업로드 함수 | 두 함수 모두 upload lease 사용을 배포 소스에서 확인 |

## 실제 반영할 변경

1. `20260908105000_native_account_data.sql`: 계정별 snapshot과 revision 비교 저장.
2. `20260908110000_atomic_feedback.sql`: 피드백 원문·근거·완료 상태의 단일 트랜잭션 저장.
3. `20260908120000_native_dining_photos.sql`: 비공개 사진 bucket, 계정별 접근 및 참조 중인 사진 삭제 보호.
4. `20260913011000_native_food_memory_v2.sql`: v2 원문 지원과 v1 덮어쓰기 방지.
5. `20261002010000_native_account_envelope_validation.sql`: 손상 envelope·Android 확장 유실 방지.
6. `delete-account`: 네이티브 사진 정리까지 완료한 뒤 Auth 계정을 삭제하도록 함수 갱신. 현재 `verify_jwt: true` 설정을 유지한다.

ChatGPT OAuth/export SQL 2개, seed, custom role, 기존 업로드 함수의 재배포는 포함하지 않는다. 기존 원문을 이동·초기화하는 작업도 포함하지 않는다.

## 실행할 명령

다음 명령은 실제 반영 대상이 확인된 뒤 실행할 적용안이다. 이 문서 작성 중에는 실행하지 않았다. 저장소 루트에서 전용 실행 디렉터리를 지정한다.

```sh
supabase db push --linked --yes --workdir output/qa/release-server-20261002/execution
supabase functions deploy delete-account --project-ref hmexwxpkbrykxxdhhkai --use-api --workdir output/qa/release-server-20261002/execution
```

적용 직전 원문 해시와 dry-run 목록을 다시 확인한다. SQL이 성공한 다음 함수만 배포하며, 실패하면 해당 단계에서 멈추고 완료된 migration을 임의로 되돌리거나 이력을 고치지 않는다.

## 반영 후 확인

- 원격 migration 이력에 선별 5개가 추가되고 OAuth/export 2개는 적용되지 않았는지 확인한다.
- 실제 table·RPC·RLS·비공개 bucket·envelope 검사·Android key 유지 guard를 확인한다.
- 배포한 `delete-account`를 다시 내려받아 네이티브 사진 정리 호출과 보호 설정을 확인한다.
- 전용 테스트 계정으로 실제 Auth·Storage·새 기기 복원·충돌·삭제 흐름을 별도로 검증한다. 사전 확인과 dry-run만으로 이 경로를 통과했다고 보고하지 않는다.

## 증거

- [사전 확인 요약](../../output/qa/release-server-20261002/preflight-summary.json)
- [실제 DB의 읽기 전용 조회](../../output/qa/release-server-20261002/preflight-before.json)
- [선별 migration dry-run](../../output/qa/release-server-20261002/dry-run.log)
- [배포된 업로드 함수의 lease 검사](../../output/qa/release-server-20261002/deployed-upload-lease-check.json)
- [전체 배포 명세와 복구 원칙](record-sync-release-20261002.md)
