// ============================================================================
// AutonomiePage — 5ᵉ branche, EHPAD, APA, reste à charge familles
// ============================================================================
//
// Route : #/autonomie
//
// Approche : la 5ᵉ branche existe depuis 2020 et collecte ~38 Md€/an, mais
// le besoin Libault (2019) reste de +9 Md€/an additionnels. La page met en
// avant le RESTE À CHARGE des familles — données peu visibles politiquement
// mais centrales pour des millions de Français.
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
  POPULATIONS_AUTONOMIE,
  DEPENSES_AUTONOMIE,
  RESTE_A_CHARGE_FAMILLES,
  ETUDES_AUTONOMIE,
  MYTHES_AUTONOMIE,
  CATEGORIES_AUTONOMIE,
  TOTAL_DEPENSES_AUTONOMIE_MD,
  BUDGET_5E_BRANCHE_MD,
  BESOIN_ADDITIONNEL_LIBAULT_MD,
  DEPENSES_PROJECTION_2050_MD,
  PROJECTION_75_PLUS_2050,
  POPULATION_75_PLUS_2024,
} from "../data/autonomie";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function AutonomiePage() {
  const depensesSorted = [...DEPENSES_AUTONOMIE].sort(
    (a, b) => b.montantMdEur - a.montantMdEur,
  );
  const barDepenses = depensesSorted.map((d) => ({
    nom: abbrev(d.poste, 32),
    nomComplet: d.poste,
    montant: d.montantMdEur,
    color: CATEGORIES_AUTONOMIE[d.categorie].color,
  }));

  // Bar chart : reste à charge mensuel familles
  const barRAC = RESTE_A_CHARGE_FAMILLES.map((r) => ({
    nom: abbrev(r.scenario, 35),
    nomComplet: r.scenario,
    montant: r.montantMensuel,
    color:
      r.montantMensuel > 3000
        ? "#dc2626"
        : r.montantMensuel > 2000
          ? "#f59e0b"
          : "#3b82f6",
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-violet-50 to-white border border-violet-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-violet-700 font-semibold">
          5ᵉ branche · grand âge & handicap
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Autonomie & EHPAD : qui paie quoi
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Créée en 2020, la <strong>5ᵉ branche de la Sécurité sociale</strong>{" "}
          (autonomie) collecte ~{BUDGET_5E_BRANCHE_MD} Md€/an pour financer le
          grand âge et le handicap. Mais le rapport Libault (2019) chiffre à{" "}
          <strong>+{BESOIN_ADDITIONNEL_LIBAULT_MD} Md€/an</strong> les besoins
          additionnels d'ici 2030, et la DREES projette un doublement des
          dépenses d'ici 2050. Au quotidien : un EHPAD privé coûte 3 500 €/mois
          à la famille — bien au-dessus d'une retraite moyenne (1 500 €).
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Budget 5ᵉ branche"
            value={`${BUDGET_5E_BRANCHE_MD.toFixed(0)} Md€`}
            hint="CNSA 2024"
          />
          <KpiBox
            label="Besoin Libault"
            value={`+${BESOIN_ADDITIONNEL_LIBAULT_MD} Md€/an`}
            hint="Horizon 2030"
          />
          <KpiBox
            label="Projection 2050"
            value={`${DEPENSES_PROJECTION_2050_MD} Md€`}
            hint="DREES, à couverture constante"
          />
          <KpiBox
            label="75+ ans"
            value={`${POPULATION_75_PLUS_2024} M → ${PROJECTION_75_PLUS_2050} M`}
            hint="2024 → 2050 (+70 %)"
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
            « Autonomie » regroupe deux populations très différentes :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>Grand âge</strong> (~70 % des dépenses) : personnes en
              perte d'autonomie après 60 ans. APA, EHPAD, services à domicile.
            </li>
            <li>
              • <strong>Handicap</strong> (~30 %) : adultes et enfants en
              situation de handicap. AAH, PCH, ESAT, IME, FAM, MAS.
            </li>
          </ul>
          <p>
            La <strong>5ᵉ branche</strong> de la Sécurité sociale a été créée
            en 2020 pour <em>unifier</em> ces dépenses (auparavant éclatées
            entre État, Sécu, départements, CNSA). Elle est gérée par la CNSA
            et collecte ~38 Md€/an. Mais les <strong>départements</strong>{" "}
            restent un acteur central (APA, ASH, PCH).
          </p>
          <p>
            Le <strong>vrai sujet</strong> n'est pas tant le pilotage que le
            financement : sans réforme, l'écart entre les besoins (croissance
            démographique +70 % de 75+ ans d'ici 2050) et les recettes va se
            creuser. C'est l'« angle mort » que tous les rapports officiels
            documentent depuis 2019.
          </p>
        </div>
      </section>

      {/* Populations */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 populations à connaître
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Les chiffres clés pour bien dimensionner le sujet.
        </p>
        <ul className="grid md:grid-cols-2 gap-3">
          {POPULATIONS_AUTONOMIE.map((p) => (
            <li
              key={p.label}
              className="border border-slate-200 rounded-xl p-4 hover:border-violet-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  <span className="text-xl mr-2">{p.emoji}</span>
                  {p.label}
                </h3>
                <span className="font-display text-xl font-bold tabular-nums text-violet-700 shrink-0">
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

      {/* Bar chart reste à charge familles — section phare */}
      <section className="card p-5 md:p-6 bg-rose-50/20 border-rose-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          💸 Combien ça coûte à la famille (par mois)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Reste à charge moyen mensuel selon le type de prise en charge. À
          comparer à la <strong>retraite moyenne de ~1 500 €/mois</strong>{" "}
          (DREES). C'est la donnée la plus parlante du sujet.
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barRAC}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 160, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  `${v.toLocaleString("fr-FR")} €`
                }
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
                formatter={(v: number) => [
                  `${v.toLocaleString("fr-FR")} €/mois`,
                  "Reste à charge",
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
              <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                {barRAC.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2 mt-4">
          {RESTE_A_CHARGE_FAMILLES.map((r, i) => (
            <li
              key={i}
              className="border border-rose-200/40 bg-white rounded-lg p-3 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <span className="font-display font-semibold text-slate-900">
                  <span className="text-lg mr-2">{r.emoji}</span>
                  {r.scenario}
                </span>
                <span className="font-display text-base font-bold tabular-nums text-rose-700">
                  {r.montantMensuel.toLocaleString("fr-FR")} €/mois
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {r.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {r.source}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Dépenses publiques détail */}
      <DownloadableCard
        filename="autonomie-depenses-publiques"
        shareTitle="Budget France — Dépenses publiques autonomie"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            depensesSorted.map((d, i) => ({
              rang: i + 1,
              poste: d.poste,
              categorie: CATEGORIES_AUTONOMIE[d.categorie].label,
              montant_md_eur: d.montantMdEur,
              financeur: d.financeur,
              source: d.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Dépenses publiques détaillées
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          {DEPENSES_AUTONOMIE.length} postes pour ~
          {TOTAL_DEPENSES_AUTONOMIE_MD.toFixed(0)} Md€/an. Périmètre élargi
          (Sécu + État + départements + crédit d'impôt).
        </p>

        <div className="h-[420px] w-full mb-5">
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
              className="border border-slate-200 rounded-xl p-4 hover:border-violet-400 transition"
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
                      background: `${CATEGORIES_AUTONOMIE[d.categorie].color}15`,
                      color: CATEGORIES_AUTONOMIE[d.categorie].color,
                      border: `1px solid ${CATEGORIES_AUTONOMIE[d.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_AUTONOMIE[d.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-violet-700">
                    {d.montantMdEur.toFixed(1)} Md€
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

      {/* Études */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 rapports de référence
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le diagnostic est posé depuis Libault 2019. La mise en œuvre reste
          partielle.
        </p>
        <ul className="space-y-3">
          {ETUDES_AUTONOMIE.map((e) => (
            <li
              key={e.source}
              className="border border-slate-200 rounded-xl p-4 hover:border-violet-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {e.source}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {e.annee}
                </span>
              </div>
              <div className="text-sm font-medium text-violet-800 bg-violet-50 border-l-2 border-violet-400 px-3 py-1.5 rounded-r my-2">
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
          6 idées reçues sur l'EHPAD et l'autonomie
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Sujet où les approximations sont fréquentes — y compris dans les
          médias.
        </p>
        <ul className="space-y-3">
          {MYTHES_AUTONOMIE.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-violet-400 transition"
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
            <strong>5ᵉ branche de la Sécu</strong> créée en 2020 pour
            l'autonomie, gérée par la CNSA. Recettes 2024 : ~
            {BUDGET_5E_BRANCHE_MD} Md€ (CSG + CSA + transfert CADES). Couvre
            grand âge ET handicap.
          </>,
          <>
            Total dépenses publiques autonomie (périmètre élargi) : ~
            <strong>{TOTAL_DEPENSES_AUTONOMIE_MD.toFixed(0)} Md€/an</strong>{" "}
            (Sécu + État + départements + crédit d'impôt). Postes principaux :
            soins EHPAD 12, AAH 12, ESMS handicap 11, APA 7.
          </>,
          <>
            <strong>Reste à charge familles EHPAD : 1 900 à 3 500 €/mois</strong>
            {" "}selon type d'établissement. Bien au-dessus de la retraite
            moyenne (1 500 €). Question politique non résolue depuis 2019.
          </>,
          <>
            <strong>Mur démographique</strong> : 75+ ans passent de 6,5 M
            (2024) à 11 M (2050), soit +70 %. Sans réforme, dépenses publiques
            x2 d'ici 2050 (DREES).
          </>,
          <>
            <strong>Libault (2019)</strong> : +9 Md€/an supplémentaires
            nécessaires d'ici 2030 pour mettre à niveau le système (ratio
            personnel EHPAD, professionnalisation domicile, rénovation).
            Mise en œuvre partielle 5 ans après.
          </>,
          <>
            <strong>Aidants familiaux : 11 M de Français</strong>. Économie
            « invisible » estimée à 150 Md€/an si valorisée (Banque Mondiale).
            Sujet majeur pour la cohésion sociale au-delà des chiffres.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.cnsa.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              CNSA
            </a>{" "}
            — rapports annuels, suivi 5ᵉ branche
          </>,
          <>
            <a
              href="https://drees.solidarites-sante.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              DREES
            </a>{" "}
            — études EHPAD, aide sociale départementale, projections dépendance
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
            — « Politique de la dépendance » (2022), « EHPAD » (2024)
          </>,
          <>
            <a
              href="https://solidarites.gouv.fr/grand-age-le-temps-dagir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Rapport Libault
            </a>{" "}
            — « Grand âge et autonomie » (2019), référence du débat
          </>,
          <>
            <a
              href="https://www.strategie.gouv.fr/conseils/haut-conseil-de-famille-enfance-et-age"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              HCFEA
            </a>{" "}
            — projections démographiques et besoins financement
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
            — rapports inspection EHPAD (post-affaire Orpea 2022)
          </>,
          <>INSEE — projections démographiques 2024</>,
          <>DSS — comptes de la Sécurité sociale (5ᵉ branche)</>,
        ]}
        methode={
          <>
            <strong>Dépenses</strong> : périmètre élargi incluant Sécu (soins
            EHPAD, PCH, ESMS handicap), État (AAH, crédit d'impôt), CNSA
            (forfait dépendance EHPAD), départements (APA, ASH).
            <br />
            <br />
            <strong>Reste à charge</strong> : moyennes nationales pour EHPAD
            (Cour des comptes 2024) et estimations DREES pour domicile.
            Forte variation géographique et selon GIR.
            <br />
            <br />
            <strong>Projection 2050</strong> : scénario central DREES (couverture
            constante). Le scénario « amélioration » Libault aboutit à 3,5 % du
            PIB en dépenses publiques vs ~1,5 % aujourd'hui.
          </>
        }
        limites={
          <>
            Le reste à charge « moyen » cache des écarts importants :
            géographie (chambre Paris vs Aveyron), niveau de dépendance,
            recours possible à l'ASH (créance sur succession).
            <br />
            <br />
            La frontière entre « soins » (Sécu) et « hébergement » (résident)
            est conventionnelle et débattue. Les EHPAD à but lucratif
            arbitrent parfois entre ces deux postes pour optimiser leurs
            marges (constat Cour des comptes 2024).
            <br />
            <br />
            Le coût des aidants familiaux n'apparaît pas dans le budget
            public — c'est un transfert silencieux des familles vers l'État.
            Sa valorisation à 150 Md€ (Banque Mondiale) reste indicative.
          </>
        }
        miseAJour="Données 2023-2024. Mise à jour annuelle prévue après publication des comptes CNSA et études DREES."
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
    <div className="bg-white/80 border border-violet-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-violet-700 font-semibold">
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
