// ============================================================================
// comparaisonsInternationales.ts — France vs OCDE / UE sur 15 indicateurs
// ============================================================================
//
// Sources :
//   - OCDE — Government at a Glance 2023, Tax Policy Studies 2024,
//     Statistics on national accounts
//   - Eurostat — Taxation Trends in the European Union 2024,
//     Government Finance Statistics (norme SEC 2010 / Maastricht)
//   - FMI — World Economic Outlook database (octobre 2024),
//     Fiscal Monitor (avril 2024)
//   - Banque mondiale — World Development Indicators
//
// Données 2023-2024 selon disponibilité. Pays sélectionnés : 11 économies
// représentatives (5 grands UE + USA, Japon, 2 nordiques, 3 "compétitifs").
// ============================================================================

export type CategorieIndicateur =
  | "fiscalite"
  | "depenses"
  | "dette-deficit"
  | "societe"
  | "economie";

export interface Pays {
  code: string;
  nom: string;
  drapeau: string;
  pibParHabUsd: number; // PIB/hab PPA USD 2023
}

export const PAYS: Pays[] = [
  { code: "fr", nom: "France",        drapeau: "🇫🇷", pibParHabUsd: 56_000 },
  { code: "de", nom: "Allemagne",     drapeau: "🇩🇪", pibParHabUsd: 67_000 },
  { code: "it", nom: "Italie",        drapeau: "🇮🇹", pibParHabUsd: 54_000 },
  { code: "es", nom: "Espagne",       drapeau: "🇪🇸", pibParHabUsd: 50_000 },
  { code: "uk", nom: "Royaume-Uni",   drapeau: "🇬🇧", pibParHabUsd: 56_000 },
  { code: "us", nom: "États-Unis",    drapeau: "🇺🇸", pibParHabUsd: 81_000 },
  { code: "jp", nom: "Japon",         drapeau: "🇯🇵", pibParHabUsd: 51_000 },
  { code: "se", nom: "Suède",         drapeau: "🇸🇪", pibParHabUsd: 70_000 },
  { code: "dk", nom: "Danemark",      drapeau: "🇩🇰", pibParHabUsd: 76_000 },
  { code: "nl", nom: "Pays-Bas",      drapeau: "🇳🇱", pibParHabUsd: 75_000 },
  { code: "ie", nom: "Irlande",       drapeau: "🇮🇪", pibParHabUsd: 112_000 },
];

export interface Indicateur {
  id: string;
  label: string;
  emoji: string;
  categorie: CategorieIndicateur;
  /** Unité d'affichage (ex. "% PIB", "%", "ans", "€") */
  unite: string;
  /** Valeurs par code pays (en unité native) */
  valeurs: Record<string, number>;
  /** "haut" = plus c'est haut, mieux c'est. "bas" = inversé. "neutre" = pas de jugement. */
  sensFavorable: "haut" | "bas" | "neutre";
  /** Description courte du concept */
  description: string;
  /** Source spécifique */
  source: string;
}

// ============================================================================
// 15 indicateurs clés
// ============================================================================

