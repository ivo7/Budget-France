import { useEffect, useMemo, useRef, useState } from "react";
import { useBudgetData } from "./hooks/useBudgetData";
import { useHashRoute } from "./hooks/useHashRoute";
import { usePageAnalytics } from "./hooks/useAnalytics";
import { LiveDebtCounter } from "./components/LiveDebtCounter";
import { LiveSpendingCounter } from "./components/LiveSpendingCounter";
import { KPICard } from "./components/KPICard";
import { DebtEvolutionChart } from "./components/DebtEvolutionChart";
import { RatesChart } from "./components/RatesChart";
import { BudgetFlow } from "./components/BudgetFlow";
import { SourcesPanel } from "./components/SourcesPanel";
import { SubscribeForm } from "./components/SubscribeForm";
import { HistoricalCurves } from "./components/HistoricalCurves";
import { RecettesDepensesHistory } from "./components/RecettesDepensesHistory";
import { HistoricalComposition } from "./components/HistoricalComposition";
// RevenueForecastChart retiré du dashboard (étape 7) — fichier conservé.
// import { RevenueForecastChart } from "./components/RevenueForecastChart";
import { DefautSouverainExplainer } from "./components/DefautSouverainExplainer";
import { GlossaryTerm } from "./components/GlossaryTerm";
import { Linkify } from "./components/Linkify";
import { ChartCitizenImpact } from "./components/ChartCitizenImpact";
import { InstitutionsPage } from "./components/InstitutionsPage";
import { MaVillePage } from "./components/MaVillePage";
import { BudgetBreakdown } from "./components/BudgetBreakdown";
import { Glossary } from "./components/Glossary";
import { DownloadableCard } from "./components/DownloadableCard";
import { FraudesChart } from "./components/FraudesChart";
import { FraudesEuropeChart } from "./components/FraudesEuropeChart";
import { EuropeanComparison } from "./components/EuropeanComparison";
import { SpreadChart } from "./components/SpreadChart";
import { ChargeRatioChart } from "./components/ChargeRatioChart";
import { RatingsTimeline } from "./components/RatingsTimeline";
import { MesImpotsSimulator } from "./components/MesImpotsSimulator";
import { Equivalences } from "./components/Equivalences";
import { EventsAnnotated } from "./components/EventsAnnotated";
import { PedagogyStepper } from "./components/PedagogyStepper";
import { Calculators } from "./components/Calculators";
import { SecuCollectivitesPage } from "./components/SecuCollectivitesPage";
import { SecuCollecHistoryChart } from "./components/SecuCollecHistoryChart";
import { MissionSelector } from "./components/MissionSelector";
import { PricingPage } from "./components/PricingPage";
import { PaymentSuccessPage } from "./components/PaymentSuccessPage";
import { AccountPage } from "./components/AccountPage";
import { SpreadMultiPaysChart } from "./components/SpreadMultiPaysChart";
import { DetenteursDetteChart } from "./components/DetenteursDetteChart";
import { RealRateChart } from "./components/RealRateChart";
import { DebtCostProjection } from "./components/DebtCostProjection";
import { AdminDashboard } from "./components/AdminDashboard";
import { filterBudgetForHistorique } from "./lib/historiqueFilter";
import { formatDateTime, formatPercent } from "./lib/format";
import { timeseriesToCsv, multiSeriesToCsv, objectsToCsv } from "./lib/csvExport";
import type { BudgetSnapshot } from "./types";

// Feature flag — passe à `true` pour réactiver l'abonnement Premium / Stripe.
// Toute la mécanique Stripe (routes, pages, jobs hebdo, schéma DB) reste
// présente dans le code ; seule l'interface est masquée pendant la phase
// gratuite de lancement.
const PREMIUM_ENABLED = false;

// Pages nationales (Budget France) + pages ville (Budget [Ville]).
// Les pages ville sont identifiées par "ville-*" et associées à un slug.
type Page =
  | "dashboard" | "europe" | "historique" | "fraudes" | "mes-impots"
  | "pedagogie" | "secu-collec" | "sources" | "glossaire" | "institutions"
  | "tarifs" | "paiement-reussi" | "compte" | "admin"
  | "ville-synthese" | "ville-recettes" | "ville-depenses"
  | "ville-historique" | "ville-comparaison" | "ville-sources";

interface RouteResolution {
  page: Page;
  /** Slug de la ville si on est dans le contexte ville, sinon null. */
  villeSlug: string | null;
}

