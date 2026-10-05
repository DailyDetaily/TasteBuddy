import { buildNativeAnalysis } from "./nativeAnalysis";
import {NATIVE_MODEL_OWNER} from './nativeJournalPolicy';
self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      snapshot: buildNativeAnalysis(data.entries, NATIVE_MODEL_OWNER),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "기록을 분석하지 못했어요.",
    });
  }
};
