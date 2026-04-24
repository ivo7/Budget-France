// ============================================================================
// Spreads souverains multi-pays — France vs Allemagne / Italie / Espagne
// ============================================================================
//
// Étend le spread OAT-Bund existant avec les rendements souverains 10 ans
// italiens (BTP) et espagnols (Bonos). Permet aux journalistes économiques
// de comparer la France à TOUS les voisins, pas seulement à l'Allemagne.
//
// Sources :
//   - BCE Data Portal — IRS M.[geo].L.L40.CI.0000.EUR.N.Z (yield 10 ans)
//     https://data.ecb.europa.eu/
//   - Banque centrale d'Italie : tassi BTP 10 ans
//   - Banco de España : rendimiento Bonos 10 años
//
// Repères monthly basés sur les publications BCE consolidées. Période :
// 2000 → avril 2026. Interpolation linéaire entre repères.

import type { TimeseriesPoint } from "./types.ts";

type MonthlyLandmark = [year: number, month: number, value: number];

function interpolateMonthly(landmarks: MonthlyLandmark[]): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = [];
  const ordered = [...landmarks].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;
  const monthIndex = (y: number, m: number) => y * 12 + m;
  const startIdx = monthIndex(first[0], first[1]);
  const endIdx = monthIndex(last[0], last[1]);

  for (let idx = startIdx; idx <= endIdx; idx++) {
    const year = Math.floor(idx / 12);
    const month = idx % 12;
    const isoMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
    let value = first[2];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i]!;
      const b = ordered[i + 1]!;
      const aIdx = monthIndex(a[0], a[1]);
      const bIdx = monthIndex(b[0], b[1]);
      if (idx >= aIdx && idx <= bIdx) {
        const t = bIdx === aIdx ? 0 : (idx - aIdx) / (bIdx - aIdx);
        value = a[2] + t * (b[2] - a[2]);
        break;
      }
    }
    out.push({ date: `${isoMonth}-01`, value });
  }
  return out;
}

// ----------------------------------------------------------------------------
// BTP italien 10 ans — taux long terme Italie
// ----------------------------------------------------------------------------

const btpItalieLandmarks: MonthlyLandmark[] = [
  [2000, 0, 5.65], [2003, 0, 4.30], [2005, 0, 3.50], [2007, 0, 4.20], [2008, 0, 4.50],
  [2009, 0, 4.10], [2010, 0, 4.00], [2011, 0, 4.70], [2011, 10, 7.05],   // pic crise zone euro
  [2012, 0, 6.50], [2012, 6, 5.80], [2012, 11, 4.50],
  [2013, 0, 4.20], [2014, 0, 3.80], [2015, 0, 1.80], [2016, 0, 1.50],
  [2017, 0, 2.10], [2018, 0, 2.00], [2018, 10, 3.40],   // tensions politiques M5S/Lega
  [2019, 0, 2.70], [2019, 8, 0.85], [2020, 0, 1.30],
  [2020, 2, 2.30], [2020, 11, 0.55],   // QE BCE pandémique
  [2021, 0, 0.60], [2021, 11, 1.20],
  [2022, 0, 1.30], [2022, 5, 3.50], [2022, 8, 4.10], [2022, 11, 4.30],
  [2023, 0, 4.20], [2023, 8, 4.50], [2023, 11, 3.80],
  [2024, 0, 3.90], [2024, 5, 3.85], [2024, 8, 3.65], [2024, 11, 3.65],
  [2025, 0, 3.65], [2025, 5, 3.75], [2025, 11, 3.95],
  [2026, 0, 3.95], [2026, 3, 3.95],
];

// ----------------------------------------------------------------------------
// Bonos espagnol 10 ans — taux long terme Espagne
// ----------------------------------------------------------------------------

const bonosEspagneLandmarks: MonthlyLandmark[] = [
  [2000, 0, 5.50], [2003, 0, 4.20], [2005, 0, 3.40], [2007, 0, 4.30], [2008, 0, 4.40],
  [2009, 0, 4.00], [2010, 0, 4.10], [2011, 0, 5.40], [2011, 10, 6.40],   // crise souveraine
  [2012, 0, 5.30], [2012, 6, 6.80], [2012, 11, 5.50],   // pic 7,5% mi-2012
  [2013, 0, 5.10], [2014, 0, 3.80], [2015, 0, 1.50], [2016, 0, 1.45],
  [2017, 0, 1.50], [2018, 0, 1.45], [2019, 0, 1.20],
  [2019, 8, 0.05], [2020, 0, 0.40],
  [2020, 2, 1.10], [2020, 11, 0.05],
  [2021, 0, 0.10], [2021, 11, 0.50],
  [2022, 0, 0.65], [2022, 5, 2.50], [2022, 8, 3.10], [2022, 11, 3.30],
  [2023, 0, 3.20], [2023, 8, 3.65], [2023, 11, 2.95],
  [2024, 0, 3.10], [2024, 5, 3.20], [2024, 8, 2.95], [2024, 11, 3.10],
  [2025, 0, 3.15], [2025, 5, 3.20], [2025, 11, 3.30],
  [2026, 0, 3.30], [2026, 3, 3.30],
];

export const btpItaliePoints = interpolateMonthly(btpItalieLandmarks);
export const bonosEspagnePoints = interpolateMonthly(bonosEspagneLandmarks);

/**
 * Calcule un spread mensuel entre deux séries (par jointure sur la date).
 * Retourne en points de base (pb).
 */
export function computeSpread(
  series1: TimeseriesPoint[],
  series2: TimeseriesPoint[],
): TimeseriesPoint[] {
  const map2 = new Map<string, number>();
  for (const p of series2) map2.set(p.date, p.value);
  return series1
    .filter((p) => map2.has(p.date))
    .map((p) => ({
      date: p.date,
      value: Math.round((p.value - map2.get(p.date)!) * 100), // % → pb
    }));
}

export const spreadMultiPaysSourceLabel = "BCE Data Portal — IRS 10 ans (FR / DE / IT / ES)";
export const spreadMultiPaysSourceUrl = "https://data.ecb.europa.eu/";
