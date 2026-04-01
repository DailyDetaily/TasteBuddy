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

const tasteKeyMap = {
  inferredTasteSweet: 'sweet',
  inferredTasteSour: 'sour',
  inferredTasteBitter: 'bitter',
  inferredTasteSalty: 'salty',
  inferredTasteUmami: 'umami',
  inferredTasteFat: 'fat',
};

const perceptualKeyMap = {
  inferredBrightness: 'brightness',
  inferredHeaviness: 'heaviness',
  inferredCleanFinish: 'cleanFinish',
  inferredLinger: 'linger',
  inferredSmoke: 'smoke',
  inferredAromaIntensity: 'aromaIntensity',
  inferredTextureRichness: 'textureRichness',
  inferredThermalImpact: 'thermalImpact',
};

function parseArgs(argv) {
  const positional = [];
  const options = {
    review: null,
    output: null,
    restaurantSlug: null,
    restaurantName: null,
    chefName: null,
    city: null,
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

    if (arg.startsWith('--restaurant-slug=')) {
      options.restaurantSlug = arg.slice('--restaurant-slug='.length).trim();
      continue;
    }

    if (arg === '--restaurant-slug') {
      options.restaurantSlug = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--restaurant-name=')) {
      options.restaurantName = arg.slice('--restaurant-name='.length).trim();
      continue;
    }

    if (arg === '--restaurant-name') {
      options.restaurantName = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--chef-name=')) {
      options.chefName = arg.slice('--chef-name='.length).trim();
      continue;
    }

    if (arg === '--chef-name') {
      options.chefName = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--city=')) {
      options.city = arg.slice('--city='.length).trim();
      continue;
    }

    if (arg === '--city') {
      options.city = argv[index + 1]?.trim() ?? null;
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
  node scripts/generate-catchtable-seed-json.mjs <review-json-path>
  node scripts/generate-catchtable-seed-json.mjs --review <review-json-path> --output <seed-json-path>

Examples:
  npm run catchtable:generate-seed -- tmp/catchtable/jungsik/review-template.parsed.json
  npm run catchtable:generate-seed -- tmp/catchtable/jungsik/review-template.parsed.json --restaurant-name "정식당"
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
  if (acceptedCoursePositions.has(normalized)) {
    return normalized;
  }
  return 'other';
}

function toNumberOrNull(value) {
  if (value === '' || value == null) {
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

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue != null),
  );
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function splitNotes(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/\s*\|\s*|\s*;\s*|\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildVector(row, keyMap) {
  return compactObject(
    Object.fromEntries(
      Object.entries(keyMap).map(([rowKey, seedKey]) => [seedKey, clamp01(toNumberOrNull(row[rowKey]))]),
    ),
  );
}

function buildSourceDocumentKey(restaurantSlug, menu, menuIndex = 0) {
  const menuLabel = slugify(menu.menuType || menu.menuTitle || 'menu') || 'menu';
  const menuSeq =
    slugify(menu.foodMenuSeq || menu.menuTitle || menu.sourceTitle || '') ||
    `source-${String(menuIndex + 1).padStart(2, '0')}`;
  return `${restaurantSlug}-${menuLabel}-${menuSeq}`;
}

function buildDishExternalKey(sourceExternalKey, index) {
  return `${sourceExternalKey}-dish-${String(index + 1).padStart(2, '0')}`;
}

function buildExcerpt(menu) {
  const fullText = menu.ocr?.fullText?.trim();
  if (fullText) {
    return fullText.slice(0, 280);
  }

  const joinedTitles = ensureArray(menu.rows)
    .map((row) => {
      const localizedTitle = localizeMenuTitle(row.dishPublicTitle);
      const localizedSubtitle = localizeSubtitle(localizedTitle, row.dishPublicSubtitle);
      return [localizedTitle, localizedSubtitle].filter(Boolean).join(' · ');
    })
    .filter(Boolean)
    .slice(0, 6)
    .join(' / ');

  return joinedTitles || null;
}

function buildRawText(menu) {
  const sections = [];

  if (menu.ocr?.fullText?.trim()) {
    sections.push(menu.ocr.fullText.trim());
  }

  if (menu.localImageRelativePath) {
    sections.push(`Local image: ${menu.localImageRelativePath}`);
  }

  if (!sections.length) {
    const fallback = ensureArray(menu.rows)
      .map((row) => {
        const localizedTitle = localizeMenuTitle(row.dishPublicTitle);
        const localizedSubtitle = localizeSubtitle(localizedTitle, row.dishPublicSubtitle);
        return [localizedTitle, localizedSubtitle].filter(Boolean).join(' — ');
      })
      .filter(Boolean)
      .join('\n');
    return fallback || null;
  }

  return sections.join('\n\n');
}

function validateReview(review) {
  if (!review?.restaurant?.slug || !review?.restaurant?.name) {
    throw new Error('Review JSON must include restaurant.slug and restaurant.name.');
  }

  if (!Array.isArray(review.menus) || review.menus.length === 0) {
    throw new Error('Review JSON must include a non-empty menus array.');
  }
}

function buildSeed(review, options) {
  const restaurantSlug = options.restaurantSlug ?? review.restaurant.slug;
  const restaurantName = localizeRestaurantName(
    options.restaurantName ?? review.restaurant.name,
    restaurantSlug,
  );
  const city = localizeCity(options.city ?? review.restaurant.city ?? 'Seoul');
  const chefName = localizeChefName(options.chefName ?? review.restaurant.chefName ?? null);
  const sourceTrustScore = toNumberOrNull(review.defaults?.sourceTrustScore) ?? 0.95;

  const seed = {
    meta: {
      version: 1,
      description: `Catchtable seed generated from reviewed menu data for ${restaurantName}.`,
      generatedFrom: path.relative(workspaceRoot, resolvePath(options.review)),
      generatedAt: new Date().toISOString(),
      notes: [
        'Observed fields come from Catchtable menu images and reviewed OCR output.',
        'Inferred fields remain hypotheses until a human reviews or enriches them.',
      ],
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
            bio: buildChefBio('캐치테이블 메뉴 워크플로우'),
            avatar_path: `chefs/${slugify(chefName) || slugify(restaurantSlug)}.png`,
          },
        ]
      : [],
    source_documents: [],
    dish_entities: [],
    dish_observed_facts: [],
    dish_inference_profiles: [],
    research_rules: [],
  };

  review.menus.forEach((menu, menuIndex) => {
    if (!menu?.menuType || menu.menuType === 'other') {
      return;
    }

    const rows = Array.isArray(menu.rows) ? menu.rows : [];
    if (!rows.length) {
      return;
    }

    const sourceExternalKey = buildSourceDocumentKey(restaurantSlug, menu, menuIndex);
      seed.source_documents.push({
        external_key: sourceExternalKey,
        restaurant_slug: restaurantSlug,
        source_type: 'menu',
        title: menu.sourceTitle ?? `Catchtable ${restaurantName} ${menu.menuTitle ?? menu.menuType} menu`,
        url: menu.sourceUrl ?? null,
      excerpt: buildExcerpt(menu),
      raw_text: buildRawText(menu),
      trust_score: toNumberOrNull(menu.sourceTrustScore) ?? sourceTrustScore,
    });

    rows.forEach((row, index) => {
      const dishExternalKey = buildDishExternalKey(sourceExternalKey, index);
      const dishTitle = localizeMenuTitle(row.dishPublicTitle?.trim());
      if (!dishTitle) {
        return;
      }

      seed.dish_entities.push({
        external_key: dishExternalKey,
        restaurant_slug: restaurantSlug,
        season_label:
          row.seasonLabel ??
          menu.seasonLabel ??
          review.defaults?.seasonLabelFallback ??
          null,
        public_title: dishTitle,
        public_subtitle: localizeSubtitle(dishTitle, row.dishPublicSubtitle?.trim() || null),
        course_position: normalizeCoursePosition(row.coursePosition),
        status: 'active',
      });

      const observedConfidence =
        toNumberOrNull(row.sourceTrustScore) ??
        toNumberOrNull(menu.sourceTrustScore) ??
        sourceTrustScore;

      const factGroups = [
        ['ingredients', localizeIngredientValues(ensureArray(row.observedIngredients))],
        ['techniques', ensureArray(row.observedTechniques)],
        ['sensory_words', ensureArray(row.observedSensoryWords)],
      ];

      for (const [factType, values] of factGroups) {
        if (!values.length) {
          continue;
        }

        seed.dish_observed_facts.push({
          dish_external_key: dishExternalKey,
          source_external_key: sourceExternalKey,
          fact_type: factType,
          value_text: values.join(', '),
          value_json: { [factType]: values },
          confidence: observedConfidence,
        });
      }

      if (row.temperatureBand) {
        seed.dish_observed_facts.push({
          dish_external_key: dishExternalKey,
          source_external_key: sourceExternalKey,
          fact_type: 'temperature_band',
          value_text: row.temperatureBand,
          value_json: { temperature_band: row.temperatureBand },
          confidence: observedConfidence,
        });
      }

      const tasteVector = buildVector(row, tasteKeyMap);
      const perceptualVector = buildVector(row, perceptualKeyMap);
      const hasInferredSignals =
        Object.keys(tasteVector).length > 0 || Object.keys(perceptualVector).length > 0;
      const inferenceConfidence = clamp01(toNumberOrNull(row.inferenceConfidence));

      seed.dish_inference_profiles.push({
        dish_external_key: dishExternalKey,
        version: 1,
        taste_vector: tasteVector,
        perceptual_vector: perceptualVector,
        confidence: inferenceConfidence ?? (hasInferredSignals ? 0.5 : 0.15),
        rationale:
          row.rationale?.trim() ||
          'Auto-generated Catchtable draft. Review and enrich inferred vectors before production use.',
        uncertainty_notes:
          splitNotes(row.uncertaintyNotes).length > 0
            ? splitNotes(row.uncertaintyNotes)
            : ['Catchtable-derived draft row. Human review is still recommended.'],
        evidence_ids: [sourceExternalKey],
      });
    });
  });

  return seed;
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

  const outputPath = resolvePath(
    options.output ??
      path.join('supabase', 'seeds', `${options.restaurantSlug ?? review.restaurant.slug}-catchtable.seed.json`),
  );

  const seed = buildSeed(review, options);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

  const summary = {
    restaurants: seed.restaurants.length,
    chefs: seed.chefs.length,
    source_documents: seed.source_documents.length,
    dish_entities: seed.dish_entities.length,
    dish_observed_facts: seed.dish_observed_facts.length,
    dish_inference_profiles: seed.dish_inference_profiles.length,
  };

  console.log(`[catchtable-seed] review: ${path.relative(workspaceRoot, reviewPath)}`);
  console.log(`[catchtable-seed] output: ${path.relative(workspaceRoot, outputPath)}`);
  console.log(`[catchtable-seed] summary: ${JSON.stringify(summary)}`);
}

main().catch((error) => {
  console.error(`[catchtable-seed] failed: ${error.message}`);
  process.exit(1);
});
