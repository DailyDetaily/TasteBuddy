import {
  TBA_CORE_TASTE_LEXICON,
  TBA_CORE_TASTE_LEXICON_MIN_ACTIVE_CONFIDENCE,
  TBA_CORE_TASTE_LEXICON_VERSION,
} from '../../src/constants/tbaCoreTasteLexicon';
import {
  TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
  TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT,
  TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH,
  TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION,
} from '../../src/constants/tbaFoodKnowledgeRuntime';
import {
  TBA_FOODON_BRIDGE_ENTRIES,
  TBA_FOODON_BRIDGE_VERSION,
  TBA_FOODON_REFERENCE_LICENSE,
  TBA_FOODON_REFERENCE_PATH,
} from '../../src/constants/tbaFoodOnBridge';
import {
  TBA_SIGNAL_TAXONOMY,
} from '../../src/constants/tbaSignalTaxonomy';
import { TBA } from '../../src/lib/tasteBuddyAgent';

export function buildTbaNativeBundle() {
  return {
    schemaVersion: 1,
    agent: {
      alias: TBA.alias,
      capabilities: TBA.capabilities,
      displayName: TBA.displayName,
    },
    coreTasteLexicon: {
      entries: TBA_CORE_TASTE_LEXICON,
      minActiveConfidence: TBA_CORE_TASTE_LEXICON_MIN_ACTIVE_CONFIDENCE,
      version: TBA_CORE_TASTE_LEXICON_VERSION,
    },
    foodKnowledgeRuntime: {
      entries: TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
      sourceCount: TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT,
      sourcePath: TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_PATH,
      version: TBA_FOOD_KNOWLEDGE_RUNTIME_VERSION,
    },
    foodOnBridge: {
      entries: TBA_FOODON_BRIDGE_ENTRIES,
      referenceLicense: TBA_FOODON_REFERENCE_LICENSE,
      referencePath: TBA_FOODON_REFERENCE_PATH,
      version: TBA_FOODON_BRIDGE_VERSION,
    },
    signalTaxonomy: TBA_SIGNAL_TAXONOMY,
  };
}
