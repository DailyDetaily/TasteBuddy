# Supabase 연결과 Seed 넣기

이 프로젝트는 현재 `Supabase + anonymous auth + seed JSON import script` 기준으로 맞춰져 있습니다.

## 1. Supabase에서 필요한 값

Supabase 프로젝트를 만든 뒤 아래 3가지를 준비하면 됩니다.

- `Project URL`
- `Publishable key` 또는 `anon key`
- `Secret key` 또는 `service_role key`

주의:
- `Publishable key / anon key`는 앱 브라우저 연결용입니다.
- `Secret key / service_role key`는 seed import 스크립트용입니다.
- `Secret key / service_role key`는 절대 `VITE_`로 시작하면 안 됩니다.

## 2. 로컬 env 파일 만들기

프로젝트 루트에 `.env.local` 파일을 만들고 이렇게 넣으면 됩니다.

```bash
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
# Legacy fallback
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Public media origin. Prefer the Cloudflare R2 custom domain.
VITE_R2_PUBLIC_MEDIA_BASE_URL="https://media.your-domain.com"
# Optional generic alias if the media origin is not R2-specific.
VITE_PUBLIC_MEDIA_BASE_URL="https://media.your-domain.com"
# Legacy fallback when no public media base URL is configured.
VITE_SUPABASE_PUBLIC_ASSET_BUCKET="taste-buddy-assets"

# Server-side only
SUPABASE_SECRET_KEY="your-supabase-secret-key"
# Legacy fallback
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

VITE_SUPABASE_USE_ANONYMOUS_AUTH="true"

# Server-side place index sync
KAKAO_REST_API_KEY="your-kakao-rest-api-key"
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

지금 앱은 `VITE_SUPABASE_PUBLISHABLE_KEY`를 먼저 읽고, 없으면 `VITE_SUPABASE_ANON_KEY`를 fallback으로 사용합니다.

`chefs.avatar_path`처럼 DB에 저장된 상대 이미지 경로는 R2 public media origin으로 해석됩니다. 예를 들어
`VITE_R2_PUBLIC_MEDIA_BASE_URL`이 `https://media.your-domain.com`이고 DB 값이
`chefs/jungsik.png`이면 앱은 `https://media.your-domain.com/chefs/jungsik.png`를 먼저
사용하고, 없을 때만 로컬 fallback 이미지를 사용합니다.

`VITE_R2_PUBLIC_MEDIA_BASE_URL` 또는 `VITE_PUBLIC_MEDIA_BASE_URL`이 없으면 기존처럼
`VITE_SUPABASE_PUBLIC_ASSET_BUCKET`의 Supabase Storage public object URL로 fallback합니다.

R2 운영 기준은 [cloudflare-r2-media-storage.md](/Users/sinjunho/Desktop/Taste%20Buddy%20app/docs/operations/cloudflare-r2-media-storage.md#L1)를 참고하세요.

## 3. DB 스키마 적용

아직 테이블이 없다면 Supabase Dashboard의 SQL Editor에서 아래 파일 내용을 실행하면 됩니다.

- [20260326_taste_buddy_mvp.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260326_taste_buddy_mvp.sql#L1)
- [20260430_place_index.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260430_place_index.sql#L1)
- [20260513_media_assets_r2.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260513_media_assets_r2.sql#L1)
- [20260527_taste_agent_social_seed.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260527_taste_agent_social_seed.sql#L1)
- [20260527_taste_agent_social_dev_enrichment.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260527_taste_agent_social_dev_enrichment.sql#L1)
- [20260528_feedback_item_dish_card_details.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260528_feedback_item_dish_card_details.sql#L1)
- [20260528_profile_identity_search.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260528_profile_identity_search.sql#L1)
- [20260528_restaurant_bookmarks_by_email.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260528_restaurant_bookmarks_by_email.sql#L1)

이 파일이 만들어주는 것:
- `restaurants`
- `chefs`
- `source_documents`
- `dish_entities`
- `dish_observed_facts`
- `dish_inference_profiles`
- 앱에서 쓰는 예약/측정/피드백 관련 테이블들
- `restaurant_place_index`, `restaurant_operating_hours`
- R2 object metadata용 `media_assets`
- feedback item의 dish kind/detail tag/회고 사진 metadata columns
- TasteBuddyAgent social graph용 `taste_social_profiles`, `taste_dining_reviews`
- profile identity search RPC `search_profiles_by_identity`
- 이메일 기반 saved restaurant sync용 `restaurant_bookmark_lists`, `restaurant_bookmarks`

## 4. Anonymous auth 사용 여부

지금 앱은 기본적으로 익명 세션을 만들어서 데이터를 저장합니다.

- 유지하려면: Supabase Auth 설정에서 anonymous sign-in을 켭니다.
- 끄려면: `.env.local`에서 `VITE_SUPABASE_USE_ANONYMOUS_AUTH="false"`로 바꿉니다.

초기 MVP에서는 anonymous auth를 켜두는 편이 가장 간단합니다.

## 5. seed JSON 넣기

이미 만들어둔 Mingles 디너 seed는 여기 있습니다.

- [mingles-dinner-2026-01-08.seed.json](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/seeds/mingles-dinner-2026-01-08.seed.json#L1)

먼저 dry-run으로 형식만 확인할 수 있습니다.

```bash
npm run seed:supabase -- supabase/seeds/mingles-dinner-2026-01-08.seed.json --dry-run
```

실제로 Supabase에 넣을 때는:

```bash
npm run seed:mingles:dinner
```

또는 일반 명령으로:

```bash
npm run seed:supabase -- supabase/seeds/mingles-dinner-2026-01-08.seed.json
```

이 스크립트가 하는 일:
- `restaurants` upsert
- `chefs` upsert
- `source_documents` insert/update
- `dish_entities` insert/update
- 해당 dish의 기존 `dish_observed_facts`, `dish_inference_profiles` 삭제 후 다시 insert

즉, 같은 seed를 다시 넣어도 완전히 중복만 쌓이지 않도록 설계되어 있습니다.

## 6. 앱 실행

seed가 들어간 뒤에는 앱을 이렇게 실행하면 됩니다.

```bash
npm run dev
```

## 7. 처음에 가장 자주 막히는 부분

- 앱은 켜지는데 저장이 안 됨
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY` 확인
  - anonymous auth 사용 시 anonymous sign-in 설정 확인

- seed script가 실패함
  - `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`가 없는 경우가 가장 많음
  - 마이그레이션이 아직 적용되지 않은 경우도 많음

- seed JSON의 course position이 안 맞음
  - import script가 `petitFour -> petit_four`, `component -> other`로 자동 정규화합니다.
