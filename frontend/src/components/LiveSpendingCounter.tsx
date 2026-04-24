import { useEffect, useRef, useState } from "react";
import { formatGrouped } from "../lib/format";

interface Props {
  /** Budget annuel total de référence (ex : 580 Md€) */
  annualBudget: number;
  /** Vitesse d'écoulement en €/s (dérivée du budget annuel) */
  eurPerSecond: number;
  /** Année de référence (pour le libellé) */
  annee: number;
}

/**
 * Compteur temps réel des dépenses de l'État.
 * - Part de 0 au 1er janvier minuit
 * - Ajoute (now - 1er janvier) * eurPerSecond
 * - Représente la vitesse d'écoulement LISSÉE du budget annuel
 *
 * Hypothèse pédagogique : dépenses lissées sur l'année. En réalité il y a
 * une saisonnalité (pic décembre, creux août), mais en moyenne c'est cohérent.
 */
export function LiveSpendingCounter({ annualBudget, eurPerSecond, annee }: Props) {
  // Référence = 1er janvier de l'année courante (00h00 heure de Paris)
  const januaryFirst = new Date(Date.UTC(annee, 0, 1)).getTime();
  const safeRate = Number.isFinite(eurPerSecond) ? eurPerSecond : 0;
  const safeBudget = Number.isFinite(annualBudget) ? annualBudget : 0;

  const computeValue = () => {
    const elapsed = Math.max(0, (Date.now() - januaryFirst) / 1000);
    return Math.min(safeBudget, elapsed * safeRate);
  };

  const [value, setValue] = useState(computeValue);
  const rafRef = useRef<number>();

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setValue(computeValue());
      rafRef.current = window.setTimeout(tick, 50) as unknown as number;
    };
    tick();
    return () => {
      mounted = false;
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [januaryFirst, safeRate, safeBudget]);

  const formatted = formatGrouped(value);
  const pctConsume = safeBudget > 0 ? (value / safeBudget) * 100 : 0;

  return (
    <div className="card p-8 md:p-10 relative overflow-hidden">
      {/* Bande verte sur le bord gauche (couleur recettes/dépenses) */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-money" />

      <div className="flex items-center gap-2 text-muted text-sm uppercase tracking-widest">
        <span className="live-dot inline-block w-2 h-2 rounded-full bg-money" />
        Dépenses de l'État {annee} — vitesse d'écoulement
      </div>

      <div className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl font-bold tabular-nums text-slate-900 break-words">
        {formatted.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="inline-block w-3" />
          ) : (
            <span key={i} className="ticker-digit">{ch}</span>
          ),
        )}{" "}
        <span className="text-money">€</span>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <span className="font-semibold text-money">
          {Math.round(safeRate).toLocaleString("fr-FR")} € par seconde
        </span>
        {" "}·{" "}
        {Math.round(safeRate * 86_400).toLocaleString("fr-FR")} € par jour
        {" "}·{" "}
        {(safeRate * 86_400 * 365 / 1e9).toFixed(0)} Md€ par an (LFI {annee})
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Cumul depuis le 1er janvier {annee}</span>
          <span className="font-semibold text-slate-700 tabular-nums">{pctConsume.toFixed(1)} % du budget annuel</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-money rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pctConsume)}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        <strong>Méthode :</strong> budget LFI {annee} annuel ÷ 31,5 M de secondes, lissé uniformément.
        En réalité les dépenses ont une saisonnalité (pic décembre, creux août), mais l'ordre de
        grandeur reste juste sur la moyenne annuelle.
      </p>
    </div>
  );
}
