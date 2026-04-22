// Source INSEE — BDM (Banque de Données Macroéconomiques).
// Endpoint public SDMX : https://bdm.insee.fr/series/sdmx/data/<SERIE_ID>
// Dette publique trimestrielle Maastricht (FR) : série "001694019".
// Parse XML basique (pas de dépendance XML supplémentaire).

import { httpGet } from "../http.ts";
import type { SourceInfo } from "../types.ts";

const BASE = "https://bdm.insee.fr/series/sdmx/data";

/**
 * Parse un flux SDMX-ML INSEE très simplement : on cherche les balises
 * <Obs ... TIME_PERIOD="YYYY-Qx" OBS_VALUE="1234.56" />
 * et on retourne la dernière valeur non vide.
 */
function parseLatestObs(xml: string): { date: string; value: number } | null {
  const regex = /<(?:generic:)?Obs[^>]*?TIME_PERIOD="([^"]+)"[^>]*?OBS_VALUE="([^"]+)"/g;
  // Certains flux SDMX INSEE utilisent des balises imbriquées plutôt qu'attributs.
  const alt = /<(?:generic:)?ObsDimension[^>]*?value="([^"]+)"[^>]*?\/>[\s\S]*?<(?:generic:)?ObsValue[^>]*?value="([^"]+)"/g;

  const pts: { date: string; value: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    const v = Number(m[2]);
    if (Number.isFinite(v)) pts.push({ date: m[1]!, value: v });
  }
  if (pts.length === 0) {
    while ((m = alt.exec(xml)) !== null) {
      const v = Number(m[2]);
      if (Number.isFinite(v)) pts.push({ date: m[1]!, value: v });
    }
  }
  if (pts.length === 0) return null;
  pts.sort((a, b) => a.date.localeCompare(b.date));
  return pts[pts.length - 1]!;
}

export async function fetchDettePubliqueInsee(): Promise<{
  latest: { date: string; value: number };
  source: SourceInfo;
}> {
  // Série INSEE : dette au sens Maastricht, millions d'euros, trimestrielle.
  const serie = "001694019";
  const url = `${BASE}/${serie}`;
  const xml = await httpGet(url, { timeoutMs: 20_000, headers: { Accept: "application/xml" } });
  const latest = parseLatestObs(xml);
  if (!latest) throw new Error(`INSEE série ${serie} : aucune valeur trouvée`);
  return {
    latest: { date: latest.date, value: latest.value * 1_000_000 }, // M€ → €
    source: {
      id: "insee.dette",
      label: `INSEE — Dette publique (série ${serie})`,
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
  };
}
