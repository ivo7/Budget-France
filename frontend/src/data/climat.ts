// ============================================================================
// climat.ts — investissements climat, niches défavorables, recettes carbone
// ============================================================================
//
// Sources principales (toutes publiques) :
//   - I4CE (Institut de l'Économie pour le Climat) — Panorama des
//     financements climat, édition annuelle (dernière : 2024)
//   - Pisani-Ferry & Mahfouz — « Les incidences économiques de l'action
//     pour le climat » (France Stratégie, mai 2023)
//   - Cour des comptes — « La stratégie de l'État face au changement
//     climatique » (rapport public 2024)
//   - Haut Conseil pour le Climat (HCC) — rapport annuel
//   - SNBC (Stratégie Nationale Bas-Carbone) — révision 2024
//   - ADEME, France 2030, plan d'investissement
//   - Banque de France — étude de stress climatique (2020, mise à jour)
//   - CCR — Caisse Centrale de Réassurance (catastrophes naturelles)
//
// ⚠ Approche : ordres de grandeur, sources officielles, neutralité.
// On distingue toujours « dépenses publiques », « dépenses totales (public
// + privé) », « besoin additionnel pour atteindre les objectifs ».

// ============================================================================
// Dépenses publiques climat (par poste)
// ============================================================================

export type CategorieClimat =
  | "batiment"
  | "transport"
  | "energie"
  | "industrie"
  | "agriculture"
  | "fonciere"
  | "recherche";

export const CATEGORIES_CLIMAT: Record<
  CategorieClimat,
  { label: string; color: string }
> = {
  batiment: { label: "Bâtiment / rénovation", color: "#0ea5e9" },
  transport: { label: "Transports", color: "#10b981" },
  energie: { label: "Énergies décarbonées", color: "#f59e0b" },
  industrie: { label: "Industrie / décarbonation", color: "#a855f7" },
  agriculture: { label: "Agriculture / forêt", color: "#84cc16" },
  fonciere: { label: "Adaptation / biodiversité", color: "#06b6d4" },
  recherche: { label: "Recherche / innovation", color: "#ec4899" },
};

export interface DepenseClimat {
  id: string;
  poste: string;
  emoji: string;
  categorie: CategorieClimat;
  montantMdEur: number;
  description: string;
  source: string;
}

