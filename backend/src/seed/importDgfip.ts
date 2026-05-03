// ============================================================================
// importDgfip.ts — pipeline d'import des comptes individuels DGFiP
// ============================================================================
//
// Télécharge le CSV "Comptes individuels des collectivités" depuis le portail
// open data du ministère de l'Économie (OFGL) et upsert ~35 000 communes
// françaises dans la table CommuneFinanciere.
//
// Source officielle :
//   https://www.data.economie.gouv.fr/explore/dataset/comptes-individuels-des-collectivites/
//
// API d'export CSV (OpenDataSoft) :
//   https://www.data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/
//     comptes-individuels-des-collectivites/exports/csv
//   ?refine=categorie:Commune&refine=exer:<année>
//
// Usage :
//   docker compose exec backend npx tsx src/seed/importDgfip.ts <année>
//   ex: docker compose exec backend npx tsx src/seed/importDgfip.ts 2023
//
// Ou via l'endpoint admin :
//   POST /api/admin/run/import-dgfip {"annee": 2023}
//
// Le script est idempotent : on peut le re-lancer à volonté, il fait des
// UPSERT donc les données existantes sont juste mises à jour.
//
// ⚠ Performance : ~30 min pour parser et insérer 35 000 lignes.
// La fonction est exposée comme runDgfipImport() pour être appelée depuis
// l'API admin sans bloquer le serveur (lance-la dans un worker / setTimeout).
// ============================================================================

import { prisma } from "../lib/db.ts";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const API_BASE = "https://www.data.economie.gouv.fr/api/explore/v2.1/catalog/datasets";
const DATASET_ID = "comptes-individuels-des-collectivites";

// Année par défaut : la plus récente publiée typiquement N-2 (publication juin N+1)
const DEFAULT_YEAR = 2023;

// Chemin de cache du CSV téléchargé
const CACHE_PATH = "/tmp/dgfip-comptes.csv";

// Taille des batches d'UPSERT pour ne pas saturer Postgres
const BATCH_SIZE = 100;

// ----------------------------------------------------------------------------
// Mapping département → région (96 départements métropole + 5 DROM)
// ----------------------------------------------------------------------------

const DEPT_TO_REGION: Record<string, string> = {
  "01": "Auvergne-Rhône-Alpes", "03": "Auvergne-Rhône-Alpes", "07": "Auvergne-Rhône-Alpes",
  "15": "Auvergne-Rhône-Alpes", "26": "Auvergne-Rhône-Alpes", "38": "Auvergne-Rhône-Alpes",
  "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "63": "Auvergne-Rhône-Alpes",
  "69": "Auvergne-Rhône-Alpes", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
  "21": "Bourgogne-Franche-Comté", "25": "Bourgogne-Franche-Comté", "39": "Bourgogne-Franche-Comté",
  "58": "Bourgogne-Franche-Comté", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté",
  "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
  "22": "Bretagne", "29": "Bretagne", "35": "Bretagne", "56": "Bretagne",
  "18": "Centre-Val de Loire", "28": "Centre-Val de Loire", "36": "Centre-Val de Loire",
  "37": "Centre-Val de Loire", "41": "Centre-Val de Loire", "45": "Centre-Val de Loire",
  "20": "Corse", "2A": "Corse", "2B": "Corse",
  "08": "Grand Est", "10": "Grand Est", "51": "Grand Est", "52": "Grand Est",
  "54": "Grand Est", "55": "Grand Est", "57": "Grand Est", "67": "Grand Est",
  "68": "Grand Est", "88": "Grand Est",
  "02": "Hauts-de-France", "59": "Hauts-de-France", "60": "Hauts-de-France",
  "62": "Hauts-de-France", "80": "Hauts-de-France",
  "75": "Île-de-France", "77": "Île-de-France", "78": "Île-de-France", "91": "Île-de-France",
  "92": "Île-de-France", "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France",
  "14": "Normandie", "27": "Normandie", "50": "Normandie", "61": "Normandie", "76": "Normandie",
  "16": "Nouvelle-Aquitaine", "17": "Nouvelle-Aquitaine", "19": "Nouvelle-Aquitaine",
  "23": "Nouvelle-Aquitaine", "24": "Nouvelle-Aquitaine", "33": "Nouvelle-Aquitaine",
  "40": "Nouvelle-Aquitaine", "47": "Nouvelle-Aquitaine", "64": "Nouvelle-Aquitaine",
  "79": "Nouvelle-Aquitaine", "86": "Nouvelle-Aquitaine", "87": "Nouvelle-Aquitaine",
  "09": "Occitanie", "11": "Occitanie", "12": "Occitanie", "30": "Occitanie",
  "31": "Occitanie", "32": "Occitanie", "34": "Occitanie", "46": "Occitanie",
  "48": "Occitanie", "65": "Occitanie", "66": "Occitanie", "81": "Occitanie", "82": "Occitanie",
  "44": "Pays de la Loire", "49": "Pays de la Loire", "53": "Pays de la Loire",
  "72": "Pays de la Loire", "85": "Pays de la Loire",
  "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur",
  "06": "Provence-Alpes-Côte d'Azur", "13": "Provence-Alpes-Côte d'Azur",
  "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur",
  // DROM (Départements et Régions d'Outre-Mer)
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
  "974": "La Réunion", "976": "Mayotte",
};

