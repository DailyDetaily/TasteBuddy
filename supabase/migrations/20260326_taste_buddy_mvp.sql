create extension if not exists pgcrypto;

create type public.app_role as enum ('guest', 'restaurant_admin', 'chef', 'operator');
create type public.device_status as enum ('disconnected', 'connected', 'low_battery', 'offline');
create type public.measurement_source as enum ('quick_calibration', 'teastick', 'manual');
create type public.measurement_status as enum ('pending', 'in_progress', 'completed', 'failed', 'discarded');
create type public.reservation_status as enum (
  'draft',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);
create type public.guidance_status as enum ('draft', 'published', 'viewed', 'archived');
create type public.notification_type as enum (
  'reservation_confirmed',
  'guidance_ready',
  'measurement_reminder',
  'feedback_request',
  'system'
);
create type public.feedback_return_intent as enum ('yes', 'maybe', 'no');
create type public.source_document_type as enum ('menu', 'interview', 'review', 'article', 'social', 'operator_note');
create type public.course_position as enum (
  'snack',
  'amuse',
  'starter',
  'fish',
  'main',
  'dessert',
  'petit_four',
  'beverage',
  'other'
);
create type public.temperature_band as enum ('cold', 'cool', 'room', 'warm', 'hot', 'mixed', 'unknown');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  avatar_path text,
  timezone text not null default 'Asia/Seoul',
  role public.app_role not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Seoul',
  address text,
  city text,
  intro text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chefs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, display_name)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  serial_number text unique,
  model text not null default 'Teastick Pro',
  firmware_version text,
  battery_level integer check (battery_level between 0 and 100),
  status public.device_status not null default 'disconnected',
  last_connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.measurement_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  source public.measurement_source not null,
  status public.measurement_status not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  confidence_score numeric(4, 3) not null default 0.500 check (confidence_score between 0 and 1),
  answers jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.measurement_results (
  id uuid primary key default gen_random_uuid(),
  measurement_session_id uuid not null references public.measurement_sessions (id) on delete cascade,
  taste_code text not null check (taste_code in ('sweet', 'sour', 'bitter', 'salty', 'umami', 'fat')),
  value_mm numeric(6, 2) not null,
  score numeric(6, 2) not null,
  reference_avg_mm numeric(6, 2) not null,
  delta_mm numeric(6, 2) not null,
  created_at timestamptz not null default now(),
  unique (measurement_session_id, taste_code)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  source_type public.source_document_type not null,
  url text,
  title text not null,
  published_at timestamptz,
  excerpt text,
  raw_text text,
  trust_score numeric(4, 3) not null default 0.500 check (trust_score between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dish_entities (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  season_label text,
  public_title text not null,
  public_subtitle text,
  course_position public.course_position not null default 'other',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dish_observed_facts (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dish_entities (id) on delete cascade,
  source_document_id uuid references public.source_documents (id) on delete set null,
  fact_type text not null,
  value_text text,
  value_json jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3) not null default 0.700 check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.dish_inference_profiles (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dish_entities (id) on delete cascade,
  version integer not null default 1,
  taste_vector jsonb not null,
  perceptual_vector jsonb not null,
  confidence numeric(4, 3) not null default 0.500 check (confidence between 0 and 1),
  rationale text,
  uncertainty_notes jsonb not null default '[]'::jsonb,
  evidence_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dish_id, version)
);

create table public.research_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  label text not null,
  summary text not null,
  trigger_features jsonb not null default '{}'::jsonb,
  effect_taste_delta jsonb not null default '{}'::jsonb,
  effect_perceptual_delta jsonb not null default '{}'::jsonb,
  evidence_strength numeric(4, 3) not null default 0.500 check (evidence_strength between 0 and 1),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  chef_id uuid references public.chefs (id) on delete set null,
  external_ref text unique,
  reservation_at timestamptz not null,
  party_size integer not null check (party_size > 0),
  course_name text,
  status public.reservation_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tcs_guidance_packets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  measurement_session_id uuid references public.measurement_sessions (id) on delete set null,
  status public.guidance_status not null default 'draft',
  match_rate numeric(5, 2) check (match_rate between 0 and 100),
  headline text,
  guest_understanding text,
  recommendation_logic text,
  guidance_payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservation_dishes (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  dish_entity_id uuid references public.dish_entities (id) on delete set null,
  course_position public.course_position not null default 'other',
  title text not null,
  subtitle text,
  chef_intent text,
  ingredients text[] not null default '{}',
  techniques text[] not null default '{}',
  flavor_notes text[] not null default '{}',
  temperature_band public.temperature_band not null default 'unknown',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id, sort_order)
);

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  overall_rating integer not null check (overall_rating between 1 and 5),
  overall_comment text,
  return_intent public.feedback_return_intent not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  feedback_submission_id uuid not null references public.feedback_submissions (id) on delete cascade,
  reservation_dish_id uuid not null references public.reservation_dishes (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  selected_tag_ids jsonb not null default '[]'::jsonb,
  selected_reason text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (feedback_submission_id, reservation_dish_id)
);

create table public.feedback_parses (
  id uuid primary key default gen_random_uuid(),
  feedback_item_id uuid not null unique references public.feedback_items (id) on delete cascade,
  perception_taste_delta jsonb not null default '{}'::jsonb,
  perception_perceptual_delta jsonb not null default '{}'::jsonb,
  preference_taste_delta jsonb not null default '{}'::jsonb,
  preference_perceptual_delta jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3) not null default 0.500 check (confidence between 0 and 1),
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_learned_deltas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  perception_taste_delta jsonb not null default '{}'::jsonb,
  perception_perceptual_delta jsonb not null default '{}'::jsonb,
  preference_taste_delta jsonb not null default '{}'::jsonb,
  preference_perceptual_delta jsonb not null default '{}'::jsonb,
  support_count integer not null default 0,
  hypothesis_count integer not null default 0,
  confidence numeric(4, 3) not null default 0.500 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index measurement_sessions_user_id_idx on public.measurement_sessions (user_id, completed_at desc);
create index measurement_results_measurement_session_id_idx on public.measurement_results (measurement_session_id);
create index dish_entities_restaurant_id_idx on public.dish_entities (restaurant_id);
create index dish_observed_facts_dish_id_idx on public.dish_observed_facts (dish_id);
create index reservations_user_id_idx on public.reservations (user_id, reservation_at desc);
create index reservation_dishes_reservation_id_idx on public.reservation_dishes (reservation_id, sort_order);
create index feedback_submissions_user_id_idx on public.feedback_submissions (user_id, submitted_at desc);
create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

create trigger on_profiles_updated
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger on_restaurants_updated
before update on public.restaurants
for each row execute procedure public.set_updated_at();

create trigger on_chefs_updated
before update on public.chefs
for each row execute procedure public.set_updated_at();

create trigger on_devices_updated
before update on public.devices
for each row execute procedure public.set_updated_at();

create trigger on_measurement_sessions_updated
before update on public.measurement_sessions
for each row execute procedure public.set_updated_at();

create trigger on_source_documents_updated
before update on public.source_documents
for each row execute procedure public.set_updated_at();

create trigger on_dish_entities_updated
before update on public.dish_entities
for each row execute procedure public.set_updated_at();

create trigger on_dish_inference_profiles_updated
before update on public.dish_inference_profiles
for each row execute procedure public.set_updated_at();

create trigger on_research_rules_updated
before update on public.research_rules
for each row execute procedure public.set_updated_at();

create trigger on_reservations_updated
before update on public.reservations
for each row execute procedure public.set_updated_at();

create trigger on_tcs_guidance_packets_updated
before update on public.tcs_guidance_packets
for each row execute procedure public.set_updated_at();

create trigger on_reservation_dishes_updated
before update on public.reservation_dishes
for each row execute procedure public.set_updated_at();

create trigger on_feedback_submissions_updated
before update on public.feedback_submissions
for each row execute procedure public.set_updated_at();

create trigger on_feedback_items_updated
before update on public.feedback_items
for each row execute procedure public.set_updated_at();

create trigger on_feedback_parses_updated
before update on public.feedback_parses
for each row execute procedure public.set_updated_at();

create trigger on_user_learned_deltas_updated
before update on public.user_learned_deltas
for each row execute procedure public.set_updated_at();

create trigger on_notifications_updated
before update on public.notifications
for each row execute procedure public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.chefs enable row level security;
alter table public.devices enable row level security;
alter table public.measurement_sessions enable row level security;
alter table public.measurement_results enable row level security;
alter table public.source_documents enable row level security;
alter table public.dish_entities enable row level security;
alter table public.dish_observed_facts enable row level security;
alter table public.dish_inference_profiles enable row level security;
alter table public.research_rules enable row level security;
alter table public.reservations enable row level security;
alter table public.tcs_guidance_packets enable row level security;
alter table public.reservation_dishes enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.feedback_items enable row level security;
alter table public.feedback_parses enable row level security;
alter table public.user_learned_deltas enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "restaurants_select_authenticated"
on public.restaurants
for select
to authenticated
using (true);

create policy "restaurants_insert_authenticated"
on public.restaurants
for insert
to authenticated
with check (true);

create policy "chefs_select_authenticated"
on public.chefs
for select
to authenticated
using (true);

create policy "chefs_insert_authenticated"
on public.chefs
for insert
to authenticated
with check (true);

create policy "devices_select_own"
on public.devices
for select
to authenticated
using (auth.uid() = user_id);

create policy "devices_insert_own"
on public.devices
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "devices_update_own"
on public.devices
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "measurement_sessions_select_own"
on public.measurement_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "measurement_sessions_insert_own"
on public.measurement_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "measurement_sessions_update_own"
on public.measurement_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "measurement_results_select_own"
on public.measurement_results
for select
to authenticated
using (
  exists (
    select 1
    from public.measurement_sessions sessions
    where sessions.id = measurement_results.measurement_session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "measurement_results_insert_own"
on public.measurement_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.measurement_sessions sessions
    where sessions.id = measurement_results.measurement_session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "source_documents_select_authenticated"
on public.source_documents
for select
to authenticated
using (true);

create policy "dish_entities_select_authenticated"
on public.dish_entities
for select
to authenticated
using (true);

create policy "dish_observed_facts_select_authenticated"
on public.dish_observed_facts
for select
to authenticated
using (true);

create policy "dish_inference_profiles_select_authenticated"
on public.dish_inference_profiles
for select
to authenticated
using (true);

create policy "research_rules_select_authenticated"
on public.research_rules
for select
to authenticated
using (true);

create policy "reservations_select_own"
on public.reservations
for select
to authenticated
using (auth.uid() = user_id);

create policy "reservations_insert_own"
on public.reservations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "reservations_update_own"
on public.reservations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tcs_guidance_packets_select_own"
on public.tcs_guidance_packets
for select
to authenticated
using (
  exists (
    select 1
    from public.reservations reservations
    where reservations.id = tcs_guidance_packets.reservation_id
      and reservations.user_id = auth.uid()
  )
);

create policy "reservation_dishes_select_own"
on public.reservation_dishes
for select
to authenticated
using (
  exists (
    select 1
    from public.reservations reservations
    where reservations.id = reservation_dishes.reservation_id
      and reservations.user_id = auth.uid()
  )
);

create policy "reservation_dishes_insert_own"
on public.reservation_dishes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.reservations reservations
    where reservations.id = reservation_dishes.reservation_id
      and reservations.user_id = auth.uid()
  )
);

create policy "reservation_dishes_update_own"
on public.reservation_dishes
for update
to authenticated
using (
  exists (
    select 1
    from public.reservations reservations
    where reservations.id = reservation_dishes.reservation_id
      and reservations.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.reservations reservations
    where reservations.id = reservation_dishes.reservation_id
      and reservations.user_id = auth.uid()
  )
);

create policy "feedback_submissions_select_own"
on public.feedback_submissions
for select
to authenticated
using (auth.uid() = user_id);

create policy "feedback_submissions_insert_own"
on public.feedback_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "feedback_submissions_update_own"
on public.feedback_submissions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "feedback_items_select_own"
on public.feedback_items
for select
to authenticated
using (
  exists (
    select 1
    from public.feedback_submissions submissions
    where submissions.id = feedback_items.feedback_submission_id
      and submissions.user_id = auth.uid()
  )
);

create policy "feedback_items_insert_own"
on public.feedback_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.feedback_submissions submissions
    where submissions.id = feedback_items.feedback_submission_id
      and submissions.user_id = auth.uid()
  )
);

