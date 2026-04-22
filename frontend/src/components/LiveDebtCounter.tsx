import { useEffect, useRef, useState } from "react";
import { formatGrouped } from "../lib/format";

interface Props {
  /** Valeur de départ en euros à t = asOf */
  baseValue: number;
  /** Date ISO à laquelle baseValue a été mesurée */
  asOf: string;
  /** Vitesse d'accroissement en €/s */
  eurPerSecond: number;
}

/**
 * Compteur temps réel de la dette publique.
 * - Part de baseValue à l'instant asOf
 * - Ajoute (now - asOf) * eurPerSecond
 * - Se met à jour toutes les 50 ms
 */
export function LiveDebtCounter({ baseValue, asOf, eurPerSecond }: Props) {
  // Garde-fous : si la date ou la vitesse sont invalides, on fige simplement
  // sur la valeur de base plutôt que d'afficher "NaN".
  const parsed = new Date(asOf).getTime();
  const asOfMs = Number.isFinite(parsed) ? parsed : Date.now();
  const safeBase = Number.isFinite(baseValue) ? baseValue : 0;
  const safeRate = Number.isFinite(eurPerSecond) ? eurPerSecond : 0;

  const [value, setValue] = useState(() =>
    safeBase + Math.max(0, (Date.now() - asOfMs) / 1000) * safeRate,
  );
  const rafRef = useRef<number>();

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const v = safeBase + Math.max(0, (Date.now() - asOfMs) / 1000) * safeRate;
      setValue(v);
      rafRef.current = window.setTimeout(tick, 50) as unknown as number;
    };
    tick();
    return () => {
      mounted = false;
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [safeBase, asOfMs, safeRate]);

  const formatted = formatGrouped(value);

  return (
    <div className="card p-8 md:p-10 relative overflow-hidden">
      {/* Bande tricolore discrète sur le bord gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
        <div className="flex-1 bg-brand" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-flag-red" />
      </div>

      <div className="flex items-center gap-2 text-muted text-sm uppercase tracking-widest">
        <span className="live-dot inline-block w-2 h-2 rounded-full bg-flag-red" />
        Dette publique française — temps réel
      </div>

      <div className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl font-bold tabular-nums text-slate-900 break-words">
        {formatted.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="inline-block w-3" />
          ) : (
            <span key={i} className="ticker-digit">{ch}</span>
          ),
        )}{" "}
        <span className="text-brand">€</span>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <span className="font-semibold text-flag-red">
          +{Math.round(safeRate).toLocaleString("fr-FR")} € par seconde
        </span>
        {" "}·{" "}
        {Math.round(safeRate * 86_400).toLocaleString("fr-FR")} € par jour
        {" "}·{" "}
        {(safeRate * 86_400 * 365 / 1e9).toFixed(1)} Md€ par an
      </div>
      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        <strong>Méthode :</strong> aucun organisme ne publie la dette à la seconde.
        Le compteur part du dernier chiffre officiel Eurostat (publication trimestrielle)
        et y ajoute la vitesse d'endettement (déficit annuel ÷ 31,5 M de secondes).
        C'est une estimation cohérente, pas une mesure temps réel.
      </p>
    </div>
  );
}
