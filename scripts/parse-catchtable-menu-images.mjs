import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();

const headingExcludes = new Set([
  'JUNGSIK',
  'MINGLES',
  'ONJIUM',
  'PAIRING',
  'SUPPLEMENT',
  '정식 당',
  '정식당',
]);

const rightColumnExcludes = [
  'GLASS',
  'DOM',
  'PREMIUM',
  'PAIRING',
];

const supplementInstructionKeywords = ['ADD ', 'DO SEA URCHIN', 'SEA URCHIN +'];

const dessertKeywords = ['HWACHAE', 'GOGUMA', 'MAPLE', 'DOLHAREUBANG', 'SEOUL', 'SWEET'];
const mainKeywords = ['DUCK', 'HANWOO', 'GALBI', 'BULGOGI', 'BEEF'];
const fishKeywords = ['SALMON', 'FISH', 'JEON BOK', 'ABALONE'];
const amuseKeywords = ['BANCHAN'];

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
  node scripts/parse-catchtable-menu-images.mjs <review-with-ocr-json-path>
  node scripts/parse-catchtable-menu-images.mjs --review <review-with-ocr-json-path>

Examples:
  npm run catchtable:parse -- tmp/catchtable/jungsik/review-template.with-ocr.json
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function isPriceOnly(text) {
  return /^[+₩]?\s?[\d,.]+$/.test(text);
}

function isMenuHeading(text) {
  const upper = text.toUpperCase();
  if (headingExcludes.has(text) || headingExcludes.has(upper)) {
    return true;
  }
  if (upper.includes('LUNCH SIGNATURE') || upper.includes('DINNER SIGNATURE')) {
    return true;
  }
  if (upper.startsWith('KRW ')) {
    return true;
  }
  return false;
}

function cleanCommonOcrTypos(text) {
  return normalizeText(text)
    .replace(/^SAMTAE\b/i, 'GAMTAE')
    .replace(/^SELEUNGDO\b/i, 'ULLEUNGDO')
    .replace(/^FALL IN ONE\b/i, 'ALL IN ONE')
    .replace(/^DO SEA URCHIN\b/i, 'ADD SEA URCHIN')
    .replace(/\bS GLASS\b/g, '5 GLASS');
}

function isSupplementInstruction(text) {
  const upper = text.toUpperCase();
  return supplementInstructionKeywords.some((keyword) => upper.startsWith(keyword)) || /\+\s*[\d,.]+$/.test(upper);
}

function guessCoursePosition(title, index) {
  const upper = title.toUpperCase();

  if (amuseKeywords.some((keyword) => upper.includes(keyword))) {
    return 'amuse';
  }
  if (dessertKeywords.some((keyword) => upper.includes(keyword))) {
    return 'dessert';
  }
  if (mainKeywords.some((keyword) => upper.includes(keyword))) {
    return 'main';
  }
  if (fishKeywords.some((keyword) => upper.includes(keyword))) {
    return upper.includes('SALMON') ? 'fish' : index <= 2 ? 'starter' : 'fish';
  }
  if (upper.includes('GUKSU') || upper.includes('GIMBAP') || upper.includes('BIBIMBAP')) {
    return 'other';
  }
  if (index <= 2) {
    return 'starter';
  }
  return 'other';
}

function inferSubtitle(title, pendingNotes) {
  if (!pendingNotes.length) {
    return '';
  }
  return pendingNotes.join(' | ');
}

function buildObservedIngredients(title) {
  return title;
}

function buildObservedTechniques(coursePosition) {
  switch (coursePosition) {
    case 'amuse':
      return 'menu image OCR';
    case 'starter':
      return 'named course from menu image';
    case 'fish':
      return 'seafood or fish course from menu image';
    case 'main':
      return 'main course from menu image';
    case 'dessert':
      return 'dessert course from menu image';
    default:
      return 'menu image OCR';
  }
}

function parseCoreRows(lines) {
  const leftColumn = lines.filter((line) => line.boundingBox.x < 0.5);
  const rows = [];

  for (const line of leftColumn) {
    const rawText = cleanCommonOcrTypos(line.text);
    const upper = rawText.toUpperCase();

    if (!rawText || isMenuHeading(rawText) || isPriceOnly(rawText)) {
      continue;
    }

    if (upper.includes('PAIRING') || upper.includes('SUPPLEMENT')) {
      continue;
    }

    if (isSupplementInstruction(rawText)) {
      continue;
    }

    const coursePosition = guessCoursePosition(rawText, rows.length);
    rows.push({
      priority: coursePosition === 'other' ? 'P2' : 'P1',
      coursePosition,
      dishPublicTitle: rawText,
      dishPublicSubtitle: '',
      observedIngredients: [buildObservedIngredients(rawText)],
      observedTechniques: [buildObservedTechniques(coursePosition)],
      observedSensoryWords: ['OCR-derived menu title'],
      temperatureBand: coursePosition === 'dessert' ? 'room' : 'mixed',
      rationale: 'Auto-generated from Catchtable OCR output. Review and refine before seed generation.',
      uncertaintyNotes: 'OCR-derived row. Confirm spelling, order, and course type against the menu image.',
    });
  }

  return rows;
}

