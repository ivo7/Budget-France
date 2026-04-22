// ============================================================================
// Sécurité sociale + Collectivités territoriales — référentiel 2024-2026
// ============================================================================
//
// Distinction fondamentale avec le budget de l'État (580 Md€ affichés ailleurs
// sur le site) : les administrations publiques (APU) regroupent TROIS sphères
//
//   1. État central (et ODAC)       ~580 Md€/an    — déjà couvert
//   2. Sécurité sociale (ASSO)      ~620 Md€/an    ← couvert ici
//   3. Collectivités (APUL)         ~290 Md€/an    ← couvert ici
//
// Sources :
//   - Loi de financement de la Sécurité sociale (LFSS) et annexes PLFSS
//     https://www.securite-sociale.fr/la-secu-cest-quoi/financement
//   - Cour des comptes — rapports annuels Sécu
//     https://www.ccomptes.fr/fr/domaines-dintervention/securite-sociale
//   - INSEE — Comptes nationaux APUL (administrations publiques locales)
//     https://www.insee.fr/fr/statistiques/5421158
//   - DGCL — Direction générale des collectivités locales
//     https://www.collectivites-locales.gouv.fr/

import type { SourceInfo } from "./types.ts";

export interface Branche {
  id: string;
  label: string;
  depenses: number;           // Md€ courants
  description: string;
  beneficesExemple: string;   // ce que ça finance concrètement
}

export interface FinancementLigne {
  id: string;
  label: string;
  partPourcent: number;       // 0 → 100
  description: string;
}

// ----------------------------------------------------------------------------
// SÉCURITÉ SOCIALE — périmètre PLFSS + UNEDIC
// ----------------------------------------------------------------------------

export const secuBranches: Branche[] = [
  {
    id: "retraite",
    label: "Retraite",
    depenses: 370,
    description:
      "Pensions versées aux ~17 millions de retraités français (régime général, régimes spéciaux, ARRCO-AGIRC). Première branche de la Sécu en volume.",
    beneficesExemple: "Pension moyenne ~1 540 €/mois nets",
  },
  {
    id: "maladie",
    label: "Maladie-Maternité",
    depenses: 230,
    description:
      "Remboursements de soins (ville + hôpital + médicaments), indemnités journalières, maternité. Gère l'ONDAM (objectif national des dépenses d'assurance maladie).",
    beneficesExemple: "Consultations remboursées à 70 %, hospitalisations à 80-100 %",
  },
  {
    id: "famille",
    label: "Famille",
    depenses: 55,
    description:
      "Allocations familiales, PAJE (prestation d'accueil du jeune enfant), ASF, complément mode de garde. CAF.",
    beneficesExemple: "150 €/mois pour 2 enfants, 340 € pour 3, crèches subventionnées",
  },
  {
    id: "autonomie",
    label: "Autonomie (5ᵉ branche)",
    depenses: 40,
    description:
      "Créée en 2021. Finance l'APA (perte d'autonomie des personnes âgées) et la PCH (handicap). Gérée par la CNSA.",
    beneficesExemple: "Places en EHPAD, aides à domicile, AAH (allocation adulte handicapé)",
  },
  {
    id: "atmp",
    label: "Accidents du travail / Maladies professionnelles",
    depenses: 15,
    description:
      "Financée uniquement par les employeurs. Indemnise les accidents survenus au travail et les maladies reconnues comme professionnelles.",
    beneficesExemple: "Indemnités journalières, rentes invalidité, reconversion",
  },
  {
    id: "chomage",
    label: "Assurance chômage (UNEDIC)",
    depenses: 45,
    description:
      "Hors Sécu stricto sensu mais souvent rattaché. Gérée paritairement par partenaires sociaux, déléguée à France Travail (ex-Pôle emploi).",
    beneficesExemple: "ARE (allocation retour à l'emploi) versée à ~2,5 millions de chômeurs",
  },
];

