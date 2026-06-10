import { createClient, type Session } from '@supabase/supabase-js';

import { TASTE_IDS } from '../constants/designTokens';
import type {
  TasteMeasurementResults,
  TasteMeasurementSnapshot,
  TasteMeasurementSource,
} from '../constants/tasteMeasurementData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FEEDBACK_REFLECTION_PHOTO_MAX_DIMENSION = 1600;
const FEEDBACK_REFLECTION_PHOTO_QUALITY = 0.88;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export async function ensureSupabaseSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  const { data: existingSessionData, error: existingSessionError } = await supabase.auth.getSession();

  if (existingSessionError) {
    console.warn('Failed to get Supabase session.', existingSessionError);
  }

  if (existingSessionData.session) {
    return existingSessionData.session;
  }

  if (import.meta.env.VITE_SUPABASE_USE_ANONYMOUS_AUTH === 'false') {
    return null;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.warn('Failed to create anonymous Supabase session.', error);
    return null;
  }

  return data.session;
}

export async function getSupabaseUserId() {
  const session = await ensureSupabaseSession();
  return session?.user.id ?? null;
}

function getAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin + window.location.pathname;
}

export async function getCurrentSupabaseSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.warn('Failed to get current Supabase session.', error);
    return null;
  }

  return data.session;
}

export function subscribeToSupabaseAuthState(
  onChange: (session: Session | null) => void,
) {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}

export function isAnonymousSupabaseSession(session: Session | null) {
  return Boolean(session?.user.is_anonymous);
}

export type SupabaseEmailOtpIntent = 'start-with-email' | 'link-current-profile';

export function isMissingSupabaseEmailAccountError(message: string | null | undefined) {
  const normalizedMessage = message?.toLowerCase() ?? '';

  return (
    normalizedMessage.includes('signup') ||
    normalizedMessage.includes('signups') ||
    normalizedMessage.includes('not allowed') ||
    normalizedMessage.includes('not found') ||
    normalizedMessage.includes('no user')
  );
}

export async function sendSupabaseMagicLink(email: string) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    console.warn('Failed to send Supabase magic link.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: '이메일로 로그인 링크를 보냈습니다.',
  };
}

export async function sendSupabaseEmailOtp(
  email: string,
  intent: SupabaseEmailOtpIntent = 'start-with-email',
  options: { shouldCreateUser?: boolean } = {},
) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { error } =
    intent === 'link-current-profile'
      ? await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: getAuthRedirectUrl() },
        )
      : await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
            shouldCreateUser: options.shouldCreateUser ?? true,
          },
        });

  if (error) {
    console.warn('Failed to send Supabase email OTP.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message:
      intent === 'link-current-profile'
        ? '현재 프로필을 연결할 인증 코드를 보냈습니다.'
        : '이메일로 인증 코드를 보냈습니다.',
  };
}

export async function verifySupabaseEmailOtp(
  email: string,
  token: string,
  intent: SupabaseEmailOtpIntent = 'start-with-email',
) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
      session: null,
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: intent === 'link-current-profile' ? 'email_change' : 'email',
  });

  if (error) {
    console.warn('Failed to verify Supabase email OTP.', error);
    return {
      ok: false,
      message: error.message,
      session: null,
    };
  }

  return {
    ok: true,
    message:
      intent === 'link-current-profile'
        ? '현재 프로필이 이메일에 연결되었습니다.'
        : '이메일 인증이 완료되었습니다.',
    session: data.session,
  };
}

export async function linkAnonymousSupabaseUserEmail(email: string) {
  const session = await ensureSupabaseSession();

  if (!supabase || !session) {
    return {
      ok: false,
      message: '로그인 세션을 만들 수 없습니다.',
    };
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: getAuthRedirectUrl() },
  );

  if (error) {
    console.warn('Failed to link email to anonymous Supabase user.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: '확인 메일을 보냈습니다. 링크를 열면 현재 미각 프로필이 이메일에 연결됩니다.',
  };
}

export async function signOutSupabaseSession() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    console.warn('Failed to sign out Supabase session.', error);
  }
}

