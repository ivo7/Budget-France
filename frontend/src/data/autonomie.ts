// ============================================================================
// autonomie.ts — 5ᵉ branche, EHPAD, APA, PCH, reste à charge familles
// ============================================================================
//
// Sources principales (toutes publiques) :
//   - CNSA (Caisse Nationale de Solidarité pour l'Autonomie) — rapports annuels
//   - DREES — études aide sociale, EHPAD, dépendance
//   - Cour des comptes — rapport « Politique de la dépendance » (2022)
//     et « EHPAD : un modèle à bout de souffle » (2024)
//   - Libault — rapport « Grand âge et autonomie » (2019), référence du
//     débat public sur le financement
//   - IGAS — rapports inspection EHPAD (post-Castanet 2022)
//   - HCFEA (Haut Conseil de la Famille, de l'Enfance et de l'Âge) —
//     projections démographiques et besoins financement
//   - INSEE — projections démographiques
//   - DSS — comptes de la Sécurité sociale (5ᵉ branche)
//
// ⚠ Périmètre : autonomie = grand âge + handicap. La 5ᵉ branche couvre les
// deux. La majorité des dépenses est aujourd'hui sur le grand âge (~70 %).
// Le « mur démographique » 2025-2050 est la donnée structurante de la page.

// ============================================================================
// Populations concernées
// ============================================================================

export interface PopulationAutonomie {
  label: string;
  emoji: string;
  population: number; // en millions
  description: string;
  source: string;
}

export const POPULATIONS_AUTONOMIE: PopulationAutonomie[] = [
  {
    label: "Personnes 75 ans et +",
    emoji: "👵",
    population: 6.5,
    description:
      "6,5 M en 2024, soit ~10 % de la population. Projection : 11 M en 2050 (+70 %). C'est la donnée démographique structurante : il faudra +1 M de places ou solutions de maintien à domicile.",
    source: "INSEE projections 2024",
  },
  {
    label: "Personnes en perte d'autonomie (GIR 1-4)",
    emoji: "🦯",
    population: 1.3,
    description:
      "Bénéficiaires de l'APA : 1,3 M de personnes âgées dépendantes (Grille AGGIR niveaux 1 à 4). 60 % à domicile, 40 % en EHPAD. Projection HCFEA : 2,2 M en 2050.",
    source: "CNSA, DREES 2024",
  },
  {
    label: "Résidents en EHPAD",
    emoji: "🏥",
    population: 0.6,
    description:
      "~600 000 résidents en EHPAD (Établissement d'Hébergement pour Personnes Âgées Dépendantes). Âge moyen entrée : 86 ans. Durée moyenne séjour : ~2,5 ans (en baisse car entrées plus tardives).",
    source: "DREES EHPAD 2024",
  },
  {
    label: "Adultes handicapés (AAH bénéficiaires)",
    emoji: "♿",
    population: 1.3,
    description:
      "1,3 M de bénéficiaires de l'Allocation Adultes Handicapés (AAH). Une partie touche aussi la PCH (Prestation de Compensation du Handicap). Volet handicap de la 5ᵉ branche.",
    source: "DREES, CNAF 2024",
  },
  {
    label: "Aidants familiaux",
    emoji: "🤝",
    population: 11.0,
    description:
      "~11 M de Français aident régulièrement un proche en perte d'autonomie (DREES). Économie « invisible » estimée à ~150 Md€/an si valorisée (Banque Mondiale, EuropAid). Question politique : reconnaissance et compensation.",
    source: "DREES 2021, CNSA",
  },
];

// ============================================================================
// Dépenses publiques autonomie
// ============================================================================

export type CategorieAutonomie =
  | "soins"
  | "hebergement"
  | "domicile"
  | "handicap"
  | "credit-impot"
  | "investissement";

export const CATEGORIES_AUTONOMIE: Record<
  CategorieAutonomie,
  { label: string; color: string }
> = {
  soins: { label: "Soins (Assurance maladie)", color: "#0ea5e9" },
  hebergement: { label: "Hébergement EHPAD", color: "#a855f7" },
  domicile: { label: "Maintien à domicile", color: "#10b981" },
  handicap: { label: "Handicap", color: "#f59e0b" },
  "credit-impot": { label: "Crédits d'impôt", color: "#ec4899" },
  investissement: { label: "Investissement", color: "#06b6d4" },
};

export interface DepenseAutonomie {
  id: string;
  poste: string;
  emoji: string;
  categorie: CategorieAutonomie;
  montantMdEur: number;
  financeur: string;
  description: string;
  source: string;
}

