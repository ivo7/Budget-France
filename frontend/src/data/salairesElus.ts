// ============================================================================
// salairesElus.ts — indemnités et rémunérations des élus français (2024-2025)
// ============================================================================
//
// Source de vérité :
//   - Assemblée nationale : règlement intérieur, communiqués officiels
//   - Sénat : site officiel, brochure annuelle
//   - HATVP (Haute Autorité pour la Transparence de la Vie Publique)
//   - DGCL (Direction Générale des Collectivités Locales) — Code général
//     des collectivités territoriales (CGCT) art. L. 2123-23 et s.
//   - Parlement européen : règlement financier
//
// Convention :
//   - Tous les montants sont en EUROS BRUTS MENSUELS (sauf si précisé)
//   - L'indemnité parlementaire est imposable et soumise à CSG/CRDS
//   - L'IRFM (députés/sénateurs) est une dotation pour frais professionnels,
//     pas du revenu personnel — elle est soumise à justificatifs
//   - Les chiffres sont arrondis à l'euro près pour la lisibilité
//
// IMPORTANT : ces chiffres sont publics et accessibles à tous. Aucun
// jugement de valeur n'est porté ici — Budget France se contente d'agréger
// et de contextualiser de manière neutre.

export interface RemunerationElu {
  id: string;
  fonction: string;
  /** Indemnité de base (« salaire ») en € brut mensuel */
  indemniteMensuelleEur: number;
  /** Frais de mandat/fonction NON imposable (€ brut mensuel) */
  fraisMensuelsEur?: number;
  /** Crédit collaborateurs (à reverser, pas du revenu personnel) */
  creditCollaborateursEur?: number;
  /** Avantages en nature (logement, voiture, sécurité, etc.) */
  avantagesNature?: string;
  /** Durée du mandat */
  mandatDuree: string;
  /** Cumul possible avec d'autres mandats */
  cumul: string;
  /** Régime de retraite */
  retraite: string;
  /** Plafonnement / écrêtement */
  plafonnement?: string;
  /** Nombre de personnes occupant cette fonction */
  effectif: string;
  /** Comparaison concrète au SMIC mensuel net (1 426 €) */
  smicEquivalent: number;
  /** Description / contexte */
  description: string;
  /** Source officielle */
  source: string;
}

export type CategorieElu =
  | "executif"
  | "parlementaires"
  | "locaux"
  | "europeens";

// SMIC mensuel net 2024 utilisé comme référence (28h35/sem 35h)
export const SMIC_MENSUEL_NET = 1_426;
// Salaire médian français 2024 (INSEE)
export const SALAIRE_MEDIAN_NET = 2_091;

// ============================================================================
// EXÉCUTIF — Président, Premier ministre, ministres
// ============================================================================

