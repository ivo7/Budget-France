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
      return <SubComparaison ville={ville} villes={villes} />;
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
  // 3 mesures distinctes liées à la dette (toutes utiles, normes M14/OFGL) :
  //   - chargeDetteParHab = INTÉRÊTS annuels seuls (compte 661, charges fin.)
  //   - amortissementParHab = remboursement annuel du capital (compte 16)
  //   - serviceDetteParHab = annuité totale = intérêts + capital
  const chargeDetteParHab = lastYear.chargeDetteEur / ville.population;
  const amortissementParHab =
    (lastYear.amortissementCapitalEur ?? lastYear.detteEncoursEur / 15) / ville.population;
  const serviceDetteParHab = chargeDetteParHab + amortissementParHab;
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
          label="Intérêts dette / hab"
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

      {/* Décomposition pédagogique de la dette */}
      <section className="mt-4">
        <div className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-widest text-muted">
            🔍 Comprendre la dette de {ville.nom}
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
            3 façons de mesurer la dette par habitant
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Les 3 indicateurs ci-dessous sont tous justes — ils mesurent simplement
            des choses différentes. Selon les sources que tu lis ailleurs, tu trouveras
            l'un ou l'autre.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-flag-red/30 bg-red-50/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-flag-red font-semibold">
                Encours total
              </div>
              <div className="font-display text-2xl font-bold text-flag-red tabular-nums mt-1">
                {Math.round(detteParHab).toLocaleString("fr-FR")} €/hab
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Le <strong>capital total</strong> que la commune doit rembourser à terme.
                Montant divisé par la population.
              </p>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold">
                Intérêts annuels
              </div>
              <div className="font-display text-2xl font-bold text-amber-700 tabular-nums mt-1">
                {Math.round(chargeDetteParHab).toLocaleString("fr-FR")} €/hab
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Les <strong>seuls intérêts</strong> versés cette année (compte 661 M14).
                C'est la « charge financière » au sens OFGL/Cour des comptes.
              </p>
            </div>

            <div className="rounded-lg border border-purple-300 bg-purple-50/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-purple-700 font-semibold">
                Service annuel total
              </div>
              <div className="font-display text-2xl font-bold text-purple-700 tabular-nums mt-1">
                {Math.round(serviceDetteParHab).toLocaleString("fr-FR")} €/hab
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                <strong>Intérêts + remboursement du capital</strong>. C'est ce que la
                commune sort de sa caisse chaque année pour sa dette (annuité totale).
              </p>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            <strong>Note méthodologique :</strong> sur un emprunt typique sur 15 ans,
            chaque année la commune rembourse environ <code className="font-mono bg-slate-100 px-1 rounded">1/15</code>
            {" "}du capital + les intérêts du restant dû. C'est ce qu'on appelle l'<em>annuité</em>.
            Selon ce qu'on cherche à mesurer (poids comptable, sortie cash, ou stock total),
            on regarde l'un ou l'autre des 3 chiffres.
          </div>
        </div>
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

// ----------------------------------------------------------------------------
// Définition des indicateurs de comparaison
// Les indicateurs marqués "isManagement" sont les indicateurs de bonne gestion
// suivis par l'OFGL et la Cour des comptes.
// ----------------------------------------------------------------------------

interface RankingDef {
  id: string;
  label: string;
  shortLabel: string;
  unit: string;
  /** Vrai si c'est un indicateur clé de bonne gestion (OFGL/Cour des comptes). */
  isManagement: boolean;
  /** Vrai si une valeur élevée = défavorable (ex: dette, charges fin.). */
  higherIsBad: boolean;
  /** Description courte pour le citoyen. */
  description: string;
  /** Lecture par seuils (ex: "< 8 ans = sain"). */
  thresholds?: string;
  /** Calcul de la valeur pour une ville donnée (en unité affichée). */
  compute: (v: Ville) => number;
  /** Format d'affichage de la valeur. */
  format: (n: number) => string;
}

function lastYearOf(v: Ville) {
  return v.annees[v.annees.length - 1]!;
}

