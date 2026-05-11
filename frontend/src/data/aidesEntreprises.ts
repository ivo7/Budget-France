// ============================================================================
// aidesEntreprises.ts — aides publiques aux entreprises en France (~100 Md€/an)
// ============================================================================
//
// Source principale : France Stratégie — rapport « Les aides publiques aux
// entreprises : pour quoi faire ? » (2024), Cour des comptes, BPI France
// rapports annuels, PLF 2025 (Voies et moyens tome II), DGFiP, ACOSS.
//
// Périmètre : aides versées par l'État, les opérateurs (BPI, ADEME, ANR),
// et les collectivités (régions, communes). Estimation totale ~100-150 Md€/an
// selon le périmètre (Cour des comptes : 110 Md€ en 2024, France Stratégie
// estime jusqu'à 200 Md€ si on inclut tous les transferts indirects).
//
// Convention :
//   - Tous les montants en Md€/an (sauf si précisé)
//   - Données 2023-2024 (sources publiées 2024-2025)
//   - Estimations indicatives — la consolidation exacte des aides aux
//     entreprises est notoirement difficile (10+ administrations différentes)

export type CategorieAide =
  | "competitivite-charges"
  | "innovation-rd"
  | "emploi-formation"
  | "transition-ecologique"
  | "sectoriel"
  | "territorial"
  | "crise-conjoncturel";

export interface Aide {
  id: string;
  nom: string;
  abbr?: string;
  emoji: string;
  /** Coût annuel État + collectivités en Md€ */
  coutMdEur: number;
  categorie: CategorieAide;
  /** Forme du soutien : crédit d'impôt, subvention, prêt garanti, allègement de cotisations… */
  forme: string;
  beneficiaires: string;
  description: string;
  justification?: string;
  evaluation?: string;
  source: string;
}

// ============================================================================
// Dispositifs majeurs (top 20)
// ============================================================================

