-- Provider data is maintained by the service-role sync job, never by app users.
drop policy if exists "restaurant_place_index_insert_authenticated" on public.restaurant_place_index;
drop policy if exists "restaurant_place_index_update_authenticated" on public.restaurant_place_index;
drop policy if exists "restaurant_operating_hours_insert_authenticated" on public.restaurant_operating_hours;
drop policy if exists "restaurant_operating_hours_update_authenticated" on public.restaurant_operating_hours;
revoke insert, update, delete on public.restaurant_place_index, public.restaurant_operating_hours from anon, authenticated;

-- The AFTER INSERT trigger is the single notification writer, including direct inserts.
-- Ensure it exists even when migration history and the live schema have drifted.
-- This installs the future-event writer only; it does not backfill old follows.
create or replace function public.notify_profile_follower_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_avatar_path text;
  requester_display_name text;
  requester_label text;
begin
  select
    coalesce(
      p.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ),
    nullif(p.display_name, ''),
    coalesce(nullif(p.nickname, ''), nullif(p.display_name, ''), '새 다이닝 친구')
  into requester_avatar_path, requester_display_name, requester_label
  from public.profiles p
  left join auth.users users on users.id = p.id
  where p.id = new.requester_id;

  insert into public.notifications (user_id, type, title, body, payload)
  values (
    new.addressee_id,
    'follower_added'::public.notification_type,
    '새 팔로워',
    requester_label || '님이 회원님을 팔로우하기 시작했습니다.',
    jsonb_build_object(
      'follower_avatar_path', requester_avatar_path,
      'follower_display_name', requester_display_name,
      'follower_id', new.requester_id,
      'follower_nickname', requester_label
    )
  );
  return new;
end;
$$;
revoke all on function public.notify_profile_follower_added() from public, anon, authenticated;
drop trigger if exists profile_friendships_notify_follower_added on public.profile_friendships;
create trigger profile_friendships_notify_follower_added
after insert on public.profile_friendships
for each row execute function public.notify_profile_follower_added();

create or replace function public.add_friend_by_nickname(target_nickname text)
returns table (ok boolean, message text)
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

  select p.id into target_profile_id
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

-- Only collapse copies from the same transaction, preserving later re-follow events.
with duplicate_notifications as (
  select id, row_number() over (
    partition by user_id, payload ->> 'follower_id', created_at
    order by read_at desc nulls last, id
  ) as duplicate_rank
  from public.notifications
  where type = 'follower_added' and payload ->> 'follower_id' is not null
)
delete from public.notifications n
using duplicate_notifications d
where n.id = d.id and d.duplicate_rank > 1;

-- Keep the existing email API while tying ownership to the actual account.
-- The FK also serializes writes with Auth deletion and rejects stale JWT writes.
alter table public.restaurant_bookmark_lists
  add column owner_user_id uuid references auth.users (id) on delete cascade;
alter table public.restaurant_bookmarks
  add column owner_user_id uuid references auth.users (id) on delete cascade;
update public.restaurant_bookmark_lists b set owner_user_id = u.id
from auth.users u where b.owner_email = lower(u.email);
update public.restaurant_bookmarks b set owner_user_id = u.id
from auth.users u where b.owner_email = lower(u.email);
-- An unmatched email may belong to a deleted account or an account whose email
-- changed. Preserve it for operator reconciliation without exposing it to a
-- future account that signs up with that email or blocking that account's inserts.
create table public.account_legacy_bookmarks (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('restaurant_bookmarks', 'restaurant_bookmark_lists')),
  owner_email text not null,
  row_snapshot jsonb not null,
  archived_at timestamptz not null default now()
);
alter table public.account_legacy_bookmarks enable row level security;
revoke all on public.account_legacy_bookmarks from public, anon, authenticated;
grant all on public.account_legacy_bookmarks to service_role;
insert into public.account_legacy_bookmarks (source_table, owner_email, row_snapshot)
select 'restaurant_bookmarks', b.owner_email, to_jsonb(b)
from public.restaurant_bookmarks b where b.owner_user_id is null;
insert into public.account_legacy_bookmarks (source_table, owner_email, row_snapshot)
select 'restaurant_bookmark_lists', b.owner_email, to_jsonb(b)
from public.restaurant_bookmark_lists b where b.owner_user_id is null;
delete from public.restaurant_bookmarks where owner_user_id is null;
delete from public.restaurant_bookmark_lists where owner_user_id is null;
alter table public.restaurant_bookmark_lists alter column owner_user_id set not null;
alter table public.restaurant_bookmarks alter column owner_user_id set not null;
alter table public.restaurant_bookmark_lists alter column owner_user_id set default auth.uid();
alter table public.restaurant_bookmarks alter column owner_user_id set default auth.uid();
create index restaurant_bookmark_lists_owner_user_idx on public.restaurant_bookmark_lists (owner_user_id);
create index restaurant_bookmarks_owner_user_idx on public.restaurant_bookmarks (owner_user_id);
do $$
declare
  table_name text;
  operation text;