const METROPOLES_STATUTAIRES: Record<string, string> = {
  "75056": "Métropole du Grand Paris",
  "13055": "Métropole d'Aix-Marseille-Provence",
  "69123": "Métropole de Lyon",
  "31555": "Métropole de Toulouse",
  "59350": "Métropole Européenne de Lille",
  "33063": "Métropole de Bordeaux",
  "06088": "Métropole Nice Côte d'Azur",
  "44109": "Nantes Métropole",
  "67482": "Eurométropole de Strasbourg",
  "34172": "Montpellier Méditerranée Métropole",
  "35238": "Rennes Métropole",
  "76540": "Métropole Rouen Normandie",
  "38185": "Grenoble-Alpes Métropole",
  "83137": "Métropole Toulon-Provence-Méditerranée",
  "29019": "Brest Métropole",
  "63113": "Clermont Auvergne Métropole",
  "21231": "Dijon Métropole",
  "42218": "Saint-Étienne Métropole",
  "37261": "Tours Métropole Val de Loire",
  "45234": "Orléans Métropole",
  "57463": "Metz Métropole",
  "54395": "Métropole du Grand Nancy",
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function classifyVille(population: number): string {
  if (population < 500) return "Très petite commune";
  if (population < 2_000) return "Petite commune";
  if (population < 10_000) return "Commune moyenne";
  if (population < 20_000) return "Grande commune";
  if (population < 50_000) return "Très grande commune";
  if (population < 100_000) return "Petite ville";
  if (population < 200_000) return "Grande ville";
  if (population < 500_000) return "Très grande ville";
  return "Métropole démographique";
}

function parseEur(s: string | undefined): number {
  if (!s) return 0;
  const normalized = s.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function pct(numerator: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((numerator / total) * 100).toFixed(2));
}

// Parse une ligne CSV en respectant les guillemets (RFC 4180 simplifié)
function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === sep && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// Détecte le séparateur (DGFiP / OpenDataSoft : souvent ; mais parfois ,)
function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

// ----------------------------------------------------------------------------
// Téléchargement du CSV
// ----------------------------------------------------------------------------

async function downloadCsv(year: number): Promise<string> {
  // Si un cache existe déjà et que --force n'est pas passé, on l'utilise
  if (existsSync(CACHE_PATH) && !process.argv.includes("--force")) {
    console.log(`[dgfip] cache trouvé : ${CACHE_PATH} (utiliser --force pour re-télécharger)`);
    return CACHE_PATH;
  }

  // L'API OpenDataSoft permet d'exporter en CSV avec filtre.
  // Le filtre exact de catégorie peut varier — on essaie plusieurs noms.
  const candidates = [
    `${API_BASE}/${DATASET_ID}/exports/csv?refine=categorie%3ACommune&refine=exer%3A${year}`,
    `${API_BASE}/${DATASET_ID}/exports/csv?refine=agregat%3ACommune&refine=exer%3A${year}`,
    `${API_BASE}/${DATASET_ID}/exports/csv?refine=cat%3ASCOM&refine=exer%3A${year}`,
    // Sans filtre (gros fichier ~500 Mo, dernier recours) :
    `${API_BASE}/${DATASET_ID}/exports/csv?refine=exer%3A${year}`,
  ];

  for (const url of candidates) {
    console.log(`[dgfip] tentative téléchargement : ${url}`);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "BudgetFrance/1.0 (https://budgetfrance.org)" },
      });
      if (!res.ok) {
        console.warn(`[dgfip]   → HTTP ${res.status}, essai suivant…`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) {
        console.warn(`[dgfip]   → fichier suspect (${buf.length} octets), essai suivant…`);
        continue;
      }
      await writeFile(CACHE_PATH, buf);
      console.log(`[dgfip] OK : ${(buf.length / 1e6).toFixed(1)} Mo → ${CACHE_PATH}`);
      return CACHE_PATH;
    } catch (e) {
      console.warn(`[dgfip]   → erreur : ${(e as Error).message}`);
    }
  }
  throw new Error(`[dgfip] échec : aucune URL ne fonctionne pour l'année ${year}.`);
}

