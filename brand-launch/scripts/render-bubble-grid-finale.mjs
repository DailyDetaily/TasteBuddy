import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderStill, renderMedia} from '@remotion/renderer';
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {root, dir, load, motion, settings, visible, gapStats} from './bubble-grid-test-helpers.mjs';

const {FINALE} = load(path.join(dir, 'finale.ts'));
const out = path.join(root, 'output/taste-bubble-map/full-grid-15deg-20260924');
await mkdir(out, {recursive: true});
const frameAt = t => Math.ceil((motion.INTRO_SECONDS + t) * 30);
const last = motion.bubbleMapDuration(settings.bubbleMapDefaults) - 1;
const jobs = [
  [345, '01-selection-preserved'],
  [frameAt(FINALE.start), '02-zoom-turn-start'],
  [frameAt((FINALE.start + FINALE.settled) / 2), '03-zoom-turn-middle'],
  [frameAt((FINALE.settled + FINALE.exitStart) / 2), '04-full-grid-hold'],
  [frameAt(FINALE.exitStart + .22), '05-center-exit-start'],
  [frameAt(FINALE.exitStart + .48), '06-center-exit-end'],
  [last, '07-empty-background'],
];
const serveUrl = await bundle({
  entryPoint: path.join(root, 'src/index.ts'),
  outDir: await mkdtemp(path.join(os.tmpdir(), 'tb-full-grid-finale-')),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
try {
  const comps = await getCompositions(serveUrl, {puppeteerInstance: browser, timeoutInMilliseconds: 120000});
  const composition = comps.find(c => c.id === 'TasteBubbleMap');
  if (!composition || composition.durationInFrames !== last + 1) throw new Error('Unexpected composition duration');
  const manifest = {composition: {id: composition.id, width: composition.width, height: composition.height, fps: composition.fps, durationInFrames: composition.durationInFrames}, stills: [], video: null};
  for (const [frame, name] of jobs) {
    const output = path.join(out, name + '.png');
    await renderStill({serveUrl, composition, puppeteerInstance: browser, frame, imageFormat: 'png', output});
    const state = motion.bubbleMapFrame(frame, settings.bubbleMapDefaults);
    const drawn = visible(state).filter(b => b.renderOpacity > .0001 && b.screenRadius > .001);
    const audit = {frame, name, output, phase: state.finalePhase, degrees: state.rotationDegrees, active: state.activeCellCount, drawn: drawn.length, physics: state.physicsCellCount};
    if (state.finalePhase === 'grid-hold') audit.minimumSurfaceGap = gapStats(state.bubbles).minimum;
    manifest.stills.push(audit);
    console.log('STILL', JSON.stringify(audit));
  }
  if (!process.argv.includes('--stills-only')) {
    const outputLocation = path.join(out, 'TasteBubbleMap-FullGrid15-Finale.mp4');
    const frameRange = [frameAt(11.2), last];
    let previous = -1;
    await renderMedia({
      serveUrl, composition, puppeteerInstance: browser, outputLocation,
      frameRange, codec: 'h264', concurrency: 2, muted: true,
      onProgress: ({progress}) => {
        const step = Math.floor(progress * 5);
        if (step !== previous) { console.log('VIDEO', step * 20 + '%'); previous = step; }
      },
    });
    manifest.video = {path: outputLocation, frameRange};
    console.log('VIDEO_DONE', outputLocation);
  }
  await writeFile(path.join(out, 'verification.json'), JSON.stringify(manifest, null, 2) + '\n');
} finally {
  await browser.close({silent: true});
}
