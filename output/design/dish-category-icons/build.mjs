import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(root, '../../..');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch {
  sharp = require('/Users/sinjunho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
}

// Palate Bloom 6색과 기존 미각 tint surface. 배경색은 SVG에 그리지 않는다.
const c = {
  orange: '#FFA826', yellow: '#FCC94D', lime: '#A5D126',
  blue: '#87A8FF', mauve: '#BE87BF', taupe: '#A5988E',
  cream: '#FFF7CC', neutral: '#EAE7E4', blueTint: '#E3EBFF',
};
const p = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const e = (cx, cy, rx, ry, fill) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const r = (x, y, w, h, radius, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
const line = (d, color = c.taupe, width = 3.5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const bowl = (color) => p('M20 58H108C106 84 88 99 64 99S22 84 20 58Z', color)
  + r(49, 97, 30, 7, 3.5, color);

const icons = [
  {
    id: 'seafood', subject: '생선 한 마리',
    body: p('M41 63L18 44Q13 42 15 49L19 64L15 79Q13 86 18 84Z', c.mauve)
      + p('M42 51Q55 27 69 38L80 52Z', c.yellow)
      + p('M34 64C45 41 82 33 105 58Q112 64 105 70C82 95 45 87 34 64Z', c.blue)
      + p('M49 70Q64 90 81 77L73 65Z', c.yellow)
      + line('M85 47Q76 64 85 81', c.blueTint, 4)
      + e(95, 59, 3, 3, c.taupe),
  },
  {
    id: 'meat', subject: '지방과 뼈가 보이는 고기 한 조각',
    body: p('M42 26C62 18 86 31 98 48C108 62 111 84 98 98C86 111 67 105 55 94C41 100 23 94 20 79C16 63 23 36 42 26Z', c.neutral)
      + p('M44 33C61 26 82 37 91 52C100 66 103 84 93 93C83 103 68 94 57 83C45 91 30 89 28 77C24 62 30 41 44 33Z', c.mauve)
      + line('M59 41L62 78M43 58L62 63L78 54', c.cream, 8)
      + line('M78 71Q83 79 81 85M37 72L42 77', c.cream, 4),
  },
  {
    id: 'vegetable_herb', subject: '잎이 달린 당근 한 개',
    body: p('M61 48C45 41 34 29 39 20C52 22 61 32 63 46Z', c.lime)
      + p('M64 47C56 33 57 18 65 14C75 26 73 38 67 49Z', c.lime)
      + p('M67 48C68 34 79 24 91 26C92 40 79 49 68 51Z', c.lime)
      + p('M40 50Q64 40 88 50C87 69 78 93 68 110Q64 116 60 110C50 93 41 69 40 50Z', c.orange)
      + line('M43 61H57M72 73H82M53 88H65', c.yellow, 4),
  },
  {
    id: 'legume_tofu', subject: '콩알이 보이는 꼬투리 한 개',
    body: p('M68 16Q91 21 93 44C100 58 89 77 74 91Q59 105 35 112C30 95 31 78 37 64C36 44 48 22 68 16Z', c.lime)
      + p('M66 25C83 34 81 58 67 77Q55 94 39 104C36 80 46 47 66 25Z', c.cream)
      + e(65, 41, 11, 12, c.yellow)
      + e(58, 66, 11, 12, c.yellow)
      + e(46, 88, 9, 10, c.yellow)
      + line('M71 24Q78 15 87 16', c.lime, 5),
  },
  {
    id: 'grain_noodle', subject: '수북한 밥 한 공기',
    body: p('M25 61C22 50 29 42 39 42C42 30 56 27 65 32C77 24 91 35 90 44C102 43 108 52 103 63Z', c.cream)
      + line('M38 49L43 45M56 39L61 42M76 41L81 38M88 53L94 50M60 53L65 50', c.taupe, 3)
      + bowl(c.blue) + r(20, 56, 88, 7, 3.5, c.blue),
  },
  {
    id: 'dumpling_batter', subject: '주름 잡힌 만두 한 개',
    body: p('M16 77C21 51 41 32 64 32S107 51 112 77Q103 101 64 101T16 77Z', c.yellow)
      + p('M22 77Q40 55 64 57Q88 55 106 77Q98 94 64 94T22 77Z', c.cream)
      + line('M34 52L42 68M48 39L53 60M64 35V58M80 39L75 60M94 52L86 68', c.orange, 4),
  },
  {
    id: 'broth', subject: '맑은 국물이 담긴 그릇 한 개',
    body: bowl(c.mauve) + e(64, 57, 44, 14, c.mauve)
      + e(64, 54, 36, 9, c.yellow)
      + r(45, 49, 12, 5, 2.5, c.lime)
      + r(68, 53, 10, 5, 2.5, c.lime)
      + line('M44 36C35 26 49 25 43 16M78 35C69 25 82 24 77 15', c.taupe, 4),
  },
  {
    id: 'sauce_glaze', subject: '소스 보트 한 개',
    body: `<path d="M91 43H98C116 43 118 72 94 75" fill="none" stroke="${c.blue}" stroke-width="9"/>`
      + p('M15 44Q35 54 42 54H97C100 77 85 92 63 92C42 92 33 81 29 66Z', c.blue)
      + e(65, 53, 32, 11, c.blue)
      + e(65, 51, 25, 6, c.orange)
      + r(43, 91, 43, 7, 3.5, c.blue),
  },
  {
    id: 'grilled_smoked', subject: '그릴 자국이 있는 구운 음식 한 조각',
    body: p('M35 38C53 31 92 33 103 46C114 62 99 88 83 96C68 103 31 94 24 78C17 61 19 44 35 38Z', c.taupe)
      + p('M35 32C53 25 92 27 103 40C114 56 99 82 83 90C68 97 31 88 24 72C17 55 19 38 35 32Z', c.orange)
      + line('M38 47L52 70M57 40L77 74M82 42L95 63', c.taupe, 5.5)
      + line('M45 25C38 18 48 16 44 12M79 25C72 18 82 16 78 12', c.taupe, 3.5),
  },
  {
    id: 'stir_fried_wok', subject: '볶음이 담긴 웍 한 개',
    body: r(94, 47, 23, 10, 5, c.taupe)
      + `<path d="M27 51H19Q12 51 12 58Q12 65 25 65" fill="none" stroke="${c.taupe}" stroke-width="6"/>`
      + p('M21 55H100C95 83 82 99 61 99S26 83 21 55Z', c.taupe)
      + e(61, 54, 40, 12, c.taupe) + e(61, 53, 31, 7, c.cream)
      + p('M38 51Q47 36 54 44L48 54Z', c.lime)
      + p('M64 48Q79 34 86 46L74 56Z', c.lime)
      + r(51, 47, 17, 8, 4, c.orange),
  },
  {
    id: 'fried_crispy', subject: '튀김옷을 입힌 닭다리 한 개',
    body: p('M59 78H70V99C80 97 83 106 77 111Q70 116 65 110Q60 116 53 111C47 105 50 98 59 99Z', c.taupe)
      + p('M48 23Q56 16 64 21Q75 17 82 26Q94 26 95 39Q104 49 97 59Q98 72 87 78L75 89Q63 95 53 85L37 73Q25 67 29 55Q23 45 33 37Q32 25 48 23Z', c.orange)
      + p('M44 36L52 32L57 39L51 46L43 42Z', c.yellow)
      + p('M73 47L83 43L88 51L82 57L73 55Z', c.yellow)
      + p('M50 64L58 61L64 68L59 75L50 72Z', c.yellow),
  },
  {
    id: 'steamed_braised', subject: '대나무 찜기 한 개',
    body: r(23, 51, 82, 50, 12, c.yellow)
      + e(64, 49, 41, 16, c.taupe)
      + e(64, 47, 34, 11, c.cream)
      + line('M43 42L85 51M55 37L92 45M37 49L73 56M47 53L65 37M62 56L80 40', c.yellow, 3)
      + r(23, 62, 82, 6, 3, c.taupe)
      + r(23, 86, 82, 6, 3, c.taupe)
      + line('M39 72V82M64 72V82M89 72V82', c.orange, 3.5),
  },
  {
    id: 'raw_cured', subject: '결이 드러난 생연어 한 조각',
    body: p('M26 41Q61 27 101 43L106 87Q68 100 22 87Z', c.orange)
      + p('M28 41Q62 32 99 43L100 54Q63 44 26 53Z', c.yellow)
      + line('M40 52Q49 63 36 85M61 50Q72 64 58 88M81 52Q91 66 79 88', c.cream, 5),
  },
  {
    id: 'fermented_jang', subject: '뚜껑 덮인 옹기 한 개',
    body: r(54, 19, 20, 10, 5, c.taupe)
      + p('M34 41H94C103 58 108 85 92 102Q64 112 36 102C20 85 25 58 34 41Z', c.taupe)
      + r(27, 29, 74, 15, 7.5, c.taupe)
      + r(33, 44, 62, 6, 3, c.neutral)
      + p('M29 70Q64 80 99 70L98 79Q64 89 30 79Z', c.mauve),
  },
  {
    id: 'dairy_cheese', subject: '치즈 한 조각',
    body: p('M19 85L101 34Q108 30 108 38V66Q94 68 97 78Q99 84 108 85V99H19Z', c.yellow)
      + p('M19 85L101 34Q108 30 108 38V48L30 91H19Z', c.cream)
      + e(65, 77, 7, 7, c.orange) + e(88, 54, 5, 5, c.orange)
      + e(90, 92, 4, 4, c.orange),
  },
  {
    id: 'spice_heat', subject: '굽은 고추 한 개',
    body: p('M76 39C70 22 77 16 89 16V25Q78 26 85 41Z', c.lime)
      + p('M64 36Q76 29 91 39C103 59 85 94 29 110Q26 111 28 107C54 86 46 53 64 36Z', c.orange)
      + p('M64 36Q77 29 91 39L91 51L82 47L75 52L68 45L58 48Z', c.lime)
      + line('M71 58Q76 76 56 90', c.yellow, 5),
  },
  {
    id: 'cold', subject: '얼음이 보이는 냉요리 한 그릇',
    body: p('M20 57H108Q107 86 64 95Q21 86 20 57Z', c.blue)
      + e(64, 55, 44, 13, c.blue) + e(64, 53, 36, 8, c.blueTint)
      + line('M36 55C39 41 61 43 62 54M43 55C46 49 55 49 56 55', c.yellow, 4)
      + r(73, 32, 23, 25, 5, c.blue)
      + r(77, 35, 15, 17, 3, c.blueTint)
      + line('M81 39L85 39L85 43', '#FFFFFF', 3)
      + r(50, 93, 28, 6, 3, c.blue),
  },
  {
    id: 'dessert', subject: '과일을 올린 케이크 한 조각',
    body: r(26, 46, 76, 55, 6, c.yellow)
      + r(26, 61, 76, 11, 1, c.cream) + r(26, 84, 76, 10, 1, c.cream)
      + p('M26 48Q26 42 33 42H95Q102 42 102 48V53Q94 61 86 53Q78 61 70 53Q62 61 54 53Q46 61 38 53Q30 60 26 54Z', c.cream)
      + p('M51 28C47 18 58 16 64 23C70 16 81 18 77 28L70 42Q64 49 58 42Z', c.mauve)
      + p('M56 22L53 15L64 19L73 14L72 23Z', c.lime)
      + e(60, 29, 1.5, 2, c.cream) + e(68, 34, 1.5, 2, c.cream),
  },
  {
    id: 'beverage_pairing', subject: '음료가 담긴 와인 잔 한 개',
    body: p('M36 19H92L96 46C99 68 85 81 64 81S29 68 32 46Z', c.blueTint)
      + p('M38 44H90C95 65 82 76 64 76S33 65 38 44Z', c.mauve)
      + line('M36 19H92L96 46C99 68 85 81 64 81S29 68 32 46Z', c.blue, 3.5)
      + r(61, 80, 6, 26, 3, c.blue)
      + e(64, 107, 25, 4, c.blue),
  },
];

const fixture = JSON.parse(await readFile(path.join(project, 'ios/TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json'), 'utf8'));
assert.deepEqual(icons.map(i => i.id), fixture.dishKindOptions.map(i => i.id), '실제 디시 카테고리 19종과 일치해야 합니다.');
const labels = Object.fromEntries(fixture.dishKindOptions.map(i => [i.id, i.label]));
const xml = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
await mkdir(path.join(root, 'svg'), {recursive: true});
await mkdir(path.join(root, 'png'), {recursive: true});
const manifest = [];
for (const icon of icons) {
  const title = `${labels[icon.id]} — ${icon.subject}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title"><title id="title">${xml(title)}</title>${icon.body}</svg>\n`;
  assert(!/linearGradient|radialGradient|filter=|<image|<script/.test(svg));
  await writeFile(path.join(root, 'svg', `${icon.id}.svg`), svg);
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  await writeFile(path.join(root, 'png', `${icon.id}.png`), png);
  const {data, info} = await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let x0 = 256, y0 = 256, x1 = 0, y1 = 0, opaque = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 0) {
      opaque++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  assert(x0 >= 16 && y0 >= 16 && x1 <= 239 && y1 <= 239, `${icon.id}: 안전 여백을 벗어났습니다.`);
  assert(opaque > 4500 && opaque < 35000, `${icon.id}: 면적이 너무 작거나 큽니다.`);
  assert.equal(info.channels, 4);
  assert.equal(data[3], 0, `${icon.id}: 모서리는 투명해야 합니다.`);
  manifest.push({id: icon.id, label: labels[icon.id], subject: icon.subject, svg: `svg/${icon.id}.svg`, png: `png/${icon.id}.png`, width: 256, height: 256, alpha: true, bounds: [x0, y0, x1, y1]});
}
await writeFile(path.join(root, 'manifest.json'), JSON.stringify({version: 1, palette: c, icons: manifest}, null, 2) + '\n');

// 한 장에서 큰 형태와 32px 축소 식별성을 함께 확인한다.
const card = (icon, index) => {
  const x = 40 + (index % 5) * 232, y = 155 + Math.floor(index / 5) * 228;
  return `<g transform="translate(${x} ${y})"><rect width="216" height="210" rx="20" fill="#F7F7F7"/><g transform="translate(44 15)">${icon.body}</g><text x="108" y="165" text-anchor="middle" font-size="15" font-weight="600" fill="#262626">${xml(labels[icon.id])}</text><g transform="translate(14 174) scale(.25)">${icon.body}</g><text x="56" y="194" font-size="10" fill="#777777">32px</text></g>`;
};
const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1118" viewBox="0 0 1240 1118"><rect width="1240" height="1118" fill="white"/><g font-family="Arial, Apple SD Gothic Neo, sans-serif"><text x="40" y="59" font-size="15" letter-spacing="2" fill="#777777">TASTE BUDDY · DISH CATEGORIES</text><text x="40" y="105" font-size="29" font-weight="600" fill="#202020">디시 카테고리 아이콘 19종</text><text x="1190" y="101" text-anchor="end" font-size="13" fill="#777777">Palate Bloom colors · SVG + transparent PNG</text>${icons.map(card).join('')}<text x="40" y="1100" font-size="11" fill="#777777">단일 대표 대상 / 평면 색면 / 동일한 좌표계 / 실제 투명 배경</text></g></svg>`;
await writeFile(path.join(root, 'overview.svg'), board);
await sharp(Buffer.from(board)).png().toFile(path.join(root, 'overview.png'));

const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taste Buddy · 디시 카테고리 아이콘</title><style>*{box-sizing:border-box}body{margin:0;padding:36px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#222;background:white}header{max-width:1160px;margin:0 auto 30px}h1{font-size:27px;margin:0 0 10px;letter-spacing:-1px}p{font-size:14px;color:#777;line-height:1.7}main{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;max-width:1160px;margin:auto}article{padding:16px;background:#f7f7f7;border-radius:20px;text-align:center}.icon{display:block;width:128px;height:128px;max-width:100%;margin:auto}h2{font-size:14px;font-weight:600;margin:14px 0 7px}.subject{font-size:11px;min-height:32px;margin:0;color:#777}.sample{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0}.small{width:32px;height:32px}.dark{display:grid;place-items:center;background:#282725;border-radius:8px;width:40px;height:40px}.dark img{width:32px;height:32px}a{color:inherit;text-decoration:none}nav{display:flex;justify-content:center;gap:16px;font-size:11px;margin-top:13px}nav a{text-decoration:underline;text-underline-offset:3px}footer{max-width:1160px;margin:30px auto 0;font-size:12px;color:#777;line-height:1.8}footer a{text-decoration:underline}@media(max-width:1000px){main{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:760px){body{padding:24px}main{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:500px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><header><h1>디시 카테고리 아이콘 19종</h1><p>Palate Bloom의 색상을 사용하는 평면 아이콘.<br>각 범주는 하나의 대표 대상으로 구분하고, 32px 크기와 밝고 어두운 배경에서 함께 확인합니다.</p></header><main>${icons.map(i => `<article><img class="icon" src="svg/${i.id}.svg" alt="${labels[i.id]}"><h2>${labels[i.id]}</h2><p class="subject">${i.subject}</p><div class="sample"><img class="small" src="svg/${i.id}.svg" alt=""><span class="dark"><img src="svg/${i.id}.svg" alt=""></span></div><nav><a href="svg/${i.id}.svg" download>SVG</a><a href="png/${i.id}.png" download>PNG</a></nav></article>`).join('')}</main><footer><a href="dish-category-icons.zip" download>전체 파일 받기</a> · <a href="README.md">제작 기준</a> · <a href="manifest.json">카테고리 매핑</a><br>SVG 128 viewBox · PNG 256 × 256 · 실제 투명 알파 · 앱 미적용</footer></html>`;
await writeFile(path.join(root, 'index.html'), html);
console.log(`19종 SVG·PNG 생성 완료. 카테고리 ID·안전 여백·알파·이미지 면적 검증 통과.`);
