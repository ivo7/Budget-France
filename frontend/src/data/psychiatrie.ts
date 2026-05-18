// ============================================================================
// psychiatrie.ts — santé mentale, psychiatrie, dépenses publiques et délais
// ============================================================================
//
// Sources principales (toutes publiques) :
//   - OCDE — Health at a Glance, rapport « A New Benchmark for Mental
//     Health Systems » (2021) et estimation coût santé mentale France
//   - Cour des comptes — rapport « Les parcours dans l'organisation des
//     soins de psychiatrie » (février 2023)
//   - Santé publique France — surveillance dépression, suicide
//   - IGAS — rapports inspection psychiatrie
//   - HAS — recommandations, baromètre annuel
//   - Délégation à la santé mentale et à la psychiatrie (DGOS)
//   - Assises de la Santé Mentale et de la Psychiatrie (2021)
//   - CNRSM — Conseil National de la Refondation Santé Mentale
//   - DREES — comptes nationaux de la santé, AAH, ALD
//
// ⚠ Sujet sensible. La page présente des chiffres officiels pour montrer
// l'ampleur du sujet (1 Français sur 5 par an touché par un trouble) et le
// décalage entre les besoins et les moyens. Le numéro 3114 (prévention
// suicide, gratuit, 24/7) est mis en avant à la fin.

// ============================================================================
// Populations touchées
// ============================================================================

export interface PopulationPsy {
  label: string;
  emoji: string;
  population: string; // formaté pour la lecture (peut inclure unité)
  populationN: number; // valeur numérique pour tri/comparaison (en millions ou unités)
  description: string;
  source: string;
}

export const POPULATIONS_PSY: PopulationPsy[] = [
  {
    label: "Français touchés par un trouble psy/an",
    emoji: "🧠",
    population: "~13 M",
    populationN: 13,
    description:
      "1 personne sur 5 chaque année selon Santé publique France et OCDE. Dépression, anxiété généralisée, troubles bipolaires, addictions, schizophrénie, troubles obsessionnels compulsifs. Prévalence en hausse post-Covid (+15-20 % chez les jeunes).",
    source: "Santé publique France, OCDE",
  },
  {
    label: "Personnes en suivi psychiatrique régulier",
    emoji: "🏥",
    population: "~3 M",
    populationN: 3,
    description:
      "Patients suivis en CMP, hôpital psychiatrique, libéral ou en ALD psychiatrie. Forte sous-déclaration : beaucoup ne consultent jamais malgré des troubles (~50 % selon HAS).",
    source: "ATIH, CNAM 2024",
  },
  {
    label: "Enfants avec trouble psy",
    emoji: "👧",
    population: "~1 sur 8",
    populationN: 1.8,
    description:
      "Selon HAS et Santé publique France : 1 enfant sur 8 a un trouble psychique (TDAH, dépression, anxiété, troubles du spectre autistique, troubles alimentaires). En hausse marquée post-Covid.",
    source: "HAS 2023, Santé publique France",
  },
  {
    label: "Étudiants en détresse psychologique",
    emoji: "🎓",
    population: "~30 %",
    populationN: 0.65,
    description:
      "30 % des étudiants présentent des symptômes dépressifs (cohorte i-Share, INSERM). 1 sur 5 a déjà eu des pensées suicidaires. Sous-investissement chronique en santé mentale universitaire.",
    source: "INSERM i-Share, CNOUS",
  },
  {
    label: "Hospitalisations psychiatriques/an",
    emoji: "🚑",
    population: "~600 K",
    populationN: 0.6,
    description:
      "~600 000 séjours hospitaliers psychiatriques par an (ATIH). Dont ~85 000 hospitalisations sans consentement (HSC), en hausse depuis 10 ans. Lits temps plein : ~53 000 (vs 250 000 en 1980).",
    source: "ATIH 2024",
  },
  {
    label: "Décès par suicide/an",
    emoji: "💔",
    population: "~9 000",
    populationN: 0.009,
    description:
      "~9 000 décès par suicide par an en France (24/jour). 3ᵉ cause de mortalité chez les 15-29 ans. ~200 000 tentatives non létales/an. Numéro national de prévention : 3114 (gratuit, 24h/24).",
    source: "CépiDc INSERM, Santé publique France",
  },
];

