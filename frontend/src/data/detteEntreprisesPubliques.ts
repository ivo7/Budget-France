// ============================================================================
// detteEntreprisesPubliques.ts — la dette « cachée » des entreprises de l'État
// ============================================================================
//
// Cette dette N'EST PAS comptée dans la dette publique au sens Maastricht
// (~3 400 Md€). Mais elle peut être reprise par l'État en cas de difficulté
// — comme cela est arrivé avec SNCF Réseau (35 Md€ repris en 2018-2020) et
// le Crédit Lyonnais en 1993-1999 (~30 Md€).
//
// Sources :
//   - Rapports annuels des entreprises (EDF, SNCF, RATP…)
//   - Cour des comptes — rapport sur l'État actionnaire (2024)
//   - APE (Agence des Participations de l'État) — rapport annuel
//   - DGCL / DGFiP pour les EPIC locaux
//
// Convention : dette nette (dettes - trésorerie & équivalents) en Md€,
// exercice 2023 ou 2024 selon disponibilité.

export type SecteurEntreprisePublique =
  | "energie"
  | "transport"
  | "finance-publique"
  | "defense"
  | "medias"
  | "industrie";

export interface EntreprisePublique {
  id: string;
  nom: string;
  abbr?: string;
  emoji: string;
  secteur: SecteurEntreprisePublique;
  /** Dette nette en Md€ (exercice 2023 ou 2024) */
  detteNetteMdEur: number;
  /** Participation État en %, 0-100 */
  participationEtatPct: number;
  /** Statut juridique : EPIC, SA, etc. */
  statut: string;
  /** Effectifs */
  effectif: string;
  /** Risque de reprise par l'État (faible, modéré, élevé) */
  risqueReprise: "faible" | "modere" | "eleve";
  /** Description / contexte */
  description: string;
  /** Source officielle */
  source: string;
}

