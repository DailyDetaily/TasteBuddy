import { useEffect } from "react";
import { getRemotionEnvironment, staticFile } from "remotion";
import {
  nativeFeedback,
  nativeFeedbackSync as sync,
} from "../generated/native-feedback";

// Studio-only diagnostics. Production frames never contain sync notices.
export const NativeFeedbackSync = () => {
  const studio = getRemotionEnvironment().isStudio;
  useEffect(() => {
    if (!studio) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `${staticFile("native-feedback-sync.json")}?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const latest = await response.json();
        const editing = document.activeElement?.matches(
          "input, textarea, [contenteditable=true]",
        );
        // Frozen Remotion sequences may retain a mounted component after HMR.
        // Studio persists the current frame; reload only after a native revision,
        // and defer while the user is typing in the Inspector.
        if (
          active &&
          !editing &&
          latest.inputHash &&
          latest.inputHash !== nativeFeedback.inputHash
        )
          window.location.reload();
      } catch {
        /* Keep the usable preview through a transient Studio disconnect. */
      }
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [studio]);
  if (sync.status === "ready") return null;
  if (!studio)
    throw new Error(
      `Native feedback UI sync needs review: ${sync.review.map((r) => `${r.file}: ${r.message}`).join("; ")}`,
    );
  return (
    <div
      data-native-sync-review
      role="status"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 16,
        zIndex: 100,
        fontFamily: "Pretendard, sans-serif",
        fontSize: 16,
        padding: "14px 18px",
        borderRadius: 10,
        background: "#FFF2CC",
        color: "#493C0A",
        boxShadow: "0 2px 12px #0002",
      }}
    >
      <strong>네이티브 UI 변경 확인 필요</strong>
      {sync.review.map((item, i) => (
        <div key={i}>
          {item.file} · {item.section}: {item.message}
        </div>
      ))}
    </div>
  );
};
