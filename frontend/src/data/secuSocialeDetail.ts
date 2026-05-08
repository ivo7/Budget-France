// ============================================================================
// secuSocialeDetail.ts — la Sécu française branche par branche
// ============================================================================
//
// Sources principales :
//   - Loi de financement de la Sécurité sociale (LFSS) 2025
//   - Rapports de la Commission des comptes de la Sécurité sociale (CCSS)
//   - DREES — Comptes de la protection sociale 2024
//   - URSSAF Caisse nationale — recouvrement
//   - Cour des comptes — rapports annuels Sécu
//
// Périmètre : Sécurité sociale au sens LFSS (5 branches du régime général)
// + Unédic (assurance chômage, gérée paritairement, hors LFSS) + complément
// retraites complémentaires (AGIRC-ARRCO, hors LFSS).
//
// Toutes les valeurs en Md€ 2024 (sauf historique) — arrondies à 0,1 Md€.

export type StatutBranche = "deficit" | "excedent" | "equilibre";

export interface BrancheSecu {
  id: string;
  nom: string;
  abbr?: string;
  emoji: string;
  /** Recettes 2024 en Md€ */
  recettesMdEur: number;
  /** Dépenses 2024 en Md€ */
  depensesMdEur: number;
  /** Couleur principale (hexa) */
  couleur: string;
  /** Description courte */
  description: string;
  /** Principaux postes de dépenses */
  postesDepenses: { poste: string; montantMdEur: number; description?: string }[];
  /** Sources de recettes principales */
  sourcesRecettes: { source: string; montantMdEur: number; description?: string }[];
  /** Effectif géré (bénéficiaires, cotisants, etc.) */
  perimetre: string;
  /** Enjeux et défis principaux */
  enjeux: string;
  /** Source officielle */
  source: string;
}

