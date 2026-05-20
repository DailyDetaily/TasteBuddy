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
  read: boolean;
  title: string;
  type: AppNotificationType;
}

interface NotificationRow {
  body: string;
  created_at: string;
  id: string;
  read_at: string | null;
  title: string;
  type: AppNotificationType;
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

function toAppNotifications(rows: NotificationRow[]): AppNotification[] {
  return rows
    .filter((row) => !LEGACY_SEED_NOTIFICATION_SIGNATURES.has(getNotificationSignature(row)))
    .map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      read: Boolean(row.read_at),
    }));
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
    .select('id, type, title, body, created_at, read_at')
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
    return toAppNotifications(rows);
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
