// ============================================================================
// regalien.ts — budgets de Police, Gendarmerie, Justice, Prisons
// ============================================================================
//
// Sources :
//   - LFI 2025 (mission Sécurités, mission Justice) — Bercy
//   - Rapport annuel de performance (RAP) Cour des comptes
//   - DAP — administration pénitentiaire (statistiques mensuelles détenus/places)
//   - DGPN, DGGN — effectifs et activité
//   - Ministère de la Justice — chiffres-clés annuels
//   - Eurostat — comparaisons internationales dépenses publiques (COFOG)
//
// Convention :
//   - Tous les budgets en Md€ (exécution 2024 ou LFI 2025 selon précision)
//   - Effectifs en équivalents temps plein (ETP)
//   - Données arrondies à 0,1 Md€ près
//
// ⚠ Périmètre : seul le budget de l'État central est compté ici. Les budgets
// communaux pour la police municipale (~1,2 Md€) et les SDIS pompiers
// (~5,5 Md€, financés par les départements) sont notés séparément.

export interface MissionRegalienne {
  id: string;
  nom: string;
  emoji: string;
  /** Budget LFI 2025 en Md€ */
  budgetMdEur: number;
  /** Évolution 2014-2024 en % réel (corrigé inflation) */
  evolution10ans: string;
  /** Effectifs équivalents temps plein */
  effectif: string;
  /** Description courte */
  description: string;
  /** Indicateurs d'activité concrets */
  indicateurs: { label: string; value: string; description?: string }[];
  /** Enjeux principaux */
  enjeux: string;
  /** Source officielle */
  source: string;
  /** Couleur dédiée */
  couleur: string;
}

