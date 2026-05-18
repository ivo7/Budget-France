// ============================================================================
// InegalitesFiscalesPage — distribution des prélèvements par décile
// ============================================================================
//
// Route : #/inegalites-fiscales
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
  DECILES,
  GINI_COMPARAISON,
  GINI_FRANCE_APRES,
  GINI_FRANCE_AVANT,
  MYTHES_INEGALITES,
  REDUCTION_GINI_FR,
  TAUX_PRELEVEMENTS_OBLIGATOIRES_PIB,
} from "../data/inegalitesFiscales";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function InegalitesFiscalesPage() {
  // Bar chart taux effectif par décile
  const barData = DECILES.map((d) => ({
    nom: d.decile,
    taux: d.tauxEffectifTotalPct,
    color:
      d.decile.startsWith("Top 0,01")
        ? "#dc2626"
        : d.decile.startsWith("Top 0,1")
          ? "#ea580c"
          : d.decile.startsWith("Top 1")
            ? "#d97706"
            : d.decile === "D10"
              ? "#0055A4"
              : "#16a34a",
  }));

  // Bar chart Gini comparaison
  const ginirData = GINI_COMPARAISON.map((g) => ({
    nom: `${g.drapeau} ${g.pays}`,
    avant: g.giniAvant,
    apres: g.giniApres,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-orange-50 to-white border border-orange-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-orange-700 font-semibold">
          Distribution fiscale · IPP / INSEE / CPO
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Inégalités fiscales par décile
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Qui paie quoi exactement ? Le système français de prélèvements
          obligatoires (~{TAUX_PRELEVEMENTS_OBLIGATOIRES_PIB} % du PIB) n'est pas{" "}
          <em>autant progressif</em> qu'on le croit. Tous les déciles paient un
          taux effectif TOTAL autour de 46-51 %, sauf le{" "}
          <strong>top 0,01 % qui retombe à ~28 %</strong> grâce au flat tax sur
          le capital et aux niches du patrimoine.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Décile médian (D5)"
            value="50 %"
            hint="taux effectif total"
          />
          <KpiBox
            label="Top 10 % (D10)"
            value="50,5 %"
            hint="à peine plus que la médiane"
          />
          <KpiBox
            label="Top 0,01 %"
            value="28 %"
            hint="dégressif au sommet"
            color="text-red-700"
          />
          <KpiBox
            label="Réduction Gini par redistribution"
            value={`-${REDUCTION_GINI_FR} pts`}
            hint={`de ${GINI_FRANCE_AVANT}% à ${GINI_FRANCE_APRES}%`}
            color="text-emerald-700"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Comment lire ces chiffres
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Le « taux effectif total » inclut <strong>TOUS</strong> les
            prélèvements obligatoires :
          </p>
          <ul className="ml-3 space-y-1 text-sm">
            <li>
              • <strong>IR</strong> (impôt sur le revenu) — progressif, 0 à 45 %
            </li>
            <li>
              • <strong>CSG / CRDS</strong> — proportionnel, ~9,7 % du salaire brut
            </li>
            <li>
              • <strong>Cotisations sociales</strong> salariales + patronales —
              proportionnel, ~22 % à 42 % du salaire brut selon strate
            </li>
            <li>
              • <strong>Impôts indirects</strong> (TVA, TICPE) — fortement régressif
              (les pauvres consomment tout, les riches épargnent)
            </li>
            <li>
              • <strong>Impôts locaux</strong> (taxe foncière, TEOM…) — relativement
              proportionnel
            </li>
          </ul>
          <p>
            Méthodologie IPP : on rapporte le total payé sur le{" "}
            <strong>revenu disponible</strong> du foyer (méthode standard
            internationale OCDE). La somme s'avère étonnamment plate autour de
            50 % pour tous les déciles 1 à 10, avec une <strong>dégressivité au
            sommet</strong> (top 0,1 % et 0,01 %) due aux revenus du capital
            taxés au flat tax 30 % plutôt qu'au barème progressif.
          </p>
        </div>
      </section>

      {/* Bar chart taux effectif */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Taux effectif total par décile
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Tous les prélèvements (IR + CSG + cotisations + indirects + locaux),
          en % du revenu disponible. Sources : IPP TAXIPP 2024, INSEE ERFS.
        </p>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nom" stroke="#64748b" tick={{ fontSize: 11 }} interval={0} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v} %`}
                domain={[0, 60]}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} %`, "Taux effectif total"]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="taux" radius={[4, 4, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-xs text-slate-600 italic">
          ▶ Observation choc : taux quasi-plat à 46-51 % entre D1 (pauvres) et
          D10 (aisés). <strong>Dégressivité visible</strong> au top 1 %, top
          0,1 %, et surtout top 0,01 % qui ne paie que 28 %.
        </div>
      </section>

      {/* Tableau détail par décile */}
      <DownloadableCard
        filename="prelevements-par-decile"
        shareTitle="Budget France — Prélèvements par décile"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            DECILES.map((d) => ({
              decile: d.decile,
              revenu_mensuel_net_moyen_eur: d.revenuMensuelMoyen,
              patrimoine_moyen_eur: d.patrimoineMoyen,
              taux_effectif_total_pct: d.tauxEffectifTotalPct,
              part_ir_pct: d.partIrPct,
              part_cotisations_pct: d.partCotisationsPct,
              part_csg_pct: d.partCsgPct,
              part_indirects_pct: d.partIndirectsPct,
              part_locaux_pct: d.partLocauxPct,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail par décile
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Pour chaque décile : revenu mensuel net moyen par unité de
          consommation, patrimoine net moyen, décomposition des prélèvements.
        </p>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2 font-semibold">Décile</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">Revenu/mois</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">Patrimoine</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">Taux total</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">dont IR</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">dont cotis.</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">dont CSG</th>
                <th className="py-2 pr-2 font-semibold tabular-nums text-right">dont TVA+</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {DECILES.map((d) => {
                const isTop = d.decile.startsWith("Top");
                const isD5 = d.decile === "D5";
                const isTop001 = d.decile === "Top 0,01%";
                return (
                  <tr
                    key={d.decile}
                    className={`border-b border-slate-100 ${
                      isTop001 ? "bg-red-50/60 font-semibold" :
                      isTop ? "bg-orange-50/40" :
                      isD5 ? "bg-emerald-50/30 font-semibold" : ""
                    }`}
                  >
                    <td className="py-2 pr-2 font-medium">{d.decile}</td>
                    <td className="py-2 pr-2 tabular-nums text-right">
                      {d.revenuMensuelMoyen.toLocaleString("fr-FR")} €
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-right">
                      {d.patrimoineMoyen.toLocaleString("fr-FR")} €
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-right">
                      <strong>{d.tauxEffectifTotalPct.toFixed(1)} %</strong>
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-right">{d.partIrPct.toFixed(1)}</td>
                    <td className="py-2 pr-2 tabular-nums text-right">{d.partCotisationsPct.toFixed(1)}</td>
                    <td className="py-2 pr-2 tabular-nums text-right">{d.partCsgPct.toFixed(1)}</td>
                    <td className="py-2 pr-2 tabular-nums text-right">{d.partIndirectsPct.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 italic leading-relaxed">
          Surligné en <span className="bg-emerald-50/60 px-1">vert</span> : décile médian D5 (référence). En{" "}
          <span className="bg-orange-50/40 px-1">orange</span> : top 1 %, top 0,1 %. En{" "}
          <span className="bg-red-50/60 px-1">rouge</span> : top 0,01 % (dégressivité maximale).
        </p>
      </DownloadableCard>

      {/* Détail descriptif par décile */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Profil de chaque décile
        </h2>
        <ul className="space-y-3">
          {DECILES.map((d) => (
            <li
              key={d.decile}
              className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">{d.decile}</strong>
                <div className="flex items-baseline gap-3 text-xs">
                  <span className="text-slate-500">
                    {d.revenuMensuelMoyen.toLocaleString("fr-FR")} €/mois
                  </span>
                  <span className="font-display text-base font-bold tabular-nums text-slate-900">
                    {d.tauxEffectifTotalPct.toFixed(1)} %
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {d.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Gini comparaison internationale */}
      <section className="card p-5 md:p-6 bg-emerald-50/30 border-emerald-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Coefficient de Gini : avant vs après redistribution
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le Gini mesure les inégalités de revenu : 0 = égalité parfaite, 100 =
          inégalité extrême. La <strong>France redistribue massivement</strong> :
          le Gini chute de {GINI_FRANCE_AVANT} (très inégalitaire) à{" "}
          {GINI_FRANCE_APRES} (parmi les plus égalitaires de l'OCDE).
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ginirData}
              margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nom" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}`}
                domain={[0, 60]}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="avant" fill="#dc2626" name="Avant redistribution" radius={[4, 4, 0, 0]} />
              <Bar dataKey="apres" fill="#16a34a" name="Après redistribution" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-600" />
            <span>Gini avant redistribution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600" />
            <span>Gini après redistribution</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-3 italic leading-relaxed">
          La France a la <strong>plus forte réduction de Gini par redistribution
          publique de l'OCDE</strong> (~23 points), devant la Suède, l'Allemagne,
          le Royaume-Uni. C'est le revers du fort taux de prélèvements obligatoires.
        </p>
      </section>

      {/* Mythes */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 idées reçues sur la fiscalité française
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le débat public est plein de raccourcis sur « qui paie quoi ». Voici
          ce que disent les données IPP / CPO / INSEE.
        </p>
        <ul className="space-y-3">
          {MYTHES_INEGALITES.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition"
            >
              <div className="text-sm font-display font-semibold text-slate-900 mb-1">
                {m.mythe}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">{m.realite}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>Tous les déciles D1 à D10 paient autour de 46-51 %</strong>{" "}
            de prélèvements obligatoires totaux. La progressivité est{" "}
            <strong>très faible</strong> sur l'essentiel de la population.
          </>,
          <>
            La <strong>vraie progressivité de l'IR (max 45 %)</strong> est
            masquée par les autres prélèvements (CSG, cotisations, TVA) qui
            sont proportionnels ou régressifs et représentent 86 % du total.
          </>,
          <>
            <strong>Top 0,01 % (~3 700 foyers) : taux effectif ~28 %</strong>{" "}
            grâce au flat tax 30 % sur le capital, aux niches patrimoniales
            (Pacte Dutreil, assurance-vie) et à l'optimisation. Étude
            Bozio/Goupille-Lebret/Garbinti IPP 2023.
          </>,
          <>
            <strong>La TVA est massivement régressive</strong> : elle pèse
            13,5 % du revenu pour D1, vs 0 % pour D9 (qui épargne 30 % de
            leur revenu, donc échappent à la TVA sur cette part).
          </>,
          <>
            La France reste <strong>l'un des pays les plus redistributifs de
            l'OCDE</strong> : Gini -23 points par la redistribution publique,
            devant la Suède. Le système marche EN AGGRÉGÉ — c'est la
            distribution AU SOMMET qui pose question.
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
            — modèle TAXIPP de micro-simulation fiscale (2024)
          </>,
          <>
            INSEE — Enquêtes Revenus fiscaux et sociaux (ERFS),{" "}
            <a
              href="https://www.insee.fr/fr/statistiques?theme=14"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Indicateurs sociaux
            </a>
          </>,
          <>
            <a
              href="https://www.ccomptes.fr/fr/cpo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              CPO
            </a>{" "}
            — Conseil des Prélèvements Obligatoires, rapport fiscalité 2024
          </>,
          <>
            <a
              href="https://wid.world"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              World Inequality Database
            </a>{" "}
            — Piketty / Saez / Zucman pour le top 0,1 % et 0,01 %
          </>,
          <>
            Étude Bozio, Goupille-Lebret, Garbinti (IPP 2023) — « Predistribution
            vs Redistribution » : taux d'imposition effectif des plus hauts
            revenus en France
          </>,
          <>
            France Stratégie — Comité d'évaluation des réformes de la fiscalité
            du capital (rapport annuel)
          </>,
        ]}
        methode={
          <>
            Le taux effectif est calculé sur le <strong>revenu disponible
            ajusté par unité de consommation (UC)</strong> selon la méthode
            INSEE. Tous les prélèvements obligatoires sont sommés : IR + CSG +
            CRDS + cotisations sociales (salariales et patronales en équivalent
            coin fiscal) + impôts indirects (TVA, TICPE) + impôts locaux. Les
            cotisations patronales sont attribuées au salarié comme le veut
            la méthode standard de l'OCDE (incidence économique sur le travail).
          </>
        }
        limites={
          <>
            Les chiffres par décile sont des moyennes. La variabilité
            intra-décile est importante (effets de seuil IR, statuts
            cadre/non-cadre, présence enfants, propriétaire vs locataire). Les
            chiffres du top 0,01 % sont extrapolés des données fiscales (Piketty
            et al.) et restent débattus selon le périmètre exact des revenus
            du capital pris en compte. Le coefficient de Gini France 0,29 est
            mesuré sur les revenus disponibles, méthode INSEE.
          </>
        }
        miseAJour="Données 2022-2023, modèle TAXIPP IPP 2024."
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
  color = "text-orange-700",
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="bg-white/80 border border-orange-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-orange-700 font-semibold">
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
