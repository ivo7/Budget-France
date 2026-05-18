// ============================================================================
// bouclierTarifaire.ts — bouclier énergie 2021-2024 : coût, redistribution
// ============================================================================
//
// Sources principales (toutes publiques) :
//   - Cour des comptes — rapport thématique « Le bouclier tarifaire,
//     bilan et leçons » (2024)
//   - IGF (Inspection Générale des Finances) — rapport efficacité 2023
//   - IPP — étude redistributive des dispositifs énergie (2023)
//   - Bruegel — comparaisons européennes des aides énergie (2022-2023)
//   - INSEE — impact sur l'inflation
//   - Banque de France — impact macroéconomique
//   - DG Trésor — notes d'analyse coûts/effets
//   - I4CE — impact sur la transition énergétique
//
// ⚠ Approche : factuelle, ordres de grandeur officiels. Le « bouclier » est
// en réalité une mosaïque de ~10 dispositifs (gaz, électricité, carburant,
// chèques exceptionnels, amortisseur entreprises). On présente le détail.

// ============================================================================
// Chronologie : coût annuel cumulé
// ============================================================================

export interface AnneeBouclier {
  annee: number;
  coutMdEur: number;
  contexte: string;
  evenement: string;
}

export const CHRONOLOGIE_BOUCLIER: AnneeBouclier[] = [
  {
    annee: 2021,
    coutMdEur: 5.9,
    contexte: "Lancement (octobre)",
    evenement:
      "Crise post-Covid, hausse des prix de gros gaz/électricité. Gel TRV gaz puis hausse électricité limitée à +4 %. Indemnité inflation 100 € (38 M bénéficiaires).",
  },
  {
    annee: 2022,
    coutMdEur: 24.0,
    contexte: "Choc Ukraine",
    evenement:
      "Invasion russe (février). Prix de gros multipliés par 5-10. Maintien gel gaz, hausse électricité +4 %. Remise carburant 18 ct/L (avril-décembre, 8 Md€). Chèques exceptionnels.",
  },
  {
    annee: 2023,
    coutMdEur: 36.0,
    contexte: "Pic budgétaire",
    evenement:
      "Hausse électricité +15 %, hausse gaz +15 %, remplacement remise par chèque carburant ciblé 100 € (10 M travailleurs). Amortisseur électricité PME/collectivités (~3 Md€).",
  },
  {
    annee: 2024,
    coutMdEur: 28.0,
    contexte: "Sortie progressive",
    evenement:
      "Hausse électricité +10 % puis +9 %, fin du bouclier gaz, augmentation TICFE (taxe électricité) pour récupérer une partie du coût. Maintien chèque énergie historique.",
  },
];

export const COUT_CUMULE_BOUCLIER_MD = CHRONOLOGIE_BOUCLIER.reduce(
  (acc, a) => acc + a.coutMdEur,
  0,
);

// ============================================================================
// Dispositifs : les ~10 instruments du « bouclier »
// ============================================================================

export type CategorieBouclier =
  | "menages"
  | "entreprises"
  | "carburant"
  | "exceptionnel";

export const CATEGORIES_BOUCLIER: Record<
  CategorieBouclier,
  { label: string; color: string }
> = {
  menages: { label: "Ménages (gaz/électricité)", color: "#f97316" },
  entreprises: { label: "Entreprises", color: "#a855f7" },
  carburant: { label: "Carburant", color: "#ef4444" },
  exceptionnel: { label: "Chèques exceptionnels", color: "#06b6d4" },
};

export interface DispositifBouclier {
  id: string;
  nom: string;
  emoji: string;
  categorie: CategorieBouclier;
  coutCumuleMdEur: number;
  periode: string;
  beneficiaires: string;
  description: string;
  source: string;
}

