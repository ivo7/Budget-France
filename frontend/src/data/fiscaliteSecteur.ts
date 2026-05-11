// ============================================================================
// fiscaliteSecteur.ts — fiscalité comparée par taille et secteur
// ============================================================================
//
// Sources principales :
//   - Institut des Politiques Publiques (IPP) — « Note IPP : taux effectif
//     d'imposition des sociétés en France » (mises à jour annuelles)
//   - Cour des comptes — « L'impôt sur les sociétés des grands groupes »
//     (rapport thématique 2024)
//   - Conseil des Prélèvements Obligatoires (CPO) — rapports fiscalité des
//     entreprises (2020, 2022, 2024)
//   - INSEE — comptes sectoriels des entreprises (ESANE)
//   - Eurostat / OCDE — Taxation Trends in the European Union (2024)
//
// ⚠ Le taux effectif est un concept complexe et débattu. La méthodologie
// retenue ici est celle de l'IPP : impôt sur les sociétés payé / résultat
// fiscal national avant report de déficits. Périmètre France uniquement
// (hors filiales étrangères). Année de référence : exercice 2023.

export interface FiscaliteTaille {
  taille: string;
  effectif: string;
  /** Taux effectif IS payé en France, en % */
  tauxEffectifIs: number;
  /** Taux nominal applicable (avec barème réduit pour micro) */
  tauxNominal: number;
  /** Cotisations patronales moyennes en % du brut */
  cotisPatronalesPct: number;
  description: string;
  source: string;
}

// ============================================================================
// Taux effectif par taille d'entreprise (IS payé / résultat avant report)
// ============================================================================

export const FISCALITE_PAR_TAILLE: FiscaliteTaille[] = [
  {
    taille: "Microentreprises",
    effectif: "~1,7 M (régime micro-BIC/BNC + sociétés < 11 salariés)",
    tauxEffectifIs: 18.0,
    tauxNominal: 15.0, // tranche réduite jusqu'à 42 500 €
    cotisPatronalesPct: 8.0, // forte réduction Fillon sur bas salaires
    description:
      "Effectif au bas du barème (15 % jusqu'à 42 500 € de bénéfice). Cotisations patronales fortement allégées via la « réduction Fillon » qui efface 30+ points sur les bas salaires.",
    source: "DGFiP statistiques + ACOSS",
  },
  {
    taille: "PME (10-249 salariés)",
    effectif: "~140 000 entreprises",
    tauxEffectifIs: 28.0,
    tauxNominal: 25.0,
    cotisPatronalesPct: 27.0,
    description:
      "Taux nominal plein 25 %. Quelques crédits d'impôt accessibles (CIR PME, apprentissage). Cotisations patronales moyennes, peu de marge d'optimisation fiscale.",
    source: "Cour des comptes 2024, IPP",
  },
  {
    taille: "ETI (250-4999 salariés)",
    effectif: "~5 800 entreprises",
    tauxEffectifIs: 25.0,
    tauxNominal: 25.0,
    cotisPatronalesPct: 32.0,
    description:
      "Taux effectif proche du nominal. Bénéficient du CIR à pleine puissance. Peu d'optimisation internationale comparée aux grands groupes (présence à l'étranger plus limitée).",
    source: "Cour des comptes 2024, IPP",
  },
  {
    taille: "Grandes entreprises (>5000 salariés, hors CAC 40)",
    effectif: "~270 entreprises",
    tauxEffectifIs: 22.0,
    tauxNominal: 25.0,
    cotisPatronalesPct: 35.0,
    description:
      "Léger écart avec le nominal grâce au CIR, à l'intégration fiscale (consolidation des résultats des filiales), au régime mère-fille. Présence internationale limitée mais croissante.",
    source: "Cour des comptes 2024",
  },
  {
    taille: "CAC 40 (40 plus grands groupes)",
    effectif: "40 entreprises (35 % CA total des grandes entreprises)",
    tauxEffectifIs: 17.8,
    tauxNominal: 25.0,
    cotisPatronalesPct: 38.0,
    description:
      "Taux effectif ~7 points en dessous du nominal grâce à la combinaison : intégration fiscale (compense pertes filiales), report de déficits, régime mère-fille (exonération 95 % dividendes), CIR maximal, prix de transfert vers pays à fiscalité plus douce (Irlande, Luxembourg, Pays-Bas). Mesure officielle IPP/Cour des comptes 2024.",
    source: "IPP 2024, Cour des comptes 2024 (CAC 40 IS)",
  },
];

