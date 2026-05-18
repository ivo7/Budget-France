// ============================================================================
// evaluationsPolitiques.ts — compilation des évaluations indépendantes
// des grandes politiques publiques françaises
// ============================================================================
//
// Objectif : agréger les conclusions des institutions d'évaluation
// indépendantes (Cour des comptes, France Stratégie, IPP, CAE, CPO,
// inspections IGAS/IGF) pour offrir une vue d'ensemble accessible.
//
// Sources : rapports publics individuels de chaque évaluation, listés dans
// le champ `source`. Tous accessibles en ligne sur les sites des institutions.
//
// Mise à jour : annuelle, à chaque nouvelle vague de rapports majeurs.
// ============================================================================

export type Domaine =
  | "fiscalite"
  | "social"
  | "logement"
  | "emploi"
  | "transport"
  | "energie"
  | "education"
  | "sante"
  | "macroeconomie";

export type Verdict = "positif" | "mitige" | "negatif" | "trop-tot";

export type Institution =
  | "Cour des comptes"
  | "France Stratégie"
  | "IPP"
  | "CAE"
  | "CPO"
  | "COR"
  | "DREES"
  | "IGAS"
  | "IGF"
  | "ART";

export interface EvaluationPolitique {
  id: string;
  politique: string;
  emoji: string;
  domaine: Domaine;
  /** Année de mise en place de la politique évaluée */
  anneePolitique: string;
  /** Coût annuel estimé (pour contexte) */
  coutAnnuelMdEur?: number;
  /** Quel organisme a évalué */
  institution: Institution;
  /** Année du rapport d'évaluation cité */
  anneeEvaluation: string;
  /** Conclusion synthétique en 1 verdict */
  verdict: Verdict;
  /** Conclusions principales (2-4 bullets) */
  conclusions: string[];
  /** Recommandations principales du rapport (2-3 bullets) */
  recommandations?: string[];
  /** Lien vers le rapport original */
  source: string;
}