export const secuFinancement: FinancementLigne[] = [
  {
    id: "cotisations",
    label: "Cotisations sociales (salariales + patronales)",
    partPourcent: 55,
    description: "Prélevées sur les salaires et collectées par l'URSSAF",
  },
  {
    id: "csg_crds",
    label: "CSG / CRDS",
    partPourcent: 20,
    description: "Prélèvements proportionnels sur tous les revenus (salaires, pensions, capital)",
  },
  {
    id: "tva_affectee",
    label: "Fraction de TVA affectée",
    partPourcent: 12,
    description: "Part de TVA transférée de l'État à la Sécu pour compenser les exonérations de cotisations",
  },
  {
    id: "transferts_etat",
    label: "Transferts et subventions de l'État",
    partPourcent: 8,
    description: "Dotations spécifiques pour équilibrer certaines branches",
  },
  {
    id: "autres",
    label: "Autres recettes (taxes tabac, alcool, assurances…)",
    partPourcent: 5,
    description: "Taxes comportementales et financières affectées",
  },
];

// ----------------------------------------------------------------------------
// COLLECTIVITÉS TERRITORIALES — communes + intercos + départements + régions
// ----------------------------------------------------------------------------

export const collectivitesNiveaux: Branche[] = [
  {
    id: "communes",
    label: "Communes (~35 000)",
    depenses: 115,
    description:
      "Niveau le plus proche du citoyen. Compétences : état civil, urbanisme, écoles primaires, voirie communale, police municipale, culture.",
    beneficesExemple: "École primaire, crèche, bibliothèque, piscine, état civil",
  },
  {
    id: "intercommunalites",
    label: "Intercommunalités (EPCI)",
    depenses: 50,
    description:
      "Regroupements de communes pour mutualiser (métropole, communauté d'agglo, de communes). Gèrent eau, déchets, transports, économie.",
    beneficesExemple: "Collecte des déchets, bus urbains, eau potable, aménagement",
  },
  {
    id: "departements",
    label: "Départements (101)",
    depenses: 80,
    description:
      "Compétences sociales : RSA, protection enfance, dépendance (APA), collèges, routes départementales, pompiers (SDIS).",
    beneficesExemple: "RSA, APA, collège, routes départementales, pompiers",
  },
  {
    id: "regions",
    label: "Régions (18)",
    depenses: 35,
    description:
      "Développement économique, formation professionnelle, lycées, transports TER, aménagement du territoire.",
    beneficesExemple: "Lycée, apprentissage, TER, aides aux entreprises, internet fibre",
  },
];

export const collectivitesFinancement: FinancementLigne[] = [
  {
    id: "imp_locaux",
    label: "Impôts locaux (taxe foncière, CFE, DMTO…)",
    partPourcent: 35,
    description: "Taxe foncière sur les ménages, CFE et CVAE sur les entreprises, droits de mutation",
  },
  {
    id: "tva_collec",
    label: "Fraction de TVA affectée",
    partPourcent: 20,
    description: "Depuis 2021 : remplace l'ex-taxe d'habitation supprimée",
  },
  {
    id: "dgf",
    label: "Dotation Globale de Fonctionnement (État)",
    partPourcent: 15,
    description: "DGF : ~27 Md€/an versés par l'État pour équilibrer les budgets locaux",
  },
  {
    id: "recettes_prop",
    label: "Recettes propres (services, tarifs, cessions)",
    partPourcent: 15,
    description: "Redevances (crèche, cantine, stationnement), cessions de patrimoine",
  },
  {
    id: "emprunt",
    label: "Emprunt",
    partPourcent: 15,
    description: "Essentiellement pour financer les investissements (écoles, voirie, équipements)",
  },
];

// ----------------------------------------------------------------------------
// Bénéfices concrets pour un citoyen sur une vie — exemples chiffrés
// ----------------------------------------------------------------------------

export interface BenefitCitoyen {
  icon: string;
  titre: string;
  description: string;
  valeurApprox: string;
  source: "secu" | "collectivites";
}

