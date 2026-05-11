// ============================================================================
// FiscaliteSecteurPage — fiscalité comparée par taille et secteur
// ============================================================================
//
// Route : #/fiscalite-secteur
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
  CAS_EMBLEMATIQUES,
  COMPARAISON_FISCALE_INTERNATIONALE,
  FISCALITE_PAR_SECTEUR,
  FISCALITE_PAR_TAILLE,
  TAUX_EFFECTIF_MOYEN_CAC40,
  TAUX_EFFECTIF_MOYEN_PME,
  TAUX_NOMINAL_FRANCE,
} from "../data/fiscaliteSecteur";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function FiscaliteSecteurPage() {
  // Bar chart : taux effectif par taille
  const barDataTaille = FISCALITE_PAR_TAILLE.map((f) => ({
    nom: f.taille.length > 25 ? f.taille.slice(0, 24) + "…" : f.taille,
    nomComplet: f.taille,
    taux: f.tauxEffectifIs,
    color:
      f.tauxEffectifIs < 20
        ? "#7c3aed"
        : f.tauxEffectifIs < 25
          ? "#0055A4"
          : "#16a34a",
  }));

  // Bar chart : taux effectif par secteur
  const barDataSecteur = [...FISCALITE_PAR_SECTEUR]
    .sort((a, b) => a.tauxEffectifIs - b.tauxEffectifIs)
    .map((f) => ({
      nom: f.secteur.length > 28 ? f.secteur.slice(0, 27) + "…" : f.secteur,
      nomComplet: f.secteur,
      taux: f.tauxEffectifIs,
      emoji: f.emoji,
      color:
        f.tauxEffectifIs < 15
          ? "#dc2626"
          : f.tauxEffectifIs < 22
            ? "#d97706"
            : "#16a34a",
    }));

  const ecart = TAUX_EFFECTIF_MOYEN_PME - TAUX_EFFECTIF_MOYEN_CAC40;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-indigo-700 font-semibold">
          Fiscalité comparée · Impôt sur les sociétés
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Toutes les entreprises ne paient pas le même impôt
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Le taux nominal de l'impôt sur les sociétés en France est{" "}
          <strong>{TAUX_NOMINAL_FRANCE} %</strong> depuis 2022. Mais le taux{" "}
          <strong>effectivement</strong> payé varie énormément selon la taille
          et le secteur :{" "}
          <strong>{TAUX_EFFECTIF_MOYEN_CAC40} % pour le CAC 40</strong>,{" "}
          <strong>{TAUX_EFFECTIF_MOYEN_PME} % pour les PME</strong>. Un écart
          de <strong>{ecart.toFixed(1)} points</strong> que cette page décortique.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Taux nominal IS"
            value={`${TAUX_NOMINAL_FRANCE} %`}
            hint="depuis 2022 (vs 33,3 % en 2018)"
            color="text-indigo-700"
          />
          <KpiBox
            label="CAC 40 (effectif)"
            value={`${TAUX_EFFECTIF_MOYEN_CAC40} %`}
            hint="IPP / Cour des comptes 2024"
            color="text-purple-700"
          />
          <KpiBox
            label="PME (effectif)"
            value={`${TAUX_EFFECTIF_MOYEN_PME} %`}
            hint="proche du nominal"
            color="text-emerald-700"
          />
          <KpiBox
            label="Écart"
            value={`${ecart.toFixed(0)} pts`}
            hint="entre PME et CAC 40"
            color="text-red-700"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Pourquoi tant d'écart ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Le taux <strong>nominal</strong> est ce qui est écrit dans le Code
            général des impôts (25 % depuis 2022). Le taux <strong>effectif</strong>{" "}
            est ce que l'entreprise paie vraiment, après application :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>Crédits d'impôt</strong> : CIR (jusqu'à 7,2 Md€/an,
              concentré sur les grands groupes), CICE résiduel, crédits sectoriels
              (cinéma, audiovisuel…)
            </li>
            <li>
              • <strong>Intégration fiscale</strong> : un groupe avec filiales
              peut consolider les pertes des unes avec les bénéfices des autres
              (régime accessible dès 95 % de participation)
            </li>
            <li>
              • <strong>Régime mère-fille</strong> : exonération à 95 % des
              dividendes reçus d'une filiale détenue à 5 % minimum (~24 Md€ de
              base fiscale exonérée /an)
            </li>
            <li>
              • <strong>Report de déficits</strong> : pertes passées déductibles
              sur 10 ans (sans limite avant 2012, limité depuis)
            </li>
            <li>
              • <strong>Prix de transfert internationaux</strong> : pour les
              groupes multinationaux, possibilité (légale mais contrôlée) de
              localiser les bénéfices dans des pays à fiscalité douce (Irlande,
              Luxembourg, Pays-Bas, Suisse)
            </li>
          </ul>
          <p>
            Plus l'entreprise est <strong>grande et internationale</strong>, plus
            elle peut utiliser ces leviers. Les PME purement nationales paient
            quasiment le taux plein.
          </p>
        </div>
      </section>

      {/* Bar chart : taille */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Taux effectif d'IS selon la taille de l'entreprise
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Plus l'entreprise grandit, plus son taux effectif descend. Le CAC 40
          est ~10 points en dessous des PME.
        </p>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDataTaille}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 140, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v} %`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                domain={[0, 30]}
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
                formatter={(value: number) => [`${value.toFixed(1)} %`, "Taux effectif IS"]}
                labelFormatter={(label, payload) =>
                  (payload as { payload?: { nomComplet?: string } }[])?.[0]?.payload
                    ?.nomComplet ?? label
                }
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]}>
                {barDataTaille.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Liste détaillée */}
        <ul className="mt-5 space-y-3">
          {FISCALITE_PAR_TAILLE.map((f) => (
            <li
              key={f.taille}
              className="border border-slate-200 rounded-lg p-4 hover:border-indigo-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">{f.taille}</strong>
                <div className="flex items-baseline gap-3 text-xs">
                  <span className="text-slate-500">{f.effectif}</span>
                  <span className="font-display text-lg font-bold tabular-nums text-slate-900">
                    {f.tauxEffectifIs.toFixed(1)} %
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {f.description}
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <strong>Taux nominal :</strong> {f.tauxNominal} %
                </div>
                <div>
                  <strong>Cotis. patronales moy. :</strong> {f.cotisPatronalesPct} % du brut
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bar chart : secteur */}
      <DownloadableCard
        filename="fiscalite-secteur"
        shareTitle="Budget France — Fiscalité par secteur"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            FISCALITE_PAR_SECTEUR.map((f) => ({
              secteur: f.secteur,
              taux_effectif_is: f.tauxEffectifIs,
              surtaxes: f.surtaxes ?? "",
              niches: f.niches ?? "",
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Taux effectif par secteur d'activité
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Numérique en bas de tableau (9 %), distribution et industrie en haut
          (~25 %). Différences expliquées par la délocalisation des bénéfices et
          les niches sectorielles.
        </p>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDataSecteur}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 140, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v} %`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                domain={[0, 30]}
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
                formatter={(value: number) => [`${value.toFixed(1)} %`, "Taux effectif IS"]}
                labelFormatter={(label, payload) =>
                  (payload as { payload?: { nomComplet?: string } }[])?.[0]?.payload
                    ?.nomComplet ?? label
                }
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]}>
                {barDataSecteur.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-5 space-y-3">
          {FISCALITE_PAR_SECTEUR.map((f) => (
            <li
              key={f.secteur}
              className="border border-slate-200 rounded-lg p-4 hover:border-indigo-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900 flex items-baseline gap-2">
                  <span>{f.emoji}</span> {f.secteur}
                </strong>
                <span className="font-display text-lg font-bold tabular-nums text-slate-900">
                  {f.tauxEffectifIs.toFixed(1)} %
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {f.description}
              </p>
              {f.niches && (
                <div className="mt-2 text-[11px] text-slate-600">
                  <strong>Niches/optimisations :</strong> {f.niches}
                </div>
              )}
              {f.surtaxes && (
                <div className="mt-1 text-[11px] text-slate-600">
                  <strong>Surtaxes spécifiques :</strong> {f.surtaxes}
                </div>
              )}
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Cas emblématiques */}
      <section className="card p-5 md:p-6 bg-red-50/30 border-red-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Cas emblématiques de très faible IS
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Quelques exemples documentés (par la DGFiP, le PNF ou la presse économique)
          d'entreprises ayant payé un IS très faible en France grâce à des
          structures fiscales internationales — toutes légales mais agressivement
          optimisées, plusieurs ayant abouti à des redressements.
        </p>
        <ul className="space-y-3">
          {CAS_EMBLEMATIQUES.map((c, i) => (
            <li
              key={i}
              className="border border-red-200/60 bg-white rounded-lg p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">
                  {c.entreprise}
                  <span className="ml-2 text-xs text-slate-500 font-normal">
                    {c.secteur} · {c.annee}
                  </span>
                </strong>
                <span className="font-display text-base font-bold text-red-700">
                  {c.tauxEffectif}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">{c.contexte}</p>
              <div className="mt-2 text-[10px] text-slate-400">Source : {c.source}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Comparaison internationale */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Comparaison internationale (taux IS 2024)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Taux nominal et taux effectif moyen des grandes entreprises. La France
          était la plus taxée d'Europe en 2018 (33,3 %), elle est passée dans la
          moyenne depuis 2022.
        </p>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Pays</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Nominal</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Effectif (grands groupes)</th>
                <th className="py-2 pr-3 font-semibold">Tendance</th>
                <th className="py-2 pr-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {COMPARAISON_FISCALE_INTERNATIONALE.map((c) => {
                const isFrance = c.pays === "France";
                return (
                  <tr
                    key={c.pays}
                    className={`border-b border-slate-100 ${isFrance ? "bg-brand-soft/40 font-semibold" : ""}`}
                  >
                    <td className="py-2 pr-3"><span className="mr-1.5">{c.drapeau}</span>{c.pays}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.tauxNominalIs.toFixed(1)} %</td>
                    <td className="py-2 pr-3 tabular-nums font-semibold">{c.tauxEffectif.toFixed(1)} %</td>
                    <td className="py-2 pr-3 text-xs">{c.tendance}</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{c.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 italic leading-relaxed">
          <strong>Pillar 2 OCDE</strong> (entré en vigueur 2024) impose un taux
          effectif minimum de <strong>15 %</strong> aux multinationales (CA &gt;
          750 M€). Limite la course au moins-disant fiscal des paradis fiscaux
          (Irlande, Luxembourg) sans uniformiser totalement.
        </p>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>Taux nominal IS France = {TAUX_NOMINAL_FRANCE} %</strong>{" "}
            depuis 2022 (vs 33,3 % en 2018). Dans la moyenne européenne
            désormais, en dessous de l'Allemagne.
          </>,
          <>
            <strong>Écart majeur entre tailles d'entreprises</strong> :{" "}
            <strong>{TAUX_EFFECTIF_MOYEN_CAC40} % effectif pour le CAC 40</strong>{" "}
            (Cour des comptes 2024) vs <strong>{TAUX_EFFECTIF_MOYEN_PME} % pour les
            PME</strong>. L'écart vient de l'optimisation internationale
            (prix de transfert) et de l'intégration fiscale.
          </>,
          <>
            <strong>Numérique = secteur le moins taxé</strong> (~9 % effectif)
            grâce à la localisation des bénéfices en Irlande/Luxembourg. Taxe
            GAFA depuis 2019 + Pillar 2 OCDE depuis 2024 réduisent l'écart.
          </>,
          <>
            <strong>Banques, distribution, BTP, industrie ancrée localement</strong>{" "}
            : taux effectif proche du nominal (22-26 %). Peu de marge
            d'optimisation pour ces secteurs.
          </>,
          <>
            <strong>Pillar 2 OCDE</strong> : 15 % minimum effectif pour les
            multinationales &gt; 750 M€ CA. Mise en œuvre 2024-2025. Réduit
            (sans supprimer) la concurrence fiscale internationale.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.ipp.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Institut des Politiques Publiques (IPP)
            </a>{" "}
            — notes méthodologiques sur le taux effectif d'IS
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
            — rapport 2024 « L'impôt sur les sociétés des grands groupes »
          </>,
          <>
            Conseil des Prélèvements Obligatoires (CPO) — rapports thématiques
          </>,
          <>INSEE — comptes sectoriels des entreprises (ESANE)</>,
          <>
            <a
              href="https://ec.europa.eu/eurostat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Eurostat
            </a>{" "}
            / OCDE — Taxation Trends 2024
          </>,
        ]}
        methode={
          <>
            Le <strong>taux effectif</strong> est défini comme : IS effectivement
            payé / résultat fiscal national avant report de déficits. Périmètre
            France uniquement (hors filiales étrangères). Année de référence
            2023. Les chiffres par secteur sont des moyennes pondérées, à
            interpréter avec prudence (variabilité intra-secteur élevée).
          </>
        }
        limites={
          <>
            Le taux effectif est une mesure imparfaite : il ne prend pas en
            compte les autres impôts (CVAE supprimée, CFE, taxe foncière, taxe
            sur les salaires) qui pèsent sur certains secteurs. Pour une vision
            globale, voir le rapport CPO « fiscalité globale des entreprises ».
          </>
        }
        miseAJour="Données 2023-2024 (rapports IPP et Cour des comptes publiés 2024-2025)."
      />
    </div>
  );
}

// ============================================================================
// KpiBox
// ============================================================================

function KpiBox({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <div className="bg-white/80 border border-indigo-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-indigo-700 font-semibold">
        {label}
      </div>
      <div
        className={`font-display text-xl md:text-2xl font-bold tabular-nums mt-0.5 ${color}`}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