export const ENTREPRISES_PUBLIQUES: EntreprisePublique[] = [
  {
    id: "edf",
    nom: "EDF",
    emoji: "⚡",
    secteur: "energie",
    detteNetteMdEur: 64.5,
    participationEtatPct: 100,
    statut: "SA — renationalisée juillet 2023",
    effectif: "~165 000 (groupe monde, ~98 000 France)",
    risqueReprise: "eleve",
    description:
      "Re-renationalisée à 100 % en juillet 2023 (OPRA à 12 €/action, coût ~9,7 Md€). Dette nette gonflée par : programme EPR (Hinkley Point UK +20 Md€, Flamanville, futurs EPR2), tarif réglementé bouclier énergétique 2022-2023 (~8 Md€ de manque à gagner), maintenance parc nucléaire. Hors comptes Maastricht mais l'État est seul actionnaire — la dette est de facto publique.",
    source: "Rapport annuel EDF 2024",
  },
  {
    id: "sncf-reseau",
    nom: "SNCF Réseau",
    emoji: "🚆",
    secteur: "transport",
    detteNetteMdEur: 38.0,
    participationEtatPct: 100,
    statut: "SA filiale du groupe SNCF (depuis 2020)",
    effectif: "~55 000",
    risqueReprise: "eleve",
    description:
      "Gestionnaire du réseau ferré national (32 000 km de voies). Dette accumulée pour financer la modernisation et le développement (LGV Sud-Europe-Atlantique, Bretagne-Pays de la Loire). État a déjà repris 35 Md€ en 2018-2020 (loi Pacte ferroviaire). Reprise additionnelle de 10 Md€ prévue d'ici 2026 selon loi 2018.",
    source: "Rapport annuel SNCF Groupe 2024",
  },
  {
    id: "grand-paris-express",
    nom: "Société du Grand Paris Express",
    abbr: "SGP",
    emoji: "🚇",
    secteur: "transport",
    detteNetteMdEur: 35.0,
    participationEtatPct: 100,
    statut: "EPIC",
    effectif: "~1 000",
    risqueReprise: "eleve",
    description:
      "Établissement public chargé de construire et financer le métro Grand Paris Express (200 km de nouvelles lignes, 68 gares). Endettement massif pour financer un investissement de ~36 Md€ étalé sur 15 ans. Remboursé par taxes spécifiques (TSE, TSB) jusqu'en 2070. Cour des comptes : « bombe à retardement » potentielle si recettes fiscales sous-performent.",
    source: "Cour des comptes 2023, rapport annuel SGP",
  },
  {
    id: "afd",
    nom: "Agence Française de Développement",
    abbr: "AFD",
    emoji: "🌍",
    secteur: "finance-publique",
    detteNetteMdEur: 75.0,
    participationEtatPct: 100,
    statut: "EPIC à statut spécifique",
    effectif: "~3 000",
    risqueReprise: "modere",
    description:
      "Banque publique de développement. Distribue ~12 Md€/an d'engagements financiers (prêts, garanties, dons) aux pays en développement. Encours total ~75 Md€. En face de cette dette, l'AFD a une dette équivalente des bénéficiaires — donc risque crédit plus que risque souverain. Mais en cas de défaut massif, l'État garantit indirectement.",
    source: "Rapport annuel AFD 2024",
  },
  {
    id: "cades",
    nom: "Caisse d'amortissement de la dette sociale",
    abbr: "CADES",
    emoji: "💊",
    secteur: "finance-publique",
    detteNetteMdEur: 121.0,
    participationEtatPct: 100,
    statut: "Établissement public administratif",
    effectif: "~30",
    risqueReprise: "faible",
    description:
      "Reprend depuis 1996 la dette accumulée par la Sécurité sociale. Remboursée par la CRDS (0,5 % sur tous les revenus). Extinction prévue 2033 — date plusieurs fois reportée (initialement 2009). 121 Md€ restant à rembourser fin 2024. Pas vraiment de risque de reprise puisque c'est déjà une structure publique de défaisance.",
    source: "Rapport annuel CADES",
  },
  {
    id: "ratp",
    nom: "RATP",
    emoji: "🚇",
    secteur: "transport",
    detteNetteMdEur: 6.8,
    participationEtatPct: 100,
    statut: "EPIC",
    effectif: "~70 000",
    risqueReprise: "modere",
    description:
      "Régie Autonome des Transports Parisiens. Exploite métro, RER, bus, tramway IDF. Dette stable mais croissante avec ouverture concurrence (RER A/B 2025, métro 2039). Investissements lourds pour adaptation matériel roulant. Concurrence Île-de-France Mobilités va éroder ses recettes captives.",
    source: "Rapport annuel RATP 2024",
  },
  {
    id: "sncf-mobilites",
    nom: "SNCF Voyageurs + Fret",
    emoji: "🚄",
    secteur: "transport",
    detteNetteMdEur: 6.5,
    participationEtatPct: 100,
    statut: "SA (Voyageurs) + SAS (Fret), groupe SNCF",
    effectif: "~150 000",
    risqueReprise: "modere",
    description:
      "Opérateurs de transport voyageurs (TGV, Intercités, TER) et Fret. Dette beaucoup moins lourde que SNCF Réseau (gestionnaire d'infra). Ouverture à la concurrence (TER, TGV) modifie modèle économique.",
    source: "Rapport annuel SNCF Groupe 2024",
  },
  {
    id: "afitf",
    nom: "Agence française des infrastructures de transport",
    abbr: "AFITF",
    emoji: "🛣️",
    secteur: "transport",
    detteNetteMdEur: 7.5,
    participationEtatPct: 100,
    statut: "EPIC",
    effectif: "~10 (très peu, agence financière)",
    risqueReprise: "modere",
    description:
      "Finance les grands projets d'infrastructures de transport (route, rail, voies navigables, ports). ~3 Md€/an de subventions. Financée par taxes (TICPE, redevance autoroutière, taxe poids lourds…). Dette progresse car investissements > recettes affectées.",
    source: "Rapport AFITF",
  },
  {
    id: "orano",
    nom: "Orano (ex-Areva)",
    emoji: "☢️",
    secteur: "industrie",
    detteNetteMdEur: 3.5,
    participationEtatPct: 90,
    statut: "SA (90 % État, 10 % Japon)",
    effectif: "~17 000",
    risqueReprise: "eleve",
    description:
      "Cycle du combustible nucléaire (extraction uranium, enrichissement, retraitement). Réorganisé en 2017 après crise Areva (5 Md€ recapitalisation État). Dette stabilisée mais expositions financières dépendant du marché uranium et tensions géopolitiques.",
    source: "Rapport annuel Orano 2024",
  },
  {
    id: "framatome",
    nom: "Framatome",
    emoji: "⚛️",
    secteur: "industrie",
    detteNetteMdEur: 2.0,
    participationEtatPct: 76,
    statut: "SA (75,5 % EDF, ~19 % Mitsubishi)",
    effectif: "~18 000",
    risqueReprise: "modere",
    description:
      "Constructeur de réacteurs nucléaires (EPR Flamanville, EPR2, exports). Filiale d'EDF donc indirectement État. Bénéficie du plan EPR2 (~6 réacteurs prévus). Dette modérée.",
    source: "Rapport Framatome 2024",
  },
  {
    id: "aeroports-paris",
    nom: "Aéroports de Paris",
    abbr: "ADP",
    emoji: "✈️",
    secteur: "transport",
    detteNetteMdEur: 6.2,
    participationEtatPct: 50.6,
    statut: "SA cotée (Etat 50,6 %)",
    effectif: "~6 500",
    risqueReprise: "faible",
    description:
      "Exploitant Charles-de-Gaulle, Orly, Le Bourget + filiales internationales. Investissements lourds (CDG terminal 4, métro CDG Express). Cotée en bourse, partiellement publique. Risque reprise faible car structure financière saine.",
    source: "Rapport annuel ADP 2024",
  },
  {
    id: "naval-group",
    nom: "Naval Group (ex-DCNS)",
    emoji: "🚢",
    secteur: "defense",
    detteNetteMdEur: 1.5,
    participationEtatPct: 62.5,
    statut: "SA (62,5 % État, 35 % Thales)",
    effectif: "~16 000",
    risqueReprise: "faible",
    description:
      "Construction navale militaire (sous-marins nucléaires, frégates, porte-avions). Carnet de commandes plein, dette maîtrisée. Stratégique pour la souveraineté défense.",
    source: "Rapport annuel Naval Group 2024",
  },
  {
    id: "france-tv",
    nom: "France Télévisions + Radio France",
    emoji: "📺",
    secteur: "medias",
    detteNetteMdEur: 0.3,
    participationEtatPct: 100,
    statut: "SA (audiovisuel public)",
    effectif: "~9 500 (FTV) + 4 600 (Radio France)",
    risqueReprise: "faible",
    description:
      "Audiovisuel public. Dette modeste, mais subvention de fonctionnement annuelle (~2,5 Md€ TVA affectée depuis suppression CAP en 2022). Pas un risque pour la dette publique, plus une dépendance budgétaire structurelle.",
    source: "Rapport annuel FTV 2024",
  },
  {
    id: "banque-postale",
    nom: "La Banque Postale",
    emoji: "🏤",
    secteur: "finance-publique",
    detteNetteMdEur: 0, // pas pertinent pour une banque
    participationEtatPct: 100,
    statut: "SA filiale La Poste",
    effectif: "~30 000",
    risqueReprise: "faible",
    description:
      "Banque universelle, filiale 100 % La Poste (elle-même 100 % État + CDC). Bilan ~270 Md€ (dépôts clients). Pas vraiment de « dette nette » au sens classique. Implication État via supervision ACPR et soutien implicite en cas de stress.",
    source: "Rapport annuel La Poste 2024",
  },
];