// ============================================================================
// Taux effectif par secteur d'activité
// ============================================================================

export interface FiscaliteSecteur {
  secteur: string;
  emoji: string;
  /** Taux effectif IS dans le secteur */
  tauxEffectifIs: number;
  /** Surtaxes ou contributions spécifiques sectorielles */
  surtaxes?: string;
  /** Niches/régimes spéciaux favorables au secteur */
  niches?: string;
  description: string;
}

export const FISCALITE_PAR_SECTEUR: FiscaliteSecteur[] = [
  {
    secteur: "Numérique / Internet (FAANG France)",
    emoji: "💻",
    tauxEffectifIs: 9.0,
    niches:
      "Localisation revenus filiale Irlande/Luxembourg, prix de transfert, propriété intellectuelle hors France.",
    surtaxes:
      "Taxe GAFA depuis 2019 : 3 % CA généré en France (~600 M€/an), partielle.",
    description:
      "Apple, Google, Meta, Amazon, Microsoft : taux effectif France 5-15 % selon entité. Pratiques d'optimisation très documentées. Pillar 2 OCDE (15 % minimum mondial) en cours de mise en œuvre depuis 2024.",
  },
  {
    secteur: "Énergie / Pétrole",
    emoji: "⛽",
    tauxEffectifIs: 12.0,
    niches:
      "TotalEnergies, Engie, EDF : déductions investissements lourds, report déficits internationaux.",
    surtaxes:
      "Contribution exceptionnelle sur les superprofits énergie 2022-2024 (~10 Md€ collectés, prolongée 2025).",
    description:
      "TotalEnergies a payé 0 € IS en France certaines années (déficitaire localement, gros bénéfices à l'étranger). En 2022-2024, contribution superprofit 33 % sur rente énergétique.",
  },
  {
    secteur: "Banque / Finance",
    emoji: "🏦",
    tauxEffectifIs: 24.0,
    surtaxes:
      "Taxe systémique sur les banques (CRRT) : 1,3 Md€/an. Contribution sur opérations boursières.",
    niches: "Régime des provisions techniques (assurance, peu impactant).",
    description:
      "Banques régulées en France : peu de marge d'optimisation (activité « locale »). BNP, SocGen, Crédit Agricole : taux effectifs proches du nominal. Surtaxes spécifiques compensent partiellement leur situation de rente.",
  },
  {
    secteur: "Pharmaceutique / Santé",
    emoji: "💊",
    tauxEffectifIs: 14.0,
    niches:
      "Localisation R&D et brevets en pays à fiscalité douce. Régime « patent box » européens.",
    surtaxes:
      "Contributions ONDAM (clauses sauvegarde médicaments) : ~1,5 Md€/an. Taxe sur ventes pharma.",
    description:
      "Sanofi, Servier, Pierre Fabre : taux effectif faible via prix de transfert sur brevets/molécules. Compensation partielle par contributions ONDAM (clauses de sauvegarde sur médicaments innovants).",
  },
  {
    secteur: "Industrie manufacturière",
    emoji: "🏭",
    tauxEffectifIs: 23.0,
    niches: "CIR élevé pour les industries R&D-intensives (auto, aéronautique).",
    description:
      "PSA-Stellantis, Renault, Airbus, Safran : taux effectif proche du nominal. Activités difficilement délocalisables (usines, chaînes de production). Bénéficient massivement du CIR.",
  },
  {
    secteur: "Distribution / Grande conso",
    emoji: "🛒",
    tauxEffectifIs: 26.0,
    description:
      "Carrefour, Casino, Auchan : activité ancrée localement (magasins). Peu d'optimisation possible. Taux effectif proche ou supérieur au nominal.",
  },
  {
    secteur: "Construction / BTP",
    emoji: "🏗️",
    tauxEffectifIs: 24.0,
    niches: "TVA travaux 10 % (vs 20 %) — bénéfice partagé avec les clients.",
    description:
      "Vinci, Bouygues, Eiffage : activité locale, taux effectif proche du nominal. Bénéficient des taux TVA réduits sur travaux mais c'est principalement le client final qui en profite.",
  },
  {
    secteur: "Services aux entreprises",
    emoji: "💼",
    tauxEffectifIs: 22.0,
    niches: "CIR pour conseil en innovation, R&D logiciel.",
    description:
      "Cabinets de conseil, ESN (Capgemini, Atos, Sopra Steria), services informatiques. Taux effectif modérément réduit grâce au CIR sur la R&D logicielle.",
  },
  {
    secteur: "Médias / Édition / Culture",
    emoji: "📰",
    tauxEffectifIs: 19.0,
    niches:
      "Crédits d'impôt cinéma (~300 M€), audiovisuel (~200 M€), jeux vidéo (~100 M€), édition livre.",
    description:
      "Bénéficient de l'« exception culturelle » française : crédits d'impôt sectoriels, taux TVA super-réduits (presse 2,1 %, livre 5,5 %).",
  },
];

