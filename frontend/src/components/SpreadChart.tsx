import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";
import { timeseriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Spread OAT-Bund : prime de risque souveraine France vs Allemagne, en points de
 * base (pb). Thermomètre utilisé quotidiennement par les desks souverains.
 *
 * Repères historiques :
 *  - < 40 pb : confiance élevée
 *  - 40-80 pb : tension modérée
 *  - > 100 pb : signal de défiance (ex. crise zone euro 2011-2012)
 */
export function SpreadChart({ data }: Props) {
  const sp = data.spreadOatBund;

  const rows = useMemo(() => {
    if (!sp) return [];
    return sp.spread.map((p) => ({
      date: p.date.slice(0, 7),
      value: p.value,
    }));
  }, [sp]);

  if (!sp) return null;

  const latest = sp.spread[sp.spread.length - 1]?.value ?? 0;
  const max = sp.spread.reduce((m, p) => Math.max(m, p.value), 0);
  const maxDate = sp.spread.find((p) => p.value === max)?.date ?? "";

  const color = latest < 40 ? "#16a34a" : latest < 100 ? "#d97706" : "#EF4135";

  return (
    <DownloadableCard
      filename="budget-france-spread-oat-bund"
      className="card p-5 md:p-6"
      getCsvData={() => timeseriesToCsv(sp.spread, "spread_pb")}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Prime de risque souveraine</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Spread OAT-Bund 10 ans — France vs Allemagne
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Écart de rendement entre l'OAT 10 ans française et le Bund allemand,
            exprimé en points de base (1 pb = 0,01 % de rendement). Plus l'écart
            est élevé, plus les marchés exigent une prime pour prêter à la France.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">Dernier point</div>
          <div className={`font-display text-3xl font-bold tabular-nums`} style={{ color }}>
            {latest} <span className="text-sm">pb</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="Pic historique" value={`${max} pb`} sub={maxDate.slice(0, 7)} color="text-flag-red" />
        <MiniStat label="Niveau actuel" value={`${latest} pb`} sub="tension modérée" color={latest > 60 ? "text-amber-600" : "text-money"} />
        <MiniStat label="Seuil d'alerte" value="100 pb" sub="défiance marquée" color="text-amber-600" />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSpread" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4135" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4135" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
              tickFormatter={(v) => String(v).slice(0, 4)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} pb`}
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
              formatter={(v) => [`${v} pb`, "Spread"]}
              labelFormatter={(l) => `Mois ${l}`}
            />
            <ReferenceLine y={60} stroke="#d97706" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "Tension 60 pb", position: "insideTopRight", fill: "#d97706", fontSize: 10 }} />
            <ReferenceLine y={100} stroke="#EF4135" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "Alerte 100 pb", position: "insideTopRight", fill: "#EF4135", fontSize: 10 }} />
            <Area type="monotone" dataKey="value" stroke="#EF4135" strokeWidth={2} fill="url(#gradSpread)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Source : {sp.source.label}.{" "}
        <a href={sp.source.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
          Voir sur data.ecb.europa.eu →
        </a>
      </div>
    </DownloadableCard>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-semibold text-lg tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
