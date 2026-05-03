// ============================================================================
// loadCommunes.ts — chargement des communes en base de données
// ============================================================================
//
// Ce loader peuple la table Commune + CommuneFinanciere depuis :
//   1. Les 40 villes du seed Phase 1 (frontend snapshot) — chargées au boot
//      si la table est vide
//   2. Le CSV DGFiP complet (~35 000 communes) — via le script séparé
//      `npx tsx src/seed/importDgfip.ts` (Phase 2 complète)
//
// L'idée : au démarrage, on garantit qu'il y a au moins les 40 villes seed
// pour que la page « Ma ville » fonctionne. L'import DGFiP enrichit ensuite.
// ============================================================================

import { prisma } from "../lib/db.ts";
import { readFile } from "node:fs/promises";

interface SnapshotVille {
  codeInsee: string;
  nom: string;
  departement: string;
  population: number;
  annees: {
    annee: number;
    budgetTotalEur: number;
    recettesTotalesEur: number;
    depensesTotalesEur: number;
    soldeBudgetaireEur: number;
    detteEncoursEur: number;
    capaciteAutofinancementEur: number;
    chargeDetteEur: number;
    amortissementCapitalEur?: number;  // optionnel pour rétrocompat avec snapshots anciens
    depensesInvestissementEur: number;
    depensesPersonnelEur: number;
  }[];
  compositionRecettes: {
    impotsLocauxPct: number;
    dotationsEtatPct: number;
    subventionsPct: number;
    recettesServicesPct: number;
    autresPct: number;
  };
  compositionDepenses: {
    personnelPct: number;
    chargesGeneralesPct: number;
    subventionsVerseesPct: number;
    chargesFinancieresPct: number;
    investissementPct: number;
  };
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

// Map département code → région (simplifié).
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
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
  "974": "La Réunion", "976": "Mayotte",
};

function regionFromDepartement(departement: string): string {
  // "Paris (75)" → "75"
  const m = departement.match(/\((\d{2,3}[AB]?)\)/);
  if (!m) return "Autre";
  return DEPT_TO_REGION[m[1]!] ?? "Autre";
}

function deptCode(departement: string): string {
  const m = departement.match(/\((\d{2,3}[AB]?)\)/);
  return m ? m[1]! : "00";
}

function pct(numerator: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((numerator / total) * 100).toFixed(2));
}

/**
 * Charge le snapshot data/budget.json et upsert les villes dans la DB
 * si la table Commune est vide.
 */