export const DISPOSITIFS_BOUCLIER: DispositifBouclier[] = [
  {
    id: "bouclier-gaz",
    nom: "Bouclier tarifaire gaz",
    emoji: "🔥",
    categorie: "menages",
    coutCumuleMdEur: 18.0,
    periode: "Oct. 2021 — Juin 2023",
    beneficiaires: "10 M ménages au TRV gaz",
    description:
      "Gel du Tarif Réglementé de Vente (TRV) du gaz au niveau d'octobre 2021, malgré la flambée des prix de gros. Coût compensé par l'État aux fournisseurs (Engie principalement). Sortie totale fin du TRV gaz juin 2023.",
    source: "PLF, CRE",
  },
  {
    id: "bouclier-elec",
    nom: "Bouclier tarifaire électricité",
    emoji: "⚡",
    categorie: "menages",
    coutCumuleMdEur: 40.0,
    periode: "Févr. 2022 — toujours partiel",
    beneficiaires: "~25 M ménages au TRV ARENH",
    description:
      "Limitation de la hausse du Tarif Bleu (EDF) à +4 % en 2022, +15 % en 2023, +10 % en 2024. Sans bouclier, hausse aurait été ~+35 % par an. Combine baisse TICFE + ARENH augmenté (120 → 130 TWh).",
    source: "CRE, PLF",
  },
  {
    id: "remise-carburant",
    nom: "Remise carburant 18 ct/L",
    emoji: "⛽",
    categorie: "carburant",
    coutCumuleMdEur: 8.0,
    periode: "Avril — Décembre 2022",
    beneficiaires: "Tous les automobilistes",
    description:
      "Remise universelle à la pompe (15 ct/L puis 25 ct/L en sept-oct). Critiquée par Cour des comptes et IPP : non ciblée (les ménages aisés en bénéficient en € absolus plus que les pauvres car ils consomment plus). Remplacée par chèque carburant en 2023.",
    source: "PLF, IGF 2023",
  },
  {
    id: "cheque-carburant",
    nom: "Chèque carburant 100 € travailleurs",
    emoji: "🚗",
    categorie: "carburant",
    coutCumuleMdEur: 1.0,
    periode: "Janvier — Mars 2023",
    beneficiaires: "10 M travailleurs revenus modestes",
    description:
      "Remplace la remise universelle. Ciblé sous condition de ressources et statut de travailleur (utilisation voiture pour aller au travail). Plus redistributif mais demande administrative.",
    source: "DGFiP",
  },
  {
    id: "amortisseur-elec",
    nom: "Amortisseur électricité PME / collectivités",
    emoji: "🏢",
    categorie: "entreprises",
    coutCumuleMdEur: 6.0,
    periode: "Janv. 2023 — Déc. 2024",
    beneficiaires: "PME, TPE, collectivités",
    description:
      "Compense une partie du surcoût électricité pour PME, TPE et collectivités. Couvre 50 % du prix au-delà d'un seuil (180 €/MWh en 2023). Complexe et critiqué pour ses paramétrages.",
    source: "DGEC, ATEE",
  },
  {
    id: "guichet-grandes-entr",
    nom: "Guichet aide grandes entreprises",
    emoji: "🏭",
    categorie: "entreprises",
    coutCumuleMdEur: 3.5,
    periode: "2022 — 2023",
    beneficiaires: "~3 500 entreprises électro-intensives",
    description:
      "Aide ad hoc pour entreprises gros consommateurs d'énergie (sidérurgie, chimie, verre, papier). Procédure Commission européenne (encadrement aides d'État). Très critiquée pour son impact climatique (Cour des comptes).",
    source: "Commission UE, DGFiP",
  },
  {
    id: "indemnite-inflation",
    nom: "Indemnité inflation 100 € (2021)",
    emoji: "💸",
    categorie: "exceptionnel",
    coutCumuleMdEur: 3.8,
    periode: "Décembre 2021",
    beneficiaires: "38 M personnes (< 2 000 €/mois)",
    description:
      "Versement exceptionnel 100 € à 38 M de personnes gagnant moins de 2 000 €/mois (toutes catégories : actifs, retraités, étudiants…). Universelle dans son segment cible.",
    source: "DSS, CNAM",
  },
  {
    id: "cheque-energie-exceptionnel",
    nom: "Chèque énergie exceptionnel",
    emoji: "📨",
    categorie: "exceptionnel",
    coutCumuleMdEur: 1.5,
    periode: "2022 — 2024",
    beneficiaires: "~5,8 M ménages modestes",
    description:
      "Bonus exceptionnel sur le chèque énergie historique (~150 € de plus). Cible déjà existante (RFR < 11 000 €/UC). Très redistributif mais à enveloppe modeste.",
    source: "DGEC",
  },
  {
    id: "compensation-tpe-tpf",
    nom: "Compensation TPN/TPS (tarifs sociaux)",
    emoji: "🛡️",
    categorie: "menages",
    coutCumuleMdEur: 0.4,
    periode: "Continue",
    beneficiaires: "~5 M ménages précaires",
    description:
      "Tarifs de Première Nécessité (électricité) et Tarif Spécial de Solidarité (gaz). Préexistant au bouclier, conservé en parallèle. Cumulable avec le chèque énergie.",
    source: "CRE, ENEDIS",
  },
];

