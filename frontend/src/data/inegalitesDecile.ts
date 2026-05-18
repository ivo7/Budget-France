// ============================================================================
// inegalitesDecile.ts — répartition des revenus, impôts et patrimoine par décile
// ============================================================================
//
// Sources principales :
//   - INSEE — ERFS (Enquête Revenus Fiscaux et Sociaux), édition 2024
//   - INSEE — « Revenus et patrimoine des ménages », publication annuelle
//   - IPP — modèle de microsimulation TAXIPP
//   - Conseil des Prélèvements Obligatoires (CPO) — rapport 2022 et 2024
//   - France Stratégie — études redistribution
//   - DGFiP — données fiscales (R10/STATIM)
//
// Convention :
//   - Décile = un dixième de la population (~6,8 millions de personnes par décile)
//   - Niveau de vie = revenu disponible / nombre d'unités de consommation (UC)
//   - Année de référence : 2022-2023 (sources publiées 2024-2025)
//
// ⚠ Les chiffres précis varient selon la définition (revenu marché, revenu
// imposable, revenu disponible). On utilise le NIVEAU DE VIE INSEE comme
// référence principale.

export interface DecileData {
  decile: string;
  /** Borne basse du niveau de vie annuel (en €/UC) — D1 = revenu max des 10% les plus pauvres */
  niveauVieMax: number;
  /** Part de la population (toujours 10 % par décile sauf top 1%/0,1%) */
  partPopulationPct: number;
  /** Part des revenus totaux captés par ce décile */
  partRevenuPct: number;
  /** Taux moyen de prélèvements obligatoires (tous prélèvements) */
  tauxPrelevementsPct: number;
  /** Part du patrimoine national détenue */
  partPatrimoinePct: number;
  /** Description / contexte */
  description: string;
}

// ============================================================================
// Distribution par décile (D1 = les 10 % les plus pauvres, D10 = les 10 % les
// plus riches). Tous les niveaux de vie sont des plafonds bornes hautes 2022
// (publication INSEE 2024).
// ============================================================================

export const DECILES: DecileData[] = [
  {
    decile: "D1",
    niveauVieMax: 12_710,
    partPopulationPct: 10,
    partRevenuPct: 3.5,
    tauxPrelevementsPct: 38,
    partPatrimoinePct: 0.2,
    description:
      "Les 10 % les plus pauvres. Niveau de vie < 12 710 €/an par UC. ~6,8 millions de personnes. Beaucoup en situation de pauvreté monétaire (seuil 14 690 €). Forte dépendance aux transferts sociaux (RSA, APL, prime d'activité). Faible IR (souvent nul) mais lourde TVA et cotisations.",
  },
  {
    decile: "D2",
    niveauVieMax: 15_910,
    partPopulationPct: 10,
    partRevenuPct: 5.0,
    tauxPrelevementsPct: 40,
    partPatrimoinePct: 1.0,
    description:
      "Bas revenus, classes populaires. Niveau de vie 12 710 → 15 910 €. Travailleurs précaires, retraités modestes, familles monoparentales.",
  },
  {
    decile: "D3",
    niveauVieMax: 18_770,
    partPopulationPct: 10,
    partRevenuPct: 6.5,
    tauxPrelevementsPct: 42,
    partPatrimoinePct: 2.0,
    description:
      "Classes modestes. Niveau de vie 15 910 → 18 770 €. Premiers vrais cotisants IR (mais bénéficient encore largement de prestations sociales).",
  },
  {
    decile: "D4",
    niveauVieMax: 21_480,
    partPopulationPct: 10,
    partRevenuPct: 7.5,
    tauxPrelevementsPct: 44,
    partPatrimoinePct: 3.5,
    description:
      "Classes moyennes inférieures. Niveau de vie 18 770 → 21 480 €. Salariés à temps complet au SMIC ou un peu au-dessus.",
  },
  {
    decile: "D5",
    niveauVieMax: 24_390,
    partPopulationPct: 10,
    partRevenuPct: 8.5,
    tauxPrelevementsPct: 45,
    partPatrimoinePct: 5.0,
    description:
      "Médiane. Niveau de vie 21 480 → 24 390 €. La moitié des Français a moins, l'autre moitié plus. Cible privilégiée des politiques publiques.",
  },
  {
    decile: "D6",
    niveauVieMax: 27_700,
    partPopulationPct: 10,
    partRevenuPct: 9.5,
    tauxPrelevementsPct: 46,
    partPatrimoinePct: 7.0,
    description:
      "Classes moyennes. Niveau de vie 24 390 → 27 700 €. Cotisants nets : paient plus en impôts/cotisations qu'ils ne reçoivent en prestations.",
  },
  {
    decile: "D7",
    niveauVieMax: 31_750,
    partPopulationPct: 10,
    partRevenuPct: 10.5,
    tauxPrelevementsPct: 47,
    partPatrimoinePct: 9.5,
    description:
      "Classes moyennes supérieures. Niveau de vie 27 700 → 31 750 €. Cadres en début/milieu de carrière, professions intermédiaires.",
  },
  {
    decile: "D8",
    niveauVieMax: 37_390,
    partPopulationPct: 10,
    partRevenuPct: 12.0,
    tauxPrelevementsPct: 48,
    partPatrimoinePct: 13.0,
    description:
      "Classes aisées. Niveau de vie 31 750 → 37 390 €. Cadres confirmés, professions libérales. Première tranche significative de patrimoine immobilier.",
  },
  {
    decile: "D9",
    niveauVieMax: 47_290,
    partPopulationPct: 10,
    partRevenuPct: 14.5,
    tauxPrelevementsPct: 49,
    partPatrimoinePct: 16.0,
    description:
      "Classes aisées hautes. Niveau de vie 37 390 → 47 290 €. Cadres dirigeants, professions libérales bien établies, petits chefs d'entreprise.",
  },
  {
    decile: "D10",
    niveauVieMax: Infinity,
    partPopulationPct: 10,
    partRevenuPct: 22.5,
    tauxPrelevementsPct: 50,
    partPatrimoinePct: 43.0,
    description:
      "Les 10 % les plus riches. Niveau de vie > 47 290 €. Captent 22,5 % du revenu national et 43 % du patrimoine. Cadres supérieurs, professions libérales, dirigeants, détenteurs de capital. Subdivise lui-même : top 1 % et top 0,1 % ont des profils très différents.",
  },
];

