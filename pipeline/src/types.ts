// Types centraux du pipeline.
// Ces types sont partagés (par copie) avec le frontend via frontend/src/types.ts.

export type SourceStatus = "ok" | "fallback" | "error";

export interface SourceInfo {
  /** Identifiant technique, ex: "insee.dette" */
  id: string;
  /** Libellé lisible, ex: "INSEE — Dette publique Maastricht" */
  label: string;
  /** URL canonique de la donnée */
  url: string;
  /** Horodatage ISO de la dernière récupération */
  fetchedAt: string;
  /** Statut de la récupération */
  status: SourceStatus;
  /** Message d'erreur éventuel */
  error?: string;
}

export interface Metric {
  /** Valeur numérique (en unité de base : € ou %) */
  value: number;
  /** Unité : "EUR", "PCT", "EUR_PER_SEC" */
  unit: "EUR" | "PCT" | "EUR_PER_SEC" | "RATIO";
  /** Source retenue */
  source: SourceInfo;
  /** Sources alternatives testées */
  alternates: SourceInfo[];
  /** Date de référence de la donnée (pas de la récupération) */
  asOf: string;
}

export interface TimeseriesPoint {
  date: string;   // ISO 8601 (YYYY-MM-DD)
  value: number;
}

export interface Timeseries {
  id: string;
  label: string;
  unit: "EUR" | "PCT" | "RATIO";
  points: TimeseriesPoint[];
  source: SourceInfo;
}

export interface BudgetSnapshot {
  generatedAt: string;
  annee: number;

  // KPIs macro
  budgetPrevisionnel: Metric;  // LFI — total dépenses
  recettesPrevisionnelles: Metric;
  budgetExecute: Metric;       // exécution en cours
  soldeBudgetaire: Metric;     // déficit/excédent
  dettePublique: Metric;       // stock de dette (Maastricht)
  pib: Metric;
  ratioDettePib: Metric;
  tauxOat10ans: Metric;
  tauxDirecteurBce: Metric;

  // Dérivée pour le compteur live
  vitesseEndettementEurParSec: Metric;
  // Dérivée pour le compteur "dépenses de l'État" (budget annuel / nb secondes/an)
  vitesseDepensesEurParSec: Metric;

  // Séries temporelles pour les graphiques
  series: {
    detteHistorique: Timeseries;        // haute fréquence Eurostat (trimestriel depuis 2000)
    soldeHistorique: Timeseries;
    tauxOatHistorique: Timeseries;      // mensuel BCE
    // Séries longues depuis 1945 (annuelles) — pour la vue historique
    detteLongue: Timeseries;
    pibLongue: Timeseries;
    depensesLongue: Timeseries;
    recettesLongue: Timeseries;
    oatLongue: Timeseries;
  };

  // Exécution mensuelle 2026 (recettes / dépenses : prévu vs réel estimé)
  executionCourante: {
    annee: number;
    recettes: { mois: string; prevu: number; reel: number }[];
    depenses: { mois: string; prevu: number; reel: number }[];
  };

  // Répartition LFI pour l'année courante (grandes masses)
  repartition: {
    annee: number;
    recettes: { categorie: string; valeur: number; description?: string }[];
    depenses: { categorie: string; valeur: number; description?: string }[];
    source: SourceInfo;
  };

  // Composition historique 1945+ : une série par catégorie de recette/dépense.
  // Permet de visualiser l'évolution relative de chaque composante (ex. part
  // de la TVA dans les recettes au cours du temps).
  compositionHistorique: {
    recettes: { id: string; label: string; color: string; points: TimeseriesPoint[] }[];
    depenses: { id: string; label: string; color: string; points: TimeseriesPoint[] }[];
  };

  // Fraude fiscale et sociale — 2 mesures différentes :
  //   - estimée : fraude totale calculée par les économistes (Cour des comptes,
  //     CPO, OFCE, Solidaires Finances publiques). Inclut le manque à gagner
  //     que personne ne détecte. Chiffres en dizaines de Md€ (~80-100 fiscale).
  //   - détectée : montants effectivement notifiés par DGFiP / URSSAF / Pôle
  //     emploi / CNAF / CNAM (droits + pénalités). Chiffres en milliards
  //     (~17 Md€ fiscale en 2024). Source ministère de l'Économie.
  // Les deux sont complémentaires : la détectée mesure l'efficacité du
  // contrôle, l'estimée mesure le « gap fiscal » réel.
  fraudes: {
    fiscale: TimeseriesPoint[];
    sociale: TimeseriesPoint[];
    fiscaleDetectee?: TimeseriesPoint[];
    socialeDetectee?: TimeseriesPoint[];
    source: SourceInfo;
    sourceDetectee?: SourceInfo;
  };

  // Comparaisons européennes — dette / PIB et solde / PIB, annuel, par pays.
  comparaisonsEuropeennes: {
    detteRatio: { pays: string; label: string; colorHex: string; points: TimeseriesPoint[] }[];
    solde: { pays: string; label: string; colorHex: string; points: TimeseriesPoint[] }[];
    source: SourceInfo;
  };

