import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Vercel reserves /.well-known against rewrites. Serve metadata as a static file.
export async function writeDiscovery(env, publicDirectory) {
  const file = path.join(publicDirectory, '.well-known/oauth-protected-resource/mcp');
  const resource = env.TB_MCP_RESOURCE;
  if (!resource) {
    await rm(file, { force: true });
    return;
  }
  const supabaseURL = env.SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseURL || supabaseURL !== env.VITE_SUPABASE_URL?.replace(/\/$/, '') ||
      !env.TB_CHATGPT_CLIENT_ID || env.TB_CHATGPT_CLIENT_ID !== env.VITE_TB_CHATGPT_CLIENT_ID) {
    throw new Error('웹과 연결 서버의 Supabase URL 및 OAuth client ID가 일치해야 합니다.');
  }
  for (const value of [resource, supabaseURL]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('연결 주소는 인증 정보 없는 HTTPS URL이어야 합니다.');
    }
  }
  if (new URL(resource).pathname !== '/mcp') throw new Error('MCP 경로를 확인하세요.');
  const metadata = {
    resource, resource_name: 'Taste Buddy 입맛 해석',
    authorization_servers: [`${supabaseURL}/auth/v1`],
    scopes_supported: ['openid'], bearer_methods_supported: ['header'],
  };
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(metadata));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeDiscovery(process.env, path.resolve('public'));
}
