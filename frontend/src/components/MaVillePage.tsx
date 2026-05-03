// ============================================================================
// MaVillePage — sous-site dédié à une commune (multi-sub-tabs)
// ============================================================================
//
// Quand on est dans le contexte ville (#/villes/[slug]/...), le Header se
// transforme en « Budget [Ville] » et affiche les sub-tabs ci-dessous.
//
// Sub-tabs :
//   - synthese : KPIs + résumé visuel
//   - recettes : composition + évolution des recettes
//   - depenses : composition + évolution des dépenses
//   - historique : recettes/dépenses/dette/CAF sur 10 ans
//   - comparaison : vs strate + moyenne nationale
//   - sources : transparence des données
//
// Phase 1 (MVP) : 20 plus grandes villes, données estimées 2014-2024.
// Phase 2 prévue : import automatique data.gouv.fr pour 100+ villes.
// ============================================================================

import { useMemo } from "react";
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
import { DownloadableCard } from "./DownloadableCard";
import { ChartCitizenImpact } from "./ChartCitizenImpact";
import { objectsToCsv, timeseriesToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
  subPage:
    | "ville-synthese"
    | "ville-recettes"
    | "ville-depenses"
    | "ville-historique"
    | "ville-comparaison"
    | "ville-sources"
    // Le composant accepte aussi les autres pages mais elles ne sont pas
    // censées arriver ici (rendu null) — typage large pour faciliter la prop.
    | string;
  villeSlug: string | null;
}

type Ville = NonNullable<BudgetSnapshot["villes"]>["items"][number];

const COLOR_RECETTES = ["#0055A4", "#16a34a", "#7c3aed", "#d97706", "#64748b"];
const COLOR_DEPENSES = ["#EF4135", "#0055A4", "#7c3aed", "#d97706", "#16a34a"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MaVillePage({ data, subPage, villeSlug }: Props) {
  const villes = data.villes?.items ?? [];

  // Tous les hooks DOIVENT être appelés avant les early returns (rules of hooks).
  const ville = useMemo(() => {
    if (!villeSlug) return null;
    return villes.find((v) => slugify(v.nom) === villeSlug) ?? null;
  }, [villes, villeSlug]);

  const moyennes = useMemo(() => calcMoyennes(villes), [villes]);

  if (!data.villes || villes.length === 0) {
    return (
      <section className="mt-6">
        <div className="card p-6 text-sm text-slate-600">
          Données communales indisponibles. Régénère le snapshot.
        </div>
      </section>
    );
  }

  if (!ville) {
    return (
      <section className="mt-6">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3" aria-hidden="true">🏛️</div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Ville inconnue
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Le slug « {villeSlug} » ne correspond à aucune ville disponible.
            Utilise la <strong>loupe en haut à droite</strong> pour rechercher
            une autre commune.
          </p>
        </div>
      </section>
    );
  }

  // Calculs partagés entre sub-pages
  const lastYear = ville.annees[ville.annees.length - 1]!;

  // Aiguillage selon sub-page
  switch (subPage) {
    case "ville-recettes":
      return <SubRecettes ville={ville} lastYear={lastYear} sourceLabel={data.villes.source.label} />;
    case "ville-depenses":
      return <SubDepenses ville={ville} lastYear={lastYear} sourceLabel={data.villes.source.label} />;
    case "ville-historique":
      return <SubHistorique ville={ville} sourceLabel={data.villes.source.label} />;
    case "ville-comparaison":
      return <SubComparaison ville={ville} villes={villes} moyennes={moyennes} />;
    case "ville-sources":
      return <SubSources ville={ville} sourceLabel={data.villes.source.label} />;
    case "ville-synthese":
    default:
      return <SubSynthese ville={ville} lastYear={lastYear} moyennes={moyennes} sourceLabel={data.villes.source.label} />;
  }
}

// ============================================================================
// SubSynthese — vue d'ensemble (page par défaut)
// ============================================================================

interface Moyennes {
  budgetParHabitant: number;
  detteParHabitant: number;
  chargeDetteParHabitant: number;
  cafParHabitant: number;
}

function SubSynthese({
  ville,
  lastYear,
  moyennes,
  sourceLabel,
}: {
  ville: Ville;
  lastYear: Ville["annees"][number];
  moyennes: Moyennes;
  sourceLabel: string;
}) {
  const budgetParHab = lastYear.budgetTotalEur / ville.population;
  const detteParHab = lastYear.detteEncoursEur / ville.population;
  const chargeDetteParHab = lastYear.chargeDetteEur / ville.population;
  const cafParHab = lastYear.capaciteAutofinancementEur / ville.population;

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Synthèse — vue d'ensemble" />

      {/* KPIs avec comparaison nationale */}
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

      {/* Liens vers les sub-pages */}
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="synthese" />
      </section>

      {/* 2 donuts compacts (recettes + dépenses) */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompoCard
          ville={ville}
          mode="recettes"
          colors={COLOR_RECETTES}
        />
        <CompoCard
          ville={ville}
          mode="depenses"
          colors={COLOR_DEPENSES}
        />
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>Dans {ville.nom}, {Math.round(budgetParHab).toLocaleString("fr-FR")} €
            par an et par habitant</strong> sont consacrés au budget communal. Sur ces 100 €,
            ~{ville.compositionDepenses.personnelPct} € paient les fonctionnaires municipaux,
            ~{ville.compositionDepenses.investissementPct} € financent les investissements
            (écoles, voirie, équipements), ~{ville.compositionDepenses.chargesFinancieresPct} €
            servent à payer les intérêts de la dette communale.
          </>
        }
      />

      <SourceFooter sourceLabel={sourceLabel} ville={ville.nom} />
    </>
  );
}

