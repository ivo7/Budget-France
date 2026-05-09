// ============================================================================
// marchesPublics.ts — la commande publique française (~120 Md€/an)
// ============================================================================
//
// Sources principales :
//   - Observatoire Économique de la Commande Publique (OECP) — Direction des
//     Achats de l'État, rapports annuels
//   - data.gouv.fr — DECP (Données Essentielles Commande Publique) augmentées
//   - INSEE — comptes nationaux, formation brute capital fixe APU
//   - Cour des comptes — rapports thématiques achats publics
//
// Convention :
//   - Tous les montants en Md€ HT (hors taxes)
//   - Données 2023 sauf si précisé
//   - Seuils 2024-2025 (révisés tous les 2 ans par décret)
//
// IMPORTANT : les données DECP sont publiques mais incomplètes (les très
// grands groupes répondent souvent via filiales sectorielles, ce qui rend
// difficile la consolidation par groupe-mère). Les top fournisseurs ci-dessous
// sont des ordres de grandeur cohérents avec les rapports OECP.

export interface CategorieMarche {
  type: "travaux" | "fournitures" | "services";
  label: string;
  emoji: string;
  montantMdEur: number;
  partPct: number;
  description: string;
  exemples: string[];
}

export const CATEGORIES_MARCHES: CategorieMarche[] = [
  {
    type: "travaux",
    label: "Travaux",
    emoji: "🏗️",
    montantMdEur: 48,
    partPct: 40,
    description:
      "Construction, rénovation, maintenance d'infrastructures et bâtiments publics. Catégorie la plus médiatisée (gros marchés visibles : routes, écoles, hôpitaux).",
    exemples: [
      "Construction d'écoles, collèges, hôpitaux",
      "Voirie communale et nationale",
      "Réseaux d'eau et d'assainissement",
      "Rénovation énergétique des bâtiments publics",
    ],
  },
  {
    type: "services",
    label: "Services",
    emoji: "💼",
    montantMdEur: 42,
    partPct: 35,
    description:
      "Prestations intellectuelles, informatique, conseil, sécurité, restauration scolaire, transports collectifs.",
    exemples: [
      "Maintenance informatique (DSI, SI)",
      "Conseil en stratégie / études d'impact",
      "Restauration scolaire et collective",
      "Transports en commun (DSP)",
      "Nettoyage des bâtiments",
    ],
  },
  {
    type: "fournitures",
    label: "Fournitures",
    emoji: "📦",
    montantMdEur: 30,
    partPct: 25,
    description:
      "Achats de biens : matériel informatique, mobilier, fournitures de bureau, équipements médicaux, matériel militaire.",
    exemples: [
      "Ordinateurs et matériel IT",
      "Médicaments et dispositifs médicaux (hôpitaux)",
      "Véhicules de service",
      "Fournitures de bureau",
      "Mobilier scolaire",
    ],
  },
];

export const TOTAL_COMMANDE_PUBLIQUE_MD_EUR = CATEGORIES_MARCHES.reduce(
  (acc, c) => acc + c.montantMdEur,
  0,
);

// ============================================================================
// Acheteurs publics — qui dépense l'argent de la commande publique ?
// ============================================================================

export interface AcheteurPublic {
  categorie: string;
  emoji: string;
  montantMdEur: number;
  description: string;
  exemples: string[];
}

export const ACHETEURS_PUBLICS: AcheteurPublic[] = [
  {
    categorie: "Collectivités locales",
    emoji: "🏛️",
    montantMdEur: 55,
    description:
      "Communes, EPCI, départements, régions. Représentent ~45 % de la commande publique. Sujet historiquement le plus opaque, désormais publié sur data.gouv.fr via les profils acheteurs.",
    exemples: [
      "Communes (~25 Md€) : voirie, écoles, services",
      "EPCI (~12 Md€) : transports, déchets, eau",
      "Départements (~10 Md€) : collèges, routes, social",
      "Régions (~8 Md€) : lycées, transports régionaux",
    ],
  },
  {
    categorie: "État central",
    emoji: "🇫🇷",
    montantMdEur: 35,
    description:
      "Ministères + opérateurs (universités, agences). Centralisé via la Direction des Achats de l'État (DAE) et la Plateforme PLACE pour les marchés ministériels.",
    exemples: [
      "Défense (DGA) : ~12 Md€ — armement, équipements",
      "Éducation : ~3 Md€ — bâtiments, fournitures",
      "Intérieur : ~2,5 Md€ — police, gendarmerie",
      "Universités : ~3 Md€",
      "ADEME, ANR, BPI : ~1 Md€",
    ],
  },
  {
    categorie: "Hôpitaux et organismes Sécu",
    emoji: "🏥",
    montantMdEur: 25,
    description:
      "Hôpitaux publics (CHU, CH, EHPAD), CPAM, CAF, Pôle emploi/France Travail. Les hôpitaux mutualisent via UniHA, RéseauPro et autres groupements d'achat.",
    exemples: [
      "Hôpitaux (médicaments, dispositifs, énergie)",
      "Restauration et blanchisserie hospitalière",
      "Maintenance équipements médicaux",
      "Informatique de santé (DGOS)",
    ],
  },
  {
    categorie: "Établissements publics + opérateurs",
    emoji: "🏢",
    montantMdEur: 5,
    description:
      "EPIC (RATP, SNCF Réseau jusqu'à 2020), Établissements publics culturels (Louvre, Opéra), agences. Régime souvent dérogatoire au Code commande publique pour certains EPIC.",
    exemples: ["RATP (transports IDF)", "Bibliothèque nationale de France", "Centre Pompidou"],
  },
];