export async function loadCommunesIfNeeded(log: (msg: string) => void) {
  const count = await prisma.commune.count();
  if (count > 0) {
    log(`[communes] table déjà peuplée (${count} communes). Skip.`);
    return;
  }

  // Lire le snapshot JSON pour extraire les villes
  const snapshotPath = process.env.SNAPSHOT_PATH ?? "/data/budget.json";
  let villes: SnapshotVille[] = [];
  try {
    const raw = await readFile(snapshotPath, "utf-8");
    const snapshot = JSON.parse(raw) as { villes?: { items: SnapshotVille[] } };
    villes = snapshot.villes?.items ?? [];
  } catch (e) {
    log(`[communes] snapshot non trouvé (${(e as Error).message}). Skip.`);
    return;
  }

  if (villes.length === 0) {
    log("[communes] aucune ville dans le snapshot. Skip.");
    return;
  }

  log(`[communes] import de ${villes.length} villes depuis le snapshot…`);

  for (const v of villes) {
    const lastYear = v.annees[v.annees.length - 1]!;
    const region = regionFromDepartement(v.departement);
    const departementCode = deptCode(v.departement);

    await prisma.commune.upsert({
      where: { codeInsee: v.codeInsee },
      create: {
        codeInsee: v.codeInsee,
        nom: v.nom,
        slug: slugify(v.nom),
        departement: v.departement,
        departementCode,
        region,
        population: v.population,
        classification: classifyVille(v.population),
        metropole: METROPOLES_STATUTAIRES[v.codeInsee] ?? null,
      },
      update: {
        nom: v.nom,
        slug: slugify(v.nom),
        departement: v.departement,
        departementCode,
        region,
        population: v.population,
        classification: classifyVille(v.population),
        metropole: METROPOLES_STATUTAIRES[v.codeInsee] ?? null,
      },
    });

    // Insère l'historique année par année
    for (const a of v.annees) {
      // Calcule les composantes en valeurs absolues (depuis les pourcentages)
      const recettesImpots = (v.compositionRecettes.impotsLocauxPct / 100) * a.recettesTotalesEur;
      const recettesDotations = (v.compositionRecettes.dotationsEtatPct / 100) * a.recettesTotalesEur;
      const recettesSubventions = (v.compositionRecettes.subventionsPct / 100) * a.recettesTotalesEur;
      const recettesServices = (v.compositionRecettes.recettesServicesPct / 100) * a.recettesTotalesEur;

      const depensesGenerales = (v.compositionDepenses.chargesGeneralesPct / 100) * a.depensesTotalesEur;
      const depensesSubventions = (v.compositionDepenses.subventionsVerseesPct / 100) * a.depensesTotalesEur;

      await prisma.communeFinanciere.upsert({
        where: { codeInsee_annee: { codeInsee: v.codeInsee, annee: a.annee } },
        create: {
          codeInsee: v.codeInsee,
          annee: a.annee,
          recettesTotalesEur: BigInt(Math.round(a.recettesTotalesEur)),
          recettesFonctionnementEur: BigInt(Math.round(a.recettesTotalesEur * 0.85)),
          recettesInvestEur: BigInt(Math.round(a.recettesTotalesEur * 0.15)),
          depensesTotalesEur: BigInt(Math.round(a.depensesTotalesEur)),
          depensesFonctionnementEur: BigInt(Math.round(a.depensesTotalesEur - a.depensesInvestissementEur)),
          depensesInvestEur: BigInt(Math.round(a.depensesInvestissementEur)),
          soldeBudgetaireEur: BigInt(Math.round(a.soldeBudgetaireEur)),
          budgetTotalEur: BigInt(Math.round(a.budgetTotalEur)),
          detteEncoursEur: BigInt(Math.round(a.detteEncoursEur)),
          chargeDetteEur: BigInt(Math.round(a.chargeDetteEur)),
          // Si le snapshot ne fournit pas l'amortissement, on le calcule sur place
          // (1/15 de l'encours = durée moyenne d'amortissement OAT communale).
          amortissementCapitalEur: BigInt(
            Math.round(
              a.amortissementCapitalEur ?? a.detteEncoursEur / 15,
            ),
          ),
          capaciteAutofinancementEur: BigInt(Math.round(a.capaciteAutofinancementEur)),
          depensesPersonnelEur: BigInt(Math.round(a.depensesPersonnelEur)),
          depensesChargesGeneralesEur: BigInt(Math.round(depensesGenerales)),
          depensesSubventionsEur: BigInt(Math.round(depensesSubventions)),
          recettesImpotsLocauxEur: BigInt(Math.round(recettesImpots)),
          recettesDotationsEtatEur: BigInt(Math.round(recettesDotations)),
          recettesSubventionsEur: BigInt(Math.round(recettesSubventions)),
          recettesServicesEur: BigInt(Math.round(recettesServices)),
          compoRecettesImpotsPct: v.compositionRecettes.impotsLocauxPct,
          compoRecettesDotationsPct: v.compositionRecettes.dotationsEtatPct,
          compoRecettesSubvPct: v.compositionRecettes.subventionsPct,
          compoRecettesServicesPct: v.compositionRecettes.recettesServicesPct,
          compoRecettesAutresPct: v.compositionRecettes.autresPct,
          compoDepensesPersonnelPct: v.compositionDepenses.personnelPct,
          compoDepensesGeneralesPct: v.compositionDepenses.chargesGeneralesPct,
          compoDepensesSubvPct: v.compositionDepenses.subventionsVerseesPct,
          compoDepensesFinancieresPct: v.compositionDepenses.chargesFinancieresPct,
          compoDepensesInvestPct: v.compositionDepenses.investissementPct,
          source: "Phase 1 — seed villes (calibrées sur DGFiP comptes individuels 2024)",
        },
        update: {},
      });
    }
  }

  log(`[communes] import terminé : ${villes.length} communes.`);
}
