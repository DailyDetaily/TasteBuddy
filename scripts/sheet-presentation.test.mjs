import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { SHEET_PRESENTATION_TOKENS, renderSheetPresentationTokensCss } from './build-plating-motion.mjs';

const bundled = await build({ entryPoints: ['src/lib/sheetPresentation.ts'], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' });
const { getSheetBackgroundPresentation, getSheetBackgroundStyle } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

test('web extraction preserves the existing closed, open and dragged geometry', () => {
  assert.equal(getSheetBackgroundStyle(0).transform, 'translate3d(0, 0px, 0) scale(1)');
  assert.equal(getSheetBackgroundStyle(1).transform, 'translate3d(0, 30px, 0) scale(0.9)');
  assert.equal(getSheetBackgroundStyle(1).borderRadius, '24px');
  assert.equal(getSheetBackgroundStyle(1).boxShadow, '0 20px 60px rgba(0,0,0,0.24)');
  const half = getSheetBackgroundPresentation(0.5);
  assert.deepEqual(half, { scale: 0.95, offsetY: 15, radius: 12, dimOpacity: 0.3, shadowY: 10, shadowBlur: 30, shadowOpacity: 0.12 });
  assert.equal(getSheetBackgroundStyle(0.5, true).transition, 'none');
  assert.match(getSheetBackgroundStyle(1).transition, /transform 620ms.*border-radius 720ms/);
});

test('native card uses the presenter safe area; reducing motion keeps only dimming', () => {
  const open = getSheetBackgroundPresentation(1, { platform: 'native', safeAreaTop: 62 });
  assert.deepEqual(open, { scale: 0.9, offsetY: 72, radius: 20, dimOpacity: 0.6, shadowY: 0, shadowBlur: 0, shadowOpacity: 0 });
  for (const platform of ['web', 'native']) {
    const reduced = getSheetBackgroundPresentation(1, { platform, safeAreaTop: 62, reducedMotion: true });
    assert.equal(reduced.scale, 1);
    assert.equal(reduced.offsetY, 0);
    assert.equal(reduced.radius, 0);
    assert.equal(reduced.dimOpacity, 0.6);
  }
});

test('cancelled and out-of-bounds drags cannot leave a displaced background', () => {
  for (const progress of [-1, NaN, Infinity]) assert.deepEqual(getSheetBackgroundPresentation(progress), getSheetBackgroundPresentation(0));
  assert.deepEqual(getSheetBackgroundPresentation(2), getSheetBackgroundPresentation(1));
  for (const progress of [0.2, 0.6, 1, 0.8, 0.4, 0]) {
    const value = getSheetBackgroundPresentation(progress);
    assert.ok(value.scale >= 0.9 && value.scale <= 1);
    assert.ok(value.dimOpacity >= 0 && value.dimOpacity <= 0.6);
  }
  assert.equal(getSheetBackgroundStyle(0).boxShadow, 'none');
});

test('Figma CSS syntax and native token values stay tied to the current token source', async () => {
  assert.equal(await readFile('src/styles/sheet-presentation-tokens.css', 'utf8'), renderSheetPresentationTokensCss());
  const swift = await readFile('ios/TasteBuddy/DesignSystem/TBTheme.swift', 'utf8');
  for (const [group, fields] of Object.entries(SHEET_PRESENTATION_TOKENS.native)) {
    const name = group[0].toUpperCase() + group.slice(1);
    const block = swift.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\n    \\}`))[1];
    for (const [field, value] of Object.entries(fields)) {
      assert.equal(Number(block.match(new RegExp(`static let ${field}: CGFloat = ([0-9.]+)`))[1]), value, `${group}.${field}`);
    }
  }
});
