import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { build } from 'esbuild';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'plating-colors-'));
await build({ stdin: { contents: "export * from './src/plating/colorPairings.ts';export * from './src/plating/foundationReferenceData.ts';", resolveDir: process.cwd() }, outfile: path.join(dir, 'colors.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const m = await import(path.join(dir, 'colors.mjs'));
const normalize = value => value.toLowerCase().replaceAll(/\s/g, '');

test('native semantic values match the exported mirror and CSS metadata', async () => {
  const native = await fs.readFile('ios/TasteBuddy/DesignSystem/TBDesignColorTokens.swift', 'utf8');
  const mirror = new Map([...native.matchAll(/token\("([^\"]+)\", \"([^\"]+)\", \"([^\"]+)\"/g)].map(([, name, variable, value]) => [name, { variable, value }]));
  const nativeCSS = new Map([...native.matchAll(/css\("([^\"]+)\", \"([^\"]+)\"/g)].map(([, name, value]) => [name, value]));
  const aliases = {
    surface: 'surface.base', surfaceHover: 'surface.cardHover', mutedSurface: 'surface.muted', elevatedSurface: 'surface.elevated',
    disabledSurface: 'surface.disabled', overlaySurface: 'surface.overlay', placeholderSurface: 'surface.placeholder', inverseSurface: 'surface.inverse',
    actionPrimary: 'interaction.primary', actionOnPrimary: 'interaction.onPrimary', selectionSurface: 'interaction.selected', selectionText: 'interaction.onSelected',
    focusRing: 'interaction.focus', hoverOverlay: 'interaction.hoverOverlay', pressedOverlay: 'interaction.pressedOverlay', pressedInverseOverlay: 'interaction.pressedInverseOverlay',
  };
  for (const color of m.NATIVE_COLORS) {
    let key = aliases[color.name];
    if (!key) {
      const suffix = ['text', 'border', 'icon', 'scrim'].includes(color.group) ? color.name.slice(color.group.length) : color.name;
      const name = suffix ? suffix[0].toLowerCase() + suffix.slice(1) : 'default';
      key = `${color.group}.${name}`;
    }
    const matching = mirror.get(key);
    assert.ok(matching, `${key} missing in native mirror`);
    assert.equal(normalize(matching.value), normalize(color.value), key);
    assert.equal(normalize(nativeCSS.get(matching.variable)), normalize(color.value), `native CSS ${matching.variable}`);
  }
});

test('documented foreground/background pairs meet small-text contrast', () => {
  assert.equal(m.colorContrast('#000000', '#FFFFFF'), 21);
  assert.equal(m.colorContrast('#FFFFFF', '#FFFFFF'), 1);
  for (const pair of m.documentedColorPairs()) {
    assert.ok(m.colorContrast(pair.foreground, pair.background) >= 4.5, `${pair.name}: ${m.colorContrast(pair.foreground, pair.background)}`);
  }
});

const mix = (background, foreground, alpha) => '#' + [1, 3, 5].map(offset => Math.round(parseInt(background.slice(offset, offset + 2), 16) * (1 - alpha) + parseInt(foreground.slice(offset, offset + 2), 16) * alpha).toString(16).padStart(2, '0')).join('');
test('state text remains readable in hover and pressed composites', () => {
  for (const pair of m.stateColorPairs) {
    const foreground = m.nativeColor(pair.foreground);
    const background = m.nativeColor(pair.background);
    for (const alpha of [0.04, 0.06]) {
      const pressed = mix(background, '#000000', alpha);
      assert.ok(m.colorContrast(foreground, pressed) >= 4.5, `${pair.name}: background overlay ${alpha}`);
      assert.ok(m.colorContrast(mix(foreground, '#000000', alpha), pressed) >= 4.5, `${pair.name}: whole control overlay ${alpha}`);
    }
  }
  for (const surface of ['actionPrimary', 'selectionSurface', 'successStrong', 'warningStrong']) {
    assert.ok(m.colorContrast('#FFFFFF', mix(m.nativeColor(surface), '#FFFFFF', 0.1)) >= 4.5, `inverted press: ${surface}`);
  }
  for (const surface of ['surface', 'page', 'mutedSurface']) {
    assert.ok(m.colorContrast(m.nativeColor('focusRing'), m.nativeColor(surface)) >= 3, `focus on ${surface}`);
    assert.ok(m.colorContrast(m.nativeColor('textHint'), m.nativeColor(surface)) >= 4.5, `hint on ${surface}`);
  }
});

test('the six native taste palettes retain their identity and readable text pairs', () => {
  const expected = { sweet: '#FF9900', sour: '#FBC02D', bitter: '#95C900', salty: '#7299FF', umami: '#B372B4', fat: '#95867A' };
  assert.equal(m.IOS_FOUNDATIONS.tastes.length, 6);
  for (const taste of m.IOS_FOUNDATIONS.tastes) {
    assert.equal(taste.main, expected[taste.id], taste.id);
    assert.ok(m.colorContrast(taste.tintText, taste.tintSurface) >= 4.5, `${taste.label} small text`);
  }
});
