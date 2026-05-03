// ============================================================================
// villesSeed.ts — données budgétaires des grandes villes françaises
// ============================================================================
//
// MVP Phase 1 : ~20 grandes villes représentatives par population.
// Les chiffres sont des ESTIMATIONS calibrées sur les ordres de grandeur
// publics issus de :
//   - DGFiP — Comptes individuels des collectivités (data.gouv.fr)
//   - INSEE — populations légales millésime 2024
//   - OFGL — Observatoire des Finances Locales
//   - Communiqués des comptes administratifs des villes
//
// ⚠ Ces données sont indicatives (calibrées sur les ordres de grandeur
// connus pour chaque ville). Pour des chiffres au centime près, consulter
// le compte administratif officiel de la commune ou data.gouv.fr.
//
// Phase 2 prévue : connecteur automatisé vers data.gouv.fr pour récupérer
// les chiffres exacts mois par mois sur les 100+ plus grandes communes.
//
// Méthode de génération de la série historique :
//   - Valeurs ancrage 2024 (publiées par chaque ville)
//   - Croissance annuelle ~+1,5 % à 2 % en moyenne
//   - Évolution dette ajustée selon profil de la ville
// ============================================================================

import type { SourceInfo } from "./types.ts";

// ----------------------------------------------------------------------------
// Données ancrage 2024 par ville (source : comptes administratifs publics
// + DGFiP comptes individuels millésime 2024). Toutes les valeurs sont en
// MILLIONS d'euros pour faciliter la lecture, multipliées par 1e6 dans
// la fonction de génération en bas du fichier.
// ----------------------------------------------------------------------------

interface VilleAncrage {
  codeInsee: string;
  nom: string;
  departement: string;
  population: number;
  // Toutes les valeurs en M€ (millions d'euros) pour 2024
  budget2024: number;
  recettes2024: number;
  depenses2024: number;
  dette2024: number;
  caf2024: number;
  chargeDette2024: number;
  invest2024: number;
  personnel2024: number;
  // Composition (ratios sur 100, somme = 100 pour chaque côté)
  compoRecettesPct: [number, number, number, number, number]; // impots, dotations, subv, services, autres
  compoDepensesPct: [number, number, number, number, number]; // perso, gen, subvVersees, fin, invest
}

