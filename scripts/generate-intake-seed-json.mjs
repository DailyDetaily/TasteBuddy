import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  buildChefBio,
  buildRestaurantIntro,
  localizeChefName,
  localizeCity,
  localizeIngredientValues,
  localizeMenuTitle,
  localizeRestaurantName,
  localizeSubtitle,
} from './utils/content-localization.mjs';

const workspaceRoot = process.cwd();
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

const coursePositionAliases = {
  component: 'other',
  petitFour: 'petit_four',
};

const tasteFieldMap = {
  inferred_taste_sweet: 'sweet',
  inferred_taste_sour: 'sour',
  inferred_taste_bitter: 'bitter',
  inferred_taste_salty: 'salty',
  inferred_taste_umami: 'umami',
  inferred_taste_fat: 'fat',
};

const perceptualFieldMap = {
  inferred_brightness: 'brightness',
  inferred_heaviness: 'heaviness',
  inferred_clean_finish: 'cleanFinish',
  inferred_linger: 'linger',
  inferred_smoke: 'smoke',
  inferred_aroma_intensity: 'aromaIntensity',
  inferred_texture_richness: 'textureRichness',
  inferred_thermal_impact: 'thermalImpact',
};

function parseArgs(argv) {
  const csvPaths = [];
  const options = {
    outputDir: path.join(workspaceRoot, 'supabase', 'seeds'),
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
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
      csvPaths.push(arg);
    }
  }

  return {
    csvPaths,
    outputDir: options.outputDir,
    help: options.help,
  };
}

