// ============================================================================
// MesImpotsSimulator — v2 « Mon impôt va vraiment où ? »
// ============================================================================
//
// Simulateur pédagogique qui montre TOUS les prélèvements payés par un
// contribuable français et où ils vont. Pas seulement l'IR — aussi les
// cotisations sociales (salariales + patronales), la CSG/CRDS, la TVA,
// la TICPE et la taxe foncière.
//
// L'idée : passer de « budget abstrait de 580 Md€ » à « sur tes 30 K€ de
// salaire net, l'État + la Sécu + ta commune ont touché 27 K€ ».
//
// Bercy avait fait ce calculateur en 2014, puis l'a abandonné. C'est un
// angle mort majeur de la pédagogie sur les finances publiques française.
// ============================================================================

import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { BudgetSnapshot } from "../types";
import { formatEurCompact } from "../lib/format";
import {
  simulateAll,
  allocateAcrossMissions,
  allocateSecu,
  allocateTaxeFonciere,
} from "../lib/taxSimulator";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

// Couleurs dédiées par destinataire pour cohérence pie + listes
const COLOR_ETAT = "#0055A4";       // Bleu (drapeau)
const COLOR_SECU = "#16a34a";       // Vert (santé)
const COLOR_UNEDIC = "#7c3aed";     // Violet (chômage)
const COLOR_COMMUNE = "#d97706";    // Orange (local)

const PARTS_OPTIONS = [
  { value: 1, label: "Célibataire (1 part)" },
  { value: 1.5, label: "Célibataire + 1 enfant (1,5 part)" },
  { value: 2, label: "Couple sans enfant (2 parts)" },
  { value: 2.5, label: "Couple + 1 enfant (2,5 parts)" },
  { value: 3, label: "Couple + 2 enfants (3 parts)" },
  { value: 3.5, label: "Couple + 3 enfants (3,5 parts)" },
  { value: 4, label: "Couple + 4 enfants ou + (4 parts)" },
];

