-- A completed initial submission is an acknowledgement, not a new learning event.
alter table public.feedback_submissions
  add column if not exists client_submission_completed_at timestamptz;
update public.feedback_submissions
set client_submission_completed_at = submitted_at
where client_submission_completed_at is null;

-- Rebuild from the current dishes in a deterministic order. Replays replace evidence;
-- edits replace its contribution and deleting a dish removes its contribution.
create or replace function public.recompute_feedback_learning_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  submission record;
  observation record;
  vector_name text;
  axis_name text;
  axis_names text[];
  vector_names text[] := array['perception_taste_delta', 'perception_perceptual_delta',
    'preference_taste_delta', 'preference_perceptual_delta'];
  calibration jsonb := '{}'::jsonb;
  sums jsonb;
  vector jsonb;
  weight numeric;
  weight_sum numeric;
  evidence_count integer;
  signal_confidence numeric := 0;
  latest_confidence numeric := 0;
  rate numeric;
  axis_value numeric;
  support_count integer := 0;
  hypothesis_count integer := 0;
begin
  if target_user_id is null or not exists (select 1 from public.profiles where id = target_user_id) then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 60903));

  foreach vector_name in array vector_names loop
    axis_names := case when vector_name like '%perceptual%' then
      array['brightness','heaviness','cleanFinish','linger','smoke','aromaIntensity','textureRichness','thermalImpact']
      else array['sweet','sour','salty','bitter','umami','fat'] end;
    vector := '{}'::jsonb;
    foreach axis_name in array axis_names loop
      vector := vector || jsonb_build_object(axis_name, 0);
    end loop;
    calibration := calibration || jsonb_build_object(vector_name, vector);
  end loop;

  for submission in
    select s.id, s.submitted_at, r.reservation_at
    from public.feedback_submissions s
    join public.reservations r on r.id = s.reservation_id
    where s.user_id = target_user_id
    order by s.submitted_at, s.id
  loop
    sums := '{}'::jsonb;
    weight_sum := 0;
    evidence_count := 0;
    for observation in
      select p.*, i.rating
      from public.feedback_items i
      join public.reservation_dishes d on d.id = i.reservation_dish_id
      join public.feedback_parses p on p.feedback_item_id = i.id
      where i.feedback_submission_id = submission.id
        and (jsonb_array_length(i.selected_tag_ids) > 0
          or jsonb_array_length(i.selected_experience_ids) > 0
          or jsonb_array_length(i.selected_detail_tag_ids) > 0
          or exists (select 1 from jsonb_each(i.custom_detail_tags) tags,
            lateral jsonb_array_elements_text(tags.value) label where btrim(label) <> '')
          or nullif(btrim(i.reflection_note), '') is not null
          or nullif(i.reflection_photo_name, '') is not null
          or nullif(i.reflection_photo_preview_url, '') is not null)
      order by d.sort_order, i.id
    loop
      -- Match computeReservationLearningSignal: rating weight, 45-day half life,
      -- source confidence=1, and the persisted parser confidence. Anchor recency
      -- to first submission time so an unchanged retry tomorrow is still a no-op.
      weight := round(0.2 + ((6 - observation.rating)::numeric / 5) * 0.8, 3)
        * round(power(0.5::numeric, greatest(0,
          floor(extract(epoch from (submission.submitted_at - submission.reservation_at)) / 86400)) / 45), 4)
        * observation.confidence;
      weight_sum := weight_sum + weight;
      evidence_count := evidence_count + 1;
      foreach vector_name in array vector_names loop
        axis_names := case when vector_name like '%perceptual%' then
          array['brightness','heaviness','cleanFinish','linger','smoke','aromaIntensity','textureRichness','thermalImpact']
          else array['sweet','sour','salty','bitter','umami','fat'] end;
        vector := coalesce(sums -> vector_name, '{}'::jsonb);
        foreach axis_name in array axis_names loop
          axis_value := round(coalesce((vector ->> axis_name)::numeric, 0) +
            coalesce((to_jsonb(observation) -> vector_name ->> axis_name)::numeric, 0) * weight, 4);
          vector := vector || jsonb_build_object(axis_name, axis_value);
        end loop;
        sums := sums || jsonb_build_object(vector_name, vector);
      end loop;
    end loop;

    if evidence_count = 0 then continue; end if;
    signal_confidence := round(weight_sum / evidence_count, 3);
    latest_confidence := signal_confidence;
    rate := 0.18 * signal_confidence * case when signal_confidence >= 0.35 then 1 else 0.5 end;
    if signal_confidence >= 0.35 then
      support_count := support_count + evidence_count;
    else
      hypothesis_count := hypothesis_count + evidence_count;
    end if;

    foreach vector_name in array vector_names loop
      vector := calibration -> vector_name;
      for axis_name in select jsonb_object_keys(vector) loop
        axis_value := greatest(-1, least(1, round(
          coalesce((sums -> vector_name ->> axis_name)::numeric, 0)
            / case when weight_sum > 0 then weight_sum else 1 end, 4)));
        axis_value := greatest(-1, least(1, round(
          (vector ->> axis_name)::numeric * (1 - rate) + axis_value * rate, 4)));
        vector := vector || jsonb_build_object(axis_name, axis_value);
      end loop;
      calibration := calibration || jsonb_build_object(vector_name, vector);
    end loop;
  end loop;

  insert into public.user_learned_deltas (user_id, perception_taste_delta,
    perception_perceptual_delta, preference_taste_delta, preference_perceptual_delta,
    support_count, hypothesis_count, confidence)
  values (target_user_id, calibration -> 'perception_taste_delta',
    calibration -> 'perception_perceptual_delta', calibration -> 'preference_taste_delta',
    calibration -> 'preference_perceptual_delta', support_count, hypothesis_count, latest_confidence)
  on conflict (user_id) do update set
    perception_taste_delta = excluded.perception_taste_delta,
    perception_perceptual_delta = excluded.perception_perceptual_delta,
    preference_taste_delta = excluded.preference_taste_delta,
    preference_perceptual_delta = excluded.preference_perceptual_delta,
    support_count = excluded.support_count,
    hypothesis_count = excluded.hypothesis_count,
    confidence = excluded.confidence;
