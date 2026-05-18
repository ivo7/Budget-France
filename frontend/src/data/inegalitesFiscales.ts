// ============================================================================
// inegalitesFiscales.ts — distribution des prélèvements obligatoires par décile
// ============================================================================
//
// Sources principales :
//   - IPP (Institut des Politiques Publiques) — modèle TAXIPP de
//     micro-simulation fiscale (mise à jour 2024)
//   - INSEE — Enquêtes Revenus fiscaux et sociaux (ERFS), Indicateurs sociaux
//   - CPO (Conseil des Prélèvements Obligatoires) — rapport fiscalité 2024
//   - France Stratégie — Comité d'évaluation des réformes de la fiscalité du
//     capital (2024)
//   - World Inequality Database (WID) — Piketty / Saez / Zucman pour top 1%
//
// Méthodologie : Les chiffres ci-dessous concernent un foyer fiscal moyen
// de chaque décile, sur la base des revenus 2022-2023. Le « taux effectif »
// inclut TOUS les prélèvements obligatoires : IR + CSG/CRDS + cotisations
// sociales (salariales et patronales en équivalent) + impôts indirects (TVA,
// TICPE) + impôts locaux. C'est la méthode IPP standard.
//
// ⚠ Ces chiffres sont des moyennes par décile. À l'intérieur d'un décile,
// la variabilité est importante (effets de seuil, statuts cadre/non-cadre,
// présence enfants, etc.).

export interface DecileRevenu {
  decile: string; // "D1", "D2", ..., "D10", "Top 1%", "Top 0,1%"
  /** Borne basse du revenu mensuel net par UC (unité de consommation) */
  borneInfMensuelle: number;
  /** Borne haute du revenu mensuel net par UC */
  borneSupMensuelle: number | null; // null pour D10+
  /** Revenu moyen mensuel net par UC */
  revenuMensuelMoyen: number;
  /** Patrimoine net moyen (€) — médiane si possible */
  patrimoineMoyen: number;
  /** Taux effectif TOTAL prélèvements (en % du revenu disponible) */
  tauxEffectifTotalPct: number;
  /** Décomposition : part IR */
  partIrPct: number;
  /** Part cotisations sociales (sal + pat) */
  partCotisationsPct: number;
  /** Part CSG / CRDS */
  partCsgPct: number;
  /** Part impôts indirects (TVA, TICPE) */
  partIndirectsPct: number;
  /** Part impôts locaux (TFPB, etc.) */
  partLocauxPct: number;
  /** Note descriptive */
  description: string;
}

// ============================================================================
// Distribution par décile (D1 = 10% les plus pauvres, D10 = 10% les plus riches)
// + top 1% et top 0,1% (extrapolés depuis WID + IPP)
// ============================================================================

