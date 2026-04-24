import { useEffect, useState } from "react";

/**
 * Page affichée après un paiement Stripe réussi.
 * Stripe redirige ici avec ?session_id=cs_xxx.
 *
 * Note : l'activation premium se fait via le webhook Stripe côté backend,
 * pas depuis cette page. Elle sert juste à rassurer l'utilisateur et lui
 * indiquer la suite.
 */
export function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(query);
    setSessionId(params.get("session_id"));
  }, []);

  return (
    <section className="mt-10 max-w-2xl mx-auto">
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-money/10 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Bienvenue dans la version Premium
        </h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Ton essai gratuit de 7 jours démarre maintenant. Tu recevras ton premier
          <strong> bulletin hebdomadaire lundi prochain à 07h45</strong>. D'ici là,
          un email de confirmation va arriver dans ta boîte de réception.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-brand-soft/40 border border-brand/20 text-left">
          <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">
            Prochaines étapes
          </div>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
            <li>Vérifie ta boîte mail pour confirmer ton adresse (si première inscription).</li>
            <li>Personnalise tes préférences de notification depuis « Mon compte ».</li>
            <li>Parcours les archives des bulletins passés.</li>
            <li>À tout moment, gère ton abonnement ou annule sans frais pendant l'essai.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a href="#/" className="inline-flex items-center justify-center bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl px-5 py-3 transition-colors">
            Retour au tableau de bord
          </a>
          <a href="#/compte" className="inline-flex items-center justify-center border border-slate-200 hover:border-brand hover:text-brand text-slate-700 font-semibold rounded-xl px-5 py-3 transition-colors">
            Mon compte
          </a>
        </div>

        {sessionId && (
          <div className="mt-6 text-[11px] text-slate-400 font-mono break-all">
            Référence Stripe : {sessionId}
          </div>
        )}
      </div>
    </section>
  );
}
