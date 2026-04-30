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
- 네이버는 검색 후보 보조로만 사용한다.
- 영업시간은 Google 또는 파트너 입력으로 보강한다.
- 외부 API 응답은 `source_payload`에 보관하되, 앱의 핵심 추천 로직은 내부 `dish_inference_profiles`와 피드백 루프를 기준으로 한다.
- 외부 API 키는 브라우저 번들에 넣지 않는다.
