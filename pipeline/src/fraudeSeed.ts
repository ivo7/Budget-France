// ============================================================================
// Fraude fiscale et sociale — évolution annuelle 1945 → 2025
// ============================================================================
//
// Attention : les estimations de fraude sont par nature INCERTAINES.
// Un chiffre précis, par définition, ne peut pas exister (si la fraude
// était mesurable, elle serait collectée). On agrège ici les ordres de
// grandeur issus des sources publiques suivantes :
//
//   - Cour des comptes : rapports 2019 (fraude fiscale), 2020 (fraude sociale),
//     rapport 2024 sur les comptes sociaux.
//   - Conseil des Prélèvements Obligatoires (CPO) : "Adapter l'impôt sur
//     les sociétés", 2020.
//   - Syndicat national Solidaires Finances publiques : estimations 80-100 Md€.
//   - INSEE "Économie non observée" (analyses rétrospectives).
//   - OFCE : travaux sur l'évolution de la fraude en longue période.
//
// Avant 1990, les estimations sont reconstituées a posteriori et très
// approximatives. Après 2000, les fourchettes se resserrent grâce aux
// méthodes d'audit aléatoire.
//
// Définitions :
//   - "Fraude fiscale" = manque à gagner d'impôts dû à la fraude (dissimulation)
//     + évasion (optimisation agressive hors des règles). Exclut l'optimisation
//     légale et les niches fiscales.
//   - "Fraude sociale" = fraudes aux prestations (RSA, chômage, pensions)
//     + travail non déclaré + fraudes aux cotisations sociales URSSAF.

import type { TimeseriesPoint } from "./types.ts";
import { anneeMin, anneeMax } from "./historicalSeed.ts";

type Landmarks = [number, number][];

/** Interpolation linéaire annuelle entre points de repère. */
function interpolate(landmarks: Landmarks, scale = 1e9): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = [];
  for (let year = anneeMin; year <= anneeMax; year++) {
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
    out.push({ date: `${year}-12-31`, value: value * scale });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Fraude fiscale — estimations en Md€ courants
// ----------------------------------------------------------------------------

const fraudeFiscaleLandmarks: Landmarks = [
  // Avant 1990, estimations rétrospectives (peu fiables)
  [1945, 0.8],
  [1960, 3],
  [1970, 6],
  [1980, 15],
  [1990, 30],

  // 2000+ : estimations Cour des comptes / CPO plus étayées
  [2000, 40],
  [2005, 50],
  [2010, 60],
  [2013, 65],      // publication études Solidaires / SFP
  [2015, 75],
  [2018, 80],
  [2020, 85],      // Cour des comptes : fourchette 80-100 Md€
  [2022, 90],
  [2023, 95],
  [2024, 100],
  [2025, 100],
];

// ----------------------------------------------------------------------------
// Fraude sociale — estimations en Md€ courants (toutes catégories confondues)
// ----------------------------------------------------------------------------

const fraudeSocialeLandmarks: Landmarks = [
  [1945, 0.05],
  [1960, 0.2],
  [1970, 0.5],
  [1980, 1.0],
  [1990, 2.0],
  [2000, 3.0],
  [2005, 4.5],
  [2010, 6.0],
  [2015, 8.0],
  [2018, 10.0],
  [2020, 11.0],
  [2022, 12.0],
  [2023, 13.0],    // Cour des comptes rapport annuel 2023
  [2024, 13.5],
  [2025, 14.0],
];

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

export const fraudeFiscalePoints: TimeseriesPoint[] = interpolate(fraudeFiscaleLandmarks);
export const fraudeSocialePoints: TimeseriesPoint[] = interpolate(fraudeSocialeLandmarks);

export const fraudeSourceLabel =
  "Cour des comptes, CPO, OFCE, Solidaires Finances publiques (synthèse)";
export const fraudeSourceUrl =
  "https://www.ccomptes.fr/fr/publications/la-fraude-aux-prelevements-obligatoires";