export const SALAIRES_EXECUTIF: RemunerationElu[] = [
  {
    id: "president",
    fonction: "Président de la République",
    indemniteMensuelleEur: 15_140,
    avantagesNature:
      "Logement de fonction (Élysée), véhicule, voyages, sécurité 24/7, déplacements officiels.",
    mandatDuree: "5 ans, renouvelable une fois (depuis 2008)",
    cumul: "Aucun cumul possible (incompatibilité totale)",
    retraite:
      "Pension après 1 mandat plein. Avant 2017 : ~6 220 €/mois à 50 ans. Depuis 2017, calculée sur le régime des conseillers d'État (proche).",
    effectif: "1 personne",
    smicEquivalent: Math.round(15_140 / SMIC_MENSUEL_NET),
    description:
      "L'indemnité du Président est revalorisée par décret en 2008 (Sarkozy) à 15 140 € brut, alignée sur le Premier ministre. Avant 2008 elle était de ~7 084 €/mois — la majoration était compensée par d'autres avantages.",
    source: "Décret n°2002-967 modifié, Cour des comptes",
  },
  {
    id: "pm",
    fonction: "Premier ministre",
    indemniteMensuelleEur: 15_140,
    avantagesNature: "Logement de fonction (Hôtel de Matignon), véhicule, sécurité.",
    mandatDuree: "Variable (dépend du Président, dissolution, démission)",
    cumul: "Aucun cumul (incompatibilité)",
    retraite: "Régime de la fonction publique + ancienneté ministérielle.",
    effectif: "1 personne",
    smicEquivalent: Math.round(15_140 / SMIC_MENSUEL_NET),
    description:
      "Même montant que le Président depuis 2008. Loi du 21 février 2017 a aligné les régimes.",
    source: "Décret n°2002-967, art. 1 modifié",
  },
  {
    id: "ministre",
    fonction: "Ministre",
    indemniteMensuelleEur: 10_125,
    avantagesNature: "Véhicule de fonction, chauffeur, bureau et collaborateurs (~10-50 selon ministère).",
    mandatDuree: "Variable (remaniement, démission)",
    cumul:
      "Incompatibilité avec mandat parlementaire (loi 2014). Cumul avec mandat local possible (mais maire/président d'exécutif local interdits).",
    retraite:
      "Régime des fonctionnaires d'État + droits acquis sur les rémunérations ministérielles (3 mois de transition après cessation).",
    effectif: "~30-40 ministres et ministres délégués",
    smicEquivalent: Math.round(10_125 / SMIC_MENSUEL_NET),
    description:
      "Indemnité fixée par décret. Les ministres bénéficient d'un cabinet de 5 à 30 collaborateurs payés sur le budget du ministère.",
    source: "Décret n°2002-967 art. 3",
  },
  {
    id: "secretaire-etat",
    fonction: "Secrétaire d'État",
    indemniteMensuelleEur: 9_618,
    avantagesNature: "Véhicule, bureau, cabinet réduit.",
    mandatDuree: "Variable",
    cumul: "Idem ministre",
    retraite: "Idem ministre",
    effectif: "Variable selon gouvernement (5-15)",
    smicEquivalent: Math.round(9_618 / SMIC_MENSUEL_NET),
    description:
      "Niveau hiérarchiquement inférieur aux ministres pleins. Indemnité ~95 % de celle d'un ministre.",
    source: "Décret n°2002-967 art. 3",
  },
];

// ============================================================================
// PARLEMENTAIRES — Députés, Sénateurs, Eurodéputés
// ============================================================================

export const SALAIRES_PARLEMENTAIRES: RemunerationElu[] = [
  {
    id: "depute",
    fonction: "Député",
    indemniteMensuelleEur: 7_637,
    fraisMensuelsEur: 5_950,
    creditCollaborateursEur: 12_900,
    avantagesNature:
      "Bureau à l'Assemblée, accès aux services internes (documentation, restaurants, sport). Voyages SNCF/avion remboursés pour la circonscription.",
    mandatDuree: "5 ans, indéfiniment renouvelable",
    cumul:
      "Incompatibilité avec exécutif local depuis 2017 (loi non-cumul). Cumulable avec conseiller municipal/départemental/régional sans fonction exécutive.",
    retraite:
      "Pension parlementaire après 5 ans de mandat (1 année cotisée). Régime fermé en 2018, indemnités remplacées par cotisation au régime général + AGIRC-ARRCO.",
    plafonnement:
      "Si cumul avec un autre mandat : écrêtement à 1,5 × indemnité parlementaire (~10 800 €). Le surplus revient au budget de l'État.",
    effectif: "577 députés (Assemblée nationale)",
    smicEquivalent: Math.round(7_637 / SMIC_MENSUEL_NET),
    description:
      "Indemnité parlementaire = indemnité de base (5 803 €) + indemnité de résidence (174 €) + indemnité de fonction (1 660 €). Soumise à IR et CSG/CRDS comme tout salaire. L'IRFM (avance frais de mandat) est un budget pour les frais professionnels (bureau circonscription, déplacements, communication), pas du revenu personnel — depuis 2018, soumise à justificatifs.",
    source: "Assemblée nationale, règlement intérieur",
  },
  {
    id: "senateur",
    fonction: "Sénateur",
    indemniteMensuelleEur: 7_637,
    fraisMensuelsEur: 6_037,
    creditCollaborateursEur: 8_900,
    avantagesNature: "Bureau au Sénat, transport, accès services internes.",
    mandatDuree: "6 ans, renouvelable. Renouvellement par moitié tous les 3 ans.",
    cumul: "Idem député (loi non-cumul 2017)",
    retraite:
      "Pension sénatoriale après 5 ans de mandat. Régime spécifique géré par la Caisse des retraites du Sénat.",
    plafonnement: "Idem député (écrêtement 1,5 × en cas de cumul)",
    effectif: "348 sénateurs",
    smicEquivalent: Math.round(7_637 / SMIC_MENSUEL_NET),
    description:
      "Indemnité parlementaire identique à celle du député. L'IRFM sénateurs (« indemnité représentative de frais de mandat ») est légèrement plus élevée (6 037 €) pour couvrir les déplacements en circonscription (territoires ruraux).",
    source: "Sénat, brochure annuelle",
  },
  {
    id: "eurodepute",
    fonction: "Eurodéputé",
    indemniteMensuelleEur: 9_975,
    fraisMensuelsEur: 4_950,
    creditCollaborateursEur: 28_412,
    avantagesNature:
      "Bureau Bruxelles + Strasbourg, transport gratuit entre les 2 sièges, déplacements remboursés, accès services Parlement européen.",
    mandatDuree: "5 ans",
    cumul:
      "Incompatibilité avec mandat national parlementaire ou exécutif local (depuis 2017).",
    retraite:
      "Régime de pension du Parlement européen, après 5 ans de mandat. Pension = 3,5 % du salaire × années de service.",
    effectif: "81 eurodéputés français (sur 720 total)",
    smicEquivalent: Math.round(9_975 / SMIC_MENSUEL_NET),
    description:
      "Indemnité unique pour tous les eurodéputés depuis 2009 (avant : indemnités nationales très inégales). Brut ~9 975 €/mois après impôt européen ~7 854 €. La France impose ensuite la part française. Frais généraux (4 950 €) couvrent bureau, IT, communication.",
    source: "Parlement européen, statut financier",
  },
];