// ============================================================================
// Recettes contributives (taxes super-profits, contribution énergie)
// ============================================================================

export interface RecetteBouclier {
  poste: string;
  emoji: string;
  montantMdEur: number;
  description: string;
  source: string;
}

export const RECETTES_BOUCLIER: RecetteBouclier[] = [
  {
    poste: "Contribution sur la rente inframarginale (CRIM)",
    emoji: "⚖️",
    montantMdEur: 2.5,
    description:
      "Taxe sur les profits exceptionnels des producteurs d'électricité (nucléaire, EnR, hydraulique) ayant bénéficié des prix de gros élevés. Recettes 2023-2024 environ 2,5 Md€ — bien en deçà des 5-7 Md€ annoncés.",
    source: "DGFiP, Cour des comptes 2024",
  },
  {
    poste: "Contribution exceptionnelle énergie (CSE)",
    emoji: "🛢️",
    montantMdEur: 0.6,
    description:
      "Taxe sur les superprofits 2022 des entreprises pétrolières et gazières (au-dessus de +20 % du bénéfice moyen). Coût modeste : ~600 M€ uniquement en 2022.",
    source: "PLFR 2022",
  },
  {
    poste: "Réintégration ARENH élargi (manque à gagner EDF)",
    emoji: "⚛️",
    montantMdEur: -8.0,
    description:
      "Coût pour EDF (donc l'État, actionnaire à 100 %) de l'ARENH élargi à 120 → 130 TWh à prix décoté. Manque à gagner ~8 Md€ pour EDF qui revient au final dans la perte État. Compte NEGATIF.",
    source: "EDF, CRE, Cour des comptes",
  },
  {
    poste: "Réforme TICFE post-bouclier (récupération 2024+)",
    emoji: "📈",
    montantMdEur: 4.0,
    description:
      "Réaugmentation progressive de la TICFE (Taxe sur la Consommation Finale d'Électricité) en 2024 et 2025 pour récupérer une partie du coût du bouclier. Mécanisme inversement utilisé (réduction TICFE pendant le bouclier).",
    source: "PLF 2024, 2025",
  },
];

// ============================================================================
// Comparaisons internationales (Bruegel)
// ============================================================================

export interface ComparaisonUE {
  pays: string;
  emoji: string;
  coutMdEur: number;
  pibPct: number;
  description: string;
}

