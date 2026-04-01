import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const swiftScriptPath = path.join(workspaceRoot, 'scripts', 'ocr-image-with-vision.swift');
const swiftModuleCachePath = path.join(workspaceRoot, 'tmp', 'swift-module-cache');

function parseArgs(argv) {
  const positional = [];
  const options = {
    manifest: null,
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

    if (arg.startsWith('--manifest=')) {
      options.manifest = arg.slice('--manifest='.length).trim();
      continue;
    }

    if (arg === '--manifest') {
      options.manifest = argv[index + 1]?.trim() ?? null;
      index += 1;
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

  if (!options.manifest) {
    options.manifest = positional[0] ?? null;
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/ocr-catchtable-menu-assets.mjs <manifest-path>
  node scripts/ocr-catchtable-menu-assets.mjs --manifest <manifest-path> --review <review-template-path>

Examples:
  npm run catchtable:ocr -- tmp/catchtable/jungsik/manifest.json
  npm run catchtable:ocr -- tmp/catchtable/jungsik/manifest.json --review tmp/catchtable/jungsik/review-template.json
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

function relativeToWorkspace(filePath) {
  return path.relative(workspaceRoot, filePath);
}

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function imageScoreForMenu(menu, imageEntry) {
  const fullText = normalizeText(imageEntry.fullText).toUpperCase();
  let score = 0;

  if (!fullText) {
    return -Infinity;
  }

  if (menu.menuType === 'lunch') {
    if (fullText.includes('LUNCH')) {
      score += 12;
    }
    if (fullText.includes('DINNER')) {
      score -= 8;
    }
  }

  if (menu.menuType === 'dinner') {
    if (fullText.includes('DINNER')) {
      score += 12;
    }
    if (fullText.includes('LUNCH')) {
      score -= 8;
    }
  }

  if (fullText.includes('PAIRING') || fullText.includes('BY THE GLASS') || fullText.includes('CORKAGE')) {
    score -= 10;
  }

  if (fullText.includes('MICHELIN GUIDE') || fullText.includes('LA LISTE')) {
    score -= 16;
  }

  const titleTokens = normalizeText(menu.menuTitle)
    .toUpperCase()
    .split(/[^A-Z0-9가-힣]+/)
    .filter((token) => token.length >= 3)
    .filter((token) => !['LUNCH', 'DINNER', 'COURSE', 'MENU', 'PRICE', 'VARIABLE'].includes(token));

  for (const token of titleTokens) {
    if (fullText.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function buildMenuImageAssignments(manifest, ocrOutput) {
  const images = ocrOutput.images ?? [];
  const fallbackBySource = new Map(
    manifest.menus
      .filter((menu) => menu.localImageRelativePathGuess)
      .map((menu) => [menu.foodMenuSeq, menu.localImageRelativePathGuess]),
  );

  const availableImages = [...images];
  const assignments = new Map();

  const menus = manifest.menus.filter((menu) => menu.menuType !== 'other');
  const menusSorted = [...menus].sort((left, right) => {
    const leftSpecificity = left.menuType === 'dinner' ? 1 : 0;
    const rightSpecificity = right.menuType === 'dinner' ? 1 : 0;
    return rightSpecificity - leftSpecificity;
  });

  for (const menu of menusSorted) {
    const fallbackPath = fallbackBySource.get(menu.foodMenuSeq);
    const fallbackImage = fallbackPath
      ? availableImages.find((image) => image.relativeImagePath === fallbackPath)
      : null;

    const candidates = availableImages
      .map((image) => ({
        image,
        score: imageScoreForMenu(menu, image),
      }))
      .sort((left, right) => right.score - left.score);

    const best = candidates[0];
    const assignedImage = best && best.score > -10
      ? best.image
      : fallbackImage ?? null;

    if (!assignedImage) {
      continue;
    }

    assignments.set(menu.foodMenuSeq, assignedImage);
    const usedIndex = availableImages.findIndex(
      (entry) => entry.relativeImagePath === assignedImage.relativeImagePath,
    );
    if (usedIndex >= 0) {
      availableImages.splice(usedIndex, 1);
    }
  }

  return assignments;
}

function runVisionOCR(imageAbsolutePath) {
  ensureDir(swiftModuleCachePath);

  const stdout = execFileSync(
    '/usr/bin/swift',
    [swiftScriptPath, '--image', imageAbsolutePath],
    {
      encoding: 'utf8',
      cwd: workspaceRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SWIFT_MODULECACHE_PATH: swiftModuleCachePath,
      },
    },
  );

  return JSON.parse(stdout);
}

function attachOcrToReview(review, manifest, ocrOutput) {
  const imageAssignments = buildMenuImageAssignments(manifest, ocrOutput);

  return {
    ...review,
    ocrGeneratedAt: new Date().toISOString(),
    menus: review.menus.map((menu) => {
      const manifestMenu = manifest.menus.find(
        (candidate) =>
          candidate.menuType === menu.menuType &&
          candidate.foodMenuSeq === menu.foodMenuSeq,
      );

      const ocrEntry = manifestMenu?.foodMenuSeq
        ? imageAssignments.get(manifestMenu.foodMenuSeq) ?? null
        : null;

      if (!ocrEntry) {
        return menu;
      }

      return {
        ...menu,
        ocr: {
          sourceImageRelativePath: ocrEntry.relativeImagePath,
          fullText: ocrEntry.fullText,
          lines: ocrEntry.lines,
        },
      };
    }),
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
  const outputPath = resolvePath(
    options.output ?? path.join(path.dirname(manifestPath), 'ocr-output.json'),
  );

  ensureDir(path.dirname(outputPath));

  const imageEntries = manifest.images ?? [];
  if (!imageEntries.length) {
    throw new Error('Manifest does not contain any downloaded image entries.');
  }

  const results = imageEntries.map((imageEntry) => {
    const absolutePath = resolvePath(imageEntry.relativePath ?? imageEntry.absolutePath);
    const ocr = runVisionOCR(absolutePath);

    return {
      index: imageEntry.index,
      sourceUrl: imageEntry.sourceUrl,
      relativeImagePath: imageEntry.relativePath ?? relativeToWorkspace(absolutePath),
      fullText: ocr.fullText,
      lines: ocr.lines,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    restaurant: manifest.restaurant,
    manifestRelativePath: relativeToWorkspace(manifestPath),
    images: results,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`[catchtable-ocr] output: ${relativeToWorkspace(outputPath)}`);
  console.log(
    `[catchtable-ocr] summary: ${JSON.stringify(
      results.map((entry) => ({
        index: entry.index,
        relativeImagePath: entry.relativeImagePath,
        lineCount: entry.lines.length,
      })),
    )}`,
  );

  if (options.review) {
    const reviewPath = resolvePath(options.review);
    const review = readJson(reviewPath);
    const mergedReview = attachOcrToReview(review, manifest, payload);
    const mergedPath = path.join(path.dirname(reviewPath), 'review-template.with-ocr.json');
    fs.writeFileSync(mergedPath, `${JSON.stringify(mergedReview, null, 2)}\n`);
    console.log(`[catchtable-ocr] review: ${relativeToWorkspace(mergedPath)}`);
  }
}

main().catch((error) => {
  console.error(`[catchtable-ocr] failed: ${error.message}`);
  process.exit(1);
});
