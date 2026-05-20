alter type public.notification_type add value if not exists 'follower_added';

create or replace function public.add_friend_by_nickname(target_nickname text)
returns table (
  ok boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_addressee_id uuid;
  requester_label text;
  target_profile_id uuid;
begin
  if auth.uid() is null then
    return query select false, '로그인 세션을 찾을 수 없습니다.';
    return;
  end if;

  select p.id
  into target_profile_id
  from public.profiles p
  where lower(p.nickname) = lower(btrim(regexp_replace(target_nickname, '^@', '')))
  limit 1;

  if target_profile_id is null then
    return query select false, '해당 닉네임의 사용자를 찾지 못했습니다.';
    return;
  end if;

  if target_profile_id = auth.uid() then
    return query select false, '내 프로필은 친구로 추가할 수 없습니다.';
    return;
  end if;

  insert into public.profile_friendships (requester_id, addressee_id)
  values (auth.uid(), target_profile_id)
  on conflict do nothing
  returning addressee_id into inserted_addressee_id;

  if inserted_addressee_id is not null then
    select coalesce(nullif(p.display_name, ''), nullif(p.nickname, ''), '새 다이닝 친구')
    into requester_label
    from public.profiles p
    where p.id = auth.uid();

    insert into public.notifications (user_id, type, title, body, payload)
    values (
      inserted_addressee_id,
      'follower_added'::public.notification_type,
      '새 팔로워',
      requester_label || '님이 당신의 다이닝 기록을 팔로우하기 시작했습니다.',
      jsonb_build_object('follower_id', auth.uid())
    );
  end if;

  return query select true, '다이닝 친구로 추가되었습니다.';
end;
$$;
