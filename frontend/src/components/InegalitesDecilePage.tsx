// ============================================================================
// InegalitesDecilePage — répartition des revenus, impôts, patrimoine par décile
// ============================================================================
//
// Route : #/inegalites-decile
// ============================================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DECILES,
  GINI_FRANCE_APRES,
  GINI_INTERNATIONAL,
  NICHES_CAPTATION_DECILE,
  NIVEAU_VIE_MEDIAN_FRANCE,
  SEUIL_PAUVRETE_FRANCE,
  TAUX_PRELEVEMENTS_GLOBAL_FRANCE,
  TOP_DECILES,
} from "../data/inegalitesDecile";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function InegalitesDecilePage() {
  // Data pour bar chart : part revenu + part patrimoine par décile
  const barData = DECILES.map((d) => ({
    decile: d.decile,
    revenu: d.partRevenuPct,
    patrimoine: d.partPatrimoinePct,
  }));

  // Data pour line chart : taux de prélèvements par décile
  const tauxData = DECILES.map((d) => ({
    decile: d.decile,
    taux: d.tauxPrelevementsPct,
  }));

  // Trouver la France pour highlight dans le tableau Gini
  const giniFrance = GINI_INTERNATIONAL.find((g) => g.pays === "France");

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-rose-50 to-white border border-rose-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-rose-700 font-semibold">
          Inégalités · Économie publique
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Inégalités fiscales par décile
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Comment les revenus, les prélèvements obligatoires et le patrimoine
          se répartissent-ils entre les 10 déciles de la population française ?
          Les <strong>10 % les plus riches</strong> captent <strong>22,5 %
          des revenus</strong> et <strong>43 % du patrimoine</strong>. Le{" "}
          <strong>top 1 %</strong> à lui seul détient <strong>24 % du
          patrimoine</strong>. Cette page utilise les données INSEE/IPP/CPO
          pour donner la mesure exacte.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Niveau de vie médian"
            value={`${NIVEAU_VIE_MEDIAN_FRANCE.toLocaleString("fr-FR")} €`}
            hint="par UC/an (INSEE 2022)"
          />
          <KpiBox
            label="Seuil de pauvreté"
            value={`${SEUIL_PAUVRETE_FRANCE.toLocaleString("fr-FR")} €`}
            hint="60 % du médian"
          />
          <KpiBox
            label="Coef. Gini France"
            value={GINI_FRANCE_APRES.toFixed(2)}
            hint="après redistribution"
          />
          <KpiBox
            label="Prélèvements obligatoires"
            value={`${TAUX_PRELEVEMENTS_GLOBAL_FRANCE} %`}
            hint="du PIB (avg)"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Comment lire un décile ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Un <strong>décile</strong> est un dixième de la population
            ordonnée par niveau de vie croissant. D1 = les 10 % les plus
            pauvres (~6,8 millions de personnes), D10 = les 10 % les plus
            riches.
          </p>
          <p>
            Le <strong>niveau de vie</strong> n'est pas exactement le salaire :
            c'est le revenu disponible (après impôts et prestations) divisé par
            le nombre d'unités de consommation du ménage (1 pour le 1ᵉʳ adulte,
            0,5 pour les autres &gt; 14 ans, 0,3 pour les enfants &lt; 14 ans).
            Permet de comparer des ménages de tailles différentes.
          </p>
          <p>
            <strong>Coefficient de Gini</strong> : mesure synthétique des
            inégalités. 0 = égalité parfaite (tout le monde a le même revenu),
            1 = inégalité totale (une personne a tout). Plus utilisé au monde
            pour comparer entre pays.
          </p>
        </div>
      </section>

      {/* Bar chart : part revenu vs patrimoine */}
      <DownloadableCard
        filename="part-revenu-patrimoine-decile"
        shareTitle="Budget France — Inégalités par décile"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            DECILES.map((d) => ({
              decile: d.decile,
              niveau_vie_max_eur_uc: d.niveauVieMax === Infinity ? "n/a" : d.niveauVieMax,
              part_revenu_pct: d.partRevenuPct,
              part_patrimoine_pct: d.partPatrimoinePct,
              taux_prelevements_pct: d.tauxPrelevementsPct,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Captation des revenus et du patrimoine par décile
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Chaque décile pèse 10 % de la population. Si la richesse était
          équitablement répartie, chaque barre ferait exactement 10 %. L'écart
          montre le degré d'inégalité.
        </p>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="decile" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v} %`}
                domain={[0, 50]}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)} %`,
                  name === "revenu"
                    ? "Part du revenu"
                    : "Part du patrimoine",
                ]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              <Bar dataKey="revenu" fill="#0055A4" name="Revenu (%)" />
              <Bar dataKey="patrimoine" fill="#dc2626" name="Patrimoine (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed italic">
          Lecture : D10 (les 10 % les plus riches) capte <strong>22,5 % des
          revenus</strong> (2,25× la part équitable) et <strong>43 % du
          patrimoine</strong> (4,3× la part équitable). L'inégalité de
          patrimoine est nettement plus forte que celle des revenus, partout
          au monde.
        </p>
      </DownloadableCard>

      {/* Line chart : taux de prélèvements par décile */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Taux moyen de prélèvements obligatoires par décile
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Tous prélèvements confondus : IR, TVA, cotisations sociales, CSG,
          taxes locales, etc. Inclut donc bien plus que l'impôt sur le revenu
          seul. Source : Conseil des Prélèvements Obligatoires (CPO) 2024.
        </p>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tauxData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="decile" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v} %`}
                domain={[30, 60]}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(0)} %`, "Taux moyen"]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="taux"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ fill: "#7c3aed", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            <strong>Le système français est globalement progressif</strong> :
            le taux moyen passe de 38 % (D1) à 50 % (D10). Mais la progression
            est <strong>douce</strong> — moins forte que ce que beaucoup imaginent.
          </p>
          <p>
            La <strong>TVA</strong> et les <strong>cotisations sociales</strong>{" "}
            sont relativement plates en % du revenu (voire dégressives pour la
            TVA). Seuls l'IR et certaines taxes sur le capital sont fortement
            progressifs.
          </p>
          <p>
            ⚠ <strong>Le taux du top 0,1 % chute</strong> (à ~47 %, en dessous
            du D9) car le revenu vient majoritairement du capital (PFU 30 %
            forfaitaire plus avantageux que l'IR progressif) et profite plus
            des niches fiscales spécifiques (assurance-vie, PEA, Dutreil).
          </p>
        </div>
      </section>

      {/* Top 10%, 1%, 0,1% */}
      <section className="card p-5 md:p-6 bg-rose-50/30 border-rose-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Zoom sur le haut de la pyramide : top 10 %, 1 %, 0,1 %
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          La distribution s'écrase fortement au sommet. Le top 1 % et top 0,1 %
          ont des profils économiques distincts du reste du top 10 %.
        </p>

        <ul className="space-y-3">
          {TOP_DECILES.map((g) => (
            <li
              key={g.groupe}
              className="border border-rose-200/60 bg-white rounded-lg p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">
                  {g.groupe}
                  <span className="ml-2 text-xs text-slate-500 font-normal">
                    {g.effectif}
                  </span>
                </strong>
                <span className="text-xs text-slate-600">
                  Niveau de vie min :{" "}
                  <strong className="text-slate-900">
                    {g.niveauVieMin.toLocaleString("fr-FR")} €/UC
                  </strong>
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                <div className="bg-rose-50/60 rounded p-2 text-center">
                  <div className="text-[10px] uppercase text-rose-700 font-semibold">
                    Part des revenus
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">
                    {g.partRevenuPct} %
                  </div>
                </div>
                <div className="bg-rose-50/60 rounded p-2 text-center">
                  <div className="text-[10px] uppercase text-rose-700 font-semibold">
                    Part patrimoine
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">
                    {g.partPatrimoinePct} %
                  </div>
                </div>
                <div className="bg-rose-50/60 rounded p-2 text-center">
                  <div className="text-[10px] uppercase text-rose-700 font-semibold">
                    Taux prélèvements
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">
                    {g.tauxPrelevementsEffectifPct} %
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-3 leading-relaxed">
                {g.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Coefficient de Gini international */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Comparaison internationale (coefficient de Gini)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le coefficient de Gini <strong>avant</strong> (revenus de marché) vs
          <strong> après</strong> (revenu disponible après impôts et
          prestations). L'écart mesure l'effort redistributif du système
          fiscal et social.
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Pays</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Gini avant</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Gini après</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Réduction</th>
                <th className="py-2 pr-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {GINI_INTERNATIONAL.map((g) => {
                const isFrance = g.pays === "France";
                return (
                  <tr
                    key={g.pays}
                    className={`border-b border-slate-100 ${isFrance ? "bg-brand-soft/40 font-semibold" : ""}`}
                  >
                    <td className="py-2 pr-3">
                      <span className="mr-1.5">{g.drapeau}</span>
                      {g.pays}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{g.giniAvant.toFixed(2)}</td>
                    <td className="py-2 pr-3 tabular-nums font-semibold">
                      {g.giniApres.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">−{g.reductionPct} %</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {g.pays === "France" &&
                        "Parmi les pays les plus redistributifs OCDE"}
                      {g.pays === "Suède" &&
                        "Modèle nordique : moins d'inégalités marché + forte redistribution"}
                      {g.pays === "États-Unis" &&
                        "Inégalités marché élevées + faible redistribution = écart final énorme"}
                      {g.pays === "Royaume-Uni" &&
                        "Inégalités élevées même après redistribution"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-600 mt-3 italic leading-relaxed">
          La France est <strong>parmi les pays les plus redistributifs OCDE</strong>{" "}
          (réduction Gini de {giniFrance?.reductionPct} %). Le système fiscal et
          social rabote significativement les inégalités de marché, qui sont
          comparables aux États-Unis (0,52 vs 0,51) — mais le résultat final est
          très différent (Gini 0,30 vs 0,41).
        </p>
      </section>

      {/* Niches fiscales par décile */}
      <DownloadableCard
        filename="niches-captation-decile"
        shareTitle="Budget France — Niches fiscales par décile"
        className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60"
        getCsvData={() =>
          objectsToCsv(
            NICHES_CAPTATION_DECILE.map((n) => ({
              niche: n.niche,
              cout_md_eur: n.coutMdEur,
              part_top_20pct_capte: n.partD9D10Pct,
              description: n.description,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Qui profite des niches fiscales ?
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Part du bénéfice capté par les <strong>20 % les plus aisés</strong>{" "}
          (D9 + D10) pour quelques niches emblématiques. Source : France
          Stratégie 2024, Conseil des Prélèvements Obligatoires 2018.
        </p>

        <ul className="space-y-3">
          {NICHES_CAPTATION_DECILE.map((n) => (
            <li
              key={n.niche}
              className="border border-amber-200/60 bg-white rounded-lg p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">
                  {n.emoji} {n.niche}
                </strong>
                <div className="flex items-baseline gap-3 text-xs">
                  <span className="text-slate-500">
                    Coût : <strong>{n.coutMdEur.toFixed(1)} Md€/an</strong>
                  </span>
                  <span
                    className={`font-display font-bold ${
                      n.partD9D10Pct >= 70
                        ? "text-red-700"
                        : n.partD9D10Pct >= 40
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }`}
                  >
                    Top 20 % : {n.partD9D10Pct} %
                  </span>
                </div>
              </div>
              {/* Barre de progression */}
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    n.partD9D10Pct >= 70
                      ? "bg-red-500"
                      : n.partD9D10Pct >= 40
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${n.partD9D10Pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {n.description}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-xs text-slate-600 mt-4 italic leading-relaxed">
          La <strong>concentration des niches fiscales</strong> sur les hauts
          revenus est l'un des angles morts du débat. Quand on parle de
          fiscalité progressive, la progressivité de l'IR (qui monte avec le
          revenu) est partiellement neutralisée par des niches qui
          bénéficient davantage aux contribuables aisés.
        </p>
      </DownloadableCard>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            La <strong>moitié des Français</strong> a un niveau de vie
            inférieur à <strong>23 160 €/an par UC</strong> (médiane INSEE
            2022). 10 % vivent sous <strong>14 690 €</strong> (seuil de
            pauvreté).
          </>,
          <>
            Le <strong>top 10 %</strong> capte <strong>22,5 % des revenus</strong>{" "}
            et <strong>43 % du patrimoine</strong>. Le <strong>top 1 %</strong>{" "}
            détient à lui seul <strong>24 % du patrimoine</strong> national.
          </>,
          <>
            Le système fiscal français est <strong>progressif globalement</strong>{" "}
            (taux moyen 38 % en D1, 50 % en D10), mais{" "}
            <strong>le top 0,1 % redescend à ~47 %</strong> grâce aux niches du
            capital (assurance-vie, PEA, Dutreil, PFU).
          </>,
          <>
            La France est l'un des <strong>pays les plus redistributifs OCDE</strong>{" "}
            : Gini avant 0,52 → Gini après 0,30 (réduction de 42 %). Mais
            inégalités de patrimoine restent fortes même après redistribution.
          </>,
          <>
            Les <strong>niches fiscales</strong> bénéficient majoritairement aux
            top déciles (60-95 % de captation D9-D10 pour la plupart),
            réduisant la progressivité réelle du système.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.insee.fr/fr/statistiques?theme=11"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              INSEE
            </a>{" "}
            — ERFS (Enquête Revenus Fiscaux et Sociaux), édition 2024 (données 2022)
          </>,
          <>
            INSEE — « Revenus et patrimoine des ménages » (publication
            annuelle)
          </>,
          <>
            <a
              href="https://www.ipp.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Institut des Politiques Publiques (IPP)
            </a>{" "}
            — modèle de microsimulation TAXIPP
          </>,
          <>
            Conseil des Prélèvements Obligatoires (CPO) — rapport 2022 « Pour
            une fiscalité plus juste »
          </>,
          <>France Stratégie — études redistribution 2024</>,
          <>
            <a
              href="https://stats.oecd.org/Index.aspx?DataSetCode=IDD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OCDE
            </a>{" "}
            — Income Distribution Database (Gini international)
          </>,
        ]}
        methode={
          <>
            <strong>Niveau de vie</strong> = revenu disponible (après impôts et
            prestations) / unités de consommation. <strong>Décile</strong> =
            ordre croissant, chacun pèse 10 % de la population. Les{" "}
            <strong>taux de prélèvements</strong> sont des moyennes par décile
            (CPO) — inclut tous les prélèvements obligatoires (IR, TVA,
            cotisations, CSG, taxes locales, etc.). Les{" "}
            <strong>parts captation niches</strong> sont des estimations CPO
            2018 actualisées par France Stratégie 2024.
          </>
        }
        limites={
          <>
            Les chiffres précis dépendent de la définition du revenu
            (marché, fiscal, disponible) et de l'unité de référence (individu,
            ménage, foyer fiscal). On utilise la convention INSEE (niveau de
            vie par UC). Les inégalités de patrimoine sont sous-estimées par
            les enquêtes ménages (déclaratif → sous-déclaration au sommet).
          </>
        }
        miseAJour="Données revenus 2022 (publication INSEE 2024), Gini OCDE 2024."
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
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/80 border border-rose-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-rose-700 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
