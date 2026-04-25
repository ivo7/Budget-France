// ============================================================================
// checkSources.ts
// ============================================================================
// Script standalone qui vérifie que toutes les URLs des sources du dernier
// snapshot répondent correctement (HTTP 2xx / 3xx).
//
// Usage :
//   docker compose run --rm pipeline npx tsx src/checkSources.ts
//   ou directement : npx tsx pipeline/src/checkSources.ts
//
// Sortie :
//   - Tableau lisible avec ✓ / ⚠ / ✗ pour chaque source
//   - Code de retour 0 si tout est OK, 1 si au moins 1 source casse
//
// Le script est aussi appelable via l'endpoint admin GET /api/admin/check-sources
// pour afficher les résultats dans le dashboard administrateur.
// ============================================================================

import { readFile } from "node:fs/promises";

interface Source {
  id: string;
  label: string;
  url?: string;
  status?: string;
  fallback?: boolean;
}

interface Snapshot {
  generatedAt: string;
  sources: Source[];
}

interface CheckResult {
  id: string;
  label: string;
  url?: string;
  ok: boolean;
  httpStatus?: number;
  error?: string;
  durationMs: number;
}

/**
 * Lance une requête HEAD (puis GET en fallback si HEAD est refusé) pour
 * vérifier qu'une URL répond. Retourne true si HTTP 2xx ou 3xx.
 */
export async function checkUrl(
  url: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; httpStatus?: number; error?: string; durationMs: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // 1) Tenter HEAD
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "BudgetFrance-SourceChecker/1.0 (https://budgetfrance.org)",
      },
    });
    clearTimeout(timeout);
    const ok = res.status >= 200 && res.status < 400;
    if (ok || res.status !== 405) {
      // 405 = Method Not Allowed → on retentera en GET
      return {
        ok,
        httpStatus: res.status,
        durationMs: Date.now() - start,
      };
    }
  } catch (e) {
    clearTimeout(timeout);
    // Si abort/timeout/réseau : on tente quand même un GET
    if (e instanceof Error && e.name !== "AbortError") {
      return { ok: false, error: e.message, durationMs: Date.now() - start };
    }
  }

  // 2) Fallback GET (certains serveurs refusent HEAD)
  const controller2 = new AbortController();
  const timeout2 = setTimeout(() => controller2.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller2.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "BudgetFrance-SourceChecker/1.0 (https://budgetfrance.org)",
        Range: "bytes=0-1023", // ne télécharge que le 1er ko
      },
    });
    clearTimeout(timeout2);
    return {
      ok: res.status >= 200 && res.status < 400,
      httpStatus: res.status,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    clearTimeout(timeout2);
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Vérifie toutes les sources du snapshot en parallèle (avec une concurrence
 * limitée pour ne pas surcharger les serveurs publics).
 */
export async function checkAllSources(
  sources: Source[],
  concurrency = 6,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const queue = [...sources];

  async function worker() {
    while (queue.length > 0) {
      const src = queue.shift();
      if (!src) break;
      if (!src.url) {
        results.push({
          id: src.id,
          label: src.label,
          ok: false,
          error: "URL manquante",
          durationMs: 0,
        });
        continue;
      }
      const r = await checkUrl(src.url);
      results.push({
        id: src.id,
        label: src.label,
        url: src.url,
        ok: r.ok,
        httpStatus: r.httpStatus,
        error: r.error,
        durationMs: r.durationMs,
      });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, sources.length) }, () => worker());
  await Promise.all(workers);
  // Tri par id pour rendre la sortie déterministe
  results.sort((a, b) => a.id.localeCompare(b.id));
  return results;
}

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

async function runCli() {
  const path = process.argv[2] ?? "/data/budget.json";
  const raw = await readFile(path, "utf-8");
  const snapshot = JSON.parse(raw) as Snapshot;

  const sources = snapshot.sources ?? [];
  console.log(`[check-sources] ${sources.length} sources à vérifier (snapshot du ${snapshot.generatedAt})`);
  console.log();

  const results = await checkAllSources(sources);

  let okCount = 0;
  let warnCount = 0;
  let errCount = 0;

  for (const r of results) {
    if (r.ok) {
      okCount++;
      console.log(`  ✓ ${r.label.padEnd(50)} ${String(r.httpStatus ?? "—").padStart(3)} ${r.durationMs}ms`);
    } else if (!r.url) {
      warnCount++;
      console.log(`  ⚠ ${r.label.padEnd(50)} pas d'URL`);
    } else {
      errCount++;
      const reason = r.httpStatus ? `HTTP ${r.httpStatus}` : (r.error ?? "?");
      console.log(`  ✗ ${r.label.padEnd(50)} ${reason}`);
      console.log(`    └─ ${r.url}`);
    }
  }

  console.log();
  console.log(`[check-sources] résumé : ${okCount} OK · ${warnCount} sans URL · ${errCount} erreurs`);
  process.exit(errCount > 0 ? 1 : 0);
}

// Détecte si le script est lancé directement (pas importé)
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("checkSources.ts") ||
  process.argv[1]?.endsWith("checkSources.js");

if (isMain) {
  runCli().catch((e) => {
    console.error("[check-sources] fatal:", e);
    process.exit(2);
  });
}