export const DEPENSES_CLIMAT_PUBLIQUES: DepenseClimat[] = [
  {
    id: "maprimerenov",
    poste: "MaPrimeRénov' + éco-PTZ + CEE",
    emoji: "🏚️",
    categorie: "batiment",
    montantMdEur: 5.0,
    description:
      "MaPrimeRénov' (~2,5 Md€), Certificats d'Économies d'Énergie (~3 Md€/an coût pour les énergéticiens, ré-impactés sur la facture), éco-PTZ. ~700 000 dossiers MPR en 2023. Réforme 2024 a réduit le nombre de bénéficiaires (parcours unique pour rénos globales).",
    source: "PLF 2025, ANAH, ADEME",
  },
  {
    id: "transport-public",
    poste: "Transports en commun + ferroviaire (TGV, RER, RNF)",
    emoji: "🚄",
    categorie: "transport",
    montantMdEur: 8.0,
    description:
      "Subventions État aux régions (TER), infrastructures SNCF Réseau, plan vélo, RER métropolitains, Île-de-France Mobilités. Plan 100 Md€ ferroviaire 2030 annoncé (mais étalement long).",
    source: "Voies & moyens, IDFM, SNCF Réseau",
  },
  {
    id: "voiture-electrique",
    poste: "Bonus écologique + leasing social véhicules électriques",
    emoji: "🔋",
    categorie: "transport",
    montantMdEur: 1.5,
    description:
      "Bonus jusqu'à 4 000 € + leasing social (100 €/mois). Plafond budgétaire 2024 : 1 milliard, atteint en avril → arrêt anticipé. Réformes 2025 plus restrictives.",
    source: "PLF 2025, AAA Data",
  },
  {
    id: "enr",
    poste: "Soutien aux énergies renouvelables (CSPE héritée)",
    emoji: "💨",
    categorie: "energie",
    montantMdEur: 4.0,
    description:
      "Contrats d'achat hérités EDF (PV, éolien). En 2022-2023, recettes nettes positives car les prix de marché ont dépassé les tarifs d'achat (rapatriement ~30 Md€ vers l'État). En 2024-2025, retour à un coût net positif (~4 Md€).",
    source: "CRE, PLF 2025",
  },
  {
    id: "france-2030-vert",
    poste: "France 2030 (volet décarbonation industrie)",
    emoji: "🏭",
    categorie: "industrie",
    montantMdEur: 5.0,
    description:
      "Sur 54 Md€ du plan France 2030 sur 5 ans, ~50 % est fléché vert. Inclut H2 vert (1,9 Md€), batteries (1,5 Md€), nucléaire SMR (1 Md€), capture carbone, sites industriels décarbonés.",
    source: "France 2030, SGPI",
  },
  {
    id: "agriculture-pac",
    poste: "Verdissement PAC + Plan stratégique national",
    emoji: "🌾",
    categorie: "agriculture",
    montantMdEur: 2.0,
    description:
      "Sur ~9 Md€ de PAC France 2023-2027, ~25 % est conditionné à des pratiques agroenvironnementales (écorégimes, MAEC). Critiqué pour son ambition limitée (Cour des comptes 2024).",
    source: "PAC 2023-2027, MASA",
  },
  {
    id: "ademe-fonds-vert",
    poste: "ADEME + Fonds vert + agences eau",
    emoji: "🌱",
    categorie: "fonciere",
    montantMdEur: 3.5,
    description:
      "Budget ADEME ~1,7 Md€, Fonds vert collectivités (~2,5 Md€ initialement, réduit à ~1,2 Md€ en 2025), agences de l'eau (programmes adaptation).",
    source: "PLF 2025, ADEME",
  },
  {
    id: "epr2",
    poste: "Nouveau nucléaire (EPR2 × 6 + EPR Flamanville)",
    emoji: "⚛️",
    categorie: "energie",
    montantMdEur: 4.0,
    description:
      "Programme 6 EPR2 estimé à 51,7 Md€ (chiffres EDF, septembre 2024). Linéarisé sur 12 ans = ~4 Md€/an. Garantis financièrement par l'État. Mise en service la plus tôt 2038. EPR Flamanville (~13,2 Md€ au total) mis en service 2024.",
    source: "EDF, CRE, Cour des comptes",
  },
  {
    id: "foret",
    poste: "Forêt + biodiversité + adaptation côtes",
    emoji: "🌲",
    categorie: "fonciere",
    montantMdEur: 0.8,
    description:
      "Plan Forêt 2030 (200 M€/an), Office Français Biodiversité, parcs nationaux, érosion côtière (CFA, Conservatoire littoral).",
    source: "MAA, OFB",
  },
  {
    id: "recherche-climat",
    poste: "Recherche climat (CNRS, CEA, IFREMER, INRAE)",
    emoji: "🔬",
    categorie: "recherche",
    montantMdEur: 1.0,
    description:
      "Programmes prioritaires de recherche (PPR), équivalents fonctions climatiques des EPST (climat, océans, biodiversité, énergies). Sous-estimation possible (périmètre flou).",
    source: "MESR, CNRS",
  },
];

// ============================================================================
// Niches fiscales défavorables au climat (« subventions fossiles »)
// ============================================================================

export interface NicheDefavorable {
  id: string;
  poste: string;
  emoji: string;
  montantMdEur: number;
  beneficiaires: string;
  description: string;
  source: string;
}

