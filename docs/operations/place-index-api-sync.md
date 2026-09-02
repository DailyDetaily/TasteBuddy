# 장소 인덱스 API 연결

Taste Buddy의 외부 지도 API 사용 목적은 식당을 더 잘 찾고 최신 운영 정보를 보강하는 것이다.
메뉴별 미각 벡터, 해석, 셰프 가이드는 계속 내부 DB의 고유 자산으로 관리한다.

## 역할 분리

```txt
Kakao / Naver / Google
→ 장소명, 주소, 좌표, 전화번호, 카테고리, 영업시간 보강

Taste Buddy
→ 메뉴, taste vector, interpretation, chef calibration guidance
```

앱 화면에서는 가능한 한 실시간 장소 조회를 우선한다. DB의 place index는 전체 주소 사본을 계속 늘리는 주 테이블이 아니라, `provider_place_id`와 식당명 매칭을 안정화하는 연결 레이어로 둔다.

## 1. DB 마이그레이션

Supabase SQL Editor에서 아래 파일을 적용한다.

- [20260430_place_index.sql](/Users/sinjunho/Desktop/Taste%20Buddy%20app/supabase/migrations/20260430_place_index.sql#L1)

생성되는 테이블:

- `restaurant_place_index`: 카카오/네이버/구글 등 외부 장소 ID와 주소/좌표를 저장
- `restaurant_operating_hours`: Google 또는 파트너 입력 기반 영업시간 저장

## 2. Env 설정

프로젝트 루트의 `.env.local`에 필요한 키만 넣는다.

```bash
# Primary Korean place index
KAKAO_REST_API_KEY="your-kakao-rest-api-key"

# Optional Korean local search helper
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# Optional hours/detail enrichment
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

이 키들은 서버/스크립트 전용이다. `VITE_` 접두사를 붙이지 않는다.

Supabase Edge Function에서 실시간 조회를 쓰려면 Supabase에도 같은 값을 secret으로 등록한다.

```bash
supabase secrets set KAKAO_REST_API_KEY="your-kakao-rest-api-key"
supabase secrets set GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
supabase functions deploy kakao-place-lookup
supabase functions deploy google-place-enrich
```

앱은 `supabase.functions.invoke('kakao-place-lookup')`과 `supabase.functions.invoke('google-place-enrich')`를 통해 외부 API를 호출한다. 브라우저 번들에는 카카오/구글 키가 들어가지 않는다.

## 3. 카카오로 장소 인덱스 동기화

```bash
npm run place-index:sync -- --provider kakao --query "정식당" --restaurant-slug jungsik --limit 3
```

카카오에서 저장하는 정보:

- 외부 장소 ID
- 식당명
- 지번/도로명 주소
- 위도/경도
- 전화번호
- 카테고리
- 카카오맵 URL

영업시간은 카카오 Local API에서 안정적인 필드로 제공되지 않으므로 저장하지 않는다.

## 3-1. 앱 화면에서 실시간 카카오 조회

식당 상세의 위치 카드에서는 아래 순서로 장소 정보를 정한다.

1. `restaurant_place_index`에서 같은 식당의 카카오 place id를 찾는다.
2. `kakao-place-lookup` Edge Function으로 카카오 Local API를 호출한다.
3. 카카오 응답의 주소, 전화번호, 좌표, 카카오맵 URL을 화면에 사용한다.
4. `google-place-enrich` Edge Function으로 Google Places를 호출해 카카오가 제공하지 않는 영업시간, 웹사이트, 구글맵 링크, 평점/가격대 같은 큐레이션 신호를 보강한다.
5. 함수가 아직 배포되지 않았거나 API 호출이 실패하면 기존 DB place index 값을 fallback으로 사용한다.

이 구조 덕분에 Taste Buddy DB는 메뉴/미각 벡터/큐레이션에 집중하고, 장소 정보는 카카오의 최신 데이터를 우선 사용할 수 있다.

## 4. 네이버 지역 검색 보조

```bash
npm run place-index:sync -- --provider naver --query "정식당" --restaurant-slug jungsik
```

네이버 Developers Local Search는 검색 보조로 사용한다. 좌표와 영업시간의 정규화 계층으로 쓰기에는 제한이 있으므로, Taste Buddy에서는 후보 검증 또는 한국어 로컬 검색 보강 용도로 둔다.

## 5. Google로 영업시간 보강

먼저 dry run으로 비용이 발생할 요청 범위를 확인한다.

```bash
npm run place-index:sync -- --provider google --query "Jungsik Seoul" --with-hours --dry-run
```

확인 후 저장한다.

```bash
npm run place-index:sync -- --provider google --query "Jungsik Seoul" --restaurant-slug jungsik --with-hours --limit 1
```

Google Places는 field mask에 따라 과금 SKU가 달라진다. 특히 `regularOpeningHours`, `currentOpeningHours`, 전화번호 같은 필드는 기본 장소 검색보다 비용이 커질 수 있으므로, 모든 검색에 붙이지 말고 예약 후보 또는 파트너 식당에만 사용한다.

## 6. 운영 원칙

- 기본 식당 검색과 좌표 인덱스는 카카오를 우선한다.
- 앱 화면의 주소, 전화번호, 좌표, 카카오맵 링크는 `kakao-place-lookup` 실시간 조회를 우선한다.
- 카카오가 제공하지 않는 영업시간, 웹사이트, 일부 큐레이션 신호는 `google-place-enrich`로 보강한다.
- `restaurant_place_index`에는 노출용 사본을 무조건 늘리기보다 외부 provider ID와 fallback 값을 보관한다.
- 네이버는 검색 후보 보조로만 사용한다.
- 영업시간은 Google 또는 파트너 입력으로 보강한다.
- 외부 API 응답은 `source_payload`에 보관하되, 앱의 핵심 추천 로직은 내부 `dish_inference_profiles`와 피드백 루프를 기준으로 한다.
- 외부 API 키는 브라우저 번들에 넣지 않는다.