end;
$$;

create or replace function public.sync_feedback_learning()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_user_id uuid;
  source_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  if tg_table_name = 'feedback_items' then
    select user_id into target_user_id from public.feedback_submissions
    where id = (source_row ->> 'feedback_submission_id')::uuid;
  else
    select s.user_id into target_user_id from public.feedback_items i
    join public.feedback_submissions s on s.id = i.feedback_submission_id
    where i.id = (source_row ->> 'feedback_item_id')::uuid;
  end if;
  if target_user_id is not null then
    -- Acquire before the write; the AFTER query then sees preceding committed
    -- writes even when two different visits are saved concurrently.
    perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 60903));
    if tg_when = 'AFTER' then
      perform public.recompute_feedback_learning_for_user(target_user_id);
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger feedback_items_learning_lock before insert or update or delete on public.feedback_items
for each row execute function public.sync_feedback_learning();
create trigger feedback_items_learning_refresh after insert or update or delete on public.feedback_items
for each row execute function public.sync_feedback_learning();
create trigger feedback_parses_learning_lock before insert or update or delete on public.feedback_parses
for each row execute function public.sync_feedback_learning();
create trigger feedback_parses_learning_refresh after insert or update or delete on public.feedback_parses
for each row execute function public.sync_feedback_learning();

-- Derived values are writable only by the trigger, including for older clients.
drop policy if exists user_learned_deltas_insert_own on public.user_learned_deltas;
drop policy if exists user_learned_deltas_update_own on public.user_learned_deltas;
revoke all on function public.recompute_feedback_learning_for_user(uuid) from public, anon, authenticated;
revoke all on function public.sync_feedback_learning() from public, anon, authenticated;

do $$
declare target_user_id uuid;
begin
  for target_user_id in select distinct user_id from public.feedback_submissions loop
    perform public.recompute_feedback_learning_for_user(target_user_id);
  end loop;
end;
$$;
