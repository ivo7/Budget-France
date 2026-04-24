import { useMemo } from "react";
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
import { multiSeriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Taux d'intérêt réel = OAT 10 ans nominale − Inflation annuelle.
 *
 * Concept clé en SES / économie publique :
 *  - Si taux réel < 0 : l'État se "désendette en termes réels" — l'inflation
 *    érode la valeur de la dette plus vite que les intérêts ne s'accumulent.
 *  - Si taux réel > 0 : l'État emprunte "vraiment" à un coût positif.
 *
 * Période emblématique : 1973-1985 = inflation à 2 chiffres + taux nominaux
 * à 2 chiffres → taux réel souvent négatif. Inversement : 2010-2021 = QE BCE
 * + faible inflation → taux réel autour de 0. 2022 = retour ponctuel à -3 %
 * (inflation > 5 %, OAT à 2-3 %).
 */
export function RealRateChart({ data }: Props) {
  const oat = data.series.oatLongue?.points ?? [];
  const infl = data.inflation?.points ?? [];

  const rows = useMemo(() => {
    const inflMap = new Map<number, number>();
    for (const p of infl) inflMap.set(new Date(p.date).getUTCFullYear(), p.value);
    return oat
      .map((p) => {
        const year = new Date(p.date).getUTCFullYear();
        const inflation = inflMap.get(year) ?? 0;
        return {
          year,
          oat: p.value,
          inflation,
          real: p.value - inflation,
        };
      })
      .filter((r) => r.year <= 2025);
  }, [oat, infl]);

  if (rows.length === 0 || !data.inflation) return null;

  const last = rows[rows.length - 1]!;
  const negativeYears = rows.filter((r) => r.real < 0).length;

  return (
    <DownloadableCard
      filename="budget-france-taux-reel-1945-2025"
      shareTitle="Budget France — Taux d'intérêt réel 1945-2025"
      className="card p-5 md:p-6"
      getCsvData={() => multiSeriesToCsv([
        { id: "oat", label: "oat_10ans_nominal_pct", points: oat },
        { id: "inflation", label: "inflation_annuelle_pct", points: data.inflation!.points },
        { id: "real", label: "taux_reel_pct",
          points: rows.map((r) => ({ date: `${r.year}-12-31`, value: r.real })) },
      ])}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Concept SES — taux réel</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Taux d'intérêt réel = OAT 10 ans − Inflation
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Quand le taux réel est <strong className="text-money">négatif</strong>, l'inflation
            érode la dette plus vite que les intérêts ne s'accumulent : c'est le mécanisme de la
            <em> répression financière</em>. La France en a bénéficié dans les années 70 et
            ponctuellement en 2022.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">{last.year}</div>
          <div className="font-display text-2xl font-bold tabular-nums" style={{ color: last.real < 0 ? "#16a34a" : last.real < 1 ? "#d97706" : "#EF4135" }}>
            {last.real >= 0 ? "+" : ""}{last.real.toFixed(2)} %
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="OAT nominale" value={`${last.oat.toFixed(2)} %`} color="text-brand" />
        <MiniStat label="Inflation" value={`${last.inflation.toFixed(1)} %`} color="text-amber-600" />
        <MiniStat label={`Années à taux réel < 0`} value={`${negativeYears} / ${rows.length}`} color="text-money" />
      </div>

      <div className="mt-5 h-80">
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
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} %`}
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
              formatter={(v: number, name: string) => [`${v.toFixed(2)} %`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="plainline" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <Line type="monotone" dataKey="oat" name="OAT nominale" stroke="#0055A4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="inflation" name="Inflation" stroke="#d97706" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="real" name="Taux réel" stroke="#16a34a" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Sources : INSEE — IPC ; BCE / Banque de France — OAT 10 ans.
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
