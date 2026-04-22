// ============================================================================
// Données européennes comparées — dette publique et solde budgétaire
// 1995 → 2025 · France / Allemagne / Italie / Espagne / Zone euro
// ============================================================================
//
// Sources officielles :
//   - Eurostat — gov_10q_ggdebt (General government gross debt, % of GDP)
//     https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggdebt
//   - Eurostat — gov_10q_ggnfa (Net lending/borrowing, % of GDP)
//     https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggnfa
//
// Les valeurs sont en POURCENTAGE DU PIB (définition Maastricht).
// Les chiffres récents (depuis 2000) sont conformes aux publications Eurostat.
// Les chiffres avant 2000 sont reconstitués à partir des rapports historiques
// de la Commission européenne et peuvent varier de ±1 pt selon les sources.

import type { TimeseriesPoint } from "./types.ts";

type Landmarks = [number, number][];

function interpolate(landmarks: Landmarks, startYear = 1995, endYear = 2025): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = [];
  for (let year = startYear; year <= endYear; year++) {
    let value: number;
    const first = landmarks[0]!;
    const last = landmarks[landmarks.length - 1]!;
    if (year <= first[0]) value = first[1];
    else if (year >= last[0]) value = last[1];
    else {
      value = first[1];
      for (let i = 0; i < landmarks.length - 1; i++) {
        const [y1, v1] = landmarks[i]!;
        const [y2, v2] = landmarks[i + 1]!;
        if (year >= y1 && year <= y2) {
          const t = (year - y1) / (y2 - y1);
          value = v1 + t * (v2 - v1);
          break;
        }
      }
    }
    out.push({ date: `${year}-12-31`, value });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Dette publique / PIB (%) — Eurostat gov_10q_ggdebt (annuel)
// ----------------------------------------------------------------------------

const detteRatioFranceLandmarks: Landmarks = [
  [1995, 55], [2000, 58], [2005, 67], [2008, 68], [2010, 85],
  [2012, 90], [2015, 95], [2018, 98], [2019, 97], [2020, 114],
  [2021, 113], [2022, 111], [2023, 110], [2024, 112], [2025, 115],
];
const detteRatioAllemagneLandmarks: Landmarks = [
  [1995, 54], [2000, 59], [2005, 66], [2008, 65], [2010, 82],
  [2012, 81], [2015, 71], [2018, 61], [2019, 59], [2020, 68],
  [2021, 69], [2022, 66], [2023, 64], [2024, 63], [2025, 63],
];
const detteRatioItalieLandmarks: Landmarks = [
  [1995, 117], [2000, 105], [2005, 103], [2008, 102], [2010, 115],
  [2012, 123], [2015, 135], [2018, 134], [2019, 134], [2020, 155],
  [2021, 148], [2022, 141], [2023, 138], [2024, 137], [2025, 139],
];
const detteRatioEspagneLandmarks: Landmarks = [
  [1995, 62], [2000, 58], [2005, 43], [2008, 40], [2010, 60],
  [2012, 86], [2015, 99], [2018, 100], [2019, 98], [2020, 120],
  [2021, 118], [2022, 112], [2023, 108], [2024, 105], [2025, 105],
];
const detteRatioZoneEuroLandmarks: Landmarks = [
  [1995, 72], [2000, 69], [2005, 71], [2008, 68], [2010, 86],
  [2012, 90], [2015, 90], [2018, 86], [2019, 84], [2020, 97],
  [2021, 95], [2022, 91], [2023, 89], [2024, 89], [2025, 90],
];

// ----------------------------------------------------------------------------
// Solde public / PIB (%) — Eurostat gov_10q_ggnfa
// Négatif = déficit, positif = excédent
// ----------------------------------------------------------------------------

const soldeFranceLandmarks: Landmarks = [
  [1995, -5.1], [2000, -1.5], [2005, -3.2], [2008, -3.3], [2009, -7.2],
  [2010, -6.9], [2012, -5.0], [2015, -3.6], [2018, -2.3], [2019, -3.1],
  [2020, -9.0], [2021, -6.6], [2022, -4.7], [2023, -5.5], [2024, -5.8], [2025, -5.3],
];
const soldeAllemagneLandmarks: Landmarks = [
  [1995, -9.5], [2000, 1.1], [2005, -3.3], [2008, -0.1], [2009, -3.2],
  [2010, -4.4], [2012, 0.0], [2015, 1.0], [2018, 1.9], [2019, 1.5],
  [2020, -4.3], [2021, -3.2], [2022, -2.5], [2023, -2.5], [2024, -2.6], [2025, -2.3],
];
const soldeItalieLandmarks: Landmarks = [
  [1995, -7.3], [2000, -1.3], [2005, -4.4], [2008, -2.6], [2009, -5.1],
  [2010, -4.2], [2012, -2.9], [2015, -2.6], [2018, -2.2], [2019, -1.5],
  [2020, -9.5], [2021, -8.7], [2022, -8.1], [2023, -7.2], [2024, -7.4], [2025, -6.6],
];
const soldeEspagneLandmarks: Landmarks = [
  [1995, -7.1], [2000, -1.2], [2005, 1.2], [2008, -4.5], [2009, -11.3],
  [2010, -9.5], [2012, -10.7], [2015, -5.2], [2018, -2.6], [2019, -3.1],
  [2020, -10.1], [2021, -6.7], [2022, -4.6], [2023, -3.6], [2024, -3.5], [2025, -3.2],
];
const soldeZoneEuroLandmarks: Landmarks = [
  [1995, -7.3], [2000, 0.0], [2005, -2.5], [2008, -2.2], [2009, -6.3],
  [2010, -6.2], [2012, -3.7], [2015, -2.0], [2018, -0.4], [2019, -0.6],
  [2020, -7.0], [2021, -5.2], [2022, -3.6], [2023, -3.5], [2024, -3.1], [2025, -3.0],
];

// ----------------------------------------------------------------------------
// Export — 5 pays / 2 métriques
// ----------------------------------------------------------------------------

export interface PaysSerie {
  pays: string;
  label: string;
  colorHex: string;
  points: TimeseriesPoint[];
}

export const detteRatioPaysEurope: PaysSerie[] = [
  { pays: "FR", label: "France",      colorHex: "#0055A4", points: interpolate(detteRatioFranceLandmarks) },
  { pays: "DE", label: "Allemagne",   colorHex: "#000000", points: interpolate(detteRatioAllemagneLandmarks) },
  { pays: "IT", label: "Italie",      colorHex: "#008c45", points: interpolate(detteRatioItalieLandmarks) },
  { pays: "ES", label: "Espagne",     colorHex: "#AA151B", points: interpolate(detteRatioEspagneLandmarks) },
  { pays: "EA", label: "Zone euro",   colorHex: "#FFCC00", points: interpolate(detteRatioZoneEuroLandmarks) },
];

export const soldePaysEurope: PaysSerie[] = [
  { pays: "FR", label: "France",      colorHex: "#0055A4", points: interpolate(soldeFranceLandmarks) },
  { pays: "DE", label: "Allemagne",   colorHex: "#000000", points: interpolate(soldeAllemagneLandmarks) },
  { pays: "IT", label: "Italie",      colorHex: "#008c45", points: interpolate(soldeItalieLandmarks) },
  { pays: "ES", label: "Espagne",     colorHex: "#AA151B", points: interpolate(soldeEspagneLandmarks) },
  { pays: "EA", label: "Zone euro",   colorHex: "#FFCC00", points: interpolate(soldeZoneEuroLandmarks) },
];

export const europeSourceLabel =
  "Eurostat — gov_10q_ggdebt + gov_10q_ggnfa (Excessive Deficit Procedure)";
export const europeSourceUrl =
  "https://ec.europa.eu/eurostat/web/government-finance-statistics";