export const beneficesCitoyens: BenefitCitoyen[] = [
  { icon: "🏥", titre: "Hospitalisation sans se ruiner", description: "Une opération coûte 10 000 à 50 000 €. L'Assurance maladie rembourse 80-100 %, le reste (ticket modérateur) est souvent couvert par la mutuelle.", valeurApprox: "10 000 à 50 000 € couverts", source: "secu" },
  { icon: "👶", titre: "Crèche subventionnée", description: "Une place en crèche collective coûte ~18 000 €/an. Les parents paient ~3 600 €/an en moyenne, le reste est financé par la CAF et la commune.", valeurApprox: "~14 400 €/enfant/an", source: "secu" },
  { icon: "🎓", titre: "Scolarité gratuite", description: "Un élève coûte entre 5 500 € (primaire) et 11 500 €/an (lycée général). Totalement pris en charge de 6 à 16 ans par l'État + commune/département/région.", valeurApprox: "~100 000 €/élève sur un cursus complet", source: "collectivites" },
  { icon: "👴", titre: "Retraite à vie", description: "Une pension moyenne de 1 540 €/mois pendant 22 ans (espérance retraite) = ~400 000 € cumulés versés par la branche retraite.", valeurApprox: "~400 000 € sur la retraite", source: "secu" },
  { icon: "💊", titre: "Médicaments remboursés", description: "Sur une vie, un Français consomme pour ~50 000 € de médicaments remboursables. 65 % en moyenne est couvert par la Sécu.", valeurApprox: "~32 000 € sur une vie", source: "secu" },
  { icon: "🚍", titre: "Transports publics subventionnés", description: "Le prix réel d'un trajet de bus est ~4 €. L'usager paie ~1,80 €. Le reste (2,20 €) est financé par le Versement Mobilité + la commune.", valeurApprox: "55 % du coût réel pris en charge", source: "collectivites" },
  { icon: "📚", titre: "Médiathèque & équipements sportifs", description: "Accès gratuit ou très subventionné : médiathèque, piscine municipale, court de tennis, stade. Financés par le budget communal.", valeurApprox: "Accès ~500 €/an d'équivalent", source: "collectivites" },
  { icon: "🚒", titre: "Pompiers gratuits", description: "Un intervention SDIS coûte 500 à 2 000 €. Financée par les départements : aucun impact pour l'usager (sauf exceptions).", valeurApprox: "Interventions gratuites pour l'usager", source: "collectivites" },
];

// ----------------------------------------------------------------------------
// Cotisations type sur un salaire (ordres de grandeur 2024-2025)
// Pour un salarié non-cadre du secteur privé, régime général.
// Source : URSSAF barèmes 2024 (https://www.urssaf.fr/).
// ----------------------------------------------------------------------------

export interface CotisationLigne {
  id: string;
  label: string;
  partSalariale: number;      // % du brut
  partPatronale: number;      // % du brut
  destination: string;        // où va l'argent
}

export const cotisationsTypes: CotisationLigne[] = [
  { id: "maladie",   label: "Maladie-Maternité + Autonomie", partSalariale: 0,    partPatronale: 7.00, destination: "Branche maladie + autonomie" },
  { id: "retraite_base", label: "Retraite de base (vieillesse)", partSalariale: 6.90, partPatronale: 8.55, destination: "CNAV (régime général)" },
  { id: "retraite_compl", label: "Retraite complémentaire (ARRCO)", partSalariale: 4.01, partPatronale: 6.01, destination: "ARRCO-AGIRC (partenaires sociaux)" },
  { id: "chomage",   label: "Assurance chômage", partSalariale: 0,    partPatronale: 4.05, destination: "UNEDIC / France Travail" },
  { id: "famille",   label: "Allocations familiales", partSalariale: 0,    partPatronale: 3.45, destination: "Branche famille (CNAF)" },
  { id: "atmp",      label: "Accidents du travail", partSalariale: 0,    partPatronale: 1.00, destination: "Branche AT/MP" },
  { id: "csg_crds",  label: "CSG + CRDS", partSalariale: 9.70, partPatronale: 0,    destination: "Sécu (toutes branches)" },
  { id: "formation", label: "Formation professionnelle + apprentissage", partSalariale: 0,    partPatronale: 1.68, destination: "Organismes paritaires / France Compétences" },
];

export const secuCollecSource: SourceInfo = {
  id: "secu-collec.seed",
  label: "LFSS + URSSAF + DGCL + Cour des comptes (Sécu) + INSEE (APUL)",
  url: "https://www.securite-sociale.fr/la-secu-cest-quoi/financement",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};