/** Convertit un nom de ville en slug URL-safe (sans accents, lowercase). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveRoute(hash: string): RouteResolution {
  // ─── Routes ville ─────────────────────────────────────────────────────
  // Format: villes/[slug] (synthèse) ou villes/[slug]/[subpage]
  if (hash.startsWith("villes/") || hash.startsWith("ville/")) {
    const parts = hash.replace(/^villes?\//, "").split("/");
    const slug = (parts[0] ?? "").trim();
    const sub = (parts[1] ?? "").trim();
    let page: Page = "ville-synthese";
    if (sub === "recettes") page = "ville-recettes";
    else if (sub === "depenses") page = "ville-depenses";
    else if (sub === "historique") page = "ville-historique";
    else if (sub === "comparaison" || sub === "compare") page = "ville-comparaison";
    else if (sub === "sources") page = "ville-sources";
    return { page, villeSlug: slug || null };
  }

  // ─── Routes nationales (Budget France) ────────────────────────────────
  let page: Page = "dashboard";
  if (hash.startsWith("admin")) page = "admin";
  else if (hash.startsWith("tarifs") || hash.startsWith("premium")) page = "tarifs";
  else if (hash.startsWith("paiement-reussi") || hash.startsWith("success")) page = "paiement-reussi";
  else if (hash.startsWith("compte") || hash.startsWith("account")) page = "compte";
  else if (hash.startsWith("europe")) page = "europe";
  else if (hash.startsWith("historique")) page = "historique";
  else if (hash.startsWith("fraudes")) page = "fraudes";
  else if (hash.startsWith("secu") || hash.startsWith("collectivites") || hash.startsWith("secu-collec")) page = "secu-collec";
  else if (hash.startsWith("mes-impots") || hash.startsWith("impots")) page = "mes-impots";
  else if (hash.startsWith("pedagogie") || hash.startsWith("eleves") || hash.startsWith("comprendre")) page = "pedagogie";
  else if (hash.startsWith("sources")) page = "sources";
  else if (hash.startsWith("glossaire") || hash.startsWith("fiches")) page = "glossaire";
  else if (hash.startsWith("institutions")) page = "institutions";
  return { page, villeSlug: null };
}

export default function App() {
  const { data, loading, error } = useBudgetData();
  const hash = useHashRoute();
  const { page, villeSlug } = resolveRoute(hash);

  // Remonte en haut à chaque changement de page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [page, villeSlug]);

  // Tracking analytics minimaliste (fréquentation par page, anonyme).
  // Ne s'enclenche pas sur la page admin pour ne pas polluer les stats.
  usePageAnalytics(page === "admin" ? "__admin" : page);

  // Détection du contexte ville pour Header
  const isVillePage = page.startsWith("ville-");
  const villeData = isVillePage && villeSlug && data?.villes
    ? data.villes.items.find((v) => slugify(v.nom) === villeSlug)
    : null;

  return (
    <div className="min-h-full">
      <Header
        page={page}
        ville={villeData ? { nom: villeData.nom, departement: villeData.departement } : null}
        allVilles={data?.villes?.items.map((v) => ({ slug: slugify(v.nom), nom: v.nom, population: v.population, departement: v.departement })) ?? []}
      />
      <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24">
        {loading && <LoadingBanner />}
        {error && <ErrorBanner message={error} />}

        {/* Linkify : auto-wrap des termes du glossaire (PIB, OAT, dette publique,
            BCE…) dans tout le contenu pédagogique. Ne touche pas aux pages
            Glossary (déjà reliée), Admin (back-office) ni au footer. */}
        <Linkify>
          {data && page === "dashboard" && <DashboardPage data={data} />}
          {data && page === "europe" && <EuropePage data={data} />}
          {data && page === "historique" && <HistoriquePage data={data} />}
          {data && page === "fraudes" && <FraudesPage data={data} />}
          {data && page === "mes-impots" && <MesImpotsPage data={data} />}
          {data && page === "pedagogie" && <PedagogyPage data={data} />}
          {data && page === "secu-collec" && <SecuCollectivitesPage data={data} />}
          {data && page === "sources" && <SourcesOnlyPage data={data} />}
          {page === "institutions" && <InstitutionsPage />}

          {/* Pages ville (sub-tabs au sein du contexte ville) */}
          {data && isVillePage && (
            <MaVillePage data={data} subPage={page} villeSlug={villeSlug} />
          )}

          {/* Les pages Premium ne s'affichent que si le flag est activé */}
          {PREMIUM_ENABLED && page === "tarifs" && <PricingPage />}
          {PREMIUM_ENABLED && page === "paiement-reussi" && <PaymentSuccessPage />}
          {PREMIUM_ENABLED && page === "compte" && <AccountPage />}
        </Linkify>

        {/* Glossary : NE PAS linkifier (la page elle-même décrit les termes,
            le wrapper créerait des popovers à chaque mot et casserait l'UX). */}
        {page === "glossaire" && <Glossary />}

        {/* Back-office (login requis) — pas de lien public, on y accède
            via l'URL #/admin (ou le lien discret dans le footer). */}
        {page === "admin" && <AdminDashboard />}

        {data && (
          <footer className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
            <div className="flex flex-wrap gap-3 justify-between">
              <span>Dernière mise à jour du snapshot : {formatDateTime(data.generatedAt)}</span>
              <span>Données publiques — Eurostat, INSEE, BCE, Banque de France, data.gouv.fr</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-slate-100">
              <span>
                Une question, une remarque, un bug à signaler ?{" "}
                <a
                  href="mailto:contact@budgetfrance.org"
                  className="text-brand hover:underline font-medium"
                >
                  contact@budgetfrance.org
                </a>
              </span>
              <span className="text-slate-400">
                © Budget France · Projet pédagogique indépendant ·{" "}
                <a
                  href="#/admin"
                  className="hover:text-brand transition-colors"
                  title="Espace administrateur"
                >
                  admin
                </a>
              </span>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

function DashboardPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      {/* Hero : compteur dette + compteur dépenses côte-à-côte */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveDebtCounter
          baseValue={data.dettePublique.value}
          asOf={data.dettePublique.asOf}
          eurPerSecond={data.vitesseEndettementEurParSec.value}
        />
        <LiveSpendingCounter
          annualBudget={data.budgetPrevisionnel.value}
          eurPerSecond={
            data.vitesseDepensesEurParSec?.value
              ?? data.budgetPrevisionnel.value / (365 * 86_400)
          }
          annee={data.annee}
        />
      </section>

      <ChartCitizenImpact
        text={
          <>
            Chaque seconde, la France emprunte ~5 000 € de plus qu'elle n'encaisse.
            Sur ta vie active (40 ans), ça représente <strong>près de 50 000 € de dette
            par contribuable</strong> à rembourser via la fiscalité future ou
            l'inflation. Le compteur de dépenses montre que l'État dépense ~18 000 € par
            seconde — soit ~1,5 milliard d'euros par jour pour faire tourner les services
            publics que tu utilises (école, santé, sécurité, retraites…).
          </>
        }
      />

      <div className="mt-2 text-xs text-slate-500">
        <GlossaryTerm slug="Ratio dette / PIB">Ratio dette / PIB</GlossaryTerm> :{" "}
        <span className="text-slate-800 font-semibold tabular-nums">
          {formatPercent(data.ratioDettePib.value)}
        </span>{" "}
        — <GlossaryTerm slug="PIB">PIB</GlossaryTerm> de référence : {(data.pib.value / 1e9).toFixed(0)} Md€
      </div>

      {/* 4 KPIs */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={<><GlossaryTerm slug="Loi de finances initiale">Budget prévisionnel</GlossaryTerm></>}
          metric={data.budgetPrevisionnel}
          accent="blue"
          hint={`LFI ${data.annee} — dépenses totales de l'État`}
        />
        <KPICard
          title={`Budget exécuté ${data.annee}`}
          metric={data.budgetExecute}
          accent="default"
          hint="Estimation cumulée depuis le 1er janvier"
        />
        <KPICard
          title={<><GlossaryTerm slug="Dette publique">Dette publique</GlossaryTerm></>}
          metric={data.dettePublique}
          accent="red"
          hint="Au sens Maastricht — toutes administrations publiques"
        />
        <KPICard
          title={<>Taux <GlossaryTerm slug="OAT">OAT</GlossaryTerm> 10 ans</>}
          metric={data.tauxOat10ans}
          accent="blue"
          hint={<>Taux directeur <GlossaryTerm slug="BCE">BCE</GlossaryTerm> : {data.tauxDirecteurBce.value.toFixed(2)} %</>}
        />
      </section>

      <ChartCitizenImpact
        text={
          <>
            Si l'OAT 10 ans monte d'1 point, la France paie à terme ~30 Md€ d'intérêts
            en plus chaque année. Cette somme remplace mécaniquement d'autres dépenses :
            ce sont <strong>les hôpitaux, l'éducation et les retraites qui se font rogner</strong>
            pour payer les marchés. Plus la dette monte, plus tu finances des intérêts
            au lieu de services publics.
          </>
        }
      />

      {/* Flux budget + taux */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DownloadableCard
          filename={`budget-france-flux-${data.annee}`}
          getCsvData={() => objectsToCsv([
            { ligne: "Recettes", montant_eur: data.recettesPrevisionnelles.value },
            { ligne: "Dépenses", montant_eur: data.budgetPrevisionnel.value },
            { ligne: "Solde", montant_eur: data.soldeBudgetaire.value },
          ])}
        >
          <BudgetFlow
            annee={data.annee}
            recettes={data.recettesPrevisionnelles}
            depenses={data.budgetPrevisionnel}
            solde={data.soldeBudgetaire}
          />
        </DownloadableCard>
        <DownloadableCard
          filename="budget-france-oat-10ans"
          getCsvData={() => timeseriesToCsv(data.series.tauxOatHistorique.points, "taux_pct")}
        >
          <RatesChart series={data.series.tauxOatHistorique} />
        </DownloadableCard>
      </section>

      <ChartCitizenImpact
        text={
          <>
            <strong>Le déficit, c'est concrètement ta dette future</strong> : sur
            chaque 100 € que l'État dépense, 25 € ne sont pas couverts par les impôts
            de cette année — ils sont empruntés et s'ajoutent à la dette.
            Tu rembourseras ces 25 € via la fiscalité dans les 10-30 prochaines années
            (ou par l'inflation, qui rogne ton pouvoir d'achat).
          </>
        }
      />

      {/* Répartition LFI : recettes + dépenses */}
      {data.repartition && (
        <section className="mt-4">
          <DownloadableCard
            filename={`budget-france-repartition-lfi-${data.repartition.annee}`}
            getCsvData={() => objectsToCsv([
              ...data.repartition!.recettes.map((r) => ({ side: "recettes", ...r })),
              ...data.repartition!.depenses.map((r) => ({ side: "depenses", ...r })),
            ])}
          >
            <BudgetBreakdown
              annee={data.repartition.annee}
              recettes={data.repartition.recettes}
              depenses={data.repartition.depenses}
              sourceLabel={data.repartition.source.label}
            />
          </DownloadableCard>
          <ChartCitizenImpact
            text={
              <>
                <strong>Sur chaque 100 € d'impôts</strong> que tu paies (TVA + IR + tous
                les autres) : ~22 € vont à l'éducation, ~17 € au paiement des intérêts
                de la dette, ~14 € à la défense, ~10 € au transport et écologie. Le reste
                se répartit entre justice, sécurité, recherche, culture, etc. Ce graphe
                te dit où va vraiment ton argent.
              </>
            }
          />
        </section>
      )}

      {/* Section "Exécution mensuelle prévu vs réel" retirée du dashboard :
          les données simulées prêtaient à confusion. La DGFiP publie déjà
          l'exécution réelle dans la SMB avec 1-2 mois de décalage —
          ceux qui veulent suivre l'exécution iront directement à la source.
          Le composant RevenueForecastChart reste dans le code au cas où on
          voudrait le réintroduire avec des données réelles importées du SMB. */}

      {/* La soutenabilité de la dette / défaut souverain a été déplacée
          dans l'onglet « Comprendre » (PedagogyPage). */}

      {/* La dette récente (Eurostat trimestriel) a été déplacée sur la page
          Historique pour éviter la redondance avec le compteur live. */}

      {/* Équivalences concrètes — rendre les Md€ tangibles */}
      <section className="mt-4">
        <Equivalences
          deficitAmount={Math.abs(data.soldeBudgetaire.value)}
          chargeDetteAmount={
            data.compositionHistorique?.depenses
              .find((c) => c.id === "dette")
              ?.points.slice(-1)[0]?.value
          }
        />
      </section>

      {/* Hero "Trouver ma ville" — incite à explorer les budgets locaux */}
      <section className="mt-4">
        <FindMyCityHero data={data} />
      </section>

      {/* Inscription notifications — Alertes et Bulletin */}
      <section className="mt-4">
        <SubscribeForm />
      </section>

      {/* CTA Premium — masqué pendant la phase gratuite. Code conservé. */}
      {PREMIUM_ENABLED && (
        <section className="mt-4">
          <a
            href="#/tarifs"
            className="card block p-6 hover:border-brand hover:shadow-lg transition-all group bg-gradient-to-br from-brand-soft/30 to-white"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-widest text-brand font-semibold">
                  ✨ Budget France Premium
                </div>
                <div className="font-display text-xl font-semibold text-slate-900 mt-1 group-hover:text-brand transition-colors">
                  Bulletin hebdomadaire, alertes personnalisées, archives
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Soutiens le projet à partir de 4,79 €/mois (annuel) — 7 jours d'essai gratuit, sans engagement.
                </p>
              </div>
              <div className="text-brand text-2xl">→</div>
            </div>
          </a>
        </section>
      )}

      {/* Liens vers les autres pages */}
      <section className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PageLink href="#/mes-impots" title="Où vont mes impôts ?" subtitle="Simulateur perso" />
        <PageLink href="#/secu-collec" title="Sécu & Collectivités" subtitle="Les 2 autres sphères publiques" />
        <PageLink href="#/pedagogie" title="Comprendre en 10 étapes" subtitle="Pour élèves / étudiants" />
        <PageLink href="#/historique" title="Historique 1945+" subtitle="80 ans d'évolution" />
        <PageLink href="#/fraudes" title="Fraudes" subtitle="Fiscale et sociale" />
        <PageLink href="#/europe" title="Europe" subtitle="FR vs DE · IT · ES · UE" />
        <PageLink href="#/glossaire" title="Fiches pédagogiques" subtitle="Glossaire" />
        <PageLink href="#/sources" title="Sources" subtitle="Traçabilité" />
      </section>
    </>
  );
}

// ----------------------------------------------------------------------------
// FindMyCityHero — gros encart sur le Dashboard pour inciter à explorer
// les budgets municipaux. Affiche un input + 6 villes les plus peuplées.
// ----------------------------------------------------------------------------

function FindMyCityHero({ data }: { data: BudgetSnapshot }) {
  const villes = data.villes?.items ?? [];
  const [query, setQuery] = useState("");

  // Hooks AVANT early return (rules of hooks).
  const top = useMemo(
    () => [...villes].sort((a, b) => b.population - a.population),
    [villes],
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return top.slice(0, 6);
    const q = query.toLowerCase().trim();
    return top.filter((v) => v.nom.toLowerCase().includes(q)).slice(0, 12);
  }, [top, query]);

  if (villes.length === 0) return null;

  function go(slug: string) {
    window.location.hash = `#/villes/${slug}`;
  }

  return (
    <div className="card p-5 md:p-7 bg-gradient-to-br from-brand-soft/40 to-white border-brand/20">
      <div className="text-xs uppercase tracking-widest text-brand font-semibold">
        🏛️ Budget de ma commune
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-1">
        Découvre le budget de ta ville
      </h2>
      <p className="text-sm text-slate-700 mt-2 max-w-2xl leading-relaxed">
        Combien dépense ta commune ? D'où vient son argent ? Combien est-elle endettée ?
        Tape le nom de ta ville pour explorer son budget — recettes, dépenses, dette,
        comparaison avec les autres.
      </p>

      <div className="mt-5 max-w-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tape Paris, Marseille, Lyon… ou utilise la 🔍 dans le menu en haut"
          className="w-full bg-white border-2 border-brand/30 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-4">
        {!query.trim() && (
          <div className="text-[11px] text-slate-500 mb-2">
            Les 6 plus grandes villes :
          </div>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {filtered.map((v) => {
            const slug = slugify(v.nom);
            return (
              <li key={v.codeInsee}>
                <button
                  type="button"
                  onClick={() => go(slug)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-brand hover:bg-brand-soft/30 hover:text-brand transition group"
                >
                  <div className="font-display font-semibold text-slate-900 group-hover:text-brand text-sm">
                    {v.nom}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {(v.population / 1000).toFixed(0)} k hab.
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="text-sm text-slate-500 italic px-2 py-3">
            Aucune ville ne correspond à « {query} ». Phase 1 limitée aux {villes.length} plus grandes villes.
          </div>
        )}
      </div>

      <div className="mt-4 text-[11px] text-slate-500">
        ⚠ Phase 1 (MVP) — {villes.length} plus grandes villes incluses. Phase 2 prévue pour
        toutes les communes via import data.gouv.fr automatisé.
      </div>
    </div>
  );
}

function EuropePage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Contexte européen · indicateurs médias</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          La France dans son écosystème européen
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Trois angles que les rédactions économiques regardent quotidiennement : la
          position de la France face à ses voisins (dette / déficit), la prime de risque
          souveraine mesurée par le spread OAT-Bund, et la part de chaque euro d'impôt
          consacrée aux intérêts de la dette. Tous issus de sources officielles.
        </p>
      </section>

      {/* 1. Comparaison européenne */}
      <section className="mt-6">
        <EuropeanComparison data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>La France a 3× plus de dette par habitant que l'Allemagne</strong>{" "}
              (51 000 € vs 28 000 € par tête). Cette dette pèse sur les générations futures
              (toi, tes enfants) qui devront la rembourser via la fiscalité ou l'inflation.
              Les pays peu endettés (Allemagne, Pays-Bas) gardent des marges pour investir
              dans la transition énergétique et leurs services publics.
            </>
          }
        />
      </section>

      {/* 2. Spread OAT-Bund */}
      <section className="mt-4">
        <SpreadChart data={data} />
        <ChartCitizenImpact
          text={
            <>
              Le spread, c'est <strong>la prime que les marchés exigent</strong> pour
              prêter à la France au lieu de l'Allemagne. À 60 pb (~0,60 % de plus), ça
              coûte <strong>~20 Md€ supplémentaires par an</strong> aux contribuables —
              soit le budget de la justice. Quand le spread monte, c'est un signal
              d'alerte : les investisseurs doutent de la soutenabilité de notre dette.
            </>
          }
        />
      </section>

      {/* 3. Charge de la dette / recettes */}
      <section className="mt-4">
        <ChargeRatioChart data={data} />
        <ChartCitizenImpact
          text={
            <>
              Sur <strong>chaque 100 € d'impôt</strong> que tu paies aujourd'hui, environ
              5-7 € partent uniquement pour payer les <strong>intérêts</strong> de la dette
              passée — pas pour rembourser le capital, juste pour rémunérer les prêteurs.
              Dans les années 90, c'était plus de 15 €. Cette part va remonter avec la
              hausse récente des taux.
            </>
          }
        />
      </section>

      {/* 4. Notations souveraines — S&P / Moody's / Fitch */}
      <section className="mt-4">
        <RatingsTimeline data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>La France a perdu son AAA en 2012</strong> (équivalent du « 20/20 »
              chez les agences). Aujourd'hui notée AA-, on est encore parmi les meilleurs
              élèves mais en pente glissante. À chaque dégradation, certains investisseurs
              institutionnels (fonds de pension étrangers) ne peuvent plus acheter notre
              dette → moins de demande → taux plus hauts → plus de coût pour le contribuable.
            </>
          }
        />
      </section>

      {/* 5. Spread multi-pays (FR vs DE / IT / ES) */}
      <section className="mt-4">
        <SpreadMultiPaysChart data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>L'Italie paie ~150 pb de plus que l'Allemagne</strong> pour emprunter,
              soit 1,50 % en plus. Sur 2 800 Md€ de dette, ça représente +42 Md€/an d'intérêts
              pour les Italiens. Pour la France, le spread est ~50 pb : on paie ~17 Md€
              supplémentaires par an comparé à un pays avec une signature parfaite.
            </>
          }
        />
      </section>

      {/* 6. Détenteurs de la dette française */}
      <section className="mt-4">
        <DetenteursDetteChart data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>Contrairement à une idée reçue, ta dette n'est pas détenue par
              « les Chinois »</strong> ou « la finance internationale ». 50 % par des
              non-résidents (banques européennes, fonds de pension), 22 % par les banques
              et assureurs français (qui placent ton épargne dessus), 18 % par la BCE,
              et 1 % directement par les ménages français. Quand on parle de « rembourser
              la dette », c'est en grande partie à toi-même via ton assurance-vie.
            </>
          }
        />
      </section>
    </>
  );
}

function PedagogyPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Pour les élèves, étudiants, curieux</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Comprendre le budget en 10 étapes
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Parcours guidé pas-à-pas pour lycéens en SES, prépas HEC, Sciences Po, étudiants en
          économie ou droit. Un concept par étape, un exemple chiffré, des calculatrices
          interactives et la courbe historique annotée des grands événements.
        </p>
      </section>

      {/* 1. Stepper pas-à-pas */}
      <section className="mt-6">
        <PedagogyStepper data={data} />
      </section>

      {/* 2. Courbe dette avec annotations événements */}
      <section className="mt-4">
        <EventsAnnotated data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>Toutes les hausses brutales de dette correspondent à une crise</strong>
              : 1981 (relance Mitterrand), 1993 (récession), 2008 (subprimes), 2020 (Covid).
              Pas de crise, pas de hausse spectaculaire. Mais entre les crises, la dette
              continue de monter doucement parce que les déficits structurels ne sont
              jamais résorbés. <strong>La prochaine crise pourrait être ingérable</strong>
              si on n'a pas de marges fiscales.
            </>
          }
        />
      </section>

      {/* 3. Calculatrices interactives */}
      <section className="mt-4">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-widest text-muted">Jouez avec les chiffres</div>
          <h2 className="font-display text-2xl font-semibold text-slate-900 mt-1">
            Calculatrices interactives
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Sensibilité aux taux, temps de remboursement, effet boule de neige — les trois
            outils que tout étudiant en finance publique doit manipuler.
          </p>
        </div>
        <Calculators data={data} />
        <ChartCitizenImpact
          text={
            <>
              Joue avec les sliders : tu verras qu'avec un déficit de 100 Md€/an et la
              croissance actuelle, <strong>la dette ne se résorbera jamais toute seule</strong>.
              Pour rembourser même partiellement, il faudrait soit forte croissance + faible
              taux (peu probable), soit excédent budgétaire massif (impopulaire), soit forte
              inflation (rogne ton pouvoir d'achat). Aucune option n'est indolore pour les
              citoyens.
            </>
          }
        />
      </section>

      {/* 4. Projection à 5 ans du coût de la dette selon scénarios de taux */}
      <section className="mt-4">
        <DebtCostProjection data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>La charge de la dette va doubler en 5 ans</strong> : de ~70 Md€/an
              aujourd'hui à ~120 Md€/an en 2030 dans le scénario central. Cette différence
              (50 Md€) équivaut <strong>à tout le budget de l'éducation nationale</strong>.
              Concrètement : sans coupes ailleurs ni hausse d'impôts, ces intérêts vont
              forcer des choix douloureux dans tous les autres ministères.
            </>
          }
        />
      </section>

      {/* 5. Soutenabilité de la dette / défaut souverain :
          placée APRÈS la projection 5 ans pour enchaîner naturellement
          (« et si les taux montent vraiment haut, jusqu'où peut-on aller ? »). */}
      <section className="mt-4">
        <DefautSouverainExplainer />
      </section>
    </>
  );
}

function MesImpotsPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Pour la population</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Où vont mes impôts ?
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Ta contribution annuelle au budget de l'État, répartie sur les grandes missions
          (Éducation, Défense, Santé, Charge de la dette…). Calcul pédagogique — pas un
          avis d'imposition officiel.
        </p>
      </section>

      <section className="mt-6">
        <MesImpotsSimulator data={data} />
        <ChartCitizenImpact
          text={
            <>
              <strong>Tu n'imagines pas combien tu donnes vraiment à l'État.</strong>{" "}
              Au-delà de l'impôt sur le revenu, tu paies aussi : ~20 % de TVA sur tout ce
              que tu achètes, des taxes carburant (TICPE), des cotisations sociales sur
              ton salaire (~22 % salarial + ~42 % patronal). Cumulé, le « taux de
              prélèvements obligatoires » français est de ~46 % du PIB — l'un des plus
              élevés au monde. Ce graphe te montre où va concrètement chaque euro.
            </>
          }
        />
      </section>
    </>
  );
}

function FraudesPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Manque à gagner</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Fraude fiscale et sociale
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Évolution des estimations de fraude depuis 1945. Les montants sont des ordres
          de grandeur — la fraude, par nature, n'est pas mesurable avec précision. Les
          chiffres récents (depuis 2000) sont mieux documentés grâce aux méthodes
          d'audit aléatoire employées par la DGFiP et la Cour des comptes.
        </p>
      </section>

      <section className="mt-6">
        <FraudesChart data={data} />
        <ChartCitizenImpact
          text={
            <>
              La fraude estimée (~100 Md€) représente <strong>presque le déficit annuel</strong>
              de la France. Si on récupérait ne serait-ce que 30 % de cette fraude, on
              aurait largement de quoi équilibrer les comptes sans hausser les impôts ni
              couper dans les services publics. Mais en pratique, l'administration n'en
              récupère que 17-20 Md€/an (fraude détectée). C'est <strong>toi qui paies
              cet écart</strong> via tes impôts honnêtement déclarés.
            </>
          }
        />
      </section>

      {/* Comparaison européenne (étape 3) — la France n'est pas seule. */}
      <section className="mt-4">
        <FraudesEuropeChart />
        <ChartCitizenImpact
          text={
            <>
              <strong>La France n'est ni la pire ni la meilleure</strong> en Europe sur la
              fraude — elle est dans la moyenne haute (3,7 % du PIB). L'Italie en tête
              (~10 % du PIB) reflète la culture du cash et du travail au noir. Les Pays-Bas
              et le Royaume-Uni ont les plus bas ratios grâce à des administrations très
              digitalisées. <strong>Plus tu acceptes de payer en virement et facture
              électronique, moins l'évasion fiscale est facile.</strong>
            </>
          }
        />
      </section>
    </>
  );
}

