// ============================================================================
// DetteEntreprisesPubliquesPage — la « dette cachée » des entreprises de l'État
// ============================================================================
//
// Route : #/dette-entreprises-publiques
// ============================================================================

import { useMemo, useState } from "react";
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
  DETTE_MAASTRICHT_2024_MD_EUR,
  ENTREPRISES_PUBLIQUES,
  REPRISES_HISTORIQUES,
  TOTAL_DETTE_MD_EUR,
  TOTAL_REPRISES_HISTORIQUES_MD_EUR,
  type SecteurEntreprisePublique,
} from "../data/detteEntreprisesPubliques";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

const COULEURS_SECTEUR: Record<SecteurEntreprisePublique, string> = {
  energie: "#dc2626",
  transport: "#0055A4",
  "finance-publique": "#7c3aed",
  defense: "#64748b",
  medias: "#d97706",
  industrie: "#0891b2",
};

const LABELS_SECTEUR: Record<SecteurEntreprisePublique, string> = {
  energie: "Énergie",
  transport: "Transport",
  "finance-publique": "Finance publique",
  defense: "Défense",
  medias: "Médias",
  industrie: "Industrie",
};

const COULEURS_RISQUE = {
  faible: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  modere: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  eleve: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
} as const;

type FilterValue = "tous" | SecteurEntreprisePublique;

