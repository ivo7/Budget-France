// ============================================================================
// immigration.ts — coûts et recettes budgétaires liés à l'immigration
// ============================================================================
//
// Sources principales (toutes publiques) :
//   - Cour des comptes — rapport thématique « L'entrée, le séjour et le
//     premier accueil des personnes étrangères » (2020, mis à jour 2024)
//   - INSEE — Insee Première « Immigrés et descendants d'immigrés »
//     (édition 2024), Bilan démographique
//   - OFII (Office Français de l'Immigration et de l'Intégration) —
//     rapport d'activité annuel
//   - OFPRA (Office Français de Protection des Réfugiés) — rapport
//     d'activité annuel
//   - DGEF (Direction Générale des Étrangers en France, Intérieur) —
//     statistiques mensuelles séjour
//   - DREES — études sur l'AME, dépenses santé migrants
//   - IPP — études économétriques sur l'effet budgétaire net
//   - France Stratégie — rapport « Immigration et intégration » 2023
//   - OCDE — Perspectives des migrations internationales 2024
//
// ⚠ APPROCHE : strictement factuelle, neutre, sources officielles.
// On présente les chiffres BRUTS sans prise de position. Le solde net
// budgétaire dépend du périmètre choisi (court terme vs long terme,
// inclusion descendants, valorisation services publics). On présente
// les différentes méthodologies.

// ============================================================================
// Démographie : qui sont les immigrés en France ?
// ============================================================================

export interface PopulationCategorie {
  label: string;
  emoji: string;
  population: number; // en millions
  description: string;
  source: string;
}

export const POPULATION_IMMIGREE: PopulationCategorie[] = [
  {
    label: "Immigrés au sens INSEE",
    emoji: "🌍",
    population: 7.0,
    description:
      "Personnes nées étrangères à l'étranger et résidant en France. Définition INSEE : peut avoir acquis la nationalité française. Représente 10,4 % de la population.",
    source: "INSEE 2024",
  },
  {
    label: "Étrangers (nationalité étrangère)",
    emoji: "🛂",
    population: 5.4,
    description:
      "Résidents en France n'ayant pas la nationalité française. Inclut citoyens UE (~1,8 M) et hors UE (~3,6 M). Source : titres de séjour DGEF + INSEE.",
    source: "DGEF / INSEE 2024",
  },
  {
    label: "Personnes en situation irrégulière (estimation)",
    emoji: "❓",
    population: 0.7,
    description:
      "Estimation Cour des comptes 2020 (entre 600 000 et 900 000). Impossible à mesurer précisément. La plupart sont entrés régulièrement puis maintenus après expiration de leur titre.",
    source: "Cour des comptes 2020 (estimation)",
  },
  {
    label: "Descendants d'immigrés (2ᵉ génération)",
    emoji: "👨‍👩‍👧",
    population: 7.5,
    description:
      "Personnes nées en France d'au moins un parent immigré. Français de naissance. Souvent inclus dans les statistiques internationales mais ne sont pas « immigrés » au sens français.",
    source: "INSEE Trajectoires et Origines 2",
  },
];

// ============================================================================
// Flux annuels : entrées, asile, départs
// ============================================================================

export interface FluxAnnuel {
  label: string;
  emoji: string;
  valeurAnnuelle: number;
  description: string;
  source: string;
}

export const FLUX_ANNUELS: FluxAnnuel[] = [
  {
    label: "Titres de séjour délivrés (1ʳᵉ délivrance)",
    emoji: "📄",
    valeurAnnuelle: 338000,
    description:
      "Premières admissions au séjour en 2023. Répartition principale : économique 53 000, familial 95 000, étudiant 110 000, humanitaire 36 000, divers 44 000.",
    source: "DGEF 2024",
  },
  {
    label: "Demandes d'asile déposées",
    emoji: "🛟",
    valeurAnnuelle: 137500,
    description:
      "Demandes enregistrées OFPRA 2023 (+10 % vs 2022). Taux de protection (asile + protection subsidiaire) : ~30 % après recours CNDA.",
    source: "OFPRA 2024",
  },
  {
    label: "Acquisitions de nationalité française",
    emoji: "🇫🇷",
    valeurAnnuelle: 65000,
    description:
      "Décrets de naturalisation + déclarations (mariage, jeunes nés en France). Procédure 18-24 mois en moyenne.",
    source: "DGEF 2024",
  },
  {
    label: "OQTF (Obligation Quitter le Territoire)",
    emoji: "✈️",
    valeurAnnuelle: 137000,
    description:
      "OQTF prononcées en 2023. Taux d'exécution (départs effectifs) : ~7 %. Reste un débat politique important.",
    source: "DGEF 2024, rapport Sénat",
  },
  {
    label: "Solde migratoire net France",
    emoji: "↔️",
    valeurAnnuelle: 161000,
    description:
      "Entrées - sorties. France : ~+161 000/an. Comparaison : Allemagne +900 000/an (2023, sortie Covid), Italie +280 000, Espagne +330 000.",
    source: "INSEE Bilan démographique 2024",
  },
];