  // Spread OAT-Bund — indicateur de prime de risque souveraine.
  spreadOatBund: {
    oatFr: TimeseriesPoint[];       // %
    bundDe: TimeseriesPoint[];      // %
    spread: TimeseriesPoint[];      // points de base
    source: SourceInfo;
  };

  // Spreads souverains multi-pays — France vs Italie, Espagne (en plus du Bund DE).
  spreadsMultiPays: {
    btpItalie: TimeseriesPoint[];      // %
    bonosEspagne: TimeseriesPoint[];   // %
    spreadFrIt: TimeseriesPoint[];     // pb
    spreadFrEs: TimeseriesPoint[];     // pb
    source: SourceInfo;
  };

  // Événements historiques marquants — annotés sur les graphiques longue période.
  events: {
    items: {
      date: string;
      title: string;
      description: string;
      category: "politique" | "economique" | "monetaire" | "militaire" | "crise";
      impact?: "dette+" | "dette-" | "taux+" | "taux-" | "neutre";
    }[];
    source: SourceInfo;
  };

  // Historique des dépenses Sécu + Collectivités + chaque mission de l'État
  // sur 80 ans (1945-2025). Permet de tracer des courbes d'évolution longue.
  historiqueDetaille: {
    secuDepenses: TimeseriesPoint[];
    secuRecettes: TimeseriesPoint[];
    collecDepenses: TimeseriesPoint[];
    collecRecettes: TimeseriesPoint[];
    secuCollecSource: SourceInfo;
    missions: {
      id: string;
      label: string;
      colorHex: string;
      description: string;
      points: TimeseriesPoint[];
    }[];
    missionsSource: SourceInfo;
  };

  // Sécurité sociale + Collectivités territoriales — les deux autres sphères
  // des administrations publiques (APU) en plus de l'État central.
  secuCollectivites: {
    secu: {
      branches: { id: string; label: string; depenses: number; description: string; beneficesExemple: string }[];
      financement: { id: string; label: string; partPourcent: number; description: string }[];
      totalDepenses: number;
    };
    collectivites: {
      niveaux: { id: string; label: string; depenses: number; description: string; beneficesExemple: string }[];
      financement: { id: string; label: string; partPourcent: number; description: string }[];
      totalDepenses: number;
    };
    cotisationsTypes: {
      id: string;
      label: string;
      partSalariale: number;
      partPatronale: number;
      destination: string;
    }[];
    beneficesCitoyens: {
      icon: string;
      titre: string;
      description: string;
      valeurApprox: string;
      source: "secu" | "collectivites";
    }[];
    source: SourceInfo;
  };

  // Inflation France 1945-2025 — pour calculer le taux d'intérêt réel
  inflation: {
    points: TimeseriesPoint[];
    source: SourceInfo;
  };

  // Budgets des grandes villes françaises (Phase 1 : Top 15-20 plus grandes
  // villes par population, données estimées 2020-2024 basées sur DGFiP/INSEE).
  // Phase 2 prévue : connecteur automatisé vers data.gouv.fr pour 100+ villes.
  villes?: {
    items: {
      codeInsee: string;            // ex: "75056" pour Paris
      nom: string;                  // ex: "Paris"
      departement: string;          // ex: "Paris" ou "Bouches-du-Rhône"
      population: number;           // habitants (INSEE millésime récent)
      // Évolution 2014-2024 (11 ans)
      annees: {
        annee: number;
        budgetTotalEur: number;          // recettes ou dépenses, valeur la plus représentative
        recettesTotalesEur: number;
        depensesTotalesEur: number;
        soldeBudgetaireEur: number;      // = recettes - dépenses
        detteEncoursEur: number;
        capaciteAutofinancementEur: number;
        chargeDetteEur: number;          // intérêts versés
        depensesInvestissementEur: number;
        depensesPersonnelEur: number;
      }[];
      // Composition de la dernière année (ratios en pourcentage du total)
      compositionRecettes: {
        impotsLocauxPct: number;
        dotationsEtatPct: number;
        subventionsPct: number;
        recettesServicesPct: number;
        autresPct: number;
      };
      compositionDepenses: {
        personnelPct: number;
        chargesGeneralesPct: number;
        subventionsVerseesPct: number;
        chargesFinancieresPct: number;
        investissementPct: number;
      };
    }[];
    source: SourceInfo;
  };

  // Détenteurs de la dette publique française (à qui doit-on l'argent ?)
  detenteursDette: {
    categories: {
      id: string;
      label: string;
      partPourcent: number;
      description: string;
      beneficesExemple?: string;
    }[];
    source: SourceInfo;
  };

  // Notations souveraines S&P / Moody's / Fitch — historique France.
  ratings: {
    agencies: {
      id: "sp" | "moodys" | "fitch";
      label: string;
      url: string;
      events: {
        date: string;
        rating: string;
        numeric: number;
        outlook?: "stable" | "positive" | "negative";
        note?: string;
      }[];
    }[];
    source: SourceInfo;
  };

  // Traçabilité
  sources: SourceInfo[];
}
