// Composition historique des recettes et des dépenses de l'État — 1945 → 2025.
// Pour chaque catégorie, on fournit des "landmarks" (année, valeur en Md€) basés
// sur les ordres de grandeur publics connus (INSEE, DGFiP, Conseil des prélèvements
// obligatoires, études OFCE). Les années intermédiaires sont interpolées linéairement.
//
// Objectif : permettre une visualisation 100 % empilée qui montre l'évolution de
// la part de chaque recette / dépense dans le total au cours des 80 dernières années.

import type { TimeseriesPoint } from "./types.ts";
import { anneeMin, anneeMax } from "./historicalSeed.ts";

type Landmarks = [number, number][];

/** Interpolation linéaire entre landmarks, renvoie un point par année. */
function interpolate(landmarks: Landmarks): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = [];
  for (let year = anneeMin; year <= anneeMax; year++) {
    let value: number;
    const first = landmarks[0]!;
    const last = landmarks[landmarks.length - 1]!;
    if (year <= first[0]) {
      value = first[1];
    } else if (year >= last[0]) {
      value = last[1];
    } else {
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
    out.push({ date: `${year}-12-31`, value: value * 1e9 }); // Md€ → €
  }
  return out;
}

// ----------------------------------------------------------------------
// RECETTES — landmarks en Md€ courants (budget général de l'État)
// ----------------------------------------------------------------------

// TVA : créée en 1954, généralisée en 1968. Les valeurs représentent
// la "part État" (après transferts Sécu + Régions, qui ont augmenté depuis 2010).
const tvaLandmarks: Landmarks = [
  [1945, 0], [1953, 0], [1954, 0.2], [1960, 2], [1968, 10], [1970, 13],
  [1980, 45], [1990, 90], [2000, 120], [2010, 135], [2015, 150], [2020, 160],
  [2023, 110], [2025, 103],
];

const irLandmarks: Landmarks = [
  [1945, 0.5], [1960, 1.5], [1970, 4], [1980, 18], [1990, 42],
  [2000, 48], [2010, 50], [2020, 75], [2025, 95],
];

const isLandmarks: Landmarks = [
  [1945, 0.2], [1960, 1], [1970, 3], [1980, 10], [1990, 22],
  [2000, 40], [2010, 42], [2020, 55], [2025, 70],
];

const ticpeLandmarks: Landmarks = [
  [1945, 0.2], [1960, 1], [1970, 3], [1980, 8], [1990, 15],
  [2000, 22], [2010, 25], [2020, 18], [2025, 18],
];

// "Autres" recettes : enveloppe résiduelle (autres impôts, non fiscales,
// fonds de concours, transferts). On fournit des landmarks réalistes ;
// le chart 100 % empilé ajustera automatiquement les parts.
const autresRecLandmarks: Landmarks = [
  [1945, 1.6], [1960, 3.5], [1970, 5], [1980, 19], [1990, 46],
  [2000, 35], [2010, 28], [2020, 27], [2025, 119],
];

// ----------------------------------------------------------------------
// DÉPENSES — landmarks en Md€ courants (missions principales)
// ----------------------------------------------------------------------

// Défense : guerre d'Indochine puis d'Algérie dans les 50s, puis dissuasion,
// puis contraction post-guerre froide, puis réarmement récent.
const defenseLandmarks: Landmarks = [
  [1945, 2], [1950, 3], [1955, 3.5], [1960, 2.8], [1965, 3.5], [1970, 6],
  [1980, 18], [1990, 30], [2000, 30], [2010, 40], [2015, 42], [2020, 48],
  [2023, 45], [2025, 53],
];

// Enseignement scolaire (éducation nationale — hors supérieur)
const educationLandmarks: Landmarks = [
  [1945, 0.5], [1960, 1.5], [1970, 5], [1980, 22], [1990, 45],
  [2000, 55], [2010, 70], [2020, 75], [2025, 83],
];

// Charge de la dette (intérêts sur OAT + BTF) : négligeable jusqu'en 1980,
// explose dans les 90s, puis baisse avec les taux bas, remonte depuis 2022.
const chargeDetteLandmarks: Landmarks = [
  [1945, 0.3], [1960, 0.3], [1970, 0.5], [1980, 3], [1985, 10],
  [1990, 17], [1995, 35], [2000, 38], [2005, 40], [2010, 42],
  [2015, 42], [2018, 40], [2020, 33], [2022, 42], [2023, 55], [2025, 62],
];

// Solidarité & insertion : RSA/RMI (créé 1988), prime d'activité (2016), AAH.
// Très faible historiquement.
const solidariteLandmarks: Landmarks = [
  [1945, 0.05], [1970, 0.1], [1980, 2], [1988, 4], [1990, 5],
  [2000, 10], [2010, 15], [2016, 20], [2020, 27], [2025, 32],
];

// Recherche & enseignement supérieur (universités, CNRS, CEA…)
const rechercheLandmarks: Landmarks = [
  [1945, 0.1], [1960, 0.5], [1970, 2], [1980, 6], [1990, 12],
  [2000, 18], [2010, 23], [2020, 28], [2025, 32],
];

// "Autres missions" : enveloppe résiduelle (justice, sécurité, infrastructure,
// culture, écologie, cohésion territoires, remboursements et dégrèvements…).
const autresDepLandmarks: Landmarks = [
  [1945, 2.05], [1960, 4.7], [1970, 14.4], [1980, 59], [1990, 125],
  [2000, 137], [2010, 221], [2020, 399], [2025, 318],
];

// ----------------------------------------------------------------------
// Export structuré
// ----------------------------------------------------------------------

export const recettesComposition = [
  { id: "tva",        label: "TVA (part État)",       color: "#0055A4", points: interpolate(tvaLandmarks) },
  { id: "ir",         label: "Impôt sur le revenu",   color: "#2775c7", points: interpolate(irLandmarks) },
  { id: "is",         label: "Impôt sur les sociétés",color: "#60a5fa", points: interpolate(isLandmarks) },
  { id: "ticpe",      label: "Taxe carburants (TICPE)", color: "#7c3aed", points: interpolate(ticpeLandmarks) },
  { id: "autres",     label: "Autres (non fiscales, divers)", color: "#94a3b8", points: interpolate(autresRecLandmarks) },
];

export const depensesComposition = [
  { id: "defense",    label: "Défense",                   color: "#0f172a", points: interpolate(defenseLandmarks) },
  { id: "education",  label: "Enseignement scolaire",     color: "#0055A4", points: interpolate(educationLandmarks) },
  { id: "dette",      label: "Charge de la dette",        color: "#EF4135", points: interpolate(chargeDetteLandmarks) },
  { id: "solidarite", label: "Solidarité & insertion",    color: "#d97706", points: interpolate(solidariteLandmarks) },
  { id: "recherche",  label: "Recherche & ens. sup.",     color: "#16a34a", points: interpolate(rechercheLandmarks) },
  { id: "autres",     label: "Autres missions & remboursements", color: "#94a3b8", points: interpolate(autresDepLandmarks) },
];
