// ============================================================================
// MarchesPublicsPage — la commande publique française (~120 Md€/an)
// ============================================================================
//
// Page pédagogique sur l'achat public en France : qui dépense, qui reçoit,
// comment les TPE/PME peuvent y accéder, où trouver les données.
//
// Route : #/marches-publics
// ============================================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ACHETEURS_PUBLICS,
  CATEGORIES_MARCHES,
  MYTHES_MARCHES,
  OUTILS_RECHERCHE,
  SEUILS_PROCEDURE,
  TOP_FOURNISSEURS,
  TOTAL_COMMANDE_PUBLIQUE_MD_EUR,
} from "../data/marchesPublics";
import topReelData from "../data/topFournisseursMarches.json";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface TopReelFournisseur {
  rang: number;
  siren: string;
  raisonSociale: string;
  totalMontantEur: number;
  nbMarches: number;
  ticketMoyenEur: number;
  topNatures: string[];
  premiereDate: string | null;
  derniereDate: string | null;
}

interface TopReelData {
  generatedAt: string | null;
  sourceFiles: string[] | null;
  totalMarches: number;
  totalFournisseurs: number;
  totalMontantEur: number;
  top100: TopReelFournisseur[];
}

const TOP_REEL = topReelData as TopReelData;

const COLORS_CAT = ["#0055A4", "#16a34a", "#d97706"];

