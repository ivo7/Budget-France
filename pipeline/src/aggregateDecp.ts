// ============================================================================
// aggregateDecp.ts — Agrège les Données Essentielles de la Commande Publique
// ============================================================================
//
// Phase 1 du module « Marchés publics » : génération d'un JSON statique
// listant les top 100 fournisseurs nationaux par montant total de marchés
// publics gagnés.
//
// Source : data.gouv.fr — DECP fichiers consolidés (JSON)
//   https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/
//
// Format des fichiers DECP :
//   - decp-global.json (~854 Mo) : tous les marchés depuis 2018 — TROP GROS pour JSON.parse
//   - decp-AAAA.json (~250 Mo)   : tous les marchés d'une année
//   - decp-AAAA-MM.json (~50 Mo) : marchés d'un mois — RECOMMANDÉ
//
// Procédure d'utilisation :
//
//   1. Télécharger les fichiers mensuels désirés depuis data.gouv.fr.
//      Pour 2024 entier (recommandé pour le top 100), il faut les 12 fichiers
//      mensuels decp-2024-01.json à decp-2024-12.json.
//      Les URLs directes sont dispo sur la page :
//      https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/
//
//   2. Sur le VPS, créer un dossier dédié et télécharger :
//        mkdir -p /tmp/decp && cd /tmp/decp
//        # Récupérer les liens directs depuis la page data.gouv.fr et :
//        curl -L 'https://www.data.gouv.fr/fr/datasets/r/<id-2024-01>' -o decp-2024-01.json
//        curl -L 'https://www.data.gouv.fr/fr/datasets/r/<id-2024-02>' -o decp-2024-02.json
//        # ... etc
//
//   3. Lancer le script avec tous les fichiers :
//        docker compose exec backend npx tsx /app/pipeline/src/aggregateDecp.ts /tmp/decp/decp-2024-*.json
//
//   4. Le script génère :
//        frontend/src/data/topFournisseursMarches.json
//      Contenu : top 100 par montant total + métadonnées globales.
//
// Le script est idempotent : on peut le re-lancer à volonté pour rafraîchir.
//
// ⚠ Mémoire : chaque fichier mensuel est chargé entièrement en RAM
// (JSON.parse). Pour les fichiers ≤300 Mo, l'usage RAM pic ≈ 1-2 Go (string
// + objects). Le fichier global decp-global.json (854 Mo) ne peut PAS être
// chargé ainsi — utiliser les mensuels ou annuels.
// ============================================================================

import * as fs from "node:fs";
import * as path from "node:path";

// ----------------------------------------------------------------------------
// Mapping SIREN → groupe-mère (consolidation des filiales)
// À enrichir au fur et à mesure pour améliorer la lisibilité des résultats.
// SIREN = 9 premiers chiffres du SIRET.
// ----------------------------------------------------------------------------

const SIREN_VERS_GROUPE: Record<string, string> = {
  // --- Vinci et filiales ---
  "552037806": "Vinci",            // Vinci SA
  "395080011": "Vinci",            // Vinci Construction
  "799100600": "Vinci",            // Vinci Energies
  "320229939": "Vinci",            // Eurovia
  "775652497": "Vinci",            // ASF
  // --- Bouygues et filiales ---
  "352170161": "Bouygues",         // Bouygues SA
  "562145487": "Bouygues",         // Bouygues Construction
  "552069477": "Bouygues",         // Bouygues Bâtiment
  "552143511": "Bouygues",         // Colas
  "397480930": "Bouygues",         // Bouygues Telecom
  // --- Eiffage ---
  "709802094": "Eiffage",
  "711901435": "Eiffage",
  "542070416": "Eiffage",          // APRR
  // --- Spie ---
  "455003766": "Spie",
  // --- Veolia ---
  "403210032": "Veolia",
  "562003157": "Veolia",
  // --- Engie ---
  "542107651": "Engie",
  // --- Orange ---
  "380129866": "Orange",
  // --- Sodexo ---
  "301940219": "Sodexo",
  // --- Capgemini ---
  "330703844": "Capgemini",
  // --- Atos / Eviden ---
  "323623603": "Atos",
  // --- Suez ---
  "410118608": "Suez",
};

// ----------------------------------------------------------------------------
// Types DECP (structure typique des fichiers consolidés data.gouv.fr)
// ----------------------------------------------------------------------------

