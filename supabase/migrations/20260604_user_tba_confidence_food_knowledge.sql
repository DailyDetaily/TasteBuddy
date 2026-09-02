alter table public.user_tba_confidence_states
  drop constraint if exists user_tba_confidence_states_signal_type_check;

alter table public.user_tba_confidence_states
  add constraint user_tba_confidence_states_signal_type_check
  check (signal_type in ('tba-signal', 'lexicon', 'dish-kind', 'foodon', 'food-knowledge'));