export async function deleteCurrentSupabaseAccount() {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    console.warn('Failed to delete Supabase account.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  await supabase.auth.signOut({ scope: 'local' });

  return {
    ok: true,
    message: '계정이 삭제되었습니다.',
  };
}

export interface DiningFriendActivitySummary {
  averageRating: number | null;
  feedbackCount: number;
  measurementCount: number;
  reservationCount: number;
  savedRestaurantCount: number;
}

export interface DiningFriendFavoriteChef {
  image: string | null;
  matchRate: number;
  name: string;
  restaurant: string;
  taste: string;
}

export interface DiningFriendProfile {
  activitySummary?: DiningFriendActivitySummary;
  avatarPath: string | null;
  displayName: string | null;
  favoriteChefs?: DiningFriendFavoriteChef[];
  followerCount?: number | null;
  followingCount?: number | null;
  id: string;
  isFriend: boolean;
  latestTasteMeasurementSnapshot: TasteMeasurementSnapshot | null;
  nickname: string;
}

export type ProfileConnectionKind = 'followers' | 'following';

function normalizeNicknameForProfile(input: string) {
  return input.trim().replace(/^@+/, '');
}

function isSearchableProfileIdentityQuery(input: string) {
  const normalizedInput = normalizeNicknameForProfile(input);
  return normalizedInput.length >= 2 || /[가-힣]/.test(normalizedInput);
}

function getProfileIdentityErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === '23505' || error.message?.toLowerCase().includes('profiles_nickname_unique_idx')) {
    return '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요.';
  }

  return error.message ?? '프로필 정보를 저장하지 못했습니다.';
}

function isMissingSupabaseRpcError(error: { message?: string }) {
  return error.message?.toLowerCase().includes('could not find the function') ?? false;
}

function getSupabaseMetadataAvatarPath(metadata: Record<string, unknown> | null | undefined) {
  const avatarPath = metadata?.avatar_path ?? metadata?.avatar_url ?? metadata?.picture;

  return typeof avatarPath === 'string' && avatarPath.trim() ? avatarPath.trim() : null;
}

function parseTasteMeasurementSnapshotFromRpcRow(item: Record<string, unknown>) {
  const rawResults = item.latest_measurement_results;

  if (!rawResults || typeof rawResults !== 'object' || Array.isArray(rawResults)) {
    return null;
  }

  const results = TASTE_IDS.reduce((accumulator, tasteId) => {
    const value = (rawResults as Record<string, unknown>)[tasteId];
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseFloat(value)
          : Number.NaN;

    accumulator[tasteId] = Number.isFinite(numericValue) ? numericValue : null;
    return accumulator;
  }, {} as TasteMeasurementResults);
  const hasAnyTasteValue = TASTE_IDS.some((tasteId) => results[tasteId] !== null);

  if (!hasAnyTasteValue) {
    return null;
  }

  const measuredAt =
    typeof item.latest_measurement_measured_at === 'string'
      ? item.latest_measurement_measured_at
      : new Date().toISOString();
  const source: TasteMeasurementSource =
    item.latest_measurement_source === 'quick_calibration'
      ? 'broad-starter'
      : 'measured';

  return {
    measuredAt,
    results,
    source,
  } satisfies TasteMeasurementSnapshot;
}

function parseOptionalNumber(value: unknown) {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseCount(value: unknown) {
  return Math.max(0, Math.round(parseOptionalNumber(value) ?? 0));
}

function parseFavoriteChefs(value: unknown): DiningFriendFavoriteChef[] {
  let rawValue = value;

  if (typeof rawValue === 'string') {
    try {
      rawValue = JSON.parse(rawValue);
    } catch {
      rawValue = [];
    }
  }

  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue.flatMap((item): DiningFriendFavoriteChef[] => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const favoriteChef = item as Record<string, unknown>;
    const name = typeof favoriteChef.name === 'string' ? favoriteChef.name.trim() : '';
    const restaurant =
      typeof favoriteChef.restaurant === 'string' ? favoriteChef.restaurant.trim() : '';

    if (!name || !restaurant) {
      return [];
    }

    return [{
      image: typeof favoriteChef.image === 'string' && favoriteChef.image.trim()
        ? favoriteChef.image.trim()
        : null,
      matchRate: Math.min(100, Math.max(0, Math.round(parseOptionalNumber(favoriteChef.matchRate) ?? 70))),
      name,
      restaurant,
      taste: typeof favoriteChef.taste === 'string' && favoriteChef.taste.trim()
        ? favoriteChef.taste.trim()
        : '감칠맛',
    }];
  });
}