export const DEPENSES_AUTONOMIE: DepenseAutonomie[] = [
  {
    id: "soins-ehpad",
    poste: "Soins en EHPAD (Assurance Maladie)",
    emoji: "💊",
    categorie: "soins",
    montantMdEur: 12.0,
    financeur: "Sécurité sociale (CNAM)",
    description:
      "Forfait soins versé par l'Assurance Maladie aux EHPAD. Couvre médicaments, infirmières, médecin coordonnateur, kiné. ~20 000 € par résident/an. NB : ne couvre PAS l'hébergement (chambre, repas, animation).",
    source: "DSS, CNSA 2024",
  },
  {
    id: "apa",
    poste: "APA (Allocation Personnalisée d'Autonomie)",
    emoji: "🤲",
    categorie: "domicile",
    montantMdEur: 6.7,
    financeur: "Départements (30 %) + CNSA (70 %)",
    description:
      "Aide aux personnes en GIR 1-4. 1,4 M bénéficiaires. Plafonds : ~750 €/mois en GIR 4 jusqu'à ~1 900 €/mois en GIR 1. Reste à charge selon revenus.",
    source: "DREES 2024, CNSA",
  },
  {
    id: "ash",
    poste: "ASH (Aide Sociale Hébergement EHPAD)",
    emoji: "🏠",
    categorie: "hebergement",
    montantMdEur: 2.0,
    financeur: "Départements",
    description:
      "Aide aux résidents EHPAD ne pouvant payer le tarif hébergement (~70 €/jour en moyenne). Récupération sur succession après décès (créance), ce qui dissuade certaines familles.",
    source: "DREES 2024",
  },
  {
    id: "pch",
    poste: "PCH (Prestation Compensation Handicap)",
    emoji: "♿",
    categorie: "handicap",
    montantMdEur: 2.7,
    financeur: "Départements + CNSA",
    description:
      "Aide humaine, technique, aménagement logement et véhicule pour personnes handicapées. ~370 000 bénéficiaires. Volet handicap de la 5ᵉ branche.",
    source: "DREES 2024, CNSA",
  },
  {
    id: "aah",
    poste: "AAH (Allocation Adulte Handicapé)",
    emoji: "💶",
    categorie: "handicap",
    montantMdEur: 12.5,
    financeur: "État (CAF)",
    description:
      "1,3 M bénéficiaires. Montant max ~1 016 €/mois (2024). Déconjugalisation effective depuis octobre 2023 (avancée majeure : ne tient plus compte des revenus du conjoint).",
    source: "CNAF, PLF 2025",
  },
  {
    id: "esms-handicap",
    poste: "ESMS handicap (IME, ESAT, FAM, MAS)",
    emoji: "🏫",
    categorie: "handicap",
    montantMdEur: 11.0,
    financeur: "Assurance Maladie (CNSA) + Départements",
    description:
      "Établissements et services médico-sociaux pour personnes handicapées : ~150 000 places. Forte demande non couverte (~20 000 en liste d'attente, ~5 000 Français placés en Belgique faute de place).",
    source: "DREES, CNSA 2024",
  },
  {
    id: "credit-impot-domicile",
    poste: "Crédit d'impôt emploi à domicile",
    emoji: "🏡",
    categorie: "credit-impot",
    montantMdEur: 5.0,
    financeur: "État (manque à gagner fiscal)",
    description:
      "Crédit d'impôt 50 % des dépenses d'emploi à domicile (plafond 12 000 € → 15 000 €). ~4,5 M de ménages bénéficiaires. Inclut aide à la personne âgée/handicapée. Bénéficie aussi aux ménages aisés (effet « anti-redistributif » selon Cour des comptes).",
    source: "PLF 2025, DGFiP",
  },
  {
    id: "saad-ssiad",
    poste: "SAAD/SSIAD (services à domicile aidés)",
    emoji: "🚪",
    categorie: "domicile",
    montantMdEur: 3.5,
    financeur: "CNSA + Sécu + Départements",
    description:
      "Services d'Aide et d'Accompagnement à Domicile (SAAD) et Services de Soins Infirmiers à Domicile (SSIAD). Tarification mixte. Pénurie chronique d'aides à domicile (~30 000 postes non pourvus selon DARES).",
    source: "DREES, CNSA",
  },
  {
    id: "investissement-ehpad",
    poste: "Plan investissement EHPAD (Ségur)",
    emoji: "🏗️",
    categorie: "investissement",
    montantMdEur: 1.5,
    financeur: "État + CNSA",
    description:
      "Plan Ségur 2021-2025 : 2,1 Md€ pour rénover et créer des places EHPAD. Linéarisé ~1,5 Md€/an pendant la période. Largement insuffisant selon Libault (besoin ~50 Md€ pour adapter le parc).",
    source: "DGCS, CNSA",
  },
  {
    id: "carte-mobilite",
    poste: "Cartes mobilité, transport adapté, allocations diverses",
    emoji: "🚐",
    categorie: "handicap",
    montantMdEur: 1.5,
    financeur: "Départements + Régions + État",
    description:
      "Transport adapté, carte mobilité inclusion (CMI), majoration vie autonome, frais accompagnement scolaire (AESH). Périmètre éclaté entre plusieurs financeurs.",
    source: "DREES, ADF",
  },
];

