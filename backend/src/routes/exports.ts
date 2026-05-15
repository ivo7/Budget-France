// ============================================================================
// routes/exports.ts — exports bulk des données communes (CSV, JSON, Excel)
// ============================================================================
//
// Endpoints :
//   GET /api/exports/communes.csv    → CSV (streaming, ~6-8 Mo pour 35K communes)
//   GET /api/exports/communes.json   → JSON dump complet (~15 Mo)
//   GET /api/exports/communes.xlsx   → Excel formaté (~10 Mo)
//
// Filtres optionnels :
//   ?year=2024  → filtre par année (par défaut : dernière disponible)
//   ?dep=69     → filtre par code département
//
// Tous les exports incluent :
//   - Référentiel commune (INSEE, nom, slug, département, région, population, classification)
//   - Finances : recettes, dépenses, dette, CAF, etc. pour l'année demandée
//   - Composition % (recettes et dépenses)
//
// Rate-limit : 5 téléchargements / heure / IP (anti-abus, ces exports sont lourds).
// Pour usage massif : contact@budgetfrance.org pour une clé API dédiée.
//
// Licence : Licence Ouverte 2.0 Etalab — réutilisation libre avec citation.
// ============================================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHash } from "node:crypto";
import { prisma } from "../lib/db.ts";

// Bigint → Number safe
function bn(b: bigint): number {
  return Number(b);
}

// CSV escape : si la cellule contient une virgule, des guillemets ou une nouvelle ligne,
// on entoure de guillemets et on double les guillemets internes (RFC 4180).
function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const COLUMNS = [
  "codeInsee",
  "nom",
  "slug",
  "departement",
  "departementCode",
  "region",
  "population",
  "classification",
  "metropole",
  "annee",
  "recettesTotalesEur",
  "recettesFonctionnementEur",
  "recettesInvestEur",
  "depensesTotalesEur",
  "depensesFonctionnementEur",
  "depensesInvestEur",
  "soldeBudgetaireEur",
  "budgetTotalEur",
  "detteEncoursEur",
  "chargeDetteEur",
  "amortissementCapitalEur",
  "capaciteAutofinancementEur",
  "depensesPersonnelEur",
  "depensesChargesGeneralesEur",
  "depensesSubventionsEur",
  "recettesImpotsLocauxEur",
  "recettesDotationsEtatEur",
  "recettesSubventionsEur",
  "recettesServicesEur",
  "compoRecettesImpotsPct",
  "compoRecettesDotationsPct",
  "compoRecettesSubvPct",
  "compoRecettesServicesPct",
  "compoRecettesAutresPct",
  "compoDepensesPersonnelPct",
  "compoDepensesGeneralesPct",
  "compoDepensesSubvPct",
  "compoDepensesFinancieresPct",
  "compoDepensesInvestPct",
  "source",
] as const;

interface Row {
  [k: string]: string | number | null;
}

// ----------------------------------------------------------------------------
// Rate limit anti-abus (5 exports / heure / IP)
// ----------------------------------------------------------------------------

const exportRateLimit = new Map<string, number[]>();
const HOUR_MS = 60 * 60 * 1000;
const EXPORTS_PER_HOUR = 5;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function checkRateLimit(ipHash: string): { allowed: boolean; resetInMs: number } {
  const now = Date.now();
  const cutoff = now - HOUR_MS;
  const history = (exportRateLimit.get(ipHash) ?? []).filter((t) => t > cutoff);
  exportRateLimit.set(ipHash, history);
  if (history.length >= EXPORTS_PER_HOUR) {
    const oldest = Math.min(...history);
    return { allowed: false, resetInMs: oldest + HOUR_MS - now };
  }
  history.push(now);
  return { allowed: true, resetInMs: HOUR_MS };
}

setInterval(
  () => {
    const cutoff = Date.now() - HOUR_MS;
    for (const [k, v] of exportRateLimit.entries()) {
      const f = v.filter((t) => t > cutoff);
      if (f.length === 0) exportRateLimit.delete(k);
      else exportRateLimit.set(k, f);
    }
  },
  60 * 60 * 1000,
);

// ----------------------------------------------------------------------------
// Récupération des données depuis la DB (avec filtre année + département)
// ----------------------------------------------------------------------------

async function fetchData(
  year: number | null,
  depCode: string | null,
): Promise<{ rows: Row[]; usedYear: number | null }> {
  // Si année non précisée, prendre la dernière disponible
  let effectiveYear: number | null = year;
  if (!effectiveYear) {
    const max = await prisma.communeFinanciere.aggregate({ _max: { annee: true } });
    effectiveYear = max._max.annee ?? null;
  }

  const communes = await prisma.commune.findMany({
    where: depCode ? { departementCode: depCode } : undefined,
    include: {
      finances: effectiveYear
        ? { where: { annee: effectiveYear }, take: 1 }
        : { orderBy: { annee: "desc" }, take: 1 },
    },
    orderBy: [{ population: "desc" }, { nom: "asc" }],
  });

  const rows: Row[] = communes
    .filter((c) => c.finances.length > 0)
    .map((c) => {
      const f = c.finances[0]!;
      return {
        codeInsee: c.codeInsee,
        nom: c.nom,
        slug: c.slug,
        departement: c.departement,
        departementCode: c.departementCode,
        region: c.region,
        population: c.population,
        classification: c.classification,
        metropole: c.metropole ?? "",
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
      };
    });

  return { rows, usedYear: effectiveYear };
}

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