export const NICHES_DEFAVORABLES_CLIMAT: NicheDefavorable[] = [
  {
    id: "ticpe-gazole-pro",
    poste: "TICPE réduite sur gazole professionnel (TRM, BTP)",
    emoji: "🚛",
    montantMdEur: 3.5,
    beneficiaires: "Transporteurs routiers de marchandises, BTP",
    description:
      "Remboursement partiel de la TICPE pour ~38 000 entreprises de transport routier. Trajectoire de réduction annoncée puis reportée à plusieurs reprises. Sortie planifiée à horizon 2030 (loi Climat & Résilience).",
    source: "Voies & moyens tome II, PLF 2025",
  },
  {
    id: "ticpe-agricole",
    poste: "TICPE/TICR carburants agricoles + pêche",
    emoji: "🚜",
    montantMdEur: 1.5,
    beneficiaires: "Exploitations agricoles, pêcheurs",
    description:
      "Tarif réduit pour le GNR (Gazole Non Routier) utilisé en agriculture et pêche. La crise agricole de 2024 a entraîné un gel des hausses prévues. Aide ciblée mais climatiquement contre-productive.",
    source: "PLF 2025, douanes",
  },
  {
    id: "kerosene",
    poste: "Exonération TICPE kérosène aviation (vols intl)",
    emoji: "✈️",
    montantMdEur: 3.0,
    beneficiaires: "Compagnies aériennes",
    description:
      "Le kérosène aviation internationale est exonéré de TICPE (Convention de Chicago 1944). Coût théorique pour le budget ~3 Md€/an. La taxe de solidarité (Chirac) et la taxe sur les billets compensent partiellement (~1 Md€).",
    source: "PLF 2025, CCFA",
  },
  {
    id: "gaz-industriels",
    poste: "Tarifs réduits gaz industries et cogénération",
    emoji: "🏭",
    montantMdEur: 1.0,
    beneficiaires: "Industries électro-intensives, cogénération",
    description:
      "Tarifs réduits TICGN pour les sites industriels électro-intensifs et la cogénération gaz. Justification : compétitivité internationale. Question : faut-il aider à maintenir des process à gaz ou aider à décarboner ?",
    source: "Voies & moyens, Cour des comptes",
  },
  {
    id: "voiture-fonction",
    poste: "Avantage en nature voitures de fonction thermiques",
    emoji: "🚙",
    montantMdEur: 1.0,
    beneficiaires: "Salariés et entreprises",
    description:
      "L'avantage en nature pour voiture de fonction est fiscalement très avantageux et peu modulé selon les émissions CO2 (vs barème allemand ou néerlandais). ~30 % des immatriculations neuves France.",
    source: "Réseau Action Climat 2023",
  },
];

// ============================================================================
// Recettes liées au carbone / aux énergies fossiles
// ============================================================================

export interface RecetteCarbone {
  poste: string;
  emoji: string;
  montantMdEur: number;
  description: string;
  source: string;
}

export const RECETTES_CARBONE: RecetteCarbone[] = [
  {
    poste: "TICPE (totale, dont composante carbone)",
    emoji: "⛽",
    montantMdEur: 32.0,
    description:
      "Taxe Intérieure de Consommation sur les Produits Énergétiques. La composante carbone fixée à 44,6 €/tCO2 depuis 2018 (gelée). Recette globale ~32 Md€/an, dont ~10 Md€ sont attribuables à la composante carbone.",
    source: "Douanes, INSEE",
  },
  {
    poste: "ETS (marché carbone européen, allocations)",
    emoji: "🌍",
    montantMdEur: 3.5,
    description:
      "Système d'échange de quotas carbone UE (EU-ETS). Recettes France issues des enchères : ~3-5 Md€/an selon prix carbone (qui était à ~70 €/tCO2 fin 2024, prévision hausse vers 100 €).",
    source: "Commission UE, CRE",
  },
  {
    poste: "Taxes sur les billets d'avion (TSBA + solidarité)",
    emoji: "🛫",
    montantMdEur: 1.0,
    description:
      "Taxe sur les billets (1-63 € selon distance/classe) + taxe de solidarité (Chirac). Hausse votée fin 2024 (~+1 Md€). Affectation partielle à AFD / fonds climat.",
    source: "DGAC, PLF 2025",
  },
  {
    poste: "Malus écologique automobile + CO2 entreprises",
    emoji: "🚘",
    montantMdEur: 1.0,
    description:
      "Malus à l'achat de véhicules thermiques (jusqu'à 60 000 €), malus au poids (>1 600 kg), TVS entreprises sur véhicules thermiques. Recettes en hausse, équivalent ~1 Md€/an.",
    source: "PLF 2025, AAA Data",
  },
];

