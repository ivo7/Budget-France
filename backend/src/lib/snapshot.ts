import { readFile } from "node:fs/promises";
import { config } from "./config.ts";

export interface SnapshotLite {
  generatedAt: string;
  annee: number;
  dettePublique: { value: number; asOf: string };
  pib: { value: number };
  ratioDettePib: { value: number };
  tauxOat10ans: { value: number; asOf: string };
  tauxDirecteurBce: { value: number };
  vitesseEndettementEurParSec: { value: number };
  budgetPrevisionnel: { value: number };
  recettesPrevisionnelles: { value: number };
  soldeBudgetaire: { value: number };
}

export async function readSnapshot(): Promise<SnapshotLite | null> {
  try {
    const raw = await readFile(config.snapshotPath, "utf8");
    return JSON.parse(raw) as SnapshotLite;
  } catch (e) {
    console.warn(`[snapshot] impossible de lire ${config.snapshotPath}: ${(e as Error).message}`);
    return null;
  }
}
