create table if not exists public.taste_social_profiles (
  id uuid primary key default gen_random_uuid(),
  user_key text not null unique,
  source_profile_id uuid references public.profiles (id) on delete cascade,
  display_name text not null,
  nickname text not null,
  avatar_path text,
  visibility text not null default 'private' check (visibility in ('private', 'followers', 'public')),
  taste_measurement jsonb not null default '{}'::jsonb,
  feedback_count integer not null default 0 check (feedback_count >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  average_rating numeric(2, 1) check (average_rating is null or average_rating between 1 and 5),
  is_seed boolean not null default false,
  seed_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taste_dining_reviews (
  id uuid primary key default gen_random_uuid(),
  review_key text not null unique,
  reviewer_profile_id uuid not null references public.taste_social_profiles (id) on delete cascade,
  restaurant_id text not null,
  restaurant_name text not null,
  dish_id text,
  dish_title text,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  taste_tags text[] not null default '{}',
  experience_tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private', 'followers', 'public')),
  is_seed boolean not null default false,
  seed_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists taste_social_profiles_visibility_idx
on public.taste_social_profiles (visibility, created_at desc);

create index if not exists taste_dining_reviews_reviewer_profile_id_idx
on public.taste_dining_reviews (reviewer_profile_id, created_at desc);

create index if not exists taste_dining_reviews_visibility_idx
on public.taste_dining_reviews (visibility, created_at desc);

drop trigger if exists on_taste_social_profiles_updated on public.taste_social_profiles;
create trigger on_taste_social_profiles_updated
before update on public.taste_social_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists on_taste_dining_reviews_updated on public.taste_dining_reviews;
create trigger on_taste_dining_reviews_updated
before update on public.taste_dining_reviews
for each row execute procedure public.set_updated_at();

alter table public.taste_social_profiles enable row level security;
alter table public.taste_dining_reviews enable row level security;

drop policy if exists "taste_social_profiles_select_visible" on public.taste_social_profiles;
create policy "taste_social_profiles_select_visible"
on public.taste_social_profiles
for select
to authenticated
using (
  visibility = 'public'
  or source_profile_id = auth.uid()
  or (
    visibility = 'followers'
    and exists (
      select 1
      from public.profile_friendships friendships
      where friendships.requester_id = auth.uid()
        and friendships.addressee_id = taste_social_profiles.source_profile_id
    )
  )
);

drop policy if exists "taste_social_profiles_insert_own" on public.taste_social_profiles;
create policy "taste_social_profiles_insert_own"
on public.taste_social_profiles
for insert
to authenticated
with check (source_profile_id = auth.uid());

drop policy if exists "taste_social_profiles_update_own" on public.taste_social_profiles;
create policy "taste_social_profiles_update_own"
on public.taste_social_profiles
for update
to authenticated
using (source_profile_id = auth.uid())
with check (source_profile_id = auth.uid());

drop policy if exists "taste_dining_reviews_select_public" on public.taste_dining_reviews;
create policy "taste_dining_reviews_select_public"
on public.taste_dining_reviews
for select
to authenticated
using (
  visibility = 'public'
  and exists (
    select 1
    from public.taste_social_profiles profiles
    where profiles.id = taste_dining_reviews.reviewer_profile_id
      and (
        profiles.visibility = 'public'
        or profiles.source_profile_id = auth.uid()
        or (
          profiles.visibility = 'followers'
          and exists (
            select 1
            from public.profile_friendships friendships
            where friendships.requester_id = auth.uid()
              and friendships.addressee_id = profiles.source_profile_id
          )
        )
      )
  )
);

drop policy if exists "taste_dining_reviews_insert_own" on public.taste_dining_reviews;
create policy "taste_dining_reviews_insert_own"
on public.taste_dining_reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from public.taste_social_profiles profiles
    where profiles.id = taste_dining_reviews.reviewer_profile_id
      and profiles.source_profile_id = auth.uid()
  )
);

drop policy if exists "taste_dining_reviews_update_own" on public.taste_dining_reviews;
create policy "taste_dining_reviews_update_own"
on public.taste_dining_reviews
for update
to authenticated
using (
  exists (
    select 1
    from public.taste_social_profiles profiles
    where profiles.id = taste_dining_reviews.reviewer_profile_id
      and profiles.source_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.taste_social_profiles profiles
    where profiles.id = taste_dining_reviews.reviewer_profile_id
      and profiles.source_profile_id = auth.uid()
  )
);

drop policy if exists "taste_dining_reviews_delete_own" on public.taste_dining_reviews;
create policy "taste_dining_reviews_delete_own"
on public.taste_dining_reviews
for delete
to authenticated
using (
  exists (
    select 1
    from public.taste_social_profiles profiles
    where profiles.id = taste_dining_reviews.reviewer_profile_id
      and profiles.source_profile_id = auth.uid()
  )
);

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
values
  (
    'taste-dev-mina',
    'Mina',
    'clearfinish_mina',
    'public',
    '{"sweet": 4.6, "sour": 7.8, "bitter": 4.4, "salty": 4.8, "umami": 7.2, "fat": 5.2}'::jsonb,
    8,
    12,
    4.6,
    true,
    'taste-buddy-agent-social-dev',
    now() - interval '18 days'
  ),
  (
    'taste-dev-joon',
    'Joon',
    'deepfinish_joon',
    'public',
    '{"sweet": 5.4, "sour": 4.2, "bitter": 5.6, "salty": 5.8, "umami": 8.2, "fat": 7.4}'::jsonb,
    6,
    9,
    4.4,
    true,
    'taste-buddy-agent-social-dev',
    now() - interval '22 days'
  ),
  (
    'taste-dev-harin',
    'Harin',
    'seasonal_harin',
    'public',
    '{"sweet": 7.4, "sour": 6.8, "bitter": 5.2, "salty": 4.6, "umami": 5.6, "fat": 4.8}'::jsonb,
    4,
    7,
    4.2,
    true,
    'taste-buddy-agent-social-dev',
    now() - interval '28 days'
  )
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
      '산뜻한 산미와 깔끔한 마무리가 길게 이어져서 다음에도 비슷한 흐름을 찾고 싶었어요.',
      array['seafood', 'crisp']::text[],
      array['fresh', 'delicate']::text[],
      now() - interval '9 days'
    ),
    (
      'taste-dev-review-joon-mingles-beef',
      'taste-dev-joon',
      'mingles-seoul',
      '밍글스',
      'mingles-hanwoo-jang',
      '한우와 깊은 장 소스',
      5,
      '감칠맛과 지방감이 무겁지 않게 겹쳐져서 여운이 편안하게 남았습니다.',
      array['savory', 'fermented']::text[],
      array['deep', 'rich']::text[],
      now() - interval '22 days'
    ),
    (
      'taste-dev-review-harin-lysee-dessert',
      'taste-dev-harin',
      'lysee-seoul',
      '숍 리제',
      'lysee-strawberry-herb-dessert',
      '딸기와 허브 디저트',
      4,
      '단맛이 앞서지만 산뜻한 허브감이 있어 끝맛이 부담스럽지 않았어요.',
      array['sweet', 'crisp']::text[],
      array['fresh', 'dessert']::text[],
      now() - interval '28 days'
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
  'taste-buddy-agent-social-dev',
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
