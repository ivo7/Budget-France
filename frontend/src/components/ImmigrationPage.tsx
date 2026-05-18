// ============================================================================
// ImmigrationPage — coûts ET recettes budgétaires liés à l'immigration
// ============================================================================
//
// Route : #/immigration
//
// ⚠ Approche strictement factuelle et neutre. La page présente :
//   - Les populations concernées (chiffres INSEE)
//   - Les flux annuels (titres séjour, asile, OQTF…)
//   - Les coûts budgétaires directs (~7 Md€/an)
//   - Les contributions des immigrés (~48 Md€/an)
//   - Les études économiques sur le solde net (OCDE, France Stratégie, IPP)
//   - Les mythes courants (des deux bords du débat) avec leur réfutation
//
// Le but pédagogique est de donner les ordres de grandeur officiels et
// de présenter les différentes méthodologies plutôt qu'une conclusion.
// ============================================================================

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
  POPULATION_IMMIGREE,
  FLUX_ANNUELS,
  COUTS_BUDGETAIRES,
  CONTRIBUTIONS_IMMIGRES,
  ETUDES_SOLDE_NET,
  MYTHES_IMMIGRATION,
  TOTAL_COUTS_DIRECTS,
  TOTAL_CONTRIBUTIONS,
  POPULATION_IMMIGREE_TOTALE_M,
  PART_IMMIGRES_PCT,
} from "../data/immigration";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function ImmigrationPage() {
  // Données pour le bar chart "Coûts vs Contributions"
  const barData = [
    {
      name: "Coûts budgétaires directs",
      value: TOTAL_COUTS_DIRECTS,
      color: "#dc2626",
      hint: "AME, ADA, MNA, hébergement, OFII, CRA…",
    },
    {
      name: "Contributions fiscales/sociales",
      value: TOTAL_CONTRIBUTIONS,
      color: "#16a34a",
      hint: "Cotisations, IR, CSG, TVA, taxes locales",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-50 to-white border border-amber-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
          Angle mort · Approche factuelle neutre
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Immigration : coûts, recettes, mythes
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Sujet politiquement clivant traité ici avec une seule règle :{" "}
          <strong>les chiffres officiels et toutes les sources affichées</strong>.
          On présente les <strong>coûts</strong> ET les <strong>contributions</strong>{" "}
          des immigrés au budget de l'État, ainsi que les principales études
          économiques sur le solde net (OCDE, France Stratégie, IPP). Aucune
          conclusion partisane : les ordres de grandeur, les méthodologies, et
          les limites de chaque chiffre.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Population immigrée"
            value={`${POPULATION_IMMIGREE_TOTALE_M.toFixed(1)} M`}
            hint={`${PART_IMMIGRES_PCT.toFixed(1)} % de la population (INSEE)`}
          />
          <KpiBox
            label="Solde migratoire"
            value="+161 000/an"
            hint="vs +900 000 Allemagne (post-Covid)"
          />
          <KpiBox
            label="Coûts directs"
            value={`~${TOTAL_COUTS_DIRECTS.toFixed(1)} Md€`}
            hint="AME, ADA, MNA, OFII, hébergement…"
          />
          <KpiBox
            label="Contributions"
            value={`~${TOTAL_CONTRIBUTIONS.toFixed(0)} Md€`}
            hint="cotisations + impôts versés"
          />
        </div>
      </header>

      {/* Avertissement méthodologique */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          ⚠️ Avant de lire : 3 précautions méthodologiques
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            <strong>1. Le périmètre fait varier les chiffres du simple au
            triple.</strong> « Immigré au sens INSEE » (né étranger à
            l'étranger, qu'il ait gardé ou non sa nationalité d'origine) = 7 M.
            « Étranger » (nationalité étrangère, qu'il soit né en France ou
            ailleurs) = 5,4 M. « Descendants d'immigrés » (Français de
            naissance) = 7,5 M. Les chiffres-chocs jouent souvent sur cette
            confusion.
          </p>
          <p>
            <strong>2. Coût et contribution s'analysent ensemble.</strong> On
            voit souvent des « X Md€ de coût » sans les <em>recettes</em>{" "}
            qu'apportent les immigrés (cotisations sociales, impôts, TVA).
            Cette page affiche les deux faces.
          </p>
          <p>
            <strong>3. Le solde net dépend du temps long.</strong> Un jeune
            actif immigré contribue positivement aujourd'hui mais coûtera plus
            tard à la retraite. Les études sérieuses (OCDE, France Stratégie,
            IPP) raisonnent sur une carrière complète, voire sur 50 ans.
          </p>
        </div>
      </section>

      {/* Démographie : qui sont les immigrés en France ? */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Qui sont les immigrés en France ?
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          4 définitions très différentes pour ne pas confondre les ordres de
          grandeur. Source : INSEE 2024.
        </p>
        <ul className="grid md:grid-cols-2 gap-3">
          {POPULATION_IMMIGREE.map((p) => (
            <li
              key={p.label}
              className="border border-slate-200 rounded-xl p-4 hover:border-amber-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  <span className="text-xl mr-2">{p.emoji}</span>
                  {p.label}
                </h3>
                <span className="font-display text-xl font-bold tabular-nums text-amber-700 shrink-0">
                  {p.population.toFixed(1)} M
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {p.description}
              </p>
              <div className="mt-2 text-[10px] text-slate-400">
                Source : {p.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Flux annuels */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Les flux annuels (entrées, asile, départs)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Sources : DGEF (titres séjour, OQTF), OFPRA (asile), INSEE (solde
          migratoire). Année de référence : 2023.
        </p>
        <ul className="space-y-2">
          {FLUX_ANNUELS.map((f) => (
            <li
              key={f.label}
              className="border border-slate-200 rounded-lg p-4 hover:border-amber-400 transition flex flex-wrap items-start gap-3"
            >
              <div className="text-2xl shrink-0">{f.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {f.label}
                  </h3>
                  <span className="font-display text-lg font-bold tabular-nums text-amber-700">
                    {f.valeurAnnuelle.toLocaleString("fr-FR")}/an
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {f.description}
                </p>
                <div className="mt-1 text-[10px] text-slate-400">
                  Source : {f.source}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bar chart Coûts vs Contributions */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Coûts vs Contributions : la balance budgétaire brute
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Comparaison directe des deux faces. Attention : les études économiques
          incluent des éléments indirects (logement social, scolaire, etc.) qui
          peuvent rapprocher les deux montants. Voir section « Études » plus
          bas.
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 130, bottom: 8 }}
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
                dataKey="name"
                stroke="#475569"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)} Md€`,
                  "Montant",
                ]}
                labelFormatter={(label, payload) =>
                  (payload as { payload?: { hint?: string } }[])?.[0]?.payload
                    ?.hint ?? label
                }
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-3 italic">
          Lecture : à périmètre direct (postes budgétaires identifiables),
          les contributions des immigrés sont nettement supérieures aux
          coûts. Les études économiques plus complètes (incluant retraites
          futures, services publics par tête) aboutissent à un solde net{" "}
          <strong>proche de zéro</strong> ou légèrement positif.
        </p>
      </section>

      {/* Détail des coûts */}
      <DownloadableCard
        filename="immigration-couts-budgetaires"
        shareTitle="Budget France — Coûts budgétaires de l'immigration"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            COUTS_BUDGETAIRES.map((c, i) => ({
              rang: i + 1,
              poste: c.poste,
              montant_md_eur: c.montantMdEur,
              ministere: c.ministere,
              source: c.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail des coûts budgétaires directs
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          {COUTS_BUDGETAIRES.length} postes identifiables totalisant{" "}
          <strong>~{TOTAL_COUTS_DIRECTS.toFixed(1)} Md€/an</strong>. Périmètre
          : politiques publiques spécifiquement dédiées à l'immigration et à
          l'intégration.
        </p>
        <ul className="space-y-3">
          {COUTS_BUDGETAIRES.sort((a, b) => b.montantMdEur - a.montantMdEur).map(
            (c, i) => (
              <li
                key={c.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-amber-400 transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-2 flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xl mr-1">{c.emoji}</span>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {c.poste}
                    </h3>
                  </div>
                  <span className="font-display text-lg font-bold tabular-nums text-rose-700 shrink-0">
                    {c.montantMdEur.toFixed(2)} Md€
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                  {c.description}
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  <strong>Ministère :</strong> {c.ministere}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Source : {c.source}
                </div>
              </li>
            ),
          )}
        </ul>
      </DownloadableCard>

      {/* Contributions des immigrés */}
      <section className="card p-5 md:p-6 bg-emerald-50/20 border-emerald-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Contributions fiscales et sociales des immigrés
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          La face rarement présentée. Estimations France Stratégie, IPP, OFCE.
          Périmètre : impôts et cotisations sociales payés par les immigrés en
          emploi (~2,5 M de personnes).
        </p>
        <ul className="space-y-3">
          {CONTRIBUTIONS_IMMIGRES.map((c) => (
            <li
              key={c.poste}
              className="border border-emerald-200/60 bg-white rounded-xl p-4 hover:border-emerald-500 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{c.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {c.poste}
                  </h3>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-emerald-700 shrink-0">
                  ~{c.montantMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {c.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {c.source}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-emerald-100/50 border border-emerald-300 rounded-lg text-sm">
          <strong>Total estimé : ~{TOTAL_CONTRIBUTIONS.toFixed(0)} Md€/an</strong>{" "}
          (cotisations + impôts + TVA + taxes locales). À comparer aux ~
          {TOTAL_COUTS_DIRECTS.toFixed(1)} Md€ de coûts directs spécifiques.
        </div>
      </section>

      {/* Études économiques */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          4 études économiques sur le solde net
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Études les plus citées en France. Méthodologies différentes,
          conclusions parfois opposées. À regarder ensemble plutôt
          qu'isolément.
        </p>
        <ul className="space-y-3">
          {ETUDES_SOLDE_NET.map((e) => (
            <li
              key={e.source}
              className="border border-slate-200 rounded-xl p-4 hover:border-amber-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {e.source}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {e.annee}
                </span>
              </div>
              <div className="text-sm font-medium text-amber-800 bg-amber-50 border-l-2 border-amber-400 px-3 py-1.5 rounded-r my-2">
                <strong>Conclusion :</strong> {e.conclusion}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {e.resume}
              </p>
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-brand hover:underline"
                >
                  Source ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Mythes */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          6 idées reçues sur l'immigration
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Mythes courants <em>des deux côtés du débat</em>, confrontés aux
          chiffres officiels (INSEE, Cour des comptes, OCDE).
        </p>
        <ul className="space-y-3">
          {MYTHES_IMMIGRATION.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-amber-400 transition"
            >
              <div className="text-sm font-display font-semibold text-slate-900 mb-2">
                {m.mythe}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                {m.realite}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>7,0 millions d'immigrés au sens INSEE</strong> (10,4 % de
            la population), dont 5,4 M d'étrangers et ~0,7 M en situation
            irrégulière estimée (Cour des comptes 2020).
          </>,
          <>
            Solde migratoire net France : <strong>+161 000/an</strong>. Pour
            référence : Allemagne +900 000 (post-Covid), Espagne +330 000,
            Italie +280 000. La France est dans la moyenne basse OCDE par
            habitant.
          </>,
          <>
            <strong>Coûts directs spécifiques ~{TOTAL_COUTS_DIRECTS.toFixed(1)} Md€/an</strong>{" "}
            (AME, ADA, OFPRA, OFII, CRA, MNA, hébergement asile, Frontex,
            scolarité). Le plus gros poste = MNA (2 Md€), suivi de
            l'Éducation nationale (1,5 Md€) et de l'AME (1,2 Md€).
          </>,
          <>
            <strong>Contributions ~{TOTAL_CONTRIBUTIONS.toFixed(0)} Md€/an</strong>{" "}
            (cotisations sociales 35, IR/CSG 4, TVA 8, taxes locales 1,5). À
            périmètre direct, la balance budgétaire est <strong>nettement
            excédentaire</strong> pour les finances publiques.
          </>,
          <>
            <strong>Solde net selon les études économiques</strong> : OCDE
            +0,4 % PIB, France Stratégie quasi-neutre, IPP zéro. Une étude
            isolée (Observatoire de l'immigration) parle de -30 Md€ avec une
            méthodologie élargie. La majorité des économistes mainstream
            placent l'effet <strong>proche de zéro</strong>.
          </>,
          <>
            <strong>OQTF : taux d'exécution ~7 %</strong>. Pas un problème de
            volonté politique uniquement mais surtout de coopération
            consulaire (40 % des cas bloqués par absence de laissez-passer).
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.insee.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              INSEE
            </a>{" "}
            — Insee Première « Immigrés et descendants d'immigrés » (2024),
            Bilan démographique annuel
          </>,
          <>
            <a
              href="https://www.ccomptes.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Cour des comptes
            </a>{" "}
            — rapport thématique « L'entrée, le séjour et le premier accueil
            des personnes étrangères » (2020, mis à jour 2024)
          </>,
          <>
            <a
              href="https://www.immigration.interieur.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              DGEF
            </a>{" "}
            (Intérieur) — statistiques mensuelles séjour, OQTF, naturalisations
          </>,
          <>
            <a
              href="https://www.ofpra.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OFPRA
            </a>{" "}
            et OFII — rapports d'activité annuels (asile, accueil, intégration)
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
            — rapport « Immigration et intégration » (2023)
          </>,
          <>
            <a
              href="https://www.ipp.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              IPP
            </a>{" "}
            — études économétriques sur l'effet budgétaire net
          </>,
          <>
            <a
              href="https://www.oecd.org/migration/imo.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OCDE
            </a>{" "}
            — Perspectives des migrations internationales (édition 2024)
          </>,
          <>
            DREES — études sur l'AME et les dépenses santé des publics
            précaires
          </>,
        ]}
        methode={
          <>
            <strong>Coûts</strong> : on retient les postes budgétaires
            explicitement dédiés à l'immigration et à l'asile (missions
            ministérielles « Immigration, asile, intégration », AME au PLFSS,
            MNA aux conseils départementaux). Les coûts indirects (parts
            estimées de Sécu, logement social, éducation) sont mentionnés
            quand chiffrés par des sources officielles, mais le périmètre
            principal reste celui des postes <em>spécifiques</em>.
            <br />
            <br />
            <strong>Contributions</strong> : extrapolation à partir du
            nombre d'immigrés en emploi (~2,5 M) et du salaire moyen
            (~80 % du salaire médian national), croisé avec les taux de
            cotisations et l'incidence fiscale moyenne (étude France
            Stratégie 2023).
            <br />
            <br />
            <strong>Études</strong> : on présente les 4 références les plus
            citées (OCDE, France Stratégie, IPP, Observatoire) sans choisir
            entre elles. Chaque méthodologie a ses limites.
          </>
        }
        limites={
          <>
            Le nombre d'irréguliers est une estimation (entre 600 000 et
            900 000) impossible à mesurer précisément par définition. Les
            MNA sont contestés sur le statut de « mineur » (tests d'âge
            controversés). Les coûts de scolarité utilisent une estimation
            indicative — la donnée officielle DEPP ne distingue pas
            précisément les élèves « primo-arrivants ».
            <br />
            <br />
            La page <strong>ne tranche pas</strong> sur le solde net : les
            économistes eux-mêmes divergent. L'objectif est pédagogique :
            permettre à chaque lecteur de juger en connaissance des
            ordres de grandeur, pas de promouvoir un point de vue.
          </>
        }
        miseAJour="Données 2023-2024 (sources publiées 2024-2025). Mise à jour annuelle prévue après publication des rapports INSEE, DGEF et OFPRA."
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
    <div className="bg-white/80 border border-amber-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-amber-700 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
