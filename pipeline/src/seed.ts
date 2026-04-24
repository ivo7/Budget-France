// Données de secours (seed) — valeurs publiques connues approximatives à avril 2026.
// Utilisées en dernier recours si toutes les sources distantes sont inaccessibles.
// Les montants sont en euros (pas en milliards) sauf mention contraire.

import type { BudgetSnapshot, SourceInfo, Timeseries } from "./types.ts";
import {
  dettePoints,
  pibPoints,
  depensesPoints,
  recettesPoints,
  oatLongPoints,
} from "./historicalSeed.ts";
import {
  repartitionSource,
  recettesLfi2026,
  depensesLfi2026,
} from "./repartitionSeed.ts";
import { recettesComposition, depensesComposition } from "./compositionSeed.ts";
import { fraudeFiscalePoints, fraudeSocialePoints, fraudeSourceLabel, fraudeSourceUrl } from "./fraudeSeed.ts";
import { detteRatioPaysEurope, soldePaysEurope, europeSourceLabel, europeSourceUrl } from "./europeSeed.ts";
import { oatFrancePoints, bundAllemagnePoints, spreadOatBundPoints, spreadSourceLabel, spreadSourceUrl } from "./spreadSeed.ts";
import { agencies as ratingsAgencies, ratingsSource } from "./ratingsSeed.ts";
import { historicalEvents, eventsSource } from "./eventsSeed.ts";
import {
  secuBranches,
  secuFinancement,
  collectivitesNiveaux,
  collectivitesFinancement,
  cotisationsTypes,
  beneficesCitoyens,
  secuCollecSource,
} from "./secuCollectivitesSeed.ts";
import {
  secuDepensesHistoriquePoints,
  secuRecettesHistoriquePoints,
  collecDepensesHistoriquePoints,
  collecRecettesHistoriquePoints,
  secuCollecHistSource,
  missionsHistoriques,
  missionsSource,
} from "./secuCollecHistoriqueSeed.ts";
import {
  btpItaliePoints,
  bonosEspagnePoints,
  computeSpread,
  spreadMultiPaysSourceLabel,
  spreadMultiPaysSourceUrl,
} from "./spreadMultiPaysSeed.ts";
import { detenteursDetteFrance, detenteursSourceInfo } from "./detenteursDetteSeed.ts";
import { inflationPoints, inflationSourceLabel, inflationSourceUrl } from "./inflationSeed.ts";
import { oatFrancePoints as oatFrenchMonthlySeed } from "./spreadSeed.ts";

const now = new Date().toISOString();

const seedSource = (id: string, label: string, url: string): SourceInfo => ({
  id,
  label,
  url,
  fetchedAt: now,
  status: "fallback",
});

// Historique dette publique (Md€) — source INSEE/Eurostat, valeurs fin d'année
const detteHistoriqueRaw: [string, number][] = [
  ["2005-12-31", 1152],
  ["2006-12-31", 1152],
  ["2007-12-31", 1212],
  ["2008-12-31", 1318],
  ["2009-12-31", 1493],
  ["2010-12-31", 1631],
  ["2011-12-31", 1754],
  ["2012-12-31", 1869],
  ["2013-12-31", 1953],
  ["2014-12-31", 2039],
  ["2015-12-31", 2101],
  ["2016-12-31", 2152],
  ["2017-12-31", 2218],
  ["2018-12-31", 2315],
  ["2019-12-31", 2375],
  ["2020-12-31", 2648],
  ["2021-12-31", 2813],
  ["2022-12-31", 2950],
  ["2023-12-31", 3100],
  ["2024-12-31", 3230],
  ["2025-12-31", 3350],
];

