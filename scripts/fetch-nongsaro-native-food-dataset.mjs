import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  buildNativeFoodImageUrls,
  fetchNongsaroXml,
  getNongsaroResultMessage,
  getXmlField,
  getXmlItems,
  loadProjectEnv,
  NONGSARO_NATIVE_FOOD_SERVICE_NAME,
  requireNongsaroApiKey,
  splitPathField,
  summarizeNativeFoodListItem,
  xmlItemToObject,
} from './utils/nongsaro-native-food-api.mjs';

const workspaceRoot = process.cwd();
const defaultOutPath = path.join(
  workspaceRoot,
  'data',
  'native-food',
  'raw',
  'nongsaro-native-food-dataset.json',
);

function parseArgs(argv) {
  const options = {
    all: false,
    delayMs: 120,
    help: false,
    limit: 20,
    out: defaultOutPath,
    page: 1,
    query: '',
    rows: 50,
    skipDetail: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--all') {
      options.all = true;
      continue;
    }

    if (arg === '--no-detail') {
      options.skipDetail = true;
      continue;
    }

    if (arg.startsWith('--query=')) {
      options.query = arg.slice('--query='.length).trim();
      continue;
    }

    if (arg === '--query') {
      options.query = argv[index + 1]?.trim() ?? '';
      index += 1;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      options.limit = Number.parseInt(arg.slice('--limit='.length), 10) || options.limit;
      continue;
    }

    if (arg === '--limit') {
      options.limit = Number.parseInt(argv[index + 1], 10) || options.limit;
      index += 1;
      continue;
    }

    if (arg.startsWith('--rows=')) {
      options.rows = Number.parseInt(arg.slice('--rows='.length), 10) || options.rows;
      continue;
    }

    if (arg === '--rows') {
      options.rows = Number.parseInt(argv[index + 1], 10) || options.rows;
      index += 1;
      continue;
    }

    if (arg.startsWith('--page=')) {
      options.page = Number.parseInt(arg.slice('--page='.length), 10) || options.page;
      continue;
    }

    if (arg === '--page') {
      options.page = Number.parseInt(argv[index + 1], 10) || options.page;
      index += 1;
      continue;
    }

    if (arg.startsWith('--delay-ms=')) {
      options.delayMs = Number.parseInt(arg.slice('--delay-ms='.length), 10) || options.delayMs;
      continue;
    }

    if (arg === '--delay-ms') {
      options.delayMs = Number.parseInt(argv[index + 1], 10) || options.delayMs;
      index += 1;
      continue;
    }

    if (arg.startsWith('--out=')) {
      options.out = resolvePath(arg.slice('--out='.length).trim());
      continue;
    }

    if (arg === '--out') {
      options.out = resolvePath(argv[index + 1]?.trim() ?? defaultOutPath);
      index += 1;
    }
  }

  options.limit = Math.max(1, options.limit);
  options.rows = Math.min(100, Math.max(1, options.rows));
  options.page = Math.max(1, options.page);
  options.delayMs = Math.max(0, options.delayMs);

  return options;
}

