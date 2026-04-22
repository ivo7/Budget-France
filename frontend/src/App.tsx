import { useEffect, useState } from "react";
import { useBudgetData } from "./hooks/useBudgetData";
import { useHashRoute } from "./hooks/useHashRoute";
import { LiveDebtCounter } from "./components/LiveDebtCounter";
import { KPICard } from "./components/KPICard";
import { DebtEvolutionChart } from "./components/DebtEvolutionChart";
import { RatesChart } from "./components/RatesChart";
import { BudgetFlow } from "./components/BudgetFlow";
import { SourcesPanel } from "./components/SourcesPanel";
import { SubscribeForm } from "./components/SubscribeForm";
import { HistoricalCurves } from "./components/HistoricalCurves";
import { RecettesDepensesHistory } from "./components/RecettesDepensesHistory";
import { HistoricalComposition } from "./components/HistoricalComposition";
import { RevenueForecastChart } from "./components/RevenueForecastChart";
import { BudgetBreakdown } from "./components/BudgetBreakdown";
import { Glossary } from "./components/Glossary";
import { DownloadableCard } from "./components/DownloadableCard";
import { FraudesChart } from "./components/FraudesChart";
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
import { filterBudgetForHistorique } from "./lib/historiqueFilter";
import { formatDateTime, formatPercent } from "./lib/format";
import type { BudgetSnapshot } from "./types";

type Page = "dashboard" | "europe" | "historique" | "fraudes" | "mes-impots" | "pedagogie" | "secu-collec" | "sources" | "glossaire";

function resolvePage(hash: string): Page {
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

  return (
    <div className="min-h-full">
      <Header page={page} />
      <main className="mx-auto max-w-7xl px-4 md:px-6 pb-24">
        {loading && <LoadingBanner />}
        {error && <ErrorBanner message={error} />}

        {page === "glossaire" && <Glossary />}
        {data && page === "dashboard" && <DashboardPage data={data} />}
        {data && page === "europe" && <EuropePage data={data} />}
        {data && page === "historique" && <HistoriquePage data={data} />}
        {data && page === "fraudes" && <FraudesPage data={data} />}
        {data && page === "mes-impots" && <MesImpotsPage data={data} />}
        {data && page === "pedagogie" && <PedagogyPage data={data} />}
        {data && page === "secu-collec" && <SecuCollectivitesPage data={data} />}
        {data && page === "sources" && <SourcesOnlyPage data={data} />}

        {data && (
          <footer className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap gap-3 justify-between">
            <span>Dernière mise à jour du snapshot : {formatDateTime(data.generatedAt)}</span>
            <span>Données publiques — Eurostat, INSEE, BCE, Banque de France, data.gouv.fr</span>
          </footer>
        )}
      </main>
    </div>
  );
}

function DashboardPage({ data }: { data: BudgetSnapshot }) {
  return (
    <>
      {/* Hero : compteur live */}
      <section className="mt-6">
        <LiveDebtCounter
          baseValue={data.dettePublique.value}
          asOf={data.dettePublique.asOf}
          eurPerSecond={data.vitesseEndettementEurParSec.value}
        />
        <div className="mt-2 text-xs text-slate-500">
          Ratio dette / PIB :{" "}
          <span className="text-slate-800 font-semibold tabular-nums">
            {formatPercent(data.ratioDettePib.value)}
          </span>{" "}
          — PIB de référence : {(data.pib.value / 1e9).toFixed(0)} Md€
        </div>
      </section>

      {/* 4 KPIs */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Budget prévisionnel"
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
          title="Dette publique"
          metric={data.dettePublique}
          accent="red"
          hint="Au sens Maastricht — toutes administrations publiques"
        />
        <KPICard
          title="Taux OAT 10 ans"
          metric={data.tauxOat10ans}
          accent="blue"
          hint={`Taux directeur BCE : ${data.tauxDirecteurBce.value.toFixed(2)} %`}
        />
      </section>

      {/* Flux budget + taux */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DownloadableCard filename={`budget-france-flux-${data.annee}`}>
          <BudgetFlow
            annee={data.annee}
            recettes={data.recettesPrevisionnelles}
            depenses={data.budgetPrevisionnel}
            solde={data.soldeBudgetaire}
          />
        </DownloadableCard>
        <DownloadableCard filename="budget-france-oat-10ans">
          <RatesChart series={data.series.tauxOatHistorique} />
        </DownloadableCard>
      </section>

      {/* Répartition LFI : recettes + dépenses */}
      {data.repartition && (
        <section className="mt-4">
          <DownloadableCard filename={`budget-france-repartition-lfi-${data.repartition.annee}`}>
            <BudgetBreakdown
              annee={data.repartition.annee}
              recettes={data.repartition.recettes}
              depenses={data.repartition.depenses}
              sourceLabel={data.repartition.source.label}
            />
          </DownloadableCard>
        </section>
      )}

      {/* Exécution mensuelle : prévu vs réel */}
      {data.executionCourante && (
        <section className="mt-4">
          <DownloadableCard filename={`budget-france-execution-${data.executionCourante.annee}`}>
            <RevenueForecastChart
              annee={data.executionCourante.annee}
              recettes={data.executionCourante.recettes}
              depenses={data.executionCourante.depenses}
            />
          </DownloadableCard>
        </section>
      )}

      {/* Dette récente (Eurostat trimestriel) */}
      <section className="mt-4">
        <DownloadableCard filename="budget-france-dette-recente">
          <DebtEvolutionChart series={data.series.detteHistorique} />
        </DownloadableCard>
      </section>

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
        <DownloadableCard filename="budget-france-recettes-depenses-1945">
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
          <DownloadableCard filename="budget-france-composition-1945">
            <HistoricalComposition
              recettes={filtered.compositionHistorique.recettes}
              depenses={filtered.compositionHistorique.depenses}
            />
          </DownloadableCard>
        </section>
      )}

      {/* Dette + PIB + taux longue période */}
      {filtered.series.detteLongue && filtered.series.detteLongue.points.length > 0 ? (
        <section className="mt-4">
          <DownloadableCard filename="budget-france-historique-complet">
            <HistoricalCurves data={filtered} />
          </DownloadableCard>
        </section>
      ) : (
        <section className="mt-4">
          <div className="card p-6 text-sm text-slate-600">
            <div className="font-display text-lg text-slate-900 mb-1">Historique 1945+ indisponible</div>
            Régénère le snapshot pour voir la vue longue période :{" "}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
              docker compose run --rm pipeline
            </code>
          </div>
        </section>
      )}
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
      </section>

      <section className="mt-6">
        <SourcesPanel sources={data.sources} generatedAt={data.generatedAt} />
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
