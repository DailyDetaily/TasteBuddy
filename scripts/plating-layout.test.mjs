import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(await fs.readFile('src/plating/nativeLayoutCaptures.json', 'utf8'));
const captures = manifest.captures;
const find = id => {
  const capture = captures.find(item => item.id === id);
  assert.ok(capture, `Missing ${id}`);
  return capture;
};
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} vs ${expected}`);

test('all six production-screen captures have complete, finite geometry', () => {
  assert.equal(captures.length, 6);
  assert.equal(new Set(captures.map(item => item.id)).size, 6);
  const required = {
    home: ['top-bar', 'content', 'bottom-tab', 'home-card', 'home-card-content', 'home-section'],
    dining: ['dining-header', 'dining-content', 'dining-footer'],
    sheet: ['sheet-header', 'sheet-content', 'sheet-footer', 'sheet-input', 'auth-primary-action'],
  };
  for (const capture of captures) {
    assert.equal(capture.status, 'ready');
    assert.ok(capture.width > 300 && capture.height > 600);
    for (const key of required[capture.screen]) {
      const rect = capture.frames[key];
      assert.ok(rect, `${capture.id}: ${key}`);
      assert.ok([rect.x, rect.y, rect.width, rect.height].every(Number.isFinite));
      assert.ok(rect.width > 0 && rect.height > 0);
    }
  }
});

test('native PNG bytes and dimensions match the captured metadata', async () => {
  for (const capture of captures) {
    const bytes = await fs.readFile(`public/plating/native-layout/${capture.file}`);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), capture.pixelWidth);
    assert.equal(bytes.readUInt32BE(20), capture.pixelHeight);
    near(capture.pixelWidth / capture.scale, capture.width, capture.id);
    near(capture.pixelHeight / capture.scale, capture.height, capture.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), capture.sha256, capture.id);
  }
});

test('home card measurements preserve the real fixed size and inner padding', () => {
  for (const size of ['large', 'accessibility2']) {
    const { frames } = find(`home-${size}`);
    near(frames['home-card'].width, 132, 'home card width');
    near(frames['home-card'].height, 132, 'home card height');
    near(frames['home-card-content'].x - frames['home-card'].x, 12, 'home card left padding');
    near(frames['home-card-content'].y - frames['home-card'].y, 12, 'home card top padding');
  }
});

test('Dynamic Type captures use the same screen size and distinct native categories', () => {
  for (const screen of ['home', 'dining']) {
    const normal = find(`${screen}-large`), large = find(`${screen}-accessibility2`);
    assert.equal(normal.dynamicType, 'large');
    assert.equal(large.dynamicType, 'accessibility2');
    assert.equal(normal.width, large.width);
    assert.equal(normal.height, large.height);
    assert.notEqual(normal.sha256, large.sha256, `${screen}: images must differ`);
  }
});

test('sheet captures contain a real visible keyboard and measured CTA movement', () => {
  const closed = find('sheet-large'), open = find('sheet-keyboard');
  assert.equal(closed.keyboardVisible, false);
  assert.equal(open.keyboardVisible, true);
  assert.ok(open.keyboardFrame?.height > 150);
  assert.ok(open.keyboardFrame.y > 0 && open.keyboardFrame.y < open.height);
  assert.ok(open.frames['auth-primary-action'].y < closed.frames['auth-primary-action'].y);
  assert.ok(open.frames['sheet-input'].height >= 47);
});
