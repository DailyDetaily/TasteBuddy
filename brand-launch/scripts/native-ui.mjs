#!/usr/bin/env node
import {createHash, randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {watch} from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const brandRoot = path.resolve(path.dirname(scriptPath), '..');
const repoRoot = path.resolve(brandRoot, '..');
const cacheRoot = path.join(brandRoot, '.native-ui-cache');
const manifestPath = path.join(brandRoot, 'public/native/manifest.json');
const generatedPath = path.join(brandRoot, 'src/generated/native-ui.ts');
const simulatorName = 'Taste Buddy Brand Video';
const bundleId = 'com.juneh96.tastebuddy.ios';
const screenNames = ['dining', 'feedback', 'analysis'];
const packageLockPath = 'ios/TasteBuddy.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved';
const inputPaths = ['ios/TasteBuddy', 'ios/Config', 'ios/project.yml', packageLockPath,
  'brand-launch/public/images/hero-food.png', 'brand-launch/scripts/native-ui.mjs'];
const activeChildren = new Set();
let stopping = false;

export class SourceChangedError extends Error {
  constructor() { super('캡처 중 iOS 소스가 변경되어 새 소스로 다시 갱신합니다.'); }
}

export function emptyCapture() {
  return {
    status: 'stale', revision: '', capturedSourceHash: '', currentSourceHash: '', capturedAt: '',
    message: 'iOS 앱 화면을 아직 캡처하지 않았어요. npm run native:capture를 실행해 주세요.',
    screens: Object.fromEntries(screenNames.map((name) => [name, {src: '', width: 0, height: 0}])),
  };
}

export function completeRefreshState({attemptedHash, capturedHash, latestHash, queued}) {
  // 처리 기준은 실제 캡처한 소스입니다. 완료 직전 저장된 새 소스를 처리한 것으로 넘기지 않습니다.
  const handledHash = capturedHash || attemptedHash;
  return {lastSeenHash: handledHash, queued: queued || latestHash !== handledHash};
}

export function serializeCapture(capture) {
  return `// native-ui.mjs가 생성합니다. 앱 UI는 iOS SwiftUI에서 캡처합니다.\n` +
    `export interface NativeScreenCapture { src: string; width: number; height: number; }\n` +
    `export interface NativeCapture {\n` +
    `  status: 'ready' | 'building' | 'error' | 'stale';\n` +
    `  revision: string; capturedSourceHash: string; currentSourceHash: string; capturedAt: string; message: string;\n` +
    `  screens: { dining: NativeScreenCapture; feedback: NativeScreenCapture; analysis: NativeScreenCapture; };\n` +
    `}\n` +
    `export const nativeCapture: NativeCapture = ${JSON.stringify(capture, null, 2)};\n`;
}

async function atomicWrite(destination, data) {
  await fs.mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, data);
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, {force: true});
  }
}

async function writeCapture(capture, destinations = {}) {
  // HMR를 일으키는 TS 파일은 manifest와 모든 이미지 준비가 끝난 뒤 교체합니다.
  await atomicWrite(destinations.manifestPath ?? manifestPath, `${JSON.stringify(capture, null, 2)}\n`);
  await atomicWrite(destinations.generatedPath ?? generatedPath, serializeCapture(capture));
}

async function readCapture(destination = manifestPath) {
  try {
    const saved = JSON.parse(await fs.readFile(destination, 'utf8'));
    return {...saved, screens: {...emptyCapture().screens, ...saved.screens}};
  }
  catch (error) { if (error.code === 'ENOENT' || error instanceof SyntaxError) return emptyCapture(); throw error; }
}

async function walkFiles(root, relativePath, output) {
  const absolutePath = path.join(root, relativePath);
  let stat;
  try { stat = await fs.stat(absolutePath); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(absolutePath)).sort()) {
      if (name === '.DS_Store' || name === '.git') continue;
      await walkFiles(root, path.join(relativePath, name), output);
    }
  } else if (stat.isFile()) output.push(relativePath);
}

