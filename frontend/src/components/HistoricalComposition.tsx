import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesPoint } from "../types";
import { formatEurCompact } from "../lib/format";

export interface CompositionSeries {
  id: string;
  label: string;
  color: string;
  points: TimeseriesPoint[];
}

interface Props {
  recettes: CompositionSeries[];
  depenses: CompositionSeries[];
}

type Mode = "absolu" | "part";

/**
 * Double chart stacked area affichant la composition historique des recettes
 * et des dépenses de l'État depuis 1945. Deux modes :
 *  - "Part (%)" : chart 100 % empilé — parfait pour voir comment la part de la
 *    TVA (ou de la défense, ou de la charge de la dette) a évolué.
 *  - "Md€ courants" : chart empilé en valeur absolue — pour voir la croissance.
 */
export function HistoricalComposition({ recettes, depenses }: Props) {
  const [mode, setMode] = useState<Mode>("part");

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Longue période · composition</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Évolution de la composition des recettes et des dépenses (1945 → 2025)
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Mode <strong>Part (%)</strong> : visualise quel pourcentage du total chaque catégorie représente
            chaque année. Exemple : la part de la TVA apparaît en 1954 et grandit jusque dans les années 2000.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs shrink-0">
          <ModeBtn active={mode === "part"} onClick={() => setMode("part")}>Part (%)</ModeBtn>
          <ModeBtn active={mode === "absolu"} onClick={() => setMode("absolu")}>Md€ courants</ModeBtn>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Recettes" series={recettes} mode={mode} />
        <Panel title="Dépenses" series={depenses} mode={mode} />
      </div>

      <div className="mt-4 text-[11px] text-slate-500">
        Données interpolées entre des points de repère publiquement connus (INSEE, DGFiP, OFCE).
        Les valeurs visent à montrer les tendances longues, pas à remplacer les documents
        budgétaires année par année.
      </div>
    </div>
  );
}

function Panel({
  title,
  series,
  mode,
}: {
  title: string;
  series: CompositionSeries[];
  mode: Mode;
}) {
  // On construit un tableau de lignes indexées par année, avec une colonne par série.
  const data = useMemo(() => {
    const years = new Set<number>();
    series.forEach((s) => s.points.forEach((p) => years.add(new Date(p.date).getUTCFullYear())));
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    return sortedYears.map((y) => {
      const row: Record<string, number | string> = { year: y };
      for (const s of series) {
        const pt = s.points.find((p) => new Date(p.date).getUTCFullYear() === y);
        row[s.id] = pt?.value ?? 0;
      }
      return row;
    });
  }, [series]);

  const stackOffset = mode === "part" ? "expand" : "none";
  const formatY = (v: number) =>
    mode === "part" ? `${Math.round(v * 100)} %` : formatEurCompact(v);

  return (
    <div>
      <div className="text-sm font-semibold text-slate-800 mb-2">{title}</div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }} stackOffset={stackOffset}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={35}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatY}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
                fontSize: 12,
              }}
              labelFormatter={(l) => `Année ${l}`}
              formatter={(value, name, entry) => {
                const v = typeof value === "number" ? value : Number(value);
                if (!Number.isFinite(v)) return ["—", name];
                if (mode === "part") {
                  const total = series.reduce((a, s) => a + (Number(entry?.payload?.[s.id]) || 0), 0);
                  const pct = total > 0 ? (v / total) * 100 : 0;
                  return [`${pct.toFixed(1)} % · ${formatEurCompact(v)}`, name];
                }
                return [formatEurCompact(v), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="square" />
            {series.map((s) => (
              <Area
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.label}
                stackId="1"
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.7}
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full font-medium transition ${
        active ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
