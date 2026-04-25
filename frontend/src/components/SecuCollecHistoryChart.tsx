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
import type { BudgetSnapshot, TimeseriesPoint } from "../types";
import { formatEurCompact } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Évolution 1945-2025 des dépenses et recettes de la Sécurité sociale
 * et des Collectivités territoriales. Une courbe par sphère.
 */
export function SecuCollecHistoryChart({ data }: Props) {
  const hist = data.historiqueDetaille;
  if (!hist) return null;

  const rows = useMemo(() => {
    const byYear = new Map<number, { year: number; secuDep?: number; secuRec?: number; collecDep?: number; collecRec?: number }>();
    const push = (points: TimeseriesPoint[], key: "secuDep" | "secuRec" | "collecDep" | "collecRec") => {
      for (const p of points) {
        const y = new Date(p.date).getUTCFullYear();
        const e = byYear.get(y) ?? { year: y };
        e[key] = p.value;
        byYear.set(y, e);
      }
    };
    push(hist.secuDepenses, "secuDep");
    push(hist.secuRecettes, "secuRec");
    push(hist.collecDepenses, "collecDep");
    push(hist.collecRecettes, "collecRec");
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [hist]);

  const lastRow = rows[rows.length - 1];

  return (
    <DownloadableCard
      filename="secu-collec-1945-2025"
      shareTitle="Budget France — Sécu + Collectivités 1945-2025"
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv(rows.map((r) => ({
        annee: r.year,
        secu_depenses_eur: r.secuDep ?? "",
        secu_recettes_eur: r.secuRec ?? "",
        collec_depenses_eur: r.collecDep ?? "",
        collec_recettes_eur: r.collecRec ?? "",
      })))}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Longue période · sphères publiques hors État</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Dépenses et recettes Sécurité sociale + Collectivités — 1945 à {lastRow?.year}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            L'État central n'est qu'une des 3 sphères publiques. Voici l'évolution des 2 autres
            depuis 1945 : la Sécu (créée en octobre 1945) et les collectivités territoriales
            (accélération après les lois de décentralisation Defferre de 1982).
          </p>
        </div>
        <div className="flex gap-4 text-right text-xs">
          <MiniStat label={`Sécu ${lastRow?.year}`} value={formatEurCompact(lastRow?.secuDep ?? 0)} color="text-money" />
          <MiniStat label={`Collec ${lastRow?.year}`} value={formatEurCompact(lastRow?.collecDep ?? 0)} color="text-amber-600" />
        </div>
      </div>

      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSecu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCollec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
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
              formatter={(v, name) => {
                const n = typeof v === "number" ? v : Number(v);
                return Number.isFinite(n) ? [formatEurCompact(n), name] : ["—", name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
            <Area type="monotone" dataKey="secuDep" name="Dépenses Sécu" stroke="#16a34a" strokeWidth={2.5} fill="url(#gradSecu)" />
            <Area type="monotone" dataKey="collecDep" name="Dépenses Collectivités" stroke="#d97706" strokeWidth={2.5} fill="url(#gradCollec)" />
            <Area type="monotone" dataKey="secuRec" name="Recettes Sécu" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
            <Area type="monotone" dataKey="collecRec" name="Recettes Collec." stroke="#d97706" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : {hist.secuCollecSource.label}. Tirets = recettes, surface pleine = dépenses.
        Avant 1990, valeurs reconstituées depuis les comptes de la Sécu historiques et les
        annuaires DGCL. Inclut UNEDIC pour la Sécu.
      </div>

      {/* Explication pédagogique : pourquoi recettes ≈ dépenses (étape 8) */}
      <div className="mt-4 p-4 rounded-xl bg-brand-soft/30 border border-brand/15">
        <div className="text-xs uppercase tracking-widest text-brand mb-1">
          Pourquoi les courbes recettes et dépenses se collent ?
        </div>
        <div className="text-sm text-slate-700 leading-relaxed space-y-2">
          <p>
            Tu remarques que pour la Sécu et les collectivités, les courbes recettes et
            dépenses se suivent presque à l'euro près. Ce n'est <strong>pas une
            coïncidence</strong>, c'est une contrainte légale propre à ces deux sphères :
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>
              <strong>Sécurité sociale :</strong> les LFSS (Lois de Financement de la
              Sécurité Sociale, votées chaque automne) sont calibrées pour atteindre
              l'équilibre. Quand la Sécu déficit, les pouvoirs publics ajustent
              cotisations, CSG ou prestations <em>à la hausse comme à la baisse</em>.
              Les déficits non financés sont absorbés par la <strong>CADES</strong>
              (Caisse d'Amortissement de la Dette Sociale) qui les rembourse via une
              taxe dédiée — la CRDS — sur ~25 ans.
            </li>
            <li>
              <strong>Collectivités territoriales :</strong> la <strong>règle d'or</strong>
              (article L. 1612-4 CGCT) leur interdit de présenter un budget de
              fonctionnement en déséquilibre. Elles peuvent emprunter, mais
              <em> uniquement</em> pour financer l'investissement (écoles, transports, …)
              — jamais pour financer le fonctionnement courant. Conséquence : leurs
              recettes doivent toujours suivre leurs dépenses de fonctionnement.
            </li>
          </ul>
          <p className="text-xs text-slate-600">
            <strong>L'État central</strong> n'a pas cette contrainte (cf. l'écart
            permanent entre recettes et dépenses sur le graphique « Recettes vs dépenses
            de l'État »), ce qui explique l'essentiel de la dette publique française :
            ~78 % vient de l'État, le reste de la CADES (Sécu) et de quelques
            collectivités.
          </p>
        </div>
      </div>
    </DownloadableCard>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
