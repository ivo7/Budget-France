import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Timeseries } from "../types";

interface Props {
  series: Timeseries;
}

export function RatesChart({ series }: Props) {
  const data = series.points.map((p) => ({
    date: p.date,
    year: p.date.slice(0, 7),
    value: p.value,
  }));

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Coût de la dette</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            OAT 10 ans — rendement
          </div>
        </div>
        <div className="text-[11px] text-slate-500">{series.source.label}</div>
      </div>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(1)} %`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
              }}
              formatter={(v: number) => [`${v.toFixed(2)} %`, "OAT 10 ans"]}
              labelFormatter={(l) => String(l)}
            />
            <Line type="monotone" dataKey="value" stroke="#0055A4" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
