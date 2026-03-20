import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initDevtoolsGuard } from "@/lib/devtools-guard";
import "./index.css";

initDevtoolsGuard();

createRoot(document.getElementById("root")!).render(<App />);
