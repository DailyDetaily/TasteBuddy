import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  containsHangul,
  localizeMenuTitle,
} from './utils/content-localization.mjs';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const positional = [];
  const options = {
    review: null,
    output: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--review=')) {
      options.review = arg.slice('--review='.length).trim();
      continue;
    }

    if (arg === '--review') {
      options.review = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      options.output = arg.slice('--output='.length).trim();
      continue;
    }

    if (arg === '--output') {
      options.output = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  if (!options.review) {
    options.review = positional[0] ?? null;
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/fill-public-review-rows.mjs <review-json-path>
  node scripts/fill-public-review-rows.mjs --review <review-json-path> --output <review-json-path>

Examples:
  node scripts/fill-public-review-rows.mjs tmp/public-sources/kwonsooksoo-seoul/review-template.json
  node scripts/fill-public-review-rows.mjs tmp/public-sources/mosu-seoul/review-template.json
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function collapseWhitespace(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function uniq(values) {
  return [...new Set(values)];
}

function normalizeDraftLine(line) {
  return collapseWhitespace(
    `${line ?? ''}`
      .replace(/^\*+\s*/, '')
      .replace(/^[•·]\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  );
}

function isNoiseLine(line) {
  const normalized = normalizeDraftLine(line);
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return true;
  }

  if (
    normalized === 'or' ||
    normalized === 'Reserve' ||
    normalized === 'Download' ||
    normalized === 'CATCHTABLE APP'
  ) {
    return true;
  }

  if (
    lower === '404 not found' ||
    lower === 'nginx' ||
    lower === 'menu' ||
    lower === 'info' ||
    lower === 'allen' ||
    lower.includes('image ') ||
    lower.includes('instagram') ||
    lower.includes('logo') ||
    lower.includes('reservation') ||
    lower.includes('wine pairing') ||
    lower.includes('pairing') ||
    normalized.includes('페어링') ||
    lower.includes('glass') ||
    lower.includes('courses') ||
    lower.includes('course') && !containsHangul(normalized) && normalized.length < 24 ||
    lower.includes('price variable') ||
    lower.includes('krw') ||
    lower.includes('₩') ||
    lower.includes('fri - sat') ||
    lower.includes('fir - sat') ||
    lower.includes('lunch tasting') ||
    lower.includes('dinner tasting') ||
    lower.includes('every three months') ||
    lower.includes('thank you') ||
    lower.includes('food allergies') ||
    lower.includes('seasonal tasting menu')
  ) {
    return true;
  }

  if (/^[0-9,+~\-. ]+$/.test(normalized)) {
    return true;
  }

  if (normalized.length <= 1) {
    return true;
  }

  return false;
}

function dedupeAndFilterDrafts(lines) {
  return uniq(
    (lines ?? [])
      .map(normalizeDraftLine)
      .filter((line) => !isNoiseLine(line)),
  );
}

function guessCoursePosition(line, index, total) {
  const normalized = normalizeDraftLine(line);
  const lower = normalized.toLowerCase();

  if (
    lower.includes('tea') ||
    lower.includes('coffee') ||
    normalized.includes('커피') ||
    normalized.includes('차')
  ) {
    return 'beverage';
  }

  if (
    lower.includes('dessert') ||
    lower.includes('sweets') ||
    lower.includes('sherbet') ||
    lower.includes('sorbet') ||
    lower.includes('ice cream') ||
    normalized.includes('디저트') ||
    normalized.includes('소르베') ||
    normalized.includes('아이스') ||
    normalized.includes('빙') ||
    normalized.includes('다과') ||
    normalized.includes('하모니') ||
    normalized.includes('마무리')
  ) {
    return total - index <= 2 ? 'dessert' : 'petit_four';
  }

  if (
    lower.includes('hanwoo') ||
    lower.includes('lamb') ||
    lower.includes('galbi') ||
    lower.includes('beef') ||
    normalized.includes('한우') ||
    normalized.includes('양갈비') ||
    normalized.includes('갈비')
  ) {
    return 'main';
  }

  if (
    lower.includes('fish') ||
    lower.includes('tilefish') ||
    lower.includes('abalone') ||
    normalized.includes('생선') ||
    normalized.includes('전복') ||
    normalized.includes('장어') ||
    normalized.includes('도미') ||
    normalized.includes('갈치') ||
    normalized.includes('꽃게')
  ) {
    return index <= 2 ? 'starter' : 'fish';
  }

  if (index === 0) {
    return 'starter';
  }

  if (total - index <= 2) {
    return 'dessert';
  }

  if (index >= Math.max(2, total - 4)) {
    return 'main';
  }

  return 'starter';
}

function buildObservedTechniques(coursePosition) {
  switch (coursePosition) {
    case 'fish':
      return ['공개 메뉴 기반 생선 코스'];
    case 'main':
      return ['공개 메뉴 기반 메인 코스'];
    case 'dessert':
      return ['공개 메뉴 기반 디저트 코스'];
    case 'beverage':
      return ['공개 메뉴 기반 음료 코스'];
    default:
      return ['공개 메뉴 기반 코스명'];
  }
}

function buildTemperatureBand(coursePosition) {
  if (coursePosition === 'dessert' || coursePosition === 'beverage') {
    return 'room';
  }

  return 'mixed';
}

function buildRowsForMenu(menu, defaults) {
  const drafts = dedupeAndFilterDrafts(menu.courseTitleDrafts);

  return drafts.map((draft, index) => {
    const coursePosition = guessCoursePosition(draft, index, drafts.length);
    const localizedTitle = localizeMenuTitle(draft);

    return {
      priority: defaults?.priority ?? 'P1',
      sourceType: defaults?.sourceType ?? 'public_reference',
      sourceTrustScore: defaults?.sourceTrustScore ?? 0.9,
      seasonLabel: menu.seasonLabel ?? defaults?.seasonLabelFallback ?? 'public fallback source',
      coursePosition,
      dishPublicTitle: localizedTitle,
      dishPublicSubtitle: '',
      observedIngredients: [localizedTitle],
      observedTechniques: buildObservedTechniques(coursePosition),
      observedSensoryWords: ['공개 메뉴 초안'],
      temperatureBand: buildTemperatureBand(coursePosition),
      rationale:
        'Auto-generated from public source courseTitleDrafts. Review and refine before production use.',
      uncertaintyNotes:
        '공개 소스 courseTitleDrafts 기반 자동 행입니다. 실제 메뉴 순서와 표기를 검수하세요.',
    };
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.review) {
    throw new Error('Review JSON path is required.');
  }

  const reviewPath = resolvePath(options.review);
  const review = readJson(reviewPath);
  const outputPath = resolvePath(
    options.output ??
      path.join(path.dirname(reviewPath), 'review-template.autofilled.json'),
  );

  if (!Array.isArray(review.menus)) {
    throw new Error('Review JSON must include menus.');
  }

  const nextReview = {
    ...review,
    menus: review.menus.map((menu) => {
      if (Array.isArray(menu.rows) && menu.rows.length > 0) {
        return menu;
      }

      if (!menu.menuType || menu.menuType === 'other') {
        return menu;
      }

      return {
        ...menu,
        rows: buildRowsForMenu(menu, review.defaults),
      };
    }),
  };

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(nextReview, null, 2)}\n`, 'utf8');

  console.log(`[public-review-fill] output: ${path.relative(workspaceRoot, outputPath)}`);
  console.log(
    `[public-review-fill] summary: ${JSON.stringify(
      nextReview.menus.map((menu) => ({
        menuType: menu.menuType,
        title: menu.menuTitle,
        rows: Array.isArray(menu.rows) ? menu.rows.length : 0,
      })),
    )}`,
  );
}

main().catch((error) => {
  console.error(`[public-review-fill] failed: ${error.message}`);
  process.exit(1);
});
