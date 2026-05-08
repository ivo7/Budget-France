// ============================================================================
// SalairesElusPage — combien sont payés les élus français ?
// ============================================================================
//
// Page transparente, factuelle, sourcée. Anti-populisme et anti-mythe.
// Affiche les indemnités, frais, durée de mandat, cumul, retraite et
// comparaisons internationales pour chaque catégorie d'élu.
//
// Route : #/salaires-elus
// ============================================================================

import { useState } from "react";
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
  COMPARAISON_INTERNATIONALE,
  MYTHES_A_DEMONTER,
  SALAIRES_EXECUTIF,
  SALAIRES_LOCAUX,
  SALAIRES_PARLEMENTAIRES,
  SALAIRE_MEDIAN_NET,
  SMIC_MENSUEL_NET,
  type CategorieElu,
  type RemunerationElu,
} from "../data/salairesElus";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

const COLOR_EXEC = "#7c3aed";
const COLOR_PARL = "#0055A4";
const COLOR_LOCAL = "#16a34a";
const COLOR_EU = "#d97706";

const CATEGORIES: { id: CategorieElu | "tous"; label: string; color: string }[] = [
  { id: "tous",            label: "Tous",                    color: "#475569" },
  { id: "executif",        label: "Exécutif",                color: COLOR_EXEC },
  { id: "parlementaires",  label: "Parlementaires",          color: COLOR_PARL },
  { id: "locaux",          label: "Élus locaux",             color: COLOR_LOCAL },
];