// ============================================================================
// Délais d'accès aux soins (le vrai indicateur de crise)
// ============================================================================

export interface DelaiAcces {
  service: string;
  emoji: string;
  delaiMin: number; // en jours
  delaiMax: number;
  description: string;
  source: string;
}

export const DELAIS_ACCES: DelaiAcces[] = [
  {
    service: "Premier RDV CMP adulte",
    emoji: "⏳",
    delaiMin: 60,
    delaiMax: 180,
    description:
      "Centre Médico-Psychologique (CMP) : porte d'entrée principale, gratuit. Délais 2 à 6 mois en moyenne pour un 1ᵉʳ rendez-vous. Dans les zones tendues (Île-de-France, métropoles), peut atteindre 12 mois.",
    source: "Cour des comptes 2023, IGAS",
  },
  {
    service: "Premier RDV CMP enfant/adolescent",
    emoji: "👦",
    delaiMin: 180,
    delaiMax: 540,
    description:
      "CMP enfant : délais critiques 6 à 18 mois pour un 1ᵉʳ rendez-vous. Conséquence : urgence pédopsychiatrique en explosion (+30 % en 5 ans selon SAMU). Manque structurel de pédopsychiatres.",
    source: "Cour des comptes 2023, Défenseur des droits",
  },
  {
    service: "RDV psychiatre libéral (secteur 1)",
    emoji: "👨‍⚕️",
    delaiMin: 90,
    delaiMax: 180,
    description:
      "Psychiatre secteur 1 (~25 €/consultation, remboursé). Délais 3-6 mois en zone urbaine. Secteur 2 (dépassements honoraires) : délais plus courts mais reste à charge ~30-60 €.",
    source: "CNAM, baromètre médecin France 2024",
  },
  {
    service: "Hospitalisation programmée",
    emoji: "🛌",
    delaiMin: 30,
    delaiMax: 90,
    description:
      "Hospitalisation libre programmée (hors urgence) : 1-3 mois. Les hospitalisations sans consentement (HSC) sont immédiates mais traumatisantes (78 % du temps via urgences générales).",
    source: "ATIH, Contrôleur des lieux privation liberté",
  },
  {
    service: "MonSoutienPsy (psychologue conventionné)",
    emoji: "💬",
    delaiMin: 7,
    delaiMax: 60,
    description:
      "Dispositif créé en 2022 : 12 séances/an remboursées chez psychologue conventionné (~50 €/séance). Délai variable mais souvent court. Limite : seulement ~15 % des psychologues sont conventionnés.",
    source: "CNAM, FFPP 2024",
  },
];

// ============================================================================
// Dépenses publiques santé mentale / psychiatrie
// ============================================================================

export type CategoriePsy =
  | "hospitalier"
  | "ambulatoire"
  | "medicaments"
  | "social"
  | "prevention";

export const CATEGORIES_PSY: Record<
  CategoriePsy,
  { label: string; color: string }
> = {
  hospitalier: { label: "Hospitalier", color: "#0ea5e9" },
  ambulatoire: { label: "Ambulatoire / CMP", color: "#10b981" },
  medicaments: { label: "Médicaments", color: "#f59e0b" },
  social: { label: "Social / handicap psy", color: "#a855f7" },
  prevention: { label: "Prévention / nouveau", color: "#ec4899" },
};

export interface DepensePsy {
  id: string;
  poste: string;
  emoji: string;
  categorie: CategoriePsy;
  montantMdEur: number;
  financeur: string;
  description: string;
  source: string;
}

