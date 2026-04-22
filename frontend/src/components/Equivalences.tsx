import { useState } from "react";
import { DownloadableCard } from "./DownloadableCard";
import { formatEurCompact } from "../lib/format";

interface Equivalence {
  label: string;
  unit: string;
  /** Coût unitaire en euros. */
  unitCost: number;
  source: string;
  icon: string;
}

// Ordres de grandeur publics — moyens nationaux 2024-2025.
const EQUIVALENCES: Equivalence[] = [
  {
    label: "Salaires annuels bruts d'enseignants du secondaire",
    unit: "enseignants pendant 1 an",
    unitCost: 52_000,
    source: "Éducation nationale — rémunération moyenne certifiés/agrégés",
    icon: "🎓",
  },
  {
    label: "Hôpitaux publics moyens (tous budgets confondus)",
    unit: "hôpitaux pendant 1 an",
    unitCost: 70_000_000,
    source: "Ministère de la Santé — budget moyen d'un CH",
    icon: "🏥",
  },
  {
    label: "Kilomètres de ligne à grande vitesse neufs",
    unit: "km de LGV construits",
    unitCost: 25_000_000,
    source: "SNCF Réseau / Cour des comptes — coût moyen LGV récente",
    icon: "🚆",
  },
  {
    label: "Logements sociaux financés (HLM)",
    unit: "logements sociaux neufs",
    unitCost: 150_000,
    source: "Union sociale pour l'habitat — coût de construction moyen",
    icon: "🏘️",
  },
  {
    label: "Rafale F4 équipés",
    unit: "avions de chasse neufs",
    unitCost: 80_000_000,
    source: "Direction générale de l'armement — prix export standard",
    icon: "✈️",
  },
  {
    label: "Cars scolaires",
    unit: "cars scolaires neufs",
    unitCost: 150_000,
    source: "FNTV — prix moyen car scolaire 60 places",
    icon: "🚌",
  },
  {
    label: "Places en EHPAD (1 an)",
    unit: "résidents financés pendant 1 an",
    unitCost: 32_000,
    source: "CNSA — coût moyen d'une place en EHPAD (hors reste à charge)",
    icon: "👵",
  },
  {
    label: "Éoliennes offshore",
    unit: "éoliennes en mer",
    unitCost: 15_000_000,
    source: "RTE — coût moyen installé par MW offshore",
    icon: "🌀",
  },
];

/**
 * Carte "1 milliard, ça représente quoi ?" — convertit un montant en euros
 * vers des équivalences concrètes (nombre d'enseignants, hôpitaux, km de LGV…)
 * pour rendre les ordres de grandeur tangibles.
 *
 * L'utilisateur peut choisir la valeur de référence parmi :
 *   - 1 milliard
 *   - Le déficit annuel courant
 *   - La charge de la dette annuelle
 *   - Un montant libre
 */
export function Equivalences({
  defaultAmount = 1_000_000_000,
  deficitAmount,
  chargeDetteAmount,
}: {
  defaultAmount?: number;
  deficitAmount?: number;
  chargeDetteAmount?: number;
}) {
  const [amount, setAmount] = useState<number>(defaultAmount);

  const preset = (label: string, value: number) => (
    <button
      type="button"
      onClick={() => setAmount(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
        Math.abs(amount - value) < 1
          ? "bg-brand text-white border-brand"
          : "bg-white text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand"
      }`}
    >
      {label}
    </button>
  );

  return (
    <DownloadableCard filename="budget-france-equivalences" shareTitle="Budget France — que représente 1 milliard" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Rendre les chiffres tangibles</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Ça représente quoi, {formatEurCompact(amount)} ?
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Conversions concrètes pour donner une idée de l'ordre de grandeur. Les coûts
            unitaires sont des moyennes publiques 2024-2025.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {preset("1 Md€", 1_000_000_000)}
        {deficitAmount && preset(`Déficit annuel (${formatEurCompact(deficitAmount)})`, deficitAmount)}
        {chargeDetteAmount && preset(`Intérêts de la dette (${formatEurCompact(chargeDetteAmount)})`, chargeDetteAmount)}
      </div>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Montant personnalisé (€)
        </label>
        <input
          type="number"
          value={amount}
          min={1_000_000}
          step={1_000_000_000}
          onChange={(e) => setAmount(Math.max(1_000_000, Number(e.target.value) || 0))}
          className="w-full md:max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono tabular-nums focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {EQUIVALENCES.map((eq) => {
          const count = Math.round(amount / eq.unitCost);
          return (
            <div key={eq.label} className="rounded-xl border border-slate-200 bg-white p-4 flex gap-3">
              <div className="text-3xl shrink-0">{eq.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl font-bold text-brand tabular-nums">
                  {count.toLocaleString("fr-FR")}
                </div>
                <div className="text-sm text-slate-700">{eq.unit}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {eq.label} · ~{formatEurCompact(eq.unitCost)}/unité
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Sources des coûts unitaires : Éducation nationale (rémunération enseignants), Ministère de la
        Santé (budget CH moyen), SNCF Réseau (coût LGV), Union sociale pour l'habitat (coût HLM),
        Direction générale de l'armement (prix Rafale), CNSA (place EHPAD), RTE (éolien offshore).
        Valeurs approximatives arrondies.
      </div>
    </DownloadableCard>
  );
}
