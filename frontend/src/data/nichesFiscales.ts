// ============================================================================
// nichesFiscales.ts — Top 25 dépenses fiscales (« niches ») de l'État français
// ============================================================================
//
// Source principale : Voies et moyens — tome II annexé au PLF 2025
// (https://www.budget.gouv.fr/documentation/file-download/22244)
// Évaluations : Cour des comptes (rapport finances publiques 2024), IPP,
// France Stratégie, Conseil des prélèvements obligatoires (CPO).
//
// Total reporté pour 2024-2025 : ~95 Md€ pour ~470 dépenses fiscales
// recensées (en hausse continue depuis 20 ans malgré les annonces de
// rabotage successives).
//
// ⚠ Les estimations sont des ORDRES DE GRANDEUR (chaque niche fait l'objet
// d'évaluations parfois divergentes selon la méthodologie). On affiche le
// chiffre central, à manier avec prudence.
//
// Catégories utilisées :
//   - menages       : niches qui visent directement les particuliers (IR, CSG)
//   - entreprises   : crédits/exonérations IS, CICE, JEI, etc.
//   - logement      : niches liées à l'immobilier (résidence, locatif, travaux)
//   - patrimoine    : succession, assurance-vie, plus-values, transmission
//   - consommation  : TVA réduite (restauration, livre, travaux)
//   - territoires   : zones franches, outre-mer, ZRR
//   - sectoriel     : transports, agriculture, BTP — TICPE remboursée
//
// Le champ "evaluation" résume la conclusion principale des audits récents
// (Cour des comptes, France Stratégie, IPP). Toujours nuancé.
// ============================================================================

export type CategorieNiche =
  | "menages"
  | "entreprises"
  | "logement"
  | "patrimoine"
  | "consommation"
  | "territoires"
  | "sectoriel";

export interface NicheFiscale {
  id: string;
  nom: string;
  abbr?: string;
  /** Coût annuel estimé en milliards d'euros */
  coutMdEur: number;
  categorie: CategorieNiche;
  /** Bénéficiaires concrets (qui en profite) */
  beneficiaires: string;
  /** Description simple, accessible au grand public */
  description: string;
  /** Justification politique d'origine */
  justification?: string;
  /** Évaluation indépendante (Cour des comptes, IPP, France Stratégie) */
  evaluation?: string;
  /** Source officielle */
  source: string;
}