export const INDICATEURS: Indicateur[] = [
  // ──────────── FISCALITÉ ────────────
  {
    id: "prelevements-obligatoires",
    label: "Taux de prélèvements obligatoires",
    emoji: "💰",
    categorie: "fiscalite",
    unite: "% PIB",
    sensFavorable: "neutre",
    valeurs: {
      fr: 45.5, de: 40.4, it: 42.6, es: 38.1, uk: 35.3,
      us: 27.1, jp: 33.2, se: 41.5, dk: 47.0, nl: 39.0, ie: 21.7,
    },
    description:
      "Total impôts + cotisations sociales / PIB. France parmi les plus élevés OCDE (3ᵉ après Danemark et Belgique). USA très bas (modèle d'État minimal).",
    source: "OCDE Revenue Statistics 2024",
  },
  {
    id: "is-nominal",
    label: "Impôt sur les sociétés (taux nominal)",
    emoji: "🏢",
    categorie: "fiscalite",
    unite: "%",
    sensFavorable: "neutre",
    valeurs: {
      fr: 25.0, de: 29.9, it: 27.9, es: 25.0, uk: 25.0,
      us: 21.0, jp: 29.7, se: 20.6, dk: 22.0, nl: 25.8, ie: 12.5,
    },
    description:
      "Taux d'IS officiel. France était à 33,3 % jusqu'en 2018, ramené à 25 % en 2022. Irlande maintient un hub fiscal européen à 12,5 % (15 % depuis 2024 pour multinationales via Pillar 2 OCDE).",
    source: "OCDE Tax Database 2024",
  },
  {
    id: "tva-normal",
    label: "TVA (taux normal)",
    emoji: "🛒",
    categorie: "fiscalite",
    unite: "%",
    sensFavorable: "neutre",
    valeurs: {
      fr: 20.0, de: 19.0, it: 22.0, es: 21.0, uk: 20.0,
      us: 0, jp: 10.0, se: 25.0, dk: 25.0, nl: 21.0, ie: 23.0,
    },
    description:
      "Taux normal TVA. USA n'ont pas de TVA fédérale (sales tax par État variable 0-10 %). Pays nordiques au sommet (25 %). Japon historiquement bas (10 % depuis 2019, vs 3 % à la création en 1989).",
    source: "OCDE / Eurostat 2024",
  },
  {
    id: "cotisations-sociales-pib",
    label: "Cotisations sociales",
    emoji: "🤝",
    categorie: "fiscalite",
    unite: "% PIB",
    sensFavorable: "neutre",
    valeurs: {
      fr: 16.6, de: 14.6, it: 12.7, es: 11.9, uk: 6.2,
      us: 6.2, jp: 13.0, se: 8.9, dk: 0.1, nl: 13.4, ie: 4.0,
    },
    description:
      "Cotisations URSSAF/équivalent. France au sommet (modèle bismarckien : Sécu financée majoritairement par cotisations). Danemark : Sécu financée par l'impôt direct (modèle beveridgien).",
    source: "OCDE Social Expenditure",
  },

  // ──────────── DÉPENSES ────────────
  {
    id: "depenses-publiques",
    label: "Dépenses publiques totales",
    emoji: "📊",
    categorie: "depenses",
    unite: "% PIB",
    sensFavorable: "neutre",
    valeurs: {
      fr: 57.3, de: 49.5, it: 56.0, es: 47.3, uk: 45.2,
      us: 38.4, jp: 41.8, se: 49.0, dk: 49.5, nl: 42.5, ie: 23.7,
    },
    description:
      "Dépenses APU / PIB. France championne OCDE — corrolaire d'un État providence dense (Sécu + retraites + éducation + collectivités). Irlande très basse (effet PIB gonflé par multinationales).",
    source: "Eurostat / OCDE 2023",
  },
  {
    id: "depenses-sante",
    label: "Dépenses santé totales",
    emoji: "🏥",
    categorie: "depenses",
    unite: "% PIB",
    sensFavorable: "neutre",
    valeurs: {
      fr: 12.1, de: 12.7, it: 9.0, es: 10.5, uk: 11.3,
      us: 16.6, jp: 11.2, se: 11.0, dk: 9.7, nl: 10.1, ie: 6.8,
    },
    description:
      "Dépenses santé totales (publiques + privées) / PIB. USA largement en tête (16,6 % du PIB) mais avec espérance de vie inférieure aux autres pays riches — paradoxe classique du système US.",
    source: "OCDE Health Statistics 2024",
  },
  {
    id: "depenses-education",
    label: "Dépenses publiques éducation",
    emoji: "📚",
    categorie: "depenses",
    unite: "% PIB",
    sensFavorable: "haut",
    valeurs: {
      fr: 5.2, de: 4.5, it: 4.1, es: 4.7, uk: 5.0,
      us: 6.1, jp: 3.4, se: 7.6, dk: 6.8, nl: 5.1, ie: 3.1,
    },
    description:
      "Dépenses publiques éducation tous niveaux (primaire à supérieur) / PIB. Pays nordiques en tête. Japon paradoxalement bas pour un pays valorisant l'éducation (rôle massif des familles + écoles privées).",
    source: "OCDE Education at a Glance 2024",
  },
  {
    id: "depenses-defense",
    label: "Dépenses défense",
    emoji: "🪖",
    categorie: "depenses",
    unite: "% PIB",
    sensFavorable: "neutre",
    valeurs: {
      fr: 2.1, de: 1.6, it: 1.5, es: 1.2, uk: 2.3,
      us: 3.4, jp: 1.4, se: 2.0, dk: 1.7, nl: 1.7, ie: 0.2,
    },
    description:
      "Dépenses militaires / PIB. Engagement OTAN 2 % du PIB. France et UK respectent, Allemagne et Italie en-dessous (rattrapage en cours). USA toujours en tête (~3,4 %) reflète son rôle de superpuissance.",
    source: "SIPRI 2024, OTAN",
  },

  // ──────────── DETTE & DÉFICIT ────────────
  {
    id: "dette-maastricht",
    label: "Dette publique (Maastricht)",
    emoji: "💳",
    categorie: "dette-deficit",
    unite: "% PIB",
    sensFavorable: "bas",
    valeurs: {
      fr: 115.0, de: 64.0, it: 137.0, es: 108.0, uk: 100.0,
      us: 122.0, jp: 252.0, se: 31.0, dk: 30.0, nl: 46.0, ie: 43.0,
    },
    description:
      "Ratio dette/PIB. Maastricht fixe une norme à 60 % (largement dépassée par 6 pays sur 11). Japon record absolu à 252 %, mais détenu à 90 % par épargnants japonais (pas de crise souveraine).",
    source: "Eurostat / FMI WEO octobre 2024",
  },
  {
    id: "deficit-public",
    label: "Déficit public",
    emoji: "📉",
    categorie: "dette-deficit",
    unite: "% PIB",
    sensFavorable: "haut",
    valeurs: {
      fr: -5.5, de: -2.5, it: -7.2, es: -3.6, uk: -5.0,
      us: -6.4, jp: -4.5, se: -0.6, dk: 3.1, nl: -0.3, ie: 1.6,
    },
    description:
      "Solde budgétaire / PIB. Critère Maastricht : pas pire que -3 %. France, Italie, UK, USA en dépassement durable. Danemark et Irlande en excédent (cas rare en OCDE).",
    source: "Eurostat / FMI 2024",
  },

  // ──────────── SOCIÉTÉ ────────────
  {
    id: "gini-apres",
    label: "Coefficient de Gini (après redistribution)",
    emoji: "⚖️",
    categorie: "societe",
    unite: "",
    sensFavorable: "bas",
    valeurs: {
      fr: 29.0, de: 30.0, it: 33.0, es: 32.0, uk: 35.0,
      us: 39.0, jp: 33.0, se: 28.0, dk: 27.0, nl: 28.0, ie: 30.0,
    },
    description:
      "Mesure d'inégalité des revenus disponibles : 0 = égalité parfaite, 100 = inégalité max. France parmi les plus égalitaires (≈ Allemagne, Pays-Bas), grâce à une redistribution massive. USA largement en tête des inégalités OCDE.",
    source: "OCDE Income Distribution Database 2024",
  },
  {
    id: "esperance-vie",
    label: "Espérance de vie à la naissance",
    emoji: "❤️",
    categorie: "societe",
    unite: "ans",
    sensFavorable: "haut",
    valeurs: {
      fr: 82.5, de: 81.2, it: 83.1, es: 83.3, uk: 80.7,
      us: 76.4, jp: 84.0, se: 83.1, dk: 81.4, nl: 81.7, ie: 82.4,
    },
    description:
      "Espérance de vie moyenne. France parmi les meilleures (~82,5 ans). USA décroche (-3 ans vs OCDE) malgré le système santé le plus cher au monde — crise opiacés, obésité, accidents, inégalités d'accès.",
    source: "OCDE Health Statistics 2024",
  },
  {
    id: "taux-emploi",
    label: "Taux d'emploi (15-64 ans)",
    emoji: "💼",
    categorie: "societe",
    unite: "%",
    sensFavorable: "haut",
    valeurs: {
      fr: 68.4, de: 76.9, it: 62.0, es: 65.5, uk: 75.4,
      us: 71.7, jp: 78.5, se: 77.4, dk: 76.5, nl: 81.5, ie: 73.8,
    },
    description:
      "Part de la population 15-64 ans en emploi. France en retard (68 %) malgré progrès récents. Pays-Bas au sommet (81 %) grâce au temps partiel féminin massif. Italie très basse (62 %) — chômage Sud + inactivité féminine.",
    source: "OCDE Labour Force Statistics 2024",
  },
  {
    id: "smic-relatif",
    label: "Salaire minimum / salaire médian",
    emoji: "💵",
    categorie: "societe",
    unite: "%",
    sensFavorable: "neutre",
    valeurs: {
      fr: 62.0, de: 51.0, it: 0, es: 53.0, uk: 58.0,
      us: 28.0, jp: 47.0, se: 0, dk: 0, nl: 49.0, ie: 48.0,
    },
    description:
      "Ratio salaire minimum / salaire médian. France au sommet OCDE (62 %), traduit un SMIC relativement élevé qui comprime la distribution salariale. Suède, Danemark, Italie : pas de SMIC légal (négocié par branches).",
    source: "OCDE Earnings Database 2024",
  },

  // ──────────── ÉCONOMIE ────────────
  {
    id: "investissement-public",
    label: "Investissement public",
    emoji: "🏗️",
    categorie: "economie",
    unite: "% PIB",
    sensFavorable: "haut",
    valeurs: {
      fr: 3.7, de: 2.7, it: 3.1, es: 2.9, uk: 3.2,
      us: 3.5, jp: 3.6, se: 4.7, dk: 3.6, nl: 3.4, ie: 2.5,
    },
    description:
      "Formation brute de capital fixe des administrations publiques. France dans le peloton de tête. Suède et Japon les plus investisseurs publics. Allemagne historiquement faible (handicap infrastructures depuis 20 ans).",
    source: "Eurostat / OCDE 2023",
  },
];

