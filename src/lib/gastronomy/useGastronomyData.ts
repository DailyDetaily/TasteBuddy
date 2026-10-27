import { useEffect, useMemo, useState } from "react";
import type { DiningPageExternalFeedbackSubmission } from "../../pages/DiningPage";
import { hydrateReservationPageData } from "../tasteBuddySupabase";
import { buildGastronomyData, type RemoteDining } from "./adapter";
import { loadNativeAccountData } from "./nativeAccount";
import type { Data } from "./engine";
import { DINING_RECORDS_CHANGED } from "./events";
export function useGastronomyData(
  local: readonly DiningPageExternalFeedbackSubmission[],
  owner: string,
  active: boolean,
) {
  const [remote, setRemote] = useState<{
    owner: string;
    data: RemoteDining;
  } | null>(null);
  const [native, setNative] = useState<{ owner: string; data: Data } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [settledOwner, setSettledOwner] = useState<string | null>(null);
  useEffect(() => {
    const changed = () => setRevision((n) => n + 1);
    window.addEventListener(DINING_RECORDS_CHANGED, changed);
    window.addEventListener("online", changed);
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(DINING_RECORDS_CHANGED) : null;
    if (channel) channel.onmessage = e => { if (e.data?.owner === owner) changed(); };
    return () => {
      window.removeEventListener(DINING_RECORDS_CHANGED, changed);
      window.removeEventListener("online", changed);
      channel?.close();
    };
  }, [owner]);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      hydrateReservationPageData({ seedIfEmpty: false, expectedOwner: owner }),
      loadNativeAccountData(owner),
    ])
      .then(([web, native]) => {
        if (cancelled) return;
        if (web.status === "fulfilled") setRemote({ owner, data: web.value });
        else {
          setRemote(null);
          setError(web.reason instanceof Error ? web.reason.message : "이전 기록을 불러오지 못했어요.");
        }
        if (native.status === "fulfilled") {
          setNative({ owner, data: native.value });
          if (native.value.syncError) setError(native.value.syncError);
        } else {
          setNative(null);
          setError(
            native.reason instanceof Error
              ? native.reason.message
              : "네이티브 기록을 불러오지 못했어요.",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) { setLoading(false); setSettledOwner(owner); }
      });
    return () => {
      cancelled = true;
    };
  }, [active, owner, revision]);
  const data = useMemo(
    () =>
      buildGastronomyData(local, remote?.owner === owner ? remote.data : null),
    [local, remote, owner],
  );
  const combined = useMemo(
    () => ({
      sourceRecordCount:
        (data.sourceRecordCount ?? data.records.length) +
        (native?.owner === owner
          ? (native.data.sourceRecordCount ?? native.data.records.length)
          : 0),
      records: [
        ...data.records,
        ...(native?.owner === owner ? native.data.records : []),
      ],
      observations: [
        ...data.observations,
        ...(native?.owner === owner ? native.data.observations : []),
      ],
      overallStars: [
        ...(data.overallStars ?? []),
        ...(native?.owner === owner ? native.data.overallStars ?? [] : []),
      ],
    }),
    [data, native, owner],
  );
  return {
    data: combined,
    loading: active && (loading || settledOwner !== owner),
    error: settledOwner === owner ? error : null,
    retry: () => setRevision((n) => n + 1),
  };
}
