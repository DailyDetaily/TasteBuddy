import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {completeRefreshState, emptyCapture, hashInputs, inspectReadiness, pngDimensions, publishCapture, run, serializeCapture,
  SourceChangedError, validateCapture} from './native-ui.mjs';

async function temporary(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taste-buddy-native-ui-'));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  return directory;
}

function png(width = 1260, height = 2736) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function publicationFixture(t) {
  const root = await temporary(t);
  const publicDir = path.join(root, 'public');
  const nativeDir = path.join(publicDir, 'native');
  const manifestPath = path.join(nativeDir, 'manifest.json');
  const generatedPath = path.join(root, 'native-ui.ts');
  const stagedScreens = {dining: path.join(root, 'dining.png'), feedback: path.join(root, 'feedback.png'), analysis: path.join(root, 'analysis.png')};
  await fs.mkdir(nativeDir, {recursive: true});
  for (const file of Object.values(stagedScreens)) await fs.writeFile(file, png());
  const prior = emptyCapture();
  await fs.writeFile(manifestPath, JSON.stringify(prior));
  await fs.writeFile(generatedPath, serializeCapture(prior));
  return {root, publicDir, nativeDir, manifestPath, generatedPath, stagedScreens, sourceHash: 'source-a', revision: 'revision-a', getCurrentHash: async () => 'source-a'};
}

test('source hash uses file contents and paths; mtime alone does not invalidate a capture', async (t) => {
  const root = await temporary(t);
  await fs.mkdir(path.join(root, 'ios'));
  await fs.writeFile(path.join(root, 'ios', 'View.swift'), 'let title = "취향"');
  const initial = await hashInputs(root, ['ios']);
  await fs.utimes(path.join(root, 'ios', 'View.swift'), new Date(0), new Date(0));
  assert.equal(await hashInputs(root, ['ios']), initial);
  await fs.writeFile(path.join(root, 'ios', 'View.swift'), 'let title = "한 끼"');
  const edited = await hashInputs(root, ['ios']);
  assert.notEqual(edited, initial);
  await fs.rename(path.join(root, 'ios', 'View.swift'), path.join(root, 'ios', 'Screen.swift'));
  assert.notEqual(await hashInputs(root, ['ios']), edited);
  const renamed = await hashInputs(root, ['ios']);
  await fs.writeFile(path.join(root, 'ios', 'Added.swift'), 'struct Added {}');
  assert.notEqual(await hashInputs(root, ['ios']), renamed);
  await fs.rm(path.join(root, 'ios', 'Added.swift'));
  assert.equal(await hashInputs(root, ['ios']), renamed);
});

test('source hash deduplicates paths and has stable ordering', async (t) => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, 'a.svg'), '<svg/>');
  await fs.writeFile(path.join(root, 'b.swift'), 'struct B {}');
  assert.equal(await hashInputs(root, ['a.svg', 'b.swift']), await hashInputs(root, ['b.swift', 'a.svg', 'a.svg']));
});

test('a save after the final capture hash check queues another refresh even without a watch event', async (t) => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, 'View.swift'), 'old UI');
  const capturedHash = await hashInputs(root, ['View.swift']);
  // 캡처 발행의 마지막 검사 이후, watcher 완료 처리 직전에 저장되는 경우를 재현합니다.
  await fs.writeFile(path.join(root, 'View.swift'), 'new UI');
  const latestHash = await hashInputs(root, ['View.swift']);
  const state = completeRefreshState({attemptedHash: capturedHash, capturedHash, latestHash, queued: false});
  assert.equal(state.lastSeenHash, capturedHash);
  assert.equal(state.queued, true);
  assert.notEqual(latestHash, state.lastSeenHash, '다음 이벤트와 content-hash poll도 새 저장을 감지할 수 있어야 합니다.');
  const refreshed = completeRefreshState({attemptedHash: latestHash, capturedHash: latestHash, latestHash, queued: false});
  assert.equal(refreshed.queued, false);
  assert.equal(refreshed.lastSeenHash, latestHash);
});

test('an unchanged failed attempt does not retry forever but a later save still queues', () => {
  assert.deepEqual(completeRefreshState({attemptedHash: 'failed-source', latestHash: 'failed-source', queued: false}), {lastSeenHash: 'failed-source', queued: false});
  assert.deepEqual(completeRefreshState({attemptedHash: 'failed-source', latestHash: 'new-source', queued: false}), {lastSeenHash: 'failed-source', queued: true});
});

const ready = {schemaVersion: 1, token: 'new-launch', screen: 'analysis', status: 'ready', source: 'ios-swiftui', observationCount: 9, insightCount: 0, candidateCount: 1};
const expected = {token: 'new-launch', screen: 'analysis'};

test('readiness requires the current launch token, screen, schema and native origin', () => {
  assert.equal(inspectReadiness(ready, expected).state, 'ready');
  for (const change of [{token: 'old-launch'}, {screen: 'dining'}, {schemaVersion: 0}, {source: 'web'}]) {
    assert.equal(inspectReadiness({...ready, ...change}, expected).state, 'waiting');
  }
  assert.equal(inspectReadiness({...ready, token: 'old-launch', status: 'error'}, expected).state, 'waiting');
});

test('readiness accepts actual insight candidates and fails on empty data or an app error', () => {
  assert.equal(inspectReadiness({...ready, insightCount: 2, candidateCount: 0}, expected).state, 'ready');
  assert.equal(inspectReadiness({...ready, observationCount: 0}, expected).state, 'error');
  assert.equal(inspectReadiness({...ready, candidateCount: 0}, expected).state, 'error');
  assert.deepEqual(inspectReadiness({...ready, status: 'error', error: '사진을 읽지 못했습니다.'}, expected), {state: 'error', message: '사진을 읽지 못했습니다.'});
});

