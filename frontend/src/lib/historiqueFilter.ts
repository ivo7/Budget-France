// Filtre qui tronque toutes les séries d'un BudgetSnapshot pour ne garder que
// les millésimes strictement antérieurs à `capYear`. Utilisé par la page
// Historique pour garantir que 2026 (année prévisionnelle en cours) n'apparaît
// jamais sur des graphiques censés ne montrer que des exercices clos.

import type { BudgetSnapshot, TimeseriesPoint, Timeseries } from "../types";

function yearOf(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

function filterPoints(points: TimeseriesPoint[], capYear: number): TimeseriesPoint[] {
  return points.filter((p) => yearOf(p.date) < capYear);
}

function filterTimeseries<T extends Timeseries | undefined>(ts: T, capYear: number): T {
  if (!ts) return ts;
  return { ...ts, points: filterPoints(ts.points, capYear) } as T;
}

export function filterBudgetForHistorique(
  snapshot: BudgetSnapshot,
  capYear: number,
): BudgetSnapshot {
  return {
    ...snapshot,
    series: {
      ...snapshot.series,
      detteHistorique: filterTimeseries(snapshot.series.detteHistorique, capYear),
      soldeHistorique: filterTimeseries(snapshot.series.soldeHistorique, capYear),
      tauxOatHistorique: filterTimeseries(snapshot.series.tauxOatHistorique, capYear),
      detteLongue: filterTimeseries(snapshot.series.detteLongue, capYear),
      pibLongue: filterTimeseries(snapshot.series.pibLongue, capYear),
      depensesLongue: filterTimeseries(snapshot.series.depensesLongue, capYear),
      recettesLongue: filterTimeseries(snapshot.series.recettesLongue, capYear),
      oatLongue: filterTimeseries(snapshot.series.oatLongue, capYear),
    },
    compositionHistorique: snapshot.compositionHistorique
      ? {
          recettes: snapshot.compositionHistorique.recettes.map((c) => ({
            ...c,
            points: filterPoints(c.points, capYear),
          })),
          depenses: snapshot.compositionHistorique.depenses.map((c) => ({
            ...c,
            points: filterPoints(c.points, capYear),
          })),
        }
      : undefined,
    fraudes: snapshot.fraudes
      ? {
          ...snapshot.fraudes,
          fiscale: filterPoints(snapshot.fraudes.fiscale, capYear),
          sociale: filterPoints(snapshot.fraudes.sociale, capYear),
        }
      : undefined,
    historiqueDetaille: snapshot.historiqueDetaille
      ? {
          ...snapshot.historiqueDetaille,
          secuDepenses: filterPoints(snapshot.historiqueDetaille.secuDepenses, capYear),
          secuRecettes: filterPoints(snapshot.historiqueDetaille.secuRecettes, capYear),
          collecDepenses: filterPoints(snapshot.historiqueDetaille.collecDepenses, capYear),
          collecRecettes: filterPoints(snapshot.historiqueDetaille.collecRecettes, capYear),
          missions: snapshot.historiqueDetaille.missions.map((m) => ({
            ...m,
            points: filterPoints(m.points, capYear),
          })),
        }
      : undefined,
  };
}
