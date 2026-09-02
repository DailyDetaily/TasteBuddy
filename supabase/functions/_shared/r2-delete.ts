export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

type R2Fetch = (input: string, init: RequestInit) => Promise<Response>;

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hash(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function hmac(key: string | ArrayBuffer, value: string) {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
}

function encode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function signedRequest(
  credentials: R2Credentials,
  method: 'GET' | 'DELETE',
  objectKey: string | undefined,
  query: Record<string, string>,
  request: R2Fetch,
) {
  const host = `${credentials.accountId}.r2.cloudflarestorage.com`;
  const segments = [credentials.bucket, ...(objectKey?.split('/') ?? [])];
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Invalid R2 object key');
  }
  const uri = `/${segments.map(encode).join('/')}`;
  const queryString = Object.keys(query).sort().map((key) => `${encode(key)}=${encode(query[key])}`).join('&');
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = timestamp.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;
  const payloadHash = await hash('');
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const canonicalRequest = [method, uri, queryString, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  let signingKey = await hmac(`AWS4${credentials.secretAccessKey}`, date);
  signingKey = await hmac(signingKey, 'auto');
  signingKey = await hmac(signingKey, 's3');
  signingKey = await hmac(signingKey, 'aws4_request');
  const signature = hex(await hmac(signingKey, ['AWS4-HMAC-SHA256', timestamp, scope, await hash(canonicalRequest)].join('\n')));
  return request(`https://${host}${uri}${queryString ? `?${queryString}` : ''}`, {
    method,
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': timestamp,
    },
    signal: AbortSignal.timeout(15_000),
  });
}

function decodeXml(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[code] ?? entity;
  });
}

function parseList(xml: string, prefix: string) {
  if (!/<ListBucketResult(?:\s|>)/.test(xml)) throw new Error('Invalid R2 list response');
  const truncated = xml.match(/<IsTruncated>(true|false)<\/IsTruncated>/)?.[1];
  if (!truncated) throw new Error('Missing R2 list pagination state');
  const keys = [...xml.matchAll(/<Key>([\s\S]*?)<\/Key>/g)].map((match) => decodeXml(match[1]));
  if (keys.some((key) => !key.startsWith(prefix))) throw new Error('R2 list returned an unexpected object prefix');
  const nextToken = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
  if (truncated === 'true' && !nextToken) throw new Error('Missing R2 continuation token');
  return { keys, nextToken: truncated === 'true' ? decodeXml(nextToken!) : null };
}

export async function deleteR2Prefix(credentials: R2Credentials, prefix: string, request: R2Fetch = fetch) {
  if (!/^(user-avatars|feedback-reflections)\/[\da-f-]{36}\/$/i.test(prefix)) {
    throw new Error('Account media prefix required');
  }
  let token: string | null = null;
  const usedTokens = new Set<string>();
  do {
    const response = await signedRequest(credentials, 'GET', undefined, {
      'list-type': '2', prefix, ...(token ? { 'continuation-token': token } : {}),
    }, request);
    if (!response.ok) throw new Error(`R2 list failed (${response.status})`);
    const page = parseList(await response.text(), prefix);
    for (let offset = 0; offset < page.keys.length; offset += 8) {
      const outcomes = await Promise.allSettled(page.keys.slice(offset, offset + 8).map(async (key) => {
        const result = await signedRequest(credentials, 'DELETE', key, {}, request);
        if (!result.ok && result.status !== 404) throw new Error(`R2 delete failed (${result.status})`);
      }));
      const failure = outcomes.find((outcome) => outcome.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
    }
    token = page.nextToken;
    if (token && usedTokens.has(token)) throw new Error('Repeated R2 continuation token');
    if (token) usedTokens.add(token);
  } while (token);

  // Fail closed if a provider page was incomplete or an in-flight object appeared.
  const verification = await signedRequest(credentials, 'GET', undefined, {
    'list-type': '2', 'max-keys': '1', prefix,
  }, request);
  if (!verification.ok) throw new Error(`R2 verification failed (${verification.status})`);
  const remaining = parseList(await verification.text(), prefix);
  if (remaining.keys.length || remaining.nextToken) throw new Error('Account media cleanup requires a retry');
}
