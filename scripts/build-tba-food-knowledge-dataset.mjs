import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const bundledPythonPath =
  '/Users/sinjunho/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';

const defaultKoreanSource = path.join(
  workspaceRoot,
  'data',
  '국가표준식품성분',
  '식품성분표(10개정판).xlsx',
);
const defaultFoodOnSource = path.join(workspaceRoot, 'data', 'foodon', 'foodon-master', 'foodon-synonyms.tsv');
const defaultNativeFullSource = path.join(
  workspaceRoot,
  'data',
  'native-food',
  'raw',
  'nongsaro-native-food-dataset.json',
);
const defaultNativeSampleSource = path.join(
  workspaceRoot,
  'data',
  'native-food',
  'raw',
  'nongsaro-native-food.sample.json',
);
const defaultOutRoot = path.join(workspaceRoot, 'data', 'food-knowledge');

const SOURCE_CONFIDENCE = {
  foodOn: 0.75,
  koreanStandard: 0.68,
  nativeFood: 0.55,
};

const SURFACE_THRESHOLDS = {
  'taste-bubble': 0.45,
  'detail-tag': 0.45,
  'dining-note': 0.5,
  recommendation: 0.72,
  'chef-guide': 0.78,
  tcs: 0.5,
};

const FOCUS_FOODON_TERMS = [
  'beef',
  'broth',
  'buckwheat',
  'charcoal',
  'chicken',
  'crab',
  'duck',
  'fermented',
  'fish',
  'grilled',
  'lamb',
  'mackerel',
  'miso',
  'mushroom',
  'noodle',
  'oyster',
  'pork',
  'rice',
  'seafood',
  'seaweed',
  'shellfish',
  'shiitake',
  'shrimp',
  'soy sauce',
  'soybean',
  'tea',
  'tofu',
  'wheat',
];

const SIGNAL_RULES = [
  {
    dishKindIds: ['meat'],
    ingredientSignalIds: ['ingredient:pork'],
    lexiconIds: ['pork-savory-fat'],
    patterns: ['돼지고기', '돼지', '목살', '삼겹', 'pork'],
  },
  {
    dishKindIds: ['meat'],
    ingredientSignalIds: ['ingredient:beef'],
    lexiconIds: ['beef-fat-depth', 'meaty-aroma'],
    patterns: ['소고기', '쇠고기', '한우', 'beef'],
  },
  {
    dishKindIds: ['meat'],
    ingredientSignalIds: ['ingredient:poultry'],
    lexiconIds: ['poultry-clean-meat'],
    patterns: ['닭', '오리', '가금', 'chicken', 'duck', 'poultry'],
  },
  {
    dishKindIds: ['seafood'],
    ingredientSignalIds: ['ingredient:oily-fish'],
    lexiconIds: ['blue-fish-oil', 'seafood-aroma'],
    patterns: ['고등어', '방어', '참치', 'mackerel', 'oily fish'],
  },
  {
    dishKindIds: ['seafood'],
    ingredientSignalIds: ['ingredient:white-fish'],
    lexiconIds: ['white-fish-clean', 'clear-umami'],
    patterns: ['생선', '도미', '광어', '농어', 'fish', 'white fish'],
  },
  {
    dishKindIds: ['seafood'],
    ingredientSignalIds: ['ingredient:shellfish'],
    lexiconIds: ['shellfish-sweetness', 'briny-sea'],
    patterns: ['패류', '조개', '굴', '가리비', 'shellfish', 'oyster'],
  },
  {
    dishKindIds: ['seafood'],
    ingredientSignalIds: ['ingredient:crustacean'],
    lexiconIds: ['shellfish-sweetness', 'seafood-aroma'],
    patterns: ['갑각류', '새우', '게', 'crab', 'shrimp', 'crustacean'],
  },
  {
    dishKindIds: ['vegetable_herb', 'broth'],
    ingredientSignalIds: ['ingredient:mushroom'],
    lexiconIds: ['mushroom-earthy-umami', 'earthy-aroma'],
    patterns: ['버섯', '표고', 'shiitake', 'mushroom'],
  },
  {
    dishKindIds: ['vegetable_herb'],
    ingredientSignalIds: ['ingredient:leafy-green'],
    lexiconIds: ['green-freshness', 'leafy-green-bitterness'],
    patterns: ['채소', '나물', '허브', '잎채소', 'leafy', 'vegetable', 'herb'],
  },
  {
    dishKindIds: ['grain_noodle'],
    ingredientSignalIds: ['ingredient:grain'],
    lexiconIds: ['savory-depth'],
    patterns: ['곡류', '곡물', '쌀', '메밀', 'buckwheat', 'grain', 'rice'],
  },
  {
    dishKindIds: ['grain_noodle'],
    ingredientSignalIds: ['ingredient:noodle'],
    lexiconIds: ['chewy-resistance'],
    patterns: ['면', '국수', '파스타', 'noodle', 'pasta'],
  },
  {
    dishKindIds: ['fermented_jang'],
    ingredientSignalIds: ['ingredient:soy-jang'],
    processSignalIds: ['process:fermented'],
    lexiconIds: ['fermented-umami', 'fermented-aroma', 'rounded-salinity'],
    patterns: ['간장', '된장', '고추장', '장류', '미소', '발효', 'soy sauce', 'miso', 'fermented'],
  },
  {
    dishKindIds: ['grilled_smoked'],
    processSignalIds: ['process:grilled'],
    lexiconIds: ['charred-aroma', 'roasted-aroma'],
    patterns: ['구이', '구운', '굽는', '굽기', 'grilled', 'broiled'],
  },
  {
    dishKindIds: ['grilled_smoked'],
    processSignalIds: ['process:charcoal'],
    lexiconIds: ['charcoal-grilled'],
    patterns: ['숯불', '숯향', 'charcoal'],
  },
  {
    dishKindIds: ['broth'],
    processSignalIds: ['process:broth', 'process:boiled'],
    lexiconIds: ['clear-umami', 'deep-umami'],
    patterns: ['국', '탕', '육수', '국물', '브로스', '끓이는', 'soup', 'broth', 'stock'],
  },
  {
    dishKindIds: ['dessert'],
    ingredientSignalIds: ['ingredient:fruit'],
    lexiconIds: ['fruit-aroma', 'bright-acidity', 'clean-sweetness'],
    patterns: ['과일', '딸기', '감귤', '배', 'fruit'],
  },
  {
    dishKindIds: ['beverage_pairing'],
    ingredientSignalIds: ['ingredient:tea'],
    lexiconIds: ['clean-bitterness', 'aroma-lift'],
    patterns: ['차류', '차', 'tea', 'wine', 'beverage'],
  },
];

