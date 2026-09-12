import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const NATIVE = 'data/native-food/raw/nongsaro-native-food-dataset.json';
const STANDARD = 'data/food-knowledge/normalized/korean-food-catalog.json';
const BRIDGE = 'data/food-knowledge/tba/tba-food-knowledge-bridge.json';
const FOODON = 'data/food-knowledge/normalized/foodon-taxonomy-index.json';
const digest = value => createHash('sha256').update(value).digest('hex');
// ID로 검토 대상을 고정한다. 변경된 행은 재검토 후에만 이 manifest를 갱신한다.
const MANIFEST = [
  [NATIVE, 'sourceId', '91511', 'a113738937080901fa23fe2ec552f2925bca1c51214093e5034bce38e5fd1701'],
  [NATIVE, 'sourceId', '91391', '2adf503e311cbfcb448dfb1e608bfd7dd63c84f27e977fe4d37a057877105a6f'],
  [NATIVE, 'sourceId', '91013', '289bbc727677d03cb3292d0a5de0c5253f6041738ef00d69f04b6142e5172d02'],
  [NATIVE, 'sourceId', '91393', '4d9a711d1aed729646935467f52c7a91c40f97e2700a941771e90a3767ac9eb0'],
  [STANDARD, 'id', 'korean-food:50e0ec477973', 'f7e48ef028cabae6f0c1b063189f94b89515f19f159b379674b8c6cdc8256310'],
  [STANDARD, 'id', 'korean-food:7472924a4379', '5dcc8571af81df7547e98d6b8fa5ff0feb893f38afaa625aa4c4efe6005d926f'],
  [STANDARD, 'id', 'korean-food:5606a53f7a02', 'c3957e841cf3cc85264e602b030278782d6b06f0e48ea2f8455fa4154fbca820'],
];

