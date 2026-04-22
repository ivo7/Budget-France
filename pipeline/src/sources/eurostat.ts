// Source Eurostat — SDMX-JSON.
// Dette publique FR (gov_10q_ggdebt) et PIB (nama_10_gdp).
// Docs : https://wikis.ec.europa.eu/display/EUROSTATHELP/API+-+SDMX+2.1+-+data+query

import { httpGetJson } from "../http.ts";
import type { SourceInfo, TimeseriesPoint } from "../types.ts";

const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

interface SdmxJson {
  value: Record<string, number>;
  dimension: {
    time: {
      category: {
        index: Record<string, number>;
      };
    };
  };
}

function extractLatest(doc: SdmxJson): { date: string; value: number } | null {
  const times = Object.entries(doc.dimension?.time?.category?.index ?? {});
  if (times.length === 0) return null;
  // Tri ascendant par index, on prend le dernier point non nul.
  times.sort((a, b) => a[1] - b[1]);
  for (let i = times.length - 1; i >= 0; i--) {
    const entry = times[i];
    if (!entry) continue;
    const [date, idx] = entry;
    const v = doc.value[String(idx)];
    if (typeof v === "number" && Number.isFinite(v)) {
      return { date, value: v };
    }
  }
  return null;
}

function extractSeries(doc: SdmxJson): TimeseriesPoint[] {
  const times = Object.entries(doc.dimension?.time?.category?.index ?? {});
  times.sort((a, b) => a[1] - b[1]);
  const out: TimeseriesPoint[] = [];
  for (const entry of times) {
    const [date, idx] = entry;
    const v = doc.value[String(idx)];
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push({ date: normalizeDate(date), value: v });
    }
  }
  return out;
}

function normalizeDate(d: string): string {
  // "2024-Q1" → "2024-03-31", "2024" → "2024-12-31"
  if (/^\d{4}$/.test(d)) return `${d}-12-31`;
  const q = d.match(/^(\d{4})-Q([1-4])$/);
  if (q) {
    const y = q[1]!;
    const quarter = Number(q[2]);
    const month = quarter * 3;
    const lastDay = new Date(Date.UTC(Number(y), month, 0)).getUTCDate();
    return `${y}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  return d;
}

export async function fetchDettePublique(): Promise<{
  latest: { date: string; value: number };
  series: TimeseriesPoint[];
  source: SourceInfo;
}> {
  const url = `${BASE}/gov_10q_ggdebt?format=JSON&geo=FR&sector=S13&na_item=GD&unit=MIO_EUR`;
  const doc = await httpGetJson<SdmxJson>(url, { timeoutMs: 20_000 });
  const latest = extractLatest(doc);
  if (!latest) throw new Error("Eurostat gov_10q_ggdebt : aucune valeur exploitable");
  return {
    latest: { date: normalizeDate(latest.date), value: latest.value * 1_000_000 }, // MIO_EUR → EUR, date ISO
    series: extractSeries(doc).map((p) => ({ date: p.date, value: p.value * 1_000_000 })),
    source: {
      id: "eurostat.dette",
      label: "Eurostat — Dette publique (gov_10q_ggdebt)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
  };
}

export async function fetchPib(): Promise<{
  latest: { date: string; value: number };
  source: SourceInfo;
}> {
  const url = `${BASE}/nama_10_gdp?format=JSON&geo=FR&na_item=B1GQ&unit=CP_MEUR`;
  const doc = await httpGetJson<SdmxJson>(url, { timeoutMs: 20_000 });
  const latest = extractLatest(doc);
  if (!latest) throw new Error("Eurostat nama_10_gdp : aucune valeur exploitable");
  return {
    latest: { date: normalizeDate(latest.date), value: latest.value * 1_000_000 },
    source: {
      id: "eurostat.pib",
      label: "Eurostat — PIB France (nama_10_gdp)",
      url,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
  };
}
