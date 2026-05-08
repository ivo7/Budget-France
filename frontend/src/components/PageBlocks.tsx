// ============================================================================
// PageBlocks — composants pédagogiques réutilisables
// ============================================================================
//
// 2 blocs standardisés affichés en bas de chaque page Budget France :
//   - <ARetenir>     : 3-5 punchlines clés sur fond noir, après le contenu principal
//   - <Methodologie> : sources, limites, mise à jour — fond clair, transparence
//
// Objectif : homogénéiser l'UX et ancrer la posture pédagogique du site.
// Chaque page passe ses propres données (les composants sont génériques).
// ============================================================================

import type { ReactNode } from "react";

// ----------------------------------------------------------------------------
// <ARetenir>
// ----------------------------------------------------------------------------

interface ARetenirProps {
  /** Liste des points-clés. Chaque item est un ReactNode pour permettre du
   *  formatage (gras, liens, etc.). 3 à 5 items idéalement. */
  items: ReactNode[];
  /** Titre custom, défaut « À retenir ». */
  titre?: string;
}

export function ARetenir({ items, titre = "À retenir" }: ARetenirProps) {
  return (
    <section className="rounded-2xl p-5 md:p-6 bg-slate-900 text-slate-50 border border-slate-800 shadow-card">
      <h2 className="font-display text-xl font-semibold mb-3 text-white">
        {titre}
      </h2>
      <ul className="space-y-2.5 text-sm leading-relaxed text-slate-100">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </section>
  );
}

// ----------------------------------------------------------------------------
// <Methodologie>
// ----------------------------------------------------------------------------

interface MethodologieProps {
  /** Liste des sources principales. ReactNode pour permettre des liens. */
  sources: ReactNode[];
  /** Méthode de calcul / agrégation, optionnel. */
  methode?: ReactNode;
  /** Limites connues, biais, approximations. */
  limites?: ReactNode;
  /** Fréquence de mise à jour. */
  miseAJour?: string;
  /** Titre custom, défaut « Méthodologie & sources ». */
  titre?: string;
}

export function Methodologie({
  sources,
  methode,
  limites,
  miseAJour,
  titre = "Méthodologie & sources",
}: MethodologieProps) {
  return (
    <section className="rounded-2xl p-5 md:p-6 bg-white border border-slate-200 shadow-card">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
        {titre}
      </div>

      {sources.length > 0 && (
        <div className="mt-2">
          <strong className="text-xs text-slate-700">Sources principales :</strong>
          <ul className="mt-1 space-y-1 text-xs text-slate-600 leading-relaxed">
            {sources.map((s, i) => (
              <li key={i} className="ml-3">— {s}</li>
            ))}
          </ul>
        </div>
      )}

      {methode && (
        <div className="mt-3">
          <strong className="text-xs text-slate-700">Méthode :</strong>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{methode}</p>
        </div>
      )}

      {limites && (
        <div className="mt-3">
          <strong className="text-xs text-slate-700">Limites :</strong>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{limites}</p>
        </div>
      )}

      {miseAJour && (
        <div className="mt-3 text-[11px] text-slate-500 italic">
          Mise à jour : {miseAJour}
        </div>
      )}
    </section>
  );
}
