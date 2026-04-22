// ============================================================================
// Simulateur fiscal — hypothèses simplifiées, calibrées 2024-2026
// ============================================================================
//
// Ce module NE remplace PAS un vrai simulateur impots.gouv.fr. Il sert à donner
// un ORDRE DE GRANDEUR de ce que paie un contribuable et à le rendre lisible
// sur les dépenses de l'État.
//
// Hypothèses explicites documentées dans le README et affichées dans l'UI.
//
// Barème IR 2024 (pour déclaration sur revenus 2024, payés en 2025) :
//   - Jusqu'à 11 294 €     : 0 %
//   - 11 295 à 28 797 €    : 11 %
//   - 28 798 à 82 341 €    : 30 %
//   - 82 342 à 177 106 €   : 41 %
//   - Au-delà de 177 106 € : 45 %
//
// Autres hypothèses :
//   - Abattement forfaitaire de 10 % sur les salaires (plafonné à 14 171 €)
//   - 1 part fiscale (célibataire sans enfant) par défaut
//   - TVA : estimée à ~7 % du revenu NET (taux effectif moyen sur la
//     consommation réelle des ménages, pondéré entre 5,5 %, 10 % et 20 %).
//     Source : INSEE comptes des ménages.
//   - TICPE + autres taxes indirectes : ~1 % du revenu net.
//
// Aucune prise en compte des niches fiscales, des revenus du capital, des
// crédits d'impôt, des prélèvements sociaux (CSG/CRDS — qui vont à la Sécu
// et pas à l'État). On reste volontairement dans la contribution au budget
// GÉNÉRAL de l'État pour la cohérence pédagogique avec le dashboard.

export interface TaxBreakdown {
  annualNetIncome: number;
  ir: number;          // impôt sur le revenu annuel
  tva: number;         // TVA estimée annuelle
  ticpeEtAutres: number;
  totalEtat: number;   // total contribution au budget général État
  effectiveRate: number;      // totalEtat / annualNetIncome (sans dim)
}

interface Bracket {
  upTo: number;   // +Infinity pour la dernière tranche
  rate: number;   // 0 → 1
}

const BRACKETS_2024: Bracket[] = [
  { upTo: 11_294, rate: 0.00 },
  { upTo: 28_797, rate: 0.11 },
  { upTo: 82_341, rate: 0.30 },
  { upTo: 177_106, rate: 0.41 },
  { upTo: Infinity, rate: 0.45 },
];

/** Calcule l'IR annuel pour 1 part fiscale, avec abattement de 10 %. */
function calcImpotRevenu(annualNet: number): number {
  const abattement = Math.min(annualNet * 0.10, 14_171);
  const imposable = Math.max(0, annualNet - abattement);
  let impot = 0;
  let lastLimit = 0;
  for (const b of BRACKETS_2024) {
    if (imposable <= lastLimit) break;
    const slice = Math.min(imposable, b.upTo) - lastLimit;
    if (slice > 0) impot += slice * b.rate;
    lastLimit = b.upTo;
  }
  return Math.max(0, impot);
}

/** Point d'entrée : salaire mensuel NET → ventilation fiscale annuelle. */
export function simulateTaxes(monthlyNet: number): TaxBreakdown {
  const annualNet = Math.max(0, monthlyNet * 12);
  const ir = calcImpotRevenu(annualNet);
  // TVA estimée : 7 % du net (hypothèse pondérée)
  const tva = annualNet * 0.07;
  // TICPE + taxes indirectes : 1 %
  const ticpeEtAutres = annualNet * 0.01;

  const totalEtat = ir + tva + ticpeEtAutres;
  const effectiveRate = annualNet > 0 ? totalEtat / annualNet : 0;

  return { annualNetIncome: annualNet, ir, tva, ticpeEtAutres, totalEtat, effectiveRate };
}

/**
 * Ventile la contribution totale sur les grandes missions de l'État,
 * selon les parts de la LFI fournie en paramètre.
 */
export function allocateAcrossMissions(
  totalContribution: number,
  missions: { categorie: string; valeur: number }[],
): { categorie: string; part: number; contribution: number }[] {
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
