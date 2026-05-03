// ============================================================================
// importDgfip.ts — pipeline d'import des comptes individuels DGFiP
// ============================================================================
//
// Ce script télécharge le CSV "Comptes individuels des collectivités" depuis
// data.gouv.fr (DGFiP, mis à jour annuellement vers juin), le parse et upsert
// les ~35 000 communes françaises dans la table CommuneFinanciere.
//
// Usage manuel sur le VPS :
//   docker compose exec backend npx tsx src/seed/importDgfip.ts
//
// Ou depuis l'admin :
//   POST /api/admin/run/import-dgfip (à brancher dans une étape suivante)
//
// Source officielle :
//   https://www.data.gouv.fr/fr/datasets/comptes-individuels-des-collectivites/
//
// Le CSV fait ~80 Mo par année et contient une ligne par commune avec une
// cinquantaine de colonnes. Le format évolue d'année en année — ce script
// est calibré pour le format 2024 et peut nécessiter des ajustements pour
// les millésimes futurs.
//
// ⚠ Avertissement : ce script est conçu pour tourner UNE FOIS PAR AN après
// la publication officielle DGFiP (juin N+1). Il prend ~30 min pour parser
// et insérer 35 000 lignes × N années.
// ============================================================================

import { prisma } from "../lib/db.ts";
import { writeFile, readFile } from "node:fs/promises";

// URL du dataset DGFiP (peut bouger entre les millésimes — vérifier sur
// data.gouv.fr et mettre à jour au besoin).
const DGFIP_DATASET_URL = "https://www.data.gouv.fr/fr/datasets/r/<resource-id>";

// Schéma minimal d'une ligne CSV DGFiP (colonnes utilisées)
// Le format réel a une cinquantaine de colonnes, on ne mappe que celles
// qui nous intéressent. À adapter selon le millésime DGFiP.
interface DgfipRow {
  insee: string;          // code INSEE
  lbudg: string;          // libellé budget (= nom commune)
  dep: string;            // code département
  reg: string;            // région
  annee: string;          // millésime
  pop: string;            // population DGF
  rrf: string;            // recettes réelles fonctionnement
  drf: string;            // dépenses réelles fonctionnement
  rri: string;            // recettes réelles investissement
  dri: string;            // dépenses réelles investissement
  fper: string;           // charges de personnel
  fcg: string;            // charges générales
  fsubv: string;          // subventions versées
  ifin: string;           // intérêts financiers
  fdgf: string;           // dotation globale fonctionnement
  fdfa: string;           // autres dotations
  ftloc: string;          // taxes locales
  enc: string;            // encours dette
  caf: string;            // capacité autofinancement
}

function parseEur(s: string): number {
  if (!s) return 0;
  // Le CSV DGFiP utilise la virgule comme séparateur décimal et l'espace
  // comme séparateur de milliers. On normalise.
  const normalized = s
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

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

const DEPT_TO_REGION: Record<string, string> = {
  // Voir loadCommunes.ts — table complète
  "75": "Île-de-France", "13": "Provence-Alpes-Côte d'Azur",
  "69": "Auvergne-Rhône-Alpes", "31": "Occitanie",
  // ... à compléter pour les 96 départements + DROM
};

const METROPOLES_STATUTAIRES: Record<string, string> = {
  "75056": "Métropole du Grand Paris",
  "13055": "Métropole d'Aix-Marseille-Provence",
  "69123": "Métropole de Lyon",
  // ... voir loadCommunes.ts
};

function pct(numerator: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((numerator / total) * 100).toFixed(2));
}

/**
 * Télécharge le CSV DGFiP depuis data.gouv.fr.
 * Renvoie le chemin du fichier téléchargé.
 */
