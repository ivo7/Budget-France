// Répartition des recettes et dépenses de l'État — LFI 2026 (ordres de grandeur).
// Source : Projet de loi de finances / documents jaunes budgétaires publics.
// Valeurs en € (converties depuis Md€). À remplacer par un parser data.gouv.fr
// dans une itération ultérieure (voir sources/dataGouv.ts).

import type { SourceInfo } from "./types.ts";

export const repartitionSource: SourceInfo = {
  id: "lfi.2026.seed",
  label: "LFI 2026 — grandes masses (seed)",
  url: "https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2026",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};

/** Recettes du budget général de l'État, LFI 2026 — ~405 Md€ au total. */
export const recettesLfi2026 = [
  { categorie: "TVA (part État)",              valeur: 103e9, description: "Taxe sur la valeur ajoutée, après transferts Sécu et Régions" },
  { categorie: "Impôt sur le revenu",          valeur:  95e9, description: "IR des ménages" },
  { categorie: "Impôt sur les sociétés",       valeur:  70e9, description: "IS net" },
  { categorie: "Taxe intérieure produits énergétiques", valeur: 18e9, description: "TICPE (carburants)" },
  { categorie: "Autres recettes fiscales",     valeur:  45e9, description: "Droits de succession, prélèvements, etc." },
  { categorie: "Recettes non fiscales",        valeur:  22e9, description: "Dividendes entreprises publiques, amendes, etc." },
  { categorie: "Fonds de concours & divers",   valeur:  52e9, description: "Ressources affectées et divers" },
];

/** Dépenses du budget général de l'État, LFI 2026 — ~580 Md€ au total (par mission). */
export const depensesLfi2026 = [
  { categorie: "Engagements financiers (dette)", valeur:  62e9, description: "Charge de la dette : intérêts sur OAT + BTF" },
  { categorie: "Enseignement scolaire",         valeur:  83e9, description: "Éducation nationale" },
  { categorie: "Défense",                       valeur:  53e9, description: "Loi de programmation militaire 2024-2030" },
  { categorie: "Solidarité, insertion & égalité", valeur: 32e9, description: "Prime d'activité, AAH, lutte pauvreté" },
  { categorie: "Recherche & enseignement supérieur", valeur: 32e9, description: "Universités, organismes de recherche" },
  { categorie: "Travail, emploi & admin. économique", valeur: 28e9, description: "Politiques de l'emploi, apprentissage" },
  { categorie: "Cohésion des territoires",      valeur:  19e9, description: "Aides au logement, politique de la ville" },
  { categorie: "Écologie, développement durable & mobilités", valeur: 22e9, description: "Transition énergétique, transports" },
  { categorie: "Sécurités",                     valeur:  16e9, description: "Police, gendarmerie, sécurité civile" },
  { categorie: "Justice",                       valeur:  13e9, description: "Administration judiciaire et pénitentiaire" },
  { categorie: "Relations avec collectivités",  valeur:  11e9, description: "DGF et transferts aux collectivités" },
  { categorie: "Gestion des finances publiques", valeur: 10e9, description: "DGFiP, Douanes" },
  { categorie: "Santé",                         valeur:   2e9, description: "Budget État hors Sécurité sociale" },
  { categorie: "Agriculture, alimentation & forêt", valeur: 5e9, description: "Politique agricole commune (part État)" },
  { categorie: "Culture",                       valeur:   4e9, description: "Patrimoine, création, médias" },
  { categorie: "Sport, jeunesse & vie associative", valeur: 2e9, description: "Hors JOP" },
  { categorie: "Action extérieure de l'État",   valeur:   3e9, description: "Diplomatie, aide publique au développement" },
  { categorie: "Immigration, asile & intégration", valeur: 2e9, description: "" },
  { categorie: "Pouvoirs publics & conseil constitutionnel", valeur: 1e9, description: "Présidence, Parlement, Conseil constit." },
  { categorie: "Autres missions & remboursements", valeur: 180e9, description: "Remboursements & dégrèvements d'impôts, autres missions, charges communes" },
];
