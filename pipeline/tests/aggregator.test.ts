// Tests d'intégration de l'agrégateur en mode mock.
// Vérifie que le snapshot produit a la structure attendue côté frontend.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/aggregator.ts";

describe("aggregator (mode mock)", () => {
  it("produit un snapshot avec toutes les clefs top-level requises", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const requiredKeys = [
      "generatedAt", "annee",
      "budgetPrevisionnel", "recettesPrevisionnelles", "budgetExecute", "soldeBudgetaire",
      "dettePublique", "pib", "ratioDettePib",
      "tauxOat10ans", "tauxDirecteurBce",
      "vitesseEndettementEurParSec", "vitesseDepensesEurParSec",
      "series", "executionCourante", "repartition",
      "compositionHistorique", "fraudes",
      "comparaisonsEuropeennes", "spreadOatBund",
      "ratings", "events",
      "secuCollectivites", "historiqueDetaille",
      "sources",
    ];
    for (const k of requiredKeys) {
      assert.ok(k in snap, `Clef manquante : ${k}`);
    }
  });

  it("vitesseDepensesEurParSec correspond à budgetPrevisionnel ÷ secondes/an", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const expected = snap.budgetPrevisionnel.value / (365 * 86_400);
    const actual = snap.vitesseDepensesEurParSec.value;
    // Tolérance 1 % (arrondi possible)
    assert.ok(
      Math.abs(actual - expected) / expected < 0.01,
      `Vitesse dépenses incohérente : ${actual} vs ${expected}`,
    );
  });

  it("ratio dette/PIB calculé est identique à dette / PIB", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const expected = snap.dettePublique.value / snap.pib.value;
    assert.ok(Math.abs(snap.ratioDettePib.value - expected) < 0.001);
  });

  it("séries longues couvrent 1945-2025 (81 points annuels)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.equal(snap.series.detteLongue?.points.length, 81);
    assert.equal(snap.series.pibLongue?.points.length, 81);
    assert.equal(snap.series.recettesLongue?.points.length, 81);
    assert.equal(snap.series.depensesLongue?.points.length, 81);
    assert.equal(snap.series.oatLongue?.points.length, 81);
  });

  it("missions historiques contiennent au moins 12 ministères", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.ok((snap.historiqueDetaille?.missions.length ?? 0) >= 12);
  });

  it("composition historique couvre recettes (≥4) et dépenses (≥6)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.ok(snap.compositionHistorique.recettes.length >= 4);
    assert.ok(snap.compositionHistorique.depenses.length >= 6);
  });

  it("3 agences de notation présentes (S&P, Moody's, Fitch)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.equal(snap.ratings.agencies.length, 3);
    const ids = snap.ratings.agencies.map((a) => a.id).sort();
    assert.deepEqual(ids, ["fitch", "moodys", "sp"]);
  });

  it("comparaisons européennes : 5 pays (FR, DE, IT, ES, EA)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.equal(snap.comparaisonsEuropeennes.detteRatio.length, 5);
    assert.equal(snap.comparaisonsEuropeennes.solde.length, 5);
  });

  it("Sécu : 6 branches (retraite, maladie, famille, atmp, autonomie, chomage)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    assert.equal(snap.secuCollectivites.secu.branches.length, 6);
  });

  it("toutes les sources ont un id, label et url", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    for (const s of snap.sources) {
      assert.ok(s.id, "source sans id");
      assert.ok(s.label, "source sans label");
      assert.ok(s.url !== undefined, "source sans url définie");
    }
  });

  it("événements historiques contiennent les jalons attendus", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const dates = snap.events.items.map((e) => e.date);
    assert.ok(dates.some((d) => d.startsWith("1954")), "Création TVA 1954 manquante");
    assert.ok(dates.some((d) => d.startsWith("1992")), "Maastricht 1992 manquant");
    assert.ok(dates.some((d) => d.startsWith("2008")), "Crise 2008 manquante");
    assert.ok(dates.some((d) => d.startsWith("2020")), "COVID 2020 manquant");
  });
});
