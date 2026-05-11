// ============================================================================
// AidesEntreprisesPage — les aides publiques aux entreprises (~110 Md€/an)
// ============================================================================
//
// Route : #/aides-entreprises
// ============================================================================

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AIDES_ENTREPRISES,
  CATEGORIES_INFO,
  MYTHES_AIDES,
  OUTILS_RECHERCHE_AIDES,
  TOTAL_AIDES_OFFICIEL,
  type CategorieAide,
} from "../data/aidesEntreprises";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

const POPULATION_FRANCE = 67_800_000;
const TAILLE_ECO_ENTREPRISES = 4_700_000; // entreprises actives France

type FilterValue = "tous" | CategorieAide;

export function AidesEntreprisesPage() {
  const [filter, setFilter] = useState<FilterValue>("tous");

  const allAides = useMemo(
    () => [...AIDES_ENTREPRISES].sort((a, b) => b.coutMdEur - a.coutMdEur),
    [],
  );

  const filtered = useMemo(
    () =>
      filter === "tous"
        ? allAides
        : allAides.filter((a) => a.categorie === filter),
    [allAides, filter],
  );

  const totalAffiche = filtered.reduce((acc, a) => acc + a.coutMdEur, 0);
  const coutMoyenParEntreprise = (TOTAL_AIDES_OFFICIEL * 1e9) / TAILLE_ECO_ENTREPRISES;
  const coutMoyenParHabitant = (TOTAL_AIDES_OFFICIEL * 1e9) / POPULATION_FRANCE;

  const barData = filtered.slice(0, 12).map((a) => ({
    nom: a.abbr ?? abbrev(a.nom, 32),
    nomComplet: a.nom,
    cout: a.coutMdEur,
    color: CATEGORIES_INFO[a.categorie].color,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-50 to-white border border-purple-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-purple-700 font-semibold">
          Politique économique · ~{TOTAL_AIDES_OFFICIEL} Md€/an
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Aides publiques aux entreprises
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          La France consacre environ <strong>{TOTAL_AIDES_OFFICIEL} milliards
          d'euros par an</strong> au soutien des entreprises — crédits d'impôt,
          allègements de cotisations, subventions, prêts garantis, plans
          d'investissement. C'est le 2ᵉ poste de dépenses publiques après les
          retraites. Page pédagogique : qui touche quoi, combien, et avec
          quelle efficacité.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Total annuel"
            value={`${TOTAL_AIDES_OFFICIEL} Md€`}
            hint="Cour des comptes 2024"
          />
          <KpiBox
            label="% du PIB"
            value="~3,7 %"
            hint="vs 2-4 % UE en moyenne"
          />
          <KpiBox
            label="Par entreprise active"
            value={`~${Math.round(coutMoyenParEntreprise / 1000).toLocaleString("fr-FR")} K€`}
            hint="moyenne, très inégalement réparti"
          />
          <KpiBox
            label="Par habitant"
            value={`${Math.round(coutMoyenParHabitant).toLocaleString("fr-FR")} €`}
            hint="financé par les impôts"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          De quoi parle-t-on exactement ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Le terme « aides aux entreprises » regroupe plusieurs réalités très
            différentes :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>Allègements de cotisations sociales</strong> (~76 Md€,
              70 % du total) : l'État renonce à percevoir une partie des
              cotisations URSSAF que les employeurs auraient dû payer sur les
              bas salaires. C'est de loin le 1ᵉʳ poste, et il est souvent
              comptabilisé séparément des « aides » classiques.
            </li>
            <li>
              • <strong>Crédits d'impôt</strong> (~15 Md€) : CIR, crédit impôt
              apprentissage, crédit impôt cinéma… L'État renonce à percevoir
              une partie de l'IS ou de l'IR.
            </li>
            <li>
              • <strong>Subventions directes</strong> (~10 Md€) : versements
              directs (Fonds vert, ADEME, France 2030, BPI), généralement sur
              appel à projets ou conditions précises.
            </li>
            <li>
              • <strong>Prêts à conditions préférentielles + garanties</strong>{" "}
              (~5 Md€ de coût budgétaire) : BPI, prêts COVID PGE.
            </li>
            <li>
              • <strong>Aides régionales et locales</strong> (~5 Md€) : ~4 000
              dispositifs disséminés en région.
            </li>
          </ul>
          <p>
            Selon le périmètre retenu, le total varie de <strong>80 à 200 Md€
            par an</strong>. Estimation centrale Cour des comptes 2024 :{" "}
            <strong>110 Md€</strong>, dont 76 Md€ d'allègements de
            cotisations. La page utilise ce chiffre comme référence.
          </p>
        </div>
      </section>

      {/* Bar chart top dispositifs */}
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Top 12 dispositifs par coût
            {filter !== "tous" && (
              <span className="text-sm font-normal text-slate-500">
                {" "}· catégorie {CATEGORIES_INFO[filter].label}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            Total affiché : <strong>{totalAffiche.toFixed(1)} Md€</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <FilterButton
            active={filter === "tous"}
            onClick={() => setFilter("tous")}
            label="Toutes"
            color="#475569"
          />
          {(Object.keys(CATEGORIES_INFO) as CategorieAide[]).map((cat) => (
            <FilterButton
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={CATEGORIES_INFO[cat].label}
              color={CATEGORIES_INFO[cat].color}
            />
          ))}
        </div>

        <div className="h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 110, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v} Md€`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="nom"
                stroke="#475569"
                tick={{ fontSize: 11 }}
                width={100}
                interval={0}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)} Md€`,
                  "Coût annuel",
                ]}
                labelFormatter={(label, payload) =>
                  (payload as { payload?: { nomComplet?: string } }[])?.[0]
                    ?.payload?.nomComplet ?? label
                }
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Liste détaillée */}
      <DownloadableCard
        filename="aides-entreprises-detail"
        shareTitle="Budget France — Aides aux entreprises"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.map((a, i) => ({
              rang: i + 1,
              dispositif: a.nom,
              cout_md_eur: a.coutMdEur,
              categorie: CATEGORIES_INFO[a.categorie].label,
              forme: a.forme,
              beneficiaires: a.beneficiaires,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail des {filtered.length} dispositifs
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Forme du soutien, bénéficiaires concrets, justification d'origine,
          évaluation indépendante.
        </p>

        <ul className="space-y-3">
          {filtered.map((a, i) => (
            <li
              key={a.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-purple-400 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl mr-1">{a.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {a.nom}
                    {a.abbr && (
                      <span className="ml-2 text-xs font-mono text-slate-500">
                        ({a.abbr})
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CATEGORIES_INFO[a.categorie].color}15`,
                      color: CATEGORIES_INFO[a.categorie].color,
                      border: `1px solid ${CATEGORIES_INFO[a.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_INFO[a.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-slate-900">
                    {a.coutMdEur.toFixed(1)} Md€
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {a.description}
              </p>

              <div className="mt-2 text-xs text-slate-600">
                <strong>Forme :</strong> {a.forme}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                <strong>Bénéficiaires :</strong> {a.beneficiaires}
              </div>

              {a.justification && (
                <div className="mt-1 text-xs text-slate-600">
                  <strong>Justification :</strong> {a.justification}
                </div>
              )}

              {a.evaluation && (
                <div className="mt-2 text-xs italic text-amber-800 bg-amber-50/60 border-l-2 border-amber-300 px-3 py-1.5 rounded-r">
                  <strong>Évaluation indépendante :</strong> {a.evaluation}
                </div>
              )}

              <div className="mt-2 text-[10px] text-slate-400">
                Source : {a.source}
              </div>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Mythes */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 idées reçues sur les aides aux entreprises
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le débat public est plein de raccourcis. Voici ce que disent les
          données et les évaluations indépendantes.
        </p>
        <ul className="space-y-3">
          {MYTHES_AIDES.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-brand/30 transition"
            >
              <div className="text-sm font-display font-semibold text-slate-900 mb-1">
                {m.mythe}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                {m.realite}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Outils pratiques */}
      <section className="card p-5 md:p-6 bg-blue-50/30 border-blue-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          🔍 Comment chercher les aides pour ton entreprise ?
        </h2>
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
          Il existe ~4 000 dispositifs en France. Pour s'y retrouver, voici
          les <strong>6 plateformes officielles gratuites</strong> à
          connaître.
        </p>
        <ul className="space-y-3">
          {OUTILS_RECHERCHE_AIDES.map((o) => (
            <li
              key={o.nom}
              className="border border-blue-200/60 bg-white rounded-lg p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-base font-semibold text-blue-700 hover:underline"
                >
                  {o.nom} ↗
                </a>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {o.publicCible}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {o.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            La France consacre <strong>~{TOTAL_AIDES_OFFICIEL} Md€/an</strong> aux
            entreprises (Cour des comptes 2024), soit <strong>~3,7 % du PIB</strong> —
            dans la moyenne européenne haute.
          </>,
          <>
            <strong>70 % du total = allègements de cotisations sociales bas
            salaires</strong> (76 Md€). Ce qu'on appelle « aides aux
            entreprises » est en réalité dominé par cette ligne, qui est
            structurelle et bénéficie surtout aux secteurs employant des
            bas/moyens salaires.
          </>,
          <>
            <strong>CIR et CICE/allègements</strong> représentent à eux seuls{" "}
            <strong>~80 % des aides</strong>. Le reste (subventions, prêts,
            France 2030, BPI) pèse ~20 % du total mais beaucoup de visibilité
            médiatique.
          </>,
          <>
            <strong>Évaluation contrastée</strong>. Cour des comptes : effets
            réels sur l'emploi pour les allègements bas salaires, plus
            mitigé pour CIR grands groupes, positif pour BPI et apprentissage.
          </>,
          <>
            <strong>~4 000 dispositifs</strong> recensés, dont 90 % en région.
            Pour les TPE/PME : aides-entreprises.fr et Place des Entreprises
            sont les portes d'entrée prioritaires.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.ccomptes.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Cour des comptes
            </a>{" "}
            — rapport 2024 sur les aides aux entreprises (110 Md€)
          </>,
          <>
            <a
              href="https://www.strategie.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              France Stratégie
            </a>{" "}
            — « Les aides publiques aux entreprises : pour quoi faire ? » (2024)
          </>,
          <>
            <a
              href="https://www.bpifrance.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              BPI France
            </a>{" "}
            — rapports annuels et statistiques de distribution
          </>,
          <>Voies et moyens — Tome II PLF 2025 (crédits d'impôts détaillés)</>,
          <>
            ACOSS / URSSAF — chiffrage des allègements de cotisations sociales
          </>,
          <>
            Conseil des Prélèvements Obligatoires (CPO) — rapports thématiques
          </>,
        ]}
        methode={
          <>
            Les totaux sont volontairement <strong>arrondis à l'ordre de
            grandeur</strong>. Le périmètre exact des « aides aux
            entreprises » varie selon les sources (Cour des comptes : 110 Md€,
            France Stratégie : 80 à 200 Md€ selon inclusion ou non des
            allègements de cotisations). On affiche le chiffre central et on
            détaille les ~13 plus gros dispositifs (=~85 % du total).
          </>
        }
        limites={
          <>
            La long-tail (~150 dispositifs sectoriels &lt; 100 M€ chacun) est
            agrégée dans la dernière ligne. Les aides régionales (~5 Md€ sur
            ~1 500 dispositifs locaux) sont également agrégées. Pour la
            précision dispositif par dispositif, voir Voies et moyens tome II
            et aides-entreprises.fr.
          </>
        }
        miseAJour="Données 2023-2024 (sources publiées 2024-2025). Mise à jour annuelle prévue après publication des rapports de la Cour des comptes."
      />
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function KpiBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/80 border border-purple-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-purple-700 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
      }`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  );
}

function abbrev(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