function parseSupplementRows(lines) {
  const supplements = [];
  const seenSupplementTitles = new Set();
  const rightColumn = lines.filter((line) => line.boundingBox.x >= 0.5);
  const supplementHeadingIndex = rightColumn.findIndex((line) =>
    cleanCommonOcrTypos(line.text).toUpperCase().includes('SUPPLEMENT'),
  );

  const supplementLines = [];
  if (supplementHeadingIndex !== -1) {
    supplementLines.push(...rightColumn.slice(supplementHeadingIndex + 1));
  }
  supplementLines.push(
    ...lines.filter((line) => isSupplementInstruction(cleanCommonOcrTypos(line.text))),
  );
  supplementLines.sort((left, right) => right.boundingBox.y - left.boundingBox.y);
  let pendingPrice = null;

  for (const line of supplementLines) {
    const rawText = cleanCommonOcrTypos(line.text);
    const upper = rawText.toUpperCase();

    if (!rawText || isMenuHeading(rawText)) {
      continue;
    }

    if (rightColumnExcludes.some((keyword) => upper.includes(keyword))) {
      continue;
    }

    if (isSupplementInstruction(rawText)) {
      const cleanedTitle = normalizeText(rawText.replace(/\+\s*[\d,.]+$/, '').trim());
      const priceMatch = rawText.match(/([\d,.]+)$/);
      const subtitle = priceMatch ? `PRICE OCR ${priceMatch[1]}` : '';
      if (cleanedTitle && !seenSupplementTitles.has(cleanedTitle)) {
        supplements.push({
          priority: 'P2',
          coursePosition: 'other',
          dishPublicTitle: cleanedTitle,
          dishPublicSubtitle: subtitle,
          observedIngredients: [cleanedTitle],
          observedTechniques: ['supplement add-on from menu image'],
          observedSensoryWords: ['OCR-derived supplement add-on'],
          temperatureBand: 'room',
          rationale: 'Auto-generated add-on row from Catchtable OCR output. Review before seed generation.',
          uncertaintyNotes: 'OCR-derived supplement add-on. Confirm wording and final price against the menu image.',
        });
        seenSupplementTitles.add(cleanedTitle);
      }
      pendingPrice = null;
      continue;
    }

    if (isPriceOnly(rawText)) {
      pendingPrice = rawText;
      continue;
    }

    const priceMatch = rawText.match(/^(.*?)(\s+[\d,.]+)$/);
    const title = priceMatch ? normalizeText(priceMatch[1]) : rawText;
    const inlinePrice = priceMatch ? normalizeText(priceMatch[2]) : null;
    const subtitleParts = [];

    if (inlinePrice) {
      subtitleParts.push(`KRW ${inlinePrice.replace(/[^\d,]/g, '')}`);
    } else if (pendingPrice) {
      subtitleParts.push(`KRW ${pendingPrice.replace(/[^\d,]/g, '')}`);
    }

    if (seenSupplementTitles.has(title)) {
      pendingPrice = null;
      continue;
    }

    supplements.push({
      priority: 'P2',
      coursePosition: 'other',
      dishPublicTitle: title,
      dishPublicSubtitle: subtitleParts.join(' | '),
      observedIngredients: [title],
      observedTechniques: ['supplement item from menu image'],
      observedSensoryWords: ['OCR-derived supplement label'],
      temperatureBand: 'room',
      rationale: 'Auto-generated supplement row from Catchtable OCR output. Review before seed generation.',
      uncertaintyNotes: 'OCR-derived supplement. Confirm title spelling and price against the menu image.',
    });
    seenSupplementTitles.add(title);

    pendingPrice = null;
  }

  return supplements;
}

function parseMenuRows(menu) {
  const lines = Array.isArray(menu.ocr?.lines) ? menu.ocr.lines : [];
  if (!lines.length) {
    return [];
  }

  const coreRows = parseCoreRows(lines);
  const supplementRows = parseSupplementRows(lines);
  return [...coreRows, ...supplementRows];
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

  const parsed = {
    ...review,
    parsedAt: new Date().toISOString(),
    menus: review.menus.map((menu) => {
      if (menu.menuType === 'other') {
        return menu;
      }

      const autoRows = parseMenuRows(menu);
      return {
        ...menu,
        rows: autoRows,
        autoParseNotes: {
          generatedFromOcr: true,
          rowCount: autoRows.length,
          needsHumanReview: true,
        },
      };
    }),
  };

  const outputPath = resolvePath(
    options.output ?? path.join(path.dirname(reviewPath), 'review-template.parsed.json'),
  );

  fs.writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`);

  console.log(
    `[catchtable-parse] output: ${path.relative(workspaceRoot, outputPath)}`,
  );
  console.log(
    `[catchtable-parse] summary: ${JSON.stringify(
      parsed.menus.map((menu) => ({
        menuType: menu.menuType,
        rows: Array.isArray(menu.rows) ? menu.rows.length : 0,
      })),
    )}`,
  );
}

main().catch((error) => {
  console.error(`[catchtable-parse] failed: ${error.message}`);
  process.exit(1);
});
