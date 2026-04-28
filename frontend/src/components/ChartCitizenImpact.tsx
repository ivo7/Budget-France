// ============================================================================
// ChartCitizenImpact — encadré pédagogique « concrètement pour toi »
// ============================================================================
//
// Composant réutilisable à insérer SOUS chaque graphe du site. Met en avant
// les conséquences concrètes pour le citoyen.
//
// Usage :
//   <ChartCitizenImpact text="Quand le ratio dette/PIB monte..." />
// ============================================================================

interface Props {
  /** Texte explicatif court (1-3 phrases) sur les conséquences citoyennes. */
  text: React.ReactNode;
}

export function ChartCitizenImpact({ text }: Props) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-brand-soft/40 border border-brand/15">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 leading-none mt-0.5" aria-hidden="true">
          👤
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-brand mb-1 font-semibold">
            Concrètement pour toi
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

ChartCitizenImpact.displayName = "ChartCitizenImpact";