// ----------------------------------------------------------------------------
// Parsing + import
// ----------------------------------------------------------------------------

interface ParsedRow {
  insee: string;
  nom: string;
  departement: string;
  population: number;
  recettesFct: number;
  depensesFct: number;
  recettesInvest: number;
  depensesInvest: number;
  personnel: number;
  chargesGen: number;
  subvVersees: number;
  charFin: number;
  amortCapital: number;
  dotationsEtat: number;
  impotsLocaux: number;
  dette: number;
  caf: number;
  annee: number;
}

/**
 * Mappe une ligne CSV (objet clé/valeur) vers notre structure ParsedRow.
 * Tolérant aux changements de noms de colonnes entre millésimes DGFiP.
 */
function mapRow(row: Record<string, string>, fallbackYear: number): ParsedRow | null {
  // Helper pour chercher une valeur parmi plusieurs noms de colonnes possibles
  const v = (...keys: string[]): string => {
    for (const k of keys) {
      const lower = k.toLowerCase();
      if (row[k] !== undefined) return row[k];
      if (row[lower] !== undefined) return row[lower];
    }
    return "";
  };

  const insee = v("insee", "com", "code_insee", "codgeo").padStart(5, "0");
  if (!insee || insee.length !== 5) return null;

  const nom = v("lbudg", "lib_com", "nom_com", "lib_collectivite", "libellecourt") || `Commune ${insee}`;
  const dep = v("dep", "code_dep", "codedep").padStart(2, "0").slice(0, 3);
  const annee = parseInt(v("exer", "an", "annee", "year"), 10) || fallbackYear;
  const population = parseEur(v("pop1", "popdgf", "pop_dgf", "pop", "population"));
  const recettesFct = parseEur(v("rrf", "rrf1", "recettes_reelles_fonctionnement"));
  const depensesFct = parseEur(v("drf", "drf1", "depenses_reelles_fonctionnement"));
  const recettesInvest = parseEur(v("rri", "rri1", "recettes_reelles_investissement"));
  const depensesInvest = parseEur(v("dri", "dri1", "depenses_reelles_investissement"));
  const personnel = parseEur(v("pers", "fper", "fpers", "charges_personnel"));
  const chargesGen = parseEur(v("fcg", "charges_generales"));
  const subvVersees = parseEur(v("fsubv", "subv_versees"));
  const charFin = parseEur(v("ifin", "char_fin", "interets_dette"));
  const amortCapital = parseEur(v("ramo", "amor", "rembours_capital"));
  const dotationsEtat = parseEur(v("dgff", "fdgf", "dotation_globale")) + parseEur(v("fdfa", "autres_dotations"));
  const impotsLocaux = parseEur(v("ftloc", "impots_locaux", "fiscalite_locale"));
  const dette = parseEur(v("enc", "encours_dette"));
  const caf = parseEur(v("caf", "cafg", "capacite_autofinancement"));

  return {
    insee,
    nom,
    departement: `${nom.split("(")[0]?.trim() ?? nom} (${dep})`,
    population: Math.round(population),
    recettesFct,
    depensesFct,
    recettesInvest,
    depensesInvest,
    personnel,
    chargesGen,
    subvVersees,
    charFin,
    amortCapital: amortCapital || dette / 15, // fallback : 1/15 si non fourni
    dotationsEtat,
    impotsLocaux,
    dette,
    caf,
    annee,
  };
}

/**
 * Parse le CSV complet en chunks (plus rapide que ligne-par-ligne).
 */
