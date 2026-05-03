// ============================================================================
// importDgfip.ts — pipeline d'import des comptes individuels des communes
// ============================================================================
//
// Source réelle : OFGL (Observatoire des Finances et de la Gestion publique
// Locales — organisme officiel rattaché au CFL/DGCL).
// La donnée est strictement la même que les comptes individuels DGFiP, mais
// déjà nettoyée, structurée et exposée via une API ouverte propre.
//
// Pourquoi pas data.economie.gouv.fr ?
// → Le dataset y est vide ("has_records":false, "fields":[]) — il ne contient
//   plus qu'un fichier "Lien.xlsx" qui pointe ailleurs. La donnée a été
//   migrée vers OFGL.
//
// API d'export CSV (OpenDataSoft) :
//   https://data.ofgl.fr/api/explore/v2.1/catalog/datasets/
//     ofgl-base-communes-consolidee/exports/csv
//   ?refine=categ:Commune&refine=exer:<année>
//
// Format : 1 ligne = 1 commune × 1 année × 1 agrégat.
// On reçoit ~1.7 millions de lignes pour une année (35 062 communes ×
// ~50 agrégats). On pivote long→wide en mémoire avant l'UPSERT.
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
// ⚠ Performance : ~10-20 min pour télécharger (~200 Mo) + parser + insérer
// 35 000 communes. La fonction est exposée comme runDgfipImport() pour être
// appelée depuis l'API admin sans bloquer le serveur (setImmediate).
// ============================================================================

import { prisma } from "../lib/db.ts";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const API_BASE = "https://data.ofgl.fr/api/explore/v2.1/catalog/datasets";
const DATASET_ID = "ofgl-base-communes-consolidee";

// Année par défaut : la plus récente disponible (couverture OFGL : 2017-2024).
const DEFAULT_YEAR = 2023;

// Chemin de cache du CSV téléchargé
const CACHE_PATH = "/tmp/ofgl-comptes.csv";

// Taille des batches d'UPSERT pour ne pas saturer Postgres
const BATCH_SIZE = 100;

// ----------------------------------------------------------------------------
// Mapping département → région (96 départements métropole + 5 DROM)
// Conservé en fallback si OFGL ne renvoie pas reg_name.
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
  // DROM
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
// Mapping des agrégats OFGL → notre structure interne (long → wide)
// ----------------------------------------------------------------------------
//
// Les agrégats sont en français (libellés OFGL). Pour chacun, on retient un
// nom court de propriété qui sera ensuite mappé aux champs du schema Prisma.

type AgregatField =
  | "recettesTotales"
  | "recettesFonctionnement"
  | "recettesInvestissement"
  | "depensesTotales"
  | "depensesFonctionnement"
  | "depensesInvestissement"
  | "depensesEquipement"
  | "fraisPersonnel"
  | "achatsChargesExternes"
  | "subventionsVersees"
  | "chargesFinancieres"        // intérêts seuls
  | "encoursDette"              // stock
  | "annuiteDette"              // service total = intérêts + capital
  | "remboursementCapital"      // capital seul
  | "epargneBrute"              // CAF
  | "epargneNette"
  | "capaciteFinancement"
  | "impotsLocaux"
  | "impotsTaxes"
  | "dgf"
  | "fctva"
  | "concoursEtat"
  | "subventionsRecues"
  | "fiscaliteReversee";

