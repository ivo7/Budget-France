// ============================================================================
// PsychiatriePage — santé mentale, psychiatrie, dépenses publiques et délais
// ============================================================================
//
// Route : #/psychiatrie
//
// Approche : sujet sensible, traité avec rigueur factuelle. Mise en avant
// du DÉLAI D'ACCÈS (6-18 mois CMP enfant) comme indicateur le plus parlant
// de la crise. Numéro 3114 (prévention suicide, gratuit, 24/7) mis en
// évidence en fin de page.
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
  POPULATIONS_PSY,
  DELAIS_ACCES,
  DEPENSES_PSY,
  ETUDES_PSY,
  MYTHES_PSY,
  CATEGORIES_PSY,
  TOTAL_DEPENSES_PSY_MD,
  COUT_SOCIAL_OCDE_MD,
  POPULATION_TOUCHEE_M,
  SUICIDES_AN,
  LITS_PSY_AUJOURDHUI,
  LITS_PSY_1980,
} from "../data/psychiatrie";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function PsychiatriePage() {
  const depensesSorted = [...DEPENSES_PSY].sort(
    (a, b) => b.montantMdEur - a.montantMdEur,
  );
  const barDepenses = depensesSorted.map((d) => ({
    nom: abbrev(d.poste, 32),
    nomComplet: d.poste,
    montant: d.montantMdEur,
    color: CATEGORIES_PSY[d.categorie].color,
  }));

  // Bar chart délais d'accès en jours (max)
  const barDelais = DELAIS_ACCES.map((d) => ({
    nom: abbrev(d.service, 32),
    nomComplet: d.service,
    delaiMax: d.delaiMax,
    delaiMin: d.delaiMin,
    color:
      d.delaiMax > 180
        ? "#dc2626"
        : d.delaiMax > 90
          ? "#f59e0b"
          : "#3b82f6",
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-white border border-cyan-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">
          Santé mentale · Angle mort majeur
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Psychiatrie : 1 Français sur 5 par an
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          <strong>~13 millions de Français</strong> connaissent un trouble
          psychique chaque année (Santé publique France, OCDE). Pourtant : 6 à
          18 mois d'attente pour un 1ᵉʳ rendez-vous CMP enfant, 53 000 lits
          psychiatriques (vs 250 000 en 1980), effectifs hospitaliers en chute.
          La Cour des comptes 2023 parle de <em>« crise systémique »</em>.
          Coût social estimé par l'OCDE : <strong>~{COUT_SOCIAL_OCDE_MD}{" "}Md€/an</strong> (4,3 % du PIB), pour ~
          {TOTAL_DEPENSES_PSY_MD.toFixed(0)} Md€ de dépenses publiques.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Personnes touchées/an"
            value={`~${POPULATION_TOUCHEE_M} M`}
            hint="1 Français sur 5 (OCDE)"
          />
          <KpiBox
            label="Dépenses publiques"
            value={`~${TOTAL_DEPENSES_PSY_MD.toFixed(0)} Md€`}
            hint="Soins + handicap psy (AAH)"
          />
          <KpiBox
            label="Coût social total"
            value={`~${COUT_SOCIAL_OCDE_MD} Md€`}
            hint="OCDE, 4,3 % du PIB"
          />
          <KpiBox
            label="Suicides/an"
            value={`~${SUICIDES_AN.toLocaleString("fr-FR")}`}
            hint="3ᵉ cause mortalité 15-29 ans"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          De quoi parle-t-on ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            La santé mentale couvre un spectre très large : dépression, anxiété
            généralisée, troubles bipolaires, schizophrénie, troubles du
            spectre autistique, troubles obsessionnels compulsifs, addictions,
            troubles de l'alimentation, troubles post-traumatiques.
          </p>
          <p>
            Le système français repose sur 3 piliers :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>L'hôpital psychiatrique</strong> (53 000 lits en 2024
              vs 250 000 en 1980) : pour les phases aiguës. Très inégalement
              réparti sur le territoire.
            </li>
            <li>
              • <strong>L'ambulatoire de secteur</strong> (CMP, CMPP, hôpitaux
              de jour) : porte d'entrée gratuite, mais délais saturés.
            </li>
            <li>
              • <strong>Le libéral</strong> (psychiatres et psychologues) :
              accès rapide mais reste à charge si secteur 2 ou psychologue non
              conventionné.
            </li>
          </ul>
          <p>
            <strong>Le point critique</strong> n'est pas tant le budget total
            (~{TOTAL_DEPENSES_PSY_MD.toFixed(0)} Md€/an, 2ᵉ poste hospitalier
            après l'hôpital général) que le <strong>parcours patient</strong> :
            entre les délais d'accès au CMP, les ruptures hôpital/ambulatoire
            et la pénurie de pédopsychiatres, la prise en charge est trop
            souvent dégradée — diagnostic Cour des comptes 2023.
          </p>
        </div>
      </section>

      {/* Populations */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          6 chiffres pour mesurer l'ampleur
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Populations touchées, en suivi, hospitalisées. Sources : Santé
          publique France, OCDE, ATIH.
        </p>
        <ul className="grid md:grid-cols-2 gap-3">
          {POPULATIONS_PSY.map((p) => (
            <li
              key={p.label}
              className="border border-slate-200 rounded-xl p-4 hover:border-cyan-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  <span className="text-xl mr-2">{p.emoji}</span>
                  {p.label}
                </h3>
                <span className="font-display text-xl font-bold tabular-nums text-cyan-700 shrink-0">
                  {p.population}
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

      {/* Délais d'accès — section phare */}
      <section className="card p-5 md:p-6 bg-rose-50/20 border-rose-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          ⏳ Combien de temps avant un rendez-vous ?
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Les délais d'accès aux soins sont l'indicateur le plus parlant de la
          crise. La rapidité d'intervention est pourtant déterminante en
          psychiatrie. Délais médians, en jours.
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDelais}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 160, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v} j`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="nom"
                stroke="#475569"
                tick={{ fontSize: 11 }}
                width={150}
                interval={0}
              />
              <Tooltip
                formatter={(v: number, _name, item) => {
                  const min = (item.payload as { delaiMin?: number })?.delaiMin ?? 0;
                  return [`${min}-${v} jours`, "Délai"];
                }}
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
              <Bar dataKey="delaiMax" radius={[0, 4, 4, 0]}>
                {barDelais.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2 mt-4">
          {DELAIS_ACCES.map((d, i) => (
            <li
              key={i}
              className="border border-rose-200/40 bg-white rounded-lg p-3 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <span className="font-display font-semibold text-slate-900">
                  <span className="text-lg mr-2">{d.emoji}</span>
                  {d.service}
                </span>
                <span className="font-display text-base font-bold tabular-nums text-rose-700">
                  {d.delaiMin}-{d.delaiMax} jours
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {d.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {d.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Dépenses */}
      <DownloadableCard
        filename="psychiatrie-depenses-publiques"
        shareTitle="Budget France — Dépenses publiques psychiatrie"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            depensesSorted.map((d, i) => ({
              rang: i + 1,
              poste: d.poste,
              categorie: CATEGORIES_PSY[d.categorie].label,
              montant_md_eur: d.montantMdEur,
              financeur: d.financeur,
              source: d.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Dépenses publiques santé mentale — détail
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          {DEPENSES_PSY.length} postes pour ~{TOTAL_DEPENSES_PSY_MD.toFixed(0)}{" "}
          Md€/an (périmètre élargi : Sécu + État + collectivités, hors
          médecine générale traitant aussi des troubles psy).
        </p>

        <div className="h-[440px] w-full mb-5">
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
              className="border border-slate-200 rounded-xl p-4 hover:border-cyan-400 transition"
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
                      background: `${CATEGORIES_PSY[d.categorie].color}15`,
                      color: CATEGORIES_PSY[d.categorie].color,
                      border: `1px solid ${CATEGORIES_PSY[d.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_PSY[d.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-cyan-700">
                    {d.montantMdEur.toFixed(2)} Md€
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {d.description}
              </p>
              <div className="mt-2 text-xs text-slate-600">
                <strong>Financeur :</strong> {d.financeur}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {d.source}
              </div>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Lits psy — chiffre choc */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Le grand virage de 1980-2024
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-amber-200/60 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
              Lits psychiatriques 1980
            </div>
            <div className="font-display text-3xl font-bold tabular-nums text-slate-900 mt-1">
              {LITS_PSY_1980.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Modèle asilaire historique
            </div>
          </div>
          <div className="bg-white border border-amber-200/60 rounded-lg p-4">
            <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
              Lits psychiatriques 2024
            </div>
            <div className="font-display text-3xl font-bold tabular-nums text-slate-900 mt-1">
              {LITS_PSY_AUJOURDHUI.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Soit -78 % en 44 ans
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-700 mt-4 leading-relaxed">
          La fermeture massive des lits psychiatriques (politique de
          désinstitutionnalisation à partir des années 1980) répondait à un
          objectif louable : sortir les patients des asiles. Mais l'OCDE et la
          Cour des comptes constatent qu'elle n'a <em>pas été suffisamment
          accompagnée</em> par le développement de l'ambulatoire de secteur.
          Conséquences : augmentation des hospitalisations sans consentement,
          des hospitalisations aux urgences générales, et des prises en charge
          tardives.
        </p>
      </section>

      {/* Études */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 rapports de référence
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          OCDE, Cour des comptes, IGAS, Santé publique France — diagnostics
          convergents.
        </p>
        <ul className="space-y-3">
          {ETUDES_PSY.map((e) => (
            <li
              key={e.source}
              className="border border-slate-200 rounded-xl p-4 hover:border-cyan-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {e.source}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {e.annee}
                </span>
              </div>
              <div className="text-sm font-medium text-cyan-800 bg-cyan-50 border-l-2 border-cyan-400 px-3 py-1.5 rounded-r my-2">
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
          6 idées reçues sur la santé mentale
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Sujet où la stigmatisation et les approximations sont nombreuses.
          Voici ce que disent les données et les agences sanitaires.
        </p>
        <ul className="space-y-3">
          {MYTHES_PSY.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-cyan-400 transition"
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

      {/* Encart 3114 — ressources crise */}
      <section className="card p-5 md:p-6 bg-blue-50/40 border-blue-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          📞 Si vous ou un proche traversez une période difficile
        </h2>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4">
            <div className="font-display text-2xl font-bold text-blue-700 mb-1">
              3114 — Numéro national de prévention du suicide
            </div>
            <p className="text-sm">
              <strong>Gratuit, anonyme, 24h/24, 7j/7.</strong> Lancé en octobre
              2021, accessible depuis toute la France. Écoute par des
              professionnels de santé spécifiquement formés (infirmiers,
              psychologues, médecins).
            </p>
            <a
              href="https://3114.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-700 hover:underline"
            >
              3114.fr ↗
            </a>
          </div>
          <p>
            D'autres ressources existent selon les besoins : SOS Amitié
            (09 72 39 40 50), Suicide Écoute (01 45 39 40 00), Fil Santé Jeunes
            (32 24, jusqu'à 25 ans), médecin traitant, CMP du secteur.
            Les urgences (15, 112) restent disponibles en cas de crise aiguë.
          </p>
          <p className="text-xs text-slate-600 italic">
            Cette page est une lecture budgétaire — elle ne remplace pas une
            consultation. Parler à un professionnel ou à une personne de
            confiance est toujours possible et utile.
          </p>
        </div>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>~13 millions de Français touchés/an</strong> par un trouble
            psychique (1 sur 5 selon Santé publique France et OCDE).
            1ʳᵉ cause d'arrêt maladie longue durée et 1ʳᵉ cause d'AAH.
          </>,
          <>
            Dépenses publiques santé mentale : <strong>~
            {TOTAL_DEPENSES_PSY_MD.toFixed(0)} Md€/an</strong> (hôpital psy,
            CMP, médicaments, AAH psy, ESMS). Coût social TOTAL estimé par
            l'OCDE à ~{COUT_SOCIAL_OCDE_MD} Md€/an (4,3 % du PIB).
          </>,
          <>
            <strong>Délais d'accès critiques</strong> : 2-6 mois CMP adulte,{" "}
            <strong>6-18 mois CMP enfant</strong>. La pédopsychiatrie est
            l'angle mort majeur : urgences saturées, pénurie de spécialistes.
          </>,
          <>
            <strong>53 000 lits psychiatriques</strong> aujourd'hui vs 250 000
            en 1980 (-78 %). La désinstitutionnalisation n'a pas été
            suffisamment accompagnée par l'ambulatoire selon la Cour des
            comptes 2023.
          </>,
          <>
            <strong>~{SUICIDES_AN.toLocaleString("fr-FR")} décès par
            suicide/an</strong> en France (24/jour). 3ᵉ cause de mortalité
            chez les 15-29 ans. Le 3114 (gratuit, 24/7) est le numéro national
            de prévention depuis octobre 2021.
          </>,
          <>
            <strong>MonSoutienPsy</strong> (12 séances/an chez psy
            conventionné) a touché ~750 000 personnes en 2024. Progrès réel
            mais insuffisant : seulement ~15 % des psychologues conventionnés,
            limitation à 12 séances inadaptée aux troubles chroniques.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.oecd.org/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OCDE
            </a>{" "}
            — « A New Benchmark for Mental Health Systems » (2021), estimation
            coût santé mentale France
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
            — « Les parcours dans l'organisation des soins de psychiatrie »
            (février 2023)
          </>,
          <>
            <a
              href="https://www.santepubliquefrance.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Santé publique France
            </a>{" "}
            — surveillance dépression, suicide, baromètre santé mentale
          </>,
          <>
            <a
              href="https://www.has-sante.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              HAS
            </a>{" "}
            — recommandations diagnostiques et thérapeutiques
          </>,
          <>
            <a
              href="https://www.igas.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              IGAS
            </a>{" "}
            — rapports inspection psychiatrie, sectorisation (2021)
          </>,
          <>
            <a
              href="https://www.atih.sante.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              ATIH
            </a>{" "}
            — données activité hospitalière et financement
          </>,
          <>CNAM — comptes santé, ALD 23, MonSoutienPsy</>,
          <>DREES — comptes nationaux santé, AAH</>,
          <>INSERM CépiDc — statistiques causes de décès</>,
        ]}
        methode={
          <>
            <strong>Dépenses</strong> : périmètre incluant Sécu (hôpital psy,
            ambulatoire CMP, ALD, médicaments, MonSoutienPsy), État (AAH part
            psy), CNSA (ESMS handicap psy). Hors médecine générale traitant
            des troubles psy (qui représente ~30 % des consultations en MG
            selon HAS).
            <br />
            <br />
            <strong>Coût social OCDE</strong> : agrégat large incluant soins
            directs (~24 Md€), perte de productivité (arrêts maladie, AAH,
            invalidité, ~80 Md€), coût indirect aidants et baisse qualité vie
            (~60 Md€). Méthodologie standardisée OCDE applicable à la France.
            <br />
            <br />
            <strong>Délais d'accès</strong> : moyennes nationales issues du
            rapport Cour des comptes 2023 (qui a interrogé ~50 CMP) et de
            l'IGAS 2021. Forte variation territoriale.
          </>
        }
        limites={
          <>
            La frontière entre « psychiatrie » et « santé mentale au sens
            large » est conventionnelle. Beaucoup de troubles légers sont
            traités en médecine générale (~30 % des consultations MG selon
            HAS) sans entrer dans les comptes ci-dessus.
            <br />
            <br />
            Les statistiques de suicide sont sous-estimées de ~10-15 %
            (causes de décès « indéterminées » qui en sont en réalité). Les
            tentatives sont elles aussi mal recensées.
            <br />
            <br />
            La page ne couvre pas les conséquences du système : taux de
            recours aux urgences générales (faute d'alternative), recours
            aux secteurs psychiatrie privée non remboursée pour les ménages
            aisés (~5 % du marché), prison comme alternative aux soins (~30 %
            des détenus avec un trouble psy diagnostiqué selon OIP).
          </>
        }
        miseAJour="Données 2023-2024. Mise à jour annuelle prévue après publication des comptes CNAM et études de la Cour des comptes."
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
    <div className="bg-white/80 border border-cyan-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-cyan-700 font-semibold">
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
