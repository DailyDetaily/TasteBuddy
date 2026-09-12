import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];
let stopping = false;
const start = (command, args) => {
  const child = spawn(command, args, {cwd: project, stdio: 'inherit'});
  children.push(child);
  child.on('error', (error) => {console.error(error.message); stop(1);});
  child.on('exit', (code) => {if (!stopping) stop(code ?? 1);});
  return child;
};
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
start(process.execPath, ['scripts/native-ui.mjs', '--watch']);
start(path.join(project, 'node_modules/.bin/remotion'), ['studio', '--no-open', '--port=3110']);
