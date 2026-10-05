import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { motion, renderPlatingMotionCss } from './build-plating-motion.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('generated CSS is the same contract as the browser and remains wired to the product card', async () => {
  assert.equal(await read('src/styles/plating-motion.css'), renderPlatingMotionCss());
  assert.match(await read('src/index.css'), /@import "\.\/styles\/plating-motion.css"/);
  assert.equal(motion.PLATING_MOTION_RECIPES.resultBloom.selector, '.dining-result-card-bloom');
  assert.doesNotMatch(await read('src/styles/globals.css'), /@keyframes dining-result-card-bloom-enter/);
});

test('moving the existing result-card animation keeps its time, curve and all four poses', () => {
  const recipe = motion.PLATING_MOTION_RECIPES.resultBloom;
  assert.equal(recipe.durationMs, 860);
  assert.equal(recipe.delayMs, 120);
  assert.equal(recipe.easing, 'cubic-bezier(0.18, 0.92, 0.2, 1)');
  assert.equal(recipe.origin, '50% 58%');
  assert.deepEqual(recipe.frames.map(({ offset, values }) => [offset, values]), [
    [0, { opacity: 0, filter: 'blur(8px)', transform: 'translate3d(0, 24px, 0) scale(0.88)' }],
    [0.46, { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, -4px, 0) scale(1.018)' }],
    [0.72, { transform: 'translate3d(0, 1px, 0) scale(0.996)' }],
    [1, { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0, 0, 0) scale(1)' }],
  ]);
});

test('every reduced-motion effect reaches the same final state without a delay, even in a staggered list', () => {
  for (const [name, recipe] of Object.entries(motion.PLATING_MOTION_RECIPES)) {
    assert.equal(recipe.frames[0].offset, 0);
    assert.equal(recipe.frames.at(-1).offset, 1);
    assert.ok(recipe.frames.every((frame, index) => index === 0 || frame.offset > recipe.frames[index - 1].offset));
    const reduced = motion.getPlatingMotion(name, { reducedMotion: true, index: 100 });
    assert.equal(reduced.options.duration, 0);
    assert.equal(reduced.options.delay, 0);
    assert.equal(reduced.options.iterations, 1);
    assert.deepEqual(reduced.keyframes[0], { ...recipe.frames.at(-1).values, offset: 0 });
    assert.deepEqual(reduced.keyframes[1], { ...recipe.frames.at(-1).values, offset: 1 });
  }
});

test('stagger is bounded and invalid indices cannot create negative or unbounded animation clocks', () => {
  assert.equal(motion.getPlatingMotion('questionEnter', { index: 1 }).options.delay, 60);
  assert.equal(motion.getPlatingMotion('questionEnter', { index: 1000 }).options.delay, 240);
  for (const index of [-1, NaN, Infinity]) assert.equal(motion.getPlatingMotion('questionEnter', { index }).options.delay, 0);
  const { keyframes, options } = motion.getPlatingMotion('resultBloom');
  assert.equal(options.easing, 'linear'); // No double-easing of already eased intervals.
  assert.ok(keyframes.every((frame) => frame.easing === motion.PLATING_MOTION_RECIPES.resultBloom.easing));
});

test('the five role times stay aligned with the existing iOS duration source', async () => {
  const swift = await read('ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift');
  const durations = { press: 'press', feedback: 'fast', content: 'normal', sheet: 'medium', bloom: 'slowest' };
  for (const [role, token] of Object.entries(durations)) {
    const seconds = Number(swift.match(new RegExp(`static let ${token}: Double = ([0-9.]+)`))[1]);
    assert.equal(motion.PLATING_MOTION_ROLES[role].durationMs, seconds * 1000);
  }
  assert.match(swift, /typealias PlatingMotion = TasteBloomMotion/);
});

test('signature landmarks agree with the actual Remotion sequence functions', async () => {
  const bundled = await build({
    stdin: { contents: "export * from './brand-launch/src/TabBarCameraEntry/result-card-motion.ts'; export * from './brand-launch/src/DiningFeedbackMotion/chip-motion.ts';", resolveDir: fileURLToPath(new URL('../', import.meta.url)) },
    bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent',
  });
  const source = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
  const [bloom, sauce] = motion.PLATING_SIGNATURE_MOTIONS;
  assert.equal(bloom.landmarks.at(-1).timeMs, source.RESULT_CARD_ENTRANCE_SECONDS * 1000);
  assert.equal(source.resultCardBloom(0.6).merge, 1);
  assert.equal(source.resultCardBloom(1).inner, 1);
  assert.equal(source.resultCardBloom(1.36).reveal.photo, 1);
  assert.equal(sauce.landmarks.at(-1).timeMs, source.chipRowDuration(2) * 1000);
  assert.equal(sauce.landmarks[2].timeMs, Math.round(source.chipStart(1) * 1000));
  assert.equal(sauce.landmarks[3].timeMs, Math.round(source.chipPeak(0) * 1000));
});
