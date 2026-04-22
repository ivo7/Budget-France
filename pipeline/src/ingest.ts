// Entrée CLI du pipeline.
// Usage :
//   tsx src/ingest.ts                        # ingestion réelle, année courante
//   tsx src/ingest.ts --annee 2026           # année explicite
//   tsx src/ingest.ts --mock                 # seed uniquement (aucun appel réseau)
//   tsx src/ingest.ts --output ../data/budget.json

import { writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { buildSnapshot } from "./aggregator.ts";

interface Cli {
  annee: number;
  mock: boolean;
  output: string;
}

function parseArgs(argv: string[]): Cli {
  const now = new Date();
  const cli: Cli = {
    annee: now.getUTCFullYear(),
    mock: false,
    output: resolve(process.cwd(), "../data/budget.json"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mock") cli.mock = true;
    else if (a === "--annee" && argv[i + 1]) cli.annee = Number(argv[++i]);
    else if (a === "--output" && argv[i + 1]) cli.output = resolve(argv[++i]!);
  }
  return cli;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
  console.log(`[ingest] annee=${cli.annee} mock=${cli.mock} output=${cli.output}`);

  const snapshot = await buildSnapshot(cli.annee, { mock: cli.mock });

  await mkdir(dirname(cli.output), { recursive: true });
  // Écriture ATOMIQUE : tmp unique puis rename. Évite toute corruption si
  // deux processus écrivent simultanément (cas observé avec pipeline +
  // scheduler au démarrage). Le rename est atomique sur tous les FS POSIX.
  const tmp = `${cli.output}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(snapshot, null, 2), "utf8");
  await rename(tmp, cli.output);

  const ok = snapshot.sources.filter((s) => s.status === "ok").length;
  const fb = snapshot.sources.filter((s) => s.status === "fallback").length;
  const err = snapshot.sources.filter((s) => s.status === "error").length;

  const gigaEur = (v: number) => (v / 1e9).toFixed(0) + " Md€";
  console.log(`[ingest] dette publique   : ${gigaEur(snapshot.dettePublique.value)} (${snapshot.dettePublique.source.id})`);
  console.log(`[ingest] PIB              : ${gigaEur(snapshot.pib.value)} (${snapshot.pib.source.id})`);
  console.log(`[ingest] ratio dette/PIB  : ${(snapshot.ratioDettePib.value * 100).toFixed(1)} %`);
  console.log(`[ingest] taux OAT 10 ans  : ${snapshot.tauxOat10ans.value.toFixed(2)} % (${snapshot.tauxOat10ans.source.id})`);
  console.log(`[ingest] vitesse endett.  : ${snapshot.vitesseEndettementEurParSec.value.toFixed(0)} €/s`);
  console.log(`[ingest] sources          : ${ok} ok / ${fb} fallback / ${err} erreur`);
  console.log(`[ingest] terminé en ${Date.now() - startedAt} ms -> ${cli.output}`);
}

main().catch((e) => {
  console.error("[ingest] erreur fatale :", e);
  process.exit(1);
});