// Historique solde budgétaire État (Md€, négatif = déficit)
const soldeHistoriqueRaw: [string, number][] = [
  ["2015-12-31", -70],
  ["2016-12-31", -69],
  ["2017-12-31", -68],
  ["2018-12-31", -76],
  ["2019-12-31", -93],
  ["2020-12-31", -178],
  ["2021-12-31", -171],
  ["2022-12-31", -151],
  ["2023-12-31", -173],
  ["2024-12-31", -169],
  ["2025-12-31", -175],
];

// Historique taux OAT 10 ans (%)
const tauxOatHistoriqueRaw: [string, number][] = [
  ["2015-12-31", 0.99],
  ["2016-12-31", 0.68],
  ["2017-12-31", 0.78],
  ["2018-12-31", 0.71],
  ["2019-12-31", 0.12],
  ["2020-12-31", -0.34],
  ["2021-12-31", 0.2],
  ["2022-12-31", 3.12],
  ["2023-12-31", 2.56],
  ["2024-12-31", 3.2],
  ["2025-12-31", 3.15],
  ["2026-04-01", 3.1],
];

const sourceInsee = seedSource(
  "insee.seed",
  "INSEE — valeurs connues (fallback)",
  "https://www.insee.fr/fr/statistiques/2830192",
);
const sourceBdf = seedSource(
  "bdf.seed",
  "Banque de France — valeurs connues (fallback)",
  "https://www.banque-france.fr/",
);
const sourceDataGouv = seedSource(
  "datagouv.seed",
  "data.gouv.fr — LFI 2026 (fallback)",
  "https://www.data.gouv.fr/fr/datasets/budget-de-letat/",
);

const detteFin2025 = 3_350_000_000_000; // 3 350 Md€
const pib2025 = 2_900_000_000_000;
const deficit2026Prev = 175_000_000_000; // ~5% PIB
const vitesseEurParSec = deficit2026Prev / (365 * 24 * 3600); // ~5 550 €/s

