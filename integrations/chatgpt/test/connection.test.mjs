import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPair, SignJWT } from 'jose';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createApp, createExportReader, createTokenVerifier } from '../app.mjs';

const user = '11111111-1111-4111-8111-111111111111';
const config = { supabaseURL: 'https://db.example.com', serviceKey: 'server-only', clientID: 'chatgpt-client', resource: 'https://taste.example.com/mcp' };
const { privateKey, publicKey } = await generateKeyPair('ES256');
const verifier = createTokenVerifier(config, publicKey);
async function token(overrides = {}) {
  return new SignJWT({ role: 'tb_chatgpt_reader', client_id: config.clientID, tb_scope: 'taste:read',
    iss: `${config.supabaseURL}/auth/v1`, aud: config.resource, sub: user,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...overrides })
    .setProtectedHeader({ alg: 'ES256' }).sign(privateKey);
}

test('OAuth token validates signature, issuer, audience, client, subject, scope, role and expiry', async () => {
  assert.equal(await verifier(await token()), user);
  for (const override of [{ aud: 'authenticated' }, { iss: 'https://other.example.com' },
    { client_id: 'other' }, { sub: 'not-a-uuid' }, { tb_scope: 'write' },
    { role: 'authenticated' }, { is_anonymous: true }, { exp: 1 }]) {
    await assert.rejects(verifier(await token(override)));
  }
  const { privateKey: otherKey } = await generateKeyPair('ES256');
  await assert.rejects(verifier(await new SignJWT({ sub: user }).setProtectedHeader({ alg: 'ES256' }).sign(otherKey)));
});

test('export lookup is bounded to verified subject and rejects expired or unexpected personal fields', async () => {
  let calledURL;
  const payload = { schemaVersion: 1, engineVersion: 'test', generatedAt: new Date().toISOString(), totalExperienceCount: 1,
    includedExperienceCount: 1, observations: [], unresolved: [], limits: [] };
  let rows = [{ payload, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60000).toISOString() }];
  const read = createExportReader(config, async (url, options) => {
    calledURL = url;
    assert.equal(options.headers.Authorization, 'Bearer server-only');
    return Response.json(rows);
  });
  assert.equal((await read(user)).schemaVersion, 1);
  assert.equal(calledURL.searchParams.get('user_id'), `eq.${user}`);
  assert.equal(calledURL.searchParams.get('limit'), '1');
  assert.match(calledURL.searchParams.get('expires_at'), /^gt\./);
  rows[0].payload = { ...payload, email: 'must-not-be-exported@example.com' };
  await assert.rejects(read(user));
  rows[0].expires_at = new Date(0).toISOString();
  assert.equal(await read(user), null);
  rows = [];
  assert.equal(await read(user), null);
});

test('real MCP transport exposes OAuth discovery and reads only after valid account authentication', async t => {
  const owners = [];
  const app = createApp(config, { verifyToken: verifier, readExport: async id => {
    owners.push(id); return { observations: [], savedAt: '2026-09-06' };
  } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const metadata = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json();
  assert.equal(metadata.resource, config.resource);
  assert.deepEqual(metadata.authorization_servers, [`${config.supabaseURL}/auth/v1`]);
  const discovery = await (await fetch(`${base}/mcp`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
  })).json();
  assert.equal(discovery.result.tools[0].securitySchemes[0].type, 'oauth2');
  const invalid = await fetch(`${base}/mcp`, { method: 'POST', headers: { authorization: 'Bearer bad' } });
  assert.equal(invalid.status, 401);
  assert.match(invalid.headers.get('www-authenticate'), /resource_metadata/);
  const foreignOrigin = await fetch(`${base}/mcp`, { method: 'POST', headers: { origin: 'https://evil.example.com' } });
  assert.equal(foreignOrigin.status, 403);

  for (const signedIn of [false, true]) {
    const client = new Client({ name: 'test', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: signedIn ? { headers: { Authorization: `Bearer ${await token()}` } } : {},
    });
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name), ['get_my_taste_evidence']);
    assert.equal(tools[0].annotations.readOnlyHint, true);
    assert.equal(tools[0]._meta.securitySchemes[0].type, 'oauth2');
    const result = await client.callTool({ name: 'get_my_taste_evidence', arguments: {} });
    if (signedIn) assert.equal(result.structuredContent.savedAt, '2026-09-06');
    else { assert.equal(result.isError, true); assert.ok(result._meta['mcp/www_authenticate']); }
    await client.close();
  }
  assert.deepEqual(owners, [user]);
});
