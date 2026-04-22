// Source BCE (ECB) — API SDW pour les taux.
// Pour la MVP : on récupère un taux de référence disponible publiquement en CSV.
// Série : rendement des obligations souveraines FR 10 ans (IRS.M.FR.L.L40.CI.0000.EUR.N.Z)
// En cas d'échec, l'agrégateur retombe sur Banque de France / seed.

import { httpGet } from "../http.ts";
import type { SourceInfo, TimeseriesPoint } from "../types.ts";

const BASE = "https://data-api.ecb.europa.eu/service/data";

/**
 * Récupère le dernier rendement OAT 10 ans et une série historique mensuelle.
 * Format CSV (plus simple que SDMX-JSON pour ce cas).
 */
export async function fetchOat10ans(): Promise<{
  latest: { date: string; value: number };
  series: TimeseriesPoint[];
  source: SourceInfo;
}> {
  const url = `${BASE}/IRS/M.FR.L.L40.CI.0000.EUR.N.Z?format=csvdata&startPeriod=2015-01`;
  const csv = await httpGet(url, { timeoutMs: 20_000, headers: { Accept: "text/csv" } });
  const rows = csv.trim().split(/\r?\n/).slice(1); // drop header
  if (rows.length === 0) throw new Error("ECB IRS : CSV vide");

  // Colonnes attendues : ..., TIME_PERIOD, OBS_VALUE, ...
  // On détecte les colonnes via le header.
  const header = csv.split(/\r?\n/)[0];
  if (!header) throw new Error("ECB IRS : pas de header");
  const headers = header.split(",");
  const timeIdx = headers.findIndex((h) => h === "TIME_PERIOD");
  const valIdx = headers.findIndex((h) => h === "OBS_VALUE");
  if (timeIdx < 0 || valIdx < 0) throw new Error("ECB IRS : colonnes manquantes");

  const series: TimeseriesPoint[] = [];
  for (const row of rows) {
    const cells = row.split(",");
    const time = cells[timeIdx];
    const vStr = cells[valIdx];
    if (!time || vStr == null) continue;
    const v = Number(vStr);
    if (!Number.isFinite(v)) continue;
    series.push({ date: `${time}-01`, value: v });
  }
  if (series.length === 0) throw new Error("ECB IRS : aucun point exploitable");
  series.sort((a, b) => a.date.localeCompare(b.date));
  const last = series[series.length - 1]!;

  return {
    latest: { date: last.date, value: last.value },
    series,
    source: {
      id: "ecb.oat10",
      label: "BCE — Rendement OAT 10 ans (IRS M.FR.L.L40)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
  };
}

export async function fetchTauxDirecteur(): Promise<{
  latest: { date: string; value: number };
  source: SourceInfo;
}> {
  // MRO (Main Refinancing Operations rate) — taux directeur BCE
  const url = `${BASE}/FM/D.U2.EUR.4F.KR.MRR_FR.LEV?format=csvdata&lastNObservations=1`;
  const csv = await httpGet(url, { timeoutMs: 15_000, headers: { Accept: "text/csv" } });
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("ECB MRO : CSV vide");
  const header = lines[0]!.split(",");
  const timeIdx = header.findIndex((h) => h === "TIME_PERIOD");
  const valIdx = header.findIndex((h) => h === "OBS_VALUE");
  if (timeIdx < 0 || valIdx < 0) throw new Error("ECB MRO : colonnes manquantes");
  const cells = lines[lines.length - 1]!.split(",");
  const date = cells[timeIdx];
  const vStr = cells[valIdx];
  if (!date || vStr == null) throw new Error("ECB MRO : ligne vide");
  const v = Number(vStr);
  if (!Number.isFinite(v)) throw new Error("ECB MRO : valeur non numérique");

  return {
    latest: { date, value: v },
    source: {
      id: "ecb.mro",
      label: "BCE — Taux directeur (MRO)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
  };
}