export function SalairesElusPage() {
  const [filtreCat, setFiltreCat] = useState<CategorieElu | "tous">("tous");

  // Concat
  const all: { elu: RemunerationElu; categorie: CategorieElu }[] = [
    ...SALAIRES_EXECUTIF.map((e) => ({ elu: e, categorie: "executif" as const })),
    ...SALAIRES_PARLEMENTAIRES.map((e) => ({ elu: e, categorie: "parlementaires" as const })),
    ...SALAIRES_LOCAUX.map((e) => ({ elu: e, categorie: "locaux" as const })),
  ];

  const filtered = filtreCat === "tous" ? all : all.filter((x) => x.categorie === filtreCat);

  // Bar chart toutes fonctions par indemnité
  const barData = all
    .map(({ elu, categorie }) => ({
      nom: shortenName(elu.fonction),
      nomComplet: elu.fonction,
      indemnite: elu.indemniteMensuelleEur,
      color:
        categorie === "executif" ? COLOR_EXEC :
        categorie === "parlementaires" ? COLOR_PARL :
        COLOR_LOCAL,
    }))
    .sort((a, b) => b.indemnite - a.indemnite);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-indigo-700 font-semibold">
          Transparence · Indemnités des élus
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Combien sont payés les élus français ?
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Indemnités, frais de mandat, durée, cumul, retraite : <strong>les chiffres
          officiels et publics</strong>, mis en perspective avec le SMIC, le salaire
          médian et nos voisins européens. Approche neutre et factuelle, source
          DGCL/Assemblée/Sénat.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Président de la République"
            value={`${(15_140).toLocaleString("fr-FR")} €/mois`}
            hint="brut · alignement PM (2008)"
            color="text-indigo-700"
          />
          <KpiBox
            label="Député / Sénateur"
            value={`${(7_637).toLocaleString("fr-FR")} €/mois`}
            hint="indemnité parlementaire brute"
            color="text-blue-700"
          />
          <KpiBox
            label="Maire grande ville"
            value={`${(5_640).toLocaleString("fr-FR")} €/mois`}
            hint=">100 000 hab. (plafond)"
            color="text-emerald-700"
          />
          <KpiBox
            label="Maire petit village"
            value={`${(1_048).toLocaleString("fr-FR")} €/mois`}
            hint="<500 hab. (plafond légal)"
            color="text-slate-700"
          />
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Repères salariaux :</strong>{" "}
          SMIC mensuel net = <strong>{SMIC_MENSUEL_NET.toLocaleString("fr-FR")} €</strong> ·
          Salaire médian français net = <strong>{SALAIRE_MEDIAN_NET.toLocaleString("fr-FR")} €</strong> ·
          Cadre supérieur médian = ~5 200 €/mois net.
        </div>
      </header>

      {/* Bar chart toutes fonctions */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Toutes les fonctions, classées par indemnité
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          En € brut mensuel. Les frais de mandat (IRFM, crédits collaborateurs) ne sont
          PAS inclus — ce ne sont pas du revenu personnel.
        </p>

        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 180, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)} k€`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="nom"
                stroke="#475569"
                tick={{ fontSize: 11 }}
                width={170}
                interval={0}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString("fr-FR")} € brut/mois`,
                  "Indemnité",
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
              <Bar dataKey="indemnite" radius={[0, 4, 4, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <LegendItem color={COLOR_EXEC} label="Exécutif (Président, PM, ministres)" />
          <LegendItem color={COLOR_PARL} label="Parlementaires (députés, sénateurs)" />
          <LegendItem color={COLOR_LOCAL} label="Élus locaux (maires, présidents région/dép.)" />
        </div>
      </section>

      {/* Liste détaillée filtrable */}
      <DownloadableCard
        filename="salaires-elus-detail"
        shareTitle="Budget France — Salaires des élus"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.map(({ elu, categorie }) => ({
              fonction: elu.fonction,
              categorie,
              indemnite_mensuelle_brute_eur: elu.indemniteMensuelleEur,
              frais_mensuels_eur: elu.fraisMensuelsEur ?? 0,
              credit_collaborateurs_eur: elu.creditCollaborateursEur ?? 0,
              equivalent_smic: elu.smicEquivalent,
              effectif: elu.effectif,
              duree_mandat: elu.mandatDuree,
              cumul: elu.cumul,
              source: elu.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail par fonction
        </h2>
        <p className="text-xs text-slate-600 mb-3">
          Pour chaque fonction : indemnité, frais, durée, cumul, retraite et source officielle.
        </p>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltreCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filtreCat === cat.id
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
              }`}
              style={filtreCat === cat.id ? { background: cat.color } : {}}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {filtered.map(({ elu, categorie }) => (
            <CarteElu key={elu.id} elu={elu} categorie={categorie} />
          ))}
        </ul>
      </DownloadableCard>

      {/* Comparaison internationale */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Comparaison internationale
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Indemnité brute mensuelle pour le chef de gouvernement et les parlementaires
          dans 7 pays comparables. La France n'est ni au sommet ni au plus bas.
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Pays</th>
                <th className="py-2 pr-3 font-semibold">Chef de gouvernement</th>
                <th className="py-2 pr-3 font-semibold">Parlementaire</th>
                <th className="py-2 pr-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {COMPARAISON_INTERNATIONALE.map((c) => {
                const isFrance = c.pays === "France";
                return (
                  <tr
                    key={c.pays}
                    className={`border-b border-slate-100 ${
                      isFrance ? "bg-brand-soft/40 font-semibold" : ""
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <span className="mr-1.5">{c.drapeau}</span>
                      {c.pays}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {c.pm.toLocaleString("fr-FR")} €/mois
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {c.parlementaire.toLocaleString("fr-FR")} €/mois
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {c.note ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 italic leading-relaxed">
          Conversions €/mois sur la base des taux de change moyens 2024.
          Pour le US : USD converti à 0,90 €/USD. Salaires bruts annuels divisés par 12.
        </p>
      </section>

      {/* Mythes à démonter */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 mythes à démonter
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le débat public regorge d'idées reçues sur la rémunération des élus.
          Vérifions les plus courantes.
        </p>

        <ul className="space-y-3">
          {MYTHES_A_DEMONTER.map((m, i) => (
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

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>Aucun élu n'est « payé à vie »</strong>. Les pensions sont des droits
            cotisés (1 an cotisé/mandat, comme le régime général).
          </>,
          <>
            La France est <strong>dans la moyenne européenne</strong> : ni la mieux ni la
            moins bien payée. Allemagne et Suisse plus généreuses, Espagne et Italie
            (sur le PM) moins.
          </>,
          <>
            <strong>Le cumul des mandats est interdit depuis 2017</strong> pour les
            parlementaires + exécutifs locaux. En cas de cumul résiduel, l'indemnité est
            écrêtée à 1,5× l'indemnité parlementaire.
          </>,
          <>
            <strong>L'IRFM (frais de mandat) ≠ revenu personnel</strong>. Depuis 2018,
            elle est soumise à justificatifs et tout euro non justifié est restitué.
          </>,
          <>
            <strong>80 % des conseillers municipaux sont bénévoles.</strong> Les maires
            de petits villages (<em>&lt;</em>500 hab.) touchent ~870 €/mois net — souvent
            en complément d'un emploi principal.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.assemblee-nationale.fr/dyn/le-depute"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Assemblée nationale
            </a>{" "}
            — règlement intérieur, indemnités parlementaires, IRFM
          </>,
          <>
            <a
              href="https://www.senat.fr/role/fiches/indem.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Sénat
            </a>{" "}
            — brochure officielle des indemnités
          </>,
          <>
            <a
              href="https://www.collectivites-locales.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              DGCL
            </a>{" "}
            — Code général des collectivités territoriales (CGCT) art. L. 2123-23 et s.
          </>,
          <>
            <a
              href="https://www.hatvp.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              HATVP
            </a>{" "}
            — déclarations de patrimoine et d'intérêts des élus
          </>,
          <>
            Parlement européen — statut financier et rémunération des eurodéputés
          </>,
          <>
            Comparaisons internationales : sites officiels des parlements (Bundestag,
            UK Parliament, Cortes, US Congress, Conseil fédéral suisse)
          </>,
        ]}
        methode={
          <>
            Tous les montants sont en <strong>EUROS BRUTS MENSUELS</strong>. Les frais
            de mandat (IRFM, crédits collaborateurs) sont indiqués séparément car ils ne
            constituent pas du revenu personnel — ils financent les outils de travail
            (bureau, déplacements, communication, salariés).
          </>
        }
        limites={
          <>
            Les avantages en nature (logement, voiture, sécurité) sont qualitativement
            décrits mais pas chiffrés. Les indemnités locales votées peuvent être
            INFÉRIEURES au plafond légal — nous affichons le plafond, qui est rarement
            atteint dans les communes &lt; 50 000 habitants.
          </>
        }
        miseAJour="Données 2024-2025. Indexation automatique sur l'indice brut 1027 de la fonction publique."
      />
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function CarteElu({
  elu,
  categorie,
}: {
  elu: RemunerationElu;
  categorie: CategorieElu;
}) {
  const couleur =
    categorie === "executif" ? COLOR_EXEC :
    categorie === "parlementaires" ? COLOR_PARL :
    categorie === "locaux" ? COLOR_LOCAL :
    COLOR_EU;

  return (
    <li className="border border-slate-200 rounded-xl p-4 hover:border-brand/30 transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-slate-900">
            {elu.fonction}
          </h3>
          <div className="text-[11px] text-slate-500 mt-0.5">{elu.effectif}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl font-bold tabular-nums text-slate-900">
            {elu.indemniteMensuelleEur.toLocaleString("fr-FR")} €
          </div>
          <div className="text-[10px] text-slate-500">brut/mois</div>
          {elu.smicEquivalent > 0 && (
            <div
              className="text-[10px] mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{ background: `${couleur}15`, color: couleur }}
            >
              ≈ {elu.smicEquivalent}× SMIC
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
        {elu.description}
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {elu.fraisMensuelsEur && (
          <DetailRow
            label="Frais de mandat"
            value={`${elu.fraisMensuelsEur.toLocaleString("fr-FR")} €/mois`}
            hint="Bureau, déplacements (sur justificatifs)"
          />
        )}
        {elu.creditCollaborateursEur && (
          <DetailRow
            label="Crédit collaborateurs"
            value={`${elu.creditCollaborateursEur.toLocaleString("fr-FR")} €/mois`}
            hint="Salaire des assistants (pas du revenu)"
          />
        )}
        <DetailRow label="Durée du mandat" value={elu.mandatDuree} />
        <DetailRow label="Cumul" value={elu.cumul} />
        <DetailRow label="Retraite" value={elu.retraite} />
        {elu.plafonnement && (
          <DetailRow label="Plafonnement" value={elu.plafonnement} />
        )}
      </div>

      {elu.avantagesNature && (
        <div className="mt-3 text-xs italic text-slate-600 bg-slate-50/60 border-l-2 border-slate-300 px-3 py-1.5 rounded-r">
          <strong>Avantages en nature :</strong> {elu.avantagesNature}
        </div>
      )}

      <div className="mt-2 text-[10px] text-slate-400">Source : {elu.source}</div>
    </li>
  );
}

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <strong className="text-slate-700">{label} :</strong>{" "}
      <span className="text-slate-600">{value}</span>
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

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
      <div className={`font-display text-lg md:text-xl font-bold tabular-nums mt-0.5 ${color}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-slate-700">{label}</span>
    </div>
  );
}

function shortenName(s: string): string {
  return s
    .replace("Président de la République", "Président de la Rép.")
    .replace("Premier ministre", "Premier ministre")
    .replace("Secrétaire d'État", "Sec. d'État")
    .replace("Eurodéputé", "Eurodéputé")
    .replace("Maire d'une métropole > 100 000 hab.", "Maire métropole >100k")
    .replace("Maire d'une commune 20 000-49 999 hab.", "Maire ville 20-50k")
    .replace("Maire d'une commune 3 500-9 999 hab.", "Maire bourg 3,5-10k")
    .replace("Maire d'une commune < 500 hab.", "Maire village <500")
    .replace("Président de Région", "Président Région")
    .replace("Président de Département", "Président Département")
    .replace("Conseiller municipal (commune > 100 000 hab.)", "Conseiller municipal");
}
