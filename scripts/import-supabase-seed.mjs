import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

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
  petitFour: 'petit_four',
  petit_four: 'petit_four',
  component: 'other',
};

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadWorkspaceEnv() {
  loadDotEnvFile(path.join(workspaceRoot, '.env.local'));
  loadDotEnvFile(path.join(workspaceRoot, '.env'));
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  return {
    seedPath: positional[0],
    dryRun: flags.has('--dry-run'),
    help: flags.has('--help') || flags.has('-h'),
  };
}

function printUsage() {
  console.log(`
Usage:
  node scripts/import-supabase-seed.mjs <seed-json-path>
  node scripts/import-supabase-seed.mjs <seed-json-path> --dry-run

Examples:
  npm run seed:mingles:dinner
  npm run seed:supabase -- supabase/seeds/mingles-dinner-2026-01-08.seed.json
  npm run seed:supabase -- supabase/seeds/mingles-dinner-2026-01-08.seed.json --dry-run
`.trim());
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveSeedPath(seedPath) {
  return path.isAbsolute(seedPath) ? seedPath : path.join(workspaceRoot, seedPath);
}

function requireValue(label, value) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function normalizeCoursePosition(value) {
  const normalized = coursePositionAliases[value] ?? value ?? 'other';
  if (acceptedCoursePositions.has(normalized)) {
    return normalized;
  }
  return 'other';
}

function chunk(items, size = 50) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function stableStringify(value) {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

async function runQuery(label, action) {
  const result = await action();
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

function buildSeedSummary(seed) {
  return {
    restaurants: seed.restaurants?.length ?? 0,
    chefs: seed.chefs?.length ?? 0,
    source_documents: seed.source_documents?.length ?? 0,
    dish_entities: seed.dish_entities?.length ?? 0,
    dish_observed_facts: seed.dish_observed_facts?.length ?? 0,
    dish_inference_profiles: seed.dish_inference_profiles?.length ?? 0,
    research_rules: seed.research_rules?.length ?? 0,
  };
}

function validateSeed(seed) {
  const requiredCollections = [
    'restaurants',
    'chefs',
    'source_documents',
    'dish_entities',
    'dish_observed_facts',
    'dish_inference_profiles',
  ];

  for (const key of requiredCollections) {
    if (!Array.isArray(seed[key])) {
      throw new Error(`Seed JSON must include an array named "${key}".`);
    }
  }
}

async function upsertRestaurant(supabase, restaurant) {
  const payload = {
    slug: restaurant.slug,
    name: restaurant.name,
    timezone: restaurant.timezone ?? 'Asia/Seoul',
    city: restaurant.city ?? null,
    intro: restaurant.intro ?? null,
    address: restaurant.address ?? null,
    is_active: restaurant.is_active ?? true,
  };

  const data = await runQuery('upsert restaurant', () =>
    supabase.from('restaurants').upsert(payload, { onConflict: 'slug' }).select('id, slug').single(),
  );

  return data;
}

async function upsertChef(supabase, chef, restaurantId) {
  const payload = {
    restaurant_id: restaurantId,
    display_name: chef.display_name,
    bio: chef.bio ?? null,
    avatar_path: chef.avatar_path ?? null,
    is_active: chef.is_active ?? true,
  };

  const data = await runQuery('upsert chef', () =>
    supabase
      .from('chefs')
      .upsert(payload, { onConflict: 'restaurant_id,display_name' })
      .select('id, display_name')
      .single(),
  );

  return data;
}

async function findExistingSourceDocument(supabase, { restaurantId, sourceType, title, url }) {
  let query = supabase
    .from('source_documents')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('source_type', sourceType)
    .eq('title', title)
    .limit(2);

  query = url == null ? query.is('url', null) : query.eq('url', url);

  const data = await runQuery('find source document', () => query);
  if (!data.length) {
    return null;
  }
  if (data.length > 1) {
    throw new Error(`Multiple source_documents found for "${title}".`);
  }
  return data[0];
}

async function upsertSourceDocument(supabase, sourceDocument, restaurantId) {
  const existing = await findExistingSourceDocument(supabase, {
    restaurantId,
    sourceType: sourceDocument.source_type,
    title: sourceDocument.title,
    url: sourceDocument.url ?? null,
  });

  const payload = {
    restaurant_id: restaurantId,
    source_type: sourceDocument.source_type,
    url: sourceDocument.url ?? null,
    title: sourceDocument.title,
    excerpt: sourceDocument.excerpt ?? null,
    raw_text: sourceDocument.raw_text ?? null,
    published_at: sourceDocument.published_at ?? null,
    trust_score: sourceDocument.trust_score ?? 0.5,
  };

  if (existing) {
    const data = await runQuery('update source document', () =>
      supabase.from('source_documents').update(payload).eq('id', existing.id).select('id').single(),
    );
    return data;
  }

  const data = await runQuery('insert source document', () =>
    supabase.from('source_documents').insert(payload).select('id').single(),
  );
  return data;
}

async function findExistingDishEntity(supabase, dishEntity, restaurantId) {
  let query = supabase
    .from('dish_entities')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('public_title', dishEntity.public_title)
    .eq('course_position', normalizeCoursePosition(dishEntity.course_position))
    .limit(2);

  query =
    dishEntity.season_label == null
      ? query.is('season_label', null)
      : query.eq('season_label', dishEntity.season_label);

  query =
    dishEntity.public_subtitle == null
      ? query.is('public_subtitle', null)
      : query.eq('public_subtitle', dishEntity.public_subtitle);

  const data = await runQuery('find dish entity', () => query);
  if (!data.length) {
    return null;
  }
  if (data.length > 1) {
    throw new Error(`Multiple dish_entities found for "${dishEntity.public_title}".`);
  }
  return data[0];
}

async function upsertDishEntity(supabase, dishEntity, restaurantId) {
  const existing = await findExistingDishEntity(supabase, dishEntity, restaurantId);
  const payload = {
    restaurant_id: restaurantId,
    season_label: dishEntity.season_label ?? null,
    public_title: dishEntity.public_title,
    public_subtitle: dishEntity.public_subtitle ?? null,
    course_position: normalizeCoursePosition(dishEntity.course_position),
    status: dishEntity.status ?? 'active',
  };

  if (existing) {
    const data = await runQuery('update dish entity', () =>
      supabase.from('dish_entities').update(payload).eq('id', existing.id).select('id').single(),
    );
    return data;
  }

  const data = await runQuery('insert dish entity', () =>
    supabase.from('dish_entities').insert(payload).select('id').single(),
  );
  return data;
}

async function replaceDishChildren(supabase, seed, ids) {
  const dishIds = Array.from(ids.dishEntities.values());
  if (!dishIds.length) {
    return;
  }

  await runQuery('delete existing dish_observed_facts', () =>
    supabase.from('dish_observed_facts').delete().in('dish_id', dishIds),
  );

  await runQuery('delete existing dish_inference_profiles', () =>
    supabase.from('dish_inference_profiles').delete().in('dish_id', dishIds),
  );

  const observedFactRows = [];
  const observedFactRowMap = new Map();

  for (const fact of seed.dish_observed_facts) {
    const row = {
      dish_id: ids.dishEntities.get(requireValue('dish_external_key', fact.dish_external_key)),
      source_document_id: fact.source_external_key
        ? ids.sourceDocuments.get(fact.source_external_key) ?? null
        : null,
      fact_type: requireValue('fact_type', fact.fact_type),
      value_text: fact.value_text ?? null,
      value_json: fact.value_json ?? {},
      confidence: fact.confidence ?? 0.7,
    };
    const key = [
      row.dish_id,
      row.fact_type,
      row.value_text ?? '',
      stableStringify(row.value_json),
    ].join('::');
    const existing = observedFactRowMap.get(key);

    if (!existing) {
      observedFactRowMap.set(key, row);
      observedFactRows.push(row);
      continue;
    }

    existing.confidence = Math.max(existing.confidence ?? 0, row.confidence ?? 0);
    existing.source_document_id = existing.source_document_id ?? row.source_document_id;
  }

  for (const batch of chunk(observedFactRows)) {
    await runQuery('insert dish_observed_facts', () =>
      supabase.from('dish_observed_facts').insert(batch),
    );
  }

  const inferenceRows = [];
  const inferenceRowMap = new Map();

  for (const profile of seed.dish_inference_profiles) {
    const row = {
      dish_id: ids.dishEntities.get(requireValue('dish_external_key', profile.dish_external_key)),
      version: profile.version ?? 1,
      taste_vector: profile.taste_vector ?? {},
      perceptual_vector: profile.perceptual_vector ?? {},
      confidence: profile.confidence ?? 0.5,
      rationale: profile.rationale ?? null,
      uncertainty_notes: profile.uncertainty_notes ?? [],
      evidence_ids: profile.evidence_ids ?? [],
    };
    const key = `${row.dish_id}:${row.version}`;
    const existing = inferenceRowMap.get(key);

    if (!existing) {
      inferenceRowMap.set(key, row);
      inferenceRows.push(row);
      continue;
    }

    existing.confidence = Math.max(existing.confidence ?? 0, row.confidence ?? 0);
    existing.rationale = existing.rationale ?? row.rationale;
    existing.uncertainty_notes = [
      ...new Set([...(existing.uncertainty_notes ?? []), ...(row.uncertainty_notes ?? [])]),
    ];
    existing.evidence_ids = [
      ...new Set([...(existing.evidence_ids ?? []), ...(row.evidence_ids ?? [])]),
    ];
  }

  for (const batch of chunk(inferenceRows)) {
    await runQuery('insert dish_inference_profiles', () =>
      supabase.from('dish_inference_profiles').insert(batch),
    );
  }
}

async function upsertResearchRules(supabase, researchRules) {
  if (!researchRules?.length) {
    return 0;
  }

  const payload = researchRules.map((rule) => ({
    rule_code: requireValue('rule_code', rule.rule_code),
    label: requireValue('label', rule.label),
    summary: requireValue('summary', rule.summary),
    trigger_features: rule.trigger_features ?? {},
    effect_taste_delta: rule.effect_taste_delta ?? {},
    effect_perceptual_delta: rule.effect_perceptual_delta ?? {},
    evidence_strength: rule.evidence_strength ?? 0.5,
    source_url: rule.source_url ?? null,
  }));

  await runQuery('upsert research_rules', () =>
    supabase.from('research_rules').upsert(payload, { onConflict: 'rule_code' }),
  );

  return payload.length;
}

async function importSeed(seed, supabase) {
  const ids = {
    restaurants: new Map(),
    sourceDocuments: new Map(),
    dishEntities: new Map(),
  };

  for (const restaurant of seed.restaurants) {
    const record = await upsertRestaurant(supabase, restaurant);
    ids.restaurants.set(restaurant.slug, record.id);
  }

  for (const chef of seed.chefs) {
    const restaurantId = ids.restaurants.get(requireValue('restaurant_slug', chef.restaurant_slug));
    if (!restaurantId) {
      throw new Error(`Missing restaurant for chef "${chef.display_name}".`);
    }
    await upsertChef(supabase, chef, restaurantId);
  }

  for (const sourceDocument of seed.source_documents) {
    const restaurantId = ids.restaurants.get(
      requireValue('restaurant_slug', sourceDocument.restaurant_slug),
    );
    if (!restaurantId) {
      throw new Error(`Missing restaurant for source document "${sourceDocument.title}".`);
    }
    const record = await upsertSourceDocument(supabase, sourceDocument, restaurantId);
    ids.sourceDocuments.set(
      requireValue('external_key', sourceDocument.external_key),
      record.id,
    );
  }

  for (const dishEntity of seed.dish_entities) {
    const restaurantId = ids.restaurants.get(requireValue('restaurant_slug', dishEntity.restaurant_slug));
    if (!restaurantId) {
      throw new Error(`Missing restaurant for dish "${dishEntity.public_title}".`);
    }
    const record = await upsertDishEntity(supabase, dishEntity, restaurantId);
    ids.dishEntities.set(requireValue('external_key', dishEntity.external_key), record.id);
  }

  await replaceDishChildren(supabase, seed, ids);
  const researchRuleCount = await upsertResearchRules(supabase, seed.research_rules);

  return {
    restaurants: ids.restaurants.size,
    chefs: seed.chefs.length,
    sourceDocuments: ids.sourceDocuments.size,
    dishEntities: ids.dishEntities.size,
    dishObservedFacts: seed.dish_observed_facts.length,
    dishInferenceProfiles: seed.dish_inference_profiles.length,
    researchRules: researchRuleCount,
  };
}

async function main() {
  loadWorkspaceEnv();

  const { seedPath, dryRun, help } = parseArgs(process.argv.slice(2));
  if (help || !seedPath) {
    printUsage();
    process.exit(help ? 0 : 1);
  }

  const absoluteSeedPath = resolveSeedPath(seedPath);
  const seed = readJson(absoluteSeedPath);
  validateSeed(seed);

  const summary = buildSeedSummary(seed);
  console.log(`[seed] file: ${path.relative(workspaceRoot, absoluteSeedPath)}`);
  console.log(`[seed] summary: ${JSON.stringify(summary)}`);

  if (dryRun) {
    console.log('[seed] dry-run complete. No Supabase writes were made.');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'Missing Supabase server credentials. Add SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to .env.local.',
    );
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result = await importSeed(seed, supabase);
  console.log(`[seed] import complete: ${JSON.stringify(result)}`);
}

main().catch((error) => {
  console.error(`[seed] failed: ${error.message}`);
  process.exit(1);
});
