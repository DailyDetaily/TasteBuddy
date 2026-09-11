
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App.tsx";
import ChatGPTConsentPage from "./pages/ChatGPTConsentPage";
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

  createRoot(document.getElementById("root")!).render(
    window.location.pathname === "/oauth/chatgpt" ? <ChatGPTConsentPage /> : <App />,
  );
}

void bootstrap();
  
