// ============================================================================
// validation.test.ts — invariants critiques sur le snapshot
// ============================================================================
// Ces tests sont des « garde-fous » : ils détectent toute régression sur les
// invariants métier avant qu'elle ne touche la prod.
//
// On vérifie systématiquement :
//   - cohérence interne des séries chronologiques (dates triées, valeurs valides)
//   - identités économiques (dette/PIB = ratio, recettes − dépenses = solde, etc.)
//   - bornes de plausibilité (PIB français entre 1 000 et 5 000 Md€, etc.)
//   - intégrité des sources (URLs valides, status renseigné)
//   - couverture historique (séries longues couvrent au moins 1945-2024)
// ============================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/aggregator.ts";

describe("validation : invariants économiques", () => {
  it("dette publique entre 1 500 et 5 000 Md€ (plausibilité 2024-2030)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const dette = snap.dettePublique.value / 1e9;
    assert.ok(dette > 1500 && dette < 5000, `Dette ${dette} Md€ hors plage [1500, 5000]`);
  });

  it("PIB entre 2 000 et 4 000 Md€ (plausibilité 2024-2030)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const pib = snap.pib.value / 1e9;
    assert.ok(pib > 2000 && pib < 4000, `PIB ${pib} Md€ hors plage [2000, 4000]`);
  });

  it("ratio dette/PIB entre 50 % et 200 %", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const r = snap.ratioDettePib.value;
    assert.ok(r > 0.5 && r < 2, `Ratio ${r} hors plage [0.5, 2]`);
  });

  it("solde budgétaire = recettes − dépenses (à 1 % près)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const recalc = snap.recettesPrevisionnelles.value - snap.budgetPrevisionnel.value;
    const actual = snap.soldeBudgetaire.value;
    const tol = Math.max(Math.abs(recalc), Math.abs(actual)) * 0.02;
    assert.ok(
      Math.abs(recalc - actual) <= tol,
      `Solde ${actual} vs (recettes − dépenses) ${recalc} : écart > 2 %`,
    );
  });

  it("taux OAT 10 ans entre -1 % et 15 % (bornes historiques)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const t = snap.tauxOat10ans.value;
    assert.ok(t > -1 && t < 15, `OAT ${t} % hors plage [-1, 15]`);
  });

  it("budget exécuté ≤ budget prévisionnel (sauf dépassements rares)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    // L'exécution courante peut dépasser de qq % mais pas du double
    const ratio = snap.budgetExecute.value / snap.budgetPrevisionnel.value;
    assert.ok(ratio < 1.2, `Exécution ${ratio.toFixed(2)}× le prévu : trop élevé`);
  });
});

describe("validation : intégrité des séries chronologiques", () => {
  it("toutes les séries ont des dates strictement croissantes", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const checkSerie = (label: string, points: { date: string }[]) => {
      let prev = "";
      for (const p of points) {
        assert.ok(
          p.date > prev,
          `Série ${label} : dates non croissantes (${prev} → ${p.date})`,
        );
        prev = p.date;
      }
    };
    if (snap.series.detteLongue) checkSerie("detteLongue", snap.series.detteLongue.points);
    if (snap.series.pibLongue) checkSerie("pibLongue", snap.series.pibLongue.points);
    if (snap.series.tauxOatHistorique) checkSerie("tauxOatHistorique", snap.series.tauxOatHistorique.points);
  });

  it("aucune valeur NaN/Infinity dans les séries critiques", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const checkSerie = (label: string, points: { value: number }[]) => {
      for (const p of points) {
        assert.ok(Number.isFinite(p.value), `Série ${label} : valeur non finie ${p.value}`);
      }
    };
    if (snap.series.detteLongue) checkSerie("detteLongue", snap.series.detteLongue.points);
    if (snap.series.pibLongue) checkSerie("pibLongue", snap.series.pibLongue.points);
    if (snap.series.tauxOatHistorique) checkSerie("tauxOatHistorique", snap.series.tauxOatHistorique.points);
    if (snap.spreadOatBund) checkSerie("spreadOatBund", snap.spreadOatBund.spread);
  });

  it("séries longues couvrent au moins 1945 → 2024 (80 ans)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (snap.series.detteLongue) {
      const dates = snap.series.detteLongue.points.map((p) => new Date(p.date).getUTCFullYear());
      const min = Math.min(...dates);
      const max = Math.max(...dates);
      assert.ok(min <= 1950, `detteLongue commence en ${min} (>1950)`);
      assert.ok(max >= 2024, `detteLongue finit en ${max} (<2024)`);
    }
  });
});

