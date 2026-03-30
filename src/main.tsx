import { createRoot } from "react-dom/client";
import "./index.css";
import { setupGlobalErrorHandlers } from "@/lib/global-error-handler";

function showBootstrapError(err: unknown) {
  const rootEl = document.getElementById("root");
  const message = err instanceof Error ? err.message : String(err);
  const html = `<div style="padding: 2rem; font-family: sans-serif; max-width: 600px;"><h1>Erro ao carregar</h1><p>${message}</p><p>Verifique o console (F12) para mais detalhes.</p></div>`;
  if (rootEl) rootEl.innerHTML = html;
  else document.body.innerHTML = html;
  console.error("[ComplianceSync] Bootstrap error:", err);
}

setupGlobalErrorHandlers();

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p>Erro: elemento #root não encontrado.</p>";
} else {
  import("./App.tsx")
    .then(({ default: App }) => {
      createRoot(rootEl).render(<App />);
    })
    .catch((err) => {
      showBootstrapError(err);
    });
}
