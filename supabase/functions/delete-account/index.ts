import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deleteR2Prefix } from '../_shared/r2-delete.ts';
import { purgeAccountMediaCache } from '../_shared/cloudflare-cache.ts';
import { deleteAccountData } from './cleanup.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('Account deletion requires SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.');
    return jsonResponse({ error: '계정 삭제를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.', retryable: true }, { status: 503 });
  }

  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing authenticated session' }, { status: 401 });
  }

  const accessToken = authorization.replace('Bearer ', '').trim();
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse({ error: 'Invalid authenticated session' }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucket = Deno.env.get('R2_PUBLIC_MEDIA_BUCKET') ?? Deno.env.get('R2_BUCKET') ?? 'taste-buddy-public-media';
  const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
  const apiToken = Deno.env.get('CLOUDFLARE_CACHE_PURGE_TOKEN');
  const publicMediaBaseUrl = Deno.env.get('R2_PUBLIC_MEDIA_BASE_URL');

  if (!accountId || !accessKeyId || !secretAccessKey || !zoneId || !apiToken || !publicMediaBaseUrl) {
    console.error('Account deletion requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_MEDIA_BASE_URL, CLOUDFLARE_ZONE_ID and CLOUDFLARE_CACHE_PURGE_TOKEN.');
    return jsonResponse({ error: '계정 삭제를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.', retryable: true }, { status: 503 });
  }

  try {
    const result = await deleteAccountData(userData.user.id, {
      async prepare(userId) {
        const { data, error } = await adminClient.rpc('prepare_account_deletion', { target_user_id: userId });
        if (error) throw new Error('Could not prepare account deletion');
        return data;
      },
      deleteMediaPrefix: (prefix) => deleteR2Prefix({ accountId, accessKeyId, secretAccessKey, bucket }, prefix),
      purgeMediaCache: (userId) => purgeAccountMediaCache(userId, { zoneId, apiToken, publicMediaBaseUrl }),
      async deleteAuthUser(userId) {
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw new Error('Could not finish account deletion');
      },
    });
    if (result.pendingUploads) {
      return jsonResponse({ error: '사진 업로드가 마무리되고 있습니다. 잠시 후 계정 삭제를 다시 시도해주세요.', retryable: true }, {
        status: 409, headers: { 'Retry-After': '10' },
      });
    }
    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error('Account cleanup incomplete:', error instanceof Error ? error.message : 'Unknown cleanup failure');
    // Do not return success or remove Auth while any cleanup step failed.
    return jsonResponse({ error: '계정 데이터 삭제를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.', retryable: true }, { status: 502 });
  }
});
