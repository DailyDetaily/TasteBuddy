import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const defaultSource = path.join(
  workspaceRoot,
  'data',
  'food-knowledge',
  'tba',
  'tba-food-knowledge-bridge.json',
);
const defaultOut = path.join(workspaceRoot, 'src', 'constants', 'tbaFoodKnowledgeRuntime.ts');

function parseArgs(argv) {
  const options = {
    help: false,
    limit: 260,
    out: defaultOut,
    source: defaultSource,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--source=')) {
      options.source = resolvePath(arg.slice('--source='.length));
      continue;
    }

    if (arg === '--source') {
      options.source = resolvePath(argv[index + 1] ?? defaultSource);
      index += 1;
      continue;
    }

    if (arg.startsWith('--out=')) {
      options.out = resolvePath(arg.slice('--out='.length));
      continue;
    }

    if (arg === '--out') {
      options.out = resolvePath(argv[index + 1] ?? defaultOut);
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
    }
  }

  options.limit = Math.max(100, options.limit);

  return options;
}

function printUsage() {
  console.log(`
Usage:
  npm run food-knowledge:runtime
  npm run food-knowledge:runtime -- --limit 400

Options:
  --source <path>  Full TBA bridge JSON. Defaults to data/food-knowledge/tba/tba-food-knowledge-bridge.json.
  --out <path>     Runtime TS constant path. Defaults to src/constants/tbaFoodKnowledgeRuntime.ts.
  --limit <number> Max runtime entries. Defaults to 260.
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compactArray(values, limit = 10) {
  return Array.from(new Set((values ?? []).map((value) => `${value ?? ''}`.trim()).filter(Boolean))).slice(0, limit);
}

function hasSource(entry, source) {
  return (entry.sourceRefs ?? []).some((ref) => ref.source === source);
}

function getRuntimePriority(entry) {
  let priority = entry.confidence ?? 0;

  if (entry.kind === 'native-dish') priority += 0.3;
  if (entry.status === 'human-reviewed') priority += 0.25;
  if (entry.status === 'active') priority += 0.18;
  if (entry.surfaces?.recommendation) priority += 0.16;
  if (entry.surfaces?.['chef-guide']) priority += 0.14;
  if (hasSource(entry, 'nongsaro-native-food-api')) priority += 0.12;
  if (hasSource(entry, 'foodon-taxonomy')) priority += 0.06;
  if ((entry.lexiconIds ?? []).length > 0) priority += 0.08;
  if ((entry.ingredientSignalIds ?? []).length + (entry.processSignalIds ?? []).length > 0) priority += 0.06;

  return Number(priority.toFixed(3));
}

function shouldIncludeRuntimeEntry(entry) {
  if (entry.status === 'retired' || !entry.surfaces?.['dining-note']) {
    return false;
  }

  return (
    entry.kind === 'native-dish' ||
    entry.confidence >= 0.72 ||
    hasSource(entry, 'foodon-taxonomy') ||
    ((entry.lexiconIds ?? []).length > 0 && entry.confidence >= 0.64)
  );
}

function toRuntimeEntry(entry) {
  return {
    aliases: compactArray(entry.aliases, 8),
    canonicalName: entry.canonicalName,
    confidence: entry.confidence,
    dishKindIds: compactArray(entry.dishKindIds, 8),
    foodGroup: entry.foodGroup ?? '',
    foodOnIds: compactArray(entry.foodOnIds, 8),
    id: entry.id,
    ingredientSignalIds: compactArray(entry.ingredientSignalIds, 8),
    kind: entry.kind,
    koName: entry.koName,
    lexiconIds: compactArray(entry.lexiconIds, 10),
    nativeFoodIds: compactArray(entry.nativeFoodIds, 4),
    processSignalIds: compactArray(entry.processSignalIds, 8),
    sourceRefs: (entry.sourceRefs ?? []).slice(0, 4),
    status: entry.status,
    surfaces: entry.surfaces,
  };
}

function buildRuntimeEntries(sourceItems, limit) {
  const forcedNativeEntries = sourceItems
    .filter((entry) => entry.kind === 'native-dish' && entry.surfaces?.['dining-note'])
    .map(toRuntimeEntry);
  const rankedEntries = sourceItems
    .filter(shouldIncludeRuntimeEntry)
    .map((entry) => ({
      entry: toRuntimeEntry(entry),
      priority: getRuntimePriority(entry),
    }))
    .sort((left, right) => (
      right.priority - left.priority ||
      right.entry.confidence - left.entry.confidence ||
      left.entry.koName.localeCompare(right.entry.koName, 'ko')
    ));
  const byId = new Map();

  [...forcedNativeEntries.map((entry) => ({ entry, priority: 999 })), ...rankedEntries].forEach(({ entry }) => {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  });

  return Array.from(byId.values()).slice(0, Math.max(limit, forcedNativeEntries.length));
}

function writeRuntimeConstant({
  count,
  entries,
  outPath,
  sourcePath,
  sourceVersion,
}) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const relativeSourcePath = path.relative(workspaceRoot, sourcePath);
  const body = `import type { TbaFoodKnowledgeEntry } from '../types/tbaFoodOntology';

export const TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION = '${sourceVersion ?? '0.1'}';
export const TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH = '${relativeSourcePath}';
export const TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT = ${count};

export const TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES = ${JSON.stringify(entries, null, 2)} satisfies readonly TbaFoodKnowledgeEntry[];
`;

  fs.writeFileSync(outPath, body);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const source = readJson(options.source);
  const sourceItems = Array.isArray(source.items) ? source.items : [];
  const entries = buildRuntimeEntries(sourceItems, options.limit);

  writeRuntimeConstant({
    count: sourceItems.length,
    entries,
    outPath: options.out,
    sourcePath: options.source,
    sourceVersion: source.version,
  });

  console.log(`Saved ${entries.length}/${sourceItems.length} TBA runtime food knowledge entries to ${path.relative(workspaceRoot, options.out)}`);
}

main();
