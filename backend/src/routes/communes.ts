// ============================================================================
// routes/communes.ts — API publique pour les budgets communaux
// ============================================================================
//
// Endpoints :
//   GET /api/communes/search?q=...&limit=20   → recherche autocomplete
//   GET /api/communes/[code]                  → fiche complète d'une commune
//   GET /api/communes/rankings?indicator=...  → classement national
//   GET /api/communes/stats                   → stats globales (nombre, etc.)
//
// Architecture : tous les endpoints sont en lecture seule, ouverts à tous,
// sans authentification. Rate-limit global Fastify (30 req/min/IP).
//
// Sérialisation : les BigInt Postgres sont convertis en number côté JSON
// (les budgets communaux tiennent largement dans Number.MAX_SAFE_INTEGER —
// 9 quadrillions €). Pas de risque de perte de précision.
// ============================================================================

import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db.ts";

// Helper : transforme un BigInt Postgres en number JSON-safe
function bn(b: bigint): number {
  return Number(b);
}

export function registerCommunesRoutes(app: FastifyInstance) {
  // --------------------------------------------------------------------------
  // GET /api/communes/search?q=paris&limit=20
  // Recherche par nom, code INSEE, ou code postal (préfixe département).
  // --------------------------------------------------------------------------
  app.get("/api/communes/search", async (req, reply) => {
    const q = ((req.query as { q?: string }).q ?? "").trim();
    const limit = Math.min(
      Math.max(parseInt((req.query as { limit?: string }).limit ?? "20", 10) || 20, 1),
      50,
    );

    // Vide : on renvoie les 8 plus peuplées par défaut
    if (q.length === 0) {
      const defaults = await prisma.commune.findMany({
        orderBy: { population: "desc" },
        take: 8,
        select: {
          codeInsee: true,
          nom: true,
          slug: true,
          departement: true,
          population: true,
          classification: true,
        },
      });
      return { results: defaults, total: defaults.length };
    }

    // Avec query : recherche par nom (insensible à la casse, accent-aware)
    // ou par code INSEE/postal préfixe.
    const isNumeric = /^\d+$/.test(q);
    const results = await prisma.commune.findMany({
      where: isNumeric
        ? {
            OR: [
              { codeInsee: { startsWith: q } },
              { departementCode: { equals: q.padStart(2, "0").slice(0, 2) } },
            ],
          }
        : {
            OR: [
              { nom: { contains: q, mode: "insensitive" } },
              { slug: { contains: q.toLowerCase() } },
            ],
          },
      orderBy: [{ population: "desc" }, { nom: "asc" }],
      take: limit,
      select: {
        codeInsee: true,
        nom: true,
        slug: true,
        departement: true,
        population: true,
        classification: true,
      },
    });
    return { results, total: results.length };
  });

  // --------------------------------------------------------------------------
  // GET /api/communes/[code]
  // Fiche complète d'une commune avec son historique financier.
  // --------------------------------------------------------------------------
  app.get("/api/communes/:code", async (req, reply) => {
    const { code } = req.params as { code: string };

    // Le code peut être soit un code INSEE (5 chiffres) soit un slug
    const commune = await prisma.commune.findFirst({
      where: { OR: [{ codeInsee: code }, { slug: code }] },
      include: {
        finances: { orderBy: { annee: "asc" } },
      },
    });

    if (!commune) {
      return reply.code(404).send({ error: "not_found" });
    }

    // Sérialise les BigInt → Number
    const finances = commune.finances.map((f) => ({
      annee: f.annee,
      recettesTotalesEur: bn(f.recettesTotalesEur),
      recettesFonctionnementEur: bn(f.recettesFonctionnementEur),
      recettesInvestEur: bn(f.recettesInvestEur),
      depensesTotalesEur: bn(f.depensesTotalesEur),
      depensesFonctionnementEur: bn(f.depensesFonctionnementEur),
      depensesInvestEur: bn(f.depensesInvestEur),
      soldeBudgetaireEur: bn(f.soldeBudgetaireEur),
      budgetTotalEur: bn(f.budgetTotalEur),
      detteEncoursEur: bn(f.detteEncoursEur),
      chargeDetteEur: bn(f.chargeDetteEur),
      amortissementCapitalEur: bn(f.amortissementCapitalEur),
      capaciteAutofinancementEur: bn(f.capaciteAutofinancementEur),
      depensesPersonnelEur: bn(f.depensesPersonnelEur),
      depensesChargesGeneralesEur: bn(f.depensesChargesGeneralesEur),
      depensesSubventionsEur: bn(f.depensesSubventionsEur),
      recettesImpotsLocauxEur: bn(f.recettesImpotsLocauxEur),
      recettesDotationsEtatEur: bn(f.recettesDotationsEtatEur),
      recettesSubventionsEur: bn(f.recettesSubventionsEur),
      recettesServicesEur: bn(f.recettesServicesEur),
      compoRecettesImpotsPct: f.compoRecettesImpotsPct,
      compoRecettesDotationsPct: f.compoRecettesDotationsPct,
      compoRecettesSubvPct: f.compoRecettesSubvPct,
      compoRecettesServicesPct: f.compoRecettesServicesPct,
      compoRecettesAutresPct: f.compoRecettesAutresPct,
      compoDepensesPersonnelPct: f.compoDepensesPersonnelPct,
      compoDepensesGeneralesPct: f.compoDepensesGeneralesPct,
      compoDepensesSubvPct: f.compoDepensesSubvPct,
      compoDepensesFinancieresPct: f.compoDepensesFinancieresPct,
      compoDepensesInvestPct: f.compoDepensesInvestPct,
      source: f.source,
    }));

    return {
      commune: {
        codeInsee: commune.codeInsee,
        nom: commune.nom,
        slug: commune.slug,
        departement: commune.departement,
        departementCode: commune.departementCode,
        region: commune.region,
        population: commune.population,
        classification: commune.classification,
        metropole: commune.metropole,
      },
      finances,
    };
  });

  // --------------------------------------------------------------------------
  // GET /api/communes/rankings?indicator=dette-hab&limit=50
  // Classement national par indicateur.
  // --------------------------------------------------------------------------
  app.get("/api/communes/rankings", async (req, reply) => {
    const indicator = ((req.query as { indicator?: string }).indicator ?? "dette-hab").trim();
    const year = parseInt((req.query as { year?: string }).year ?? "2024", 10);
    const limit = Math.min(
      Math.max(parseInt((req.query as { limit?: string }).limit ?? "50", 10) || 50, 1),
      500,
    );
    const direction = (req.query as { dir?: string }).dir === "asc" ? "asc" : "desc";

    // Récupère les communes avec leur dernière année
    const all = await prisma.commune.findMany({
      include: {
        finances: { where: { annee: year }, take: 1 },
      },
    });

    // Calcule l'indicateur et trie
    const rows = all
      .filter((c) => c.finances.length > 0)
      .map((c) => {
        const f = c.finances[0]!;
        let value: number;
        switch (indicator) {
          case "budget-hab":
            value = bn(f.budgetTotalEur) / c.population;
            break;
          case "dette-hab":
            value = bn(f.detteEncoursEur) / c.population;
            break;
          case "investissement-hab":
            value = bn(f.depensesInvestEur) / c.population;
            break;
          case "personnel-hab":
            value = bn(f.depensesPersonnelEur) / c.population;
            break;
          case "caf-hab":
            value = bn(f.capaciteAutofinancementEur) / c.population;
            break;
          case "capacite-desendettement": {
            const caf = bn(f.capaciteAutofinancementEur);
            value = caf <= 0 ? 999 : bn(f.detteEncoursEur) / caf;
            break;
          }
          case "taux-epargne-brute": {
            const r = bn(f.recettesTotalesEur);
            value = r <= 0 ? 0 : (bn(f.capaciteAutofinancementEur) / r) * 100;
            break;
          }
          default:
            value = 0;
        }
        return {
          codeInsee: c.codeInsee,
          slug: c.slug,
          nom: c.nom,
          departement: c.departement,
          population: c.population,
          value: Math.round(value * 100) / 100,
        };
      })
      .sort((a, b) => (direction === "asc" ? a.value - b.value : b.value - a.value))
      .slice(0, limit);

    return { indicator, year, direction, results: rows };
  });

  // --------------------------------------------------------------------------
  // GET /api/communes/stats
  // Stats globales : nombre de communes en base, dernière année, etc.
  // --------------------------------------------------------------------------
  app.get("/api/communes/stats", async () => {
    const [total, withFinances, lastYearFinances] = await Promise.all([
      prisma.commune.count(),
      prisma.commune.count({ where: { finances: { some: {} } } }),
      prisma.communeFinanciere.aggregate({
        _max: { annee: true },
      }),
    ]);
    return {
      totalCommunes: total,
      communesAvecFinances: withFinances,
      derniereAnnee: lastYearFinances._max.annee,
    };
  });
}