const RANKINGS: RankingDef[] = [
  // ── Indicateurs de bonne gestion (OFGL / Cour des comptes) ──────────────
  {
    id: "capacite-desendettement",
    label: "Capacité de désendettement",
    shortLabel: "Désendettement",
    unit: "années",
    isManagement: true,
    higherIsBad: true,
    description:
      "Nombre d'années théoriques pour rembourser la dette en consacrant la totalité de la CAF (capacité d'autofinancement). Indicateur N°1 des Chambres régionales des comptes.",
    thresholds: "< 8 ans = sain · 8-12 ans = vigilance · > 12 ans = critique",
    compute: (v) => {
      const last = lastYearOf(v);
      if (last.capaciteAutofinancementEur <= 0) return 999;
      return last.detteEncoursEur / last.capaciteAutofinancementEur;
    },
    format: (n) => (n >= 999 ? "∞" : `${n.toFixed(1)} ans`),
  },
  {
    id: "taux-epargne-brute",
    label: "Taux d'épargne brute",
    shortLabel: "Taux épargne",
    unit: "%",
    isManagement: true,
    higherIsBad: false,
    description:
      "Part des recettes que la commune épargne avant remboursement de dette. Mesure la marge financière disponible pour investir ou rembourser.",
    thresholds: "> 12 % = bon · 8-12 % = moyen · < 8 % = fragile",
    compute: (v) => {
      const last = lastYearOf(v);
      if (last.recettesTotalesEur <= 0) return 0;
      return (last.capaciteAutofinancementEur / last.recettesTotalesEur) * 100;
    },
    format: (n) => `${n.toFixed(1)} %`,
  },
  {
    id: "charges-personnel-pct",
    label: "Charges de personnel / dépenses",
    shortLabel: "Personnel %",
    unit: "%",
    isManagement: true,
    higherIsBad: true,
    description:
      "Part des dépenses consacrée aux salaires des fonctionnaires municipaux. Trop élevée = peu de marge pour investir ou faire face à des coups durs.",
    thresholds: "< 50 % = marge · 50-60 % = OK · > 60 % = peu de marge",
    compute: (v) => v.compositionDepenses.personnelPct,
    format: (n) => `${n.toFixed(1)} %`,
  },
  {
    id: "charges-financieres-pct",
    label: "Charges financières / dépenses",
    shortLabel: "Intérêts %",
    unit: "%",
    isManagement: true,
    higherIsBad: true,
    description:
      "Part des dépenses qui sert uniquement à payer les intérêts de la dette. Cet argent ne finance aucun service public — plus c'est bas, mieux c'est.",
    thresholds: "< 3 % = bon · > 5 % = poids notable",
    compute: (v) => v.compositionDepenses.chargesFinancieresPct,
    format: (n) => `${n.toFixed(1)} %`,
  },
  // ── Indicateurs absolus par habitant ────────────────────────────────────
  {
    id: "budget-hab",
    label: "Budget par habitant",
    shortLabel: "Budget/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: false,
    description: "Total dépensé par la commune divisé par sa population.",
    compute: (v) => lastYearOf(v).budgetTotalEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "dette-hab",
    label: "Encours de dette par habitant",
    shortLabel: "Dette/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: true,
    description: "Capital total de la dette ÷ population. Les enfants en font partie — ce sont eux qui rembourseront.",
    compute: (v) => lastYearOf(v).detteEncoursEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "interets-hab",
    label: "Intérêts annuels de la dette / hab",
    shortLabel: "Intérêts/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: true,
    description:
      "Charges financières annuelles seules (compte 661 M14). C'est le coût pur de l'endettement, hors remboursement du capital.",
    compute: (v) => lastYearOf(v).chargeDetteEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "service-dette-hab",
    label: "Service annuel de la dette / hab",
    shortLabel: "Service/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: true,
    description:
      "Annuité totale = intérêts + remboursement du capital. C'est le cash que la commune sort chaque année pour sa dette.",
    compute: (v) => {
      const last = lastYearOf(v);
      const amort = last.amortissementCapitalEur ?? last.detteEncoursEur / 15;
      return (last.chargeDetteEur + amort) / v.population;
    },
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "investissement-hab",
    label: "Investissement par habitant",
    shortLabel: "Invest/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: false,
    description:
      "Effort d'équipement (écoles, voirie, équipements sportifs, énergie). Une ville qui investit beaucoup prépare l'avenir mais peut s'endetter.",
    compute: (v) => lastYearOf(v).depensesInvestissementEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "personnel-hab",
    label: "Charges de personnel par habitant",
    shortLabel: "Personnel/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: false,
    description:
      "Coût du personnel municipal par habitant. Mesure le service public local rendu (mais aussi son coût).",
    compute: (v) => lastYearOf(v).depensesPersonnelEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
  {
    id: "caf-hab",
    label: "Capacité d'autofinancement / hab",
    shortLabel: "CAF/hab",
    unit: "€",
    isManagement: false,
    higherIsBad: false,
    description: "Marge disponible chaque année pour investir ou rembourser, par habitant.",
    compute: (v) => lastYearOf(v).capaciteAutofinancementEur / v.population,
    format: (n) => `${Math.round(n).toLocaleString("fr-FR")} €`,
  },
];

function SubComparaison({
  ville,
  villes,
}: {
  ville: Ville;
  villes: Ville[];
}) {
  const lastYear = ville.annees[ville.annees.length - 1]!;
  const villeSlug = slugify(ville.nom);

  // Pour chaque ranking, calcule la valeur de chaque ville et trie.
  const rankings = RANKINGS.map((r) => {
    const rows = villes
      .map((v) => ({
        slug: slugify(v.nom),
        nom: v.nom,
        value: r.compute(v),
      }))
      // Si "higherIsBad" : on trie ascending (le meilleur en premier = plus faible)
      // Sinon : on trie descending (le meilleur en premier = plus élevé)
      .sort((a, b) => (r.higherIsBad ? a.value - b.value : b.value - a.value));
    const myRank = rows.findIndex((row) => row.slug === villeSlug) + 1;
    const myValue = rows.find((row) => row.slug === villeSlug)?.value ?? 0;
    const median = computeMedian(rows.map((row) => row.value));
    return { def: r, rows, myRank, myValue, median };
  });

  return (
    <>
      <VilleHero ville={ville} lastYear={lastYear} subtitle="Comparaison — classements toutes villes" />
      <section className="mt-6">
        <SubPageLinks villeSlug={villeSlug} active="comparaison" />
      </section>

      {/* ───── Encadré pédagogique : indicateurs de bonne gestion ───── */}
      <section className="mt-4">
        <div className="card p-5 md:p-6 bg-amber-50/40 border-amber-200/60">
          <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
            🏛️ Indicateurs officiels de bonne gestion
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Comment mesurer si une commune est bien gérée ?
          </h2>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">
            L'<strong>OFGL</strong> (Observatoire des Finances Locales, adossé à la Cour des
            comptes) suit 4 indicateurs principaux pour évaluer la santé financière d'une
            commune : la <strong>capacité de désendettement</strong>, le <strong>taux
            d'épargne brute</strong>, les <strong>charges de personnel</strong> et les{" "}
            <strong>charges financières</strong>. Ces 4 indicateurs sont regroupés en haut
            du tableau ci-dessous (badge 🏛️).
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Source :{" "}
            <a
              href="https://www.collectivites-locales.gouv.fr/finances-locales"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Observatoire des Finances et de la Gestion publique Locales
            </a>{" "}
            · Référentiel des comptes communaux DGCL · Cour des comptes — rapports CRC.
          </p>
        </div>
      </section>

      {/* ───── Synthèse position ──────────────────────────────────── */}
      <section className="mt-4">
        <div className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-widest text-muted">
            Synthèse {ville.nom} — résumé sur {villes.length} villes
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Position de {ville.nom} dans les classements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {rankings.map((r) => (
              <div
                key={r.def.id}
                className={`p-3 rounded-lg border ${
                  r.def.isManagement
                    ? "border-amber-300 bg-amber-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {r.def.isManagement && <span className="text-xs">🏛️</span>}
                  <span className="text-[10px] uppercase tracking-widest text-muted leading-tight">
                    {r.def.shortLabel}
                  </span>
                </div>
                <div className="font-display text-lg font-bold tabular-nums text-slate-900">
                  {r.def.format(r.myValue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  rang {r.myRank} / {villes.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Classements détaillés (un par indicateur) ──────────── */}
      {rankings.map((r) => (
        <section key={r.def.id} className="mt-4">
          <DownloadableCard
            filename={`classement-${r.def.id}-${villeSlug}`}
            className={`card p-5 md:p-6 ${
              r.def.isManagement ? "border-amber-200 bg-amber-50/20" : ""
            }`}
            getCsvData={() =>
              objectsToCsv(
                r.rows.map((row, i) => ({
                  rang: i + 1,
                  ville: row.nom,
                  [r.def.id]: r.def.format(row.value),
                })),
              )
            }
          >
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              {r.def.isManagement && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider font-medium">
                  🏛️ Indicateur de bonne gestion
                </span>
              )}
              <span className="text-xs uppercase tracking-widest text-muted">
                {r.def.unit}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {r.def.label}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {r.def.description}
            </p>
            {r.def.thresholds && (
              <p className="text-xs text-amber-800 mt-1 font-mono bg-amber-50 inline-block px-2 py-0.5 rounded">
                {r.def.thresholds}
              </p>
            )}

            {/* Position en bandeau */}
            <div className="mt-3 p-3 rounded-lg bg-brand-soft/30 border border-brand/15">
              <div className="text-sm">
                <strong>{ville.nom}</strong> :{" "}
                <span className="font-semibold text-brand">{r.def.format(r.myValue)}</span>
                {" — rang "}
                <strong>{r.myRank}<sup>e</sup></strong> sur {villes.length}.
                {" Médiane : "}
                <span className="text-slate-700">{r.def.format(r.median)}</span>.
                {r.def.higherIsBad
                  ? r.myValue < r.median
                    ? <span className="text-money"> ✓ Mieux que la médiane</span>
                    : <span className="text-flag-red"> ✗ Plus élevé que la médiane</span>
                  : r.myValue > r.median
                    ? <span className="text-money"> ✓ Mieux que la médiane</span>
                    : <span className="text-flag-red"> ✗ Plus faible que la médiane</span>
                }
              </div>
            </div>

            {/* Tableau classement */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
                  <tr>
                    <th className="text-left p-2 w-12">#</th>
                    <th className="text-left p-2">Ville</th>
                    <th className="text-right p-2">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row, i) => {
                    const isCurrent = row.slug === villeSlug;
                    return (
                      <tr
                        key={row.slug}
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
                            <span className="text-brand">
                              {row.nom} ← votre ville
                            </span>
                          ) : (
                            <a
                              href={`#/villes/${row.slug}`}
                              className="text-slate-800 hover:text-brand hover:underline"
                            >
                              {row.nom}
                            </a>
                          )}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {r.def.format(row.value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DownloadableCard>
        </section>
      ))}

      <ChartCitizenImpact
        text={
          <>
            <strong>Comparer entre villes a ses limites.</strong> Une ville touristique
            (Paris, Nice) a plus de recettes mais aussi plus de charges (sécurité, propreté,
            transports). Une ville étudiante (Montpellier, Toulouse) investit plus dans
            l'enseignement supérieur. Cependant, les <strong>4 indicateurs de bonne
            gestion</strong> (capacité de désendettement, taux d'épargne, charges de
            personnel et financières) sont calculés selon les normes officielles OFGL et
            <strong> sont comparables d'une ville à l'autre</strong> à structure équivalente.
          </>
        }
      />
    </>
  );
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
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

// ----------------------------------------------------------------------------
// Classification officielle des communes
// Sources :
//   - OFGL (Observatoire des Finances Locales) — strates démographiques
//     utilisées pour comparer les budgets
//   - Loi MAPTAM 2014 + Loi NOTRe 2015 — statuts administratifs (métropoles)
// ----------------------------------------------------------------------------

interface Classification {
  /** Strate démographique OFGL (taille). */
  strate: string;
  strateColor: string;
  /** Statut administratif si applicable (métropole, etc.). */
  statut?: string;
}

// 22 métropoles statutaires françaises (loi MAPTAM 2014 / NOTRe 2015).
// Code INSEE de la commune-centre.
const METROPOLES_STATUTAIRES: Record<string, string> = {
  "75056": "Métropole du Grand Paris",
  "13055": "Métropole d'Aix-Marseille-Provence",
  "69123": "Métropole de Lyon",
  "31555": "Métropole de Toulouse",
  "59350": "Métropole Européenne de Lille",
  "33063": "Métropole de Bordeaux",
  "06088": "Métropole Nice Côte d'Azur",
  "44109": "Nantes Métropole",
  "67482": "Eurométropole de Strasbourg",
  "34172": "Montpellier Méditerranée Métropole",
  "35238": "Rennes Métropole",
  "76540": "Métropole Rouen Normandie",
  "38185": "Grenoble-Alpes Métropole",
  "83137": "Métropole Toulon-Provence-Méditerranée",
  "29019": "Brest Métropole",
  "63113": "Clermont Auvergne Métropole",
  "21231": "Dijon Métropole",
  "42218": "Saint-Étienne Métropole",
  "37261": "Tours Métropole Val de Loire",
  "45234": "Orléans Métropole",
  "57463": "Metz Métropole",
  "54395": "Métropole du Grand Nancy",
};

function classifyVille(codeInsee: string, population: number): Classification {
  // Strate démographique (OFGL — utilisée pour comparer les budgets entre villes)
  let strate: string;
  let strateColor: string;
  if (population < 500) {
    strate = "Très petite commune";
    strateColor = "bg-slate-100 text-slate-700 border-slate-200";
  } else if (population < 2_000) {
    strate = "Petite commune";
    strateColor = "bg-slate-100 text-slate-700 border-slate-200";
  } else if (population < 10_000) {
    strate = "Commune moyenne";
    strateColor = "bg-slate-100 text-slate-700 border-slate-200";
  } else if (population < 20_000) {
    strate = "Grande commune";
    strateColor = "bg-blue-50 text-brand border-blue-200";
  } else if (population < 50_000) {
    strate = "Très grande commune";
    strateColor = "bg-blue-50 text-brand border-blue-200";
  } else if (population < 100_000) {
    strate = "Petite ville";
    strateColor = "bg-blue-50 text-brand border-blue-200";
  } else if (population < 200_000) {
    strate = "Grande ville";
    strateColor = "bg-amber-50 text-amber-700 border-amber-300";
  } else if (population < 500_000) {
    strate = "Très grande ville";
    strateColor = "bg-amber-50 text-amber-800 border-amber-400";
  } else {
    strate = "Métropole démographique";
    strateColor = "bg-red-50 text-flag-red border-red-300";
  }

  const statut = METROPOLES_STATUTAIRES[codeInsee];

  return { strate, strateColor, statut };
}

function VilleHero({
  ville,
  lastYear,
  subtitle,
}: {
  ville: Ville;
  lastYear: Ville["annees"][number];
  subtitle: string;
}) {
  const classif = classifyVille(ville.codeInsee, ville.population);
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

        {/* Classification officielle (strate démographique + statut métropole) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full border uppercase tracking-wider font-medium ${classif.strateColor}`}
            title="Strate démographique OFGL — utilisée pour comparer les budgets entre villes de taille équivalente"
          >
            🏛️ {classif.strate}
          </span>
          {classif.statut && (
            <span
              className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-300 uppercase tracking-wider font-medium"
              title="Statut administratif — Loi MAPTAM 2014 / NOTRe 2015"
            >
              ⭐ {classif.statut}
            </span>
          )}
        </div>
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
