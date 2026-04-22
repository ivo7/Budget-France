import { formatEurCompact } from "../lib/format";

interface Item {
  categorie: string;
  valeur: number;
  description?: string;
}

interface Props {
  annee: number;
  recettes: Item[];
  depenses: Item[];
  sourceLabel: string;
}

/**
 * Répartition des recettes et dépenses de l'État pour l'année courante.
 * Présentation : 2 panneaux côte-à-côte, barres horizontales triées par montant
 * décroissant, part en % affichée à droite. Beaucoup plus lisible qu'un camembert.
 */
export function BudgetBreakdown({ annee, recettes, depenses, sourceLabel }: Props) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted">Budget général {annee}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warn border border-amber-200 uppercase tracking-wider">
              prévisionnel
            </span>
          </div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Répartition prévisionnelle des recettes et des dépenses — LFI {annee}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Grandes masses votées en Loi de finances initiale {annee}. Ces chiffres sont
            des <strong>prévisions</strong> ; les montants réels exécutés ne seront
            connus qu'après la clôture comptable de l'exercice.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 shrink-0">Source : {sourceLabel}</div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Recettes" items={recettes} barColor="bg-money" labelColor="text-money" />
        <Panel title="Dépenses (par mission)" items={depenses} barColor="bg-brand" labelColor="text-brand" />
      </div>
    </div>
  );
}

function Panel({
  title,
  items,
  barColor,
  labelColor,
}: {
  title: string;
  items: Item[];
  barColor: string;
  labelColor: string;
}) {
  const sorted = [...items].sort((a, b) => b.valeur - a.valeur);
  const total = sorted.reduce((acc, r) => acc + r.valeur, 0);
  const max = sorted[0]?.valeur ?? 1;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className={`text-sm font-semibold tabular-nums ${labelColor}`}>
          {formatEurCompact(total)}
        </span>
      </div>

      <ul className="space-y-2">
        {sorted.map((item) => {
          const pctOfMax = (item.valeur / max) * 100;
          const pctOfTotal = (item.valeur / total) * 100;
          return (
            <li key={item.categorie} className="group">
              <div className="flex items-center justify-between gap-3 text-xs mb-1">
                <span className="text-slate-700 truncate" title={item.description || item.categorie}>
                  {item.categorie}
                </span>
                <span className="tabular-nums text-slate-500 shrink-0">
                  <span className="font-semibold text-slate-800">{formatEurCompact(item.valeur)}</span>
                  <span className="ml-1.5">({pctOfTotal.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(2, Math.min(100, pctOfMax))}%` }}
                />
              </div>
              {item.description && (
                <div className="text-[10px] text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