function HistoriquePage({ data }: { data: BudgetSnapshot }) {
  // On filtre toutes les séries pour ne garder que les millésimes CLOS
  // (année < annee courante). 2026 est un prévisionnel, pas de l'historique.
  const capYear = data.annee;
  const filtered = filterBudgetForHistorique(data, capYear);

  const derniereAnnee = filtered.series.detteLongue?.points.slice(-1)[0]
    ? new Date(filtered.series.detteLongue.points.slice(-1)[0]!.date).getUTCFullYear()
    : capYear - 1;

  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Longue période</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Évolution 1945 → {derniereAnnee}
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          80 ans d'histoire des finances publiques françaises. Les données s'arrêtent à l'année
          {" "}{derniereAnnee} car l'exécution budgétaire {data.annee} n'est pas encore close —
          pour {data.annee}, voir le <a href="#/" className="underline hover:text-brand">dashboard</a>.
        </p>
      </section>

      {/* Recettes vs dépenses — somme absolue */}
      <section className="mt-6">
        <DownloadableCard
          filename="budget-france-recettes-depenses-1945"
          getCsvData={() => multiSeriesToCsv([
            { id: "rec", label: "recettes_etat_eur", points: filtered.series.recettesLongue?.points ?? [] },
            { id: "dep", label: "depenses_etat_eur", points: filtered.series.depensesLongue?.points ?? [] },
          ])}
        >
          <RecettesDepensesHistory data={filtered} />
        </DownloadableCard>
        <ChartCitizenImpact
          text={
            <>
              <strong>Depuis 1975, l'État dépense systématiquement plus qu'il ne reçoit.</strong>
              {" "}Cet écart cumulé sur 50 ans, c'est exactement la dette publique d'aujourd'hui.
              Aucun gouvernement, gauche comme droite, n'a fait d'excédent durable. Conséquence pour
              toi : la fiscalité ne baissera pas tant qu'on n'aura pas réduit cet écart.
            </>
          }
        />
      </section>

      {/* Sécurité sociale + Collectivités — évolution 1945-2025 */}
      {filtered.historiqueDetaille && (
        <section className="mt-4">
          <SecuCollecHistoryChart data={filtered} />
          <ChartCitizenImpact
            text={
              <>
                Sécu et Collectivités sont <strong>obligées par loi</strong> d'équilibrer
                leurs comptes — c'est pour ça que recettes et dépenses se collent presque parfaitement.
                Concrètement : quand le déficit Sécu monte, c'est <strong>toi qui paies plus</strong>{" "}
                (hausse cotisations, CSG, ou baisse remboursements), ou la CADES emprunte pour
                rembourser sur 25 ans via la CRDS sur ta fiche de paie.
              </>
            }
          />
        </section>
      )}

      {/* Sélecteur de mission — évolution détaillée par ministère */}
      {filtered.historiqueDetaille && filtered.historiqueDetaille.missions.length > 0 && (
        <section className="mt-4">
          <MissionSelector data={filtered} />
          <ChartCitizenImpact
            text={
              <>
                <strong>La défense baisse en pourcentage du budget</strong> depuis 1960
                (de 25 % à 6 % aujourd'hui), tandis que l'éducation, la santé et les retraites
                ont massivement augmenté en valeur absolue. Ce graphique te montre les choix
                politiques cumulés sur 80 ans : où l'État met (et a mis) tes impôts.
              </>
            }
          />
        </section>
      )}

      {/* Composition : part de chaque recette et de chaque dépense */}
      {filtered.compositionHistorique && (
        <section className="mt-4">
          <DownloadableCard
            filename="budget-france-composition-1945"
            getCsvData={() => multiSeriesToCsv([
              ...filtered.compositionHistorique!.recettes.map((c) => ({
                id: `rec_${c.id}`, label: `recettes_${c.label}_eur`, points: c.points,
              })),
              ...filtered.compositionHistorique!.depenses.map((c) => ({
                id: `dep_${c.id}`, label: `depenses_${c.label}_eur`, points: c.points,
              })),
            ])}
          >
            <HistoricalComposition
              recettes={filtered.compositionHistorique.recettes}
              depenses={filtered.compositionHistorique.depenses}
            />
          </DownloadableCard>
          <ChartCitizenImpact
            text={
              <>
                <strong>La TVA est devenue le 1er impôt</strong> de France (35 % des
                recettes), bien avant l'impôt sur le revenu (~25 %). Or la TVA est
                <strong> proportionnelle</strong> : elle pèse autant sur les revenus modestes
                que sur les hauts revenus en pourcentage de la consommation. C'est ce qui
                rend le système fiscal moins progressif qu'on le croit.
              </>
            }
          />
        </section>
      )}

      {/* Dette publique trimestrielle (Eurostat depuis 2005) —
          DÉPLACÉE après la composition des recettes (étape 1 user). */}
      <section className="mt-4">
        <DownloadableCard
          filename="budget-france-dette-trimestrielle"
          getCsvData={() => timeseriesToCsv(filtered.series.detteHistorique.points, "dette_eur")}
        >
          <DebtEvolutionChart series={filtered.series.detteHistorique} />
        </DownloadableCard>

        {/* Note explicative : la courbe ci-dessus diffère légèrement de celle
            de « Dette / PIB / dépenses / recettes / OAT » (juste en dessous).
            Pourquoi : valeurs absolues Eurostat ici, vs PIB × ratio ailleurs. */}
        <div className="mt-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-slate-700 leading-relaxed">
          <div className="font-semibold text-amber-800 mb-1">
            Pourquoi cette courbe diffère-t-elle de celle du graphe « Dette,
            dépenses, recettes et taux » plus bas ?
          </div>
          <p>
            Les deux séries mesurent la même chose (dette publique au sens
            Maastricht) mais sont calculées différemment :
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>
              <strong>Ce graphe</strong> utilise les <strong>valeurs absolues
              Eurostat</strong> directement (ex. fin 2025 : 3 350 Md€).
            </li>
            <li>
              <strong>Le graphe long 1945+</strong> reconstruit la dette via{" "}
              <strong>PIB × ratio dette/PIB</strong> année par année (ex. fin 2025 :
              2 900 Md€ × 115 % = 3 335 Md€).
            </li>
          </ul>
          <p className="mt-1.5">
            L'écart est de ~0,5 % (~15 Md€ pour 2025), dû à l'arrondi du ratio
            stocké en pourcentage entier. Pour les comparaisons internationales
            harmonisées, on utilise toujours la première série (Eurostat). Pour
            la longue période 1945, on n'a que la reconstruction.
          </p>
        </div>
        <ChartCitizenImpact
          text={
            <>
              La dette publique a doublé depuis 2008 (1 200 → 3 350 Md€). Elle a
              pris {" "}<strong>2 100 Md€ de plus en 17 ans</strong> — soit ~31 000 €
              de plus par contribuable. Cette dette servira à payer 3 ans de Covid,
              les plans de relance, et le fait que les recettes n'ont jamais rattrapé
              les dépenses.
            </>
          }
        />
      </section>

      {/* Dette + PIB + taux longue période */}
      {filtered.series.detteLongue && filtered.series.detteLongue.points.length > 0 ? (
        <section className="mt-4">
          <DownloadableCard
            filename="budget-france-historique-complet"
            getCsvData={() => multiSeriesToCsv([
              { id: "dette", label: "dette_publique_eur", points: filtered.series.detteLongue?.points ?? [] },
              { id: "pib", label: "pib_eur", points: filtered.series.pibLongue?.points ?? [] },
              { id: "depenses", label: "depenses_etat_eur", points: filtered.series.depensesLongue?.points ?? [] },
              { id: "recettes", label: "recettes_etat_eur", points: filtered.series.recettesLongue?.points ?? [] },
              { id: "oat", label: "oat_long_terme_pct", points: filtered.series.oatLongue?.points ?? [] },
            ])}
          >
            <HistoricalCurves data={filtered} />
          </DownloadableCard>
          <ChartCitizenImpact
            text={
              <>
                <strong>Le PIB augmente, la dette augmente plus vite</strong> — et les
                taux d'intérêt sont remontés de 0 % (2020) à ~3,5 % aujourd'hui.
                Conséquence concrète : la charge de la dette (intérêts) va doubler
                d'ici 5 ans (~70 Md€ → ~120 Md€/an), équivalent au budget de l'Éducation
                nationale.
              </>
            }
          />
        </section>
      ) : null}

      {/* Taux d'intérêt réel (OAT − inflation) — concept SES */}
      {filtered.inflation && filtered.series.oatLongue && (
        <section className="mt-4">
          <RealRateChart data={filtered} />
          <ChartCitizenImpact
            text={
              <>
                Quand le taux d'intérêt réel est <strong>négatif</strong>, c'est super
                pour l'État (la dette s'allège toute seule) mais <strong>très mauvais
                pour ton épargne</strong> : tes livrets et assurances-vie perdent
                en pouvoir d'achat. C'est ce qu'on appelle la « répression financière » —
                un transfert silencieux des épargnants vers l'État endetté.
              </>
            }
          />
        </section>
      )}

      {/* On retire le bloc "indisponible" en doublon — le bloc précédent
          gère les deux cas via opérateur ternaire ci-dessus. */}
      {!filtered.series.detteLongue || filtered.series.detteLongue.points.length === 0 ? (
        <section className="mt-4">
          <div className="card p-6 text-sm text-slate-600">
            <div className="font-display text-lg text-slate-900 mb-1">Historique 1945+ indisponible</div>
            Régénère le snapshot pour voir la vue longue période :{" "}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
              docker compose run --rm pipeline
            </code>
          </div>
        </section>
      ) : null}
    </>
  );
}

function SourcesOnlyPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Transparence</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Sources officielles
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Chaque chiffre affiché dans Budget France est produit par une source publique
          identifiée, avec un statut temps réel. Les sources sont tentées dans un ordre fixé
          (Eurostat → INSEE → Banque de France → data.gouv.fr → seed) et la première qui
          répond fournit la valeur.
        </p>

        {/* Explication pédagogique de l'ordre de priorité des sources */}
        <div className="card p-5 md:p-6 mt-4 bg-brand-soft/20 border-brand/15">
          <div className="text-xs uppercase tracking-widest text-brand">Pourquoi cet ordre ?</div>
          <h2 className="font-display text-lg font-semibold text-slate-900 mt-1">
            Comment on choisit la source d'un chiffre
          </h2>
          <p className="text-sm text-slate-700 mt-3 leading-relaxed">
            L'ordre n'est pas politique : il privilégie la <strong>norme la plus large
            applicable au chiffre</strong>, puis recule vers les sources nationales si la
            norme européenne ne couvre pas l'indicateur.
          </p>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-display font-bold text-brand text-xl shrink-0 w-6 text-right">1</span>
              <div>
                <div className="font-semibold text-slate-900">Eurostat</div>
                <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                  Norme <strong>SEC 2010 Maastricht</strong> harmonisée pour les 27 États
                  membres. C'est la seule base permettant des comparaisons internationales
                  honnêtes (dette publique, déficit, dépenses APU). Si l'indicateur existe
                  chez Eurostat, on s'arrête là.
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display font-bold text-brand text-xl shrink-0 w-6 text-right">2</span>
              <div>
                <div className="font-semibold text-slate-900">INSEE</div>
                <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                  Comptes nationaux français. Source la plus fine pour les détails que
                  Eurostat ne propose pas (PIB trimestriel détaillé, IPC, démographie,
                  comptes APUL/APUC). C'est l'INSEE qui produit les chiffres
                  <em> avant</em> qu'ils soient retransmis à Eurostat.
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display font-bold text-brand text-xl shrink-0 w-6 text-right">3</span>
              <div>
                <div className="font-semibold text-slate-900">BCE / Banque de France</div>
                <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                  Source de référence pour <strong>tout ce qui est monétaire</strong> :
                  taux directeurs, OAT, Bund, spreads, masse monétaire. Données
                  rafraîchies chaque jour ouvré, alors qu'Eurostat met à jour
                  trimestriellement.
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display font-bold text-brand text-xl shrink-0 w-6 text-right">4</span>
              <div>
                <div className="font-semibold text-slate-900">data.gouv.fr / DGFiP / AFT</div>
                <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                  Sources spécifiques à la France : exécution budgétaire mensuelle (DGFiP
                  SMB), détenteurs de la dette publique (AFT), missions LFI, fraude
                  fiscale (Cour des comptes). Utilisées quand l'indicateur n'existe que
                  sous l'angle national.
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-display font-bold text-brand text-xl shrink-0 w-6 text-right">5</span>
              <div>
                <div className="font-semibold text-slate-900">Seed local (secours)</div>
                <div className="text-slate-600 text-xs leading-relaxed mt-0.5">
                  Valeurs statiques de référence stockées dans le code, utilisées si
                  toutes les API ci-dessus ne répondent pas. Permet de ne pas afficher
                  une page blanche en cas de panne. <strong>Toujours datées et sourcées</strong> :
                  les valeurs proviennent du dernier rapport public disponible (LFI,
                  Cour des comptes, INSEE bilan annuel).
                </div>
              </div>
            </li>
          </ol>
          <div className="mt-4 p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-slate-700">
            <strong>Important :</strong> chaque chiffre affiché précise sa source.
            Un badge <span className="text-money font-semibold">live</span> indique que la
            valeur vient d'être chargée depuis la source officielle. Un badge
            <span className="text-amber-700 font-semibold"> secours</span> indique qu'on
            utilise temporairement la valeur seed.
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SourcesPanel sources={data.sources} generatedAt={data.generatedAt} />
      </section>

      <section className="mt-6">
        <div className="card p-5 md:p-6 bg-brand-soft/30 border-brand/20">
          <div className="text-xs uppercase tracking-widest text-brand">Une question, un signalement ?</div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Contact
          </h2>
          <p className="text-sm text-slate-700 mt-2 max-w-2xl">
            Tu repères une donnée incorrecte, tu veux suggérer un nouvel indicateur, ou tu as une
            question sur la méthodologie ? Écris-nous, on lit toutes les remontées.
          </p>
          <a
            href="mailto:contact@budgetfrance.org"
            className="inline-flex items-center gap-2 mt-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl px-5 py-2.5 transition-colors text-sm"
          >
            ✉️ contact@budgetfrance.org
          </a>
        </div>
      </section>
    </>
  );
}

function PageLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <a
      href={href}
      className="card block p-5 hover:border-brand hover:shadow-lg transition-all group"
    >
      <div className="text-xs uppercase tracking-widest text-muted">Aller plus loin</div>
      <div className="font-display text-lg font-semibold text-slate-900 mt-1 group-hover:text-brand transition-colors">
        {title} →
      </div>
      <div className="text-sm text-slate-600 mt-1">{subtitle}</div>
    </a>
  );
}

interface VilleSearchEntry {
  slug: string;
  nom: string;
  population: number;
  departement: string;
}

interface HeaderProps {
  page: Page;
  ville: { nom: string; departement: string } | null;
  allVilles: VilleSearchEntry[];
}

function Header({ page, ville, allVilles }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ferme menu et recherche quand on change de page
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [page, ville?.nom]);

  // Items du burger national
  const NAV_ITEMS_NATIONAL: { href: string; label: string; target: Page; description: string }[] = [
    { href: "#/",              label: "Tableau de bord",          target: "dashboard",   description: "Vue d'ensemble temps réel" },
    { href: "#/historique",    label: "Historique",               target: "historique",  description: "Évolution 1945 → 2025" },
    { href: "#/secu-collec",   label: "Sécu et Collectivités",    target: "secu-collec", description: "Les 2 autres sphères publiques" },
    { href: "#/fraudes",       label: "Fraudes",                  target: "fraudes",     description: "Fiscale et sociale" },
    { href: "#/mes-impots",    label: "Mes impôts",               target: "mes-impots",  description: "Simulateur personnel" },
    { href: "#/europe",        label: "Europe",                   target: "europe",      description: "Comparaisons UE + ratings" },
    { href: "#/pedagogie",     label: "Comprendre",               target: "pedagogie",   description: "Parcours en 10 étapes" },
    { href: "#/glossaire",     label: "Fiches pédagogiques",      target: "glossaire",   description: "Glossaire complet" },
    { href: "#/institutions",  label: "Institutions",             target: "institutions", description: "Qui décide, exécute, contrôle" },
    { href: "#/sources",       label: "Sources",                  target: "sources",     description: "Traçabilité des données" },
    ...(PREMIUM_ENABLED ? [
      { href: "#/tarifs",   label: "Premium",     target: "tarifs" as Page, description: "Bulletin hebdo · 7 jours offerts" },
      { href: "#/compte",   label: "Mon compte",  target: "compte" as Page, description: "Gérer mon abonnement" },
    ] : []),
  ];

  // Items du burger ville (sub-tabs)
  const villeSlug = ville ? slugify(ville.nom) : "";
  const NAV_ITEMS_VILLE: { href: string; label: string; target: Page; description: string }[] = [
    { href: `#/villes/${villeSlug}`,             label: "Synthèse",     target: "ville-synthese",     description: "Vue d'ensemble + KPIs" },
    { href: `#/villes/${villeSlug}/recettes`,    label: "Recettes",     target: "ville-recettes",     description: "D'où vient l'argent" },
    { href: `#/villes/${villeSlug}/depenses`,    label: "Dépenses",     target: "ville-depenses",     description: "Où va l'argent" },
    { href: `#/villes/${villeSlug}/historique`,  label: "Historique",   target: "ville-historique",   description: "Évolution 2014 → 2024" },
    { href: `#/villes/${villeSlug}/comparaison`, label: "Comparaison",  target: "ville-comparaison",  description: "vs strate + national" },
    { href: `#/villes/${villeSlug}/sources`,     label: "Sources",      target: "ville-sources",      description: "Traçabilité des données" },
  ];

  const isVilleContext = Boolean(ville);
  const navItems = isVilleContext ? NAV_ITEMS_VILLE : NAV_ITEMS_NATIONAL;

  // Couleurs/initiale pour l'emblème ville (placeholder en attendant SVG officiels)
  const villeInitial = ville ? ville.nom.charAt(0).toUpperCase() : "";
  const villeColor = ville ? villeColorFor(ville.nom) : "#0055A4";

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/85 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        {/* ─── Logo + titre (national OU ville) ──────────────────────── */}
        {isVilleContext && ville ? (
          <a href={`#/villes/${villeSlug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* Emblème ville : cercle coloré + initiale */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-lg shadow-sm shrink-0"
              style={{ background: villeColor }}
              aria-hidden="true"
            >
              {villeInitial}
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-slate-900">
                Budget {ville.nom}
              </div>
              <div className="text-[11px] text-muted">
                {ville.departement}
              </div>
            </div>
          </a>
        ) : (
          <a href="#/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* Drapeau France stylisé */}
            <div className="flex gap-0.5">
              <span className="inline-block w-1.5 h-6 rounded-sm bg-brand" />
              <span className="inline-block w-1.5 h-6 rounded-sm bg-white border border-slate-200" />
              <span className="inline-block w-1.5 h-6 rounded-sm bg-flag-red" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-slate-900">
                Budget France
              </div>
              <div className="text-[11px] text-muted">
                {NAV_ITEMS_NATIONAL.find((n) => n.target === page)?.label}
              </div>
            </div>
          </a>
        )}

        <div className="flex items-center gap-2">
          {/* Bouton retour vers Budget France quand on est en contexte ville */}
          {isVilleContext && (
            <a
              href="#/"
              title="Retour à Budget France"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-brand hover:text-brand transition text-sm"
            >
              ← <span className="font-medium">Budget France</span>
            </a>
          )}

          {/* Icône recherche ville */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Rechercher ma ville"
            title="Rechercher ma ville"
            aria-expanded={searchOpen}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition ${
              searchOpen
                ? "bg-brand text-white border-brand"
                : "border-slate-200 text-slate-500 hover:border-brand hover:text-brand"
            }`}
          >
            <SearchIcon />
          </button>

          {/* Lien admin discret — icône cadenas */}
          <a
            href="#/admin"
            aria-label="Espace administrateur"
            title="Espace administrateur"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:border-brand hover:text-brand transition"
          >
            <LockIcon />
          </a>

          {/* Bouton burger — toujours visible */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-brand hover:text-brand transition"
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
            <span className="hidden sm:inline text-sm font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* ─── Dropdown recherche ville ─────────────────────────────── */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[5]"
            onClick={() => setSearchOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[6]">
            <div className="mx-auto max-w-3xl px-4 md:px-6 py-5">
              <VilleSearch
                allVilles={allVilles}
                onSelect={(slug) => {
                  window.location.hash = `#/villes/${slug}`;
                  setSearchOpen(false);
                }}
                onClose={() => setSearchOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* ─── Panneau menu burger ──────────────────────────────────── */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[5]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[6]">
            <nav className="mx-auto max-w-7xl px-4 md:px-6 py-4">
              {isVilleContext && ville && (
                <div className="mb-3 pb-3 border-b border-slate-100 text-xs uppercase tracking-widest text-muted">
                  Navigation Budget {ville.nom}
                </div>
              )}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {navItems.map((item) => (
                  <li key={item.target}>
                    <a
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block p-3 rounded-lg border transition-colors ${
                        page === item.target
                          ? "bg-brand-soft border-brand/30 text-brand"
                          : "bg-white border-slate-200 text-slate-700 hover:border-brand/40 hover:bg-brand-soft/40 hover:text-brand"
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
              {isVilleContext && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <a
                    href="#/"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
                  >
                    ← Retour à Budget France (vue nationale)
                  </a>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

// ----------------------------------------------------------------------------
// VilleSearch — composant autocomplete pour rechercher une ville
// ----------------------------------------------------------------------------

function VilleSearch({
  allVilles,
  onSelect,
  onClose,
}: {
  allVilles: VilleSearchEntry[];
  onSelect: (slug: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Sans recherche : afficher les 8 plus grandes villes par population
      return [...allVilles].sort((a, b) => b.population - a.population).slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return allVilles
      .filter((v) => v.nom.toLowerCase().includes(q) || v.slug.includes(q))
      .slice(0, 12);
  }, [allVilles, query]);

  // Focus auto sur l'input
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Navigation clavier
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted mb-2">
        Trouver ma ville (parmi {allVilles.length} disponibles)
      </div>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tape le nom de ta ville (Paris, Marseille, Lyon…)"
        className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-slate-500 italic px-2 py-3">
            Aucune ville ne correspond à « {query} ». Phase 1 limitée aux {allVilles.length}{" "}
            plus grandes villes.
          </div>
        ) : (
          <>
            {!query.trim() && (
              <div className="text-[11px] text-slate-500 mb-2">
                Suggestions (les plus peuplées) :
              </div>
            )}
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filtered.map((v) => (
                <li key={v.slug}>
                  <button
                    type="button"
                    onClick={() => onSelect(v.slug)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-brand/40 hover:bg-brand-soft/30 transition"
                  >
                    <div className="font-display font-semibold text-slate-900 text-sm">
                      {v.nom}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {v.departement} · {v.population.toLocaleString("fr-FR")} hab.
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        Phase 1 (MVP) — données pour les 20 plus grandes villes uniquement.
        Toutes les communes seront ajoutées en Phase 2.
      </div>
    </div>
  );
}

// Couleurs principales associées à chaque grande ville française.
// Inspirées des couleurs des armoiries / blasons publics.
const VILLE_COLORS: Record<string, string> = {
  paris: "#0055A4",
  marseille: "#0F4C81",
  lyon: "#A6192E",
  toulouse: "#9B2335",
  nice: "#A50034",
  nantes: "#E84E0F",
  montpellier: "#C8102E",
  strasbourg: "#C8102E",
  bordeaux: "#7B0828",
  lille: "#A50034",
  rennes: "#000000",
  reims: "#0033A0",
  "le-havre": "#003DA5",
  "saint-etienne": "#0055A4",
  toulon: "#003DA5",
  grenoble: "#0033A0",
  dijon: "#A50034",
  angers: "#003DA5",
  "clermont-ferrand": "#7B0828",
  brest: "#000000",
};

function villeColorFor(nom: string): string {
  return VILLE_COLORS[slugify(nom)] ?? "#0055A4";
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoadingBanner() {
  return (
    <div className="card mt-6 p-8 text-center">
      <div className="font-display text-xl text-slate-900">Chargement des données budgétaires…</div>
      <div className="text-sm text-slate-500 mt-2">Le pipeline interroge les sources officielles.</div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="card mt-6 p-6 border-flag-red/40">
      <div className="font-display text-lg text-flag-red">Impossible de charger data/budget.json</div>
      <div className="text-sm text-slate-600 mt-2">
        Lance le pipeline d'abord :{" "}
        <code className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">docker compose run --rm pipeline</code>
      </div>
      <div className="text-xs text-slate-500 mt-3 font-mono">{message}</div>
    </div>
  );
}
