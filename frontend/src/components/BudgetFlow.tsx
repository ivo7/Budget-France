import type { Metric } from "../types";
import { formatEurCompact } from "../lib/format";

interface Props {
  annee: number;
  recettes: Metric;
  depenses: Metric;
  solde: Metric;
}

/**
 * Visualisation "flux" simple : barres horizontales montrant
 * la part recettes vs dépenses, avec le déficit clairement visible.
 */
export function BudgetFlow({ annee, recettes, depenses, solde }: Props) {
  const max = Math.max(recettes.value, depenses.value);
  const recettesPct = (recettes.value / max) * 100;
  const depensesPct = (depenses.value / max) * 100;
  const deficit = Math.abs(solde.value);
  const deficitPct = (deficit / max) * 100;

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">LFI {annee}</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Recettes vs dépenses de l'État — prévision {annee}
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Loi de finances initiale</div>
      </div>

      <div className="mt-6 space-y-5">
        <Row
          label="Recettes"
          valueLabel={formatEurCompact(recettes.value)}
          pct={recettesPct}
          color="bg-money"
        />
        <Row
          label="Dépenses"
          valueLabel={formatEurCompact(depenses.value)}
          pct={depensesPct}
          color="bg-brand"
        />
        <div className="pt-2 border-t border-slate-200" />
        <Row
          label={solde.value < 0 ? "Déficit" : "Excédent"}
          valueLabel={formatEurCompact(solde.value)}
          pct={deficitPct}
          color="bg-flag-red"
          emphasize
        />
      </div>
    </div>
  );
}

function Row({
  label,
  valueLabel,
  pct,
  color,
  emphasize,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  color: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className={emphasize ? "text-flag-red font-semibold" : "text-slate-700"}>{label}</span>
        <span className="tabular-nums text-slate-900 font-medium">{valueLabel}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}