export const AIDES_ENTREPRISES: Aide[] = [
  {
    id: "allegements-bas-salaires",
    nom: "Allègements généraux de cotisations sociales (« réduction Fillon »)",
    abbr: "RGCS",
    emoji: "💼",
    coutMdEur: 76.0,
    categorie: "competitivite-charges",
    forme: "Exonération de cotisations patronales",
    beneficiaires:
      "Toutes entreprises (privé), pour les salaires entre 1 et 1,6 SMIC. Concentré sur ~6 millions de salariés bas/moyens revenus.",
    description:
      "Le plus gros poste d'aides aux entreprises en volume. Allègement dégressif des cotisations patronales (URSSAF) sur les salaires inférieurs à 1,6 SMIC, créé en 2003 (Fillon). Plus le salaire est bas, plus l'allègement est important. Cumule la « réduction Fillon » historique et le bandeau CICE/CITS transformé en allègements pérennes depuis 2019.",
    justification:
      "Réduire le coût du travail des bas salaires pour préserver l'emploi peu qualifié face à la concurrence internationale et automatisation.",
    evaluation:
      "France Stratégie 2024 : impact emploi positif net (~200-400 K emplois sauvegardés selon hypothèses), mais effet pervers sur la trappe à bas salaires (sortir du 1,6 SMIC fait perdre l'avantage). Cour des comptes : à recibler ou supprimer progressivement au-dessus de 1,3 SMIC.",
    source: "ACOSS, PLF 2025, France Stratégie",
  },
  {
    id: "cir",
    nom: "Crédit Impôt Recherche",
    abbr: "CIR",
    emoji: "🔬",
    coutMdEur: 7.2,
    categorie: "innovation-rd",
    forme: "Crédit d'impôt sur les sociétés",
    beneficiaires:
      "Toutes entreprises engageant des dépenses R&D — concentré sur grands groupes (50 % du CIR pour 100 entreprises).",
    description:
      "30 % de crédit d'impôt sur les dépenses R&D jusqu'à 100 M€, 5 % au-delà. Plus grosse niche fiscale entreprises. Créé en 1983, élargi massivement en 2008.",
    justification:
      "Encourager la R&D privée (1,4 % du PIB en France vs 3 % en Allemagne).",
    evaluation:
      "Cour des comptes 2021 : « efficacité limitée pour les grands groupes ». IPP : effet positif pour PME, marginal pour grandes entreprises.",
    source: "Voies et moyens 2025, Cour des comptes 2021",
  },
  {
    id: "ci-emploi-domicile",
    nom: "Crédit impôt emploi à domicile (côté employeurs)",
    emoji: "🏠",
    coutMdEur: 6.4,
    categorie: "emploi-formation",
    forme: "Crédit d'impôt sur le revenu",
    beneficiaires:
      "Ménages employant des salariés à domicile. Bénéfice indirect : entreprises de services à la personne (~600 000 emplois).",
    description:
      "50 % crédit d'impôt sur dépenses emploi à domicile, plafonné à 6 000 €/an. Booste indirectement le secteur des services à la personne (entreprises et associations agréées).",
    justification:
      "Lutter contre le travail au noir, soutenir l'emploi peu qualifié.",
    evaluation:
      "France Stratégie 2024 : effet positif sur l'emploi déclaré, mais bénéfice fiscal très inégalement réparti (top décile capte 40 %).",
    source: "Voies et moyens 2025",
  },
  {
    id: "ci-tva-travaux",
    nom: "Taux réduit TVA travaux logement",
    emoji: "🔨",
    coutMdEur: 5.1,
    categorie: "competitivite-charges",
    forme: "Taux réduit de TVA",
    beneficiaires:
      "Indirectement le secteur du bâtiment (~1,2 M emplois, dont ~40 % artisans).",
    description:
      "TVA 10 % (vs 20 %) sur travaux d'amélioration et 5,5 % sur rénovation énergétique. Soutien massif au BTP via la baisse du prix final aux particuliers.",
    justification: "Soutien BTP, lutte contre travail dissimulé, transition énergétique.",
    evaluation:
      "Cour des comptes 2017 : effet emploi limité (effet d'aubaine), mais maintenu pour raisons sociales et soutien sectoriel.",
    source: "Voies et moyens 2025",
  },
  {
    id: "france-2030",
    nom: "France 2030 (plan d'investissement)",
    emoji: "🚀",
    coutMdEur: 11.0,
    categorie: "innovation-rd",
    forme: "Subventions + prêts à conditions favorables + prises de participation",
    beneficiaires:
      "Entreprises stratégiques : transition écologique, semi-conducteurs, hydrogène, nucléaire, médicaments, agro, transports décarbonés.",
    description:
      "Plan 54 Md€ sur 5 ans (2021-2027), géré par le Secrétariat Général pour l'Investissement (SGPI) en lien avec BPI France et ADEME. Successeur de France Relance (terminé 2022) et du PIA (programme investissements d'avenir).",
    justification:
      "Préparer la France aux défis stratégiques (souveraineté industrielle, technologies vertes, IA).",
    evaluation:
      "Trop tôt pour évaluation finale. France Stratégie : effet positif sur déploiement de quelques filières (hydrogène, batteries). Bilan complet attendu 2027.",
    source: "Secrétariat Général pour l'Investissement, BPI France",
  },
  {
    id: "bpi-prets-subventions",
    nom: "BPI France (prêts + subventions + garanties)",
    abbr: "BPI",
    emoji: "🏦",
    coutMdEur: 5.0,
    categorie: "innovation-rd",
    forme: "Prêts à taux préférentiel, subventions, garanties bancaires, participations",
    beneficiaires:
      "Toutes entreprises (TPE, PME, ETI, grands groupes). 60 % des aides BPI vont aux PME. ~80 000 entreprises soutenues par an.",
    description:
      "BPI France distribue ~10 Md€/an de prêts + garanties + ~3 Md€ subventions pures. Réseau régional (50+ implantations). Outil principal de la politique industrielle quotidienne. Le coût budgétaire effectif (subventions + différentiel taux prêts) ≈ 5 Md€/an.",
    justification:
      "Financer la croissance des entreprises mal servies par le secteur bancaire privé (innovation, internationalisation, transmission).",
    evaluation:
      "France Stratégie 2024 : impact positif notable sur survie et croissance des PME. Bilan plus mitigé sur les fonds propres (rendement faible vs alternative privée).",
    source: "BPI France rapport annuel, France Stratégie",
  },
  {
    id: "ci-apprentissage",
    nom: "Aide unique apprentissage + crédit d'impôt",
    emoji: "🎓",
    coutMdEur: 5.5,
    categorie: "emploi-formation",
    forme: "Aide forfaitaire à l'embauche + crédit d'impôt + exonération cotisations",
    beneficiaires:
      "Entreprises embauchant des apprentis. ~850 000 alternants en 2024 (vs 280 000 en 2017).",
    description:
      "Combinaison de plusieurs dispositifs : aide unique de 6 000 € la 1ʳᵉ année, crédit d'impôt 1 600 €/apprenti, exonération de cotisations salariales pour l'apprenti. Massivement renforcée depuis 2018 (loi Pénicaud, plan « 1 jeune 1 solution »).",
    justification:
      "Massifier l'alternance (objectif politique : 1 million d'apprentis d'ici 2027).",
    evaluation:
      "France Stratégie : impact positif net sur l'insertion des jeunes. Mais effet d'aubaine notable (~25 % des contrats auraient été signés sans aide).",
    source: "France Compétences, PLF 2025",
  },
  {
    id: "exo-pat-jei-zfu-zrr",
    nom: "Exonérations sectorielles (JEI, ZFU, ZRR)",
    emoji: "📍",
    coutMdEur: 0.8,
    categorie: "territorial",
    forme: "Exonération de cotisations sociales + IS",
    beneficiaires:
      "Jeunes Entreprises Innovantes (~5 000), entreprises en Zones Franches Urbaines (QPV), Zones de Revitalisation Rurale.",
    description:
      "Allègements ciblés sur zones défavorisées (urbaines et rurales) et jeunes entreprises innovantes. Exonération de cotisations patronales partielle pendant 5-8 ans + exonération IS partielle.",
    justification:
      "Lutter contre la désertification économique (rurale et péri-urbaine) et soutenir l'innovation.",
    evaluation:
      "France Stratégie 2020 : ZFU/ZRR effet limité (effet d'aubaine, déplacement). JEI : positif (insertion startups deeptech).",
    source: "Voies et moyens 2025, France Stratégie",
  },
  {
    id: "ci-investissement-outre-mer",
    nom: "Réductions IS / IR outre-mer (Girardin)",
    emoji: "🏝️",
    coutMdEur: 1.4,
    categorie: "territorial",
    forme: "Réduction d'IR + zone franche d'activité",
    beneficiaires:
      "Investisseurs particuliers via dispositif Girardin + entreprises actives en Guadeloupe, Martinique, Guyane, Réunion, Mayotte.",
    description:
      "Réduction d'IR jusqu'à 50 % d'investissement en outre-mer (Girardin industriel et logement), exonération partielle IS (zone franche d'activité), TVA réduite. Intermédiation par cabinets de défiscalisation.",
    justification:
      "Compenser surcoûts géographiques, soutien développement ultramarin.",
    evaluation:
      "Cour des comptes 2018 : effets contrastés. Avantages parfois captés par intermédiaires métropolitains.",
    source: "Voies et moyens 2025, Cour des comptes 2018",
  },
  {
    id: "ticpe-secteurs",
    nom: "Remboursements TICPE sectoriels (routiers, agriculteurs, BTP)",
    emoji: "⛽",
    coutMdEur: 2.4,
    categorie: "sectoriel",
    forme: "Remboursement partiel de la taxe carburant",
    beneficiaires:
      "Transport routier marchandises, agriculteurs, BTP, pêcheurs.",
    description:
      "Remboursement partiel TICPE sur gazole professionnel. ~1,2 Md€ routiers, ~0,9 Md€ agriculteurs, ~0,3 Md€ BTP + pêche.",
    justification:
      "Compétitivité des secteurs exposés à la concurrence européenne et internationale (cabotage routier).",
    evaluation:
      "Contradiction avec objectifs climat. Plusieurs rapports demandent suppression progressive (annoncée 2023, suspendue après crise agricole 2024).",
    source: "Voies et moyens 2025",
  },
  {
    id: "aides-regionales",
    nom: "Aides économiques régionales et locales",
    emoji: "🏛️",
    coutMdEur: 5.0,
    categorie: "territorial",
    forme: "Subventions, prêts d'honneur, garanties, foncier subventionné",
    beneficiaires:
      "PME, startups, entreprises s'implantant ou se développant sur le territoire régional.",
    description:
      "Les 13 régions versent chacune ~300-500 M€/an d'aides économiques directes (subventions création, ingénierie, garanties, foncier subventionné). Plus de 1 500 dispositifs locaux recensés par AIDES-TERRITOIRES. Couches multiples : régions + départements + EPCI.",
    justification:
      "Soutenir l'écosystème local, attirer entreprises sur le territoire, maintenir l'emploi.",
    evaluation:
      "Cour des comptes 2023 : empilement complexe, peu lisible pour les entreprises. Effort de consolidation via la plateforme « France Num » et « Place des Entreprises ».",
    source: "Régions de France, ANCT",
  },
  {
    id: "fonds-vert",
    nom: "Fonds vert + aides ADEME entreprises",
    emoji: "🌱",
    coutMdEur: 2.5,
    categorie: "transition-ecologique",
    forme: "Subventions investissement vert",
    beneficiaires:
      "Entreprises engageant des investissements de transition écologique : rénovation énergétique sites, mobilité décarbonée, économie circulaire.",
    description:
      "Mix de Fonds vert (1,5 Md€/an), aides ADEME entreprises (~0,5 Md€), MaPrimeRénov' entreprises (marginal), aides France Relance résiduelles. Outils principaux : Tremplin (subvention décarbonation TPE/PME), Diag Décarbon'Action, prêts verts BPI.",
    justification:
      "Atteindre les objectifs climat France (SNBC, Fit for 55 UE).",
    evaluation:
      "Trop tôt. Décaissements actuels << ambition affichée. Tensions sur fléchage et complexité des appels à projets.",
    source: "ADEME, Ministère Transition Écologique",
  },
  {
    id: "guichet-unique",
    nom: "Reste : niches sectorielles, sociales, professionnelles",
    emoji: "📦",
    coutMdEur: 4.5,
    categorie: "sectoriel",
    forme: "Divers (crédit d'impôt cinéma, audiovisuel, livres, vidéo, métiers d'art…)",
    beneficiaires:
      "Secteurs spécifiques : audiovisuel, presse, édition, vidéo, métiers d'art, mode, gastronomie, hôtellerie.",
    description:
      "Long tail de dispositifs sectoriels : crédit d'impôt cinéma (0,3 Md€), audiovisuel (0,2), jeux vidéo (0,1), Production phonographique (0,03), Métiers d'art, Mode, etc. Cumulés : ~4-5 Md€ sur ~150 dispositifs.",
    justification:
      "Soutien sectoriel ciblé : « exception culturelle », filières d'avenir, patrimoine.",
    evaluation:
      "Évaluations hétérogènes. Certains crédits sectoriels (cinéma, jeux vidéo) sont défendus par les filières comme indispensables face à concurrence US/UK.",
    source: "Voies et moyens 2025",
  },
];

