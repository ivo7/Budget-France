import type { Metric } from "../types";
import { formatDate, formatEurCompact, formatPerCapita, formatPercent, formatPctPoints } from "../lib/format";

interface Props {
  /** Titre de la card. Accepte un ReactNode pour permettre d'embarquer
   *  des termes <GlossaryTerm /> cliquables (ex: « Taux OAT 10 ans »). */
  title: React.ReactNode;
  metric: Metric;
  accent?: "default" | "red" | "green" | "blue";
  hint?: React.ReactNode;
}

const accentClass: Record<NonNullable<Props["accent"]>, string> = {
  default: "text-slate-900",
  red: "text-flag-red",
  green: "text-money",
  blue: "text-brand",
};

function formatMetric(m: Metric): string {
  if (m.unit === "EUR" || m.unit === "EUR_PER_SEC") return formatEurCompact(m.value);
  if (m.unit === "PCT") return formatPctPoints(m.value);
  if (m.unit === "RATIO") return formatPercent(m.value);
  return String(m.value);
}

export function KPICard({ title, metric, accent = "default", hint }: Props) {
  const badgeColor = metric.source.status === "ok"
    ? "bg-green-50 text-money border border-green-200"
    : metric.source.status === "fallback"
      ? "bg-amber-50 text-warn border border-amber-200"
      : "bg-red-50 text-flag-red border border-red-200";
  const badgeLabel = metric.source.status === "ok"
    ? "source live"
    : metric.source.status === "fallback"
      ? "secours"
      : "erreur";

  return (
    <div className="card p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-widest text-muted">{title}</div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>

      <div className={`font-display font-bold tabular-nums text-3xl md:text-4xl ${accentClass[accent]}`}>
        {formatMetric(metric)}
      </div>

      {/* Rendu "par habitant" pour les métriques en euros (pédagogique grand public) */}
      {(metric.unit === "EUR") && (
        <div className="text-xs font-medium text-slate-700 tabular-nums">
          ≈ {formatPerCapita(metric.value)}
        </div>
      )}

      {hint && <div className="text-xs text-slate-500 leading-relaxed">{hint}</div>}

      <div className="mt-auto pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between gap-2">
        <span className="truncate" title={metric.source.label}>{metric.source.label}</span>
        <span className="shrink-0">arr. {formatDate(metric.asOf)}</span>
      </div>
    </div>
  );
}