export const MISSIONS_REGALIENNES: MissionRegalienne[] = [
  {
    id: "police",
    nom: "Police nationale",
    emoji: "👮",
    budgetMdEur: 12.5,
    evolution10ans: "+12 % en € constants vs 2014",
    effectif: "~150 000 agents (police active + administratifs)",
    description:
      "Mission « Sécurités », programme 176. Compétente en zones urbaines (>20 000 hab. typiquement). Sous l'autorité du ministère de l'Intérieur, dirigée par la DGPN.",
    indicateurs: [
      { label: "Zones de compétence", value: "85 % de la pop urbaine", description: "Surtout grandes villes et banlieues" },
      { label: "Interventions/an", value: "12 millions", description: "Tous types d'appels au 17 / déplacements terrain" },
      { label: "Gardes à vue", value: "780 000/an", description: "Procédures judiciaires" },
      { label: "Coût par habitant", value: "~185 €/an", description: "Budget police / 67 M habitants" },
    ],
    enjeux:
      "Recrutement difficile (départs anticipés en hausse, attractivité du métier en baisse). Modernisation des équipements (véhicules, radios cryptées). Formation initiale : 12 mois pour gardiens de la paix. Tensions territoires sensibles (QPV).",
    source: "LFI 2025 mission Sécurités, Cour des comptes 2024",
    couleur: "#1e40af",
  },
  {
    id: "gendarmerie",
    nom: "Gendarmerie nationale",
    emoji: "🪖",
    budgetMdEur: 10.7,
    evolution10ans: "+8 % en € constants vs 2014",
    effectif: "~100 000 militaires (gendarmerie active + réserves)",
    description:
      "Mission « Sécurités », programme 152. Force armée à statut militaire mais sous tutelle du ministère de l'Intérieur depuis 2009. Compétence : zones rurales et péri-urbaines (95 % du territoire géographique, 50 % de la population).",
    indicateurs: [
      { label: "Couverture territoriale", value: "95 % du territoire", description: "Zones rurales et péri-urbaines" },
      { label: "Brigades", value: "~3 000 brigades territoriales", description: "Maillage local" },
      { label: "Interventions/an", value: "5 millions", description: "Appels 17 + interventions programmées" },
      { label: "Coût par habitant", value: "~310 €/an", description: "Population zone gendarmerie ~35 M" },
    ],
    enjeux:
      "Perte d'effectifs depuis 2010 (-5 %). Reconquête républicaine annoncée 2017 (création 200 brigades). Statut militaire = obligations particulières (déplacement, logement). Concurrence avec police municipale dans zones péri-urbaines.",
    source: "LFI 2025 mission Sécurités",
    couleur: "#0891b2",
  },
  {
    id: "justice-judiciaire",
    nom: "Justice judiciaire",
    emoji: "⚖️",
    budgetMdEur: 5.0,
    evolution10ans: "+25 % en € constants (loi de programmation 2023)",
    effectif: "~9 000 magistrats + 23 000 greffiers/agents",
    description:
      "Programme 166 de la mission « Justice ». Couvre les juridictions civiles, pénales, commerciales, prud'hommes. Hors administration pénitentiaire et protection judiciaire de la jeunesse.",
    indicateurs: [
      { label: "Magistrats", value: "9 000", description: "Très peu : 11/100 000 hab. en France vs 24 en Allemagne" },
      { label: "Décisions civiles/an", value: "1,9 million" },
      { label: "Décisions pénales/an", value: "1,4 million" },
      { label: "Délai moyen affaire civile", value: "14 mois", description: "Tribunal judiciaire" },
    ],
    enjeux:
      "Sous-effectif chronique des magistrats (Conseil de l'Europe : France dans le bas du classement européen). Loi de programmation 2023-2027 prévoit +1 500 magistrats + 1 800 greffiers d'ici 2027. Numérisation lente. Frais de justice (expertises) en hausse.",
    source: "LFI 2025 mission Justice, Conseil de l'Europe CEPEJ",
    couleur: "#0055A4",
  },
  {
    id: "prisons",
    nom: "Administration pénitentiaire",
    emoji: "🔒",
    budgetMdEur: 4.7,
    evolution10ans: "+18 % en € constants vs 2014",
    effectif: "~46 000 personnels (surveillants + administratifs + SPIP)",
    description:
      "Programme 107 de la mission « Justice ». Couvre les 188 établissements pénitentiaires (maisons d'arrêt, centres de détention, maisons centrales) + le suivi en milieu ouvert (SPIP).",
    indicateurs: [
      { label: "Détenus", value: "76 200", description: "Au 1ᵉʳ avril 2025" },
      { label: "Places opérationnelles", value: "60 800" },
      { label: "Taux d'occupation", value: "125 %", description: "Surcharge structurelle" },
      { label: "Suivi en milieu ouvert (SPIP)", value: "175 000 personnes", description: "Bracelet, contrôle judiciaire, sursis…" },
      { label: "Coût/jour/détenu", value: "~110 €", description: "Tout compris (sécurité, hébergement, soins)" },
    ],
    enjeux:
      "Surpopulation chronique (125 % en moyenne, jusqu'à 180 % dans certaines maisons d'arrêt). Plan 15 000 places nouvelles d'ici 2027 (loi 2023). État dégradé du parc immobilier (~30 % > 50 ans). Réinsertion difficile (50 % récidive).",
    source: "Statistiques mensuelles DAP, LFI 2025",
    couleur: "#7c3aed",
  },
  {
    id: "pjj",
    nom: "Protection judiciaire de la jeunesse",
    emoji: "🧑",
    budgetMdEur: 1.0,
    evolution10ans: "+22 % en € constants vs 2014",
    effectif: "~9 000 personnels (éducateurs, psychologues, magistrats jeunesse)",
    description:
      "Programme 182 de la mission « Justice ». Prend en charge les mineurs faisant l'objet d'une mesure judiciaire (pénale ou éducative). Centres éducatifs fermés (CEF), unités éducatives en milieu ouvert.",
    indicateurs: [
      { label: "Mineurs suivis", value: "~120 000/an" },
      { label: "CEF (centres éducatifs fermés)", value: "53 établissements" },
      { label: "Mesures éducatives milieu ouvert", value: "85 % des mineurs suivis" },
    ],
    enjeux:
      "Réforme du Code de la justice pénale des mineurs en 2021 (céder du terrain à la prévention). Lien renforcé avec l'aide sociale à l'enfance (ASE) départementale.",
    source: "LFI 2025 mission Justice",
    couleur: "#16a34a",
  },
  {
    id: "aide-juridictionnelle",
    nom: "Aide juridictionnelle",
    emoji: "🤝",
    budgetMdEur: 0.7,
    evolution10ans: "+45 % en € constants vs 2014",
    effectif: "Indemnisation avocats commis d'office",
    description:
      "Programme 101 de la mission « Justice ». Permet aux personnes aux revenus modestes d'avoir accès à un avocat (totalement ou partiellement gratuit). Versée aux avocats sur barème national.",
    indicateurs: [
      { label: "Bénéficiaires/an", value: "~1 million", description: "Procédures civiles + pénales" },
      { label: "Plafond ressources (1 part)", value: "1 332 €/mois", description: "Pour aide totale" },
      { label: "Coût moyen par dossier", value: "~700 €" },
    ],
    enjeux:
      "Grande hausse depuis 2017 (revalorisation barème UV). Critique persistante des avocats sur le sous-financement (UV à ~36 € contre ~120 € au Royaume-Uni). Accès au droit en zones rurales défaillant.",
    source: "LFI 2025 mission Justice",
    couleur: "#d97706",
  },
];

