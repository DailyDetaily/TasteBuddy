import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-account-presentation-'));
const output = path.join(directory, 'ownership.mjs');
await build({ entryPoints: ['src/lib/accountPresentation.ts'], outfile: output, platform: 'node', format: 'esm', bundle: true, logLevel: 'silent' });
const { canReuseAccountPresentation: reuse, canPersistAccountPresentation: persist, normalizePresentationOwner: normalize } = await import(output);
after(() => fs.rm(directory, { recursive: true, force: true }));

test('returning anonymous and local guest caches survive only their own restored identity', () => {
  for (const owner of ['guest', 'anonymous-uuid-a']) {
    assert.equal(reuse({ savedOwner: owner, currentPresentationOwner: null, restoredOwner: owner }), true);
    assert.equal(reuse({ savedOwner: owner, currentPresentationOwner: null, restoredOwner: 'another-account' }), false);
  }
});

test('an unowned legacy snapshot is withheld rather than assigned to the first account', () => {
  assert.equal(normalize(undefined), null);
  assert.equal(normalize(''), null);
  for (const owner of ['guest', 'anonymous-uuid-a', 'account-b']) {
    assert.equal(reuse({ savedOwner: null, currentPresentationOwner: null, restoredOwner: owner }), false);
  }
});

test('switching accounts cannot resurrect the startup cache over another current presentation', () => {
  assert.equal(reuse({ savedOwner: 'account-b', currentPresentationOwner: 'account-a', restoredOwner: 'account-b' }), false);
  assert.equal(reuse({ savedOwner: 'account-a', currentPresentationOwner: 'account-b', restoredOwner: 'account-b' }), true);
});

test('startup and failed reads cannot overwrite a cache with unresolved or wrong-owner state', () => {
  assert.equal(persist({ hydrated: false, presentationOwner: 'anonymous-uuid-a', sessionOwner: 'anonymous-uuid-a' }), false);
  assert.equal(persist({ hydrated: true, presentationOwner: null, sessionOwner: 'guest' }), false);
  assert.equal(persist({ hydrated: true, presentationOwner: 'account-a', sessionOwner: 'account-b' }), false);
  assert.equal(persist({ hydrated: true, presentationOwner: 'anonymous-uuid-a', sessionOwner: 'anonymous-uuid-a' }), true);
});
