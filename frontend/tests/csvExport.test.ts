// Tests de l'utilitaire d'export CSV (RFC 4180).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toCsv, timeseriesToCsv, multiSeriesToCsv, objectsToCsv } from "../src/lib/csvExport.ts";

describe("toCsv", () => {
  it("génère un CSV minimal avec en-têtes + lignes", () => {
    const csv = toCsv({ headers: ["a", "b"], rows: [[1, 2], [3, 4]] });
    // Le BOM UTF-8 est attendu en tête
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("a,b\n"));
    assert.ok(csv.includes("1,2\n"));
    assert.ok(csv.includes("3,4\n"));
  });

  it("échappe les guillemets en doublant", () => {
    const csv = toCsv({ headers: ["x"], rows: [['He said "hi"']] });
    assert.ok(csv.includes('"He said ""hi"""'));
  });

  it("encadre par guillemets les cellules contenant une virgule", () => {
    const csv = toCsv({ headers: ["x"], rows: [["a, b, c"]] });
    assert.ok(csv.includes('"a, b, c"'));
  });

  it("encadre par guillemets les cellules contenant un retour à la ligne", () => {
    const csv = toCsv({ headers: ["x"], rows: [["multi\nligne"]] });
    assert.ok(csv.includes('"multi\nligne"'));
  });

  it("traite null et undefined comme cellules vides", () => {
    const csv = toCsv({ headers: ["a", "b"], rows: [[null, undefined]] });
    assert.ok(csv.includes(",\n") || csv.endsWith(",\n"));
  });
});

describe("timeseriesToCsv", () => {
  it("convertit une série temporelle en 2 colonnes", () => {
    const csv = timeseriesToCsv(
      [{ date: "2020-01-01", value: 100 }, { date: "2021-01-01", value: 110 }],
      "dette",
    );
    assert.equal(csv.headers.length, 2);
    assert.equal(csv.headers[1], "dette");
    assert.equal(csv.rows.length, 2);
    assert.equal(csv.rows[0]![0], "2020-01-01");
    assert.equal(csv.rows[0]![1], 100);
  });
});

describe("multiSeriesToCsv", () => {
  it("aligne plusieurs séries sur l'axe temps", () => {
    const series = [
      { id: "a", label: "A", points: [{ date: "2020", value: 1 }, { date: "2021", value: 2 }] },
      { id: "b", label: "B", points: [{ date: "2021", value: 20 }, { date: "2022", value: 30 }] },
    ];
    const csv = multiSeriesToCsv(series);
    assert.deepEqual(csv.headers, ["date", "A", "B"]);
    assert.equal(csv.rows.length, 3); // 2020, 2021, 2022
    // 2020 : A=1, B=null
    assert.equal(csv.rows[0]![0], "2020");
    assert.equal(csv.rows[0]![1], 1);
    assert.equal(csv.rows[0]![2], null);
    // 2021 : A=2, B=20
    assert.equal(csv.rows[1]![1], 2);
    assert.equal(csv.rows[1]![2], 20);
  });

  it("trie les dates par ordre croissant", () => {
    const csv = multiSeriesToCsv([{
      id: "a", label: "A",
      points: [{ date: "2022", value: 1 }, { date: "2020", value: 2 }, { date: "2021", value: 3 }],
    }]);
    const dates = csv.rows.map((r) => r[0]);
    assert.deepEqual(dates, ["2020", "2021", "2022"]);
  });
});

describe("objectsToCsv", () => {
  it("auto-déduit les en-têtes depuis le premier objet", () => {
    const csv = objectsToCsv([
      { categorie: "TVA", valeur: 100 },
      { categorie: "IR", valeur: 95 },
    ]);
    assert.deepEqual(csv.headers, ["categorie", "valeur"]);
    assert.equal(csv.rows.length, 2);
  });

  it("respecte un columnOrder explicite", () => {
    const csv = objectsToCsv(
      [{ a: 1, b: 2, c: 3 }],
      ["c", "a"],
    );
    assert.deepEqual(csv.headers, ["c", "a"]);
    assert.deepEqual(csv.rows[0], [3, 1]);
  });

  it("retourne CsvData vide si rows vide", () => {
    const csv = objectsToCsv([]);
    assert.deepEqual(csv.headers, []);
    assert.deepEqual(csv.rows, []);
  });
});
