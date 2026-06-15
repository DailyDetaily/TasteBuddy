with seed_profiles (
  user_key,
  display_name,
  nickname,
  taste_measurement,
  feedback_count,
  review_count,
  average_rating,
  created_at
) as (
  values
    (
      'taste-dev-mina',
      '김민아',
      '맑은끝민아',
      '{"sweet": 4.6, "sour": 7.8, "bitter": 4.4, "salty": 4.8, "umami": 7.2, "fat": 5.2}'::jsonb,
      18,
      24,
      4.7,
      now() - interval '80 days'
    ),
    (
      'taste-dev-joon',
      '박준서',
      '깊은여운준서',
      '{"sweet": 5.4, "sour": 4.2, "bitter": 5.6, "salty": 5.8, "umami": 8.2, "fat": 7.4}'::jsonb,
      14,
      21,
      4.5,
      now() - interval '76 days'
    ),
    (
      'taste-dev-harin',
      '이하린',
      '계절감하린',
      '{"sweet": 7.4, "sour": 6.8, "bitter": 5.2, "salty": 4.6, "umami": 5.6, "fat": 4.8}'::jsonb,
      12,
      18,
      4.4,
      now() - interval '70 days'
    ),
    (
      'taste-dev-seoyoon',
      '정서윤',
      '산미탐험서윤',
      '{"sweet": 4.2, "sour": 8.4, "bitter": 5.1, "salty": 4.2, "umami": 6.6, "fat": 4.1}'::jsonb,
      11,
      16,
      4.6,
      now() - interval '64 days'
    ),
    (
      'taste-dev-doyun',
      '최도윤',
      '불향도윤',
      '{"sweet": 4.8, "sour": 4.6, "bitter": 6.9, "salty": 5.9, "umami": 8.0, "fat": 7.1}'::jsonb,
      10,
      14,
      4.3,
      now() - interval '58 days'
    ),
    (
      'taste-dev-jiwoo',
      '한지우',
      '디저트지우',
      '{"sweet": 8.2, "sour": 6.1, "bitter": 4.3, "salty": 4.0, "umami": 5.1, "fat": 6.8}'::jsonb,
      13,
      19,
      4.5,
      now() - interval '52 days'
    ),
    (
      'taste-dev-yerin',
      '오예린',
      '섬세한여운예린',
      '{"sweet": 5.1, "sour": 7.1, "bitter": 4.7, "salty": 4.4, "umami": 6.9, "fat": 3.9}'::jsonb,
      9,
      13,
      4.4,
      now() - interval '46 days'
    ),
    (
      'taste-dev-taeo',
      '강태오',
      '장맛태오',
      '{"sweet": 4.9, "sour": 4.8, "bitter": 5.7, "salty": 6.4, "umami": 8.5, "fat": 6.2}'::jsonb,
      15,
      22,
      4.6,
      now() - interval '40 days'
    )
)
insert into public.taste_social_profiles (
  user_key,
  display_name,
  nickname,
  visibility,
  taste_measurement,
  feedback_count,
  review_count,
  average_rating,
  is_seed,
  seed_source,
  created_at
)
select
  user_key,
  display_name,
  nickname,
  'public',
  taste_measurement,
  feedback_count,
  review_count,
  average_rating,
  true,
  'taste-buddy-agent-social-dev-rich',
  created_at
from seed_profiles
on conflict (user_key) do update
set
  display_name = excluded.display_name,
  nickname = excluded.nickname,
  visibility = excluded.visibility,
  taste_measurement = excluded.taste_measurement,
  feedback_count = excluded.feedback_count,
  review_count = excluded.review_count,
  average_rating = excluded.average_rating,
  is_seed = excluded.is_seed,
  seed_source = excluded.seed_source,
  updated_at = now();

