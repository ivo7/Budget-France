// ============================================================================
// GlossaryTerm — terme cliquable avec popover contenant la définition
// ============================================================================
//
// Usage :
//   <GlossaryTerm slug="OAT">OAT 10 ans</GlossaryTerm>
//   <GlossaryTerm slug="PIB" />     → affiche le terme depuis le glossaire
//
// Le terme apparaît avec un trait pointillé sous le texte ("indice tooltip").
// Au clic : popover qui affiche la définition + un lien vers la fiche
// pédagogique complète. Cliquer en dehors ferme la popover.
//
// Si le terme n'existe pas dans le glossaire, on rend juste les enfants sans
// décoration ni interactivité — pas de bug, pas de warning.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { findGlossaryEntry, termeSlug } from "./Glossary";

interface Props {
  /** Terme ou abréviation à chercher dans le glossaire (ex: "OAT", "PIB"). */
  slug: string;
  /** Texte affiché. Par défaut, on affiche le terme complet du glossaire. */
  children?: React.ReactNode;
  /** Optionnel : forcer un comportement « inline simple » sans popover. */
  asLink?: boolean;
}

export function GlossaryTerm({ slug, children, asLink = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const found = findGlossaryEntry(slug);

  // Ferme la popover si on clique à l'extérieur
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Pas de définition trouvée → on rend les enfants tels quels
  if (!found) {
    return <>{children ?? slug}</>;
  }

  const display = children ?? found.entry.terme;

  // Mode lien simple (pas de popover, juste un lien direct vers la fiche)
  if (asLink) {
    return (
      <a
        href={`#/glossaire?term=${termeSlug(found.entry.terme)}`}
        className="text-brand hover:underline font-medium"
        title={found.entry.definition}
      >
        {display}
      </a>
    );
  }

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`Définition de ${found.entry.terme}`}
        className="cursor-help underline decoration-brand/40 decoration-dotted decoration-2 underline-offset-4 hover:decoration-brand transition"
      >
        {display}
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-left text-slate-800"
          // Empêche le clic interne de fermer la popover
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] uppercase tracking-widest text-brand mb-1">
            {found.categorie}
          </div>
          <div className="font-display text-sm font-semibold text-slate-900 mb-1.5">
            {found.entry.terme}
            {found.entry.abbr && (
              <span className="ml-2 text-xs text-slate-500 font-mono">
                {found.entry.abbr}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {found.entry.definition}
          </p>
          {found.entry.exemple && (
            <p className="text-[11px] text-slate-500 italic mt-2 leading-relaxed">
              Ex. : {found.entry.exemple}
            </p>
          )}
          <a
            href={`#/glossaire?term=${termeSlug(found.entry.terme)}`}
            className="inline-block mt-3 text-xs text-brand hover:underline font-medium"
            onClick={() => setOpen(false)}
          >
            Voir la fiche complète →
          </a>
        </span>
      )}
    </span>
  );
}

// displayName explicite pour que <Linkify> puisse identifier ce composant
// en build production (Vite/esbuild minifie les noms de fonctions).
GlossaryTerm.displayName = "GlossaryTerm";
