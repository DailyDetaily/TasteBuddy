import { bundle } from '@remotion/bundler';
import { getCompositions, openBrowser, renderStill, renderMedia } from '@remotion/renderer';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/category-collection-20260923/cross-center-slow-ease-15');
const starts = [228, 339, 450, 561];
await mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, 'src/index.ts'),
  outDir: await mkdtemp(path.join(os.tmpdir(), 'tb-particle-reassembly-')),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser('chrome', { chromiumOptions: { gl: 'angle' } });
try {
  const all = await getCompositions(serveUrl, { puppeteerInstance: browser, timeoutInMilliseconds: 120000 });
  const composition = all.find(({ id }) => id === 'TasteCategory-Collection');
  if (!composition || composition.width !== 1080 || composition.height !== 1080 || composition.durationInFrames !== 678) {
    throw new Error('Unexpected TasteCategory-Collection registration');
  }
  const frames = [];
  for (let transition = 0; transition < starts.length; transition++) {
    for (const local of [-1, 0, 13, 22, 33, 44, 45]) {
      const frame = starts[transition] + local;
      const file = path.join(output, `transition-${transition + 1}-${String(local + 1).padStart(2, '0')}.png`);
      await renderStill({ serveUrl, composition, puppeteerInstance: browser, frame, imageFormat: 'png', output: file });
      frames.push({ transition: transition + 1, frame, local, file });
      console.log(`STILL ${transition + 1} ${local} ${frame}`);
    }
  }
  const clip = path.join(output, 'TasteCategory-Collection-CrossCenterSlowEase15Preview.mp4');
  let lastBucket = -1;
  await renderMedia({
    serveUrl,
    composition,
    puppeteerInstance: browser,
    codec: 'h264',
    outputLocation: clip,
    concurrency: 2,
    muted: true,
    onProgress: ({ progress }) => {
      const bucket = Math.floor(progress * 10);
      if (bucket !== lastBucket) { console.log(`VIDEO ${bucket * 10}%`); lastBucket = bucket; }
    },
  });
  await writeFile(path.join(output, 'render-check.json'), JSON.stringify({
    composition: { id: composition.id, width: composition.width, height: composition.height, fps: composition.fps, durationInFrames: composition.durationInFrames },
    clip,
    frames,
  }, null, 2));
  console.log(`VERIFIED_VIDEO ${clip}`);
} finally {
  await browser.close({ silent: true });
}
