// ============================================================================
// Historique des dépenses Sécu + Collectivités (1945 → 2025)
// ============================================================================
//
// Sources :
//   - Sécu : LFSS annuelles, comptes de la Sécu historiques (Santé publique France,
//     Cour des comptes). Avant 1945 : ordonnances fondatrices du 4 et 19 octobre 1945.
//   - Collectivités : comptes des APUL (INSEE), DGCL annuaire statistique.
//     Décentralisation Defferre en 1982 → accélération.
//
// Valeurs en Md€ courants. Interpolation linéaire entre landmarks annuels.

import type { TimeseriesPoint } from "./types.ts";
import { anneeMin, anneeMax } from "./historicalSeed.ts";

type Landmarks = [number, number][];

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
// Sécurité sociale — dépenses totales (toutes branches + UNEDIC)
// ----------------------------------------------------------------------------

const secuDepLandmarks: Landmarks = [
  [1945, 2],     // création de la Sécu (ordonnances)
  [1950, 5],
  [1960, 15],    // montée en puissance
  [1970, 35],
  [1975, 70],    // création du Smic, généralisation
  [1980, 130],
  [1985, 200],
  [1990, 280],
  [1995, 320],
  [2000, 400],
  [2005, 480],
  [2010, 570],
  [2015, 640],
  [2019, 710],
  [2020, 775],   // COVID : +65 Md€ de dépenses exceptionnelles
  [2021, 760],
  [2022, 720],
  [2023, 735],
  [2024, 750],
  [2025, 755],
];

// Recettes Sécu — typiquement 95-100% des dépenses (équilibre visé)
const secuRecLandmarks: Landmarks = [
  [1945, 2],
  [1960, 15],
  [1970, 34],
  [1980, 125],
  [1990, 275],
  [2000, 395],
  [2010, 560],
  [2019, 710],
  [2020, 755],   // déficit COVID
  [2022, 725],
  [2024, 745],
  [2025, 750],
];

// ----------------------------------------------------------------------------
// Collectivités territoriales — dépenses totales APUL
// ----------------------------------------------------------------------------

const collecDepLandmarks: Landmarks = [
  [1945, 2],
  [1950, 4],
  [1960, 7],
  [1970, 14],
  [1980, 55],     // explosion post-choc pétrolier
  [1982, 70],     // lois Defferre
  [1985, 90],
  [1990, 125],
  [1995, 150],
  [2000, 165],
  [2005, 195],
  [2010, 220],
  [2015, 240],
  [2019, 255],
  [2020, 260],
  [2023, 275],
  [2025, 280],
];

const collecRecLandmarks: Landmarks = [
  [1945, 2],
  [1960, 7],
  [1980, 55],
  [1990, 125],
  [2000, 165],
  [2010, 220],
  [2020, 258],
  [2025, 282],
];

export const secuDepensesHistoriquePoints = interpolate(secuDepLandmarks);
export const secuRecettesHistoriquePoints = interpolate(secuRecLandmarks);
export const collecDepensesHistoriquePoints = interpolate(collecDepLandmarks);
export const collecRecettesHistoriquePoints = interpolate(collecRecLandmarks);

export const secuCollecHistSource = {
  id: "secu-collec-hist.seed",
  label: "LFSS + Comptes Sécu historiques + INSEE APUL + DGCL annuaire",
  url: "https://www.insee.fr/fr/statistiques/5421158",
};

// ============================================================================
// DÉTAIL PAR MISSION / MINISTÈRE — dépenses annuelles 1945-2025
// ============================================================================
//
// Pour chaque grande mission du budget de l'État, séries longues.
// Exemple : Défense — dépense des différents ministères de la Guerre,
// Armées, etc. Ordres de grandeur historiques — nominalement en Md€
// courants (franc converti avant 1999).

export interface MissionHistorique {
  id: string;
  label: string;
  colorHex: string;
  description: string;          // ce que couvre cette mission
  points: TimeseriesPoint[];
}

