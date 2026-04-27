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
// Fraude DÉTECTÉE — montants effectivement redressés par l'administration
// ----------------------------------------------------------------------------
//
// Source primaire : ministère de l'Économie / DGFiP (Bilan annuel du contrôle
// fiscal, série 2008+) et données URSSAF / CNAF / CNAM / Pôle emploi pour
// la fraude sociale. Ces chiffres sont les "droits et pénalités notifiés"
// suite aux contrôles — c'est-à-dire la fraude que l'administration a
// effectivement détectée et tente de recouvrer.
//
// /!\ NE PAS CONFONDRE avec la fraude estimée (gap fiscal théorique) :
//   - Fraude détectée 2024 (DGFiP) : 17,1 Md€ fiscale + 3 Md€ sociale = ~20 Md€
//   - Fraude estimée 2024 (Cour des comptes) : ~95-100 Md€ fiscale
//   La différence ≈ ce que l'administration ne voit pas (économie souterraine,
//   schémas d'évasion sophistiqués, optimisation hors-règles).
//
// Avant 2008, les chiffres détectés ne sont pas systématiquement publiés
// avec la même méthode → on les laisse vides pour éviter d'induire en erreur.

const fraudeFiscaleDetecteeLandmarks: Landmarks = [
  // Source : DGFiP, Bilans annuels du contrôle fiscal (2008-2024)
  [2008, 13.5],
  [2010, 14.5],
  [2012, 18.0],   // pic juste avant la crise + opération suisse
  [2014, 19.3],
  [2016, 17.9],
  [2018, 16.2],
  [2020, 10.2],   // creux Covid : moins de contrôles
  [2022, 14.6],
  [2023, 15.2],
  [2024, 17.1],   // dernier chiffre publié, ministère de l'Économie
  [2025, 17.5],   // estimation prolongée
];

const fraudeSocialeDetecteeLandmarks: Landmarks = [
  // Source : URSSAF / CNAF / CNAM / Pôle emploi, agrégat
  [2008, 0.4],
  [2010, 0.5],
  [2012, 0.7],
  [2014, 0.9],
  [2016, 1.2],
  [2018, 1.5],
  [2020, 1.8],
  [2022, 2.4],
  [2023, 2.8],
  [2024, 3.0],    // chiffre ministère de l'Économie
  [2025, 3.1],    // estimation prolongée
];

/** Variante d'interpolate qui ne renvoie que les années >= startYear.
 *  Utile pour ne pas inventer de données détectées avant 2008. */
function interpolateFromYear(
  landmarks: Landmarks,
  startYear: number,
  scale = 1e9,
): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = [];
  for (let year = Math.max(startYear, anneeMin); year <= anneeMax; year++) {
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
// Export
// ----------------------------------------------------------------------------

export const fraudeFiscalePoints: TimeseriesPoint[] = interpolate(fraudeFiscaleLandmarks);
export const fraudeSocialePoints: TimeseriesPoint[] = interpolate(fraudeSocialeLandmarks);

export const fraudeFiscaleDetecteePoints: TimeseriesPoint[] =
  interpolateFromYear(fraudeFiscaleDetecteeLandmarks, 2008);
export const fraudeSocialeDetecteePoints: TimeseriesPoint[] =
  interpolateFromYear(fraudeSocialeDetecteeLandmarks, 2008);

export const fraudeSourceLabel =
  "Cour des comptes, CPO, OFCE, Solidaires Finances publiques (synthèse)";
export const fraudeSourceUrl =
  "https://www.ccomptes.fr/fr/publications/la-fraude-aux-prelevements-obligatoires";

export const fraudeSourceDetecteeLabel =
  "Ministère de l'Économie — Bilans DGFiP / URSSAF / CNAF / CNAM (montants notifiés)";
export const fraudeSourceDetecteeUrl =
  "https://www.economie.gouv.fr/dgfip/controle-fiscal-bilan-annuel";
