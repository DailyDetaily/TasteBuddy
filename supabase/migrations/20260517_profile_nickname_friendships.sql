alter table public.profiles
add column if not exists nickname text;

with ranked_auth_profiles as (
  select
    users.id,
    nullif(btrim(users.raw_user_meta_data ->> 'nickname'), '') as nickname,
    row_number() over (
      partition by lower(nullif(btrim(users.raw_user_meta_data ->> 'nickname'), ''))
      order by users.created_at asc, users.id asc
    ) as nickname_rank
  from auth.users users
)
update public.profiles profiles
set nickname = ranked_auth_profiles.nickname
from ranked_auth_profiles
where
  profiles.id = ranked_auth_profiles.id
  and profiles.nickname is null
  and ranked_auth_profiles.nickname is not null
  and ranked_auth_profiles.nickname_rank = 1;

update public.profiles profiles
set avatar_path = coalesce(
  nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
  nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
  nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
)
from auth.users users
where
  profiles.id = users.id
  and profiles.avatar_path is null
  and coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
  ) is not null;

create unique index if not exists profiles_nickname_unique_idx
on public.profiles (lower(nickname))
where nickname is not null and btrim(nickname) <> '';

create table if not exists public.profile_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_friendships_not_self check (requester_id <> addressee_id)
);

drop index if exists public.profile_friendships_pair_unique_idx;

create unique index if not exists profile_friendships_direction_unique_idx
on public.profile_friendships (requester_id, addressee_id);

alter table public.profile_friendships enable row level security;

drop policy if exists "profile_friendships_select_own" on public.profile_friendships;
create policy "profile_friendships_select_own"
on public.profile_friendships
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "profile_friendships_insert_own" on public.profile_friendships;
create policy "profile_friendships_insert_own"
on public.profile_friendships
for insert
to authenticated
with check (auth.uid() = requester_id);

drop policy if exists "profile_friendships_delete_own" on public.profile_friendships;
create policy "profile_friendships_delete_own"
on public.profile_friendships
for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

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
    display_name,
    avatar_path,
    nickname
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'picture'), '')
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_path = coalesce(excluded.avatar_path, public.profiles.avatar_path),
    nickname = coalesce(excluded.nickname, public.profiles.nickname);

  return new;
end;
$$;

create or replace function public.search_profiles_by_nickname(search_query text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.nickname,
    coalesce(
      p.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ) as avatar_path,
    exists (
      select 1
      from public.profile_friendships friendship
      where
        friendship.requester_id = auth.uid()
        and friendship.addressee_id = p.id
    ) as is_friend
  from public.profiles p
  left join auth.users users on users.id = p.id
  where
    auth.uid() is not null
    and p.id <> auth.uid()
    and p.nickname is not null
    and btrim(search_query) <> ''
    and lower(p.nickname) like lower(btrim(regexp_replace(search_query, '^@', ''))) || '%'
  order by
    lower(p.nickname) = lower(btrim(regexp_replace(search_query, '^@', ''))) desc,
    p.display_name nulls last,
    p.nickname
  limit 8;
$$;

create or replace function public.add_friend_by_nickname(target_nickname text)
returns table (
  ok boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
begin
  if auth.uid() is null then
    return query select false, '로그인 세션을 찾을 수 없습니다.';
    return;
  end if;

  select p.id
  into target_profile_id
  from public.profiles p
  where lower(p.nickname) = lower(btrim(regexp_replace(target_nickname, '^@', '')))
  limit 1;

  if target_profile_id is null then
    return query select false, '해당 닉네임의 사용자를 찾지 못했습니다.';
    return;
  end if;

  if target_profile_id = auth.uid() then
    return query select false, '내 프로필은 친구로 추가할 수 없습니다.';
    return;
  end if;

  insert into public.profile_friendships (requester_id, addressee_id)
  values (auth.uid(), target_profile_id)
  on conflict do nothing;

  return query select true, '다이닝 친구로 추가되었습니다.';
end;
$$;

drop function if exists public.get_friend_summary();

create or replace function public.get_friend_summary()
returns table (
  follower_count bigint,
  following_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where friendship.addressee_id = auth.uid())::bigint as follower_count,
    count(*) filter (where friendship.requester_id = auth.uid())::bigint as following_count
  from public.profile_friendships friendship
  where friendship.requester_id = auth.uid() or friendship.addressee_id = auth.uid();
$$;

create or replace function public.get_profile_connections(connection_kind text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean
)
language sql
security definer
set search_path = public
as $$
  with connection_profiles as (
    select
      case
        when connection_kind = 'followers' then friendship.requester_id
        else friendship.addressee_id
      end as profile_id
    from public.profile_friendships friendship
    where
      (connection_kind = 'followers' and friendship.addressee_id = auth.uid())
      or (connection_kind = 'following' and friendship.requester_id = auth.uid())
  )
  select
    profiles.id,
    profiles.display_name,
    profiles.nickname,
    coalesce(
      profiles.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ) as avatar_path,
    exists (
      select 1
      from public.profile_friendships following
      where
        following.requester_id = auth.uid()
        and following.addressee_id = profiles.id
    ) as is_friend
  from connection_profiles
  join public.profiles profiles on profiles.id = connection_profiles.profile_id
  left join auth.users users on users.id = profiles.id
  where auth.uid() is not null
  order by profiles.display_name nulls last, profiles.nickname nulls last, profiles.created_at desc;
$$;

notify pgrst, 'reload schema';
