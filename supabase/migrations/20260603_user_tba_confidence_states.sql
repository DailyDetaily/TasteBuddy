create table if not exists public.user_tba_confidence_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  signal_type text not null check (
    signal_type in ('tba-signal', 'lexicon', 'dish-kind', 'foodon')
  ),
  signal_id text not null,
  label text,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  support_count integer not null default 0 check (support_count >= 0),
  adjust_count integer not null default 0 check (adjust_count >= 0),
  remove_count integer not null default 0 check (remove_count >= 0),
  last_evidence_at timestamptz,
  last_event_id uuid references public.tba_feedback_evidence_events (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, signal_type, signal_id)
);

create index if not exists user_tba_confidence_states_user_confidence_idx
  on public.user_tba_confidence_states (user_id, confidence desc);

create index if not exists user_tba_confidence_states_signal_idx
  on public.user_tba_confidence_states (signal_type, signal_id);

drop trigger if exists user_tba_confidence_states_updated_at
  on public.user_tba_confidence_states;
create trigger user_tba_confidence_states_updated_at
before update on public.user_tba_confidence_states
for each row execute procedure public.set_updated_at();

alter table public.user_tba_confidence_states enable row level security;

drop policy if exists "user_tba_confidence_states_select_own"
  on public.user_tba_confidence_states;
create policy "user_tba_confidence_states_select_own"
on public.user_tba_confidence_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_tba_confidence_states_insert_own"
  on public.user_tba_confidence_states;
create policy "user_tba_confidence_states_insert_own"
on public.user_tba_confidence_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_tba_confidence_states_update_own"
  on public.user_tba_confidence_states;
create policy "user_tba_confidence_states_update_own"
on public.user_tba_confidence_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
