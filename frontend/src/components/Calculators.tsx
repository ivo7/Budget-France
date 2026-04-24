import { useState } from "react";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Trois calculatrices interactives pédagogiques :
 *   1. Coût d'une hausse de l'OAT 10 ans (sensibilité)
 *   2. Temps de remboursement de la dette avec un solde primaire donné
 *   3. Stabilisation du ratio dette/PIB (formule simplifiée)
 *
 * Cible : lycéens (SES), prépa HEC, Sciences Po, fac éco/droit.
 * Les formules restent simples pour rester pédagogiques.
 */
export function Calculators({ data }: Props) {
  const detteActuelle = data.dettePublique.value;
  const pibActuel = data.pib.value;
  const oatActuel = data.tauxOat10ans.value;
  const chargeActuelle =
    data.compositionHistorique?.depenses.find((c) => c.id === "dette")?.points.slice(-1)[0]?.value ??
    0;

  return (
    <div className="space-y-4">
      <SensibiliteOat detteActuelle={detteActuelle} oatActuel={oatActuel} chargeActuelle={chargeActuelle} />
      <TempsRemboursement detteActuelle={detteActuelle} />
      <StabilisationRatio detteActuelle={detteActuelle} pibActuel={pibActuel} oatActuel={oatActuel} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Sensibilité : hausse OAT → coût supplémentaire
// ---------------------------------------------------------------------------

function SensibiliteOat({
  detteActuelle,
  oatActuel,
  chargeActuelle,
}: {
  detteActuelle: number;
  oatActuel: number;
  chargeActuelle: number;
}) {
  const [deltaOat, setDeltaOat] = useState(1);

  // Approximation : la dette est refinancée à la nouvelle OAT en N ans.
  // Sur la 1re année, l'impact est limité (seulement les nouvelles émissions).
  // À long terme (≈ 8 ans de maturité moyenne OAT), tout le stock est concerné.
  const impact1An = detteActuelle * (deltaOat / 100) * 0.125;       // 1/8 du stock refinancé
  const impactLongTerme = detteActuelle * (deltaOat / 100);
  const nouvelleCharge = chargeActuelle + impactLongTerme;

  return (
    <DownloadableCard
      filename="calc-oat-sensibilite"
      shareTitle="Budget France — calculatrice OAT"
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv([
        { parametre: "dette_actuelle_eur", valeur: detteActuelle },
        { parametre: "oat_actuel_pourcent", valeur: oatActuel },
        { parametre: "delta_oat_points", valeur: deltaOat },
        { parametre: "surcout_1ere_annee_eur", valeur: Math.round(impact1An) },
        { parametre: "surcout_long_terme_eur", valeur: Math.round(impactLongTerme) },
        { parametre: "charge_actuelle_eur", valeur: chargeActuelle },
        { parametre: "nouvelle_charge_eur", valeur: Math.round(nouvelleCharge) },
      ])}
    >
      <div className="text-xs uppercase tracking-widest text-muted">Calculatrice 1</div>
      <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
        Si l'OAT 10 ans monte de X points, combien ça coûte ?
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
        Test pédagogique de la sensibilité de la dette aux variations de taux.
        Maturité moyenne OAT ~8 ans : 1/8ᵉ du stock est refinancé chaque année.
      </p>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Hausse du taux OAT : <strong className="text-brand tabular-nums">+{deltaOat.toFixed(2)} pt</strong>
          <span className="text-slate-500 ml-2">(soit un passage de {oatActuel.toFixed(2)} % → {(oatActuel + deltaOat).toFixed(2)} %)</span>
        </label>
        <input
          type="range"
          min={0}
          max={5}
          step={0.25}
          value={deltaOat}
          onChange={(e) => setDeltaOat(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Surcoût 1ʳᵉ année" value={formatEurCompact(impact1An)} color="text-brand" sub="~1/8 du stock refinancé" />
        <Stat label="Surcoût long terme" value={formatEurCompact(impactLongTerme)} color="text-flag-red" sub="quand tout le stock a roulé" />
        <Stat label="Nouvelle charge annuelle" value={formatEurCompact(nouvelleCharge)} color="text-slate-900" sub={`vs ${formatEurCompact(chargeActuelle)} actuellement`} />
      </div>
    </DownloadableCard>
  );
}

// ---------------------------------------------------------------------------
// 2. Temps de remboursement
// ---------------------------------------------------------------------------

function TempsRemboursement({ detteActuelle }: { detteActuelle: number }) {
  const [soldePrimaire, setSoldePrimaire] = useState(0); // Md€/an

  const soldeAbs = Math.abs(soldePrimaire);
  const years = soldeAbs > 0 ? detteActuelle / 1e9 / soldeAbs : Infinity;

  return (
    <DownloadableCard
      filename="calc-temps-remboursement"
      shareTitle="Budget France — temps de remboursement"
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv([
        { parametre: "dette_actuelle_eur", valeur: detteActuelle },
        { parametre: "solde_primaire_milliards_par_an", valeur: soldePrimaire },
        { parametre: "delai_annees", valeur: soldePrimaire <= 0 ? "Infini (dette croît)" : Math.round(years) },
      ])}
    >
      <div className="text-xs uppercase tracking-widest text-muted">Calculatrice 2</div>
      <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
        Combien d'années pour rembourser la dette ?
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
        Avec un excédent primaire annuel donné (recettes − dépenses hors intérêts),
        combien d'années pour ramener la dette à zéro, sans croissance ni inflation.
        Simplification volontaire.
      </p>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Excédent primaire annuel : <strong className="text-brand tabular-nums">{soldePrimaire > 0 ? "+" : ""}{soldePrimaire} Md€/an</strong>
        </label>
        <input
          type="range"
          min={-50}
          max={200}
          step={5}
          value={soldePrimaire}
          onChange={(e) => setSoldePrimaire(Number(e.target.value))}
          className="w-full accent-brand"
        />
        <div className="text-[10px] text-slate-500 mt-1">
          Repère : la France affiche un solde primaire ~−100 Md€ en 2024 (déficit hors intérêts).
          Pour rembourser la dette, il faudrait au contraire dégager un EXCÉDENT primaire.
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Stat
          label="Dette actuelle"
          value={formatEurCompact(detteActuelle)}
          color="text-flag-red"
        />
        <Stat
          label="Délai théorique"
          value={
            soldePrimaire <= 0
              ? "Impossible (dette ↗)"
              : years > 500 ? "> 500 ans"
              : `${Math.round(years)} ans`
          }
          color={soldePrimaire <= 0 ? "text-flag-red" : "text-money"}
          sub={soldePrimaire <= 0 ? "Dette augmente" : `Excédent : ${soldePrimaire} Md€/an`}
        />
      </div>
    </DownloadableCard>
  );
}

// ---------------------------------------------------------------------------
// 3. Stabilisation du ratio dette/PIB
// ---------------------------------------------------------------------------

function StabilisationRatio({
  detteActuelle,
  pibActuel,
  oatActuel,
}: {
  detteActuelle: number;
  pibActuel: number;
  oatActuel: number;
}) {
  const [croissance, setCroissance] = useState(1.5); // % PIB nominal
  const ratio = (detteActuelle / pibActuel) * 100;

  // Formule : ΔRatio = ratio × (r − g) / (1 + g) + solde_primaire_negatif / PIB
  // Pour la stabilisation : solde_primaire_requis = dette × (r − g)
  // (forme simplifiée ; r = taux, g = croissance nominale)
  const r = oatActuel / 100;
  const g = croissance / 100;
  const effetBouleNeige = ratio * (r - g); // en % de PIB
  const soldeStabilisant = (r - g) * detteActuelle; // en €

  return (
    <DownloadableCard
      filename="calc-stabilisation-ratio"
      shareTitle="Budget France — stabilisation dette/PIB"
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv([
        { parametre: "dette_actuelle_eur", valeur: detteActuelle },
        { parametre: "pib_actuel_eur", valeur: pibActuel },
        { parametre: "ratio_dette_pib_pourcent", valeur: ratio.toFixed(2) },
        { parametre: "taux_oat_pourcent", valeur: oatActuel },
        { parametre: "croissance_pib_pourcent", valeur: croissance },
        { parametre: "effet_boule_neige_pts_pib", valeur: effetBouleNeige.toFixed(3) },
        { parametre: "solde_primaire_stabilisant_eur", valeur: Math.round(soldeStabilisant) },
      ])}
    >
      <div className="text-xs uppercase tracking-widest text-muted">Calculatrice 3</div>
      <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
        Effet boule de neige : stabiliser le ratio dette / PIB
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
        Si le taux d'intérêt réel (r) est supérieur à la croissance du PIB (g),
        le ratio dette/PIB augmente mécaniquement, même avec un budget équilibré.
        C'est l'<em>effet boule de neige</em>. Formule simplifiée.
      </p>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Croissance PIB nominal annuelle (g) :{" "}
          <strong className="text-brand tabular-nums">+{croissance.toFixed(1)} %</strong>
          <span className="text-slate-500 ml-2">(taux nominal OAT r = {oatActuel.toFixed(2)} %)</span>
        </label>
        <input
          type="range"
          min={-2}
          max={6}
          step={0.1}
          value={croissance}
          onChange={(e) => setCroissance(Number(e.target.value))}
          className="w-full accent-brand"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat
          label="Ratio actuel dette/PIB"
          value={`${ratio.toFixed(1)} %`}
          color="text-slate-900"
        />
        <Stat
          label="Effet boule de neige"
          value={`${effetBouleNeige >= 0 ? "+" : ""}${effetBouleNeige.toFixed(2)} pts PIB/an`}
          color={effetBouleNeige > 0 ? "text-flag-red" : "text-money"}
          sub={effetBouleNeige > 0 ? "Ratio augmente spontanément" : "Ratio baisse spontanément"}
        />
        <Stat
          label="Solde primaire stabilisant"
          value={formatEurCompact(Math.max(0, soldeStabilisant))}
          color="text-brand"
          sub="Excédent nécessaire pour figer le ratio"
        />
      </div>
    </DownloadableCard>
  );
}

// ---------------------------------------------------------------------------

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
