// ============================================================================
// NichesFiscalesPage — les ~95 Md€/an de dépenses fiscales
// ============================================================================
//
// Page pédagogique sur les niches fiscales françaises : ce que c'est, combien
// ça coûte, qui en profite, et ce qu'en disent les évaluations indépendantes.
//
// Source des données : `data/nichesFiscales.ts` (top 25 par coût, sourcé
// Voies et moyens 2025, Cour des comptes, IPP, France Stratégie).
//
// Route : #/niches-fiscales
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
  CATEGORIES_INFO,
  NB_NICHES_TOTALES,
  NICHES_FISCALES,
  TOTAL_NICHES_MD_EUR_OFFICIEL,
  type CategorieNiche,
} from "../data/nichesFiscales";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

// Population française approximative pour le calcul €/Français
const POPULATION_FRANCE = 68_400_000;

type FilterValue = "tous" | CategorieNiche;

export function NichesFiscalesPage() {
  const [filter, setFilter] = useState<FilterValue>("tous");

  const allNiches = useMemo(
    () => [...NICHES_FISCALES].sort((a, b) => b.coutMdEur - a.coutMdEur),
    [],
  );

  const filtered = useMemo(() => {
    if (filter === "tous") return allNiches;
    return allNiches.filter((n) => n.categorie === filter);
  }, [allNiches, filter]);

  const totalAffiche = filtered.reduce((acc, n) => acc + n.coutMdEur, 0);
  const coutMoyenParFrancais = (TOTAL_NICHES_MD_EUR_OFFICIEL * 1e9) / POPULATION_FRANCE;

  // Top 15 pour le bar chart (toujours sur les filtrées)
  const topPourGraph = filtered.slice(0, 15).map((n) => ({
    nom: n.abbr ?? abbrev(n.nom, 26),
    nomComplet: n.nom,
    cout: n.coutMdEur,
    color: CATEGORIES_INFO[n.categorie].color,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-50 to-white border border-amber-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
          Angle mort des finances publiques
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Les niches fiscales — {TOTAL_NICHES_MD_EUR_OFFICIEL} Md€/an
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Chaque année, l'État{" "}
          <strong>renonce volontairement à percevoir ~{TOTAL_NICHES_MD_EUR_OFFICIEL} milliards d'euros</strong>{" "}
          d'impôts via {NB_NICHES_TOTALES} dispositifs dérogatoires — les
          « dépenses fiscales », plus connues sous le nom de niches. C'est
          l'équivalent d'<strong>environ {Math.round(coutMoyenParFrancais).toLocaleString("fr-FR")} €
          par Français</strong>, soit ~12 % des recettes fiscales de l'État.
        </p>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Coût annuel total"
            value={`${TOTAL_NICHES_MD_EUR_OFFICIEL} Md€`}
            hint="dépenses fiscales 2024"
          />
          <KpiBox
            label="Nombre de niches"
            value={String(NB_NICHES_TOTALES)}
            hint="dispositifs recensés"
          />
          <KpiBox
            label="Coût par Français"
            value={`${Math.round(coutMoyenParFrancais).toLocaleString("fr-FR")} €`}
            hint="manque à gagner moyen"
          />
          <KpiBox
            label="Évolution sur 10 ans"
            value="+18 Md€"
            hint="vs ~77 Md€ en 2014"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Qu'est-ce qu'une niche fiscale exactement ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Une <strong>dépense fiscale</strong> (le terme officiel) est une
            mesure de réduction d'impôt qui déroge à la règle générale, dans le
            but d'orienter le comportement des contribuables ou de soutenir
            certains secteurs / publics. Concrètement : crédit d'impôt, abattement,
            taux réduit de TVA, exonération, déduction.
          </p>
          <p>
            <strong>Pourquoi elles existent :</strong> chaque niche répond à un
            objectif politique précis (encourager la R&D, soutenir l'emploi à
            domicile, faciliter la transmission d'entreprise, aider la rénovation
            énergétique…). Elles ont souvent un sens à leur création.
          </p>
          <p>
            <strong>Pourquoi elles sont controversées :</strong> chaque niche
            créée tend à devenir permanente même quand son efficacité est
            douteuse. La <em>Cour des comptes</em>, <em>France Stratégie</em>{" "}
            et l'<em>IPP</em> évaluent régulièrement ces dispositifs et
            concluent souvent que le rapport coût/efficacité est mauvais ou que
            les bénéfices sont concentrés sur les ménages aisés. Pourtant, peu
            sont supprimées (lobbies, électoralisme).
          </p>
          <p>
            <strong>L'angle mort :</strong> le débat public se focalise sur le
            barème de l'impôt (« taxer les riches »), alors que{" "}
            <strong>le manque à gagner par les niches dépasse l'impôt sur la
            fortune supprimé en 2017</strong>{" "}
            de plusieurs ordres de grandeur (95 Md€ vs ~5 Md€).
          </p>
        </div>
      </section>

      {/* Filtres + Bar Chart */}
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Top 15 par coût {filter !== "tous" && (
              <span className="text-sm font-normal text-slate-500">
                · catégorie {CATEGORIES_INFO[filter].label}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            Total affiché : <strong>{totalAffiche.toFixed(1)} Md€</strong> ({filtered.length} niches)
          </span>
        </div>

        {/* Filtres catégories */}
        <div className="flex flex-wrap gap-2 mb-5">
          <FilterButton
            active={filter === "tous"}
            onClick={() => setFilter("tous")}
            label="Toutes"
            color="#475569"
          />
          {(Object.keys(CATEGORIES_INFO) as CategorieNiche[]).map((cat) => (
            <FilterButton
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={CATEGORIES_INFO[cat].label}
              color={CATEGORIES_INFO[cat].color}
            />
          ))}
        </div>

        {/* Bar chart Recharts horizontal */}
        <div className="h-[480px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topPourGraph}
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
                formatter={(value: number) => [`${value.toFixed(1)} Md€`, "Coût annuel"]}
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
                {topPourGraph.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Liste détaillée */}
      <DownloadableCard
        filename="niches-fiscales-top"
        shareTitle="Budget France — Top niches fiscales"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.map((n, i) => ({
              rang: i + 1,
              niche: n.nom,
              cout_md_eur: n.coutMdEur,
              categorie: CATEGORIES_INFO[n.categorie].label,
              beneficiaires: n.beneficiaires,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail des {filtered.length} niches
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Pour chaque dispositif : qui en bénéficie, justification d'origine, et
          conclusion des évaluations indépendantes.
        </p>

        <ul className="space-y-3">
          {filtered.map((n, i) => (
            <li
              key={n.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-brand/30 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {n.nom}
                    {n.abbr && (
                      <span className="ml-2 text-xs font-mono text-slate-500">
                        ({n.abbr})
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CATEGORIES_INFO[n.categorie].color}15`,
                      color: CATEGORIES_INFO[n.categorie].color,
                      border: `1px solid ${CATEGORIES_INFO[n.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_INFO[n.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-slate-900">
                    {n.coutMdEur.toFixed(1)} Md€
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {n.description}
              </p>

              <div className="mt-2 text-xs text-slate-600">
                <strong>Bénéficiaires :</strong> {n.beneficiaires}
              </div>

              {n.justification && (
                <div className="mt-1 text-xs text-slate-600">
                  <strong>Justification :</strong> {n.justification}
                </div>
              )}

              {n.evaluation && (
                <div className="mt-2 text-xs italic text-amber-800 bg-amber-50/60 border-l-2 border-amber-300 px-3 py-1.5 rounded-r">
                  <strong>Évaluation indépendante :</strong> {n.evaluation}
                </div>
              )}

              <div className="mt-2 text-[10px] text-slate-400">
                Source : {n.source}
              </div>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Catégories explicatives */}
      <section className="card p-5 md:p-6 bg-slate-50/50">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Comprendre les catégories
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {(Object.keys(CATEGORIES_INFO) as CategorieNiche[]).map((cat) => (
            <li key={cat} className="flex gap-3 items-start">
              <span
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ background: CATEGORIES_INFO[cat].color }}
              />
              <div>
                <strong className="text-slate-900">
                  {CATEGORIES_INFO[cat].label}
                </strong>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  {CATEGORIES_INFO[cat].description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <section className="rounded-2xl p-5 md:p-6 bg-slate-900 text-slate-50 border border-slate-800 shadow-card">
        <h2 className="font-display text-xl font-semibold mb-3 text-white">
          À retenir
        </h2>
        <ul className="space-y-2.5 text-sm leading-relaxed text-slate-100">
          <li>
            • Les niches fiscales coûtent <strong className="text-white">~95 Md€/an</strong>{" "}
            à l'État, soit l'équivalent du budget Éducation nationale.
          </li>
          <li>
            • La <strong className="text-white">moitié des niches profite à 10 % des contribuables</strong>{" "}
            — l'avantage fiscal est très inégalement réparti (Conseil des prélèvements
            obligatoires, 2018).
          </li>
          <li>
            • <strong className="text-white">Peu sont supprimées</strong> malgré des
            évaluations défavorables, à cause des lobbies et de l'électoralisme.
          </li>
          <li>
            • Le débat public se focalise sur le barème de l'IR ;{" "}
            <strong className="text-white">les niches sont l'angle mort</strong>{" "}
            qui mériterait autant d'attention.
          </li>
        </ul>
      </section>

      {/* Méthodologie */}
      <section className="card p-5 md:p-6">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Méthodologie & sources
        </div>
        <div className="text-xs text-slate-600 mt-2 space-y-1.5 leading-relaxed">
          <p>
            <strong>Données chiffrées :</strong> Voies et moyens — Tome II annexé au
            Projet de Loi de Finances 2025 (Bercy). Document officiel listant
            l'intégralité des dépenses fiscales avec leur coût estimé.
          </p>
          <p>
            <strong>Évaluations :</strong> rapports publics de la{" "}
            <a
              href="https://www.ccomptes.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Cour des comptes
            </a>
            , de l'
            <a
              href="https://www.ipp.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Institut des Politiques Publiques
            </a>
            , de{" "}
            <a
              href="https://www.strategie.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              France Stratégie
            </a>{" "}
            et du Conseil des prélèvements obligatoires.
          </p>
          <p>
            <strong>Limites :</strong> les estimations Bercy sont des « ordres de
            grandeur » (méthodologie variable selon dispositif, parfois contestée).
            Le top 25 affiché ici représente ~70 % du coût total — les 445 autres
            niches sont individuellement de plus faible montant.
          </p>
        </div>
      </section>
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
    <div className="bg-white/80 border border-amber-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && (
        <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
      )}
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
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