interface DecpTitulaire {
  id?: string;          // SIRET du titulaire (ou typeIdentifiant + identifiant selon variante)
  identifiant?: string;
  typeIdentifiant?: string;
  denominationSociale?: string;
  denomination?: string;
}

interface DecpAcheteur {
  id?: string;
  identifiant?: string;
  nom?: string;
  denomination?: string;
}

interface DecpMarche {
  id?: string;
  objet?: string;
  montant?: number | string;
  valeurGlobale?: number | string;
  dateNotification?: string;
  datePublicationDonnees?: string;
  nature?: string;
  type?: string;
  acheteur?: DecpAcheteur;
  titulaires?: DecpTitulaire[];
  // Anciennes variantes plates : titulaire_id, titulaire_denominationSociale, etc.
  [key: string]: unknown;
}

// Helper pour extraire un SIRET / SIREN de différentes variantes de format
function extractTitulaireSiret(t: DecpTitulaire | undefined): string | null {
  if (!t) return null;
  const raw =
    (t.id as string | undefined) ??
    (t.identifiant as string | undefined) ??
    null;
  if (!raw) return null;
  const cleaned = String(raw).replace(/\D/g, "");
  return cleaned.length >= 9 ? cleaned : null;
}

function extractTitulaireNom(t: DecpTitulaire | undefined): string {
  if (!t) return "";
  return String(
    t.denominationSociale ??
      t.denomination ??
      "",
  ).trim();
}