export const NICHES_FISCALES: NicheFiscale[] = [
  {
    id: "cir",
    nom: "Crédit Impôt Recherche",
    abbr: "CIR",
    coutMdEur: 7.2,
    categorie: "entreprises",
    beneficiaires:
      "Toutes entreprises engageant des dépenses de R&D — concentré sur grands groupes (50 % du CIR pour 100 entreprises).",
    description:
      "Réduction d'IS de 30 % sur les dépenses de R&D jusqu'à 100 M€, 5 % au-delà. Créé en 1983, élargi massivement en 2008. Plus grosse niche entreprises de France.",
    justification:
      "Encourager la R&D privée et compenser le sous-investissement français en innovation (1,4 % du PIB en R&D vs 3 % en Allemagne).",
    evaluation:
      "Cour des comptes 2021 : « efficacité limitée pour les grands groupes ». IPP : effet positif pour les PME, marginal pour les grandes entreprises. Plusieurs rapports demandent un plafonnement.",
    source: "Voies et moyens 2025, Cour des comptes 2021",
  },
  {
    id: "emploi-domicile",
    nom: "Crédit d'impôt emploi à domicile",
    coutMdEur: 6.4,
    categorie: "menages",
    beneficiaires:
      "Tous les ménages employant un salarié à domicile (garde d'enfants, ménage, jardinage, soutien scolaire). Bénéfice concentré sur les 30 % de ménages les plus aisés.",
    description:
      "50 % de crédit d'impôt sur les dépenses d'emploi à domicile, plafonné à 6 000 €/an + majorations. Étendu au paiement immédiat (Cesu+) en 2022.",
    justification:
      "Lutter contre le travail au noir et soutenir les services à la personne (créateur d'emplois peu qualifiés).",
    evaluation:
      "France Stratégie 2024 : effet positif sur l'emploi déclaré, mais bénéfice fiscal très inégalement réparti (top décile capte 40 % du crédit).",
    source: "Voies et moyens 2025, France Stratégie 2024",
  },
  {
    id: "tva-travaux",
    nom: "Taux réduit TVA travaux logement",
    coutMdEur: 5.1,
    categorie: "logement",
    beneficiaires:
      "Propriétaires occupants ou bailleurs (logement de plus de 2 ans). Indirectement les artisans du bâtiment.",
    description:
      "TVA à 10 % (au lieu de 20 %) sur les travaux d'amélioration, transformation, aménagement. Et 5,5 % sur les travaux de rénovation énergétique.",
    justification:
      "Soutenir le secteur du bâtiment, lutter contre le travail dissimulé, encourager la rénovation énergétique.",
    evaluation:
      "Cour des comptes 2017 : effet emploi limité, surtout effet d'aubaine. Mais maintenu pour des raisons sociales (tension secteur BTP).",
    source: "Voies et moyens 2025",
  },
  {
    id: "tva-pna",
    nom: "Taux réduit TVA produits de première nécessité",
    coutMdEur: 14.5,
    categorie: "consommation",
    beneficiaires:
      "Tous les consommateurs, mais particulièrement les ménages modestes (part plus élevée du budget en alimentation).",
    description:
      "TVA à 5,5 % (au lieu de 20 %) sur l'alimentation, l'eau, la restauration scolaire, les médicaments non remboursables, les transports collectifs.",
    justification:
      "Préserver le pouvoir d'achat des ménages modestes (pour qui ces produits représentent une part plus élevée du budget).",
    evaluation:
      "INSEE 2023 : effet redistributif modéré (les ménages aisés consomment aussi des produits de première nécessité). Comptée dans les niches mais structurelle.",
    source: "Voies et moyens 2025, INSEE",
  },
  {
    id: "abat-pensions",
    nom: "Abattement 10 % sur les pensions retraite",
    coutMdEur: 4.1,
    categorie: "menages",
    beneficiaires:
      "16 millions de retraités. Plafonné à 4 321 €/an par foyer.",
    description:
      "Avant calcul de l'IR, les pensions de retraite bénéficient d'un abattement de 10 % comme les salaires (alors qu'elles n'engendrent pas de frais professionnels).",
    justification:
      "Aligner le traitement fiscal des pensions sur celui des salaires (parité retraités/actifs).",
    evaluation:
      "Cour des comptes : difficilement justifiable (les retraités n'ont pas de frais pro). Plusieurs gouvernements ont envisagé de le supprimer, sans aboutir.",
    source: "Voies et moyens 2025, Cour des comptes 2023",
  },
  {
    id: "assurance-vie-succession",
    nom: "Abattement assurance-vie en succession",
    coutMdEur: 3.6,
    categorie: "patrimoine",
    beneficiaires:
      "Bénéficiaires d'assurance-vie de plus de 8 ans, principalement les héritiers de patrimoines aisés.",
    description:
      "Exonération à 152 500 €/bénéficiaire pour les versements avant 70 ans, 30 500 € après. Permet de transmettre hors succession à un taux très réduit.",
    justification:
      "Encourager l'épargne longue (financement des entreprises via les assureurs).",
    evaluation:
      "Conseil des prélèvements obligatoires : profite très majoritairement aux 10 % patrimoines les plus élevés. Plusieurs propositions de plafonnement, écartées par les lobbies des assureurs.",
    source: "Voies et moyens 2025, CPO 2018",
  },
  {
    id: "tva-restauration",
    nom: "Taux réduit TVA restauration",
    coutMdEur: 3.2,
    categorie: "consommation",
    beneficiaires:
      "Restaurateurs (en théorie), mais effets prix peu transmis aux consommateurs. ~250 000 restaurants concernés.",
    description:
      "TVA à 10 % (au lieu de 20 %) sur la restauration sur place. Mise en place en 2009 (baisse de 19,6 % à 5,5 % puis remontée).",
    justification:
      "Soutenir le secteur restauration et les emplois peu qualifiés (engagement « contrat d'avenir » avec syndicats du secteur).",
    evaluation:
      "Cour des comptes 2010 : engagements créations d'emplois et baisse des prix non tenus. France Stratégie 2017 : effet décevant. Maintenue pour raison politique (~30 000 emplois sauvegardés selon le secteur).",
    source: "Voies et moyens 2025, Cour des comptes",
  },
  {
    id: "pacte-dutreil",
    nom: "Pacte Dutreil — transmission d'entreprise",
    coutMdEur: 3.0,
    categorie: "patrimoine",
    beneficiaires:
      "Héritiers et donataires d'entreprises familiales (capital). Concentré sur quelques milliers de transmissions par an.",
    description:
      "Abattement de 75 % sur la valeur des titres d'entreprise transmis par succession ou donation, sous condition d'engagement de conservation collective de 6 ans.",
    justification:
      "Faciliter la transmission familiale des entreprises et préserver l'emploi local.",
    evaluation:
      "Conseil des prélèvements obligatoires 2018 : « avantage très important sans contrepartie suffisante ». Cour des comptes : appelle à un meilleur ciblage. Très défendu par les fédérations patronales.",
    source: "Voies et moyens 2025, CPO 2018",
  },
  {
    id: "exo-pv-residence",
    nom: "Exonération plus-values résidence principale",
    coutMdEur: 4.5,
    categorie: "patrimoine",
    beneficiaires:
      "Tous les propriétaires occupants qui revendent leur résidence principale.",
    description:
      "La plus-value réalisée à la revente de la résidence principale est totalement exonérée d'impôt. Sans plafond, sans durée minimale d'occupation.",
    justification:
      "Faciliter la mobilité géographique et l'accession à la propriété (ne pas pénaliser les déménagements).",
    evaluation:
      "Cour des comptes 2023 : avantage très large, sans plafond, profitant aussi à des plus-values très élevées (Paris). Plusieurs propositions de plafonnement.",
    source: "Voies et moyens 2025",
  },
  {
    id: "primrenov",
    nom: "MaPrimeRénov' / CITE",
    abbr: "MPR",
    coutMdEur: 2.4,
    categorie: "logement",
    beneficiaires:
      "Propriétaires (occupants et bailleurs) réalisant des travaux de rénovation énergétique.",
    description:
      "Aide forfaitaire pour les travaux d'isolation, chauffage écologique, ventilation. Versée par l'ANAH. Remplace le CITE (crédit d'impôt) depuis 2020.",
    justification:
      "Atteindre les objectifs climat (Stratégie nationale bas carbone) et lutter contre la précarité énergétique.",
    evaluation:
      "Cour des comptes 2023 : « insuffisamment ciblé », effet rebond, faible impact climat par euro investi. Réforme 2024 pour cibler les ménages modestes.",
    source: "Voies et moyens 2025, Cour des comptes 2023",
  },
  {
    id: "demi-part-veufs",
    nom: "Demi-part fiscale parents isolés / veufs",
    coutMdEur: 1.6,
    categorie: "menages",
    beneficiaires:
      "Parents isolés ayant élevé seul un enfant, et veufs/veuves avec enfants à charge.",
    description:
      "Demi-part supplémentaire au quotient familial pour les contribuables ayant élevé seul un enfant pendant 5 ans. Avantage fiscal plafonné à 1 050 €.",
    justification:
      "Soutien aux familles monoparentales, reconnaissance des charges éducatives passées.",
    evaluation:
      "Mesure restreinte en 2009 (avant : tous les célibataires sans enfant à charge). Recentrée sur ceux qui ont vraiment élevé un enfant.",
    source: "Voies et moyens 2025",
  },
  {
    id: "micro-bnc-bic",
    nom: "Régime micro-BIC / micro-BNC",
    coutMdEur: 2.5,
    categorie: "entreprises",
    beneficiaires:
      "Micro-entrepreneurs (autoentrepreneurs), petites entreprises individuelles (CA < 188 700 € pour BIC, < 77 700 € pour BNC).",
    description:
      "Abattement forfaitaire (50 % BIC, 71 % BIC ventes, 34 % BNC) sur le chiffre d'affaires avant calcul de l'IR. Simplifie radicalement la comptabilité.",
    justification:
      "Faciliter la création d'activité et l'entrepreneuriat (succès indéniable depuis 2009).",
    evaluation:
      "Cour des comptes : abattements parfois très éloignés des frais réels (sur-compensation). Mais succès du dispositif (2,5 millions d'autoentrepreneurs).",
    source: "Voies et moyens 2025",
  },
  {
    id: "pinel",
    nom: "Réduction Pinel — investissement locatif",
    coutMdEur: 1.3,
    categorie: "logement",
    beneficiaires:
      "Investisseurs particuliers achetant un logement neuf pour le louer (zones tendues). Concentré sur les 20 % ménages les plus aisés.",
    description:
      "Réduction d'IR de 12 à 21 % du prix d'achat selon la durée d'engagement (6, 9 ou 12 ans). En extinction depuis 2024 (remplacé par dispositifs ciblés).",
    justification:
      "Soutenir la construction de logements neufs en zones tendues.",
    evaluation:
      "Cour des comptes 2018 : « efficacité douteuse », effet d'aubaine massif, impact prix marginal. Décision d'extinction validée 2022.",
    source: "Voies et moyens 2025, Cour des comptes 2018",
  },
  {
    id: "ticpe-routiers",
    nom: "TICPE remboursée transports routiers",
    coutMdEur: 1.2,
    categorie: "sectoriel",
    beneficiaires:
      "Entreprises de transport routier de marchandises (PL > 7,5 t).",
    description:
      "Remboursement partiel de la taxe sur le gazole professionnel (TICPE). Réduit de fait la taxe carburant sur le transport routier.",
    justification:
      "Compétitivité du transport routier français face à la concurrence européenne (cabotage).",
    evaluation:
      "Contradiction directe avec les objectifs climat (encourage le routier vs ferroutage). Plusieurs rapports appellent à sa suppression progressive.",
    source: "Voies et moyens 2025",
  },
  {
    id: "ticpe-agriculteurs",
    nom: "TICPE remboursée agriculteurs",
    coutMdEur: 0.9,
    categorie: "sectoriel",
    beneficiaires:
      "Exploitants agricoles utilisant du gazole non routier (GNR).",
    description:
      "Remboursement partiel de la TICPE sur le GNR utilisé pour les engins agricoles (tracteurs, moissonneuses).",
    justification:
      "Soutenir la compétitivité agricole, alléger les charges sur le secteur.",
    evaluation:
      "Contradiction objectifs climat. Annonce de suppression progressive 2023, suspendue après crise agricole 2024.",
    source: "Voies et moyens 2025",
  },
  {
    id: "exo-heures-sup",
    nom: "Exonération heures supplémentaires",
    coutMdEur: 1.8,
    categorie: "menages",
    beneficiaires:
      "Tous les salariés effectuant des heures supplémentaires (jusqu'à 7 500 €/an).",
    description:
      "Heures sup exonérées d'IR (plafond 7 500 €/an) et de cotisations salariales. Réintroduite en 2019 après suppression en 2012.",
    justification:
      "Soutenir le pouvoir d'achat des classes moyennes salariées et encourager le travail.",
    evaluation:
      "France Stratégie : effet emploi limité, redistribution principalement vers les salariés à moyens/hauts revenus.",
    source: "Voies et moyens 2025",
  },
  {
    id: "tva-presse-livre",
    nom: "Taux super-réduit TVA livre, presse, billetterie",
    coutMdEur: 0.7,
    categorie: "consommation",
    beneficiaires:
      "Éditeurs de presse, libraires, lecteurs, théâtres, cinémas.",
    description:
      "TVA à 2,1 % sur la presse imprimée, 5,5 % sur les livres et la billetterie spectacles vivants.",
    justification:
      "Exception culturelle française. Soutenir le pluralisme de la presse et l'accès à la culture.",
    evaluation:
      "Mesure consensuelle. Étendue à la presse en ligne en 2014. Pas de remise en cause majeure.",
    source: "Voies et moyens 2025",
  },
  {
    id: "jei",
    nom: "Jeunes Entreprises Innovantes",
    abbr: "JEI",
    coutMdEur: 0.3,
    categorie: "entreprises",
    beneficiaires:
      "Startups de moins de 8 ans engageant > 15 % de leur masse salariale en R&D. ~5 000 entreprises concernées.",
    description:
      "Exonération d'IS pendant la 1ʳᵉ année bénéficiaire, exonération de cotisations patronales sur les chercheurs/ingénieurs.",
    justification:
      "Soutenir la création d'entreprises innovantes (deeptech, biotech).",
    evaluation:
      "France Stratégie : impact positif net (effet emploi et survie des startups). Élargi en 2024 (statut JEC).",
    source: "Voies et moyens 2025",
  },
  {
    id: "outre-mer",
    nom: "Réductions IS / IR outre-mer",
    coutMdEur: 1.4,
    categorie: "territoires",
    beneficiaires:
      "Investisseurs particuliers et entreprises actives en Guadeloupe, Martinique, Guyane, Réunion, Mayotte.",
    description:
      "Réduction d'IR Girardin (jusqu'à 50 % d'investissement en outre-mer), exonération partielle d'IS (zone franche d'activité), TVA réduite.",
    justification:
      "Compenser les surcoûts géographiques et soutenir le développement économique ultramarin.",
    evaluation:
      "Cour des comptes 2018 : effets contrastés. Avantages parfois captés par des intermédiaires métropolitains plutôt que par les territoires bénéficiaires.",
    source: "Voies et moyens 2025, Cour des comptes 2018",
  },
  {
    id: "exo-zfu-zrr",
    nom: "Zones franches urbaines / ZRR rurales",
    coutMdEur: 0.5,
    categorie: "territoires",
    beneficiaires:
      "Entreprises s'implantant en zones défavorisées (urbaines ou rurales) et leurs salariés.",
    description:
      "Exonération partielle ou totale d'IS, de cotisations patronales, de cotisation foncière des entreprises (CFE) pendant 5 à 8 ans.",
    justification:
      "Lutter contre la désertification économique et soutenir l'emploi en territoires fragiles.",
    evaluation:
      "France Stratégie 2020 : effets très limités sur l'emploi local (effet d'aubaine, déplacement plutôt que création).",
    source: "Voies et moyens 2025, France Stratégie 2020",
  },
  {
    id: "pea",
    nom: "PEA — exonération plus-values",
    coutMdEur: 0.8,
    categorie: "patrimoine",
    beneficiaires:
      "Particuliers détenant un Plan d'Épargne en Actions de plus de 5 ans. Très concentré sur les CSP+.",
    description:
      "Plus-values et dividendes exonérés d'IR (sauf prélèvements sociaux) après 5 ans de détention. Plafond 150 000 € de versements.",
    justification:
      "Encourager l'épargne en actions pour financer les entreprises françaises.",
    evaluation:
      "Conseil des prélèvements obligatoires : profite presque exclusivement au top décile. Effet sur le financement entreprises modeste.",
    source: "Voies et moyens 2025, CPO",
  },
  {
    id: "madelin-pme",
    nom: "Réduction Madelin — souscription PME",
    coutMdEur: 0.4,
    categorie: "patrimoine",
    beneficiaires:
      "Particuliers investissant dans des PME (directement ou via FIP/FCPI).",
    description:
      "Réduction d'IR de 18-25 % du montant investi, plafonné à 50 000 €/12 000 € selon situation. Engagement de conservation 5 ans.",
    justification:
      "Faciliter le financement en fonds propres des PME, drainage de l'épargne privée vers le tissu productif.",
    evaluation:
      "Mesure régulièrement contestée (effet d'aubaine, défiscalisation pour les hauts revenus). Plafond resserré progressivement.",
    source: "Voies et moyens 2025",
  },
  {
    id: "apprentissage",
    nom: "Crédit d'impôt apprentissage et alternance",
    coutMdEur: 0.6,
    categorie: "entreprises",
    beneficiaires:
      "Entreprises embauchant des apprentis ou alternants. Bénéfice indirect : 850 000 alternants en 2024.",
    description:
      "Crédit d'impôt de 1 600 € par apprenti la 1ʳᵉ année. Cumulable avec aide unique à l'embauche (4 000 € pour < 30 ans).",
    justification:
      "Massifier l'alternance (objectif 1 million d'apprentis sous Macron II).",
    evaluation:
      "France Stratégie : impact positif net sur l'insertion des jeunes. Coût direct compensé par la baisse du chômage des moins de 25 ans.",
    source: "Voies et moyens 2025",
  },
  {
    id: "micro-foncier",
    nom: "Régime micro-foncier (abattement 30 %)",
    coutMdEur: 0.4,
    categorie: "patrimoine",
    beneficiaires:
      "Petits propriétaires bailleurs (< 15 000 € de revenus locatifs annuels).",
    description:
      "Abattement forfaitaire de 30 % sur les loyers déclarés (équivalent des charges déductibles), sans justificatif.",
    justification:
      "Simplifier la déclaration fiscale pour les petits bailleurs.",
    evaluation:
      "Souvent sur-compense les charges réelles (effet d'aubaine), mais coût modeste.",
    source: "Voies et moyens 2025",
  },
  {
    id: "tva-ehpad",
    nom: "Taux réduit TVA secteur médico-social",
    coutMdEur: 1.5,
    categorie: "consommation",
    beneficiaires:
      "EHPAD, foyers d'accueil, structures médico-sociales et leurs résidents.",
    description:
      "TVA à 5,5 % sur les prestations d'hébergement et de soins en EHPAD et structures médico-sociales (au lieu de 20 %).",
    justification:
      "Préserver l'accessibilité financière de l'hébergement pour les personnes âgées et handicapées.",
    evaluation:
      "Mesure peu contestée. Indispensable au modèle économique du secteur.",
    source: "Voies et moyens 2025",
  },
];