// ============================================================================
// ÉLUS LOCAUX — Maires, Présidents région/département, Conseillers
// ============================================================================
//
// Les indemnités d'élus locaux sont fixées par référence à l'INDICE BRUT 1027
// (= 4 105 € brut mensuel en 2024, salaire grade hors-classe fonction publique).
// Chaque fonction a un plafond fixé en pourcentage de cet indice.

export const SALAIRES_LOCAUX: RemunerationElu[] = [
  {
    id: "maire-paris",
    fonction: "Maire d'une métropole > 100 000 hab.",
    indemniteMensuelleEur: 5_640,
    avantagesNature: "Variable selon commune (logement de fonction non systématique). Voiture, secrétariat.",
    mandatDuree: "6 ans, renouvelable",
    cumul:
      "Maire de grande ville + parlementaire INTERDIT depuis 2017. Cumul avec conseiller régional/départemental possible (sans fonction exécutive).",
    retraite:
      "Régime IRCANTEC (complémentaire des contractuels publics). Pension calculée selon les annuités cotisées.",
    plafonnement:
      "Indemnité totale (incluant éventuels mandats régionaux/départementaux) plafonnée à 1,5 × indemnité parlementaire de base.",
    effectif: "~50 villes de plus de 100 000 habitants en France",
    smicEquivalent: Math.round(5_640 / SMIC_MENSUEL_NET),
    description:
      "Plafond d'indemnité fixé à 137,4 % de l'indice brut 1027 pour les villes > 100 000 hab. (115 % pour 50 000-99 999 hab.). Le conseil municipal peut voter une indemnité INFÉRIEURE au plafond légal, ce qui est fréquent.",
    source: "Code général des collectivités territoriales (CGCT) art. L. 2123-23",
  },
  {
    id: "maire-grand",
    fonction: "Maire d'une commune 20 000-49 999 hab.",
    indemniteMensuelleEur: 3_701,
    mandatDuree: "6 ans, renouvelable",
    cumul: "Idem maire métropole",
    retraite: "Idem (IRCANTEC)",
    plafonnement: "Plafond 90 % indice brut 1027",
    effectif: "~280 communes en France",
    smicEquivalent: Math.round(3_701 / SMIC_MENSUEL_NET),
    description:
      "Plafond à 90 % de l'indice brut 1027. Indemnité réelle souvent ~80-90 % du plafond.",
    source: "CGCT art. L. 2123-23",
  },
  {
    id: "maire-moyen",
    fonction: "Maire d'une commune 3 500-9 999 hab.",
    indemniteMensuelleEur: 2_209,
    mandatDuree: "6 ans, renouvelable",
    cumul: "Plus de souplesse au niveau communal moyen",
    retraite: "IRCANTEC",
    plafonnement: "Plafond 55 % indice brut 1027",
    effectif: "~3 800 communes",
    smicEquivalent: Math.round(2_209 / SMIC_MENSUEL_NET),
    description:
      "Plafond à 55 % de l'indice brut 1027. La majorité des maires de cette strate prennent ~80 % du plafond seulement.",
    source: "CGCT art. L. 2123-23",
  },
  {
    id: "maire-petit",
    fonction: "Maire d'une commune < 500 hab.",
    indemniteMensuelleEur: 1_048,
    mandatDuree: "6 ans, renouvelable",
    cumul: "Cumul libre dans le mandat local",
    retraite: "IRCANTEC (souvent insuffisant pour ouvrir des droits significatifs)",
    plafonnement: "Plafond 25,5 % indice brut 1027",
    effectif: "~17 800 communes (50 % des communes françaises)",
    smicEquivalent: Math.round(1_048 / SMIC_MENSUEL_NET),
    description:
      "Indemnité brute plafonnée à 25,5 % de l'indice brut 1027 (1 048 € pour 2024). Net après cotisations ~870 €. Beaucoup de maires de petites communes prennent volontairement une indemnité réduite ou nulle (bénévolat de fait).",
    source: "CGCT art. L. 2123-23",
  },
  {
    id: "president-region",
    fonction: "Président de Région",
    indemniteMensuelleEur: 5_640,
    mandatDuree: "6 ans",
    cumul: "Incompatibilité avec parlementaire (loi 2017)",
    retraite: "IRCANTEC",
    plafonnement: "Plafond 137,4 % indice brut 1027",
    effectif: "13 régions métropolitaines + 5 collectivités d'outre-mer",
    smicEquivalent: Math.round(5_640 / SMIC_MENSUEL_NET),
    description:
      "Même plafond qu'un maire de très grande ville. Le président d'exécutif régional dirige un conseil régional de 90 à 200 conseillers selon la région.",
    source: "CGCT art. L. 4135-15",
  },
  {
    id: "president-departement",
    fonction: "Président de Département",
    indemniteMensuelleEur: 5_640,
    mandatDuree: "6 ans (renouvellement par moitié tous les 3 ans)",
    cumul: "Idem président de région",
    retraite: "IRCANTEC",
    plafonnement: "Plafond 137,4 % indice brut 1027",
    effectif: "101 départements (96 métropole + 5 outre-mer)",
    smicEquivalent: Math.round(5_640 / SMIC_MENSUEL_NET),
    description:
      "Plafond identique à président de région. Préside un conseil départemental qui gère le RSA, les collèges, les routes, les MDPH, l'aide sociale à l'enfance.",
    source: "CGCT art. L. 3123-16",
  },
  {
    id: "conseiller-municipal",
    fonction: "Conseiller municipal (commune > 100 000 hab.)",
    indemniteMensuelleEur: 246,
    mandatDuree: "6 ans",
    cumul: "Très libre (cumul autorisé)",
    retraite: "IRCANTEC (peu de droits acquis)",
    effectif: "~500 000 conseillers municipaux dans toute la France",
    smicEquivalent: 0,
    description:
      "Indemnité optionnelle fixée par le conseil municipal. Pour la majorité des conseillers municipaux des communes < 100 000 hab., le mandat est BÉNÉVOLE (indemnité 0).",
    source: "CGCT art. L. 2123-24",
  },
];

