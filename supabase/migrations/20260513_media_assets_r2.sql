create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'taste-buddy-public-media',
  object_key text not null,
  public_url text,
  asset_type text not null default 'image',
  owner_type text,
  owner_id uuid,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  mime_type text,
  alt_text text,
  source_url text,
  credit text,
  review_status text not null default 'approved',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, object_key)
);

create trigger on_media_assets_updated
before update on public.media_assets
for each row
execute function public.set_updated_at();

alter table public.media_assets enable row level security;

create policy "media_assets_select_public"
on public.media_assets
for select
to anon, authenticated
using (review_status = 'approved');