// ============================================================================
// Métadonnées catégories pour l'UI
// ============================================================================

export const CATEGORIES_INFO: Record<
  CategorieIndicateur,
  { label: string; emoji: string; color: string; description: string }
> = {
  fiscalite: {
    label: "Fiscalité",
    emoji: "💰",
    color: "#0055A4",
    description: "Pression fiscale, taux IS, TVA, cotisations.",
  },
  depenses: {
    label: "Dépenses publiques",
    emoji: "📊",
    color: "#7c3aed",
    description: "Total, santé, éducation, défense.",
  },
  "dette-deficit": {
    label: "Dette & déficit",
    emoji: "💳",
    color: "#dc2626",
    description: "Ratio dette/PIB et solde budgétaire.",
  },
  societe: {
    label: "Société",
    emoji: "👥",
    color: "#16a34a",
    description: "Inégalités, espérance de vie, emploi, salaire minimum.",
  },
  economie: {
    label: "Économie",
    emoji: "📈",
    color: "#d97706",
    description: "Investissement public, productivité.",
  },
};

// ============================================================================
// Mythes
// ============================================================================

export const MYTHES_COMPARAISONS = [
  {
    mythe: "« La France a les impôts les plus élevés du monde »",
    realite:
      "FAUX. Le Danemark dépasse la France (47 % vs 45,5 % du PIB). Si on prend les prélèvements obligatoires + cotisations, on est en bas du podium OCDE (3ᵉ ou 4ᵉ). Mais on reste largement au-dessus de la moyenne OCDE (~34 %).",
  },
  {
    mythe: "« USA = paradis fiscal »",
    realite:
      "PARTIELLEMENT. Le total prélèvements US = 27 % PIB, bien inférieur à la France. Mais sur les hauts revenus, la fiscalité totale (fédéral + état + local + foncier US) est comparable à l'Europe. Et il manque l'État providence — chacun paie aussi cher pour sa santé privée, école, retraite.",
  },
  {
    mythe: "« La dette japonaise va éclater »",
    realite:
      "PEU PROBABLE À COURT TERME. Le Japon a 252 % de dette/PIB (le pire OCDE) mais 90 % détenue par épargnants japonais qui acceptent des taux ~0 %. Pas de crise tant que la Banque du Japon contrôle les taux et que les Japonais épargnent.",
  },
  {
    mythe: "« L'Irlande est le modèle économique »",
    realite:
      "STATISTIQUES BIAISÉES. Le PIB irlandais est gonflé par les holdings Apple/Google/Pfizer qui localisent leurs bénéfices européens à Dublin. Le « vrai » niveau de vie irlandais est plus proche de celui de la France. Pillar 2 OCDE (15 % IS minimum) érode le modèle depuis 2024.",
  },
  {
    mythe: "« Suède = socialiste fiscal »",
    realite:
      "À NUANCER. La Suède a un IS plus bas que la France (20,6 % vs 25 %), pas de droits de succession depuis 2004, et des cotisations sociales plus basses. C'est l'IR + TVA qui sont élevés. Modèle nordique = forte fiscalité directe sur les revenus + faible fiscalité capital/entreprises.",
  },
];

export const TOTAL_INDICATEURS = INDICATEURS.length;
export const TOTAL_PAYS = PAYS.length;
