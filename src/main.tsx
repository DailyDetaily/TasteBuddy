
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { registerSW } from "virtual:pwa-register";
import { installSystemColorMode } from "./lib/colorMode";

const App = lazy(() => import("./App.tsx"));
const PlatingSite = lazy(() => import("./plating/PlatingSite"));
const SheetPresentationPreview = lazy(() => import("./plating/SheetPresentation").then(module => ({ default: module.SheetPresentationPreview })));
const ChatGPTConsentPage = lazy(() => import("./pages/ChatGPTConsentPage"));
import "./index.css";

async function resetLocalDevPwaState() {
  if (
    !import.meta.env.DEV ||
    typeof window === "undefined" ||
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return false;
  }

  let shouldReload = false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length > 0) {
        shouldReload = true;
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    }

    if ("caches" in window) {
      const cacheKeys = await window.caches.keys();

      if (cacheKeys.length > 0) {
        shouldReload = true;
        await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
      }
    }
  } catch (error) {
    console.warn("Failed to clear local dev PWA state.", error);
  }

  if (shouldReload) {
    window.location.reload();
    return true;
  }

  return false;
}

async function bootstrap() {
  const isReloadingAfterReset = await resetLocalDevPwaState();

  if (isReloadingAfterReset) {
    return;
  }

  if (!import.meta.env.DEV) {
    registerSW({ immediate: true });
  }

  const isPlating = window.location.pathname === "/design-system" ||
    window.location.pathname.startsWith("/design-system/") ||
    new URLSearchParams(window.location.search).get("preview") === "design-system";
  const isSheetPreview = window.location.pathname === "/design-system/sheet-presentation-preview";
  if (!isPlating && window.location.pathname !== "/oauth/chatgpt") installSystemColorMode();
  createRoot(document.getElementById("root")!).render(
    <Suspense fallback={<div role="status" style={{padding: 24}}>불러오고 있어요.</div>}>
      {window.location.pathname === "/oauth/chatgpt" ? <ChatGPTConsentPage /> : isSheetPreview ? <SheetPresentationPreview /> : isPlating ? <PlatingSite /> : <App />}
    </Suspense>,
  );
}

void bootstrap();
  
