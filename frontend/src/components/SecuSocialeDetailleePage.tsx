// ============================================================================
// SecuSocialeDetailleePage — la Sécu française, branche par branche
// ============================================================================
//
// Page complémentaire à SecuCollectivitesPage (qui couvre le macro). Ici on
// rentre dans le détail de chaque branche : recettes, dépenses, solde,
// principaux postes, enjeux, et historique du solde global depuis 2000.
//
// Route : #/securite-sociale
// ============================================================================

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BRANCHES_SECU,
  HISTORIQUE_SOLDE_SECU,
  TOTAL_SECU_DEPENSES,
  TOTAL_SECU_RECETTES,
  TOTAL_SECU_SOLDE,
  type BrancheSecu,
} from "../data/secuSocialeDetail";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function SecuSocialeDetailleePage() {
  const [brancheActive, setBrancheActive] = useState<string>("maladie");
  const branche = BRANCHES_SECU.find((b) => b.id === brancheActive)!;

  // Évolution solde — formaté pour Recharts
  const soldeChartData = HISTORIQUE_SOLDE_SECU.map((s) => ({
    annee: s.annee,
    solde: s.solde,
    contexte: s.contexte,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
          Protection sociale française · ~620 Md€/an
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          La Sécu, branche par branche
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          La Sécurité sociale, c'est <strong>{TOTAL_SECU_DEPENSES.toFixed(0)} Md€</strong>{" "}
          de dépenses chaque année — bien plus que le budget de l'État central.
          Mais la majorité des Français paient ~30 % de leur salaire à la Sécu sans savoir
          précisément où va cet argent. Cette page détaille les <strong>5 branches du
          régime général</strong> + l'<strong>Unédic</strong> (chômage), pour comprendre
          où chaque euro de cotisation est dépensé.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Recettes 2024"
            value={`${TOTAL_SECU_RECETTES.toFixed(0)} Md€`}
            color="text-emerald-700"
          />
          <KpiBox
            label="Dépenses 2024"
            value={`${TOTAL_SECU_DEPENSES.toFixed(0)} Md€`}
            color="text-slate-700"
          />
          <KpiBox
            label="Solde 2024"
            value={`${TOTAL_SECU_SOLDE >= 0 ? "+" : ""}${TOTAL_SECU_SOLDE.toFixed(1)} Md€`}
            color={TOTAL_SECU_SOLDE >= 0 ? "text-emerald-700" : "text-red-700"}
            hint={TOTAL_SECU_SOLDE >= 0 ? "Excédent" : "Déficit"}
          />
          <KpiBox
            label="% du PIB"
            value="~21 %"
            color="text-emerald-700"
            hint="≈ 1/5 de la richesse nationale"
          />
        </div>
      </header>

      {/* Vue d'ensemble : 6 cards branches */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Les 6 branches en un coup d'œil
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Cliquez sur une carte pour ouvrir le détail de cette branche.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRANCHES_SECU.map((b) => {
            const solde = b.recettesMdEur - b.depensesMdEur;
            const isActive = b.id === brancheActive;
            const soldeColor =
              solde > 0.5 ? "text-emerald-700" :
              solde < -0.5 ? "text-red-700" :
              "text-slate-600";

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrancheActive(b.id)}
                className={`text-left p-4 rounded-xl border transition ${
                  isActive
                    ? "border-2 shadow-md bg-white"
                    : "border-slate-200 bg-white hover:border-brand/40 hover:shadow-sm"
                }`}
                style={
                  isActive
                    ? { borderColor: b.couleur }
                    : {}
                }
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl">{b.emoji}</span>
                  <div className="font-display text-sm font-semibold text-slate-900">
                    {b.nom}
                    {b.abbr && (
                      <span className="ml-2 text-[10px] font-mono text-slate-400">
                        {b.abbr}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="font-display text-xl font-bold tabular-nums text-slate-900">
                    {b.depensesMdEur.toFixed(0)} Md€
                  </div>
                  <div className="text-[10px] text-slate-500">de dépenses/an</div>
                </div>
                <div
                  className={`text-xs font-mono mt-1 ${soldeColor}`}
                >
                  Solde : {solde >= 0 ? "+" : ""}
                  {solde.toFixed(1)} Md€
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Détail de la branche active */}
      <BrancheDetail branche={branche} />

      {/* Historique du solde Sécu */}
      <DownloadableCard
        filename="historique-solde-secu"
        shareTitle="Budget France — Historique solde Sécu"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            HISTORIQUE_SOLDE_SECU.map((s) => ({
              annee: s.annee,
              solde_md_eur: s.solde,
              contexte: s.contexte ?? "",
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Le solde de la Sécu depuis 2000
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Solde global du régime général de Sécurité sociale (5 branches), en Md€
          courants. Hors Unédic.
        </p>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={soldeChartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="annee" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v} Md€`}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} Md€`, "Solde"]}
                labelFormatter={(label) => `Année ${label}`}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="solde"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ fill: "#16a34a", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-4 space-y-1 text-xs text-slate-600">
          <li>
            <strong className="text-slate-800">2009-2010</strong> : pic à -24 Md€
            (crise financière mondiale)
          </li>
          <li>
            <strong className="text-slate-800">2019</strong> : 1ᵉʳ excédent depuis
            2001 (+1,4 Md€)
          </li>
          <li>
            <strong className="text-slate-800">2020</strong> : choc Covid, déficit
            record -39,7 Md€
          </li>
          <li>
            <strong className="text-slate-800">2024</strong> : déficit stabilisé
            -10,5 Md€ — toujours élevé après 4 ans de retour à la normale
          </li>
        </ul>
      </DownloadableCard>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Comment ça marche, la Sécu ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            La <strong>Sécurité sociale</strong> a été créée en 1945 par le
            Conseil national de la Résistance, sur le principe simple :{" "}
            <em>« chacun cotise selon ses moyens et reçoit selon ses besoins »</em>.
            Elle est gérée paritairement par l'État, les syndicats et le patronat.
          </p>
          <p>
            <strong>Comment elle se finance ?</strong> Trois sources :
            <br />
            (1) <strong>Cotisations sociales</strong> sur les salaires (~55 % des
            recettes) : salariales (déduites du brut) + patronales (en plus du brut).
            <br />
            (2) <strong>CSG/CRDS</strong> (~25 %) : prélèvements généraux sur tous
            les revenus (salaires, retraites, capital). Créés en 1991 (CSG) et 1996 (CRDS).
            <br />
            (3) <strong>Affectations fiscales</strong> (~20 %) : part de TVA, taxe
            tabac/alcool, transferts État.
          </p>
          <p>
            <strong>Pourquoi en déficit ?</strong> Trois raisons structurelles :
            <br />
            (1) <strong>Vieillissement démographique</strong> : plus de retraités, plus
            de soins, moins d'actifs cotisants (1,7 actif/retraité aujourd'hui vs 2,5 en 1990).
            <br />
            (2) <strong>Innovation médicale coûteuse</strong> : nouveaux traitements
            (cancers, maladies rares) à 100 K€-1 M€ par patient.
            <br />
            (3) <strong>Choix politiques</strong> : exonérations de cotisations sur
            les bas salaires (~70 Md€/an), TVA réduite sur les produits 1ʳᵉ nécessité
            (~14 Md€), maintien de prestations généreuses.
          </p>
          <p>
            <strong>La dette sociale</strong> accumulée par les déficits successifs est
            transférée à la <strong>CADES</strong> (Caisse d'amortissement de la dette
            sociale). Financée par la CRDS (0,5 % sur tous les revenus). Date prévue de
            remboursement intégral : <strong>2033</strong>.
          </p>
        </div>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            La Sécu = <strong>{TOTAL_SECU_DEPENSES.toFixed(0)} Md€/an</strong>, soit
            21 % du PIB. Plus gros budget public français devant l'État central.
          </>,
          <>
            5 branches du régime général + Unédic. La{" "}
            <strong>Maladie</strong> (252 Md€) et la <strong>Retraite</strong>{" "}
            (158 Md€) pèsent à elles seules les deux tiers.
          </>,
          <>
            Déficit chronique depuis 2002, sauf <strong>2019 (+1,4 Md€)</strong>.
            Pic Covid à -39,7 Md€. Déficit 2024 stabilisé à -10,5 Md€.
          </>,
          <>
            Les exonérations de cotisations bas salaires (~70 Md€/an) sont le 1ᵉʳ
            poste structurel de manque à gagner pour la Sécu.
          </>,
          <>
            La <strong>CADES</strong> rembourse la dette sociale via la CRDS. Date
            prévue de fin du remboursement : <strong>2033</strong>.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.securite-sociale.fr/la-secu-cest-quoi/lfss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              LFSS 2025
            </a>{" "}
            — Loi de financement de la Sécurité sociale (votée en décembre 2024)
          </>,
          <>
            Commission des comptes de la Sécurité sociale (CCSS) — rapports semestriels
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
            — Comptes de la protection sociale 2024
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
            — Rapport annuel sur la Sécurité sociale (RALFSS)
          </>,
          <>
            <a
              href="https://www.cor-retraites.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Conseil d'Orientation des Retraites
            </a>{" "}
            (COR) — projections retraites
          </>,
          <>Unédic — rapport financier annuel</>,
        ]}
        methode={
          <>
            Les chiffres correspondent aux <strong>réalisations 2024</strong> ou aux
            prévisions LFSS 2025. Les sous-postes sont arrondis à 0,5 Md€ près. La
            Sécu au sens LFSS exclut les régimes complémentaires retraites (Agirc-Arrco,
            ~85 Md€) et les régimes spéciaux (~50 Md€), comptabilisés séparément.
          </>
        }
        limites={
          <>
            La répartition fine des sources de financement par branche est complexe (les
            CSG sont fongibles, la TVA affectée varie d'une année à l'autre). Les
            chiffres affichés sont des ordres de grandeur à mille millions près. Pour le
            détail précis, consulter le PLFSS publié chaque automne sur securite-sociale.fr.
          </>
        }
        miseAJour="LFSS 2025 (votée décembre 2024). Mise à jour annuelle prévue à chaque PLFSS."
      />
    </div>
  );
}

// ============================================================================
// Détail d'une branche
// ============================================================================

function BrancheDetail({ branche }: { branche: BrancheSecu }) {
  const solde = branche.recettesMdEur - branche.depensesMdEur;
  const soldeStatus =
    solde > 0.5 ? { label: "Excédent", color: "text-emerald-700", bg: "bg-emerald-50" } :
    solde < -0.5 ? { label: "Déficit", color: "text-red-700", bg: "bg-red-50" } :
    { label: "Équilibre", color: "text-slate-700", bg: "bg-slate-50" };

  return (
    <DownloadableCard
      filename={`secu-${branche.id}`}
      shareTitle={`Budget France — Sécu : ${branche.nom}`}
      className="card p-5 md:p-6"
      getCsvData={() =>
        objectsToCsv([
          { poste: "Recettes totales (Md€)", valeur: branche.recettesMdEur },
          { poste: "Dépenses totales (Md€)", valeur: branche.depensesMdEur },
          { poste: "Solde (Md€)", valeur: solde.toFixed(1) },
          ...branche.postesDepenses.map((p) => ({
            poste: `Dépense — ${p.poste} (Md€)`,
            valeur: p.montantMdEur,
          })),
          ...branche.sourcesRecettes.map((s) => ({
            poste: `Recette — ${s.source} (Md€)`,
            valeur: s.montantMdEur,
          })),
        ])
      }
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl">{branche.emoji}</span>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {branche.nom}
              {branche.abbr && (
                <span className="ml-2 text-sm font-mono text-slate-400 font-normal">
                  {branche.abbr}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{branche.perimetre}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${soldeStatus.bg} ${soldeStatus.color}`}
        >
          {soldeStatus.label} : {solde >= 0 ? "+" : ""}
          {solde.toFixed(1)} Md€
        </div>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{branche.description}</p>

      {/* 2 colonnes : recettes + dépenses */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recettes */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-emerald-700">
              ▲ Recettes — {branche.recettesMdEur.toFixed(1)} Md€
            </h3>
          </div>
          <ul className="space-y-2">
            {branche.sourcesRecettes.map((s) => (
              <li key={s.source}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">{s.source}</span>
                  <span className="tabular-nums font-semibold text-slate-900 shrink-0">
                    {s.montantMdEur.toFixed(1)} Md€
                  </span>
                </div>
                {s.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {s.description}
                  </div>
                )}
                <div className="h-1 bg-emerald-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(s.montantMdEur / branche.recettesMdEur) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Dépenses */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-red-700">
              ▼ Dépenses — {branche.depensesMdEur.toFixed(1)} Md€
            </h3>
          </div>
          <ul className="space-y-2">
            {branche.postesDepenses.map((p) => (
              <li key={p.poste}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-700 truncate">{p.poste}</span>
                  <span className="tabular-nums font-semibold text-slate-900 shrink-0">
                    {p.montantMdEur.toFixed(1)} Md€
                  </span>
                </div>
                {p.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.description}
                  </div>
                )}
                <div className="h-1 bg-red-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(p.montantMdEur / branche.depensesMdEur) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Enjeux */}
      <div className="mt-5 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
        <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
          Enjeux & défis
        </div>
        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{branche.enjeux}</p>
      </div>

      <div className="mt-2 text-[10px] text-slate-400">Source : {branche.source}</div>
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
    <div className="bg-white/80 border border-emerald-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
        {label}
      </div>
      <div className={`font-display text-xl md:text-2xl font-bold tabular-nums mt-0.5 ${color}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
