import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const MAX_REFLECTION_PHOTO_BYTES = 6 * 1024 * 1024;
const PUBLIC_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const ALLOWED_REFLECTION_PHOTO_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg']);

function detectImageType(payload: ArrayBuffer) {
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
        ? key
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

function sanitizeObjectKeySegment(value: string | null) {
  return value
    ?.trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || null;
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
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonResponse({ error: 'Invalid authenticated session' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Missing reflection photo file' }, { status: 400 });
  }

  if (file.size > MAX_REFLECTION_PHOTO_BYTES) {
    return jsonResponse({ error: 'Reflection photo file is too large' }, { status: 413 });
  }

  const payload = await file.arrayBuffer();
  const detectedImageType = detectImageType(payload);

  if (!detectedImageType || !ALLOWED_REFLECTION_PHOTO_TYPES.has(detectedImageType.type)) {
    return jsonResponse({ error: 'Reflection photo must be a supported image type' }, { status: 415 });
  }

  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10);
  const rawReservationId = formData.get('reservationId');
  const rawDishId = formData.get('dishId');
  const reservationSegment = sanitizeObjectKeySegment(
    typeof rawReservationId === 'string' ? rawReservationId : null,
  );
  const dishSegment = sanitizeObjectKeySegment(
    typeof rawDishId === 'string' ? rawDishId : null,
  );
  const contextPrefix = [reservationSegment, dishSegment].filter(Boolean).join('-');
  const objectKey = [
    'feedback-reflections',
    userData.user.id,
    dateFolder,
    `${contextPrefix ? `${contextPrefix}-` : ''}${crypto.randomUUID()}.${detectedImageType.extension}`,
  ].join('/');

  try {
    await uploadToR2({
      accessKeyId: r2AccessKeyId,
      accountId: r2AccountId,
      bucket: r2Bucket,
      contentType: detectedImageType.type,
      objectKey,
      payload,
      secretAccessKey: r2SecretAccessKey,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to upload reflection photo' }, { status: 502 });
  }

  return jsonResponse({ objectKey });
});