export const COMPARAISONS_BOUCLIER_UE: ComparaisonUE[] = [
  {
    pays: "Allemagne",
    emoji: "🇩🇪",
    coutMdEur: 264.0,
    pibPct: 7.4,
    description:
      "Plus grand dispositif d'aide énergétique d'Europe. Doppelwumms (200 Md€ annoncés), gel prix gaz/électricité ciblé sur consommation 80 % du normal, aides industrie massives.",
  },
  {
    pays: "France",
    emoji: "🇫🇷",
    coutMdEur: 110.0,
    pibPct: 3.9,
    description:
      "Bouclier complet et large (gaz, électricité, carburant, entreprises, chèques). 2ᵉ position UE en absolu mais % PIB modéré grâce au mix électrique décarboné (moins exposé au prix gaz).",
  },
  {
    pays: "Italie",
    emoji: "🇮🇹",
    coutMdEur: 91.0,
    pibPct: 4.6,
    description:
      "Aides ciblées énergie + crédit d'impôt entreprises électro-intensives. Fort recours à la dette publique. Effet inflationniste limité par les aides.",
  },
  {
    pays: "Royaume-Uni",
    emoji: "🇬🇧",
    coutMdEur: 87.0,
    pibPct: 2.9,
    description:
      "Energy Price Guarantee (gel facture moyenne ménage à £2 500/an). Plus ciblé sur ménages que France. Sortie progressive mi-2023.",
  },
  {
    pays: "Espagne",
    emoji: "🇪🇸",
    coutMdEur: 35.0,
    pibPct: 2.6,
    description:
      "Approche originale : « exception ibérique » plafonnant le prix du gaz dans la formation du prix électrique (avec UE). Effet sur le marché plus que pur subventionnement.",
  },
  {
    pays: "Pays-Bas",
    emoji: "🇳🇱",
    coutMdEur: 27.0,
    pibPct: 2.8,
    description:
      "Plafond tarifaire ménages (1 200 m³ gaz + 2 900 kWh électricité). Au-delà : prix de marché. Modèle plus incitatif aux économies d'énergie.",
  },
];

// ============================================================================
// Études économiques
// ============================================================================

export interface EtudeBouclier {
  source: string;
  annee: string;
  conclusion: string;
  resume: string;
  url: string;
}

export const ETUDES_BOUCLIER: EtudeBouclier[] = [
  {
    source: "Cour des comptes — Bilan du bouclier tarifaire",
    annee: "2024",
    conclusion: "Coût élevé, ciblage perfectible, financement à clarifier",
    resume:
      "Rapport thématique. Constats : ~110 Md€ cumulés 2021-2024, dispositif efficace pour limiter l'inflation (-2 points selon INSEE) mais peu ciblé sur les vulnérables. Recommande à l'avenir un mécanisme contracyclique préformaté plutôt que des décisions ad hoc dans l'urgence.",
    url: "https://www.ccomptes.fr",
  },
  {
    source: "IPP — Impact distributif du bouclier",
    annee: "2023",
    conclusion: "Anti-redistributif en € absolus",
    resume:
      "Étude économétrique. Les 10 % les plus aisés ont reçu en moyenne 1 400 € d'aides énergétiques cumulées, vs 850 € pour les 10 % les plus modestes — car ils consomment plus en valeur absolue. EN % du revenu, les pauvres gagnent plus, mais en € sonnants, l'inverse. Plaide pour des aides ciblées.",
    url: "https://www.ipp.eu",
  },
  {
    source: "IGF — Efficacité du dispositif",
    annee: "2023",
    conclusion: "Effet inflation positif, coût budgétaire élevé",
    resume:
      "Rapport interne (parties publiques). Salue l'efficacité macroéconomique (atténuation choc inflation 2022-2023, maintien pouvoir d'achat) mais relève le coût (4 points PIB cumulés 2021-2024) et la difficulté à sortir progressivement.",
    url: "https://www.economie.gouv.fr/igf",
  },
  {
    source: "INSEE — Impact sur l'inflation",
    annee: "2023",
    conclusion: "Sans bouclier, inflation aurait été +1,5 à +2 points",
    resume:
      "Estimation INSEE : inflation 2022-2023 aurait été ~7-8 % par an en France sans bouclier (vs 5-6 % observé). C'est l'effet macroéconomique le plus quantifié.",
    url: "https://www.insee.fr",
  },
  {
    source: "Bruegel — Comparaisons UE",
    annee: "2022, 2023",
    conclusion: "France au-dessus moyenne UE en absolu, sous en % PIB",
    resume:
      "Think tank Bruegel a publié plusieurs versions du benchmark européen. France 7ᵉ en % PIB sur 27, 2ᵉ en absolu. Mix décarboné a permis de limiter l'exposition vs Allemagne (industrie dépendante du gaz).",
    url: "https://www.bruegel.org",
  },
  {
    source: "I4CE — Impact transition énergétique",
    annee: "2023",
    conclusion: "Effet contre-incitatif aux économies d'énergie",
    resume:
      "Note critique d'I4CE : en gelant le prix, on supprime le signal-prix qui devrait inciter à la sobriété et à la rénovation. Le bouclier a freiné l'effet d'aubaine des prix élevés sur la transition. Plaide pour un mécanisme préservant le signal-prix tout en compensant les vulnérables.",
    url: "https://www.i4ce.org",
  },
];

