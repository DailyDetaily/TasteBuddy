import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'plating-color-modes-test-'));
await build({ stdin: { contents: "export * from './src/constants/designTokens'; export * from './src/constants/colorModes'; export * from './src/plating/colorPairings'; export { NATIVE_COLORS } from './src/plating/foundationReferenceData';", resolveDir: process.cwd() }, outfile: path.join(dir, 'colors.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const m = await import(path.join(dir, 'colors.mjs'));
after(() => fs.rm(dir, { recursive: true, force: true }));

test('mini-chart main matches the Figma mode aliases without changing ordinary UI main', async () => {
  assert.equal(m.miniChartMainColor('umami', 'light'), '#B372B4');
  assert.equal(m.miniChartMainColor('umami', 'dark'), '#C695C7');
  assert.equal(m.TASTE_MAIN_COLORS_BY_MODE.dark.umami, '#B372B4');
  const swift = await fs.readFile('ios/TasteBuddy/DesignSystem/TBTheme.swift', 'utf8');
  assert.match(swift, /func miniChartMainColor\(in mode: TBColorMode\)/);
  assert.match(swift, /case \.umami: return mode == \.dark \? Color\(hex: 0xC695C7\) : Color\(hex: 0xB372B4\)/);
  for (const mode of ['light', 'dark']) for (const id of m.TASTE_IDS) {
    assert.equal(m.colorModeCSSVariables(mode)[`--tb-taste-${id}-chart-main`], m.miniChartMainColor(id, mode));
  }
});

test('dark chips keep a separate visible edge and a raised neutral fill', () => {
  const css = m.colorModeCSSVariables('dark');
  for (const id of m.TASTE_IDS) {
    const resolve = name => {
      const value = css[name];
      return value.startsWith('var(') ? resolve(value.slice(4, -1)) : value;
    };
    const fill = resolve(`--tb-taste-${id}-chip-background`);
    const border = resolve(`--tb-taste-${id}-chip-border`);
    assert.ok(m.colorContrast(fill, border) > 1.15, `${id}: chip edge disappeared into its fill`);
    assert.ok(m.colorContrast(fill, m.TASTE_PALETTES_BY_MODE.dark[id].tintSurfaceText) >= 4.5);
  }
  const neutral = m.NEUTRAL_CHIP_COLORS_BY_MODE.dark;
  const card = m.COLOR_TOKENS_BY_MODE.dark.surface.card;
  assert.ok(m.colorContrast(neutral.background, card) > 1.15);
  assert.ok(m.colorContrast(neutral.border, neutral.background) > 1.15);
  assert.ok(m.colorContrast(neutral.border, neutral.background) < 1.6, 'neutral edge should remain subtle');
});

test('visualization modes keep measured identity while making labels readable', () => {
  for (const mode of ['light', 'dark']) {
    const background = m.COLOR_TOKENS_BY_MODE[mode].surface.base;
    assert.equal(Object.keys(m.dataVizColors(mode)).length, 9);
    for (const id of m.TASTE_IDS) {
      const measurement = m.MEASUREMENT_PALETTES_BY_MODE[mode][id];
      assert.equal(measurement.loop.nodeColors.length, 10);
      assert.equal(measurement.loop.nodeColors[9], m.TASTE_MAIN_COLORS_BY_MODE[mode][id]);
      assert.ok(m.colorContrast(measurement.textColor, background) >= 4.5, `${mode}.${id} measurement label`);
      assert.equal(measurement.accent, mode === 'light' ? m.TASTE_TOKENS[id].measurement.accent : m.TASTE_MAIN_COLORS_BY_MODE.dark[id]);
    }
  }
  assert.equal(m.DATA_VIZ_TOKENS_BY_MODE.dark.radar.centerMask, m.COLOR_TOKENS_BY_MODE.dark.surface.base);
  assert.equal(m.NEUTRAL_TASTE_PALETTES_BY_MODE.dark.tint80, '#2F2F2F');
});

test('effect modes preserve geometry and provide the same twelve style families', () => {
  assert.equal(Object.keys(m.EFFECT_TOKENS_BY_MODE.light).length, 12);
  assert.deepEqual(Object.keys(m.EFFECT_TOKENS_BY_MODE.dark), Object.keys(m.EFFECT_TOKENS_BY_MODE.light));
  const geometry = layers => layers.map(({ color, ...rest }) => rest);
  for (const key of Object.keys(m.EFFECT_TOKENS_BY_MODE.light)) {
    assert.deepEqual(geometry(m.EFFECT_TOKENS_BY_MODE.dark[key]), geometry(m.EFFECT_TOKENS_BY_MODE.light[key]), key);
  }
});

test('opaque tint steps mix toward each mode base and retain known anchors', () => {
  assert.equal(m.TASTE_TINTS_BY_MODE.light.sour[80], '#FFF7CC');
  assert.equal(m.TASTE_TINTS_BY_MODE.dark.sour[80], '#494116');
  assert.equal(m.TASTE_TINTS_BY_MODE.dark.sweet[80], '#493516');
  for (const mode of ['light', 'dark']) for (const id of m.TASTE_IDS) {
    const tints = m.TASTE_TINTS_BY_MODE[mode][id];
    assert.equal(Object.keys(tints).length, 10);
    const base = m.TASTE_TINT_BASES[mode];
    for (const channel of [1, 3, 5]) {
      const baseValue = parseInt(base.slice(channel, channel + 2), 16);
      let previousDistance = Infinity;
      for (const step of m.TASTE_TINT_STEPS) {
        assert.match(tints[step], /^#[0-9A-F]{6}$/);
        const distance = Math.abs(parseInt(tints[step].slice(channel, channel + 2), 16) - baseValue);
        assert.ok(distance <= previousDistance, `${mode}.${id}.${step} approaches base`);
        previousDistance = distance;
      }
    }
  }
});

test('both modes preserve taste identity and distinct background/track roles', () => {
  for (const id of m.TASTE_IDS) {
    const light = m.TASTE_PALETTES_BY_MODE.light[id];
    const dark = m.TASTE_PALETTES_BY_MODE.dark[id];
    assert.deepEqual(light, m.TASTE_TOKENS[id].palette);
    assert.equal(dark.main, m.TASTE_MAIN_COLORS_BY_MODE.dark[id]);
    assert.equal(dark.main, light.main);
    assert.ok(m.colorContrast(dark.main, m.COLOR_TOKENS_BY_MODE.dark.surface.card) >= 3, `${id} dark UI accent`);
    assert.equal(dark.gradient, light.gradient);
    assert.equal(dark.tintSurface, m.TASTE_TINTS_BY_MODE.dark[id][70]);
    assert.equal(dark.chartTrack, m.TASTE_TINTS_BY_MODE.dark[id][70]);
    assert.equal(dark.tintSoft, m.TASTE_TINTS_BY_MODE.dark[id][70]);
    assert.ok(m.colorContrast(dark.tintSurfaceSubText, dark.tintSurface) >= 4.5, `${id} dark secondary text`);
  }
});

test('theme-aware UI and motion resolve shared accents, pale points and neutral points', async () => {
  const variables = m.colorModeCSSVariables('dark');
  const swift = await fs.readFile('ios/TasteBuddy/DesignSystem/TBTheme.swift', 'utf8');
  const legacyCompanions = ['#FFDEAB', '#FFF2AB', '#DCEDAB', '#D1DEFF', '#E6D1E6', '#DCD7D3'];
  for (const id of m.TASTE_IDS) {
    const original = m.TASTE_MAIN_COLORS[id];
    const accent = m.TASTE_MAIN_COLORS_BY_MODE.dark[id];
    assert.equal(variables[`--tb-taste-${id}-main`], accent);
    assert.equal(m.categoryMotionColor(original, 'dark'), accent);
    assert.equal(m.categoryMotionColor(original, 'light'), original);
    const pale = m.TASTE_TOKENS[id].palette.tintSurface;
    const legacy = legacyCompanions[m.TASTE_IDS.indexOf(id)];
    for (const source of [pale, legacy]) {
      assert.equal(m.categoryMotionColor(source.toLowerCase(), 'light'), m.TASTE_TINTS_BY_MODE.light[id][60]);
      assert.equal(m.categoryMotionColor(source.toLowerCase(), 'dark'), m.TASTE_TINTS_BY_MODE.dark[id][70]);
      assert.ok(swift.includes(`case "${source}": return mode == .dark ? "${m.TASTE_TINTS_BY_MODE.dark[id][70]}" : "${m.TASTE_TINTS_BY_MODE.light[id][60]}"`));
    }
    assert.equal(variables[`--tb-taste-${id}-motion-companion`], `var(--tb-taste-${id}-tint-70)`);
    assert.equal(m.colorModeCSSVariables('light')[`--tb-taste-${id}-motion-companion`], `var(--tb-taste-${id}-tint-60)`);
  }
  for (const source of ['#E4E0DA', '#DEDAD5', '#E8E8E8']) {
    assert.equal(m.categoryMotionColor(source, 'light'), '#D0D0D0');
    assert.equal(m.categoryMotionColor(source, 'dark'), '#A3A3A3');
  }
  assert.equal(m.categoryMotionColor('#E4E4E4', 'light'), '#E4E4E4');
  assert.equal(m.categoryMotionColor('#E4E4E4', 'dark'), '#343434');
  assert.ok(swift.includes('case "#E4E4E4": return mode == .dark ? "#343434" : "#E4E4E4"'));
  assert.equal(m.categoryMotionColor('#123456', 'dark'), '#123456', 'unmapped artwork colors stay unchanged');
});

test('documented text, state, action and taste pairs meet contrast in both modes', () => {
  for (const mode of ['light', 'dark']) {
    for (const pair of m.documentedColorPairs(mode)) {
      assert.ok(m.colorContrast(pair.foreground, pair.background) >= 4.5, `${mode} ${pair.name}`);
    }
    const c = m.COLOR_TOKENS_BY_MODE[mode];
    for (const bg of [c.background.page, c.background.focus, c.surface.base, c.surface.elevated, c.surface.cardHover]) {
      assert.ok(m.colorContrast(c.text.hint, bg) >= 4.5, `${mode} hint on ${bg}`);
      assert.ok(m.colorContrast(c.interaction.focus, bg) >= 3, `${mode} focus on ${bg}`);
    }
  }
});

test('each explicit CSS mode resolves aliases locally and matches palette values', async () => {
  const css = await fs.readFile('src/styles/color-modes.css', 'utf8');
  for (const mode of ['light', 'dark']) {
    const body = css.match(new RegExp(`\\[data-tb-theme="${mode}"\\] \\{([\\s\\S]*?)\\n\\}`))[1];
    const vars = Object.fromEntries([...body.matchAll(/(--tb-[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
    const resolve = (key, seen = new Set()) => {
      assert.ok(!seen.has(key), `alias cycle: ${key}`);
      seen.add(key);
      assert.ok(vars[key], `${mode} missing ${key}`);
      const alias = vars[key].match(/^var\((--tb-[\w-]+)\)$/);
      return alias ? resolve(alias[1], seen) : vars[key];
    };
    for (const id of m.TASTE_IDS) {
      for (const step of m.TASTE_TINT_STEPS) assert.equal(resolve(`--tb-taste-${id}-tint-${step}`), m.TASTE_TINTS_BY_MODE[mode][id][step]);
      for (const role of ['tintSurface', 'chartTrack', 'tintSoft', 'tintSoftBorder', 'borderSubtle', 'borderDefault', 'borderStrong', 'borderAccent', 'tintSurfaceText', 'tintSurfaceSubText']) {
        assert.equal(resolve(`--tb-taste-${id}-${role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`), m.TASTE_PALETTES_BY_MODE[mode][id][role]);
      }
    }
  }
});

test('native dark color roles carry the same opaque and alpha values', async () => {
  for (const role of m.NATIVE_COLORS) {
    assert.equal(m.nativeColorForMode(role.name, 'light'), role.value, `${role.name} preserves native Light`);
    assert.ok(m.nativeColorForMode(role.name, 'dark'), `${role.name} has a Dark counterpart`);
  }
  const swift = await fs.readFile('ios/TasteBuddy/DesignSystem/TBTheme.swift', 'utf8');
  const block = swift.split('enum TBDarkColor {')[1].split('\n}')[0];
  const values = Object.fromEntries([...block.matchAll(/static let (\w+) = Color\(hex: 0x([\dA-F]{6})(?:, alpha: ([\d.]+))?\)/g)].map(([, name, hex, alpha]) => [name, alpha ? `rgba(${[0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ')}, ${alpha})` : '#' + hex]));
  assert.equal(Object.keys(values).length, Object.keys(m.NATIVE_COLOR_PATHS).length);
  for (const name of Object.keys(values)) assert.equal(values[name], m.nativeColorForMode(name, 'dark'), name);
});
