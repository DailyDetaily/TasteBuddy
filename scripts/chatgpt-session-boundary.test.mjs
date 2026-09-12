import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isDirectAppSessionToken } from '../supabase/functions/_shared/direct-app-session.ts';

const token = claims => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
test('account mutations reject OAuth credentials before ordinary Supabase user validation', async () => {
  assert.equal(isDirectAppSessionToken(token({ role: 'authenticated', aud: 'authenticated' })), true);
  for (const claims of [
    { role: 'tb_chatgpt_reader', aud: 'https://taste.example.com/mcp', client_id: 'chatgpt' },
    { role: 'authenticated', aud: 'authenticated', client_id: 'chatgpt' },
    { role: 'service_role', aud: 'authenticated' },
  ]) assert.equal(isDirectAppSessionToken(token(claims)), false);
  assert.equal(isDirectAppSessionToken('malformed'), false);
  for (const name of ['delete-account', 'upload-profile-avatar', 'upload-feedback-reflection-photo']) {
    const source = await readFile(`supabase/functions/${name}/index.ts`, 'utf8');
    assert.ok(source.indexOf('if (!isDirectAppSessionToken(accessToken))') < source.indexOf('auth.getUser(accessToken)'));
    assert.ok(source.includes('auth.getUser(accessToken)')); // rejection filter is not authentication
  }
});
