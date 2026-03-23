
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { applyPersistedDesignTokenRuntimeState } from "./lib/designTokenRuntime";
import "./index.css";

applyPersistedDesignTokenRuntimeState();

createRoot(document.getElementById("root")!).render(<App />);
  
