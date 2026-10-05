import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const device = option('--device');
if (!device) throw new Error('Pass --device with the already booted documentation simulator UUID.');
const bundleID = 'com.juneh96.tastebuddy.ios';
const simctl = (...args) => exec('xcrun', ['simctl', ...args], { maxBuffer: 1024 * 1024, timeout: 60_000 });
if (option('--app')) await simctl('install', device, path.resolve(option('--app')));
const container = (await simctl('get_app_container', device, bundleID, 'data')).stdout.trim();
const signalFolder = path.join(container, 'Documents', 'plating-layout');
const outputFolder = path.join(root, 'public', 'plating', 'native-layout');
const evidenceFolder = path.join(root, 'output', 'plating', 'layout-native-20261002');
await fs.mkdir(outputFolder, { recursive: true });
await fs.mkdir(evidenceFolder, { recursive: true });
const cases = [
  { id: 'home-large', screen: 'home', size: 'large' },
  { id: 'home-accessibility2', screen: 'home', size: 'accessibility2' },
  { id: 'dining-large', screen: 'dining', size: 'large' },
  { id: 'dining-accessibility2', screen: 'dining', size: 'accessibility2' },
  { id: 'sheet-large', screen: 'sheet', size: 'large' },
  { id: 'sheet-keyboard', screen: 'sheet', size: 'large', keyboard: true },
];
const selectedCases = option('--only') ? cases.filter(item => item.id === option('--only')) : cases;
if (!selectedCases.length) throw new Error('Unknown --only capture id.');
const captures = [];
for (const item of selectedCases) {
  const signalPath = path.join(signalFolder, `${item.id}.json`);
  await fs.rm(signalPath, { force: true });
  await simctl('terminate', device, bundleID).catch(() => {});
  const launch = ['launch', device, bundleID, '--plating-layout-preview', '--plating-layout-screen', item.screen,
    '--plating-layout-size', item.size];
  if (item.keyboard) launch.push('--plating-layout-keyboard');
  await simctl(...launch);
  let metadata;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    let text;
    try { text = await fs.readFile(signalPath, 'utf8'); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (text) {
      metadata = JSON.parse(text);
      if (metadata.status === 'error') throw new Error(`${item.id}: ${metadata.error}`);
      if (metadata.status === 'ready') break;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (!metadata || metadata.status !== 'ready') throw new Error(`No ready signal for ${item.id} within 90 seconds.`);
  if (metadata.screen !== item.screen || metadata.dynamicType !== item.size) throw new Error(`Wrong screen or Dynamic Type for ${item.id}`);
  if (Boolean(metadata.keyboardVisible) !== Boolean(item.keyboard)) throw new Error(`Wrong keyboard state for ${item.id}`);
  // Allow the system compositor and state-only appearance updates to follow the measured layout.
  await new Promise(resolve => setTimeout(resolve, 800));
  const filename = `${item.id}.png`;
  const output = path.join(outputFolder, filename);
  await simctl('io', device, 'screenshot', '--type=png', output);
  const bytes = await fs.readFile(output);
  const pixelWidth = bytes.readUInt32BE(16), pixelHeight = bytes.readUInt32BE(20);
  const scale = pixelWidth / metadata.width;
  if (Math.abs(pixelHeight - metadata.height * scale) > 1) throw new Error(`Screen and screenshot dimensions differ for ${item.id}`);
  const capture = { ...metadata, id: item.id, file: filename, pixelWidth, pixelHeight, scale,
    capturedAt: new Date().toISOString(), sha256: createHash('sha256').update(bytes).digest('hex') };
  captures.push(capture);
  await fs.writeFile(path.join(evidenceFolder, `${item.id}.json`), JSON.stringify(capture, null, 2) + '\n');
  console.log(`${item.id}: ${metadata.width} × ${metadata.height}pt, ${Object.keys(metadata.frames).length} measured regions`);
}

const sourcePaths = [
  'ios/TasteBuddy/Features/DesignSystem/LayoutDocumentationPreview.swift',
  'ios/TasteBuddy/App/TasteBuddyApp.swift',
  'ios/TasteBuddy/App/AppModel.swift',
  'ios/TasteBuddy/Components/Shell/AppShellView.swift',
  'ios/TasteBuddy/Components/Shell/AppChromeComponents.swift',
  'ios/TasteBuddy/Components/SystemCoreComponents.swift',
  'ios/TasteBuddy/Components/SystemParityComponents.swift',
  'ios/TasteBuddy/Components/NativeInputComponents.swift',
  'ios/TasteBuddy/Features/Home/HomeView.swift',
  'ios/TasteBuddy/Features/Home/HomePeriodInsightComponents.swift',
  'ios/TasteBuddy/Features/Home/HomeSummaryComponents.swift',
  'ios/TasteBuddy/Features/Dining/DiningView.swift',
  'ios/TasteBuddy/Features/Auth/AuthEntryView.swift',
];
const sourceHashes = {};
for (const sourcePath of sourcePaths) sourceHashes[sourcePath] = createHash('sha256').update(await fs.readFile(path.join(root, sourcePath))).digest('hex');
const manifestPath = path.join(root, 'src/plating/nativeLayoutCaptures.json');
let existing = [];
if (option('--only')) existing = JSON.parse(await fs.readFile(manifestPath, 'utf8')).captures ?? [];
const merged = [...existing.filter(previous => !captures.some(next => next.id === previous.id)), ...captures]
  .sort((a, b) => cases.findIndex(item => item.id === a.id) - cases.findIndex(item => item.id === b.id));
const manifest = { schemaVersion: 1, platform: 'iOS · SwiftUI', deviceID: device, sourceHashes, captures: merged };
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(evidenceFolder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Saved ${merged.length} captures to src/plating/nativeLayoutCaptures.json`);