// ============================================================================
// Reste à charge des familles
// ============================================================================

export interface ResteACharge {
  scenario: string;
  emoji: string;
  montantMensuel: number; // €/mois
  description: string;
  source: string;
}

export const RESTE_A_CHARGE_FAMILLES: ResteACharge[] = [
  {
    scenario: "EHPAD privé commercial (grande métropole)",
    emoji: "💸",
    montantMensuel: 3500,
    description:
      "Tarif moyen 110 €/jour hébergement + dépendance. ~3 300 € à 4 200 €/mois selon ville. Public visé : ~10 % des résidents les plus aisés ou héritage familial.",
    source: "Cour des comptes 2024, CNSA",
  },
  {
    scenario: "EHPAD privé non-lucratif / associatif",
    emoji: "🏠",
    montantMensuel: 2200,
    description:
      "Tarif moyen 75-85 €/jour. Cible classe moyenne. Reste à charge ~2 200 €/mois après APA. ~30 % du parc EHPAD.",
    source: "CNSA 2024",
  },
  {
    scenario: "EHPAD public",
    emoji: "🏛️",
    montantMensuel: 1900,
    description:
      "Tarif moyen 60-75 €/jour. ~45 % du parc. Reste à charge ~1 900 €/mois après APA. Souvent inaccessible faute de places (listes d'attente).",
    source: "DREES, FHF 2024",
  },
  {
    scenario: "Maintien à domicile (GIR 2-3, 4h/jour aide)",
    emoji: "🏡",
    montantMensuel: 800,
    description:
      "Après APA et crédit d'impôt : ~800 €/mois reste à charge pour 4-5h d'aide quotidienne. Mais 80 % des aides sont assurées par les aidants familiaux (gratuit pour la collectivité, coût caché pour les proches).",
    source: "DREES, estimation centrale",
  },
];

// ============================================================================
// Études économiques principales
// ============================================================================

export interface EtudeAutonomie {
  source: string;
  annee: string;
  conclusion: string;
  resume: string;
  url: string;
}

export const ETUDES_AUTONOMIE: EtudeAutonomie[] = [
  {
    source: "Libault — « Grand âge et autonomie »",
    annee: "2019",
    conclusion: "Besoin +9 Md€/an d'ici 2030 pour le grand âge",
    resume:
      "Rapport fondateur du débat. 175 propositions. Chiffre central : +9 Md€/an d'ici 2030, dont 6 Md€ EHPAD (rénovation, ratio agents) et 3 Md€ domicile (APA, professionnalisation). Diagnostic toujours d'actualité 5 ans après. Mise en œuvre partielle (création 5ᵉ branche en 2020).",
    url: "https://solidarites.gouv.fr/grand-age-le-temps-dagir",
  },
  {
    source: "Cour des comptes — Politique de la dépendance",
    annee: "2022",
    conclusion: "Gouvernance fragmentée, financement insuffisant",
    resume:
      "Multiples financeurs (État, Sécu, départements, CNSA, ménages) créent une gestion peu lisible. Recommande un pilotage clarifié et une trajectoire financière. La 5ᵉ branche ne suffit pas.",
    url: "https://www.ccomptes.fr",
  },
  {
    source: "Cour des comptes — EHPAD : modèle à bout de souffle",
    annee: "2024",
    conclusion: "Modèle EHPAD à repenser, transparence à imposer",
    resume:
      "Post-affaire Orpea (« Les Fossoyeurs », Castanet 2022). Constate : ratio personnel/résident insuffisant, reste à charge incompatible avec les retraites moyennes, opacité de certains groupes privés. Préconise un contrôle renforcé et un plafonnement des dividendes.",
    url: "https://www.ccomptes.fr",
  },
  {
    source: "HCFEA — projections démographiques",
    annee: "2023",
    conclusion: "+1 M places/solutions à créer d'ici 2050",
    resume:
      "Projections du Haut Conseil de la Famille, de l'Enfance et de l'Âge. À démographie constante (sans nouvelle politique), il faudra : +200 000 places EHPAD, +500 000 places de service à domicile renforcé, +300 000 aidants professionnels.",
    url: "https://www.strategie.gouv.fr/conseils/haut-conseil-de-famille-enfance-et-age",
  },
  {
    source: "DREES — projection dépenses dépendance",
    annee: "2024",
    conclusion: "Dépenses publiques x2 d'ici 2050 (de 30 à 60 Md€/an)",
    resume:
      "Projection officielle : les dépenses publiques d'autonomie passeraient de ~1,5 % du PIB en 2024 à ~2,8 % en 2050 si on maintient le niveau de couverture actuel. Si on l'améliore (recommandations Libault) : ~3,5 %.",
    url: "https://drees.solidarites-sante.gouv.fr",
  },
];

