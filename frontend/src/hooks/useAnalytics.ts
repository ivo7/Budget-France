// ============================================================================
// useAnalytics
// ============================================================================
// Tracking de fréquentation minimal et anonyme :
//   - Génère un sessionId aléatoire stocké en localStorage (clé "bf_session_id")
//     → permet de distinguer les visiteurs sans rien savoir d'eux
//   - Loggue chaque changement de page (hash route) au backend
//   - Expose `trackDownload(filename, format)` pour le DownloadableCard
//
// Données envoyées au backend :
//   { sessionId, page, referrer? }   ← sur chaque navigation
//   { sessionId, filename, format }  ← sur chaque téléchargement
//
// Pas de donnée personnelle, pas de cookie tiers, pas de fingerprinting.
// Conforme RGPD sans consentement explicite (LR Art. 6.1.f intérêt légitime).
// ============================================================================

import { useEffect } from "react";

const SESSION_KEY = "bf_session_id";

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      // 32 caractères hex aléatoires
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      id = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage refusé (mode privé strict) → session aléatoire éphémère
    return "ephemeral-" + Math.random().toString(36).slice(2);
  }
}

async function postBeacon(url: string, payload: unknown): Promise<void> {
  // Tente d'utiliser navigator.sendBeacon (envoi non bloquant survivant à un
  // unload de la page). Fallback fetch keepalive sinon.
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch {
    /* swallow */
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* on ignore — l'analytics ne doit jamais casser l'UX */
  }
}

/** Hook à monter une fois en haut de l'app. Track chaque changement de page. */
export function usePageAnalytics(page: string) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const referrer =
      typeof document !== "undefined" && document.referrer ? document.referrer : undefined;
    postBeacon("/api/analytics/page", { sessionId, page, referrer });
  }, [page]);
}

/** À appeler à chaque téléchargement (PNG/JPEG/CSV) depuis DownloadableCard. */
export function trackDownload(
  filename: string,
  format: "png" | "jpeg" | "csv",
  page?: string,
): void {
  const sessionId = getOrCreateSessionId();
  postBeacon("/api/analytics/download", {
    sessionId,
    filename,
    format,
    page: page ?? deriveCurrentPage(),
  });
}

function deriveCurrentPage(): string {
  if (typeof window === "undefined") return "unknown";
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return "dashboard";
  const slash = hash.indexOf("?");
  return slash >= 0 ? hash.slice(0, slash) : hash;
}
