import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dir = path.join(root, 'src/TasteBubbleMapMotion');
const modules = new Map();
export function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const module = {exports: {}};
  modules.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const requireLocal = specifier => {
    if (!specifier.startsWith('.')) return createRequire(file)(specifier);
    const base = path.resolve(path.dirname(file), specifier);
    const found = [base, base + '.ts', base + '.js'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!found) throw new Error(`Unresolved ${specifier} in ${file}`);
    return load(found);
  };
  new Function('require', 'module', 'exports', js)(requireLocal, module, module.exports);
  return module.exports;
}
export const layout = load(path.join(dir, 'layout.ts'));
export const motion = load(path.join(dir, 'motion.ts'));
export const settings = load(path.join(dir, 'settings.ts'));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function gapStats(bubbles) {
  const cellSize = 180;
  const buckets = new Map();
  bubbles.forEach((b, i) => {
    const key = `${Math.floor(b.x / cellSize)}:${Math.floor(b.y / cellSize)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  });
  let minimum = Infinity, pair = [], crossKindMinimum = Infinity;
  bubbles.forEach((a, i) => {
    const cx = Math.floor(a.x / cellSize), cy = Math.floor(a.y / cellSize);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      for (const j of buckets.get(`${cx + ox}:${cy + oy}`) ?? []) {
        if (j <= i) continue;
        const b = bubbles[j];
        const gap = dist(a, b) - (a.diameter + b.diameter) / 2;
        if (gap < minimum) { minimum = gap; pair = [a.id, b.id]; }
        if (a.kind !== b.kind) crossKindMinimum = Math.min(crossKindMinimum, gap);
      }
    }
  });
  return {minimum, pair, crossKindMinimum};
}

export function visible(state, margin = 0) {
  const v = layout.MAP.viewport;
  return state.bubbles.filter(b =>
    b.screenX + b.screenRadius >= -margin && b.screenY + b.screenRadius >= -margin &&
    b.screenX - b.screenRadius <= v + margin && b.screenY - b.screenRadius <= v + margin,
  );
}