export function buildFoodEvidencePilot({ rootDir = process.cwd() } = {}) {
  const documents = new Map();
  const sources = [NATIVE, STANDARD, BRIDGE, FOODON].map(path => {
    const bytes = readFileSync(resolve(rootDir, path));
    const document = JSON.parse(bytes.toString('utf8'));
    if (!Array.isArray(document.items)) throw new Error(`SOURCE_SHAPE_CHANGED: ${path}`);
    documents.set(path, document);
    return { id: path, path, hash: digest(bytes), hashAlgorithm: 'sha256',
      recordKind: path === NATIVE ? 'source_recipe_snapshot' : 'derived_catalog',
      source: document.source ?? null, version: document.version ?? null,
      observedRecordSourceVersions: [...new Set(document.items.map(row => row.sourceVersion).filter(Boolean))].sort(),
      observedCollectedAt: document.fetchedAt ?? null,
      observedUpstreamPath: document.sourcePath ?? null,
      usageStatus: 'review_pending',
      lineageStatus: path === NATIVE ? 'local_api_snapshot' : 'upstream_not_reverified' };
  });
  function locate(path, key, value) {
    const matches = documents.get(path).items.map((record, index) => ({ record, index })).filter(x => x.record[key] === value);
    if (matches.length !== 1) throw new Error(`RECORD_NOT_UNIQUE: ${path} ${key}=${value}; found ${matches.length}`);
    return { ...matches[0], path, key, value };
  }
  function ref(row, field) {
    const quote = field.split('/').reduce((v, k) => v?.[k], row.record);
    if (quote === undefined) throw new Error(`FIELD_MISSING: ${row.path} ${row.value} ${field}`);
    return { sourceId: row.path, selector: { [row.key]: row.value },
      recordPointer: `/items/${row.index}`, recordHash: digest(JSON.stringify(row.record)),
      field, pointer: `/items/${row.index}/${field}`, quote };
  }
  const foods = MANIFEST.map(([path, key, value, hash]) => {
    const row = locate(path, key, value);
    if (digest(JSON.stringify(row.record)) !== hash) throw new Error(`REVIEWED_RECORD_CHANGED: ${path} ${key}=${value}`);
    const native = path === NATIVE;
    const id = native ? `native-food:${value}` : value;
    const fields = native ? [
      ['name', 'detailFields/trditfdNm'], ['ingredients_text', 'detailFields/fdmtInfo'],
      ['seasonings_text', 'detailFields/asstnMatrlInfo'], ['preparation_text', 'detailFields/stdCkryDtl'],
      ['source_cooking_classification', 'detailFields/ckryCodeFullname'],
      ['source_food_classification', 'detailFields/foodTyCodeFullname'], ['origin_text', 'detailFields/originDtl'],
    ] : [['name', 'koName'], ['english_name', 'englishName'], ['scientific_name', 'scientificName'], ['source_food_classification', 'foodGroup']];
    const claims = fields.map(([predicate, field]) => {
      const sourceRef = ref(row, field);
      return { id: `${id}:${predicate}`, predicate, value: sourceRef.quote,
        status: sourceRef.quote === '' ? 'source_empty' : 'source_reported', sourceRefs: [sourceRef] };
    });
    // 고정 검토한 이름 필드의 쉼표 단위를 그대로 보존하며 일반 부분문자열 추출을 하지 않는다.
    if (!native && value !== 'korean-food:5606a53f7a02') {
      const state = row.record.koName.split(', ').at(-1);
      if (!['구운것', '튀긴것'].includes(state)) throw new Error(`PREPARATION_CHANGED: ${value}`);
      claims.push({ id: `${id}:preparation_state`, predicate: 'preparation_state', value: state,
        status: 'reviewed_name_component', sourceRefs: [ref(row, 'koName')] });
    }
    return { id, name: claims[0].value, recordKind: native ? 'RecipeVersion' : 'FoodConcept',
      sourceRefs: [ref(row, native ? 'sourceId' : 'foodCode')], claims,
      unknowns: { compoundMeasurements: null, sensoryStudyObservations: null, sensoryPrediction: null,
        userObservations: null, userLiking: null, menuOfferingVersion: null, serving: null,
        preparationState: !native && value === 'korean-food:5606a53f7a02' ? null : 'see_source_claims' }, issues: [] };
  });
  const findings = [];
  const addFinding = finding => {
    findings.push(finding);
    for (const id of finding.foodIds) foods.find(food => food.id === id)?.issues.push(finding.id);
  };
  const conflict = foods.find(food => food.id === 'native-food:91391');
  const conflictingClaims = conflict.claims.filter(claim => ['preparation_text', 'source_cooking_classification'].includes(claim.predicate));
  conflictingClaims.forEach(claim => { claim.status = 'contested_source_conflict'; });
  addFinding({ id: 'native-classification-conflict:91391', kind: 'source_conflict', status: 'unresolved',
    foodIds: [conflict.id], claimIds: conflictingClaims.map(c => c.id),
    message: '원문 분류는 비가열·절임이지만 조리 원문에는 삶기와 끓이기가 명시된다. 두 원문을 보존하고 조리 분류를 덮어쓰지 않는다.',
    sourceRefs: conflictingClaims.flatMap(c => c.sourceRefs) });
  addFinding({ id: 'same-name-distinct-recipes', kind: 'identity_boundary', status: 'preserved',
    foodIds: ['native-food:91013', 'native-food:91393'], message: '가자미미역국 두 행은 서로 다른 출처 ID와 재료·조리 구성을 가진 레시피로 유지한다.',
    sourceRefs: foods.filter(f => f.name === '가자미미역국').flatMap(f => f.sourceRefs) });
  const checks = [
    ['native-food:91511', 'tba-food:native:91511', 'ingredientSignalIds', 'ingredient:crustacean', '재료·양념 원문에 갑각류 근거가 없다. 조리 원문의 굵게 안에 있는 게를 재료로 해석할 수 없다.'],
    ['native-food:91511', 'tba-food:native:91511', 'processSignalIds', 'process:broth', '양념의 설탕 안에 있는 탕은 국물 조리의 근거가 아니다.'],
    ['korean-food:50e0ec477973', 'tba-food:korean-standard:50e0ec477973', 'ingredientSignalIds', 'ingredient:shellfish', '상위 분류 어패류의 일부 패류는 홍연어의 패류 식재료 근거가 아니다.'],
    ['korean-food:5606a53f7a02', 'tba-food:korean-standard:5606a53f7a02', 'ingredientSignalIds', 'ingredient:tea', '카탈로그의 차류 분류만으로 에스프레소에 찻잎이 포함됐다고 확정할 수 없다.'],
  ];
  for (const [foodId, bridgeId, field, mappedValue, message] of checks) {
    const row = locate(BRIDGE, 'id', bridgeId);
    if (row.record[field]?.includes(mappedValue)) addFinding({ id: `bridge-review:${foodId}:${mappedValue}`, kind: 'existing_mapping_review',
      status: 'not_adopted', foodIds: [foodId], bridgeId, mappedValue, message,
      interpretationPath: [bridgeId, field, mappedValue],
      sourceRefs: [ref(row, field), ...foods.find(f => f.id === foodId).claims.flatMap(c => c.sourceRefs)] });
  }
  const salmonBridge = locate(BRIDGE, 'id', 'tba-food:korean-standard:50e0ec477973');
  for (const foodonId of ['foodon:FOODON_02000056', 'foodon:FOODON_02000041', 'foodon:FOODON_03311461']) {
    if (!salmonBridge.record.foodOnIds.includes(foodonId)) continue;
    const target = locate(FOODON, 'id', foodonId);
    addFinding({ id: `salmon-foodon-review:${foodonId}`, kind: 'existing_mapping_review', status: 'not_adopted',
      foodIds: ['korean-food:50e0ec477973'], bridgeId: salmonBridge.value, mappedValue: foodonId,
      interpretationPath: [salmonBridge.value, 'foodOnIds', foodonId, target.record.canonicalName],
      message: '홍연어가 소고기 부위에 연결되어 있다. Sockeye 안의 eye를 독립 음식 단어로 채택하지 않는다.',
      sourceRefs: [ref(salmonBridge, 'foodOnIds'), ref(target, 'canonicalName'), ...foods.find(f => f.id === 'korean-food:50e0ec477973').claims.filter(c => c.predicate === 'english_name').flatMap(c => c.sourceRefs)] });
  }
  return { schemaVersion: 'tba-food-evidence-pilot/1', status: 'review_only', sources, foods, findings,
    limitations: ['검토한 7개 행의 원문 필드만 보존한다. 전체 음식·FoodOn 매핑을 재구축하거나 정정하지 않는다.',
      'derived_catalog는 파생 입력이며 원래 성분표·온톨로지를 직접 검증한 출처가 아니다.',
      '식품 성분 수치·감각 수치·개인 관찰·호감·판매 메뉴·실제 제공 음식의 증거가 없어 생성하지 않는다.',
      '빈 양념·학명 필드는 원문 결측이며 없음의 증거가 아니다. 소스별 이용 조건 승인은 수행하지 않았다.'] };
}
