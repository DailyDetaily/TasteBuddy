# Cloudflare R2 미디어 저장소 운영

Taste Buddy는 Supabase를 관계형 데이터와 권한의 source of truth로 두고, Cloudflare R2를 공개 미디어 object storage로 사용한다.

## 권장 버킷

```text
taste-buddy-public-media
  user-avatars/{user-id}/{asset-id}.webp
  feedback-reflections/{user-id}/{yyyy-mm-dd}/{asset-id}.jpg
  chefs/{chef-slug}.png
  restaurants/{restaurant-slug}/hero.webp
  menus/{restaurant-slug}/{source-slug}.webp

taste-buddy-private-ingest
  raw/catchtable/{restaurant-slug}/...
  raw/ocr/{restaurant-slug}/...
```

`taste-buddy-public-media`는 앱에서 바로 노출되는 최적화 이미지용이다. `taste-buddy-private-ingest`는 원본, OCR 자료, 검수 전 이미지를 보관한다.

## 앱 설정

R2 public bucket에 custom domain을 연결한 뒤 `.env.local`에 아래 값을 둔다.

```bash
VITE_R2_PUBLIC_MEDIA_BASE_URL="https://media.your-domain.com"
```

DB에는 전체 URL이 아니라 `chefs/jungsik.png` 같은 object key를 저장한다. 앱은 이 값을 `https://media.your-domain.com/chefs/jungsik.png`로 해석한다.

기존 Supabase Storage fallback은 유지된다. `VITE_R2_PUBLIC_MEDIA_BASE_URL` 또는 `VITE_PUBLIC_MEDIA_BASE_URL`이 없으면 `VITE_SUPABASE_PUBLIC_ASSET_BUCKET`과 `VITE_SUPABASE_URL`로 public object URL을 만든다.

## 프로필 사진 업로드

사용자 프로필 사진은 앱에서 512px WebP로 정리한 뒤 Supabase Edge Function `upload-profile-avatar`를 통해 `taste-buddy-public-media/user-avatars/{user-id}/{asset-id}.webp`에 저장한다. `profiles.avatar_path`에는 전체 URL이 아니라 R2 object key만 저장한다.

식후 피드백 사진은 앱에서 최대 1600px JPEG로 정리한 뒤 Supabase Edge Function `upload-feedback-reflection-photo`를 통해 `taste-buddy-public-media/feedback-reflections/{user-id}/{yyyy-mm-dd}/{reservationId-dishId-asset-id}.jpg`에 저장한다. 함수는 인증된 요청만 받고, 6MB 이하의 WebP/PNG/JPEG만 허용한다. `feedback_items.reflection_photo_preview_url`에는 기존 data URL 대신 R2 object key를 저장하고, 앱은 `resolvePublicMediaPath`로 public media URL을 만들어 표시한다.

Edge Function에 필요한 secrets:

```bash
supabase secrets set \
  R2_ACCOUNT_ID="..." \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_PUBLIC_MEDIA_BUCKET="taste-buddy-public-media"
```

배포:

```bash
supabase functions deploy upload-profile-avatar
supabase functions deploy upload-feedback-reflection-photo
```

## Supabase 메타데이터

`supabase/migrations/20260513_media_assets_r2.sql`는 R2 object metadata를 저장할 `media_assets` 테이블을 추가한다.

권장 사용:

- `object_key`: R2 object key
- `owner_type`: `chef`, `restaurant`, `menu`, `source_document`
- `owner_id`: 연결된 Supabase row id
- `alt_text`, `credit`, `source_url`: 프리미엄 콘텐츠 품질과 출처 관리를 위한 필드
- `review_status`: 앱 노출 가능 여부

초기 seed의 `chefs.avatar_path`는 그대로 유지해도 된다. 더 정교한 asset 검수가 필요해지면 `media_assets`를 source of truth로 확장한다.

`media_assets`는 승인된 asset의 public read만 RLS로 연다. 쓰기/수정은 seed script, 운영 스크립트, Supabase service role처럼 서버 사이드 권한을 가진 경로에서만 수행한다.

## Cloudflare 설정 체크리스트

1. R2 bucket을 만든다.
2. 공개용 bucket에는 custom domain을 연결한다.
3. `r2.dev` public access는 운영에서 끄는 것을 기본값으로 둔다.
4. Cloudflare Cache Rule은 hashed asset 또는 승인된 public media에만 신중하게 적용한다.
5. private ingest bucket은 공개하지 않는다.
