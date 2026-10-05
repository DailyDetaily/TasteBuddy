import { useEffect, useState } from "react";
import type { NativeRecord } from "./nativeRecord";
import type { NativeAnalysisSnapshot } from "./nativeAnalysis";
export function useNativeAnalysis(
  entries: NativeRecord[],
  owner: string,
  ready: boolean,
) {
  const key = JSON.stringify(entries);
  const [attempt, setAttempt] = useState(0);
  const [value, setValue] = useState<{
    owner: string;
    key: string;
    snapshot?: NativeAnalysisSnapshot;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!ready) return;
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./nativeAnalysis.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = ({ data }) => {
        setValue({ owner, key, ...data });
        worker.terminate();
      };
      worker.onerror = () => {
        setValue({
          owner,
          key,
          error: "분석을 불러오지 못했어요. 다시 시도해 주세요.",
        });
        worker.terminate();
      };
      worker.postMessage({ entries: JSON.parse(key), owner });
    } catch {
      setValue({
        owner,
        key,
        error: "이 브라우저에서 분석을 시작하지 못했어요.",
      });
    }
    return () => worker?.terminate();
  }, [key, owner, ready, attempt]);
  const current = ready && value?.owner === owner && value.key === key ? value : null;
  return {
    snapshot: current?.snapshot,
    error: current?.error,
    updating: ready && !current,
    retry: () => { setValue(null); setAttempt(value => value + 1); },
  };
}