export function seedSnapshot(annee: number): BudgetSnapshot {
  const toTs = (id: string, label: string, unit: Timeseries["unit"], raw: [string, number][], src: SourceInfo, scale = 1): Timeseries => ({
    id,
    label,
    unit,
    points: raw.map(([date, v]) => ({ date, value: v * scale })),
    source: src,
  });

  return {
    generatedAt: now,
    annee,
    budgetPrevisionnel: {
      value: 580_000_000_000, // LFI 2026 dépenses totales (ordre de grandeur)
      unit: "EUR",
      source: sourceDataGouv,
      alternates: [],
      asOf: `${annee}-01-01`,
    },
    recettesPrevisionnelles: {
      value: 405_000_000_000,
      unit: "EUR",
      source: sourceDataGouv,
      alternates: [],
      asOf: `${annee}-01-01`,
    },
    budgetExecute: {
      // Exécution cumulée au jour J — proportion de l'année écoulée × dépenses annuelles (approx)
      value: 580_000_000_000 * ratioAnneeEcoulee(annee),
      unit: "EUR",
      source: sourceDataGouv,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    soldeBudgetaire: {
      value: -deficit2026Prev,
      unit: "EUR",
      source: sourceDataGouv,
      alternates: [],
      asOf: `${annee}-01-01`,
    },
    dettePublique: {
      value: detteFin2025 + deficit2026Prev * ratioAnneeEcoulee(annee),
      unit: "EUR",
      source: sourceInsee,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    pib: {
      value: pib2025 * 1.02,
      unit: "EUR",
      source: sourceInsee,
      alternates: [],
      asOf: `${annee}-01-01`,
    },
    ratioDettePib: {
      value: (detteFin2025 + deficit2026Prev * ratioAnneeEcoulee(annee)) / (pib2025 * 1.02),
      unit: "RATIO",
      source: sourceInsee,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    tauxOat10ans: {
      value: 3.1,
      unit: "PCT",
      source: sourceBdf,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    tauxDirecteurBce: {
      value: 2.5,
      unit: "PCT",
      source: sourceBdf,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    vitesseEndettementEurParSec: {
      value: vitesseEurParSec,
      unit: "EUR_PER_SEC",
      source: sourceInsee,
      alternates: [],
      asOf: now.slice(0, 10),
    },
    vitesseDepensesEurParSec: {
      value: 580_000_000_000 / (365 * 86_400), // ~18 392 €/s
      unit: "EUR_PER_SEC",
      source: {
        id: "calc.vitesse_depenses",
        label: "Calcul — Vitesse des dépenses (LFI / année)",
        url: "",
        fetchedAt: now,
        status: "ok",
      },
      alternates: [],
      asOf: now.slice(0, 10),
    },
    series: {
      detteHistorique: toTs(
        "dette.historique",
        "Dette publique (Maastricht)",
        "EUR",
        detteHistoriqueRaw,
        sourceInsee,
        1_000_000_000,
      ),
      soldeHistorique: toTs(
        "solde.historique",
        "Solde budgétaire de l'État",
        "EUR",
        soldeHistoriqueRaw,
        sourceDataGouv,
        1_000_000_000,
      ),
      tauxOatHistorique: toTs(
        "oat10.historique",
        "Taux OAT 10 ans",
        "PCT",
        tauxOatHistoriqueRaw,
        sourceBdf,
      ),
      detteLongue: {
        id: "dette.longue",
        label: "Dette publique (annuelle 1945+)",
        unit: "EUR",
        points: dettePoints,
        source: sourceInsee,
      },
      pibLongue: {
        id: "pib.longue",
        label: "PIB France (1945+)",
        unit: "EUR",
        points: pibPoints,
        source: sourceInsee,
      },
      depensesLongue: {
        id: "depenses.longue",
        label: "Dépenses État (1945+)",
        unit: "EUR",
        points: depensesPoints,
        source: sourceDataGouv,
      },
      recettesLongue: {
        id: "recettes.longue",
        label: "Recettes État (1945+)",
        unit: "EUR",
        points: recettesPoints,
        source: sourceDataGouv,
      },
      oatLongue: {
        id: "oat.longue",
        label: "Taux long terme (1945+)",
        unit: "PCT",
        points: oatLongPoints,
        source: sourceBdf,
      },
    },
    executionCourante: buildSeedExecution(annee),
    repartition: {
      annee,
      recettes: recettesLfi2026,
      depenses: depensesLfi2026,
      source: repartitionSource,
    },
    compositionHistorique: {
      recettes: recettesComposition,
      depenses: depensesComposition,
    },
    fraudes: {
      fiscale: fraudeFiscalePoints,
      sociale: fraudeSocialePoints,
      source: {
        id: "fraude.seed",
        label: fraudeSourceLabel,
        url: fraudeSourceUrl,
        fetchedAt: now,
        status: "fallback",
      },
    },
    comparaisonsEuropeennes: {
      detteRatio: detteRatioPaysEurope,
      solde: soldePaysEurope,
      source: {
        id: "europe.seed",
        label: europeSourceLabel,
        url: europeSourceUrl,
        fetchedAt: now,
        status: "fallback",
      },
    },
    spreadOatBund: {
      oatFr: oatFrancePoints,
      bundDe: bundAllemagnePoints,
      spread: spreadOatBundPoints,
      source: {
        id: "spread.seed",
        label: spreadSourceLabel,
        url: spreadSourceUrl,
        fetchedAt: now,
        status: "fallback",
      },
    },
    spreadsMultiPays: {
      btpItalie: btpItaliePoints,
      bonosEspagne: bonosEspagnePoints,
      spreadFrIt: computeSpread(oatFrenchMonthlySeed, btpItaliePoints),
      spreadFrEs: computeSpread(oatFrenchMonthlySeed, bonosEspagnePoints),
      source: {
        id: "spread.multipays",
        label: spreadMultiPaysSourceLabel,
        url: spreadMultiPaysSourceUrl,
        fetchedAt: now,
        status: "fallback",
      },
    },
    inflation: {
      points: inflationPoints,
      source: {
        id: "insee.inflation",
        label: inflationSourceLabel,
        url: inflationSourceUrl,
        fetchedAt: now,
        status: "fallback",
      },
    },
    detenteursDette: {
      categories: detenteursDetteFrance,
      source: detenteursSourceInfo,
    },
    events: {
      items: historicalEvents,
      source: eventsSource,
    },
    historiqueDetaille: {
      secuDepenses: secuDepensesHistoriquePoints,
      secuRecettes: secuRecettesHistoriquePoints,
      collecDepenses: collecDepensesHistoriquePoints,
      collecRecettes: collecRecettesHistoriquePoints,
      secuCollecSource: { ...secuCollecHistSource, fetchedAt: now, status: "fallback" },
      missions: missionsHistoriques,
      missionsSource: { ...missionsSource, fetchedAt: now, status: "fallback" },
    },
    secuCollectivites: {
      secu: {
        branches: secuBranches,
        financement: secuFinancement,
        totalDepenses: secuBranches.reduce((a, b) => a + b.depenses, 0),
      },
      collectivites: {
        niveaux: collectivitesNiveaux,
        financement: collectivitesFinancement,
        totalDepenses: collectivitesNiveaux.reduce((a, b) => a + b.depenses, 0),
      },
      cotisationsTypes,
      beneficesCitoyens,
      source: secuCollecSource,
    },
    ratings: {
      agencies: ratingsAgencies,
      source: ratingsSource,
    },
    // Liste complète des sources officielles utilisées par toutes les
    // composantes du dashboard. En mode mock = même liste qu'en production
    // (toutes en statut "fallback") pour que l'audit soit représentatif.
    sources: [
      sourceInsee,
      sourceBdf,
      sourceDataGouv,
      // LFI 2026 et budget de l'État
      seedSource("budget.gouv", "Direction du Budget — LFI " + annee, "https://www.budget.gouv.fr/documentation/documents-budgetaires"),
      seedSource("dgfip.smb", "DGFiP — Situation Mensuelle Budgétaire", "https://www.budget.gouv.fr/documentation/documents-budgetaires/situation-mensuelle-budgetaire"),
      // Sécu + URSSAF + collectivités
      seedSource("secu.lfss", "Sécurité sociale — LFSS / PLFSS", "https://www.securite-sociale.fr/la-secu-cest-quoi/financement"),
      seedSource("urssaf.baremes", "URSSAF — barèmes des cotisations", "https://www.urssaf.fr/accueil/employeur/cotisations/taux-cotisations.html"),
      seedSource("ccomptes.secu", "Cour des comptes — rapport LFSS", "https://www.ccomptes.fr/fr/domaines-dintervention/securite-sociale"),
      seedSource("dgcl.collec", "DGCL — Collectivités locales (OFGL)", "https://www.collectivites-locales.gouv.fr/"),
      seedSource("insee.apul", "INSEE — Comptes APUL", "https://www.insee.fr/fr/statistiques/5421158"),
      seedSource("unedic", "Unédic — situation financière", "https://www.unedic.org/"),
      // Eurostat / BCE / agences
      seedSource("eurostat.dette", "Eurostat — gov_10q_ggdebt", "https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggdebt"),
      seedSource("eurostat.solde", "Eurostat — gov_10q_ggnfa", "https://ec.europa.eu/eurostat/databrowser/view/gov_10q_ggnfa"),
      seedSource("ecb.taux", "BCE — Data Portal (taux OAT + Bund)", "https://data.ecb.europa.eu/"),
      seedSource("aft", "Agence France Trésor — synthèses", "https://www.aft.gouv.fr/"),
      // Notations
      seedSource("sp.ratings", "Standard & Poor's Global Ratings", "https://disclosure.spglobal.com/ratings/"),
      seedSource("moodys.ratings", "Moody's Ratings", "https://ratings.moodys.com/"),
      seedSource("fitch.ratings", "Fitch Ratings — France", "https://www.fitchratings.com/issuers/france"),
      // Fraude + recherche
      seedSource("ccomptes.fraude", "Cour des comptes — fraude aux prélèvements obligatoires", "https://www.ccomptes.fr/fr/publications/la-fraude-aux-prelevements-obligatoires"),
      seedSource("cpo", "Conseil des Prélèvements Obligatoires", "https://www.ccomptes.fr/fr/institutions-associees/conseil-des-prelevements-obligatoires"),
      seedSource("ofce", "OFCE — séries longues budgétaires", "https://www.ofce.sciences-po.fr/"),
      // Démographie + barèmes pour le simulateur
      seedSource("insee.population", "INSEE — Estimation de population", "https://www.insee.fr/fr/statistiques/1893198"),
      seedSource("impots.bareme", "impots.gouv.fr — Barème IR 2024", "https://www.impots.gouv.fr/particulier/le-calcul-de-limpot-sur-le-revenu"),
      // Équivalences concrètes
      seedSource("education.nationale", "Éducation nationale — rémunérations enseignants", "https://www.education.gouv.fr/"),
      seedSource("sante.gouv", "Ministère de la Santé — budget hôpitaux", "https://sante.gouv.fr/"),
      seedSource("sncf.reseau", "SNCF Réseau — coûts LGV", "https://www.sncf-reseau.com/fr"),
      seedSource("ush", "Union sociale pour l'habitat — coûts logement", "https://www.union-habitat.org/"),
      seedSource("dga", "Direction générale de l'armement — Rafale", "https://www.defense.gouv.fr/dga"),
      seedSource("cnsa", "CNSA — coût EHPAD", "https://www.cnsa.fr/"),
      seedSource("rte", "RTE — coûts énergies renouvelables", "https://www.rte-france.com/"),
      // Chronologie
      seedSource("bdf.chronologie", "Banque de France — Chronologie", "https://www.banque-france.fr/fr/publications-et-statistiques/chronologie"),
    ],
  };
}

function buildSeedExecution(annee: number) {
  const saisonDep = [1.0, 0.95, 1.0, 1.0, 1.05, 1.0, 1.0, 0.85, 1.0, 1.05, 1.05, 1.05];
  const saisonRec = [0.8, 0.85, 0.9, 0.95, 1.05, 1.3, 1.05, 0.85, 0.9, 1.05, 1.15, 1.15];
  const depTotal = 580e9;
  const recTotal = 405e9;
  const sumDep = saisonDep.reduce((a, b) => a + b, 0);
  const sumRec = saisonRec.reduce((a, b) => a + b, 0);
  const now = new Date();
  const moisCourant = now.getUTCFullYear() === annee ? now.getUTCMonth() : (now.getUTCFullYear() > annee ? 11 : -1);
  const recettes = saisonRec.map((s, idx) => ({
    mois: `${annee}-${String(idx + 1).padStart(2, "0")}`,
    prevu: (recTotal / sumRec) * s,
    reel: idx <= moisCourant ? (recTotal / sumRec) * s : 0,
  }));
  const depenses = saisonDep.map((s, idx) => ({
    mois: `${annee}-${String(idx + 1).padStart(2, "0")}`,
    prevu: (depTotal / sumDep) * s,
    reel: idx <= moisCourant ? (depTotal / sumDep) * s : 0,
  }));
  return { annee, recettes, depenses };
}

function ratioAnneeEcoulee(annee: number): number {
  const start = Date.UTC(annee, 0, 1);
  const end = Date.UTC(annee + 1, 0, 1);
  const nowMs = Date.now();
  if (nowMs <= start) return 0;
  if (nowMs >= end) return 1;
  return (nowMs - start) / (end - start);
}