// ============================================================================
// Coûts budgétaires directs
// ============================================================================

export interface CoutBudgetaire {
  id: string;
  poste: string;
  emoji: string;
  montantMdEur: number;
  ministere: string;
  description: string;
  source: string;
}

export const COUTS_BUDGETAIRES: CoutBudgetaire[] = [
  {
    id: "ame",
    poste: "Aide Médicale d'État (AME)",
    emoji: "🏥",
    montantMdEur: 1.2,
    ministere: "Ministère de la Santé",
    description:
      "Couvre les soins médicaux des étrangers en situation irrégulière depuis 3 mois. ~430 000 bénéficiaires en 2023. Sujet politique récurrent (proposition restriction à panier de soins urgents). Mais utile pour santé publique (épidémies, urgences).",
    source: "PLFSS 2025, DREES",
  },
  {
    id: "ada",
    poste: "Allocation Demandeur d'Asile (ADA)",
    emoji: "💶",
    montantMdEur: 0.5,
    ministere: "Ministère de l'Intérieur",
    description:
      "Versée pendant la procédure asile (6,80 €/jour + hébergement). ~80 000 bénéficiaires. Conditions strictes, supprimée 1 mois après refus définitif.",
    source: "OFII rapport 2024",
  },
  {
    id: "ofpra-cnda",
    poste: "OFPRA + CNDA (instruction asile)",
    emoji: "⚖️",
    montantMdEur: 0.15,
    ministere: "Ministère de l'Intérieur + Justice",
    description:
      "Instruction des demandes d'asile (OFPRA) + recours (CNDA). Délais : ~5 mois OFPRA, 6 mois CNDA. Renforcement effectifs en 2023 (recrutement 200 agents).",
    source: "OFPRA, CNDA rapports 2024",
  },
  {
    id: "ofii",
    poste: "OFII (intégration, primo-accueil)",
    emoji: "🤝",
    montantMdEur: 0.25,
    ministere: "Ministère de l'Intérieur",
    description:
      "Contrats d'Intégration Républicaine (CIR), formation linguistique (~700h pour primo-arrivants), formation civique, accompagnement insertion. ~110 000 CIR signés/an.",
    source: "OFII rapport 2024",
  },
  {
    id: "cra-frontieres",
    poste: "CRA + frontières + rétention",
    emoji: "🚧",
    montantMdEur: 0.4,
    ministere: "Ministère de l'Intérieur",
    description:
      "26 Centres de Rétention Administrative (capacité 2 200 places). Surveillance frontières (PAF, Frontex). Coût rétention/jour/personne : ~85 €. Coût retour forcé : 4-7 K€ par personne.",
    source: "Cour des comptes 2020, DGEF",
  },
  {
    id: "mna",
    poste: "Mineurs Non Accompagnés (MNA)",
    emoji: "👦",
    montantMdEur: 2.0,
    ministere: "Départements (ASE)",
    description:
      "~40 000 MNA pris en charge par l'Aide Sociale à l'Enfance. Compétence département (50-90 K€/an/jeune). Sujet sensible : qui est mineur, qui est majeur ? Coût en hausse +30 % en 5 ans.",
    source: "ADF, ministère Justice 2024",
  },
  {
    id: "asyl-heberg",
    poste: "Hébergement demandeurs d'asile (CADA, HUDA)",
    emoji: "🏠",
    montantMdEur: 0.8,
    ministere: "Ministère de l'Intérieur",
    description:
      "Centres d'Accueil pour Demandeurs d'Asile (CADA, ~50 000 places) + Hébergement d'Urgence (HUDA). Renforcement post-2015 pour absorber l'afflux. Manque structurel ~30 000 places.",
    source: "OFII, FAS 2024",
  },
  {
    id: "frontex",
    poste: "Contribution Frontex + opérations UE",
    emoji: "🌊",
    montantMdEur: 0.1,
    ministere: "Ministère de l'Intérieur",
    description:
      "Contribution française à l'Agence européenne de garde-frontières. Budget Frontex UE 2024 : 845 M€, France contribue ~15 %.",
    source: "Frontex, Commission UE",
  },
  {
    id: "scolarite",
    poste: "Scolarité enfants étrangers/immigrés",
    emoji: "📚",
    montantMdEur: 1.5,
    ministere: "Éducation nationale",
    description:
      "Estimation indicative : ~300 000 élèves allophones ou primo-arrivants, coût ~5 000 €/élève/an (UPE2A, soutien linguistique). Périmètre flou : inclure tous les élèves d'origine étrangère gonflerait à plusieurs Md€, mais ce sont des Français de naissance pour la majorité.",
    source: "DEPP, estimation indicative",
  },
];