// ============================================================================
// Le top 1% et top 0,1% — concentration au sommet
// ============================================================================

export interface SuperDecile {
  groupe: string;
  effectif: string;
  niveauVieMin: number;
  partRevenuPct: number;
  partPatrimoinePct: number;
  tauxPrelevementsEffectifPct: number;
  description: string;
}

export const TOP_DECILES: SuperDecile[] = [
  {
    groupe: "Top 10 % (D10)",
    effectif: "~6,8 millions de personnes",
    niveauVieMin: 47_290,
    partRevenuPct: 22.5,
    partPatrimoinePct: 43.0,
    tauxPrelevementsEffectifPct: 50,
    description:
      "Premier décile entièrement net cotisant. Mais 43 % du patrimoine se concentre ici. Subdivise en P90-P99 (très inégal lui-même) et top 1 %.",
  },
  {
    groupe: "Top 1 % (P99-P100)",
    effectif: "~680 000 personnes (~280 000 foyers fiscaux)",
    niveauVieMin: 105_000,
    partRevenuPct: 11.5,
    partPatrimoinePct: 24.0,
    tauxPrelevementsEffectifPct: 53,
    description:
      "Niveau de vie > 105 000 € par UC. Capte 11,5 % du revenu national (= 1,15 % du revenu pour 1 % de la population, soit ~11,5× la part équitable) et 24 % du patrimoine. Inclut cadres dirigeants, médecins libéraux, professions juridiques, patrons d'ETI.",
  },
  {
    groupe: "Top 0,1 % (P99,9-P100)",
    effectif: "~68 000 personnes (~28 000 foyers)",
    niveauVieMin: 250_000,
    partRevenuPct: 4.0,
    partPatrimoinePct: 10.0,
    tauxPrelevementsEffectifPct: 47,
    description:
      "Niveau de vie > 250 000 € par UC. Top 0,1 % = 40× la part équitable. Profil très différent : revenus majoritairement issus du capital (dividendes, plus-values), moins du salaire. Taux effectif EN BAISSE car PFU 30 % capital plus avantageux que barème progressif IR + niches fiscales captées disproportionnellement.",
  },
];

// ============================================================================
// Coefficient de Gini France — avant vs après redistribution
// ============================================================================

