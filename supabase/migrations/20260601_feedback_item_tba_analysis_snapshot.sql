alter table public.feedback_items
  add column if not exists tba_analysis_snapshot jsonb,
  add column if not exists tba_signal_ids text[] not null default '{}',
  add column if not exists tba_foodon_match_ids text[] not null default '{}',
  add column if not exists tba_lexicon_candidate_ids text[] not null default '{}',
  add column if not exists tba_confidence numeric,
  add column if not exists tba_analysis_version text;