export const EVALUATIONS: EvaluationPolitique[] = [
  {
    id: "cir",
    politique: "Crédit Impôt Recherche (CIR)",
    emoji: "🔬",
    domaine: "fiscalite",
    anneePolitique: "1983, réformé 2008",
    coutAnnuelMdEur: 7.2,
    institution: "Cour des comptes",
    anneeEvaluation: "2021",
    verdict: "mitige",
    conclusions: [
      "Effet additionnel sur la R&D privée significatif pour les PME (+0,4 € de R&D par € de CIR investi)",
      "Pour les grands groupes, effet d'aubaine massif : 50 % du CIR pour 100 entreprises, gain en R&D limité",
      "Coût total +500 % en 20 ans (de 1 Md€ en 2008 à 7,2 Md€ en 2024), sans hausse proportionnelle de la R&D privée française",
      "Insuffisamment ciblé sur les secteurs stratégiques",
    ],
    recommandations: [
      "Plafonner le CIR pour les grands groupes ou différencier le taux",
      "Renforcer les contrôles fiscaux (~10 % redressements actuellement)",
      "Évaluer régulièrement par dispositif sectoriel",
    ],
    source: "https://www.ccomptes.fr/fr/publications/le-credit-dimpot-recherche-2021",
  },
  {
    id: "cice-allegements",
    politique: "CICE → allègements de cotisations bas salaires (2019)",
    emoji: "💼",
    domaine: "emploi",
    anneePolitique: "CICE 2013-2018, allègements pérennes depuis 2019",
    coutAnnuelMdEur: 22.0,
    institution: "France Stratégie",
    anneeEvaluation: "2024",
    verdict: "mitige",
    conclusions: [
      "Effet emploi positif net estimé entre 100 000 et 400 000 emplois sauvegardés/créés",
      "Coût/emploi très élevé : ~60 000 € à 220 000 €/emploi/an, l'un des dispositifs les plus chers de l'OCDE",
      "Effet trappe à bas salaires confirmé : passer 1,6 SMIC fait perdre l'allègement, désincite à monter en compétences/salaire",
      "Renforce la compétitivité-prix des secteurs exposés (industrie, transports)",
    ],
    recommandations: [
      "Reciblage : recentrer sur < 1,3 SMIC ou supprimer progressivement au-dessus",
      "Coupler à des actions de formation pour faire monter les bas salaires",
    ],
    source: "https://www.strategie.gouv.fr",
  },
  {
    id: "flat-tax-pfu",
    politique: "Flat tax 30 % sur revenus du capital (PFU 2018)",
    emoji: "💰",
    domaine: "fiscalite",
    anneePolitique: "2018",
    coutAnnuelMdEur: 1.5,
    institution: "France Stratégie",
    anneeEvaluation: "2024 (Comité d'évaluation annuel)",
    verdict: "positif",
    conclusions: [
      "Effet positif net sur les distributions de dividendes (+50 % en 2018-2023)",
      "Hausse significative des investissements en actions par les ménages (PEA, PER)",
      "Effet redistributif négatif : les revenus du capital étant concentrés sur le top 1 %, le PFU réduit leur taux effectif d'imposition",
      "Pas d'effet majeur visible sur l'investissement productif des entreprises (mais difficile à isoler des autres facteurs)",
    ],
    recommandations: [
      "Maintenir le PFU mais surveiller la concentration des bénéfices",
      "Renforcer la fiscalité des plus-values immobilières (non couvertes par PFU)",
    ],
    source: "https://www.strategie.gouv.fr/sites/strategie.gouv.fr/files/atoms/files/fs_rapport_pfu-isf_octobre_2023.pdf",
  },
  {
    id: "isf-ifi",
    politique: "Suppression de l'ISF / création de l'IFI (2018)",
    emoji: "🏰",
    domaine: "fiscalite",
    anneePolitique: "2018",
    coutAnnuelMdEur: -3.5,
    institution: "France Stratégie",
    anneeEvaluation: "2024",
    verdict: "mitige",
    conclusions: [
      "Pas d'effet significatif sur les retours d'exil fiscal (les 1 200 départs/an annoncés ne sont pas revenus en masse)",
      "Effet positif marginal sur l'investissement productif via le PFU concomitant",
      "Manque à gagner fiscal de ~3,5 Md€/an pour l'État",
      "Concentration accrue du patrimoine au sommet (top 1 % France : +20 % de patrimoine net sur 2017-2023)",
    ],
    recommandations: [
      "Évaluer le retour à un ISF élargi (avec base immobilier + actions, comme Espagne)",
      "Renforcer la fiscalité des successions patrimoines > 1 M€",
    ],
    source: "https://www.strategie.gouv.fr/publications/rapport-comite-devaluation-reformes-fiscalite-capital",
  },
  {
    id: "taxe-habitation",
    politique: "Suppression progressive de la taxe d'habitation (2020-2023)",
    emoji: "🏠",
    domaine: "fiscalite",
    anneePolitique: "2020-2023",
    coutAnnuelMdEur: 18.5,
    institution: "Cour des comptes",
    anneeEvaluation: "2023",
    verdict: "negatif",
    conclusions: [
      "Compensation État aux communes via fraction de TVA fonctionne mais déconnecte recettes locales et politique fiscale locale",
      "Réduit l'autonomie financière des communes (taxe foncière reste mais base étroite)",
      "Effet redistributif limité : les 20 % derniers déciles bénéficiaient déjà d'allègements (THM exonération)",
      "Coût budgétaire total de 18,5 Md€/an supporté par l'État central",
    ],
    recommandations: [
      "Repenser la fiscalité locale (réformer la taxe foncière sur base de valeurs récentes)",
      "Restaurer un lien fiscalité locale / résidents (proposition CPO : taxe locale modulée selon revenus)",
    ],
    source: "https://www.ccomptes.fr",
  },
  {
    id: "primrenov",
    politique: "MaPrimeRénov' (2020)",
    emoji: "🏘️",
    domaine: "logement",
    anneePolitique: "2020 (refonte 2024)",
    coutAnnuelMdEur: 2.4,
    institution: "Cour des comptes",
    anneeEvaluation: "2023",
    verdict: "negatif",
    conclusions: [
      "Insuffisamment ciblé sur les ménages modestes (45 % aux ménages déciles 6-10)",
      "Effet rebond important : ~30 % des aides vont à des projets qui auraient été faits sans aide",
      "Faible impact climat par euro investi (coût de la tonne CO₂ évitée : ~150-300 €, élevé)",
      "Complexité administrative : taux de refus dossiers 25 %",
    ],
    recommandations: [
      "Refonte 2024 a recentré sur les rénovations globales (bon point)",
      "Concentrer sur passoires thermiques (G/F) et ménages modestes",
      "Renforcer accompagnement (« Mon Accompagnateur Rénov » obligatoire)",
    ],
    source: "https://www.ccomptes.fr",
  },
  {
    id: "apprentissage",
    politique: "Réforme apprentissage (2018, loi Pénicaud)",
    emoji: "🎓",
    domaine: "emploi",
    anneePolitique: "2018",
    coutAnnuelMdEur: 5.5,
    institution: "France Stratégie",
    anneeEvaluation: "2024",
    verdict: "positif",
    conclusions: [
      "Explosion du nombre d'alternants : de 280 000 (2017) à 850 000 (2024), soit +200 %",
      "Insertion professionnelle des jeunes améliorée (taux d'emploi à 6 mois > 65 %)",
      "Effet d'aubaine notable : ~25 % des contrats auraient été signés sans aide unique",
      "Bénéfice de l'enseignement supérieur (60 % des contrats sont en bac+2 et plus), moins en lycée pro",
    ],
    recommandations: [
      "Recentrer aide unique sur niveaux infra-bac et < 30 ans",
      "Renforcer qualité formations (certaines écoles privées low-cost ouvertes pour capter manne)",
    ],
    source: "https://www.strategie.gouv.fr",
  },
  {
    id: "retraites-2023",
    politique: "Réforme des retraites (2023, recul à 64 ans)",
    emoji: "👵",
    domaine: "social",
    anneePolitique: "2023",
    institution: "COR",
    anneeEvaluation: "2024",
    verdict: "trop-tot",
    conclusions: [
      "Équilibre financier prévu en 2027 selon hypothèses centrales (impact +18 Md€/an à terme)",
      "Recul effectif d'âge moyen départ : de 63,2 à 64,5 ans estimé d'ici 2030",
      "Hausse minimum vieillesse : +100 €/mois pour ~200 000 retraités modestes",
      "Pénibilité : extension du C2P, mais effet limité (~50 000 personnes/an concernées)",
      "Régimes spéciaux supprimés (RATP, SNCF, IEG…) pour les nouveaux entrants",
    ],
    recommandations: [
      "Surveiller le maintien de l'équilibre selon évolution démographique réelle",
      "Évaluer les régimes restants (fonction publique territoriale, hospitalière)",
    ],
    source: "https://www.cor-retraites.fr",
  },
  {
    id: "prime-activite",
    politique: "Prime d'activité (2016)",
    emoji: "💵",
    domaine: "social",
    anneePolitique: "2016",
    coutAnnuelMdEur: 10.0,
    institution: "DREES",
    anneeEvaluation: "2023",
    verdict: "positif",
    conclusions: [
      "Taux de recours élevé (~70 %), nettement supérieur au RSA activité qu'elle remplace (~50 %)",
      "Bénéficie à 4,4 millions de foyers actifs aux revenus modestes",
      "Effet positif sur le pouvoir d'achat des travailleurs au SMIC et juste au-dessus",
      "Effet incitation à l'emploi modéré (modèle empirique IPP)",
    ],
    recommandations: [
      "Automatiser le versement (lien direct avec DSN, en cours de déploiement)",
      "Évaluer la simplification combinaison avec autres aides (APL, AAH)",
    ],
    source: "https://drees.solidarites-sante.gouv.fr",
  },
  {
    id: "france-relance",
    politique: "France Relance (2020-2022)",
    emoji: "🚀",
    domaine: "macroeconomie",
    anneePolitique: "2020-2022",
    coutAnnuelMdEur: 33.0,
    institution: "France Stratégie",
    anneeEvaluation: "2024",
    verdict: "mitige",
    conclusions: [
      "100 Md€ déployés en 2 ans, dont 40 % transition écologique, 35 % compétitivité, 25 % cohésion",
      "Effet relance macro positif (+0,5 à +1 point de PIB en 2021-2022)",
      "Déploiement inégal : la part « cohésion sociale » sous-exécutée vs « compétitivité » sur-réalisée",
      "Difficulté évaluation par dispositif (multiplicité, brièveté)",
    ],
    recommandations: [
      "Pérenniser les mécanismes efficaces dans France 2030",
      "Renforcer le pilotage par indicateurs d'impact (vs simples décaissements)",
    ],
    source: "https://www.strategie.gouv.fr",
  },
  {
    id: "loi-pacte-ferroviaire",
    politique: "Loi Pacte ferroviaire (ouverture concurrence SNCF, 2018)",
    emoji: "🚆",
    domaine: "transport",
    anneePolitique: "2018-2020",
    institution: "ART",
    anneeEvaluation: "2024",
    verdict: "trop-tot",
    conclusions: [
      "État a repris 35 Md€ de dette SNCF Réseau pour permettre l'ouverture",
      "TGV : 1ʳᵉ ouverture concurrence en 2020 (Trenitalia Paris-Lyon, SNCF Voyageurs maintient 95 % part marché)",
      "TER : ouverture progressive 2024-2034. Premiers appels d'offres remportés par Transdev, Régiorail",
      "Effets prix limités jusqu'ici (offre concurrentielle limitée), à confirmer à 5-10 ans",
    ],
    recommandations: [
      "Veiller à l'égalité d'accès aux infrastructures (SNCF Réseau)",
      "Évaluer impact qualité service post-ouverture TER",
    ],
    source: "https://www.autorite-transports.fr",
  },
  {
    id: "pacte-dutreil",
    politique: "Pacte Dutreil (transmission d'entreprise, depuis 2003)",
    emoji: "🏛️",
    domaine: "fiscalite",
    anneePolitique: "2003, élargi 2018-2024",
    coutAnnuelMdEur: 3.0,
    institution: "CPO",
    anneeEvaluation: "2018, réactualisé 2024",
    verdict: "negatif",
    conclusions: [
      "Abattement 75 % très généreux, sans contrepartie sérieuse (engagement de conservation 6 ans peu contrôlé)",
      "Bénéfice concentré sur quelques milliers de transmissions/an, top 1 % des patrimoines",
      "Comparaison internationale : régime français parmi les plus avantageux d'Europe",
      "Coût budgétaire en hausse continue (de 0,5 Md€ en 2003 à 3 Md€ en 2024)",
    ],
    recommandations: [
      "Mieux cibler : limiter aux entreprises < 250 salariés",
      "Renforcer les contrôles de l'engagement de conservation",
      "Plafonnement progressif au-dessus d'un seuil de valeur transmise",
    ],
    source: "https://www.ccomptes.fr/fr/cpo",
  },
  {
    id: "rsa",
    politique: "Revenu de Solidarité Active (RSA, 2009)",
    emoji: "🤝",
    domaine: "social",
    anneePolitique: "2009 (refonte 2024)",
    coutAnnuelMdEur: 13.0,
    institution: "IPP",
    anneeEvaluation: "2023",
    verdict: "mitige",
    conclusions: [
      "Filet de sécurité essentiel : ~1,8 million de foyers bénéficiaires",
      "Taux de recours faible : ~63 % (37 % des éligibles ne demandent pas)",
      "Effet incitation à l'emploi : faible mais positif (sortie progressive de l'inactivité)",
      "Réforme 2024 (RSA conditionné à 15h/sem) : effets en cours d'évaluation, premiers retours mitigés",
    ],
    recommandations: [
      "Automatiser l'attribution (lien DGFiP-CAF)",
      "Renforcer accompagnement personnalisé",
      "Évaluer rigoureusement le conditionnement 15h/sem en 2025-2026",
    ],
    source: "https://www.ipp.eu",
  },
  {
    id: "education-priorite",
    politique: "Éducation prioritaire / dédoublement CP-CE1 (2017-2019)",
    emoji: "📚",
    domaine: "education",
    anneePolitique: "2017-2019",
    coutAnnuelMdEur: 1.0,
    institution: "France Stratégie",
    anneeEvaluation: "2024",
    verdict: "positif",
    conclusions: [
      "Dédoublement de 12 000 classes en REP/REP+ (300 000 élèves concernés)",
      "Effet positif mesuré sur les acquis fondamentaux en CP : +8 % en français, +13 % en mathématiques (DEPP)",
      "Effet plus modeste en CE1 (l'effet « primo » du dédoublement décroît)",
      "Coût ~1 Md€/an mais bénéfice cognitif long terme significatif",
    ],
    recommandations: [
      "Étendre progressivement aux GS de maternelle (en cours)",
      "Coupler avec formation continue des enseignants (effet maître plus important que taille classe)",
    ],
    source: "https://www.strategie.gouv.fr",
  },
  {
    id: "tva-restauration",
    politique: "Taux réduit TVA restauration (5,5 % puis 10 % depuis 2009)",
    emoji: "🍽️",
    domaine: "fiscalite",
    anneePolitique: "2009",
    coutAnnuelMdEur: 3.2,
    institution: "Cour des comptes",
    anneeEvaluation: "2010, ré-évalué 2017",
    verdict: "negatif",
    conclusions: [
      "Engagement « contrat d'avenir » signé en 2009 (création 40 000 emplois, baisse prix 11,8 %) non tenu",
      "Effet prix transmis aux consommateurs : <5 % (vs 11,8 % promis)",
      "Effet emploi : ~20 000-30 000 emplois nets, vs 40 000 promis (coût/emploi : ~150 K€/an)",
      "Maintien politique malgré bilan négatif (poids lobby restaurateurs)",
    ],
    recommandations: [
      "Retour au taux normal 20 % progressivement",
      "Réorienter les 3,2 Md€/an vers aides ciblées emploi peu qualifié",
    ],
    source: "https://www.ccomptes.fr",
  },
];

