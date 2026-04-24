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
import { multiSeriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

type CountryKey = "DE" | "IT" | "ES";

const COUNTRY_INFO: Record<CountryKey, { label: string; color: string; flag: string }> = {
  DE: { label: "Allemagne (Bund)", color: "#000000", flag: "🇩🇪" },
  IT: { label: "Italie (BTP)",     color: "#008c45", flag: "🇮🇹" },
  ES: { label: "Espagne (Bonos)",  color: "#AA151B", flag: "🇪🇸" },
};

/**
 * Spreads souverains : France comparée à 3 pays voisins (DE, IT, ES).
 * Toggle pour choisir le pays comparé. Plus complet que SpreadChart qui
 * ne montre que vs Allemagne.
 */
export function SpreadMultiPaysChart({ data }: Props) {
  const [country, setCountry] = useState<CountryKey>("DE");
  const sp = data.spreadOatBund;
  const multi = data.spreadsMultiPays;

  const series = useMemo(() => {
    if (country === "DE" && sp) return sp.spread;
    if (country === "IT" && multi) return multi.spreadFrIt;
    if (country === "ES" && multi) return multi.spreadFrEs;
    return [];
  }, [country, sp, multi]);

  const rows = useMemo(() => series.map((p) => ({ date: p.date.slice(0, 7), value: p.value })), [series]);

  if (!sp || !multi) return null;

  const latest = series[series.length - 1]?.value ?? 0;
  const max = series.reduce((m, p) => Math.max(m, p.value), 0);
  const min = series.reduce((m, p) => Math.min(m, p.value), 0);
  const colorAccent = latest < 40 ? "#16a34a" : latest < 100 ? "#d97706" : "#EF4135";

  return (
    <DownloadableCard
      filename={`spread-france-${country.toLowerCase()}`}
      shareTitle={`Budget France — Spread FR vs ${COUNTRY_INFO[country].label}`}
      className="card p-5 md:p-6"
      getCsvData={() => multiSeriesToCsv([
        { id: "fr",      label: "OAT FR % ",      points: sp.oatFr },
        { id: "de",      label: "Bund DE %",      points: sp.bundDe },
        { id: "it",      label: "BTP IT %",       points: multi.btpItalie },
        { id: "es",      label: "Bonos ES %",     points: multi.bonosEspagne },
        { id: "fr-de",   label: "Spread FR-DE pb",points: sp.spread },
        { id: "fr-it",   label: "Spread FR-IT pb",points: multi.spreadFrIt },
        { id: "fr-es",   label: "Spread FR-ES pb",points: multi.spreadFrEs },
      ])}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Prime de risque souveraine</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Spread France vs {COUNTRY_INFO[country].flag} {COUNTRY_INFO[country].label}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Différence de rendement à 10 ans entre la France et le pays comparé,
            en points de base. <strong>Spread positif</strong> = la France emprunte
            plus cher (moins solide). <strong>Spread négatif</strong> = la France
            emprunte moins cher (plus solide).
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">Dernier point</div>
          <div className="font-display text-3xl font-bold tabular-nums" style={{ color: colorAccent }}>
            {latest >= 0 ? "+" : ""}{latest} <span className="text-sm">pb</span>
          </div>
        </div>
      </div>

      {/* Sélecteur pays */}
      <div className="mt-4 inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs">
        {(Object.keys(COUNTRY_INFO) as CountryKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCountry(k)}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              country === k ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {COUNTRY_INFO[k].flag} vs {COUNTRY_INFO[k].label.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="Pic historique" value={`${max} pb`} color="text-flag-red" />
        <MiniStat label="Plancher" value={`${min} pb`} color="text-money" />
        <MiniStat label="Niveau actuel" value={`${latest >= 0 ? "+" : ""}${latest} pb`} color={latest > 0 ? "text-amber-600" : "text-money"} />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `${Number(v) >= 0 ? "+" : ""}${v} pb`}
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
              formatter={(v) => [`${Number(v) >= 0 ? "+" : ""}${v} pb`, "Spread"]}
              labelFormatter={(l) => `Mois ${l}`}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <ReferenceLine y={100} stroke="#EF4135" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "Alerte 100 pb", position: "insideTopRight", fill: "#EF4135", fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COUNTRY_INFO[country].color}
              strokeWidth={2.5}
              dot={false}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="plainline" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : {multi.source.label}.
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
