import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot, TimeseriesPoint } from "../types";
import { formatEurCompact } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Double vue sur la fraude :
 *  1. Chart en aires empilées : fraude fiscale + fraude sociale 1945 → 2025
 *  2. Chart en ligne : ratio (fraude totale) / (recettes de l'État)
 */
export function FraudesChart({ data }: Props) {
  const fraudes = data.fraudes;
  const recettesLongue = data.series.recettesLongue?.points ?? [];

  const absoluesData = useMemo(() => {
    if (!fraudes) return [];
    const byYear = new Map<number, { year: number; fiscale?: number; sociale?: number }>();
    for (const p of fraudes.fiscale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.fiscale = p.value;
      byYear.set(y, e);
    }
    for (const p of fraudes.sociale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.sociale = p.value;
      byYear.set(y, e);
    }
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [fraudes]);

  const ratioData = useMemo(() => {
    if (!fraudes) return [];
    const byYear = new Map<number, { year: number; total?: number; recettes?: number; ratio?: number }>();
    for (const p of fraudes.fiscale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.total = (e.total ?? 0) + p.value;
      byYear.set(y, e);
    }
    for (const p of fraudes.sociale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.total = (e.total ?? 0) + p.value;
      byYear.set(y, e);
    }
    for (const p of recettesLongue as TimeseriesPoint[]) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.recettes = p.value;
      byYear.set(y, e);
    }
    return Array.from(byYear.values())
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        ...r,
        ratio: r.total != null && r.recettes != null && r.recettes > 0 ? (r.total / r.recettes) * 100 : undefined,
      }));
  }, [fraudes, recettesLongue]);

  if (!fraudes) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        Données de fraudes indisponibles. Régénère le snapshot :{" "}
        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
          docker compose run --rm pipeline
        </code>
      </div>
    );
  }

  const derniere = absoluesData[absoluesData.length - 1];
  const totalDerniere = derniere ? (derniere.fiscale ?? 0) + (derniere.sociale ?? 0) : 0;
  const ratioDernier = ratioData[ratioData.length - 1]?.ratio;

  return (
    <div className="space-y-4">
      {/* Montants absolus */}
      <DownloadableCard
        filename="budget-france-fraudes-montants"
        className="card p-5 md:p-6"
        getCsvData={() => objectsToCsv(absoluesData.map((r) => ({
          annee: r.year,
          fraude_fiscale_milliards: r.fiscale ?? "",
          fraude_sociale_milliards: r.sociale ?? "",
          total_milliards: (r.fiscale ?? 0) + (r.sociale ?? 0),
        })))}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted">Évolution 1945 → {derniere?.year}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warn border border-amber-200 uppercase tracking-wider">
                estimations
              </span>
            </div>
            <div className="font-display text-xl font-semibold text-slate-900 mt-1">
              Fraude fiscale et fraude sociale — en Md€ courants
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted">Total {derniere?.year}</div>
            <div className="font-display text-2xl font-bold text-flag-red tabular-nums">
              {formatEurCompact(totalDerniere)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={absoluesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fraudeFiscale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4135" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#EF4135" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fraudeSociale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.05} />
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
                formatter={(v, name) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return Number.isFinite(n) ? [formatEurCompact(n), name] : ["—", name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
              <Area
                type="monotone"
                dataKey="fiscale"
                name="Fraude fiscale"
                stackId="1"
                stroke="#EF4135"
                strokeWidth={2}
                fill="url(#fraudeFiscale)"
              />
              <Area
                type="monotone"
                dataKey="sociale"
                name="Fraude sociale"
                stackId="1"
                stroke="#d97706"
                strokeWidth={2}
                fill="url(#fraudeSociale)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          <strong>Méthode :</strong> estimations agrégées depuis les rapports Cour des comptes,
          Conseil des Prélèvements Obligatoires, études OFCE et Solidaires Finances publiques.
          Les chiffres avant 1990 sont reconstitués a posteriori et très approximatifs — aucun
          organisme n'avait alors de méthode d'audit aléatoire. Les fourchettes récentes
          varient aussi fortement selon les méthodologies (la Cour des comptes estime la
          fraude fiscale dans une plage de 80 à 100 Md€ pour 2024).
        </div>
      </DownloadableCard>

      {/* Ratio fraudes / recettes */}
      <DownloadableCard
        filename="budget-france-fraudes-ratio"
        className="card p-5 md:p-6"
        getCsvData={() => objectsToCsv(ratioData.map((r) => ({
          annee: r.year,
          fraude_totale_milliards: r.total ?? "",
          recettes_etat_milliards: r.recettes ?? "",
          ratio_pourcent: r.ratio != null ? r.ratio.toFixed(2) : "",
        })))}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted">Ratio</div>
            <div className="font-display text-xl font-semibold text-slate-900 mt-1">
              Fraude totale ÷ recettes de l'État
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Part de la fraude (fiscale + sociale) rapportée aux recettes du budget général
              de l'État. Un ratio élevé signifie que l'État collecte proportionnellement
              moins pour un niveau d'activité donné.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted">Ratio {derniere?.year}</div>
            <div className="font-display text-2xl font-bold text-flag-red tabular-nums">
              {ratioDernier != null ? `${ratioDernier.toFixed(1)} %` : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratioData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                tickFormatter={(v) => `${Number(v).toFixed(0)} %`}
                width={50}
                domain={[0, (dataMax: number) => Math.ceil(dataMax + 5)]}
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
                formatter={(v, name, entry) => {
                  const n = typeof v === "number" ? v : Number(v);
                  if (!Number.isFinite(n)) return ["—", name];
                  const total = entry?.payload?.total;
                  const rec = entry?.payload?.recettes;
                  return [
                    `${n.toFixed(1)} % · ${formatEurCompact(total || 0)} sur ${formatEurCompact(rec || 0)}`,
                    "Ratio fraude / recettes",
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="ratio"
                name="Ratio"
                stroke="#EF4135"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          Le dénominateur utilisé est la série "Recettes de l'État" du budget général
          (hors Sécurité sociale et collectivités). Un calcul alternatif par rapport au
          PIB ou aux APU donnerait un ratio plus faible car le dénominateur est plus
          large.
        </div>
      </DownloadableCard>
    </div>
  );
}