// ============================================================================
// Besoin d'investissement (rapport Pisani-Ferry & Mahfouz 2023)
// ============================================================================

export interface BesoinInvest {
  poste: string;
  emoji: string;
  besoinMdEur: number;
  description: string;
}

export const BESOIN_INVESTISSEMENT_PISANI_FERRY: BesoinInvest[] = [
  {
    poste: "Rénovation thermique des bâtiments",
    emoji: "🏠",
    besoinMdEur: 20.0,
    description:
      "Rythme à atteindre : 700 000 rénovations performantes/an (vs ~70 000 actuellement). Marqueur de l'effort d'investissement nécessaire selon Pisani-Ferry.",
  },
  {
    poste: "Mobilités décarbonées (rail, vélo, VE)",
    emoji: "🚲",
    besoinMdEur: 15.0,
    description:
      "Réseau ferroviaire (régénération + nouveaux RER), infrastructure recharge VE, plan vélo. La part publique des 15 Md€/an additionnels est estimée à ~10 Md€.",
  },
  {
    poste: "Production d'électricité décarbonée",
    emoji: "⚡",
    besoinMdEur: 15.0,
    description:
      "Nouveau nucléaire + EnR (éolien offshore, solaire). RTE estime besoin x2 production électrique d'ici 2050. ~15 Md€/an d'investissement annuel à mobiliser.",
  },
  {
    poste: "Industrie (décarbonation des process)",
    emoji: "🏭",
    besoinMdEur: 8.0,
    description:
      "Les 50 sites les plus émetteurs (raffineries, ciment, sidérurgie, chimie) représentent ~25 % des émissions industrielles. Investissements lourds requis.",
  },
  {
    poste: "Agriculture, forêt, captage",
    emoji: "🌳",
    besoinMdEur: 8.0,
    description:
      "Évolution des pratiques (couverts, agroforesterie, élevage), forêt (renouvellement face au dépérissement), captage du carbone par les sols.",
  },
];

// Total besoin invest annuel = ~66 Md€/an d'investissements ADDITIONNELS
// vs niveau actuel (Pisani-Ferry 2023). Dont moitié public.
export const BESOIN_INVEST_TOTAL_MD = BESOIN_INVESTISSEMENT_PISANI_FERRY.reduce(
  (acc, b) => acc + b.besoinMdEur,
  0,
);

// ============================================================================
// Études économiques principales
// ============================================================================

export interface EtudeClimat {
  source: string;
  annee: string;
  conclusion: string;
  resume: string;
  url: string;
}

