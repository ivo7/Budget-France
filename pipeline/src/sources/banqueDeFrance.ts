// Source Banque de France — Webstat.
// MVP : reachability check. Un parseur complet Webstat nécessiterait d'identifier
// les codes de série précis (TLMBSI-FR pour OAT, etc.) et de gérer SDMX/CSV.
// Si le service répond, on marque la source comme "ok" mais sans surcharger
// les valeurs — elle sert de validation croisée.

import { httpGet } from "../http.ts";
import type { SourceInfo } from "../types.ts";

export async function pingWebstat(): Promise<SourceInfo> {
  const url = "https://webstat.banque-france.fr/ws_wsfr/fr/exports/taux_interet/TLMBSI-FR.csv";
  try {
    await httpGet(url, { timeoutMs: 10_000, headers: { Accept: "text/csv" } });
    return {
      id: "bdf.webstat",
      label: "Banque de France — Webstat (taux)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    };
  } catch (e) {
    return {
      id: "bdf.webstat",
      label: "Banque de France — Webstat (taux)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "error",
      error: (e as Error).message,
    };
  }
}
