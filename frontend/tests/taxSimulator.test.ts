// Tests du simulateur fiscal — barème IR 2024 + ventilation.
// Référence : impots.gouv.fr — barème par tranche pour 1 part fiscale.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { simulateTaxes, allocateAcrossMissions } from "../src/lib/taxSimulator.ts";

describe("simulateTaxes (barème IR 2024)", () => {
  it("revenu nul → impôts nuls", () => {
    const r = simulateTaxes(0);
    assert.equal(r.ir, 0);
    assert.equal(r.tva, 0);
    assert.equal(r.totalEtat, 0);
    assert.equal(r.effectiveRate, 0);
  });

  it("revenu très faible (sous le seuil 11 294 €) → IR nul", () => {
    // 800 € net/mois × 12 = 9 600 €, sous le seuil après abattement
    const r = simulateTaxes(800);
    assert.equal(r.ir, 0);
    // Mais il y a quand même TVA + taxes indirectes
    assert.ok(r.totalEtat > 0);
  });

  it("smic mensuel net (~1 400 €) → IR très faible", () => {
    const r = simulateTaxes(1_400);
    // 1 400 × 12 = 16 800 € brut imposable - abattement = ~15 120 €
    // Tranche à 11 % sur (15 120 - 11 294) = ~3 826 € → IR ~421 €
    assert.ok(r.ir < 600, `IR trop élevé pour smic : ${r.ir}`);
    assert.ok(r.ir > 200, `IR trop bas pour smic : ${r.ir}`);
  });

  it("salaire moyen 3 000 € net/mois → IR autour de 2 000 €", () => {
    const r = simulateTaxes(3_000);
    // 3 000 × 12 = 36 000 € - abattement 3 600 = 32 400 €
    // Tranches : 0% jusqu'à 11 294, 11% jusqu'à 28 797, 30% au-delà
    // (28 797 - 11 294) × 0.11 + (32 400 - 28 797) × 0.30 = 1 925 + 1 081 = ~3 006 €
    assert.ok(r.ir > 2_500 && r.ir < 3_500, `IR hors fourchette : ${r.ir}`);
  });

  it("salaire élevé 8 000 € net/mois → IR significatif (taux 30 %)", () => {
    const r = simulateTaxes(8_000);
    // 8 000 × 12 = 96 000 € - abattement 9 600 = 86 400 €
    // Au-delà de 82 341 = tranche 41 %
    assert.ok(r.ir > 18_000, `IR trop bas pour 8000€/mois : ${r.ir}`);
    assert.ok(r.ir < 25_000, `IR trop élevé : ${r.ir}`);
  });

  it("très haut revenu → tranche 45 % atteinte", () => {
    const r = simulateTaxes(20_000);
    // 240 000 € net annuel, dépasse le seuil 177 106 €
    assert.ok(r.ir > 70_000);
    assert.ok(r.ir < 110_000);
  });

  it("taux effectif est progressif (croît avec le revenu)", () => {
    const t1 = simulateTaxes(2_000).effectiveRate;
    const t2 = simulateTaxes(5_000).effectiveRate;
    const t3 = simulateTaxes(10_000).effectiveRate;
    assert.ok(t1 < t2, `Effectif non progressif : ${t1} >= ${t2}`);
    assert.ok(t2 < t3, `Effectif non progressif : ${t2} >= ${t3}`);
  });

  it("TVA estimée à 7 % du revenu net", () => {
    const r = simulateTaxes(3_000);
    const expected = 3_000 * 12 * 0.07;
    assert.ok(Math.abs(r.tva - expected) < 0.01);
  });

  it("revenu négatif est traité comme 0", () => {
    const r = simulateTaxes(-100);
    assert.equal(r.annualNetIncome, 0);
    assert.equal(r.totalEtat, 0);
  });
});

describe("allocateAcrossMissions", () => {
  const missions = [
    { categorie: "Education", valeur: 80e9 },
    { categorie: "Defense", valeur: 50e9 },
    { categorie: "Dette", valeur: 60e9 },
    { categorie: "Autres", valeur: 390e9 },
  ];

  it("la somme des allocations égale le total contribué", () => {
    const total = 5_000;
    const allocations = allocateAcrossMissions(total, missions);
    const sum = allocations.reduce((a, b) => a + b.contribution, 0);
    assert.ok(Math.abs(sum - total) < 0.01, `Somme ${sum} ≠ ${total}`);
  });

  it("la somme des parts est égale à 1 (100 %)", () => {
    const allocations = allocateAcrossMissions(1, missions);
    const sumParts = allocations.reduce((a, b) => a + b.part, 0);
    assert.ok(Math.abs(sumParts - 1) < 0.001);
  });

  it("missions sont triées par contribution décroissante", () => {
    const allocations = allocateAcrossMissions(1000, missions);
    for (let i = 0; i < allocations.length - 1; i++) {
      assert.ok(allocations[i]!.contribution >= allocations[i + 1]!.contribution);
    }
  });

  it("retourne un tableau vide si missions vides ou total nul", () => {
    assert.deepEqual(allocateAcrossMissions(100, []), []);
    assert.deepEqual(allocateAcrossMissions(100, [{ categorie: "X", valeur: 0 }]), []);
  });
});
