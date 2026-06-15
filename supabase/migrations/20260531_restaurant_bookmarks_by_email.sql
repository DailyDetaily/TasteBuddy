create table if not exists public.restaurant_bookmark_lists (
  owner_email text not null check (owner_email = lower(owner_email)),
  list_id text not null,
  name text not null,
  description text not null,
  is_private boolean not null default false,
  cover_icon_id text,
  cover_taste_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_email, list_id)
);

create table if not exists public.restaurant_bookmarks (
  owner_email text not null check (owner_email = lower(owner_email)),
  restaurant_key text not null,
  list_id text not null,
  restaurant_id text not null,
  restaurant_name text not null,
  chef_name text not null,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_email, restaurant_key)
);

create index if not exists restaurant_bookmark_lists_owner_email_idx
on public.restaurant_bookmark_lists (owner_email);

create index if not exists restaurant_bookmarks_owner_email_saved_at_idx
on public.restaurant_bookmarks (owner_email, saved_at desc);

drop trigger if exists on_restaurant_bookmark_lists_updated on public.restaurant_bookmark_lists;
create trigger on_restaurant_bookmark_lists_updated
before update on public.restaurant_bookmark_lists
for each row execute procedure public.set_updated_at();

drop trigger if exists on_restaurant_bookmarks_updated on public.restaurant_bookmarks;
create trigger on_restaurant_bookmarks_updated
before update on public.restaurant_bookmarks
for each row execute procedure public.set_updated_at();

alter table public.restaurant_bookmark_lists enable row level security;
alter table public.restaurant_bookmarks enable row level security;

drop policy if exists "restaurant_bookmark_lists_select_own_email" on public.restaurant_bookmark_lists;
create policy "restaurant_bookmark_lists_select_own_email"
on public.restaurant_bookmark_lists
for select
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmark_lists_insert_own_email" on public.restaurant_bookmark_lists;
create policy "restaurant_bookmark_lists_insert_own_email"
on public.restaurant_bookmark_lists
for insert
with check (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmark_lists_update_own_email" on public.restaurant_bookmark_lists;
create policy "restaurant_bookmark_lists_update_own_email"
on public.restaurant_bookmark_lists
for update
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')))
with check (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmark_lists_delete_own_email" on public.restaurant_bookmark_lists;
create policy "restaurant_bookmark_lists_delete_own_email"
on public.restaurant_bookmark_lists
for delete
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmarks_select_own_email" on public.restaurant_bookmarks;
create policy "restaurant_bookmarks_select_own_email"
on public.restaurant_bookmarks
for select
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmarks_insert_own_email" on public.restaurant_bookmarks;
create policy "restaurant_bookmarks_insert_own_email"
on public.restaurant_bookmarks
for insert
with check (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmarks_update_own_email" on public.restaurant_bookmarks;
create policy "restaurant_bookmarks_update_own_email"
on public.restaurant_bookmarks
for update
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')))
with check (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "restaurant_bookmarks_delete_own_email" on public.restaurant_bookmarks;
create policy "restaurant_bookmarks_delete_own_email"
on public.restaurant_bookmarks
for delete
using (owner_email = lower(coalesce(auth.jwt() ->> 'email', '')));