export async function hashInputs(root, inputs) {
  const files = [];
  for (const input of inputs) await walkFiles(root, input, files);
  const hash = createHash('sha256');
  for (const relativePath of [...new Set(files)].sort()) {
    const bytes = await fs.readFile(path.join(root, relativePath));
    hash.update(relativePath.split(path.sep).join('/')).update('\0');
    hash.update(String(bytes.length)).update('\0').update(bytes).update('\0');
  }
  return hash.digest('hex');
}

const currentHash = () => hashInputs(repoRoot, inputPaths);

export function inspectReadiness(value, expected) {
  if (!value || value.schemaVersion !== 1 || value.token !== expected.token || value.screen !== expected.screen) {
    return {state: 'waiting'};
  }
  if (value.status === 'error') return {state: 'error', message: value.error || '앱 미리보기 준비에 실패했습니다.'};
  if (value.status !== 'ready' || value.source !== 'ios-swiftui') return {state: 'waiting'};
  if (!(value.observationCount > 0) || !(value.insightCount > 0 || value.candidateCount > 0)) {
    return {state: 'error', message: '앱의 식사 기록 또는 취향 해석 데이터가 준비되지 않았습니다.'};
  }
  return {state: 'ready'};
}

export function pngDimensions(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature) || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('캡처 결과가 올바른 PNG 파일이 아닙니다.');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < 1 || height < 1) throw new Error('캡처 이미지 크기가 올바르지 않습니다.');
  return {width, height};
}

export async function publishCapture({stagedScreens, sourceHash, getCurrentHash, nativeDir,
  manifestPath: targetManifest, generatedPath: targetGenerated, capturedAt = new Date().toISOString(),
  revision = `${sourceHash.slice(0, 12)}-${Date.now()}-${randomUUID().slice(0, 8)}`}) {
  const buffers = {};
  const screens = {};
  for (const name of screenNames) {
    buffers[name] = await fs.readFile(stagedScreens[name]);
    screens[name] = {src: `native/${revision}-${name}.png`, ...pngDimensions(buffers[name])};
  }
  if (await getCurrentHash() !== sourceHash) throw new SourceChangedError();
  await fs.mkdir(nativeDir, {recursive: true});
  const writtenFiles = [];
  let committed = false;
  try {
    for (const name of screenNames) {
      const output = path.join(nativeDir, `${revision}-${name}.png`);
      await atomicWrite(output, buffers[name]);
      writtenFiles.push(output);
    }
    if (await getCurrentHash() !== sourceHash) throw new SourceChangedError();
    const result = {status: 'ready', revision, capturedSourceHash: sourceHash, currentSourceHash: sourceHash,
      capturedAt, message: '현재 iOS SwiftUI 소스로 앱 화면을 갱신했어요.', screens};
    await writeCapture(result, {manifestPath: targetManifest, generatedPath: targetGenerated});
    committed = true;
    return result;
  } finally {
    if (!committed) await Promise.all(writtenFiles.map((file) => fs.rm(file, {force: true})));
  }
}

export async function validateCapture({capture, sourceHash, publicDir, generatedFile}) {
  if (capture.status !== 'ready') return {ok: false, reason: capture.message || 'iOS 캡처가 준비되지 않았습니다.'};
  if (!capture.revision || !capture.capturedAt || capture.capturedSourceHash !== sourceHash || capture.currentSourceHash !== sourceHash) {
    return {ok: false, reason: 'iOS 소스와 영상의 앱 화면이 다릅니다. npm run native:capture를 실행해 주세요.'};
  }
  for (const name of screenNames) {
    const screen = capture.screens?.[name];
    if (!screen || screen.src !== `native/${capture.revision}-${name}.png`) {
      return {ok: false, reason: `${name} 캡처 경로가 현재 revision과 일치하지 않습니다.`};
    }
    try {
      const size = pngDimensions(await fs.readFile(path.join(publicDir, screen.src)));
      if (size.width !== screen.width || size.height !== screen.height) return {ok: false, reason: `${name} 캡처 크기가 일치하지 않습니다.`};
    } catch { return {ok: false, reason: `${name} 캡처 파일을 확인할 수 없습니다.`}; }
  }
  if (generatedFile) {
    try {
      if (await fs.readFile(generatedFile, 'utf8') !== serializeCapture(capture)) {
        return {ok: false, reason: '캡처 manifest와 Studio 모듈이 일치하지 않습니다. 다시 갱신해 주세요.'};
      }
    } catch { return {ok: false, reason: 'Studio용 캡처 모듈이 없습니다.'}; }
  }
  return {ok: true};
}

