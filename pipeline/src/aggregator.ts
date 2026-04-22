// Agrégateur : orchestre les sources, applique la redondance et produit un BudgetSnapshot.
// Principe : chaque métrique a une liste ordonnée de sources candidates. On tente
// la première ; en cas d'échec, on passe à la suivante. Les sources testées mais
// échouées sont consignées dans `alternates` pour la traçabilité.

import type { BudgetSnapshot, Metric, SourceInfo, Timeseries } from "./types.ts";
import { seedSnapshot } from "./seed.ts";
import {
  dettePoints,
  pibPoints,
  depensesPoints,
  recettesPoints,
  oatLongPoints,
  anneeMin,
  anneeMax,
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
import * as eurostat from "./sources/eurostat.ts";
import * as ecb from "./sources/ecb.ts";
import * as insee from "./sources/insee.ts";
import * as bdf from "./sources/banqueDeFrance.ts";
import * as dg from "./sources/dataGouv.ts";

type MetricCandidate<T> = () => Promise<{ value: T; source: SourceInfo }>;

async function tryChain<T>(
  label: string,
  candidates: MetricCandidate<T>[],
): Promise<{ value: T | null; chosen: SourceInfo | null; alternates: SourceInfo[] }> {
  const alternates: SourceInfo[] = [];
  for (const fn of candidates) {
    try {
      const { value, source } = await fn();
      return { value, chosen: source, alternates };
    } catch (e) {
      alternates.push({
        id: `${label}.error.${alternates.length}`,
        label: `${label} (échec)`,
        url: "",
        fetchedAt: new Date().toISOString(),
        status: "error",
        error: (e as Error).message,
      });
    }
  }
  return { value: null, chosen: null, alternates };
}

export async function buildSnapshot(annee: number, opts: { mock?: boolean } = {}): Promise<BudgetSnapshot> {
  const seed = seedSnapshot(annee);
  if (opts.mock) {
    return { ...seed, generatedAt: new Date().toISOString() };
  }

  // --- Dette publique : Eurostat -> INSEE -> seed ---
  const detteRes = await tryChain("dette", [
    async () => {
      const r = await eurostat.fetchDettePublique();
      return { value: { latest: r.latest, series: r.series }, source: r.source };
    },
    async () => {
      const r = await insee.fetchDettePubliqueInsee();
      return { value: { latest: r.latest, series: [] }, source: r.source };
    },
  ]);

  const dettePublique: Metric = detteRes.value
    ? {
        value: detteRes.value.latest.value,
        unit: "EUR",
        source: detteRes.chosen!,
        alternates: detteRes.alternates,
        asOf: detteRes.value.latest.date,
      }
    : { ...seed.dettePublique, alternates: detteRes.alternates };

  // --- PIB : Eurostat -> seed ---
  const pibRes = await tryChain("pib", [
    async () => {
      const r = await eurostat.fetchPib();
      return { value: r.latest, source: r.source };
    },
  ]);
  const pib: Metric = pibRes.value
    ? {
        value: pibRes.value.value,
        unit: "EUR",
        source: pibRes.chosen!,
        alternates: pibRes.alternates,
        asOf: pibRes.value.date,
      }
    : { ...seed.pib, alternates: pibRes.alternates };

  // --- Taux OAT 10 ans : BCE -> seed ---
  const oatRes = await tryChain("oat10", [
    async () => {
      const r = await ecb.fetchOat10ans();
      return { value: { latest: r.latest, series: r.series }, source: r.source };
    },
  ]);
  const tauxOat10ans: Metric = oatRes.value
    ? {
        value: oatRes.value.latest.value,
        unit: "PCT",
        source: oatRes.chosen!,
        alternates: oatRes.alternates,
        asOf: oatRes.value.latest.date,
      }
    : { ...seed.tauxOat10ans, alternates: oatRes.alternates };

  // --- Taux BCE ---
  const bceRes = await tryChain("mro", [
    async () => {
      const r = await ecb.fetchTauxDirecteur();
      return { value: r.latest, source: r.source };
    },
  ]);
  const tauxDirecteurBce: Metric = bceRes.value
    ? {
        value: bceRes.value.value,
        unit: "PCT",
        source: bceRes.chosen!,
        alternates: bceRes.alternates,
        asOf: bceRes.value.date,
      }
    : { ...seed.tauxDirecteurBce, alternates: bceRes.alternates };

  // --- Sources complémentaires (ping, pour traçabilité / redondance) ---
  const [bdfPing, dgPing] = await Promise.all([bdf.pingWebstat(), dg.pingBudgetEtat()]);

  // --- Séries temporelles ---
  const detteHistorique = detteRes.value && detteRes.value.series.length > 0
    ? {
        ...seed.series.detteHistorique,
        points: detteRes.value.series,
        source: detteRes.chosen!,
      }
    : seed.series.detteHistorique;

  const tauxOatHistorique = oatRes.value && oatRes.value.series.length > 0
    ? {
        ...seed.series.tauxOatHistorique,
        points: oatRes.value.series,
        source: oatRes.chosen!,
      }
    : seed.series.tauxOatHistorique;

  // --- Calcul dérivé : ratio dette/PIB et vitesse d'endettement ---
  const ratioDettePib: Metric = {
    value: dettePublique.value / pib.value,
    unit: "RATIO",
    source: {
      id: "calc.dette_sur_pib",
      label: "Calcul — Dette / PIB",
      url: "",
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
    alternates: [],
    asOf: new Date().toISOString().slice(0, 10),
  };

  // Vitesse d'endettement : dérivée sur les 4 derniers trimestres si dispo.
  let vitesseEurParSec = seed.vitesseEndettementEurParSec.value;
  if (detteRes.value && detteRes.value.series.length >= 5) {
    const pts = detteRes.value.series;
    const a = pts[pts.length - 5]!;
    const b = pts[pts.length - 1]!;
    const ms = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (ms > 0) {
      const deltaEur = b.value - a.value;
      vitesseEurParSec = deltaEur / (ms / 1000);
    }
  }
  const vitesseMetric: Metric = {
    value: vitesseEurParSec,
    unit: "EUR_PER_SEC",
    source: {
      id: "calc.vitesse_endettement",
      label: "Calcul — Vitesse d'endettement (dérivée 12 mois)",
      url: "",
      fetchedAt: new Date().toISOString(),
      status: "ok",
    },
    alternates: [],
    asOf: new Date().toISOString().slice(0, 10),
  };

  // --- Séries longues (1945+) et exécution 2026 ---
  const histSource: SourceInfo = {
    id: "hist.seed",
    label: `Séries longues ${anneeMin}-${anneeMax} (INSEE + DGFiP + BdF)`,
    url: "https://www.insee.fr/fr/statistiques/serie/010565692",
    fetchedAt: new Date().toISOString(),
    status: "fallback",
  };
  const mkLongue = (id: string, label: string, unit: Timeseries["unit"], points: Timeseries["points"]): Timeseries => ({
    id, label, unit, points, source: histSource,
  });

  const detteLongue = mkLongue("dette.longue", "Dette publique (annuelle 1945+)", "EUR", dettePoints);
  const pibLongue = mkLongue("pib.longue", "PIB France (1945+)", "EUR", pibPoints);
  const depensesLongue = mkLongue("depenses.longue", "Dépenses État (1945+)", "EUR", depensesPoints);
  const recettesLongue = mkLongue("recettes.longue", "Recettes État (1945+)", "EUR", recettesPoints);
  const oatLongue = mkLongue("oat.longue", "Taux long terme (1945+)", "PCT", oatLongPoints);

  const executionCourante = buildExecution(annee, seed.budgetPrevisionnel.value, seed.recettesPrevisionnelles.value);

  const repartition = {
    annee,
    recettes: recettesLfi2026,
    depenses: depensesLfi2026,
    source: repartitionSource,
  };

  // Liste exhaustive des sources utilisées pour alimenter TOUS les graphiques
  // du dashboard. L'ordre est préservé pour l'affichage : APIs live en tête,
  // seeds en fin. Chacune est déduplicable par id côté front.
  const nowIso = new Date().toISOString();
  const allSources: SourceInfo[] = [
    // --- Sources live (APIs) ---
    dettePublique.source,
    pib.source,
    tauxOat10ans.source,
    tauxDirecteurBce.source,
    bdfPing,
    dgPing,

    // --- Sources seed (données statiques enrichies avec sources officielles) ---
    histSource,
    {
      id: "lfi.source",
      label: "Direction du Budget — Loi de finances initiale " + annee,
      url: "https://www.budget.gouv.fr/documentation/documents-budgetaires",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "fraude.source",
      label: "Cour des comptes — La fraude aux prélèvements obligatoires",
      url: "https://www.ccomptes.fr/fr/publications/la-fraude-aux-prelevements-obligatoires",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "cpo.source",
      label: "Conseil des Prélèvements Obligatoires — études TVA / IS",
      url: "https://www.ccomptes.fr/fr/institutions-associees/conseil-des-prelevements-obligatoires",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "ofce.source",
      label: "OFCE — séries longues budgétaires France",
      url: "https://www.ofce.sciences-po.fr/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "europe.source",
      label: "Eurostat — gov_10q_ggdebt + gov_10q_ggnfa (FR · DE · IT · ES · UE)",
      url: "https://ec.europa.eu/eurostat/web/government-finance-statistics",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "spread.source",
      label: "BCE — Data Portal (OAT FR + Bund DE, taux mensuels)",
      url: "https://data.ecb.europa.eu/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "sp.source",
      label: "Standard & Poor's Global Ratings — France",
      url: "https://disclosure.spglobal.com/ratings/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "moodys.source",
      label: "Moody's Ratings — France",
      url: "https://ratings.moodys.com/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "fitch.source",
      label: "Fitch Ratings — France",
      url: "https://www.fitchratings.com/issuers/france",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "aft.source",
      label: "Agence France Trésor — synthèses ratings et émissions",
      url: "https://www.aft.gouv.fr/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "dgfip.source",
      label: "DGFiP — Situation Mensuelle Budgétaire",
      url: "https://www.budget.gouv.fr/documentation/documents-budgetaires/situation-mensuelle-budgetaire",
      fetchedAt: nowIso,
      status: "fallback",
    },
    // --- Sources pour le simulateur "Où vont mes impôts ?" et les équivalences ---
    {
      id: "insee.population",
      label: "INSEE — Estimation de population (68,5 M au 01/01/2026)",
      url: "https://www.insee.fr/fr/statistiques/1893198",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "impots.bareme",
      label: "impots.gouv.fr — Barème de l'impôt sur le revenu 2024",
      url: "https://www.impots.gouv.fr/particulier/le-calcul-de-limpot-sur-le-revenu",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "education.nationale",
      label: "Éducation nationale — rémunération moyenne enseignants secondaire",
      url: "https://www.education.gouv.fr/les-personnels-de-l-education-nationale-6515",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "sante.hopitaux",
      label: "Ministère de la Santé — budget moyen d'un centre hospitalier",
      url: "https://sante.gouv.fr/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "sncf.reseau",
      label: "SNCF Réseau — coût moyen d'une LGV récente",
      url: "https://www.sncf-reseau.com/fr",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "ush.logement",
      label: "Union sociale pour l'habitat — coûts construction logement social",
      url: "https://www.union-habitat.org/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "dga.armement",
      label: "Direction générale de l'armement — prix export Rafale",
      url: "https://www.defense.gouv.fr/dga",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "cnsa.ehpad",
      label: "CNSA — coût moyen d'une place en EHPAD",
      url: "https://www.cnsa.fr/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "rte.reseau",
      label: "RTE — coûts installés des énergies renouvelables",
      url: "https://www.rte-france.com/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    // --- Sources Sécu + Collectivités ---
    {
      id: "secu.lfss",
      label: "Sécurité sociale — Loi de financement (LFSS) et annexes PLFSS",
      url: "https://www.securite-sociale.fr/la-secu-cest-quoi/financement",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "urssaf.baremes",
      label: "URSSAF — barèmes des cotisations 2024-2025",
      url: "https://www.urssaf.fr/accueil/employeur/cotisations/taux-cotisations.html",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "ccomptes.secu",
      label: "Cour des comptes — rapport annuel sur l'application de la LFSS",
      url: "https://www.ccomptes.fr/fr/domaines-dintervention/securite-sociale",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "dgcl.collec",
      label: "DGCL — Direction générale des collectivités locales (OFGL)",
      url: "https://www.collectivites-locales.gouv.fr/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "insee.apul",
      label: "INSEE — Comptes nationaux des administrations publiques locales (APUL)",
      url: "https://www.insee.fr/fr/statistiques/5421158",
      fetchedAt: nowIso,
      status: "fallback",
    },
    {
      id: "unedic.financement",
      label: "Unédic — situation financière et rapport d'activité",
      url: "https://www.unedic.org/",
      fetchedAt: nowIso,
      status: "fallback",
    },
    ...seed.sources.filter((s) => s.status === "fallback"),
  ];

  return {
    generatedAt: new Date().toISOString(),
    annee,
    budgetPrevisionnel: seed.budgetPrevisionnel,
    recettesPrevisionnelles: seed.recettesPrevisionnelles,
    budgetExecute: seed.budgetExecute,
    soldeBudgetaire: seed.soldeBudgetaire,
    dettePublique,
    pib,
    ratioDettePib,
    tauxOat10ans,
    tauxDirecteurBce,
    vitesseEndettementEurParSec: vitesseMetric,
    series: {
      detteHistorique,
      soldeHistorique: seed.series.soldeHistorique,
      tauxOatHistorique,
      detteLongue,
      pibLongue,
      depensesLongue,
      recettesLongue,
      oatLongue,
    },
    executionCourante,
    repartition,
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
        fetchedAt: new Date().toISOString(),
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
        fetchedAt: new Date().toISOString(),
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
        fetchedAt: new Date().toISOString(),
        status: "fallback",
      },
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
      secuCollecSource: { ...secuCollecHistSource, fetchedAt: new Date().toISOString(), status: "fallback" },
      missions: missionsHistoriques,
      missionsSource: { ...missionsSource, fetchedAt: new Date().toISOString(), status: "fallback" },
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
    sources: allSources,
  };
}

/**
 * Construit une exécution mensuelle estimée pour l'année courante.
 * Modèle : répartition avec une légère saisonnalité (pic fiscal en juin pour
 * les recettes, dépenses plus linéaires). Le "réel" est calculé jusqu'au mois
 * courant ; les mois futurs sont nuls côté "réel".
 */
function buildExecution(annee: number, depTotal: number, recTotal: number) {
  const saisonDep = [1.0, 0.95, 1.0, 1.0, 1.05, 1.0, 1.0, 0.85, 1.0, 1.05, 1.05, 1.05];
  const saisonRec = [0.8, 0.85, 0.9, 0.95, 1.05, 1.3, 1.05, 0.85, 0.9, 1.05, 1.15, 1.15];
  const sumDep = saisonDep.reduce((a, b) => a + b, 0);
  const sumRec = saisonRec.reduce((a, b) => a + b, 0);
  const now = new Date();
  const moisCourant = now.getUTCFullYear() === annee ? now.getUTCMonth() : (now.getUTCFullYear() > annee ? 11 : -1);

  const recettes = saisonRec.map((s, idx) => {
    const mois = `${annee}-${String(idx + 1).padStart(2, "0")}`;
    const prevu = (recTotal / sumRec) * s;
    const reel = idx <= moisCourant ? prevu * (0.96 + Math.random() * 0.08) : 0;
    return { mois, prevu, reel };
  });
  const depenses = saisonDep.map((s, idx) => {
    const mois = `${annee}-${String(idx + 1).padStart(2, "0")}`;
    const prevu = (depTotal / sumDep) * s;
    const reel = idx <= moisCourant ? prevu * (0.97 + Math.random() * 0.06) : 0;
    return { mois, prevu, reel };
  });

  return { annee, recettes, depenses };
}