export function DetteEntreprisesPubliquesPage() {
  const [filter, setFilter] = useState<FilterValue>("tous");

  const sorted = useMemo(
    () => [...ENTREPRISES_PUBLIQUES].sort((a, b) => b.detteNetteMdEur - a.detteNetteMdEur),
    [],
  );

  const filtered = useMemo(
    () => (filter === "tous" ? sorted : sorted.filter((e) => e.secteur === filter)),
    [sorted, filter],
  );

  const totalAffiche = filtered.reduce((acc, e) => acc + e.detteNetteMdEur, 0);
  const pctDetteMaastricht = (TOTAL_DETTE_MD_EUR / DETTE_MAASTRICHT_2024_MD_EUR) * 100;

  const barData = sorted.slice(0, 14).map((e) => ({
    nom: e.nom.length > 25 ? e.nom.slice(0, 24) + "…" : e.nom,
    nomComplet: e.nom,
    dette: e.detteNetteMdEur,
    color: COULEURS_SECTEUR[e.secteur],
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-red-50 to-white border border-red-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-red-700 font-semibold">
          Angle mort fiscal · Dette publique « hors-bilan »
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          La dette cachée des entreprises publiques
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Quand on parle de dette publique française (~3 400 Md€), on parle
          de la dette « au sens de Maastricht ». Mais{" "}
          <strong>en parallèle, les entreprises publiques portent ~{Math.round(TOTAL_DETTE_MD_EUR)} Md€
          de dette supplémentaire</strong> : EDF, SNCF Réseau, Société du Grand
          Paris, AFD, CADES… Cette dette est <em>de facto</em> garantie par l'État
          et peut être <strong>reprise officiellement</strong> en cas de
          difficulté — comme cela est arrivé avec la SNCF en 2018-2020 (35 Md€).
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Dette consolidée entreprises pub."
            value={`~${Math.round(TOTAL_DETTE_MD_EUR)} Md€`}
            hint="hors Maastricht"
            color="text-red-700"
          />
          <KpiBox
            label="% dette Maastricht"
            value={`${pctDetteMaastricht.toFixed(1)} %`}
            hint={`vs ${DETTE_MAASTRICHT_2024_MD_EUR} Md€ Maastricht`}
            color="text-orange-700"
          />
          <KpiBox
            label="Repris historiquement"
            value={`~${Math.round(TOTAL_REPRISES_HISTORIQUES_MD_EUR)} Md€`}
            hint="depuis 1993 (5 cas majeurs)"
            color="text-red-700"
          />
          <KpiBox
            label="Plus gros débiteur"
            value="EDF"
            hint="64,5 Md€ après renationalisation 2023"
            color="text-red-700"
          />
        </div>
      </header>

      {/* Comprendre */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Pourquoi cette dette n'est-elle pas dans la dette publique ?
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            La <strong>dette publique au sens Maastricht</strong> (norme UE
            harmonisée) ne compte que la dette des « administrations publiques »
            (État central, Sécu, collectivités). Les entreprises publiques (EPIC,
            SA détenues par l'État) ne sont <strong>pas</strong> comptées dedans
            — même quand elles sont à 100 % publiques.
          </p>
          <p>
            <strong>Logique</strong> : ces entreprises ont (théoriquement) leurs
            propres recettes pour rembourser leur dette (tarifs SNCF, ventes
            d'électricité, péages, etc.). Elles ne dépendent pas du budget de
            l'État.
          </p>
          <p>
            <strong>Mais...</strong> dans la pratique, quand une entreprise
            publique devient insolvable, l'État reprend la dette pour éviter
            l'effondrement. C'est arrivé :
          </p>
          <ul className="space-y-1 ml-3 text-xs">
            <li>• <strong>1993-1999</strong> : Crédit Lyonnais — ~28 Md€ (en € 2024)</li>
            <li>• <strong>2017</strong> : Areva — 4,5 Md€ de recapitalisation</li>
            <li>• <strong>2018-2020</strong> : SNCF Réseau — 35 Md€ repris</li>
            <li>• <strong>2020-2021</strong> : Air France-KLM — 7 Md€ d'aides Covid</li>
            <li>• <strong>2023</strong> : EDF renationalisée à 100 % (9,7 Md€ OPRA)</li>
          </ul>
          <p>
            <strong>Risque actuel</strong> : EDF (lourde endettement programme EPR),
            SGP Grand Paris (dette de 35 Md€ remboursée par recettes fiscales jusqu'en
            2070), Orano (dépendance marché uranium).
          </p>
        </div>
      </section>

      {/* Bar chart */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Top 14 par dette nette
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Dette nette (dettes financières - trésorerie) en Md€, exercice 2023-2024.
        </p>

        <div className="h-[440px] w-full">
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
                dataKey="nom"
                stroke="#475569"
                tick={{ fontSize: 11 }}
                width={120}
                interval={0}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} Md€`, "Dette nette"]}
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
              <Bar dataKey="dette" radius={[0, 4, 4, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Légende couleurs */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {(Object.keys(LABELS_SECTEUR) as SecteurEntreprisePublique[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: COULEURS_SECTEUR[s] }}
              />
              <span className="text-slate-700">{LABELS_SECTEUR[s]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Détail filtrable */}
      <DownloadableCard
        filename="dette-entreprises-publiques"
        shareTitle="Budget France — Dette des entreprises publiques"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.map((e) => ({
              entreprise: e.nom,
              secteur: LABELS_SECTEUR[e.secteur],
              dette_nette_md_eur: e.detteNetteMdEur,
              participation_etat_pct: e.participationEtatPct,
              statut: e.statut,
              risque_reprise: e.risqueReprise,
            })),
          )
        }
      >
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Détail par entreprise
          </h2>
          <span className="text-xs text-slate-500">
            Total affiché : <strong>{totalAffiche.toFixed(1)} Md€</strong> ({filtered.length} entreprises)
          </span>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          <FilterButton
            active={filter === "tous"}
            onClick={() => setFilter("tous")}
            label="Toutes"
            color="#475569"
          />
          {(Object.keys(LABELS_SECTEUR) as SecteurEntreprisePublique[]).map((s) => (
            <FilterButton
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={LABELS_SECTEUR[s]}
              color={COULEURS_SECTEUR[s]}
            />
          ))}
        </div>

        <ul className="space-y-3">
          {filtered.map((e) => {
            const risque = COULEURS_RISQUE[e.risqueReprise];
            return (
              <li
                key={e.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-red-300 transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-2 flex-1 min-w-0">
                    <span className="text-xl">{e.emoji}</span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {e.nom}
                        {e.abbr && (
                          <span className="ml-2 text-xs font-mono text-slate-500">
                            ({e.abbr})
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {e.statut} · {e.effectif}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-xl font-bold tabular-nums text-slate-900">
                      {e.detteNetteMdEur > 0
                        ? `${e.detteNetteMdEur.toFixed(1)} Md€`
                        : "n/a"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      État {e.participationEtatPct} %
                    </div>
                    <div
                      className={`text-[10px] mt-1 px-2 py-0.5 rounded-full inline-block border ${risque.bg} ${risque.text} ${risque.border}`}
                    >
                      Risque reprise{" "}
                      {e.risqueReprise === "eleve"
                        ? "élevé"
                        : e.risqueReprise === "modere"
                          ? "modéré"
                          : "faible"}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                  {e.description}
                </p>

                <div className="mt-2 text-[10px] text-slate-400">Source : {e.source}</div>
              </li>
            );
          })}
        </ul>
      </DownloadableCard>

      {/* Reprises historiques */}
      <section className="card p-5 md:p-6 bg-red-50/30 border-red-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Quand l'État reprend la dette : cas historiques
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          ~
          {Math.round(TOTAL_REPRISES_HISTORIQUES_MD_EUR)}{" "}
          Md€ de dette d'entreprises publiques ont été repris par l'État depuis
          1993. Cette dette s'ajoute mécaniquement à la dette Maastricht et
          augmente le ratio dette/PIB.
        </p>
        <ul className="space-y-3">
          {REPRISES_HISTORIQUES.map((r, i) => (
            <li
              key={i}
              className="border border-red-200/60 bg-white rounded-lg p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <strong className="text-slate-900">
                  {r.entreprise}
                  <span className="ml-2 text-xs text-slate-500 font-normal">
                    {r.annee}
                  </span>
                </strong>
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="font-display font-bold tabular-nums text-red-700">
                    {r.montantMdEur.toFixed(1)} Md€
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({r.pibPct.toFixed(1)} % PIB de l'époque)
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {r.contexte}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>~{Math.round(TOTAL_DETTE_MD_EUR)} Md€ de dette consolidée</strong>{" "}
            sur les principales entreprises publiques, soit{" "}
            <strong>{pctDetteMaastricht.toFixed(1)} % de la dette Maastricht</strong>{" "}
            de la France. Cette dette n'est <strong>pas</strong> comptée dans le ratio
            officiel mais peut être reprise par l'État.
          </>,
          <>
            <strong>EDF (64,5 Md€)</strong> et{" "}
            <strong>SNCF Réseau (38 Md€)</strong> sont les plus gros débiteurs, devant
            la <strong>Société du Grand Paris (35 Md€)</strong>. Ces 3 entreprises
            portent à elles seules ~135 Md€ de dette.
          </>,
          <>
            <strong>L'État a déjà repris ~{Math.round(TOTAL_REPRISES_HISTORIQUES_MD_EUR)} Md€</strong>{" "}
            de dette d'entreprises publiques depuis 1993 (Crédit Lyonnais 28, SNCF
            Réseau 35, Areva 4,5, Air France 7…). Ce qui était « hors-bilan »
            devient officiellement de la dette publique.
          </>,
          <>
            <strong>Risque élevé sur EDF et SGP</strong> : programme EPR2 (6 réacteurs
            prévus, ~50 Md€ d'investissement), Grand Paris Express dépendant
            de recettes fiscales jusqu'en 2070. Vigilance Cour des comptes.
          </>,
          <>
            <strong>La dette « cachée » ne ment pas longtemps</strong> : tôt ou tard,
            si l'entreprise publique est en difficulté, l'État reprend. À ne
            pas oublier dans les débats sur la « vraie » dette publique
            française.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.ccomptes.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Cour des comptes
            </a>{" "}
            — rapport annuel sur l'État actionnaire (2024)
          </>,
          <>
            <a
              href="https://www.economie.gouv.fr/agence-participations-etat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              APE
            </a>{" "}
            — Agence des Participations de l'État, rapport annuel
          </>,
          <>
            Rapports financiers individuels : EDF, SNCF, RATP, AFD, ADP, Orano,
            Naval Group, etc.
          </>,
          <>
            CADES, AFITF, Société du Grand Paris — rapports annuels
          </>,
          <>
            INSEE — comptes nationaux des sociétés non financières publiques
          </>,
          <>
            Eurostat — perimètre Maastricht et règles SEC 2010
          </>,
        ]}
        methode={
          <>
            <strong>Dette nette</strong> = dettes financières totales -
            trésorerie et équivalents. Périmètre : exercice 2023 ou 2024 selon
            disponibilité du rapport annuel. Inclusion : entreprises majoritairement
            détenues par l'État (&gt; 50 % du capital ou EPIC) avec une dette
            significative (&gt; 1 Md€). Exclu : Engie (privatisée 64 % depuis 2014),
            La Poste consolidée (compte-courant CDC).
          </>
        }
        limites={
          <>
            La frontière « dette publique » vs « dette entreprise publique » est
            mouvante : Eurostat révise régulièrement la classification (cas SNCF
            Réseau reclassée en 2017). Certaines garanties implicites (CDC, AFD,
            La Poste) sont difficiles à chiffrer. Les concessions privées
            (autoroutes, aéroports) ne sont pas incluses ici car déjà privatisées.
          </>
        }
        miseAJour="Exercices 2023-2024 (rapports publiés 2024-2025)."
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
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <div className="bg-white/80 border border-red-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-red-700 font-semibold">
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

function FilterButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
      }`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  );
}
