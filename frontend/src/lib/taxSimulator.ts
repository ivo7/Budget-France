// ============================================================================
// Simulateur fiscal v2 — vue complète des prélèvements payés par un Français
// ============================================================================
//
// Ce module donne un ORDRE DE GRANDEUR de TOUS les prélèvements payés par
// un contribuable français : impôts directs (IR), impôts indirects (TVA,
// TICPE), cotisations sociales (salariales + patronales), CSG/CRDS, taxe
// foncière. Et il les ventile par destinataire (État, Sécu par branche,
// Unédic, communes).
//
// L'angle pédagogique ANGLE est de montrer que le prélèvement total est
// bien plus élevé que le seul IR : sur 1 € de salaire NET touché, presque
// 1 € a déjà été payé en cotisations + CSG par l'employeur et le salarié,
// auquel s'ajoutent IR + TVA + TICPE + foncier.
//
// Bercy a fait ce calculateur en 2014 puis l'a abandonné. C'est un angle
// mort majeur de la pédagogie sur les finances publiques.
//
// ⚠ Calcul SIMPLIFIÉ pour la pédagogie. Pas un avis d'imposition.
// Hypothèses explicites documentées et affichées dans l'UI.
//
// Sources :
//   - INSEE comptes des ménages 2023 (parts TVA effective)
//   - URSSAF taux moyens cotisations 2024-2025
//   - DGFiP barème IR 2024 (revenus 2024, payés 2025)
//   - DGFiP statistiques taxe foncière (moyenne nationale)
//   - LFSS 2024-2025 (clés de répartition Sécu)

// ============================================================================
// TYPES
// ============================================================================

export interface SimInput {
  /** Salaire mensuel net (déduit cotisations salariales et CSG/CRDS) */
  monthlyNet: number;
  /** Parts fiscales (1 = célibataire, 2 = couple, 2.5 = couple + 1 enfant…) */
  parts: number;
  /** Si vrai, ajoute la taxe foncière moyenne. Sinon 0. */
  proprietaire: boolean;
}

export interface SimBreakdown {
  // Inputs reconstitués
  monthlyNet: number;
  annualNet: number;
  annualGross: number;        // salaire brut annuel (estimé via reverse)
  annualSuperBrut: number;    // coût employeur = brut + cotis patronales
  parts: number;

  // Cotisations salariales (déduites du brut, vont à la Sécu/Unédic)
  cotisSal: number;
  // Cotisations patronales (en plus du brut, vont à la Sécu/Unédic)
  cotisPat: number;
  // CSG + CRDS prélevées sur le salaire
  csgcrds: number;

  // Impôts directs vers État
  ir: number;

  // Impôts indirects vers État
  tva: number;
  ticpeEtAutres: number;

  // Impôts locaux (vers commune/EPCI)
  taxeFonciere: number;

  // Totaux par destinataire (€/an)
  totalEtat: number;          // IR + TVA + TICPE
  totalSecu: number;          // cotis sociales + CSG/CRDS - part Unédic
  totalUnedic: number;        // part chômage des cotisations
  totalCommune: number;       // taxe foncière
  totalGrand: number;         // somme de tous les prélèvements

  // Indicateurs utiles
  effectiveRateSurNet: number;        // total / net touché
  effectiveRateSurSuperBrut: number;  // total / coût employeur (le « vrai » taux)
}

export interface AllocationLine {
  categorie: string;
  contribution: number;       // €/an versés
  part: number;               // 0..1
  description?: string;
}

// Ancien type (compat avec composants existants)
export interface TaxBreakdown {
  annualNetIncome: number;
  ir: number;
  tva: number;
  ticpeEtAutres: number;
  totalEtat: number;
  effectiveRate: number;
}

// ============================================================================
// CONSTANTES — taux et hypothèses
// ============================================================================

// Taux moyens 2024-2025 (source URSSAF + INSEE)
const TAUX_COTIS_SAL = 0.22;        // cotisations salariales (~22% du brut)
const TAUX_COTIS_PAT = 0.35;        // cotisations patronales (~35% du brut, moyen)
const TAUX_CSG_CRDS = 0.097;        // CSG (9.2%) + CRDS (0.5%) sur 98.25% du brut

// IR : barème 2024 (sur revenus 2024, payés en 2025)
const BAREME_IR: { upTo: number; rate: number }[] = [
  { upTo: 11_294, rate: 0.00 },
  { upTo: 28_797, rate: 0.11 },
  { upTo: 82_341, rate: 0.30 },
  { upTo: 177_106, rate: 0.41 },
  { upTo: Infinity, rate: 0.45 },
];