// ============================================================================
// Recettes / contributions des immigrés au budget
// ============================================================================

export interface ContributionFiscale {
  poste: string;
  emoji: string;
  montantMdEur: number;
  description: string;
  source: string;
}

export const CONTRIBUTIONS_IMMIGRES: ContributionFiscale[] = [
  {
    poste: "Cotisations sociales versées (employeurs + salariés)",
    emoji: "💼",
    montantMdEur: 35.0,
    description:
      "Estimation : les ~2,5 millions d'immigrés en emploi versent des cotisations sociales proportionnelles à leur salaire moyen (~80 % du salaire moyen national). Source : étude France Stratégie 2023.",
    source: "France Stratégie 2023",
  },
  {
    poste: "Impôt sur le revenu + CSG",
    emoji: "📊",
    montantMdEur: 4.0,
    description:
      "Étude IPP : ~30 % des immigrés en emploi paient l'IR (vs 50 % de la population générale), salaires médians inférieurs.",
    source: "IPP 2022",
  },
  {
    poste: "TVA et impôts indirects",
    emoji: "🛒",
    montantMdEur: 8.0,
    description:
      "Les immigrés consomment et paient la TVA comme tout résident. Estimation pondérée par revenu moyen et population.",
    source: "OFCE 2018, INSEE comptes ménages",
  },
  {
    poste: "Taxes locales (taxe foncière, ex-TH)",
    emoji: "🏠",
    montantMdEur: 1.5,
    description:
      "Les immigrés propriétaires (taux propriété ~35 % vs 58 % moyenne nationale) paient leur taxe foncière.",
    source: "INSEE Logement 2023",
  },
];

// ============================================================================
// Études économiques sur le solde net
// ============================================================================

export interface EtudeEconomique {
  source: string;
  annee: string;
  conclusion: string;
  resume: string;
  url: string;
}

export const ETUDES_SOLDE_NET: EtudeEconomique[] = [
  {
    source: "OCDE — Perspectives des migrations internationales",
    annee: "2013, mises à jour",
    conclusion: "+0,4 % du PIB (contribution nette positive)",
    resume:
      "Étude transnationale sur 27 pays OCDE. Pour la France : contribution nette des immigrés au budget positive sur 50 ans, surtout via les actifs en emploi. Méthode : recettes - dépenses publiques attribuées par personne.",
    url: "https://www.oecd.org/migration/imo.htm",
  },
  {
    source: "France Stratégie — Immigration et intégration",
    annee: "2023",
    conclusion: "Quasi-neutre à long terme",
    resume:
      "Étude française dédiée. Effet budgétaire net dépend fortement de l'intégration sur le marché du travail. Si plein emploi des immigrés : positif ~+0,5 % PIB. Si chômage élevé : légèrement négatif ~-0,2 % PIB.",
    url: "https://www.strategie.gouv.fr",
  },
  {
    source: "IPP — étude Bachelet",
    annee: "2018",
    conclusion: "Solde proche de zéro",
    resume:
      "Étude économétrique avec micro-simulation. Résultat : le solde net immigration en France est très proche de zéro à l'échelle d'une carrière complète. Les jeunes actifs contribuent positivement, les retraités plus tard reprennent l'équivalent.",
    url: "https://www.ipp.eu",
  },
  {
    source: "Observatoire de l'immigration",
    annee: "2024",
    conclusion: "Coût net 30-35 Md€/an selon hypothèses larges",
    resume:
      "Estimation incluant coûts indirects (logement social, scolaire, justice, sécurité, santé étendue) et méthodologie différente. Chiffrage contesté par les économistes mainstream.",
    url: "https://www.observatoire-immigration.fr",
  },
];