export const DECILES: DecileRevenu[] = [
  {
    decile: "D1",
    borneInfMensuelle: 0,
    borneSupMensuelle: 900,
    revenuMensuelMoyen: 720,
    patrimoineMoyen: 3500,
    tauxEffectifTotalPct: 46.0,
    partIrPct: 0.2,
    partCotisationsPct: 22.0,
    partCsgPct: 8.0,
    partIndirectsPct: 13.5,
    partLocauxPct: 2.3,
    description:
      "10 % les plus pauvres : moins de 900 €/mois net par unité de consommation. Travailleurs précaires, demandeurs d'emploi, retraités modestes, jeunes étudiants émancipés. Paient peu d'IR mais beaucoup de TVA en proportion de leur revenu (effet régressif). Reçoivent en revanche un fort soutien via aides sociales.",
  },
  {
    decile: "D2",
    borneInfMensuelle: 900,
    borneSupMensuelle: 1200,
    revenuMensuelMoyen: 1060,
    patrimoineMoyen: 8000,
    tauxEffectifTotalPct: 47.5,
    partIrPct: 0.5,
    partCotisationsPct: 23.0,
    partCsgPct: 9.0,
    partIndirectsPct: 12.5,
    partLocauxPct: 2.5,
    description:
      "Smicards à temps partiel, retraités du minimum, familles monoparentales. IR quasi nul. Cotisations sociales et CSG pèsent lourd, TVA aussi en relatif.",
  },
  {
    decile: "D3",
    borneInfMensuelle: 1200,
    borneSupMensuelle: 1450,
    revenuMensuelMoyen: 1320,
    patrimoineMoyen: 22000,
    tauxEffectifTotalPct: 48.0,
    partIrPct: 1.0,
    partCotisationsPct: 24.0,
    partCsgPct: 9.5,
    partIndirectsPct: 11.0,
    partLocauxPct: 2.5,
    description:
      "Smicards à plein temps. Entrent dans le barème IR. Profil le plus fréquent dans les statistiques fiscales (~5 millions de foyers).",
  },
  {
    decile: "D4",
    borneInfMensuelle: 1450,
    borneSupMensuelle: 1700,
    revenuMensuelMoyen: 1570,
    patrimoineMoyen: 45000,
    tauxEffectifTotalPct: 48.5,
    partIrPct: 2.0,
    partCotisationsPct: 24.5,
    partCsgPct: 10.0,
    partIndirectsPct: 9.5,
    partLocauxPct: 2.5,
    description:
      "Ouvriers qualifiés, employés. Premiers vrais contribuables IR (tranche 11 %). Souvent locataires, peu de patrimoine.",
  },
  {
    decile: "D5",
    borneInfMensuelle: 1700,
    borneSupMensuelle: 1950,
    revenuMensuelMoyen: 1820,
    patrimoineMoyen: 80000,
    tauxEffectifTotalPct: 49.0,
    partIrPct: 3.5,
    partCotisationsPct: 25.0,
    partCsgPct: 10.5,
    partIndirectsPct: 7.5,
    partLocauxPct: 2.5,
    description:
      "Revenu médian français (50ᵉ percentile). Souvent un couple modeste avec enfants, propriétaires de leur logement. Centre de gravité du débat fiscal.",
  },
  {
    decile: "D6",
    borneInfMensuelle: 1950,
    borneSupMensuelle: 2300,
    revenuMensuelMoyen: 2120,
    patrimoineMoyen: 130000,
    tauxEffectifTotalPct: 49.5,
    partIrPct: 5.0,
    partCotisationsPct: 25.5,
    partCsgPct: 10.5,
    partIndirectsPct: 6.0,
    partLocauxPct: 2.5,
    description:
      "Classes moyennes basses. Cadres débutants ou techniciens. Propriétaires avec emprunt.",
  },
  {
    decile: "D7",
    borneInfMensuelle: 2300,
    borneSupMensuelle: 2700,
    revenuMensuelMoyen: 2490,
    patrimoineMoyen: 210000,
    tauxEffectifTotalPct: 50.0,
    partIrPct: 7.0,
    partCotisationsPct: 26.0,
    partCsgPct: 10.5,
    partIndirectsPct: 4.0,
    partLocauxPct: 2.5,
    description:
      "Classes moyennes supérieures. Cadres confirmés, professions intermédiaires. Imposition IR commence à peser réellement.",
  },
  {
    decile: "D8",
    borneInfMensuelle: 2700,
    borneSupMensuelle: 3300,
    revenuMensuelMoyen: 2980,
    patrimoineMoyen: 350000,
    tauxEffectifTotalPct: 50.5,
    partIrPct: 9.0,
    partCotisationsPct: 26.5,
    partCsgPct: 10.5,
    partIndirectsPct: 2.0,
    partLocauxPct: 2.5,
    description:
      "Aisés (mais pas riches). Cadres seniors, professions libérales modestes. Tranche IR 30 %.",
  },
  {
    decile: "D9",
    borneInfMensuelle: 3300,
    borneSupMensuelle: 4500,
    revenuMensuelMoyen: 3820,
    patrimoineMoyen: 620000,
    tauxEffectifTotalPct: 51.0,
    partIrPct: 11.5,
    partCotisationsPct: 27.0,
    partCsgPct: 10.5,
    partIndirectsPct: 0,
    partLocauxPct: 2.0,
    description:
      "10 % les mieux rémunérés (hors top 1%). Cadres dirigeants, médecins libéraux, professions juridiques. Patrimoine immobilier conséquent.",
  },
  {
    decile: "D10",
    borneInfMensuelle: 4500,
    borneSupMensuelle: null,
    revenuMensuelMoyen: 7800,
    patrimoineMoyen: 1900000,
    tauxEffectifTotalPct: 50.5,
    partIrPct: 13.0,
    partCotisationsPct: 26.0,
    partCsgPct: 10.0,
    partIndirectsPct: 0,
    partLocauxPct: 1.5,
    description:
      "10 % les plus riches. Taux EFFECTIF moyen REDESCENT légèrement vs D9 — premier signe de dégressivité au sommet (optimisation fiscale, revenus du capital).",
  },
  {
    decile: "Top 1%",
    borneInfMensuelle: 8500,
    borneSupMensuelle: null,
    revenuMensuelMoyen: 20800,
    patrimoineMoyen: 4500000,
    tauxEffectifTotalPct: 47.0,
    partIrPct: 13.5,
    partCotisationsPct: 22.0,
    partCsgPct: 9.0,
    partIndirectsPct: 0,
    partLocauxPct: 2.5,
    description:
      "1 % les plus riches. Dirigeants d'entreprise, hauts cadres, héritiers, professions libérales d'élite. Beaucoup de revenus du capital (dividendes, plus-values), traités au flat tax 30 % depuis 2018 (vs barème progressif).",
  },
  {
    decile: "Top 0,1%",
    borneInfMensuelle: 60000,
    borneSupMensuelle: null,
    revenuMensuelMoyen: 100000,
    patrimoineMoyen: 25000000,
    tauxEffectifTotalPct: 42.0,
    partIrPct: 13.0,
    partCotisationsPct: 12.0,
    partCsgPct: 8.0,
    partIndirectsPct: 0,
    partLocauxPct: 9.0,
    description:
      "0,1 % les plus riches (~36 000 foyers). Quasi-totalité du revenu en capital (dividendes, plus-values). Bénéficient massivement du flat tax 30 % + niches (Pacte Dutreil, holdings, assurance-vie). Taux EFFECTIF clairement régressif vs classes moyennes.",
  },
  {
    decile: "Top 0,01%",
    borneInfMensuelle: 300000,
    borneSupMensuelle: null,
    revenuMensuelMoyen: 580000,
    patrimoineMoyen: 200000000,
    tauxEffectifTotalPct: 28.0,
    partIrPct: 10.0,
    partCotisationsPct: 5.0,
    partCsgPct: 7.0,
    partIndirectsPct: 0,
    partLocauxPct: 6.0,
    description:
      "0,01 % les plus riches (~3 700 foyers, 7+ M€/an). Taux effectif AUTOUR DE 28 % seulement — inférieur au taux effectif moyen du décile médian. Source : étude Bozio/Goupille-Lebret/Garbinti 2023 (IPP).",
  },
];