export const DEPENSES_PSY: DepensePsy[] = [
  {
    id: "hopital-psy",
    poste: "Hospitalisation psychiatrique (temps plein + jour)",
    emoji: "🏥",
    categorie: "hospitalier",
    montantMdEur: 10.0,
    financeur: "Assurance Maladie",
    description:
      "Séjours en hôpital psychiatrique : ~600 000 séjours/an. Tarification spécifique (Dotation Annuelle de Financement, DAF, en cours de réforme). 53 000 lits aujourd'hui vs 250 000 en 1980 (politique de désinstitutionnalisation).",
    source: "ATIH, DGOS 2024",
  },
  {
    id: "cmp",
    poste: "CMP (Centres Médico-Psychologiques) + ambulatoire",
    emoji: "🏛️",
    categorie: "ambulatoire",
    montantMdEur: 3.5,
    financeur: "Assurance Maladie (hôpital sectorisé)",
    description:
      "~3 000 CMP en France : la porte d'entrée publique de la psychiatrie de secteur (gratuit). Mais sous-doté en effectifs : Cour des comptes 2023 documente une « crise systémique ».",
    source: "Cour des comptes 2023, DGOS",
  },
  {
    id: "psychiatres-liberal",
    poste: "Psychiatres libéraux + médecine de ville",
    emoji: "👨‍⚕️",
    categorie: "ambulatoire",
    montantMdEur: 1.5,
    financeur: "Assurance Maladie",
    description:
      "Honoraires psychiatres libéraux remboursés (consultations, actes). ~6 000 psychiatres libéraux. Densité très inégale : 25/100 000 hab Paris vs 5/100 000 zones rurales.",
    source: "CNAM 2024",
  },
  {
    id: "medicaments-psy",
    poste: "Médicaments psychotropes (antidépresseurs, anxiolytiques, etc.)",
    emoji: "💊",
    categorie: "medicaments",
    montantMdEur: 1.5,
    financeur: "Assurance Maladie",
    description:
      "Antidépresseurs (~6 M de Français en consomment), anxiolytiques (benzodiazépines, ~10 M), neuroleptiques, lithium. France championne européenne pour benzodiazépines (surconsommation documentée).",
    source: "CNAM, ANSM 2024",
  },
  {
    id: "ald-psy",
    poste: "ALD 23 (Affections psychiatriques de longue durée)",
    emoji: "📋",
    categorie: "ambulatoire",
    montantMdEur: 2.5,
    financeur: "Assurance Maladie (prise en charge 100 %)",
    description:
      "ALD 23 = troubles psychiatriques durables (schizophrénie, bipolarité, dépression sévère, TOC sévère). ~1 M de bénéficiaires. Prise en charge intégrale du parcours de soins.",
    source: "CNAM 2024",
  },
  {
    id: "monsoutienpsy",
    poste: "MonSoutienPsy (psychologues conventionnés)",
    emoji: "💬",
    categorie: "prevention",
    montantMdEur: 0.15,
    financeur: "Assurance Maladie",
    description:
      "Créé 2022, élargi 2024 à 12 séances/an chez psychologue conventionné. ~750 000 bénéficiaires en 2024. Réformé : suppression de l'ordonnance médicale (accès direct depuis 2024).",
    source: "PLFSS 2025, CNAM",
  },
  {
    id: "esat-itep-ime",
    poste: "ESAT / ITEP / IME pour handicap psychique",
    emoji: "🏫",
    categorie: "social",
    montantMdEur: 3.0,
    financeur: "Assurance Maladie (CNSA) + Départements",
    description:
      "Établissements et Services pour personnes en situation de handicap psychique : ITEP (enfants), IME (intellectuel), ESAT (travail protégé), FAM, MAS. Capacité saturée, listes d'attente.",
    source: "DREES, CNSA 2024",
  },
  {
    id: "aah-psy",
    poste: "AAH (part liée aux troubles psy)",
    emoji: "💶",
    categorie: "social",
    montantMdEur: 5.0,
    financeur: "État (CAF)",
    description:
      "Sur 12,5 Md€ AAH totale, ~40 % est attribué pour troubles psychiques (1ʳᵉ cause de handicap reconnu MDPH). Soit ~5 Md€ pour le handicap psychique adulte.",
    source: "CNAF, CNSA 2024",
  },
  {
    id: "cmpp-maisons-ado",
    poste: "CMPP + Maisons des Adolescents",
    emoji: "🏠",
    categorie: "prevention",
    montantMdEur: 0.6,
    financeur: "Assurance Maladie + collectivités",
    description:
      "Centres Médico-Psycho-Pédagogiques (CMPP) pour enfants ~0,5 Md€ + Maisons des Adolescents (130 sites) ~0,1 Md€. Premier accès gratuit, pluridisciplinaire.",
    source: "CNSA, ARS",
  },
  {
    id: "prevention-suicide",
    poste: "Prévention suicide + 3114",
    emoji: "📞",
    categorie: "prevention",
    montantMdEur: 0.05,
    financeur: "État (DGOS)",
    description:
      "Numéro national 3114 (lancé octobre 2021, gratuit 24/7). VigilanS (recontact post-tentative). Programmes Papageno pour les médias. Budget cumulé ~50 M€/an. Très en deçà des standards OCDE.",
    source: "DGOS, OMS",
  },
];

