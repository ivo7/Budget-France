// ============================================================================
// Routes REST publiques — datasets centralisés
// ============================================================================
//
// Expose en JSON tout ce que le dashboard utilise pour ses graphiques :
//
//   GET /api/datasets
//       → liste des séries avec métadonnées (slug, kind, période, source)
//
//   GET /api/datasets/:slug
//       → une série avec tous ses points
//       Query : ?from=YYYY-MM-DD&to=YYYY-MM-DD pour filtrer par date
//
//   GET /api/composition
//       → toutes les catégories de composition (TVA, IR, Défense…)
//         groupées par côté (recettes / dépenses)
//
//   GET /api/lfi/:annee
//       → répartition LFI pour une année, recettes et dépenses
//
//   GET /api/glossary
//       → entrées du glossaire groupées par catégorie (vide si non chargé)
//
// Pensé pour la consommation par d'autres clients (partenaires presse,
// chercheurs, bot Slack…). Tout est en lecture seule (GET).

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const listQuery = z.object({
  from: dateSchema,
  to: dateSchema,
});

export function registerDatasetRoutes(app: FastifyInstance) {
  // Liste des séries disponibles
  app.get("/api/datasets", async () => {
    const series = await prisma.dataSeries.findMany({
      orderBy: [{ kind: "asc" }, { frequency: "asc" }],
      include: { _count: { select: { points: true } } },
    });
    return {
      count: series.length,
      series: series.map((s) => ({
        slug: s.slug,
        kind: s.kind,
        label: s.label,
        unit: s.unit,
        frequency: s.frequency,
        sourceLabel: s.sourceLabel,
        sourceUrl: s.sourceUrl,
        firstDate: s.firstDate,
        lastDate: s.lastDate,
        pointsCount: s._count.points,
      })),
    };
  });

  // Une série avec ses points (filtrable par date)
  app.get("/api/datasets/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_query" });

    const series = await prisma.dataSeries.findUnique({ where: { slug } });
    if (!series) return reply.code(404).send({ error: "not_found" });

    const where: {
      seriesId: string;
      date?: { gte?: Date; lte?: Date };
    } = { seriesId: series.id };
    if (parsed.data.from || parsed.data.to) {
      where.date = {};
      if (parsed.data.from) where.date.gte = new Date(parsed.data.from);
      if (parsed.data.to) where.date.lte = new Date(parsed.data.to);
    }
    const points = await prisma.dataPoint.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return {
      slug: series.slug,
      kind: series.kind,
      label: series.label,
      unit: series.unit,
      frequency: series.frequency,
      sourceLabel: series.sourceLabel,
      sourceUrl: series.sourceUrl,
      points: points.map((p) => ({
        date: p.date.toISOString().slice(0, 10),
        value: p.value,
      })),
    };
  });

  // Composition historique (recettes / dépenses par catégorie)
  app.get("/api/composition", async () => {
    const cats = await prisma.categoryComposition.findMany({
      orderBy: [{ side: "asc" }, { ordering: "asc" }],
      include: {
        points: { orderBy: { date: "asc" } },
      },
    });
    return {
      recettes: cats
        .filter((c) => c.side === "recettes")
        .map((c) => ({
          slug: c.slug,
          label: c.label,
          colorHex: c.colorHex,
          points: c.points.map((p) => ({
            date: p.date.toISOString().slice(0, 10),
            value: p.value,
          })),
        })),
      depenses: cats
        .filter((c) => c.side === "depenses")
        .map((c) => ({
          slug: c.slug,
          label: c.label,
          colorHex: c.colorHex,
          points: c.points.map((p) => ({
            date: p.date.toISOString().slice(0, 10),
            value: p.value,
          })),
        })),
    };
  });

  // Répartition LFI pour une année
  app.get("/api/lfi/:annee", async (req, reply) => {
    const anneeStr = (req.params as { annee: string }).annee;
    const annee = Number(anneeStr);
    if (!Number.isInteger(annee)) return reply.code(400).send({ error: "invalid_year" });

    const entries = await prisma.lfiEntry.findMany({
      where: { annee },
      orderBy: [{ side: "asc" }, { ordering: "asc" }],
    });
    if (entries.length === 0) return reply.code(404).send({ error: "not_found" });

    const byside = (side: "recettes" | "depenses") =>
      entries
        .filter((e) => e.side === side)
        .map((e) => ({
          categorie: e.categorie,
          valeur: e.valeur,
          description: e.description,
        }));

    return {
      annee,
      sourceLabel: entries[0]!.sourceLabel,
      sourceUrl: entries[0]!.sourceUrl,
      recettes: byside("recettes"),
      depenses: byside("depenses"),
      total: {
        recettes: entries.filter((e) => e.side === "recettes").reduce((a, b) => a + b.valeur, 0),
        depenses: entries.filter((e) => e.side === "depenses").reduce((a, b) => a + b.valeur, 0),
      },
    };
  });

  // Notations souveraines France (S&P + Moody's + Fitch, table dédiée)
  app.get("/api/ratings/france", async () => {
    const events = await prisma.sovereignRatingEvent.findMany({
      orderBy: [{ agency: "asc" }, { date: "asc" }],
    });
    const byAgency: Record<string, typeof events> = { sp: [], moodys: [], fitch: [] };
    for (const e of events) {
      (byAgency[e.agency] ??= []).push(e);
    }
    const agencyLabels: Record<string, { label: string; url: string }> = {
      sp: { label: "Standard & Poor's", url: "https://disclosure.spglobal.com/ratings/" },
      moodys: { label: "Moody's", url: "https://ratings.moodys.com/" },
      fitch: { label: "Fitch Ratings", url: "https://www.fitchratings.com/issuers/france" },
    };
    return {
      source: "S&P + Moody's + Fitch (synthèse Agence France Trésor)",
      agencies: Object.entries(byAgency).map(([id, list]) => ({
        id,
        label: agencyLabels[id]?.label ?? id,
        url: agencyLabels[id]?.url,
        events: list.map((e) => ({
          date: e.date.toISOString().slice(0, 10),
          rating: e.rating,
          numeric: e.numeric,
          outlook: e.outlook,
          note: e.note,
        })),
      })),
    };
  });

  // Sécurité sociale + Collectivités territoriales (structure pédagogique)
  app.get("/api/secu-collectivites", async (_req, reply) => {
    try {
      const { readFile } = await import("node:fs/promises");
      const raw = await readFile(config.snapshotPath, "utf8");
      const snap = JSON.parse(raw) as { secuCollectivites?: unknown };
      if (!snap.secuCollectivites) return reply.code(404).send({ error: "not_found" });
      return snap.secuCollectivites;
    } catch (e) {
      return reply.code(500).send({ error: "read_failed", message: (e as Error).message });
    }
  });

  // Événements historiques marquants (annotations pédagogiques)
  app.get("/api/events", async () => {
    const events = await prisma.historicalEvent.findMany({
      orderBy: { date: "asc" },
    });
    return {
      count: events.length,
      items: events.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        title: e.title,
        description: e.description,
        category: e.category,
        impact: e.impact,
      })),
    };
  });

  // Documentation publique de l'API (format OpenAPI minimal)
  app.get("/api/v1/docs", async () => ({
    version: "1.0",
    title: "Budget France — API publique",
    description: "Accès en lecture seule à toutes les séries chronologiques et référentiels utilisés par budgetfrance.fr.",
    license: "Données publiques — mention de la source exigée",
    baseUrl: config.publicBaseUrl + "/api",
    rateLimit: "30 requêtes / minute / IP (sans clé). Clé API sur demande.",
    endpoints: {
      "GET /api/datasets":            "Liste des séries temporelles disponibles",
      "GET /api/datasets/:slug":      "Points d'une série (optionnel : ?from=YYYY-MM-DD&to=...)",
      "GET /api/composition":         "Catégories historiques de recettes et dépenses",
      "GET /api/lfi/:annee":          "Répartition LFI pour une année donnée",
      "GET /api/ratings/france":      "Historique des notations souveraines France",
      "GET /api/events":              "Événements historiques marquants des finances publiques",
      "GET /api/secu-collectivites":  "Sécurité sociale + Collectivités : branches, financement, bénéfices",
      "GET /api/glossary":            "Glossaire des termes (tables pédagogiques)",
      "GET /api/health":              "Statut du backend et des sources",
    },
    corsPolicy: "Open (les endpoints GET /api/* autorisent tout origin)",
    contact: "contact@budgetfrance.local — sources : Eurostat, BCE, INSEE, Cour des comptes",
  }));

  // Glossaire (optionnel)
  app.get("/api/glossary", async () => {
    const entries = await prisma.glossaryEntry.findMany({
      orderBy: [{ categorie: "asc" }, { ordering: "asc" }],
    });
    const grouped: Record<string, typeof entries> = {};
    for (const e of entries) {
      if (!grouped[e.categorie]) grouped[e.categorie] = [];
      grouped[e.categorie]!.push(e);
    }
    return {
      count: entries.length,
      categories: Object.entries(grouped).map(([name, items]) => ({
        name,
        entries: items.map((e) => ({
          slug: e.slug,
          terme: e.terme,
          abbr: e.abbr,
          definition: e.definition,
          exemple: e.exemple,
        })),
      })),
    };
  });
}
