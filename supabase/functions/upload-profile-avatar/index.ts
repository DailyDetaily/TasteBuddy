import { isDirectAppSessionToken } from '../_shared/direct-app-session.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withAccountMediaUpload } from '../_shared/account-media.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, GET, POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const PUBLIC_CACHE_CONTROL = 'private, no-store';
const ALLOWED_AVATAR_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg']);

function detectAvatarImageType(payload: ArrayBuffer) {
  const bytes = new Uint8Array(payload);

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { extension: 'webp', type: 'image/webp' };
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { extension: 'png', type: 'image/png' };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: 'jpg', type: 'image/jpeg' };
  }

  return null;
}

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

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function encodeS3Path(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function encodeS3QueryValue(value: string) {
  return encodeURIComponent(value).replace(/%2F/g, '%2F');
}

function getAmzDates(date = new Date()) {
  const isoValue = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: isoValue,
    dateStamp: isoValue.slice(0, 8),
  };
}

async function sha256Hex(input: string | ArrayBuffer) {
  const payload = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return toHex(await crypto.subtle.digest('SHA-256', payload));
}

async function hmac(key: string | ArrayBuffer | Uint8Array, value: string) {
  const rawKey =
    typeof key === 'string'
      ? new TextEncoder().encode(key)
      : key instanceof Uint8Array
        ? new Uint8Array(key)
        : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  );

  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
}

async function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = await hmac(dateKey, 'auto');
  const serviceKey = await hmac(regionKey, 's3');

  return hmac(serviceKey, 'aws4_request');
}

