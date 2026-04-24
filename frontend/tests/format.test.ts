// Tests des formatters côté frontend.
// Exécution : `node --experimental-strip-types --no-warnings --test frontend/tests/format.test.ts`

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatEurCompact,
  formatEurFull,
  formatPercent,
  formatPctPoints,
  formatGrouped,
  formatPerCapita,
  POPULATION_FRANCE,
} from "../src/lib/format.ts";

describe("formatEurCompact", () => {
  it("formate les milliards en Md€", () => {
    assert.match(formatEurCompact(3_460_000_000_000), /3,?\u202F?46/);
    assert.ok(formatEurCompact(3_460_000_000_000).includes("T€"));
  });

  it("formate les milliards en Md€ pour montants entre 1 et 1000 Md€", () => {
    const formatted = formatEurCompact(580_000_000_000);
    assert.ok(formatted.includes("Md€"), `Devrait inclure Md€ : ${formatted}`);
  });

  it("formate les millions en M€", () => {
    const formatted = formatEurCompact(50_000_000);
    assert.ok(formatted.includes("M€"), `Devrait inclure M€ : ${formatted}`);
  });

  it("formate les petites valeurs en €", () => {
    const formatted = formatEurCompact(500);
    assert.ok(formatted.includes("€") && !formatted.includes("Md") && !formatted.includes("M€"));
  });

  it("gère les valeurs négatives (déficit)", () => {
    const formatted = formatEurCompact(-175_000_000_000);
    assert.ok(formatted.includes("Md€"));
    assert.ok(formatted.includes("-") || formatted.includes("−"));
  });
});

describe("formatPercent", () => {
  it("formate un ratio en %", () => {
    assert.match(formatPercent(0.115), /11[,.]5\s*%/);
  });

  it("formate 100 % correctement", () => {
    assert.match(formatPercent(1.0), /100[,.]?0?\s*%/);
  });
});

describe("formatPctPoints", () => {
  it("formate des points de % directement", () => {
    assert.match(formatPctPoints(3.64), /3[,.]64\s*%/);
  });
});

describe("formatGrouped", () => {
  it("groupe les milliers", () => {
    const formatted = formatGrouped(1_234_567);
    // Doit contenir des séparateurs (espace insécable ou autre)
    assert.ok(formatted.length >= 9, `Trop court : ${formatted}`);
    assert.ok(/1\D234\D567/.test(formatted), `Format inattendu : ${formatted}`);
  });

  it("arrondit les décimales", () => {
    assert.ok(!formatGrouped(123.7).includes(","));
  });
});

describe("formatPerCapita", () => {
  it("calcule la dette par habitant", () => {
    // 3 460 Md€ ÷ 68,5 M = ~50 511 €/hab
    const formatted = formatPerCapita(3_460_000_000_000);
    assert.ok(formatted.includes("habitant"));
    // Vérifie que le chiffre est de l'ordre de grandeur attendu
    const numericPart = formatted.replace(/[^\d]/g, "");
    const value = parseInt(numericPart, 10);
    assert.ok(value > 49_000 && value < 52_000, `Hors fourchette : ${value} (formatted=${formatted})`);
  });

  it("constante POPULATION_FRANCE est ~68,5 M", () => {
    assert.equal(POPULATION_FRANCE, 68_500_000);
  });
});

describe("formatEurFull", () => {
  it("formate la valeur complète arrondie en €", () => {
    const formatted = formatEurFull(123_456.789);
    assert.ok(formatted.endsWith("€"));
    assert.ok(formatted.includes("123") && formatted.includes("457"));
  });
});
