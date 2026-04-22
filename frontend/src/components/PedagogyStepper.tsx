import { useState } from "react";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact, formatPercent } from "../lib/format";

interface Step {
  numero: number;
  titre: string;
  concept: string;
  explication: string;
  exemple: (data: BudgetSnapshot) => string;
  apercu?: (data: BudgetSnapshot) => React.ReactNode;
  notion: string;
}

const STEPS: Step[] = [
  {
    numero: 1,
    titre: "Le PIB : mesurer la richesse produite",
    concept: "Produit Intérieur Brut",
    explication:
      "Le PIB mesure la valeur de tout ce qui est produit en France pendant un an (biens, services, salaires). C'est la taille de l'économie. Toutes les comparaisons budgétaires se font en pourcentage du PIB pour être comparables dans le temps et entre pays.",
    exemple: (d) => `PIB France ${d.annee} ≈ ${formatEurCompact(d.pib.value)} — soit environ ${Math.round(d.pib.value / 68_500_000).toLocaleString("fr-FR")} € produits par Français.`,
    notion: "Dénominateur de référence",
  },
  {
    numero: 2,
    titre: "Le budget de l'État : ce que l'État prévoit",
    concept: "Loi de finances initiale (LFI)",
    explication:
      "Chaque automne, le gouvernement présente un projet de budget pour l'année suivante. Le Parlement le vote en décembre : c'est la LFI. Elle fixe les dépenses et les recettes prévues. En fin d'année suivante, on compare aux chiffres réels (exécution).",
    exemple: (d) => `LFI ${d.annee} : dépenses ${formatEurCompact(d.budgetPrevisionnel.value)}, recettes ${formatEurCompact(d.recettesPrevisionnelles.value)}.`,
    notion: "Prévisionnel vs exécuté",
  },
  {
    numero: 3,
    titre: "Déficit et excédent : l'équation de base",
    concept: "Solde budgétaire = Recettes − Dépenses",
    explication:
      "Si l'État dépense plus qu'il n'encaisse, c'est un déficit (solde négatif). Sinon, un excédent. La France est en déficit continu depuis 1975. Le traité de Maastricht (1992) fixe un seuil à -3 % du PIB.",
    exemple: (d) => `Solde budgétaire prévu ${d.annee} : ${formatEurCompact(d.soldeBudgetaire.value)}. Soit un déficit de ${(Math.abs(d.soldeBudgetaire.value) / d.pib.value * 100).toFixed(1)} % du PIB.`,
    notion: "Indicateur de tenue des comptes",
  },
  {
    numero: 4,
    titre: "Financer le déficit : la dette publique",
    concept: "Obligations d'État (OAT)",
    explication:
      "Pour financer un déficit, l'État emprunte sur les marchés en émettant des titres (OAT). Les investisseurs (banques, assurances, fonds de pension) les achètent en échange d'un intérêt. Chaque année, la dette augmente du montant du déficit.",
    exemple: (d) => `Dette publique actuelle : ${formatEurCompact(d.dettePublique.value)}, soit ${formatPercent(d.ratioDettePib.value)} du PIB.`,
    notion: "Cumul des déficits passés",
  },
  {
    numero: 5,
    titre: "Le coût de la dette : les taux d'intérêt",
    concept: "OAT 10 ans",
    explication:
      "Plus le taux auquel l'État emprunte est élevé, plus la dette coûte cher à rembourser. Le taux OAT 10 ans est LE thermomètre. Il était à 15,8 % en 1981, à 0 % en 2020, et autour de 3,5 % aujourd'hui.",
    exemple: (d) => `OAT 10 ans actuelle : ${d.tauxOat10ans.value.toFixed(2)} %. Chaque point de hausse = des milliards de coût supplémentaire à long terme pour l'État.`,
    notion: "Pilier de la soutenabilité",
  },
  {
    numero: 6,
    titre: "Les règles européennes : Maastricht",
    concept: "Critères 3 % / 60 %",
    explication:
      "Pour rentrer dans l'euro, les pays ont signé le Traité de Maastricht en 1992. Deux seuils symboliques : déficit public < 3 % du PIB, dette publique < 60 % du PIB. Quasi aucun pays ne les respecte aujourd'hui — la France non plus depuis 2003.",
    exemple: (d) => `France : dette ${formatPercent(d.ratioDettePib.value)} (seuil 60 %), déficit ~${(Math.abs(d.soldeBudgetaire.value) / d.pib.value * 100).toFixed(1)} % du PIB (seuil 3 %). Procédure pour déficit excessif ouverte en juillet 2024.`,
    notion: "Contraintes UE",
  },
  {
    numero: 7,
    titre: "Les agences de notation : juger la signature",
    concept: "Standard & Poor's, Moody's, Fitch",
    explication:
      "Ces trois agences notent la dette des États, de AAA (risque minimum) à D (défaut). Leur note influence le taux auquel l'État peut emprunter. La France a perdu son AAA en 2012 chez S&P. Elle est aujourd'hui à AA- chez S&P et Fitch, Aa3 chez Moody's.",
    exemple: () => `Historique France : AAA (jusqu'en 2012) → AA+ (2012) → AA (2013) → AA- (2024).`,
    notion: "Perception du marché",
  },
  {
    numero: 8,
    titre: "L'effet boule de neige",
    concept: "Formule dynamique dette / PIB",
    explication:
      "Même sans nouveau déficit, le ratio dette/PIB peut augmenter mécaniquement si le taux d'intérêt (r) est supérieur à la croissance du PIB nominal (g). C'est l'effet boule de neige : r > g → la dette s'auto-entretient.",
    exemple: (d) => `Si OAT = ${d.tauxOat10ans.value.toFixed(1)} % et croissance nominale ~3 %, alors r > g : la dette augmente seule même sans déficit primaire.`,
    notion: "Dynamique macroéconomique",
  },
  {
    numero: 9,
    titre: "Le pacte de stabilité",
    concept: "Solde primaire et effort structurel",
    explication:
      "Le solde primaire = solde budgétaire hors intérêts de la dette. Si r > g, il faut un solde primaire positif (excédent primaire) pour stabiliser la dette. La France affichait un excédent primaire dans les années 90. Depuis 2008, elle est en déficit primaire continu.",
    exemple: (d) => {
      const charge = d.compositionHistorique?.depenses.find((c) => c.id === "dette")?.points.slice(-1)[0]?.value ?? 0;
      const soldePrimaire = d.soldeBudgetaire.value + charge;
      return `Solde primaire estimé ${d.annee} : ${formatEurCompact(soldePrimaire)} (solde ${formatEurCompact(d.soldeBudgetaire.value)} + charge ${formatEurCompact(charge)}).`;
    },
    notion: "Effort hors dette",
  },
  {
    numero: 10,
    titre: "Synthèse : le triangle impossible",
    concept: "Recettes / Dépenses / Endettement",
    explication:
      "Gérer un budget public, c'est arbitrer entre 3 leviers : (1) augmenter les recettes (impôts, croissance), (2) baisser les dépenses (services publics, protection sociale), (3) accepter plus de dette. Tout choix politique se ramène à cette équation.",
    exemple: (d) => `En 2026 : ${formatEurCompact(d.recettesPrevisionnelles.value)} de recettes pour ${formatEurCompact(d.budgetPrevisionnel.value)} de dépenses. L'écart (${formatEurCompact(Math.abs(d.soldeBudgetaire.value))}) s'ajoute chaque année à la dette.`,
    notion: "Arbitrage politique fondamental",
  },
];

