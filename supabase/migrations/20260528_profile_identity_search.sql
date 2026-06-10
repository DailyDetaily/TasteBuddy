create or replace function public.search_profiles_by_identity(search_query text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean
)
language sql
security definer
set search_path = public
as $$
  with search_term as (
    select lower(btrim(regexp_replace(search_query, '^@+', ''))) as query_key
  ),
  searchable_profiles as (
    select
      p.id,
      coalesce(
        nullif(btrim(p.display_name), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'name'), '')
      ) as display_name,
      p.nickname,
      coalesce(
        p.avatar_path,
        nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
      ) as avatar_path,
      exists (
        select 1
        from public.profile_friendships friendship
        where
          friendship.requester_id = auth.uid()
          and friendship.addressee_id = p.id
      ) as is_friend,
      lower(coalesce(
        nullif(btrim(p.display_name), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
        ''
      )) as display_name_key,
      lower(coalesce(nullif(btrim(p.nickname), ''), '')) as nickname_key,
      p.created_at
    from public.profiles p
    left join auth.users users on users.id = p.id
    where
      auth.uid() is not null
      and p.id <> auth.uid()
      and nullif(btrim(p.nickname), '') is not null
  ),
  ranked_profiles as (
    select
      searchable_profiles.*,
      search_term.query_key,
      searchable_profiles.display_name_key = search_term.query_key as exact_display_name_match,
      searchable_profiles.nickname_key = search_term.query_key as exact_nickname_match,
      searchable_profiles.display_name_key like search_term.query_key || '%' as display_name_prefix_match,
      searchable_profiles.nickname_key like search_term.query_key || '%' as nickname_prefix_match,
      row_number() over (
        order by
          (searchable_profiles.display_name_key = search_term.query_key) desc,
          (searchable_profiles.nickname_key = search_term.query_key) desc,
          (searchable_profiles.display_name_key like search_term.query_key || '%') desc,
          (searchable_profiles.nickname_key like search_term.query_key || '%') desc,
          searchable_profiles.display_name nulls last,
          searchable_profiles.nickname,
          searchable_profiles.created_at desc
      ) as result_rank
    from searchable_profiles
    cross join search_term
    where
      search_term.query_key <> ''
      and (
        searchable_profiles.display_name_key = search_term.query_key
        or searchable_profiles.nickname_key = search_term.query_key
        or searchable_profiles.display_name_key like search_term.query_key || '%'
        or searchable_profiles.nickname_key like search_term.query_key || '%'
        or searchable_profiles.display_name_key like '%' || search_term.query_key || '%'
      )
  )
  select
    ranked_profiles.id,
    ranked_profiles.display_name,
    ranked_profiles.nickname,
    ranked_profiles.avatar_path,
    ranked_profiles.is_friend
  from ranked_profiles
  where ranked_profiles.exact_display_name_match or ranked_profiles.result_rank <= 12
  order by
    ranked_profiles.exact_display_name_match desc,
    ranked_profiles.exact_nickname_match desc,
    ranked_profiles.display_name_prefix_match desc,
    ranked_profiles.nickname_prefix_match desc,
    ranked_profiles.display_name nulls last,
    ranked_profiles.nickname,
    ranked_profiles.created_at desc;
$$;

create or replace function public.search_profiles_by_nickname(search_query text)
returns table (
  id uuid,
  display_name text,
  nickname text,
  avatar_path text,
  is_friend boolean
)
language sql
security definer
set search_path = public
as $$
  select
    identity_results.id,
    identity_results.display_name,
    identity_results.nickname,
    identity_results.avatar_path,
    identity_results.is_friend
  from public.search_profiles_by_identity(search_query) identity_results;
$$;

notify pgrst, 'reload schema';
