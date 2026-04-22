import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root introuvable");

// --- Dissuasions de capture d'écran ---
// IMPORTANT : aucun de ces mécanismes ne bloque une capture d'écran OS
// (Cmd+Shift+4, PrintScreen, outils natifs). Ils découragent les
// partages non attribués et rendent la copie de texte moins immédiate.
//
// Voir aussi index.css :
//   - .protected  → user-select: none
//   - .watermark-layer → watermark tricolore répété
//   - body.blur-on-blur → floute la page quand elle perd le focus

// 1. Intercepte le clic-droit (menu contextuel → Enregistrer image / Copier)
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  // On autorise le menu contextuel dans les champs de formulaire
  if (target.closest("input, textarea, select")) return;
  e.preventDefault();
});

// 2. Intercepte la combinaison Ctrl+S / Ctrl+P / Ctrl+U (sauvegarde page, impression, source)
document.addEventListener("keydown", (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && ["s", "p", "u"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

// 3. Active le flou au blur (optionnel — peut être retiré si trop agressif)
// document.body.classList.add("blur-on-blur");

document.body.classList.add("protected");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
