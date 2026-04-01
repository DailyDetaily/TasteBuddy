import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import {
  localizeChefName,
  localizeCity,
  localizeIngredientValues,
  localizeMenuTitle,
  localizeRestaurantName,
  localizeSubtitle,
} from './utils/content-localization.mjs';

const workspaceRoot = process.cwd();
const targetRestaurantSlugs = [
  'mingles-seoul',
  'onjium-seoul',
  'eatanic-garden-seoul',
  '7th-door-seoul',
  'jungsik',
  'jungsik-seoul',
];

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
  return {
    dryRun: flags.has('--dry-run'),
    help: flags.has('--help') || flags.has('-h'),
  };
}

function printUsage() {
  console.log(`
Usage:
  node scripts/normalize-supabase-content-korean.mjs
  node scripts/normalize-supabase-content-korean.mjs --dry-run
`.trim());
}

async function runQuery(label, action) {
  const result = await action();
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

function splitValues(valueText) {
  if (!valueText) {
    return [];
  }

  return `${valueText}`
    .split(/,|·/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function normalizeRestaurants(supabase, dryRun) {
  const restaurants = await runQuery('select restaurants', () =>
    supabase
      .from('restaurants')
      .select('id, slug, name, city')
      .in('slug', targetRestaurantSlugs),
  );

  let updatedCount = 0;

  for (const restaurant of restaurants) {
    const nextName = localizeRestaurantName(restaurant.name, restaurant.slug);
    const nextCity = localizeCity(restaurant.city ?? 'Seoul');
    const shouldUpdate = nextName !== restaurant.name || nextCity !== restaurant.city;

    if (!shouldUpdate) {
      continue;
    }

    updatedCount += 1;

    if (!dryRun) {
      await runQuery(`update restaurant ${restaurant.slug}`, () =>
        supabase
          .from('restaurants')
          .update({ name: nextName, city: nextCity })
          .eq('id', restaurant.id),
      );
    }
  }

  return restaurants;
}

async function normalizeChefs(supabase, restaurantIds, dryRun) {
  if (!restaurantIds.length) {
    return 0;
  }

  const chefs = await runQuery('select chefs', () =>
    supabase
      .from('chefs')
      .select('id, restaurant_id, display_name, is_active')
      .in('restaurant_id', restaurantIds),
  );

  const chefsByRestaurant = new Map();
  for (const chef of chefs) {
    if (!chefsByRestaurant.has(chef.restaurant_id)) {
      chefsByRestaurant.set(chef.restaurant_id, []);
    }
    chefsByRestaurant.get(chef.restaurant_id).push(chef);
  }

  let updatedCount = 0;

  for (const restaurantChefs of chefsByRestaurant.values()) {
    const exactNameSet = new Set(restaurantChefs.map((chef) => chef.display_name));

    for (const chef of restaurantChefs) {
      const localizedName = localizeChefName(chef.display_name);
      const hasLocalizedDuplicate =
        localizedName !== chef.display_name && exactNameSet.has(localizedName);

      const patch = {};

      if (localizedName !== chef.display_name && !hasLocalizedDuplicate) {
        patch.display_name = localizedName;
      }

      if (hasLocalizedDuplicate && chef.is_active !== false) {
        patch.is_active = false;
      }

      if (!Object.keys(patch).length) {
        continue;
      }

      updatedCount += 1;

      if (!dryRun) {
        await runQuery(`update chef ${chef.id}`, () =>
          supabase.from('chefs').update(patch).eq('id', chef.id),
        );
      }
    }
  }

  return updatedCount;
}

async function normalizeDishEntities(supabase, restaurantIds, dryRun) {
  if (!restaurantIds.length) {
    return { dishIds: [], updatedCount: 0 };
  }

  const dishes = await runQuery('select dish entities', () =>
    supabase
      .from('dish_entities')
      .select('id, restaurant_id, public_title, public_subtitle')
      .in('restaurant_id', restaurantIds),
  );

  let updatedCount = 0;

  for (const dish of dishes) {
    const nextTitle = localizeMenuTitle(dish.public_title);
    const nextSubtitle = localizeSubtitle(nextTitle, dish.public_subtitle);
    const shouldUpdate =
      nextTitle !== dish.public_title ||
      (nextSubtitle ?? null) !== (dish.public_subtitle ?? null);

    if (!shouldUpdate) {
      continue;
    }

    updatedCount += 1;

    if (!dryRun) {
      await runQuery(`update dish ${dish.id}`, () =>
        supabase
          .from('dish_entities')
          .update({
            public_title: nextTitle,
            public_subtitle: nextSubtitle,
          })
          .eq('id', dish.id),
      );
    }
  }

  return {
    dishIds: dishes.map((dish) => dish.id),
    updatedCount,
  };
}

async function normalizeIngredientFacts(supabase, dishIds, dryRun) {
  if (!dishIds.length) {
    return 0;
  }

  const facts = await runQuery('select dish observed facts', () =>
    supabase
      .from('dish_observed_facts')
      .select('id, fact_type, value_text, value_json')
      .in('dish_id', dishIds)
      .eq('fact_type', 'ingredients'),
  );

  let updatedCount = 0;

  for (const fact of facts) {
    const values =
      Object.values(fact.value_json ?? {}).find((value) => Array.isArray(value)) ?? splitValues(fact.value_text);
    const localizedValues = localizeIngredientValues(values);
    const nextValueText = localizedValues.join(', ');
    const nextValueJson = { ingredients: localizedValues };
    const currentValues = JSON.stringify(fact.value_json ?? {});
    const nextValues = JSON.stringify(nextValueJson);

    if (nextValueText === (fact.value_text ?? '') && currentValues === nextValues) {
      continue;
    }

    updatedCount += 1;

    if (!dryRun) {
      await runQuery(`update ingredient fact ${fact.id}`, () =>
        supabase
          .from('dish_observed_facts')
          .update({
            value_text: nextValueText,
            value_json: nextValueJson,
          })
          .eq('id', fact.id),
      );
    }
  }

  return updatedCount;
}

async function main() {
  loadWorkspaceEnv();

  const { dryRun, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printUsage();
    process.exit(0);
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

  const restaurants = await normalizeRestaurants(supabase, dryRun);
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  const chefUpdates = await normalizeChefs(supabase, restaurantIds, dryRun);
  const { dishIds, updatedCount: dishUpdates } = await normalizeDishEntities(
    supabase,
    restaurantIds,
    dryRun,
  );
  const ingredientFactUpdates = await normalizeIngredientFacts(supabase, dishIds, dryRun);

  console.log(
    `[normalize] ${dryRun ? 'dry-run ' : ''}complete: ${JSON.stringify({
      restaurants: restaurants.length,
      chefUpdates,
      dishUpdates,
      ingredientFactUpdates,
    })}`,
  );
}

main().catch((error) => {
  console.error(`[normalize] failed: ${error.message}`);
  process.exit(1);
});
