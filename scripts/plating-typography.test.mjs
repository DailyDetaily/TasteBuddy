import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const foundations = JSON.parse(await fs.readFile('src/plating/ios-foundations.generated.json', 'utf8'));
const typography = JSON.parse(await fs.readFile('src/plating/nativeTypographyCaptures.json', 'utf8'));
const captures = typography.captures;

test('all six text roles use the registered font and source base size', () => {
  assert.equal(typography.fonts.length, foundations.typography.roles.length);
  for (const role of foundations.typography.roles) {
    const metric = typography.fonts.find(item => item.role === role.name);
    assert.ok(metric, role.name);
    assert.equal(metric.baseSize, role.size, role.name);
    const weight = { regular: 'Regular', medium: 'Medium', semibold: 'SemiBold', bold: 'Bold' }[role.weight];
    assert.equal(metric.postScriptName, `Pretendard-${weight}`);
    assert.ok(metric.familyName.length > 0);
    assert.ok(metric.lineHeight >= metric.baseSize && metric.ascender > 0 && metric.descender < 0);
    assert.ok(captures.some(c => c.id === `role-${role.name}` && c.kind === 'role' && c.category === 'large'));
  }
});

test('native images match the recorded size and captured bytes', async () => {
  assert.equal(captures.length, 12);
  assert.equal(new Set(captures.map(c => c.id)).size, captures.length);
  for (const capture of captures) {
    const bytes = await fs.readFile(path.join('public/plating/native-typography', capture.file));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), capture.width * 3, capture.id);
    assert.equal(bytes.readUInt32BE(20), capture.height * 3, capture.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), capture.sha256, capture.id);
    assert.ok(capture.height > 30 && bytes.length > 1000, capture.id);
  }
});

test('Dynamic Type adds content height at the same reading width', () => {
  const samples = ['large', 'xxxLarge', 'accessibility2'].map(category => captures.find(c => c.id === `dynamic-${category}`));
  for (const sample of samples) assert.ok(sample && sample.width === 390 && sample.kind === 'dynamic');
  assert.ok(samples[1].height > samples[0].height, 'XXX Large must expand beyond Large');
  assert.ok(samples[2].height > samples[1].height, 'AX2 must expand beyond XXX Large');
});

test('all three source-based product text recipes have native specimens', () => {
  for (const id of ['usage-home', 'usage-dining', 'usage-analysis']) {
    assert.ok(captures.some(c => c.id === id && c.kind === 'usage' && c.category === 'large'), id);
  }
});