// ============================================================================
// Catégories — métadonnées pour l'UI
// ============================================================================

export const CATEGORIES_INFO: Record<
  CategorieAide,
  { label: string; color: string; description: string }
> = {
  "competitivite-charges": {
    label: "Compétitivité / charges",
    color: "#0055A4",
    description: "Allègements de cotisations sociales et fiscales pour réduire le coût du travail.",
  },
  "innovation-rd": {
    label: "Innovation & R&D",
    color: "#7c3aed",
    description: "CIR, JEI, BPI, France 2030, ANR. Recherche, deeptech, technologies stratégiques.",
  },
  "emploi-formation": {
    label: "Emploi & formation",
    color: "#16a34a",
    description: "Aides à l'apprentissage, alternance, contrats aidés, formation professionnelle.",
  },
  "transition-ecologique": {
    label: "Transition écologique",
    color: "#0891b2",
    description: "Fonds vert, ADEME, MaPrimeRénov entreprises, décarbonation industrielle.",
  },
  sectoriel: {
    label: "Sectoriel",
    color: "#d97706",
    description: "Aides ciblées par secteur : audiovisuel, presse, transport routier, agriculture.",
  },
  territorial: {
    label: "Territorial",
    color: "#dc2626",
    description: "Régions, départements, ZFU/ZRR, outre-mer. Aides locales et géographiques.",
  },
  "crise-conjoncturel": {
    label: "Crise / conjoncturel",
    color: "#64748b",
    description: "Dispositifs exceptionnels (PGE Covid, fonds de solidarité, plans d'urgence).",
  },
};