with seed_reviews (
  review_key,
  reviewer_user_key,
  restaurant_id,
  restaurant_name,
  dish_id,
  dish_title,
  rating,
  review_text,
  taste_tags,
  experience_tags,
  created_at
) as (
  values
    (
      'taste-dev-review-mina-jungsik-fish',
      'taste-dev-mina',
      'jungsik-seoul',
      '정식당',
      'jungsik-seasonal-fish',
      '제철 생선과 맑은 소스',
      5,
      '해산물의 감칠맛이 선명한데 끝이 무겁지 않았고, 산뜻한 산미가 여운을 길게 정리해줬어요.',
      array['seafood', 'crisp']::text[],
      array['fresh', 'delicate']::text[],
      now() - interval '9 days'
    ),
    (
      'taste-dev-review-mina-layeon-vegetable',
      'taste-dev-mina',
      'layeon-seoul',
      '라연',
      'layeon-pine-nut-vegetable',
      '잣즙 소스와 제철 채소',
      5,
      '고소함은 부드럽게 깔리고 채소의 맑은 향이 먼저 올라와서 코스 중간의 호흡이 좋아졌어요.',
      array['fresh', 'gentle']::text[],
      array['delicate', 'savory']::text[],
      now() - interval '15 days'
    ),
    (
      'taste-dev-review-joon-mingles-beef',
      'taste-dev-joon',
      'mingles-seoul',
      '밍글스',
      'mingles-hanwoo-jang',
      '한우와 깊은 장 소스',
      5,
      '감칠맛과 지방감이 겹치지만 무겁게 닫히지 않고, 장의 깊은 여운이 편안하게 남았습니다.',
      array['savory', 'fermented']::text[],
      array['deep', 'rich']::text[],
      now() - interval '22 days'
    ),
    (
      'taste-dev-review-joon-mosu-broth',
      'taste-dev-joon',
      'mosu-seoul',
      '모수',
      'mosu-buckwheat-broth',
      '메밀과 맑은 육수',
      4,
      '육수의 감칠맛이 맑게 이어지고 메밀의 구수함이 뒤에서 받쳐줘서 여운이 차분했어요.',
      array['savory', 'gentle']::text[],
      array['deep', 'delicate']::text[],
      now() - interval '31 days'
    ),
    (
      'taste-dev-review-harin-lysee-dessert',
      'taste-dev-harin',
      'lysee-seoul',
      '숍 리제',
      'lysee-strawberry-herb-dessert',
      '딸기와 허브 디저트',
      4,
      '단맛이 먼저 오지만 허브의 산뜻함이 끝을 잡아줘서 디저트가 과하게 남지 않았어요.',
      array['sweet', 'crisp']::text[],
      array['fresh', 'dessert']::text[],
      now() - interval '28 days'
    ),
    (
      'taste-dev-review-harin-onjium-spring-herb',
      'taste-dev-harin',
      'onjium-seoul',
      '온지음',
      'onjium-spring-herb-broth',
      '봄나물과 맑은 국물',
      5,
      '나물 향과 맑은 국물의 단맛이 조용히 이어져서 계절감이 가장 또렷하게 남았어요.',
      array['fresh', 'sweet']::text[],
      array['gentle', 'delicate']::text[],
      now() - interval '35 days'
    ),
    (
      'taste-dev-review-seoyoon-evett-citrus-seafood',
      'taste-dev-seoyoon',
      'evett-seoul',
      '에빗',
      'evett-citrus-seafood',
      '감귤 향의 해산물',
      5,
      '산미가 선명하지만 날카롭지 않고, 해산물의 감칠맛을 더 투명하게 열어주는 느낌이었어요.',
      array['seafood', 'crisp']::text[],
      array['fresh', 'delicate']::text[],
      now() - interval '6 days'
    ),
    (
      'taste-dev-review-seoyoon-allaprima-capellini',
      'taste-dev-seoyoon',
      'allaprima-seoul',
      '알라프리마',
      'allaprima-cold-capellini',
      '차가운 카펠리니와 허브 오일',
      4,
      '차가운 온도감과 허브 향이 산미를 깨끗하게 보여줘서 첫 입의 인상이 오래 갔어요.',
      array['fresh', 'crisp']::text[],
      array['delicate', 'gentle']::text[],
      now() - interval '19 days'
    ),
    (
      'taste-dev-review-doyun-7thdoor-duck',
      'taste-dev-doyun',
      '7th-door-seoul',
      '세븐스도어',
      '7thdoor-charcoal-duck',
      '숯향 오리와 발효 소스',
      5,
      '불향이 앞에 또렷하게 서고 발효 소스의 감칠맛이 뒤를 채워서 깊이가 좋았습니다.',
      array['grilled', 'fermented']::text[],
      array['smoky', 'rich']::text[],
      now() - interval '11 days'
    ),
    (
      'taste-dev-review-doyun-sosuheon-fish',
      'taste-dev-doyun',
      'sosuheon-seoul',
      '소수헌',
      'sosuheon-grilled-fish',
      '숯불 생선구이와 맑은 장',
      4,
      '구운 향이 선명하지만 소스가 맑아서 지방감이 과하게 쌓이지 않았어요.',
      array['grilled', 'seafood']::text[],
      array['smoky', 'delicate']::text[],
      now() - interval '26 days'
    ),
    (
      'taste-dev-review-jiwoo-lysee-pistachio',
      'taste-dev-jiwoo',
      'lysee-seoul',
      '숍 리제',
      'lysee-pistachio-tart',
      '피스타치오 타르트',
      5,
      '견과의 지방감이 풍성하지만 단맛이 정돈되어 있어서 끝맛이 깨끗했습니다.',
      array['sweet', 'rich']::text[],
      array['dessert', 'gentle']::text[],
      now() - interval '13 days'
    ),
    (
      'taste-dev-review-jiwoo-layeon-omija',
      'taste-dev-jiwoo',
      'layeon-seoul',
      '라연',
      'layeon-omija-dessert',
      '오미자와 배 디저트',
      4,
      '오미자의 산미가 단맛을 가볍게 들어 올려서 코스 마지막이 산뜻하게 닫혔어요.',
      array['sweet', 'crisp']::text[],
      array['dessert', 'fresh']::text[],
      now() - interval '24 days'
    ),
    (
      'taste-dev-review-yerin-jungsik-white-kimchi',
      'taste-dev-yerin',
      'jungsik-seoul',
      '정식당',
      'jungsik-white-kimchi-broth',
      '백김치 국물과 생선',
      5,
      '짧은 산미와 맑은 감칠맛이 섬세하게 이어져서 자극보다 균형이 먼저 느껴졌어요.',
      array['seafood', 'delicate']::text[],
      array['fresh', 'gentle']::text[],
      now() - interval '17 days'
    ),
    (
      'taste-dev-review-yerin-onjium-steamed-fish',
      'taste-dev-yerin',
      'onjium-seoul',
      '온지음',
      'onjium-steamed-fish',
      '찐 생선과 들기름 향',
      4,
      '들기름 향은 은은하고 생선의 감칠맛이 맑게 남아서 부담 없는 여운이 좋았어요.',
      array['seafood', 'gentle']::text[],
      array['delicate', 'savory']::text[],
      now() - interval '33 days'
    ),
    (
      'taste-dev-review-taeo-kwonsooksoo-jang-beef',
      'taste-dev-taeo',
      'kwonsooksoo-seoul',
      '권숙수',
      'kwonsooksoo-jang-beef',
      '장 소스와 한우',
      5,
      '짭조름한 장맛이 감칠맛을 길게 끌고 가고, 지방감은 뒤에서 부드럽게 받쳐줬어요.',
      array['fermented', 'savory']::text[],
      array['deep', 'rich']::text[],
      now() - interval '8 days'
    ),
    (
      'taste-dev-review-taeo-mingles-lamb',
      'taste-dev-taeo',
      'mingles-seoul',
      '밍글스',
      'mingles-doenjang-lamb',
      '된장 크러스트 양갈비',
      4,
      '된장의 구수한 감칠맛과 구운 향이 같이 올라와서 마지막까지 농도가 유지됐습니다.',
      array['fermented', 'grilled']::text[],
      array['deep', 'smoky']::text[],
      now() - interval '21 days'
    )
)
insert into public.taste_dining_reviews (
  review_key,
  reviewer_profile_id,
  restaurant_id,
  restaurant_name,
  dish_id,
  dish_title,
  rating,
  review_text,
  taste_tags,
  experience_tags,
  visibility,
  is_seed,
  seed_source,
  created_at
)
select
  seed_reviews.review_key,
  profiles.id,
  seed_reviews.restaurant_id,
  seed_reviews.restaurant_name,
  seed_reviews.dish_id,
  seed_reviews.dish_title,
  seed_reviews.rating,
  seed_reviews.review_text,
  seed_reviews.taste_tags,
  seed_reviews.experience_tags,
  'public',
  true,
  'taste-buddy-agent-social-dev-rich',
  seed_reviews.created_at
from seed_reviews
join public.taste_social_profiles profiles
  on profiles.user_key = seed_reviews.reviewer_user_key
on conflict (review_key) do update
set
  reviewer_profile_id = excluded.reviewer_profile_id,
  restaurant_id = excluded.restaurant_id,
  restaurant_name = excluded.restaurant_name,
  dish_id = excluded.dish_id,
  dish_title = excluded.dish_title,
  rating = excluded.rating,
  review_text = excluded.review_text,
  taste_tags = excluded.taste_tags,
  experience_tags = excluded.experience_tags,
  visibility = excluded.visibility,
  is_seed = excluded.is_seed,
  seed_source = excluded.seed_source,
  updated_at = now();
