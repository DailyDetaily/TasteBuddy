create or replace function public.notify_profile_follower_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_avatar_path text;
  requester_display_name text;
  requester_label text;
begin
  select
    coalesce(
      p.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ),
    nullif(p.display_name, ''),
    coalesce(nullif(p.nickname, ''), nullif(p.display_name, ''), '새 다이닝 친구')
  into requester_avatar_path, requester_display_name, requester_label
  from public.profiles p
  left join auth.users users on users.id = p.id
  where p.id = new.requester_id;

  insert into public.notifications (user_id, type, title, body, payload)
  values (
    new.addressee_id,
    'follower_added'::public.notification_type,
    '새 팔로워',
    requester_label || '님이 회원님을 팔로우하기 시작했습니다.',
    jsonb_build_object(
      'follower_avatar_path', requester_avatar_path,
      'follower_display_name', requester_display_name,
      'follower_id', new.requester_id,
      'follower_nickname', requester_label
    )
  );

  return new;
end;
$$;

drop trigger if exists profile_friendships_notify_follower_added on public.profile_friendships;

create trigger profile_friendships_notify_follower_added
after insert on public.profile_friendships
for each row
execute function public.notify_profile_follower_added();

insert into public.notifications (user_id, type, title, body, payload, created_at)
select
  friendship.addressee_id,
  'follower_added'::public.notification_type,
  '새 팔로워',
  coalesce(nullif(requester.display_name, ''), nullif(requester.nickname, ''), '새 다이닝 친구')
    || '님이 회원님을 팔로우하기 시작했습니다.',
  jsonb_build_object(
    'follower_avatar_path',
    coalesce(
      requester.avatar_path,
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_path'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'picture'), '')
    ),
    'follower_display_name', nullif(requester.display_name, ''),
    'follower_id', friendship.requester_id,
    'follower_nickname', coalesce(nullif(requester.nickname, ''), nullif(requester.display_name, ''), '새 다이닝 친구')
  ),
  friendship.created_at
from public.profile_friendships friendship
left join public.profiles requester on requester.id = friendship.requester_id
left join auth.users users on users.id = requester.id
where not exists (
  select 1
  from public.notifications notification
  where notification.user_id = friendship.addressee_id
    and notification.type = 'follower_added'::public.notification_type
    and notification.payload->>'follower_id' = friendship.requester_id::text
);