// ============================================================================
// Outils pratiques pour les entreprises (où chercher les aides)
// ============================================================================

export interface OutilAide {
  nom: string;
  url: string;
  description: string;
  publicCible: string;
}

export const OUTILS_RECHERCHE_AIDES: OutilAide[] = [
  {
    nom: "Aides-entreprises.fr",
    url: "https://aides-entreprises.fr",
    description:
      "Plateforme officielle de l'État. ~4 000 dispositifs nationaux + locaux. Recherche par activité, taille, géographie. Indispensable.",
    publicCible: "TPE, PME, ETI",
  },
  {
    nom: "Bpifrance Hub",
    url: "https://bpifrance-creation.fr",
    description:
      "Catalogue BPI : prêts, garanties, subventions innovation, accompagnement. Demande directe en ligne pour la plupart.",
    publicCible: "Startups, PME, ETI",
  },
  {
    nom: "France Num",
    url: "https://www.francenum.gouv.fr",
    description:
      "Aides à la transformation numérique des TPE/PME. Diagnostic gratuit + accompagnement subventionné.",
    publicCible: "TPE, PME",
  },
  {
    nom: "Place des Entreprises",
    url: "https://place-des-entreprises.beta.gouv.fr",
    description:
      "Mise en relation TPE/PME avec experts publics : URSSAF, BPI, Pôle emploi, Trésorerie, ADEME. Réponse sous 7 jours.",
    publicCible: "TPE en difficulté ou en projet",
  },
  {
    nom: "Aides-territoires",
    url: "https://aides-territoires.beta.gouv.fr",
    description:
      "Aides locales (régions, départements, EPCI, fondations). Très utile pour les aides oubliées des plateformes nationales.",
    publicCible: "Tous, surtout secteurs publics et associations",
  },
  {
    nom: "ADEME Agir pour la transition",
    url: "https://agirpourlatransition.ademe.fr",
    description:
      "Aides à la transition écologique des entreprises : décarbonation, économie circulaire, mobilité durable.",
    publicCible: "Toute entreprise engageant transition écologique",
  },
];

