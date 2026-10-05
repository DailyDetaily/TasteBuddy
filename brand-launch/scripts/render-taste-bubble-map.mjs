import { bundle } from '@remotion/bundler';
import { getCompositions, openBrowser, renderStill, renderMedia } from '@remotion/renderer';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/taste-bubble-map/render');
const stillsOnly = process.argv.includes('--stills-only');
await mkdir(output, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'),
  outDir: await mkdtemp(path.join(os.tmpdir(), 'tb-bubble-map-render-')), rspack: true, symlinkPublicDir: true });
const browser = await openBrowser('chrome', { chromiumOptions: { gl: 'angle' } });
try {
  const comps = await getCompositions(serveUrl, { puppeteerInstance: browser, timeoutInMilliseconds: 120000 });
  const variants = ['TasteBubbleMap', 'TasteBubbleMap-Idle', 'TasteBubbleMap-Reduced'].map(id => {
    const c = comps.find(c => c.id === id);
    if (!c || c.width !== 1080 || c.height !== 1080) throw new Error(`Missing square composition ${id}`);
    return c;
  });
  console.log('COMPOSITIONS', JSON.stringify(variants.map(({ id, width, height, fps, durationInFrames }) => ({ id, width, height, fps, durationInFrames }))));
  const manifest = { compositions: variants.map(({ id, fps, durationInFrames }) => ({ id, fps, durationInFrames })), frames: [], video: null };
  for (const comp of variants) {
    const frames = comp.id === 'TasteBubbleMap'
      ? [0, 5, 6, 12, 20, 36, 52, 96, 165, 260, 357, 375, 405, 423, 447, 480, 522, 552, comp.durationInFrames - 1]
      : comp.id.endsWith('Idle') ? [0, 419] : [0];
    for (const frame of frames) {
      const file = path.join(output, `${comp.id}-${String(frame).padStart(3, '0')}.png`);
      await renderStill({ serveUrl, composition: comp, puppeteerInstance: browser, frame, imageFormat: 'png', output: file });
      manifest.frames.push({ id: comp.id, frame, file });
      console.log('STILL', comp.id, frame);
    }
  }
  if (!stillsOnly) {
    const video = path.join(output, 'TasteBubbleMap.mp4');
    let last = -1;
    await renderMedia({ serveUrl, composition: variants[0], puppeteerInstance: browser, codec: 'h264',
      outputLocation: video, concurrency: 2, muted: true,
      onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (last !== p) { console.log('VIDEO', p * 10 + '%'); last = p; } } });
    manifest.video = video;
    console.log('VIDEO_DONE', video);
  }
  await writeFile(path.join(output, 'render-check.json'), JSON.stringify(manifest, null, 2));
} finally { await browser.close({ silent: true }); }
