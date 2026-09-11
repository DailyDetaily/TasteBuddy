import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { writeDiscovery } from '../write-discovery.mjs';

test('Vercel discovery publishes only matching public settings and removes stale metadata when disabled', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tb-discovery-'));
  const file = path.join(directory, '.well-known/oauth-protected-resource/mcp');
  const env = { TB_MCP_RESOURCE: 'https://tastebuddy.app/mcp', SUPABASE_URL: 'https://db.example.com',
    VITE_SUPABASE_URL: 'https://db.example.com', TB_CHATGPT_CLIENT_ID: 'client', VITE_TB_CHATGPT_CLIENT_ID: 'client',
    SUPABASE_SERVICE_ROLE_KEY: 'never-publish-this' };
  try {
    await writeDiscovery(env, directory);
    const raw = await readFile(file, 'utf8');
    assert.equal(raw.includes(env.SUPABASE_SERVICE_ROLE_KEY), false);
    assert.equal(JSON.parse(raw).resource, env.TB_MCP_RESOURCE);
    await assert.rejects(writeDiscovery({ ...env, VITE_TB_CHATGPT_CLIENT_ID: 'other' }, directory), /일치/);
    await writeDiscovery({}, directory);
    await assert.rejects(readFile(file), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('Vercel function adapter keeps missing configuration closed and serves MCP after URL rewrite', async t => {
  const names = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TB_CHATGPT_CLIENT_ID', 'TB_MCP_RESOURCE'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  const { default: handler } = await import('../../../api/chatgpt.mjs');
  const server = createServer(handler).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => {
    server.closeAllConnections(); server.close();
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  });
  const url = `http://127.0.0.1:${server.address().port}/api/chatgpt`;
  assert.equal((await fetch(url)).status, 503);
  Object.assign(process.env, { SUPABASE_URL: 'https://db.example.com', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
    TB_CHATGPT_CLIENT_ID: 'client', TB_MCP_RESOURCE: 'https://tastebuddy.app/mcp' });
  const response = await fetch(url, { method: 'POST', headers: {
    'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
  }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.tools[0].name, 'get_my_taste_evidence');
});
