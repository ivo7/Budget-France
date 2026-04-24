// ============================================================================
// Inflation France 1945-2025 — Indice des prix à la consommation
// ============================================================================
//
// Source : INSEE — Indice des prix à la consommation (IPC), variation annuelle
//   https://www.insee.fr/fr/statistiques/serie/001769682
//
// Permet de calculer le TAUX D'INTÉRÊT RÉEL = OAT 10 ans − Inflation.
// Concept clé en SES : un taux nominal de 5 % avec inflation à 4 % donne un
// taux réel de 1 %. Quand le taux réel est NÉGATIF (cas des années 70 et de
// 2021-2022), l'État se "désendette" en termes réels malgré le déficit
// nominal — c'est l'effet de la "répression financière".

import type { TimeseriesPoint } from "./types.ts";
import { anneeMin, anneeMax } from "./historicalSeed.ts";

// Inflation annuelle France (%) — moyennes annuelles INSEE
const inflationLandmarks: [number, number][] = [
  [1945, 38],   // sortie de guerre, hyperinflation
  [1946, 53],   // pic
  [1947, 50],
  [1948, 56],
  [1949, 13],
  [1950, 10],
  [1951, 16],
  [1952, 12],
  [1953, -1.7],
  [1954, 0.4],
  [1955, 1.0],
  [1956, 4.2],
  [1957, 3.0],
  [1958, 15],   // dévaluation franc
  [1959, 6],
  [1960, 3.6],
  [1961, 3.4],
  [1962, 4.7],
  [1963, 4.8],
  [1964, 3.4],
  [1965, 2.6],
  [1966, 2.7],
  [1967, 2.7],
  [1968, 4.4],
  [1969, 6.5],
  [1970, 5.3],
  [1971, 5.5],
  [1972, 6.2],
  [1973, 7.3],   // 1er choc pétrolier
  [1974, 13.7],  // pic post-choc
  [1975, 11.8],
  [1976, 9.6],
  [1977, 9.4],
  [1978, 9.1],
  [1979, 10.8],  // 2e choc pétrolier
  [1980, 13.6],
  [1981, 13.4],
  [1982, 11.8],
  [1983, 9.6],
  [1984, 7.4],
  [1985, 5.8],
  [1986, 2.7],   // désinflation Mitterrand
  [1987, 3.1],
  [1988, 2.7],
  [1989, 3.6],
  [1990, 3.4],
  [1991, 3.2],
  [1992, 2.4],
  [1993, 2.1],
  [1994, 1.7],
  [1995, 1.8],
  [1996, 2.0],
  [1997, 1.2],
  [1998, 0.7],
  [1999, 0.5],
  [2000, 1.7],
  [2001, 1.6],
  [2002, 1.9],
  [2003, 2.1],
  [2004, 2.1],
  [2005, 1.7],
  [2006, 1.7],
  [2007, 1.5],
  [2008, 2.8],
  [2009, 0.1],   // crise financière + déflation
  [2010, 1.5],
  [2011, 2.1],
  [2012, 2.0],
  [2013, 0.9],
  [2014, 0.5],
  [2015, 0.0],
  [2016, 0.2],
  [2017, 1.0],
  [2018, 1.8],
  [2019, 1.1],
  [2020, 0.5],   // COVID, faible
  [2021, 1.6],
  [2022, 5.2],   // guerre Ukraine, énergie
  [2023, 4.9],
  [2024, 2.0],   // retour normalisé
  [2025, 1.9],
];

export const inflationPoints: TimeseriesPoint[] = (() => {
  const out: TimeseriesPoint[] = [];
  const map = new Map(inflationLandmarks);
  for (let y = anneeMin; y <= anneeMax; y++) {
    out.push({ date: `${y}-12-31`, value: map.get(y) ?? 0 });
  }
  return out;
})();

export const inflationSourceLabel = "INSEE — Indice des prix à la consommation (IPC)";
export const inflationSourceUrl = "https://www.insee.fr/fr/statistiques/serie/001769682";
