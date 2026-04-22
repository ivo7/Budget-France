import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";

interface Props {
  data: BudgetSnapshot;
}

const AGENCY_COLOR: Record<string, string> = {
  sp: "#0055A4",
  moodys: "#7c3aed",
  fitch: "#16a34a",
};

// Échelle numérique → libellé court (pour l'axe Y)
const TICK_LABELS: Record<number, string> = {
  20: "AAA",
  19: "AA+",
  18: "AA",
  17: "AA-",
  16: "A+",
  15: "A",
};

/**
 * Historique des notations souveraines France — S&P / Moody's / Fitch.
 * Les ratings sont convertis en échelle numérique commune (AAA=20, AA+=19…)
 * pour pouvoir superposer les 3 agences sur un même graph.
 */
export function RatingsTimeline({ data }: Props) {
  const ratings = data.ratings;

  const rows = useMemo(() => {
    if (!ratings) return [];
    const byYear = new Map<number, Record<string, number | string>>();
    for (const agency of ratings.agencies) {
      // Pour chaque agence, on génère des points annuels en maintenant la note
      // jusqu'au prochain événement (step function).
      const events = [...agency.events].sort((a, b) => a.date.localeCompare(b.date));
      const startYear = new Date(events[0]!.date).getUTCFullYear();
      const endYear = 2026;
      let current = events[0]!.numeric;
      let idxEvent = 0;
      for (let y = startYear; y <= endYear; y++) {
        while (idxEvent < events.length - 1 && new Date(events[idxEvent + 1]!.date).getUTCFullYear() <= y) {
          idxEvent++;
          current = events[idxEvent]!.numeric;
        }
        const row = byYear.get(y) ?? { year: y };
        row[agency.id] = current;
        byYear.set(y, row);
      }
    }
    return Array.from(byYear.values()).sort((a, b) => (a["year"] as number) - (b["year"] as number));
  }, [ratings]);

  if (!ratings) return null;

  const lastEventsByAgency = ratings.agencies.map((a) => {
    const last = a.events[a.events.length - 1]!;
    return { id: a.id, label: a.label, ...last };
  });

  return (
    <DownloadableCard filename="budget-france-ratings-souverains" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Notations souveraines</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Historique des ratings France — S&amp;P, Moody's, Fitch
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Note attribuée à la dette souveraine française par les trois agences majeures.
            Plus la note est haute, plus le marché considère la France comme sûre et plus
            l'État emprunte à bas coût. La France a perdu son AAA en 2012.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {lastEventsByAgency.map((e) => (
          <AgencyCard key={e.id} id={e.id} label={e.label} rating={e.rating} date={e.date} outlook={e.outlook} />
        ))}
      </div>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[16, 20]}
              ticks={[16, 17, 18, 19, 20]}
              tickFormatter={(v) => TICK_LABELS[Number(v)] ?? String(v)}
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
              labelFormatter={(l) => `Année ${l}`}
              formatter={(v, name) => {
                const n = typeof v === "number" ? v : Number(v);
                return [TICK_LABELS[n] ?? String(n), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="plainline" />
            {ratings.agencies.map((a) => (
              <Line
                key={a.id}
                type="stepAfter"
                dataKey={a.id}
                name={a.label}
                stroke={AGENCY_COLOR[a.id]}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
          Événements marquants
        </div>
        <ul className="text-xs text-slate-600 space-y-1.5">
          {ratings.agencies
            .flatMap((a) => a.events.filter((e) => e.note).map((e) => ({ ...e, agency: a.label, agencyId: a.id })))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)
            .map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-slate-500 shrink-0">{e.date.slice(0, 7)}</span>
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: AGENCY_COLOR[e.agencyId] }}
                />
                <span>
                  <strong className="text-slate-800">{e.agency}</strong> → {e.rating}
                  {e.outlook && <span className="text-slate-500"> ({e.outlook})</span>}
                  {e.note && <span className="text-slate-600"> · {e.note}</span>}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Source : {ratings.source.label}. Chaque agence publie ses actions de rating sur son
        propre site et dans des communiqués officiels relayés par l'Agence France Trésor.
      </div>
    </DownloadableCard>
  );
}

function AgencyCard({
  id, label, rating, date, outlook,
}: {
  id: string; label: string; rating: string; date: string; outlook?: "stable" | "positive" | "negative";
}) {
  const outlookColor = outlook === "positive" ? "text-money" : outlook === "negative" ? "text-flag-red" : "text-slate-500";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: AGENCY_COLOR[id] }} />
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </div>
      <div className="font-display text-3xl font-bold tabular-nums" style={{ color: AGENCY_COLOR[id] }}>
        {rating}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">Depuis le {new Date(date).toLocaleDateString("fr-FR")}</div>
      {outlook && (
        <div className={`text-[11px] mt-1 uppercase tracking-wider ${outlookColor}`}>
          Perspective {outlook}
        </div>
      )}
    </div>
  );
}