const FOOD_GROUP_RULES = [
  { dishKindIds: ['seafood'], patterns: ['어패류', '해조류'] },
  { dishKindIds: ['meat'], patterns: ['육류', '난류'] },
  { dishKindIds: ['vegetable_herb'], patterns: ['채소류', '버섯류', '두류'] },
  { dishKindIds: ['grain_noodle'], patterns: ['곡류', '감자류', '전분류'] },
  { dishKindIds: ['fermented_jang'], patterns: ['조미료류'] },
  { dishKindIds: ['dessert'], patterns: ['과일류', '당류', '우유 및 그 제품', '견과류'] },
  { dishKindIds: ['beverage_pairing'], patterns: ['차류', '음료류', '주류'] },
];

function parseArgs(argv) {
  const nativeSource = fs.existsSync(defaultNativeFullSource) ? defaultNativeFullSource : defaultNativeSampleSource;
  const options = {
    foodOnSource: defaultFoodOnSource,
    help: false,
    koreanSource: defaultKoreanSource,
    limitKorean: null,
    limitNative: null,
    nativeSource,
    outRoot: defaultOutRoot,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--korean-source=')) {
      options.koreanSource = resolvePath(arg.slice('--korean-source='.length));
      continue;
    }

    if (arg === '--korean-source') {
      options.koreanSource = resolvePath(argv[index + 1] ?? options.koreanSource);
      index += 1;
      continue;
    }

    if (arg.startsWith('--foodon-source=')) {
      options.foodOnSource = resolvePath(arg.slice('--foodon-source='.length));
      continue;
    }

    if (arg === '--foodon-source') {
      options.foodOnSource = resolvePath(argv[index + 1] ?? options.foodOnSource);
      index += 1;
      continue;
    }

    if (arg.startsWith('--native-source=')) {
      options.nativeSource = resolvePath(arg.slice('--native-source='.length));
      continue;
    }

    if (arg === '--native-source') {
      options.nativeSource = resolvePath(argv[index + 1] ?? options.nativeSource);
      index += 1;
      continue;
    }

    if (arg.startsWith('--out-root=')) {
      options.outRoot = resolvePath(arg.slice('--out-root='.length));
      continue;
    }

    if (arg === '--out-root') {
      options.outRoot = resolvePath(argv[index + 1] ?? options.outRoot);
      index += 1;
      continue;
    }

    if (arg.startsWith('--limit-korean=')) {
      options.limitKorean = Number.parseInt(arg.slice('--limit-korean='.length), 10) || null;
      continue;
    }

    if (arg.startsWith('--limit-native=')) {
      options.limitNative = Number.parseInt(arg.slice('--limit-native='.length), 10) || null;
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  npm run food-knowledge:build
  npm run food-knowledge:build -- --native-source data/native-food/raw/nongsaro-native-food-dataset.json
  npm run food-knowledge:build -- --limit-korean 200 --limit-native 20

Outputs:
  data/food-knowledge/normalized/korean-food-catalog.json
  data/food-knowledge/normalized/foodon-taxonomy-index.json
  data/food-knowledge/normalized/native-food-catalog.json
  data/food-knowledge/tba/tba-food-knowledge-bridge.json
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function compact(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function normalizeSearchText(value) {
  return compact(value)
    .toLowerCase()
    .replace(/[·,./|()[\]{}'"`~!?+<>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  const asciiSlug = normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (asciiSlug) {
    return asciiSlug;
  }

  return Buffer.from(value).toString('hex').slice(0, 24);
}

function addUnique(target, values = []) {
  values.filter(Boolean).forEach((value) => {
    if (!target.includes(value)) {
      target.push(value);
    }
  });
}

function textIncludesAny(sourceText, patterns) {
  const normalized = normalizeSearchText(sourceText);

  return patterns.some((pattern) => normalized.includes(normalizeSearchText(pattern)));
}

function inferSignalsFromText(sourceText, seed = {}) {
  const dishKindIds = [...(seed.dishKindIds ?? [])];
  const ingredientSignalIds = [...(seed.ingredientSignalIds ?? [])];
  const processSignalIds = [...(seed.processSignalIds ?? [])];
  const lexiconIds = [...(seed.lexiconIds ?? [])];

  SIGNAL_RULES.forEach((rule) => {
    if (!textIncludesAny(sourceText, rule.patterns)) {
      return;
    }

    addUnique(dishKindIds, rule.dishKindIds);
    addUnique(ingredientSignalIds, rule.ingredientSignalIds);
    addUnique(processSignalIds, rule.processSignalIds);
    addUnique(lexiconIds, rule.lexiconIds?.map((id) => `lexicon:${id}`));
  });

  return {
    dishKindIds,
    ingredientSignalIds,
    processSignalIds,
    lexiconIds,
  };
}

function inferDishKindsFromFoodGroup(foodGroup) {
  const dishKindIds = [];

  FOOD_GROUP_RULES.forEach((rule) => {
    if (textIncludesAny(foodGroup, rule.patterns)) {
      addUnique(dishKindIds, rule.dishKindIds);
    }
  });

  return dishKindIds;
}

function calculateConfidence({ foodOnIds = [], hasKoreanStandard = false, hasNativeFood = false, signalCount = 0 }) {
  let confidence = 0;

  if (foodOnIds.length > 0) {
    confidence = Math.max(confidence, SOURCE_CONFIDENCE.foodOn);
  }

  if (hasKoreanStandard) {
    confidence = Math.max(confidence, SOURCE_CONFIDENCE.koreanStandard);
  }

  if (hasNativeFood) {
    confidence = Math.max(confidence, SOURCE_CONFIDENCE.nativeFood);
  }

  confidence += Math.min(0.1, signalCount * 0.015);

  return Number(Math.min(0.92, confidence).toFixed(3));
}

function getSurfaceEligibility(confidence, status) {
  return {
    'taste-bubble': confidence >= SURFACE_THRESHOLDS['taste-bubble'] && status !== 'retired',
    'detail-tag': confidence >= SURFACE_THRESHOLDS['detail-tag'] && status !== 'retired',
    'dining-note': confidence >= SURFACE_THRESHOLDS['dining-note'] && status !== 'retired',
    recommendation: confidence >= SURFACE_THRESHOLDS.recommendation && status !== 'retired',
    'chef-guide': confidence >= SURFACE_THRESHOLDS['chef-guide'] && (status === 'active' || status === 'human-reviewed'),
    tcs: confidence >= SURFACE_THRESHOLDS.tcs && status !== 'retired',
  };
}

function findPythonWithOpenpyxl() {
  const candidates = [
    process.env.PYTHON,
    bundledPythonPath,
    'python3',
    'python',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['-c', 'import openpyxl'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status === 0) {
      return candidate;
    }
  }

  throw new Error('Cannot find a Python runtime with openpyxl. Set PYTHON to a Python executable that can import openpyxl.');
}

function extractKoreanCatalog({ koreanSource, outPath }) {
  const python = findPythonWithOpenpyxl();
  const scriptPath = path.join(workspaceRoot, 'scripts', 'extract-korean-standard-food-catalog.py');
  const result = spawnSync(python, [scriptPath, '--source', koreanSource, '--out', outPath], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Failed to extract Korean standard food catalog.');
  }

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

function stripTsvValue(value) {
  return compact(value)
    .replace(/^<|>$/g, '')
    .replace(/^"|"$/g, '')
    .replace(/"@[a-z]+$/i, '')
    .replace(/@[a-z]+$/i, '')
    .trim();
}

function classifyFoodOnKind(label) {
  const normalized = normalizeSearchText(label);

  if (/(grill|broil|ferment|process|smok|boil|steam|roast|fry|cured|pickled)/.test(normalized)) {
    return 'process';
  }

  if (/(product|beverage|sauce|soup|meat|fish|mushroom|seed|rice|wheat|soy|pork|beef)/.test(normalized)) {
    return 'ingredient';
  }

  return 'product-category';
}

function buildFoodOnTaxonomyIndex(sourcePath) {
  const groups = new Map();
  const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).slice(1);

  lines.forEach((line) => {
    if (!line.trim()) {
      return;
    }

    const [classValue, parentValue, typeValue, labelValue] = line.split('\t');
    const iri = stripTsvValue(classValue);
    const parentIri = stripTsvValue(parentValue);
    const type = stripTsvValue(typeValue);
    const label = stripTsvValue(labelValue);

    if (!iri || !label || !iri.includes('/FOODON_')) {
      return;
    }

    if (!FOCUS_FOODON_TERMS.some((term) => normalizeSearchText(label).includes(normalizeSearchText(term)))) {
      return;
    }

    const existing = groups.get(iri) ?? {
      id: `foodon:${iri.split('/').pop()}`,
      iri,
      canonicalName: '',
      aliases: [],
      kind: 'product-category',
      parentIds: [],
      source: 'FoodOn-reference',
    };

    if (parentIri && parentIri.includes('/FOODON_')) {
      addUnique(existing.parentIds, [`foodon:${parentIri.split('/').pop()}`]);
    }

    if (type === 'label' && !existing.canonicalName) {
      existing.canonicalName = label;
      existing.kind = classifyFoodOnKind(label);
    }

    addUnique(existing.aliases, [label]);
    groups.set(iri, existing);
  });

  return Array.from(groups.values())
    .filter((entry) => entry.canonicalName)
    .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
}

function normalizeNativeFoodCatalog(sourcePath, limit) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return {
      version: '0.1',
      source: 'nongsaro-native-food-api',
      sourcePath,
      count: 0,
      items: [],
    };
  }

  const raw = readJson(sourcePath);
  const sourceItems = Array.isArray(raw.items) ? raw.items : [];
  const items = sourceItems.slice(0, limit ?? sourceItems.length).map((item) => {
    const preview = item.normalizedPreview ?? {};

    return {
      sourceId: compact(item.sourceId ?? preview.sourceId),
      koDishName: compact(preview.koDishName),
      foodTypePath: Array.isArray(preview.foodTypePath) ? preview.foodTypePath.map(compact).filter(Boolean) : [],
      cookingMethodPath: Array.isArray(preview.cookingMethodPath) ? preview.cookingMethodPath.map(compact).filter(Boolean) : [],
      mainIngredientsText: compact(preview.mainIngredientsText),
      subIngredientsText: compact(preview.subIngredientsText),
      recipeText: compact(preview.recipeText),
      originText: compact(preview.originText),
      imageUrls: Array.isArray(preview.imageUrls) ? preview.imageUrls : [],
      source: 'nongsaro-native-food-api',
    };
  });

  return {
    version: '0.1',
    source: 'nongsaro-native-food-api',
    sourcePath,
    totalCount: raw.totalCount ?? items.length,
    count: items.length,
    items,
  };
}

function getFoodOnMatches(text, foodOnEntries, limit = 4) {
  const normalized = normalizeSearchText(text);

  if (!normalized) {
    return [];
  }

  return foodOnEntries
    .map((entry) => {
      const labels = [entry.canonicalName, ...entry.aliases].map(normalizeSearchText).filter(Boolean);
      const score = labels.reduce((maxScore, label) => {
        if (normalized === label || normalized.includes(label) || label.includes(normalized)) {
          return Math.max(maxScore, 1);
        }

        const tokens = label.split(/\s+/).filter((token) => token.length >= 3);
        const matchedTokens = tokens.filter((token) => normalized.includes(token)).length;

        return Math.max(maxScore, matchedTokens > 0 ? Math.min(0.76, matchedTokens / Math.max(3, tokens.length)) : 0);
      }, 0);

      return { entry, score };
    })
    .filter((match) => match.score >= 0.5)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function createBridgeEntry({
  aliases = [],
  canonicalName,
  foodGroup = '',
  foodOnIds = [],
  id,
  kind,
  koName,
  nativeFoodIds = [],
  sourceRefs,
  sourceText,
  status = 'candidate',
}) {
  const seededDishKindIds = inferDishKindsFromFoodGroup(foodGroup);
  const mapped = inferSignalsFromText(sourceText, { dishKindIds: seededDishKindIds });
  const signalCount = mapped.ingredientSignalIds.length + mapped.processSignalIds.length + mapped.lexiconIds.length;
  const confidence = calculateConfidence({
    foodOnIds,
    hasKoreanStandard: sourceRefs.some((ref) => ref.source === 'korean-standard-food-composition-db'),
    hasNativeFood: sourceRefs.some((ref) => ref.source === 'nongsaro-native-food-api'),
    signalCount,
  });

  return {
    id,
    kind,
    koName,
    canonicalName,
    aliases,
    sourceRefs,
    foodGroup,
    foodOnIds,
    nativeFoodIds,
    dishKindIds: mapped.dishKindIds,
    ingredientSignalIds: mapped.ingredientSignalIds,
    processSignalIds: mapped.processSignalIds,
    lexiconIds: mapped.lexiconIds,
    confidence,
    status,
    surfaces: getSurfaceEligibility(confidence, status),
  };
}

function buildTbaFoodKnowledgeBridge({ foodOnIndex, koreanCatalog, nativeCatalog }) {
  const entries = [];

  koreanCatalog.items.forEach((item) => {
    const sourceText = [
      item.koName,
      item.englishName,
      item.scientificName,
      item.foodGroup,
      ...(item.aliases ?? []),
    ].join(' ');
    const foodOnMatches = getFoodOnMatches(sourceText, foodOnIndex.items);
    const foodOnIds = foodOnMatches.map((match) => match.entry.id);

    entries.push(createBridgeEntry({
      aliases: item.aliases ?? [],
      canonicalName: item.englishName || item.koName,
      foodGroup: item.foodGroup,
      foodOnIds,
      id: `tba-food:korean-standard:${item.id.replace(/^korean-food:/, '')}`,
      kind: 'korean-food',
      koName: item.koName,
      sourceRefs: [
        {
          id: item.foodCode || item.dbIndex,
          source: 'korean-standard-food-composition-db',
          version: item.sourceVersion,
        },
      ],
      sourceText,
      status: 'candidate',
    }));
  });

  nativeCatalog.items.forEach((item) => {
    const sourceText = [
      item.koDishName,
      item.foodTypePath.join(' '),
      item.cookingMethodPath.join(' '),
      item.mainIngredientsText,
      item.subIngredientsText,
      item.recipeText,
    ].join(' ');
    const foodOnMatches = getFoodOnMatches(sourceText, foodOnIndex.items, 8);
    const foodOnIds = foodOnMatches.map((match) => match.entry.id);

    entries.push(createBridgeEntry({
      aliases: [item.koDishName],
      canonicalName: item.koDishName,
      foodGroup: item.foodTypePath.at(-1) ?? item.foodTypePath[0] ?? '',
      foodOnIds,
      id: `tba-food:native:${item.sourceId || slugify(item.koDishName)}`,
      kind: 'native-dish',
      koName: item.koDishName,
      nativeFoodIds: item.sourceId ? [item.sourceId] : [],
      sourceRefs: [
        {
          id: item.sourceId,
          source: 'nongsaro-native-food-api',
        },
      ],
      sourceText,
      status: 'candidate',
    }));
  });

  foodOnIndex.items.forEach((item) => {
    const sourceText = [item.canonicalName, ...item.aliases].join(' ');
    const mapped = inferSignalsFromText(sourceText);

    if (
      mapped.dishKindIds.length === 0 &&
      mapped.ingredientSignalIds.length === 0 &&
      mapped.processSignalIds.length === 0
    ) {
      return;
    }

    entries.push(createBridgeEntry({
      aliases: item.aliases,
      canonicalName: item.canonicalName,
      foodOnIds: [item.id],
      id: `tba-food:foodon:${item.id.replace(/^foodon:/, '').toLowerCase()}`,
      kind: item.kind === 'process' ? 'process' : 'ingredient',
      koName: item.canonicalName,
      sourceRefs: [
        {
          id: item.iri,
          source: 'foodon-taxonomy',
        },
      ],
      sourceText,
      status: 'active',
    }));
  });

  const deduped = new Map();

  entries.forEach((entry) => {
    if (!entry.koName && !entry.canonicalName) {
      return;
    }

    const existing = deduped.get(entry.id);

    if (!existing || entry.confidence > existing.confidence) {
      deduped.set(entry.id, entry);
    }
  });

  return {
    version: '0.1',
    source: 'tba-food-knowledge-dataset-v1',
    confidencePolicy: {
      sourceConfidence: SOURCE_CONFIDENCE,
      surfaceThresholds: SURFACE_THRESHOLDS,
    },
    count: deduped.size,
    items: Array.from(deduped.values())
      .sort((left, right) => (
        right.confidence - left.confidence ||
        left.koName.localeCompare(right.koName, 'ko')
      )),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const normalizedDir = path.join(options.outRoot, 'normalized');
  const tbaDir = path.join(options.outRoot, 'tba');
  const koreanCatalogPath = path.join(normalizedDir, 'korean-food-catalog.json');
  const foodOnIndexPath = path.join(normalizedDir, 'foodon-taxonomy-index.json');
  const nativeCatalogPath = path.join(normalizedDir, 'native-food-catalog.json');
  const tbaBridgePath = path.join(tbaDir, 'tba-food-knowledge-bridge.json');

  extractKoreanCatalog({
    koreanSource: options.koreanSource,
    outPath: koreanCatalogPath,
  });

  const koreanCatalog = readJson(koreanCatalogPath);

  if (options.limitKorean) {
    koreanCatalog.items = koreanCatalog.items.slice(0, options.limitKorean);
    koreanCatalog.count = koreanCatalog.items.length;
    writeJson(koreanCatalogPath, koreanCatalog);
  }

  const foodOnIndex = {
    version: '0.1',
    source: 'foodon-taxonomy',
    sourcePath: options.foodOnSource,
    focusTerms: FOCUS_FOODON_TERMS,
    items: buildFoodOnTaxonomyIndex(options.foodOnSource),
  };
  foodOnIndex.count = foodOnIndex.items.length;
  writeJson(foodOnIndexPath, foodOnIndex);

  const nativeCatalog = normalizeNativeFoodCatalog(options.nativeSource, options.limitNative);
  writeJson(nativeCatalogPath, nativeCatalog);

  const tbaBridge = buildTbaFoodKnowledgeBridge({
    foodOnIndex,
    koreanCatalog,
    nativeCatalog,
  });
  writeJson(tbaBridgePath, tbaBridge);

  console.log(`Saved ${foodOnIndex.count} FoodOn taxonomy entries to ${path.relative(workspaceRoot, foodOnIndexPath)}`);
  console.log(`Saved ${nativeCatalog.count} native food entries to ${path.relative(workspaceRoot, nativeCatalogPath)}`);
  console.log(`Saved ${tbaBridge.count} TBA food knowledge entries to ${path.relative(workspaceRoot, tbaBridgePath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