// ============================================================================
// SubRecettes
// ============================================================================

function SubRecettes({
  ville,
  lastYear,
  sourceLabel,
}: {
  ville: Ville;
  lastYear: Ville["annees"][number];
  sourceLabel: string;
}) {
  const recettesData = [
    { name: "Impôts locaux", value: ville.compositionRecettes.impotsLocauxPct },
    { name: "Dotations État", value: ville.compositionRecettes.dotationsEtatPct },
    { name: "Subventions", value: ville.compositionRecettes.subventionsPct },
    { name: "Services (cantine, piscine…)", value: ville.compositionRecettes.recettesServicesPct },
    { name: "Autres", value: ville.compositionRecettes.autresPct },
  ];

  const evolutionRecettes = ville.annees.map((a) => ({
    annee: a.annee,
    Recettes: Math.round(a.recettesTotalesEur / 1e6),
  }));

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Recettes — d'où vient l'argent" />
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="recettes" />
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`recettes-${slugify(ville.nom)}-composition`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(recettesData.map((r) => ({ poste: r.name, part_pourcent: r.value })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Composition</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            D'où vient l'argent de {ville.nom} ({lastYear.annee})
          </h2>
          <CompoChart data={recettesData} colors={COLOR_RECETTES} />
        </DownloadableCard>
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`recettes-${slugify(ville.nom)}-evolution`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(evolutionRecettes.map((e) => ({ annee: e.annee, recettes_milliards: e.Recettes })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Évolution 2014 → 2024</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Recettes totales sur 10 ans
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionRecettes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} M€`} width={60} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} M€`, "Recettes"]} />
                <Bar dataKey="Recettes" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DownloadableCard>
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>~{ville.compositionRecettes.impotsLocauxPct}% des recettes</strong> de {ville.nom}
            viennent de tes impôts locaux directs (taxe foncière, taxe d'habitation sur résidences
            secondaires, CFE pour les entreprises). Le reste vient principalement des dotations versées
            par l'État (~{ville.compositionRecettes.dotationsEtatPct}%) qui dépendent du budget national
            voté chaque année.
          </>
        }
      />
      <SourceFooter sourceLabel={sourceLabel} ville={ville.nom} />
    </>
  );
}

// ============================================================================
// SubDepenses
// ============================================================================