function printUsage() {
  console.log(`
Usage:
  node scripts/generate-intake-seed-json.mjs <csv-path> [more-csv-paths...]
  node scripts/generate-intake-seed-json.mjs --output-dir supabase/seeds <csv-path> [...]

Examples:
  npm run intake:generate-seed -- docs/content/intake/mvp-content-intake-mingles-lunch.csv docs/content/intake/mvp-content-intake-mingles-dinner.csv
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeCoursePosition(value) {
  const normalized = coursePositionAliases[value] ?? value ?? 'other';
  return acceptedCoursePositions.has(normalized) ? normalized : 'other';
}

function toNumberOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp01(value) {
  if (value == null) {
    return null;
  }
  return Math.min(1, Math.max(0, value));
}

function splitPipeList(value) {
  if (!value) {
    return [];
  }

  return `${value}`
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitNotes(value) {
  if (!value) {
    return [];
  }

  return `${value}`
    .split(/\s*\|\s*|\s*;\s*|\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null));
}

function normalizeSourceDocumentType(value) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();

  if (!normalized) {
    return 'menu';
  }

  if (
    normalized === 'menu' ||
    normalized === 'official_menu_page' ||
    normalized === 'official_pdf'
  ) {
    return 'menu';
  }

  if (normalized === 'review') {
    return 'review';
  }

  if (normalized === 'interview') {
    return 'interview';
  }

  if (normalized === 'social') {
    return 'social';
  }

  if (
    normalized === 'article' ||
    normalized === 'news_article' ||
    normalized === 'guide_article' ||
    normalized === 'official_page' ||
    normalized === 'michelin_article'
  ) {
    return 'article';
  }

  return 'article';
}

function buildVector(row, fieldMap) {
  return compactObject(
    Object.fromEntries(
      Object.entries(fieldMap).map(([csvKey, vectorKey]) => [
        vectorKey,
        clamp01(toNumberOrNull(row[csvKey])),
      ]),
    ),
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => `${cell}`.trim() !== ''));
}

function rowsFromCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const records = parseCsv(raw);
  if (!records.length) {
    return [];
  }

  const [header, ...dataRows] = records;
  return dataRows.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ''])),
  );
}

function buildSourceExternalKey(restaurantSlug, sourceTitle, sourceUrl, sourceIndex) {
  const titleSlug = slugify(sourceTitle);
  const urlSlug = slugify(sourceUrl);
  const identitySlug = [titleSlug, urlSlug]
    .filter(Boolean)
    .join('-')
    .slice(0, 80);
  const finalSlug = identitySlug || titleSlug || urlSlug || `source-${sourceIndex + 1}`;
  const suffix = !titleSlug && !urlSlug ? `-${sourceIndex + 1}` : '';
  return `${restaurantSlug}-${finalSlug}${suffix}`;
}

function outputPathForRestaurant(outputDir, restaurantSlug) {
  return path.join(outputDir, `${restaurantSlug}-menu.seed.json`);
}

function buildRestaurantSeed(restaurantSlug, rows, sourceFiles) {
  const first = rows[0];
  const restaurantName = localizeRestaurantName(first.restaurant_name, restaurantSlug);
  const chefName = localizeChefName(first.chef_name);
  const city = localizeCity(first.city || 'Seoul');

  const sourceGroups = new Map();
  for (const row of rows) {
    const key = `${row.source_type}|${row.source_title}|${row.source_url}`;
    if (!sourceGroups.has(key)) {
      sourceGroups.set(key, []);
    }
    sourceGroups.get(key).push(row);
  }

  const sourceDocuments = [];
  const sourceExternalKeys = new Map();
  Array.from(sourceGroups.entries()).forEach(([key, groupedRows], sourceIndex) => {
    const row = groupedRows[0];
    const externalKey = buildSourceExternalKey(
      restaurantSlug,
      row.source_title,
      row.source_url,
      sourceIndex,
    );
    sourceExternalKeys.set(key, externalKey);
    sourceDocuments.push({
      external_key: externalKey,
      restaurant_slug: restaurantSlug,
      source_type: normalizeSourceDocumentType(row.source_type),
      title: row.source_title,
      url: row.source_url || null,
      excerpt: groupedRows
        .slice(0, 6)
        .map((entry) => {
          const localizedTitle = localizeMenuTitle(entry.dish_public_title);
          const localizedSubtitle = localizeSubtitle(localizedTitle, entry.dish_public_subtitle);
          return [localizedTitle, localizedSubtitle].filter(Boolean).join(' · ');
        })
        .join(' / '),
      raw_text: groupedRows
        .map((entry) => {
          const localizedTitle = localizeMenuTitle(entry.dish_public_title);
          const localizedSubtitle = localizeSubtitle(localizedTitle, entry.dish_public_subtitle);
          return [localizedTitle, localizedSubtitle].filter(Boolean).join(' — ');
        })
        .join('\n'),
      trust_score: toNumberOrNull(row.source_trust_score) ?? 0.9,
    });
  });

  const dishEntities = [];
  const dishObservedFacts = [];
  const dishInferenceProfiles = [];
  const seenDishKeys = new Set();

  rows.forEach((row, index) => {
    const sourceGroupKey = `${row.source_type}|${row.source_title}|${row.source_url}`;
    const sourceExternalKey = sourceExternalKeys.get(sourceGroupKey);
    const normalizedCoursePosition = normalizeCoursePosition(row.course_position);
    const dishIdentityKey = [
      row.season_label || '',
      normalizedCoursePosition,
      row.dish_public_title || '',
      row.dish_public_subtitle || '',
    ].join('||');

    if (seenDishKeys.has(dishIdentityKey)) {
      return;
    }
    seenDishKeys.add(dishIdentityKey);

    const dishExternalKey = `${restaurantSlug}-dish-${String(dishEntities.length + 1).padStart(3, '0')}`;
    const localizedTitle = localizeMenuTitle(row.dish_public_title);
    const localizedSubtitle = localizeSubtitle(localizedTitle, row.dish_public_subtitle);
    const localizedIngredients = localizeIngredientValues(splitPipeList(row.observed_ingredients));

    dishEntities.push({
      external_key: dishExternalKey,
      restaurant_slug: restaurantSlug,
      season_label: row.season_label || null,
      public_title: localizedTitle,
      public_subtitle: localizedSubtitle,
      course_position: normalizedCoursePosition,
      status: 'active',
    });

    const observedConfidence = toNumberOrNull(row.source_trust_score) ?? 0.9;
    const observedGroups = [
      ['ingredients', localizedIngredients],
      ['techniques', splitPipeList(row.observed_techniques)],
      ['sensory_words', splitPipeList(row.observed_sensory_words)],
    ];

    for (const [factType, values] of observedGroups) {
      if (!values.length) {
        continue;
      }

      dishObservedFacts.push({
        dish_external_key: dishExternalKey,
        source_external_key: sourceExternalKey,
        fact_type: factType,
        value_text: values.join(', '),
        value_json: { [factType]: values },
        confidence: observedConfidence,
      });
    }

    if (row.temperature_band) {
      dishObservedFacts.push({
        dish_external_key: dishExternalKey,
        source_external_key: sourceExternalKey,
        fact_type: 'temperature_band',
        value_text: row.temperature_band,
        value_json: { temperature_band: row.temperature_band },
        confidence: observedConfidence,
      });
    }

    const tasteVector = buildVector(row, tasteFieldMap);
    const perceptualVector = buildVector(row, perceptualFieldMap);

    dishInferenceProfiles.push({
      dish_external_key: dishExternalKey,
      version: 1,
      taste_vector: tasteVector,
      perceptual_vector: perceptualVector,
      confidence: clamp01(toNumberOrNull(row.inference_confidence)) ?? 0.5,
      rationale:
        row.rationale ||
        'Generated from curated intake CSV. Review before production import if needed.',
      uncertainty_notes:
        splitNotes(row.uncertainty_notes).length > 0
          ? splitNotes(row.uncertainty_notes)
          : ['Imported from intake CSV without additional normalization.'],
      evidence_ids: [sourceExternalKey],
    });
  });

  return {
    meta: {
      version: 1,
      description: `Seed generated from curated intake CSV files for ${restaurantName}.`,
      generatedAt: new Date().toISOString(),
      sourceFiles: sourceFiles.map((filePath) => path.relative(workspaceRoot, filePath)),
    },
    restaurants: [
      {
        slug: restaurantSlug,
        name: restaurantName,
        timezone: 'Asia/Seoul',
        city,
        intro: buildRestaurantIntro(restaurantName),
      },
    ],
    chefs: chefName
      ? [
          {
            restaurant_slug: restaurantSlug,
            display_name: chefName,
            bio: buildChefBio('큐레이션 intake CSV'),
            avatar_path: `chefs/${slugify(chefName) || restaurantSlug}.png`,
          },
        ]
      : [],
    source_documents: sourceDocuments,
    dish_entities: dishEntities,
    dish_observed_facts: dishObservedFacts,
    dish_inference_profiles: dishInferenceProfiles,
    research_rules: [],
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.csvPaths.length) {
    throw new Error('At least one intake CSV path is required.');
  }

  const absoluteCsvPaths = options.csvPaths.map(resolvePath);
  const rows = absoluteCsvPaths.flatMap(rowsFromCsvFile);

  if (!rows.length) {
    throw new Error('No intake rows were found in the provided CSV files.');
  }

  const grouped = new Map();
  for (const row of rows) {
    const restaurantSlug = row.restaurant_slug;
    if (!restaurantSlug) {
      throw new Error('Each intake row must include restaurant_slug.');
    }
    if (!grouped.has(restaurantSlug)) {
      grouped.set(restaurantSlug, []);
    }
    grouped.get(restaurantSlug).push(row);
  }

  const outputDir = resolvePath(options.outputDir);
  ensureDir(outputDir);

  const generated = [];
  for (const [restaurantSlug, restaurantRows] of grouped.entries()) {
    const relatedSourceFiles = absoluteCsvPaths.filter((filePath) =>
      rowsFromCsvFile(filePath).some((row) => row.restaurant_slug === restaurantSlug),
    );
    const seed = buildRestaurantSeed(restaurantSlug, restaurantRows, relatedSourceFiles);
    const outputPath = outputPathForRestaurant(outputDir, restaurantSlug);
    fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

    generated.push({
      restaurantSlug,
      outputPath,
      restaurants: seed.restaurants.length,
      chefs: seed.chefs.length,
      source_documents: seed.source_documents.length,
      dish_entities: seed.dish_entities.length,
      dish_observed_facts: seed.dish_observed_facts.length,
      dish_inference_profiles: seed.dish_inference_profiles.length,
    });
  }

  generated.forEach((entry) => {
    console.log(
      `[intake-seed] output: ${path.relative(workspaceRoot, entry.outputPath)} ${JSON.stringify({
        restaurants: entry.restaurants,
        chefs: entry.chefs,
        source_documents: entry.source_documents,
        dish_entities: entry.dish_entities,
        dish_observed_facts: entry.dish_observed_facts,
        dish_inference_profiles: entry.dish_inference_profiles,
      })}`,
    );
  });
}

main().catch((error) => {
  console.error(`[intake-seed] failed: ${error.message}`);
  process.exit(1);
});
