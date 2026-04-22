// ============================================================================
// Loader des datasets depuis le snapshot du pipeline (data/budget.json).
// ============================================================================
//
// S'exécute au démarrage du backend, après que Prisma a appliqué le schéma.
// Si les tables DataSeries / CategoryComposition / LfiEntry sont vides
// (ou si la variable DATASETS_FORCE_RELOAD=1), on charge le JSON le plus
// récent produit par le pipeline et on persiste tout en base.
//
// Idempotent : peut être relancé sans créer de doublons grâce aux contraintes
// UNIQUE (slug, (seriesId,date), (categoryId,date), (annee,side,categorie)).
//
// Rôle :
//   - offrir une API REST /api/datasets/* consommable par n'importe quel
//     client (frontend Budget France, partenaires presse, bot Slack…)
//   - permettre des requêtes SQL analytiques sans dépendre du JSON
//   - garder une trace historique (on n'écrase pas un ancien point si la
//     source officielle le réémet plus tard)

import { readFile } from "node:fs/promises";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";

/** Structure attendue du fichier /data/budget.json produit par le pipeline. */
interface BudgetSnapshot {
  generatedAt: string;
  annee: number;
  series: {
    detteHistorique: Series;
    soldeHistorique: Series;
    tauxOatHistorique: Series;
    detteLongue?: Series;
    pibLongue?: Series;
    depensesLongue?: Series;
    recettesLongue?: Series;
    oatLongue?: Series;
  };
  repartition?: {
    annee: number;
    recettes: LfiItem[];
    depenses: LfiItem[];
    source: { label: string; url: string };
  };
  compositionHistorique?: {
    recettes: CompositionSeriesJson[];
    depenses: CompositionSeriesJson[];
  };
  fraudes?: {
    fiscale: { date: string; value: number }[];
    sociale: { date: string; value: number }[];
    source: { label: string; url: string };
  };
  comparaisonsEuropeennes?: {
    detteRatio: { pays: string; label: string; colorHex: string; points: { date: string; value: number }[] }[];
    solde: { pays: string; label: string; colorHex: string; points: { date: string; value: number }[] }[];
    source: { label: string; url: string };
  };
  spreadOatBund?: {
    oatFr: { date: string; value: number }[];
    bundDe: { date: string; value: number }[];
    spread: { date: string; value: number }[];
    source: { label: string; url: string };
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
    source: { label: string; url: string };
  };
  events?: {
    items: {
      date: string;
      title: string;
      description: string;
      category: "politique" | "economique" | "monetaire" | "militaire" | "crise";
      impact?: "dette+" | "dette-" | "taux+" | "taux-" | "neutre";
    }[];
    source: { label: string; url: string };
  };
}

interface Series {
  id: string;
  label: string;
  unit: "EUR" | "PCT" | "RATIO";
  points: { date: string; value: number }[];
  source: { label: string; url: string };
}

interface CompositionSeriesJson {
  id: string;
  label: string;
  color: string;
  points: { date: string; value: number }[];
}