// ============================================================================
// Cas historiques de reprise de dette d'entreprises publiques par l'État
// ============================================================================

export interface RepriseDette {
  annee: string;
  entreprise: string;
  montantMdEur: number;
  pibPct: number;
  contexte: string;
}

export const REPRISES_HISTORIQUES: RepriseDette[] = [
  {
    annee: "2018-2020",
    entreprise: "SNCF Réseau",
    montantMdEur: 35.0,
    pibPct: 1.5,
    contexte:
      "Loi Pacte ferroviaire 2018 : l'État reprend 35 Md€ de dette SNCF Réseau pour préparer l'ouverture à la concurrence. Étalé 2020-2022 (25 Md€) + 10 Md€ prévus d'ici 2026. Augmente directement la dette Maastricht.",
  },
  {
    annee: "1993-1999",
    entreprise: "Crédit Lyonnais",
    montantMdEur: 28.0, // équivalent 2024
    pibPct: 4.5,
    contexte:
      "Plus grande défaisance bancaire de l'histoire française. Le Crédit Lyonnais s'effondre fin 1993 (pertes immobilier, mauvais prêts). Création du CDR (Consortium de Réalisation) pour gérer les actifs douteux. Coût final : ~25 Md€ pour l'État.",
  },
  {
    annee: "2020-2021",
    entreprise: "Air France-KLM",
    montantMdEur: 7.0,
    pibPct: 0.3,
    contexte:
      "Recapitalisation pendant le Covid : 7 Md€ de prêts garantis + transformation en quasi-fonds propres. Plus une aide d'État qu'une reprise de dette, mais même mécanisme : l'État absorbe le risque.",
  },
  {
    annee: "2017",
    entreprise: "Areva (Orano + EDF)",
    montantMdEur: 4.5,
    pibPct: 0.2,
    contexte:
      "Démantèlement d'Areva après le naufrage EPR Olkiluoto (Finlande). État recapitalise 4,5 Md€. Création d'Orano (cycle combustible) et passage de Framatome à EDF.",
  },
  {
    annee: "2007-2014",
    entreprise: "Charbonnages de France",
    montantMdEur: 4.0,
    pibPct: 0.2,
    contexte:
      "Fermeture progressive des dernières mines françaises (Lorraine). Dette transférée à l'État au fur et à mesure. Inclut les retraites des mineurs et la dépollution des sites.",
  },
];

// ============================================================================
// Totaux et chiffres clés
// ============================================================================

export const TOTAL_DETTE_MD_EUR = ENTREPRISES_PUBLIQUES.reduce(
  (acc, e) => acc + e.detteNetteMdEur,
  0,
);

export const TOTAL_REPRISES_HISTORIQUES_MD_EUR = REPRISES_HISTORIQUES.reduce(
  (acc, r) => acc + r.montantMdEur,
  0,
);

// Dette Maastricht France 2024 (référence pour comparaisons)
export const DETTE_MAASTRICHT_2024_MD_EUR = 3400;