// ============================================================================
// Top fournisseurs récurrents — ordres de grandeur OECP
// ============================================================================

export interface FournisseurMajeur {
  rang: number;
  nom: string;
  secteur: string;
  emoji: string;
  caEstimMdEur: number;
  description: string;
}

export const TOP_FOURNISSEURS: FournisseurMajeur[] = [
  {
    rang: 1,
    nom: "Vinci",
    secteur: "BTP / Concessions",
    emoji: "🏗️",
    caEstimMdEur: 5.5,
    description:
      "Travaux publics, BTP, autoroutes (ASF, Cofiroute), construction. Filiales : Vinci Construction, Vinci Energies, Eurovia.",
  },
  {
    rang: 2,
    nom: "Bouygues",
    secteur: "BTP / Telecoms",
    emoji: "🏗️",
    caEstimMdEur: 4.0,
    description:
      "Bouygues Construction (immobilier public), Colas (routes — filiale TF1 Bouygues), Bouygues Telecom (infrastructures).",
  },
  {
    rang: 3,
    nom: "Eiffage",
    secteur: "BTP",
    emoji: "🏗️",
    caEstimMdEur: 3.0,
    description:
      "Concessions autoroutières (APRR), construction, énergie systèmes (Clemessy).",
  },
  {
    rang: 4,
    nom: "Spie",
    secteur: "Énergie / Multi-techniques",
    emoji: "⚡",
    caEstimMdEur: 2.0,
    description:
      "Génie électrique, mécanique, climatique. Maintenance équipements bâtiments publics. Issu d'Amec-Spie en 2006.",
  },
  {
    rang: 5,
    nom: "Capgemini",
    secteur: "IT / Conseil",
    emoji: "💻",
    caEstimMdEur: 1.5,
    description:
      "Premier intégrateur de France pour l'État (PLACE-DGE). Migration cloud (Bleu, S3NS), modernisation SI ministériels.",
  },
  {
    rang: 6,
    nom: "Atos",
    secteur: "IT / Cybersécurité",
    emoji: "💻",
    caEstimMdEur: 1.2,
    description:
      "SI Défense, calcul HPC (CEA), cybersécurité de l'État. Restructuration en cours (split Eviden/Tech Foundations).",
  },
  {
    rang: 7,
    nom: "Sodexo",
    secteur: "Restauration / Services",
    emoji: "🍽️",
    caEstimMdEur: 0.9,
    description:
      "Restauration scolaire, hospitalière, militaire. Gestion sites publics. Très présent en collectivités locales.",
  },
  {
    rang: 8,
    nom: "Orange",
    secteur: "Telecoms",
    emoji: "📞",
    caEstimMdEur: 0.7,
    description:
      "Télécoms fixes/mobiles administrations + cybersécurité (Orange Cyberdefense). Marché RIE (réseau interministériel).",
  },
  {
    rang: 9,
    nom: "Veolia",
    secteur: "Eau / Déchets",
    emoji: "💧",
    caEstimMdEur: 1.0,
    description:
      "Délégations de service public (DSP) eau, assainissement, déchets pour ~3 000 collectivités. Concurrent : Suez (rachat partiel 2022).",
  },
  {
    rang: 10,
    nom: "Engie",
    secteur: "Énergie",
    emoji: "🔌",
    caEstimMdEur: 0.8,
    description:
      "Fourniture gaz et électricité aux collectivités (groupements UGAP, etc.), services énergétiques.",
  },
];

// ============================================================================
// Seuils de procédure 2024-2025 (réglementation Code de la commande publique)
// ============================================================================

export interface SeuilMarche {
  borne: string;
  procedure: string;
  publication: string;
  description: string;
}

