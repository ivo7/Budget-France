// ============================================================================
// MaVillePage — dashboard budgétaire grand public par commune
// ============================================================================
//
// Permet à un citoyen de rechercher sa ville et de voir :
//   - Population + grands KPIs (budget/hab, dette/hab, charge dette)
//   - Évolution recettes / dépenses sur 10 ans
//   - Évolution dette
//   - Composition recettes (donut)
//   - Composition dépenses (donut)
//   - Comparaison avec moyenne nationale (badge bleu/rouge)
//
// Cible : grand public, pas expert. UI simple, vocabulaire accessible.
//
// Phase 1 (actuel) : 20 plus grandes villes par population, données estimées
// 2014-2024. Phase 2 prévue : import automatique depuis data.gouv.fr.
// ============================================================================

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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
import { formatEurCompact } from "../lib/format";
import { DownloadableCard } from "./DownloadableCard";
import { ChartCitizenImpact } from "./ChartCitizenImpact";
import { objectsToCsv, timeseriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

type Ville = NonNullable<BudgetSnapshot["villes"]>["items"][number];

// Couleurs pour les graphes
const COLOR_RECETTES = ["#0055A4", "#16a34a", "#7c3aed", "#d97706", "#64748b"];
const COLOR_DEPENSES = ["#EF4135", "#0055A4", "#7c3aed", "#d97706", "#16a34a"];

export function MaVillePage({ data }: Props) {
  const villes = data.villes?.items ?? [];
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ville | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return villes.slice(0, 8);
    const q = search.toLowerCase().trim();
    return villes
      .filter((v) => v.nom.toLowerCase().includes(q) || v.codeInsee.startsWith(q))
      .slice(0, 8);
  }, [villes, search]);

  // Moyennes nationales calculées sur les villes du seed (proxy de référence)
  const moyennes = useMemo(() => calcMoyennes(villes), [villes]);

  if (!data.villes || villes.length === 0) {
    return (
      <section className="mt-6">
        <div className="card p-6 text-sm text-slate-600">
          Données communales indisponibles. Régénère le snapshot :{" "}
          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
            docker compose run --rm pipeline
          </code>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Budget par commune</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Le budget de ma ville
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Trouve ta commune et découvre <strong>combien elle dépense</strong>, <strong>d'où
          vient son argent</strong> et <strong>comment elle se compare</strong> à la moyenne
          des autres grandes villes françaises.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <span aria-hidden="true">⚠</span>
          Phase 1 — données pour les <strong>{villes.length} plus grandes villes</strong>{" "}
          uniquement. Toutes les communes en Phase 2.
        </div>
      </section>

      {/* Barre de recherche */}
      <section className="mt-6">
        <div className="card p-5 md:p-6">
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Recherche ta ville (parmi {villes.length} disponibles)
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Paris, Marseille, Lyon… ou code postal"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {/* Suggestions */}
          {(search.trim() || !selected) && (
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filtered.length === 0 ? (
                <li className="col-span-full text-sm text-slate-500 italic">
                  Aucune ville ne correspond à « {search} ». Phase 1 limitée aux 20 plus
                  grandes villes — Paris, Marseille, Lyon, Toulouse, Nice, Nantes,
                  Montpellier, Strasbourg, Bordeaux, Lille, Rennes…
                </li>
              ) : (
                filtered.map((v) => (
                  <li key={v.codeInsee}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(v);
                        setSearch("");
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected?.codeInsee === v.codeInsee
                          ? "bg-brand-soft border-brand text-brand"
                          : "bg-white border-slate-200 hover:border-brand/40 hover:bg-brand-soft/30"
                      }`}
                    >
                      <div className="font-display font-semibold text-slate-900">
                        {v.nom}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {v.departement} · {v.population.toLocaleString("fr-FR")} hab.
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </section>

      {selected && (
        <VilleDashboard ville={selected} moyennes={moyennes} sourceLabel={data.villes!.source.label} />
      )}

      {!selected && (
        <section className="mt-6">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-3" aria-hidden="true">🔍</div>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Sélectionne une ville ci-dessus pour découvrir son budget, sa dette et la
              composition de ses recettes/dépenses.
            </p>
          </div>
        </section>
      )}
    </>
  );
}

// ============================================================================
// Dashboard d'une ville sélectionnée
// ============================================================================

interface Moyennes {
  budgetParHabitant: number;
  detteParHabitant: number;
  chargeDetteParHabitant: number;
  cafParHabitant: number;
}

function VilleDashboard({
  ville,
  moyennes,
  sourceLabel,
}: {
  ville: Ville;
  moyennes: Moyennes;
  sourceLabel: string;
}) {
  const lastYear = ville.annees[ville.annees.length - 1]!;

  const budgetParHab = lastYear.budgetTotalEur / ville.population;
  const detteParHab = lastYear.detteEncoursEur / ville.population;
  const chargeDetteParHab = lastYear.chargeDetteEur / ville.population;
  const cafParHab = lastYear.capaciteAutofinancementEur / ville.population;

  // Données pour les graphes
  const evolutionRecettesDepenses = ville.annees.map((a) => ({
    annee: a.annee,
    Recettes: Math.round(a.recettesTotalesEur / 1e6), // M€
    Dépenses: Math.round(a.depensesTotalesEur / 1e6),
    Investissement: Math.round(a.depensesInvestissementEur / 1e6),
  }));

  const evolutionDette = ville.annees.map((a) => ({
    date: `${a.annee}-12-31`,
    value: a.detteEncoursEur,
  }));

  const recettesData = [
    { name: "Impôts locaux", value: ville.compositionRecettes.impotsLocauxPct },
    { name: "Dotations État", value: ville.compositionRecettes.dotationsEtatPct },
    { name: "Subventions", value: ville.compositionRecettes.subventionsPct },
    { name: "Services (cantine, piscine…)", value: ville.compositionRecettes.recettesServicesPct },
    { name: "Autres", value: ville.compositionRecettes.autresPct },
  ];

  const depensesData = [
    { name: "Personnel", value: ville.compositionDepenses.personnelPct },
    { name: "Charges générales", value: ville.compositionDepenses.chargesGeneralesPct },
    { name: "Subventions versées", value: ville.compositionDepenses.subventionsVerseesPct },
    { name: "Charges financières (intérêts)", value: ville.compositionDepenses.chargesFinancieresPct },
    { name: "Investissement", value: ville.compositionDepenses.investissementPct },
  ];

  return (
    <>
      {/* Hero ville */}
      <section className="mt-6">
        <div className="card p-5 md:p-6 bg-brand-soft/30 border-brand/20">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-widest text-brand">Ville sélectionnée</span>
            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              INSEE {ville.codeInsee}
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mt-1">
            {ville.nom}
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            {ville.departement} · <strong>{ville.population.toLocaleString("fr-FR")}</strong> habitants ·
            Budget total {(lastYear.budgetTotalEur / 1e6).toFixed(0)} M€ ({lastYear.annee})
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Budget par habitant"
          value={`${Math.round(budgetParHab).toLocaleString("fr-FR")} €`}
          comparison={budgetParHab - moyennes.budgetParHabitant}
          color="text-brand"
        />
        <KpiCard
          label="Dette par habitant"
          value={`${Math.round(detteParHab).toLocaleString("fr-FR")} €`}
          comparison={detteParHab - moyennes.detteParHabitant}
          color="text-flag-red"
          higherIsBad
        />
        <KpiCard
          label="Charge dette / hab"
          value={`${Math.round(chargeDetteParHab).toLocaleString("fr-FR")} €`}
          comparison={chargeDetteParHab - moyennes.chargeDetteParHabitant}
          color="text-amber-700"
          higherIsBad
        />
        <KpiCard
          label="Capacité autofinancement"
          value={`${Math.round(cafParHab).toLocaleString("fr-FR")} €/hab`}
          comparison={cafParHab - moyennes.cafParHabitant}
          color="text-money"
        />
      </section>

      {/* Évolution recettes / dépenses */}
      <section className="mt-6">
        <DownloadableCard
          filename={`budget-${slugify(ville.nom)}-evolution`}
          shareTitle={`Budget France — ${ville.nom} 2014-2024`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(ville.annees.map((a) => ({
            annee: a.annee,
            recettes_eur: a.recettesTotalesEur,
            depenses_eur: a.depensesTotalesEur,
            solde_eur: a.soldeBudgetaireEur,
            investissement_eur: a.depensesInvestissementEur,
            personnel_eur: a.depensesPersonnelEur,
            dette_eur: a.detteEncoursEur,
            caf_eur: a.capaciteAutofinancementEur,
          })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Évolution sur 10 ans</div>
          <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Recettes, dépenses et investissement — {ville.nom}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            En millions d'euros. Les recettes et dépenses se suivent de près (règle d'or : pas de
            déficit de fonctionnement). L'investissement varie selon les mandats électoraux.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionRecettesDepenses} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} M€`} width={60} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} M€`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
                <Bar dataKey="Recettes" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Dépenses" fill="#EF4135" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Investissement" fill="#0055A4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DownloadableCard>
      </section>

      {/* Évolution dette */}
      <section className="mt-4">
        <DownloadableCard
          filename={`dette-${slugify(ville.nom)}`}
          shareTitle={`Budget France — Dette ${ville.nom}`}
          className="card p-5 md:p-6"
          getCsvData={() => timeseriesToCsv(evolutionDette, "dette_eur")}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Encours de dette</div>
          <h3 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Dette de {ville.nom} sur 10 ans
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Encours total de la dette communale en euros, fin d'année. Une commune peut emprunter
            <strong> uniquement pour investir</strong> (règle d'or), pas pour payer son fonctionnement courant.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionDette.map((p) => ({ annee: new Date(p.date).getUTCFullYear(), dette: p.value / 1e6 }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} M€`} width={60} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} M€`, "Dette"]} />
                <Line type="monotone" dataKey="dette" stroke="#EF4135" strokeWidth={3} dot={{ r: 3, fill: "#EF4135" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DownloadableCard>
      </section>

      {/* Composition recettes / dépenses */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DownloadableCard
          filename={`recettes-${slugify(ville.nom)}`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(recettesData.map((r) => ({ poste: r.name, part_pourcent: r.value })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">D'où vient l'argent</div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
            Composition des recettes
          </h3>
          <CompoChart data={recettesData} colors={COLOR_RECETTES} />
        </DownloadableCard>

        <DownloadableCard
          filename={`depenses-${slugify(ville.nom)}`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(depensesData.map((r) => ({ poste: r.name, part_pourcent: r.value })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Où va l'argent</div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
            Composition des dépenses
          </h3>
          <CompoChart data={depensesData} colors={COLOR_DEPENSES} />
        </DownloadableCard>
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>Sur 100 € versés par {ville.nom} en dépenses</strong> : ~{ville.compositionDepenses.personnelPct} €
            en salaires des fonctionnaires municipaux, ~{ville.compositionDepenses.investissementPct} € en
            investissements (écoles, voirie, équipements), et ~{ville.compositionDepenses.chargesFinancieresPct} €
            en intérêts de la dette. Cette dernière part, plus elle est élevée, moins ta ville
            peut investir dans tes services publics.
          </>
        }
      />

      <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Source : {sourceLabel}. Données estimées 2014-2024 calibrées sur les comptes administratifs publics.
        Pour les chiffres officiels au centime près, consulte le compte administratif de {ville.nom}{" "}
        ou{" "}
        <a
          href="https://www.data.gouv.fr/fr/datasets/comptes-individuels-des-collectivites/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          data.gouv.fr
        </a>.
      </div>
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function calcMoyennes(villes: Ville[]): Moyennes {
  if (villes.length === 0) {
    return { budgetParHabitant: 0, detteParHabitant: 0, chargeDetteParHabitant: 0, cafParHabitant: 0 };
  }
  const sum = villes.reduce(
    (acc, v) => {
      const last = v.annees[v.annees.length - 1]!;
      return {
        budget: acc.budget + last.budgetTotalEur / v.population,
        dette: acc.dette + last.detteEncoursEur / v.population,
        chargeDette: acc.chargeDette + last.chargeDetteEur / v.population,
        caf: acc.caf + last.capaciteAutofinancementEur / v.population,
      };
    },
    { budget: 0, dette: 0, chargeDette: 0, caf: 0 },
  );
  return {
    budgetParHabitant: sum.budget / villes.length,
    detteParHabitant: sum.dette / villes.length,
    chargeDetteParHabitant: sum.chargeDette / villes.length,
    cafParHabitant: sum.caf / villes.length,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function KpiCard({
  label,
  value,
  comparison,
  color,
  higherIsBad = false,
}: {
  label: string;
  value: string;
  comparison: number;
  color: string;
  higherIsBad?: boolean;
}) {
  const isAbove = comparison > 0;
  const isFavorable = higherIsBad ? !isAbove : isAbove;
  const arrow = isAbove ? "↑" : "↓";
  const compColor = isFavorable ? "text-money" : "text-flag-red";
  const pct = Math.abs(Math.round(comparison));

  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-xl md:text-2xl font-bold tabular-nums mt-1 ${color}`}>
        {value}
      </div>
      <div className={`text-[11px] mt-1 ${compColor}`}>
        {arrow} {pct} € vs moy. nationale
      </div>
    </div>
  );
}

function CompoChart({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <div className="mt-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} %`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-3 h-3 rounded shrink-0"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="flex-1 text-slate-700">{d.name}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{d.value} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
