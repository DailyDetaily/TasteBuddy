-- New clients read v1 and v2, and write v2. Old clients already reject unknown versions.
-- Do not deploy from an implementation session without explicit authorization.
alter table public.native_account_data drop constraint native_account_data_payload_check;
alter table public.native_account_data add constraint native_account_data_payload_check check (
  jsonb_typeof(payload) = 'object'
  and coalesce(payload->>'schemaVersion' in ('1', '2'), false)
  and jsonb_typeof(payload->'values') is not distinct from 'object'
  and jsonb_typeof(payload->'photoFilenames') is not distinct from 'array'
  and octet_length(payload::text) <= 16777216
);

create function public.guard_native_memory_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.payload->>'schemaVersion' = '2' and new.payload->>'schemaVersion' is distinct from '2' then
    raise exception 'native memory version downgrade refused' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_native_memory_version() from public, anon, authenticated;
create trigger native_memory_version before update on public.native_account_data
  for each row execute function public.guard_native_memory_version();

-- Rollback: ship a compatible reader first. Do not down-convert v2 rows or remove
-- their correction/time keys; preserve the complete source archive for recovery.