// ============================================================================
// Comparaisons internationales — taux nominal IS et tendance
// ============================================================================

export interface ComparaisonFiscaleInternationale {
  pays: string;
  drapeau: string;
  tauxNominalIs: number; // taux 2024
  tauxEffectif: number; // moyenne grandes entreprises
  tendance: string;
  note?: string;
}

export const COMPARAISON_FISCALE_INTERNATIONALE: ComparaisonFiscaleInternationale[] = [
  {
    pays: "France",
    drapeau: "🇫🇷",
    tauxNominalIs: 25.0,
    tauxEffectif: 22.0,
    tendance: "↓ Baisse 33,3 % → 25 % entre 2018 et 2022",
    note: "Au plus bas depuis 25 ans. Baisse progressive sous Macron.",
  },
  {
    pays: "Allemagne",
    drapeau: "🇩🇪",
    tauxNominalIs: 30.0,
    tauxEffectif: 28.0,
    tendance: "↔ Stable depuis 2008 (combinaison IS fédéral 15 % + taxe locale)",
    note: "Plus élevé que la France depuis 2022. Stable, pas de plan de baisse.",
  },
  {
    pays: "Royaume-Uni",
    drapeau: "🇬🇧",
    tauxNominalIs: 25.0,
    tauxEffectif: 21.0,
    tendance: "↑ Hausse 19 % → 25 % en 2023 (post-COVID)",
    note: "Remonté pour combler le déficit budgétaire post-pandémie.",
  },
  {
    pays: "Italie",
    drapeau: "🇮🇹",
    tauxNominalIs: 27.9,
    tauxEffectif: 24.0,
    tendance: "↔ Stable (IRES 24 % + IRAP régionale 3,9 %)",
  },
  {
    pays: "Espagne",
    drapeau: "🇪🇸",
    tauxNominalIs: 25.0,
    tauxEffectif: 23.0,
    tendance: "↔ Stable",
  },
  {
    pays: "Irlande",
    drapeau: "🇮🇪",
    tauxNominalIs: 12.5,
    tauxEffectif: 12.5,
    tendance: "↑ Hausse à 15 % en 2024 pour grandes multinationales (Pillar 2 OCDE)",
    note: "Modèle « hub fiscal européen » des GAFAM. Pillar 2 érode ce modèle.",
  },
  {
    pays: "Pays-Bas",
    drapeau: "🇳🇱",
    tauxNominalIs: 25.8,
    tauxEffectif: 22.0,
    tendance: "↔ Stable",
    note: "Régime « patent box » et « innovation box » favorables aux brevets.",
  },
  {
    pays: "Luxembourg",
    drapeau: "🇱🇺",
    tauxNominalIs: 24.9,
    tauxEffectif: 18.0,
    tendance: "↔ Stable",
    note: "Régimes spéciaux pour holdings et finance internationale.",
  },
  {
    pays: "États-Unis",
    drapeau: "🇺🇸",
    tauxNominalIs: 21.0,
    tauxEffectif: 18.0,
    tendance: "↓ Baisse 35 % → 21 % en 2018 (réforme Trump)",
    note: "Taux fédéral 21 %, + state taxes 0-9 % selon l'État.",
  },
];

