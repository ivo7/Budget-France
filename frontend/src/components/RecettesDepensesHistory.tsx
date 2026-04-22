import { useMemo } from "react";
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
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Chart dédié à l'évolution des recettes et dépenses de l'État 1945 → aujourd'hui.
 * La zone entre les deux courbes matérialise le solde budgétaire.
 */
export function RecettesDepensesHistory({ data }: Props) {
  const rows = useMemo(() => {
    const dep = data.series.depensesLongue?.points ?? [];
    const rec = data.series.recettesLongue?.points ?? [];
    const byYear = new Map<number, { year: number; dep?: number; rec?: number; solde?: number }>();
    for (const p of dep) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.dep = p.value;
      byYear.set(y, e);
    }
    for (const p of rec) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.rec = p.value;
      byYear.set(y, e);
    }
    return Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        ...r,
        solde: r.rec != null && r.dep != null ? r.rec - r.dep : undefined,
      }));
  }, [data]);

  if (rows.length === 0) {
    return null;
  }

  const last = rows[rows.length - 1]!;
  const sourceLabel = data.series.depensesLongue?.source.label ?? "Séries longues";

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Longue période</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Recettes et dépenses de l'État — 1945 à {last.year}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            La surface rouge entre les deux courbes mesure le déficit budgétaire.
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <MiniStat label={`Dépenses ${last.year}`} value={formatEurCompact(last.dep ?? 0)} color="text-brand" />
          <MiniStat label={`Recettes ${last.year}`} value={formatEurCompact(last.rec ?? 0)} color="text-money" />
          <MiniStat label="Solde" value={formatEurCompact(last.solde ?? 0)} color="text-flag-red" />
        </div>
      </div>

      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillDep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055A4" stopOpacity={0.15} />
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
              content={(props) => {
                const { active, payload, label } = props as {
                  active?: boolean;
                  label?: string | number;
                  payload?: Array<{ value: number; name: string; color: string; dataKey: string }>;
                };
                if (!active || !payload || payload.length === 0) return null;
                const rec = payload.find((p) => p.dataKey === "rec")?.value ?? 0;
                const dep = payload.find((p) => p.dataKey === "dep")?.value ?? 0;
                const solde = rec - dep;
                const soldeColor = solde >= 0 ? "#16a34a" : "#EF4135";
                const soldeLabel = solde >= 0 ? "Excédent" : "Déficit";
                return (
                  <div style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    color: "#0f172a",
                    boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
                    padding: "10px 12px",
                    fontSize: 12,
                    minWidth: 180,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 6, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Année {label}
                    </div>
                    <Row color="#16a34a" name="Recettes" value={formatEurCompact(rec)} />
                    <Row color="#0055A4" name="Dépenses" value={formatEurCompact(dep)} />
                    <div style={{ borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />
                    <Row color={soldeColor} name={soldeLabel} value={formatEurCompact(solde)} bold />
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
            <Area
              type="monotone"
              dataKey="dep"
              name="Dépenses État"
              stroke="#0055A4"
              strokeWidth={2.5}
              fill="url(#fillDep)"
            />
            <Area
              type="monotone"
              dataKey="rec"
              name="Recettes État"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#fillRec)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : {sourceLabel}. Les valeurs sont en euros courants du budget général de l'État
        (LFI), hors Sécurité sociale et collectivités. Une requalification de périmètre entre
        les années 60 et 70 peut expliquer de légers décrochages.
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Row({ color, name, value, bold }: { color: string; name: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "2px 0" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ color: "#475569", fontWeight: bold ? 600 : 400 }}>{name}</span>
      </span>
      <span style={{ color, fontWeight: bold ? 700 : 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