interface Props {
  data: BudgetSnapshot;
}

export function PedagogyStepper({ data }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]!;
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  return (
    <div className="card p-5 md:p-8">
      {/* Progression */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Comprendre en 10 étapes</div>
          <div className="font-display text-lg font-semibold text-slate-900">
            Étape {step.numero} / {STEPS.length}
          </div>
        </div>
        <div className="text-xs text-slate-500">{Math.round(progress)} % · {step.notion}</div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-6">
        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Contenu */}
      <div>
        <div className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-brand-soft text-brand uppercase tracking-wider">
          {step.concept}
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-2">
          {step.titre}
        </h2>
        <p className="mt-4 text-slate-700 leading-relaxed text-base max-w-3xl">
          {step.explication}
        </p>
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border-l-4 border-brand">
          <div className="text-[10px] uppercase tracking-widest text-muted mb-1">Exemple chiffré</div>
          <div className="text-sm text-slate-800 leading-relaxed">{step.exemple(data)}</div>
        </div>
        {step.apercu && <div className="mt-5">{step.apercu(data)}</div>}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
          disabled={stepIdx === 0}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ← Précédent
        </button>

        {/* Indicateurs étapes */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.numero}
              type="button"
              onClick={() => setStepIdx(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === stepIdx ? "bg-brand scale-150" : i < stepIdx ? "bg-brand/40" : "bg-slate-200 hover:bg-slate-300"
              }`}
              aria-label={`Aller à l'étape ${s.numero}`}
              title={s.titre}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStepIdx(Math.min(STEPS.length - 1, stepIdx + 1))}
          disabled={stepIdx === STEPS.length - 1}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