// Comparaisons internationales (Eurostat COFOG 2023, % PIB)
export interface ComparaisonRegalien {
  pays: string;
  drapeau: string;
  ordrePubliqueSecurite: number; // % PIB
  justice: number;               // % PIB
  total: number;
  note?: string;
}

export const COMPARAISONS_REGALIEN: ComparaisonRegalien[] = [
  {
    pays: "France",
    drapeau: "🇫🇷",
    ordrePubliqueSecurite: 1.4,
    justice: 0.4,
    total: 1.8,
    note: "Police + gendarmerie + justice + prisons. Stable depuis 10 ans.",
  },
  {
    pays: "Allemagne",
    drapeau: "🇩🇪",
    ordrePubliqueSecurite: 1.4,
    justice: 0.5,
    total: 1.9,
    note: "Plus de magistrats par habitant, mais moins de policiers.",
  },
  {
    pays: "Royaume-Uni",
    drapeau: "🇬🇧",
    ordrePubliqueSecurite: 1.6,
    justice: 0.4,
    total: 2.0,
    note: "Police territoriale très autonome (43 forces).",
  },
  {
    pays: "Italie",
    drapeau: "🇮🇹",
    ordrePubliqueSecurite: 1.6,
    justice: 0.3,
    total: 1.9,
    note: "5 forces de police nationales (Polizia, Carabinieri, GdF, Pen, Forestale fusionnée).",
  },
  {
    pays: "Espagne",
    drapeau: "🇪🇸",
    ordrePubliqueSecurite: 1.5,
    justice: 0.4,
    total: 1.9,
  },
  {
    pays: "États-Unis",
    drapeau: "🇺🇸",
    ordrePubliqueSecurite: 1.7,
    justice: 0.5,
    total: 2.2,
    note: "Police décentralisée (~18 000 forces locales, FBI fédéral). Population carcérale 5 fois supérieure.",
  },
  {
    pays: "Suède",
    drapeau: "🇸🇪",
    ordrePubliqueSecurite: 1.0,
    justice: 0.5,
    total: 1.5,
    note: "Modèle nordique : moins de dépenses, taux de criminalité bas. Mais en hausse récemment.",
  },
];

// Indicateurs hors État central (pour info)
export const PERIMETRE_HORS_ETAT = [
  {
    label: "Polices municipales",
    montantMdEur: 1.2,
    description: "~25 000 agents armés (selon commune). Financées par les communes (CGCT).",
  },
  {
    label: "Pompiers (SDIS)",
    montantMdEur: 5.5,
    description:
      "246 000 sapeurs-pompiers (volontaires + professionnels). Financés par les départements à ~50 % et les communes à ~50 %.",
  },
  {
    label: "Sécurité privée",
    montantMdEur: 9.5,
    description:
      "Marché privé (Securitas, etc.). ~180 000 agents. Financé par entreprises et particuliers, hors budget public.",
  },
];

// Total mission Sécurités + Justice (consolidé)
export const TOTAL_REGALIEN_MD_EUR = MISSIONS_REGALIENNES.reduce(
  (acc, m) => acc + m.budgetMdEur,
  0,
);
