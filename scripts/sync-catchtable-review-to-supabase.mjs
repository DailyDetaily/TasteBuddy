import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const positional = [];
  const options = {
    review: null,
    output: null,
    restaurantSlug: null,
    restaurantName: null,
    chefName: null,
    city: null,
    write: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--write') {
      options.write = true;
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
  node scripts/sync-catchtable-review-to-supabase.mjs <review-json-path>
  node scripts/sync-catchtable-review-to-supabase.mjs <review-json-path> --write

Examples:
  npm run catchtable:sync-review -- tmp/catchtable/jungsik/review-template.parsed.json
  npm run catchtable:sync-review -- tmp/catchtable/jungsik/review-template.parsed.json --write
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function runNodeScript(scriptRelativePath, args) {
  const result = spawnSync(process.execPath, [path.join(workspaceRoot, scriptRelativePath), ...args], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`${scriptRelativePath} failed with exit code ${result.status ?? 'unknown'}.`);
  }
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
  const seedPath = resolvePath(
    options.output ??
      path.join(
        'supabase',
        'seeds',
        `${options.restaurantSlug ?? path.basename(path.dirname(reviewPath))}-catchtable.seed.json`,
      ),
  );

  const generatorArgs = [reviewPath, '--output', seedPath];
  if (options.restaurantSlug) {
    generatorArgs.push('--restaurant-slug', options.restaurantSlug);
  }
  if (options.restaurantName) {
    generatorArgs.push('--restaurant-name', options.restaurantName);
  }
  if (options.chefName) {
    generatorArgs.push('--chef-name', options.chefName);
  }
  if (options.city) {
    generatorArgs.push('--city', options.city);
  }

  runNodeScript('scripts/generate-catchtable-seed-json.mjs', generatorArgs);

  const importerArgs = [seedPath];
  if (!options.write) {
    importerArgs.push('--dry-run');
  }
  runNodeScript('scripts/import-supabase-seed.mjs', importerArgs);

  console.log(
    `[catchtable-sync] ${options.write ? 'Imported' : 'Dry-run validated'} ${path.relative(
      workspaceRoot,
      seedPath,
    )}`,
  );
}

main().catch((error) => {
  console.error(`[catchtable-sync] failed: ${error.message}`);
  process.exit(1);
});
