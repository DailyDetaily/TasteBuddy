import process from 'node:process';
import {
  fetchNongsaroXml,
  getNongsaroResultMessage,
  getXmlField,
  getXmlItems,
  loadProjectEnv,
  requireNongsaroApiKey,
  summarizeNativeFoodDetailItem,
  summarizeNativeFoodListItem,
} from './utils/nongsaro-native-food-api.mjs';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const options = {
    detail: false,
    help: false,
    page: 1,
    query: '',
    rows: 5,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--detail') {
      options.detail = true;
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
    }
  }

  options.rows = Math.min(20, Math.max(1, options.rows));
  options.page = Math.max(1, options.page);

  return options;
}

function printUsage() {
  console.log(`
Usage:
  npm run native-food:smoke
  npm run native-food:smoke -- --query 비빔밥 --rows 5 --detail

Options:
  --query <text>   Search native food names. Defaults to the first API page.
  --rows <number>  Number of list rows to request. Defaults to 5, max 20.
  --page <number>  Page number. Defaults to 1.
  --detail         Fetch detail for the first returned item.
`.trim());
}

function printListSummary({ items, page, query, rows, totalCount }) {
  console.log('Nongsaro native food API smoke test OK');
  console.log(`- query: ${query || '(none)'}`);
  console.log(`- page: ${page}`);
  console.log(`- requested rows: ${rows}`);
  console.log(`- totalCount: ${totalCount || '(not provided)'}`);
  console.log(`- returned items: ${items.length}`);

  items.forEach((item, index) => {
    const name = item.trditfdNm || '(name missing)';
    const type = item.foodTyCodeFullname || '-';
    const cooking = item.ckryCodeFullname || '-';
    const id = item.cntntsNo || '-';

    console.log(`${index + 1}. ${name} | id=${id} | type=${type} | cooking=${cooking}`);
  });
}

async function main() {
  loadProjectEnv(workspaceRoot);

  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const apiKey = requireNongsaroApiKey();
  const listXml = await fetchNongsaroXml('fdNmLst', {
    apiKey,
    numOfRows: options.rows,
    pageNo: options.page,
    schTrditfdNm: options.query,
    schType: 'A',
  });
  const items = getXmlItems(listXml).map(summarizeNativeFoodListItem);
  const totalCount = getXmlField(listXml, 'totalCount');

  if (items.length === 0) {
    const resultMessage = getNongsaroResultMessage(listXml);
    throw new Error(`Nongsaro API returned no list items.${resultMessage ? ` Message: ${resultMessage}` : ''}`);
  }

  printListSummary({
    items,
    page: options.page,
    query: options.query,
    rows: options.rows,
    totalCount,
  });

  if (!options.detail) {
    return;
  }

  const firstItemId = items[0]?.cntntsNo;

  if (!firstItemId) {
    throw new Error('Cannot fetch detail because the first item does not include cntntsNo.');
  }

  const detailXml = await fetchNongsaroXml('fdNmDtl', {
    apiKey,
    cntntsNo: firstItemId,
  });
  const detailItemXml = getXmlItems(detailXml)[0];

  if (!detailItemXml) {
    throw new Error(`Nongsaro detail API returned no item for cntntsNo=${firstItemId}.`);
  }

  const detail = summarizeNativeFoodDetailItem(detailItemXml);

  console.log('\nFirst item detail summary:');
  console.log(JSON.stringify(detail, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