interface ExportQuery {
  year?: string;
  dep?: string;
}

function rateLimitGuard(req: FastifyRequest, reply: FastifyReply): boolean {
  const ipRaw =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    "unknown";
  const ipHash = hashIp(ipRaw);
  const rl = checkRateLimit(ipHash);
  if (!rl.allowed) {
    reply.code(429).send({
      error: "rate_limited",
      message: `Limite de ${EXPORTS_PER_HOUR} exports/heure atteinte. Réessaye dans ${Math.ceil(rl.resetInMs / 60000)} minutes. Pour un usage massif : contact@budgetfrance.org.`,
    });
    return false;
  }
  return true;
}

function parseFilters(query: ExportQuery): { year: number | null; dep: string | null } {
  const year = query.year ? parseInt(query.year, 10) : null;
  const dep = query.dep?.trim() ?? null;
  return {
    year: year && Number.isFinite(year) ? year : null,
    dep: dep && /^\d{1,3}[AB]?$/i.test(dep) ? dep : null,
  };
}

function filenameWithFilters(base: string, year: number | null, dep: string | null) {
  const parts: string[] = [base];
  if (year) parts.push(String(year));
  if (dep) parts.push(`dep${dep}`);
  return parts.join("-");
}

export function registerExportsRoutes(app: FastifyInstance) {
  // ──────────────────── CSV (streaming) ────────────────────
  app.get("/api/exports/communes.csv", async (req, reply) => {
    if (!rateLimitGuard(req, reply)) return;

    const { year, dep } = parseFilters(req.query as ExportQuery);
    const { rows, usedYear } = await fetchData(year, dep);

    const filename = `${filenameWithFilters("communes", usedYear, dep)}.csv`;
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);

    // En-tête + BOM UTF-8 pour Excel
    const header = "\uFEFF" + COLUMNS.join(",") + "\n";
    const body = rows
      .map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))
      .join("\n");

    return header + body + "\n";
  });

  // ──────────────────── JSON dump ────────────────────
  app.get("/api/exports/communes.json", async (req, reply) => {
    if (!rateLimitGuard(req, reply)) return;

    const { year, dep } = parseFilters(req.query as ExportQuery);
    const { rows, usedYear } = await fetchData(year, dep);

    const filename = `${filenameWithFilters("communes", usedYear, dep)}.json`;
    reply.header("Content-Type", "application/json; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);

    return {
      generatedAt: new Date().toISOString(),
      year: usedYear,
      departementFilter: dep,
      total: rows.length,
      licence: "Licence Ouverte 2.0 Etalab",
      source: "Budget France — d'après OFGL/DGFiP",
      apiVersion: "1.0",
      data: rows,
    };
  });

  // ──────────────────── Excel (.xlsx) ────────────────────
  app.get("/api/exports/communes.xlsx", async (req, reply) => {
    if (!rateLimitGuard(req, reply)) return;

    const { year, dep } = parseFilters(req.query as ExportQuery);
    const { rows, usedYear } = await fetchData(year, dep);

    // Import dynamique pour éviter le coût de chargement si exceljs n'est pas dispo
    let ExcelJS: typeof import("exceljs");
    try {
      ExcelJS = await import("exceljs");
    } catch {
      return reply.code(503).send({
        error: "excel_unavailable",
        message:
          "Le module Excel n'est pas installé sur ce serveur. Utiliser /api/exports/communes.csv (ouvrable dans Excel) ou /api/exports/communes.json.",
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Budget France";
    workbook.created = new Date();
    workbook.title = `Communes France ${usedYear ?? ""}`;

    const sheet = workbook.addWorksheet(`Communes ${usedYear ?? ""}`);

    // En-têtes formatés
    sheet.columns = COLUMNS.map((col) => ({
      header: col,
      key: col,
      width: Math.max(12, Math.min(35, col.length + 2)),
    }));

    // Rangée header en gras + couleur
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0055A4" }, // bleu Budget France
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 22;

    // Données
    for (const r of rows) {
      sheet.addRow(r);
    }

    // Freeze 1ère ligne
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Filtres auto
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNS.length },
    };

    const filename = `${filenameWithFilters("communes", usedYear, dep)}.xlsx`;
    reply.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  });

  // ──────────────────── Statistiques exports ────────────────────
  app.get("/api/exports/stats", async () => {
    const totalCommunes = await prisma.commune.count();
    const max = await prisma.communeFinanciere.aggregate({
      _max: { annee: true },
      _count: { id: true },
    });
    return {
      totalCommunes,
      totalRows: max._count.id,
      derniereAnnee: max._max.annee,
      rateLimit: `${EXPORTS_PER_HOUR} exports/heure/IP`,
      formats: ["csv", "json", "xlsx"],
      tailleEstimee: {
        csv: "~6-8 Mo",
        json: "~15 Mo",
        xlsx: "~10 Mo",
      },
      licence: "Licence Ouverte 2.0 Etalab",
    };
  });
}
