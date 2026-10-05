import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  absWorkingDir: root, entryPoints: ['src/constants/platingMotion.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent',
});
export const motion = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const cssProperty = (name) => name.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`);
const declarations = (values) => Object.entries(values).map(([name, value]) => `    ${cssProperty(name)}: ${value};`).join('\n');
const selectors = (recipe) => [`.${recipe.id}`, recipe.selector].filter(Boolean).join(',\n');

export function renderPlatingMotionCss() {
  const recipes = Object.values(motion.PLATING_MOTION_RECIPES);
  const css = recipes.map((recipe) => `${selectors(recipe)} {
  transform-origin: ${recipe.origin};
  animation: ${recipe.id} ${recipe.durationMs}ms ${recipe.easing} ${recipe.delayMs}ms both;
}

@keyframes ${recipe.id} {
${recipe.frames.map(({ offset, values }) => `  ${Number((offset * 100).toFixed(4))}% {\n${declarations(values)}\n  }`).join('\n')}
}`).join('\n\n');
  const reduced = recipes.map((recipe) => `  ${selectors(recipe).replaceAll('\n', '\n  ')} {
    animation: none;
${declarations(recipe.frames.at(-1).values)}
  }`).join('\n');
  return `/* Generated from src/constants/platingMotion.ts. Run npm run design:motion. */\n\n${css}\n\n@media (prefers-reduced-motion: reduce) {\n${reduced}\n}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = new URL('../src/styles/plating-motion.css', import.meta.url);
  const css = renderPlatingMotionCss();
  if (process.argv.includes('--check')) {
    if (await readFile(output, 'utf8') !== css) throw new Error('Plating CSS is stale. Run npm run design:motion.');
    console.log('Plating motion CSS is in sync.');
  } else {
    await writeFile(output, css);
    console.log('Generated src/styles/plating-motion.css');
  }
}