function parseDiningFriendProfile(item: Record<string, unknown>, options: { requireNickname?: boolean } = {}) {
  const nickname = typeof item.nickname === 'string' ? item.nickname : '';

  if ((options.requireNickname && !nickname) || typeof item.id !== 'string') {
    return null;
  }

  return {
    activitySummary: {
      averageRating: parseOptionalNumber(item.average_rating),
      feedbackCount: parseCount(item.feedback_count),
      measurementCount: parseCount(item.measurement_count),
      reservationCount: parseCount(item.reservation_count),
      savedRestaurantCount: parseCount(item.saved_restaurant_count),
    },
    avatarPath: typeof item.avatar_path === 'string' ? item.avatar_path : null,
    displayName: typeof item.display_name === 'string' ? item.display_name : null,
    favoriteChefs: parseFavoriteChefs(item.favorite_chefs),
    followerCount: parseOptionalNumber(item.follower_count),
    followingCount: parseOptionalNumber(item.following_count),
    id: item.id,
    isFriend: Boolean(item.is_friend),
    latestTasteMeasurementSnapshot: parseTasteMeasurementSnapshotFromRpcRow(item),
    nickname,
  } satisfies DiningFriendProfile;
}

export async function updateSupabaseProfileIdentity(input: {
  displayName: string;
  nickname: string;
  avatarPath?: string | null;
}) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const session = await getCurrentSupabaseSession();
  const userId = session?.user.id;

  if (!userId) {
    return {
      ok: false,
      message: '로그인 세션을 찾을 수 없습니다.',
    };
  }

  const displayName = input.displayName.trim();
  const nickname = normalizeNicknameForProfile(input.nickname);
  const nextUserMetadata: Record<string, string | null> = {
    display_name: displayName,
    nickname,
  };

  if (input.avatarPath !== undefined) {
    nextUserMetadata.avatar_path = input.avatarPath;
  }

  const nextProfileValues: Record<string, string | null> = {
    display_name: displayName || nickname || null,
    nickname: nickname || null,
  };

  if (input.avatarPath !== undefined) {
    nextProfileValues.avatar_path = input.avatarPath;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(nextProfileValues)
    .eq('id', userId);

  if (profileError) {
    console.warn('Failed to update Supabase profile identity.', profileError);
    return {
      ok: false,
      message: getProfileIdentityErrorMessage(profileError),
    };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: nextUserMetadata,
  });

  if (metadataError) {
    console.warn('Failed to update Supabase user metadata.', metadataError);
    return {
      ok: false,
      message: metadataError.message,
    };
  }

  return {
    ok: true,
    message: '프로필 정보가 저장되었습니다.',
  };
}