create policy "feedback_items_update_own"
on public.feedback_items
for update
to authenticated
using (
  exists (
    select 1
    from public.feedback_submissions submissions
    where submissions.id = feedback_items.feedback_submission_id
      and submissions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.feedback_submissions submissions
    where submissions.id = feedback_items.feedback_submission_id
      and submissions.user_id = auth.uid()
  )
);

create policy "feedback_parses_select_own"
on public.feedback_parses
for select
to authenticated
using (
  exists (
    select 1
    from public.feedback_items items
    join public.feedback_submissions submissions
      on submissions.id = items.feedback_submission_id
    where items.id = feedback_parses.feedback_item_id
      and submissions.user_id = auth.uid()
  )
);

create policy "feedback_parses_insert_own"
on public.feedback_parses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.feedback_items items
    join public.feedback_submissions submissions
      on submissions.id = items.feedback_submission_id
    where items.id = feedback_parses.feedback_item_id
      and submissions.user_id = auth.uid()
  )
);

create policy "feedback_parses_update_own"
on public.feedback_parses
for update
to authenticated
using (
  exists (
    select 1
    from public.feedback_items items
    join public.feedback_submissions submissions
      on submissions.id = items.feedback_submission_id
    where items.id = feedback_parses.feedback_item_id
      and submissions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.feedback_items items
    join public.feedback_submissions submissions
      on submissions.id = items.feedback_submission_id
    where items.id = feedback_parses.feedback_item_id
      and submissions.user_id = auth.uid()
  )
);

create policy "user_learned_deltas_select_own"
on public.user_learned_deltas
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_learned_deltas_insert_own"
on public.user_learned_deltas
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_learned_deltas_update_own"
on public.user_learned_deltas
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "notifications_insert_own"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