// ============================================================================
// Mythes à démonter (les deux côtés du débat)
// ============================================================================

export const MYTHES_IMMIGRATION = [
  {
    mythe: "« L'immigration coûte X Md€ à la France »",
    realite:
      "INCOMPLET. Les chiffres-chocs (30 Md€, 40 Md€, etc.) ne présentent que les COÛTS sans les RECETTES. Quand on ajoute cotisations sociales (~35 Md€), IR/CSG (~4 Md€), TVA (~8 Md€) versés par les immigrés en emploi, le solde net est proche de zéro selon France Stratégie et IPP, légèrement positif selon l'OCDE. Le débat sérieux porte sur les méthodologies, pas sur des chiffres bruts isolés.",
  },
  {
    mythe: "« Tous les étrangers sont sans-papiers »",
    realite:
      "FAUX. Sur ~5,4 millions d'étrangers résidant en France, ~700 000 seulement seraient en situation irrégulière (estimation Cour des comptes 2020). Les 4,7 millions restants disposent d'un titre de séjour valide ou sont citoyens de l'Union européenne.",
  },
  {
    mythe: "« L'AME coûte une fortune »",
    realite:
      "À NUANCER. L'AME (1,2 Md€/an) bénéficie à ~430 000 personnes. Coût/bénéficiaire ~2 800 €/an, soit moins que le coût moyen Sécu (~3 800 €). Argument santé publique majeur : sans AME, les personnes irrégulières arrivent en urgences à un stade aggravé, plus coûteux. Cour des comptes : « réformer mais pas supprimer ».",
  },
  {
    mythe: "« Les OQTF ne servent à rien »",
    realite:
      "PARTIELLEMENT VRAI. Le taux d'exécution des OQTF est de ~7 %. Causes : absence de laissez-passer consulaires (40 %), titres consulaires non délivrés par pays d'origine, recours juridictionnels longs. Pas un problème de volonté politique mais de coopération internationale.",
  },
  {
    mythe: "« L'immigration explose en France »",
    realite:
      "À RELATIVISER. La France a un solde migratoire net de +161 000/an. C'est largement moins que l'Allemagne (+900 000 post-Covid), l'Espagne (+330 000), ou l'Italie (+280 000). La France est dans la moyenne basse OCDE en termes de migration nette par habitant.",
  },
  {
    mythe: "« L'immigration sauve la démographie française »",
    realite:
      "PARTIELLEMENT VRAI. La France maintient ses naissances grâce à sa fécondité (1,68 enfant/femme en 2023, supérieure à l'Allemagne 1,46 ou l'Italie 1,20). L'immigration contribue à ~+0,3 point de fécondité (étude INED). Sans immigration, la pyramide des âges serait plus déséquilibrée mais le déclin ne serait pas immédiat.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TOTAL_COUTS_DIRECTS = COUTS_BUDGETAIRES.reduce(
  (acc, c) => acc + c.montantMdEur,
  0,
);
export const TOTAL_CONTRIBUTIONS = CONTRIBUTIONS_IMMIGRES.reduce(
  (acc, c) => acc + c.montantMdEur,
  0,
);
export const POPULATION_IMMIGREE_TOTALE_M = 7.0;
export const POPULATION_FRANCE_M = 68.4;
export const PART_IMMIGRES_PCT = (POPULATION_IMMIGREE_TOTALE_M / POPULATION_FRANCE_M) * 100;
