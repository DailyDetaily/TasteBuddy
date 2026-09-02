alter table public.feedback_items
  add column if not exists selected_experience_ids jsonb not null default '[]'::jsonb,
  add column if not exists selected_detail_tag_ids jsonb not null default '[]'::jsonb,
  add column if not exists selected_dish_kind_ids jsonb not null default '[]'::jsonb,
  add column if not exists custom_dish_kind_labels text[] not null default '{}',
  add column if not exists custom_detail_tags jsonb not null default '{}'::jsonb,
  add column if not exists reflection_note text,
  add column if not exists reflection_photo_name text,
  add column if not exists reflection_photo_preview_url text;
