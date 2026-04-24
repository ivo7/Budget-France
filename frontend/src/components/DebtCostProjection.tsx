import { useMemo, useState } from "react";
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
import { formatEurCompact } from "../lib/format";
import { multiSeriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Projection à 5 ans du coût annuel de la dette publique selon 3 scénarios
 * de taux. Hypothèses simplifiées :
 *  - Maturité moyenne de la dette : 8 ans (refinancement progressif)
 *  - Stock de dette croît du déficit annuel projeté (~5 % du PIB constant)
 *  - Taux long terme : choix utilisateur (curseur)
 *  - Croissance PIB : 1,5 % nominal constant
 *
 * Calcul simplifié : la fraction de dette refinancée chaque année (1/8) prend
 * le nouveau taux. Les 7/8 restants gardent leur taux historique.
 */
export function DebtCostProjection({ data }: Props) {
  const [tauxFutur, setTauxFutur] = useState(3.5);

  const projection = useMemo(() => {
    const detteInit = data.dettePublique.value;
    const oatActuel = data.tauxOat10ans.value;
    // Charge actuelle de la dette
    const chargeActuelle = data.compositionHistorique?.depenses
      .find((c) => c.id === "dette")?.points.slice(-1)[0]?.value ?? 0;
    const tauxApparent = chargeActuelle / detteInit; // taux moyen actuel sur le stock

    const out: { annee: number; charge: number; chargeBas: number; chargeHaut: number }[] = [];
    const anneeBase = data.annee;

    // Pour chaque année, on simule un refinancement progressif
    for (let i = 0; i <= 5; i++) {
      const annee = anneeBase + i;
      // Chaque année, 1/8 du stock est refinancé au nouveau taux
      const fractionRefin = Math.min(1, i / 8);
      const tauxMoyen = tauxApparent + (tauxFutur / 100 - tauxApparent) * fractionRefin;
      const tauxBas = tauxApparent + ((tauxFutur - 1) / 100 - tauxApparent) * fractionRefin;
      const tauxHaut = tauxApparent + ((tauxFutur + 1.5) / 100 - tauxApparent) * fractionRefin;

      // La dette croît de ~5 % de PIB par an (déficit projeté)
      const detteProjetee = detteInit * Math.pow(1.05, i);

      out.push({
        annee,
        charge: detteProjetee * tauxMoyen,
        chargeBas: detteProjetee * tauxBas,
        chargeHaut: detteProjetee * tauxHaut,
      });
    }
    return { rows: out, oatActuel, tauxApparent: tauxApparent * 100, chargeActuelle };
  }, [data, tauxFutur]);

  const last = projection.rows[projection.rows.length - 1]!;
  const augmentation = ((last.charge - projection.chargeActuelle) / projection.chargeActuelle) * 100;

  return (
    <DownloadableCard
      filename="budget-france-projection-dette-5ans"
      shareTitle="Budget France — Projection du coût de la dette à 5 ans"
      className="card p-5 md:p-6"
      getCsvData={() => multiSeriesToCsv([
        { id: "central", label: "scenario_central_charge_eur",
          points: projection.rows.map((r) => ({ date: `${r.annee}-12-31`, value: r.charge })) },
        { id: "bas", label: "scenario_bas_charge_eur",
          points: projection.rows.map((r) => ({ date: `${r.annee}-12-31`, value: r.chargeBas })) },
        { id: "haut", label: "scenario_haut_charge_eur",
          points: projection.rows.map((r) => ({ date: `${r.annee}-12-31`, value: r.chargeHaut })) },
      ])}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Projection 5 ans</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Coût annuel de la dette à 5 ans selon les scénarios de taux
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Simulation pédagogique : ajuste le taux long terme attendu et observe l'effet
            sur la charge annuelle de la dette. Hypothèses : maturité moyenne 8 ans,
            déficit projeté ~5 % PIB, refinancement progressif (1/8 du stock par an).
          </p>
        </div>
      </div>

      {/* Slider taux */}
      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Taux OAT 10 ans projeté : <strong className="text-brand tabular-nums">{tauxFutur.toFixed(2)} %</strong>
          <span className="text-slate-500 ml-2">
            (taux actuel : {projection.oatActuel.toFixed(2)} %, taux apparent du stock : {projection.tauxApparent.toFixed(2)} %)
          </span>
        </label>
        <input
          type="range"
          min={0.5}
          max={7}
          step={0.25}
          value={tauxFutur}
          onChange={(e) => setTauxFutur(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Charge actuelle" value={formatEurCompact(projection.chargeActuelle)} color="text-slate-900" />
        <Stat label={`Charge ${last.annee} (central)`} value={formatEurCompact(last.charge)} color="text-flag-red" />
        <Stat label="Augmentation 5 ans" value={`${augmentation >= 0 ? "+" : ""}${augmentation.toFixed(0)} %`} color={augmentation > 30 ? "text-flag-red" : "text-amber-600"} />
        <Stat label="Fourchette haute" value={formatEurCompact(last.chargeHaut)} color="text-flag-red" sub={`taux +1,5 pt`} />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projection.rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="annee"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
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
              formatter={(v: number, name: string) => [formatEurCompact(v), name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
            <Line type="monotone" dataKey="chargeBas" name="Scénario bas (taux −1 pt)" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="charge" name="Scénario central" stroke="#0055A4" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="chargeHaut" name="Scénario haut (taux +1,5 pt)" stroke="#EF4135" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Modèle simplifié à but pédagogique. Pour une vraie projection, voir les
        documents budgétaires du Programme de Stabilité, mis à jour annuellement
        par la Direction du Budget.
      </div>
    </DownloadableCard>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-lg font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
