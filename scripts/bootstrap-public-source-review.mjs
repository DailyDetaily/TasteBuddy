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
  node scripts/bootstrap-public-source-review.mjs <manifest-path>
  node scripts/bootstrap-public-source-review.mjs --manifest <manifest-path> --restaurant-name "라연"

Examples:
  npm run public-source:bootstrap-review -- tmp/public-sources/la-yeon-seoul/manifest.json
  npm run public-source:bootstrap-review -- tmp/public-sources/sosuheon-seoul/manifest.json --restaurant-name "소수헌"
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildReviewTemplate(manifest, options, manifestRelativePath) {
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    manifestRelativePath,
    collectionMode: 'public_fallback',
    restaurant: {
      name: options.restaurantName || manifest.restaurant.displayName || manifest.restaurant.slug,
      slug: manifest.restaurant.slug,
      chefName: options.chefName || manifest.restaurant.chefName || '',
      city: options.city || manifest.restaurant.city || 'Seoul',
    },
    defaults: {
      priority: 'P1',
      sourceType: 'public_reference',
      sourceTrustScore: 0.9,
      temperatureBand: 'room',
      seasonLabelFallback: 'public fallback source',
    },
    instructions: {
      rowEditing: [
        'sourceDocuments 와 courseTitleDrafts 를 먼저 확인한다.',
        '공개 메뉴/공식 페이지에 직접 나온 정보만 observed 로 옮긴다.',
        'courseTitleDrafts 는 초안이므로 검수 후 rows 배열에 수작업으로 옮긴다.',
        '메뉴 후보가 reference 인 경우 설명형 source 문서로만 사용하고 코스 row 는 신중하게 만든다.',
      ],
      nextStep: [
        'rows 를 채운 뒤 catchtable CSV 생성기 대신 intake CSV 템플릿을 수작업으로 채우거나 별도 seed 변환기로 넘긴다.',
      ],
    },
    sourceDocuments: manifest.documents.map((document) => ({
      index: document.index,
      label: document.label,
      sourceType: document.sourceType,
      url: document.url,
      title: document.title,
      publishedTime: document.publishedTime,
      trustScore: document.trustScore,
      contentRelativePath: document.contentRelativePath,
      excerpt: document.excerpt,
      courseTitleDrafts: document.courseTitleDrafts,
      pdfRelativePath: document.pdfRelativePath ?? null,
      pageImageRelativePaths: document.pageImageRelativePaths ?? [],
    })),
    menus: manifest.menuCandidates.map((candidate) => ({
      menuType: candidate.menuType,
      menuTitle: candidate.menuTitle,
      rawTitle: candidate.menuTitle,
      priceLabel: candidate.priceLabel,
      priceValue: candidate.priceValue,
      sourceTitle: candidate.sourceTitle,
      sourceUrl: candidate.sourceUrl,
      localImageRelativePath: candidate.localImageRelativePath ?? null,
      seasonLabel: candidate.seasonLabel || 'public fallback source',
      pageNumber: candidate.pageNumber ?? null,
      courseTitleDrafts: candidate.courseTitleDrafts,
      rows: [],
    })),
  };
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
    options.output ?? path.join(path.dirname(manifestRelativePath), 'review-template.json'),
  );

  ensureDir(path.dirname(outputPath));

  const reviewTemplate = buildReviewTemplate(manifest, options, manifestRelativePath);
  fs.writeFileSync(outputPath, `${JSON.stringify(reviewTemplate, null, 2)}\n`, 'utf8');

  console.log(`[public-review] created: ${path.relative(workspaceRoot, outputPath)}`);
  console.log(
    `[public-review] summary: ${JSON.stringify({
      restaurant: reviewTemplate.restaurant.name,
      documents: reviewTemplate.sourceDocuments.length,
      menus: reviewTemplate.menus.length,
      menuTypes: reviewTemplate.menus.map((menu) => menu.menuType),
    })}`,
  );
}

main().catch((error) => {
  console.error(`[public-review] failed: ${error.message}`);
  process.exit(1);
});
