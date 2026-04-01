import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const csvHeader = [
  'priority',
  'restaurant_name',
  'restaurant_slug',
  'chef_name',
  'city',
  'source_type',
  'source_title',
  'source_url',
  'source_trust_score',
  'season_label',
  'course_position',
  'dish_public_title',
  'dish_public_subtitle',
  'observed_ingredients',
  'observed_techniques',
  'observed_sensory_words',
  'temperature_band',
  'inferred_taste_sweet',
  'inferred_taste_sour',
  'inferred_taste_bitter',
  'inferred_taste_salty',
  'inferred_taste_umami',
  'inferred_taste_fat',
  'inferred_brightness',
  'inferred_heaviness',
  'inferred_clean_finish',
  'inferred_linger',
  'inferred_smoke',
  'inferred_aroma_intensity',
  'inferred_texture_richness',
  'inferred_thermal_impact',
  'inference_confidence',
  'rationale',
  'uncertainty_notes',
];

const acceptedCoursePositions = new Set([
  'snack',
  'amuse',
  'starter',
  'fish',
  'main',
  'dessert',
  'petit_four',
  'beverage',
  'other',
]);

const inferredKeys = [
  'inferredTasteSweet',
  'inferredTasteSour',
  'inferredTasteBitter',
  'inferredTasteSalty',
  'inferredTasteUmami',
  'inferredTasteFat',
  'inferredBrightness',
  'inferredHeaviness',
  'inferredCleanFinish',
  'inferredLinger',
  'inferredSmoke',
  'inferredAromaIntensity',
  'inferredTextureRichness',
  'inferredThermalImpact',
];

function parseArgs(argv) {
  const positional = [];
  const options = {
    review: null,
    outputDir: path.join(workspaceRoot, 'docs'),
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

    if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.slice('--output-dir='.length).trim();
      continue;
    }

    if (arg === '--output-dir') {
      options.outputDir = argv[index + 1]?.trim() ?? options.outputDir;
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
  node scripts/generate-catchtable-intake-csv.mjs <review-json-path>
  node scripts/generate-catchtable-intake-csv.mjs --review <review-json-path>

Examples:
  npm run catchtable:generate-csv -- tmp/catchtable/jungsik/review-template.json
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

function escapeCsvCell(value) {
  const stringValue = `${value ?? ''}`;
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function listFieldToCell(value) {
  if (Array.isArray(value)) {
    return value.join('|');
  }
  return value ?? '';
}

function normalizeCoursePosition(value) {
  if (!value) {
    return 'other';
  }
  return acceptedCoursePositions.has(value) ? value : 'other';
}

function normalizeNumericValue(value) {
  if (value === '' || value == null) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '';
}

function validateReview(review) {
  if (!review.restaurant?.name || !review.restaurant?.slug) {
    throw new Error('Review JSON must include restaurant.name and restaurant.slug.');
  }

  if (!Array.isArray(review.menus) || review.menus.length === 0) {
    throw new Error('Review JSON must include a non-empty menus array.');
  }
}

function buildCsvRow(review, menu, row) {
  const record = {
    priority: row.priority ?? review.defaults?.priority ?? 'P1',
    restaurant_name: review.restaurant.name,
    restaurant_slug: review.restaurant.slug,
    chef_name: review.restaurant.chefName ?? '',
    city: review.restaurant.city ?? '',
    source_type: row.sourceType ?? review.defaults?.sourceType ?? 'menu',
    source_title: row.sourceTitle ?? menu.sourceTitle ?? '',
    source_url: row.sourceUrl ?? menu.sourceUrl ?? '',
    source_trust_score:
      row.sourceTrustScore ?? review.defaults?.sourceTrustScore ?? '',
    season_label: row.seasonLabel ?? menu.seasonLabel ?? review.defaults?.seasonLabelFallback ?? '',
    course_position: normalizeCoursePosition(row.coursePosition),
    dish_public_title: row.dishPublicTitle ?? '',
    dish_public_subtitle: row.dishPublicSubtitle ?? '',
    observed_ingredients: listFieldToCell(row.observedIngredients),
    observed_techniques: listFieldToCell(row.observedTechniques),
    observed_sensory_words: listFieldToCell(row.observedSensoryWords),
    temperature_band: row.temperatureBand ?? review.defaults?.temperatureBand ?? 'room',
    inferred_taste_sweet: normalizeNumericValue(row.inferredTasteSweet),
    inferred_taste_sour: normalizeNumericValue(row.inferredTasteSour),
    inferred_taste_bitter: normalizeNumericValue(row.inferredTasteBitter),
    inferred_taste_salty: normalizeNumericValue(row.inferredTasteSalty),
    inferred_taste_umami: normalizeNumericValue(row.inferredTasteUmami),
    inferred_taste_fat: normalizeNumericValue(row.inferredTasteFat),
    inferred_brightness: normalizeNumericValue(row.inferredBrightness),
    inferred_heaviness: normalizeNumericValue(row.inferredHeaviness),
    inferred_clean_finish: normalizeNumericValue(row.inferredCleanFinish),
    inferred_linger: normalizeNumericValue(row.inferredLinger),
    inferred_smoke: normalizeNumericValue(row.inferredSmoke),
    inferred_aroma_intensity: normalizeNumericValue(row.inferredAromaIntensity),
    inferred_texture_richness: normalizeNumericValue(row.inferredTextureRichness),
    inferred_thermal_impact: normalizeNumericValue(row.inferredThermalImpact),
    inference_confidence: normalizeNumericValue(row.inferenceConfidence),
    rationale: row.rationale ?? '',
    uncertainty_notes: row.uncertaintyNotes ?? '',
  };

  return csvHeader.map((key) => escapeCsvCell(record[key])).join(',');
}

function outputFilePath(outputDir, restaurantSlug, menuType) {
  return path.join(outputDir, `mvp-content-intake-${restaurantSlug}-${menuType}.csv`);
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
  validateReview(review);

  const outputDir = resolvePath(options.outputDir);
  ensureDir(outputDir);

  const generatedFiles = [];
  for (const menu of review.menus) {
    if (!menu.menuType || menu.menuType === 'other') {
      continue;
    }

    const rows = Array.isArray(menu.rows) ? menu.rows : [];
    if (!rows.length) {
      continue;
    }

    const content = [
      csvHeader.join(','),
      ...rows.map((row) => buildCsvRow(review, menu, row)),
      '',
    ].join('\n');

    const filePath = outputFilePath(outputDir, review.restaurant.slug, menu.menuType);
    fs.writeFileSync(filePath, content);
    generatedFiles.push({
      menuType: menu.menuType,
      filePath,
      rows: rows.length,
    });
  }

  if (!generatedFiles.length) {
    throw new Error('No lunch/dinner rows were found. Add rows to the review JSON first.');
  }

  console.log(
    `[catchtable-csv] generated: ${JSON.stringify(
      generatedFiles.map((entry) => ({
        menuType: entry.menuType,
        relativePath: path.relative(workspaceRoot, entry.filePath),
        rows: entry.rows,
      })),
    )}`,
  );
}

main().catch((error) => {
  console.error(`[catchtable-csv] failed: ${error.message}`);
  process.exit(1);
});