export const SEUILS_PROCEDURE: SeuilMarche[] = [
  {
    borne: "< 40 000 € HT",
    procedure: "Sans publicité ni mise en concurrence",
    publication: "Pas d'obligation",
    description:
      "Achat libre par l'acheteur public, sous réserve de respecter les principes (égalité, transparence, bon usage des deniers publics). Seuil relevé de 25 K€ à 40 K€ en 2020.",
  },
  {
    borne: "40 K€ – 90 K€",
    procedure: "MAPA (Marché à Procédure Adaptée) simplifié",
    publication: "Profil acheteur, BOAMP",
    description:
      "Procédure souple : 3 devis suffisent souvent. Délai de remise des offres typiquement 15-25 jours.",
  },
  {
    borne: "90 K€ – 221 K€ (services) / 5 538 K€ (travaux)",
    procedure: "MAPA formalisé",
    publication: "BOAMP, JOUE si seuil européen",
    description:
      "Procédure plus encadrée mais reste adaptée au besoin. Critères clairs, sélection sur dossier.",
  },
  {
    borne: "> 221 K€ (services) / > 5 538 K€ (travaux)",
    procedure: "Procédure formalisée européenne",
    publication: "BOAMP + JOUE obligatoires",
    description:
      "Appel d'offres ouvert, restreint, ou procédure avec négociation. Délais légaux stricts (35-52 jours pour AOO). Recours possible devant le tribunal administratif.",
  },
];

// ============================================================================
// Idées reçues / mythes
// ============================================================================

export const MYTHES_MARCHES = [
  {
    mythe: "« Les marchés publics, c'est trop compliqué pour les TPE/PME »",
    realite:
      "FAUX. Depuis 2020, les marchés < 40 K€ HT n'exigent ni publicité ni mise en concurrence. Plus de la moitié des marchés publics français sont attribués à des PME selon l'OECP. Il existe des dispositifs incitatifs : sous-traitance obligatoire, lots accessibles, pénalités pour non-respect des délais de paiement (45 jours).",
  },
  {
    mythe: "« Les contrats vont toujours aux mêmes grands groupes »",
    realite:
      "À NUANCER. Vinci, Bouygues, Eiffage trustent les très gros marchés (>50 M€). Mais sur les marchés < 1 M€, ~70 % sont attribués à des PME. La concurrence est réelle sur les segments moyens.",
  },
  {
    mythe: "« Les marchés publics sont opaques »",
    realite:
      "DE MOINS EN MOINS. Depuis 2018, la loi République Numérique impose la publication ouverte des données essentielles (DECP) sur data.gouv.fr. Tu peux consulter chaque marché > 40 K€ : acheteur, fournisseur, montant, objet, durée. Encore des angles morts (très grands groupes via filiales), mais énorme progrès.",
  },
  {
    mythe: "« L'État paie toujours en retard »",
    realite:
      "FAUX en moyenne, vrai par exception. Délai moyen de paiement État : 23 jours en 2023 (vs limite légale 30 jours). Mais certaines collectivités locales peuvent monter à 60-90 jours. Pénalités de retard automatiques depuis 2013 (taux BCE + 8 points).",
  },
];

// ============================================================================
// Outils pratiques pour chercher dans les marchés publics
// ============================================================================

export interface OutilRecherche {
  nom: string;
  url: string;
  description: string;
  publicCible: string;
}

export const OUTILS_RECHERCHE: OutilRecherche[] = [
  {
    nom: "BOAMP",
    url: "https://www.boamp.fr",
    description:
      "Bulletin Officiel des Annonces des Marchés Publics. Source officielle pour consulter les avis de marché en cours (>40 K€) et leurs résultats. Gratuit, accessible à tous.",
    publicCible: "Entreprises soumissionnaires",
  },
  {
    nom: "data.gouv.fr — DECP",
    url: "https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/",
    description:
      "Données Essentielles de la Commande Publique consolidées. Fichier JSON/CSV téléchargeable contenant tous les marchés publics français (acheteur, fournisseur, montant, objet). Idéal pour analyses statistiques.",
    publicCible: "Journalistes, chercheurs, citoyens curieux",
  },
  {
    nom: "JOUE / TED",
    url: "https://ted.europa.eu",
    description:
      "Tenders Electronic Daily — version européenne. Pour les marchés au-dessus du seuil européen. Accès aux marchés des 27 États membres.",
    publicCible: "Entreprises souhaitant prospecter en Europe",
  },
  {
    nom: "PLACE (État)",
    url: "https://www.marches-publics.gouv.fr",
    description:
      "Plateforme des achats de l'État. Consultations des ministères, opérateurs nationaux, et certaines collectivités. Inscription gratuite pour répondre.",
    publicCible: "Entreprises répondant aux marchés État",
  },
  {
    nom: "Vue Direct'INFO",
    url: "https://www.directinfo.fr",
    description:
      "Plateforme privée d'agrégation BOAMP + JOUE + plateformes acheteur. Recherche multi-critères avancée. Service payant pour les fonctionnalités complètes.",
    publicCible: "Entreprises actives sur la commande publique",
  },
];
