# TasteBuddy: Data API 명시 권한 검토

검토일: 2026-10-11 (Asia/Seoul).

공식 근거: [Supabase 정책 공지](https://github.com/orgs/supabase/discussions/45329), [Data API 보안 문서](https://supabase.com/docs/guides/api/securing-your-api).
2026-10-30은 기존 프로젝트 적용일이다. 신규 프로젝트는 2026-05-30부터 점진 적용됐다. 기존 테이블 ACL은 보존되며, 새로 생성되는 테이블의 자동 권한만 달라진다. 따라서 현재 장애 여부는 저장소만으로 판정할 수 없다. 제공된 이메일은 별도로 읽지 않았으며 시행일은 공식 공지에서 교차 확인했다.

표에서 S=SELECT, I=INSERT, U=UPDATE, D=DELETE. 아래는 이번 검토에서 필요한 접근 경로를 기준으로 정한 권한이며, 운영 DB의 현재 ACL 덤프가 아니다. RLS 허용 정책이 있다는 이유만으로 미사용 작업까지 GRANT하지 않는다. SECURITY DEFINER는 함수 소유자 권한으로 실행되므로 호출자에게 내부 테이블 CRUD를 줄 필요가 없다. SECURITY INVOKER는 호출자 테이블 권한과 RLS를 모두 요구한다.

검토 기준 커밋: `d1845d0bb7dec2d807ce88a53d9fb76e31f45666`. 기존 SQL 28개 전체를 읽고 아래 실제 호출 파일과 비교했다. 운영 DB 접속·조회·변경은 하지 않았다.

## 테이블별 판단

표의 권한은 패치의 검토 대상 접근 목록이다. 이미 명시된 권한은 재부여할 필요가 없으며 비고에 표시했다.

| 테이블 | anon | authenticated | service_role | 최종 RLS / 호출 근거 |
|---|---|---|---|---|
| `profiles` | 추가 없음 | S/I/U | 추가 없음 | 본인 S/I/U RLS. 네이티브 프로필 upsert와 웹 프로필 갱신. |
| `restaurants` | S | S/I | S/I/U | 공개 S; authenticated I 정책과 실제 get/create 사용이 있음. 무조건 insert 정책 자체는 별도 제품 보안 검토 대상이며 이번에는 U/D를 추가하지 않음. |
| `chefs` | S | S/I | S/I/U | 공개 S; 실제 get/create 경로에 I 필요. U/D는 클라이언트에 추가하지 않음. |
| `devices` | 추가 없음 | 추가 없음 | 추가 없음 | 본인 S/I/U RLS는 있지만 확인한 앱 경로에서 직접 호출을 찾지 못해 이번에 권한을 추가하지 않음. 기기 연동 추가 시 재검토. |
| `measurement_sessions` | 추가 없음 | S/I | 추가 없음 | 본인 S/I/U RLS 중 현재 생성·조회에 필요한 S/I만 추가; RPC의 관련 요약 조회는 DEFINER. |
| `measurement_results` | 추가 없음 | S/I | 추가 없음 | 소유 측정 세션을 통해 S/I 확인. 세션 테이블 S도 필요. |
| `source_documents` | S | S | S/I/U | 공개 S 정책. seed importer만 service_role S/I/U 사용. |
| `dish_entities` | S | S | S/I/U | 공개 S 정책. seed importer S/I/U. |
| `dish_observed_facts` | S | S | S/I/D | 공개 S 정책. seed importer에서 해당 요리의 기존 facts를 삭제하고 다시 insert: service_role S/I/D. |
| `dish_inference_profiles` | S | S | S/I/D | 공개 S 정책. seed importer delete/insert: service_role S/I/D. |
| `research_rules` | S | S | S/I/U | 공개 S 정책. seed importer upsert: service_role S/I/U. |
| `reservations` | 추가 없음 | S/I/U | 추가 없음 | 본인 S/I/U. 실제 upsert 및 INVOKER RPC의 FOR UPDATE가 U 권한도 요구. |
| `tcs_guidance_packets` | 추가 없음 | S | 추가 없음 | 본인 예약을 통한 S만. 서버 생성 경로의 추가 권한은 추측하지 않음. |
| `reservation_dishes` | 추가 없음 | S/I/U | 추가 없음 | 본인 예약을 통한 S/I/U. INVOKER 피드백 RPC의 upsert 필요. |
| `feedback_submissions` | 추가 없음 | S/I/U | 추가 없음 | 본인 S/I/U. INVOKER RPC에서 잠금, upsert 및 완료 플래그 갱신. |
| `feedback_items` | 추가 없음 | S/I/U | 추가 없음 | 본인 제출을 통한 S/I/U. INVOKER RPC의 upsert. |
| `feedback_parses` | 추가 없음 | S/I/U | 추가 없음 | 본인 feedback_items/submissions를 통한 S/I/U. INVOKER RPC의 parse upsert. |
| `user_learned_deltas` | 추가 없음 | S | 추가 없음 | 본인 S만. 20260903091000에서 I/U 정책 삭제; 재계산 트리거(DEFINER)가 저장. |
| `notifications` | 추가 없음 | S/I/U | 추가 없음 | 본인 S/I/U 정책과 앱 생성/읽음 표시 경로 유지. 팔로워 알림은 DEFINER 트리거. |
| `restaurant_place_index` | S | S | 추가 없음 | 공개 S만. 20260903090000에서 기존 authenticated I/U 정책 삭제 및 I/U/D REVOKE. 다시 쓰기 열지 않음. |
| `restaurant_operating_hours` | S | S | 추가 없음 | 공개 S만. place_index와 동일하게 최신 hardening 유지. |
| `media_assets` | S | S | 추가 없음 | review_status=approved에 한해 공개 S. 직접 클라이언트 쓰기 없음. |
| `profile_friendships` | 추가 없음 | S/D | 추가 없음 | 본인 관련 행 S/D. 생성은 add_friend_by_nickname(DEFINER); I 정책이 남아도 직접 I를 새로 부여하지 않음. |
| `taste_social_profiles` | 추가 없음 | S | 추가 없음 | authenticated S만 추가. public/followers/own 조건 RLS 및 friendships 참조. 현 호출은 조회; I/U는 추측해 추가하지 않음. |
| `taste_dining_reviews` | 추가 없음 | S | 추가 없음 | authenticated S만 추가. public + 프로필 가시성 RLS; 관련 profiles/friendships S 필요. 기존 쓰기 정책은 수정하지 않음. |
| `restaurant_bookmark_lists` | 추가 없음 | S/I/D | 추가 없음 | 20260903090000의 owner_user_id + email WITH CHECK. 현 클라이언트 목록 교체의 S/I/D만 추가; U는 추가하지 않음. 이메일만의 초기 정책을 복원하지 않음. |
| `restaurant_bookmarks` | 추가 없음 | S/I/D | 추가 없음 | owner_user_id 본인 정책; 현 목록 교체의 S/I/D만 추가. Auth FK 및 계정 삭제 trigger 유지. |
| `tba_feedback_evidence_events` | 추가 없음 | S/I | 추가 없음 | 본인 S/I. INVOKER RPC의 evidence insert와 앱 재구축 조회. |
| `user_tba_confidence_states` | 추가 없음 | S/I/U | 추가 없음 | 본인 S/I/U. 앱 신뢰도 캐시 upsert. |
| `account_legacy_bookmarks` | 추가 없음 | 추가 없음 | 추가 없음 | 기존 service_role ALL 명시 권한 유지. 클라이언트 차단; 이번에 새 권한 없음. |
| `account_deletion_requests` | 추가 없음 | 추가 없음 | 추가 없음 | 클라이언트 접근 차단. prepare_account_deletion(DEFINER) 내부 상태. service_role의 함수 EXECUTE만 필요. |
| `account_media_uploads` | 추가 없음 | 추가 없음 | 추가 없음 | 클라이언트 접근 차단. begin/finish 업로드 임대 RPC 내부 상태. |
| `chatgpt_analysis_exports` | 추가 없음 | 추가 없음 | 추가 없음 | 기존 authenticated CRUD / service_role S/D 명시 권한 유지. 본인 + client_id/anonymous 제약, 24h 만료 유지. |
| `chatgpt_oauth_configuration` | 추가 없음 | 추가 없음 | 추가 없음 | 기존 service_role S 명시 권한 유지. 클라이언트 차단. |
| `native_account_data` | 추가 없음 | 추가 없음 | 추가 없음 | 기존 authenticated S / service_role ALL 유지. 쓰기는 save_native_account_data(DEFINER), revision 및 버전 강등 방지 유지. |

## 핵심 이력과 오류

- 초기 MVP, 공개 콘텐츠, place_index, media_assets, friendships, social, bookmarks, TBA 테이블은 RLS를 갖지만 최종 이력에 테이블 GRANT가 빠진 항목이 많다. 새로운 DB에서는 콘텐츠 조회·프로필 upsert·측정 저장·예약·피드백·북마크·캐시 갱신이 42501로 실패할 수 있다.
- save_dining_feedback_atomic은 SECURITY INVOKER다. EXECUTE만 있어도 충분하지 않다. reservations/feedback_submissions의 SELECT FOR UPDATE, dish/item/parse upsert, evidence insert에 필요한 S/I/U를 명시한다. DELETE는 이 RPC의 clear 구현에서 쓰지 않아 부여하지 않는다.
- place_index/hours는 20260903090000 이후 공개 조회만 허용. 초기 insert/update 정책에 맞춰 쓰기 권한을 복원하지 않는다.
- user_learned_deltas는 20260903091000 이후 SELECT만 필요한 파생 데이터다. native_account_data는 기존 read + revision RPC 경계를 유지한다.
- 이전 social RPC 다섯 개는 명시적 authenticated EXECUTE가 없었다. 새 기본 설정에도 의존하지 않도록 실행 권한을 명시한다. PostgreSQL의 PUBLIC EXECUTE가 남아 있다면 현재도 호출될 수 있으므로, 이를 확정 장애로 보고하지 않는다. 함수 자체의 기존 인증 검사는 유지한다.
- seed importer는 service_role을 사용하지만 BYPASSRLS가 테이블 ACL을 대신하지 않는다. importer가 실제 사용하는 공개 콘텐츠 7개 테이블에만 S/I/U 또는 S/I/D를 준다. 다른 worker 테이블의 전체 권한은 추측하지 않는다.
- 실제 호출 확인: src/lib/tasteBuddySupabase.ts, supabase.ts, notificationsSupabase.ts, restaurantBookmarksSupabase.ts, tasteBuddyAgentSupabase.ts; BackendAuthRepository.swift; scripts/import-supabase-seed.mjs; 계정 미디어·삭제 Edge Functions. 모든 코드 파일에 대한 전수 실행 검증은 아니다.

## 변경 파일과 안전성

1. `supabase/migrations/20261011000100_explicit_data_api_grants.sql`: 누락된 작업별 테이블/함수 GRANT를 추가. RLS 활성화 여부를 먼저 검사해 누락된 보호를 감지하면 중단한다.
2. `supabase/tests/data_api_grants.sql`: 읽기 전용 ACL/RLS 및 주요 RPC smoke SQL. 누락된 권한과 기존 직접 쓰기/내부 테이블 경계 손상을 검사하고 유효 ACL·정책·default ACL을 출력한다.
3. 이 문서: 최종 권한 비교, 검증 한계와 운영 확인 절차.

기존 마이그레이션은 수정하지 않았다. 신규 패치는 데이터 INSERT/UPDATE/DELETE, 스키마/정책 변경, REVOKE, ALTER DEFAULT PRIVILEGES, ALL TABLES, sequence/전체 권한 부여를 하지 않는다. 기존 운영 권한을 일괄 정리하지 않는 additive 패치다. 따라서 과거 자동 ACL로 남은 불필요한 권한까지 제거하는 패치가 아니며, 그것은 실제 운영 ACL 및 호환성 확인 뒤 별도로 진행해야 한다. anon 추가는 TasteBuddy에서 이미 공개 SELECT RLS가 있는 콘텐츠에만 한정한다. GRANT는 트랜잭션 내에서 migration runner로 적용하고 오류 시 전체 롤백해야 한다.

## 수행한 검증과 한계

- 전체 기존 SQL 이력의 명시적 테이블 GRANT/REVOKE를 정적 비교했다. default ACL이 없는 모델에서 이번 allowlist 권한 및 중요한 write boundary 검사는 통과했다.
- 신규 SQL에 데이터 변경, 기존 권한 회수, blanket/default/sequence GRANT가 없음을 검사했다. 기존 SQL은 한 바이트도 수정하지 않는다.
- 실제 PostgreSQL/Supabase/CLI/Docker가 이 실행 환경에 없어 전체 replay 및 SQL smoke 실행, JWT/RLS 행 격리, PostgREST, Realtime 통합 테스트는 수행하지 못했다. 정적 검사는 PostgreSQL 파서/실행 결과가 아니며 동적 SQL/역할 상속/운영 설정을 완전히 모델링하지 않는다.
- 기본 권한이 없는 새 DB에서 반드시 아래 검증을 완료한 후 운영 반영한다. 현재 결과만으로 운영 정상이나 완전한 신규 설치 성공을 보증하지 않는다.

## 별도 staging 검증 절차

1. 운영과 분리된 일회용 Supabase 프로젝트를 만들고 자동 테이블 노출을 끈다. 또는 일회용 local DB에서 실제 migration 생성 역할의 global/schema default ACL을 조회해 테이블 자동 grants가 없는지 확인한다. 운영 DB에 이 시험용 revoke/reset를 실행하지 않는다.
2. 기존 SQL 전체와 새 SQL을 순서대로 적용한다. 중간 migration 버전까지만 실행한 DB는 이번 최신 이력 기반 patch의 지원 대상이 아니다. 중간 버전을 따로 배포해야 한다면 그 버전의 기능별 allowlist를 별도 검토해야 한다.
3. psql의 ON_ERROR_STOP=1로 `supabase/tests/data_api_grants.sql`을 실행한다. public schema USAGE, role membership/owner, ACL과 RLS를 기록한다. schema 자체를 DROP/CREATE하면 USAGE까지 사라질 수 있으며 이 패치는 스키마 재생성 권한을 복구하지 않는다.
4. anon, 일반 로그인 사용자 A/B, Supabase 익명 로그인 사용자(역할은 authenticated), service_role을 구분해 테스트한다. A 소유 데이터의 읽기·정상 저장·재시도는 성공하고, B의 조회는 비공개 행을 반환하지 않으며 B의 변조/생성 시도는 거부돼야 한다.
5. 피드백 RPC의 최초 저장·동일 요청 재시도·수정·clear·잘못된 parse rollback을 테스트한다. 일반 로그인만 성공하고 익명 로그인/OAuth client token 거부 여부를 확인한다. 예약·프로필·측정 저장과 관련 테이블 조인, TBA 캐시 upsert, 북마크 계정 격리, 승인 media 공개/미승인 비노출을 검증한다. place_index/hours와 user_learned_deltas 직접 쓰기 실패를 확인한다. native snapshot 직접 쓰기 실패 및 RPC revision 충돌/버전 보호, ChatGPT export expiry/role 격리, seed importer 성공을 확인한다.
6. 전체 replay의 정책 변경과 무관한 요구사항도 확인한다. storage.buckets/objects, Supabase auth roles 및 tb_chatgpt_reader 역할 생성 권한이 필요하다. 최신 native/food-memory migration은 reader 버전 호환성 전제를 갖는다. 과거 social 개발 seed와 정리/백필 SQL이 포함돼 있어 운영에서 전체 이력을 재실행하면 안 된다.

## 운영 반영 및 향후 규칙

- 적용된 migration 목록, 현재 ACL/RLS, Data API exposed schemas, 자동 테이블 노출 상태와 실제 테이블 생성 역할(default ACL은 역할별)을 먼저 확인한다. 저장소 최신 commit과 운영 migration 이력은 같다고 가정하지 않는다.
- 관리된 백업/PITR와 복구 경로를 확보한 뒤 staging 통과를 기준으로 새 migration만 배포한다. 전체 db reset/replay는 운영에서 금지. 현재 작업에서는 배포하지 않았다.
- 문제가 생기면 패치가 실제로 추가한 role/table/operation만 사전 ACL 스냅샷과 비교해 되돌린다. 기존에 존재하던 동일 권한을 무조건 REVOKE하면 운영 기능을 깨뜨릴 수 있다.
- 앞으로 CREATE TABLE migration에 RLS 활성화 + 해당 역할/작업의 GRANT + 정책을 함께 둔다. RPC 전용 내부 테이블은 직접 GRANT 없이 명확하게 주석/REVOKE하고 필요한 함수 EXECUTE만 명시한다. sequence 기반 컬럼이 새로 생기면 필요한 개별 sequence USAGE를 따로 검토한다. 이번 테이블은 UUID 기반이므로 sequence 권한을 추가하지 않았다.
- 새 테이블에서는 기존 default ACL 유무와 관계없이 노출할 최소 권한을 명시하고, 익명/타 사용자 부정 테스트를 함께 수행한다. RLS 없는 테이블 또는 모든 역할 CRUD를 기본 템플릿으로 쓰지 않는다.
