import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

export async function updateSupabaseProfileIdentity(input: {
  displayName: string;
  nickname: string;
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
  const nickname = input.nickname.trim();
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      nickname,
    },
  });

  if (metadataError) {
    console.warn('Failed to update Supabase user metadata.', metadataError);
    return {
      ok: false,
      message: metadataError.message,
    };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || nickname || null,
    })
    .eq('id', userId);

  if (profileError) {
    console.warn('Failed to update Supabase profile identity.', profileError);
    return {
      ok: false,
      message: profileError.message,
    };
  }

  return {
    ok: true,
    message: '프로필 정보가 저장되었습니다.',
  };
}