function printUsage() {
  console.log(`
Usage:
  npm run native-food:fetch
  npm run native-food:fetch -- --limit 100 --rows 50
  npm run native-food:fetch -- --all --rows 100
  npm run native-food:fetch -- --query 비빔밥 --limit 20 --out data/native-food/raw/bibimbap.json

Options:
  --limit <number>    Max list items to collect. Defaults to 20.
  --all               Collect all available list items. Overrides --limit.
  --rows <number>     List page size. Defaults to 50, max 100.
  --page <number>     Starting page. Defaults to 1.
  --query <text>      Search native food names.
  --delay-ms <number> Delay between detail requests. Defaults to 120.
  --no-detail         Save list fields only.
  --out <path>        Output JSON path. Defaults to data/native-food/raw/nongsaro-native-food-dataset.json.
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function compactText(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function buildNormalizedPreview({ detailFields, listFields, sourceId }) {
  const merged = {
    ...listFields,
    ...detailFields,
  };

  return {
    sourceId,
    koDishName: compactText(merged.trditfdNm),
    foodTypePath: splitPathField(merged.foodTyCodeFullname),
    cookingMethodPath: splitPathField(merged.ckryCodeFullname),
    mainIngredientsText: compactText(merged.fdmtInfo),
    subIngredientsText: compactText(merged.asstnMatrlInfo),
    recipeText: compactText(merged.stdCkryDtl),
    originText: compactText(merged.originDtl),
    imageUrls: buildNativeFoodImageUrls(merged),
  };
}

async function fetchListPage({ apiKey, pageNo, query, rows }) {
  const xml = await fetchNongsaroXml('fdNmLst', {
    apiKey,
    numOfRows: rows,
    pageNo,
    schTrditfdNm: query,
    schType: 'A',
  });
  const itemXmls = getXmlItems(xml);
  const items = itemXmls.map((itemXml) => ({
    fields: xmlItemToObject(itemXml),
    summary: summarizeNativeFoodListItem(itemXml),
  }));
  const totalCount = Number.parseInt(getXmlField(xml, 'totalCount'), 10) || items.length;
  const resultMessage = getNongsaroResultMessage(xml);

  return {
    items,
    resultMessage,
    totalCount,
  };
}

async function fetchDetail({ apiKey, sourceId }) {
  const xml = await fetchNongsaroXml('fdNmDtl', {
    apiKey,
    cntntsNo: sourceId,
  });
  const itemXml = getXmlItems(xml)[0];

  if (!itemXml) {
    const resultMessage = getNongsaroResultMessage(xml);
    throw new Error(`No detail item returned.${resultMessage ? ` Message: ${resultMessage}` : ''}`);
  }

  return xmlItemToObject(itemXml);
}

function buildDataset({
  errors,
  fetchedAt,
  items,
  options,
  totalCount,
}) {
  return {
    version: '0.1',
    source: 'nongsaro-native-food-api',
    serviceName: NONGSARO_NATIVE_FOOD_SERVICE_NAME,
    operations: options.skipDetail ? ['fdNmLst'] : ['fdNmLst', 'fdNmDtl'],
    fetchedAt,
    request: {
      query: options.query,
      all: options.all,
      limit: options.all ? null : options.limit,
      page: options.page,
      rows: options.rows,
      detail: !options.skipDetail,
    },
    totalCount,
    count: items.length,
    errors,
    items,
  };
}

async function main() {
  loadProjectEnv(workspaceRoot);

  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const apiKey = requireNongsaroApiKey();
  const fetchedAt = new Date().toISOString();
  const collectedItems = [];
  const errors = [];
  let totalCount = 0;
  let pageNo = options.page;

  console.log('Fetching Nongsaro native food dataset...');
  console.log(`- query: ${options.query || '(none)'}`);
  console.log(`- mode: ${options.all ? 'all' : `limit ${options.limit}`}`);
  console.log(`- detail: ${options.skipDetail ? 'no' : 'yes'}`);

  while (true) {
    const page = await fetchListPage({
      apiKey,
      pageNo,
      query: options.query,
      rows: options.rows,
    });

    totalCount = page.totalCount;

    if (page.items.length === 0) {
      if (collectedItems.length === 0) {
        throw new Error(`No list items returned.${page.resultMessage ? ` Message: ${page.resultMessage}` : ''}`);
      }

      break;
    }

    for (const item of page.items) {
      if (!options.all && collectedItems.length >= options.limit) {
        break;
      }

      const sourceId = item.summary.cntntsNo || item.fields.cntntsNo;
      let detailFields = {};

      if (!options.skipDetail && sourceId) {
        try {
          detailFields = await fetchDetail({ apiKey, sourceId });

          if (options.delayMs > 0) {
            await sleep(options.delayMs);
          }
        } catch (error) {
          errors.push({
            sourceId,
            trditfdNm: item.summary.trditfdNm,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      collectedItems.push({
        sourceId,
        listFields: item.fields,
        detailFields,
        normalizedPreview: buildNormalizedPreview({
          detailFields,
          listFields: item.fields,
          sourceId,
        }),
      });
    }

    console.log(`- page ${pageNo}: collected ${collectedItems.length}/${options.all ? totalCount : options.limit}`);

    if (!options.all && collectedItems.length >= options.limit) {
      break;
    }

    if (collectedItems.length >= totalCount) {
      break;
    }

    pageNo += 1;
  }

  const dataset = buildDataset({
    errors,
    fetchedAt,
    items: collectedItems,
    options,
    totalCount,
  });

  ensureDir(options.out);
  fs.writeFileSync(options.out, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(`Saved ${dataset.count} native food records to ${path.relative(workspaceRoot, options.out)}`);

  if (errors.length > 0) {
    console.log(`Detail errors: ${errors.length}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
