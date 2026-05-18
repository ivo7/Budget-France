// ============================================================================
// ClimatPage — budget climat : dépenses, niches défavorables, besoins invest
// ============================================================================
//
// Route : #/climat
//
// Approche : ordre de grandeur, sources officielles (I4CE, Cour des comptes,
// Pisani-Ferry, HCC, Banque de France). On présente côte à côte ce que la
// France dépense pour le climat, ce qu'elle dépense CONTRE le climat (niches
// fiscales défavorables), les recettes carbone, et l'écart à combler selon
// les principaux rapports.
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
  DEPENSES_CLIMAT_PUBLIQUES,
  NICHES_DEFAVORABLES_CLIMAT,
  RECETTES_CARBONE,
  BESOIN_INVESTISSEMENT_PISANI_FERRY,
  ETUDES_CLIMAT,
  COUTS_PHYSIQUES_CLIMAT,
  MYTHES_CLIMAT,
  CATEGORIES_CLIMAT,
  TOTAL_DEPENSES_CLIMAT_MD,
  TOTAL_NICHES_DEFAVORABLES_MD,
  TOTAL_RECETTES_CARBONE_MD,
  TOTAL_COUTS_PHYSIQUES_MD,
  INVEST_CLIMAT_TOTAL_2023_MD,
  INVEST_CLIMAT_PUBLIC_2023_MD,
  BESOIN_ADDITIONNEL_PISANI_FERRY_MD,
} from "../data/climat";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function ClimatPage() {
  // Bar chart : Pisani-Ferry — actuel vs besoin
  const barEcart = [
    {
      name: "Invest. climat actuel (2023)",
      value: INVEST_CLIMAT_TOTAL_2023_MD,
      color: "#10b981",
      hint: "Public + privé (I4CE Panorama 2024)",
    },
    {
      name: "Besoin invest. annuel 2030",
      value: INVEST_CLIMAT_TOTAL_2023_MD + BESOIN_ADDITIONNEL_PISANI_FERRY_MD,
      color: "#f59e0b",
      hint: "Pisani-Ferry & Mahfouz (France Stratégie 2023)",
    },
  ];

  // Bar chart : dépenses publiques climat par poste
  const depensesSorted = [...DEPENSES_CLIMAT_PUBLIQUES].sort(
    (a, b) => b.montantMdEur - a.montantMdEur,
  );
  const barDepenses = depensesSorted.map((d) => ({
    nom: abbrev(d.poste, 30),
    nomComplet: d.poste,
    montant: d.montantMdEur,
    color: CATEGORIES_CLIMAT[d.categorie].color,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
          Transition écologique · Ordres de grandeur officiels
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Climat : combien on dépense, combien il faudrait
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          La France investit <strong>~{INVEST_CLIMAT_TOTAL_2023_MD} Md€/an</strong>{" "}
          (public + privé) pour le climat en 2023 selon I4CE. Le rapport de
          référence Pisani-Ferry estime qu'il faut{" "}
          <strong>~+{BESOIN_ADDITIONNEL_PISANI_FERRY_MD} Md€/an
          d'investissements additionnels</strong> d'ici 2030 pour tenir les
          objectifs (SNBC : -55 % émissions vs 1990). En parallèle, ~10 Md€ de
          niches fiscales défavorables au climat subsistent. Page pédagogique :
          chiffres, sources, débats.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Invest. climat 2023"
            value={`${INVEST_CLIMAT_TOTAL_2023_MD} Md€`}
            hint="Public + privé (I4CE)"
          />
          <KpiBox
            label="Dont public"
            value={`${INVEST_CLIMAT_PUBLIC_2023_MD} Md€`}
            hint="État + collectivités + Sécu"
          />
          <KpiBox
            label="Besoin additionnel"
            value={`+${BESOIN_ADDITIONNEL_PISANI_FERRY_MD} Md€/an`}
            hint="Pisani-Ferry 2023, horizon 2030"
          />
          <KpiBox
            label="Niches défavorables"
            value={`~${TOTAL_NICHES_DEFAVORABLES_MD.toFixed(0)} Md€/an`}
            hint="Subventions fossiles résiduelles"
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
            « Budget climat » est un terme imprécis. Selon le périmètre, on
            obtient des chiffres très différents :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>Investissements climat (I4CE)</strong> ~110 Md€/an
              (public + privé) : rénovation, transports propres, EnR, nucléaire
              neuf, etc. C'est l'agrégat le plus large et le plus utilisé.
            </li>
            <li>
              • <strong>Dépenses publiques climat</strong> ~33 Md€/an : la part
              État + collectivités + Sécu sur le total ci-dessus.
            </li>
            <li>
              • <strong>« Budget vert » de l'État</strong> (PLF) : ~32 Md€
              identifiés en 2024 comme « favorables » au climat, vs ~10 Md€
              « défavorables » et ~120 Md€ « neutres ». Méthode encore en
              construction.
            </li>
            <li>
              • <strong>Besoin additionnel</strong> ~66 Md€/an (Pisani-Ferry) :
              le manque pour atteindre les objectifs SNBC 2030. C'est la donnée
              la plus politique : qui paie, dette ou impôt ?
            </li>
          </ul>
        </div>
      </section>

      {/* Bar chart écart Pisani-Ferry */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          L'écart à combler selon Pisani-Ferry
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Investissements climat actuels vs niveau requis pour tenir les
          objectifs SNBC 2030 (-55 % émissions vs 1990).
        </p>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barEcart}
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
                formatter={(v: number) => [`${v.toFixed(0)} Md€/an`, "Montant"]}
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
                {barEcart.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-3 italic">
          L'écart de ~{BESOIN_ADDITIONNEL_PISANI_FERRY_MD} Md€/an correspond
          aux investissements supplémentaires nécessaires (public + privé)
          d'ici 2030. La moitié relèverait du public selon Pisani-Ferry.
          C'est l'équivalent d'un point de PIB.
        </p>
      </section>

      {/* Dépenses publiques climat par poste */}
      <DownloadableCard
        filename="climat-depenses-publiques"
        shareTitle="Budget France — Dépenses publiques climat"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            depensesSorted.map((d, i) => ({
              rang: i + 1,
              poste: d.poste,
              categorie: CATEGORIES_CLIMAT[d.categorie].label,
              montant_md_eur: d.montantMdEur,
              source: d.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Dépenses publiques climat — détail par poste
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          {DEPENSES_CLIMAT_PUBLIQUES.length} postes pour ~
          {TOTAL_DEPENSES_CLIMAT_MD.toFixed(1)} Md€/an. Périmètre principal des
          dépenses publiques fléchées climat (hors PAC non-verdie et hors
          fiscalité TICPE).
        </p>

        <div className="h-[400px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDepenses}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 140, bottom: 8 }}
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
                width={130}
                interval={0}
              />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} Md€/an`, "Montant"]}
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
              <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                {barDepenses.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-3">
          {depensesSorted.map((d, i) => (
            <li
              key={d.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-emerald-400 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl mr-1">{d.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {d.poste}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CATEGORIES_CLIMAT[d.categorie].color}15`,
                      color: CATEGORIES_CLIMAT[d.categorie].color,
                      border: `1px solid ${CATEGORIES_CLIMAT[d.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_CLIMAT[d.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-emerald-700">
                    {d.montantMdEur.toFixed(1)} Md€
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {d.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {d.source}
              </div>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Niches défavorables */}
      <section className="card p-5 md:p-6 bg-rose-50/30 border-rose-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Niches fiscales défavorables au climat
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Avantages fiscaux qui réduisent le prix des énergies fossiles, donc
          augmentent leur usage. Total : ~
          {TOTAL_NICHES_DEFAVORABLES_MD.toFixed(0)} Md€/an. À comparer aux ~
          {TOTAL_DEPENSES_CLIMAT_MD.toFixed(0)} Md€ de dépenses POUR le climat
          : c'est l'équivalent d'un quart des efforts qui sont annulés
          fiscalement.
        </p>
        <ul className="space-y-3">
          {NICHES_DEFAVORABLES_CLIMAT.map((n) => (
            <li
              key={n.id}
              className="border border-rose-200/60 bg-white rounded-xl p-4 hover:border-rose-400 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{n.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {n.poste}
                  </h3>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-rose-700 shrink-0">
                  {n.montantMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {n.description}
              </p>
              <div className="mt-2 text-xs text-slate-600">
                <strong>Bénéficiaires :</strong> {n.beneficiaires}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {n.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recettes carbone */}
      <section className="card p-5 md:p-6 bg-amber-50/20 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Recettes fiscales liées au carbone
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          La fiscalité écologique rapporte ~{TOTAL_RECETTES_CARBONE_MD.toFixed(0)} Md€/an. Mais
          attention : la TICPE n'est <em>pas</em> affectée au climat — c'est une
          recette générale. Le débat « pollueur-payeur » est sur l'usage de ces
          recettes.
        </p>
        <ul className="space-y-3">
          {RECETTES_CARBONE.map((r, i) => (
            <li
              key={i}
              className="border border-amber-200/60 bg-white rounded-xl p-4 hover:border-amber-500 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{r.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {r.poste}
                  </h3>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-amber-700 shrink-0">
                  ~{r.montantMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {r.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {r.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Besoin investissement Pisani-Ferry */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Où investir les +66 Md€/an (Pisani-Ferry)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Décomposition du besoin d'investissement additionnel selon le rapport
          Pisani-Ferry & Mahfouz, France Stratégie 2023.
        </p>
        <ul className="space-y-3">
          {BESOIN_INVESTISSEMENT_PISANI_FERRY.map((b, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-xl p-4 hover:border-emerald-400 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{b.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {b.poste}
                  </h3>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-emerald-700 shrink-0">
                  +{b.besoinMdEur.toFixed(0)} Md€/an
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {b.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Coûts physiques */}
      <section className="card p-5 md:p-6 bg-orange-50/20 border-orange-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Coûts physiques déjà visibles
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Impacts budgétaires actuels du changement climatique : sécheresses,
          inondations, santé, agriculture, forêt. Total identifié : ~
          {TOTAL_COUTS_PHYSIQUES_MD.toFixed(0)} Md€/an et en hausse rapide.
        </p>
        <ul className="space-y-3">
          {COUTS_PHYSIQUES_CLIMAT.map((c, i) => (
            <li
              key={i}
              className="border border-orange-200/60 bg-white rounded-xl p-4 hover:border-orange-500 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{c.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {c.poste}
                  </h3>
                </div>
                <span className="font-display text-lg font-bold tabular-nums text-orange-700 shrink-0">
                  ~{c.montantMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Horizon : {c.horizon}
              </p>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {c.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {c.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Études économiques */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 études économiques de référence
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Les rapports les plus cités dans le débat français. Conclusions
          convergentes : agir coûte moins cher que ne pas agir, mais l'effort
          d'investissement est massif.
        </p>
        <ul className="space-y-3">
          {ETUDES_CLIMAT.map((e) => (
            <li
              key={e.source}
              className="border border-slate-200 rounded-xl p-4 hover:border-emerald-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {e.source}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {e.annee}
                </span>
              </div>
              <div className="text-sm font-medium text-emerald-800 bg-emerald-50 border-l-2 border-emerald-400 px-3 py-1.5 rounded-r my-2">
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
          6 idées reçues sur le climat
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Mythes courants des deux bords du débat — confrontés aux données
          officielles (Banque de France, I4CE, Cour des comptes, HCC, RTE).
        </p>
        <ul className="space-y-3">
          {MYTHES_CLIMAT.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-emerald-400 transition"
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
            <strong>~{INVEST_CLIMAT_TOTAL_2023_MD} Md€/an</strong>{" "}
            d'investissements climat en France en 2023 (public + privé, I4CE),
            dont ~{INVEST_CLIMAT_PUBLIC_2023_MD} Md€ de dépense publique.
          </>,
          <>
            Besoin additionnel selon Pisani-Ferry : <strong>+
            {BESOIN_ADDITIONNEL_PISANI_FERRY_MD} Md€/an</strong> d'ici 2030
            (dont moitié public). Équivalent d'un point de PIB. Question :
            comment financer (dette, impôt, redéploiement) ?
          </>,
          <>
            Niches fiscales défavorables au climat : ~
            <strong>{TOTAL_NICHES_DEFAVORABLES_MD.toFixed(0)} Md€/an</strong>{" "}
            (gazole pro, kérosène, GNR agricole…). À comparer aux ~
            {TOTAL_DEPENSES_CLIMAT_MD.toFixed(0)} Md€ de dépenses POUR le
            climat.
          </>,
          <>
            <strong>Coût de l'inaction ≫ coût de l'action</strong> (Banque de
            France 2020) : sans transition, pertes PIB -10 à -30 % en 2050
            (catastrophes, agriculture, santé). Coût d'action estimé à -0,3
            point PIB court terme, neutre à long terme (Pisani-Ferry).
          </>,
          <>
            Émissions France 2023 : <strong>-4,8 % vs 2022</strong> (HCC). Mais
            le rythme doit doubler pour atteindre -55 % vs 1990 en 2030
            (objectif SNBC).
          </>,
          <>
            France ~4,5 tCO2/hab — bien sous moyenne UE (8) et US (15) grâce
            au nucléaire. Mais loin de l'objectif{" "}
            <strong>2 tCO2/hab en 2050</strong>. Les transports, le bâtiment,
            l'agriculture et l'industrie représentent 80 % des émissions
            restantes.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.i4ce.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              I4CE
            </a>{" "}
            — Panorama des financements climat, édition 2024 (référence
            annuelle des chiffres climat France)
          </>,
          <>
            <a
              href="https://www.strategie.gouv.fr/publications/incidences-economiques-de-laction-climat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Pisani-Ferry & Mahfouz
            </a>{" "}
            — « Les incidences économiques de l'action pour le climat » (France
            Stratégie, mai 2023)
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
            — « La stratégie de l'État face au changement climatique » (2024)
          </>,
          <>
            <a
              href="https://www.hautconseilclimat.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Haut Conseil pour le Climat (HCC)
            </a>{" "}
            — rapports annuels
          </>,
          <>
            <a
              href="https://www.ecologie.gouv.fr/strategie-nationale-bas-carbone-snbc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              SNBC
            </a>{" "}
            — Stratégie Nationale Bas-Carbone (révisée 2024)
          </>,
          <>
            <a
              href="https://www.banque-france.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Banque de France
            </a>{" "}
            — stress test climatique (2020, 2023)
          </>,
          <>
            <a
              href="https://www.rte-france.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              RTE
            </a>{" "}
            — Futurs énergétiques 2050 (2021, mis à jour)
          </>,
          <>Budget vert annexé au PLF — ministère de l'Économie</>,
          <>ADEME — études coûts/effets MaPrimeRénov', mobilités, EnR</>,
        ]}
        methode={
          <>
            <strong>Dépenses publiques climat</strong> : agrégation des
            principaux dispositifs identifiables comme « favorables au climat »
            par I4CE et le budget vert PLF. Hors PAC non-verdie, hors fiscalité
            sectorielle. Périmètre cohérent avec budget vert État, mais incluant
            collectivités.
            <br />
            <br />
            <strong>Niches défavorables</strong> : on retient les seules niches
            <em> identifiées explicitement</em> par le Conseil des Prélèvements
            Obligatoires et le Réseau Action Climat comme « subventions
            fossiles » au sens OCDE. Périmètre conservateur.
            <br />
            <br />
            <strong>Besoin invest. Pisani-Ferry</strong> : chiffres
            <em>arrondis par poste</em>. La somme arithmétique des 5 lignes
            dépasse 66 Md€ car certaines lignes incluent des effets compensés
            (rénovation = nouveaux invest mais aussi évitement de coûts
            énergie). Le « +66 Md€/an » est le chiffrage net du rapport.
          </>
        }
        limites={
          <>
            Le périmètre exact « climat » est débattu : faut-il inclure les
            transports en commun complets (utiles climat ET autres) ? Les
            EPR2 (décarbonés mais débat sur le coût et délai) ? Les
            agences de l'eau (adaptation mais pas atténuation) ?
            <br />
            <br />
            Le chiffre I4CE est en{" "}
            <strong>investissements bruts annuels</strong>, pas en coût net
            après bénéfices (économies d'énergie, santé, emplois). Le ROI
            réel de la transition n'est pas dans cette page.
            <br />
            <br />
            La page ne tranche pas sur le mix énergétique optimal (nucléaire
            vs renouvelables) : ce n'est pas une question budgétaire mais
            stratégique.
          </>
        }
        miseAJour="Données 2023-2024 (sources publiées 2024-2025). Mise à jour annuelle prévue après publication du Panorama I4CE et du HCC."
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
    <div className="bg-white/80 border border-emerald-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function abbrev(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