export const BRANCHES_SECU: BrancheSecu[] = [
  {
    id: "maladie",
    nom: "Maladie",
    abbr: "CNAM",
    emoji: "🏥",
    recettesMdEur: 243.0,
    depensesMdEur: 252.0,
    couleur: "#dc2626",
    description:
      "Branche la plus grosse de la Sécu : hôpitaux, médecins de ville, médicaments, indemnités journalières, médico-social. Pilote l'ONDAM (Objectif National de Dépenses d'Assurance Maladie) voté chaque année par le Parlement.",
    postesDepenses: [
      { poste: "Hôpital public + privé", montantMdEur: 102, description: "Établissements de santé, soins hospitaliers" },
      { poste: "Soins de ville", montantMdEur: 109, description: "Médecins, dentistes, kinés, biologie, médicaments" },
      { poste: "Médico-social", montantMdEur: 28, description: "EHPAD, handicap, services à domicile" },
      { poste: "Indemnités journalières", montantMdEur: 13, description: "Arrêts maladie, maternité" },
    ],
    sourcesRecettes: [
      { source: "Cotisations sociales", montantMdEur: 110, description: "Salariales + patronales sur salaires" },
      { source: "CSG affectée maladie", montantMdEur: 90, description: "Part CSG dédiée à l'assurance maladie" },
      { source: "TVA affectée + autres taxes", montantMdEur: 35, description: "Part TVA, taxe sur tabac/alcool" },
      { source: "Transferts État + autres", montantMdEur: 8 },
    ],
    perimetre: "67 millions de Français couverts. ~190 000 médecins, ~3 000 hôpitaux et cliniques, 1 milliard de consultations/an.",
    enjeux:
      "Vieillissement démographique (coût des ALD en hausse), tensions hospitalières post-Covid, médicaments innovants très chers (cancérologie, thérapies géniques), désertification médicale.",
    source: "LFSS 2025, CCSS rapport annuel",
  },
  {
    id: "retraite",
    nom: "Retraite — régime général",
    abbr: "CNAV",
    emoji: "👵",
    recettesMdEur: 158.0,
    depensesMdEur: 158.0,
    couleur: "#0055A4",
    description:
      "Régime général de base des salariés du privé. Verse les pensions de retraite des anciens salariés affiliés au régime général. Hors régimes spéciaux (SNCF, RATP, fonction publique) et complémentaires (Agirc-Arrco).",
    postesDepenses: [
      { poste: "Pensions de droit direct", montantMdEur: 134, description: "Pensions versées aux retraités" },
      { poste: "Pensions de réversion", montantMdEur: 17, description: "Au conjoint survivant" },
      { poste: "Frais de gestion", montantMdEur: 4 },
      { poste: "Minimum vieillesse (ASPA)", montantMdEur: 3 },
    ],
    sourcesRecettes: [
      { source: "Cotisations vieillesse", montantMdEur: 130, description: "Salariales + patronales" },
      { source: "FSV (fonds solidarité)", montantMdEur: 18, description: "Cotisations chômeurs, maternité" },
      { source: "CSG affectée", montantMdEur: 8 },
      { source: "Compensations État", montantMdEur: 2 },
    ],
    perimetre: "16 millions de retraités du régime général. Âge moyen départ effectif : 63,2 ans. Pension moyenne : ~1 530 €/mois.",
    enjeux:
      "Réforme 2023 (recul à 64 ans) atteint son équilibre vers 2027 selon les projections COR. Mais COR pessimiste (-13 Md€ en 2030 si rien ne change) car ratio actifs/retraités se dégrade (1,7 actif/retraité en 2024 vs 2,5 en 1990).",
    source: "LFSS 2025, COR rapport annuel 2024",
  },
  {
    id: "famille",
    nom: "Famille",
    abbr: "CNAF",
    emoji: "👨‍👩‍👧",
    recettesMdEur: 53.5,
    depensesMdEur: 53.0,
    couleur: "#16a34a",
    description:
      "Allocations familiales, prime d'activité, APL, AAH (Allocation Adulte Handicapé), ASF (Allocation Soutien Familial), prestations petite enfance. Branche structurellement excédentaire ces dernières années.",
    postesDepenses: [
      { poste: "Allocations familiales", montantMdEur: 12, description: "À partir du 2ᵉ enfant" },
      { poste: "APL — aide au logement", montantMdEur: 14, description: "Soutien au paiement du loyer" },
      { poste: "AAH — handicap", montantMdEur: 13, description: "Allocation Adulte Handicapé" },
      { poste: "Prime d'activité", montantMdEur: 10, description: "Complément revenus travailleurs modestes" },
      { poste: "Petite enfance + autres", montantMdEur: 4 },
    ],
    sourcesRecettes: [
      { source: "Cotisations patronales famille", montantMdEur: 38, description: "Sur salaires (taux 5,25 %)" },
      { source: "CSG affectée famille", montantMdEur: 9 },
      { source: "Transferts État (RSA)", montantMdEur: 6 },
    ],
    perimetre: "13,5 millions de foyers allocataires. ~12 millions d'enfants concernés.",
    enjeux:
      "Stabilisation après les baisses des années 2010 (modulation allocations selon revenus). Question récurrente : faut-il universaliser à nouveau les AF ou mieux cibler ? La PLF 2025 reconduit le statu quo.",
    source: "LFSS 2025, rapport CNAF",
  },
  {
    id: "atmp",
    nom: "Accidents du travail / Maladies pro",
    abbr: "AT/MP",
    emoji: "⚠️",
    recettesMdEur: 16.5,
    depensesMdEur: 14.5,
    couleur: "#d97706",
    description:
      "Couvre les accidents survenus au travail et les maladies professionnelles. Financée UNIQUEMENT par les cotisations patronales (le risque est porté par l'employeur). Branche structurellement excédentaire.",
    postesDepenses: [
      { poste: "Indemnités journalières AT/MP", montantMdEur: 5 },
      { poste: "Rentes (incapacité permanente)", montantMdEur: 6 },
      { poste: "Soins médicaux liés", montantMdEur: 2 },
      { poste: "Prévention + frais gestion", montantMdEur: 1.5 },
    ],
    sourcesRecettes: [
      { source: "Cotisations patronales AT/MP", montantMdEur: 16.5, description: "Taux variable selon secteur (BTP, industrie chimique, etc.)" },
    ],
    perimetre: "Tous les salariés du privé. ~640 000 AT déclarés/an, ~50 000 MP reconnues/an.",
    enjeux:
      "L'excédent structurel sert à reverser à la branche maladie (transfert de ~2 Md€/an), pour compenser la sous-déclaration des AT/MP comptés à tort en maladie.",
    source: "LFSS 2025, rapport AT/MP",
  },
  {
    id: "autonomie",
    nom: "Autonomie",
    abbr: "CNSA",
    emoji: "🧓",
    recettesMdEur: 37.5,
    depensesMdEur: 38.0,
    couleur: "#7c3aed",
    description:
      "5ᵉ branche créée en 2021. Finance la perte d'autonomie : APA (Allocation Personnalisée d'Autonomie), PCH (Prestation de Compensation du Handicap), tarification EHPAD, ESAT, services à domicile. Centralise des financements auparavant éparpillés.",
    postesDepenses: [
      { poste: "EHPAD + médicalisation", montantMdEur: 14, description: "Tarif soins et dépendance" },
      { poste: "APA (vieillissement)", montantMdEur: 7, description: "Allocation Personnalisée d'Autonomie" },
      { poste: "PCH (handicap)", montantMdEur: 3, description: "Prestation de Compensation du Handicap" },
      { poste: "Services autonomie domicile", montantMdEur: 7 },
      { poste: "Investissement et innovation", montantMdEur: 7 },
    ],
    sourcesRecettes: [
      { source: "CSG affectée autonomie", montantMdEur: 30, description: "0,15 % du revenu (loi 2020)" },
      { source: "CASA (contribution solidarité autonomie)", montantMdEur: 1.5, description: "0,3 % sur revenus retraités > seuil" },
      { source: "Transferts CADES + État", montantMdEur: 6 },
    ],
    perimetre: "1,3 million de bénéficiaires APA. 220 000 bénéficiaires PCH. ~600 000 places en EHPAD.",
    enjeux:
      "Vieillissement démographique majeur : 4 millions de personnes en perte d'autonomie d'ici 2050 (vs 2,5 M aujourd'hui). Nécessitera une montée en charge rapide. Sujet politique sensible (loi grand âge attendue depuis 2018).",
    source: "LFSS 2025, CNSA",
  },
  {
    id: "unedic",
    nom: "Chômage",
    abbr: "Unédic",
    emoji: "💼",
    recettesMdEur: 46.0,
    depensesMdEur: 44.5,
    couleur: "#0891b2",
    description:
      "Géré paritairement par les partenaires sociaux (syndicats + patronat), pas par l'État. Hors LFSS mais souvent inclus dans le périmètre Sécu au sens large. Verse les allocations chômage via France Travail (ex-Pôle emploi).",
    postesDepenses: [
      { poste: "ARE (allocation retour emploi)", montantMdEur: 32 },
      { poste: "Reversement à France Travail", montantMdEur: 8, description: "Frais de service public emploi" },
      { poste: "Aides reclassement, formation", montantMdEur: 3 },
      { poste: "Frais de gestion", montantMdEur: 1.5 },
    ],
    sourcesRecettes: [
      { source: "Cotisations chômage", montantMdEur: 38, description: "Patronales (4,05 %) + AGS" },
      { source: "Contribution État", montantMdEur: 7, description: "Modulation taux 2019-2024" },
      { source: "Autres (AGS, indemnités)", montantMdEur: 1 },
    ],
    perimetre: "2,8 millions d'allocataires en moyenne. Durée moyenne d'indemnisation : 14 mois.",
    enjeux:
      "Réformes successives (2019 : durcissement conditions, 2023 : modulation économique, 2024 : nouvelles conditions). Excédent permet de rembourser la dette accumulée pendant le Covid (~58 Md€ en pic).",
    source: "Unédic — rapport financier 2024",
  },
];

