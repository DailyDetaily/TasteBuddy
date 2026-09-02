import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const restartDelayMs = 1200;
const args = process.argv.slice(2);

let child;
let stopping = false;

function start() {
  child = spawn(process.execPath, [viteBin, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      BROWSER: 'none',
    },
  });

  child.on('exit', (code, signal) => {
    if (stopping) {
      process.exit(code ?? 0);
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[dev:keepalive] Vite exited with ${reason}. Restarting...`);
    setTimeout(start, restartDelayMs);
  });
}

function stop(signal) {
  stopping = true;
  if (child && !child.killed) {
    child.kill(signal);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

start();
