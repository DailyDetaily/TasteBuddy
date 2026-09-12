-- Native originals are private; clients download with their current app session.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('native-dining-photos', 'native-dining-photos', false, 6291456, array['image/jpeg'])
on conflict (id) do update set
  public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.can_upload_native_dining_photo(object_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or coalesce(auth.jwt() ->> 'client_id', '') <> ''
    or object_name !~ ('^' || caller_id::text || '/[A-Za-z0-9_-]{1,251}[.]jpg$') then
    return false;
  end if;
  -- Serialize admission with prepare_account_deletion. Each upload holds the
  -- existing media lease until Storage acknowledges the completed object.
  perform 1 from public.profiles where id = caller_id for update;
  return found
    and not exists (select 1 from public.account_deletion_requests where user_id = caller_id)
    and exists (select 1 from public.account_media_uploads
      where user_id = caller_id and expires_at > now());
end;
$$;
revoke all on function public.can_upload_native_dining_photo(text) from public, anon;
grant execute on function public.can_upload_native_dining_photo(text) to authenticated;

create function public.can_delete_native_dining_photo(object_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null or coalesce(auth.jwt() ->> 'client_id', '') <> ''
    or object_name !~ ('^' || caller_id::text || '/[A-Za-z0-9_-]{1,251}[.]jpg$') then
    return false;
  end if;
  -- A later device may have restored this filename. Serialize with snapshot
  -- writes, and never remove an original still referenced by the current backup.
  perform 1 from public.profiles where id = caller_id for update;
  return found and not exists (select 1 from public.native_account_data
    where user_id = caller_id
      and coalesce(payload->'photoFilenames' ? split_part(object_name, '/', 2), false));
end;
$$;
revoke all on function public.can_delete_native_dining_photo(text) from public, anon;
grant execute on function public.can_delete_native_dining_photo(text) to authenticated;

create policy native_dining_photo_read on storage.objects
for select to authenticated using (
  bucket_id = 'native-dining-photos'
  and split_part(name, '/', 1) = auth.uid()::text
  and coalesce(auth.jwt() ->> 'client_id', '') = ''
);
create policy native_dining_photo_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'native-dining-photos'
  and public.can_upload_native_dining_photo(name)
);
-- Files are immutable. A replacement has a new filename; remove only after
-- the account snapshot has committed without a revision conflict.
create policy native_dining_photo_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'native-dining-photos'
  and public.can_delete_native_dining_photo(name)
);

notify pgrst, 'reload schema';
