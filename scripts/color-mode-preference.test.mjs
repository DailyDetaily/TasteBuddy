import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-theme-preference-'));
await build({ entryPoints: ['src/lib/colorMode.ts'], outfile: path.join(dir, 'theme.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const m = await import(path.join(dir, 'theme.mjs'));
after(async () => { delete globalThis.window; delete globalThis.document; await fs.rm(dir, { recursive: true, force: true }); });

function environment(saved, dark = false, unavailable = false) {
  const values = new Map(saved === undefined ? [] : [[m.COLOR_MODE_PREFERENCE_KEY, saved]]);
  const media = Object.assign(new EventTarget(), { matches: dark });
  const classes = new Set();
  globalThis.document = { documentElement: { dataset: {}, classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name) } } };
  globalThis.window = Object.assign(new EventTarget(), {
    matchMedia: () => media,
    localStorage: {
      getItem(key) { if (unavailable) throw new Error('blocked'); return values.get(key) ?? null; },
      setItem(key, value) { if (unavailable) throw new Error('blocked'); values.set(key, value); },
    },
  });
  return { values, classes, media, changeSystem(dark) { media.matches = dark; media.dispatchEvent(new Event('change')); } };
}

test('system follows OS changes; explicit choices persist and resist OS changes', () => {
  const env = environment(undefined, true);
  let dispose = m.installSystemColorMode();
  assert.equal(m.colorModePreference(), 'system');
  assert.equal(m.productColorMode(), 'dark');
  env.changeSystem(false);
  assert.equal(m.productColorMode(), 'light');
  m.setColorModePreference('dark');
  assert.equal(env.values.get(m.COLOR_MODE_PREFERENCE_KEY), 'dark');
  env.changeSystem(true); env.changeSystem(false);
  assert.equal(m.productColorMode(), 'dark');
  dispose();
  dispose = m.installSystemColorMode();
  assert.equal(m.colorModePreference(), 'dark');
  assert.ok(env.classes.has('dark'));
  m.setColorModePreference('light');
  env.changeSystem(true);
  assert.equal(m.productColorMode(), 'light');
  m.setColorModePreference('system');
  assert.equal(m.productColorMode(), 'dark');
  dispose();
  env.changeSystem(false);
  assert.equal(m.productColorMode(), 'dark', 'disposed listener must not keep updating the document');
});

test('another tab can change or clear the preference; unrelated storage is ignored', () => {
  const env = environment('light', true);
  const dispose = m.installSystemColorMode();
  const storage = key => window.dispatchEvent(Object.assign(new Event('storage'), { key }));
  env.values.set(m.COLOR_MODE_PREFERENCE_KEY, 'dark');
  storage('another-key');
  assert.equal(m.productColorMode(), 'light');
  storage(m.COLOR_MODE_PREFERENCE_KEY);
  assert.equal(m.productColorMode(), 'dark');
  env.values.clear(); storage(null);
  assert.equal(m.colorModePreference(), 'system');
  env.changeSystem(false);
  assert.equal(m.productColorMode(), 'light');
  dispose();
});

test('invalid saved values use system; denied storage still allows a session choice', () => {
  environment('invalid', true);
  let dispose = m.installSystemColorMode();
  assert.equal(m.colorModePreference(), 'system');
  assert.equal(m.productColorMode(), 'dark');
  dispose();
  environment(undefined, false, true);
  dispose = m.installSystemColorMode();
  m.setColorModePreference('dark');
  assert.equal(m.colorModePreference(), 'dark');
  assert.equal(m.productColorMode(), 'dark');
  dispose();
});
