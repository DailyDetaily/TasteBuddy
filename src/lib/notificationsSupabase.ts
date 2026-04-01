import { ensureSupabaseSession, isSupabaseConfigured, supabase } from './supabase';

export type AppNotificationType =
  | 'guidance_ready'
  | 'reservation_confirmed'
  | 'measurement_reminder'
  | 'feedback_request'
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

interface NotificationSeed {
  body: string;
  createdAt: string;
  read: boolean;
  title: string;
  type: AppNotificationType;
}

function buildNotificationSeeds(): NotificationSeed[] {
  const now = Date.now();

  return [
    {
      type: 'guidance_ready',
      title: 'TCS 준비 완료',
      body: '레스토랑 베누의 황정인 셰프가 보정 전략을 완료했습니다.',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      type: 'reservation_confirmed',
      title: '예약 확정',
      body: '숍 리제 (Lysée) 봄 시즌 테이스팅 코스 예약이 확정되었습니다.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      type: 'measurement_reminder',
      title: '미각 재측정 추천',
      body: '마지막 측정 후 7일이 지났어요. 다이닝 전 한 번 더 측정하면 정확도가 높아져요.',
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      type: 'feedback_request',
      title: '식후 피드백 요청',
      body: '정식당 다이닝은 어떠셨나요? 짧은 피드백으로 다음 경험을 개선할 수 있어요.',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
}

function toAppNotifications(rows: NotificationRow[]): AppNotification[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: Boolean(row.read_at),
  }));
}

export function getFallbackNotifications(): AppNotification[] {
  return buildNotificationSeeds().map((seed, index) => ({
    id: `fallback-notification-${index + 1}`,
    type: seed.type,
    title: seed.title,
    body: seed.body,
    createdAt: seed.createdAt,
    read: seed.read,
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

async function seedNotifications(userId: string) {
  if (!supabase) {
    return;
  }

  const seeds = buildNotificationSeeds();
  const { error } = await supabase.from('notifications').insert(
    seeds.map((seed) => ({
      user_id: userId,
      type: seed.type,
      title: seed.title,
      body: seed.body,
      created_at: seed.createdAt,
      read_at: seed.read ? seed.createdAt : null,
    })),
  );

  if (error) {
    throw error;
  }
}

export async function hydrateNotifications(): Promise<AppNotification[]> {
  if (!supabase || !isSupabaseConfigured) {
    return getFallbackNotifications();
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return getFallbackNotifications();
  }

  try {
    let rows = await fetchNotificationRows(userId);

    if (rows.length === 0) {
      await seedNotifications(userId);
      rows = await fetchNotificationRows(userId);
    }

    return toAppNotifications(rows);
  } catch (error) {
    console.warn('Failed to hydrate notifications from Supabase.', error);
    return getFallbackNotifications();
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