// Total approximatif (officiel : ~95 Md€ pour 470 niches)
export const TOTAL_NICHES_MD_EUR_OFFICIEL = 95;
export const NB_NICHES_TOTALES = 470;

// Métadonnées catégories pour l'UI
export const CATEGORIES_INFO: Record<
  CategorieNiche,
  { label: string; color: string; description: string }
> = {
  menages: {
    label: "Ménages",
    color: "#0055A4",
    description: "Réductions et crédits d'impôt qui visent directement les particuliers (IR, CSG, abattements).",
  },
  entreprises: {
    label: "Entreprises",
    color: "#7c3aed",
    description: "Crédits d'impôt et exonérations pour les sociétés (CIR, JEI, micro-régimes).",
  },
  logement: {
    label: "Logement",
    color: "#16a34a",
    description: "Niches liées à l'immobilier (rénovation, locatif, accession).",
  },
  patrimoine: {
    label: "Patrimoine",
    color: "#d97706",
    description: "Succession, transmission, assurance-vie, plus-values, PEA.",
  },
  consommation: {
    label: "Consommation",
    color: "#dc2626",
    description: "Taux de TVA réduits sur certains biens et services.",
  },
  territoires: {
    label: "Territoires",
    color: "#0891b2",
    description: "Outre-mer, zones franches urbaines, zones rurales.",
  },
  sectoriel: {
    label: "Sectoriel",
    color: "#64748b",
    description: "Régimes spécifiques par secteur (transports, agriculture, BTP, énergie).",
  },
};
