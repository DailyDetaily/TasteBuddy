import type { TbaFoodKnowledgeEntry } from '../types/tbaFoodOntology';

export const TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION = '0.1';
export const TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH = 'data/food-knowledge/tba/tba-food-knowledge-bridge.json';
export const TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT = 6800;

export const TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES = [
  {
    "aliases": [
      "가례불고기"
    ],
    "canonicalName": "가례불고기",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "fermented_jang",
      "grilled_smoked",
      "broth"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:91511",
    "ingredientSignalIds": [
      "ingredient:pork",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가례불고기",
    "lexiconIds": [
      "lexicon:pork-savory-fat",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:charcoal-grilled",
      "lexicon:clear-umami"
    ],
    "nativeFoodIds": [
      "91511"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:grilled",
      "process:charcoal",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91511",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가루장국(가리장국)"
    ],
    "canonicalName": "가루장국(가리장국)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "맑은국",
    "foodOnIds": [],
    "id": "tba-food:native:91391",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가루장국(가리장국)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91391"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91391",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가리탕(갈비탕)"
    ],
    "canonicalName": "가리탕(갈비탕)",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90400",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가리탕(갈비탕)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90400"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90400",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가마니떡(밀주머니떡)"
    ],
    "canonicalName": "가마니떡(밀주머니떡)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "지지는 떡",
    "foodOnIds": [],
    "id": "tba-food:native:91242",
    "ingredientSignalIds": [
      "ingredient:crustacean"
    ],
    "kind": "native-dish",
    "koName": "가마니떡(밀주머니떡)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91242"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91242",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가물치곰국"
    ],
    "canonicalName": "가물치곰국",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91392",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "가물치곰국",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91392"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91392",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가물치곰탕"
    ],
    "canonicalName": "가물치곰탕",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92092",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "가물치곰탕",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92092"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92092",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가시리묵"
    ],
    "canonicalName": "가시리묵",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "dessert"
    ],
    "foodGroup": "묵",
    "foodOnIds": [],
    "id": "tba-food:native:91917",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "가시리묵",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "91917"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "91917",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가야곡왕주"
    ],
    "canonicalName": "가야곡왕주",
    "confidence": 0.65,
    "dishKindIds": [
      "beverage_pairing",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "약주 및 탁주류",
    "foodOnIds": [],
    "id": "tba-food:native:89892",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가야곡왕주",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "89892"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "89892",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리된장찜"
    ],
    "canonicalName": "가오리된장찜",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91579",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가오리된장찜",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91579"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91579",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리찜"
    ],
    "canonicalName": "가오리찜",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91580",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가오리찜",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91580"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91580",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리찜"
    ],
    "canonicalName": "가오리찜",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91148",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가오리찜",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91148"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91148",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리찜(갱개미찜)"
    ],
    "canonicalName": "가오리찜(갱개미찜)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:89806",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:crustacean"
    ],
    "kind": "native-dish",
    "koName": "가오리찜(갱개미찜)",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma"
    ],
    "nativeFoodIds": [
      "89806"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "89806",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리회"
    ],
    "canonicalName": "가오리회",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:89817",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가오리회",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "89817"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "89817",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가오리회"
    ],
    "canonicalName": "가오리회",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92413",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가오리회",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92413"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92413",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미두부찌개(납세미두부찌개)"
    ],
    "canonicalName": "가자미두부찌개(납세미두부찌개)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91445",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미두부찌개(납세미두부찌개)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91445"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91445",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미무침회"
    ],
    "canonicalName": "가자미무침회",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91176",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미무침회",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91176"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91176",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미미역국"
    ],
    "canonicalName": "가자미미역국",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "해조류",
    "foodOnIds": [],
    "id": "tba-food:native:91013",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미미역국",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91013"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91013",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미미역국"
    ],
    "canonicalName": "가자미미역국",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "해조류",
    "foodOnIds": [],
    "id": "tba-food:native:91393",
    "ingredientSignalIds": [
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미미역국",
    "lexiconIds": [
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91393"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91393",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미식해"
    ],
    "canonicalName": "가자미식해",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "식해",
    "foodOnIds": [],
    "id": "tba-food:native:91233",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미식해",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91233"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91233",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미식해"
    ],
    "canonicalName": "가자미식해",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "식해",
    "foodOnIds": [],
    "id": "tba-food:native:91670",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미식해",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91670"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91670",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미식해 [방법1]"
    ],
    "canonicalName": "가자미식해 [방법1]",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "식해",
    "foodOnIds": [],
    "id": "tba-food:native:91926",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "native-dish",
    "koName": "가자미식해 [방법1]",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [
      "91926"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91926",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미식해 [방법2]"
    ],
    "canonicalName": "가자미식해 [방법2]",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "식해",
    "foodOnIds": [],
    "id": "tba-food:native:91927",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미식해 [방법2]",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91927"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91927",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미양념구이"
    ],
    "canonicalName": "가자미양념구이",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "grilled_smoked"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:90491",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미양념구이",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma"
    ],
    "nativeFoodIds": [
      "90491"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "90491",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미조림"
    ],
    "canonicalName": "가자미조림",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:90839",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미조림",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90839"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90839",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미조림(납세미조림)"
    ],
    "canonicalName": "가자미조림(납세미조림)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91526",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미조림(납세미조림)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91526"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91526",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가자미조림(미주구리조림)"
    ],
    "canonicalName": "가자미조림(미주구리조림)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91111",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가자미조림(미주구리조림)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91111"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91111",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽무침(나물)"
    ],
    "canonicalName": "가죽무침(나물)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "생채",
    "foodOnIds": [],
    "id": "tba-food:native:91474",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽무침(나물)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91474"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91474",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽부각"
    ],
    "canonicalName": "가죽부각",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:90256",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽부각",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "90256"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "90256",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽부각(가죽자반)"
    ],
    "canonicalName": "가죽부각(가죽자반)",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:91629",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "가죽부각(가죽자반)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "91629"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "91629",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽부각(가죽자반튀김)"
    ],
    "canonicalName": "가죽부각(가죽자반튀김)",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:91184",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽부각(가죽자반튀김)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami"
    ],
    "nativeFoodIds": [
      "91184"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91184",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽잎볶음"
    ],
    "canonicalName": "가죽잎볶음",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "숙채",
    "foodOnIds": [],
    "id": "tba-food:native:92513",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽잎볶음",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92513"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92513",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽잎부각"
    ],
    "canonicalName": "가죽잎부각",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:89602",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽잎부각",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "89602"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "89602",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽잎부각"
    ],
    "canonicalName": "가죽잎부각",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:90582",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽잎부각",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "90582"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "90582",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽잎전"
    ],
    "canonicalName": "가죽잎전",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "broth"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:91546",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green"
    ],
    "kind": "native-dish",
    "koName": "가죽잎전",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91546"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91546",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽잎초무침"
    ],
    "canonicalName": "가죽잎초무침",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "숙채",
    "foodOnIds": [],
    "id": "tba-food:native:90208",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽잎초무침",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "90208"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "90208",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽장떡(참죽장떡)"
    ],
    "canonicalName": "가죽장떡(참죽장떡)",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:92633",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽장떡(참죽장떡)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "92633"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92633",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽장아찌(참죽장아찌)"
    ],
    "canonicalName": "가죽장아찌(참죽장아찌)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "고추장에 담근 것",
    "foodOnIds": [],
    "id": "tba-food:native:91217",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽장아찌(참죽장아찌)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91217"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91217",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽전(가죽잎부침개)"
    ],
    "canonicalName": "가죽전(가죽잎부침개)",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:89586",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽전(가죽잎부침개)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "89586"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "89586",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지가루찜(가지가루찜국)"
    ],
    "canonicalName": "가지가루찜(가지가루찜국)",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "broth",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:91014",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:leafy-green",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지가루찜(가지가루찜국)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma"
    ],
    "nativeFoodIds": [
      "91014"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91014",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지김치"
    ],
    "canonicalName": "가지김치",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "과채류",
    "foodOnIds": [],
    "id": "tba-food:native:90194",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지김치",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90194"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90194",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지나물"
    ],
    "canonicalName": "가지나물",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "숙채",
    "foodOnIds": [],
    "id": "tba-food:native:92357",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지나물",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "92357"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92357",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지나물"
    ],
    "canonicalName": "가지나물",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "숙채",
    "foodOnIds": [],
    "id": "tba-food:native:92646",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지나물",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "92646"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92646",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지선"
    ],
    "canonicalName": "가지선",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "meat",
      "seafood",
      "broth",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:90551",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:leafy-green",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지선",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami"
    ],
    "nativeFoodIds": [
      "90551"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90551",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지장아찌"
    ],
    "canonicalName": "가지장아찌",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth",
      "beverage_pairing"
    ],
    "foodGroup": "소금물에 담근 것",
    "foodOnIds": [],
    "id": "tba-food:native:92596",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "native-dish",
    "koName": "가지장아찌",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [
      "92596"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92596",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지장아찌(가지지)"
    ],
    "canonicalName": "가지장아찌(가지지)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "간장에 담근 것",
    "foodOnIds": [],
    "id": "tba-food:native:92706",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지장아찌(가지지)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92706"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92706",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지적"
    ],
    "canonicalName": "가지적",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:91120",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지적",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91120"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91120",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지전"
    ],
    "canonicalName": "가지전",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "seafood",
      "grain_noodle"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:90522",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "가지전",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "90522"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "90522",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지찜"
    ],
    "canonicalName": "가지찜",
    "confidence": 0.65,
    "dishKindIds": [
      "vegetable_herb",
      "meat",
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:90552",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:crustacean",
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지찜",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami"
    ],
    "nativeFoodIds": [
      "90552"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90552",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "각색산자"
    ],
    "canonicalName": "각색산자",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "유밀과",
    "foodOnIds": [],
    "id": "tba-food:native:90311",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "각색산자",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90311"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90311",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "각색전골"
    ],
    "canonicalName": "각색전골",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "vegetable_herb",
      "broth",
      "fermented_jang",
      "grilled_smoked"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90441",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "각색전골",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:charred-aroma"
    ],
    "nativeFoodIds": [
      "90441"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:grilled",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90441",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "각색편(백편, 꿀편, 승검초편)"
    ],
    "canonicalName": "각색편(백편, 꿀편, 승검초편)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "broth",
      "grain_noodle"
    ],
    "foodGroup": "찌는 떡",
    "foodOnIds": [],
    "id": "tba-food:native:90630",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "각색편(백편, 꿀편, 승검초편)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90630"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90630",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간국"
    ],
    "canonicalName": "간국",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91394",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "간국",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91394"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91394",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간랍(전유아, 전유어)"
    ],
    "canonicalName": "간랍(전유아, 전유어)",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:92475",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "간랍(전유아, 전유어)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "92475"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "92475",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간장"
    ],
    "canonicalName": "간장",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "dessert",
      "beverage_pairing"
    ],
    "foodGroup": "간장류",
    "foodOnIds": [],
    "id": "tba-food:native:92391",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit",
      "ingredient:tea"
    ],
    "kind": "native-dish",
    "koName": "간장",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "92391"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92391",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간재미탕<방법1>"
    ],
    "canonicalName": "간재미탕<방법1>",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92093",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "간재미탕<방법1>",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92093"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92093",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간재미탕<방법2>"
    ],
    "canonicalName": "간재미탕<방법2>",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92094",
    "ingredientSignalIds": [
      "ingredient:shellfish"
    ],
    "kind": "native-dish",
    "koName": "간재미탕<방법2>",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92094"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92094",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간재미회(간재미무침)"
    ],
    "canonicalName": "간재미회(간재미무침)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92198",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "간재미회(간재미무침)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma"
    ],
    "nativeFoodIds": [
      "92198"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92198",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비구이"
    ],
    "canonicalName": "갈비구이",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "grilled_smoked",
      "broth",
      "dessert"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:92169",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈비구이",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92169"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:grilled",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92169",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비찜"
    ],
    "canonicalName": "갈비찜",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:92518",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈비찜",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity"
    ],
    "nativeFoodIds": [
      "92518"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92518",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비찜(가리찜)"
    ],
    "canonicalName": "갈비찜(가리찜)",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "vegetable_herb",
      "broth",
      "grain_noodle",
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90885",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈비찜(가리찜)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90885"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90885",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비찜(가리찜)"
    ],
    "canonicalName": "갈비찜(가리찜)",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth",
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90553",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈비찜(가리찜)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "90553"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90553",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비탕"
    ],
    "canonicalName": "갈비탕",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90743",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈비탕",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90743"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90743",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비탕"
    ],
    "canonicalName": "갈비탕",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:92346",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈비탕",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92346"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92346",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치구이"
    ],
    "canonicalName": "갈치구이",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "grilled_smoked",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:92359",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:noodle",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈치구이",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:chewy-resistance",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "92359"
    ],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "92359",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치구이"
    ],
    "canonicalName": "갈치구이",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grilled_smoked",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91512",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈치구이",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "91512"
    ],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "91512",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치김치"
    ],
    "canonicalName": "갈치김치",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "dessert",
      "beverage_pairing"
    ],
    "foodGroup": "배추류",
    "foodOnIds": [],
    "id": "tba-food:native:91065",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit",
      "ingredient:tea"
    ],
    "kind": "native-dish",
    "koName": "갈치김치",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [
      "91065"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91065",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치내장김치(갈치순태김치)"
    ],
    "canonicalName": "갈치내장김치(갈치순태김치)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "무류",
    "foodOnIds": [],
    "id": "tba-food:native:91453",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치내장김치(갈치순태김치)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91453"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91453",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치섞박지"
    ],
    "canonicalName": "갈치섞박지",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "무류",
    "foodOnIds": [],
    "id": "tba-food:native:91452",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치섞박지",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91452"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91452",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치식해"
    ],
    "canonicalName": "갈치식해",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "식해",
    "foodOnIds": [],
    "id": "tba-food:native:91672",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치식해",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91672"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91672",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치조림(갈치무조림)"
    ],
    "canonicalName": "갈치조림(갈치무조림)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:90840",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈치조림(갈치무조림)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma"
    ],
    "nativeFoodIds": [
      "90840"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90840",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치조림(갈치지짐)"
    ],
    "canonicalName": "갈치조림(갈치지짐)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:90032",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치조림(갈치지짐)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90032"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90032",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치찌개(갈치호박찌개)"
    ],
    "canonicalName": "갈치찌개(갈치호박찌개)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91446",
    "ingredientSignalIds": [
      "ingredient:shellfish"
    ],
    "kind": "native-dish",
    "koName": "갈치찌개(갈치호박찌개)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91446"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91446",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치호박국(갈치국)"
    ],
    "canonicalName": "갈치호박국(갈치국)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:89953",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:noodle",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈치호박국(갈치국)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma"
    ],
    "nativeFoodIds": [
      "89953"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "89953",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치회(기장갈치회)"
    ],
    "canonicalName": "갈치회(기장갈치회)",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:91610",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "갈치회(기장갈치회)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity"
    ],
    "nativeFoodIds": [
      "91610"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91610",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈파래국"
    ],
    "canonicalName": "갈파래국",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "meat",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "해조류",
    "foodOnIds": [],
    "id": "tba-food:native:92095",
    "ingredientSignalIds": [
      "ingredient:pork",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈파래국",
    "lexiconIds": [
      "lexicon:pork-savory-fat",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92095"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92095",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감경단"
    ],
    "canonicalName": "감경단",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "삶는 떡(경단류)",
    "foodOnIds": [],
    "id": "tba-food:native:91243",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감경단",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91243"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91243",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감고지떡"
    ],
    "canonicalName": "감고지떡",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "찌는 떡",
    "foodOnIds": [],
    "id": "tba-food:native:92260",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감고지떡",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92260"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92260",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감고지떡(감모름떡)"
    ],
    "canonicalName": "감고지떡(감모름떡)",
    "confidence": 0.65,
    "dishKindIds": [
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "찌는 떡",
    "foodOnIds": [],
    "id": "tba-food:native:91244",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감고지떡(감모름떡)",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91244"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91244",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감김치"
    ],
    "canonicalName": "감김치",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth",
      "beverage_pairing"
    ],
    "foodGroup": "기타",
    "foodOnIds": [],
    "id": "tba-food:native:91461",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "native-dish",
    "koName": "감김치",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [
      "91461"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91461",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감김치"
    ],
    "canonicalName": "감김치",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth"
    ],
    "foodGroup": "기타",
    "foodOnIds": [],
    "id": "tba-food:native:91066",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "감김치",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91066"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91066",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감단자"
    ],
    "canonicalName": "감단자",
    "confidence": 0.65,
    "dishKindIds": [
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "치는 떡",
    "foodOnIds": [],
    "id": "tba-food:native:91698",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감단자",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "91698"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "91698",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감단자"
    ],
    "canonicalName": "감단자",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "떡류",
    "foodOnIds": [],
    "id": "tba-food:native:92537",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감단자",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "92537"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92537",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감단자 [방법 1]"
    ],
    "canonicalName": "감단자 [방법 1]",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "grain_noodle"
    ],
    "foodGroup": "떡류",
    "foodOnIds": [],
    "id": "tba-food:native:92261",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감단자 [방법 1]",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "92261"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "92261",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감단자 [방법 2]"
    ],
    "canonicalName": "감단자 [방법 2]",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "broth",
      "grain_noodle",
      "dessert"
    ],
    "foodGroup": "떡류",
    "foodOnIds": [],
    "id": "tba-food:native:92262",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:grain",
      "ingredient:noodle",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "감단자 [방법 2]",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:savory-depth",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity"
    ],
    "nativeFoodIds": [
      "92262"
    ],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "92262",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감동젓무김치"
    ],
    "canonicalName": "감동젓무김치",
    "confidence": 0.65,
    "dishKindIds": [
      "seafood",
      "fermented_jang",
      "broth",
      "dessert"
    ],
    "foodGroup": "무류",
    "foodOnIds": [],
    "id": "tba-food:native:90458",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:crustacean",
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "감동젓무김치",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clear-umami",
      "lexicon:deep-umami",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity"
    ],
    "nativeFoodIds": [
      "90458"
    ],
    "processSignalIds": [
      "process:fermented",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90458",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감동젓찌개(곤쟁이젓찌개)"
    ],
    "canonicalName": "감동젓찌개(곤쟁이젓찌개)",
    "confidence": 0.65,
    "dishKindIds": [
      "meat",
      "seafood",
      "vegetable_herb",
      "broth",
      "grilled_smoked",
      "dessert"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90442",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:crustacean",
      "ingredient:mushroom",
      "ingredient:fruit"
    ],
    "kind": "native-dish",
    "koName": "감동젓찌개(곤쟁이젓찌개)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [
      "90442"
    ],
    "processSignalIds": [
      "process:grilled",
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "90442",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지전"
    ],
    "canonicalName": "가지전",
    "confidence": 0.64,
    "dishKindIds": [
      "vegetable_herb",
      "seafood"
    ],
    "foodGroup": "채소류",
    "foodOnIds": [],
    "id": "tba-food:native:92473",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:leafy-green"
    ],
    "kind": "native-dish",
    "koName": "가지전",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness"
    ],
    "nativeFoodIds": [
      "92473"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "92473",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈비구이(생갈비구이)"
    ],
    "canonicalName": "갈비구이(생갈비구이)",
    "confidence": 0.64,
    "dishKindIds": [
      "meat",
      "seafood",
      "grilled_smoked"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:92510",
    "ingredientSignalIds": [
      "ingredient:crustacean"
    ],
    "kind": "native-dish",
    "koName": "갈비구이(생갈비구이)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma"
    ],
    "nativeFoodIds": [
      "92510"
    ],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "92510",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치구이"
    ],
    "canonicalName": "갈치구이",
    "confidence": 0.64,
    "dishKindIds": [
      "seafood",
      "grilled_smoked"
    ],
    "foodGroup": "어패류",
    "foodOnIds": [],
    "id": "tba-food:native:90014",
    "ingredientSignalIds": [
      "ingredient:shellfish"
    ],
    "kind": "native-dish",
    "koName": "갈치구이",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma"
    ],
    "nativeFoodIds": [
      "90014"
    ],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "90014",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가죽장아찌"
    ],
    "canonicalName": "가죽장아찌",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "간장에 담근 것",
    "foodOnIds": [],
    "id": "tba-food:native:91651",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가죽장아찌",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91651"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91651",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가지김치"
    ],
    "canonicalName": "가지김치",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "과채류",
    "foodOnIds": [],
    "id": "tba-food:native:89559",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "가지김치",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "89559"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "89559",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "각색정과(도라지정과, 연근정과, 우엉정과, 잣정과)"
    ],
    "canonicalName": "각색정과(도라지정과, 연근정과, 우엉정과, 잣정과)",
    "confidence": 0.625,
    "dishKindIds": [
      "seafood",
      "grain_noodle"
    ],
    "foodGroup": "정과",
    "foodOnIds": [],
    "id": "tba-food:native:91292",
    "ingredientSignalIds": [
      "ingredient:crustacean",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "각색정과(도라지정과, 연근정과, 우엉정과, 잣정과)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "91292"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "91292",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치내장젓(갈치순태젓)"
    ],
    "canonicalName": "갈치내장젓(갈치순태젓)",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "젓갈",
    "foodOnIds": [],
    "id": "tba-food:native:91671",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치내장젓(갈치순태젓)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91671"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91671",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치속젓"
    ],
    "canonicalName": "갈치속젓",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "젓갈",
    "foodOnIds": [],
    "id": "tba-food:native:92241",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치속젓",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "92241"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92241",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치아가미젓(갈치알개미젓)"
    ],
    "canonicalName": "갈치아가미젓(갈치알개미젓)",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "젓갈",
    "foodOnIds": [],
    "id": "tba-food:native:92712",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치아가미젓(갈치알개미젓)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "92712"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "92712",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "갈치젓갈"
    ],
    "canonicalName": "갈치젓갈",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "젓갈",
    "foodOnIds": [],
    "id": "tba-food:native:91673",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "갈치젓갈",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91673"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91673",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감고추장"
    ],
    "canonicalName": "감고추장",
    "confidence": 0.625,
    "dishKindIds": [
      "fermented_jang"
    ],
    "foodGroup": "고추장류",
    "foodOnIds": [],
    "id": "tba-food:native:91322",
    "ingredientSignalIds": [
      "ingredient:soy-jang"
    ],
    "kind": "native-dish",
    "koName": "감고추장",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [
      "91322"
    ],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "91322",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "간전"
    ],
    "canonicalName": "간전",
    "confidence": 0.61,
    "dishKindIds": [
      "meat",
      "grain_noodle"
    ],
    "foodGroup": "육류",
    "foodOnIds": [],
    "id": "tba-food:native:90039",
    "ingredientSignalIds": [
      "ingredient:pork",
      "ingredient:grain"
    ],
    "kind": "native-dish",
    "koName": "간전",
    "lexiconIds": [
      "lexicon:pork-savory-fat",
      "lexicon:savory-depth"
    ],
    "nativeFoodIds": [
      "90039"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "90039",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "감꽃부각(감잎부각)"
    ],
    "canonicalName": "감꽃부각(감잎부각)",
    "confidence": 0.61,
    "dishKindIds": [
      "grain_noodle"
    ],
    "foodGroup": "기타",
    "foodOnIds": [],
    "id": "tba-food:native:91185",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:noodle"
    ],
    "kind": "native-dish",
    "koName": "감꽃부각(감잎부각)",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [
      "91185"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "91185",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "가평송화다식"
    ],
    "canonicalName": "가평송화다식",
    "confidence": 0.595,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "다식",
    "foodOnIds": [],
    "id": "tba-food:native:90670",
    "ingredientSignalIds": [
      "ingredient:crustacean"
    ],
    "kind": "native-dish",
    "koName": "가평송화다식",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma"
    ],
    "nativeFoodIds": [
      "90670"
    ],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "90670",
        "source": "nongsaro-native-food-api"
      }
    ],
    "status": "candidate",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": false,
      "chef-guide": false,
      "tcs": true
    }
  },
  {
    "aliases": [
      "09400 - fermented or pickled vegetables (efsa foodex2)"
    ],
    "canonicalName": "09400 - fermented or pickled vegetables (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03540940"
    ],
    "id": "tba-food:foodon:foodon_03540940",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "09400 - fermented or pickled vegetables (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03540940",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "09410 - fermented vegetables (efsa foodex2)"
    ],
    "canonicalName": "09410 - fermented vegetables (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03540941"
    ],
    "id": "tba-food:foodon:foodon_03540941",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "09410 - fermented vegetables (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03540941",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000588 - non grape fermented alcoholic beverages - still (gs1 gpc)"
    ],
    "canonicalName": "10000588 - non grape fermented alcoholic beverages - still (gs1 gpc)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03400890"
    ],
    "id": "tba-food:foodon:foodon_03400890",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "10000588 - non grape fermented alcoholic beverages - still (gs1 gpc)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03400890",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10003689 - non grape fermented alcoholic beverages - sparkling (gs1 gpc)"
    ],
    "canonicalName": "10003689 - non grape fermented alcoholic beverages - sparkling (gs1 gpc)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03400889"
    ],
    "id": "tba-food:foodon:foodon_03400889",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "10003689 - non grape fermented alcoholic beverages - sparkling (gs1 gpc)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03400889",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "18570 - fermented fruit products (efsa foodex2)"
    ],
    "canonicalName": "18570 - fermented fruit products (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03541857"
    ],
    "id": "tba-food:foodon:foodon_03541857",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "process",
    "koName": "18570 - fermented fruit products (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03541857",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "26150 - fermented fish (efsa foodex2)",
      "rottenfish"
    ],
    "canonicalName": "26150 - fermented fish (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03542615"
    ],
    "id": "tba-food:foodon:foodon_03542615",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "26150 - fermented fish (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03542615",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "34410 - teas leaves, dry and/or fermented, and similar (efsa foodex2)",
      "tea: dried leaves, stalks and flowers, whether fermented or otherwise treated (c"
    ],
    "canonicalName": "34410 - teas leaves, dry and/or fermented, and similar (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543441"
    ],
    "id": "tba-food:foodon:foodon_03543441",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "34410 - teas leaves, dry and/or fermented, and similar (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543441",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "34420 - tea leaves and stalks, fermented (efsa foodex2)",
      "black tea",
      "breakfast tea"
    ],
    "canonicalName": "34420 - tea leaves and stalks, fermented (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543442"
    ],
    "id": "tba-food:foodon:foodon_03543442",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "34420 - tea leaves and stalks, fermented (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543442",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "34440 - tea leaves and stalks with fruit and flavours (efsa foodex2)"
    ],
    "canonicalName": "34440 - tea leaves and stalks with fruit and flavours (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "dessert",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543444"
    ],
    "id": "tba-food:foodon:foodon_03543444",
    "ingredientSignalIds": [
      "ingredient:fruit",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "34440 - tea leaves and stalks with fruit and flavours (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543444",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "34450 - non-fermented tea leaves (green or white tea) (efsa foodex2)",
      "green tea",
      "white tea"
    ],
    "canonicalName": "34450 - non-fermented tea leaves (green or white tea) (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543445"
    ],
    "id": "tba-food:foodon:foodon_03543445",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "34450 - non-fermented tea leaves (green or white tea) (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543445",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "37260 - fermented tea infusion (efsa foodex2)",
      "black tea, infusion"
    ],
    "canonicalName": "37260 - fermented tea infusion (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543726"
    ],
    "id": "tba-food:foodon:foodon_03543726",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "37260 - fermented tea infusion (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543726",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "37270 - non-fermented tea, infusion (efsa foodex2)",
      "green tea, infusion",
      "white tea, infusion"
    ],
    "canonicalName": "37270 - non-fermented tea, infusion (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543727"
    ],
    "id": "tba-food:foodon:foodon_03543727",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "37270 - non-fermented tea, infusion (efsa foodex2)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543727",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39760 - rice, fish/seafood and vegetable based dishes (efsa foodex2)",
      "sushi based on fish, rice and vegetables"
    ],
    "canonicalName": "39760 - rice, fish/seafood and vegetable based dishes (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "grain_noodle"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543976"
    ],
    "id": "tba-food:foodon:foodon_03543976",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:leafy-green",
      "ingredient:grain"
    ],
    "kind": "ingredient",
    "koName": "39760 - rice, fish/seafood and vegetable based dishes (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:savory-depth"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543976",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39950 - mushroom soup, dry (efsa foodex2)"
    ],
    "canonicalName": "39950 - mushroom soup, dry (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543995"
    ],
    "id": "tba-food:foodon:foodon_03543995",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "39950 - mushroom soup, dry (efsa foodex2)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543995",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "40110 - mushroom soup (efsa foodex2)"
    ],
    "canonicalName": "40110 - mushroom soup (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544011"
    ],
    "id": "tba-food:foodon:foodon_03544011",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "40110 - mushroom soup (efsa foodex2)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544011",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "40750 - stock cube or granulate, beef (efsa foodex2)"
    ],
    "canonicalName": "40750 - stock cube or granulate, beef (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544075"
    ],
    "id": "tba-food:foodon:foodon_03544075",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "40750 - stock cube or granulate, beef (efsa foodex2)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544075",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "42000 - beef soup flavour (efsa foodex2)"
    ],
    "canonicalName": "42000 - beef soup flavour (efsa foodex2)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544200"
    ],
    "id": "tba-food:foodon:foodon_03544200",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "42000 - beef soup flavour (efsa foodex2)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544200",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef (charcoal broiled)"
    ],
    "canonicalName": "beef (charcoal broiled)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grilled_smoked"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310919"
    ],
    "id": "tba-food:foodon:foodon_03310919",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "process",
    "koName": "beef (charcoal broiled)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:charcoal-grilled"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:grilled",
      "process:charcoal"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310919",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef barley soup"
    ],
    "canonicalName": "beef barley soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304088"
    ],
    "id": "tba-food:foodon:foodon_03304088",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef barley soup",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304088",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef broth"
    ],
    "canonicalName": "beef broth",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03302091"
    ],
    "id": "tba-food:foodon:foodon_03302091",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef broth",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03302091",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef noodle soup"
    ],
    "canonicalName": "beef noodle soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304924"
    ],
    "id": "tba-food:foodon:foodon_03304924",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "beef noodle soup",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304924",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef noodle soup mix"
    ],
    "canonicalName": "beef noodle soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304253"
    ],
    "id": "tba-food:foodon:foodon_03304253",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "beef noodle soup mix",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304253",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef soup"
    ],
    "canonicalName": "beef soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304929"
    ],
    "id": "tba-food:foodon:foodon_03304929",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef soup",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304929",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef soup (instant)"
    ],
    "canonicalName": "beef soup (instant)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304906"
    ],
    "id": "tba-food:foodon:foodon_03304906",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef soup (instant)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304906",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef soup mix"
    ],
    "canonicalName": "beef soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304082"
    ],
    "id": "tba-food:foodon:foodon_03304082",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef soup mix",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304082",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef soup stix (concentrated)"
    ],
    "canonicalName": "beef soup stix (concentrated)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304261"
    ],
    "id": "tba-food:foodon:foodon_03304261",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef soup stix (concentrated)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304261",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef stock base (meatless)"
    ],
    "canonicalName": "beef stock base (meatless)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304945"
    ],
    "id": "tba-food:foodon:foodon_03304945",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef stock base (meatless)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304945",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef-flavored bouillon seasoning and broth (instant)"
    ],
    "canonicalName": "beef-flavored bouillon seasoning and broth (instant)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03306567"
    ],
    "id": "tba-food:foodon:foodon_03306567",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef-flavored bouillon seasoning and broth (instant)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03306567",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef-flavored noodle soup"
    ],
    "canonicalName": "beef-flavored noodle soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304920"
    ],
    "id": "tba-food:foodon:foodon_03304920",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "beef-flavored noodle soup",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304920",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef-flavored soup mix"
    ],
    "canonicalName": "beef-flavored soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304080"
    ],
    "id": "tba-food:foodon:foodon_03304080",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "beef-flavored soup mix",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304080",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beefsteak morel",
      "brain mushroom"
    ],
    "canonicalName": "beefsteak morel",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03412446"
    ],
    "id": "tba-food:foodon:foodon_03412446",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:mushroom",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beefsteak morel",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03412446",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beverage fermented malt"
    ],
    "canonicalName": "beverage fermented malt",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03315122"
    ],
    "id": "tba-food:foodon:foodon_03315122",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "beverage fermented malt",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03315122",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "brown rice miso"
    ],
    "canonicalName": "brown rice miso",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03301973"
    ],
    "id": "tba-food:foodon:foodon_03301973",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang"
    ],
    "kind": "ingredient",
    "koName": "brown rice miso",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03301973",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken and noodles with vegetables"
    ],
    "canonicalName": "chicken and noodles with vegetables",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "grain_noodle"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304772"
    ],
    "id": "tba-food:foodon:foodon_03304772",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:leafy-green",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken and noodles with vegetables",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304772",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken noodle soup"
    ],
    "canonicalName": "chicken noodle soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03302730"
    ],
    "id": "tba-food:foodon:foodon_03302730",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken noodle soup",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03302730",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken noodle soup (condensed)"
    ],
    "canonicalName": "chicken noodle soup (condensed)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304209"
    ],
    "id": "tba-food:foodon:foodon_03304209",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken noodle soup (condensed)",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304209",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken noodle soup mix"
    ],
    "canonicalName": "chicken noodle soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304938"
    ],
    "id": "tba-food:foodon:foodon_03304938",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken noodle soup mix",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304938",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken shrimp soup with noodles"
    ],
    "canonicalName": "chicken shrimp soup with noodles",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "seafood",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03306945"
    ],
    "id": "tba-food:foodon:foodon_03306945",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:crustacean",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken shrimp soup with noodles",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:shellfish-sweetness",
      "lexicon:seafood-aroma",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03306945",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken thigh (charcoal-broiled)"
    ],
    "canonicalName": "chicken thigh (charcoal-broiled)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grilled_smoked"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310167"
    ],
    "id": "tba-food:foodon:foodon_03310167",
    "ingredientSignalIds": [
      "ingredient:poultry"
    ],
    "kind": "process",
    "koName": "chicken thigh (charcoal-broiled)",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma",
      "lexicon:charcoal-grilled"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:grilled",
      "process:charcoal"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310167",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken vegetable noodle soup mix"
    ],
    "canonicalName": "chicken vegetable noodle soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304939"
    ],
    "id": "tba-food:foodon:foodon_03304939",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:leafy-green",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken vegetable noodle soup mix",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304939",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken vegetable soup"
    ],
    "canonicalName": "chicken vegetable soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310946"
    ],
    "id": "tba-food:foodon:foodon_03310946",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "chicken vegetable soup",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310946",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken vegetable soup mix"
    ],
    "canonicalName": "chicken vegetable soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03309459"
    ],
    "id": "tba-food:foodon:foodon_03309459",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "chicken vegetable soup mix",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03309459",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken with rice soup (instant)"
    ],
    "canonicalName": "chicken with rice soup (instant)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304552"
    ],
    "id": "tba-food:foodon:foodon_03304552",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:grain"
    ],
    "kind": "ingredient",
    "koName": "chicken with rice soup (instant)",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:savory-depth",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304552",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken-flavored noodle soup"
    ],
    "canonicalName": "chicken-flavored noodle soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304921"
    ],
    "id": "tba-food:foodon:foodon_03304921",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken-flavored noodle soup",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304921",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "chicken-flavored vegetable noodle soup"
    ],
    "canonicalName": "chicken-flavored vegetable noodle soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "grain_noodle",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03309458"
    ],
    "id": "tba-food:foodon:foodon_03309458",
    "ingredientSignalIds": [
      "ingredient:poultry",
      "ingredient:leafy-green",
      "ingredient:noodle"
    ],
    "kind": "ingredient",
    "koName": "chicken-flavored vegetable noodle soup",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:chewy-resistance",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03309458",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "cream of mushroom soup"
    ],
    "canonicalName": "cream of mushroom soup",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03305128"
    ],
    "id": "tba-food:foodon:foodon_03305128",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "cream of mushroom soup",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03305128",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "distilled fermented beverage"
    ],
    "canonicalName": "distilled fermented beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001136"
    ],
    "id": "tba-food:foodon:foodon_00001136",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "distilled fermented beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001136",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "distilled fermented grain beverage"
    ],
    "canonicalName": "distilled fermented grain beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001135"
    ],
    "id": "tba-food:foodon:foodon_00001135",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "distilled fermented grain beverage",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001135",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented agave beverage"
    ],
    "canonicalName": "fermented agave beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001103"
    ],
    "id": "tba-food:foodon:foodon_00001103",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented agave beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001103",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented apple beverage",
      "fermented apple"
    ],
    "canonicalName": "fermented apple beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001098"
    ],
    "id": "tba-food:foodon:foodon_00001098",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented apple beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001098",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented beverage"
    ],
    "canonicalName": "fermented beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001094"
    ],
    "id": "tba-food:foodon:foodon_00001094",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001094",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented cereal beverage"
    ],
    "canonicalName": "fermented cereal beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001838"
    ],
    "id": "tba-food:foodon:foodon_00001838",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented cereal beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001838",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented elaeis palm beverage"
    ],
    "canonicalName": "fermented elaeis palm beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001096"
    ],
    "id": "tba-food:foodon:foodon_00001096",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented elaeis palm beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001096",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented fish or seafood food product"
    ],
    "canonicalName": "fermented fish or seafood food product",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001054"
    ],
    "id": "tba-food:foodon:foodon_00001054",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "fermented fish or seafood food product",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001054",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented fruit food product"
    ],
    "canonicalName": "fermented fruit food product",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001069"
    ],
    "id": "tba-food:foodon:foodon_00001069",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "process",
    "koName": "fermented fruit food product",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001069",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented grain beverage"
    ],
    "canonicalName": "fermented grain beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001102"
    ],
    "id": "tba-food:foodon:foodon_00001102",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented grain beverage",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001102",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented grape beverage"
    ],
    "canonicalName": "fermented grape beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001095"
    ],
    "id": "tba-food:foodon:foodon_00001095",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented grape beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001095",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented pomaceous fruit beverage"
    ],
    "canonicalName": "fermented pomaceous fruit beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "dessert",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001159"
    ],
    "id": "tba-food:foodon:foodon_00001159",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:fruit",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented pomaceous fruit beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001159",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented rice beverage"
    ],
    "canonicalName": "fermented rice beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001051"
    ],
    "id": "tba-food:foodon:foodon_00001051",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented rice beverage",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001051",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented sugar cane beverage"
    ],
    "canonicalName": "fermented sugar cane beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001097"
    ],
    "id": "tba-food:foodon:foodon_00001097",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "fermented sugar cane beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001097",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fermented vegetable food product"
    ],
    "canonicalName": "fermented vegetable food product",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310784"
    ],
    "id": "tba-food:foodon:foodon_03310784",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "fermented vegetable food product",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310784",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fish (fermented)"
    ],
    "canonicalName": "fish (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310029"
    ],
    "id": "tba-food:foodon:foodon_03310029",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "fish (fermented)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310029",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fish sauce (fermented)"
    ],
    "canonicalName": "fish sauce (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310036"
    ],
    "id": "tba-food:foodon:foodon_03310036",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "fish sauce (fermented)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310036",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "fruit (fermented)"
    ],
    "canonicalName": "fruit (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310781"
    ],
    "id": "tba-food:foodon:foodon_03310781",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "process",
    "koName": "fruit (fermented)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310781",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "grape beverage (fermented)"
    ],
    "canonicalName": "grape beverage (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03305467"
    ],
    "id": "tba-food:foodon:foodon_03305467",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "grape beverage (fermented)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03305467",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "milk beverage (fermented)"
    ],
    "canonicalName": "milk beverage (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03303846"
    ],
    "id": "tba-food:foodon:foodon_03303846",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "milk beverage (fermented)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03303846",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom fruitbody",
      "mushroom"
    ],
    "canonicalName": "mushroom fruitbody",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00003528"
    ],
    "id": "tba-food:foodon:foodon_00003528",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:fruit"
    ],
    "kind": "ingredient",
    "koName": "mushroom fruitbody",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00003528",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom fruitbody (dried)",
      "dried mushroom"
    ],
    "canonicalName": "mushroom fruitbody (dried)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310082"
    ],
    "id": "tba-food:foodon:foodon_03310082",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:fruit"
    ],
    "kind": "ingredient",
    "koName": "mushroom fruitbody (dried)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310082",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom fruitbody (raw)",
      "mushroom"
    ],
    "canonicalName": "mushroom fruitbody (raw)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03301303"
    ],
    "id": "tba-food:foodon:foodon_03301303",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:fruit"
    ],
    "kind": "ingredient",
    "koName": "mushroom fruitbody (raw)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03301303",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom soup (canned)"
    ],
    "canonicalName": "mushroom soup (canned)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310321"
    ],
    "id": "tba-food:foodon:foodon_03310321",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "mushroom soup (canned)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310321",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom soup (liquid)"
    ],
    "canonicalName": "mushroom soup (liquid)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304954"
    ],
    "id": "tba-food:foodon:foodon_03304954",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "mushroom soup (liquid)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304954",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom soup food product"
    ],
    "canonicalName": "mushroom soup food product",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00002049"
    ],
    "id": "tba-food:foodon:foodon_00002049",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "mushroom soup food product",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00002049",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom soup mix"
    ],
    "canonicalName": "mushroom soup mix",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304249"
    ],
    "id": "tba-food:foodon:foodon_03304249",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "mushroom soup mix",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304249",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "mushroom stock cube"
    ],
    "canonicalName": "mushroom stock cube",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304185"
    ],
    "id": "tba-food:foodon:foodon_03304185",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "mushroom stock cube",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304185",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "nonfermented plant derived beverage product"
    ],
    "canonicalName": "nonfermented plant derived beverage product",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001255"
    ],
    "id": "tba-food:foodon:foodon_00001255",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "nonfermented plant derived beverage product",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001255",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "oyster soup"
    ],
    "canonicalName": "oyster soup",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304198"
    ],
    "id": "tba-food:foodon:foodon_03304198",
    "ingredientSignalIds": [
      "ingredient:shellfish"
    ],
    "kind": "ingredient",
    "koName": "oyster soup",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304198",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "plant derived fermented beverage"
    ],
    "canonicalName": "plant derived fermented beverage",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00001254"
    ],
    "id": "tba-food:foodon:foodon_00001254",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:tea"
    ],
    "kind": "process",
    "koName": "plant derived fermented beverage",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00001254",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "red yeast rice supplement",
      "red fermented rice supplement",
      "red koji rice supplement"
    ],
    "canonicalName": "red yeast rice supplement",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03600010"
    ],
    "id": "tba-food:foodon:foodon_03600010",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang"
    ],
    "kind": "ingredient",
    "koName": "red yeast rice supplement",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03600010",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "rice (fermented)"
    ],
    "canonicalName": "rice (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "grain_noodle",
      "fermented_jang"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310254"
    ],
    "id": "tba-food:foodon:foodon_03310254",
    "ingredientSignalIds": [
      "ingredient:grain",
      "ingredient:soy-jang"
    ],
    "kind": "process",
    "koName": "rice (fermented)",
    "lexiconIds": [
      "lexicon:savory-depth",
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310254",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "rowal fruit (fermented)"
    ],
    "canonicalName": "rowal fruit (fermented)",
    "confidence": 0.85,
    "dishKindIds": [
      "fermented_jang",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_00004248"
    ],
    "id": "tba-food:foodon:foodon_00004248",
    "ingredientSignalIds": [
      "ingredient:soy-jang",
      "ingredient:fruit"
    ],
    "kind": "process",
    "koName": "rowal fruit (fermented)",
    "lexiconIds": [
      "lexicon:fermented-umami",
      "lexicon:fermented-aroma",
      "lexicon:rounded-salinity",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:fermented"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_00004248",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "shellfish or crustacean"
    ],
    "canonicalName": "shellfish or crustacean",
    "confidence": 0.85,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03411059"
    ],
    "id": "tba-food:foodon:foodon_03411059",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish",
      "ingredient:crustacean"
    ],
    "kind": "ingredient",
    "koName": "shellfish or crustacean",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:seafood-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03411059",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "soup base flavored with beef extract"
    ],
    "canonicalName": "soup base flavored with beef extract",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304210"
    ],
    "id": "tba-food:foodon:foodon_03304210",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "soup base flavored with beef extract",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304210",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "soup mix (dry, with beef fat or beef extract)"
    ],
    "canonicalName": "soup mix (dry, with beef fat or beef extract)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03302096"
    ],
    "id": "tba-food:foodon:foodon_03302096",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "soup mix (dry, with beef fat or beef extract)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03302096",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "soup mix, with dehydrated beef"
    ],
    "canonicalName": "soup mix, with dehydrated beef",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03311035"
    ],
    "id": "tba-food:foodon:foodon_03311035",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "soup mix, with dehydrated beef",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03311035",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "soup seasoning (extract of beef added)"
    ],
    "canonicalName": "soup seasoning (extract of beef added)",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304941"
    ],
    "id": "tba-food:foodon:foodon_03304941",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "ingredient",
    "koName": "soup seasoning (extract of beef added)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304941",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "tender mushroom soup"
    ],
    "canonicalName": "tender mushroom soup",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304910"
    ],
    "id": "tba-food:foodon:foodon_03304910",
    "ingredientSignalIds": [
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "tender mushroom soup",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304910",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "vegetable beef soup"
    ],
    "canonicalName": "vegetable beef soup",
    "confidence": 0.85,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03305999"
    ],
    "id": "tba-food:foodon:foodon_03305999",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "vegetable beef soup",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03305999",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "wild mushroom fruitbody (raw)",
      "wild mushroom"
    ],
    "canonicalName": "wild mushroom fruitbody (raw)",
    "confidence": 0.85,
    "dishKindIds": [
      "vegetable_herb",
      "broth",
      "dessert"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03306538"
    ],
    "id": "tba-food:foodon:foodon_03306538",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:fruit"
    ],
    "kind": "ingredient",
    "koName": "wild mushroom fruitbody (raw)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:fruit-aroma",
      "lexicon:bright-acidity",
      "lexicon:clean-sweetness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03306538",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "0600000 - 6. tea, coffee, herbal infusions and cocoa (ec)"
    ],
    "canonicalName": "0600000 - 6. tea, coffee, herbal infusions and cocoa (ec)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401241"
    ],
    "id": "tba-food:foodon:foodon_03401241",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "0600000 - 6. tea, coffee, herbal infusions and cocoa (ec)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401241",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "06350 - beefsteak tomato (efsa foodex2)"
    ],
    "canonicalName": "06350 - beefsteak tomato (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03540635"
    ],
    "id": "tba-food:foodon:foodon_03540635",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "06350 - beefsteak tomato (efsa foodex2)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03540635",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "07930 - pearl oyster mushrooms (efsa foodex2)"
    ],
    "canonicalName": "07930 - pearl oyster mushrooms (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03540793"
    ],
    "id": "tba-food:foodon:foodon_03540793",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "07930 - pearl oyster mushrooms (efsa foodex2)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03540793",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000019 - shellfish - unprepared/unprocessed (perishable) (gs1 gpc)"
    ],
    "canonicalName": "10000019 - shellfish - unprepared/unprocessed (perishable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401154"
    ],
    "id": "tba-food:foodon:foodon_03401154",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000019 - shellfish - unprepared/unprocessed (perishable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401154",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000020 - shellfish - unprepared/unprocessed (frozen) (gs1 gpc)"
    ],
    "canonicalName": "10000020 - shellfish - unprepared/unprocessed (frozen) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401153"
    ],
    "id": "tba-food:foodon:foodon_03401153",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000020 - shellfish - unprepared/unprocessed (frozen) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401153",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000021 - shellfish - unprepared/unprocessed (shelf stable) (gs1 gpc)"
    ],
    "canonicalName": "10000021 - shellfish - unprepared/unprocessed (shelf stable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401155"
    ],
    "id": "tba-food:foodon:foodon_03401155",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000021 - shellfish - unprepared/unprocessed (shelf stable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401155",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000256 - shellfish prepared/processed (frozen) (gs1 gpc)"
    ],
    "canonicalName": "10000256 - shellfish prepared/processed (frozen) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401149"
    ],
    "id": "tba-food:foodon:foodon_03401149",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000256 - shellfish prepared/processed (frozen) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401149",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000257 - shellfish prepared/processed (perishable) (gs1 gpc)"
    ],
    "canonicalName": "10000257 - shellfish prepared/processed (perishable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401150"
    ],
    "id": "tba-food:foodon:foodon_03401150",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000257 - shellfish prepared/processed (perishable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401150",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000258 - shellfish prepared/processed (shelf stable) (gs1 gpc)"
    ],
    "canonicalName": "10000258 - shellfish prepared/processed (shelf stable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401151"
    ],
    "id": "tba-food:foodon:foodon_03401151",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000258 - shellfish prepared/processed (shelf stable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401151",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000626 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (frozen) (gs1 gpc)"
    ],
    "canonicalName": "10000626 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (frozen) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401134"
    ],
    "id": "tba-food:foodon:foodon_03401134",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000626 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (frozen) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401134",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000627 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (perishable) (gs1 gpc)"
    ],
    "canonicalName": "10000627 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (perishable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401135"
    ],
    "id": "tba-food:foodon:foodon_03401135",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000627 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (perishable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401135",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000628 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (shelf stable) (gs1 gpc)"
    ],
    "canonicalName": "10000628 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (shelf stable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401136"
    ],
    "id": "tba-food:foodon:foodon_03401136",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000628 - aquatic invertebrates/fish/shellfish/seafood mixes - prepared/processed (shelf stable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401136",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000629 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (frozen) (gs1 gpc)"
    ],
    "canonicalName": "10000629 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (frozen) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401137"
    ],
    "id": "tba-food:foodon:foodon_03401137",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000629 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (frozen) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401137",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000630 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (perishable) (gs1 gpc)"
    ],
    "canonicalName": "10000630 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (perishable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401138"
    ],
    "id": "tba-food:foodon:foodon_03401138",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000630 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (perishable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401138",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10000631 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (shelf stable) (gs1 gpc)"
    ],
    "canonicalName": "10000631 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (shelf stable) (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401139"
    ],
    "id": "tba-food:foodon:foodon_03401139",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "10000631 - aquatic invertebrates/fish/shellfish/seafood mixes - unprepared/unprocessed (shelf stable) (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401139",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "10006031 - oyster mushrooms (gs1 gpc)"
    ],
    "canonicalName": "10006031 - oyster mushrooms (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401556"
    ],
    "id": "tba-food:foodon:foodon_03401556",
    "ingredientSignalIds": [
      "ingredient:shellfish",
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "10006031 - oyster mushrooms (gs1 gpc)",
    "lexiconIds": [
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401556",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "26230 - stockfish (efsa foodex2)"
    ],
    "canonicalName": "26230 - stockfish (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03542623"
    ],
    "id": "tba-food:foodon:foodon_03542623",
    "ingredientSignalIds": [
      "ingredient:white-fish"
    ],
    "kind": "ingredient",
    "koName": "26230 - stockfish (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03542623",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "34030 - ingredients for coffee, cocoa, tea, and herbal infusions (efsa foodex2)"
    ],
    "canonicalName": "34030 - ingredients for coffee, cocoa, tea, and herbal infusions (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543403"
    ],
    "id": "tba-food:foodon:foodon_03543403",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "34030 - ingredients for coffee, cocoa, tea, and herbal infusions (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543403",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "36990 - derivatives of coffee, cocoa, tea, herbal infusion materials and similar rpcs (efsa foodex2)"
    ],
    "canonicalName": "36990 - derivatives of coffee, cocoa, tea, herbal infusion materials and similar rpcs (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543699"
    ],
    "id": "tba-food:foodon:foodon_03543699",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "36990 - derivatives of coffee, cocoa, tea, herbal infusion materials and similar rpcs (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543699",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "37000 - hot drinks and similar (coffee, cocoa, tea and herbal infusions) (efsa foodex2)"
    ],
    "canonicalName": "37000 - hot drinks and similar (coffee, cocoa, tea and herbal infusions) (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543700"
    ],
    "id": "tba-food:foodon:foodon_03543700",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "37000 - hot drinks and similar (coffee, cocoa, tea and herbal infusions) (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543700",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "37300 - herbal and other non-tea infusions (efsa foodex2)"
    ],
    "canonicalName": "37300 - herbal and other non-tea infusions (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543730"
    ],
    "id": "tba-food:foodon:foodon_03543730",
    "ingredientSignalIds": [
      "ingredient:leafy-green",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "37300 - herbal and other non-tea infusions (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543730",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "38690 - fish and vegetables meal (efsa foodex2)"
    ],
    "canonicalName": "38690 - fish and vegetables meal (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "vegetable_herb"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543869"
    ],
    "id": "tba-food:foodon:foodon_03543869",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "38690 - fish and vegetables meal (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543869",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39110 - mixed vegetables, grilled (efsa foodex2)"
    ],
    "canonicalName": "39110 - mixed vegetables, grilled (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "grilled_smoked"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543911"
    ],
    "id": "tba-food:foodon:foodon_03543911",
    "ingredientSignalIds": [
      "ingredient:leafy-green"
    ],
    "kind": "process",
    "koName": "39110 - mixed vegetables, grilled (efsa foodex2)",
    "lexiconIds": [
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543911",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39270 - sandwich with fish and vegetable topping/filling (efsa foodex2)"
    ],
    "canonicalName": "39270 - sandwich with fish and vegetable topping/filling (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "vegetable_herb"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543927"
    ],
    "id": "tba-food:foodon:foodon_03543927",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "39270 - sandwich with fish and vegetable topping/filling (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543927",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39360 - pizza and similar with cheese, meat, mushrooms, and vegetables (efsa foodex2)"
    ],
    "canonicalName": "39360 - pizza and similar with cheese, meat, mushrooms, and vegetables (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543936"
    ],
    "id": "tba-food:foodon:foodon_03543936",
    "ingredientSignalIds": [
      "ingredient:mushroom",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "39360 - pizza and similar with cheese, meat, mushrooms, and vegetables (efsa foodex2)",
    "lexiconIds": [
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543936",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "39880 - fish soup, dry (efsa foodex2)"
    ],
    "canonicalName": "39880 - fish soup, dry (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03543988"
    ],
    "id": "tba-food:foodon:foodon_03543988",
    "ingredientSignalIds": [
      "ingredient:white-fish"
    ],
    "kind": "ingredient",
    "koName": "39880 - fish soup, dry (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03543988",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "40020 - fish soup (efsa foodex2)"
    ],
    "canonicalName": "40020 - fish soup (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544002"
    ],
    "id": "tba-food:foodon:foodon_03544002",
    "ingredientSignalIds": [
      "ingredient:white-fish"
    ],
    "kind": "ingredient",
    "koName": "40020 - fish soup (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544002",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "40300 - prepared mixed egg/meat/fish/vegetable salad (efsa foodex2)"
    ],
    "canonicalName": "40300 - prepared mixed egg/meat/fish/vegetable salad (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood",
      "vegetable_herb"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544030"
    ],
    "id": "tba-food:foodon:foodon_03544030",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:leafy-green"
    ],
    "kind": "ingredient",
    "koName": "40300 - prepared mixed egg/meat/fish/vegetable salad (efsa foodex2)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:green-freshness",
      "lexicon:leafy-green-bitterness"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544030",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "40740 - stock cubes or granulate, chicken (efsa foodex2)"
    ],
    "canonicalName": "40740 - stock cubes or granulate, chicken (efsa foodex2)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03544074"
    ],
    "id": "tba-food:foodon:foodon_03544074",
    "ingredientSignalIds": [
      "ingredient:poultry"
    ],
    "kind": "ingredient",
    "koName": "40740 - stock cubes or granulate, chicken (efsa foodex2)",
    "lexiconIds": [
      "lexicon:poultry-clean-meat",
      "lexicon:clear-umami",
      "lexicon:deep-umami"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:broth",
      "process:boiled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03544074",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "50121700 - shellfish unprepared/unprocessed (gs1 gpc)"
    ],
    "canonicalName": "50121700 - shellfish unprepared/unprocessed (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401152"
    ],
    "id": "tba-food:foodon:foodon_03401152",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "50121700 - shellfish unprepared/unprocessed (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401152",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "50122100 - shellfish prepared/processed (gs1 gpc)"
    ],
    "canonicalName": "50122100 - shellfish prepared/processed (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401148"
    ],
    "id": "tba-food:foodon:foodon_03401148",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "process",
    "koName": "50122100 - shellfish prepared/processed (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401148",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "50122500 - aquatic invertebrates/fish/shellfish/seafood combination (gs1 gpc)"
    ],
    "canonicalName": "50122500 - aquatic invertebrates/fish/shellfish/seafood combination (gs1 gpc)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03401133"
    ],
    "id": "tba-food:foodon:foodon_03401133",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "ingredient",
    "koName": "50122500 - aquatic invertebrates/fish/shellfish/seafood combination (gs1 gpc)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03401133",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "aquatic invertebrate animal (excluding shellfish)"
    ],
    "canonicalName": "aquatic invertebrate animal (excluding shellfish)",
    "confidence": 0.84,
    "dishKindIds": [
      "seafood"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03411142"
    ],
    "id": "tba-food:foodon:foodon_03411142",
    "ingredientSignalIds": [
      "ingredient:white-fish",
      "ingredient:shellfish"
    ],
    "kind": "ingredient",
    "koName": "aquatic invertebrate animal (excluding shellfish)",
    "lexiconIds": [
      "lexicon:white-fish-clean",
      "lexicon:clear-umami",
      "lexicon:shellfish-sweetness",
      "lexicon:briny-sea"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03411142",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef (grilled)"
    ],
    "canonicalName": "beef (grilled)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "grilled_smoked"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310244"
    ],
    "id": "tba-food:foodon:foodon_03310244",
    "ingredientSignalIds": [
      "ingredient:beef"
    ],
    "kind": "process",
    "koName": "beef (grilled)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:charred-aroma",
      "lexicon:roasted-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [
      "process:grilled"
    ],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310244",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef (steak, freeze-dried)"
    ],
    "canonicalName": "beef (steak, freeze-dried)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03304435"
    ],
    "id": "tba-food:foodon:foodon_03304435",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef (steak, freeze-dried)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03304435",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef 7-bone chuck steak",
      "7-bone steak"
    ],
    "canonicalName": "beef 7-bone chuck steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000095"
    ],
    "id": "tba-food:foodon:foodon_02000095",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef 7-bone chuck steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000095",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef 7-bone chuck steak (raw)"
    ],
    "canonicalName": "beef 7-bone chuck steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000096"
    ],
    "id": "tba-food:foodon:foodon_02000096",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef 7-bone chuck steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000096",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef blade chuck steak",
      "blade steak",
      "boneless blade steak 1st cut"
    ],
    "canonicalName": "beef blade chuck steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000099"
    ],
    "id": "tba-food:foodon:foodon_02000099",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef blade chuck steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000099",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef blade chuck steak (raw)"
    ],
    "canonicalName": "beef blade chuck steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000100"
    ],
    "id": "tba-food:foodon:foodon_02000100",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef blade chuck steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000100",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef bottom round steak"
    ],
    "canonicalName": "beef bottom round steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000004"
    ],
    "id": "tba-food:foodon:foodon_02000004",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef bottom round steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000004",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef bottom round steak (boneless, raw)"
    ],
    "canonicalName": "beef bottom round steak (boneless, raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000007"
    ],
    "id": "tba-food:foodon:foodon_02000007",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef bottom round steak (boneless, raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000007",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef bottom round steak (boneless)"
    ],
    "canonicalName": "beef bottom round steak (boneless)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000006"
    ],
    "id": "tba-food:foodon:foodon_02000006",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef bottom round steak (boneless)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000006",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef bottom round steak (raw)"
    ],
    "canonicalName": "beef bottom round steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000005"
    ],
    "id": "tba-food:foodon:foodon_02000005",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef bottom round steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000005",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck arm steak"
    ],
    "canonicalName": "beef chuck arm steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000109"
    ],
    "id": "tba-food:foodon:foodon_02000109",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck arm steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000109",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck arm steak (raw)"
    ],
    "canonicalName": "beef chuck arm steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000110"
    ],
    "id": "tba-food:foodon:foodon_02000110",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck arm steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000110",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck eye steak",
      "beef chuck eye roll steak (boneless)",
      "delmonico steak"
    ],
    "canonicalName": "beef chuck eye steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000058"
    ],
    "id": "tba-food:foodon:foodon_02000058",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck eye steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000058",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck eye steak (raw)"
    ],
    "canonicalName": "beef chuck eye steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000059"
    ],
    "id": "tba-food:foodon:foodon_02000059",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck eye steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000059",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck steak",
      "chuck center steak"
    ],
    "canonicalName": "beef chuck steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000105"
    ],
    "id": "tba-food:foodon:foodon_02000105",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000105",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck steak (raw)"
    ],
    "canonicalName": "beef chuck steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000106"
    ],
    "id": "tba-food:foodon:foodon_02000106",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000106",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck tender steak",
      "mock tender steak"
    ],
    "canonicalName": "beef chuck tender steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000048"
    ],
    "id": "tba-food:foodon:foodon_02000048",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck tender steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000048",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef chuck tender steak (raw)"
    ],
    "canonicalName": "beef chuck tender steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000049"
    ],
    "id": "tba-food:foodon:foodon_02000049",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef chuck tender steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000049",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef cowboy steak"
    ],
    "canonicalName": "beef cowboy steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000233"
    ],
    "id": "tba-food:foodon:foodon_02000233",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef cowboy steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000233",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef cowboy steak (raw)"
    ],
    "canonicalName": "beef cowboy steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000234"
    ],
    "id": "tba-food:foodon:foodon_02000234",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef cowboy steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000234",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef culotte steak",
      "boneless top sirloin cap steak"
    ],
    "canonicalName": "beef culotte steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000157"
    ],
    "id": "tba-food:foodon:foodon_02000157",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef culotte steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000157",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef culotte steak (raw)"
    ],
    "canonicalName": "beef culotte steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000158"
    ],
    "id": "tba-food:foodon:foodon_02000158",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef culotte steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000158",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef denver steak",
      "chuck under blade center steak",
      "chuck under blade steak"
    ],
    "canonicalName": "beef denver steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000065"
    ],
    "id": "tba-food:foodon:foodon_02000065",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef denver steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000065",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef denver steak (raw)"
    ],
    "canonicalName": "beef denver steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000066"
    ],
    "id": "tba-food:foodon:foodon_02000066",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef denver steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000066",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef eye of round steak"
    ],
    "canonicalName": "beef eye of round steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000043"
    ],
    "id": "tba-food:foodon:foodon_02000043",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef eye of round steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000043",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef eye of round steak (raw)"
    ],
    "canonicalName": "beef eye of round steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000044"
    ],
    "id": "tba-food:foodon:foodon_02000044",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef eye of round steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000044",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef flank steak"
    ],
    "canonicalName": "beef flank steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000177"
    ],
    "id": "tba-food:foodon:foodon_02000177",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef flank steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000177",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef flank steak (raw)"
    ],
    "canonicalName": "beef flank steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000178"
    ],
    "id": "tba-food:foodon:foodon_02000178",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef flank steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000178",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef flat iron steak"
    ],
    "canonicalName": "beef flat iron steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000087"
    ],
    "id": "tba-food:foodon:foodon_02000087",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef flat iron steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000087",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef flat iron steak (raw)"
    ],
    "canonicalName": "beef flat iron steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000088"
    ],
    "id": "tba-food:foodon:foodon_02000088",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef flat iron steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000088",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef hanger steak"
    ],
    "canonicalName": "beef hanger steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000185"
    ],
    "id": "tba-food:foodon:foodon_02000185",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef hanger steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000185",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef hanger steak (raw)"
    ],
    "canonicalName": "beef hanger steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000186"
    ],
    "id": "tba-food:foodon:foodon_02000186",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef hanger steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000186",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef inside skirt steak"
    ],
    "canonicalName": "beef inside skirt steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000181"
    ],
    "id": "tba-food:foodon:foodon_02000181",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef inside skirt steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000181",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef inside skirt steak (raw)"
    ],
    "canonicalName": "beef inside skirt steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000182"
    ],
    "id": "tba-food:foodon:foodon_02000182",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef inside skirt steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000182",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef outside skirt steak"
    ],
    "canonicalName": "beef outside skirt steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000183"
    ],
    "id": "tba-food:foodon:foodon_02000183",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef outside skirt steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000183",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef outside skirt steak (raw)"
    ],
    "canonicalName": "beef outside skirt steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000184"
    ],
    "id": "tba-food:foodon:foodon_02000184",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef outside skirt steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000184",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef patty with mushroom (raw)"
    ],
    "canonicalName": "beef patty with mushroom (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "vegetable_herb",
      "broth"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_03310592"
    ],
    "id": "tba-food:foodon:foodon_03310592",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:mushroom"
    ],
    "kind": "ingredient",
    "koName": "beef patty with mushroom (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:mushroom-earthy-umami",
      "lexicon:earthy-aroma"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_03310592",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef petite sirloin steak",
      "ball tip Steak",
      "sirloin steak"
    ],
    "canonicalName": "beef petite sirloin steak",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000167"
    ],
    "id": "tba-food:foodon:foodon_02000167",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef petite sirloin steak",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000167",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  },
  {
    "aliases": [
      "beef petite sirloin steak (raw)"
    ],
    "canonicalName": "beef petite sirloin steak (raw)",
    "confidence": 0.84,
    "dishKindIds": [
      "meat",
      "beverage_pairing"
    ],
    "foodGroup": "",
    "foodOnIds": [
      "foodon:FOODON_02000168"
    ],
    "id": "tba-food:foodon:foodon_02000168",
    "ingredientSignalIds": [
      "ingredient:beef",
      "ingredient:tea"
    ],
    "kind": "ingredient",
    "koName": "beef petite sirloin steak (raw)",
    "lexiconIds": [
      "lexicon:beef-fat-depth",
      "lexicon:meaty-aroma",
      "lexicon:clean-bitterness",
      "lexicon:aroma-lift"
    ],
    "nativeFoodIds": [],
    "processSignalIds": [],
    "sourceRefs": [
      {
        "id": "http://purl.obolibrary.org/obo/FOODON_02000168",
        "source": "foodon-taxonomy"
      }
    ],
    "status": "active",
    "surfaces": {
      "taste-bubble": true,
      "detail-tag": true,
      "dining-note": true,
      "recommendation": true,
      "chef-guide": true,
      "tcs": true
    }
  }
] satisfies readonly TbaFoodKnowledgeEntry[];