// ============================================================================
// Études économiques principales
// ============================================================================

export interface EtudePsy {
  source: string;
  annee: string;
  conclusion: string;
  resume: string;
  url: string;
}

export const ETUDES_PSY: EtudePsy[] = [
  {
    source: "OCDE — Coût santé mentale France",
    annee: "2018, mis à jour 2024",
    conclusion: "~163 Md€/an de coût social total (4,3 % du PIB)",
    resume:
      "Coût total société (soins directs + perte productivité + handicap + prévention insuffisante) : ~163 Md€/an. C'est l'estimation la plus citée. Compare la France à des pays mieux pourvus (Pays-Bas, Canada, Royaume-Uni) où le ratio est meilleur.",
    url: "https://www.oecd.org/health",
  },
  {
    source: "Cour des comptes — Parcours en psychiatrie",
    annee: "2023",
    conclusion: "Système en crise structurelle, parcours dégradés",
    resume:
      "Rapport sévère. Constate : effectifs psychiatriques hospitaliers en chute (-25 % en 10 ans), délais CMP enfants jusqu'à 18 mois, hospitalisations sans consentement en hausse, défaut d'articulation hôpital/ambulatoire. Recommande une refonte du financement (mode T2A adapté) et un plan d'effectifs.",
    url: "https://www.ccomptes.fr",
  },
  {
    source: "IGAS — Sectorisation psychiatrique",
    annee: "2021",
    conclusion: "Sectorisation à repenser, hétérogénéité forte",
    resume:
      "La sectorisation (chaque territoire a un secteur psy de référence) est un atout en théorie mais souffre d'une grande hétérogénéité de moyens. Certains secteurs disposent de 3× plus de ressources que d'autres pour la même population.",
    url: "https://www.igas.gouv.fr",
  },
  {
    source: "Santé publique France — Suicide en France",
    annee: "2024",
    conclusion: "Stabilité globale, mais hausse chez les jeunes femmes",
    resume:
      "9 000 décès par suicide/an, stable sur 5 ans. Mais inquiétante hausse chez les jeunes femmes 15-25 ans (+30 % de tentatives depuis 2020). Effet Covid documenté, et exposition réseaux sociaux. 3114 lancé en réponse.",
    url: "https://www.santepubliquefrance.fr",
  },
  {
    source: "Assises Santé Mentale 2021 — CNRSM 2024",
    annee: "2021, 2024",
    conclusion: "Plan ambitieux annoncé, mise en œuvre partielle",
    resume:
      "Assises 2021 ont annoncé : élargissement MonSoutienPsy, ouverture du numéro 3114, recrutement de psychiatres. Le Conseil National de la Refondation Santé Mentale (CNRSM) en 2024 acte les avancées mais souligne le retard d'application sur les effectifs hospitaliers.",
    url: "https://solidarites-sante.gouv.fr",
  },
];