test('publish commits all three images as one revision and updates HMR metadata last', async (t) => {
  const fixture = await publicationFixture(t);
  const capture = await publishCapture(fixture);
  assert.equal(capture.status, 'ready');
  assert.equal(capture.screens.dining.src, 'native/revision-a-dining.png');
  assert.equal(capture.screens.analysis.src, 'native/revision-a-analysis.png');
  assert.deepEqual(JSON.parse(await fs.readFile(fixture.manifestPath, 'utf8')), capture);
  assert.equal(await fs.readFile(fixture.generatedPath, 'utf8'), serializeCapture(capture));
  assert.deepEqual(await validateCapture({capture, sourceHash: fixture.sourceHash, publicDir: fixture.publicDir, generatedFile: fixture.generatedPath}), {ok: true});
});

test('missing required screenshot cannot replace the previously published metadata', async (t) => {
  const fixture = await publicationFixture(t);
  const before = await fs.readFile(fixture.manifestPath, 'utf8');
  await fs.rm(fixture.stagedScreens.analysis);
  await assert.rejects(publishCapture(fixture), {code: 'ENOENT'});
  assert.equal(await fs.readFile(fixture.manifestPath, 'utf8'), before);
  assert.deepEqual(await fs.readdir(fixture.nativeDir), ['manifest.json']);
});

test('a source change before publication prevents stale screenshots from being committed', async (t) => {
  const fixture = await publicationFixture(t);
  await assert.rejects(publishCapture({...fixture, getCurrentHash: async () => 'source-b'}), SourceChangedError);
  assert.equal(JSON.parse(await fs.readFile(fixture.manifestPath, 'utf8')).status, 'stale');
  assert.deepEqual(await fs.readdir(fixture.nativeDir), ['manifest.json']);
});

test('a source change during image publication rolls back that revision without replacing metadata', async (t) => {
  const fixture = await publicationFixture(t);
  let reads = 0;
  await assert.rejects(publishCapture({...fixture, getCurrentHash: async () => ++reads === 1 ? 'source-a' : 'source-b'}), SourceChangedError);
  assert.equal(reads, 2);
  assert.equal(JSON.parse(await fs.readFile(fixture.manifestPath, 'utf8')).status, 'stale');
  assert.deepEqual(await fs.readdir(fixture.nativeDir), ['manifest.json']);
});

test('freshness check blocks an old source, a missing image and an interrupted HMR update', async (t) => {
  const fixture = await publicationFixture(t);
  const capture = await publishCapture(fixture);
  const check = (extra = {}) => validateCapture({capture, sourceHash: fixture.sourceHash, publicDir: fixture.publicDir, generatedFile: fixture.generatedPath, ...extra});
  assert.equal((await check({sourceHash: 'new-source'})).ok, false);
  await fs.writeFile(fixture.generatedPath, serializeCapture(emptyCapture()));
  assert.equal((await check()).ok, false);
  await fs.writeFile(fixture.generatedPath, serializeCapture(capture));
  await fs.rm(path.join(fixture.nativeDir, 'revision-a-analysis.png'));
  assert.equal((await check()).ok, false);
});

test('PNG dimensions reject an invalid image and zero-sized capture', () => {
  assert.deepEqual(pngDimensions(png(100, 200)), {width: 100, height: 200});
  assert.throws(() => pngDimensions(Buffer.from('not a screenshot')));
  assert.throws(() => pngDimensions(png(0, 200)));
});

test('command success preserves a complete JSON response larger than 16K', async () => {
  const payload = {devices: Array.from({length: 2000}, (_, index) => ({id: index, name: `브랜드 미리보기 ${index}`}))};
  const output = await run(process.execPath, ['-e', `process.stdout.write(JSON.stringify(${JSON.stringify(payload)}))`]);
  assert.ok(output.length > 16_000);
  assert.deepEqual(JSON.parse(output), payload);
});

test('command success keeps stderr warnings out of the stdout JSON', async () => {
  const output = await run(process.execPath, ['-e', 'process.stderr.write("Simulator warning\\n"); process.stdout.write(JSON.stringify({ready: true}));']);
  assert.deepEqual(JSON.parse(output), {ready: true});
});

test('command log is available before process completion and contains both output streams', async (t) => {
  const root = await temporary(t);
  const logFile = path.join(root, 'build.log');
  const releaseFile = path.join(root, 'release');
  const script = `const fs = require('node:fs'); process.stdout.write('빌드 시작\\n'); process.stderr.write('진행 진단\\n'); const timer = setInterval(() => { if (fs.existsSync(${JSON.stringify(releaseFile)})) { clearInterval(timer); process.stdout.write('빌드 완료\\n'); } }, 20);`;
  const execution = run(process.execPath, ['-e', script], {logFile, timeoutMs: 5000});
  let streamingContent = '';
  try {
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      streamingContent = await fs.readFile(logFile, 'utf8').catch(() => '');
      if (streamingContent.includes('빌드 시작') && streamingContent.includes('진행 진단')) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(streamingContent.includes('빌드 시작'));
    assert.ok(streamingContent.includes('진행 진단'));
    assert.ok(!streamingContent.includes('빌드 완료'));
  } finally { await fs.writeFile(releaseFile, 'continue'); }
  assert.equal(await execution, '빌드 시작\n빌드 완료');
  assert.ok((await fs.readFile(logFile, 'utf8')).includes('빌드 완료'));
});