const missionDefenseLandmarks: Landmarks = [
  [1945, 2.0],
  [1950, 3.0],     // guerre d'Indochine
  [1954, 3.8],
  [1960, 2.8],     // algérie + dissuasion nucléaire
  [1965, 3.5],
  [1970, 6],
  [1980, 18],
  [1990, 30],
  [1995, 32],      // pic post-Guerre froide
  [2000, 30],      // baisse années 90
  [2010, 40],
  [2015, 42],
  [2019, 44],
  [2020, 48],
  [2023, 45],
  [2024, 47],
  [2025, 53],      // loi de programmation 2024-2030
];

const missionEducationLandmarks: Landmarks = [
  [1945, 0.5],
  [1960, 1.5],
  [1970, 5],
  [1980, 22],
  [1990, 45],
  [2000, 55],
  [2010, 70],
  [2020, 75],
  [2025, 83],
];

const missionDetteLandmarks: Landmarks = [
  [1945, 0.3],
  [1970, 0.5],
  [1980, 3],
  [1985, 10],
  [1990, 17],
  [1995, 35],      // pic des années 90
  [2000, 38],
  [2005, 40],
  [2010, 42],
  [2015, 42],
  [2018, 40],
  [2020, 33],      // taux bas QE
  [2022, 42],
  [2023, 55],      // remontée post-Ukraine
  [2024, 58],
  [2025, 62],
];

const missionRechercheLandmarks: Landmarks = [
  [1945, 0.1],
  [1960, 0.5],
  [1970, 2],
  [1980, 6],
  [1990, 12],
  [2000, 18],
  [2010, 23],
  [2020, 28],
  [2025, 32],
];

const missionSolidariteLandmarks: Landmarks = [
  [1945, 0.05],
  [1970, 0.1],
  [1980, 2],
  [1988, 4],       // création RMI
  [1990, 5],
  [2000, 10],
  [2010, 15],
  [2016, 20],      // prime d'activité
  [2020, 27],
  [2025, 32],
];

const missionSanteLandmarks: Landmarks = [
  [1945, 0.05],
  [1970, 0.2],
  [1980, 0.5],
  [1990, 1.0],
  [2000, 1.5],
  [2010, 1.8],
  [2020, 2.5],     // crise COVID
  [2025, 2.0],
];

const missionJusticeLandmarks: Landmarks = [
  [1945, 0.05],
  [1960, 0.2],
  [1970, 0.5],
  [1980, 1.5],
  [1990, 3.5],
  [2000, 5.5],
  [2010, 7.2],
  [2020, 10.5],
  [2025, 13],
];

const missionSecuritesLandmarks: Landmarks = [
  [1945, 0.1],
  [1960, 0.4],
  [1970, 0.8],
  [1980, 2],
  [1990, 4],
  [2000, 7],
  [2010, 10],
  [2015, 12],      // post-attentats
  [2020, 14],
  [2025, 16],
];

const missionEcologieLandmarks: Landmarks = [
  [1945, 0.01],
  [1970, 0.1],
  [1980, 0.5],
  [1990, 1.5],
  [2000, 4],
  [2010, 10],
  [2015, 13],
  [2020, 18],      // plan relance vert
  [2022, 25],
  [2025, 22],
];

const missionTravailEmploiLandmarks: Landmarks = [
  [1945, 0.05],
  [1970, 0.5],
  [1980, 4],       // crise pétrolière → emploi
  [1990, 12],
  [2000, 18],
  [2010, 22],
  [2020, 26],      // chômage partiel
  [2025, 28],
];

const missionCohesionLandmarks: Landmarks = [
  [1945, 0.1],
  [1970, 0.5],
  [1980, 3],
  [1990, 8],
  [2000, 13],
  [2010, 16],
  [2020, 19],
  [2025, 19],
];

const missionAgricultureLandmarks: Landmarks = [
  [1945, 0.3],
  [1960, 1],
  [1970, 2],
  [1980, 5],
  [1990, 6],
  [2000, 6],
  [2010, 5],
  [2020, 5],
  [2025, 5],
];

const missionCultureLandmarks: Landmarks = [
  [1945, 0.05],
  [1970, 0.3],
  [1980, 1.2],
  [1990, 2],
  [2000, 2.8],
  [2010, 3.5],
  [2020, 3.8],
  [2025, 4],
];

