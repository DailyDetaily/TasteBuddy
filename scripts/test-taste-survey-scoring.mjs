import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const testEntryPoints = [
  'scripts/taste-survey-scoring.test.ts',
  'scripts/tba-food-knowledge-dataset.test.ts',
  'scripts/restaurant-feedback-sync.test.ts',
  'scripts/feedback-learning-sql.test.ts',
  'scripts/backend-data-safety.test.ts',
];

const outdir = 'node_modules/.cache/taste-buddy-tests';

await mkdir(outdir, { recursive: true });

for (const entryPoint of testEntryPoints) {
  const outfile = path.join(outdir, `${path.basename(entryPoint, '.ts')}.mjs`);

  await esbuild.build({
    bundle: true,
    entryPoints: [entryPoint],
    external: ['@electric-sql/pglite'],
    format: 'esm',
    logLevel: 'silent',
    outfile,
    platform: 'node',
    target: 'node20',
  });

  await import(pathToFileURL(outfile).href);
}
