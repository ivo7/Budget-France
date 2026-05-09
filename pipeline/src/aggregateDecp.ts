// ============================================================================
// aggregateDecp.ts — Agrège les Données Essentielles de la Commande Publique
// ============================================================================
//
// Phase 1 du module « Marchés publics » : génération d'un JSON statique
// listant les top 100 fournisseurs nationaux par montant total de marchés
// publics gagnés.
//
// Source : data.gouv.fr — DECP fichiers consolidés (CSV)
//   https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/
//
// Procédure d'utilisation :
//
//   1. Récupérer le lien de téléchargement direct du fichier consolidé CSV
//      sur data.gouv.fr (l'URL change à chaque mise à jour). Format attendu :
//      decp-2025.csv ou decp-augmente.csv.
//
//   2. Télécharger localement (ou sur le VPS) :
//      curl -L 'https://www.data.gouv.fr/fr/datasets/r/<id>' -o /tmp/decp.csv
//
//   3. Lancer ce script :
//      docker compose exec backend npx tsx /app/pipeline/src/aggregateDecp.ts /tmp/decp.csv
//      ou en local : cd pipeline && npx tsx src/aggregateDecp.ts /tmp/decp.csv
//
//   4. Le script génère :
//      frontend/src/data/topFournisseursMarches.json
//      Contenu : top 100 par montant total + métadonnées globales.
//
// Le script est idempotent : on peut le re-lancer à volonté pour rafraîchir.
//
// ⚠ Volume : DECP consolidé fait typiquement 1-3 Go. Le parsing est streamé
// ligne par ligne pour ne pas saturer la mémoire (max ~500 Mo de RAM utilisée
// pour la map d'agrégation).
// ============================================================================

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

// ----------------------------------------------------------------------------
// Mapping SIREN → groupe-mère (consolidation des filiales)
// À enrichir au fur et à mesure pour améliorer la lisibilité des résultats.
// ----------------------------------------------------------------------------

