// Tests d'intégrité des données historiques 1945-2025.
// Exécution : `node --experimental-strip-types --no-warnings --test pipeline/tests/historicalSeed.test.ts`
//
// Ces tests vérifient que le seed historique a une cohérence interne :
//  - couverture temporelle complète
//  - aucune valeur aberrante (négatif, NaN)
//  - dette/PIB cohérent avec les valeurs publiées
//  - séries mensuelles spread + composition cohérentes

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dettePoints,
  pibPoints,
  depensesPoints,
  recettesPoints,
  oatLongPoints,
  anneeMin,
  anneeMax,
} from "../src/historicalSeed.ts";

describe("historicalSeed", () => {
  it("couvre la période 1945-2025 sans trou", () => {
    assert.equal(anneeMin, 1945);
    assert.equal(anneeMax, 2025);
    assert.equal(dettePoints.length, anneeMax - anneeMin + 1);
    assert.equal(pibPoints.length, dettePoints.length);
    assert.equal(depensesPoints.length, dettePoints.length);
    assert.equal(recettesPoints.length, dettePoints.length);
    assert.equal(oatLongPoints.length, dettePoints.length);
  });

  it("toutes les valeurs sont strictement positives (sauf OAT qui peut être négatif)", () => {
    for (const p of dettePoints) assert.ok(p.value > 0, `dette ${p.date} <= 0`);
    for (const p of pibPoints) assert.ok(p.value > 0, `pib ${p.date} <= 0`);
    for (const p of depensesPoints) assert.ok(p.value > 0, `depenses ${p.date} <= 0`);
    for (const p of recettesPoints) assert.ok(p.value > 0, `recettes ${p.date} <= 0`);
  });

  it("aucune valeur n'est NaN ou Infinity", () => {
    const all = [...dettePoints, ...pibPoints, ...depensesPoints, ...recettesPoints, ...oatLongPoints];
    for (const p of all) {
      assert.ok(Number.isFinite(p.value), `${p.date} value is not finite: ${p.value}`);
    }
  });

  it("ratio dette/PIB est plausible (entre 15 % et 200 %)", () => {
    for (let i = 0; i < dettePoints.length; i++) {
      const ratio = dettePoints[i]!.value / pibPoints[i]!.value;
      assert.ok(
        ratio > 0.15 && ratio < 2.0,
        `Ratio dette/PIB anormal en ${dettePoints[i]!.date}: ${(ratio * 100).toFixed(1)}%`,
      );
    }
  });

  it("dette publique est croissante en tendance (ratio fin/début)", () => {
    const debut = dettePoints[0]!.value;
    const fin = dettePoints[dettePoints.length - 1]!.value;
    assert.ok(fin > debut * 50, `Dette n'a pas suffisamment augmenté : ${debut} → ${fin}`);
  });

  it("le PIB 2025 est de l'ordre de grandeur 2 800-3 000 Md€", () => {
    const pib2025 = pibPoints[pibPoints.length - 1]!.value / 1e9;
    assert.ok(pib2025 > 2_700 && pib2025 < 3_100, `PIB 2025 hors fourchette : ${pib2025} Md€`);
  });

  it("la dette 2025 est de l'ordre de 3 200-3 500 Md€", () => {
    const dette2025 = dettePoints[dettePoints.length - 1]!.value / 1e9;
    assert.ok(dette2025 > 3_100 && dette2025 < 3_600, `Dette 2025 hors fourchette : ${dette2025} Md€`);
  });

  it("les dates sont au format ISO YYYY-12-31 et triées", () => {
    for (let i = 0; i < dettePoints.length; i++) {
      const expected = `${anneeMin + i}-12-31`;
      assert.equal(dettePoints[i]!.date, expected);
    }
  });

  it("OAT 1981 reflète le pic d'inflation post-choc pétrolier", () => {
    const point = oatLongPoints.find((p) => p.date === "1981-12-31");
    assert.ok(point, "Point 1981 introuvable");
    assert.ok(point!.value >= 14 && point!.value <= 17, `OAT 1981 hors fourchette historique : ${point!.value} %`);
  });

  it("OAT 2020 reflète l'ère des taux négatifs (QE BCE)", () => {
    const point = oatLongPoints.find((p) => p.date === "2020-12-31");
    assert.ok(point, "Point 2020 introuvable");
    assert.ok(point!.value < 0.5, `OAT 2020 trop élevé : ${point!.value} %`);
  });
});