// ============================================================================
// COMPARAISONS INTERNATIONALES
// ============================================================================

export interface ComparaisonInternationale {
  pays: string;
  drapeau: string;
  pm: number;          // Premier ministre / Chancelier / Président
  parlementaire: number;
  /** Note explicative */
  note?: string;
}

export const COMPARAISON_INTERNATIONALE: ComparaisonInternationale[] = [
  {
    pays: "France",
    drapeau: "🇫🇷",
    pm: 15_140,
    parlementaire: 7_637,
    note: "Indemnité PM = celle du Président (alignée 2008)",
  },
  {
    pays: "Allemagne",
    drapeau: "🇩🇪",
    pm: 19_625,
    parlementaire: 11_227,
    note: "Chancelier = ~25 % au-dessus du PM français. Députés Bundestag mieux indemnisés (mais frais inclus dans l'indemnité, sauf collaborateurs).",
  },
  {
    pays: "Royaume-Uni",
    drapeau: "🇬🇧",
    pm: 14_847,
    parlementaire: 7_715,
    note: "PM proche de la France. Députés (MPs) similaires. Les ministres britanniques sont MOINS payés que les français.",
  },
  {
    pays: "Italie",
    drapeau: "🇮🇹",
    pm: 9_950,
    parlementaire: 14_634,
    note: "Députés italiens parmi les mieux payés d'Europe (indemnité brute, frais inclus). PM italien beaucoup moins payé que le français.",
  },
  {
    pays: "Espagne",
    drapeau: "🇪🇸",
    pm: 7_117,
    parlementaire: 3_300,
    note: "PM et députés moins payés (~50 % du français). Reflet du PIB par habitant plus faible.",
  },
  {
    pays: "États-Unis",
    drapeau: "🇺🇸",
    pm: 33_333,
    parlementaire: 14_500,
    note: "Président US 2024 : 400 000 $/an = 33 333 €/mois. Sénateur/Représentant : 174 000 $/an = 14 500 €/mois.",
  },
  {
    pays: "Suisse",
    drapeau: "🇨🇭",
    pm: 38_300,
    parlementaire: 8_950,
    note: "Conseillers fédéraux (équivalent ministres) parmi les mieux payés au monde. Mais membres du Parlement = milicien (mandat à temps partiel).",
  },
];