const SIREN_VERS_GROUPE: Record<string, string> = {
  // Vinci et filiales
  "552037806": "Vinci",            // Vinci SA
  "395080011": "Vinci",            // Vinci Construction
  "799100600": "Vinci",            // Vinci Energies
  "320229939": "Vinci",            // Eurovia
  "775652497": "Vinci",            // ASF (Autoroutes du Sud de la France)
  // Bouygues et filiales
  "352170161": "Bouygues",         // Bouygues SA
  "562145487": "Bouygues",         // Bouygues Construction
  "552069477": "Bouygues",         // Bouygues Bâtiment
  "552143511": "Bouygues",         // Colas
  "397480930": "Bouygues",         // Bouygues Telecom
  // Eiffage
  "709802094": "Eiffage",          // Eiffage SA
  "711901435": "Eiffage",          // Eiffage Construction
  "542070416": "Eiffage",          // APRR
  // Spie
  "455003766": "Spie",             // Spie SA
  // Veolia
  "403210032": "Veolia",           // Veolia SA
  "562003157": "Veolia",           // Veolia Eau
  // Engie
  "542107651": "Engie",            // Engie (ex-GDF Suez)
  // Orange
  "380129866": "Orange",
  // Sodexo
  "301940219": "Sodexo",
  // Capgemini
  "330703844": "Capgemini",
  // Atos / Eviden
  "323623603": "Atos",
  // Suez (rachat partiel par Veolia 2022)
  "410118608": "Suez",
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sirenFromSiret(siret: string): string {
  const cleaned = siret.replace(/\D/g, "");
  return cleaned.length >= 9 ? cleaned.slice(0, 9) : cleaned;
}

function parseCsvLine(line: string): string[] {
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
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function detectSeparator(header: string): string {
  const semicolons = (header.match(/;/g) ?? []).length;
  const commas = (header.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function parseLineWithSep(line: string, sep: string): string[] {
  if (sep === ",") return parseCsvLine(line);
  // Réutilise la même logique mais avec un séparateur custom
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

// ----------------------------------------------------------------------------
// Aggregator
// ----------------------------------------------------------------------------

interface AggData {
  raisonSociale: string;
  totalMontantEur: number;
  nbMarches: number;
  acheteurs: Map<string, number>;
  natures: Map<string, number>;
  premiereDate: string;
  derniereDate: string;
}

function emptyAgg(name: string): AggData {
  return {
    raisonSociale: name,
    totalMontantEur: 0,
    nbMarches: 0,
    acheteurs: new Map(),
    natures: new Map(),
    premiereDate: "9999-99-99",
    derniereDate: "0000-00-00",
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      "Usage: npx tsx aggregateDecp.ts <chemin-vers-decp.csv>\n\n" +
        "Télécharge d'abord le fichier DECP consolidé depuis data.gouv.fr :\n" +
        "  https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/",
    );
    process.exit(1);
  }
  if (!fs.existsSync(inputPath)) {
    console.error(`[decp] fichier introuvable : ${inputPath}`);
    process.exit(1);
  }

  const start = Date.now();
  const sizeMo = (fs.statSync(inputPath).size / 1e6).toFixed(0);
  console.log(`[decp] début agrégation : ${inputPath} (${sizeMo} Mo)`);

  const stream = fs.createReadStream(inputPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream });

  // Map siren-canonique → données agrégées
  const agg = new Map<string, AggData>();
  let header: string[] = [];
  let sep = ",";
  let lineNum = 0;
  let processed = 0;
  let skipped = 0;

  // Index des colonnes (calculés après lecture du header)
  const idx: Record<string, number> = {};

  for await (const rawLine of rl) {
    lineNum++;
    if (!rawLine.trim()) continue;

    if (lineNum === 1) {
      sep = detectSeparator(rawLine);
      header = parseLineWithSep(rawLine, sep).map((h) =>
        h.trim().toLowerCase().replace(/^"|"$/g, ""),
      );
      // Cherche les colonnes utiles (tolérant aux variations de format DECP)
      const find = (...names: string[]) => {
        for (const n of names) {
          const i = header.indexOf(n);
          if (i >= 0) return i;
        }
        return -1;
      };
      idx.titulaireSiret = find(
        "titulaire_id",
        "titulaires.0.id",
        "titulaire.id",
        "titulaires_id",
        "id_titulaire",
      );
      idx.titulaireNom = find(
        "titulaire_denominationsociale",
        "titulaire_denomination",
        "titulaires.0.denominationsociale",
        "titulaires_denomination",
        "denomination_titulaire",
      );
      idx.montant = find("montant", "valeur", "valeurglobale");
      idx.acheteurSiret = find(
        "acheteur_id",
        "acheteur.id",
        "id_acheteur",
        "siret_acheteur",
      );
      idx.acheteurNom = find(
        "acheteur_nom",
        "acheteur.nom",
        "nom_acheteur",
      );
      idx.nature = find("nature", "natureitulaire", "type");
      idx.dateNotification = find(
        "datenotification",
        "datenotification_str",
        "datepublicationdonnees",
      );

      console.log(`[decp] séparateur : "${sep}", colonnes détectées :`);
      console.log(
        `  titulaire_siret=${idx.titulaireSiret} ` +
          `titulaire_nom=${idx.titulaireNom} ` +
          `montant=${idx.montant} ` +
          `acheteur_siret=${idx.acheteurSiret} ` +
          `nature=${idx.nature}`,
      );

      if (
        idx.titulaireSiret < 0 ||
        idx.montant < 0
      ) {
        console.error(
          "[decp] ERREUR : colonnes essentielles introuvables. " +
            "Format DECP non reconnu. Voici les en-têtes lus :",
        );
        console.error(header.slice(0, 30).join(" | "));
        process.exit(2);
      }
      continue;
    }

    const cols = parseLineWithSep(rawLine, sep);
    const titulaireSiret = (cols[idx.titulaireSiret] ?? "").trim();
    if (!titulaireSiret || titulaireSiret.length < 9) {
      skipped++;
      continue;
    }

    const montantStr = (cols[idx.montant] ?? "").trim().replace(/[^\d.,-]/g, "").replace(",", ".");
    const montant = Number.parseFloat(montantStr);
    if (!Number.isFinite(montant) || montant <= 0) {
      skipped++;
      continue;
    }

    const titulaireNom = ((idx.titulaireNom >= 0 ? cols[idx.titulaireNom] : "") ?? "").trim();
    const siren = sirenFromSiret(titulaireSiret);
    const groupe = SIREN_VERS_GROUPE[siren];
    const aggKey = groupe ?? siren;

    let entry = agg.get(aggKey);
    if (!entry) {
      const displayName = groupe ?? titulaireNom ?? `SIREN ${siren}`;
      entry = emptyAgg(displayName);
      agg.set(aggKey, entry);
    }

    entry.totalMontantEur += montant;
    entry.nbMarches++;

    if (idx.acheteurSiret >= 0) {
      const acheteur = (cols[idx.acheteurSiret] ?? "").trim();
      if (acheteur) {
        entry.acheteurs.set(acheteur, (entry.acheteurs.get(acheteur) ?? 0) + 1);
      }
    }
    if (idx.nature >= 0) {
      const nature = (cols[idx.nature] ?? "").trim();
      if (nature) {
        entry.natures.set(nature, (entry.natures.get(nature) ?? 0) + 1);
      }
    }
    if (idx.dateNotification >= 0) {
      const date = (cols[idx.dateNotification] ?? "").trim().slice(0, 10);
      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (date < entry.premiereDate) entry.premiereDate = date;
        if (date > entry.derniereDate) entry.derniereDate = date;
      }
    }

    processed++;
    if (processed % 200_000 === 0) {
      const sec = ((Date.now() - start) / 1000).toFixed(0);
      console.log(
        `[decp] ${processed.toLocaleString("fr-FR")} marchés traités, ` +
          `${agg.size.toLocaleString("fr-FR")} fournisseurs uniques (${sec}s)`,
      );
    }
  }

  console.log(
    `[decp] fin parsing : ${processed.toLocaleString("fr-FR")} marchés valides, ` +
      `${skipped.toLocaleString("fr-FR")} skippés, ${agg.size.toLocaleString("fr-FR")} fournisseurs.`,
  );

  // Top 100 par montant total
  const top100 = Array.from(agg.entries())
    .map(([sirenOuGroupe, data]) => ({
      siren: sirenOuGroupe,
      raisonSociale: data.raisonSociale,
      totalMontantEur: Math.round(data.totalMontantEur),
      nbMarches: data.nbMarches,
      ticketMoyenEur: Math.round(data.totalMontantEur / Math.max(1, data.nbMarches)),
      topNatures: Array.from(data.natures.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([n]) => n),
      premiereDate: data.premiereDate === "9999-99-99" ? null : data.premiereDate,
      derniereDate: data.derniereDate === "0000-00-00" ? null : data.derniereDate,
    }))
    .filter((f) => f.totalMontantEur > 0)
    .sort((a, b) => b.totalMontantEur - a.totalMontantEur)
    .slice(0, 100)
    .map((f, i) => ({ rang: i + 1, ...f }));

  // Total général
  const totalGeneral = Array.from(agg.values()).reduce(
    (acc, d) => acc + d.totalMontantEur,
    0,
  );

  const output = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(inputPath),
    totalMarches: processed,
    totalFournisseurs: agg.size,
    totalMontantEur: Math.round(totalGeneral),
    top100,
  };

  // Trouver le bon chemin de sortie : remonter au workspace BudgetFrance/
  // (on peut être lancé depuis pipeline/, depuis backend/, depuis /app/, etc.)
  const candidatesOutDir = [
    path.resolve(process.cwd(), "frontend/src/data"),
    path.resolve(process.cwd(), "../frontend/src/data"),
    path.resolve(process.cwd(), "../../frontend/src/data"),
    "/app/frontend/src/data",
  ];
  let outDir: string | null = null;
  for (const c of candidatesOutDir) {
    if (fs.existsSync(c)) {
      outDir = c;
      break;
    }
  }
  if (!outDir) {
    console.warn(
      "[decp] ATTENTION : impossible de trouver frontend/src/data. " +
        "Sortie écrite dans le répertoire courant.",
    );
    outDir = process.cwd();
  }

  const outPath = path.join(outDir, "topFournisseursMarches.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const sec = ((Date.now() - start) / 1000).toFixed(0);
  console.log(
    `[decp] OK : ${top100.length} top fournisseurs écrits dans ${outPath} (${sec}s)`,
  );
  console.log(
    `[decp] Total agrégé : ${(totalGeneral / 1e9).toFixed(1)} Md€ sur ${processed.toLocaleString("fr-FR")} marchés.`,
  );
}

main().catch((e) => {
  console.error("[decp] FATAL :", e);
  process.exit(1);
});