// ============================================================================
// Cas emblématiques — entreprises avec taux effectif très bas
// ============================================================================

export interface CasEmblematique {
  entreprise: string;
  secteur: string;
  annee: string;
  tauxEffectif: string;
  contexte: string;
  source: string;
}

export const CAS_EMBLEMATIQUES: CasEmblematique[] = [
  {
    entreprise: "TotalEnergies",
    secteur: "Énergie",
    annee: "2019",
    tauxEffectif: "0 % IS en France",
    contexte:
      "Bénéfices nets 2019 du groupe : 11,2 Md€ — mais le résultat fiscal en France était déficitaire (pertes nettes de la branche raffinage). L'IS s'applique aux bénéfices localisés en France, pas au CA mondial. Légal mais politiquement explosif.",
    source: "Rapport annuel TotalEnergies 2019, Cour des comptes",
  },
  {
    entreprise: "Apple France",
    secteur: "Numérique",
    annee: "2017-2023",
    tauxEffectif: "~4 % sur ventes France",
    contexte:
      "Apple facturait ses ventes France via filiale irlandaise (Apple Sales International). Une « commission » de 0,5 % du CA était laissée à Apple France, taxée à 25 %, soit ~4 % d'IS effectif sur les ventes réelles. Redressé en 2018 pour 500 M€ (épisode Apple-DGFiP).",
    source: "DGFiP, presse économique (Les Échos, Le Monde)",
  },
  {
    entreprise: "Amazon France Services",
    secteur: "Numérique",
    annee: "2012-2017",
    tauxEffectif: "< 3 %",
    contexte:
      "Toutes les ventes Amazon en France étaient facturées par Amazon EU SARL (Luxembourg). Filiale française = simple prestataire logistique à marge ultra-faible. Redressée par DGFiP en 2017 (200 M€). Depuis 2019, Amazon facture localement.",
    source: "DGFiP, Sénat (rapport commission enquête 2017)",
  },
  {
    entreprise: "McDonald's France",
    secteur: "Restauration",
    annee: "2009-2020",
    tauxEffectif: "~14 %",
    contexte:
      "Royalties versées par les franchises françaises à McDonald's Luxembourg (« McD Europe Franchising »), bénéficiant d'un régime favorable. Redressement de 1,25 Md€ en 2022 (accord transactionnel). Pratique légale mais agressivement optimisée.",
    source: "PNF (Parquet National Financier), DGFiP",
  },
  {
    entreprise: "Google France",
    secteur: "Numérique",
    annee: "2005-2018",
    tauxEffectif: "~2 %",
    contexte:
      "Recettes publicitaires France facturées par Google Ireland. Filiale française = bureau commercial sans capacité de signer les contrats. Redressement DGFiP 1 Md€ en 2019 (accord transactionnel). Modèle changé depuis (facturation locale).",
    source: "DGFiP, Le Monde",
  },
];

export const TAUX_NOMINAL_FRANCE = 25.0;
export const TAUX_EFFECTIF_MOYEN_CAC40 = 17.8;
export const TAUX_EFFECTIF_MOYEN_PME = 28.0;
