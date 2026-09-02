create table if not exists public.tba_feedback_evidence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete cascade,
  feedback_submission_id uuid references public.feedback_submissions (id) on delete cascade,
  feedback_item_id uuid references public.feedback_items (id) on delete set null,
  reservation_dish_id uuid references public.reservation_dishes (id) on delete set null,
  event_type text not null check (
    event_type in (
      'created',
      'updated',
      'deleted',
      'taste_tags_changed',
      'detail_tags_changed',
      'dish_kind_tags_changed',
      'dining_note_regenerated'
    )
  ),
  evidence_action text not null check (
    evidence_action in ('include', 'adjust', 'remove', 'ignore')
  ),
  previous_snapshot jsonb,
  next_snapshot jsonb,
  previous_tba_signal_ids text[] not null default '{}',
  next_tba_signal_ids text[] not null default '{}',
  previous_tba_confidence numeric,
  next_tba_confidence numeric,
  confidence_delta numeric not null default 0,
  confidence_effect jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tba_feedback_evidence_events_user_created_idx
  on public.tba_feedback_evidence_events (user_id, created_at desc);

create index if not exists tba_feedback_evidence_events_feedback_item_idx
  on public.tba_feedback_evidence_events (feedback_item_id, created_at desc);

create index if not exists tba_feedback_evidence_events_event_type_idx
  on public.tba_feedback_evidence_events (event_type, created_at desc);

create index if not exists tba_feedback_evidence_events_next_signal_ids_idx
  on public.tba_feedback_evidence_events using gin (next_tba_signal_ids);

alter table public.tba_feedback_evidence_events enable row level security;

drop policy if exists "tba_feedback_evidence_events_select_own"
  on public.tba_feedback_evidence_events;
create policy "tba_feedback_evidence_events_select_own"
on public.tba_feedback_evidence_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tba_feedback_evidence_events_insert_own"
  on public.tba_feedback_evidence_events;
create policy "tba_feedback_evidence_events_insert_own"
on public.tba_feedback_evidence_events
for insert
to authenticated
with check (auth.uid() = user_id);