// ============================================================================
// Mythes courants
// ============================================================================

export const MYTHES_BOUCLIER = [
  {
    mythe: "« Le bouclier a protégé tous les Français »",
    realite:
      "À NUANCER. Oui, sans le bouclier, l'inflation 2022-2023 aurait été +1,5 à +2 points plus élevée (INSEE). Mais le dispositif a profité aux ménages en valeur absolue surtout aux plus aisés (étude IPP 2023) : les 10 % les plus riches ont reçu ~1 400 € d'aides cumulées, vs ~850 € pour les 10 % les plus modestes. EN % du revenu, les pauvres gagnent davantage, mais en euros sonnants, l'inverse. La protection a été générale, mais inégalement distribuée.",
  },
  {
    mythe: "« Le bouclier a été payé par les super-profits »",
    realite:
      "QUASI-FAUX. Les taxes sur les super-profits (CRIM électriciens + CSE pétroliers) ont rapporté ~3 Md€ cumulés sur la période. À comparer aux ~110 Md€ de coût total : moins de 3 %. Le reste a été financé par la dette publique (déficit structurel élevé 2022-2024). C'est l'élément le moins connu du débat.",
  },
  {
    mythe: "« Le bouclier était une exception française »",
    realite:
      "FAUX. Tous les pays UE ont mis en place des dispositifs similaires. Allemagne 264 Md€, Italie 91 Md€, UK 87 Md€, Espagne 35 Md€ (avec « exception ibérique »). Au total ~700 Md€ d'aides énergétiques mobilisées dans l'UE 2021-2024 (Bruegel). La France est dans la moyenne haute.",
  },
  {
    mythe: "« Le bouclier est terminé en 2024 »",
    realite:
      "PARTIELLEMENT VRAI. Le bouclier gaz a été supprimé en juin 2023 (fin du TRV). Le bouclier électricité existe encore en partie via maintien d'une TICFE réduite et de l'ARENH élargi (jusqu'à fin 2025). L'amortisseur entreprises est éteint fin 2024. Le chèque énergie historique (préexistant) reste.",
  },
  {
    mythe: "« Le bouclier a contribué à la transition énergétique »",
    realite:
      "PLUTÔT FAUX. Selon I4CE, le bouclier a annulé l'effet d'aubaine sur la sobriété et la rénovation que la flambée des prix aurait dû créer. La France a moins économisé d'énergie que ses voisins (-7 % conso en 2022 vs -12 % Allemagne, -10 % Italie). Le débat est posé : protéger les ménages OU préserver le signal-prix climat ?",
  },
  {
    mythe: "« Le bouclier est sorti progressivement et calmement »",
    realite:
      "À NUANCER. La sortie a été chaotique : hausses successives électricité +4 %, +15 %, +10 %, fin du gel gaz en 2023, ajustements TICFE multiples. Effet politique : sentiment de hausses brutales pour les ménages, alors que les hausses cumulées correspondent en fait à un rattrapage de la sous-tarification antérieure.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TOTAL_DISPOSITIFS_MD = DISPOSITIFS_BOUCLIER.reduce(
  (acc, d) => acc + d.coutCumuleMdEur,
  0,
);
export const TOTAL_RECETTES_MD = RECETTES_BOUCLIER.reduce(
  (acc, r) => acc + r.montantMdEur,
  0,
);
export const BOUCLIER_PIB_PCT = 3.9; // ~110 Md€ / 2 800 Md€ PIB
