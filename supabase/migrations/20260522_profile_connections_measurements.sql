drop function if exists public.get_profile_connections(text);

create or replace function public.get_profile_connections(connection_kind text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean,
  latest_measurement_results jsonb,
  latest_measurement_measured_at timestamptz,
  latest_measurement_source text
)
language sql
security definer
set search_path = public
as $$
  with connection_profiles as (
    select
      case
        when connection_kind = 'followers' then friendship.requester_id
        else friendship.addressee_id
      end as profile_id
    from public.profile_friendships friendship
    where
      (connection_kind = 'followers' and friendship.addressee_id = auth.uid())
      or (connection_kind = 'following' and friendship.requester_id = auth.uid())
  )
  select
    profiles.id,
    profiles.display_name,
    profiles.nickname,
    coalesce(
      profiles.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ) as avatar_path,
    exists (
      select 1
      from public.profile_friendships following
      where
        following.requester_id = auth.uid()
        and following.addressee_id = profiles.id
    ) as is_friend,
    latest_measurement.results as latest_measurement_results,
    latest_measurement.measured_at as latest_measurement_measured_at,
    latest_measurement.source as latest_measurement_source
  from connection_profiles
  join public.profiles profiles on profiles.id = connection_profiles.profile_id
  left join auth.users users on users.id = profiles.id
  left join lateral (
    select
      sessions.completed_at as measured_at,
      sessions.source::text as source,
      jsonb_object_agg(results.taste_code, results.value_mm) as results
    from public.measurement_sessions sessions
    join public.measurement_results results
      on results.measurement_session_id = sessions.id
    where
      sessions.user_id = profiles.id
      and sessions.status = 'completed'
    group by sessions.id
    order by sessions.completed_at desc nulls last
    limit 1
  ) latest_measurement on true
  where auth.uid() is not null
  order by profiles.display_name nulls last, profiles.nickname nulls last, profiles.created_at desc;
$$;

notify pgrst, 'reload schema';