export function MesImpotsSimulator({ data }: Props) {
  const [monthlyNet, setMonthlyNet] = useState<number>(2500);
  const [parts, setParts] = useState<number>(1);
  const [proprietaire, setProprietaire] = useState<boolean>(false);

  const r = useMemo(
    () => simulateAll({ monthlyNet, parts, proprietaire }),
    [monthlyNet, parts, proprietaire],
  );

  const missionsLFI = data.repartition?.depenses ?? [];
  const allocEtat = useMemo(
    () => allocateAcrossMissions(r.totalEtat, missionsLFI),
    [r.totalEtat, missionsLFI],
  );
  const allocSecu = useMemo(() => allocateSecu(r.totalSecu), [r.totalSecu]);
  const allocFonciere = useMemo(
    () => allocateTaxeFonciere(r.totalCommune),
    [r.totalCommune],
  );

  // Données pour le pie chart « grand total »
  const pieData = [
    { name: "Sécurité sociale", value: r.totalSecu, color: COLOR_SECU },
    { name: "État (IR + TVA…)", value: r.totalEtat, color: COLOR_ETAT },
    { name: "Unédic (chômage)", value: r.totalUnedic, color: COLOR_UNEDIC },
    { name: "Commune (foncier)", value: r.totalCommune, color: COLOR_COMMUNE },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      {/* ───────── Bloc input ───────── */}
      <DownloadableCard
        filename="mes-impots-simulation"
        shareTitle="Budget France — Où vont mes impôts ?"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv([
            { poste: "Salaire mensuel net (€)", valeur: monthlyNet },
            { poste: "Salaire annuel net (€)", valeur: Math.round(r.annualNet) },
            { poste: "Salaire annuel brut estimé (€)", valeur: Math.round(r.annualGross) },
            { poste: "Coût employeur (super-brut) (€)", valeur: Math.round(r.annualSuperBrut) },
            { poste: "Parts fiscales", valeur: parts },
            { poste: "Propriétaire", valeur: proprietaire ? "oui" : "non" },
            { poste: "Cotisations salariales (€)", valeur: Math.round(r.cotisSal) },
            { poste: "Cotisations patronales (€)", valeur: Math.round(r.cotisPat) },
            { poste: "CSG/CRDS (€)", valeur: Math.round(r.csgcrds) },
            { poste: "Impôt sur le revenu (€)", valeur: Math.round(r.ir) },
            { poste: "TVA estimée (€)", valeur: Math.round(r.tva) },
            { poste: "TICPE et autres taxes indirectes (€)", valeur: Math.round(r.ticpeEtAutres) },
            { poste: "Taxe foncière (€)", valeur: Math.round(r.taxeFonciere) },
            { poste: "Total État (€)", valeur: Math.round(r.totalEtat) },
            { poste: "Total Sécu hors chômage (€)", valeur: Math.round(r.totalSecu) },
            { poste: "Total Unédic (€)", valeur: Math.round(r.totalUnedic) },
            { poste: "Total Commune (€)", valeur: Math.round(r.totalCommune) },
            { poste: "GRAND TOTAL prélèvements (€)", valeur: Math.round(r.totalGrand) },
            { poste: "Taux sur net touché (%)", valeur: (r.effectiveRateSurNet * 100).toFixed(1) },
            { poste: "Taux sur super-brut (%)", valeur: (r.effectiveRateSurSuperBrut * 100).toFixed(1) },
          ])
        }
      >
        <div className="text-xs uppercase tracking-widest text-muted">
          Simulateur pédagogique — v2
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 mt-1">
          Où vont vraiment tes impôts ?
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Renseigne ton salaire et ta situation. Le simulateur calcule TOUS les
          prélèvements (impôts directs, indirects, cotisations, CSG, taxe foncière)
          et te montre comment ils sont ventilés entre l'État, la Sécu, Unédic et
          ta commune. Calcul simplifié à des fins pédagogiques.
        </p>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Salaire net mensuel */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-1">
              Salaire mensuel net (€)
            </label>
            <input
              type="number"
              value={monthlyNet}
              min={0}
              max={50000}
              step={50}
              onChange={(e) =>
                setMonthlyNet(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-semibold tabular-nums focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <input
              type="range"
              min={500}
              max={15000}
              step={50}
              value={Math.min(monthlyNet, 15000)}
              onChange={(e) => setMonthlyNet(Number(e.target.value))}
              className="w-full mt-2 accent-brand"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Annuel net : {formatEurCompact(r.annualNet)} · Brut estimé :{" "}
              {formatEurCompact(r.annualGross)} · Coût employeur :{" "}
              <strong>{formatEurCompact(r.annualSuperBrut)}</strong>
            </div>
          </div>

          {/* Parts fiscales */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-1">
              Parts fiscales
            </label>
            <select
              value={parts}
              onChange={(e) => setParts(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {PARTS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Avec quotient familial et plafonnement légal de l'avantage
              (1 759 €/demi-part).
            </div>
          </div>

          {/* Propriétaire / locataire */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-1">
              Logement
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProprietaire(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  !proprietaire
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
                }`}
              >
                Locataire
              </button>
              <button
                type="button"
                onClick={() => setProprietaire(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  proprietaire
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
                }`}
              >
                Propriétaire
              </button>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {proprietaire
                ? "Taxe foncière estimée à la moyenne nationale (985 €/an)"
                : "Pas de taxe foncière prise en compte"}
            </div>
          </div>
        </div>

        {/* Bandeau résultat hero */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            Total prélèvements payés ou pris en ton nom (par an)
          </div>
          <div className="font-display text-4xl md:text-5xl font-bold text-slate-900 tabular-nums mt-1">
            {formatEurCompact(r.totalGrand)}
          </div>
          <div className="text-sm text-slate-700 mt-2 leading-relaxed">
            Soit <strong>{(r.effectiveRateSurNet * 100).toFixed(0)} %</strong> de ton
            salaire net touché — ou{" "}
            <strong>{(r.effectiveRateSurSuperBrut * 100).toFixed(0)} %</strong> de ce
            que ton employeur dépense pour te payer (
            <span className="text-slate-500">le « vrai » coût total</span>).
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            <strong>Tu ne vois pas tout :</strong> les cotisations patronales (
            {formatEurCompact(r.cotisPat)}) sont payées par ton employeur EN PLUS
            de ton brut, mais c'est de l'argent qui aurait pu aller dans ta poche
            si la France avait moins de prélèvements. La CSG/CRDS et tes cotisations
            salariales ({formatEurCompact(r.cotisSal + r.csgcrds)}) sont déduites de
            ton brut avant que tu ne touches ton net.
          </p>
        </div>
      </DownloadableCard>

      {/* ───────── Pie chart 4 grands destinataires ───────── */}
      <DownloadableCard
        filename="mes-impots-destinataires"
        shareTitle="Budget France — Où vont mes prélèvements"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            pieData.map((d) => ({
              destinataire: d.name,
              montant_eur: Math.round(d.value),
              part_pourcent: ((d.value / r.totalGrand) * 100).toFixed(2),
            })),
          )
        }
      >
        <div className="text-xs uppercase tracking-widest text-muted">
          Répartition par destinataire
        </div>
        <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
          Tes {formatEurCompact(r.totalGrand)} se répartissent ainsi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-4">
          {/* Pie chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry: { name: string; value: number }) =>
                    `${((entry.value / r.totalGrand) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatEurCompact(value),
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Liste détaillée */}
          <ul className="space-y-3">
            <DestinataireRow
              color={COLOR_SECU}
              label="Sécurité sociale"
              hint="Maladie, retraite, famille, autonomie, AT/MP, CADES, formation"
              value={r.totalSecu}
              total={r.totalGrand}
            />
            <DestinataireRow
              color={COLOR_ETAT}
              label="État (budget général)"
              hint={`IR ${formatEurCompact(r.ir)} + TVA ${formatEurCompact(r.tva)} + TICPE ${formatEurCompact(r.ticpeEtAutres)}`}
              value={r.totalEtat}
              total={r.totalGrand}
            />
            <DestinataireRow
              color={COLOR_UNEDIC}
              label="Unédic"
              hint="Allocation chômage versée par France Travail"
              value={r.totalUnedic}
              total={r.totalGrand}
            />
            {r.totalCommune > 0 && (
              <DestinataireRow
                color={COLOR_COMMUNE}
                label="Ta commune et ses partenaires"
                hint="Taxe foncière (commune, EPCI, département)"
                value={r.totalCommune}
                total={r.totalGrand}
              />
            )}
          </ul>
        </div>
      </DownloadableCard>

      {/* ───────── Détail Sécu par branche ───────── */}
      <DownloadableCard
        filename="mes-impots-secu"
        shareTitle="Budget France — Mes cotisations Sécu par branche"
        className="card p-5 md:p-6 border-emerald-200 bg-emerald-50/20"
        getCsvData={() =>
          objectsToCsv(
            allocSecu.map((b) => ({
              branche: b.categorie,
              contribution_eur: Math.round(b.contribution),
              part_pourcent: (b.part * 100).toFixed(2),
            })),
          )
        }
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_SECU }} />
          <span className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
            Détail Sécu — {formatEurCompact(r.totalSecu)}/an
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-900 mt-1.5">
          Tes cotisations Sécu par branche
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Cotisations salariales, patronales et CSG sont mutualisées et redistribuées
          entre les 5 branches de la Sécu (hors Unédic, géré séparément en paritaire).
        </p>

        <ul className="mt-4 space-y-2.5">
          {allocSecu.map((b) => (
            <li key={b.categorie}>
              <div className="flex items-center justify-between gap-3 text-sm mb-1">
                <span className="text-slate-800 font-medium truncate">{b.categorie}</span>
                <span className="tabular-nums text-slate-500 shrink-0">
                  <span className="font-semibold text-slate-900">
                    {formatEurCompact(b.contribution)}
                  </span>
                  <span className="ml-1.5">({(b.part * 100).toFixed(1)} %)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, b.part * 100)}%` }}
                />
              </div>
              {b.description && (
                <div className="text-[11px] text-slate-500 mt-0.5">{b.description}</div>
              )}
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* ───────── Détail État par mission LFI ───────── */}
      <DownloadableCard
        filename="mes-impots-etat-missions"
        shareTitle="Budget France — Mes impôts État par mission"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            allocEtat.map((m) => ({
              mission: m.categorie,
              contribution_eur: Math.round(m.contribution),
              part_pourcent: (m.part * 100).toFixed(2),
            })),
          )
        }
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_ETAT }} />
          <span className="text-xs uppercase tracking-widest text-brand font-semibold">
            Détail État — {formatEurCompact(r.totalEtat)}/an
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-900 mt-1.5">
          Tes impôts État par mission budgétaire
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Répartis au prorata de la LFI{" "}
          {data.repartition?.annee ?? data.annee} des dépenses du budget général
          de l'État. Inclut éducation, défense, justice, intérêts de la dette,
          écologie, etc.
        </p>

        {allocEtat.length === 0 ? (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
            Données LFI non disponibles. Régénère le pipeline.
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {allocEtat.map((m) => (
              <li key={m.categorie}>
                <div className="flex items-center justify-between gap-3 text-sm mb-1">
                  <span className="text-slate-800 truncate">{m.categorie}</span>
                  <span className="tabular-nums text-slate-500 shrink-0">
                    <span className="font-semibold text-slate-900">
                      {formatEurCompact(m.contribution)}
                    </span>
                    <span className="ml-1.5">({(m.part * 100).toFixed(1)} %)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: COLOR_ETAT,
                      width: `${Math.max(2, Math.min(100, m.part * 100 * 5))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DownloadableCard>

      {/* ───────── Détail taxe foncière (si propriétaire) ───────── */}
      {proprietaire && r.totalCommune > 0 && (
        <DownloadableCard
          filename="mes-impots-fonciere"
          shareTitle="Budget France — Ma taxe foncière"
          className="card p-5 md:p-6 border-orange-200 bg-orange-50/20"
          getCsvData={() =>
            objectsToCsv(
              allocFonciere.map((f) => ({
                destinataire: f.categorie,
                contribution_eur: Math.round(f.contribution),
                part_pourcent: (f.part * 100).toFixed(2),
              })),
            )
          }
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: COLOR_COMMUNE }}
            />
            <span className="text-xs uppercase tracking-widest text-orange-700 font-semibold">
              Détail taxe foncière — {formatEurCompact(r.totalCommune)}/an
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mt-1.5">
            Ta taxe foncière par destinataire
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Estimation moyenne nationale (985 €/an). Le montant réel dépend
            fortement de ta commune et de la valeur cadastrale de ton bien.
          </p>

          <ul className="mt-4 space-y-2.5">
            {allocFonciere.map((f) => (
              <li key={f.categorie}>
                <div className="flex items-center justify-between gap-3 text-sm mb-1">
                  <span className="text-slate-800 font-medium truncate">
                    {f.categorie}
                  </span>
                  <span className="tabular-nums text-slate-500 shrink-0">
                    <span className="font-semibold text-slate-900">
                      {formatEurCompact(f.contribution)}
                    </span>
                    <span className="ml-1.5">({(f.part * 100).toFixed(1)} %)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, f.part * 100)}%` }}
                  />
                </div>
                {f.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {f.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </DownloadableCard>
      )}

      {/* ───────── Hypothèses & limites ───────── */}
      <div className="card p-5 md:p-6 bg-slate-50/50 border-slate-200">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Hypothèses du calcul
        </div>
        <ul className="mt-2 text-xs text-slate-600 space-y-1 leading-relaxed">
          <li>
            • <strong>Net → Brut</strong> : taux moyen non-cadre 22 % (cotisations
            salariales). Pour un cadre, le brut serait ~3 % plus élevé.
          </li>
          <li>
            • <strong>Cotisations patronales</strong> : 35 % du brut (moyenne France).
            Varie de 30 % (PME, exonération bas salaires) à 42 % (cadre grande entreprise).
          </li>
          <li>
            • <strong>CSG/CRDS</strong> : 9,7 % du brut (9,2 % CSG + 0,5 % CRDS).
          </li>
          <li>
            • <strong>IR 2024</strong> : barème officiel à 5 tranches, abattement 10 %
            (plafond 14 171 €), quotient familial avec plafonnement (1 759 €/demi-part).
          </li>
          <li>
            • <strong>TVA</strong> : 7 % du revenu net (taux effectif moyen pondéré
            consommation INSEE). <strong>TICPE et autres taxes</strong> : 1 %.
          </li>
          <li>
            • <strong>Taxe foncière</strong> : 985 €/an (moyenne nationale 2024).
            Le montant réel varie de 200 € à 3 000 € selon commune et bien.
          </li>
          <li>
            • <strong>Non pris en compte</strong> : niches fiscales, revenus du capital,
            crédits d'impôt, taxes locales spécifiques (TEOM, taxe d'habitation
            résidence secondaire), redevance audiovisuelle (supprimée 2022).
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-3 italic">
          Calcul à des fins pédagogiques. Pour ton imposition réelle :{" "}
          <a
            href="https://www.impots.gouv.fr/simulateurs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            simulateur officiel impots.gouv.fr
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function DestinataireRow({
  color,
  label,
  hint,
  value,
  total,
}: {
  color: string;
  label: string;
  hint?: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <li>
      <div className="flex items-center gap-2 text-sm mb-1">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: color }}
        />
        <span className="font-semibold text-slate-900 flex-1 truncate">{label}</span>
        <span className="tabular-nums text-slate-500 text-xs shrink-0">
          <span className="font-semibold text-slate-900">
            {formatEurCompact(value)}
          </span>
          <span className="ml-1.5">({pct.toFixed(0)} %)</span>
        </span>
      </div>
      {hint && (
        <div className="text-[11px] text-slate-500 ml-5 leading-relaxed">{hint}</div>
      )}
    </li>
  );
}
