import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const testEntryPoints = [
  'scripts/taste-radar-render.test.ts',
  'scripts/taste-perception-dining.test.ts',
  'scripts/taste-survey-scoring.test.ts',
  'scripts/tba-food-knowledge-dataset.test.ts',
  'scripts/restaurant-feedback-sync.test.ts',
  'scripts/feedback-learning-sql.test.ts',
  'scripts/atomic-feedback-sql.test.ts',
  'scripts/native-account-photos.test.ts',
  'scripts/backend-data-safety.test.ts',
];

const outdir = 'node_modules/.cache/taste-buddy-tests';

await mkdir(outdir, { recursive: true });

for (const entryPoint of testEntryPoints) {
  const outfile = path.join(outdir, `${path.basename(entryPoint, '.ts')}.mjs`);

  await esbuild.build({
    bundle: true,
    entryPoints: [entryPoint],
    external: ['@electric-sql/pglite', 'react', 'react-dom/*'],
    format: 'esm',
    logLevel: 'silent',
    outfile,
    platform: 'node',
    target: 'node20',
  });

  await import(pathToFileURL(outfile).href);
}

for (const transportTest of ['taste-survey-storage', 'atomic-feedback-client']) {
  const surveyStorageOutfile = path.join(outdir, `${transportTest}.test.mjs`);
  await esbuild.build({
    bundle: true, entryPoints: [`scripts/${transportTest}.test.ts`],
    outfile: surveyStorageOutfile, format: 'esm', platform: 'node', target: 'node20', logLevel: 'silent',
    define: { 'import.meta.env': '{}' },
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'text' },
    plugins: [{ name: 'survey-storage-transport', setup(build) {
      build.onResolve({ filter: /^\.\/supabase$/ }, (args) => args.importer.endsWith('/tasteBuddySupabase.ts')
        ? { path: 'survey-storage-transport', namespace: 'survey-test' } : undefined);
      build.onLoad({ filter: /.*/, namespace: 'survey-test' }, () => ({
        contents: `
          export const isSupabaseConfigured = true;
          export const supabase = {
            from: (...args) => globalThis.__tasteSurveyTransport.from(...args),
            rpc: (...args) => globalThis.__tasteSurveyTransport.rpc(...args),
          };
          export const ensureSupabaseSession = async () => globalThis.__tasteSurveyTransport.session;
          export const getCurrentSupabaseSession = ensureSupabaseSession;
          export const isAnonymousSupabaseSession = () => false;
          export const uploadSupabaseFeedbackReflectionPhoto = () => { throw new Error('Unexpected photo upload'); };
        `, loader: 'js',
      }));
    } }],
  });
  await import(pathToFileURL(surveyStorageOutfile).href);
}
await import(pathToFileURL(path.resolve('scripts/taste-perception.test.mjs')).href);
await import(pathToFileURL(path.resolve('scripts/test-native-account-data.mjs')).href);