function parseCsv(content: string, fallbackYear: number): ParsedRow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = detectSeparator(lines[0]!);
  const headers = parseCsvLine(lines[0]!, sep).map((h) =>
    h.trim().toLowerCase().replace(/^"|"$/g, ""),
  );

  const out: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const cols = parseCsvLine(line, sep);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim().replace(/^"|"$/g, "");
    });
    const parsed = mapRow(row, fallbackYear);
    if (parsed) out.push(parsed);
  }
  return out;
}

// ----------------------------------------------------------------------------
// Insert dans Postgres
// ----------------------------------------------------------------------------

async function upsertCommune(r: ParsedRow): Promise<void> {
  const region = DEPT_TO_REGION[r.departement.match(/\((\d{2,3}[AB]?)\)/)?.[1] ?? ""] ?? "Autre";
  const departementCode = r.departement.match(/\((\d{2,3}[AB]?)\)/)?.[1] ?? "00";

  const recettesTot = r.recettesFct + r.recettesInvest;
  const depensesTot = r.depensesFct + r.depensesInvest;
  const budget = Math.max(recettesTot, depensesTot);
  const solde = recettesTot - depensesTot;
  const subventions = Math.max(0, recettesTot - r.impotsLocaux - r.dotationsEtat);

  await prisma.commune.upsert({
    where: { codeInsee: r.insee },
    create: {
      codeInsee: r.insee,
      nom: r.nom,
      slug: slugify(r.nom),
      departement: r.departement,
      departementCode,
      region,
      population: r.population,
      classification: classifyVille(r.population),
      metropole: METROPOLES_STATUTAIRES[r.insee] ?? null,
    },
    update: {
      nom: r.nom,
      slug: slugify(r.nom),
      departement: r.departement,
      departementCode,
      region,
      population: r.population,
      classification: classifyVille(r.population),
      metropole: METROPOLES_STATUTAIRES[r.insee] ?? null,
    },
  });

  await prisma.communeFinanciere.upsert({
    where: { codeInsee_annee: { codeInsee: r.insee, annee: r.annee } },
    create: {
      codeInsee: r.insee,
      annee: r.annee,
      recettesTotalesEur: BigInt(Math.round(recettesTot)),
      recettesFonctionnementEur: BigInt(Math.round(r.recettesFct)),
      recettesInvestEur: BigInt(Math.round(r.recettesInvest)),
      depensesTotalesEur: BigInt(Math.round(depensesTot)),
      depensesFonctionnementEur: BigInt(Math.round(r.depensesFct)),
      depensesInvestEur: BigInt(Math.round(r.depensesInvest)),
      soldeBudgetaireEur: BigInt(Math.round(solde)),
      budgetTotalEur: BigInt(Math.round(budget)),
      detteEncoursEur: BigInt(Math.round(r.dette)),
      chargeDetteEur: BigInt(Math.round(r.charFin)),
      amortissementCapitalEur: BigInt(Math.round(r.amortCapital)),
      capaciteAutofinancementEur: BigInt(Math.round(r.caf)),
      depensesPersonnelEur: BigInt(Math.round(r.personnel)),
      depensesChargesGeneralesEur: BigInt(Math.round(r.chargesGen)),
      depensesSubventionsEur: BigInt(Math.round(r.subvVersees)),
      recettesImpotsLocauxEur: BigInt(Math.round(r.impotsLocaux)),
      recettesDotationsEtatEur: BigInt(Math.round(r.dotationsEtat)),
      recettesSubventionsEur: BigInt(Math.round(subventions)),
      recettesServicesEur: BigInt(0),
      compoRecettesImpotsPct: pct(r.impotsLocaux, recettesTot),
      compoRecettesDotationsPct: pct(r.dotationsEtat, recettesTot),
      compoRecettesSubvPct: pct(subventions, recettesTot),
      compoRecettesServicesPct: 0,
      compoRecettesAutresPct: Math.max(0, 100 - pct(r.impotsLocaux + r.dotationsEtat + subventions, recettesTot)),
      compoDepensesPersonnelPct: pct(r.personnel, depensesTot),
      compoDepensesGeneralesPct: pct(r.chargesGen, depensesTot),
      compoDepensesSubvPct: pct(r.subvVersees, depensesTot),
      compoDepensesFinancieresPct: pct(r.charFin, depensesTot),
      compoDepensesInvestPct: pct(r.depensesInvest, depensesTot),
      source: `DGFiP comptes individuels ${r.annee}`,
    },
    update: {
      // Mêmes champs que create (UPSERT idempotent)
      recettesTotalesEur: BigInt(Math.round(recettesTot)),
      recettesFonctionnementEur: BigInt(Math.round(r.recettesFct)),
      recettesInvestEur: BigInt(Math.round(r.recettesInvest)),
      depensesTotalesEur: BigInt(Math.round(depensesTot)),
      depensesFonctionnementEur: BigInt(Math.round(r.depensesFct)),
      depensesInvestEur: BigInt(Math.round(r.depensesInvest)),
      soldeBudgetaireEur: BigInt(Math.round(solde)),
      budgetTotalEur: BigInt(Math.round(budget)),
      detteEncoursEur: BigInt(Math.round(r.dette)),
      chargeDetteEur: BigInt(Math.round(r.charFin)),
      amortissementCapitalEur: BigInt(Math.round(r.amortCapital)),
      capaciteAutofinancementEur: BigInt(Math.round(r.caf)),
      depensesPersonnelEur: BigInt(Math.round(r.personnel)),
      depensesChargesGeneralesEur: BigInt(Math.round(r.chargesGen)),
      depensesSubventionsEur: BigInt(Math.round(r.subvVersees)),
      recettesImpotsLocauxEur: BigInt(Math.round(r.impotsLocaux)),
      recettesDotationsEtatEur: BigInt(Math.round(r.dotationsEtat)),
      recettesSubventionsEur: BigInt(Math.round(subventions)),
      recettesServicesEur: BigInt(0),
      compoRecettesImpotsPct: pct(r.impotsLocaux, recettesTot),
      compoRecettesDotationsPct: pct(r.dotationsEtat, recettesTot),
      compoRecettesSubvPct: pct(subventions, recettesTot),
      compoRecettesServicesPct: 0,
      compoRecettesAutresPct: Math.max(0, 100 - pct(r.impotsLocaux + r.dotationsEtat + subventions, recettesTot)),
      compoDepensesPersonnelPct: pct(r.personnel, depensesTot),
      compoDepensesGeneralesPct: pct(r.chargesGen, depensesTot),
      compoDepensesSubvPct: pct(r.subvVersees, depensesTot),
      compoDepensesFinancieresPct: pct(r.charFin, depensesTot),
      compoDepensesInvestPct: pct(r.depensesInvest, depensesTot),
      source: `DGFiP comptes individuels ${r.annee}`,
    },
  });
}

