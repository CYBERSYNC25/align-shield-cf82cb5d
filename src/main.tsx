import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "@/lib/global-error-handler";

// Initialize global error handlers for centralized logging
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
