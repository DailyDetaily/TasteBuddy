import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');
const iosRoot = path.join(workspaceRoot, 'ios');
const outputDirectory = path.join(iosRoot, 'TasteBuddy', 'Resources', 'TBA');
const temporaryDirectory = path.join(iosRoot, '.tba-bundle-build');
const bundledEntry = path.join(temporaryDirectory, 'tba-native-bundle-entry.mjs');
const fullKnowledgeSource = path.join(
  workspaceRoot,
  'data',
  'food-knowledge',
  'tba',
  'tba-food-knowledge-bridge.json',
);

await mkdir(outputDirectory, { recursive: true });
await mkdir(temporaryDirectory, { recursive: true });

await esbuild.build({
  bundle: true,
  entryPoints: [path.join(import.meta.dirname, 'tba-native-bundle-entry.ts')],
  format: 'esm',
  logLevel: 'silent',
  outfile: bundledEntry,
  platform: 'node',
  target: 'node20',
});

const { buildTbaNativeBundle } = await import(
  `${pathToFileURL(bundledEntry).href}?generated=${Date.now()}`
);
const bundle = buildTbaNativeBundle();

await writeFile(
  path.join(outputDirectory, 'tba-native-runtime.json'),
  `${JSON.stringify(bundle)}\n`,
  'utf8',
);
await copyFile(
  fullKnowledgeSource,
  path.join(outputDirectory, 'tba-food-knowledge-full.json'),
);
await rm(temporaryDirectory, { recursive: true, force: true });

console.log(
  `Generated TBA native runtime (${bundle.foodKnowledgeRuntime.entries.length} fast / ${bundle.foodKnowledgeRuntime.sourceCount} full entries)`,
);