export async function hydrateSupabaseProfileIdentity() {
  if (!supabase) {
    return {
      ok: false,
      avatarPath: null,
      displayName: null,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const session = await getCurrentSupabaseSession();
  const userId = session?.user.id;

  if (!userId) {
    return {
      ok: false,
      avatarPath: null,
      displayName: null,
      message: '로그인 세션을 찾을 수 없습니다.',
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_path, display_name, nickname')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to hydrate Supabase profile identity.', error);
    return {
      ok: false,
      avatarPath: null,
      displayName: null,
      message: error.message,
    };
  }

  const metadataAvatarPath = getSupabaseMetadataAvatarPath(session.user.user_metadata);
  const avatarPath =
    typeof data?.avatar_path === 'string' && data.avatar_path.trim()
      ? data.avatar_path
      : metadataAvatarPath;

  if (!data?.avatar_path && metadataAvatarPath) {
    void supabase
      .from('profiles')
      .update({ avatar_path: metadataAvatarPath })
      .eq('id', userId)
      .then(({ error: syncError }) => {
        if (syncError) {
          console.warn('Failed to sync Supabase profile avatar metadata.', syncError);
        }
      });
  }

  return {
    ok: true,
    avatarPath,
    displayName: typeof data?.display_name === 'string' ? data.display_name : null,
    nickname: typeof data?.nickname === 'string' ? data.nickname : null,
    message: '프로필 정보를 불러왔습니다.',
  };
}

export async function searchSupabaseProfilesByIdentity(query: string) {
  if (!supabase) {
    return {
      ok: false,
      friends: [],
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const normalizedQuery = normalizeNicknameForProfile(query);

  if (!isSearchableProfileIdentityQuery(query)) {
    return {
      ok: false,
      friends: [],
      message: '이름은 한 글자부터, 버디네임은 두 글자 이상 입력해 주세요.',
    };
  }

  const { data, error } = await supabase.rpc('search_profiles_by_identity', {
    search_query: normalizedQuery,
  });

  if (error) {
    if (isMissingSupabaseRpcError(error)) {
      const { data: legacyData, error: legacyError } = await supabase.rpc(
        'search_profiles_by_nickname',
        { search_query: normalizedQuery },
      );

      if (!legacyError && Array.isArray(legacyData) && legacyData.length > 0) {
        return {
          ok: true,
          friends: legacyData.flatMap((item): DiningFriendProfile[] => {
            const friend = parseDiningFriendProfile(item, { requireNickname: true });
            return friend ? [friend] : [];
          }),
          message: '버디 검색을 완료했습니다.',
        };
      }
    }

    console.warn('Failed to search Supabase profiles by identity.', error);
    return {
      ok: false,
      friends: [],
      message: isMissingSupabaseRpcError(error)
        ? '버디 이름 검색을 사용하려면 Supabase SQL Editor에서 최신 버디 검색 SQL을 먼저 적용해야 합니다.'
        : error.message,
    };
  }

  return {
    ok: true,
    friends: (Array.isArray(data) ? data : []).flatMap((item): DiningFriendProfile[] => {
      const friend = parseDiningFriendProfile(item, { requireNickname: true });
      return friend ? [friend] : [];
    }),
    message: '버디 검색을 완료했습니다.',
  };
}

export async function searchSupabaseProfilesByNickname(query: string) {
  return searchSupabaseProfilesByIdentity(query);
}

export async function addSupabaseFriendByNickname(nickname: string) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const normalizedNickname = normalizeNicknameForProfile(nickname);

  const { data, error } = await supabase.rpc('add_friend_by_nickname', {
    target_nickname: normalizedNickname,
  });

  if (error) {
    console.warn('Failed to add Supabase friend by nickname.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  const result = Array.isArray(data) ? data[0] : null;

  return {
    ok: Boolean(result?.ok),
    message: typeof result?.message === 'string'
      ? result.message
      : '친구 추가 결과를 확인하지 못했습니다.',
  };
}

export async function removeSupabaseFriendById(friendId: string) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const userId = await getSupabaseUserId();

  if (!userId) {
    return {
      ok: false,
      message: '로그인 세션을 찾을 수 없습니다.',
    };
  }

  const { error } = await supabase
    .from('profile_friendships')
    .delete()
    .eq('requester_id', userId)
    .eq('addressee_id', friendId);

  if (error) {
    console.warn('Failed to remove Supabase friend.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: '팔로잉을 취소했습니다.',
  };
}

export async function hydrateSupabaseFriendSummary() {
  if (!supabase) {
    return {
      ok: false,
      followerCount: 0,
      followingCount: 0,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { data, error } = await supabase.rpc('get_friend_summary');

  if (error) {
    console.warn('Failed to hydrate Supabase friend summary.', error);
    return {
      ok: false,
      followerCount: 0,
      followingCount: 0,
      message: error.message,
    };
  }

  const result = Array.isArray(data) ? data[0] : null;

  return {
    ok: true,
    followerCount: Number(result?.follower_count ?? result?.friend_count ?? 0),
    followingCount: Number(result?.following_count ?? result?.friend_count ?? 0),
    message: '친구 요약을 불러왔습니다.',
  };
}

export async function hydrateSupabaseProfileConnections(kind: ProfileConnectionKind) {
  if (!supabase) {
    return {
      ok: false,
      friends: [],
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { data, error } = await supabase.rpc('get_profile_connections', {
    connection_kind: kind,
  });

  if (error) {
    console.warn('Failed to hydrate Supabase profile connections.', error);
    return {
      ok: false,
      friends: [],
      message: isMissingSupabaseRpcError(error)
        ? '팔로워/팔로잉 목록을 불러오려면 Supabase SQL Editor에서 최신 친구 기능 SQL을 다시 실행해야 합니다.'
        : error.message,
    };
  }

  return {
    ok: true,
    friends: (Array.isArray(data) ? data : []).flatMap((item): DiningFriendProfile[] => {
      const friend = parseDiningFriendProfile(item);
      return friend ? [friend] : [];
    }),
    message: '프로필 연결 목록을 불러왔습니다.',
  };
}

export async function uploadSupabaseProfileAvatar(file: File) {
  if (!supabase) {
    return {
      ok: false,
      avatarPath: null,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke('upload-profile-avatar', {
    body: formData,
  });

  if (error) {
    console.warn('Failed to upload Supabase profile avatar.', error);
    return {
      ok: false,
      avatarPath: null,
      message: error.message,
    };
  }

  const avatarPath =
    data && typeof data === 'object' && 'objectKey' in data && typeof data.objectKey === 'string'
      ? data.objectKey
      : null;

  if (!avatarPath) {
    return {
      ok: false,
      avatarPath: null,
      message: '프로필 사진 업로드 응답이 올바르지 않습니다.',
    };
  }

  return {
    ok: true,
    avatarPath,
    message: '프로필 사진이 저장되었습니다.',
  };
}

function ensureJpegFileName(fileName?: string | null) {
  const trimmedName = fileName?.trim();
  const baseName = trimmedName && trimmedName.length > 0
    ? trimmedName.replace(/\.[^.]+$/, '')
    : `taste-reflection-${Date.now()}`;

  return `${baseName}.jpg`;
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Feedback reflection photo could not be loaded.'));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('Feedback reflection photo could not be prepared.'));
      },
      type,
      quality,
    );
  });
}

async function createFeedbackReflectionPhotoFile(dataUrl: string, fileName?: string | null) {
  if (!/^data:image\//i.test(dataUrl) || typeof document === 'undefined') {
    return null;
  }

  try {
    const image = await loadImageFromDataUrl(dataUrl);
    const scale = Math.min(
      1,
      FEEDBACK_REFLECTION_PHOTO_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Feedback reflection photo canvas is unavailable.');
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(
      canvas,
      'image/jpeg',
      FEEDBACK_REFLECTION_PHOTO_QUALITY,
    );

    return new File([blob], ensureJpegFileName(fileName), { type: 'image/jpeg' });
  } catch {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return new File(
      [blob],
      fileName?.trim() || `taste-reflection-${Date.now()}.jpg`,
      { type: blob.type || 'image/jpeg' },
    );
  }
}

export async function uploadSupabaseFeedbackReflectionPhoto(input: {
  dataUrl: string;
  dishId?: string | null;
  fileName?: string | null;
  reservationId?: number | string | null;
}) {
  if (!supabase) {
    return {
      ok: false,
      objectKey: null,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const file = await createFeedbackReflectionPhotoFile(input.dataUrl, input.fileName);

  if (!file) {
    return {
      ok: false,
      objectKey: null,
      message: '피드백 사진 형식이 올바르지 않습니다.',
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  if (input.reservationId != null) {
    formData.append('reservationId', String(input.reservationId));
  }

  if (input.dishId) {
    formData.append('dishId', input.dishId);
  }

  const { data, error } = await supabase.functions.invoke('upload-feedback-reflection-photo', {
    body: formData,
  });

  if (error) {
    console.warn('Failed to upload Supabase feedback reflection photo.', error);
    return {
      ok: false,
      objectKey: null,
      message: error.message,
    };
  }

  const objectKey =
    data && typeof data === 'object' && 'objectKey' in data && typeof data.objectKey === 'string'
      ? data.objectKey
      : null;

  if (!objectKey) {
    return {
      ok: false,
      objectKey: null,
      message: '피드백 사진 업로드 응답이 올바르지 않습니다.',
    };
  }

  return {
    ok: true,
    objectKey,
    message: '피드백 사진이 저장되었습니다.',
  };
}

export async function listSupabaseProfileAvatars() {
  if (!supabase) {
    return {
      ok: false,
      avatarPaths: [] as string[],
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { data, error } = await supabase.functions.invoke('upload-profile-avatar', {
    method: 'GET',
  });

  if (error) {
    console.warn('Failed to list Supabase profile avatars.', error);
    return {
      ok: false,
      avatarPaths: [] as string[],
      message: error.message,
    };
  }

  const avatars =
    data && typeof data === 'object' && 'avatars' in data && Array.isArray(data.avatars)
      ? data.avatars
      : [];
  const avatarPaths = avatars
    .map((item) =>
      item && typeof item === 'object' && 'objectKey' in item && typeof item.objectKey === 'string'
        ? item.objectKey
        : null,
    )
    .filter((item): item is string => Boolean(item));

  return {
    ok: true,
    avatarPaths,
    message: '프로필 사진 목록을 불러왔습니다.',
  };
}

export async function deleteSupabaseProfileAvatar(avatarPath: string) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.',
    };
  }

  const { error } = await supabase.functions.invoke('upload-profile-avatar', {
    body: { objectKey: avatarPath },
    method: 'DELETE',
  });

  if (error) {
    console.warn('Failed to delete Supabase profile avatar.', error);
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: '프로필 사진을 삭제했습니다.',
  };
}
