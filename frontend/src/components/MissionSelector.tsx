import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Évolution détaillée de chaque mission / ministère 1945-2025.
 * L'utilisateur choisit une mission dans un sélecteur et voit sa courbe dédiée.
 * Ex : sélectionner "Défense" → courbe des dépenses Défense de 1945 à 2025.
 */
export function MissionSelector({ data }: Props) {
  const missions = data.historiqueDetaille?.missions ?? [];
  const [activeId, setActiveId] = useState<string>(missions[0]?.id ?? "");

  const active = missions.find((m) => m.id === activeId) ?? missions[0];

  const rows = useMemo(() => {
    if (!active) return [];
    return active.points.map((p) => ({
      year: new Date(p.date).getUTCFullYear(),
      value: p.value,
    }));
  }, [active]);

  if (missions.length === 0 || !active) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        Historique détaillé par mission indisponible.
      </div>
    );
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  const multiplier = first && last && first.value > 0 ? last.value / first.value : 0;

  return (
    <DownloadableCard filename={`mission-${active.id}-1945-2025`} shareTitle={`Budget France — ${active.label} 1945-2025`} className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Évolution par mission</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Dépenses détaillées — 1945 à {last?.year}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Choisis une mission ci-dessous pour voir comment ses dépenses ont évolué depuis 1945.
            Par exemple, la Défense est passée de ~2 Md€ (1945) à ~53 Md€ (2025) — mais sa part
            dans le budget total de l'État a été divisée par plus de 4 sur la même période.
          </p>
        </div>
      </div>

      {/* Sélecteur de mission */}
      <div className="mt-5 flex flex-wrap gap-2">
        {missions.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveId(m.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
              m.id === activeId
                ? "text-white border-transparent shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand"
            }`}
            style={m.id === activeId ? { background: m.colorHex } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Description mission active */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border-l-4 flex-1"
        style={{ borderLeftColor: active.colorHex }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: active.colorHex }} />
          <span className="font-semibold text-sm text-slate-900">{active.label}</span>
        </div>
        <div className="text-xs text-slate-600">{active.description}</div>
      </div>

      {/* Stats + courbe */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="1945" value={first ? formatEurCompact(first.value) : "—"} color="text-slate-900" />
        <MiniStat label="1980" value={rows.find((r) => r.year === 1980) ? formatEurCompact(rows.find((r) => r.year === 1980)!.value) : "—"} color="text-slate-900" />
        <MiniStat label="2000" value={rows.find((r) => r.year === 2000) ? formatEurCompact(rows.find((r) => r.year === 2000)!.value) : "—"} color="text-slate-900" />
        <MiniStat label={String(last?.year ?? "")} value={last ? formatEurCompact(last.value) : "—"} color="text-slate-900" hint={multiplier > 0 ? `×${multiplier.toFixed(0)} depuis 1945` : undefined} />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${active.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active.colorHex} stopOpacity={0.4} />
                <stop offset="100%" stopColor={active.colorHex} stopOpacity={0.02} />
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
                fontSize: 12,
              }}
              labelFormatter={(l) => `Année ${l}`}
              formatter={(v: number) => [formatEurCompact(v), active.label]}
            />
            <Area type="monotone" dataKey="value" stroke={active.colorHex} strokeWidth={2.5} fill={`url(#grad-${active.id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : {data.historiqueDetaille?.missionsSource.label}. Valeurs en euros courants
        (franc converti avant 1999 via taux fixe 6,55957 F = 1 €). Les périmètres ministériels
        ont évolué sur la période ; les données sont reconstituées pour suivre une cohérence
        fonctionnelle (défense ≈ ministère des Armées au sens large).
      </div>
    </DownloadableCard>
  );
}

function MiniStat({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-brand mt-0.5">{hint}</div>}
    </div>
  );
}
