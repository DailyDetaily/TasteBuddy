drop function if exists public.get_profile_connections(text);

create or replace function public.get_profile_connections(connection_kind text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean,
  follower_count bigint,
  following_count bigint,
  measurement_count bigint,
  feedback_count bigint,
  reservation_count bigint,
  saved_restaurant_count bigint,
  average_rating numeric,
  favorite_chefs jsonb,
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
    (
      select count(*)::bigint
      from public.profile_friendships followers
      where followers.addressee_id = profiles.id
    ) as follower_count,
    (
      select count(*)::bigint
      from public.profile_friendships following
      where following.requester_id = profiles.id
    ) as following_count,
    coalesce(profile_activity.measurement_count, 0::bigint) as measurement_count,
    coalesce(profile_activity.feedback_count, 0::bigint) as feedback_count,
    coalesce(profile_activity.reservation_count, 0::bigint) as reservation_count,
    0::bigint as saved_restaurant_count,
    profile_activity.average_rating,
    coalesce(favorite_chefs.items, '[]'::jsonb) as favorite_chefs,
    latest_measurement.results as latest_measurement_results,
    latest_measurement.measured_at as latest_measurement_measured_at,
    latest_measurement.source as latest_measurement_source
  from connection_profiles
  join public.profiles profiles on profiles.id = connection_profiles.profile_id
  left join auth.users users on users.id = profiles.id
  left join lateral (
    select
      count(distinct sessions.id)::bigint as measurement_count,
      count(distinct submissions.id)::bigint as feedback_count,
      count(distinct reservations.id)::bigint as reservation_count,
      avg(submissions.overall_rating)::numeric as average_rating
    from public.profiles profile_scope
    left join public.measurement_sessions sessions
      on sessions.user_id = profile_scope.id
      and sessions.status = 'completed'
    left join public.feedback_submissions submissions
      on submissions.user_id = profile_scope.id
    left join public.reservations reservations
      on reservations.user_id = profile_scope.id
    where profile_scope.id = profiles.id
  ) profile_activity on true
  left join lateral (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'image', favorite.avatar_path,
            'matchRate', favorite.match_rate,
            'name', favorite.chef_name,
            'restaurant', favorite.restaurant_name,
            'taste', favorite.taste
          )
          order by favorite.match_rate desc nulls last, favorite.reservation_at desc
        ),
        '[]'::jsonb
      ) as items
    from (
      select
        chefs.avatar_path,
        coalesce(chefs.display_name, '셰프 미정') as chef_name,
        coalesce(packets.match_rate, 70)::numeric as match_rate,
        reservations.reservation_at,
        restaurants.name as restaurant_name,
        '감칠맛'::text as taste
      from public.reservations reservations
      join public.restaurants restaurants on restaurants.id = reservations.restaurant_id
      left join public.chefs chefs on chefs.id = reservations.chef_id
      left join public.tcs_guidance_packets packets on packets.reservation_id = reservations.id
      where reservations.user_id = profiles.id
      order by coalesce(packets.match_rate, 70) desc, reservations.reservation_at desc
      limit 3
    ) favorite
  ) favorite_chefs on true
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
