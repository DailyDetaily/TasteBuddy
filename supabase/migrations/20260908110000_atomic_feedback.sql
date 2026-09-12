-- One RPC commits the complete feedback mutation, including the existing learning
-- triggers. A failed parse/evidence write rolls back every dish and completion flag.
create function public.save_dining_feedback_atomic(
  p_reservation_id uuid,
  p_expected_user_id uuid,
  p_expected_updated_at timestamptz,
  p_submission jsonb,
  p_items jsonb,
  p_create_only boolean default false,
  p_clear boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  owner_id uuid := auth.uid();
  submission public.feedback_submissions;
  item jsonb;
  dish public.reservation_dishes;
  feedback public.feedback_items;
  parsed public.feedback_parses;
  evidence public.tba_feedback_evidence_events;
  previous_item_updated_at timestamptz;
begin
  if owner_id is null or owner_id is distinct from p_expected_user_id
    or (auth.jwt()->>'client_id') is not null
    or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'A matching direct app account is required' using errcode = '42501';
  end if;
  -- Use the same user lock as learning triggers, before acquiring row locks.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 60903));
  perform 1 from public.reservations
    where id = p_reservation_id and user_id = owner_id for update;
  if not found then
    raise exception 'Reservation does not belong to the signed-in account' using errcode = '42501';
  end if;

  select * into submission from public.feedback_submissions
    where reservation_id = p_reservation_id and user_id = owner_id for update;
  -- An acknowledgement survives subsequent edits and clears. Never replay it.
  if p_create_only and submission.client_submission_completed_at is not null then
    return jsonb_build_object('persisted', true, 'replayed', true);
  end if;
  if p_clear and submission.id is null then
    return jsonb_build_object('persisted', false);
  end if;
  if submission.updated_at is distinct from p_expected_updated_at then
    raise exception 'Feedback changed. Reload before saving again' using errcode = '40001';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or (p_clear and jsonb_array_length(p_items) <> 1)
    or (not p_clear and (p_submission is null or jsonb_typeof(p_submission) <> 'object')) then
    raise exception 'Invalid feedback payload' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) value
    group by value->'dish'->>'sort_order' having count(*) > 1) then
    raise exception 'Duplicate dish positions' using errcode = '22023';
  end if;

  if not p_clear then
    insert into public.feedback_submissions(reservation_id, user_id, overall_rating, overall_comment, return_intent)
    values (p_reservation_id, owner_id, (p_submission->>'overall_rating')::integer,
      p_submission->>'overall_comment', (p_submission->>'return_intent')::public.feedback_return_intent)
    on conflict (reservation_id) do update set overall_rating = excluded.overall_rating,
      overall_comment = excluded.overall_comment, return_intent = excluded.return_intent
    returning * into submission;
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item->'dish') is distinct from 'object'
      or jsonb_typeof(item->'feedback') is distinct from 'object'
      or jsonb_typeof(item->'parse') is distinct from 'object'
      or not (item ? 'expected_updated_at') then
      raise exception 'Invalid feedback item payload' using errcode = '22023';
    end if;
    dish := jsonb_populate_record(null::public.reservation_dishes, item->'dish');
    if dish.sort_order is null or dish.sort_order < 0 then
      raise exception 'Invalid dish position' using errcode = '22023';
    end if;
    -- Foreign IDs in JSON are never used: all relations come from the owned visit.
    insert into public.reservation_dishes(reservation_id, course_position, title, subtitle, chef_intent,
      ingredients, techniques, flavor_notes, sort_order)
    values (p_reservation_id, dish.course_position, dish.title, dish.subtitle, dish.chef_intent,
      dish.ingredients, dish.techniques, dish.flavor_notes, dish.sort_order)
    on conflict (reservation_id, sort_order) do update set course_position = excluded.course_position,
      title = excluded.title, subtitle = excluded.subtitle, chef_intent = excluded.chef_intent,
      ingredients = excluded.ingredients, techniques = excluded.techniques, flavor_notes = excluded.flavor_notes
    returning * into dish;

    select updated_at into previous_item_updated_at from public.feedback_items
      where feedback_submission_id = submission.id and reservation_dish_id = dish.id for update;
    if previous_item_updated_at is distinct from (item->>'expected_updated_at')::timestamptz then
      raise exception 'Dish feedback changed. Reload before saving again' using errcode = '40001';
    end if;
    feedback := jsonb_populate_record(null::public.feedback_items, item->'feedback');
    insert into public.feedback_items(feedback_submission_id, reservation_dish_id, rating, selected_tag_ids,
      selected_reason, comment, selected_experience_ids, selected_detail_tag_ids, selected_dish_kind_ids,
      custom_dish_kind_labels, custom_detail_tags, reflection_note, reflection_photo_name,
      reflection_photo_preview_url, tba_analysis_snapshot, tba_signal_ids, tba_foodon_match_ids,
      tba_lexicon_candidate_ids, tba_confidence, tba_analysis_version)
    values (submission.id, dish.id, feedback.rating, feedback.selected_tag_ids, feedback.selected_reason,
      feedback.comment, feedback.selected_experience_ids, feedback.selected_detail_tag_ids,
      feedback.selected_dish_kind_ids, feedback.custom_dish_kind_labels, feedback.custom_detail_tags,
      feedback.reflection_note, feedback.reflection_photo_name, feedback.reflection_photo_preview_url,
      feedback.tba_analysis_snapshot, feedback.tba_signal_ids, feedback.tba_foodon_match_ids,
      feedback.tba_lexicon_candidate_ids, feedback.tba_confidence, feedback.tba_analysis_version)
    on conflict (feedback_submission_id, reservation_dish_id) do update set
      rating = excluded.rating, selected_tag_ids = excluded.selected_tag_ids,
      selected_reason = excluded.selected_reason, comment = excluded.comment,
      selected_experience_ids = excluded.selected_experience_ids,
      selected_detail_tag_ids = excluded.selected_detail_tag_ids, selected_dish_kind_ids = excluded.selected_dish_kind_ids,
      custom_dish_kind_labels = excluded.custom_dish_kind_labels, custom_detail_tags = excluded.custom_detail_tags,
      reflection_note = excluded.reflection_note, reflection_photo_name = excluded.reflection_photo_name,
      reflection_photo_preview_url = excluded.reflection_photo_preview_url,
      tba_analysis_snapshot = excluded.tba_analysis_snapshot, tba_signal_ids = excluded.tba_signal_ids,
      tba_foodon_match_ids = excluded.tba_foodon_match_ids, tba_lexicon_candidate_ids = excluded.tba_lexicon_candidate_ids,
      tba_confidence = excluded.tba_confidence, tba_analysis_version = excluded.tba_analysis_version
    returning * into feedback;

    parsed := jsonb_populate_record(null::public.feedback_parses, item->'parse');
    insert into public.feedback_parses(feedback_item_id, perception_taste_delta, perception_perceptual_delta,
      preference_taste_delta, preference_perceptual_delta, confidence, rationale)
    values (feedback.id, parsed.perception_taste_delta, parsed.perception_perceptual_delta,
      parsed.preference_taste_delta, parsed.preference_perceptual_delta, parsed.confidence, parsed.rationale)
    on conflict (feedback_item_id) do update set perception_taste_delta = excluded.perception_taste_delta,
      perception_perceptual_delta = excluded.perception_perceptual_delta,
      preference_taste_delta = excluded.preference_taste_delta,
      preference_perceptual_delta = excluded.preference_perceptual_delta,
      confidence = excluded.confidence, rationale = excluded.rationale;

    if item->'evidence' is not null and item->'evidence' <> 'null'::jsonb then
      evidence := jsonb_populate_record(null::public.tba_feedback_evidence_events, item->'evidence');
      insert into public.tba_feedback_evidence_events(user_id, reservation_id, feedback_submission_id,
        feedback_item_id, reservation_dish_id, event_type, evidence_action, previous_snapshot, next_snapshot,
        previous_tba_signal_ids, next_tba_signal_ids, previous_tba_confidence, next_tba_confidence,
        confidence_delta, confidence_effect, payload)
      values (owner_id, p_reservation_id, submission.id, feedback.id, dish.id, evidence.event_type,
        evidence.evidence_action, evidence.previous_snapshot, evidence.next_snapshot,
        evidence.previous_tba_signal_ids, evidence.next_tba_signal_ids, evidence.previous_tba_confidence,
        evidence.next_tba_confidence, evidence.confidence_delta, evidence.confidence_effect, evidence.payload);
    end if;
  end loop;

  -- Clearing retains the initial acknowledgement, preventing an old create-only retry from restoring it.
  update public.feedback_submissions set client_submission_completed_at = coalesce(client_submission_completed_at, now())
    where id = submission.id;
  return jsonb_build_object('persisted', true, 'replayed', false);
end;
$$;

revoke all on function public.save_dining_feedback_atomic(uuid, uuid, timestamptz, jsonb, jsonb, boolean, boolean)
  from public, anon;
grant execute on function public.save_dining_feedback_atomic(uuid, uuid, timestamptz, jsonb, jsonb, boolean, boolean)
  to authenticated;