// ============================================================================
// Mythes à démonter
// ============================================================================

export const MYTHES_AIDES = [
  {
    mythe: "« La France distribue plus d'aides que les autres pays »",
    realite:
      "À NUANCER. ~5,5 % du PIB français selon Cour des comptes (110 Md€/an sur 2 500 Md€ PIB), contre ~4 % en Allemagne et ~3 % en Italie. Mais on inclut les allègements de cotisations sociales (76 Md€), qu'on ne compte pas toujours pareil en Europe. Hors allègements, on tombe à ~1,5 % du PIB, dans la moyenne.",
  },
  {
    mythe: "« Les aides vont surtout aux grands groupes »",
    realite:
      "PARTIELLEMENT VRAI. Le CIR profite à 50 % à 100 entreprises (concentration au sommet). Mais les allègements de cotisations bas salaires (76 Md€ = 70 % du total) sont par construction concentrés sur les PME et TPE qui emploient majoritairement des bas salaires.",
  },
  {
    mythe: "« On ne sait pas où va l'argent »",
    realite:
      "DE MOINS EN MOINS. Aides-entreprises.fr (créé 2023) recense ~4 000 dispositifs. data.gouv.fr publie les subventions individuelles >100 K€ (transparence loi 2016). Cour des comptes publie des rapports thématiques. Reste un long-tail de petits dispositifs régionaux peu visibles.",
  },
  {
    mythe: "« Les aides remplacent l'investissement privé »",
    realite:
      "EFFET D'ADDITIONALITÉ DÉBATTU. France Stratégie 2024 : pour le CIR, ~50 % d'additionalité réelle (l'autre 50 % aurait été investi sans aide). Pour BPI, ~70 % additionalité. Pour France 2030, trop tôt. La règle : plus le dispositif est généreux et large, plus l'effet d'aubaine est important.",
  },
  {
    mythe: "« Il n'y a aucun contrôle »",
    realite:
      "FAUX. Conditionnalités de plus en plus fortes : engagement maintien emploi (France 2030), seuils environnementaux (Fonds vert), contrôles fiscaux CIR (plusieurs centaines/an, ~10 % redressements). Mais contrôles inégaux selon les dispositifs.",
  },
];

// ============================================================================
// Totaux
// ============================================================================

export const TOTAL_AIDES_MD_EUR = AIDES_ENTREPRISES.reduce(
  (acc, a) => acc + a.coutMdEur,
  0,
);
export const TOTAL_AIDES_OFFICIEL = 110; // Cour des comptes 2024
