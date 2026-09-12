-- Native source records are private account data, separate from public profiles
-- and optional ChatGPT exports. No migration copies legacy web feedback rows.
create table public.native_account_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and (payload->>'schemaVersion') is not distinct from '1'
    and jsonb_typeof(payload->'values') is not distinct from 'object'
    and jsonb_typeof(payload->'photoFilenames') is not distinct from 'array'
    -- ponytail: 계정 스냅샷은 16MiB까지; 한도에 닿으면 기록 단위 동기화로 전환한다.
    and octet_length(payload::text) <= 16777216
  ),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.native_account_data enable row level security;
revoke all on public.native_account_data from public, anon, authenticated;
grant select on public.native_account_data to authenticated;
grant all on public.native_account_data to service_role;
create policy native_account_data_owner_read on public.native_account_data
  for select to authenticated using (
    auth.uid() = user_id
    and (auth.jwt()->>'client_id') is null
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );

-- A stale device must never overwrite a newer source snapshot. The advisory
-- transaction lock also serializes the first insert, when no row exists yet.
create function public.save_native_account_data(
  p_user_id uuid, p_payload jsonb, p_expected_revision bigint
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare current_revision bigint;
begin
  if auth.uid() is null or auth.uid() <> p_user_id
     or (auth.jwt()->>'client_id') is not null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'native account access denied' using errcode = '42501';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'invalid native account revision' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'native account profile required' using errcode = '42501';
  end if;
  if exists (select 1 from public.account_deletion_requests where user_id = p_user_id) then
    raise exception 'native account deletion in progress' using errcode = '42501';
  end if;
  if jsonb_typeof(p_payload->'photoFilenames') is distinct from 'array' then
    raise exception 'invalid native account photo manifest' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'photoFilenames') as photo(value)
    where jsonb_typeof(photo.value) <> 'string'
      or (photo.value #>> '{}') !~ '^[A-Za-z0-9_-]{1,251}[.]jpg$'
  ) then
    raise exception 'invalid native account photo filename' using errcode = '22023';
  end if;
  -- Serialize with photo DELETE admission on the same profile row. A snapshot
  -- cannot revive a filename whose object was removed by another device.
  if exists (
    select 1 from jsonb_array_elements_text(p_payload->'photoFilenames') as photo(filename)
    where not exists (select 1 from storage.objects as object
      where object.bucket_id = 'native-dining-photos'
        and object.name = p_user_id::text || '/' || photo.filename)
  ) then
    raise exception 'native account photo original missing' using errcode = '23503';
  end if;
  select revision into current_revision from public.native_account_data where user_id = p_user_id;
  if coalesce(current_revision, 0) <> p_expected_revision then
    raise exception 'native account revision conflict' using errcode = '40001';
  end if;
  insert into public.native_account_data(user_id, payload, revision)
    values (p_user_id, p_payload, p_expected_revision + 1)
    on conflict (user_id) do update set payload = excluded.payload,
      revision = excluded.revision, updated_at = now();
  return p_expected_revision + 1;
end;
$$;
revoke all on function public.save_native_account_data(uuid, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.save_native_account_data(uuid, jsonb, bigint) to authenticated;