export async function run(command, args, {env = {}, timeoutMs = 120_000, logFile} = {}) {
  if (stopping) throw new Error('앱 화면 갱신을 중단했습니다.');
  let logHandle;
  if (logFile) {
    await fs.mkdir(path.dirname(logFile), {recursive: true});
    logHandle = await fs.open(logFile, 'w');
  }
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd: repoRoot, env: {...process.env, ...env}, detached: true, stdio: ['ignore', 'pipe', 'pipe']});
    activeChildren.add(child);
    const stdoutChunks = [];
    let diagnosticTail = '';
    let logWrites = Promise.resolve();
    let logError;
    let spawnError;
    let timedOut = false;
    const collect = (chunk, isStdout) => {
      // JSON 등 기계가 읽는 성공 출력은 stderr와 분리하고 전체 바이트를 보존합니다.
      if (isStdout) stdoutChunks.push(chunk);
      diagnosticTail = (diagnosticTail + chunk.toString()).slice(-16_000);
      // 실행 도중에도 로그를 확인할 수 있도록 각 청크를 순서대로 바로 기록합니다.
      if (logHandle) logWrites = logWrites.then(async () => {
        if (!logError) await logHandle.write(chunk);
      }).catch((error) => { logError = error; });
    };
    child.stdout.on('data', (chunk) => collect(chunk, true));
    child.stderr.on('data', (chunk) => collect(chunk, false));
    const timer = setTimeout(() => { timedOut = true; stopChild(child); }, timeoutMs);
    child.once('error', (error) => { spawnError = error; });
    child.once('close', async (code, signal) => {
      clearTimeout(timer);
      activeChildren.delete(child);
      try {
        await logWrites;
        if (logHandle) await logHandle.close();
        if (spawnError) throw spawnError;
        if (logError) throw logError;
        if (code === 0) resolve(Buffer.concat(stdoutChunks).toString('utf8').trim());
        else reject(new Error(`${command} 실행 실패${timedOut ? ' (시간 초과)' : ` (${signal || code})`}.${logFile ? ` 로그: ${logFile}` : `\n${diagnosticTail.trim()}`}`));
      } catch (error) { reject(error); }
    });
  });
}

function stopChild(child) {
  // 이 실행이 만든 프로세스 그룹만 종료합니다. 다른 Xcode/Simulator 작업은 건드리지 않습니다.
  try { process.kill(-child.pid, 'SIGTERM'); } catch { /* 이미 종료됨 */ }
  const timer = setTimeout(() => {
    if (!activeChildren.has(child)) return;
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* 이미 종료됨 */ }
  }, 5000);
  timer.unref();
}