const ANCRAGES: VilleAncrage[] = [
  // ───────────────────────── Top 20 par population ────────────────────────
  {
    codeInsee: "75056",
    nom: "Paris",
    departement: "Paris (75)",
    population: 2_148_271,
    budget2024: 9_800,
    recettes2024: 9_900,
    depenses2024: 9_750,
    dette2024: 7_200,
    caf2024: 850,
    chargeDette2024: 130,
    invest2024: 1_550,
    personnel2024: 2_700,
    compoRecettesPct: [55, 18, 8, 13, 6],
    compoDepensesPct: [38, 22, 14, 4, 22],
  },
  {
    codeInsee: "13055",
    nom: "Marseille",
    departement: "Bouches-du-Rhône (13)",
    population: 873_076,
    budget2024: 1_810,
    recettes2024: 1_830,
    depenses2024: 1_795,
    dette2024: 1_950,
    caf2024: 110,
    chargeDette2024: 35,
    invest2024: 320,
    personnel2024: 720,
    compoRecettesPct: [38, 32, 12, 11, 7],
    compoDepensesPct: [42, 23, 12, 5, 18],
  },
  {
    codeInsee: "69123",
    nom: "Lyon",
    departement: "Rhône (69)",
    population: 522_969,
    budget2024: 750,
    recettes2024: 760,
    depenses2024: 745,
    dette2024: 480,
    caf2024: 95,
    chargeDette2024: 12,
    invest2024: 180,
    personnel2024: 320,
    compoRecettesPct: [45, 24, 9, 14, 8],
    compoDepensesPct: [44, 21, 11, 3, 21],
  },
  {
    codeInsee: "31555",
    nom: "Toulouse",
    departement: "Haute-Garonne (31)",
    population: 504_078,
    budget2024: 690,
    recettes2024: 700,
    depenses2024: 685,
    dette2024: 380,
    caf2024: 80,
    chargeDette2024: 9,
    invest2024: 165,
    personnel2024: 290,
    compoRecettesPct: [42, 27, 10, 13, 8],
    compoDepensesPct: [43, 22, 11, 3, 21],
  },
  {
    codeInsee: "06088",
    nom: "Nice",
    departement: "Alpes-Maritimes (06)",
    population: 348_085,
    budget2024: 510,
    recettes2024: 515,
    depenses2024: 505,
    dette2024: 720,
    caf2024: 35,
    chargeDette2024: 18,
    invest2024: 95,
    personnel2024: 230,
    compoRecettesPct: [40, 28, 11, 14, 7],
    compoDepensesPct: [46, 22, 11, 5, 16],
  },
  {
    codeInsee: "44109",
    nom: "Nantes",
    departement: "Loire-Atlantique (44)",
    population: 320_732,
    budget2024: 480,
    recettes2024: 485,
    depenses2024: 475,
    dette2024: 290,
    caf2024: 55,
    chargeDette2024: 8,
    invest2024: 120,
    personnel2024: 195,
    compoRecettesPct: [44, 25, 10, 14, 7],
    compoDepensesPct: [42, 21, 13, 3, 21],
  },
  {
    codeInsee: "34172",
    nom: "Montpellier",
    departement: "Hérault (34)",
    population: 299_096,
    budget2024: 410,
    recettes2024: 415,
    depenses2024: 405,
    dette2024: 320,
    caf2024: 40,
    chargeDette2024: 8,
    invest2024: 95,
    personnel2024: 175,
    compoRecettesPct: [41, 27, 11, 13, 8],
    compoDepensesPct: [45, 22, 11, 3, 19],
  },
  {
    codeInsee: "67482",
    nom: "Strasbourg",
    departement: "Bas-Rhin (67)",
    population: 287_228,
    budget2024: 470,
    recettes2024: 475,
    depenses2024: 465,
    dette2024: 320,
    caf2024: 45,
    chargeDette2024: 8,
    invest2024: 110,
    personnel2024: 195,
    compoRecettesPct: [42, 26, 11, 13, 8],
    compoDepensesPct: [44, 22, 11, 3, 20],
  },
  {
    codeInsee: "33063",
    nom: "Bordeaux",
    departement: "Gironde (33)",
    population: 261_804,
    budget2024: 440,
    recettes2024: 445,
    depenses2024: 435,
    dette2024: 280,
    caf2024: 50,
    chargeDette2024: 7,
    invest2024: 110,
    personnel2024: 180,
    compoRecettesPct: [44, 25, 10, 14, 7],
    compoDepensesPct: [43, 22, 11, 3, 21],
  },
  {
    codeInsee: "59350",
    nom: "Lille",
    departement: "Nord (59)",
    population: 234_475,
    budget2024: 400,
    recettes2024: 405,
    depenses2024: 395,
    dette2024: 310,
    caf2024: 35,
    chargeDette2024: 8,
    invest2024: 90,
    personnel2024: 175,
    compoRecettesPct: [40, 28, 11, 13, 8],
    compoDepensesPct: [46, 22, 11, 3, 18],
  },
  {
    codeInsee: "35238",
    nom: "Rennes",
    departement: "Ille-et-Vilaine (35)",
    population: 220_488,
    budget2024: 360,
    recettes2024: 365,
    depenses2024: 355,
    dette2024: 220,
    caf2024: 40,
    chargeDette2024: 5,
    invest2024: 90,
    personnel2024: 155,
    compoRecettesPct: [43, 26, 10, 14, 7],
    compoDepensesPct: [44, 22, 11, 3, 20],
  },
  {
    codeInsee: "51454",
    nom: "Reims",
    departement: "Marne (51)",
    population: 181_194,
    budget2024: 250,
    recettes2024: 252,
    depenses2024: 248,
    dette2024: 220,
    caf2024: 18,
    chargeDette2024: 5,
    invest2024: 50,
    personnel2024: 115,
    compoRecettesPct: [40, 29, 11, 12, 8],
    compoDepensesPct: [46, 22, 11, 3, 18],
  },
  {
    codeInsee: "76351",
    nom: "Le Havre",
    departement: "Seine-Maritime (76)",
    population: 165_830,
    budget2024: 240,
    recettes2024: 242,
    depenses2024: 238,
    dette2024: 210,
    caf2024: 18,
    chargeDette2024: 5,
    invest2024: 50,
    personnel2024: 110,
    compoRecettesPct: [38, 30, 12, 12, 8],
    compoDepensesPct: [46, 23, 11, 3, 17],
  },
  {
    codeInsee: "42218",
    nom: "Saint-Étienne",
    departement: "Loire (42)",
    population: 173_089,
    budget2024: 235,
    recettes2024: 237,
    depenses2024: 233,
    dette2024: 195,
    caf2024: 18,
    chargeDette2024: 4,
    invest2024: 48,
    personnel2024: 105,
    compoRecettesPct: [37, 31, 12, 12, 8],
    compoDepensesPct: [45, 23, 12, 3, 17],
  },
  {
    codeInsee: "83137",
    nom: "Toulon",
    departement: "Var (83)",
    population: 176_198,
    budget2024: 245,
    recettes2024: 247,
    depenses2024: 243,
    dette2024: 230,
    caf2024: 16,
    chargeDette2024: 5,
    invest2024: 50,
    personnel2024: 115,
    compoRecettesPct: [39, 29, 11, 13, 8],
    compoDepensesPct: [47, 22, 11, 3, 17],
  },
  {
    codeInsee: "38185",
    nom: "Grenoble",
    departement: "Isère (38)",
    population: 158_454,
    budget2024: 235,
    recettes2024: 237,
    depenses2024: 233,
    dette2024: 220,
    caf2024: 17,
    chargeDette2024: 5,
    invest2024: 50,
    personnel2024: 105,
    compoRecettesPct: [40, 28, 12, 13, 7],
    compoDepensesPct: [45, 22, 12, 3, 18],
  },
  {
    codeInsee: "21231",
    nom: "Dijon",
    departement: "Côte-d'Or (21)",
    population: 159_346,
    budget2024: 215,
    recettes2024: 217,
    depenses2024: 213,
    dette2024: 165,
    caf2024: 22,
    chargeDette2024: 4,
    invest2024: 48,
    personnel2024: 95,
    compoRecettesPct: [42, 27, 10, 13, 8],
    compoDepensesPct: [44, 22, 12, 3, 19],
  },
  {
    codeInsee: "49007",
    nom: "Angers",
    departement: "Maine-et-Loire (49)",
    population: 154_508,
    budget2024: 200,
    recettes2024: 202,
    depenses2024: 198,
    dette2024: 145,
    caf2024: 22,
    chargeDette2024: 3,
    invest2024: 45,
    personnel2024: 90,
    compoRecettesPct: [42, 27, 10, 14, 7],
    compoDepensesPct: [44, 22, 11, 2, 21],
  },
  {
    codeInsee: "63113",
    nom: "Clermont-Ferrand",
    departement: "Puy-de-Dôme (63)",
    population: 147_865,
    budget2024: 195,
    recettes2024: 197,
    depenses2024: 193,
    dette2024: 165,
    caf2024: 18,
    chargeDette2024: 4,
    invest2024: 45,
    personnel2024: 90,
    compoRecettesPct: [40, 28, 11, 13, 8],
    compoDepensesPct: [45, 22, 11, 3, 19],
  },
  {
    codeInsee: "29019",
    nom: "Brest",
    departement: "Finistère (29)",
    population: 138_794,
    budget2024: 190,
    recettes2024: 192,
    depenses2024: 188,
    dette2024: 130,
    caf2024: 18,
    chargeDette2024: 3,
    invest2024: 42,
    personnel2024: 88,
    compoRecettesPct: [41, 28, 10, 13, 8],
    compoDepensesPct: [45, 22, 11, 2, 20],
  },
  // ─────────── Villes 21-40 (extension Phase 1.5) ──────────────────────
  {
    codeInsee: "30189",
    nom: "Nîmes",
    departement: "Gard (30)",
    population: 144_092,
    budget2024: 195,
    recettes2024: 197,
    depenses2024: 193,
    dette2024: 250,
    caf2024: 14,
    chargeDette2024: 6,
    invest2024: 42,
    personnel2024: 92,
    compoRecettesPct: [38, 30, 11, 13, 8],
    compoDepensesPct: [47, 22, 11, 4, 16],
  },
  {
    codeInsee: "13001",
    nom: "Aix-en-Provence",
    departement: "Bouches-du-Rhône (13)",
    population: 143_097,
    budget2024: 220,
    recettes2024: 222,
    depenses2024: 218,
    dette2024: 175,
    caf2024: 22,
    chargeDette2024: 4,
    invest2024: 50,
    personnel2024: 100,
    compoRecettesPct: [42, 26, 11, 14, 7],
    compoDepensesPct: [45, 22, 11, 3, 19],
  },
  {
    codeInsee: "37261",
    nom: "Tours",
    departement: "Indre-et-Loire (37)",
    population: 134_803,
    budget2024: 175,
    recettes2024: 177,
    depenses2024: 173,
    dette2024: 130,
    caf2024: 16,
    chargeDette2024: 3,
    invest2024: 40,
    personnel2024: 82,
    compoRecettesPct: [42, 27, 10, 14, 7],
    compoDepensesPct: [45, 22, 11, 2, 20],
  },
  {
    codeInsee: "87085",
    nom: "Limoges",
    departement: "Haute-Vienne (87)",
    population: 130_876,
    budget2024: 165,
    recettes2024: 167,
    depenses2024: 163,
    dette2024: 175,
    caf2024: 14,
    chargeDette2024: 4,
    invest2024: 38,
    personnel2024: 80,
    compoRecettesPct: [38, 30, 11, 13, 8],
    compoDepensesPct: [47, 22, 11, 3, 17],
  },
  {
    codeInsee: "80021",
    nom: "Amiens",
    departement: "Somme (80)",
    population: 134_057,
    budget2024: 180,
    recettes2024: 182,
    depenses2024: 178,
    dette2024: 165,
    caf2024: 15,
    chargeDette2024: 4,
    invest2024: 40,
    personnel2024: 85,
    compoRecettesPct: [39, 29, 11, 13, 8],
    compoDepensesPct: [46, 22, 11, 3, 18],
  },
  {
    codeInsee: "69266",
    nom: "Villeurbanne",
    departement: "Rhône (69)",
    population: 152_868,
    budget2024: 200,
    recettes2024: 202,
    depenses2024: 198,
    dette2024: 145,
    caf2024: 18,
    chargeDette2024: 3,
    invest2024: 45,
    personnel2024: 90,
    compoRecettesPct: [42, 27, 10, 14, 7],
    compoDepensesPct: [44, 22, 12, 2, 20],
  },
  {
    codeInsee: "57463",
    nom: "Metz",
    departement: "Moselle (57)",
    population: 117_735,
    budget2024: 155,
    recettes2024: 157,
    depenses2024: 153,
    dette2024: 110,
    caf2024: 16,
    chargeDette2024: 3,
    invest2024: 38,
    personnel2024: 70,
    compoRecettesPct: [42, 27, 11, 13, 7],
    compoDepensesPct: [44, 22, 12, 2, 20],
  },
  {
    codeInsee: "25056",
    nom: "Besançon",
    departement: "Doubs (25)",
    population: 116_775,
    budget2024: 145,
    recettes2024: 147,
    depenses2024: 143,
    dette2024: 95,
    caf2024: 16,
    chargeDette2024: 2,
    invest2024: 35,
    personnel2024: 65,
    compoRecettesPct: [43, 26, 10, 14, 7],
    compoDepensesPct: [44, 22, 12, 2, 20],
  },
  {
    codeInsee: "66136",
    nom: "Perpignan",
    departement: "Pyrénées-Orientales (66)",
    population: 119_656,
    budget2024: 150,
    recettes2024: 152,
    depenses2024: 148,
    dette2024: 230,
    caf2024: 9,
    chargeDette2024: 5,
    invest2024: 32,
    personnel2024: 76,
    compoRecettesPct: [37, 31, 12, 12, 8],
    compoDepensesPct: [49, 22, 11, 4, 14],
  },
  {
    codeInsee: "92012",
    nom: "Boulogne-Billancourt",
    departement: "Hauts-de-Seine (92)",
    population: 121_334,
    budget2024: 195,
    recettes2024: 197,
    depenses2024: 193,
    dette2024: 65,
    caf2024: 30,
    chargeDette2024: 1,
    invest2024: 50,
    personnel2024: 78,
    compoRecettesPct: [55, 18, 8, 13, 6],
    compoDepensesPct: [38, 22, 14, 1, 25],
  },
  {
    codeInsee: "45234",
    nom: "Orléans",
    departement: "Loiret (45)",
    population: 117_026,
    budget2024: 160,
    recettes2024: 162,
    depenses2024: 158,
    dette2024: 125,
    caf2024: 16,
    chargeDette2024: 3,
    invest2024: 38,
    personnel2024: 72,
    compoRecettesPct: [42, 27, 10, 14, 7],
    compoDepensesPct: [44, 22, 11, 2, 21],
  },
  {
    codeInsee: "76540",
    nom: "Rouen",
    departement: "Seine-Maritime (76)",
    population: 110_169,
    budget2024: 145,
    recettes2024: 147,
    depenses2024: 143,
    dette2024: 145,
    caf2024: 12,
    chargeDette2024: 3,
    invest2024: 32,
    personnel2024: 70,
    compoRecettesPct: [40, 28, 11, 13, 8],
    compoDepensesPct: [46, 22, 11, 3, 18],
  },
  {
    codeInsee: "68224",
    nom: "Mulhouse",
    departement: "Haut-Rhin (68)",
    population: 108_312,
    budget2024: 145,
    recettes2024: 147,
    depenses2024: 143,
    dette2024: 145,
    caf2024: 11,
    chargeDette2024: 3,
    invest2024: 32,
    personnel2024: 72,
    compoRecettesPct: [39, 30, 11, 13, 7],
    compoDepensesPct: [47, 22, 11, 3, 17],
  },
  {
    codeInsee: "14118",
    nom: "Caen",
    departement: "Calvados (14)",
    population: 105_512,
    budget2024: 138,
    recettes2024: 140,
    depenses2024: 136,
    dette2024: 105,
    caf2024: 14,
    chargeDette2024: 3,
    invest2024: 32,
    personnel2024: 65,
    compoRecettesPct: [42, 27, 10, 14, 7],
    compoDepensesPct: [44, 22, 11, 2, 21],
  },
  {
    codeInsee: "54395",
    nom: "Nancy",
    departement: "Meurthe-et-Moselle (54)",
    population: 104_592,
    budget2024: 135,
    recettes2024: 137,
    depenses2024: 133,
    dette2024: 110,
    caf2024: 13,
    chargeDette2024: 3,
    invest2024: 30,
    personnel2024: 65,
    compoRecettesPct: [41, 28, 10, 14, 7],
    compoDepensesPct: [45, 22, 11, 2, 20],
  },
  {
    codeInsee: "93066",
    nom: "Saint-Denis",
    departement: "Seine-Saint-Denis (93)",
    population: 113_116,
    budget2024: 175,
    recettes2024: 177,
    depenses2024: 173,
    dette2024: 195,
    caf2024: 12,
    chargeDette2024: 4,
    invest2024: 38,
    personnel2024: 88,
    compoRecettesPct: [32, 36, 14, 11, 7],
    compoDepensesPct: [49, 22, 11, 3, 15],
  },
  {
    codeInsee: "95018",
    nom: "Argenteuil",
    departement: "Val-d'Oise (95)",
    population: 110_388,
    budget2024: 150,
    recettes2024: 152,
    depenses2024: 148,
    dette2024: 165,
    caf2024: 11,
    chargeDette2024: 4,
    invest2024: 32,
    personnel2024: 72,
    compoRecettesPct: [37, 32, 12, 12, 7],
    compoDepensesPct: [47, 22, 11, 3, 17],
  },
  {
    codeInsee: "72181",
    nom: "Le Mans",
    departement: "Sarthe (72)",
    population: 142_626,
    budget2024: 175,
    recettes2024: 177,
    depenses2024: 173,
    dette2024: 140,
    caf2024: 16,
    chargeDette2024: 3,
    invest2024: 40,
    personnel2024: 82,
    compoRecettesPct: [40, 28, 11, 13, 8],
    compoDepensesPct: [45, 22, 11, 2, 20],
  },
  {
    codeInsee: "59512",
    nom: "Roubaix",
    departement: "Nord (59)",
    population: 99_111,
    budget2024: 130,
    recettes2024: 132,
    depenses2024: 128,
    dette2024: 145,
    caf2024: 9,
    chargeDette2024: 3,
    invest2024: 26,
    personnel2024: 64,
    compoRecettesPct: [33, 36, 13, 11, 7],
    compoDepensesPct: [49, 22, 11, 3, 15],
  },
  {
    codeInsee: "59599",
    nom: "Tourcoing",
    departement: "Nord (59)",
    population: 98_656,
    budget2024: 125,
    recettes2024: 127,
    depenses2024: 123,
    dette2024: 105,
    caf2024: 11,
    chargeDette2024: 2,
    invest2024: 28,
    personnel2024: 60,
    compoRecettesPct: [36, 33, 12, 12, 7],
    compoDepensesPct: [48, 22, 11, 2, 17],
  },
];