// Plafond avantage quotient familial 2024 (par demi-part supplémentaire)
const PLAFOND_QF_DEMI_PART = 1_759;

// Abattement forfaitaire 10% sur salaires (plafond 2024)
const ABAT_PLAFOND = 14_171;

// TVA et autres taxes indirectes (% du net)
const TAUX_TVA_EFFECTIVE = 0.07;        // taux moyen pondéré
const TAUX_TICPE_AUTRES = 0.01;         // TICPE + autres taxes indirectes

// Taxe foncière : moyenne nationale 2024 (DGFiP)
const TAXE_FONCIERE_MOYENNE = 985;

// ============================================================================
// CLÉS DE RÉPARTITION (% des prélèvements vers chaque destinataire)
// ============================================================================

// Répartition cotisations + CSG/CRDS entre branches Sécu/Unédic
// Source : LFSS 2024 (recettes par branche / total cotisations + CSG)
export const REPART_SECU = [
  { branche: "Maladie",      part: 0.40, description: "Médecins, hôpital, médicaments, biologie, transports sanitaires" },
  { branche: "Retraite",     part: 0.34, description: "CNAV (régime général) + complémentaires (Agirc-Arrco, Ircantec)" },
  { branche: "Chômage",      part: 0.07, description: "Unédic — allocations versées par France Travail" },
  { branche: "Famille",      part: 0.06, description: "CAF — prestations familiales, allocations, APL, ASF" },
  { branche: "Autonomie",    part: 0.04, description: "CNSA — APA, PCH, ESAT, EHPAD (créée en 2021)" },
  { branche: "AT/MP",        part: 0.025, description: "Accidents du travail et maladies professionnelles" },
  { branche: "CADES",        part: 0.030, description: "Remboursement de la dette sociale (CRDS + part CSG)" },
  { branche: "Logement",     part: 0.010, description: "FNAL — financement des aides au logement (APL)" },
  { branche: "Formation",    part: 0.015, description: "Formation professionnelle, alternance" },
] as const;

// Répartition taxe foncière (moyenne France)
// Source : DGCL — état de la fiscalité directe locale
export const REPART_TAXE_FONCIERE = [
  { categorie: "Commune",                   part: 0.55, description: "Voirie, écoles, services municipaux, urbanisme" },
  { categorie: "Intercommunalité (EPCI)",   part: 0.15, description: "Transports, déchets, eau, dév. économique" },
  { categorie: "Département (TEOM, autres)", part: 0.20, description: "Collèges, RSA, MDPH, routes" },
  { categorie: "Frais de gestion DGFiP",    part: 0.05, description: "Coût du recouvrement par l'État" },
  { categorie: "Taxe spéciale d'équipement", part: 0.05, description: "Établissements publics fonciers, agences" },
] as const;

// ============================================================================
// CALCULS
// ============================================================================

/** Net annuel → brut annuel (reverse cotisations salariales). */
function netToBrut(annualNet: number): number {
  return annualNet / (1 - TAUX_COTIS_SAL);
}

/** Brut annuel → super-brut (coût employeur). */
function brutToSuperBrut(annualBrut: number): number {
  return annualBrut * (1 + TAUX_COTIS_PAT);
}

/** Calcule l'IR pour un revenu imposable, sans QF. */
function calcIRSansQF(imposable: number): number {
  let impot = 0;
  let lastLimit = 0;
  for (const b of BAREME_IR) {
    if (imposable <= lastLimit) break;
    const slice = Math.min(imposable, b.upTo) - lastLimit;
    if (slice > 0) impot += slice * b.rate;
    lastLimit = b.upTo;
  }
  return Math.max(0, impot);
}

/** Calcule l'IR avec quotient familial et plafonnement. */
function calcIRAvecParts(imposable: number, parts: number): number {
  if (parts <= 0) return calcIRSansQF(imposable);
  // Méthode officielle : imposable / parts → IR par part → × parts
  const irParPart = calcIRSansQF(imposable / parts);
  const irAvecQF = irParPart * parts;

  // Plafonnement de l'avantage du QF
  const irSansQF = calcIRSansQF(imposable);
  const avantageQF = irSansQF - irAvecQF;
  const demiPartsSup = (parts - 1) * 2;
  const plafondAvantage = demiPartsSup * PLAFOND_QF_DEMI_PART;

  if (avantageQF > plafondAvantage) {
    return irSansQF - plafondAvantage;
  }
  return irAvecQF;
}

/**
 * Point d'entrée v2 : breakdown complet de TOUS les prélèvements.
 */