const missionActionExtLandmarks: Landmarks = [
  [1945, 0.1],
  [1970, 0.3],
  [1980, 1],
  [1990, 2],
  [2000, 2.5],
  [2010, 2.8],
  [2020, 2.9],
  [2025, 3],
];

export const missionsHistoriques: MissionHistorique[] = [
  {
    id: "defense",
    label: "Défense",
    colorHex: "#0f172a",
    description: "Ministère des Armées : dissuasion nucléaire, armées conventionnelles, programmation militaire",
    points: interpolate(missionDefenseLandmarks),
  },
  {
    id: "education",
    label: "Enseignement scolaire",
    colorHex: "#0055A4",
    description: "Éducation nationale (hors supérieur) : primaire et secondaire",
    points: interpolate(missionEducationLandmarks),
  },
  {
    id: "dette",
    label: "Charge de la dette",
    colorHex: "#EF4135",
    description: "Intérêts versés sur les OAT et BTF — mission \"Engagements financiers de l'État\"",
    points: interpolate(missionDetteLandmarks),
  },
  {
    id: "recherche",
    label: "Recherche & enseignement supérieur",
    colorHex: "#16a34a",
    description: "Universités, CNRS, CEA, Inserm, bourses étudiantes",
    points: interpolate(missionRechercheLandmarks),
  },
  {
    id: "solidarite",
    label: "Solidarité & insertion",
    colorHex: "#d97706",
    description: "Prime d'activité, AAH, RSA (hors Sécu), lutte contre la pauvreté",
    points: interpolate(missionSolidariteLandmarks),
  },
  {
    id: "sante",
    label: "Santé (hors Sécu)",
    colorHex: "#ec4899",
    description: "Action sanitaire d'État — l'essentiel de la santé est porté par la Sécurité sociale",
    points: interpolate(missionSanteLandmarks),
  },
  {
    id: "justice",
    label: "Justice",
    colorHex: "#7c3aed",
    description: "Juridictions, administration pénitentiaire, aide juridictionnelle, protection judiciaire de la jeunesse",
    points: interpolate(missionJusticeLandmarks),
  },
  {
    id: "securites",
    label: "Sécurités",
    colorHex: "#0ea5e9",
    description: "Police nationale, gendarmerie, sécurité civile",
    points: interpolate(missionSecuritesLandmarks),
  },
  {
    id: "ecologie",
    label: "Écologie & mobilités",
    colorHex: "#84cc16",
    description: "Transition énergétique, transports, AFITF, eau, biodiversité",
    points: interpolate(missionEcologieLandmarks),
  },
  {
    id: "travail_emploi",
    label: "Travail & emploi",
    colorHex: "#f59e0b",
    description: "Politiques de l'emploi, France Travail, apprentissage, formation pro",
    points: interpolate(missionTravailEmploiLandmarks),
  },
  {
    id: "cohesion",
    label: "Cohésion des territoires",
    colorHex: "#14b8a6",
    description: "APL, aides au logement, politique de la ville, aménagement",
    points: interpolate(missionCohesionLandmarks),
  },
  {
    id: "agriculture",
    label: "Agriculture & forêt",
    colorHex: "#a16207",
    description: "Politique agricole (part État), forêt, pêche",
    points: interpolate(missionAgricultureLandmarks),
  },
  {
    id: "culture",
    label: "Culture",
    colorHex: "#c026d3",
    description: "Patrimoine, création, médias publics, audiovisuel",
    points: interpolate(missionCultureLandmarks),
  },
  {
    id: "action_exterieure",
    label: "Action extérieure",
    colorHex: "#3b82f6",
    description: "Diplomatie, aide publique au développement, rayonnement culturel",
    points: interpolate(missionActionExtLandmarks),
  },
];

export const missionsSource = {
  id: "missions.seed",
  label: "Direction du Budget — historique des missions (reconstitution)",
  url: "https://www.budget.gouv.fr/documentation/documents-budgetaires",
};
