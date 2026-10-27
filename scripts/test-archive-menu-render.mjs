import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-archive-render-')), out = path.join(dir, 'render.cjs');
await build({ stdin: { contents: "export {default as Cards,ArchiveMenuMiniGraph} from './src/components/home/ArchiveMenuCards'; export {buildArchiveMenuInsights} from './src/lib/gastronomy/archiveMenuInsights'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: out, logLevel: 'silent' });
const { Cards, ArchiveMenuMiniGraph, buildArchiveMenuInsights, createElement: h, renderToStaticMarkup: render } = createRequire(import.meta.url)(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
process.env.TZ = 'Asia/Seoul';
const now = new Date('2026-10-25T12:00:00+09:00');
const records = [
  ['a', '국수', '2026-10-01'], ['b', '국수', '2026-10-02'], ['c', '수프', '2026-10-03'],
  ['d', '카레', '2026-09-01'], ['e', '카레', '2026-10-03'],
].map(([id, menu, date]) => ({ id, mealID: id, menu, menuKey: menu, restaurant: '합성 식당', restaurantKey: 'r',
  date: date + 'T12:00:00+09:00', savedAt: now.toISOString(), source: 'restaurant', foodKinds: [], note: '', labels: [] }));
const data = { records, observations: [], overallStars: [{ id: 'a-star', entryID: 'a', value: 4.5 }, { id: 'c-star', entryID: 'c', value: 3 }] };
test('three cards wire distinct account aggregates into bubbles, ranking bars and absolute pie', () => {
  const summary = buildArchiveMenuInsights(data, now);
  const html = render(h(Cards, { data: summary, onOpen() {} }));
  for (const title of ['새로운 메뉴 탐험', '다시 찾은 한 접시', '새 메뉴 만족도']) assert.match(html, new RegExp(title));
  assert.match(html, /Mini Bubble Chart/); assert.match(html, /Pie Chart/);
  assert.match(html, /2가지 중 1가지/); assert.match(html, /data-fraction="0.5"/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  assert.equal((html.match(/<svg width="132" height="56"/g) ?? []).length, 2);
});
test('missing evaluation has no pie; a valid zero numerator is a full neutral remainder', () => {
  const missing = buildArchiveMenuInsights({ ...data, overallStars: [] }, now);
  assert.equal(render(h(ArchiveMenuMiniGraph, { id: 'new-menu-satisfaction', data: missing })), '');
  const zero = buildArchiveMenuInsights({ ...data, overallStars: data.overallStars.map(star => ({ ...star, value: 3 })) }, now);
  const html = render(h(ArchiveMenuMiniGraph, { id: 'new-menu-satisfaction', data: zero }));
  assert.match(html, /data-remainder="true"/); assert.match(html, /data-fraction="1"/);
});
test('an empty account never fabricates exploration bubbles or repeat bars', () => {
  const empty = buildArchiveMenuInsights({ records: [], observations: [] }, now);
  for (const id of ['menu-exploration', 'repeat-menu', 'new-menu-satisfaction']) assert.equal(render(h(ArchiveMenuMiniGraph, { id, data: empty })), '');
});