function extractMontant(m: DecpMarche): number {
  const raw = m.montant ?? m.valeurGlobale;
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const s = String(raw).replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function sirenFromSiret(siret: string): string {
  return siret.slice(0, 9);
}

// ----------------------------------------------------------------------------
// Aggregator
// ----------------------------------------------------------------------------

interface AggData {
  raisonSociale: string;
  totalMontantEur: number;
  nbMarches: number;
  natures: Map<string, number>;
  premiereDate: string;
  derniereDate: string;
}

function emptyAgg(name: string): AggData {
  return {
    raisonSociale: name,
    totalMontantEur: 0,
    nbMarches: 0,
    natures: new Map(),
    premiereDate: "9999-99-99",
    derniereDate: "0000-00-00",
  };
}

/**
 * Charge un fichier DECP JSON et retourne le tableau de marchés.
 * Gère plusieurs structures possibles : tableau racine, ou objet avec
 * une clé `marches`, `data`, ou `results`.
 */
function loadDecpFile(filePath: string): DecpMarche[] {
  const buf = fs.readFileSync(filePath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(buf);
  } catch (e) {
    // Tentative NDJSON (un objet JSON par ligne)
    const lines = buf.split(/\r?\n/).filter((l) => l.trim());
    const out: DecpMarche[] = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as DecpMarche);
      } catch {
        // ligne malformée, on ignore
      }
    }
    if (out.length > 0) return out;
    throw new Error(
      `Fichier ${filePath} ni JSON valide ni NDJSON valide : ${(e as Error).message}`,
    );
  }

  if (Array.isArray(parsed)) return parsed as DecpMarche[];
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["marches", "data", "results", "records"]) {
      if (Array.isArray(obj[key])) return obj[key] as DecpMarche[];
    }
  }
  throw new Error(
    `Fichier ${filePath} : structure JSON inconnue (ni tableau ni { marches: [...] }).`,
  );
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error(
      "Usage: npx tsx aggregateDecp.ts <fichier1.json> [<fichier2.json> ...]\n\n" +
        "Recommandé : les 12 fichiers mensuels d'une année.\n" +
        "  npx tsx aggregateDecp.ts /tmp/decp/decp-2024-*.json\n\n" +
        "Source : data.gouv.fr — DECP fichiers consolidés.",
    );
    process.exit(1);
  }
  for (const f of inputs) {
    if (!fs.existsSync(f)) {
      console.error(`[decp] fichier introuvable : ${f}`);
      process.exit(1);
    }
  }

  const start = Date.now();
  const totalMo = inputs.reduce(
    (acc, f) => acc + fs.statSync(f).size / 1e6,
    0,
  );
  console.log(
    `[decp] début agrégation : ${inputs.length} fichier${inputs.length > 1 ? "s" : ""} (${totalMo.toFixed(0)} Mo total)`,
  );

  // siren-canonique → données agrégées
  const agg = new Map<string, AggData>();
  let processed = 0;
  let skipped = 0;
  let multipleTitulaires = 0;

  for (const file of inputs) {
    const fileMo = (fs.statSync(file).size / 1e6).toFixed(1);
    console.log(`[decp] lecture ${path.basename(file)} (${fileMo} Mo)…`);
    const t0 = Date.now();

    const marches = loadDecpFile(file);
    console.log(
      `[decp]   → ${marches.length.toLocaleString("fr-FR")} marchés trouvés (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
    );

    for (const marche of marches) {
      const montant = extractMontant(marche);
      if (montant <= 0) {
        skipped++;
        continue;
      }
      // Date de notification (privilégiée) ou de publication (fallback)
      const date = String(
        marche.dateNotification ?? marche.datePublicationDonnees ?? "",
      ).slice(0, 10);
      const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
      const nature = String(marche.nature ?? marche.type ?? "").trim();

      // Liste des titulaires (cas typique : 1 titulaire par marché, parfois 2-3)
      const titulaires = Array.isArray(marche.titulaires)
        ? marche.titulaires
        : [];
      const titulaire = titulaires[0]; // mandataire = titulaire[0]
      if (titulaires.length > 1) multipleTitulaires++;

      const siret = extractTitulaireSiret(titulaire);
      if (!siret) {
        skipped++;
        continue;
      }
      const nom = extractTitulaireNom(titulaire);
      const siren = sirenFromSiret(siret);
      const groupe = SIREN_VERS_GROUPE[siren];
      const aggKey = groupe ?? siren;

      let entry = agg.get(aggKey);
      if (!entry) {
        const displayName = groupe ?? nom ?? `SIREN ${siren}`;
        entry = emptyAgg(displayName);
        agg.set(aggKey, entry);
      } else if (groupe && entry.raisonSociale !== groupe) {
        // Force le nom canonique pour les groupes
        entry.raisonSociale = groupe;
      }

      // Attribution : on attribue le montant total au mandataire (titulaire[0]).
      // C'est imparfait pour les groupements (2-3 % des marchés) mais largement
      // suffisant pour un top 100 où les écarts sont en ordres de grandeur.
      entry.totalMontantEur += montant;
      entry.nbMarches++;
      if (nature) {
        entry.natures.set(nature, (entry.natures.get(nature) ?? 0) + 1);
      }
      if (dateValid) {
        if (date < entry.premiereDate) entry.premiereDate = date;
        if (date > entry.derniereDate) entry.derniereDate = date;
      }

      processed++;
      if (processed % 200_000 === 0) {
        const sec = ((Date.now() - start) / 1000).toFixed(0);
        console.log(
          `[decp] ${processed.toLocaleString("fr-FR")} marchés agrégés, ` +
            `${agg.size.toLocaleString("fr-FR")} fournisseurs uniques (${sec}s)`,
        );
      }
    }
  }

  console.log(
    `[decp] fin parsing : ${processed.toLocaleString("fr-FR")} marchés valides, ` +
      `${skipped.toLocaleString("fr-FR")} skippés, ` +
      `${multipleTitulaires.toLocaleString("fr-FR")} groupements détectés, ` +
      `${agg.size.toLocaleString("fr-FR")} fournisseurs.`,
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

  const totalGeneral = Array.from(agg.values()).reduce(
    (acc, d) => acc + d.totalMontantEur,
    0,
  );

  const output = {
    generatedAt: new Date().toISOString(),
    sourceFiles: inputs.map((f) => path.basename(f)),
    totalMarches: processed,
    totalFournisseurs: agg.size,
    totalMontantEur: Math.round(totalGeneral),
    top100,
  };

  // Trouver frontend/src/data depuis n'importe quel CWD
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
    `[decp] Total agrégé : ${(totalGeneral / 1e9).toFixed(2)} Md€ sur ${processed.toLocaleString("fr-FR")} marchés.`,
  );

  if (top100.length > 0) {
    console.log(`\n[decp] Top 5 :`);
    for (let i = 0; i < Math.min(5, top100.length); i++) {
      const f = top100[i]!;
      console.log(
        `  #${f.rang.toString().padStart(2, " ")} ${f.raisonSociale.padEnd(30, " ")} ` +
          `${(f.totalMontantEur / 1e6).toFixed(1).padStart(8, " ")} M€ ` +
          `(${f.nbMarches.toLocaleString("fr-FR")} marchés)`,
      );
    }
  }
}

main().catch((e) => {
  console.error("[decp] FATAL :", e);
  process.exit(1);
});
