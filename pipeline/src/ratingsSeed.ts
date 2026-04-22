// ============================================================================
// Historique des notations souveraines de la France
// ============================================================================
//
// Rating "souverain" = note attribuée par une agence à la dette d'un État.
// Trois agences dominent le marché : Standard & Poor's (S&P), Moody's, Fitch.
// Chaque agence a son échelle, équivalentes entre elles :
//
//   Prime : AAA  / Aaa              (risque minimum)
//   Haute : AA+, AA, AA-  / Aa1, Aa2, Aa3
//   Haute-moy : A+, A, A-  / A1, A2, A3
//   Moyenne : BBB+, BBB, BBB-  / Baa1, Baa2, Baa3
//   Spéculatif : BB, B, CCC…      (ici ne concerne pas la France)
//
// Sources officielles :
//   - Standard & Poor's : https://disclosure.spglobal.com/ratings/
//   - Moody's : https://ratings.moodys.com/ (recherche par émetteur)
//   - Fitch Ratings : https://www.fitchratings.com/issuers/france
//   - Agence France Trésor (synthèse) : https://www.aft.gouv.fr/
//
// Date format : ISO YYYY-MM-DD pour l'événement de changement.

import type { SourceInfo } from "./types.ts";

export interface RatingEvent {
  date: string;
  rating: string;          // ex: "AA-" ou "Aa3"
  numeric: number;         // échelle unifiée (plus haut = meilleur)
  outlook?: "stable" | "positive" | "negative";
  note?: string;           // commentaire bref
}

export interface AgencyRatings {
  id: "sp" | "moodys" | "fitch";
  label: string;
  url: string;
  events: RatingEvent[];
}

// ----------------------------------------------------------------------------
// Échelle numérique unifiée pour superposer les 3 agences sur un même graph.
// ----------------------------------------------------------------------------

const SCALE: Record<string, number> = {
  // Prime
  AAA: 20, Aaa: 20,
  // Haute
  "AA+": 19, Aa1: 19,
  AA: 18, Aa2: 18,
  "AA-": 17, Aa3: 17,
  // Haute-moyenne
  "A+": 16, A1: 16,
  A: 15, A2: 15,
  "A-": 14, A3: 14,
  // Moyenne-supérieure
  "BBB+": 13, Baa1: 13,
  BBB: 12, Baa2: 12,
  "BBB-": 11, Baa3: 11,
};

function num(rating: string): number {
  const v = SCALE[rating];
  if (v == null) throw new Error(`Rating inconnu : ${rating}`);
  return v;
}

// ----------------------------------------------------------------------------
// Standard & Poor's — historique France
// ----------------------------------------------------------------------------

const sp: AgencyRatings = {
  id: "sp",
  label: "Standard & Poor's",
  url: "https://disclosure.spglobal.com/ratings/",
  events: [
    { date: "1975-06-01", rating: "AAA", numeric: num("AAA"), outlook: "stable", note: "Premier rating connu" },
    { date: "2012-01-13", rating: "AA+", numeric: num("AA+"), outlook: "negative",
      note: "Perte du AAA — premier abaissement depuis la crise souveraine" },
    { date: "2013-11-08", rating: "AA",  numeric: num("AA"),  outlook: "stable",
      note: "Second abaissement d'un cran" },
    { date: "2017-10-27", rating: "AA",  numeric: num("AA"),  outlook: "positive",
      note: "Révision à la hausse de la perspective" },
    { date: "2019-04-26", rating: "AA",  numeric: num("AA"),  outlook: "stable" },
    { date: "2023-12-01", rating: "AA",  numeric: num("AA"),  outlook: "negative",
      note: "Passage en perspective négative (finances publiques)" },
    { date: "2024-05-31", rating: "AA-", numeric: num("AA-"), outlook: "stable",
      note: "Abaissement d'un cran — écart avec l'Allemagne creusé" },
  ],
};

// ----------------------------------------------------------------------------
// Moody's — historique France
// ----------------------------------------------------------------------------

const moodys: AgencyRatings = {
  id: "moodys",
  label: "Moody's",
  url: "https://ratings.moodys.com/",
  events: [
    { date: "1979-01-01", rating: "Aaa", numeric: num("Aaa"), outlook: "stable", note: "Rating historique Aaa" },
    { date: "2012-11-19", rating: "Aa1", numeric: num("Aa1"), outlook: "negative",
      note: "Perte du Aaa" },
    { date: "2015-09-18", rating: "Aa2", numeric: num("Aa2"), outlook: "stable",
      note: "Second abaissement" },
    { date: "2024-12-13", rating: "Aa3", numeric: num("Aa3"), outlook: "stable",
      note: "Abaissement à Aa3 — refus du budget 2025" },
  ],
};

// ----------------------------------------------------------------------------
// Fitch — historique France
// ----------------------------------------------------------------------------

const fitch: AgencyRatings = {
  id: "fitch",
  label: "Fitch Ratings",
  url: "https://www.fitchratings.com/issuers/france",
  events: [
    { date: "1994-08-10", rating: "AAA", numeric: num("AAA"), outlook: "stable" },
    { date: "2013-07-12", rating: "AA+", numeric: num("AA+"), outlook: "stable",
      note: "Perte du AAA" },
    { date: "2014-12-12", rating: "AA",  numeric: num("AA"),  outlook: "stable",
      note: "Second abaissement" },
    { date: "2023-04-28", rating: "AA-", numeric: num("AA-"), outlook: "stable",
      note: "Abaissement pour finances publiques" },
    { date: "2024-10-11", rating: "AA-", numeric: num("AA-"), outlook: "negative",
      note: "Passage en perspective négative" },
  ],
};

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

export const agencies: AgencyRatings[] = [sp, moodys, fitch];

export const ratingsSource: SourceInfo = {
  id: "ratings.seed",
  label: "S&P Global Ratings + Moody's + Fitch Ratings",
  url: "https://www.aft.gouv.fr/",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};