// ============================================================================
// Mythes courants
// ============================================================================

export const MYTHES_PSY = [
  {
    mythe: "« La santé mentale, ça concerne peu de gens »",
    realite:
      "FAUX. 1 Français sur 5 connaît un trouble psychique chaque année (Santé publique France, OCDE). 1 sur 3 sur la vie entière. Première cause d'arrêt maladie longue durée. Première cause d'AAH (5 Md€ versés/an pour handicap psy). C'est l'enjeu de santé publique le plus sous-traité financièrement par rapport à sa prévalence réelle.",
  },
  {
    mythe: "« MonSoutienPsy a réglé le problème de l'accès »",
    realite:
      "TRÈS INSUFFISANT. Le dispositif (12 séances/an depuis 2024) a touché ~750 000 personnes en 2024 — c'est un progrès. Mais limites : seulement ~15 % des psychologues sont conventionnés, et 12 séances ne suffisent pas pour des troubles structurels (dépression chronique, anxiété généralisée). MonSoutienPsy = bonne porte d'entrée, pas une solution globale.",
  },
  {
    mythe: "« Les enfants n'ont pas de troubles psy, c'est juste l'âge »",
    realite:
      "FAUX. 1 enfant sur 8 a un trouble psy diagnostiqué (HAS). TDAH, troubles anxieux, dépression de l'enfant, troubles du spectre autistique, troubles alimentaires précoces. La pédopsychiatrie est l'angle mort le plus criant : délais CMP enfant de 6 à 18 mois, urgences pédopsychiatriques saturées.",
  },
  {
    mythe: "« Il suffit d'augmenter les lits psychiatriques »",
    realite:
      "INCOMPLET. La France a fermé 75 % de ses lits psy depuis 1980 (250 000 → 53 000). Mais l'objectif moderne (OMS, OCDE) est l'ambulatoire renforcé, pas l'hospitalisation longue. Le vrai problème : insuffisance d'ALTERNATIVES à l'hospitalisation (CMP, équipes mobiles, hôpitaux de jour). Sans ces alternatives, les hospitalisations sans consentement explosent.",
  },
  {
    mythe: "« Le suicide est un drame individuel, pas un problème public »",
    realite:
      "FAUX. 9 000 décès/an = 3ᵉ cause de mortalité chez les 15-29 ans. La prévention est documentée et efficace : numéros d'écoute (3114 en France, 988 USA), recontact post-tentative (VigilanS), formation des « gatekeepers » (médecins généralistes, urgentistes, professeurs). L'OMS estime que 60-80 % des suicides sont évitables avec une politique adaptée.",
  },
  {
    mythe: "« La stigmatisation a beaucoup diminué »",
    realite:
      "EN PARTIE. Le tabou se lève progressivement (paroles publiques sur la dépression, MonSoutienPsy). Mais selon le baromètre Santé publique France 2023 : 7 Français sur 10 hésitent encore à consulter par crainte du jugement. 50 % pensent qu'avoir un trouble psy est « un signe de faiblesse ». La déstigmatisation reste un chantier majeur, notamment en milieu professionnel.",
  },
];

// ============================================================================
// Stats clés
// ============================================================================

export const TOTAL_DEPENSES_PSY_MD = DEPENSES_PSY.reduce(
  (acc, d) => acc + d.montantMdEur,
  0,
);
export const COUT_SOCIAL_OCDE_MD = 163; // OCDE estimation totale
export const POPULATION_TOUCHEE_M = 13; // 1 Français sur 5/an
export const SUICIDES_AN = 9000;
export const LITS_PSY_AUJOURDHUI = 53000;
export const LITS_PSY_1980 = 250000;
