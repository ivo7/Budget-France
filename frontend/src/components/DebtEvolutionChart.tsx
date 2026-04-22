import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Timeseries } from "../types";
import { formatEurCompact } from "../lib/format";

interface Props {
  series: Timeseries;
}

export function DebtEvolutionChart({ series }: Props) {
  const data = series.points.map((p) => ({
    date: p.date,
    year: new Date(p.date).getFullYear(),
    value: p.value,
  }));

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Évolution</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Dette publique — {series.points.length} points
          </div>
        </div>
        <div className="text-[11px] text-slate-500">{series.source.label}</div>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradDette" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055A4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0055A4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              labelFormatter={(l) => `Année ${l}`}
              formatter={(v: number) => [formatEurCompact(v), "Dette"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0055A4"
              strokeWidth={2.5}
              fill="url(#gradDette)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