async function uploadToR2(input: {
  accessKeyId: string;
  accountId: string;
  bucket: string;
  contentType: string;
  objectKey: string;
  payload: ArrayBuffer;
  secretAccessKey: string;
}) {
  const host = `${input.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeS3Path(`${input.bucket}/${input.objectKey}`)}`;
  const url = `https://${host}${canonicalUri}`;
  const { amzDate, dateStamp } = getAmzDates();
  const payloadHash = await sha256Hex(input.payload);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const headersToSign = {
    'cache-control': PUBLIC_CACHE_CONTROL,
    'content-type': input.contentType,
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const sortedHeaderNames = Object.keys(headersToSign).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((headerName) => `${headerName}:${headersToSign[headerName as keyof typeof headersToSign]}`)
    .join('\n');
  const signedHeaders = sortedHeaderNames.join(';');
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await getSigningKey(input.secretAccessKey, dateStamp);
  const signature = toHex(await hmac(signingKey, stringToSign));
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const response = await fetch(url, {
    method: 'PUT',
    body: input.payload,
    signal: AbortSignal.timeout(45_000),
    headers: {
      Authorization: authorization,
      'Cache-Control': PUBLIC_CACHE_CONTROL,
      'Content-Type': input.contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status} ${await response.text()}`);
  }
}

async function signedR2Request(input: {
  accessKeyId: string;
  accountId: string;
  bucket: string;
  method: 'DELETE' | 'GET';
  objectKey?: string;
  query?: Record<string, string>;
  secretAccessKey: string;
}) {
  const host = `${input.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = input.objectKey
    ? `/${encodeS3Path(`${input.bucket}/${input.objectKey}`)}`
    : `/${encodeS3Path(input.bucket)}`;
  const sortedQueryEntries = Object.entries(input.query ?? {}).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );
  const canonicalQueryString = sortedQueryEntries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeS3QueryValue(value)}`)
    .join('&');
  const url = `https://${host}${canonicalUri}${canonicalQueryString ? `?${canonicalQueryString}` : ''}`;
  const { amzDate, dateStamp } = getAmzDates();
  const payloadHash = await sha256Hex('');
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const headersToSign = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const sortedHeaderNames = Object.keys(headersToSign).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((headerName) => `${headerName}:${headersToSign[headerName as keyof typeof headersToSign]}`)
    .join('\n');
  const signedHeaders = sortedHeaderNames.join(';');
  const canonicalRequest = [
    input.method,
    canonicalUri,
    canonicalQueryString,
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await getSigningKey(input.secretAccessKey, dateStamp);
  const signature = toHex(await hmac(signingKey, stringToSign));
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  return fetch(url, {
    method: input.method,
    headers: {
      Authorization: authorization,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
  });
}

function decodeXmlValue(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseR2ObjectKeys(xml: string) {
  return [...xml.matchAll(/<Key>(.*?)<\/Key>/g)]
    .map((match) => decodeXmlValue(match[1] ?? ''))
    .filter(Boolean);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!['DELETE', 'GET', 'POST'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authorization = request.headers.get('Authorization');
  const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');
  const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const r2Bucket =
    Deno.env.get('R2_PUBLIC_MEDIA_BUCKET') ??
    Deno.env.get('R2_BUCKET') ??
    'taste-buddy-public-media';

  if (!supabaseUrl || !supabaseAnonKey || !r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    return jsonResponse({ error: 'Upload function secrets are not configured' }, { status: 500 });
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
  if (!isDirectAppSessionToken(accessToken)) {
    return jsonResponse({ error: 'Direct app session required' }, { status: 401 });
  }
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse({ error: 'Invalid authenticated session' }, { status: 401 });
  }

  const userAvatarPrefix = `user-avatars/${userData.user.id}/`;

  if (request.method === 'GET') {
    try {
      const response = await signedR2Request({
        accessKeyId: r2AccessKeyId,
        accountId: r2AccountId,
        bucket: r2Bucket,
        method: 'GET',
        query: {
          'list-type': '2',
          prefix: userAvatarPrefix,
        },
        secretAccessKey: r2SecretAccessKey,
      });

      if (!response.ok) {
        throw new Error(`R2 list failed: ${response.status} ${await response.text()}`);
      }

      const xml = await response.text();
      const objectKeys = parseR2ObjectKeys(xml).filter((objectKey) =>
        objectKey.startsWith(userAvatarPrefix),
      );

      return jsonResponse({
        avatars: objectKeys.map((objectKey) => ({ objectKey })),
      });
    } catch (error) {
      console.error(error);
      return jsonResponse({ error: 'Failed to list avatars' }, { status: 502 });
    }
  }

  if (request.method === 'DELETE') {
    const body = await request.json().catch(() => null);
    const objectKey =
      body && typeof body === 'object' && 'objectKey' in body && typeof body.objectKey === 'string'
        ? body.objectKey
        : null;

    if (!objectKey || !objectKey.startsWith(userAvatarPrefix)) {
      return jsonResponse({ error: 'Invalid avatar object key' }, { status: 400 });
    }

    try {
      const response = await signedR2Request({
        accessKeyId: r2AccessKeyId,
        accountId: r2AccountId,
        bucket: r2Bucket,
        method: 'DELETE',
        objectKey,
        secretAccessKey: r2SecretAccessKey,
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`R2 delete failed: ${response.status} ${await response.text()}`);
      }

      return jsonResponse({ objectKey });
    } catch (error) {
      console.error(error);
      return jsonResponse({ error: 'Failed to delete avatar' }, { status: 502 });
    }
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Missing avatar file' }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return jsonResponse({ error: 'Avatar file is too large' }, { status: 413 });
  }

  const payload = await file.arrayBuffer();
  const detectedImageType = detectAvatarImageType(payload);

  if (!detectedImageType || !ALLOWED_AVATAR_TYPES.has(detectedImageType.type)) {
    return jsonResponse({ error: 'Avatar file must be a supported image type' }, { status: 415 });
  }

  const objectKey = `user-avatars/${userData.user.id}/${crypto.randomUUID()}.${detectedImageType.extension}`;

  try {
    await withAccountMediaUpload(userClient, () => uploadToR2({
      accessKeyId: r2AccessKeyId,
      accountId: r2AccountId,
      bucket: r2Bucket,
      contentType: detectedImageType.type,
      objectKey,
      payload,
      secretAccessKey: r2SecretAccessKey,
    }));
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to upload avatar' }, { status: 502 });
  }

  return jsonResponse({ objectKey });
});