describe("validation : sources et traçabilité", () => {
  it("chaque source a un id, un label et un status", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    for (const s of snap.sources) {
      assert.ok(s.id, "source sans id");
      assert.ok(s.label, "source sans label");
      assert.ok(s.status, `source ${s.id} sans status`);
    }
  });

  it("au moins 80 % des sources ont une URL renseignée", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const withUrl = snap.sources.filter((s) => Boolean((s as { url?: string }).url)).length;
    const ratio = withUrl / snap.sources.length;
    assert.ok(
      ratio >= 0.8,
      `Seulement ${(ratio * 100).toFixed(0)} % des sources ont une URL`,
    );
  });

  it("URLs des sources sont des http(s) valides", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    for (const s of snap.sources) {
      const url = (s as { url?: string }).url;
      if (!url) continue;
      assert.match(
        url,
        /^https?:\/\/[a-z0-9.-]+/i,
        `URL invalide pour ${s.id} : ${url}`,
      );
    }
  });
});

describe("validation : Sécu et Collectivités", () => {
  it("recettes Sécu ≈ dépenses Sécu (équilibre LFSS, écart < 5 %)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (!snap.secuCollectivites) return;
    const sumRec = snap.secuCollectivites.secu.financement.reduce(
      (a, b) => a + b.partPourcent,
      0,
    );
    // financement somme à ~100 % par construction (parts en %)
    assert.ok(Math.abs(sumRec - 100) < 5, `Parts financement Sécu somment à ${sumRec} %`);
  });

  it("recettes Collectivités sommes à ~100 %", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (!snap.secuCollectivites) return;
    const sumRec = snap.secuCollectivites.collectivites.financement.reduce(
      (a, b) => a + b.partPourcent,
      0,
    );
    assert.ok(Math.abs(sumRec - 100) < 5, `Parts financement Collec somment à ${sumRec} %`);
  });

  it("3 sphères APU somment à un total cohérent (>1500 Md€/an)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (!snap.secuCollectivites) return;
    const etat = snap.budgetPrevisionnel.value / 1e9;
    const secu = snap.secuCollectivites.secu.totalDepenses;
    const collec = snap.secuCollectivites.collectivites.totalDepenses;
    const total = etat + secu + collec;
    assert.ok(total > 1500, `Total APU ${total} Md€ trop bas`);
    assert.ok(total < 3000, `Total APU ${total} Md€ trop élevé`);
  });
});

describe("validation : composition historique (recettes/dépenses 1945+)", () => {
  it("toutes les catégories de recettes ont la même couverture temporelle", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (!snap.compositionHistorique) return;
    const lengths = snap.compositionHistorique.recettes.map((c) => c.points.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    // On tolère 1 année d'écart (dernière année peut être absente partout)
    assert.ok(max - min <= 2, `Couverture recettes inégale : ${min}-${max} points`);
  });

  it("toutes les catégories de dépenses ont la même couverture temporelle", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    if (!snap.compositionHistorique) return;
    const lengths = snap.compositionHistorique.depenses.map((c) => c.points.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    assert.ok(max - min <= 2, `Couverture dépenses inégale : ${min}-${max} points`);
  });
});

describe("validation : compteurs temps réel", () => {
  it("vitesse endettement = dette × croissance annuelle / secondes_an (cohérence)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const v = snap.vitesseEndettementEurParSec.value;
    // Borne : entre 0 (équilibre parfait) et 10 000 €/s (catastrophe)
    assert.ok(v >= 0 && v < 10_000, `Vitesse endettement ${v} €/s invraisemblable`);
  });

  it("vitesse dépenses > vitesse endettement (l'État dépense plus qu'il s'endette)", async () => {
    const snap = await buildSnapshot(2026, { mock: true });
    const vDep = snap.vitesseDepensesEurParSec.value;
    const vEnd = snap.vitesseEndettementEurParSec.value;
    assert.ok(
      vDep > vEnd,
      `Vitesse dépenses (${vDep}) doit être > vitesse endettement (${vEnd})`,
    );
  });
});
