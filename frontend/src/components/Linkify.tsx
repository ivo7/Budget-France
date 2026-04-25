// ============================================================================
// Linkify — auto-link des termes du glossaire dans tout texte enfant
// ============================================================================
//
// Objectif : permettre de cliquer sur OAT, PIB, dette publique, etc. n'importe
// où sur le site sans avoir à wrapper manuellement chaque occurrence avec
// <GlossaryTerm>. On scanne les nœuds texte de l'arbre React et on remplace
// les termes du glossaire par des éléments <GlossaryTerm> automatiques.
//
// Usage :
//   <Linkify>
//     <p>Le ratio dette/PIB de la France atteint 115 %, contre 60 % en Allemagne.</p>
//   </Linkify>
//
// Règles :
//   - Skip des éléments interactifs (a, button, input, label) et formattés (code, pre)
//   - Skip des éléments SVG/Recharts (axes, graphiques)
//   - Skip des <GlossaryTerm> déjà présents (évite double-wrapping)
//   - Match insensible à la casse, par mot complet (\b regex)
//   - Termes longs prioritaires : « Banque centrale européenne » match avant « BCE »
// ============================================================================

import React, { useMemo } from "react";
import { GLOSSAIRE } from "./Glossary";
import { GlossaryTerm } from "./GlossaryTerm";

// Tags HTML à ne pas traverser. Les composants React (function/class) sont
// traversés sauf GlossaryTerm (vérifié séparément par nom).
const SKIP_TAGS = new Set([
  // Interactifs / form
  "a", "button", "input", "textarea", "select", "option", "label",
  // Texte préservé
  "code", "pre", "kbd", "samp",
  // Métadonnées / scripts
  "script", "style", "title", "head",
  // SVG / Recharts (évite de pourrir les axes et les charts)
  "svg", "g", "path", "line", "rect", "circle", "ellipse",
  "polyline", "polygon", "text", "tspan", "defs", "clipPath",
  "linearGradient", "stop", "use", "foreignObject",
]);

// Liste des termes à matcher dans l'ordre décroissant de longueur.
// Construite une seule fois au premier rendu via useMemo (par client) /
// au premier accès via le cache module.
let CACHED_TOKEN_LIST: string[] | null = null;
function getTokenList(): string[] {
  if (CACHED_TOKEN_LIST) return CACHED_TOKEN_LIST;
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const cat of GLOSSAIRE) {
    for (const e of cat.entrees) {
      // Ignore les termes courts (1-2 lettres) qui matcheraient trop large
      if (e.terme.length >= 3 && !seen.has(e.terme.toLowerCase())) {
        tokens.push(e.terme);
        seen.add(e.terme.toLowerCase());
      }
      if (e.abbr && e.abbr.length >= 2 && !seen.has(e.abbr.toLowerCase())) {
        tokens.push(e.abbr);
        seen.add(e.abbr.toLowerCase());
      }
    }
  }
  // Tri par longueur décroissante : matche les expressions longues d'abord.
  // Sans ça, « Banque » serait wrappée avant « Banque centrale européenne ».
  tokens.sort((a, b) => b.length - a.length);
  CACHED_TOKEN_LIST = tokens;
  return tokens;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let CACHED_REGEX: RegExp | null = null;
function getRegex(): RegExp {
  if (CACHED_REGEX) return CACHED_REGEX;
  const tokens = getTokenList();
  // \b ne joue pas bien avec les caractères accentués en français. On utilise
  // des lookbehind / lookahead avec une classe de caractères « non-mot étendue »
  // pour matcher correctement « PIB » mais pas « PIBLeck » par exemple.
  // Cross-browser : Safari avant 16.4 ne supporte pas les lookbehind, mais on
  // cible des navigateurs récents.
  const pattern = `(?<![A-Za-zÀ-ÿ0-9])(${tokens.map(escapeRegex).join("|")})(?![A-Za-zÀ-ÿ0-9])`;
  CACHED_REGEX = new RegExp(pattern, "g");
  return CACHED_REGEX;
}

/**
 * Remplace dans une chaîne les occurrences de termes du glossaire par des
 * éléments <GlossaryTerm>. Retourne un tableau de nœuds (chaînes + éléments).
 */
function linkifyString(str: string, keyPrefix: string): React.ReactNode[] {
  if (!str || str.length < 3) return [str];
  const regex = getRegex();
  // Reset l'état global du regex à chaque appel (sinon lastIndex peut traîner)
  regex.lastIndex = 0;
  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(str)) !== null) {
    const matched = m[0];
    const start = m.index;
    if (start > lastIdx) out.push(str.slice(lastIdx, start));
    out.push(
      <GlossaryTerm key={`${keyPrefix}-${start}`} slug={matched}>
        {matched}
      </GlossaryTerm>,
    );
    lastIdx = start + matched.length;
    // Sécurité : éviter les boucles infinies si le pattern matche du vide
    if (m[0].length === 0) regex.lastIndex++;
  }
  if (lastIdx < str.length) out.push(str.slice(lastIdx));
  return out;
}

interface LinkifyProps {
  children: React.ReactNode;
  /** Si true (défaut), traverse récursivement les enfants. */
  deep?: boolean;
}

/**
 * Composant wrapper qui linkifie tous les nœuds texte enfants.
 * Préserve la structure DOM/React, ne touche qu'aux strings.
 */
export function Linkify({ children, deep = true }: LinkifyProps): React.ReactElement {
  // Le useMemo évite de re-walker l'arbre si les enfants n'ont pas changé.
  // La fonction process est définie dans le scope pour pouvoir s'auto-référencer.
  const processed = useMemo(
    () => process(children, "lk", deep),
    [children, deep],
  );
  return <>{processed}</>;
}

function process(
  node: React.ReactNode,
  keyPrefix: string,
  deep: boolean,
): React.ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "string") {
    const out = linkifyString(node, keyPrefix);
    return out.length === 1 ? out[0] : out;
  }
  if (typeof node === "number") {
    // Les nombres seuls (KPIs, dates, montants) ne peuvent pas matcher un terme
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((c, i) => (
      <React.Fragment key={`${keyPrefix}-arr-${i}`}>
        {process(c, `${keyPrefix}-${i}`, deep)}
      </React.Fragment>
    ));
  }
  if (!React.isValidElement(node)) return node;

  const type = node.type;

  // Skip un élément HTML spécifique (tag string)
  if (typeof type === "string" && SKIP_TAGS.has(type)) {
    return node;
  }

  // Skip GlossaryTerm pour éviter le double-wrapping
  if (typeof type === "function") {
    const fnName = (type as { displayName?: string; name?: string }).displayName
      ?? (type as { name?: string }).name;
    if (fnName === "GlossaryTerm" || fnName === "Linkify") {
      return node;
    }
  }

  if (!deep) return node;

  // Recurse dans les enfants
  const props = node.props as { children?: React.ReactNode } | undefined;
  if (!props || !("children" in props) || props.children === undefined) {
    return node;
  }
  const newChildren = process(props.children, keyPrefix, deep);
  return React.cloneElement(node, undefined, newChildren);
}