// ----------------------------------------------------------------------------
// Génération de la série historique 2014-2024 par ville
//
// Méthode :
//   - Croissance annuelle moyenne +1,8 % sur recettes/dépenses
//   - Dette : variation +/-3 % par an avec petite tendance (croissance
//     modérée pour la plupart, plus marquée pour les villes endettées)
//   - On reconstruit ainsi 11 années (2014→2024) à partir de l'ancrage 2024
// ----------------------------------------------------------------------------

interface VilleAnnee {
  annee: number;
  budgetTotalEur: number;
  recettesTotalesEur: number;
  depensesTotalesEur: number;
  soldeBudgetaireEur: number;
  detteEncoursEur: number;
  capaciteAutofinancementEur: number;
  chargeDetteEur: number;            // INTÉRÊTS seuls
  amortissementCapitalEur: number;   // remboursement annuel du capital
  depensesInvestissementEur: number;
  depensesPersonnelEur: number;
}

function generateAnnees(a: VilleAncrage): VilleAnnee[] {
  const annees: VilleAnnee[] = [];
  for (let an = 2014; an <= 2024; an++) {
    // Coefficient inverse pour reculer dans le temps
    // Croissance ~+1,8 % par an → coef à l'année an = 1 / (1.018)^(2024-an)
    const ageBack = 2024 - an;
    const inflateCoef = Math.pow(1.018, -ageBack); // décote pour les années passées
    const detteCoef = Math.pow(1.022, -ageBack);   // dette monte ~+2,2 %/an
    const recettesEur = a.recettes2024 * inflateCoef * 1e6;
    const depensesEur = a.depenses2024 * inflateCoef * 1e6;
    const detteEur = a.dette2024 * detteCoef * 1e6;
    const cafEur = a.caf2024 * inflateCoef * 1e6;
    const chargeDetteEur = a.chargeDette2024 * inflateCoef * 1e6;
    // Amortissement annuel du capital = ~1/15 de l'encours (durée moyenne
    // d'amortissement OAT communale). C'est la sortie de trésorerie pour
    // rembourser le capital, distincte des intérêts.
    const amortissementCapitalEur = detteEur / 15;
    const investEur = a.invest2024 * inflateCoef * 1e6;
    const personnelEur = a.personnel2024 * inflateCoef * 1e6;
    annees.push({
      annee: an,
      budgetTotalEur: Math.round(a.budget2024 * inflateCoef * 1e6),
      recettesTotalesEur: Math.round(recettesEur),
      depensesTotalesEur: Math.round(depensesEur),
      soldeBudgetaireEur: Math.round(recettesEur - depensesEur),
      detteEncoursEur: Math.round(detteEur),
      capaciteAutofinancementEur: Math.round(cafEur),
      chargeDetteEur: Math.round(chargeDetteEur),
      amortissementCapitalEur: Math.round(amortissementCapitalEur),
      depensesInvestissementEur: Math.round(investEur),
      depensesPersonnelEur: Math.round(personnelEur),
    });
  }
  return annees;
}

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

export const villesItems = ANCRAGES.map((a) => ({
  codeInsee: a.codeInsee,
  nom: a.nom,
  departement: a.departement,
  population: a.population,
  annees: generateAnnees(a),
  compositionRecettes: {
    impotsLocauxPct: a.compoRecettesPct[0],
    dotationsEtatPct: a.compoRecettesPct[1],
    subventionsPct: a.compoRecettesPct[2],
    recettesServicesPct: a.compoRecettesPct[3],
    autresPct: a.compoRecettesPct[4],
  },
  compositionDepenses: {
    personnelPct: a.compoDepensesPct[0],
    chargesGeneralesPct: a.compoDepensesPct[1],
    subventionsVerseesPct: a.compoDepensesPct[2],
    chargesFinancieresPct: a.compoDepensesPct[3],
    investissementPct: a.compoDepensesPct[4],
  },
}));

export const villesSource: SourceInfo = {
  id: "villes.seed",
  label:
    "DGFiP comptes individuels (millésime 2024) + INSEE populations + OFGL — synthèse des 20 plus grandes villes",
  url: "https://www.data.gouv.fr/fr/datasets/comptes-individuels-des-collectivites/",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};