async function acquireLock() {
  await fs.mkdir(cacheRoot, {recursive: true});
  const lockPath = path.join(cacheRoot, 'capture.lock');
  const owner = JSON.stringify({pid: process.pid, token: randomUUID(), startedAt: new Date().toISOString()});
  let handle;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { handle = await fs.open(lockPath, 'wx'); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const prior = await fs.readFile(lockPath, 'utf8');
      let pid;
      try { pid = JSON.parse(prior).pid; } catch { throw new Error(`캡처 잠금 파일의 소유자를 확인할 수 없습니다: ${lockPath}`); }
      if (!Number.isSafeInteger(pid) || pid < 1) throw new Error(`잘못된 캡처 잠금 파일입니다: ${lockPath}`);
      let alive = true;
      try { process.kill(pid, 0); } catch (probe) { if (probe.code === 'ESRCH') alive = false; }
      if (alive) throw new Error(`다른 앱 캡처 작업(PID ${pid})이 실행 중입니다. 해당 작업이 끝난 후 다시 실행해 주세요.`);
      // 죽은 프로세스의 동일한 파일인 경우에만 지웁니다. 실행 중인 프로세스는 종료하지 않습니다.
      if (await fs.readFile(lockPath, 'utf8') === prior) await fs.unlink(lockPath);
    }
  }
  if (!handle) throw new Error('앱 캡처 잠금을 획득하지 못했습니다.');
  await handle.writeFile(owner);
  await handle.close();
  return async () => {
    try { if (await fs.readFile(lockPath, 'utf8') === owner) await fs.unlink(lockPath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
}

async function dedicatedSimulator() {
  console.log('전용 iOS 시뮬레이터 목록을 확인합니다.');
  const inventory = JSON.parse(await run('xcrun', ['simctl', 'list', '--json']));
  const runtimes = inventory.runtimes.filter((runtime) => runtime.isAvailable && runtime.identifier.includes('.iOS-'))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, {numeric: true}));
  if (!runtimes.length) throw new Error('설치된 iOS Simulator 런타임이 없습니다. Xcode에서 런타임을 설치해 주세요.');
  let device;
  for (const runtime of runtimes) {
    device = (inventory.devices[runtime.identifier] || []).find((item) => item.isAvailable && item.name === simulatorName);
    if (device) break;
  }
  if (!device) {
    const types = inventory.devicetypes.filter((type) => type.productFamily === 'iPhone' || type.name.startsWith('iPhone'));
    const type = ['iPhone 17 Pro', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro'].map((name) => types.find((item) => item.name === name)).find(Boolean) || types[0];
    if (!type) throw new Error('사용 가능한 iPhone Simulator 기기 종류가 없습니다.');
    console.log(`전용 시뮬레이터를 생성합니다: ${simulatorName}`);
    const udid = await run('xcrun', ['simctl', 'create', simulatorName, type.identifier, runtimes[0].identifier]);
    device = {udid, state: 'Shutdown'};
  }
  console.log(`전용 시뮬레이터의 부팅 완료를 기다립니다: ${device.udid}`);
  if (device.state !== 'Booted') await run('xcrun', ['simctl', 'boot', device.udid]);
  await run('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], {timeoutMs: 300_000});
  console.log('전용 시뮬레이터 부팅이 완료되어 화면 환경을 설정합니다.');
  await run('xcrun', ['simctl', 'ui', device.udid, 'appearance', 'light']);
  await run('xcrun', ['simctl', 'status_bar', device.udid, 'override', '--time', '9:41', '--dataNetwork', 'wifi', '--wifiMode', 'active', '--wifiBars', '3', '--batteryState', 'charged', '--batteryLevel', '100']);
  return device.udid;
}

async function snapshotWorkspace() {
  const workspace = path.join(cacheRoot, 'workspace');
  await fs.rm(workspace, {recursive: true, force: true});
  await fs.mkdir(workspace, {recursive: true});
  for (const name of ['TasteBuddy', 'TasteBuddyTests', 'Config', 'project.yml', 'TasteBuddy.xcodeproj']) {
    await fs.cp(path.join(repoRoot, 'ios', name), path.join(workspace, name), {recursive: true, dereference: true});
  }
  const lock = path.join(repoRoot, packageLockPath);
  try {
    const destination = path.join(workspace, 'TasteBuddy.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved');
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await fs.copyFile(lock, destination);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return workspace;
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function awaitReady(readyFile, expected) {
  const deadline = Date.now() + 60_000;
  while (!stopping && Date.now() < deadline) {
    try {
      const state = inspectReadiness(JSON.parse(await fs.readFile(readyFile, 'utf8')), expected);
      if (state.state === 'ready') { await delay(250); return; }
      if (state.state === 'error') throw new Error(state.message);
    } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    await delay(200);
  }
  throw new Error(stopping ? '앱 화면 갱신을 중단했습니다.' : `${expected.screen} 화면의 준비 신호를 60초 동안 받지 못했습니다.`);
}

async function refresh() {
  const previous = await readCapture();
  let sourceHash = await currentHash();
  await writeCapture({...previous, status: 'building', currentSourceHash: sourceHash, message: '현재 iOS SwiftUI 소스로 앱 화면을 갱신하고 있어요.'});
  const stage = path.join(cacheRoot, 'staging', randomUUID());
  try {
    console.log('브랜드 에셋을 갱신하고 현재 iOS 소스의 빌드용 복사본을 준비합니다.');
    await run(process.execPath, [path.join(brandRoot, 'scripts/sync-brand.mjs')]);
    sourceHash = await currentHash();
    const workspace = await snapshotWorkspace();
    if (await currentHash() !== sourceHash) throw new SourceChangedError();
    const udid = await dedicatedSimulator();
    try {
      await run('xcodegen', ['generate', '--spec', path.join(workspace, 'project.yml'), '--project-root', workspace, '--project', workspace]);
    } catch {
      console.log('xcodegen 실행을 건너뛰고 기존 TasteBuddy.xcodeproj를 사용합니다.');
    }
    const derivedData = path.join(cacheRoot, 'DerivedData');
    await run('xcodebuild', ['-jobs', '2', '-project', path.join(workspace, 'TasteBuddy.xcodeproj'), '-scheme', 'TasteBuddy', '-configuration', 'Debug',
      '-destination', `platform=iOS Simulator,id=${udid}`, '-derivedDataPath', derivedData, '-clonedSourcePackagesDirPath', path.join(cacheRoot, 'SourcePackages'),
      'CODE_SIGNING_ALLOWED=NO', 'ONLY_ACTIVE_ARCH=YES', 'build'], {timeoutMs: 900_000, logFile: path.join(cacheRoot, 'build.log')});
    if (await currentHash() !== sourceHash) throw new SourceChangedError();
    const app = path.join(derivedData, 'Build/Products/Debug-iphonesimulator/TasteBuddy.app');
    console.log('iOS 빌드가 완료되어 전용 시뮬레이터에 앱과 식사 사진을 설치합니다.');
    await run('xcrun', ['simctl', 'install', udid, app]);
    const container = await run('xcrun', ['simctl', 'get_app_container', udid, bundleId, 'data']);
    const photoDir = path.join(container, 'Library/Application Support/TasteBuddy/DiningFeedbackPhotos');
    await fs.mkdir(photoDir, {recursive: true});
    await run('sips', ['-s', 'format', 'jpeg', path.join(brandRoot, 'public/images/hero-food.png'), '--out', path.join(photoDir, 'brand-video-01.jpg')]);
    await fs.mkdir(stage, {recursive: true});
    const stagedScreens = {};
    for (const screen of screenNames) {
      const screenLabel = {dining: '식사 기록', feedback: '맛 피드백', analysis: '취향 분석'}[screen];
      const token = randomUUID();
      const readyFile = path.join(container, 'Documents/brand-video-ready.json');
      await fs.rm(readyFile, {force: true});
      console.log(`${screenLabel} 화면을 열고 앱의 준비 신호를 기다립니다.`);
      await run('xcrun', ['simctl', 'launch', '--terminate-running-process', udid, bundleId, '--brand-video-preview', '--brand-video-screen', screen],
        {env: {SIMCTL_CHILD_TB_BRAND_VIDEO_TOKEN: token}});
      await awaitReady(readyFile, {token, screen});
      stagedScreens[screen] = path.join(stage, `${screen}.png`);
      console.log(`${screenLabel} 화면의 이미지를 캡처합니다.`);
      await run('xcrun', ['simctl', 'io', udid, 'screenshot', '--type=png', stagedScreens[screen]]);
    }
    console.log('세 화면과 iOS 소스의 최신성을 확인하고 Studio에 반영합니다.');
    const capture = await publishCapture({stagedScreens, sourceHash, getCurrentHash: currentHash,
      nativeDir: path.join(brandRoot, 'public/native'), manifestPath, generatedPath});
    console.log(`앱 화면 갱신 완료: ${capture.revision} · Studio에 자동 반영됩니다.`);
    return capture;
  } catch (error) {
    const hash = await currentHash().catch(() => sourceHash);
    if (hash !== sourceHash && !(error instanceof SourceChangedError)) error = new SourceChangedError();
    await writeCapture({...previous, status: error instanceof SourceChangedError ? 'stale' : 'error', currentSourceHash: hash, message: error.message});
    throw error;
  } finally { await fs.rm(stage, {recursive: true, force: true}); }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--once', '--watch', '--check'].includes(args[0])) {
    console.error('사용법: node scripts/native-ui.mjs --once | --watch | --check');
    process.exitCode = 1;
    return;
  }
  if (args[0] === '--check') {
    const result = await validateCapture({capture: await readCapture(), sourceHash: await currentHash(), publicDir: path.join(brandRoot, 'public'), generatedFile: generatedPath});
    console.log(result.ok ? '앱 화면이 현재 iOS 소스와 일치합니다.' : result.reason);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const releaseLock = await acquireLock();
  const watchers = [];
  let debounceTimer;
  let pollTimer;
  let activeRefresh;
  let queued = false;
  let lastSeenHash = await currentHash();
  let wakeOnStop;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    clearTimeout(debounceTimer);
    clearInterval(pollTimer);
    for (const watcher of watchers) watcher.close();
    for (const child of activeChildren) stopChild(child);
    wakeOnStop?.();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    if (args[0] === '--once') {
      for (let attempt = 0; attempt < 3 && !stopping; attempt++) {
        try { await refresh(); return; }
        catch (error) {
          if (!(error instanceof SourceChangedError) || attempt === 2) throw error;
          console.log(error.message);
          await delay(2000);
        }
      }
      return;
    }
    const drain = async () => {
      if (stopping || activeRefresh) return;
      queued = false;
      let attemptedHash = lastSeenHash;
      let capture;
      activeRefresh = (async () => {
        try { attemptedHash = await currentHash(); capture = await refresh(); }
        catch (error) { console.error(error.message); if (error instanceof SourceChangedError) queued = true; }
      })();
      await activeRefresh;
      try {
        const completed = completeRefreshState({attemptedHash, capturedHash: capture?.capturedSourceHash, latestHash: await currentHash(), queued});
        lastSeenHash = completed.lastSeenHash;
        queued = completed.queued;
      }
      catch (error) { console.error(error.message); queued = true; }
      activeRefresh = undefined;
      if (queued && !stopping) { clearTimeout(debounceTimer); debounceTimer = setTimeout(drain, 2000); }
    };
    const schedule = () => {
      if (stopping) return;
      queued = true;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const hash = await currentHash();
          if (hash === lastSeenHash && !activeRefresh) { queued = false; return; }
          await drain();
        } catch (error) { console.error(error.message); }
      }, 2000);
    };
    for (const relativePath of inputPaths) {
      try { watchers.push(watch(path.join(repoRoot, relativePath), {recursive: true}, schedule)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    // 파일 시스템 이벤트 누락 및 새 디렉터리 생성도 content hash로 보완합니다.
    pollTimer = setInterval(async () => {
      try { if (await currentHash() !== lastSeenHash) schedule(); }
      catch (error) { console.error(error.message); }
    }, 30_000);
    console.log('iOS 소스 변경을 감시합니다. 저장 후 2초가 지나면 빌드·캡처를 갱신합니다. 종료: Ctrl+C');
    const stopped = new Promise((resolve) => { wakeOnStop = resolve; });
    const existing = await validateCapture({capture: await readCapture(), sourceHash: lastSeenHash,
      publicDir: path.join(brandRoot, 'public'), generatedFile: generatedPath});
    if (existing.ok) console.log('현재 소스와 일치하는 캡처를 유지하고 변경을 기다립니다.');
    else void drain();
    await stopped;
    if (activeRefresh) await activeRefresh;
  } finally {
    stop();
    await releaseLock();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
