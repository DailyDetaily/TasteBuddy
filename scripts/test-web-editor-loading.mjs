import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-editor-loading-'));
after(() => fs.rm(directory, {recursive: true, force: true}));
const output = path.join(directory, 'render.cjs');
await build({
  stdin: {contents: `import React from 'react';
    import {renderToString} from 'react-dom/server';
    import Editor from './src/components/dining-native/NativeDiningEditor';
    import {useNativePreferences} from './src/lib/gastronomy/useNativePreferences';
    export * from './src/lib/gastronomy/nativeRecord';
    export const renderEditor = original => renderToString(React.createElement(Editor,
      {original, owner:'guest', entries:[original], onSave:async()=>{}, onClose:()=>{}}));
    export function readPreferences() {
      let value;
      function Reader(){value=useNativePreferences('account-A');return null;}
      renderToString(React.createElement(Reader));
      return value;
    }`, resolveDir: process.cwd(), loader: 'tsx'},
  outfile: output, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
  plugins: [{name: 'ui-dependencies', setup(b) {
    b.onResolve({filter: /^(\.\/NativeDiningHome|\.\/NativePhotoHints|\.\.\/reservation\/DiningFeedbackFlow|\.\.\/gastronomy\/TasteDataPage|\.\.\/\.\.\/lib\/tasteBuddySupabase)$/},
      a => ({path: a.path, namespace: 'ui-stub'}));
    b.onLoad({filter: /.*/, namespace: 'ui-stub'}, () => ({loader: 'js', contents:
      'export const NativeRecordPhoto=()=>null;export const TasteExperienceMap=()=>null;export const findTasteExperience=()=>null;export const DetailHeader=()=>null;export const searchKakaoRestaurantPlaces=async()=>[];export default ()=>null;'}));
    b.onResolve({filter: /^\.\/useNativeJournal$/}, () => ({path: 'journal', namespace: 'journal-stub'}));
    b.onLoad({filter: /.*/, namespace: 'journal-stub'}, () => ({loader: 'js', contents:
      'export const useNativeJournal=()=>globalThis.__editorLoadingJournal;'}));
  }}],
});
const m = createRequire(import.meta.url)(output);

test('legacy records with omitted or null dish kinds render without altering the original', () => {
  for (const value of [undefined, null]) {
    const record = {...m.newNativeRecord(), menu: '기존 국수', dishKindIDs: value};
    const snapshot = {...m.blankSnapshot(), values: {[m.DINING_KEY]: m.encodeNativeValue([record])}};
    const original = m.readNativeRecords(snapshot)[0], before = m.canonical(original);
    const html = m.renderEditor(original);
    assert.match(html, /기존 국수/);
    assert.equal(m.canonical(original), before);
  }
});

test('initial preference load failure is exposed and a cached profile stays editable offline', () => {
  const error = '계정 기록을 불러오지 못했어요.';
  try {
    globalThis.__editorLoadingJournal = {archive: null, error, loading: false};
    assert.equal(m.readPreferences().error, error);
    assert.equal(m.readPreferences().ready, false);
    globalThis.__editorLoadingJournal = {archive: {snapshot: m.blankSnapshot()}, error, loading: false};
    assert.equal(m.readPreferences().error, error);
    assert.equal(m.readPreferences().ready, true);
  } finally {
    delete globalThis.__editorLoadingJournal;
  }
});
