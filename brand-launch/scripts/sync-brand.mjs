import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const native = path.resolve(project, '../ios/TasteBuddy/Resources');
await Promise.all(['public/brand', 'public/fonts', 'src/generated'].map((p) => mkdir(path.join(project, p), {recursive: true})));
const symbol = path.join(native, 'Assets.xcassets/SplashSymbol.imageset/SplashSymbol.svg');
await copyFile(symbol, path.join(project, 'public/brand/symbol.svg'));
await copyFile(path.join(native, 'Assets.xcassets/SplashWordmark.imageset/SplashWordmark.svg'), path.join(project, 'public/brand/wordmark.svg'));
for (const weight of ['Regular', 'Medium', 'SemiBold', 'Bold']) {
  await copyFile(path.join(native, `Pretendard-${weight}.otf`), path.join(project, `public/fonts/Pretendard-${weight}.otf`));
}
await copyFile(path.resolve(project, '../ios/LICENSES/Pretendard-LICENSE.txt'), path.join(project, 'public/fonts/LICENSE.txt'));
const svg = await readFile(symbol, 'utf8');
const paths = [...svg.matchAll(/<path\s+d="([^"]+)"/g)].map((m) => m[1]);
if (paths.length !== 6) throw new Error('브랜드 심볼 원본 구조가 달라졌습니다. 로고 모션을 확인하세요.');
const output = `// iOS 원본 SVG에서 생성. scripts/sync-brand.mjs로 갱신합니다.\nexport const symbolPaths = ${JSON.stringify(paths, null, 2)};\n`;
const destination = path.join(project, 'src/generated/brand.ts');
if (await readFile(destination, 'utf8').catch(() => '') !== output) await writeFile(destination, output);