// Évolution historique du solde global Sécu (LFSS sens strict, hors Unédic)
// en Md€ courants. Source : Commission des comptes de la Sécurité sociale.
export interface SoldeAnnuel {
  annee: number;
  solde: number; // Md€ — négatif = déficit
  contexte?: string;
}

export const HISTORIQUE_SOLDE_SECU: SoldeAnnuel[] = [
  { annee: 2000, solde: 0.7 },
  { annee: 2001, solde: 1.1 },
  { annee: 2002, solde: -3.5, contexte: "Plan Mattei (médicaments, frais hospitaliers)" },
  { annee: 2003, solde: -10.2 },
  { annee: 2004, solde: -11.9 },
  { annee: 2005, solde: -11.6, contexte: "Création de la CADES" },
  { annee: 2006, solde: -8.7 },
  { annee: 2007, solde: -9.5 },
  { annee: 2008, solde: -10.2 },
  { annee: 2009, solde: -20.3, contexte: "Crise financière mondiale" },
  { annee: 2010, solde: -23.9, contexte: "Pic post-crise" },
  { annee: 2011, solde: -17.4 },
  { annee: 2012, solde: -13.3 },
  { annee: 2013, solde: -12.5 },
  { annee: 2014, solde: -9.7 },
  { annee: 2015, solde: -10.8 },
  { annee: 2016, solde: -7.0 },
  { annee: 2017, solde: -5.1 },
  { annee: 2018, solde: -1.4 },
  { annee: 2019, solde: 1.4, contexte: "Premier excédent depuis 2001" },
  { annee: 2020, solde: -39.7, contexte: "Choc Covid — déficit historique" },
  { annee: 2021, solde: -24.3, contexte: "Sortie progressive du Covid" },
  { annee: 2022, solde: -19.6 },
  { annee: 2023, solde: -10.8 },
  { annee: 2024, solde: -10.5, contexte: "Stabilisation à un niveau élevé" },
  { annee: 2025, solde: -16.0, contexte: "Projection LFSS 2025" },
];

// Totaux agrégés
export const TOTAL_SECU_RECETTES = BRANCHES_SECU.reduce(
  (acc, b) => acc + b.recettesMdEur,
  0,
);
export const TOTAL_SECU_DEPENSES = BRANCHES_SECU.reduce(
  (acc, b) => acc + b.depensesMdEur,
  0,
);
export const TOTAL_SECU_SOLDE = TOTAL_SECU_RECETTES - TOTAL_SECU_DEPENSES;
