import {spawn} from 'node:child_process';
import {mkdir, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd: project, stdio: 'inherit'});
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`명령이 실패했습니다 (${code}).`)));
});
const temporary = `out/.TasteBuddy-Launch-${process.pid}.mp4`;
await mkdir(path.join(project, 'out'), {recursive: true});
try {
  await run(process.execPath, ['scripts/native-ui.mjs', '--check']);
  await run(path.join(project, 'node_modules/.bin/remotion'), ['render', 'src/index.ts', 'TasteBuddyLaunch', temporary, '--codec=h264', '--crf=18', '--pixel-format=yuv420p', '--audio-codec=aac']);
  await run(process.execPath, ['scripts/native-ui.mjs', '--check']);
  await rename(path.join(project, temporary), path.join(project, 'out/TasteBuddy-Launch.mp4'));
  console.log('30초 영상 저장 완료: out/TasteBuddy-Launch.mp4');
} catch (error) {
  await rm(path.join(project, temporary), {force: true});
  throw error;
}