begin
  foreach table_name in array array['restaurant_bookmark_lists', 'restaurant_bookmarks'] loop
    foreach operation in array array['select', 'insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', table_name || '_' || operation || '_own_email', table_name);
    end loop;
    execute format(
      'create policy owner_account on public.%I for all to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid() and owner_email = lower(coalesce(auth.jwt() ->> ''email'', '''')))',
      table_name
    );
  end loop;
end;
$$;

-- Internal state prevents new uploads while deletion is retrying. Expiring leases
-- let already-started uploads finish without trapping a user after a worker crash.
create table public.account_deletion_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now()
);
create table public.account_media_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '2 minutes'
);
create index account_media_uploads_user_expires_idx
  on public.account_media_uploads (user_id, expires_at);
alter table public.account_deletion_requests enable row level security;
alter table public.account_media_uploads enable row level security;
revoke all on public.account_deletion_requests, public.account_media_uploads from anon, authenticated;

create function public.begin_account_media_upload()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  upload_id uuid;
begin
  perform 1 from public.profiles where id = caller_id for update;
  if not found then
    raise exception 'Authenticated profile required';
  end if;
  if exists (select 1 from public.account_deletion_requests where user_id = caller_id) then
    raise exception 'Account deletion is pending';
  end if;
  delete from public.account_media_uploads where user_id = caller_id and expires_at <= now();
  insert into public.account_media_uploads (user_id) values (caller_id) returning id into upload_id;
  return upload_id;
end;
$$;

create function public.finish_account_media_upload(upload_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.account_media_uploads where id = upload_id and user_id = auth.uid();
$$;

create function public.prepare_account_deletion(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_uploads integer;
begin
  perform 1 from public.profiles where id = target_user_id for update;
  if not found then
    raise exception 'Account profile not found';
  end if;
  insert into public.account_deletion_requests (user_id) values (target_user_id) on conflict do nothing;
  delete from public.account_media_uploads where user_id = target_user_id and expires_at <= now();
  select count(*)::integer into active_uploads from public.account_media_uploads where user_id = target_user_id;
  return active_uploads;
end;
$$;

revoke all on function public.begin_account_media_upload() from public, anon;
revoke all on function public.finish_account_media_upload(uuid) from public, anon;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.begin_account_media_upload() to authenticated;
grant execute on function public.finish_account_media_upload(uuid) to authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

-- Keep explicit email cleanup for old callers, inside the Auth transaction.
-- The owner FK covers lists saved before an account email change as well.
create function public.cleanup_deleted_account_bookmarks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.restaurant_bookmarks where owner_email = lower(old.email);
  delete from public.restaurant_bookmark_lists where owner_email = lower(old.email);
  return old;
end;
$$;
revoke all on function public.cleanup_deleted_account_bookmarks() from public, anon, authenticated;
create trigger cleanup_account_bookmarks_before_auth_delete
before delete on auth.users
for each row execute function public.cleanup_deleted_account_bookmarks();

notify pgrst, 'reload schema';