// ============================================================================
// Mythes à confronter
// ============================================================================

export const MYTHES_AUTONOMIE = [
  {
    mythe: "« En EHPAD, c'est entièrement remboursé »",
    realite:
      "FAUX. La Sécurité sociale ne couvre QUE le forfait soins (~80 €/jour). L'hébergement (chambre, repas, animation) reste à la charge du résident : 60-110 €/jour selon l'établissement. Reste à charge moyen : 1 900 € à 3 500 €/mois selon le type d'EHPAD. La retraite moyenne (~1 500 €/mois) ne suffit généralement PAS : les familles complètent ou puisent dans l'épargne.",
  },
  {
    mythe: "« La 5ᵉ branche a réglé le problème du financement »",
    realite:
      "INSUFFISANT. La 5ᵉ branche (créée en 2020) collecte ~38 Md€/an via une fraction de CSG. Elle a permis de réunifier le pilotage (CNSA). Mais le besoin Libault est de +9 Md€/an supplémentaires. La trajectoire financière prévue par la branche reste en dessous de ce besoin selon la Cour des comptes 2024.",
  },
  {
    mythe: "« Les EHPAD privés sont plus chers ET moins bien »",
    realite:
      "À NUANCER. Privé commercial : tarif élevé (~3 500 €/mois RAC), qualité variable selon les groupes (affaire Orpea). Privé associatif : tarif moyen (~2 200 €), qualité souvent supérieure (effet mission). Public : tarif modéré (~1 900 €), souvent saturé et avec des moyens contraints. Le débat « privé/public » masque une question plus profonde : ratio agents/résident (~0,3 France vs 0,5-0,7 pays nordiques).",
  },
  {
    mythe: "« Le maintien à domicile coûte moins cher à l'État »",
    realite:
      "VARIABLE. Vrai pour GIR 4 (faible perte d'autonomie) : ~500 €/mois aides publiques vs ~2 500 €/mois en EHPAD public. Plus discutable pour GIR 1-2 : ~3 000 €/mois aides nécessaires (sans compter aidants familiaux). Et coût caché pour les aidants : perte de revenus, santé. La Banque Mondiale estime à ~150 Md€/an la valeur économique de l'aide informelle.",
  },
  {
    mythe: "« La CSG sur les retraites finance déjà tout »",
    realite:
      "INCOMPLET. La CSG sur les retraites rapporte ~28 Md€/an (taux 8,3 % au-delà d'un certain revenu). Une fraction (~32 % du taux) finance la 5ᵉ branche. Total fléché autonomie via CSG : ~10 Md€. Le reste vient de la CSA (Contribution Solidarité Autonomie, ~3 Md€) et des transferts de la CADES (vers la 5ᵉ branche à partir de 2024 : ~2,5 Md€/an). Total recettes 5ᵉ branche : ~38 Md€, en dessous des besoins.",
  },
  {
    mythe: "« Il manque juste quelques milliers de soignants »",
    realite:
      "FAUX, STRUCTUREL. La Cour des comptes 2024 estime à 100 000-200 000 le nombre d'équivalents temps plein manquants tous secteurs autonomie confondus (EHPAD + domicile + handicap). Causes : salaires bas (SMIC ou proche), conditions de travail dégradées, manque d'attractivité du secteur. Le Ségur 2021 a apporté +183 €/mois aux soignants mais sans résoudre l'équation salaire/charge de travail.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TOTAL_DEPENSES_AUTONOMIE_MD = DEPENSES_AUTONOMIE.reduce(
  (acc, d) => acc + d.montantMdEur,
  0,
);
export const BUDGET_5E_BRANCHE_MD = 38.0; // CNSA 2024
export const BESOIN_ADDITIONNEL_LIBAULT_MD = 9.0; // d'ici 2030
export const DEPENSES_PROJECTION_2050_MD = 60.0; // DREES projection
export const PROJECTION_75_PLUS_2050 = 11.0; // millions
export const POPULATION_75_PLUS_2024 = 6.5; // millions
