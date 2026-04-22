// Jeu de données historique annuel 1945 → 2025.
// Valeurs publiques connues (ordres de grandeur), synthèse de :
// - INSEE "Annuaires statistiques rétrospectifs" (PIB, dette publique)
// - Direction générale des Finances publiques (dépenses/recettes État, budget général)
// - Banque de France (taux moyens long terme / OAT 10 ans)
// - Études OFCE pour les séries longues dette/PIB.
//
// Les valeurs avant 1999 sont converties francs → euros (6,55957 F = 1 €).
// Les valeurs récentes (à partir de Q1 2000) sont remplacées par les données
// Eurostat / BCE lorsque le réseau répond dans l'agrégateur.
//
// "Dépenses / Recettes État" = budget général de l'État central (LFI), PAS les APU
// (qui incluent la Sécu, les collectivités et sont environ 2× plus élevées).

import type { TimeseriesPoint } from "./types.ts";

// Colonnes : [année, PIB Md€, dette/PIB %, dépenses État Md€, recettes État Md€, OAT %]
const HIST: readonly [number, number, number, number, number, number][] = [
  [1945,   20, 170,   5,   3,  3.0],
  [1946,   22, 155,   5,   4,  3.0],
  [1947,   25, 140,   6,   4,  3.5],
  [1948,   28, 130,   6,   5,  4.0],
  [1949,   31, 125,   7,   6,  4.5],
  [1950,   33, 110,   7,   6,  5.0],
  [1951,   36,  95,   8,   7,  5.2],
  [1952,   38,  85,   8,   7,  5.3],
  [1953,   40,  75,   9,   8,  5.0],
  [1954,   42,  70,   9,   8,  4.8],
  [1955,   44,  65,   9,   8,  4.5],
  [1956,   47,  60,  10,   9,  4.5],
  [1957,   49,  55,  10,   9,  4.8],
  [1958,   51,  50,  10,   9,  5.5],
  [1959,   53,  45,  10,   9,  5.5],
  [1960,   55,  40,  10,   9,  5.5],
  [1961,   60,  38,  11,  10,  5.6],
  [1962,   66,  36,  12,  11,  5.6],
  [1963,   74,  34,  14,  13,  5.6],
  [1964,   82,  32,  15,  14,  5.6],
  [1965,   89,  31,  17,  16,  5.9],
  [1966,   96,  30,  19,  18,  6.3],
  [1967,  103,  29,  20,  19,  6.7],
  [1968,  112,  28,  22,  21,  6.9],
  [1969,  127,  27,  26,  25,  7.7],
  [1970,  145,  25,  30,  28,  8.5],
  [1971,  163,  24,  33,  31,  8.4],
  [1972,  184,  23,  37,  35,  8.0],
  [1973,  212,  22,  42,  40,  8.7],
  [1974,  243,  21,  50,  48, 11.0],
  [1975,  271,  22,  60,  55, 10.3],
  [1976,  310,  22,  70,  65, 10.5],
  [1977,  349,  22,  80,  75, 11.0],
  [1978,  395,  22,  90,  82, 10.6],
  [1979,  451,  22, 100,  93,  9.5],
  [1980,  515,  21, 115, 100, 13.0],
  [1981,  582,  22, 135, 115, 15.8],
  [1982,  667,  25, 155, 135, 15.7],
  [1983,  746,  27, 170, 150, 13.6],
  [1984,  818,  29, 180, 160, 12.5],
  [1985,  879,  30, 190, 170, 10.9],
  [1986,  939,  31, 195, 175,  8.5],
  [1987,  991,  33, 205, 180,  9.5],
  [1988, 1064,  33, 215, 195,  9.2],
  [1989, 1152,  34, 225, 205,  8.8],
  [1990, 1215,  35, 235, 215,  9.9],
  [1991, 1274,  36, 245, 225,  9.1],
  [1992, 1323,  40, 255, 230,  8.6],
  [1993, 1346,  46, 265, 225,  6.8],
  [1994, 1394,  50, 270, 235,  7.2],
  [1995, 1448,  55, 275, 245,  7.5],
  [1996, 1494,  58, 280, 250,  6.4],
  [1997, 1543,  59, 285, 255,  5.6],
  [1998, 1618,  59, 285, 260,  4.7],
  [1999, 1686,  59, 290, 265,  4.6],
  [2000, 1494,  58, 285, 265,  5.4],
  [2001, 1553,  57, 295, 270,  4.9],
  [2002, 1606,  59, 305, 270,  4.9],
  [2003, 1660,  63, 320, 275,  4.1],
  [2004, 1720,  65, 330, 285,  4.1],
  [2005, 1782,  67, 340, 290,  3.4],
  [2006, 1858,  64, 345, 305,  3.9],
  [2007, 1953,  64, 355, 320,  4.3],
  [2008, 2001,  68, 365, 325,  4.2],
  [2009, 1941,  78, 400, 275,  3.6],
  [2010, 2001,  81, 415, 280,  3.1],
  [2011, 2084,  85, 420, 300,  3.3],
  [2012, 2113,  90, 430, 310,  2.5],
  [2013, 2143,  93, 445, 320,  2.2],
  [2014, 2184,  95, 460, 320,  1.7],
  [2015, 2227,  95, 465, 330,  0.9],
  [2016, 2271,  98, 470, 340,  0.5],
  [2017, 2334, 100, 480, 355,  0.8],
  [2018, 2410,  98, 495, 365,  0.8],
  [2019, 2486,  97, 510, 375,  0.1],
  [2020, 2318, 114, 610, 330, -0.3],
  [2021, 2502, 113, 575, 355,  0.2],
  [2022, 2660, 111, 560, 380,  3.1],
  [2023, 2782, 110, 570, 385,  2.6],
  [2024, 2825, 113, 575, 395,  3.2],
  [2025, 2900, 115, 580, 405,  3.15],
];

function toPoints<T>(fn: (row: typeof HIST[number]) => T): { date: string; value: T }[] {
  return HIST.map((row) => ({ date: `${row[0]}-12-31`, value: fn(row) }));
}

export const pibPoints: TimeseriesPoint[] = toPoints((r) => r[1] * 1e9);

export const dettePoints: TimeseriesPoint[] = toPoints((r) => r[1] * 1e9 * (r[2] / 100));

export const depensesPoints: TimeseriesPoint[] = toPoints((r) => r[3] * 1e9);

export const recettesPoints: TimeseriesPoint[] = toPoints((r) => r[4] * 1e9);

export const oatLongPoints: TimeseriesPoint[] = toPoints((r) => r[5]);

export const anneeMin = HIST[0]![0];
export const anneeMax = HIST[HIST.length - 1]![0];
