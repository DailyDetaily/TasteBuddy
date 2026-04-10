import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const host = '127.0.0.1';
const port = 3001;
const requestedPath = process.argv[2];
const routePath =
  typeof requestedPath === 'string' && requestedPath.startsWith('/')
    ? requestedPath
    : '/design-system';
const routeUrl = `http://${host}:${port}${routePath}`;

async function isDevServerRunning() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(routeUrl, {
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function openBrowser(url) {
  if (process.platform === 'darwin') {
    const chromeResult = spawnSync('open', ['-a', 'Google Chrome', url], { stdio: 'ignore' });

    if (chromeResult.status === 0) {
      return;
    }

    const fallbackChild = spawn('open', [url], { detached: true, stdio: 'ignore' });
    fallbackChild.unref();
    return;
  }

  if (process.platform === 'win32') {
    const child = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
    child.unref();
    return;
  }

  const child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
  child.unref();
}

function startVite() {
  const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, '--open', routePath], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

if (await isDevServerRunning()) {
  console.log(`Opening ${routeUrl}`);
  openBrowser(routeUrl);
} else {
  console.log(`Starting Vite and opening ${routeUrl}`);
  startVite();
}