export const ETUDES_CLIMAT: EtudeClimat[] = [
  {
    source: "Pisani-Ferry & Mahfouz — France Stratégie",
    annee: "2023",
    conclusion: "+66 Md€/an d'investissement additionnel d'ici 2030",
    resume:
      "Le rapport de référence pour le débat français. Conclut qu'atteindre les objectifs SNBC 2030 demande +66 Md€/an d'investissements supplémentaires (public + privé) vs trajectoire actuelle. Effet PIB à court terme : -0,3 à -0,5 point ; neutre à positif à long terme. Suggère un « ISF vert » temporaire (5 Md€/an pendant 10 ans) pour financer.",
    url: "https://www.strategie.gouv.fr/publications/incidences-economiques-de-laction-climat",
  },
  {
    source: "I4CE — Panorama des financements climat",
    annee: "2024",
    conclusion: "~110 Md€/an d'invest climat total (public + privé) en 2023",
    resume:
      "L'indicateur de référence. Investissements totaux climat France 2023 : ~110 Md€. Part publique : ~33 Md€. Forte progression vs 2018 (~50 Md€). Mais besoin d'aller plus loin pour atteindre les rythmes SNBC : besoin +30 Md€/an additionnels selon I4CE (cohérent avec Pisani-Ferry à périmètre comparable).",
    url: "https://www.i4ce.org",
  },
  {
    source: "Cour des comptes — Stratégie climat de l'État",
    annee: "2024",
    conclusion: "Pilotage public insuffisant face aux objectifs",
    resume:
      "Critique le manque de cohérence entre les objectifs (réduction 55 % émissions vs 1990 en 2030) et les moyens budgétaires alloués. Recommande un budget climat consolidé, un pilotage interministériel renforcé, et des indicateurs d'impact plutôt que d'inputs.",
    url: "https://www.ccomptes.fr",
  },
  {
    source: "Haut Conseil pour le Climat (HCC)",
    annee: "2024",
    conclusion: "Rythme de baisse des émissions à doubler",
    resume:
      "Sur 2022-2023, émissions GES France en baisse (-4,8 % en 2023). Mais le rythme doit doubler pour atteindre -55 % en 2030. Le HCC alerte sur la régression de plusieurs leviers (rénovation, transport, agriculture).",
    url: "https://www.hautconseilclimat.fr",
  },
  {
    source: "Banque de France — stress test climatique",
    annee: "2020, 2023",
    conclusion: "Coût inaction 3-4× supérieur au coût de l'action",
    resume:
      "Test de stress des banques et assurances face aux risques climatiques. Sans action : pertes PIB potentielles -10 à -30 % en 2050 (scénario tendanciel). Avec transition : -0,3 à -2 % court terme, neutre/positif long terme. Risque physique (catastrophes) et risque de transition (actifs échoués).",
    url: "https://www.banque-france.fr",
  },
];

// ============================================================================
// Coûts physiques du changement climatique (impacts déjà visibles)
// ============================================================================

export interface CoutPhysique {
  poste: string;
  emoji: string;
  montantMdEur: number;
  horizon: string;
  description: string;
  source: string;
}

export const COUTS_PHYSIQUES_CLIMAT: CoutPhysique[] = [
  {
    poste: "Indemnisations catastrophes naturelles (CCR)",
    emoji: "🌊",
    montantMdEur: 4.5,
    horizon: "annuel moyen 2020-2024",
    description:
      "Caisse Centrale de Réassurance — couverture sécheresses (RGA), inondations, submersions. 2022 a coûté ~10 Md€ aux assureurs (sécheresse historique). Projection +200 % d'ici 2050 sans adaptation.",
    source: "CCR, France Assureurs",
  },
  {
    poste: "Agriculture — pertes climatiques + indemnisations",
    emoji: "🌾",
    montantMdEur: 1.5,
    horizon: "annuel moyen",
    description:
      "Régime des calamités agricoles + assurance récolte aidée. 2022 et 2024 ont entraîné des dépassements (1,5-2 Md€ vs 600 M€ budget normal). Tendance à la hausse structurelle.",
    source: "MASA, DGFiP",
  },
  {
    poste: "Santé — canicules + qualité air",
    emoji: "🏥",
    montantMdEur: 2.0,
    horizon: "estimation annuelle",
    description:
      "Coût sanitaire des canicules (excès mortalité, hospitalisations) + pollution air (estimée 100 Md€/an coût social total, dont une part imputable au climat). Difficile à isoler précisément du coût pollution global.",
    source: "Santé publique France, ANSES",
  },
  {
    poste: "Adaptation forêts (dépérissement, incendies)",
    emoji: "🔥",
    montantMdEur: 1.0,
    horizon: "annuel",
    description:
      "Incendies 2022 (Landes, Gironde) : ~70 000 ha brûlés, coût ~0,5 Md€. Dépérissement épicéas, hêtres : reconstitution forêts (plan 200 M€/an non suffisant selon ONF).",
    source: "ONF, DGPR",
  },
];

// ============================================================================
// Mythes courants à confronter aux données
// ============================================================================

