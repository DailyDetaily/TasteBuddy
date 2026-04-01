import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const positional = [];
  const options = {
    manifest: null,
    chefName: '',
    restaurantName: '',
    city: 'Seoul',
    output: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--manifest=')) {
      options.manifest = arg.slice('--manifest='.length).trim();
      continue;
    }

    if (arg === '--manifest') {
      options.manifest = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chef-name=')) {
      options.chefName = arg.slice('--chef-name='.length).trim();
      continue;
    }

    if (arg === '--chef-name') {
      options.chefName = argv[index + 1]?.trim() ?? '';
      index += 1;
      continue;
    }

    if (arg.startsWith('--restaurant-name=')) {
      options.restaurantName = arg.slice('--restaurant-name='.length).trim();
      continue;
    }

    if (arg === '--restaurant-name') {
      options.restaurantName = argv[index + 1]?.trim() ?? '';
      index += 1;
      continue;
    }

    if (arg.startsWith('--city=')) {
      options.city = arg.slice('--city='.length).trim();
      continue;
    }

    if (arg === '--city') {
      options.city = argv[index + 1]?.trim() ?? 'Seoul';
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

  if (!options.manifest) {
    options.manifest = positional[0] ?? null;
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/bootstrap-catchtable-review.mjs <manifest-path>
  node scripts/bootstrap-catchtable-review.mjs --manifest <manifest-path> --chef-name "Yim Jung-sik" --restaurant-name "정식당"

Examples:
  npm run catchtable:bootstrap-review -- tmp/catchtable/jungsik/manifest.json --chef-name "Yim Jung-sik"
  npm run catchtable:bootstrap-review -- tmp/catchtable/mingles/manifest.json --chef-name "Mingoo Kang"
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

function slugToTitle(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildSourceTitle(manifest, menu) {
  const label = menu.priceLabel ? `${menu.title} ${menu.priceLabel}` : menu.title;
  const updated = manifest.source.lastUpdatedLabel ? ` (Last update: ${manifest.source.lastUpdatedLabel})` : '';
  return `Catchtable ${manifest.restaurant.displayName} ${label} menu image${updated}`;
}

function buildReviewTemplate(manifest, options, manifestRelativePath) {
  const restaurantName =
    options.restaurantName ||
    manifest.restaurant.displayName ||
    slugToTitle(manifest.restaurant.slug);
  const review = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    manifestRelativePath,
    restaurant: {
      name: restaurantName,
      slug: manifest.restaurant.slug,
      chefName: options.chefName,
      city: options.city,
    },
    defaults: {
      priority: 'P1',
      sourceType: 'menu',
      sourceTrustScore: 0.99,
      temperatureBand: 'room',
      seasonLabelFallback: manifest.source.lastUpdatedLabel
        ? `${manifest.source.lastUpdatedLabel} catchtable`
        : 'catchtable menu',
    },
    instructions: {
      rowEditing: [
        'rows 배열에 코스별 항목을 추가한다.',
        'observed 값은 메뉴 이미지에 직접 보이는 정보만 적는다.',
        '비공개 레시피를 사실처럼 쓰지 않는다.',
        'inferred 값이 아직 없으면 빈 문자열로 두고 나중에 채운다.',
      ],
      coursePositionGuide: ['amuse', 'starter', 'fish', 'main', 'dessert', 'other'],
    },
    menus: manifest.menus.map((menu) => ({
      menuType: menu.menuType,
      menuTitle: menu.title,
      rawTitle: menu.rawTitle,
      priceLabel: menu.priceLabel,
      priceValue: menu.priceValue,
      foodMenuSeq: menu.foodMenuSeq,
      sourceTitle: buildSourceTitle(manifest, menu),
      sourceUrl: menu.url,
      localImageRelativePath: menu.localImageRelativePathGuess,
      seasonLabel: manifest.source.lastUpdatedLabel
        ? `${manifest.source.lastUpdatedLabel} ${menu.menuType}`
        : `${menu.menuType} catchtable`,
      rows: [],
    })),
  };

  return review;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.manifest) {
    throw new Error('Manifest path is required.');
  }

  const manifestPath = resolvePath(options.manifest);
  const manifest = readJson(manifestPath);
  const manifestRelativePath = path.relative(workspaceRoot, manifestPath);
  const outputPath = resolvePath(
    options.output ??
      path.join(path.dirname(manifestRelativePath), 'review-template.json'),
  );

  ensureDir(path.dirname(outputPath));

  const reviewTemplate = buildReviewTemplate(manifest, options, manifestRelativePath);
  fs.writeFileSync(outputPath, `${JSON.stringify(reviewTemplate, null, 2)}\n`);

  console.log(
    `[catchtable-review] created: ${path.relative(workspaceRoot, outputPath)}`,
  );
  console.log(
    `[catchtable-review] summary: ${JSON.stringify({
      restaurant: reviewTemplate.restaurant.name,
      menus: reviewTemplate.menus.length,
      menuTypes: reviewTemplate.menus.map((menu) => menu.menuType),
    })}`,
  );
}

main().catch((error) => {
  console.error(`[catchtable-review] failed: ${error.message}`);
  process.exit(1);
});
