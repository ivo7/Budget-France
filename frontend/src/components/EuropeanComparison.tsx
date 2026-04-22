import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";

interface Props {
  data: BudgetSnapshot;
}

type Mode = "dette" | "solde";

/**
 * Comparaison France vs Allemagne / Italie / Espagne / Zone euro.
 * Deux métriques (Maastricht) :
 *   - Dette publique / PIB — seuil symbolique à 60 %
 *   - Solde public / PIB — seuil symbolique à -3 %
 *
 * Source : Eurostat gov_10q_ggdebt + gov_10q_ggnfa
 */
export function EuropeanComparison({ data }: Props) {
  const [mode, setMode] = useState<Mode>("dette");
  const comp = data.comparaisonsEuropeennes;

  const rows = useMemo(() => {
    if (!comp) return [];
    const series = mode === "dette" ? comp.detteRatio : comp.solde;
    const years = new Set<number>();
    series.forEach((s) => s.points.forEach((p) => years.add(new Date(p.date).getUTCFullYear())));
    return Array.from(years)
      .sort((a, b) => a - b)
      .map((y) => {
        const row: Record<string, number | string> = { year: y };
        for (const s of series) {
          const pt = s.points.find((p) => new Date(p.date).getUTCFullYear() === y);
          row[s.pays] = pt ? Math.round(pt.value * 10) / 10 : NaN;
        }
        return row;
      });
  }, [comp, mode]);

  if (!comp) return null;

  const activeSeries = mode === "dette" ? comp.detteRatio : comp.solde;
  const referenceLevel = mode === "dette" ? 60 : -3;
  const referenceLabel = mode === "dette" ? "Seuil Maastricht 60 %" : "Seuil Maastricht −3 %";

  const lastYear = rows[rows.length - 1]?.year;
  const franceLatest = activeSeries.find((s) => s.pays === "FR")?.points.slice(-1)[0]?.value ?? 0;
  const allemagneLatest = activeSeries.find((s) => s.pays === "DE")?.points.slice(-1)[0]?.value ?? 0;
  const ecart = franceLatest - allemagneLatest;

  return (
    <DownloadableCard filename="budget-france-comparaison-europe" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Contexte européen</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            France vs Allemagne, Italie, Espagne, Zone euro
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Métriques harmonisées Eurostat (norme Maastricht) — la seule base pour
            comparer les finances publiques entre pays membres.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs shrink-0">
          <ModeBtn active={mode === "dette"} onClick={() => setMode("dette")}>Dette / PIB</ModeBtn>
          <ModeBtn active={mode === "solde"} onClick={() => setMode("solde")}>Solde / PIB</ModeBtn>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label={`France ${lastYear}`} value={`${franceLatest.toFixed(1)} %`} color="text-brand" />
        <MiniStat label={`Allemagne ${lastYear}`} value={`${allemagneLatest.toFixed(1)} %`} color="text-slate-900" />
        <MiniStat label="Écart FR vs DE" value={`${ecart >= 0 ? "+" : ""}${ecart.toFixed(1)} pt`} color={ecart > 0 ? "text-flag-red" : "text-money"} />
        <MiniStat label="Seuil UE" value={mode === "dette" ? "60 %" : "−3 %"} color="text-amber-600" />
      </div>

      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(0)} %`}
              width={55}
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
              formatter={(v, name) => {
                const n = typeof v === "number" ? v : Number(v);
                return Number.isFinite(n) ? [`${n.toFixed(1)} %`, name] : ["—", name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="plainline" />
            <ReferenceLine y={referenceLevel} stroke="#d97706" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: referenceLabel, position: "insideTopRight", fill: "#d97706", fontSize: 10 }} />
            {activeSeries.map((s) => (
              <Line
                key={s.pays}
                type="monotone"
                dataKey={s.pays}
                name={s.label}
                stroke={s.colorHex}
                strokeWidth={s.pays === "FR" ? 3 : 1.8}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Source : {comp.source.label}.{" "}
        <a href={comp.source.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
          Voir sur eurostat.ec.europa.eu →
        </a>
      </div>
    </DownloadableCard>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-semibold text-lg tabular-nums ${color}`}>{value}</div>
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
