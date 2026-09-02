export interface AccountMediaCacheConfig {
  zoneId: string;
  apiToken: string;
  publicMediaBaseUrl: string;
}

export async function purgeAccountMediaCache(
  userId: string,
  config: AccountMediaCacheConfig,
  request: typeof fetch = fetch,
) {
  if (!/^[\da-f-]{36}$/i.test(userId) || !/^[\da-f]{32}$/i.test(config.zoneId)) {
    throw new Error('Invalid media cache cleanup configuration');
  }
  const base = new URL(config.publicMediaBaseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('Invalid public media origin');
  }
  const basePath = base.pathname.replace(/\/$/, '');
  // Two prefix operations are below Cloudflare's 100-operation limit. Prefixes
  // include legacy cached objects even when a previous attempt deleted the origin.
  const prefixes = ['user-avatars', 'feedback-reflections'].map(
    (folder) => `${base.host}${basePath}/${folder}/${userId}/`,
  );
  const response = await request(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Media cache purge failed (${response.status})`);
  const result = await response.json();
  if (result?.success !== true) throw new Error('Media cache purge was not confirmed');
}
