import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const outfile = 'node_modules/.cache/taste-buddy-tests/taste-survey-scoring.test.mjs';

await mkdir('node_modules/.cache/taste-buddy-tests', { recursive: true });

await esbuild.build({
  bundle: true,
  entryPoints: ['scripts/taste-survey-scoring.test.ts'],
  format: 'esm',
  logLevel: 'silent',
  outfile,
  platform: 'node',
  target: 'node20',
});

await import(pathToFileURL(outfile).href);
