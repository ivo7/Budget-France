import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";
import { formatEurCompact } from "../lib/format";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Ratio "charge de la dette / recettes de l'État".
 *
 * Répond à la question : "sur chaque euro d'impôt que paie un Français,
 * combien part uniquement pour payer les intérêts de la dette ?".
 *
 * Construit en croisant deux séries :
 *  - charge de la dette annuelle (composition des dépenses → catégorie dette)
 *  - recettes totales de l'État annuelles (série longue)
 */
export function ChargeRatioChart({ data }: Props) {
  const rows = useMemo(() => {
    const charge = data.compositionHistorique?.depenses.find((c) => c.id === "dette")?.points ?? [];
    const recettes = data.series.recettesLongue?.points ?? [];
    if (charge.length === 0 || recettes.length === 0) return [];
    const byYear = new Map<number, { year: number; charge?: number; recettes?: number; ratio?: number }>();
    for (const p of charge) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.charge = p.value;
      byYear.set(y, e);
    }
    for (const p of recettes) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.recettes = p.value;
      byYear.set(y, e);
    }
    return Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        ...r,
        ratio:
          r.charge != null && r.recettes != null && r.recettes > 0
            ? (r.charge / r.recettes) * 100
            : undefined,
      }));
  }, [data]);

  if (rows.length === 0) return null;

  const derniere = rows[rows.length - 1]!;
  const ratioDernier = derniere.ratio ?? 0;
  const pic = rows.reduce((p, r) => (r.ratio != null && r.ratio > (p?.ratio ?? 0) ? r : p), rows[0]);

  // Couleur par niveau : vert < 8%, orange 8-15%, rouge > 15%
  const colorFor = (r: number | undefined) => {
    if (r == null) return "#cbd5e1";
    if (r < 8) return "#16a34a";
    if (r < 15) return "#d97706";
    return "#EF4135";
  };

  return (
    <DownloadableCard filename="budget-france-charge-dette-recettes" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Soutenabilité</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Charge de la dette ÷ recettes de l'État — 1945 à {derniere.year}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Part des recettes fiscales consacrée au seul paiement des intérêts de la dette.
            Autrement dit : sur chaque euro d'impôt encaissé, combien sert à rémunérer les
            prêteurs de l'État plutôt qu'à financer des services publics.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">Ratio {derniere.year}</div>
          <div className="font-display text-3xl font-bold tabular-nums" style={{ color: colorFor(ratioDernier) }}>
            {ratioDernier.toFixed(1)} %
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label={`Charge ${derniere.year}`} value={formatEurCompact(derniere.charge ?? 0)} color="text-flag-red" />
        <MiniStat label={`Recettes ${derniere.year}`} value={formatEurCompact(derniere.recettes ?? 0)} color="text-money" />
        <MiniStat label="Pic historique" value={`${pic?.ratio?.toFixed(1)} %`} sub={String(pic?.year)} color="text-flag-red" />
        <MiniStat label="Idée-clé" value={`~${Math.round(ratioDernier)} %`} sub="de ton impôt pour les intérêts" color="text-slate-900" />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `${Number(v).toFixed(0)} %`}
              width={50}
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
              formatter={(v, _name, entry) => {
                const n = typeof v === "number" ? v : Number(v);
                if (!Number.isFinite(n)) return ["—", "Ratio"];
                const ch = entry?.payload?.charge;
                const rec = entry?.payload?.recettes;
                return [
                  `${n.toFixed(1)} % · ${formatEurCompact(ch || 0)} sur ${formatEurCompact(rec || 0)}`,
                  "Ratio charge / recettes",
                ];
              }}
            />
            <ReferenceLine y={8} stroke="#d97706" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "8 %", position: "insideTopRight", fill: "#d97706", fontSize: 10 }} />
            <ReferenceLine y={15} stroke="#EF4135" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "15 %", position: "insideTopRight", fill: "#EF4135", fontSize: 10 }} />
            <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
              {rows.map((r, idx) => (
                <Cell key={idx} fill={colorFor(r.ratio)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Source : composition historique des dépenses État (mission "Engagements financiers")
        × série longue recettes État. Vert &lt; 8 %, orange 8-15 %, rouge &gt; 15 %. Le pic
        des années 90 reflète à la fois une dette en forte hausse ET des taux à deux chiffres.
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
