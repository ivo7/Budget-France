import { useMemo, useState } from "react";
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

type FraudeMode = "estimee" | "detectee";

/**
 * Triple vue sur la fraude :
 *  0. Toggle Estimée / Détectée (comprendre la différence)
 *  1. Chart en aires empilées : fraude fiscale + fraude sociale 1945 → 2025
 *  2. Chart en ligne : ratio (fraude totale) / (recettes de l'État)
 */
export function FraudesChart({ data }: Props) {
  const fraudes = data.fraudes;
  const [mode, setMode] = useState<FraudeMode>("estimee");
  const recettesLongue = data.series.recettesLongue?.points ?? [];

  // Sélectionne les bonnes séries selon le mode
  const seriesFiscale =
    mode === "detectee" ? (fraudes?.fiscaleDetectee ?? []) : (fraudes?.fiscale ?? []);
  const seriesSociale =
    mode === "detectee" ? (fraudes?.socialeDetectee ?? []) : (fraudes?.sociale ?? []);

  const absoluesData = useMemo(() => {
    if (!fraudes) return [];
    const byYear = new Map<number, { year: number; fiscale?: number; sociale?: number }>();
    for (const p of seriesFiscale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.fiscale = p.value;
      byYear.set(y, e);
    }
    for (const p of seriesSociale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.sociale = p.value;
      byYear.set(y, e);
    }
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [fraudes, seriesFiscale, seriesSociale]);

  const ratioData = useMemo(() => {
    if (!fraudes) return [];
    const byYear = new Map<number, { year: number; total?: number; recettes?: number; ratio?: number }>();
    for (const p of seriesFiscale) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.total = (e.total ?? 0) + p.value;
      byYear.set(y, e);
    }
    for (const p of seriesSociale) {
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
  }, [fraudes, recettesLongue, seriesFiscale, seriesSociale]);

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
      {/* Encadré pédagogique : différence estimée vs détectée */}
      <div className="card p-5 md:p-6 bg-brand-soft/20 border-brand/15">
        <div className="text-xs uppercase tracking-widest text-brand mb-1">
          Comprendre les chiffres de la fraude
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
          « Fraude estimée » vs « Fraude détectée » — deux mesures très différentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 leading-relaxed">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="font-semibold text-amber-800 mb-1">⚠ Fraude estimée (~80-100 Md€)</div>
            Évaluation théorique du <strong>« gap fiscal »</strong> par les économistes
            (Cour des comptes, CPO, OFCE, Solidaires Finances publiques). Inclut
            le manque à gagner que personne ne détecte (économie souterraine,
            schémas d'évasion sophistiqués, optimisation hors-règles). Ces
            chiffres sont des fourchettes larges, pas des montants encaissables.
          </div>
          <div className="rounded-lg border border-money/30 bg-green-50/40 p-3">
            <div className="font-semibold text-money mb-1">✓ Fraude détectée (~20 Md€)</div>
            Montants <strong>effectivement notifiés</strong> par DGFiP, URSSAF,
            CNAF, CNAM et Pôle emploi suite aux contrôles : <strong>17,1 Md€</strong>{" "}
            de droits et pénalités fiscaux + <strong>3 Md€</strong> de fraude sociale
            redressée (chiffres ministère de l'Économie 2024). C'est ce que l'État
            tente concrètement de recouvrer.
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          La différence entre les deux ≈ ce que l'administration <em>ne voit pas</em>.
          Choisis le mode ci-dessous pour basculer entre les deux mesures.
        </p>
      </div>

      {/* Toggle Estimée / Détectée */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-muted">Mesure :</span>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setMode("estimee")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mode === "estimee" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ⚠ Estimée (gap fiscal)
          </button>
          <button
            type="button"
            onClick={() => setMode("detectee")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mode === "detectee" ? "bg-money text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✓ Détectée (DGFiP/URSSAF)
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {mode === "estimee"
            ? "Estimations Cour des comptes / CPO / Solidaires"
            : "Montants notifiés (depuis 2008 — données systématiques)"}
        </span>
      </div>

      {/* Montants absolus */}
      <DownloadableCard
        filename={`budget-france-fraudes-${mode}`}
        className="card p-5 md:p-6"
        getCsvData={() => objectsToCsv(absoluesData.map((r) => ({
          annee: r.year,
          mesure: mode === "estimee" ? "estimee" : "detectee",
          fraude_fiscale_milliards: r.fiscale ?? "",
          fraude_sociale_milliards: r.sociale ?? "",
          total_milliards: (r.fiscale ?? 0) + (r.sociale ?? 0),
        })))}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted">
                Évolution {mode === "detectee" ? "2008" : "1945"} → {derniere?.year}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  mode === "estimee"
                    ? "bg-amber-50 text-warn border-amber-200"
                    : "bg-green-50 text-money border-green-200"
                }`}
              >
                {mode === "estimee" ? "estimations" : "officiel"}
              </span>
            </div>
            <div className="font-display text-xl font-semibold text-slate-900 mt-1">
              Fraude {mode === "estimee" ? "estimée" : "détectée"} — fiscale et sociale en Md€ courants
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