export const MYTHES_CLIMAT = [
  {
    mythe: "« Agir pour le climat coûte trop cher, on n'a pas les moyens »",
    realite:
      "INCOMPLET. Les coûts de l'INACTION sont 3 à 4 fois supérieurs aux coûts de l'action selon Banque de France et Stern (2006). Pisani-Ferry chiffre le coût de transition à ~0,3-0,5 point de PIB court terme, neutre à long terme. Sans action : pertes PIB -10 à -30 % en 2050 (Banque de France). Le débat sérieux porte sur le financement (qui paie, dette ou impôt) pas sur le coût total.",
  },
  {
    mythe: "« La France est déjà décarbonée grâce au nucléaire »",
    realite:
      "EN PARTIE. La France émet ~4,5 tCO2/habitant/an (2023), contre 8 en moyenne UE et 15 aux US. Bon point, mais l'objectif SNBC est 2 tCO2/hab d'ici 2050 — il faut diviser encore par 2. Le mix électrique est très décarboné (~70 % nucléaire + 25 % renouvelables = 92 % bas-carbone), mais les transports, le bâtiment, l'industrie et l'agriculture représentent ~80 % des émissions et restent à décarboner.",
  },
  {
    mythe: "« Les éoliennes ne servent à rien et défigurent le paysage »",
    realite:
      "FAUX (sur l'utilité). En 2023, éolien + solaire = ~14 % du mix électrique français (RTE). Coût de production en 2024 : ~50-60 €/MWh éolien terrestre, ~40-50 €/MWh solaire utility — moins cher que le nouveau nucléaire EPR2 estimé ~70-100 €/MWh (Cour des comptes). Le débat paysager / acceptabilité est légitime mais distinct de l'utilité énergétique.",
  },
  {
    mythe: "« Action climat = perte de croissance et chômage »",
    realite:
      "À NUANCER. Pisani-Ferry : -0,3 à -0,5 point PIB à court terme (jusqu'à 2030), neutre à positif ensuite. Sur l'emploi : +1 emploi créé pour rénovation/EnR = >1 emploi perdu dans fossile (étude OCDE). Effet net positif sur emploi (~+500 K à 2030 selon ADEME). Coût de transition pas nul mais bien inférieur au coût d'inaction.",
  },
  {
    mythe: "« On peut tout résoudre avec le nucléaire EPR2 »",
    realite:
      "INSUFFISANT SEUL. Programme 6 EPR2 = 52 Md€ (EDF septembre 2024), première mise en service ≥ 2038. Apportera ~9 GW = ~70 TWh/an = ~15 % conso actuelle. RTE prévoit conso x2 d'ici 2050. Donc même 14 EPR2 ne suffiraient pas — il faut nucléaire + EnR + sobriété. Choix politique ≠ choix scientifique : le débat est sur le mix exact.",
  },
  {
    mythe: "« MaPrimeRénov' coûte cher pour peu d'efficacité »",
    realite:
      "À NUANCER. MPR a touché ~700 000 ménages en 2023, mais peu de rénovations « performantes » (1 ou 2 gestes en moyenne). La réforme 2024 (parcours unique pour rénovation globale) corrige ce biais mais a divisé par 3 le nombre de bénéficiaires. Tension classique entre quantité (geste unique) et qualité (rénovation BBC). Effet emploi local + facture énergie + santé pas toujours intégrés au calcul ROI.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TOTAL_DEPENSES_CLIMAT_MD = DEPENSES_CLIMAT_PUBLIQUES.reduce(
  (acc, d) => acc + d.montantMdEur,
  0,
);
export const TOTAL_NICHES_DEFAVORABLES_MD = NICHES_DEFAVORABLES_CLIMAT.reduce(
  (acc, n) => acc + n.montantMdEur,
  0,
);
export const TOTAL_RECETTES_CARBONE_MD = RECETTES_CARBONE.reduce(
  (acc, r) => acc + r.montantMdEur,
  0,
);
export const TOTAL_COUTS_PHYSIQUES_MD = COUTS_PHYSIQUES_CLIMAT.reduce(
  (acc, c) => acc + c.montantMdEur,
  0,
);

// Ordre de grandeur référence I4CE 2024
export const INVEST_CLIMAT_TOTAL_2023_MD = 110; // public + privé
export const INVEST_CLIMAT_PUBLIC_2023_MD = 33; // part publique
export const BESOIN_ADDITIONNEL_PISANI_FERRY_MD = 66; // par an d'ici 2030