export function MarchesPublicsPage() {
  // Pie chart — répartition par catégorie
  const pieDataCategorie = CATEGORIES_MARCHES.map((c, i) => ({
    name: c.label,
    value: c.montantMdEur,
    color: COLORS_CAT[i % COLORS_CAT.length],
  }));

  // Bar chart — top fournisseurs
  const barDataFournisseurs = TOP_FOURNISSEURS.slice(0, 10).map((f) => ({
    nom: f.nom,
    ca: f.caEstimMdEur,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-50 to-white border border-purple-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-purple-700 font-semibold">
          Commande publique · 120 Md€/an
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Marchés publics : qui achète, qui vend, où trouver l'info ?
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          La commande publique française pèse <strong>~{TOTAL_COMMANDE_PUBLIQUE_MD_EUR} Md€/an</strong> —
          quand l'État, une commune, un hôpital ou une université achètent, c'est
          <em> ton</em> argent. Page pédagogique : qui sont les acheteurs, les
          fournisseurs récurrents, les seuils légaux, et les outils pour qu'une
          TPE/PME puisse y répondre.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Volume annuel total"
            value={`${TOTAL_COMMANDE_PUBLIQUE_MD_EUR} Md€`}
            hint="Tous acheteurs publics"
            color="text-purple-700"
          />
          <KpiBox
            label="Marchés/an publiés"
            value="~250 000"
            hint=">40 K€ HT"
            color="text-purple-700"
          />
          <KpiBox
            label="Acheteurs publics"
            value="~150 000"
            hint="Communes, État, hôpitaux…"
            color="text-purple-700"
          />
          <KpiBox
            label="Part attribuée aux PME"
            value="~58 %"
            hint="Selon OECP 2023"
            color="text-emerald-700"
          />
        </div>
      </header>

      {/* Répartition par catégorie + acheteurs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie : catégories */}
        <div className="card p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
            Travaux, services, fournitures
          </h2>
          <p className="text-xs text-slate-600 mb-3">
            Répartition de la commande publique par grand type de marché.
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataCategorie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry: { name: string; value: number }) =>
                    `${entry.value} Md€`
                  }
                  labelLine={false}
                >
                  {pieDataCategorie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} Md€`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 space-y-2">
            {CATEGORIES_MARCHES.map((c, i) => (
              <li key={c.type} className="flex gap-3 items-start">
                <span
                  className="w-3 h-3 rounded-full shrink-0 mt-1.5"
                  style={{ background: COLORS_CAT[i % COLORS_CAT.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <strong className="text-slate-900">
                      {c.emoji} {c.label}
                    </strong>
                    <span className="tabular-nums text-slate-600 shrink-0">
                      {c.montantMdEur} Md€ ({c.partPct} %)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    {c.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Acheteurs publics */}
        <div className="card p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
            Qui achète ?
          </h2>
          <p className="text-xs text-slate-600 mb-3">
            Les 150 000 acheteurs publics français sont concentrés sur 4 grandes
            catégories.
          </p>
          <ul className="space-y-3">
            {ACHETEURS_PUBLICS.map((a) => (
              <li
                key={a.categorie}
                className="border border-slate-200 rounded-lg p-3 hover:border-purple-400 transition"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <strong className="text-slate-900 flex items-baseline gap-2">
                    <span>{a.emoji}</span> {a.categorie}
                  </strong>
                  <span className="font-display font-bold tabular-nums text-purple-700">
                    {a.montantMdEur} Md€
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {a.description}
                </p>
                <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                  {a.exemples.map((ex, i) => (
                    <li key={i}>• {ex}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Top fournisseurs */}
      <DownloadableCard
        filename="top-fournisseurs-marches-publics"
        shareTitle="Budget France — Top fournisseurs marchés publics"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            TOP_FOURNISSEURS.map((f) => ({
              rang: f.rang,
              nom: f.nom,
              secteur: f.secteur,
              ca_estim_md_eur: f.caEstimMdEur,
              description: f.description,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Top 10 fournisseurs récurrents (estimation)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Estimations consolidées par groupe-mère (CA marchés publics France
          uniquement). Données indicatives — les très grands groupes répondent
          via des dizaines de filiales sectorielles, ce qui rend la
          consolidation difficile.
        </p>

        <div className="h-[340px] mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDataFournisseurs}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 100, bottom: 8 }}
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
                width={90}
                interval={0}
              />
              <Tooltip
                formatter={(value: number) => [`${value} Md€`, "CA estim."]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="ca" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2">
          {TOP_FOURNISSEURS.map((f) => (
            <li
              key={f.rang}
              className="border border-slate-200 rounded-lg p-3 hover:border-purple-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    #{String(f.rang).padStart(2, "0")}
                  </span>
                  <strong className="text-slate-900">
                    {f.emoji} {f.nom}
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    · {f.secteur}
                  </span>
                </div>
                <span className="font-display font-bold tabular-nums text-purple-700">
                  ~{f.caEstimMdEur} Md€/an
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Top 100 réel issu de DECP (si disponible) */}
      <TopReelSection />

      {/* Seuils légaux */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Les 4 seuils de procédure (2024-2025)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Selon le montant du marché, l'acheteur public doit respecter une
          procédure différente. Plus le seuil est élevé, plus la procédure est
          formalisée. Ces seuils sont révisés tous les 2 ans par décret.
        </p>

        <ol className="space-y-3">
          {SEUILS_PROCEDURE.map((s, i) => (
            <li
              key={i}
              className="flex gap-3 border border-amber-200/60 bg-white rounded-lg p-3"
            >
              <span className="font-display font-bold text-amber-700 text-xl shrink-0 w-7 text-right">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <strong className="text-slate-900 font-mono text-sm">
                    {s.borne}
                  </strong>
                  <span className="text-xs text-amber-700 font-semibold">
                    📢 {s.publication}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-1">
                  {s.procedure}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Mythes */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          4 idées reçues sur les marchés publics
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Le débat public sur la commande publique est rempli de mythes. Voici
          ce que disent les données.
        </p>
        <ul className="space-y-3">
          {MYTHES_MARCHES.map((m, i) => (
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

      {/* Guide pratique : où chercher */}
      <section className="card p-5 md:p-6 bg-blue-50/30 border-blue-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          🔍 Comment chercher dans les marchés publics ?
        </h2>
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
          Pour explorer concrètement la commande publique — par acheteur,
          fournisseur, mot-clé ou département — voici les{" "}
          <strong>5 outils officiels gratuits</strong>. Pas besoin de payer pour
          accéder aux données : tout est public.
        </p>
        <ul className="space-y-3">
          {OUTILS_RECHERCHE.map((o) => (
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
            La commande publique française pèse{" "}
            <strong>~{TOTAL_COMMANDE_PUBLIQUE_MD_EUR} Md€/an</strong> et 250 000
            marchés. C'est le 1ᵉʳ poste de dépenses publiques après les salaires.
          </>,
          <>
            <strong>Les collectivités locales</strong> (communes, EPCI, régions,
            départements) représentent ~45 % de la commande publique — soit
            ~55 Md€/an de marchés à décrocher localement.
          </>,
          <>
            Vinci, Bouygues et Eiffage trustent les très gros marchés (&gt;50
            M€), mais <strong>~58 % du volume va à des PME</strong>. La porte
            d'entrée privilégiée pour TPE/PME : marchés &lt;40 K€ (sans
            publicité) et &lt;90 K€ (MAPA simplifié).
          </>,
          <>
            <strong>Toutes les données sont publiques</strong> : data.gouv.fr,
            BOAMP, JOUE/TED. Tu peux consulter chaque marché &gt;40 K€ avec son
            acheteur, son fournisseur, son montant.
          </>,
          <>
            <strong>Délai légal de paiement : 30 jours.</strong> Au-delà,
            pénalités automatiques (taux BCE + 8 points). Délai moyen État 2023
            : 23 jours. Certaines collectivités locales montent à 60-90 jours.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.economie.gouv.fr/daj/observatoire-economique-commande-publique"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OECP — Observatoire Économique de la Commande Publique
            </a>{" "}
            (DAE, Bercy)
          </>,
          <>
            <a
              href="https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              data.gouv.fr — DECP fichiers consolidés
            </a>
          </>,
          <>
            <a
              href="https://www.boamp.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              BOAMP
            </a>{" "}
            — Bulletin Officiel des Annonces Marchés Publics
          </>,
          <>INSEE — comptes nationaux, formation brute capital fixe APU</>,
          <>
            Cour des comptes — rapports thématiques sur l'achat public
          </>,
          <>
            Code de la commande publique (CCP) — édition 2024-2025
          </>,
        ]}
        methode={
          <>
            Les chiffres totaux (~120 Md€) viennent de l'OECP et des comptes
            nationaux INSEE. La répartition par catégorie suit la classification
            européenne CPV (travaux, fournitures, services). Les top
            fournisseurs sont des estimations consolidées par groupe-mère, à
            partir des données DECP individuelles agrégées.
          </>
        }
        limites={
          <>
            Les très grands groupes (Vinci, Bouygues…) répondent via des
            dizaines de filiales spécialisées — la consolidation au niveau
            groupe-mère est imprécise. Les marchés &lt;40 K€ ne sont pas dans
            DECP. Les délégations de service public (DSP) sont aussi mal
            couvertes par DECP.
          </>
        }
        miseAJour="OECP 2023 (publication 2024). DECP : flux continu sur data.gouv.fr."
      />
    </div>
  );
}

// ============================================================================
// TopReelSection — affichage des données DECP réelles
// ============================================================================
//
// Cette section n'apparaît qu'une fois le JSON `topFournisseursMarches.json`
// peuplé par le script `pipeline/src/aggregateDecp.ts`. Tant que le top100
// est vide, on affiche un message expliquant la procédure à l'admin.

function TopReelSection() {
  const isPopulated = TOP_REEL.top100.length > 0;
  const totalMd = TOP_REEL.totalMontantEur / 1e9;
  const generatedAt = TOP_REEL.generatedAt
    ? new Date(TOP_REEL.generatedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (!isPopulated) {
    return (
      <section className="rounded-2xl p-5 md:p-6 bg-slate-50 border-2 border-dashed border-slate-300 text-center">
        <div className="text-2xl mb-2">📊</div>
        <h2 className="font-display text-lg font-semibold text-slate-700">
          Top 100 réel des fournisseurs DECP — bientôt disponible
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-2xl mx-auto leading-relaxed">
          Cette section affichera le classement réel issu des Données Essentielles
          de la Commande Publique (data.gouv.fr) — agrégation des marchés gagnés
          par chaque entreprise. La donnée sera générée par exécution du script
          d'agrégation côté serveur (lancement mensuel).
        </p>
      </section>
    );
  }

  return (
    <DownloadableCard
      filename="top-100-fournisseurs-decp"
      shareTitle="Budget France — Top 100 fournisseurs marchés publics (DECP)"
      className="card p-5 md:p-6 bg-emerald-50/30 border-emerald-200/60"
      getCsvData={() =>
        objectsToCsv(
          TOP_REEL.top100.map((f) => ({
            rang: f.rang,
            raison_sociale: f.raisonSociale,
            siren: f.siren,
            total_montant_eur: f.totalMontantEur,
            nb_marches: f.nbMarches,
            ticket_moyen_eur: f.ticketMoyenEur,
            premiere_date: f.premiereDate ?? "",
            derniere_date: f.derniereDate ?? "",
          })),
        )
      }
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-display text-xl font-semibold text-slate-900">
          🎯 Top 100 réel — données DECP officielles
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
          {TOP_REEL.totalMarches.toLocaleString("fr-FR")} marchés agrégés ·{" "}
          {totalMd.toFixed(1)} Md€
        </span>
      </div>
      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Classement issu de l'agrégation des Données Essentielles de la Commande
        Publique (data.gouv.fr). Filiales consolidées au niveau groupe-mère
        quand connu (Vinci, Bouygues, Eiffage…).
        {generatedAt && (
          <span className="block text-[11px] text-slate-500 mt-1">
            Mis à jour le {generatedAt}.
          </span>
        )}
      </p>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2 font-semibold">Rang</th>
              <th className="py-2 pr-2 font-semibold">Fournisseur</th>
              <th className="py-2 pr-2 font-semibold tabular-nums text-right">
                Total marchés
              </th>
              <th className="py-2 pr-2 font-semibold tabular-nums text-right">
                Nb
              </th>
              <th className="py-2 pr-2 font-semibold tabular-nums text-right">
                Ticket moyen
              </th>
              <th className="py-2 pr-2 font-semibold">SIREN</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {TOP_REEL.top100.map((f) => (
              <tr key={f.rang} className="border-b border-slate-100">
                <td className="py-2 pr-2 font-mono text-slate-400">
                  #{String(f.rang).padStart(3, "0")}
                </td>
                <td className="py-2 pr-2 font-semibold text-slate-900">
                  {f.raisonSociale}
                </td>
                <td className="py-2 pr-2 tabular-nums text-right font-semibold">
                  {(f.totalMontantEur / 1e6).toLocaleString("fr-FR", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  M€
                </td>
                <td className="py-2 pr-2 tabular-nums text-right">
                  {f.nbMarches.toLocaleString("fr-FR")}
                </td>
                <td className="py-2 pr-2 tabular-nums text-right text-slate-500">
                  {(f.ticketMoyenEur / 1000).toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  K€
                </td>
                <td className="py-2 pr-2 font-mono text-[10px] text-slate-500">
                  {f.siren}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DownloadableCard>
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
    <div className="bg-white/80 border border-purple-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-purple-700 font-semibold">
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
