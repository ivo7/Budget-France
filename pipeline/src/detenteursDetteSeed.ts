// ============================================================================
// Détenteurs de la dette publique française
// ============================================================================
//
// Question fréquente du grand public : "à qui doit-on cet argent ?"
// Réponse pédagogique : ce n'est pas une banque centrale étrangère ou un
// gouvernement étranger, c'est diversifié — banques, assurances, fonds, BCE…
//
// Sources :
//   - Agence France Trésor : "Détention de la dette négociable de l'État"
//     https://www.aft.gouv.fr/files/medias-aft/9_Investisseurs/9.4_Composition.pdf
//   - Banque de France : flux financiers détenteurs OAT
//     https://www.banque-france.fr/
//
// Valeurs en % du stock total OAT (~2 300 Md€ en 2026), ordres de grandeur
// publics, raffraîchies trimestriellement par l'AFT.

import type { SourceInfo } from "./types.ts";

export interface DetenteurCategorie {
  id: string;
  label: string;
  partPourcent: number;
  description: string;
  beneficesExemple?: string;
}

// Estimation 2024-2026 (la composition évolue lentement)
export const detenteursDetteFrance: DetenteurCategorie[] = [
  {
    id: "non_residents",
    label: "Investisseurs non-résidents",
    partPourcent: 50,
    description:
      "Banques, assurances, fonds de pension hors zone euro (États-Unis, Royaume-Uni, Asie). C'est le plus gros bloc — la France est très internationalisée. Avantage : taux bas grâce à la concurrence mondiale. Inconvénient : exposition aux mouvements de capitaux.",
  },
  {
    id: "banques_assurances_fr",
    label: "Banques et assurances françaises",
    partPourcent: 22,
    description:
      "BNP Paribas, Crédit Agricole, AXA, CNP, etc. La dette française est une réserve de qualité dans leurs bilans. Beaucoup d'entre elles l'utilisent comme actif sans risque pour les ratios prudentiels Bâle III / Solvency II.",
  },
  {
    id: "bce_eurosysteme",
    label: "BCE / Banque de France (Eurosystème)",
    partPourcent: 18,
    description:
      "La BCE détient des OAT depuis le programme d'achats d'actifs (QE, 2015-2022) puis le programme PEPP (pandémie 2020-2022). Ne facture pas d'intérêt net à la France — les intérêts reversés à l'État via les dividendes BdF.",
  },
  {
    id: "fonds_collectifs",
    label: "Organismes de placement collectif (OPC)",
    partPourcent: 6,
    description:
      "Sicav et FCP français — souvent achetés indirectement par les épargnants via assurance-vie, PEA, fonds euros. Une fraction de la dette française est donc détenue par les Français eux-mêmes via leur épargne.",
  },
  {
    id: "menages",
    label: "Ménages directement",
    partPourcent: 1,
    description:
      "Très faible : moins de 1% directement. Il existe aussi les OAT vertes pour les particuliers, mais le marché français n'a jamais développé de produit retail comme les Buoni Postali italiens ou les Treasury Bonds américains.",
  },
  {
    id: "autres",
    label: "Autres (banques centrales étrangères, BEI, FMI…)",
    partPourcent: 3,
    description:
      "Réserves de change de banques centrales (Chine, Japon, Suisse), institutions multilatérales.",
  },
];

export const detenteursSourceInfo: SourceInfo = {
  id: "aft.detenteurs",
  label: "Agence France Trésor — Composition de la détention de la dette",
  url: "https://www.aft.gouv.fr/files/medias-aft/9_Investisseurs/9.4_Composition.pdf",
  fetchedAt: new Date().toISOString(),
  status: "fallback",
};
