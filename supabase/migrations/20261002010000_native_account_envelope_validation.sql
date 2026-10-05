-- Every native value is Swift Codable Data: an opaque base64 string. Preserve
-- unknown keys and bytes, but do not replace a recoverable backup with an
-- envelope that the native and web readers cannot decode.
create function public.is_valid_native_account_envelope(candidate jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  encoded_value jsonb;
  android_archive jsonb;
begin
  if pg_catalog.jsonb_typeof(candidate) is distinct from 'object'
    or pg_catalog.jsonb_typeof(candidate->'schemaVersion') is distinct from 'number'
    or candidate->>'schemaVersion' not in ('1', '2')
    or pg_catalog.jsonb_typeof(candidate->'hasSeenOnboarding') is distinct from 'boolean'
    or pg_catalog.jsonb_typeof(candidate->'values') is distinct from 'object'
    or pg_catalog.jsonb_typeof(candidate->'photoFilenames') is distinct from 'array' then
    return false;
  end if;

  for encoded_value in select value from pg_catalog.jsonb_each(candidate->'values') loop
    if pg_catalog.jsonb_typeof(encoded_value) is distinct from 'string'
      -- PostgreSQL accepts whitespace in base64; Swift Data's JSON decoder
      -- rejects it, so use the shared alphabet before asking SQL to decode.
      or (encoded_value #>> '{}') ~ '[^A-Za-z0-9+/=]' then
      return false;
    end if;
    begin
      -- Keep unknown decoded bytes opaque. Newer clients may own keys whose
      -- contents this server and older platforms do not understand.
      perform pg_catalog.decode(encoded_value #>> '{}', 'base64');
    exception when invalid_parameter_value then
      return false;
    end;
  end loop;

  -- Older iOS writers retain unknown values but rebuild the top-level photo
  -- manifest from iOS records alone. Refuse that incomplete replacement before
  -- its missing Android references can authorize photo deletion.
  if candidate->'values' ? 'tastebuddy.android.archive.v1' then
    begin
      android_archive := pg_catalog.convert_from(pg_catalog.decode(
        candidate->'values'->>'tastebuddy.android.archive.v1', 'base64'), 'UTF8')::jsonb;
    exception when invalid_parameter_value or invalid_text_representation
      or character_not_in_repertoire or untranslatable_character then
      return false;
    end;
    if pg_catalog.jsonb_typeof(android_archive) is distinct from 'object'
      or pg_catalog.jsonb_typeof(android_archive->'schemaVersion') is distinct from 'number'
      or pg_catalog.jsonb_typeof(android_archive->'state') is distinct from 'object'
      or pg_catalog.jsonb_typeof(android_archive->'photoFilenames') is distinct from 'array' then
      return false;
    end if;
    if (android_archive->>'schemaVersion')::numeric <= 0 then
      return false;
    end if;
    if exists (
      select 1 from pg_catalog.jsonb_array_elements(android_archive->'photoFilenames') as photo(value)
      where pg_catalog.jsonb_typeof(photo.value) is distinct from 'string'
        or (photo.value #>> '{}') !~ '^[A-Za-z0-9_-]{1,251}[.]jpg$'
        or not ((candidate->'photoFilenames') ? (photo.value #>> '{}'))
    ) then
      return false;
    end if;
  end if;
  return true;
end;
$$;

-- Historical malformed rows remain available for explicit recovery. NOT VALID
-- still checks every new insert/update, including save_native_account_data.
alter table public.native_account_data
  add constraint native_account_data_envelope_check
  check (public.is_valid_native_account_envelope(payload)) not valid;

-- An older full-snapshot writer may omit every unknown key. Once Android has
-- created its archive, only an explicit Android update can empty its contents;
-- dropping the extension during another client's save is never a valid erase.
create function public.guard_native_android_archive_retention() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.payload->'values' ? 'tastebuddy.android.archive.v1'
    and not coalesce(new.payload->'values' ? 'tastebuddy.android.archive.v1', false) then
    raise exception 'native Android archive removal refused' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_native_android_archive_retention() from public, anon, authenticated;
create trigger native_android_archive_retention before update on public.native_account_data
  for each row execute function public.guard_native_android_archive_retention();
