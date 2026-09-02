import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const iosRoot = path.resolve(import.meta.dirname, '..');
const outputDirectory = path.join(iosRoot, 'TasteBuddy', 'Resources', 'Fixtures');
const temporaryDirectory = path.join(iosRoot, '.fixture-build');
const bundledEntry = path.join(temporaryDirectory, 'contract-fixture-entry.mjs');

await mkdir(outputDirectory, { recursive: true });
await mkdir(temporaryDirectory, { recursive: true });

await esbuild.build({
  bundle: true,
  define: {
    'import.meta.env': '{}',
  },
  entryPoints: [path.join(import.meta.dirname, 'contract-fixture-entry.ts')],
  format: 'esm',
  loader: {
    '.jpeg': 'dataurl',
    '.jpg': 'dataurl',
    '.png': 'dataurl',
    '.svg': 'text',
  },
  logLevel: 'silent',
  outfile: bundledEntry,
  platform: 'node',
  target: 'node20',
});

const { buildContractFixtures } = await import(
  `${pathToFileURL(bundledEntry).href}?generated=${Date.now()}`
);
const fixtures = buildContractFixtures();

const outputs = [
  ['quick-calibration-golden.json', fixtures.quickCalibration],
  ['taste-survey-golden.json', fixtures.tasteSurvey],
  ['preference-intake.json', fixtures.preferenceIntake],
  ['dining-feedback-scenario.json', fixtures.diningFeedback],
  ['tba-dining-analysis-golden.json', fixtures.tbaDiningAnalysis],
  ['tba-full-engine-golden.json', fixtures.tbaFullEngine],
];

for (const [filename, payload] of outputs) {
  await writeFile(
    path.join(outputDirectory, filename),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
}

await rm(temporaryDirectory, { recursive: true, force: true });

console.log(`Generated ${outputs.length} contract fixtures in ${outputDirectory}`);
