import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { formatPercent } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";

interface Props {
  data: BudgetSnapshot;
}

const CATEGORY_COLOR: Record<string, string> = {
  politique: "#0055A4",
  economique: "#16a34a",
  monetaire: "#7c3aed",
  militaire: "#64748b",
  crise: "#EF4135",
};

const CATEGORY_LABEL: Record<string, string> = {
  politique: "Politique",
  economique: "Économique",
  monetaire: "Monétaire",
  militaire: "Militaire",
  crise: "Crise",
};

/**
 * Courbe dette / PIB annotée d'événements historiques marquants.
 * Pour chaque événement on place un point coloré à l'année correspondante ;
 * au survol, on affiche le titre et la description pédagogique.
 *
 * Utilité : aider les élèves à comprendre POURQUOI les inflexions
 * (relance Mitterrand 1981, crise 2008, COVID 2020, etc.).
 */
export function EventsAnnotated({ data }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const ratioData = useMemo(() => {
    const dette = data.series.detteLongue?.points ?? [];
    const pib = data.series.pibLongue?.points ?? [];
    const byYear = new Map<number, { year: number; ratio?: number }>();
    for (const p of dette) {
      const y = new Date(p.date).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y };
      e.ratio = p.value;
      byYear.set(y, e);
    }
    for (const p of pib) {
      const y = new Date(p.date).getUTCFullYear();
      const existing = byYear.get(y);
      if (existing?.ratio && p.value > 0) {
        existing.ratio = (existing.ratio / p.value) * 100;
      }
    }
    return Array.from(byYear.values())
      .filter((r) => r.ratio != null)
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const events = (data.events?.items ?? []).filter(
    (ev) => activeCategory === "all" || ev.category === activeCategory,
  );

  const eventPoints = useMemo(() => {
    return events
      .map((ev) => {
        const year = new Date(ev.date).getUTCFullYear();
        const match = ratioData.find((r) => r.year === year);
        if (!match) return null;
        return { ...ev, year, ratio: match.ratio! };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [events, ratioData]);

  if (!data.events || ratioData.length === 0) return null;

  return (
    <DownloadableCard filename="budget-france-dette-evenements" shareTitle="Budget France — dette et événements 1945+" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Contexte pédagogique</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Dette / PIB annotée des événements historiques (1945 → {ratioData[ratioData.length - 1]!.year})
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Survole un point coloré pour comprendre ce qui s'est passé cette année-là et
            comment la décision a influencé les finances publiques.
          </p>
        </div>
      </div>

      {/* Filtre par catégorie */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <FilterBtn active={activeCategory === "all"} onClick={() => setActiveCategory("all")} color="#0f172a">
          Tous ({data.events.items.length})
        </FilterBtn>
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => {
          const count = data.events!.items.filter((e) => e.category === key).length;
          return (
            <FilterBtn
              key={key}
              active={activeCategory === key}
              onClick={() => setActiveCategory(key)}
              color={CATEGORY_COLOR[key]!}
            >
              {label} ({count})
            </FilterBtn>
          );
        })}
      </div>

      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ratioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0055A4" stopOpacity={0.2} />
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
              tickFormatter={(v) => `${Math.round(Number(v))} %`}
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
              formatter={(v, name, entry) => {
                const n = typeof v === "number" ? v : Number(v);
                const ev = eventPoints.find((e) => e.year === entry?.payload?.year);
                if (ev) {
                  return [
                    <div key="e" style={{ display: "block", maxWidth: 280 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{ev.description}</div>
                      <div style={{ marginTop: 4, fontSize: 11 }}>Dette/PIB : <strong>{Math.round(n)} %</strong></div>
                    </div>,
                    "",
                  ] as unknown as [string, string];
                }
                return [`${Math.round(n)} %`, name];
              }}
            />
            <Area type="monotone" dataKey="ratio" stroke="#0055A4" strokeWidth={2} fill="url(#evtGrad)" />
            {eventPoints.map((ev) => (
              <ReferenceDot
                key={ev.date}
                x={ev.year}
                y={ev.ratio}
                r={5}
                fill={CATEGORY_COLOR[ev.category]!}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-muted mb-2">Événements affichés</div>
        <ul className="space-y-2 text-xs">
          {eventPoints.slice().reverse().map((ev) => (
            <li key={ev.date} className="flex gap-3">
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: CATEGORY_COLOR[ev.category] }}
              />
              <span>
                <strong className="text-slate-800">{ev.year}</strong> · {ev.title}
                <span className="text-slate-600"> — {ev.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-[11px] text-slate-500">
        Source : {data.events.source.label}.{" "}
        <span>Ratio dette/PIB = {formatPercent(data.ratioDettePib.value)} en {data.annee}.</span>
      </div>
    </DownloadableCard>
  );
}

function FilterBtn({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full font-medium transition border ${
        active ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-brand/40"
      }`}
      style={active ? { background: color } : undefined}
    >
      {children}
    </button>
  );
}