function SubDepenses({
  ville,
  lastYear,
  sourceLabel,
}: {
  ville: Ville;
  lastYear: Ville["annees"][number];
  sourceLabel: string;
}) {
  const depensesData = [
    { name: "Personnel", value: ville.compositionDepenses.personnelPct },
    { name: "Charges générales", value: ville.compositionDepenses.chargesGeneralesPct },
    { name: "Subventions versées", value: ville.compositionDepenses.subventionsVerseesPct },
    { name: "Charges financières (intérêts)", value: ville.compositionDepenses.chargesFinancieresPct },
    { name: "Investissement", value: ville.compositionDepenses.investissementPct },
  ];

  const evolutionDepensesData = ville.annees.map((a) => ({
    annee: a.annee,
    "Fonctionnement": Math.round((a.depensesTotalesEur - a.depensesInvestissementEur) / 1e6),
    "Investissement": Math.round(a.depensesInvestissementEur / 1e6),
  }));

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Dépenses — où va l'argent" />
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="depenses" />
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`depenses-${slugify(ville.nom)}-composition`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(depensesData.map((r) => ({ poste: r.name, part_pourcent: r.value })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Composition</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Où va l'argent de {ville.nom} ({lastYear.annee})
          </h2>
          <CompoChart data={depensesData} colors={COLOR_DEPENSES} />
        </DownloadableCard>
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`depenses-${slugify(ville.nom)}-evolution`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(evolutionDepensesData)}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Évolution 2014 → 2024</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Fonctionnement vs Investissement
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Le fonctionnement (salaires, énergie, fournitures) reste stable d'une année à l'autre.
            L'investissement varie selon les mandats électoraux et les grands projets.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionDepensesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} M€`} width={60} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} M€`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
                <Bar dataKey="Fonctionnement" stackId="d" fill="#EF4135" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Investissement" stackId="d" fill="#0055A4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DownloadableCard>
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>{ville.compositionDepenses.personnelPct}% des dépenses</strong> servent à payer
            les fonctionnaires municipaux qui assurent les services publics que tu utilises au
            quotidien (école, propreté, espaces verts, sport, culture). Si la ville réduit ses
            dépenses de personnel, ce sont ces services qui sont impactés.
          </>
        }
      />
      <SourceFooter sourceLabel={sourceLabel} ville={ville.nom} />
    </>
  );
}

// ============================================================================
// SubHistorique
// ============================================================================

function SubHistorique({
  ville,
  sourceLabel,
}: {
  ville: Ville;
  sourceLabel: string;
}) {
  const lastYear = ville.annees[ville.annees.length - 1]!;
  const evolutionRecettesDepenses = ville.annees.map((a) => ({
    annee: a.annee,
    Recettes: Math.round(a.recettesTotalesEur / 1e6),
    Dépenses: Math.round(a.depensesTotalesEur / 1e6),
    Investissement: Math.round(a.depensesInvestissementEur / 1e6),
  }));
  const evolutionDette = ville.annees.map((a) => ({
    date: `${a.annee}-12-31`,
    value: a.detteEncoursEur,
  }));
  const evolutionCaf = ville.annees.map((a) => ({
    annee: a.annee,
    CAF: Math.round(a.capaciteAutofinancementEur / 1e6),
  }));

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Historique — évolution sur 10 ans" />
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="historique" />
      </section>

      <section className="mt-4">
        <div className="card p-4 bg-amber-50/50 border border-amber-200/60 text-xs text-slate-700 leading-relaxed">
          <strong className="text-amber-800">Pourquoi 2014-2024 et pas 1945 comme le national ?</strong>
          <br />
          Les comptes individuels DGFiP par commune sont publiés depuis 1996, mais ne sont
          systématiquement complets et harmonisés que depuis 2014. Avant cette date, les comptes
          existent mais ne sont pas tous dans data.gouv.fr. La Phase 2 du projet permettra d'aller
          plus loin dans le passé pour les villes qui ont publié leurs archives.
        </div>
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`historique-${slugify(ville.nom)}`}
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
            charge_dette_eur: a.chargeDetteEur,
          })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Recettes / Dépenses / Investissement</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Évolution budgétaire 2014 → 2024
          </h2>
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

      <section className="mt-4">
        <DownloadableCard
          filename={`dette-${slugify(ville.nom)}`}
          className="card p-5 md:p-6"
          getCsvData={() => timeseriesToCsv(evolutionDette, "dette_eur")}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Encours de dette</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Dette {ville.nom} sur 10 ans
          </h2>
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

      <section className="mt-4">
        <DownloadableCard
          filename={`caf-${slugify(ville.nom)}`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(evolutionCaf.map((e) => ({ annee: e.annee, caf_milliards: e.CAF })))}
        >
          <div className="text-xs uppercase tracking-widest text-muted">Capacité d'autofinancement</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            CAF {ville.nom} sur 10 ans
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            La CAF, c'est ce qu'il reste à la commune après avoir payé son fonctionnement
            quotidien — l'argent libre qu'elle peut consacrer à l'investissement ou au
            remboursement de la dette. Plus elle est élevée, plus la ville est financièrement saine.
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionCaf} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} M€`} width={60} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} M€`, "CAF"]} />
                <Bar dataKey="CAF" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DownloadableCard>
      </section>

      <SourceFooter sourceLabel={sourceLabel} ville={ville.nom} />
    </>
  );
}

