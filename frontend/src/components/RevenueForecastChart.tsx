import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEurCompact } from "../lib/format";

interface ExecutionRow {
  mois: string;
  prevu: number;
  reel: number;
}

interface Props {
  annee: number;
  recettes: ExecutionRow[];
  depenses: ExecutionRow[];
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

/**
 * Double chart barres pour l'exécution budgétaire :
 *  - Colonne gauche : recettes prévues (LFI) vs recettes réelles estimées
 *  - Colonne droite : dépenses prévues (LFI) vs dépenses réelles estimées
 *
 * Pour chaque mois : 2 barres côte à côte. Les mois futurs n'ont pas de "réel".
 */
export function RevenueForecastChart({ annee, recettes, depenses }: Props) {
  const recData = recettes.map((r, i) => ({
    mois: MONTH_LABELS[i] ?? r.mois,
    prevu: r.prevu,
    reel: r.reel || null,
  }));
  const depData = depenses.map((r, i) => ({
    mois: MONTH_LABELS[i] ?? r.mois,
    prevu: r.prevu,
    reel: r.reel || null,
  }));

  const sumPrevuRec = recettes.reduce((a, b) => a + b.prevu, 0);
  const sumReelRec = recettes.reduce((a, b) => a + b.reel, 0);
  const sumPrevuDep = depenses.reduce((a, b) => a + b.prevu, 0);
  const sumReelDep = depenses.reduce((a, b) => a + b.reel, 0);

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted">Exécution {annee}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warn border border-amber-200 uppercase tracking-wider">
              réel estimé
            </span>
          </div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Recettes & dépenses mensuelles — prévu LFI vs réel estimé
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Les barres <strong>claires</strong> = prévu LFI {annee} ventilé mois par mois avec
            la saisonnalité budgétaire française typique (pics de recettes juin + novembre pour
            les soldes d'impôts). Les barres <strong>foncées</strong> = estimation calculée à
            partir du prévu ± bruit de ±3 %.
            <strong className="text-warn"> Ce n'est PAS l'exécution réelle</strong> —
            les chiffres officiels sont publiés par la DGFiP dans la Situation Mensuelle
            Budgétaire avec 1-2 mois de retard. Le branchement au CSV data.gouv.fr est prévu
            dans une version ultérieure.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 shrink-0">
          Cumul à date : {formatEurCompact(sumReelRec)} / {formatEurCompact(sumPrevuRec)} recettes ·{" "}
          {formatEurCompact(sumReelDep)} / {formatEurCompact(sumPrevuDep)} dépenses
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Recettes" data={recData} prevuColor="#a7f3d0" reelColor="#16a34a" />
        <Panel title="Dépenses" data={depData} prevuColor="#bfdbfe" reelColor="#0055A4" />
      </div>

    </div>
  );
}

function Panel({
  title,
  data,
  prevuColor,
  reelColor,
}: {
  title: string;
  data: { mois: string; prevu: number; reel: number | null }[];
  prevuColor: string;
  reelColor: string;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="mois"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatEurCompact(Number(v))}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
              }}
              formatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return Number.isFinite(n) && n > 0 ? [formatEurCompact(n), ""] : ["—", ""];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="square" />
            <Bar dataKey="prevu" name="Prévu (LFI)" fill={prevuColor} radius={[6, 6, 0, 0]} />
            <Bar dataKey="reel" name="Réel (estimé)" fill={reelColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
