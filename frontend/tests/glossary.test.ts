// Tests sur le système de glossaire cliquable.
// Vérifie que findGlossaryEntry trouve les termes par leurs différentes formes.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findGlossaryEntry, termeSlug, GLOSSAIRE } from "../src/components/Glossary";

describe("Glossary lookup", () => {
  it("trouve un terme par son nom complet", () => {
    const r = findGlossaryEntry("Produit Intérieur Brut");
    assert.ok(r, "PIB introuvable par nom complet");
    assert.equal(r!.entry.abbr, "PIB");
  });

  it("trouve un terme par son abréviation", () => {
    const r = findGlossaryEntry("PIB");
    assert.ok(r, "PIB introuvable par abréviation");
  });

  it("trouve un terme insensiblement à la casse", () => {
    const r = findGlossaryEntry("pib");
    assert.ok(r, "PIB introuvable en minuscules");
  });

  it("trouve OAT par abréviation", () => {
    const r = findGlossaryEntry("OAT");
    assert.ok(r, "OAT introuvable");
  });

  it("renvoie null pour un terme inconnu", () => {
    const r = findGlossaryEntry("XYZ_INEXISTANT");
    assert.equal(r, null);
  });

  it("termeSlug gère les accents et la ponctuation", () => {
    assert.equal(termeSlug("Ratio dette / PIB"), "ratio-dette-pib");
    assert.equal(termeSlug("Sécurité sociale"), "securite-sociale");
    assert.equal(termeSlug("OAT"), "oat");
  });

  it("le glossaire contient au moins 50 entrées", () => {
    const total = GLOSSAIRE.reduce((a, c) => a + c.entrees.length, 0);
    assert.ok(total >= 50, `Glossaire trop petit : ${total} entrées`);
  });

  it("toutes les entrées ont une définition non vide", () => {
    for (const cat of GLOSSAIRE) {
      for (const e of cat.entrees) {
        assert.ok(
          e.definition && e.definition.length >= 30,
          `Définition trop courte pour ${e.terme}: ${e.definition?.length ?? 0} chars`,
        );
      }
    }
  });
});