// ============================================================================
// SubComparaison
// ============================================================================

function SubComparaison({
  ville,
  villes,
  moyennes,
}: {
  ville: Ville;
  villes: Ville[];
  moyennes: Moyennes;
}) {
  const lastYear = ville.annees[ville.annees.length - 1]!;
  const budgetParHab = lastYear.budgetTotalEur / ville.population;

  // Top 5 villes les plus chères / les moins chères en budget/hab
  const allWithBudget = villes
    .map((v) => {
      const last = v.annees[v.annees.length - 1]!;
      return {
        nom: v.nom,
        slug: slugify(v.nom),
        budgetParHab: last.budgetTotalEur / v.population,
        detteParHab: last.detteEncoursEur / v.population,
      };
    })
    .sort((a, b) => b.budgetParHab - a.budgetParHab);

  const myRank = allWithBudget.findIndex((v) => v.slug === slugify(ville.nom)) + 1;

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Comparaison — vs autres villes" />
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="comparaison" />
      </section>

      <section className="mt-4">
        <div className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-widest text-muted">Position</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
            {ville.nom} se classe {myRank}<sup>e</sup> sur {allWithBudget.length} villes
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Pour le <strong>budget par habitant</strong> ({Math.round(budgetParHab).toLocaleString("fr-FR")} €/hab),
            soit {Math.abs(Math.round(budgetParHab - moyennes.budgetParHabitant)).toLocaleString("fr-FR")} €
            {budgetParHab > moyennes.budgetParHabitant ? " au-dessus" : " en dessous"} de la moyenne
            des {villes.length} plus grandes villes ({Math.round(moyennes.budgetParHabitant).toLocaleString("fr-FR")} €/hab).
          </p>
        </div>
      </section>

      <section className="mt-4">
        <DownloadableCard
          filename={`classement-budget-${slugify(ville.nom)}`}
          className="card p-5 md:p-6"
          getCsvData={() => objectsToCsv(allWithBudget.map((v, i) => ({
            rang: i + 1,
            ville: v.nom,
            budget_par_habitant_eur: Math.round(v.budgetParHab),
            dette_par_habitant_eur: Math.round(v.detteParHab),
          })))}
        >
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
            Classement budget par habitant
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="text-left p-2">Rang</th>
                  <th className="text-left p-2">Ville</th>
                  <th className="text-right p-2">Budget/hab</th>
                  <th className="text-right p-2">Dette/hab</th>
                </tr>
              </thead>
              <tbody>
                {allWithBudget.map((v, i) => {
                  const isCurrent = v.slug === slugify(ville.nom);
                  return (
                    <tr
                      key={v.slug}
                      className={`border-t border-slate-100 ${
                        isCurrent ? "bg-brand-soft/30 font-semibold" : ""
                      }`}
                    >
                      <td className="p-2 tabular-nums">
                        <span className={isCurrent ? "text-brand" : "text-slate-500"}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-2">
                        {isCurrent ? (
                          <span className="text-brand">{v.nom} ← votre ville</span>
                        ) : (
                          <a
                            href={`#/villes/${v.slug}`}
                            className="text-slate-800 hover:text-brand hover:underline"
                          >
                            {v.nom}
                          </a>
                        )}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {Math.round(v.budgetParHab).toLocaleString("fr-FR")} €
                      </td>
                      <td className="p-2 text-right tabular-nums text-slate-600">
                        {Math.round(v.detteParHab).toLocaleString("fr-FR")} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DownloadableCard>
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>Comparer entre villes a ses limites.</strong> Une ville touristique
            (Paris, Nice) a plus de recettes mais aussi plus de charges (sécurité, propreté,
            transports). Une ville étudiante (Montpellier, Toulouse) investit plus dans
            l'enseignement supérieur. Le « bon » niveau de dépenses dépend du contexte local.
            Mais des écarts importants à services équivalents méritent toujours d'être questionnés.
          </>
        }
      />
    </>
  );
}

// ============================================================================
// SubSources
// ============================================================================

function SubSources({
  ville,
  sourceLabel,
}: {
  ville: Ville;
  sourceLabel: string;
}) {
  const lastYear = ville.annees[ville.annees.length - 1]!;

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Sources — d'où viennent les données" />
      <section className="mt-6">
        <SubPageLinks villeSlug={slugify(ville.nom)} active="sources" />
      </section>

      <section className="mt-4">
        <div className="card p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Origine des données pour {ville.nom}
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Toutes les données financières des collectivités françaises sont publiques et
            accessibles librement. Voici les sources officielles utilisées pour construire
            cette page :
          </p>

          <ol className="mt-5 space-y-4">
            <li className="border-l-4 border-brand pl-4">
              <div className="font-display font-semibold text-slate-900">
                1. DGFiP — Comptes individuels des collectivités
              </div>
              <div className="text-xs text-slate-500 mt-1">Source primaire</div>
              <p className="text-sm text-slate-700 mt-1.5">
                Chaque commune française publie son compte administratif annuel via la
                Direction Générale des Finances Publiques. Ces données sont compilées et
                rendues téléchargeables en CSV par data.gouv.fr.
              </p>
              <a
                href="https://www.data.gouv.fr/fr/datasets/comptes-individuels-des-collectivites/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs mt-2 text-brand hover:underline"
              >
                data.gouv.fr/comptes-individuels-des-collectivites →
              </a>
            </li>

            <li className="border-l-4 border-money pl-4">
              <div className="font-display font-semibold text-slate-900">
                2. INSEE — Populations légales
              </div>
              <p className="text-sm text-slate-700 mt-1.5">
                Les populations utilisées (millésime récent) viennent du recensement annuel
                INSEE. Permettent de calculer les ratios par habitant.
              </p>
              <a
                href="https://www.insee.fr/fr/statistiques/series/108070841"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs mt-2 text-brand hover:underline"
              >
                insee.fr/populations-legales →
              </a>
            </li>

            <li className="border-l-4 border-purple-500 pl-4">
              <div className="font-display font-semibold text-slate-900">
                3. OFGL — Observatoire des Finances Locales
              </div>
              <p className="text-sm text-slate-700 mt-1.5">
                Adossé à la Cour des comptes. Fournit des analyses comparatives entre
                villes (ratios par strate, indicateurs financiers de référence).
              </p>
              <a
                href="https://data.ofgl.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs mt-2 text-brand hover:underline"
              >
                data.ofgl.fr →
              </a>
            </li>

            <li className="border-l-4 border-amber-500 pl-4">
              <div className="font-display font-semibold text-slate-900">
                4. Compte administratif de {ville.nom}
              </div>
              <p className="text-sm text-slate-700 mt-1.5">
                Pour les chiffres officiels au centime près, le mieux est de consulter
                directement le compte administratif voté chaque année par le conseil municipal.
                Disponible sur le site de la mairie.
              </p>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-slate-700 leading-relaxed">
            <strong className="text-amber-800">⚠ Phase 1 — données estimées</strong>
            <br />
            Les chiffres affichés ici sont des <strong>estimations calibrées</strong> sur
            les ordres de grandeur publics issus des sources ci-dessus pour les 20 plus
            grandes villes françaises. Une <strong>Phase 2</strong> est prévue pour
            brancher un connecteur automatique vers data.gouv.fr et avoir les chiffres
            exacts mis à jour automatiquement chaque année.
            <br /><br />
            Pour une décision (achat immobilier, investissement, communication officielle),
            consulte impérativement les sources primaires.
          </div>
        </div>
      </section>

      <SourceFooter sourceLabel={sourceLabel} ville={ville.nom} />
    </>
  );
}

// ============================================================================
// Helpers UI
// ============================================================================

function VilleHero({
  ville,
  lastYear,
  subtitle,
}: {
  ville: Ville;
  lastYear: Ville["annees"][number];
  subtitle: string;
}) {
  return (
    <section className="mt-6">
      <div className="card p-5 md:p-6 bg-brand-soft/30 border-brand/20">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-widest text-brand">{subtitle}</span>
          <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            INSEE {ville.codeInsee}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Budget {ville.nom}
        </h1>
        <p className="text-sm text-slate-700 mt-1">
          {ville.departement} · <strong>{ville.population.toLocaleString("fr-FR")}</strong> habitants ·
          Budget {(lastYear.budgetTotalEur / 1e6).toFixed(0)} M€ ({lastYear.annee})
        </p>
      </div>
    </section>
  );
}

function SubPageLinks({
  villeSlug,
  active,
}: {
  villeSlug: string;
  active: "synthese" | "recettes" | "depenses" | "historique" | "comparaison" | "sources";
}) {
  const tabs = [
    { id: "synthese", label: "Synthèse", href: `#/villes/${villeSlug}` },
    { id: "recettes", label: "Recettes", href: `#/villes/${villeSlug}/recettes` },
    { id: "depenses", label: "Dépenses", href: `#/villes/${villeSlug}/depenses` },
    { id: "historique", label: "Historique", href: `#/villes/${villeSlug}/historique` },
    { id: "comparaison", label: "Comparaison", href: `#/villes/${villeSlug}/comparaison` },
    { id: "sources", label: "Sources", href: `#/villes/${villeSlug}/sources` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 -mx-1">
      {tabs.map((t) => (
        <a
          key={t.id}
          href={t.href}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
            t.id === active
              ? "bg-brand text-white border-brand shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand"
          }`}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}

function CompoCard({
  ville,
  mode,
  colors,
}: {
  ville: Ville;
  mode: "recettes" | "depenses";
  colors: string[];
}) {
  const data =
    mode === "recettes"
      ? [
          { name: "Impôts locaux", value: ville.compositionRecettes.impotsLocauxPct },
          { name: "Dotations État", value: ville.compositionRecettes.dotationsEtatPct },
          { name: "Subventions", value: ville.compositionRecettes.subventionsPct },
          { name: "Services", value: ville.compositionRecettes.recettesServicesPct },
          { name: "Autres", value: ville.compositionRecettes.autresPct },
        ]
      : [
          { name: "Personnel", value: ville.compositionDepenses.personnelPct },
          { name: "Charges générales", value: ville.compositionDepenses.chargesGeneralesPct },
          { name: "Subventions versées", value: ville.compositionDepenses.subventionsVerseesPct },
          { name: "Charges financières", value: ville.compositionDepenses.chargesFinancieresPct },
          { name: "Investissement", value: ville.compositionDepenses.investissementPct },
        ];

  return (
    <DownloadableCard
      filename={`${mode}-${slugify(ville.nom)}-compo`}
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv(data.map((r) => ({ poste: r.name, part_pourcent: r.value })))}
    >
      <div className="text-xs uppercase tracking-widest text-muted">
        {mode === "recettes" ? "D'où vient l'argent" : "Où va l'argent"}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
        {mode === "recettes" ? "Composition des recettes" : "Composition des dépenses"}
      </h3>
      <CompoChart data={data} colors={colors} />
    </DownloadableCard>
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

function SourceFooter({ sourceLabel, ville }: { sourceLabel: string; ville: string }) {
  return (
    <div className="mt-6 text-[11px] text-slate-500 leading-relaxed">
      Source : {sourceLabel}. Données estimées 2014-2024 calibrées sur les comptes administratifs publics.
      Pour les chiffres officiels au centime près de {ville}, consulte le compte administratif communal
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
  );
}

// ============================================================================
// Helpers calc
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