// ============================================================================
// MYTHES À DÉMONTER
// ============================================================================

export const MYTHES_A_DEMONTER = [
  {
    mythe: "« Les politiques sont payés à vie »",
    realite:
      "FAUX. Aucun élu n'est « payé à vie ». Tous bénéficient d'un régime de retraite (parlementaire, IRCANTEC pour les locaux, ministériel) qui exige des annuités cotisées. La pension présidentielle après 1 mandat est ~6 200 €/mois — soit l'équivalent d'un haut-fonctionnaire en fin de carrière.",
  },
  {
    mythe: "« Ils cumulent les mandats et empochent tout »",
    realite:
      "FAUX. Loi sur le non-cumul (2014, applicable 2017) : un parlementaire ne peut plus cumuler un mandat exécutif local (maire, président EPCI/département/région). En cas de cumul restant possible (conseiller sans fonction exécutive), l'indemnité totale est ÉCRÊTÉE à 1,5 × l'indemnité parlementaire. Le surplus retourne à l'État.",
  },
  {
    mythe: "« Les ministres ont des privilèges démentiels »",
    realite:
      "À NUANCER. Logement de fonction, voiture, sécurité — oui. Mais ce sont des outils de travail, pas des cadeaux personnels. Ils sont déclarés à la HATVP. Leur usage privé est interdit (cf. affaire Cahuzac, Fillon).",
  },
  {
    mythe: "« L'IRFM des députés c'est de l'argent dans leur poche »",
    realite:
      "PLUS DEPUIS 2018. L'IRFM (Indemnité Représentative de Frais de Mandat) est désormais soumise à JUSTIFICATIFS (loi confiance dans la vie politique, 2017). Les 5 720 €/mois servent à payer le bureau de circonscription, les déplacements, la communication. Tout euro non justifié est restitué.",
  },
  {
    mythe: "« Les maires de petits villages sont riches »",
    realite:
      "FAUX. Un maire d'une commune < 500 habitants touche 1 048 € brut/mois (~870 € net), souvent en plus d'un emploi principal car le mandat est mi-temps. Beaucoup prennent volontairement une indemnité réduite. Le mandat municipal de base (conseiller) est bénévole pour ~80 % des élus.",
  },
];
