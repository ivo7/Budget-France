import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";

interface Props {
  data: BudgetSnapshot;
}

type Mode = "absolu" | "ratio";

/**
 * Courbes historiques 1945 → aujourd'hui :
 *  - Dette publique
 *  - Dépenses de l'État
 *  - Recettes de l'État
 *  - Taux long terme (OAT 10 ans ou équivalent avant 1988)
 *
 * Deux modes :
 *  - "Absolu" (Md€ courants) : dette / dépenses / recettes sur un axe, taux sur l'autre.
 *  - "Ratio (% PIB)"        : dette / dépenses / recettes en % du PIB (lisibilité longue durée).
 */
export function HistoricalCurves({ data }: Props) {
  const [mode, setMode] = useState<Mode>("absolu");

  const rows = useMemo(() => {
    const dette = data.series.detteLongue?.points ?? [];
    const pib = data.series.pibLongue?.points ?? [];
    const dep = data.series.depensesLongue?.points ?? [];
    const rec = data.series.recettesLongue?.points ?? [];
    const oat = data.series.oatLongue?.points ?? [];
    if (dette.length === 0) return [];

    // Indexation par année pour merge
    const byYear = new Map<number, { year: number; dette?: number; pib?: number; dep?: number; rec?: number; oat?: number }>();
    const push = (points: { date: string; value: number }[], key: "dette" | "pib" | "dep" | "rec" | "oat") => {
      for (const p of points) {
        const y = new Date(p.date).getUTCFullYear();
        const entry = byYear.get(y) ?? { year: y };
        entry[key] = p.value;
        byYear.set(y, entry);
      }
    };
    push(dette, "dette");
    push(pib, "pib");
    push(dep, "dep");
    push(rec, "rec");
    push(oat, "oat");

    return Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        year: r.year,
        dette: mode === "absolu" ? r.dette ?? null : r.dette != null && r.pib ? (r.dette / r.pib) * 100 : null,
        dep: mode === "absolu" ? r.dep ?? null : r.dep != null && r.pib ? (r.dep / r.pib) * 100 : null,
        rec: mode === "absolu" ? r.rec ?? null : r.rec != null && r.pib ? (r.rec / r.pib) * 100 : null,
        oat: r.oat ?? null,
      }));
  }, [data, mode]);

  const yFormat = (v: number) =>
    mode === "absolu" ? formatEurCompact(v) : `${v.toFixed(0)} %`;

  const sourceLabel = data.series.detteLongue?.source.label ?? "Séries longues 1945+";

  return (
    <div className="card p-5 md:p-6" id="historique">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Vue longue période</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Dette, dépenses, recettes et taux — depuis 1945
          </div>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs">
          <ModeBtn active={mode === "absolu"} onClick={() => setMode("absolu")}>Md€ courants</ModeBtn>
          <ModeBtn active={mode === "ratio"} onClick={() => setMode("ratio")}>% du PIB</ModeBtn>
        </div>
      </div>

      <div className="mt-4 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormat}
              width={80}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(0)} %`}
              width={50}
              domain={[0, 18]}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
              }}
              labelFormatter={(l) => `Année ${l}`}
              formatter={(v: number, name: string) => {
                if (name === "Taux long terme") return [`${Number(v).toFixed(2)} %`, name];
                return [yFormat(Number(v)), name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              iconType="plainline"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="dette"
              name="Dette publique"
              stroke="#0055A4"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="dep"
              name="Dépenses État"
              stroke="#EF4135"
              strokeWidth={2}
              dot={false}
              strokeDasharray="0"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rec"
              name="Recettes État"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="oat"
              name="Taux long terme"
              stroke="#7c3aed"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : {sourceLabel}. Taux long terme : rendement des bons du Trésor avant 1988, OAT 10 ans ensuite.
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
