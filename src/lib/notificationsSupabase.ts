import { ensureSupabaseSession, isSupabaseConfigured, supabase } from './supabase';

export type AppNotificationType =
  | 'guidance_ready'
  | 'reservation_confirmed'
  | 'measurement_reminder'
  | 'feedback_request'
  | 'follower_added'
  | 'system';

export interface AppNotification {
  body: string;
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  read: boolean;
  title: string;
  type: AppNotificationType;
}

interface NotificationRow {
  body: string;
  created_at: string;
  id: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  title: string;
  type: AppNotificationType;
}

interface FollowerProfileRow {
  avatar_path: string | null;
  display_name: string | null;
  id: string;
  nickname: string | null;
}

const LEGACY_SEED_NOTIFICATION_SIGNATURES = new Set([
  'guidance_ready::TCS 준비 완료::레스토랑 베누의 황정인 셰프가 보정 전략을 완료했습니다.',
  'reservation_confirmed::예약 확정::숍 리제 (Lysée) 봄 시즌 테이스팅 코스 예약이 확정되었습니다.',
  'measurement_reminder::미각 재측정 추천::마지막 측정 후 7일이 지났어요. 다이닝 전 한 번 더 측정하면 정확도가 높아져요.',
  'feedback_request::식후 피드백 요청::정식당 다이닝은 어떠셨나요? 짧은 피드백으로 다음 경험을 개선할 수 있어요.',
]);

function getNotificationSignature(row: NotificationRow) {
  return `${row.type}::${row.title}::${row.body}`;
}

function isLegacyFollowerCountFallback(row: NotificationRow) {
  return (
    row.title === '새 팔로워' &&
    row.payload?.source === 'client_follower_count_fallback' &&
    typeof row.payload?.follower_nickname !== 'string'
  );
}

function toAppNotifications(rows: NotificationRow[]): AppNotification[] {
  return rows
    .filter((row) => !LEGACY_SEED_NOTIFICATION_SIGNATURES.has(getNotificationSignature(row)))
    .filter((row) => !isLegacyFollowerCountFallback(row))
    .map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      payload: row.payload ?? {},
      read: Boolean(row.read_at),
    }));
}

function getPayloadString(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function enrichNotificationRowWithFollower(
  row: NotificationRow,
  followerById: Map<string, FollowerProfileRow>,
): NotificationRow {
  const followerId = getPayloadString(row.payload, 'follower_id');
  if (!followerId) {
    return row;
  }

  const follower = followerById.get(followerId);
  if (!follower) {
    return row;
  }

  const followerNickname = follower.nickname || follower.display_name || '새 다이닝 친구';
  const followerAvatarPath = follower.avatar_path ?? null;

  return {
    ...row,
    body: `${followerNickname}님이 회원님을 팔로우하기 시작했습니다.`,
    payload: {
      ...row.payload,
      follower_avatar_path: followerAvatarPath,
      follower_display_name: follower.display_name,
      follower_id: follower.id,
      follower_nickname: followerNickname,
    },
  };
}

async function hydrateFollowerNotificationRows(rows: NotificationRow[]) {
  if (!supabase) {
    return rows;
  }

  const followerIds = rows.flatMap((row) => {
    const followerId = getPayloadString(row.payload, 'follower_id');
    return followerId ? [followerId] : [];
  });

  if (followerIds.length === 0) {
    return rows;
  }

  const { data, error } = await supabase.rpc('get_profile_connections', {
    connection_kind: 'followers',
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      console.warn('Failed to hydrate follower notification profiles.', error);
    }
    return rows;
  }

  const followerById = new Map<string, FollowerProfileRow>();
  data.forEach((item) => {
    if (typeof item.id !== 'string') {
      return;
    }

    followerById.set(item.id, {
      avatar_path: typeof item.avatar_path === 'string' ? item.avatar_path : null,
      display_name: typeof item.display_name === 'string' ? item.display_name : null,
      id: item.id,
      nickname: typeof item.nickname === 'string' ? item.nickname : null,
    });
  });

  return rows.map((row) => enrichNotificationRowWithFollower(row, followerById));
}

export function formatNotificationRelativeTime(createdAt: string) {
  const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < 10 * minute) {
    return '방금 전';
  }

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}분 전`;
  }

  if (diffMs < day) {
    return `${Math.max(1, Math.floor(diffMs / hour))}시간 전`;
  }

  return `${Math.max(1, Math.floor(diffMs / day))}일 전`;
}

async function getAuthenticatedUserId() {
  const session = await ensureSupabaseSession();
  return session?.user.id ?? null;
}

async function fetchNotificationRows(userId: string): Promise<NotificationRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, payload, created_at, read_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRow[];
}

export async function hydrateNotifications(): Promise<AppNotification[]> {
  if (!supabase || !isSupabaseConfigured) {
    return [];
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return [];
  }

  try {
    const rows = await fetchNotificationRows(userId);
    const enrichedRows = await hydrateFollowerNotificationRows(rows);
    return toAppNotifications(enrichedRows);
  } catch (error) {
    console.warn('Failed to hydrate notifications from Supabase.', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  if (!supabase || !isSupabaseConfigured) {
    return false;
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .is('read_at', null);

  if (error) {
    console.warn('Failed to mark notification as read.', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead() {
  if (!supabase || !isSupabaseConfigured) {
    return false;
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.warn('Failed to mark all notifications as read.', error);
    return false;
  }

  return true;
}

export async function createFollowerCountNotification(followerCount: number) {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return null;
  }

  const { data: followers, error: followersError } = await supabase.rpc('get_profile_connections', {
    connection_kind: 'followers',
  });

  const follower = Array.isArray(followers) ? followers[0] : null;
  const followerId = typeof follower?.id === 'string' ? follower.id : null;
  const followerNickname =
    typeof follower?.nickname === 'string' && follower.nickname.trim()
      ? follower.nickname.trim()
      : typeof follower?.display_name === 'string' && follower.display_name.trim()
        ? follower.display_name.trim()
        : '새 다이닝 친구';
  const followerAvatarPath = typeof follower?.avatar_path === 'string' ? follower.avatar_path : null;

  if (followersError) {
    console.warn('Failed to load latest follower for notification.', followersError);
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'system',
      title: '새 팔로워',
      body: `${followerNickname}님이 회원님을 팔로우하기 시작했습니다.`,
      payload: {
        follower_avatar_path: followerAvatarPath,
        follower_count: followerCount,
        follower_display_name: typeof follower?.display_name === 'string' ? follower.display_name : null,
        follower_id: followerId,
        follower_nickname: followerNickname,
        source: 'client_follower_count_fallback',
      },
    })
    .select('id, type, title, body, payload, created_at, read_at')
    .single();

  if (error) {
    console.warn('Failed to create follower count notification.', error);
    return null;
  }

  return data ? toAppNotifications([data as NotificationRow])[0] ?? null : null;
}
