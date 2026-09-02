# 계정·피드백 데이터 수정 배포 순서

이 변경은 네이티브 계정 삭제/이메일 연결/로컬 초기화와, 웹 피드백 저장 및 공용 서버의 데이터 처리를 함께 수정합니다. 소스 변경만으로 운영 Supabase 함수나 정책이 바뀌지는 않습니다.

## 로컬 검증

```bash
npm ci
npm test
npm run build
```

`npm test`는 기존 미각/데이터셋 검사와 리뷰 식별자·계정별 재시도·DB 학습·권한·탈퇴 회귀 검사를 실행합니다. DB는 PGlite의 독립 PostgreSQL 인스턴스이고 R2/Cloudflare HTTP 요청은 모킹합니다. 운영 프로젝트와 실제 계정은 건드리지 않습니다.

iOS는 `TasteBuddy` 스킴에서 전체 테스트를 실행합니다. 실제 백엔드에 연결하지 않는 검증은 `TB_SUPABASE_URL=__PREMERGE_NO_BACKEND__`, `TB_SUPABASE_PUBLISHABLE_KEY=__PREMERGE_NO_BACKEND__`를 빌드 인자로 지정합니다. `project.yml`과 체크인된 Xcode 프로젝트는 패키지·서명 설정을 함께 유지해야 합니다.

## 서버 설정

기존 Supabase 인증 설정과 service-role 자격증명에 더해 다음 Edge Function secrets가 필요합니다. 실제 값은 저장소에 넣지 않습니다.

| 이름 | 용도 |
| --- | --- |
| `R2_ACCOUNT_ID` | R2 API 계정 |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | 사용자 미디어 목록 조회·업로드·삭제 권한 |
| `R2_PUBLIC_MEDIA_BUCKET` | 공개 미디어 버킷; 기본값 `taste-buddy-public-media` |
| `R2_PUBLIC_MEDIA_BASE_URL` | 앱이 사용하는 HTTPS 공개 미디어 origin |
| `CLOUDFLARE_ZONE_ID` | 공개 미디어 도메인이 속한 zone |
| `CLOUDFLARE_CACHE_PURGE_TOKEN` | 해당 zone의 Cache Purge 권한만 부여한 API token |

R2 삭제만으로는 기존 CDN 캐시가 사라지지 않습니다. 탈퇴 처리는 사용자의 아바타/회고 prefix를 원본에서 지우고 Cloudflare 캐시까지 purge한 뒤 Auth 계정을 삭제합니다. 캐시 설정이 없거나 삭제가 실패하면 성공을 반환하지 않습니다. 새 사용자 미디어는 장기 캐시를 피하도록 `private, no-store`로 업로드합니다. 미디어 도메인의 Cache Rule이 이를 덮어쓰지 않는지도 배포 환경에서 확인합니다.

Cloudflare 동작 기준: [prefix 단위 purge](https://developers.cloudflare.com/cache/how-to/purge-cache/purge_by_prefix/), [Purge Cache API](https://developers.cloudflare.com/api/resources/cache/methods/purge/).

## 적용 순서

1. 대상 DB의 적용 이력을 확인하고 이번 두 forward migration을 검토합니다. 이미 적용된 과거 마이그레이션 파일을 수정하거나 다시 실행하지 않습니다.
2. `20260903090000_premerge_data_safety.sql`을 적용합니다. 공용 식당 쓰기 권한, 단일 팔로우 알림, 계정 미디어 작업 조정과 북마크 소유 관계를 반영합니다.
3. `20260903091000_feedback_learning_idempotency.sql`을 적용합니다. 피드백의 현재 상태에서 학습값을 재계산하고 과거 클라이언트의 직접 누적 쓰기를 제한합니다.
4. 위 서버 secrets를 설정합니다. `upload-profile-avatar`, `upload-feedback-reflection-photo`를 먼저 배포해 새 업로드 조정이 활성화되게 합니다. 기존 함수 실행이 끝난 뒤 `delete-account`를 배포합니다.
5. 새 웹 번들과 네이티브 앱을 배포합니다. 웹은 체크인된 일부 `dist/` 파일이 아니라 `npm run build`가 만든 전체 출력물을 사용합니다.
6. 별도 테스트 계정으로 저장/재시도/수정/삭제, 계정 삭제 실패 후 재시도, 같은 이메일 재가입 시 데이터 격리를 확인합니다. 공용 식당 수정은 일반 계정에서 거부되어야 합니다.

탈퇴가 시작되면 새 사용자 미디어 업로드는 제한됩니다. 진행 중인 업로드가 있으면 삭제는 재시도를 요청하며, 만료되는 lease가 비정상 종료된 업로드 때문에 영구 대기하는 것을 막습니다. 서버 삭제가 완료되기 전에는 클라이언트의 계정 데이터를 초기화하지 않습니다.

## 이전 이메일 기반 저장 기록

현재 Auth 이메일과 연결되지 않는 기존 북마크는 삭제된 계정의 기록인지, 이메일을 바꾼 사용자의 기록인지 단정할 수 없습니다. 마이그레이션은 이 행을 삭제하는 대신 접근이 제한된 `public.account_legacy_bookmarks`에 원본 그대로 보존하고 활성 테이블에서 분리합니다. 일반 사용자와 같은 이메일로 새로 가입한 계정은 이 자료를 읽거나 이어받을 수 없습니다.

운영자는 `source_table`, `owner_email`, `row_snapshot`, `archived_at`을 확인해 별도로 소유권을 검증하고 복구 또는 삭제를 결정해야 합니다. 이메일이 같다는 이유만으로 새 계정에 재연결하지 않습니다.

## 저장소 정리

`node_modules/`, `scratch/SourcePackages/`, `supabase/.temp/`는 로컬에 유지하며 Git 추적만 해제합니다. 새 체크아웃은 `npm ci`와 Xcode의 패키지 해석으로 의존성을 준비합니다. 소스와 lockfile을 커밋하고, 로컬 캐시를 다시 강제로 추가하지 않습니다.