const AGREGAT_FIELD: Record<string, AgregatField> = {
  "Recettes totales": "recettesTotales",
  "Recettes de fonctionnement": "recettesFonctionnement",
  "Recettes d'investissement": "recettesInvestissement",
  "Dépenses totales": "depensesTotales",
  "Dépenses de fonctionnement": "depensesFonctionnement",
  "Dépenses d'investissement": "depensesInvestissement",
  "Dépenses d'équipement": "depensesEquipement",
  "Frais de personnel": "fraisPersonnel",
  "Achats et charges externes": "achatsChargesExternes",
  "Subventions d'équipement versées": "subventionsVersees",
  "Charges financières": "chargesFinancieres",
  "Encours de dette": "encoursDette",
  "Annuité de la dette": "annuiteDette",
  "Remboursements d'emprunts hors GAD": "remboursementCapital",
  "Epargne brute": "epargneBrute",
  "Epargne nette": "epargneNette",
  "Capacité ou besoin de financement": "capaciteFinancement",
  "Impôts locaux": "impotsLocaux",
  "Impôts et taxes": "impotsTaxes",
  "Dotation globale de fonctionnement": "dgf",
  "FCTVA": "fctva",
  "Concours de l'Etat": "concoursEtat",
  "Subventions reçues et participations": "subventionsRecues",
  "Fiscalité reversée": "fiscaliteReversee",
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
  const normalized = s.replace(/\s/g, "").replace(",", ".").replace(/[^\d.eE+-]/g, "");
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

function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

// ----------------------------------------------------------------------------
// Téléchargement du CSV depuis OFGL
// ----------------------------------------------------------------------------

async function downloadCsv(year: number): Promise<string> {
  if (existsSync(CACHE_PATH) && !process.argv.includes("--force")) {
    console.log(`[ofgl] cache trouvé : ${CACHE_PATH} (utiliser --force pour re-télécharger)`);
    return CACHE_PATH;
  }

  // OFGL : on filtre sur categ=Commune ET exer=<year> pour ramener ~1.7M lignes
  // (35 062 communes × ~50 agrégats) au lieu de 13M+ tous millésimes confondus.
  const url = `${API_BASE}/${DATASET_ID}/exports/csv?refine=categ%3ACommune&refine=exer%3A${year}`;

  console.log(`[ofgl] téléchargement : ${url}`);
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: { "User-Agent": "BudgetFrance/1.0 (https://budgetfrance.org)" },
  });
  if (!res.ok) {
    throw new Error(`[ofgl] HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) {
    // Probablement un message d'erreur JSON
    const head = buf.subarray(0, 500).toString("utf-8");
    throw new Error(`[ofgl] fichier suspect (${buf.length} octets) :\n${head}`);
  }
  await writeFile(CACHE_PATH, buf);
  const sec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`[ofgl] OK : ${(buf.length / 1e6).toFixed(1)} Mo en ${sec}s → ${CACHE_PATH}`);
  return CACHE_PATH;
}

// ----------------------------------------------------------------------------
// Parsing + pivot long→wide
// ----------------------------------------------------------------------------

interface PivotedCommune {
  insee: string;
  nom: string;
  depCode: string;
  depName: string;
  regName: string;
  epciName: string | null;
  population: number;
  trancheOfgl: string;
  annee: number;
  recettesTotales: number;
  recettesFonctionnement: number;
  recettesInvestissement: number;
  depensesTotales: number;
  depensesFonctionnement: number;
  depensesInvestissement: number;
  depensesEquipement: number;
  fraisPersonnel: number;
  achatsChargesExternes: number;
  subventionsVersees: number;
  chargesFinancieres: number;
  encoursDette: number;
  annuiteDette: number;
  remboursementCapital: number;
  epargneBrute: number;
  epargneNette: number;
  capaciteFinancement: number;
  impotsLocaux: number;
  impotsTaxes: number;
  dgf: number;
  fctva: number;
  concoursEtat: number;
  subventionsRecues: number;
  fiscaliteReversee: number;
}

function emptyPivot(insee: string, annee: number): PivotedCommune {
  return {
    insee, annee,
    nom: `Commune ${insee}`,
    depCode: "00", depName: "", regName: "",
    epciName: null,
    population: 0, trancheOfgl: "",
    recettesTotales: 0, recettesFonctionnement: 0, recettesInvestissement: 0,
    depensesTotales: 0, depensesFonctionnement: 0, depensesInvestissement: 0,
    depensesEquipement: 0, fraisPersonnel: 0, achatsChargesExternes: 0,
    subventionsVersees: 0, chargesFinancieres: 0, encoursDette: 0,
    annuiteDette: 0, remboursementCapital: 0,
    epargneBrute: 0, epargneNette: 0, capaciteFinancement: 0,
    impotsLocaux: 0, impotsTaxes: 0, dgf: 0, fctva: 0,
    concoursEtat: 0, subventionsRecues: 0, fiscaliteReversee: 0,
  };
}

function parseAndPivot(content: string, fallbackYear: number): PivotedCommune[] {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = detectSeparator(lines[0]!);
  const headers = parseCsvLine(lines[0]!, sep).map((h) =>
    h.trim().toLowerCase().replace(/^"|"$/g, ""),
  );

  const idx = (name: string) => headers.indexOf(name);
  const I = {
    com_code: idx("com_code"),
    com_name: idx("com_name"),
    dep_code: idx("dep_code"),
    dep_name: idx("dep_name"),
    reg_name: idx("reg_name"),
    epci_name: idx("epci_name"),
    ptot: idx("ptot"),
    tranche: idx("tranche_population"),
    exer: idx("exer"),
    agregat: idx("agregat"),
    montant: idx("montant"),
  };

  const missing = (Object.entries(I) as [string, number][])
    .filter(([_, v]) => v === -1)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `[ofgl] colonnes manquantes dans le CSV : ${missing.join(", ")}\n` +
        `Headers reçus : ${headers.slice(0, 20).join(", ")}…`,
    );
  }

  const accumulator = new Map<string, PivotedCommune>();
  let processed = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const cols = parseCsvLine(line, sep);

    const insee = (cols[I.com_code] ?? "").trim().padStart(5, "0");
    if (!insee || insee.length !== 5) continue;

    const annee = parseInt(cols[I.exer] ?? "", 10) || fallbackYear;
    const key = `${insee}_${annee}`;

    let entry = accumulator.get(key);
    if (!entry) {
      entry = emptyPivot(insee, annee);
      entry.nom = (cols[I.com_name] ?? "").trim() || `Commune ${insee}`;
      entry.depCode = (cols[I.dep_code] ?? "").trim().padStart(2, "0").slice(0, 3);
      entry.depName = (cols[I.dep_name] ?? "").trim();
      entry.regName = (cols[I.reg_name] ?? "").trim();
      entry.epciName = (cols[I.epci_name] ?? "").trim() || null;
      entry.population = Math.round(parseEur(cols[I.ptot]));
      entry.trancheOfgl = (cols[I.tranche] ?? "").trim();
      accumulator.set(key, entry);
    }

    const agregat = (cols[I.agregat] ?? "").trim();
    const field = AGREGAT_FIELD[agregat];
    if (field) {
      const montant = parseEur(cols[I.montant]);
      // OFGL : la dette et le personnel peuvent être en valeurs négatives
      // résiduelles (ex : ajustements). On garde le signe brut, la conversion
      // BigInt côté upsert arrondit. On force >=0 uniquement pour l'encours.
      (entry as Record<AgregatField, number>)[field] = montant;
    }

    processed++;
    if (processed % 200_000 === 0) {
      console.log(`[ofgl] parsing : ${processed} lignes traitées, ${accumulator.size} communes accumulées`);
    }
  }

  console.log(
    `[ofgl] parsing terminé : ${processed} lignes → ${accumulator.size} communes uniques`,
  );
  return Array.from(accumulator.values());
}

// ----------------------------------------------------------------------------
// UPSERT dans Postgres
// ----------------------------------------------------------------------------

async function upsertCommune(r: PivotedCommune): Promise<void> {
  const region = r.regName || DEPT_TO_REGION[r.depCode] || "Autre";
  const departement = r.depName ? `${r.depName} (${r.depCode})` : `(${r.depCode})`;

  // Si OFGL ne renvoie pas explicitement Recettes totales, on agrège fct + invest
  const recettesTot =
    r.recettesTotales > 0
      ? r.recettesTotales
      : r.recettesFonctionnement + r.recettesInvestissement;
  const depensesTot =
    r.depensesTotales > 0
      ? r.depensesTotales
      : r.depensesFonctionnement + r.depensesInvestissement;
  const budget = Math.max(recettesTot, depensesTot);
  const solde = recettesTot - depensesTot;

  // Décomposition recettes
  const dotationsTot = r.dgf + r.concoursEtat; // OFGL : "Concours de l'Etat" inclut DGF + autres concours
  // Pour éviter les doubles comptes : on prend max(dgf, concoursEtat) si l'un est inclus dans l'autre
  const dotationsEtatNet = r.concoursEtat > 0 ? r.concoursEtat : r.dgf;
  const subventionsRec =
    r.subventionsRecues ||
    Math.max(0, recettesTot - r.impotsTaxes - dotationsEtatNet);
  const services = Math.max(
    0,
    recettesTot - r.impotsTaxes - dotationsEtatNet - subventionsRec - r.fiscaliteReversee,
  );

  await prisma.commune.upsert({
    where: { codeInsee: r.insee },
    create: {
      codeInsee: r.insee,
      nom: r.nom,
      slug: slugify(r.nom),
      departement,
      departementCode: r.depCode,
      region,
      population: r.population,
      classification: classifyVille(r.population),
      metropole: METROPOLES_STATUTAIRES[r.insee] ?? null,
    },
    update: {
      nom: r.nom,
      slug: slugify(r.nom),
      departement,
      departementCode: r.depCode,
      region,
      population: r.population,
      classification: classifyVille(r.population),
      metropole: METROPOLES_STATUTAIRES[r.insee] ?? null,
    },
  });

  const data = {
    recettesTotalesEur: BigInt(Math.round(recettesTot)),
    recettesFonctionnementEur: BigInt(Math.round(r.recettesFonctionnement)),
    recettesInvestEur: BigInt(Math.round(r.recettesInvestissement)),
    depensesTotalesEur: BigInt(Math.round(depensesTot)),
    depensesFonctionnementEur: BigInt(Math.round(r.depensesFonctionnement)),
    depensesInvestEur: BigInt(Math.round(r.depensesInvestissement)),
    soldeBudgetaireEur: BigInt(Math.round(solde)),
    budgetTotalEur: BigInt(Math.round(budget)),

    // Trois métriques de dette distinctes (3 colonnes natives OFGL)
    detteEncoursEur: BigInt(Math.round(Math.max(0, r.encoursDette))),
    chargeDetteEur: BigInt(Math.round(Math.max(0, r.chargesFinancieres))), // intérêts seuls
    amortissementCapitalEur: BigInt(Math.round(Math.max(0, r.remboursementCapital))),

    // Marge / autofinancement
    capaciteAutofinancementEur: BigInt(Math.round(r.epargneBrute)),

    // Composantes principales des dépenses
    depensesPersonnelEur: BigInt(Math.round(Math.max(0, r.fraisPersonnel))),
    depensesChargesGeneralesEur: BigInt(Math.round(Math.max(0, r.achatsChargesExternes))),
    depensesSubventionsEur: BigInt(Math.round(Math.max(0, r.subventionsVersees))),

    // Composantes principales des recettes
    recettesImpotsLocauxEur: BigInt(Math.round(Math.max(0, r.impotsLocaux))),
    recettesDotationsEtatEur: BigInt(Math.round(Math.max(0, dotationsTot))),
    recettesSubventionsEur: BigInt(Math.round(Math.max(0, subventionsRec))),
    recettesServicesEur: BigInt(Math.round(Math.max(0, services))),

    // Composition en pourcentage
    compoRecettesImpotsPct: pct(r.impotsLocaux, recettesTot),
    compoRecettesDotationsPct: pct(dotationsEtatNet, recettesTot),
    compoRecettesSubvPct: pct(subventionsRec, recettesTot),
    compoRecettesServicesPct: pct(services, recettesTot),
    compoRecettesAutresPct: Math.max(
      0,
      100 -
        pct(r.impotsLocaux + dotationsEtatNet + subventionsRec + services, recettesTot),
    ),
    compoDepensesPersonnelPct: pct(r.fraisPersonnel, depensesTot),
    compoDepensesGeneralesPct: pct(r.achatsChargesExternes, depensesTot),
    compoDepensesSubvPct: pct(r.subventionsVersees, depensesTot),
    compoDepensesFinancieresPct: pct(r.chargesFinancieres, depensesTot),
    compoDepensesInvestPct: pct(r.depensesInvestissement, depensesTot),

    source: `OFGL base communes consolidée ${r.annee}`,
  };

  await prisma.communeFinanciere.upsert({
    where: { codeInsee_annee: { codeInsee: r.insee, annee: r.annee } },
    create: { codeInsee: r.insee, annee: r.annee, ...data },
    update: data,
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
  console.log(`[ofgl] début de l'import pour l'année ${year}…`);

  // 1. Télécharger le CSV (1 fichier ~150-300 Mo)
  const csvPath = await downloadCsv(year);
  console.log(`[ofgl] lecture du fichier en mémoire…`);
  const csvContent = await readFile(csvPath, "utf-8");

  // 2. Parser + pivoter long → wide
  console.log(`[ofgl] parsing + pivot…`);
  const rows = parseAndPivot(csvContent, year);
  console.log(`[ofgl] ${rows.length} communes à upserter.`);

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
      console.log(
        `[ofgl] ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} (${elapsed}s, ${errors} erreurs)`,
      );
    }
  }

  const durationSec = (Date.now() - start) / 1000;
  console.log(`[ofgl] terminé : ${inserted} insérées, ${errors} erreurs en ${durationSec.toFixed(0)}s`);
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
      console.log(`[ofgl] OK : ${res.inserted}/${res.totalRows} lignes en ${res.durationSec.toFixed(0)}s`);
      process.exit(0);
    })
    .catch((e) => {
      console.error("[ofgl] FATAL :", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
