create table if not exists public.restaurant_place_index (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete set null,
  provider text not null check (provider in ('kakao', 'naver', 'google', 'osm')),
  provider_place_id text not null,
  normalized_name text not null,
  raw_name text,
  formatted_address text,
  road_address text,
  lat double precision,
  lng double precision,
  phone text,
  category text,
  provider_url text,
  is_primary boolean not null default false,
  source_payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_place_id)
);

create table if not exists public.restaurant_operating_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete set null,
  restaurant_place_index_id uuid references public.restaurant_place_index (id) on delete cascade,
  provider text not null check (provider in ('kakao', 'naver', 'google', 'osm', 'partner')),
  regular_hours_json jsonb not null default '{}'::jsonb,
  regular_hours_text text[] not null default '{}',
  current_open_now boolean,
  timezone text not null default 'Asia/Seoul',
  source_payload jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_place_index_id, provider)
);

create index if not exists restaurant_place_index_restaurant_id_idx
on public.restaurant_place_index (restaurant_id);

create index if not exists restaurant_place_index_provider_name_idx
on public.restaurant_place_index (provider, normalized_name);

create index if not exists restaurant_place_index_coords_idx
on public.restaurant_place_index (lat, lng);

create index if not exists restaurant_operating_hours_restaurant_id_idx
on public.restaurant_operating_hours (restaurant_id);

create trigger on_restaurant_place_index_updated
before update on public.restaurant_place_index
for each row execute procedure public.set_updated_at();

create trigger on_restaurant_operating_hours_updated
before update on public.restaurant_operating_hours
for each row execute procedure public.set_updated_at();

alter table public.restaurant_place_index enable row level security;
alter table public.restaurant_operating_hours enable row level security;

create policy "restaurant_place_index_select_public"
on public.restaurant_place_index
for select
to anon, authenticated
using (true);

create policy "restaurant_operating_hours_select_public"
on public.restaurant_operating_hours
for select
to anon, authenticated
using (true);

create policy "restaurant_place_index_insert_authenticated"
on public.restaurant_place_index
for insert
to authenticated
with check (true);

create policy "restaurant_place_index_update_authenticated"
on public.restaurant_place_index
for update
to authenticated
using (true)
with check (true);

create policy "restaurant_operating_hours_insert_authenticated"
on public.restaurant_operating_hours
for insert
to authenticated
with check (true);

create policy "restaurant_operating_hours_update_authenticated"
on public.restaurant_operating_hours
for update
to authenticated
using (true)
with check (true);
