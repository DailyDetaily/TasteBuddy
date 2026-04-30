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
