// ============================================================================
// EvaluationsPolitiquesPage — compilation des évaluations indépendantes
// ============================================================================
//
// Route : #/evaluations-politiques
// ============================================================================

import { useMemo, useState } from "react";
import {
  DOMAINE_INFO,
  EVALUATIONS,
  INSTITUTIONS_INFO,
  VERDICT_INFO,
  type Domaine,
  type Institution,
  type Verdict,
} from "../data/evaluationsPolitiques";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

type FiltreVerdict = "tous" | Verdict;
type FiltreInstitution = "toutes" | Institution;
type FiltreDomaine = "tous" | Domaine;

export function EvaluationsPolitiquesPage() {
  const [filtreVerdict, setFiltreVerdict] = useState<FiltreVerdict>("tous");
  const [filtreInstitution, setFiltreInstitution] = useState<FiltreInstitution>("toutes");
  const [filtreDomaine, setFiltreDomaine] = useState<FiltreDomaine>("tous");

  const filtered = useMemo(() => {
    return EVALUATIONS.filter((e) => {
      if (filtreVerdict !== "tous" && e.verdict !== filtreVerdict) return false;
      if (filtreInstitution !== "toutes" && e.institution !== filtreInstitution)
        return false;
      if (filtreDomaine !== "tous" && e.domaine !== filtreDomaine) return false;
      return true;
    });
  }, [filtreVerdict, filtreInstitution, filtreDomaine]);

  // Stats par verdict
  const statsVerdict = (Object.keys(VERDICT_INFO) as Verdict[]).map((v) => ({
    verdict: v,
    count: EVALUATIONS.filter((e) => e.verdict === v).length,
    info: VERDICT_INFO[v],
  }));

  // Institutions uniques pour le filtre
  const institutions = Array.from(
    new Set(EVALUATIONS.map((e) => e.institution)),
  ).sort();

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-violet-50 to-white border border-violet-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-violet-700 font-semibold">
          Évaluations indépendantes · Cour des comptes / IPP / France Stratégie
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Que disent les évaluations sur les politiques publiques ?
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Chaque grande politique publique est évaluée par des institutions
          indépendantes (Cour des comptes, France Stratégie, IPP, COR, CPO,
          DREES, inspections). Cette page <strong>compile les conclusions</strong>{" "}
          des évaluations majeures récentes : ce qui marche, ce qui ne marche
          pas, ce qu'on ne sait pas encore. Sources et liens vers les rapports
          originaux pour chaque dossier.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsVerdict.map((s) => (
            <KpiBox
              key={s.verdict}
              label={s.info.label}
              value={String(s.count)}
              hint="évaluations"
              color={s.info.color}
              emoji={s.info.emoji}
            />
          ))}
        </div>
      </header>

      {/* Filtres */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">
          Filtres
        </h2>

        <div className="space-y-3">
          {/* Verdict */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Verdict
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filtreVerdict === "tous"}
                onClick={() => setFiltreVerdict("tous")}
                label="Tous"
                color="#475569"
              />
              {(Object.keys(VERDICT_INFO) as Verdict[]).map((v) => (
                <FilterButton
                  key={v}
                  active={filtreVerdict === v}
                  onClick={() => setFiltreVerdict(v)}
                  label={`${VERDICT_INFO[v].emoji} ${VERDICT_INFO[v].label}`}
                  color={VERDICT_INFO[v].color}
                />
              ))}
            </div>
          </div>

          {/* Domaine */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Domaine
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filtreDomaine === "tous"}
                onClick={() => setFiltreDomaine("tous")}
                label="Tous"
                color="#475569"
              />
              {(Object.keys(DOMAINE_INFO) as Domaine[]).map((d) => (
                <FilterButton
                  key={d}
                  active={filtreDomaine === d}
                  onClick={() => setFiltreDomaine(d)}
                  label={`${DOMAINE_INFO[d].emoji} ${DOMAINE_INFO[d].label}`}
                  color="#7c3aed"
                />
              ))}
            </div>
          </div>

          {/* Institution */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Institution évaluatrice
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filtreInstitution === "toutes"}
                onClick={() => setFiltreInstitution("toutes")}
                label="Toutes"
                color="#475569"
              />
              {institutions.map((i) => (
                <FilterButton
                  key={i}
                  active={filtreInstitution === i}
                  onClick={() => setFiltreInstitution(i)}
                  label={i}
                  color="#0891b2"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          <strong>{filtered.length}</strong> évaluation(s) affichée(s) sur{" "}
          <strong>{EVALUATIONS.length}</strong> au total.
        </div>
      </section>

      {/* Liste des évaluations */}
      <DownloadableCard
        filename="evaluations-politiques"
        shareTitle="Budget France — Évaluations politiques publiques"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.map((e) => ({
              politique: e.politique,
              domaine: DOMAINE_INFO[e.domaine].label,
              annee_politique: e.anneePolitique,
              cout_md_eur: e.coutAnnuelMdEur ?? "",
              institution: e.institution,
              annee_evaluation: e.anneeEvaluation,
              verdict: VERDICT_INFO[e.verdict].label,
              conclusions: e.conclusions.join(" | "),
              source: e.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Évaluations
        </h2>

        {filtered.length === 0 ? (
          <div className="text-sm text-slate-500 italic py-6 text-center">
            Aucune évaluation ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((e) => {
              const verdict = VERDICT_INFO[e.verdict];
              const domaine = DOMAINE_INFO[e.domaine];
              const inst = INSTITUTIONS_INFO[e.institution];
              return (
                <li
                  key={e.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-violet-300 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-baseline gap-2 flex-1 min-w-0">
                      <span className="text-2xl">{e.emoji}</span>
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {e.politique}
                        </h3>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Mise en place : {e.anneePolitique}
                          {e.coutAnnuelMdEur != null && (
                            <>
                              {" "}· Coût : <strong>{e.coutAnnuelMdEur > 0 ? "+" : ""}
                              {e.coutAnnuelMdEur} Md€/an</strong>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: `${verdict.color}15`,
                          color: verdict.color,
                          border: `1px solid ${verdict.color}40`,
                        }}
                      >
                        {verdict.emoji} {verdict.label}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        <a
                          href={inst.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-700 hover:underline font-medium"
                        >
                          {e.institution}
                        </a>{" "}
                        · {e.anneeEvaluation}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {domaine.emoji} {domaine.label}
                      </div>
                    </div>
                  </div>

                  {/* Conclusions */}
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                      Conclusions principales
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {e.conclusions.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-violet-600 shrink-0">▸</span>
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommandations */}
                  {e.recommandations && e.recommandations.length > 0 && (
                    <div className="bg-emerald-50/40 border-l-2 border-emerald-300 rounded-r px-3 py-2 mb-2">
                      <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold mb-1">
                        Recommandations
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {e.recommandations.map((r, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-emerald-600 shrink-0">→</span>
                            <span className="leading-relaxed">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lien rapport */}
                  <div className="text-[10px] text-slate-500">
                    Source :{" "}
                    <a
                      href={e.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-700 hover:underline"
                    >
                      {e.source.replace("https://www.", "").slice(0, 60)}↗
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DownloadableCard>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>15 évaluations majeures compilées</strong> couvrant ~80 Md€
            de dépenses publiques annuelles. Verdict global : 4 positifs,{" "}
            {statsVerdict.find((s) => s.verdict === "mitige")?.count} mitigés,{" "}
            {statsVerdict.find((s) => s.verdict === "negatif")?.count} négatifs,{" "}
            {statsVerdict.find((s) => s.verdict === "trop-tot")?.count} trop tôt.
          </>,
          <>
            <strong>Effet d'aubaine récurrent</strong> : un thème transversal aux
            évaluations négatives ou mitigées. CIR grands groupes, MaPrimeRénov,
            TVA restauration, allègements bas salaires au-dessus 1,3 SMIC.
          </>,
          <>
            <strong>La Cour des comptes est l'évaluateur le plus prolifique</strong>{" "}
            et critique. France Stratégie a une approche plus nuancée (effets nets
            mesurés). IPP apporte la rigueur économétrique.
          </>,
          <>
            <strong>Recommandations rarement suivies</strong>. La plupart des
            dispositifs critiqués (TVA restauration depuis 2010, Pacte Dutreil
            depuis 2018, abattement 10 % retraités) sont maintenus malgré les
            évaluations négatives — poids des lobbies et stabilité fiscale.
          </>,
          <>
            <strong>Effets long terme difficiles à mesurer</strong>. Pour les
            politiques récentes (France 2030, réforme retraites 2023, ouverture
            ferroviaire), il faudra attendre 5-10 ans pour des bilans solides.
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
            — rapports thématiques annuels et chambres régionales
          </>,
          <>
            <a
              href="https://www.strategie.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              France Stratégie
            </a>{" "}
            — comités d'évaluation des grandes réformes
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
            — études économétriques rigoureuses
          </>,
          <>
            <a
              href="https://www.cae-eco.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Conseil d'Analyse Économique (CAE)
            </a>
          </>,
          <>
            COR, CPO, DREES, IGAS, IGF — inspections sectorielles et conseils
            spécialisés
          </>,
          <>
            Tous les rapports cités sont publics et linkés dans chaque fiche
            évaluation
          </>,
        ]}
        methode={
          <>
            Pour chaque politique majeure, on retient <strong>l'évaluation la
            plus récente et la plus complète</strong> par une institution
            indépendante. Le « verdict » synthétise le ton global du rapport
            (positif / mitigé / négatif / trop tôt) — c'est une lecture
            éditoriale qu'on assume. Les conclusions et recommandations sont
            extraites directement des résumés exécutifs des rapports. Aucune
            modification du contenu source.
          </>
        }
        limites={
          <>
            Sélection non-exhaustive : on a retenu 15 évaluations majeures parmi
            des centaines disponibles, en privilégiant celles à forte portée
            budgétaire ou symbolique. Le verdict est nécessairement
            simplificateur — pour une analyse fine, toujours consulter le
            rapport complet. Mise à jour annuelle prévue.
          </>
        }
        miseAJour="Évaluations publiées 2021-2024. Prochaine mise à jour : automne 2025."
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
  emoji,
}: {
  label: string;
  value: string;
  hint?: string;
  color: string;
  emoji?: string;
}) {
  return (
    <div className="bg-white/80 border border-violet-200/40 rounded-lg p-3">
      <div
        className="text-[10px] uppercase tracking-widest font-semibold flex items-baseline gap-1.5"
        style={{ color }}
      >
        {emoji && <span>{emoji}</span>}
        {label}
      </div>
      <div
        className="font-display text-xl md:text-2xl font-bold tabular-nums mt-0.5"
        style={{ color }}
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
