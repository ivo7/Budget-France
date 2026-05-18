// ============================================================================
// BouclierTarifairePage — bouclier énergie 2021-2024, ~110 Md€ cumulés
// ============================================================================
//
// Route : #/bouclier-tarifaire
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
  CHRONOLOGIE_BOUCLIER,
  DISPOSITIFS_BOUCLIER,
  RECETTES_BOUCLIER,
  COMPARAISONS_BOUCLIER_UE,
  ETUDES_BOUCLIER,
  MYTHES_BOUCLIER,
  CATEGORIES_BOUCLIER,
  COUT_CUMULE_BOUCLIER_MD,
  TOTAL_DISPOSITIFS_MD,
  TOTAL_RECETTES_MD,
  BOUCLIER_PIB_PCT,
} from "../data/bouclierTarifaire";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function BouclierTarifairePage() {
  // Bar chart : chronologie année par année
  const barAnnees = CHRONOLOGIE_BOUCLIER.map((a) => ({
    annee: a.annee.toString(),
    cout: a.coutMdEur,
    contexte: a.contexte,
    color:
      a.coutMdEur > 30
        ? "#dc2626"
        : a.coutMdEur > 15
          ? "#f97316"
          : a.coutMdEur > 5
            ? "#f59e0b"
            : "#facc15",
  }));

  // Bar chart : comparaisons UE en absolu
  const barUE = [...COMPARAISONS_BOUCLIER_UE]
    .sort((a, b) => b.coutMdEur - a.coutMdEur)
    .map((p) => ({
      nom: `${p.emoji} ${p.pays}`,
      pays: p.pays,
      cout: p.coutMdEur,
      pibPct: p.pibPct,
      color: p.pays === "France" ? "#f97316" : "#94a3b8",
    }));

  // Bar chart : dispositifs (top 8)
  const dispositifsSorted = [...DISPOSITIFS_BOUCLIER].sort(
    (a, b) => b.coutCumuleMdEur - a.coutCumuleMdEur,
  );
  const barDispositifs = dispositifsSorted.map((d) => ({
    nom: abbrev(d.nom, 32),
    nomComplet: d.nom,
    cout: d.coutCumuleMdEur,
    color: CATEGORIES_BOUCLIER[d.categorie].color,
  }));

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-orange-50 to-white border border-orange-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-orange-700 font-semibold">
          Crise énergétique 2021-2024 · Bilan complet
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Bouclier tarifaire : ~{COUT_CUMULE_BOUCLIER_MD.toFixed(0)} Md€ en 4 ans
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          De octobre 2021 à fin 2024, la France a mis en place une{" "}
          <strong>mosaïque de ~10 dispositifs</strong> (gel des tarifs gaz et
          électricité, remise carburant, chèques, amortisseur entreprises) pour
          protéger ménages et entreprises de la flambée des prix. Coût cumulé
          estimé par la Cour des comptes : <strong>~{COUT_CUMULE_BOUCLIER_MD.toFixed(0)}{" "}
          Md€</strong> (~{BOUCLIER_PIB_PCT} % PIB cumulés). Sans le bouclier,
          INSEE estime que l'inflation aurait été +1,5 à +2 points plus
          élevée.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Coût cumulé 2021-2024"
            value={`~${COUT_CUMULE_BOUCLIER_MD.toFixed(0)} Md€`}
            hint="Cour des comptes 2024"
          />
          <KpiBox
            label="Pic annuel"
            value="36 Md€"
            hint="Année 2023"
          />
          <KpiBox
            label="% PIB cumulé"
            value={`~${BOUCLIER_PIB_PCT} %`}
            hint="2021-2024"
          />
          <KpiBox
            label="Effet inflation"
            value="−1,5 à −2 pts"
            hint="INSEE, 2022-2023"
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
            « Bouclier tarifaire » désigne en fait l'<strong>ensemble des
            dispositifs</strong> mis en place entre octobre 2021 et fin 2024
            pour protéger ménages et entreprises de la crise énergétique
            (post-Covid puis guerre en Ukraine). Au sens strict, le terme
            désigne le gel/limitation des tarifs gaz et électricité, mais dans
            le débat public il englobe :
          </p>
          <ul className="space-y-2 ml-2">
            <li>
              • <strong>Gel TRV gaz</strong> puis <strong>limitation hausse
              TRV électricité</strong> (+4 % en 2022, +15 % en 2023, +10 % en
              2024)
            </li>
            <li>
              • <strong>Remise carburant 18 ct/L</strong> (avril-déc 2022)
              puis <strong>chèque carburant 100 €</strong> ciblé (2023)
            </li>
            <li>
              • <strong>Amortisseur électricité PME/collectivités</strong> et
              guichets ad hoc pour grandes entreprises électro-intensives
            </li>
            <li>
              • <strong>Chèques exceptionnels</strong> (indemnité inflation
              100 €, chèque énergie bonus)
            </li>
          </ul>
          <p>
            Mécanisme principal : <strong>l'État compense aux fournisseurs</strong>{" "}
            l'écart entre prix réglementé bloqué et prix de marché — la
            facture finit dans le déficit public. Seules ~3 % des dépenses
            ont été couvertes par les taxes superprofits (CRIM + CSE).
          </p>
        </div>
      </section>

      {/* Chronologie année par année */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Coût annuel 2021 → 2024
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Trajectoire en cloche : lancement modeste fin 2021, pic en 2023, sortie progressive en 2024.
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barAnnees}
              margin={{ top: 20, right: 24, left: 24, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="annee"
                stroke="#475569"
                tick={{ fontSize: 13, fontWeight: 600 }}
              />
              <YAxis
                tickFormatter={(v: number) => `${v} Md€`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: number) => [`${v} Md€`, "Coût annuel"]}
                labelFormatter={(label, payload) =>
                  (payload as { payload?: { contexte?: string } }[])?.[0]
                    ?.payload?.contexte
                    ? `${label} — ${(payload as { payload?: { contexte?: string } }[])[0].payload?.contexte}`
                    : label
                }
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cout" radius={[6, 6, 0, 0]}>
                {barAnnees.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2 mt-4">
          {CHRONOLOGIE_BOUCLIER.map((a) => (
            <li
              key={a.annee}
              className="border border-slate-200 rounded-lg p-3 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <span className="font-display font-semibold text-slate-900">
                  {a.annee} — {a.contexte}
                </span>
                <span className="font-display text-base font-bold tabular-nums text-orange-700">
                  {a.coutMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {a.evenement}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Dispositifs détail */}
      <DownloadableCard
        filename="bouclier-tarifaire-dispositifs"
        shareTitle="Budget France — Bouclier tarifaire : détail des dispositifs"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            dispositifsSorted.map((d, i) => ({
              rang: i + 1,
              dispositif: d.nom,
              categorie: CATEGORIES_BOUCLIER[d.categorie].label,
              cout_cumule_md_eur: d.coutCumuleMdEur,
              periode: d.periode,
              beneficiaires: d.beneficiaires,
              source: d.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Les {DISPOSITIFS_BOUCLIER.length} dispositifs détaillés
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Périodes, bénéficiaires, coût cumulé estimé sur la période 2021-2024.
          Total dispositifs identifiés : ~{TOTAL_DISPOSITIFS_MD.toFixed(0)} Md€.
        </p>

        <div className="h-[420px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barDispositifs}
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
                formatter={(v: number) => [`${v.toFixed(1)} Md€`, "Coût cumulé"]}
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
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {barDispositifs.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-3">
          {dispositifsSorted.map((d, i) => (
            <li
              key={d.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-orange-400 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl mr-1">{d.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {d.nom}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CATEGORIES_BOUCLIER[d.categorie].color}15`,
                      color: CATEGORIES_BOUCLIER[d.categorie].color,
                      border: `1px solid ${CATEGORIES_BOUCLIER[d.categorie].color}40`,
                    }}
                  >
                    {CATEGORIES_BOUCLIER[d.categorie].label}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-orange-700">
                    {d.coutCumuleMdEur.toFixed(1)} Md€
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {d.description}
              </p>
              <div className="mt-2 text-xs text-slate-600">
                <strong>Période :</strong> {d.periode}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                <strong>Bénéficiaires :</strong> {d.beneficiaires}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Source : {d.source}
              </div>
            </li>
          ))}
        </ul>
      </DownloadableCard>

      {/* Comparaisons UE */}
      <section className="card p-5 md:p-6 bg-blue-50/20 border-blue-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Comparaison européenne
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Tous les pays UE ont mis en place des dispositifs similaires. Total
          UE estimé à ~700 Md€ d'aides énergétiques sur la période (Bruegel
          2023).
        </p>
        <div className="h-[330px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barUE}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 110, bottom: 8 }}
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
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip
                formatter={(v: number) => [`${v} Md€`, "Aides énergie"]}
                labelFormatter={(label, payload) => {
                  const item = (
                    payload as {
                      payload?: { pays?: string; pibPct?: number };
                    }[]
                  )?.[0]?.payload;
                  if (item?.pays && item?.pibPct !== undefined) {
                    return `${item.pays} (${item.pibPct} % PIB)`;
                  }
                  return item?.pays ?? label;
                }}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {barUE.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2">
          {COMPARAISONS_BOUCLIER_UE.map((p) => (
            <li
              key={p.pays}
              className="border border-blue-200/40 bg-white rounded-lg p-3"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <span className="font-display font-semibold text-slate-900">
                  <span className="text-lg mr-2">{p.emoji}</span>
                  {p.pays}
                </span>
                <span className="font-display text-sm font-bold tabular-nums text-blue-700">
                  {p.coutMdEur} Md€ · {p.pibPct} % PIB
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Recettes contributives */}
      <section className="card p-5 md:p-6 bg-emerald-50/20 border-emerald-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Qui paye le bouclier ?
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Les recettes contributives (taxes superprofits, etc.) ne couvrent
          qu'une faible part. Total identifié : ~
          {TOTAL_RECETTES_MD.toFixed(1)} Md€ (sur ~{COUT_CUMULE_BOUCLIER_MD.toFixed(0)}{" "}
          Md€ de coûts). Le reste a été financé par la dette publique.
        </p>
        <ul className="space-y-3">
          {RECETTES_BOUCLIER.map((r, i) => (
            <li
              key={i}
              className="border border-emerald-200/40 bg-white rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-xl mr-1">{r.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {r.poste}
                  </h3>
                </div>
                <span
                  className={`font-display text-lg font-bold tabular-nums shrink-0 ${r.montantMdEur >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {r.montantMdEur >= 0 ? "+" : ""}
                  {r.montantMdEur.toFixed(1)} Md€
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

      {/* Études économiques */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          6 études économiques de référence
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Cour des comptes, IPP, IGF, INSEE, Bruegel, I4CE — diagnostics
          partiellement convergents : efficacité macro indéniable, ciblage et
          impact climat critiqués.
        </p>
        <ul className="space-y-3">
          {ETUDES_BOUCLIER.map((e) => (
            <li
              key={e.source}
              className="border border-slate-200 rounded-xl p-4 hover:border-orange-400 transition"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {e.source}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {e.annee}
                </span>
              </div>
              <div className="text-sm font-medium text-orange-800 bg-orange-50 border-l-2 border-orange-400 px-3 py-1.5 rounded-r my-2">
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
          6 idées reçues sur le bouclier tarifaire
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Sujet où la mémoire publique est rapide à se faire — voici les
          chiffres officiels pour distinguer le vrai du faux.
        </p>
        <ul className="space-y-3">
          {MYTHES_BOUCLIER.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-orange-400 transition"
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
            <strong>~{COUT_CUMULE_BOUCLIER_MD.toFixed(0)} Md€ cumulés</strong>{" "}
            sur 2021-2024 (Cour des comptes 2024). Trajectoire en cloche : 6
            Md€ en 2021, pic à 36 Md€ en 2023, sortie progressive (28 Md€ en
            2024). Soit ~{BOUCLIER_PIB_PCT} % PIB cumulés.
          </>,
          <>
            <strong>~10 dispositifs distincts</strong> : bouclier gaz (18 Md€),
            bouclier électricité (40 Md€), remise carburant (8 Md€),
            amortisseur entreprises (6 Md€), guichet grandes entreprises (3,5
            Md€), chèques exceptionnels (5+ Md€). Le bouclier électricité est
            le 1ᵉʳ poste.
          </>,
          <>
            <strong>Efficacité macro</strong> : sans bouclier, l'inflation
            2022-2023 aurait été ~+1,5 à +2 points plus élevée (INSEE).
            Pouvoir d'achat protégé, transition économique amortie.
          </>,
          <>
            <strong>Ciblage critiqué</strong> : selon l'IPP, les 10 % les plus
            aisés ont reçu en moyenne 1 400 € d'aides cumulées, vs 850 € pour
            les 10 % les plus modestes (car ils consomment plus en absolu).
            Anti-redistributif en euros sonnants.
          </>,
          <>
            <strong>Financement par la dette</strong> : seulement ~3 Md€ ont
            été récupérés via les taxes superprofits (CRIM électriciens, CSE
            pétroliers) sur ~110 Md€ de coûts. Le reste a alimenté le déficit
            public 2022-2024.
          </>,
          <>
            <strong>Impact climat négatif</strong> : selon I4CE, le bouclier a
            annulé l'effet incitatif des prix élevés sur la sobriété
            énergétique. France −7 % consommation 2022 vs −12 % Allemagne, −10
            % Italie. Tension entre protection sociale et signal-prix climat.
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
            — « Le bouclier tarifaire, bilan et leçons » (2024)
          </>,
          <>
            <a
              href="https://www.ipp.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              IPP
            </a>{" "}
            — étude redistributive des dispositifs énergie (2023)
          </>,
          <>
            <a
              href="https://www.economie.gouv.fr/igf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              IGF
            </a>{" "}
            — rapport efficacité du dispositif (2023)
          </>,
          <>
            <a
              href="https://www.insee.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              INSEE
            </a>{" "}
            — impact sur l'inflation (analyses 2023)
          </>,
          <>
            <a
              href="https://www.bruegel.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Bruegel
            </a>{" "}
            — base de données « National policies to shield consumers from
            rising energy prices » (mise à jour 2023)
          </>,
          <>
            <a
              href="https://www.i4ce.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              I4CE
            </a>{" "}
            — note critique impact transition énergétique (2023)
          </>,
          <>CRE (Commission de Régulation de l'Énergie) — analyses TRV</>,
          <>DGFiP — comptes annuels superprofits, ARENH</>,
        ]}
        methode={
          <>
            <strong>Coût cumulé</strong> : ~110 Md€ est la fourchette centrale
            de la Cour des comptes 2024. Les estimations exactes varient
            (95-130 Md€) selon le périmètre inclus : l'indemnité inflation
            2021 et certaines aides ad hoc grandes entreprises sont parfois
            exclues.
            <br />
            <br />
            <strong>Dispositifs</strong> : nous présentons les 9 principaux,
            qui agrégés représentent ~95 % du total. Les ~5 % restants
            correspondent à des dispositifs sectoriels (agriculture
            énergivore, secteur HORECA) et aides d'État ponctuelles.
            <br />
            <br />
            <strong>Comparaisons UE</strong> : données Bruegel 2023, méthode
            harmonisée (aides ménages + entreprises, hors mesures
            réglementaires comme « exception ibérique » Espagne qui sont
            valorisées différemment).
          </>
        }
        limites={
          <>
            Le coût « net » du bouclier pour les finances publiques est
            difficile à isoler du coût « brut » : certaines dépenses (ARENH
            élargi) ont été compensées partiellement par d'autres recettes
            (TICFE temporairement réduite puis ré-augmentée). La Cour des
            comptes elle-même donne une fourchette.
            <br />
            <br />
            L'impact distributif IPP est calculé en € absolus annuels, pas
            en % du revenu disponible. EN % du revenu, le bouclier est plus
            équitable (les pauvres y gagnent ~3-5 % de leur revenu vs ~1 %
            pour les riches). Les deux lectures sont valides selon ce qu'on
            veut mesurer.
            <br />
            <br />
            L'effet sur le climat (-7 % conso France) est aussi influencé par
            la sortie nucléaire allemande et le doux hiver 2022-2023. Difficile
            d'isoler la seule responsabilité du bouclier français.
          </>
        }
        miseAJour="Données 2024 (rapport Cour des comptes février 2024). Bilan définitif attendu fin 2025."
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
    <div className="bg-white/80 border border-orange-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-orange-700 font-semibold">
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