// ============================================================================
// Métadonnées pour l'UI
// ============================================================================

export const VERDICT_INFO: Record<
  Verdict,
  { label: string; color: string; emoji: string }
> = {
  positif: { label: "Positif", color: "#16a34a", emoji: "✓" },
  mitige: { label: "Mitigé", color: "#d97706", emoji: "~" },
  negatif: { label: "Négatif", color: "#dc2626", emoji: "✗" },
  "trop-tot": { label: "Trop tôt", color: "#64748b", emoji: "?" },
};

export const DOMAINE_INFO: Record<Domaine, { label: string; emoji: string }> = {
  fiscalite: { label: "Fiscalité", emoji: "💰" },
  social: { label: "Social", emoji: "🤝" },
  logement: { label: "Logement", emoji: "🏠" },
  emploi: { label: "Emploi", emoji: "💼" },
  transport: { label: "Transport", emoji: "🚆" },
  energie: { label: "Énergie", emoji: "⚡" },
  education: { label: "Éducation", emoji: "📚" },
  sante: { label: "Santé", emoji: "🏥" },
  macroeconomie: { label: "Macroéconomie", emoji: "📈" },
};

export const INSTITUTIONS_INFO: Record<Institution, { url: string }> = {
  "Cour des comptes": { url: "https://www.ccomptes.fr" },
  "France Stratégie": { url: "https://www.strategie.gouv.fr" },
  IPP: { url: "https://www.ipp.eu" },
  CAE: { url: "https://www.cae-eco.fr" },
  CPO: { url: "https://www.ccomptes.fr/fr/cpo" },
  COR: { url: "https://www.cor-retraites.fr" },
  DREES: { url: "https://drees.solidarites-sante.gouv.fr" },
  IGAS: { url: "https://www.igas.gouv.fr" },
  IGF: { url: "https://www.economie.gouv.fr/igf" },
  ART: { url: "https://www.autorite-transports.fr" },
};
