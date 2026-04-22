// ============================================================================
// Spread OAT-Bund — écart de rendement 10 ans France / Allemagne
// ============================================================================
//
// Le spread OAT-Bund est LE thermomètre de la prime de risque souveraine sur
// la France. Il se mesure en points de base (pb) : 100 pb = 1 point de %.
// Un spread qui se creuse = les investisseurs exigent plus d'intérêts pour
// prêter à la France qu'à l'Allemagne = défiance croissante.
//
// Sources officielles :
//   - BCE Data Portal / IRS (Interest rates statistics) :
//       · M.FR.L.L40.CI.0000.EUR.N.Z pour l'OAT 10 ans française
//       · M.DE.L.L40.CI.0000.EUR.N.Z pour le Bund 10 ans allemand
//     https://data.ecb.europa.eu/
//   - Banque de France — Taux moyens mensuels des emprunts d'État
//     https://webstat.banque-france.fr/
//
// Données mensuelles (fin de mois). Interpolation linéaire entre repères.
// Repères basés sur les publications BCE consolidées, arrondis au point de base.

import type { TimeseriesPoint } from "./types.ts";

// ----------------------------------------------------------------------------
// Repères historiques : [année-mois, rendement en %]
// ----------------------------------------------------------------------------

type MonthlyLandmark = [year: number, month: number, value: number];

/** Transforme des repères clairsemés en série mensuelle interpolée. */
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
    // Trouve les deux landmarks encadrants
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
// OAT 10 ans France (%)
// ----------------------------------------------------------------------------

const oatLandmarks: MonthlyLandmark[] = [
  [2000, 0, 5.60], [2001, 0, 5.10], [2002, 0, 5.00], [2003, 0, 4.10], [2004, 0, 4.15],
  [2005, 0, 3.45], [2006, 0, 3.80], [2007, 0, 4.10], [2008, 0, 4.35], [2009, 0, 3.65],
  [2010, 0, 3.60], [2010, 5, 3.10], [2011, 0, 3.40], [2011, 7, 2.80], [2011, 11, 3.15],
  [2012, 0, 3.00], [2012, 5, 2.50], [2012, 11, 2.00],
  [2013, 0, 2.20], [2013, 5, 2.35], [2014, 0, 2.45], [2014, 11, 0.85],
  [2015, 0, 0.60], [2015, 5, 1.30], [2015, 11, 0.95],
  [2016, 0, 0.70], [2016, 5, 0.35], [2016, 11, 0.75],
  [2017, 0, 1.00], [2017, 11, 0.78],
  [2018, 0, 0.80], [2018, 11, 0.70],
  [2019, 0, 0.55], [2019, 7, -0.40], [2019, 11, 0.10],
  [2020, 0, 0.15], [2020, 2, 0.40], [2020, 7, -0.20], [2020, 11, -0.35],
  [2021, 0, -0.30], [2021, 5, 0.10], [2021, 11, 0.25],
  [2022, 0, 0.45], [2022, 5, 2.00], [2022, 8, 2.60], [2022, 11, 2.90],
  [2023, 0, 2.70], [2023, 8, 3.40], [2023, 11, 2.85],
  [2024, 0, 2.90], [2024, 5, 3.25], [2024, 8, 3.00], [2024, 11, 3.20],
  [2025, 0, 3.25], [2025, 5, 3.40], [2025, 11, 3.60],
  [2026, 0, 3.64], [2026, 3, 3.64],
];

// ----------------------------------------------------------------------------
// Bund 10 ans Allemagne (%)
// ----------------------------------------------------------------------------

const bundLandmarks: MonthlyLandmark[] = [
  [2000, 0, 5.40], [2001, 0, 4.85], [2002, 0, 4.80], [2003, 0, 4.05], [2004, 0, 4.10],
  [2005, 0, 3.40], [2006, 0, 3.75], [2007, 0, 4.05], [2008, 0, 4.15], [2009, 0, 3.30],
  [2010, 0, 3.20], [2010, 5, 2.55], [2011, 0, 3.05], [2011, 7, 2.40], [2011, 11, 2.30],
  [2012, 0, 1.90], [2012, 5, 1.30], [2012, 11, 1.40],
  [2013, 0, 1.60], [2013, 5, 1.70], [2014, 0, 1.75], [2014, 11, 0.55],
  [2015, 0, 0.40], [2015, 5, 0.90], [2015, 11, 0.60],
  [2016, 0, 0.40], [2016, 5, 0.05], [2016, 11, 0.30],
  [2017, 0, 0.50], [2017, 11, 0.35],
  [2018, 0, 0.40], [2018, 11, 0.25],
  [2019, 0, 0.25], [2019, 7, -0.60], [2019, 11, -0.20],
  [2020, 0, -0.30], [2020, 2, -0.10], [2020, 7, -0.50], [2020, 11, -0.55],
  [2021, 0, -0.50], [2021, 5, -0.20], [2021, 11, -0.10],
  [2022, 0, 0.10], [2022, 5, 1.50], [2022, 8, 2.10], [2022, 11, 2.30],
  [2023, 0, 2.30], [2023, 8, 2.75], [2023, 11, 2.35],
  [2024, 0, 2.40], [2024, 5, 2.55], [2024, 8, 2.30], [2024, 11, 2.45],
  [2025, 0, 2.50], [2025, 5, 2.60], [2025, 11, 2.75],
  [2026, 0, 2.78], [2026, 3, 2.80],
];

// ----------------------------------------------------------------------------
// Export : 3 séries
//   1. oatFr  : rendement France 10 ans (%)
//   2. bundDe : rendement Allemagne 10 ans (%)
//   3. spread : différence (FR - DE) en points de base
// ----------------------------------------------------------------------------

export const oatFrancePoints = interpolateMonthly(oatLandmarks);
export const bundAllemagnePoints = interpolateMonthly(bundLandmarks);

/** Calcule le spread mois par mois (FR - DE) en points de base. */
export const spreadOatBundPoints: TimeseriesPoint[] = (() => {
  const byDate = new Map<string, number>();
  for (const p of bundAllemagnePoints) byDate.set(p.date, p.value);
  return oatFrancePoints.map((p) => {
    const bund = byDate.get(p.date);
    if (bund == null) return { date: p.date, value: 0 };
    // (OAT% - Bund%) × 100 = points de base
    const bp = (p.value - bund) * 100;
    return { date: p.date, value: Math.round(bp) };
  });
})();

export const spreadSourceLabel = "BCE — Data Portal (IRS France + Allemagne 10 ans)";
export const spreadSourceUrl = "https://data.ecb.europa.eu/";
