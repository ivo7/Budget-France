// Types miroir du pipeline. À synchroniser avec pipeline/src/types.ts.

export type SourceStatus = "ok" | "fallback" | "error";

export interface SourceInfo {
  id: string;
  label: string;
  url: string;
  fetchedAt: string;
  status: SourceStatus;
  error?: string;
}

export interface Metric {
  value: number;
  unit: "EUR" | "PCT" | "EUR_PER_SEC" | "RATIO";
  source: SourceInfo;
  alternates: SourceInfo[];
  asOf: string;
}

export interface TimeseriesPoint {
  date: string;
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
  budgetPrevisionnel: Metric;
  recettesPrevisionnelles: Metric;
  budgetExecute: Metric;
  soldeBudgetaire: Metric;
  dettePublique: Metric;
  pib: Metric;
  ratioDettePib: Metric;
  tauxOat10ans: Metric;
  tauxDirecteurBce: Metric;
  vitesseEndettementEurParSec: Metric;
  vitesseDepensesEurParSec: Metric;
  series: {
    detteHistorique: Timeseries;
    soldeHistorique: Timeseries;
    tauxOatHistorique: Timeseries;
    detteLongue?: Timeseries;
    pibLongue?: Timeseries;
    depensesLongue?: Timeseries;
    recettesLongue?: Timeseries;
    oatLongue?: Timeseries;
  };
  executionCourante?: {
    annee: number;
    recettes: { mois: string; prevu: number; reel: number }[];
    depenses: { mois: string; prevu: number; reel: number }[];
  };
  repartition?: {
    annee: number;
    recettes: { categorie: string; valeur: number; description?: string }[];
    depenses: { categorie: string; valeur: number; description?: string }[];
    source: SourceInfo;
  };
  compositionHistorique?: {
    recettes: { id: string; label: string; color: string; points: TimeseriesPoint[] }[];
    depenses: { id: string; label: string; color: string; points: TimeseriesPoint[] }[];
  };
  fraudes?: {
    fiscale: TimeseriesPoint[];        // estimée — gap fiscal théorique
    sociale: TimeseriesPoint[];        // estimée
    fiscaleDetectee?: TimeseriesPoint[];   // détectée — DGFiP, droits + pénalités notifiés (depuis 2008)
    socialeDetectee?: TimeseriesPoint[];   // détectée — URSSAF/CNAF/CNAM
    source: SourceInfo;
    sourceDetectee?: SourceInfo;
  };
  comparaisonsEuropeennes?: {
    detteRatio: { pays: string; label: string; colorHex: string; points: TimeseriesPoint[] }[];
    solde: { pays: string; label: string; colorHex: string; points: TimeseriesPoint[] }[];
    source: SourceInfo;
  };
  spreadOatBund?: {
    oatFr: TimeseriesPoint[];
    bundDe: TimeseriesPoint[];
    spread: TimeseriesPoint[];
    source: SourceInfo;
  };
  spreadsMultiPays?: {
    btpItalie: TimeseriesPoint[];
    bonosEspagne: TimeseriesPoint[];
    spreadFrIt: TimeseriesPoint[];
    spreadFrEs: TimeseriesPoint[];
    source: SourceInfo;
  };
  events?: {
    items: {
      date: string;
      title: string;
      description: string;
      category: "politique" | "economique" | "monetaire" | "militaire" | "crise";
      impact?: "dette+" | "dette-" | "taux+" | "taux-" | "neutre";
    }[];
    source: SourceInfo;
  };
  historiqueDetaille?: {
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
  secuCollectivites?: {
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
  inflation?: {
    points: TimeseriesPoint[];
    source: SourceInfo;
  };
  detenteursDette?: {
    categories: {
      id: string;
      label: string;
      partPourcent: number;
      description: string;
      beneficesExemple?: string;
    }[];
    source: SourceInfo;
  };
  ratings?: {
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
  sources: SourceInfo[];
}