export function simulateAll(input: SimInput): SimBreakdown {
  const { monthlyNet, parts, proprietaire } = input;

  const annualNet = Math.max(0, monthlyNet * 12);
  const annualGross = netToBrut(annualNet);
  const annualSuperBrut = brutToSuperBrut(annualGross);

  // Cotisations
  const cotisSal = annualGross * TAUX_COTIS_SAL;
  const cotisPat = annualGross * TAUX_COTIS_PAT;
  const csgcrds = annualGross * TAUX_CSG_CRDS;

  // IR avec parts fiscales et plafonnement QF
  const abat = Math.min(annualNet * 0.10, ABAT_PLAFOND);
  const imposable = Math.max(0, annualNet - abat);
  const ir = calcIRAvecParts(imposable, parts);

  // TVA et TICPE
  const tva = annualNet * TAUX_TVA_EFFECTIVE;
  const ticpeEtAutres = annualNet * TAUX_TICPE_AUTRES;

  // Taxe foncière (si propriétaire)
  const taxeFonciere = proprietaire ? TAXE_FONCIERE_MOYENNE : 0;

  // Totaux par destinataire
  const totalSecuBrut = cotisSal + cotisPat + csgcrds;
  // La part Unédic / chômage est techniquement séparée, on la sort pour clarté
  const partUnedic = REPART_SECU.find((b) => b.branche === "Chômage")?.part ?? 0;
  const totalUnedic = totalSecuBrut * partUnedic;
  const totalSecu = totalSecuBrut - totalUnedic;

  const totalEtat = ir + tva + ticpeEtAutres;
  const totalCommune = taxeFonciere;

  const totalGrand = totalEtat + totalSecu + totalUnedic + totalCommune;

  // Taux effectifs
  const effectiveRateSurNet = annualNet > 0 ? totalGrand / annualNet : 0;
  const effectiveRateSurSuperBrut = annualSuperBrut > 0 ? totalGrand / annualSuperBrut : 0;

  return {
    monthlyNet,
    annualNet,
    annualGross,
    annualSuperBrut,
    parts,
    cotisSal,
    cotisPat,
    csgcrds,
    ir,
    tva,
    ticpeEtAutres,
    taxeFonciere,
    totalEtat,
    totalSecu,
    totalUnedic,
    totalCommune,
    totalGrand,
    effectiveRateSurNet,
    effectiveRateSurSuperBrut,
  };
}

// ============================================================================
// ALLOCATIONS (ventilation par destinataire)
// ============================================================================

/**
 * Ventile la contribution État sur les missions LFI fournies.
 * Inchangé pour compat ascendante.
 */
export function allocateAcrossMissions(
  totalContribution: number,
  missions: { categorie: string; valeur: number }[],
): AllocationLine[] {
  const total = missions.reduce((a, b) => a + b.valeur, 0);
  if (total <= 0) return [];
  return missions
    .map((m) => ({
      categorie: m.categorie,
      part: m.valeur / total,
      contribution: (m.valeur / total) * totalContribution,
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

/**
 * Ventile la contribution Sécu (cotisations + CSG hors Unédic) sur les
 * branches selon les clés moyennes LFSS.
 */
export function allocateSecu(totalSecu: number): AllocationLine[] {
  const branchesHorsUnedic = REPART_SECU.filter((b) => b.branche !== "Chômage");
  const totalParts = branchesHorsUnedic.reduce((a, b) => a + b.part, 0);
  return branchesHorsUnedic
    .map((b) => ({
      categorie: b.branche,
      part: b.part / totalParts,
      contribution: (b.part / totalParts) * totalSecu,
      description: b.description,
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

/**
 * Ventile la taxe foncière entre commune, EPCI, département…
 */
export function allocateTaxeFonciere(totalTaxe: number): AllocationLine[] {
  return REPART_TAXE_FONCIERE.map((r) => ({
    categorie: r.categorie,
    part: r.part,
    contribution: r.part * totalTaxe,
    description: r.description,
  })).sort((a, b) => b.contribution - a.contribution);
}

// ============================================================================
// COMPATIBILITÉ ASCENDANTE — anciens exports
// ============================================================================

/**
 * Wrapper sur simulateAll pour conserver l'ancienne API (1 part, locataire).
 * Permet aux composants existants de continuer à fonctionner pendant la
 * migration vers la v2.
 */
export function simulateTaxes(monthlyNet: number): TaxBreakdown {
  const r = simulateAll({ monthlyNet, parts: 1, proprietaire: false });
  return {
    annualNetIncome: r.annualNet,
    ir: r.ir,
    tva: r.tva,
    ticpeEtAutres: r.ticpeEtAutres,
    totalEtat: r.totalEtat,
    effectiveRate: r.annualNet > 0 ? r.totalEtat / r.annualNet : 0,
  };
}
