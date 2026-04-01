import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const defaultConfigPath = path.join(
  workspaceRoot,
  'scripts',
  'config',
  'catchtable-target-restaurants.json',
);

function parseArgs(argv) {
  const options = {
    config: defaultConfigPath,
    output: path.join(workspaceRoot, 'tmp', 'catchtable', 'batch-summary.json'),
    attemptOcr: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--attempt-ocr') {
      options.attemptOcr = true;
      continue;
    }

    if (arg.startsWith('--config=')) {
      options.config = arg.slice('--config='.length).trim();
      continue;
    }

    if (arg === '--config') {
      options.config = argv[index + 1]?.trim() ?? options.config;
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      options.output = arg.slice('--output='.length).trim();
      continue;
    }

    if (arg === '--output') {
      options.output = argv[index + 1]?.trim() ?? options.output;
      index += 1;
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/run-catchtable-batch.mjs
  node scripts/run-catchtable-batch.mjs --attempt-ocr
  node scripts/run-catchtable-batch.mjs --config scripts/config/catchtable-target-restaurants.json
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

function runNodeScript(scriptName, args) {
  const scriptPath = path.join(workspaceRoot, 'scripts', scriptName);
  const result = spawnSync('node', [scriptPath, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function summarizeManifest(manifestPath) {
  const manifest = readJson(manifestPath);
  return {
    restaurantName: manifest.restaurant.displayName,
    menuCount: manifest.menus?.length ?? 0,
    imageCount: manifest.images?.length ?? 0,
  };
}

function tryFetchRestaurant(restaurant) {
  for (const slug of restaurant.slugCandidates) {
    const fetchResult = runNodeScript('fetch-catchtable-menu-assets.mjs', [slug]);
    const manifestPath = path.join(workspaceRoot, 'tmp', 'catchtable', slug, 'manifest.json');

    if (fetchResult.status === 0 && fs.existsSync(manifestPath)) {
      return {
        ok: true,
        slug,
        manifestPath,
        fetchResult,
        manifestSummary: summarizeManifest(manifestPath),
      };
    }
  }

  return {
    ok: false,
  };
}

function bootstrapReview(restaurantName, chefName, city, manifestPath) {
  return runNodeScript('bootstrap-catchtable-review.mjs', [
    manifestPath,
    '--chef-name',
    chefName,
    '--restaurant-name',
    restaurantName,
    '--city',
    city,
  ]);
}

function fetchPublicSources(configPath, restaurant) {
  return runNodeScript('fetch-public-restaurant-sources.mjs', [
    '--config',
    configPath,
    '--restaurant',
    restaurant.canonicalSlug ?? restaurant.name,
  ]);
}

function bootstrapPublicReview(restaurantName, chefName, city, manifestPath) {
  return runNodeScript('bootstrap-public-source-review.mjs', [
    manifestPath,
    '--chef-name',
    chefName,
    '--restaurant-name',
    restaurantName,
    '--city',
    city,
  ]);
}

function runOcrAndParse(slug, manifestPath, reviewPath) {
  const ocrResult = runNodeScript('ocr-catchtable-menu-assets.mjs', [
    manifestPath,
    '--review',
    reviewPath,
  ]);

  if (ocrResult.status !== 0) {
    return {
      ok: false,
      ocrResult,
    };
  }

  const withOcrPath = path.join(path.dirname(reviewPath), 'review-template.with-ocr.json');
  const parseResult = runNodeScript('parse-catchtable-menu-images.mjs', [withOcrPath]);

  return {
    ok: parseResult.status === 0,
    ocrResult,
    parseResult,
    withOcrPath,
    parsedPath: path.join(path.dirname(reviewPath), 'review-template.parsed.json'),
  };
}

function compactLogOutput(value) {
  return `${value ?? ''}`.trim().slice(0, 2000);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const configPath = resolvePath(options.config);
  const outputPath = resolvePath(options.output);
  const restaurants = readJson(configPath);
  const results = [];

  for (const restaurant of restaurants) {
    const fetchSummary = tryFetchRestaurant(restaurant);

    if (!fetchSummary.ok) {
      const fallbackManifestPath = path.join(
        workspaceRoot,
        'tmp',
        'public-sources',
        restaurant.canonicalSlug ?? restaurant.slugCandidates?.[0] ?? restaurant.name,
        'manifest.json',
      );
      const fallbackReviewPath = path.join(path.dirname(fallbackManifestPath), 'review-template.json');
      const fallbackFetchResult = Array.isArray(restaurant.publicSources)
        ? fetchPublicSources(configPath, restaurant)
        : null;

      if (fallbackFetchResult?.status === 0 && fs.existsSync(fallbackManifestPath)) {
        const fallbackReviewResult = bootstrapPublicReview(
          restaurant.name,
          restaurant.chefName,
          restaurant.city,
          fallbackManifestPath,
        );

        results.push({
          name: restaurant.name,
          chefName: restaurant.chefName,
          status: fallbackReviewResult.status === 0 ? 'fallback_ready_for_review' : 'fallback_review_failed',
          slugCandidates: restaurant.slugCandidates,
          publicManifestPath: path.relative(workspaceRoot, fallbackManifestPath),
          publicReviewPath: path.relative(workspaceRoot, fallbackReviewPath),
          fallbackFetchStdout: compactLogOutput(fallbackFetchResult.stdout),
          fallbackReviewStdout: compactLogOutput(fallbackReviewResult.stdout),
          fallbackReviewStderr: compactLogOutput(fallbackReviewResult.stderr),
        });
        continue;
      }

      results.push({
        name: restaurant.name,
        chefName: restaurant.chefName,
        status: 'blocked',
        slugCandidates: restaurant.slugCandidates,
        fallbackFetchStdout: compactLogOutput(fallbackFetchResult?.stdout),
        fallbackFetchStderr: compactLogOutput(fallbackFetchResult?.stderr),
      });
      continue;
    }

    const reviewPath = path.join(path.dirname(fetchSummary.manifestPath), 'review-template.json');
    const reviewResult = bootstrapReview(
      restaurant.name,
      restaurant.chefName,
      restaurant.city,
      fetchSummary.manifestPath,
    );

    const output = {
      name: restaurant.name,
      chefName: restaurant.chefName,
      status: reviewResult.status === 0 ? 'ready_for_review' : 'review_failed',
      slug: fetchSummary.slug,
      manifestPath: path.relative(workspaceRoot, fetchSummary.manifestPath),
      reviewPath: path.relative(workspaceRoot, reviewPath),
      menuCount: fetchSummary.manifestSummary.menuCount,
      imageCount: fetchSummary.manifestSummary.imageCount,
      fetchStdout: compactLogOutput(fetchSummary.fetchResult.stdout),
      reviewStdout: compactLogOutput(reviewResult.stdout),
      reviewStderr: compactLogOutput(reviewResult.stderr),
    };

    if (options.attemptOcr && fetchSummary.manifestSummary.imageCount > 0 && reviewResult.status === 0) {
      const ocrSummary = runOcrAndParse(fetchSummary.slug, fetchSummary.manifestPath, reviewPath);
      output.ocrStatus = ocrSummary.ok ? 'parsed' : 'failed';
      output.ocrStdout = compactLogOutput(ocrSummary.ocrResult?.stdout);
      output.ocrStderr = compactLogOutput(ocrSummary.ocrResult?.stderr);
      output.parseStdout = compactLogOutput(ocrSummary.parseResult?.stdout);
      output.parseStderr = compactLogOutput(ocrSummary.parseResult?.stderr);
    }

    results.push(output);
  }

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        attemptOcr: options.attemptOcr,
        results,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`[catchtable-batch] output: ${path.relative(workspaceRoot, outputPath)}`);
  console.log(
    `[catchtable-batch] summary: ${JSON.stringify(
      results.map((result) => ({
        name: result.name,
        status: result.status,
        slug: result.slug ?? null,
        menuCount: result.menuCount ?? 0,
        imageCount: result.imageCount ?? 0,
        ocrStatus: result.ocrStatus ?? null,
      })),
    )}`,
  );
}

main().catch((error) => {
  console.error(`[catchtable-batch] failed: ${error.message}`);
  process.exit(1);
});