// ============================================================================
// Coefficient de Gini — avant / après redistribution
// ============================================================================

export interface GiniDataPoint {
  pays: string;
  drapeau: string;
  giniAvant: number;
  giniApres: number;
  /** Réduction du Gini par la redistribution publique (en points) */
  reduction: number;
}

export const GINI_COMPARAISON: GiniDataPoint[] = [
  { pays: "France",       drapeau: "🇫🇷", giniAvant: 52, giniApres: 29, reduction: 23 },
  { pays: "Allemagne",    drapeau: "🇩🇪", giniAvant: 50, giniApres: 30, reduction: 20 },
  { pays: "Suède",        drapeau: "🇸🇪", giniAvant: 44, giniApres: 28, reduction: 16 },
  { pays: "Royaume-Uni",  drapeau: "🇬🇧", giniAvant: 51, giniApres: 35, reduction: 16 },
  { pays: "Italie",       drapeau: "🇮🇹", giniAvant: 51, giniApres: 33, reduction: 18 },
  { pays: "Espagne",      drapeau: "🇪🇸", giniAvant: 50, giniApres: 32, reduction: 18 },
  { pays: "États-Unis",   drapeau: "🇺🇸", giniAvant: 51, giniApres: 39, reduction: 12 },
];

// ============================================================================
// Mythes à démonter
// ============================================================================

export const MYTHES_INEGALITES = [
  {
    mythe: "« Les pauvres ne paient pas d'impôts »",
    realite:
      "FAUX. Les 10 % les plus pauvres (D1) paient un taux effectif TOTAL de prélèvements de **~46 %** — quasiment le même que la classe moyenne. C'est juste que l'impôt sur le revenu est faible pour eux, mais la TVA (13,5 % de leur revenu), la CSG (8 %) et les cotisations sociales (22 %) pèsent énormément. La TVA est même PROFONDÉMENT RÉGRESSIVE : elle frappe plus durement les bas revenus qui consomment 100 % de leur salaire (vs les riches qui épargnent).",
  },
  {
    mythe: "« L'impôt sur le revenu est progressif »",
    realite:
      "PARTIELLEMENT VRAI. L'IR est progressif (5 tranches de 0 % à 45 %), MAIS il ne représente que **~14 % du total des prélèvements**. Le reste (cotisations, CSG, TVA) est proportionnel ou régressif. Résultat : le système FRANÇAIS ENSEMBLE est plat à environ 50 % pour tout le monde, sauf le top 0,01 % qui paie moins (~28 %).",
  },
  {
    mythe: "« Les riches paient 70 % des impôts »",
    realite:
      "VRAI EN ABSOLU, TROMPEUR EN PROPORTION. Oui, le top 10 % paie 70 % de l'IR — parce qu'ils gagnent 35 % des revenus totaux. En proportion de LEUR revenu, ils paient un taux effectif total ~50 %, identique aux autres déciles. Le top 0,01 % paie même MOINS en proportion (~28 % vs 50 % pour les classes moyennes).",
  },
  {
    mythe: "« La France est égalitaire »",
    realite:
      "VRAI APRÈS REDISTRIBUTION, PAS AVANT. Le Gini français AVANT redistribution est 0,52 (très inégalitaire, comparable aux USA). Mais la redistribution publique (aides sociales, impôts progressifs) réduit le Gini à **0,29 — l'un des plus bas de l'OCDE**. La France est l'État providence le plus redistributif après les pays nordiques.",
  },
  {
    mythe: "« Le flat tax 30 % sur le capital est injuste »",
    realite:
      "À NUANCER. Le PFU (prélèvement forfaitaire unique) de 30 % depuis 2018 a remplacé l'imposition au barème progressif (max 45 %) pour les revenus du capital. CONSÉQUENCE : avantage massif pour le top 0,1 % (qui passe de 45 % à 30 %). Mais aussi : encouragement de l'épargne, et France Stratégie 2024 conclut à un effet positif net sur l'investissement productif. Effet redistributif négatif documenté.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TAUX_PRELEVEMENTS_OBLIGATOIRES_PIB = 45.5;
export const GINI_FRANCE_AVANT = 52;
export const GINI_FRANCE_APRES = 29;
export const REDUCTION_GINI_FR = GINI_FRANCE_AVANT - GINI_FRANCE_APRES;