interface LfiItem {
  categorie: string;
  valeur: number;
  description?: string;
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

export async function loadDatasetsIfNeeded(log: (msg: string) => void = console.log): Promise<void> {
  const force = process.env.DATASETS_FORCE_RELOAD === "1";

  // On regarde si l'une des tables principales est déjà peuplée.
  const [existingSeries, existingComposition, existingLfi] = await Promise.all([
    prisma.dataSeries.count(),
    prisma.categoryComposition.count(),
    prisma.lfiEntry.count(),
  ]);

  if (!force && existingSeries > 0 && existingComposition > 0 && existingLfi > 0) {
    log(`[datasets] tables déjà peuplées (${existingSeries} séries, ${existingComposition} catégories, ${existingLfi} lignes LFI). Skip.`);
    return;
  }

  let snapshot: BudgetSnapshot;
  try {
    const raw = await readFile(config.snapshotPath, "utf8");
    snapshot = JSON.parse(raw) as BudgetSnapshot;
  } catch (e) {
    log(`[datasets] impossible de lire ${config.snapshotPath}: ${(e as Error).message}`);
    log("[datasets] → le pipeline doit avoir tourné au moins une fois. Skip.");
    return;
  }

  log(`[datasets] snapshot du ${snapshot.generatedAt}, annee ${snapshot.annee} → chargement en DB`);

  await loadTimeseries(snapshot, log);
  await loadComposition(snapshot, log);
  await loadLfi(snapshot, log);
  await loadFraudes(snapshot, log);
  await loadEurope(snapshot, log);
  await loadSpread(snapshot, log);
  await loadRatings(snapshot, log);
  await loadEvents(snapshot, log);

  log("[datasets] chargement terminé.");
}

// ---------------------------------------------------------------------------
// Séries temporelles (dette, PIB, dépenses, recettes, taux)
// ---------------------------------------------------------------------------

async function loadTimeseries(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  const specs: Array<{
    slug: string;
    kind: string;
    unit: string;
    frequency: string;
    series: Series | undefined;
  }> = [
    { slug: "dette-longue-1945",      kind: "dette_publique",    unit: "EUR", frequency: "annuel",      series: snap.series.detteLongue },
    { slug: "pib-longue-1945",        kind: "pib",               unit: "EUR", frequency: "annuel",      series: snap.series.pibLongue },
    { slug: "depenses-longue-1945",   kind: "depenses_etat",     unit: "EUR", frequency: "annuel",      series: snap.series.depensesLongue },
    { slug: "recettes-longue-1945",   kind: "recettes_etat",     unit: "EUR", frequency: "annuel",      series: snap.series.recettesLongue },
    { slug: "oat-longue-1945",        kind: "taux_oat_10ans",    unit: "PCT", frequency: "annuel",      series: snap.series.oatLongue },
    { slug: "dette-recente",          kind: "dette_publique",    unit: "EUR", frequency: "trimestriel", series: snap.series.detteHistorique },
    { slug: "solde-historique",       kind: "solde_budgetaire",  unit: "EUR", frequency: "annuel",      series: snap.series.soldeHistorique },
    { slug: "oat-mensuel",            kind: "taux_oat_10ans",    unit: "PCT", frequency: "mensuel",     series: snap.series.tauxOatHistorique },
  ];

  let loaded = 0;
  for (const spec of specs) {
    if (!spec.series || spec.series.points.length === 0) continue;
    await persistSeries(spec);
    loaded++;
  }
  log(`[datasets] ${loaded} séries temporelles chargées (${specs.length} tentées)`);
}

async function persistSeries(spec: {
  slug: string;
  kind: string;
  unit: string;
  frequency: string;
  series: Series | undefined;
}): Promise<void> {
  if (!spec.series) return;
  const s = spec.series;

  const firstDate = s.points[0] ? new Date(s.points[0].date) : null;
  const lastDate = s.points[s.points.length - 1] ? new Date(s.points[s.points.length - 1]!.date) : null;

  // Upsert la série
  const dbSeries = await prisma.dataSeries.upsert({
    where: { slug: spec.slug },
    update: {
      label: s.label,
      sourceLabel: s.source.label,
      sourceUrl: s.source.url || null,
      firstDate,
      lastDate,
    },
    create: {
      slug: spec.slug,
      kind: spec.kind as never,
      label: s.label,
      unit: s.unit,
      frequency: spec.frequency as never,
      sourceLabel: s.source.label,
      sourceUrl: s.source.url || null,
      firstDate,
      lastDate,
    },
  });

  // Upsert les points par lots de 500
  const chunks = chunk(s.points, 500);
  for (const batch of chunks) {
    await prisma.$transaction(
      batch.map((p) =>
        prisma.dataPoint.upsert({
          where: { seriesId_date: { seriesId: dbSeries.id, date: new Date(p.date) } },
          update: { value: p.value },
          create: { seriesId: dbSeries.id, date: new Date(p.date), value: p.value },
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Composition historique (TVA, IR, Défense, etc.)
// ---------------------------------------------------------------------------

async function loadComposition(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.compositionHistorique) {
    log("[datasets] pas de compositionHistorique dans le snapshot. Skip.");
    return;
  }

  const allCats: { side: "recettes" | "depenses"; data: CompositionSeriesJson }[] = [
    ...snap.compositionHistorique.recettes.map((d) => ({ side: "recettes" as const, data: d })),
    ...snap.compositionHistorique.depenses.map((d) => ({ side: "depenses" as const, data: d })),
  ];

  let ordering = 0;
  for (const { side, data } of allCats) {
    const slug = `${side}-${data.id}`;
    const cat = await prisma.categoryComposition.upsert({
      where: { slug },
      update: {
        label: data.label,
        colorHex: data.color,
        ordering: ordering++,
      },
      create: {
        slug,
        label: data.label,
        side: side as never,
        colorHex: data.color,
        ordering: ordering++,
      },
    });

    for (const batch of chunk(data.points, 500)) {
      await prisma.$transaction(
        batch.map((p) =>
          prisma.compositionPoint.upsert({
            where: { categoryId_date: { categoryId: cat.id, date: new Date(p.date) } },
            update: { value: p.value },
            create: { categoryId: cat.id, date: new Date(p.date), value: p.value },
          }),
        ),
      );
    }
  }
  log(`[datasets] ${allCats.length} catégories de composition chargées`);
}

// ---------------------------------------------------------------------------
// LFI — grandes masses votées
// ---------------------------------------------------------------------------

async function loadLfi(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.repartition) {
    log("[datasets] pas de repartition dans le snapshot. Skip LFI.");
    return;
  }

  const { annee, recettes, depenses, source } = snap.repartition;
  const lines = [
    ...recettes.map((r, idx) => ({ side: "recettes" as const, item: r, ordering: idx })),
    ...depenses.map((r, idx) => ({ side: "depenses" as const, item: r, ordering: idx })),
  ];

  for (const { side, item, ordering } of lines) {
    await prisma.lfiEntry.upsert({
      where: { annee_side_categorie: { annee, side: side as never, categorie: item.categorie } },
      update: {
        valeur: item.valeur,
        description: item.description ?? null,
        ordering,
      },
      create: {
        annee,
        side: side as never,
        categorie: item.categorie,
        valeur: item.valeur,
        description: item.description ?? null,
        ordering,
        sourceLabel: source.label,
        sourceUrl: source.url || null,
      },
    });
  }
  log(`[datasets] LFI ${annee} : ${lines.length} lignes chargées`);
}

// ---------------------------------------------------------------------------
// Fraudes (fiscale + sociale) — stockées comme séries chronologiques
// ---------------------------------------------------------------------------

async function loadFraudes(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.fraudes) {
    log("[datasets] pas de fraudes dans le snapshot. Skip.");
    return;
  }

  const source = snap.fraudes.source;

  const specs = [
    { slug: "fraude-fiscale-1945", kind: "fraude_fiscale" as const, label: "Fraude fiscale (estimation, 1945+)", points: snap.fraudes.fiscale },
    { slug: "fraude-sociale-1945", kind: "fraude_sociale" as const, label: "Fraude sociale (estimation, 1945+)", points: snap.fraudes.sociale },
  ];

  for (const spec of specs) {
    if (spec.points.length === 0) continue;
    const firstDate = new Date(spec.points[0]!.date);
    const lastDate = new Date(spec.points[spec.points.length - 1]!.date);

    const series = await prisma.dataSeries.upsert({
      where: { slug: spec.slug },
      update: {
        label: spec.label,
        sourceLabel: source.label,
        sourceUrl: source.url || null,
        firstDate,
        lastDate,
      },
      create: {
        slug: spec.slug,
        kind: spec.kind,
        label: spec.label,
        unit: "EUR",
        frequency: "annuel",
        sourceLabel: source.label,
        sourceUrl: source.url || null,
        firstDate,
        lastDate,
      },
    });

    for (const batch of chunk(spec.points, 500)) {
      await prisma.$transaction(
        batch.map((p) =>
          prisma.dataPoint.upsert({
            where: { seriesId_date: { seriesId: series.id, date: new Date(p.date) } },
            update: { value: p.value },
            create: { seriesId: series.id, date: new Date(p.date), value: p.value },
          }),
        ),
      );
    }
  }
  log(`[datasets] fraudes chargées : ${specs.length} séries`);
}

// ---------------------------------------------------------------------------
// Comparaisons européennes — une série par pays × 2 métriques
// ---------------------------------------------------------------------------

async function loadEurope(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.comparaisonsEuropeennes) {
    log("[datasets] pas de comparaisonsEuropeennes dans le snapshot. Skip.");
    return;
  }
  const { detteRatio, solde, source } = snap.comparaisonsEuropeennes;
  let n = 0;

  for (const entry of detteRatio) {
    await persistCountrySeries({
      slug: `dette-ratio-pib-${entry.pays.toLowerCase()}`,
      kind: "dette_ratio_pib",
      label: `Dette / PIB — ${entry.label}`,
      unit: "PCT",
      points: entry.points,
      sourceLabel: source.label,
      sourceUrl: source.url,
    });
    n++;
  }
  for (const entry of solde) {
    await persistCountrySeries({
      slug: `solde-ratio-pib-${entry.pays.toLowerCase()}`,
      kind: "solde_ratio_pib",
      label: `Solde / PIB — ${entry.label}`,
      unit: "PCT",
      points: entry.points,
      sourceLabel: source.label,
      sourceUrl: source.url,
    });
    n++;
  }
  log(`[datasets] Europe : ${n} séries par pays chargées`);
}

// ---------------------------------------------------------------------------
// Spread OAT-Bund — 3 séries (OAT, Bund, spread en pb)
// ---------------------------------------------------------------------------

async function loadSpread(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.spreadOatBund) {
    log("[datasets] pas de spreadOatBund dans le snapshot. Skip.");
    return;
  }
  const { oatFr, bundDe, spread, source } = snap.spreadOatBund;
  const specs = [
    { slug: "taux-oat-10ans-mensuel",   kind: "taux_oat_10ans", label: "OAT 10 ans France (mensuel)",    unit: "PCT", points: oatFr },
    { slug: "taux-bund-10ans-mensuel",  kind: "taux_bund_10ans", label: "Bund 10 ans Allemagne (mensuel)", unit: "PCT", points: bundDe },
    { slug: "spread-oat-bund-mensuel",  kind: "spread_oat_bund", label: "Spread OAT-Bund (points de base)", unit: "BP",  points: spread },
  ] as const;

  for (const spec of specs) {
    await persistCountrySeries({
      slug: spec.slug,
      kind: spec.kind,
      label: spec.label,
      unit: spec.unit,
      points: spec.points,
      sourceLabel: source.label,
      sourceUrl: source.url,
    });
  }
  log(`[datasets] Spread OAT-Bund : ${specs.length} séries chargées`);
}

async function persistCountrySeries(args: {
  slug: string;
  kind: string;
  label: string;
  unit: string;
  points: { date: string; value: number }[];
  sourceLabel: string;
  sourceUrl: string;
}): Promise<void> {
  if (args.points.length === 0) return;
  const firstDate = new Date(args.points[0]!.date);
  const lastDate = new Date(args.points[args.points.length - 1]!.date);

  const series = await prisma.dataSeries.upsert({
    where: { slug: args.slug },
    update: {
      label: args.label,
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl || null,
      firstDate,
      lastDate,
    },
    create: {
      slug: args.slug,
      kind: args.kind as never,
      label: args.label,
      unit: args.unit,
      frequency: (args.slug.includes("mensuel") ? "mensuel" : "annuel") as never,
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl || null,
      firstDate,
      lastDate,
    },
  });

  for (const batch of chunk(args.points, 500)) {
    await prisma.$transaction(
      batch.map((p) =>
        prisma.dataPoint.upsert({
          where: { seriesId_date: { seriesId: series.id, date: new Date(p.date) } },
          update: { value: p.value },
          create: { seriesId: series.id, date: new Date(p.date), value: p.value },
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Notations souveraines (S&P / Moody's / Fitch) — table dédiée
// ---------------------------------------------------------------------------

async function loadRatings(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.ratings) {
    log("[datasets] pas de ratings dans le snapshot. Skip.");
    return;
  }
  let n = 0;
  for (const agency of snap.ratings.agencies) {
    for (const ev of agency.events) {
      await prisma.sovereignRatingEvent.upsert({
        where: {
          agency_date: {
            agency: agency.id as never,
            date: new Date(ev.date),
          },
        },
        update: {
          rating: ev.rating,
          numeric: ev.numeric,
          outlook: (ev.outlook ?? null) as never,
          note: ev.note ?? null,
        },
        create: {
          agency: agency.id as never,
          date: new Date(ev.date),
          rating: ev.rating,
          numeric: ev.numeric,
          outlook: (ev.outlook ?? null) as never,
          note: ev.note ?? null,
        },
      });
      n++;
    }
  }
  log(`[datasets] ratings : ${n} événements chargés sur ${snap.ratings.agencies.length} agences`);
}

// ---------------------------------------------------------------------------
// Événements historiques marquants
// ---------------------------------------------------------------------------

async function loadEvents(snap: BudgetSnapshot, log: (m: string) => void): Promise<void> {
  if (!snap.events) {
    log("[datasets] pas d'événements dans le snapshot. Skip.");
    return;
  }
  const impactMap: Record<string, string> = {
    "dette+": "dette_up",
    "dette-": "dette_down",
    "taux+": "taux_up",
    "taux-": "taux_down",
    "neutre": "neutre",
  };
  let n = 0;
  for (const ev of snap.events.items) {
    const impactDb = ev.impact ? impactMap[ev.impact] : null;
    await prisma.historicalEvent.upsert({
      where: { date: new Date(ev.date) },
      update: {
        title: ev.title,
        description: ev.description,
        category: ev.category as never,
        impact: (impactDb ?? null) as never,
      },
      create: {
        date: new Date(ev.date),
        title: ev.title,
        description: ev.description,
        category: ev.category as never,
        impact: (impactDb ?? null) as never,
      },
    });
    n++;
  }
  log(`[datasets] événements historiques : ${n} chargés`);
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