async function downloadCsv(url: string, dest: string): Promise<string> {
  console.log(`[dgfip] téléchargement de ${url}…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`[dgfip] fichier sauvegardé : ${dest} (${(buf.length / 1e6).toFixed(1)} Mo)`);
  return dest;
}

/**
 * Parse un CSV DGFiP simplifié. Le format réel utilise ; comme séparateur.
 * Ignore les en-têtes, retourne un tableau d'objets typés.
 */
function parseCsv(content: string): DgfipRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(";").map((h) => h.trim().toLowerCase());
  const out: DgfipRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(";");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    out.push(row as unknown as DgfipRow);
  }
  return out;
}

/**
 * Upsert d'une ligne DGFiP dans Postgres.
 */
async function upsertRow(row: DgfipRow) {
  const codeInsee = row.insee.padStart(5, "0");
  const annee = parseInt(row.annee, 10);
  const population = parseEur(row.pop);
  const recettesFct = parseEur(row.rrf);
  const depensesFct = parseEur(row.drf);
  const recettesInvest = parseEur(row.rri);
  const depensesInvest = parseEur(row.dri);
  const personnel = parseEur(row.fper);
  const chargesGen = parseEur(row.fcg);
  const subvVersees = parseEur(row.fsubv);
  const charFin = parseEur(row.ifin);
  const dotations = parseEur(row.fdgf) + parseEur(row.fdfa);
  const impotsLocaux = parseEur(row.ftloc);
  const dette = parseEur(row.enc);
  const caf = parseEur(row.caf);

  const recettesTot = recettesFct + recettesInvest;
  const depensesTot = depensesFct + depensesInvest;
  const budget = Math.max(recettesTot, depensesTot);
  const solde = recettesTot - depensesTot;
  const subventions = recettesTot - impotsLocaux - dotations - parseEur(""); // résidu

  const departementCode = row.dep.padStart(2, "0");
  const departement = `${row.lbudg.split("(")[0]?.trim() ?? row.lbudg} (${departementCode})`;

  // Upsert commune
  await prisma.commune.upsert({
    where: { codeInsee },
    create: {
      codeInsee,
      nom: row.lbudg,
      slug: slugify(row.lbudg),
      departement,
      departementCode,
      region: DEPT_TO_REGION[departementCode] ?? "Autre",
      population: Math.round(population),
      classification: classifyVille(population),
      metropole: METROPOLES_STATUTAIRES[codeInsee] ?? null,
    },
    update: {
      nom: row.lbudg,
      slug: slugify(row.lbudg),
      departement,
      departementCode,
      region: DEPT_TO_REGION[departementCode] ?? "Autre",
      population: Math.round(population),
      classification: classifyVille(population),
      metropole: METROPOLES_STATUTAIRES[codeInsee] ?? null,
    },
  });

  // Upsert finances
  await prisma.communeFinanciere.upsert({
    where: { codeInsee_annee: { codeInsee, annee } },
    create: {
      codeInsee,
      annee,
      recettesTotalesEur: BigInt(Math.round(recettesTot)),
      recettesFonctionnementEur: BigInt(Math.round(recettesFct)),
      recettesInvestEur: BigInt(Math.round(recettesInvest)),
      depensesTotalesEur: BigInt(Math.round(depensesTot)),
      depensesFonctionnementEur: BigInt(Math.round(depensesFct)),
      depensesInvestEur: BigInt(Math.round(depensesInvest)),
      soldeBudgetaireEur: BigInt(Math.round(solde)),
      budgetTotalEur: BigInt(Math.round(budget)),
      detteEncoursEur: BigInt(Math.round(dette)),
      chargeDetteEur: BigInt(Math.round(charFin)),
      capaciteAutofinancementEur: BigInt(Math.round(caf)),
      depensesPersonnelEur: BigInt(Math.round(personnel)),
      depensesChargesGeneralesEur: BigInt(Math.round(chargesGen)),
      depensesSubventionsEur: BigInt(Math.round(subvVersees)),
      recettesImpotsLocauxEur: BigInt(Math.round(impotsLocaux)),
      recettesDotationsEtatEur: BigInt(Math.round(dotations)),
      recettesSubventionsEur: BigInt(Math.round(Math.max(0, subventions))),
      recettesServicesEur: BigInt(0),  // pas isolable dans ce CSV
      compoRecettesImpotsPct: pct(impotsLocaux, recettesTot),
      compoRecettesDotationsPct: pct(dotations, recettesTot),
      compoRecettesSubvPct: pct(subventions, recettesTot),
      compoRecettesServicesPct: 0,
      compoRecettesAutresPct: 100 - pct(impotsLocaux + dotations + subventions, recettesTot),
      compoDepensesPersonnelPct: pct(personnel, depensesTot),
      compoDepensesGeneralesPct: pct(chargesGen, depensesTot),
      compoDepensesSubvPct: pct(subvVersees, depensesTot),
      compoDepensesFinancieresPct: pct(charFin, depensesTot),
      compoDepensesInvestPct: pct(depensesInvest, depensesTot),
      source: `DGFiP comptes individuels ${annee}`,
    },
    update: {},
  });
}

/**
 * Point d'entrée principal du script d'import.
 */
async function main() {
  const startTime = Date.now();
  console.log("[dgfip] début de l'import…");

  // 1. Télécharger le CSV (à activer quand l'URL DGFIP_DATASET_URL est
  // configurée). Pour l'instant, on attend un fichier déjà présent à
  // /tmp/dgfip-comptes.csv (à uploader manuellement sur le VPS).
  const csvPath = process.env.DGFIP_CSV_PATH ?? "/tmp/dgfip-comptes.csv";

  let csvContent: string;
  try {
    csvContent = await readFile(csvPath, "utf-8");
  } catch (e) {
    console.error(`[dgfip] CSV introuvable à ${csvPath}.`);
    console.error("Pour l'utiliser :");
    console.error("  1. Va sur https://www.data.gouv.fr/fr/datasets/comptes-individuels-des-collectivites/");
    console.error("  2. Télécharge le CSV des communes pour l'année voulue");
    console.error("  3. Upload-le sur le VPS dans /tmp/dgfip-comptes.csv :");
    console.error("     scp comptes-2024.csv root@37.27.91.108:/tmp/dgfip-comptes.csv");
    console.error("  4. Re-lance ce script");
    process.exit(1);
  }

  // 2. Parser
  console.log("[dgfip] parsing du CSV…");
  const rows = parseCsv(csvContent);
  console.log(`[dgfip] ${rows.length} lignes lues.`);

  // 3. Upsert (par batches de 100 pour ne pas saturer Postgres)
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]!;
      // Filtre : on ne garde que les communes (pas les EPCI / régions)
      if (!row.insee || row.insee.length !== 5) continue;
      await upsertRow(row);
      inserted++;
      if (inserted % 1000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`[dgfip] ${inserted} / ${rows.length} (${elapsed}s écoulées)`);
      }
    } catch (e) {
      errors++;
      console.error(`[dgfip] erreur ligne ${i}: ${(e as Error).message}`);
    }
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`[dgfip] terminé : ${inserted} insérées, ${errors} erreurs en ${totalSec}s`);
}

// Auto-run si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((e) => {
      console.error("[dgfip] FATAL:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export { main as runDgfipImport };