// ----------------------------------------------------------------------------
// Point d'entrée
// ----------------------------------------------------------------------------

export async function runDgfipImport(year: number = DEFAULT_YEAR): Promise<{
  totalRows: number;
  inserted: number;
  errors: number;
  durationSec: number;
}> {
  const start = Date.now();
  console.log(`[dgfip] début de l'import pour l'année ${year}…`);

  // 1. Télécharger
  const csvPath = await downloadCsv(year);
  const csvContent = await readFile(csvPath, "utf-8");

  // 2. Parser
  console.log("[dgfip] parsing du CSV…");
  const rows = parseCsv(csvContent, year);
  console.log(`[dgfip] ${rows.length} lignes valides après parsing.`);

  // 3. Upsert par batches
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((r) => upsertCommune(r)));
    inserted += results.filter((r) => r.status === "fulfilled").length;
    errors += results.filter((r) => r.status === "rejected").length;

    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= rows.length) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`[dgfip] ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} (${elapsed}s)`);
    }
  }

  const durationSec = (Date.now() - start) / 1000;
  console.log(`[dgfip] terminé : ${inserted} insérées, ${errors} erreurs en ${durationSec.toFixed(0)}s`);
  return { totalRows: rows.length, inserted, errors, durationSec };
}

// CLI : si lancé directement
const isCli =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("importDgfip.ts") ||
  process.argv[1]?.endsWith("importDgfip.js");

if (isCli) {
  const yearArg = process.argv.find((a) => /^\d{4}$/.test(a));
  const year = yearArg ? parseInt(yearArg, 10) : DEFAULT_YEAR;
  runDgfipImport(year)
    .then((res) => {
      console.log(`[dgfip] OK : ${res.inserted}/${res.totalRows} lignes en ${res.durationSec.toFixed(0)}s`);
      process.exit(0);
    })
    .catch((e) => {
      console.error("[dgfip] FATAL :", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