export interface GiniData {
  pays: string;
  drapeau: string;
  giniAvant: number; // revenus de marché (avant impôts et prestations)
  giniApres: number; // revenu disponible (après redistribution)
  reductionPct: number; // % de réduction des inégalités
}

export const GINI_INTERNATIONAL: GiniData[] = [
  {
    pays: "France",
    drapeau: "🇫🇷",
    giniAvant: 0.52,
    giniApres: 0.30,
    reductionPct: 42,
  },
  {
    pays: "Allemagne",
    drapeau: "🇩🇪",
    giniAvant: 0.51,
    giniApres: 0.31,
    reductionPct: 39,
  },
  {
    pays: "Royaume-Uni",
    drapeau: "🇬🇧",
    giniAvant: 0.51,
    giniApres: 0.36,
    reductionPct: 29,
  },
  {
    pays: "Suède",
    drapeau: "🇸🇪",
    giniAvant: 0.43,
    giniApres: 0.28,
    reductionPct: 35,
  },
  {
    pays: "États-Unis",
    drapeau: "🇺🇸",
    giniAvant: 0.51,
    giniApres: 0.41,
    reductionPct: 20,
  },
  {
    pays: "Italie",
    drapeau: "🇮🇹",
    giniAvant: 0.51,
    giniApres: 0.33,
    reductionPct: 35,
  },
  {
    pays: "Moyenne OCDE",
    drapeau: "🌍",
    giniAvant: 0.46,
    giniApres: 0.32,
    reductionPct: 30,
  },
];

// ============================================================================
// Captation des niches fiscales par décile
// ============================================================================

export interface NicheCaptation {
  niche: string;
  emoji: string;
  coutMdEur: number;
  partD9D10Pct: number; // part captée par les 20 % les plus aisés
  description: string;
}

export const NICHES_CAPTATION_DECILE: NicheCaptation[] = [
  {
    niche: "Crédit d'impôt emploi à domicile",
    emoji: "🏠",
    coutMdEur: 6.4,
    partD9D10Pct: 60,
    description:
      "Bénéfice concentré : 60 % capté par les 20 % les plus aisés (D9 + D10), 40 % par le top décile seul. Les ménages modestes n'emploient quasi pas.",
  },
  {
    niche: "Assurance-vie (abattement succession)",
    emoji: "💼",
    coutMdEur: 3.6,
    partD9D10Pct: 85,
    description:
      "Très concentré sur les hauts patrimoines. Permet de transmettre hors succession à des taux très réduits.",
  },
  {
    niche: "Pacte Dutreil (transmission entreprise)",
    emoji: "🏭",
    coutMdEur: 3.0,
    partD9D10Pct: 95,
    description:
      "Abattement 75 % succession sur titres d'entreprise familiale. Quasi exclusivement top 1 %.",
  },
  {
    niche: "PEA (exonération plus-values)",
    emoji: "📈",
    coutMdEur: 0.8,
    partD9D10Pct: 80,
    description:
      "Détention massivement concentrée dans le top décile. Le top 1 % possède la moitié du stock PEA français.",
  },
  {
    niche: "Réduction Pinel investissement locatif",
    emoji: "🏘️",
    coutMdEur: 1.3,
    partD9D10Pct: 92,
    description:
      "Quasi exclusivement souscrit par les 10 % les plus aisés. En extinction depuis 2024.",
  },
  {
    niche: "Abattement 10 % pensions retraités",
    emoji: "👴",
    coutMdEur: 4.1,
    partD9D10Pct: 35,
    description:
      "Moins concentré que les autres car bénéficie à tous les retraités proportionnellement à leur pension. Mais le top décile capte plus en valeur absolue.",
  },
  {
    niche: "TVA réduite alimentation",
    emoji: "🥖",
    coutMdEur: 14.5,
    partD9D10Pct: 18,
    description:
      "L'une des rares niches qui profite PLUS aux ménages modestes (relativement). D1-D5 captent ~55 % en valeur, car ils dépensent une part plus grande de leur budget en alimentation.",
  },
];

// ============================================================================
// Métadonnées
// ============================================================================

export const NIVEAU_VIE_MEDIAN_FRANCE = 23_160; // €/UC/an, INSEE 2022
export const SEUIL_PAUVRETE_FRANCE = 14_690; // 60% médiane
export const GINI_FRANCE_APRES = 0.30;
export const TAUX_PRELEVEMENTS_GLOBAL_FRANCE = 46; // % PIB
