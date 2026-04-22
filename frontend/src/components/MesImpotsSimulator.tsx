import { useMemo, useState } from "react";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";
import { simulateTaxes, allocateAcrossMissions } from "../lib/taxSimulator";
import { DownloadableCard } from "./DownloadableCard";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Simulateur "Où vont mes impôts ?" — l'utilisateur saisit son revenu mensuel
 * net, on estime sa contribution au budget État (IR + TVA + taxes indirectes),
 * puis on la ventile sur les grandes missions de l'État via la LFI.
 *
 * Valeur ajoutée pour le grand public : passer d'un budget abstrait de 580 Md€
 * à "sur tes 2 400 € d'impôts annuels, 343 € vont à l'enseignement scolaire,
 * 219 € à la défense, 257 € aux intérêts de la dette…".
 */
export function MesImpotsSimulator({ data }: Props) {
  const [monthlyNet, setMonthlyNet] = useState<number>(2500);

  const result = useMemo(() => simulateTaxes(monthlyNet), [monthlyNet]);
  const missions = data.repartition?.depenses ?? [];
  const allocation = useMemo(
    () => allocateAcrossMissions(result.totalEtat, missions),
    [result.totalEtat, missions],
  );

  return (
    <div className="space-y-4">
      {/* Formulaire + résumé */}
      <DownloadableCard filename="mes-impots-simulation" shareTitle="Budget France — Où vont mes impôts ?" className="card p-5 md:p-6">
        <div className="text-xs uppercase tracking-widest text-muted">Simulateur pédagogique</div>
        <h2 className="font-display text-2xl font-semibold text-slate-900 mt-1">
          Où vont tes impôts ?
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Entre ton salaire mensuel net et vois comment ta contribution annuelle au budget de
          l'État se répartit sur les grandes missions publiques. Calcul simplifié, pédagogique —
          pas un vrai avis d'imposition.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs uppercase tracking-widest text-muted mb-1">
              Salaire mensuel net (€)
            </label>
            <input
              type="number"
              value={monthlyNet}
              min={0}
              max={50000}
              step={100}
              onChange={(e) => setMonthlyNet(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-semibold tabular-nums focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <input
              type="range"
              min={0}
              max={15000}
              step={100}
              value={Math.min(monthlyNet, 15000)}
              onChange={(e) => setMonthlyNet(Number(e.target.value))}
              className="w-full mt-2 accent-brand"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Revenu annuel : {formatEurCompact(result.annualNetIncome)}
            </div>
          </div>

          <MiniStat label="Impôt sur le revenu" value={formatEurCompact(result.ir)} hint="1 part fiscale, abattement 10 %" color="text-brand" />
          <MiniStat label="TVA & taxes indirectes" value={formatEurCompact(result.tva + result.ticpeEtAutres)} hint="estimé à 8 % du revenu net" color="text-brand-light" />
        </div>

        <div className="mt-6 rounded-2xl border border-brand/20 bg-brand-soft/40 p-4">
          <div className="text-xs uppercase tracking-widest text-brand">Total État annuel</div>
          <div className="font-display text-4xl font-bold text-brand tabular-nums mt-1">
            {formatEurCompact(result.totalEtat)}
          </div>
          <div className="text-sm text-slate-700 mt-1">
            Taux effectif : <strong>{(result.effectiveRate * 100).toFixed(1)} %</strong> de ton revenu net.
          </div>
          <div className="text-xs text-slate-500 mt-2 leading-relaxed">
            Ne comprend ni CSG/CRDS (qui vont à la Sécurité sociale, pas à l'État), ni les cotisations
            salariales, ni les taxes locales (taxe foncière, redevance audiovisuelle…).
          </div>
        </div>
      </DownloadableCard>

      {/* Ventilation sur les missions */}
      <DownloadableCard filename="mes-impots-repartition" shareTitle="Budget France — Répartition de mes impôts" className="card p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted">Ventilation</div>
            <div className="font-display text-xl font-semibold text-slate-900 mt-1">
              Où vont ces {formatEurCompact(result.totalEtat)} ?
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Répartis au prorata de la LFI {data.repartition?.annee ?? data.annee} des dépenses de
              l'État par mission. Exemple : si la mission « Défense » représente 9 % du budget, 9 %
              de ta contribution va y être alloué.
            </p>
          </div>
        </div>

        {allocation.length === 0 ? (
          <div className="mt-6 p-6 bg-slate-50 rounded-lg text-sm text-slate-500">
            La répartition LFI n'est pas disponible. Régénère le pipeline.
          </div>
        ) : (
          <ul className="mt-5 space-y-2.5 pr-10">
            {allocation.map((a) => (
              <li key={a.categorie}>
                <div className="flex items-center justify-between gap-3 text-sm mb-1">
                  <span className="text-slate-700 truncate">{a.categorie}</span>
                  <span className="tabular-nums text-slate-500 shrink-0">
                    <span className="font-semibold text-slate-900">{formatEurCompact(a.contribution)}</span>
                    <span className="ml-1.5">({(a.part * 100).toFixed(1)} %)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, a.part * 100 * 5))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 text-[11px] text-slate-500 leading-relaxed">
          <strong>Hypothèses du calcul</strong> (voir aussi la page Fiches pédagogiques) :
          barème IR 2024 à 1 part fiscale, abattement salarial de 10 % plafonné à 14 171 €,
          TVA estimée à 7 % du revenu net (taux effectif moyen pondéré), TICPE et autres taxes
          indirectes ~1 % du revenu. Les résultats sont des <strong>ordres de grandeur</strong>,
          pas un calcul fiscal officiel.
        </div>
      </DownloadableCard>
    </div>
  );
}

function MiniStat({
  label, value, hint, color,
}: {
  label: string; value: string; hint?: string; color: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
