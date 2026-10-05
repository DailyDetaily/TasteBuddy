import { createRoot } from "react-dom/client";
import { BloomEditor } from "./Editor";
import "./standalone.css";

createRoot(document.getElementById("root")!).render(<BloomEditor />);
