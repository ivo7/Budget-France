import { useEffect, useState } from "react";
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

type Page = "dashboard" | "europe" | "historique" | "fraudes" | "mes-impots" | "pedagogie" | "secu-collec" | "sources" | "glossaire" | "tarifs" | "paiement-reussi" | "compte" | "admin";

function resolvePage(hash: string): Page {
  // Routes prioritaires (matches préfixe)
  if (hash.startsWith("admin")) return "admin";
  if (hash.startsWith("tarifs") || hash.startsWith("premium")) return "tarifs";
  if (hash.startsWith("paiement-reussi") || hash.startsWith("success")) return "paiement-reussi";
  if (hash.startsWith("compte") || hash.startsWith("account")) return "compte";
  if (hash.startsWith("europe")) return "europe";
  if (hash.startsWith("historique")) return "historique";
  if (hash.startsWith("fraudes")) return "fraudes";
  if (hash.startsWith("secu") || hash.startsWith("collectivites") || hash.startsWith("secu-collec")) return "secu-collec";
  if (hash.startsWith("mes-impots") || hash.startsWith("impots")) return "mes-impots";
  if (hash.startsWith("pedagogie") || hash.startsWith("eleves") || hash.startsWith("comprendre")) return "pedagogie";
  if (hash.startsWith("sources")) return "sources";
  if (hash.startsWith("glossaire") || hash.startsWith("fiches")) return "glossaire";
  return "dashboard";
}

export default function App() {
  const { data, loading, error } = useBudgetData();
  const hash = useHashRoute();
  const page = resolvePage(hash);

  // Remonte en haut à chaque changement de page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [page]);

  // Tracking analytics minimaliste (fréquentation par page, anonyme).
  // Ne s'enclenche pas sur la page admin pour ne pas polluer les stats.
  usePageAnalytics(page === "admin" ? "__admin" : page);

  return (
    <div className="min-h-full">
      <Header page={page} />
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
      </section>

      {/* 2. Spread OAT-Bund */}
      <section className="mt-4">
        <SpreadChart data={data} />
      </section>

      {/* 3. Charge de la dette / recettes */}
      <section className="mt-4">
        <ChargeRatioChart data={data} />
      </section>

      {/* 4. Notations souveraines — S&P / Moody's / Fitch */}
      <section className="mt-4">
        <RatingsTimeline data={data} />
      </section>

      {/* 5. Spread multi-pays (FR vs DE / IT / ES) */}
      <section className="mt-4">
        <SpreadMultiPaysChart data={data} />
      </section>

      {/* 6. Détenteurs de la dette française */}
      <section className="mt-4">
        <DetenteursDetteChart data={data} />
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
      </section>

      {/* 4. Projection à 5 ans du coût de la dette selon scénarios de taux */}
      <section className="mt-4">
        <DebtCostProjection data={data} />
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
      </section>

      {/* Comparaison européenne (étape 3) — la France n'est pas seule. */}
      <section className="mt-4">
        <FraudesEuropeChart />
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
      </section>

      {/* Sécurité sociale + Collectivités — évolution 1945-2025 */}
      {filtered.historiqueDetaille && (
        <section className="mt-4">
          <SecuCollecHistoryChart data={filtered} />
        </section>
      )}

      {/* Sélecteur de mission — évolution détaillée par ministère */}
      {filtered.historiqueDetaille && filtered.historiqueDetaille.missions.length > 0 && (
        <section className="mt-4">
          <MissionSelector data={filtered} />
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
        </section>
      ) : null}

      {/* Taux d'intérêt réel (OAT − inflation) — concept SES */}
      {filtered.inflation && filtered.series.oatLongue && (
        <section className="mt-4">
          <RealRateChart data={filtered} />
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

function Header({ page }: { page: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu quand on change de page
  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  const NAV_ITEMS: { href: string; label: string; target: Page; description: string }[] = [
    { href: "#/",              label: "Tableau de bord",          target: "dashboard",   description: "Vue d'ensemble temps réel" },
    { href: "#/historique",    label: "Historique",               target: "historique",  description: "Évolution 1945 → 2025" },
    { href: "#/secu-collec",   label: "Sécu et Collectivités",    target: "secu-collec", description: "Les 2 autres sphères publiques" },
    { href: "#/fraudes",       label: "Fraudes",                  target: "fraudes",     description: "Fiscale et sociale" },
    { href: "#/mes-impots",    label: "Mes impôts",               target: "mes-impots",  description: "Simulateur personnel" },
    { href: "#/europe",        label: "Europe",                   target: "europe",      description: "Comparaisons UE + ratings" },
    { href: "#/pedagogie",     label: "Comprendre",               target: "pedagogie",   description: "Parcours en 10 étapes" },
    { href: "#/glossaire",     label: "Fiches pédagogiques",      target: "glossaire",   description: "Glossaire complet" },
    { href: "#/sources",       label: "Sources",                  target: "sources",     description: "Traçabilité des données" },
    // Items Premium masqués pendant la phase gratuite (toggle PREMIUM_ENABLED)
    ...(PREMIUM_ENABLED ? [
      { href: "#/tarifs",        label: "Premium",                  target: "tarifs" as Page,      description: "Bulletin hebdo · 7 jours offerts" },
      { href: "#/compte",        label: "Mon compte",               target: "compte" as Page,      description: "Gérer mon abonnement" },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/85 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <a href="#/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
              {NAV_ITEMS.find((n) => n.target === page)?.label}
            </div>
          </div>
        </a>

        <div className="flex items-center gap-2">
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

      {/* Panneau menu burger */}
      {menuOpen && (
        <>
          {/* Overlay cliquable pour fermer */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[5]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Panneau lui-même */}
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[6]">
            <nav className="mx-auto max-w-7xl px-4 md:px-6 py-4">
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {NAV_ITEMS.map((item) => (
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
            </nav>
          </div>
        </>
      )}
    </header>
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
