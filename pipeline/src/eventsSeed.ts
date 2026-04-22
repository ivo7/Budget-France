// ============================================================================
// Événements historiques marquants des finances publiques françaises (1945+)
// ============================================================================
//
// Annotés sur les courbes longue période pour rendre les inflexions lisibles.
// Cibles : lycéens (SES), prépas, étudiants en économie / Sciences Po.
//
// Chaque événement est rattaché à :
//   - une DATE (année, parfois plus précise)
//   - une CATÉGORIE (politique, économique, monétaire, militaire, crise)
//   - un TITRE court et une DESCRIPTION pédagogique
//   - un IMPACT (hausse / baisse) sur dette, recettes, dépenses ou taux
//
// Sources : Chronologie Banque de France, INSEE "France en chiffres",
// manuels officiels SES lycée, rapports Cour des comptes rétrospectifs.

import type { SourceInfo } from "./types.ts";

export type EventCategory = "politique" | "economique" | "monetaire" | "militaire" | "crise";

export interface HistoricalEventSeed {
  date: string;                 // YYYY-MM-DD
  title: string;                // court (< 60 car)
  description: string;          // 1-2 phrases pédagogiques
  category: EventCategory;
  impact?: "dette+" | "dette-" | "taux+" | "taux-" | "neutre";
}

export const historicalEvents: HistoricalEventSeed[] = [
  {
    date: "1945-05-08",
    title: "Fin de la Seconde Guerre mondiale",
    description:
      "La France sort exsangue : dette publique ~170 % du PIB, appareil productif à reconstruire. Le plan Marshall (à partir de 1948) apporte ~2,3 Md$ d'aide américaine.",
    category: "militaire",
    impact: "dette+",
  },
  {
    date: "1954-04-10",
    title: "Création de la TVA",
    description:
      "Maurice Lauré invente la Taxe sur la valeur ajoutée en France. Généralisée en 1968, adoptée ensuite par toute l'UE. Devient la 1ʳᵉ recette fiscale de l'État.",
    category: "economique",
    impact: "neutre",
  },
  {
    date: "1959-01-01",
    title: "Nouveau franc (1 NF = 100 F)",
    description:
      "Dévaluation monétaire et passage au « nouveau franc ». Stabilisation de l'inflation après les années de guerre et d'Algérie.",
    category: "monetaire",
  },
  {
    date: "1973-10-06",
    title: "Premier choc pétrolier",
    description:
      "Guerre du Kippour + embargo OPEP. Prix du pétrole × 4 en quelques mois. Inflation à deux chiffres en France jusqu'en 1985 — taux d'intérêt et dette publique commencent à s'envoler.",
    category: "crise",
    impact: "taux+",
  },
  {
    date: "1981-05-21",
    title: "Élection de François Mitterrand",
    description:
      "Relance keynésienne, nationalisations, 39 h, 5 semaines de congés payés. OAT 10 ans grimpent à 15,8 % fin 1981 sous tensions inflationnistes.",
    category: "politique",
    impact: "taux+",
  },
  {
    date: "1983-03-25",
    title: "Tournant de la rigueur",
    description:
      "Après 3 dévaluations du franc, Mitterrand choisit l'austérité et le maintien dans le SME. Fin de la politique keynésienne, début de la désinflation compétitive.",
    category: "economique",
    impact: "taux-",
  },
  {
    date: "1992-02-07",
    title: "Traité de Maastricht",
    description:
      "Création de l'UE et critères de convergence : dette < 60 % PIB, déficit < 3 % PIB. La France entame une décennie d'efforts budgétaires pour entrer dans l'euro.",
    category: "monetaire",
  },
  {
    date: "1999-01-01",
    title: "Naissance de l'euro (monnaie scripturale)",
    description:
      "Fixation irrévocable : 1 € = 6,55957 F. Les pays de la zone euro perdent leur souveraineté monétaire — ils ne peuvent plus dévaluer.",
    category: "monetaire",
  },
  {
    date: "2002-01-01",
    title: "Passage à l'euro fiduciaire",
    description:
      "Les francs disparaissent du quotidien. Les Français peuvent désormais comparer directement les prix entre pays de la zone euro.",
    category: "monetaire",
  },
  {
    date: "2008-09-15",
    title: "Faillite de Lehman Brothers",
    description:
      "Déclenchement de la crise financière mondiale. L'État français injecte ~22 Md€ dans les banques. Dette publique : de 68 % à 86 % du PIB entre 2008 et 2010.",
    category: "crise",
    impact: "dette+",
  },
  {
    date: "2011-01-01",
    title: "Crise de la dette souveraine zone euro",
    description:
      "Grèce, Portugal, Irlande, Espagne, Italie en difficulté. La BCE achète massivement des OAT. Spread OAT-Bund grimpe à +200 pb fin 2011.",
    category: "crise",
    impact: "taux+",
  },
  {
    date: "2012-01-13",
    title: "Perte du AAA par Standard & Poor's",
    description:
      "Premier abaissement de la note souveraine française depuis la création des agences modernes. Passe de AAA à AA+. Moody's et Fitch suivent la même année.",
    category: "crise",
  },
  {
    date: "2015-01-22",
    title: "Lancement du Quantitative Easing BCE",
    description:
      "Mario Draghi lance le rachat massif d'OAT. Les taux chutent : l'OAT 10 ans passe sous 1 % en 2015, négatif en 2019. Période de « gratuité » de l'endettement.",
    category: "monetaire",
    impact: "taux-",
  },
  {
    date: "2020-03-17",
    title: "Confinement COVID-19",
    description:
      "Arrêt quasi-total de l'économie. Plan d'urgence 470 Md€ (chômage partiel, fonds de solidarité…). Déficit 2020 : -9 % PIB, dette de 98 % à 115 % du PIB.",
    category: "crise",
    impact: "dette+",
  },
  {
    date: "2022-02-24",
    title: "Invasion de l'Ukraine",
    description:
      "Sanctions contre la Russie, crise énergétique, inflation à 6 %. Fin du QE, les taux remontent brutalement. OAT 10 ans : de 0 % début 2022 à 3 % fin d'année.",
    category: "crise",
    impact: "taux+",
  },
  {
    date: "2024-05-31",
    title: "S&P abaisse la note France à AA-",
    description:
      "Standard & Poor's sanctionne l'incapacité à revenir sous les 3 % de déficit. Moody's suivra en décembre (Aa3). Fitch est déjà à AA- depuis 2023.",
    category: "politique",
  },
  {
    date: "2024-07-30",
    title: "Procédure pour déficit excessif (UE)",
    description:
      "La Commission européenne ouvre une procédure contre la France (et 6 autres pays) pour déficit supérieur à 3 % du PIB. Obligation de plan de redressement.",
    category: "politique",
  },
];

export const eventsSource: SourceInfo = {
  id: "events.seed",
  label: "Chronologie Banque de France + INSEE + Cour des comptes",
  url: "https://www.banque-france.fr/fr/publications-et-statistiques/chronologie",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};
